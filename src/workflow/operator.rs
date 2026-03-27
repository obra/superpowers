use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use schemars::JsonSchema;
use serde::Serialize;

use crate::cli::plan_execution::{RecommendArgs, StatusArgs as ExecutionStatusArgs};
use crate::cli::workflow::PlanArgs;
use crate::contracts::plan::AnalyzePlanReport;
use crate::diagnostics::{DiagnosticError, FailureClass, JsonFailure};
use crate::execution::harness::{EvaluatorKind, HarnessPhase, INITIAL_AUTHORITATIVE_SEQUENCE};
use crate::execution::state::{ExecutionRuntime, GateResult, PlanExecutionStatus, RecommendOutput};
use crate::session_entry::{self, SessionEntryResolveOutput};
use crate::workflow::status::{SessionEntryState, WorkflowPhase, WorkflowRoute, WorkflowRuntime};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct WorkflowDoctor {
    pub phase: String,
    pub route_status: String,
    pub next_skill: String,
    pub next_action: String,
    pub spec_path: String,
    pub plan_path: String,
    pub contract_state: String,
    pub session_entry: SessionEntryResolveOutput,
    pub route: WorkflowRoute,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_status: Option<PlanExecutionStatus>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plan_contract: Option<AnalyzePlanReport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preflight: Option<GateResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gate_review: Option<GateResult>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gate_finish: Option<GateResult>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct WorkflowHandoff {
    pub phase: String,
    pub route_status: String,
    pub next_skill: String,
    pub contract_state: String,
    pub spec_path: String,
    pub plan_path: String,
    pub execution_started: String,
    pub next_action: String,
    pub recommended_skill: String,
    pub recommendation_reason: String,
    pub session_entry: SessionEntryResolveOutput,
    pub route: WorkflowRoute,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_status: Option<PlanExecutionStatus>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub plan_contract: Option<AnalyzePlanReport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recommendation: Option<RecommendOutput>,
}

struct OperatorContext {
    route: WorkflowRoute,
    session_entry: SessionEntryResolveOutput,
    execution_status: Option<PlanExecutionStatus>,
    plan_contract: Option<AnalyzePlanReport>,
    preflight: Option<GateResult>,
    gate_review: Option<GateResult>,
    gate_finish: Option<GateResult>,
    execution_preflight_block_reason: Option<String>,
    phase: String,
}

#[derive(Clone, Copy)]
struct BuildContextOptions {
    allow_legacy_pre_harness_cutover_handoff_block: bool,
}

impl BuildContextOptions {
    const fn strict() -> Self {
        Self {
            allow_legacy_pre_harness_cutover_handoff_block: false,
        }
    }

    const fn allow_legacy_pre_harness_cutover_handoff_block() -> Self {
        Self {
            allow_legacy_pre_harness_cutover_handoff_block: true,
        }
    }
}

const LEGACY_PRE_HARNESS_CUTOVER_MESSAGE: &str =
    "Legacy pre-harness execution evidence is no longer accepted; regenerate execution evidence using the harness v2 format.";

pub fn render_next(current_dir: &Path) -> Result<String, JsonFailure> {
    let context = build_context(current_dir)?;
    let mut output = String::new();
    output.push_str("Next action: ");
    output.push_str(next_action_for_context(&context));
    output.push('\n');
    output.push_str("Next safe step: ");
    output.push_str(&next_step_text(&context));
    output.push('\n');
    output.push_str("Reason: ");
    output.push_str(&reason_text(&context));
    output.push('\n');
    Ok(output)
}

pub fn render_artifacts(current_dir: &Path) -> Result<String, JsonFailure> {
    let context = build_context(current_dir)?;
    Ok(format!(
        "Workflow artifacts\n- Spec: {}\n- Plan: {}\n",
        display_or_none(&context.route.spec_path),
        display_or_none(&context.route.plan_path)
    ))
}

pub fn render_explain(current_dir: &Path) -> Result<String, JsonFailure> {
    let context = build_context(current_dir)?;
    Ok(format!(
        "Why FeatureForge chose this state\n- State: {}\n- Spec: {}\n- Plan: {}\nWhat to do:\n1. {}\n",
        context.route.status,
        display_or_none(&context.route.spec_path),
        display_or_none(&context.route.plan_path),
        next_step_text(&context)
    ))
}

pub fn phase(current_dir: &Path) -> Result<WorkflowPhase, JsonFailure> {
    let context = build_context(current_dir)?;
    Ok(WorkflowPhase {
        phase: context.phase.clone(),
        route_status: context.route.status.clone(),
        next_skill: public_next_skill(&context),
        next_action: next_action_for_context(&context).to_owned(),
        spec_path: context.route.spec_path.clone(),
        plan_path: context.route.plan_path.clone(),
        session_entry: session_entry_state(&context.session_entry),
        route: context.route,
    })
}

pub fn render_phase(current_dir: &Path) -> Result<String, JsonFailure> {
    let context = build_context(current_dir)?;
    Ok(format!(
        "Workflow phase: {}\nRoute status: {}\nNext action: {}\nNext: {}\nSpec: {}\nPlan: {}\n",
        context.phase,
        context.route.status,
        next_action_for_context(&context),
        next_step_text(&context),
        display_or_none(&context.route.spec_path),
        display_or_none(&context.route.plan_path)
    ))
}

pub fn doctor(current_dir: &Path) -> Result<WorkflowDoctor, JsonFailure> {
    let context = build_context(current_dir)?;
    let doctor_phase = doctor_phase_for_context(&context);
    let contract_state = context
        .plan_contract
        .as_ref()
        .map(|report| report.contract_state.clone())
        .unwrap_or_else(|| context.route.contract_state.clone());

    Ok(WorkflowDoctor {
        phase: doctor_phase,
        route_status: context.route.status.clone(),
        next_skill: public_next_skill(&context),
        next_action: next_action_for_context(&context).to_owned(),
        spec_path: context.route.spec_path.clone(),
        plan_path: context.route.plan_path.clone(),
        contract_state,
        session_entry: context.session_entry,
        route: context.route,
        execution_status: context.execution_status,
        plan_contract: context.plan_contract,
        preflight: context.preflight,
        gate_review: context.gate_review,
        gate_finish: context.gate_finish,
    })
}

pub fn render_doctor(current_dir: &Path) -> Result<String, JsonFailure> {
    let doctor = doctor(current_dir)?;
    let mut output = format!(
        "Workflow doctor\nPhase: {}\nSession entry: {}\nRoute status: {}\nNext action: {}\nContract state: {}\nSpec: {}\nPlan: {}\n",
        doctor.phase,
        doctor.session_entry.outcome,
        doctor.route_status,
        doctor.next_action,
        doctor.contract_state,
        display_or_none(&doctor.spec_path),
        display_or_none(&doctor.plan_path)
    );
    if let Some(execution_status) = doctor.execution_status.as_ref() {
        append_execution_status_metadata(&mut output, execution_status);
    }
    if let Some(preflight) = doctor.preflight.as_ref() {
        output.push_str(&format!(
            "Preflight reason codes: {}\n",
            reason_codes_text(&preflight.reason_codes)
        ));
    }
    if let Some(gate_review) = doctor.gate_review.as_ref() {
        output.push_str(&format!(
            "Review gate reason codes: {}\n",
            reason_codes_text(&gate_review.reason_codes)
        ));
    }
    if let Some(gate_finish) = doctor.gate_finish.as_ref() {
        output.push_str(&format!(
            "Finish gate reason codes: {}\n",
            reason_codes_text(&gate_finish.reason_codes)
        ));
    }
    Ok(output)
}

pub fn handoff(current_dir: &Path) -> Result<WorkflowHandoff, JsonFailure> {
    let context = build_context_with_options(
        current_dir,
        BuildContextOptions::allow_legacy_pre_harness_cutover_handoff_block(),
    )?;
    let contract_state = context
        .plan_contract
        .as_ref()
        .map(|report| report.contract_state.clone())
        .unwrap_or_else(|| context.route.contract_state.clone());

    let execution_started = context
        .execution_status
        .as_ref()
        .map(|status| status.execution_started.clone())
        .unwrap_or_else(|| String::from("no"));
    let recommendation = if context.route.status == "implementation_ready"
        && context.session_entry.outcome == "enabled"
        && context.phase == "execution_preflight"
        && execution_started != "yes"
        && !context.route.plan_path.is_empty()
    {
        let runtime = ExecutionRuntime::discover(current_dir)?;
        Some(runtime.recommend(&RecommendArgs {
            plan: PathBuf::from(&context.route.plan_path),
            isolated_agents: None,
            session_intent: None,
            workspace_prepared: None,
        })?)
    } else {
        None
    };

    let (recommended_skill, recommendation_reason) = if let Some(recommendation) =
        recommendation.as_ref()
    {
        (
            recommendation.recommended_skill.clone(),
            recommendation.reason.clone(),
        )
    } else {
        match context.phase.as_str() {
            "bypassed" => (
                String::new(),
                String::from(
                    "FeatureForge is bypassed for this session until the user explicitly re-enters.",
                ),
            ),
            "executing" => {
                let skill = context
                    .execution_status
                    .as_ref()
                    .map(|status| status.execution_mode.clone())
                    .unwrap_or_default();
                (
                    skill,
                    String::from(
                        "Execution already started for the approved plan revision; continue with the current execution flow.",
                    ),
                )
            }
            "implementation_handoff" => (String::new(), reason_text(&context)),
            "final_review_pending" if review_requires_execution_reentry(&context) => {
                let skill = context
                    .execution_status
                    .as_ref()
                    .map(|status| status.execution_mode.clone())
                    .unwrap_or_default();
                (skill, reason_text(&context))
            }
            "final_review_pending" => (
                String::from("featureforge:requesting-code-review"),
                reason_text(&context),
            ),
            "qa_pending" if finish_requires_test_plan_refresh(&context) => (
                String::from("featureforge:plan-eng-review"),
                reason_text(&context),
            ),
            "qa_pending" => (String::from("featureforge:qa-only"), reason_text(&context)),
            "document_release_pending" => (
                String::from("featureforge:document-release"),
                reason_text(&context),
            ),
            "ready_for_branch_completion" => (
                String::from("featureforge:finishing-a-development-branch"),
                reason_text(&context),
            ),
            "pivot_required" => {
                (
                    String::from("featureforge:writing-plans"),
                    reason_text(&context),
                )
            }
            _ if execution_started == "yes" => {
                let skill = context
                    .execution_status
                    .as_ref()
                    .map(|status| status.execution_mode.clone())
                    .unwrap_or_default();
                (
                    skill,
                    String::from(
                        "Execution already started for the approved plan revision; continue with the current execution flow.",
                    ),
                )
            }
            _ => (String::new(), String::new()),
        }
    };

    Ok(WorkflowHandoff {
        phase: context.phase.clone(),
        route_status: context.route.status.clone(),
        next_skill: public_next_skill(&context),
        contract_state,
        spec_path: context.route.spec_path.clone(),
        plan_path: context.route.plan_path.clone(),
        execution_started,
        next_action: next_action_for_context(&context).to_owned(),
        recommended_skill,
        recommendation_reason,
        session_entry: context.session_entry,
        route: context.route,
        execution_status: context.execution_status,
        plan_contract: context.plan_contract,
        recommendation,
    })
}

pub fn render_handoff(current_dir: &Path) -> Result<String, JsonFailure> {
    let handoff = handoff(current_dir)?;
    let mut output = String::new();
    output.push_str("Workflow handoff\n");
    output.push_str(&format!("Phase: {}\n", handoff.phase));
    output.push_str(&format!("Route status: {}\n", handoff.route_status));
    output.push_str(&format!("Next action: {}\n", handoff.next_action));
    output.push_str(&format!("Spec: {}\n", display_or_none(&handoff.spec_path)));
    output.push_str(&format!("Plan: {}\n", display_or_none(&handoff.plan_path)));
    if !handoff.recommended_skill.is_empty() {
        output.push_str(&format!(
            "Recommended skill: {}\n",
            handoff.recommended_skill
        ));
    }
    if !handoff.recommendation_reason.is_empty() {
        output.push_str(&format!("Reason: {}\n", handoff.recommendation_reason));
    }
    if let Some(execution_status) = handoff.execution_status.as_ref() {
        append_execution_status_metadata(&mut output, execution_status);
    }
    Ok(output)
}

pub fn preflight(current_dir: &Path, args: &PlanArgs) -> Result<GateResult, JsonFailure> {
    let runtime = ExecutionRuntime::discover(current_dir)?;
    runtime.preflight(&execution_status_args(args))
}

pub fn gate_review(current_dir: &Path, args: &PlanArgs) -> Result<GateResult, JsonFailure> {
    let runtime = ExecutionRuntime::discover(current_dir)?;
    runtime.gate_review(&execution_status_args(args))
}

pub fn gate_finish(current_dir: &Path, args: &PlanArgs) -> Result<GateResult, JsonFailure> {
    let runtime = ExecutionRuntime::discover(current_dir)?;
    runtime.gate_finish(&execution_status_args(args))
}

pub fn render_gate(title: &str, gate: &GateResult) -> String {
    let mut output = format!("{}\nAllowed: {}\n", title, gate.allowed);
    if !gate.failure_class.is_empty() {
        output.push_str(&format!("Failure class: {}\n", gate.failure_class));
    }
    output
}

fn build_context(current_dir: &Path) -> Result<OperatorContext, JsonFailure> {
    build_context_with_options(current_dir, BuildContextOptions::strict())
}

fn build_context_with_options(
    current_dir: &Path,
    options: BuildContextOptions,
) -> Result<OperatorContext, JsonFailure> {
    let workflow = WorkflowRuntime::discover_read_only(current_dir).map_err(JsonFailure::from)?;
    let route = workflow.resolve().map_err(JsonFailure::from)?;
    let session_entry =
        session_entry::inspect(session_key().as_deref()).map_err(JsonFailure::from)?;
    let mut execution_status = None;
    let mut plan_contract = None;
    let mut preflight = None;
    let mut gate_review = None;
    let mut gate_finish = None;
    let mut execution_preflight_block_reason = None;

    if session_entry.outcome == "enabled" && route.status == "implementation_ready" {
        if let Some(report) = analyze_plan_if_available(&route).map_err(JsonFailure::from)? {
            plan_contract = Some(report);
        }
        if !route.plan_path.is_empty() {
            let runtime = ExecutionRuntime::discover(current_dir)?;
            let status_args = ExecutionStatusArgs {
                plan: PathBuf::from(&route.plan_path),
            };
            match runtime.status(&status_args) {
                Ok(mut status) => {
                    if let Some(shared_status) = started_status_from_same_branch_worktree(
                        &PathBuf::from(&route.root),
                        &route.plan_path,
                        &status,
                    ) {
                        status = shared_status;
                    }
                    if status.execution_started == "yes" {
                        if !execution_state_has_open_steps(&status) {
                            let review = runtime.gate_review(&status_args)?;
                            if review.allowed {
                                gate_finish = Some(runtime.gate_finish(&status_args)?);
                            }
                            gate_review = Some(review);
                        }
                    } else if !status_has_accepted_preflight(&status) {
                        preflight = Some(runtime.preflight_read_only(&status_args)?);
                    }
                    execution_status = Some(status);
                }
                Err(error)
                    if options.allow_legacy_pre_harness_cutover_handoff_block
                        && is_legacy_pre_harness_cutover_block(&error) =>
                {
                    execution_preflight_block_reason = Some(error.message.clone());
                }
                Err(error) => return Err(error),
            }
        }
    }

    let phase = derive_phase(
        &route.status,
        &session_entry.outcome,
        execution_status.as_ref(),
        preflight.as_ref(),
        gate_review.as_ref(),
        gate_finish.as_ref(),
    );

    Ok(OperatorContext {
        route,
        session_entry,
        execution_status,
        plan_contract,
        preflight,
        gate_review,
        gate_finish,
        execution_preflight_block_reason,
        phase,
    })
}

fn is_legacy_pre_harness_cutover_block(error: &JsonFailure) -> bool {
    error.error_class == FailureClass::MalformedExecutionState.as_str()
        && error.message == LEGACY_PRE_HARNESS_CUTOVER_MESSAGE
}

fn doctor_phase_for_context(context: &OperatorContext) -> String {
    if context.route.status == "implementation_ready"
        && context.session_entry.outcome == "enabled"
        && context
            .execution_status
            .as_ref()
            .is_some_and(|status| status.execution_started != "yes")
    {
        return String::from("execution_preflight");
    }

    context.phase.clone()
}

fn started_status_from_same_branch_worktree(
    current_repo_root: &Path,
    plan_path: &str,
    local_status: &PlanExecutionStatus,
) -> Option<PlanExecutionStatus> {
    if local_status.execution_started == "yes" || plan_path.is_empty() {
        return None;
    }

    let current_root =
        fs::canonicalize(current_repo_root).unwrap_or_else(|_| current_repo_root.to_path_buf());
    for worktree_root in same_branch_worktree_roots(current_repo_root) {
        let canonical_root =
            fs::canonicalize(&worktree_root).unwrap_or_else(|_| worktree_root.clone());
        if canonical_root == current_root {
            continue;
        }

        let runtime = match ExecutionRuntime::discover(&worktree_root) {
            Ok(runtime) => runtime,
            Err(_) => continue,
        };
        let status = match runtime.status(&ExecutionStatusArgs {
            plan: PathBuf::from(plan_path),
        }) {
            Ok(status) => status,
            Err(_) => continue,
        };
        if status.execution_started == "yes" {
            return Some(status);
        }
    }
    None
}

fn same_branch_worktree_roots(current_repo_root: &Path) -> Vec<PathBuf> {
    let output = match Command::new("git")
        .args(["worktree", "list", "--porcelain"])
        .current_dir(current_repo_root)
        .output()
    {
        Ok(output) if output.status.success() => output,
        _ => return Vec::new(),
    };

    let mut entries: Vec<(PathBuf, Option<String>)> = Vec::new();
    let mut worktree_root: Option<PathBuf> = None;
    let mut branch_ref: Option<String> = None;

    let flush_entry = |entries: &mut Vec<(PathBuf, Option<String>)>,
                       worktree_root: &mut Option<PathBuf>,
                       branch_ref: &mut Option<String>| {
        if let Some(root) = worktree_root.take() {
            entries.push((root, branch_ref.take()));
        }
    };

    for line in String::from_utf8_lossy(&output.stdout).lines() {
        if line.is_empty() {
            flush_entry(&mut entries, &mut worktree_root, &mut branch_ref);
            continue;
        }
        if let Some(path) = line.strip_prefix("worktree ") {
            flush_entry(&mut entries, &mut worktree_root, &mut branch_ref);
            worktree_root = Some(PathBuf::from(path));
            continue;
        }
        if let Some(branch) = line.strip_prefix("branch ") {
            branch_ref = Some(branch.to_owned());
        }
    }
    flush_entry(&mut entries, &mut worktree_root, &mut branch_ref);

    let current_root =
        fs::canonicalize(current_repo_root).unwrap_or_else(|_| current_repo_root.to_path_buf());
    let mut current_branch_ref = entries.iter().find_map(|(root, branch)| {
        let canonical_root = fs::canonicalize(root).unwrap_or_else(|_| root.clone());
        if canonical_root == current_root {
            branch.clone()
        } else {
            None
        }
    });

    if current_branch_ref.is_none() {
        let branch_output = Command::new("git")
            .args(["rev-parse", "--abbrev-ref", "HEAD"])
            .current_dir(current_repo_root)
            .output();
        if let Ok(output) = branch_output {
            if output.status.success() {
                let branch = String::from_utf8_lossy(&output.stdout).trim().to_owned();
                if !branch.is_empty() && branch != "HEAD" {
                    current_branch_ref = Some(format!("refs/heads/{branch}"));
                }
            }
        }
    }

    let Some(current_branch_ref) = current_branch_ref else {
        return Vec::new();
    };

    entries
        .into_iter()
        .filter_map(|(root, branch)| {
            if branch.as_deref() == Some(current_branch_ref.as_str()) {
                Some(root)
            } else {
                None
            }
        })
        .collect()
}

fn analyze_plan_if_available(
    route: &WorkflowRoute,
) -> Result<Option<AnalyzePlanReport>, DiagnosticError> {
    if route.spec_path.is_empty() || route.plan_path.is_empty() {
        return Ok(None);
    }

    let root = PathBuf::from(&route.root);
    let spec_path = root.join(&route.spec_path);
    let plan_path = root.join(&route.plan_path);
    if !spec_path.is_file() || !plan_path.is_file() {
        return Ok(None);
    }

    crate::contracts::plan::analyze_plan(spec_path, plan_path).map(Some)
}

fn derive_phase(
    route_status: &str,
    session_outcome: &str,
    execution_status: Option<&PlanExecutionStatus>,
    preflight: Option<&GateResult>,
    gate_review: Option<&GateResult>,
    gate_finish: Option<&GateResult>,
) -> String {
    if session_outcome == "needs_user_choice" {
        return String::from("needs_user_choice");
    }
    if session_outcome == "bypassed" {
        return String::from("bypassed");
    }

    if route_status != "implementation_ready" {
        return match route_status {
            "spec_draft" => String::from("spec_review"),
            "plan_draft" => String::from("plan_review"),
            "spec_approved_needs_plan" | "stale_plan" => String::from("plan_writing"),
            other => other.to_owned(),
        };
    }

    let Some(execution_status) = execution_status else {
        return String::from("implementation_handoff");
    };

    if let Some(authoritative_phase) = authoritative_public_phase(execution_status) {
        return authoritative_phase.to_owned();
    }

    if execution_status.execution_started != "yes" {
        if status_has_accepted_preflight(execution_status)
            || preflight.map(|result| result.allowed).unwrap_or(false)
        {
            return String::from("execution_preflight");
        }
        return String::from("implementation_handoff");
    }

    if execution_state_has_open_steps(execution_status) {
        return String::from("executing");
    }

    if let Some(gate_review) = gate_review {
        if !gate_review.allowed {
            return String::from("final_review_pending");
        }
    }

    let Some(gate_finish) = gate_finish else {
        return String::from("final_review_pending");
    };

    if gate_finish.allowed {
        return String::from("ready_for_branch_completion");
    }

    match gate_finish.failure_class.as_str() {
        "ReviewArtifactNotFresh" => String::from("final_review_pending"),
        "QaArtifactNotFresh" => String::from("qa_pending"),
        "ReleaseArtifactNotFresh" => String::from("document_release_pending"),
        _ => String::from("final_review_pending"),
    }
}

fn authoritative_public_phase(status: &PlanExecutionStatus) -> Option<&'static str> {
    if status.latest_authoritative_sequence <= INITIAL_AUTHORITATIVE_SEQUENCE {
        return None;
    }

    Some(status.harness_phase.as_str())
}

