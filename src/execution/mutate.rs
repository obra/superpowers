use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread::sleep;
use std::time::Duration;
use std::time::Instant;

use jiff::Timestamp;
use sha2::{Digest, Sha256};

use crate::cli::plan_execution::{
    BeginArgs, CompleteArgs, ExecutionModeArg, NoteArgs, RebuildEvidenceArgs, ReopenArgs,
    TransferArgs,
};
use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::authority::{
    ensure_preflight_authoritative_bootstrap, write_authoritative_unit_review_receipt_artifact,
};
use crate::execution::final_review::{
    FinalReviewReceiptExpectations, authoritative_strategy_checkpoint_fingerprint_checked,
    latest_branch_artifact_path, parse_artifact_document, parse_final_review_receipt,
    resolve_release_base_branch, validate_final_review_receipt,
};
use crate::execution::harness::RunIdentitySnapshot;
use crate::execution::state::{
    EvidenceAttempt, ExecutionContext, ExecutionEvidence, ExecutionRuntime, FileProof,
    NO_REPO_FILES_MARKER, PacketFingerprintInput, PlanExecutionStatus, PlanStepState,
    RebuildEvidenceCounts, RebuildEvidenceFilter, RebuildEvidenceOutput,
    RebuildEvidenceTarget, RebuildEvidenceCandidate, compute_packet_fingerprint,
    current_file_proof, current_head_sha, discover_rebuild_candidates, hash_contract_plan,
    load_execution_context, load_execution_context_for_mutation, normalize_begin_request,
    normalize_complete_request, normalize_note_request, normalize_rebuild_evidence_request,
    normalize_reopen_request, normalize_source, normalize_transfer_request,
    require_normalized_text, require_preflight_acceptance, require_prior_task_closure_for_begin,
    status_from_context, validate_expected_fingerprint,
};
use crate::execution::topology::persist_preflight_acceptance;
use crate::execution::transitions::{
    AuthoritativeTransitionState, StepCommand, claim_step_write_authority,
    enforce_active_contract_scope, enforce_authoritative_phase,
    load_authoritative_transition_state,
};
use crate::paths::{
    harness_authoritative_artifact_path, normalize_repo_relative_path, normalize_whitespace,
    write_atomic as write_atomic_file,
};

