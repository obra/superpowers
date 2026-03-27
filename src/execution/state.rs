use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use schemars::{schema_for, JsonSchema};
use serde::{Deserialize, Serialize};

use crate::cli::plan_execution::{
    BeginArgs, CompleteArgs, GateContractArgs, GateEvaluatorArgs, GateHandoffArgs,
    IsolatedAgentsArg, NoteArgs, NoteStateArg, RecommendArgs, RecordContractArgs,
    RecordEvaluationArgs, RecordHandoffArgs, ReopenArgs, StatusArgs, TransferArgs,
};
use crate::cli::repo_safety::{RepoSafetyCheckArgs, RepoSafetyIntentArg, RepoSafetyWriteTargetArg};
use crate::contracts::plan::{parse_plan_file, PlanDocument, PlanTask};
use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::harness::{
    AggregateEvaluationState, ChunkId, ChunkingStrategy, DownstreamFreshnessState,
    EvaluationVerdict, EvaluatorKind, EvaluatorPolicyName, ExecutionRunId, HarnessPhase,
    ResetPolicy, INITIAL_AUTHORITATIVE_SEQUENCE,
};
use crate::git::{
    derive_repo_slug, discover_repo_identity, sha256_hex, stored_repo_root_matches_current,
};
use crate::paths::{
    branch_storage_key, featureforge_state_dir, harness_authoritative_artifacts_dir,
    harness_branch_root, harness_state_path, normalize_repo_relative_path, normalize_whitespace,
    write_atomic as write_atomic_file, RepoPath,
};
use crate::repo_safety::RepoSafetyRuntime;
use crate::workflow::manifest::{load_manifest_read_only, ManifestLoadResult, WorkflowManifest};
use crate::workflow::markdown_scan::markdown_files_under;

