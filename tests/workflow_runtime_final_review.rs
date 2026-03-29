#[path = "support/bin.rs"]
mod bin_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use assert_cmd::cargo::CommandCargoExt;
use bin_support::compiled_featureforge_path;
use featureforge::execution::final_review::parse_final_review_receipt;
use featureforge::paths::{
    branch_storage_key, harness_authoritative_artifact_path, harness_state_path,
};
use files_support::write_file;
use json_support::parse_json;
use process_support::{run, run_checked};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tempfile::TempDir;

const PLAN_REL: &str = "docs/featureforge/plans/2026-03-17-example-execution-plan.md";
const SPEC_REL: &str = "docs/featureforge/specs/2026-03-17-example-execution-plan-design.md";
const FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT: &str =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

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
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args([
                    "remote",
                    "add",
                    "origin",
                    &format!("git@github.com:example/{name}.git"),
                ])
                .current_dir(repo);
            command
        },
        "git remote add origin",
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

fn write_two_task_single_step_plan(repo: &Path, execution_mode: &str) {
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

- REQ-001 -> Task 1, Task 2

## Execution Strategy

- Execute Task 1 serially. It establishes boundary gating before follow-on work begins.
- Execute Task 2 serially after Task 1. It validates task-boundary workflow routing.

## Dependency Diagram

```text
Task 1 -> Task 2
```

## Task 1: Boundary setup

**Spec Coverage:** REQ-001
**Task Outcome:** Task 1 produces review and verification closure evidence.
**Plan Constraints:**
- Keep fixture deterministic and local.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`

- [ ] **Step 1: Prepare boundary fixture output**

## Task 2: Follow-on execution

**Spec Coverage:** REQ-001
**Task Outcome:** Follow-on task can run only after Task 1 closure evidence is present.
**Plan Constraints:**
- Preserve deterministic task-boundary gating behavior.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`

- [ ] **Step 1: Complete follow-on execution**
"#
        ),
    );
}

fn mark_all_plan_steps_checked(repo: &Path) {
    let path = repo.join(PLAN_REL);
    let source = fs::read_to_string(&path).expect("plan should be readable");
    fs::write(path, source.replace("- [ ]", "- [x]")).expect("plan should be writable");
}

fn sha256_hex(contents: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(contents);
    format!("{:x}", hasher.finalize())
}

fn canonical_unit_review_receipt_fingerprint(source: &str) -> String {
    let filtered = source
        .lines()
        .filter(|line| !line.trim().starts_with("**Receipt Fingerprint:**"))
        .collect::<Vec<_>>()
        .join("\n");
    sha256_hex(filtered.as_bytes())
}

fn write_authoritative_active_contract_and_serial_unit_review_receipt(
    repo: &Path,
    state: &Path,
) -> (String, String, String) {
    let branch = branch_name(repo);
    let execution_run_id = "execution-run-fixture-001";
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
    let execution_unit_id = "task-1-step-1";
    let reviewed_checkpoint_commit_sha = current_head_sha(repo);
    let active_contract_fingerprint =
        "1111111111111111111111111111111111111111111111111111111111111111";
    let active_contract_path = format!("contract-{active_contract_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &active_contract_path,
        ),
        &format!("# Execution Contract\n**Contract Fingerprint:** {active_contract_fingerprint}\n"),
    );

    let execution_context_key = sha256_hex(
        format!(
            "run={execution_run_id}\nunit={execution_unit_id}\nplan={PLAN_REL}\nplan_revision=1\nbranch={branch}\nreviewed_checkpoint={reviewed_checkpoint_commit_sha}\n"
        )
        .as_bytes(),
    );
    let approved_unit_contract_fingerprint = sha256_hex(
        format!(
            "approved-unit-contract:{active_contract_fingerprint}:{approved_task_packet_fingerprint}:{execution_unit_id}"
        )
        .as_bytes(),
    );
    let reconcile_result_proof_fingerprint = {
        let mut command = Command::new("git");
        command
            .args(["cat-file", "commit", &reviewed_checkpoint_commit_sha])
            .current_dir(repo);
        let output = run_checked(
            command,
            "git cat-file commit for authoritative serial unit-review fixture",
        );
        sha256_hex(&output.stdout)
    };
    let lease_fingerprint = sha256_hex(
        format!(
            "serial-unit-review:{execution_run_id}:{execution_unit_id}:{execution_context_key}:{reviewed_checkpoint_commit_sha}:{approved_task_packet_fingerprint}:{approved_unit_contract_fingerprint}"
        )
        .as_bytes(),
    );
    let reviewed_worktree = fs::canonicalize(repo).unwrap_or_else(|_| repo.to_path_buf());
    let unsigned_source = format!(
        "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Source Plan:** {PLAN_REL}\n**Source Plan Revision:** 1\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {lease_fingerprint}\n**Execution Context Key:** {execution_context_key}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reviewed_checkpoint_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-28T12:00:00Z\n",
        reviewed_worktree.display()
    );
    let receipt_fingerprint = canonical_unit_review_receipt_fingerprint(&unsigned_source);
    let receipt_source = format!(
        "# Unit Review Result\n**Receipt Fingerprint:** {receipt_fingerprint}\n{}",
        unsigned_source.trim_start_matches("# Unit Review Result\n")
    );
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("unit-review-{execution_run_id}-{execution_unit_id}.md"),
        ),
        &receipt_source,
    );

    (
        execution_run_id.to_string(),
        active_contract_path,
        active_contract_fingerprint.to_string(),
    )
}

