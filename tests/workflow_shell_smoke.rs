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

use assert_cmd::cargo::CommandCargoExt;
use bin_support::compiled_superpowers_path;
use files_support::write_file;
use json_support::parse_json;
use process_support::{repo_root, run};
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;
use workflow_support::{init_repo, install_full_contract_ready_artifacts, workflow_fixture_root};

fn public_workflow_wrapper_path() -> PathBuf {
    repo_root().join("bin/superpowers-workflow")
}

fn copy_fixture(repo: &Path, fixture_rel: &str, dest_rel: &str) {
    let fixture_root = workflow_fixture_root();
    let dest = repo.join(dest_rel);
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).expect("fixture parent should be creatable");
    }
    std::fs::copy(fixture_root.join(fixture_rel), dest).expect("fixture should copy");
}

fn install_ready_artifacts(repo: &Path) {
    let spec_rel = "docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md";
    let plan_rel = "docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md";
    copy_fixture(
        repo,
        "specs/2026-03-22-runtime-integration-hardening-design.md",
        spec_rel,
    );
    let plan_path = repo.join(plan_rel);
    copy_fixture(
        repo,
        "plans/2026-03-22-runtime-integration-hardening.md",
        plan_rel,
    );
    let plan_source = std::fs::read_to_string(&plan_path).expect("ready plan fixture should read");
    let adjusted = plan_source.replace(
        "tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md",
        spec_rel,
    );
    std::fs::write(&plan_path, adjusted).expect("ready plan fixture should write");
}