fn status_has_accepted_preflight(status: &PlanExecutionStatus) -> bool {
    status
        .execution_run_id
        .as_ref()
        .is_some_and(|run_id| !run_id.as_str().trim().is_empty())
        || status.harness_phase == HarnessPhase::ExecutionPreflight
}

fn execution_state_has_open_steps(status: &PlanExecutionStatus) -> bool {
    status.active_task.is_some() || status.blocking_task.is_some() || status.resume_task.is_some()
}

fn session_entry_state(output: &SessionEntryResolveOutput) -> SessionEntryState {
    SessionEntryState {
        outcome: output.outcome.clone(),
        decision_source: output.decision_source.clone(),
        session_key: output.session_key.clone(),
        decision_path: output.decision_path.clone(),
        policy_source: output.policy_source.clone(),
        persisted: output.persisted,
        failure_class: output.failure_class.clone(),
        reason: output.reason.clone(),
    }
}

fn next_step_text(context: &OperatorContext) -> String {
    if context.phase == "qa_pending" && finish_requires_test_plan_refresh(context) {
        if context.route.plan_path.is_empty() {
            return String::from(
                "Regenerate the current-branch test-plan artifact via featureforge:plan-eng-review before browser QA or branch completion.",
            );
        }
        return format!(
            "Regenerate the current-branch test-plan artifact via featureforge:plan-eng-review for the approved plan before browser QA or branch completion: {}",
            context.route.plan_path
        );
    }
    if review_requires_execution_reentry(context) {
        if context.route.plan_path.is_empty() {
            return String::from("Return to the current execution flow for the approved plan.");
        }
        return format!(
            "Return to the current execution flow for the approved plan: {}",
            context.route.plan_path
        );
    }
    next_text_for_phase(
        &context.phase,
        &context.route.status,
        &context.route.plan_path,
        &context.route.next_skill,
    )
}

