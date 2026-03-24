#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/prebuilt.rs"]
mod prebuilt_support;
#[path = "support/process.rs"]
mod process_support;
#[path = "support/superpowers.rs"]
mod superpowers_support;

use serde_json::Value;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

use files_support::write_file;
use json_support::parse_json;
use prebuilt_support::{
    PrebuiltManifestEntry, sha256_checksum_line, write_prebuilt_artifact, write_prebuilt_manifest,
};
use process_support::{repo_root, run, run_checked};
use sha2::{Digest, Sha256};
use superpowers_support::{run_rust_superpowers, run_rust_superpowers_with_env_control};

fn update_check_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-update-check")
}

fn repo_safety_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-repo-safety")
}

fn migrate_install_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-migrate-install")
}

fn run_shell_update_check(
    state_dir: &Path,
    install_dir: &Path,
    remote_url: &str,
    args: &[&str],
    context: &str,
) -> Output {
    let mut command = Command::new(update_check_helper_path());
    command
        .env("SUPERPOWERS_STATE_DIR", state_dir)
        .env("SUPERPOWERS_DIR", install_dir)
        .env("SUPERPOWERS_REMOTE_URL", remote_url)
        .args(args);
    run(command, context)
}

fn run_shell_migrate_install(
    home_dir: &Path,
    shared_root: &Path,
    codex_root: &Path,
    copilot_root: &Path,
    source_repo: &Path,
    host_target: &str,
    context: &str,
) -> Output {
    let mut command = Command::new(migrate_install_helper_path());
    command
        .env("HOME", home_dir)
        .env("SUPERPOWERS_STATE_DIR", home_dir.join(".superpowers"))
        .env("SUPERPOWERS_SHARED_ROOT", shared_root)
        .env("SUPERPOWERS_CODEX_ROOT", codex_root)
        .env("SUPERPOWERS_COPILOT_ROOT", copilot_root)
        .env("SUPERPOWERS_REPO_URL", source_repo)
        .env("SUPERPOWERS_HOST_TARGET", host_target)
        .env("SUPERPOWERS_MIGRATE_STAMP", "20260323-140000");
    run(command, context)
}

