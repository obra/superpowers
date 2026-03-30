#[path = "support/bin.rs"]
mod bin_support;
#[path = "support/featureforge.rs"]
mod featureforge_support;
#[path = "support/process.rs"]
mod process_support;

use std::fs;
use std::path::Path;
use std::process::Command;
use tempfile::TempDir;

use featureforge_support::{run_rust_featureforge, run_rust_featureforge_with_env_control};
use process_support::run;

fn write_file(path: &Path, contents: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("parent directory should exist");
    }
    fs::write(path, contents).expect("file should be writable");
}

fn file_url(path: &Path) -> String {
    format!("file://{}", path.to_string_lossy())
}

fn make_runtime_root(dir: &Path, version: &str) {
    write_file(&dir.join("VERSION"), &format!("{version}\n"));
    let bin_path = dir.join("bin/featureforge");
    if let Some(parent) = bin_path.parent() {
        fs::create_dir_all(parent).expect("runtime bin dir should exist");
    }
    fs::copy(bin_support::compiled_featureforge_path(), &bin_path)
        .expect("compiled featureforge binary should copy");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&bin_path, fs::Permissions::from_mode(0o755))
            .expect("runtime binary should be executable");
    }
}

#[test]
fn canonical_update_check_reports_upgrade_and_writes_canonical_state() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = TempDir::new().expect("install tempdir should exist");
    let remote_dir = TempDir::new().expect("remote tempdir should exist");
    make_runtime_root(install_dir.path(), "1.0.0");
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

    make_runtime_root(&install_dir, "1.0.0");
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

#[test]
fn canonical_update_check_ignores_version_only_repo_roots() {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let remote_dir = TempDir::new().expect("remote tempdir should exist");

    write_file(&repo_dir.path().join("VERSION"), "1.0.0\n");
    write_file(&remote_dir.path().join("VERSION"), "1.1.0\n");

    let output = run_rust_featureforge_with_env_control(
        Some(repo_dir.path()),
        Some(state_dir.path()),
        None,
        &["FEATUREFORGE_DIR", "HOME", "USERPROFILE"],
        &[(
            "FEATUREFORGE_REMOTE_URL",
            file_url(&remote_dir.path().join("VERSION")).as_str(),
        )],
        &["update-check"],
        "canonical update-check ignores version-only repo roots",
    );
    assert!(
        output.status.success(),
        "version-only repo update-check should degrade safely, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        String::from_utf8_lossy(&output.stdout).trim().is_empty(),
        "version-only repo should not be treated as a valid runtime root"
    );
    assert!(
        !state_dir
            .path()
            .join("update-check/last-update-check")
            .exists(),
        "version-only repo should not write update-check state"
    );
}

#[test]
fn canonical_update_check_accepts_a_valid_repo_local_runtime_root() {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let remote_dir = TempDir::new().expect("remote tempdir should exist");
    let home_dir = TempDir::new().expect("home tempdir should exist");

    make_runtime_root(repo_dir.path(), "1.0.0");
    write_file(&remote_dir.path().join("VERSION"), "1.3.0\n");

    let output = run_rust_featureforge_with_env_control(
        Some(repo_dir.path()),
        Some(state_dir.path()),
        Some(home_dir.path()),
        &["FEATUREFORGE_DIR", "USERPROFILE"],
        &[(
            "FEATUREFORGE_REMOTE_URL",
            file_url(&remote_dir.path().join("VERSION")).as_str(),
        )],
        &["update-check"],
        "canonical update-check repo-local runtime root",
    );
    assert!(
        output.status.success(),
        "repo-local runtime root should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 1.0.0 1.3.0"
    );
}

#[test]
fn canonical_update_check_uses_a_binary_adjacent_runtime_root() {
    let runtime_dir = TempDir::new().expect("runtime tempdir should exist");
    let work_dir = TempDir::new().expect("work tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let remote_dir = TempDir::new().expect("remote tempdir should exist");

    make_runtime_root(runtime_dir.path(), "1.0.0");
    write_file(&remote_dir.path().join("VERSION"), "1.5.0\n");

    let mut command = Command::new(runtime_dir.path().join("bin/featureforge"));
    command
        .current_dir(work_dir.path())
        .env("FEATUREFORGE_STATE_DIR", state_dir.path())
        .env(
            "FEATUREFORGE_REMOTE_URL",
            file_url(&remote_dir.path().join("VERSION")),
        )
        .env_remove("FEATUREFORGE_DIR")
        .env_remove("HOME")
        .env_remove("USERPROFILE")
        .arg("update-check");
    let output = run(
        command,
        "canonical update-check binary-adjacent runtime root",
    );
    assert!(
        output.status.success(),
        "binary-adjacent runtime root should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 1.0.0 1.5.0"
    );
}

#[test]
fn canonical_update_check_rejects_invalid_featureforge_dir_overrides() {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let remote_dir = TempDir::new().expect("remote tempdir should exist");
    let invalid_override = TempDir::new().expect("invalid override tempdir should exist");

    make_runtime_root(repo_dir.path(), "9.9.9");
    write_file(&invalid_override.path().join("VERSION"), "1.0.0\n");
    write_file(&remote_dir.path().join("VERSION"), "1.5.0\n");

    let output = run_rust_featureforge_with_env_control(
        Some(repo_dir.path()),
        Some(state_dir.path()),
        None,
        &["HOME", "USERPROFILE"],
        &[
            (
                "FEATUREFORGE_DIR",
                invalid_override.path().to_string_lossy().as_ref(),
            ),
            (
                "FEATUREFORGE_REMOTE_URL",
                file_url(&remote_dir.path().join("VERSION")).as_str(),
            ),
        ],
        &["update-check"],
        "canonical update-check invalid FEATUREFORGE_DIR override",
    );
    assert!(
        output.status.success(),
        "invalid FEATUREFORGE_DIR override should degrade safely, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        String::from_utf8_lossy(&output.stdout).trim().is_empty(),
        "invalid FEATUREFORGE_DIR override should not emit an upgrade banner"
    );
    assert!(
        !state_dir
            .path()
            .join("update-check/last-update-check")
            .exists(),
        "invalid FEATUREFORGE_DIR override should not write update-check state"
    );
}
