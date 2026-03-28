#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use assert_cmd::cargo::CommandCargoExt;
use featureforge::execution::final_review::{
    FinalReviewReceipt, FinalReviewReceiptExpectations, FinalReviewReceiptIssue,
    latest_branch_artifact_path, parse_final_review_receipt, resolve_release_base_branch,
    validate_final_review_receipt,
};
use featureforge::paths::{
    branch_storage_key, harness_authoritative_artifacts_dir, harness_state_path,
};
use files_support::write_file;
use json_support::parse_json;
use process_support::{run, run_checked};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tempfile::TempDir;

const PLAN_REL: &str = "docs/featureforge/plans/2026-03-17-example-execution-plan.md";
const SPEC_REL: &str = "docs/featureforge/specs/2026-03-17-example-execution-plan-design.md";
const STRATEGY_CHECKPOINT_FINGERPRINT: &str =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

fn validate_fixture_review_receipt(
    receipt: &FinalReviewReceipt,
    review_path: &Path,
    repo: &Path,
    expected_strategy_checkpoint_fingerprint: Option<&str>,
) -> Result<(), FinalReviewReceiptIssue> {
    let expectations = FinalReviewReceiptExpectations {
        expected_plan_path: PLAN_REL,
        expected_plan_revision: 1,
        expected_strategy_checkpoint_fingerprint,
        expected_head_sha: &current_head_sha(repo),
        expected_base_branch: &expected_base_branch(repo),
        deviations_required: false,
    };
    validate_final_review_receipt(receipt, review_path, &expectations)
}

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

