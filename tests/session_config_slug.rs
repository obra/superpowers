#[path = "support/failure_json.rs"]
mod failure_json_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/json.rs"]
mod json_support;
#[path = "support/process.rs"]
mod process_support;
#[path = "support/superpowers.rs"]
mod superpowers_support;

use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};
use tempfile::TempDir;

use failure_json_support::parse_failure_json;
use files_support::write_file;
use json_support::parse_json;
use process_support::{repo_root, run, run_checked};

fn session_entry_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-session-entry")
}

fn config_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-config")
}

fn slug_helper_path() -> PathBuf {
    repo_root().join("bin/superpowers-slug")
}

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

    (repo_dir, state_dir)
}

fn init_repo_at(path: &Path, name: &str) {
    fs::create_dir_all(path).expect("repo path should be creatable");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(path);
    run_checked(git_init, "git init");

    let mut git_config_name = Command::new("git");
    git_config_name
        .args(["config", "user.name", "Superpowers Test"])
        .current_dir(path);
    run_checked(git_config_name, "git config user.name");

    let mut git_config_email = Command::new("git");
    git_config_email
        .args(["config", "user.email", "superpowers-tests@example.com"])
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

fn run_shell_session_entry(state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command = Command::new(session_entry_helper_path());
    command.env("SUPERPOWERS_STATE_DIR", state_dir).args(args);
    run(command, context)
}

fn run_shell_config(state_dir: &Path, args: &[&str], context: &str) -> Output {
    let mut command = Command::new(config_helper_path());
    command.env("SUPERPOWERS_STATE_DIR", state_dir).args(args);
    run(command, context)
}

fn run_shell_slug(repo: &Path, context: &str) -> Output {
    let mut command = Command::new(slug_helper_path());
    command.current_dir(repo);
    run(command, context)
}

fn run_rust_superpowers(
    repo: Option<&Path>,
    state_dir: &Path,
    args: &[&str],
    context: &str,
) -> Output {
    superpowers_support::run_rust_superpowers(repo, Some(state_dir), None, &[], args, context)
}

fn run_rust_superpowers_with_env(
    repo: Option<&Path>,
    state_dir: &Path,
    envs: &[(&str, &str)],
    args: &[&str],
    context: &str,
) -> Output {
    superpowers_support::run_rust_superpowers(repo, Some(state_dir), None, envs, args, context)
}

fn run_rust_superpowers_with_env_control(
    repo: Option<&Path>,
    env_remove: &[&str],
    envs: &[(&str, &str)],
    args: &[&str],
    context: &str,
) -> Output {
    superpowers_support::run_rust_superpowers_with_env_control(
        repo, None, None, env_remove, envs, args, context,
    )
}

fn canonical_session_entry_path(state_dir: &Path, session_key: &str) -> PathBuf {
    state_dir
        .join("session-entry")
        .join("using-superpowers")
        .join(session_key)
}

#[test]
fn canonical_session_entry_missing_decision_matches_helper_semantics() {
    let (_repo_dir, state_dir) = init_repo("session-entry-missing");
    let state = state_dir.path();
    let message_file = state.join("missing-message.txt");
    write_file(&message_file, "Can you help with this task?\n");

    let helper_output = run_shell_session_entry(
        state,
        &[
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "missing-session",
        ],
        "helper session-entry missing decision",
    );
    let helper_json = parse_json(&helper_output, "helper session-entry missing decision");

    let rust_output = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "missing-session",
        ],
        "canonical session-entry missing decision",
    );
    let rust_json = parse_json(&rust_output, "canonical session-entry missing decision");

    assert_eq!(rust_json["outcome"], helper_json["outcome"]);
    assert_eq!(rust_json["decision_source"], helper_json["decision_source"]);
    assert_eq!(rust_json["persisted"], helper_json["persisted"]);
    assert_eq!(
        rust_json["prompt"]["question"],
        helper_json["prompt"]["question"]
    );
    assert_eq!(
        rust_json["decision_path"].as_str(),
        Some(
            canonical_session_entry_path(state, "missing-session")
                .to_string_lossy()
                .as_ref()
        )
    );
}

