use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};

use tempfile::TempDir;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn pwsh_bin() -> Option<String> {
    for candidate in ["pwsh", "powershell"] {
        if Command::new(candidate)
            .args(["-NoLogo", "-NoProfile", "-Command", "$null"])
            .output()
            .is_ok()
        {
            return Some(candidate.to_owned());
        }
    }
    None
}

fn run(mut command: Command, context: &str) -> Output {
    command
        .output()
        .unwrap_or_else(|error| panic!("{context} should run: {error}"))
}

fn write_file(path: &Path, contents: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("parent directory should be creatable");
    }
    fs::write(path, contents).expect("file should be writable");
}

#[cfg(unix)]
fn make_executable(path: &Path) {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o755))
        .expect("path should be executable");
}

#[cfg(not(unix))]
fn make_executable(_: &Path) {}

fn make_script(path: &Path, contents: &str) {
    write_file(path, contents);
    make_executable(path);
}

fn run_pwsh(pwsh: &str, script: &str, envs: &[(&str, &str)], context: &str) -> Output {
    let mut command = Command::new(pwsh);
    command.args(["-NoLogo", "-NoProfile", "-Command", script]);
    for (key, value) in envs {
        command.env(key, value);
    }
    run(command, context)
}

fn read_log_lines(path: &Path) -> Vec<String> {
    fs::read_to_string(path)
        .unwrap_or_else(|error| panic!("expected {} to be readable: {error}", path.display()))
        .lines()
        .map(|line| line.to_owned())
        .collect()
}

fn assert_args(log_path: &Path, expected: &[&str], context: &str) {
    let actual = read_log_lines(log_path);
    assert_eq!(
        actual.len(),
        expected.len(),
        "{context} should log {} args, got {:?}",
        expected.len(),
        actual
    );
    for (index, expected_arg) in expected.iter().enumerate() {
        assert_eq!(
            actual[index],
            *expected_arg,
            "{context} arg {} should match",
            index + 1
        );
    }
}

fn install_logged_bash(path: &Path) {
    make_script(
        path,
        r#"#!/bin/bash
set -euo pipefail

log_file="${SUPERPOWERS_TEST_BASH_LOG:?}"
: > "$log_file"
for arg in "$@"; do
  printf '%s\n' "$arg" >> "$log_file"
done

printf '%s\n' "${SUPERPOWERS_TEST_OUTPUT:?}"
"#,
    );
}

fn install_exit_bash(path: &Path, exit_code: i32) {
    make_script(path, &format!("#!/bin/bash\nexit {exit_code}\n"));
}

fn install_logged_exit_bash(path: &Path, exit_code: i32) {
    make_script(
        path,
        &format!(
            r#"#!/bin/bash
set -euo pipefail

log_file="${{SUPERPOWERS_TEST_BASH_LOG:?}}"
: > "$log_file"
for arg in "$@"; do
  printf '%s\n' "$arg" >> "$log_file"
done

exit {exit_code}
"#
        ),
    );
}

fn install_failure_bash(path: &Path, exit_code: i32) {
    make_script(
        path,
        &format!(
            r#"#!/bin/bash
printf 'Workflow inspection failed: Read-only workflow resolution requires a git repo.\n'
printf 'Debug:\n- failure_class=RepoContextUnavailable\n'
exit {exit_code}
"#
        ),
    );
}

fn ensure_wrapper_exists(path: &Path, label: &str) {
    assert!(
        path.is_file(),
        "Expected {label} PowerShell wrapper to exist: {}",
        path.display()
    );
}

fn powershell_wrapper_script(wrapper_path: &Path, args: &str) -> String {
    format!("& '{}' {args}", wrapper_path.display())
}

fn setup_fake_bash_tree(root: &Path) -> (PathBuf, PathBuf, PathBuf, PathBuf) {
    let generic_dir = root.join("generic");
    let git_cmd_dir = root.join("Git/cmd");
    let git_bin_dir = root.join("Git/bin");
    let override_dir = root.join("override");
    fs::create_dir_all(&generic_dir).expect("generic dir should exist");
    fs::create_dir_all(&git_cmd_dir).expect("git cmd dir should exist");
    fs::create_dir_all(&git_bin_dir).expect("git bin dir should exist");
    fs::create_dir_all(&override_dir).expect("override dir should exist");

    make_script(&generic_dir.join("bash"), "#!/bin/bash\nexit 0\n");
    make_script(&git_cmd_dir.join("git"), "#!/bin/bash\nexit 0\n");
    make_script(&git_bin_dir.join("bash.exe"), "#!/bin/bash\nexit 0\n");
    make_script(&override_dir.join("bash"), "#!/bin/bash\nexit 0\n");

    (generic_dir, git_cmd_dir, git_bin_dir, override_dir)
}