fn init_repo(name: &str, branch: &str, remote_url: &str) -> (TempDir, TempDir) {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let repo = repo_dir.path();

    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(repo);
    run_checked(git_init, "git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(repo);
    run_checked(git_config_name, "git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
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

fn current_user_name() -> String {
    env::var("USER")
        .or_else(|_| env::var("USERNAME"))
        .unwrap_or_else(|_| String::from("user"))
}

fn repo_slug_from_remote(remote_url: &str) -> String {
    remote_url
        .trim_end_matches(".git")
        .rsplit('/')
        .take(2)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect::<Vec<_>>()
        .join("-")
}

fn task_hash(stage: &str, task_id: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(stage.as_bytes());
    hasher.update(b"\n");
    hasher.update(task_id.as_bytes());
    format!("{:x}", hasher.finalize())[..16].to_owned()
}

fn canonical_approval_path(
    state_dir: &Path,
    remote_url: &str,
    branch: &str,
    stage: &str,
    task_id: &str,
) -> PathBuf {
    state_dir
        .join("repo-safety")
        .join("approvals")
        .join(repo_slug_from_remote(remote_url))
        .join(format!("{}-{}", current_user_name(), branch))
        .join(format!("{}.json", task_hash(stage, task_id)))
}

fn legacy_approval_path(
    state_dir: &Path,
    remote_url: &str,
    branch: &str,
    stage: &str,
    task_id: &str,
) -> PathBuf {
    state_dir
        .join("projects")
        .join(repo_slug_from_remote(remote_url))
        .join(format!("{}-{}-repo-safety", current_user_name(), branch))
        .join(format!("{}.json", task_hash(stage, task_id)))
}

fn path_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn update_check_state_path(state_dir: &Path, file_name: &str) -> PathBuf {
    state_dir.join("update-check").join(file_name)
}

fn run_update_check_command(
    state_dir: &Path,
    install_dir: &Path,
    remote_url: &str,
    args: &[&str],
    context: &str,
) -> Output {
    let install_dir = path_string(install_dir);
    run_rust_superpowers(
        None,
        Some(state_dir),
        None,
        &[
            ("SUPERPOWERS_DIR", install_dir.as_str()),
            ("SUPERPOWERS_REMOTE_URL", remote_url),
        ],
        &["update-check"]
            .iter()
            .copied()
            .chain(args.iter().copied())
            .collect::<Vec<_>>(),
        context,
    )
}

fn run_install_migrate_command(
    home_dir: &Path,
    state_dir: &Path,
    shared_root: &Path,
    codex_root: &Path,
    copilot_root: &Path,
    source_repo: &Path,
    host_target: &str,
    context: &str,
) -> Output {
    let shared_root = path_string(shared_root);
    let codex_root = path_string(codex_root);
    let copilot_root = path_string(copilot_root);
    let source_repo = path_string(source_repo);
    run_rust_superpowers(
        None,
        Some(state_dir),
        Some(home_dir),
        &[
            ("SUPERPOWERS_SHARED_ROOT", shared_root.as_str()),
            ("SUPERPOWERS_CODEX_ROOT", codex_root.as_str()),
            ("SUPERPOWERS_COPILOT_ROOT", copilot_root.as_str()),
            ("SUPERPOWERS_REPO_URL", source_repo.as_str()),
            ("SUPERPOWERS_HOST_TARGET", host_target),
            ("SUPERPOWERS_MIGRATE_STAMP", "20260323-140000"),
        ],
        &["install", "migrate"],
        context,
    )
}

fn assert_ready_install(path: &Path) {
    assert!(
        path.join("bin/superpowers").is_file(),
        "expected {} to contain bin/superpowers",
        path.display()
    );
    assert!(
        path.join("bin/superpowers-update-check").is_file(),
        "expected {} to contain bin/superpowers-update-check",
        path.display()
    );
    assert!(
        path.join("bin/superpowers-config").is_file(),
        "expected {} to contain bin/superpowers-config",
        path.display()
    );
    assert!(
        path.join("agents/code-reviewer.md").is_file(),
        "expected {} to contain agents/code-reviewer.md",
        path.display()
    );
    assert!(
        path.join(".codex/agents/code-reviewer.toml").is_file(),
        "expected {} to contain .codex/agents/code-reviewer.toml",
        path.display()
    );
    assert!(
        path.join("VERSION").is_file(),
        "expected {} to contain VERSION",
        path.display()
    );
    assert!(
        gix::discover(path).is_ok(),
        "expected {} to be a git repository",
        path.display()
    );
}

fn assert_link_target(link_path: &Path, target_path: &Path) {
    let linked = fs::read_link(link_path)
        .unwrap_or_else(|error| panic!("expected {} to be a link: {error}", link_path.display()));
    let resolved_link = fs::canonicalize(link_path)
        .unwrap_or_else(|error| panic!("expected {} to resolve: {error}", link_path.display()));
    let resolved_target = fs::canonicalize(target_path)
        .unwrap_or_else(|error| panic!("expected {} to resolve: {error}", target_path.display()));
    assert_eq!(
        resolved_link,
        resolved_target,
        "expected {} to point at {}, got {:?} (raw link target: {})",
        link_path.display(),
        target_path.display(),
        resolved_link,
        linked.display()
    );
}

fn assert_backup_exists(parent: &Path, prefix: &str) {
    let count = fs::read_dir(parent)
        .unwrap_or_else(|error| panic!("expected {} to be readable: {error}", parent.display()))
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.file_name().to_string_lossy().starts_with(prefix))
        .count();
    assert!(
        count > 0,
        "expected at least one backup matching {prefix}* under {}",
        parent.display()
    );
}

fn prepare_install_dir(version: &str) -> TempDir {
    let install_dir = TempDir::new().expect("install tempdir should exist");
    let bin_dir = install_dir.path().join("bin");
    fs::create_dir_all(&bin_dir).expect("bin dir should exist");
    #[cfg(unix)]
    std::os::unix::fs::symlink(
        repo_root().join("bin/superpowers-config"),
        bin_dir.join("superpowers-config"),
    )
    .expect("config helper symlink should be creatable");
    #[cfg(not(unix))]
    fs::copy(
        repo_root().join("bin/superpowers-config"),
        bin_dir.join("superpowers-config"),
    )
    .expect("config helper should copy on non-unix hosts");
    write_file(&install_dir.path().join("VERSION"), &format!("{version}\n"));
    install_dir
}

fn create_source_install_repo(dir: &Path) {
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(dir);
    run_checked(git_init, "source git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(dir);
    run_checked(git_config_name, "source git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
        .current_dir(dir);
    run_checked(git_config_email, "source git config user.email");

    write_file(
        &dir.join("bin/superpowers-update-check"),
        "#!/usr/bin/env bash\nexit 0\n",
    );
    write_file(
        &dir.join("bin/superpowers-config"),
        "#!/usr/bin/env bash\nexit 0\n",
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            dir.join("bin/superpowers-update-check"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("update-check helper should be executable");
        fs::set_permissions(
            dir.join("bin/superpowers-config"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("config helper should be executable");
    }
    write_file(&dir.join("agents/code-reviewer.md"), "# reviewer\n");
    write_file(
        &dir.join(".codex/agents/code-reviewer.toml"),
        "name = \"code-reviewer\"\ndescription = \"reviewer\"\ndeveloper_instructions = \"\"\"review\"\"\"",
    );
    write_file(&dir.join("VERSION"), "1.0.0\n");

    let mut git_add = Command::new("git");
    git_add
        .args([
            "add",
            "VERSION",
            "bin/superpowers-update-check",
            "bin/superpowers-config",
            "agents/code-reviewer.md",
            ".codex/agents/code-reviewer.toml",
        ])
        .current_dir(dir);
    run_checked(git_add, "source git add");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", "init"]).current_dir(dir);
    run_checked(git_commit, "source git commit");
}

fn write_prebuilt_runtime_fixture(
    source_repo: &Path,
    targets: &[(&str, &str, &str)],
    runtime_revision: &str,
) {
    let mut manifest_entries = Vec::new();
    for (target, binary_name, contents) in targets {
        let binary_rel = format!("bin/prebuilt/{target}/{binary_name}");
        let checksum_rel = format!("bin/prebuilt/{target}/{binary_name}.sha256");
        let checksum = sha256_checksum_line(binary_name, contents);
        write_prebuilt_artifact(source_repo, &binary_rel, &checksum_rel, contents, &checksum);
        manifest_entries.push((target.to_string(), binary_rel, checksum_rel));
    }

    let manifest_refs = manifest_entries
        .iter()
        .map(
            |(target, binary_path, checksum_path)| PrebuiltManifestEntry {
                target,
                binary_path,
                checksum_path,
            },
        )
        .collect::<Vec<_>>();
    write_prebuilt_manifest(source_repo, runtime_revision, &manifest_refs);
}

fn make_legacy_install(dir: &Path, version: &str) {
    fs::create_dir_all(dir).expect("legacy install dir should exist");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(dir);
    run_checked(git_init, "legacy install git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(dir);
    run_checked(git_config_name, "legacy install git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
        .current_dir(dir);
    run_checked(git_config_email, "legacy install git config user.email");

    write_file(
        &dir.join("bin/superpowers-update-check"),
        "#!/usr/bin/env bash\nexit 0\n",
    );
    write_file(
        &dir.join("bin/superpowers-config"),
        "#!/usr/bin/env bash\nexit 0\n",
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            dir.join("bin/superpowers-update-check"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("legacy update-check helper should be executable");
        fs::set_permissions(
            dir.join("bin/superpowers-config"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("legacy config helper should be executable");
    }
    write_file(&dir.join("agents/code-reviewer.md"), "# reviewer\n");
    write_file(
        &dir.join(".codex/agents/code-reviewer.toml"),
        "name = \"code-reviewer\"\ndescription = \"reviewer\"\ndeveloper_instructions = \"\"\"review\"\"\"",
    );
    write_file(&dir.join("VERSION"), &format!("{version}\n"));

    let mut git_add = Command::new("git");
    git_add
        .args([
            "add",
            "VERSION",
            "bin/superpowers-update-check",
            "bin/superpowers-config",
            "agents/code-reviewer.md",
            ".codex/agents/code-reviewer.toml",
        ])
        .current_dir(dir);
    run_checked(git_add, "legacy install git add");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", "init"]).current_dir(dir);
    run_checked(git_commit, "legacy install git commit");
}

fn make_install_repo(dir: &Path, version: &str, commit_ts: Option<&str>) {
    fs::create_dir_all(dir).expect("install repo dir should exist");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(dir);
    run_checked(git_init, "install repo git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(dir);
    run_checked(git_config_name, "install repo git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
        .current_dir(dir);
    run_checked(git_config_email, "install repo git config user.email");

    mkdir_dir(dir.join("bin"));
    mkdir_dir(dir.join("agents"));
    mkdir_dir(dir.join(".codex/agents"));
    write_file(&dir.join("bin/superpowers-update-check"), "");
    write_file(&dir.join("bin/superpowers-config"), "");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            dir.join("bin/superpowers-update-check"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("install repo update-check helper should be executable");
        fs::set_permissions(
            dir.join("bin/superpowers-config"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("install repo config helper should be executable");
    }
    write_file(&dir.join("agents/code-reviewer.md"), "# reviewer\n");
    write_file(
        &dir.join(".codex/agents/code-reviewer.toml"),
        "name = \"code-reviewer\"\ndescription = \"reviewer\"\ndeveloper_instructions = \"\"\"review\"\"\"",
    );
    write_file(&dir.join("VERSION"), &format!("{version}\n"));

    let mut git_add = Command::new("git");
    git_add
        .args([
            "add",
            "VERSION",
            "bin/superpowers-update-check",
            "bin/superpowers-config",
            "agents/code-reviewer.md",
            ".codex/agents/code-reviewer.toml",
        ])
        .current_dir(dir);
    run_checked(git_add, "install repo git add");

    let mut git_commit = Command::new("git");
    git_commit
        .args(["commit", "-m", &format!("init-{version}")])
        .current_dir(dir);
    if let Some(commit_ts) = commit_ts {
        git_commit.env("GIT_AUTHOR_DATE", format!("@{commit_ts}"));
        git_commit.env("GIT_COMMITTER_DATE", format!("@{commit_ts}"));
    }
    run_checked(git_commit, "install repo git commit");
}

fn mkdir_dir(path: PathBuf) {
    fs::create_dir_all(&path).expect("directory should be creatable");
}

fn make_legacy_install_without_config(dir: &Path, version: &str) {
    fs::create_dir_all(dir).expect("legacy install dir should exist");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(dir);
    run_checked(git_init, "legacy install without config git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(dir);
    run_checked(
        git_config_name,
        "legacy install without config git config user.name",
    );

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
        .current_dir(dir);
    run_checked(
        git_config_email,
        "legacy install without config git config user.email",
    );

    mkdir_dir(dir.join("bin"));
    write_file(&dir.join("bin/superpowers-update-check"), "");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            dir.join("bin/superpowers-update-check"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("legacy update-check helper should be executable");
    }
    write_file(&dir.join("VERSION"), &format!("{version}\n"));

    let mut git_add = Command::new("git");
    git_add
        .args(["add", "VERSION", "bin/superpowers-update-check"])
        .current_dir(dir);
    run_checked(git_add, "legacy install without config git add");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", "init"]).current_dir(dir);
    run_checked(git_commit, "legacy install without config git commit");
}

fn make_legacy_install_without_reviewers(dir: &Path, version: &str) {
    fs::create_dir_all(dir).expect("legacy install dir should exist");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(dir);
    run_checked(git_init, "legacy install without reviewers git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(dir);
    run_checked(
        git_config_name,
        "legacy install without reviewers git config user.name",
    );

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
        .current_dir(dir);
    run_checked(
        git_config_email,
        "legacy install without reviewers git config user.email",
    );

    mkdir_dir(dir.join("bin"));
    write_file(&dir.join("bin/superpowers-update-check"), "");
    write_file(&dir.join("bin/superpowers-config"), "");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            dir.join("bin/superpowers-update-check"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("legacy update-check helper should be executable");
        fs::set_permissions(
            dir.join("bin/superpowers-config"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("legacy config helper should be executable");
    }
    write_file(&dir.join("VERSION"), &format!("{version}\n"));

    let mut git_add = Command::new("git");
    git_add
        .args([
            "add",
            "VERSION",
            "bin/superpowers-update-check",
            "bin/superpowers-config",
        ])
        .current_dir(dir);
    run_checked(git_add, "legacy install without reviewers git add");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", "init"]).current_dir(dir);
    run_checked(git_commit, "legacy install without reviewers git commit");
}

#[test]
fn canonical_update_check_preserves_status_line_and_writes_canonical_state() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    let remote_version_path = remote_file.path().join("VERSION");
    write_file(&remote_version_path, "5.2.0\n");
    let remote_url = format!("file://{}", remote_version_path.display());

    let helper_output = run_shell_update_check(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &[],
        "helper update-check",
    );
    assert_eq!(
        String::from_utf8_lossy(&helper_output.stdout).trim(),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0"
    );

    let rust_output = run_rust_superpowers(
        None,
        Some(state_dir.path()),
        None,
        &[
            (
                "SUPERPOWERS_DIR",
                install_dir.path().to_string_lossy().as_ref(),
            ),
            ("SUPERPOWERS_REMOTE_URL", &remote_url),
        ],
        &["update-check"],
        "canonical update-check",
    );
    assert!(
        rust_output.status.success(),
        "canonical update-check should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        rust_output.status,
        String::from_utf8_lossy(&rust_output.stdout),
        String::from_utf8_lossy(&rust_output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&rust_output.stdout).trim(),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0"
    );

    let canonical_cache = state_dir.path().join("update-check/last-update-check");
    assert_eq!(
        fs::read_to_string(&canonical_cache).expect("canonical update cache should exist"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n"
    );
    assert!(
        !state_dir.path().join("last-update-check").exists(),
        "canonical update-check should not keep writing the legacy root cache path"
    );
}

#[test]
fn canonical_update_check_uses_userprofile_install_when_home_is_missing() {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let userprofile_dir = TempDir::new().expect("userprofile tempdir should exist");
    let install_dir = userprofile_dir.path().join(".superpowers").join("install");
    fs::create_dir_all(&install_dir).expect("install dir should exist");
    write_file(
        &install_dir.join("VERSION"),
        concat!(env!("CARGO_PKG_VERSION"), "\n"),
    );

    let remote_version = userprofile_dir.path().join("remote-version.txt");
    write_file(&remote_version, concat!(env!("CARGO_PKG_VERSION"), "\n"));
    let remote_url = format!(
        "file://{}",
        remote_version
            .to_str()
            .expect("remote version path should be utf8")
    );

    let output = run_rust_superpowers_with_env_control(
        Some(repo_dir.path()),
        None,
        None,
        &["HOME", "SUPERPOWERS_STATE_DIR", "SUPERPOWERS_DIR"],
        &[
            (
                "USERPROFILE",
                userprofile_dir
                    .path()
                    .to_str()
                    .expect("userprofile path should be utf8"),
            ),
            ("SUPERPOWERS_REMOTE_URL", &remote_url),
        ],
        &["update-check"],
        "canonical update-check with USERPROFILE fallback",
    );

    assert!(
        output.status.success(),
        "canonical update-check with USERPROFILE fallback should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        userprofile_dir
            .path()
            .join(".superpowers")
            .join("update-check")
            .join("last-update-check")
            .is_file(),
        "update-check should write canonical state beneath USERPROFILE when HOME is missing"
    );
}

#[test]
fn update_check_force_bypasses_cached_up_to_date_result() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    write_file(&remote_file.path().join("VERSION"), "5.2.0\n");
    let remote_url = format!("file://{}", remote_file.path().join("VERSION").display());
    write_file(
        &update_check_state_path(state_dir.path(), "last-update-check"),
        "UP_TO_DATE 5.1.0\n",
    );

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &["--force"],
        "update-check --force against cached up-to-date result",
    );

    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0"
    );
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("cached update-check should be written"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n"
    );
}

#[test]
fn update_check_compares_versions_numerically() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.2");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    write_file(&remote_file.path().join("VERSION"), "5.1.10\n");
    let remote_url = format!("file://{}", remote_file.path().join("VERSION").display());

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &[],
        "update-check with multi-digit semver comparison",
    );

    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 5.1.2 5.1.10"
    );
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("upgrade cache should be written"),
        "UPGRADE_AVAILABLE 5.1.2 5.1.10\n"
    );
}

#[test]
fn update_check_reuses_fresh_upgrade_cache() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    write_file(&remote_file.path().join("VERSION"), "5.0.0\n");
    let remote_url = format!("file://{}", remote_file.path().join("VERSION").display());
    write_file(
        &update_check_state_path(state_dir.path(), "last-update-check"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n",
    );

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &[],
        "update-check with fresh upgrade cache",
    );

    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0"
    );
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("upgrade cache should remain canonical"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n"
    );
}

#[test]
fn update_check_force_bypasses_cached_upgrade_available_result() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    write_file(&remote_file.path().join("VERSION"), "5.0.0\n");
    let remote_url = format!("file://{}", remote_file.path().join("VERSION").display());
    write_file(
        &update_check_state_path(state_dir.path(), "last-update-check"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n",
    );

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &["--force"],
        "update-check --force against cached upgrade result",
    );

    assert!(String::from_utf8_lossy(&output.stdout).trim().is_empty());
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("forced update-check should rewrite cache"),
        "UP_TO_DATE 5.1.0\n"
    );
}

#[test]
fn update_check_local_ahead_stays_quiet_and_reuses_up_to_date_cache() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.2.0");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    write_file(&remote_file.path().join("VERSION"), "5.1.9\n");
    let remote_url = format!("file://{}", remote_file.path().join("VERSION").display());

    let first = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &[],
        "update-check with local ahead of remote",
    );
    assert!(String::from_utf8_lossy(&first.stdout).trim().is_empty());
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("up-to-date cache should be written"),
        "UP_TO_DATE 5.2.0\n"
    );

    let second = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &[],
        "update-check with cached local-ahead result",
    );
    assert!(String::from_utf8_lossy(&second.stdout).trim().is_empty());
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("up-to-date cache should remain canonical"),
        "UP_TO_DATE 5.2.0\n"
    );
}

#[test]
fn update_check_reports_just_upgraded_and_clears_marker_state() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    write_file(
        &update_check_state_path(state_dir.path(), "just-upgraded-from"),
        "5.0.0\n",
    );
    write_file(
        &update_check_state_path(state_dir.path(), "update-snoozed"),
        "5.1.0 1 1\n",
    );

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        "file:///does/not/matter",
        &[],
        "update-check with just-upgraded marker",
    );

    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "JUST_UPGRADED 5.0.0 5.1.0"
    );
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("just-upgraded should write the canonical cache"),
        "UP_TO_DATE 5.1.0\n"
    );
    assert!(
        !update_check_state_path(state_dir.path(), "just-upgraded-from").exists(),
        "just-upgraded marker should be cleared"
    );
    assert!(
        !update_check_state_path(state_dir.path(), "update-snoozed").exists(),
        "just-upgraded should clear snooze state"
    );
}