fn git_dir_path(repo: &Path) -> PathBuf {
    let output = run_checked(
        {
            let mut command = Command::new("git");
            command.args(["rev-parse", "--git-dir"]).current_dir(repo);
            command
        },
        "git rev-parse --git-dir",
    );
    let git_dir = String::from_utf8(output.stdout)
        .expect("git dir should be utf-8")
        .trim()
        .to_owned();
    let git_dir_path = PathBuf::from(&git_dir);
    if git_dir_path.is_absolute() {
        git_dir_path
    } else {
        repo.join(git_dir_path)
    }
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
        "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Strategy Checkpoint Fingerprint:** {STRATEGY_CHECKPOINT_FINGERPRINT}\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-22T17:09:50Z\n\n## Summary\n- dedicated independent reviewer artifact fixture.\n",
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
            "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Reviewer Artifact Path:** `{}`\n**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Source Plan:** `{PLAN_REL}`\n**Source Plan Revision:** 1\n**Strategy Checkpoint Fingerprint:** {STRATEGY_CHECKPOINT_FINGERPRINT}\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {head_sha}\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-22T17:11:00Z\n",
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

fn write_active_contract_artifact(repo: &Path, state: &Path) -> String {
    let fingerprint =
        String::from("1111111111111111111111111111111111111111111111111111111111111111");
    let path = harness_authoritative_artifacts_dir(state, &repo_slug(repo), &branch_name(repo))
        .join(format!("contract-{fingerprint}.md"));
    write_file(
        &path,
        "# Execution Contract\n**Contract Fingerprint:** 1111111111111111111111111111111111111111111111111111111111111111\n",
    );
    fingerprint
}

fn reconcile_result_proof_fingerprint(repo: &Path, commit_sha: &str) -> String {
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
    sha256_hex(&output.stdout)
}

fn canonical_unit_review_receipt_fingerprint(source: &str) -> String {
    let filtered = source
        .lines()
        .filter(|line| !line.trim().starts_with("**Receipt Fingerprint:**"))
        .collect::<Vec<_>>()
        .join("\n");
    sha256_hex(filtered.as_bytes())
}

fn write_serial_unit_review_receipt(repo: &Path, state: &Path, active_contract_fingerprint: &str) {
    let branch = branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let execution_run_id = format!("run-{safe_branch}-finish");
    let execution_unit_id = String::from("task-1-step-1");
    let reviewed_checkpoint_commit_sha = current_head_sha(repo);
    let approved_task_packet_fingerprint = expected_packet_fingerprint(repo, 1, 1);
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
    let reviewed_worktree = fs::canonicalize(repo).unwrap_or_else(|_| repo.to_path_buf());
    let reconcile_result_proof_fingerprint =
        reconcile_result_proof_fingerprint(repo, &reviewed_checkpoint_commit_sha);
    let lease_fingerprint = sha256_hex(
        format!(
            "serial-unit-review:{execution_run_id}:{execution_unit_id}:{execution_context_key}:{reviewed_checkpoint_commit_sha}:{approved_task_packet_fingerprint}:{approved_unit_contract_fingerprint}"
        )
        .as_bytes(),
    );
    let unsigned_source = format!(
        "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Source Plan:** {PLAN_REL}\n**Source Plan Revision:** 1\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {lease_fingerprint}\n**Execution Context Key:** {execution_context_key}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reviewed_checkpoint_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-27T12:00:00Z\n",
        reviewed_worktree.display()
    );
    let receipt_fingerprint = canonical_unit_review_receipt_fingerprint(&unsigned_source);
    let source = format!(
        "# Unit Review Result\n**Receipt Fingerprint:** {receipt_fingerprint}\n{}",
        unsigned_source.trim_start_matches("# Unit Review Result\n")
    );
    let receipt_path =
        harness_authoritative_artifacts_dir(state, &repo_slug(repo), &branch_name(repo)).join(
            format!("unit-review-{execution_run_id}-{execution_unit_id}.md"),
        );
    write_file(&receipt_path, &source);
}

fn write_harness_state_payload(repo: &Path, state: &Path, payload: &serde_json::Value) {
    let path = harness_state_path(state, &repo_slug(repo), &branch_name(repo));
    write_file(
        &path,
        &serde_json::to_string_pretty(payload).expect("harness state payload should serialize"),
    );
}

fn write_finish_ready_harness_state_with_reason_codes(
    repo: &Path,
    state: &Path,
    reason_codes: &[&str],
) {
    let branch = branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let active_contract_fingerprint = write_active_contract_artifact(repo, state);
    let artifact_dir = project_artifact_dir(repo, state);
    let review_path = latest_branch_artifact_path(&artifact_dir, &branch, "code-review")
        .expect("finish-ready harness state should have a branch code-review artifact");
    let review_source =
        fs::read_to_string(&review_path).expect("code-review artifact should be readable");
    let review_fingerprint = sha256_hex(review_source.as_bytes());
    let authoritative_review_path =
        harness_authoritative_artifacts_dir(state, &repo_slug(repo), &branch)
            .join(format!("final-review-{review_fingerprint}.md"));
    write_file(&authoritative_review_path, &review_source);

    let release_path = latest_branch_artifact_path(&artifact_dir, &branch, "release-readiness")
        .expect("finish-ready harness state should have a branch release-readiness artifact");
    let release_source =
        fs::read_to_string(&release_path).expect("release-readiness artifact should be readable");
    let release_fingerprint = sha256_hex(release_source.as_bytes());
    let authoritative_release_path =
        harness_authoritative_artifacts_dir(state, &repo_slug(repo), &branch)
            .join(format!("release-docs-{release_fingerprint}.md"));
    write_file(&authoritative_release_path, &release_source);

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
            "repo_state_baseline_head_sha": current_head_sha(repo),
            "repo_state_baseline_worktree_fingerprint": "2222222222222222222222222222222222222222222222222222222222222222",
            "repo_state_drift_state": "reconciled",
            "active_contract_path": format!("contract-{active_contract_fingerprint}.md"),
            "active_contract_fingerprint": active_contract_fingerprint,
            "dependency_index_state": "fresh",
            "final_review_state": "fresh",
            "browser_qa_state": "not_required",
            "release_docs_state": "fresh",
            "last_final_review_artifact_fingerprint": review_fingerprint,
            "last_release_docs_artifact_fingerprint": release_fingerprint,
            "active_worktree_lease_fingerprints": [],
            "active_worktree_lease_bindings": [],
            "strategy_state": "ready",
            "strategy_checkpoint_kind": "initial_dispatch",
            "last_strategy_checkpoint_fingerprint": STRATEGY_CHECKPOINT_FINGERPRINT,
            "strategy_reset_required": false,
            "reason_codes": reason_codes
        }),
    );
}

