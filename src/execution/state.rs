use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::fs;
use std::io::ErrorKind;
use std::path::{Component, Path, PathBuf};
use std::process::Command;

use schemars::{JsonSchema, schema_for};
use serde::{Deserialize, Serialize};

use crate::cli::plan_execution::{
    BeginArgs, CompleteArgs, GateContractArgs, GateEvaluatorArgs, GateHandoffArgs,
    IsolatedAgentsArg, NoteArgs, NoteStateArg, RebuildEvidenceArgs, RecommendArgs,
    RecordContractArgs, RecordEvaluationArgs, RecordHandoffArgs, ReopenArgs, StatusArgs,
    TransferArgs,
};
use crate::cli::repo_safety::{RepoSafetyCheckArgs, RepoSafetyIntentArg, RepoSafetyWriteTargetArg};
use crate::contracts::harness::{
    ExecutionTopologyDowngradeRecord, WORKTREE_LEASE_VERSION, WorktreeLease, WorktreeLeaseState,
    read_execution_contract,
};
use crate::contracts::plan::{PlanDocument, PlanTask, analyze_documents, parse_plan_file};
use crate::contracts::spec::parse_spec_file;
use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::authority::ensure_preflight_authoritative_bootstrap;
use crate::execution::final_review::{
    FinalReviewReceiptExpectations, authoritative_browser_qa_artifact_path_checked,
    authoritative_final_review_artifact_path_checked,
    authoritative_release_docs_artifact_path_checked,
    authoritative_strategy_checkpoint_fingerprint_checked,
    authoritative_test_plan_artifact_path_from_qa_checked, latest_branch_artifact_path,
    parse_artifact_document, parse_final_review_receipt, resolve_release_base_branch,
    validate_final_review_receipt,
};
use crate::execution::harness::{
    AggregateEvaluationState, ChunkId, ChunkingStrategy, DownstreamFreshnessState,
    EvaluationVerdict, EvaluatorKind, EvaluatorPolicyName, ExecutionRunId, HarnessPhase,
    INITIAL_AUTHORITATIVE_SEQUENCE, LearnedTopologyGuidance, ResetPolicy, TopologySelectionContext,
    RunIdentitySnapshot,
};
use crate::execution::leases::{
    PreflightWriteAuthorityState, StrategyReviewDispatchLineageRecord,
    authoritative_matching_execution_topology_downgrade_records_checked, authoritative_state_path,
    load_status_authoritative_overlay_checked, preflight_requires_authoritative_handoff,
    preflight_requires_authoritative_mutation_recovery, preflight_write_authority_state,
    validate_worktree_lease,
};
use crate::execution::topology::{
    RecommendOutput, default_preflight_chunking_strategy, default_preflight_evaluator_policy,
    default_preflight_reset_policy, default_preflight_review_stack, pending_chunk_id,
    persist_preflight_acceptance, preflight_acceptance_for_context, recommend_topology,
    tasks_are_independent,
};
use crate::execution::transitions::{
    claim_step_write_authority, load_authoritative_transition_state,
};
use crate::git::{
    derive_repo_slug, discover_repo_identity, sha256_hex, stored_repo_root_matches_current,
};
use crate::paths::{
    RepoPath, branch_storage_key, featureforge_state_dir, normalize_repo_relative_path,
    normalize_whitespace,
};
use crate::repo_safety::RepoSafetyRuntime;
use crate::workflow::manifest::{ManifestLoadResult, WorkflowManifest, load_manifest_read_only};
use crate::workflow::markdown_scan::markdown_files_under;

pub const NO_REPO_FILES_MARKER: &str = "__featureforge__/no-repo-files";
const ACTIVE_SPEC_ROOT: &str = "docs/featureforge/specs";
const ACTIVE_PLAN_ROOT: &str = "docs/featureforge/plans";
const ACTIVE_EVIDENCE_ROOT: &str = "docs/featureforge/execution-evidence";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct PlanExecutionStatus {
    pub plan_revision: u32,
    pub execution_run_id: Option<ExecutionRunId>,
    pub latest_authoritative_sequence: u64,
    pub harness_phase: HarnessPhase,
    pub chunk_id: ChunkId,
    pub chunking_strategy: Option<ChunkingStrategy>,
    pub evaluator_policy: Option<EvaluatorPolicyName>,
    pub reset_policy: Option<ResetPolicy>,
    pub review_stack: Option<Vec<String>>,
    pub active_contract_path: Option<String>,
    pub active_contract_fingerprint: Option<String>,
    pub required_evaluator_kinds: Vec<EvaluatorKind>,
    pub completed_evaluator_kinds: Vec<EvaluatorKind>,
    pub pending_evaluator_kinds: Vec<EvaluatorKind>,
    pub non_passing_evaluator_kinds: Vec<EvaluatorKind>,
    pub aggregate_evaluation_state: AggregateEvaluationState,
    pub last_evaluation_report_path: Option<String>,
    pub last_evaluation_report_fingerprint: Option<String>,
    pub last_evaluation_evaluator_kind: Option<EvaluatorKind>,
    pub last_evaluation_verdict: Option<EvaluationVerdict>,
    pub current_chunk_retry_count: u32,
    pub current_chunk_retry_budget: u32,
    pub current_chunk_pivot_threshold: u32,
    pub handoff_required: bool,
    pub open_failed_criteria: Vec<String>,
    pub write_authority_state: String,
    pub write_authority_holder: Option<String>,
    pub write_authority_worktree: Option<String>,
    pub repo_state_baseline_head_sha: Option<String>,
    pub repo_state_baseline_worktree_fingerprint: Option<String>,
    pub repo_state_drift_state: String,
    pub dependency_index_state: String,
    pub final_review_state: DownstreamFreshnessState,
    pub browser_qa_state: DownstreamFreshnessState,
    pub release_docs_state: DownstreamFreshnessState,
    pub last_final_review_artifact_fingerprint: Option<String>,
    pub last_browser_qa_artifact_fingerprint: Option<String>,
    pub last_release_docs_artifact_fingerprint: Option<String>,
    pub strategy_state: String,
    pub last_strategy_checkpoint_fingerprint: Option<String>,
    pub strategy_checkpoint_kind: String,
    pub strategy_reset_required: bool,
    pub reason_codes: Vec<String>,
    pub execution_mode: String,
    pub execution_fingerprint: String,
    pub evidence_path: String,
    pub execution_started: String,
    pub warning_codes: Vec<String>,
    pub latest_packet_fingerprint: Option<String>,
    pub latest_head_sha: Option<String>,
    pub latest_base_sha: Option<String>,
    pub active_task: Option<u32>,
    pub active_step: Option<u32>,
    pub blocking_task: Option<u32>,
    pub blocking_step: Option<u32>,
    pub resume_task: Option<u32>,
    pub resume_step: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RebuildEvidenceCounts {
    pub planned: u32,
    pub rebuilt: u32,
    pub manual: u32,
    pub failed: u32,
    pub noop: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RebuildEvidenceFilter {
    pub all: bool,
    pub tasks: Vec<u32>,
    pub steps: Vec<String>,
    pub include_open: bool,
    pub skip_manual_fallback: bool,
    pub continue_on_error: bool,
    pub max_jobs: u32,
    pub no_output: bool,
    pub json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RebuildEvidenceTarget {
    pub task_id: u32,
    pub step_id: u32,
    pub target_kind: String,
    pub pre_invalidation_reason: String,
    pub status: String,
    pub verify_mode: String,
    pub verify_command: Option<String>,
    pub attempt_id_before: Option<String>,
    pub attempt_id_after: Option<String>,
    pub verification_hash: Option<String>,
    pub error: Option<String>,
    pub failure_class: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RebuildEvidenceOutput {
    pub session_root: String,
    pub dry_run: bool,
    pub filter: RebuildEvidenceFilter,
    pub scope: String,
    pub counts: RebuildEvidenceCounts,
    pub duration_ms: u64,
    pub targets: Vec<RebuildEvidenceTarget>,
    #[serde(skip_serializing)]
    pub exit_code: u8,
}

impl RebuildEvidenceOutput {
    pub fn exit_code(&self) -> u8 {
        self.exit_code
    }

    pub fn render_text(&self) -> String {
        let mut lines = Vec::with_capacity(self.targets.len() + 1);
        lines.push(format!(
            "summary scope={} dry_run={} planned={} rebuilt={} manual={} failed={} noop={}",
            render_text_value(&self.scope),
            self.dry_run,
            self.counts.planned,
            self.counts.rebuilt,
            self.counts.manual,
            self.counts.failed,
            self.counts.noop,
        ));
        for target in &self.targets {
            lines.push(format!(
                "target task_id={} step_id={} status={} target_kind={} pre_invalidation_reason={} verify_mode={} verify_command={} attempt_id_before={} attempt_id_after={} verification_hash={} error={} failure_class={}",
                target.task_id,
                target.step_id,
                render_text_value(&target.status),
                render_text_value(&target.target_kind),
                render_text_value(&target.pre_invalidation_reason),
                render_text_value(&target.verify_mode),
                render_optional_text_value(target.verify_command.as_deref()),
                render_optional_text_value(target.attempt_id_before.as_deref()),
                render_optional_text_value(target.attempt_id_after.as_deref()),
                render_optional_text_value(target.verification_hash.as_deref()),
                render_optional_text_value(target.error.as_deref()),
                render_optional_text_value(target.failure_class.as_deref()),
            ));
        }
        lines.join("\n") + "\n"
    }
}

fn render_text_value(value: &str) -> String {
    serde_json::to_string(value).unwrap_or_else(|_| String::from("\"<serialization-error>\""))
}

fn render_optional_text_value(value: Option<&str>) -> String {
    value
        .map(render_text_value)
        .unwrap_or_else(|| String::from("null"))
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct GateDiagnostic {
    pub code: String,
    pub severity: String,
    pub message: String,
    pub remediation: String,
}

#[derive(Debug, Deserialize)]
struct WorktreeLeaseRunIdentityProbe {
    execution_run_id: String,
    source_plan_path: String,
    source_plan_revision: u32,
}

#[derive(Debug, Deserialize)]
struct WorktreeLeaseBindingProbe {
    execution_run_id: String,
    lease_fingerprint: String,
    lease_artifact_path: String,
    #[serde(default)]
    execution_context_key: Option<String>,
    #[serde(default)]
    approved_task_packet_fingerprint: Option<String>,
    #[serde(default)]
    approved_unit_contract_fingerprint: Option<String>,
    #[serde(default)]
    reconcile_result_proof_fingerprint: Option<String>,
    #[serde(default)]
    reviewed_checkpoint_commit_sha: Option<String>,
    #[serde(default)]
    reconcile_result_commit_sha: Option<String>,
    #[serde(default)]
    reconcile_mode: Option<String>,
    #[serde(default)]
    review_receipt_fingerprint: Option<String>,
    #[serde(default)]
    review_receipt_artifact_path: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WorktreeLeaseAuthoritativeContextProbe {
    #[serde(default)]
    run_identity: Option<WorktreeLeaseRunIdentityProbe>,
    #[serde(default)]
    repo_state_baseline_head_sha: Option<String>,
    #[serde(default)]
    repo_state_baseline_worktree_fingerprint: Option<String>,
    active_worktree_lease_fingerprints: Option<Vec<String>>,
    active_worktree_lease_bindings: Option<Vec<WorktreeLeaseBindingProbe>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct GateResult {
    pub allowed: bool,
    pub failure_class: String,
    pub reason_codes: Vec<String>,
    pub warning_codes: Vec<String>,
    pub diagnostics: Vec<GateDiagnostic>,
}

#[derive(Debug, Clone)]
pub struct ExecutionRuntime {
    pub repo_root: PathBuf,
    pub git_dir: PathBuf,
    pub branch_name: String,
    pub repo_slug: String,
    pub safe_branch: String,
    pub state_dir: PathBuf,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NoteState {
    Active,
    Blocked,
    Interrupted,
}

impl NoteState {
    pub(crate) fn as_str(self) -> &'static str {
        match self {
            Self::Active => "Active",
            Self::Blocked => "Blocked",
            Self::Interrupted => "Interrupted",
        }
    }
}

#[derive(Debug, Clone)]
pub struct PlanStepState {
    pub task_number: u32,
    pub step_number: u32,
    pub title: String,
    pub checked: bool,
    pub note_state: Option<NoteState>,
    pub note_summary: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EvidenceFormat {
    Empty,
    Legacy,
    V2,
}

#[derive(Debug, Clone)]
pub struct FileProof {
    pub path: String,
    pub proof: String,
}

#[derive(Debug, Clone)]
pub struct EvidenceAttempt {
    pub task_number: u32,
    pub step_number: u32,
    pub attempt_number: u32,
    pub status: String,
    pub recorded_at: String,
    pub execution_source: String,
    pub claim: String,
    pub files: Vec<String>,
    pub file_proofs: Vec<FileProof>,
    pub verify_command: Option<String>,
    pub verification_summary: String,
    pub invalidation_reason: String,
    pub packet_fingerprint: Option<String>,
    pub head_sha: Option<String>,
    pub base_sha: Option<String>,
    pub source_contract_path: Option<String>,
    pub source_contract_fingerprint: Option<String>,
    pub source_evaluation_report_fingerprint: Option<String>,
    pub evaluator_verdict: Option<String>,
    pub failing_criterion_ids: Vec<String>,
    pub source_handoff_fingerprint: Option<String>,
    pub repo_state_baseline_head_sha: Option<String>,
    pub repo_state_baseline_worktree_fingerprint: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ExecutionEvidence {
    pub format: EvidenceFormat,
    pub plan_path: String,
    pub plan_revision: u32,
    pub plan_fingerprint: Option<String>,
    pub source_spec_path: String,
    pub source_spec_revision: u32,
    pub source_spec_fingerprint: Option<String>,
    pub attempts: Vec<EvidenceAttempt>,
    pub source: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ExecutionContext {
    pub runtime: ExecutionRuntime,
    pub plan_rel: String,
    pub plan_abs: PathBuf,
    pub plan_document: PlanDocument,
    pub plan_source: String,
    pub steps: Vec<PlanStepState>,
    pub tasks_by_number: BTreeMap<u32, PlanTask>,
    pub evidence_rel: String,
    pub evidence_abs: PathBuf,
    pub evidence: ExecutionEvidence,
    pub source_spec_source: String,
    pub source_spec_path: PathBuf,
    pub execution_fingerprint: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RebuildEvidenceRequest {
    pub plan: PathBuf,
    pub all: bool,
    pub tasks: Vec<u32>,
    pub steps: Vec<(u32, u32)>,
    pub raw_steps: Vec<String>,
    pub include_open: bool,
    pub skip_manual_fallback: bool,
    pub continue_on_error: bool,
    pub dry_run: bool,
    pub max_jobs: u32,
    pub no_output: bool,
    pub json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RebuildEvidenceCandidate {
    pub task: u32,
    pub step: u32,
    pub order_key: (u32, u32),
    pub target_kind: String,
    pub pre_invalidation_reason: String,
    pub verify_command: Option<String>,
    pub verify_mode: String,
    pub claim: String,
    pub files: Vec<String>,
    pub attempt_number: Option<u32>,
    pub artifact_epoch: Option<String>,
    pub needs_reopen: bool,
}

#[derive(Debug, Clone)]
pub struct CompleteRequest {
    pub task: u32,
    pub step: u32,
    pub source: String,
    pub claim: String,
    pub files: Vec<String>,
    pub verify_command: Option<String>,
    pub verification_summary: String,
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone)]
pub struct BeginRequest {
    pub task: u32,
    pub step: u32,
    pub execution_mode: Option<String>,
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone)]
pub struct NoteRequest {
    pub task: u32,
    pub step: u32,
    pub state: NoteState,
    pub message: String,
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone)]
pub struct ReopenRequest {
    pub task: u32,
    pub step: u32,
    pub source: String,
    pub reason: String,
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone)]
pub struct TransferRequest {
    pub repair_task: u32,
    pub repair_step: u32,
    pub source: String,
    pub reason: String,
    pub expect_execution_fingerprint: String,
}

impl ExecutionRuntime {
    pub fn discover(current_dir: &Path) -> Result<Self, JsonFailure> {
        let identity = discover_repo_identity(current_dir).map_err(JsonFailure::from)?;
        let repo = gix::discover(current_dir).map_err(|error| {
            JsonFailure::new(
                FailureClass::BranchDetectionFailed,
                format!("Could not discover the current repository: {error}"),
            )
        })?;

        Ok(Self {
            repo_root: identity.repo_root.clone(),
            git_dir: repo.path().to_path_buf(),
            branch_name: identity.branch_name.clone(),
            repo_slug: derive_repo_slug(&identity.repo_root, identity.remote_url.as_deref()),
            safe_branch: branch_storage_key(&identity.branch_name),
            state_dir: state_dir(),
        })
    }

    pub fn status(&self, args: &StatusArgs) -> Result<PlanExecutionStatus, JsonFailure> {
        let context = load_execution_context(self, &args.plan)?;
        status_from_context(&context)
    }

    pub fn recommend(&self, args: &RecommendArgs) -> Result<RecommendOutput, JsonFailure> {
        let context = load_execution_context(self, &args.plan)?;
        if execution_started(&context) {
            return Err(JsonFailure::new(
                FailureClass::RecommendAfterExecutionStart,
                "recommend is only valid before execution has started for this plan revision.",
            ));
        }
        let (chunking_strategy, evaluator_policy, reset_policy, review_stack, policy_reason_codes) =
            if let Some(preflight_acceptance) = preflight_acceptance_for_context(&context)? {
                (
                    preflight_acceptance.chunking_strategy,
                    preflight_acceptance.evaluator_policy,
                    preflight_acceptance.reset_policy,
                    preflight_acceptance.review_stack,
                    vec![String::from("reused_preflight_acceptance_policy_tuple")],
                )
            } else {
                (
                    default_preflight_chunking_strategy(),
                    default_preflight_evaluator_policy(),
                    default_preflight_reset_policy(),
                    default_preflight_review_stack(),
                    vec![String::from("default_preflight_policy_tuple")],
                )
            };

        let isolated_agents_available = match args.isolated_agents {
            Some(IsolatedAgentsArg::Available) => "yes",
            Some(IsolatedAgentsArg::Unavailable) => "no",
            None => "unknown",
        };
        let session_intent = args
            .session_intent
            .map(|value| value.as_str())
            .unwrap_or("unknown");
        let workspace_prepared = args
            .workspace_prepared
            .map(|value| value.as_str())
            .unwrap_or("unknown");
        let spec_document = parse_spec_file(&context.source_spec_path).map_err(|error| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not analyze execution topology because source spec {} is unreadable: {}",
                    context.source_spec_path.display(),
                    error.message()
                ),
            )
        })?;
        let topology_report = analyze_documents(&spec_document, &context.plan_document);
        let execution_context_key = recommendation_execution_context_key(&context);
        let downgrade_records =
            authoritative_matching_execution_topology_downgrade_records_checked(
                &context,
                &execution_context_key,
            )?;
        let learned_guidance = select_active_learned_topology_guidance(
            &downgrade_records,
            topology_report.plan_revision,
            &execution_context_key,
        );

        let tasks_independent = tasks_are_independent(&context.plan_document);
        let current_parallel_path_ready = topology_report.execution_topology_valid
            && topology_report.parallel_lane_ownership_valid
            && topology_report.parallel_workspace_isolation_valid
            && !topology_report.parallel_worktree_groups.is_empty()
            && tasks_independent
            && isolated_agents_available == "yes"
            && workspace_prepared == "yes";
        let topology_context = TopologySelectionContext {
            execution_context_key,
            tasks_independent,
            isolated_agents_available: isolated_agents_available.to_owned(),
            session_intent: session_intent.to_owned(),
            workspace_prepared: workspace_prepared.to_owned(),
            current_parallel_path_ready,
            learned_guidance,
        };
        let topology_recommendation = recommend_topology(&topology_report, &topology_context);

        Ok(RecommendOutput {
            selected_topology: topology_recommendation.selected_topology,
            recommended_skill: topology_recommendation.recommended_skill,
            reason: topology_recommendation.reason,
            decision_flags: topology_recommendation.decision_flags,
            reason_codes: topology_recommendation.reason_codes,
            learned_downgrade_reused: topology_recommendation.learned_downgrade_reused,
            chunking_strategy,
            evaluator_policy,
            reset_policy,
            review_stack,
            policy_reason_codes,
        })
    }

    pub fn preflight(&self, args: &StatusArgs) -> Result<GateResult, JsonFailure> {
        self.preflight_with_mode(args, true)
    }

    pub fn gate_contract(&self, args: &GateContractArgs) -> Result<GateResult, JsonFailure> {
        crate::execution::gates::gate_contract(self, args)
    }

    pub fn record_contract(&self, args: &RecordContractArgs) -> Result<GateResult, JsonFailure> {
        crate::execution::authority::record_contract(self, args)
    }

    pub fn gate_evaluator(&self, args: &GateEvaluatorArgs) -> Result<GateResult, JsonFailure> {
        crate::execution::gates::gate_evaluator(self, args)
    }

    pub fn record_evaluation(
        &self,
        args: &RecordEvaluationArgs,
    ) -> Result<GateResult, JsonFailure> {
        crate::execution::authority::record_evaluation(self, args)
    }

    pub fn gate_handoff(&self, args: &GateHandoffArgs) -> Result<GateResult, JsonFailure> {
        crate::execution::gates::gate_handoff(self, args)
    }

    pub fn record_handoff(&self, args: &RecordHandoffArgs) -> Result<GateResult, JsonFailure> {
        crate::execution::authority::record_handoff(self, args)
    }

    pub fn preflight_read_only(&self, args: &StatusArgs) -> Result<GateResult, JsonFailure> {
        self.preflight_with_mode(args, false)
    }

    fn preflight_with_mode(
        &self,
        args: &StatusArgs,
        persist_acceptance: bool,
    ) -> Result<GateResult, JsonFailure> {
        let context = load_execution_context(self, &args.plan)?;
        let gate = preflight_from_context(&context);
        if persist_acceptance && gate.allowed {
            let acceptance = persist_preflight_acceptance(&context)?;
            ensure_preflight_authoritative_bootstrap(
                &context.runtime,
                RunIdentitySnapshot {
                    execution_run_id: acceptance.execution_run_id.clone(),
                    source_plan_path: context.plan_rel.clone(),
                    source_plan_revision: context.plan_document.plan_revision,
                },
                acceptance.chunk_id,
            )?;
        }
        Ok(gate)
    }

    pub fn gate_review(&self, args: &StatusArgs) -> Result<GateResult, JsonFailure> {
        match load_execution_context(self, &args.plan) {
            Ok(context) => Ok(gate_review_from_context(&context)),
            Err(error) if error.error_class == FailureClass::PlanNotExecutionReady.as_str() => {
                let mut gate = GateState::default();
                gate.fail(
                    FailureClass::PlanNotExecutionReady,
                    "plan_not_execution_ready",
                    error.message,
                    "Refresh the approved plan/spec pair before running gate-review.",
                );
                Ok(gate.finish())
            }
            Err(error) => Err(error),
        }
    }

    pub fn gate_review_dispatch(&self, args: &StatusArgs) -> Result<GateResult, JsonFailure> {
        match load_execution_context(self, &args.plan) {
            Ok(context) => {
                ensure_review_dispatch_authoritative_bootstrap(&context)?;
                record_review_dispatch_strategy_checkpoint(&context)?;
                let reloaded = load_execution_context(self, &args.plan)?;
                Ok(gate_review_from_context(&reloaded))
            }
            Err(error) if error.error_class == FailureClass::PlanNotExecutionReady.as_str() => {
                let mut gate = GateState::default();
                gate.fail(
                    FailureClass::PlanNotExecutionReady,
                    "plan_not_execution_ready",
                    error.message,
                    "Refresh the approved plan/spec pair before running gate-review-dispatch.",
                );
                Ok(gate.finish())
            }
            Err(error) => Err(error),
        }
    }

    pub fn gate_finish(&self, args: &StatusArgs) -> Result<GateResult, JsonFailure> {
        let context = load_execution_context(self, &args.plan)?;
        Ok(gate_finish_from_context(&context))
    }
}

fn recommendation_execution_context_key(context: &ExecutionContext) -> String {
    let base_branch =
        resolve_release_base_branch(&context.runtime.git_dir, &context.runtime.branch_name)
            .unwrap_or_else(|| String::from("unknown"));
    format!("{}@{}", context.runtime.branch_name, base_branch)
}

fn record_review_dispatch_strategy_checkpoint(
    context: &ExecutionContext,
) -> Result<(), JsonFailure> {
    let _write_authority = claim_step_write_authority(&context.runtime)?;
    let mut authoritative_state = load_authoritative_transition_state(context)?;
    let Some(authoritative_state) = authoritative_state.as_mut() else {
        return Err(JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            "Authoritative harness state is required before gate-review-dispatch can record review-dispatch proof.",
        ));
    };
    let cycle_target = match review_dispatch_cycle_target(context) {
        ReviewDispatchCycleTarget::Bound(task, step) => Some((task, step)),
        ReviewDispatchCycleTarget::UnboundCompletedPlan => None,
        ReviewDispatchCycleTarget::None => return Ok(()),
    };
    authoritative_state.record_review_dispatch_strategy_checkpoint(
        context,
        &context.plan_document.execution_mode,
        cycle_target,
    )?;
    authoritative_state.persist_if_dirty_with_failpoint(None)
}

fn ensure_review_dispatch_authoritative_bootstrap(
    context: &ExecutionContext,
) -> Result<(), JsonFailure> {
    let acceptance = persist_preflight_acceptance(context)?;
    ensure_preflight_authoritative_bootstrap(
        &context.runtime,
        RunIdentitySnapshot {
            execution_run_id: acceptance.execution_run_id.clone(),
            source_plan_path: context.plan_rel.clone(),
            source_plan_revision: context.plan_document.plan_revision,
        },
        acceptance.chunk_id,
    )
}

enum ReviewDispatchCycleTarget {
    Bound(u32, u32),
    UnboundCompletedPlan,
    None,
}

fn review_dispatch_cycle_target(context: &ExecutionContext) -> ReviewDispatchCycleTarget {
    for state in [
        NoteState::Active,
        NoteState::Blocked,
        NoteState::Interrupted,
    ] {
        if let Some(step) = active_step(context, state) {
            return ReviewDispatchCycleTarget::Bound(step.task_number, step.step_number);
        }
    }
    if context.steps.iter().all(|step| step.checked) {
        return ReviewDispatchCycleTarget::UnboundCompletedPlan;
    }
    if let Some(attempt) = context.evidence.attempts.iter().rev().find(|attempt| {
        context.steps.iter().any(|step| {
            step.task_number == attempt.task_number && step.step_number == attempt.step_number
        })
    }) {
        return ReviewDispatchCycleTarget::Bound(attempt.task_number, attempt.step_number);
    }
    if let Some(step) = context.steps.iter().rev().find(|step| step.checked) {
        return ReviewDispatchCycleTarget::Bound(step.task_number, step.step_number);
    }
    if let Some(step) = context
        .steps
        .iter()
        .find(|step| step.note_state.is_some() && !step.checked)
    {
        return ReviewDispatchCycleTarget::Bound(step.task_number, step.step_number);
    }
    if !context.evidence.attempts.is_empty()
        && let Some(attempt) = context.evidence.attempts.last()
    {
        return ReviewDispatchCycleTarget::Bound(attempt.task_number, attempt.step_number);
    }
    ReviewDispatchCycleTarget::None
}

fn select_active_learned_topology_guidance(
    records: &[ExecutionTopologyDowngradeRecord],
    plan_revision: u32,
    execution_context_key: &str,
) -> Option<LearnedTopologyGuidance> {
    records
        .iter()
        .rev()
        .find(|record| {
            record.source_plan_revision == plan_revision
                && record.execution_context_key == execution_context_key
                && !record.rerun_guidance_superseded
        })
        .map(|record| LearnedTopologyGuidance {
            approved_plan_revision: plan_revision,
            execution_context_key: record.execution_context_key.clone(),
            primary_reason_class: record.primary_reason_class.as_str().to_owned(),
        })
}

pub fn write_plan_execution_schema(output_dir: &Path) -> Result<(), JsonFailure> {
    fs::create_dir_all(output_dir).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not create schema directory {}: {error}",
                output_dir.display()
            ),
        )
    })?;
    let schema = schema_for!(PlanExecutionStatus);
    let payload = serde_json::to_string_pretty(&schema).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!("Could not serialize plan execution schema: {error}"),
        )
    })?;
    fs::write(
        output_dir.join("plan-execution-status.schema.json"),
        payload,
    )
    .map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!("Could not write plan execution schema: {error}"),
        )
    })?;
    Ok(())
}