#[test]
fn update_check_stays_quiet_when_remote_lookup_fails_without_cache() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        "file:///does/not/exist",
        &[],
        "update-check with missing remote and empty cache",
    );

    assert!(String::from_utf8_lossy(&output.stdout).trim().is_empty());
    assert!(
        !update_check_state_path(state_dir.path(), "last-update-check").exists(),
        "no cache should be written when remote lookup fails with no cache"
    );
}

#[test]
fn update_check_preserves_fresh_upgrade_cache_when_remote_lookup_fails() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    write_file(
        &update_check_state_path(state_dir.path(), "last-update-check"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n",
    );

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        "file:///does/not/exist",
        &[],
        "update-check with missing remote and sticky upgrade cache",
    );

    assert_eq!(
        String::from_utf8_lossy(&output.stdout).trim(),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0"
    );
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("fresh upgrade cache should remain canonical"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n"
    );
}

#[test]
fn update_check_can_be_disabled_via_canonical_config() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    write_file(&remote_file.path().join("VERSION"), "5.2.0\n");
    let remote_url = format!("file://{}", remote_file.path().join("VERSION").display());
    write_file(
        &state_dir.path().join("config/config.yaml"),
        "update_check: false\n",
    );

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &[],
        "update-check disabled by canonical config",
    );

    assert!(String::from_utf8_lossy(&output.stdout).trim().is_empty());
    assert!(
        !update_check_state_path(state_dir.path(), "last-update-check").exists(),
        "disabled update-check should not write cache state"
    );
}