fn write_matching_topology_downgrade_record(repo: &Path, state: &Path, base_branch: &str) {
    let branch = branch_name(repo);
    let execution_context_key = format!("{branch}@{base_branch}");
    let source = json!({
        "record_version": 1,
        "authoritative_sequence": 18,
        "source_plan_path": PLAN_REL,
        "source_plan_revision": 1,
        "execution_context_key": execution_context_key,
        "primary_reason_class": "dependency_mismatch",
        "detail": {
            "trigger_summary": "Parallel lanes depended on shared write scope ordering.",
            "affected_units": ["task-1-step-1"],
            "blocking_evidence": {
                "summary": "Observed dependency mismatch while reconciling unit lane.",
                "references": ["artifact:unit-review-run-task-1-step-1"]
            },
            "operator_impact": {
                "severity": "warning",
                "changed_or_blocked_stage": "executing",
                "expected_response": "downgrade the slice"
            },
            "notes": ["runtime-authored test fixture"]
        },
        "rerun_guidance_superseded": false,
        "generated_by": "featureforge:execution-runtime",
        "generated_at": "2026-03-28T15:00:00Z",
        "record_fingerprint": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    });
    let record_path = harness_authoritative_artifacts_dir(state, &repo_slug(repo), &branch)
        .join("execution-topology-downgrade-dependency-mismatch.json");
    write_file(
        &record_path,
        &serde_json::to_string_pretty(&source)
            .expect("topology downgrade record fixture should serialize"),
    );
}

#[test]
fn dedicated_final_review_receipt_requires_dedicated_provenance() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-dedicated-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            "**Reviewer Provenance:** dedicated-independent",
            "**Reviewer Provenance:** implementation-context",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("non-dedicated review provenance should fail validation");
    assert_eq!(error, FinalReviewReceiptIssue::ReviewerProvenanceMissing);
    assert_eq!(error.reason_code(), "review_receipt_not_dedicated");
}

