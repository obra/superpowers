#[path = "support/bin.rs"]
mod bin_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;
#[path = "support/workflow.rs"]
mod workflow_support;

use assert_cmd::cargo::cargo_bin;
use bin_support::compiled_featureforge_path;
use featureforge::git::discover_repo_identity;
use featureforge::paths::branch_storage_key;
use featureforge::workflow::manifest::{
    WorkflowManifest, manifest_path, recover_slug_changed_manifest,
};
use featureforge::workflow::status::WorkflowRuntime;
use files_support::write_file;
use json_support::parse_json;
use process_support::{run, run_checked};
use serde_json::Value;
use std::fs;
#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;
use workflow_support::{
    init_repo as init_workflow_repo, install_full_contract_ready_artifacts, workflow_fixture_root,
};

fn write_manifest(path: &Path, manifest: &WorkflowManifest) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("manifest parent should be creatable");
    }
    let json = serde_json::to_string(manifest).expect("manifest json should serialize");
    fs::write(path, json).expect("manifest should be writable");
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

fn set_remote_url(repo: &Path, url: &str) {
    let mut git_remote_set = Command::new("git");
    git_remote_set
        .args(["remote", "set-url", "origin", url])
        .current_dir(repo);
    run_checked(git_remote_set, "git remote set-url origin");
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
    let artifact_path = project_artifact_dir(repo, state_dir).join(format!(
        "tester-{safe_branch}-code-review-20260324-121000.md"
    ));
    write_file(
        &artifact_path,
        &format!(
            "# Code Review Result\n**Source Plan:** `{plan_rel}`\n**Source Plan Revision:** 1\n**Branch:** {branch}\n**Repo:** {}\n**Base Branch:** {base_branch}\n**Head SHA:** {}\n**Result:** pass\n**Generated By:** featureforge:requesting-code-review\n**Generated At:** 2026-03-24T12:10:00Z\n\n## Summary\n- synthetic code-review fixture for workflow phase coverage.\n",
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

fn complete_workflow_fixture_execution(repo: &Path, state: &Path, plan_rel: &str) {
    install_full_contract_ready_artifacts(repo);
    write_file(
        &repo.join("tests/workflow_runtime.rs"),
        "synthetic route proof\n",
    );

    let status_json = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status before workflow routing fixture",
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
fn canonical_workflow_status_routes_draft_plan_for_single_matching_plan() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-draft-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let fixture_root = workflow_fixture_root();

    fs::create_dir_all(repo.join("docs/featureforge/specs")).expect("spec directory should exist");
    fs::copy(
        fixture_root.join("specs/2026-01-22-document-review-system-design.md"),
        repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design.md"),
    )
    .expect("fixture spec should copy");
    write_file(
        &repo.join("docs/featureforge/plans/2026-01-22-document-review-system.md"),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );

    let status_json = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for draft plan",
        ),
        "rust canonical workflow status refresh for draft plan",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "featureforge:plan-eng-review");
    assert_eq!(
        status_json["plan_path"],
        "docs/featureforge/plans/2026-01-22-document-review-system.md"
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
    assert_eq!(status_json["next_skill"], "featureforge:plan-eng-review");
}

#[test]
fn canonical_workflow_phase_reads_canonical_session_entry_state() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-canonical-session-entry");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "phase-canonical-session-entry";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    write_file(&decision_path, "enabled\n");

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "rust canonical workflow phase should read canonical session-entry state",
        ),
        "rust canonical workflow phase should read canonical session-entry state",
    );

    assert_eq!(phase_json["session_entry"]["outcome"], "enabled");
    assert_eq!(
        phase_json["session_entry"]["decision_path"],
        decision_path.to_string_lossy().as_ref()
    );
}

