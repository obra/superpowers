#[path = "support/featureforge.rs"]
mod featureforge_support;
#[path = "support/process.rs"]
mod process_support;

use std::fs;
use std::path::Path;
use tempfile::TempDir;

use featureforge_support::{run_rust_featureforge, run_rust_featureforge_with_env_control};

fn write_file(path: &Path, contents: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("parent directory should exist");
    }
    fs::write(path, contents).expect("file should be writable");
}

fn file_url(path: &Path) -> String {
    format!("file://{}", path.to_string_lossy())
}

#[test]
fn canonical_update_check_reports_upgrade_and_writes_canonical_state() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = TempDir::new().expect("install tempdir should exist");
    let remote_dir = TempDir::new().expect("remote tempdir should exist");
    write_file(&install_dir.path().join("VERSION"), "1.0.0\n");
    write_file(&remote_dir.path().join("VERSION"), "1.1.0\n");

    let output = run_rust_featureforge(
        None,
        Some(state_dir.path()),
        None,
        &[
            (
                "FEATUREFORGE_DIR",
                install_dir.path().to_string_lossy().as_ref(),
            ),
            (
                "FEATUREFORGE_REMOTE_URL",
                file_url(&remote_dir.path().join("VERSION")).as_str(),
            ),
        ],
        &["update-check"],
        "canonical update-check",
    );
    assert!(
        output.status.success(),
        "update-check should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 1.0.0 1.1.0"
    );
    assert_eq!(
        fs::read_to_string(state_dir.path().join("update-check/last-update-check"))
            .expect("canonical update-check state should exist"),
        "UPGRADE_AVAILABLE 1.0.0 1.1.0\n"
    );
    assert!(
        !state_dir.path().join("last-update-check").exists(),
        "update-check should no longer write state files at the root of FEATUREFORGE_STATE_DIR"
    );
}

#[test]
fn canonical_update_check_uses_userprofile_install_when_home_is_missing() {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let userprofile_dir = TempDir::new().expect("userprofile tempdir should exist");
    let remote_dir = TempDir::new().expect("remote tempdir should exist");
    let install_dir = userprofile_dir.path().join(".featureforge/install");

    write_file(&install_dir.join("VERSION"), "1.0.0\n");
    write_file(&remote_dir.path().join("VERSION"), "1.2.0\n");

    let output = run_rust_featureforge_with_env_control(
        Some(repo_dir.path()),
        Some(state_dir.path()),
        None,
        &["HOME", "FEATUREFORGE_DIR"],
        &[
            (
                "USERPROFILE",
                userprofile_dir.path().to_string_lossy().as_ref(),
            ),
            (
                "FEATUREFORGE_REMOTE_URL",
                file_url(&remote_dir.path().join("VERSION")).as_str(),
            ),
        ],
        &["update-check"],
        "canonical update-check with USERPROFILE fallback",
    );
    assert!(
        output.status.success(),
        "USERPROFILE-backed update-check should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 1.0.0 1.2.0"
    );
}

#[test]
fn install_command_surface_is_removed() {
    let output = run_rust_featureforge(
        None,
        None,
        None,
        &[],
        &["install", "migrate"],
        "removed install command surface",
    );
    assert!(
        !output.status.success(),
        "featureforge install migrate should fail because the install command is removed"
    );
    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        combined.contains("install") && combined.contains("subcommand"),
        "failure output should explain that install is not a supported command, got:\n{combined}"
    );
}