#[test]
fn dedicated_final_review_receipt_requires_distinct_from_stages() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-distinct-stages");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            "**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n",
            "",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("final review should declare which implementation stages it is distinct from");
    assert_eq!(error, FinalReviewReceiptIssue::DistinctFromStagesMissing);
    assert_eq!(
        error.reason_code(),
        "review_receipt_distinct_from_stages_missing"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_reviewer_identity_headers() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-identity-headers");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace("**Reviewer ID:** reviewer-fixture-001\n", ""),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should require reviewer identity headers");
    assert_eq!(error, FinalReviewReceiptIssue::ReviewerIdentityMissing);
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_identity_missing"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_independent_reviewer_source() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-reviewer-source");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            "**Reviewer Source:** fresh-context-subagent",
            "**Reviewer Source:** implementation-context",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None).expect_err(
        "dedicated final review should require an approved independent reviewer source",
    );
    assert_eq!(error, FinalReviewReceiptIssue::ReviewerSourceNotIndependent);
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_source_not_independent"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_strategy_checkpoint_fingerprint_when_expected() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-strategy-fingerprint-missing");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            &format!("**Strategy Checkpoint Fingerprint:** {STRATEGY_CHECKPOINT_FINGERPRINT}\n"),
            "",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(
        &receipt,
        &review_path,
        repo,
        Some(STRATEGY_CHECKPOINT_FINGERPRINT),
    )
    .expect_err("dedicated final review should require strategy checkpoint binding");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::StrategyCheckpointFingerprintMissing
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_strategy_checkpoint_fingerprint_missing"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_matching_strategy_checkpoint_fingerprint() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-strategy-fingerprint-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            STRATEGY_CHECKPOINT_FINGERPRINT,
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(
        &receipt,
        &review_path,
        repo,
        Some(STRATEGY_CHECKPOINT_FINGERPRINT),
    )
    .expect_err("dedicated final review should require matching strategy checkpoint binding");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::StrategyCheckpointFingerprintMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_strategy_checkpoint_fingerprint_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_reviewer_artifact_path() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-reviewer-artifact-path");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .expect("fixture review artifact should include reviewer artifact path");
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            &format!("**Reviewer Artifact Path:** `{reviewer_artifact_path}`\n"),
            "",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should require reviewer artifact path binding");
    assert_eq!(error, FinalReviewReceiptIssue::ReviewerArtifactPathMissing);
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_path_missing"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_readable_reviewer_artifact_path() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-reviewer-artifact-unreadable");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    fs::remove_file(&reviewer_artifact_path).expect("reviewer artifact should remove");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should reject unreadable reviewer artifact paths");
    assert_eq!(error, FinalReviewReceiptIssue::ReviewerArtifactUnreadable);
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_unreadable"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_runtime_owned_reviewer_artifact() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-reviewer-artifact-runtime-owned");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    let reviewer_artifact_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should read");
    let external_dir = TempDir::new().expect("external reviewer tempdir should exist");
    let external_reviewer_artifact_path = external_dir
        .path()
        .join("reviewer-artifact-outside-runtime.md");
    fs::write(&external_reviewer_artifact_path, &reviewer_artifact_source)
        .expect("external reviewer artifact should write");
    let external_reviewer_artifact_fingerprint =
        sha256_hex(&fs::read(&external_reviewer_artifact_path).expect("artifact should read"));
    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .clone()
        .expect("review receipt should include reviewer artifact fingerprint");
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original
            .replace(
                &format!("`{}`", reviewer_artifact_path.display()),
                &format!("`{}`", external_reviewer_artifact_path.display()),
            )
            .replace(
                &reviewer_artifact_fingerprint,
                &external_reviewer_artifact_fingerprint,
            ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(
        &receipt,
        &review_path,
        repo,
        None,
    )
    .expect_err("dedicated final review should reject reviewer artifacts outside runtime-owned project artifacts");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactNotRuntimeOwned
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_not_runtime_owned"
    );
}