fn next_text_for_phase(
    phase: &str,
    route_status: &str,
    plan_path: &str,
    next_skill: &str,
) -> String {
    match phase {
        "needs_user_choice" => String::from(
            "Resolve the session-entry gate before continuing into the normal FeatureForge workflow.",
        ),
        "bypassed" => String::from(
            "Continue outside the FeatureForge workflow unless the user explicitly re-enters.",
        ),
        "execution_preflight" | "implementation_handoff" => {
            if plan_path.is_empty() {
                String::from("Return to execution preflight for the approved plan.")
            } else {
                format!("Return to execution preflight for the approved plan: {plan_path}")
            }
        }
        "executing" => {
            if plan_path.is_empty() {
                String::from("Return to the current execution flow for the approved plan.")
            } else {
                format!("Return to the current execution flow for the approved plan: {plan_path}")
            }
        }
        "contract_drafting"
        | "contract_pending_approval"
        | "contract_approved"
        | "evaluating"
        | "repairing"
        | "handoff_required" => {
            if plan_path.is_empty() {
                String::from("Return to the current execution flow for the approved plan.")
            } else {
                format!("Return to the current execution flow for the approved plan: {plan_path}")
            }
        }
        "pivot_required" => {
            if plan_path.is_empty() {
                String::from("Update and re-approve the plan before continuing execution.")
            } else {
                format!("Update and re-approve the plan before continuing execution: {plan_path}")
            }
        }
        "final_review_pending" => {
            if plan_path.is_empty() {
                String::from("Use featureforge:requesting-code-review for the final review gate.")
            } else {
                format!(
                    "Use featureforge:requesting-code-review for the approved plan before branch completion: {plan_path}"
                )
            }
        }
        "qa_pending" => String::from(
            "Run featureforge:qa-only and return with a fresh QA result artifact before branch completion.",
        ),
        "document_release_pending" => String::from(
            "Run featureforge:document-release and return with a fresh release-readiness artifact before branch completion.",
        ),
        "ready_for_branch_completion" => {
            String::from("Use featureforge:finishing-a-development-branch.")
        }
        _ => {
            if !next_skill.is_empty() {
                format!("Use {next_skill}")
            } else if route_status == "needs_brainstorming" {
                String::from("Use featureforge:brainstorming")
            } else {
                String::from("Inspect the workflow state again after resolving the current issue.")
            }
        }
    }
}

