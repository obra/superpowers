use std::collections::{BTreeMap, BTreeSet};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use schemars::{JsonSchema, schema_for};
use serde::Serialize;

use crate::cli::plan_execution::{
    BeginArgs, CompleteArgs, IsolatedAgentsArg, NoteArgs, NoteStateArg, RecommendArgs, ReopenArgs,
    StatusArgs, TransferArgs,
};
use crate::cli::repo_safety::{RepoSafetyCheckArgs, RepoSafetyIntentArg, RepoSafetyWriteTargetArg};
use crate::contracts::plan::{PlanDocument, PlanTask, parse_plan_file};
use crate::diagnostics::{FailureClass, JsonFailure};
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
        Ok(status_from_context(&context))
    }

    pub fn recommend(&self, args: &RecommendArgs) -> Result<RecommendOutput, JsonFailure> {
        let context = load_execution_context(self, &args.plan)?;
        if execution_started(&context) {
            return Err(JsonFailure::new(
                FailureClass::RecommendAfterExecutionStart,
                "recommend is only valid before execution has started for this plan revision.",
            ));
        }

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
        })
    }

    pub fn preflight(&self, args: &StatusArgs) -> Result<GateResult, JsonFailure> {
        let context = load_execution_context(self, &args.plan)?;
        Ok(preflight_from_context(&context))
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

pub fn status_from_context(context: &ExecutionContext) -> PlanExecutionStatus {
    let latest_completed = latest_completed_attempt(&context.evidence);
    let warning_codes = if context.evidence.format == EvidenceFormat::Legacy
        && !context.evidence.attempts.is_empty()
    {
        vec![String::from("legacy_evidence_format")]
    } else {
        Vec::new()
    };

    PlanExecutionStatus {
        plan_revision: context.plan_document.plan_revision,
        execution_mode: context.plan_document.execution_mode.clone(),
        execution_fingerprint: context.execution_fingerprint.clone(),
        evidence_path: context.evidence_rel.clone(),
        execution_started: if execution_started(context) {
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
    }
}

pub fn preflight_from_context(context: &ExecutionContext) -> GateResult {
    let mut gate = GateState::default();

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

    if context.evidence.format == EvidenceFormat::Legacy && !context.evidence.attempts.is_empty() {
        gate.warn("legacy_evidence_format");
    }
    if context.evidence.format == EvidenceFormat::V2 {
        validate_v2_evidence_provenance(context, &mut gate);
    }

    gate.finish()
}

pub fn gate_finish_from_context(context: &ExecutionContext) -> GateResult {
    let mut gate = GateState::from_result(gate_review_from_context(context));
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

    let Some(review_path) = latest_branch_artifact_path(&artifact_dir, branch, "code-review")
    else {
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

    let Some(test_plan_path) = latest_branch_artifact_path(&artifact_dir, branch, "test-plan")
    else {
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
        let Some(qa_path) = latest_branch_artifact_path(&artifact_dir, branch, "test-outcome")
        else {
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

    let Some(release_path) =
        latest_branch_artifact_path(&artifact_dir, branch, "release-readiness")
    else {
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

fn strip_backticks(value: &str) -> String {
    value.trim_matches('`').to_owned()
}
