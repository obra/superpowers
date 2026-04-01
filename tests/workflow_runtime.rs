#[path = "support/bin.rs"]
mod bin_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "../src/workflow/markdown_scan.rs"]
mod markdown_scan_support;
#[path = "support/process.rs"]
mod process_support;
#[path = "support/workflow.rs"]
mod workflow_support;

use assert_cmd::cargo::cargo_bin;
use bin_support::compiled_featureforge_path;
use featureforge::contracts::spec::parse_spec_file;
use featureforge::execution::observability::{
    HarnessEventKind, HarnessObservabilityEvent, HarnessTelemetryCounters, STABLE_EVENT_KINDS,
    STABLE_REASON_CODES,
};
use featureforge::git::{RepositoryIdentity, discover_repo_identity};
use featureforge::paths::{
    branch_storage_key, harness_authoritative_artifact_path, harness_state_path,
};
use featureforge::workflow::manifest::{
    WorkflowManifest, manifest_path, recover_slug_changed_manifest,
};
use featureforge::workflow::status::WorkflowRuntime;
use files_support::write_file;
use json_support::parse_json;
use process_support::{repo_root, run, run_checked};
use serde_json::{Value, json, to_value};
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::fs;
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;
use workflow_support::{init_repo as init_workflow_repo, workflow_fixture_root};

const FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT: &str =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

fn normalize_workflow_status_snapshot(mut value: Value) -> Value {
    let object = value
        .as_object_mut()
        .expect("workflow status payload should stay a JSON object");
    object.remove("manifest_path");
    object.remove("root");
    value
}

fn write_manifest(path: &Path, manifest: &WorkflowManifest) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("manifest parent should be creatable");
    }
    let json = serde_json::to_string(manifest).expect("manifest json should serialize");
    fs::write(path, json).expect("manifest should be writable");
}

struct PlanFidelityReviewArtifactInput<'a> {
    artifact_rel: &'a str,
    plan_path: &'a str,
    plan_revision: u32,
    spec_path: &'a str,
    spec_revision: u32,
    review_verdict: &'a str,
    reviewer_source: &'a str,
    reviewer_id: &'a str,
    verified_surfaces: &'a [&'a str],
}

fn write_plan_fidelity_review_artifact(repo: &Path, input: PlanFidelityReviewArtifactInput<'_>) {
    let artifact_path = repo.join(input.artifact_rel);
    let plan_fingerprint =
        sha256_hex(&fs::read(repo.join(input.plan_path)).expect("plan should be readable"));
    let spec_fingerprint =
        sha256_hex(&fs::read(repo.join(input.spec_path)).expect("spec should be readable"));
    let verified_requirement_ids = parse_spec_file(repo.join(input.spec_path))
        .map(|spec| {
            spec.requirements
                .iter()
                .map(|requirement| requirement.id.clone())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    if let Some(parent) = artifact_path.parent() {
        fs::create_dir_all(parent).expect("review artifact parent should exist");
    }
    fs::write(
        artifact_path,
        format!(
            "## Plan Fidelity Review Summary\n\n**Review Stage:** featureforge:plan-fidelity-review\n**Review Verdict:** {review_verdict}\n**Reviewed Plan:** `{plan_path}`\n**Reviewed Plan Revision:** {plan_revision}\n**Reviewed Plan Fingerprint:** {plan_fingerprint}\n**Reviewed Spec:** `{spec_path}`\n**Reviewed Spec Revision:** {spec_revision}\n**Reviewed Spec Fingerprint:** {spec_fingerprint}\n**Reviewer Source:** {reviewer_source}\n**Reviewer ID:** {reviewer_id}\n**Distinct From Stages:** featureforge:writing-plans, featureforge:plan-eng-review\n**Verified Surfaces:** {}\n**Verified Requirement IDs:** {}\n",
            input.verified_surfaces.join(", "),
            verified_requirement_ids.join(", "),
            review_verdict = input.review_verdict,
            plan_path = input.plan_path,
            plan_revision = input.plan_revision,
            spec_path = input.spec_path,
            spec_revision = input.spec_revision,
            reviewer_source = input.reviewer_source,
            reviewer_id = input.reviewer_id,
        ),
    )
    .expect("plan-fidelity review artifact should write");
}

fn write_minimal_plan_fidelity_spec(repo: &Path, spec_path: &str) {
    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n\n## Requirement Index\n\n- [REQ-001][behavior] The draft plan must complete an independent fidelity review before engineering review.\n",
    );
}

fn public_harness_phases_from_spec() -> Vec<String> {
    let spec = include_str!(
        "../docs/archive/featureforge/specs/2026-03-25-featureforge-execution-harness-spec.md"
    );
    spec.lines()
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
        .collect()
}

fn public_harness_phase_from_spec(phase: &str) -> String {
    public_harness_phases_from_spec()
        .into_iter()
        .find(|candidate| candidate == phase)
        .unwrap_or_else(|| {
            panic!("spec should include `{phase}` in the public harness phase model section")
        })
}

fn init_repo(test_name: &str) -> (TempDir, TempDir) {
    let (repo_dir, state_dir) = init_workflow_repo(test_name);
    let repo_path = repo_dir.path();

    let mut git_remote_add = Command::new("git");
    git_remote_add
        .args([
            "remote",
            "add",
            "origin",
            &format!("git@github.com:example/{test_name}.git"),
        ])
        .current_dir(repo_path);
    run_checked(git_remote_add, "git remote add origin");

    (repo_dir, state_dir)
}

fn inject_current_topology_sections(plan_source: &str) -> String {
    const INSERT_AFTER: &str = "## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n- REQ-004 -> Task 1\n- VERIFY-001 -> Task 1\n";
    const TOPOLOGY_BLOCK: &str = "\n## Execution Strategy\n\n- Execute Task 1 last. It is the only task in this fixture and closes the execution graph for route-time workflow validation.\n\n## Dependency Diagram\n\n```text\nTask 1\n```\n";

    if plan_source.contains("## Execution Strategy")
        && plan_source.contains("## Dependency Diagram")
    {
        return plan_source.to_owned();
    }

    plan_source.replacen(INSERT_AFTER, &format!("{INSERT_AFTER}{TOPOLOGY_BLOCK}"), 1)
}

fn install_full_contract_ready_artifacts(repo: &Path) {
    let spec_rel = "docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let fixture_root = workflow_fixture_root();
    let spec_path = repo.join(spec_rel);
    let plan_path = repo.join(plan_rel);

    if let Some(parent) = spec_path.parent() {
        fs::create_dir_all(parent).expect("spec fixture parent should be creatable");
    }
    fs::copy(
        fixture_root.join("specs/2026-03-22-runtime-integration-hardening-design.md"),
        &spec_path,
    )
    .expect("spec fixture should copy");

    if let Some(parent) = plan_path.parent() {
        fs::create_dir_all(parent).expect("plan fixture parent should be creatable");
    }
    let plan_source =
        fs::read_to_string(fixture_root.join("plans/2026-03-22-runtime-integration-hardening.md"))
            .expect("plan fixture should load");
    let adjusted_plan = inject_current_topology_sections(&plan_source).replace(
        "tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md",
        spec_rel,
    );
    fs::write(&plan_path, adjusted_plan).expect("plan fixture should write");
}

#[cfg(unix)]
fn create_dir_symlink(target: &Path, link: &Path) {
    std::os::unix::fs::symlink(target, link).expect("directory symlink should be creatable");
}

#[cfg(windows)]
fn create_dir_symlink(target: &Path, link: &Path) {
    std::os::windows::fs::symlink_dir(target, link).expect("directory symlink should be creatable");
}

fn run_shell_status_helper(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command = Command::new(compiled_featureforge_path());
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["workflow"])
        .args(args);
    run(command, context)
}

fn run_shell_status_json(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Value {
    let output = run_shell_status_helper(repo, state_dir, args, context);
    parse_json(&output, context)
}

fn run_rust_featureforge(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command = Command::new(compiled_featureforge_path());
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn run_workflow_plan_fidelity_json(
    repo: &Path,
    state_dir: &Path,
    args: &[&str],
    context: &str,
) -> Value {
    let mut command = Command::new(compiled_featureforge_path());
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["workflow", "plan-fidelity"])
        .args(args);
    parse_json(&run(command, context), context)
}

fn run_workflow_plan_fidelity_json_from_dir(
    current_dir: &Path,
    state_dir: &Path,
    args: &[&str],
    context: &str,
) -> Value {
    let mut command = Command::new(compiled_featureforge_path());
    command
        .current_dir(current_dir)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["workflow", "plan-fidelity"])
        .args(args);
    parse_json(&run(command, context), context)
}

fn run_rust_featureforge_with_env(
    repo: &Path,
    state_dir: &Path,
    args: &[&str],
    extra_env: &[(&str, &str)],
    context: &str,
) -> Output {
    let mut command = Command::new(compiled_featureforge_path());
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(args);
    for (key, value) in extra_env {
        command.env(key, value);
    }
    run(command, context)
}

fn missing_null_fields(object: &Value, fields: &[&str]) -> Vec<String> {
    fields
        .iter()
        .copied()
        .filter(|field| !object.get(*field).is_some_and(Value::is_null))
        .map(str::to_owned)
        .collect()
}

fn set_remote_url(repo: &Path, url: &str) {
    let mut git_remote_set = Command::new("git");
    git_remote_set
        .args(["remote", "set-url", "origin", url])
        .current_dir(repo);
    run_checked(git_remote_set, "git remote set-url origin");
}

fn remove_origin_remote(repo: &Path) {
    let mut git_remote_remove = Command::new("git");
    git_remote_remove
        .args(["remote", "remove", "origin"])
        .current_dir(repo);
    run_checked(git_remote_remove, "git remote remove origin");
}

fn run_plan_execution_json(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Value {
    let mut command = Command::new(compiled_featureforge_path());
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["plan", "execution"])
        .args(args);
    parse_json(&run(command, context), context)
}

fn current_branch_name(repo: &Path) -> String {
    let mut command = Command::new("git");
    command
        .args(["rev-parse", "--abbrev-ref", "HEAD"])
        .current_dir(repo);
    let output = run_checked(command, "git rev-parse --abbrev-ref HEAD");
    String::from_utf8(output.stdout)
        .expect("branch output should be utf-8")
        .trim()
        .to_owned()
}

fn expected_release_base_branch(repo: &Path) -> String {
    const COMMON_BASE_BRANCHES: [&str; 5] = ["main", "master", "develop", "dev", "trunk"];

    let current_branch = current_branch_name(repo);
    if COMMON_BASE_BRANCHES.contains(&current_branch.as_str()) {
        return current_branch;
    }

    let output = run_checked(
        {
            let mut command = Command::new("git");
            command
                .args(["for-each-ref", "--format=%(refname:short)", "refs/heads"])
                .current_dir(repo);
            command
        },
        "git for-each-ref refs/heads for expected base branch",
    );
    let branches = String::from_utf8(output.stdout)
        .expect("branch listing output should be utf-8")
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(str::to_owned)
        .collect::<BTreeSet<_>>();
    for candidate in COMMON_BASE_BRANCHES {
        if branches.contains(candidate) {
            return candidate.to_owned();
        }
    }
    current_branch
}

fn current_head_sha(repo: &Path) -> String {
    let mut command = Command::new("git");
    command.args(["rev-parse", "HEAD"]).current_dir(repo);
    let output = run_checked(command, "git rev-parse HEAD");
    String::from_utf8(output.stdout)
        .expect("head sha output should be utf-8")
        .trim()
        .to_owned()
}

fn repo_slug(repo: &Path) -> String {
    let output = run_checked(
        {
            let mut command = Command::new(compiled_featureforge_path());
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
    plan_rel: &str,
    plan_revision: u32,
) -> (String, String) {
    let branch = current_branch_name(repo);
    let status_json = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status for authoritative serial unit-review fixture",
    );
    let execution_run_id = status_json["execution_run_id"].as_str().expect(
        "status should expose execution_run_id for authoritative serial unit-review fixture",
    );
    let approved_task_packet_fingerprint = status_json["latest_packet_fingerprint"]
        .as_str()
        .expect(
            "status should expose latest_packet_fingerprint for authoritative serial unit-review fixture",
        );
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
            "run={execution_run_id}\nunit={execution_unit_id}\nplan={plan_rel}\nplan_revision={plan_revision}\nbranch={branch}\nreviewed_checkpoint={reviewed_checkpoint_commit_sha}\n"
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
        "# Unit Review Result\n**Review Stage:** featureforge:unit-review\n**Reviewer Provenance:** dedicated-independent\n**Source Plan:** {plan_rel}\n**Source Plan Revision:** {plan_revision}\n**Execution Run ID:** {execution_run_id}\n**Execution Unit ID:** {execution_unit_id}\n**Lease Fingerprint:** {lease_fingerprint}\n**Execution Context Key:** {execution_context_key}\n**Approved Task Packet Fingerprint:** {approved_task_packet_fingerprint}\n**Approved Unit Contract Fingerprint:** {approved_unit_contract_fingerprint}\n**Reconciled Result SHA:** {reviewed_checkpoint_commit_sha}\n**Reconcile Result Proof Fingerprint:** {reconcile_result_proof_fingerprint}\n**Reconcile Mode:** identity_preserving\n**Reviewed Worktree:** {}\n**Reviewed Checkpoint SHA:** {reviewed_checkpoint_commit_sha}\n**Result:** pass\n**Generated By:** featureforge:unit-review\n**Generated At:** 2026-03-28T12:00:00Z\n",
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
        active_contract_path,
        active_contract_fingerprint.to_string(),
    )
}

fn project_artifact_dir(repo: &Path, state_dir: &Path) -> PathBuf {
    state_dir.join("projects").join(repo_slug(repo))
}

fn write_branch_test_plan_artifact(
    repo: &Path,
    state_dir: &Path,
    plan_rel: &str,
    browser_required: &str,
) -> PathBuf {
    let branch = current_branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let head_sha = current_head_sha(repo);
    let artifact_path = project_artifact_dir(repo, state_dir)
        .join(format!("tester-{safe_branch}-test-plan-20260324-120000.md"));
    write_file(
        &artifact_path,
        &format!(
            "# Test Plan\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Head SHA:** {head_sha}\n**Browser QA Required:** {browser_required}\n**Generated By:** featureforge:plan-eng-review\n**Generated At:** 2026-03-24T12:00:00Z\n\n## Affected Pages / Routes\n- none\n\n## Key Interactions\n- late-stage workflow routing uses this artifact for QA scoping\n\n## Edge Cases\n- current-branch artifact freshness must stay aligned with the approved plan revision\n\n## Critical Paths\n- branch completion stays blocked until review, QA, and release-readiness artifacts are fresh when required\n",
            repo_slug(repo)
        ),
    );
    artifact_path
}

fn write_branch_review_artifact(
    repo: &Path,
    state_dir: &Path,
    plan_rel: &str,
    base_branch: &str,
) -> PathBuf {
    let branch = current_branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let strategy_checkpoint_fingerprint = run_plan_execution_json(
        repo,
        state_dir,
        &["status", "--plan", plan_rel],
        "plan execution status for workflow review artifact fixture",
    )["last_strategy_checkpoint_fingerprint"]
        .as_str()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(FIXTURE_STRATEGY_CHECKPOINT_FINGERPRINT)
        .to_owned();
    let reviewer_artifact_path = project_artifact_dir(repo, state_dir).join(format!(
        "tester-{safe_branch}-independent-review-20260324-120950.md"
    ));
    let reviewer_artifact_source = format!(
        "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Strategy Checkpoint Fingerprint:** {strategy_checkpoint_fingerprint}\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {}\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-24T12:09:50Z\n\n## Summary\n- dedicated independent reviewer artifact fixture.\n",
        repo_slug(repo),
        current_head_sha(repo)
    );
    write_file(&reviewer_artifact_path, &reviewer_artifact_source);
    let reviewer_artifact_fingerprint =
        sha256_hex(&fs::read(&reviewer_artifact_path).expect("reviewer artifact should read"));
    let artifact_path = project_artifact_dir(repo, state_dir).join(format!(
        "tester-{safe_branch}-code-review-20260324-121000.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# Code Review Result\n**Review Stage:** featureforge:requesting-code-review\n**Reviewer Provenance:** dedicated-independent\n**Reviewer Source:** fresh-context-subagent\n**Reviewer ID:** reviewer-fixture-001\n**Strategy Checkpoint Fingerprint:** {strategy_checkpoint_fingerprint}\n**Reviewer Artifact Path:** `{}`\n**Reviewer Artifact Fingerprint:** {reviewer_artifact_fingerprint}\n**Distinct From Stages:** featureforge:executing-plans, featureforge:subagent-driven-development\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {}\n**Recorded Execution Deviations:** none\n**Deviation Review Verdict:** not_required\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-24T12:10:00Z\n\n## Summary\n- synthetic code-review fixture for workflow phase coverage.\n",
            reviewer_artifact_path.display(),
            repo_slug(repo),
            current_head_sha(repo)
        ),
    );
    artifact_path
}

fn write_branch_release_artifact(
    repo: &Path,
    state_dir: &Path,
    plan_rel: &str,
    base_branch: &str,
) -> PathBuf {
    let branch = current_branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let artifact_path = project_artifact_dir(repo, state_dir).join(format!(
        "tester-{safe_branch}-release-readiness-20260324-121500.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# Release Readiness Result\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {}\n**Result:** pass\n**Generated By:** featureforge:document-release\n**Generated At:** 2026-03-24T12:15:00Z\n\n## Summary\n- synthetic release-readiness fixture for workflow phase coverage.\n",
            repo_slug(repo),
            current_head_sha(repo)
        ),
    );
    artifact_path
}

fn write_branch_qa_artifact(
    repo: &Path,
    state_dir: &Path,
    plan_rel: &str,
    test_plan_path: &Path,
) -> PathBuf {
    let branch = current_branch_name(repo);
    let safe_branch = branch_storage_key(&branch);
    let artifact_path = project_artifact_dir(repo, state_dir).join(format!(
        "tester-{safe_branch}-test-outcome-20260324-121200.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# QA Result\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Source Test Plan:** `{}`\n**Branch:** {branch}\n**Repo:** {}\n**Head SHA:** {}\n**Result:** pass\n**Generated By:** featureforge:qa-only\n**Generated At:** 2026-03-24T12:12:00Z\n\n## Summary\n- synthetic QA fixture for workflow late-gate downstream provenance coverage.\n",
            test_plan_path.display(),
            repo_slug(repo),
            current_head_sha(repo)
        ),
    );
    artifact_path
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

fn prepare_preflight_acceptance_workspace(repo: &Path, branch_name: &str) {
    let mut checkout = Command::new("git");
    checkout
        .args(["checkout", "-B", branch_name])
        .current_dir(repo);
    run_checked(checkout, "git checkout preflight acceptance branch");
}

fn complete_workflow_fixture_execution(repo: &Path, state: &Path, plan_rel: &str) {
    install_full_contract_ready_artifacts(repo);
    write_file(
        &repo.join("tests/workflow_runtime.rs"),
        "synthetic route proof\n",
    );
    prepare_preflight_acceptance_workspace(repo, "workflow-runtime-fixture");

    let status_json = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status before workflow routing fixture",
    );
    let preflight_json = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "plan execution preflight before workflow routing fixture",
    );
    assert_eq!(preflight_json["allowed"], true);
    let begin_json = run_plan_execution_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_json["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "plan execution begin for workflow routing fixture",
    );
    run_plan_execution_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Completed the routing fixture task.",
            "--manual-verify-summary",
            "Verified by workflow runtime fixture setup.",
            "--file",
            "tests/workflow_runtime.rs",
            "--expect-execution-fingerprint",
            begin_json["execution_fingerprint"]
                .as_str()
                .expect("begin fingerprint should be present"),
        ],
        "plan execution complete for workflow routing fixture",
    );
}

