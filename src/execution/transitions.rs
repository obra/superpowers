use std::collections::BTreeSet;
use std::fs::{self, OpenOptions};
use std::io::{ErrorKind, Write};
use std::path::PathBuf;

use jiff::Timestamp;
use serde_json::Value;

use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::gates::{
    ActiveContractState, GateAuthorityState, require_active_contract_state,
};
use crate::execution::state::{
    ExecutionContext, ExecutionRuntime, GateState, NoteState, task_completion_lineage_fingerprint,
};
use crate::git::sha256_hex;
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

    pub(crate) fn ensure_initial_dispatch_strategy_checkpoint(
        &mut self,
        context: &ExecutionContext,
        execution_mode: &str,
    ) -> Result<(), JsonFailure> {
        let has_checkpoint = self
            .state_payload
            .get("last_strategy_checkpoint_fingerprint")
            .and_then(Value::as_str)
            .map(str::trim)
            .is_some_and(|value| !value.is_empty());
        if has_checkpoint {
            return Ok(());
        }
        self.record_strategy_checkpoint(
            context,
            "initial_dispatch",
            execution_mode,
            &[],
            "Runtime recorded the initial dispatch strategy checkpoint before repo-writing execution.",
            false,
        )?;
        Ok(())
    }

    pub(crate) fn record_reopen_strategy_checkpoint(
        &mut self,
        context: &ExecutionContext,
        execution_mode: &str,
        task: u32,
        step: u32,
        reason: &str,
    ) -> Result<(), JsonFailure> {
        self.ensure_initial_dispatch_strategy_checkpoint(context, execution_mode)?;
        if self.consume_task_dispatch_credit(task)? {
            let cycle_count = self.current_task_cycle_count(task)?;
            let cycle_breaking = self
                .state_payload
                .get("strategy_checkpoint_kind")
                .and_then(Value::as_str)
                .is_some_and(|value| value == "cycle_break")
                || self
                    .state_payload
                    .get("strategy_state")
                    .and_then(Value::as_str)
                    .is_some_and(|value| value == "cycle_breaking");
            let trigger_cycle = if cycle_count == 0 { 1 } else { cycle_count };
            let trigger = vec![format!(
                "task-{task}:step-{step}:cycle-{trigger_cycle}:reopen-after-review-dispatch"
            )];
            if cycle_breaking || cycle_count >= 3 {
                self.record_strategy_checkpoint(
                    context,
                    "cycle_break",
                    execution_mode,
                    &trigger,
                    "Runtime preserved cycle-break strategy while reopening remediation after a bound review dispatch.",
                    true,
                )?;
                self.set_task_cycle_count(task, 0)?;
            } else {
                self.record_strategy_checkpoint(
                    context,
                    "review_remediation",
                    execution_mode,
                    &trigger,
                    reason,
                    false,
                )?;
            }
            return Ok(());
        }
        let stale_bound_dispatch_tasks = self.clear_task_dispatch_credits()?;
        for stale_task in stale_bound_dispatch_tasks {
            self.decrement_task_cycle_count(stale_task)?;
        }
        let bound_unbound_dispatch = self.consume_unbound_dispatch_credit()?;
        let cycle_count = self.increment_task_cycle_count(task)?;
        let trigger = if bound_unbound_dispatch {
            vec![format!(
                "task-{task}:step-{step}:cycle-{cycle_count}:bound-from-unbound-review-dispatch"
            )]
        } else {
            vec![format!("task-{task}:step-{step}:cycle-{cycle_count}")]
        };
        if cycle_count >= 3 {
            self.record_strategy_checkpoint(
                context,
                "cycle_break",
                execution_mode,
                &trigger,
                "Runtime detected churn after three reviewable dispatch/remediation cycles for the same task and auto-entered cycle-break strategy.",
                true,
            )?;
            self.set_task_cycle_count(task, 0)?;
        } else {
            self.record_strategy_checkpoint(
                context,
                "review_remediation",
                execution_mode,
                &trigger,
                reason,
                false,
            )?;
        }
        Ok(())
    }

    pub(crate) fn record_review_dispatch_strategy_checkpoint(
        &mut self,
        context: &ExecutionContext,
        execution_mode: &str,
        cycle_target: Option<(u32, u32)>,
    ) -> Result<(), JsonFailure> {
        self.ensure_initial_dispatch_strategy_checkpoint(context, execution_mode)?;
        self.clear_dispatch_credits()?;
        let (trigger, rationale, cycle_count, task_binding) = match cycle_target {
            Some((task, step)) => {
                let cycle_count = self.increment_task_cycle_count(task)?;
                self.increment_task_dispatch_credit(task)?;
                (
                    vec![format!(
                        "task-{task}:step-{step}:cycle-{cycle_count}:review-dispatch"
                    )],
                    format!(
                        "Runtime recorded reviewer dispatch cycle tracking for task {task} step {step}."
                    ),
                    cycle_count,
                    Some(task),
                )
            }
            None => {
                let pending = self.increment_unbound_dispatch_credit()?;
                (
                    vec![format!(
                        "task-unbound:step-unbound:pending-review-dispatch-{pending}"
                    )],
                    String::from(
                        "Runtime recorded reviewer dispatch cycle tracking for completed-plan review pending reopen task binding.",
                    ),
                    0,
                    None,
                )
            }
        };
        let checkpoint_fingerprint = if cycle_count >= 3 {
            self.record_strategy_checkpoint(
                context,
                "cycle_break",
                execution_mode,
                &trigger,
                "Runtime detected churn after three reviewable dispatch/remediation cycles for the same task and auto-entered cycle-break strategy.",
                true,
            )?;
            if let Some(task) = task_binding {
                self.set_task_cycle_count(task, 0)?;
            }
            self.last_strategy_checkpoint_fingerprint()
        } else {
            self.record_strategy_checkpoint(
                context,
                "review_remediation",
                execution_mode,
                &trigger,
                &rationale,
                false,
            )?;
            self.last_strategy_checkpoint_fingerprint()
        };

        if let (Some((task, step)), Some(strategy_checkpoint_fingerprint)) =
            (cycle_target, checkpoint_fingerprint)
            && let Some(task_completion_lineage) = task_completion_lineage_fingerprint(context, task)
        {
            let execution_run_id = self.current_execution_run_id();
            self.upsert_task_dispatch_lineage(
                task,
                &execution_run_id,
                step,
                &strategy_checkpoint_fingerprint,
                &task_completion_lineage,
            )?;
        }
        Ok(())
    }

    fn record_strategy_checkpoint(
        &mut self,
        context: &ExecutionContext,
        checkpoint_kind: &str,
        execution_mode: &str,
        trigger_fingerprints: &[String],
        rationale: &str,
        cycle_breaking: bool,
    ) -> Result<String, JsonFailure> {
        let execution_run_id = self.current_execution_run_id();
        let selected_topology = selected_topology_from_execution_mode(execution_mode);
        let lane_decomposition = context
            .plan_document
            .tasks
            .iter()
            .map(|task| format!("task-{}", task.number))
            .collect::<Vec<_>>();
        let lane_owner_map = lane_decomposition
            .iter()
            .map(|lane| format!("{lane}=runtime"))
            .collect::<Vec<_>>();
        let worktree_plan = if selected_topology == "worktree-backed-parallel" {
            "worktree-backed-isolated-lanes"
        } else {
            "single-worktree-serialized"
        };
        let subagent_dispatch_plan = if selected_topology == "worktree-backed-parallel" {
            "parallel-lane-owned-subagents"
        } else {
            "serial-single-lane-subagent"
        };
        let acceptance_requirements = vec![
            String::from("preflight_accepted"),
            String::from("approved_plan_revision_bound"),
        ];
        let review_requirements = vec![
            String::from("dedicated_final_review"),
            String::from("gate_finish"),
        ];
        let generated_at = Timestamp::now().to_string();
        let trigger_text = if trigger_fingerprints.is_empty() {
            String::from("none")
        } else {
            trigger_fingerprints.join("|")
        };
        let fingerprint = sha256_hex(
            format!(
                "plan={}\nplan_revision={}\nrun={execution_run_id}\ncheckpoint_kind={checkpoint_kind}\nselected_topology={selected_topology}\ntriggers={trigger_text}\nlane_decomposition={}\nlane_owner_map={}\nworktree_plan={worktree_plan}\nsubagent_dispatch_plan={subagent_dispatch_plan}\nacceptance={}\nreview={}\nrationale={}\n",
                context.plan_rel,
                context.plan_document.plan_revision,
                lane_decomposition.join(","),
                lane_owner_map.join(","),
                acceptance_requirements.join(","),
                review_requirements.join(","),
                rationale.trim()
            )
            .as_bytes(),
        );

        let checkpoint = serde_json::json!({
            "source_plan_path": context.plan_rel,
            "source_plan_revision": context.plan_document.plan_revision,
            "execution_run_id": execution_run_id,
            "trigger_fingerprints": trigger_fingerprints,
            "checkpoint_kind": checkpoint_kind,
            "selected_topology": selected_topology,
            "lane_decomposition": lane_decomposition,
            "lane_owner_map": lane_owner_map,
            "worktree_plan": worktree_plan,
            "subagent_dispatch_plan": subagent_dispatch_plan,
            "acceptance_requirements": acceptance_requirements,
            "review_requirements": review_requirements,
            "rationale": rationale.trim(),
            "generated_at": generated_at,
            "fingerprint": fingerprint,
        });

        let root = self.root_object_mut()?;
        let checkpoints = root
            .entry(String::from("strategy_checkpoints"))
            .or_insert_with(|| Value::Array(Vec::new()));
        let Some(checkpoints) = checkpoints.as_array_mut() else {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Authoritative harness strategy_checkpoints must be a JSON array.",
            ));
        };
        checkpoints.push(checkpoint);
        root.insert(
            String::from("strategy_state"),
            Value::String(if cycle_breaking {
                String::from("cycle_breaking")
            } else {
                String::from("ready")
            }),
        );
        root.insert(
            String::from("strategy_checkpoint_kind"),
            Value::String(checkpoint_kind.to_owned()),
        );
        root.insert(
            String::from("last_strategy_checkpoint_fingerprint"),
            Value::String(fingerprint.clone()),
        );
        root.insert(String::from("strategy_reset_required"), Value::Bool(false));
        self.dirty = true;
        Ok(fingerprint)
    }

    fn increment_task_cycle_count(&mut self, task: u32) -> Result<u64, JsonFailure> {
        let root = self.root_object_mut()?;
        let cycle_counts = root
            .entry(String::from("strategy_cycle_counts"))
            .or_insert_with(|| Value::Object(serde_json::Map::new()));
        let Some(cycle_counts) = cycle_counts.as_object_mut() else {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Authoritative harness strategy_cycle_counts must be a JSON object.",
            ));
        };
        let key = format!("task-{task}");
        let current = cycle_counts.get(&key).and_then(Value::as_u64).unwrap_or(0);
        let next = current.saturating_add(1);
        cycle_counts.insert(key, Value::Number(next.into()));
        self.dirty = true;
        Ok(next)
    }

    fn current_task_cycle_count(&mut self, task: u32) -> Result<u64, JsonFailure> {
        let root = self.root_object_mut()?;
        let cycle_counts = root
            .entry(String::from("strategy_cycle_counts"))
            .or_insert_with(|| Value::Object(serde_json::Map::new()));
        let Some(cycle_counts) = cycle_counts.as_object_mut() else {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Authoritative harness strategy_cycle_counts must be a JSON object.",
            ));
        };
        Ok(cycle_counts
            .get(&format!("task-{task}"))
            .and_then(Value::as_u64)
            .unwrap_or(0))
    }

    fn decrement_task_cycle_count(&mut self, task: u32) -> Result<(), JsonFailure> {
        let current = self.current_task_cycle_count(task)?;
        if current == 0 {
            return Ok(());
        }
        self.set_task_cycle_count(task, current.saturating_sub(1))
    }

    fn set_task_cycle_count(&mut self, task: u32, value: u64) -> Result<(), JsonFailure> {
        let root = self.root_object_mut()?;
        let cycle_counts = root
            .entry(String::from("strategy_cycle_counts"))
            .or_insert_with(|| Value::Object(serde_json::Map::new()));
        let Some(cycle_counts) = cycle_counts.as_object_mut() else {
            return Err(JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Authoritative harness strategy_cycle_counts must be a JSON object.",
            ));
        };
        cycle_counts.insert(format!("task-{task}"), Value::Number(value.into()));
        self.dirty = true;
        Ok(())
    }

    fn dispatch_credit_counts_mut(
        &mut self,
    ) -> Result<&mut serde_json::Map<String, Value>, JsonFailure> {
        let root = self.root_object_mut()?;
        let credits = root
            .entry(String::from("strategy_review_dispatch_credits"))
            .or_insert_with(|| Value::Object(serde_json::Map::new()));
        credits.as_object_mut().ok_or_else(|| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Authoritative harness strategy_review_dispatch_credits must be a JSON object.",
            )
        })
    }

    fn dispatch_lineage_records_mut(
        &mut self,
    ) -> Result<&mut serde_json::Map<String, Value>, JsonFailure> {
        let root = self.root_object_mut()?;
        let lineage = root
            .entry(String::from("strategy_review_dispatch_lineage"))
            .or_insert_with(|| Value::Object(serde_json::Map::new()));
        lineage.as_object_mut().ok_or_else(|| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                "Authoritative harness strategy_review_dispatch_lineage must be a JSON object.",
            )
        })
    }

    fn upsert_task_dispatch_lineage(
        &mut self,
        task: u32,
        execution_run_id: &str,
        source_step: u32,
        strategy_checkpoint_fingerprint: &str,
        task_completion_lineage_fingerprint: &str,
    ) -> Result<(), JsonFailure> {
        let lineage = self.dispatch_lineage_records_mut()?;
        lineage.insert(
            format!("task-{task}"),
            serde_json::json!({
                "execution_run_id": execution_run_id,
                "source_task": task,
                "source_step": source_step,
                "strategy_checkpoint_fingerprint": strategy_checkpoint_fingerprint,
                "task_completion_lineage_fingerprint": task_completion_lineage_fingerprint,
            }),
        );
        self.dirty = true;
        Ok(())
    }

    fn current_execution_run_id(&self) -> String {
        self.state_payload
            .get("run_identity")
            .and_then(Value::as_object)
            .and_then(|run_identity| run_identity.get("execution_run_id"))
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("unknown-run")
            .to_owned()
    }

    fn last_strategy_checkpoint_fingerprint(&self) -> Option<String> {
        self.state_payload
            .get("last_strategy_checkpoint_fingerprint")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
    }

    fn increment_task_dispatch_credit(&mut self, task: u32) -> Result<u64, JsonFailure> {
        let key = format!("task-{task}");
        let credits = self.dispatch_credit_counts_mut()?;
        credits.insert(key, Value::Number(1_u64.into()));
        self.dirty = true;
        Ok(1)
    }

    fn consume_task_dispatch_credit(&mut self, task: u32) -> Result<bool, JsonFailure> {
        let key = format!("task-{task}");
        let credits = self.dispatch_credit_counts_mut()?;
        if !credits.contains_key(&key) {
            return Ok(false);
        }
        credits.remove(&key);
        self.dirty = true;
        Ok(true)
    }

    fn increment_unbound_dispatch_credit(&mut self) -> Result<u64, JsonFailure> {
        let credits = self.dispatch_credit_counts_mut()?;
        credits.insert(String::from("unbound"), Value::Number(1_u64.into()));
        self.dirty = true;
        Ok(1)
    }

    fn consume_unbound_dispatch_credit(&mut self) -> Result<bool, JsonFailure> {
        let credits = self.dispatch_credit_counts_mut()?;
        let key = String::from("unbound");
        if !credits.contains_key(&key) {
            return Ok(false);
        }
        credits.remove(&key);
        self.dirty = true;
        Ok(true)
    }

    fn clear_dispatch_credits(&mut self) -> Result<(), JsonFailure> {
        let credits = self.dispatch_credit_counts_mut()?;
        if credits.is_empty() {
            return Ok(());
        }
        credits.clear();
        self.dirty = true;
        Ok(())
    }

    fn clear_task_dispatch_credits(&mut self) -> Result<Vec<u32>, JsonFailure> {
        let credits = self.dispatch_credit_counts_mut()?;
        let keys = credits
            .keys()
            .filter(|key| key.starts_with("task-"))
            .cloned()
            .collect::<Vec<_>>();
        if keys.is_empty() {
            return Ok(Vec::new());
        }
        let tasks = keys
            .iter()
            .filter_map(|key| key.strip_prefix("task-"))
            .filter_map(|value| value.parse::<u32>().ok())
            .collect::<Vec<_>>();
        for key in keys {
            credits.remove(&key);
        }
        self.dirty = true;
        Ok(tasks)
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
    if json_bool(&authority.state_payload, "strategy_reset_required") {
        return Err(JsonFailure::new(
            FailureClass::BlockedOnPlanPivot,
            format!(
                "{} is blocked while runtime strategy reset is required.",
                command.as_str()
            ),
        ));
    }
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

fn json_bool(payload: &Value, key: &str) -> bool {
    payload.get(key).and_then(Value::as_bool).unwrap_or(false)
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

fn selected_topology_from_execution_mode(execution_mode: &str) -> &'static str {
    match execution_mode.trim() {
        "featureforge:subagent-driven-development" => "worktree-backed-parallel",
        _ => "conservative-fallback",
    }
}