pub fn load_execution_context(
    runtime: &ExecutionRuntime,
    plan_path: &Path,
) -> Result<ExecutionContext, JsonFailure> {
    load_execution_context_with_legacy_policy(runtime, plan_path, LegacyEvidencePolicy::Reject)
}

pub(crate) fn load_execution_context_for_mutation(
    runtime: &ExecutionRuntime,
    plan_path: &Path,
) -> Result<ExecutionContext, JsonFailure> {
    load_execution_context_with_legacy_policy(runtime, plan_path, LegacyEvidencePolicy::Allow)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum LegacyEvidencePolicy {
    Reject,
    Allow,
}

fn load_execution_context_with_legacy_policy(
    runtime: &ExecutionRuntime,
    plan_path: &Path,
    legacy_evidence_policy: LegacyEvidencePolicy,
) -> Result<ExecutionContext, JsonFailure> {
    let plan_rel = normalize_plan_path(plan_path)?;
    let plan_abs = runtime.repo_root.join(&plan_rel);
    if !plan_abs.is_file() {
        return Err(JsonFailure::new(
            FailureClass::InvalidCommandInput,
            "Approved plan file does not exist.",
        ));
    }

    let plan_document = parse_plan_file(&plan_abs).map_err(|_| {
        JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan headers are missing or malformed.",
        )
    })?;
    if plan_document.workflow_state != "Engineering Approved" {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Plan is not Engineering Approved.",
        ));
    }
    match plan_document.execution_mode.as_str() {
        "none" | "featureforge:executing-plans" | "featureforge:subagent-driven-development" => {}
        _ => {
            return Err(JsonFailure::new(
                FailureClass::PlanNotExecutionReady,
                "Execution Mode header is missing, malformed, or out of range.",
            ));
        }
    }
    if plan_document.last_reviewed_by != "plan-eng-review" {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan Last Reviewed By header is missing or malformed.",
        ));
    }
    if plan_document.tasks.iter().any(|task| task.files.is_empty()) {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan tasks require a parseable Files block.",
        ));
    }

    let plan_source = fs::read_to_string(&plan_abs).map_err(|error| {
        JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            format!(
                "Could not read approved plan {}: {error}",
                plan_abs.display()
            ),
        )
    })?;
    let steps = parse_step_state(&plan_source, &plan_document)?;

    let source_spec_path = runtime.repo_root.join(&plan_document.source_spec_path);
    let source_spec_source = fs::read_to_string(&source_spec_path).map_err(|_| {
        JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan source spec does not exist.",
        )
    })?;
    let matching_manifest = matching_workflow_manifest(runtime);
    validate_source_spec(
        &source_spec_source,
        &plan_document.source_spec_path,
        plan_document.source_spec_revision,
        runtime,
        matching_manifest.as_ref(),
    )?;
    validate_unique_approved_plan(
        &plan_rel,
        &plan_document.source_spec_path,
        plan_document.source_spec_revision,
        runtime,
        matching_manifest.as_ref(),
    )?;

    let evidence_rel = derive_evidence_rel_path(&plan_rel, plan_document.plan_revision);
    let evidence_abs = runtime.repo_root.join(&evidence_rel);
    let evidence = parse_evidence_file(
        &evidence_abs,
        &plan_rel,
        plan_document.plan_revision,
        &plan_document.source_spec_path,
        plan_document.source_spec_revision,
    )?;

    if legacy_evidence_policy == LegacyEvidencePolicy::Reject
        && evidence.format == EvidenceFormat::Legacy
        && !evidence.attempts.is_empty()
    {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Legacy pre-harness execution evidence is no longer accepted; regenerate execution evidence using the harness v2 format.",
        ));
    }

    if plan_document.execution_mode == "none" && !evidence.attempts.is_empty() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Execution evidence history cannot exist while Execution Mode is none.",
        ));
    }

    if plan_document.execution_mode == "none"
        && (steps.iter().any(|step| step.checked)
            || steps.iter().any(|step| step.note_state.is_some()))
    {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Newly approved plan revisions must start execution-clean.",
        ));
    }

    let execution_fingerprint =
        compute_execution_fingerprint(&plan_source, evidence.source.as_deref());
    let tasks_by_number = plan_document
        .tasks
        .iter()
        .cloned()
        .map(|task| (task.number, task))
        .collect();

    for attempt in &evidence.attempts {
        if !steps.iter().any(|step| {
            step.task_number == attempt.task_number && step.step_number == attempt.step_number
        }) {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Execution evidence references a task/step that does not exist in the approved plan.",
            ));
        }
        normalize_source(&attempt.execution_source, &plan_document.execution_mode).map_err(
            |_| {
                JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence source must match the persisted execution mode.",
                )
            },
        )?;
    }

    Ok(ExecutionContext {
        runtime: runtime.clone(),
        plan_rel,
        plan_abs,
        plan_document,
        plan_source,
        steps,
        tasks_by_number,
        evidence_rel,
        evidence_abs,
        evidence,
        source_spec_source,
        source_spec_path,
        execution_fingerprint,
    })
}

pub fn validate_expected_fingerprint(
    context: &ExecutionContext,
    expected: &str,
) -> Result<(), JsonFailure> {
    if context.execution_fingerprint != expected {
        return Err(JsonFailure::new(
            FailureClass::StaleMutation,
            "Execution state changed since the last parsed execution fingerprint.",
        ));
    }
    Ok(())
}

pub fn status_from_context(context: &ExecutionContext) -> Result<PlanExecutionStatus, JsonFailure> {
    let preflight_acceptance = preflight_acceptance_for_context(context)?;
    let started = execution_started(context);
    let latest_completed = latest_completed_attempt(&context.evidence);
    let warning_codes = Vec::new();
    let execution_run_id = preflight_acceptance
        .as_ref()
        .map(|acceptance| acceptance.execution_run_id.clone());
    let chunk_id = preflight_acceptance
        .as_ref()
        .map(|acceptance| acceptance.chunk_id.clone())
        .unwrap_or_else(|| pending_chunk_id(context));
    let chunking_strategy = preflight_acceptance
        .as_ref()
        .map(|acceptance| acceptance.chunking_strategy);
    let evaluator_policy = preflight_acceptance
        .as_ref()
        .map(|acceptance| acceptance.evaluator_policy.clone());
    let reset_policy = preflight_acceptance
        .as_ref()
        .map(|acceptance| acceptance.reset_policy);
    let review_stack = preflight_acceptance
        .as_ref()
        .map(|acceptance| acceptance.review_stack.clone());

    let mut status = PlanExecutionStatus {
        plan_revision: context.plan_document.plan_revision,
        execution_run_id,
        latest_authoritative_sequence: INITIAL_AUTHORITATIVE_SEQUENCE,
        harness_phase: if started {
            HarnessPhase::Executing
        } else if preflight_acceptance.is_some() {
            HarnessPhase::ExecutionPreflight
        } else {
            HarnessPhase::ImplementationHandoff
        },
        chunk_id,
        chunking_strategy,
        evaluator_policy,
        reset_policy,
        review_stack,
        active_contract_path: None,
        active_contract_fingerprint: None,
        required_evaluator_kinds: Vec::new(),
        completed_evaluator_kinds: Vec::new(),
        pending_evaluator_kinds: Vec::new(),
        non_passing_evaluator_kinds: Vec::new(),
        aggregate_evaluation_state: AggregateEvaluationState::Pending,
        last_evaluation_report_path: None,
        last_evaluation_report_fingerprint: None,
        last_evaluation_evaluator_kind: None,
        last_evaluation_verdict: None,
        current_chunk_retry_count: 0,
        current_chunk_retry_budget: 0,
        current_chunk_pivot_threshold: 0,
        handoff_required: false,
        open_failed_criteria: Vec::new(),
        write_authority_state: String::from("preflight_pending"),
        write_authority_holder: None,
        write_authority_worktree: None,
        repo_state_baseline_head_sha: None,
        repo_state_baseline_worktree_fingerprint: None,
        repo_state_drift_state: String::from("preflight_pending"),
        dependency_index_state: String::from("missing"),
        final_review_state: DownstreamFreshnessState::NotRequired,
        browser_qa_state: DownstreamFreshnessState::NotRequired,
        release_docs_state: DownstreamFreshnessState::NotRequired,
        last_final_review_artifact_fingerprint: None,
        last_browser_qa_artifact_fingerprint: None,
        last_release_docs_artifact_fingerprint: None,
        strategy_state: String::from("checkpoint_missing"),
        last_strategy_checkpoint_fingerprint: None,
        strategy_checkpoint_kind: String::from("none"),
        strategy_reset_required: false,
        reason_codes: Vec::new(),
        execution_mode: context.plan_document.execution_mode.clone(),
        execution_fingerprint: context.execution_fingerprint.clone(),
        evidence_path: context.evidence_rel.clone(),
        execution_started: if started {
            String::from("yes")
        } else {
            String::from("no")
        },
        warning_codes,
        latest_packet_fingerprint: latest_completed
            .and_then(|attempt| attempt.packet_fingerprint.clone()),
        latest_head_sha: latest_completed.and_then(|attempt| attempt.head_sha.clone()),
        latest_base_sha: latest_completed.and_then(|attempt| attempt.base_sha.clone()),
        active_task: active_step(context, NoteState::Active).map(|step| step.task_number),
        active_step: active_step(context, NoteState::Active).map(|step| step.step_number),
        blocking_task: active_step(context, NoteState::Blocked).map(|step| step.task_number),
        blocking_step: active_step(context, NoteState::Blocked).map(|step| step.step_number),
        resume_task: active_step(context, NoteState::Interrupted).map(|step| step.task_number),
        resume_step: active_step(context, NoteState::Interrupted).map(|step| step.step_number),
    };

    apply_authoritative_status_overlay(context, &mut status)?;
    apply_task_boundary_status_overlay(context, &mut status);
    Ok(status)
}

fn apply_authoritative_status_overlay(
    context: &ExecutionContext,
    status: &mut PlanExecutionStatus,
) -> Result<(), JsonFailure> {
    let state_path = authoritative_state_path(context);
    let Some(overlay) = load_status_authoritative_overlay_checked(context)? else {
        return Ok(());
    };

    if let Some(phase) = normalize_optional_overlay_value(overlay.harness_phase.as_deref()) {
        status.harness_phase = parse_harness_phase(phase).ok_or_else(|| {
            malformed_overlay_field(
                &state_path,
                "harness_phase",
                phase,
                "must be one of the public harness phases",
            )
        })?;
    }

    if let Some(chunk_id) = normalize_optional_overlay_value(overlay.chunk_id.as_deref()) {
        status.chunk_id = ChunkId::new(chunk_id.to_owned());
    }

    if let Some(sequence) = overlay
        .latest_authoritative_sequence
        .or(overlay.authoritative_sequence)
    {
        status.latest_authoritative_sequence = sequence;
    }

    let (active_contract_path, active_contract_fingerprint) = parse_overlay_active_contract_fields(
        overlay.active_contract_path.as_deref(),
        overlay.active_contract_fingerprint.as_deref(),
        &state_path,
    )?;
    status.active_contract_path = active_contract_path;
    status.active_contract_fingerprint = active_contract_fingerprint;

    status.required_evaluator_kinds = parse_evaluator_kinds(
        &overlay.required_evaluator_kinds,
        "required_evaluator_kinds",
        &state_path,
    )?;
    status.completed_evaluator_kinds = parse_evaluator_kinds(
        &overlay.completed_evaluator_kinds,
        "completed_evaluator_kinds",
        &state_path,
    )?;
    status.pending_evaluator_kinds = parse_evaluator_kinds(
        &overlay.pending_evaluator_kinds,
        "pending_evaluator_kinds",
        &state_path,
    )?;
    status.non_passing_evaluator_kinds = parse_evaluator_kinds(
        &overlay.non_passing_evaluator_kinds,
        "non_passing_evaluator_kinds",
        &state_path,
    )?;

    if let Some(value) =
        normalize_optional_overlay_value(overlay.aggregate_evaluation_state.as_deref())
    {
        status.aggregate_evaluation_state =
            parse_aggregate_evaluation_state(value).ok_or_else(|| {
                malformed_overlay_field(
                    &state_path,
                    "aggregate_evaluation_state",
                    value,
                    "must be pass, fail, blocked, or pending",
                )
            })?;
    }

    status.last_evaluation_report_path = overlay
        .last_evaluation_report_path
        .filter(|value| !value.trim().is_empty());
    status.last_evaluation_report_fingerprint = overlay
        .last_evaluation_report_fingerprint
        .filter(|value| !value.trim().is_empty());
    status.last_evaluation_evaluator_kind = parse_optional_evaluator_kind(
        overlay.last_evaluation_evaluator_kind.as_deref(),
        "last_evaluation_evaluator_kind",
        &state_path,
    )?;
    status.last_evaluation_verdict = parse_optional_evaluation_verdict(
        overlay.last_evaluation_verdict.as_deref(),
        "last_evaluation_verdict",
        &state_path,
    )?;

    if let Some(value) = overlay.current_chunk_retry_count {
        status.current_chunk_retry_count = value;
    }
    if let Some(value) = overlay.current_chunk_retry_budget {
        status.current_chunk_retry_budget = value;
    }
    if let Some(value) = overlay.current_chunk_pivot_threshold {
        status.current_chunk_pivot_threshold = value;
    }
    if let Some(value) = overlay.handoff_required {
        status.handoff_required = value;
    }
    if !overlay.open_failed_criteria.is_empty() {
        status.open_failed_criteria = overlay.open_failed_criteria;
    }
    if let Some(value) = normalize_optional_overlay_value(overlay.write_authority_state.as_deref())
    {
        status.write_authority_state = value.to_owned();
    }
    status.write_authority_holder = overlay
        .write_authority_holder
        .filter(|value| !value.trim().is_empty());
    status.write_authority_worktree = overlay
        .write_authority_worktree
        .filter(|value| !value.trim().is_empty());
    status.repo_state_baseline_head_sha = overlay
        .repo_state_baseline_head_sha
        .filter(|value| !value.trim().is_empty());
    status.repo_state_baseline_worktree_fingerprint = overlay
        .repo_state_baseline_worktree_fingerprint
        .filter(|value| !value.trim().is_empty());
    if let Some(value) = normalize_optional_overlay_value(overlay.repo_state_drift_state.as_deref())
    {
        status.repo_state_drift_state = value.to_owned();
    }
    if let Some(value) = normalize_optional_overlay_value(overlay.dependency_index_state.as_deref())
    {
        status.dependency_index_state = value.to_owned();
    }
    if let Some(value) = parse_optional_downstream_freshness_state(
        overlay.final_review_state.as_deref(),
        "final_review_state",
        &state_path,
    )? {
        status.final_review_state = value;
    }
    if let Some(value) = parse_optional_downstream_freshness_state(
        overlay.browser_qa_state.as_deref(),
        "browser_qa_state",
        &state_path,
    )? {
        status.browser_qa_state = value;
    }
    if let Some(value) = parse_optional_downstream_freshness_state(
        overlay.release_docs_state.as_deref(),
        "release_docs_state",
        &state_path,
    )? {
        status.release_docs_state = value;
    }
    status.last_final_review_artifact_fingerprint = overlay
        .last_final_review_artifact_fingerprint
        .filter(|value| !value.trim().is_empty());
    status.last_browser_qa_artifact_fingerprint = overlay
        .last_browser_qa_artifact_fingerprint
        .filter(|value| !value.trim().is_empty());
    status.last_release_docs_artifact_fingerprint = overlay
        .last_release_docs_artifact_fingerprint
        .filter(|value| !value.trim().is_empty());
    if let Some(value) = normalize_optional_overlay_value(overlay.strategy_state.as_deref()) {
        status.strategy_state = value.to_owned();
    }
    status.last_strategy_checkpoint_fingerprint = overlay
        .last_strategy_checkpoint_fingerprint
        .filter(|value| !value.trim().is_empty());
    if let Some(value) =
        normalize_optional_overlay_value(overlay.strategy_checkpoint_kind.as_deref())
    {
        status.strategy_checkpoint_kind = value.to_owned();
    }
    if let Some(value) = overlay.strategy_reset_required {
        status.strategy_reset_required = value;
    }
    if !overlay.reason_codes.is_empty() {
        status.reason_codes =
            parse_reason_codes(&overlay.reason_codes, "reason_codes", &state_path)?;
    }

    Ok(())
}

fn normalize_optional_overlay_value(value: Option<&str>) -> Option<&str> {
    value.map(str::trim).filter(|value| !value.is_empty())
}

fn apply_task_boundary_status_overlay(context: &ExecutionContext, status: &mut PlanExecutionStatus) {
    if status.active_task.is_some() || status.blocking_task.is_some() || status.resume_task.is_some()
    {
        return;
    }
    let Some(next_unchecked_task) = context
        .steps
        .iter()
        .find(|step| !step.checked)
        .map(|step| step.task_number)
    else {
        return;
    };
    let Some(prior_task) = prior_task_number_for_begin(context, next_unchecked_task) else {
        return;
    };
    let Err(error) = require_prior_task_closure_for_begin(context, next_unchecked_task) else {
        return;
    };
    if let Some(reason_code) = task_boundary_reason_code_from_message(&error.message)
        && !status
            .reason_codes
            .iter()
            .any(|existing| existing == reason_code)
    {
        status.reason_codes.push(reason_code.to_owned());
    }
    status.blocking_task = Some(prior_task);
}

fn parse_harness_phase(value: &str) -> Option<HarnessPhase> {
    match value {
        "implementation_handoff" => Some(HarnessPhase::ImplementationHandoff),
        "execution_preflight" => Some(HarnessPhase::ExecutionPreflight),
        "contract_drafting" => Some(HarnessPhase::ContractDrafting),
        "contract_pending_approval" => Some(HarnessPhase::ContractPendingApproval),
        "contract_approved" => Some(HarnessPhase::ContractApproved),
        "executing" => Some(HarnessPhase::Executing),
        "evaluating" => Some(HarnessPhase::Evaluating),
        "repairing" => Some(HarnessPhase::Repairing),
        "pivot_required" => Some(HarnessPhase::PivotRequired),
        "handoff_required" => Some(HarnessPhase::HandoffRequired),
        "final_review_pending" => Some(HarnessPhase::FinalReviewPending),
        "qa_pending" => Some(HarnessPhase::QaPending),
        "document_release_pending" => Some(HarnessPhase::DocumentReleasePending),
        "ready_for_branch_completion" => Some(HarnessPhase::ReadyForBranchCompletion),
        _ => None,
    }
}

fn parse_aggregate_evaluation_state(value: &str) -> Option<AggregateEvaluationState> {
    match value {
        "pass" => Some(AggregateEvaluationState::Pass),
        "fail" => Some(AggregateEvaluationState::Fail),
        "blocked" => Some(AggregateEvaluationState::Blocked),
        "pending" => Some(AggregateEvaluationState::Pending),
        _ => None,
    }
}

fn parse_downstream_freshness_state(value: &str) -> Option<DownstreamFreshnessState> {
    match value {
        "not_required" => Some(DownstreamFreshnessState::NotRequired),
        "missing" => Some(DownstreamFreshnessState::Missing),
        "fresh" => Some(DownstreamFreshnessState::Fresh),
        "stale" => Some(DownstreamFreshnessState::Stale),
        _ => None,
    }
}

fn parse_overlay_active_contract_fields(
    active_contract_path: Option<&str>,
    active_contract_fingerprint: Option<&str>,
    state_path: &Path,
) -> Result<(Option<String>, Option<String>), JsonFailure> {
    let active_contract_path =
        normalize_optional_overlay_value(active_contract_path).map(str::to_owned);
    let active_contract_fingerprint =
        normalize_optional_overlay_value(active_contract_fingerprint).map(str::to_owned);

    let (Some(active_contract_path), Some(active_contract_fingerprint)) = (
        active_contract_path.clone(),
        active_contract_fingerprint.clone(),
    ) else {
        if active_contract_path.is_some() || active_contract_fingerprint.is_some() {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Authoritative harness state must set active_contract_path and active_contract_fingerprint together in {}.",
                    state_path.display()
                ),
            ));
        }
        return Ok((None, None));
    };

    if active_contract_path.contains('/') || active_contract_path.contains('\\') {
        return Err(malformed_overlay_field(
            state_path,
            "active_contract_path",
            &active_contract_path,
            "must be a single authoritative artifact file name",
        ));
    }

    let expected_file = format!("contract-{active_contract_fingerprint}.md");
    if active_contract_path != expected_file {
        let expectation = format!("must match `{expected_file}`");
        return Err(malformed_overlay_field(
            state_path,
            "active_contract_path",
            &active_contract_path,
            &expectation,
        ));
    }

    Ok((
        Some(active_contract_path),
        Some(active_contract_fingerprint),
    ))
}

fn malformed_overlay_field(
    state_path: &Path,
    field_name: &str,
    value: &str,
    expectation: &str,
) -> JsonFailure {
    JsonFailure::new(
        FailureClass::MalformedExecutionState,
        format!(
            "Authoritative harness state field `{field_name}` is malformed in {}: `{value}` ({expectation}).",
            state_path.display()
        ),
    )
}

fn parse_evaluator_kinds(
    values: &[String],
    field_name: &str,
    state_path: &Path,
) -> Result<Vec<EvaluatorKind>, JsonFailure> {
    values
        .iter()
        .map(|value| {
            let value = value.trim();
            parse_evaluator_kind(value).ok_or_else(|| {
                malformed_overlay_field(
                    state_path,
                    field_name,
                    value,
                    "must contain only spec_compliance or code_quality",
                )
            })
        })
        .collect()
}

fn parse_evaluator_kind(value: &str) -> Option<EvaluatorKind> {
    match value {
        "spec_compliance" => Some(EvaluatorKind::SpecCompliance),
        "code_quality" => Some(EvaluatorKind::CodeQuality),
        _ => None,
    }
}

fn parse_evaluation_verdict(value: &str) -> Option<EvaluationVerdict> {
    match value {
        "pass" => Some(EvaluationVerdict::Pass),
        "fail" => Some(EvaluationVerdict::Fail),
        "blocked" => Some(EvaluationVerdict::Blocked),
        _ => None,
    }
}

fn parse_optional_evaluator_kind(
    value: Option<&str>,
    field_name: &str,
    state_path: &Path,
) -> Result<Option<EvaluatorKind>, JsonFailure> {
    let Some(value) = normalize_optional_overlay_value(value) else {
        return Ok(None);
    };
    parse_evaluator_kind(value).map(Some).ok_or_else(|| {
        malformed_overlay_field(
            state_path,
            field_name,
            value,
            "must be spec_compliance or code_quality",
        )
    })
}

fn parse_optional_evaluation_verdict(
    value: Option<&str>,
    field_name: &str,
    state_path: &Path,
) -> Result<Option<EvaluationVerdict>, JsonFailure> {
    let Some(value) = normalize_optional_overlay_value(value) else {
        return Ok(None);
    };
    parse_evaluation_verdict(value).map(Some).ok_or_else(|| {
        malformed_overlay_field(
            state_path,
            field_name,
            value,
            "must be pass, fail, or blocked",
        )
    })
}

fn parse_optional_downstream_freshness_state(
    value: Option<&str>,
    field_name: &str,
    state_path: &Path,
) -> Result<Option<DownstreamFreshnessState>, JsonFailure> {
    let Some(value) = normalize_optional_overlay_value(value) else {
        return Ok(None);
    };
    parse_downstream_freshness_state(value)
        .map(Some)
        .ok_or_else(|| {
            malformed_overlay_field(
                state_path,
                field_name,
                value,
                "must be not_required, missing, fresh, or stale",
            )
        })
}

fn parse_reason_codes(
    values: &[String],
    field_name: &str,
    state_path: &Path,
) -> Result<Vec<String>, JsonFailure> {
    values
        .iter()
        .map(|value| {
            let value = value.trim();
            if value.is_empty() {
                return Err(malformed_overlay_field(
                    state_path,
                    field_name,
                    "<empty>",
                    "must contain non-empty strings",
                ));
            }
            Ok(value.to_owned())
        })
        .collect()
}

pub fn require_preflight_acceptance(context: &ExecutionContext) -> Result<(), JsonFailure> {
    crate::execution::topology::require_preflight_acceptance(context)
}