fn update_authoritative_harness_state(
    repo: &Path,
    state: &Path,
    branch: &str,
    plan_rel: &str,
    plan_revision: u32,
    updates: &[(&str, Value)],
) {
    let authoritative_state_path = harness_state_path(state, &repo_slug(repo), branch);
    let mut payload: Value = match fs::read_to_string(&authoritative_state_path) {
        Ok(source) => serde_json::from_str(&source)
            .expect("authoritative harness state should stay valid json"),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            let status_json = run_plan_execution_json(
                repo,
                state,
                &["status", "--plan", plan_rel],
                "status for synthesized authoritative harness state",
            );
            let execution_run_id = status_json["execution_run_id"]
                .as_str()
                .expect("status should expose execution_run_id for synthesized authoritative state")
                .to_string();
            let chunk_id = status_json["chunk_id"].as_str().map(str::to_owned);
            let mut object = serde_json::Map::new();
            object.insert("schema_version".to_string(), Value::from(1));
            object.insert(
                "run_identity".to_string(),
                Value::Object(serde_json::Map::from_iter([
                    (
                        "execution_run_id".to_string(),
                        Value::from(execution_run_id),
                    ),
                    ("source_plan_path".to_string(), Value::from(plan_rel)),
                    (
                        "source_plan_revision".to_string(),
                        Value::from(plan_revision),
                    ),
                ])),
            );
            if let Some(chunk_id) = chunk_id {
                object.insert("chunk_id".to_string(), Value::from(chunk_id));
            }
            object.insert(
                "active_worktree_lease_fingerprints".to_string(),
                Value::Array(Vec::new()),
            );
            object.insert(
                "active_worktree_lease_bindings".to_string(),
                Value::Array(Vec::new()),
            );
            Value::Object(object)
        }
        Err(error) => {
            panic!("authoritative harness state should be readable for fixture mutation: {error}")
        }
    };
    let object = payload
        .as_object_mut()
        .expect("authoritative harness state should remain a json object");
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
    for (key, value) in updates {
        object.insert((*key).to_string(), value.clone());
    }
    write_file(
        &authoritative_state_path,
        &serde_json::to_string(&payload).expect("authoritative harness state should serialize"),
    );
}

fn publish_authoritative_final_review_truth(
    repo: &Path,
    state: &Path,
    plan_rel: &str,
    review_path: &Path,
) {
    let branch = current_branch_name(repo);
    let review_source = fs::read_to_string(review_path)
        .expect("workflow review artifact should be readable for authoritative publication");
    let review_fingerprint = sha256_hex(review_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("final-review-{review_fingerprint}.md"),
        ),
        &review_source,
    );
    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[
            ("dependency_index_state", Value::from("fresh")),
            ("final_review_state", Value::from("fresh")),
            ("browser_qa_state", Value::from("not_required")),
            ("release_docs_state", Value::from("not_required")),
            (
                "last_final_review_artifact_fingerprint",
                Value::from(review_fingerprint),
            ),
        ],
    );
}

fn write_dispatched_branch_review_artifact(
    repo: &Path,
    state: &Path,
    plan_rel: &str,
    base_branch: &str,
) -> PathBuf {
    let initial_review_path = write_branch_review_artifact(repo, state, plan_rel, base_branch);
    publish_authoritative_final_review_truth(repo, state, plan_rel, &initial_review_path);
    let gate_review = run_plan_execution_json(
        repo,
        state,
        &["gate-review-dispatch", "--plan", plan_rel],
        "plan execution gate-review dispatch for workflow review fixture",
    );
    assert_eq!(
        gate_review["allowed"],
        Value::Bool(true),
        "workflow review fixture should prime a passing gate-review dispatch before minting a final-review artifact: {gate_review:?}"
    );
    let review_path = write_branch_review_artifact(repo, state, plan_rel, base_branch);
    publish_authoritative_final_review_truth(repo, state, plan_rel, &review_path);
    review_path
}

fn enable_session_decision(state: &Path, session_key: &str) {
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    write_file(&decision_path, "enabled\n");
}

#[test]
fn shell_workflow_resolve_exposes_wrapper_contract_fields() {
    let (repo_dir, state_dir) = init_repo("workflow-resolve-contract");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let resolve_json = run_shell_status_json(
        repo,
        state,
        &["resolve"],
        "shell helper resolve wrapper contract",
    );
    let resolved_root = PathBuf::from(
        resolve_json["root"]
            .as_str()
            .expect("resolve root should stay a string"),
    );

    assert_eq!(resolve_json["outcome"], "resolved");
    assert_eq!(
        fs::canonicalize(&resolved_root).expect("resolved root should canonicalize"),
        fs::canonicalize(repo).expect("repo root should canonicalize"),
    );
    assert_eq!(
        resolve_json["manifest_source_path"],
        resolve_json["manifest_path"]
    );
}

#[test]
fn shell_workflow_resolve_failures_use_runtime_failure_contract() {
    let outside_repo = TempDir::new().expect("outside repo tempdir should be available");
    let state_dir = TempDir::new().expect("state tempdir should be available");

    let output = run_shell_status_helper(
        outside_repo.path(),
        state_dir.path(),
        &["resolve"],
        "shell helper resolve failure contract",
    );
    assert!(
        !output.status.success(),
        "resolve outside repo should fail, got {:?}",
        output.status
    );

    let failure: Value = serde_json::from_slice(&output.stderr)
        .expect("resolve failure should emit valid json on stderr");
    assert_eq!(failure["outcome"], "runtime_failure");
    assert_eq!(failure["failure_class"], "RepoContextUnavailable");
}

#[test]
fn canonical_workflow_status_matches_helper_for_manifest_backed_missing_spec() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-manifest-backed");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let missing_spec = "docs/featureforge/specs/2026-03-24-rust-missing-spec-design.md";

    let helper_expect = run_shell_status_helper(
        repo,
        state,
        &["expect", "--artifact", "spec", "--path", missing_spec],
        "shell helper expect for missing spec",
    );
    assert!(
        helper_expect.status.success(),
        "shell helper expect should succeed, got {:?}",
        helper_expect.status
    );

    let helper_json = run_shell_status_json(
        repo,
        state,
        &["status", "--refresh"],
        "shell helper status refresh for missing spec",
    );
    let rust_output = run_rust_featureforge(
        repo,
        state,
        &["workflow", "status", "--refresh"],
        "rust canonical workflow status refresh for missing spec",
    );
    let rust_json = parse_json(
        &rust_output,
        "rust canonical workflow status refresh for missing spec",
    );

    assert_eq!(rust_json["status"], helper_json["status"]);
    assert_eq!(rust_json["next_skill"], helper_json["next_skill"]);
    assert_eq!(rust_json["spec_path"], helper_json["spec_path"]);
    assert_eq!(rust_json["reason"], helper_json["reason"]);
    assert_eq!(rust_json["reason_codes"], helper_json["reason_codes"]);
    assert_eq!(rust_json["diagnostics"], helper_json["diagnostics"]);
}

#[test]
fn canonical_workflow_status_matches_helper_for_ambiguous_specs() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-ambiguity");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let fixture_root = workflow_fixture_root();

    fs::create_dir_all(repo.join("docs/featureforge/specs"))
        .expect("specs directory should be creatable");
    fs::copy(
        fixture_root.join("specs/2026-01-22-document-review-system-design.md"),
        repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design.md"),
    )
    .expect("first fixture spec should copy");
    fs::copy(
        fixture_root.join("specs/2026-02-19-visual-brainstorming-refactor-design.md"),
        repo.join("docs/featureforge/specs/2026-02-19-visual-brainstorming-refactor-design.md"),
    )
    .expect("second fixture spec should copy");

    let _helper_warmup = run_shell_status_json(
        repo,
        state,
        &["status", "--refresh"],
        "shell helper status refresh for ambiguous specs",
    );
    let helper_json = run_shell_status_json(
        repo,
        state,
        &["status", "--refresh"],
        "shell helper status refresh for ambiguous specs after manifest warmup",
    );
    let rust_output = run_rust_featureforge(
        repo,
        state,
        &["workflow", "status", "--refresh"],
        "rust canonical workflow status refresh for ambiguous specs",
    );
    let rust_json = parse_json(
        &rust_output,
        "rust canonical workflow status refresh for ambiguous specs",
    );

    assert_eq!(rust_json["status"], helper_json["status"]);
    assert_eq!(rust_json["next_skill"], helper_json["next_skill"]);
    assert_eq!(rust_json["reason"], helper_json["reason"]);
    assert_eq!(rust_json["reason_codes"], helper_json["reason_codes"]);
    assert_eq!(
        rust_json["spec_candidate_count"],
        helper_json["spec_candidate_count"]
    );
}

#[test]
fn canonical_workflow_status_ambiguous_specs_matches_checked_in_snapshot() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-ambiguity-snapshot");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let fixture_root = workflow_fixture_root();

    fs::create_dir_all(repo.join("docs/featureforge/specs"))
        .expect("specs directory should be creatable");
    fs::copy(
        fixture_root.join("specs/2026-01-22-document-review-system-design.md"),
        repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design.md"),
    )
    .expect("first fixture spec should copy");
    fs::copy(
        fixture_root.join("specs/2026-01-22-document-review-system-design-v2.md"),
        repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design-v2.md"),
    )
    .expect("second fixture spec should copy");

    let actual = normalize_workflow_status_snapshot(parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for ambiguous-spec snapshot",
        ),
        "rust canonical workflow status refresh for ambiguous-spec snapshot",
    ));
    let expected: Value = serde_json::from_str(
        &fs::read_to_string(repo_root().join("tests/fixtures/differential/workflow-status.json"))
            .expect("checked-in workflow-status snapshot should be readable"),
    )
    .expect("checked-in workflow-status snapshot should parse");

    assert_eq!(actual, expected);
}

#[test]
fn canonical_workflow_expect_and_sync_preserve_missing_spec_semantics() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-expect-sync");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let missing_spec = "docs/featureforge/specs/2026-03-24-rust-sync-missing-spec.md";
    let session_key = "workflow-runtime-expect-sync";

    let expect_output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "expect",
            "--artifact",
            "spec",
            "--path",
            missing_spec,
        ],
        "rust canonical workflow expect missing spec",
    );
    assert!(
        expect_output.status.success(),
        "rust canonical workflow expect should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        expect_output.status,
        String::from_utf8_lossy(&expect_output.stdout),
        String::from_utf8_lossy(&expect_output.stderr)
    );

    let sync_output = run_rust_featureforge(
        repo,
        state,
        &["workflow", "sync", "--artifact", "spec"],
        "rust canonical workflow sync missing spec",
    );
    assert!(
        sync_output.status.success(),
        "rust canonical workflow sync should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        sync_output.status,
        String::from_utf8_lossy(&sync_output.stdout),
        String::from_utf8_lossy(&sync_output.stderr)
    );
    let sync_stdout =
        String::from_utf8(sync_output.stdout).expect("sync output should be valid utf-8");
    assert!(sync_stdout.contains("missing_artifact"));
    assert!(sync_stdout.contains(missing_spec));
    assert!(sync_stdout.contains("featureforge:brainstorming"));

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh after sync",
        ),
        "rust canonical workflow status refresh after sync",
    );
    assert_eq!(status_json["status"], "needs_brainstorming");
    assert_eq!(status_json["spec_path"], missing_spec);
    assert_eq!(status_json["reason"], "missing_expected_spec");
    assert_eq!(status_json["reason_codes"][0], "missing_expected_spec");

    write_file(
        &state
            .join("session-entry")
            .join("using-featureforge")
            .join(session_key),
        "enabled\n",
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow phase after missing-spec sync",
        ),
        "rust canonical workflow phase after missing-spec sync",
    );
    assert_eq!(phase_json["phase"], "needs_brainstorming");
    assert_eq!(phase_json["next_skill"], "featureforge:brainstorming");
    assert_eq!(phase_json["next_action"], "use_next_skill");
}

#[test]
fn canonical_workflow_status_routes_draft_plan_to_eng_review_after_matching_pass_receipt() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-pass");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-pass.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-019d",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    let receipt_json = run_workflow_plan_fidelity_json(
        repo,
        state,
        &[
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-pass.md",
            "--json",
        ],
        "workflow plan-fidelity record should succeed for matching draft plan",
    );
    assert_eq!(receipt_json["status"], "ok");

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should route matching plan-fidelity receipt to eng review",
        ),
        "workflow status should route matching plan-fidelity receipt to eng review",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:plan-eng-review");
    assert!(
        !status_json["reason_codes"]
            .as_array()
            .expect("reason_codes should be an array")
            .iter()
            .any(|value| value == "missing_plan_fidelity_receipt"),
        "matching pass receipts should clear the missing receipt reason"
    );
}

#[test]
fn canonical_workflow_status_normalizes_dot_slash_source_spec_paths() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-dot-slash-spec");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `./docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-dot-slash-spec.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-dot-slash-spec",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );
    let receipt_json = run_workflow_plan_fidelity_json(
        repo,
        state,
        &[
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-dot-slash-spec.md",
            "--json",
        ],
        "workflow plan-fidelity record should normalize ./docs Source Spec headers",
    );
    assert_eq!(receipt_json["status"], "ok");

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should normalize ./docs Source Spec headers",
        ),
        "workflow status should normalize ./docs Source Spec headers",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:plan-eng-review");
}

#[test]
fn canonical_workflow_status_rejects_stale_plan_fidelity_receipt_after_plan_revision_changes() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-stale");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-stale.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-019d",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    let receipt_json = run_workflow_plan_fidelity_json(
        repo,
        state,
        &[
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-stale.md",
            "--json",
        ],
        "workflow plan-fidelity record should succeed before stale-plan mutation",
    );
    assert_eq!(receipt_json["status"], "ok");

    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 2\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the revised draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The revised draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the revised draft plan**\n",
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should fail closed on stale plan-fidelity receipts",
        ),
        "workflow status should fail closed on stale plan-fidelity receipts",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:writing-plans");
    assert!(
        status_json["reason_codes"]
            .as_array()
            .expect("reason_codes should be an array")
            .iter()
            .any(|value| value == "stale_plan_fidelity_receipt"),
        "plan revision drift should stale the prior plan-fidelity receipt"
    );
}

#[test]
fn canonical_workflow_status_routes_draft_plan_without_fidelity_receipt_back_to_writing_plans() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-draft-plan-missing-fidelity");
    let repo = repo_dir.path();
    let state = state_dir.path();

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(
        repo,
        "docs/featureforge/specs/2026-01-22-document-review-system-design.md",
    );
    write_file(
        &repo.join("docs/featureforge/plans/2026-01-22-document-review-system.md"),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for draft plan missing fidelity receipt",
        ),
        "rust canonical workflow status refresh for draft plan missing fidelity receipt",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:writing-plans");
    assert_eq!(
        status_json["reason_codes"][0],
        "missing_plan_fidelity_receipt"
    );
    assert_eq!(
        status_json["diagnostics"][0]["code"],
        "missing_plan_fidelity_receipt"
    );
}

#[test]
fn canonical_workflow_status_routes_draft_plan_with_non_independent_fidelity_receipt_back_to_writing_plans()
 {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-draft-plan-non-independent-fidelity");
    let repo = repo_dir.path();
    let state = state_dir.path();

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(
        repo,
        "docs/featureforge/specs/2026-01-22-document-review-system-design.md",
    );
    write_file(
        &repo.join("docs/featureforge/plans/2026-01-22-document-review-system.md"),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-non-independent.md",
            plan_path: "docs/featureforge/plans/2026-01-22-document-review-system.md",
            plan_revision: 1,
            spec_path: "docs/featureforge/specs/2026-01-22-document-review-system-design.md",
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "same-context",
            reviewer_id: "writer-context",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );
    let output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "plan-fidelity",
            "record",
            "--plan",
            "docs/featureforge/plans/2026-01-22-document-review-system.md",
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-non-independent.md",
            "--json",
        ],
        "workflow plan-fidelity record should reject non-independent review artifacts",
    );
    assert!(
        !output.status.success(),
        "record should fail closed for non-independent plan-fidelity artifacts, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for draft plan non-independent fidelity receipt",
        ),
        "rust canonical workflow status refresh for draft plan non-independent fidelity receipt",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:writing-plans");
    assert_eq!(
        status_json["reason_codes"][0],
        "missing_plan_fidelity_receipt"
    );
}

#[test]
fn workflow_plan_fidelity_record_rejects_incomplete_verification_artifacts() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-incomplete-artifact");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-incomplete.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-incomplete",
            verified_surfaces: &[],
        },
    );

    let output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "plan-fidelity",
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-incomplete.md",
            "--json",
        ],
        "workflow plan-fidelity record should reject incomplete verification artifacts",
    );
    assert!(
        !output.status.success(),
        "record should fail closed when required verification surfaces are missing, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn workflow_plan_fidelity_record_rejects_non_pass_verdicts() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-non-pass-verdict");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-non-pass.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "clear",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-non-pass",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    let output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "plan-fidelity",
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-non-pass.md",
            "--json",
        ],
        "workflow plan-fidelity record should reject non-pass review verdicts",
    );
    assert!(
        !output.status.success(),
        "record should fail closed when the review verdict is not pass, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn workflow_plan_fidelity_record_normalizes_dot_slash_review_targets() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-dot-slash-artifact");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `./docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-dot-slash-targets.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-dot-slash-targets",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );
    replace_in_file(
        &repo.join(".featureforge/reviews/plan-fidelity-dot-slash-targets.md"),
        &format!("**Reviewed Plan:** `{plan_path}`"),
        &format!("**Reviewed Plan:** `./{plan_path}`"),
    );
    replace_in_file(
        &repo.join(".featureforge/reviews/plan-fidelity-dot-slash-targets.md"),
        &format!("**Reviewed Spec:** `{spec_path}`"),
        &format!("**Reviewed Spec:** `./{spec_path}`"),
    );

    let receipt_json = run_workflow_plan_fidelity_json(
        repo,
        state,
        &[
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-dot-slash-targets.md",
            "--json",
        ],
        "workflow plan-fidelity record should normalize dot-slash review targets",
    );
    assert_eq!(receipt_json["status"], "ok");
}

#[test]
fn workflow_plan_fidelity_record_rejects_stale_review_artifact_fingerprints() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-stale-artifact");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-stale-fingerprint.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-stale-fingerprint",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );
    replace_in_file(
        &repo.join(plan_path),
        "Prepare the draft plan for review",
        "Prepare the changed draft plan for review",
    );

    let output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "plan-fidelity",
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-stale-fingerprint.md",
            "--json",
        ],
        "workflow plan-fidelity record should reject stale plan-fingerprint bindings",
    );
    assert!(
        !output.status.success(),
        "record should fail closed when the review artifact fingerprint no longer matches the draft plan, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn workflow_plan_fidelity_record_resolves_repo_relative_paths_from_subdirectories() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-subdir");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-subdir.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-subdir",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );
    fs::create_dir_all(repo.join("src/runtime")).expect("subdirectory should exist");

    let receipt_json = run_workflow_plan_fidelity_json_from_dir(
        &repo.join("src/runtime"),
        state,
        &[
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-subdir.md",
            "--json",
        ],
        "workflow plan-fidelity record should resolve repo-relative paths from subdirectories",
    );
    assert_eq!(receipt_json["status"], "ok");
}

#[test]
fn workflow_plan_fidelity_record_rejects_malformed_spec_requirement_index() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-malformed-spec");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n\n## Summary\n\nMalformed fixture without a Requirement Index.\n",
    );
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-malformed-spec.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-malformed-spec",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    let output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "plan-fidelity",
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-malformed-spec.md",
            "--json",
        ],
        "workflow plan-fidelity record should reject malformed approved specs",
    );
    assert!(
        !output.status.success(),
        "record should fail closed on malformed approved specs, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should fail closed after malformed-spec review recording fails",
        ),
        "workflow status should fail closed after malformed-spec review recording fails",
    );
    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:writing-plans");
}

#[test]
fn workflow_plan_fidelity_record_rejects_invalid_ceo_review_provenance_on_source_spec() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-invalid-spec-reviewer");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** brainstorming\n\n## Requirement Index\n\n- [REQ-001][behavior] The draft plan must complete an independent fidelity review before engineering review.\n",
    );
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-invalid-spec-reviewer.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-invalid-spec-reviewer",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    let output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "plan-fidelity",
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-invalid-spec-reviewer.md",
            "--json",
        ],
        "workflow plan-fidelity record should reject invalid CEO review provenance on the source spec",
    );
    assert!(
        !output.status.success(),
        "record should fail closed when the source spec is not workflow-valid CEO-approved, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should fail closed when the source spec approval headers are semantically invalid",
        ),
        "workflow status should fail closed when the source spec approval headers are semantically invalid",
    );
    assert_eq!(status_json["next_skill"], "featureforge:plan-ceo-review");
}

#[test]
fn workflow_plan_fidelity_record_rejects_out_of_repo_source_spec_paths() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-plan-fidelity-external-source-spec");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-01-22-document-review-system-design.md";
    let plan_path = "docs/featureforge/plans/2026-01-22-document-review-system.md";

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    write_minimal_plan_fidelity_spec(repo, spec_path);
    write_file(
        &repo.join(plan_path),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `../external/docs/featureforge/specs/outside-spec.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );
    write_plan_fidelity_review_artifact(
        repo,
        PlanFidelityReviewArtifactInput {
            artifact_rel: ".featureforge/reviews/plan-fidelity-external-source-spec.md",
            plan_path,
            plan_revision: 1,
            spec_path,
            spec_revision: 1,
            review_verdict: "pass",
            reviewer_source: "fresh-context-subagent",
            reviewer_id: "reviewer-external-source-spec",
            verified_surfaces: &["requirement_index", "execution_topology"],
        },
    );

    let output = run_rust_featureforge(
        repo,
        state,
        &[
            "workflow",
            "plan-fidelity",
            "record",
            "--plan",
            plan_path,
            "--review-artifact",
            ".featureforge/reviews/plan-fidelity-external-source-spec.md",
            "--json",
        ],
        "workflow plan-fidelity record should reject out-of-repo Source Spec paths",
    );
    assert!(
        !output.status.success(),
        "record should fail closed when Source Spec escapes the repo, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
#[cfg(unix)]
fn canonical_workflow_status_refresh_preserves_route_when_manifest_write_fails() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-manifest-write-conflict");
    let repo = repo_dir.path();
    let state = state_dir.path();

    install_full_contract_ready_artifacts(repo);

    let original_permissions = fs::metadata(state)
        .expect("state dir metadata should be readable")
        .permissions();
    let mut read_only_permissions = original_permissions.clone();
    read_only_permissions.set_mode(0o555);
    fs::set_permissions(state, read_only_permissions).expect("state dir should become read-only");

    let output = run_rust_featureforge(
        repo,
        state,
        &["workflow", "status", "--refresh"],
        "workflow status refresh with non-writable state dir",
    );

    fs::set_permissions(state, original_permissions)
        .expect("state dir permissions should be restorable");

    assert!(
        output.status.success(),
        "status refresh should still succeed when manifest persistence fails, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let status_json = parse_json(
        &output,
        "workflow status refresh with non-writable state dir",
    );
    assert_eq!(status_json["status"], "implementation_ready");
    assert_ne!(status_json["next_skill"], "featureforge:brainstorming");
    assert!(
        status_json["reason_codes"]
            .as_array()
            .expect("reason_codes should stay an array")
            .iter()
            .any(|value| value == &Value::String(String::from("manifest_write_conflict")))
    );
    assert_eq!(
        status_json["diagnostics"][0]["code"],
        Value::String(String::from("manifest_write_conflict"))
    );
}

