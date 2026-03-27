use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;

use jiff::Timestamp;
use sha2::{Digest, Sha256};

use crate::cli::plan_execution::{BeginArgs, CompleteArgs, NoteArgs, ReopenArgs, TransferArgs};
use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::state::{
    compute_packet_fingerprint, current_file_proof, current_head_sha, hash_contract_plan,
    load_execution_context, normalize_begin_request, normalize_complete_request,
    normalize_note_request, normalize_reopen_request, normalize_source, normalize_transfer_request,
    require_normalized_text, require_preflight_acceptance, status_from_context,
    validate_expected_fingerprint, EvidenceAttempt, ExecutionContext, ExecutionEvidence,
    ExecutionRuntime, FileProof, PlanExecutionStatus, PlanStepState, NO_REPO_FILES_MARKER,
};
use crate::execution::transitions::{
    claim_step_write_authority, enforce_active_contract_scope, enforce_authoritative_phase,
    load_authoritative_transition_state, AuthoritativeTransitionState, StepCommand,
};
use crate::paths::{normalize_repo_relative_path, write_atomic as write_atomic_file};

pub fn begin(
    runtime: &ExecutionRuntime,
    args: &BeginArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_begin_request(args);
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context(runtime, &args.plan)?;
    validate_expected_fingerprint(&context, &request.expect_execution_fingerprint)?;
    require_preflight_acceptance(&context)?;
    let authoritative_state = load_authoritative_transition_state(&context)?;
    enforce_authoritative_phase(authoritative_state.as_ref(), StepCommand::Begin)?;
    enforce_active_contract_scope(
        authoritative_state.as_ref(),
        StepCommand::Begin,
        request.task,
        request.step,
    )?;

    let step_index = step_index(&context, request.task, request.step).ok_or_else(|| {
        JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "Requested task/step does not exist in the approved plan.",
        )
    })?;
    if context.steps[step_index].checked {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "begin may not target a completed step.",
        ));
    }

    match context.plan_document.execution_mode.as_str() {
        "none" => match request.execution_mode.as_deref() {
            Some("featureforge:executing-plans" | "featureforge:subagent-driven-development") => {
                context.plan_document.execution_mode = request.execution_mode.unwrap();
            }
            _ => {
                return Err(JsonFailure::new(
                    FailureClass::InvalidExecutionMode,
                    "The first begin for a plan revision must supply a valid execution mode.",
                ));
            }
        },
        existing_mode => {
            if request
                .execution_mode
                .as_deref()
                .is_some_and(|candidate| candidate != existing_mode)
            {
                return Err(JsonFailure::new(
                    FailureClass::InvalidExecutionMode,
                    "begin may not change the persisted execution mode.",
                ));
            }
        }
    }

    if let Some(active) = context
        .steps
        .iter()
        .find(|step| step.note_state == Some(crate::execution::state::NoteState::Active))
    {
        if active.task_number == request.task && active.step_number == request.step {
            return status_from_context(&context);
        }
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "A different step is already active.",
        ));
    }
    if context
        .steps
        .iter()
        .any(|step| step.note_state == Some(crate::execution::state::NoteState::Blocked))
    {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "begin may not bypass existing blocked work.",
        ));
    }
    if let Some(interrupted) = context
        .steps
        .iter()
        .find(|step| step.note_state == Some(crate::execution::state::NoteState::Interrupted))
    {
        if interrupted.task_number != request.task || interrupted.step_number != request.step {
            return Err(JsonFailure::new(
                FailureClass::InvalidStepTransition,
                "Interrupted work must resume on the same step.",
            ));
        }
    }

    context.steps[step_index].note_state = Some(crate::execution::state::NoteState::Active);
    context.steps[step_index].note_summary = truncate_summary(&require_normalized_text(
        &context.steps[step_index].title,
        FailureClass::InvalidCommandInput,
        "Execution note summaries may not be blank after whitespace normalization.",
    )?);

    let rendered_plan = render_plan_source(
        &context.plan_source,
        &context.plan_document.execution_mode,
        &context.steps,
    );
    write_atomic(&context.plan_abs, &rendered_plan)?;
    let reloaded = load_execution_context(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn complete(
    runtime: &ExecutionRuntime,
    args: &CompleteArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_complete_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context(runtime, &args.plan)?;
    validate_expected_fingerprint(&context, &request.expect_execution_fingerprint)?;
    normalize_source(&request.source, &context.plan_document.execution_mode)?;
    let authoritative_state = load_authoritative_transition_state(&context)?;
    enforce_authoritative_phase(authoritative_state.as_ref(), StepCommand::Complete)?;
    enforce_active_contract_scope(
        authoritative_state.as_ref(),
        StepCommand::Complete,
        request.task,
        request.step,
    )?;
    let provenance = authoritative_state
        .as_ref()
        .map(|state| state.evidence_provenance())
        .unwrap_or_default();

    let step_index = step_index(&context, request.task, request.step).ok_or_else(|| {
        JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "Requested task/step does not exist in the approved plan.",
        )
    })?;
    if context.steps[step_index].note_state != Some(crate::execution::state::NoteState::Active) {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "complete may target only the current active step.",
        ));
    }
    if context.steps[step_index].checked {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "complete may not directly refresh an already checked step.",
        ));
    }

    let files = if request.files.is_empty() {
        default_files_for_task(&context, request.task)
    } else {
        canonicalize_files(&request.files)?
    };
    let files = canonicalize_repo_visible_paths(&context.runtime.repo_root, &files)?;
    let file_proofs = files
        .iter()
        .map(|path| FileProof {
            path: path.clone(),
            proof: current_file_proof(&context.runtime.repo_root, path),
        })
        .collect::<Vec<_>>();

    context.steps[step_index].checked = true;
    context.steps[step_index].note_state = None;
    context.steps[step_index].note_summary.clear();

    let contract_plan_fingerprint = hash_contract_plan(&context.plan_source);
    let source_spec_fingerprint = sha256_hex(context.source_spec_source.as_bytes());
    let packet_fingerprint = compute_packet_fingerprint(
        &context.plan_rel,
        context.plan_document.plan_revision,
        &contract_plan_fingerprint,
        &context.plan_document.source_spec_path,
        context.plan_document.source_spec_revision,
        &source_spec_fingerprint,
        request.task,
        request.step,
    );
    let recorded_at = Timestamp::now().to_string();
    let head_sha = current_head_sha(&context.runtime.repo_root)?;
    let new_attempt = EvidenceAttempt {
        task_number: request.task,
        step_number: request.step,
        attempt_number: next_attempt_number(&context.evidence, request.task, request.step),
        status: String::from("Completed"),
        recorded_at,
        execution_source: request.source.clone(),
        claim: request.claim,
        files: files.clone(),
        file_proofs,
        verification_summary: request.verification_summary,
        invalidation_reason: String::from("N/A"),
        packet_fingerprint: Some(packet_fingerprint),
        head_sha: Some(head_sha.clone()),
        base_sha: Some(head_sha),
        source_contract_path: provenance.source_contract_path,
        source_contract_fingerprint: provenance.source_contract_fingerprint,
        source_evaluation_report_fingerprint: provenance.source_evaluation_report_fingerprint,
        evaluator_verdict: provenance.evaluator_verdict,
        failing_criterion_ids: provenance.failing_criterion_ids,
        source_handoff_fingerprint: provenance.source_handoff_fingerprint,
        repo_state_baseline_head_sha: provenance.repo_state_baseline_head_sha,
        repo_state_baseline_worktree_fingerprint: provenance
            .repo_state_baseline_worktree_fingerprint,
    };

    context.evidence.attempts.push(new_attempt);
    context.evidence.format = crate::execution::state::EvidenceFormat::V2;

    let rendered_plan = render_plan_source(
        &context.plan_source,
        &context.plan_document.execution_mode,
        &context.steps,
    );
    let plan_fingerprint = sha256_hex(rendered_plan.as_bytes());
    let rendered_evidence =
        render_evidence_source(&context, &plan_fingerprint, &source_spec_fingerprint);

    write_plan_and_evidence_with_rollback(
        &context.plan_abs,
        &context.plan_source,
        &rendered_plan,
        &context.evidence_abs,
        context.evidence.source.as_deref(),
        &rendered_evidence,
        "complete_after_plan_write",
    )?;
    let reloaded = load_execution_context(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn note(
    runtime: &ExecutionRuntime,
    args: &NoteArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_note_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context(runtime, &args.plan)?;
    validate_expected_fingerprint(&context, &request.expect_execution_fingerprint)?;
    let mut authoritative_state = load_authoritative_transition_state(&context)?;
    enforce_authoritative_phase(authoritative_state.as_ref(), StepCommand::Note)?;
    enforce_active_contract_scope(
        authoritative_state.as_ref(),
        StepCommand::Note,
        request.task,
        request.step,
    )?;

    let step_index = step_index(&context, request.task, request.step).ok_or_else(|| {
        JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "Requested task/step does not exist in the approved plan.",
        )
    })?;
    if context.steps[step_index].note_state != Some(crate::execution::state::NoteState::Active) {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "note may target only the current active step.",
        ));
    }
    if context.steps[step_index].checked {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "note may not target a completed step.",
        ));
    }

    context.steps[step_index].note_state = Some(request.state);
    context.steps[step_index].note_summary = request.message;
    if let Some(authoritative_state) = authoritative_state.as_mut() {
        authoritative_state.apply_note_reset_policy(request.state)?;
    }

    let rendered_plan = render_plan_source(
        &context.plan_source,
        &context.plan_document.execution_mode,
        &context.steps,
    );
    write_atomic(&context.plan_abs, &rendered_plan)?;
    if let Some(authoritative_state) = authoritative_state.as_ref() {
        persist_authoritative_state_with_rollback(
            authoritative_state,
            &context.plan_abs,
            &context.plan_source,
            &context.evidence_abs,
            context.evidence.source.as_deref(),
            "note_after_plan_write_before_authoritative_state_publish",
        )?;
    }
    let reloaded = load_execution_context(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn reopen(
    runtime: &ExecutionRuntime,
    args: &ReopenArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_reopen_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context(runtime, &args.plan)?;
    validate_expected_fingerprint(&context, &request.expect_execution_fingerprint)?;
    normalize_source(&request.source, &context.plan_document.execution_mode)?;
    let mut authoritative_state = load_authoritative_transition_state(&context)?;
    enforce_authoritative_phase(authoritative_state.as_ref(), StepCommand::Reopen)?;
    enforce_active_contract_scope(
        authoritative_state.as_ref(),
        StepCommand::Reopen,
        request.task,
        request.step,
    )?;

    let step_index = step_index(&context, request.task, request.step).ok_or_else(|| {
        JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "Requested task/step does not exist in the approved plan.",
        )
    })?;
    if !context.steps[step_index].checked {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "reopen may target only a completed step.",
        ));
    }
    if context
        .steps
        .iter()
        .any(|step| step.note_state == Some(crate::execution::state::NoteState::Interrupted))
    {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "reopen may not create a second parked interrupted step while one already exists.",
        ));
    }

    invalidate_latest_completed_attempt(&mut context, request.task, request.step, &request.reason)?;
    context.steps[step_index].checked = false;
    context.steps[step_index].note_state = Some(crate::execution::state::NoteState::Interrupted);
    context.steps[step_index].note_summary = truncate_summary(&request.reason);
    context.evidence.format = crate::execution::state::EvidenceFormat::V2;
    if let Some(authoritative_state) = authoritative_state.as_mut() {
        authoritative_state.stale_reopen_provenance()?;
    }

    let rendered_plan = render_plan_source(
        &context.plan_source,
        &context.plan_document.execution_mode,
        &context.steps,
    );
    let plan_fingerprint = sha256_hex(rendered_plan.as_bytes());
    let source_spec_fingerprint = sha256_hex(context.source_spec_source.as_bytes());
    let rendered_evidence =
        render_evidence_source(&context, &plan_fingerprint, &source_spec_fingerprint);
    write_plan_and_evidence_with_rollback(
        &context.plan_abs,
        &context.plan_source,
        &rendered_plan,
        &context.evidence_abs,
        context.evidence.source.as_deref(),
        &rendered_evidence,
        "reopen_after_plan_write",
    )?;
    if let Some(authoritative_state) = authoritative_state.as_ref() {
        persist_authoritative_state_with_rollback(
            authoritative_state,
            &context.plan_abs,
            &context.plan_source,
            &context.evidence_abs,
            context.evidence.source.as_deref(),
            "reopen_after_plan_and_evidence_write_before_authoritative_state_publish",
        )?;
    }

    let reloaded = load_execution_context(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn transfer(
    runtime: &ExecutionRuntime,
    args: &TransferArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_transfer_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context(runtime, &args.plan)?;
    validate_expected_fingerprint(&context, &request.expect_execution_fingerprint)?;
    normalize_source(&request.source, &context.plan_document.execution_mode)?;
    let authoritative_state = load_authoritative_transition_state(&context)?;
    enforce_authoritative_phase(authoritative_state.as_ref(), StepCommand::Transfer)?;
    enforce_active_contract_scope(
        authoritative_state.as_ref(),
        StepCommand::Transfer,
        request.repair_task,
        request.repair_step,
    )?;

    let active_index = context
        .steps
        .iter()
        .position(|step| step.note_state == Some(crate::execution::state::NoteState::Active))
        .ok_or_else(|| {
            JsonFailure::new(
                FailureClass::InvalidStepTransition,
                "transfer requires a current active step.",
            )
        })?;
    if context
        .steps
        .iter()
        .any(|step| step.note_state == Some(crate::execution::state::NoteState::Interrupted))
    {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "transfer may not create a second parked interrupted step while one already exists.",
        ));
    }

    let repair_index =
        step_index(&context, request.repair_task, request.repair_step).ok_or_else(|| {
            JsonFailure::new(
                FailureClass::InvalidStepTransition,
                "Requested repair task/step does not exist in the approved plan.",
            )
        })?;
    if !context.steps[repair_index].checked {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "transfer may target only a completed repair step.",
        ));
    }

    invalidate_latest_completed_attempt(
        &mut context,
        request.repair_task,
        request.repair_step,
        &request.reason,
    )?;
    context.steps[repair_index].checked = false;
    context.steps[repair_index].note_state = None;
    context.steps[repair_index].note_summary.clear();
    context.steps[active_index].note_state = Some(crate::execution::state::NoteState::Interrupted);
    context.steps[active_index].note_summary = truncate_summary(&format!(
        "Parked for repair of Task {} Step {}",
        request.repair_task, request.repair_step
    ));
    context.evidence.format = crate::execution::state::EvidenceFormat::V2;

    let rendered_plan = render_plan_source(
        &context.plan_source,
        &context.plan_document.execution_mode,
        &context.steps,
    );
    let plan_fingerprint = sha256_hex(rendered_plan.as_bytes());
    let source_spec_fingerprint = sha256_hex(context.source_spec_source.as_bytes());
    let rendered_evidence =
        render_evidence_source(&context, &plan_fingerprint, &source_spec_fingerprint);
    write_plan_and_evidence_with_rollback(
        &context.plan_abs,
        &context.plan_source,
        &rendered_plan,
        &context.evidence_abs,
        context.evidence.source.as_deref(),
        &rendered_evidence,
        "transfer_after_plan_write",
    )?;

    let reloaded = load_execution_context(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

fn step_index(context: &ExecutionContext, task: u32, step: u32) -> Option<usize> {
    context
        .steps
        .iter()
        .position(|candidate| candidate.task_number == task && candidate.step_number == step)
}

fn truncate_summary(summary: &str) -> String {
    if summary.chars().count() <= 120 {
        return summary.to_owned();
    }
    let truncated = summary.chars().take(117).collect::<String>();
    format!("{truncated}...")
}

fn canonicalize_files(files: &[String]) -> Result<Vec<String>, JsonFailure> {
    let mut normalized = files
        .iter()
        .map(|path| {
            let path = normalize_repo_relative_path(path).map_err(|_| {
                JsonFailure::new(
                    FailureClass::InvalidCommandInput,
                    "Evidence file paths must be normalized repo-relative paths inside the repo root.",
                )
            })?;
            Ok(path)
        })
        .collect::<Result<Vec<_>, JsonFailure>>()?;
    normalized.sort();
    normalized.dedup();
    Ok(if normalized.is_empty() {
        vec![String::from(NO_REPO_FILES_MARKER)]
    } else {
        normalized
    })
}

fn canonicalize_repo_visible_paths(
    repo_root: &Path,
    files: &[String],
) -> Result<Vec<String>, JsonFailure> {
    let missing = files
        .iter()
        .filter(|path| !repo_root.join(path).exists())
        .cloned()
        .collect::<BTreeSet<_>>();
    if missing.is_empty() {
        return Ok(files.to_vec());
    }

    let rename_map = rename_backed_paths(repo_root, &missing)?;
    let mut canonical = files
        .iter()
        .map(|path| {
            rename_map
                .get(path)
                .cloned()
                .unwrap_or_else(|| path.clone())
        })
        .collect::<Vec<_>>();
    canonical.sort();
    canonical.dedup();
    Ok(canonical)
}

fn rename_backed_paths(
    repo_root: &Path,
    missing: &BTreeSet<String>,
) -> Result<BTreeMap<String, String>, JsonFailure> {
    let repo = gix::discover(repo_root).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not discover the repository while canonicalizing rename-backed file paths: {error}"
            ),
        )
    })?;
    let head_tree = repo.head_tree_id_or_empty().map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not determine the HEAD tree while canonicalizing rename-backed file paths: {error}"
            ),
        )
    })?;
    let index = repo.index_or_empty().map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not open the repository index while canonicalizing rename-backed file paths: {error}"
            ),
        )
    })?;

    let mut paths = BTreeMap::new();
    repo.tree_index_status(
        head_tree.detach().as_ref(),
        &*index,
        None,
        gix::status::tree_index::TrackRenames::AsConfigured,
        |change, _, _| {
            if let gix::diff::index::ChangeRef::Rewrite {
                source_location,
                location,
                copy,
                ..
            } = change
            {
                if !copy {
                    let source = String::from_utf8_lossy(source_location.as_ref()).into_owned();
                    if missing.contains(&source) {
                        let destination =
                            String::from_utf8_lossy(location.as_ref()).into_owned();
                        paths.insert(source, destination);
                        if paths.len() == missing.len() {
                            return Ok::<_, std::convert::Infallible>(std::ops::ControlFlow::Break(()));
                        }
                    }
                }
            }
            Ok::<_, std::convert::Infallible>(std::ops::ControlFlow::Continue(()))
        },
    )
    .map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not canonicalize rename-backed file paths from the current change set: {error}"
            ),
        )
    })?;
    Ok(paths)
}