#[test]
fn canonical_workflow_operator_hides_next_skill_until_session_entry_is_resolved() {
    let (repo_dir, state_dir) = init_repo("workflow-needs-user-choice");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-needs-user-choice";

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase should hide next_skill while session-entry is unresolved",
        ),
        "workflow phase should hide next_skill while session-entry is unresolved",
    );
    assert_eq!(phase_json["phase"], "needs_user_choice");
    assert_eq!(phase_json["next_action"], "session_entry_gate");
    assert_eq!(phase_json["next_skill"], "");

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor should hide next_skill while session-entry is unresolved",
        ),
        "workflow doctor should hide next_skill while session-entry is unresolved",
    );
    assert_eq!(doctor_json["phase"], "needs_user_choice");
    assert_eq!(doctor_json["next_action"], "session_entry_gate");
    assert_eq!(doctor_json["next_skill"], "");

    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff should hide next_skill while session-entry is unresolved",
        ),
        "workflow handoff should hide next_skill while session-entry is unresolved",
    );
    assert_eq!(handoff_json["phase"], "needs_user_choice");
    assert_eq!(handoff_json["next_action"], "session_entry_gate");
    assert_eq!(handoff_json["next_skill"], "");
}

#[test]
fn canonical_workflow_phase_routes_enabled_ready_plan_to_execution_preflight() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-ready-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-ready-plan";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-phase-ready"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-phase-ready");

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

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

    assert_eq!(phase_json["session_entry"]["outcome"], "enabled");
    assert_eq!(phase_json["route_status"], "implementation_ready");
    assert_eq!(phase_json["phase"], "execution_preflight");
    assert_eq!(phase_json["next_action"], "execution_preflight");
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

    assert_eq!(phase_json["session_entry"]["outcome"], "bypassed");
    assert_eq!(phase_json["phase"], "bypassed");
    assert_eq!(phase_json["next_action"], "continue_outside_featureforge");
    assert_eq!(phase_json["next_skill"], "");

    assert_eq!(handoff_json["session_entry"]["outcome"], "bypassed");
    assert_eq!(handoff_json["phase"], "bypassed");
    assert_eq!(handoff_json["next_action"], "continue_outside_featureforge");
    assert_eq!(handoff_json["recommended_skill"], "");
    assert_eq!(handoff_json["recommendation"], Value::Null);
    assert_eq!(
        handoff_json["recommendation_reason"],
        "FeatureForge is bypassed for this session until the user explicitly re-enters."
    );

    assert!(next_output.status.success());
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(
        next_stdout.contains(
            "Continue outside the FeatureForge workflow unless the user explicitly re-enters."
        ),
        "workflow next should fail closed when session-entry is bypassed:\n{}",
        next_stdout
    );
}

#[test]
fn canonical_workflow_phase_routes_enabled_stale_plan_to_plan_writing() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-stale-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-stale-plan";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    write_file(
        &repo.join("docs/featureforge/specs/2026-01-22-document-review-system-design-v2.md"),
        "# Approved Spec, Newer Path\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n\n## Notes\n",
    );
    write_file(
        &repo.join("docs/featureforge/plans/2026-01-22-document-review-system.md"),
        "# Approved Plan, Stale Source Path\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/featureforge/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Preserve the stale source path case\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The plan remains structurally valid while its source-spec path goes stale.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Detect the stale source path**\n",
    );
    write_file(&decision_path, "enabled\n");

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

    assert_eq!(phase_json["session_entry"]["outcome"], "enabled");
    assert_eq!(phase_json["route_status"], "stale_plan");
    assert_eq!(phase_json["phase"], "plan_writing");
    assert_eq!(phase_json["next_action"], "use_next_skill");
    assert_eq!(phase_json["next_skill"], "featureforge:writing-plans");
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
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-public-text"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-public-text");

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

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
}