#[test]
fn powershell_wrapper_bash_resolution_matches_shell_fixture_semantics() {
    let Some(pwsh) = pwsh_bin() else {
        eprintln!(
            "Skipping PowerShell wrapper bash-resolution test: no pwsh or powershell binary found."
        );
        return;
    };

    if cfg!(windows) {
        eprintln!(
            "Skipping PowerShell wrapper bash-resolution test on Windows because the fixture uses a shell-script bash.exe stub."
        );
        return;
    }

    let tmp_root = TempDir::new().expect("temp root should exist");
    let (generic_dir, git_cmd_dir, git_bin_dir, override_dir) =
        setup_fake_bash_tree(tmp_root.path());
    let helper = repo_root().join("bin/superpowers-pwsh-common.ps1");
    let compat_launcher = repo_root().join("compat/bash/superpowers");

    let path_env = format!(
        "{}:{}:{}",
        generic_dir.display(),
        git_cmd_dir.display(),
        env::var("PATH").unwrap_or_default()
    );

    let selected = run_pwsh(
        &pwsh,
        &format!(". '{}'; Get-SuperpowersBashPath", helper.display()),
        &[("PATH", path_env.as_str())],
        "Get-SuperpowersBashPath should prefer Git Bash over PATH bash",
    );
    assert!(
        selected.status.success(),
        "Get-SuperpowersBashPath should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        selected.status,
        String::from_utf8_lossy(&selected.stdout),
        String::from_utf8_lossy(&selected.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&selected.stdout).trim(),
        git_bin_dir.join("bash.exe").display().to_string()
    );

    let override_selection = run_pwsh(
        &pwsh,
        &format!(". '{}'; Get-SuperpowersBashPath", helper.display()),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_BASH_PATH",
                override_dir.join("bash").to_string_lossy().as_ref(),
            ),
        ],
        "Get-SuperpowersBashPath should honor SUPERPOWERS_BASH_PATH",
    );
    assert!(
        override_selection.status.success(),
        "Get-SuperpowersBashPath override should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        override_selection.status,
        String::from_utf8_lossy(&override_selection.stdout),
        String::from_utf8_lossy(&override_selection.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&override_selection.stdout).trim(),
        override_dir.join("bash").display().to_string()
    );

    let workflow_status = repo_root().join("bin/superpowers-workflow-status.ps1");
    let workflow = repo_root().join("bin/superpowers-workflow.ps1");
    let plan_execution = repo_root().join("bin/superpowers-plan-execution.ps1");
    let plan_contract = repo_root().join("bin/superpowers-plan-contract.ps1");
    let session_entry = repo_root().join("bin/superpowers-session-entry.ps1");
    let repo_safety = repo_root().join("bin/superpowers-repo-safety.ps1");
    let update_check = repo_root().join("bin/superpowers-update-check.ps1");

    ensure_wrapper_exists(&workflow_status, "workflow-status");
    ensure_wrapper_exists(&workflow, "public workflow");
    ensure_wrapper_exists(&plan_execution, "plan-execution");
    ensure_wrapper_exists(&plan_contract, "plan-contract");
    ensure_wrapper_exists(&session_entry, "session-entry");
    ensure_wrapper_exists(&repo_safety, "repo-safety");
    ensure_wrapper_exists(&update_check, "update-check");

    let wrapper_log = tmp_root.path().join("workflow-status-wrapper-bash.log");
    install_logged_bash(&git_bin_dir.join("bash.exe"));
    let workflow_status_output = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(
            &workflow_status,
            "status --plan docs/superpowers/plans/example.md",
        ),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                wrapper_log.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_TEST_OUTPUT",
                "{\"status\":\"needs_brainstorming\",\"next_skill\":\"superpowers:brainstorming\",\"root\":\"/c/tmp/workspace\"}",
            ),
        ],
        "workflow-status wrapper should preserve raw transport output",
    );
    assert!(
        workflow_status_output.status.success(),
        "workflow-status wrapper should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        workflow_status_output.status,
        String::from_utf8_lossy(&workflow_status_output.stdout),
        String::from_utf8_lossy(&workflow_status_output.stderr)
    );
    let workflow_status_stdout = String::from_utf8_lossy(&workflow_status_output.stdout);
    assert!(
        workflow_status_stdout.contains("needs_brainstorming"),
        "workflow-status wrapper should preserve raw JSON output"
    );
    assert!(
        !workflow_status_stdout.contains(r#"C:\tmp\workspace"#),
        "workflow-status wrapper should not rewrite JSON paths"
    );
    assert_args(
        &wrapper_log,
        &[
            compat_launcher.to_string_lossy().as_ref(),
            "workflow",
            "status",
            "--plan",
            "docs/superpowers/plans/example.md",
        ],
        "workflow-status wrapper",
    );

    install_exit_bash(&git_bin_dir.join("bash.exe"), 7);
    let workflow_status_exit = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(
            &workflow_status,
            "status --plan docs/superpowers/plans/example.md",
        ),
        &[("PATH", path_env.as_str())],
        "workflow-status wrapper should preserve bash exit code",
    );
    assert_eq!(workflow_status_exit.status.code(), Some(7));

    let workflow_log = tmp_root.path().join("workflow-wrapper-bash.log");
    install_logged_bash(&git_bin_dir.join("bash.exe"));
    let workflow_output = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(&workflow, "status"),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                workflow_log.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_TEST_OUTPUT",
                "Workflow status: Brainstorming needed\nWhy: No current workflow artifacts are available yet.\nNext: Use superpowers:brainstorming\n",
            ),
        ],
        "public workflow wrapper should preserve human output",
    );
    assert!(
        workflow_output.status.success(),
        "public workflow wrapper should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        workflow_output.status,
        String::from_utf8_lossy(&workflow_output.stdout),
        String::from_utf8_lossy(&workflow_output.stderr)
    );
    let workflow_stdout = String::from_utf8_lossy(&workflow_output.stdout);
    assert!(
        workflow_stdout.contains("Workflow status: Brainstorming needed"),
        "public workflow wrapper should preserve human workflow output"
    );
    assert!(
        !workflow_stdout.contains(r#""root":"#),
        "public workflow wrapper should not convert human output into JSON"
    );
    assert_args(
        &workflow_log,
        &[
            compat_launcher.to_string_lossy().as_ref(),
            "workflow",
            "status",
        ],
        "public workflow wrapper",
    );

    install_failure_bash(&git_bin_dir.join("bash.exe"), 9);
    let workflow_failure = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(&workflow, "status --debug"),
        &[("PATH", path_env.as_str())],
        "public workflow wrapper should preserve failure output",
    );
    assert_eq!(workflow_failure.status.code(), Some(9));
    let workflow_failure_stdout = String::from_utf8_lossy(&workflow_failure.stdout);
    assert!(
        workflow_failure_stdout.contains(
            "Workflow inspection failed: Read-only workflow resolution requires a git repo."
        ),
        "public workflow wrapper should preserve failure output"
    );
    assert!(
        workflow_failure_stdout.contains("failure_class=RepoContextUnavailable"),
        "public workflow wrapper should preserve debug diagnostics"
    );

    let plan_execution_log = tmp_root.path().join("plan-execution-wrapper-bash.log");
    install_logged_bash(&git_bin_dir.join("bash.exe"));
    let plan_execution_output = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(
            &plan_execution,
            "status --plan docs/superpowers/plans/example.md",
        ),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                plan_execution_log.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_TEST_OUTPUT",
                "{\"execution_mode\":\"none\",\"execution_started\":\"no\",\"root\":\"/c/tmp/workspace\"}",
            ),
        ],
        "plan-execution wrapper should preserve raw transport output",
    );
    assert!(
        plan_execution_output.status.success(),
        "plan-execution wrapper should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        plan_execution_output.status,
        String::from_utf8_lossy(&plan_execution_output.stdout),
        String::from_utf8_lossy(&plan_execution_output.stderr)
    );
    let plan_execution_stdout = String::from_utf8_lossy(&plan_execution_output.stdout);
    assert!(plan_execution_stdout.contains("execution_mode"));
    assert!(!plan_execution_stdout.contains(r#"C:\tmp\workspace"#));
    assert_args(
        &plan_execution_log,
        &[
            compat_launcher.to_string_lossy().as_ref(),
            "plan",
            "execution",
            "status",
            "--plan",
            "docs/superpowers/plans/example.md",
        ],
        "plan-execution wrapper",
    );

    let plan_contract_log = tmp_root.path().join("plan-contract-wrapper-bash.log");
    install_logged_bash(&git_bin_dir.join("bash.exe"));
    let plan_contract_output = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(
            &plan_contract,
            "analyze-plan --spec docs/superpowers/specs/example.md --plan docs/superpowers/plans/example.md",
        ),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                plan_contract_log.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_TEST_OUTPUT",
                "{\"plan_path\":\"docs/superpowers/plans/example.md\",\"root\":\"/c/tmp/workspace\"}",
            ),
        ],
        "plan-contract wrapper should preserve raw transport output",
    );
    assert!(
        plan_contract_output.status.success(),
        "plan-contract wrapper should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        plan_contract_output.status,
        String::from_utf8_lossy(&plan_contract_output.stdout),
        String::from_utf8_lossy(&plan_contract_output.stderr)
    );
    let plan_contract_stdout = String::from_utf8_lossy(&plan_contract_output.stdout);
    assert!(plan_contract_stdout.contains("plan_path"));
    assert!(!plan_contract_stdout.contains(r#"C:\tmp\workspace"#));
    assert_args(
        &plan_contract_log,
        &[
            compat_launcher.to_string_lossy().as_ref(),
            "plan",
            "contract",
            "analyze-plan",
            "--spec",
            "docs/superpowers/specs/example.md",
            "--plan",
            "docs/superpowers/plans/example.md",
        ],
        "plan-contract wrapper",
    );

    let session_entry_log = tmp_root.path().join("session-entry-wrapper-bash.log");
    install_logged_bash(&git_bin_dir.join("bash.exe"));
    let session_entry_output = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(&session_entry, "resolve --message-file transcript.md"),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                session_entry_log.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_TEST_OUTPUT",
                "{\"outcome\":\"needs_user_choice\",\"decision_path\":\"/c/tmp/state/session-entry/using-superpowers/session-123\"}",
            ),
        ],
        "session-entry wrapper should preserve raw transport output",
    );
    assert!(
        session_entry_output.status.success(),
        "session-entry wrapper should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        session_entry_output.status,
        String::from_utf8_lossy(&session_entry_output.stdout),
        String::from_utf8_lossy(&session_entry_output.stderr)
    );
    let session_entry_stdout = String::from_utf8_lossy(&session_entry_output.stdout);
    assert!(
        session_entry_stdout.contains("session-entry/using-superpowers/session-123"),
        "session-entry wrapper should preserve raw JSON paths"
    );
    assert!(!session_entry_stdout.contains(r#"C:\tmp\state\session-entry"#));
    assert_args(
        &session_entry_log,
        &[
            compat_launcher.to_string_lossy().as_ref(),
            "session-entry",
            "resolve",
            "--message-file",
            "transcript.md",
        ],
        "session-entry wrapper",
    );

    let repo_safety_log = tmp_root.path().join("repo-safety-wrapper-bash.log");
    install_logged_bash(&git_bin_dir.join("bash.exe"));
    let repo_safety_output = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(
            &repo_safety,
            "check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/spec.md --write-target spec-artifact-write",
        ),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                repo_safety_log.to_string_lossy().as_ref(),
            ),
            (
                "SUPERPOWERS_TEST_OUTPUT",
                "{\"outcome\":\"blocked\",\"approval_path\":\"/c/tmp/state/projects/repo-safety/approval.json\"}",
            ),
        ],
        "repo-safety wrapper should preserve raw transport output",
    );
    assert!(
        repo_safety_output.status.success(),
        "repo-safety wrapper should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        repo_safety_output.status,
        String::from_utf8_lossy(&repo_safety_output.stdout),
        String::from_utf8_lossy(&repo_safety_output.stderr)
    );
    let repo_safety_stdout = String::from_utf8_lossy(&repo_safety_output.stdout);
    assert!(repo_safety_stdout.contains("approval.json"));
    assert!(!repo_safety_stdout.contains(r#"C:\tmp\state\projects\repo-safety"#));
    assert_args(
        &repo_safety_log,
        &[
            compat_launcher.to_string_lossy().as_ref(),
            "repo-safety",
            "check",
            "--intent",
            "write",
            "--stage",
            "superpowers:brainstorming",
            "--task-id",
            "spec-task",
            "--path",
            "docs/spec.md",
            "--write-target",
            "spec-artifact-write",
        ],
        "repo-safety wrapper",
    );

    let update_log = tmp_root.path().join("update-check-wrapper-bash.log");
    install_logged_exit_bash(&git_bin_dir.join("bash.exe"), 0);
    let update_check_output = run_pwsh(
        &pwsh,
        &powershell_wrapper_script(&update_check, "--force"),
        &[
            ("PATH", path_env.as_str()),
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                update_log.to_string_lossy().as_ref(),
            ),
        ],
        "update-check wrapper should preserve zero exit code",
    );
    assert_eq!(update_check_output.status.code(), Some(0));
    assert_args(
        &update_log,
        &[
            compat_launcher.to_string_lossy().as_ref(),
            "update-check",
            "--force",
        ],
        "update-check wrapper",
    );
}
