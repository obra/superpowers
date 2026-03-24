use assert_cmd::cargo::CommandCargoExt;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

const PLAN_REL: &str = "docs/superpowers/plans/2026-03-17-example-execution-plan.md";
const SPEC_REL: &str = "docs/superpowers/specs/2026-03-17-example-execution-plan-design.md";

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn execution_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-plan-execution")
}

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
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(repo);
    run_checked(git_config_name, "git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
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
        &repo.join("docs/superpowers/specs/2026-03-17-example-execution-plan-design-v2.md"),
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
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

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
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

- [ ] **Step 1: Repair an invalidated prior step**
- [ ] **Step 2: Finalize the execution handoff**
"#
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
- Test: `bash tests/codex-runtime/test-superpowers-plan-execution.sh`

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

fn sha256_hex(contents: &[u8]) -> String {
    let digest = Sha256::digest(contents);
    format!("{digest:x}")
}

fn evidence_rel_path() -> String {
    "docs/superpowers/execution-evidence/2026-03-17-example-execution-plan-r1-evidence.md".into()
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

        if let Some(stripped) = line.strip_prefix("- [") {
            if let Some((mark_and_step, title_suffix)) = stripped.split_once(": ") {
                if let Some((_, step_number)) = mark_and_step.split_once("] **Step ") {
                    let title = title_suffix.trim_end_matches("**");
                    output.push(format!("- [ ] **Step {step_number}: {title}**"));
                    suppress_note = current_task.is_some();
                    continue;
                }
            }
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
                "### Task {task} Step {step}\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:3{task}{step}Z\n**Execution Source:** superpowers:executing-plans\n**Task Number:** {task}\n**Step Number:** {step}\n**Packet Fingerprint:** {}\n**Head SHA:** {head_sha}\n**Base SHA:** {base_sha}\n**Claim:** Completed task {task} step {step}.\n**Files Proven:**\n- docs/example-output.md | sha256:{file_digest}\n**Verification Summary:** Manual inspection only: Verified by fixture setup.\n**Invalidation Reason:** N/A\n\n",
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
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n**Plan Fingerprint:** {plan_fingerprint}\n**Source Spec Path:** {SPEC_REL}\n**Source Spec Revision:** 1\n**Source Spec Fingerprint:** {spec_fingerprint}\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** superpowers:executing-plans\n**Task Number:** 1\n**Step Number:** 1\n**Packet Fingerprint:** {packet_fingerprint}\n**Head SHA:** {head_sha}\n**Base SHA:** {base_sha}\n**Claim:** Prepared the workspace for execution.\n**Files Proven:**\n- docs/example-output.md | sha256:{file_digest}\n**Verification Summary:** Manual inspection only: Verified by fixture setup.\n**Invalidation Reason:** N/A\n"
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
    value
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '.' | '_' | '-') {
                ch
            } else {
                '-'
            }
        })
        .collect()
}

fn repo_slug(repo: &Path) -> String {
    let repo_name = repo
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("repo");
    let digest = sha256_hex(repo.display().to_string().as_bytes());
    format!("{repo_name}-{}", &digest[..12])
}

fn project_artifact_dir(repo: &Path, state: &Path) -> PathBuf {
    state.join("projects").join(repo_slug(repo))
}

fn write_test_plan_artifact(repo: &Path, state: &Path, browser_required: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let artifact_path = project_artifact_dir(repo, state)
        .join(format!("tester-{safe_branch}-test-plan-20260322-170500.md"));
    write_file(
        &artifact_path,
        &format!(
            "# Test Plan\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Browser QA Required:** {browser_required}\n**Generated By:** superpowers:plan-eng-review\n**Generated At:** 2026-03-22T17:05:00Z\n\n## Affected Pages / Routes\n- /runtime-hardening - verify helper-backed finish gating\n",
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_qa_result_artifact(repo: &Path, state: &Path, test_plan_path: &Path) {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-test-outcome-20260322-170900.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# QA Result\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Source Test Plan:** `{}`\n**Branch:** {branch}\n**Repo:** {}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** superpowers:qa-only\n**Generated At:** 2026-03-22T17:09:00Z\n\n## Summary\n- Browser QA artifact fixture for gate-finish coverage.\n",
            test_plan_path.display(),
            repo_slug(repo)
        ),
    );
}

fn write_release_readiness_artifact(repo: &Path, state: &Path) {
    let branch = branch_name(repo);
    let safe_branch = normalize_identifier(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-release-readiness-20260322-171500.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# Release Readiness Result\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** superpowers:document-release\n**Generated At:** 2026-03-22T17:15:00Z\n\n## Summary\n- Release-readiness artifact fixture for finish-gate coverage.\n",
            repo_slug(repo)
        ),
    );
}

fn run_shell(repo: &Path, state: &Path, args: &[&str], context: &str) -> Output {
    let mut command = Command::new(execution_helper_path());
    command
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", state)
        .args(args);
    run(command, context)
}

