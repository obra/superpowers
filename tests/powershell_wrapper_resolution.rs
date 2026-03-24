use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};

use tempfile::TempDir;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn read_utf8(path: &Path) -> String {
    fs::read_to_string(path)
        .unwrap_or_else(|error| panic!("{} should read: {error}", path.display()))
}

fn assert_contains(content: &str, needle: &str, context: &str) {
    assert!(
        content.contains(needle),
        "{context} should contain {:?}",
        needle
    );
}

fn run(mut command: Command, context: &str) -> Output {
    command
        .output()
        .unwrap_or_else(|error| panic!("{context} should run: {error}"))
}

fn make_executable(path: &Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o755))
            .unwrap_or_else(|error| panic!("{} should be executable: {error}", path.display()));
    }
}

fn write_script(path: &Path, body: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .unwrap_or_else(|error| panic!("{} parent should exist: {error}", path.display()));
    }
    fs::write(path, body)
        .unwrap_or_else(|error| panic!("{} should write: {error}", path.display()));
    make_executable(path);
}

fn find_on_path(binary: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path) {
        let candidate = dir.join(binary);
        if candidate.is_file() {
            return Some(candidate);
        }
        #[cfg(windows)]
        {
            let candidate_exe = dir.join(format!("{binary}.exe"));
            if candidate_exe.is_file() {
                return Some(candidate_exe);
            }
        }
    }
    None
}

fn find_pwsh() -> Option<PathBuf> {
    find_on_path("pwsh").or_else(|| find_on_path("powershell"))
}

fn with_prepend_path(dirs: &[&Path]) -> OsString {
    let mut paths = dirs
        .iter()
        .map(|path| path.to_path_buf())
        .collect::<Vec<_>>();
    if let Some(existing) = std::env::var_os("PATH") {
        paths.extend(std::env::split_paths(&existing));
    }
    std::env::join_paths(paths).expect("PATH should join")
}

fn run_pwsh(
    pwsh_bin: &Path,
    path_value: &OsString,
    envs: &[(&str, &str)],
    command_text: &str,
    context: &str,
) -> Output {
    let mut command = Command::new(pwsh_bin);
    command
        .arg("-NoLogo")
        .arg("-NoProfile")
        .arg("-Command")
        .arg(command_text)
        .env("PATH", path_value);
    for (key, value) in envs {
        command.env(key, value);
    }
    run(command, context)
}