pub fn begin(
    runtime: &ExecutionRuntime,
    args: &BeginArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_begin_request(args);
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context_for_mutation(runtime, &args.plan)?;
    validate_expected_fingerprint(&context, &request.expect_execution_fingerprint)?;
    require_preflight_acceptance(&context)?;
    let mut authoritative_state = load_authoritative_transition_state(&context)?;
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
    let interrupted_step = context
        .steps
        .iter()
        .find(|step| step.note_state == Some(crate::execution::state::NoteState::Interrupted));
    let resuming_interrupted_same_step = interrupted_step.is_some_and(|interrupted| {
        interrupted.task_number == request.task && interrupted.step_number == request.step
    });
    if interrupted_step.is_some() && !resuming_interrupted_same_step {
        return Err(JsonFailure::new(
            FailureClass::InvalidStepTransition,
            "Interrupted work must resume on the same step.",
        ));
    }

    require_prior_task_closure_for_begin(&context, request.task)?;

    context.steps[step_index].note_state = Some(crate::execution::state::NoteState::Active);
    context.steps[step_index].note_summary = truncate_summary(&require_normalized_text(
        &context.steps[step_index].title,
        FailureClass::InvalidCommandInput,
        "Execution note summaries may not be blank after whitespace normalization.",
    )?);
    if let Some(authoritative_state) = authoritative_state.as_mut() {
        authoritative_state.ensure_initial_dispatch_strategy_checkpoint(
            &context,
            &context.plan_document.execution_mode,
        )?;
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
            "begin_after_plan_write_before_authoritative_state_publish",
        )?;
    }
    let reloaded = load_execution_context_for_mutation(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn complete(
    runtime: &ExecutionRuntime,
    args: &CompleteArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_complete_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context_for_mutation(runtime, &args.plan)?;
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
    let packet_fingerprint = compute_packet_fingerprint(PacketFingerprintInput {
        plan_path: &context.plan_rel,
        plan_revision: context.plan_document.plan_revision,
        plan_fingerprint: &contract_plan_fingerprint,
        source_spec_path: &context.plan_document.source_spec_path,
        source_spec_revision: context.plan_document.source_spec_revision,
        source_spec_fingerprint: &source_spec_fingerprint,
        task: request.task,
        step: request.step,
    });
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
        verify_command: request.verify_command,
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
    let reloaded = load_execution_context_for_mutation(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn note(
    runtime: &ExecutionRuntime,
    args: &NoteArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_note_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context_for_mutation(runtime, &args.plan)?;
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
    let reloaded = load_execution_context_for_mutation(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn reopen(
    runtime: &ExecutionRuntime,
    args: &ReopenArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_reopen_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context_for_mutation(runtime, &args.plan)?;
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
        authoritative_state.record_reopen_strategy_checkpoint(
            &context,
            &context.plan_document.execution_mode,
            request.task,
            request.step,
            &request.reason,
        )?;
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

    let reloaded = load_execution_context_for_mutation(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn transfer(
    runtime: &ExecutionRuntime,
    args: &TransferArgs,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let request = normalize_transfer_request(args)?;
    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context_for_mutation(runtime, &args.plan)?;
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

    let reloaded = load_execution_context_for_mutation(runtime, &args.plan)?;
    status_from_context(&reloaded)
}

pub fn rebuild_evidence(
    runtime: &ExecutionRuntime,
    args: &RebuildEvidenceArgs,
) -> Result<RebuildEvidenceOutput, JsonFailure> {
    let request = normalize_rebuild_evidence_request(args)?;
    if request.max_jobs > 1 {
        return Err(JsonFailure::new(
            FailureClass::InvalidCommandInput,
            "max_jobs_parallel_unsupported: rebuild-evidence currently supports only --max-jobs 1.",
        ));
    }
    let started_at = Instant::now();
    let context = load_execution_context(runtime, &request.plan)?;
    if !context.evidence_abs.is_file() {
        return Err(JsonFailure::new(
            FailureClass::InvalidCommandInput,
            "session_not_found: no execution evidence session exists for the approved plan revision.",
        ));
    }
    let matched_scope_ids = matched_rebuild_scope_ids(&context, &request);
    let candidates = discover_rebuild_candidates(&context, &request)?;
    if (!request.tasks.is_empty() || !request.steps.is_empty()) && candidates.is_empty() {
        return Err(JsonFailure::new(
            FailureClass::InvalidCommandInput,
            format!(
                "scope_empty: requested scope matched approved plan steps [{}] but none currently require rebuild.",
                matched_scope_ids.join(", ")
            ),
        ));
    }
    let filter = RebuildEvidenceFilter {
        all: request.all,
        tasks: request.tasks.clone(),
        steps: request.raw_steps.clone(),
        include_open: request.include_open,
        skip_manual_fallback: request.skip_manual_fallback,
        continue_on_error: request.continue_on_error,
        max_jobs: request.max_jobs,
        no_output: request.no_output,
        json: request.json,
    };
    let scope = rebuild_scope_label(&request);

    if request.dry_run {
        let targets = candidates
            .iter()
            .map(planned_rebuild_target)
            .collect::<Vec<_>>();
        return Ok(RebuildEvidenceOutput {
            session_root: context.runtime.repo_root.to_string_lossy().into_owned(),
            dry_run: true,
            filter,
            scope,
            counts: RebuildEvidenceCounts {
                planned: targets.len() as u32,
                rebuilt: 0,
                manual: 0,
                failed: 0,
                noop: u32::from(targets.is_empty()),
            },
            duration_ms: started_at.elapsed().as_millis() as u64,
            targets,
            exit_code: 0,
        });
    }

    if candidates.is_empty() {
        ensure_rebuild_preflight_acceptance(&context)?;
        let refreshed_status = status_from_context(&load_execution_context(runtime, &args.plan)?)?;
        refresh_rebuild_all_task_closure_receipts_if_available(
            runtime,
            &args.plan,
            &refreshed_status,
        )?;
        refresh_rebuild_downstream_truth(runtime, &args.plan)?;
        return Ok(RebuildEvidenceOutput {
            session_root: context.runtime.repo_root.to_string_lossy().into_owned(),
            dry_run: false,
            filter,
            scope,
            counts: RebuildEvidenceCounts {
                planned: 0,
                rebuilt: 0,
                manual: 0,
                failed: 0,
                noop: 1,
            },
            duration_ms: started_at.elapsed().as_millis() as u64,
            targets: Vec::new(),
            exit_code: 0,
        });
    }

    let execution_mode = match context.plan_document.execution_mode.as_str() {
        "featureforge:executing-plans" => ExecutionModeArg::ExecutingPlans,
        "featureforge:subagent-driven-development" => {
            ExecutionModeArg::SubagentDrivenDevelopment
        }
        _ => {
            return Err(JsonFailure::new(
                FailureClass::ExecutionStateNotReady,
                "rebuild-evidence requires an approved plan revision with an execution mode.",
            ));
        }
    };

    ensure_rebuild_preflight_acceptance(&context)?;

    let mut status = status_from_context(&context)?;
    let mut targets = Vec::with_capacity(candidates.len());
    let mut counts = RebuildEvidenceCounts {
        planned: candidates.len() as u32,
        rebuilt: 0,
        manual: 0,
        failed: 0,
        noop: 0,
    };
    let candidate_batch_is_manual_only = request.skip_manual_fallback
        && !candidates.is_empty()
        && candidates.iter().all(|candidate| candidate.verify_command.is_none());
    let mut saw_strict_manual_failure = false;
    let mut saw_precondition_failure = false;
    let mut saw_non_precondition_failure = false;

    for (index, candidate) in candidates.iter().enumerate() {
        let (next_status, target) = execute_rebuild_candidate(
            runtime,
            &request,
            &args.plan,
            execution_mode,
            status,
            candidate,
            index + 1 == candidates.len(),
        )?;
        status = next_status;
        match target.status.as_str() {
            "rebuilt" => counts.rebuilt += 1,
            "manual_required" => counts.manual += 1,
            "failed" => {
                counts.failed += 1;
                match target.failure_class.as_deref() {
                    Some("manual_required") => {
                        saw_strict_manual_failure = true;
                    }
                    Some(failure_class) if is_rebuild_precondition_failure(failure_class) => {
                        saw_precondition_failure = true;
                    }
                    _ => {
                        saw_non_precondition_failure = true;
                    }
                }
            }
            _ => {}
        }
        let should_stop = target.status == "failed"
            && target.failure_class.as_deref() != Some("artifact_read_error")
            && !request.continue_on_error;
        targets.push(target);
        if should_stop {
            break;
        }
    }

    let strict_manual_only = candidate_batch_is_manual_only
        && saw_strict_manual_failure
        && !saw_precondition_failure
        && !saw_non_precondition_failure;
    let manual_repairs_still_pending = counts.manual > 0;
    let exit_code = if strict_manual_only {
        3
    } else if saw_non_precondition_failure || saw_strict_manual_failure {
        2
    } else if saw_precondition_failure {
        1
    } else {
        if !manual_repairs_still_pending {
            refresh_rebuild_downstream_truth(runtime, &args.plan)?;
        }
        0
    };

    Ok(RebuildEvidenceOutput {
        session_root: context.runtime.repo_root.to_string_lossy().into_owned(),
        dry_run: false,
        filter,
        scope,
        counts,
        duration_ms: started_at.elapsed().as_millis() as u64,
        targets,
        exit_code,
    })
}

fn ensure_rebuild_preflight_acceptance(context: &ExecutionContext) -> Result<(), JsonFailure> {
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

fn is_rebuild_precondition_failure(failure_class: &str) -> bool {
    matches!(
        failure_class,
        "artifact_read_error" | "state_transition_blocked" | "target_race"
    )
}

struct RebuildCandidateExecutionState {
    status: PlanExecutionStatus,
    target: RebuildEvidenceTarget,
    expected_attempt_number: Option<u32>,
    expected_artifact_epoch: Option<String>,
}

fn execute_rebuild_candidate(
    runtime: &ExecutionRuntime,
    request: &crate::execution::state::RebuildEvidenceRequest,
    plan: &Path,
    execution_mode: ExecutionModeArg,
    mut status: PlanExecutionStatus,
    candidate: &RebuildEvidenceCandidate,
    allow_manual_open_step: bool,
) -> Result<(PlanExecutionStatus, RebuildEvidenceTarget), JsonFailure> {
    let mut current_candidate = candidate.clone();
    let mut expected_attempt_number = current_candidate.attempt_number;
    let mut expected_artifact_epoch = current_candidate.artifact_epoch.clone();
    let attempt_id_before = current_candidate
        .attempt_number
        .map(|attempt| format!("{}:{}:{}", current_candidate.task, current_candidate.step, attempt));
    let mut target = RebuildEvidenceTarget {
        task_id: current_candidate.task,
        step_id: current_candidate.step,
        target_kind: current_candidate.target_kind.clone(),
        pre_invalidation_reason: current_candidate.pre_invalidation_reason.clone(),
        status: String::from("planned"),
        verify_mode: current_candidate.verify_mode.clone(),
        verify_command: current_candidate.verify_command.clone(),
        attempt_id_before,
        attempt_id_after: None,
        verification_hash: None,
        error: None,
        failure_class: None,
    };

    if current_candidate.target_kind == "artifact_read_error" {
        target.status = String::from("failed");
        target.failure_class = Some(String::from("artifact_read_error"));
        target.error = Some(current_candidate.pre_invalidation_reason.clone());
        return Ok((status, target));
    }

    for replay_attempt in 0..=1 {
        if candidate_row_changed(
            runtime,
            plan,
            current_candidate.task,
            current_candidate.step,
            expected_attempt_number,
            expected_artifact_epoch.as_deref(),
        )? {
            if replay_attempt == 0 {
                sleep(Duration::from_millis(10));
                status = refresh_rebuild_status(runtime, plan)?;
                if let Some(refreshed_candidate) = refresh_rebuild_candidate(
                    runtime,
                    request,
                    plan,
                    current_candidate.task,
                    current_candidate.step,
                )? {
                    current_candidate = refreshed_candidate;
                    expected_attempt_number = current_candidate.attempt_number;
                    expected_artifact_epoch = current_candidate.artifact_epoch.clone();
                    target = planned_rebuild_target(&current_candidate);
                }
                continue;
            }
            target.status = String::from("failed");
            target.failure_class = Some(String::from("target_race"));
            target.error = Some(String::from(
                "target_race: the selected target changed during replay; rerun with --max-jobs 1.",
            ));
            return Ok((status, target));
        }

        let result = execute_rebuild_candidate_once(
            runtime,
            request,
            plan,
            execution_mode,
            &current_candidate,
            allow_manual_open_step,
            RebuildCandidateExecutionState {
                status,
                target,
                expected_attempt_number,
                expected_artifact_epoch: expected_artifact_epoch.clone(),
            },
        )?;
        match result.target.failure_class.as_deref() {
            Some("state_transition_blocked" | "target_race") if replay_attempt == 0 => {
                sleep(Duration::from_millis(10));
                status = refresh_rebuild_status(runtime, plan)?;
                if let Some(refreshed_candidate) = refresh_rebuild_candidate(
                    runtime,
                    request,
                    plan,
                    current_candidate.task,
                    current_candidate.step,
                )? {
                    current_candidate = refreshed_candidate;
                    expected_attempt_number = current_candidate.attempt_number;
                    expected_artifact_epoch = current_candidate.artifact_epoch.clone();
                    target = planned_rebuild_target(&current_candidate);
                } else {
                    target = result.target;
                    expected_attempt_number = result.expected_attempt_number;
                    expected_artifact_epoch = result.expected_artifact_epoch;
                }
                continue;
            }
            _ => return Ok((result.status, result.target)),
        }
    }

    Ok((status, target))
}

fn execute_rebuild_candidate_once(
    runtime: &ExecutionRuntime,
    request: &crate::execution::state::RebuildEvidenceRequest,
    plan: &Path,
    execution_mode: ExecutionModeArg,
    candidate: &RebuildEvidenceCandidate,
    allow_manual_open_step: bool,
    replay_state: RebuildCandidateExecutionState,
) -> Result<RebuildCandidateExecutionState, JsonFailure> {
    let RebuildCandidateExecutionState {
        mut status,
        mut target,
        mut expected_attempt_number,
        mut expected_artifact_epoch,
    } = replay_state;
    let verify_command = candidate.verify_command.clone();
    if verify_command.is_none() && !request.skip_manual_fallback && !allow_manual_open_step {
        target.status = String::from("manual_required");
        target.failure_class = Some(String::from("manual_required"));
        target.error = Some(String::from(
            "No stored verify command is available for this target.",
        ));
        return Ok(RebuildCandidateExecutionState {
            status,
            target,
            expected_attempt_number,
            expected_artifact_epoch,
        });
    }

    if candidate.needs_reopen {
        status = clear_superseded_interrupted_rebuild_step(
            runtime,
            request,
            plan,
            status,
            candidate,
        )?;
        let reopened = reopen(
            runtime,
            &ReopenArgs {
                plan: plan.to_path_buf(),
                task: candidate.task,
                step: candidate.step,
                source: execution_mode,
                reason: format!(
                    "Evidence rebuild: {}",
                    candidate.pre_invalidation_reason
                ),
                expect_execution_fingerprint: status.execution_fingerprint.clone(),
            },
        );
        match reopened {
            Ok(next_status) => {
                status = next_status;
                let current_identity = current_attempt_identity(runtime, plan, candidate.task, candidate.step)?;
                expected_attempt_number = current_identity.as_ref().map(|(attempt, _)| *attempt);
                expected_artifact_epoch = current_identity.map(|(_, recorded_at)| recorded_at);
            }
            Err(error) => {
                target.status = String::from("failed");
                target.failure_class = Some(String::from("state_transition_blocked"));
                target.error = Some(error.message.clone());
                return Ok(RebuildCandidateExecutionState {
                    status,
                    target,
                    expected_attempt_number,
                    expected_artifact_epoch,
                });
            }
        }
    }

    let Some(verify_command) = verify_command else {
        if request.skip_manual_fallback {
            target.status = String::from("failed");
            target.failure_class = Some(String::from("manual_required"));
            target.error = Some(String::from(
                "manual_required: no stored verify command is available for this target.",
            ));
        } else {
            target.status = String::from("manual_required");
            target.failure_class = Some(String::from("manual_required"));
            target.error = Some(String::from(
                "No stored verify command is available for this target.",
            ));
        }
        return Ok(RebuildCandidateExecutionState {
            status,
            target,
            expected_attempt_number,
            expected_artifact_epoch,
        });
    };

    let command_output = verify_command_process(&runtime.repo_root, &verify_command).output();
    let command_output = match command_output {
        Ok(output) => output,
        Err(error) => {
            target.status = String::from("failed");
            target.failure_class = Some(String::from("verify_command_failed"));
            target.error = Some(format!("Could not execute verify command: {error}"));
            return Ok(RebuildCandidateExecutionState {
                status,
                target,
                expected_attempt_number,
                expected_artifact_epoch,
            });
        }
    };
    let verify_result = summarize_verify_result(&command_output, request.no_output);
    target.verification_hash = Some(crate::git::sha256_hex(verify_result.as_bytes()));
    if !command_output.status.success() {
        target.status = String::from("failed");
        target.failure_class = Some(String::from("verify_command_failed"));
        target.error = Some(verify_result);
        return Ok(RebuildCandidateExecutionState {
            status,
            target,
            expected_attempt_number,
            expected_artifact_epoch,
        });
    }
    if candidate_row_changed(
        runtime,
        plan,
        candidate.task,
        candidate.step,
        expected_attempt_number,
        expected_artifact_epoch.as_deref(),
    )? {
        target.status = String::from("failed");
        target.failure_class = Some(String::from("target_race"));
        target.error = Some(String::from(
            "target_race: the selected target changed during replay; rerun with --max-jobs 1.",
        ));
        return Ok(RebuildCandidateExecutionState {
            status,
            target,
            expected_attempt_number,
            expected_artifact_epoch,
        });
    }

    if status.active_task != Some(candidate.task) || status.active_step != Some(candidate.step) {
        let begin_result = begin(
            runtime,
            &BeginArgs {
                plan: plan.to_path_buf(),
                task: candidate.task,
                step: candidate.step,
                execution_mode: None,
                expect_execution_fingerprint: status.execution_fingerprint.clone(),
            },
        );
        match begin_result {
            Ok(next_status) => status = next_status,
            Err(error) => {
                if candidate.task > 1 && is_rebuild_task_boundary_receipt_failure(&error.message) {
                    let refreshed_status = refresh_rebuild_status(runtime, plan)?;
                    match refresh_rebuild_task_closure_receipts(
                        runtime,
                        plan,
                        &refreshed_status,
                        candidate.task - 1,
                    ) {
                        Ok(()) => {
                            let retried_status = refresh_rebuild_status(runtime, plan)?;
                            let retry_begin = begin(
                                runtime,
                                &BeginArgs {
                                    plan: plan.to_path_buf(),
                                    task: candidate.task,
                                    step: candidate.step,
                                    execution_mode: None,
                                    expect_execution_fingerprint: retried_status
                                        .execution_fingerprint
                                        .clone(),
                                },
                            );
                            match retry_begin {
                                Ok(next_status) => status = next_status,
                                Err(error) => {
                                    target.status = String::from("failed");
                                    target.failure_class = Some(String::from("state_transition_blocked"));
                                    target.error = Some(error.message.clone());
                                    return Ok(RebuildCandidateExecutionState {
                                        status,
                                        target,
                                        expected_attempt_number,
                                        expected_artifact_epoch,
                                    });
                                }
                            }
                        }
                        Err(refresh_error) => {
                            target.status = String::from("failed");
                            target.failure_class = Some(String::from("state_transition_blocked"));
                            target.error = Some(refresh_error.message.clone());
                            return Ok(RebuildCandidateExecutionState {
                                status,
                                target,
                                expected_attempt_number,
                                expected_artifact_epoch,
                            });
                        }
                    }
                } else {
                    target.status = String::from("failed");
                    target.failure_class = Some(String::from("state_transition_blocked"));
                    target.error = Some(error.message.clone());
                    return Ok(RebuildCandidateExecutionState {
                        status,
                        target,
                        expected_attempt_number,
                        expected_artifact_epoch,
                    });
                }
            }
        }
    }

    let completed = complete(
        runtime,
        &CompleteArgs {
            plan: plan.to_path_buf(),
            task: candidate.task,
            step: candidate.step,
            source: execution_mode,
            claim: candidate.claim.clone(),
            files: candidate.files.clone(),
            verify_command: Some(verify_command),
            verify_result: Some(verify_result.clone()),
            manual_verify_summary: None,
            expect_execution_fingerprint: status.execution_fingerprint.clone(),
        },
    );
    match completed {
        Ok(next_status) => {
            let refreshed_status = match refresh_rebuild_closure_receipts(
                runtime,
                plan,
                &next_status,
                candidate.task,
                candidate.step,
            ) {
                Ok(()) => next_status,
                Err(error) => {
                    target.status = String::from("failed");
                    target.failure_class = Some(String::from("state_transition_blocked"));
                    target.error = Some(error.message.clone());
                    return Ok(RebuildCandidateExecutionState {
                        status,
                        target,
                        expected_attempt_number,
                        expected_artifact_epoch,
                    });
                }
            };
            target.status = String::from("rebuilt");
            target.error = None;
            target.failure_class = None;
            target.attempt_id_after = Some(format!(
                "{}:{}:{}",
                candidate.task,
                candidate.step,
                candidate.attempt_number.unwrap_or(0) + 1
            ));
            Ok(RebuildCandidateExecutionState {
                status: refreshed_status,
                target,
                expected_attempt_number,
                expected_artifact_epoch,
            })
        }
        Err(error) => {
            target.status = String::from("failed");
            target.failure_class = Some(String::from("state_transition_blocked"));
            target.error = Some(error.message.clone());
            Ok(RebuildCandidateExecutionState {
                status,
                target,
                expected_attempt_number,
                expected_artifact_epoch,
            })
        }
    }
}

fn clear_superseded_interrupted_rebuild_step(
    runtime: &ExecutionRuntime,
    request: &crate::execution::state::RebuildEvidenceRequest,
    plan: &Path,
    status: PlanExecutionStatus,
    candidate: &RebuildEvidenceCandidate,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let Some((resume_task, resume_step)) = status
        .resume_task
        .zip(status.resume_step)
    else {
        return Ok(status);
    };
    if (resume_task, resume_step) == (candidate.task, candidate.step) {
        return Ok(status);
    }

    let context = load_execution_context(runtime, plan)?;
    let interrupted_is_targeted = discover_rebuild_candidates(&context, request)?
        .iter()
        .any(|target| target.task == resume_task && target.step == resume_step);
    if !interrupted_is_targeted {
        return Ok(status);
    }

    let _write_authority = claim_step_write_authority(runtime)?;
    let mut context = load_execution_context_for_mutation(runtime, plan)?;
    let Some(interrupted_index) = context.steps.iter().position(|step| {
        step.task_number == resume_task
            && step.step_number == resume_step
            && step.note_state == Some(crate::execution::state::NoteState::Interrupted)
    }) else {
        return Ok(status);
    };

    context.steps[interrupted_index].note_state = None;
    context.steps[interrupted_index].note_summary.clear();

    let rendered_plan = render_plan_source(
        &context.plan_source,
        &context.plan_document.execution_mode,
        &context.steps,
    );
    write_atomic(&context.plan_abs, &rendered_plan)?;

    let reloaded = load_execution_context_for_mutation(runtime, plan)?;
    status_from_context(&reloaded)
}

fn refresh_rebuild_status(
    runtime: &ExecutionRuntime,
    plan: &Path,
) -> Result<PlanExecutionStatus, JsonFailure> {
    let context = load_execution_context(runtime, plan)?;
    status_from_context(&context)
}

fn refresh_rebuild_candidate(
    runtime: &ExecutionRuntime,
    request: &crate::execution::state::RebuildEvidenceRequest,
    plan: &Path,
    task: u32,
    step: u32,
) -> Result<Option<RebuildEvidenceCandidate>, JsonFailure> {
    let context = load_execution_context(runtime, plan)?;
    let candidates = discover_rebuild_candidates(&context, request)?;
    Ok(candidates
        .into_iter()
        .find(|candidate| candidate.task == task && candidate.step == step))
}

fn candidate_row_changed(
    runtime: &ExecutionRuntime,
    plan: &Path,
    task: u32,
    step: u32,
    expected_attempt_number: Option<u32>,
    expected_artifact_epoch: Option<&str>,
) -> Result<bool, JsonFailure> {
    if expected_attempt_number.is_none() && expected_artifact_epoch.is_none() {
        return Ok(false);
    }

    let current_identity = current_attempt_identity(runtime, plan, task, step)?;
    let Some((current_attempt_number, current_recorded_at)) = current_identity else {
        return Ok(true);
    };

    Ok(expected_attempt_number != Some(current_attempt_number)
        || expected_artifact_epoch != Some(current_recorded_at.as_str()))
}

fn current_attempt_identity(
    runtime: &ExecutionRuntime,
    plan: &Path,
    task: u32,
    step: u32,
) -> Result<Option<(u32, String)>, JsonFailure> {
    let context = load_execution_context(runtime, plan)?;
    let latest_attempt = context
        .evidence
        .attempts
        .iter()
        .rev()
        .find(|attempt| {
            attempt.task_number == task && attempt.step_number == step
        });

    let Some(latest_attempt) = latest_attempt else {
        return Ok(None);
    };

    Ok(Some((
        latest_attempt.attempt_number,
        latest_attempt.recorded_at.clone(),
    )))
}

fn refresh_rebuild_closure_receipts(
    runtime: &ExecutionRuntime,
    plan: &Path,
    status: &PlanExecutionStatus,
    task: u32,
    _step: u32,
) -> Result<(), JsonFailure> {
    let Some(execution_run_id) = status.execution_run_id.as_ref().map(|value| value.as_str()) else {
        return Ok(());
    };
    let context = load_execution_context(runtime, plan)?;
    let strategy_checkpoint = authoritative_strategy_checkpoint_fingerprint_checked(&context)?;
    let Some(strategy_checkpoint_fingerprint) = strategy_checkpoint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(());
    };
    let active_contract_fingerprint = load_authoritative_transition_state(&context)?
        .as_ref()
        .and_then(|authority| authority.evidence_provenance().source_contract_fingerprint);
    let checked_tasks = context
        .steps
        .iter()
        .filter(|step_state| step_state.checked)
        .map(|step_state| step_state.task_number)
        .collect::<BTreeSet<_>>();
    for checked_task in checked_tasks {
        refresh_rebuild_task_closure_receipts_with_context(
            runtime,
            &context,
            execution_run_id,
            strategy_checkpoint_fingerprint,
            active_contract_fingerprint.as_deref(),
            checked_task,
            checked_task == task,
        )?;
    }
    Ok(())
}

fn refresh_rebuild_task_closure_receipts(
    runtime: &ExecutionRuntime,
    plan: &Path,
    status: &PlanExecutionStatus,
    task: u32,
) -> Result<(), JsonFailure> {
    let Some(execution_run_id) = status.execution_run_id.as_ref().map(|value| value.as_str()) else {
        return Ok(());
    };
    let context = load_execution_context(runtime, plan)?;
    let strategy_checkpoint = authoritative_strategy_checkpoint_fingerprint_checked(&context)?;
    let Some(strategy_checkpoint_fingerprint) = strategy_checkpoint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(());
    };
    let active_contract_fingerprint = load_authoritative_transition_state(&context)?
        .as_ref()
        .and_then(|authority| authority.evidence_provenance().source_contract_fingerprint);
    refresh_rebuild_task_closure_receipts_with_context(
        runtime,
        &context,
        execution_run_id,
        strategy_checkpoint_fingerprint,
        active_contract_fingerprint.as_deref(),
        task,
        true,
    )
}

fn refresh_rebuild_all_task_closure_receipts(
    runtime: &ExecutionRuntime,
    plan: &Path,
    status: &PlanExecutionStatus,
) -> Result<(), JsonFailure> {
    let Some(execution_run_id) = status.execution_run_id.as_ref().map(|value| value.as_str()) else {
        return Ok(());
    };
    let context = load_execution_context(runtime, plan)?;
    let strategy_checkpoint = authoritative_strategy_checkpoint_fingerprint_checked(&context)?;
    let Some(strategy_checkpoint_fingerprint) = strategy_checkpoint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(());
    };
    let active_contract_fingerprint = load_authoritative_transition_state(&context)?
        .as_ref()
        .and_then(|authority| authority.evidence_provenance().source_contract_fingerprint);
    let checked_tasks = context
        .steps
        .iter()
        .filter(|step_state| step_state.checked)
        .map(|step_state| step_state.task_number)
        .collect::<BTreeSet<_>>();
    for task in checked_tasks {
        refresh_rebuild_task_closure_receipts_with_context(
            runtime,
            &context,
            execution_run_id,
            strategy_checkpoint_fingerprint,
            active_contract_fingerprint.as_deref(),
            task,
            false,
        )?;
    }
    Ok(())
}

fn refresh_rebuild_all_task_closure_receipts_if_available(
    runtime: &ExecutionRuntime,
    plan: &Path,
    status: &PlanExecutionStatus,
) -> Result<(), JsonFailure> {
    match refresh_rebuild_all_task_closure_receipts(runtime, plan, status) {
        Ok(()) => Ok(()),
        Err(error)
            if error.error_class == "MalformedExecutionState"
                && error
                    .message
                    .contains("last_strategy_checkpoint_fingerprint") =>
        {
            Ok(())
        }
        Err(error) => Err(error),
    }
}

fn refresh_rebuild_downstream_truth(
    runtime: &ExecutionRuntime,
    plan: &Path,
) -> Result<(), JsonFailure> {
    let context = load_execution_context(runtime, plan)?;
    let branch = &context.runtime.branch_name;
    let current_head = current_head_sha(&context.runtime.repo_root).unwrap_or_default();
    let artifact_dir = context
        .runtime
        .state_dir
        .join("projects")
        .join(&context.runtime.repo_slug);
    let final_review_candidate = latest_branch_artifact_path(&artifact_dir, branch, "code-review");
    let test_plan_candidate = latest_branch_artifact_path(&artifact_dir, branch, "test-plan");
    let release_candidate =
        latest_branch_artifact_path(&artifact_dir, branch, "release-readiness");
    if final_review_candidate.is_none() && release_candidate.is_none() {
        return Ok(());
    }
    let Some(base_branch) = resolve_release_base_branch(&context.runtime.git_dir, branch) else {
        return Err(rebuild_downstream_truth_stale(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but the release base branch could not be resolved for downstream artifact validation.",
        ));
    };

    let Some(final_review_path) = final_review_candidate else {
        return Err(rebuild_downstream_truth_stale(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but the current branch is missing a final review artifact to rebind authoritative downstream truth.",
        ));
    };
    let initial_review = parse_artifact_document(&final_review_path);
    if initial_review.title.as_deref() != Some("# Code Review Result") {
        return Err(rebuild_downstream_truth_stale(format!(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but final review artifact {} is malformed.",
            final_review_path.display()
        )));
    }
    let initial_review_receipt = parse_final_review_receipt(&final_review_path);

    let Some(reviewer_artifact_path) = resolve_rebuild_reviewer_artifact_path(
        &final_review_path,
        initial_review_receipt.reviewer_artifact_path.as_deref(),
    ) else {
        return Err(rebuild_downstream_truth_stale(format!(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but final review artifact {} is missing a dedicated reviewer artifact binding.",
            final_review_path.display()
        )));
    };

    let Some(test_plan_path) = test_plan_candidate else {
        return Err(rebuild_downstream_truth_stale(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but the current branch is missing a test-plan artifact to rebind downstream truth.",
        ));
    };
    let initial_test_plan = parse_artifact_document(&test_plan_path);
    if initial_test_plan.title.as_deref() != Some("# Test Plan") {
        return Err(rebuild_downstream_truth_stale(format!(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but test-plan artifact {} is malformed.",
            test_plan_path.display()
        )));
    }

    let browser_qa_required = initial_test_plan
        .headers
        .get("Browser QA Required")
        .is_some_and(|value| value == "yes");

    let initial_qa_path = if browser_qa_required {
        let qa_path = latest_branch_artifact_path(&artifact_dir, branch, "test-outcome");
        if let Some(qa_path) = qa_path {
            let initial_qa = parse_artifact_document(&qa_path);
            if initial_qa.title.as_deref() != Some("# QA Result") {
                return Err(rebuild_downstream_truth_stale(format!(
                    "post_rebuild_late_gate_truth_stale: rebuild completed, but QA artifact {} is malformed.",
                    qa_path.display()
                )));
            }
            Some(qa_path)
        } else {
            None
        }
    } else {
        None
    };

    let initial_release_path = if let Some(release_path) = release_candidate {
        let initial_release = parse_artifact_document(&release_path);
        if initial_release.title.as_deref() != Some("# Release Readiness Result") {
            return Err(rebuild_downstream_truth_stale(format!(
                "post_rebuild_late_gate_truth_stale: rebuild completed, but release-readiness artifact {} is malformed.",
                release_path.display()
            )));
        }
        Some(release_path)
    } else {
        None
    };

    let Some(strategy_checkpoint_fingerprint) = authoritative_strategy_checkpoint_fingerprint_checked(&context)? else {
        return Ok(());
    };
    rewrite_branch_final_review_artifacts(
        &final_review_path,
        &reviewer_artifact_path,
        &current_head,
        &strategy_checkpoint_fingerprint,
    )?;
    rewrite_branch_head_bound_artifact(&test_plan_path, &current_head)?;
    if let Some(qa_path) = initial_qa_path.as_ref() {
        rewrite_branch_qa_artifact(qa_path, &current_head, &test_plan_path)?;
    }
    if let Some(release_path) = initial_release_path.as_ref() {
        rewrite_branch_head_bound_artifact(release_path, &current_head)?;
    }

    let review = parse_artifact_document(&final_review_path);
    if review.headers.get("Branch") != Some(branch)
        || review.headers.get("Repo") != Some(&context.runtime.repo_slug)
        || review.headers.get("Base Branch") != Some(&base_branch)
        || review.headers.get("Head SHA") != Some(&current_head)
        || review.headers.get("Result") != Some(&String::from("pass"))
        || review.headers.get("Generated By")
            != Some(&String::from("featureforge:requesting-code-review"))
    {
        return Err(rebuild_downstream_truth_stale(format!(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but final review artifact {} does not match the current branch, repo, base branch, or HEAD.",
            final_review_path.display()
        )));
    }
    let review_source = fs::read_to_string(&final_review_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not read rebuild final-review artifact {}: {error}",
                final_review_path.display()
            ),
        )
    })?;
    let authoritative_review_fingerprint = sha256_hex(review_source.as_bytes());
    let authoritative_review_path = publish_authoritative_rebuild_artifact(
        runtime,
        &format!("final-review-{authoritative_review_fingerprint}.md"),
        &review_source,
    )?;
    let review_expectations = FinalReviewReceiptExpectations {
        expected_plan_path: &context.plan_rel,
        expected_plan_revision: context.plan_document.plan_revision,
        expected_strategy_checkpoint_fingerprint: Some(&strategy_checkpoint_fingerprint),
        expected_head_sha: &current_head,
        expected_base_branch: &base_branch,
        deviations_required: false,
    };
    let rebound_review_receipt = parse_final_review_receipt(&authoritative_review_path);
    if validate_final_review_receipt(
        &rebound_review_receipt,
        &authoritative_review_path,
        &review_expectations,
    )
    .is_err()
    {
        return Err(rebuild_downstream_truth_stale(format!(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but the rebound authoritative final review artifact {} did not validate against the rebuilt state.",
            authoritative_review_path.display()
        )));
    }

    let test_plan = parse_artifact_document(&test_plan_path);
    if test_plan.headers.get("Source Plan") != Some(&format!("`{}`", context.plan_rel))
        || test_plan.headers.get("Source Plan Revision")
            != Some(&context.plan_document.plan_revision.to_string())
        || test_plan.headers.get("Branch") != Some(branch)
        || test_plan.headers.get("Repo") != Some(&context.runtime.repo_slug)
        || test_plan.headers.get("Head SHA") != Some(&current_head)
        || test_plan.headers.get("Generated By")
            != Some(&String::from("featureforge:plan-eng-review"))
    {
        return Err(rebuild_downstream_truth_stale(format!(
            "post_rebuild_late_gate_truth_stale: rebuild completed, but test-plan artifact {} does not match the current approved plan or HEAD.",
            test_plan_path.display()
        )));
    }
    let authoritative_test_plan_source = fs::read_to_string(&test_plan_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not read rebuild test-plan artifact {}: {error}",
                test_plan_path.display()
            ),
        )
    })?;
    let authoritative_test_plan_fingerprint =
        sha256_hex(authoritative_test_plan_source.as_bytes());
    let authoritative_test_plan_path = publish_authoritative_rebuild_artifact(
        runtime,
        &format!("test-plan-{authoritative_test_plan_fingerprint}.md"),
        &authoritative_test_plan_source,
    )?;

    let authoritative_browser_qa_fingerprint = if let Some(qa_path) = initial_qa_path.as_ref() {
        let qa = parse_artifact_document(qa_path);
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
            .and_then(|source| fs::canonicalize(&test_plan_path).ok().map(|target| source == target))
            .unwrap_or(false);
        if qa.headers.get("Source Plan") != Some(&format!("`{}`", context.plan_rel))
            || qa.headers.get("Source Plan Revision")
                != Some(&context.plan_document.plan_revision.to_string())
            || qa.headers.get("Branch") != Some(branch)
            || qa.headers.get("Repo") != Some(&context.runtime.repo_slug)
            || qa.headers.get("Head SHA") != Some(&current_head)
            || qa.headers.get("Result") != Some(&String::from("pass"))
            || qa.headers.get("Generated By") != Some(&String::from("featureforge:qa-only"))
            || !qa_source_test_plan_matches
        {
            return Err(rebuild_downstream_truth_stale(format!(
                "post_rebuild_late_gate_truth_stale: rebuild completed, but QA artifact {} does not match the rebuilt branch state.",
                qa_path.display()
            )));
        }
        let qa_source = fs::read_to_string(qa_path).map_err(|error| {
            JsonFailure::new(
                FailureClass::EvidenceWriteFailed,
                format!("Could not read rebuild QA artifact {}: {error}", qa_path.display()),
            )
        })?;
        let authoritative_qa_source = rewrite_rebuild_source_test_plan_header(
            &qa_source,
            &authoritative_test_plan_path,
        );
        let authoritative_qa_fingerprint = sha256_hex(authoritative_qa_source.as_bytes());
        publish_authoritative_rebuild_artifact(
            runtime,
            &format!("browser-qa-{authoritative_qa_fingerprint}.md"),
            &authoritative_qa_source,
        )?;
        Some(authoritative_qa_fingerprint)
    } else {
        None
    };

    let authoritative_release_fingerprint = if let Some(release_path) = initial_release_path.as_ref()
    {
        let release = parse_artifact_document(release_path);
        if release.headers.get("Source Plan") != Some(&format!("`{}`", context.plan_rel))
            || release.headers.get("Source Plan Revision")
                != Some(&context.plan_document.plan_revision.to_string())
            || release.headers.get("Branch") != Some(branch)
            || release.headers.get("Repo") != Some(&context.runtime.repo_slug)
            || release.headers.get("Base Branch") != Some(&base_branch)
            || release.headers.get("Head SHA") != Some(&current_head)
            || release.headers.get("Result") != Some(&String::from("pass"))
            || release.headers.get("Generated By")
                != Some(&String::from("featureforge:document-release"))
        {
            return Err(rebuild_downstream_truth_stale(format!(
                "post_rebuild_late_gate_truth_stale: rebuild completed, but release-readiness artifact {} does not match the current approved plan or HEAD.",
                release_path.display()
            )));
        }
        let authoritative_release_source = fs::read_to_string(release_path).map_err(|error| {
            JsonFailure::new(
                FailureClass::EvidenceWriteFailed,
                format!(
                    "Could not read rebuild release artifact {}: {error}",
                    release_path.display()
                ),
            )
        })?;
        let authoritative_release_fingerprint =
            sha256_hex(authoritative_release_source.as_bytes());
        publish_authoritative_rebuild_artifact(
            runtime,
            &format!("release-docs-{authoritative_release_fingerprint}.md"),
            &authoritative_release_source,
        )?;
        Some(authoritative_release_fingerprint)
    } else {
        None
    };

    let context = load_execution_context(runtime, plan)?;
    let mut authoritative_state = load_authoritative_transition_state(&context)?;
    if let Some(authoritative_state) = authoritative_state.as_mut() {
        authoritative_state.restore_downstream_truth(
            &authoritative_review_fingerprint,
            browser_qa_required,
            authoritative_browser_qa_fingerprint.as_deref(),
            authoritative_release_fingerprint.as_deref(),
        )?;
        authoritative_state.persist_if_dirty_with_failpoint(None)?;
    }
    Ok(())
}