pub fn preflight_from_context(context: &ExecutionContext) -> GateResult {
    let mut gate = GateState::default();
    match preflight_write_authority_state(context) {
        Ok(PreflightWriteAuthorityState::Clear) => {}
        Ok(PreflightWriteAuthorityState::Conflict) => gate.fail(
            FailureClass::ExecutionStateNotReady,
            "write_authority_conflict",
            "Execution preflight cannot continue while another runtime writer holds write authority.",
            "Retry once the active writer releases write authority.",
        ),
        Err(error) => gate.fail(
            FailureClass::ExecutionStateNotReady,
            "write_authority_unavailable",
            error.message,
            "Restore write-authority lock access before retrying preflight.",
        ),
    }

    match preflight_requires_authoritative_handoff(context) {
        Ok(true) => gate.fail(
            FailureClass::ExecutionStateNotReady,
            "authoritative_handoff_required",
            "Execution preflight cannot continue while authoritative harness state requires handoff.",
            "Publish a valid handoff (or clear handoff_required in authoritative state) before retrying preflight.",
        ),
        Ok(false) => {}
        Err(error) => gate.fail(
            FailureClass::ExecutionStateNotReady,
            "authoritative_state_unavailable",
            error.message,
            "Restore authoritative harness state readability and validity before retrying preflight.",
        ),
    }
    match preflight_requires_authoritative_mutation_recovery(context) {
        Ok(true) => gate.fail(
            FailureClass::ExecutionStateNotReady,
            "authoritative_mutation_recovery_required",
            "Execution preflight cannot continue while authoritative artifact history is ahead of persisted harness state.",
            "Recover interrupted authoritative mutation state before retrying preflight.",
        ),
        Ok(false) => {}
        Err(error) => gate.fail(
            FailureClass::ExecutionStateNotReady,
            "authoritative_state_unavailable",
            error.message,
            "Restore authoritative harness state and artifact readability before retrying preflight.",
        ),
    }

    if let Some(step) = active_step(context, NoteState::Active) {
        gate.fail(
            FailureClass::ExecutionStateNotReady,
            "active_step_in_progress",
            format!(
                "Execution preflight cannot continue while Task {} Step {} is already active.",
                step.task_number, step.step_number
            ),
            "Resume or resolve the active step first.",
        );
    }
    if let Some(step) = active_step(context, NoteState::Blocked) {
        gate.fail(
            FailureClass::ExecutionStateNotReady,
            "blocked_step",
            format!(
                "Execution preflight cannot continue while Task {} Step {} is blocked.",
                step.task_number, step.step_number
            ),
            "Resolve the blocked step first.",
        );
    }
    if let Some(step) = active_step(context, NoteState::Interrupted) {
        gate.fail(
            FailureClass::ExecutionStateNotReady,
            "interrupted_work_unresolved",
            format!(
                "Execution preflight cannot continue while Task {} Step {} remains interrupted.",
                step.task_number, step.step_number
            ),
            "Resume or explicitly resolve the interrupted step first.",
        );
    }

    match repo_head_detached(context) {
        Ok(true) => gate.fail(
            FailureClass::WorkspaceNotSafe,
            "detached_head",
            "Execution preflight requires a branch-based workspace.",
            "Check out a branch before continuing execution.",
        ),
        Ok(false) => {}
        Err(error) => gate.fail(
            FailureClass::WorkspaceNotSafe,
            "branch_unavailable",
            error.message,
            "Restore repository availability before continuing execution.",
        ),
    }
    match RepoSafetyRuntime::discover(&context.runtime.repo_root) {
        Ok(runtime) => {
            let args = RepoSafetyCheckArgs {
                intent: RepoSafetyIntentArg::Write,
                stage: repo_safety_stage(context),
                task_id: Some(context.plan_rel.clone()),
                paths: vec![context.plan_rel.clone()],
                write_targets: vec![RepoSafetyWriteTargetArg::ExecutionTaskSlice],
            };
            match runtime.check(&args) {
                Ok(result) if result.outcome == "blocked" => gate.fail(
                    FailureClass::WorkspaceNotSafe,
                    &result.reason,
                    repo_safety_preflight_message(&result),
                    repo_safety_preflight_remediation(&result),
                ),
                Ok(_) => {}
                Err(error) => gate.fail(
                    FailureClass::WorkspaceNotSafe,
                    "repo_safety_unavailable",
                    error.message(),
                    "Restore repo-safety availability before continuing execution.",
                ),
            }
        }
        Err(error) => gate.fail(
            FailureClass::WorkspaceNotSafe,
            "repo_safety_unavailable",
            error.message(),
            "Restore repo-safety availability before continuing execution.",
        ),
    }
    match repo_has_tracked_worktree_changes(&context.runtime.repo_root) {
        Ok(true) => gate.fail(
            FailureClass::WorkspaceNotSafe,
            "tracked_worktree_dirty",
            "Execution preflight does not allow tracked worktree changes.",
            "Commit or discard tracked worktree changes before continuing execution.",
        ),
        Ok(false) => {}
        Err(error) => gate.fail(
            FailureClass::WorkspaceNotSafe,
            "worktree_state_unavailable",
            error.message,
            "Restore repository status inspection before continuing execution.",
        ),
    }

    if context.runtime.git_dir.join("MERGE_HEAD").exists() {
        gate.fail(
            FailureClass::WorkspaceNotSafe,
            "merge_in_progress",
            "Execution preflight does not allow an in-progress merge.",
            "Resolve or abort the merge before continuing.",
        );
    }
    if context.runtime.git_dir.join("rebase-merge").exists()
        || context.runtime.git_dir.join("rebase-apply").exists()
    {
        gate.fail(
            FailureClass::WorkspaceNotSafe,
            "rebase_in_progress",
            "Execution preflight does not allow an in-progress rebase.",
            "Resolve or abort the rebase before continuing.",
        );
    }
    if context.runtime.git_dir.join("CHERRY_PICK_HEAD").exists() {
        gate.fail(
            FailureClass::WorkspaceNotSafe,
            "cherry_pick_in_progress",
            "Execution preflight does not allow an in-progress cherry-pick.",
            "Resolve or abort the cherry-pick before continuing.",
        );
    }
    match repo_has_unresolved_index_entries(&context.runtime.repo_root) {
        Ok(true) => gate.fail(
            FailureClass::WorkspaceNotSafe,
            "unresolved_index_entries",
            "Execution preflight does not allow unresolved index entries.",
            "Resolve index conflicts before continuing.",
        ),
        Ok(false) => {}
        Err(error) => gate.fail(
            FailureClass::WorkspaceNotSafe,
            "index_unavailable",
            error.message,
            "Restore repository index availability before continuing execution.",
        ),
    }

    gate.finish()
}

pub fn gate_review_from_context(context: &ExecutionContext) -> GateResult {
    gate_review_from_context_internal(context, true)
}

fn gate_review_from_context_internal(
    context: &ExecutionContext,
    enforce_authoritative_late_gate_truth: bool,
) -> GateResult {
    let mut gate = GateState::default();
    if let Some(step) = active_step(context, NoteState::Active) {
        gate.fail(
            FailureClass::ExecutionStateNotReady,
            "active_step_in_progress",
            format!(
                "Final review is blocked while Task {} Step {} remains active.",
                step.task_number, step.step_number
            ),
            "Complete, interrupt, or resolve the active step before review.",
        );
    }
    if let Some(step) = active_step(context, NoteState::Blocked) {
        gate.fail(
            FailureClass::ExecutionStateNotReady,
            "blocked_step",
            format!(
                "Final review is blocked while Task {} Step {} remains blocked.",
                step.task_number, step.step_number
            ),
            "Resolve the blocked step before review.",
        );
    }
    if let Some(step) = active_step(context, NoteState::Interrupted) {
        gate.fail(
            FailureClass::ExecutionStateNotReady,
            "interrupted_work_unresolved",
            format!(
                "Final review is blocked while Task {} Step {} remains interrupted.",
                step.task_number, step.step_number
            ),
            "Resume or explicitly resolve the interrupted work before review.",
        );
    }

    if let Some(step) = context.steps.iter().find(|step| !step.checked) {
        gate.fail(
            FailureClass::ExecutionStateNotReady,
            "unfinished_steps_remaining",
            format!(
                "Final review is blocked while Task {} Step {} remains unchecked.",
                step.task_number, step.step_number
            ),
            "Finish all approved plan steps before final review.",
        );
    }

    for step in context.steps.iter().filter(|step| step.checked) {
        let Some(attempt) =
            latest_attempt_for_step(&context.evidence, step.task_number, step.step_number)
        else {
            gate.fail(
                FailureClass::StaleExecutionEvidence,
                "checked_step_missing_evidence",
                format!(
                    "Task {} Step {} is checked but missing execution evidence.",
                    step.task_number, step.step_number
                ),
                "Reopen the step or record matching execution evidence.",
            );
            continue;
        };
        if attempt.status != "Completed" {
            gate.fail(
                FailureClass::StaleExecutionEvidence,
                "checked_step_missing_evidence",
                format!(
                    "Task {} Step {} no longer has a completed evidence attempt.",
                    step.task_number, step.step_number
                ),
                "Reopen the step or complete it again with fresh evidence.",
            );
        }
    }

    if enforce_authoritative_late_gate_truth {
        enforce_review_authoritative_late_gate_truth(context, &mut gate);
    }
    enforce_worktree_lease_binding_truth(context, &mut gate);

    if context.evidence.format == EvidenceFormat::Legacy && !context.evidence.attempts.is_empty() {
        gate.warn("legacy_evidence_format");
    }
    if context.evidence.format == EvidenceFormat::V2 {
        validate_v2_evidence_provenance(context, &mut gate);
    }

    gate.finish()
}

// Barrier reconcile and receipt release:
//   open / review_passed_pending_reconcile
//                    |
//                    v
//       reconcile reviewed checkpoint commit
//                    |
//                    v
//          cleanup_state == cleaned
//                    |
//                    v
//      dependent work may be released at finish
fn enforce_worktree_lease_binding_truth(context: &ExecutionContext, gate: &mut GateState) {
    let authoritative_context = match load_worktree_lease_authoritative_context_checked(context) {
        Ok(Some(context)) => context,
        Ok(None) => {
            let artifacts_dir = crate::paths::harness_authoritative_artifacts_dir(
                &context.runtime.state_dir,
                &context.runtime.repo_slug,
                &context.runtime.branch_name,
            );
            let has_any_binding_artifacts = match fs::read_dir(&artifacts_dir) {
                Ok(entries) => entries.flatten().any(|entry| {
                    entry
                        .path()
                        .file_name()
                        .and_then(|value| value.to_str())
                        .is_some_and(|value| {
                            (value.starts_with("worktree-lease-") && value.ends_with(".json"))
                                || (value.starts_with("unit-review-") && value.ends_with(".md"))
                        })
                }),
                Err(error) if error.kind() == ErrorKind::NotFound => false,
                Err(error) => {
                    gate.fail(
                        FailureClass::MalformedExecutionState,
                        "worktree_lease_artifacts_unreadable",
                        format!(
                            "Could not inspect authoritative worktree leases in {}: {error}",
                            artifacts_dir.display()
                        ),
                        "Restore authoritative worktree lease readability and retry gate-review or gate-finish.",
                    );
                    return;
                }
            };
            if has_any_binding_artifacts {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "worktree_lease_authoritative_state_unavailable",
                    "Authoritative harness state is unavailable for worktree lease gating.",
                    "Restore authoritative harness state readability and retry gate-review or gate-finish.",
                );
            }
            return;
        }
        Err(error) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_state_unavailable",
                error.message,
                "Restore authoritative harness state readability and retry gate-review or gate-finish.",
            );
            return;
        }
    };
    let run_identity = match authoritative_context.run_identity.as_ref() {
        Some(run_identity) => run_identity,
        None => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_run_identity_missing",
                "Authoritative harness state is missing its current run identity.",
                "Restore authoritative harness state readability and retry gate-review or gate-finish.",
            );
            return;
        }
    };
    if run_identity.source_plan_path != context.plan_rel
        || run_identity.source_plan_revision != context.plan_document.plan_revision
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_run_context_mismatch",
            "Authoritative run identity does not match the current plan context.",
            "Restore authoritative harness state readability and retry gate-review or gate-finish.",
        );
        return;
    }

    let Some(active_worktree_lease_fingerprints) =
        authoritative_context.active_worktree_lease_fingerprints
    else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_index_missing",
            "Authoritative harness state is missing the active worktree lease fingerprint index for the current run.",
            "Restore the authoritative worktree lease fingerprints and retry gate-review or gate-finish.",
        );
        return;
    };
    let Some(active_worktree_lease_bindings) = authoritative_context.active_worktree_lease_bindings
    else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_index_missing",
            "Authoritative harness state is missing the active worktree lease binding index for the current run.",
            "Restore the authoritative worktree lease bindings and retry gate-review or gate-finish.",
        );
        return;
    };
    let current_run_fingerprint_count = active_worktree_lease_fingerprints.len();
    let current_run_fingerprints: BTreeSet<String> =
        active_worktree_lease_fingerprints.into_iter().collect();
    if current_run_fingerprints.len() != current_run_fingerprint_count {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_binding_duplicate",
            "Authoritative harness state contains duplicate active worktree lease fingerprints for the current run.",
            "Restore the authoritative worktree lease fingerprints and retry gate-review or gate-finish.",
        );
        return;
    }

    let current_run_bindings = active_worktree_lease_bindings
        .iter()
        .filter(|binding| binding.execution_run_id == run_identity.execution_run_id)
        .collect::<Vec<_>>();
    if current_run_fingerprints.is_empty() {
        let current_run_artifacts_exist = match current_run_worktree_lease_artifacts_exist(
            context,
            &run_identity.execution_run_id,
        ) {
            Ok(value) => value,
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "worktree_lease_artifacts_unreadable",
                    error,
                    "Restore authoritative worktree lease readability and retry gate-review or gate-finish.",
                );
                return;
            }
        };
        if !current_run_bindings.is_empty() || current_run_artifacts_exist {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_binding_missing",
                "Authoritative harness state is missing the active worktree lease fingerprint index for the current run.",
                "Restore the authoritative worktree lease fingerprints and retry gate-review or gate-finish.",
            );
            return;
        }
        if !context.steps.iter().any(|step| step.checked) {
            return;
        }
        let active_contract_overlay = match load_status_authoritative_overlay_checked(context) {
            Ok(Some(overlay)) => overlay,
            Ok(None) => return,
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "worktree_lease_authoritative_state_unavailable",
                    error.message,
                    "Restore authoritative harness state readability and retry gate-review or gate-finish.",
                );
                return;
            }
        };
        let active_contract_path = active_contract_overlay
            .active_contract_path
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty());
        let active_contract_fingerprint = active_contract_overlay
            .active_contract_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty());
        if active_contract_path.is_none() && active_contract_fingerprint.is_none() {
            enforce_plain_unit_review_truth(
                context,
                run_identity.execution_run_id.as_str(),
                gate,
            );
            return;
        }
        let Some((_active_contract_path, active_contract_fingerprint)) =
            load_authoritative_active_contract(context, gate)
        else {
            return;
        };
        enforce_serial_unit_review_truth(context, run_identity, &active_contract_fingerprint, gate);
        return;
    }
    if current_run_bindings.is_empty() {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_binding_missing",
            "Authoritative harness state is missing one or more active worktree lease bindings for the current run.",
            "Restore the authoritative worktree lease bindings and retry gate-review or gate-finish.",
        );
        return;
    }

    let Some((active_contract_path, active_contract_fingerprint)) =
        load_authoritative_active_contract(context, gate)
    else {
        return;
    };
    let active_contract = match read_execution_contract(&active_contract_path) {
        Ok(contract) => contract,
        Err(error) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_contract_unreadable",
                format!(
                    "Authoritative active contract {} is malformed: {error}",
                    active_contract_path.display()
                ),
                "Restore the authoritative active contract and retry gate-review or gate-finish.",
            );
            return;
        }
    };
    if active_contract.contract_fingerprint != active_contract_fingerprint {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_contract_unreadable",
            "Authoritative active contract fingerprint does not match its canonical content.",
            "Restore the authoritative active contract and retry gate-review or gate-finish.",
        );
        return;
    }

    let current_head = match current_head_sha(&context.runtime.repo_root) {
        Ok(head) => head,
        Err(error) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_head_unavailable",
                error.message,
                "Restore repository HEAD inspection and retry gate-review or gate-finish.",
            );
            return;
        }
    };

    let mut binding_counts: BTreeMap<String, usize> = BTreeMap::new();
    let mut binding_by_fingerprint: BTreeMap<String, &WorktreeLeaseBindingProbe> = BTreeMap::new();
    for binding in current_run_bindings.iter().copied() {
        let fingerprint = binding.lease_fingerprint.trim().to_owned();
        if fingerprint.is_empty() || !current_run_fingerprints.contains(&fingerprint) {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_binding_missing",
                "Authoritative harness state contains a worktree lease binding that is not indexed by the current runtime state.",
                "Restore the authoritative worktree lease bindings and retry gate-review or gate-finish.",
            );
            return;
        }
        *binding_counts.entry(fingerprint.clone()).or_insert(0) += 1;
        binding_by_fingerprint.insert(fingerprint, binding);
    }
    if binding_counts.values().any(|count| *count > 1)
        || binding_by_fingerprint.len() != current_run_bindings.len()
        || binding_by_fingerprint.len() != current_run_fingerprints.len()
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_binding_duplicate",
            "Authoritative harness state contains duplicate or missing active worktree lease bindings for the current run.",
            "Restore the authoritative worktree lease bindings and retry gate-review or gate-finish.",
        );
        return;
    }

    for fingerprint in current_run_fingerprints {
        let binding = binding_by_fingerprint
            .get(&fingerprint)
            .expect("binding should exist for each current lease fingerprint");
        let lease_artifact_path = match normalize_authoritative_artifact_binding_path(
            &binding.lease_artifact_path,
            "worktree lease",
            gate,
        ) {
            Some(path) => path,
            None => return,
        };
        let lease_path = crate::paths::harness_authoritative_artifact_path(
            &context.runtime.state_dir,
            &context.runtime.repo_slug,
            &context.runtime.branch_name,
            lease_artifact_path.to_string_lossy().as_ref(),
        );
        let lease_metadata = match fs::symlink_metadata(&lease_path) {
            Ok(metadata) => metadata,
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "worktree_lease_metadata_unreadable",
                    format!(
                        "Could not inspect authoritative worktree lease {}: {error}",
                        lease_path.display()
                    ),
                    "Restore authoritative worktree lease readability and retry gate-review or gate-finish.",
                );
                return;
            }
        };
        if lease_metadata.file_type().is_symlink() || !lease_metadata.is_file() {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_path_not_regular_file",
                format!(
                    "Authoritative worktree lease must be a regular file in {}.",
                    lease_path.display()
                ),
                "Restore authoritative worktree lease readability and retry gate-review or gate-finish.",
            );
            return;
        }

        let source = match fs::read_to_string(&lease_path) {
            Ok(source) => source,
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "worktree_lease_unreadable",
                    format!(
                        "Could not read authoritative worktree lease {}: {error}",
                        lease_path.display()
                    ),
                    "Restore authoritative worktree lease readability and retry gate-review or gate-finish.",
                );
                return;
            }
        };

        let lease: WorktreeLease = match serde_json::from_str(&source) {
            Ok(lease) => lease,
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "worktree_lease_malformed",
                    format!(
                        "Authoritative worktree lease is malformed in {}: {error}",
                        lease_path.display()
                    ),
                    "Repair the authoritative worktree lease artifact and retry gate-review or gate-finish.",
                );
                return;
            }
        };

        let expected_lease_file_name = format!(
            "worktree-lease-{}-{}-{}.json",
            branch_storage_key(&context.runtime.branch_name),
            lease.execution_run_id,
            lease.execution_context_key
        );
        if lease_path.file_name().and_then(|value| value.to_str())
            != Some(expected_lease_file_name.as_str())
        {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_binding_path_invalid",
                "Authoritative worktree lease binding path does not match the canonical runtime-owned filename.",
                "Restore the authoritative worktree lease binding path and retry gate-review or gate-finish.",
            );
            return;
        }

        if lease.lease_fingerprint != fingerprint {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_provenance_unindexed",
                "Authoritative worktree lease fingerprint is not indexed by the current runtime state.",
                "Regenerate the authoritative worktree lease from the current runtime and retry gate-review or gate-finish.",
            );
            return;
        }

        if lease.execution_run_id != run_identity.execution_run_id {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_run_id_mismatch",
                "Authoritative worktree lease body does not match the current execution run.",
                "Regenerate the authoritative worktree lease from the current runtime and retry gate-review or gate-finish.",
            );
            return;
        }
        if !lease_applies_to_current_plan_context(context, &lease) {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_plan_context_mismatch",
                "Authoritative worktree lease does not match the current plan and execution context.",
                "Regenerate the authoritative worktree lease from the current runtime and retry gate-review or gate-finish.",
            );
            return;
        }
        if let Err(error) = validate_worktree_lease(&lease) {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_validation_failed",
                error.message,
                "Repair the authoritative worktree lease artifact and retry gate-review or gate-finish.",
            );
            return;
        }
        if authoritative_context
            .repo_state_baseline_head_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .is_none()
        {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_state_missing",
                "Authoritative harness state is missing the baseline head provenance required for worktree lease gating.",
                "Restore the authoritative worktree lease baseline provenance and retry gate-review or gate-finish.",
            );
            return;
        }
        if authoritative_context
            .repo_state_baseline_worktree_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .is_none()
        {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_state_missing",
                "Authoritative harness state is missing the baseline worktree provenance required for worktree lease gating.",
                "Restore the authoritative worktree lease baseline provenance and retry gate-review or gate-finish.",
            );
            return;
        }
        let expected_execution_context_key = worktree_lease_execution_context_key(
            &run_identity.execution_run_id,
            &lease.execution_unit_id,
            context.plan_rel.as_str(),
            context.plan_document.plan_revision,
            &lease.authoritative_integration_branch,
            lease
                .reviewed_checkpoint_commit_sha
                .as_deref()
                .unwrap_or("open"),
        );
        if lease.execution_context_key.trim() != expected_execution_context_key {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_execution_context_key_mismatch",
                "Authoritative worktree lease body does not match the current execution context.",
                "Regenerate the authoritative worktree lease from the current runtime context and retry gate-review or gate-finish.",
            );
            return;
        }
        if !validate_authoritative_worktree_lease_fingerprint(
            &source,
            &lease,
            lease_path.display().to_string(),
            gate,
        ) {
            return;
        }

        match lease.lease_state {
            WorktreeLeaseState::Open => {
                gate.fail(
                    FailureClass::ExecutionStateNotReady,
                    "worktree_lease_open",
                    "An authoritative worktree lease remains open.",
                    "Reconcile and clean the worktree lease before rerunning gate-review or gate-finish.",
                );
                return;
            }
            WorktreeLeaseState::ReviewPassedPendingReconcile => {
                gate.fail(
                    FailureClass::ExecutionStateNotReady,
                    "worktree_lease_reconcile_pending",
                    "An authoritative worktree lease has passed review but not yet been reconciled.",
                    "Reconcile the reviewed checkpoint back onto the active branch before rerunning gate-review or gate-finish.",
                );
                return;
            }
            WorktreeLeaseState::Reconciled | WorktreeLeaseState::Cleaned => {
                let Some(review_receipt_fingerprint) = binding
                    .review_receipt_fingerprint
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_review_receipt_missing",
                        "An authoritative unit-review receipt is required before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current reviewed checkpoint and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let Some(approved_task_packet_fingerprint) = binding
                    .approved_task_packet_fingerprint
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_review_receipt_task_packet_missing",
                        "An authoritative unit-review receipt is required to bind the approved task packet before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current approved task packet and retry gate-review or gate-finish.",
                    );
                    return;
                };
                if !active_contract
                    .source_task_packet_fingerprints
                    .iter()
                    .any(|candidate| candidate == approved_task_packet_fingerprint)
                {
                    gate.fail(
                        FailureClass::MalformedExecutionState,
                        "worktree_lease_review_receipt_task_packet_not_authoritative",
                        "The authoritative unit-review receipt does not bind a task packet from the current authoritative contract.",
                        "Record the authoritative unit-review receipt for the current approved task packet and retry gate-review or gate-finish.",
                    );
                    return;
                }
                let Some(approved_unit_contract_fingerprint) = binding
                    .approved_unit_contract_fingerprint
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_review_receipt_unit_contract_missing",
                        "An authoritative unit-review receipt is required to bind the approved unit contract before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current approved unit contract and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let expected_approved_unit_contract_fingerprint =
                    approved_unit_contract_fingerprint_for_review(
                        active_contract_fingerprint.as_str(),
                        approved_task_packet_fingerprint,
                        lease.execution_unit_id.as_str(),
                    );
                if approved_unit_contract_fingerprint != expected_approved_unit_contract_fingerprint
                {
                    gate.fail(
                        FailureClass::MalformedExecutionState,
                        "worktree_lease_review_receipt_unit_contract_mismatch",
                        "The authoritative unit-review receipt does not bind the canonical approved unit contract fingerprint.",
                        "Record the authoritative unit-review receipt for the current approved unit contract and retry gate-review or gate-finish.",
                    );
                    return;
                }
                let Some(reviewed_checkpoint_commit_sha) = binding
                    .reviewed_checkpoint_commit_sha
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_review_receipt_missing",
                        "An authoritative unit-review receipt is required to bind the reviewed checkpoint before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current reviewed checkpoint and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let Some(reconcile_mode) = binding
                    .reconcile_mode
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_reconcile_mode_missing",
                        "An authoritative unit-review receipt is required to bind the identity-preserving reconcile mode before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current identity-preserving reconcile and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let Some(reconcile_result_commit_sha) = binding
                    .reconcile_result_commit_sha
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_identity_preserving_proof_missing",
                        "An authoritative unit-review receipt is required to bind the exact reconciled commit before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current exact reconciled commit and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let Some(reconcile_result_proof_fingerprint) = binding
                    .reconcile_result_proof_fingerprint
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_identity_preserving_proof_missing",
                        "An authoritative unit-review receipt is required to bind the exact reconciled commit object before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current exact reconciled commit object and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let Some(expected_reconcile_result_commit_sha) = lease
                    .reconcile_result_commit_sha
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_identity_preserving_proof_missing",
                        "An authoritative worktree lease is missing the exact reconciled commit proof required to release dependent work.",
                        "Regenerate the authoritative worktree lease from the recorded identity-preserving reconcile and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let Some(expected_reconcile_result_proof_fingerprint) = lease
                    .reconcile_result_proof_fingerprint
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_identity_preserving_proof_missing",
                        "An authoritative worktree lease is missing the exact reconciled commit object proof required to release dependent work.",
                        "Regenerate the authoritative worktree lease from the recorded identity-preserving reconcile and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let Some(computed_reconcile_result_proof_fingerprint) =
                    reconcile_result_proof_fingerprint_for_review(
                        &context.runtime.repo_root,
                        expected_reconcile_result_commit_sha,
                    )
                else {
                    gate.fail(
                        FailureClass::MalformedExecutionState,
                        "worktree_lease_identity_preserving_proof_unverifiable",
                        "The authoritative worktree lease exact reconcile proof could not be verified against repository history.",
                        "Regenerate the authoritative worktree lease from the recorded identity-preserving reconcile and retry gate-review or gate-finish.",
                    );
                    return;
                };
                if expected_reconcile_result_proof_fingerprint
                    != computed_reconcile_result_proof_fingerprint
                {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_identity_preserving_lease_proof_mismatch",
                        "The authoritative worktree lease exact reconciled commit object proof does not match the reviewed reconcile proof.",
                        "Regenerate the authoritative worktree lease from the recorded identity-preserving reconcile and retry gate-review or gate-finish.",
                    );
                    return;
                }
                if reconcile_result_proof_fingerprint != computed_reconcile_result_proof_fingerprint
                {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_identity_preserving_proof_mismatch",
                        "The authoritative worktree lease exact reconciled commit object does not match the authoritative unit-review receipt.",
                        "Regenerate the authoritative worktree lease from the recorded unit-review receipt and retry gate-review or gate-finish.",
                    );
                    return;
                }
                let Some(review_receipt_path_name) = binding
                    .review_receipt_artifact_path
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                else {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_review_receipt_missing",
                        "An authoritative unit-review receipt is required before a cleaned worktree lease can release dependent work.",
                        "Record the authoritative unit-review receipt for the current reviewed checkpoint and retry gate-review or gate-finish.",
                    );
                    return;
                };
                let review_receipt_path_name = match normalize_authoritative_artifact_binding_path(
                    review_receipt_path_name,
                    "unit-review receipt",
                    gate,
                ) {
                    Some(path) => path,
                    None => return,
                };
                let review_receipt_path = crate::paths::harness_authoritative_artifact_path(
                    &context.runtime.state_dir,
                    &context.runtime.repo_slug,
                    &context.runtime.branch_name,
                    review_receipt_path_name.to_string_lossy().as_ref(),
                );
                let review_metadata = match fs::symlink_metadata(&review_receipt_path) {
                    Ok(metadata) => metadata,
                    Err(error) => {
                        gate.fail(
                            FailureClass::ExecutionStateNotReady,
                            "worktree_lease_review_receipt_missing",
                            format!(
                                "Could not inspect authoritative unit-review receipt {}: {error}",
                                review_receipt_path.display()
                            ),
                            "Record the authoritative unit-review receipt for the current reviewed checkpoint and retry gate-review or gate-finish.",
                        );
                        return;
                    }
                };
                if review_metadata.file_type().is_symlink() || !review_metadata.is_file() {
                    gate.fail(
                        FailureClass::MalformedExecutionState,
                        "worktree_lease_review_receipt_path_not_regular_file",
                        format!(
                            "Authoritative unit-review receipt must be a regular file in {}.",
                            review_receipt_path.display()
                        ),
                        "Restore the authoritative unit-review receipt and retry gate-review or gate-finish.",
                        );
                    return;
                }
                let expected_review_receipt_filename = format!(
                    "unit-review-{}-{}.md",
                    run_identity.execution_run_id,
                    lease.execution_unit_id.trim_start_matches("unit-")
                );
                if review_receipt_path
                    .file_name()
                    .and_then(|value| value.to_str())
                    != Some(expected_review_receipt_filename.as_str())
                {
                    gate.fail(
                        FailureClass::MalformedExecutionState,
                        "worktree_lease_binding_path_invalid",
                        "Authoritative unit-review receipt binding path does not match the reviewed execution unit provenance.",
                        "Restore the authoritative unit-review receipt binding path and retry gate-review or gate-finish.",
                    );
                    return;
                }
                let review_source = match fs::read_to_string(&review_receipt_path) {
                    Ok(source) => source,
                    Err(error) => {
                        gate.fail(
                            FailureClass::ExecutionStateNotReady,
                            "worktree_lease_review_receipt_unreadable",
                            format!(
                                "Could not read authoritative unit-review receipt {}: {error}",
                                review_receipt_path.display()
                            ),
                            "Restore the authoritative unit-review receipt and retry gate-review or gate-finish.",
                        );
                        return;
                    }
                };
                let (receipt_checkpoint_commit_sha, receipt_reconciled_result_commit_sha) =
                    match validate_authoritative_unit_review_receipt(
                        context,
                        &run_identity.execution_run_id,
                        &lease,
                        &review_source,
                        &review_receipt_path,
                        UnitReviewReceiptExpectations {
                            expected_execution_context_key: &expected_execution_context_key,
                            expected_fingerprint: review_receipt_fingerprint,
                            expected_task_packet_fingerprint: approved_task_packet_fingerprint,
                            expected_approved_unit_contract_fingerprint:
                                approved_unit_contract_fingerprint,
                            expected_reconcile_result_commit_sha,
                        },
                        gate,
                    ) {
                        Some(values) => values,
                        None => return,
                    };

                if reviewed_checkpoint_commit_sha != receipt_checkpoint_commit_sha {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_identity_preserving_provenance_mismatch",
                        "Authoritative worktree lease reviewed checkpoint does not match the runtime-owned unit-review binding.",
                        "Regenerate the authoritative worktree lease from the recorded unit-review receipt and retry gate-review or gate-finish.",
                    );
                    return;
                }
                if reconcile_result_commit_sha != receipt_reconciled_result_commit_sha {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_identity_preserving_proof_mismatch",
                        "Authoritative worktree lease reconciled result does not match the runtime-owned unit-review binding.",
                        "Regenerate the authoritative worktree lease from the recorded unit-review receipt and retry gate-review or gate-finish.",
                    );
                    return;
                }
                if binding
                    .execution_context_key
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    != Some(expected_execution_context_key.as_str())
                {
                    gate.fail(
                        FailureClass::MalformedExecutionState,
                        "worktree_lease_execution_context_key_mismatch",
                        "Authoritative worktree lease binding does not match the current execution context.",
                        "Regenerate the authoritative worktree lease binding from the current runtime context and retry gate-review or gate-finish.",
                    );
                    return;
                }
                if reconcile_mode != "identity_preserving"
                    || lease.reconcile_mode.trim() != "identity_preserving"
                {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_identity_preserving_reconcile_mode_mismatch",
                        "Authoritative worktree lease does not prove an identity-preserving reconcile.",
                        "Regenerate the authoritative worktree lease from the recorded identity-preserving reconcile and retry gate-review or gate-finish.",
                    );
                    return;
                }

                if lease.reviewed_checkpoint_commit_sha.as_deref()
                    != Some(receipt_checkpoint_commit_sha.as_str())
                {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_review_receipt_checkpoint_mismatch",
                        "Authoritative worktree lease reviewed checkpoint does not match the authoritative unit-review receipt.",
                        "Regenerate the authoritative worktree lease from the recorded unit-review receipt and retry gate-review or gate-finish.",
                    );
                    return;
                }
                if Some(lease.repo_state_baseline_head_sha.as_str())
                    != authoritative_context
                        .repo_state_baseline_head_sha
                        .as_deref()
                        .map(str::trim)
                        .filter(|value| !value.is_empty())
                {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_identity_preserving_provenance_mismatch",
                        "Authoritative worktree lease baseline head provenance does not match the current authoritative baseline.",
                        "Regenerate the authoritative worktree lease from the identity-preserving reviewed checkpoint and retry gate-review or gate-finish.",
                    );
                    return;
                }
                if Some(lease.repo_state_baseline_worktree_fingerprint.as_str())
                    != authoritative_context
                        .repo_state_baseline_worktree_fingerprint
                        .as_deref()
                        .map(str::trim)
                        .filter(|value| !value.is_empty())
                {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_identity_preserving_provenance_mismatch",
                        "Authoritative worktree lease baseline worktree provenance does not match the current authoritative baseline.",
                        "Regenerate the authoritative worktree lease from the identity-preserving reviewed checkpoint and retry gate-review or gate-finish.",
                    );
                    return;
                }
                if !is_ancestor_commit(
                    &context.runtime.repo_root,
                    &receipt_checkpoint_commit_sha,
                    reconcile_result_commit_sha,
                ) {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_checkpoint_mismatch",
                        "Authoritative worktree lease reconciled result is not descended from the reviewed checkpoint.",
                        "Reconcile the reviewed checkpoint back onto the active branch history and rerun gate-review or gate-finish with a fresh lease.",
                    );
                    return;
                }
                if !is_ancestor_commit(
                    &context.runtime.repo_root,
                    reconcile_result_commit_sha,
                    &current_head,
                ) {
                    gate.fail(
                        FailureClass::StaleProvenance,
                        "worktree_lease_checkpoint_mismatch",
                        "Authoritative worktree lease reconciled result is not contained in the current branch history.",
                        "Reconcile the reviewed checkpoint back onto the active branch history and rerun gate-review or gate-finish with a fresh lease.",
                    );
                    return;
                }
                if lease.cleanup_state.trim() != "cleaned" {
                    gate.fail(
                        FailureClass::ExecutionStateNotReady,
                        "worktree_lease_cleanup_pending",
                        "Authoritative worktree lease has not been cleaned up yet.",
                        "Clean the temporary worktree before rerunning gate-review or gate-finish.",
                    );
                    return;
                }
            }
        }
    }
}