pub const NO_REPO_FILES_MARKER: &str = "__featureforge__/no-repo-files";
const ACTIVE_SPEC_ROOT: &str = "docs/featureforge/specs";
const ACTIVE_PLAN_ROOT: &str = "docs/featureforge/plans";
const ACTIVE_EVIDENCE_ROOT: &str = "docs/featureforge/execution-evidence";
const PREFLIGHT_ACCEPTANCE_DIR: &str = "execution-preflight";
const PREFLIGHT_ACCEPTANCE_FILE: &str = "acceptance-state.json";

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
pub struct GateDiagnostic {
    pub code: String,
    pub severity: String,
    pub message: String,
    pub remediation: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct GateResult {
    pub allowed: bool,
    pub failure_class: String,
    pub reason_codes: Vec<String>,
    pub warning_codes: Vec<String>,
    pub diagnostics: Vec<GateDiagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RecommendDecisionFlags {
    pub tasks_independent: String,
    pub isolated_agents_available: String,
    pub session_intent: String,
    pub workspace_prepared: String,
    pub same_session_viable: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RecommendOutput {
    pub recommended_skill: String,
    pub reason: String,
    pub decision_flags: RecommendDecisionFlags,
    pub chunking_strategy: ChunkingStrategy,
    pub evaluator_policy: EvaluatorPolicyName,
    pub reset_policy: ResetPolicy,
    pub review_stack: Vec<String>,
    pub policy_reason_codes: Vec<String>,
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

#[derive(Debug, Clone)]
pub struct CompleteRequest {
    pub task: u32,
    pub step: u32,
    pub source: String,
    pub claim: String,
    pub files: Vec<String>,
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
struct PreflightAcceptanceState {
    schema_version: u32,
    plan_path: String,
    plan_revision: u32,
    #[serde(default)]
    repo_state_baseline_head_sha: Option<String>,
    execution_run_id: ExecutionRunId,
    chunk_id: ChunkId,
    #[serde(default = "default_preflight_chunking_strategy")]
    chunking_strategy: ChunkingStrategy,
    #[serde(default = "default_preflight_evaluator_policy")]
    evaluator_policy: EvaluatorPolicyName,
    #[serde(default = "default_preflight_reset_policy")]
    reset_policy: ResetPolicy,
    #[serde(default = "default_preflight_review_stack")]
    review_stack: Vec<String>,
}

impl PreflightAcceptanceState {
    const SCHEMA_VERSION: u32 = 1;

    fn matches_plan_revision(&self, context: &ExecutionContext) -> bool {
        self.plan_path == context.plan_rel
            && self.plan_revision == context.plan_document.plan_revision
    }

    fn matches_context(&self, context: &ExecutionContext) -> bool {
        let (chunking_strategy, evaluator_policy, reset_policy, review_stack) =
            proposed_preflight_policy_tuple(context);
        let Some(saved_baseline_head_sha) = self
            .repo_state_baseline_head_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        else {
            return false;
        };
        let current_baseline_head_sha = match current_head_sha(&context.runtime.repo_root) {
            Ok(value) => value,
            Err(_) => return false,
        };
        self.plan_path == context.plan_rel
            && self.plan_revision == context.plan_document.plan_revision
            && saved_baseline_head_sha == current_baseline_head_sha
            && self.chunking_strategy == chunking_strategy
            && self.evaluator_policy == evaluator_policy
            && self.reset_policy == reset_policy
            && self.review_stack == review_stack
    }
}

fn proposed_preflight_policy_tuple(
    _context: &ExecutionContext,
) -> (
    ChunkingStrategy,
    EvaluatorPolicyName,
    ResetPolicy,
    Vec<String>,
) {
    (
        default_preflight_chunking_strategy(),
        default_preflight_evaluator_policy(),
        default_preflight_reset_policy(),
        default_preflight_review_stack(),
    )
}

fn default_preflight_chunking_strategy() -> ChunkingStrategy {
    ChunkingStrategy::Task
}

fn default_preflight_evaluator_policy() -> EvaluatorPolicyName {
    EvaluatorPolicyName(String::from("spec_compliance+code_quality"))
}

fn default_preflight_reset_policy() -> ResetPolicy {
    ResetPolicy::ChunkBoundary
}

fn default_preflight_review_stack() -> Vec<String> {
    vec![
        String::from("featureforge:requesting-code-review"),
        String::from("featureforge:qa-only"),
        String::from("featureforge:document-release"),
    ]
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

        let tasks_independent = if tasks_are_independent(&context.plan_document) {
            "yes"
        } else {
            "no"
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
        let same_session_viable = if session_intent == "stay" && workspace_prepared == "yes" {
            "yes"
        } else if session_intent == "separate" || workspace_prepared == "no" {
            "no"
        } else {
            "unknown"
        };

        let (recommended_skill, reason) = if tasks_independent == "yes"
            && isolated_agents_available == "yes"
            && same_session_viable == "yes"
        {
            (
                "featureforge:subagent-driven-development",
                "Independent tasks and same-session isolated execution are viable.",
            )
        } else {
            (
                "featureforge:executing-plans",
                "Defaulting conservatively because the available signals do not positively justify isolated same-session execution.",
            )
        };

        Ok(RecommendOutput {
            recommended_skill: recommended_skill.to_owned(),
            reason: reason.to_owned(),
            decision_flags: RecommendDecisionFlags {
                tasks_independent: tasks_independent.to_owned(),
                isolated_agents_available: isolated_agents_available.to_owned(),
                session_intent: session_intent.to_owned(),
                workspace_prepared: workspace_prepared.to_owned(),
                same_session_viable: same_session_viable.to_owned(),
            },
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
            persist_preflight_acceptance(&context)?;
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

    pub fn gate_finish(&self, args: &StatusArgs) -> Result<GateResult, JsonFailure> {
        let context = load_execution_context(self, &args.plan)?;
        Ok(gate_finish_from_context(&context))
    }
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
    let matching_manifest = matching_workflow_manifest(&runtime);
    validate_source_spec(
        &source_spec_source,
        &plan_document.source_spec_path,
        plan_document.source_spec_revision,
        &runtime,
        matching_manifest.as_ref(),
    )?;
    validate_unique_approved_plan(
        &plan_rel,
        &plan_document.source_spec_path,
        plan_document.source_spec_revision,
        &runtime,
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

    if evidence.format == EvidenceFormat::Legacy && !evidence.attempts.is_empty() {
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
    Ok(status)
}

#[derive(Debug, Deserialize)]
struct StatusAuthoritativeOverlay {
    #[serde(default)]
    harness_phase: Option<String>,
    #[serde(default)]
    chunk_id: Option<String>,
    #[serde(default)]
    latest_authoritative_sequence: Option<u64>,
    #[serde(default)]
    authoritative_sequence: Option<u64>,
    #[serde(default)]
    active_contract_path: Option<String>,
    #[serde(default)]
    active_contract_fingerprint: Option<String>,
    #[serde(default)]
    required_evaluator_kinds: Vec<String>,
    #[serde(default)]
    completed_evaluator_kinds: Vec<String>,
    #[serde(default)]
    pending_evaluator_kinds: Vec<String>,
    #[serde(default)]
    non_passing_evaluator_kinds: Vec<String>,
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
    current_chunk_retry_count: Option<u32>,
    #[serde(default)]
    current_chunk_retry_budget: Option<u32>,
    #[serde(default)]
    current_chunk_pivot_threshold: Option<u32>,
    #[serde(default)]
    handoff_required: Option<bool>,
    #[serde(default)]
    open_failed_criteria: Vec<String>,
    #[serde(default)]
    write_authority_state: Option<String>,
    #[serde(default)]
    write_authority_holder: Option<String>,
    #[serde(default)]
    write_authority_worktree: Option<String>,
    #[serde(default)]
    repo_state_baseline_head_sha: Option<String>,
    #[serde(default)]
    repo_state_baseline_worktree_fingerprint: Option<String>,
    #[serde(default)]
    repo_state_drift_state: Option<String>,
    #[serde(default)]
    dependency_index_state: Option<String>,
    #[serde(default)]
    final_review_state: Option<String>,
    #[serde(default)]
    browser_qa_state: Option<String>,
    #[serde(default)]
    release_docs_state: Option<String>,
    #[serde(default)]
    last_final_review_artifact_fingerprint: Option<String>,
    #[serde(default)]
    last_browser_qa_artifact_fingerprint: Option<String>,
    #[serde(default)]
    last_release_docs_artifact_fingerprint: Option<String>,
    #[serde(default)]
    reason_codes: Vec<String>,
}

fn apply_authoritative_status_overlay(
    context: &ExecutionContext,
    status: &mut PlanExecutionStatus,
) -> Result<(), JsonFailure> {
    let state_path = harness_state_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    if !state_path.is_file() {
        return Ok(());
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
    let overlay: StatusAuthoritativeOverlay = serde_json::from_str(&source).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state is malformed in {}: {error}",
                state_path.display()
            ),
        )
    })?;

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
    if let Some(value) = normalize_optional_overlay_value(overlay.write_authority_state.as_deref()) {
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
    if !overlay.reason_codes.is_empty() {
        status.reason_codes = parse_reason_codes(&overlay.reason_codes, "reason_codes", &state_path)?;
    }

    Ok(())
}

fn normalize_optional_overlay_value(value: Option<&str>) -> Option<&str> {
    value.map(str::trim).filter(|value| !value.is_empty())
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

fn pending_chunk_id(context: &ExecutionContext) -> ChunkId {
    let seed = format!(
        "pending-chunk\n{}\n{}\n",
        context.plan_rel, context.plan_document.plan_revision
    );
    let digest = sha256_hex(seed.as_bytes());
    ChunkId::new(format!("chunk-pending-{}", &digest[..12]))
}

pub fn require_preflight_acceptance(context: &ExecutionContext) -> Result<(), JsonFailure> {
    if preflight_acceptance_for_plan_revision(context)?.is_none() {
        return Err(JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            "begin requires a successful execution_preflight acceptance for this approved plan revision.",
        ));
    }
    Ok(())
}

fn preflight_acceptance_for_context(
    context: &ExecutionContext,
) -> Result<Option<PreflightAcceptanceState>, JsonFailure> {
    Ok(load_preflight_acceptance(&context.runtime)?
        .filter(|acceptance| acceptance.matches_context(context)))
}

fn preflight_acceptance_for_plan_revision(
    context: &ExecutionContext,
) -> Result<Option<PreflightAcceptanceState>, JsonFailure> {
    Ok(load_preflight_acceptance(&context.runtime)?
        .filter(|acceptance| acceptance.matches_plan_revision(context)))
}

fn load_preflight_acceptance(
    runtime: &ExecutionRuntime,
) -> Result<Option<PreflightAcceptanceState>, JsonFailure> {
    let path = preflight_acceptance_path(runtime);
    if !path.is_file() {
        return Ok(None);
    }
    let source = fs::read_to_string(&path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Could not read persisted execution preflight acceptance {}: {error}",
                path.display()
            ),
        )
    })?;
    let acceptance: PreflightAcceptanceState = serde_json::from_str(&source).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Persisted execution preflight acceptance is malformed in {}: {error}",
                path.display()
            ),
        )
    })?;
    if acceptance.schema_version != PreflightAcceptanceState::SCHEMA_VERSION {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Persisted execution preflight acceptance schema version is unsupported in {}.",
                path.display()
            ),
        ));
    }
    if acceptance.execution_run_id.as_str().trim().is_empty()
        || acceptance.chunk_id.as_str().trim().is_empty()
    {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Persisted execution preflight acceptance must include non-empty run and chunk identities in {}.",
                path.display()
            ),
        ));
    }
    Ok(Some(acceptance))
}

