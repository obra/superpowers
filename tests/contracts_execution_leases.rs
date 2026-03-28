#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use assert_cmd::cargo::CommandCargoExt;
use featureforge::contracts::harness::{
    BlockingEvidenceReference, DowngradeReasonClass, ExecutionTopologyDowngradeRecord,
    WorktreeLease, WorktreeLeaseState,
};
use featureforge::execution::leases::{
    is_worktree_lease_terminal_state, validate_worktree_lease, worktree_lease_states,
};
use featureforge::execution::observability::{
    downgrade_record_is_active_guidance, downgrade_record_is_superseded_guidance,
    downgrade_records_share_rerun_guidance, validate_execution_topology_downgrade_record,
};
use featureforge::paths::branch_storage_key;
use files_support::write_file;
use json_support::parse_json;
use process_support::{run, run_checked};
use std::fs;
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
#[cfg(unix)]
use std::os::unix::fs::symlink;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

const PLAN_REL: &str = "docs/featureforge/plans/2026-03-17-example-execution-plan.md";
const SPEC_REL: &str = "docs/featureforge/specs/2026-03-17-example-execution-plan-design.md";

fn init_repo(name: &str) -> (TempDir, TempDir) {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let repo = repo_dir.path();

    run_checked(
        {
            let mut command = Command::new("git");
            command.arg("init").current_dir(repo);
            command
        },
        "git init",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["config", "user.name", "FeatureForge Test"])
                .current_dir(repo);
            command
        },
        "git config user.name",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["config", "user.email", "featureforge-tests@example.com"])
                .current_dir(repo);
            command
        },
        "git config user.email",
    );
    write_file(&repo.join("README.md"), &format!("# {name}\n"));
    run_checked(
        {
            let mut command = Command::new("git");
            command.args(["add", "README.md"]).current_dir(repo);
            command
        },
        "git add README",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command.args(["commit", "-m", "init"]).current_dir(repo);
            command
        },
        "git commit init",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "fixture-work"])
                .current_dir(repo);
            command
        },
        "git checkout fixture-work",
    );

    (repo_dir, state_dir)
}

