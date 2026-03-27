use std::collections::BTreeSet;
use std::fs::{self, OpenOptions};
use std::io::{ErrorKind, Write};
use std::path::PathBuf;

use serde_json::Value;

use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::gates::{
    require_active_contract_state, ActiveContractState, GateAuthorityState,
};
use crate::execution::state::{ExecutionContext, ExecutionRuntime, GateState, NoteState};
use crate::paths::{harness_branch_root, harness_state_path, write_atomic as write_atomic_file};

#[derive(Debug, Clone, Copy)]
pub(crate) enum StepCommand {
    Begin,
    Note,
    Complete,
    Reopen,
    Transfer,
}

impl StepCommand {
    fn as_str(self) -> &'static str {
        match self {
            Self::Begin => "begin",
            Self::Note => "note",
            Self::Complete => "complete",
            Self::Reopen => "reopen",
            Self::Transfer => "transfer",
        }
    }
}

pub(crate) struct StepWriteAuthorityGuard {
    lock_path: PathBuf,
}

impl Drop for StepWriteAuthorityGuard {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.lock_path);
    }
}

pub(crate) fn claim_step_write_authority(
    runtime: &ExecutionRuntime,
) -> Result<StepWriteAuthorityGuard, JsonFailure> {
    let lock_path =
        harness_branch_root(&runtime.state_dir, &runtime.repo_slug, &runtime.branch_name)
            .join("write-authority.lock");
    if let Some(parent) = lock_path.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            JsonFailure::new(
                FailureClass::PartialAuthoritativeMutation,
                format!(
                    "Could not prepare write-authority directory {}: {error}",
                    parent.display()
                ),
            )
        })?;
    }

    let mut file = match OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&lock_path)
    {
        Ok(file) => file,
        Err(error) if error.kind() == ErrorKind::AlreadyExists => {
            return Err(JsonFailure::new(
                FailureClass::ConcurrentWriterConflict,
                "Another runtime writer currently holds authoritative mutation authority.",
            ));
        }
        Err(error) => {
            return Err(JsonFailure::new(
                FailureClass::PartialAuthoritativeMutation,
                format!(
                    "Could not acquire write-authority lock {}: {error}",
                    lock_path.display()
                ),
            ));
        }
    };

    writeln!(file, "pid={}", std::process::id()).map_err(|error| {
        let _ = fs::remove_file(&lock_path);
        JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!(
                "Could not initialize write-authority lock {}: {error}",
                lock_path.display()
            ),
        )
    })?;
    Ok(StepWriteAuthorityGuard { lock_path })
}

#[derive(Debug, Clone, Default)]
pub(crate) struct StepEvidenceProvenance {
    pub(crate) source_contract_path: Option<String>,
    pub(crate) source_contract_fingerprint: Option<String>,
    pub(crate) source_evaluation_report_fingerprint: Option<String>,
    pub(crate) evaluator_verdict: Option<String>,
    pub(crate) failing_criterion_ids: Vec<String>,
    pub(crate) source_handoff_fingerprint: Option<String>,
    pub(crate) repo_state_baseline_head_sha: Option<String>,
    pub(crate) repo_state_baseline_worktree_fingerprint: Option<String>,
}

pub(crate) struct AuthoritativeTransitionState {
    state_path: PathBuf,
    state_payload: Value,
    phase: Option<String>,
    active_contract: Option<ActiveContractState>,
    dirty: bool,
}

impl AuthoritativeTransitionState {
    pub(crate) fn apply_note_reset_policy(
        &mut self,
        note_state: NoteState,
    ) -> Result<(), JsonFailure> {
        if !matches!(note_state, NoteState::Blocked | NoteState::Interrupted) {
            return Ok(());
        }
        let Some(active_contract) = self.active_contract.as_ref() else {
            return Ok(());
        };
        let reset_policy = active_contract.contract.reset_policy.trim();
        if !matches!(reset_policy, "adaptive" | "chunk-boundary") {
            return Ok(());
        }

        let pivot_threshold = json_u64(&self.state_payload, "current_chunk_pivot_threshold");
        let retry_count = json_u64(&self.state_payload, "current_chunk_retry_count");
        let next_phase = if pivot_threshold > 0 && retry_count >= pivot_threshold {
            "pivot_required"
        } else {
            "handoff_required"
        };

        let root = self.root_object_mut()?;
        root.insert(
            String::from("harness_phase"),
            Value::String(next_phase.to_owned()),
        );
        root.insert(String::from("handoff_required"), Value::Bool(true));
        root.insert(
            String::from("aggregate_evaluation_state"),
            Value::String(String::from("blocked")),
        );

        self.phase = Some(next_phase.to_owned());
        self.dirty = true;
        Ok(())
    }