fn persist_preflight_acceptance(
    context: &ExecutionContext,
) -> Result<PreflightAcceptanceState, JsonFailure> {
    if let Some(existing) = preflight_acceptance_for_context(context)? {
        return Ok(existing);
    }

    let acceptance = new_preflight_acceptance(context)?;
    let payload = serde_json::to_string_pretty(&acceptance).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!("Could not serialize execution preflight acceptance: {error}"),
        )
    })?;
    let path = preflight_acceptance_path(&context.runtime);
    write_atomic_file(&path, payload).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not persist execution preflight acceptance {}: {error}",
                path.display()
            ),
        )
    })?;
    Ok(acceptance)
}

fn new_preflight_acceptance(context: &ExecutionContext) -> Result<PreflightAcceptanceState, JsonFailure> {
    let baseline_head_sha = current_head_sha(&context.runtime.repo_root)?;
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let seed = format!(
        "execution-preflight-acceptance\n{}\n{}\n{}\n{}\n{}\n{}\n",
        context.runtime.repo_slug,
        context.runtime.branch_name,
        context.plan_rel,
        context.plan_document.plan_revision,
        std::process::id(),
        nonce,
    );
    let digest = sha256_hex(seed.as_bytes());
    Ok(PreflightAcceptanceState {
        schema_version: PreflightAcceptanceState::SCHEMA_VERSION,
        plan_path: context.plan_rel.clone(),
        plan_revision: context.plan_document.plan_revision,
        repo_state_baseline_head_sha: Some(baseline_head_sha),
        execution_run_id: ExecutionRunId::new(format!("run-{}", &digest[..16])),
        chunk_id: ChunkId::new(format!("chunk-{}", &digest[16..32])),
        chunking_strategy: default_preflight_chunking_strategy(),
        evaluator_policy: default_preflight_evaluator_policy(),
        reset_policy: default_preflight_reset_policy(),
        review_stack: default_preflight_review_stack(),
    })
}

