#[path = "support/failure_json.rs"]
mod failure_json_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use assert_cmd::cargo::CommandCargoExt;
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

use failure_json_support::parse_failure_json;
use files_support::write_file;
use json_support::parse_json;
use process_support::{run, run_checked};

fn init_repo(name: &str, branch: &str, remote_url: &str) -> (TempDir, TempDir) {
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

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", branch])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout branch");

    let mut git_remote_add = Command::new("git");
    git_remote_add
        .args(["remote", "add", "origin", remote_url])
        .current_dir(repo);
    run_checked(git_remote_add, "git remote add origin");

    (repo_dir, state_dir)
}

fn run_shell_repo_safety(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(["repo-safety"])
        .args(args);
    run(command, context)
}

fn run_rust_featureforge(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn checkout_branch(repo: &Path, branch: &str) {
    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", branch])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout branch");
}

#[test]
fn canonical_repo_safety_check_matches_helper_for_protected_branch_block() {
    let remote_url = "https://example.com/acme/repo-safety.git";
    let (repo_dir, state_dir) = init_repo("repo-safety-block", "main", remote_url);
    let repo = repo_dir.path();
    let state = state_dir.path();

    let helper_output = run_shell_repo_safety(
        repo,
        state,
        &[
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "helper protected branch block",
    );
    let helper_json = parse_json(&helper_output, "helper protected branch block");

    let rust_output = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety protected branch block",
    );
    let rust_json = parse_json(&rust_output, "canonical repo-safety protected branch block");

    assert_eq!(rust_json["outcome"], helper_json["outcome"]);
    assert_eq!(rust_json["failure_class"], helper_json["failure_class"]);
    assert_eq!(rust_json["protected_by"], helper_json["protected_by"]);
    assert_eq!(
        rust_json["suggested_next_skill"],
        helper_json["suggested_next_skill"]
    );
}

#[test]
fn canonical_repo_safety_matches_helper_for_instruction_protected_branch_rule() {
    let remote_url = "https://example.com/acme/repo-safety.git";
    let (repo_dir, state_dir) = init_repo("repo-safety-instructions", "release", remote_url);
    let repo = repo_dir.path();
    let state = state_dir.path();

    write_file(
        &repo.join("AGENTS.override.md"),
        "FeatureForge protected branches: release\n",
    );

    let helper_output = run_shell_repo_safety(
        repo,
        state,
        &[
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "release-task",
            "--path",
            "docs/featureforge/specs/release-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "helper instruction protected branch",
    );
    let helper_json = parse_json(&helper_output, "helper instruction protected branch");

    let rust_output = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "release-task",
            "--path",
            "docs/featureforge/specs/release-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety instruction protected branch",
    );
    let rust_json = parse_json(
        &rust_output,
        "canonical repo-safety instruction protected branch",
    );

    assert_eq!(rust_json["outcome"], helper_json["outcome"]);
    assert_eq!(rust_json["failure_class"], helper_json["failure_class"]);
    assert_eq!(rust_json["protected_by"], helper_json["protected_by"]);
}

