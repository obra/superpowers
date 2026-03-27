#[path = "support/executable.rs"]
mod executable_support;
#[path = "support/featureforge.rs"]
mod featureforge_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;

use serde_json::Value;
use std::fs;
use tempfile::TempDir;

use executable_support::make_executable;
use featureforge_support::{run_rust_featureforge, run_rust_featureforge_with_env_control};
use json_support::parse_json;
use process_support::repo_root;

fn parse_failure_json(output: &std::process::Output, context: &str) -> Value {
    assert!(
        !output.status.success(),
        "{context} should fail, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stderr)
        .unwrap_or_else(|error| panic!("{context} should emit valid json failure output: {error}"))
}

#[test]
fn runtime_root_helper_resolves_the_repo_local_runtime() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let repo = repo_root();

    let output = run_rust_featureforge_with_env_control(
        Some(repo.as_path()),
        Some(state_dir.path()),
        Some(home_dir.path()),
        &["FEATUREFORGE_DIR", "USERPROFILE"],
        &[],
        &["repo", "runtime-root", "--json"],
        "repo runtime-root repo-local success",
    );
    let json = parse_json(&output, "repo runtime-root repo-local success");

    assert_eq!(json["resolved"], Value::Bool(true));
    assert_eq!(
        json["root"],
        Value::String(repo.to_string_lossy().into_owned())
    );
    assert_eq!(json["source"], Value::String(String::from("repo_local")));
    assert_eq!(json["validation"]["has_version"], Value::Bool(true));
    assert_eq!(json["validation"]["has_binary"], Value::Bool(true));
    assert!(
        json["validation"]["upgrade_eligible"].is_boolean(),
        "runtime-root helper should expose upgrade_eligible as a boolean"
    );
}

#[test]
fn runtime_root_path_helper_resolves_the_repo_local_runtime_without_json_parsing() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let repo = repo_root();

    let output = run_rust_featureforge_with_env_control(
        Some(repo.as_path()),
        Some(state_dir.path()),
        Some(home_dir.path()),
        &["FEATUREFORGE_DIR", "USERPROFILE"],
        &[],
        &["repo", "runtime-root", "--path"],
        "repo runtime-root path repo-local success",
    );

    assert!(
        output.status.success(),
        "repo runtime-root --path should succeed\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim_end(),
        repo.to_string_lossy(),
        "repo runtime-root --path should print the resolved root directly"
    );
}

#[test]
fn runtime_root_field_helper_reports_upgrade_eligibility_without_json_parsing() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let repo = repo_root();

    let output = run_rust_featureforge_with_env_control(
        Some(repo.as_path()),
        Some(state_dir.path()),
        Some(home_dir.path()),
        &["FEATUREFORGE_DIR", "USERPROFILE"],
        &[],
        &["repo", "runtime-root", "--field", "upgrade-eligible"],
        "repo runtime-root field repo-local success",
    );

    assert!(
        output.status.success(),
        "repo runtime-root --field upgrade-eligible should succeed\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim_end(),
        "true",
        "repo runtime-root --field upgrade-eligible should print a shell-safe boolean"
    );
}

#[test]
fn runtime_root_helper_reports_unresolved_without_guessing() {
    let outside_repo = TempDir::new().expect("outside repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");

    let output = run_rust_featureforge_with_env_control(
        Some(outside_repo.path()),
        Some(state_dir.path()),
        None,
        &["FEATUREFORGE_DIR", "HOME", "USERPROFILE"],
        &[],
        &["repo", "runtime-root", "--json"],
        "repo runtime-root unresolved",
    );
    let json = parse_json(&output, "repo runtime-root unresolved");

    assert_eq!(json["resolved"], Value::Bool(false));
    assert!(
        json["root"].is_null(),
        "unresolved helper root should be null"
    );
    assert!(
        json["source"].is_string(),
        "unresolved helper should still report a source string"
    );
    assert!(
        json["validation"]["has_version"].is_boolean(),
        "unresolved helper should expose has_version as a boolean"
    );
    assert!(
        json["validation"]["has_binary"].is_boolean(),
        "unresolved helper should expose has_binary as a boolean"
    );
}

#[test]
fn runtime_root_field_helper_reports_unresolved_with_empty_stdout() {
    let outside_repo = TempDir::new().expect("outside repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");

    let output = run_rust_featureforge_with_env_control(
        Some(outside_repo.path()),
        Some(state_dir.path()),
        None,
        &["FEATUREFORGE_DIR", "HOME", "USERPROFILE"],
        &[],
        &["repo", "runtime-root", "--field", "upgrade-eligible"],
        "repo runtime-root field unresolved",
    );

    assert!(
        output.status.success(),
        "unresolved repo runtime-root --field upgrade-eligible should exit successfully\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        String::from_utf8_lossy(&output.stdout).trim().is_empty(),
        "unresolved repo runtime-root --field upgrade-eligible should print no value"
    );
}