fn preflight_acceptance_path(runtime: &ExecutionRuntime) -> PathBuf {
    runtime
        .state_dir
        .join("projects")
        .join(&runtime.repo_slug)
        .join("branches")
        .join(&runtime.safe_branch)
        .join(PREFLIGHT_ACCEPTANCE_DIR)
        .join(PREFLIGHT_ACCEPTANCE_FILE)
}

#[derive(Debug, Deserialize)]
struct PreflightAuthoritativeState {
    #[serde(default)]
    harness_phase: Option<String>,
    #[serde(default)]
    handoff_required: bool,
    #[serde(default)]
    latest_authoritative_sequence: Option<u64>,
    #[serde(default)]
    authoritative_sequence: Option<u64>,
}

fn load_preflight_authoritative_state(
    context: &ExecutionContext,
) -> Result<Option<PreflightAuthoritativeState>, JsonFailure> {
    let state_path = harness_state_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    let source = match fs::read_to_string(&state_path) {
        Ok(source) => source,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(error) => {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not read authoritative harness state {}: {error}",
                    state_path.display()
                ),
            ));
        }
    };
    let overlay = serde_json::from_str(&source).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state is malformed in {}: {error}",
                state_path.display()
            ),
        )
    })?;

    Ok(Some(overlay))
}

fn preflight_requires_authoritative_handoff(context: &ExecutionContext) -> Result<bool, JsonFailure> {
    let Some(overlay) = load_preflight_authoritative_state(context)? else {
        return Ok(false);
    };
    let phase_requires_handoff = overlay
        .harness_phase
        .as_deref()
        .map(str::trim)
        .is_some_and(|phase| phase == "handoff_required");
    Ok(overlay.handoff_required || phase_requires_handoff)
}

fn parse_authoritative_sequence_from_artifact(source: &str) -> Option<u64> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Authoritative Sequence:**")
            .and_then(|value| value.trim().parse::<u64>().ok())
    })
}

