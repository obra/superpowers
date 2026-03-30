use std::collections::BTreeMap;
use std::fs::{self, OpenOptions};
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::cli::plan_execution::{RecordContractArgs, RecordEvaluationArgs, RecordHandoffArgs};
use crate::contracts::harness::{
    EvaluationReport, ExecutionContract, ExecutionHandoff, WorktreeLease, read_evaluation_report,
    read_execution_contract, read_execution_handoff,
};
use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::dependency_index::{
    DEPENDENCY_INDEX_VERSION, DependencyIndex, DependencyIndexHealth, DependencyIndexState,
    DependencyNode, DependencyNodeId, IndexedArtifactKind,
};
use crate::execution::gates::{
    GateAuthorityState, normalize_artifact_repo_path, require_active_contract_state,
    validate_contract_provenance, validate_evaluator_semantics, validate_handoff_provenance,
    validate_handoff_semantics, validate_harness_provenance, validate_report_provenance,
};
use crate::execution::harness::{
    ChunkId, HarnessPhase, INITIAL_AUTHORITATIVE_SEQUENCE, RunIdentitySnapshot,
    WorktreeLeaseBindingSnapshot,
};
use crate::execution::leases::validate_worktree_lease;
use crate::execution::observability::{
    HarnessEventKind, HarnessObservabilityEvent, HarnessTelemetryCounters,
};
use crate::execution::state::{
    ExecutionContext, ExecutionRuntime, GateResult, GateState, load_execution_context,
};
use crate::git::sha256_hex;
use crate::paths::{
    harness_authoritative_artifact_path, harness_authoritative_artifacts_dir, harness_branch_root,
    harness_dependency_index_path, harness_observability_events_path, harness_state_path,
    harness_telemetry_counters_path, normalize_identifier_token, write_atomic as write_atomic_file,
};

pub fn record_contract(
    runtime: &ExecutionRuntime,
    args: &RecordContractArgs,
) -> Result<GateResult, JsonFailure> {
    let context = load_execution_context(runtime, &args.plan)?;
    let mut gate = GateState::default();

    let artifact_rel = normalize_artifact_repo_path(&args.contract, "Contract")?;
    let artifact_abs = context.runtime.repo_root.join(&artifact_rel);
    let contract = match read_execution_contract(&artifact_abs) {
        Ok(contract) => contract,
        Err(error) => {
            gate.fail(
                FailureClass::ContractMismatch,
                "contract_artifact_unreadable",
                error.to_string(),
                "Provide a readable execution contract artifact and retry record-contract.",
            );
            return Ok(gate.finish());
        }
    };
    let source = match fs::read_to_string(&artifact_abs) {
        Ok(source) => source,
        Err(error) => {
            gate.fail(
                FailureClass::ContractMismatch,
                "contract_artifact_unreadable",
                format!(
                    "Could not read execution contract artifact {}: {error}",
                    artifact_abs.display()
                ),
                "Provide a readable execution contract artifact and retry record-contract.",
            );
            return Ok(gate.finish());
        }
    };
    let Some(contract_fingerprint) = verify_declared_fingerprint(
        &source,
        "Contract Fingerprint",
        &contract.contract_fingerprint,
        "contract",
        "contract_fingerprint_mismatch",
        &mut gate,
    ) else {
        return Ok(gate.finish());
    };
    validate_contract_provenance(&context, &contract, &mut gate);
    validate_harness_provenance(
        &contract.generated_by,
        FailureClass::NonHarnessProvenance,
        "contract_non_harness_provenance",
        &mut gate,
    );
    if !gate.allowed {
        return Ok(gate.finish());
    }

    record_authoritative_contract(runtime, contract, source, contract_fingerprint)
}

pub fn record_evaluation(
    runtime: &ExecutionRuntime,
    args: &RecordEvaluationArgs,
) -> Result<GateResult, JsonFailure> {
    let context = load_execution_context(runtime, &args.plan)?;
    let mut gate = GateState::default();

    let artifact_rel = normalize_artifact_repo_path(&args.evaluation, "Evaluation")?;
    let artifact_abs = context.runtime.repo_root.join(&artifact_rel);
    let report = match read_evaluation_report(&artifact_abs) {
        Ok(report) => report,
        Err(error) => {
            gate.fail(
                FailureClass::EvaluationMismatch,
                "evaluation_artifact_unreadable",
                error.to_string(),
                "Provide a readable evaluation artifact and retry record-evaluation.",
            );
            return Ok(gate.finish());
        }
    };
    let source = match fs::read_to_string(&artifact_abs) {
        Ok(source) => source,
        Err(error) => {
            gate.fail(
                FailureClass::EvaluationMismatch,
                "evaluation_artifact_unreadable",
                format!(
                    "Could not read evaluation report artifact {}: {error}",
                    artifact_abs.display()
                ),
                "Provide a readable evaluation report artifact and retry record-evaluation.",
            );
            return Ok(gate.finish());
        }
    };
    let Some(report_fingerprint) = verify_declared_fingerprint(
        &source,
        "Report Fingerprint",
        &report.report_fingerprint,
        "evaluation",
        "evaluation_fingerprint_mismatch",
        &mut gate,
    ) else {
        return Ok(gate.finish());
    };
    validate_report_provenance(&context, &report, &mut gate);
    validate_harness_provenance(
        &report.generated_by,
        FailureClass::NonHarnessProvenance,
        "evaluation_non_harness_provenance",
        &mut gate,
    );
    if !matches!(report.verdict.as_str(), "pass" | "fail" | "blocked") {
        gate.fail(
            FailureClass::EvaluationMismatch,
            "evaluation_verdict_illegal",
            "Evaluation verdict must be pass, fail, or blocked.",
            "Regenerate the evaluation report with a legal verdict.",
        );
    }
    if !matches!(
        report.recommended_action.as_str(),
        "continue" | "repair" | "pivot" | "handoff" | "escalate"
    ) {
        gate.fail(
            FailureClass::EvaluationMismatch,
            "evaluation_recommended_action_illegal",
            "Evaluation recommended_action must be continue, repair, pivot, handoff, or escalate.",
            "Regenerate the evaluation report with a legal recommended_action.",
        );
    }
    if !gate.allowed {
        return Ok(gate.finish());
    }

    record_authoritative_evaluation(runtime, context, report, source, report_fingerprint)
}