fn publish_authoritative_rebuild_artifact(
    runtime: &ExecutionRuntime,
    artifact_file_name: &str,
    source: &str,
) -> Result<PathBuf, JsonFailure> {
    let path = harness_authoritative_artifact_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
        artifact_file_name,
    );
    write_atomic(&path, source)?;
    Ok(path)
}

fn rebuild_downstream_truth_stale(message: impl Into<String>) -> JsonFailure {
    JsonFailure::new(FailureClass::StaleProvenance, message.into())
}

fn rewrite_branch_final_review_artifacts(
    review_path: &Path,
    reviewer_artifact_path: &Path,
    current_head: &str,
    strategy_checkpoint_fingerprint: &str,
) -> Result<(), JsonFailure> {
    let reviewer_source = fs::read_to_string(reviewer_artifact_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not read rebuild reviewer artifact {}: {error}",
                reviewer_artifact_path.display()
            ),
        )
    })?;
    let rebound_reviewer_source = rewrite_markdown_header(
        &rewrite_markdown_header(
            &reviewer_source,
            "Strategy Checkpoint Fingerprint",
            strategy_checkpoint_fingerprint,
        ),
        "Head SHA",
        current_head,
    );
    write_atomic(reviewer_artifact_path, &rebound_reviewer_source)?;
    let reviewer_fingerprint = sha256_hex(rebound_reviewer_source.as_bytes());

    let review_source = fs::read_to_string(review_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!(
                "Could not read rebuild final-review artifact {}: {error}",
                review_path.display()
            ),
        )
    })?;
    let rebound_review_source = rewrite_markdown_header(
        &rewrite_markdown_header(
            &rewrite_markdown_header(
                &rewrite_markdown_header(
                    &review_source,
                    "Strategy Checkpoint Fingerprint",
                    strategy_checkpoint_fingerprint,
                ),
                "Reviewer Artifact Path",
                &format!("`{}`", reviewer_artifact_path.display()),
            ),
            "Reviewer Artifact Fingerprint",
            &reviewer_fingerprint,
        ),
        "Head SHA",
        current_head,
    );
    write_atomic(review_path, &rebound_review_source)
}