fn current_head_sha(repo: &Path) -> String {
    let output = run_checked(
        {
            let mut command = Command::new("git");
            command.args(["rev-parse", "HEAD"]).current_dir(repo);
            command
        },
        "git rev-parse HEAD",
    );
    String::from_utf8(output.stdout)
        .expect("head sha should be utf-8")
        .trim()
        .to_owned()
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

fn expected_base_branch(repo: &Path) -> String {
    let current = branch_name(repo);
    let output = run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["for-each-ref", "--format=%(refname:short)", "refs/heads"])
                .current_dir(repo);
            command
        },
        "git for-each-ref refs/heads",
    );
    let mut branches = String::from_utf8(output.stdout)
        .expect("branch list should be utf-8")
        .lines()
        .map(str::trim)
        .filter(|branch| !branch.is_empty() && *branch != current)
        .map(str::to_owned)
        .collect::<Vec<_>>();
    branches.sort();
    branches.dedup();
    if branches.len() == 1 {
        return branches.remove(0);
    }
    current
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

fn project_artifact_dir(repo: &Path, state: &Path) -> PathBuf {
    state.join("projects").join(repo_slug(repo))
}

fn execution_contract_plan_hash(repo: &Path) -> String {
    let source = fs::read_to_string(repo.join(PLAN_REL)).expect("plan should be readable");
    let mut output = Vec::new();
    for line in source.lines() {
        if line.starts_with("**Execution Mode:** ") {
            output.push(String::from("**Execution Mode:** none"));
            continue;
        }
        if line.starts_with("- [x]") {
            output.push(line.replacen("- [x]", "- [ ]", 1));
            continue;
        }
        output.push(line.to_owned());
    }
    sha256_hex(format!("{}\n", output.join("\n")).as_bytes())
}

fn expected_packet_fingerprint(repo: &Path, task: u32, step: u32) -> String {
    let plan_fingerprint = execution_contract_plan_hash(repo);
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    let payload = format!(
        "plan_path={PLAN_REL}\nplan_revision=1\nplan_fingerprint={plan_fingerprint}\nsource_spec_path={SPEC_REL}\nsource_spec_revision=1\nsource_spec_fingerprint={spec_fingerprint}\ntask_number={task}\nstep_number={step}\n"
    );
    sha256_hex(payload.as_bytes())
}

fn write_single_step_v2_completed_attempt(repo: &Path, packet_fingerprint: &str) {
    let evidence_path = repo.join(
        "docs/featureforge/execution-evidence/2026-03-17-example-execution-plan-r1-evidence.md",
    );
    let plan_fingerprint =
        sha256_hex(&fs::read(repo.join(PLAN_REL)).expect("plan should be readable"));
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(SPEC_REL)).expect("spec should be readable"));
    write_file(&repo.join("docs/example-output.md"), "verified output\n");
    let file_digest = sha256_hex(
        &fs::read(repo.join("docs/example-output.md")).expect("output should be readable"),
    );
    let head_sha = current_head_sha(repo);
    write_file(
        &evidence_path,
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {PLAN_REL}\n**Plan Revision:** 1\n**Plan Fingerprint:** {plan_fingerprint}\n**Source Spec Path:** {SPEC_REL}\n**Source Spec Revision:** 1\n**Source Spec Fingerprint:** {spec_fingerprint}\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** featureforge:executing-plans\n**Task Number:** 1\n**Step Number:** 1\n**Packet Fingerprint:** {packet_fingerprint}\n**Head SHA:** {head_sha}\n**Base SHA:** {head_sha}\n**Claim:** Prepared the workspace for execution.\n**Files Proven:**\n- docs/example-output.md | sha256:{file_digest}\n**Verification Summary:** Manual inspection only: Verified by fixture setup.\n**Invalidation Reason:** N/A\n"
        ),
    );
}

