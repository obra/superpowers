use std::fs;
use std::io::ErrorKind;
use std::path::PathBuf;

use serde::Deserialize;

use crate::contracts::harness::{
    ExecutionTopologyDowngradeRecord, WORKTREE_LEASE_VERSION, WorktreeLease, WorktreeLeaseState,
};
use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::harness::INITIAL_AUTHORITATIVE_SEQUENCE;
use crate::execution::observability::validate_execution_topology_downgrade_record;
use crate::execution::state::ExecutionContext;
use crate::paths::{harness_authoritative_artifacts_dir, harness_branch_root, harness_state_path};

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct StatusAuthoritativeOverlay {
    #[serde(default)]
    pub(crate) harness_phase: Option<String>,
    #[serde(default)]
    pub(crate) chunk_id: Option<String>,
    #[serde(default)]
    pub(crate) latest_authoritative_sequence: Option<u64>,
    #[serde(default)]
    pub(crate) authoritative_sequence: Option<u64>,
    #[serde(default)]
    pub(crate) active_contract_path: Option<String>,
    #[serde(default)]
    pub(crate) active_contract_fingerprint: Option<String>,
    #[serde(default)]
    pub(crate) required_evaluator_kinds: Vec<String>,
    #[serde(default)]
    pub(crate) completed_evaluator_kinds: Vec<String>,
    #[serde(default)]
    pub(crate) pending_evaluator_kinds: Vec<String>,
    #[serde(default)]
    pub(crate) non_passing_evaluator_kinds: Vec<String>,
    #[serde(default)]
    pub(crate) aggregate_evaluation_state: Option<String>,
    #[serde(default)]
    pub(crate) last_evaluation_report_path: Option<String>,
    #[serde(default)]
    pub(crate) last_evaluation_report_fingerprint: Option<String>,
    #[serde(default)]
    pub(crate) last_evaluation_evaluator_kind: Option<String>,
    #[serde(default)]
    pub(crate) last_evaluation_verdict: Option<String>,
    #[serde(default)]
    pub(crate) current_chunk_retry_count: Option<u32>,
    #[serde(default)]
    pub(crate) current_chunk_retry_budget: Option<u32>,
    #[serde(default)]
    pub(crate) current_chunk_pivot_threshold: Option<u32>,
    #[serde(default)]
    pub(crate) handoff_required: Option<bool>,
    #[serde(default)]
    pub(crate) open_failed_criteria: Vec<String>,
    #[serde(default)]
    pub(crate) write_authority_state: Option<String>,
    #[serde(default)]
    pub(crate) write_authority_holder: Option<String>,
    #[serde(default)]
    pub(crate) write_authority_worktree: Option<String>,
    #[serde(default)]
    pub(crate) repo_state_baseline_head_sha: Option<String>,
    #[serde(default)]
    pub(crate) repo_state_baseline_worktree_fingerprint: Option<String>,
    #[serde(default)]
    pub(crate) repo_state_drift_state: Option<String>,
    #[serde(default)]
    pub(crate) dependency_index_state: Option<String>,
    #[serde(default)]
    pub(crate) final_review_state: Option<String>,
    #[serde(default)]
    pub(crate) browser_qa_state: Option<String>,
    #[serde(default)]
    pub(crate) release_docs_state: Option<String>,
    #[serde(default)]
    pub(crate) last_final_review_artifact_fingerprint: Option<String>,
    #[serde(default)]
    pub(crate) last_browser_qa_artifact_fingerprint: Option<String>,
    #[serde(default)]
    pub(crate) last_release_docs_artifact_fingerprint: Option<String>,
    #[serde(default)]
    pub(crate) strategy_state: Option<String>,
    #[serde(default)]
    pub(crate) last_strategy_checkpoint_fingerprint: Option<String>,
    #[serde(default)]
    pub(crate) strategy_checkpoint_kind: Option<String>,
    #[serde(default)]
    pub(crate) strategy_reset_required: Option<bool>,
    #[serde(default)]
    pub(crate) reason_codes: Vec<String>,
}

pub(crate) fn load_status_authoritative_overlay_checked(
    context: &ExecutionContext,
) -> Result<Option<StatusAuthoritativeOverlay>, JsonFailure> {
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

pub(crate) fn authoritative_state_path(context: &ExecutionContext) -> PathBuf {
    harness_state_path(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    )
}

#[derive(Debug, Deserialize)]
pub(crate) struct PreflightAuthoritativeState {
    #[serde(default)]
    pub(crate) harness_phase: Option<String>,
    #[serde(default)]
    pub(crate) handoff_required: bool,
    #[serde(default)]
    pub(crate) latest_authoritative_sequence: Option<u64>,
    #[serde(default)]
    pub(crate) authoritative_sequence: Option<u64>,
}

pub(crate) fn load_preflight_authoritative_state(
    context: &ExecutionContext,
) -> Result<Option<PreflightAuthoritativeState>, JsonFailure> {
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

    let source = match fs::read_to_string(&state_path) {
        Ok(source) => source,
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

pub(crate) fn preflight_requires_authoritative_handoff(
    context: &ExecutionContext,
) -> Result<bool, JsonFailure> {
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

pub(crate) fn parse_authoritative_sequence_from_artifact(source: &str) -> Option<u64> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Authoritative Sequence:**")
            .and_then(|value| value.trim().parse::<u64>().ok())
    })
}

fn parse_authoritative_sequence_from_worktree_lease_artifact(
    source: &str,
) -> Result<Option<u64>, JsonFailure> {
    let lease: WorktreeLease = serde_json::from_str(source).map_err(|error| {
        JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            format!("Authoritative worktree lease is malformed: {error}"),
        )
    })?;
    Ok(Some(lease.authoritative_sequence))
}