fn load_worktree_lease_authoritative_context_checked(
    context: &ExecutionContext,
) -> Result<Option<WorktreeLeaseAuthoritativeContextProbe>, JsonFailure> {
    let state_path = authoritative_state_path(context);
    let metadata = match fs::symlink_metadata(&state_path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(error) => {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not inspect authoritative harness state {}: {error}",
                    state_path.display()
                ),
            ));
        }
    };
    if metadata.file_type().is_symlink() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state path must not be a symlink in {}.",
                state_path.display()
            ),
        ));
    }
    if !metadata.is_file() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state must be a regular file in {}.",
                state_path.display()
            ),
        ));
    }

    let source = fs::read_to_string(&state_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Could not read authoritative harness state {}: {error}",
                state_path.display()
            ),
        )
    })?;
    let context: WorktreeLeaseAuthoritativeContextProbe =
        serde_json::from_str(&source).map_err(|error| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Authoritative harness state is malformed in {}: {error}",
                    state_path.display()
                ),
            )
        })?;
    Ok(Some(context))
}

fn lease_applies_to_current_plan_context(
    context: &ExecutionContext,
    lease: &WorktreeLease,
) -> bool {
    lease.source_plan_path == context.plan_rel
        && lease.source_plan_revision == context.plan_document.plan_revision
        && lease.authoritative_integration_branch == context.runtime.branch_name
        && !lease.source_branch.trim().is_empty()
}

fn normalize_authoritative_artifact_binding_path(
    raw_path: &str,
    artifact_kind: &str,
    gate: &mut GateState,
) -> Option<PathBuf> {
    let trimmed = raw_path.trim();
    let mut components = Path::new(trimmed).components();
    match (components.next(), components.next()) {
        (Some(Component::Normal(component)), None) => {
            let filename = component.to_string_lossy();
            if filename.is_empty() {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "worktree_lease_binding_path_invalid",
                    format!(
                        "Authoritative {artifact_kind} binding path must be a normalized relative filename."
                    ),
                    format!(
                        "Restore the authoritative {artifact_kind} binding path and retry gate-review or gate-finish."
                    ),
                );
                None
            } else {
                Some(PathBuf::from(filename.as_ref()))
            }
        }
        _ => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_binding_path_invalid",
                format!(
                    "Authoritative {artifact_kind} binding path must be a normalized relative filename."
                ),
                format!(
                    "Restore the authoritative {artifact_kind} binding path and retry gate-review or gate-finish."
                ),
            );
            None
        }
    }
}

fn current_run_worktree_lease_artifacts_exist(
    context: &ExecutionContext,
    execution_run_id: &str,
) -> Result<bool, String> {
    let artifacts_dir = crate::paths::harness_authoritative_artifacts_dir(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    let entries = match fs::read_dir(&artifacts_dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(false),
        Err(error) => {
            return Err(format!(
                "Could not inspect authoritative worktree leases in {}: {error}",
                artifacts_dir.display()
            ));
        }
    };
    for entry in entries {
        let entry = entry.map_err(|error| {
            format!(
                "Could not inspect authoritative worktree leases in {}: {error}",
                artifacts_dir.display()
            )
        })?;
        let file_path = entry.path();
        let Some(file_name) = file_path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        if !file_name.ends_with(".json") {
            continue;
        }
        let canonical_prefix = format!(
            "worktree-lease-{}-{}-",
            branch_storage_key(&context.runtime.branch_name),
            execution_run_id
        );
        let canonical_candidate = file_name.starts_with(&canonical_prefix);
        let metadata = match fs::symlink_metadata(&file_path) {
            Ok(metadata) => metadata,
            Err(error) if canonical_candidate => {
                return Err(format!(
                    "Could not inspect authoritative worktree lease {}: {error}",
                    file_path.display()
                ));
            }
            Err(_) => continue,
        };
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            if canonical_candidate {
                return Err(format!(
                    "Authoritative worktree lease must be a regular file in {}.",
                    file_path.display()
                ));
            }
            continue;
        }
        let Ok(source) = fs::read_to_string(&file_path) else {
            if canonical_candidate {
                return Err(format!(
                    "Could not read authoritative worktree lease {}.",
                    file_path.display()
                ));
            }
            continue;
        };
        let lease = match serde_json::from_str::<WorktreeLease>(&source) {
            Ok(lease) => lease,
            Err(error) if canonical_candidate => {
                return Err(format!(
                    "Authoritative worktree lease is malformed in {}: {error}",
                    file_path.display()
                ));
            }
            Err(_) => continue,
        };
        let matches_current_run = lease.execution_run_id == execution_run_id
            && lease.source_plan_path == context.plan_rel
            && lease.source_plan_revision == context.plan_document.plan_revision
            && lease.authoritative_integration_branch == context.runtime.branch_name;
        if !matches_current_run {
            if canonical_candidate {
                return Err(format!(
                    "Authoritative worktree lease {} does not match the current run context.",
                    file_path.display()
                ));
            }
            continue;
        }
        let reviewed_checkpoint_commit_sha = lease
            .reviewed_checkpoint_commit_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("open");
        let expected_execution_context_key = worktree_lease_execution_context_key(
            execution_run_id,
            lease.execution_unit_id.as_str(),
            context.plan_rel.as_str(),
            context.plan_document.plan_revision,
            lease.authoritative_integration_branch.as_str(),
            reviewed_checkpoint_commit_sha,
        );
        if lease.execution_context_key != expected_execution_context_key {
            if canonical_candidate {
                return Err(format!(
                    "Authoritative worktree lease {} does not match the current execution context.",
                    file_path.display()
                ));
            }
            continue;
        }
        if let Err(error) = validate_worktree_lease(&lease) {
            if canonical_candidate || matches_current_run {
                return Err(error.message);
            }
            continue;
        }
        return Ok(true);
    }
    Ok(false)
}

fn current_run_plain_unit_review_receipt_paths(
    context: &ExecutionContext,
    execution_run_id: &str,
) -> Result<Vec<PathBuf>, String> {
    let artifacts_dir = crate::paths::harness_authoritative_artifacts_dir(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    let entries = match fs::read_dir(&artifacts_dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => {
            return Err(format!(
                "Could not inspect authoritative unit-review receipts in {}: {error}",
                artifacts_dir.display()
            ));
        }
    };
    let canonical_prefix = format!("unit-review-{execution_run_id}-task-");
    let mut receipt_paths = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|error| {
            format!(
                "Could not inspect authoritative unit-review receipts in {}: {error}",
                artifacts_dir.display()
            )
        })?;
        let file_path = entry.path();
        let Some(file_name) = file_path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        if file_name.starts_with(&canonical_prefix) && file_name.ends_with(".md") {
            receipt_paths.push(file_path);
        }
    }
    receipt_paths.sort();
    Ok(receipt_paths)
}

fn enforce_plain_unit_review_truth(
    context: &ExecutionContext,
    execution_run_id: &str,
    gate: &mut GateState,
) {
    let current_run_receipts = match current_run_plain_unit_review_receipt_paths(
        context,
        execution_run_id,
    ) {
        Ok(paths) => paths,
        Err(error) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "plain_unit_review_receipts_unreadable",
                error,
                "Restore authoritative unit-review receipt readability and retry gate-review or gate-finish.",
            );
            return;
        }
    };
    if current_run_receipts.is_empty() {
        return;
    }

    let expected_strategy_checkpoint_fingerprint =
        match authoritative_strategy_checkpoint_fingerprint_checked(context) {
            Ok(Some(fingerprint)) if !fingerprint.trim().is_empty() => fingerprint,
            Ok(_) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "plain_unit_review_receipt_strategy_checkpoint_missing",
                    "Authoritative strategy checkpoint provenance is missing for current-run unit-review receipt validation.",
                    "Restore authoritative strategy checkpoint provenance and retry gate-review or gate-finish.",
                );
                return;
            }
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "plain_unit_review_receipt_strategy_checkpoint_missing",
                    error.message,
                    "Restore authoritative strategy checkpoint provenance and retry gate-review or gate-finish.",
                );
                return;
            }
        };

    let latest_attempts = latest_completed_attempts_by_step(&context.evidence);
    let expected_receipt_paths = context
        .steps
        .iter()
        .filter(|step| step.checked)
        .map(|step| {
            (
                authoritative_unit_review_receipt_path(
                    context,
                    execution_run_id,
                    step.task_number,
                    step.step_number,
                )
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_owned(),
                (step.task_number, step.step_number),
            )
        })
        .collect::<BTreeMap<_, _>>();

    for receipt_path in current_run_receipts {
        let Some(receipt_file_name) = receipt_path
            .file_name()
            .and_then(|value| value.to_str())
            .map(str::to_owned)
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "plain_unit_review_receipt_malformed",
                "A current-run unit-review receipt has an unreadable filename.",
                "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
            );
            return;
        };
        let Some((task_number, step_number)) = expected_receipt_paths.get(&receipt_file_name).copied()
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "plain_unit_review_receipt_malformed",
                format!(
                    "Current-run unit-review receipt {} does not match any checked plan step.",
                    receipt_path.display()
                ),
                "Remove or repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
            );
            return;
        };
        let Some(attempt_index) = latest_attempts.get(&(task_number, step_number)).copied() else {
            gate.fail(
                FailureClass::StaleExecutionEvidence,
                "plain_unit_review_receipt_provenance_mismatch",
                format!(
                    "Current-run unit-review receipt {} has no completed evidence attempt to validate against.",
                    receipt_path.display()
                ),
                "Rebuild the execution evidence for the affected step and retry gate-review or gate-finish.",
            );
            return;
        };
        let attempt = &context.evidence.attempts[attempt_index];
        let Some(expected_task_packet_fingerprint) = attempt
            .packet_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "plain_unit_review_receipt_malformed",
                format!(
                    "Task {} Step {} is missing packet fingerprint provenance required to validate plain unit-review receipts.",
                    task_number, step_number
                ),
                "Repair the execution evidence for the affected step and retry gate-review or gate-finish.",
            );
            return;
        };
        let Some(expected_reviewed_checkpoint_sha) = attempt
            .head_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "plain_unit_review_receipt_malformed",
                format!(
                    "Task {} Step {} is missing reviewed checkpoint provenance required to validate plain unit-review receipts.",
                    task_number, step_number
                ),
                "Repair the execution evidence for the affected step and retry gate-review or gate-finish.",
            );
            return;
        };
        let review_source = match fs::read_to_string(&receipt_path) {
            Ok(source) => source,
            Err(error) => {
                gate.fail(
                    FailureClass::ExecutionStateNotReady,
                    "plain_unit_review_receipt_unreadable",
                    format!(
                        "Could not read current-run unit-review receipt {}: {error}",
                        receipt_path.display()
                    ),
                    "Restore the authoritative unit-review receipt and retry gate-review or gate-finish.",
                );
                return;
            }
        };
        if !validate_plain_unit_review_receipt(
            context,
            execution_run_id,
            &review_source,
            &receipt_path,
            PlainUnitReviewReceiptExpectations {
                expected_strategy_checkpoint_fingerprint: expected_strategy_checkpoint_fingerprint
                    .as_str(),
                expected_task_packet_fingerprint,
                expected_reviewed_checkpoint_sha,
                expected_execution_unit_id: serial_execution_unit_id(task_number, step_number),
            },
            gate,
        ) {
            return;
        }
    }
}

fn validate_authoritative_worktree_lease_fingerprint(
    source: &str,
    lease: &WorktreeLease,
    lease_path: String,
    gate: &mut GateState,
) -> bool {
    let Some(canonical_fingerprint) = canonical_worktree_lease_fingerprint(source) else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_fingerprint_unverifiable",
            format!(
                "Authoritative worktree lease fingerprint is unverifiable in {}.",
                lease_path
            ),
            "Repair the authoritative worktree lease artifact and retry gate-review or gate-finish.",
        );
        return false;
    };

    if canonical_fingerprint != lease.lease_fingerprint {
        gate.fail(
            FailureClass::ArtifactIntegrityMismatch,
            "worktree_lease_fingerprint_mismatch",
            format!(
                "Authoritative worktree lease fingerprint does not match canonical content in {}.",
                lease_path
            ),
            "Regenerate the authoritative worktree lease artifact from canonical content and retry gate-review or gate-finish.",
        );
        return false;
    }

    true
}

fn load_authoritative_active_contract(
    context: &ExecutionContext,
    gate: &mut GateState,
) -> Option<(PathBuf, String)> {
    let overlay = match load_status_authoritative_overlay_checked(context) {
        Ok(Some(overlay)) => overlay,
        Ok(None) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_state_unavailable",
                "Authoritative harness state is unavailable for execution-unit review gating.",
                "Restore authoritative harness state readability and retry gate-review or gate-finish.",
            );
            return None;
        }
        Err(error) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_state_unavailable",
                error.message,
                "Restore authoritative harness state readability and retry gate-review or gate-finish.",
            );
            return None;
        }
    };
    let Some(active_contract_path) = overlay
        .active_contract_path
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_contract_missing",
            "Authoritative harness state is missing the active contract path required to validate execution-unit review provenance.",
            "Restore the authoritative active contract and retry gate-review or gate-finish.",
        );
        return None;
    };
    let Some(active_contract_fingerprint) = overlay
        .active_contract_fingerprint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_contract_missing",
            "Authoritative harness state is missing the active contract fingerprint required to validate execution-unit review provenance.",
            "Restore the authoritative active contract and retry gate-review or gate-finish.",
        );
        return None;
    };
    if active_contract_path.contains('/') || active_contract_path.contains('\\') {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_contract_path_invalid",
            "Authoritative active contract path must be a normalized relative filename.",
            "Restore the authoritative active contract path and retry gate-review or gate-finish.",
        );
        return None;
    }
    let expected_contract_filename = format!("contract-{active_contract_fingerprint}.md");
    if active_contract_path != expected_contract_filename {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_contract_path_invalid",
            "Authoritative active contract path does not match the active contract fingerprint-derived filename.",
            "Restore the authoritative active contract path and retry gate-review or gate-finish.",
        );
        return None;
    }
    let active_contract_path = crate::paths::harness_authoritative_artifact_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
        active_contract_path,
    );
    let active_contract_metadata = match fs::symlink_metadata(&active_contract_path) {
        Ok(metadata) => metadata,
        Err(error) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "worktree_lease_authoritative_contract_unreadable",
                format!(
                    "Could not inspect authoritative active contract {}: {error}",
                    active_contract_path.display()
                ),
                "Restore the authoritative active contract and retry gate-review or gate-finish.",
            );
            return None;
        }
    };
    if active_contract_metadata.file_type().is_symlink() || !active_contract_metadata.is_file() {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_authoritative_contract_unreadable",
            format!(
                "Authoritative active contract must be a regular file in {}.",
                active_contract_path.display()
            ),
            "Restore the authoritative active contract and retry gate-review or gate-finish.",
        );
        return None;
    }
    Some((active_contract_path, active_contract_fingerprint.to_owned()))
}

fn canonical_worktree_lease_fingerprint(source: &str) -> Option<String> {
    let mut value: serde_json::Value = serde_json::from_str(source).ok()?;
    let object = value.as_object_mut()?;
    object.remove("lease_fingerprint");
    serde_json::to_vec(&value)
        .ok()
        .map(|bytes| sha256_hex(&bytes))
}

fn worktree_lease_execution_context_key(
    execution_run_id: &str,
    execution_unit_id: &str,
    source_plan_path: &str,
    source_plan_revision: u32,
    authoritative_integration_branch: &str,
    reviewed_checkpoint_commit_sha: &str,
) -> String {
    sha256_hex(
        format!(
            "run={execution_run_id}\nunit={execution_unit_id}\nplan={source_plan_path}\nplan_revision={source_plan_revision}\nbranch={authoritative_integration_branch}\nreviewed_checkpoint={reviewed_checkpoint_commit_sha}\n"
        )
        .as_bytes(),
    )
}

fn serial_execution_unit_id(task_number: u32, step_number: u32) -> String {
    format!("task-{task_number}-step-{step_number}")
}

fn serial_unit_review_lease_fingerprint(
    execution_run_id: &str,
    execution_unit_id: &str,
    execution_context_key: &str,
    reviewed_checkpoint_commit_sha: &str,
    approved_task_packet_fingerprint: &str,
    approved_unit_contract_fingerprint: &str,
) -> String {
    sha256_hex(
        format!(
            "serial-unit-review:{execution_run_id}:{execution_unit_id}:{execution_context_key}:{reviewed_checkpoint_commit_sha}:{approved_task_packet_fingerprint}:{approved_unit_contract_fingerprint}"
        )
        .as_bytes(),
    )
}

fn approved_unit_contract_fingerprint_for_review(
    active_contract_fingerprint: &str,
    approved_task_packet_fingerprint: &str,
    execution_unit_id: &str,
) -> String {
    sha256_hex(
        format!(
            "approved-unit-contract:{active_contract_fingerprint}:{approved_task_packet_fingerprint}:{execution_unit_id}"
        )
            .as_bytes(),
    )
}

fn reconcile_result_proof_fingerprint_for_review(
    repo_root: &Path,
    reconcile_result_commit_sha: &str,
) -> Option<String> {
    let output = Command::new("git")
        .current_dir(repo_root)
        .args(["cat-file", "commit", reconcile_result_commit_sha])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let object = String::from_utf8(output.stdout).ok()?;
    Some(sha256_hex(object.as_bytes()))
}