fn rewrite_branch_head_bound_artifact(path: &Path, current_head: &str) -> Result<(), JsonFailure> {
    let source = fs::read_to_string(path).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!("Could not read rebuild artifact {}: {error}", path.display()),
        )
    })?;
    let rebound_source = rewrite_markdown_header(&source, "Head SHA", current_head);
    write_atomic(path, &rebound_source)
}

fn rewrite_branch_qa_artifact(
    qa_path: &Path,
    current_head: &str,
    test_plan_path: &Path,
) -> Result<(), JsonFailure> {
    let source = fs::read_to_string(qa_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::EvidenceWriteFailed,
            format!("Could not read rebuild QA artifact {}: {error}", qa_path.display()),
        )
    })?;
    let rebound_source = rewrite_rebuild_source_test_plan_header(
        &rewrite_markdown_header(&source, "Head SHA", current_head),
        test_plan_path,
    );
    write_atomic(qa_path, &rebound_source)
}

fn rewrite_rebuild_source_test_plan_header(source: &str, test_plan_path: &Path) -> String {
    rewrite_markdown_header(
        source,
        "Source Test Plan",
        &format!("`{}`", test_plan_path.display()),
    )
}

fn rewrite_markdown_header(source: &str, header: &str, value: &str) -> String {
    let prefix = format!("**{header}:**");
    let rewritten = source
        .lines()
        .map(|line| {
            if line.trim().starts_with(&prefix) {
                format!("**{header}:** {value}")
            } else {
                line.to_owned()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");
    format!("{rewritten}\n")
}

fn resolve_rebuild_reviewer_artifact_path(
    review_receipt_path: &Path,
    raw_reviewer_artifact_path: Option<&str>,
) -> Option<PathBuf> {
    let raw_reviewer_artifact_path = raw_reviewer_artifact_path
        .map(str::trim)
        .filter(|value| !value.is_empty())?;
    let reviewer_artifact_path = PathBuf::from(raw_reviewer_artifact_path.trim_matches('`'));
    Some(if reviewer_artifact_path.is_absolute() {
        reviewer_artifact_path
    } else {
        review_receipt_path
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .join(reviewer_artifact_path)
    })
}

fn refresh_rebuild_task_closure_receipts_with_context(
    runtime: &ExecutionRuntime,
    context: &ExecutionContext,
    execution_run_id: &str,
    strategy_checkpoint_fingerprint: &str,
    active_contract_fingerprint: Option<&str>,
    task: u32,
    restore_missing_dispatch_lineage: bool,
) -> Result<(), JsonFailure> {
    let mut authoritative_state = load_authoritative_transition_state(context)?;
    let task_steps = context
        .steps
        .iter()
        .filter(|step_state| step_state.task_number == task)
        .map(|step_state| step_state.step_number)
        .collect::<Vec<_>>();
    for step in task_steps {
        refresh_unit_review_receipt_for_step(
            runtime,
            context,
            execution_run_id,
            strategy_checkpoint_fingerprint,
            active_contract_fingerprint,
            task,
            step,
        )?;
    }
    refresh_task_verification_receipt_for_task(
        runtime,
        context,
        execution_run_id,
        strategy_checkpoint_fingerprint,
        task,
    )?;
    if let Some(authoritative_state) = authoritative_state.as_mut() {
        if restore_missing_dispatch_lineage {
            authoritative_state.ensure_task_review_dispatch_lineage(context, task)?;
        } else {
            authoritative_state.refresh_task_review_dispatch_lineage(context, task)?;
        }
        authoritative_state.persist_if_dirty_with_failpoint(None)?;
    }
    Ok(())
}

fn refresh_unit_review_receipt_for_step(
    runtime: &ExecutionRuntime,
    context: &ExecutionContext,
    execution_run_id: &str,
    strategy_checkpoint_fingerprint: &str,
    active_contract_fingerprint: Option<&str>,
    task: u32,
    step: u32,
) -> Result<(), JsonFailure> {
    let Some(attempt) = latest_attempt_for_step(&context.evidence, task, step) else {
        return Ok(());
    };
    if attempt.status != "Completed" {
        return Ok(());
    }
    let Some(packet_fingerprint) = attempt
        .packet_fingerprint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(());
    };
    let Some(reviewed_checkpoint_sha) = attempt
        .head_sha
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(());
    };

    let execution_unit_id = format!("task-{task}-step-{step}");
    let reviewer_source = existing_unit_review_reviewer_source(
        runtime,
        execution_run_id,
        &execution_unit_id,
    )
    .unwrap_or_else(|| String::from("fresh-context-subagent"));
    let generated_at = Timestamp::now().to_string();
    let unsigned_source = if let Some(active_contract_fingerprint) = active_contract_fingerprint {
        let approved_unit_contract_fingerprint = approved_unit_contract_fingerprint_for_review(
            active_contract_fingerprint,
            packet_fingerprint,
            &execution_unit_id,
        );
        let execution_context_key = current_worktree_lease_execution_context_key(
            execution_run_id,
            &execution_unit_id,
            &context.plan_rel,
            context.plan_document.plan_revision,
            &context.runtime.branch_name,
            reviewed_checkpoint_sha,
        );
        let lease_fingerprint = serial_unit_review_lease_fingerprint(
            execution_run_id,
            &execution_unit_id,
            &execution_context_key,
            reviewed_checkpoint_sha,
            packet_fingerprint,
            &approved_unit_contract_fingerprint,
        );
        let Some(reconcile_result_proof_fingerprint) = reconcile_result_proof_fingerprint_for_review(
            &context.runtime.repo_root,
            reviewed_checkpoint_sha,
        ) else {
            return Ok(());
        };
        let reviewed_worktree = fs::canonicalize(&context.runtime.repo_root)
            .unwrap_or_else(|_| context.runtime.repo_root.clone());
        format!(
            "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** {reviewer_source}\n**Strategy Checkpoint Fingerprint:** {strategy_checkpoint_fingerprint}\n**Source Plan:** {}\n**Source Plan Revision:** {}\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {lease_fingerprint}\n**Execution Context Key:** {execution_context_key}\n**Approved Task Packet Fingerprint:** {packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reviewed_checkpoint_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** {generated_at}\n",
            context.plan_rel,
            context.plan_document.plan_revision,
            reviewed_worktree.display(),
        )
    } else {
        format!(
            "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** {reviewer_source}\n**Strategy Checkpoint Fingerprint:** {strategy_checkpoint_fingerprint}\n**Source Plan:** {}\n**Source Plan Revision:** {}\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_sha}\n**Approved Task Packet Fingerprint:** {packet_fingerprint}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** {generated_at}\n",
            context.plan_rel,
            context.plan_document.plan_revision,
        )
    };
    let receipt_fingerprint = canonical_unit_review_receipt_fingerprint(&unsigned_source);
    let source = format!(
        "# Unit Review Result\n**Receipt Fingerprint:** {receipt_fingerprint}\n{}",
        unsigned_source.trim_start_matches("# Unit Review Result\n")
    );

    write_authoritative_unit_review_receipt_artifact(
        runtime,
        execution_run_id,
        &execution_unit_id,
        &source,
    )?;
    Ok(())
}

fn existing_unit_review_reviewer_source(
    runtime: &ExecutionRuntime,
    execution_run_id: &str,
    execution_unit_id: &str,
) -> Option<String> {
    let receipt_path = harness_authoritative_artifact_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
        &format!("unit-review-{execution_run_id}-{execution_unit_id}.md"),
    );
    let source = fs::read_to_string(receipt_path).ok()?;
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Reviewer Source:**")
            .map(str::trim)
            .filter(|value| matches!(*value, "fresh-context-subagent" | "cross-model"))
            .map(ToOwned::to_owned)
    })
}