    pub(crate) fn stale_reopen_provenance(&mut self) -> Result<(), JsonFailure> {
        let root = self.root_object_mut()?;
        for field in [
            "last_evaluation_report_path",
            "last_evaluation_report_fingerprint",
            "last_evaluation_evaluator_kind",
            "last_evaluation_verdict",
            "last_handoff_path",
            "last_handoff_fingerprint",
            "last_final_review_artifact_fingerprint",
            "last_browser_qa_artifact_fingerprint",
            "last_release_docs_artifact_fingerprint",
        ] {
            root.insert(field.to_owned(), Value::Null);
        }
        root.insert(
            String::from("final_review_state"),
            Value::String(String::from("stale")),
        );
        root.insert(
            String::from("browser_qa_state"),
            Value::String(String::from("stale")),
        );
        root.insert(
            String::from("release_docs_state"),
            Value::String(String::from("stale")),
        );
        self.dirty = true;
        Ok(())
    }

    pub(crate) fn evidence_provenance(&self) -> StepEvidenceProvenance {
        StepEvidenceProvenance {
            source_contract_path: json_string(&self.state_payload, "active_contract_path"),
            source_contract_fingerprint: json_string(
                &self.state_payload,
                "active_contract_fingerprint",
            ),
            source_evaluation_report_fingerprint: json_string(
                &self.state_payload,
                "last_evaluation_report_fingerprint",
            ),
            evaluator_verdict: json_string(&self.state_payload, "last_evaluation_verdict"),
            failing_criterion_ids: json_string_array(&self.state_payload, "open_failed_criteria"),
            source_handoff_fingerprint: json_string(
                &self.state_payload,
                "last_handoff_fingerprint",
            ),
            repo_state_baseline_head_sha: json_string(
                &self.state_payload,
                "repo_state_baseline_head_sha",
            ),
            repo_state_baseline_worktree_fingerprint: json_string(
                &self.state_payload,
                "repo_state_baseline_worktree_fingerprint",
            ),
        }
    }

    pub(crate) fn persist_if_dirty_with_failpoint(
        &self,
        failpoint: Option<&str>,
    ) -> Result<(), JsonFailure> {
        if !self.dirty {
            return Ok(());
        }
        maybe_trigger_authoritative_state_failpoint(failpoint)?;
        let serialized = serde_json::to_string_pretty(&self.state_payload).map_err(|error| {
            JsonFailure::new(
                FailureClass::PartialAuthoritativeMutation,
                format!(
                    "Could not serialize authoritative harness state mutation {}: {error}",
                    self.state_path.display()
                ),
            )
        })?;
        write_atomic_file(&self.state_path, serialized).map_err(|error| {
            JsonFailure::new(
                FailureClass::PartialAuthoritativeMutation,
                format!(
                    "Could not persist authoritative harness state {}: {error}",
                    self.state_path.display()
                ),
            )
        })
    }

    fn root_object_mut(&mut self) -> Result<&mut serde_json::Map<String, Value>, JsonFailure> {
        self.state_payload.as_object_mut().ok_or_else(|| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Authoritative harness state is malformed in {}: expected a JSON object root.",
                    self.state_path.display()
                ),
            )
        })
    }
}

pub(crate) fn load_authoritative_transition_state(
    context: &ExecutionContext,
) -> Result<Option<AuthoritativeTransitionState>, JsonFailure> {
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
    let state_payload: Value = serde_json::from_str(&source).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state is malformed in {}: {error}",
                state_path.display()
            ),
        )
    })?;
    let gate_state: GateAuthorityState =
        serde_json::from_value(state_payload.clone()).map_err(|error| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Authoritative harness state is malformed in {}: {error}",
                    state_path.display()
                ),
            )
        })?;

    let active_contract = if has_active_contract_pointer(&gate_state) {
        let mut gate = GateState::default();
        let active = require_active_contract_state(context, &gate_state, &mut gate);
        if !gate.allowed {
            return Err(gate_failure(
                gate,
                FailureClass::NonAuthoritativeArtifact,
                "Could not load active authoritative contract state.",
            ));
        }
        if active.is_none() {
            return Err(JsonFailure::new(
                FailureClass::NonAuthoritativeArtifact,
                "Could not load active authoritative contract state.",
            ));
        } else {
            active
        }
    } else {
        None
    };

    Ok(Some(AuthoritativeTransitionState {
        state_path,
        state_payload,
        phase: gate_state.harness_phase.clone(),
        active_contract,
        dirty: false,
    }))
}

