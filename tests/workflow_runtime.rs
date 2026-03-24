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
use bin_support::compiled_superpowers_path;
use files_support::write_file;
use json_support::parse_json;
use process_support::{repo_root, run, run_checked};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use superpowers::git::discover_repo_identity;
use superpowers::workflow::manifest::{
    WorkflowManifest, manifest_path, recover_slug_changed_manifest,
};
use superpowers::workflow::status::WorkflowRuntime;
use tempfile::TempDir;
use workflow_support::{
    init_repo as init_workflow_repo, install_full_contract_ready_artifacts, workflow_fixture_root,
};

fn workflow_status_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-workflow-status")
}

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
    let mut command = Command::new(workflow_status_helper_path());
    command
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .env("SUPERPOWERS_COMPAT_BIN", compiled_superpowers_path())
        .args(args);
    run(command, context)
}

fn run_shell_status_json(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Value {
    let output = run_shell_status_helper(repo, state_dir, args, context);
    parse_json(&output, context)
}

fn run_rust_superpowers(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command = Command::new(compiled_superpowers_path());
    command
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn run_rust_superpowers_with_env(
    repo: &Path,
    state_dir: &Path,
    args: &[&str],
    extra_env: &[(&str, &str)],
    context: &str,
) -> Output {
    let mut command = Command::new(compiled_superpowers_path());
    command
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", state_dir)
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
    let missing_spec = "docs/superpowers/specs/2026-03-24-rust-missing-spec-design.md";

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
    let rust_output = run_rust_superpowers(
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

    fs::create_dir_all(repo.join("docs/superpowers/specs"))
        .expect("specs directory should be creatable");
    fs::copy(
        fixture_root.join("specs/2026-01-22-document-review-system-design.md"),
        repo.join("docs/superpowers/specs/2026-01-22-document-review-system-design.md"),
    )
    .expect("first fixture spec should copy");
    fs::copy(
        fixture_root.join("specs/2026-02-19-visual-brainstorming-refactor-design.md"),
        repo.join("docs/superpowers/specs/2026-02-19-visual-brainstorming-refactor-design.md"),
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
    let rust_output = run_rust_superpowers(
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
    let missing_spec = "docs/superpowers/specs/2026-03-24-rust-sync-missing-spec.md";

    let expect_output = run_rust_superpowers(
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

    let sync_output = run_rust_superpowers(
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
    assert!(sync_stdout.contains("superpowers:brainstorming"));

    let status_json = parse_json(
        &run_rust_superpowers(
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
}

#[test]
fn canonical_workflow_status_routes_draft_plan_for_single_matching_plan() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-draft-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let fixture_root = workflow_fixture_root();

    fs::create_dir_all(repo.join("docs/superpowers/specs")).expect("spec directory should exist");
    fs::copy(
        fixture_root.join("specs/2026-01-22-document-review-system-design.md"),
        repo.join("docs/superpowers/specs/2026-01-22-document-review-system-design.md"),
    )
    .expect("fixture spec should copy");
    write_file(
        &repo.join("docs/superpowers/plans/2026-01-22-document-review-system.md"),
        "# Draft Plan\n\n**Workflow State:** Draft\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/superpowers/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** writing-plans\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Prepare the draft plan for review\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The draft plan is ready for engineering review.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Review the draft plan**\n",
    );

    let status_json = parse_json(
        &run_rust_superpowers(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for draft plan",
        ),
        "rust canonical workflow status refresh for draft plan",
    );

    assert_eq!(status_json["status"], "plan_draft");
    assert_eq!(status_json["next_skill"], "superpowers:plan-eng-review");
    assert_eq!(
        status_json["plan_path"],
        "docs/superpowers/plans/2026-01-22-document-review-system.md"
    );
}

#[test]
fn canonical_workflow_status_routes_lone_stale_approved_plan_as_stale() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-stale-approved-plan");
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_file(
        &repo.join("docs/superpowers/specs/2026-01-22-document-review-system-design-v2.md"),
        "# Approved Spec, Newer Path\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 1\n**Last Reviewed By:** plan-ceo-review\n\n## Notes\n",
    );
    write_file(
        &repo.join("docs/superpowers/plans/2026-01-22-document-review-system.md"),
        "# Approved Plan, Stale Source Path\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/superpowers/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Preserve the stale source path case\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The plan remains structurally valid while its source-spec path goes stale.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Detect the stale source path**\n",
    );

    let status_json = parse_json(
        &run_rust_superpowers(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for stale approved plan",
        ),
        "rust canonical workflow status refresh for stale approved plan",
    );

    assert_eq!(status_json["status"], "stale_plan");
    assert_eq!(status_json["next_skill"], "superpowers:writing-plans");
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
        &repo.join("docs/superpowers/specs/2026-01-22-document-review-system-design.md"),
        "# Approved Spec\n\n**Workflow State:** CEO Approved\n**Spec Revision:** 2\n**Last Reviewed By:** plan-ceo-review\n\n## Requirement Index\n\n- [REQ-001][behavior] The route should expose stale approved plans when the source-spec revision drifts.\n",
    );
    write_file(
        &repo.join("docs/superpowers/plans/2026-01-22-document-review-system.md"),
        "# Approved Plan, Stale Source Revision\n\n**Workflow State:** Engineering Approved\n**Plan Revision:** 1\n**Execution Mode:** none\n**Source Spec:** `docs/superpowers/specs/2026-01-22-document-review-system-design.md`\n**Source Spec Revision:** 1\n**Last Reviewed By:** plan-eng-review\n\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n\n## Task 1: Preserve the stale source revision case\n\n**Spec Coverage:** REQ-001\n**Task Outcome:** The plan remains structurally valid while its source-spec revision goes stale.\n**Plan Constraints:**\n- Keep the fixture minimal.\n**Open Questions:** none\n\n**Files:**\n- Test: `tests/workflow_runtime.rs`\n\n- [ ] **Step 1: Detect the stale source revision**\n",
    );

    let status_json = parse_json(
        &run_rust_superpowers(
            repo,
            state,
            &["workflow", "status", "--refresh"],
            "rust canonical workflow status refresh for stale approved revision",
        ),
        "rust canonical workflow status refresh for stale approved revision",
    );

    assert_eq!(status_json["status"], "stale_plan");
    assert_eq!(status_json["next_skill"], "superpowers:writing-plans");
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
        &repo.join("docs/superpowers/specs/2026-03-24-draft-spec-design.md"),
        "# Draft Spec\n\n**Workflow State:** Draft\n**Spec Revision:** 1\n**Last Reviewed By:** brainstorming\n",
    );

    let helper_json = run_shell_status_json(
        repo,
        state,
        &["status", "--refresh"],
        "shell helper status refresh for argv0 alias parity",
    );

    let alias_dir = TempDir::new().expect("alias tempdir should be available");
    let alias_path = alias_dir.path().join("superpowers-workflow-status");
    symlink(cargo_bin("superpowers"), &alias_path)
        .expect("argv0 alias symlink should be creatable");

    let alias_output = run(
        {
            let mut command = Command::new(&alias_path);
            command
                .current_dir(repo)
                .env("SUPERPOWERS_STATE_DIR", state)
                .args(["status", "--refresh"]);
            command
        },
        "rust argv0 workflow-status alias",
    );
    let alias_json = parse_json(&alias_output, "rust argv0 workflow-status alias");

    assert_eq!(alias_json["status"], helper_json["status"]);
    assert_eq!(alias_json["next_skill"], helper_json["next_skill"]);
    assert_eq!(alias_json["reason"], helper_json["reason"]);
    assert_eq!(alias_json["reason_codes"], helper_json["reason_codes"]);
}

#[test]
fn canonical_workflow_status_refresh_recovers_old_manifest_after_slug_change() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-cross-slug-old");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/superpowers/specs/2026-03-24-cross-slug-design.md";
    let expected_plan = "docs/superpowers/plans/2026-03-24-cross-slug-plan.md";

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
            next_skill: String::from("superpowers:writing-plans"),
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
fn canonical_workflow_status_refresh_limits_cross_slug_manifest_recovery_scan() {
    let (repo_dir, state_dir) = init_repo("workflow-runtime-cross-slug-budget");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = "docs/superpowers/specs/2026-03-24-budget-limit-design.md";
    let expected_plan = "docs/superpowers/plans/2026-03-24-budget-limit-plan.md";

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
                next_skill: String::from("superpowers:brainstorming"),
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
            next_skill: String::from("superpowers:writing-plans"),
            reason: String::from("repo_slug_recovered"),
            note: String::from("repo_slug_recovered"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_superpowers(
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
    let spec_a = "docs/superpowers/specs/2026-03-24-branch-mismatch-a.md";
    let spec_b = "docs/superpowers/specs/2026-03-24-branch-mismatch-b.md";

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
            next_skill: String::from("superpowers:writing-plans"),
            reason: String::from("stale-branch-manifest"),
            note: String::from("stale-branch-manifest"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_superpowers(
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
    let spec_path = "docs/superpowers/specs/2026-03-24-root-mismatch-spec.md";
    let plan_a = "docs/superpowers/plans/2026-03-24-root-mismatch-a.md";
    let plan_b = "docs/superpowers/plans/2026-03-24-root-mismatch-b.md";

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
            next_skill: String::from("superpowers:plan-eng-review"),
            reason: String::from("stale-root-manifest"),
            note: String::from("stale-root-manifest"),
            updated_at: String::from("2026-03-24T00:00:00Z"),
        },
    );

    let status_json = parse_json(
        &run_rust_superpowers(
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
fn canonical_workflow_phase_reads_canonical_session_entry_state() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-canonical-session-entry");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "phase-canonical-session-entry";
    let decision_path = state
        .join("session-entry")
        .join("using-superpowers")
        .join(session_key);

    write_file(&decision_path, "enabled\n");

    let phase_json = parse_json(
        &run_rust_superpowers_with_env(
            repo,
            state,
            &["workflow", "phase", "--json"],
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
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
fn canonical_workflow_phase_keeps_corrupt_manifest_read_only() {
    let (repo_dir, state_dir) = init_repo("workflow-phase-corrupt-manifest");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let spec_path = repo.join("docs/superpowers/specs/2026-03-24-corrupt-phase-spec.md");

    write_file(
        &spec_path,
        "# Phase Corrupt Manifest Spec\n\n**Workflow State:** Draft\n**Spec Revision:** 1\n**Last Reviewed By:** brainstorming\n",
    );

    let refresh_output = run_rust_superpowers(
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
        &run_rust_superpowers(
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
        .join("using-superpowers")
        .join(session_key);

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

    let next_output = run_rust_superpowers_with_env(
        repo,
        state,
        &["workflow", "next"],
        &[("SUPERPOWERS_SESSION_KEY", session_key)],
        "rust canonical workflow next should be available on ready plans",
    );
    assert!(
        next_output.status.success(),
        "workflow next should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        next_output.status,
        String::from_utf8_lossy(&next_output.stdout),
        String::from_utf8_lossy(&next_output.stderr)
    );
    assert!(
        String::from_utf8_lossy(&next_output.stdout)
            .to_lowercase()
            .contains("execution preflight"),
        "workflow next should mention execution preflight"
    );

    let artifacts_output = run_rust_superpowers_with_env(
        repo,
        state,
        &["workflow", "artifacts"],
        &[("SUPERPOWERS_SESSION_KEY", session_key)],
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
    assert!(
        artifacts_stdout
            .contains("docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md")
    );

    let explain_output = run_rust_superpowers_with_env(
        repo,
        state,
        &["workflow", "explain"],
        &[("SUPERPOWERS_SESSION_KEY", session_key)],
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
    assert!(explain_stdout.contains("Why"));
    assert!(
        explain_stdout
            .contains("docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md")
    );
}

#[test]
fn canonical_workflow_public_json_commands_work_for_ready_plan() {
    let (repo_dir, state_dir) = init_repo("workflow-public-json-commands");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-public-json-commands";
    let decision_path = state
        .join("session-entry")
        .join("using-superpowers")
        .join(session_key);
    let plan_rel = "docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md";

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

    let doctor_json = parse_json(
        &run_rust_superpowers_with_env(
            repo,
            state,
            &["workflow", "doctor", "--json"],
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
            "rust canonical workflow doctor should be available on ready plans",
        ),
        "rust canonical workflow doctor should be available on ready plans",
    );
    assert_eq!(doctor_json["route_status"], "implementation_ready");
    assert_eq!(doctor_json["contract_state"], "valid");

    let handoff_json = parse_json(
        &run_rust_superpowers_with_env(
            repo,
            state,
            &["workflow", "handoff", "--json"],
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
            "rust canonical workflow handoff should be available on ready plans",
        ),
        "rust canonical workflow handoff should be available on ready plans",
    );
    assert_eq!(handoff_json["route_status"], "implementation_ready");
    assert_eq!(
        handoff_json["recommended_skill"],
        "superpowers:executing-plans"
    );

    let preflight_json = parse_json(
        &run_rust_superpowers_with_env(
            repo,
            state,
            &["workflow", "preflight", "--plan", plan_rel, "--json"],
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
            "rust canonical workflow preflight should be available on ready plans",
        ),
        "rust canonical workflow preflight should be available on ready plans",
    );
    assert_eq!(preflight_json["allowed"], true);

    let gate_review_json = parse_json(
        &run_rust_superpowers_with_env(
            repo,
            state,
            &["workflow", "gate", "review", "--plan", plan_rel, "--json"],
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
            "rust canonical workflow gate review should be available on ready plans",
        ),
        "rust canonical workflow gate review should be available on ready plans",
    );
    assert_eq!(gate_review_json["allowed"], false);
    assert_eq!(gate_review_json["failure_class"], "ExecutionStateNotReady");

    let gate_finish_json = parse_json(
        &run_rust_superpowers_with_env(
            repo,
            state,
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"],
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
            "rust canonical workflow gate finish should be available on ready plans",
        ),
        "rust canonical workflow gate finish should be available on ready plans",
    );
    assert_eq!(gate_finish_json["allowed"], false);
    assert!(gate_finish_json["failure_class"].is_string());
}