fn default_files_for_task(context: &ExecutionContext, task_number: u32) -> Vec<String> {
    let Some(task) = context.tasks_by_number.get(&task_number) else {
        return vec![String::from(NO_REPO_FILES_MARKER)];
    };
    let mut files = task
        .files
        .iter()
        .map(|entry| entry.path.clone())
        .filter(|path| context.runtime.repo_root.join(path).exists())
        .collect::<Vec<_>>();
    files.sort();
    files.dedup();
    if files.is_empty() {
        vec![String::from(NO_REPO_FILES_MARKER)]
    } else {
        files
    }
}

fn render_plan_source(
    original_source: &str,
    execution_mode: &str,
    steps: &[PlanStepState],
) -> String {
    let step_map = steps
        .iter()
        .map(|step| ((step.task_number, step.step_number), step))
        .collect::<BTreeMap<_, _>>();
    let lines = original_source.lines().collect::<Vec<_>>();
    let mut rendered = Vec::new();
    let mut current_task = None::<u32>;
    let mut suppress_note = false;

    for line in lines {
        if suppress_note {
            if line.is_empty() || line.trim_start().starts_with("**Execution Note:**") {
                continue;
            }
            suppress_note = false;
        }

        if line.starts_with("**Execution Mode:** ") {
            rendered.push(format!("**Execution Mode:** {execution_mode}"));
            continue;
        }

        if let Some(rest) = line.strip_prefix("## Task ") {
            current_task = rest
                .split(':')
                .next()
                .and_then(|value| value.parse::<u32>().ok());
            rendered.push(line.to_owned());
            continue;
        }

        if let Some((_, step_number, _)) = crate::execution::state::parse_step_line(line) {
            if let Some(task_number) = current_task {
                if let Some(step) = step_map.get(&(task_number, step_number)) {
                    let mark = if step.checked { 'x' } else { ' ' };
                    rendered.push(format!(
                        "- [{mark}] **Step {}: {}**",
                        step.step_number, step.title
                    ));
                    if let Some(note_state) = step.note_state {
                        rendered.push(String::new());
                        rendered.push(format!(
                            "  **Execution Note:** {} - {}",
                            note_state.as_str(),
                            step.note_summary
                        ));
                    }
                    suppress_note = true;
                    continue;
                }
            }
        }

        rendered.push(line.to_owned());
    }

    format!("{}\n", rendered.join("\n"))
}