fn write_approved_spec(repo: &Path) {
    write_file(
        &repo.join(SPEC_REL),
        r#"# Example Execution Plan Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Execution fixtures must support a valid single-task plan path for routing and finish-gate coverage.

## Summary

Fixture spec for focused execution-helper regression coverage.
"#,
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

## Execution Strategy

- Execute Task 1 last. It is the only task in this fixture and closes the execution graph for downstream review routing.

## Dependency Diagram

```text
Task 1
```

## Task 1: Single Step Task

**Spec Coverage:** REQ-001
**Task Outcome:** The workspace is prepared for execution.
**Plan Constraints:**
- Keep the fixture single-step and deterministic.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`

- [ ] **Step 1: Prepare the workspace for execution**
"#
        ),
    );
}

fn blocking_evidence_reference(value: &str) -> BlockingEvidenceReference {
    BlockingEvidenceReference::try_new(value).expect("valid blocking evidence reference")
}

fn branch_name(repo: &Path) -> String {
    let output = run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["rev-parse", "--abbrev-ref", "HEAD"])
                .current_dir(repo);
            command
        },
        "git rev-parse branch",
    );
    String::from_utf8(output.stdout)
        .expect("branch should be utf-8")
        .trim()
        .to_owned()
}

fn repo_slug(repo: &Path) -> String {
    let output = run_checked(
        {
            let mut command =
                Command::cargo_bin("featureforge").expect("featureforge binary should exist");
            command.current_dir(repo).args(["repo", "slug"]);
            command
        },
        "featureforge repo slug",
    );
    String::from_utf8(output.stdout)
        .expect("repo slug output should be utf-8")
        .lines()
        .find_map(|line| line.strip_prefix("SLUG="))
        .unwrap_or_else(|| panic!("repo slug output should include SLUG=..."))
        .to_owned()
}

fn harness_branch_dir(repo: &Path, state: &Path) -> PathBuf {
    let safe_branch = branch_storage_key(&branch_name(repo));
    state
        .join("projects")
        .join(repo_slug(repo))
        .join("branches")
        .join(safe_branch)
}

fn preflight_acceptance_state_path(repo: &Path, state: &Path) -> PathBuf {
    harness_branch_dir(repo, state)
        .join("execution-preflight")
        .join("acceptance-state.json")
}

fn run_plan_execution_json(
    repo: &Path,
    state: &Path,
    args: &[&str],
    context: &str,
) -> serde_json::Value {
    parse_json(
        &run_plan_execution_output(repo, state, args, context),
        context,
    )
}

fn run_plan_execution_output(repo: &Path, state: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    run(command, context)
}

#[cfg(unix)]
struct DirectoryModeGuard {
    path: PathBuf,
    original_permissions: fs::Permissions,
}

#[cfg(unix)]
impl DirectoryModeGuard {
    fn new(path: impl Into<PathBuf>, mode: u32) -> Self {
        let path = path.into();
        let original_permissions = fs::metadata(&path)
            .expect("directory should exist")
            .permissions();
        let mut permissions = original_permissions.clone();
        permissions.set_mode(mode);
        fs::set_permissions(&path, permissions).expect("directory permissions should update");
        Self {
            path,
            original_permissions,
        }
    }
}

#[cfg(unix)]
impl Drop for DirectoryModeGuard {
    fn drop(&mut self) {
        let _ = fs::set_permissions(&self.path, self.original_permissions.clone());
    }
}

#[test]
fn preflight_reclaims_stale_write_authority_lock_before_acceptance() {
    let (repo_dir, state_dir) = init_repo("contracts-execution-leases-reclaim");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-preflight-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-preflight-fixture",
    );

    let lock_path = harness_branch_dir(repo, state)
        .join("execution-harness")
        .join("write-authority.lock");
    let stale_pid = {
        let mut child_cmd = Command::new("sh");
        child_cmd.args(["-c", "exit 0"]);
        let mut child = child_cmd
            .spawn()
            .expect("stale write-authority fixture process should spawn");
        let pid = child.id();
        let exit_status = child
            .wait()
            .expect("stale write-authority fixture process should exit");
        assert!(
            exit_status.success(),
            "stale write-authority fixture process should exit successfully"
        );
        pid
    };
    write_file(&lock_path, &format!("pid={stale_pid}\n"));

    let acceptance_path = preflight_acceptance_state_path(repo, state);
    assert!(
        !acceptance_path.exists(),
        "preflight acceptance state should not exist before stale-lock preflight"
    );

    let gate = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "preflight should run",
    );

    assert_eq!(
        gate["allowed"], true,
        "stale write-authority locks should be reclaimed"
    );
    assert!(
        !lock_path.exists(),
        "stale write-authority lock should be removed after reclamation"
    );
    assert!(
        acceptance_path.exists(),
        "preflight should persist acceptance state after reclaiming stale write authority"
    );
}

#[test]
fn preflight_blocks_live_write_authority_conflict_without_persisting_acceptance() {
    let (repo_dir, state_dir) = init_repo("contracts-execution-leases-conflict");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-preflight-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-preflight-fixture",
    );

    let lock_path = harness_branch_dir(repo, state)
        .join("execution-harness")
        .join("write-authority.lock");
    let mut holder_cmd = Command::new("sh");
    holder_cmd.args(["-c", "sleep 30"]);
    let mut holder = holder_cmd
        .spawn()
        .expect("live write-authority fixture process should spawn");
    write_file(&lock_path, &format!("pid={}\n", holder.id()));

    let acceptance_path = preflight_acceptance_state_path(repo, state);
    assert!(
        !acceptance_path.exists(),
        "preflight acceptance state should not exist before live-lock preflight"
    );

    let gate = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "preflight should run",
    );
    let _ = holder.kill();
    let _ = holder.wait();

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes.iter().any(|code| code == "write_authority_conflict")),
        "preflight should report the write-authority conflict reason code"
    );
    assert!(
        !acceptance_path.exists(),
        "preflight must not persist acceptance state when write authority is held by a live process"
    );
}

#[cfg(unix)]
#[test]
fn status_fails_closed_when_authoritative_state_is_unreadable() {
    let (repo_dir, state_dir) = init_repo("contracts-execution-leases-status-unreadable");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-status-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-status-fixture",
    );

    let harness_dir = harness_branch_dir(repo, state);
    let state_path = harness_dir.join("state.json");
    write_file(&state_path, r#"{"harness_phase":"executing"}"#);
    let _guard = DirectoryModeGuard::new(&harness_dir, 0o000);

    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution", "status", "--plan", PLAN_REL]);
    let output = run(
        command,
        "plan execution status with unreadable authoritative state",
    );

    assert!(
        !output.status.success(),
        "status must fail closed when authoritative harness state cannot be inspected"
    );
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stderr.contains("Could not inspect authoritative harness state")
            || stdout.contains("Could not inspect authoritative harness state"),
        "status should surface the unreadable authoritative state failure"
    );
}

#[cfg(unix)]
#[test]
fn preflight_fails_closed_when_write_authority_lock_is_unreadable() {
    let (repo_dir, state_dir) = init_repo("contracts-execution-leases-lock-unreadable");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-preflight-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-preflight-fixture",
    );

    let harness_dir = harness_branch_dir(repo, state);
    let lock_path = harness_dir.join("write-authority.lock");
    write_file(&lock_path, "pid=12345\n");
    let _guard = DirectoryModeGuard::new(&harness_dir, 0o000);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "plan execution preflight with unreadable write-authority lock",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "write_authority_unavailable")),
        "unreadable write-authority lock should fail closed instead of clearing the preflight"
    );
}

#[cfg(unix)]
#[test]
fn status_fails_closed_when_authoritative_state_is_dangling_symlink() {
    let (repo_dir, state_dir) = init_repo("contracts-execution-leases-status-symlink");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-status-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-status-fixture",
    );

    let harness_dir = harness_branch_dir(repo, state).join("execution-harness");
    fs::create_dir_all(&harness_dir).expect("harness directory should be creatable");
    let state_path = harness_dir.join("state.json");
    symlink("missing-state-target.json", &state_path)
        .expect("dangling authoritative state symlink should be creatable");

    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution", "status", "--plan", PLAN_REL]);
    let output = run(
        command,
        "plan execution status with dangling authoritative state symlink",
    );

    assert!(
        !output.status.success(),
        "status must fail closed when authoritative harness state is a dangling symlink"
    );
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stderr.contains("must not be a symlink") || stdout.contains("must not be a symlink"),
        "status should surface the dangling authoritative symlink failure"
    );
}

#[cfg(unix)]
#[test]
fn preflight_fails_closed_when_write_authority_lock_is_dangling_symlink() {
    let (repo_dir, state_dir) = init_repo("contracts-execution-leases-lock-symlink");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-preflight-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-preflight-fixture",
    );

    let harness_dir = harness_branch_dir(repo, state).join("execution-harness");
    fs::create_dir_all(&harness_dir).expect("harness directory should be creatable");
    let lock_path = harness_dir.join("write-authority.lock");
    symlink("missing-lock-target.pid", &lock_path)
        .expect("dangling write-authority symlink should be creatable");

    let gate = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "plan execution preflight with dangling write-authority symlink",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "write_authority_unavailable")),
        "dangling write-authority symlink should fail closed instead of clearing the preflight"
    );
}

#[cfg(unix)]
#[test]
fn preflight_fails_closed_when_authoritative_state_is_dangling_symlink() {
    let (repo_dir, state_dir) = init_repo("contracts-execution-leases-preflight-symlink");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "none");
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["checkout", "-B", "execution-preflight-fixture"])
                .current_dir(repo);
            command
        },
        "git checkout execution-preflight-fixture",
    );

    let harness_dir = harness_branch_dir(repo, state).join("execution-harness");
    fs::create_dir_all(&harness_dir).expect("harness directory should be creatable");
    let state_path = harness_dir.join("state.json");
    symlink("missing-state-target.json", &state_path)
        .expect("dangling authoritative state symlink should be creatable");

    let gate = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "plan execution preflight with dangling authoritative state symlink",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "authoritative_state_unavailable")),
        "dangling authoritative state symlink should fail closed instead of clearing preflight"
    );
}

#[test]
fn worktree_lease_helper_exposes_closed_lifecycle_state_vocab() {
    let lifecycle_states = worktree_lease_states()
        .iter()
        .copied()
        .map(WorktreeLeaseState::as_str)
        .collect::<Vec<_>>();

    assert_eq!(
        lifecycle_states,
        vec![
            "open",
            "review_passed_pending_reconcile",
            "reconciled",
            "cleaned"
        ]
    );
    assert!(is_worktree_lease_terminal_state(
        WorktreeLeaseState::Reconciled
    ));
    assert!(is_worktree_lease_terminal_state(
        WorktreeLeaseState::Cleaned
    ));
    assert!(!is_worktree_lease_terminal_state(WorktreeLeaseState::Open));
}

#[test]
fn worktree_lease_helper_requires_reviewed_checkpoint_when_pending_reconcile() {
    let lease = WorktreeLease {
        lease_version: 1,
        authoritative_sequence: 32,
        execution_run_id: String::from("run-a"),
        execution_context_key: String::from("context-a"),
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_unit_id: String::from("task-a"),
        source_branch: String::from("feature/task-a"),
        authoritative_integration_branch: String::from("main"),
        worktree_path: String::from("/tmp/task-a"),
        repo_state_baseline_head_sha: String::from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        repo_state_baseline_worktree_fingerprint: String::from(
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ),
        lease_state: WorktreeLeaseState::ReviewPassedPendingReconcile,
        cleanup_state: String::from("pending"),
        reviewed_checkpoint_commit_sha: None,
        reconcile_result_commit_sha: None,
        reconcile_result_proof_fingerprint: None,
        reconcile_mode: String::from("identity_preserving"),
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        lease_fingerprint: String::from(
            "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        ),
    };

    let error = validate_worktree_lease(&lease)
        .expect_err("pending reconcile leases require a reviewed checkpoint commit SHA");
    assert!(
        error.message.contains("reviewed_checkpoint_commit_sha"),
        "pending reconcile validation should identify the missing reviewed checkpoint"
    );
}

#[test]
fn worktree_lease_helper_accepts_terminal_lease_state_with_reviewed_checkpoint() {
    let lease = WorktreeLease {
        lease_version: 1,
        authoritative_sequence: 32,
        execution_run_id: String::from("run-a"),
        execution_context_key: String::from("context-a"),
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_unit_id: String::from("task-a"),
        source_branch: String::from("feature/task-a"),
        authoritative_integration_branch: String::from("main"),
        worktree_path: String::from("/tmp/task-a"),
        repo_state_baseline_head_sha: String::from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        repo_state_baseline_worktree_fingerprint: String::from(
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ),
        lease_state: WorktreeLeaseState::Reconciled,
        cleanup_state: String::from("cleaned"),
        reviewed_checkpoint_commit_sha: Some(String::from(
            "dddddddddddddddddddddddddddddddddddddddd",
        )),
        reconcile_result_commit_sha: Some(String::from("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")),
        reconcile_result_proof_fingerprint: Some(String::from(
            "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        )),
        reconcile_mode: String::from("identity_preserving"),
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        lease_fingerprint: String::from(
            "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        ),
    };

    validate_worktree_lease(&lease).expect("reconciled leases with provenance should validate");
}

#[test]
fn worktree_lease_helper_rejects_terminal_lease_without_reviewed_checkpoint() {
    for lease_state in [WorktreeLeaseState::Reconciled, WorktreeLeaseState::Cleaned] {
        let lease = WorktreeLease {
            lease_version: 1,
            authoritative_sequence: 32,
            execution_run_id: String::from("run-a"),
            execution_context_key: String::from("context-a"),
            source_plan_path: PLAN_REL.to_owned(),
            source_plan_revision: 1,
            execution_unit_id: String::from("task-a"),
            source_branch: String::from("feature/task-a"),
            authoritative_integration_branch: String::from("main"),
            worktree_path: String::from("/tmp/task-a"),
            repo_state_baseline_head_sha: String::from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
            repo_state_baseline_worktree_fingerprint: String::from(
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ),
            lease_state,
            cleanup_state: String::from("cleaned"),
            reviewed_checkpoint_commit_sha: None,
            reconcile_result_commit_sha: Some(String::from(
                "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            )),
            reconcile_result_proof_fingerprint: Some(String::from(
                "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
            )),
            reconcile_mode: String::from("identity_preserving"),
            generated_by: String::from("featureforge:executing-plans"),
            generated_at: String::from("2026-03-27T21:15:21Z"),
            lease_fingerprint: String::from(
                "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
            ),
        };

        let error = validate_worktree_lease(&lease)
            .expect_err("terminal leases require reviewed checkpoint provenance");
        assert!(
            error.message.contains("reviewed_checkpoint_commit_sha"),
            "terminal lease validation should reject missing reviewed checkpoint provenance"
        );
    }
}

#[test]
fn worktree_lease_helper_rejects_terminal_lease_without_reconcile_provenance() {
    for lease_state in [WorktreeLeaseState::Reconciled, WorktreeLeaseState::Cleaned] {
        let lease = WorktreeLease {
            lease_version: 1,
            authoritative_sequence: 32,
            execution_run_id: String::from("run-a"),
            execution_context_key: String::from("context-a"),
            source_plan_path: PLAN_REL.to_owned(),
            source_plan_revision: 1,
            execution_unit_id: String::from("task-a"),
            source_branch: String::from("feature/task-a"),
            authoritative_integration_branch: String::from("main"),
            worktree_path: String::from("/tmp/task-a"),
            repo_state_baseline_head_sha: String::from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
            repo_state_baseline_worktree_fingerprint: String::from(
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ),
            lease_state,
            cleanup_state: String::from("cleaned"),
            reviewed_checkpoint_commit_sha: Some(String::from(
                "dddddddddddddddddddddddddddddddddddddddd",
            )),
            reconcile_result_commit_sha: None,
            reconcile_result_proof_fingerprint: None,
            reconcile_mode: String::from("identity_preserving"),
            generated_by: String::from("featureforge:executing-plans"),
            generated_at: String::from("2026-03-27T21:15:21Z"),
            lease_fingerprint: String::from(
                "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            ),
        };

        let error = validate_worktree_lease(&lease)
            .expect_err("terminal leases require reconcile provenance");
        assert!(
            error.message.contains("reconcile_result_commit_sha")
                || error.message.contains("reconcile_result_proof_fingerprint"),
            "terminal lease validation should reject missing reconcile provenance"
        );
    }
}

#[test]
fn downgrade_rerun_guidance_uses_primary_reason_class_only() {
    let base_record = ExecutionTopologyDowngradeRecord {
        record_version: 1,
        authoritative_sequence: 88,
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_context_key: String::from("dm/todos-task5-lease-lane:main"),
        primary_reason_class: DowngradeReasonClass::ReconcileConflict,
        detail: featureforge::contracts::harness::ExecutionTopologyDowngradeDetail {
            trigger_summary: String::from("parallel execution became unsafe"),
            affected_units: vec![String::from("task-a")],
            blocking_evidence: featureforge::contracts::harness::DowngradeBlockingEvidence {
                summary: String::from("conflict observed during reconcile"),
                references: vec![blocking_evidence_reference("artifact:lease-1")],
            },
            operator_impact: featureforge::contracts::harness::DowngradeOperatorImpact {
                severity:
                    featureforge::contracts::harness::DowngradeOperatorImpactSeverity::Blocking,
                changed_or_blocked_stage: String::from("execution"),
                expected_response: String::from("downgrade the slice"),
            },
            notes: vec![String::from("restore after proof")],
        },
        rerun_guidance_superseded: false,
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        record_fingerprint: String::from(
            "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ),
    };
    let same_class_different_detail = ExecutionTopologyDowngradeRecord {
        detail: featureforge::contracts::harness::ExecutionTopologyDowngradeDetail {
            trigger_summary: String::from("different trigger"),
            affected_units: vec![String::from("task-b")],
            blocking_evidence: featureforge::contracts::harness::DowngradeBlockingEvidence {
                summary: String::from("different evidence"),
                references: vec![blocking_evidence_reference("artifact:lease-2")],
            },
            operator_impact: featureforge::contracts::harness::DowngradeOperatorImpact {
                severity: featureforge::contracts::harness::DowngradeOperatorImpactSeverity::Info,
                changed_or_blocked_stage: String::from("review"),
                expected_response: String::from("keep working"),
            },
            notes: vec![],
        },
        record_fingerprint: String::from(
            "1111111111111111111111111111111111111111111111111111111111111111",
        ),
        ..base_record.clone()
    };
    let different_class = ExecutionTopologyDowngradeRecord {
        primary_reason_class: DowngradeReasonClass::WorkspaceUnavailable,
        ..same_class_different_detail.clone()
    };

    assert!(
        downgrade_records_share_rerun_guidance(&base_record, &same_class_different_detail),
        "rerun guidance should key on the closed primary reason class and ignore detail payload drift"
    );
    assert!(
        !downgrade_records_share_rerun_guidance(&base_record, &different_class),
        "different reason classes must not share rerun guidance"
    );
}

#[test]
fn downgrade_rerun_guidance_distinguishes_superseded_records() {
    let active = ExecutionTopologyDowngradeRecord {
        record_version: 1,
        authoritative_sequence: 88,
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_context_key: String::from("dm/todos-task5-lease-lane:main"),
        primary_reason_class: DowngradeReasonClass::ReconcileConflict,
        detail: featureforge::contracts::harness::ExecutionTopologyDowngradeDetail {
            trigger_summary: String::from("parallel execution became unsafe"),
            affected_units: vec![String::from("task-a")],
            blocking_evidence: featureforge::contracts::harness::DowngradeBlockingEvidence {
                summary: String::from("conflict observed during reconcile"),
                references: vec![blocking_evidence_reference("artifact:lease-1")],
            },
            operator_impact: featureforge::contracts::harness::DowngradeOperatorImpact {
                severity:
                    featureforge::contracts::harness::DowngradeOperatorImpactSeverity::Blocking,
                changed_or_blocked_stage: String::from("execution"),
                expected_response: String::from("downgrade the slice"),
            },
            notes: vec![],
        },
        rerun_guidance_superseded: false,
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        record_fingerprint: String::from(
            "3333333333333333333333333333333333333333333333333333333333333333",
        ),
    };
    let superseded = ExecutionTopologyDowngradeRecord {
        rerun_guidance_superseded: true,
        record_fingerprint: String::from(
            "4444444444444444444444444444444444444444444444444444444444444444",
        ),
        ..active.clone()
    };

    assert!(downgrade_record_is_active_guidance(&active));
    assert!(!downgrade_record_is_superseded_guidance(&active));
    assert!(!downgrade_record_is_active_guidance(&superseded));
    assert!(downgrade_record_is_superseded_guidance(&superseded));
    assert!(
        !downgrade_records_share_rerun_guidance(&active, &superseded),
        "superseded downgrade guidance must not participate in active rerun matching"
    );
}

#[test]
fn downgrade_rerun_guidance_persists_through_json_round_trip() {
    let record = ExecutionTopologyDowngradeRecord {
        record_version: 1,
        authoritative_sequence: 88,
        source_plan_path: PLAN_REL.to_owned(),
        source_plan_revision: 1,
        execution_context_key: String::from("dm/todos-task5-lease-lane:main"),
        primary_reason_class: DowngradeReasonClass::WorkspaceUnavailable,
        detail: featureforge::contracts::harness::ExecutionTopologyDowngradeDetail {
            trigger_summary: String::from("workspace vanished"),
            affected_units: vec![String::from("task-b")],
            blocking_evidence: featureforge::contracts::harness::DowngradeBlockingEvidence {
                summary: String::from("temporary worktree was removed"),
                references: vec![blocking_evidence_reference("lease:worktree-1")],
            },
            operator_impact: featureforge::contracts::harness::DowngradeOperatorImpact {
                severity:
                    featureforge::contracts::harness::DowngradeOperatorImpactSeverity::Warning,
                changed_or_blocked_stage: String::from("execution"),
                expected_response: String::from("recreate the workspace"),
            },
            notes: vec![String::from("recreated on retry")],
        },
        rerun_guidance_superseded: false,
        generated_by: String::from("featureforge:executing-plans"),
        generated_at: String::from("2026-03-27T21:15:21Z"),
        record_fingerprint: String::from(
            "2222222222222222222222222222222222222222222222222222222222222222",
        ),
    };
    let serialized = serde_json::to_string(&record).expect("downgrade record should serialize");
    let persisted: ExecutionTopologyDowngradeRecord =
        serde_json::from_str(&serialized).expect("downgrade record should deserialize");

    assert_eq!(
        persisted.primary_reason_class,
        DowngradeReasonClass::WorkspaceUnavailable
    );
    assert!(
        downgrade_records_share_rerun_guidance(&record, &persisted),
        "round-tripped downgrade records must keep the same rerun guidance class"
    );
    validate_execution_topology_downgrade_record(&persisted)
        .expect("round-tripped downgrade record should validate");
}