#[test]
fn dedicated_final_review_receipt_rejects_sibling_project_reviewer_artifact() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-reviewer-artifact-sibling-project");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    let reviewer_artifact_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should read");
    let sibling_project_dir = state.join("projects").join("different-project-slug");
    fs::create_dir_all(&sibling_project_dir).expect("sibling project artifact dir should create");
    let sibling_reviewer_artifact_path = sibling_project_dir.join("reviewer-artifact.md");
    fs::write(&sibling_reviewer_artifact_path, &reviewer_artifact_source)
        .expect("sibling reviewer artifact should write");
    let sibling_reviewer_artifact_fingerprint =
        sha256_hex(&fs::read(&sibling_reviewer_artifact_path).expect("artifact should read"));
    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .clone()
        .expect("review receipt should include reviewer artifact fingerprint");
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original
            .replace(
                &format!("`{}`", reviewer_artifact_path.display()),
                &format!("`{}`", sibling_reviewer_artifact_path.display()),
            )
            .replace(
                &reviewer_artifact_fingerprint,
                &sibling_reviewer_artifact_fingerprint,
            ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None).expect_err(
        "dedicated final review should reject reviewer artifacts from sibling project slugs",
    );
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactNotRuntimeOwned
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_not_runtime_owned"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_reviewer_artifact_fingerprint() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-reviewer-fingerprint");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .clone()
        .expect("fixture review artifact should include reviewer fingerprint");
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            &format!("**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}"),
            "**Reviewer Artifact Fingerprint:** not-a-fingerprint",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should require canonical reviewer fingerprint");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactFingerprintInvalid
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_fingerprint_invalid"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_matching_reviewer_artifact_fingerprint() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-reviewer-fingerprint-match");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .clone()
        .expect("fixture review artifact should include reviewer fingerprint");
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            &format!("**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}"),
            "**Reviewer Artifact Fingerprint:** ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should require reviewer artifact fingerprint binding");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactFingerprintMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_fingerprint_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_matching_reviewer_artifact_identity() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-reviewer-identity-match");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            "**Reviewer Source:** fresh-context-subagent",
            "**Reviewer Source:** cross-model",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None).expect_err(
        "dedicated final review should require reviewer identity to match reviewer artifact",
    );
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactIdentityMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_identity_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_reviewer_artifact_contract_binding() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-reviewer-contract-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    let reviewer_artifact_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should read");
    fs::write(
        &reviewer_artifact_path,
        reviewer_artifact_source.replace(
            &format!("**Head SHA:** {}", current_head_sha(repo)),
            "**Head SHA:** ffffffffffffffffffffffffffffffffffffffff",
        ),
    )
    .expect("reviewer artifact should write");
    let reviewer_artifact_fingerprint =
        sha256_hex(&fs::read(&reviewer_artifact_path).expect("reviewer artifact should read"));
    let receipt = parse_final_review_receipt(&review_path);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            receipt
                .reviewer_artifact_fingerprint
                .as_deref()
                .expect("review receipt should include reviewer artifact fingerprint"),
            &reviewer_artifact_fingerprint,
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should require reviewer artifact contract binding");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactContractMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_contract_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_reviewer_artifact_base_branch_binding() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-reviewer-base-branch-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    let reviewer_artifact_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should read");
    fs::write(
        &reviewer_artifact_path,
        reviewer_artifact_source.replace(
            &format!("**Base Branch:** {base_branch}"),
            "**Base Branch:** different-base",
        ),
    )
    .expect("reviewer artifact should write");
    let reviewer_artifact_fingerprint =
        sha256_hex(&fs::read(&reviewer_artifact_path).expect("reviewer artifact should read"));
    let receipt = parse_final_review_receipt(&review_path);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            receipt
                .reviewer_artifact_fingerprint
                .as_deref()
                .expect("review receipt should include reviewer artifact fingerprint"),
            &reviewer_artifact_fingerprint,
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should require reviewer artifact base-branch binding");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactContractMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_contract_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_reviewer_artifact_branch_and_repo_binding() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-reviewer-branch-repo-binding");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    let reviewer_artifact_source =
        fs::read_to_string(&reviewer_artifact_path).expect("reviewer artifact should read");
    fs::write(
        &reviewer_artifact_path,
        reviewer_artifact_source
            .replace(
                &format!("**Branch:** {}", branch_name(repo)),
                "**Branch:** different-branch",
            )
            .replace(
                &format!("**Repo:** {}", repo_slug(repo)),
                "**Repo:** different-repo",
            ),
    )
    .expect("reviewer artifact should write");
    let reviewer_artifact_fingerprint =
        sha256_hex(&fs::read(&reviewer_artifact_path).expect("reviewer artifact should read"));
    let receipt = parse_final_review_receipt(&review_path);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            receipt
                .reviewer_artifact_fingerprint
                .as_deref()
                .expect("review receipt should include reviewer artifact fingerprint"),
            &reviewer_artifact_fingerprint,
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should require reviewer artifact branch/repo binding");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactContractMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_contract_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_rejects_self_referential_reviewer_artifact_path() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-reviewer-artifact-self-reference");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .as_deref()
        .expect("fixture review artifact should include reviewer artifact path");
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .as_deref()
        .expect("fixture review artifact should include reviewer artifact fingerprint");
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original
            .replace(
                &format!("`{reviewer_artifact_path}`"),
                &format!("`{}`", review_path.display()),
            )
            .replace(
                reviewer_artifact_fingerprint,
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should reject self-referential reviewer artifacts");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactContractMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_contract_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_rejects_code_review_to_code_review_reference() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-reviewer-artifact-code-review-reference");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let decoy_review_path = project_artifact_dir(repo, state).join("decoy-code-review.md");
    let review_source = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(&decoy_review_path, &review_source).expect("decoy review artifact should write");
    let decoy_review_fingerprint =
        sha256_hex(&fs::read(&decoy_review_path).expect("decoy review artifact should read"));

    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .as_deref()
        .expect("fixture review artifact should include reviewer artifact path");
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .as_deref()
        .expect("fixture review artifact should include reviewer artifact fingerprint");
    fs::write(
        &review_path,
        review_source
            .replace(
                &format!("`{reviewer_artifact_path}`"),
                &format!("`{}`", decoy_review_path.display()),
            )
            .replace(reviewer_artifact_fingerprint, &decoy_review_fingerprint),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("dedicated final review should reject code-review-to-code-review references");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::ReviewerArtifactContractMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_reviewer_artifact_contract_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_implementation_stage_distinctness() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-distinct-stage-values");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            "**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development",
            "**Distinct From Stages:** featureforge:requesting-code-review",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None)
        .expect_err("final review should prove independence from implementation stages");
    assert_eq!(error, FinalReviewReceiptIssue::DistinctFromStagesInvalid);
    assert_eq!(
        error.reason_code(),
        "review_receipt_distinct_from_stages_invalid"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_both_implementation_stages() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-both-stage-values");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original.replace(
            "**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development",
            "**Distinct From Stages:** featureforge:executing-plans",
        ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None).expect_err(
        "final review should name both implementation stages in its distinctness proof",
    );
    assert_eq!(error, FinalReviewReceiptIssue::DistinctFromStagesInvalid);
    assert_eq!(
        error.reason_code(),
        "review_receipt_distinct_from_stages_invalid"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_passed_deviation_disposition_when_needed() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-deviation-pass");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original
            .replace(
                "**Recorded Execution Deviations:** none",
                "**Recorded Execution Deviations:** present",
            )
            .replace(
                "**Deviation Review Verdict:** not_required",
                "**Deviation Review Verdict:** fail",
            ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let expectations = FinalReviewReceiptExpectations {
        expected_plan_path: PLAN_REL,
        expected_plan_revision: 1,
        expected_strategy_checkpoint_fingerprint: None,
        expected_head_sha: &current_head_sha(repo),
        expected_base_branch: &expected_base_branch(repo),
        deviations_required: true,
    };
    let error = validate_final_review_receipt(&receipt, &review_path, &expectations)
        .expect_err("deviation-aware final review should require a passing disposition");
    assert_eq!(
        error,
        FinalReviewReceiptIssue::DeviationReviewVerdictMismatch
    );
    assert_eq!(
        error.reason_code(),
        "review_receipt_deviation_verdict_mismatch"
    );
}

#[test]
fn dedicated_final_review_receipt_requires_explicit_no_deviation_disposition() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-no-deviation-disposition");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let original = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        original
            .replace(
                "**Recorded Execution Deviations:** none",
                "**Recorded Execution Deviations:** present",
            )
            .replace(
                "**Deviation Review Verdict:** not_required",
                "**Deviation Review Verdict:** pass",
            ),
    )
    .expect("review artifact should write");

    let receipt = parse_final_review_receipt(&review_path);
    let error = validate_fixture_review_receipt(&receipt, &review_path, repo, None).expect_err(
        "no-deviation receipts should still record explicit none/not_required disposition",
    );
    assert_eq!(error, FinalReviewReceiptIssue::DeviationRecordMismatch);
    assert_eq!(
        error.reason_code(),
        "review_receipt_deviation_record_mismatch"
    );
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