#[test]
fn canonical_config_uses_userprofile_when_home_is_missing() {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let userprofile_dir = TempDir::new().expect("userprofile tempdir should exist");
    init_repo_at(repo_dir.path(), "config-userprofile-home-fallback");

    let output = run_rust_superpowers_with_env_control(
        Some(repo_dir.path()),
        &["HOME", "SUPERPOWERS_STATE_DIR"],
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
        .join(".superpowers")
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
fn canonical_session_entry_explicit_reentry_migrates_legacy_state_to_canonical_path() {
    let (_repo_dir, state_dir) = init_repo("session-entry-reentry");
    let state = state_dir.path();
    let legacy_path = state
        .join("session-flags")
        .join("using-superpowers")
        .join("explicit-reentry");
    write_file(&legacy_path, "bypassed\n");
    let message_file = state.join("reentry-message.txt");
    write_file(&message_file, "Please use superpowers for this task.\n");

    let rust_output = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "explicit-reentry",
        ],
        "canonical session-entry explicit reentry",
    );
    let rust_json = parse_json(&rust_output, "canonical session-entry explicit reentry");
    let canonical_path = canonical_session_entry_path(state, "explicit-reentry");

    assert_eq!(rust_json["outcome"], Value::String(String::from("enabled")));
    assert_eq!(
        rust_json["decision_source"],
        Value::String(String::from("explicit_reentry"))
    );
    assert_eq!(
        rust_json["decision_path"].as_str(),
        Some(canonical_path.to_string_lossy().as_ref())
    );
    assert_eq!(
        fs::read_to_string(&canonical_path).expect("canonical session-entry path should exist"),
        "enabled\n"
    );
}

#[test]
fn canonical_session_entry_existing_enabled_decision_returns_enabled_without_prompt() {
    let (_repo_dir, state_dir) = init_repo("session-entry-enabled");
    let state = state_dir.path();
    let message_file = state.join("enabled-message.txt");
    let decision_path = canonical_session_entry_path(state, "enabled-session");

    write_file(&message_file, "Continue normally.\n");
    write_file(&decision_path, "enabled\n");

    let rust_output = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "enabled-session",
        ],
        "canonical session-entry existing enabled",
    );
    let rust_json = parse_json(&rust_output, "canonical session-entry existing enabled");

    assert_eq!(rust_json["outcome"], Value::String(String::from("enabled")));
    assert_eq!(
        rust_json["decision_source"],
        Value::String(String::from("existing_enabled"))
    );
    assert_eq!(rust_json["persisted"], Value::Bool(true));
    assert_eq!(rust_json["prompt"], Value::Null);
    assert_eq!(
        rust_json["decision_path"].as_str(),
        Some(decision_path.to_string_lossy().as_ref())
    );
}

#[test]
fn canonical_session_entry_skill_name_reentry_enables_superpowers_again() {
    let (_repo_dir, state_dir) = init_repo("session-entry-skill-reentry");
    let state = state_dir.path();
    let legacy_path = state
        .join("session-flags")
        .join("using-superpowers")
        .join("skill-reentry");
    write_file(&legacy_path, "bypassed\n");
    let message_file = state.join("skill-reentry-message.txt");
    write_file(&message_file, "Please use brainstorming for this task.\n");

    let rust_output = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "skill-reentry",
        ],
        "canonical session-entry skill-name reentry",
    );
    let rust_json = parse_json(&rust_output, "canonical session-entry skill-name reentry");
    let canonical_path = canonical_session_entry_path(state, "skill-reentry");

    assert_eq!(rust_json["outcome"], Value::String(String::from("enabled")));
    assert_eq!(
        rust_json["decision_source"],
        Value::String(String::from("explicit_reentry"))
    );
    assert_eq!(
        rust_json["decision_path"].as_str(),
        Some(canonical_path.to_string_lossy().as_ref())
    );
    assert_eq!(
        fs::read_to_string(&canonical_path).expect("canonical session-entry path should exist"),
        "enabled\n"
    );
}