fn write_task_boundary_unit_review_receipt(
    repo: &Path,
    state: &Path,
    execution_run_id: &str,
    task_number: u32,
    step_number: u32,
    reviewed_checkpoint_sha: &str,
) -> PathBuf {
    let execution_unit_id = format!("task-{task_number}-step-{step_number}");
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, task_number, step_number);
    let path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("unit-review-{execution_run_id}-{execution_unit_id}.md"),
    );
    write_file(
        &path,
        &format!(
            "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Source Plan:** {PLAN_REL}\n**Source Plan Revision:** 1\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_sha}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-29T22:00:00Z\n",
        ),
    );
    path
}

fn write_task_boundary_verification_receipt(
    repo: &Path,
    state: &Path,
    execution_run_id: &str,
    task_number: u32,
    strategy_checkpoint_fingerprint: &str,
) -> PathBuf {
    let path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch_name(repo),
        &format!("task-verification-{execution_run_id}-task-{task_number}.md"),
    );
    write_file(
        &path,
        &format!(
            "# Task Verification Result\n**Source Plan:** {PLAN_REL}\n**Source Plan Revision:** 1\n**Execution Run ID:** {execution_run_id}\n**Task Number:** {task_number}\n**Strategy Checkpoint Fingerprint:** {strategy_checkpoint_fingerprint}\n**Verification Commands:** cargo test --test workflow_runtime -- task_boundary_ --nocapture\n**Verification Results:** pass\n**Result:** pass\n**Generated By:** featureforge:verification-before-completion\n**Generated At:** 2026-03-29T22:00:00Z\n",
        ),
    );
    path
}

