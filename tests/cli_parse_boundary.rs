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
use std::path::Path;
use std::process::{Command, Output};
use tempfile::TempDir;

use failure_json_support::parse_failure_json;
use files_support::write_file;
use json_support::parse_json;
use process_support::{run, run_checked};

const SPEC_REL: &str = "docs/featureforge/specs/2026-03-25-cli-parse-boundary-design.md";
const PLAN_REL: &str = "docs/featureforge/plans/2026-03-25-cli-parse-boundary.md";

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

    write_file(
        &repo.join(SPEC_REL),
        r#"# CLI Parse Boundary Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for CLI parse-boundary coverage.

## Requirement Index

- [REQ-001][behavior] Bounded CLI values must fail at the clap boundary.
"#,
    );
    write_file(
        &repo.join(PLAN_REL),
        &format!(
            r#"# CLI Parse Boundary Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `{SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Parse boundary

**Spec Coverage:** REQ-001
**Task Outcome:** Typed parse-boundary coverage stays explicit.
**Plan Constraints:**
- Keep parse-boundary failures at the CLI layer.
**Open Questions:** none

**Files:**
- Modify: `tests/cli_parse_boundary.rs`
- Test: `cargo nextest run --test cli_parse_boundary`

- [ ] **Step 1: Add red parse-boundary tests**
"#
        ),
    );

    (repo_dir, state_dir)
}