pub(crate) fn latest_authoritative_artifact_sequence(
    context: &ExecutionContext,
) -> Result<Option<u64>, JsonFailure> {
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
        let file_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("");
        if file_name.starts_with("worktree-lease-") && file_name.ends_with(".json") {
            let source = fs::read_to_string(&path).map_err(|error| {
                JsonFailure::new(
                    FailureClass::ExecutionStateNotReady,
                    format!(
                        "Could not read authoritative worktree lease {}: {error}",
                        path.display()
                    ),
                )
            })?;
            if let Some(sequence) =
                parse_authoritative_sequence_from_worktree_lease_artifact(&source)?
            {
                max_sequence = Some(max_sequence.map_or(sequence, |current| current.max(sequence)));
            }
            continue;
        }
        let source = fs::read_to_string(&path).map_err(|error| {
            JsonFailure::new(
                FailureClass::ExecutionStateNotReady,
                format!(
                    "Could not read authoritative artifact {}: {error}",
                    path.display()
                ),
            )
        })?;
        if let Some(sequence) = parse_authoritative_sequence_from_artifact(&source) {
            max_sequence = Some(max_sequence.map_or(sequence, |current| current.max(sequence)));
        }
    }
    Ok(max_sequence)
}

pub(crate) fn preflight_requires_authoritative_mutation_recovery(
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

pub(crate) fn authoritative_matching_execution_topology_downgrade_records_checked(
    context: &ExecutionContext,
    execution_context_key: &str,
) -> Result<Vec<ExecutionTopologyDowngradeRecord>, JsonFailure> {
    const TOPOLOGY_DOWNGRADE_FILE_PREFIX: &str = "execution-topology-downgrade-";
    const TOPOLOGY_DOWNGRADE_FILE_SUFFIX: &str = ".json";

    let artifacts_dir = harness_authoritative_artifacts_dir(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    );
    let entries = match fs::read_dir(&artifacts_dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(Vec::new()),
        Err(error) => {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not read authoritative artifact directory {}: {error}",
                    artifacts_dir.display()
                ),
            ));
        }
    };

    let mut records = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|error| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not enumerate authoritative artifacts in {}: {error}",
                    artifacts_dir.display()
                ),
            )
        })?;
        let path = entry.path();
        let file_name = path
            .file_name()
            .and_then(std::ffi::OsStr::to_str)
            .unwrap_or_default();
        if !file_name.starts_with(TOPOLOGY_DOWNGRADE_FILE_PREFIX)
            || !file_name.ends_with(TOPOLOGY_DOWNGRADE_FILE_SUFFIX)
        {
            continue;
        }

        let metadata = fs::symlink_metadata(&path).map_err(|error| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not inspect authoritative topology downgrade record {}: {error}",
                    path.display()
                ),
            )
        })?;
        if metadata.file_type().is_symlink() || !metadata.is_file() {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Authoritative topology downgrade record must be a regular file in {}.",
                    path.display()
                ),
            ));
        }

        let source = fs::read_to_string(&path).map_err(|error| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not read authoritative topology downgrade record {}: {error}",
                    path.display()
                ),
            )
        })?;
        let record: ExecutionTopologyDowngradeRecord =
            serde_json::from_str(&source).map_err(|error| {
                JsonFailure::new(
                    FailureClass::MalformedExecutionState,
                    format!(
                        "Authoritative topology downgrade record is malformed in {}: {error}",
                        path.display()
                    ),
                )
            })?;
        validate_execution_topology_downgrade_record(&record)?;

        if record.source_plan_path != context.plan_rel
            || record.source_plan_revision != context.plan_document.plan_revision
        {
            continue;
        }
        if !execution_context_key.trim().is_empty()
            && record.execution_context_key != execution_context_key
        {
            continue;
        }
        records.push(record);
    }

    records.sort_by(|left, right| {
        left.authoritative_sequence
            .cmp(&right.authoritative_sequence)
            .then_with(|| left.generated_at.cmp(&right.generated_at))
            .then_with(|| left.record_fingerprint.cmp(&right.record_fingerprint))
    });
    Ok(records)
}

pub(crate) enum PreflightWriteAuthorityState {
    Clear,
    Conflict,
}