fn enforce_serial_unit_review_truth(
    context: &ExecutionContext,
    run_identity: &WorktreeLeaseRunIdentityProbe,
    active_contract_fingerprint: &str,
    gate: &mut GateState,
) {
    let latest_attempts = latest_completed_attempts_by_step(&context.evidence);
    for step in context.steps.iter().filter(|step| step.checked) {
        let Some(attempt_index) = latest_attempts
            .get(&(step.task_number, step.step_number))
            .copied()
        else {
            continue;
        };
        let attempt = &context.evidence.attempts[attempt_index];
        let Some(approved_task_packet_fingerprint) = attempt
            .packet_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "serial_unit_review_task_packet_missing",
                format!(
                    "Task {} Step {} is missing the packet fingerprint required for serial unit-review gating.",
                    step.task_number, step.step_number
                ),
                "Rebuild the execution evidence for the completed step and retry gate-review or gate-finish.",
            );
            return;
        };
        let Some(reviewed_checkpoint_commit_sha) = attempt
            .head_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "serial_unit_review_head_missing",
                format!(
                    "Task {} Step {} is missing the reviewed checkpoint SHA required for serial unit-review gating.",
                    step.task_number, step.step_number
                ),
                "Rebuild the execution evidence for the completed step and retry gate-review or gate-finish.",
            );
            return;
        };
        let execution_unit_id = serial_execution_unit_id(step.task_number, step.step_number);
        let expected_execution_context_key = worktree_lease_execution_context_key(
            &run_identity.execution_run_id,
            &execution_unit_id,
            &context.plan_rel,
            context.plan_document.plan_revision,
            &context.runtime.branch_name,
            reviewed_checkpoint_commit_sha,
        );
        let approved_unit_contract_fingerprint = approved_unit_contract_fingerprint_for_review(
            active_contract_fingerprint,
            approved_task_packet_fingerprint,
            &execution_unit_id,
        );
        let Some(reconcile_result_proof_fingerprint) =
            reconcile_result_proof_fingerprint_for_review(
                &context.runtime.repo_root,
                reviewed_checkpoint_commit_sha,
            )
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "serial_unit_review_reconcile_proof_unverifiable",
                format!(
                    "Task {} Step {} serial unit-review reconcile proof could not be verified against repository history.",
                    step.task_number, step.step_number
                ),
                "Restore repository history readability and retry gate-review or gate-finish.",
            );
            return;
        };
        let review_receipt_path = crate::paths::harness_authoritative_artifact_path(
            &context.runtime.state_dir,
            &context.runtime.repo_slug,
            &context.runtime.branch_name,
            &format!(
                "unit-review-{}-{}.md",
                run_identity.execution_run_id, execution_unit_id
            ),
        );
        let review_metadata = match fs::symlink_metadata(&review_receipt_path) {
            Ok(metadata) => metadata,
            Err(error) => {
                gate.fail(
                    FailureClass::ExecutionStateNotReady,
                    "serial_unit_review_receipt_missing",
                    format!(
                        "Task {} Step {} is missing its authoritative serial unit-review receipt {}: {error}",
                        step.task_number,
                        step.step_number,
                        review_receipt_path.display()
                    ),
                    "Record a dedicated-independent serial unit-review receipt for the completed execution unit and retry gate-review or gate-finish.",
                );
                return;
            }
        };
        if review_metadata.file_type().is_symlink() || !review_metadata.is_file() {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "serial_unit_review_receipt_path_invalid",
                format!(
                    "Task {} Step {} serial unit-review receipt must be a regular file in {}.",
                    step.task_number,
                    step.step_number,
                    review_receipt_path.display()
                ),
                "Restore the authoritative serial unit-review receipt and retry gate-review or gate-finish.",
            );
            return;
        }
        let review_source = match fs::read_to_string(&review_receipt_path) {
            Ok(source) => source,
            Err(error) => {
                gate.fail(
                    FailureClass::ExecutionStateNotReady,
                    "serial_unit_review_receipt_unreadable",
                    format!(
                        "Could not read authoritative serial unit-review receipt {}: {error}",
                        review_receipt_path.display()
                    ),
                    "Restore the authoritative serial unit-review receipt and retry gate-review or gate-finish.",
                );
                return;
            }
        };
        let Some(review_receipt_fingerprint) =
            canonical_unit_review_receipt_fingerprint(&review_source)
        else {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "serial_unit_review_receipt_fingerprint_unverifiable",
                format!(
                    "Task {} Step {} serial unit-review receipt fingerprint is unverifiable in {}.",
                    step.task_number,
                    step.step_number,
                    review_receipt_path.display()
                ),
                "Regenerate the authoritative serial unit-review receipt from canonical content and retry gate-review or gate-finish.",
            );
            return;
        };
        let pseudo_lease = WorktreeLease {
            lease_version: WORKTREE_LEASE_VERSION,
            authoritative_sequence: INITIAL_AUTHORITATIVE_SEQUENCE + 1,
            execution_run_id: run_identity.execution_run_id.clone(),
            execution_context_key: expected_execution_context_key.clone(),
            source_plan_path: context.plan_rel.clone(),
            source_plan_revision: context.plan_document.plan_revision,
            execution_unit_id: execution_unit_id.clone(),
            source_branch: context.runtime.branch_name.clone(),
            authoritative_integration_branch: context.runtime.branch_name.clone(),
            worktree_path: fs::canonicalize(&context.runtime.repo_root)
                .unwrap_or_else(|_| context.runtime.repo_root.clone())
                .display()
                .to_string(),
            repo_state_baseline_head_sha: reviewed_checkpoint_commit_sha.to_owned(),
            repo_state_baseline_worktree_fingerprint: approved_task_packet_fingerprint.to_owned(),
            lease_state: WorktreeLeaseState::Cleaned,
            cleanup_state: String::from("cleaned"),
            reviewed_checkpoint_commit_sha: Some(reviewed_checkpoint_commit_sha.to_owned()),
            reconcile_result_commit_sha: Some(reviewed_checkpoint_commit_sha.to_owned()),
            reconcile_result_proof_fingerprint: Some(reconcile_result_proof_fingerprint.clone()),
            reconcile_mode: String::from("identity_preserving"),
            generated_by: String::from("featureforge:executing-plans"),
            generated_at: String::from("runtime-derived"),
            lease_fingerprint: serial_unit_review_lease_fingerprint(
                &run_identity.execution_run_id,
                &execution_unit_id,
                &expected_execution_context_key,
                reviewed_checkpoint_commit_sha,
                approved_task_packet_fingerprint,
                &approved_unit_contract_fingerprint,
            ),
        };
        let (receipt_checkpoint_commit_sha, receipt_reconciled_result_commit_sha) =
            match validate_authoritative_unit_review_receipt(
                context,
                &run_identity.execution_run_id,
                &pseudo_lease,
                &review_source,
                &review_receipt_path,
                UnitReviewReceiptExpectations {
                    expected_execution_context_key: &expected_execution_context_key,
                    expected_fingerprint: &review_receipt_fingerprint,
                    expected_task_packet_fingerprint: approved_task_packet_fingerprint,
                    expected_approved_unit_contract_fingerprint:
                        &approved_unit_contract_fingerprint,
                    expected_reconcile_result_commit_sha: reviewed_checkpoint_commit_sha,
                },
                gate,
            ) {
                Some(values) => values,
                None => return,
            };
        if receipt_checkpoint_commit_sha != reviewed_checkpoint_commit_sha {
            gate.fail(
                FailureClass::StaleProvenance,
                "serial_unit_review_receipt_checkpoint_mismatch",
                format!(
                    "Task {} Step {} serial unit-review receipt does not bind the completed step checkpoint.",
                    step.task_number, step.step_number
                ),
                "Regenerate the authoritative serial unit-review receipt from the completed step checkpoint and retry gate-review or gate-finish.",
            );
            return;
        }
        if receipt_reconciled_result_commit_sha != reviewed_checkpoint_commit_sha {
            gate.fail(
                FailureClass::StaleProvenance,
                "serial_unit_review_receipt_reconcile_result_mismatch",
                format!(
                    "Task {} Step {} serial unit-review receipt does not bind the completed step result commit.",
                    step.task_number, step.step_number
                ),
                "Regenerate the authoritative serial unit-review receipt from the completed step result and retry gate-review or gate-finish.",
            );
            return;
        }
    }
}

struct UnitReviewReceiptExpectations<'a> {
    expected_execution_context_key: &'a str,
    expected_fingerprint: &'a str,
    expected_task_packet_fingerprint: &'a str,
    expected_approved_unit_contract_fingerprint: &'a str,
    expected_reconcile_result_commit_sha: &'a str,
}

struct PlainUnitReviewReceiptExpectations<'a> {
    expected_strategy_checkpoint_fingerprint: &'a str,
    expected_task_packet_fingerprint: &'a str,
    expected_reviewed_checkpoint_sha: &'a str,
    expected_execution_unit_id: String,
}

fn validate_authoritative_unit_review_receipt(
    context: &ExecutionContext,
    execution_run_id: &str,
    lease: &WorktreeLease,
    source: &str,
    receipt_path: &Path,
    expectations: UnitReviewReceiptExpectations<'_>,
    gate: &mut GateState,
) -> Option<(String, String)> {
    let review_document = parse_artifact_document(receipt_path);
    if review_document.title.as_deref() != Some("# Unit Review Result") {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_malformed",
            "The authoritative unit-review receipt is malformed.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Review Stage")
        .map(String::as_str)
        != Some("featureforge:unit-review")
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_stage_mismatch",
            "The authoritative unit-review receipt has the wrong review stage.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Reviewer Provenance")
        .map(String::as_str)
        != Some("dedicated-independent")
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_not_dedicated",
            "The authoritative unit-review receipt is not dedicated-independent.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Source Plan")
        .map(String::as_str)
        != Some(context.plan_rel.as_str())
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_plan_mismatch",
            "The authoritative unit-review receipt does not match the current plan.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Source Plan Revision")
        .and_then(|value| value.parse::<u32>().ok())
        != Some(context.plan_document.plan_revision)
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_plan_revision_mismatch",
            "The authoritative unit-review receipt does not match the current plan revision.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Execution Run ID")
        .map(String::as_str)
        != Some(execution_run_id)
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_run_mismatch",
            "The authoritative unit-review receipt does not match the current execution run.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Execution Unit ID")
        .map(String::as_str)
        != Some(lease.execution_unit_id.as_str())
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_unit_mismatch",
            "The authoritative unit-review receipt does not match the reviewed execution unit.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Lease Fingerprint")
        .map(String::as_str)
        != Some(lease.lease_fingerprint.as_str())
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_lease_fingerprint_mismatch",
            "The authoritative unit-review receipt does not match the reviewed lease fingerprint.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Execution Context Key")
        .map(String::as_str)
        != Some(expectations.expected_execution_context_key)
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_context_key_mismatch",
            "The authoritative unit-review receipt does not match the current execution context.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Approved Task Packet Fingerprint")
        .map(String::as_str)
        != Some(expectations.expected_task_packet_fingerprint)
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_task_packet_mismatch",
            "The authoritative unit-review receipt does not match the approved task packet.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Approved Unit Contract Fingerprint")
        .map(String::as_str)
        != Some(expectations.expected_approved_unit_contract_fingerprint)
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_unit_contract_mismatch",
            "The authoritative unit-review receipt does not bind the approved unit contract.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if expectations.expected_approved_unit_contract_fingerprint
        == expectations.expected_task_packet_fingerprint
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_unit_contract_mismatch",
            "The authoritative unit-review receipt must bind a distinct approved unit contract fingerprint.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Reconcile Mode")
        .map(String::as_str)
        != Some("identity_preserving")
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_reconcile_mode_mismatch",
            "The authoritative unit-review receipt does not prove an identity-preserving reconcile.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Reconciled Result SHA")
        .map(String::as_str)
        != Some(expectations.expected_reconcile_result_commit_sha)
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_identity_preserving_proof_mismatch",
            "The authoritative unit-review receipt does not bind the exact reconciled commit.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    let Some(expected_reconcile_result_proof_fingerprint) =
        reconcile_result_proof_fingerprint_for_review(
            &context.runtime.repo_root,
            expectations.expected_reconcile_result_commit_sha,
        )
    else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_identity_preserving_proof_unverifiable",
            "The authoritative unit-review receipt exact reconcile proof could not be verified against repository history.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    };
    if review_document
        .headers
        .get("Reconcile Result Proof Fingerprint")
        .map(String::as_str)
        != Some(expected_reconcile_result_proof_fingerprint.as_str())
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_identity_preserving_proof_mismatch",
            "The authoritative unit-review receipt does not bind the exact reconciled commit object.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Reviewed Worktree")
        .map(String::as_str)
        != Some(lease.worktree_path.as_str())
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_worktree_mismatch",
            "The authoritative unit-review receipt does not match the reviewed worktree.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document.headers.get("Result").map(String::as_str) != Some("pass") {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_not_pass",
            "The authoritative unit-review receipt is not marked pass.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Generated By")
        .map(String::as_str)
        != Some("featureforge:unit-review")
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_generator_mismatch",
            "The authoritative unit-review receipt does not come from the unit-review generator.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    let expected_receipt_filename = format!(
        "unit-review-{}-{}.md",
        execution_run_id,
        lease.execution_unit_id.trim_start_matches("unit-")
    );
    if receipt_path.file_name().and_then(|value| value.to_str())
        != Some(expected_receipt_filename.as_str())
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_binding_path_invalid",
            "The authoritative unit-review receipt path does not match the reviewed execution unit provenance.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    }
    let Some(receipt_checkpoint_commit_sha) = review_document
        .headers
        .get("Reviewed Checkpoint SHA")
        .cloned()
    else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_head_missing",
            "The authoritative unit-review receipt is missing its reviewed checkpoint.",
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    };

    let Some(canonical_fingerprint) = canonical_unit_review_receipt_fingerprint(source) else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "worktree_lease_review_receipt_fingerprint_unverifiable",
            format!(
                "Authoritative unit-review receipt fingerprint is unverifiable in {}.",
                receipt_path.display()
            ),
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return None;
    };
    if canonical_fingerprint != expectations.expected_fingerprint {
        gate.fail(
            FailureClass::ArtifactIntegrityMismatch,
            "worktree_lease_review_receipt_fingerprint_mismatch",
            format!(
                "Authoritative unit-review receipt fingerprint does not match canonical content in {}.",
                receipt_path.display()
            ),
            "Regenerate the authoritative unit-review receipt from canonical content and retry gate-review or gate-finish.",
        );
        return None;
    }
    if review_document
        .headers
        .get("Receipt Fingerprint")
        .map(String::as_str)
        != Some(expectations.expected_fingerprint)
    {
        gate.fail(
            FailureClass::ArtifactIntegrityMismatch,
            "worktree_lease_review_receipt_fingerprint_mismatch",
            format!(
                "Authoritative unit-review receipt fingerprint header does not match canonical content in {}.",
                receipt_path.display()
            ),
            "Regenerate the authoritative unit-review receipt from canonical content and retry gate-review or gate-finish.",
        );
        return None;
    }

    Some((
        receipt_checkpoint_commit_sha,
        expectations.expected_reconcile_result_commit_sha.to_owned(),
    ))
}

fn validate_plain_unit_review_receipt(
    context: &ExecutionContext,
    execution_run_id: &str,
    source: &str,
    receipt_path: &Path,
    expectations: PlainUnitReviewReceiptExpectations<'_>,
    gate: &mut GateState,
) -> bool {
    let review_document = parse_artifact_document(receipt_path);
    if review_document.title.as_deref() != Some("# Unit Review Result")
        || review_document
            .headers
            .get("Review Stage")
            .map(String::as_str)
            != Some("featureforge:unit-review")
        || review_document
            .headers
            .get("Reviewer Provenance")
            .map(String::as_str)
            != Some("dedicated-independent")
        || !matches!(
            review_document
                .headers
                .get("Reviewer Source")
                .map(String::as_str)
                .unwrap_or_default(),
            "fresh-context-subagent" | "cross-model"
        )
        || review_document.headers.get("Result").map(String::as_str) != Some("pass")
        || review_document
            .headers
            .get("Generated By")
            .map(String::as_str)
            != Some("featureforge:unit-review")
    {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "plain_unit_review_receipt_malformed",
            format!(
                "Current-run unit-review receipt {} is malformed.",
                receipt_path.display()
            ),
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return false;
    }

    for forbidden_header in [
        "Lease Fingerprint",
        "Execution Context Key",
        "Approved Unit Contract Fingerprint",
        "Reconciled Result SHA",
        "Reconcile Result Proof Fingerprint",
        "Reconcile Mode",
        "Reviewed Worktree",
    ] {
        if review_document.headers.contains_key(forbidden_header) {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "plain_unit_review_receipt_malformed",
                format!(
                    "Current-run unit-review receipt {} unexpectedly includes {} without an active authoritative contract.",
                    receipt_path.display(),
                    forbidden_header
                ),
                "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
            );
            return false;
        }
    }

    let expected_file_name = format!(
        "unit-review-{}-{}.md",
        execution_run_id,
        expectations.expected_execution_unit_id
    );
    if receipt_path.file_name().and_then(|value| value.to_str()) != Some(expected_file_name.as_str()) {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "plain_unit_review_receipt_malformed",
            format!(
                "Current-run unit-review receipt path {} does not match the reviewed execution unit provenance.",
                receipt_path.display()
            ),
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return false;
    }

    let Some(canonical_fingerprint) = canonical_unit_review_receipt_fingerprint(source) else {
        gate.fail(
            FailureClass::MalformedExecutionState,
            "plain_unit_review_receipt_fingerprint_unverifiable",
            format!(
                "Current-run unit-review receipt fingerprint is unverifiable in {}.",
                receipt_path.display()
            ),
            "Repair the authoritative unit-review receipt and retry gate-review or gate-finish.",
        );
        return false;
    };
    if review_document
        .headers
        .get("Receipt Fingerprint")
        .map(String::as_str)
        != Some(canonical_fingerprint.as_str())
    {
        gate.fail(
            FailureClass::ArtifactIntegrityMismatch,
            "plain_unit_review_receipt_fingerprint_mismatch",
            format!(
                "Current-run unit-review receipt fingerprint header does not match canonical content in {}.",
                receipt_path.display()
            ),
            "Regenerate the authoritative unit-review receipt from canonical content and retry gate-review or gate-finish.",
        );
        return false;
    }

    let mut mismatched_fields = Vec::new();
    let mut mismatch_details = Vec::new();
    if review_document.headers.get("Source Plan").map(String::as_str)
        != Some(context.plan_rel.as_str())
    {
        mismatched_fields.push("Source Plan");
        mismatch_details.push(format!(
            "Source Plan expected={} actual={}",
            context.plan_rel,
            review_document
                .headers
                .get("Source Plan")
                .map(String::as_str)
                .unwrap_or("<missing>")
        ));
    }
    if review_document
        .headers
        .get("Source Plan Revision")
        .and_then(|value| value.parse::<u32>().ok())
        != Some(context.plan_document.plan_revision)
    {
        mismatched_fields.push("Source Plan Revision");
        mismatch_details.push(format!(
            "Source Plan Revision expected={} actual={}",
            context.plan_document.plan_revision,
            review_document
                .headers
                .get("Source Plan Revision")
                .map(String::as_str)
                .unwrap_or("<missing>")
        ));
    }
    if review_document
        .headers
        .get("Execution Run ID")
        .map(String::as_str)
        != Some(execution_run_id)
    {
        mismatched_fields.push("Execution Run ID");
        mismatch_details.push(format!(
            "Execution Run ID expected={} actual={}",
            execution_run_id,
            review_document
                .headers
                .get("Execution Run ID")
                .map(String::as_str)
                .unwrap_or("<missing>")
        ));
    }
    if review_document
        .headers
        .get("Execution Unit ID")
        .map(String::as_str)
        != Some(expectations.expected_execution_unit_id.as_str())
    {
        mismatched_fields.push("Execution Unit ID");
        mismatch_details.push(format!(
            "Execution Unit ID expected={} actual={}",
            expectations.expected_execution_unit_id,
            review_document
                .headers
                .get("Execution Unit ID")
                .map(String::as_str)
                .unwrap_or("<missing>")
        ));
    }
    if review_document
        .headers
        .get("Strategy Checkpoint Fingerprint")
        .map(String::as_str)
        != Some(expectations.expected_strategy_checkpoint_fingerprint)
    {
        mismatched_fields.push("Strategy Checkpoint Fingerprint");
        mismatch_details.push(format!(
            "Strategy Checkpoint Fingerprint expected={} actual={}",
            expectations.expected_strategy_checkpoint_fingerprint,
            review_document
                .headers
                .get("Strategy Checkpoint Fingerprint")
                .map(String::as_str)
                .unwrap_or("<missing>")
        ));
    }
    if review_document
        .headers
        .get("Approved Task Packet Fingerprint")
        .map(String::as_str)
        != Some(expectations.expected_task_packet_fingerprint)
    {
        mismatched_fields.push("Approved Task Packet Fingerprint");
        mismatch_details.push(format!(
            "Approved Task Packet Fingerprint expected={} actual={}",
            expectations.expected_task_packet_fingerprint,
            review_document
                .headers
                .get("Approved Task Packet Fingerprint")
                .map(String::as_str)
                .unwrap_or("<missing>")
        ));
    }
    if review_document
        .headers
        .get("Reviewed Checkpoint SHA")
        .map(String::as_str)
        != Some(expectations.expected_reviewed_checkpoint_sha)
    {
        mismatched_fields.push("Reviewed Checkpoint SHA");
        mismatch_details.push(format!(
            "Reviewed Checkpoint SHA expected={} actual={}",
            expectations.expected_reviewed_checkpoint_sha,
            review_document
                .headers
                .get("Reviewed Checkpoint SHA")
                .map(String::as_str)
                .unwrap_or("<missing>")
        ));
    }
    if !mismatched_fields.is_empty() {
        gate.fail(
            FailureClass::StaleProvenance,
            "plain_unit_review_receipt_provenance_mismatch",
            format!(
                "Current-run unit-review receipt {} does not match the active task checkpoint provenance (mismatched fields: {}; details: {}).",
                receipt_path.display(),
                mismatched_fields.join(", ")
                , mismatch_details.join("; ")
            ),
            "Regenerate the authoritative unit-review receipt for the completed step and retry gate-review or gate-finish.",
        );
        return false;
    }

    true
}

fn canonical_unit_review_receipt_fingerprint(source: &str) -> Option<String> {
    let filtered = source
        .lines()
        .filter(|line| !line.trim().starts_with("**Receipt Fingerprint:**"))
        .collect::<Vec<_>>()
        .join("\n");
    Some(sha256_hex(filtered.as_bytes()))
}

fn is_ancestor_commit(repo_root: &Path, ancestor: &str, descendant: &str) -> bool {
    let status = match Command::new("git")
        .current_dir(repo_root)
        .args(["merge-base", "--is-ancestor", ancestor, descendant])
        .status()
    {
        Ok(status) => status,
        Err(_) => return false,
    };

    match status.code() {
        Some(0) => true,
        Some(1) => false,
        _ => false,
    }
}

