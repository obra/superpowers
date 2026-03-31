#[path = "support/bin.rs"]
mod bin_support;
#[path = "support/featureforge.rs"]
mod featureforge_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/process.rs"]
mod process_support;

use std::fs;
use std::path::Path;
use std::process::{Command, Output};
use tempfile::TempDir;

use bin_support::compiled_featureforge_path;
use files_support::write_file;
use process_support::{run, run_checked};

fn parse_slug_output(output: &[u8], context: &str) -> (String, String) {
    let mut command = Command::new("bash");
    command
        .arg("-lc")
        .arg("unset SLUG BRANCH; eval \"$ASSIGNMENTS\"; printf '%s\\n%s\\n' \"$SLUG\" \"$BRANCH\"")
        .env("ASSIGNMENTS", String::from_utf8_lossy(output).to_string());
    let parsed = run_checked(command, context);
    let text = String::from_utf8(parsed.stdout).expect("parsed slug output should be utf8");
    let mut lines = text.lines();
    let slug = lines
        .next()
        .expect("parsed slug should include slug line")
        .to_owned();
    let branch = lines
        .next()
        .expect("parsed slug should include branch line")
        .to_owned();
    (slug, branch)
}

fn init_repo(name: &str) -> (TempDir, TempDir) {
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

    (repo_dir, state_dir)
}

fn init_repo_at(path: &Path, name: &str) {
    fs::create_dir_all(path).expect("repo path should be creatable");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(path);
    run_checked(git_init, "git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "FeatureForge Test"])
        .current_dir(path);
    run_checked(git_config_name, "git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "featureforge-tests@example.com"])
        .current_dir(path);
    run_checked(git_config_email, "git config user.email");

    write_file(&path.join("README.md"), &format!("# {name}\n"));

    let mut git_add = Command::new("git");
    git_add.args(["add", "README.md"]).current_dir(path);
    run_checked(git_add, "git add README");

    let mut git_commit = Command::new("git");
    git_commit.args(["commit", "-m", "init"]).current_dir(path);
    run_checked(git_commit, "git commit init");
}

fn run_shell_slug(repo: &Path, context: &str) -> Output {
    let mut command = Command::new(compiled_featureforge_path());
    command.current_dir(repo).args(["repo", "slug"]);
    run(command, context)
}

fn run_rust_featureforge(
    repo: Option<&Path>,
    state_dir: &Path,
    args: &[&str],
    context: &str,
) -> Output {
    featureforge_support::run_rust_featureforge(repo, Some(state_dir), None, &[], args, context)
}

fn run_rust_featureforge_with_env_control(
    repo: Option<&Path>,
    env_remove: &[&str],
    envs: &[(&str, &str)],
    args: &[&str],
    context: &str,
) -> Output {
    featureforge_support::run_rust_featureforge_with_env_control(
        repo, None, None, env_remove, envs, args, context,
    )
}

#[test]
fn canonical_config_uses_userprofile_when_home_is_missing() {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let userprofile_dir = TempDir::new().expect("userprofile tempdir should exist");
    init_repo_at(repo_dir.path(), "config-userprofile-home-fallback");

    let output = run_rust_featureforge_with_env_control(
        Some(repo_dir.path()),
        &["HOME", "FEATUREFORGE_STATE_DIR"],
        &[(
            "USERPROFILE",
            userprofile_dir
                .path()
                .to_str()
                .expect("userprofile path should be utf8"),
        )],
        &["config", "set", "update_check", "false"],
        "canonical config set with USERPROFILE fallback",
    );
    assert!(
        output.status.success(),
        "canonical config set with USERPROFILE fallback should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let canonical_path = userprofile_dir
        .path()
        .join(".featureforge")
        .join("config")
        .join("config.yaml");
    assert!(
        canonical_path.is_file(),
        "config command should store canonical config beneath USERPROFILE when HOME is missing"
    );
    let contents = fs::read_to_string(&canonical_path)
        .expect("canonical USERPROFILE-backed config should be readable");
    assert!(
        contents.contains("update_check: false"),
        "canonical config should record the requested value, got:\n{contents}"
    );
}


#[test]
fn canonical_config_set_get_and_list_use_canonical_path() {
    let (_repo_dir, state_dir) = init_repo("config-canonical");
    let state = state_dir.path();
    let canonical_config = state.join("config").join("config.yaml");

    let missing = run_rust_featureforge(
        None,
        state,
        &["config", "get", "update_check"],
        "canonical config missing get",
    );
    assert!(
        missing.status.success(),
        "missing canonical config get should succeed"
    );
    assert_eq!(String::from_utf8_lossy(&missing.stdout).trim(), "");
    assert_eq!(String::from_utf8_lossy(&missing.stderr).trim(), "");

    let set_false = run_rust_featureforge(
        None,
        state,
        &["config", "set", "update_check", "false"],
        "canonical config set false",
    );
    assert!(
        set_false.status.success(),
        "canonical config set should succeed"
    );

    let get_false = run_rust_featureforge(
        None,
        state,
        &["config", "get", "update_check"],
        "canonical config get false",
    );
    assert_eq!(String::from_utf8_lossy(&get_false.stdout).trim(), "false");

    let set_true = run_rust_featureforge(
        None,
        state,
        &["config", "set", "update_check", "true"],
        "canonical config set true",
    );
    assert!(
        set_true.status.success(),
        "canonical config overwrite should succeed"
    );

    let get_true = run_rust_featureforge(
        None,
        state,
        &["config", "get", "update_check"],
        "canonical config get true",
    );
    assert_eq!(String::from_utf8_lossy(&get_true.stdout).trim(), "true");

    let set_contributor = run_rust_featureforge(
        None,
        state,
        &["config", "set", "featureforge_contributor", "true"],
        "canonical config set contributor",
    );
    assert!(
        set_contributor.status.success(),
        "canonical config second key set should succeed"
    );

    let listing = run_rust_featureforge(None, state, &["config", "list"], "canonical config list");
    assert!(
        listing.status.success(),
        "canonical config list should succeed"
    );
    let listing_text = String::from_utf8_lossy(&listing.stdout);
    assert!(listing_text.contains("update_check: true"));
    assert!(listing_text.contains("featureforge_contributor: true"));
    assert_eq!(String::from_utf8_lossy(&listing.stderr).trim(), "");
    assert_eq!(
        fs::read_to_string(&canonical_config).expect("canonical config should be written"),
        "update_check: true\nfeatureforge_contributor: true\n"
    );
}

#[test]
fn canonical_config_rejects_invalid_yaml_in_canonical_path() {
    let (_repo_dir, state_dir) = init_repo("config-invalid-yaml");
    let state = state_dir.path();
    let canonical_config = state.join("config").join("config.yaml");
    write_file(&canonical_config, "update_check:\n  nested: true\n");

    let rust_list = run_rust_featureforge(
        None,
        state,
        &["config", "list"],
        "canonical config invalid yaml",
    );
    assert!(
        !rust_list.status.success(),
        "canonical config command should fail closed on invalid canonical YAML"
    );
    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&rust_list.stdout),
        String::from_utf8_lossy(&rust_list.stderr)
    );
    assert!(
        combined.contains("InvalidConfigFormat"),
        "canonical config invalid-yaml failure should identify InvalidConfigFormat, got:\n{combined}"
    );
}

#[test]
fn canonical_slug_matches_helper_for_remote_and_detached_head() {
    let (repo_dir, state_dir) = init_repo("slug-remote");
    let repo = repo_dir.path();
    let state = state_dir.path();

    let mut git_remote_add = Command::new("git");
    git_remote_add
        .args([
            "remote",
            "add",
            "origin",
            "https://example.com/acme/slug-helper.git",
        ])
        .current_dir(repo);
    run_checked(git_remote_add, "git remote add origin");

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "feature/$(shell)$branch"])
        .current_dir(repo);
    run_checked(git_checkout, "git checkout feature branch");

    let helper_remote = run_shell_slug(repo, "helper remote slug");
    let rust_remote = run_rust_featureforge(
        Some(repo),
        state,
        &["repo", "slug"],
        "canonical remote slug",
    );
    assert!(
        rust_remote.status.success(),
        "canonical remote slug should succeed"
    );
    assert_eq!(
        parse_slug_output(&rust_remote.stdout, "parse canonical remote slug"),
        parse_slug_output(&helper_remote.stdout, "parse helper remote slug")
    );

    let mut git_detach = Command::new("git");
    git_detach
        .args(["checkout", "--detach", "HEAD"])
        .current_dir(repo);
    run_checked(git_detach, "git checkout detached");

    let helper_detached = run_shell_slug(repo, "helper detached slug");
    let rust_detached = run_rust_featureforge(
        Some(repo),
        state,
        &["repo", "slug"],
        "canonical detached slug",
    );
    assert!(
        rust_detached.status.success(),
        "canonical detached slug should succeed"
    );
    assert_eq!(
        parse_slug_output(&rust_detached.stdout, "parse canonical detached slug"),
        parse_slug_output(&helper_detached.stdout, "parse helper detached slug")
    );
}