#[test]
fn runtime_root_path_helper_reports_unresolved_with_empty_stdout() {
    let outside_repo = TempDir::new().expect("outside repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");

    let output = run_rust_featureforge_with_env_control(
        Some(outside_repo.path()),
        Some(state_dir.path()),
        None,
        &["FEATUREFORGE_DIR", "HOME", "USERPROFILE"],
        &[],
        &["repo", "runtime-root", "--path"],
        "repo runtime-root path unresolved",
    );

    assert!(
        output.status.success(),
        "unresolved repo runtime-root --path should exit successfully\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        String::from_utf8_lossy(&output.stdout).trim().is_empty(),
        "unresolved repo runtime-root --path should print no path"
    );
}

#[test]
fn runtime_root_field_helper_reports_non_upgrade_eligible_valid_roots() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let non_git_root = TempDir::new().expect("non-git runtime root should exist");
    fs::create_dir_all(non_git_root.path().join("bin"))
        .expect("non-git runtime bin dir should exist");
    fs::write(non_git_root.path().join("VERSION"), "1.0.0\n")
        .expect("non-git runtime version should exist");
    fs::write(non_git_root.path().join("bin/featureforge"), "")
        .expect("non-git runtime binary should exist");
    make_executable(&non_git_root.path().join("bin/featureforge"));

    let output = run_rust_featureforge(
        None,
        Some(state_dir.path()),
        Some(home_dir.path()),
        &[(
            "FEATUREFORGE_DIR",
            non_git_root.path().to_string_lossy().as_ref(),
        )],
        &["repo", "runtime-root", "--field", "upgrade-eligible"],
        "repo runtime-root field explicit non-git root",
    );

    assert!(
        output.status.success(),
        "explicit non-git runtime-root field lookup should succeed\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim_end(),
        "false",
        "runtime-root field lookup should expose non-upgrade-eligible roots as false"
    );
}

#[test]
fn runtime_root_helper_rejects_invalid_featureforge_dir_without_fallback() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let invalid_dir = TempDir::new().expect("invalid runtime tempdir should exist");
    let repo = repo_root();

    let output = run_rust_featureforge(
        Some(repo.as_path()),
        Some(state_dir.path()),
        Some(home_dir.path()),
        &[(
            "FEATUREFORGE_DIR",
            invalid_dir.path().to_string_lossy().as_ref(),
        )],
        &["repo", "runtime-root", "--json"],
        "repo runtime-root invalid env",
    );
    let json = parse_failure_json(&output, "repo runtime-root invalid env");

    assert_eq!(
        json["error_class"],
        Value::String(String::from("ResolverContractViolation"))
    );
    let message = json["message"]
        .as_str()
        .expect("failure message should be a string");
    assert!(
        message.contains("FEATUREFORGE_DIR"),
        "failure output should name FEATUREFORGE_DIR, got: {message}"
    );
}

#[test]
fn runtime_root_helper_reports_featureforge_dir_env_as_a_bounded_source() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let outside_repo = TempDir::new().expect("outside repo tempdir should exist");
    let explicit_root = TempDir::new().expect("explicit runtime root should exist");

    fs::create_dir_all(explicit_root.path().join("bin"))
        .expect("explicit runtime root bin dir should exist");
    fs::write(explicit_root.path().join("VERSION"), "1.0.0\n")
        .expect("explicit runtime version should exist");
    fs::write(explicit_root.path().join("bin/featureforge"), "")
        .expect("explicit runtime binary should exist");
    make_executable(&explicit_root.path().join("bin/featureforge"));

    let output = run_rust_featureforge_with_env_control(
        Some(outside_repo.path()),
        Some(state_dir.path()),
        Some(home_dir.path()),
        &["USERPROFILE"],
        &[(
            "FEATUREFORGE_DIR",
            explicit_root
                .path()
                .to_str()
                .expect("explicit root should be utf8"),
        )],
        &["repo", "runtime-root", "--json"],
        "repo runtime-root explicit featureforge_dir env success",
    );
    let json = parse_json(
        &output,
        "repo runtime-root explicit featureforge_dir env success",
    );

    assert_eq!(json["resolved"], Value::Bool(true));
    assert_eq!(
        json["root"],
        Value::String(explicit_root.path().to_string_lossy().into_owned())
    );
    assert_eq!(
        json["source"],
        Value::String(String::from("featureforge_dir_env"))
    );
    assert_eq!(json["validation"]["has_version"], Value::Bool(true));
    assert_eq!(json["validation"]["has_binary"], Value::Bool(true));
}

#[test]
fn runtime_root_path_helper_rejects_invalid_featureforge_dir_without_fallback() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let invalid_dir = TempDir::new().expect("invalid runtime tempdir should exist");
    let repo = repo_root();

    let output = run_rust_featureforge(
        Some(repo.as_path()),
        Some(state_dir.path()),
        Some(home_dir.path()),
        &[(
            "FEATUREFORGE_DIR",
            invalid_dir.path().to_string_lossy().as_ref(),
        )],
        &["repo", "runtime-root", "--path"],
        "repo runtime-root path invalid env",
    );

    assert!(
        !output.status.success(),
        "invalid FEATUREFORGE_DIR should fail for --path\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("ResolverContractViolation"),
        "path failure output should name the failure class, got: {stderr}"
    );
    assert!(
        stderr.contains("FEATUREFORGE_DIR"),
        "path failure output should name FEATUREFORGE_DIR, got: {stderr}"
    );
}