#[test]
fn canonical_repo_safety_handles_read_intent_feature_branches_and_instruction_override_rules() {
    let remote_url = "https://example.com/acme/repo-safety.git";

    let (read_repo_dir, read_state_dir) = init_repo("repo-safety-read", "main", remote_url);
    let read_output = run_rust_featureforge(
        read_repo_dir.path(),
        read_state_dir.path(),
        &[
            "repo-safety",
            "check",
            "--intent",
            "read",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "read-task",
            "--path",
            "docs/spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety read intent on protected branch",
    );
    let read_json = parse_json(
        &read_output,
        "canonical repo-safety read intent on protected branch",
    );
    assert_eq!(read_json["outcome"], Value::String(String::from("allowed")));
    assert_eq!(read_json["intent"], Value::String(String::from("read")));
    assert_eq!(read_json["protected"], Value::Bool(true));
    assert_eq!(
        read_json["protected_by"],
        Value::String(String::from("default"))
    );
    assert_eq!(read_json["failure_class"], Value::String(String::from("")));

    let (feature_repo_dir, feature_state_dir) =
        init_repo("repo-safety-feature", "feature/repo-safety", remote_url);
    let feature_output = run_rust_featureforge(
        feature_repo_dir.path(),
        feature_state_dir.path(),
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "feature-task",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety feature branch write",
    );
    let feature_json = parse_json(
        &feature_output,
        "canonical repo-safety feature branch write",
    );
    assert_eq!(
        feature_json["outcome"],
        Value::String(String::from("allowed"))
    );
    assert_eq!(feature_json["protected"], Value::Bool(false));
    assert_eq!(
        feature_json["protected_by"],
        Value::String(String::from("default"))
    );

    let (override_repo_dir, override_state_dir) =
        init_repo("repo-safety-override", "release", remote_url);
    write_file(
        &override_repo_dir.path().join("AGENTS.override.md"),
        "FeatureForge protected branches: release\n",
    );
    let root_override_output = run_rust_featureforge(
        override_repo_dir.path(),
        override_state_dir.path(),
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "release-task",
            "--path",
            "docs/featureforge/specs/release-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety root instruction override",
    );
    let root_override_json = parse_json(
        &root_override_output,
        "canonical repo-safety root instruction override",
    );
    assert_eq!(
        root_override_json["outcome"],
        Value::String(String::from("blocked"))
    );
    assert_eq!(
        root_override_json["failure_class"],
        Value::String(String::from("ProtectedBranchDetected"))
    );
    assert_eq!(
        root_override_json["protected_by"],
        Value::String(String::from("instructions"))
    );

    fs::create_dir_all(override_repo_dir.path().join("apps/cli"))
        .expect("nested override parent should exist");
    write_file(
        &override_repo_dir.path().join("apps/AGENTS.override.md"),
        "FeatureForge protected branches: release\n",
    );
    let nested_override_output = run_rust_featureforge(
        &override_repo_dir.path().join("apps/cli"),
        override_state_dir.path(),
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "nested-release-task",
            "--path",
            "docs/featureforge/specs/release-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety nested instruction override",
    );
    let nested_override_json = parse_json(
        &nested_override_output,
        "canonical repo-safety nested instruction override",
    );
    assert_eq!(
        nested_override_json["outcome"],
        Value::String(String::from("blocked"))
    );
    assert_eq!(
        nested_override_json["failure_class"],
        Value::String(String::from("ProtectedBranchDetected"))
    );
    assert_eq!(
        nested_override_json["protected_by"],
        Value::String(String::from("instructions"))
    );

    let (invalid_repo_dir, invalid_state_dir) =
        init_repo("repo-safety-invalid-instruction", "release", remote_url);
    write_file(
        &invalid_repo_dir.path().join("AGENTS.override.md"),
        "FeatureForge protected branches: release/*\n",
    );
    let invalid_instruction_output = run_rust_featureforge(
        invalid_repo_dir.path(),
        invalid_state_dir.path(),
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "release-task",
            "--path",
            "docs/featureforge/specs/release-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety invalid instruction entry",
    );
    let invalid_instruction_json = parse_failure_json(
        &invalid_instruction_output,
        "canonical repo-safety invalid instruction entry",
    );
    assert_eq!(
        invalid_instruction_json["error_class"],
        Value::String(String::from("InstructionParseFailed"))
    );
}

#[test]
fn canonical_repo_safety_matching_approvals_and_scope_rules_are_precise() {
    let remote_url = "https://example.com/acme/repo-safety.git";

    let (repo_dir, state_dir) = init_repo("repo-safety-approval", "main", remote_url);
    let repo = repo_dir.path();
    let state = state_dir.path();

    let matching_approval = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "approve",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--reason",
            "User explicitly approved writing the spec on main.",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety matching approval",
    );
    let matching_approval_json = parse_json(
        &matching_approval,
        "canonical repo-safety matching approval",
    );
    let matching_check = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety matching approval check",
    );
    let matching_check_json = parse_json(
        &matching_check,
        "canonical repo-safety matching approval check",
    );
    assert_eq!(
        matching_check_json["outcome"],
        Value::String(String::from("allowed"))
    );
    assert_eq!(matching_check_json["protected"], Value::Bool(true));
    assert_eq!(
        matching_approval_json["approval_path"],
        matching_check_json["approval_path"]
    );
    assert_eq!(
        matching_check_json["failure_class"],
        Value::String(String::from(""))
    );
    assert_ne!(
        matching_check_json["approval_fingerprint"],
        Value::String(String::from(""))
    );

    let full_scope_approval = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "approve",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-full-scope-task",
            "--reason",
            "User explicitly approved the spec write and same-slice commit on main.",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
            "--write-target",
            "git-commit",
        ],
        "canonical repo-safety full-scope approval",
    );
    let full_scope_approval_json = parse_json(
        &full_scope_approval,
        "canonical repo-safety full-scope approval",
    );
    let full_scope_check = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-full-scope-task",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
            "--write-target",
            "git-commit",
        ],
        "canonical repo-safety full-scope approval check",
    );
    let full_scope_check_json = parse_json(
        &full_scope_check,
        "canonical repo-safety full-scope approval check",
    );
    assert_eq!(
        full_scope_check_json["outcome"],
        Value::String(String::from("allowed"))
    );
    assert_eq!(full_scope_check_json["protected"], Value::Bool(true));
    assert_eq!(
        full_scope_approval_json["approval_path"],
        full_scope_check_json["approval_path"]
    );

    let mismatched_path_approval = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "approve",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-mismatch-path",
            "--reason",
            "User explicitly approved the original spec path.",
            "--path",
            "docs/featureforge/specs/original.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety mismatched path approval",
    );
    let mismatched_path_approval_json = parse_json(
        &mismatched_path_approval,
        "canonical repo-safety mismatched path approval",
    );
    let mismatched_path_check = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-mismatch-path",
            "--path",
            "docs/featureforge/specs/other.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety mismatched path check",
    );
    let mismatched_path_check_json = parse_json(
        &mismatched_path_check,
        "canonical repo-safety mismatched path check",
    );
    assert_eq!(
        mismatched_path_check_json["outcome"],
        Value::String(String::from("blocked"))
    );
    assert_eq!(
        mismatched_path_check_json["failure_class"],
        Value::String(String::from("ApprovalFingerprintMismatch"))
    );
    assert_eq!(
        mismatched_path_approval_json["approval_path"],
        mismatched_path_check_json["approval_path"]
    );

    let mismatched_target_approval = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "approve",
            "--stage",
            "featureforge:finishing-a-development-branch",
            "--task-id",
            "finish-task",
            "--reason",
            "User explicitly approved the commit only.",
            "--write-target",
            "git-commit",
        ],
        "canonical repo-safety mismatched target approval",
    );
    let mismatched_target_approval_json = parse_json(
        &mismatched_target_approval,
        "canonical repo-safety mismatched target approval",
    );
    let mismatched_target_check = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:finishing-a-development-branch",
            "--task-id",
            "finish-task",
            "--write-target",
            "git-push",
        ],
        "canonical repo-safety mismatched target check",
    );
    let mismatched_target_check_json = parse_json(
        &mismatched_target_check,
        "canonical repo-safety mismatched target check",
    );
    assert_eq!(
        mismatched_target_check_json["outcome"],
        Value::String(String::from("blocked"))
    );
    assert_eq!(
        mismatched_target_check_json["failure_class"],
        Value::String(String::from("ApprovalFingerprintMismatch"))
    );
    assert_eq!(
        mismatched_target_approval_json["approval_path"],
        mismatched_target_check_json["approval_path"]
    );

    let malformed_scope_check = {
        let approval_path = PathBuf::from(
            mismatched_path_approval_json["approval_path"]
                .as_str()
                .expect("approval path should be a string"),
        );
        let mut record: Value =
            serde_json::from_slice(&fs::read(&approval_path).expect("approval record should read"))
                .expect("approval record should parse");
        record["stage"] = Value::String(String::from("featureforge:writing-plans"));
        fs::write(
            &approval_path,
            serde_json::to_vec(&record).expect("approval record should serialize"),
        )
        .expect("approval record should rewrite");
        run_rust_featureforge(
            repo,
            state,
            &[
                "repo-safety",
                "check",
                "--intent",
                "write",
                "--stage",
                "featureforge:brainstorming",
                "--task-id",
                "spec-mismatch-path",
                "--path",
                "docs/featureforge/specs/original.md",
                "--write-target",
                "spec-artifact-write",
            ],
            "canonical repo-safety malformed scope record check",
        )
    };
    let malformed_scope_check_json = parse_json(
        &malformed_scope_check,
        "canonical repo-safety malformed scope record check",
    );
    assert_eq!(
        malformed_scope_check_json["outcome"],
        Value::String(String::from("blocked"))
    );
    assert_eq!(
        malformed_scope_check_json["failure_class"],
        Value::String(String::from("ApprovalScopeMismatch"))
    );

    let invalid_write_target = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--write-target",
            "totally-unknown-target",
        ],
        "canonical repo-safety invalid write target",
    );
    let invalid_write_target_json = parse_failure_json(
        &invalid_write_target,
        "canonical repo-safety invalid write target",
    );
    assert_eq!(
        invalid_write_target_json["error_class"],
        Value::String(String::from("InvalidWriteTarget"))
    );
}