pub fn record_handoff(
    runtime: &ExecutionRuntime,
    args: &RecordHandoffArgs,
) -> Result<GateResult, JsonFailure> {
    let context = load_execution_context(runtime, &args.plan)?;
    let mut gate = GateState::default();

    let artifact_rel = normalize_artifact_repo_path(&args.handoff, "Handoff")?;
    let artifact_abs = context.runtime.repo_root.join(&artifact_rel);
    let handoff = match read_execution_handoff(&artifact_abs) {
        Ok(handoff) => handoff,
        Err(error) => {
            gate.fail(
                FailureClass::MissingRequiredHandoff,
                "handoff_artifact_unreadable",
                error.to_string(),
                "Provide a readable execution handoff artifact and retry record-handoff.",
            );
            return Ok(gate.finish());
        }
    };
    let source = match fs::read_to_string(&artifact_abs) {
        Ok(source) => source,
        Err(error) => {
            gate.fail(
                FailureClass::MissingRequiredHandoff,
                "handoff_artifact_unreadable",
                format!(
                    "Could not read execution handoff artifact {}: {error}",
                    artifact_abs.display()
                ),
                "Provide a readable execution handoff artifact and retry record-handoff.",
            );
            return Ok(gate.finish());
        }
    };
    let Some(handoff_fingerprint) = verify_declared_fingerprint(
        &source,
        "Handoff Fingerprint",
        &handoff.handoff_fingerprint,
        "handoff",
        "handoff_fingerprint_mismatch",
        &mut gate,
    ) else {
        return Ok(gate.finish());
    };
    validate_handoff_provenance(&context, &handoff, &mut gate);
    validate_harness_provenance(
        &handoff.generated_by,
        FailureClass::NonHarnessProvenance,
        "handoff_non_harness_provenance",
        &mut gate,
    );
    if !handoff.open_criteria.is_empty() && handoff.open_findings.is_empty() {
        gate.fail(
            FailureClass::MissingRequiredHandoff,
            "handoff_unresolved_criteria_missing_findings",
            "Execution handoff with unresolved criteria must include open findings.",
            "Regenerate the handoff with concrete unresolved findings.",
        );
    }
    if !gate.allowed {
        return Ok(gate.finish());
    }

    record_authoritative_handoff(runtime, context, handoff, source, handoff_fingerprint)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
struct MutableHarnessState {
    #[serde(default)]
    schema_version: u64,
    #[serde(default)]
    harness_phase: Option<String>,
    #[serde(default)]
    latest_authoritative_sequence: Option<u64>,
    #[serde(default)]
    authoritative_sequence: Option<u64>,
    #[serde(default)]
    run_identity: Option<RunIdentitySnapshot>,
    #[serde(default)]
    chunk_id: Option<String>,
    #[serde(default)]
    active_contract_path: Option<String>,
    #[serde(default)]
    active_contract_fingerprint: Option<String>,
    #[serde(default)]
    active_worktree_lease_fingerprints: Option<Vec<String>>,
    #[serde(default)]
    active_worktree_lease_bindings: Option<Vec<WorktreeLeaseBindingSnapshot>>,
    #[serde(default)]
    required_evaluator_kinds: Vec<String>,
    #[serde(default)]
    completed_evaluator_kinds: Vec<String>,
    #[serde(default)]
    pending_evaluator_kinds: Vec<String>,
    #[serde(default)]
    non_passing_evaluator_kinds: Vec<String>,
    #[serde(default)]
    failed_evaluator_kinds: Vec<String>,
    #[serde(default)]
    blocked_evaluator_kinds: Vec<String>,
    #[serde(default)]
    aggregate_evaluation_state: Option<String>,
    #[serde(default)]
    last_evaluation_report_path: Option<String>,
    #[serde(default)]
    last_evaluation_report_fingerprint: Option<String>,
    #[serde(default)]
    last_evaluation_evaluator_kind: Option<String>,
    #[serde(default)]
    last_evaluation_verdict: Option<String>,
    #[serde(default)]
    current_chunk_retry_count: u32,
    #[serde(default)]
    current_chunk_retry_budget: u32,
    #[serde(default)]
    current_chunk_pivot_threshold: u32,
    #[serde(default)]
    handoff_required: bool,
    #[serde(default)]
    open_failed_criteria: Vec<String>,
    #[serde(default)]
    strategy_state: Option<String>,
    #[serde(default)]
    last_strategy_checkpoint_fingerprint: Option<String>,
    #[serde(default)]
    strategy_checkpoint_kind: Option<String>,
    #[serde(default)]
    strategy_reset_required: bool,
    #[serde(flatten)]
    extra: BTreeMap<String, Value>,
}

pub fn ensure_preflight_authoritative_bootstrap(
    runtime: &ExecutionRuntime,
    run_identity: RunIdentitySnapshot,
    chunk_id: ChunkId,
) -> Result<(), JsonFailure> {
    validate_safe_identifier_token(run_identity.execution_run_id.as_str(), "execution_run_id")?;
    validate_safe_identifier_token(chunk_id.as_str(), "chunk_id")?;

    let _lock = match WriteAuthorityLock::acquire(runtime) {
        Ok(lock) => lock,
        Err(AuthorityLockAcquireError::Conflict) => {
            return Err(JsonFailure::new(
                FailureClass::ConcurrentWriterConflict,
                "Another runtime writer currently holds authoritative mutation authority.",
            ));
        }
        Err(AuthorityLockAcquireError::Io(message)) => {
            return Err(JsonFailure::new(
                FailureClass::PartialAuthoritativeMutation,
                message,
            ));
        }
    };

    let state_path =
        harness_state_path(&runtime.state_dir, &runtime.repo_slug, &runtime.branch_name);
    let mut state = match load_mutable_harness_state(&state_path) {
        Ok(state) => state,
        Err(MutableStateLoadError::MissingState) => MutableHarnessState::default(),
        Err(MutableStateLoadError::Unreadable(message))
        | Err(MutableStateLoadError::Malformed(message)) => {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                message,
            ));
        }
    };
    state.normalize_defaults();
    if matches!(
        state.harness_phase.as_deref(),
        None | Some("implementation_handoff")
    ) {
        state.harness_phase = Some(String::from("execution_preflight"));
    }
    state.run_identity = Some(run_identity);
    state.chunk_id = Some(chunk_id.as_str().to_owned());
    if state.active_worktree_lease_fingerprints.is_none() {
        state.active_worktree_lease_fingerprints = Some(Vec::new());
    }
    if state.active_worktree_lease_bindings.is_none() {
        state.active_worktree_lease_bindings = Some(Vec::new());
    }
    if dependency_index_truth_needs_bootstrap(&state) {
        state.extra.insert(
            String::from("dependency_index_state"),
            Value::String(String::from("fresh")),
        );
    }

    let serialized = serde_json::to_string_pretty(&state).map_err(|error| {
        JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!(
                "Could not serialize authoritative harness state bootstrap {}: {error}",
                state_path.display()
            ),
        )
    })?;
    write_atomic_file(&state_path, serialized).map_err(|error| {
        JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!(
                "Could not publish authoritative harness state bootstrap {}: {error}",
                state_path.display()
            ),
        )
    })?;

    ensure_dependency_index_artifact_exists(runtime)
}

impl MutableHarnessState {
    fn latest_sequence(&self) -> u64 {
        self.latest_authoritative_sequence
            .or(self.authoritative_sequence)
            .unwrap_or(INITIAL_AUTHORITATIVE_SEQUENCE)
    }

    fn set_latest_sequence(&mut self, value: u64) {
        self.latest_authoritative_sequence = Some(value);
        self.authoritative_sequence = Some(value);
    }

    fn normalize_defaults(&mut self) {
        if self.schema_version == 0 {
            self.schema_version = 1;
        }
        if self.harness_phase.is_none() {
            self.harness_phase = Some(String::from("implementation_handoff"));
        }
        if self.aggregate_evaluation_state.is_none() {
            self.aggregate_evaluation_state = Some(String::from("pending"));
        }
        if self.strategy_state.is_none() {
            self.strategy_state = Some(String::from("checkpoint_missing"));
        }
        if self.strategy_checkpoint_kind.is_none() {
            self.strategy_checkpoint_kind = Some(String::from("none"));
        }
    }
}

fn record_authoritative_contract(
    runtime: &ExecutionRuntime,
    contract: ExecutionContract,
    source: String,
    contract_fingerprint: String,
) -> Result<GateResult, JsonFailure> {
    let contract_sequence = contract.authoritative_sequence;
    let contract_verifiers = contract.verifiers;
    let retry_budget = contract.retry_budget;
    let pivot_threshold = contract.pivot_threshold;
    let artifact_file_name = format!("contract-{contract_fingerprint}.md");
    let artifact_file_name_for_state = artifact_file_name.clone();
    let contract_fingerprint_for_state = contract_fingerprint.clone();
    record_authoritative_mutation(
        runtime,
        source,
        &artifact_file_name,
        contract_sequence,
        ObservabilityRecordContext {
            command_name: "record-contract",
            active_contract_fingerprint: Some(contract_fingerprint),
        },
        revalidate_contract_locked_state,
        move |state| {
            state.harness_phase = Some(String::from("contract_approved"));
            state.active_contract_path = Some(artifact_file_name_for_state.clone());
            state.active_contract_fingerprint = Some(contract_fingerprint_for_state.clone());
            state.required_evaluator_kinds = contract_verifiers.clone();
            state.completed_evaluator_kinds.clear();
            state.pending_evaluator_kinds = state.required_evaluator_kinds.clone();
            state.non_passing_evaluator_kinds.clear();
            state.failed_evaluator_kinds.clear();
            state.blocked_evaluator_kinds.clear();
            state.aggregate_evaluation_state = Some(String::from("pending"));
            state.last_evaluation_report_path = None;
            state.last_evaluation_report_fingerprint = None;
            state.last_evaluation_evaluator_kind = None;
            state.last_evaluation_verdict = None;
            state.current_chunk_retry_count = 0;
            state.current_chunk_retry_budget = retry_budget;
            state.current_chunk_pivot_threshold = pivot_threshold;
            state.handoff_required = false;
            state.open_failed_criteria.clear();
        },
    )
}