#[test]
fn canonical_workflow_status_routes_lone_stale_approved_plan_as_stale() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-stale-approved-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_file(
        &repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design-v2.md"),
        "# Approved Spec, Newer Path\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n\n## Notes\n",
    );
    write_file(
        &repo.join("docs/featureforge/plans/2026-01-22-document-review-system.md"),
        "# Approved Plan, Stale Source Path\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Preserve the stale source path case\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The plan remains structurally valid while its source-spec path goes stale.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Detect the stale source path**\n",
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for stale approved plan",
        ),
        "rust canonical workflow status refresh for stale approved plan",
    );

    assert_eq!(status_json["status"], "stale_plan");
    assert_eq!(status_json["next_skill"], "featureforge:writing-plans");
    assert_eq!(status_json["contract_state"], "stale");
    assert_eq!(status_json["reason_codes"][0], "stale_spec_plan_linkage");
    assert_eq!(
        status_json["diagnostics"][0]["code"],
        "stale_spec_plan_linkage"
    );
}

#[test]
fn canonical_workflow_status_routes_stale_source_revision_as_stale() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-stale-approved-revision");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_file(
        &repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design.md"),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 2\n**Last Reviewed By:** plan-ceo-review\n\n## Requirement Index\n\n- [REQ-001][behavior] The route should expose stale approved plans when the source-spec revision drifts.\n",
    );
    write_file(
        &repo.join("docs/featureforge/plans/2026-01-22-document-review-system.md"),
        "# Approved Plan, Stale Source Revision\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Preserve the stale source revision case\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The plan remains structurally valid while its source-spec revision goes stale.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Detect the stale source revision**\n",
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for stale approved revision",
        ),
        "rust canonical workflow status refresh for stale approved revision",
    );

    assert_eq!(status_json["status"], "stale_plan");
    assert_eq!(status_json["next_skill"], "featureforge:writing-plans");
    assert_eq!(status_json["contract_state"], "stale");
    assert_eq!(status_json["reason_codes"][0], "stale_spec_plan_linkage");
    assert_eq!(
        status_json["diagnostics"][0]["code"],
        "stale_spec_plan_linkage"
    );
}

#[cfg(unix)]
#[test]
fn workflow_status_argv0_alias_dispatches_to_canonical_tree() {
    use std::os::unix::fs::symlink;

    let (repo_dir, state_dir) = init_repo("workflow-runtime-argv0");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_file(
        &repo.join("docs/featureforge/specs/2026-03-24-draft-spec-design.md"),
        "# Draft Spec\n\n**Workflow State:** Draft\n**Spec Revision:** 1\n**Last Reviewed By:** brainstorming\n",
    );

    let helper_json = run_shell_status_json(
        repo,
        state,
        &["status", "--refresh"],
        "shell helper status refresh for argv0 alias parity",
    );

    let alias_dir = TempDir::new().expect("alias tempdir should be available");
    let alias_path = alias_dir.path().join("featureforge-workflow-status");
    symlink(cargo_bin("featureforge"), &alias_path)
        .expect("argv0 alias symlink should be creatable");

    let alias_output = run(
        {
            let mut command = Command::new(&alias_path);
            command
                .current_dir(repo)
                .env("FEATUREFORGE_STATE_DIR", state)
                .args(["--refresh"]);
            command
        },
        "rust argv0 workflow-status alias",
    );
    let alias_json = parse_json(&alias_output, "rust argv0 workflow-status alias");

    assert_eq!(alias_json, helper_json);
}

#[test]
fn canonical_workflow_status_refresh_recovers_old_manifest_after_slug_change() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-cross-slug-old");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-03-24-cross-slug-design.md";
    let expected_plan = "docs/featureforge/plans/2026-03-24-cross-slug-plan.md";

    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n",
    );

    let old_identity = discover_repo_identity(repo).expect("old repo identity should resolve");
    let old_manifest_path = manifest_path(&old_identity, state);
    write_manifest(
        &old_manifest_path,
        &WorkflowManifest {
            version: 1,
            repo_root: old_identity.repo_root.to_string_lossy().into_owned(),
            branch: old_identity.branch_name.clone(),
            expected_spec_path: spec_path.to_owned(),
            expected_plan_path: expected_plan.to_owned(),
            status: String::from("spec_approved_needs_plan"),
            next_skill: String::from("featureforge:writing-plans"),
            reason: String::from("missing_expected_plan,expect_set"),
            note: String::from("missing_expected_plan,expect_set"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    set_remote_url(
        repo,
        "https://example.com/example/workflow-runtime-cross-slug-new.git",
    );
    let new_identity = discover_repo_identity(repo).expect("new repo identity should resolve");
    let new_manifest_path = manifest_path(&new_identity, state);
    assert_ne!(
        old_manifest_path, new_manifest_path,
        "slug change should move the manifest path"
    );
    let recovered = recover_slug_changed_manifest(&new_identity, state, &new_manifest_path)
        .expect("cross-slug manifest should be recoverable from sibling state");
    assert_eq!(recovered.expected_plan_path, expected_plan);

    let route = WorkflowRuntime {
        identity: new_identity.clone(),
        state_dir: state.to_path_buf(),
        manifest_path: new_manifest_path.clone(),
        manifest: Some(recovered.clone()),
        manifest_warning: None,
        manifest_recovery_reasons: vec![String::from("repo_slug_recovered")],
    }
    .status()
    .expect("status should preserve the recovered expected plan path");
    assert_eq!(route.plan_path, expected_plan);

    let refreshed_route = WorkflowRuntime {
        identity: new_identity,
        state_dir: state.to_path_buf(),
        manifest_path: new_manifest_path.clone(),
        manifest: Some(recovered),
        manifest_warning: None,
        manifest_recovery_reasons: vec![String::from("repo_slug_recovered")],
    }
    .status_refresh()
    .expect("status refresh should preserve recovery metadata and write the new manifest");

    assert_eq!(refreshed_route.status, "spec_approved_needs_plan");
    assert_eq!(refreshed_route.plan_path, expected_plan);
    assert!(refreshed_route.reason.contains("repo_slug_recovered"));
    assert!(
        refreshed_route
            .reason_codes
            .iter()
            .any(|value| value == "repo_slug_recovered")
    );

    let new_manifest_json = fs::read_to_string(&new_manifest_path)
        .expect("recovered manifest should be written at the new slug path");
    assert!(new_manifest_json.contains(expected_plan));
}

#[test]
fn shared_markdown_scan_helper_collects_nested_markdown_only() {
    let fixture = TempDir::new().expect("markdown scan fixture should exist");
    write_file(&fixture.path().join("top.md"), "# top\n");
    write_file(&fixture.path().join("nested/plan.md"), "# nested\n");
    write_file(&fixture.path().join("nested/notes.txt"), "not markdown\n");

    let mut actual = markdown_scan_support::markdown_files_under(fixture.path())
        .into_iter()
        .map(|path| {
            path.strip_prefix(fixture.path())
                .expect("fixture file should stay under fixture root")
                .to_string_lossy()
                .replace('\\', "/")
        })
        .collect::<Vec<_>>();
    actual.sort();

    assert_eq!(
        actual,
        vec![String::from("nested/plan.md"), String::from("top.md")]
    );
}

#[test]
fn canonical_manifest_path_distinguishes_exact_branch_names() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-branch-identity");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "feature/x"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout feature/x");
    let slash_identity = discover_repo_identity(repo).expect("feature/x identity should resolve");
    let slash_manifest_path = manifest_path(&slash_identity, state);

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "feature-x"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout feature-x");
    let dash_identity = discover_repo_identity(repo).expect("feature-x identity should resolve");
    let dash_manifest_path = manifest_path(&dash_identity, state);

    assert_ne!(
        slash_manifest_path, dash_manifest_path,
        "workflow manifests should stay exact-branch scoped",
    );
}

#[test]
fn canonical_manifest_path_uses_canonical_repo_slug_directory() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-manifest-slug");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let identity = discover_repo_identity(repo).expect("repo identity should resolve");
    let manifest = manifest_path(&identity, state);

    assert_eq!(
        manifest
            .parent()
            .expect("manifest path should have a parent"),
        state.join("projects").join(repo_slug(repo))
    );
}

#[test]
fn canonical_workflow_status_refresh_limits_cross_slug_manifest_recovery_scan() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-cross-slug-budget");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-03-24-budget-limit-design.md";
    let expected_plan = "docs/featureforge/plans/2026-03-24-budget-limit-plan.md";

    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n",
    );

    let current_identity =
        discover_repo_identity(repo).expect("current repo identity should resolve");
    let current_manifest_path = manifest_path(&current_identity, state);
    let manifest_name = current_manifest_path
        .file_name()
        .expect("manifest path should have a file name")
        .to_owned();

    for index in 1..=12 {
        let decoy_dir = state.join("projects").join(format!("decoy-{index:02}"));
        write_manifest(
            &decoy_dir.join(&manifest_name),
            &WorkflowManifest {
                version: 1,
                repo_root: format!("/tmp/not-the-current-repo-{index:02}"),
                branch: current_identity.branch_name.clone(),
                expected_spec_path: String::new(),
                expected_plan_path: String::new(),
                status: String::from("needs_brainstorming"),
                next_skill: String::from("featureforge:brainstorming"),
                reason: String::from("decoy"),
                note: String::from("decoy"),
                updated_at: String::from("2026-03-24T00:00:00Z"),
            },
        );
    }

    write_manifest(
        &state.join("projects/zzz-old-slug").join(&manifest_name),
        &WorkflowManifest {
            version: 1,
            repo_root: current_identity.repo_root.to_string_lossy().into_owned(),
            branch: current_identity.branch_name.clone(),
            expected_spec_path: spec_path.to_owned(),
            expected_plan_path: expected_plan.to_owned(),
            status: String::from("spec_approved_needs_plan"),
            next_skill: String::from("featureforge:writing-plans"),
            reason: String::from("repo_slug_recovered"),
            note: String::from("repo_slug_recovered"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for slug recovery scan budget",
        ),
        "rust canonical workflow status refresh for slug recovery scan budget",
    );

    assert_eq!(status_json["status"], "spec_approved_needs_plan");
    assert_eq!(status_json["plan_path"], "");
    assert!(
        !status_json["reason"]
            .as_str()
            .unwrap_or("")
            .contains("repo_slug_recovered")
    );

    let manifest_json = fs::read_to_string(current_manifest_path)
        .expect("current manifest should be written after refresh");
    assert!(!manifest_json.contains(expected_plan));
}

#[test]
fn canonical_workflow_status_accepts_manifest_selected_plan_with_legacy_symlink_repo_root() {
    let (repo_dir, state_dir) = init_repo("workflow-status-symlink-manifest");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let alias_root = state.join("workflow-status-symlink-manifest-checkout");
    create_dir_symlink(repo, &alias_root);

    let spec_path = "docs/featureforge/specs/2026-03-24-symlink-manifest-spec.md";
    let plan_a = "docs/featureforge/plans/2026-03-24-symlink-manifest-a.md";
    let plan_b = "docs/featureforge/plans/2026-03-24-symlink-manifest-b.md";

    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n",
    );
    for plan_path in [plan_a, plan_b] {
        write_file(
            &repo.join(plan_path),
            &format!(
                "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `{spec_path}`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n"
            ),
        );
    }

    let identity = discover_repo_identity(repo).expect("repo identity should resolve");
    write_manifest(
        &manifest_path(&identity, state),
        &WorkflowManifest {
            version: 1,
            repo_root: alias_root.to_string_lossy().into_owned(),
            branch: identity.branch_name.clone(),
            expected_spec_path: spec_path.to_owned(),
            expected_plan_path: plan_a.to_owned(),
            status: String::from("plan_draft"),
            next_skill: String::from("featureforge:plan-eng-review"),
            reason: String::from("legacy-symlink-manifest"),
            note: String::from("legacy-symlink-manifest"),
            updated_at: String::from("2026-03-25T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            &alias_root,
            state,
            &["workflow", "status"],
            "workflow status should accept legacy symlinked manifest repo roots",
        ),
        "workflow status should accept legacy symlinked manifest repo roots",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["plan_path"], plan_a);
    assert!(
        !status_json["reason_codes"]
            .as_array()
            .unwrap_or(&Vec::new())
            .iter()
            .any(|value| value == "repo_root_mismatch"),
        "legacy symlink manifests should not be treated as repo_root mismatches"
    );
}