fn latest_authoritative_artifact_sequence(context: &ExecutionContext) -> Result<Option<u64>, JsonFailure> {
    let artifacts_dir = harness_authoritative_artifacts_dir(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    let entries = match fs::read_dir(&artifacts_dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(error) => {
            return Err(JsonFailure::new(
                FailureClass::ExecutionStateNotReady,
                format!(
                    "Could not read authoritative artifact directory {}: {error}",
                    artifacts_dir.display()
                ),
            ));
        }
    };

    let mut max_sequence: Option<u64> = None;
    for entry in entries {
        let entry = entry.map_err(|error| {
            JsonFailure::new(
                FailureClass::ExecutionStateNotReady,
                format!(
                    "Could not enumerate authoritative artifacts in {}: {error}",
                    artifacts_dir.display()
                ),
            )
        })?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let source = fs::read_to_string(&path).map_err(|error| {
            JsonFailure::new(
                FailureClass::ExecutionStateNotReady,
                format!("Could not read authoritative artifact {}: {error}", path.display()),
            )
        })?;
        if let Some(sequence) = parse_authoritative_sequence_from_artifact(&source) {
            max_sequence = Some(max_sequence.map_or(sequence, |current| current.max(sequence)));
        }
    }
    Ok(max_sequence)
}

fn preflight_requires_authoritative_mutation_recovery(
    context: &ExecutionContext,
) -> Result<bool, JsonFailure> {
    let Some(overlay) = load_preflight_authoritative_state(context)? else {
        return Ok(false);
    };
    let persisted_sequence = overlay
        .latest_authoritative_sequence
        .or(overlay.authoritative_sequence)
        .unwrap_or(INITIAL_AUTHORITATIVE_SEQUENCE);
    let Some(artifact_sequence) = latest_authoritative_artifact_sequence(context)? else {
        return Ok(false);
    };
    Ok(artifact_sequence > persisted_sequence)
}

enum PreflightWriteAuthorityState {
    Clear,
    Conflict,
}

fn preflight_write_authority_state(
    context: &ExecutionContext,
) -> Result<PreflightWriteAuthorityState, JsonFailure> {
    let lock_path =
        harness_branch_root(
            &context.runtime.state_dir,
            &context.runtime.repo_slug,
            &context.runtime.branch_name,
        )
        .join("write-authority.lock");
    if !lock_path.exists() {
        return Ok(PreflightWriteAuthorityState::Clear);
    }

    let source = fs::read_to_string(&lock_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            format!(
                "Could not read write-authority lock {}: {error}",
                lock_path.display()
            ),
        )
    })?;

    let holder_pid = source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("pid=")
            .and_then(|value| value.trim().parse::<u32>().ok())
    });
    let Some(holder_pid) = holder_pid else {
        return Ok(PreflightWriteAuthorityState::Conflict);
    };

    if process_is_running(holder_pid) {
        return Ok(PreflightWriteAuthorityState::Conflict);
    }

    match fs::remove_file(&lock_path) {
        Ok(()) => Ok(PreflightWriteAuthorityState::Clear),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(PreflightWriteAuthorityState::Clear),
        Err(error) => Err(JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            format!(
                "Could not reclaim stale write-authority lock {}: {error}",
                lock_path.display()
            ),
        )),
    }
}

fn process_is_running(pid: u32) -> bool {
    if pid == 0 {
        return false;
    }
    #[cfg(unix)]
    {
        std::process::Command::new("kill")
            .arg("-0")
            .arg(pid.to_string())
            .status()
            .map(|status| status.success())
            .unwrap_or(true)
    }
    #[cfg(not(unix))]
    {
        true
    }
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

    if context.evidence.format == EvidenceFormat::Legacy && !context.evidence.attempts.is_empty() {
        gate.warn("legacy_evidence_format");
    }
    if context.evidence.format == EvidenceFormat::V2 {
        validate_v2_evidence_provenance(context, &mut gate);
    }

    gate.finish()
}