#[test]
fn update_check_respects_snooze_window() {
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let install_dir = prepare_install_dir("5.1.0");
    let remote_file = TempDir::new().expect("remote tempdir should exist");
    write_file(&remote_file.path().join("VERSION"), "5.2.0\n");
    let remote_url = format!("file://{}", remote_file.path().join("VERSION").display());
    let now = std::time::SystemTime::now()
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .expect("current time should be available")
        .as_secs();
    write_file(
        &update_check_state_path(state_dir.path(), "update-snoozed"),
        &format!("5.2.0 1 {now}\n"),
    );

    let output = run_update_check_command(
        state_dir.path(),
        install_dir.path(),
        &remote_url,
        &[],
        "update-check with active snooze",
    );

    assert!(String::from_utf8_lossy(&output.stdout).trim().is_empty());
    assert_eq!(
        fs::read_to_string(update_check_state_path(
            state_dir.path(),
            "last-update-check"
        ))
        .expect("snoozed upgrade should still write the canonical cache"),
        "UPGRADE_AVAILABLE 5.1.0 5.2.0\n"
    );
}

#[test]
fn pending_non_rebuildable_state_blocks_mutations_but_allows_read_only_inspection() {
    let remote_url = "https://example.com/acme/pending-migration.git";
    let (repo_dir, state_dir) = init_repo("pending-migration", "main", remote_url);
    let repo = repo_dir.path();
    let state = state_dir.path();
    write_file(&state.join("config.yaml"), "update_check: false\n");

    let config_get = run_rust_superpowers(
        None,
        Some(state),
        None,
        &[],
        &["config", "get", "update_check"],
        "config get with pending migration",
    );
    assert!(
        config_get.status.success(),
        "config get should remain readable during pending migration, got {:?}\nstdout:\n{}\nstderr:\n{}",
        config_get.status,
        String::from_utf8_lossy(&config_get.stdout),
        String::from_utf8_lossy(&config_get.stderr)
    );
    assert_eq!(String::from_utf8_lossy(&config_get.stdout).trim(), "false");
    assert!(
        String::from_utf8_lossy(&config_get.stderr).contains("PendingMigration"),
        "config get should emit an explicit pending-migration warning on stderr"
    );

    let config_set = run_rust_superpowers(
        None,
        Some(state),
        None,
        &[],
        &["config", "set", "update_check", "true"],
        "config set with pending migration",
    );
    assert!(
        !config_set.status.success(),
        "config set should fail closed until install migrate runs"
    );
    assert!(
        String::from_utf8_lossy(&config_set.stderr).contains("PendingMigration"),
        "config set failure should direct the user to install migrate"
    );

    let helper_approve = {
        let mut command = Command::new(repo_safety_helper_path());
        command
            .current_dir(repo)
            .env("SUPERPOWERS_STATE_DIR", state)
            .args([
                "approve",
                "--stage",
                "superpowers:executing-plans",
                "--task-id",
                "task-7",
                "--reason",
                "User explicitly approved this write.",
                "--path",
                "docs/superpowers/specs/example.md",
                "--write-target",
                "execution-task-slice",
            ]);
        run(command, "helper repo-safety approve for pending migration")
    };
    let helper_json = parse_json(
        &helper_approve,
        "helper repo-safety approve for pending migration",
    );
    assert!(
        helper_json["outcome"].as_str().is_some(),
        "helper repo-safety approve should emit an outcome field"
    );
    let canonical_path = canonical_approval_path(
        state,
        remote_url,
        "main",
        "superpowers:executing-plans",
        "task-7",
    );
    let legacy_path = legacy_approval_path(
        state,
        remote_url,
        "main",
        "superpowers:executing-plans",
        "task-7",
    );
    if let Some(parent) = legacy_path.parent() {
        fs::create_dir_all(parent).expect("legacy approval parent should exist");
    }
    fs::copy(&canonical_path, &legacy_path).expect("legacy approval should copy");
    fs::remove_file(&canonical_path).expect("canonical approval should be removed");

    let repo_check = run_rust_superpowers(
        Some(repo),
        Some(state),
        None,
        &[],
        &[
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "superpowers:executing-plans",
            "--task-id",
            "task-7",
            "--path",
            "docs/superpowers/specs/example.md",
            "--write-target",
            "execution-task-slice",
        ],
        "repo-safety check with pending migration",
    );
    let repo_check_json = parse_json(&repo_check, "repo-safety check with pending migration");
    assert_eq!(
        repo_check_json["outcome"],
        Value::String(String::from("allowed"))
    );
    assert!(
        String::from_utf8_lossy(&repo_check.stderr).contains("PendingMigration"),
        "repo-safety check should warn when legacy approvals still need explicit migration"
    );

    let repo_approve = run_rust_superpowers(
        Some(repo),
        Some(state),
        None,
        &[],
        &[
            "repo-safety",
            "approve",
            "--stage",
            "superpowers:executing-plans",
            "--task-id",
            "task-7b",
            "--reason",
            "Second approval should block until migration.",
            "--path",
            "docs/superpowers/specs/example.md",
            "--write-target",
            "execution-task-slice",
        ],
        "repo-safety approve with pending migration",
    );
    assert!(
        !repo_approve.status.success(),
        "repo-safety approve should fail closed until install migrate rewrites approvals"
    );
    assert!(
        String::from_utf8_lossy(&repo_approve.stderr).contains("PendingMigration"),
        "repo-safety approve failure should name the pending migration gate"
    );
}