#[test]
fn canonical_workflow_status_ignores_manifest_selected_spec_when_branch_mismatches() {
    let (repo_dir, state_dir) = init_repo("workflow-status-manifest-branch-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_a = "docs/featureforge/specs/2026-03-24-branch-mismatch-a.md";
    let spec_b = "docs/featureforge/specs/2026-03-24-branch-mismatch-b.md";

    for spec_path in [spec_a, spec_b] {
        write_file(
            &repo.join(spec_path),
            "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n",
        );
    }

    let identity = discover_repo_identity(repo).expect("repo identity should resolve");
    write_manifest(
        &manifest_path(&identity, state),
        &WorkflowManifest {
            version: 1,
            repo_root: identity.repo_root.to_string_lossy().into_owned(),
            branch: String::from("other-branch"),
            expected_spec_path: spec_a.to_owned(),
            expected_plan_path: String::new(),
            status: String::from("spec_approved_needs_plan"),
            next_skill: String::from("featureforge:writing-plans"),
            reason: String::from("stale-branch-manifest"),
            note: String::from("stale-branch-manifest"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status"],
            "workflow status should ignore a branch-mismatched manifest-selected spec",
        ),
        "workflow status should ignore a branch-mismatched manifest-selected spec",
    );

    assert_eq!(status_json["status"], "spec_draft");
    assert_eq!(status_json["plan_path"], "");
    assert!(
        status_json["reason_codes"]
            .as_array()
            .unwrap_or(&Vec::new())
            .iter()
            .any(|value| value == "ambiguous_spec_candidates"),
        "branch-mismatched manifests should not suppress ambiguous current spec candidates"
    );
}

#[test]
fn canonical_workflow_status_ignores_manifest_selected_plan_when_repo_root_mismatches() {
    let (repo_dir, state_dir) = init_repo("workflow-status-manifest-root-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/featureforge/specs/2026-03-24-root-mismatch-spec.md";
    let plan_a = "docs/featureforge/plans/2026-03-24-root-mismatch-a.md";
    let plan_b = "docs/featureforge/plans/2026-03-24-root-mismatch-b.md";

    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n",
    );
    for plan_path in [plan_a, plan_b] {
        write_file(
            &repo.join(plan_path),
            &format!(
                "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `{spec_path}`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n"
            ),
        );
    }

    let identity = discover_repo_identity(repo).expect("repo identity should resolve");
    write_manifest(
        &manifest_path(&identity, state),
        &WorkflowManifest {
            version: 1,
            repo_root: String::from("/tmp/another-repo"),
            branch: identity.branch_name.clone(),
            expected_spec_path: spec_path.to_owned(),
            expected_plan_path: plan_a.to_owned(),
            status: String::from("plan_draft"),
            next_skill: String::from("featureforge:plan-eng-review"),
            reason: String::from("stale-root-manifest"),
            note: String::from("stale-root-manifest"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status"],
            "workflow status should ignore a repo-root-mismatched manifest-selected plan",
        ),
        "workflow status should ignore a repo-root-mismatched manifest-selected plan",
    );

    assert_eq!(status_json["status"], "spec_approved_needs_plan");
    assert_eq!(status_json["plan_path"], "");
    assert!(
        status_json["reason_codes"]
            .as_array()
            .unwrap_or(&Vec::new())
            .iter()
            .any(|value| value == "ambiguous_plan_candidates"),
        "repo-root-mismatched manifests should not suppress ambiguous current plan candidates"
    );
}

#[test]
fn canonical_workflow_status_refresh_recovers_legacy_symlinked_local_repo_manifest() {
    let (repo_dir, state_dir) = init_repo("workflow-local-symlink-recovery");
    let repo = repo_dir.path();
    let state = state_dir.path();
    remove_origin_remote(repo);

    let alias_root = state.join("workflow-local-symlink-checkout");
    create_dir_symlink(repo, &alias_root);

    let spec_path = "docs/featureforge/specs/2026-03-24-local-symlink-spec.md";
    let plan_a = "docs/featureforge/plans/2026-03-24-local-symlink-a.md";
    let plan_b = "docs/featureforge/plans/2026-03-24-local-symlink-b.md";

    write_file(
        &repo.join(spec_path),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n",
    );
    for plan_path in [plan_a, plan_b] {
        write_file(
            &repo.join(plan_path),
            &format!(
                "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `{spec_path}`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n"
            ),
        );
    }

    let current_identity = discover_repo_identity(repo).expect("repo identity should resolve");
    let legacy_identity = RepositoryIdentity {
        repo_root: alias_root.clone(),
        remote_url: None,
        branch_name: current_identity.branch_name.clone(),
    };
    let current_manifest_path = manifest_path(&current_identity, state);
    let legacy_manifest_path = manifest_path(&legacy_identity, state);
    assert_ne!(
        current_manifest_path, legacy_manifest_path,
        "canonicalized local repo roots should move the manifest path"
    );

    write_manifest(
        &legacy_manifest_path,
        &WorkflowManifest {
            version: 1,
            repo_root: alias_root.to_string_lossy().into_owned(),
            branch: current_identity.branch_name.clone(),
            expected_spec_path: spec_path.to_owned(),
            expected_plan_path: plan_a.to_owned(),
            status: String::from("plan_draft"),
            next_skill: String::from("featureforge:plan-eng-review"),
            reason: String::from("legacy-local-symlink-manifest"),
            note: String::from("legacy-local-symlink-manifest"),
            updated_at: String::from("2026-03-25T00:00:00Z"),
        },
    );

    let phase_json = parse_json(
        &run_rust_featureforge(
            &alias_root,
            state,
            &["workflow", "phase", "--json"],
            "workflow phase should preserve legacy local symlink manifest recovery reasons",
        ),
        "workflow phase should preserve legacy local symlink manifest recovery reasons",
    );
    assert!(
        phase_json["route"]["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes.iter().any(|value| value == "repo_slug_recovered")),
        "workflow phase should preserve recovered manifest reason codes in the route payload"
    );
    assert_eq!(phase_json["plan_path"], plan_a);

    let handoff_json = parse_json(
        &run_rust_featureforge(
            &alias_root,
            state,
            &["workflow", "handoff", "--json"],
            "workflow handoff should preserve legacy local symlink manifest recovery reasons",
        ),
        "workflow handoff should preserve legacy local symlink manifest recovery reasons",
    );
    assert!(
        handoff_json["route"]["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes.iter().any(|value| value == "repo_slug_recovered")),
        "workflow handoff should preserve recovered manifest reason codes in the route payload"
    );
    assert_eq!(handoff_json["plan_path"], plan_a);

    let status_json = parse_json(
        &run_rust_featureforge(
            &alias_root,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should recover legacy local symlink manifests",
        ),
        "workflow status should recover legacy local symlink manifests",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["plan_path"], plan_a);

    let rewritten: WorkflowManifest = serde_json::from_str(
        &fs::read_to_string(&current_manifest_path)
            .expect("canonical manifest should be rewritten on refresh"),
    )
    .expect("rewritten canonical manifest should parse");
    assert_eq!(
        rewritten.repo_root,
        current_identity.repo_root.to_string_lossy().into_owned()
    );
    assert_eq!(rewritten.expected_plan_path, plan_a);
}

#[test]
fn canonical_workflow_operator_accepts_manifest_selected_ready_route_with_extra_approved_candidates()
 {
    let (repo_dir, state_dir) = init_repo("workflow-manifest-selected-ready-route");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-manifest-selected-ready-route";
    let spec_path = "docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md";
    let plan_path = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let extra_spec_path = "docs/featureforge/specs/2026-03-24-extra-approved-spec.md";
    let extra_plan_path = "docs/featureforge/plans/2026-03-24-extra-approved-plan.md";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-manifest-ready"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-manifest-ready");

    install_full_contract_ready_artifacts(repo);
    enable_session_decision(state, session_key);
    write_file(
        &repo.join(extra_spec_path),
        "# Extra Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n",
    );
    write_file(
        &repo.join(extra_plan_path),
        &format!(
            "# Extra Approved Plan\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `{spec_path}`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n"
        ),
    );

    let identity = discover_repo_identity(repo).expect("repo identity should resolve");
    write_manifest(
        &manifest_path(&identity, state),
        &WorkflowManifest {
            version: 1,
            repo_root: fs::canonicalize(repo)
                .expect("repo root should canonicalize")
                .to_string_lossy()
                .into_owned(),
            branch: identity.branch_name.clone(),
            expected_spec_path: String::from(spec_path),
            expected_plan_path: String::from(plan_path),
            status: String::from("implementation_ready"),
            next_skill: String::new(),
            reason: String::from("implementation_ready"),
            note: String::from("implementation_ready"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status"],
            "workflow status for manifest-selected ready route",
        ),
        "workflow status for manifest-selected ready route",
    );
    assert_eq!(status_json["status"], "implementation_ready");
    assert_eq!(status_json["spec_path"], spec_path);
    assert_eq!(status_json["plan_path"], plan_path);

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for manifest-selected ready route",
        ),
        "workflow phase for manifest-selected ready route",
    );
    assert_eq!(phase_json["phase"], "execution_preflight");
    assert_eq!(phase_json["route_status"], "implementation_ready");
    assert_eq!(phase_json["plan_path"], plan_path);

    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for manifest-selected ready route",
        ),
        "workflow handoff for manifest-selected ready route",
    );
    assert_eq!(handoff_json["phase"], "execution_preflight");
    assert_eq!(handoff_json["route_status"], "implementation_ready");
    assert_eq!(handoff_json["plan_path"], plan_path);
}

#[test]
fn canonical_workflow_status_treats_ceo_approved_specs_without_ceo_review_as_draft() {
    let (repo_dir, state_dir) = init_repo("workflow-status-approved-spec-reviewer-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_file(
        &repo.join("docs/featureforge/specs/2026-03-24-reviewer-mismatch-design.md"),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** brainstorming\n\n## Requirement Index\n\n- [REQ-001][behavior] Routing should reject approval-owner drift.\n",
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should reject approved specs without CEO review ownership",
        ),
        "workflow status should reject approved specs without CEO review ownership",
    );

    assert_eq!(status_json["status"], "spec_draft");
    assert_eq!(status_json["next_skill"], "featureforge:plan-ceo-review");
}

#[test]
fn canonical_workflow_status_treats_eng_approved_plans_without_eng_review_as_draft() {
    let (repo_dir, state_dir) = init_repo("workflow-status-approved-plan-reviewer-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();

    install_full_contract_ready_artifacts(repo);
    let plan_path =
        repo.join("docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md");
    let source = fs::read_to_string(&plan_path).expect("plan fixture should be readable");
    fs::write(
        &plan_path,
        source.replace(
            "**Last Reviewed By:** plan-eng-review",
            "**Last Reviewed By:** writing-plans",
        ),
    )
    .expect("plan fixture should be writable");

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "workflow status should reject approved plans without ENG review ownership",
        ),
        "workflow status should reject approved plans without ENG review ownership",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:writing-plans");
}

#[test]
fn canonical_workflow_phase_omits_session_entry_from_public_json() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-canonical-session-entry");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let phase_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "phase", "--json"],
            "rust canonical workflow phase should read canonical session-entry state",
        ),
        "rust canonical workflow phase should read canonical session-entry state",
    );

    assert!(phase_json.get("session_entry").is_none());
    assert_eq!(phase_json["route"]["schema_version"], 3);
}

#[test]
fn canonical_workflow_operator_routes_ready_plan_without_session_entry_gate() {
    let (repo_dir, state_dir) = init_repo("workflow-no-session-entry-gate");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-no-session-entry-gate"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-no-session-entry-gate");

    install_full_contract_ready_artifacts(repo);
    let execution_preflight_phase = public_harness_phase_from_spec("execution_preflight");

    let phase_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "phase", "--json"],
            "workflow phase should route directly without a session-entry gate",
        ),
        "workflow phase should route directly without a session-entry gate",
    );
    assert_eq!(phase_json["phase"], Value::String(execution_preflight_phase.clone()));
    assert_eq!(phase_json["next_action"], "execution_preflight");
    assert!(phase_json.get("session_entry").is_none());
    assert_eq!(phase_json["schema_version"], 2);
    assert_eq!(phase_json["route"]["schema_version"], 3);

    let doctor_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            "workflow doctor should route directly without a session-entry gate",
        ),
        "workflow doctor should route directly without a session-entry gate",
    );
    assert_eq!(doctor_json["phase"], Value::String(execution_preflight_phase.clone()));
    assert_eq!(doctor_json["next_action"], "execution_preflight");
    assert!(doctor_json.get("session_entry").is_none());
    assert_eq!(doctor_json["schema_version"], 2);
    assert_eq!(doctor_json["route"]["schema_version"], 3);

    let handoff_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            "workflow handoff should route directly without a session-entry gate",
        ),
        "workflow handoff should route directly without a session-entry gate",
    );
    assert_eq!(handoff_json["phase"], Value::String(execution_preflight_phase));
    assert_eq!(handoff_json["next_action"], "execution_preflight");
    assert_eq!(handoff_json["recommended_skill"], "featureforge:executing-plans");
    assert!(handoff_json.get("session_entry").is_none());
    assert_eq!(handoff_json["schema_version"], 2);
    assert_eq!(handoff_json["route"]["schema_version"], 3);
}

#[test]
fn canonical_workflow_status_ignores_strict_session_entry_gate_env() {
    let (repo_dir, state_dir) = init_repo("workflow-status-strict-session-entry-gate");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-status-strict-session-entry-gate";

    install_full_contract_ready_artifacts(repo);
    let identity = discover_repo_identity(repo).expect("repo identity should resolve");
    let workflow_manifest_path = manifest_path(&identity, state);

    let status_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            &[
                ("FEATUREFORGE_SESSION_KEY", session_key),
                ("FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY", "1"),
            ],
            "workflow status should ignore the removed strict session-entry gate env",
        ),
        "workflow status should ignore the removed strict session-entry gate env",
    );
    assert_eq!(status_json["schema_version"], 3);
    assert_eq!(status_json["status"], "implementation_ready");
    assert!(
        !status_json["reason_codes"].as_array().is_some_and(|codes| codes.iter().any(|code| {
            code == "session_entry_unresolved" || code == "session_entry_bypassed"
        })),
        "workflow status should not expose removed strict session-entry reason codes"
    );

    let enabled_manifest: WorkflowManifest = serde_json::from_str(
        &fs::read_to_string(&workflow_manifest_path)
            .expect("workflow manifest should be written after strict refresh"),
    )
    .expect("workflow manifest json should parse after strict refresh");
    assert_eq!(
        enabled_manifest.expected_spec_path,
        status_json["spec_path"].as_str().unwrap_or(""),
        "strict refresh should persist the selected expected spec path"
    );
    assert_eq!(
        enabled_manifest.expected_plan_path,
        status_json["plan_path"].as_str().unwrap_or(""),
        "strict refresh should persist the selected expected plan path"
    );

    let bypassed_decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join("workflow-status-strict-session-entry-gate-bypassed");
    write_file(&bypassed_decision_path, "bypassed\n");
    let bypassed_status_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            &[
                (
                    "FEATUREFORGE_SESSION_KEY",
                    "workflow-status-strict-session-entry-gate-bypassed",
                ),
                ("FEATUREFORGE_WORKFLOW_REQUIRE_SESSION_ENTRY", "1"),
            ],
            "workflow status should ignore bypassed session-entry files after gate removal",
        ),
        "workflow status should ignore bypassed session-entry files after gate removal",
    );
    assert_eq!(bypassed_status_json["schema_version"], 3);
    assert_eq!(bypassed_status_json["status"], "implementation_ready");
    assert!(
        !bypassed_status_json["reason_codes"].as_array().is_some_and(|codes| codes.iter().any(|code| {
            code == "session_entry_unresolved" || code == "session_entry_bypassed"
        })),
        "workflow status should not expose removed strict session-entry reason codes"
    );
    let manifest_after_bypassed_session: WorkflowManifest = serde_json::from_str(
        &fs::read_to_string(&workflow_manifest_path)
            .expect("workflow manifest should remain readable after bypassed strict refresh"),
    )
    .expect("workflow manifest should parse after bypassed strict refresh");
    assert_eq!(
        manifest_after_bypassed_session.expected_spec_path, enabled_manifest.expected_spec_path,
        "bypassed session-entry files should not clear the selected expected spec path"
    );
    assert_eq!(
        manifest_after_bypassed_session.expected_plan_path, enabled_manifest.expected_plan_path,
        "bypassed session-entry files should not clear the selected expected plan path"
    );
}

#[test]
fn canonical_workflow_operator_ignores_spawned_subagent_context_markers() {
    let (repo_dir, state_dir) = init_repo("workflow-spawned-subagent");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-spawned-subagent";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-spawned-subagent"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-spawned-subagent");

    install_full_contract_ready_artifacts(repo);
    let execution_preflight_phase = public_harness_phase_from_spec("execution_preflight");

    let spawned_subagent_env = [
        ("FEATUREFORGE_SESSION_KEY", session_key),
        ("FEATUREFORGE_SPAWNED_SUBAGENT", "1"),
    ];

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &spawned_subagent_env,
            "workflow phase should bypass session-entry gate for spawned subagents",
        ),
        "workflow phase should bypass session-entry gate for spawned subagents",
    );
    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &spawned_subagent_env,
            "workflow doctor should bypass session-entry gate for spawned subagents",
        ),
        "workflow doctor should bypass session-entry gate for spawned subagents",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &spawned_subagent_env,
            "workflow handoff should bypass session-entry gate for spawned subagents",
        ),
        "workflow handoff should bypass session-entry gate for spawned subagents",
    );

    assert_eq!(phase_json["phase"], Value::String(execution_preflight_phase.clone()));
    assert_eq!(phase_json["next_action"], "execution_preflight");
    assert!(phase_json.get("session_entry").is_none());

    assert_eq!(doctor_json["phase"], Value::String(execution_preflight_phase.clone()));
    assert_eq!(doctor_json["next_action"], "execution_preflight");
    assert!(doctor_json.get("session_entry").is_none());

    assert_eq!(handoff_json["phase"], Value::String(execution_preflight_phase));
    assert_eq!(handoff_json["next_action"], "execution_preflight");
    assert_eq!(handoff_json["recommended_skill"], "featureforge:executing-plans");
    assert!(handoff_json.get("session_entry").is_none());
}

#[test]
fn canonical_workflow_operator_ignores_spawned_subagent_opt_in_markers() {
    let (repo_dir, state_dir) = init_repo("workflow-spawned-subagent-opt-in");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-spawned-subagent-opt-in";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-spawned-subagent-opt-in"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-spawned-subagent-opt-in");

    install_full_contract_ready_artifacts(repo);
    let execution_preflight_phase = public_harness_phase_from_spec("execution_preflight");

    let spawned_subagent_env = [
        ("FEATUREFORGE_SESSION_KEY", session_key),
        ("FEATUREFORGE_SPAWNED_SUBAGENT", "1"),
        ("FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN", "1"),
    ];

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &spawned_subagent_env,
            "workflow phase should honor spawned-subagent opt-in",
        ),
        "workflow phase should honor spawned-subagent opt-in",
    );

    assert_eq!(phase_json["phase"], Value::String(execution_preflight_phase));
    assert_eq!(phase_json["route_status"], "implementation_ready");
    assert_eq!(phase_json["next_action"], "execution_preflight");
    assert!(phase_json.get("session_entry").is_none());
}

#[test]
fn canonical_workflow_phase_routes_enabled_ready_plan_to_execution_preflight() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-ready-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-ready-plan";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-phase-ready"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-phase-ready");

    install_full_contract_ready_artifacts(repo);
    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow phase should route ready plans to execution preflight",
        ),
        "rust canonical workflow phase should route ready plans to execution preflight",
    );

    assert_eq!(phase_json["route_status"], "implementation_ready");
    assert_eq!(phase_json["phase"], "execution_preflight");
    assert_eq!(phase_json["next_action"], "execution_preflight");
    assert!(phase_json.get("session_entry").is_none());
    assert_eq!(phase_json["schema_version"], 2);
    assert_eq!(phase_json["route"]["schema_version"], 3);
}

#[test]
fn canonical_workflow_gate_review_is_read_only_before_dispatch() {
    let (repo_dir, state_dir) = init_repo("workflow-gate-review-dispatch-cycle-tracking");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-gate-review-dispatch-cycle-tracking";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    install_full_contract_ready_artifacts(repo);
    prepare_preflight_acceptance_workspace(repo, "workflow-gate-review-dispatch");
    write_file(&decision_path, "enabled\n");

    let preflight_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "preflight", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow preflight before workflow gate-review dispatch cycle tracking",
        ),
        "workflow preflight before workflow gate-review dispatch cycle tracking",
    );
    assert_eq!(preflight_json["allowed"], true);

    let status_before_begin = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status before begin for workflow gate-review dispatch cycle tracking",
    );
    let begin_json = run_plan_execution_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
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
        "begin active reviewable work before workflow gate-review dispatch cycle tracking",
    );
    assert_eq!(begin_json["active_task"], 1);
    assert_eq!(begin_json["active_step"], 1);
    let branch = current_branch_name(repo);
    update_authoritative_harness_state(repo, state, &branch, plan_rel, 1, &[]);
    let status_before_gate_review = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status before workflow gate-review read-only check",
    );

    let gate_review_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "review", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate review should stay read-only while active work is still in progress",
        ),
        "workflow gate review should stay read-only while active work is still in progress",
    );
    assert_eq!(gate_review_json["allowed"], false);
    assert_eq!(gate_review_json["failure_class"], "ExecutionStateNotReady");
    assert!(
        gate_review_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| codes.iter().any(|code| code == "active_step_in_progress")),
        "workflow gate review should fail while active work is still in progress"
    );

    let status_after_gate_review = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status after workflow gate-review read-only check",
    );
    assert_eq!(
        status_after_gate_review["strategy_checkpoint_kind"],
        status_before_gate_review["strategy_checkpoint_kind"],
        "workflow gate-review should not mutate strategy checkpoint kind"
    );
    assert_eq!(
        status_after_gate_review["last_strategy_checkpoint_fingerprint"],
        status_before_gate_review["last_strategy_checkpoint_fingerprint"],
        "workflow gate-review should not mutate strategy checkpoint fingerprint"
    );
    assert!(
        status_after_gate_review["strategy_state"] == status_before_gate_review["strategy_state"],
        "workflow gate-review should not mutate strategy state"
    );
}

