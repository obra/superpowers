use assert_cmd::cargo::CommandCargoExt;
use featureforge::contracts::harness::{WorktreeLease, WorktreeLeaseState};
use featureforge::execution::authority::{
    persist_active_worktree_lease_index, write_authoritative_unit_review_receipt_artifact,
    write_authoritative_worktree_lease_artifact,
};
use featureforge::execution::harness::{
    ChunkId, ExecutionRunId, RunIdentitySnapshot, WorktreeLeaseBindingSnapshot,
};
use featureforge::execution::state::{
    ExecutionRuntime, gate_finish_from_context, load_execution_context, preflight_from_context,
};
use featureforge::paths::{branch_storage_key, harness_authoritative_artifact_path};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

type HarnessStateFixtureInput<'a> = (
    &'a Path,
    &'a Path,
    &'a str,
    &'a str,
    &'a str,
    &'a [&'a str],
    &'a [&'a str],
    bool,
);

const FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT: &str =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

macro_rules! write_harness_state_fixture {
    ($repo:expr, $state:expr, $harness_phase:expr, $active_contract_path:expr, $active_contract_fingerprint:expr, $required_evaluator_kinds:expr, $pending_evaluator_kinds:expr, $handoff_required:expr $(,)?) => {{
        write_harness_state_fixture_impl((
            $repo,
            $state,
            $harness_phase,
            $active_contract_path,
            $active_contract_fingerprint,
            $required_evaluator_kinds,
            $pending_evaluator_kinds,
            $handoff_required,
        ))
    }};
}

macro_rules! write_execution_evaluation_artifact_custom {
    ($repo:expr, $artifact_rel:expr, $contract_fingerprint:expr, $evaluator_kind:expr, $authoritative_sequence:expr, $verdict:expr, $criterion_results_section:expr, $affected_steps:expr, $evidence_refs_section:expr, $recommended_action:expr, $summary:expr, $fingerprint_override:expr $(,)?) => {{
        write_execution_evaluation_artifact_custom_impl((
            $repo,
            $artifact_rel,
            $contract_fingerprint,
            $evaluator_kind,
            $authoritative_sequence,
            $verdict,
            $criterion_results_section,
            $affected_steps,
            $evidence_refs_section,
            $recommended_action,
            $summary,
            $fingerprint_override,
        ))
    }};
}

macro_rules! write_execution_handoff_artifact_custom {
    ($repo:expr, $artifact_rel:expr, $contract_fingerprint:expr, $authoritative_sequence:expr, $satisfied_criteria:expr, $open_criteria:expr, $open_findings:expr, $next_action:expr, $workspace_notes:expr, $fingerprint_override:expr $(,)?) => {{
        write_execution_handoff_artifact_custom_impl((
            $repo,
            $artifact_rel,
            $contract_fingerprint,
            $authoritative_sequence,
            $satisfied_criteria,
            $open_criteria,
            $open_findings,
            $next_action,
            $workspace_notes,
            $fingerprint_override,
        ))
    }};
}

macro_rules! write_worktree_lease_artifact_for_run_identity_with_fingerprint {
    ($repo:expr, $state:expr, $execution_run_id:expr, $chunk_id:expr, $source_plan_path:expr, $source_plan_revision:expr, $authoritative_sequence:expr, $lease_state:expr, $cleanup_state:expr, $reviewed_checkpoint_commit_sha:expr, $label:expr, $index_active_fingerprint:expr $(,)?) => {{
        write_worktree_lease_artifact_for_run_identity_with_fingerprint_impl((
            $repo,
            $state,
            $execution_run_id,
            $chunk_id,
            $source_plan_path,
            $source_plan_revision,
            $authoritative_sequence,
            $lease_state,
            $cleanup_state,
            $reviewed_checkpoint_commit_sha,
            $label,
            $index_active_fingerprint,
        ))
    }};
}

macro_rules! write_worktree_lease_artifact_for_run_identity_with_fingerprint_and_branches {
    ($repo:expr, $state:expr, $execution_run_id:expr, $chunk_id:expr, $source_plan_path:expr, $source_plan_revision:expr, $authoritative_sequence:expr, $lease_state:expr, $cleanup_state:expr, $reviewed_checkpoint_commit_sha:expr, $label:expr, $index_active_fingerprint:expr, $source_branch:expr, $authoritative_integration_branch:expr $(,)?) => {{
        write_worktree_lease_artifact_for_run_identity_with_fingerprint_and_branches_impl((
            $repo,
            $state,
            $execution_run_id,
            $chunk_id,
            $source_plan_path,
            $source_plan_revision,
            $authoritative_sequence,
            $lease_state,
            $cleanup_state,
            $reviewed_checkpoint_commit_sha,
            $label,
            $index_active_fingerprint,
            $source_branch,
            $authoritative_integration_branch,
        ))
    }};
}

macro_rules! write_worktree_lease_artifact_for_run_identity {
    ($repo:expr, $state:expr, $execution_run_id:expr, $chunk_id:expr, $source_plan_path:expr, $source_plan_revision:expr, $authoritative_sequence:expr, $lease_state:expr, $cleanup_state:expr, $reviewed_checkpoint_commit_sha:expr, $label:expr, $index_active_fingerprint:expr $(,)?) => {{
        write_worktree_lease_artifact_for_run_identity_impl((
            $repo,
            $state,
            $execution_run_id,
            $chunk_id,
            $source_plan_path,
            $source_plan_revision,
            $authoritative_sequence,
            $lease_state,
            $cleanup_state,
            $reviewed_checkpoint_commit_sha,
            $label,
            $index_active_fingerprint,
        ))
    }};
}

macro_rules! write_worktree_lease_artifact_for_plan_with_sequence {
    ($repo:expr, $state:expr, $source_plan_path:expr, $source_plan_revision:expr, $authoritative_sequence:expr, $lease_state:expr, $cleanup_state:expr, $reviewed_checkpoint_commit_sha:expr, $label:expr $(,)?) => {{
        write_worktree_lease_artifact_for_plan_with_sequence_impl((
            $repo,
            $state,
            $source_plan_path,
            $source_plan_revision,
            $authoritative_sequence,
            $lease_state,
            $cleanup_state,
            $reviewed_checkpoint_commit_sha,
            $label,
        ))
    }};
}

macro_rules! write_unit_review_receipt_artifact_for_lease {
    ($repo:expr, $state:expr, $execution_run_id:expr, $lease_fingerprint:expr, $approved_task_packet_fingerprint:expr, $execution_unit_id:expr, $source_plan_path:expr, $source_plan_revision:expr, $reviewed_worktree:expr, $reviewed_checkpoint_commit_sha:expr, $label:expr $(,)?) => {{
        write_unit_review_receipt_artifact_for_lease_impl((
            $repo,
            $state,
            $execution_run_id,
            $lease_fingerprint,
            $approved_task_packet_fingerprint,
            $execution_unit_id,
            $source_plan_path,
            $source_plan_revision,
            $reviewed_worktree,
            $reviewed_checkpoint_commit_sha,
            $label,
        ))
    }};
}

const PLAN_REL: &str = "docs/featureforge/plans/2026-03-17-example-execution-plan.md";
const SPEC_REL: &str = "docs/featureforge/specs/2026-03-17-example-execution-plan-design.md";
const EXPECTED_PUBLIC_HARNESS_PHASES: &[&str] = &[
    "implementation_handoff",
    "execution_preflight",
    "contract_drafting",
    "contract_pending_approval",
    "contract_approved",
    "executing",
    "evaluating",
    "repairing",
    "pivot_required",
    "handoff_required",
    "final_review_pending",
    "qa_pending",
    "document_release_pending",
    "ready_for_branch_completion",
];

fn run(mut command: Command, context: &str) -> Output {
    command
        .output()
        .unwrap_or_else(|error| panic!("{context} should run: {error}"))
}

fn run_checked(command: Command, context: &str) -> Output {
    let output = run(command, context);
    assert!(
        output.status.success(),
        "{context} should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    output
}

fn parse_json(output: &Output, context: &str) -> Value {
    assert!(
        output.status.success(),
        "{context} should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stdout)
        .unwrap_or_else(|error| panic!("{context} should emit valid json: {error}"))
}

fn parse_failure_json(output: &Output, context: &str) -> Value {
    assert!(
        !output.status.success(),
        "{context} should fail closed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    serde_json::from_slice(payload)
        .unwrap_or_else(|error| panic!("{context} should emit valid failure json: {error}"))
}

fn missing_null_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| !object.get(*field).is_some_and(Value::is_null))
        .map(str::to_owned)
        .collect()
}

fn missing_string_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| {
            object
                .get(*field)
                .and_then(Value::as_str)
                .is_none_or(str::is_empty)
        })
        .map(str::to_owned)
        .collect()
}

fn assert_exact_public_harness_phase_set() {
    let spec = include_str!(
        "../docs/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md"
    );
    let public_harness_phases: Vec<String> = spec
        .lines()
        .scan(false, |in_phase_section, line| {
            let trimmed = line.trim();
            if trimmed == "### Public phase model" {
                *in_phase_section = true;
                return Some(None);
            }
            if *in_phase_section && trimmed.starts_with("### ") {
                *in_phase_section = false;
                return Some(None);
            }
            if *in_phase_section {
                return Some(
                    trimmed
                        .strip_prefix("- `")
                        .and_then(|value| value.strip_suffix('`'))
                        .map(str::to_owned),
                );
            }
            Some(None)
        })
        .flatten()
        .collect();

    assert_eq!(
        public_harness_phases,
        EXPECTED_PUBLIC_HARNESS_PHASES
            .iter()
            .map(|phase| (*phase).to_owned())
            .collect::<Vec<_>>(),
        "status should pin the exact public HarnessPhase vocabulary from the spec"
    );
}

fn write_file(path: &Path, contents: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("parent directory should be creatable");
    }
    fs::write(path, contents).expect("file should be writable");
}

fn init_repo(name: &str) -> (TempDir, TempDir) {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let repo = repo_dir.path();

    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(repo);
    run_checked(git_init, "git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "FeatureForge Test"])
        .current_dir(repo);
    run_checked(git_config_name, "git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "featureforge-tests@example.com"])
        .current_dir(repo);
    run_checked(git_config_email, "git config user.email");

    write_file(&repo.join("README.md"), &format!("# {name}\n"));

    let mut git_add = Command::new("git");
    git_add.args(["add", "README.md"]).current_dir(repo);
    run_checked(git_add, "git add README");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", "init"]).current_dir(repo);
    run_checked(git_commit, "git commit init");

    (repo_dir, state_dir)
}

fn write_approved_spec(repo: &Path) {
    write_file(
        &repo.join(SPEC_REL),
        r#"# Example Execution Plan Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for plan execution helper regression coverage.
"#,
    );
}

fn write_newer_approved_spec_same_revision_different_path(repo: &Path) {
    write_file(
        &repo.join("docs/featureforge/specs/2026-03-17-example-execution-plan-design-v2.md"),
        r#"# Example Execution Plan Design V2

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec representing a newer approved spec path with the same revision.
"#,
    );
}

fn write_plan(repo: &Path, execution_mode: &str) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** {execution_mode}
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1
- REQ-003 -> Task 2
- VERIFY-001 -> Task 1, Task 2

## Task 1: Core flow

**Spec Coverage:** REQ-001, REQ-002, VERIFY-001
**Task Outcome:** Core execution setup and validation are tracked with canonical execution-state evidence.
**Plan Constraints:**
- Preserve helper-owned execution-state invariants.
- Keep execution evidence grounded in repo-visible artifacts.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`
- Test: `cargo test --test plan_execution`

- [ ] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**

## Task 2: Repair flow

**Spec Coverage:** REQ-003, VERIFY-001
**Task Outcome:** Repair and handoff steps can reopen stale work without losing provenance.
**Plan Constraints:**
- Reuse the same approved plan and evidence path for repairs.
- Keep repair flows fail-closed on stale or malformed state.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`
- Test: `cargo test --test plan_execution`

- [ ] **Step 1: Repair an invalidated prior step**
- [ ] **Step 2: Finalize the execution handoff**
"#
        ),
    );
}

fn write_second_approved_plan_same_spec(repo: &Path, execution_mode: &str) {
    write_file(
        &repo.join("docs/featureforge/plans/2026-03-18-example-execution-plan-v2.md"),
        &format!(
            r#"# Example Execution Plan V2

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** {execution_mode}
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Alternate flow

**Spec Coverage:** REQ-001
**Task Outcome:** Alternate approved plan candidate for ambiguity coverage.
**Plan Constraints:**
- Keep the fixture minimal.
**Open Questions:** none

**Files:**
- Test: `tests/plan_execution.rs`

- [ ] **Step 1: Preserve ambiguity coverage**
"#,
        ),
    );
}

fn write_independent_plan(repo: &Path) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 2
- VERIFY-001 -> Task 1, Task 2

## Task 1: Build parser slice

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** The parser slice can be implemented independently with its own file scope.
**Plan Constraints:**
- Keep parser changes isolated from formatter scope.
- Use canonical repo-relative file paths in the task contract.
**Open Questions:** none

**Files:**
- Modify: `src/parser-slice.sh`
- Modify: `tests/parser-slice.test.sh`
- Test: `bash tests/parser-slice.test.sh`

- [ ] **Step 1: Build parser slice**

## Task 2: Build formatter slice

**Spec Coverage:** REQ-002, VERIFY-001
**Task Outcome:** The formatter slice remains independently executable in the same approved plan revision.
**Plan Constraints:**
- Keep formatter changes isolated from parser scope.
- Preserve canonical task packet scope data.
**Open Questions:** none

**Files:**
- Modify: `src/formatter-slice.sh`
- Modify: `tests/formatter-slice.test.sh`
- Test: `bash tests/formatter-slice.test.sh`

- [ ] **Step 1: Build formatter slice**
"#
        ),
    );
}

fn write_single_step_plan(repo: &Path, execution_mode: &str) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** {execution_mode}
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Single-step fixture

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Single-step fixtures isolate completion and review behavior.
**Plan Constraints:**
- Keep the fixture to one step.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`
- Test: `cargo test --test plan_execution`

- [ ] **Step 1: Complete the single-step fixture**
"#
        ),
    );
}

fn write_two_step_shared_file_plan(repo: &Path, execution_mode: &str) {
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** {execution_mode}
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Shared file flow

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Later completed steps can supersede earlier file proofs for the same repo file.
**Plan Constraints:**
- Keep both steps on the same repo-visible file.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`
- Test: `tests/plan_execution.rs`

- [ ] **Step 1: Produce the initial shared output**
- [ ] **Step 2: Refine the shared output**
"#
        ),
    );
}

fn mark_all_plan_steps_checked(repo: &Path) {
    let path = repo.join(PLAN_REL);
    let source = fs::read_to_string(&path).expect("plan should be readable");
    fs::write(path, source.replace("- [ ] **Step", "- [x] **Step"))
        .expect("plan should be writable");
}

fn add_fenced_step_details(repo: &Path) {
    let path = repo.join(PLAN_REL);
    let source = fs::read_to_string(&path).expect("plan should be readable");
    let updated = source
        .replacen(
            "- [ ] **Step 1: Prepare workspace for execution**",
            "- [ ] **Step 1: Prepare workspace for execution**\n```text\nstatus detail fixture\n```",
            1,
        )
        .replacen(
            "- [ ] **Step 2: Validate the generated output**",
            "- [ ] **Step 2: Validate the generated output**\n```text\nverification detail fixture\n```",
            1,
        )
        .replacen(
            "- [ ] **Step 1: Repair an invalidated prior step**",
            "- [ ] **Step 1: Repair an invalidated prior step**\n```text\nrepair detail fixture\n```",
            1,
        )
        .replacen(
            "- [ ] **Step 2: Finalize the execution handoff**",
            "- [ ] **Step 2: Finalize the execution handoff**\n```text\nhandoff detail fixture\n```",
            1,
        );
    fs::write(path, updated).expect("plan should be writable");
}

fn sha256_hex(contents: &[u8]) -> String {
    let digest = Sha256::digest(contents);
    format!("{digest:x}")
}

fn evidence_rel_path() -> String {
    "docs/featureforge/execution-evidence/2026-03-17-example-execution-plan-r1-evidence.md".into()
}

fn execution_contract_plan_hash(repo: &Path) -> String {
    let source = fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable");
    let mut output = Vec::new();
    let mut current_task = None::<u32>;
    let mut suppress_note = false;

    for line in source.lines() {
        if suppress_note {
            if line.is_empty() || line.starts_with("  **Execution Note:**") {
                continue;
            }
            suppress_note = false;
        }

        if line.starts_with("**Execution Mode:** ") {
            output.push(String::from("**Execution Mode:** none"));
            continue;
        }

        if let Some(rest) = line.strip_prefix("## Task ") {
            current_task = rest
                .split(':')
                .next()
                .and_then(|task| task.parse::<u32>().ok());
            output.push(line.to_owned());
            continue;
        }

        if let Some(stripped) = line.strip_prefix("- [")
            && let Some((mark_and_step, title_suffix)) = stripped.split_once(": ")
            && let Some((_, step_number)) = mark_and_step.split_once("] **Step ")
        {
            let title = title_suffix.trim_end_matches("**");
            output.push(format!("- [ ] **Step {step_number}: {title}**"));
            suppress_note = current_task.is_some();
            continue;
        }

        output.push(line.to_owned());
    }

    sha256_hex(format!("{}\n", output.join("\n")).as_bytes())
}

fn expected_packet_fingerprint(repo: &Path, task: u32, step: u32) -> String {
    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint = sha256_hex(
        &fs::read(repo.join(SPEC_REL)).expect("spec should be readable for packet fingerprint"),
    );
    let payload = format!(
        "plan_path={PLAN_REL}\nplan_revision=1\nplan_fingerprint={plan_fingerprint}\nsource_spec_path={SPEC_REL}\nsource_spec_revision=1\nsource_spec_fingerprint={spec_fingerprint}\ntask_number={task}\nstep_number={step}\n"
    );
    sha256_hex(payload.as_bytes())
}

fn legacy_packet_fingerprint(repo: &Path, task: u32, step: u32) -> String {
    let plan_fingerprint =
        sha256_hex(&fs::read(repo.join(PLAN_REL)).expect("plan should be readable"));
    let spec_fingerprint = sha256_hex(
        &fs::read(repo.join(SPEC_REL)).expect("spec should be readable for packet fingerprint"),
    );
    let payload = format!(
        "plan_path={PLAN_REL}\nplan_revision=1\nplan_fingerprint={plan_fingerprint}\nsource_spec_path={SPEC_REL}\nsource_spec_revision=1\nsource_spec_fingerprint={spec_fingerprint}\ntask_number={task}\nstep_number={step}\n"
    );
    sha256_hex(payload.as_bytes())
}

fn write_v2_completed_attempts_for_finished_plan(repo: &Path) {
    let evidence_path = repo.join(evidence_rel_path());
    let plan_fingerprint =
        sha256_hex(&fs::read(repo.join(PLAN_REL)).expect("plan should be readable for evidence"));
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable for evidence"));
    write_file(&repo.join("docs/example-output.md"), "finished output\n");
    let file_digest = sha256_hex(
        &fs::read(repo.join("docs/example-output.md")).expect("output should be readable"),
    );

    let head_sha = current_head_sha(repo);
    let base_sha = head_sha.clone();
    let mut attempts = String::new();
    for task in 1..=2 {
        for step in 1..=2 {
            attempts.push_str(&format!(
                "### Task {task} Step {step}\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:3{task}{step}Z\n**Execution Source:** featureforge:executing-plans\n**Task Number:** {task}\n**Step Number:** {step}\n**Packet Fingerprint:** {}\n**Head SHA:** {head_sha}\n**Base SHA:** {base_sha}\n**Claim:** Completed task {task} step {step}.\n**Files Proven:**\n- docs/example-output.md | sha256:{file_digest}\n**Verification Summary:** Manual inspection only: Verified by fixture setup.\n**Invalidation Reason:** N/A\n\n",
                expected_packet_fingerprint(repo, task, step)
            ));
        }
    }

    write_file(
        &evidence_path,
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n**Plan Fingerprint:** {plan_fingerprint}\n**Source Spec Path:** {SPEC_REL}\n**Source Spec Revision:** 1\n**Source Spec Fingerprint:** {spec_fingerprint}\n\n## Step Evidence\n\n{attempts}"
        ),
    );
}

fn write_single_step_v2_completed_attempt(repo: &Path, packet_fingerprint: &str) {
    let evidence_path = repo.join(evidence_rel_path());
    let plan_fingerprint =
        sha256_hex(&fs::read(repo.join(PLAN_REL)).expect("plan should be readable for evidence"));
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable for evidence"));
    write_file(&repo.join("docs/example-output.md"), "verified output\n");
    let file_digest = sha256_hex(
        &fs::read(repo.join("docs/example-output.md")).expect("output should be readable"),
    );

    let head_sha = current_head_sha(repo);
    let base_sha = head_sha.clone();
    write_file(
        &evidence_path,
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n**Plan Fingerprint:** {plan_fingerprint}\n**Source Spec Path:** {SPEC_REL}\n**Source Spec Revision:** 1\n**Source Spec Fingerprint:** {spec_fingerprint}\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** featureforge:executing-plans\n**Task Number:** 1\n**Step Number:** 1\n**Packet Fingerprint:** {packet_fingerprint}\n**Head SHA:** {head_sha}\n**Base SHA:** {base_sha}\n**Claim:** Prepared the workspace for execution.\n**Files Proven:**\n- docs/example-output.md | sha256:{file_digest}\n**Verification Summary:** Manual inspection only: Verified by fixture setup.\n**Invalidation Reason:** N/A\n"
        ),
    );
}

fn current_head_sha(repo: &Path) -> String {
    let mut git_rev_parse = Command::new("git");
    git_rev_parse.args(["rev-parse", "HEAD"]).current_dir(repo);
    let output = run_checked(git_rev_parse, "git rev-parse HEAD");
    String::from_utf8(output.stdout)
        .expect("head sha should be utf-8")
        .trim()
        .to_owned()
}

fn branch_name(repo: &Path) -> String {
    let mut git_branch = Command::new("git");
    git_branch
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(repo);
    let output = run_checked(git_branch, "git rev-parse branch");
    String::from_utf8(output.stdout)
        .expect("branch should be utf-8")
        .trim()
        .to_owned()
}

fn normalize_identifier(value: &str) -> String {
    branch_storage_key(value)
}

fn repo_slug(repo: &Path) -> String {
    let output = run_checked(
        {
            let mut command = Command::cargo_bin("featureforge")
                .expect("featureforge binary should be available");
            command.current_dir(repo).args(["repo", "slug"]);
            command
        },
        "featureforge repo slug",
    );
    String::from_utf8(output.stdout)
        .expect("repo slug output should be utf-8")
        .lines()
        .find_map(|line| line.strip_prefix("SLUG="))
        .unwrap_or_else(|| panic!("repo slug output should include SLUG=..., got missing slug"))
        .to_owned()
}

fn write_unresolved_index_entries(repo: &Path) {
    let mut command = Command::new("sh");
    command
        .args([
            "-c",
            r#"ours=$(printf 'ours\n' | git hash-object -w --stdin)
theirs=$(printf 'theirs\n' | git hash-object -w --stdin)
printf '100644 %s 2	conflict.txt\n100644 %s 3	conflict.txt\n' "$ours" "$theirs" | git update-index --index-info"#,
        ])
        .current_dir(repo);
    run_checked(command, "git update-index unresolved entries");
}

fn project_artifact_dir(repo: &Path, state: &Path) -> PathBuf {
    state.join("projects").join(repo_slug(repo))
}

fn harness_branch_dir(repo: &Path, state: &Path) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    state
        .join("projects")
        .join(repo_slug(repo))
        .join("branches")
        .join(safe_branch)
}

fn harness_state_file_path(repo: &Path, state: &Path) -> PathBuf {
    harness_branch_dir(repo, state)
        .join("execution-harness")
        .join("state.json")
}

fn execution_runtime(repo: &Path, state: &Path) -> ExecutionRuntime {
    let git_dir = gix::discover(repo)
        .expect("git repo should be discoverable")
        .path()
        .to_path_buf();
    let branch = branch_name(repo);
    ExecutionRuntime {
        repo_root: repo.to_path_buf(),
        git_dir,
        branch_name: branch.clone(),
        repo_slug: repo_slug(repo),
        safe_branch: normalize_identifier(&branch),
        state_dir: state.to_path_buf(),
    }
}

fn write_harness_state_payload(repo: &Path, state: &Path, payload: &Value) {
    let state_path = harness_state_file_path(repo, state);
    let mut merged = if state_path.is_file() {
        let existing: Value = serde_json::from_str(
            &fs::read_to_string(&state_path)
                .expect("existing harness state should be readable for merge"),
        )
        .expect("existing harness state should be valid json for merge");
        match (existing, payload.clone()) {
            (Value::Object(mut existing), Value::Object(patch)) => {
                for (key, value) in patch {
                    existing.insert(key, value);
                }
                Value::Object(existing)
            }
            (_, replacement) => replacement,
        }
    } else {
        payload.clone()
    };
    if let Value::Object(object) = &mut merged {
        object
            .entry("strategy_state".to_string())
            .or_insert_with(|| Value::from("ready"));
        object
            .entry("strategy_checkpoint_kind".to_string())
            .or_insert_with(|| Value::from("initial_dispatch"));
        object
            .entry("last_strategy_checkpoint_fingerprint".to_string())
            .or_insert_with(|| Value::from(FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT));
        object
            .entry("strategy_reset_required".to_string())
            .or_insert_with(|| Value::Bool(false));
    }
    write_file(
        &state_path,
        &serde_json::to_string_pretty(&merged).expect("harness state payload should serialize"),
    );
}

fn set_harness_state_string_field(repo: &Path, state: &Path, field: &str, value: &str) {
    write_harness_state_payload(repo, state, &json!({ field: value }));
}

fn republish_authoritative_artifact(
    repo: &Path,
    state: &Path,
    artifact_prefix: &str,
    source: &str,
) -> (PathBuf, String) {
    let branch = branch_name(repo);
    let repo_slug = repo_slug(repo);
    let fingerprint = sha256_hex(source.as_bytes());
    let path = harness_authoritative_artifact_path(
        state,
        &repo_slug,
        &branch,
        &format!("{artifact_prefix}-{fingerprint}.md"),
    );
    write_file(&path, source);
    (path, fingerprint)
}

fn republish_authoritative_artifact_from_path(
    repo: &Path,
    state: &Path,
    path: &Path,
    artifact_prefix: &str,
    state_fingerprint_field: &str,
) -> PathBuf {
    let source = fs::read_to_string(path).unwrap_or_else(|error| {
        panic!(
            "authoritative artifact {} should be readable: {error}",
            path.display()
        )
    });
    let (published_path, fingerprint) =
        republish_authoritative_artifact(repo, state, artifact_prefix, &source);
    set_harness_state_string_field(repo, state, state_fingerprint_field, &fingerprint);
    published_path
}

fn current_authoritative_run_identity(repo: &Path, state: &Path) -> (String, String) {
    let state_json: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable for current run identity"),
    )
    .expect("harness state should be valid json for current run identity");
    let run_identity = state_json
        .get("run_identity")
        .and_then(Value::as_object)
        .expect("authoritative harness state should expose run_identity");
    let execution_run_id = run_identity
        .get("execution_run_id")
        .and_then(Value::as_str)
        .expect("authoritative harness state should expose execution_run_id")
        .to_owned();
    let chunk_id = state_json
        .get("chunk_id")
        .and_then(Value::as_str)
        .expect("authoritative harness state should expose chunk_id")
        .to_owned();
    (execution_run_id, chunk_id)
}

fn current_active_contract_fingerprint(repo: &Path, state: &Path) -> String {
    let state_json: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable for active contract fingerprint"),
    )
    .expect("harness state should be valid json for active contract fingerprint");
    state_json
        .get("active_contract_fingerprint")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .expect("authoritative harness state should expose active_contract_fingerprint")
        .to_owned()
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

fn append_active_worktree_lease_fingerprint(repo: &Path, state: &Path, fingerprint: &str) {
    let state_path = harness_state_file_path(repo, state);
    let mut state_json: Value = serde_json::from_str(
        &fs::read_to_string(&state_path)
            .expect("harness state should be readable to append active lease fingerprint"),
    )
    .expect("harness state should be valid json to append active lease fingerprint");
    let state_object = state_json
        .as_object_mut()
        .expect("harness state should remain a JSON object");
    let entry = state_object
        .entry(String::from("active_worktree_lease_fingerprints"))
        .or_insert_with(|| Value::Array(Vec::new()));
    let entry_array = entry
        .as_array_mut()
        .expect("active_worktree_lease_fingerprints should be an array");
    if !entry_array
        .iter()
        .any(|value| value.as_str().is_some_and(|value| value == fingerprint))
    {
        entry_array.push(Value::String(fingerprint.to_owned()));
    }
    write_file(
        &state_path,
        &serde_json::to_string_pretty(&state_json)
            .expect("harness state should serialize after appending lease fingerprint"),
    );
}

fn append_active_worktree_lease_binding(repo: &Path, state: &Path, mut binding: Value) {
    let state_path = harness_state_file_path(repo, state);
    let mut state_json: Value = serde_json::from_str(
        &fs::read_to_string(&state_path)
            .expect("harness state should be readable to append active lease binding"),
    )
    .expect("harness state should be valid json to append active lease binding");
    let active_contract_fingerprint = state_json
        .get("active_contract_fingerprint")
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .map(str::to_owned);
    let state_object = state_json
        .as_object_mut()
        .expect("harness state should remain a JSON object");
    let entry = state_object
        .entry(String::from("active_worktree_lease_bindings"))
        .or_insert_with(|| Value::Array(Vec::new()));
    let entry_array = entry
        .as_array_mut()
        .expect("active_worktree_lease_bindings should be an array");
    if let Some(binding_object) = binding.as_object_mut() {
        if binding_object
            .get("execution_context_key")
            .is_none_or(Value::is_null)
        {
            let receipt_artifact_path = binding_object
                .get("review_receipt_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty());
            let lease_artifact_path = binding_object
                .get("lease_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty());
            let from_receipt = receipt_artifact_path.and_then(|receipt_artifact_path| {
                let receipt_path = harness_authoritative_artifact_path(
                    state,
                    &repo_slug(repo),
                    &branch_name(repo),
                    receipt_artifact_path,
                );
                fs::read_to_string(&receipt_path)
                    .ok()
                    .and_then(|receipt_source| {
                        execution_context_key_from_unit_review_receipt(&receipt_source)
                    })
            });
            let from_lease = lease_artifact_path.and_then(|lease_artifact_path| {
                let lease_path = harness_authoritative_artifact_path(
                    state,
                    &repo_slug(repo),
                    &branch_name(repo),
                    lease_artifact_path,
                );
                fs::read_to_string(&lease_path)
                    .ok()
                    .and_then(|lease_source| {
                        execution_context_key_from_worktree_lease(&lease_source)
                    })
            });
            if let Some(execution_context_key) = from_receipt.or(from_lease) {
                binding_object.insert(
                    String::from("execution_context_key"),
                    Value::String(execution_context_key),
                );
            }
        }
        if binding_object
            .get("reviewed_checkpoint_commit_sha")
            .is_none_or(Value::is_null)
            && let Some(receipt_artifact_path) = binding_object
                .get("review_receipt_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty())
        {
            let receipt_path = harness_authoritative_artifact_path(
                state,
                &repo_slug(repo),
                &branch_name(repo),
                receipt_artifact_path,
            );
            if let Ok(receipt_source) = fs::read_to_string(&receipt_path)
                && let Some(reviewed_checkpoint_commit_sha) =
                    reviewed_checkpoint_from_unit_review_receipt(&receipt_source)
            {
                binding_object.insert(
                    String::from("reviewed_checkpoint_commit_sha"),
                    Value::String(reviewed_checkpoint_commit_sha),
                );
            }
        }
        if binding_object
            .get("approved_task_packet_fingerprint")
            .is_none_or(Value::is_null)
            && let Some(receipt_artifact_path) = binding_object
                .get("review_receipt_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty())
        {
            let receipt_path = harness_authoritative_artifact_path(
                state,
                &repo_slug(repo),
                &branch_name(repo),
                receipt_artifact_path,
            );
            if let Ok(receipt_source) = fs::read_to_string(&receipt_path)
                && let Some(approved_task_packet_fingerprint) =
                    approved_task_packet_from_unit_review_receipt(&receipt_source)
            {
                binding_object.insert(
                    String::from("approved_task_packet_fingerprint"),
                    Value::String(approved_task_packet_fingerprint),
                );
            }
        }
        if binding_object
            .get("approved_unit_contract_fingerprint")
            .is_none_or(Value::is_null)
        {
            if let (
                Some(active_contract_fingerprint),
                Some(task_packet_fingerprint),
                Some(execution_unit_id),
            ) = (
                active_contract_fingerprint.as_deref(),
                binding_object
                    .get("approved_task_packet_fingerprint")
                    .and_then(Value::as_str)
                    .filter(|value| !value.trim().is_empty()),
                binding_object
                    .get("execution_unit_id")
                    .and_then(Value::as_str)
                    .filter(|value| !value.trim().is_empty()),
            ) {
                binding_object.insert(
                    String::from("approved_unit_contract_fingerprint"),
                    Value::String(approved_unit_contract_fingerprint_for_review(
                        active_contract_fingerprint,
                        task_packet_fingerprint,
                        execution_unit_id,
                    )),
                );
            } else if let Some(receipt_artifact_path) = binding_object
                .get("review_receipt_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty())
            {
                let receipt_path = harness_authoritative_artifact_path(
                    state,
                    &repo_slug(repo),
                    &branch_name(repo),
                    receipt_artifact_path,
                );
                if let Ok(receipt_source) = fs::read_to_string(&receipt_path)
                    && let Some(approved_unit_contract_fingerprint) =
                        approved_unit_contract_from_unit_review_receipt(&receipt_source)
                {
                    binding_object.insert(
                        String::from("approved_unit_contract_fingerprint"),
                        Value::String(approved_unit_contract_fingerprint),
                    );
                }
            }
        }
        if binding_object
            .get("reconcile_result_proof_fingerprint")
            .is_none_or(Value::is_null)
            && let Some(receipt_artifact_path) = binding_object
                .get("review_receipt_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty())
        {
            let receipt_path = harness_authoritative_artifact_path(
                state,
                &repo_slug(repo),
                &branch_name(repo),
                receipt_artifact_path,
            );
            if let Ok(receipt_source) = fs::read_to_string(&receipt_path) {
                if let Some(reconcile_result_proof_fingerprint) =
                    reconcile_result_proof_fingerprint_from_unit_review_receipt(&receipt_source)
                {
                    binding_object.insert(
                        String::from("reconcile_result_proof_fingerprint"),
                        Value::String(reconcile_result_proof_fingerprint),
                    );
                } else if let Some(lease_artifact_path) = binding_object
                    .get("lease_artifact_path")
                    .and_then(Value::as_str)
                    .filter(|value| !value.trim().is_empty())
                {
                    let lease_path = harness_authoritative_artifact_path(
                        state,
                        &repo_slug(repo),
                        &branch_name(repo),
                        lease_artifact_path,
                    );
                    if let Ok(lease_source) = fs::read_to_string(&lease_path)
                        && let Some(reconcile_result_proof_fingerprint) =
                            reconcile_result_proof_fingerprint_from_worktree_lease(&lease_source)
                    {
                        binding_object.insert(
                            String::from("reconcile_result_proof_fingerprint"),
                            Value::String(reconcile_result_proof_fingerprint),
                        );
                    }
                }
            }
        }
        if binding_object
            .get("reconcile_mode")
            .is_none_or(Value::is_null)
            && let Some(receipt_artifact_path) = binding_object
                .get("review_receipt_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty())
        {
            let receipt_path = harness_authoritative_artifact_path(
                state,
                &repo_slug(repo),
                &branch_name(repo),
                receipt_artifact_path,
            );
            if let Ok(receipt_source) = fs::read_to_string(&receipt_path)
                && let Some(reconcile_mode) =
                    reconcile_mode_from_unit_review_receipt(&receipt_source)
            {
                binding_object.insert(
                    String::from("reconcile_mode"),
                    Value::String(reconcile_mode),
                );
            }
        }
        if binding_object
            .get("reconcile_result_commit_sha")
            .is_none_or(Value::is_null)
            && let Some(receipt_artifact_path) = binding_object
                .get("review_receipt_artifact_path")
                .and_then(Value::as_str)
                .filter(|value| !value.trim().is_empty())
        {
            let receipt_path = harness_authoritative_artifact_path(
                state,
                &repo_slug(repo),
                &branch_name(repo),
                receipt_artifact_path,
            );
            if let Ok(receipt_source) = fs::read_to_string(&receipt_path) {
                if let Some(reconcile_result_commit_sha) =
                    reconcile_result_commit_sha_from_unit_review_receipt(&receipt_source)
                {
                    binding_object.insert(
                        String::from("reconcile_result_commit_sha"),
                        Value::String(reconcile_result_commit_sha),
                    );
                }
                if binding_object
                    .get("reconcile_result_proof_fingerprint")
                    .is_none_or(Value::is_null)
                {
                    if let Some(reconcile_result_proof_fingerprint) =
                        reconcile_result_proof_fingerprint_from_unit_review_receipt(&receipt_source)
                    {
                        binding_object.insert(
                            String::from("reconcile_result_proof_fingerprint"),
                            Value::String(reconcile_result_proof_fingerprint),
                        );
                    }
                } else if let Some(lease_artifact_path) = binding_object
                    .get("lease_artifact_path")
                    .and_then(Value::as_str)
                    .filter(|value| !value.trim().is_empty())
                {
                    let lease_path = harness_authoritative_artifact_path(
                        state,
                        &repo_slug(repo),
                        &branch_name(repo),
                        lease_artifact_path,
                    );
                    if let Ok(lease_source) = fs::read_to_string(&lease_path) {
                        if let Some(reconcile_result_commit_sha) =
                            reconcile_result_commit_sha_from_worktree_lease(&lease_source)
                        {
                            binding_object.insert(
                                String::from("reconcile_result_commit_sha"),
                                Value::String(reconcile_result_commit_sha),
                            );
                        }
                        if binding_object
                            .get("reconcile_result_proof_fingerprint")
                            .is_none_or(Value::is_null)
                            && let Some(reconcile_result_proof_fingerprint) =
                                reconcile_result_proof_fingerprint_from_worktree_lease(
                                    &lease_source,
                                )
                        {
                            binding_object.insert(
                                String::from("reconcile_result_proof_fingerprint"),
                                Value::String(reconcile_result_proof_fingerprint),
                            );
                        }
                    }
                }
            }
        }
    }
    entry_array.push(binding);
    write_file(
        &state_path,
        &serde_json::to_string_pretty(&state_json)
            .expect("harness state should serialize after appending lease binding"),
    );
}

fn write_harness_state_fixture_impl(input: HarnessStateFixtureInput<'_>) {
    let (
        repo,
        state,
        harness_phase,
        active_contract_path,
        active_contract_fingerprint,
        required_evaluator_kinds,
        pending_evaluator_kinds,
        handoff_required,
    ) = input;
    let source_contract = fs::read_to_string(repo.join(active_contract_path))
        .expect("harness-state fixture source contract should be readable");
    let authoritative_contract_file = format!("contract-{active_contract_fingerprint}.md");
    let authoritative_contract_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &authoritative_contract_file,
    );
    write_file(&authoritative_contract_path, &source_contract);

    let payload = json!({
        "schema_version": 1,
        "harness_phase": harness_phase,
        "latest_authoritative_sequence": 0,
        "active_contract_path": authoritative_contract_file,
        "active_contract_fingerprint": active_contract_fingerprint,
        "required_evaluator_kinds": required_evaluator_kinds,
        "completed_evaluator_kinds": [],
        "pending_evaluator_kinds": pending_evaluator_kinds,
        "non_passing_evaluator_kinds": [],
        "aggregate_evaluation_state": "pending",
        "current_chunk_retry_count": 0,
        "current_chunk_retry_budget": 1,
        "current_chunk_pivot_threshold": 1,
        "handoff_required": handoff_required,
        "open_failed_criteria": []
    });
    write_harness_state_payload(repo, state, &payload);
}

fn write_execution_contract_artifact(
    repo: &Path,
    artifact_rel: &str,
    fingerprint_override: Option<&str>,
) -> String {
    write_execution_contract_artifact_custom(
        repo,
        artifact_rel,
        17,
        "[]",
        1,
        1,
        fingerprint_override,
    )
}

fn write_execution_contract_artifact_custom(
    repo: &Path,
    artifact_rel: &str,
    authoritative_sequence: u64,
    evidence_requirements_section: &str,
    retry_budget: u32,
    pivot_threshold: u32,
    fingerprint_override: Option<&str>,
) -> String {
    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    let packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let template = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** {authoritative_sequence}
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Preserve active approved-plan scope
**Description:** Contract fixture stays within the approved plan scope.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Fixture criterion for runtime gate validation.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance

**Evidence Requirements:**
{evidence_requirements_section}

**Retry Budget:** {retry_budget}
**Pivot Threshold:** {pivot_threshold}
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let canonical_fingerprint =
        sha256_hex(template.replace("__CONTRACT_FINGERPRINT__", "").as_bytes());
    let declared_fingerprint = fingerprint_override.unwrap_or(canonical_fingerprint.as_str());
    write_file(
        &repo.join(artifact_rel),
        &template.replace("__CONTRACT_FINGERPRINT__", declared_fingerprint),
    );
    canonical_fingerprint
}

fn markdown_list(values: &[&str]) -> String {
    if values.is_empty() {
        String::from("[]")
    } else {
        values
            .iter()
            .map(|value| format!("- {value}"))
            .collect::<Vec<_>>()
            .join("\n")
    }
}

fn replace_section_between_markers(
    source: &str,
    start_marker: &str,
    end_marker: &str,
    replacement: &str,
) -> String {
    let (before, rest) = source
        .split_once(start_marker)
        .unwrap_or_else(|| panic!("fixture should contain marker `{start_marker}`"));
    let (_, after) = rest
        .split_once(end_marker)
        .unwrap_or_else(|| panic!("fixture should contain marker `{end_marker}`"));
    format!("{before}{start_marker}\n{replacement}\n{end_marker}{after}")
}

fn rewrite_contract_verifiers_with_canonical_fingerprint(
    repo: &Path,
    artifact_rel: &str,
    verifiers: &[&str],
) {
    let artifact_path = repo.join(artifact_rel);
    let source =
        fs::read_to_string(&artifact_path).expect("execution contract fixture should be readable");
    let source = replace_section_between_markers(
        &source,
        "**Verifiers:**",
        "**Evidence Requirements:**",
        &markdown_list(verifiers),
    );
    let source =
        replace_markdown_header_value(&source, "Contract Fingerprint", "__CONTRACT_FINGERPRINT__");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&source, "Contract Fingerprint");
    write_file(
        &artifact_path,
        &source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
}

fn rewrite_contract_first_criterion_verifier_types_with_canonical_fingerprint(
    repo: &Path,
    artifact_rel: &str,
    verifier_types: &[&str],
) {
    let artifact_path = repo.join(artifact_rel);
    let source =
        fs::read_to_string(&artifact_path).expect("execution contract fixture should be readable");
    let source = replace_section_between_markers(
        &source,
        "**Verifier Types:**",
        "**Threshold:**",
        &markdown_list(verifier_types),
    );
    let source =
        replace_markdown_header_value(&source, "Contract Fingerprint", "__CONTRACT_FINGERPRINT__");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&source, "Contract Fingerprint");
    write_file(
        &artifact_path,
        &source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
}

fn rewrite_contract_reset_policy_with_canonical_fingerprint(
    repo: &Path,
    artifact_rel: &str,
    reset_policy: &str,
) -> String {
    let artifact_path = repo.join(artifact_rel);
    let source =
        fs::read_to_string(&artifact_path).expect("execution contract fixture should be readable");
    let source = source.replacen(
        "**Reset Policy:** none",
        &format!("**Reset Policy:** {reset_policy}"),
        1,
    );
    assert!(
        source.contains(&format!("**Reset Policy:** {reset_policy}")),
        "fixture should update Reset Policy to `{reset_policy}`"
    );
    let source =
        replace_markdown_header_value(&source, "Contract Fingerprint", "__CONTRACT_FINGERPRINT__");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&source, "Contract Fingerprint");
    write_file(
        &artifact_path,
        &source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    contract_fingerprint
}

fn replace_markdown_header_value(source: &str, header_label: &str, replacement: &str) -> String {
    let marker = format!("**{header_label}:**");
    let mut replaced = false;
    let mut updated = String::with_capacity(source.len() + replacement.len());

    for segment in source.split_inclusive('\n') {
        let (line, newline) = match segment.strip_suffix('\n') {
            Some(line) => (line, "\n"),
            None => (segment, ""),
        };

        if !replaced && let Some(marker_index) = line.find(&marker) {
            let after_marker = &line[marker_index + marker.len()..];
            let leading_whitespace_len = after_marker
                .chars()
                .take_while(|ch| matches!(ch, ' ' | '\t'))
                .map(char::len_utf8)
                .sum::<usize>();
            let leading_whitespace = &after_marker[..leading_whitespace_len];
            updated.push_str(&line[..marker_index + marker.len()]);
            updated.push_str(leading_whitespace);
            updated.push('`');
            updated.push_str(replacement);
            updated.push('`');
            updated.push_str(newline);
            replaced = true;
            continue;
        }

        updated.push_str(line);
        updated.push_str(newline);
    }

    assert!(
        replaced,
        "fixture should contain header `{header_label}` for replacement"
    );
    updated
}

fn canonical_fingerprint_without_header_value(source: &str, header_label: &str) -> String {
    let marker = format!("**{header_label}:**");
    let mut canonical_source = String::with_capacity(source.len());
    let mut replaced = false;

    for segment in source.split_inclusive('\n') {
        let (line, newline) = match segment.strip_suffix('\n') {
            Some(line) => (line, "\n"),
            None => (segment, ""),
        };

        if !replaced && let Some(marker_index) = line.find(&marker) {
            let after_marker = &line[marker_index + marker.len()..];
            let leading_whitespace_len = after_marker
                .chars()
                .take_while(|ch| matches!(ch, ' ' | '\t'))
                .map(char::len_utf8)
                .sum::<usize>();
            canonical_source
                .push_str(&line[..marker_index + marker.len() + leading_whitespace_len]);
            canonical_source.push_str(newline);
            replaced = true;
            continue;
        }

        canonical_source.push_str(segment);
    }

    assert!(
        replaced,
        "fixture should contain header `{header_label}` for canonical fingerprint computation"
    );
    sha256_hex(canonical_source.as_bytes())
}

fn write_execution_contract_with_forged_spec_fingerprint(
    repo: &Path,
    artifact_rel: &str,
    forged_spec_fingerprint: &str,
) -> String {
    write_execution_contract_artifact(repo, artifact_rel, None);
    let artifact_path = repo.join(artifact_rel);
    let source =
        fs::read_to_string(&artifact_path).expect("execution contract fixture should be readable");
    let source =
        replace_markdown_header_value(&source, "Source Spec Fingerprint", forged_spec_fingerprint);
    let source =
        replace_markdown_header_value(&source, "Contract Fingerprint", "__CONTRACT_FINGERPRINT__");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&source, "Contract Fingerprint");
    write_file(
        &artifact_path,
        &source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    contract_fingerprint
}

fn rewrite_artifact_generated_by_with_canonical_fingerprint(
    repo: &Path,
    artifact_rel: &str,
    generated_by: &str,
    fingerprint_header: &str,
) {
    let artifact_path = repo.join(artifact_rel);
    let source =
        fs::read_to_string(&artifact_path).expect("artifact fixture should remain readable");
    let source = replace_markdown_header_value(&source, "Generated By", generated_by);
    let source =
        replace_markdown_header_value(&source, fingerprint_header, "__ARTIFACT_FINGERPRINT__");
    let artifact_fingerprint =
        canonical_fingerprint_without_header_value(&source, fingerprint_header);
    write_file(
        &artifact_path,
        &source.replace("__ARTIFACT_FINGERPRINT__", &artifact_fingerprint),
    );
}

fn write_execution_evaluation_artifact(
    repo: &Path,
    artifact_rel: &str,
    contract_fingerprint: &str,
    evaluator_kind: &str,
    fingerprint_override: Option<&str>,
) -> String {
    write_execution_evaluation_artifact_custom!(
        repo,
        artifact_rel,
        contract_fingerprint,
        evaluator_kind,
        19,
        "pass",
        "[]",
        &[],
        "[]",
        "continue",
        "Required evaluator checks passed for the active contract.",
        fingerprint_override,
    )
}

type ExecutionEvaluationArtifactInput<'a> = (
    &'a Path,
    &'a str,
    &'a str,
    &'a str,
    u64,
    &'a str,
    &'a str,
    &'a [&'a str],
    &'a str,
    &'a str,
    &'a str,
    Option<&'a str>,
);

fn write_execution_evaluation_artifact_custom_impl(
    input: ExecutionEvaluationArtifactInput<'_>,
) -> String {
    let (
        repo,
        artifact_rel,
        contract_fingerprint,
        evaluator_kind,
        authoritative_sequence,
        verdict,
        criterion_results_section,
        affected_steps,
        evidence_refs_section,
        recommended_action,
        summary,
        fingerprint_override,
    ) = input;
    let plan_fingerprint = execution_contract_plan_hash(repo);
    let affected_steps_section = if affected_steps.is_empty() {
        String::from("[]")
    } else {
        affected_steps
            .iter()
            .map(|step| format!("- {step}"))
            .collect::<Vec<_>>()
            .join("\n")
    };
    let template = format!(
        r#"# Evaluation Report

**Report Version:** 1
**Authoritative Sequence:** {authoritative_sequence}
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Contract Fingerprint:** `{contract_fingerprint}`
**Evaluator Kind:** {evaluator_kind}
**Verdict:** {verdict}
**Criterion Results:**
{criterion_results_section}
**Affected Steps:**
{affected_steps_section}
**Evidence Refs:**
{evidence_refs_section}
**Recommended Action:** {recommended_action}
**Summary:** {summary}
**Generated By:** featureforge:{evaluator_kind}
**Generated At:** 2026-03-25T12:10:00Z
**Report Fingerprint:** __REPORT_FINGERPRINT__
"#
    );
    let canonical_fingerprint =
        sha256_hex(template.replace("__REPORT_FINGERPRINT__", "").as_bytes());
    let declared_fingerprint = fingerprint_override.unwrap_or(canonical_fingerprint.as_str());
    write_file(
        &repo.join(artifact_rel),
        &template.replace("__REPORT_FINGERPRINT__", declared_fingerprint),
    );
    canonical_fingerprint
}

fn write_execution_handoff_artifact(
    repo: &Path,
    artifact_rel: &str,
    contract_fingerprint: &str,
    fingerprint_override: Option<&str>,
) -> String {
    write_execution_handoff_artifact_custom!(
        repo,
        artifact_rel,
        contract_fingerprint,
        21,
        &["criterion-1"],
        &[],
        &[],
        "Resume downstream final-review and finish gates.",
        "Fixture handoff is complete and ready for downstream gates.",
        fingerprint_override,
    )
}

type ExecutionHandoffArtifactInput<'a> = (
    &'a Path,
    &'a str,
    &'a str,
    u64,
    &'a [&'a str],
    &'a [&'a str],
    &'a [&'a str],
    &'a str,
    &'a str,
    Option<&'a str>,
);

fn write_execution_handoff_artifact_custom_impl(
    input: ExecutionHandoffArtifactInput<'_>,
) -> String {
    let (
        repo,
        artifact_rel,
        contract_fingerprint,
        authoritative_sequence,
        satisfied_criteria,
        open_criteria,
        open_findings,
        next_action,
        workspace_notes,
        fingerprint_override,
    ) = input;
    let satisfied_criteria_section = if satisfied_criteria.is_empty() {
        String::from("[]")
    } else {
        satisfied_criteria
            .iter()
            .map(|criterion| format!("- {criterion}"))
            .collect::<Vec<_>>()
            .join("\n")
    };
    let open_criteria_section = if open_criteria.is_empty() {
        String::from("[]")
    } else {
        open_criteria
            .iter()
            .map(|criterion| format!("- {criterion}"))
            .collect::<Vec<_>>()
            .join("\n")
    };
    let open_findings_section = if open_findings.is_empty() {
        String::from("[]")
    } else {
        open_findings
            .iter()
            .map(|finding| format!("- {finding}"))
            .collect::<Vec<_>>()
            .join("\n")
    };
    let template = format!(
        r#"# Execution Handoff

**Handoff Version:** 1
**Authoritative Sequence:** {authoritative_sequence}
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Contract Fingerprint:** `{contract_fingerprint}`
**Harness Phase:** handoff_required
**Chunk ID:** chunk-1
**Satisfied Criteria:**
{satisfied_criteria_section}
**Open Criteria:**
{open_criteria_section}
**Open Findings:**
{open_findings_section}
**Files Touched:**
- docs/example-output.md
**Next Action:** {next_action}
**Workspace Notes:** {workspace_notes}
**Commands Run:**
- cargo test --test plan_execution
**Risks:**
- none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:15:00Z
**Handoff Fingerprint:** __HANDOFF_FINGERPRINT__
"#
    );
    let canonical_fingerprint =
        sha256_hex(template.replace("__HANDOFF_FINGERPRINT__", "").as_bytes());
    let declared_fingerprint = fingerprint_override.unwrap_or(canonical_fingerprint.as_str());
    write_file(
        &repo.join(artifact_rel),
        &template.replace("__HANDOFF_FINGERPRINT__", declared_fingerprint),
    );
    canonical_fingerprint
}

fn write_execution_evidence_artifact_custom(
    repo: &Path,
    artifact_rel: &str,
    evidence_kind: &str,
    source_locator: &str,
    generated_by: &str,
    fingerprint_override: Option<&str>,
) -> String {
    let template = format!(
        r#"# Evidence Artifact

**Evidence Artifact Version:** 1
**Evidence Artifact Fingerprint:** __EVIDENCE_ARTIFACT_FINGERPRINT__
**Evidence Kind:** {evidence_kind}
**Source Locator:** {source_locator}
**Repo State Baseline Head SHA:** 1111111111111111111111111111111111111111
**Repo State Baseline Worktree Fingerprint:** 2222222222222222222222222222222222222222222222222222222222222222
**Relative Path:** docs/featureforge/execution-evidence/captured-output.txt
**Captured Content Fingerprint:** 3333333333333333333333333333333333333333333333333333333333333333
**Generated By:** {generated_by}
**Generated At:** 2026-03-25T12:20:00Z

## Captured Content

Fixture captured content for authoritative evidence locator resolution tests.
"#
    );
    let canonical_fingerprint = sha256_hex(
        template
            .replace("__EVIDENCE_ARTIFACT_FINGERPRINT__", "")
            .as_bytes(),
    );
    let declared_fingerprint = fingerprint_override.unwrap_or(canonical_fingerprint.as_str());
    write_file(
        &repo.join(artifact_rel),
        &template.replace("__EVIDENCE_ARTIFACT_FINGERPRINT__", declared_fingerprint),
    );
    canonical_fingerprint
}

fn preflight_acceptance_state_path(repo: &Path, state: &Path) -> PathBuf {
    harness_branch_dir(repo, state)
        .join("execution-preflight")
        .join("acceptance-state.json")
}

fn write_test_plan_artifact(repo: &Path, state: &Path, browser_required: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state)
        .join(format!("tester-{safe_branch}-test-plan-20260322-170500.md"));
    write_file(
        &artifact_path,
        &format!(
            "# Test Plan\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Head SHA:** {head_sha}\n**Browser QA Required:** {browser_required}\n**Generated By:** featureforge:plan-eng-review\n**Generated At:** 2026-03-22T17:05:00Z\n\n## Affected Pages / Routes\n- /runtime-hardening - verify helper-backed finish gating\n\n## Key Interactions\n- finish-gate handoff on /runtime-hardening\n\n## Edge Cases\n- stale or missing release-readiness evidence\n\n## Critical Paths\n- approved-plan finish handoff stays blocked until QA and release artifacts are fresh\n",
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_rich_test_plan_artifact(repo: &Path, state: &Path, browser_required: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state)
        .join(format!("tester-{safe_branch}-test-plan-20260322-170500.md"));
    write_file(
        &artifact_path,
        &format!(
            "# Test Plan\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Head SHA:** {head_sha}\n**Browser QA Required:** {browser_required}\n**Generated By:** featureforge:plan-eng-review\n**Generated At:** 2026-03-24T16:08:00Z\n\n## Affected Pages / Routes\n- none\n\n## Key Interactions\n- review-summary writeback on authoritative artifacts\n\n## Edge Cases\n- additive sections present without changing finish-gate authority\n\n## Critical Paths\n- planning-review sync stays compatible with helper-owned finish gating\n\n## Coverage Graph\n- plan-ceo-review summary write -> automated contract tests\n- plan-eng-review additive QA artifact -> manual QA not required\n\n## E2E Test Decision Matrix\n- planning review handoff -> required no (non-browser) -> contract and helper coverage\n\n## Browser Matrix\n- none\n\n## Non-Browser Contract Checks\n- cargo test --test plan_execution -> helper-owned finish-gate compatibility\n\n## Regression Risks\n- richer QA artifact sections accidentally become approval truth\n\n## Manual QA Notes\n- none\n\n## Engineering Review Summary\n- Review outcome captured separately in the source plan.\n",
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_qa_result_artifact(repo: &Path, state: &Path, test_plan_path: &Path) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-test-outcome-20260322-170900.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# QA Result\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Source Test Plan:** `{}`\n**Branch:** {branch}\n**Repo:** {}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:qa-only\n**Generated At:** 2026-03-22T17:09:00Z\n\n## Summary\n- Browser QA artifact fixture for gate-finish coverage.\n",
            test_plan_path.display(),
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_code_review_artifact(repo: &Path, state: &Path, base_branch: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let head_sha = current_head_sha(repo);
    let reviewer_artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-independent-review-20260322-170950.md"
    ));
    let reviewer_artifact_source = format!(
        "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Strategy Checkpoint Fingerprint:** {FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-22T17:09:50Z\n\n## Summary\n- dedicated independent reviewer artifact fixture.\n",
        repo_slug(repo)
    );
    write_file(&reviewer_artifact_path, &reviewer_artifact_source);
    let reviewer_artifact_fingerprint =
        sha256_hex(&fs::read(&reviewer_artifact_path).expect("reviewer artifact should read"));
    let artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-code-review-20260322-171100.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Strategy Checkpoint Fingerprint:** {FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\n**Reviewer Artifact Path:** `{}`\n**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-22T17:11:00Z\n\n## Summary\n- Final whole-diff review artifact fixture for finish-gate coverage.\n",
            reviewer_artifact_path.display(),
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_release_readiness_artifact(repo: &Path, state: &Path, base_branch: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-release-readiness-20260322-171500.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# Release Readiness Result\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:document-release\n**Generated At:** 2026-03-22T17:15:00Z\n\n## Summary\n- Release-readiness artifact fixture for finish-gate coverage.\n",
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_worktree_lease_artifact(
    repo: &Path,
    state: &Path,
    lease_state: WorktreeLeaseState,
    cleanup_state: &str,
    reviewed_checkpoint_commit_sha: Option<&str>,
    label: &str,
) -> PathBuf {
    write_worktree_lease_artifact_for_plan_with_sequence!(
        repo,
        state,
        PLAN_REL,
        1,
        17,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
    )
}

type WorktreeLeaseArtifactForRunIdentityWithFingerprintInput<'a> = (
    &'a Path,
    &'a Path,
    &'a str,
    &'a str,
    &'a str,
    u32,
    u64,
    WorktreeLeaseState,
    &'a str,
    Option<&'a str>,
    &'a str,
    bool,
);

fn write_worktree_lease_artifact_for_run_identity_with_fingerprint_impl(
    input: WorktreeLeaseArtifactForRunIdentityWithFingerprintInput<'_>,
) -> (PathBuf, String) {
    let (
        repo,
        state,
        execution_run_id,
        chunk_id,
        source_plan_path,
        source_plan_revision,
        authoritative_sequence,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
        index_active_fingerprint,
    ) = input;
    write_worktree_lease_artifact_for_run_identity_with_fingerprint_and_branches!(
        repo,
        state,
        execution_run_id,
        chunk_id,
        source_plan_path,
        source_plan_revision,
        authoritative_sequence,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
        index_active_fingerprint,
        &branch_name(repo),
        &branch_name(repo),
    )
}

type WorktreeLeaseArtifactForRunIdentityWithFingerprintAndBranchesInput<'a> = (
    &'a Path,
    &'a Path,
    &'a str,
    &'a str,
    &'a str,
    u32,
    u64,
    WorktreeLeaseState,
    &'a str,
    Option<&'a str>,
    &'a str,
    bool,
    &'a str,
    &'a str,
);

fn write_worktree_lease_artifact_for_run_identity_with_fingerprint_and_branches_impl(
    input: WorktreeLeaseArtifactForRunIdentityWithFingerprintAndBranchesInput<'_>,
) -> (PathBuf, String) {
    let (
        repo,
        state,
        execution_run_id,
        chunk_id,
        source_plan_path,
        source_plan_revision,
        authoritative_sequence,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
        index_active_fingerprint,
        source_branch,
        authoritative_integration_branch,
    ) = input;
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let current_head = current_head_sha(repo);
    assert!(
        !chunk_id.trim().is_empty(),
        "worktree lease fixture should receive a non-empty chunk id"
    );
    let reviewed_checkpoint_commit_sha = reviewed_checkpoint_commit_sha
        .map(str::to_owned)
        .unwrap_or_else(|| String::from("open"));
    let execution_context_key = current_worktree_lease_execution_context_key(
        execution_run_id,
        &format!("unit-{label}"),
        source_plan_path,
        source_plan_revision,
        authoritative_integration_branch,
        &reviewed_checkpoint_commit_sha,
    );
    let lease_json = json!({
        "lease_version": 1,
        "authoritative_sequence": authoritative_sequence,
        "execution_run_id": execution_run_id,
        "execution_context_key": execution_context_key,
        "source_plan_path": source_plan_path,
        "source_plan_revision": source_plan_revision,
        "execution_unit_id": format!("unit-{label}"),
        "source_branch": source_branch,
        "authoritative_integration_branch": authoritative_integration_branch,
        "worktree_path": state.join("worktrees").join(label).display().to_string(),
        "repo_state_baseline_head_sha": current_head,
        "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
        "lease_state": lease_state,
        "cleanup_state": cleanup_state,
        "reviewed_checkpoint_commit_sha": if reviewed_checkpoint_commit_sha == "open" { Value::Null } else { Value::String(reviewed_checkpoint_commit_sha.clone()) },
        "reconcile_result_commit_sha": if matches!(lease_state, WorktreeLeaseState::Open | WorktreeLeaseState::ReviewPassedPendingReconcile) { Value::Null } else { Value::String(current_head.clone()) },
        "reconcile_result_proof_fingerprint": if matches!(lease_state, WorktreeLeaseState::Open | WorktreeLeaseState::ReviewPassedPendingReconcile) { Value::Null } else { Value::String(commit_object_fingerprint(repo, &current_head)) },
        "reconcile_mode": "identity_preserving",
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T12:00:00Z",
        "lease_fingerprint": "",
    });
    let lease_fingerprint = canonical_worktree_lease_fingerprint(&lease_json);
    let artifact_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch,
        &format!("worktree-lease-{safe_branch}-{execution_run_id}-{execution_context_key}.json"),
    );
    write_file(
        &artifact_path,
        &serde_json::to_string_pretty(&json!({
            "lease_version": 1,
            "authoritative_sequence": authoritative_sequence,
            "execution_run_id": execution_run_id,
            "execution_context_key": execution_context_key,
            "source_plan_path": source_plan_path,
            "source_plan_revision": source_plan_revision,
            "execution_unit_id": format!("unit-{label}"),
            "source_branch": source_branch,
            "authoritative_integration_branch": authoritative_integration_branch,
            "worktree_path": state.join("worktrees").join(label).display().to_string(),
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "lease_state": lease_state,
            "cleanup_state": cleanup_state,
            "reviewed_checkpoint_commit_sha": if reviewed_checkpoint_commit_sha == "open" { Value::Null } else { Value::String(reviewed_checkpoint_commit_sha.clone()) },
            "reconcile_result_commit_sha": if matches!(lease_state, WorktreeLeaseState::Open | WorktreeLeaseState::ReviewPassedPendingReconcile) { Value::Null } else { Value::String(current_head.clone()) },
            "reconcile_result_proof_fingerprint": if matches!(lease_state, WorktreeLeaseState::Open | WorktreeLeaseState::ReviewPassedPendingReconcile) { Value::Null } else { Value::String(commit_object_fingerprint(repo, &current_head)) },
            "reconcile_mode": "identity_preserving",
            "generated_by": "featureforge:executing-plans",
            "generated_at": "2026-03-27T12:00:00Z",
            "lease_fingerprint": lease_fingerprint,
        }))
        .expect("lease artifact should be serializable"),
    );
    if index_active_fingerprint {
        append_active_worktree_lease_fingerprint(repo, state, &lease_fingerprint);
    }
    (artifact_path, lease_fingerprint)
}

type WorktreeLeaseArtifactForRunIdentityInput<'a> = (
    &'a Path,
    &'a Path,
    &'a str,
    &'a str,
    &'a str,
    u32,
    u64,
    WorktreeLeaseState,
    &'a str,
    Option<&'a str>,
    &'a str,
    bool,
);

fn write_worktree_lease_artifact_for_run_identity_impl(
    input: WorktreeLeaseArtifactForRunIdentityInput<'_>,
) -> PathBuf {
    let (
        repo,
        state,
        execution_run_id,
        chunk_id,
        source_plan_path,
        source_plan_revision,
        authoritative_sequence,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
        index_active_fingerprint,
    ) = input;
    write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        execution_run_id,
        chunk_id,
        source_plan_path,
        source_plan_revision,
        authoritative_sequence,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
        index_active_fingerprint,
    )
    .0
}

type WorktreeLeaseArtifactForPlanWithSequenceInput<'a> = (
    &'a Path,
    &'a Path,
    &'a str,
    u32,
    u64,
    WorktreeLeaseState,
    &'a str,
    Option<&'a str>,
    &'a str,
);

fn write_worktree_lease_artifact_for_plan_with_sequence_impl(
    input: WorktreeLeaseArtifactForPlanWithSequenceInput<'_>,
) -> PathBuf {
    let (
        repo,
        state,
        source_plan_path,
        source_plan_revision,
        authoritative_sequence,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
    ) = input;
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    write_worktree_lease_artifact_for_run_identity!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        source_plan_path,
        source_plan_revision,
        authoritative_sequence,
        lease_state,
        cleanup_state,
        reviewed_checkpoint_commit_sha,
        label,
        true,
    )
}

type UnitReviewReceiptArtifactInput<'a> = (
    &'a Path,
    &'a Path,
    &'a str,
    &'a str,
    &'a str,
    &'a str,
    &'a str,
    u32,
    &'a str,
    &'a str,
    &'a str,
);

fn write_unit_review_receipt_artifact_for_lease_impl(
    input: UnitReviewReceiptArtifactInput<'_>,
) -> (PathBuf, String) {
    let (
        repo,
        state,
        execution_run_id,
        lease_fingerprint,
        approved_task_packet_fingerprint,
        execution_unit_id,
        source_plan_path,
        source_plan_revision,
        reviewed_worktree,
        reviewed_checkpoint_commit_sha,
        label,
    ) = input;
    let branch = branch_name(repo);
    let reconcile_result_commit_sha = current_head_sha(repo);
    let reconcile_result_proof_fingerprint =
        commit_object_fingerprint(repo, &reconcile_result_commit_sha);
    let state_json: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable for unit-review receipt"),
    )
    .expect("harness state should be valid json for unit-review receipt");
    let active_contract_fingerprint = state_json
        .get("active_contract_fingerprint")
        .and_then(Value::as_str)
        .expect("active contract fingerprint should be present for unit-review receipt");
    let approved_unit_contract_fingerprint = approved_unit_contract_fingerprint_for_review(
        active_contract_fingerprint,
        approved_task_packet_fingerprint,
        execution_unit_id,
    );
    let receipt_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch,
        &format!("unit-review-{execution_run_id}-{label}.md"),
    );
    let execution_context_key = current_worktree_lease_execution_context_key(
        execution_run_id,
        execution_unit_id,
        source_plan_path,
        source_plan_revision,
        &branch,
        reviewed_checkpoint_commit_sha,
    );
    let unsigned_source = format!(
        "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Strategy Checkpoint Fingerprint:** {FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\n**Source Plan:** {source_plan_path}\n**Source Plan Revision:** {source_plan_revision}\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {lease_fingerprint}\n**Execution Context Key:** {execution_context_key}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reconcile_result_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {reviewed_worktree}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-27T12:00:00Z\n"
    );
    let receipt_fingerprint = canonical_unit_review_receipt_fingerprint(&unsigned_source);
    let source = format!(
        "# Unit Review Result\n**Receipt Fingerprint:** {receipt_fingerprint}\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Strategy Checkpoint Fingerprint:** {FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\n**Source Plan:** {source_plan_path}\n**Source Plan Revision:** {source_plan_revision}\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {lease_fingerprint}\n**Execution Context Key:** {execution_context_key}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reconcile_result_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {reviewed_worktree}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-27T12:00:00Z\n"
    );
    write_file(&receipt_path, &source);
    (receipt_path, receipt_fingerprint)
}

fn write_serial_unit_review_receipt_artifact(
    repo: &Path,
    state: &Path,
    execution_run_id: &str,
    task_number: u32,
    step_number: u32,
    reviewed_checkpoint_commit_sha: &str,
) -> (PathBuf, String) {
    let branch = branch_name(repo);
    let reviewed_worktree = fs::canonicalize(repo).unwrap_or_else(|_| repo.to_path_buf());
    let execution_unit_id = format!("task-{task_number}-step-{step_number}");
    let approved_task_packet_fingerprint =
        expected_packet_fingerprint(repo, task_number, step_number);
    let state_json: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable for serial unit-review receipt"),
    )
    .expect("harness state should be valid json for serial unit-review receipt");
    let active_contract_fingerprint = state_json
        .get("active_contract_fingerprint")
        .and_then(Value::as_str)
        .expect("active contract fingerprint should be present for serial unit-review receipt");
    let approved_unit_contract_fingerprint = approved_unit_contract_fingerprint_for_review(
        active_contract_fingerprint,
        &approved_task_packet_fingerprint,
        &execution_unit_id,
    );
    let execution_context_key = current_worktree_lease_execution_context_key(
        execution_run_id,
        &execution_unit_id,
        PLAN_REL,
        1,
        &branch,
        reviewed_checkpoint_commit_sha,
    );
    let lease_fingerprint = sha256_hex(
        format!(
            "serial-unit-review:{execution_run_id}:{execution_unit_id}:{execution_context_key}:{reviewed_checkpoint_commit_sha}:{approved_task_packet_fingerprint}:{approved_unit_contract_fingerprint}"
        )
        .as_bytes(),
    );
    let reconcile_result_proof_fingerprint =
        commit_object_fingerprint(repo, reviewed_checkpoint_commit_sha);
    let receipt_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch,
        &format!("unit-review-{execution_run_id}-{execution_unit_id}.md"),
    );
    let unsigned_source = format!(
        "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Strategy Checkpoint Fingerprint:** {FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\n**Source Plan:** {PLAN_REL}\n**Source Plan Revision:** 1\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {lease_fingerprint}\n**Execution Context Key:** {execution_context_key}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reviewed_checkpoint_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-27T12:00:00Z\n",
        reviewed_worktree.display()
    );
    let receipt_fingerprint = canonical_unit_review_receipt_fingerprint(&unsigned_source);
    let source = format!(
        "# Unit Review Result\n**Receipt Fingerprint:** {receipt_fingerprint}\n{}",
        unsigned_source.trim_start_matches("# Unit Review Result\n")
    );
    write_file(&receipt_path, &source);
    (receipt_path, receipt_fingerprint)
}

fn reviewed_checkpoint_from_unit_review_receipt(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Reviewed Checkpoint SHA:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn approved_task_packet_from_unit_review_receipt(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Approved Task Packet Fingerprint:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn approved_unit_contract_from_unit_review_receipt(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Approved Unit Contract Fingerprint:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn execution_context_key_from_unit_review_receipt(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Execution Context Key:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn reconcile_result_commit_sha_from_unit_review_receipt(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Reconciled Result SHA:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn execution_context_key_from_worktree_lease(source: &str) -> Option<String> {
    let lease: Value = serde_json::from_str(source).ok()?;
    lease
        .get("execution_context_key")
        .and_then(Value::as_str)
        .map(str::to_owned)
        .filter(|value| !value.is_empty())
}

fn reconcile_result_commit_sha_from_worktree_lease(source: &str) -> Option<String> {
    let lease: Value = serde_json::from_str(source).ok()?;
    lease
        .get("reconcile_result_commit_sha")
        .and_then(Value::as_str)
        .map(str::to_owned)
        .filter(|value| !value.is_empty())
}

fn reconcile_result_proof_fingerprint_from_unit_review_receipt(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Reconcile Result Proof Fingerprint:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn reconcile_result_proof_fingerprint_from_worktree_lease(source: &str) -> Option<String> {
    let lease: Value = serde_json::from_str(source).ok()?;
    lease
        .get("reconcile_result_proof_fingerprint")
        .and_then(Value::as_str)
        .map(str::to_owned)
        .filter(|value| !value.is_empty())
}

fn commit_object_fingerprint(repo: &Path, commit_sha: &str) -> String {
    let output = run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["cat-file", "commit", commit_sha])
                .current_dir(repo);
            command
        },
        "git cat-file commit",
    );
    let object = String::from_utf8(output.stdout)
        .expect("commit object should be valid UTF-8 for test fingerprints");
    sha256_hex(object.as_bytes())
}

fn reconcile_mode_from_unit_review_receipt(source: &str) -> Option<String> {
    source.lines().find_map(|line| {
        line.trim()
            .strip_prefix("**Reconcile Mode:**")
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    })
}

fn canonical_unit_review_receipt_fingerprint(source: &str) -> String {
    let filtered = source
        .lines()
        .filter(|line| !line.trim().starts_with("**Receipt Fingerprint:**"))
        .collect::<Vec<_>>()
        .join("\n");
    sha256_hex(filtered.as_bytes())
}

fn advance_repo_head(repo: &Path, file_name: &str, contents: &str, message: &str) {
    write_file(&repo.join(file_name), contents);

    let mut git_add = Command::new("git");
    git_add.args(["add", file_name]).current_dir(repo);
    run_checked(git_add, "git add advance head");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", message]).current_dir(repo);
    run_checked(git_commit, "git commit advance head");
}

fn canonical_worktree_lease_fingerprint(lease: &Value) -> String {
    let mut lease = lease.clone();
    let lease_object = lease
        .as_object_mut()
        .expect("worktree lease artifact should be a JSON object");
    lease_object.remove("lease_fingerprint");
    sha256_hex(
        &serde_json::to_vec(&lease).expect("lease artifact should be serializable for fingerprint"),
    )
}

fn replace_in_file(path: &Path, from: &str, to: &str) {
    let source = fs::read_to_string(path).expect("fixture file should be readable for mutation");
    let updated = source.replace(from, to);
    assert_ne!(
        source,
        updated,
        "fixture mutation should change the file contents for {}",
        path.display()
    );
    fs::write(path, updated).expect("fixture file should be writable for mutation");
}

fn rewrite_source_test_plan_header(source: &str, source_test_plan: &Path) -> String {
    let replacement = format!("**Source Test Plan:** `{}`", source_test_plan.display());
    let mut replaced = false;
    let rewritten = source
        .lines()
        .map(|line| {
            if line.trim().starts_with("**Source Test Plan:**") {
                replaced = true;
                replacement.clone()
            } else {
                line.to_owned()
            }
        })
        .collect::<Vec<_>>()
        .join("\n");
    assert!(
        replaced,
        "QA artifact should include a Source Test Plan header"
    );
    format!("{rewritten}\n")
}

fn rewrite_qa_source_test_plan(path: &Path, source_test_plan: &Path) {
    let source = fs::read_to_string(path).unwrap_or_else(|error| {
        panic!("QA artifact {} should be readable: {error}", path.display())
    });
    write_file(
        path,
        &rewrite_source_test_plan_header(&source, source_test_plan),
    );
}

fn prepare_finished_single_step_finish_gate_fixture(
    repo: &Path,
    state: &Path,
    browser_required: &str,
    include_qa: bool,
    base_branch: &str,
) -> (PathBuf, Option<PathBuf>, PathBuf, PathBuf) {
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    let branch_test_plan = write_test_plan_artifact(repo, state, browser_required);
    let branch_qa_path = if include_qa {
        Some(write_qa_result_artifact(repo, state, &branch_test_plan))
    } else {
        None
    };
    let branch_review_path = write_code_review_artifact(repo, state, base_branch);
    let branch_release_path = write_release_readiness_artifact(repo, state, base_branch);
    let safe_branch = normalize_identifier(&branch_name(repo));
    let current_head = current_head_sha(repo);
    let repo_slug = repo_slug(repo);
    let branch = branch_name(repo);

    let authoritative_test_plan_source = fs::read_to_string(&branch_test_plan)
        .expect("source test-plan artifact should be readable for authoritative finish fixture");
    let authoritative_test_plan_fingerprint = sha256_hex(authoritative_test_plan_source.as_bytes());
    let authoritative_test_plan = harness_authoritative_artifact_path(
        state,
        &repo_slug,
        &branch,
        &format!("test-plan-{authoritative_test_plan_fingerprint}.md"),
    );
    write_file(&authoritative_test_plan, &authoritative_test_plan_source);

    let authoritative_qa = branch_qa_path.as_ref().map(|branch_qa_path| {
        let qa_source = rewrite_source_test_plan_header(
            &fs::read_to_string(branch_qa_path)
                .expect("source QA artifact should be readable for authoritative finish fixture"),
            &authoritative_test_plan,
        );
        let qa_fingerprint = sha256_hex(qa_source.as_bytes());
        let qa_path = harness_authoritative_artifact_path(
            state,
            &repo_slug,
            &branch,
            &format!("browser-qa-{qa_fingerprint}.md"),
        );
        write_file(&qa_path, &qa_source);
        (qa_path, qa_fingerprint)
    });

    let authoritative_review_source = fs::read_to_string(&branch_review_path)
        .expect("source review artifact should be readable for authoritative finish fixture");
    let authoritative_review_fingerprint = sha256_hex(authoritative_review_source.as_bytes());
    let authoritative_review = harness_authoritative_artifact_path(
        state,
        &repo_slug,
        &branch,
        &format!("final-review-{authoritative_review_fingerprint}.md"),
    );
    write_file(&authoritative_review, &authoritative_review_source);

    let authoritative_release_source = fs::read_to_string(&branch_release_path)
        .expect("source release artifact should be readable for authoritative finish fixture");
    let authoritative_release_fingerprint = sha256_hex(authoritative_release_source.as_bytes());
    let authoritative_release = harness_authoritative_artifact_path(
        state,
        &repo_slug,
        &branch,
        &format!("release-docs-{authoritative_release_fingerprint}.md"),
    );
    write_file(&authoritative_release, &authoritative_release_source);

    let active_contract_rel = "docs/featureforge/execution-evidence/active-execution-contract.md";
    let active_contract_fingerprint =
        write_execution_contract_artifact(repo, active_contract_rel, None);
    let active_contract_source = fs::read_to_string(repo.join(active_contract_rel))
        .expect("source active contract should be readable for finish fixture");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug,
            &branch,
            &format!("contract-{active_contract_fingerprint}.md"),
        ),
        &active_contract_source,
    );
    let execution_run_id = format!("run-{safe_branch}-finish");
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "run_identity": {
                "execution_run_id": execution_run_id,
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": format!("chunk-{safe_branch}-finish"),
            "latest_authoritative_sequence": 17,
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "reconciled",
            "active_contract_path": format!("contract-{active_contract_fingerprint}.md"),
            "active_contract_fingerprint": active_contract_fingerprint,
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": if include_qa { "fresh" } else { "not_required" },
            "release_docs_state": "fresh",
            "last_final_review_artifact_fingerprint": authoritative_review_fingerprint,
            "last_browser_qa_artifact_fingerprint": authoritative_qa.as_ref().map(|(_, fingerprint)| fingerprint.clone()),
            "last_release_docs_artifact_fingerprint": authoritative_release_fingerprint,
            "active_worktree_lease_fingerprints": [],
            "active_worktree_lease_bindings": [],
        }),
    );
    write_serial_unit_review_receipt_artifact(repo, state, &execution_run_id, 1, 1, &current_head);
    (
        authoritative_test_plan,
        authoritative_qa.map(|(path, _)| path),
        authoritative_review,
        authoritative_release,
    )
}

fn run_shell(repo: &Path, state: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    let compat_bin =
        std::env::var_os("CARGO_BIN_EXE_featureforge").expect("featureforge test binary path");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_COMPAT_BIN", compat_bin)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    run(command, context)
}

fn run_shell_json(repo: &Path, state: &Path, args: &[&str], context: &str) -> Value {
    parse_json(&run_shell(repo, state, args, context), context)
}

fn run_rust(repo: &Path, state: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    run(command, context)
}

fn run_rust_with_env(
    repo: &Path,
    state: &Path,
    args: &[&str],
    env: &[(&str, &str)],
    context: &str,
) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    for (key, value) in env {
        command.env(key, value);
    }
    run(command, context)
}

fn run_rust_json(repo: &Path, state: &Path, args: &[&str], context: &str) -> Value {
    parse_json(&run_rust(repo, state, args, context), context)
}

fn accept_execution_preflight(repo: &Path, state: &Path, plan_rel: &str) -> Value {
    let mut checkout = Command::new("git");
    checkout
        .args(["checkout", "-B", "execution-preflight-fixture"])
        .current_dir(repo);
    run_checked(checkout, "git checkout execution-preflight-fixture");

    let preflight = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "execution preflight acceptance",
    );
    assert_eq!(preflight["allowed"], true);
    preflight
}

#[test]
fn canonical_status_matches_helper_for_clean_plan() {
    let (repo_dir, state_dir) = init_repo("plan-execution-status");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let helper = run_shell_json(repo, state, &["status", "--plan", PLAN_REL], "shell status");
    let rust = run_rust_json(repo, state, &["status", "--plan", PLAN_REL], "rust status");

    for field in [
        "plan_revision",
        "execution_mode",
        "execution_started",
        "evidence_path",
        "active_task",
        "active_step",
        "blocking_task",
        "blocking_step",
        "resume_task",
        "resume_step",
    ] {
        assert_eq!(rust[field], helper[field], "field {field} should match");
    }
    assert!(
        rust["execution_fingerprint"]
            .as_str()
            .is_some_and(|value| !value.is_empty())
    );
}

#[test]
fn canonical_status_exposes_harness_state_surface_before_execution_starts() {
    let (repo_dir, state_dir) = init_repo("plan-execution-harness-state");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    assert_exact_public_harness_phase_set();

    let status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "rust status for harness state",
    );

    let harness_phase = status["harness_phase"]
        .as_str()
        .expect("status should expose harness_phase");
    assert_eq!(
        harness_phase, "implementation_handoff",
        "status should expose the exact pre-execution harness phase"
    );
    let chunk_id = status
        .get("chunk_id")
        .expect("status should expose chunk_id");
    assert!(
        chunk_id.as_str().is_some_and(|value| !value.is_empty()),
        "status should expose chunk_id as a non-empty string before execution starts, got {chunk_id:?}"
    );
    let execution_run_id = status
        .get("execution_run_id")
        .expect("status should expose execution_run_id");
    assert!(
        execution_run_id.is_null(),
        "status should keep execution_run_id null before execution_preflight accepts a run identity, got {execution_run_id:?}"
    );
    assert_eq!(status["latest_authoritative_sequence"], Value::from(0));
    assert_eq!(status["active_task"], Value::Null);
    assert_eq!(status["blocking_task"], Value::Null);
    assert_eq!(status["resume_task"], Value::Null);

    for field in ["chunking_strategy", "evaluator_policy", "reset_policy"] {
        let value = status
            .get(field)
            .unwrap_or_else(|| panic!("status should expose {field}"));
        assert!(
            value.is_null(),
            "status should keep {field} null before execution_preflight accepts authoritative policy, got {value:?}"
        );
    }

    let missing_string_fields = missing_string_fields(
        &status,
        &[
            "aggregate_evaluation_state",
            "repo_state_drift_state",
            "dependency_index_state",
            "final_review_state",
            "browser_qa_state",
            "release_docs_state",
        ],
    );
    assert!(
        missing_string_fields.is_empty(),
        "status should expose the frozen policy and downstream freshness fields as strings, missing: {missing_string_fields:?}"
    );

    for field in [
        "repo_state_baseline_head_sha",
        "repo_state_baseline_worktree_fingerprint",
    ] {
        let value = status
            .get(field)
            .unwrap_or_else(|| panic!("status should expose {field}"));
        assert!(
            value.is_null() || value.as_str().is_some_and(|value| !value.is_empty()),
            "status should expose {field} as null before execution_preflight acceptance or as a non-empty string after acceptance, got {value:?}"
        );
    }

    let write_authority_state = status
        .get("write_authority_state")
        .expect("status should expose write_authority_state");
    assert!(
        write_authority_state
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "status should expose write_authority_state as a non-empty string before execution starts, got {write_authority_state:?}"
    );

    for field in ["write_authority_holder", "write_authority_worktree"] {
        let value = status
            .get(field)
            .unwrap_or_else(|| panic!("status should expose {field}"));
        assert!(
            value.is_null() || value.as_str().is_some_and(|value| !value.is_empty()),
            "status should expose {field} as null when unknown pre-start or as non-empty diagnostic metadata once known, got {value:?}"
        );
    }

    let missing_null_fields = missing_null_fields(
        &status,
        &[
            "active_contract_path",
            "active_contract_fingerprint",
            "last_evaluation_report_path",
            "last_evaluation_report_fingerprint",
            "last_evaluation_evaluator_kind",
            "last_evaluation_verdict",
        ],
    );
    assert!(
        missing_null_fields.is_empty(),
        "status should keep active pointers null before execution starts, missing: {missing_null_fields:?}"
    );

    for field in [
        "required_evaluator_kinds",
        "completed_evaluator_kinds",
        "pending_evaluator_kinds",
        "non_passing_evaluator_kinds",
        "open_failed_criteria",
        "reason_codes",
    ] {
        assert!(
            status.get(field).and_then(Value::as_array).is_some(),
            "status should expose array field {field} for harness state"
        );
    }

    for field in [
        "current_chunk_retry_count",
        "current_chunk_retry_budget",
        "current_chunk_pivot_threshold",
    ] {
        assert!(
            status.get(field).and_then(Value::as_u64).is_some(),
            "status should expose numeric field {field} for harness state"
        );
    }

    assert!(
        status
            .get("handoff_required")
            .and_then(Value::as_bool)
            .is_some(),
        "status should expose handoff_required for harness state"
    );

    let reason_codes = status["reason_codes"]
        .as_array()
        .expect("status should expose reason_codes as an array");
    assert!(
        reason_codes.is_empty(),
        "pre-start status should not surface blocking reason codes, got: {reason_codes:?}"
    );

    let review_stack = status
        .get("review_stack")
        .expect("status should expose review_stack");
    assert!(
        review_stack.is_null(),
        "status should keep review_stack null before execution_preflight accepts authoritative policy, got {review_stack:?}"
    );

    for field in [
        "final_review_state",
        "browser_qa_state",
        "release_docs_state",
    ] {
        let freshness = status[field]
            .as_str()
            .unwrap_or_else(|| panic!("status should expose {field} as a freshness string"));
        assert!(
            matches!(freshness, "not_required" | "missing" | "fresh" | "stale"),
            "status should keep {field} on the stable freshness vocabulary, got {freshness:?}"
        );
    }

    for (state_field, fingerprint_field) in [
        (
            "final_review_state",
            "last_final_review_artifact_fingerprint",
        ),
        ("browser_qa_state", "last_browser_qa_artifact_fingerprint"),
        (
            "release_docs_state",
            "last_release_docs_artifact_fingerprint",
        ),
    ] {
        let freshness = status
            .get(state_field)
            .and_then(Value::as_str)
            .unwrap_or_else(|| panic!("status should expose {state_field} as a freshness string"));
        let fingerprint = status
            .get(fingerprint_field)
            .unwrap_or_else(|| panic!("status should expose {fingerprint_field}"));
        match freshness {
            "fresh" | "stale" => assert!(
                fingerprint.as_str().is_some_and(|value| !value.is_empty()),
                "status should expose non-empty {fingerprint_field} when {state_field} is {freshness}"
            ),
            "not_required" | "missing" => assert!(
                fingerprint.is_null()
                    || fingerprint.as_str().is_some_and(|value| !value.is_empty()),
                "status should expose {fingerprint_field} as null or a non-empty authoritative fingerprint while {state_field} is {freshness}"
            ),
            freshness => panic!("unexpected freshness value for {state_field}: {freshness}"),
        }
    }
}

#[test]
fn canonical_status_accepts_checked_steps_with_fenced_step_details() {
    let (repo_dir, state_dir) = init_repo("plan-execution-checked-step-details");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    add_fenced_step_details(repo);
    mark_all_plan_steps_checked(repo);

    let rust = run_rust(repo, state, &["status", "--plan", PLAN_REL], "rust status");
    assert!(
        rust.status.success(),
        "status should accept checked steps with fenced step details, got {:?}\nstdout:\n{}\nstderr:\n{}",
        rust.status,
        String::from_utf8_lossy(&rust.stdout),
        String::from_utf8_lossy(&rust.stderr)
    );
}

#[test]
fn canonical_status_rejects_stale_plan_when_newer_sibling_spec_exists() {
    let (repo_dir, state_dir) = init_repo("plan-execution-stale-sibling-spec");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");
    write_newer_approved_spec_same_revision_different_path(repo);

    let output = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "rust status with newer sibling approved spec",
    );
    assert!(
        !output.status.success(),
        "status should fail closed when a newer approved sibling spec exists, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value =
        serde_json::from_slice(payload).expect("stale sibling spec error should be json");
    assert_eq!(json["error_class"], "PlanNotExecutionReady");
}

#[test]
fn canonical_status_rejects_approved_plan_with_draft_reviewer_provenance() {
    let (repo_dir, state_dir) = init_repo("plan-execution-approved-plan-reviewer-drift");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");
    replace_in_file(
        &repo.join(PLAN_REL),
        "**Last Reviewed By:** plan-eng-review",
        "**Last Reviewed By:** writing-plans",
    );

    let output = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "rust status with approved plan reviewer drift",
    );
    assert!(
        !output.status.success(),
        "status should fail closed when an Engineering Approved plan keeps draft reviewer provenance, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value =
        serde_json::from_slice(payload).expect("approved plan reviewer drift error should be json");
    assert_eq!(json["error_class"], "PlanNotExecutionReady");
}

#[test]
fn canonical_status_rejects_approved_source_spec_with_draft_reviewer_provenance() {
    let (repo_dir, state_dir) = init_repo("plan-execution-approved-spec-reviewer-drift");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    replace_in_file(
        &repo.join(SPEC_REL),
        "**Last Reviewed By:** plan-ceo-review",
        "**Last Reviewed By:** brainstorming",
    );
    write_plan(repo, "none");

    let output = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "rust status with approved source spec reviewer drift",
    );
    assert!(
        !output.status.success(),
        "status should fail closed when a CEO Approved source spec keeps draft reviewer provenance, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value = serde_json::from_slice(payload)
        .expect("approved source spec reviewer drift error should be json");
    assert_eq!(json["error_class"], "PlanNotExecutionReady");
}

#[test]
fn canonical_status_rejects_ambiguous_approved_specs_even_when_plan_targets_newest_path() {
    let (repo_dir, state_dir) = init_repo("plan-execution-ambiguous-approved-specs");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let newer_spec_rel = "docs/featureforge/specs/2026-03-17-example-execution-plan-design-v2.md";
    write_approved_spec(repo);
    write_newer_approved_spec_same_revision_different_path(repo);
    write_plan(repo, "none");
    replace_in_file(
        &repo.join(PLAN_REL),
        &format!("**Source Spec:** `{SPEC_REL}`"),
        &format!("**Source Spec:** `{newer_spec_rel}`"),
    );

    let output = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "rust status with ambiguous approved specs",
    );
    assert!(
        !output.status.success(),
        "status should fail closed when approved spec candidates are ambiguous, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value =
        serde_json::from_slice(payload).expect("ambiguous approved specs error should be json");
    assert_eq!(json["error_class"], "PlanNotExecutionReady");
}

#[test]
fn canonical_status_rejects_ambiguous_approved_plans_for_same_spec() {
    let (repo_dir, state_dir) = init_repo("plan-execution-ambiguous-approved-plans");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");
    write_second_approved_plan_same_spec(repo, "none");

    let output = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "rust status with ambiguous approved plans",
    );
    assert!(
        !output.status.success(),
        "status should fail closed when approved plan candidates are ambiguous, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value =
        serde_json::from_slice(payload).expect("ambiguous approved plans error should be json");
    assert_eq!(json["error_class"], "PlanNotExecutionReady");
}

#[test]
fn canonical_gate_review_returns_blocking_result_for_newer_sibling_spec() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-stale-sibling-spec");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_newer_approved_spec_same_revision_different_path(repo);

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with newer sibling approved spec",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "PlanNotExecutionReady");
    assert_eq!(gate_review["reason_codes"][0], "plan_not_execution_ready");
}

#[test]
fn canonical_preflight_matches_helper_for_clean_plan() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let helper = run_shell_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "shell preflight",
    );
    let rust = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "rust preflight",
    );

    assert_eq!(rust["allowed"], helper["allowed"]);
    assert_eq!(rust["failure_class"], helper["failure_class"]);
    assert_eq!(rust["reason_codes"], helper["reason_codes"]);
}

#[test]
fn begin_requires_preflight_acceptance_before_execution_starts() {
    let (repo_dir, state_dir) = init_repo("plan-execution-begin-requires-preflight");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before begin without preflight acceptance",
    );
    let begin_without_preflight = run_rust(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "begin before preflight acceptance",
    );
    assert!(
        !begin_without_preflight.status.success(),
        "begin should fail closed before preflight acceptance, got {:?}\nstdout:\n{}\nstderr:\n{}",
        begin_without_preflight.status,
        String::from_utf8_lossy(&begin_without_preflight.stdout),
        String::from_utf8_lossy(&begin_without_preflight.stderr)
    );
    let begin_payload = if begin_without_preflight.stdout.is_empty() {
        &begin_without_preflight.stderr
    } else {
        &begin_without_preflight.stdout
    };
    let begin_error: Value =
        serde_json::from_slice(begin_payload).expect("begin failure should emit json");
    assert_eq!(begin_error["error_class"], "ExecutionStateNotReady");

    accept_execution_preflight(repo, state, PLAN_REL);
    let accepted_status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after preflight acceptance",
    );
    assert!(
        accepted_status["execution_run_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "status should expose a non-empty execution_run_id after preflight acceptance"
    );

    let begin_after_preflight = run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            accepted_status["execution_fingerprint"]
                .as_str()
                .expect("accepted status fingerprint should be present"),
        ],
        "begin after preflight acceptance",
    );
    assert_eq!(begin_after_preflight["active_task"], 1);
    assert_eq!(begin_after_preflight["active_step"], 1);
}

#[test]
fn preflight_accepts_default_policy_snapshot_and_replays_same_run_identity_in_status() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-policy-replay");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let before_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before preflight policy acceptance",
    );
    for field in [
        "execution_run_id",
        "chunking_strategy",
        "evaluator_policy",
        "reset_policy",
        "review_stack",
    ] {
        let value = before_preflight
            .get(field)
            .unwrap_or_else(|| panic!("status should expose {field}"));
        assert!(
            value.is_null(),
            "status should keep {field} null before execution preflight acceptance, got {value:?}"
        );
    }

    accept_execution_preflight(repo, state, PLAN_REL);
    let after_first_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after first preflight policy acceptance",
    );
    let first_run_id = after_first_preflight["execution_run_id"]
        .as_str()
        .expect("status should expose execution_run_id after first preflight acceptance")
        .to_owned();
    assert!(
        !first_run_id.is_empty(),
        "status should expose a non-empty execution_run_id after first preflight acceptance"
    );
    let first_policy_snapshot = [
        after_first_preflight["chunking_strategy"].clone(),
        after_first_preflight["evaluator_policy"].clone(),
        after_first_preflight["reset_policy"].clone(),
        after_first_preflight["review_stack"].clone(),
    ];
    assert!(
        first_policy_snapshot.iter().all(|value| !value.is_null()),
        "status should expose non-null frozen policy fields after first preflight acceptance, got {first_policy_snapshot:?}"
    );

    accept_execution_preflight(repo, state, PLAN_REL);
    let after_second_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after second identical preflight policy acceptance",
    );
    assert_eq!(
        after_second_preflight["execution_run_id"],
        Value::String(first_run_id),
        "second identical preflight should reuse the accepted execution_run_id"
    );
    let second_policy_snapshot = [
        after_second_preflight["chunking_strategy"].clone(),
        after_second_preflight["evaluator_policy"].clone(),
        after_second_preflight["reset_policy"].clone(),
        after_second_preflight["review_stack"].clone(),
    ];
    assert_eq!(
        second_policy_snapshot, first_policy_snapshot,
        "second identical preflight should reuse the same frozen policy tuple from the first acceptance"
    );
}

#[test]
fn preflight_replay_mints_new_run_identity_when_authoritative_baseline_changes() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-baseline-replay");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    accept_execution_preflight(repo, state, PLAN_REL);
    let after_first_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after first preflight baseline acceptance",
    );
    let first_run_id = after_first_preflight["execution_run_id"]
        .as_str()
        .expect("status should expose execution_run_id after first preflight acceptance")
        .to_owned();
    let first_head = current_head_sha(repo);

    write_file(
        &repo.join("docs/preflight-baseline-change.md"),
        "# baseline change for replay-key coverage\n",
    );
    let mut git_add = Command::new("git");
    git_add
        .args(["add", "docs/preflight-baseline-change.md"])
        .current_dir(repo);
    run_checked(git_add, "git add preflight baseline change");
    let mut git_commit = Command::new("git");
    git_commit
        .args([
            "commit",
            "-m",
            "baseline change for preflight replay coverage",
        ])
        .current_dir(repo);
    run_checked(git_commit, "git commit preflight baseline change");

    let new_head = current_head_sha(repo);
    assert_ne!(
        new_head, first_head,
        "fixture should move HEAD to a new baseline before replay preflight"
    );

    accept_execution_preflight(repo, state, PLAN_REL);
    let after_second_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after second preflight with changed authoritative baseline",
    );
    let second_run_id = after_second_preflight["execution_run_id"]
        .as_str()
        .expect("status should expose execution_run_id after second preflight acceptance");

    assert_ne!(
        second_run_id, first_run_id,
        "execution_preflight should mint a new execution_run_id when authoritative baseline changes"
    );
}

#[test]
fn preflight_replay_mints_new_run_identity_when_accepted_policy_tuple_changes() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-policy-tuple-replay");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    accept_execution_preflight(repo, state, PLAN_REL);
    let after_first_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after first preflight policy-tuple acceptance",
    );
    let first_run_id = after_first_preflight["execution_run_id"]
        .as_str()
        .expect("status should expose execution_run_id after first preflight acceptance")
        .to_owned();

    let acceptance_path = preflight_acceptance_state_path(repo, state);
    let mut acceptance_payload: Value = serde_json::from_str(
        &fs::read_to_string(&acceptance_path)
            .expect("preflight acceptance state should remain readable before tuple mutation"),
    )
    .expect("preflight acceptance state should remain valid json before tuple mutation");
    acceptance_payload["review_stack"] = json!([
        "featureforge:writing-plans",
        "featureforge:requesting-code-review"
    ]);
    write_file(
        &acceptance_path,
        &serde_json::to_string_pretty(&acceptance_payload)
            .expect("tuple-mutated acceptance payload should serialize"),
    );

    accept_execution_preflight(repo, state, PLAN_REL);
    let after_second_preflight = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after second preflight with tuple-mutated acceptance state",
    );
    let second_run_id = after_second_preflight["execution_run_id"]
        .as_str()
        .expect("status should expose execution_run_id after second preflight acceptance");

    assert_ne!(
        second_run_id, first_run_id,
        "execution_preflight should mint a new execution_run_id when accepted policy tuple changes"
    );
}

#[test]
fn preflight_blocks_unresolved_authoritative_mutation_recovery_before_acceptance() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-recovery-required");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let mut checkout = Command::new("git");
    checkout
        .args(["checkout", "-B", "execution-preflight-fixture"])
        .current_dir(repo);
    run_checked(checkout, "git checkout execution-preflight-fixture");

    let contract_rel = "docs/featureforge/execution-evidence/preflight-recovery-contract.md";
    let contract_fingerprint =
        write_execution_contract_artifact_custom(repo, contract_rel, 18, "[]", 1, 1, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": [],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 1,
            "current_chunk_pivot_threshold": 1,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let acceptance_path = preflight_acceptance_state_path(repo, state);
    assert!(
        !acceptance_path.exists(),
        "preflight acceptance state should not exist before unresolved recovery fixture"
    );

    let preflight = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "preflight with unresolved authoritative mutation recovery fixture",
    );
    assert_eq!(preflight["allowed"], false);
    assert_eq!(preflight["failure_class"], "ExecutionStateNotReady");
    assert!(
        preflight["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("authoritative_mutation_recovery_required"))),
        "preflight should expose authoritative_mutation_recovery_required when authoritative history is ahead of state, got {preflight}"
    );
    assert!(
        !acceptance_path.exists(),
        "preflight must not persist acceptance state while authoritative mutation recovery is unresolved"
    );
}

#[test]
fn preflight_blocks_authoritative_mutation_recovery_for_json_worktree_lease_artifacts() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-json-lease-recovery");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let mut checkout = Command::new("git");
    checkout
        .args(["checkout", "-B", "execution-preflight-fixture"])
        .current_dir(repo);
    run_checked(checkout, "git checkout execution-preflight-fixture");

    let contract_rel = "docs/featureforge/execution-evidence/preflight-json-lease-contract.md";
    let contract_fingerprint =
        write_execution_contract_artifact_custom(repo, contract_rel, 18, "[]", 1, 1, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": [],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 1,
            "current_chunk_pivot_threshold": 1,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let lease_run_id = "run-preflight-json-lease";
    let lease_chunk_id = "chunk-preflight-json-lease";
    let current_head = current_head_sha(repo);
    let _lease_path = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        lease_run_id,
        lease_chunk_id,
        PLAN_REL,
        1,
        18,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "preflight-json-lease",
        false,
    );

    let acceptance_path = preflight_acceptance_state_path(repo, state);
    assert!(
        !acceptance_path.exists(),
        "preflight acceptance state should not exist before JSON lease recovery fixture"
    );

    let preflight = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "preflight with JSON worktree lease above persisted authoritative sequence",
    );
    assert_eq!(preflight["allowed"], false);
    assert_eq!(preflight["failure_class"], "ExecutionStateNotReady");
    assert!(
        preflight["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("authoritative_mutation_recovery_required"))),
        "preflight should detect mutation recovery from higher-sequence JSON worktree lease artifacts, got {preflight}"
    );
    assert!(
        !acceptance_path.exists(),
        "preflight must not persist acceptance state while JSON lease recovery is unresolved"
    );
}

#[test]
fn preflight_acceptance_persists_without_overwriting_harness_state_file() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-harness-state-coexist");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let mut checkout = Command::new("git");
    checkout
        .args(["checkout", "-B", "execution-preflight-fixture"])
        .current_dir(repo);
    run_checked(checkout, "git checkout execution-preflight-fixture");

    let harness_state_path = harness_state_file_path(repo, state);
    let harness_state_payload =
        r#"{"schema_version":1,"harness_phase":"execution_preflight","authoritative_sequence":7}"#;
    write_file(&harness_state_path, harness_state_payload);

    let preflight = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "preflight with populated harness state file",
    );
    assert_eq!(preflight["allowed"], true);

    let harness_state_after = fs::read_to_string(&harness_state_path)
        .expect("harness state file should remain readable after preflight");
    assert_eq!(
        harness_state_after, harness_state_payload,
        "preflight acceptance must not overwrite harness state.json"
    );

    let acceptance_path = preflight_acceptance_state_path(repo, state);
    assert!(
        acceptance_path.is_file(),
        "preflight acceptance should persist to a dedicated file path"
    );
    let acceptance_payload = fs::read_to_string(&acceptance_path)
        .expect("acceptance file should be readable after preflight");
    let acceptance_json: Value =
        serde_json::from_str(&acceptance_payload).expect("acceptance payload should be valid json");
    assert_eq!(acceptance_json["schema_version"], 1);
    assert_eq!(acceptance_json["plan_path"], PLAN_REL);
    assert_eq!(acceptance_json["plan_revision"], 1);
    assert!(
        acceptance_json["execution_run_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty())
    );
    assert!(
        acceptance_json["chunk_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty())
    );
}

#[test]
fn canonical_preflight_rejects_detached_head_workspaces() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-detached-head");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let current_head = current_head_sha(repo);
    let mut git_detach = Command::new("git");
    git_detach
        .args(["checkout", "--detach", &current_head])
        .current_dir(repo);
    run_checked(git_detach, "git checkout --detach");

    let preflight = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "rust preflight with detached HEAD",
    );

    assert_eq!(preflight["allowed"], false);
    assert_eq!(preflight["failure_class"], "WorkspaceNotSafe");
    assert_eq!(preflight["reason_codes"][0], "detached_head");
}

#[test]
fn canonical_preflight_blocks_protected_default_branches() {
    let (repo_dir, _state_dir) = init_repo("plan-execution-preflight-protected-branch");
    let repo = repo_dir.path();
    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "main"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout main");
    write_approved_spec(repo);
    write_plan(repo, "none");

    let runtime =
        ExecutionRuntime::discover(repo).expect("execution runtime should discover fixture");
    let context = load_execution_context(&runtime, Path::new(PLAN_REL))
        .expect("execution context should load for protected-branch preflight");

    let preflight = preflight_from_context(&context);

    assert!(!preflight.allowed);
    assert_eq!(preflight.failure_class, "WorkspaceNotSafe");
    assert!(
        preflight
            .reason_codes
            .iter()
            .any(|code| code == "protected_branch_requires_approval"),
        "protected-branch preflight should require approval, got {:?}",
        preflight.reason_codes
    );
}

#[test]
fn canonical_preflight_blocks_active_blocked_and_interrupted_steps() {
    for (case_name, note_state, expected_reason) in [
        ("active", None, "active_step_in_progress"),
        ("blocked", Some("blocked"), "blocked_step"),
        (
            "interrupted",
            Some("interrupted"),
            "interrupted_work_unresolved",
        ),
    ] {
        let (repo_dir, state_dir) =
            init_repo(&format!("plan-execution-preflight-state-{case_name}"));
        let repo = repo_dir.path();
        let state = state_dir.path();
        write_approved_spec(repo);
        write_single_step_plan(repo, "featureforge:executing-plans");
        accept_execution_preflight(repo, state, PLAN_REL);

        let before = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before unresolved preflight state",
        );
        let active = run_rust_json(
            repo,
            state,
            &[
                "begin",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--execution-mode",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                before["execution_fingerprint"]
                    .as_str()
                    .expect("fingerprint"),
            ],
            "begin before preflight unresolved-state check",
        );

        if let Some(state_name) = note_state {
            run_rust_json(
                repo,
                state,
                &[
                    "note",
                    "--plan",
                    PLAN_REL,
                    "--task",
                    "1",
                    "--step",
                    "1",
                    "--state",
                    state_name,
                    "--message",
                    "Waiting on preflight coverage",
                    "--expect-execution-fingerprint",
                    active["execution_fingerprint"]
                        .as_str()
                        .expect("fingerprint"),
                ],
                "note before preflight unresolved-state check",
            );
        }

        let preflight = run_rust_json(
            repo,
            state,
            &["preflight", "--plan", PLAN_REL],
            "preflight with unresolved execution state",
        );

        assert_eq!(preflight["allowed"], false, "case {case_name}");
        assert_eq!(
            preflight["failure_class"], "ExecutionStateNotReady",
            "case {case_name}"
        );
        let reason_codes = preflight["reason_codes"]
            .as_array()
            .expect("reason_codes should stay an array");
        assert!(
            reason_codes
                .iter()
                .any(|value| value == &Value::String(expected_reason.to_owned())),
            "case {case_name} should include reason code {expected_reason}, got {reason_codes:?}"
        );
    }
}

#[test]
fn canonical_preflight_rejects_resume_when_authoritative_handoff_is_required() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-authoritative-handoff");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    let mut checkout = Command::new("git");
    checkout
        .args(["checkout", "-B", "execution-preflight-fixture"])
        .current_dir(repo);
    run_checked(checkout, "git checkout execution-preflight-fixture");

    let contract_rel =
        "docs/featureforge/execution-evidence/preflight-handoff-required-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "handoff_required",
        contract_rel,
        &contract_fingerprint,
        &[],
        &[],
        true,
    );

    let acceptance_path = preflight_acceptance_state_path(repo, state);
    assert!(
        !acceptance_path.exists(),
        "preflight acceptance state should not exist before blocked authoritative resume preflight"
    );
    let status_before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before authoritative handoff-required preflight",
    );
    assert!(
        status_before["execution_run_id"].is_null(),
        "status should keep execution_run_id null before blocked authoritative resume preflight"
    );

    let preflight = run_rust_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "preflight with authoritative handoff-required state",
    );

    assert_eq!(preflight["allowed"], false);
    assert_eq!(preflight["failure_class"], "ExecutionStateNotReady");
    assert!(
        preflight["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .filter_map(Value::as_str)
                .any(|code| code.contains("handoff_required"))),
        "preflight should include a stable handoff_required reason code, got {preflight}"
    );

    assert!(
        !acceptance_path.exists(),
        "preflight must not persist acceptance state when authoritative handoff is required"
    );
    let status_after = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after authoritative handoff-required preflight",
    );
    assert!(
        status_after["execution_run_id"].is_null(),
        "preflight rejection must not persist a new execution_run_id"
    );
}

#[test]
fn canonical_preflight_blocks_workspace_hazards() {
    for (case_name, setup, expected_reason) in [
        (
            "dirty-tracked-worktree",
            "write_dirty_tracked_file",
            "tracked_worktree_dirty",
        ),
        ("merge", "write_merge_head", "merge_in_progress"),
        ("rebase", "write_rebase_apply", "rebase_in_progress"),
        (
            "cherry-pick",
            "write_cherry_pick_head",
            "cherry_pick_in_progress",
        ),
        (
            "unresolved-index",
            "write_unresolved_index_entries",
            "unresolved_index_entries",
        ),
        (
            "missing-head",
            "remove_head_reference",
            "branch_unavailable",
        ),
    ] {
        let (repo_dir, state_dir) =
            init_repo(&format!("plan-execution-preflight-workspace-{case_name}"));
        let repo = repo_dir.path();
        let _state = state_dir.path();
        write_approved_spec(repo);
        write_plan(repo, "none");

        let runtime =
            ExecutionRuntime::discover(repo).expect("execution runtime should discover fixture");
        let context = load_execution_context(&runtime, Path::new(PLAN_REL))
            .expect("execution context should load for workspace-hazard preflight");

        match setup {
            "write_dirty_tracked_file" => {
                write_file(
                    &repo.join("README.md"),
                    "# dirty tracked worktree\npreflight should stop here\n",
                );
            }
            "write_merge_head" => write_file(&runtime.git_dir.join("MERGE_HEAD"), "deadbeef\n"),
            "write_rebase_apply" => {
                fs::create_dir_all(runtime.git_dir.join("rebase-apply"))
                    .expect("rebase-apply should be creatable");
            }
            "write_cherry_pick_head" => {
                write_file(&runtime.git_dir.join("CHERRY_PICK_HEAD"), "deadbeef\n")
            }
            "write_unresolved_index_entries" => write_unresolved_index_entries(repo),
            "remove_head_reference" => {
                fs::rename(
                    runtime.git_dir.join("HEAD"),
                    runtime.git_dir.join("HEAD.bak"),
                )
                .expect("HEAD should be renameable");
            }
            _ => unreachable!("unknown workspace-hazard setup"),
        }

        let preflight = preflight_from_context(&context);

        assert!(!preflight.allowed, "case {case_name}");
        assert_eq!(
            preflight.failure_class, "WorkspaceNotSafe",
            "case {case_name}"
        );
        assert!(
            preflight
                .reason_codes
                .iter()
                .any(|code| code == expected_reason),
            "case {case_name} should include reason code {expected_reason}, got {:?}",
            preflight.reason_codes
        );
    }
}

#[test]
fn canonical_preflight_reports_repo_safety_discovery_failures() {
    let (repo_dir, state_dir) = init_repo("plan-execution-preflight-repo-safety-unavailable");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let preflight = parse_json(
        &run_rust_with_env(
            repo,
            state,
            &["preflight", "--plan", PLAN_REL],
            &[(
                "FEATUREFORGE_REPO_SAFETY_TEST_FAILPOINT",
                "instruction_parse_failure",
            )],
            "rust preflight with repo-safety failpoint",
        ),
        "rust preflight with repo-safety failpoint",
    );

    assert_eq!(preflight["allowed"], false);
    assert_eq!(preflight["failure_class"], "WorkspaceNotSafe");
    assert!(
        preflight["reason_codes"]
            .as_array()
            .expect("reason_codes should stay an array")
            .iter()
            .any(|value| value == &Value::String(String::from("repo_safety_unavailable")))
    );
}

#[test]
fn canonical_gate_review_and_finish_match_helper() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gates");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_v2_completed_attempts_for_finished_plan(repo);
    let test_plan = write_test_plan_artifact(repo, state, "yes");
    write_qa_result_artifact(repo, state, &test_plan);
    let base_branch = branch_name(repo);
    write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);

    let helper_review = run_shell_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "shell gate review",
    );
    let rust_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "rust gate review",
    );
    assert_eq!(rust_review, helper_review);

    let helper_finish = run_shell_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "shell gate finish",
    );
    let rust_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "rust gate finish",
    );
    assert_eq!(rust_finish, helper_finish);
}

#[test]
fn gate_finish_accepts_richer_additive_test_plan_sections() {
    let (repo_dir, state_dir) = init_repo("plan-execution-rich-test-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_v2_completed_attempts_for_finished_plan(repo);
    let test_plan = write_rich_test_plan_artifact(repo, state, "yes");
    write_qa_result_artifact(repo, state, &test_plan);
    let base_branch = branch_name(repo);
    write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);
    let git_dir = gix::discover(repo)
        .expect("git repo should be discoverable")
        .path()
        .to_path_buf();
    let branch = branch_name(repo);
    let runtime = ExecutionRuntime {
        repo_root: repo.to_path_buf(),
        git_dir,
        branch_name: branch.clone(),
        repo_slug: repo_slug(repo),
        safe_branch: normalize_identifier(&branch),
        state_dir: state.to_path_buf(),
    };
    let context = load_execution_context(&runtime, Path::new(PLAN_REL))
        .expect("execution context should load for richer additive test-plan sections");
    let gate_finish = gate_finish_from_context(&context);

    assert!(gate_finish.allowed);
    assert!(gate_finish.failure_class.is_empty());
    assert!(gate_finish.reason_codes.is_empty());
}

#[test]
fn gate_review_blocks_active_blocked_and_interrupted_steps() {
    for (case_name, note_state, expected_reason) in [
        ("active", None, "active_step_in_progress"),
        ("blocked", Some("blocked"), "blocked_step"),
        (
            "interrupted",
            Some("interrupted"),
            "interrupted_work_unresolved",
        ),
    ] {
        let (repo_dir, state_dir) =
            init_repo(&format!("plan-execution-gate-review-state-{case_name}"));
        let repo = repo_dir.path();
        let state = state_dir.path();
        write_approved_spec(repo);
        write_single_step_plan(repo, "featureforge:executing-plans");
        accept_execution_preflight(repo, state, PLAN_REL);

        let before = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before unresolved execution state",
        );
        let active = run_rust_json(
            repo,
            state,
            &[
                "begin",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--execution-mode",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                before["execution_fingerprint"]
                    .as_str()
                    .expect("fingerprint"),
            ],
            "begin before gate-review unresolved-state check",
        );

        let current_fingerprint = if let Some(state_name) = note_state {
            let noted = run_rust_json(
                repo,
                state,
                &[
                    "note",
                    "--plan",
                    PLAN_REL,
                    "--task",
                    "1",
                    "--step",
                    "1",
                    "--state",
                    state_name,
                    "--message",
                    "Waiting on workflow gate coverage",
                    "--expect-execution-fingerprint",
                    active["execution_fingerprint"]
                        .as_str()
                        .expect("fingerprint"),
                ],
                "note before gate-review unresolved-state check",
            );
            noted["execution_fingerprint"]
                .as_str()
                .expect("fingerprint")
                .to_owned()
        } else {
            active["execution_fingerprint"]
                .as_str()
                .expect("fingerprint")
                .to_owned()
        };

        let gate_review = run_rust_json(
            repo,
            state,
            &["gate-review", "--plan", PLAN_REL],
            "gate review with unresolved execution state",
        );

        assert_eq!(gate_review["allowed"], false, "case {case_name}");
        assert_eq!(
            gate_review["failure_class"], "ExecutionStateNotReady",
            "case {case_name}"
        );
        let reason_codes = gate_review["reason_codes"]
            .as_array()
            .expect("reason_codes should stay an array");
        assert!(
            reason_codes
                .iter()
                .any(|value| value == &Value::String(expected_reason.to_owned())),
            "case {case_name} should include reason code {expected_reason}, got {reason_codes:?}"
        );
        assert!(
            reason_codes
                .iter()
                .any(|value| value == &Value::String(String::from("unfinished_steps_remaining"))),
            "case {case_name} should also keep unfinished step blocking semantics"
        );
        assert!(
            !current_fingerprint.is_empty(),
            "case {case_name} should preserve a readable execution fingerprint"
        );
    }
}

#[test]
fn gate_review_rejects_checked_step_without_execution_evidence() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-missing-evidence");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with checked step missing evidence",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "StaleExecutionEvidence");
    assert_eq!(
        gate_review["reason_codes"][0],
        "checked_step_missing_evidence"
    );
    assert!(
        gate_review["diagnostics"][0]["message"]
            .as_str()
            .unwrap_or_default()
            .contains("checked but missing execution evidence")
    );
}

#[test]
fn gate_review_rejects_stale_authoritative_late_gate_truth_even_with_valid_v2_evidence() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-stale-authoritative-truth");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );

    // Stale authoritative truth should block review readiness regardless of candidate evidence shape.
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 17,
            "dependency_index_state": "stale",
            "final_review_state": "stale",
            "browser_qa_state": "stale",
            "release_docs_state": "stale",
        }),
    );

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with stale authoritative late-gate truth",
    );

    assert_eq!(
        gate_review["allowed"], false,
        "gate-review should load authoritative late-gate truth before trusting v2 evidence"
    );
}

#[test]
fn gate_finish_requires_qa_result_when_browser_qa_is_required() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-missing-qa");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "yes");
    let base_branch = branch_name(repo);
    write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with missing required qa artifact",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "QaArtifactNotFresh");
    assert_eq!(gate_finish["reason_codes"][0], "qa_artifact_missing");
    assert!(
        gate_finish["diagnostics"][0]["remediation"]
            .as_str()
            .unwrap_or_default()
            .contains("Run qa-only")
    );
}

#[test]
fn gate_finish_requires_fresh_code_review_result_before_qa_or_release() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-missing-review");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    write_release_readiness_artifact(repo, state, &branch_name(repo));

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with missing required review artifact",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "ReviewArtifactNotFresh");
    assert_eq!(gate_finish["reason_codes"][0], "review_artifact_missing");
    assert!(
        gate_finish["diagnostics"][0]["remediation"]
            .as_str()
            .unwrap_or_default()
            .contains("requesting-code-review")
    );
}

#[test]
fn gate_finish_rejects_code_review_artifact_regressions() {
    for (case_name, mutator, expected_failure_class, expected_reason_code) in [
        (
            "review_artifact_malformed",
            "review_artifact_malformed",
            "ReviewArtifactNotFresh",
            "review_artifact_malformed",
        ),
        (
            "review_plan_mismatch",
            "review_plan_mismatch",
            "ReviewArtifactNotFresh",
            "review_receipt_plan_mismatch",
        ),
        (
            "review_branch_mismatch",
            "review_branch_mismatch",
            "ReviewArtifactNotFresh",
            "review_receipt_reviewer_artifact_contract_mismatch",
        ),
        (
            "review_base_branch_unresolved",
            "review_base_branch_unresolved",
            "ReviewArtifactNotFresh",
            "review_artifact_base_branch_unresolved",
        ),
        (
            "review_base_branch_mismatch",
            "review_base_branch_mismatch",
            "ReviewArtifactNotFresh",
            "review_artifact_base_branch_mismatch",
        ),
        (
            "review_head_mismatch",
            "review_head_mismatch",
            "ReviewArtifactNotFresh",
            "review_receipt_head_mismatch",
        ),
        (
            "review_result_not_pass",
            "review_result_not_pass",
            "ReviewArtifactNotFresh",
            "review_receipt_result_not_pass",
        ),
        (
            "review_generator_mismatch",
            "review_generator_mismatch",
            "ReviewArtifactNotFresh",
            "review_receipt_generator_mismatch",
        ),
        (
            "review_repo_mismatch",
            "review_repo_mismatch",
            "ReviewArtifactNotFresh",
            "review_receipt_reviewer_artifact_contract_mismatch",
        ),
        (
            "review_authoritative_fingerprint_mismatch",
            "review_authoritative_fingerprint_mismatch",
            "ArtifactIntegrityMismatch",
            "review_artifact_authoritative_provenance_invalid",
        ),
    ] {
        let (repo_dir, state_dir) = init_repo(&format!("plan-execution-finish-{case_name}"));
        let repo = repo_dir.path();
        let state = state_dir.path();
        let base_branch = branch_name(repo);
        let (_test_plan_path, _qa_path, review_path, _release_path) =
            prepare_finished_single_step_finish_gate_fixture(
                repo,
                state,
                "no",
                false,
                &base_branch,
            );

        match mutator {
            "review_artifact_malformed" => {
                replace_in_file(&review_path, "# Code Review Result", "# Not Code Review");
            }
            "review_plan_mismatch" => {
                replace_in_file(
                    &review_path,
                    &format!("**Source Plan:** `{PLAN_REL}`"),
                    "**Source Plan:** `docs/featureforge/plans/other-plan.md`",
                );
            }
            "review_branch_mismatch" => {
                replace_in_file(
                    &review_path,
                    &format!("**Branch:** {}", branch_name(repo)),
                    "**Branch:** other-branch",
                );
            }
            "review_base_branch_unresolved" => {
                replace_in_file(
                    &review_path,
                    &format!("**Base Branch:** {base_branch}"),
                    "**Base Branch:** ",
                );
            }
            "review_base_branch_mismatch" => {
                replace_in_file(
                    &review_path,
                    &format!("**Base Branch:** {base_branch}"),
                    "**Base Branch:** not-the-current-base",
                );
            }
            "review_head_mismatch" => {
                replace_in_file(
                    &review_path,
                    &format!("**Head SHA:** {}", current_head_sha(repo)),
                    "**Head SHA:** 0000000000000000000000000000000000000000",
                );
            }
            "review_result_not_pass" => {
                replace_in_file(&review_path, "**Result:** pass", "**Result:** blocked");
            }
            "review_generator_mismatch" => {
                replace_in_file(
                    &review_path,
                    "**Generated By:** featureforge:requesting-code-review",
                    "**Generated By:** made-up-generator",
                );
            }
            "review_repo_mismatch" => {
                replace_in_file(
                    &review_path,
                    &format!("**Repo:** {}", repo_slug(repo)),
                    "**Repo:** someone-else/other-repo",
                );
            }
            "review_authoritative_fingerprint_mismatch" => {
                replace_in_file(
                    &review_path,
                    "## Summary\n- Final whole-diff review artifact fixture for finish-gate coverage.\n",
                    "## Summary\n- Tampered after authoritative publish.\n",
                );
            }
            _ => unreachable!("unexpected mutator"),
        }
        if mutator != "review_authoritative_fingerprint_mismatch" {
            let _ = republish_authoritative_artifact_from_path(
                repo,
                state,
                &review_path,
                "final-review",
                "last_final_review_artifact_fingerprint",
            );
        }

        let gate_finish = run_rust_json(
            repo,
            state,
            &["gate-finish", "--plan", PLAN_REL],
            "gate finish with mutated code-review artifact",
        );

        assert_eq!(gate_finish["allowed"], false, "case {case_name}");
        assert_eq!(
            gate_finish["failure_class"], expected_failure_class,
            "case {case_name}"
        );
        assert_eq!(
            gate_finish["reason_codes"][0], expected_reason_code,
            "case {case_name}"
        );
    }
}

#[test]
fn gate_finish_rejects_test_plan_and_qa_artifact_regressions() {
    let mut cases = vec![
        (
            "malformed_test_plan",
            "malformed_test_plan",
            "QaArtifactNotFresh",
            "test_plan_artifact_malformed",
        ),
        (
            "stale_test_plan",
            "stale_test_plan",
            "QaArtifactNotFresh",
            "test_plan_artifact_stale",
        ),
        (
            "stale_test_plan_head",
            "stale_test_plan_head",
            "QaArtifactNotFresh",
            "test_plan_artifact_stale",
        ),
        (
            "stale_test_plan_branch",
            "stale_test_plan_branch",
            "QaArtifactNotFresh",
            "test_plan_artifact_stale",
        ),
        (
            "stale_test_plan_repo",
            "stale_test_plan_repo",
            "QaArtifactNotFresh",
            "test_plan_artifact_stale",
        ),
        (
            "qa_artifact_malformed",
            "qa_artifact_malformed",
            "QaArtifactNotFresh",
            "qa_artifact_malformed",
        ),
        (
            "qa_plan_mismatch",
            "qa_plan_mismatch",
            "QaArtifactNotFresh",
            "qa_artifact_plan_mismatch",
        ),
        (
            "qa_branch_mismatch",
            "qa_branch_mismatch",
            "QaArtifactNotFresh",
            "qa_artifact_branch_mismatch",
        ),
        (
            "qa_head_mismatch",
            "qa_head_mismatch",
            "QaArtifactNotFresh",
            "qa_artifact_head_mismatch",
        ),
        (
            "qa_repo_mismatch",
            "qa_repo_mismatch",
            "QaArtifactNotFresh",
            "qa_artifact_repo_mismatch",
        ),
        (
            "qa_source_test_plan_mismatch",
            "qa_source_test_plan_mismatch",
            "MalformedExecutionState",
            "test_plan_artifact_authoritative_provenance_invalid",
        ),
        (
            "qa_source_test_plan_escape_existing",
            "qa_source_test_plan_escape_existing",
            "MalformedExecutionState",
            "test_plan_artifact_authoritative_provenance_invalid",
        ),
        (
            "test_plan_authoritative_fingerprint_mismatch",
            "test_plan_authoritative_fingerprint_mismatch",
            "ArtifactIntegrityMismatch",
            "test_plan_artifact_authoritative_provenance_invalid",
        ),
        (
            "qa_result_not_pass",
            "qa_result_not_pass",
            "QaArtifactNotFresh",
            "qa_result_not_pass",
        ),
        (
            "test_plan_generator_mismatch",
            "test_plan_generator_mismatch",
            "QaArtifactNotFresh",
            "test_plan_artifact_generator_mismatch",
        ),
        (
            "qa_generator_mismatch",
            "qa_generator_mismatch",
            "QaArtifactNotFresh",
            "qa_artifact_generator_mismatch",
        ),
    ];
    #[cfg(unix)]
    cases.push((
        "qa_source_test_plan_symlink",
        "qa_source_test_plan_symlink",
        "MalformedExecutionState",
        "test_plan_artifact_authoritative_provenance_invalid",
    ));

    for (case_name, mutator, expected_failure_class, expected_reason_code) in cases {
        let (repo_dir, state_dir) = init_repo(&format!("plan-execution-finish-{case_name}"));
        let repo = repo_dir.path();
        let state = state_dir.path();
        let base_branch = branch_name(repo);
        let (mut test_plan_path, qa_path, _review_path, _release_path) =
            prepare_finished_single_step_finish_gate_fixture(
                repo,
                state,
                "yes",
                true,
                &base_branch,
            );
        let qa_path = qa_path.expect("qa artifact should exist for this fixture");

        match mutator {
            "malformed_test_plan" => {
                replace_in_file(&test_plan_path, "# Test Plan", "# Not A Test Plan");
            }
            "stale_test_plan" => {
                replace_in_file(
                    &test_plan_path,
                    &format!("**Source Plan:** `{PLAN_REL}`"),
                    "**Source Plan:** `docs/featureforge/plans/other-plan.md`",
                );
            }
            "stale_test_plan_head" => {
                replace_in_file(
                    &test_plan_path,
                    &format!("**Head SHA:** {}", current_head_sha(repo)),
                    "**Head SHA:** 0000000000000000000000000000000000000000",
                );
            }
            "stale_test_plan_branch" => {
                replace_in_file(
                    &test_plan_path,
                    &format!("**Branch:** {}", branch_name(repo)),
                    "**Branch:** other-branch",
                );
            }
            "stale_test_plan_repo" => {
                replace_in_file(
                    &test_plan_path,
                    &format!("**Repo:** {}", repo_slug(repo)),
                    "**Repo:** someone-else/other-repo",
                );
            }
            "qa_artifact_malformed" => {
                replace_in_file(&qa_path, "# QA Result", "# Not QA Result");
            }
            "qa_plan_mismatch" => {
                replace_in_file(
                    &qa_path,
                    &format!("**Source Plan:** `{PLAN_REL}`"),
                    "**Source Plan:** `docs/featureforge/plans/other-plan.md`",
                );
            }
            "qa_branch_mismatch" => {
                replace_in_file(
                    &qa_path,
                    &format!("**Branch:** {}", branch_name(repo)),
                    "**Branch:** other-branch",
                );
            }
            "qa_head_mismatch" => {
                replace_in_file(
                    &qa_path,
                    &format!("**Head SHA:** {}", current_head_sha(repo)),
                    "**Head SHA:** 0000000000000000000000000000000000000000",
                );
            }
            "qa_repo_mismatch" => {
                replace_in_file(
                    &qa_path,
                    &format!("**Repo:** {}", repo_slug(repo)),
                    "**Repo:** someone-else/other-repo",
                );
            }
            "qa_source_test_plan_mismatch" => {
                replace_in_file(
                    &qa_path,
                    &format!("**Source Test Plan:** `{}`", test_plan_path.display()),
                    "**Source Test Plan:** `/tmp/not-the-current-test-plan.md`",
                );
            }
            "qa_source_test_plan_escape_existing" => {
                let escaped_test_plan = state.join("escaped-test-plan.md");
                write_file(
                    &escaped_test_plan,
                    "# Test Plan\n**Source Plan:** `docs/featureforge/plans/escape.md`\n",
                );
                replace_in_file(
                    &qa_path,
                    &format!("**Source Test Plan:** `{}`", test_plan_path.display()),
                    &format!("**Source Test Plan:** `{}`", escaped_test_plan.display()),
                );
            }
            "qa_source_test_plan_symlink" => {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::symlink;

                    let symlink_test_plan = test_plan_path
                        .parent()
                        .unwrap_or_else(|| {
                            panic!(
                                "authoritative test-plan path should have a parent: {}",
                                test_plan_path.display()
                            )
                        })
                        .join("test-plan-symlink.md");
                    let _ = fs::remove_file(&symlink_test_plan);
                    symlink(&test_plan_path, &symlink_test_plan)
                        .expect("test-plan symlink should be creatable");
                    replace_in_file(
                        &qa_path,
                        &format!("**Source Test Plan:** `{}`", test_plan_path.display()),
                        &format!("**Source Test Plan:** `{}`", symlink_test_plan.display()),
                    );
                }
            }
            "qa_result_not_pass" => {
                replace_in_file(&qa_path, "**Result:** pass", "**Result:** fail");
            }
            "test_plan_generator_mismatch" => {
                replace_in_file(
                    &test_plan_path,
                    "**Generated By:** featureforge:plan-eng-review",
                    "**Generated By:** made-up-generator",
                );
            }
            "test_plan_authoritative_fingerprint_mismatch" => {
                replace_in_file(
                    &test_plan_path,
                    "## Affected Pages / Routes",
                    "## Affected Pages / Routes\n- authoritative tamper",
                );
            }
            "qa_generator_mismatch" => {
                replace_in_file(
                    &qa_path,
                    "**Generated By:** featureforge:qa-only",
                    "**Generated By:** made-up-generator",
                );
            }
            _ => unreachable!("unexpected mutator"),
        }
        if matches!(
            mutator,
            "malformed_test_plan"
                | "stale_test_plan"
                | "stale_test_plan_head"
                | "stale_test_plan_branch"
                | "stale_test_plan_repo"
                | "test_plan_generator_mismatch"
        ) {
            let updated_test_plan_source = fs::read_to_string(&test_plan_path)
                .expect("mutated authoritative test-plan artifact should be readable");
            let (updated_test_plan_path, _) = republish_authoritative_artifact(
                repo,
                state,
                "test-plan",
                &updated_test_plan_source,
            );
            test_plan_path = updated_test_plan_path;
            rewrite_qa_source_test_plan(&qa_path, &test_plan_path);
        }
        let _ = republish_authoritative_artifact_from_path(
            repo,
            state,
            &qa_path,
            "browser-qa",
            "last_browser_qa_artifact_fingerprint",
        );

        let gate_finish = run_rust_json(
            repo,
            state,
            &["gate-finish", "--plan", PLAN_REL],
            "gate finish with mutated test-plan or qa artifact",
        );

        assert_eq!(gate_finish["allowed"], false, "case {case_name}");
        assert_eq!(
            gate_finish["failure_class"], expected_failure_class,
            "case {case_name}"
        );
        assert_eq!(
            gate_finish["reason_codes"][0], expected_reason_code,
            "case {case_name}"
        );
    }
}

#[test]
fn gate_finish_ignores_overlapping_branch_artifact_decoys() {
    let (repo_dir, state_dir) = init_repo("plan-execution-overlapping-artifact-decoy");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);

    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-b", "feature"])
                .current_dir(repo);
            command
        },
        "git checkout feature branch",
    );

    let (test_plan_path, _qa_path, _review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "no", false, &base_branch);

    let artifact_dir = project_artifact_dir(repo, state);
    write_file(
        &artifact_dir.join("tester-my-feature-code-review-99999999-999999.md"),
        &format!(
            "# Code Review Result\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** my-feature\n**Repo:** {}\n**Base Branch:** not-the-base\n**Head SHA:** 0000000000000000000000000000000000000000\n**Result:** blocked\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-24T23:59:59Z\n\n## Summary\n- decoy review artifact for another branch.\n",
            repo_slug(repo)
        ),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with overlapping-branch decoy artifact",
    );

    assert_eq!(gate_finish["allowed"], true);
    assert!(test_plan_path.exists());
    assert!(release_path.exists());
}

#[test]
fn gate_finish_prefers_recorded_authoritative_final_review_over_newer_branch_decoy() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-authoritative-final-review-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (_test_plan_path, _qa_path, review_path, _release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "no", false, &base_branch);

    let authoritative_review_source = fs::read_to_string(&review_path)
        .expect("source review artifact should be readable for authoritative provenance fixture");
    let authoritative_review_fingerprint = sha256_hex(authoritative_review_source.as_bytes());
    let authoritative_review_file = format!("final-review-{authoritative_review_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_review_file,
        ),
        &authoritative_review_source,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 17,
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": "not_required",
            "release_docs_state": "not_required",
            "last_final_review_artifact_fingerprint": authoritative_review_fingerprint,
        }),
    );

    let branch = branch_name(repo);
    let artifact_dir = project_artifact_dir(repo, state);
    write_file(
        &artifact_dir.join(format!(
            "tester-{}-code-review-99999999-999999.md",
            normalize_identifier(&branch)
        )),
        &format!(
            "# Code Review Result\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** 0000000000000000000000000000000000000000\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-24T23:59:59Z\n\n## Summary\n- newer same-branch decoy should not override recorded authoritative final-review provenance.\n",
            repo_slug(repo)
        ),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should prefer recorded authoritative final-review provenance over latest branch decoy",
    );

    assert_eq!(
        gate_finish["allowed"], true,
        "gate-finish should resolve final-review freshness from recorded authoritative provenance instead of scanning the newest branch artifact"
    );
}

fn write_authoritative_downstream_fixture_state(
    repo: &Path,
    state: &Path,
    test_plan_path: &Path,
    qa_path: &Path,
    review_path: &Path,
    release_path: &Path,
) {
    let branch = branch_name(repo);
    let repo_slug = repo_slug(repo);
    let safe_branch = normalize_identifier(&branch);
    let current_head = current_head_sha(repo);

    let authoritative_test_plan_source = fs::read_to_string(test_plan_path)
        .expect("source test-plan artifact should be readable for authoritative fixture");
    let authoritative_test_plan_fingerprint = sha256_hex(authoritative_test_plan_source.as_bytes());
    let authoritative_test_plan_path = harness_authoritative_artifact_path(
        state,
        &repo_slug,
        &branch,
        &format!("test-plan-{authoritative_test_plan_fingerprint}.md"),
    );
    write_file(
        &authoritative_test_plan_path,
        &authoritative_test_plan_source,
    );

    let authoritative_qa_source = rewrite_source_test_plan_header(
        &fs::read_to_string(qa_path)
            .expect("source QA artifact should be readable for authoritative fixture"),
        &authoritative_test_plan_path,
    );
    let authoritative_qa_fingerprint = sha256_hex(authoritative_qa_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug,
            &branch,
            &format!("browser-qa-{authoritative_qa_fingerprint}.md"),
        ),
        &authoritative_qa_source,
    );

    let authoritative_review_source = fs::read_to_string(review_path)
        .expect("source review artifact should be readable for authoritative fixture");
    let authoritative_review_fingerprint = sha256_hex(authoritative_review_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug,
            &branch,
            &format!("final-review-{authoritative_review_fingerprint}.md"),
        ),
        &authoritative_review_source,
    );

    let authoritative_release_source = fs::read_to_string(release_path)
        .expect("source release artifact should be readable for authoritative fixture");
    let authoritative_release_fingerprint = sha256_hex(authoritative_release_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug,
            &branch,
            &format!("release-docs-{authoritative_release_fingerprint}.md"),
        ),
        &authoritative_release_source,
    );

    let active_contract_rel = "docs/featureforge/execution-evidence/active-execution-contract.md";
    let active_contract_fingerprint =
        write_execution_contract_artifact(repo, active_contract_rel, None);
    let active_contract_source = fs::read_to_string(repo.join(active_contract_rel))
        .expect("source active contract should be readable for authoritative fixture");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug,
            &branch,
            &format!("contract-{active_contract_fingerprint}.md"),
        ),
        &active_contract_source,
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "run_identity": {
                "execution_run_id": format!("run-{safe_branch}-finish"),
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": format!("chunk-{safe_branch}-finish"),
            "latest_authoritative_sequence": 17,
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "reconciled",
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": "fresh",
            "release_docs_state": "fresh",
            "last_final_review_artifact_fingerprint": authoritative_review_fingerprint,
            "last_browser_qa_artifact_fingerprint": authoritative_qa_fingerprint,
            "last_release_docs_artifact_fingerprint": authoritative_release_fingerprint,
            "active_contract_path": format!("contract-{active_contract_fingerprint}.md"),
            "active_contract_fingerprint": active_contract_fingerprint,
            "active_worktree_lease_fingerprints": [],
        }),
    );
    write_serial_unit_review_receipt_artifact(
        repo,
        state,
        &format!("run-{safe_branch}-finish"),
        1,
        1,
        &current_head,
    );
}

#[test]
fn gate_finish_prefers_recorded_authoritative_test_plan_over_newer_branch_decoy() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-authoritative-test-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );

    let branch = branch_name(repo);
    let artifact_dir = project_artifact_dir(repo, state);
    let stale_test_plan = fs::read_to_string(&test_plan_path)
        .expect("source test-plan artifact should be readable for decoy fixture")
        .replace(
            &format!("**Head SHA:** {}", current_head_sha(repo)),
            "**Head SHA:** 0000000000000000000000000000000000000000",
        );
    write_file(
        &artifact_dir.join(format!(
            "tester-{}-test-plan-99999999-999999.md",
            normalize_identifier(&branch)
        )),
        &stale_test_plan,
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should prefer recorded authoritative test-plan provenance over latest branch decoy",
    );

    assert_eq!(
        gate_finish["allowed"], true,
        "gate-finish should resolve test-plan freshness from recorded authoritative downstream provenance instead of scanning the newest branch artifact"
    );
}

#[test]
fn gate_finish_prefers_recorded_authoritative_browser_qa_over_newer_branch_decoy() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-authoritative-browser-qa");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );

    let branch = branch_name(repo);
    let artifact_dir = project_artifact_dir(repo, state);
    let stale_qa = fs::read_to_string(&qa_path)
        .expect("source QA artifact should be readable for decoy fixture")
        .replace(
            &format!("**Head SHA:** {}", current_head_sha(repo)),
            "**Head SHA:** 0000000000000000000000000000000000000000",
        );
    write_file(
        &artifact_dir.join(format!(
            "tester-{}-test-outcome-99999999-999999.md",
            normalize_identifier(&branch)
        )),
        &stale_qa,
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should prefer recorded authoritative browser QA provenance over latest branch decoy",
    );

    assert_eq!(
        gate_finish["allowed"], true,
        "gate-finish should resolve browser-QA freshness from recorded authoritative downstream provenance instead of scanning the newest branch artifact"
    );
}

#[test]
fn gate_finish_prefers_recorded_authoritative_release_docs_over_newer_branch_decoy() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-authoritative-release-docs");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );

    let branch = branch_name(repo);
    let artifact_dir = project_artifact_dir(repo, state);
    let stale_release = fs::read_to_string(&release_path)
        .expect("source release artifact should be readable for decoy fixture")
        .replace(
            &format!("**Head SHA:** {}", current_head_sha(repo)),
            "**Head SHA:** 0000000000000000000000000000000000000000",
        );
    write_file(
        &artifact_dir.join(format!(
            "tester-{}-release-readiness-99999999-999999.md",
            normalize_identifier(&branch)
        )),
        &stale_release,
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should prefer recorded authoritative release-doc provenance over latest branch decoy",
    );

    assert_eq!(
        gate_finish["allowed"], true,
        "gate-finish should resolve release-doc freshness from recorded authoritative downstream provenance instead of scanning the newest branch artifact"
    );
}

#[test]
fn gate_finish_blocks_worktree_lease_before_barrier_reconcile() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-lease-reconcile-pending");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let _approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::ReviewPassedPendingReconcile,
        "pending",
        Some(&current_head_sha(repo)),
        "pending-reconcile",
        true,
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with pending worktree reconcile lease",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_reconcile_pending"
    );
}

#[test]
fn gate_review_blocks_cleaned_worktree_lease_without_receipt_truth() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-review-cleaned-lease-without-receipt");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (_test_plan_path, _qa_path, _review_path, _release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "no", false, &base_branch);
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head_sha(repo)),
        "lease-without-receipt",
        true,
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with cleaned worktree lease but no authoritative receipt truth",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_review["reason_codes"][0],
        "worktree_lease_review_receipt_missing"
    );
}

#[test]
fn gate_review_blocks_worktree_lease_before_barrier_reconcile() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-lease-reconcile-pending");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let _approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::ReviewPassedPendingReconcile,
        "pending",
        Some(&current_head_sha(repo)),
        "pending-reconcile",
        true,
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with pending worktree reconcile lease",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_review["reason_codes"][0],
        "worktree_lease_reconcile_pending"
    );
}

#[test]
fn gate_finish_rejects_stale_dependency_release_even_with_cleaned_lease() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-stale-dependency-release");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (_test_plan_path, _qa_path, _review_path, _release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "no", false, &base_branch);
    let checkpoint = current_head_sha(repo);
    write_worktree_lease_artifact(
        repo,
        state,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&checkpoint),
        "cleaned-release",
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 17,
            "dependency_index_state": "stale",
            "final_review_state": "fresh",
            "browser_qa_state": "not_required",
            "release_docs_state": "not_required",
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with stale dependency release state",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "DependencyIndexMismatch");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "dependency_index_state_stale"
    );
}

#[test]
fn gate_finish_ignores_stale_same_plan_context_lease_from_previous_run() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-stale-same-run-context-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, _current_chunk_id) = current_authoritative_run_identity(repo, state);
    let lease_chunk_id = "historical-chunk";
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        lease_chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::ReviewPassedPendingReconcile,
        "pending",
        Some(&current_head_sha(repo)),
        "current-run",
        true,
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "latest_authoritative_sequence": 18,
        }),
    );

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review should still respect a current-run pending lease after later authoritative mutations",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_review["reason_codes"][0],
        "worktree_lease_reconcile_pending"
    );
}

#[test]
fn gate_finish_allows_dependency_release_after_clean_reconcile() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-cleaned-lease-release-backed-by-receipt");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head_sha(repo)),
        "cleaned-release",
        true,
    );
    let lease_worktree = state.join("worktrees").join("cleaned-release");
    let lease_worktree_string = lease_worktree.display().to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-cleaned-release",
        PLAN_REL,
        1,
        &lease_worktree_string,
        &current_head_sha(repo),
        "cleaned-release",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with cleaned worktree lease",
    );

    assert_eq!(gate_finish["allowed"], true);
    assert_eq!(gate_finish["failure_class"], "");
    assert!(
        gate_finish["reason_codes"]
            .as_array()
            .is_some_and(Vec::is_empty)
    );
}

#[test]
fn gate_finish_requires_receipts_for_every_active_worktree_lease() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-multi-lease-receipts");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);

    let (lease_one_path, lease_one_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "lease-one",
        true,
    );
    let lease_one_worktree = state.join("worktrees").join("lease-one");
    let lease_one_worktree_string = lease_one_worktree.display().to_string();
    let (receipt_one_path, receipt_one_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_one_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-lease-one",
        PLAN_REL,
        1,
        &lease_one_worktree_string,
        &current_head,
        "lease-one",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id.clone(),
            "lease_fingerprint": lease_one_fingerprint,
            "lease_artifact_path": lease_one_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint.clone(),
            "review_receipt_fingerprint": receipt_one_fingerprint,
            "review_receipt_artifact_path": receipt_one_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let (lease_two_path, lease_two_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "lease-two",
        true,
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_two_fingerprint,
            "lease_artifact_path": lease_two_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with two active leases where only one has a matching receipt",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_review_receipt_missing"
    );
}

#[test]
fn gate_finish_fails_closed_when_bound_worktree_lease_artifact_is_missing() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-missing-bound-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "missing-bound-lease",
        true,
    );
    let missing_path = state.join("lease-renamed.json");
    fs::rename(&lease_path, &missing_path).expect("lease artifact should be renameable");
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with a missing bound worktree lease artifact",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_metadata_unreadable"
    );
}

#[test]
fn gate_finish_rejects_stale_unit_review_receipt() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-stale-unit-review-receipt");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "stale-unit-review",
        true,
    );
    let lease_worktree = state.join("worktrees").join("stale-unit-review");
    let lease_worktree_string = lease_worktree.display().to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-stale-unit-review",
        PLAN_REL,
        1,
        &lease_worktree_string,
        &current_head,
        "stale-unit-review",
    );
    replace_in_file(
        &receipt_path,
        &format!("**Reviewed Checkpoint SHA:** {}", current_head),
        "**Reviewed Checkpoint SHA:** 0000000000000000000000000000000000000000",
    );
    let stale_receipt_source =
        fs::read_to_string(&receipt_path).expect("stale receipt should be readable");
    let stale_receipt_fingerprint =
        canonical_unit_review_receipt_fingerprint(&stale_receipt_source);
    replace_in_file(
        &receipt_path,
        &format!("**Receipt Fingerprint:** {receipt_fingerprint}"),
        &format!("**Receipt Fingerprint:** {stale_receipt_fingerprint}"),
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": stale_receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with a stale unit-review receipt",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "StaleProvenance");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_review_receipt_checkpoint_mismatch"
    );
}

#[test]
fn gate_finish_rejects_absolute_worktree_lease_binding_path() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-absolute-binding-path");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let active_contract_fingerprint = current_active_contract_fingerprint(repo, state);
    let execution_context_key = current_worktree_lease_execution_context_key(
        &execution_run_id,
        "unit-absolute-binding-path",
        PLAN_REL,
        1,
        &base_branch,
        &current_head,
    );
    let (_lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "absolute-binding-path",
        true,
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "execution_context_key": execution_context_key,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": state.join("absolute-binding-path.json").display().to_string(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "approved_unit_contract_fingerprint": approved_unit_contract_fingerprint_for_review(
                &active_contract_fingerprint,
                &approved_task_packet_fingerprint,
                "unit-absolute-binding-path",
            ),
            "reviewed_checkpoint_commit_sha": current_head,
            "reconcile_mode": "identity_preserving",
            "reconcile_result_commit_sha": current_head,
            "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject an absolute worktree lease binding path",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_binding_path_invalid"
    );
}

#[test]
fn gate_finish_rejects_escaped_unit_review_receipt_binding_path() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-escaped-receipt-path");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let active_contract_fingerprint = current_active_contract_fingerprint(repo, state);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let execution_context_key = current_worktree_lease_execution_context_key(
        &execution_run_id,
        "unit-escaped-receipt-path",
        PLAN_REL,
        1,
        &base_branch,
        &current_head,
    );
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "escaped-receipt-path",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("escaped-receipt-path")
        .display()
        .to_string();
    let (_receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-escaped-receipt-path",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "escaped-receipt-path",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "execution_context_key": execution_context_key,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "approved_unit_contract_fingerprint": approved_unit_contract_fingerprint_for_review(
                &active_contract_fingerprint,
                &approved_task_packet_fingerprint,
                "unit-escaped-receipt-path",
            ),
            "reviewed_checkpoint_commit_sha": current_head,
            "reconcile_mode": "identity_preserving",
            "reconcile_result_commit_sha": current_head,
            "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": "../escaped-receipt-path.md",
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject an escaped unit-review receipt binding path",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_binding_path_invalid"
    );
}

#[test]
fn gate_finish_fails_closed_when_index_cleared_and_renamed_current_run_lease_exists() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-cleared-index-renamed-current-run-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let (lease_path, _lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "renamed-current-run-lease",
        false,
    );
    let renamed_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        "renamed-current-run-lease.json",
    );
    fs::copy(&lease_path, &renamed_path)
        .expect("lease should be copyable to a renamed noncanonical filename");
    fs::remove_file(&lease_path).expect("canonical lease artifact should be removable");
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "active_worktree_lease_fingerprints": [],
            "active_worktree_lease_bindings": [],
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should fail closed when a renamed current-run lease exists without an active fingerprint index",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_authoritative_binding_missing"
    );
}

#[test]
fn gate_finish_rejects_stale_rebound_worktree_lease_filename() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-stale-rebound-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "stale-rebound-lease",
        true,
    );
    let rebound_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        "rebounded-stale-lease.json",
    );
    fs::copy(&lease_path, &rebound_path).expect("lease should be copyable to a rebound filename");
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": rebound_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject a stale rebound worktree lease filename",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_binding_path_invalid"
    );
}

#[test]
fn gate_finish_fails_closed_when_worktree_lease_fingerprint_index_is_cleared() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-cleared-lease-index");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "cleared-lease-index",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("cleared-lease-index")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-cleared-lease-index",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "cleared-lease-index",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "active_worktree_lease_fingerprints": [],
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should fail closed when the active lease fingerprint index is cleared",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_authoritative_binding_missing"
    );
}

#[test]
fn gate_finish_fails_closed_when_authoritative_worktree_lease_index_keys_are_missing() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-missing-lease-index-keys");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "missing-lease-index-keys",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("missing-lease-index-keys")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-missing-lease-index-keys",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "missing-lease-index-keys",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "run_identity": {
                "execution_run_id": execution_run_id,
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": chunk_id,
            "latest_authoritative_sequence": 17,
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "reconciled",
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": "fresh",
            "release_docs_state": "fresh",
        }),
    );
    let harness_state_path = harness_state_file_path(repo, state);
    let mut harness_state_json: Value = serde_json::from_str(
        &fs::read_to_string(&harness_state_path)
            .expect("harness state should be readable to remove lease index keys"),
    )
    .expect("harness state should be valid json to remove lease index keys");
    let harness_state_object = harness_state_json
        .as_object_mut()
        .expect("harness state should remain a JSON object");
    harness_state_object.remove("active_worktree_lease_fingerprints");
    harness_state_object.remove("active_worktree_lease_bindings");
    write_file(
        &harness_state_path,
        &serde_json::to_string_pretty(&harness_state_json)
            .expect("harness state should serialize after removing lease index keys"),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should fail closed when authoritative lease index keys are missing",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_authoritative_index_missing"
    );
}

#[test]
fn gate_finish_rejects_malformed_authoritative_worktree_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-malformed-state");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "malformed-state",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("malformed-state")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-malformed-state",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "malformed-state",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "run_identity": {
                "execution_run_id": execution_run_id,
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": chunk_id,
            "latest_authoritative_sequence": 17,
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "reconciled",
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": "fresh",
            "release_docs_state": "fresh",
            "active_worktree_lease_fingerprints": [lease_fingerprint],
            "active_worktree_lease_bindings": [{
                "execution_run_id": execution_run_id,
                "lease_fingerprint": lease_fingerprint,
                "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
                "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
                "review_receipt_fingerprint": receipt_fingerprint,
                "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            }],
        }),
    );
    write_file(
        &harness_state_file_path(repo, state),
        "{ this is not valid json }",
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject malformed authoritative harness state",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "authoritative_state_unavailable"
    );
}

#[test]
fn gate_finish_rejects_non_regular_authoritative_worktree_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-non-regular-state");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "non-regular-state",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("non-regular-state")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-non-regular-state",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "non-regular-state",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "run_identity": {
                "execution_run_id": execution_run_id,
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": chunk_id,
            "latest_authoritative_sequence": 17,
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "reconciled",
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": "fresh",
            "release_docs_state": "fresh",
            "active_worktree_lease_fingerprints": [lease_fingerprint],
            "active_worktree_lease_bindings": [{
                "execution_run_id": execution_run_id,
                "lease_fingerprint": lease_fingerprint,
                "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
                "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
                "review_receipt_fingerprint": receipt_fingerprint,
                "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            }],
        }),
    );
    let harness_state_path = harness_state_file_path(repo, state);
    let _ = fs::remove_file(&harness_state_path);
    fs::create_dir(&harness_state_path).expect("state path should be creatable as a directory");

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject non-regular authoritative harness state",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "authoritative_state_unavailable"
    );
}

#[cfg(unix)]
#[test]
fn gate_finish_rejects_symlinked_authoritative_worktree_state() {
    use std::os::unix::fs::symlink;

    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-symlinked-state");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "symlinked-state",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("symlinked-state")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-symlinked-state",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "symlinked-state",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "run_identity": {
                "execution_run_id": execution_run_id,
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": chunk_id,
            "latest_authoritative_sequence": 17,
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "reconciled",
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": "fresh",
            "release_docs_state": "fresh",
            "active_worktree_lease_fingerprints": [lease_fingerprint],
            "active_worktree_lease_bindings": [{
                "execution_run_id": execution_run_id,
                "lease_fingerprint": lease_fingerprint,
                "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
                "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
                "review_receipt_fingerprint": receipt_fingerprint,
                "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            }],
        }),
    );
    let harness_state_path = harness_state_file_path(repo, state);
    let target_path = state.join("symlinked-harness-state.json");
    write_file(&target_path, "{}");
    fs::remove_file(&harness_state_path).expect("state file should be removable");
    symlink(&target_path, &harness_state_path).expect("state file symlink should be creatable");

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject symlinked authoritative harness state",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "authoritative_state_unavailable"
    );
}

#[test]
fn gate_finish_rejects_worktree_lease_body_with_stale_execution_run_id() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-stale-lease-run-id");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, _lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "stale-run-id-body",
        true,
    );
    let lease_source = fs::read_to_string(&lease_path).expect("lease should be readable");
    let mut lease_json: Value =
        serde_json::from_str(&lease_source).expect("lease should parse as json");
    let stale_run_id = "run-previous-execution".to_string();
    lease_json
        .as_object_mut()
        .expect("lease should remain an object")
        .insert(
            "execution_run_id".to_string(),
            Value::String(stale_run_id.clone()),
        );
    let stale_run_id_fingerprint = canonical_worktree_lease_fingerprint(&lease_json);
    lease_json
        .as_object_mut()
        .expect("lease should remain an object")
        .insert(
            "lease_fingerprint".to_string(),
            Value::String(stale_run_id_fingerprint.clone()),
        );
    let stale_lease_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!(
            "worktree-lease-{}-{}-{}.json",
            branch_storage_key(&branch_name(repo)),
            stale_run_id,
            current_worktree_lease_execution_context_key(
                &execution_run_id,
                "unit-stale-run-id-body",
                PLAN_REL,
                1,
                &base_branch,
                &current_head,
            )
        ),
    );
    write_file(
        &stale_lease_path,
        &serde_json::to_string_pretty(&lease_json).expect("lease should serialize"),
    );
    fs::remove_file(&lease_path).expect("original lease artifact should be removable");
    let harness_state_path = harness_state_file_path(repo, state);
    let mut harness_state_json: Value = serde_json::from_str(
        &fs::read_to_string(&harness_state_path)
            .expect("harness state should be readable to rewrite lease fingerprints"),
    )
    .expect("harness state should be valid json to rewrite lease fingerprints");
    harness_state_json
        .as_object_mut()
        .expect("harness state should remain a JSON object")
        .insert(
            "active_worktree_lease_fingerprints".to_string(),
            Value::Array(vec![Value::String(stale_run_id_fingerprint.clone())]),
        );
    write_file(
        &harness_state_path,
        &serde_json::to_string_pretty(&harness_state_json)
            .expect("harness state should serialize after rewriting lease fingerprints"),
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("stale-run-id-body")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &stale_run_id_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-stale-run-id-body",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "stale-run-id-body",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "execution_context_key": current_worktree_lease_execution_context_key(
                &execution_run_id,
                "unit-stale-run-id-body",
                PLAN_REL,
                1,
                &base_branch,
                &current_head,
            ),
            "lease_fingerprint": stale_run_id_fingerprint,
            "lease_artifact_path": stale_lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject a lease body with a stale execution run id",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_run_id_mismatch"
    );
}

#[test]
fn gate_finish_fails_closed_when_cleared_index_current_run_lease_is_malformed() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-cleared-index-malformed-current-run-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let active_contract_fingerprint = current_active_contract_fingerprint(repo, state);
    let execution_context_key = current_worktree_lease_execution_context_key(
        &execution_run_id,
        "unit-malformed-current-run-lease",
        PLAN_REL,
        1,
        &base_branch,
        &current_head,
    );
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "malformed-current-run-lease",
        false,
    );
    write_file(&lease_path, "{ not valid json }");
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "active_worktree_lease_fingerprints": [],
        }),
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "execution_context_key": execution_context_key,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "approved_unit_contract_fingerprint": approved_unit_contract_fingerprint_for_review(
                &active_contract_fingerprint,
                &approved_task_packet_fingerprint,
                "unit-malformed-current-run-lease",
            ),
            "reviewed_checkpoint_commit_sha": current_head,
            "reconcile_mode": "identity_preserving",
            "reconcile_result_commit_sha": current_head,
            "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should fail closed when a malformed current-run lease exists behind an empty index",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_artifacts_unreadable"
    );
}

#[cfg(unix)]
#[test]
fn gate_finish_fails_closed_when_cleared_index_current_run_lease_is_unreadable() {
    use std::os::unix::fs::PermissionsExt;

    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-cleared-index-unreadable-current-run-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let active_contract_fingerprint = current_active_contract_fingerprint(repo, state);
    let execution_context_key = current_worktree_lease_execution_context_key(
        &execution_run_id,
        "unit-unreadable-current-run-lease",
        PLAN_REL,
        1,
        &base_branch,
        &current_head,
    );
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "unreadable-current-run-lease",
        false,
    );
    let mut permissions = fs::metadata(&lease_path)
        .expect("lease artifact should be statable")
        .permissions();
    permissions.set_mode(0o000);
    fs::set_permissions(&lease_path, permissions)
        .expect("lease artifact permissions should be set unreadable");
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "active_worktree_lease_fingerprints": [],
        }),
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "execution_context_key": execution_context_key,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "approved_unit_contract_fingerprint": approved_unit_contract_fingerprint_for_review(
                &active_contract_fingerprint,
                &approved_task_packet_fingerprint,
                "unit-unreadable-current-run-lease",
            ),
            "reviewed_checkpoint_commit_sha": current_head,
            "reconcile_mode": "identity_preserving",
            "reconcile_result_commit_sha": current_head,
            "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should fail closed when a current-run lease is unreadable behind an empty index",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_artifacts_unreadable"
    );
}

#[test]
fn gate_finish_rejects_rewritten_reconcile_proof_without_matching_runtime_binding() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-rewritten-reconcile-proof");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let reviewed_checkpoint = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let _execution_context_key = current_worktree_lease_execution_context_key(
        &execution_run_id,
        "unit-rewritten-reconcile-proof",
        PLAN_REL,
        1,
        &branch_name(repo),
        &reviewed_checkpoint,
    );
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&reviewed_checkpoint),
        "rewritten-reconcile-proof",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("rewritten-reconcile-proof")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-rewritten-reconcile-proof",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &reviewed_checkpoint,
        "rewritten-reconcile-proof",
    );
    let receipt_source =
        fs::read_to_string(&receipt_path).expect("unit-review receipt should be readable");
    let rewritten_receipt_source = receipt_source.replace(
        &format!("**Reconciled Result SHA:** {reviewed_checkpoint}"),
        "**Reconciled Result SHA:** forged-rewrite-result-sha",
    );
    let rewritten_receipt_fingerprint =
        canonical_unit_review_receipt_fingerprint(&rewritten_receipt_source);
    let final_receipt_source = rewritten_receipt_source.replace(
        &format!("**Receipt Fingerprint:** {receipt_fingerprint}"),
        &format!("**Receipt Fingerprint:** {rewritten_receipt_fingerprint}"),
    );
    write_file(&receipt_path, &final_receipt_source);
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "reviewed_checkpoint_commit_sha": reviewed_checkpoint,
            "review_receipt_fingerprint": rewritten_receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject a rewritten reconcile proof that does not match the runtime binding",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_identity_preserving_proof_mismatch"
    );
}

#[test]
fn gate_finish_rejects_duplicate_worktree_lease_bindings() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-duplicate-bindings");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_one_path, lease_one_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "duplicate-binding-one",
        true,
    );
    let lease_one_worktree_string = state
        .join("worktrees")
        .join("duplicate-binding-one")
        .display()
        .to_string();
    let (receipt_one_path, receipt_one_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_one_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-duplicate-binding-one",
        PLAN_REL,
        1,
        &lease_one_worktree_string,
        &current_head,
        "duplicate-binding-one",
    );
    let (_lease_two_path, lease_two_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "duplicate-binding-two",
        true,
    );
    let lease_two_worktree_string = state
        .join("worktrees")
        .join("duplicate-binding-two")
        .display()
        .to_string();
    let (receipt_two_path, receipt_two_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_two_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-duplicate-binding-two",
        PLAN_REL,
        1,
        &lease_two_worktree_string,
        &current_head,
        "duplicate-binding-two",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id.clone(),
            "lease_fingerprint": lease_one_fingerprint,
            "lease_artifact_path": lease_one_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint.clone(),
            "review_receipt_fingerprint": receipt_one_fingerprint,
            "review_receipt_artifact_path": receipt_one_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_one_fingerprint,
            "lease_artifact_path": lease_one_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint.clone(),
            "review_receipt_fingerprint": receipt_two_fingerprint,
            "review_receipt_artifact_path": receipt_two_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );
    append_active_worktree_lease_fingerprint(repo, state, &lease_one_fingerprint);
    append_active_worktree_lease_fingerprint(repo, state, &lease_two_fingerprint);

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject duplicate worktree lease bindings",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_authoritative_binding_duplicate"
    );
}

#[test]
fn gate_finish_accepts_isolated_branch_backed_worktree_lease() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-isolated-branch-backed-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint_and_branches!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "isolated-branch-backed",
        true,
        "feature/isolated-worktree",
        &base_branch,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("isolated-branch-backed")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-isolated-branch-backed",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "isolated-branch-backed",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should accept an isolated branch-backed worktree lease",
    );

    assert_eq!(gate_finish["allowed"], true);
    assert_eq!(gate_finish["failure_class"], "");
    assert!(
        gate_finish["reason_codes"]
            .as_array()
            .is_some_and(Vec::is_empty)
    );
}

#[test]
fn gate_finish_rejects_unit_review_receipt_missing_unit_contract_binding() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-missing-task-packet-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "missing-task-packet-binding",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("missing-task-packet-binding")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-missing-task-packet-binding",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "missing-task-packet-binding",
    );
    let receipt_source =
        fs::read_to_string(&receipt_path).expect("unit-review receipt should be readable");
    let without_unit_contract_line = receipt_source.replace(
        &format!(
            "**Approved Unit Contract Fingerprint:** {}\n",
            approved_unit_contract_fingerprint_for_review(
                &current_active_contract_fingerprint(repo, state),
                &approved_task_packet_fingerprint,
                "unit-missing-task-packet-binding",
            )
        ),
        "",
    );
    let rewritten_fingerprint =
        canonical_unit_review_receipt_fingerprint(&without_unit_contract_line);
    let final_receipt_source = without_unit_contract_line.replace(
        &format!("**Receipt Fingerprint:** {receipt_fingerprint}"),
        &format!("**Receipt Fingerprint:** {rewritten_fingerprint}"),
    );
    write_file(&receipt_path, &final_receipt_source);
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": rewritten_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject a unit-review receipt missing the approved unit contract binding",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_review_receipt_unit_contract_missing"
    );
}

#[test]
fn gate_finish_rejects_forged_task_packet_binding_without_authoritative_contract_truth() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-forged-task-packet-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let forged_task_packet_fingerprint =
        String::from("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "forged-task-packet-binding",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("forged-task-packet-binding")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &forged_task_packet_fingerprint,
        "unit-forged-task-packet-binding",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "forged-task-packet-binding",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": forged_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject a self-consistent forged task packet binding that is not authoritative",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_review_receipt_task_packet_not_authoritative"
    );
}

#[test]
fn gate_finish_ignores_cleaned_lease_from_other_plan_revision() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-foreign-plan-lease-ignored");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let foreign_run_id = format!("run-{}-foreign", normalize_identifier(&branch_name(repo)));
    let foreign_chunk_id = "chunk-foreign";
    write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &foreign_run_id,
        foreign_chunk_id,
        "docs/featureforge/plans/unrelated-plan.md",
        2,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some("0000000000000000000000000000000000000000"),
        "foreign-plan",
        false,
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should ignore a cleaned lease from another plan context",
    );

    assert_eq!(gate_finish["allowed"], true);
    assert_eq!(gate_finish["failure_class"], "");
    assert!(
        gate_finish["reason_codes"]
            .as_array()
            .is_some_and(Vec::is_empty)
    );
}

#[test]
fn gate_finish_rejects_forged_regular_worktree_lease_not_indexed_by_harness() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-forged-lease-not-indexed-by-harness");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let lease_json = json!({
        "lease_version": 1,
        "authoritative_sequence": 17,
        "execution_run_id": execution_run_id,
        "execution_context_key": current_worktree_lease_execution_context_key(
            &execution_run_id,
            "unit-forged-unindexed",
            PLAN_REL,
            1,
            &branch_name(repo),
            &current_head,
        ),
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_unit_id": "unit-forged-unindexed",
        "source_branch": branch,
        "authoritative_integration_branch": branch_name(repo),
        "worktree_path": state.join("worktrees").join("forged-unindexed").display().to_string(),
        "repo_state_baseline_head_sha": current_head,
        "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
        "lease_state": WorktreeLeaseState::Cleaned,
        "cleanup_state": "cleaned",
        "reviewed_checkpoint_commit_sha": current_head,
        "reconcile_result_commit_sha": current_head,
        "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
        "reconcile_mode": "identity_preserving",
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T12:00:00Z",
        "lease_fingerprint": "",
    });
    let lease_fingerprint = canonical_worktree_lease_fingerprint(&lease_json);
    let lease_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch,
        &format!(
            "worktree-lease-{safe_branch}-{execution_run_id}-{chunk_id}-forged-unindexed.json"
        ),
    );
    fs::write(
        &lease_path,
        serde_json::to_string_pretty(&json!({
            "lease_version": 1,
            "authoritative_sequence": 17,
            "execution_run_id": execution_run_id,
            "execution_context_key": current_worktree_lease_execution_context_key(
                &execution_run_id,
                "unit-forged-unindexed",
                PLAN_REL,
                1,
                &branch_name(repo),
                &current_head,
            ),
            "source_plan_path": PLAN_REL,
            "source_plan_revision": 1,
            "execution_unit_id": "unit-forged-unindexed",
            "source_branch": branch,
            "authoritative_integration_branch": branch_name(repo),
            "worktree_path": state.join("worktrees").join("forged-unindexed").display().to_string(),
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "lease_state": WorktreeLeaseState::Cleaned,
            "cleanup_state": "cleaned",
            "reviewed_checkpoint_commit_sha": current_head,
            "reconcile_result_commit_sha": current_head,
            "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
            "reconcile_mode": "identity_preserving",
            "generated_by": "featureforge:executing-plans",
            "generated_at": "2026-03-27T12:00:00Z",
            "lease_fingerprint": lease_fingerprint,
        }))
        .expect("forged lease should serialize"),
    )
    .expect("forged lease should be writable");
    append_active_worktree_lease_fingerprint(repo, state, &lease_fingerprint);
    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject a self-consistent lease that was not harness-bound",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_authoritative_binding_missing"
    );
}

#[test]
fn gate_finish_accepts_cleaned_lease_with_ancestor_checkpoint() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-ancestor-checkpoint-lease");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let reviewed_checkpoint = current_head_sha(repo);
    advance_repo_head(
        repo,
        "docs/featureforge/execution-evidence/ancestor-checkpoint-marker.md",
        "# ancestor checkpoint marker\n",
        "advance head after lease checkpoint",
    );
    let current_head = current_head_sha(repo);
    let refreshed_test_plan_path = write_test_plan_artifact(repo, state, "yes");
    let refreshed_qa_path = write_qa_result_artifact(repo, state, &refreshed_test_plan_path);
    let refreshed_review_path = write_code_review_artifact(repo, state, &base_branch);
    let refreshed_release_path = write_release_readiness_artifact(repo, state, &base_branch);
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &refreshed_test_plan_path,
        &refreshed_qa_path,
        &refreshed_review_path,
        &refreshed_release_path,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
        }),
    );
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let (lease_path, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&reviewed_checkpoint),
        "ancestor-checkpoint",
        true,
    );
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("ancestor-checkpoint")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-ancestor-checkpoint",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &reviewed_checkpoint,
        "ancestor-checkpoint",
    );
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should accept a cleaned lease whose checkpoint is an ancestor of HEAD",
    );

    assert_eq!(gate_finish["allowed"], true);
    assert_eq!(gate_finish["failure_class"], "");
    assert!(
        gate_finish["reason_codes"]
            .as_array()
            .is_some_and(Vec::is_empty)
    );
}

#[test]
fn gate_finish_ignores_malformed_foreign_worktree_lease_artifact() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-finish-foreign-malformed-lease-ignored");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );

    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let artifacts_dir = state
        .join("projects")
        .join(repo_slug(repo))
        .join("branches")
        .join(&safe_branch)
        .join("execution-harness")
        .join("authoritative-artifacts");
    write_file(
        &artifacts_dir.join(format!("worktree-lease-{safe_branch}-foreign-run.json")),
        "{ this is not valid json }",
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should ignore malformed foreign worktree lease artifacts",
    );

    assert_eq!(gate_finish["allowed"], true);
    assert_eq!(gate_finish["failure_class"], "");
    assert!(
        gate_finish["reason_codes"]
            .as_array()
            .is_some_and(Vec::is_empty)
    );
}

#[cfg(unix)]
#[test]
fn gate_finish_rejects_symlinked_worktree_lease_path() {
    use std::os::unix::fs::symlink;

    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-lease-symlink");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let (target_artifact, lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        &chunk_id,
        PLAN_REL,
        1,
        17,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head),
        "lease-target",
        true,
    );
    let target_path = state.join("lease-target.json");
    fs::copy(&target_artifact, &target_path).expect("lease target should be copyable");
    fs::remove_file(&target_artifact).expect("original lease artifact should be removable");
    symlink(&target_path, &target_artifact).expect("lease symlink should be creatable");
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": target_artifact.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "review_receipt_fingerprint": Value::Null,
            "review_receipt_artifact_path": Value::Null,
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish should reject symlinked authoritative lease paths",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_path_not_regular_file"
    );
}

#[test]
fn gate_finish_rejects_rewritten_checkpoint_integration() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-rewritten-checkpoint");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let _execution_context_key = current_worktree_lease_execution_context_key(
        &execution_run_id,
        "unit-rewritten-checkpoint",
        PLAN_REL,
        1,
        &branch_name(repo),
        &current_head,
    );
    let lease_json = json!({
        "lease_version": 1,
        "authoritative_sequence": 17,
        "execution_run_id": execution_run_id,
        "execution_context_key": current_worktree_lease_execution_context_key(
            &execution_run_id,
            "unit-rewritten-checkpoint",
            PLAN_REL,
            1,
            &branch_name(repo),
            &current_head,
        ),
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_unit_id": "unit-rewritten-checkpoint",
        "source_branch": branch,
        "authoritative_integration_branch": branch_name(repo),
        "worktree_path": state.join("worktrees").join("rewritten-checkpoint").display().to_string(),
        "repo_state_baseline_head_sha": current_head,
        "repo_state_baseline_worktree_fingerprint": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "lease_state": WorktreeLeaseState::Reconciled,
        "cleanup_state": "cleaned",
        "reviewed_checkpoint_commit_sha": current_head,
        "reconcile_result_commit_sha": current_head,
        "reconcile_mode": "identity_preserving",
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T12:00:00Z",
        "lease_fingerprint": "",
    });
    let lease_fingerprint = canonical_worktree_lease_fingerprint(&lease_json);
    let lease_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch,
        &format!(
            "worktree-lease-{safe_branch}-{execution_run_id}-{chunk_id}-rewritten-checkpoint.json"
        ),
    );
    write_file(
        &lease_path,
        &serde_json::to_string_pretty(&json!({
            "lease_version": 1,
            "authoritative_sequence": 17,
            "execution_run_id": execution_run_id,
            "execution_context_key": current_worktree_lease_execution_context_key(
                &execution_run_id,
                "unit-rewritten-checkpoint",
                PLAN_REL,
                1,
                &branch_name(repo),
                &current_head,
            ),
            "source_plan_path": PLAN_REL,
            "source_plan_revision": 1,
            "execution_unit_id": "unit-rewritten-checkpoint",
            "source_branch": branch,
            "authoritative_integration_branch": branch_name(repo),
            "worktree_path": state.join("worktrees").join("rewritten-checkpoint").display().to_string(),
            "repo_state_baseline_head_sha": current_head,
            "repo_state_baseline_worktree_fingerprint": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "lease_state": WorktreeLeaseState::Reconciled,
            "cleanup_state": "cleaned",
            "reviewed_checkpoint_commit_sha": current_head,
            "reconcile_result_commit_sha": current_head,
            "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
            "reconcile_mode": "identity_preserving",
            "generated_by": "featureforge:executing-plans",
            "generated_at": "2026-03-27T12:00:00Z",
            "lease_fingerprint": lease_fingerprint,
        }))
        .expect("rewritten lease should serialize"),
    );
    append_active_worktree_lease_fingerprint(repo, state, &lease_fingerprint);
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("rewritten-checkpoint")
        .display()
        .to_string();
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &lease_fingerprint,
        &approved_task_packet_fingerprint,
        "unit-rewritten-checkpoint",
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "rewritten-checkpoint",
    );
    let receipt_source =
        fs::read_to_string(&receipt_path).expect("unit-review receipt should be readable");
    let rewritten_receipt_source = receipt_source.replace(
        &format!("**Reconciled Result SHA:** {current_head}"),
        "**Reconciled Result SHA:** forged-rewrite-result-sha",
    );
    let rewritten_receipt_fingerprint =
        canonical_unit_review_receipt_fingerprint(&rewritten_receipt_source);
    let final_receipt_source = rewritten_receipt_source.replace(
        &format!("**Receipt Fingerprint:** {receipt_fingerprint}"),
        &format!("**Receipt Fingerprint:** {rewritten_receipt_fingerprint}"),
    );
    write_file(&receipt_path, &final_receipt_source);
    append_active_worktree_lease_binding(
        repo,
        state,
        json!({
            "execution_run_id": execution_run_id,
            "lease_fingerprint": lease_fingerprint,
            "lease_artifact_path": lease_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
            "approved_task_packet_fingerprint": approved_task_packet_fingerprint,
            "review_receipt_fingerprint": rewritten_receipt_fingerprint,
            "review_receipt_artifact_path": receipt_path.file_name().and_then(|value| value.to_str()).unwrap_or_default(),
        }),
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with rewritten checkpoint integration",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_binding_path_invalid"
    );
}

#[test]
fn gate_finish_rejects_tampered_worktree_lease_body_proof() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-tampered-lease-proof");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let execution_unit_id = "unit-tampered-lease-proof";
    let reviewed_worktree_string = state
        .join("worktrees")
        .join("tampered-lease-proof")
        .display()
        .to_string();
    let (lease_path, _lease_fingerprint) = write_worktree_lease_artifact_for_run_identity_with_fingerprint!(
        repo,
        state,
        &execution_run_id,
        "chunk-lease-proof",
        PLAN_REL,
        1,
        19,
        WorktreeLeaseState::Reconciled,
        "cleaned",
        Some(&current_head),
        "tampered-lease-proof",
        true,
    );
    let mut lease_json: Value = serde_json::from_str(
        &fs::read_to_string(&lease_path).expect("worktree lease should be readable for tamper"),
    )
    .expect("worktree lease should be valid json for tamper");
    lease_json
        .as_object_mut()
        .expect("worktree lease should be an object")
        .insert(
            String::from("reconcile_result_proof_fingerprint"),
            Value::String(sha256_hex(b"forged-lease-proof")),
        );
    lease_json
        .as_object_mut()
        .expect("worktree lease should remain an object")
        .insert(
            String::from("lease_fingerprint"),
            Value::String(String::new()),
        );
    let tampered_lease_fingerprint = canonical_worktree_lease_fingerprint(&lease_json);
    lease_json
        .as_object_mut()
        .expect("worktree lease should remain an object")
        .insert(
            String::from("lease_fingerprint"),
            Value::String(tampered_lease_fingerprint.clone()),
        );
    write_file(
        &lease_path,
        &serde_json::to_string_pretty(&lease_json)
            .expect("tampered lease should serialize for rewrite"),
    );
    let (receipt_path, receipt_fingerprint) = write_unit_review_receipt_artifact_for_lease!(
        repo,
        state,
        &execution_run_id,
        &tampered_lease_fingerprint,
        &approved_task_packet_fingerprint,
        execution_unit_id,
        PLAN_REL,
        1,
        &reviewed_worktree_string,
        &current_head,
        "tampered-lease-proof",
    );
    let receipt_source = fs::read_to_string(&receipt_path)
        .expect("unit-review receipt should be readable for lease binding");
    let git_dir = gix::discover(repo)
        .expect("git repo should be discoverable")
        .path()
        .to_path_buf();
    let branch = branch_name(repo);
    let runtime = ExecutionRuntime {
        repo_root: repo.to_path_buf(),
        git_dir,
        branch_name: branch.clone(),
        repo_slug: repo_slug(repo),
        safe_branch: normalize_identifier(&branch),
        state_dir: state.to_path_buf(),
    };
    persist_active_worktree_lease_index(
        &runtime,
        RunIdentitySnapshot {
            execution_run_id: ExecutionRunId::new(execution_run_id.clone()),
            source_plan_path: PLAN_REL.to_owned(),
            source_plan_revision: 1,
        },
        ChunkId::new(chunk_id.clone()),
        vec![tampered_lease_fingerprint.clone()],
        vec![WorktreeLeaseBindingSnapshot {
            execution_run_id: execution_run_id.clone(),
            lease_fingerprint: tampered_lease_fingerprint.clone(),
            lease_artifact_path: lease_path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_owned(),
            execution_context_key: Some(
                execution_context_key_from_unit_review_receipt(&receipt_source)
                    .expect("unit-review receipt should carry an execution context key"),
            ),
            approved_task_packet_fingerprint: Some(approved_task_packet_fingerprint.clone()),
            approved_unit_contract_fingerprint: Some(
                approved_unit_contract_from_unit_review_receipt(&receipt_source)
                    .expect("unit-review receipt should bind an approved unit contract"),
            ),
            reconcile_result_proof_fingerprint: Some(
                reconcile_result_proof_fingerprint_from_unit_review_receipt(&receipt_source)
                    .expect("unit-review receipt should carry a proof fingerprint"),
            ),
            reviewed_checkpoint_commit_sha: Some(
                reviewed_checkpoint_from_unit_review_receipt(&receipt_source)
                    .expect("unit-review receipt should carry a reviewed checkpoint"),
            ),
            reconcile_result_commit_sha: Some(
                reconcile_result_commit_sha_from_unit_review_receipt(&receipt_source)
                    .expect("unit-review receipt should carry a reconciled result sha"),
            ),
            reconcile_mode: Some(
                reconcile_mode_from_unit_review_receipt(&receipt_source)
                    .expect("unit-review receipt should carry a reconcile mode"),
            ),
            review_receipt_fingerprint: Some(receipt_fingerprint.clone()),
            review_receipt_artifact_path: Some(
                receipt_path
                    .file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or_default()
                    .to_owned(),
            ),
        }],
    )
    .expect("authoritative lease index should persist for tampered-lease fixture");

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with tampered lease body proof",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "StaleProvenance");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_identity_preserving_lease_proof_mismatch"
    );
}

#[test]
fn write_authoritative_worktree_lease_artifact_rejects_unsafe_execution_context_key() {
    let (repo_dir, state_dir) = init_repo("plan-execution-unsafe-worktree-lease-path");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    let safe_branch = normalize_identifier(&branch_name(repo));
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "run_identity": {
                "execution_run_id": format!("run-{safe_branch}-unsafe"),
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": format!("chunk-{safe_branch}-unsafe"),
            "latest_authoritative_sequence": 17,
            "active_worktree_lease_fingerprints": [],
        }),
    );

    let runtime = execution_runtime(repo, state);
    let (execution_run_id, _chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let original_state =
        fs::read_to_string(harness_state_file_path(repo, state)).expect("state should exist");
    let lease_payload = json!({
        "lease_version": 1,
        "authoritative_sequence": 19,
        "execution_run_id": execution_run_id,
        "execution_context_key": "unsafe/../../state",
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_unit_id": "unit-unsafe-path",
        "source_branch": branch_name(repo),
        "authoritative_integration_branch": branch_name(repo),
        "worktree_path": state.join("worktrees").join("unsafe-path").display().to_string(),
        "repo_state_baseline_head_sha": current_head.clone(),
        "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
        "lease_state": WorktreeLeaseState::Reconciled,
        "cleanup_state": "cleaned",
        "reviewed_checkpoint_commit_sha": current_head.clone(),
        "reconcile_result_commit_sha": current_head.clone(),
        "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head),
        "reconcile_mode": "identity_preserving",
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T12:00:00Z",
        "lease_fingerprint": "",
    });
    let mut lease: WorktreeLease =
        serde_json::from_value(lease_payload.clone()).expect("lease payload should deserialize");
    lease.lease_fingerprint = canonical_worktree_lease_fingerprint(&lease_payload);

    let failure = write_authoritative_worktree_lease_artifact(&runtime, &lease)
        .expect_err("unsafe execution context key should be rejected");

    assert_eq!(failure.error_class, "MalformedExecutionState");
    assert_eq!(
        fs::read_to_string(harness_state_file_path(repo, state))
            .expect("state should remain readable after rejected lease write"),
        original_state
    );
}

#[test]
fn write_authoritative_unit_review_receipt_artifact_rejects_unsafe_execution_unit_id() {
    let (repo_dir, state_dir) = init_repo("plan-execution-unsafe-unit-review-path");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    let safe_branch = normalize_identifier(&branch_name(repo));
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "run_identity": {
                "execution_run_id": format!("run-{safe_branch}-unsafe"),
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": format!("chunk-{safe_branch}-unsafe"),
            "latest_authoritative_sequence": 17,
            "active_worktree_lease_fingerprints": [],
        }),
    );

    let runtime = execution_runtime(repo, state);
    let (execution_run_id, _chunk_id) = current_authoritative_run_identity(repo, state);
    let original_state =
        fs::read_to_string(harness_state_file_path(repo, state)).expect("state should exist");
    let unsafe_execution_unit_id = "unit-unsafe/../../state";
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let approved_unit_contract_fingerprint = approved_unit_contract_fingerprint_for_review(
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        &approved_task_packet_fingerprint,
        unsafe_execution_unit_id,
    );
    let reconcile_result_commit_sha = current_head_sha(repo);
    let reconcile_result_proof_fingerprint =
        commit_object_fingerprint(repo, &reconcile_result_commit_sha);
    let unsigned_receipt = format!(
        "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Strategy Checkpoint Fingerprint:** {FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\n**Source Plan:** {PLAN_REL}\n**Source Plan Revision:** 1\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {unsafe_execution_unit_id}\n**Lease Fingerprint:** bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n**Execution Context Key:** context-key\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reconcile_result_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** /tmp/worktree\n**Reviewed Checkpoint SHA:** {reconcile_result_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-27T12:00:00Z\n"
    );
    let receipt_fingerprint = canonical_unit_review_receipt_fingerprint(&unsigned_receipt);
    let receipt_source = format!(
        "# Unit Review Result\n**Receipt Fingerprint:** {receipt_fingerprint}\n{}",
        unsigned_receipt.trim_start_matches("# Unit Review Result\n")
    );

    let failure = write_authoritative_unit_review_receipt_artifact(
        &runtime,
        &execution_run_id,
        unsafe_execution_unit_id,
        &receipt_source,
    )
    .expect_err("unsafe execution unit id should be rejected");

    assert_eq!(failure.error_class, "MalformedExecutionState");
    assert_eq!(
        fs::read_to_string(harness_state_file_path(repo, state))
            .expect("state should remain readable after rejected receipt write"),
        original_state
    );
}

#[test]
fn persist_active_worktree_lease_index_respects_write_authority_lock() {
    let (repo_dir, state_dir) = init_repo("plan-execution-lease-index-lock");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    let safe_branch = normalize_identifier(&branch_name(repo));
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "run_identity": {
                "execution_run_id": format!("run-{safe_branch}-lock"),
                "source_plan_path": PLAN_REL,
                "source_plan_revision": 1
            },
            "chunk_id": format!("chunk-{safe_branch}-lock"),
            "latest_authoritative_sequence": 17,
            "active_worktree_lease_fingerprints": [],
        }),
    );

    let runtime = execution_runtime(repo, state);
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let lock_path = harness_state_file_path(repo, state)
        .parent()
        .expect("harness state should live under execution-harness")
        .join("write-authority.lock");
    write_file(&lock_path, "pid=99999\n");

    let failure = persist_active_worktree_lease_index(
        &runtime,
        RunIdentitySnapshot {
            execution_run_id: ExecutionRunId::new(execution_run_id),
            source_plan_path: PLAN_REL.to_owned(),
            source_plan_revision: 1,
        },
        ChunkId::new(chunk_id),
        Vec::new(),
        Vec::new(),
    )
    .expect_err("index persistence should fail while write authority is held");

    assert_eq!(failure.error_class, "ConcurrentWriterConflict");
}

#[test]
fn gate_finish_accepts_worktree_binding_written_via_authoritative_helpers() {
    let (repo_dir, state_dir) = init_repo("plan-execution-authoritative-helper-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (test_plan_path, qa_path, review_path, release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "yes", true, &base_branch);
    let qa_path = qa_path.expect("qa artifact should exist for browser-required fixture");
    write_authoritative_downstream_fixture_state(
        repo,
        state,
        &test_plan_path,
        &qa_path,
        &review_path,
        &release_path,
    );

    let runtime = execution_runtime(repo, state);
    let (execution_run_id, chunk_id) = current_authoritative_run_identity(repo, state);
    let current_head = current_head_sha(repo);
    let execution_unit_id = "unit-authoritative-helpers";
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let reviewed_worktree = state
        .join("worktrees")
        .join("authoritative-helpers")
        .display()
        .to_string();
    let execution_context_key = current_worktree_lease_execution_context_key(
        &execution_run_id,
        execution_unit_id,
        PLAN_REL,
        1,
        &branch_name(repo),
        &current_head,
    );
    let lease_payload = json!({
        "lease_version": 1,
        "authoritative_sequence": 19,
        "execution_run_id": execution_run_id,
        "execution_context_key": execution_context_key,
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_unit_id": execution_unit_id,
        "source_branch": branch_name(repo),
        "authoritative_integration_branch": branch_name(repo),
        "worktree_path": reviewed_worktree,
        "repo_state_baseline_head_sha": current_head,
        "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
        "lease_state": WorktreeLeaseState::Reconciled,
        "cleanup_state": "cleaned",
        "reviewed_checkpoint_commit_sha": current_head,
        "reconcile_result_commit_sha": current_head_sha(repo),
        "reconcile_result_proof_fingerprint": commit_object_fingerprint(repo, &current_head_sha(repo)),
        "reconcile_mode": "identity_preserving",
        "generated_by": "featureforge:executing-plans",
        "generated_at": "2026-03-27T12:00:00Z",
        "lease_fingerprint": "",
    });
    let mut lease: WorktreeLease =
        serde_json::from_value(lease_payload.clone()).expect("lease payload should deserialize");
    lease.lease_fingerprint = canonical_worktree_lease_fingerprint(&lease_payload);
    let lease_path = write_authoritative_worktree_lease_artifact(&runtime, &lease)
        .expect("authoritative helper should write worktree lease");

    let state_json: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable for receipt fixture"),
    )
    .expect("harness state should remain valid json");
    let active_contract_fingerprint = state_json
        .get("active_contract_fingerprint")
        .and_then(Value::as_str)
        .expect("authoritative downstream fixture should set active contract fingerprint");
    let approved_unit_contract_fingerprint = approved_unit_contract_fingerprint_for_review(
        active_contract_fingerprint,
        &approved_task_packet_fingerprint,
        execution_unit_id,
    );
    let reconcile_result_commit_sha = current_head_sha(repo);
    let reconcile_result_proof_fingerprint =
        commit_object_fingerprint(repo, &reconcile_result_commit_sha);
    let unsigned_receipt = format!(
        "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Strategy Checkpoint Fingerprint:** {FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\n**Source Plan:** {PLAN_REL}\n**Source Plan Revision:** 1\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {}\n**Execution Context Key:** {}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reconcile_result_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {}\n**Reviewed Checkpoint SHA:** {reconcile_result_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-27T12:00:00Z\n",
        lease.lease_fingerprint, lease.execution_context_key, lease.worktree_path
    );
    let receipt_fingerprint = canonical_unit_review_receipt_fingerprint(&unsigned_receipt);
    let receipt_source = format!(
        "# Unit Review Result\n**Receipt Fingerprint:** {receipt_fingerprint}\n{}",
        unsigned_receipt.trim_start_matches("# Unit Review Result\n")
    );
    let receipt_path = write_authoritative_unit_review_receipt_artifact(
        &runtime,
        &execution_run_id,
        execution_unit_id,
        &receipt_source,
    )
    .expect("authoritative helper should write unit-review receipt");

    persist_active_worktree_lease_index(
        &runtime,
        RunIdentitySnapshot {
            execution_run_id: ExecutionRunId::new(execution_run_id.clone()),
            source_plan_path: PLAN_REL.to_owned(),
            source_plan_revision: 1,
        },
        ChunkId::new(chunk_id),
        vec![lease.lease_fingerprint.clone()],
        vec![WorktreeLeaseBindingSnapshot {
            execution_run_id: execution_run_id.clone(),
            lease_fingerprint: lease.lease_fingerprint.clone(),
            lease_artifact_path: lease_path
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or_default()
                .to_owned(),
            execution_context_key: Some(lease.execution_context_key.clone()),
            approved_task_packet_fingerprint: Some(approved_task_packet_fingerprint.clone()),
            approved_unit_contract_fingerprint: Some(approved_unit_contract_fingerprint),
            reconcile_result_proof_fingerprint: Some(reconcile_result_proof_fingerprint),
            reviewed_checkpoint_commit_sha: Some(reconcile_result_commit_sha.clone()),
            reconcile_result_commit_sha: Some(reconcile_result_commit_sha),
            reconcile_mode: Some(String::from("identity_preserving")),
            review_receipt_fingerprint: Some(receipt_fingerprint),
            review_receipt_artifact_path: Some(
                receipt_path
                    .file_name()
                    .and_then(|value| value.to_str())
                    .unwrap_or_default()
                    .to_owned(),
            ),
        }],
    )
    .expect("authoritative helper should persist active lease index");

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with authoritative helper binding",
    );

    assert_eq!(gate_finish["allowed"], true);
    assert_eq!(gate_finish["failure_class"], "");
}

#[test]
fn gate_finish_fails_closed_without_authoritative_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-missing-state");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (_test_plan_path, _qa_path, _review_path, _release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "no", false, &base_branch);
    write_worktree_lease_artifact(
        repo,
        state,
        WorktreeLeaseState::Cleaned,
        "cleaned",
        Some(&current_head_sha(repo)),
        "missing-state",
    );
    fs::remove_file(harness_state_file_path(repo, state))
        .expect("harness state should be removable for missing-state fixture");

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with missing authoritative state",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "MalformedExecutionState");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "worktree_lease_authoritative_state_unavailable"
    );
}

#[test]
fn canonical_execution_runtime_uses_canonical_repo_slug() {
    let (repo_dir, state_dir) = init_repo("plan-execution-runtime-slug");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");

    let runtime = ExecutionRuntime::discover(repo).expect("execution runtime should resolve");

    assert_eq!(runtime.repo_slug, repo_slug(repo));
    assert_eq!(
        project_artifact_dir(repo, state),
        state.join("projects").join(&runtime.repo_slug)
    );
}

#[test]
fn gate_finish_rejects_release_artifact_head_mismatch() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-stale-release-head");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = branch_name(repo);
    write_code_review_artifact(repo, state, &base_branch);
    let release_path = write_release_readiness_artifact(repo, state, &base_branch);
    let current_head = current_head_sha(repo);
    let stale_release = fs::read_to_string(&release_path)
        .expect("release artifact should be readable for stale-head fixture")
        .replace(&current_head, "0000000000000000000000000000000000000000");
    fs::write(&release_path, stale_release)
        .expect("stale release artifact fixture should be writable");

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with stale release artifact head",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "ReleaseArtifactNotFresh");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "release_artifact_head_mismatch"
    );
    assert!(
        gate_finish["diagnostics"][0]["message"]
            .as_str()
            .unwrap_or_default()
            .contains("does not match the current HEAD")
    );
}

#[test]
fn gate_finish_rejects_release_artifact_regressions() {
    for (case_name, mutator, expected_reason_code) in [
        (
            "release_plan_mismatch",
            "release_plan_mismatch",
            "release_artifact_plan_mismatch",
        ),
        (
            "release_branch_mismatch",
            "release_branch_mismatch",
            "release_artifact_branch_mismatch",
        ),
        (
            "release_base_branch_unresolved",
            "release_base_branch_unresolved",
            "release_artifact_base_branch_unresolved",
        ),
        (
            "release_base_branch_mismatch",
            "release_base_branch_mismatch",
            "release_artifact_base_branch_mismatch",
        ),
        (
            "release_result_not_pass",
            "release_result_not_pass",
            "release_result_not_pass",
        ),
        (
            "release_artifact_malformed",
            "release_artifact_malformed",
            "release_artifact_malformed",
        ),
        (
            "release_generator_mismatch",
            "release_generator_mismatch",
            "release_artifact_generator_mismatch",
        ),
        (
            "release_repo_mismatch",
            "release_repo_mismatch",
            "release_artifact_repo_mismatch",
        ),
    ] {
        let (repo_dir, state_dir) = init_repo(&format!("plan-execution-finish-{case_name}"));
        let repo = repo_dir.path();
        let state = state_dir.path();
        let base_branch = branch_name(repo);
        let (_test_plan_path, _qa_path, _review_path, release_path) =
            prepare_finished_single_step_finish_gate_fixture(
                repo,
                state,
                "no",
                false,
                &base_branch,
            );

        match mutator {
            "release_plan_mismatch" => {
                replace_in_file(
                    &release_path,
                    &format!("**Source Plan:** `{PLAN_REL}`"),
                    "**Source Plan:** `docs/featureforge/plans/other-plan.md`",
                );
            }
            "release_branch_mismatch" => {
                replace_in_file(
                    &release_path,
                    &format!("**Branch:** {}", branch_name(repo)),
                    "**Branch:** other-branch",
                );
            }
            "release_base_branch_unresolved" => {
                replace_in_file(
                    &release_path,
                    &format!("**Base Branch:** {}", branch_name(repo)),
                    "**Base Branch:** ",
                );
            }
            "release_base_branch_mismatch" => {
                replace_in_file(
                    &release_path,
                    &format!("**Base Branch:** {}", branch_name(repo)),
                    "**Base Branch:** not-the-current-base",
                );
            }
            "release_result_not_pass" => {
                replace_in_file(&release_path, "**Result:** pass", "**Result:** fail");
            }
            "release_artifact_malformed" => {
                replace_in_file(
                    &release_path,
                    "# Release Readiness Result",
                    "# Not Release Readiness",
                );
            }
            "release_generator_mismatch" => {
                replace_in_file(
                    &release_path,
                    "**Generated By:** featureforge:document-release",
                    "**Generated By:** made-up-generator",
                );
            }
            "release_repo_mismatch" => {
                replace_in_file(
                    &release_path,
                    &format!("**Repo:** {}", repo_slug(repo)),
                    "**Repo:** someone-else/other-repo",
                );
            }
            _ => unreachable!("unexpected mutator"),
        }
        let _ = republish_authoritative_artifact_from_path(
            repo,
            state,
            &release_path,
            "release-docs",
            "last_release_docs_artifact_fingerprint",
        );

        let gate_finish = run_rust_json(
            repo,
            state,
            &["gate-finish", "--plan", PLAN_REL],
            "gate finish with mutated release artifact",
        );

        assert_eq!(gate_finish["allowed"], false, "case {case_name}");
        assert_eq!(
            gate_finish["failure_class"], "ReleaseArtifactNotFresh",
            "case {case_name}"
        );
        assert_eq!(
            gate_finish["reason_codes"][0], expected_reason_code,
            "case {case_name}"
        );
    }
}

#[test]
fn gate_finish_accepts_develop_as_the_expected_base_branch() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-develop-base");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let mut git_rename = Command::new("git");
    git_rename
        .args(["branch", "-m", "develop"])
        .current_dir(repo);
    run_checked(git_rename, "git branch -m develop");

    let mut git_feature = Command::new("git");
    git_feature
        .args(["checkout", "-b", "feature-routing"])
        .current_dir(repo);
    run_checked(git_feature, "git checkout -b feature-routing");

    let (_test_plan_path, _qa_path, _review_path, _release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "no", false, "develop");

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with develop as the expected base branch",
    );
    assert_eq!(gate_finish["allowed"], true);
    assert_eq!(gate_finish["failure_class"], "");
    assert_eq!(gate_finish["reason_codes"], Value::Array(Vec::new()));
}

#[test]
fn gate_finish_rejects_dirty_tracked_worktree_after_artifact_generation() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-finish-dirty-worktree");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let base_branch = branch_name(repo);
    let (_test_plan_path, _qa_path, _review_path, _release_path) =
        prepare_finished_single_step_finish_gate_fixture(repo, state, "no", false, &base_branch);

    write_file(
        &repo.join("README.md"),
        "# plan-execution-gate-finish-dirty-worktree\ntracked change after artifact generation\n",
    );

    let gate_finish = run_rust_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate finish with dirty tracked worktree after artifacts",
    );

    assert_eq!(gate_finish["allowed"], false);
    assert_eq!(gate_finish["failure_class"], "ReviewArtifactNotFresh");
    assert_eq!(
        gate_finish["reason_codes"][0],
        "review_artifact_worktree_dirty"
    );
    assert!(
        gate_finish["diagnostics"][0]["message"]
            .as_str()
            .unwrap_or_default()
            .contains("tracked worktree changes")
    );
}

#[test]
fn status_and_gate_review_fail_closed_on_legacy_evidence_format() {
    let (repo_dir, state_dir) = init_repo("plan-execution-legacy-evidence-format");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_file(&repo.join("docs/example-output.md"), "legacy output\n");
    write_file(
        &repo.join(evidence_rel_path()),
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** featureforge:executing-plans\n**Claim:** Prepared the workspace for execution.\n**Files:**\n- docs/example-output.md\n**Verification:**\n- Manual verification recorded in fixture setup.\n**Invalidation Reason:** N/A\n"
        ),
    );

    let status = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status with legacy evidence format",
    );
    assert!(
        !status.status.success(),
        "status should fail closed on legacy evidence format, got {:?}\nstdout:\n{}\nstderr:\n{}",
        status.status,
        String::from_utf8_lossy(&status.stdout),
        String::from_utf8_lossy(&status.stderr)
    );
    let status_payload = if status.stdout.is_empty() {
        &status.stderr
    } else {
        &status.stdout
    };
    let status_error: Value =
        serde_json::from_slice(status_payload).expect("status failure should be json");
    assert_eq!(status_error["error_class"], "MalformedExecutionState");

    let gate_review = run_rust(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with legacy evidence format",
    );
    assert!(
        !gate_review.status.success(),
        "gate-review should fail closed on legacy evidence format, got {:?}\nstdout:\n{}\nstderr:\n{}",
        gate_review.status,
        String::from_utf8_lossy(&gate_review.stdout),
        String::from_utf8_lossy(&gate_review.stderr)
    );
    let gate_payload = if gate_review.stdout.is_empty() {
        &gate_review.stderr
    } else {
        &gate_review.stdout
    };
    let gate_error: Value =
        serde_json::from_slice(gate_payload).expect("gate-review failure should be json");
    assert_eq!(gate_error["error_class"], "MalformedExecutionState");
}

#[test]
fn gate_review_rejects_legacy_packet_provenance_in_v2_evidence() {
    let (repo_dir, state_dir) = init_repo("plan-execution-legacy-packet");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    let legacy_packet = legacy_packet_fingerprint(repo, 1, 1);
    write_single_step_v2_completed_attempt(repo, &legacy_packet);

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with legacy packet provenance",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "StaleExecutionEvidence");
    assert_eq!(
        gate_review["reason_codes"][0],
        "packet_fingerprint_mismatch"
    );
}

#[test]
fn gate_review_rejects_v2_plan_fingerprint_mismatch() {
    let (repo_dir, state_dir) = init_repo("plan-execution-plan-fingerprint-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));

    let evidence_path = repo.join(evidence_rel_path());
    let source = fs::read_to_string(&evidence_path).expect("evidence should be readable");
    fs::write(
        &evidence_path,
        source.replace("**Plan Fingerprint:** ", "**Plan Fingerprint:** stale-"),
    )
    .expect("evidence should be writable");

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with stale plan fingerprint",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "StaleExecutionEvidence");
    assert_eq!(gate_review["reason_codes"][0], "plan_fingerprint_mismatch");
}

#[test]
fn gate_review_rejects_v2_source_spec_fingerprint_mismatch() {
    let (repo_dir, state_dir) = init_repo("plan-execution-source-spec-fingerprint-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));

    let evidence_path = repo.join(evidence_rel_path());
    let source = fs::read_to_string(&evidence_path).expect("evidence should be readable");
    fs::write(
        &evidence_path,
        source.replace(
            "**Source Spec Fingerprint:** ",
            "**Source Spec Fingerprint:** stale-",
        ),
    )
    .expect("evidence should be writable");

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with stale source spec fingerprint",
    );

    assert_eq!(gate_review["allowed"], false);
    assert_eq!(gate_review["failure_class"], "StaleExecutionEvidence");
    assert_eq!(
        gate_review["reason_codes"][0],
        "source_spec_fingerprint_mismatch"
    );
}

#[test]
fn gate_review_accepts_latest_proof_for_shared_file() {
    let (repo_dir, state_dir) = init_repo("plan-execution-shared-file-proof");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_two_step_shared_file_plan(repo, "featureforge:executing-plans");
    write_file(&repo.join("docs/example-output.md"), "step 1\n");
    accept_execution_preflight(repo, state, PLAN_REL);

    let before_step_one = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before begin step 1",
    );
    run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before_step_one["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "begin step 1",
    );
    let before_complete_step_one = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before complete step 1",
    );
    run_rust_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Completed step 1.",
            "--manual-verify-summary",
            "Verified step 1 output.",
            "--file",
            "docs/example-output.md",
            "--expect-execution-fingerprint",
            before_complete_step_one["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "complete step 1",
    );

    write_file(&repo.join("docs/example-output.md"), "step 1\nstep 2\n");

    let before_step_two = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before begin step 2",
    );
    run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "2",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before_step_two["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "begin step 2",
    );
    let before_complete_step_two = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before complete step 2",
    );
    run_rust_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "2",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Completed step 2.",
            "--manual-verify-summary",
            "Verified step 2 output.",
            "--file",
            "docs/example-output.md",
            "--expect-execution-fingerprint",
            before_complete_step_two["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "complete step 2",
    );

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review after superseding shared file proof",
    );

    assert_eq!(gate_review["allowed"], true);
    assert_eq!(gate_review["failure_class"], "");
}

#[test]
fn canonical_complete_normalizes_evidence_and_rejects_stale_mutation() {
    let (repo_dir, state_dir) = init_repo("plan-execution-complete");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    write_file(&repo.join("docs/output.md"), "normalized output\n");
    accept_execution_preflight(repo, state, PLAN_REL);

    let before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "rust status before",
    );
    let before_fp = before["execution_fingerprint"]
        .as_str()
        .expect("status fingerprint should exist")
        .to_owned();
    let active = run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            &before_fp,
        ],
        "rust begin",
    );
    let active_fp = active["execution_fingerprint"]
        .as_str()
        .expect("active fingerprint should exist")
        .to_owned();

    let stale_output = run_rust(
        repo,
        state,
        &[
            "complete",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Prepared the workspace",
            "--manual-verify-summary",
            "Verified by inspection",
            "--expect-execution-fingerprint",
            &before_fp,
        ],
        "rust stale complete",
    );
    assert!(
        !stale_output.status.success(),
        "stale complete should fail, got {:?}",
        stale_output.status
    );
    let stale_payload = if stale_output.stdout.is_empty() {
        &stale_output.stderr
    } else {
        &stale_output.stdout
    };
    let stale_json: Value =
        serde_json::from_slice(stale_payload).expect("stale error should be json");
    assert_eq!(stale_json["error_class"], "StaleMutation");

    let complete_output = run_rust(
        repo,
        state,
        &[
            "complete",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "  Prepared\tworkspace \n thoroughly  ",
            "--file",
            "src/zeta.txt",
            "--file",
            "docs/alpha.md",
            "--file",
            "src/zeta.txt",
            "--manual-verify-summary",
            "  Verified\tby \n inspection  ",
            "--expect-execution-fingerprint",
            &active_fp,
        ],
        "rust complete",
    );
    assert!(
        complete_output.status.success(),
        "complete should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        complete_output.status,
        String::from_utf8_lossy(&complete_output.stdout),
        String::from_utf8_lossy(&complete_output.stderr)
    );

    let evidence = fs::read_to_string(repo.join(evidence_rel_path()))
        .expect("evidence file should exist after complete");
    assert!(evidence.contains("**Claim:** Prepared workspace thoroughly"));
    assert!(
        evidence
            .contains("**Verification Summary:** Manual inspection only: Verified by inspection")
    );
    assert!(evidence.contains("**Files Proven:**\n- docs/alpha.md | sha256:"));
    assert!(evidence.contains("\n- src/zeta.txt | sha256:"));
    assert!(!evidence.contains('\t'));
}

#[test]
fn canonical_note_blocks_active_step_and_updates_plan_summary() {
    let (repo_dir, state_dir) = init_repo("plan-execution-note-blocked");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    accept_execution_preflight(repo, state, PLAN_REL);

    let before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before blocked note",
    );
    let active = run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "begin before blocked note",
    );

    let blocked = run_rust_json(
        repo,
        state,
        &[
            "note",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--state",
            "blocked",
            "--message",
            "  Waiting\t on \n external  approval  ",
            "--expect-execution-fingerprint",
            active["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "blocked note",
    );

    assert_eq!(blocked["active_task"], Value::Null);
    assert_eq!(blocked["active_step"], Value::Null);
    assert_eq!(blocked["blocking_task"], Value::from(1));
    assert_eq!(blocked["blocking_step"], Value::from(1));
    assert_eq!(blocked["resume_task"], Value::Null);
    assert_eq!(blocked["resume_step"], Value::Null);

    let plan = fs::read_to_string(repo.join(PLAN_REL)).expect("plan should exist after note");
    assert!(plan.contains("**Execution Note:** Blocked - Waiting on external approval"));
}

#[test]
fn canonical_note_rejects_blank_summary_without_mutating_active_step() {
    let (repo_dir, state_dir) = init_repo("plan-execution-note-blank");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    accept_execution_preflight(repo, state, PLAN_REL);

    let before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before blank note",
    );
    let active = run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "begin before blank note",
    );
    let before_plan = fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable");

    let output = run_rust(
        repo,
        state,
        &[
            "note",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--state",
            "blocked",
            "--message",
            "   ",
            "--expect-execution-fingerprint",
            active["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "blank note should fail",
    );
    assert!(
        !output.status.success(),
        "blank note should fail, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value = serde_json::from_slice(payload).expect("blank note error should be json");
    assert_eq!(json["error_class"], "InvalidCommandInput");

    let after = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after blank note",
    );
    assert_eq!(after["active_task"], Value::from(1));
    assert_eq!(after["active_step"], Value::from(1));
    assert_eq!(
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should stay readable"),
        before_plan
    );
}

#[test]
fn canonical_reopen_invalidates_completed_attempt_and_sets_resume_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-reopen");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));

    let before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before reopen",
    );
    let reopened = run_rust_json(
        repo,
        state,
        &[
            "reopen",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--reason",
            "Claim is stale after later repo changes",
            "--expect-execution-fingerprint",
            before["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "reopen completed step",
    );

    assert_eq!(reopened["active_task"], Value::Null);
    assert_eq!(reopened["active_step"], Value::Null);
    assert_eq!(reopened["resume_task"], Value::from(1));
    assert_eq!(reopened["resume_step"], Value::from(1));

    let plan = fs::read_to_string(repo.join(PLAN_REL)).expect("plan should exist after reopen");
    assert!(plan.contains("- [ ] **Step 1: Complete the single-step fixture**"));
    assert!(
        plan.contains("**Execution Note:** Interrupted - Claim is stale after later repo changes")
    );

    let evidence = fs::read_to_string(repo.join(evidence_rel_path()))
        .expect("evidence should exist after reopen");
    assert!(evidence.contains("**Status:** Invalidated"));
    assert!(evidence.contains("**Invalidation Reason:** Claim is stale after later repo changes"));
}

#[test]
fn reopen_auto_records_review_remediation_and_cycle_break_strategy_checkpoints() {
    let (repo_dir, state_dir) = init_repo("plan-execution-reopen-strategy-checkpoint-cycles");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    accept_execution_preflight(repo, state, PLAN_REL);
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));

    let contract_rel = "docs/featureforge/execution-evidence/task4-reopen-cycle-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    for cycle in 1..=3 {
        let before = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before reopen cycle",
        );
        let reason = format!("Review reopened cycle {cycle}");
        let reopened = run_rust_json(
            repo,
            state,
            &[
                "reopen",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--source",
                "featureforge:executing-plans",
                "--reason",
                &reason,
                "--expect-execution-fingerprint",
                before["execution_fingerprint"]
                    .as_str()
                    .expect("execution fingerprint should be present"),
            ],
            "reopen for strategy checkpoint cycle tracking",
        );

        assert!(
            reopened["last_strategy_checkpoint_fingerprint"]
                .as_str()
                .map(str::trim)
                .is_some_and(|value| !value.is_empty()),
            "reopen cycle {cycle} should produce a strategy checkpoint fingerprint"
        );
        if cycle < 3 {
            assert_eq!(reopened["strategy_checkpoint_kind"], "review_remediation");
            assert_eq!(reopened["strategy_state"], "ready");
        } else {
            assert_eq!(reopened["strategy_checkpoint_kind"], "cycle_break");
            assert_eq!(reopened["strategy_state"], "cycle_breaking");
        }
        assert_eq!(
            reopened["strategy_reset_required"],
            Value::Bool(false),
            "runtime should auto-record cycle-break strategy without human loopback"
        );

        if cycle < 3 {
            let resumed = run_rust_json(
                repo,
                state,
                &[
                    "begin",
                    "--plan",
                    PLAN_REL,
                    "--task",
                    "1",
                    "--step",
                    "1",
                    "--execution-mode",
                    "featureforge:executing-plans",
                    "--expect-execution-fingerprint",
                    reopened["execution_fingerprint"]
                        .as_str()
                        .expect("execution fingerprint should be present after reopen"),
                ],
                "resume work after reopen cycle",
            );
            run_rust_json(
                repo,
                state,
                &[
                    "complete",
                    "--plan",
                    PLAN_REL,
                    "--task",
                    "1",
                    "--step",
                    "1",
                    "--source",
                    "featureforge:executing-plans",
                    "--claim",
                    "Repaired after review.",
                    "--manual-verify-summary",
                    "Verified by cycle test.",
                    "--expect-execution-fingerprint",
                    resumed["execution_fingerprint"]
                        .as_str()
                        .expect("execution fingerprint should be present after begin"),
                ],
                "re-complete work before next reopen cycle",
            );
        }
    }
}

#[test]
fn gate_review_dispatch_records_review_cycles_before_steps_complete() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-dispatch-cycles");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    accept_execution_preflight(repo, state, PLAN_REL);

    let contract_rel = "docs/featureforge/execution-evidence/task4-review-dispatch-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before gate-review dispatch cycle tracking",
    );
    run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status["execution_fingerprint"]
                .as_str()
                .expect("status should include execution_fingerprint before begin"),
        ],
        "begin active work before gate-review dispatch cycle tracking",
    );

    for cycle in 1..=3 {
        let gate = run_rust_json(
            repo,
            state,
            &["gate-review", "--plan", PLAN_REL],
            "gate-review dispatch cycle tracking",
        );
        assert_eq!(gate["allowed"], Value::Bool(false));
        assert!(
            gate["reason_codes"]
                .as_array()
                .is_some_and(|codes| codes.iter().any(|code| code == "active_step_in_progress")),
            "gate-review dispatch should still fail closed when active work remains in progress"
        );

        let status = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status after gate-review dispatch cycle tracking",
        );
        assert!(
            status["last_strategy_checkpoint_fingerprint"]
                .as_str()
                .map(str::trim)
                .is_some_and(|value| !value.is_empty()),
            "gate-review cycle {cycle} should record a strategy checkpoint fingerprint"
        );
        if cycle < 3 {
            assert_eq!(status["strategy_checkpoint_kind"], "review_remediation");
            assert_eq!(status["strategy_state"], "ready");
        } else {
            assert_eq!(status["strategy_checkpoint_kind"], "cycle_break");
            assert_eq!(status["strategy_state"], "cycle_breaking");
        }
        assert_eq!(
            status["strategy_reset_required"],
            Value::Bool(false),
            "runtime should auto-record cycle-break strategy for review dispatch without human loopback"
        );
    }
}

#[test]
fn gate_review_dispatch_skips_cycle_tracking_without_reviewable_work() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-dispatch-no-reviewable-work");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    accept_execution_preflight(repo, state, PLAN_REL);

    let contract_rel =
        "docs/featureforge/execution-evidence/task4-review-dispatch-no-work-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );
    let status_before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before gate-review dispatch without reviewable work",
    );

    let gate = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate-review dispatch without reviewable work",
    );
    assert_eq!(gate["allowed"], Value::Bool(false));
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "unfinished_steps_remaining")),
        "gate-review should fail closed while unfinished steps remain when no reviewable work exists"
    );

    let status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after gate-review dispatch without reviewable work",
    );
    assert_eq!(
        status["strategy_checkpoint_kind"], status_before["strategy_checkpoint_kind"],
        "gate-review dispatch should not alter strategy checkpoint kind when no reviewable work exists"
    );
    assert_eq!(
        status["last_strategy_checkpoint_fingerprint"],
        status_before["last_strategy_checkpoint_fingerprint"],
        "gate-review dispatch should not alter strategy checkpoint fingerprint when no reviewable work exists"
    );
}

#[test]
fn gate_review_dispatch_backfills_initial_dispatch_before_review_remediation() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-dispatch-backfills-initial");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    accept_execution_preflight(repo, state, PLAN_REL);

    let contract_rel =
        "docs/featureforge/execution-evidence/task4-review-dispatch-initial-backfill.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "last_strategy_checkpoint_fingerprint": Value::Null,
            "strategy_checkpoint_kind": "none",
            "strategy_state": "checkpoint_missing"
        }),
    );

    let status_before_begin = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before begin for initial-dispatch backfill test",
    );
    run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_before_begin["execution_fingerprint"]
                .as_str()
                .expect("status should include execution_fingerprint before begin"),
        ],
        "begin active work before initial-dispatch backfill gate-review dispatch",
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "last_strategy_checkpoint_fingerprint": Value::Null,
            "strategy_checkpoint_kind": "none",
            "strategy_state": "checkpoint_missing",
            "strategy_checkpoints": []
        }),
    );

    run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate-review dispatch should backfill initial-dispatch checkpoint before review remediation",
    );

    let harness_state: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable after gate-review dispatch"),
    )
    .expect("harness state should remain valid json after gate-review dispatch");
    let checkpoints = harness_state["strategy_checkpoints"]
        .as_array()
        .expect("strategy checkpoints should be a json array");
    assert!(
        checkpoints.len() >= 2,
        "gate-review dispatch should append both initial_dispatch and review_remediation checkpoints when lineage is missing"
    );
    let first = checkpoints[checkpoints.len() - 2]["checkpoint_kind"]
        .as_str()
        .expect("penultimate checkpoint kind should be present");
    let second = checkpoints[checkpoints.len() - 1]["checkpoint_kind"]
        .as_str()
        .expect("last checkpoint kind should be present");
    assert_eq!(first, "initial_dispatch");
    assert_eq!(second, "review_remediation");
}

#[test]
fn gate_review_dispatch_bound_credit_does_not_accumulate_or_leak_across_tasks() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-review-dispatch-credit-task-leakage");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_v2_completed_attempts_for_finished_plan(repo);
    accept_execution_preflight(repo, state, PLAN_REL);
    let plan_path = repo.join(PLAN_REL);
    let source = fs::read_to_string(&plan_path).expect("plan should be readable");
    fs::write(
        &plan_path,
        source.replace(
            "- [x] **Step 1: Prepare workspace for execution**",
            "- [ ] **Step 1: Prepare workspace for execution**",
        ),
    )
    .expect("plan should be writable");

    let contract_rel = "docs/featureforge/execution-evidence/task4-review-dispatch-credit.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "active_contract_path": Value::Null,
            "active_contract_fingerprint": Value::Null
        }),
    );

    run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "first gate-review dispatch should record a bound dispatch credit",
    );
    run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "second gate-review dispatch should overwrite rather than accumulate bound dispatch credits",
    );

    let harness_state: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable after gate-review dispatches"),
    )
    .expect("harness state should stay valid json after gate-review dispatches");
    let credits = harness_state["strategy_review_dispatch_credits"]
        .as_object()
        .expect("strategy review dispatch credits should be a json object");
    let (bound_credit_key, bound_credit_value) = credits
        .iter()
        .find(|(key, _)| key.starts_with("task-"))
        .expect("gate-review dispatch should keep exactly one bound task dispatch credit");
    assert_eq!(
        bound_credit_value.as_u64(),
        Some(1),
        "bound gate-review dispatch credit should stay single-token and not accumulate"
    );
    assert_eq!(
        credits.len(),
        1,
        "gate-review dispatch should keep only one bound task dispatch credit token"
    );
    assert!(
        bound_credit_key.starts_with("task-"),
        "bound gate-review dispatch credit should use a task binding key"
    );
    let bound_task = bound_credit_key
        .strip_prefix("task-")
        .and_then(|value| value.parse::<u32>().ok())
        .expect("bound dispatch credit key should include a task number");
    let (reopen_task, reopen_step) = if bound_task == 2 {
        (1_u32, 2_u32)
    } else {
        (2_u32, 1_u32)
    };
    let reopen_task_str = reopen_task.to_string();
    let reopen_step_str = reopen_step.to_string();
    assert!(
        !credits.contains_key(&format!("task-{reopen_task}")),
        "bound dispatch should not pre-credit unrelated tasks"
    );

    let status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before cross-task reopen",
    );
    let reopened = run_rust_json(
        repo,
        state,
        &[
            "reopen",
            "--plan",
            PLAN_REL,
            "--task",
            reopen_task_str.as_str(),
            "--step",
            reopen_step_str.as_str(),
            "--source",
            "featureforge:executing-plans",
            "--reason",
            "Cross-task reopen should clear stale bound dispatch credits.",
            "--expect-execution-fingerprint",
            status["execution_fingerprint"]
                .as_str()
                .expect("execution fingerprint should be present"),
        ],
        "cross-task reopen should not consume stale bound dispatch credits",
    );
    assert_eq!(reopened["strategy_checkpoint_kind"], "review_remediation");

    let harness_state: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable after cross-task reopen"),
    )
    .expect("harness state should stay valid json after cross-task reopen");
    let credits = harness_state["strategy_review_dispatch_credits"]
        .as_object()
        .expect("strategy review dispatch credits should be a json object");
    assert!(
        credits.keys().all(|key| !key.starts_with("task-")),
        "cross-task reopen should clear stale bound dispatch credits"
    );
    let reopen_trigger = harness_state["strategy_checkpoints"]
        .as_array()
        .and_then(|checkpoints| checkpoints.last())
        .and_then(|checkpoint| checkpoint["trigger_fingerprints"].as_array())
        .and_then(|triggers| triggers.first())
        .and_then(Value::as_str)
        .expect("cross-task reopen should record a strategy trigger");
    assert!(
        reopen_trigger.starts_with(&format!("task-{reopen_task}:step-{reopen_step}:cycle-1")),
        "cross-task reopen should open a new cycle on the reopened task instead of consuming stale dispatch credit from another task"
    );
    assert_eq!(
        harness_state["strategy_cycle_counts"][format!("task-{bound_task}")],
        Value::from(1),
        "cross-task reopen should roll back only the latest stale bound-dispatch increment without erasing prior cycle history"
    );
}

#[test]
fn gate_review_dispatch_on_completed_plan_binds_unbound_cycles_on_reopen_target_task() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-dispatch-unbound-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_v2_completed_attempts_for_finished_plan(repo);
    accept_execution_preflight(repo, state, PLAN_REL);

    let contract_rel = "docs/featureforge/execution-evidence/task4-review-dispatch-binding.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    for cycle in 1..=3 {
        let gate = run_rust_json(
            repo,
            state,
            &["gate-review", "--plan", PLAN_REL],
            "gate-review dispatch cycle tracking with completed plan",
        );
        assert!(
            gate.get("allowed").is_some(),
            "gate-review should return an allow/deny decision"
        );

        let harness_state: Value = serde_json::from_str(
            &fs::read_to_string(harness_state_file_path(repo, state))
                .expect("harness state should be readable after gate-review"),
        )
        .expect("harness state should be valid json after gate-review");
        let dispatch_trigger = harness_state["strategy_checkpoints"]
            .as_array()
            .and_then(|checkpoints| checkpoints.last())
            .and_then(|checkpoint| checkpoint["trigger_fingerprints"].as_array())
            .and_then(|triggers| triggers.first())
            .and_then(Value::as_str)
            .expect("gate-review dispatch should record a strategy trigger");
        assert!(
            dispatch_trigger.starts_with("task-unbound:step-unbound:pending-review-dispatch-"),
            "completed-plan gate-review dispatch should stay unbound until reopen selects a task"
        );

        let status = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before reopen after completed-plan gate-review dispatch",
        );
        let reason = format!("Review reopened binding cycle {cycle}");
        let reopened = run_rust_json(
            repo,
            state,
            &[
                "reopen",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--source",
                "featureforge:executing-plans",
                "--reason",
                &reason,
                "--expect-execution-fingerprint",
                status["execution_fingerprint"]
                    .as_str()
                    .expect("execution fingerprint should be present"),
            ],
            "reopen after completed-plan gate-review dispatch",
        );
        if cycle < 3 {
            assert_eq!(reopened["strategy_checkpoint_kind"], "review_remediation");
            assert_eq!(reopened["strategy_state"], "ready");
        } else {
            assert_eq!(reopened["strategy_checkpoint_kind"], "cycle_break");
            assert_eq!(reopened["strategy_state"], "cycle_breaking");
        }

        let harness_state: Value = serde_json::from_str(
            &fs::read_to_string(harness_state_file_path(repo, state))
                .expect("harness state should be readable after reopen"),
        )
        .expect("harness state should be valid json after reopen");
        let reopen_trigger = harness_state["strategy_checkpoints"]
            .as_array()
            .and_then(|checkpoints| checkpoints.last())
            .and_then(|checkpoint| checkpoint["trigger_fingerprints"].as_array())
            .and_then(|triggers| triggers.first())
            .and_then(Value::as_str)
            .expect("reopen should record a strategy trigger");
        assert!(
            reopen_trigger.starts_with("task-1:step-1:cycle-"),
            "reopen should bind the pending dispatch cycle to Task 1 Step 1"
        );
        assert!(
            reopen_trigger.contains("bound-from-unbound-review-dispatch"),
            "reopen should explicitly declare that it bound an unbound review dispatch cycle"
        );

        if cycle < 3 {
            let resumed = run_rust_json(
                repo,
                state,
                &[
                    "begin",
                    "--plan",
                    PLAN_REL,
                    "--task",
                    "1",
                    "--step",
                    "1",
                    "--execution-mode",
                    "featureforge:executing-plans",
                    "--expect-execution-fingerprint",
                    reopened["execution_fingerprint"]
                        .as_str()
                        .expect("execution fingerprint should be present after reopen"),
                ],
                "resume work after reopen binding cycle",
            );
            run_rust_json(
                repo,
                state,
                &[
                    "complete",
                    "--plan",
                    PLAN_REL,
                    "--task",
                    "1",
                    "--step",
                    "1",
                    "--source",
                    "featureforge:executing-plans",
                    "--claim",
                    "Repaired after completed-plan review dispatch.",
                    "--manual-verify-summary",
                    "Verified by cycle-binding test.",
                    "--expect-execution-fingerprint",
                    resumed["execution_fingerprint"]
                        .as_str()
                        .expect("execution fingerprint should be present after begin"),
                ],
                "re-complete work before next completed-plan review dispatch",
            );
        }
    }
}

#[test]
fn task4_begin_rejects_step_outside_active_contract_scope_without_mutating_plan_or_evidence() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task4-begin-contract-scope-reject");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);
    accept_execution_preflight(repo, state, PLAN_REL);

    let contract_rel = "docs/featureforge/execution-evidence/task4-scope-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let status_before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before out-of-scope begin",
    );
    let plan_before =
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable before begin");
    let evidence_path = repo.join(evidence_rel_path());
    assert!(
        !evidence_path.exists(),
        "single-step evidence should not exist before out-of-scope begin"
    );

    let begin = run_rust(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "2",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_before["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "begin should reject task/step outside active contract covered scope",
    );
    let begin_failure = parse_failure_json(&begin, "out-of-scope begin");
    assert_eq!(begin_failure["error_class"], "ContractMismatch");

    let plan_after =
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should remain readable after begin");
    assert_eq!(
        plan_after, plan_before,
        "out-of-scope begin must leave plan unchanged"
    );
    assert!(
        !evidence_path.exists(),
        "out-of-scope begin must not create execution evidence"
    );

    let status_after = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after out-of-scope begin rejection",
    );
    assert_eq!(status_after["active_task"], Value::Null);
    assert_eq!(status_after["active_step"], Value::Null);
}

#[test]
fn task4_begin_fails_closed_when_active_contract_pointer_is_non_authoritative() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task4-begin-invalid-contract-pointer");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    accept_execution_preflight(repo, state, PLAN_REL);

    let status_before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before invalid active-contract pointer begin",
    );
    let plan_before = fs::read_to_string(repo.join(PLAN_REL))
        .expect("plan should stay readable before invalid active-contract pointer begin");
    let evidence_path = repo.join(evidence_rel_path());
    assert!(
        !evidence_path.exists(),
        "single-step evidence should not exist before invalid active-contract pointer begin"
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 41,
            "active_contract_path": "contract-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.md",
            "active_contract_fingerprint": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 1,
            "current_chunk_pivot_threshold": 1,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let begin = run_rust(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_before["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "begin should fail closed when authoritative active-contract pointer is non-authoritative",
    );
    let failure = parse_failure_json(&begin, "invalid active-contract pointer begin");
    assert_eq!(
        failure["error_class"], "NonAuthoritativeArtifact",
        "invalid authoritative active-contract pointer should fail closed"
    );

    let plan_after = fs::read_to_string(repo.join(PLAN_REL))
        .expect("plan should stay readable after invalid active-contract pointer begin");
    assert_eq!(
        plan_after, plan_before,
        "invalid authoritative active-contract pointer begin must leave plan unchanged"
    );
    assert!(
        !evidence_path.exists(),
        "invalid authoritative active-contract pointer begin must not create execution evidence"
    );
}

#[test]
fn task4_begin_and_complete_claim_write_authority_before_mutable_validation() {
    {
        let (repo_dir, state_dir) = init_repo("plan-execution-task4-begin-lock-precedence");
        let repo = repo_dir.path();
        let state = state_dir.path();
        write_approved_spec(repo);
        write_two_step_shared_file_plan(repo, "none");
        accept_execution_preflight(repo, state, PLAN_REL);

        let status_before_begin = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before begin setup for lock-precedence assertion",
        );
        run_rust_json(
            repo,
            state,
            &[
                "begin",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--execution-mode",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                status_before_begin["execution_fingerprint"]
                    .as_str()
                    .expect("status fingerprint should be present"),
            ],
            "begin setup before second begin lock-precedence assertion",
        );
        write_file(
            &harness_branch_dir(repo, state)
                .join("execution-harness")
                .join("write-authority.lock"),
            "pid=fixture\n",
        );
        let status = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before second begin lock-precedence assertion",
        );

        let begin = run_rust(
            repo,
            state,
            &[
                "begin",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "2",
                "--execution-mode",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                status["execution_fingerprint"]
                    .as_str()
                    .expect("status fingerprint should be present"),
            ],
            "begin lock-precedence failure",
        );
        let begin_failure = parse_failure_json(&begin, "begin lock-precedence failure");
        assert_eq!(begin_failure["error_class"], "ConcurrentWriterConflict");
    }

    {
        let (repo_dir, state_dir) = init_repo("plan-execution-task4-complete-lock-precedence");
        let repo = repo_dir.path();
        let state = state_dir.path();
        write_approved_spec(repo);
        write_single_step_plan(repo, "none");
        accept_execution_preflight(repo, state, PLAN_REL);

        let status = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before complete lock-precedence assertion",
        );
        write_file(
            &harness_branch_dir(repo, state)
                .join("execution-harness")
                .join("write-authority.lock"),
            "pid=fixture\n",
        );

        let complete = run_rust(
            repo,
            state,
            &[
                "complete",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--claim",
                "Complete should lock before mutable step validation.",
                "--file",
                "README.md",
                "--manual-verify-summary",
                "Lock-precedence fixture",
                "--source",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                status["execution_fingerprint"]
                    .as_str()
                    .expect("status fingerprint should be present"),
            ],
            "complete lock-precedence failure",
        );
        let complete_failure = parse_failure_json(&complete, "complete lock-precedence failure");
        assert_eq!(complete_failure["error_class"], "ConcurrentWriterConflict");
    }
}

#[test]
fn task4_begin_rejects_handoff_and_pivot_required_authoritative_phases() {
    for (phase, expected_error_class) in [
        ("handoff_required", "IllegalHarnessPhase"),
        ("pivot_required", "BlockedOnPlanPivot"),
    ] {
        let (repo_dir, state_dir) = init_repo("plan-execution-task4-begin-phase-rejection");
        let repo = repo_dir.path();
        let state = state_dir.path();
        write_approved_spec(repo);
        write_single_step_plan(repo, "none");
        accept_execution_preflight(repo, state, PLAN_REL);

        let contract_rel = "docs/featureforge/execution-evidence/task4-phase-contract.md";
        let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
        write_harness_state_fixture!(
            repo,
            state,
            phase,
            contract_rel,
            &contract_fingerprint,
            &["spec_compliance"],
            &["spec_compliance"],
            phase == "handoff_required",
        );

        let status = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before begin phase rejection",
        );
        let begin = run_rust(
            repo,
            state,
            &[
                "begin",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--execution-mode",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                status["execution_fingerprint"]
                    .as_str()
                    .expect("status fingerprint should be present"),
            ],
            "begin should reject authoritative blocked phases",
        );
        let begin_failure = parse_failure_json(&begin, "begin phase rejection");
        assert_eq!(
            begin_failure["error_class"], expected_error_class,
            "begin should emit stable failure class for harness phase `{phase}`"
        );
    }
}

#[test]
fn task4_complete_rejects_handoff_and_pivot_required_authoritative_phases() {
    for (phase, expected_error_class) in [
        ("handoff_required", "IllegalHarnessPhase"),
        ("pivot_required", "BlockedOnPlanPivot"),
    ] {
        let (repo_dir, state_dir) = init_repo("plan-execution-task4-complete-phase-rejection");
        let repo = repo_dir.path();
        let state = state_dir.path();
        write_approved_spec(repo);
        write_single_step_plan(repo, "none");
        accept_execution_preflight(repo, state, PLAN_REL);

        let status_before_begin = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before complete phase begin setup",
        );
        run_rust_json(
            repo,
            state,
            &[
                "begin",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--execution-mode",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                status_before_begin["execution_fingerprint"]
                    .as_str()
                    .expect("status fingerprint should be present"),
            ],
            "begin setup before complete phase rejection",
        );

        let contract_rel = "docs/featureforge/execution-evidence/task4-complete-phase-contract.md";
        let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
        write_harness_state_fixture!(
            repo,
            state,
            phase,
            contract_rel,
            &contract_fingerprint,
            &["spec_compliance"],
            &["spec_compliance"],
            phase == "handoff_required",
        );

        let status_before_complete = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before complete phase rejection",
        );
        let complete = run_rust(
            repo,
            state,
            &[
                "complete",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--claim",
                "Complete should reject blocked authoritative harness phases.",
                "--file",
                "README.md",
                "--manual-verify-summary",
                "Phase gating fixture",
                "--source",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                status_before_complete["execution_fingerprint"]
                    .as_str()
                    .expect("status fingerprint should be present"),
            ],
            "complete should reject authoritative blocked phases",
        );
        let complete_failure = parse_failure_json(&complete, "complete phase rejection");
        assert_eq!(
            complete_failure["error_class"], expected_error_class,
            "complete should emit stable failure class for harness phase `{phase}`"
        );
    }
}

#[test]
fn task4_blocked_note_under_adaptive_or_chunk_boundary_sets_macro_blocking_state() {
    for reset_policy in ["adaptive", "chunk-boundary"] {
        let (repo_dir, state_dir) = init_repo("plan-execution-task4-blocked-note-reset-policy");
        let repo = repo_dir.path();
        let state = state_dir.path();
        write_approved_spec(repo);
        write_single_step_plan(repo, "none");
        accept_execution_preflight(repo, state, PLAN_REL);

        let contract_rel = "docs/featureforge/execution-evidence/task4-reset-policy-contract.md";
        let _ = write_execution_contract_artifact(repo, contract_rel, None);
        let contract_fingerprint = rewrite_contract_reset_policy_with_canonical_fingerprint(
            repo,
            contract_rel,
            reset_policy,
        );
        write_harness_state_fixture!(
            repo,
            state,
            "executing",
            contract_rel,
            &contract_fingerprint,
            &["spec_compliance"],
            &["spec_compliance"],
            false,
        );

        let status_before_begin = run_rust_json(
            repo,
            state,
            &["status", "--plan", PLAN_REL],
            "status before blocked-note begin",
        );
        let begin = run_rust_json(
            repo,
            state,
            &[
                "begin",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--execution-mode",
                "featureforge:executing-plans",
                "--expect-execution-fingerprint",
                status_before_begin["execution_fingerprint"]
                    .as_str()
                    .expect("status fingerprint should be present"),
            ],
            "begin before blocked-note reset-policy behavior",
        );

        let _ = run_rust_json(
            repo,
            state,
            &[
                "note",
                "--plan",
                PLAN_REL,
                "--task",
                "1",
                "--step",
                "1",
                "--state",
                "blocked",
                "--message",
                "Blocked note should trigger macro blocking state.",
                "--expect-execution-fingerprint",
                begin["execution_fingerprint"]
                    .as_str()
                    .expect("begin fingerprint should be present"),
            ],
            "blocked note under adaptive/chunk-boundary reset policy",
        );

        let persisted: Value = serde_json::from_str(
            &fs::read_to_string(harness_state_file_path(repo, state))
                .expect("harness state should remain readable after blocked note"),
        )
        .expect("harness state should remain valid json after blocked note");
        assert_eq!(
            persisted["handoff_required"],
            Value::Bool(true),
            "blocked note with reset_policy `{reset_policy}` should set handoff_required"
        );
        assert!(
            matches!(
                persisted["harness_phase"].as_str(),
                Some("handoff_required" | "pivot_required")
            ),
            "blocked note with reset_policy `{reset_policy}` should advance macro blocking phase, got {}",
            persisted["harness_phase"]
        );
    }
}

#[test]
fn task4_note_rolls_back_plan_when_authoritative_state_publish_fails() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task4-note-state-publish-rollback");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    accept_execution_preflight(repo, state, PLAN_REL);

    let contract_rel = "docs/featureforge/execution-evidence/task4-note-rollback-contract.md";
    let _ = write_execution_contract_artifact(repo, contract_rel, None);
    let contract_fingerprint =
        rewrite_contract_reset_policy_with_canonical_fingerprint(repo, contract_rel, "adaptive");
    write_harness_state_fixture!(
        repo,
        state,
        "executing",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let status_before_begin = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before note rollback begin",
    );
    let began = run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_before_begin["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "begin before note rollback state-publish failpoint",
    );

    let plan_before =
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should remain readable before note");
    let evidence_path = repo.join(evidence_rel_path());
    assert!(
        !evidence_path.exists(),
        "note rollback fixture should not create evidence before note"
    );
    let harness_before = fs::read_to_string(harness_state_file_path(repo, state))
        .expect("harness state should remain readable before note");

    let note = run_rust_with_env(
        repo,
        state,
        &[
            "note",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--state",
            "blocked",
            "--message",
            "Blocked note should hit authoritative state publish rollback.",
            "--expect-execution-fingerprint",
            began["execution_fingerprint"]
                .as_str()
                .expect("begin fingerprint should be present"),
        ],
        &[(
            "FEATUREFORGE_PLAN_EXECUTION_TEST_FAILPOINT",
            "note_after_plan_write_before_authoritative_state_publish",
        )],
        "note with authoritative state publish failpoint",
    );
    let failure = parse_failure_json(&note, "note authoritative state publish failpoint");
    assert_eq!(
        failure["error_class"], "PartialAuthoritativeMutation",
        "note should classify authoritative state publish failures as partial mutations"
    );

    assert_eq!(
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should remain readable after note"),
        plan_before,
        "note should roll back plan mutation when authoritative state publish fails"
    );
    assert!(
        !evidence_path.exists(),
        "note should not create evidence when authoritative state publish fails"
    );
    assert_eq!(
        fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after note"),
        harness_before,
        "note should roll back authoritative harness state mutation when publish fails"
    );
}

#[test]
fn reopen_after_same_task_bound_dispatch_records_refresh_checkpoint() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-gate-review-dispatch-same-task-reopen-refresh");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_v2_completed_attempts_for_finished_plan(repo);
    accept_execution_preflight(repo, state, PLAN_REL);
    let plan_path = repo.join(PLAN_REL);
    let source = fs::read_to_string(&plan_path).expect("plan should be readable");
    fs::write(
        &plan_path,
        source.replace(
            "- [x] **Step 1: Prepare workspace for execution**",
            "- [ ] **Step 1: Prepare workspace for execution**",
        ),
    )
    .expect("plan should be writable");

    let contract_rel = "docs/featureforge/execution-evidence/task4-review-dispatch-same-task.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "active_contract_path": Value::Null,
            "active_contract_fingerprint": Value::Null
        }),
    );

    run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate-review dispatch should produce a bound dispatch credit before same-task reopen",
    );
    let harness_state: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable after gate-review dispatch"),
    )
    .expect("harness state should be valid json after gate-review dispatch");
    let bound_task = harness_state["strategy_review_dispatch_credits"]
        .as_object()
        .and_then(|credits| {
            credits
                .keys()
                .find(|key| key.starts_with("task-"))
                .and_then(|key| key.strip_prefix("task-"))
                .and_then(|value| value.parse::<u32>().ok())
        })
        .expect("gate-review dispatch should produce one task-bound dispatch credit");
    let reopen_step = if bound_task == 1 { 2_u32 } else { 1_u32 };
    let bound_task_str = bound_task.to_string();
    let reopen_step_str = reopen_step.to_string();

    let status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before same-task reopen after bound dispatch",
    );
    let reopened = run_rust_json(
        repo,
        state,
        &[
            "reopen",
            "--plan",
            PLAN_REL,
            "--task",
            bound_task_str.as_str(),
            "--step",
            reopen_step_str.as_str(),
            "--source",
            "featureforge:executing-plans",
            "--reason",
            "Same-task reopen should record a refreshed strategy checkpoint.",
            "--expect-execution-fingerprint",
            status["execution_fingerprint"]
                .as_str()
                .expect("execution fingerprint should be present"),
        ],
        "same-task reopen after bound dispatch should refresh strategy checkpoint",
    );
    assert_eq!(reopened["strategy_checkpoint_kind"], "review_remediation");
    assert!(
        reopened["last_strategy_checkpoint_fingerprint"]
            .as_str()
            .map(str::trim)
            .is_some_and(|value| !value.is_empty()),
        "same-task reopen should stamp a refreshed strategy checkpoint fingerprint"
    );

    let harness_state: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable after same-task reopen"),
    )
    .expect("harness state should remain valid json after same-task reopen");
    let reopen_trigger = harness_state["strategy_checkpoints"]
        .as_array()
        .and_then(|checkpoints| checkpoints.last())
        .and_then(|checkpoint| checkpoint["trigger_fingerprints"].as_array())
        .and_then(|triggers| triggers.first())
        .and_then(Value::as_str)
        .expect("same-task reopen should record a strategy trigger");
    assert!(
        reopen_trigger.contains("reopen-after-review-dispatch"),
        "same-task reopen should record a reopen refresh checkpoint after consuming the bound dispatch credit"
    );
}

#[test]
fn task4_reopen_stales_active_evaluation_handoff_and_downstream_provenance() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task4-reopen-stales-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));

    let contract_rel = "docs/featureforge/execution-evidence/task4-reopen-provenance-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "executing",
            "latest_authoritative_sequence": 41,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": ["spec_compliance"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pass",
            "last_evaluation_report_path": "evaluation-before-reopen.md",
            "last_evaluation_report_fingerprint": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "last_evaluation_evaluator_kind": "spec_compliance",
            "last_evaluation_verdict": "pass",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": [],
            "last_handoff_path": "handoff-before-reopen.md",
            "last_handoff_fingerprint": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            "final_review_state": "fresh",
            "browser_qa_state": "fresh",
            "release_docs_state": "fresh",
            "last_final_review_artifact_fingerprint": "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            "last_browser_qa_artifact_fingerprint": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
            "last_release_docs_artifact_fingerprint": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
        }),
    );

    let status_before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before reopen provenance stale cascade",
    );
    assert_eq!(
        status_before["last_evaluation_report_fingerprint"],
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );

    let _ = run_rust_json(
        repo,
        state,
        &[
            "reopen",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--reason",
            "Reopen should stale macro provenance graph.",
            "--expect-execution-fingerprint",
            status_before["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "reopen should stale active evaluation/handoff/downstream provenance",
    );

    let status_after = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status after reopen provenance stale cascade",
    );
    assert_eq!(
        status_after["last_evaluation_report_path"],
        Value::Null,
        "reopen should stale active evaluation provenance path"
    );
    assert_eq!(
        status_after["last_evaluation_report_fingerprint"],
        Value::Null,
        "reopen should stale active evaluation provenance fingerprint"
    );
    assert_eq!(
        status_after["last_evaluation_evaluator_kind"],
        Value::Null,
        "reopen should stale evaluator provenance kind"
    );
    assert_eq!(
        status_after["last_evaluation_verdict"],
        Value::Null,
        "reopen should stale evaluator provenance verdict"
    );

    let persisted: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after reopen"),
    )
    .expect("harness state should remain valid json after reopen");
    assert_eq!(
        persisted["final_review_state"], "stale",
        "reopen should stale downstream final-review provenance"
    );
    assert_eq!(
        persisted["browser_qa_state"], "stale",
        "reopen should stale downstream browser-qa provenance"
    );
    assert_eq!(
        persisted["release_docs_state"], "stale",
        "reopen should stale downstream release-doc provenance"
    );
    for field in [
        "last_handoff_path",
        "last_handoff_fingerprint",
        "last_final_review_artifact_fingerprint",
        "last_browser_qa_artifact_fingerprint",
        "last_release_docs_artifact_fingerprint",
    ] {
        assert!(
            persisted.get(field).is_none() || persisted[field].is_null(),
            "reopen should stale `{field}` provenance pointer, got {}",
            persisted[field]
        );
    }
}

#[test]
fn task4_reopen_rolls_back_plan_evidence_and_harness_state_when_state_publish_fails() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task4-reopen-state-publish-rollback");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));

    let contract_rel = "docs/featureforge/execution-evidence/task4-reopen-rollback-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "executing",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &[],
        false,
    );

    let status_before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before reopen rollback failpoint",
    );
    let plan_before = fs::read_to_string(repo.join(PLAN_REL))
        .expect("plan should remain readable before reopen rollback failpoint");
    let evidence_path = repo.join(evidence_rel_path());
    let evidence_before = fs::read_to_string(&evidence_path)
        .expect("evidence should remain readable before reopen rollback failpoint");
    let harness_before = fs::read_to_string(harness_state_file_path(repo, state))
        .expect("harness state should remain readable before reopen rollback failpoint");

    let reopen = run_rust_with_env(
        repo,
        state,
        &[
            "reopen",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--reason",
            "Reopen should roll back plan/evidence/state when state publish fails.",
            "--expect-execution-fingerprint",
            status_before["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        &[(
            "FEATUREFORGE_PLAN_EXECUTION_TEST_FAILPOINT",
            "reopen_after_plan_and_evidence_write_before_authoritative_state_publish",
        )],
        "reopen with authoritative state publish failpoint",
    );
    let failure = parse_failure_json(&reopen, "reopen authoritative state publish failpoint");
    assert_eq!(
        failure["error_class"], "PartialAuthoritativeMutation",
        "reopen should classify authoritative state publish failures as partial mutations"
    );

    assert_eq!(
        fs::read_to_string(repo.join(PLAN_REL)).expect("plan should remain readable after reopen"),
        plan_before,
        "reopen should roll back plan mutation when authoritative state publish fails"
    );
    assert_eq!(
        fs::read_to_string(&evidence_path).expect("evidence should remain readable after reopen"),
        evidence_before,
        "reopen should roll back evidence mutation when authoritative state publish fails"
    );
    assert_eq!(
        fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after reopen"),
        harness_before,
        "reopen should roll back authoritative harness state mutation when publish fails"
    );
}

#[test]
fn canonical_transfer_parks_active_step_and_reopens_repair_step() {
    let (repo_dir, state_dir) = init_repo("plan-execution-transfer");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");
    write_file(&repo.join("docs/example-output.md"), "initial output\n");
    accept_execution_preflight(repo, state, PLAN_REL);

    let before_repair_begin = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before repair begin",
    );
    run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "2",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before_repair_begin["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "begin repair step",
    );
    let before_repair_complete = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before repair complete",
    );
    run_rust_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            PLAN_REL,
            "--task",
            "2",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Completed the repair step once.",
            "--manual-verify-summary",
            "Verified the initial repair output.",
            "--file",
            "docs/example-output.md",
            "--expect-execution-fingerprint",
            before_repair_complete["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "complete repair step",
    );

    let before_active_begin = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before active begin",
    );
    run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before_active_begin["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "begin active step",
    );

    let before_transfer = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before transfer",
    );
    let transferred = run_rust_json(
        repo,
        state,
        &[
            "transfer",
            "--plan",
            PLAN_REL,
            "--repair-task",
            "2",
            "--repair-step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--reason",
            "Current work invalidated an earlier completed step",
            "--expect-execution-fingerprint",
            before_transfer["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "transfer to completed repair step",
    );

    assert_eq!(transferred["active_task"], Value::Null);
    assert_eq!(transferred["active_step"], Value::Null);
    assert_eq!(transferred["resume_task"], Value::from(1));
    assert_eq!(transferred["resume_step"], Value::from(1));

    let plan = fs::read_to_string(repo.join(PLAN_REL)).expect("plan should exist after transfer");
    assert!(plan.contains("- [ ] **Step 1: Repair an invalidated prior step**"));
    assert!(plan.contains("**Execution Note:** Interrupted - Parked for repair of Task 2 Step 1"));

    let evidence = fs::read_to_string(repo.join(evidence_rel_path()))
        .expect("evidence should exist after transfer");
    assert!(evidence.contains("### Task 2 Step 1"));
    assert!(evidence.contains("**Status:** Invalidated"));
    assert!(
        evidence.contains(
            "**Invalidation Reason:** Current work invalidated an earlier completed step"
        )
    );
}

#[test]
fn canonical_status_rejects_non_sequential_evidence_attempt_numbers() {
    let (repo_dir, state_dir) = init_repo("plan-execution-malformed-attempt-number");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    write_file(
        &repo.join(evidence_rel_path()),
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 2\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** featureforge:executing-plans\n**Claim:** Prepared the workspace for execution.\n**Files:**\n- docs/example-output.md\n**Verification:**\n- `cargo test --test plan_execution` -> passed in fixture setup\n**Invalidation Reason:** N/A\n"
        ),
    );

    let output = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status with non-sequential attempt number",
    );
    assert!(
        !output.status.success(),
        "status should fail for non-sequential attempt numbers, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value =
        serde_json::from_slice(payload).expect("non-sequential attempt error should be json");
    assert_eq!(json["error_class"], "MalformedExecutionState");
}

#[test]
fn canonical_status_uses_the_freshest_completed_attempt_metadata() {
    let (repo_dir, state_dir) = init_repo("plan-execution-latest-completed-by-recorded-at");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    write_file(&repo.join("docs/example-output.md"), "verified output\n");
    let file_digest = sha256_hex(
        &fs::read(repo.join("docs/example-output.md")).expect("output should be readable"),
    );
    let plan_fingerprint =
        sha256_hex(&fs::read(repo.join(PLAN_REL)).expect("plan should be readable for evidence"));
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable for evidence"));
    let newer_packet = expected_packet_fingerprint(repo, 1, 1);
    let older_packet = expected_packet_fingerprint(repo, 1, 2);

    write_file(
        &repo.join(evidence_rel_path()),
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n**Plan Fingerprint:** {plan_fingerprint}\n**Source Spec Path:** {SPEC_REL}\n**Source Spec Revision:** 1\n**Source Spec Fingerprint:** {spec_fingerprint}\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:45Z\n**Execution Source:** featureforge:executing-plans\n**Task Number:** 1\n**Step Number:** 1\n**Packet Fingerprint:** {newer_packet}\n**Head SHA:** 1111111111111111111111111111111111111111\n**Base SHA:** aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n**Claim:** Newer completed attempt.\n**Files Proven:**\n- docs/example-output.md | sha256:{file_digest}\n**Verification Summary:** Manual inspection only: Verified by fixture setup.\n**Invalidation Reason:** N/A\n\n### Task 1 Step 2\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** featureforge:executing-plans\n**Task Number:** 1\n**Step Number:** 2\n**Packet Fingerprint:** {older_packet}\n**Head SHA:** 2222222222222222222222222222222222222222\n**Base SHA:** bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n**Claim:** Older completed attempt recorded later in document order.\n**Files Proven:**\n- docs/example-output.md | sha256:{file_digest}\n**Verification Summary:** Manual inspection only: Verified by fixture setup.\n**Invalidation Reason:** N/A\n"
        ),
    );

    let status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status should prefer freshest completed attempt metadata",
    );

    assert_eq!(
        status["latest_head_sha"],
        "1111111111111111111111111111111111111111"
    );
    assert_eq!(
        status["latest_base_sha"],
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    assert_eq!(status["latest_packet_fingerprint"], newer_packet);
}

#[test]
fn canonical_status_rejects_whitespace_only_persisted_file_entry() {
    let (repo_dir, state_dir) = init_repo("plan-execution-whitespace-only-file-entry");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "featureforge:executing-plans");
    write_file(
        &repo.join(evidence_rel_path()),
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** featureforge:executing-plans\n**Claim:** Prepared the workspace for execution.\n**Files:**\n-   \n**Verification:**\n- `cargo test --test plan_execution` -> passed in fixture setup\n**Invalidation Reason:** N/A\n"
        ),
    );

    let output = run_rust(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status with whitespace-only persisted file entry",
    );
    assert!(
        !output.status.success(),
        "status should fail for whitespace-only persisted file entries, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let payload = if output.stdout.is_empty() {
        &output.stderr
    } else {
        &output.stdout
    };
    let json: Value =
        serde_json::from_slice(payload).expect("whitespace-only file entry error should be json");
    assert_eq!(json["error_class"], "MalformedExecutionState");
}

#[test]
fn canonical_complete_canonicalizes_rename_backed_paths() {
    let (repo_dir, state_dir) = init_repo("plan-execution-rename-backed-path");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    accept_execution_preflight(repo, state, PLAN_REL);
    write_file(&repo.join("docs/old-output.md"), "tracked output\n");

    let mut git_add = Command::new("git");
    git_add
        .args(["add", "docs/old-output.md"])
        .current_dir(repo);
    run_checked(git_add, "git add old output");

    let mut git_commit = Command::new("git");
    git_commit
        .args(["commit", "-m", "add old output"])
        .current_dir(repo);
    run_checked(git_commit, "git commit old output");

    let mut git_mv = Command::new("git");
    git_mv
        .args(["mv", "docs/old-output.md", "docs/new-output.md"])
        .current_dir(repo);
    run_checked(git_mv, "git mv old output to new output");

    let before = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before rename-backed complete",
    );
    let active = run_rust_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            before["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "begin before rename-backed complete",
    );

    run_rust_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Prepared the workspace",
            "--file",
            "docs/old-output.md",
            "--manual-verify-summary",
            "Verified by inspection",
            "--expect-execution-fingerprint",
            active["execution_fingerprint"]
                .as_str()
                .expect("fingerprint"),
        ],
        "rename-backed complete",
    );

    let evidence = fs::read_to_string(repo.join(evidence_rel_path()))
        .expect("evidence should exist after rename-backed complete");
    assert!(evidence.contains("**Files Proven:**\n- docs/new-output.md | sha256:"));
    assert!(!evidence.contains("- docs/old-output.md | sha256:missing"));
}

#[test]
fn task3_gate_and_record_contract_commands_fail_without_authoritative_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-contract-authority-state-required");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/valid-execution-contract.md";
    write_execution_contract_artifact(repo, contract_rel, None);

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract command should reject missing authoritative harness state",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "command {command_name} should fail closed without authoritative harness state"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("active_contract_missing"))),
            "command {command_name} should emit active_contract_missing when authoritative harness state is missing, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_contract_reject_illegal_contract_approval_phase() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-contract-phase-legality");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/valid-execution-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "implementation_handoff",
        contract_rel,
        &contract_fingerprint,
        &[],
        &[],
        false,
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract command should reject illegal contract-approval phase",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "command {command_name} should fail closed when the harness phase is illegal for contract approval"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_illegal_phase"))),
            "command {command_name} should emit contract_illegal_phase for illegal contract approval phase, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_contract_reject_unknown_featureforge_generated_by() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-reject-unknown-featureforge-mode");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/valid-execution-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );
    rewrite_artifact_generated_by_with_canonical_fingerprint(
        repo,
        contract_rel,
        "featureforge:invented-producer",
        "Contract Fingerprint",
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract command should reject unknown featureforge generated_by values",
        );
        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed for unknown featureforge generated_by values"
        );
        assert_eq!(
            json["failure_class"],
            Value::String(String::from("NonHarnessProvenance")),
            "{command_name} should classify unknown featureforge generated_by values as non-harness provenance"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_non_harness_provenance"))),
            "{command_name} should emit contract_non_harness_provenance for unknown featureforge generated_by values, got {json}"
        );
    }

    let forged_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("contract-{contract_fingerprint}.md"),
    );
    assert!(
        !forged_publish_path.exists(),
        "record-contract must not publish contracts produced by unknown featureforge generated_by values"
    );
}

#[test]
fn task3_gate_and_record_contract_reject_unsupported_verifier_kind() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-unsupported-verifier-kind");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/unsupported-verifier-contract.md";
    write_execution_contract_artifact(repo, contract_rel, None);
    rewrite_contract_verifiers_with_canonical_fingerprint(
        repo,
        contract_rel,
        &["spec_compliance", "invented_evaluator"],
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract commands should reject unsupported top-level verifier kinds",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed for unsupported verifier kinds"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_artifact_unreadable"))),
            "{command_name} should fail in artifact parse/read before authoritative acceptance, got {json}"
        );
    }

    let contract_source = fs::read_to_string(repo.join(contract_rel))
        .expect("contract fixture should remain readable");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&contract_source, "Contract Fingerprint");
    let forbidden_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("contract-{contract_fingerprint}.md"),
    );
    assert!(
        !forbidden_publish_path.exists(),
        "record-contract must not publish contracts with unsupported evaluator kinds"
    );
}

#[test]
fn task3_gate_and_record_contract_reject_criterion_verifier_kind_not_declared_top_level() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-undeclared-verifier-kind");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/undeclared-verifier-contract.md";
    write_execution_contract_artifact(repo, contract_rel, None);
    rewrite_contract_verifiers_with_canonical_fingerprint(repo, contract_rel, &["code_quality"]);
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract commands should reject criterion verifier kinds not declared top-level",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when criterion verifier kinds are undeclared by top-level verifiers"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_artifact_unreadable"))),
            "{command_name} should fail in artifact parse/read before authoritative acceptance, got {json}"
        );
    }

    let contract_source = fs::read_to_string(repo.join(contract_rel))
        .expect("contract fixture should remain readable");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&contract_source, "Contract Fingerprint");
    let forbidden_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("contract-{contract_fingerprint}.md"),
    );
    assert!(
        !forbidden_publish_path.exists(),
        "record-contract must not publish contracts whose criteria use undeclared evaluator kinds"
    );
}

#[test]
fn task3_gate_and_record_contract_reject_criterion_with_multiple_verifier_owners() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-shared-criterion-owner");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/shared-criterion-owner-contract.md";
    write_execution_contract_artifact(repo, contract_rel, None);
    rewrite_contract_verifiers_with_canonical_fingerprint(
        repo,
        contract_rel,
        &["spec_compliance", "code_quality"],
    );
    rewrite_contract_first_criterion_verifier_types_with_canonical_fingerprint(
        repo,
        contract_rel,
        &["spec_compliance", "code_quality"],
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract commands should reject criteria with multiple verifier owners",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when a criterion has multiple verifier owners"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_artifact_unreadable"))),
            "{command_name} should fail in artifact parse/read before authoritative acceptance, got {json}"
        );
    }

    let contract_source = fs::read_to_string(repo.join(contract_rel))
        .expect("contract fixture should remain readable");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&contract_source, "Contract Fingerprint");
    let forbidden_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("contract-{contract_fingerprint}.md"),
    );
    assert!(
        !forbidden_publish_path.exists(),
        "record-contract must not publish contracts whose criteria declare multiple verifier owners"
    );
}

#[test]
fn task3_gate_and_record_contract_reject_criterion_with_empty_verifier_owners() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-ownerless-criterion-owner");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/ownerless-criterion-owner-contract.md";
    write_execution_contract_artifact(repo, contract_rel, None);
    rewrite_contract_first_criterion_verifier_types_with_canonical_fingerprint(
        repo,
        contract_rel,
        &[],
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract commands should reject criteria with empty verifier owners",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when a criterion has empty verifier owners"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_artifact_unreadable"))),
            "{command_name} should fail in artifact parse/read before authoritative acceptance, got {json}"
        );
    }

    let contract_source = fs::read_to_string(repo.join(contract_rel))
        .expect("contract fixture should remain readable");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&contract_source, "Contract Fingerprint");
    let forbidden_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("contract-{contract_fingerprint}.md"),
    );
    assert!(
        !forbidden_publish_path.exists(),
        "record-contract must not publish contracts whose criteria declare empty verifier owners"
    );
}

#[test]
fn task3_evaluator_and_handoff_commands_fail_without_authoritative_contract_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-authority-state-required");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_fingerprint = write_execution_contract_artifact(
        repo,
        "docs/featureforge/execution-evidence/valid-execution-contract.md",
        None,
    );
    let evaluation_rel = "docs/featureforge/execution-evidence/valid-evaluation-report.md";
    write_execution_evaluation_artifact(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        None,
    );
    let handoff_rel = "docs/featureforge/execution-evidence/valid-execution-handoff.md";
    write_execution_handoff_artifact(repo, handoff_rel, &contract_fingerprint, None);

    for (command_name, artifact_flag, artifact_rel) in [
        ("gate-evaluator", "--evaluation", evaluation_rel),
        ("record-evaluation", "--evaluation", evaluation_rel),
        ("gate-handoff", "--handoff", handoff_rel),
        ("record-handoff", "--handoff", handoff_rel),
    ] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                artifact_flag,
                artifact_rel,
            ],
            "task3 command should reject missing authoritative contract state",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "command {command_name} should fail closed without authoritative contract state"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("active_contract_missing"))),
            "command {command_name} should emit active_contract_missing when no authoritative contract is active, got {json}"
        );
    }
}

#[test]
fn task3_gate_evaluator_checks_required_evaluator_and_phase_legality() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evaluator-authority-checks");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/active-execution-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "contract_approved",
        contract_rel,
        &contract_fingerprint,
        &["code_quality"],
        &["code_quality"],
        false,
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/candidate-evaluation-report.md";
    write_execution_evaluation_artifact(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &[
            "gate-evaluator",
            "--plan",
            PLAN_REL,
            "--evaluation",
            evaluation_rel,
        ],
        "gate-evaluator should enforce evaluator state and phase legality",
    );

    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("evaluator_kind_not_required"))),
        "gate-evaluator should reject evaluator kinds not required by authoritative state, got {json}"
    );
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("evaluation_illegal_phase"))),
        "gate-evaluator should reject illegal harness phases, got {json}"
    );
}

#[test]
fn task3_gate_handoff_checks_required_handoff_state_and_phase_legality() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-handoff-authority-checks");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/active-execution-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let handoff_rel = "docs/featureforge/execution-evidence/candidate-execution-handoff.md";
    write_execution_handoff_artifact(repo, handoff_rel, &contract_fingerprint, None);

    let json = run_rust_json(
        repo,
        state,
        &["gate-handoff", "--plan", PLAN_REL, "--handoff", handoff_rel],
        "gate-handoff should enforce required handoff state and phase legality",
    );

    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("handoff_not_required"))),
        "gate-handoff should reject handoff artifacts unless handoff is required, got {json}"
    );
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("handoff_illegal_phase"))),
        "gate-handoff should reject illegal harness phases, got {json}"
    );
}

#[test]
fn task3_evaluator_and_handoff_bind_to_active_contract_content() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-active-contract-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/active-execution-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let forged_state_fingerprint = "forged-active-contract-fingerprint";
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        forged_state_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/candidate-evaluation-report.md";
    write_execution_evaluation_artifact(
        repo,
        evaluation_rel,
        forged_state_fingerprint,
        "spec_compliance",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "evaluation command should reject forged active contract fingerprint state",
        );
        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when authoritative state fingerprint disagrees with active contract content"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("active_contract_fingerprint_mismatch"))),
            "{command_name} should emit active_contract_fingerprint_mismatch for forged active-contract state, got {json}"
        );
    }

    write_harness_state_fixture!(
        repo,
        state,
        "handoff_required",
        contract_rel,
        forged_state_fingerprint,
        &[],
        &[],
        true,
    );
    let handoff_rel = "docs/featureforge/execution-evidence/candidate-execution-handoff.md";
    write_execution_handoff_artifact(repo, handoff_rel, forged_state_fingerprint, None);

    for command_name in ["gate-handoff", "record-handoff"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--handoff", handoff_rel],
            "handoff command should reject forged active contract fingerprint state",
        );
        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when authoritative state fingerprint disagrees with active contract content"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("active_contract_fingerprint_mismatch"))),
            "{command_name} should emit active_contract_fingerprint_mismatch for forged active-contract state, got {json}"
        );
    }

    assert_ne!(
        contract_fingerprint, forged_state_fingerprint,
        "fixture should use a forged harness-state active contract fingerprint"
    );
}

#[test]
fn task3_evaluator_and_handoff_reject_forged_active_contract_spec_provenance() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-active-contract-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/forged-active-execution-contract.md";
    let forged_spec_fingerprint = "forged-active-contract-spec-fingerprint";
    let contract_fingerprint = write_execution_contract_with_forged_spec_fingerprint(
        repo,
        contract_rel,
        forged_spec_fingerprint,
    );

    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );
    let evaluation_rel = "docs/featureforge/execution-evidence/candidate-evaluation-report.md";
    write_execution_evaluation_artifact(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "evaluation commands should reject forged active contract spec provenance",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when active contract spec fingerprint provenance is forged"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_spec_fingerprint_mismatch"))),
            "{command_name} should emit contract_spec_fingerprint_mismatch when the active contract has forged spec provenance, got {json}"
        );
    }

    write_harness_state_fixture!(
        repo,
        state,
        "handoff_required",
        contract_rel,
        &contract_fingerprint,
        &[],
        &[],
        true,
    );
    let handoff_rel = "docs/featureforge/execution-evidence/candidate-execution-handoff.md";
    write_execution_handoff_artifact(repo, handoff_rel, &contract_fingerprint, None);

    for command_name in ["gate-handoff", "record-handoff"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--handoff", handoff_rel],
            "handoff commands should reject forged active contract spec provenance",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when active contract spec fingerprint provenance is forged"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_spec_fingerprint_mismatch"))),
            "{command_name} should emit contract_spec_fingerprint_mismatch when the active contract has forged spec provenance, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_contract_reject_forged_source_spec_fingerprint() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-source-spec-fingerprint-forgery");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/forged-source-spec-contract.md";
    let forged_spec_fingerprint = "forged-source-spec-fingerprint";
    let forged_contract_fingerprint = write_execution_contract_with_forged_spec_fingerprint(
        repo,
        contract_rel,
        forged_spec_fingerprint,
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract command should reject forged source spec provenance",
        );
        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "{command_name} should fail closed when Source Spec Fingerprint does not match source spec content"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_spec_fingerprint_mismatch"))),
            "{command_name} should emit contract_spec_fingerprint_mismatch for forged source spec provenance, got {json}"
        );
    }

    let forged_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("contract-{forged_contract_fingerprint}.md"),
    );
    assert!(
        !forged_publish_path.exists(),
        "record-contract must not publish a forged source-spec provenance contract"
    );
}

#[test]
fn task3_gate_commands_reject_forged_artifact_fingerprint_headers() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-forged-gate-fingerprint");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let forged_contract_fingerprint = "forged-gate-contract-fingerprint";
    let forged_contract_rel = "docs/featureforge/execution-evidence/forged-gate-contract.md";
    write_execution_contract_artifact(repo, forged_contract_rel, Some(forged_contract_fingerprint));

    let contract_json = run_rust_json(
        repo,
        state,
        &[
            "gate-contract",
            "--plan",
            PLAN_REL,
            "--contract",
            forged_contract_rel,
        ],
        "gate-contract should reject forged contract fingerprint headers",
    );
    assert_eq!(contract_json["allowed"], Value::Bool(false));
    assert_eq!(contract_json["failure_class"], "ArtifactIntegrityMismatch");
    assert!(
        contract_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_fingerprint_mismatch"))),
        "gate-contract should emit contract_fingerprint_mismatch for forged headers, got {contract_json}"
    );

    let active_contract_rel = "docs/featureforge/execution-evidence/active-execution-contract.md";
    let active_contract_fingerprint =
        write_execution_contract_artifact(repo, active_contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        active_contract_rel,
        &active_contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let forged_report_fingerprint = "forged-gate-evaluation-fingerprint";
    let forged_evaluation_rel =
        "docs/featureforge/execution-evidence/forged-gate-evaluation-report.md";
    write_execution_evaluation_artifact(
        repo,
        forged_evaluation_rel,
        &active_contract_fingerprint,
        "spec_compliance",
        Some(forged_report_fingerprint),
    );
    let evaluation_json = run_rust_json(
        repo,
        state,
        &[
            "gate-evaluator",
            "--plan",
            PLAN_REL,
            "--evaluation",
            forged_evaluation_rel,
        ],
        "gate-evaluator should reject forged report fingerprint headers",
    );
    assert_eq!(evaluation_json["allowed"], Value::Bool(false));
    assert_eq!(
        evaluation_json["failure_class"],
        "ArtifactIntegrityMismatch"
    );
    assert!(
        evaluation_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("evaluation_fingerprint_mismatch"))),
        "gate-evaluator should emit evaluation_fingerprint_mismatch for forged headers, got {evaluation_json}"
    );

    write_harness_state_fixture!(
        repo,
        state,
        "handoff_required",
        active_contract_rel,
        &active_contract_fingerprint,
        &[],
        &[],
        true,
    );
    let forged_handoff_fingerprint = "forged-gate-handoff-fingerprint";
    let forged_handoff_rel = "docs/featureforge/execution-evidence/forged-gate-handoff.md";
    write_execution_handoff_artifact(
        repo,
        forged_handoff_rel,
        &active_contract_fingerprint,
        Some(forged_handoff_fingerprint),
    );
    let handoff_json = run_rust_json(
        repo,
        state,
        &[
            "gate-handoff",
            "--plan",
            PLAN_REL,
            "--handoff",
            forged_handoff_rel,
        ],
        "gate-handoff should reject forged handoff fingerprint headers",
    );
    assert_eq!(handoff_json["allowed"], Value::Bool(false));
    assert_eq!(handoff_json["failure_class"], "ArtifactIntegrityMismatch");
    assert!(
        handoff_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("handoff_fingerprint_mismatch"))),
        "gate-handoff should emit handoff_fingerprint_mismatch for forged headers, got {handoff_json}"
    );
}

#[test]
fn task3_record_contract_rejects_forged_contract_fingerprint_headers() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-forged-contract-fingerprint");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let forged_fingerprint = "forged-contract-fingerprint";
    let contract_rel = "docs/featureforge/execution-evidence/forged-execution-contract.md";
    write_execution_contract_artifact(repo, contract_rel, Some(forged_fingerprint));

    let json = run_rust_json(
        repo,
        state,
        &[
            "record-contract",
            "--plan",
            PLAN_REL,
            "--contract",
            contract_rel,
        ],
        "record-contract should reject forged fingerprint headers",
    );

    assert_eq!(json["allowed"], Value::Bool(false));
    assert_eq!(json["failure_class"], "ArtifactIntegrityMismatch");
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("contract_fingerprint_mismatch"))),
        "record-contract should emit contract_fingerprint_mismatch for forged headers, got {json}"
    );

    let forged_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("contract-{forged_fingerprint}.md"),
    );
    assert!(
        !forged_publish_path.exists(),
        "record-contract must not publish under a forged contract fingerprint header"
    );
}

#[test]
fn task3_record_evaluation_and_handoff_reject_forged_fingerprint_headers() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-forged-eval-handoff-fingerprint");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/active-execution-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let forged_evaluation_fingerprint = "forged-evaluation-fingerprint";
    let evaluation_rel = "docs/featureforge/execution-evidence/forged-evaluation-report.md";
    write_execution_evaluation_artifact(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        Some(forged_evaluation_fingerprint),
    );
    let evaluation_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            evaluation_rel,
        ],
        "record-evaluation should reject forged fingerprint headers",
    );
    assert_eq!(evaluation_json["allowed"], Value::Bool(false));
    assert_eq!(
        evaluation_json["failure_class"],
        "ArtifactIntegrityMismatch"
    );
    assert!(
        evaluation_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("evaluation_fingerprint_mismatch"))),
        "record-evaluation should emit evaluation_fingerprint_mismatch for forged headers, got {evaluation_json}"
    );
    let forged_evaluation_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("evaluation-{forged_evaluation_fingerprint}.md"),
    );
    assert!(
        !forged_evaluation_publish_path.exists(),
        "record-evaluation must not publish under a forged report fingerprint header"
    );

    write_harness_state_fixture!(
        repo,
        state,
        "handoff_required",
        contract_rel,
        &contract_fingerprint,
        &[],
        &[],
        true,
    );
    let forged_handoff_fingerprint = "forged-handoff-fingerprint";
    let handoff_rel = "docs/featureforge/execution-evidence/forged-execution-handoff.md";
    write_execution_handoff_artifact(
        repo,
        handoff_rel,
        &contract_fingerprint,
        Some(forged_handoff_fingerprint),
    );
    let handoff_json = run_rust_json(
        repo,
        state,
        &[
            "record-handoff",
            "--plan",
            PLAN_REL,
            "--handoff",
            handoff_rel,
        ],
        "record-handoff should reject forged fingerprint headers",
    );
    assert_eq!(handoff_json["allowed"], Value::Bool(false));
    assert_eq!(handoff_json["failure_class"], "ArtifactIntegrityMismatch");
    assert!(
        handoff_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("handoff_fingerprint_mismatch"))),
        "record-handoff should emit handoff_fingerprint_mismatch for forged headers, got {handoff_json}"
    );
    let forged_handoff_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("handoff-{forged_handoff_fingerprint}.md"),
    );
    assert!(
        !forged_handoff_publish_path.exists(),
        "record-handoff must not publish under a forged handoff fingerprint header"
    );
}

#[test]
fn task3_record_contract_publishes_authoritative_state_transition() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-record-contract-transition");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/record-contract-transition.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0,
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 0,
            "current_chunk_pivot_threshold": 0,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let record_json = run_rust_json(
        repo,
        state,
        &[
            "record-contract",
            "--plan",
            PLAN_REL,
            "--contract",
            contract_rel,
        ],
        "record-contract should publish authoritative state transition",
    );
    assert_eq!(record_json["allowed"], Value::Bool(true));

    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    let authoritative_contract_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &authoritative_contract_file,
    );
    assert!(
        authoritative_contract_path.is_file(),
        "record-contract should publish authoritative contract artifact {}",
        authoritative_contract_path.display()
    );

    let persisted: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should be readable after record-contract"),
    )
    .expect("harness state should remain valid json after record-contract");
    assert_eq!(persisted["harness_phase"], "contract_approved");
    assert_eq!(persisted["latest_authoritative_sequence"], 17);
    assert_eq!(
        persisted["active_contract_path"],
        authoritative_contract_file
    );
    assert_eq!(
        persisted["active_contract_fingerprint"],
        contract_fingerprint
    );
    assert_eq!(persisted["current_chunk_retry_count"], 0);
    assert_eq!(persisted["current_chunk_retry_budget"], 1);
    assert_eq!(persisted["current_chunk_pivot_threshold"], 1);
    assert_eq!(persisted["handoff_required"], false);
    assert_eq!(
        persisted["required_evaluator_kinds"],
        json!(["spec_compliance"])
    );
    assert_eq!(
        persisted["pending_evaluator_kinds"],
        json!(["spec_compliance"])
    );
    assert_eq!(persisted["completed_evaluator_kinds"], json!([]));

    let status = run_rust_json(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status should resolve authoritative state after record-contract",
    );
    assert_eq!(status["harness_phase"], "contract_approved");
    assert_eq!(status["latest_authoritative_sequence"], 17);
    assert_eq!(status["active_contract_path"], authoritative_contract_file);
    assert_eq!(status["active_contract_fingerprint"], contract_fingerprint);
}

#[test]
fn task3_record_commands_acquire_write_authority_before_mutable_gate_checks() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-record-lock-before-mutable-gates");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/record-lock-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/record-lock-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes for lock-boundary fixture.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Lock-boundary fixture evaluation should pass immutable checks.",
        None,
    );

    let handoff_rel = "docs/featureforge/execution-evidence/record-lock-handoff.md";
    write_execution_handoff_artifact_custom!(
        repo,
        handoff_rel,
        &contract_fingerprint,
        21,
        &["criterion-1"],
        &[],
        &[],
        "Resume downstream final-review and finish gates.",
        "Lock-boundary fixture handoff should pass immutable checks.",
        None,
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "implementation_handoff",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    write_file(
        &harness_branch_dir(repo, state)
            .join("execution-harness")
            .join("write-authority.lock"),
        "pid=fixture\n",
    );

    for (command_name, artifact_flag, artifact_rel) in [
        ("record-contract", "--contract", contract_rel),
        ("record-evaluation", "--evaluation", evaluation_rel),
        ("record-handoff", "--handoff", handoff_rel),
    ] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                artifact_flag,
                artifact_rel,
            ],
            "record command lock conflict should take precedence over mutable gate checks",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert_eq!(json["failure_class"], "ConcurrentWriterConflict");
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("concurrent_writer_conflict"))),
            "{command_name} should fail with concurrent_writer_conflict before mutable state validation, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_evaluation_reject_stale_authoritative_sequence() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evaluation-ordering");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/ordering-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 20,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/stale-evaluation.md";
    let stale_fingerprint = write_execution_evaluation_artifact(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "stale evaluation authoritative ordering",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert_eq!(json["failure_class"], "AuthoritativeOrderingMismatch");
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("authoritative_sequence_stale"))),
            "{command_name} should emit authoritative_sequence_stale for stale evaluation sequence, got {json}"
        );
    }

    let stale_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("evaluation-{stale_fingerprint}.md"),
    );
    assert!(
        !stale_publish_path.exists(),
        "record-evaluation must not publish stale authoritative ordering"
    );
}

#[test]
fn task3_record_evaluation_replay_mismatch_does_not_publish_authoritative_artifact() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evaluation-replay-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/replay-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 19,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": ["spec_compliance"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pass",
            "last_evaluation_report_path": "evaluation-previous.md",
            "last_evaluation_report_fingerprint": "previous-report-fingerprint",
            "last_evaluation_evaluator_kind": "spec_compliance",
            "last_evaluation_verdict": "pass",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/replay-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Replay candidate claims this criterion passes.
**Evidence Refs:**
[]
**Severity:** low
"#;
    let replay_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Replay report uses the same authoritative sequence but different report fingerprint.",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            evaluation_rel,
        ],
        "record-evaluation replay mismatch should fail closed",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert_eq!(json["failure_class"], "AuthoritativeOrderingMismatch");
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("authoritative_sequence_replay_mismatch"))),
        "record-evaluation should emit authoritative_sequence_replay_mismatch for equal-sequence replay drift, got {json}"
    );

    let replay_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("evaluation-{replay_fingerprint}.md"),
    );
    assert!(
        !replay_publish_path.exists(),
        "record-evaluation must not publish replay-mismatch artifacts for equal authoritative sequence"
    );
}

#[test]
fn task3_record_evaluation_replay_rejects_drift_in_mutated_state_fields() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evaluation-replay-state-drift");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/replay-drift-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/replay-drift-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Replay candidate keeps criterion-1 passing.
**Evidence Refs:**
[]
**Severity:** low
"#;
    let replay_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Replay report intentionally matches sentinel replay fields.",
        None,
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 19,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": ["spec_compliance"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pass",
            "last_evaluation_report_path": "evaluation-replay-drift.md",
            "last_evaluation_report_fingerprint": replay_fingerprint,
            "last_evaluation_evaluator_kind": "spec_compliance",
            "last_evaluation_verdict": "pass",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": ["criterion-1"]
        }),
    );

    let json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            evaluation_rel,
        ],
        "record-evaluation should reject replay drift in mutated state fields",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert_eq!(json["failure_class"], "AuthoritativeOrderingMismatch");
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("authoritative_sequence_replay_mismatch"))),
        "record-evaluation should emit authoritative_sequence_replay_mismatch when replay state drifts in mutated fields, got {json}"
    );

    let replay_publish_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("evaluation-{replay_fingerprint}.md"),
    );
    assert!(
        !replay_publish_path.exists(),
        "record-evaluation must not publish replay artifacts when mutated state fields drift"
    );
}

#[test]
fn task3_gate_evaluator_rejects_non_passing_criteria_missing_affected_steps() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-task3-evaluator-non-passing-affected-steps");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/non-passing-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/non-passing-affected-steps.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Failing criterion omits its impacted step from affected_steps.
**Evidence Refs:**
[]
**Severity:** high
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "fail",
        criterion_results,
        &[],
        "[]",
        "repair",
        "Failing report intentionally leaves affected_steps empty.",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &[
            "gate-evaluator",
            "--plan",
            PLAN_REL,
            "--evaluation",
            evaluation_rel,
        ],
        "gate-evaluator should reject non-passing criteria missing affected_steps coverage",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("evaluation_non_passing_affected_steps_missing"))),
        "gate-evaluator should emit evaluation_non_passing_affected_steps_missing when fail/blocked criteria are not represented in affected_steps, got {json}"
    );
}

#[test]
fn task3_gate_handoff_rejects_open_criteria_not_in_authoritative_open_set() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-handoff-open-criteria-superset");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/open-criteria-contract.md";
    let _unused_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let contract_path = repo.join(contract_rel);
    let contract_source =
        fs::read_to_string(&contract_path).expect("contract source should be readable");
    let criterion_two = r#"
### Criterion 2
**Criterion ID:** criterion-2
**Title:** Additional open criterion for handoff superset coverage
**Description:** Fixture-only criterion used to verify authoritative open_criteria subset enforcement.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Additional known criterion to isolate authoritative open_criteria policy.

"#;
    let mut updated_contract = contract_source.replacen(
        "**Non Goals:**",
        &format!("{criterion_two}**Non Goals:**"),
        1,
    );
    let updated_contract_fingerprint =
        canonical_fingerprint_without_header_value(&updated_contract, "Contract Fingerprint");
    updated_contract = replace_markdown_header_value(
        &updated_contract,
        "Contract Fingerprint",
        &updated_contract_fingerprint,
    );
    write_file(&contract_path, &updated_contract);

    let authoritative_contract_file = format!("contract-{updated_contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &updated_contract,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "handoff_required",
            "latest_authoritative_sequence": 19,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": updated_contract_fingerprint,
            "required_evaluator_kinds": [],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "blocked",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-1"]
        }),
    );

    let handoff_rel = "docs/featureforge/execution-evidence/open-criteria-superset-handoff.md";
    write_execution_handoff_artifact_custom!(
        repo,
        handoff_rel,
        &updated_contract_fingerprint,
        21,
        &[],
        &["criterion-1", "criterion-2"],
        &["criterion-1 remains unresolved and criterion-2 is incorrectly included."],
        "Resume checkpoint work and close unresolved criteria.",
        "Handoff intentionally includes open criteria beyond authoritative unresolved criteria.",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &["gate-handoff", "--plan", PLAN_REL, "--handoff", handoff_rel],
        "gate-handoff should reject open_criteria supersets",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("handoff_unresolved_criteria_superset"))),
        "gate-handoff should emit handoff_unresolved_criteria_superset when open_criteria contains unresolved criteria beyond authoritative state, got {json}"
    );
}

#[test]
fn task3_gate_handoff_rejects_open_criteria_when_authoritative_open_set_is_empty() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-handoff-open-criteria-empty-auth");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/empty-open-set-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "handoff_required",
            "latest_authoritative_sequence": 19,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": [],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "blocked",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": true,
            "open_failed_criteria": []
        }),
    );

    let handoff_rel = "docs/featureforge/execution-evidence/empty-open-set-handoff.md";
    write_execution_handoff_artifact_custom!(
        repo,
        handoff_rel,
        &contract_fingerprint,
        21,
        &[],
        &["criterion-1"],
        &["Criterion-1 is incorrectly reported open despite empty authoritative unresolved set."],
        "Resume from checkpoint.",
        "Handoff intentionally reports open criteria absent from authoritative unresolved set.",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &["gate-handoff", "--plan", PLAN_REL, "--handoff", handoff_rel],
        "gate-handoff should reject non-empty open_criteria when authoritative unresolved set is empty",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("handoff_unresolved_criteria_superset"))),
        "gate-handoff should emit handoff_unresolved_criteria_superset when authoritative unresolved set is empty and open_criteria is non-empty, got {json}"
    );
}

#[test]
fn task3_gate_evaluator_fails_closed_on_semantic_and_evidence_mismatch() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evaluator-semantic-fail-closed");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/evidence-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test evidence for the active contract criterion.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/semantic-fail-open-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-unknown
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 9 Step 9
**Finding:** This criterion id does not exist in the active contract.
**Evidence Refs:**
[]
**Severity:** high
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 9 Step 9"],
        "[]",
        "continue",
        "Intentionally inconsistent pass report for fail-closed gate coverage.",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &[
            "gate-evaluator",
            "--plan",
            PLAN_REL,
            "--evaluation",
            evaluation_rel,
        ],
        "gate-evaluator semantic fail-closed coverage",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("evaluation_unknown_criterion_id"))),
        "gate-evaluator should reject criterion ids that are not mapped by the active contract, got {json}"
    );
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("evaluation_affected_step_out_of_scope"))),
        "gate-evaluator should reject out-of-scope affected steps, got {json}"
    );
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("evaluation_pass_contains_non_passing_criteria"))),
        "gate-evaluator should reject pass verdicts that still conceal non-passing criterion results, got {json}"
    );
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("missing_required_evidence"))),
        "gate-evaluator should fail closed when required evidence is unsatisfied, got {json}"
    );
}

#[test]
fn task3_gate_evaluator_rejects_non_pass_verdict_when_all_criteria_pass() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-task3-evaluator-non-pass-with-all-pass-criteria");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/non-pass-all-pass-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/non-pass-all-pass-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes; fixture forces contradictory top-level verdict.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "fail",
        criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "repair",
        "Top-level verdict intentionally contradicts all-pass criterion results.",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "non-pass verdict contradiction should fail closed",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| {
                codes.iter().any(|code| {
                    code.as_str() == Some("evaluation_non_pass_verdict_all_pass_criteria")
                })
            }),
            "{command_name} should reject fail/blocked verdicts when criterion_results are all pass, got {json}"
        );
    }
}

#[test]
fn task3_gate_evaluator_rejects_evidence_refs_with_wrong_kind_for_requirement() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evaluator-evidence-kind-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/evidence-kind-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test evidence for the active contract criterion.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let evaluation_rel =
        "docs/featureforge/execution-evidence/evidence-kind-mismatch-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes but evidence kind does not match the contract requirement kind.
**Evidence Refs:**
- evidence-ref-1
**Severity:** low
"#;
    let evidence_refs = r#"### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-1
**Kind:** code_location
**Source:** repo:src/lib.rs#L1
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-1
**Summary:** Evidence ref intentionally uses the wrong kind for the requirement.
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &[],
        evidence_refs,
        "continue",
        "Intentional wrong-kind evidence coverage for fail-closed behavior.",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &[
            "gate-evaluator",
            "--plan",
            PLAN_REL,
            "--evaluation",
            evaluation_rel,
        ],
        "gate-evaluator should reject wrong-kind evidence refs for requirement matching",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("missing_required_evidence"))),
        "gate-evaluator should fail when evidence requirement kind is unsatisfied by matching refs, got {json}"
    );
}

#[test]
fn task3_gate_handoff_requires_unresolved_criteria_fields_for_open_work() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-handoff-open-work-contract");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/handoff-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "handoff_required",
            "latest_authoritative_sequence": 19,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": [],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "blocked",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 2,
            "current_chunk_pivot_threshold": 2,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-1"]
        }),
    );

    let handoff_rel = "docs/featureforge/execution-evidence/incomplete-handoff.md";
    write_execution_handoff_artifact_custom!(
        repo,
        handoff_rel,
        &contract_fingerprint,
        21,
        &["criterion-1"],
        &[],
        &[],
        "Resume from checkpoint.",
        "Open work exists but unresolved criteria are intentionally omitted.",
        None,
    );

    let json = run_rust_json(
        repo,
        state,
        &["gate-handoff", "--plan", PLAN_REL, "--handoff", handoff_rel],
        "gate-handoff open-work semantics",
    );
    assert_eq!(json["allowed"], Value::Bool(false));
    assert!(
        json["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code.as_str() == Some("handoff_unresolved_criteria_missing"))),
        "gate-handoff should fail closed when unresolved criteria fields are missing for open work, got {json}"
    );
}

#[test]
fn task3_record_evaluation_and_handoff_mutate_phase_retry_and_handoff_state() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-record-eval-handoff-transition");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/record-transition-contract.md";
    let contract_fingerprint =
        write_execution_contract_artifact_custom(repo, contract_rel, 17, "[]", 3, 1, None);
    let authoritative_contract_file = format!("contract-{contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &authoritative_contract_file,
        ),
        &fs::read_to_string(repo.join(contract_rel)).expect("contract source should be readable"),
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 17,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 1,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let fail_eval_rel = "docs/featureforge/execution-evidence/failing-evaluation.md";
    let fail_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Repro shows failing criterion path.
**Evidence Refs:**
[]
**Severity:** high
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        fail_eval_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "fail",
        fail_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "repair",
        "Failing evaluation to verify retry mutation precedes fail-path routing.",
        None,
    );

    let fail_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            fail_eval_rel,
        ],
        "record-evaluation fail-path transition coverage",
    );
    assert_eq!(fail_json["allowed"], Value::Bool(true));
    let after_fail: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after fail record-evaluation"),
    )
    .expect("harness state should remain valid json after fail record-evaluation");
    assert_eq!(after_fail["latest_authoritative_sequence"], 19);
    assert_eq!(after_fail["current_chunk_retry_count"], 1);
    assert_eq!(after_fail["harness_phase"], "pivot_required");
    assert_eq!(after_fail["open_failed_criteria"], json!(["criterion-1"]));

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "handoff_required",
            "latest_authoritative_sequence": 19,
            "active_contract_path": authoritative_contract_file,
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": ["spec_compliance"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": ["spec_compliance"],
            "aggregate_evaluation_state": "blocked",
            "current_chunk_retry_count": 1,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 1,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-1"]
        }),
    );
    let handoff_rel = "docs/featureforge/execution-evidence/recorded-handoff.md";
    write_execution_handoff_artifact_custom!(
        repo,
        handoff_rel,
        &contract_fingerprint,
        21,
        &[],
        &["criterion-1"],
        &["Criterion remains open and requires resume work."],
        "Resume task execution from Task 1 Step 1 in a fresh session.",
        "Recorded handoff should clear handoff_required when contract obligations are satisfied.",
        None,
    );
    let handoff_json = run_rust_json(
        repo,
        state,
        &[
            "record-handoff",
            "--plan",
            PLAN_REL,
            "--handoff",
            handoff_rel,
        ],
        "record-handoff transition coverage",
    );
    assert_eq!(handoff_json["allowed"], Value::Bool(true));

    let after_handoff: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after record-handoff"),
    )
    .expect("harness state should remain valid json after record-handoff");
    assert_eq!(after_handoff["latest_authoritative_sequence"], 21);
    assert_eq!(after_handoff["handoff_required"], false);
    assert_eq!(after_handoff["harness_phase"], "executing");
}

#[test]
fn task3_gate_and_record_commands_are_wired_to_runtime_fail_closed_surfaces() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-command-surface");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    for (command_name, artifact_flag, expected_failure_class, expected_reason_code) in [
        (
            "gate-contract",
            "--contract",
            "ContractMismatch",
            "contract_artifact_unreadable",
        ),
        (
            "record-contract",
            "--contract",
            "ContractMismatch",
            "contract_artifact_unreadable",
        ),
        (
            "gate-evaluator",
            "--evaluation",
            "EvaluationMismatch",
            "evaluation_artifact_unreadable",
        ),
        (
            "record-evaluation",
            "--evaluation",
            "EvaluationMismatch",
            "evaluation_artifact_unreadable",
        ),
        (
            "gate-handoff",
            "--handoff",
            "MissingRequiredHandoff",
            "handoff_artifact_unreadable",
        ),
        (
            "record-handoff",
            "--handoff",
            "MissingRequiredHandoff",
            "handoff_artifact_unreadable",
        ),
    ] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                artifact_flag,
                "docs/featureforge/execution-evidence/missing-artifact.md",
            ],
            "task3 gate/record command runtime boundary",
        );

        assert_eq!(
            json["allowed"],
            Value::Bool(false),
            "command {command_name} should fail closed for unreadable artifacts"
        );
        assert_eq!(
            json["failure_class"],
            Value::String(expected_failure_class.to_owned()),
            "command {command_name} should emit stable failure class {expected_failure_class}"
        );
        assert_eq!(
            json["reason_codes"][0],
            Value::String(expected_reason_code.to_owned()),
            "command {command_name} should emit stable reason code {expected_reason_code}"
        );
    }
}

#[test]
fn task3_gate_and_record_contract_reject_out_of_plan_scope() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-contract-scope-boundary");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/out-of-scope-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test evidence for the active contract criterion.
"#;
    let _ = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    let contract_path = repo.join(contract_rel);
    let source =
        fs::read_to_string(&contract_path).expect("contract fixture should remain readable");
    let source = source.replacen(
        "**Covered Steps:**\n- Task 1 Step 1\n**Requirement IDs:**",
        "**Covered Steps:**\n- Task 9 Step 9\n**Requirement IDs:**",
        1,
    );
    let source = source.replacen(
        "**Covered Steps:**\n- Task 1 Step 1\n**Verifier Types:**",
        "**Covered Steps:**\n- Task 9 Step 9\n**Verifier Types:**",
        1,
    );
    let source = source.replacen(
        "**Covered Steps:**\n- Task 1 Step 1\n**Satisfaction Rule:**",
        "**Covered Steps:**\n- Task 9 Step 9\n**Satisfaction Rule:**",
        1,
    );
    let source =
        replace_markdown_header_value(&source, "Contract Fingerprint", "__CONTRACT_FINGERPRINT__");
    let contract_fingerprint =
        canonical_fingerprint_without_header_value(&source, "Contract Fingerprint");
    write_file(
        &contract_path,
        &source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "contract_pending_approval",
            "latest_authoritative_sequence": 0
        }),
    );

    for command_name in ["gate-contract", "record-contract"] {
        let json = run_rust_json(
            repo,
            state,
            &[command_name, "--plan", PLAN_REL, "--contract", contract_rel],
            "contract scope mismatch should fail closed",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_covered_step_out_of_scope"))),
            "{command_name} should reject contract covered_steps outside the approved plan slice, got {json}"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_criterion_covered_step_out_of_scope"))),
            "{command_name} should reject criterion covered_steps outside the approved plan slice, got {json}"
        );
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("contract_evidence_covered_step_out_of_scope"))),
            "{command_name} should reject evidence requirement covered_steps outside the approved plan slice, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_evaluator_require_authoritative_artifact_backed_evidence_refs() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evidence-ref-authoritative");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/evidence-ref-authority-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test evidence for the active contract criterion.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let nonexistent_artifact_fingerprint =
        "1111111111111111111111111111111111111111111111111111111111111111";
    let evaluation_rel = "docs/featureforge/execution-evidence/nonexistent-evidence-ref-eval.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes but references non-authoritative artifact evidence.
**Evidence Refs:**
- evidence-ref-1
**Severity:** low
"#;
    let evidence_refs = format!(
        r#"### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-1
**Kind:** test_result
**Source:** test_artifact:{nonexistent_artifact_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-1
**Summary:** Intentionally references a non-authoritative artifact fingerprint.
"#
    );
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        &evidence_refs,
        "continue",
        "Artifact-backed evidence must resolve to authoritative artifacts.",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "non-authoritative evidence refs should fail closed",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("evaluation_evidence_artifact_ref_unresolved"))),
            "{command_name} should reject artifact-backed evidence refs that do not resolve in authoritative artifacts, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_evaluator_reject_stray_fingerprint_named_artifacts_for_evidence_refs() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-task3-evidence-ref-stray-fingerprint-file");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/evidence-ref-authority-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test evidence for the active contract criterion.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let stray_artifact_fingerprint =
        "2222222222222222222222222222222222222222222222222222222222222222";
    let stray_artifact_name = format!("stray-{stray_artifact_fingerprint}.md");
    let stray_artifact_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &stray_artifact_name,
    );
    write_file(
        &stray_artifact_path,
        "# Stray artifact\n\nThis file is not a verified authoritative execution artifact.\n",
    );

    let evaluation_rel =
        "docs/featureforge/execution-evidence/stray-fingerprint-evidence-ref-eval.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes but references a stray fingerprint-named file.
**Evidence Refs:**
- evidence-ref-1
**Severity:** low
"#;
    let evidence_refs = format!(
        r#"### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-1
**Kind:** test_result
**Source:** test_artifact:{stray_artifact_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-1
**Summary:** Intentionally references a stray fingerprint-named markdown file.
"#
    );
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        &evidence_refs,
        "continue",
        "Artifact-backed evidence must not resolve against stray fingerprint-named files.",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "stray fingerprint-named files should not satisfy authoritative evidence resolution",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("evaluation_evidence_artifact_ref_unresolved"))),
            "{command_name} should reject artifact-backed evidence refs that only resolve by stray fingerprint-named files, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_evaluator_reject_hand_authored_public_artifact_shaped_files_for_evidence_refs()
 {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-task3-evidence-ref-hand-authored-public-shape");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/evidence-ref-authority-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test evidence for the active contract criterion.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let forged_source = r#"# Hand Authored Stray

**Report Fingerprint:** __REPORT_FINGERPRINT__

This file is self-consistent but not a valid authoritative evaluation report artifact.
"#;
    let forged_fingerprint =
        canonical_fingerprint_without_header_value(forged_source, "Report Fingerprint");
    let forged_artifact_name = format!("evaluation-{forged_fingerprint}.md");
    let forged_artifact_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &forged_artifact_name,
    );
    write_file(
        &forged_artifact_path,
        &forged_source.replace("__REPORT_FINGERPRINT__", &forged_fingerprint),
    );

    let evaluation_rel =
        "docs/featureforge/execution-evidence/hand-authored-public-shaped-evidence-ref-eval.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes but references a hand-authored public-artifact-shaped file.
**Evidence Refs:**
- evidence-ref-1
**Severity:** low
"#;
    let evidence_refs = format!(
        r#"### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-1
**Kind:** test_result
**Source:** test_artifact:{forged_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-1
**Summary:** Intentionally references a hand-authored self-consistent evaluation-named file.
"#
    );
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        &evidence_refs,
        "continue",
        "Hand-authored public-artifact-shaped files must not satisfy artifact-backed evidence refs.",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "hand-authored public-artifact-shaped files should not satisfy authoritative evidence resolution",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("evaluation_evidence_artifact_ref_unresolved"))),
            "{command_name} should reject hand-authored public-artifact-shaped files for artifact-backed evidence refs, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_evaluator_accept_verified_authoritative_contract_artifacts_for_evidence_refs()
 {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-evidence-ref-verified-contract");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/evidence-ref-authority-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-1
**Kind:** artifact_ref
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require artifact_ref evidence for the active contract criterion.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let evaluation_rel =
        "docs/featureforge/execution-evidence/verified-contract-evidence-ref-eval.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes with a verified authoritative contract artifact evidence ref.
**Evidence Refs:**
- evidence-ref-1
**Severity:** low
"#;
    let evidence_refs = format!(
        r#"### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-1
**Kind:** artifact_ref
**Source:** artifact:{contract_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-1
**Summary:** Resolves to a verified authoritative contract artifact fingerprint.
"#
    );
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        &evidence_refs,
        "continue",
        "Verified authoritative contract artifacts must satisfy artifact-backed evidence refs.",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "verified authoritative contract artifact evidence ref should pass",
        );
        assert_eq!(json["allowed"], Value::Bool(true));
    }
}

#[test]
fn task3_gate_and_record_evaluator_reject_kind_specific_locators_for_mismatched_authoritative_evidence_kinds()
 {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-task3-evidence-ref-kind-specific-evidence-kind-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel =
        "docs/featureforge/execution-evidence/evidence-ref-kind-specific-kind-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-test
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test_result evidence for kind-specific evidence-artifact validation.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let authoritative_evidence_rel =
        "docs/featureforge/execution-evidence/evidence-ref-kind-specific-browser-artifact.md";
    let authoritative_evidence_fingerprint = write_execution_evidence_artifact_custom(
        repo,
        authoritative_evidence_rel,
        "browser_capture",
        "browser_artifact:tests/screenshots/runtime-hardening.png",
        "featureforge:executing-plans",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evidence-{authoritative_evidence_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(authoritative_evidence_rel))
            .expect("source evidence artifact fixture should remain readable"),
    );

    let evaluation_rel = "docs/featureforge/execution-evidence/evidence-ref-kind-specific-evidence-kind-mismatch-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes but test_artifact locator points at a browser_capture evidence artifact.
**Evidence Refs:**
- evidence-ref-test
**Severity:** low
"#;
    let evidence_refs = format!(
        r#"### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-test
**Kind:** test_result
**Source:** test_artifact:{authoritative_evidence_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-test
**Summary:** Intentionally points test_artifact locator at an authoritative evidence artifact with Evidence Kind browser_capture.
"#
    );
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        23,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        &evidence_refs,
        "continue",
        "Kind-specific locators must match the authoritative evidence artifact Evidence Kind.",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "kind-specific evidence kind mismatch should fail closed",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("evaluation_evidence_artifact_ref_unresolved"))),
            "{command_name} should reject kind-specific artifact locators when authoritative evidence artifact kind mismatches, got {json}"
        );
    }
}

#[test]
fn task3_gate_and_record_evaluator_reject_kind_specific_locators_for_wrong_authoritative_artifact_family()
 {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-task3-evidence-ref-kind-specific-family-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel = "docs/featureforge/execution-evidence/evidence-ref-kind-contract.md";
    let evidence_requirements = r#"### Evidence Requirement 1
**Evidence Requirement ID:** evidence-test
**Kind:** test_result
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require test_result evidence for fail-closed artifact family validation.
### Evidence Requirement 2
**Evidence Requirement ID:** evidence-command
**Kind:** command_output
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require command_output evidence for fail-closed artifact family validation.
### Evidence Requirement 3
**Evidence Requirement ID:** evidence-browser
**Kind:** browser_capture
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Satisfaction Rule:** all_of
**Notes:** Require browser_capture evidence for fail-closed artifact family validation.
"#;
    let contract_fingerprint = write_execution_contract_artifact_custom(
        repo,
        contract_rel,
        17,
        evidence_requirements,
        2,
        2,
        None,
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &["spec_compliance"],
        false,
    );

    let authoritative_evaluation_rel =
        "docs/featureforge/execution-evidence/evidence-ref-kind-source-evaluation.md";
    let authoritative_evaluation_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        authoritative_evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "pass",
        "[]",
        &[],
        "[]",
        "continue",
        "Verified authoritative evaluation artifact used as wrong-family evidence locator target.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{authoritative_evaluation_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(authoritative_evaluation_rel))
            .expect("source evaluation fixture should remain readable"),
    );

    let authoritative_handoff_rel =
        "docs/featureforge/execution-evidence/evidence-ref-kind-source-handoff.md";
    let authoritative_handoff_fingerprint = write_execution_handoff_artifact_custom!(
        repo,
        authoritative_handoff_rel,
        &contract_fingerprint,
        21,
        &["criterion-1"],
        &[],
        &[],
        "Resume downstream final-review and finish gates.",
        "Verified authoritative handoff artifact used as wrong-family evidence locator target.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("handoff-{authoritative_handoff_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(authoritative_handoff_rel))
            .expect("source handoff fixture should remain readable"),
    );

    let evaluation_rel =
        "docs/featureforge/execution-evidence/evidence-ref-kind-family-mismatch-evaluation.md";
    let criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Criterion passes but uses kind-specific locators against wrong authoritative artifact families.
**Evidence Refs:**
- evidence-ref-test
- evidence-ref-command
- evidence-ref-browser
**Severity:** low
"#;
    let evidence_refs = format!(
        r#"### Evidence Ref 1
**Evidence Ref ID:** evidence-ref-test
**Kind:** test_result
**Source:** test_artifact:{contract_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-test
**Summary:** Intentionally points test_artifact locator at a verified authoritative contract fingerprint.
### Evidence Ref 2
**Evidence Ref ID:** evidence-ref-command
**Kind:** command_output
**Source:** command_artifact:{authoritative_evaluation_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-command
**Summary:** Intentionally points command_artifact locator at a verified authoritative evaluation fingerprint.
### Evidence Ref 3
**Evidence Ref ID:** evidence-ref-browser
**Kind:** browser_capture
**Source:** browser_artifact:{authoritative_handoff_fingerprint}
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Evidence Requirement IDs:**
- evidence-browser
**Summary:** Intentionally points browser_artifact locator at a verified authoritative handoff fingerprint.
"#
    );
    write_execution_evaluation_artifact_custom!(
        repo,
        evaluation_rel,
        &contract_fingerprint,
        "spec_compliance",
        23,
        "pass",
        criterion_results,
        &["Task 1 Step 1"],
        &evidence_refs,
        "continue",
        "Kind-specific locator families must fail closed against wrong authoritative artifact families.",
        None,
    );

    for command_name in ["gate-evaluator", "record-evaluation"] {
        let json = run_rust_json(
            repo,
            state,
            &[
                command_name,
                "--plan",
                PLAN_REL,
                "--evaluation",
                evaluation_rel,
            ],
            "kind-specific locator family mismatch should fail closed",
        );
        assert_eq!(json["allowed"], Value::Bool(false));
        assert!(
            json["reason_codes"].as_array().is_some_and(|codes| codes
                .iter()
                .any(|code| code.as_str() == Some("evaluation_evidence_artifact_ref_unresolved"))),
            "{command_name} should reject kind-specific artifact locators that resolve to wrong authoritative artifact families, got {json}"
        );
    }
}

#[test]
fn task3_record_evaluation_preserves_unresolved_criteria_across_non_passing_evaluators() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-open-criteria-union");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    let packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let contract_rel = "docs/featureforge/execution-evidence/multi-evaluator-contract.md";
    let contract_source = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Spec compliance criterion
**Description:** Failing criterion for spec compliance.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Fail-first criterion.

### Criterion 2
**Criterion ID:** criterion-2
**Title:** Code quality criterion
**Description:** Failing criterion for code quality.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- code_quality
**Threshold:** all
**Notes:** Fail-second criterion.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance
- code_quality

**Evidence Requirements:**
[]

**Retry Budget:** 3
**Pivot Threshold:** 3
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let contract_fingerprint = sha256_hex(
        contract_source
            .replace("__CONTRACT_FINGERPRINT__", "")
            .as_bytes(),
    );
    write_file(
        &repo.join(contract_rel),
        &contract_source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance", "code_quality"],
        &["spec_compliance", "code_quality"],
        false,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 17,
            "active_contract_path": format!("contract-{contract_fingerprint}.md"),
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance", "code_quality"],
            "completed_evaluator_kinds": [],
            "pending_evaluator_kinds": ["spec_compliance", "code_quality"],
            "non_passing_evaluator_kinds": [],
            "aggregate_evaluation_state": "pending",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 3,
            "handoff_required": false,
            "open_failed_criteria": []
        }),
    );

    let first_eval_rel = "docs/featureforge/execution-evidence/spec-fail-eval.md";
    let first_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Spec compliance failed for criterion-1.
**Evidence Refs:**
[]
**Severity:** high
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        first_eval_rel,
        &contract_fingerprint,
        "spec_compliance",
        18,
        "fail",
        first_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "repair",
        "First evaluator reports criterion-1 as unresolved.",
        None,
    );
    let first_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            first_eval_rel,
        ],
        "first evaluator fail should record",
    );
    assert_eq!(first_json["allowed"], Value::Bool(true));

    let second_eval_rel = "docs/featureforge/execution-evidence/code-fail-eval.md";
    let second_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-2
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Code quality failed for criterion-2.
**Evidence Refs:**
[]
**Severity:** high
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        second_eval_rel,
        &contract_fingerprint,
        "code_quality",
        19,
        "fail",
        second_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "repair",
        "Second evaluator reports criterion-2 as unresolved.",
        None,
    );
    let second_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            second_eval_rel,
        ],
        "second evaluator fail should preserve unresolved criteria",
    );
    assert_eq!(second_json["allowed"], Value::Bool(true));

    let persisted: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after second non-passing evaluation"),
    )
    .expect("harness state should remain valid json after second non-passing evaluation");
    let mut open_failed = persisted["open_failed_criteria"]
        .as_array()
        .expect("open_failed_criteria should remain an array")
        .iter()
        .map(|value| {
            value
                .as_str()
                .expect("open_failed_criteria values should remain strings")
                .to_owned()
        })
        .collect::<Vec<_>>();
    open_failed.sort();
    assert_eq!(
        open_failed,
        vec![String::from("criterion-1"), String::from("criterion-2")],
        "record-evaluation must preserve unresolved criteria union across non-passing evaluators"
    );

    let third_eval_rel = "docs/featureforge/execution-evidence/spec-pass-after-code-fail-eval.md";
    let third_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Spec compliance recovered for criterion-1.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        third_eval_rel,
        &contract_fingerprint,
        "spec_compliance",
        20,
        "pass",
        third_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Spec compliance recovery should clear only its own unresolved criteria.",
        None,
    );
    let third_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            third_eval_rel,
        ],
        "third evaluator pass should clear resolved criteria without clearing other unresolved criteria",
    );
    assert_eq!(third_json["allowed"], Value::Bool(true));

    let persisted_after_recovery: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after mixed recovery evaluation"),
    )
    .expect("harness state should remain valid json after mixed recovery evaluation");
    let mut open_failed_after_recovery = persisted_after_recovery["open_failed_criteria"]
        .as_array()
        .expect("open_failed_criteria should remain an array after mixed recovery")
        .iter()
        .map(|value| {
            value
                .as_str()
                .expect("open_failed_criteria values should remain strings after mixed recovery")
                .to_owned()
        })
        .collect::<Vec<_>>();
    open_failed_after_recovery.sort();
    assert_eq!(
        open_failed_after_recovery,
        vec![String::from("criterion-2")],
        "record-evaluation should clear recovered criteria while preserving unresolved criteria from other non-passing evaluators"
    );
    assert_eq!(
        persisted_after_recovery["non_passing_evaluator_kinds"],
        json!(["code_quality"]),
        "record-evaluation should clear recovered evaluators from non_passing_evaluator_kinds while preserving still non-passing evaluators"
    );
    assert_eq!(
        persisted_after_recovery["aggregate_evaluation_state"], "fail",
        "record-evaluation should keep aggregate_evaluation_state fail while another evaluator remains fail"
    );
    assert!(
        matches!(
            persisted_after_recovery["harness_phase"].as_str(),
            Some("repairing" | "pivot_required")
        ),
        "record-evaluation should keep harness_phase aligned with remaining fail evaluator state after mixed recovery, got {}",
        persisted_after_recovery["harness_phase"]
    );
    assert_eq!(
        persisted_after_recovery["handoff_required"],
        Value::Bool(false),
        "record-evaluation should not require handoff while remaining non-passing evaluators are fail-only"
    );
}

#[test]
fn task3_record_evaluation_mixed_recovery_keeps_blocked_phase_and_handoff_required() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-open-criteria-mixed-blocked");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    let packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let contract_rel = "docs/featureforge/execution-evidence/multi-evaluator-blocked-contract.md";
    let contract_source = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Spec compliance criterion
**Description:** Blocked criterion for spec compliance.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Blocked-first criterion.

### Criterion 2
**Criterion ID:** criterion-2
**Title:** Code quality criterion
**Description:** Blocked criterion for code quality.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- code_quality
**Threshold:** all
**Notes:** Blocked-second criterion.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance
- code_quality

**Evidence Requirements:**
[]

**Retry Budget:** 3
**Pivot Threshold:** 3
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let contract_fingerprint = sha256_hex(
        contract_source
            .replace("__CONTRACT_FINGERPRINT__", "")
            .as_bytes(),
    );
    write_file(
        &repo.join(contract_rel),
        &contract_source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    write_harness_state_fixture!(
        repo,
        state,
        "evaluating",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance", "code_quality"],
        &[],
        true,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "evaluating",
            "latest_authoritative_sequence": 19,
            "active_contract_path": format!("contract-{contract_fingerprint}.md"),
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance", "code_quality"],
            "completed_evaluator_kinds": ["spec_compliance", "code_quality"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": ["spec_compliance", "code_quality"],
            "aggregate_evaluation_state": "blocked",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 3,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-1", "criterion-2"]
        }),
    );

    let recovery_eval_rel =
        "docs/featureforge/execution-evidence/spec-pass-after-code-blocked-eval.md";
    let recovery_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Spec compliance recovered for criterion-1 while code_quality remains blocked.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        recovery_eval_rel,
        &contract_fingerprint,
        "spec_compliance",
        20,
        "pass",
        recovery_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Spec recovery should keep blocked aggregate state when another evaluator remains blocked.",
        None,
    );

    let recovery_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            recovery_eval_rel,
        ],
        "mixed recovery should preserve blocked state while another evaluator remains blocked",
    );
    assert_eq!(recovery_json["allowed"], Value::Bool(true));

    let persisted_after_recovery: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after blocked mixed recovery evaluation"),
    )
    .expect("harness state should remain valid json after blocked mixed recovery evaluation");
    let mut open_failed_after_recovery = persisted_after_recovery["open_failed_criteria"]
        .as_array()
        .expect("open_failed_criteria should remain an array after blocked mixed recovery")
        .iter()
        .map(|value| {
            value
                .as_str()
                .expect("open_failed_criteria values should remain strings after blocked mixed recovery")
                .to_owned()
        })
        .collect::<Vec<_>>();
    open_failed_after_recovery.sort();
    assert_eq!(
        open_failed_after_recovery,
        vec![String::from("criterion-2")],
        "record-evaluation should clear recovered criteria while preserving unresolved blocked criteria from other evaluators"
    );
    assert_eq!(
        persisted_after_recovery["non_passing_evaluator_kinds"],
        json!(["code_quality"]),
        "record-evaluation should preserve blocked evaluators in non_passing_evaluator_kinds after mixed recovery"
    );
    assert_eq!(
        persisted_after_recovery["aggregate_evaluation_state"], "blocked",
        "record-evaluation should keep aggregate_evaluation_state blocked while another evaluator remains blocked"
    );
    assert_eq!(
        persisted_after_recovery["harness_phase"], "handoff_required",
        "record-evaluation should keep harness_phase handoff_required while another evaluator remains blocked"
    );
    assert_eq!(
        persisted_after_recovery["handoff_required"],
        Value::Bool(true),
        "record-evaluation should keep handoff_required true while another evaluator remains blocked"
    );
}

#[test]
fn task3_record_evaluation_legacy_mixed_recovery_degrades_to_fail_phase() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-legacy-mixed-recovery");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    let packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let contract_rel = "docs/featureforge/execution-evidence/legacy-mixed-recovery-contract.md";
    let contract_source = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Spec compliance criterion
**Description:** Criterion tracked by spec_compliance.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** First evaluator criterion.

### Criterion 2
**Criterion ID:** criterion-2
**Title:** Code quality criterion
**Description:** Criterion tracked by code_quality.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- code_quality
**Threshold:** all
**Notes:** Second evaluator criterion.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance
- code_quality

**Evidence Requirements:**
[]

**Retry Budget:** 3
**Pivot Threshold:** 3
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let contract_fingerprint = sha256_hex(
        contract_source
            .replace("__CONTRACT_FINGERPRINT__", "")
            .as_bytes(),
    );
    write_file(
        &repo.join(contract_rel),
        &contract_source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    write_harness_state_fixture!(
        repo,
        state,
        "repairing",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance", "code_quality"],
        &[],
        true,
    );

    // Legacy payload: only non_passing_evaluator_kinds is present and mixes fail + blocked state.
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "repairing",
            "latest_authoritative_sequence": 19,
            "active_contract_path": format!("contract-{contract_fingerprint}.md"),
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance", "code_quality"],
            "completed_evaluator_kinds": ["spec_compliance", "code_quality"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": ["spec_compliance", "code_quality"],
            "aggregate_evaluation_state": "blocked",
            "last_evaluation_evaluator_kind": "spec_compliance",
            "last_evaluation_verdict": "blocked",
            "current_chunk_retry_count": 1,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 3,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-1", "criterion-2"]
        }),
    );

    let historical_fail_rel =
        "docs/featureforge/execution-evidence/legacy-code-fail-before-mixed-state.md";
    let historical_fail_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-2
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Legacy code_quality evaluator failed before blocked handoff.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let historical_fail_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        historical_fail_rel,
        &contract_fingerprint,
        "code_quality",
        18,
        "fail",
        historical_fail_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "repair",
        "Legacy mixed state history includes a failed code_quality evaluator verdict.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{historical_fail_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(historical_fail_rel))
            .expect("historical fail evaluation fixture should be readable"),
    );

    let historical_blocked_rel =
        "docs/featureforge/execution-evidence/legacy-spec-blocked-before-mixed-state.md";
    let historical_blocked_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** blocked
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Legacy spec_compliance evaluator remained blocked before recovery.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let historical_blocked_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        historical_blocked_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "blocked",
        historical_blocked_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "handoff",
        "Legacy mixed state history includes a blocked spec_compliance evaluator verdict.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{historical_blocked_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(historical_blocked_rel))
            .expect("historical blocked evaluation fixture should be readable"),
    );

    let recovery_eval_rel =
        "docs/featureforge/execution-evidence/legacy-spec-pass-after-mixed-state.md";
    let recovery_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Legacy blocked evaluator recovered while another legacy failed evaluator remains.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        recovery_eval_rel,
        &contract_fingerprint,
        "spec_compliance",
        20,
        "pass",
        recovery_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Legacy mixed state should degrade to fail once blocked evaluator recovers.",
        None,
    );

    let recovery_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            recovery_eval_rel,
        ],
        "legacy mixed recovery should degrade from blocked to fail when only failed evaluator remains",
    );
    assert_eq!(recovery_json["allowed"], Value::Bool(true));

    let persisted_after_recovery: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after legacy mixed recovery evaluation"),
    )
    .expect("harness state should remain valid json after legacy mixed recovery evaluation");
    assert_eq!(
        persisted_after_recovery["open_failed_criteria"],
        json!(["criterion-2"]),
        "record-evaluation should clear recovered criteria while preserving unresolved criteria for the remaining failed evaluator"
    );
    assert_eq!(
        persisted_after_recovery["non_passing_evaluator_kinds"],
        json!(["code_quality"]),
        "legacy mixed recovery should keep only unresolved evaluator kinds in non_passing_evaluator_kinds"
    );
    assert_eq!(
        persisted_after_recovery["failed_evaluator_kinds"],
        json!(["code_quality"]),
        "legacy mixed recovery should bootstrap remaining unresolved evaluator as failed once blocked evaluator has recovered"
    );
    assert_eq!(
        persisted_after_recovery["blocked_evaluator_kinds"],
        json!([]),
        "legacy mixed recovery should clear blocked evaluator bucket when blocked evaluator recovers"
    );
    assert_eq!(
        persisted_after_recovery["aggregate_evaluation_state"], "fail",
        "legacy mixed recovery should degrade aggregate_evaluation_state to fail when only failed evaluators remain"
    );
    assert_eq!(
        persisted_after_recovery["harness_phase"], "repairing",
        "legacy mixed recovery should route harness_phase to repairing when retry threshold has not been exhausted"
    );
    assert_eq!(
        persisted_after_recovery["handoff_required"],
        Value::Bool(false),
        "legacy mixed recovery should clear handoff_required when blocked evaluators are fully recovered"
    );
}

#[test]
fn task3_record_evaluation_legacy_bootstrap_ignores_unverified_and_future_history_entries() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-legacy-bootstrap-poisoning");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    let packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let contract_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-poisoning-contract.md";
    let contract_source = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Spec compliance criterion
**Description:** Criterion tracked by spec_compliance.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** First evaluator criterion.

### Criterion 2
**Criterion ID:** criterion-2
**Title:** Code quality criterion
**Description:** Criterion tracked by code_quality.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- code_quality
**Threshold:** all
**Notes:** Second evaluator criterion.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance
- code_quality

**Evidence Requirements:**
[]

**Retry Budget:** 3
**Pivot Threshold:** 3
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let contract_fingerprint = sha256_hex(
        contract_source
            .replace("__CONTRACT_FINGERPRINT__", "")
            .as_bytes(),
    );
    write_file(
        &repo.join(contract_rel),
        &contract_source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    write_harness_state_fixture!(
        repo,
        state,
        "repairing",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance", "code_quality"],
        &[],
        true,
    );

    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "repairing",
            "latest_authoritative_sequence": 19,
            "active_contract_path": format!("contract-{contract_fingerprint}.md"),
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance", "code_quality"],
            "completed_evaluator_kinds": ["spec_compliance", "code_quality"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": ["spec_compliance", "code_quality"],
            "aggregate_evaluation_state": "blocked",
            "last_evaluation_evaluator_kind": "spec_compliance",
            "last_evaluation_verdict": "blocked",
            "current_chunk_retry_count": 1,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 3,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-1", "criterion-2"]
        }),
    );

    let historical_fail_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-code-fail-history.md";
    let historical_fail_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-2
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Historical code_quality evaluator failed.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let historical_fail_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        historical_fail_rel,
        &contract_fingerprint,
        "code_quality",
        18,
        "fail",
        historical_fail_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "repair",
        "Historical verdict for code_quality is fail.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{historical_fail_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(historical_fail_rel))
            .expect("historical fail evaluation fixture should be readable"),
    );

    let historical_blocked_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-spec-blocked-history.md";
    let historical_blocked_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** blocked
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Historical spec_compliance evaluator remained blocked.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let historical_blocked_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        historical_blocked_rel,
        &contract_fingerprint,
        "spec_compliance",
        19,
        "blocked",
        historical_blocked_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "handoff",
        "Historical verdict for spec_compliance is blocked.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{historical_blocked_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(historical_blocked_rel))
            .expect("historical blocked evaluation fixture should be readable"),
    );

    let poisoned_non_harness_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-poisoned-non-harness.md";
    let poisoned_non_harness_results = r#"### Criterion Result 1
**Criterion ID:** criterion-2
**Status:** blocked
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Poisoned non-harness evaluation should be ignored by legacy bootstrap.
**Evidence Refs:**
[]
**Severity:** high
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        poisoned_non_harness_rel,
        &contract_fingerprint,
        "code_quality",
        19,
        "blocked",
        poisoned_non_harness_results,
        &["Task 1 Step 1"],
        "[]",
        "handoff",
        "Poisoned non-harness artifact should not influence legacy bootstrap.",
        None,
    );
    rewrite_artifact_generated_by_with_canonical_fingerprint(
        repo,
        poisoned_non_harness_rel,
        "manual:operator",
        "Report Fingerprint",
    );
    let poisoned_non_harness_source = fs::read_to_string(repo.join(poisoned_non_harness_rel))
        .expect("poisoned non-harness evaluation fixture should be readable");
    let poisoned_non_harness_fingerprint = canonical_fingerprint_without_header_value(
        &poisoned_non_harness_source,
        "Report Fingerprint",
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{poisoned_non_harness_fingerprint}.md"),
        ),
        &poisoned_non_harness_source,
    );

    let poisoned_future_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-poisoned-future-sequence.md";
    let poisoned_future_results = r#"### Criterion Result 1
**Criterion ID:** criterion-2
**Status:** blocked
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Future-sequence evaluation should be ignored by legacy bootstrap.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let poisoned_future_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        poisoned_future_rel,
        &contract_fingerprint,
        "code_quality",
        41,
        "blocked",
        poisoned_future_results,
        &["Task 1 Step 1"],
        "[]",
        "handoff",
        "Future-sequence artifact should not influence legacy bootstrap.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{poisoned_future_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(poisoned_future_rel))
            .expect("poisoned future-sequence evaluation fixture should be readable"),
    );

    let recovery_eval_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-spec-pass-recovery.md";
    let recovery_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Blocked spec evaluator recovered while failed code evaluator remains.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        recovery_eval_rel,
        &contract_fingerprint,
        "spec_compliance",
        20,
        "pass",
        recovery_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Legacy bootstrap should ignore poisoned history and degrade to fail.",
        None,
    );

    let recovery_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            recovery_eval_rel,
        ],
        "legacy bootstrap poisoning should not prevent fail-phase degradation",
    );
    assert_eq!(recovery_json["allowed"], Value::Bool(true));

    let persisted_after_recovery: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state)).expect(
            "harness state should remain readable after poisoned legacy bootstrap recovery",
        ),
    )
    .expect("harness state should remain valid json after poisoned legacy bootstrap recovery");
    assert_eq!(
        persisted_after_recovery["open_failed_criteria"],
        json!(["criterion-2"]),
        "record-evaluation should keep unresolved failed criteria for the remaining failed evaluator"
    );
    assert_eq!(
        persisted_after_recovery["non_passing_evaluator_kinds"],
        json!(["code_quality"]),
        "legacy bootstrap should keep only the unresolved failed evaluator after poisoned artifacts are ignored"
    );
    assert_eq!(
        persisted_after_recovery["failed_evaluator_kinds"],
        json!(["code_quality"]),
        "legacy bootstrap should classify the remaining unresolved evaluator as failed"
    );
    assert_eq!(
        persisted_after_recovery["blocked_evaluator_kinds"],
        json!([]),
        "legacy bootstrap should not retain blocked evaluator buckets from poisoned history"
    );
    assert_eq!(
        persisted_after_recovery["aggregate_evaluation_state"], "fail",
        "legacy bootstrap should degrade aggregate state to fail when only failed evaluators remain"
    );
    assert_eq!(
        persisted_after_recovery["harness_phase"], "repairing",
        "legacy bootstrap should route phase to repairing after ignoring poisoned blocked history"
    );
    assert_eq!(
        persisted_after_recovery["handoff_required"],
        Value::Bool(false),
        "legacy bootstrap should clear handoff_required once poisoned blocked history is ignored"
    );
}

#[test]
fn task3_record_evaluation_legacy_bootstrap_treats_equal_sequence_conflicts_as_ambiguous() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-legacy-bootstrap-equal-sequence");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let contract_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-equal-sequence-contract.md";
    let contract_fingerprint = write_execution_contract_artifact(repo, contract_rel, None);
    write_harness_state_fixture!(
        repo,
        state,
        "repairing",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance"],
        &[],
        true,
    );
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "repairing",
            "latest_authoritative_sequence": 19,
            "active_contract_path": format!("contract-{contract_fingerprint}.md"),
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance"],
            "completed_evaluator_kinds": ["spec_compliance"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": ["code_quality"],
            "aggregate_evaluation_state": "blocked",
            "last_evaluation_evaluator_kind": "code_quality",
            "last_evaluation_verdict": "blocked",
            "current_chunk_retry_count": 0,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 3,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-legacy"]
        }),
    );

    let conflict_fail_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-equal-sequence-code-fail.md";
    let conflict_fail_results = r#"### Criterion Result 1
**Criterion ID:** criterion-legacy
**Status:** fail
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Equal-sequence conflict candidate with fail verdict.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let conflict_fail_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        conflict_fail_rel,
        &contract_fingerprint,
        "code_quality",
        19,
        "fail",
        conflict_fail_results,
        &["Task 1 Step 1"],
        "[]",
        "repair",
        "Equal-sequence conflict candidate: fail verdict.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{conflict_fail_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(conflict_fail_rel))
            .expect("conflicting fail evaluation fixture should be readable"),
    );

    let conflict_pass_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-equal-sequence-code-pass.md";
    let conflict_pass_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        conflict_pass_rel,
        &contract_fingerprint,
        "code_quality",
        19,
        "pass",
        "[]",
        &[],
        "[]",
        "continue",
        "Equal-sequence conflict candidate: pass verdict.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{conflict_pass_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(conflict_pass_rel))
            .expect("conflicting pass evaluation fixture should be readable"),
    );

    let recovery_eval_rel =
        "docs/featureforge/execution-evidence/legacy-bootstrap-equal-sequence-spec-pass.md";
    let recovery_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Spec evaluator recovered after equal-sequence conflict.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        recovery_eval_rel,
        &contract_fingerprint,
        "spec_compliance",
        20,
        "pass",
        recovery_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Equal-sequence conflicts should force conservative legacy bootstrap fallback.",
        None,
    );

    let recovery_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            recovery_eval_rel,
        ],
        "equal-sequence legacy conflict should fail closed",
    );
    assert_eq!(recovery_json["allowed"], Value::Bool(true));

    let persisted_after_recovery: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after equal-sequence conflict recovery"),
    )
    .expect("harness state should remain valid json after equal-sequence conflict recovery");
    assert_eq!(
        persisted_after_recovery["non_passing_evaluator_kinds"],
        json!(["code_quality"]),
        "equal-sequence evaluator conflicts should leave unresolved evaluator in non_passing_evaluator_kinds via conservative fallback"
    );
    assert_eq!(
        persisted_after_recovery["failed_evaluator_kinds"],
        json!([]),
        "equal-sequence evaluator conflicts should not classify unresolved evaluators as failed during conservative fallback"
    );
    assert_eq!(
        persisted_after_recovery["blocked_evaluator_kinds"],
        json!(["code_quality"]),
        "equal-sequence evaluator conflicts should classify unresolved evaluators as blocked during conservative fallback"
    );
    assert_eq!(
        persisted_after_recovery["aggregate_evaluation_state"], "blocked",
        "equal-sequence evaluator conflicts should preserve blocked aggregate state during conservative fallback"
    );
    assert_eq!(
        persisted_after_recovery["harness_phase"], "handoff_required",
        "equal-sequence evaluator conflicts should preserve handoff_required harness phase during conservative fallback"
    );
    assert_eq!(
        persisted_after_recovery["handoff_required"],
        Value::Bool(true),
        "equal-sequence evaluator conflicts should keep handoff_required true during conservative fallback"
    );
}

#[test]
fn task3_record_evaluation_legacy_blocked_only_with_retry_count_stays_blocked() {
    let (repo_dir, state_dir) = init_repo("plan-execution-task3-legacy-blocked-only-retry-count");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "none");

    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    let packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let contract_rel = "docs/featureforge/execution-evidence/legacy-blocked-only-contract.md";
    let contract_source = format!(
        r#"# Execution Contract

**Contract Version:** 1
**Authoritative Sequence:** 17
**Source Plan Path:** `{PLAN_REL}`
**Source Plan Revision:** 1
**Source Plan Fingerprint:** `{plan_fingerprint}`
**Source Spec Path:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Source Spec Fingerprint:** `{spec_fingerprint}`
**Source Task Packet Fingerprints:**
- `{packet_fingerprint}`
**Chunk ID:** chunk-1
**Chunking Strategy:** single_chunk
**Covered Steps:**
- Task 1 Step 1
**Requirement IDs:**
- REQ-001
**Criteria:**
### Criterion 1
**Criterion ID:** criterion-1
**Title:** Spec compliance criterion
**Description:** Criterion tracked by spec_compliance.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- spec_compliance
**Threshold:** all
**Notes:** Blocked spec criterion.

### Criterion 2
**Criterion ID:** criterion-2
**Title:** Code quality criterion
**Description:** Criterion tracked by code_quality.
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Verifier Types:**
- code_quality
**Threshold:** all
**Notes:** Blocked code criterion.

**Non Goals:**
- none

**Verifiers:**
- spec_compliance
- code_quality

**Evidence Requirements:**
[]

**Retry Budget:** 3
**Pivot Threshold:** 3
**Reset Policy:** none
**Generated By:** featureforge:executing-plans
**Generated At:** 2026-03-25T12:00:00Z
**Contract Fingerprint:** __CONTRACT_FINGERPRINT__
"#
    );
    let contract_fingerprint = sha256_hex(
        contract_source
            .replace("__CONTRACT_FINGERPRINT__", "")
            .as_bytes(),
    );
    write_file(
        &repo.join(contract_rel),
        &contract_source.replace("__CONTRACT_FINGERPRINT__", &contract_fingerprint),
    );
    write_harness_state_fixture!(
        repo,
        state,
        "repairing",
        contract_rel,
        &contract_fingerprint,
        &["spec_compliance", "code_quality"],
        &[],
        true,
    );

    let historical_blocked_spec_rel =
        "docs/featureforge/execution-evidence/legacy-blocked-spec-history.md";
    let historical_blocked_spec_results = r#"### Criterion Result 1
**Criterion ID:** criterion-1
**Status:** blocked
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Spec evaluator remains blocked.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let historical_blocked_spec_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        historical_blocked_spec_rel,
        &contract_fingerprint,
        "spec_compliance",
        18,
        "blocked",
        historical_blocked_spec_results,
        &["Task 1 Step 1"],
        "[]",
        "handoff",
        "Historical verdict for spec_compliance is blocked.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{historical_blocked_spec_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(historical_blocked_spec_rel))
            .expect("historical blocked spec evaluation fixture should be readable"),
    );

    let historical_blocked_code_rel =
        "docs/featureforge/execution-evidence/legacy-blocked-code-history.md";
    let historical_blocked_code_results = r#"### Criterion Result 1
**Criterion ID:** criterion-2
**Status:** blocked
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Code evaluator remains blocked.
**Evidence Refs:**
[]
**Severity:** high
"#;
    let historical_blocked_code_fingerprint = write_execution_evaluation_artifact_custom!(
        repo,
        historical_blocked_code_rel,
        &contract_fingerprint,
        "code_quality",
        19,
        "blocked",
        historical_blocked_code_results,
        &["Task 1 Step 1"],
        "[]",
        "handoff",
        "Historical verdict for code_quality is blocked.",
        None,
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch_name(repo),
            &format!("evaluation-{historical_blocked_code_fingerprint}.md"),
        ),
        &fs::read_to_string(repo.join(historical_blocked_code_rel))
            .expect("historical blocked code evaluation fixture should be readable"),
    );

    // Legacy payload has only non_passing_evaluator_kinds and cumulative retries from earlier repaired fail.
    write_harness_state_payload(
        repo,
        state,
        &json!({
            "schema_version": 1,
            "harness_phase": "repairing",
            "latest_authoritative_sequence": 19,
            "active_contract_path": format!("contract-{contract_fingerprint}.md"),
            "active_contract_fingerprint": contract_fingerprint,
            "required_evaluator_kinds": ["spec_compliance", "code_quality"],
            "completed_evaluator_kinds": ["spec_compliance", "code_quality"],
            "pending_evaluator_kinds": [],
            "non_passing_evaluator_kinds": ["spec_compliance", "code_quality"],
            "aggregate_evaluation_state": "blocked",
            "last_evaluation_evaluator_kind": "code_quality",
            "last_evaluation_verdict": "blocked",
            "current_chunk_retry_count": 1,
            "current_chunk_retry_budget": 3,
            "current_chunk_pivot_threshold": 3,
            "handoff_required": true,
            "open_failed_criteria": ["criterion-1", "criterion-2"]
        }),
    );

    let recovery_eval_rel =
        "docs/featureforge/execution-evidence/legacy-code-pass-after-blocked-only-state.md";
    let recovery_criterion_results = r#"### Criterion Result 1
**Criterion ID:** criterion-2
**Status:** pass
**Requirement IDs:**
- REQ-001
**Covered Steps:**
- Task 1 Step 1
**Finding:** Code evaluator recovered while spec evaluator remains blocked.
**Evidence Refs:**
[]
**Severity:** low
"#;
    write_execution_evaluation_artifact_custom!(
        repo,
        recovery_eval_rel,
        &contract_fingerprint,
        "code_quality",
        20,
        "pass",
        recovery_criterion_results,
        &["Task 1 Step 1"],
        "[]",
        "continue",
        "Blocked-only legacy state should remain blocked while another evaluator is still blocked.",
        None,
    );

    let recovery_json = run_rust_json(
        repo,
        state,
        &[
            "record-evaluation",
            "--plan",
            PLAN_REL,
            "--evaluation",
            recovery_eval_rel,
        ],
        "legacy blocked-only recovery should remain blocked when retry count is cumulative",
    );
    assert_eq!(recovery_json["allowed"], Value::Bool(true));

    let persisted_after_recovery: Value = serde_json::from_str(
        &fs::read_to_string(harness_state_file_path(repo, state))
            .expect("harness state should remain readable after blocked-only legacy recovery"),
    )
    .expect("harness state should remain valid json after blocked-only legacy recovery");
    assert_eq!(
        persisted_after_recovery["open_failed_criteria"],
        json!(["criterion-1"]),
        "record-evaluation should preserve unresolved criteria for the remaining blocked evaluator"
    );
    assert_eq!(
        persisted_after_recovery["non_passing_evaluator_kinds"],
        json!(["spec_compliance"]),
        "blocked-only legacy recovery should keep only still-blocked evaluator kinds in non_passing_evaluator_kinds"
    );
    assert_eq!(
        persisted_after_recovery["failed_evaluator_kinds"],
        json!([]),
        "blocked-only legacy recovery should not misclassify remaining blocked evaluators as failed"
    );
    assert_eq!(
        persisted_after_recovery["blocked_evaluator_kinds"],
        json!(["spec_compliance"]),
        "blocked-only legacy recovery should keep remaining blocked evaluators in blocked_evaluator_kinds"
    );
    assert_eq!(
        persisted_after_recovery["aggregate_evaluation_state"], "blocked",
        "blocked-only legacy recovery should remain blocked when another evaluator still reports blocked"
    );
    assert_eq!(
        persisted_after_recovery["harness_phase"], "handoff_required",
        "blocked-only legacy recovery should keep harness_phase handoff_required while blocked evaluators remain"
    );
    assert_eq!(
        persisted_after_recovery["handoff_required"],
        Value::Bool(true),
        "blocked-only legacy recovery should keep handoff_required true while blocked evaluators remain"
    );
}