#[test]
fn install_migrate_rewrites_config_and_legacy_approvals_with_backup_reporting() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");
    fs::create_dir_all(codex_root.parent().expect("codex parent"))
        .expect("codex parent should exist");
    make_legacy_install(&codex_root, "4.9.0");

    let state_dir = home_dir.path().join(".superpowers");
    write_file(&state_dir.join("config.yaml"), "update_check: false\n");

    let remote_url = "https://example.com/acme/install-migrate.git";
    let (repo_dir, _repo_state_dir) = init_repo("install-migrate", "main", remote_url);
    let repo = repo_dir.path();
    let mut helper_approve = Command::new(repo_safety_helper_path());
    helper_approve
        .current_dir(repo)
        .env("SUPERPOWERS_STATE_DIR", &state_dir)
        .args([
            "approve",
            "--stage",
            "superpowers:executing-plans",
            "--task-id",
            "task-7",
            "--reason",
            "User explicitly approved this write.",
            "--path",
            "docs/superpowers/specs/example.md",
            "--write-target",
            "execution-task-slice",
        ]);
    let helper_output = run_checked(
        helper_approve,
        "helper repo-safety approve for install-migrate fixtures",
    );
    let helper_json = parse_json(
        &helper_output,
        "helper repo-safety approve for install-migrate fixtures",
    );
    assert!(
        helper_json["outcome"].as_str().is_some(),
        "helper repo-safety approve should emit an outcome field"
    );
    let canonical_approval = canonical_approval_path(
        &state_dir,
        remote_url,
        "main",
        "superpowers:executing-plans",
        "task-7",
    );
    let legacy_approval = legacy_approval_path(
        &state_dir,
        remote_url,
        "main",
        "superpowers:executing-plans",
        "task-7",
    );
    if let Some(parent) = legacy_approval.parent() {
        fs::create_dir_all(parent).expect("legacy approval parent should exist");
    }
    fs::copy(&canonical_approval, &legacy_approval).expect("legacy approval should copy");
    fs::remove_file(&canonical_approval).expect("canonical approval should be removed");

    let migrate_output = run_rust_superpowers(
        None,
        Some(&state_dir),
        Some(home_dir.path()),
        &[
            (
                "SUPERPOWERS_SHARED_ROOT",
                shared_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_CODEX_ROOT",
                codex_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_COPILOT_ROOT",
                copilot_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_REPO_URL",
                source_repo.to_string_lossy().as_ref(),
            ),
            ("SUPERPOWERS_HOST_TARGET", "darwin-arm64"),
            ("SUPERPOWERS_MIGRATE_STAMP", "20260323-140000"),
        ],
        &["install", "migrate"],
        "install migrate with config and approval migration",
    );
    assert!(
        migrate_output.status.success(),
        "install migrate should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        migrate_output.status,
        String::from_utf8_lossy(&migrate_output.stdout),
        String::from_utf8_lossy(&migrate_output.stderr)
    );
    let stdout = String::from_utf8_lossy(&migrate_output.stdout);
    assert!(
        stdout.contains("Migrated config"),
        "install migrate should report config migration"
    );
    assert!(
        stdout.contains("Migrated repo-safety approval"),
        "install migrate should report migrated approval records"
    );
    assert!(
        stdout.contains("Shared install ready"),
        "install migrate should still report the shared-install result"
    );

    let canonical_config = state_dir.join("config/config.yaml");
    assert_eq!(
        fs::read_to_string(&canonical_config).expect("canonical config should exist"),
        "update_check: false\n"
    );
    assert!(
        state_dir.join("config.yaml.bak").exists(),
        "install migrate should back up the legacy config before rewriting it"
    );
    let canonical_approval = canonical_approval_path(
        &state_dir,
        remote_url,
        "main",
        "superpowers:executing-plans",
        "task-7",
    );
    assert!(
        canonical_approval.exists(),
        "install migrate should rewrite legacy approval state into the canonical subtree"
    );
}