#[test]
fn resolve_release_base_branch_reads_common_git_dir_in_worktrees() {
    let (repo_dir, _state_dir) = init_repo("plan-execution-final-review-worktree-base-branch");
    let repo = repo_dir.path();
    let worktree_root = repo.join("worktrees").join("review-lane");

    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["config", "branch.review-lane.gh-merge-base", "fixture-work"])
                .current_dir(repo);
            command
        },
        "git config branch.review-lane.gh-merge-base",
    );
    run_checked(
        {
            let mut command = Command::new("git");
            command
                .args([
                    "worktree",
                    "add",
                    "-b",
                    "review-lane",
                    worktree_root
                        .to_str()
                        .expect("worktree path should be utf-8"),
                ])
                .current_dir(repo);
            command
        },
        "git worktree add review-lane",
    );

    let git_dir = git_dir_path(&worktree_root);
    assert_eq!(
        resolve_release_base_branch(&git_dir, "review-lane").as_deref(),
        Some("fixture-work")
    );
}

#[test]
fn latest_branch_artifact_path_prefers_timestamp_over_username_prefix() {
    let artifact_dir = TempDir::new().expect("artifact tempdir should exist");
    let branch = "fixture-work";

    write_file(
        &artifact_dir
            .path()
            .join("zoe-fixture-work-code-review-20260322-171000.md"),
        &format!("# Code Review Result\n**Branch:** {branch}\n"),
    );
    let newest = artifact_dir
        .path()
        .join("alice-fixture-work-code-review-20260322-171100.md");
    write_file(
        &newest,
        &format!("# Code Review Result\n**Branch:** {branch}\n"),
    );

    assert_eq!(
        latest_branch_artifact_path(artifact_dir.path(), branch, "code-review").as_deref(),
        Some(newest.as_path())
    );
}