fn reason_text(context: &OperatorContext) -> String {
    match context.phase.as_str() {
        "execution_preflight" => String::from(
            "The approved plan matches the latest approved spec and preflight is the next safe boundary.",
        ),
        "implementation_handoff" => context
            .execution_preflight_block_reason
            .clone()
            .unwrap_or_else(|| {
                String::from(
                    "The approved plan is ready, but execution preflight is still blocked by the current workspace state.",
                )
            }),
        "executing" => String::from(
            "Execution already started for the approved plan and should continue through the current execution flow.",
        ),
        "pivot_required" => {
            String::from("Execution is blocked pending an approved plan revision.")
        }
        "contract_drafting"
        | "contract_pending_approval"
        | "contract_approved"
        | "evaluating"
        | "repairing"
        | "handoff_required" => String::from(
            "Execution already started for the approved plan and should continue through the current execution flow.",
        ),
        "final_review_pending" => gate_first_diagnostic_message(context.gate_review.as_ref())
            .or_else(|| gate_first_diagnostic_message(context.gate_finish.as_ref()))
            .unwrap_or_else(|| {
                String::from("Execution is blocked on the final review gate for the approved plan.")
            }),
        "qa_pending" | "document_release_pending" => {
            gate_first_diagnostic_message(context.gate_finish.as_ref())
                .unwrap_or_else(|| context.route.reason.clone())
        }
        "ready_for_branch_completion" => {
            String::from("All required late-stage artifacts are fresh for the current HEAD.")
        }
        "needs_user_choice" => {
            String::from("The session-entry decision is still unresolved for this session.")
        }
        "bypassed" => String::from(
            "FeatureForge is bypassed for this session until the user explicitly re-enters.",
        ),
        _ => context.route.reason.clone(),
    }
}