#[test]
fn canonical_session_entry_bypassed_and_clause_reentry_matrix_matches_contract() {
    let (_repo_dir, state_dir) = init_repo("session-entry-clause-matrix");
    let state = state_dir.path();
    let cases = [
        (
            "existing-bypassed",
            "Continue without extra workflow help.\n",
            "bypassed",
            "existing_bypassed",
        ),
        (
            "natural-language-skill-reentry",
            "Please use brainstorming for this task.\n",
            "enabled",
            "explicit_reentry",
        ),
        (
            "direct-superpowers-please",
            "superpowers please\n",
            "enabled",
            "explicit_reentry",
        ),
        (
            "enable-superpowers-again",
            "Enable superpowers again.\n",
            "enabled",
            "explicit_reentry",
        ),
        (
            "negated-skill-request",
            "Do not use brainstorming for this task.\n",
            "bypassed",
            "existing_bypassed",
        ),
        (
            "use-no-skill-request",
            "Please use no brainstorming here.\n",
            "bypassed",
            "existing_bypassed",
        ),
        (
            "use-no-superpowers",
            "Please use no superpowers here.\n",
            "bypassed",
            "existing_bypassed",
        ),
        (
            "never-use-skill-request",
            "Please never use brainstorming here.\n",
            "bypassed",
            "existing_bypassed",
        ),
        (
            "long-negated-skill-request",
            "Please do not under any circumstances use brainstorming for this task.\n",
            "bypassed",
            "existing_bypassed",
        ),
        (
            "long-negated-superpowers-request",
            "Please do not under any circumstances use superpowers for this task.\n",
            "bypassed",
            "existing_bypassed",
        ),
        (
            "contrastive-superpowers",
            "Do not use brainstorming, but use superpowers for this task.\n",
            "enabled",
            "explicit_reentry",
        ),
        (
            "contrastive-skill",
            "Do not use brainstorming, but use writing-plans for this task.\n",
            "enabled",
            "explicit_reentry",
        ),
    ];

    for (session_key, message, expected_outcome, expected_source) in cases {
        let message_file = state.join(format!("{session_key}.txt"));
        let decision_path = canonical_session_entry_path(state, session_key);
        write_file(&message_file, message);
        write_file(&decision_path, "bypassed\n");

        let rust_output = run_rust_superpowers(
            None,
            state,
            &[
                "session-entry",
                "resolve",
                "--message-file",
                message_file.to_str().expect("message file should be utf8"),
                "--session-key",
                session_key,
            ],
            session_key,
        );
        let rust_json = parse_json(&rust_output, session_key);

        assert_eq!(
            rust_json["outcome"],
            Value::String(expected_outcome.to_owned()),
            "outcome should match for {session_key}"
        );
        assert_eq!(
            rust_json["decision_source"],
            Value::String(expected_source.to_owned()),
            "decision_source should match for {session_key}"
        );
        assert_eq!(
            rust_json["persisted"],
            Value::Bool(true),
            "persisted should remain true for {session_key}"
        );
        let expected_file = if expected_outcome == "enabled" {
            "enabled\n"
        } else {
            "bypassed\n"
        };
        assert_eq!(
            fs::read_to_string(&decision_path).expect("decision path should remain readable"),
            expected_file,
            "decision file should match for {session_key}"
        );
    }
}

#[test]
fn canonical_session_entry_malformed_decision_fails_closed_with_prompt_and_failure_class() {
    let (_repo_dir, state_dir) = init_repo("session-entry-malformed");
    let state = state_dir.path();
    let message_file = state.join("malformed-message.txt");
    let decision_path = canonical_session_entry_path(state, "malformed-session");

    write_file(&message_file, "Please route this correctly.\n");
    write_file(&decision_path, "corrupt\nextra\n");

    let rust_output = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "malformed-session",
        ],
        "canonical session-entry malformed decision",
    );
    let rust_json = parse_json(&rust_output, "canonical session-entry malformed decision");

    assert_eq!(
        rust_json["outcome"],
        Value::String(String::from("needs_user_choice"))
    );
    assert_eq!(
        rust_json["decision_source"],
        Value::String(String::from("malformed"))
    );
    assert_eq!(
        rust_json["failure_class"],
        Value::String(String::from("MalformedDecisionState"))
    );
    assert_eq!(rust_json["persisted"], Value::Bool(false));
    assert_eq!(
        rust_json["decision_path"].as_str(),
        Some(decision_path.to_string_lossy().as_ref())
    );
    assert_eq!(
        rust_json["prompt"]["recommended_option"],
        Value::String(String::from("A"))
    );
}