#[test]
fn canonical_workflow_public_json_commands_work_for_ready_plan() {
    let (repo_dir, state_dir) = init_repo("workflow-public-json-commands");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-public-json-commands";
    let decision_path = state
        .join("session-entry")
        .join("using-featureforge")
        .join(session_key);
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "workflow-public-json"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout workflow-public-json");

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

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
    assert_eq!(doctor_json["phase"], "execution_preflight");
    assert_eq!(doctor_json["route_status"], "implementation_ready");
    assert_eq!(doctor_json["next_action"], "execution_preflight");
    assert_eq!(
        doctor_json["spec_path"],
        "docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md"
    );
    assert_eq!(doctor_json["plan_path"], plan_rel);
    assert_eq!(doctor_json["contract_state"], "valid");
    assert_eq!(doctor_json["session_entry"]["outcome"], "enabled");
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
    assert_eq!(handoff_json["phase"], "execution_preflight");
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
    assert!(
        handoff_json["recommendation_reason"]
            .as_str()
            .is_some_and(|value| !value.is_empty())
    );

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

    let status_json = run_plan_execution_json(
        repo,
        state,
        &["status", "--plan", plan_rel],
        "plan execution status before started-execution routing fixture",
    );
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
    assert_eq!(doctor_json["phase"], "implementation_handoff");
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
    assert_eq!(doctor_json["phase"], "implementation_handoff");
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
fn canonical_workflow_phase_requires_final_review_before_branch_completion() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-final-review-pending");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-final-review-pending";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_release_artifact(repo, state, plan_rel, &current_branch_name(repo));
    enable_session_decision(state, session_key);

    let doctor_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow doctor for final-review routing fixture",
        ),
        "workflow doctor for final-review routing fixture",
    );
    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for final-review routing fixture",
        ),
        "workflow phase for final-review routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for final-review routing fixture",
        ),
        "workflow handoff for final-review routing fixture",
    );
    let gate_review_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "review", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate review for final-review routing fixture",
        ),
        "workflow gate review for final-review routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for final-review routing fixture",
        ),
        "workflow gate finish for final-review routing fixture",
    );

    assert_eq!(doctor_json["route_status"], "implementation_ready");
    assert_eq!(doctor_json["gate_review"]["allowed"], true);
    assert_eq!(doctor_json["gate_finish"]["allowed"], false);
    assert_eq!(
        doctor_json["gate_finish"]["failure_class"],
        "ReviewArtifactNotFresh"
    );
    assert_eq!(phase_json["phase"], "review_blocked");
    assert_eq!(phase_json["next_action"], "request_code_review");
    assert_eq!(handoff_json["phase"], "review_blocked");
    assert_eq!(handoff_json["route_status"], "implementation_ready");
    assert_eq!(handoff_json["execution_started"], "yes");
    assert_eq!(handoff_json["next_action"], "request_code_review");
    assert_eq!(
        handoff_json["recommended_skill"],
        "featureforge:requesting-code-review"
    );
    assert_eq!(handoff_json["recommendation"], Value::Null);
    assert_eq!(
        handoff_json["recommendation_reason"],
        "Finish readiness requires a final code-review artifact."
    );
    assert_eq!(gate_review_json["allowed"], true);
    assert_eq!(gate_finish_json["allowed"], false);
    assert_eq!(gate_finish_json["failure_class"], "ReviewArtifactNotFresh");
    assert_eq!(
        gate_finish_json["reason_codes"][0],
        "review_artifact_missing"
    );

    let phase_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "phase"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow phase text for final-review routing fixture",
    );
    assert!(phase_output.status.success());
    let phase_stdout = String::from_utf8_lossy(&phase_output.stdout);
    assert!(phase_stdout.contains("Workflow phase: review_blocked"));
    assert!(phase_stdout.contains("Route status: implementation_ready"));
    assert!(phase_stdout.contains("Next: Use featureforge:requesting-code-review for the approved plan before branch completion: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"));

    let doctor_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "doctor"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow doctor text for final-review routing fixture",
    );
    assert!(doctor_output.status.success());
    let doctor_stdout = String::from_utf8_lossy(&doctor_output.stdout);
    assert!(doctor_stdout.contains("Workflow doctor"));
    assert!(doctor_stdout.contains("Phase: review_blocked"));
    assert!(doctor_stdout.contains("Route status: implementation_ready"));

    let handoff_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "handoff"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow handoff text for final-review routing fixture",
    );
    assert!(handoff_output.status.success());
    let handoff_stdout = String::from_utf8_lossy(&handoff_output.stdout);
    assert!(handoff_stdout.contains("Workflow handoff"));
    assert!(handoff_stdout.contains("Phase: review_blocked"));
    assert!(handoff_stdout.contains("Next action: request_code_review"));
    assert!(handoff_stdout.contains("Recommended skill: featureforge:requesting-code-review"));
    assert!(
        handoff_stdout.contains("Reason: Finish readiness requires a final code-review artifact.")
    );

    let next_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow next for final-review routing fixture",
    );
    assert!(next_output.status.success());
    let next_stdout = String::from_utf8_lossy(&next_output.stdout);
    assert!(next_stdout.contains("Use featureforge:requesting-code-review for the approved plan before branch completion: docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"));
    assert!(next_stdout.contains("Finish readiness requires a final code-review artifact."));

    let gate_review_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "gate", "review", "--plan", plan_rel],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow gate review text for final-review routing fixture",
    );
    assert!(gate_review_output.status.success());
    assert!(
        String::from_utf8_lossy(&gate_review_output.stdout).contains("Review gate\nAllowed: true")
    );

    let gate_finish_output = run_rust_featureforge_with_env(
        repo,
        state,
        &["workflow", "gate", "finish", "--plan", plan_rel],
        &[("FEATUREFORGE_SESSION_KEY", session_key)],
        "workflow gate finish text for final-review routing fixture",
    );
    assert!(gate_finish_output.status.success());
    assert!(
        String::from_utf8_lossy(&gate_finish_output.stdout).contains("Finish gate\nAllowed: false")
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
    assert_eq!(phase_json["phase"], "review_blocked");
    assert_eq!(phase_json["next_action"], "return_to_execution");
    assert_eq!(handoff_json["phase"], "review_blocked");
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
    let base_branch = current_branch_name(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
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
    let base_branch = current_branch_name(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let test_plan_path = write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
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
    let base_branch = current_branch_name(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    let test_plan_path = write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
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
fn canonical_workflow_phase_routes_stale_review_back_to_requesting_code_review() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-review-head-mismatch");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-review-head-mismatch";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = current_branch_name(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    let review_path = write_branch_review_artifact(repo, state, plan_rel, &base_branch);
    write_branch_release_artifact(repo, state, plan_rel, &base_branch);
    enable_session_decision(state, session_key);
    replace_in_file(
        &review_path,
        &format!("**Head SHA:** {}", current_head_sha(repo)),
        "**Head SHA:** 0000000000000000000000000000000000000000",
    );

    let phase_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow phase for stale-review routing fixture",
        ),
        "workflow phase for stale-review routing fixture",
    );
    let handoff_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow handoff for stale-review routing fixture",
        ),
        "workflow handoff for stale-review routing fixture",
    );
    let gate_finish_json = parse_json(
        &run_rust_featureforge_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("FEATUREFORGE_SESSION_KEY", session_key)],
            "workflow gate finish for stale-review routing fixture",
        ),
        "workflow gate finish for stale-review routing fixture",
    );

    assert_eq!(phase_json["phase"], "review_blocked");
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
        "review_artifact_head_mismatch"
    );
}

#[test]
fn canonical_workflow_phase_routes_review_resolved_browser_qa_to_qa_only() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-qa-pending");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-phase-qa-pending";
    let plan_rel = "docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md";
    let base_branch = current_branch_name(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "yes");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
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
    let base_branch = current_branch_name(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
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
    let base_branch = current_branch_name(repo);

    complete_workflow_fixture_execution(repo, state, plan_rel);
    write_branch_test_plan_artifact(repo, state, plan_rel, "no");
    write_branch_review_artifact(repo, state, plan_rel, &base_branch);
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