fn record_authoritative_evaluation(
    runtime: &ExecutionRuntime,
    context: ExecutionContext,
    report: EvaluationReport,
    source: String,
    report_fingerprint: String,
) -> Result<GateResult, JsonFailure> {
    let artifact_file_name = format!("evaluation-{report_fingerprint}.md");
    let evaluator_kind = report.evaluator_kind.clone();
    let verdict = report.verdict.clone();
    let report_sequence = report.authoritative_sequence;
    let failing_criteria = report
        .criterion_results
        .iter()
        .filter(|result| result.status != "pass")
        .map(|result| result.criterion_id.clone())
        .collect::<Vec<_>>();
    let reported_criteria = report
        .criterion_results
        .iter()
        .map(|result| result.criterion_id.clone())
        .collect::<Vec<_>>();
    let artifact_file_name_for_state = artifact_file_name.clone();
    let report_fingerprint_for_state = report_fingerprint.clone();
    let evaluator_kind_for_state = evaluator_kind.clone();
    let verdict_for_state = verdict.clone();
    let report_for_revalidation = report;
    let context_for_revalidation = context;
    record_authoritative_mutation(
        runtime,
        source,
        &artifact_file_name,
        report_sequence,
        ObservabilityRecordContext {
            command_name: "record-evaluation",
            active_contract_fingerprint: None,
        },
        move |state, gate| {
            revalidate_evaluation_locked_state(
                &context_for_revalidation,
                state,
                &report_for_revalidation,
                gate,
            )
        },
        move |state| {
            bootstrap_verdict_buckets_from_legacy_state(runtime, state);
            remove_value(
                &mut state.pending_evaluator_kinds,
                &evaluator_kind_for_state,
            );
            push_unique(
                &mut state.completed_evaluator_kinds,
                &evaluator_kind_for_state,
            );
            remove_value(&mut state.failed_evaluator_kinds, &evaluator_kind_for_state);
            remove_value(
                &mut state.blocked_evaluator_kinds,
                &evaluator_kind_for_state,
            );

            // Each evaluator report supersedes the evaluator's prior criterion statuses.
            for criterion_id in &reported_criteria {
                remove_value(&mut state.open_failed_criteria, criterion_id);
            }

            state.last_evaluation_report_path = Some(artifact_file_name_for_state.clone());
            state.last_evaluation_report_fingerprint = Some(report_fingerprint_for_state.clone());
            state.last_evaluation_evaluator_kind = Some(evaluator_kind_for_state.clone());
            state.last_evaluation_verdict = Some(verdict_for_state.clone());

            match verdict_for_state.as_str() {
                "pass" => {
                    recompute_authoritative_evaluator_state(state);
                }
                "fail" => {
                    push_unique(&mut state.failed_evaluator_kinds, &evaluator_kind_for_state);
                    if state.latest_sequence() < report_sequence {
                        state.current_chunk_retry_count =
                            state.current_chunk_retry_count.saturating_add(1);
                    }
                    for criterion_id in &failing_criteria {
                        push_unique(&mut state.open_failed_criteria, criterion_id);
                    }
                    recompute_authoritative_evaluator_state(state);
                }
                "blocked" => {
                    push_unique(
                        &mut state.blocked_evaluator_kinds,
                        &evaluator_kind_for_state,
                    );
                    for criterion_id in &failing_criteria {
                        push_unique(&mut state.open_failed_criteria, criterion_id);
                    }
                    recompute_authoritative_evaluator_state(state);
                }
                _ => {}
            }
        },
    )
}

fn record_authoritative_handoff(
    runtime: &ExecutionRuntime,
    context: ExecutionContext,
    handoff: ExecutionHandoff,
    source: String,
    handoff_fingerprint: String,
) -> Result<GateResult, JsonFailure> {
    let artifact_file_name = format!("handoff-{handoff_fingerprint}.md");
    let open_criteria = handoff.open_criteria.clone();
    let handoff_for_revalidation = handoff;
    let context_for_revalidation = context;
    record_authoritative_mutation(
        runtime,
        source,
        &artifact_file_name,
        handoff_for_revalidation.authoritative_sequence,
        ObservabilityRecordContext {
            command_name: "record-handoff",
            active_contract_fingerprint: None,
        },
        move |state, gate| {
            revalidate_handoff_locked_state(
                &context_for_revalidation,
                state,
                &handoff_for_revalidation,
                gate,
            )
        },
        move |state| {
            state.harness_phase = Some(String::from("executing"));
            state.handoff_required = false;
            state.open_failed_criteria = open_criteria.clone();
        },
    )
}

fn revalidate_contract_locked_state(state: &MutableHarnessState, gate: &mut GateState) {
    if !matches!(
        state.harness_phase.as_deref(),
        Some("contract_pending_approval")
    ) {
        gate.fail(
            FailureClass::IllegalHarnessPhase,
            "contract_illegal_phase",
            "Execution contract approval and recording are only legal while the authoritative harness phase is contract_pending_approval.",
            "Advance the harness to contract_pending_approval (after execution_preflight acceptance) before running gate-contract or record-contract.",
        );
    }
}

fn revalidate_evaluation_locked_state(
    context: &ExecutionContext,
    state: &MutableHarnessState,
    report: &EvaluationReport,
    gate: &mut GateState,
) {
    if !matches!(
        state.harness_phase.as_deref(),
        Some("executing" | "evaluating" | "repairing")
    ) {
        gate.fail(
            FailureClass::IllegalHarnessPhase,
            "evaluation_illegal_phase",
            "Evaluation artifacts are only legal while the harness phase is executing, evaluating, or repairing.",
            "Advance the harness into an evaluation-ready phase before running gate-evaluator.",
        );
    }

    let gate_state = gate_authority_state_from_locked(state);
    let Some(active_contract) = require_active_contract_state(context, &gate_state, gate) else {
        return;
    };
    if report.source_contract_fingerprint != active_contract.fingerprint {
        gate.fail(
            FailureClass::DependencyIndexMismatch,
            "evaluation_contract_fingerprint_mismatch",
            "Evaluation report depends on a contract fingerprint that is not the active authoritative contract.",
            "Regenerate the evaluation report from the currently active authoritative contract.",
        );
    }

    if !state
        .required_evaluator_kinds
        .iter()
        .any(|kind| kind == &report.evaluator_kind)
    {
        gate.fail(
            FailureClass::EvaluationMismatch,
            "evaluator_kind_not_required",
            "Evaluation report evaluator_kind is not required by the active authoritative harness contract state.",
            "Run only evaluators listed in required_evaluator_kinds for the active contract.",
        );
    }
    if report.authoritative_sequence < state.latest_sequence() {
        return;
    }
    validate_evaluator_semantics(context, report, &active_contract.contract, gate);
}

fn revalidate_handoff_locked_state(
    context: &ExecutionContext,
    state: &MutableHarnessState,
    handoff: &ExecutionHandoff,
    gate: &mut GateState,
) {
    if !matches!(state.harness_phase.as_deref(), Some("handoff_required")) {
        gate.fail(
            FailureClass::IllegalHarnessPhase,
            "handoff_illegal_phase",
            "Execution handoff artifacts are only legal while the authoritative harness phase is handoff_required.",
            "Advance the harness to handoff_required before running gate-handoff.",
        );
    }

    if !state.handoff_required {
        gate.fail(
            FailureClass::MissingRequiredHandoff,
            "handoff_not_required",
            "Authoritative harness state does not currently require a handoff artifact.",
            "Require handoff in authoritative state before publishing an execution handoff.",
        );
    }

    let gate_state = gate_authority_state_from_locked(state);
    let Some(active_contract) = require_active_contract_state(context, &gate_state, gate) else {
        return;
    };
    if handoff.source_contract_fingerprint != active_contract.fingerprint {
        gate.fail(
            FailureClass::DependencyIndexMismatch,
            "handoff_contract_fingerprint_mismatch",
            "Execution handoff depends on a contract fingerprint that is not the active authoritative contract.",
            "Regenerate the handoff artifact from the active authoritative contract.",
        );
    }
    if handoff.authoritative_sequence < state.latest_sequence() {
        return;
    }
    validate_handoff_semantics(
        handoff,
        &active_contract.contract,
        &state.open_failed_criteria,
        gate,
    );
}