pub fn gate_finish_from_context(context: &ExecutionContext) -> GateResult {
    let mut gate = GateState::from_result(gate_review_from_context_internal(context, false));
    if !gate.allowed {
        return gate.finish();
    }

    let branch = &context.runtime.branch_name;
    let current_head = current_head_sha(&context.runtime.repo_root).unwrap_or_default();
    match repo_has_tracked_worktree_changes(&context.runtime.repo_root) {
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

    let authoritative_review_path = authoritative_final_review_artifact_path(context);
    let review_uses_authoritative_provenance = authoritative_review_path.is_some();
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
    if !review_uses_authoritative_provenance {
        if review.headers.get("Source Plan") != Some(&format!("`{}`", context.plan_rel))
            || review.headers.get("Source Plan Revision")
                != Some(&context.plan_document.plan_revision.to_string())
        {
            gate.fail(
                FailureClass::ReviewArtifactNotFresh,
                "review_artifact_plan_mismatch",
                "The latest code-review artifact does not match the current approved plan revision.",
                "Run requesting-code-review and return with a fresh code-review artifact.",
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
        if review.headers.get("Head SHA") != Some(&current_head) {
            gate.fail(
                FailureClass::ReviewArtifactNotFresh,
                "review_artifact_head_mismatch",
                "The latest code-review artifact does not match the current HEAD.",
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
    }
    if review.headers.get("Result") != Some(&String::from("pass")) {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_result_not_pass",
            "The latest code-review artifact is not marked pass.",
            "Run requesting-code-review and return with a fresh code-review artifact.",
        );
        return gate.finish();
    }
    if review.headers.get("Generated By")
        != Some(&String::from("featureforge:requesting-code-review"))
    {
        gate.fail(
            FailureClass::ReviewArtifactNotFresh,
            "review_artifact_generator_mismatch",
            "The latest code-review artifact was not generated by requesting-code-review.",
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

    let authoritative_qa_path = authoritative_browser_qa_artifact_path(context);
    let authoritative_test_plan_path = authoritative_qa_path
        .as_deref()
        .and_then(authoritative_test_plan_artifact_path_from_qa);
    let test_plan_uses_authoritative_provenance = authoritative_test_plan_path.is_some();
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
    if !test_plan_uses_authoritative_provenance {
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
        let qa_uses_authoritative_provenance = authoritative_qa_path.is_some();
        let qa_path =
            authoritative_qa_path.or_else(|| latest_branch_artifact_path(&artifact_dir, branch, "test-outcome"));
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
        if !qa_uses_authoritative_provenance {
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
        }
        if qa
            .headers
            .get("Source Test Plan")
            .map(|value| strip_backticks(value))
            .as_deref()
            != Some(test_plan_path.to_string_lossy().as_ref())
        {
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

    let authoritative_release_path = authoritative_release_docs_artifact_path(context);
    let release_uses_authoritative_provenance = authoritative_release_path.is_some();
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
    if !release_uses_authoritative_provenance {
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
        format!(
            "Authoritative {field_label} truth {message_suffix} for review readiness."
        ),
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
        let expected_packet = compute_packet_fingerprint(
            &context.plan_rel,
            context.plan_document.plan_revision,
            &contract_plan_fingerprint,
            &context.plan_document.source_spec_path,
            context.plan_document.source_spec_revision,
            &source_spec_fingerprint,
            step.task_number,
            step.step_number,
        );
        if attempt.packet_fingerprint.as_deref() != Some(expected_packet.as_str()) {
            let legacy_packet = compute_packet_fingerprint(
                &context.plan_rel,
                context.plan_document.plan_revision,
                &legacy_plan_fingerprint,
                &context.plan_document.source_spec_path,
                context.plan_document.source_spec_revision,
                &source_spec_fingerprint,
                step.task_number,
                step.step_number,
            );
            if attempt.packet_fingerprint.as_deref() == Some(legacy_packet.as_str()) {
                gate.warn("legacy_packet_provenance");
            } else {
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

pub fn compute_packet_fingerprint(
    plan_path: &str,
    plan_revision: u32,
    plan_fingerprint: &str,
    source_spec_path: &str,
    source_spec_revision: u32,
    source_spec_fingerprint: &str,
    task: u32,
    step: u32,
) -> String {
    let payload = format!(
        "plan_path={plan_path}\nplan_revision={plan_revision}\nplan_fingerprint={plan_fingerprint}\nsource_spec_path={source_spec_path}\nsource_spec_revision={source_spec_revision}\nsource_spec_fingerprint={source_spec_fingerprint}\ntask_number={task}\nstep_number={step}\n"
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

impl GateState {
    pub fn default() -> Self {
        Self {
            allowed: true,
            failure_class: String::new(),
            reason_codes: Vec::new(),
            warning_codes: Vec::new(),
            diagnostics: Vec::new(),
        }
    }

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

#[derive(Debug, Default)]
struct ArtifactDocument {
    title: Option<String>,
    headers: BTreeMap<String, String>,
}

fn parse_artifact_document(path: &Path) -> ArtifactDocument {
    let Ok(source) = fs::read_to_string(path) else {
        return ArtifactDocument::default();
    };
    ArtifactDocument {
        title: source
            .lines()
            .map(str::trim)
            .find(|line| !line.is_empty())
            .map(str::to_owned),
        headers: parse_headers(&source),
    }
}

fn resolve_release_base_branch(git_dir: &Path, current_branch: &str) -> Option<String> {
    const COMMON_BASE_BRANCHES: &[&str] = &["main", "master", "develop", "dev", "trunk"];

    if COMMON_BASE_BRANCHES.contains(&current_branch) {
        return Some(current_branch.to_owned());
    }

    if let Some(branch) = branch_merge_base_from_config(git_dir, current_branch) {
        return Some(branch);
    }
    if let Some(branch) = origin_head_branch(git_dir) {
        return Some(branch);
    }

    let branches = local_head_branches(&git_dir.join("refs/heads"));
    for candidate in COMMON_BASE_BRANCHES {
        if branches.iter().any(|branch| branch == candidate) {
            return Some((*candidate).to_owned());
        }
    }

    let mut non_current = branches
        .into_iter()
        .filter(|branch| branch != current_branch)
        .collect::<Vec<_>>();
    non_current.sort();
    non_current.dedup();
    if non_current.len() == 1 {
        return non_current.pop();
    }
    None
}

fn branch_merge_base_from_config(git_dir: &Path, current_branch: &str) -> Option<String> {
    let source = fs::read_to_string(git_dir.join("config")).ok()?;
    let target_section = format!(r#"[branch "{current_branch}"]"#);
    let mut in_target_section = false;

    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            in_target_section = trimmed == target_section;
            continue;
        }
        if !in_target_section
            || trimmed.is_empty()
            || trimmed.starts_with('#')
            || trimmed.starts_with(';')
        {
            continue;
        }
        let (key, value) = trimmed.split_once('=')?;
        if key.trim() == "gh-merge-base" {
            let normalized = value.trim();
            if !normalized.is_empty() {
                return Some(normalized.to_owned());
            }
        }
    }

    None
}

fn origin_head_branch(git_dir: &Path) -> Option<String> {
    let source = fs::read_to_string(git_dir.join("refs/remotes/origin/HEAD")).ok()?;
    let reference = source.trim().strip_prefix("ref: ")?;
    let branch = reference.strip_prefix("refs/remotes/origin/")?.trim();
    if branch.is_empty() {
        None
    } else {
        Some(branch.to_owned())
    }
}

fn local_head_branches(heads_dir: &Path) -> Vec<String> {
    let Ok(entries) = fs::read_dir(heads_dir) else {
        return Vec::new();
    };
    let mut branches = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            branches.extend(local_head_branches(&path).into_iter().filter_map(|branch| {
                path.file_name()
                    .and_then(std::ffi::OsStr::to_str)
                    .map(|prefix| format!("{prefix}/{branch}"))
            }));
            continue;
        }
        if let Some(name) = path.file_name().and_then(std::ffi::OsStr::to_str) {
            branches.push(name.to_owned());
        }
    }
    branches
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
            if cursor < lines.len() {
                if let Some((parsed_state, parsed_summary)) = parse_note_line(lines[cursor]) {
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
                } else if let Some(value) = line.strip_prefix("**Verification Summary:** ") {
                    verification_summary = normalize_whitespace(value);
                } else if line == "**Verification:**" {
                    line_index += 1;
                    if line_index < lines.len() {
                        if let Some(value) = lines[line_index].strip_prefix("- ") {
                            verification_summary = normalize_whitespace(value);
                        }
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

fn tasks_are_independent(plan_document: &PlanDocument) -> bool {
    if plan_document.tasks.len() <= 1 {
        return false;
    }
    let mut paths = BTreeSet::new();
    for task in &plan_document.tasks {
        for entry in &task.files {
            if !paths.insert(entry.path.clone()) {
                return false;
            }
        }
    }
    true
}

fn latest_completed_attempt<'a>(evidence: &'a ExecutionEvidence) -> Option<&'a EvidenceAttempt> {
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

fn latest_attempt_for_step<'a>(
    evidence: &'a ExecutionEvidence,
    task_number: u32,
    step_number: u32,
) -> Option<&'a EvidenceAttempt> {
    evidence
        .attempts
        .iter()
        .rev()
        .find(|attempt| attempt.task_number == task_number && attempt.step_number == step_number)
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

fn latest_branch_artifact_path(
    artifact_dir: &Path,
    branch_name: &str,
    kind: &str,
) -> Option<PathBuf> {
    let entries = fs::read_dir(artifact_dir).ok()?;
    let mut candidates = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().and_then(std::ffi::OsStr::to_str) == Some("md"))
        .filter(|path| {
            path.file_name()
                .and_then(std::ffi::OsStr::to_str)
                .is_some_and(|name| {
                    name.strip_suffix(".md")
                        .and_then(|stem| stem.rsplit_once(&format!("-{kind}-")))
                        .is_some_and(|(_, timestamp)| !timestamp.is_empty())
                })
        })
        .filter(|path| {
            parse_headers_file(path)
                .get("Branch")
                .is_some_and(|value| value == branch_name)
        })
        .collect::<Vec<_>>();
    candidates.sort();
    candidates.pop()
}

fn load_status_authoritative_overlay(context: &ExecutionContext) -> Option<StatusAuthoritativeOverlay> {
    let state_path = harness_state_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    let source = fs::read_to_string(&state_path).ok()?;
    serde_json::from_str(&source).ok()
}

fn load_status_authoritative_overlay_checked(
    context: &ExecutionContext,
) -> Result<Option<StatusAuthoritativeOverlay>, JsonFailure> {
    let state_path = harness_state_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    if !state_path.is_file() {
        return Ok(None);
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
    let overlay: StatusAuthoritativeOverlay = serde_json::from_str(&source).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state is malformed in {}: {error}",
                state_path.display()
            ),
        )
    })?;
    Ok(Some(overlay))
}

fn authoritative_fingerprinted_artifact_path(
    context: &ExecutionContext,
    freshness_state: Option<&str>,
    fingerprint: Option<&str>,
    artifact_prefix: &str,
) -> Option<PathBuf> {
    let freshness_state = normalize_optional_overlay_value(freshness_state)?;
    if freshness_state != "fresh" {
        return None;
    }

    let fingerprint = fingerprint.map(str::trim).filter(|value| !value.is_empty())?;
    if fingerprint.len() != 64 || !fingerprint.chars().all(|value| value.is_ascii_hexdigit()) {
        return None;
    }

    let path = harness_authoritative_artifacts_dir(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    )
    .join(format!("{artifact_prefix}-{fingerprint}.md"));
    path.is_file().then_some(path)
}

fn authoritative_final_review_artifact_path(context: &ExecutionContext) -> Option<PathBuf> {
    let overlay = load_status_authoritative_overlay(context)?;
    authoritative_fingerprinted_artifact_path(
        context,
        overlay.final_review_state.as_deref(),
        overlay.last_final_review_artifact_fingerprint.as_deref(),
        "final-review",
    )
}

fn authoritative_browser_qa_artifact_path(context: &ExecutionContext) -> Option<PathBuf> {
    let overlay = load_status_authoritative_overlay(context)?;
    authoritative_fingerprinted_artifact_path(
        context,
        overlay.browser_qa_state.as_deref(),
        overlay.last_browser_qa_artifact_fingerprint.as_deref(),
        "browser-qa",
    )
}

fn authoritative_release_docs_artifact_path(context: &ExecutionContext) -> Option<PathBuf> {
    let overlay = load_status_authoritative_overlay(context)?;
    authoritative_fingerprinted_artifact_path(
        context,
        overlay.release_docs_state.as_deref(),
        overlay.last_release_docs_artifact_fingerprint.as_deref(),
        "release-docs",
    )
}

fn authoritative_test_plan_artifact_path_from_qa(qa_artifact_path: &Path) -> Option<PathBuf> {
    let qa = parse_artifact_document(qa_artifact_path);
    let source_test_plan = qa
        .headers
        .get("Source Test Plan")
        .map(|value| strip_backticks(value))?;
    let source_test_plan = source_test_plan.trim();
    if source_test_plan.is_empty() {
        return None;
    }

    let source_test_plan_path = PathBuf::from(source_test_plan);
    let resolved_path = if source_test_plan_path.is_absolute() {
        source_test_plan_path
    } else {
        qa_artifact_path
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .join(source_test_plan_path)
    };
    resolved_path.is_file().then_some(resolved_path)
}

fn strip_backticks(value: &str) -> String {
    value.trim_matches('`').to_owned()
}