fn display_or_none(value: &str) -> &str {
    if value.is_empty() {
        "none"
    } else {
        value
    }
}

fn public_next_skill(context: &OperatorContext) -> String {
    if matches!(context.phase.as_str(), "needs_user_choice" | "bypassed") {
        String::new()
    } else {
        context.route.next_skill.clone()
    }
}

fn next_action_for_phase(phase: &str) -> &'static str {
    match phase {
        "needs_user_choice" => "session_entry_gate",
        "bypassed" => "continue_outside_featureforge",
        "needs_brainstorming"
        | "brainstorming"
        | "spec_review"
        | "plan_writing"
        | "plan_review"
        | "plan_update"
        | "workflow_unresolved" => "use_next_skill",
        "implementation_handoff" | "execution_preflight" => "execution_preflight",
        "executing"
        | "contract_drafting"
        | "contract_pending_approval"
        | "contract_approved"
        | "evaluating"
        | "repairing"
        | "handoff_required" => "return_to_execution",
        "pivot_required" => "plan_update",
        "final_review_pending" => "request_code_review",
        "qa_pending" => "run_qa_only",
        "document_release_pending" => "run_document_release",
        "ready_for_branch_completion" => "finish_branch",
        _ => "inspect_workflow",
    }
}

fn next_action_for_context(context: &OperatorContext) -> &'static str {
    if review_requires_execution_reentry(context) {
        "return_to_execution"
    } else if context.phase == "qa_pending" && finish_requires_test_plan_refresh(context) {
        "refresh_test_plan"
    } else {
        next_action_for_phase(&context.phase)
    }
}