#[test]
fn workflow_read_commands_do_not_persist_preflight_acceptance() {
    let (repo_dir, state_dir) = init_repo("workflow-read-only-preflight-boundary");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-read-only-preflight-boundary";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-read-only-preflight"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-read-only-preflight");

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase should not persist preflight acceptance",
        ),
        "workflow phase should not persist preflight acceptance",
    );
    assert_eq!(phase_json["phase"], "execution_preflight");
    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor should not persist preflight acceptance",
        ),
        "workflow doctor should not persist preflight acceptance",
    );
    assert_eq!(doctor_json["preflight"]["allowed"], true);
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff should not persist preflight acceptance",
        ),
        "workflow handoff should not persist preflight acceptance",
    );
    assert_eq!(handoff_json["next_action"], "execution_preflight");
    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow next should not persist preflight acceptance",
    );
    assert!(next_output.status.success());
    assert!(
        String::from_utf8_lossy(&next_output.stdout).contains("Return to execution preflight"),
        "workflow next should continue recommending explicit preflight"
    );

    let status_after_reads = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status after workflow read commands",
    );
    assert!(
        status_after_reads["execution_run_id"].is_null(),
        "workflow read commands must not persist preflight acceptance"
    );
    assert_eq!(
        status_after_reads["harness_phase"], "implementation_handoff",
        "without explicit preflight acceptance, harness phase should stay implementation_handoff"
    );

    let begin_without_preflight = run_rust_featureforge_with_env(
        repo,
        state,
        &[
            "plan",
            "execution",
            "begin",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_after_reads["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "begin should remain blocked before explicit preflight acceptance",
    );
    assert!(
        !begin_without_preflight.status.success(),
        "begin should fail before explicit preflight acceptance, got {:?}\nstdout:\n{}\nstderr:\n{}",
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

    let preflight_json = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "explicit plan execution preflight acceptance",
    );
    assert_eq!(preflight_json["allowed"], true);

    let status_after_preflight = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status after explicit plan execution preflight acceptance",
    );
    assert!(
        status_after_preflight["execution_run_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "explicit plan execution preflight should persist execution_run_id"
    );
}

#[test]
fn canonical_workflow_operator_ready_plan_pins_observability_seam_corpus() {
    let workflow_seam_event_kinds = [
        "phase_transition",
        "gate_result",
        "recommendation_proposed",
        "policy_accepted",
        "downstream_gate_rejected",
    ];
    let workflow_seam_minimum_envelope_fields = [
        "event_kind",
        "timestamp",
        "execution_run_id",
        "authoritative_sequence",
        "source_plan_path",
        "source_plan_revision",
        "harness_phase",
        "chunk_id",
        "command_name",
        "gate_name",
        "failure_class",
        "reason_codes",
    ];
    let workflow_seam_telemetry_counter_keys = [
        "phase_transition_count",
        "gate_failures_by_gate",
        "downstream_gate_rejection_count",
        "write_authority_conflict_count",
        "repo_state_drift_count",
    ];
    let workflow_seam_folded_diagnostics = ["write_authority_conflict", "repo_state_drift"];

    let stable_event_kinds: BTreeSet<&str> = STABLE_EVENT_KINDS.iter().copied().collect();
    let unknown_event_kinds: Vec<&str> = workflow_seam_event_kinds
        .iter()
        .copied()
        .filter(|event_kind| !stable_event_kinds.contains(event_kind))
        .collect();
    assert!(
        unknown_event_kinds.is_empty(),
        "workflow operator observability seam should use only runtime-owned event kinds, unknown: {unknown_event_kinds:?}"
    );

    let stable_reason_codes: BTreeSet<&str> = STABLE_REASON_CODES.iter().copied().collect();
    let unknown_reason_codes: Vec<&str> = workflow_seam_folded_diagnostics
        .iter()
        .copied()
        .filter(|reason_code| !stable_reason_codes.contains(reason_code))
        .collect();
    assert!(
        unknown_reason_codes.is_empty(),
        "workflow operator observability seam should fold only stable runtime diagnostics, unknown: {unknown_reason_codes:?}"
    );

    let mut probe_event =
        HarnessObservabilityEvent::new(HarnessEventKind::PhaseTransition, "2026-03-26T12:00:00Z");
    for reason_code in workflow_seam_folded_diagnostics {
        probe_event.add_reason_code(reason_code);
    }
    let serialized_probe_event =
        to_value(probe_event).expect("workflow observability seam probe event should serialize");
    let event_object = serialized_probe_event
        .as_object()
        .expect("workflow observability seam probe should serialize to a JSON object");
    let missing_envelope_fields: Vec<&str> = workflow_seam_minimum_envelope_fields
        .iter()
        .copied()
        .filter(|field| !event_object.contains_key(*field))
        .collect();
    assert!(
        missing_envelope_fields.is_empty(),
        "workflow operator observability seam should pin minimum envelope fields, missing: {missing_envelope_fields:?}"
    );
    assert_eq!(
        event_object.get("event_kind").and_then(Value::as_str),
        Some("phase_transition"),
        "workflow seam observability envelope should keep event_kind machine-readable"
    );
    assert!(
        event_object
            .get("timestamp")
            .and_then(Value::as_str)
            .is_some_and(|timestamp| !timestamp.is_empty()),
        "workflow seam observability envelope should keep timestamp as a non-empty string"
    );
    assert!(
        event_object
            .get("reason_codes")
            .and_then(Value::as_array)
            .is_some_and(|codes| {
                let code_set: BTreeSet<&str> = codes.iter().filter_map(Value::as_str).collect();
                workflow_seam_folded_diagnostics
                    .iter()
                    .all(|reason_code| code_set.contains(reason_code))
            }),
        "workflow seam observability envelope should keep folded conflict/drift diagnostics machine-readable"
    );

    let serialized_counters = to_value(HarnessTelemetryCounters::default())
        .expect("workflow observability seam counters should serialize");
    let counter_object = serialized_counters
        .as_object()
        .expect("workflow observability seam counters should serialize to a JSON object");
    let missing_counter_keys: Vec<&str> = workflow_seam_telemetry_counter_keys
        .iter()
        .copied()
        .filter(|counter_key| !counter_object.contains_key(*counter_key))
        .collect();
    assert!(
        missing_counter_keys.is_empty(),
        "workflow operator observability seam should pin required telemetry counter keys, missing: {missing_counter_keys:?}"
    );
}

#[test]
fn canonical_workflow_operator_surfaces_fail_closed_when_session_entry_is_bypassed() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-bypassed-session");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-bypassed-session";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-phase-bypassed"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-phase-bypassed");

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "bypassed\n");

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase should fail closed when session-entry is bypassed",
        ),
        "workflow phase should fail closed when session-entry is bypassed",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff should fail closed when session-entry is bypassed",
        ),
        "workflow handoff should fail closed when session-entry is bypassed",
    );
    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow next should fail closed when session-entry is bypassed",
    );

    let execution_preflight_phase = public_harness_phase_from_spec("execution_preflight");
    assert_eq!(phase_json["phase"], Value::String(execution_preflight_phase.clone()));
    assert_eq!(phase_json["next_action"], "execution_preflight");
    assert!(phase_json.get("session_entry").is_none());

    assert_eq!(handoff_json["phase"], Value::String(execution_preflight_phase));
    assert_eq!(handoff_json["next_action"], "execution_preflight");
    assert_eq!(handoff_json["recommended_skill"], "featureforge:executing-plans");
    assert!(handoff_json.get("session_entry").is_none());

    assert!(next_output.status.success());
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(
        next_stdout.contains(
            "Return to execution preflight for the approved plan: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"
        ),
        "workflow next should route directly even when a bypassed session decision exists:\n{}",
        next_stdout
    );
    assert!(!next_stdout.contains("Continue outside the FeatureForge workflow"));
}

#[test]
fn canonical_workflow_phase_routes_enabled_stale_plan_to_plan_writing() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-stale-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-stale-plan";

    write_file(
        &repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design-v2.md"),
        "# Approved Spec, Newer Path\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n\n## Notes\n",
    );
    write_file(
        &repo.join("docs/featureforge/plans/2026-01-22-document-review-system.md"),
        "# Approved Plan, Stale Source Path\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Preserve the stale source path case\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The plan remains structurally valid while its source-spec path goes stale.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Detect the stale source path**\n",
    );
    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow phase should route stale plans to plan writing",
        ),
        "rust canonical workflow phase should route stale plans to plan writing",
    );

    assert_eq!(phase_json["route_status"], "stale_plan");
    assert_eq!(phase_json["phase"], "plan_writing");
    assert_eq!(phase_json["next_action"], "use_next_skill");
    assert_eq!(phase_json["next_skill"], "featureforge:writing-plans");
    assert!(phase_json.get("session_entry").is_none());
}

#[test]
fn canonical_workflow_phase_keeps_corrupt_manifest_read_only() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-corrupt-manifest");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = repo.join("docs/featureforge/specs/2026-03-24-corrupt-phase-spec.md");

    write_file(
        &spec_path,
        "# Phase Corrupt Manifest Spec\n\n**Workflow State:** Draft\n**Spec Revision:** 1\n**Last Reviewed By:** brainstorming\n",
    );

    let refresh_output = run_rust_featureforge(
        repo,
        state,
        &["workflow", "status", "--refresh"],
        "rust canonical workflow status refresh should seed the manifest before corrupt phase inspection",
    );
    assert!(
        refresh_output.status.success(),
        "workflow status refresh should succeed before corrupt manifest inspection, got {:?}\nstdout:\n{}\nstderr:\n{}",
        refresh_output.status,
        String::from_utf8_lossy(&refresh_output.stdout),
        String::from_utf8_lossy(&refresh_output.stderr)
    );

    let identity = discover_repo_identity(repo).expect("repo identity should resolve");
    let manifest_path = manifest_path(&identity, state);
    fs::write(&manifest_path, "{ \"broken\": true\n")
        .expect("corrupt manifest fixture should be writable");
    let before_bytes = fs::read(&manifest_path).expect("corrupt manifest fixture should exist");

    let phase_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "phase", "--json"],
            "rust canonical workflow phase should inspect corrupt manifests without repairing them",
        ),
        "rust canonical workflow phase should inspect corrupt manifests without repairing them",
    );
    assert!(phase_json["phase"].is_string());

    let after_bytes = fs::read(&manifest_path)
        .expect("workflow phase should leave the corrupt manifest in place");
    assert_eq!(after_bytes, before_bytes);

    let parent = manifest_path
        .parent()
        .expect("manifest fixture should have a parent directory");
    let backup_prefix = format!(
        "{}.corrupt-",
        manifest_path
            .file_name()
            .expect("manifest fixture should have a file name")
            .to_string_lossy()
    );
    let backup_written = fs::read_dir(parent)
        .expect("manifest directory should stay readable")
        .flatten()
        .any(|entry| {
            entry
                .file_name()
                .to_string_lossy()
                .starts_with(&backup_prefix)
        });
    assert!(
        !backup_written,
        "workflow phase should not create corrupt-manifest backups for read-only inspection"
    );
}

#[test]
fn canonical_workflow_public_text_commands_work_for_ready_plan() {
    let (repo_dir, state_dir) = init_repo("workflow-public-text-commands");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-public-text-commands";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-public-text"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-public-text");

    install_full_contract_ready_artifacts(repo);
    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "rust canonical workflow next should be available on ready plans",
    );
    assert!(
        next_output.status.success(),
        "workflow next should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        next_output.status,
        String::from_utf8_lossy(&next_output.stdout),
        String::from_utf8_lossy(&next_output.stderr)
    );
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(next_stdout.contains("Next safe step:"));
    assert!(next_stdout.contains("Reason:"));
    assert!(next_stdout.contains("Return to execution preflight for the approved plan: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"));
    assert!(next_stdout.contains("The approved plan matches the latest approved spec and preflight is the next safe boundary."));
    assert!(!next_stdout.contains("session-entry"));

    let artifacts_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "artifacts"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "rust canonical workflow artifacts should be available on ready plans",
    );
    assert!(
        artifacts_output.status.success(),
        "workflow artifacts should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        artifacts_output.status,
        String::from_utf8_lossy(&artifacts_output.stdout),
        String::from_utf8_lossy(&artifacts_output.stderr)
    );
    let artifacts_stdout = String::from_utf8_lossy(&artifacts_output.stdout);
    assert!(artifacts_stdout.contains("Workflow artifacts"));
    assert!(artifacts_stdout.contains(
        "Spec: docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md"
    ));
    assert!(
        artifacts_stdout
            .contains("Plan: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md")
    );

    let explain_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "explain"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "rust canonical workflow explain should be available on ready plans",
    );
    assert!(
        explain_output.status.success(),
        "workflow explain should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        explain_output.status,
        String::from_utf8_lossy(&explain_output.stdout),
        String::from_utf8_lossy(&explain_output.stderr)
    );
    let explain_stdout = String::from_utf8_lossy(&explain_output.stdout);
    assert!(explain_stdout.contains("Why FeatureForge chose this state"));
    assert!(explain_stdout.contains("- State: implementation_ready"));
    assert!(explain_stdout.contains(
        "- Spec: docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md"
    ));
    assert!(
        explain_stdout.contains(
            "- Plan: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"
        )
    );
    assert!(explain_stdout.contains("1. Return to execution preflight for the approved plan: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"));
    assert!(!explain_stdout.contains("session-entry"));
}

#[test]
fn canonical_workflow_public_json_commands_work_for_ready_plan() {
    let (repo_dir, state_dir) = init_repo("workflow-public-json-commands");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-public-json-commands";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-public-json"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-public-json");

    install_full_contract_ready_artifacts(repo);
    let execution_preflight_phase = public_harness_phase_from_spec("execution_preflight");

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow doctor should be available on ready plans",
        ),
        "rust canonical workflow doctor should be available on ready plans",
    );
    assert_eq!(
        doctor_json["phase"],
        Value::String(execution_preflight_phase.clone())
    );
    assert_eq!(doctor_json["route_status"], "implementation_ready");
    assert_eq!(doctor_json["next_action"], "execution_preflight");
    assert_eq!(
        doctor_json["spec_path"],
        "docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md"
    );
    assert_eq!(doctor_json["plan_path"], plan_rel);
    assert_eq!(doctor_json["contract_state"], "valid");
    assert!(doctor_json.get("session_entry").is_none());
    assert_eq!(doctor_json["schema_version"], 2);
    assert_eq!(doctor_json["route"]["schema_version"], 3);
    assert_eq!(doctor_json["execution_status"]["execution_started"], "no");
    assert_eq!(doctor_json["preflight"]["allowed"], true);
    assert_eq!(doctor_json["gate_review"], Value::Null);
    assert_eq!(doctor_json["gate_finish"], Value::Null);

    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow handoff should be available on ready plans",
        ),
        "rust canonical workflow handoff should be available on ready plans",
    );
    assert_eq!(
        handoff_json["phase"],
        Value::String(execution_preflight_phase)
    );
    assert_eq!(handoff_json["route_status"], "implementation_ready");
    assert_eq!(handoff_json["execution_started"], "no");
    assert_eq!(handoff_json["next_action"], "execution_preflight");
    assert_eq!(
        handoff_json["spec_path"],
        "docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md"
    );
    assert_eq!(handoff_json["plan_path"], plan_rel);
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:executing-plans"
    );
    assert_eq!(
        handoff_json["recommendation"]["recommended_skill"],
        "featureforge:executing-plans"
    );
    assert_eq!(
        handoff_json["recommendation"]["selected_topology"],
        "conservative-fallback"
    );
    assert!(
        handoff_json["recommendation_reason"]
            .as_str()
            .is_some_and(|value| !value.is_empty())
    );
    assert!(handoff_json.get("session_entry").is_none());
    assert_eq!(handoff_json["schema_version"], 2);
    assert_eq!(handoff_json["route"]["schema_version"], 3);

    let preflight_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "preflight", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow preflight should be available on ready plans",
        ),
        "rust canonical workflow preflight should be available on ready plans",
    );
    assert_eq!(preflight_json["allowed"], true);

    let gate_review_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "review", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow gate review should be available on ready plans",
        ),
        "rust canonical workflow gate review should be available on ready plans",
    );
    assert_eq!(gate_review_json["allowed"], false);
    assert_eq!(gate_review_json["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_review_json["reason_codes"][0],
        "unfinished_steps_remaining"
    );

    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow gate finish should be available on ready plans",
        ),
        "rust canonical workflow gate finish should be available on ready plans",
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "ExecutionStateNotReady");
    assert_eq!(
        gate_finish_json["reason_codes"],
        gate_review_json["reason_codes"]
    );
}

#[test]
fn canonical_workflow_doctor_exposes_harness_state_before_execution_starts() {
    let (repo_dir, state_dir) = init_repo("workflow-public-harness-state");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-public-harness-state";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

    let implementation_handoff_phase = public_harness_phase_from_spec("implementation_handoff");
    let execution_preflight_phase = public_harness_phase_from_spec("execution_preflight");

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for harness state fixture",
        ),
        "workflow doctor for harness state fixture",
    );

    assert_eq!(
        doctor_json["phase"],
        Value::String(execution_preflight_phase)
    );
    assert_eq!(doctor_json["route_status"], "implementation_ready");
    assert_eq!(doctor_json["next_action"], "execution_preflight");
    assert_eq!(doctor_json["execution_status"]["execution_started"], "no");
    assert_eq!(doctor_json["gate_review"], Value::Null);
    assert_eq!(doctor_json["gate_finish"], Value::Null);

    let execution_status = &doctor_json["execution_status"];
    let execution_run_id = execution_status
        .get("execution_run_id")
        .expect("workflow doctor should expose execution_run_id");
    assert!(
        execution_run_id.is_null(),
        "workflow doctor should expose execution_run_id as null before preflight acceptance, got {execution_run_id:?}"
    );
    assert_eq!(
        execution_status["harness_phase"],
        Value::String(implementation_handoff_phase)
    );
    assert_eq!(
        execution_status["latest_authoritative_sequence"],
        Value::from(0)
    );

    let missing_pre_acceptance_null_fields = missing_null_fields(
        execution_status,
        &[
            "chunking_strategy",
            "evaluator_policy",
            "reset_policy",
            "review_stack",
        ],
    );
    assert!(
        missing_pre_acceptance_null_fields.is_empty(),
        "workflow doctor should expose pre-acceptance policy fields as required-and-null before execution preflight accepts run identity, missing null fields: {missing_pre_acceptance_null_fields:?}"
    );

    for field in [
        "aggregate_evaluation_state",
        "repo_state_baseline_head_sha",
        "repo_state_baseline_worktree_fingerprint",
        "repo_state_drift_state",
        "dependency_index_state",
        "final_review_state",
        "browser_qa_state",
        "release_docs_state",
        "last_final_review_artifact_fingerprint",
        "last_browser_qa_artifact_fingerprint",
        "last_release_docs_artifact_fingerprint",
    ] {
        assert!(
            execution_status.get(field).is_some(),
            "workflow doctor should expose {field} in execution_status"
        );
    }

    for field in ["write_authority_holder", "write_authority_worktree"] {
        let value = execution_status
            .get(field)
            .unwrap_or_else(|| panic!("workflow doctor should expose {field}"));
        assert!(
            value.is_null() || value.as_str().is_some_and(|value| !value.is_empty()),
            "workflow doctor should expose {field} as null when unknown pre-start or as non-empty diagnostic metadata once known, got {value:?}"
        );
    }

    let missing_null_fields = missing_null_fields(
        execution_status,
        &[
            "active_contract_path",
            "active_contract_fingerprint",
            "last_evaluation_report_path",
            "last_evaluation_report_fingerprint",
            "last_evaluation_evaluator_kind",
        ],
    );
    assert!(
        missing_null_fields.is_empty(),
        "workflow doctor should keep active pointers authoritative-only before execution starts, missing null fields: {missing_null_fields:?}"
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
            execution_status
                .get(field)
                .and_then(Value::as_array)
                .is_some(),
            "workflow doctor should expose array field {field} in execution_status"
        );
    }

    let review_stack = execution_status
        .get("review_stack")
        .expect("workflow doctor should expose review_stack in execution_status");
    assert!(
        review_stack.is_null(),
        "workflow doctor should expose review_stack as required-and-null before execution preflight accepts policy, got {review_stack:?}"
    );
}