fn write_test_plan_artifact(repo: &Path, state: &Path, browser_required: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state)
        .join(format!("tester-{safe_branch}-test-plan-20260322-170500.md"));
    write_file(
        &artifact_path,
        &format!(
            "# Test Plan\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Head SHA:** {head_sha}\n**Browser QA Required:** {browser_required}\n**Generated By:** featureforge:plan-eng-review\n**Generated At:** 2026-03-22T17:05:00Z\n",
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_code_review_artifact(repo: &Path, state: &Path, base_branch: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let head_sha = current_head_sha(repo);
    let reviewer_artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-independent-review-20260322-170950.md"
    ));
    let reviewer_artifact_source = format!(
        "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-22T17:09:50Z\n\n## Summary\n- dedicated independent reviewer artifact fixture.\n",
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
            "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Reviewer Artifact Path:** `{}`\n**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-22T17:11:00Z\n",
            reviewer_artifact_path.display(),
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn reviewer_artifact_path_from_review(review_path: &Path) -> PathBuf {
    let receipt = parse_final_review_receipt(review_path);
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .as_deref()
        .expect("review receipt should include reviewer artifact path");
    let reviewer_artifact_path = PathBuf::from(reviewer_artifact_path.trim_matches('`').trim());
    if reviewer_artifact_path.is_absolute() {
        reviewer_artifact_path
    } else {
        review_path
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .join(reviewer_artifact_path)
    }
}

fn write_release_readiness_artifact(repo: &Path, state: &Path, base_branch: &str) -> PathBuf {
    let branch = branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state).join(format!(
        "tester-{safe_branch}-release-readiness-20260322-171500.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# Release Readiness Result\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:document-release\n**Generated At:** 2026-03-22T17:15:00Z\n",
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn run_featureforge_with_env(
    repo: &Path,
    state_dir: &Path,
    args: &[&str],
    env: &[(&str, &str)],
    context: &str,
) -> Value {
    let mut command = Command::new(compiled_featureforge_path());
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(args);
    for (key, value) in env {
        command.env(key, value);
    }
    parse_json(&run(command, context), context)
}

fn run_plan_execution(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Value {
    let mut command_args = Vec::with_capacity(args.len() + 2);
    command_args.push("plan");
    command_args.push("execution");
    command_args.extend_from_slice(args);
    run_featureforge_with_env(repo, state_dir, command_args.as_slice(), &[], context)
}

fn enable_session_decision(state: &Path, session_key: &str) {
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    write_file(&decision_path, "enabled\n");
}

fn write_authoritative_strategy_checkpoint_state(repo: &Path, state: &Path) {
    let branch = branch_name(repo);
    let (execution_run_id, active_contract_path, active_contract_fingerprint) =
        write_authoritative_active_contract_and_serial_unit_review_receipt(repo, state);
    let authoritative_state_path = harness_state_path(state, &repo_slug(repo), &branch);
    write_file(
        &authoritative_state_path,
        &format!(
            "{{\"schema_version\":1,\"run_identity\":{{\"execution_run_id\":\"{execution_run_id}\",\"source_plan_path\":\"{PLAN_REL}\",\"source_plan_revision\":1}},\"active_worktree_lease_fingerprints\":[],\"active_worktree_lease_bindings\":[],\"active_contract_path\":\"{active_contract_path}\",\"active_contract_fingerprint\":\"{active_contract_fingerprint}\",\"dependency_index_state\":\"fresh\",\"final_review_state\":\"not_required\",\"browser_qa_state\":\"not_required\",\"release_docs_state\":\"not_required\",\"strategy_state\":\"ready\",\"strategy_checkpoint_kind\":\"review_remediation\",\"last_strategy_checkpoint_fingerprint\":\"{FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT}\",\"strategy_reset_required\":false}}"
        ),
    );
}

fn write_task_boundary_strategy_checkpoint_state(repo: &Path, state: &Path, execution_run_id: &str) {
    let branch = branch_name(repo);
    let state_path = harness_state_path(state, &repo_slug(repo), &branch);
    let mut payload: Value = match fs::read_to_string(&state_path) {
        Ok(source) => serde_json::from_str(&source).expect("harness state should be valid json"),
        Err(_) => json!({}),
    };
    payload["schema_version"] = json!(1);
    payload["run_identity"] = json!({
        "execution_run_id": execution_run_id,
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1
    });
    payload["strategy_state"] = json!("executing");
    payload["strategy_checkpoint_kind"] = json!("initial_dispatch");
    payload["last_strategy_checkpoint_fingerprint"] = json!(FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT);
    payload["strategy_reset_required"] = json!(false);
    payload["active_worktree_lease_fingerprints"] = json!([]);
    payload["active_worktree_lease_bindings"] = json!([]);
    payload["dependency_index_state"] = json!("fresh");
    payload["final_review_state"] = json!("not_required");
    payload["browser_qa_state"] = json!("not_required");
    payload["release_docs_state"] = json!("not_required");
    write_file(
        &state_path,
        &serde_json::to_string(&payload).expect("harness state payload should serialize"),
    );
}

fn replace_in_file(path: &Path, from: &str, to: &str) {
    let source = fs::read_to_string(path).expect("file should be readable");
    fs::write(path, source.replace(from, to)).expect("file should be writable");
}

fn replace_review_reviewer_artifact_binding(
    review_path: &Path,
    new_reviewer_artifact_path: &Path,
    new_reviewer_artifact_fingerprint: &str,
) {
    let receipt = parse_final_review_receipt(review_path);
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .as_deref()
        .expect("review receipt should include reviewer artifact path");
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .as_deref()
        .expect("review receipt should include reviewer artifact fingerprint");
    let source = fs::read_to_string(review_path).expect("review artifact should be readable");
    fs::write(
        review_path,
        source
            .replace(
                &format!("`{reviewer_artifact_path}`"),
                &format!("`{}`", new_reviewer_artifact_path.display()),
            )
            .replace(
                reviewer_artifact_fingerprint,
                new_reviewer_artifact_fingerprint,
            ),
    )
    .expect("review artifact should be writable");
}

fn mutate_reviewer_source_not_independent(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    replace_in_file(
        review_path,
        "**Reviewer Source:** fresh-context-subagent",
        "**Reviewer Source:** implementation-context",
    );
}

fn mutate_reviewer_identity_missing(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    let source = fs::read_to_string(review_path).expect("review artifact should be readable");
    fs::write(
        review_path,
        source.replace("**Reviewer ID:** reviewer-fixture-001\n", ""),
    )
    .expect("review artifact should be writable");
}

fn mutate_reviewer_artifact_path_missing(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    let receipt = parse_final_review_receipt(review_path);
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .as_deref()
        .expect("review receipt should include reviewer artifact path");
    let source = fs::read_to_string(review_path).expect("review artifact should be readable");
    fs::write(
        review_path,
        source.replace(
            &format!("**Reviewer Artifact Path:** `{reviewer_artifact_path}`\n"),
            "",
        ),
    )
    .expect("review artifact should be writable");
}

fn mutate_reviewer_artifact_unreadable(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    let reviewer_artifact_path = reviewer_artifact_path_from_review(review_path);
    fs::remove_file(&reviewer_artifact_path).expect("reviewer artifact should be removable");
}

fn mutate_reviewer_artifact_not_runtime_owned(
    _repo: &Path,
    state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    let reviewer_artifact_path = reviewer_artifact_path_from_review(review_path);
    let reviewer_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should be readable");
    let external_dir = state.join("external-reviewer-artifacts");
    fs::create_dir_all(&external_dir).expect("external reviewer artifact dir should be creatable");
    let external_artifact_path = external_dir.join("external-independent-review.md");
    fs::write(&external_artifact_path, reviewer_source)
        .expect("external reviewer artifact should be writable");
    let external_artifact_fingerprint = sha256_hex(
        &fs::read(&external_artifact_path).expect("external reviewer artifact should be readable"),
    );
    replace_review_reviewer_artifact_binding(
        review_path,
        &external_artifact_path,
        &external_artifact_fingerprint,
    );
}

fn mutate_reviewer_fingerprint_invalid(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    let receipt = parse_final_review_receipt(review_path);
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .as_deref()
        .expect("review receipt should include reviewer artifact fingerprint");
    let source = fs::read_to_string(review_path).expect("review artifact should be readable");
    fs::write(
        review_path,
        source.replace(
            &format!("**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}"),
            "**Reviewer Artifact Fingerprint:** not-a-fingerprint",
        ),
    )
    .expect("review artifact should be writable");
}

fn mutate_reviewer_fingerprint_mismatch(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    let receipt = parse_final_review_receipt(review_path);
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .as_deref()
        .expect("review receipt should include reviewer artifact fingerprint");
    let source = fs::read_to_string(review_path).expect("review artifact should be readable");
    fs::write(
        review_path,
        source.replace(
            &format!("**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}"),
            "**Reviewer Artifact Fingerprint:** ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ),
    )
    .expect("review artifact should be writable");
}

fn mutate_reviewer_identity_mismatch(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    let reviewer_artifact_path = reviewer_artifact_path_from_review(review_path);
    let reviewer_artifact_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should be readable");
    fs::write(
        &reviewer_artifact_path,
        reviewer_artifact_source.replace(
            "**Reviewer ID:** reviewer-fixture-001",
            "**Reviewer ID:** reviewer-fixture-002",
        ),
    )
    .expect("reviewer artifact should be writable");
    let reviewer_artifact_fingerprint = sha256_hex(
        &fs::read(&reviewer_artifact_path).expect("reviewer artifact should be readable"),
    );
    replace_review_reviewer_artifact_binding(
        review_path,
        &reviewer_artifact_path,
        &reviewer_artifact_fingerprint,
    );
}

fn mutate_reviewer_artifact_contract_mismatch(
    _repo: &Path,
    _state: &Path,
    review_path: &Path,
    base_branch: &str,
) {
    let reviewer_artifact_path = reviewer_artifact_path_from_review(review_path);
    let reviewer_artifact_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should be readable");
    fs::write(
        &reviewer_artifact_path,
        reviewer_artifact_source.replace(
            &format!("**Base Branch:** {base_branch}"),
            "**Base Branch:** different-base",
        ),
    )
    .expect("reviewer artifact should be writable");
    let reviewer_artifact_fingerprint = sha256_hex(
        &fs::read(&reviewer_artifact_path).expect("reviewer artifact should be readable"),
    );
    replace_review_reviewer_artifact_binding(
        review_path,
        &reviewer_artifact_path,
        &reviewer_artifact_fingerprint,
    );
}

fn mutate_strategy_checkpoint_fingerprint_missing(
    repo: &Path,
    state: &Path,
    _review_path: &Path,
    _base_branch: &str,
) {
    write_authoritative_strategy_checkpoint_state(repo, state);
}

fn mutate_strategy_checkpoint_fingerprint_mismatch(
    repo: &Path,
    state: &Path,
    review_path: &Path,
    _base_branch: &str,
) {
    write_authoritative_strategy_checkpoint_state(repo, state);
    let source = fs::read_to_string(review_path).expect("review artifact should be readable");
    fs::write(
        review_path,
        source.replace(
            &format!("**Source Plan:** `{PLAN_REL}`"),
            &format!(
                "**Strategy Checkpoint Fingerprint:** bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n**Source Plan:** `{PLAN_REL}`"
            ),
        ),
    )
    .expect("review artifact should be writable");
}

#[test]
fn workflow_phase_routes_missing_final_review_back_to_requesting_code_review() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-final-review");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-runtime-final-review";

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    write_release_readiness_artifact(repo, state, &expected_base_branch(repo));
    enable_session_decision(state, session_key);

    let phase_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "phase", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow phase for final-review-focused shard",
    );
    let handoff_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff for final-review-focused shard",
    );
    let gate_finish_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "gate", "finish", "--plan", PLAN_REL, "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow finish gate for final-review-focused shard",
    );

    assert_eq!(
        phase_json["phase"], "final_review_pending",
        "task-boundary final-review fixture should route to final_review_pending; phase payload: {phase_json:?}; handoff payload: {handoff_json:?}; gate-finish payload: {gate_finish_json:?}"
    );
    assert_eq!(phase_json["next_action"], "request_code_review");
    assert_eq!(handoff_json["phase"], "final_review_pending");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:requesting-code-review"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "Finish readiness requires a final code-review artifact."
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "ReviewArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "review_artifact_missing"
    );
}

#[test]
fn task_boundary_final_review_remains_required_after_task_closure_gates() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-task-boundary-final-review-required");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-runtime-task-boundary-final-review-required";

    write_approved_spec(repo);
    write_two_task_single_step_plan(repo, "featureforge:executing-plans");
    enable_session_decision(state, session_key);

    let status_before_begin = run_plan_execution(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before task-boundary final-review fixture execution",
    );
    let preflight = run_plan_execution(
        repo,
        state,
        &["preflight", "--plan", PLAN_REL],
        "preflight for task-boundary final-review fixture execution",
    );
    assert_eq!(preflight["allowed"], true);

    let begin_task1 = run_plan_execution(
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
                .expect("status should expose execution fingerprint before begin"),
        ],
        "begin task 1 for task-boundary final-review fixture execution",
    );
    let complete_task1 = run_plan_execution(
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
            "Completed task 1 step 1 for task-boundary final-review fixture.",
            "--manual-verify-summary",
            "Verified by task-boundary final-review fixture setup.",
            "--file",
            "docs/example-output.md",
            "--expect-execution-fingerprint",
            begin_task1["execution_fingerprint"]
                .as_str()
                .expect("begin should expose execution fingerprint for complete"),
        ],
        "complete task 1 for task-boundary final-review fixture execution",
    );

    let execution_run_id = complete_task1["execution_run_id"]
        .as_str()
        .expect("execution run id should be present after task 1 completion")
        .to_owned();
    let checkpoint_sha = current_head_sha(repo);
    write_task_boundary_unit_review_receipt(repo, state, &execution_run_id, 1, 1, &checkpoint_sha);
    write_task_boundary_strategy_checkpoint_state(repo, state, &execution_run_id);
    write_task_boundary_verification_receipt(
        repo,
        state,
        &execution_run_id,
        1,
        FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT,
    );

    let status_before_task2 = run_plan_execution(
        repo,
        state,
        &["status", "--plan", PLAN_REL],
        "status before task 2 begin for task-boundary final-review fixture execution",
    );
    assert_eq!(status_before_task2["blocking_task"], Value::Null);
    let begin_task2 = run_plan_execution(
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
            status_before_task2["execution_fingerprint"]
                .as_str()
                .expect("status should expose execution fingerprint before task 2 begin"),
        ],
        "begin task 2 for task-boundary final-review fixture execution",
    );
    run_plan_execution(
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
            "Completed task 2 step 1 for task-boundary final-review fixture.",
            "--manual-verify-summary",
            "Verified by task-boundary final-review fixture setup.",
            "--file",
            "docs/example-output.md",
            "--expect-execution-fingerprint",
            begin_task2["execution_fingerprint"]
                .as_str()
                .expect("begin should expose execution fingerprint for complete"),
        ],
        "complete task 2 for task-boundary final-review fixture execution",
    );

    write_test_plan_artifact(repo, state, "no");
    write_release_readiness_artifact(repo, state, &expected_base_branch(repo));

    let phase_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "phase", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow phase for task-boundary final-review-required shard",
    );
    let handoff_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff for task-boundary final-review-required shard",
    );
    assert_eq!(
        phase_json["phase"], "final_review_pending",
        "task-boundary final-review fixture should route to final_review_pending; phase payload: {phase_json:?}; handoff payload: {handoff_json:?}"
    );
    assert_eq!(handoff_json["phase"], "final_review_pending");
}