fn gate_authority_state_from_locked(state: &MutableHarnessState) -> GateAuthorityState {
    GateAuthorityState {
        harness_phase: state.harness_phase.clone(),
        latest_authoritative_sequence: state.latest_authoritative_sequence,
        authoritative_sequence: state.authoritative_sequence,
        active_contract_path: state.active_contract_path.clone(),
        active_contract_fingerprint: state.active_contract_fingerprint.clone(),
        required_evaluator_kinds: state.required_evaluator_kinds.clone(),
        handoff_required: state.handoff_required,
        open_failed_criteria: state.open_failed_criteria.clone(),
    }
}

fn record_authoritative_mutation<FRevalidate, FApply>(
    runtime: &ExecutionRuntime,
    source: String,
    artifact_file_name: &str,
    authoritative_sequence: u64,
    observability: ObservabilityRecordContext,
    revalidate_locked_state: FRevalidate,
    apply_transition: FApply,
) -> Result<GateResult, JsonFailure>
where
    FRevalidate: Fn(&MutableHarnessState, &mut GateState),
    FApply: Fn(&mut MutableHarnessState),
{
    let mut gate = GateState::default();
    let _lock = match WriteAuthorityLock::acquire(runtime) {
        Ok(lock) => lock,
        Err(AuthorityLockAcquireError::Conflict) => {
            gate.fail(
                FailureClass::ConcurrentWriterConflict,
                "concurrent_writer_conflict",
                "Another runtime writer currently holds authoritative mutation authority.",
                "Retry once the active writer releases authority.",
            );
            return Ok(gate.finish());
        }
        Err(AuthorityLockAcquireError::Io(message)) => {
            gate.fail(
                FailureClass::PartialAuthoritativeMutation,
                "write_authority_unavailable",
                message,
                "Restore write-authority lock access and retry the authoritative record command.",
            );
            return Ok(gate.finish());
        }
    };

    let state_path =
        harness_state_path(&runtime.state_dir, &runtime.repo_slug, &runtime.branch_name);
    let mut state = match load_mutable_harness_state(&state_path) {
        Ok(state) => state,
        Err(MutableStateLoadError::MissingState) => {
            gate.fail(
                FailureClass::NonAuthoritativeArtifact,
                "active_contract_missing",
                format!(
                    "No authoritative harness state was found at {}.",
                    state_path.display()
                ),
                "Publish authoritative harness state before contract, evaluator, or handoff gate commands.",
            );
            return Ok(gate.finish());
        }
        Err(MutableStateLoadError::Unreadable(message)) => {
            gate.fail(
                FailureClass::NonAuthoritativeArtifact,
                "active_contract_missing",
                message,
                "Restore authoritative harness state readability and retry the gate command.",
            );
            return Ok(gate.finish());
        }
        Err(MutableStateLoadError::Malformed(message)) => {
            gate.fail(
                FailureClass::NonAuthoritativeArtifact,
                "active_contract_missing",
                message,
                "Repair the authoritative harness state and republish valid authoritative execution state before gating artifacts.",
            );
            return Ok(gate.finish());
        }
    };
    state.normalize_defaults();
    revalidate_locked_state(&state, &mut gate);
    if !gate.allowed {
        return Ok(gate.finish());
    }

    let latest_sequence = state.latest_sequence();
    if authoritative_sequence < latest_sequence {
        gate.fail(
            FailureClass::AuthoritativeOrderingMismatch,
            "authoritative_sequence_stale",
            format!(
                "Candidate authoritative sequence {authoritative_sequence} is older than latest authoritative sequence {latest_sequence}."
            ),
            "Regenerate the artifact with a fresh authoritative sequence before recording.",
        );
        return Ok(gate.finish());
    }

    let target_path = harness_authoritative_artifact_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
        artifact_file_name,
    );
    let mut artifact_written_this_call = false;
    let target_exists = match fs::read_to_string(&target_path) {
        Ok(existing) if existing == source => true,
        Ok(_) => {
            gate.fail(
                FailureClass::IdempotencyConflict,
                "idempotency_conflict",
                "Authoritative artifact replay conflicts with an existing recorded artifact.",
                "Regenerate the artifact or record a new authoritative sequence.",
            );
            return Ok(gate.finish());
        }
        Err(error) if error.kind() == ErrorKind::NotFound => false,
        Err(error) => {
            gate.fail(
                FailureClass::PartialAuthoritativeMutation,
                "authoritative_target_unreadable",
                format!(
                    "Could not read prior authoritative artifact {}: {error}",
                    target_path.display()
                ),
                "Restore authoritative artifact directory readability and retry.",
            );
            return Ok(gate.finish());
        }
    };

    if authoritative_sequence == latest_sequence {
        let mut expected_replay_state = state.clone();
        apply_transition(&mut expected_replay_state);
        if state == expected_replay_state {
            if !target_exists && let Err(error) = write_atomic_file(&target_path, &source) {
                gate.fail(
                    FailureClass::PartialAuthoritativeMutation,
                    "authoritative_publish_failed",
                    format!(
                        "Could not publish authoritative artifact {}: {error}",
                        target_path.display()
                    ),
                    "Restore authoritative artifact write access and retry.",
                );
            }
            if gate.allowed
                && let Err(error) = persist_dependency_index_after_authoritative_record(
                    runtime,
                    artifact_file_name,
                    authoritative_sequence,
                )
            {
                gate.fail(
                    FailureClass::PartialAuthoritativeMutation,
                    "dependency_index_publish_failed",
                    error,
                    "Restore dependency-index write access and retry.",
                );
            }
            return Ok(gate.finish());
        }
        gate.fail(
            FailureClass::AuthoritativeOrderingMismatch,
            "authoritative_sequence_replay_mismatch",
            "Authoritative replay sequence matches the latest sequence but the authoritative state transition does not match the replay artifact.",
            "Regenerate a new higher authoritative sequence for this artifact mutation.",
        );
        return Ok(gate.finish());
    }

    if !target_exists {
        if let Err(error) = write_atomic_file(&target_path, &source) {
            gate.fail(
                FailureClass::PartialAuthoritativeMutation,
                "authoritative_publish_failed",
                format!(
                    "Could not publish authoritative artifact {}: {error}",
                    target_path.display()
                ),
                "Restore authoritative artifact write access and retry.",
            );
            return Ok(gate.finish());
        }
        artifact_written_this_call = true;
    }

    apply_transition(&mut state);
    state.set_latest_sequence(authoritative_sequence);
    set_dependency_index_state_healthy(&mut state);
    if let Err(error) = persist_dependency_index_after_authoritative_record(
        runtime,
        artifact_file_name,
        authoritative_sequence,
    ) {
        if artifact_written_this_call {
            let _ = fs::remove_file(&target_path);
        }
        gate.fail(
            FailureClass::PartialAuthoritativeMutation,
            "dependency_index_publish_failed",
            error,
            "Restore dependency-index write access and retry.",
        );
        return Ok(gate.finish());
    }
    if let Err(error) = persist_observability_after_authoritative_record(
        runtime,
        &state,
        authoritative_sequence,
        &observability,
    ) {
        if artifact_written_this_call {
            let _ = fs::remove_file(&target_path);
        }
        gate.fail(
            FailureClass::PartialAuthoritativeMutation,
            "observability_publish_failed",
            error,
            "Restore observability sink write access and retry.",
        );
        return Ok(gate.finish());
    }

    let serialized = match serde_json::to_string_pretty(&state) {
        Ok(serialized) => serialized,
        Err(error) => {
            gate.fail(
                FailureClass::PartialAuthoritativeMutation,
                "authoritative_state_serialize_failed",
                format!("Could not serialize authoritative harness state mutation: {error}"),
                "Repair authoritative harness state serialization and retry the record command.",
            );
            return Ok(gate.finish());
        }
    };
    if let Err(error) = write_atomic_file(&state_path, serialized) {
        if artifact_written_this_call {
            let _ = fs::remove_file(&target_path);
        }
        gate.fail(
            FailureClass::PartialAuthoritativeMutation,
            "authoritative_state_publish_failed",
            format!(
                "Could not publish authoritative harness state {}: {error}",
                state_path.display()
            ),
            "Restore authoritative state write access and retry.",
        );
    }
    Ok(gate.finish())
}