pub fn gate_finish_from_context(context: &ExecutionContext) -> GateResult {
    let mut gate = GateState::from_result(gate_review_from_context_internal(context, true));
    if !gate.allowed {
        return gate.finish();
    }

    let branch = &context.runtime.branch_name;
    let current_head = current_head_sha(&context.runtime.repo_root).unwrap_or_default();
    match repo_has_tracked_worktree_changes_excluding_execution_evidence(
        &context.runtime.repo_root,
    ) {
        Ok(true) => {
            gate.fail(
                FailureClass::ReviewArtifactNotFresh,
                "review_artifact_worktree_dirty",
                "Finish readiness is blocked by tracked worktree changes that landed after the last review artifacts were generated.",
                "Commit or discard tracked worktree changes, then rerun requesting-code-review and downstream finish artifacts.",
            );
            return gate.finish();
        }
        Ok(false) => {}
        Err(error) => {
            gate.fail(
                FailureClass::ReviewArtifactNotFresh,
                "review_artifact_worktree_state_unavailable",
                format!(
                    "Finish readiness could not determine whether tracked worktree changes are present: {}",
                    error.message
                ),
                "Restore repository status inspection, then rerun requesting-code-review and downstream finish artifacts.",
            );
            return gate.finish();
        }
    }
    let Some(current_base_branch) =
        resolve_release_base_branch(&context.runtime.git_dir, &context.runtime.branch_name)
    else {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_base_branch_unresolved",
            "Finish readiness could not determine the expected base branch for the current workspace.",
            "Resolve the release base branch before running gate-finish.",
        );
        return gate.finish();
    };
    let artifact_dir = context
        .runtime
        .state_dir
        .join("projects")
        .join(&context.runtime.repo_slug);

    let authoritative_review_path = match authoritative_final_review_artifact_path_checked(context)
    {
        Ok(path) => path,
        Err(error) => {
            let failure_class =
                if error.error_class == FailureClass::ArtifactIntegrityMismatch.as_str() {
                    FailureClass::ArtifactIntegrityMismatch
                } else {
                    FailureClass::MalformedExecutionState
                };
            gate.fail(
                failure_class,
                "review_artifact_authoritative_provenance_invalid",
                error.message,
                "Restore the authoritative final-review provenance and retry gate-finish.",
            );
            return gate.finish();
        }
    };
    let review_path = authoritative_review_path
        .or_else(|| latest_branch_artifact_path(&artifact_dir, branch, "code-review"));
    let Some(review_path) = review_path else {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_artifact_missing",
            "Finish readiness requires a final code-review artifact.",
            "Run requesting-code-review and return with a fresh code-review artifact.",
        );
        return gate.finish();
    };
    let review = parse_artifact_document(&review_path);
    if review.title.as_deref() != Some("# Code Review Result") {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_artifact_malformed",
            "The latest code-review artifact is malformed.",
            "Run requesting-code-review and return with a fresh code-review artifact.",
        );
        return gate.finish();
    }
    let review_receipt = parse_final_review_receipt(&review_path);
    let expected_strategy_checkpoint_fingerprint =
        match authoritative_strategy_checkpoint_fingerprint_checked(context) {
            Ok(value) => value,
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "review_receipt_strategy_checkpoint_truth_unavailable",
                    error.message,
                    "Restore authoritative strategy checkpoint provenance before running gate-finish.",
                );
                return gate.finish();
            }
        };
    let deviations_required =
        match authoritative_matching_execution_topology_downgrade_records_checked(
            context,
            &recommendation_execution_context_key(context),
        ) {
            Ok(records) => !records.is_empty(),
            Err(error) => {
                gate.fail(
                    FailureClass::MalformedExecutionState,
                    "review_receipt_deviation_truth_unavailable",
                    error.message,
                    "Restore authoritative topology downgrade records before running gate-finish.",
                );
                return gate.finish();
            }
        };
    let review_expectations = FinalReviewReceiptExpectations {
        expected_plan_path: &context.plan_rel,
        expected_plan_revision: context.plan_document.plan_revision,
        expected_strategy_checkpoint_fingerprint: expected_strategy_checkpoint_fingerprint
            .as_deref(),
        expected_head_sha: &current_head,
        expected_base_branch: &current_base_branch,
        deviations_required,
    };
    if let Err(issue) =
        validate_final_review_receipt(&review_receipt, &review_path, &review_expectations)
    {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            issue.reason_code(),
            issue.message(),
            "Run requesting-code-review and return with a fresh dedicated final review artifact.",
        );
        return gate.finish();
    }
    if review.headers.get("Branch") != Some(branch) {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_artifact_branch_mismatch",
            "The latest code-review artifact does not match the current branch.",
            "Run requesting-code-review and return with a fresh code-review artifact.",
        );
        return gate.finish();
    }
    if review
        .headers
        .get("Base Branch")
        .is_none_or(|value| value.trim().is_empty())
    {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_artifact_base_branch_unresolved",
            "The latest code-review artifact is missing its base branch declaration.",
            "Run requesting-code-review and return with a fresh code-review artifact.",
        );
        return gate.finish();
    }
    if review.headers.get("Base Branch") != Some(&current_base_branch) {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_artifact_base_branch_mismatch",
            "The latest code-review artifact does not match the expected base branch.",
            "Run requesting-code-review and return with a fresh code-review artifact.",
        );
        return gate.finish();
    }
    if review.headers.get("Repo") != Some(&context.runtime.repo_slug) {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_artifact_repo_mismatch",
            "The latest code-review artifact does not match the current repo.",
            "Run requesting-code-review and return with a fresh code-review artifact.",
        );
        return gate.finish();
    }

    let authoritative_qa_path = match authoritative_browser_qa_artifact_path_checked(context) {
        Ok(path) => path,
        Err(error) => {
            let failure_class =
                if error.error_class == FailureClass::ArtifactIntegrityMismatch.as_str() {
                    FailureClass::ArtifactIntegrityMismatch
                } else {
                    FailureClass::MalformedExecutionState
                };
            gate.fail(
                failure_class,
                "qa_artifact_authoritative_provenance_invalid",
                error.message,
                "Restore the authoritative browser-QA provenance and retry gate-finish.",
            );
            return gate.finish();
        }
    };
    let authoritative_test_plan_path = match authoritative_qa_path.as_deref() {
        Some(qa_path) => match authoritative_test_plan_artifact_path_from_qa_checked(qa_path) {
            Ok(path) => path,
            Err(error) => {
                let failure_class =
                    if error.error_class == FailureClass::ArtifactIntegrityMismatch.as_str() {
                        FailureClass::ArtifactIntegrityMismatch
                    } else {
                        FailureClass::MalformedExecutionState
                    };
                gate.fail(
                    failure_class,
                    "test_plan_artifact_authoritative_provenance_invalid",
                    error.message,
                    "Restore the authoritative browser-QA to test-plan provenance and retry gate-finish.",
                );
                return gate.finish();
            }
        },
        None => None,
    };
    let test_plan_path = authoritative_test_plan_path
        .or_else(|| latest_branch_artifact_path(&artifact_dir, branch, "test-plan"));
    let Some(test_plan_path) = test_plan_path else {
        gate.fail(
            FailureClass::QaArtifactNotFresh,
            "test_plan_artifact_missing",
            "Finish readiness requires a current branch test-plan artifact.",
            "Regenerate the test-plan artifact for the current approved plan revision.",
        );
        return gate.finish();
    };

    let test_plan = parse_artifact_document(&test_plan_path);
    if test_plan.title.as_deref() != Some("# Test Plan") {
        gate.fail(
            FailureClass::QaArtifactNotFresh,
            "test_plan_artifact_malformed",
            "The latest test-plan artifact is malformed.",
            "Regenerate the test-plan artifact for the current approved plan revision.",
        );
        return gate.finish();
    }
    if test_plan.headers.get("Source Plan") != Some(&format!("`{}`", context.plan_rel))
        || test_plan.headers.get("Source Plan Revision")
            != Some(&context.plan_document.plan_revision.to_string())
        || test_plan.headers.get("Branch") != Some(branch)
        || test_plan.headers.get("Repo") != Some(&context.runtime.repo_slug)
    {
        gate.fail(
            FailureClass::QaArtifactNotFresh,
            "test_plan_artifact_stale",
            "The latest test-plan artifact does not match the current approved plan, repo, or branch.",
            "Regenerate the test-plan artifact for the current approved plan revision.",
        );
        return gate.finish();
    }
    if test_plan.headers.get("Head SHA") != Some(&current_head) {
        gate.fail(
            FailureClass::QaArtifactNotFresh,
            "test_plan_artifact_stale",
            "The latest test-plan artifact does not match the current HEAD.",
            "Regenerate the test-plan artifact for the current approved plan revision.",
        );
        return gate.finish();
    }
    if test_plan.headers.get("Generated By") != Some(&String::from("featureforge:plan-eng-review"))
    {
        gate.fail(
            FailureClass::QaArtifactNotFresh,
            "test_plan_artifact_generator_mismatch",
            "The latest test-plan artifact was not generated by plan-eng-review.",
            "Regenerate the test-plan artifact for the current approved plan revision.",
        );
        return gate.finish();
    }

    if test_plan
        .headers
        .get("Browser QA Required")
        .is_some_and(|value| value == "yes")
    {
        let qa_path = authoritative_qa_path
            .or_else(|| latest_branch_artifact_path(&artifact_dir, branch, "test-outcome"));
        let Some(qa_path) = qa_path else {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_missing",
                "Finish readiness requires a QA result artifact.",
                "Run qa-only and return with a fresh QA result artifact.",
            );
            return gate.finish();
        };
        let qa = parse_artifact_document(&qa_path);
        if qa.title.as_deref() != Some("# QA Result") {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_malformed",
                "The latest QA result artifact is malformed.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
        if qa.headers.get("Source Plan") != Some(&format!("`{}`", context.plan_rel))
            || qa.headers.get("Source Plan Revision")
                != Some(&context.plan_document.plan_revision.to_string())
        {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_plan_mismatch",
                "The latest QA result artifact does not match the current approved plan revision.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
        if qa.headers.get("Branch") != Some(branch) {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_branch_mismatch",
                "The latest QA result artifact does not match the current branch.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
        if qa.headers.get("Head SHA") != Some(&current_head) {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_head_mismatch",
                "The latest QA result artifact does not match the current HEAD.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
        let qa_source_test_plan_matches = qa
            .headers
            .get("Source Test Plan")
            .map(|value| value.trim_matches('`').trim().to_owned())
            .filter(|value| !value.is_empty())
            .and_then(|raw| {
                let source_path = PathBuf::from(raw);
                let resolved = if source_path.is_absolute() {
                    source_path
                } else {
                    qa_path
                        .parent()
                        .unwrap_or_else(|| Path::new("."))
                        .join(source_path)
                };
                fs::canonicalize(resolved).ok()
            })
            .and_then(|source| {
                fs::canonicalize(test_plan_path)
                    .ok()
                    .map(|target| source == target)
            })
            .unwrap_or(false);
        if !qa_source_test_plan_matches {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_source_test_plan_mismatch",
                "The latest QA result artifact does not point at the current test-plan artifact.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
        if qa.headers.get("Result") != Some(&String::from("pass")) {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_result_not_pass",
                "The latest QA result artifact is not marked pass.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
        if qa.headers.get("Generated By") != Some(&String::from("featureforge:qa-only")) {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_generator_mismatch",
                "The latest QA result artifact was not generated by qa-only.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
        if qa.headers.get("Repo") != Some(&context.runtime.repo_slug) {
            gate.fail(
                FailureClass::QaArtifactNotFresh,
                "qa_artifact_repo_mismatch",
                "The latest QA result artifact does not match the current repo.",
                "Re-run qa-only using the latest test-plan handoff.",
            );
            return gate.finish();
        }
    }

    let authoritative_release_path = match authoritative_release_docs_artifact_path_checked(context)
    {
        Ok(path) => path,
        Err(error) => {
            let failure_class =
                if error.error_class == FailureClass::ArtifactIntegrityMismatch.as_str() {
                    FailureClass::ArtifactIntegrityMismatch
                } else {
                    FailureClass::MalformedExecutionState
                };
            gate.fail(
                failure_class,
                "release_artifact_authoritative_provenance_invalid",
                error.message,
                "Restore the authoritative release-doc provenance and retry gate-finish.",
            );
            return gate.finish();
        }
    };
    let release_path = authoritative_release_path
        .or_else(|| latest_branch_artifact_path(&artifact_dir, branch, "release-readiness"));
    let Some(release_path) = release_path else {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_missing",
            "Finish readiness requires a release-readiness artifact.",
            "Run document-release and return with a fresh release-readiness artifact.",
        );
        return gate.finish();
    };
    let release = parse_artifact_document(&release_path);
    if release.title.as_deref() != Some("# Release Readiness Result") {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_malformed",
            "The latest release-readiness artifact is malformed.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release.headers.get("Source Plan") != Some(&format!("`{}`", context.plan_rel))
        || release.headers.get("Source Plan Revision")
            != Some(&context.plan_document.plan_revision.to_string())
    {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_plan_mismatch",
            "The latest release-readiness artifact does not match the current approved plan revision.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release.headers.get("Branch") != Some(branch) {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_branch_mismatch",
            "The latest release-readiness artifact does not match the current branch.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release.headers.get("Head SHA") != Some(&current_head) {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_head_mismatch",
            "The latest release-readiness artifact does not match the current HEAD.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release
        .headers
        .get("Base Branch")
        .is_none_or(|value| value.trim().is_empty())
    {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_base_branch_unresolved",
            "The latest release-readiness artifact is missing its base branch declaration.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release.headers.get("Base Branch") != Some(&current_base_branch) {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_base_branch_mismatch",
            "The latest release-readiness artifact does not match the expected base branch.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release.headers.get("Result") != Some(&String::from("pass")) {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_result_not_pass",
            "The latest release-readiness artifact is not marked pass.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release.headers.get("Generated By") != Some(&String::from("featureforge:document-release")) {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_generator_mismatch",
            "The latest release-readiness artifact was not generated by document-release.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }
    if release.headers.get("Repo") != Some(&context.runtime.repo_slug) {
        gate.fail(
            FailureClass::ReleaseArtifactNotFresh,
            "release_artifact_repo_mismatch",
            "The latest release-readiness artifact does not match the current repo.",
            "Re-run document-release for the current approved plan revision.",
        );
        return gate.finish();
    }

    gate.finish()
}

fn enforce_review_authoritative_late_gate_truth(context: &ExecutionContext, gate: &mut GateState) {
    let overlay = match load_status_authoritative_overlay_checked(context) {
        Ok(overlay) => overlay,
        Err(error) => {
            gate.fail(
                FailureClass::MalformedExecutionState,
                "authoritative_state_unavailable",
                error.message,
                "Restore authoritative harness state readability and validity before running gate-review.",
            );
            return;
        }
    };
    let Some(overlay) = overlay else {
        return;
    };

    validate_review_dependency_index_truth(overlay.dependency_index_state.as_deref(), gate);
    validate_review_downstream_truth(
        "final_review_state",
        "final review",
        overlay.final_review_state.as_deref(),
        gate,
    );
    validate_review_downstream_truth(
        "browser_qa_state",
        "browser QA",
        overlay.browser_qa_state.as_deref(),
        gate,
    );
    validate_review_downstream_truth(
        "release_docs_state",
        "release docs",
        overlay.release_docs_state.as_deref(),
        gate,
    );
}

fn validate_review_dependency_index_truth(raw_state: Option<&str>, gate: &mut GateState) {
    let state = normalize_optional_overlay_value(raw_state).unwrap_or("missing");
    if state == "fresh" {
        return;
    }

    let (code, message) = match state {
        "missing" => (
            "dependency_index_state_missing",
            "Authoritative dependency-index truth is missing for review readiness.",
        ),
        "stale" => (
            "dependency_index_state_stale",
            "Authoritative dependency-index truth is stale for review readiness.",
        ),
        _ => (
            "dependency_index_state_not_fresh",
            "Authoritative dependency-index truth is not fresh for review readiness.",
        ),
    };
    gate.fail(
        FailureClass::DependencyIndexMismatch,
        code,
        message,
        "Refresh authoritative dependency-index truth before running gate-review.",
    );
}

fn validate_review_downstream_truth(
    field_name: &str,
    field_label: &str,
    raw_state: Option<&str>,
    gate: &mut GateState,
) {
    let state = normalize_optional_overlay_value(raw_state).unwrap_or("missing");
    if state == "fresh" || state == "not_required" {
        return;
    }

    let (code_suffix, message_suffix) = match state {
        "missing" => ("missing", "is missing"),
        "stale" => ("stale", "is stale"),
        _ => ("not_fresh", "is not fresh"),
    };
    gate.fail(
        FailureClass::StaleProvenance,
        &format!("{field_name}_{code_suffix}"),
        format!("Authoritative {field_label} truth {message_suffix} for review readiness."),
        "Refresh authoritative late-gate truth before running gate-review.",
    );
}

pub fn normalize_begin_request(args: &BeginArgs) -> BeginRequest {
    BeginRequest {
        task: args.task,
        step: args.step,
        execution_mode: args.execution_mode.map(|value| value.as_str().to_owned()),
        expect_execution_fingerprint: args.expect_execution_fingerprint.clone(),
    }
}

pub fn normalize_note_request(args: &NoteArgs) -> Result<NoteRequest, JsonFailure> {
    let message = require_normalized_text(
        &args.message,
        FailureClass::InvalidCommandInput,
        "Execution note summaries may not be blank after whitespace normalization.",
    )?;
    if message.chars().count() > 120 {
        return Err(JsonFailure::new(
            FailureClass::InvalidCommandInput,
            "Execution note summaries may not exceed 120 characters.",
        ));
    }
    let state = match args.state {
        NoteStateArg::Blocked => NoteState::Blocked,
        NoteStateArg::Interrupted => NoteState::Interrupted,
    };

    Ok(NoteRequest {
        task: args.task,
        step: args.step,
        state,
        message,
        expect_execution_fingerprint: args.expect_execution_fingerprint.clone(),
    })
}

pub fn normalize_complete_request(args: &CompleteArgs) -> Result<CompleteRequest, JsonFailure> {
    let claim = require_normalized_text(
        &args.claim,
        FailureClass::InvalidCommandInput,
        "Completion claims may not be blank after whitespace normalization.",
    )?;
    let verification_summary = match (
        args.verify_command.as_deref(),
        args.verify_result.as_deref(),
        args.manual_verify_summary.as_deref(),
    ) {
        (Some(_), Some(_), Some(_)) | (Some(_), None, _) | (None, Some(_), _) => {
            return Err(JsonFailure::new(
                FailureClass::InvalidCommandInput,
                "complete accepts exactly one verification mode.",
            ));
        }
        (Some(command), Some(result), None) => {
            let command = require_normalized_text(
                command,
                FailureClass::InvalidCommandInput,
                "Verification commands may not be blank after whitespace normalization.",
            )?;
            let result = require_normalized_text(
                result,
                FailureClass::InvalidCommandInput,
                "Verification results may not be blank after whitespace normalization.",
            )?;
            format!("`{command}` -> {result}")
        }
        (None, None, Some(summary)) => {
            let summary = require_normalized_text(
                summary,
                FailureClass::InvalidCommandInput,
                "Manual verification summaries may not be blank after whitespace normalization.",
            )?;
            format!("Manual inspection only: {summary}")
        }
        (None, None, None) => {
            return Err(JsonFailure::new(
                FailureClass::InvalidCommandInput,
                "complete requires exactly one verification mode.",
            ));
        }
    };

    Ok(CompleteRequest {
        task: args.task,
        step: args.step,
        source: args.source.as_str().to_owned(),
        claim,
        files: args.files.clone(),
        verify_command: args
            .verify_command
            .as_deref()
            .map(normalize_whitespace)
            .filter(|value| !value.is_empty()),
        verification_summary,
        expect_execution_fingerprint: args.expect_execution_fingerprint.clone(),
    })
}

pub fn normalize_reopen_request(args: &ReopenArgs) -> Result<ReopenRequest, JsonFailure> {
    Ok(ReopenRequest {
        task: args.task,
        step: args.step,
        source: args.source.as_str().to_owned(),
        reason: require_normalized_text(
            &args.reason,
            FailureClass::InvalidCommandInput,
            "Reopen reasons may not be blank after whitespace normalization.",
        )?,
        expect_execution_fingerprint: args.expect_execution_fingerprint.clone(),
    })
}

pub fn normalize_transfer_request(args: &TransferArgs) -> Result<TransferRequest, JsonFailure> {
    Ok(TransferRequest {
        repair_task: args.repair_task,
        repair_step: args.repair_step,
        source: args.source.as_str().to_owned(),
        reason: require_normalized_text(
            &args.reason,
            FailureClass::InvalidCommandInput,
            "Transfer reasons may not be blank after whitespace normalization.",
        )?,
        expect_execution_fingerprint: args.expect_execution_fingerprint.clone(),
    })
}

pub fn normalize_rebuild_evidence_request(
    args: &RebuildEvidenceArgs,
) -> Result<RebuildEvidenceRequest, JsonFailure> {
    let mut parsed_steps = Vec::with_capacity(args.steps.len());
    for raw in &args.steps {
        let (task, step) = raw.split_once(':').ok_or_else(|| {
            JsonFailure::new(
                FailureClass::InvalidCommandInput,
                "--step must use task:step selectors such as 1:2.",
            )
        })?;
        let task = task.parse::<u32>().map_err(|_| {
            JsonFailure::new(
                FailureClass::InvalidCommandInput,
                "--step must use numeric task:step selectors such as 1:2.",
            )
        })?;
        let step = step.parse::<u32>().map_err(|_| {
            JsonFailure::new(
                FailureClass::InvalidCommandInput,
                "--step must use numeric task:step selectors such as 1:2.",
            )
        })?;
        parsed_steps.push((task, step));
    }

    Ok(RebuildEvidenceRequest {
        plan: args.plan.clone(),
        all: args.all || (args.tasks.is_empty() && args.steps.is_empty()),
        tasks: args.tasks.clone(),
        steps: parsed_steps,
        raw_steps: args.steps.clone(),
        include_open: args.include_open,
        skip_manual_fallback: args.skip_manual_fallback,
        continue_on_error: args.continue_on_error,
        dry_run: args.dry_run,
        max_jobs: args.max_jobs,
        no_output: args.no_output,
        json: args.json,
    })
}

pub fn parse_command_verification_summary(summary: &str) -> Option<String> {
    let trimmed = normalize_whitespace(summary);
    let suffix = trimmed.strip_prefix('`')?;
    let (command, _) = suffix.split_once("` -> ")?;
    let command = normalize_whitespace(command);
    (!command.is_empty()).then_some(command)
}

pub fn discover_rebuild_candidates(
    context: &ExecutionContext,
    request: &RebuildEvidenceRequest,
) -> Result<Vec<RebuildEvidenceCandidate>, JsonFailure> {
    let task_filter = request.tasks.iter().copied().collect::<BTreeSet<_>>();
    let step_filter = request.steps.iter().copied().collect::<BTreeSet<_>>();

    let matching_steps = context
        .steps
        .iter()
        .filter(|step| {
            (task_filter.is_empty() || task_filter.contains(&step.task_number))
                && (step_filter.is_empty()
                    || step_filter.contains(&(step.task_number, step.step_number)))
        })
        .collect::<Vec<_>>();
    if (!request.tasks.is_empty() || !request.steps.is_empty()) && matching_steps.is_empty() {
        return Err(JsonFailure::new(
            FailureClass::InvalidCommandInput,
            "scope_no_matches: no approved plan steps matched the requested filters.",
        ));
    }

    let legacy_plan_fingerprint = sha256_hex(context.plan_source.as_bytes());
    let source_spec_fingerprint = sha256_hex(context.source_spec_source.as_bytes());
    let session_provenance_reason = if context.evidence.plan_fingerprint.as_deref()
        != Some(legacy_plan_fingerprint.as_str())
    {
        Some(String::from("plan_fingerprint_mismatch"))
    } else if context.evidence.source_spec_fingerprint.as_deref()
        != Some(source_spec_fingerprint.as_str())
    {
        Some(String::from("source_spec_fingerprint_mismatch"))
    } else {
        None
    };

    let contract_plan_fingerprint = hash_contract_plan(&context.plan_source);
    let latest_attempts = latest_attempt_indices_by_step(&context.evidence);
    let latest_completed = latest_completed_attempts_by_step(&context.evidence);
    let latest_file_proofs = latest_completed_attempts_by_file(&context.evidence, &latest_completed);
    let mut candidates = Vec::new();

    for step in matching_steps {
        let step_key = (step.task_number, step.step_number);
        let latest_attempt = latest_attempts
            .get(&step_key)
            .map(|index| &context.evidence.attempts[*index]);
        let latest_completed_attempt = latest_completed
            .get(&step_key)
            .map(|index| &context.evidence.attempts[*index]);

        let mut pre_invalidation_reason = None;
        let mut target_kind = String::new();
        let mut needs_reopen = false;

        if step.checked
            && let Some(reason) = session_provenance_reason.as_ref()
            && latest_completed_attempt.is_some()
        {
            pre_invalidation_reason = Some(reason.clone());
            target_kind = String::from("stale_completed_attempt");
            needs_reopen = true;
        }

        if let Some(attempt) = latest_attempt
            && attempt.status == "Invalidated" && attempt.invalidation_reason != "N/A"
        {
            pre_invalidation_reason = Some(attempt.invalidation_reason.clone());
            target_kind = String::from("invalidated_attempt");
            needs_reopen = step.checked;
        }

        if pre_invalidation_reason.is_none() && step.checked
            && let Some(attempt) = latest_completed_attempt
        {
            let expected_packet = compute_packet_fingerprint(PacketFingerprintInput {
                plan_path: &context.plan_rel,
                plan_revision: context.plan_document.plan_revision,
                plan_fingerprint: &contract_plan_fingerprint,
                source_spec_path: &context.plan_document.source_spec_path,
                source_spec_revision: context.plan_document.source_spec_revision,
                source_spec_fingerprint: &source_spec_fingerprint,
                task: step.task_number,
                step: step.step_number,
            });
            if attempt.packet_fingerprint.as_deref() != Some(expected_packet.as_str()) {
                pre_invalidation_reason = Some(String::from("packet_fingerprint_mismatch"));
                target_kind = String::from("stale_completed_attempt");
                needs_reopen = true;
            } else {
                for proof in &attempt.file_proofs {
                    if proof.path == NO_REPO_FILES_MARKER
                        || proof.path == context.plan_rel
                        || proof.path == context.evidence_rel
                    {
                        continue;
                    }
                    if latest_file_proofs
                        .get(&proof.path)
                        .is_some_and(|latest_index| {
                            latest_completed
                                .get(&step_key)
                                .is_some_and(|attempt_index| latest_index != attempt_index)
                        })
                    {
                        continue;
                    }
                    match current_file_proof_checked(&context.runtime.repo_root, &proof.path) {
                        Ok(current_proof) => {
                            if current_proof != proof.proof {
                                pre_invalidation_reason =
                                    Some(String::from("files_proven_drifted"));
                                target_kind = String::from("stale_completed_attempt");
                                needs_reopen = true;
                                break;
                            }
                        }
                        Err(error) => {
                            pre_invalidation_reason = Some(format!(
                                "artifact_read_error: could not read {} ({error})",
                                proof.path
                            ));
                            target_kind = String::from("artifact_read_error");
                            needs_reopen = false;
                            break;
                        }
                    }
                }
            }
        }

        if pre_invalidation_reason.is_none() && request.include_open && !step.checked
            && (step.note_state.is_some() || latest_attempt.is_some())
        {
            pre_invalidation_reason = Some(String::from("open_step_requested"));
            target_kind = String::from("open_step");
        }

        let Some(pre_invalidation_reason) = pre_invalidation_reason else {
            continue;
        };
        let attempt = latest_attempt.or(latest_completed_attempt);
        let verify_command = attempt.and_then(|candidate| candidate.verify_command.clone());
        let verify_mode = if verify_command.is_some() {
            String::from("command")
        } else {
            String::from("manual")
        };
        let claim = attempt
            .map(|candidate| candidate.claim.clone())
            .unwrap_or_else(|| format!("Rebuilt evidence for Task {} Step {}.", step.task_number, step.step_number));
        let files = attempt
            .map(|candidate| candidate.files.clone())
            .unwrap_or_default();
        let attempt_number = attempt.map(|candidate| candidate.attempt_number);
        let artifact_epoch = attempt.map(|candidate| candidate.recorded_at.clone());

        candidates.push(RebuildEvidenceCandidate {
            task: step.task_number,
            step: step.step_number,
            order_key: (step.task_number, step.step_number),
            target_kind,
            pre_invalidation_reason,
            verify_command,
            verify_mode,
            claim,
            files,
            attempt_number,
            artifact_epoch,
            needs_reopen,
        });
    }

    candidates.sort_by_key(|candidate| candidate.order_key);

    Ok(candidates)
}

pub fn normalize_source(source: &str, execution_mode: &str) -> Result<(), JsonFailure> {
    match source {
        "featureforge:executing-plans" | "featureforge:subagent-driven-development" => {}
        _ => {
            return Err(JsonFailure::new(
                FailureClass::InvalidExecutionMode,
                "Execution source must be one of the supported execution modes.",
            ));
        }
    }
    if source != execution_mode {
        return Err(JsonFailure::new(
            FailureClass::InvalidExecutionMode,
            "Execution source must exactly match the persisted execution mode for this plan revision.",
        ));
    }
    Ok(())
}

pub fn validate_v2_evidence_provenance(context: &ExecutionContext, gate: &mut GateState) {
    let contract_plan_fingerprint = hash_contract_plan(&context.plan_source);
    let legacy_plan_fingerprint = sha256_hex(context.plan_source.as_bytes());
    let source_spec_fingerprint = sha256_hex(context.source_spec_source.as_bytes());
    let latest_attempts = latest_completed_attempts_by_step(&context.evidence);
    let latest_file_proofs = latest_completed_attempts_by_file(&context.evidence, &latest_attempts);

    if context.evidence.plan_fingerprint.as_deref() != Some(legacy_plan_fingerprint.as_str()) {
        gate.fail(
            FailureClass::StaleExecutionEvidence,
            "plan_fingerprint_mismatch",
            "Execution evidence plan fingerprint no longer matches the approved plan source.",
            "Rebuild the execution evidence for the current approved plan revision.",
        );
    }
    if context.evidence.source_spec_fingerprint.as_deref() != Some(source_spec_fingerprint.as_str())
    {
        gate.fail(
            FailureClass::StaleExecutionEvidence,
            "source_spec_fingerprint_mismatch",
            "Execution evidence source spec fingerprint no longer matches the approved source spec.",
            "Rebuild the execution evidence for the current approved spec revision.",
        );
    }

    for step in context.steps.iter().filter(|step| step.checked) {
        let Some(attempt_index) = latest_attempts
            .get(&(step.task_number, step.step_number))
            .copied()
        else {
            continue;
        };
        let attempt = &context.evidence.attempts[attempt_index];
        let expected_packet = compute_packet_fingerprint(PacketFingerprintInput {
            plan_path: &context.plan_rel,
            plan_revision: context.plan_document.plan_revision,
            plan_fingerprint: &contract_plan_fingerprint,
            source_spec_path: &context.plan_document.source_spec_path,
            source_spec_revision: context.plan_document.source_spec_revision,
            source_spec_fingerprint: &source_spec_fingerprint,
            task: step.task_number,
            step: step.step_number,
        });
        if attempt.packet_fingerprint.as_deref() != Some(expected_packet.as_str()) {
            gate.fail(
                FailureClass::StaleExecutionEvidence,
                "packet_fingerprint_mismatch",
                format!(
                    "Task {} Step {} evidence packet provenance no longer matches the current approved plan/spec pair.",
                    step.task_number, step.step_number
                ),
                "Rebuild the packet and reopen the affected step.",
            );
        }
        for proof in &attempt.file_proofs {
            if proof.path == NO_REPO_FILES_MARKER
                || proof.path == context.plan_rel
                || proof.path == context.evidence_rel
            {
                continue;
            }
            if latest_file_proofs
                .get(&proof.path)
                .is_some_and(|latest_index| *latest_index != attempt_index)
            {
                continue;
            }
            let current = current_file_proof(&context.runtime.repo_root, &proof.path);
            if current != proof.proof {
                gate.fail(
                    FailureClass::MissedReopenRequired,
                    "files_proven_drifted",
                    format!(
                        "Task {} Step {} proved file '{}' no longer matches its recorded fingerprint.",
                        step.task_number, step.step_number, proof.path
                    ),
                    "Reopen the step and rebuild its evidence.",
                );
            }
        }
    }
}

pub fn derive_evidence_rel_path(plan_rel: &str, revision: u32) -> String {
    let base = Path::new(plan_rel)
        .file_stem()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("plan");
    format!("{ACTIVE_EVIDENCE_ROOT}/{base}-r{revision}-evidence.md")
}

pub fn hash_contract_plan(source: &str) -> String {
    let sanitized_steps = parse_contract_render(source);
    sha256_hex(sanitized_steps.as_bytes())
}

pub fn render_contract_plan(source: &str) -> String {
    parse_contract_render(source)
}

pub struct PacketFingerprintInput<'a> {
    pub plan_path: &'a str,
    pub plan_revision: u32,
    pub plan_fingerprint: &'a str,
    pub source_spec_path: &'a str,
    pub source_spec_revision: u32,
    pub source_spec_fingerprint: &'a str,
    pub task: u32,
    pub step: u32,
}

pub fn compute_packet_fingerprint(input: PacketFingerprintInput<'_>) -> String {
    let payload = format!(
        "plan_path={plan_path}\nplan_revision={plan_revision}\nplan_fingerprint={plan_fingerprint}\nsource_spec_path={source_spec_path}\nsource_spec_revision={source_spec_revision}\nsource_spec_fingerprint={source_spec_fingerprint}\ntask_number={task}\nstep_number={step}\n",
        plan_path = input.plan_path,
        plan_revision = input.plan_revision,
        plan_fingerprint = input.plan_fingerprint,
        source_spec_path = input.source_spec_path,
        source_spec_revision = input.source_spec_revision,
        source_spec_fingerprint = input.source_spec_fingerprint,
        task = input.task,
        step = input.step,
    );
    sha256_hex(payload.as_bytes())
}

pub fn current_head_sha(repo_root: &Path) -> Result<String, JsonFailure> {
    let repo = gix::discover(repo_root).map_err(|error| {
        JsonFailure::new(
            FailureClass::BranchDetectionFailed,
            format!("Could not discover the current repository: {error}"),
        )
    })?;
    let head = repo.head_id().map_err(|error| {
        JsonFailure::new(
            FailureClass::BranchDetectionFailed,
            format!("Could not determine the current HEAD commit: {error}"),
        )
    })?;
    Ok(head.detach().to_string())
}

fn repo_has_tracked_worktree_changes(repo_root: &Path) -> Result<bool, JsonFailure> {
    let repo = gix::discover(repo_root).map_err(|error| {
        JsonFailure::new(
            FailureClass::WorkspaceNotSafe,
            format!("Could not discover the current repository: {error}"),
        )
    })?;
    repo.is_dirty().map_err(|error| {
        JsonFailure::new(
            FailureClass::WorkspaceNotSafe,
            format!(
                "Could not determine whether the repository has tracked worktree changes: {error}"
            ),
        )
    })
}

fn repo_has_tracked_worktree_changes_excluding_execution_evidence(
    repo_root: &Path,
) -> Result<bool, JsonFailure> {
    let output = Command::new("git")
        .current_dir(repo_root)
        .args([
            "status",
            "--porcelain",
            "--untracked-files=no",
            "--",
            ".",
            ":(exclude)docs/featureforge/execution-evidence/**",
        ])
        .output()
        .map_err(|error| {
            JsonFailure::new(
                FailureClass::WorkspaceNotSafe,
                format!(
                    "Could not determine whether tracked worktree changes remain outside execution evidence: {error}"
                ),
            )
        })?;
    if !output.status.success() {
        return Err(JsonFailure::new(
            FailureClass::WorkspaceNotSafe,
            "Could not determine whether tracked worktree changes remain outside execution evidence.",
        ));
    }
    Ok(!String::from_utf8_lossy(&output.stdout).trim().is_empty())
}

pub fn state_dir() -> PathBuf {
    featureforge_state_dir()
}

pub fn current_file_proof(repo_root: &Path, path: &str) -> String {
    if path == NO_REPO_FILES_MARKER {
        return String::from("sha256:none");
    }
    let abs = repo_root.join(path);
    match fs::read(&abs) {
        Ok(contents) => format!("sha256:{}", sha256_hex(&contents)),
        Err(_) => String::from("sha256:missing"),
    }
}

pub fn current_file_proof_checked(repo_root: &Path, path: &str) -> Result<String, String> {
    if path == NO_REPO_FILES_MARKER {
        return Ok(String::from("sha256:none"));
    }
    let abs = repo_root.join(path);
    match fs::read(&abs) {
        Ok(contents) => Ok(format!("sha256:{}", sha256_hex(&contents))),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(String::from("sha256:missing")),
        Err(error) => Err(error.to_string()),
    }
}

fn normalize_persisted_file_path(path: &str) -> Result<String, JsonFailure> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Execution evidence must include at least one repo-relative file entry.",
        ));
    }
    normalize_repo_relative_path(trimmed).map_err(JsonFailure::from)
}

pub fn require_normalized_text(
    value: &str,
    failure_class: FailureClass,
    message: &str,
) -> Result<String, JsonFailure> {
    let normalized = normalize_whitespace(value);
    if normalized.is_empty() {
        return Err(JsonFailure::new(failure_class, message));
    }
    Ok(normalized)
}

fn repo_head_detached(context: &ExecutionContext) -> Result<bool, HeadError> {
    let repo = gix::discover(&context.runtime.repo_root).map_err(|error| HeadError {
        message: format!("Could not discover the current repository: {error}"),
    })?;
    let head = repo.head().map_err(|error| HeadError {
        message: format!("Could not determine the current branch: {error}"),
    })?;
    Ok(head.is_detached())
}

#[derive(Debug)]
struct HeadError {
    message: String,
}

#[derive(Debug)]
pub struct GateState {
    pub allowed: bool,
    pub failure_class: String,
    pub reason_codes: Vec<String>,
    pub warning_codes: Vec<String>,
    pub diagnostics: Vec<GateDiagnostic>,
}

impl Default for GateState {
    fn default() -> Self {
        Self {
            allowed: true,
            failure_class: String::new(),
            reason_codes: Vec::new(),
            warning_codes: Vec::new(),
            diagnostics: Vec::new(),
        }
    }
}

impl GateState {
    pub fn from_result(result: GateResult) -> Self {
        Self {
            allowed: result.allowed,
            failure_class: result.failure_class,
            reason_codes: result.reason_codes,
            warning_codes: result.warning_codes,
            diagnostics: result.diagnostics,
        }
    }

    pub fn fail(
        &mut self,
        failure_class: FailureClass,
        code: &str,
        message: impl Into<String>,
        remediation: impl Into<String>,
    ) {
        self.allowed = false;
        if self.failure_class.is_empty() {
            self.failure_class = failure_class.as_str().to_owned();
        }
        if !self.reason_codes.iter().any(|existing| existing == code) {
            self.reason_codes.push(code.to_owned());
            self.diagnostics.push(GateDiagnostic {
                code: code.to_owned(),
                severity: String::from("error"),
                message: message.into(),
                remediation: remediation.into(),
            });
        }
    }

    pub fn warn(&mut self, code: &str) {
        if !self.warning_codes.iter().any(|existing| existing == code) {
            self.warning_codes.push(code.to_owned());
        }
    }

    pub fn finish(mut self) -> GateResult {
        if self.failure_class.is_empty() {
            self.allowed = true;
        }
        GateResult {
            allowed: self.allowed,
            failure_class: self.failure_class,
            reason_codes: self.reason_codes,
            warning_codes: self.warning_codes,
            diagnostics: self.diagnostics,
        }
    }
}

fn normalize_plan_path(plan_path: &Path) -> Result<String, JsonFailure> {
    let raw = plan_path.to_string_lossy();
    let normalized = RepoPath::parse(&raw).map_err(|_| {
        JsonFailure::new(
            FailureClass::InvalidCommandInput,
            "Plan path must be a normalized repo-relative path.",
        )
    })?;
    let required_prefix = format!("{ACTIVE_PLAN_ROOT}/");
    if !normalized.as_str().starts_with(&required_prefix) {
        return Err(JsonFailure::new(
            FailureClass::InvalidCommandInput,
            "Plan path must live under docs/featureforge/plans/.",
        ));
    }
    Ok(normalized.as_str().to_owned())
}

fn validate_source_spec(
    source: &str,
    expected_path: &str,
    expected_revision: u32,
    runtime: &ExecutionRuntime,
    matching_manifest: Option<&WorkflowManifest>,
) -> Result<(), JsonFailure> {
    let headers = parse_headers(source);
    if headers.get("Workflow State") != Some(&String::from("CEO Approved")) {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan source spec is not CEO Approved.",
        ));
    }
    if headers
        .get("Spec Revision")
        .and_then(|value| value.parse::<u32>().ok())
        != Some(expected_revision)
    {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan source spec path or revision is stale.",
        ));
    }
    match headers.get("Last Reviewed By").map(String::as_str) {
        Some("plan-ceo-review") => {}
        _ => {
            return Err(JsonFailure::new(
                FailureClass::PlanNotExecutionReady,
                "Approved plan source spec Last Reviewed By header is missing or malformed.",
            ));
        }
    }
    let approved_spec_candidates = approved_spec_candidate_paths(&runtime.repo_root);
    let manifest_selected_spec =
        matching_manifest.is_some_and(|manifest| manifest.expected_spec_path == expected_path);
    if approved_spec_candidates.len() > 1 && !manifest_selected_spec {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved spec candidates are ambiguous.",
        ));
    }
    if !approved_spec_candidates
        .iter()
        .any(|candidate| candidate == expected_path)
    {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan source spec path or revision is stale.",
        ));
    }
    Ok(())
}