#[test]
fn workflow_phase_routes_stale_review_back_to_requesting_code_review() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-stale-final-review");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-runtime-stale-final-review";

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);
    enable_session_decision(state, session_key);
    replace_in_file(
        &review_path,
        &format!("**Head SHA:** {}", current_head_sha(repo)),
        "**Head SHA:** 0000000000000000000000000000000000000000",
    );

    let phase_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "phase", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow phase for stale-review-focused shard",
    );
    let handoff_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff for stale-review-focused shard",
    );
    let gate_finish_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "gate", "finish", "--plan", PLAN_REL, "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow finish gate for stale-review-focused shard",
    );

    assert_eq!(phase_json["phase"], "final_review_pending");
    assert_eq!(phase_json["next_action"], "request_code_review");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:requesting-code-review"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "The latest code-review artifact does not match the current HEAD."
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "ReviewArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "review_receipt_head_mismatch"
    );
}

#[test]
fn workflow_phase_routes_non_independent_reviewer_source_back_to_requesting_code_review() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-non-independent-reviewer-source");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-runtime-non-independent-reviewer-source";

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);
    enable_session_decision(state, session_key);
    replace_in_file(
        &review_path,
        "**Reviewer Source:** fresh-context-subagent",
        "**Reviewer Source:** implementation-context",
    );

    let phase_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "phase", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow phase for non-independent-reviewer-source shard",
    );
    let handoff_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff for non-independent-reviewer-source shard",
    );
    let gate_finish_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "gate", "finish", "--plan", PLAN_REL, "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow finish gate for non-independent-reviewer-source shard",
    );

    assert_eq!(phase_json["phase"], "final_review_pending");
    assert_eq!(phase_json["next_action"], "request_code_review");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:requesting-code-review"
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "ReviewArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "review_receipt_reviewer_source_not_independent"
    );
}