pub fn write_authoritative_worktree_lease_artifact(
    runtime: &ExecutionRuntime,
    lease: &WorktreeLease,
) -> Result<PathBuf, JsonFailure> {
    let (_lock, state, _state_path) = load_mutable_harness_state_for_authoritative_write(runtime)?;
    validate_worktree_lease(lease)?;
    validate_safe_identifier_token(&lease.execution_run_id, "execution_run_id")?;
    validate_safe_identifier_token(&lease.execution_context_key, "execution_context_key")?;
    validate_safe_identifier_token(&lease.execution_unit_id, "execution_unit_id")?;
    if let Some(run_identity) = state.run_identity.as_ref()
        && run_identity.execution_run_id.as_str() != lease.execution_run_id
    {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            "Authoritative worktree lease execution_run_id does not match active run identity.",
        ));
    }
    if lease.authoritative_sequence < state.latest_sequence() {
        return Err(JsonFailure::new(
            FailureClass::AuthoritativeOrderingMismatch,
            format!(
                "Authoritative worktree lease sequence {} is older than latest authoritative sequence {}.",
                lease.authoritative_sequence,
                state.latest_sequence()
            ),
        ));
    }
    let source = serde_json::to_string_pretty(lease).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!("Could not serialize authoritative worktree lease: {error}"),
        )
    })?;
    let Some(canonical_fingerprint) = canonical_worktree_lease_fingerprint(&source) else {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Could not derive canonical authoritative worktree lease fingerprint.",
        ));
    };
    if canonical_fingerprint != lease.lease_fingerprint {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            "Authoritative worktree lease fingerprint does not match canonical content.",
        ));
    }

    let file_name = format!(
        "worktree-lease-{}-{}-{}.json",
        runtime.safe_branch, lease.execution_run_id, lease.execution_context_key
    );
    let artifact_path = harness_authoritative_artifact_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
        &file_name,
    );
    write_atomic_file(&artifact_path, source).map_err(|error| {
        JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!(
                "Could not publish authoritative worktree lease {}: {error}",
                artifact_path.display()
            ),
        )
    })?;
    Ok(artifact_path)
}

pub fn write_authoritative_unit_review_receipt_artifact(
    runtime: &ExecutionRuntime,
    execution_run_id: &str,
    execution_unit_id: &str,
    source: &str,
) -> Result<PathBuf, JsonFailure> {
    let (_lock, state, _state_path) = load_mutable_harness_state_for_authoritative_write(runtime)?;
    validate_safe_identifier_token(execution_run_id, "execution_run_id")?;
    validate_safe_identifier_token(
        execution_unit_id.trim_start_matches("unit-"),
        "execution_unit_id",
    )?;
    if let Some(run_identity) = state.run_identity.as_ref()
        && run_identity.execution_run_id.as_str() != execution_run_id
    {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            "Authoritative unit-review receipt execution_run_id does not match active run identity.",
        ));
    }
    let expected_strategy_checkpoint_fingerprint = state
        .last_strategy_checkpoint_fingerprint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());
    validate_receipt_identity_headers(
        source,
        execution_run_id,
        execution_unit_id,
        expected_strategy_checkpoint_fingerprint,
    )?;
    let Some(canonical_fingerprint) = canonical_unit_review_receipt_fingerprint(source) else {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Could not derive canonical authoritative unit-review receipt fingerprint.",
        ));
    };
    if unit_review_receipt_declared_fingerprint(source).as_deref() != Some(&canonical_fingerprint) {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            "Authoritative unit-review receipt fingerprint does not match canonical content.",
        ));
    }

    let receipt_file_name = format!(
        "unit-review-{}-{}.md",
        execution_run_id,
        execution_unit_id.trim_start_matches("unit-")
    );
    let artifact_path = harness_authoritative_artifact_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
        &receipt_file_name,
    );
    write_atomic_file(&artifact_path, source).map_err(|error| {
        JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!(
                "Could not publish authoritative unit-review receipt {}: {error}",
                artifact_path.display()
            ),
        )
    })?;
    Ok(artifact_path)
}

pub fn persist_active_worktree_lease_index(
    runtime: &ExecutionRuntime,
    run_identity: RunIdentitySnapshot,
    chunk_id: ChunkId,
    active_worktree_lease_fingerprints: Vec<String>,
    active_worktree_lease_bindings: Vec<WorktreeLeaseBindingSnapshot>,
) -> Result<(), JsonFailure> {
    let (_lock, mut state, state_path) =
        load_mutable_harness_state_for_authoritative_write(runtime)?;
    validate_safe_identifier_token(run_identity.execution_run_id.as_str(), "execution_run_id")?;
    validate_safe_identifier_token(chunk_id.as_str(), "chunk_id")?;
    for binding in &active_worktree_lease_bindings {
        if binding.execution_run_id != run_identity.execution_run_id.as_str() {
            return Err(JsonFailure::new(
                FailureClass::ArtifactIntegrityMismatch,
                "Authoritative worktree lease binding execution_run_id does not match active run identity.",
            ));
        }
        validate_safe_identifier_token(&binding.lease_fingerprint, "lease_fingerprint")?;
        validate_artifact_file_name(&binding.lease_artifact_path, "lease_artifact_path")?;
        if let Some(review_receipt_artifact_path) = binding.review_receipt_artifact_path.as_deref()
        {
            validate_artifact_file_name(
                review_receipt_artifact_path,
                "review_receipt_artifact_path",
            )?;
        }
    }
    state.run_identity = Some(run_identity);
    state.chunk_id = Some(chunk_id.as_str().to_owned());
    state.active_worktree_lease_fingerprints = Some(active_worktree_lease_fingerprints);
    state.active_worktree_lease_bindings = Some(active_worktree_lease_bindings);

    let serialized = serde_json::to_string_pretty(&state).map_err(|error| {
        JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!(
                "Could not serialize authoritative harness state mutation {}: {error}",
                state_path.display()
            ),
        )
    })?;
    write_atomic_file(&state_path, serialized).map_err(|error| {
        JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!(
                "Could not publish authoritative harness state {}: {error}",
                state_path.display()
            ),
        )
    })
}

fn load_mutable_harness_state_for_authoritative_write(
    runtime: &ExecutionRuntime,
) -> Result<(WriteAuthorityLock, MutableHarnessState, PathBuf), JsonFailure> {
    let lock = match WriteAuthorityLock::acquire(runtime) {
        Ok(lock) => lock,
        Err(AuthorityLockAcquireError::Conflict) => {
            return Err(JsonFailure::new(
                FailureClass::ConcurrentWriterConflict,
                "Another runtime writer currently holds authoritative mutation authority.",
            ));
        }
        Err(AuthorityLockAcquireError::Io(message)) => {
            return Err(JsonFailure::new(
                FailureClass::PartialAuthoritativeMutation,
                message,
            ));
        }
    };

    let state_path =
        harness_state_path(&runtime.state_dir, &runtime.repo_slug, &runtime.branch_name);
    let mut state = match load_mutable_harness_state(&state_path) {
        Ok(state) => state,
        Err(MutableStateLoadError::MissingState) => {
            return Err(JsonFailure::new(
                FailureClass::NonAuthoritativeArtifact,
                format!(
                    "No authoritative harness state was found at {}.",
                    state_path.display()
                ),
            ));
        }
        Err(MutableStateLoadError::Unreadable(message))
        | Err(MutableStateLoadError::Malformed(message)) => {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                message,
            ));
        }
    };
    state.normalize_defaults();
    Ok((lock, state, state_path))
}

fn validate_safe_identifier_token(value: &str, field_name: &str) -> Result<(), JsonFailure> {
    let normalized = normalize_identifier_token(value);
    if normalized.is_empty() || normalized != value {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!("Authoritative {field_name} must be a safe identifier token."),
        ));
    }
    Ok(())
}