#[test]
fn canonical_workflow_doctor_shares_authoritative_state_across_same_branch_worktrees() {
    let (repo_dir, state_dir) = init_repo("workflow-public-same-branch-worktree");
    let repo_a = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-public-same-branch-worktree";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    let linked_worktree_root = TempDir::new().expect("linked worktree tempdir should exist");
    let repo_b = linked_worktree_root
        .path()
        .join("same-branch-linked-worktree");
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-public-same-branch-worktree"])
        .current_dir(repo_a);
    run_checked(
        git_checkout,
        "git checkout workflow-public-same-branch-worktree",
    );

    let mut git_worktree_add = Command::new("git");
    git_worktree_add
        .arg("worktree")
        .arg("add")
        .arg("--force")
        .arg(&repo_b)
        .arg("workflow-public-same-branch-worktree")
        .current_dir(repo_a);
    run_checked(
        git_worktree_add,
        "git worktree add --force same-branch-linked-worktree",
    );

    install_full_contract_ready_artifacts(repo_a);
    install_full_contract_ready_artifacts(&repo_b);
    write_file(&decision_path, "enabled\n");

    let status_a = run_plan_execution_json(
        repo_a,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status before same-branch worktree authoritative sharing fixture",
    );
    let preflight_a = parse_json(
        &run_rust_featureforge_with_env(
            repo_a,
            state,
            &["workflow", "preflight", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow preflight before same-branch worktree authoritative sharing fixture",
        ),
        "workflow preflight before same-branch worktree authoritative sharing fixture",
    );
    assert_eq!(preflight_a["allowed"], true);
    run_plan_execution_json(
        repo_a,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_a["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "plan execution begin for same-branch worktree authoritative sharing fixture",
    );

    let doctor_a = parse_json(
        &run_rust_featureforge_with_env(
            repo_a,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for same-branch authoritative scope on repo A",
        ),
        "workflow doctor for same-branch authoritative scope on repo A",
    );
    let doctor_b = parse_json(
        &run_rust_featureforge_with_env(
            &repo_b,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for same-branch authoritative scope on repo B",
        ),
        "workflow doctor for same-branch authoritative scope on repo B",
    );

    for doctor in [&doctor_a, &doctor_b] {
        assert_eq!(doctor["phase"], "executing");
        assert_eq!(doctor["execution_status"]["execution_started"], "yes");
        assert_eq!(doctor["execution_status"]["active_task"], 1);
        assert_eq!(doctor["execution_status"]["active_step"], 1);
        let execution_run_id = doctor["execution_status"]
            .get("execution_run_id")
            .expect("same-branch worktrees should expose execution_run_id");
        assert!(
            execution_run_id
                .as_str()
                .is_some_and(|value| !value.is_empty()),
            "same-branch worktrees should expose a non-empty shared execution_run_id after execution_preflight acceptance and execution start, got {execution_run_id:?}"
        );
        assert!(
            doctor["execution_status"]["latest_authoritative_sequence"]
                .as_u64()
                .is_some(),
            "same-branch worktrees should expose numeric authoritative sequence diagnostics once execution starts"
        );
        let reason_codes = doctor["execution_status"]["reason_codes"]
            .as_array()
            .expect("same-branch worktrees should expose execution reason_codes as an array");
        if reason_codes
            .iter()
            .any(|value| value == &Value::String(String::from("write_authority_conflict")))
        {
            assert!(
                doctor["execution_status"]["write_authority_holder"].is_string(),
                "write_authority_conflict should keep authority holder metadata visible"
            );
            assert!(
                doctor["execution_status"]["write_authority_worktree"].is_string(),
                "write_authority_conflict should keep authority worktree metadata visible"
            );
        }
    }

    let run_id_a = doctor_a["execution_status"]["execution_run_id"]
        .as_str()
        .expect("repo A should expose an execution_run_id after execution_preflight acceptance");
    let run_id_b = doctor_b["execution_status"]["execution_run_id"]
        .as_str()
        .expect("repo B should expose an execution_run_id after execution_preflight acceptance");
    assert_eq!(
        run_id_a, run_id_b,
        "same-branch worktrees should share one authoritative execution run after execution starts"
    );

    assert_eq!(
        doctor_a["execution_status"]["latest_authoritative_sequence"],
        doctor_b["execution_status"]["latest_authoritative_sequence"],
        "same-branch worktrees should share authoritative sequence state"
    );

    let holder_a = &doctor_a["execution_status"]["write_authority_holder"];
    let holder_b = &doctor_b["execution_status"]["write_authority_holder"];
    let worktree_a = &doctor_a["execution_status"]["write_authority_worktree"];
    let worktree_b = &doctor_b["execution_status"]["write_authority_worktree"];

    for (field, value) in [
        ("write_authority_holder", holder_a),
        ("write_authority_holder", holder_b),
        ("write_authority_worktree", worktree_a),
        ("write_authority_worktree", worktree_b),
    ] {
        assert!(
            value.is_null() || value.as_str().is_some_and(|value| !value.is_empty()),
            "same-branch worktrees should expose {field} as null when authority diagnostics are not yet emitted, or as non-empty diagnostics once emitted, got {value:?}"
        );
    }

    assert_eq!(
        holder_a, holder_b,
        "same-branch worktrees should agree on the shared authority holder"
    );
    assert_eq!(
        worktree_a, worktree_b,
        "same-branch worktrees should agree on the authoritative worktree diagnostic"
    );
}

#[test]
fn canonical_workflow_doctor_does_not_adopt_started_status_across_different_branch_worktrees() {
    let (repo_dir, state_dir) = init_repo("workflow-public-cross-branch-worktree");
    let repo_a = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-public-cross-branch-worktree";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    let linked_worktree_root = TempDir::new().expect("linked worktree tempdir should exist");
    let repo_b = linked_worktree_root
        .path()
        .join("cross-branch-linked-worktree");
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-public-cross-branch-worktree-a"])
        .current_dir(repo_a);
    run_checked(
        git_checkout,
        "git checkout workflow-public-cross-branch-worktree-a",
    );

    let mut git_worktree_add = Command::new("git");
    git_worktree_add
        .arg("worktree")
        .arg("add")
        .arg("--force")
        .arg("-b")
        .arg("workflow-public-cross-branch-worktree-b")
        .arg(&repo_b)
        .arg("HEAD")
        .current_dir(repo_a);
    run_checked(
        git_worktree_add,
        "git worktree add --force -b workflow-public-cross-branch-worktree-b cross-branch-linked-worktree HEAD",
    );

    install_full_contract_ready_artifacts(repo_a);
    install_full_contract_ready_artifacts(&repo_b);
    write_file(&decision_path, "enabled\n");

    let status_a = run_plan_execution_json(
        repo_a,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status before cross-branch worktree sharing fixture",
    );
    let preflight_a = parse_json(
        &run_rust_featureforge_with_env(
            repo_a,
            state,
            &["workflow", "preflight", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow preflight before cross-branch worktree sharing fixture",
        ),
        "workflow preflight before cross-branch worktree sharing fixture",
    );
    assert_eq!(preflight_a["allowed"], true);
    run_plan_execution_json(
        repo_a,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_a["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "plan execution begin for cross-branch worktree sharing fixture",
    );

    let doctor_a = parse_json(
        &run_rust_featureforge_with_env(
            repo_a,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for cross-branch scope on repo A",
        ),
        "workflow doctor for cross-branch scope on repo A",
    );
    let doctor_b = parse_json(
        &run_rust_featureforge_with_env(
            &repo_b,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for cross-branch scope on repo B",
        ),
        "workflow doctor for cross-branch scope on repo B",
    );

    assert_eq!(doctor_a["phase"], "executing");
    assert_eq!(doctor_a["execution_status"]["execution_started"], "yes");
    assert_eq!(doctor_a["execution_status"]["active_task"], 1);
    assert_eq!(doctor_a["execution_status"]["active_step"], 1);

    assert_ne!(
        doctor_b["phase"], "executing",
        "cross-branch worktrees must not inherit started execution routing from another branch"
    );
    assert_eq!(
        doctor_b["execution_status"]["execution_started"], "no",
        "cross-branch worktrees must not inherit started execution status from another branch"
    );
    assert!(
        doctor_b["execution_status"]["active_task"].is_null(),
        "cross-branch worktrees should not expose an active task when local execution has not started"
    );
    assert!(
        doctor_b["execution_status"]["active_step"].is_null(),
        "cross-branch worktrees should not expose an active step when local execution has not started"
    );
}

#[test]
fn canonical_workflow_routes_started_execution_back_to_the_current_execution_flow() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-started-execution");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-started-execution";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");
    prepare_preflight_acceptance_workspace(repo, "workflow-phase-started-execution");

    let status_json = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status before started-execution routing fixture",
    );
    let preflight_json = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "plan execution preflight before started-execution routing fixture",
    );
    assert_eq!(preflight_json["allowed"], true);
    run_plan_execution_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            status_json["execution_fingerprint"]
                .as_str()
                .expect("status fingerprint should be present"),
        ],
        "plan execution begin for started-execution routing fixture",
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for started-execution routing fixture",
        ),
        "workflow phase for started-execution routing fixture",
    );
    assert_eq!(phase_json["phase"], "executing");
    assert_eq!(phase_json["next_action"], "return_to_execution");

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for started-execution routing fixture",
        ),
        "workflow doctor for started-execution routing fixture",
    );
    assert_eq!(doctor_json["phase"], "executing");
    assert_eq!(doctor_json["execution_status"]["execution_started"], "yes");
    assert_eq!(doctor_json["execution_status"]["active_task"], 1);
    assert_eq!(doctor_json["execution_status"]["active_step"], 1);
    assert_eq!(doctor_json["preflight"], Value::Null);
    assert_eq!(doctor_json["gate_review"], Value::Null);
    assert_eq!(doctor_json["gate_finish"], Value::Null);

    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for started-execution routing fixture",
        ),
        "workflow handoff for started-execution routing fixture",
    );
    assert_eq!(handoff_json["phase"], "executing");
    assert_eq!(handoff_json["execution_started"], "yes");
    assert_eq!(handoff_json["next_action"], "return_to_execution");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:executing-plans"
    );
    assert_eq!(handoff_json["recommendation"], Value::Null);
    assert_eq!(
        handoff_json["recommendation_reason"],
        "Execution already started for the approved plan revision; continue with the current execution flow."
    );

    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow next for started-execution routing fixture",
    );
    assert!(next_output.status.success());
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(next_stdout.contains("Return to the current execution flow for the approved plan: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"));
    assert!(next_stdout.contains("Execution already started for the approved plan and should continue through the current execution flow."));
}

#[test]
fn workflow_phase_routes_task_boundary_blocked() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-task-boundary-blocked");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-task-boundary-blocked";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let spec_rel = "docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md";

    install_full_contract_ready_artifacts(repo);
    write_file(
        &repo.join(plan_rel),
        &format!(
            r#"# Runtime Integration Hardening Implementation Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `{spec_rel}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-004 -> Task 1
- VERIFY-001 -> Task 2

## Execution Strategy

- Execute Task 1 serially. It establishes boundary gating before follow-on work begins.
- Execute Task 2 serially after Task 1. It validates task-boundary workflow routing.

## Dependency Diagram

```text
Task 1 -> Task 2
```

## Task 1: Core flow

**Spec Coverage:** REQ-001, REQ-004
**Task Outcome:** Task 1 execution reaches a boundary gate before Task 2 starts.
**Plan Constraints:**
- Keep fixture inputs deterministic.
**Open Questions:** none

**Files:**
- Modify: `tests/workflow_runtime.rs`

- [ ] **Step 1: Prepare workflow fixture output**
- [ ] **Step 2: Validate workflow fixture output**

## Task 2: Follow-on flow

**Spec Coverage:** VERIFY-001
**Task Outcome:** Task 2 should remain blocked until Task 1 closure requirements are met.
**Plan Constraints:**
- Preserve deterministic task-boundary diagnostics.
**Open Questions:** none

**Files:**
- Modify: `tests/workflow_runtime.rs`

- [ ] **Step 1: Start the follow-on task**
"#
        ),
    );

    enable_session_decision(state, session_key);
    prepare_preflight_acceptance_workspace(repo, "workflow-phase-task-boundary-blocked");

    let status_before_begin = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status before task-boundary blocked workflow fixture execution",
    );
    let preflight = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "preflight for task-boundary blocked workflow fixture execution",
    );
    assert_eq!(preflight["allowed"], true);
    let begin_task1_step1 = run_plan_execution_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
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
        "begin task 1 step 1 for task-boundary blocked workflow fixture",
    );
    let complete_task1_step1 = run_plan_execution_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Completed task 1 step 1 for task-boundary blocked workflow fixture.",
            "--manual-verify-summary",
            "Verified by workflow task-boundary fixture setup.",
            "--file",
            "tests/workflow_runtime.rs",
            "--expect-execution-fingerprint",
            begin_task1_step1["execution_fingerprint"]
                .as_str()
                .expect("begin should expose execution fingerprint for complete"),
        ],
        "complete task 1 step 1 for task-boundary blocked workflow fixture",
    );
    let begin_task1_step2 = run_plan_execution_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "2",
            "--execution-mode",
            "featureforge:executing-plans",
            "--expect-execution-fingerprint",
            complete_task1_step1["execution_fingerprint"]
                .as_str()
                .expect("complete should expose execution fingerprint for next begin"),
        ],
        "begin task 1 step 2 for task-boundary blocked workflow fixture",
    );
    run_plan_execution_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "2",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Completed task 1 step 2 for task-boundary blocked workflow fixture.",
            "--manual-verify-summary",
            "Verified by workflow task-boundary fixture setup.",
            "--file",
            "tests/workflow_runtime.rs",
            "--expect-execution-fingerprint",
            begin_task1_step2["execution_fingerprint"]
                .as_str()
                .expect("begin should expose execution fingerprint for complete"),
        ],
        "complete task 1 step 2 for task-boundary blocked workflow fixture",
    );
    let branch = current_branch_name(repo);
    update_authoritative_harness_state(repo, state, &branch, plan_rel, 1, &[]);
    run_plan_execution_json(
        repo,
        state,
        &["gate-review-dispatch", "--plan", plan_rel],
        "record task-boundary review dispatch for blocked workflow fixture",
    );

    let execution_status = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "execution status after task 1 completion for task-boundary blocked workflow fixture",
    );
    assert_eq!(execution_status["active_task"], Value::Null);
    assert_eq!(execution_status["blocking_task"], Value::from(1));
    assert_eq!(execution_status["blocking_step"], Value::Null);
    assert!(
        execution_status["reason_codes"]
            .as_array()
            .is_some_and(|codes| {
                codes
                    .iter()
                    .any(|code| code.as_str() == Some("prior_task_review_not_green"))
            }),
        "execution status should surface prior_task_review_not_green for task-boundary blocked fixture, got {execution_status:?}"
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for task-boundary blocked routing fixture",
        ),
        "workflow phase for task-boundary blocked routing fixture",
    );
    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for task-boundary blocked routing fixture",
        ),
        "workflow doctor for task-boundary blocked routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for task-boundary blocked routing fixture",
        ),
        "workflow handoff for task-boundary blocked routing fixture",
    );

    let expected_phase = public_harness_phase_from_spec("repairing");
    assert_eq!(
        phase_json["phase"], expected_phase,
        "task-boundary blocked phase fixture should route to repairing; phase payload: {phase_json:?}"
    );
    assert_eq!(phase_json["next_action"], "return_to_execution");
    assert_eq!(doctor_json["phase"], expected_phase);
    assert_eq!(doctor_json["next_action"], "return_to_execution");
    assert_eq!(handoff_json["phase"], expected_phase);
    assert_eq!(handoff_json["next_action"], "return_to_execution");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:executing-plans"
    );
    assert!(
        handoff_json["recommendation_reason"]
            .as_str()
            .is_some_and(|reason| reason.contains("prior_task_review_not_green")),
        "workflow handoff should surface task-boundary reason-code guidance, got {handoff_json:?}"
    );
    assert!(
        doctor_json["execution_status"]["reason_codes"]
            .as_array()
            .is_some_and(|codes| {
                codes
                    .iter()
                    .any(|code| code.as_str() == Some("prior_task_review_not_green"))
            }),
        "workflow doctor should preserve execution reason-code parity for task-boundary blocks, got {doctor_json:?}"
    );

    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow next for task-boundary blocked routing fixture",
    );
    assert!(next_output.status.success());
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(next_stdout.contains("prior_task_review_not_green"));
    assert!(next_stdout.contains("Task-boundary gate"));
}

#[test]
fn workflow_next_surfaces_gate_review_command_for_dispatch_block_reason() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-task-boundary-dispatch-blocked");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-task-boundary-dispatch-blocked";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let spec_rel = "docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md";

    install_full_contract_ready_artifacts(repo);
    write_file(
        &repo.join(plan_rel),
        &format!(
            r#"# Runtime Integration Hardening Implementation Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `{spec_rel}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-004 -> Task 1
- VERIFY-001 -> Task 2

## Execution Strategy

- Execute Task 1 serially. It establishes boundary gating before follow-on work begins.
- Execute Task 2 serially after Task 1. It validates task-boundary workflow routing.

## Dependency Diagram

```text
Task 1 -> Task 2
```

## Task 1: Core flow

**Spec Coverage:** REQ-001, REQ-004
**Task Outcome:** Task 1 reaches task-boundary closure gate before Task 2 starts.
**Plan Constraints:**
- Keep fixture input deterministic.
**Open Questions:** none

**Files:**
- Modify: `tests/workflow_runtime.rs`

- [ ] **Step 1: Prepare workflow fixture output**

## Task 2: Follow-on flow

**Spec Coverage:** VERIFY-001
**Task Outcome:** Task 2 remains blocked until task-boundary closure is satisfied.
**Plan Constraints:**
- Preserve task-boundary diagnostics.
**Open Questions:** none

**Files:**
- Modify: `tests/workflow_runtime.rs`

- [ ] **Step 1: Start the follow-on task**
"#
        ),
    );

    enable_session_decision(state, session_key);
    prepare_preflight_acceptance_workspace(repo, "workflow-phase-task-boundary-dispatch-blocked");

    let status_before_begin = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status before begin for workflow dispatch-blocked fixture",
    );
    let preflight = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "preflight for workflow dispatch-blocked fixture",
    );
    assert_eq!(preflight["allowed"], true);

    let begin_task1_step1 = run_plan_execution_json(
        repo,
        state,
        &[
            "begin",
            "--plan",
            plan_rel,
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
        "begin task 1 step 1 for workflow dispatch-blocked fixture",
    );
    run_plan_execution_json(
        repo,
        state,
        &[
            "complete",
            "--plan",
            plan_rel,
            "--task",
            "1",
            "--step",
            "1",
            "--source",
            "featureforge:executing-plans",
            "--claim",
            "Completed task 1 step 1 for workflow dispatch-blocked fixture.",
            "--manual-verify-summary",
            "Verified by workflow dispatch-blocked fixture setup.",
            "--file",
            "tests/workflow_runtime.rs",
            "--expect-execution-fingerprint",
            begin_task1_step1["execution_fingerprint"]
                .as_str()
                .expect("begin should expose execution fingerprint for complete"),
        ],
        "complete task 1 step 1 for workflow dispatch-blocked fixture",
    );

    let branch = current_branch_name(repo);
    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[(
            "reason_codes",
            json!(["prior_task_review_dispatch_missing"]),
        )],
    );

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for task-boundary dispatch-blocked fixture",
        ),
        "workflow doctor for task-boundary dispatch-blocked fixture",
    );
    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for task-boundary dispatch-blocked fixture",
        ),
        "workflow phase for task-boundary dispatch-blocked fixture",
    );
    assert!(
        phase_json["next_step"]
            .as_str()
            .is_some_and(|next_step| next_step.contains("featureforge plan execution gate-review-dispatch --plan")),
        "workflow phase json should expose gate-review command guidance for dispatch-blocked repair flow, got {phase_json:?}"
    );
    assert!(
        phase_json["next_step"]
            .as_str()
            .is_some_and(|next_step| next_step.contains(plan_rel)),
        "workflow phase json should include the approved plan path in dispatch-blocked next-step guidance, got {phase_json:?}"
    );
    assert!(
        doctor_json["next_step"]
            .as_str()
            .is_some_and(|next_step| next_step.contains("featureforge plan execution gate-review-dispatch --plan")),
        "workflow doctor should expose gate-review command guidance for dispatch-blocked repair flow, got {doctor_json:?}"
    );
    assert!(
        doctor_json["next_step"]
            .as_str()
            .is_some_and(|next_step| next_step.contains(plan_rel)),
        "workflow doctor should include the approved plan path in dispatch-blocked next-step guidance, got {doctor_json:?}"
    );

    let doctor_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "doctor"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow doctor text for task-boundary dispatch-blocked fixture",
    );
    assert!(doctor_output.status.success());
    let doctor_stdout = String::from_utf8_lossy(&doctor_output.stdout);
    assert!(
        doctor_stdout.contains("featureforge plan execution gate-review-dispatch --plan"),
        "workflow doctor text should include gate-review command guidance, got:\n{doctor_stdout}"
    );
    assert!(doctor_stdout.contains(plan_rel), "doctor stdout:\n{doctor_stdout}");

    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for task-boundary dispatch-blocked fixture",
        ),
        "workflow handoff for task-boundary dispatch-blocked fixture",
    );
    assert!(
        handoff_json["recommendation_reason"]
            .as_str()
            .is_some_and(|reason| reason.contains("featureforge plan execution gate-review-dispatch --plan")),
        "workflow handoff should include gate-review command guidance for dispatch-blocked repair flow, got {handoff_json:?}"
    );
    assert!(
        handoff_json["recommendation_reason"]
            .as_str()
            .is_some_and(|reason| reason.contains(plan_rel)),
        "workflow handoff should include the approved plan path in dispatch-blocked guidance, got {handoff_json:?}"
    );

    let handoff_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff text for task-boundary dispatch-blocked fixture",
    );
    assert!(handoff_output.status.success());
    let handoff_stdout = String::from_utf8_lossy(&handoff_output.stdout);
    assert!(
        handoff_stdout.contains("featureforge plan execution gate-review-dispatch --plan"),
        "workflow handoff text should include gate-review command guidance, got:\n{handoff_stdout}"
    );
    assert!(handoff_stdout.contains(plan_rel), "handoff stdout:\n{handoff_stdout}");

    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow next for task-boundary dispatch-blocked fixture",
    );
    assert!(next_output.status.success());
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(
        next_stdout.contains("featureforge plan execution gate-review-dispatch --plan"),
        "workflow next output should include gate-review command guidance, got:\n{next_stdout}"
    );
    assert!(next_stdout.contains(plan_rel), "next stdout:\n{next_stdout}");
}