fn run_featureforge(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn execution_fingerprint(repo: &Path, state_dir: &Path) -> String {
    let status = parse_json(
        &run_featureforge(
            repo,
            state_dir,
            &["plan", "execution", "status", "--plan", PLAN_REL],
            "plan execution status fixture",
        ),
        "plan execution status fixture",
    );
    status["execution_fingerprint"]
        .as_str()
        .expect("execution fingerprint should stay a string")
        .to_owned()
}

#[test]
fn bare_featureforge_prints_help_instead_of_silent_success() {
    let output = run(
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist"),
        "bare featureforge command",
    );

    assert!(output.status.success(), "bare command should exit cleanly");
    let stdout = String::from_utf8(output.stdout).expect("help stdout should be utf-8");
    assert!(
        stdout.contains("Usage: featureforge"),
        "bare command should print help output, got:\n{stdout}"
    );
}

#[test]
fn plan_execution_begin_rejects_unknown_execution_modes_at_parse_boundary() {
    let (repo_dir, state_dir) = init_repo("cli-boundary-begin");
    let repo = repo_dir.path();
    let state = state_dir.path();
    let fingerprint = execution_fingerprint(repo, state);

    let output = run_featureforge(
        repo,
        state,
        &[
            "plan",
            "execution",
            "begin",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--execution-mode",
            "featureforge:other-mode",
            "--expect-execution-fingerprint",
            &fingerprint,
        ],
        "plan execution begin invalid execution mode",
    );
    let json = parse_failure_json(&output, "plan execution begin invalid execution mode");

    assert_eq!(
        json["error_class"],
        Value::String(String::from("InvalidCommandInput"))
    );
    let message = json["message"]
        .as_str()
        .expect("failure message should stay a string");
    assert!(message.contains("possible values"));
    assert!(message.contains("featureforge:executing-plans"));
    assert!(message.contains("featureforge:subagent-driven-development"));
}

#[test]
fn plan_execution_note_rejects_unknown_states_at_parse_boundary() {
    let (repo_dir, state_dir) = init_repo("cli-boundary-note");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let output = run_featureforge(
        repo,
        state,
        &[
            "plan",
            "execution",
            "note",
            "--plan",
            PLAN_REL,
            "--task",
            "1",
            "--step",
            "1",
            "--state",
            "paused",
            "--message",
            "fixture note",
            "--expect-execution-fingerprint",
            "ignored-for-parse-boundary",
        ],
        "plan execution note invalid state",
    );
    let json = parse_failure_json(&output, "plan execution note invalid state");

    assert_eq!(
        json["error_class"],
        Value::String(String::from("InvalidCommandInput"))
    );
    let message = json["message"]
        .as_str()
        .expect("failure message should stay a string");
    assert!(message.contains("possible values"));
    assert!(message.contains("blocked"));
    assert!(message.contains("interrupted"));
}

#[test]
fn plan_execution_recommend_rejects_unknown_strategy_flags_at_parse_boundary() {
    let (repo_dir, state_dir) = init_repo("cli-boundary-recommend");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let output = run_featureforge(
        repo,
        state,
        &[
            "plan",
            "execution",
            "recommend",
            "--plan",
            PLAN_REL,
            "--isolated-agents",
            "sometimes",
            "--session-intent",
            "linger",
            "--workspace-prepared",
            "maybe",
        ],
        "plan execution recommend invalid strategy flags",
    );
    let json = parse_failure_json(&output, "plan execution recommend invalid strategy flags");

    assert_eq!(
        json["error_class"],
        Value::String(String::from("InvalidCommandInput"))
    );
    let message = json["message"]
        .as_str()
        .expect("failure message should stay a string");
    assert!(message.contains("possible values"));
    assert!(message.contains("available"));
    assert!(message.contains("unavailable"));
}

#[test]
fn plan_execution_task3_commands_require_their_artifact_flags_at_parse_boundary() {
    let (repo_dir, state_dir) = init_repo("cli-boundary-task3-commands");
    let repo = repo_dir.path();
    let state = state_dir.path();

    for (command_name, required_flag) in [
        ("gate-contract", "--contract"),
        ("record-contract", "--contract"),
        ("gate-evaluator", "--evaluation"),
        ("record-evaluation", "--evaluation"),
        ("gate-handoff", "--handoff"),
        ("record-handoff", "--handoff"),
    ] {
        let output = run_featureforge(
            repo,
            state,
            &["plan", "execution", command_name, "--plan", PLAN_REL],
            "plan execution task3 command missing required artifact flag",
        );
        let json = parse_failure_json(
            &output,
            "plan execution task3 command missing required artifact flag",
        );

        assert_eq!(
            json["error_class"],
            Value::String(String::from("InvalidCommandInput"))
        );
        let message = json["message"]
            .as_str()
            .expect("failure message should stay a string");
        assert!(
            message.contains("required arguments were not provided"),
            "command {command_name} should be parsed and fail because a required argument is missing, got: {message}"
        );
        assert!(
            message.contains(required_flag),
            "command {command_name} should require {required_flag}, got: {message}"
        );
    }
}

#[test]
fn repo_safety_check_rejects_unknown_bounded_values_at_parse_boundary() {
    let (repo_dir, state_dir) = init_repo("cli-boundary-repo-safety");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let invalid_intent = parse_failure_json(
        &run_featureforge(
            repo,
            state,
            &[
                "repo-safety",
                "check",
                "--intent",
                "observe",
                "--stage",
                "featureforge:executing-plans",
                "--path",
                "tests/cli_parse_boundary.rs",
                "--write-target",
                "execution-task-slice",
            ],
            "repo-safety invalid intent",
        ),
        "repo-safety invalid intent",
    );
    let intent_message = invalid_intent["message"]
        .as_str()
        .expect("intent failure should include a string message");
    assert!(intent_message.contains("possible values"));
    assert!(intent_message.contains("read"));
    assert!(intent_message.contains("write"));

    let invalid_target = parse_failure_json(
        &run_featureforge(
            repo,
            state,
            &[
                "repo-safety",
                "check",
                "--intent",
                "write",
                "--stage",
                "featureforge:executing-plans",
                "--path",
                "tests/cli_parse_boundary.rs",
                "--write-target",
                "not-a-write-target",
            ],
            "repo-safety invalid write target",
        ),
        "repo-safety invalid write target",
    );
    let target_message = invalid_target["message"]
        .as_str()
        .expect("write-target failure should include a string message");
    assert!(target_message.contains("possible values"));
    assert!(target_message.contains("execution-task-slice"));
    assert!(target_message.contains("git-commit"));
}

#[test]
fn session_entry_record_rejects_unknown_decisions_at_parse_boundary() {
    let output = run(
        {
            let mut command =
                Command::cargo_bin("featureforge").expect("featureforge cargo binary should exist");
            command.args(["session-entry", "record", "--decision", "later"]);
            command
        },
        "session-entry record invalid decision",
    );
    let json = parse_failure_json(&output, "session-entry record invalid decision");

    assert_eq!(
        json["error_class"],
        Value::String(String::from("InvalidCommandInput"))
    );
    let message = json["message"]
        .as_str()
        .expect("failure message should stay a string");
    assert!(message.contains("possible values"));
    assert!(message.contains("enabled"));
    assert!(message.contains("bypassed"));
}