fn validate_artifact_file_name(value: &str, field_name: &str) -> Result<(), JsonFailure> {
    if value.trim().is_empty()
        || value.contains('/')
        || value.contains('\\')
        || Path::new(value).file_name().and_then(|name| name.to_str()) != Some(value)
    {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!("Authoritative {field_name} must stay within authoritative-artifacts."),
        ));
    }
    Ok(())
}

fn validate_receipt_identity_headers(
    source: &str,
    execution_run_id: &str,
    execution_unit_id: &str,
    expected_strategy_checkpoint_fingerprint: Option<&str>,
) -> Result<(), JsonFailure> {
    let Some(receipt_execution_run_id) = parse_markdown_header_value(source, "Execution Run ID")
    else {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Authoritative unit-review receipt is missing Execution Run ID.",
        ));
    };
    if receipt_execution_run_id != execution_run_id {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            "Authoritative unit-review receipt Execution Run ID does not match the requested run.",
        ));
    }

    let Some(receipt_execution_unit_id) = parse_markdown_header_value(source, "Execution Unit ID")
    else {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Authoritative unit-review receipt is missing Execution Unit ID.",
        ));
    };
    if receipt_execution_unit_id != execution_unit_id {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            "Authoritative unit-review receipt Execution Unit ID does not match the requested unit.",
        ));
    }
    if let Some(expected_strategy_checkpoint_fingerprint) = expected_strategy_checkpoint_fingerprint
    {
        let Some(strategy_checkpoint_fingerprint) =
            parse_markdown_header_value(source, "Strategy Checkpoint Fingerprint")
        else {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Authoritative unit-review receipt is missing Strategy Checkpoint Fingerprint.",
            ));
        };
        if strategy_checkpoint_fingerprint != expected_strategy_checkpoint_fingerprint {
            return Err(JsonFailure::new(
                FailureClass::ArtifactIntegrityMismatch,
                "Authoritative unit-review receipt Strategy Checkpoint Fingerprint does not match the active runtime strategy checkpoint.",
            ));
        }
    }
    Ok(())
}

fn parse_markdown_header_value(source: &str, header: &str) -> Option<String> {
    let prefix = format!("**{header}:**");
    source
        .lines()
        .find_map(|line| line.trim().strip_prefix(&prefix))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn set_dependency_index_state_healthy(state: &mut MutableHarnessState) {
    state.extra.insert(
        String::from("dependency_index_state"),
        Value::String(String::from("healthy")),
    );
}

fn dependency_index_truth_needs_bootstrap(state: &MutableHarnessState) -> bool {
    state
        .extra
        .get("dependency_index_state")
        .and_then(Value::as_str)
        .map(str::trim)
        .is_none_or(|value| value.is_empty() || value == "missing")
}

fn ensure_dependency_index_artifact_exists(runtime: &ExecutionRuntime) -> Result<(), JsonFailure> {
    let dependency_index_path =
        harness_dependency_index_path(&runtime.state_dir, &runtime.repo_slug, &runtime.branch_name);
    match fs::symlink_metadata(&dependency_index_path) {
        Ok(metadata) => {
            if metadata.file_type().is_symlink() || !metadata.is_file() {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    format!(
                        "Authoritative dependency index must be a regular file in {}.",
                        dependency_index_path.display()
                    ),
                ));
            }
            load_dependency_index_for_authoritative_write(&dependency_index_path).map_err(
                |message| JsonFailure::new(FailureClass::MalformedExecutionState, message),
            )?;
            Ok(())
        }
        Err(error) if error.kind() == ErrorKind::NotFound => {
            let dependency_index = DependencyIndex::healthy_empty();
            let serialized = serde_json::to_string_pretty(&dependency_index).map_err(|error| {
                JsonFailure::new(
                    FailureClass::PartialAuthoritativeMutation,
                    format!(
                        "Could not serialize dependency index bootstrap {}: {error}",
                        dependency_index_path.display()
                    ),
                )
            })?;
            write_atomic_file(&dependency_index_path, serialized).map_err(|error| {
                JsonFailure::new(
                    FailureClass::PartialAuthoritativeMutation,
                    format!(
                        "Could not publish dependency index bootstrap {}: {error}",
                        dependency_index_path.display()
                    ),
                )
            })
        }
        Err(error) => Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Could not inspect dependency index {}: {error}",
                dependency_index_path.display()
            ),
        )),
    }
}

#[derive(Debug, Clone)]
struct ObservabilityRecordContext {
    command_name: &'static str,
    active_contract_fingerprint: Option<String>,
}

fn persist_observability_after_authoritative_record(
    runtime: &ExecutionRuntime,
    state: &MutableHarnessState,
    authoritative_sequence: u64,
    context: &ObservabilityRecordContext,
) -> Result<(), String> {
    let events_path = harness_observability_events_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
    );
    let telemetry_path = harness_telemetry_counters_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
    );

    let mut event = HarnessObservabilityEvent::new(
        HarnessEventKind::AuthoritativeMutationRecorded,
        now_unix_timestamp_string(),
    );
    event.authoritative_sequence = Some(authoritative_sequence);
    event.command_name = Some(context.command_name.to_owned());
    event.source_plan_path = state
        .extra
        .get("source_plan_path")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned);
    event.source_plan_revision = state
        .extra
        .get("source_plan_revision")
        .and_then(Value::as_u64)
        .and_then(|value| u32::try_from(value).ok());
    event.harness_phase = state
        .harness_phase
        .as_deref()
        .and_then(|phase| phase.parse::<HarnessPhase>().ok());
    event.active_contract_fingerprint = context
        .active_contract_fingerprint
        .clone()
        .or_else(|| state.active_contract_fingerprint.clone());
    append_observability_event(&events_path, &event)?;

    let mut counters = load_or_default_telemetry_counters(&telemetry_path)?;
    counters.record_authoritative_mutation();
    let counters_json = serde_json::to_string_pretty(&counters).map_err(|error| {
        format!(
            "Could not serialize telemetry counters {}: {error}",
            telemetry_path.display()
        )
    })?;
    write_atomic_file(&telemetry_path, counters_json).map_err(|error| {
        format!(
            "Could not publish telemetry counters {}: {error}",
            telemetry_path.display()
        )
    })?;
    Ok(())
}

fn append_observability_event(
    events_path: &Path,
    event: &HarnessObservabilityEvent,
) -> Result<(), String> {
    if let Some(parent) = events_path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            format!(
                "Could not create observability sink directory {}: {error}",
                parent.display()
            )
        })?;
    }

    let serialized = serde_json::to_string(event).map_err(|error| {
        format!(
            "Could not serialize observability event for {}: {error}",
            events_path.display()
        )
    })?;
    let mut sink = OpenOptions::new()
        .create(true)
        .append(true)
        .open(events_path)
        .map_err(|error| {
            format!(
                "Could not open observability event sink {}: {error}",
                events_path.display()
            )
        })?;
    sink.write_all(serialized.as_bytes()).map_err(|error| {
        format!(
            "Could not write observability event sink {}: {error}",
            events_path.display()
        )
    })?;
    sink.write_all(b"\n").map_err(|error| {
        format!(
            "Could not finalize observability event sink {}: {error}",
            events_path.display()
        )
    })
}

fn load_or_default_telemetry_counters(
    telemetry_path: &Path,
) -> Result<HarnessTelemetryCounters, String> {
    let source = match fs::read_to_string(telemetry_path) {
        Ok(source) => source,
        Err(error) if error.kind() == ErrorKind::NotFound => {
            return Ok(HarnessTelemetryCounters::default());
        }
        Err(error) => {
            return Err(format!(
                "Could not read telemetry counters {}: {error}",
                telemetry_path.display()
            ));
        }
    };
    serde_json::from_str(&source).map_err(|error| {
        format!(
            "Telemetry counters are malformed in {}: {error}",
            telemetry_path.display()
        )
    })
}

fn now_unix_timestamp_string() -> String {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0);
    seconds.to_string()
}