#[test]
fn canonical_session_entry_explicit_reentry_write_failure_remains_unpersisted() {
    let (_repo_dir, state_dir) = init_repo("session-entry-write-failure");
    let state = state_dir.path();
    let message_file = state.join("explicit-reentry-write-failure.txt");
    let decision_path = canonical_session_entry_path(state, "explicit-reentry-write-failure");

    write_file(&message_file, "Use superpowers right now.\n");
    write_file(&decision_path, "bypassed\n");

    let rust_output = run_rust_superpowers_with_env(
        None,
        state,
        &[(
            "SUPERPOWERS_SESSION_ENTRY_TEST_FAILPOINT",
            "reentry_write_failure",
        )],
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "explicit-reentry-write-failure",
        ],
        "canonical session-entry explicit reentry write failure",
    );
    let rust_json = parse_json(
        &rust_output,
        "canonical session-entry explicit reentry write failure",
    );

    assert_eq!(rust_json["outcome"], Value::String(String::from("enabled")));
    assert_eq!(
        rust_json["decision_source"],
        Value::String(String::from("explicit_reentry_unpersisted"))
    );
    assert_eq!(rust_json["persisted"], Value::Bool(false));
    assert_eq!(
        rust_json["failure_class"],
        Value::String(String::from("DecisionWriteFailed"))
    );
    assert_eq!(
        fs::read_to_string(&decision_path).expect("decision path should remain readable"),
        "bypassed\n"
    );
}

#[test]
fn canonical_session_entry_record_and_validation_errors_match_contract() {
    let (_repo_dir, state_dir) = init_repo("session-entry-record");
    let state = state_dir.path();
    let decision_path = canonical_session_entry_path(state, "record-enabled");

    let record_output = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "record",
            "--decision",
            "enabled",
            "--session-key",
            "record-enabled",
        ],
        "canonical session-entry record enabled",
    );
    let record_json = parse_json(&record_output, "canonical session-entry record enabled");
    assert_eq!(
        record_json["outcome"],
        Value::String(String::from("enabled"))
    );
    assert_eq!(
        record_json["decision_source"],
        Value::String(String::from("existing_enabled"))
    );
    assert_eq!(record_json["persisted"], Value::Bool(true));
    assert_eq!(
        fs::read_to_string(&decision_path).expect("recorded decision should exist"),
        "enabled\n"
    );

    let invalid_record = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "record",
            "--decision",
            "maybe",
            "--session-key",
            "record-invalid",
        ],
        "canonical session-entry invalid decision",
    );
    let invalid_record_json =
        parse_failure_json(&invalid_record, "canonical session-entry invalid decision");
    assert_eq!(
        invalid_record_json["failure_class"],
        Value::String(String::from("InvalidCommandInput"))
    );

    let blank_record = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "record",
            "--decision",
            "enabled",
            "--session-key",
            "   ",
        ],
        "canonical session-entry blank record key",
    );
    let blank_record_json =
        parse_failure_json(&blank_record, "canonical session-entry blank record key");
    assert_eq!(
        blank_record_json["failure_class"],
        Value::String(String::from("InvalidCommandInput"))
    );

    let message_file = state.join("blank-session-key.txt");
    write_file(&message_file, "Please keep the gate deterministic.\n");
    let blank_resolve = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "   ",
        ],
        "canonical session-entry blank resolve key",
    );
    let blank_resolve_json =
        parse_failure_json(&blank_resolve, "canonical session-entry blank resolve key");
    assert_eq!(
        blank_resolve_json["failure_class"],
        Value::String(String::from("InvalidCommandInput"))
    );
}

#[test]
fn canonical_session_entry_uses_requested_decision_file_even_with_many_decoys() {
    let (_repo_dir, state_dir) = init_repo("session-entry-hot-path");
    let state = state_dir.path();
    let message_file = state.join("hot-path-message.txt");
    let decision_root = state.join("session-entry").join("using-superpowers");
    let decision_path = canonical_session_entry_path(state, "derived-session");

    write_file(
        &message_file,
        "Normal routing should use the derived session key.\n",
    );
    fs::create_dir_all(&decision_root).expect("decision root should exist");
    for index in 1..=100 {
        write_file(
            &decision_root.join(format!("decoy-session-{index}")),
            "enabled\n",
        );
    }
    write_file(&decision_path, "enabled\n");

    let rust_output = run_rust_superpowers(
        None,
        state,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            message_file.to_str().expect("message file should be utf8"),
            "--session-key",
            "derived-session",
        ],
        "canonical session-entry hot path",
    );
    let rust_json = parse_json(&rust_output, "canonical session-entry hot path");

    assert_eq!(rust_json["outcome"], Value::String(String::from("enabled")));
    assert_eq!(
        rust_json["decision_path"].as_str(),
        Some(decision_path.to_string_lossy().as_ref())
    );
}