fn run_shell_json(repo: &Path, state: &Path, args: &[&str], context: &str) -> Value {
    parse_json(&run_shell(repo, state, args, context), context)
}

fn run_rust(repo: &Path, state: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("superpowers").expect("superpowers binary should be available");
    command
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    run(command, context)
}

fn run_rust_json(repo: &Path, state: &Path, args: &[&str], context: &str) -> Value {
    parse_json(&run_rust(repo, state, args, context), context)
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
fn canonical_gate_review_returns_blocking_result_for_newer_sibling_spec() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gate-review-stale-sibling-spec");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "superpowers:executing-plans");
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
fn canonical_recommend_matches_helper_for_independent_plan() {
    let (repo_dir, state_dir) = init_repo("plan-execution-recommend");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_independent_plan(repo);

    let args = [
        "recommend",
        "--plan",
        PLAN_REL,
        "--isolated-agents",
        "available",
        "--session-intent",
        "stay",
        "--workspace-prepared",
        "yes",
    ];
    let helper = run_shell_json(repo, state, &args, "shell recommend");
    let rust = run_rust_json(repo, state, &args, "rust recommend");

    assert_eq!(rust["recommended_skill"], helper["recommended_skill"]);
    assert_eq!(rust["decision_flags"], helper["decision_flags"]);
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
fn canonical_gate_review_and_finish_match_helper() {
    let (repo_dir, state_dir) = init_repo("plan-execution-gates");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "superpowers:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_v2_completed_attempts_for_finished_plan(repo);
    let test_plan = write_test_plan_artifact(repo, state, "yes");
    write_qa_result_artifact(repo, state, &test_plan);
    write_release_readiness_artifact(repo, state);

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
    assert_eq!(rust_review["allowed"], helper_review["allowed"]);
    assert_eq!(rust_review["failure_class"], helper_review["failure_class"]);

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
    assert_eq!(rust_finish["allowed"], helper_finish["allowed"]);
    assert_eq!(rust_finish["failure_class"], helper_finish["failure_class"]);
}

#[test]
fn gate_review_warns_on_legacy_packet_provenance_in_v2_evidence() {
    let (repo_dir, state_dir) = init_repo("plan-execution-legacy-packet");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "superpowers:executing-plans");
    mark_all_plan_steps_checked(repo);
    let legacy_packet = legacy_packet_fingerprint(repo, 1, 1);
    write_single_step_v2_completed_attempt(repo, &legacy_packet);

    let gate_review = run_rust_json(
        repo,
        state,
        &["gate-review", "--plan", PLAN_REL],
        "gate review with legacy packet provenance",
    );

    assert_eq!(gate_review["allowed"], true);
    assert_eq!(gate_review["failure_class"], "");
    assert_eq!(gate_review["warning_codes"][0], "legacy_packet_provenance");
}

#[test]
fn gate_review_rejects_v2_plan_fingerprint_mismatch() {
    let (repo_dir, state_dir) = init_repo("plan-execution-plan-fingerprint-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_single_step_plan(repo, "superpowers:executing-plans");
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
    write_single_step_plan(repo, "superpowers:executing-plans");
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
    write_two_step_shared_file_plan(repo, "superpowers:executing-plans");
    write_file(&repo.join("docs/example-output.md"), "step 1\n");

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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
    write_single_step_plan(repo, "superpowers:executing-plans");
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
            "superpowers:executing-plans",
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
fn canonical_transfer_parks_active_step_and_reopens_repair_step() {
    let (repo_dir, state_dir) = init_repo("plan-execution-transfer");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "none");
    write_file(&repo.join("docs/example-output.md"), "initial output\n");

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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
    write_plan(repo, "superpowers:executing-plans");
    write_file(
        &repo.join(evidence_rel_path()),
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 2\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** superpowers:executing-plans\n**Claim:** Prepared the workspace for execution.\n**Files:**\n- docs/example-output.md\n**Verification:**\n- `bash tests/codex-runtime/test-superpowers-plan-execution.sh` -> passed in fixture setup\n**Invalidation Reason:** N/A\n"
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
fn canonical_status_rejects_whitespace_only_persisted_file_entry() {
    let (repo_dir, state_dir) = init_repo("plan-execution-whitespace-only-file-entry");
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_approved_spec(repo);
    write_plan(repo, "superpowers:executing-plans");
    write_file(
        &repo.join(evidence_rel_path()),
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** superpowers:executing-plans\n**Claim:** Prepared the workspace for execution.\n**Files:**\n-   \n**Verification:**\n- `bash tests/codex-runtime/test-superpowers-plan-execution.sh` -> passed in fixture setup\n**Invalidation Reason:** N/A\n"
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
            "superpowers:executing-plans",
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
            "superpowers:executing-plans",
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