#[test]
fn canonical_repo_safety_distinguishes_exact_branch_names_in_scope_identity() {
    let remote_url = "https://example.com/acme/repo-safety.git";
    let (repo_dir, state_dir) = init_repo("repo-safety-branch-identity", "feature/x", remote_url);
    let repo = repo_dir.path();
    let state = state_dir.path();

    let slash_branch = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &[
                "repo-safety",
                "check",
                "--intent",
                "write",
                "--stage",
                "featureforge:brainstorming",
                "--task-id",
                "branch-identity-task",
                "--path",
                "docs/featureforge/specs/new-spec.md",
                "--write-target",
                "spec-artifact-write",
            ],
            "repo-safety exact branch identity on feature/x",
        ),
        "repo-safety exact branch identity on feature/x",
    );

    checkout_branch(repo, "feature-x");

    let dash_branch = parse_json(
        &run_rust_featureforge(
            repo,
            state,
            &[
                "repo-safety",
                "check",
                "--intent",
                "write",
                "--stage",
                "featureforge:brainstorming",
                "--task-id",
                "branch-identity-task",
                "--path",
                "docs/featureforge/specs/new-spec.md",
                "--write-target",
                "spec-artifact-write",
            ],
            "repo-safety exact branch identity on feature-x",
        ),
        "repo-safety exact branch identity on feature-x",
    );

    assert_ne!(
        slash_branch["approval_path"], dash_branch["approval_path"],
        "approval storage paths should stay exact-branch scoped",
    );
    assert_ne!(
        slash_branch["approval_fingerprint"], dash_branch["approval_fingerprint"],
        "approval fingerprints should stay exact-branch scoped",
    );
}