fn run_plan_execution_json(
    repo: &Path,
    state: &Path,
    args: &[&str],
    context: &str,
) -> serde_json::Value {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state)
        .args(["plan", "execution"])
        .args(args);
    parse_json(&run(command, context), context)
}

#[test]
fn gate_finish_requires_final_review_artifact() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-missing-review");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    write_release_readiness_artifact(repo, state, &expected_base_branch(repo));

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should run",
    );

    assert_eq!(
        gate["allowed"], false,
        "missing review artifact should block finish"
    );
    assert!(
        gate["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes.iter().any(|code| code == "review_artifact_missing")),
        "gate-finish should require a final review artifact"
    );
}

#[test]
fn gate_finish_accepts_fresh_non_browser_review_chain() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-pass");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should run",
    );

    assert_eq!(
        gate["allowed"], true,
        "fresh late-stage artifacts should allow finish"
    );
}

#[test]
fn gate_finish_rejects_review_without_dedicated_provenance() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-missing-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let review_source = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        review_source.replace(
            "**Reviewer Provenance:** dedicated-independent",
            "**Reviewer Provenance:** implementation-context",
        ),
    )
    .expect("review artifact should be writable");
    write_release_readiness_artifact(repo, state, &base_branch);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should reject non-dedicated final review provenance",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "review_receipt_not_dedicated")),
        "gate-finish should reject final review artifacts without dedicated-independent provenance"
    );
}

#[test]
fn gate_finish_rejects_review_with_non_independent_reviewer_source() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-non-independent-reviewer-source");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let review_source = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        review_source.replace(
            "**Reviewer Source:** fresh-context-subagent",
            "**Reviewer Source:** implementation-context",
        ),
    )
    .expect("review artifact should be writable");
    write_release_readiness_artifact(repo, state, &base_branch);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should reject non-independent reviewer source",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "review_receipt_reviewer_source_not_independent")),
        "gate-finish should reject final review artifacts with non-independent reviewer source"
    );
}

#[test]
fn gate_finish_rejects_review_without_reviewer_artifact_path() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-missing-reviewer-artifact-path");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let receipt = parse_final_review_receipt(&review_path);
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .expect("fixture review artifact should include reviewer artifact path");
    let review_source = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        review_source.replace(
            &format!("**Reviewer Artifact Path:** `{reviewer_artifact_path}`\n"),
            "",
        ),
    )
    .expect("review artifact should be writable");
    write_release_readiness_artifact(repo, state, &base_branch);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should reject missing reviewer artifact path",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "review_receipt_reviewer_artifact_path_missing")),
        "gate-finish should reject final review artifacts missing reviewer artifact path"
    );
}