fn refresh_task_verification_receipt_for_task(
    runtime: &ExecutionRuntime,
    context: &ExecutionContext,
    execution_run_id: &str,
    strategy_checkpoint_fingerprint: &str,
    task: u32,
) -> Result<(), JsonFailure> {
    let task_steps = context
        .steps
        .iter()
        .filter(|step_state| step_state.task_number == task)
        .collect::<Vec<_>>();
    if task_steps.is_empty() {
        return Ok(());
    }

    let mut verification_commands = Vec::new();
    let mut verification_results = Vec::new();
    for step_state in task_steps {
        if !step_state.checked {
            return Ok(());
        }
        let Some(attempt) = latest_attempt_for_step(&context.evidence, task, step_state.step_number)
        else {
            return Ok(());
        };
        if attempt.status != "Completed" {
            return Ok(());
        }
        if let Some(verify_command) = attempt
            .verify_command
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        {
            verification_commands.push(verify_command.to_owned());
        }
        let verification_summary = attempt.verification_summary.trim();
        if !verification_summary.is_empty() {
            verification_results.push(verification_summary.to_owned());
        }
    }

    if verification_results.is_empty() {
        return Ok(());
    }
    if verification_commands.is_empty() {
        verification_commands.push(String::from("manual verification recorded"));
    }

    let receipt_path = harness_authoritative_artifact_path(
        &runtime.state_dir,
        &runtime.repo_slug,
        &runtime.branch_name,
        &format!("task-verification-{execution_run_id}-task-{task}.md"),
    );
    let generated_at = Timestamp::now().to_string();
    let source = format!(
        "# Task Verification Result\n**Source Plan:** {}\n**Source Plan Revision:** {}\n**Execution Run ID:** {execution_run_id}\n**Task Number:** {task}\n**Strategy Checkpoint Fingerprint:** {strategy_checkpoint_fingerprint}\n**Verification Commands:** {}\n**Verification Results:** {}\n**Result:** pass\n**Generated By:** featureforge:verification-before-completion\n**Generated At:** {generated_at}\n",
        context.plan_rel,
        context.plan_document.plan_revision,
        verification_commands.join(" && "),
        verification_results.join(" | "),
    );
    write_atomic(&receipt_path, &source)
}