#[test]
fn install_migrate_clones_fresh_shared_install_and_reports_next_steps() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");

    let output = run_install_migrate_command(
        home_dir.path(),
        &home_dir.path().join(".superpowers"),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "install migrate for fresh install",
    );
    assert!(output.status.success(), "fresh install should succeed");
    assert_ready_install(&shared_root);
    assert!(
        !codex_root.exists(),
        "fresh install should not create a legacy Codex root"
    );
    assert!(
        !copilot_root.exists(),
        "fresh install should not create a legacy Copilot root"
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Codex next step:"));
    assert!(stdout.contains("~/.agents/skills/superpowers"));
    assert!(stdout.contains("~/.codex/agents/code-reviewer.toml"));
    assert!(stdout.contains("GitHub Copilot next step:"));
    assert!(stdout.contains("~/.copilot/skills/superpowers"));
    assert!(stdout.contains("code-reviewer.agent.md"));
}

#[test]
fn install_migrate_helper_dispatches_to_canonical_rust_command() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");

    let output = run_shell_migrate_install(
        home_dir.path(),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "migrate-install helper dispatch",
    );

    assert!(
        output.status.success(),
        "helper migrate-install should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_ready_install(&shared_root);
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Shared install ready"));
    assert!(stdout.contains("Provisioned checked-in runtime"));
}