fn validate_unique_approved_plan(
    expected_plan_path: &str,
    source_spec_path: &str,
    source_spec_revision: u32,
    runtime: &ExecutionRuntime,
    matching_manifest: Option<&WorkflowManifest>,
) -> Result<(), JsonFailure> {
    let approved_plan_candidates =
        approved_plan_candidate_paths(&runtime.repo_root, source_spec_path, source_spec_revision);
    let manifest_selected_plan =
        matching_manifest.is_some_and(|manifest| manifest.expected_plan_path == expected_plan_path);
    if approved_plan_candidates.len() > 1 && !manifest_selected_plan {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan candidates are ambiguous.",
        ));
    }
    if !approved_plan_candidates
        .iter()
        .any(|candidate| candidate == expected_plan_path)
    {
        return Err(JsonFailure::new(
            FailureClass::PlanNotExecutionReady,
            "Approved plan is not the unique current approved plan for its source spec.",
        ));
    }
    Ok(())
}

fn matching_workflow_manifest(runtime: &ExecutionRuntime) -> Option<WorkflowManifest> {
    let user_name = env::var("USER").unwrap_or_else(|_| String::from("user"));
    let manifest_path = runtime
        .state_dir
        .join("projects")
        .join(&runtime.repo_slug)
        .join(format!(
            "{user_name}-{}-workflow-state.json",
            runtime.safe_branch
        ));
    let ManifestLoadResult::Loaded(manifest) = load_manifest_read_only(&manifest_path) else {
        return None;
    };
    if stored_repo_root_matches_current(&manifest.repo_root, &runtime.repo_root)
        && manifest.branch == runtime.branch_name
    {
        Some(manifest)
    } else {
        None
    }
}

fn repo_safety_stage(context: &ExecutionContext) -> String {
    match context.plan_document.execution_mode.as_str() {
        "featureforge:executing-plans" | "featureforge:subagent-driven-development" => {
            context.plan_document.execution_mode.clone()
        }
        _ => String::from("featureforge:execution-preflight"),
    }
}

fn repo_safety_preflight_message(result: &crate::repo_safety::RepoSafetyResult) -> String {
    match result.failure_class.as_str() {
        "ProtectedBranchDetected" => format!(
            "Execution preflight cannot continue on protected branch {} without explicit approval.",
            result.branch
        ),
        "ApprovalScopeMismatch" => String::from(
            "Execution preflight repo-safety approval does not match the current scope.",
        ),
        "ApprovalFingerprintMismatch" => String::from(
            "Execution preflight repo-safety approval does not match the current branch or write scope.",
        ),
        _ => String::from("Execution preflight is blocked by repo-safety policy."),
    }
}

fn repo_safety_preflight_remediation(result: &crate::repo_safety::RepoSafetyResult) -> String {
    if !result.suggested_next_skill.is_empty() {
        format!(
            "Use {} or explicitly approve the protected-branch execution scope before continuing.",
            result.suggested_next_skill
        )
    } else {
        String::from("Resolve the repo-safety blocker before continuing execution.")
    }
}

fn repo_has_unresolved_index_entries(repo_root: &Path) -> Result<bool, JsonFailure> {
    let repo = gix::discover(repo_root).map_err(|error| {
        JsonFailure::new(
            FailureClass::WorkspaceNotSafe,
            format!("Could not discover the current repository: {error}"),
        )
    })?;
    let index = repo.open_index().map_err(|error| {
        JsonFailure::new(
            FailureClass::WorkspaceNotSafe,
            format!("Could not open the repository index: {error}"),
        )
    })?;
    Ok(index
        .entries()
        .iter()
        .any(|entry| entry.stage() != gix::index::entry::Stage::Unconflicted))
}

fn parse_headers(source: &str) -> BTreeMap<String, String> {
    source
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            let rest = line.strip_prefix("**")?;
            let (key, value) = rest.split_once(":** ")?;
            Some((key.to_owned(), value.to_owned()))
        })
        .collect()
}

fn parse_headers_file(path: &Path) -> BTreeMap<String, String> {
    fs::read_to_string(path)
        .ok()
        .map(|source| parse_headers(&source))
        .unwrap_or_default()
}

fn approved_spec_candidate_paths(repo_root: &Path) -> Vec<String> {
    let mut candidates = markdown_files_under(&repo_root.join(ACTIVE_SPEC_ROOT))
        .into_iter()
        .filter_map(|path| {
            let headers = parse_headers_file(&path);
            if headers.get("Workflow State").map(String::as_str) != Some("CEO Approved") {
                return None;
            }
            let revision_valid = headers
                .get("Spec Revision")
                .and_then(|value| value.parse::<u32>().ok())
                .is_some();
            let reviewed_by_valid =
                headers.get("Last Reviewed By").map(String::as_str) == Some("plan-ceo-review");
            if !revision_valid || !reviewed_by_valid {
                return None;
            }
            path.strip_prefix(repo_root)
                .ok()
                .map(|relative| relative.to_string_lossy().replace('\\', "/"))
        })
        .collect::<Vec<_>>();
    candidates.sort();
    candidates
}

fn approved_plan_candidate_paths(
    repo_root: &Path,
    source_spec_path: &str,
    source_spec_revision: u32,
) -> Vec<String> {
    let mut candidates = markdown_files_under(&repo_root.join(ACTIVE_PLAN_ROOT))
        .into_iter()
        .filter_map(|path| {
            let headers = parse_headers_file(&path);
            if headers.get("Workflow State").map(String::as_str) != Some("Engineering Approved") {
                return None;
            }
            let execution_mode_valid = matches!(
                headers.get("Execution Mode").map(String::as_str),
                Some("none")
                    | Some("featureforge:executing-plans")
                    | Some("featureforge:subagent-driven-development")
            );
            let reviewed_by_valid =
                headers.get("Last Reviewed By").map(String::as_str) == Some("plan-eng-review");
            let source_path_matches =
                headers.get("Source Spec") == Some(&format!("`{source_spec_path}`"));
            let source_revision_matches = headers
                .get("Source Spec Revision")
                .and_then(|value| value.parse::<u32>().ok())
                == Some(source_spec_revision);
            let plan_revision_valid = headers
                .get("Plan Revision")
                .and_then(|value| value.parse::<u32>().ok())
                .is_some();
            if !execution_mode_valid
                || !reviewed_by_valid
                || !source_path_matches
                || !source_revision_matches
                || !plan_revision_valid
            {
                return None;
            }
            path.strip_prefix(repo_root)
                .ok()
                .map(|relative| relative.to_string_lossy().replace('\\', "/"))
        })
        .collect::<Vec<_>>();
    candidates.sort();
    candidates
}

fn parse_step_state(
    source: &str,
    plan_document: &PlanDocument,
) -> Result<Vec<PlanStepState>, JsonFailure> {
    let mut step_titles = BTreeMap::new();
    for task in &plan_document.tasks {
        for step in &task.steps {
            step_titles.insert((task.number, step.number), step.text.clone());
        }
    }

    let lines = source.lines().collect::<Vec<_>>();
    let mut current_task = None::<u32>;
    let mut steps = Vec::new();
    let mut line_index = 0;
    while line_index < lines.len() {
        let line = lines[line_index];
        if let Some(rest) = line.strip_prefix("## Task ") {
            current_task = rest
                .split(':')
                .next()
                .and_then(|value| value.parse::<u32>().ok());
            line_index += 1;
            continue;
        }

        if let Some((checked, step_number, title)) = parse_step_line(line) {
            let task_number = current_task.ok_or_else(|| {
                JsonFailure::new(
                    FailureClass::PlanNotExecutionReady,
                    "Plan step headings must live within a task section.",
                )
            })?;
            let canonical_title = step_titles
                .get(&(task_number, step_number))
                .cloned()
                .unwrap_or(title);
            let mut note_state = None;
            let mut note_summary = String::new();
            let mut cursor = line_index + 1;
            while cursor < lines.len() && lines[cursor].is_empty() {
                cursor += 1;
            }
            if cursor < lines.len()
                && let Some((parsed_state, parsed_summary)) = parse_note_line(lines[cursor])
            {
                if parsed_summary.is_empty() {
                    return Err(JsonFailure::new(
                        FailureClass::MalformedExecutionState,
                        "Execution note summaries may not be blank after whitespace normalization.",
                    ));
                }
                if parsed_summary.chars().count() > 120 {
                    return Err(JsonFailure::new(
                        FailureClass::MalformedExecutionState,
                        "Execution note summaries may not exceed 120 characters.",
                    ));
                }
                note_state = Some(parsed_state);
                note_summary = parsed_summary;
                let mut duplicate_cursor = cursor + 1;
                while duplicate_cursor < lines.len() && lines[duplicate_cursor].is_empty() {
                    duplicate_cursor += 1;
                }
                if duplicate_cursor < lines.len()
                    && parse_note_line(lines[duplicate_cursor]).is_some()
                {
                    return Err(JsonFailure::new(
                        FailureClass::MalformedExecutionState,
                        "Plan may have at most one execution note per step.",
                    ));
                }
            }

            steps.push(PlanStepState {
                task_number,
                step_number,
                title: canonical_title,
                checked,
                note_state,
                note_summary,
            });
        }
        line_index += 1;
    }

    Ok(steps)
}

pub(crate) fn parse_step_line(line: &str) -> Option<(bool, u32, String)> {
    let rest = line.strip_prefix("- [")?;
    let mark = rest.chars().next()?;
    let checked = mark == 'x';
    if mark != 'x' && mark != ' ' {
        return None;
    }
    let rest = &rest[mark.len_utf8()..];
    let rest = rest.strip_prefix("] **Step ")?;
    let (step, title) = rest.split_once(": ")?;
    Some((
        checked,
        step.parse::<u32>().ok()?,
        title.trim_end_matches("**").to_owned(),
    ))
}

fn parse_note_line(line: &str) -> Option<(NoteState, String)> {
    let rest = line.trim_start().strip_prefix("**Execution Note:** ")?;
    let (state, summary) = rest.split_once(" - ")?;
    let note_state = match state {
        "Active" => NoteState::Active,
        "Blocked" => NoteState::Blocked,
        "Interrupted" => NoteState::Interrupted,
        _ => return None,
    };
    Some((note_state, normalize_whitespace(summary)))
}

fn parse_evidence_file(
    evidence_abs: &Path,
    expected_plan_path: &str,
    expected_plan_revision: u32,
    expected_spec_path: &str,
    expected_spec_revision: u32,
) -> Result<ExecutionEvidence, JsonFailure> {
    if !evidence_abs.is_file() {
        return Ok(ExecutionEvidence {
            format: EvidenceFormat::Empty,
            plan_path: expected_plan_path.to_owned(),
            plan_revision: expected_plan_revision,
            plan_fingerprint: None,
            source_spec_path: expected_spec_path.to_owned(),
            source_spec_revision: expected_spec_revision,
            source_spec_fingerprint: None,
            attempts: Vec::new(),
            source: None,
        });
    }

    let source = fs::read_to_string(evidence_abs).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Could not read execution evidence {}: {error}",
                evidence_abs.display()
            ),
        )
    })?;
    let headers = parse_headers(&source);
    let format = if headers.contains_key("Plan Fingerprint") {
        EvidenceFormat::V2
    } else {
        EvidenceFormat::Legacy
    };
    let attempts = parse_evidence_attempts(&source, format)?;
    if attempts.is_empty() {
        return Ok(ExecutionEvidence {
            format: EvidenceFormat::Empty,
            plan_path: expected_plan_path.to_owned(),
            plan_revision: expected_plan_revision,
            plan_fingerprint: headers.get("Plan Fingerprint").cloned(),
            source_spec_path: headers
                .get("Source Spec Path")
                .cloned()
                .unwrap_or_else(|| expected_spec_path.to_owned()),
            source_spec_revision: headers
                .get("Source Spec Revision")
                .and_then(|value| value.parse::<u32>().ok())
                .unwrap_or(expected_spec_revision),
            source_spec_fingerprint: headers.get("Source Spec Fingerprint").cloned(),
            attempts,
            source: Some(source),
        });
    }

    Ok(ExecutionEvidence {
        format,
        plan_path: headers
            .get("Plan Path")
            .cloned()
            .unwrap_or_else(|| expected_plan_path.to_owned()),
        plan_revision: headers
            .get("Plan Revision")
            .and_then(|value| value.parse::<u32>().ok())
            .unwrap_or(expected_plan_revision),
        plan_fingerprint: headers.get("Plan Fingerprint").cloned(),
        source_spec_path: headers
            .get("Source Spec Path")
            .cloned()
            .unwrap_or_else(|| expected_spec_path.to_owned()),
        source_spec_revision: headers
            .get("Source Spec Revision")
            .and_then(|value| value.parse::<u32>().ok())
            .unwrap_or(expected_spec_revision),
        source_spec_fingerprint: headers.get("Source Spec Fingerprint").cloned(),
        attempts,
        source: Some(source),
    })
}

fn parse_evidence_attempts(
    source: &str,
    format: EvidenceFormat,
) -> Result<Vec<EvidenceAttempt>, JsonFailure> {
    let lines = source.lines().collect::<Vec<_>>();
    let mut attempts = Vec::new();
    let mut next_attempt_by_step = BTreeMap::<(u32, u32), u32>::new();
    let mut line_index = 0;
    let mut current_task = None::<u32>;
    let mut current_step = None::<u32>;

    while line_index < lines.len() {
        let line = lines[line_index];
        if let Some(rest) = line.strip_prefix("### Task ") {
            let (task, step) = rest.split_once(" Step ").ok_or_else(|| {
                JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence step heading is malformed.",
                )
            })?;
            current_task = task.parse::<u32>().ok();
            current_step = step.parse::<u32>().ok();
            line_index += 1;
            continue;
        }

        if let Some(rest) = line.strip_prefix("#### Attempt ") {
            let task_number = current_task.ok_or_else(|| {
                JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence attempt is missing its step heading.",
                )
            })?;
            let step_number = current_step.ok_or_else(|| {
                JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence attempt is missing its step heading.",
                )
            })?;
            let attempt_number = rest.parse::<u32>().map_err(|_| {
                JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence attempt number is malformed.",
                )
            })?;
            let expected_attempt = next_attempt_by_step
                .get(&(task_number, step_number))
                .copied()
                .unwrap_or(1);
            if attempt_number != expected_attempt {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence attempts must start at 1 and increase sequentially per step.",
                ));
            }
            next_attempt_by_step.insert((task_number, step_number), expected_attempt + 1);

            let mut status = String::new();
            let mut recorded_at = String::new();
            let mut execution_source = String::new();
            let mut claim = String::new();
            let mut files = Vec::new();
            let mut file_proofs = Vec::new();
            let mut verify_command = None;
            let mut verification_summary = String::new();
            let mut invalidation_reason = String::new();
            let mut packet_fingerprint = None;
            let mut head_sha = None;
            let mut base_sha = None;
            let mut source_contract_path = None;
            let mut source_contract_fingerprint = None;
            let mut source_evaluation_report_fingerprint = None;
            let mut evaluator_verdict = None;
            let mut failing_criterion_ids = Vec::new();
            let mut source_handoff_fingerprint = None;
            let mut repo_state_baseline_head_sha = None;
            let mut repo_state_baseline_worktree_fingerprint = None;

            line_index += 1;
            while line_index < lines.len() {
                let line = lines[line_index];
                if line.starts_with("#### Attempt ") || line.starts_with("### Task ") {
                    line_index = line_index.saturating_sub(1);
                    break;
                }

                if let Some(value) = line.strip_prefix("**Status:** ") {
                    status = normalize_whitespace(value);
                } else if let Some(value) = line.strip_prefix("**Recorded At:** ") {
                    recorded_at = value.to_owned();
                } else if let Some(value) = line.strip_prefix("**Execution Source:** ") {
                    execution_source = normalize_whitespace(value);
                } else if let Some(value) = line.strip_prefix("**Packet Fingerprint:** ") {
                    packet_fingerprint = Some(normalize_whitespace(value));
                } else if let Some(value) = line.strip_prefix("**Head SHA:** ") {
                    head_sha = Some(normalize_whitespace(value));
                } else if let Some(value) = line.strip_prefix("**Base SHA:** ") {
                    base_sha = Some(normalize_whitespace(value));
                } else if let Some(value) = line.strip_prefix("**Claim:** ") {
                    claim = normalize_whitespace(value);
                } else if let Some(value) = line.strip_prefix("**Source Contract Path:** ") {
                    source_contract_path = parse_optional_evidence_scalar(value);
                } else if let Some(value) = line.strip_prefix("**Source Contract Fingerprint:** ") {
                    source_contract_fingerprint = parse_optional_evidence_scalar(value);
                } else if let Some(value) =
                    line.strip_prefix("**Source Evaluation Report Fingerprint:** ")
                {
                    source_evaluation_report_fingerprint = parse_optional_evidence_scalar(value);
                } else if let Some(value) = line.strip_prefix("**Evaluator Verdict:** ") {
                    evaluator_verdict = parse_optional_evidence_scalar(value);
                } else if line == "**Failing Criterion IDs:**" {
                    line_index += 1;
                    while line_index < lines.len() {
                        let criterion_line = lines[line_index].trim();
                        if criterion_line.is_empty() {
                            line_index += 1;
                            continue;
                        }
                        if criterion_line == "[]" {
                            line_index += 1;
                            continue;
                        }
                        if criterion_line.starts_with("**")
                            || criterion_line.starts_with("### ")
                            || criterion_line.starts_with("#### ")
                        {
                            line_index = line_index.saturating_sub(1);
                            break;
                        }
                        if let Some(value) = criterion_line.strip_prefix("- ") {
                            if let Some(criterion_id) = parse_optional_evidence_scalar(value) {
                                failing_criterion_ids.push(criterion_id);
                            }
                            line_index += 1;
                            continue;
                        }
                        line_index = line_index.saturating_sub(1);
                        break;
                    }
                } else if let Some(value) = line.strip_prefix("**Source Handoff Fingerprint:** ") {
                    source_handoff_fingerprint = parse_optional_evidence_scalar(value);
                } else if let Some(value) = line.strip_prefix("**Repo State Baseline Head SHA:** ")
                {
                    repo_state_baseline_head_sha = parse_optional_evidence_scalar(value);
                } else if let Some(value) =
                    line.strip_prefix("**Repo State Baseline Worktree Fingerprint:** ")
                {
                    repo_state_baseline_worktree_fingerprint =
                        parse_optional_evidence_scalar(value);
                } else if line == "**Files Proven:**" {
                    line_index += 1;
                    while line_index < lines.len() {
                        let proof_line = lines[line_index];
                        if let Some(proof_entry) = proof_line.strip_prefix("- ") {
                            let (path, proof) = proof_entry.split_once(" | ").ok_or_else(|| {
                                JsonFailure::new(
                                    FailureClass::MalformedExecutionState,
                                    "Execution evidence Files Proven bullets must include a proof suffix.",
                                )
                            })?;
                            let path = normalize_persisted_file_path(path).map_err(|_| {
                                JsonFailure::new(
                                    FailureClass::MalformedExecutionState,
                                    "Execution evidence Files Proven bullets must use canonical repo-relative paths.",
                                )
                            })?;
                            files.push(path.clone());
                            file_proofs.push(FileProof {
                                path,
                                proof: proof.to_owned(),
                            });
                            line_index += 1;
                            continue;
                        }
                        line_index = line_index.saturating_sub(1);
                        break;
                    }
                } else if line == "**Files:**" {
                    line_index += 1;
                    while line_index < lines.len() {
                        let legacy_line = lines[line_index];
                        if let Some(path) = legacy_line.strip_prefix("- ") {
                            let path = normalize_persisted_file_path(path).map_err(|_| {
                                JsonFailure::new(
                                    FailureClass::MalformedExecutionState,
                                    "Execution evidence Files bullets must use canonical repo-relative paths.",
                                )
                            })?;
                            files.push(path.clone());
                            file_proofs.push(FileProof {
                                path,
                                proof: String::from("sha256:unknown"),
                            });
                            line_index += 1;
                            continue;
                        }
                        line_index = line_index.saturating_sub(1);
                        break;
                    }
                } else if let Some(value) = line.strip_prefix("**Verify Command:** ") {
                    verify_command = parse_optional_evidence_scalar(value)
                        .or_else(|| Some(normalize_whitespace(value)).filter(|candidate| !candidate.is_empty()));
                } else if let Some(value) = line.strip_prefix("**Verification Summary:** ") {
                    verification_summary = normalize_whitespace(value);
                } else if line == "**Verification:**" {
                    line_index += 1;
                    if line_index < lines.len()
                        && let Some(value) = lines[line_index].strip_prefix("- ")
                    {
                        verification_summary = normalize_whitespace(value);
                    }
                } else if let Some(value) = line.strip_prefix("**Invalidation Reason:** ") {
                    invalidation_reason = normalize_whitespace(value);
                }

                line_index += 1;
            }

            if !matches!(status.as_str(), "Completed" | "Invalidated") {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence status must be Completed or Invalidated.",
                ));
            }
            if recorded_at.trim().is_empty() {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence recorded-at timestamps may not be blank.",
                ));
            }
            if execution_source.is_empty() {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence source may not be blank.",
                ));
            }
            if !matches!(
                execution_source.as_str(),
                "featureforge:executing-plans" | "featureforge:subagent-driven-development"
            ) {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence source must be one of the supported execution modes.",
                ));
            }
            if claim.is_empty() {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence claims may not be blank after whitespace normalization.",
                ));
            }
            if files.is_empty() {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence must include at least one repo-relative file entry.",
                ));
            }
            if verification_summary.is_empty() {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence verification summaries may not be blank after whitespace normalization.",
                ));
            }
            if invalidation_reason.is_empty() {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Execution evidence invalidation reasons may not be blank after whitespace normalization.",
                ));
            }
            if status == "Invalidated" && invalidation_reason == "N/A" {
                return Err(JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    "Invalidated execution evidence must carry a real invalidation reason.",
                ));
            }

            let verify_command = verify_command
                .or_else(|| parse_command_verification_summary(&verification_summary));

            attempts.push(EvidenceAttempt {
                task_number,
                step_number,
                attempt_number,
                status,
                recorded_at,
                execution_source,
                claim,
                files,
                file_proofs,
                verify_command,
                verification_summary,
                invalidation_reason,
                packet_fingerprint,
                head_sha,
                base_sha,
                source_contract_path,
                source_contract_fingerprint,
                source_evaluation_report_fingerprint,
                evaluator_verdict,
                failing_criterion_ids,
                source_handoff_fingerprint,
                repo_state_baseline_head_sha,
                repo_state_baseline_worktree_fingerprint,
            });
        }

        line_index += 1;
    }

    if format == EvidenceFormat::V2 && attempts.is_empty() && source.contains("### Task ") {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Execution evidence v2 attempts could not be parsed.",
        ));
    }
    Ok(attempts)
}