fn persist_dependency_index_after_authoritative_record(
    runtime: &ExecutionRuntime,
    artifact_file_name: &str,
    authoritative_sequence: u64,
) -> Result<(), String> {
    let Some((artifact_kind, artifact_fingerprint)) =
        authoritative_dependency_identity_from_file_name(artifact_file_name)
    else {
        return Ok(());
    };

    let dependency_index_path =
        harness_dependency_index_path(&runtime.state_dir, &runtime.repo_slug, &runtime.branch_name);
    let mut dependency_index =
        load_dependency_index_for_authoritative_write(&dependency_index_path)?;
    dependency_index.version = DEPENDENCY_INDEX_VERSION;
    dependency_index.state = DependencyIndexState::Healthy;
    dependency_index.health = DependencyIndexHealth::healthy();
    upsert_authoritative_dependency_node(
        &mut dependency_index,
        artifact_kind,
        &artifact_fingerprint,
        authoritative_sequence,
    );

    let serialized = serde_json::to_string_pretty(&dependency_index).map_err(|error| {
        format!(
            "Could not serialize dependency index {}: {error}",
            dependency_index_path.display()
        )
    })?;
    write_atomic_file(&dependency_index_path, serialized).map_err(|error| {
        format!(
            "Could not publish dependency index {}: {error}",
            dependency_index_path.display()
        )
    })?;
    Ok(())
}

fn load_dependency_index_for_authoritative_write(
    dependency_index_path: &Path,
) -> Result<DependencyIndex, String> {
    let source = match fs::read_to_string(dependency_index_path) {
        Ok(source) => source,
        Err(error) if error.kind() == ErrorKind::NotFound => {
            return Ok(DependencyIndex::healthy_empty());
        }
        Err(error) => {
            return Err(format!(
                "Could not read dependency index {}: {error}",
                dependency_index_path.display()
            ));
        }
    };

    let dependency_index: DependencyIndex = serde_json::from_str(&source).map_err(|error| {
        format!(
            "Dependency index is malformed in {}: {error}",
            dependency_index_path.display()
        )
    })?;
    if dependency_index.version != DEPENDENCY_INDEX_VERSION {
        return Err(format!(
            "Dependency index version {} is unsupported in {} (expected {}).",
            dependency_index.version,
            dependency_index_path.display(),
            DEPENDENCY_INDEX_VERSION
        ));
    }
    Ok(dependency_index)
}

fn upsert_authoritative_dependency_node(
    dependency_index: &mut DependencyIndex,
    artifact_kind: IndexedArtifactKind,
    artifact_fingerprint: &str,
    authoritative_sequence: u64,
) {
    let node_id = DependencyNodeId(format!(
        "authoritative:{}:{}",
        artifact_kind.as_str(),
        artifact_fingerprint
    ));
    let node = DependencyNode {
        node_id: node_id.clone(),
        artifact_kind,
        artifact_fingerprint: artifact_fingerprint.to_owned(),
        authoritative: true,
        execution_run_id: None,
        chunk_id: None,
        authoritative_sequence: Some(authoritative_sequence),
        source_plan_path: None,
        source_plan_revision: None,
    };
    if let Some(existing) = dependency_index
        .nodes
        .iter_mut()
        .find(|existing| existing.node_id == node_id)
    {
        *existing = node;
    } else {
        dependency_index.nodes.push(node);
    }
}

fn authoritative_dependency_identity_from_file_name(
    artifact_file_name: &str,
) -> Option<(IndexedArtifactKind, String)> {
    if let Some(fingerprint) = parse_authoritative_fingerprint(artifact_file_name, "contract-") {
        return Some((IndexedArtifactKind::Contract, fingerprint));
    }
    if let Some(fingerprint) = parse_authoritative_fingerprint(artifact_file_name, "evaluation-") {
        return Some((IndexedArtifactKind::EvaluationReport, fingerprint));
    }
    if let Some(fingerprint) = parse_authoritative_fingerprint(artifact_file_name, "handoff-") {
        return Some((IndexedArtifactKind::Handoff, fingerprint));
    }
    None
}

fn parse_authoritative_fingerprint(artifact_file_name: &str, prefix: &str) -> Option<String> {
    let fingerprint = artifact_file_name
        .strip_prefix(prefix)?
        .strip_suffix(".md")?;
    if fingerprint.is_empty() || !fingerprint.bytes().all(is_lower_hex_ascii) {
        return None;
    }
    Some(fingerprint.to_owned())
}

fn is_lower_hex_ascii(byte: u8) -> bool {
    byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte)
}

enum MutableStateLoadError {
    MissingState,
    Unreadable(String),
    Malformed(String),
}

fn load_mutable_harness_state(path: &Path) -> Result<MutableHarnessState, MutableStateLoadError> {
    let source = fs::read_to_string(path).map_err(|error| {
        if error.kind() == ErrorKind::NotFound {
            MutableStateLoadError::MissingState
        } else {
            MutableStateLoadError::Unreadable(format!(
                "Could not read authoritative harness state {}: {error}",
                path.display()
            ))
        }
    })?;
    serde_json::from_str(&source).map_err(|error| {
        MutableStateLoadError::Malformed(format!(
            "Authoritative harness state is malformed in {}: {error}",
            path.display()
        ))
    })
}

fn canonical_worktree_lease_fingerprint(source: &str) -> Option<String> {
    let mut value: Value = serde_json::from_str(source).ok()?;
    let object = value.as_object_mut()?;
    object.remove("lease_fingerprint");
    serde_json::to_vec(&value)
        .ok()
        .map(|bytes| sha256_hex(&bytes))
}

fn canonical_unit_review_receipt_fingerprint(source: &str) -> Option<String> {
    let filtered = source
        .lines()
        .filter(|line| !line.trim().starts_with("**Receipt Fingerprint:**"))
        .collect::<Vec<_>>()
        .join("\n");
    Some(sha256_hex(filtered.as_bytes()))
}

