#[path = "support/files.rs"]
mod files_support;
#[path = "support/process.rs"]
mod process_support;

use assert_cmd::cargo::CommandCargoExt;
use files_support::write_file;
use process_support::run;
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn run_featureforge(state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should be available");
    command
        .current_dir(repo_root())
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

fn resolve_message(state_dir: &Path, session_key: &str, message: &str, context: &str) -> Value {
    let message_file = state_dir.join(format!("{session_key}.md"));
    write_file(&message_file, message);
    let output = run_featureforge(
        state_dir,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file
                .to_str()
                .expect("message file path should stay valid utf-8"),
            "--session-key",
            session_key,
        ],
        context,
    );
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

#[test]
fn fresh_entry_spec_plan_and_execution_intents_all_surface_the_bypass_prompt_first() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let state = state_dir.path();

    for (session_key, message) in [
        (
            "shell-smoke-spec-review",
            "Please review this spec draft from a fresh entry path.\n",
        ),
        (
            "shell-smoke-plan-review",
            "Please review this implementation plan from a fresh entry path.\n",
        ),
        (
            "shell-smoke-execution-preflight",
            "Please start implementation from the approved plan in this fresh entry path.\n",
        ),
    ] {
        let json = resolve_message(
            state,
            session_key,
            message,
            "session-entry resolve for fresh supported-entry shell smoke",
        );
        assert_eq!(
            json["outcome"],
            Value::String(String::from("needs_user_choice")),
            "{session_key} should require the bypass prompt first"
        );
        assert_eq!(
            json["decision_source"],
            Value::String(String::from("missing")),
            "{session_key} should remain a fresh missing-decision session"
        );
        assert!(
            json["prompt"]["question"]
                .as_str()
                .is_some_and(|value| !value.trim().is_empty()),
            "{session_key} should expose a non-empty bypass prompt question"
        );
    }
}