fn assert_success(output: &Output, context: &str) -> String {
    assert!(
        output.status.success(),
        "{context} should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    String::from_utf8(output.stdout.clone()).expect("stdout should be utf8")
}

fn wrapper_command(wrapper_path: &Path, invocation: &str) -> String {
    let wrapper = wrapper_path.to_string_lossy().replace('\'', "''");
    format!("& '{wrapper}' {invocation}")
}

fn bash_log_lines(log_path: &Path) -> Vec<String> {
    read_utf8(log_path).lines().map(str::to_owned).collect()
}

#[test]
fn powershell_wrapper_surface_contract_is_pinned_without_host_pwsh() {
    let root = repo_root();

    let helper = read_utf8(&root.join("bin/superpowers-pwsh-common.ps1"));
    for needle in [
        "function Get-SuperpowersBashPath",
        "function Convert-SuperpowersPathToBash",
        "function Convert-SuperpowersPathFromBash",
        "function Get-SuperpowersHostTarget",
        "function Resolve-SuperpowersRepoRuntimeBinary",
        "throw 'Could not find a compatible bash executable.",
    ] {
        assert_contains(&helper, needle, "bin/superpowers-pwsh-common.ps1");
    }

    let compat = read_utf8(&root.join("compat/powershell/superpowers.ps1"));
    for needle in [
        ". $CommonPath",
        "Normalize-SuperpowersCompatArgs",
        "Invoke-SuperpowersBashCompat",
        "Resolve-SuperpowersRepoRuntimeBinary",
        "SUPERPOWERS_PWSH_FORCE_BASH_COMPAT",
        "Get-SuperpowersBashPath",
        "Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot '..\\bash\\superpowers')",
        "& $Candidate @ForwardArgs",
        "Invoke-SuperpowersBashCompat -ForwardArgs $ForwardArgs",
        "$host.SetShouldExit([int]$ExitCode)",
    ] {
        assert_contains(&compat, needle, "compat/powershell/superpowers.ps1");
    }

    for (wrapper, forward_prefix) in [
        ("bin/superpowers-config.ps1", "@(\"config\") + $args"),
        (
            "bin/superpowers-migrate-install.ps1",
            "@(\"install\", \"migrate\") + $args",
        ),
        (
            "bin/superpowers-plan-contract.ps1",
            "@(\"plan\", \"contract\") + $args",
        ),
        (
            "bin/superpowers-plan-execution.ps1",
            "@(\"plan\", \"execution\") + $args",
        ),
        (
            "bin/superpowers-repo-safety.ps1",
            "@(\"repo-safety\") + $args",
        ),
        (
            "bin/superpowers-session-entry.ps1",
            "@(\"session-entry\") + $args",
        ),
        (
            "bin/superpowers-update-check.ps1",
            "@(\"update-check\") + $args",
        ),
        (
            "bin/superpowers-workflow-status.ps1",
            "@(\"workflow\", \"status\") + $args",
        ),
        ("bin/superpowers-workflow.ps1", "@(\"workflow\") + $args"),
    ] {
        let content = read_utf8(&root.join(wrapper));
        assert_contains(&content, "..\\compat\\powershell\\superpowers.ps1", wrapper);
        assert_contains(&content, forward_prefix, wrapper);
        assert_contains(&content, "& $CompatPath @ForwardArgs", wrapper);
    }

    let launcher = read_utf8(&root.join("bin/superpowers.ps1"));
    for needle in [
        "Get-SuperpowersHostTarget",
        "Resolve-SuperpowersRepoRuntimeBinary",
        "PSNativeCommandUseErrorActionPreference",
        "& $Candidate @args",
        "exit $ExitCode",
        "exit 127",
    ] {
        assert_contains(&launcher, needle, "bin/superpowers.ps1");
    }
}

#[test]
fn bash_workflow_status_wrapper_injects_status_subcommand() {
    let root = repo_root();
    let tmp_root = TempDir::new().expect("temp root should exist");
    let bin_dir = tmp_root.path().join("bin");
    let compat_dir = tmp_root.path().join("compat/bash");
    fs::create_dir_all(&bin_dir).expect("bin dir should exist");
    fs::create_dir_all(&compat_dir).expect("compat dir should exist");

    let wrapper_copy = bin_dir.join("superpowers-workflow-status");
    fs::copy(root.join("bin/superpowers-workflow-status"), &wrapper_copy)
        .expect("workflow-status wrapper should copy");
    make_executable(&wrapper_copy);

    let bash_log = tmp_root.path().join("workflow-status-wrapper-bash.log");
    write_logging_bash(
        &compat_dir.join("superpowers"),
        "{\"status\":\"needs_brainstorming\"}",
    );

    let output = run(
        {
            let mut command = Command::new(&wrapper_copy);
            command.env(
                "SUPERPOWERS_TEST_BASH_LOG",
                bash_log.to_string_lossy().as_ref(),
            );
            command.arg("--refresh");
            command
        },
        "bash workflow-status wrapper should inject canonical status subcommand",
    );
    let stdout = assert_success(
        &output,
        "bash workflow-status wrapper should inject canonical status subcommand",
    );
    assert!(
        stdout.contains("needs_brainstorming"),
        "bash workflow-status wrapper should preserve compat output"
    );

    let args = bash_log_lines(&bash_log);
    assert_eq!(
        args.iter().map(String::as_str).collect::<Vec<_>>(),
        ["workflow", "status", "--refresh"],
        "bash workflow-status wrapper should inject workflow status before user args",
    );
}

fn assert_bash_alias_wrapper_args(
    wrapper_name: &str,
    invocation: &[&str],
    expected_args: &[&str],
    context: &str,
) {
    let root = repo_root();
    let tmp_root = TempDir::new().expect("temp root should exist");
    let bin_dir = tmp_root.path().join("bin");
    let compat_dir = tmp_root.path().join("compat/bash");
    fs::create_dir_all(&bin_dir).expect("bin dir should exist");
    fs::create_dir_all(&compat_dir).expect("compat dir should exist");

    let wrapper_copy = bin_dir.join(wrapper_name);
    fs::copy(root.join("bin").join(wrapper_name), &wrapper_copy)
        .unwrap_or_else(|error| panic!("{context} wrapper should copy: {error}"));
    make_executable(&wrapper_copy);

    let bash_log = tmp_root.path().join(format!("{wrapper_name}.log"));
    write_logging_bash(&compat_dir.join("superpowers"), "{\"ok\":true}");

    let output = run(
        {
            let mut command = Command::new(&wrapper_copy);
            command
                .env(
                    "SUPERPOWERS_TEST_BASH_LOG",
                    bash_log.to_string_lossy().as_ref(),
                )
                .args(invocation);
            command
        },
        context,
    );
    let stdout = assert_success(&output, context);
    assert!(
        stdout.contains("\"ok\":true"),
        "{context} should preserve compat output"
    );

    let args = bash_log_lines(&bash_log);
    assert_eq!(
        args.iter().map(String::as_str).collect::<Vec<_>>(),
        expected_args,
        "{context} should dedupe the overlapping canonical prefix",
    );
}

#[test]
fn bash_alias_wrappers_dedupe_duplicate_canonical_prefixes() {
    for (wrapper_name, invocation, expected_args, context) in [
        (
            "superpowers-config",
            vec!["config", "list"],
            vec!["config", "list"],
            "bash config wrapper",
        ),
        (
            "superpowers-plan-contract",
            vec!["plan", "contract", "lint"],
            vec!["plan", "contract", "lint"],
            "bash plan-contract wrapper",
        ),
        (
            "superpowers-plan-execution",
            vec!["execution", "status", "--help"],
            vec!["plan", "execution", "status", "--help"],
            "bash plan-execution wrapper",
        ),
        (
            "superpowers-repo-safety",
            vec!["repo-safety", "check", "--intent", "read"],
            vec!["repo-safety", "check", "--intent", "read"],
            "bash repo-safety wrapper",
        ),
        (
            "superpowers-session-entry",
            vec!["session-entry", "resolve", "--message-file", "transcript.md"],
            vec!["session-entry", "resolve", "--message-file", "transcript.md"],
            "bash session-entry wrapper",
        ),
        (
            "superpowers-update-check",
            vec!["update-check", "--force"],
            vec!["update-check", "--force"],
            "bash update-check wrapper",
        ),
        (
            "superpowers-migrate-install",
            vec!["migrate", "--help"],
            vec!["install", "migrate", "--help"],
            "bash migrate-install wrapper",
        ),
        (
            "superpowers-slug",
            vec!["slug"],
            vec!["repo", "slug"],
            "bash slug wrapper",
        ),
    ] {
        assert_bash_alias_wrapper_args(wrapper_name, &invocation, &expected_args, context);
    }
}

fn write_logging_bash(path: &Path, output_payload: &str) {
    let payload = output_payload.replace('\'', r"'\''");
    write_script(
        path,
        &format!(
            "#!/bin/bash\nset -euo pipefail\nlog_file=\"${{SUPERPOWERS_TEST_BASH_LOG:?}}\"\n: > \"$log_file\"\nfor arg in \"$@\"; do\n  printf '%s\\n' \"$arg\" >> \"$log_file\"\ndone\nprintf '%s\\n' '{payload}'\n"
        ),
    );
}

fn write_exit_bash(path: &Path, exit_code: i32, output_payload: Option<&str>) {
    let mut body = String::from("#!/bin/bash\n");
    if let Some(payload) = output_payload {
        let escaped = payload.replace('\'', r"'\''");
        body.push_str(&format!("printf '%s\\n' '{escaped}'\n"));
    }
    body.push_str(&format!("exit {exit_code}\n"));
    write_script(path, &body);
}

fn assert_wrapper_forwards_args_and_output(
    pwsh_bin: &Path,
    path_value: &OsString,
    wrapper_path: &Path,
    bash_path: &Path,
    bash_log: &Path,
    invocation: &str,
    success_payload: &str,
    expected_output_fragment: &str,
    expected_args: &[&str],
    failure_exit: i32,
    failure_output: Option<&str>,
    failure_expected_fragment: Option<&str>,
    context: &str,
) {
    assert!(wrapper_path.is_file(), "{context} wrapper should exist");

    write_logging_bash(bash_path, success_payload);
    let success = run_pwsh(
        pwsh_bin,
        path_value,
        &[
            (
                "SUPERPOWERS_TEST_BASH_LOG",
                bash_log.to_string_lossy().as_ref(),
            ),
            ("SUPERPOWERS_TEST_OUTPUT", success_payload),
            ("SUPERPOWERS_PWSH_FORCE_BASH_COMPAT", "1"),
        ],
        &wrapper_command(wrapper_path, invocation),
        &format!("{context} success"),
    );
    let stdout = assert_success(&success, &format!("{context} success"));
    assert!(
        stdout.contains(expected_output_fragment),
        "{context} should preserve expected output fragment {expected_output_fragment:?}\nstdout:\n{stdout}"
    );
    assert!(
        !stdout.contains(r#"C:\tmp\workspace"#),
        "{context} should not rewrite raw transport paths\nstdout:\n{stdout}"
    );

    let args = bash_log_lines(bash_log);
    assert!(
        args.first()
            .is_some_and(|arg| arg.ends_with("/compat/bash/superpowers")),
        "{context} should invoke the canonical compat launcher first, got {:?}",
        args.first()
    );
    assert_eq!(
        args.iter().skip(1).map(String::as_str).collect::<Vec<_>>(),
        expected_args,
        "{context} should forward canonical subcommands unchanged"
    );

    write_exit_bash(bash_path, failure_exit, failure_output);
    let failure = run_pwsh(
        pwsh_bin,
        path_value,
        &[("SUPERPOWERS_PWSH_FORCE_BASH_COMPAT", "1")],
        &wrapper_command(wrapper_path, invocation),
        &format!("{context} failure"),
    );
    assert_eq!(
        failure.status.code(),
        Some(failure_exit),
        "{context} should preserve nonzero bash exit codes"
    );
    if let Some(fragment) = failure_expected_fragment {
        let stdout = String::from_utf8_lossy(&failure.stdout);
        assert!(
            stdout.contains(fragment),
            "{context} should preserve failure output fragment {fragment:?}\nstdout:\n{stdout}"
        );
    }
}

#[test]
fn powershell_wrappers_preserve_bash_selection_and_transport_contract() {
    if !cfg!(unix) {
        return;
    }
    let Some(pwsh_bin) = find_pwsh() else {
        return;
    };

    let root = repo_root();
    let helper = root.join("bin/superpowers-pwsh-common.ps1");
    let public_workflow_wrapper = root.join("bin/superpowers-workflow.ps1");
    let workflow_status_wrapper = root.join("bin/superpowers-workflow-status.ps1");
    let plan_execution_wrapper = root.join("bin/superpowers-plan-execution.ps1");
    let plan_contract_wrapper = root.join("bin/superpowers-plan-contract.ps1");
    let session_entry_wrapper = root.join("bin/superpowers-session-entry.ps1");
    let repo_safety_wrapper = root.join("bin/superpowers-repo-safety.ps1");
    let update_check_wrapper = root.join("bin/superpowers-update-check.ps1");

    let tmp_root = TempDir::new().expect("temp root should exist");
    let generic_dir = tmp_root.path().join("generic");
    let git_cmd_dir = tmp_root.path().join("Git/cmd");
    let git_bin_dir = tmp_root.path().join("Git/bin");
    let override_dir = tmp_root.path().join("override");
    fs::create_dir_all(&generic_dir).expect("generic dir should exist");
    fs::create_dir_all(&git_cmd_dir).expect("git cmd dir should exist");
    fs::create_dir_all(&git_bin_dir).expect("git bin dir should exist");
    fs::create_dir_all(&override_dir).expect("override dir should exist");

    write_script(&generic_dir.join("bash"), "#!/bin/bash\nexit 0\n");
    write_script(&git_cmd_dir.join("git"), "#!/bin/bash\nexit 0\n");
    write_script(&git_bin_dir.join("bash.exe"), "#!/bin/bash\nexit 0\n");
    write_script(&override_dir.join("bash"), "#!/bin/bash\nexit 0\n");

    let path_value = with_prepend_path(&[&generic_dir, &git_cmd_dir]);

    let helper_output = run_pwsh(
        &pwsh_bin,
        &path_value,
        &[],
        &format!(". '{}'; Get-SuperpowersBashPath", helper.to_string_lossy()),
        "Get-SuperpowersBashPath",
    );
    let selected = assert_success(&helper_output, "Get-SuperpowersBashPath");
    assert_eq!(
        selected.trim(),
        git_bin_dir.join("bash.exe").to_string_lossy()
    );

    let override_output = run_pwsh(
        &pwsh_bin,
        &path_value,
        &[(
            "SUPERPOWERS_BASH_PATH",
            override_dir.join("bash").to_string_lossy().as_ref(),
        )],
        &format!(". '{}'; Get-SuperpowersBashPath", helper.to_string_lossy()),
        "Get-SuperpowersBashPath override",
    );
    let selected_override = assert_success(&override_output, "Get-SuperpowersBashPath override");
    assert_eq!(
        selected_override.trim(),
        override_dir.join("bash").to_string_lossy()
    );

    assert_wrapper_forwards_args_and_output(
        &pwsh_bin,
        &path_value,
        &public_workflow_wrapper,
        &git_bin_dir.join("bash.exe"),
        &tmp_root.path().join("public-workflow.log"),
        "status",
        "Workflow status: Brainstorming needed\nWhy: No current workflow artifacts are available yet.\nNext: Use superpowers:brainstorming",
        "Workflow status: Brainstorming needed",
        &["workflow", "status"],
        9,
        Some(
            "Workflow inspection failed: Read-only workflow resolution requires a git repo.\nDebug:\n- failure_class=RepoContextUnavailable",
        ),
        Some("failure_class=RepoContextUnavailable"),
        "public workflow wrapper",
    );
    assert_wrapper_forwards_args_and_output(
        &pwsh_bin,
        &path_value,
        &workflow_status_wrapper,
        &git_bin_dir.join("bash.exe"),
        &tmp_root.path().join("workflow-status.log"),
        "--plan docs/superpowers/plans/example.md",
        r#"{"status":"needs_brainstorming","next_skill":"superpowers:brainstorming","root":"/c/tmp/workspace"}"#,
        r#""/c/tmp/workspace""#,
        &[
            "workflow",
            "status",
            "--plan",
            "docs/superpowers/plans/example.md",
        ],
        7,
        None,
        None,
        "workflow status wrapper",
    );
    assert_wrapper_forwards_args_and_output(
        &pwsh_bin,
        &path_value,
        &plan_execution_wrapper,
        &git_bin_dir.join("bash.exe"),
        &tmp_root.path().join("plan-execution.log"),
        "status --plan docs/superpowers/plans/example.md",
        r#"{"execution_mode":"none","execution_started":"no","root":"/c/tmp/workspace"}"#,
        r#""/c/tmp/workspace""#,
        &[
            "plan",
            "execution",
            "status",
            "--plan",
            "docs/superpowers/plans/example.md",
        ],
        7,
        None,
        None,
        "plan execution wrapper",
    );
    assert_wrapper_forwards_args_and_output(
        &pwsh_bin,
        &path_value,
        &plan_contract_wrapper,
        &git_bin_dir.join("bash.exe"),
        &tmp_root.path().join("plan-contract.log"),
        "analyze-plan --spec docs/superpowers/specs/example.md --plan docs/superpowers/plans/example.md",
        r#"{"plan_path":"docs/superpowers/plans/example.md","root":"/c/tmp/workspace"}"#,
        r#""/c/tmp/workspace""#,
        &[
            "plan",
            "contract",
            "analyze-plan",
            "--spec",
            "docs/superpowers/specs/example.md",
            "--plan",
            "docs/superpowers/plans/example.md",
        ],
        8,
        None,
        None,
        "plan contract wrapper",
    );
    assert_wrapper_forwards_args_and_output(
        &pwsh_bin,
        &path_value,
        &session_entry_wrapper,
        &git_bin_dir.join("bash.exe"),
        &tmp_root.path().join("session-entry.log"),
        "resolve --message-file transcript.md",
        r#"{"outcome":"needs_user_choice","decision_path":"/c/tmp/state/session-entry/using-superpowers/session-123"}"#,
        r#""/c/tmp/state/session-entry/using-superpowers/session-123""#,
        &[
            "session-entry",
            "resolve",
            "--message-file",
            "transcript.md",
        ],
        6,
        None,
        None,
        "session entry wrapper",
    );
    assert_wrapper_forwards_args_and_output(
        &pwsh_bin,
        &path_value,
        &repo_safety_wrapper,
        &git_bin_dir.join("bash.exe"),
        &tmp_root.path().join("repo-safety.log"),
        "check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/spec.md --write-target spec-artifact-write",
        r#"{"outcome":"blocked","approval_path":"/c/tmp/state/projects/repo-safety/approval.json"}"#,
        r#""/c/tmp/state/projects/repo-safety/approval.json""#,
        &[
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
        7,
        None,
        None,
        "repo safety wrapper",
    );
    assert_wrapper_forwards_args_and_output(
        &pwsh_bin,
        &path_value,
        &update_check_wrapper,
        &git_bin_dir.join("bash.exe"),
        &tmp_root.path().join("update-check.log"),
        "--force",
        "",
        "",
        &["update-check", "--force"],
        0,
        None,
        None,
        "update-check wrapper",
    );
}

#[test]
fn powershell_wrappers_prefer_native_runtime_when_bash_is_unavailable() {
    if !cfg!(unix) {
        return;
    }
    let Some(pwsh_bin) = find_pwsh() else {
        return;
    };

    let root = repo_root();
    let path_value = with_prepend_path(&[]);
    let workflow_wrapper = root.join("bin/superpowers-workflow.ps1");
    let workflow_status_wrapper = root.join("bin/superpowers-workflow-status.ps1");

    let workflow_help = run_pwsh(
        &pwsh_bin,
        &path_value,
        &[("SUPERPOWERS_BASH_PATH", "/definitely/missing/bash")],
        &wrapper_command(&workflow_wrapper, "workflow help"),
        "workflow PowerShell wrapper should prefer native runtime",
    );
    let workflow_stdout = assert_success(
        &workflow_help,
        "workflow PowerShell wrapper should prefer native runtime",
    );
    assert!(
        workflow_stdout.contains("Usage: superpowers workflow <COMMAND>"),
        "workflow wrapper should still serve workflow help through the native runtime:\n{workflow_stdout}"
    );

    let status_help = run_pwsh(
        &pwsh_bin,
        &path_value,
        &[("SUPERPOWERS_BASH_PATH", "/definitely/missing/bash")],
        &wrapper_command(&workflow_status_wrapper, "status --help"),
        "workflow-status PowerShell wrapper should dedupe duplicate status prefix and prefer native runtime",
    );
    let status_stdout = assert_success(
        &status_help,
        "workflow-status PowerShell wrapper should dedupe duplicate status prefix and prefer native runtime",
    );
    assert!(
        status_stdout.contains("Usage: superpowers workflow status"),
        "workflow-status wrapper should serve status help through the native runtime:\n{status_stdout}"
    );
}