pub(crate) fn enforce_authoritative_phase(
    authority: Option<&AuthoritativeTransitionState>,
    command: StepCommand,
) -> Result<(), JsonFailure> {
    let Some(authority) = authority else {
        return Ok(());
    };
    let phase = authority
        .phase
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    match phase {
        Some("handoff_required") => Err(JsonFailure::new(
            FailureClass::IllegalHarnessPhase,
            format!(
                "{} is blocked while the authoritative harness phase is handoff_required.",
                command.as_str()
            ),
        )),
        Some("pivot_required") => Err(JsonFailure::new(
            FailureClass::BlockedOnPlanPivot,
            format!(
                "{} is blocked while the authoritative harness phase is pivot_required.",
                command.as_str()
            ),
        )),
        _ => Ok(()),
    }
}

pub(crate) fn enforce_active_contract_scope(
    authority: Option<&AuthoritativeTransitionState>,
    command: StepCommand,
    task: u32,
    step: u32,
) -> Result<(), JsonFailure> {
    let Some(authority) = authority else {
        return Ok(());
    };
    let Some(active_contract) = authority.active_contract.as_ref() else {
        return Ok(());
    };
    let covered_steps = parse_contract_scope(&active_contract.contract.covered_steps)?;
    if covered_steps.contains(&(task, step)) {
        return Ok(());
    }

    Err(JsonFailure::new(
        FailureClass::ContractMismatch,
        format!(
            "{} target Task {} Step {} is outside the active authoritative contract scope.",
            command.as_str(),
            task,
            step
        ),
    ))
}

fn parse_contract_scope(covered_steps: &[String]) -> Result<BTreeSet<(u32, u32)>, JsonFailure> {
    let mut parsed = BTreeSet::new();
    for step in covered_steps {
        let Some(step_ref) = parse_task_step_scope(step) else {
            return Err(JsonFailure::new(
                FailureClass::ContractMismatch,
                "Execution contract covered_steps entries must use `Task <n> Step <m>` scope format.",
            ));
        };
        parsed.insert(step_ref);
    }
    Ok(parsed)
}

fn parse_task_step_scope(value: &str) -> Option<(u32, u32)> {
    let mut parts = value.split_whitespace();
    if parts.next()? != "Task" {
        return None;
    }
    let task = parts.next()?.parse::<u32>().ok()?;
    if parts.next()? != "Step" {
        return None;
    }
    let step = parts.next()?.parse::<u32>().ok()?;
    if parts.next().is_some() {
        return None;
    }
    Some((task, step))
}

fn has_active_contract_pointer(state: &GateAuthorityState) -> bool {
    state
        .active_contract_path
        .as_deref()
        .is_some_and(|value| !value.trim().is_empty())
        || state
            .active_contract_fingerprint
            .as_deref()
            .is_some_and(|value| !value.trim().is_empty())
}

fn gate_failure(
    gate: GateState,
    default_class: FailureClass,
    default_message: &str,
) -> JsonFailure {
    let error_class = if gate.failure_class.is_empty() {
        default_class.as_str().to_owned()
    } else {
        gate.failure_class
    };
    let message = gate
        .diagnostics
        .first()
        .map(|diagnostic| diagnostic.message.clone())
        .unwrap_or_else(|| default_message.to_owned());
    JsonFailure {
        error_class,
        message,
    }
}

fn maybe_trigger_authoritative_state_failpoint(failpoint: Option<&str>) -> Result<(), JsonFailure> {
    let Some(failpoint) = failpoint else {
        return Ok(());
    };
    if std::env::var("FEATUREFORGE_PLAN_EXECUTION_TEST_FAILPOINT")
        .ok()
        .as_deref()
        == Some(failpoint)
    {
        return Err(JsonFailure::new(
            FailureClass::PartialAuthoritativeMutation,
            format!("Injected plan execution failpoint: {failpoint}"),
        ));
    }
    Ok(())
}

fn json_string(payload: &Value, key: &str) -> Option<String> {
    payload
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

fn json_u64(payload: &Value, key: &str) -> u64 {
    payload.get(key).and_then(Value::as_u64).unwrap_or(0)
}

fn json_string_array(payload: &Value, key: &str) -> Vec<String> {
    payload
        .get(key)
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_owned)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}
