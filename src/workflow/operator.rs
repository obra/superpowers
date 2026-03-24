use std::env;
use std::path::{Path, PathBuf};

use schemars::JsonSchema;
use serde::Serialize;

use crate::cli::plan_execution::{RecommendArgs, StatusArgs as ExecutionStatusArgs};
use crate::cli::workflow::PlanArgs;
use crate::contracts::plan::AnalyzePlanReport;
use crate::diagnostics::{DiagnosticError, JsonFailure};
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
    phase: String,
}

pub fn render_next(current_dir: &Path) -> Result<String, JsonFailure> {
    let context = build_context(current_dir)?;
    let mut output = String::new();
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
        "Why Superpowers chose this state\n- State: {}\n- Spec: {}\n- Plan: {}\nWhat to do:\n1. {}\n",
        context.route.status,
        display_or_none(&context.route.spec_path),
        display_or_none(&context.route.plan_path),
        next_step_text(&context)
    ))
}

pub fn phase(current_dir: &Path) -> Result<WorkflowPhase, JsonFailure> {
    let context = build_context(current_dir)?;
    let next_skill = if context.phase == "bypassed" {
        String::new()
    } else {
        context.route.next_skill.clone()
    };
    Ok(WorkflowPhase {
        phase: context.phase.clone(),
        route_status: context.route.status.clone(),
        next_skill,
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
        "Workflow phase: {}\nRoute status: {}\nNext: {}\nSpec: {}\nPlan: {}\n",
        context.phase,
        context.route.status,
        next_step_text(&context),
        display_or_none(&context.route.spec_path),
        display_or_none(&context.route.plan_path)
    ))
}