fn render_evidence_source(
    context: &ExecutionContext,
    plan_fingerprint: &str,
    source_spec_fingerprint: &str,
) -> String {
    let mut output = Vec::new();
    let topic = Path::new(&context.plan_rel)
        .file_stem()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("plan");
    output.push(format!("# Execution Evidence: {topic}"));
    output.push(String::new());
    output.push(format!("**Plan Path:** {}", context.plan_rel));
    output.push(format!(
        "**Plan Revision:** {}",
        context.plan_document.plan_revision
    ));
    output.push(format!("**Plan Fingerprint:** {plan_fingerprint}"));
    output.push(format!(
        "**Source Spec Path:** {}",
        context.plan_document.source_spec_path
    ));
    output.push(format!(
        "**Source Spec Revision:** {}",
        context.plan_document.source_spec_revision
    ));
    output.push(format!(
        "**Source Spec Fingerprint:** {source_spec_fingerprint}"
    ));
    output.push(String::new());
    output.push(String::from("## Step Evidence"));

    for step in &context.steps {
        let attempts = context
            .evidence
            .attempts
            .iter()
            .filter(|attempt| {
                attempt.task_number == step.task_number && attempt.step_number == step.step_number
            })
            .collect::<Vec<_>>();
        if attempts.is_empty() {
            continue;
        }
        output.push(String::new());
        output.push(format!(
            "### Task {} Step {}",
            step.task_number, step.step_number
        ));
        for (index, attempt) in attempts.iter().enumerate() {
            if index > 0 {
                output.push(String::new());
            }
            output.push(format!("#### Attempt {}", attempt.attempt_number));
            output.push(format!("**Status:** {}", attempt.status));
            output.push(format!("**Recorded At:** {}", attempt.recorded_at));
            output.push(format!(
                "**Execution Source:** {}",
                attempt.execution_source
            ));
            output.push(format!("**Task Number:** {}", attempt.task_number));
            output.push(format!("**Step Number:** {}", attempt.step_number));
            output.push(format!(
                "**Packet Fingerprint:** {}",
                attempt
                    .packet_fingerprint
                    .clone()
                    .unwrap_or_else(|| String::from("unknown"))
            ));
            output.push(format!(
                "**Head SHA:** {}",
                attempt
                    .head_sha
                    .clone()
                    .unwrap_or_else(|| String::from("unknown"))
            ));
            if let Some(base_sha) = &attempt.base_sha {
                output.push(format!("**Base SHA:** {base_sha}"));
            }
            output.push(format!("**Claim:** {}", attempt.claim));
            if let Some(source_contract_path) = &attempt.source_contract_path {
                output.push(format!("**Source Contract Path:** {source_contract_path}"));
            }
            if let Some(source_contract_fingerprint) = &attempt.source_contract_fingerprint {
                output.push(format!(
                    "**Source Contract Fingerprint:** `{source_contract_fingerprint}`"
                ));
            }
            if let Some(source_evaluation_report_fingerprint) =
                &attempt.source_evaluation_report_fingerprint
            {
                output.push(format!(
                    "**Source Evaluation Report Fingerprint:** `{source_evaluation_report_fingerprint}`"
                ));
            }
            if let Some(evaluator_verdict) = &attempt.evaluator_verdict {
                output.push(format!("**Evaluator Verdict:** {evaluator_verdict}"));
            }
            if !attempt.failing_criterion_ids.is_empty() {
                output.push(String::from("**Failing Criterion IDs:**"));
                for criterion_id in &attempt.failing_criterion_ids {
                    output.push(format!("- `{criterion_id}`"));
                }
            }
            if let Some(source_handoff_fingerprint) = &attempt.source_handoff_fingerprint {
                output.push(format!(
                    "**Source Handoff Fingerprint:** `{source_handoff_fingerprint}`"
                ));
            }
            if let Some(repo_state_baseline_head_sha) = &attempt.repo_state_baseline_head_sha {
                output.push(format!(
                    "**Repo State Baseline Head SHA:** {repo_state_baseline_head_sha}"
                ));
            }
            if let Some(repo_state_baseline_worktree_fingerprint) =
                &attempt.repo_state_baseline_worktree_fingerprint
            {
                output.push(format!(
                    "**Repo State Baseline Worktree Fingerprint:** {repo_state_baseline_worktree_fingerprint}"
                ));
            }
            output.push(String::from("**Files Proven:**"));
            for proof in &attempt.file_proofs {
                output.push(format!("- {} | {}", proof.path, proof.proof));
            }
            output.push(format!(
                "**Verification Summary:** {}",
                attempt.verification_summary
            ));
            output.push(format!(
                "**Invalidation Reason:** {}",
                attempt.invalidation_reason
            ));
        }
    }

    format!("{}\n", output.join("\n"))
}