#[test]
fn install_migrate_rewires_existing_codex_legacy_install() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");
    fs::create_dir_all(codex_root.parent().expect("codex parent should exist"))
        .expect("codex parent should exist");
    make_install_repo(&codex_root, "2.0.0", None);

    let output = run_install_migrate_command(
        home_dir.path(),
        &home_dir.path().join(".superpowers"),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "install migrate for codex-only legacy install",
    );

    assert!(
        output.status.success(),
        "codex-only migration should succeed"
    );
    assert_ready_install(&shared_root);
    assert_link_target(&codex_root, &shared_root);
    assert!(
        !copilot_root.exists(),
        "codex-only migration should leave an absent Copilot root alone"
    );
}

#[test]
fn install_migrate_rewires_existing_copilot_legacy_install_and_reports_next_step() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");
    fs::create_dir_all(copilot_root.parent().expect("copilot parent should exist"))
        .expect("copilot parent should exist");
    make_install_repo(&copilot_root, "3.0.0", None);

    let output = run_install_migrate_command(
        home_dir.path(),
        &home_dir.path().join(".superpowers"),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "install migrate for copilot-only legacy install",
    );

    assert!(
        output.status.success(),
        "copilot-only migration should succeed"
    );
    assert_ready_install(&shared_root);
    assert_link_target(&copilot_root, &shared_root);
    assert!(
        !codex_root.exists(),
        "copilot-only migration should leave an absent Codex root alone"
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("GitHub Copilot next step:"));
    assert!(stdout.contains("~/.copilot/agents/code-reviewer.agent.md"));
    assert!(stdout.contains("copy on Windows; symlink on Unix-like installs"));
}

#[test]
fn install_migrate_replaces_invalid_legacy_install_missing_config_with_fresh_clone() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");
    fs::create_dir_all(codex_root.parent().expect("codex parent should exist"))
        .expect("codex parent should exist");
    make_legacy_install_without_config(&codex_root, "4.9.0");

    let output = run_install_migrate_command(
        home_dir.path(),
        &home_dir.path().join(".superpowers"),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "install migrate for legacy install missing config",
    );

    assert!(
        output.status.success(),
        "legacy install without config should migrate"
    );
    assert_ready_install(&shared_root);
    assert_eq!(
        fs::read_to_string(shared_root.join("VERSION")).expect("shared root version should exist"),
        "1.0.0\n"
    );
    assert_link_target(&codex_root, &shared_root);
    assert_backup_exists(
        codex_root.parent().expect("codex parent should exist"),
        "superpowers.backup-",
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Cloned shared install to"));
    assert!(stdout.contains("Backed up legacy install at"));
}

#[test]
fn install_migrate_replaces_invalid_legacy_install_missing_reviewers_with_fresh_clone() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");
    fs::create_dir_all(codex_root.parent().expect("codex parent should exist"))
        .expect("codex parent should exist");
    make_legacy_install_without_reviewers(&codex_root, "4.9.1");

    let output = run_install_migrate_command(
        home_dir.path(),
        &home_dir.path().join(".superpowers"),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "install migrate for legacy install missing reviewers",
    );

    assert!(
        output.status.success(),
        "legacy install missing reviewers should migrate"
    );
    assert_ready_install(&shared_root);
    assert_eq!(
        fs::read_to_string(shared_root.join("VERSION")).expect("shared root version should exist"),
        "1.0.0\n"
    );
    assert_link_target(&codex_root, &shared_root);
    assert_backup_exists(
        codex_root.parent().expect("codex parent should exist"),
        "superpowers.backup-",
    );
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Cloned shared install to"));
    assert!(stdout.contains("Backed up legacy install at"));
}

#[test]
fn install_migrate_prefers_newer_of_two_legacy_roots_and_backs_up_the_other() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");
    fs::create_dir_all(codex_root.parent().expect("codex parent should exist"))
        .expect("codex parent should exist");
    fs::create_dir_all(copilot_root.parent().expect("copilot parent should exist"))
        .expect("copilot parent should exist");
    make_install_repo(&codex_root, "4.0.0", Some("1700000000"));
    make_install_repo(&copilot_root, "5.0.0", Some("1700000100"));

    let output = run_install_migrate_command(
        home_dir.path(),
        &home_dir.path().join(".superpowers"),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "install migrate for dual legacy roots",
    );

    assert!(
        output.status.success(),
        "dual-root migration should succeed"
    );
    assert_ready_install(&shared_root);
    assert_eq!(
        fs::read_to_string(shared_root.join("VERSION")).expect("shared root version should exist"),
        "5.0.0\n"
    );
    assert_link_target(&codex_root, &shared_root);
    assert_link_target(&copilot_root, &shared_root);
    assert_backup_exists(
        codex_root.parent().expect("codex parent should exist"),
        "superpowers.backup-",
    );
}

#[test]
fn install_migrate_fails_on_ambiguous_legacy_roots() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");
    fs::create_dir_all(codex_root.parent().expect("codex parent should exist"))
        .expect("codex parent should exist");
    fs::create_dir_all(copilot_root.parent().expect("copilot parent should exist"))
        .expect("copilot parent should exist");
    make_install_repo(&codex_root, "6.0.0", Some("1700000200"));
    make_install_repo(&copilot_root, "7.0.0", Some("1700000200"));

    let output = run_install_migrate_command(
        home_dir.path(),
        &home_dir.path().join(".superpowers"),
        &shared_root,
        &codex_root,
        &copilot_root,
        &source_repo,
        "darwin-arm64",
        "install migrate for ambiguous legacy roots",
    );

    assert!(
        !output.status.success(),
        "ambiguous dual-root migration should fail closed"
    );
    assert!(
        String::from_utf8_lossy(&output.stderr).contains("manual reconciliation"),
        "ambiguous migration failure should mention manual reconciliation"
    );
}