fn unit_review_receipt_declared_fingerprint(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Receipt Fingerprint:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn push_unique(values: &mut Vec<String>, value: &str) {
    if !values.iter().any(|existing| existing == value) {
        values.push(value.to_owned());
    }
}

fn remove_value(values: &mut Vec<String>, value: &str) {
    values.retain(|existing| existing != value);
}

fn bootstrap_verdict_buckets_from_legacy_state(
    runtime: &ExecutionRuntime,
    state: &mut MutableHarnessState,
) {
    if (!state.failed_evaluator_kinds.is_empty())
        || (!state.blocked_evaluator_kinds.is_empty())
        || state.non_passing_evaluator_kinds.is_empty()
    {
        return;
    }

    let legacy_non_passing = state.non_passing_evaluator_kinds.clone();
    if let Some(latest_verdicts) = derive_latest_evaluator_verdicts_from_authoritative_history(
        runtime,
        state,
        &legacy_non_passing,
    ) {
        for evaluator_kind in &legacy_non_passing {
            match latest_verdicts.get(evaluator_kind).map(String::as_str) {
                Some("fail") => push_unique(&mut state.failed_evaluator_kinds, evaluator_kind),
                Some("blocked") => push_unique(&mut state.blocked_evaluator_kinds, evaluator_kind),
                _ => {}
            }
        }
        return;
    }

    if state.handoff_required
        || matches!(state.harness_phase.as_deref(), Some("handoff_required"))
        || matches!(state.aggregate_evaluation_state.as_deref(), Some("blocked"))
    {
        for evaluator_kind in &legacy_non_passing {
            push_unique(&mut state.blocked_evaluator_kinds, evaluator_kind);
        }
    } else {
        for evaluator_kind in &legacy_non_passing {
            push_unique(&mut state.failed_evaluator_kinds, evaluator_kind);
        }
    }
}

fn derive_latest_evaluator_verdicts_from_authoritative_history(
    runtime: &ExecutionRuntime,
    state: &MutableHarnessState,
    evaluators: &[String],
) -> Option<BTreeMap<String, String>> {
    let active_contract_fingerprint = state.active_contract_fingerprint.as_deref()?;
    let latest_sequence = state.latest_sequence();
    let artifacts_dir = harness_authoritative_artifacts_dir(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
    );
    let entries = fs::read_dir(&artifacts_dir).ok()?;

    let mut latest_by_evaluator: BTreeMap<String, (u64, String, String)> = BTreeMap::new();
    for entry in entries.flatten() {
        let Some(file_name) = entry.file_name().to_str().map(str::to_owned) else {
            continue;
        };
        let Some(expected_fingerprint) = evaluation_fingerprint_from_authoritative_name(&file_name)
        else {
            continue;
        };

        let path = entry.path();
        let Ok(source) = fs::read_to_string(&path) else {
            continue;
        };
        let Ok(report) = read_evaluation_report(path.as_path()) else {
            continue;
        };
        if !is_harness_authoritative_producer(&report.generated_by) {
            continue;
        }
        if report.report_fingerprint != expected_fingerprint {
            continue;
        }
        let Some(canonical_fingerprint) =
            canonical_fingerprint_without_header_value(&source, "Report Fingerprint")
        else {
            continue;
        };
        if canonical_fingerprint != report.report_fingerprint
            || canonical_fingerprint != expected_fingerprint
        {
            continue;
        }
        if report.authoritative_sequence > latest_sequence {
            continue;
        }
        if report.source_contract_fingerprint != active_contract_fingerprint {
            continue;
        }
        if !evaluators.iter().any(|kind| kind == &report.evaluator_kind) {
            continue;
        }
        if !matches!(report.verdict.as_str(), "pass" | "fail" | "blocked") {
            continue;
        }

        match latest_by_evaluator.get(&report.evaluator_kind) {
            None => {
                latest_by_evaluator.insert(
                    report.evaluator_kind.clone(),
                    (
                        report.authoritative_sequence,
                        report.verdict.clone(),
                        expected_fingerprint.to_owned(),
                    ),
                );
            }
            Some((sequence, _, existing_fingerprint)) => {
                if report.authoritative_sequence > *sequence {
                    latest_by_evaluator.insert(
                        report.evaluator_kind.clone(),
                        (
                            report.authoritative_sequence,
                            report.verdict.clone(),
                            expected_fingerprint.to_owned(),
                        ),
                    );
                } else if report.authoritative_sequence == *sequence
                    && existing_fingerprint != expected_fingerprint
                {
                    return None;
                }
            }
        }
    }

    if evaluators
        .iter()
        .any(|evaluator| !latest_by_evaluator.contains_key(evaluator))
    {
        return None;
    }

    Some(
        latest_by_evaluator
            .into_iter()
            .map(|(evaluator, (_, verdict, _))| (evaluator, verdict))
            .collect(),
    )
}

fn evaluation_fingerprint_from_authoritative_name(file_name: &str) -> Option<&str> {
    let fingerprint = file_name.strip_suffix(".md")?.strip_prefix("evaluation-")?;
    if fingerprint.is_empty()
        || !fingerprint
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
    {
        return None;
    }
    Some(fingerprint)
}

fn is_harness_authoritative_producer(generated_by: &str) -> bool {
    let mut gate = GateState::default();
    validate_harness_provenance(
        generated_by,
        FailureClass::NonHarnessProvenance,
        "evaluation_non_harness_provenance",
        &mut gate,
    );
    gate.allowed
}

fn recompute_authoritative_evaluator_state(state: &mut MutableHarnessState) {
    let mut recomputed_non_passing = Vec::new();
    for evaluator_kind in &state.required_evaluator_kinds {
        if state
            .failed_evaluator_kinds
            .iter()
            .any(|value| value == evaluator_kind)
            || state
                .blocked_evaluator_kinds
                .iter()
                .any(|value| value == evaluator_kind)
        {
            recomputed_non_passing.push(evaluator_kind.clone());
        }
    }
    for evaluator_kind in state
        .failed_evaluator_kinds
        .iter()
        .chain(state.blocked_evaluator_kinds.iter())
    {
        push_unique(&mut recomputed_non_passing, evaluator_kind);
    }
    state.non_passing_evaluator_kinds = recomputed_non_passing;

    if !state.blocked_evaluator_kinds.is_empty() {
        state.harness_phase = Some(String::from("handoff_required"));
        state.handoff_required = true;
        state.aggregate_evaluation_state = Some(String::from("blocked"));
        return;
    }

    if !state.failed_evaluator_kinds.is_empty() {
        if state.current_chunk_pivot_threshold > 0
            && state.current_chunk_retry_count >= state.current_chunk_pivot_threshold
        {
            state.harness_phase = Some(String::from("pivot_required"));
        } else {
            state.harness_phase = Some(String::from("repairing"));
        }
        state.handoff_required = false;
        state.aggregate_evaluation_state = Some(String::from("fail"));
        return;
    }

    state.handoff_required = false;
    state.harness_phase = Some(String::from("executing"));
    if state.pending_evaluator_kinds.is_empty() {
        state.aggregate_evaluation_state = Some(String::from("pass"));
        state.open_failed_criteria.clear();
    } else {
        state.aggregate_evaluation_state = Some(String::from("pending"));
    }
}

fn verify_declared_fingerprint(
    source: &str,
    header_label: &str,
    declared_fingerprint: &str,
    artifact_label: &str,
    mismatch_reason_code: &str,
    gate: &mut GateState,
) -> Option<String> {
    let Some(canonical_fingerprint) =
        canonical_fingerprint_without_header_value(source, header_label)
    else {
        gate.fail(
            FailureClass::ArtifactIntegrityMismatch,
            &format!("{artifact_label}_fingerprint_unverifiable"),
            format!(
                "Could not recompute canonical {artifact_label} fingerprint because `{header_label}` is missing or malformed."
            ),
            format!(
                "Regenerate the {artifact_label} artifact with a valid `{header_label}` header."
            ),
        );
        return None;
    };

    if canonical_fingerprint != declared_fingerprint {
        gate.fail(
            FailureClass::ArtifactIntegrityMismatch,
            mismatch_reason_code,
            format!(
                "Declared {artifact_label} fingerprint does not match canonical content-derived fingerprint."
            ),
            format!(
                "Regenerate the {artifact_label} artifact and ensure `{header_label}` is computed from canonical content."
            ),
        );
        return None;
    }

    Some(canonical_fingerprint)
}

fn canonical_fingerprint_without_header_value(source: &str, header_label: &str) -> Option<String> {
    let marker = format!("**{header_label}:**");
    let mut canonical_source = String::with_capacity(source.len());
    let mut replaced = false;

    for segment in source.split_inclusive('\n') {
        let (line, newline) = match segment.strip_suffix('\n') {
            Some(line) => (line, "\n"),
            None => (segment, ""),
        };

        if !replaced && let Some(marker_index) = line.find(&marker) {
            let after_marker = &line[marker_index + marker.len()..];
            let leading_whitespace_len = after_marker
                .chars()
                .take_while(|ch| matches!(ch, ' ' | '\t'))
                .map(char::len_utf8)
                .sum::<usize>();
            canonical_source
                .push_str(&line[..marker_index + marker.len() + leading_whitespace_len]);
            canonical_source.push_str(newline);
            replaced = true;
            continue;
        }

        canonical_source.push_str(segment);
    }

    replaced.then(|| sha256_hex(canonical_source.as_bytes()))
}

enum AuthorityLockAcquireError {
    Conflict,
    Io(String),
}

struct WriteAuthorityLock {
    path: PathBuf,
}

impl WriteAuthorityLock {
    fn acquire(runtime: &ExecutionRuntime) -> Result<Self, AuthorityLockAcquireError> {
        let lock_path =
            harness_branch_root(&runtime.state_dir, &runtime.repo_slug, &runtime.branch_name)
                .join("write-authority.lock");
        if let Some(parent) = lock_path.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                AuthorityLockAcquireError::Io(format!(
                    "Could not prepare write-authority directory {}: {error}",
                    parent.display()
                ))
            })?;
        }

        let mut file = match OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&lock_path)
        {
            Ok(file) => file,
            Err(error) if error.kind() == ErrorKind::AlreadyExists => {
                return Err(AuthorityLockAcquireError::Conflict);
            }
            Err(error) => {
                return Err(AuthorityLockAcquireError::Io(format!(
                    "Could not acquire write-authority lock {}: {error}",
                    lock_path.display()
                )));
            }
        };

        writeln!(file, "pid={}", std::process::id()).map_err(|error| {
            let _ = fs::remove_file(&lock_path);
            AuthorityLockAcquireError::Io(format!(
                "Could not initialize write-authority lock {}: {error}",
                lock_path.display()
            ))
        })?;
        Ok(Self { path: lock_path })
    }
}

impl Drop for WriteAuthorityLock {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.path);
    }
}