#[test]
fn canonical_repo_safety_rejects_invalid_inputs_and_keeps_deterministic_hot_paths() {
    let remote_url = "https://example.com/acme/repo-safety.git";
    let (repo_dir, state_dir) = init_repo("repo-safety-invalid-inputs", "main", remote_url);
    let repo = repo_dir.path();
    let state = state_dir.path();

    let whitespace_task = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "   ",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety whitespace task id",
    );
    let whitespace_task_json =
        parse_failure_json(&whitespace_task, "canonical repo-safety whitespace task id");
    assert_eq!(
        whitespace_task_json["error_class"],
        Value::String(String::from("InvalidCommandInput"))
    );

    let windows_path = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--path",
            "C:\\repo\\docs\\featureforge\\specs\\new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety windows absolute path",
    );
    let windows_path_json =
        parse_failure_json(&windows_path, "canonical repo-safety windows absolute path");
    assert_eq!(
        windows_path_json["error_class"],
        Value::String(String::from("InvalidCommandInput"))
    );

    let approval = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "approve",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--reason",
            "User explicitly approved this scope.",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety deterministic approval path",
    );
    let approval_json = parse_json(
        &approval,
        "canonical repo-safety deterministic approval path",
    );
    let expected_path = PathBuf::from(
        approval_json["approval_path"]
            .as_str()
            .expect("approval path should be a string"),
    );
    for i in 1..=100 {
        let decoy_root = state.join(format!("projects/decoy-{i}"));
        let decoy_dir = decoy_root.join("user-main-repo-safety");
        fs::create_dir_all(&decoy_dir).expect("decoy approval directory should exist");
        fs::write(
            decoy_dir.join(format!("decoy-{i}.json")),
            format!(
                r#"{{"repo_root":"/tmp/decoy-{i}","branch":"main","stage":"featureforge:brainstorming","task_id":"decoy-{i}","paths":[],"write_targets":["spec-artifact-write"],"approval_fingerprint":"decoy-{i}","approval_reason":"decoy","protected_by":"default","approved_at":"2026-03-21T00:00:00Z"}}"#
            ),
        )
        .expect("decoy approval file should be writable");
    }

    let hot_path_check = run_rust_featureforge(
        repo,
        state,
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "featureforge:brainstorming",
            "--task-id",
            "spec-task",
            "--path",
            "docs/featureforge/specs/new-spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "canonical repo-safety deterministic hot path",
    );
    let hot_path_json = parse_json(
        &hot_path_check,
        "canonical repo-safety deterministic hot path",
    );
    assert_eq!(
        hot_path_json["outcome"],
        Value::String(String::from("allowed"))
    );
    assert_eq!(
        hot_path_json["approval_path"],
        Value::String(expected_path.to_string_lossy().into_owned())
    );
}