#[test]
fn install_migrate_provisions_host_runtime_from_checked_in_manifest() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho darwin-runtime\n",
        )],
        "1.0.0-test",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");

    let migrate_output = run_rust_superpowers(
        None,
        Some(&home_dir.path().join(".superpowers")),
        Some(home_dir.path()),
        &[
            (
                "SUPERPOWERS_SHARED_ROOT",
                shared_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_CODEX_ROOT",
                codex_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_COPILOT_ROOT",
                copilot_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_REPO_URL",
                source_repo.to_string_lossy().as_ref(),
            ),
            ("SUPERPOWERS_HOST_TARGET", "darwin-arm64"),
            ("SUPERPOWERS_MIGRATE_STAMP", "20260323-150000"),
        ],
        &["install", "migrate"],
        "install migrate with manifest provisioning",
    );
    assert!(
        migrate_output.status.success(),
        "install migrate should succeed when the checked-in manifest resolves the host binary, got {:?}\nstdout:\n{}\nstderr:\n{}",
        migrate_output.status,
        String::from_utf8_lossy(&migrate_output.stdout),
        String::from_utf8_lossy(&migrate_output.stderr)
    );
    let installed_binary = shared_root.join("bin/superpowers");
    assert!(
        installed_binary.is_file(),
        "install migrate should provision the manifest-selected runtime into install/bin/superpowers"
    );
    assert_eq!(
        fs::read_to_string(&installed_binary).expect("installed runtime should exist"),
        "#!/bin/sh\necho darwin-runtime\n"
    );
    assert!(
        String::from_utf8_lossy(&migrate_output.stdout).contains("Provisioned checked-in runtime"),
        "install migrate should report manifest-driven provisioning"
    );
}

#[test]
fn install_migrate_fails_when_prebuilt_manifest_is_missing() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");

    let migrate_output = run_rust_superpowers(
        None,
        Some(&home_dir.path().join(".superpowers")),
        Some(home_dir.path()),
        &[
            (
                "SUPERPOWERS_SHARED_ROOT",
                shared_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_CODEX_ROOT",
                codex_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_COPILOT_ROOT",
                copilot_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_REPO_URL",
                source_repo.to_string_lossy().as_ref(),
            ),
            ("SUPERPOWERS_HOST_TARGET", "darwin-arm64"),
        ],
        &["install", "migrate"],
        "install migrate without prebuilt manifest",
    );
    assert!(
        !migrate_output.status.success(),
        "install migrate should fail closed when bin/prebuilt/manifest.json is missing"
    );
    assert!(
        String::from_utf8_lossy(&migrate_output.stderr).contains("manifest"),
        "missing-manifest failure should name the manifest contract"
    );
}

#[test]
fn install_migrate_fails_when_manifest_target_is_missing() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[("windows-x64", "superpowers.exe", "windows runtime\r\n")],
        "1.0.0-test",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");

    let migrate_output = run_rust_superpowers(
        None,
        Some(&home_dir.path().join(".superpowers")),
        Some(home_dir.path()),
        &[
            (
                "SUPERPOWERS_SHARED_ROOT",
                shared_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_CODEX_ROOT",
                codex_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_COPILOT_ROOT",
                copilot_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_REPO_URL",
                source_repo.to_string_lossy().as_ref(),
            ),
            ("SUPERPOWERS_HOST_TARGET", "darwin-arm64"),
        ],
        &["install", "migrate"],
        "install migrate with missing manifest target",
    );
    assert!(
        !migrate_output.status.success(),
        "install migrate should fail when the manifest does not map the requested host target"
    );
    let stderr = String::from_utf8_lossy(&migrate_output.stderr);
    assert!(
        stderr.contains("darwin-arm64") || stderr.contains("target"),
        "missing target failure should name the host-target lookup"
    );
}

#[test]
fn install_migrate_fails_when_manifest_checksum_is_stale() {
    let home_dir = TempDir::new().expect("home tempdir should exist");
    let source_repo = home_dir.path().join("source");
    fs::create_dir_all(&source_repo).expect("source repo dir should exist");
    create_source_install_repo(&source_repo);
    write_prebuilt_runtime_fixture(
        &source_repo,
        &[(
            "darwin-arm64",
            "superpowers",
            "#!/bin/sh\necho stale-checksum\n",
        )],
        "1.0.0-test",
    );
    write_file(
        &source_repo.join("bin/prebuilt/darwin-arm64/superpowers.sha256"),
        "deadbeef  superpowers\n",
    );

    let shared_root = home_dir.path().join(".superpowers/install");
    let codex_root = home_dir.path().join(".codex/superpowers");
    let copilot_root = home_dir.path().join(".copilot/superpowers");

    let migrate_output = run_rust_superpowers(
        None,
        Some(&home_dir.path().join(".superpowers")),
        Some(home_dir.path()),
        &[
            (
                "SUPERPOWERS_SHARED_ROOT",
                shared_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_CODEX_ROOT",
                codex_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_COPILOT_ROOT",
                copilot_root.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_REPO_URL",
                source_repo.to_string_lossy().as_ref(),
            ),
            ("SUPERPOWERS_HOST_TARGET", "darwin-arm64"),
        ],
        &["install", "migrate"],
        "install migrate with stale checksum",
    );
    assert!(
        !migrate_output.status.success(),
        "install migrate should fail when the manifest checksum does not match the checked-in runtime"
    );
    assert!(
        String::from_utf8_lossy(&migrate_output.stderr).contains("checksum"),
        "stale checksum failure should name checksum verification"
    );
}