fn next_attempt_number(evidence: &ExecutionEvidence, task: u32, step: u32) -> u32 {
    evidence
        .attempts
        .iter()
        .filter(|attempt| attempt.task_number == task && attempt.step_number == step)
        .map(|attempt| attempt.attempt_number)
        .max()
        .unwrap_or(0)
        + 1
}

fn invalidate_latest_completed_attempt(
    context: &mut ExecutionContext,
    task: u32,
    step: u32,
    reason: &str,
) -> Result<(), JsonFailure> {
    let attempt_index =
        context
            .evidence
            .attempts
            .iter()
            .enumerate()
            .rev()
            .find_map(|(index, attempt)| {
                (attempt.task_number == task
                    && attempt.step_number == step
                    && attempt.status == "Completed")
                    .then_some(index)
            });
    let Some(attempt_index) = attempt_index else {
        return Ok(());
    };
    context.evidence.attempts[attempt_index].status = String::from("Invalidated");
    context.evidence.attempts[attempt_index].recorded_at = Timestamp::now().to_string();
    context.evidence.attempts[attempt_index].invalidation_reason = reason.to_owned();
    Ok(())
}

fn write_plan_and_evidence_with_rollback(
    plan_path: &Path,
    original_plan: &str,
    rendered_plan: &str,
    evidence_path: &Path,
    original_evidence: Option<&str>,
    rendered_evidence: &str,
    failpoint: &str,
) -> Result<(), JsonFailure> {
    write_atomic(plan_path, rendered_plan)?;
    if let Err(error) = maybe_trigger_failpoint(failpoint) {
        restore_plan_and_evidence(plan_path, original_plan, evidence_path, original_evidence);
        return Err(error);
    }
    if let Err(error) = write_atomic(evidence_path, rendered_evidence) {
        restore_plan_and_evidence(plan_path, original_plan, evidence_path, original_evidence);
        return Err(error);
    }
    Ok(())
}