#[test]
fn canonical_workflow_routes_blocked_preflight_back_to_execution_handoff() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-blocked-preflight");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-blocked-preflight";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");
    write_file(&repo.join(".git/MERGE_HEAD"), "deadbeef\n");

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for blocked-preflight routing fixture",
        ),
        "workflow phase for blocked-preflight routing fixture",
    );
    assert_eq!(phase_json["phase"], "implementation_handoff");
    assert_eq!(phase_json["next_action"], "execution_preflight");

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for blocked-preflight routing fixture",
        ),
        "workflow doctor for blocked-preflight routing fixture",
    );
    assert_eq!(doctor_json["phase"], "execution_preflight");
    assert_eq!(doctor_json["execution_status"]["execution_started"], "no");
    assert_eq!(doctor_json["preflight"]["allowed"], false);
    assert_eq!(
        doctor_json["preflight"]["failure_class"],
        "WorkspaceNotSafe"
    );
    assert!(
        doctor_json["preflight"]["reason_codes"]
            .as_array()
            .expect("reason_codes should stay an array")
            .iter()
            .any(|value| value == &Value::String(String::from("merge_in_progress")))
    );
    assert_eq!(doctor_json["gate_review"], Value::Null);
    assert_eq!(doctor_json["gate_finish"], Value::Null);

    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for blocked-preflight routing fixture",
        ),
        "workflow handoff for blocked-preflight routing fixture",
    );
    assert_eq!(handoff_json["phase"], "implementation_handoff");
    assert_eq!(handoff_json["execution_started"], "no");
    assert_eq!(handoff_json["next_action"], "execution_preflight");
    assert_eq!(handoff_json["recommended_skill"], "");
    assert_eq!(handoff_json["recommendation"], Value::Null);
    assert_eq!(
        handoff_json["recommendation_reason"],
        "The approved plan is ready, but execution preflight is still blocked by the current workspace state."
    );

    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow next for blocked-preflight routing fixture",
    );
    assert!(next_output.status.success());
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(next_stdout.contains("Return to execution preflight for the approved plan: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"));
    assert!(next_stdout.contains("The approved plan is ready, but execution preflight is still blocked by the current workspace state."));
}

#[test]
fn canonical_workflow_routes_dirty_worktree_back_to_execution_handoff() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-dirty-preflight");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-dirty-preflight";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");
    write_file(
        &repo.join("README.md"),
        "# workflow-phase-dirty-preflight\ntracked change before execution\n",
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for dirty-worktree preflight routing fixture",
        ),
        "workflow phase for dirty-worktree preflight routing fixture",
    );
    assert_eq!(phase_json["phase"], "implementation_handoff");
    assert_eq!(phase_json["next_action"], "execution_preflight");

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for dirty-worktree preflight routing fixture",
        ),
        "workflow doctor for dirty-worktree preflight routing fixture",
    );
    assert_eq!(doctor_json["phase"], "execution_preflight");
    assert_eq!(doctor_json["execution_status"]["execution_started"], "no");
    assert_eq!(doctor_json["preflight"]["allowed"], false);
    assert_eq!(
        doctor_json["preflight"]["failure_class"],
        "WorkspaceNotSafe"
    );
    assert!(
        doctor_json["preflight"]["reason_codes"]
            .as_array()
            .expect("reason_codes should stay an array")
            .iter()
            .any(|value| value == &Value::String(String::from("tracked_worktree_dirty")))
    );
    assert_eq!(doctor_json["gate_review"], Value::Null);
    assert_eq!(doctor_json["gate_finish"], Value::Null);
}

#[test]
fn canonical_workflow_handoff_rejects_legacy_pre_harness_cutover_state() {
    let (repo_dir, state_dir) = init_repo("workflow-handoff-legacy-pre-harness-cutover");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-handoff-legacy-pre-harness-cutover";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let cutover_message = "Legacy pre-harness execution evidence is no longer accepted; regenerate execution evidence using the harness v2 format.";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    install_full_contract_ready_artifacts(repo);
    enable_session_decision(state, session_key);
    assert_eq!(
        fs::read_to_string(&decision_path).expect("session decision should be readable"),
        "enabled\n"
    );
    assert!(
        fs::read_to_string(repo.join(plan_rel))
            .expect("approved plan fixture should be readable")
            .contains("**Workflow State:** Engineering Approved"),
        "fixture should keep an engineering-approved plan for workflow handoff routing"
    );

    let execution_status = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status before legacy pre-harness cutover handoff fixture",
    );
    let evidence_path = repo.join(
        execution_status["evidence_path"]
            .as_str()
            .expect("execution status should expose evidence_path"),
    );
    write_file(&repo.join("docs/example-output.md"), "legacy output\n");
    write_file(
        &evidence_path,
        &format!(
            "# Execution Evidence: 2026-03-17-example-execution-plan\n\n**Plan Path:** {plan_rel}\n**Plan Revision:** 1\n\n## Step Evidence\n\n### Task 1 Step 1\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T14:22:31Z\n**Execution Source:** featureforge:executing-plans\n**Claim:** Prepared the workspace for execution.\n**Files:**\n- docs/example-output.md\n**Verification:**\n- Manual verification recorded in fixture setup.\n**Invalidation Reason:** N/A\n"
        ),
    );
    assert!(
        fs::read_to_string(&evidence_path)
            .expect("legacy execution evidence fixture should be readable")
            .contains("## Step Evidence"),
        "fixture should inject legacy pre-harness execution evidence"
    );

    let handoff_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff", "--json"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff for legacy pre-harness cutover fixture",
    );
    assert!(
        !handoff_output.status.success(),
        "workflow handoff --json should fail closed for legacy pre-harness cutover state, got {:?}\nstdout:\n{}\nstderr:\n{}",
        handoff_output.status,
        String::from_utf8_lossy(&handoff_output.stdout),
        String::from_utf8_lossy(&handoff_output.stderr)
    );
    let stderr = String::from_utf8_lossy(&handoff_output.stderr);
    assert!(
        stderr.contains("MalformedExecutionState"),
        "workflow handoff should report malformed legacy execution evidence, stderr:\n{stderr}"
    );
    assert!(
        stderr.contains(cutover_message),
        "workflow handoff should explain legacy pre-harness cutover rejection, stderr:\n{stderr}"
    );
}

#[test]
fn canonical_workflow_routes_accepted_preflight_from_harness_state_even_when_workspace_becomes_dirty()
 {
    let (repo_dir, state_dir) = init_repo("workflow-phase-accepted-preflight-dirty");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-accepted-preflight-dirty";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");
    prepare_preflight_acceptance_workspace(repo, "workflow-phase-accepted-preflight-dirty");

    let preflight_json = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "explicit plan execution preflight acceptance before dirty workspace routing fixture",
    );
    assert_eq!(preflight_json["allowed"], true);

    let status_after_preflight = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status after explicit plan execution preflight acceptance before dirty workspace routing fixture",
    );
    assert!(
        status_after_preflight["execution_run_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "explicit plan execution preflight should persist execution_run_id before workspace becomes dirty"
    );

    write_file(
        &repo.join("README.md"),
        "# workflow-phase-accepted-preflight-dirty\ntracked change after execution preflight acceptance\n",
    );

    let status_after_workspace_dirty = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "status after workspace dirties following explicit plan execution preflight acceptance",
    );
    assert!(
        status_after_workspace_dirty["execution_run_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "accepted preflight should keep plan execution status.execution_run_id non-empty after workspace dirties"
    );
    assert_eq!(
        status_after_workspace_dirty["harness_phase"], "execution_preflight",
        "accepted preflight should keep plan execution status.harness_phase at execution_preflight after workspace dirties"
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for accepted-preflight dirty-workspace routing fixture",
        ),
        "workflow phase for accepted-preflight dirty-workspace routing fixture",
    );
    assert_eq!(phase_json["phase"], "execution_preflight");
    assert_eq!(phase_json["next_action"], "execution_preflight");

    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for accepted-preflight dirty-workspace routing fixture",
        ),
        "workflow handoff for accepted-preflight dirty-workspace routing fixture",
    );
    assert_eq!(handoff_json["phase"], "execution_preflight");
    assert_eq!(handoff_json["next_action"], "execution_preflight");

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for accepted-preflight dirty-workspace routing fixture",
        ),
        "workflow doctor for accepted-preflight dirty-workspace routing fixture",
    );
    assert!(
        doctor_json["execution_status"]["execution_run_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "accepted preflight should keep doctor.execution_status.execution_run_id non-empty after workspace dirties"
    );
}

#[test]
fn canonical_workflow_doctor_uses_accepted_preflight_truth_after_workspace_dirties() {
    let (repo_dir, state_dir) = init_repo("workflow-doctor-accepted-preflight-dirty");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-doctor-accepted-preflight-dirty";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    install_full_contract_ready_artifacts(repo);
    enable_session_decision(state, session_key);
    prepare_preflight_acceptance_workspace(repo, "workflow-doctor-accepted-preflight-dirty");

    let preflight_json = run_plan_execution_json(
        repo,
        state,
        &["preflight", "--plan", plan_rel],
        "explicit plan execution preflight acceptance before doctor dirty-workspace fixture",
    );
    assert_eq!(preflight_json["allowed"], true);

    write_file(
        &repo.join("README.md"),
        "# workflow-doctor-accepted-preflight-dirty\ntracked change after execution preflight acceptance\n",
    );
    let dirty_status = run_checked(
        {
            let mut command = Command::new("git");
            command.args(["status", "--porcelain"]).current_dir(repo);
            command
        },
        "git status --porcelain after workspace dirties",
    );
    assert!(
        !String::from_utf8_lossy(&dirty_status.stdout)
            .trim()
            .is_empty(),
        "workspace should be dirty after introducing tracked change post-preflight acceptance"
    );

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for accepted-preflight truth after dirty-workspace fixture",
        ),
        "workflow doctor for accepted-preflight truth after dirty-workspace fixture",
    );
    assert_eq!(doctor_json["phase"], "execution_preflight");
    assert!(
        doctor_json["execution_status"]["execution_run_id"]
            .as_str()
            .is_some_and(|value| !value.is_empty()),
        "doctor.execution_status.execution_run_id should stay non-empty after accepted preflight even when workspace becomes dirty"
    );

    assert_ne!(
        doctor_json["preflight"]["failure_class"], "WorkspaceNotSafe",
        "workflow doctor should not surface a fresh WorkspaceNotSafe preflight failure after preflight was already accepted"
    );
    assert_ne!(
        doctor_json["preflight"]["allowed"], false,
        "workflow doctor should not report preflight.allowed=false once accepted preflight state exists"
    );
}

#[test]
fn canonical_workflow_gate_review_rejects_stale_authoritative_late_gate_truth() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-gate-review-stale-authoritative-truth");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-gate-review-stale-authoritative-truth";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let branch = current_branch_name(repo);
    let expected_base_branch = expected_release_base_branch(repo);
    let test_plan_path = write_branch_test_plan_artifact(repo, state, plan_rel, "yes");
    let review_path = write_branch_review_artifact(repo, state, plan_rel, &expected_base_branch);
    let qa_path = write_branch_qa_artifact(repo, state, plan_rel, &test_plan_path);
    let release_path = write_branch_release_artifact(repo, state, plan_rel, &expected_base_branch);
    enable_session_decision(state, session_key);

    let authoritative_review_source = fs::read_to_string(&review_path)
        .expect("source review artifact should be readable for stale-authoritative fixture");
    let authoritative_review_fingerprint = sha256_hex(authoritative_review_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("final-review-{authoritative_review_fingerprint}.md"),
        ),
        &authoritative_review_source,
    );

    let authoritative_test_plan_source = fs::read_to_string(&test_plan_path)
        .expect("source test-plan artifact should be readable for stale-authoritative fixture");
    let authoritative_test_plan_fingerprint = sha256_hex(authoritative_test_plan_source.as_bytes());
    let authoritative_test_plan_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch,
        &format!("test-plan-{authoritative_test_plan_fingerprint}.md"),
    );
    write_file(
        &authoritative_test_plan_path,
        &authoritative_test_plan_source,
    );

    let authoritative_qa_source = rewrite_source_test_plan_header(
        &fs::read_to_string(&qa_path)
            .expect("source QA artifact should be readable for stale-authoritative fixture"),
        &authoritative_test_plan_path,
    );
    let authoritative_qa_fingerprint = sha256_hex(authoritative_qa_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("browser-qa-{authoritative_qa_fingerprint}.md"),
        ),
        &authoritative_qa_source,
    );

    let authoritative_release_source = fs::read_to_string(&release_path)
        .expect("source release artifact should be readable for stale-authoritative fixture");
    let authoritative_release_fingerprint = sha256_hex(authoritative_release_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("release-docs-{authoritative_release_fingerprint}.md"),
        ),
        &authoritative_release_source,
    );

    let authoritative_state_path = harness_state_path(state, &repo_slug(repo), &branch);
    write_file(
        &authoritative_state_path,
        &format!(
            "{{\"schema_version\":1,\"harness_phase\":\"executing\",\"latest_authoritative_sequence\":17,\"dependency_index_state\":\"stale\",\"final_review_state\":\"stale\",\"browser_qa_state\":\"stale\",\"release_docs_state\":\"stale\",\"last_final_review_artifact_fingerprint\":\"{authoritative_review_fingerprint}\",\"last_browser_qa_artifact_fingerprint\":\"{authoritative_qa_fingerprint}\",\"last_release_docs_artifact_fingerprint\":\"{authoritative_release_fingerprint}\"}}"
        ),
    );

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for stale authoritative late-gate truth",
        ),
        "workflow doctor for stale authoritative late-gate truth",
    );
    let gate_review_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "review", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate review for stale authoritative late-gate truth",
        ),
        "workflow gate review for stale authoritative late-gate truth",
    );

    assert_eq!(
        gate_review_json["allowed"], false,
        "workflow gate review should load authoritative late-gate truth before trusting v2 evidence; got {gate_review_json:?}"
    );
    assert_eq!(
        doctor_json["gate_review"]["allowed"], false,
        "workflow doctor should report review gate blocked when authoritative late-gate truth is stale; got {doctor_json:?}"
    );
}

#[test]
fn canonical_workflow_doctor_and_gate_finish_prefer_recorded_authoritative_final_review_over_newer_branch_decoy()
 {
    let (repo_dir, state_dir) = init_repo("workflow-phase-authoritative-final-review-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-authoritative-final-review-provenance";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let branch = current_branch_name(repo);
    let expected_base_branch = expected_release_base_branch(repo);
    let (active_contract_path, active_contract_fingerprint) =
        write_authoritative_active_contract_and_serial_unit_review_receipt(
            repo, state, plan_rel, 1,
        );
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    let review_path = write_branch_review_artifact(repo, state, plan_rel, &expected_base_branch);
    write_branch_release_artifact(repo, state, plan_rel, &expected_base_branch);
    enable_session_decision(state, session_key);

    let authoritative_review_source = fs::read_to_string(&review_path)
        .expect("source review artifact should be readable for authoritative provenance fixture");
    let authoritative_review_fingerprint = sha256_hex(authoritative_review_source.as_bytes());
    let authoritative_review_file = format!("final-review-{authoritative_review_fingerprint}.md");
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &authoritative_review_file,
        ),
        &authoritative_review_source,
    );

    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[
            ("schema_version", Value::from(1)),
            ("harness_phase", Value::from("executing")),
            ("latest_authoritative_sequence", Value::from(17)),
            ("active_contract_path", Value::from(active_contract_path)),
            (
                "active_contract_fingerprint",
                Value::from(active_contract_fingerprint),
            ),
            ("dependency_index_state", Value::from("fresh")),
            ("final_review_state", Value::from("fresh")),
            ("browser_qa_state", Value::from("not_required")),
            ("release_docs_state", Value::from("not_required")),
            (
                "last_final_review_artifact_fingerprint",
                Value::from(authoritative_review_fingerprint),
            ),
        ],
    );

    write_file(
        &project_artifact_dir(repo, state).join(format!(
            "tester-{}-code-review-99999999-999999.md",
            branch_storage_key(&branch)
        )),
        &format!(
            "# Code Review Result\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {branch}\n**Head SHA:** 0000000000000000000000000000000000000000\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-24T23:59:59Z\n\n## Summary\n- newer same-branch decoy should not override recorded authoritative final-review provenance.\n",
            repo_slug(repo)
        ),
    );

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for authoritative final-review provenance override fixture",
        ),
        "workflow doctor for authoritative final-review provenance override fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for authoritative final-review provenance override fixture",
        ),
        "workflow gate finish for authoritative final-review provenance override fixture",
    );

    assert_eq!(
        gate_finish_json["allowed"], true,
        "workflow gate finish should resolve final-review freshness from recorded authoritative provenance instead of scanning the newest branch artifact; got {gate_finish_json:?}"
    );
    assert_eq!(
        doctor_json["gate_finish"]["allowed"], true,
        "workflow doctor should report final-review freshness from recorded authoritative provenance instead of scanning the newest branch artifact; got {doctor_json:?}"
    );
}