pub(crate) fn preflight_write_authority_state(
    context: &ExecutionContext,
) -> Result<PreflightWriteAuthorityState, JsonFailure> {
    let lock_path = harness_branch_root(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    )
    .join("write-authority.lock");
    let metadata = match fs::symlink_metadata(&lock_path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == ErrorKind::NotFound => {
            return Ok(PreflightWriteAuthorityState::Clear);
        }
        Err(error) => {
            return Err(JsonFailure::new(
                FailureClass::ExecutionStateNotReady,
                format!(
                    "Could not inspect write-authority lock {}: {error}",
                    lock_path.display()
                ),
            ));
        }
    };
    if metadata.file_type().is_symlink() {
        return Err(JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            format!(
                "Write-authority lock path must not be a symlink in {}.",
                lock_path.display()
            ),
        ));
    }
    if !metadata.is_file() {
        return Err(JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            format!(
                "Write-authority lock must be a regular file in {}.",
                lock_path.display()
            ),
        ));
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
        Err(error) if error.kind() == ErrorKind::NotFound => {
            Ok(PreflightWriteAuthorityState::Clear)
        }
        Err(error) => Err(JsonFailure::new(
            FailureClass::ExecutionStateNotReady,
            format!(
                "Could not reclaim stale write-authority lock {}: {error}",
                lock_path.display()
            ),
        )),
    }
}

pub(crate) fn process_is_running(pid: u32) -> bool {
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

pub fn worktree_lease_states() -> &'static [WorktreeLeaseState] {
    &WorktreeLeaseState::ALL
}

pub fn is_worktree_lease_terminal_state(state: WorktreeLeaseState) -> bool {
    matches!(
        state,
        WorktreeLeaseState::Reconciled | WorktreeLeaseState::Cleaned
    )
}

pub fn validate_worktree_lease(lease: &WorktreeLease) -> Result<(), JsonFailure> {
    if lease.lease_version != WORKTREE_LEASE_VERSION {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "WorktreeLease has unsupported lease_version {}.",
                lease.lease_version
            ),
        ));
    }

    if lease.authoritative_sequence == 0 {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "WorktreeLease must record a non-zero authoritative_sequence.",
        ));
    }

    require_non_empty(&lease.execution_run_id, "execution_run_id")?;
    require_non_empty(&lease.execution_context_key, "execution_context_key")?;
    require_non_empty(&lease.source_plan_path, "source_plan_path")?;
    require_non_empty(&lease.execution_unit_id, "execution_unit_id")?;
    require_non_empty(&lease.source_branch, "source_branch")?;
    require_non_empty(
        &lease.authoritative_integration_branch,
        "authoritative_integration_branch",
    )?;
    require_non_empty(&lease.worktree_path, "worktree_path")?;
    require_non_empty(
        &lease.repo_state_baseline_head_sha,
        "repo_state_baseline_head_sha",
    )?;
    require_non_empty(
        &lease.repo_state_baseline_worktree_fingerprint,
        "repo_state_baseline_worktree_fingerprint",
    )?;
    require_non_empty(&lease.cleanup_state, "cleanup_state")?;
    require_non_empty(&lease.reconcile_mode, "reconcile_mode")?;
    require_non_empty(&lease.generated_by, "generated_by")?;
    require_non_empty(&lease.generated_at, "generated_at")?;
    require_non_empty(&lease.lease_fingerprint, "lease_fingerprint")?;

    let requires_reviewed_checkpoint = !matches!(lease.lease_state, WorktreeLeaseState::Open);
    if requires_reviewed_checkpoint
        && lease
            .reviewed_checkpoint_commit_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .is_none()
    {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "WorktreeLease must include reviewed_checkpoint_commit_sha while lease_state is not open.",
        ));
    }

    if let Some(reviewed_checkpoint_commit_sha) = lease.reviewed_checkpoint_commit_sha.as_deref() {
        require_non_empty(
            reviewed_checkpoint_commit_sha,
            "reviewed_checkpoint_commit_sha",
        )?;
    }

    let requires_reconcile_provenance = !matches!(
        lease.lease_state,
        WorktreeLeaseState::Open | WorktreeLeaseState::ReviewPassedPendingReconcile
    );
    if requires_reconcile_provenance
        && lease
            .reconcile_result_commit_sha
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .is_none()
    {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "WorktreeLease must include reconcile_result_commit_sha while lease_state is terminal.",
        ));
    }
    if let Some(reconcile_result_commit_sha) = lease.reconcile_result_commit_sha.as_deref() {
        require_non_empty(reconcile_result_commit_sha, "reconcile_result_commit_sha")?;
    }

    if requires_reconcile_provenance
        && lease
            .reconcile_result_proof_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .is_none()
    {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "WorktreeLease must include reconcile_result_proof_fingerprint while lease_state is terminal.",
        ));
    }
    if let Some(reconcile_result_proof_fingerprint) =
        lease.reconcile_result_proof_fingerprint.as_deref()
    {
        require_non_empty(
            reconcile_result_proof_fingerprint,
            "reconcile_result_proof_fingerprint",
        )?;
    }

    Ok(())
}

fn require_non_empty(value: &str, field_name: &str) -> Result<(), JsonFailure> {
    if value.trim().is_empty() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!("WorktreeLease is missing non-empty {field_name}."),
        ));
    }
    Ok(())
}