fn finish_requires_test_plan_refresh(context: &OperatorContext) -> bool {
    gate_has_any_reason(
        context.gate_finish.as_ref(),
        &[
            "test_plan_artifact_missing",
            "test_plan_artifact_malformed",
            "test_plan_artifact_stale",
        ],
    )
}

fn review_requires_execution_reentry(context: &OperatorContext) -> bool {
    context.phase == "final_review_pending"
        && context
            .gate_review
            .as_ref()
            .is_some_and(|gate| !gate.allowed)
}

fn gate_has_any_reason(gate: Option<&GateResult>, expected_codes: &[&str]) -> bool {
    gate.is_some_and(|gate| {
        gate.reason_codes
            .iter()
            .any(|code| expected_codes.contains(&code.as_str()))
    })
}

fn gate_first_diagnostic_message(gate: Option<&GateResult>) -> Option<String> {
    gate.and_then(|gate| {
        gate.diagnostics
            .first()
            .map(|diagnostic| diagnostic.message.clone())
    })
}

fn append_execution_status_metadata(output: &mut String, status: &PlanExecutionStatus) {
    output.push_str(&format!(
        "Execution reason codes: {}\n",
        reason_codes_text(&status.reason_codes)
    ));
    output.push_str(&format!(
        "Evaluator required kinds: {}\n",
        evaluator_kinds_text(&status.required_evaluator_kinds)
    ));
    output.push_str(&format!(
        "Evaluator completed kinds: {}\n",
        evaluator_kinds_text(&status.completed_evaluator_kinds)
    ));
    output.push_str(&format!(
        "Evaluator pending kinds: {}\n",
        evaluator_kinds_text(&status.pending_evaluator_kinds)
    ));
    output.push_str(&format!(
        "Evaluator non-passing kinds: {}\n",
        evaluator_kinds_text(&status.non_passing_evaluator_kinds)
    ));
    output.push_str(&format!(
        "Evaluator last kind: {}\n",
        optional_evaluator_kind_text(status.last_evaluation_evaluator_kind)
    ));
    output.push_str(&format!(
        "Write authority state: {}\n",
        status.write_authority_state
    ));
    output.push_str(&format!(
        "Write authority holder: {}\n",
        optional_text(status.write_authority_holder.as_deref())
    ));
    output.push_str(&format!(
        "Write authority worktree: {}\n",
        optional_text(status.write_authority_worktree.as_deref())
    ));
}