fn persist_authoritative_state_with_rollback(
    authoritative_state: &AuthoritativeTransitionState,
    plan_path: &Path,
    original_plan: &str,
    evidence_path: &Path,
    original_evidence: Option<&str>,
    failpoint: &str,
) -> Result<(), JsonFailure> {
    if let Err(error) = authoritative_state.persist_if_dirty_with_failpoint(Some(failpoint)) {
        restore_plan_and_evidence(plan_path, original_plan, evidence_path, original_evidence);
        return Err(error);
    }
    Ok(())
}

fn restore_plan_and_evidence(
    plan_path: &Path,
    original_plan: &str,
    evidence_path: &Path,
    original_evidence: Option<&str>,
) {
    let _ = fs::write(plan_path, original_plan);
    match original_evidence {
        Some(source) => {
            let _ = fs::write(evidence_path, source);
        }
        None => {
            let _ = fs::remove_file(evidence_path);
        }
    }
}

fn maybe_trigger_failpoint(name: &str) -> Result<(), JsonFailure> {
    if std::env::var("FEATUREFORGE_PLAN_EXECUTION_TEST_FAILPOINT")
        .ok()
        .as_deref()
        == Some(name)
    {
        return Err(JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!("Injected plan execution failpoint: {name}"),
        ));
    }
    Ok(())
}

fn write_atomic(path: &Path, contents: &str) -> Result<(), JsonFailure> {
    write_atomic_file(path, contents).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!("Could not persist {}: {error}", path.display()),
        )
    })
}

fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    format!("{digest:x}")
}