#[test]
fn gate_finish_rejects_review_with_unreadable_reviewer_artifact_path() {
    let (repo_dir, state_dir) =
        init_repo("plan-execution-final-review-unreadable-reviewer-artifact-path");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let reviewer_artifact_path = reviewer_artifact_path_from_review(&review_path);
    fs::remove_file(&reviewer_artifact_path).expect("reviewer artifact should remove");
    write_release_readiness_artifact(repo, state, &base_branch);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should reject unreadable reviewer artifact path",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| codes
            .iter()
            .any(|code| code == "review_receipt_reviewer_artifact_unreadable")),
        "gate-finish should reject final review artifacts with unreadable reviewer artifact path"
    );
    assert_eq!(gate["failure_class"], "ReviewArtifactNotFresh");
}

#[test]
fn gate_finish_rejects_review_with_invalid_deviation_verdict() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-invalid-deviation-verdict");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    let review_path = write_code_review_artifact(repo, state, &base_branch);
    let review_source = fs::read_to_string(&review_path).expect("review artifact should read");
    fs::write(
        &review_path,
        review_source
            .replace(
                "**Recorded Execution Deviations:** none",
                "**Recorded Execution Deviations:** present",
            )
            .replace(
                "**Deviation Review Verdict:** not_required",
                "**Deviation Review Verdict:** fail",
            ),
    )
    .expect("review artifact should be writable");
    write_release_readiness_artifact(repo, state, &base_branch);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should reject invalid deviation verdicts",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| {
            codes
                .iter()
                .any(|code| code == "review_receipt_deviation_record_mismatch")
        }),
        "gate-finish should reject final review artifacts that claim deviations when the runtime recorded none"
    );
}

#[test]
fn gate_finish_requires_deviation_review_when_runtime_records_topology_downgrade() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-runtime-recorded-deviation");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);
    let active_contract_fingerprint = write_active_contract_artifact(repo, state);
    write_serial_unit_review_receipt(repo, state, &active_contract_fingerprint);
    write_finish_ready_harness_state_with_reason_codes(repo, state, &[]);
    write_matching_topology_downgrade_record(repo, state, &base_branch);

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should require explicit deviation review when runtime recorded a topology downgrade",
    );

    assert_eq!(gate["allowed"], false);
    assert!(
        gate["reason_codes"].as_array().is_some_and(|codes| {
            codes
                .iter()
                .any(|code| code == "review_receipt_deviation_record_mismatch")
        }),
        "gate-finish should reject final review artifacts that deny runtime-recorded deviations"
    );
}

#[test]
fn gate_finish_ignores_reason_code_deviation_without_matching_downgrade_record() {
    let (repo_dir, state_dir) = init_repo("plan-execution-final-review-reason-code-no-record");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_approved_spec(repo);
    write_single_step_plan(repo, "featureforge:executing-plans");
    mark_all_plan_steps_checked(repo);
    write_single_step_v2_completed_attempt(repo, &expected_packet_fingerprint(repo, 1, 1));
    write_test_plan_artifact(repo, state, "no");
    let base_branch = expected_base_branch(repo);
    write_code_review_artifact(repo, state, &base_branch);
    write_release_readiness_artifact(repo, state, &base_branch);
    let active_contract_fingerprint = write_active_contract_artifact(repo, state);
    write_serial_unit_review_receipt(repo, state, &active_contract_fingerprint);
    write_finish_ready_harness_state_with_reason_codes(
        repo,
        state,
        &["recorded_execution_deviation_dependency_mismatch"],
    );

    let gate = run_plan_execution_json(
        repo,
        state,
        &["gate-finish", "--plan", PLAN_REL],
        "gate-finish should ignore reason-code-only deviation hints",
    );
    assert_eq!(gate["allowed"], true);
}