#[test]
fn canonical_workflow_doctor_and_gate_finish_prefer_recorded_authoritative_release_docs_over_newer_branch_decoy()
 {
    let (repo_dir, state_dir) = init_repo("workflow-phase-authoritative-release-docs-provenance");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-authoritative-release-docs-provenance";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let branch = current_branch_name(repo);
    let expected_base_branch = expected_release_base_branch(repo);
    let (active_contract_path, active_contract_fingerprint) =
        write_authoritative_active_contract_and_serial_unit_review_receipt(
            repo, state, plan_rel, 1,
        );
    let test_plan_path = write_branch_test_plan_artifact(repo, state, plan_rel, "yes");
    let review_path = write_branch_review_artifact(repo, state, plan_rel, &expected_base_branch);
    let qa_path = write_branch_qa_artifact(repo, state, plan_rel, &test_plan_path);
    let release_path = write_branch_release_artifact(repo, state, plan_rel, &expected_base_branch);
    enable_session_decision(state, session_key);

    let authoritative_review_source = fs::read_to_string(&review_path).expect(
        "source review artifact should be readable for authoritative downstream provenance fixture",
    );
    let authoritative_review_fingerprint = sha256_hex(authoritative_review_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("final-review-{authoritative_review_fingerprint}.md"),
        ),
        &authoritative_review_source,
    );

    let authoritative_test_plan_source = fs::read_to_string(&test_plan_path).expect(
        "source test-plan artifact should be readable for authoritative downstream provenance fixture",
    );
    let authoritative_test_plan_fingerprint = sha256_hex(authoritative_test_plan_source.as_bytes());
    let authoritative_test_plan_path = harness_authoritative_artifact_path(
        state,
        &repo_slug(repo),
        &branch,
        &format!("test-plan-{authoritative_test_plan_fingerprint}.md"),
    );
    write_file(
        &authoritative_test_plan_path,
        &authoritative_test_plan_source,
    );

    let authoritative_qa_source = rewrite_source_test_plan_header(
        &fs::read_to_string(&qa_path).expect(
            "source QA artifact should be readable for authoritative downstream provenance fixture",
        ),
        &authoritative_test_plan_path,
    );
    let authoritative_qa_fingerprint = sha256_hex(authoritative_qa_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("browser-qa-{authoritative_qa_fingerprint}.md"),
        ),
        &authoritative_qa_source,
    );

    let authoritative_release_source = fs::read_to_string(&release_path).expect(
        "source release artifact should be readable for authoritative downstream provenance fixture",
    );
    let authoritative_release_fingerprint = sha256_hex(authoritative_release_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("release-docs-{authoritative_release_fingerprint}.md"),
        ),
        &authoritative_release_source,
    );

    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[
            ("schema_version", Value::from(1)),
            ("harness_phase", Value::from("executing")),
            ("latest_authoritative_sequence", Value::from(17)),
            ("active_contract_path", Value::from(active_contract_path)),
            (
                "active_contract_fingerprint",
                Value::from(active_contract_fingerprint),
            ),
            ("dependency_index_state", Value::from("fresh")),
            ("final_review_state", Value::from("fresh")),
            ("browser_qa_state", Value::from("fresh")),
            ("release_docs_state", Value::from("fresh")),
            (
                "last_final_review_artifact_fingerprint",
                Value::from(authoritative_review_fingerprint),
            ),
            (
                "last_browser_qa_artifact_fingerprint",
                Value::from(authoritative_qa_fingerprint),
            ),
            (
                "last_release_docs_artifact_fingerprint",
                Value::from(authoritative_release_fingerprint),
            ),
        ],
    );

    write_file(
        &project_artifact_dir(repo, state).join(format!(
            "tester-{}-release-readiness-99999999-999999.md",
            branch_storage_key(&branch)
        )),
        &format!(
            "# Release Readiness Result\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {expected_base_branch}\n**Head SHA:** 0000000000000000000000000000000000000000\n**Result:** pass\n**Generated By:** featureforge:document-release\n**Generated At:** 2026-03-24T23:59:59Z\n\n## Summary\n- newer same-branch decoy should not override recorded authoritative downstream release-doc provenance.\n",
            repo_slug(repo)
        ),
    );

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for authoritative release-doc provenance override fixture",
        ),
        "workflow doctor for authoritative release-doc provenance override fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for authoritative release-doc provenance override fixture",
        ),
        "workflow gate finish for authoritative release-doc provenance override fixture",
    );

    assert_eq!(
        gate_finish_json["allowed"], true,
        "workflow gate finish should resolve release-doc freshness from recorded authoritative downstream provenance instead of scanning the newest branch artifact; got {gate_finish_json:?}"
    );
    assert_eq!(
        doctor_json["gate_finish"]["allowed"], true,
        "workflow doctor should report release-doc freshness from recorded authoritative downstream provenance instead of scanning the newest branch artifact; got {doctor_json:?}"
    );
}

#[test]
fn canonical_workflow_operator_pins_authoritative_contract_drafting_phase_in_public_surfaces() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-authoritative-contract-drafting");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-authoritative-contract-drafting";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    complete_workflow_fixture_execution(repo, state, plan_rel);
    enable_session_decision(state, session_key);

    let expected_phase = public_harness_phase_from_spec("contract_drafting");
    let authoritative_state_path =
        harness_state_path(state, &repo_slug(repo), &current_branch_name(repo));
    write_file(
        &authoritative_state_path,
        &format!(
            "{{\"harness_phase\":\"{}\",\"latest_authoritative_sequence\":17}}",
            expected_phase
        ),
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase should pin authoritative contract_drafting phase",
        ),
        "workflow phase should pin authoritative contract_drafting phase",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff should pin authoritative contract_drafting phase",
        ),
        "workflow handoff should pin authoritative contract_drafting phase",
    );

    assert_eq!(phase_json["route_status"], "implementation_ready");
    assert_eq!(phase_json["phase"], expected_phase);
    assert_eq!(handoff_json["route_status"], "implementation_ready");
    assert_eq!(handoff_json["phase"], expected_phase);
}

#[test]
fn canonical_workflow_operator_surfaces_pivot_required_plan_revision_block_phase_and_next_action() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-authoritative-pivot-required");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-authoritative-pivot-required";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    complete_workflow_fixture_execution(repo, state, plan_rel);
    enable_session_decision(state, session_key);

    let authoritative_state_path =
        harness_state_path(state, &repo_slug(repo), &current_branch_name(repo));
    write_file(
        &authoritative_state_path,
        r#"{"harness_phase":"pivot_required","latest_authoritative_sequence":23,"reason_codes":["blocked_on_plan_revision"]}"#,
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase should surface authoritative pivot_required plan-revision blocks",
        ),
        "workflow phase should surface authoritative pivot_required plan-revision blocks",
    );
    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor should surface authoritative pivot_required plan-revision blocks",
        ),
        "workflow doctor should surface authoritative pivot_required plan-revision blocks",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff should surface authoritative pivot_required plan-revision blocks",
        ),
        "workflow handoff should surface authoritative pivot_required plan-revision blocks",
    );

    let expected_phase = public_harness_phase_from_spec("pivot_required");

    assert_eq!(
        doctor_json["execution_status"]["harness_phase"],
        Value::String(expected_phase.clone())
    );
    assert_eq!(phase_json["phase"], expected_phase);
    assert_eq!(doctor_json["phase"], expected_phase);
    assert_eq!(handoff_json["phase"], expected_phase);
    assert_eq!(phase_json["next_action"], "plan_update");
    assert_eq!(doctor_json["next_action"], "plan_update");
    assert_eq!(handoff_json["next_action"], "plan_update");
    assert_ne!(
        handoff_json["recommended_skill"], doctor_json["execution_status"]["execution_mode"],
        "pivot-required plan-revision blocks should not keep recommending the active execution mode"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "Execution is blocked pending an approved plan revision."
    );
}

#[test]
fn canonical_workflow_routes_gate_review_evidence_failures_back_to_execution() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-gate-review-evidence-failure");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-gate-review-evidence-failure";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    complete_workflow_fixture_execution(repo, state, plan_rel);
    enable_session_decision(state, session_key);
    let branch = current_branch_name(repo);
    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[
            ("dependency_index_state", Value::from("fresh")),
            ("final_review_state", Value::from("fresh")),
            ("browser_qa_state", Value::from("fresh")),
            ("release_docs_state", Value::from("fresh")),
        ],
    );

    let execution_status = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status for workflow gate-review evidence failure fixture",
    );
    let evidence_path = repo.join(
        execution_status["evidence_path"]
            .as_str()
            .expect("execution status should expose evidence_path"),
    );
    replace_in_file(
        &evidence_path,
        "**Plan Fingerprint:** ",
        "**Plan Fingerprint:** stale-",
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for gate-review evidence failure fixture",
        ),
        "workflow phase for gate-review evidence failure fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for gate-review evidence failure fixture",
        ),
        "workflow handoff for gate-review evidence failure fixture",
    );
    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for gate-review evidence failure fixture",
        ),
        "workflow doctor for gate-review evidence failure fixture",
    );

    assert_eq!(doctor_json["gate_review"]["allowed"], false);
    assert_eq!(
        doctor_json["gate_review"]["failure_class"],
        "StaleExecutionEvidence"
    );
    assert_eq!(phase_json["phase"], "final_review_pending");
    assert_eq!(phase_json["next_action"], "return_to_execution");
    assert_eq!(handoff_json["phase"], "final_review_pending");
    assert_eq!(handoff_json["next_action"], "return_to_execution");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:executing-plans"
    );
    assert_eq!(handoff_json["recommendation"], Value::Null);
}

#[test]
fn canonical_workflow_phase_routes_missing_test_plan_back_to_plan_eng_review() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-test-plan-missing");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-test-plan-missing";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_dispatched_branch_review_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for missing-test-plan routing fixture",
        ),
        "workflow phase for missing-test-plan routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for missing-test-plan routing fixture",
        ),
        "workflow handoff for missing-test-plan routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for missing-test-plan routing fixture",
        ),
        "workflow gate finish for missing-test-plan routing fixture",
    );
    assert_eq!(phase_json["phase"], "qa_pending");
    assert_eq!(phase_json["next_action"], "refresh_test_plan");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:plan-eng-review"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "Finish readiness requires a current branch test-plan artifact."
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "QaArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "test_plan_artifact_missing"
    );
}

#[test]
fn canonical_workflow_phase_routes_malformed_test_plan_back_to_plan_eng_review() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-test-plan-malformed");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-test-plan-malformed";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let test_plan_path = write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_dispatched_branch_review_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);
    replace_in_file(&test_plan_path, "# Test Plan", "# Not A Test Plan");

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for malformed-test-plan routing fixture",
        ),
        "workflow phase for malformed-test-plan routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for malformed-test-plan routing fixture",
        ),
        "workflow handoff for malformed-test-plan routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for malformed-test-plan routing fixture",
        ),
        "workflow gate finish for malformed-test-plan routing fixture",
    );

    assert_eq!(phase_json["phase"], "qa_pending");
    assert_eq!(phase_json["next_action"], "refresh_test_plan");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:plan-eng-review"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "The latest test-plan artifact is malformed."
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "QaArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "test_plan_artifact_malformed"
    );
}

#[test]
fn canonical_workflow_phase_routes_stale_test_plan_back_to_plan_eng_review() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-test-plan-stale");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-test-plan-stale";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let test_plan_path = write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_dispatched_branch_review_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);
    replace_in_file(
        &test_plan_path,
        &format!("**Head SHA:** {}", current_head_sha(repo)),
        "**Head SHA:** 0000000000000000000000000000000000000000",
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for stale-test-plan routing fixture",
        ),
        "workflow phase for stale-test-plan routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for stale-test-plan routing fixture",
        ),
        "workflow handoff for stale-test-plan routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for stale-test-plan routing fixture",
        ),
        "workflow gate finish for stale-test-plan routing fixture",
    );

    assert_eq!(phase_json["phase"], "qa_pending");
    assert_eq!(phase_json["next_action"], "refresh_test_plan");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:plan-eng-review"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "The latest test-plan artifact does not match the current HEAD."
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "QaArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "test_plan_artifact_stale"
    );
}

#[test]
fn canonical_workflow_phase_routes_authoritative_qa_provenance_invalid_to_qa_pending() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-qa-authoritative-provenance-invalid");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-qa-authoritative-provenance-invalid";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let (active_contract_path, active_contract_fingerprint) =
        write_authoritative_active_contract_and_serial_unit_review_receipt(
            repo, state, plan_rel, 1,
        );
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
    write_branch_release_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);

    let branch = current_branch_name(repo);
    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[
            ("schema_version", Value::from(1)),
            ("active_contract_path", Value::from(active_contract_path)),
            (
                "active_contract_fingerprint",
                Value::from(active_contract_fingerprint),
            ),
            ("dependency_index_state", Value::from("fresh")),
            ("final_review_state", Value::from("not_required")),
            ("release_docs_state", Value::from("not_required")),
            ("browser_qa_state", Value::from("fresh")),
            (
                "last_browser_qa_artifact_fingerprint",
                Value::from("not-a-fingerprint"),
            ),
        ],
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for authoritative-qa-provenance-invalid routing fixture",
        ),
        "workflow phase for authoritative-qa-provenance-invalid routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for authoritative-qa-provenance-invalid routing fixture",
        ),
        "workflow handoff for authoritative-qa-provenance-invalid routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for authoritative-qa-provenance-invalid routing fixture",
        ),
        "workflow gate finish for authoritative-qa-provenance-invalid routing fixture",
    );

    assert_eq!(gate_finish_json["allowed"], false);
    assert!(
        gate_finish_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| {
                codes
                    .iter()
                    .any(|code| code == "qa_artifact_authoritative_provenance_invalid")
            }),
        "gate-finish should surface authoritative QA provenance failure for routing, got {gate_finish_json:?}"
    );
    assert_eq!(phase_json["phase"], "qa_pending", "{gate_finish_json:?}");
    assert_eq!(phase_json["next_action"], "run_qa_only", "{phase_json:?}");
    assert_eq!(handoff_json["recommended_skill"], "featureforge:qa-only");
}

#[test]
fn canonical_workflow_phase_routes_authoritative_test_plan_provenance_invalid_to_plan_eng_review() {
    let (repo_dir, state_dir) =
        init_repo("workflow-phase-test-plan-authoritative-provenance-invalid");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-test-plan-authoritative-provenance-invalid";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let (active_contract_path, active_contract_fingerprint) =
        write_authoritative_active_contract_and_serial_unit_review_receipt(
            repo, state, plan_rel, 1,
        );
    let test_plan_path = write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
    write_branch_release_artifact(repo, state, plan_rel, &base_branch);
    let qa_path = write_branch_qa_artifact(repo, state, plan_rel, &test_plan_path);
    enable_session_decision(state, session_key);

    let branch = current_branch_name(repo);
    let authoritative_qa_source = fs::read_to_string(&qa_path)
        .expect("source QA artifact should be readable for authoritative provenance fixture");
    let authoritative_qa_fingerprint = sha256_hex(authoritative_qa_source.as_bytes());
    write_file(
        &harness_authoritative_artifact_path(
            state,
            &repo_slug(repo),
            &branch,
            &format!("browser-qa-{authoritative_qa_fingerprint}.md"),
        ),
        &authoritative_qa_source,
    );
    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[
            ("schema_version", Value::from(1)),
            ("active_contract_path", Value::from(active_contract_path)),
            (
                "active_contract_fingerprint",
                Value::from(active_contract_fingerprint),
            ),
            ("dependency_index_state", Value::from("fresh")),
            ("final_review_state", Value::from("not_required")),
            ("release_docs_state", Value::from("not_required")),
            ("browser_qa_state", Value::from("fresh")),
            (
                "last_browser_qa_artifact_fingerprint",
                Value::from(authoritative_qa_fingerprint),
            ),
        ],
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for authoritative-test-plan-provenance-invalid routing fixture",
        ),
        "workflow phase for authoritative-test-plan-provenance-invalid routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for authoritative-test-plan-provenance-invalid routing fixture",
        ),
        "workflow handoff for authoritative-test-plan-provenance-invalid routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for authoritative-test-plan-provenance-invalid routing fixture",
        ),
        "workflow gate finish for authoritative-test-plan-provenance-invalid routing fixture",
    );

    assert_eq!(gate_finish_json["allowed"], false);
    assert!(
        gate_finish_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| {
                codes
                    .iter()
                    .any(|code| code == "test_plan_artifact_authoritative_provenance_invalid")
            }),
        "gate-finish should surface authoritative QA->test-plan provenance failure for routing, got {gate_finish_json:?}"
    );
    assert_eq!(phase_json["phase"], "qa_pending", "{gate_finish_json:?}");
    assert_eq!(
        phase_json["next_action"], "refresh_test_plan",
        "{phase_json:?}"
    );
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:plan-eng-review"
    );
}

#[test]
fn canonical_workflow_phase_routes_authoritative_release_provenance_invalid_to_document_release() {
    let (repo_dir, state_dir) =
        init_repo("workflow-phase-release-authoritative-provenance-invalid");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-release-authoritative-provenance-invalid";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let (active_contract_path, active_contract_fingerprint) =
        write_authoritative_active_contract_and_serial_unit_review_receipt(
            repo, state, plan_rel, 1,
        );
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
    write_branch_release_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);

    let branch = current_branch_name(repo);
    update_authoritative_harness_state(
        repo,
        state,
        &branch,
        plan_rel,
        1,
        &[
            ("schema_version", Value::from(1)),
            ("active_contract_path", Value::from(active_contract_path)),
            (
                "active_contract_fingerprint",
                Value::from(active_contract_fingerprint),
            ),
            ("dependency_index_state", Value::from("fresh")),
            ("final_review_state", Value::from("not_required")),
            ("browser_qa_state", Value::from("not_required")),
            ("release_docs_state", Value::from("fresh")),
            (
                "last_release_docs_artifact_fingerprint",
                Value::from("not-a-fingerprint"),
            ),
        ],
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for authoritative-release-provenance-invalid routing fixture",
        ),
        "workflow phase for authoritative-release-provenance-invalid routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for authoritative-release-provenance-invalid routing fixture",
        ),
        "workflow handoff for authoritative-release-provenance-invalid routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for authoritative-release-provenance-invalid routing fixture",
        ),
        "workflow gate finish for authoritative-release-provenance-invalid routing fixture",
    );

    assert_eq!(gate_finish_json["allowed"], false);
    assert!(
        gate_finish_json["reason_codes"]
            .as_array()
            .is_some_and(|codes| {
                codes
                    .iter()
                    .any(|code| code == "release_artifact_authoritative_provenance_invalid")
            }),
        "gate-finish should surface authoritative release provenance failure for routing, got {gate_finish_json:?}"
    );
    assert_eq!(
        phase_json["phase"], "document_release_pending",
        "{gate_finish_json:?}"
    );
    assert_eq!(
        phase_json["next_action"], "run_document_release",
        "{phase_json:?}"
    );
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:document-release"
    );
}

#[test]
fn canonical_workflow_phase_routes_review_resolved_browser_qa_to_qa_only() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-qa-pending");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-qa-pending";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "yes");
    write_dispatched_branch_review_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for qa-pending routing fixture",
        ),
        "workflow phase for qa-pending routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for qa-pending routing fixture",
        ),
        "workflow handoff for qa-pending routing fixture",
    );

    assert_eq!(phase_json["phase"], "qa_pending");
    assert_eq!(phase_json["next_action"], "run_qa_only");
    assert_eq!(handoff_json["recommended_skill"], "featureforge:qa-only");
    assert_eq!(
        handoff_json["recommendation_reason"],
        "Finish readiness requires a QA result artifact."
    );
}

#[test]
fn canonical_workflow_phase_routes_review_resolved_to_document_release_pending() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-release-pending");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-release-pending";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_dispatched_branch_review_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for release-pending routing fixture",
        ),
        "workflow phase for release-pending routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for release-pending routing fixture",
        ),
        "workflow handoff for release-pending routing fixture",
    );

    assert_eq!(phase_json["phase"], "document_release_pending");
    assert_eq!(phase_json["next_action"], "run_document_release");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:document-release"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "Finish readiness requires a release-readiness artifact."
    );
}

#[test]
fn canonical_workflow_phase_routes_fully_ready_branch_to_finish() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-ready-for-finish");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-ready-for-finish";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = expected_release_base_branch(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_dispatched_branch_review_artifact(repo, state, plan_rel, &base_branch);
    write_branch_release_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for ready-for-finish routing fixture",
        ),
        "workflow doctor for ready-for-finish routing fixture",
    );
    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for ready-for-finish routing fixture",
        ),
        "workflow phase for ready-for-finish routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for ready-for-finish routing fixture",
        ),
        "workflow handoff for ready-for-finish routing fixture",
    );

    assert_eq!(doctor_json["gate_finish"]["allowed"], true);
    assert_eq!(phase_json["phase"], "ready_for_branch_completion");
    assert_eq!(phase_json["next_action"], "finish_branch");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:finishing-a-development-branch"
    );
    assert_eq!(
        handoff_json["recommendation_reason"],
        "All required late-stage artifacts are fresh for the current HEAD."
    );
}