pub fn doctor(current_dir: &Path) -> Result<WorkflowDoctor, JsonFailure> {
    let context = build_context(current_dir)?;
    let contract_state = context
        .plan_contract
        .as_ref()
        .map(|report| report.contract_state.clone())
        .unwrap_or_else(|| context.route.contract_state.clone());

    Ok(WorkflowDoctor {
        phase: context.phase.clone(),
        route_status: context.route.status.clone(),
        next_skill: if context.phase == "bypassed" {
            String::new()
        } else {
            context.route.next_skill.clone()
        },
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
    Ok(format!(
        "Workflow doctor\nPhase: {}\nSession entry: {}\nRoute status: {}\nContract state: {}\nSpec: {}\nPlan: {}\n",
        doctor.phase,
        doctor.session_entry.outcome,
        doctor.route_status,
        doctor.contract_state,
        display_or_none(&doctor.spec_path),
        display_or_none(&doctor.plan_path)
    ))
}

pub fn handoff(current_dir: &Path) -> Result<WorkflowHandoff, JsonFailure> {
    let context = build_context(current_dir)?;
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
                    "Superpowers is bypassed for this session until the user explicitly re-enters.",
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
            "review_blocked" => (
                String::from("superpowers:requesting-code-review"),
                reason_text(&context),
            ),
            "qa_pending" if finish_requires_test_plan_refresh(&context) => (
                String::from("superpowers:plan-eng-review"),
                reason_text(&context),
            ),
            "qa_pending" => (String::from("superpowers:qa-only"), reason_text(&context)),
            "document_release_pending" => (
                String::from("superpowers:document-release"),
                reason_text(&context),
            ),
            "ready_for_branch_completion" => (
                String::from("superpowers:finishing-a-development-branch"),
                reason_text(&context),
            ),
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
        next_skill: if context.phase == "bypassed" {
            String::new()
        } else {
            context.route.next_skill.clone()
        },
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
    let workflow = WorkflowRuntime::discover_read_only(current_dir).map_err(JsonFailure::from)?;
    let route = workflow.resolve().map_err(JsonFailure::from)?;
    let session_entry =
        session_entry::inspect(session_key().as_deref()).map_err(JsonFailure::from)?;
    let mut execution_status = None;
    let mut plan_contract = None;
    let mut preflight = None;
    let mut gate_review = None;
    let mut gate_finish = None;

    if session_entry.outcome == "enabled" && route.status == "implementation_ready" {
        if let Some(report) = analyze_plan_if_available(&route).map_err(JsonFailure::from)? {
            plan_contract = Some(report);
        }
        if !route.plan_path.is_empty() {
            let runtime = ExecutionRuntime::discover(current_dir)?;
            let status_args = ExecutionStatusArgs {
                plan: PathBuf::from(&route.plan_path),
            };
            let status = runtime.status(&status_args)?;
            if status.execution_started == "yes" {
                if !execution_state_has_open_steps(&status) {
                    let review = runtime.gate_review(&status_args)?;
                    if review.allowed {
                        gate_finish = Some(runtime.gate_finish(&status_args)?);
                    }
                    gate_review = Some(review);
                }
            } else {
                preflight = Some(runtime.preflight(&status_args)?);
            }
            execution_status = Some(status);
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
        phase,
    })
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

    if execution_status.execution_started != "yes" {
        if preflight.map(|result| result.allowed).unwrap_or(false) {
            return String::from("execution_preflight");
        }
        return String::from("implementation_handoff");
    }

    if execution_state_has_open_steps(execution_status) {
        return String::from("executing");
    }

    if let Some(gate_review) = gate_review {
        if !gate_review.allowed {
            return String::from("review_blocked");
        }
    }

    let Some(gate_finish) = gate_finish else {
        return String::from("review_blocked");
    };

    if gate_finish.allowed {
        return String::from("ready_for_branch_completion");
    }

    match gate_finish.failure_class.as_str() {
        "ReviewArtifactNotFresh" => String::from("review_blocked"),
        "QaArtifactNotFresh" => String::from("qa_pending"),
        "ReleaseArtifactNotFresh" => String::from("document_release_pending"),
        _ => String::from("review_blocked"),
    }
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
                "Regenerate the current-branch test-plan artifact via superpowers:plan-eng-review before browser QA or branch completion.",
            );
        }
        return format!(
            "Regenerate the current-branch test-plan artifact via superpowers:plan-eng-review for the approved plan before browser QA or branch completion: {}",
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
            "Resolve the session-entry gate before continuing into the normal Superpowers workflow.",
        ),
        "bypassed" => String::from(
            "Continue outside the Superpowers workflow unless the user explicitly re-enters.",
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
        "review_blocked" => {
            if plan_path.is_empty() {
                String::from("Use superpowers:requesting-code-review for the final review gate.")
            } else {
                format!(
                    "Use superpowers:requesting-code-review for the approved plan before branch completion: {plan_path}"
                )
            }
        }
        "qa_pending" => String::from(
            "Run superpowers:qa-only and return with a fresh QA result artifact before branch completion.",
        ),
        "document_release_pending" => String::from(
            "Run superpowers:document-release and return with a fresh release-readiness artifact before branch completion.",
        ),
        "ready_for_branch_completion" => {
            String::from("Use superpowers:finishing-a-development-branch.")
        }
        _ => {
            if !next_skill.is_empty() {
                format!("Use {next_skill}")
            } else if route_status == "needs_brainstorming" {
                String::from("Use superpowers:brainstorming")
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
        "implementation_handoff" => String::from(
            "The approved plan is ready, but execution preflight is still blocked by the current workspace state.",
        ),
        "executing" => String::from(
            "Execution already started for the approved plan and should continue through the current execution flow.",
        ),
        "review_blocked" => gate_first_diagnostic_message(context.gate_review.as_ref())
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
            "Superpowers is bypassed for this session until the user explicitly re-enters.",
        ),
        _ => context.route.reason.clone(),
    }
}

fn display_or_none(value: &str) -> &str {
    if value.is_empty() { "none" } else { value }
}

fn next_action_for_phase(phase: &str) -> &'static str {
    match phase {
        "needs_user_choice" => "session_entry_gate",
        "bypassed" => "continue_outside_superpowers",
        "needs_brainstorming"
        | "brainstorming"
        | "spec_review"
        | "plan_writing"
        | "plan_review"
        | "plan_update"
        | "workflow_unresolved" => "use_next_skill",
        "implementation_handoff" | "execution_preflight" => "execution_preflight",
        "executing" => "return_to_execution",
        "review_blocked" => "request_code_review",
        "qa_pending" => "run_qa_only",
        "document_release_pending" => "run_document_release",
        "ready_for_branch_completion" => "finish_branch",
        _ => "inspect_workflow",
    }
}

fn next_action_for_context(context: &OperatorContext) -> &'static str {
    if context.phase == "qa_pending" && finish_requires_test_plan_refresh(context) {
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

fn execution_status_args(args: &PlanArgs) -> ExecutionStatusArgs {
    ExecutionStatusArgs {
        plan: args.plan.clone(),
    }
}

fn session_key() -> Option<String> {
    env::var("SUPERPOWERS_SESSION_KEY")
        .ok()
        .or_else(|| env::var("PPID").ok())
        .filter(|value| !value.trim().is_empty())
}