#[test]
fn canonical_slug_matches_helper_for_fallback_path_hashing_and_branch_cleanup() {
    let temp_root = TempDir::new().expect("temp root should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");

    let fallback_repo = temp_root
        .path()
        .join("slug with 'quotes' and $dollar and $(cmd)");
    init_repo_at(&fallback_repo, "slug-fallback");

    let mut git_checkout = Command::new("git");
    git_checkout
        .args(["checkout", "-B", "topic/$(weird)$branch"])
        .current_dir(&fallback_repo);
    run_checked(git_checkout, "git checkout fallback branch");

    let helper_fallback = run_shell_slug(&fallback_repo, "helper fallback slug");
    let rust_fallback = run_rust_featureforge(
        Some(&fallback_repo),
        state_dir.path(),
        &["repo", "slug"],
        "canonical fallback slug",
    );
    assert!(
        rust_fallback.status.success(),
        "canonical fallback slug should succeed"
    );
    assert_eq!(
        parse_slug_output(&rust_fallback.stdout, "parse canonical fallback slug"),
        parse_slug_output(&helper_fallback.stdout, "parse helper fallback slug")
    );

    let branch_safe_repo = temp_root.path().join("branch-safe-repo");
    init_repo_at(&branch_safe_repo, "branch-safe-repo");

    let mut git_checkout_branch_safe = Command::new("git");
    git_checkout_branch_safe
        .args(["checkout", "-B", "release.v1_2-3/needs-cleanup@now"])
        .current_dir(&branch_safe_repo);
    run_checked(git_checkout_branch_safe, "git checkout branch-safe branch");

    let helper_branch_safe = run_shell_slug(&branch_safe_repo, "helper branch-safe slug");
    let rust_branch_safe = run_rust_featureforge(
        Some(&branch_safe_repo),
        state_dir.path(),
        &["repo", "slug"],
        "canonical branch-safe slug",
    );
    assert!(
        rust_branch_safe.status.success(),
        "canonical branch-safe slug should succeed"
    );
    assert_eq!(
        parse_slug_output(&rust_branch_safe.stdout, "parse canonical branch-safe slug"),
        parse_slug_output(&helper_branch_safe.stdout, "parse helper branch-safe slug")
    );
}