fn latest_attempt_for_step(
    evidence: &ExecutionEvidence,
    task: u32,
    step: u32,
) -> Option<&EvidenceAttempt> {
    evidence
        .attempts
        .iter()
        .filter(|attempt| attempt.task_number == task && attempt.step_number == step)
        .max_by_key(|attempt| attempt.attempt_number)
}

fn canonical_unit_review_receipt_fingerprint(source: &str) -> String {
    let filtered = source
        .lines()
        .filter(|line| !line.trim().starts_with("**Receipt Fingerprint:**"))
        .collect::<Vec<_>>()
        .join("\n");
    sha256_hex(filtered.as_bytes())
}

fn current_worktree_lease_execution_context_key(
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

fn verify_command_process(repo_root: &Path, verify_command: &str) -> Command {
    let (program, args) = verify_command_launcher(verify_command);
    let mut command = Command::new(program);
    command.args(args).current_dir(repo_root);
    command
}

fn verify_command_launcher(verify_command: &str) -> (&'static str, Vec<String>) {
    if cfg!(windows) {
        ("cmd", vec![String::from("/C"), verify_command.to_owned()])
    } else {
        ("sh", vec![String::from("-lc"), verify_command.to_owned()])
    }
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

fn is_rebuild_task_boundary_receipt_failure(message: &str) -> bool {
    matches!(
        message.split_once(':').map(|(reason_code, _)| reason_code.trim()),
        Some(
            "prior_task_review_dispatch_missing"
                | "prior_task_review_dispatch_stale"
                | "prior_task_review_not_green"
                | "task_review_not_independent"
                | "task_review_receipt_malformed"
                | "prior_task_verification_missing"
                | "prior_task_verification_missing_legacy"
                | "task_verification_receipt_malformed"
        )
    )
}

fn planned_rebuild_target(candidate: &RebuildEvidenceCandidate) -> RebuildEvidenceTarget {
    RebuildEvidenceTarget {
        task_id: candidate.task,
        step_id: candidate.step,
        target_kind: candidate.target_kind.clone(),
        pre_invalidation_reason: candidate.pre_invalidation_reason.clone(),
        status: String::from("planned"),
        verify_mode: candidate.verify_mode.clone(),
        verify_command: candidate.verify_command.clone(),
        attempt_id_before: candidate
            .attempt_number
            .map(|attempt| format!("{}:{}:{}", candidate.task, candidate.step, attempt)),
        attempt_id_after: None,
        verification_hash: None,
        error: None,
        failure_class: None,
    }
}

fn rebuild_scope_label(request: &crate::execution::state::RebuildEvidenceRequest) -> String {
    if !request.raw_steps.is_empty() {
        String::from("step")
    } else if !request.tasks.is_empty() {
        String::from("task")
    } else {
        String::from("all")
    }
}

fn matched_rebuild_scope_ids(
    context: &ExecutionContext,
    request: &crate::execution::state::RebuildEvidenceRequest,
) -> Vec<String> {
    let task_filter = request.tasks.iter().copied().collect::<BTreeSet<_>>();
    let step_filter = request.steps.iter().copied().collect::<BTreeSet<_>>();
    context
        .steps
        .iter()
        .filter(|step| {
            (task_filter.is_empty() || task_filter.contains(&step.task_number))
                && (step_filter.is_empty()
                    || step_filter.contains(&(step.task_number, step.step_number)))
        })
        .map(|step| format!("{}:{}", step.task_number, step.step_number))
        .collect()
}

fn summarize_verify_result(output: &std::process::Output, no_output: bool) -> String {
    let exit_code = output.status.code().unwrap_or(1);
    let stdout = normalize_whitespace(&String::from_utf8_lossy(&output.stdout));
    let stderr = normalize_whitespace(&String::from_utf8_lossy(&output.stderr));
    let detail = if no_output {
        String::new()
    } else {
        let text = if !stdout.is_empty() { stdout } else { stderr };
        if text.is_empty() {
            String::new()
        } else {
            format!(": {text}")
        }
    };
    if output.status.success() {
        format!("passed{detail}")
    } else {
        format!("failed (exit {exit_code}){detail}")
    }
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
        &index,
        None,
        gix::status::tree_index::TrackRenames::AsConfigured,
        |change, _, _| {
            if let gix::diff::index::ChangeRef::Rewrite {
                source_location,
                location,
                copy,
                ..
            } = change
                && !copy
            {
                let source = String::from_utf8_lossy(source_location.as_ref()).into_owned();
                if missing.contains(&source) {
                    let destination = String::from_utf8_lossy(location.as_ref()).into_owned();
                    paths.insert(source, destination);
                    if paths.len() == missing.len() {
                        return Ok::<_, std::convert::Infallible>(std::ops::ControlFlow::Break(()));
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

        if let Some((_, step_number, _)) = crate::execution::state::parse_step_line(line)
            && let Some(task_number) = current_task
            && let Some(step) = step_map.get(&(task_number, step_number))
        {
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
            if let Some(verify_command) = &attempt.verify_command {
                output.push(format!("**Verify Command:** {verify_command}"));
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

#[cfg(test)]
mod unit_tests {
    use super::verify_command_launcher;

    #[test]
    fn verify_command_launcher_matches_platform_contract() {
        let (program, args) = verify_command_launcher("printf rebuilt");
        if cfg!(windows) {
            assert_eq!(program, "cmd");
            assert_eq!(args, vec![String::from("/C"), String::from("printf rebuilt")]);
        } else {
            assert_eq!(program, "sh");
            assert_eq!(args, vec![String::from("-lc"), String::from("printf rebuilt")]);
        }
    }
}