#[test]
fn canonical_config_reads_legacy_yaml_in_read_only_mode_until_install_migrate_runs() {
    let (_repo_dir, state_dir) = init_repo("config-migration");
    let state = state_dir.path();
    let legacy_config = state.join("config.yaml");
    let canonical_config = state.join("config").join("config.yaml");

    write_file(
        &legacy_config,
        "update_check: false\nsuperpowers_contributor: true\n",
    );

    let shell_value = run_shell_config(state, &["get", "update_check"], "helper config get");
    assert_eq!(String::from_utf8_lossy(&shell_value.stdout).trim(), "false");

    let rust_get = run_rust_superpowers(
        None,
        state,
        &["config", "get", "update_check"],
        "canonical config get after migration",
    );
    assert!(
        rust_get.status.success(),
        "canonical config get should succeed"
    );
    assert_eq!(String::from_utf8_lossy(&rust_get.stdout).trim(), "false");
    assert!(
        String::from_utf8_lossy(&rust_get.stderr).contains("PendingMigration"),
        "canonical config get should warn when explicit migration is still pending"
    );
    assert!(
        !canonical_config.exists(),
        "read-only config access should not silently rewrite legacy config state"
    );

    let rust_list = run_rust_superpowers(None, state, &["config", "list"], "canonical config list");
    assert!(
        rust_list.status.success(),
        "canonical config list should succeed"
    );
    let listing = String::from_utf8_lossy(&rust_list.stdout);
    assert!(listing.contains("update_check: false"));
    assert!(listing.contains("superpowers_contributor: true"));
    assert!(
        String::from_utf8_lossy(&rust_list.stderr).contains("PendingMigration"),
        "canonical config list should warn when explicit migration is still pending"
    );
}

#[test]
fn canonical_config_set_get_and_list_use_canonical_path() {
    let (_repo_dir, state_dir) = init_repo("config-canonical");
    let state = state_dir.path();
    let canonical_config = state.join("config").join("config.yaml");

    let missing = run_rust_superpowers(
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

    let set_false = run_rust_superpowers(
        None,
        state,
        &["config", "set", "update_check", "false"],
        "canonical config set false",
    );
    assert!(
        set_false.status.success(),
        "canonical config set should succeed"
    );

    let get_false = run_rust_superpowers(
        None,
        state,
        &["config", "get", "update_check"],
        "canonical config get false",
    );
    assert_eq!(String::from_utf8_lossy(&get_false.stdout).trim(), "false");

    let set_true = run_rust_superpowers(
        None,
        state,
        &["config", "set", "update_check", "true"],
        "canonical config set true",
    );
    assert!(
        set_true.status.success(),
        "canonical config overwrite should succeed"
    );

    let get_true = run_rust_superpowers(
        None,
        state,
        &["config", "get", "update_check"],
        "canonical config get true",
    );
    assert_eq!(String::from_utf8_lossy(&get_true.stdout).trim(), "true");

    let set_contributor = run_rust_superpowers(
        None,
        state,
        &["config", "set", "superpowers_contributor", "true"],
        "canonical config set contributor",
    );
    assert!(
        set_contributor.status.success(),
        "canonical config second key set should succeed"
    );

    let listing = run_rust_superpowers(None, state, &["config", "list"], "canonical config list");
    assert!(
        listing.status.success(),
        "canonical config list should succeed"
    );
    let listing_text = String::from_utf8_lossy(&listing.stdout);
    assert!(listing_text.contains("update_check: true"));
    assert!(listing_text.contains("superpowers_contributor: true"));
    assert_eq!(String::from_utf8_lossy(&listing.stderr).trim(), "");
    assert_eq!(
        fs::read_to_string(&canonical_config).expect("canonical config should be written"),
        "update_check: true\nsuperpowers_contributor: true\n"
    );
}

#[test]
fn canonical_config_rejects_invalid_yaml_during_migration() {
    let (_repo_dir, state_dir) = init_repo("config-invalid-yaml");
    let state = state_dir.path();
    let legacy_config = state.join("config.yaml");
    write_file(&legacy_config, "update_check:\n  nested: true\n");

    let rust_list = run_rust_superpowers(
        None,
        state,
        &["config", "list"],
        "canonical config invalid yaml",
    );
    assert!(
        !rust_list.status.success(),
        "canonical config command should fail closed on invalid legacy YAML"
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
    let rust_remote = run_rust_superpowers(
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
    let rust_detached = run_rust_superpowers(
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
    let rust_fallback = run_rust_superpowers(
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
    let rust_branch_safe = run_rust_superpowers(
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
