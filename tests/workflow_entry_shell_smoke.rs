#[path = "support/files.rs"]
mod files_support;
#[path = "support/process.rs"]
mod process_support;
#[path = "support/workflow.rs"]
mod workflow_support;

use assert_cmd::cargo::CommandCargoExt;
use process_support::run;
use serde_json::Value;
use std::path::Path;
use std::process::{Command, Output};
use workflow_support::{init_repo, install_full_contract_ready_artifacts};

fn run_featureforge(repo: &Path, state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should be available");
    command
        .current_dir(repo)
        .env("FEATUREFORGE_STATE_DIR", state_dir)
        .args(args);
    run(command, context)
}

#[test]
fn fresh_entry_workflow_status_refresh_routes_directly_without_session_entry_state() {
    let (repo_dir, state_dir) = init_repo("workflow-entry-shell-smoke");
    let repo = repo_dir.path();
    let state = state_dir.path();
    install_full_contract_ready_artifacts(repo);

    let output = run_featureforge(
        repo,
        state,
        &["workflow", "status", "--refresh"],
        "workflow status refresh from fresh entry shell smoke",
    );
    assert!(
        output.status.success(),
        "fresh entry workflow status should succeed without session-entry state, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let json: Value = serde_json::from_slice(&output.stdout)
        .unwrap_or_else(|error| panic!("workflow status refresh should emit valid json: {error}"));
    assert_eq!(json["schema_version"], Value::from(3));
    assert!(
        json["status"]
            .as_str()
            .is_some_and(|value| !value.trim().is_empty()),
        "fresh entry workflow status should route directly to a concrete workflow status"
    );
    assert!(
        json.get("outcome").is_none(),
        "fresh entry workflow status should not surface session-entry outcome fields"
    );
    assert!(
        json.get("decision_source").is_none(),
        "fresh entry workflow status should not surface session-entry decision metadata"
    );
    assert!(
        !state.join("session-entry").exists(),
        "fresh entry workflow status should not require or create session-entry state"
    );
}