fn reason_codes_text(reason_codes: &[String]) -> String {
    if reason_codes.is_empty() {
        String::from("none")
    } else {
        reason_codes.join(", ")
    }
}

fn evaluator_kinds_text(kinds: &[EvaluatorKind]) -> String {
    if kinds.is_empty() {
        String::from("none")
    } else {
        kinds
            .iter()
            .map(evaluator_kind_text)
            .collect::<Vec<_>>()
            .join(", ")
    }
}

fn evaluator_kind_text(kind: &EvaluatorKind) -> &'static str {
    match kind {
        EvaluatorKind::SpecCompliance => "spec_compliance",
        EvaluatorKind::CodeQuality => "code_quality",
    }
}

fn optional_evaluator_kind_text(value: Option<EvaluatorKind>) -> &'static str {
    match value {
        Some(value) => evaluator_kind_text(&value),
        None => "none",
    }
}

fn optional_text(value: Option<&str>) -> &str {
    value
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("none")
}

fn execution_status_args(args: &PlanArgs) -> ExecutionStatusArgs {
    ExecutionStatusArgs {
        plan: args.plan.clone(),
    }
}

fn session_key() -> Option<String> {
    env::var("FEATUREFORGE_SESSION_KEY")
        .ok()
        .or_else(|| env::var("PPID").ok())
        .filter(|value| !value.trim().is_empty())
}