#[test]
fn workflow_phase_routes_unreadable_reviewer_artifact_back_to_requesting_code_review() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-unreadable-reviewer-artifact");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-runtime-unreadable-reviewer-artifact";

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);
    enable_session_decision(state, session_key);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    fs::remove_file(&reviewer_artifact_path).expect("reviewer artifact should remove");

    let phase_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "phase", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow phase for unreadable-reviewer-artifact shard",
    );
    let handoff_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff for unreadable-reviewer-artifact shard",
    );
    let gate_finish_json = run_featureforge_with_env(
        repo,
        state,
        &["workflow", "gate", "finish", "--plan", PLAN_REL, "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow finish gate for unreadable-reviewer-artifact shard",
    );

    assert_eq!(phase_json["phase"], "final_review_pending");
    assert_eq!(phase_json["next_action"], "request_code_review");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:requesting-code-review"
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "ReviewArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "review_receipt_reviewer_artifact_unreadable"
    );
}

#[test]
fn workflow_phase_routes_all_reviewer_failure_families_back_to_requesting_code_review() {
    struct ReviewerFailureCase {
        name: &'static str,
        reason_code: &'static str,
        mutate: fn(&Path, &Path, &Path, &str),
    }

    let cases = [
        ReviewerFailureCase {
            name: "reviewer-identity-missing",
            reason_code: "review_receipt_reviewer_identity_missing",
            mutate: mutate_reviewer_identity_missing,
        },
        ReviewerFailureCase {
            name: "reviewer-source-not-independent",
            reason_code: "review_receipt_reviewer_source_not_independent",
            mutate: mutate_reviewer_source_not_independent,
        },
        ReviewerFailureCase {
            name: "reviewer-artifact-path-missing",
            reason_code: "review_receipt_reviewer_artifact_path_missing",
            mutate: mutate_reviewer_artifact_path_missing,
        },
        ReviewerFailureCase {
            name: "reviewer-artifact-unreadable",
            reason_code: "review_receipt_reviewer_artifact_unreadable",
            mutate: mutate_reviewer_artifact_unreadable,
        },
        ReviewerFailureCase {
            name: "reviewer-artifact-not-runtime-owned",
            reason_code: "review_receipt_reviewer_artifact_not_runtime_owned",
            mutate: mutate_reviewer_artifact_not_runtime_owned,
        },
        ReviewerFailureCase {
            name: "reviewer-fingerprint-invalid",
            reason_code: "review_receipt_reviewer_fingerprint_invalid",
            mutate: mutate_reviewer_fingerprint_invalid,
        },
        ReviewerFailureCase {
            name: "reviewer-fingerprint-mismatch",
            reason_code: "review_receipt_reviewer_fingerprint_mismatch",
            mutate: mutate_reviewer_fingerprint_mismatch,
        },
        ReviewerFailureCase {
            name: "reviewer-identity-mismatch",
            reason_code: "review_receipt_reviewer_identity_mismatch",
            mutate: mutate_reviewer_identity_mismatch,
        },
        ReviewerFailureCase {
            name: "reviewer-artifact-contract-mismatch",
            reason_code: "review_receipt_reviewer_artifact_contract_mismatch",
            mutate: mutate_reviewer_artifact_contract_mismatch,
        },
        ReviewerFailureCase {
            name: "reviewer-strategy-checkpoint-fingerprint-missing",
            reason_code: "review_receipt_strategy_checkpoint_fingerprint_missing",
            mutate: mutate_strategy_checkpoint_fingerprint_missing,
        },
        ReviewerFailureCase {
            name: "reviewer-strategy-checkpoint-fingerprint-mismatch",
            reason_code: "review_receipt_strategy_checkpoint_fingerprint_mismatch",
            mutate: mutate_strategy_checkpoint_fingerprint_mismatch,
        },
    ];

    for case in cases {
        let fixture_name = format!("workflow-runtime-{}", case.name);
        let (repo_dir, state_dir) = init_repo(&fixture_name);
        let repo = repo_dir.path();
        let state = state_dir.path();
        let session_key = format!("session-{}", case.name);

        write_approved_spec(repo);
        write_single_step_plan(repo, "featureforge:executing-plans");
        mark_all_plan_steps_checked(repo);
        write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
        write_test_plan_artifact(repo, state, "no");
        let base_branch = expected_base_branch(repo);
        let review_path = write_code_review_artifact(repo, state, &base_branch);
        write_release_readiness_artifact(repo, state, &base_branch);
        enable_session_decision(state, &session_key);
        (case.mutate)(repo, state, &review_path, &base_branch);

        let phase_json = run_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key.as_str())],
            &format!("workflow phase for {}", case.name),
        );
        let handoff_json = run_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key.as_str())],
            &format!("workflow handoff for {}", case.name),
        );
        let gate_finish_json = run_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", PLAN_REL, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key.as_str())],
            &format!("workflow finish gate for {}", case.name),
        );

        assert_eq!(phase_json["phase"], "final_review_pending", "{}", case.name);
        assert_eq!(
            phase_json["next_action"], "request_code_review",
            "{}",
            case.name
        );
        assert_eq!(
            handoff_json["recommended_skill"], "featureforge:requesting-code-review",
            "{}",
            case.name
        );
        assert_eq!(gate_finish_json["allowed"], false, "{}", case.name);
        assert_eq!(
            gate_finish_json["failure_class"], "ReviewArtifactNotFresh",
            "{}",
            case.name
        );
        assert!(
            gate_finish_json["reason_codes"]
                .as_array()
                .is_some_and(|codes| codes.iter().any(|code| code == case.reason_code)),
            "{}",
            case.name
        );
    }
}