fn run_superpowers(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("superpowers").expect("superpowers cargo binary should be available");
    command
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn run_superpowers_with_env(
    repo: &Path,
    state_dir: &Path,
    args: &[&str],
    extra_env: &[(&str, &str)],
    context: &str,
) -> Output {
    let mut command =
        Command::cargo_bin("superpowers").expect("superpowers cargo binary should be available");
    command
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .args(args);
    for (key, value) in extra_env {
        command.env(key, value);
    }
    run(command, context)
}

fn run_public_workflow_wrapper(
    repo: &Path,
    state_dir: &Path,
    args: &[&str],
    context: &str,
) -> Output {
    let mut command = Command::new(public_workflow_wrapper_path());
    command
        .current_dir(repo)
        .env("SUPERPOWERS_COMPAT_BIN", compiled_superpowers_path())
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn run_public_workflow_wrapper_with_env(
    repo: &Path,
    state_dir: &Path,
    args: &[&str],
    extra_env: &[(&str, &str)],
    context: &str,
) -> Output {
    let mut command = Command::new(public_workflow_wrapper_path());
    command
        .current_dir(repo)
        .env("SUPERPOWERS_COMPAT_BIN", compiled_superpowers_path())
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .args(args);
    for (key, value) in extra_env {
        command.env(key, value);
    }
    run(command, context)
}

#[test]
fn workflow_help_outside_repo_mentions_the_public_surfaces() {
    let outside_repo = TempDir::new().expect("outside repo tempdir should exist");
    let output = run_superpowers(
        outside_repo.path(),
        outside_repo.path(),
        &["workflow", "help"],
        "workflow help outside repo",
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Usage: superpowers workflow <COMMAND>"));
    assert!(stdout.contains("Commands:"));
    assert!(stdout.contains("status"));
    assert!(stdout.contains("help"));
}

#[test]
fn public_workflow_wrapper_help_outside_repo_mentions_the_public_surfaces() {
    let outside_repo = TempDir::new().expect("outside repo tempdir should exist");
    let output = run_public_workflow_wrapper(
        outside_repo.path(),
        outside_repo.path(),
        &["help"],
        "public workflow wrapper help outside repo",
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Usage: superpowers workflow <COMMAND>"));
    assert!(stdout.contains("Commands:"));
    assert!(stdout.contains("status"));
    assert!(stdout.contains("help"));
}

#[test]
fn workflow_status_summary_matches_json_semantics_for_ready_plans() {
    let (repo_dir, state_dir) = init_repo("workflow-summary");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-summary";
    let decision_path = state
        .join("session-entry")
        .join("using-superpowers")
        .join(session_key);
    write_file(&decision_path, "enabled\n");
    install_ready_artifacts(repo);

    let json_output = run_superpowers(
        repo,
        state,
        &["workflow", "status", "--refresh"],
        "workflow status json",
    );
    let json_stdout = String::from_utf8_lossy(&json_output.stdout);
    assert!(json_stdout.contains("\"status\":\"implementation_ready\""));
    assert!(json_stdout.contains("\"next_skill\":\"\""));

    let summary_output = run_superpowers(
        repo,
        state,
        &["workflow", "status", "--refresh", "--summary"],
        "workflow status summary",
    );
    let summary_stdout = String::from_utf8_lossy(&summary_output.stdout);
    assert!(!summary_stdout.contains("{\"status\""));
    assert!(summary_stdout.contains("status=implementation_ready"));
    assert!(summary_stdout.contains("next=execution_preflight"));
    assert!(summary_stdout.contains(
        "spec=docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md"
    ));
    assert!(
        summary_stdout
            .contains("plan=docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md")
    );
}

#[test]
fn public_workflow_wrapper_status_summary_matches_json_semantics_for_ready_plans() {
    let (repo_dir, state_dir) = init_repo("workflow-summary-wrapper");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-summary-wrapper";
    let decision_path = state
        .join("session-entry")
        .join("using-superpowers")
        .join(session_key);
    write_file(&decision_path, "enabled\n");
    install_ready_artifacts(repo);

    let json_output = run_public_workflow_wrapper(
        repo,
        state,
        &["status", "--refresh"],
        "public workflow wrapper status json",
    );
    let json_stdout = String::from_utf8_lossy(&json_output.stdout);
    assert!(json_stdout.contains("\"status\":\"implementation_ready\""));
    assert!(json_stdout.contains("\"next_skill\":\"\""));

    let summary_output = run_public_workflow_wrapper(
        repo,
        state,
        &["status", "--refresh", "--summary"],
        "public workflow wrapper status summary",
    );
    let summary_stdout = String::from_utf8_lossy(&summary_output.stdout);
    assert!(!summary_stdout.contains("{\"status\""));
    assert!(summary_stdout.contains("status=implementation_ready"));
    assert!(summary_stdout.contains("next=execution_preflight"));
    assert!(summary_stdout.contains(
        "spec=docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md"
    ));
    assert!(
        summary_stdout
            .contains("plan=docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md")
    );
}

#[test]
fn public_workflow_wrapper_text_operator_commands_match_canonical_ready_plan_outputs() {
    let (repo_dir, state_dir) = init_repo("workflow-wrapper-text-operator-parity");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-wrapper-text-operator-parity";
    let decision_path = state
        .join("session-entry")
        .join("using-superpowers")
        .join(session_key);

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

    for (canonical_args, wrapper_args, label) in [
        (
            &["workflow", "next"][..],
            &["next"][..],
            "workflow next wrapper parity",
        ),
        (
            &["workflow", "artifacts"][..],
            &["artifacts"][..],
            "workflow artifacts wrapper parity",
        ),
        (
            &["workflow", "explain"][..],
            &["explain"][..],
            "workflow explain wrapper parity",
        ),
        (
            &["workflow", "phase"][..],
            &["phase"][..],
            "workflow phase wrapper parity",
        ),
    ] {
        let canonical = run_superpowers_with_env(
            repo,
            state,
            canonical_args,
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
            label,
        );
        let wrapper = run_public_workflow_wrapper_with_env(
            repo,
            state,
            wrapper_args,
            &[("SUPERPOWERS_SESSION_KEY", session_key)],
            label,
        );

        assert!(
            canonical.status.success(),
            "{label}: canonical command should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
            canonical.status,
            String::from_utf8_lossy(&canonical.stdout),
            String::from_utf8_lossy(&canonical.stderr)
        );
        assert!(
            wrapper.status.success(),
            "{label}: wrapper command should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
            wrapper.status,
            String::from_utf8_lossy(&wrapper.stdout),
            String::from_utf8_lossy(&wrapper.stderr)
        );
        assert_eq!(
            String::from_utf8_lossy(&wrapper.stdout),
            String::from_utf8_lossy(&canonical.stdout),
            "{label}: wrapper stdout should match canonical output"
        );
        assert_eq!(
            String::from_utf8_lossy(&wrapper.stderr),
            String::from_utf8_lossy(&canonical.stderr),
            "{label}: wrapper stderr should match canonical output"
        );
    }
}

#[test]
fn public_workflow_wrapper_json_operator_commands_match_canonical_ready_plan_outputs() {
    let (repo_dir, state_dir) = init_repo("workflow-wrapper-json-operator-parity");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let session_key = "workflow-wrapper-json-operator-parity";
    let decision_path = state
        .join("session-entry")
        .join("using-superpowers")
        .join(session_key);
    let plan_rel = "docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md";

    install_full_contract_ready_artifacts(repo);
    write_file(&decision_path, "enabled\n");

    for (canonical_args, wrapper_args, label) in [
        (
            &["workflow", "doctor", "--json"][..],
            &["doctor", "--json"][..],
            "workflow doctor wrapper parity",
        ),
        (
            &["workflow", "handoff", "--json"][..],
            &["handoff", "--json"][..],
            "workflow handoff wrapper parity",
        ),
        (
            &["workflow", "phase", "--json"][..],
            &["phase", "--json"][..],
            "workflow phase json wrapper parity",
        ),
        (
            &["workflow", "preflight", "--plan", plan_rel, "--json"][..],
            &["preflight", "--plan", plan_rel, "--json"][..],
            "workflow preflight wrapper parity",
        ),
        (
            &["workflow", "gate", "review", "--plan", plan_rel, "--json"][..],
            &["gate", "review", "--plan", plan_rel, "--json"][..],
            "workflow gate review wrapper parity",
        ),
        (
            &["workflow", "gate", "finish", "--plan", plan_rel, "--json"][..],
            &["gate", "finish", "--plan", plan_rel, "--json"][..],
            "workflow gate finish wrapper parity",
        ),
    ] {
        let canonical = parse_json(
            &run_superpowers_with_env(
                repo,
                state,
                canonical_args,
                &[("SUPERPOWERS_SESSION_KEY", session_key)],
                label,
            ),
            label,
        );
        let wrapper = parse_json(
            &run_public_workflow_wrapper_with_env(
                repo,
                state,
                wrapper_args,
                &[("SUPERPOWERS_SESSION_KEY", session_key)],
                label,
            ),
            label,
        );
        assert_eq!(
            wrapper, canonical,
            "{label}: wrapper json should match canonical"
        );
    }
}