fn parse_optional_evidence_scalar(value: &str) -> Option<String> {
    let normalized = normalize_whitespace(value);
    let trimmed = normalized.trim().trim_matches('`').trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_owned())
    }
}

fn compute_execution_fingerprint(plan_source: &str, evidence_source: Option<&str>) -> String {
    let mut payload = String::from("plan\n");
    payload.push_str(plan_source);
    payload.push_str("\n--evidence--\n");
    if let Some(source) = evidence_source {
        if source.contains("### Task ") {
            payload.push_str(source);
        } else {
            payload.push_str("__EMPTY_EVIDENCE__\n");
        }
    } else {
        payload.push_str("__EMPTY_EVIDENCE__\n");
    }
    sha256_hex(payload.as_bytes())
}

fn parse_contract_render(source: &str) -> String {
    let lines = source.lines().collect::<Vec<_>>();
    let mut rendered = Vec::new();
    let mut suppress_note = false;

    for line in lines {
        if suppress_note {
            if line.is_empty() || line.trim_start().starts_with("**Execution Note:**") {
                continue;
            }
            suppress_note = false;
        }
        if line.starts_with("**Execution Mode:** ") {
            rendered.push(String::from("**Execution Mode:** none"));
            continue;
        }
        if let Some((_, step_number, title)) = parse_step_line(line) {
            rendered.push(format!("- [ ] **Step {step_number}: {title}**"));
            suppress_note = true;
            continue;
        }
        rendered.push(line.to_owned());
    }

    format!("{}\n", rendered.join("\n"))
}

fn latest_completed_attempt(evidence: &ExecutionEvidence) -> Option<&EvidenceAttempt> {
    evidence
        .attempts
        .iter()
        .enumerate()
        .filter(|(_, attempt)| attempt.status == "Completed")
        .max_by(|(left_index, left_attempt), (right_index, right_attempt)| {
            left_attempt
                .recorded_at
                .cmp(&right_attempt.recorded_at)
                .then_with(|| left_index.cmp(right_index))
        })
        .map(|(_, attempt)| attempt)
}

pub(crate) fn prior_task_number_for_begin(
    context: &ExecutionContext,
    target_task: u32,
) -> Option<u32> {
    context
        .tasks_by_number
        .keys()
        .copied()
        .filter(|task_number| *task_number < target_task)
        .max()
}

pub(crate) fn require_prior_task_closure_for_begin(
    context: &ExecutionContext,
    target_task: u32,
) -> Result<(), JsonFailure> {
    let Some(prior_task) = prior_task_number_for_begin(context, target_task) else {
        return Ok(());
    };

    if prior_task_cycle_break_active(context, prior_task)? {
        return Err(task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "task_cycle_break_active",
            format!(
                "Task {prior_task} is in cycle-break remediation; Task {target_task} may not begin until remediation closes."
            ),
        ));
    }

    ensure_prior_task_review_dispatch_closed(context, prior_task, target_task)?;
    ensure_prior_task_review_closed(context, prior_task, target_task)?;
    ensure_prior_task_verification_closed(context, prior_task, target_task)?;
    Ok(())
}

fn ensure_prior_task_review_closed(
    context: &ExecutionContext,
    prior_task: u32,
    target_task: u32,
) -> Result<(), JsonFailure> {
    let execution_run_id = current_execution_run_id(context)?.ok_or_else(|| {
        task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_not_green",
            format!(
                "Task {target_task} may not begin because Task {prior_task} review provenance is missing execution run identity."
            ),
        )
    })?;

    let task_steps = context
        .steps
        .iter()
        .filter(|step| step.task_number == prior_task)
        .collect::<Vec<_>>();
    if task_steps.is_empty() {
        return Err(task_boundary_error(
            FailureClass::MalformedExecutionState,
            "prior_task_review_not_green",
            format!("Task {prior_task} has no parsed steps in the approved plan state."),
        ));
    }

    for step in task_steps {
        if !step.checked {
            return Err(task_boundary_error(
                FailureClass::ExecutionStateNotReady,
                "prior_task_review_not_green",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} Step {} remains unchecked.",
                    step.step_number
                ),
            ));
        }
        let Some(attempt) = latest_attempt_for_step(&context.evidence, prior_task, step.step_number)
        else {
            return Err(task_boundary_error(
                FailureClass::ExecutionStateNotReady,
                "prior_task_review_not_green",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} Step {} is missing execution evidence.",
                    step.step_number
                ),
            ));
        };
        if attempt.status != "Completed" {
            return Err(task_boundary_error(
                FailureClass::ExecutionStateNotReady,
                "prior_task_review_not_green",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} Step {} has no completed evidence attempt.",
                    step.step_number
                ),
            ));
        }

        let expected_packet_fingerprint = attempt
            .packet_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                task_boundary_error(
                    FailureClass::MalformedExecutionState,
                    "task_review_receipt_malformed",
                    format!(
                        "Task {prior_task} Step {} is missing packet fingerprint provenance required for review closure.",
                        step.step_number
                    ),
                )
            })?;
        let expected_checkpoint_sha = attempt
            .head_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                task_boundary_error(
                    FailureClass::MalformedExecutionState,
                    "task_review_receipt_malformed",
                    format!(
                        "Task {prior_task} Step {} is missing reviewed checkpoint provenance required for review closure.",
                        step.step_number
                    ),
                )
            })?;

        let receipt_path = authoritative_unit_review_receipt_path(
            context,
            &execution_run_id,
            prior_task,
            step.step_number,
        );
        let receipt_document = parse_required_artifact_document(
            &receipt_path,
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_not_green",
            format!(
                "Task {target_task} may not begin because Task {prior_task} Step {} is missing a dedicated-independent unit-review receipt.",
                step.step_number
            ),
        )?;
        if receipt_document.title.as_deref() != Some("# Unit Review Result")
            || receipt_document.headers.get("Review Stage").map(String::as_str)
                != Some("featureforge:unit-review")
        {
            return Err(task_boundary_error(
                FailureClass::MalformedExecutionState,
                "task_review_receipt_malformed",
                format!(
                    "Task {prior_task} Step {} unit-review receipt is malformed.",
                    step.step_number
                ),
            ));
        }
        if receipt_document
            .headers
            .get("Reviewer Provenance")
            .map(String::as_str)
            != Some("dedicated-independent")
        {
            return Err(task_boundary_error(
                FailureClass::StaleProvenance,
                "task_review_not_independent",
                format!(
                    "Task {prior_task} Step {} unit-review receipt is not dedicated-independent.",
                    step.step_number
                ),
            ));
        }
        let reviewer_source = receipt_document
            .headers
            .get("Reviewer Source")
            .map(String::as_str)
            .unwrap_or_default();
        if !matches!(reviewer_source, "fresh-context-subagent" | "cross-model") {
            return Err(task_boundary_error(
                FailureClass::StaleProvenance,
                "task_review_not_independent",
                format!(
                    "Task {prior_task} Step {} unit-review reviewer source is not independent.",
                    step.step_number
                ),
            ));
        }
        if header_value_without_backticks(receipt_document.headers.get("Source Plan"))
            != Some(context.plan_rel.as_str())
            || receipt_document
                .headers
                .get("Source Plan Revision")
                .and_then(|value| value.parse::<u32>().ok())
                != Some(context.plan_document.plan_revision)
            || receipt_document
                .headers
                .get("Execution Run ID")
                .map(String::as_str)
                != Some(execution_run_id.as_str())
            || receipt_document
                .headers
                .get("Execution Unit ID")
                .map(String::as_str)
                != Some(format!("task-{prior_task}-step-{}", step.step_number).as_str())
            || receipt_document
                .headers
                .get("Reviewed Checkpoint SHA")
                .map(String::as_str)
                != Some(expected_checkpoint_sha)
            || receipt_document
                .headers
                .get("Approved Task Packet Fingerprint")
                .map(String::as_str)
                != Some(expected_packet_fingerprint)
            || receipt_document.headers.get("Result").map(String::as_str) != Some("pass")
            || receipt_document.headers.get("Generated By").map(String::as_str)
                != Some("featureforge:unit-review")
        {
            return Err(task_boundary_error(
                FailureClass::StaleProvenance,
                "prior_task_review_not_green",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} Step {} review receipt does not match the active task checkpoint provenance.",
                    step.step_number
                ),
            ));
        }
    }

    Ok(())
}

fn ensure_prior_task_verification_closed(
    context: &ExecutionContext,
    prior_task: u32,
    target_task: u32,
) -> Result<(), JsonFailure> {
    let execution_run_id = current_execution_run_id(context)?.ok_or_else(|| {
        task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_verification_missing",
            format!(
                "Task {target_task} may not begin because Task {prior_task} verification provenance is missing execution run identity."
            ),
        )
    })?;
    let strategy_checkpoint_fingerprint = authoritative_strategy_checkpoint_fingerprint_checked(context)
        .map_err(|error| {
            task_boundary_error(
                FailureClass::MalformedExecutionState,
                "task_verification_receipt_malformed",
                format!(
                    "Task {prior_task} verification receipt cannot be validated without authoritative strategy checkpoint provenance: {}",
                    error.message
                ),
            )
        })?
        .ok_or_else(|| {
            task_boundary_error(
                FailureClass::MalformedExecutionState,
                "task_verification_receipt_malformed",
                format!(
                    "Task {prior_task} verification receipt cannot be validated because authoritative strategy checkpoint provenance is missing."
                ),
            )
        })?;

    let verification_reason_code = if context.evidence.format == EvidenceFormat::Legacy {
        "prior_task_verification_missing_legacy"
    } else {
        "prior_task_verification_missing"
    };
    let receipt_path =
        authoritative_task_verification_receipt_path(context, &execution_run_id, prior_task);
    let receipt_document = parse_required_artifact_document(
        &receipt_path,
        FailureClass::ExecutionStateNotReady,
        verification_reason_code,
        format!(
            "Task {target_task} may not begin because Task {prior_task} is missing a task-level verification receipt.",
        ),
    )?;

    if receipt_document.title.as_deref() != Some("# Task Verification Result")
        || header_value_without_backticks(receipt_document.headers.get("Source Plan"))
            != Some(context.plan_rel.as_str())
        || receipt_document
            .headers
            .get("Source Plan Revision")
            .and_then(|value| value.parse::<u32>().ok())
            != Some(context.plan_document.plan_revision)
        || receipt_document
            .headers
            .get("Execution Run ID")
            .map(String::as_str)
            != Some(execution_run_id.as_str())
        || receipt_document
            .headers
            .get("Task Number")
            .and_then(|value| value.parse::<u32>().ok())
            != Some(prior_task)
        || receipt_document
            .headers
            .get("Strategy Checkpoint Fingerprint")
            .map(String::as_str)
            != Some(strategy_checkpoint_fingerprint.as_str())
        || receipt_document
            .headers
            .get("Verification Commands")
            .is_none_or(|value| value.trim().is_empty())
        || receipt_document
            .headers
            .get("Verification Results")
            .is_none_or(|value| value.trim().is_empty())
        || receipt_document.headers.get("Result").map(String::as_str) != Some("pass")
        || receipt_document.headers.get("Generated By").map(String::as_str)
            != Some("featureforge:verification-before-completion")
    {
        return Err(task_boundary_error(
            FailureClass::MalformedExecutionState,
            "task_verification_receipt_malformed",
            format!(
                "Task {prior_task} verification receipt is malformed or stale against current task/strategy provenance."
            ),
        ));
    }

    Ok(())
}

fn ensure_prior_task_review_dispatch_closed(
    context: &ExecutionContext,
    prior_task: u32,
    target_task: u32,
) -> Result<(), JsonFailure> {
    let execution_run_id = current_execution_run_id(context)?.ok_or_else(|| {
        task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_dispatch_missing",
            format!(
                "Task {target_task} may not begin because Task {prior_task} review-dispatch provenance is missing execution run identity."
            ),
        )
    })?;
    let strategy_checkpoint_fingerprint = authoritative_strategy_checkpoint_fingerprint_checked(context)
        .map_err(|error| {
            task_boundary_error(
                FailureClass::MalformedExecutionState,
                "prior_task_review_dispatch_stale",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} review dispatch cannot be validated without authoritative strategy checkpoint provenance: {}",
                    error.message
                ),
            )
        })?
        .ok_or_else(|| {
            task_boundary_error(
                FailureClass::MalformedExecutionState,
                "prior_task_review_dispatch_stale",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} review dispatch cannot be validated because authoritative strategy checkpoint provenance is missing."
                ),
            )
        })?;
    let expected_task_completion_lineage =
        task_completion_lineage_fingerprint(context, prior_task).ok_or_else(|| {
            task_boundary_error(
                FailureClass::ExecutionStateNotReady,
                "prior_task_review_dispatch_stale",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} review dispatch lineage cannot be computed from the latest completed task evidence."
                ),
            )
        })?;
    let expected_source_step = latest_attempted_step_for_task(context, prior_task).ok_or_else(|| {
        task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_dispatch_stale",
            format!(
                "Task {target_task} may not begin because Task {prior_task} review dispatch lineage cannot be validated against the latest completed task step evidence."
            ),
        )
    })?;
    let Some(overlay) = load_status_authoritative_overlay_checked(context)? else {
        return Err(task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_dispatch_missing",
            format!(
                "Task {target_task} may not begin because Task {prior_task} is missing required post-completion review-dispatch evidence. Run `featureforge plan execution gate-review-dispatch --plan {}` after Task {prior_task} closes.",
                context.plan_rel
            ),
        ));
    };
    let lineage_key = format!("task-{prior_task}");
    let Some(lineage) = overlay.strategy_review_dispatch_lineage.get(&lineage_key) else {
        return Err(task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_dispatch_missing",
            format!(
                "Task {target_task} may not begin because Task {prior_task} is missing required post-completion review-dispatch evidence. Run `featureforge plan execution gate-review-dispatch --plan {}` after Task {prior_task} closes.",
                context.plan_rel
            ),
        ));
    };
    let expected = TaskReviewDispatchExpectation {
        execution_run_id: &execution_run_id,
        task_completion_lineage: &expected_task_completion_lineage,
        source_step: expected_source_step,
        strategy_checkpoint_fingerprint: &strategy_checkpoint_fingerprint,
    };
    validate_task_review_dispatch_lineage(
        context,
        lineage,
        prior_task,
        target_task,
        expected,
    )
}

struct TaskReviewDispatchExpectation<'a> {
    execution_run_id: &'a str,
    task_completion_lineage: &'a str,
    source_step: u32,
    strategy_checkpoint_fingerprint: &'a str,
}

fn validate_task_review_dispatch_lineage(
    context: &ExecutionContext,
    lineage: &StrategyReviewDispatchLineageRecord,
    prior_task: u32,
    target_task: u32,
    expected: TaskReviewDispatchExpectation<'_>,
) -> Result<(), JsonFailure> {
    let observed_execution_run_id = lineage
        .execution_run_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            task_boundary_error(
                FailureClass::ExecutionStateNotReady,
                "prior_task_review_dispatch_stale",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} review-dispatch lineage is malformed. Re-run `featureforge plan execution gate-review-dispatch --plan {}` for Task {prior_task}.",
                    context.plan_rel
                ),
            )
        })?;
    let observed_source_task = lineage.source_task.ok_or_else(|| {
        task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_dispatch_stale",
            format!(
                "Task {target_task} may not begin because Task {prior_task} review-dispatch lineage is malformed. Re-run `featureforge plan execution gate-review-dispatch --plan {}` for Task {prior_task}.",
                context.plan_rel
            ),
        )
    })?;
    let observed_source_step = lineage.source_step.ok_or_else(|| {
        task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_dispatch_stale",
            format!(
                "Task {target_task} may not begin because Task {prior_task} review-dispatch lineage is malformed. Re-run `featureforge plan execution gate-review-dispatch --plan {}` for Task {prior_task}.",
                context.plan_rel
            ),
        )
    })?;
    let observed_strategy_checkpoint_fingerprint = lineage
        .strategy_checkpoint_fingerprint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            task_boundary_error(
                FailureClass::ExecutionStateNotReady,
                "prior_task_review_dispatch_stale",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} review-dispatch lineage is malformed. Re-run `featureforge plan execution gate-review-dispatch --plan {}` for Task {prior_task}.",
                    context.plan_rel
                ),
            )
        })?;
    let observed_task_completion_lineage = lineage
        .task_completion_lineage_fingerprint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            task_boundary_error(
                FailureClass::ExecutionStateNotReady,
                "prior_task_review_dispatch_stale",
                format!(
                    "Task {target_task} may not begin because Task {prior_task} review-dispatch lineage is malformed. Re-run `featureforge plan execution gate-review-dispatch --plan {}` for Task {prior_task}.",
                    context.plan_rel
                ),
            )
        })?;

    if observed_execution_run_id != expected.execution_run_id
        || observed_source_task != prior_task
        || observed_source_step != expected.source_step
        || observed_strategy_checkpoint_fingerprint != expected.strategy_checkpoint_fingerprint
        || observed_task_completion_lineage != expected.task_completion_lineage
    {
        return Err(task_boundary_error(
            FailureClass::ExecutionStateNotReady,
            "prior_task_review_dispatch_stale",
            format!(
                "Task {target_task} may not begin because Task {prior_task} review-dispatch evidence is stale against current task/strategy lineage. Re-run `featureforge plan execution gate-review-dispatch --plan {}` after Task {prior_task} closure.",
                context.plan_rel
            ),
        ));
    }

    Ok(())
}

fn prior_task_cycle_break_active(
    context: &ExecutionContext,
    prior_task: u32,
) -> Result<bool, JsonFailure> {
    let Some(overlay) = load_status_authoritative_overlay_checked(context)? else {
        return Ok(false);
    };
    let strategy_state = overlay
        .strategy_state
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    let strategy_checkpoint_kind = overlay
        .strategy_checkpoint_kind
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    if strategy_state != "cycle_breaking" && strategy_checkpoint_kind != "cycle_break" {
        return Ok(false);
    }
    let prior_task_has_unresolved_work = context.steps.iter().any(|step| {
        step.task_number == prior_task && (!step.checked || step.note_state.is_some())
    });
    Ok(prior_task_has_unresolved_work)
}

fn current_execution_run_id(context: &ExecutionContext) -> Result<Option<String>, JsonFailure> {
    Ok(preflight_acceptance_for_context(context)?
        .map(|acceptance| acceptance.execution_run_id.0))
}

fn parse_required_artifact_document(
    path: &Path,
    failure_class: FailureClass,
    reason_code: &str,
    missing_message: String,
) -> Result<crate::execution::final_review::ArtifactDocument, JsonFailure> {
    let metadata = fs::symlink_metadata(path).map_err(|error| {
        task_boundary_error(
            failure_class,
            reason_code,
            format!("{missing_message} ({error})"),
        )
    })?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err(task_boundary_error(
            FailureClass::MalformedExecutionState,
            reason_code,
            format!(
                "{missing_message} Artifact path must be a regular file: {}.",
                path.display()
            ),
        ));
    }
    Ok(parse_artifact_document(path))
}

fn authoritative_unit_review_receipt_path(
    context: &ExecutionContext,
    execution_run_id: &str,
    task_number: u32,
    step_number: u32,
) -> PathBuf {
    crate::paths::harness_authoritative_artifact_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
        &format!("unit-review-{execution_run_id}-task-{task_number}-step-{step_number}.md"),
    )
}

fn authoritative_task_verification_receipt_path(
    context: &ExecutionContext,
    execution_run_id: &str,
    task_number: u32,
) -> PathBuf {
    crate::paths::harness_authoritative_artifact_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
        &format!("task-verification-{execution_run_id}-task-{task_number}.md"),
    )
}

fn header_value_without_backticks(value: Option<&String>) -> Option<&str> {
    value.map(String::as_str).map(strip_backticks)
}

fn strip_backticks(value: &str) -> &str {
    value.trim().trim_start_matches('`').trim_end_matches('`')
}

fn task_boundary_error(
    failure_class: FailureClass,
    reason_code: &str,
    message: impl Into<String>,
) -> JsonFailure {
    JsonFailure::new(failure_class, format!("{reason_code}: {}", message.into()))
}

fn task_boundary_reason_code_from_message(message: &str) -> Option<&str> {
    let (candidate, _) = message.split_once(':')?;
    let candidate = candidate.trim();
    if candidate.is_empty() {
        return None;
    }
    if candidate
        .as_bytes()
        .iter()
        .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || *byte == b'_')
    {
        Some(candidate)
    } else {
        None
    }
}

fn latest_attempt_for_step(
    evidence: &ExecutionEvidence,
    task_number: u32,
    step_number: u32,
) -> Option<&EvidenceAttempt> {
    evidence
        .attempts
        .iter()
        .rev()
        .find(|attempt| attempt.task_number == task_number && attempt.step_number == step_number)
}

pub(crate) fn latest_attempted_step_for_task(
    context: &ExecutionContext,
    task_number: u32,
) -> Option<u32> {
    context.evidence.attempts.iter().rev().find_map(|attempt| {
        (attempt.task_number == task_number
            && context
                .steps
                .iter()
                .any(|step| step.task_number == task_number && step.step_number == attempt.step_number))
        .then_some(attempt.step_number)
    })
}

pub(crate) fn task_completion_lineage_fingerprint(
    context: &ExecutionContext,
    task_number: u32,
) -> Option<String> {
    let task_steps = context
        .steps
        .iter()
        .filter(|step| step.task_number == task_number)
        .collect::<Vec<_>>();
    if task_steps.is_empty() {
        return None;
    }

    let mut payload = format!(
        "plan={}\nplan_revision={}\ntask={task_number}\n",
        context.plan_rel, context.plan_document.plan_revision
    );
    for step in task_steps {
        if !step.checked {
            return None;
        }
        let attempt = latest_attempt_for_step(&context.evidence, task_number, step.step_number)?;
        if attempt.status != "Completed" {
            return None;
        }
        let packet_fingerprint = attempt
            .packet_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())?;
        let checkpoint_sha = attempt
            .head_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())?;
        let recorded_at = attempt.recorded_at.trim();
        if recorded_at.is_empty() {
            return None;
        }
        payload.push_str(&format!(
            "step={}:attempt={}:recorded_at={recorded_at}:packet={packet_fingerprint}:checkpoint={checkpoint_sha}\n",
            step.step_number, attempt.attempt_number
        ));
    }
    Some(sha256_hex(payload.as_bytes()))
}

fn latest_attempt_indices_by_step(evidence: &ExecutionEvidence) -> BTreeMap<(u32, u32), usize> {
    let mut indices = BTreeMap::new();
    for (index, attempt) in evidence.attempts.iter().enumerate() {
        indices.insert((attempt.task_number, attempt.step_number), index);
    }
    indices
}

fn latest_completed_attempts_by_step(evidence: &ExecutionEvidence) -> BTreeMap<(u32, u32), usize> {
    let mut indices = BTreeMap::new();
    for (index, attempt) in evidence.attempts.iter().enumerate() {
        if attempt.status == "Completed" {
            indices.insert((attempt.task_number, attempt.step_number), index);
        }
    }
    indices
}

fn latest_completed_attempts_by_file(
    evidence: &ExecutionEvidence,
    latest_attempts_by_step: &BTreeMap<(u32, u32), usize>,
) -> BTreeMap<String, usize> {
    let mut latest_attempts_by_file = BTreeMap::new();
    for index in latest_attempts_by_step.values().copied() {
        let attempt = &evidence.attempts[index];
        for proof in &attempt.file_proofs {
            if proof.path == NO_REPO_FILES_MARKER {
                continue;
            }
            latest_attempts_by_file.insert(proof.path.clone(), index);
        }
    }
    latest_attempts_by_file
}

fn execution_started(context: &ExecutionContext) -> bool {
    context.plan_document.execution_mode != "none"
        || context
            .steps
            .iter()
            .any(|step| step.checked || step.note_state.is_some())
        || !context.evidence.attempts.is_empty()
}

fn active_step(context: &ExecutionContext, note_state: NoteState) -> Option<&PlanStepState> {
    context
        .steps
        .iter()
        .find(|step| step.note_state == Some(note_state))
}
