#[path = "support/prebuilt.rs"]
mod prebuilt_support;
#[path = "support/process.rs"]
mod process_support;

use assert_cmd::Command as AssertCommand;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;
use tempfile::TempDir;

use prebuilt_support::{
    PrebuiltManifestEntry, sha256_checksum_line, write_prebuilt_artifact, write_prebuilt_manifest,
};
use process_support::{repo_root, run, run_checked};

fn read_utf8(path: impl AsRef<Path>) -> String {
    fs::read_to_string(path.as_ref())
        .unwrap_or_else(|error| panic!("{} should be readable: {error}", path.as_ref().display()))
}

fn assert_contains(content: &str, needle: &str, label: &str) {
    assert!(
        content.contains(needle),
        "{label} should contain {:?}",
        needle
    );
}

fn assert_not_contains(content: &str, needle: &str, label: &str) {
    assert!(
        !content.contains(needle),
        "{label} should not contain {:?}",
        needle
    );
}

fn assert_file_contains(path: impl AsRef<Path>, needle: &str) {
    let path_ref = path.as_ref();
    let content = read_utf8(path_ref);
    assert_contains(&content, needle, &path_ref.display().to_string());
}

fn assert_file_not_contains(path: impl AsRef<Path>, needle: &str) {
    let path_ref = path.as_ref();
    let content = read_utf8(path_ref);
    assert_not_contains(&content, needle, &path_ref.display().to_string());
}

fn assert_description_contains(path: impl AsRef<Path>, needle: &str) {
    let path_ref = path.as_ref();
    let content = read_utf8(path_ref);
    let first_lines = content.lines().take(6).collect::<Vec<_>>().join("\n");
    assert_contains(&first_lines, needle, &path_ref.display().to_string());
}

fn extract_bash_block(content: &str, heading: &str) -> String {
    let mut in_heading = false;
    let mut in_block = false;
    let mut lines = Vec::new();

    for line in content.lines() {
        if !in_heading {
            if line == heading {
                in_heading = true;
            }
            continue;
        }
        if !in_block {
            if line == "```bash" {
                in_block = true;
            }
            continue;
        }
        if line == "```" {
            break;
        }
        lines.push(line);
    }

    assert!(
        !lines.is_empty(),
        "expected bash block under heading {heading}"
    );
    lines.join("\n")
}

fn make_runtime_root(dir: &Path) {
    fs::create_dir_all(dir.join("bin")).expect("runtime bin dir should exist");
    fs::write(
        dir.join("bin/superpowers"),
        "#!/usr/bin/env bash\ncase \"${1:-}\" in\n  update-check)\n    exit 0\n    ;;\n  config)\n    exit 0\n    ;;\n  *)\n    exit 0\n    ;;\nesac\n",
    )
    .expect("runtime launcher should be writable");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            dir.join("bin/superpowers"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("runtime launcher should be executable");
    }
    fs::write(dir.join("VERSION"), "5.1.0\n").expect("VERSION should be writable");
}

fn make_executable(path: &Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o755))
            .expect("path should be executable");
    }
    #[cfg(not(unix))]
    {
        let _ = path;
    }
}

fn make_runtime_repo(dir: &Path) {
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(dir);
    run_checked(git_init, "git init runtime repo");
    make_runtime_root(dir);
}

fn copy_repo_launcher(temp_root: &Path) -> PathBuf {
    let launcher = temp_root.join("bin").join("superpowers");
    let common = temp_root.join("bin").join("superpowers-runtime-common.sh");
    fs::create_dir_all(launcher.parent().expect("launcher parent should exist"))
        .expect("launcher parent should be creatable");
    fs::copy(repo_root().join("bin/superpowers"), &launcher).expect("launcher should copy");
    fs::copy(
        repo_root().join("bin/superpowers-runtime-common.sh"),
        &common,
    )
    .expect("launcher common should copy");
    make_executable(&launcher);
    make_executable(&common);
    launcher
}

fn copy_repo_powershell_launcher(temp_root: &Path) -> PathBuf {
    let launcher = temp_root.join("bin").join("superpowers.ps1");
    let common = temp_root.join("bin").join("superpowers-pwsh-common.ps1");
    fs::create_dir_all(launcher.parent().expect("launcher parent should exist"))
        .expect("launcher parent should be creatable");
    fs::copy(repo_root().join("bin/superpowers.ps1"), &launcher)
        .expect("powershell launcher should copy");
    fs::copy(repo_root().join("bin/superpowers-pwsh-common.ps1"), &common)
        .expect("powershell common should copy");
    launcher
}

fn pwsh_bin() -> Option<&'static str> {
    ["pwsh", "powershell"].into_iter().find(|candidate| {
        Command::new(candidate)
            .args([
                "-NoLogo",
                "-NoProfile",
                "-Command",
                "$PSVersionTable.PSVersion.ToString()",
            ])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    })
}

fn run_pwsh_launcher(
    pwsh: &str,
    launcher: &Path,
    cwd: &Path,
    args: &[&str],
    context: &str,
) -> std::process::Output {
    let mut command = Command::new(pwsh);
    command
        .args([
            "-NoLogo",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
        ])
        .arg(launcher)
        .current_dir(cwd)
        .args(args);
    run(command, context)
}

#[test]
fn repo_checkout_ships_the_canonical_runtime_launcher() {
    let launcher = repo_root().join("bin/superpowers");
    assert!(
        launcher.is_file(),
        "repo checkout should expose bin/superpowers because install docs and generated skill preambles use it as the canonical repo-local launcher"
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = fs::metadata(&launcher)
            .expect("repo-local launcher should be stat-able")
            .permissions()
            .mode();
        assert!(
            mode & 0o111 != 0,
            "repo-local launcher should be executable on unix hosts"
        );
    }
}

#[test]
fn repo_checkout_canonical_launcher_runs_without_recursive_fallback() {
    let output = AssertCommand::new(repo_root().join("bin/superpowers"))
        .current_dir(repo_root())
        .timeout(Duration::from_secs(2))
        .arg("--version")
        .unwrap();

    assert!(
        output.status.success(),
        "repo-local launcher should resolve to a real runtime binary instead of recursing through compat wrappers\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains(env!("CARGO_PKG_VERSION")),
        "repo-local launcher should print the current runtime version, got:\n{stdout}"
    );
}

#[test]
fn repo_checkout_canonical_launcher_avoids_non_binary_repo_fallbacks() {
    let bash_launcher = repo_root().join("bin/superpowers");
    let powershell_launcher = repo_root().join("bin/superpowers.ps1");

    for path in [&bash_launcher, &powershell_launcher] {
        assert_file_not_contains(path, "cargo run");
        assert_file_not_contains(path, "SUPERPOWERS_COMPAT_BIN");
        assert_file_not_contains(path, ".superpowers/install");
        assert_file_not_contains(path, "target/debug");
        assert_file_not_contains(path, "target/release");
    }
}

#[test]
fn repo_checkout_canonical_launcher_uses_manifest_selected_binary_path() {
    let temp_root = TempDir::new().expect("temp runtime root should exist");
    let binary_rel = "bin/prebuilt/darwin-arm64/nested/runtime/superpowers";
    let checksum_rel = "bin/prebuilt/darwin-arm64/nested/runtime/superpowers.sha256";
    let binary_contents = "#!/usr/bin/env bash\necho 'superpowers manifest-selected'\n";
    copy_repo_launcher(temp_root.path());
    write_prebuilt_artifact(
        temp_root.path(),
        binary_rel,
        checksum_rel,
        binary_contents,
        &sha256_checksum_line("superpowers", binary_contents),
    );
    write_prebuilt_manifest(
        temp_root.path(),
        env!("CARGO_PKG_VERSION"),
        &[PrebuiltManifestEntry {
            target: "darwin-arm64",
            binary_path: binary_rel,
            checksum_path: checksum_rel,
        }],
    );

    let output = AssertCommand::new(temp_root.path().join("bin/superpowers"))
        .current_dir(temp_root.path())
        .timeout(Duration::from_secs(2))
        .arg("--version")
        .unwrap();

    assert!(
        output.status.success(),
        "manifest-selected launcher path should run successfully\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout),
        "superpowers manifest-selected\n"
    );
}

#[test]
fn repo_checkout_canonical_launcher_rejects_stale_prebuilt_checksum() {
    let temp_root = TempDir::new().expect("temp runtime root should exist");
    let binary_rel = "bin/prebuilt/darwin-arm64/superpowers";
    let checksum_rel = "bin/prebuilt/darwin-arm64/superpowers.sha256";
    copy_repo_launcher(temp_root.path());
    write_prebuilt_artifact(
        temp_root.path(),
        binary_rel,
        checksum_rel,
        "#!/usr/bin/env bash\necho 'superpowers stale checksum'\n",
        "0000000000000000000000000000000000000000000000000000000000000000  superpowers\n",
    );
    write_prebuilt_manifest(
        temp_root.path(),
        env!("CARGO_PKG_VERSION"),
        &[PrebuiltManifestEntry {
            target: "darwin-arm64",
            binary_path: binary_rel,
            checksum_path: checksum_rel,
        }],
    );

    let output = AssertCommand::new(temp_root.path().join("bin/superpowers"))
        .current_dir(temp_root.path())
        .timeout(Duration::from_secs(2))
        .arg("--version")
        .unwrap_err();

    let rendered = output.to_string();
    assert!(
        rendered.contains("checksum") || rendered.contains("sha256"),
        "stale prebuilt checksum failure should mention checksum verification, got:\n{rendered}"
    );
}

#[test]
fn repo_checkout_powershell_launcher_uses_manifest_selected_binary_path() {
    let Some(pwsh) = pwsh_bin() else {
        eprintln!(
            "Skipping PowerShell launcher manifest test: no pwsh or powershell binary found."
        );
        return;
    };

    let temp_root = TempDir::new().expect("temp runtime root should exist");
    let binary_rel = "bin/prebuilt/darwin-arm64/nested/runtime/superpowers";
    let checksum_rel = "bin/prebuilt/darwin-arm64/nested/runtime/superpowers.sha256";
    let binary_contents = "#!/usr/bin/env bash\necho 'superpowers powershell manifest-selected'\n";
    let launcher = copy_repo_powershell_launcher(temp_root.path());
    write_prebuilt_artifact(
        temp_root.path(),
        binary_rel,
        checksum_rel,
        binary_contents,
        &sha256_checksum_line("superpowers", binary_contents),
    );
    write_prebuilt_manifest(
        temp_root.path(),
        env!("CARGO_PKG_VERSION"),
        &[PrebuiltManifestEntry {
            target: "darwin-arm64",
            binary_path: binary_rel,
            checksum_path: checksum_rel,
        }],
    );

    let output = run_pwsh_launcher(
        pwsh,
        &launcher,
        temp_root.path(),
        &["--version"],
        "powershell manifest-selected launcher",
    );
    assert!(
        output.status.success(),
        "manifest-selected PowerShell launcher path should run successfully\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8_lossy(&output.stdout),
        "superpowers powershell manifest-selected\n"
    );
}

#[test]
fn repo_checkout_powershell_launcher_rejects_stale_prebuilt_checksum() {
    let Some(pwsh) = pwsh_bin() else {
        eprintln!(
            "Skipping PowerShell launcher checksum test: no pwsh or powershell binary found."
        );
        return;
    };

    let temp_root = TempDir::new().expect("temp runtime root should exist");
    let binary_rel = "bin/prebuilt/darwin-arm64/superpowers";
    let checksum_rel = "bin/prebuilt/darwin-arm64/superpowers.sha256";
    let launcher = copy_repo_powershell_launcher(temp_root.path());
    write_prebuilt_artifact(
        temp_root.path(),
        binary_rel,
        checksum_rel,
        "#!/usr/bin/env bash\necho 'superpowers powershell stale checksum'\n",
        "0000000000000000000000000000000000000000000000000000000000000000  superpowers\n",
    );
    write_prebuilt_manifest(
        temp_root.path(),
        env!("CARGO_PKG_VERSION"),
        &[PrebuiltManifestEntry {
            target: "darwin-arm64",
            binary_path: binary_rel,
            checksum_path: checksum_rel,
        }],
    );

    let output = run_pwsh_launcher(
        pwsh,
        &launcher,
        temp_root.path(),
        &["--version"],
        "powershell stale checksum launcher",
    );
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        !output.status.success(),
        "stale checksum should fail closed for PowerShell launcher\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        stderr
    );
    assert!(
        stderr.contains("checksum") || stderr.contains("sha256"),
        "stale prebuilt checksum failure should mention checksum verification, got:\n{stderr}"
    );
}

#[test]
fn repo_checkout_powershell_launcher_preserves_native_exit_code_with_psnative_preference() {
    let Some(pwsh) = pwsh_bin() else {
        eprintln!(
            "Skipping PowerShell launcher exit-code test: no pwsh or powershell binary found."
        );
        return;
    };

    let temp_root = TempDir::new().expect("temp runtime root should exist");
    let binary_rel = "bin/prebuilt/darwin-arm64/superpowers";
    let checksum_rel = "bin/prebuilt/darwin-arm64/superpowers.sha256";
    let binary_contents = "#!/usr/bin/env bash\nexit 42\n";
    let launcher = copy_repo_powershell_launcher(temp_root.path());
    write_prebuilt_artifact(
        temp_root.path(),
        binary_rel,
        checksum_rel,
        binary_contents,
        &sha256_checksum_line("superpowers", binary_contents),
    );
    write_prebuilt_manifest(
        temp_root.path(),
        env!("CARGO_PKG_VERSION"),
        &[PrebuiltManifestEntry {
            target: "darwin-arm64",
            binary_path: binary_rel,
            checksum_path: checksum_rel,
        }],
    );

    let launcher_escaped = launcher.to_string_lossy().replace('\'', "''");
    let script = format!(
        "$PSNativeCommandUseErrorActionPreference = $true; & '{launcher_escaped}' --version; exit $LASTEXITCODE"
    );
    let output = run(
        {
            let mut command = Command::new(pwsh);
            command
                .args(["-NoLogo", "-NoProfile", "-Command"])
                .arg(script)
                .current_dir(temp_root.path());
            command
        },
        "powershell launcher should preserve native exit codes when PSNativeCommandUseErrorActionPreference is enabled",
    );
    assert_eq!(
        output.status.code(),
        Some(42),
        "PowerShell launcher should preserve native runtime exit codes even when PSNativeCommandUseErrorActionPreference is enabled\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn runtime_instruction_docs_point_at_rust_as_the_primary_oracle() {
    let readme = repo_root().join("README.md");
    let docs_testing = repo_root().join("docs/testing.md");

    let readme_content = read_utf8(&readme);
    let docs_testing_content = read_utf8(&docs_testing);

    assert_contains(
        &readme_content,
        "cargo nextest run --test workflow_runtime",
        "README.md",
    );
    assert_contains(
        &readme_content,
        "--test runtime_instruction_contracts --test using_superpowers_skill",
        "README.md",
    );
    assert_contains(
        &readme_content,
        "--test powershell_wrapper_resolution --test upgrade_skill",
        "README.md",
    );
    assert_not_contains(
        &readme_content,
        "bash tests/codex-runtime/test-runtime-instructions.sh",
        "README.md",
    );
    assert_not_contains(
        &readme_content,
        "bash tests/codex-runtime/test-workflow-sequencing.sh",
        "README.md",
    );
    assert_not_contains(
        &readme_content,
        "bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh",
        "README.md",
    );
    assert_not_contains(
        &readme_content,
        "bash tests/codex-runtime/test-superpowers-upgrade-skill.sh",
        "README.md",
    );

    assert_contains(
        &docs_testing_content,
        "cargo nextest run --test runtime_instruction_contracts --test using_superpowers_skill",
        "docs/testing.md",
    );
    for legacy_command in [
        "bash tests/codex-runtime/test-runtime-instructions.sh",
        "bash tests/codex-runtime/test-workflow-enhancements.sh",
        "bash tests/codex-runtime/test-workflow-sequencing.sh",
        "bash tests/codex-runtime/test-using-superpowers-bypass.sh",
        "bash tests/codex-runtime/test-superpowers-session-entry-gate.sh",
        "bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh",
        "bash tests/codex-runtime/test-superpowers-upgrade-skill.sh",
    ] {
        assert_not_contains(&docs_testing_content, legacy_command, "docs/testing.md");
    }
    assert_contains(
        &docs_testing_content,
        "Legacy `tests/codex-runtime/*.sh` harnesses have been removed",
        "docs/testing.md",
    );
}

#[test]
fn runtime_instruction_surface_contracts_and_generation_checks_hold() {
    let root = repo_root();

    for required in [
        "README.md",
        ".codex/INSTALL.md",
        ".copilot/INSTALL.md",
        "docs/testing.md",
        "review/checklist.md",
        "review/review-accelerator-packet-contract.md",
        "qa/references/issue-taxonomy.md",
        "qa/templates/qa-report-template.md",
        "tests/runtime_instruction_contracts.rs",
        "tests/using_superpowers_skill.rs",
        "tests/powershell_wrapper_resolution.rs",
        "tests/upgrade_skill.rs",
    ] {
        assert!(
            root.join(required).is_file(),
            "{} should exist",
            root.join(required).display()
        );
    }

    for retired in [
        ".claude-plugin",
        ".cursor-plugin",
        ".opencode/INSTALL.md",
        "docs/README.opencode.md",
        "docs/windows/polyglot-hooks.md",
        "hooks",
        "tests/explicit-skill-requests",
        "tests/skill-triggering",
        "tests/claude-code",
        "tests/opencode",
        "tests/subagent-driven-dev",
    ] {
        assert!(
            !root.join(retired).exists(),
            "{} should remain absent",
            root.join(retired).display()
        );
    }

    let active_doc_files = [
        "README.md",
        ".codex/INSTALL.md",
        ".copilot/INSTALL.md",
        "docs/README.codex.md",
        "docs/README.copilot.md",
        "skills/plan-ceo-review/SKILL.md",
        "skills/plan-eng-review/SKILL.md",
        "skills/using-superpowers/SKILL.md",
        "skills/using-git-worktrees/SKILL.md",
        "skills/subagent-driven-development/SKILL.md",
        "skills/dispatching-parallel-agents/SKILL.md",
        "skills/using-superpowers/references/codex-tools.md",
    ];
    let banned_terms = [
        "cursor",
        "opencode",
        "Skill tool",
        "Task tool",
        "TodoWrite",
        ".claude/",
    ];
    for file in active_doc_files {
        let content = read_utf8(root.join(file));
        for term in banned_terms {
            let allowed = content.contains(
                "Legacy Claude, Cursor, and OpenCode-specific loading flows are intentionally unsupported in this runtime package.",
            ) || content.contains(
                "Legacy prompt docs such as `CLAUDE.md` are intentionally unsupported in this runtime workflow.",
            );
            if !allowed {
                assert_not_contains(&content.to_lowercase(), &term.to_lowercase(), file);
            }
        }
    }

    let mut windows_docs_check = Command::new("rg");
    windows_docs_check
        .args([
            "-nP",
            r"bin\\superpowers-(migrate-install|config|update-check)(?!\.ps1)",
            "README.md",
            ".codex/INSTALL.md",
            ".copilot/INSTALL.md",
            "docs/README.codex.md",
            "docs/README.copilot.md",
        ])
        .current_dir(&root);
    let windows_docs_output = run(windows_docs_check, "windows helper doc contract");
    assert!(
        !windows_docs_output.status.success(),
        "windows-facing docs should not reference bare bash helper paths\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&windows_docs_output.stdout),
        String::from_utf8_lossy(&windows_docs_output.stderr)
    );

    for (path, canonical_commands, retired_forms) in [
        (
            ".codex/INSTALL.md",
            [
                "~/.superpowers/install/bin/superpowers install migrate",
                "~/.superpowers/install/bin/superpowers config set superpowers_contributor true",
                "~/.superpowers/install/bin/superpowers config set update_check true",
                "~/.superpowers/install/bin/superpowers update-check",
            ],
            [
                "~/.superpowers/install/bin/superpowers-migrate-install",
                "~/.superpowers/install/bin/superpowers-config",
                "~/.superpowers/install/bin/superpowers-update-check",
            ],
        ),
        (
            ".copilot/INSTALL.md",
            [
                "~/.superpowers/install/bin/superpowers install migrate",
                "~/.superpowers/install/bin/superpowers config set superpowers_contributor true",
                "~/.superpowers/install/bin/superpowers config set update_check true",
                "~/.superpowers/install/bin/superpowers update-check",
            ],
            [
                "~/.superpowers/install/bin/superpowers-migrate-install",
                "~/.superpowers/install/bin/superpowers-config",
                "~/.superpowers/install/bin/superpowers-update-check",
            ],
        ),
    ] {
        let content = read_utf8(root.join(path));
        for command in canonical_commands {
            assert_contains(&content, command, path);
        }
        for retired in retired_forms {
            assert_not_contains(&content, retired, path);
        }
    }

    let release_notes = read_utf8(root.join("RELEASE-NOTES.md"));
    let latest_release_version = release_notes
        .lines()
        .find_map(|line| {
            line.strip_prefix("## v")
                .and_then(|rest| rest.split_once(" (").map(|(version, _)| version.to_owned()))
        })
        .expect("release notes should contain a version heading");
    let runtime_version = read_utf8(root.join("VERSION")).trim().to_owned();
    assert_eq!(runtime_version, latest_release_version);

    let mut gen_skills = Command::new("node");
    gen_skills
        .args(["scripts/gen-skill-docs.mjs", "--check"])
        .current_dir(&root);
    run_checked(gen_skills, "gen-skill-docs --check");

    let mut gen_agents = Command::new("node");
    gen_agents
        .args(["scripts/gen-agent-docs.mjs", "--check"])
        .current_dir(&root);
    run_checked(gen_agents, "gen-agent-docs --check");

    assert_file_contains(root.join("README.md"), "superpowers session-entry");
    assert_file_contains(root.join("README.md"), "superpowers repo-safety");
    assert_file_contains(root.join("README.md"), "superpowers plan contract");
    assert_file_contains(root.join("README.md"), "protected branches");
    assert_file_contains(root.join("README.md"), "Six layers matter:");
    assert_file_contains(
        root.join("docs/README.codex.md"),
        "Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.",
    );
    assert_file_contains(
        root.join("docs/README.copilot.md"),
        "Accelerated review is an opt-in branch inside `plan-ceo-review` and `plan-eng-review`, not a separate workflow stage.",
    );
    assert_file_contains(
        root.join("review/review-accelerator-packet-contract.md"),
        "required packet fields",
    );
    assert_file_contains(
        root.join("review/review-accelerator-packet-contract.md"),
        "fail-closed validation rule",
    );
    assert_file_contains(
        root.join("review/review-accelerator-packet-contract.md"),
        "main-agent-only write authority",
    );
}

#[test]
fn workflow_enhancement_contracts_are_documented_consistently() {
    let root = repo_root();

    for (file, patterns) in [
        (
            "review/checklist.md",
            vec![
                "Pre-Landing Review Checklist",
                "SQL & Data Safety",
                "Enum & Value Completeness",
                "Documentation Staleness",
                "TODO Cross-Reference",
                "Built-in Before Bespoke / Known Pattern Footguns",
                "Spec / Plan Delivery Content",
                "Release Readiness",
            ],
        ),
        (
            "skills/requesting-code-review/code-reviewer.md",
            vec![
                "{BASE_BRANCH}",
                "built-in-before-bespoke",
                "known pattern footguns",
                "completed task packets",
                "missing tests for `VERIFY-*` requirements",
                "official documentation",
                "issue trackers or maintainer guidance",
                "primary-source technical references",
                "file:line",
            ],
        ),
        (
            "skills/qa-only/SKILL.md",
            vec![
                "playwright",
                "diff-aware",
                "Health Score",
                "qa-report",
                "Known ecosystem issue lookup (optional)",
                "label the result as a hypothesis, not a fix",
                "do not block the report if search is unavailable",
                "# QA Result",
            ],
        ),
        (
            "skills/document-release/SKILL.md",
            vec![
                "CHANGELOG",
                "NEVER CLOBBER CHANGELOG ENTRIES",
                "discoverability",
                "RELEASE-NOTES.md",
                "release-readiness",
                "rollout notes",
                "rollback notes",
                "known risks or operator-facing caveats",
                "# Release Readiness Result",
                "Require the exact approved plan path from the current workflow context before writing the release-readiness artifact.",
                "Derive `Source Plan` and `Source Plan Revision` from that exact approved plan",
            ],
        ),
        (
            "skills/finishing-a-development-branch/SKILL.md",
            vec![
                "superpowers:requesting-code-review",
                "superpowers:qa-only",
                "superpowers:document-release",
                "Conditional Pre-Landing QA Gate",
                "Required release-readiness pass for workflow-routed work before completion",
                "superpowers repo-safety check --intent write",
                "Run `superpowers plan execution gate-review --plan <approved-plan-path>` before late-stage QA or release routing.",
                "If the current work is governed by an approved Superpowers plan, after `superpowers:document-release` and any required `superpowers:qa-only` handoff are current, run `superpowers plan execution gate-finish --plan <approved-plan-path>` before presenting completion options.",
                "If the current work is not governed by an approved Superpowers plan, skip this helper-owned finish gate and continue with the normal completion flow.",
            ],
        ),
    ] {
        for pattern in patterns {
            assert_file_contains(root.join(file), pattern);
        }
    }

    assert_file_not_contains(
        root.join("skills/document-release/SKILL.md"),
        "|| echo main",
    );
    assert_file_contains(
        root.join("skills/document-release/SKILL.md"),
        "Do not use PR metadata or repo default-branch APIs as a fallback",
    );
    assert_file_not_contains(root.join("skills/document-release/SKILL.md"), "gh pr view");
    assert_file_not_contains(
        root.join("skills/document-release/SKILL.md"),
        "defaultBranchRef",
    );
    assert_file_not_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "If Step 1.9 already routed through `superpowers:document-release`",
    );
    assert_file_contains(
        root.join("tests/evals/using-superpowers-routing.scenarios.md"),
        "branch-completion language still routes to `requesting-code-review` when no fresh final review artifact exists",
    );
    assert_file_contains(
        root.join("tests/evals/using-superpowers-routing.orchestrator.md"),
        "Use the real repo-versioned `using-superpowers` entry contract and skill/runtime surfaces from the branch under test",
    );
    assert_file_contains(
        root.join("tests/evals/using-superpowers-routing.orchestrator.md"),
        "Pass the absolute branch-under-test repo root into both runner and judge prompts.",
    );
    assert_file_contains(
        root.join("tests/evals/using-superpowers-routing.orchestrator.md"),
        "invoke `<BRANCH_UNDER_TEST_ROOT>/bin/superpowers` explicitly",
    );
    assert_file_contains(
        root.join("tests/evals/using-superpowers-routing.runner.md"),
        "Use the real repo-versioned `using-superpowers` entry contract and skill/runtime surfaces from the branch under test",
    );
    assert_file_contains(
        root.join("tests/evals/using-superpowers-routing.runner.md"),
        "The controller must pass `BRANCH_UNDER_TEST_ROOT` as an absolute path.",
    );
    assert_file_contains(
        root.join("tests/evals/using-superpowers-routing.runner.md"),
        "Do not rely on temp-fixture runtime-root autodetection or any home-install fallback.",
    );
    assert_file_not_contains(
        root.join("tests/evals/using-superpowers-routing.scenarios.md"),
        "| P3 |",
    );
}

#[test]
fn workflow_sequencing_contracts_and_fixtures_are_documented_consistently() {
    let root = repo_root();

    assert_description_contains(
        root.join("skills/brainstorming/SKILL.md"),
        "exploring a feature idea, behavior change, or architecture direction",
    );
    assert_file_contains(
        root.join("skills/brainstorming/SKILL.md"),
        "\"$_SUPERPOWERS_ROOT/bin/superpowers\" workflow expect --artifact spec --path",
    );
    assert_file_contains(
        root.join("skills/brainstorming/SKILL.md"),
        "Landscape Awareness",
    );
    assert_file_contains(
        root.join("skills/brainstorming/SKILL.md"),
        "### Decision impact",
    );
    assert_file_contains(
        root.join("skills/brainstorming/SKILL.md"),
        "superpowers repo-safety check --intent write",
    );
    assert_file_contains(
        root.join("skills/brainstorming/visual-companion.md"),
        "may stay attached to the terminal instead of returning immediately",
    );
    assert_file_contains(
        root.join("skills/brainstorming/visual-companion.md"),
        "capture the first `server-started` JSON line for `screen_dir`",
    );
    assert_file_contains(
        root.join("skills/brainstorming/visual-companion.md"),
        "install Git Bash or point `SUPERPOWERS_BASH_PATH` at a compatible `bash`",
    );

    assert_description_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "deciding which skill or workflow stage applies",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "First, if `$_SUPERPOWERS_ROOT/bin/superpowers` is available, call `$_SUPERPOWERS_ROOT/bin/superpowers workflow status --refresh`.",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "treat `execution_started` as an executor-resume signal only when the reported `phase` is `executing`",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "If the handoff reports a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of resuming `superpowers:subagent-driven-development` or `superpowers:executing-plans` just because `execution_started` is `yes`.",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "Treat the public handoff recommendation as a conservative default.",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "superpowers plan execution recommend --plan <approved-plan-path> --isolated-agents <available|unavailable> --session-intent <stay|separate|unknown> --workspace-prepared <yes|no|unknown>",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-eng-review -> execution.",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "Approved spec reviewer: `^\\*\\*Last Reviewed By:\\*\\* plan-ceo-review$`",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "Approved plan reviewer: `^\\*\\*Last Reviewed By:\\*\\* plan-eng-review$`",
    );
    assert_file_not_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "newest relevant artifacts",
    );

    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "\"$_SUPERPOWERS_ROOT/bin/superpowers\" workflow expect --artifact plan --path",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "\"$_SUPERPOWERS_ROOT/bin/superpowers\" plan contract lint \\",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "## CEO Review Summary",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "additive context only",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Use the execution skill recommended by `superpowers plan execution recommend --plan <approved-plan-path>`",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "**Last Reviewed By:** plan-ceo-review",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "For the final cross-task review gate in workflow-routed work",
    );
    assert_file_not_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "After each task in subagent-driven development",
    );
    assert_file_contains(
        root.join("skills/subagent-driven-development/SKILL.md"),
        "Those per-task review loops satisfy the \"review early\" rule during execution",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "If the current work is not governed by an approved Superpowers plan, skip this helper-owned finish gate and continue with the normal completion flow.",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "For plan-routed completion, use the exact `Base Branch` from the fresh release-readiness artifact instead of redetecting the target branch.",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "The Step 2 `<base-branch>` value stays authoritative for Options A, B, and D. Do not redetect it later in the branch-finishing flow.",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "Use the exact `<base-branch>` resolved in Step 2. Do not redetect it during PR creation.",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "If `gate-finish` fails with `test_plan_artifact_missing` or `test_plan_artifact_stale`, hand control back to `superpowers:plan-eng-review` to regenerate the current-branch test-plan artifact before QA or branch completion.",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "Treat the current-branch test-plan artifact as authoritative only when its `Source Plan`, `Source Plan Revision`, and `Head SHA` match the exact approved plan path, revision, and current branch HEAD from the workflow context.",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "Match current-branch artifacts by their `**Branch:**` header, not by a filename substring glob, so `my-feature` cannot masquerade as `feature`.",
    );
    assert_file_not_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "*-\"$BRANCH\"-test-plan-*",
    );
    assert_file_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "gh pr create --base \"<base-branch>\"",
    );
    assert_file_not_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "gh pr view --json baseRefName",
    );

    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "superpowers plan execution recommend --plan <approved-plan-path>",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "Engineering approval must fail closed unless `contract_state == valid` and `packet_buildable_tasks == task_count`.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "**The terminal state is presenting the execution preflight handoff with the approved plan path.**",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "plan-eng-review also owns the late refresh-test-plan lane when finish readiness reports `test_plan_artifact_missing` or `test_plan_artifact_stale` for the current approved plan revision.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "**Head SHA:** {current-head}",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "Set `**Head SHA:**` to the current `git rev-parse HEAD` for the branch state that this test-plan artifact covers.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "In that late-stage lane, the terminal state is returning to the finish-gate flow with a regenerated current-branch test-plan artifact, not reopening execution preflight.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "If the helper returns `status` `implementation_ready`, immediately call `$_SUPERPOWERS_ROOT/bin/superpowers workflow handoff` before presenting any handoff text.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "If that handoff returns `phase` `execution_preflight`, present the normal execution preflight handoff below.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "If that handoff returns a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of reopening execution preflight.",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "SELECTIVE EXPANSION",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "Section 11: Design & UX Review",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "## CEO Review Summary",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "Label the source as `cross-model` only when the outside voice definitely uses a different model/provider than the main reviewer.",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "If model provenance is the same, unknown, or only a fresh-context rerun of the same reviewer family, label the source as `fresh-context-subagent`.",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "A `CEO Approved` spec must end with `**Last Reviewed By:** plan-ceo-review`.",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "If the transport truncates or summarizes the outside-voice output, disclose that limitation plainly in review prose instead of overstating independence.",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "note `UI_SCOPE` for Section 11",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "Present each expansion opportunity as its own individual interactive user question.",
    );
    assert_file_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "Do not use PR metadata or repo default-branch APIs as a fallback; keep the system audit aligned with `document-release`, `requesting-code-review`, and `gate-finish`.",
    );
    assert_file_not_contains(
        root.join("skills/plan-ceo-review/SKILL.md"),
        "gh pr view --json baseRefName",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "coverage graph",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "An `Engineering Approved` plan must end with `**Last Reviewed By:** plan-eng-review`.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "## Key Interactions",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "## Edge Cases",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "## Critical Paths",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "## E2E Test Decision Matrix",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "REGRESSION RULE",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "loading, empty, error, success, partial, navigation, responsive, and accessibility-critical states",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "compatibility, retry/timeout semantics, replay or backfill behavior, and rollback or migration verification",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "Label the source as `cross-model` only when the outside voice definitely uses a different model/provider than the main reviewer.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "If model provenance is the same, unknown, or only a fresh-context rerun of the same reviewer family, label the source as `fresh-context-subagent`.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "If the transport truncates or summarizes the outside-voice output, disclose that limitation plainly in review prose instead of overstating independence.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "## Engineering Review Summary",
    );
    assert_file_contains(
        root.join("skills/qa-only/SKILL.md"),
        "## Engineering Review Summary",
    );
    assert_file_contains(
        root.join("skills/qa-only/SKILL.md"),
        "additive context only",
    );
    assert_file_contains(
        root.join("skills/qa-only/SKILL.md"),
        "## E2E Test Decision Matrix",
    );
    assert_file_contains(
        root.join("skills/qa-only/SKILL.md"),
        "Do not use PR metadata or repo default-branch APIs as a fallback; keep diff-aware scoping aligned with `document-release`, `requesting-code-review`, and `gate-finish`.",
    );
    assert_file_contains(
        root.join("skills/qa-only/SKILL.md"),
        "Match current-branch artifacts by their `**Branch:**` header, not by a filename substring glob, so `my-feature` cannot masquerade as `feature`.",
    );
    assert_file_not_contains(
        root.join("skills/qa-only/SKILL.md"),
        "*-\"$BRANCH\"-test-plan-*",
    );
    assert_file_not_contains(
        root.join("skills/qa-only/SKILL.md"),
        "gh pr view --json baseRefName",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "Review at the right checkpoints, then fail closed on the final whole-diff gate.",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "plan contract analyze-plan --spec \"$SOURCE_SPEC_PATH\" --plan \"$APPROVED_PLAN_PATH\" --format json",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "Do not use PR metadata or repo default-branch APIs as a fallback; keep the review base aligned with `superpowers:document-release` and `gate-finish`.",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "project-scoped code-review artifact",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "{user}-{safe-branch}-code-review-{datetime}.md",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "**Generated By:** superpowers:requesting-code-review",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "structured finish-gate input for final review freshness",
    );
    assert_file_not_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "gh pr view --json baseRefName",
    );
    assert_file_not_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "git log --oneline | grep \"Task 1\"",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "git rev-parse HEAD~1",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "CONTRACT_STATE=$(printf '%s\\n' \"$ANALYZE_JSON\" | node -e 'const fs = require(\"fs\"); const parsed = JSON.parse(fs.readFileSync(0, \"utf8\")); process.stdout.write(parsed.contract_state || \"\")')",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "if [ \"$CONTRACT_STATE\" != \"valid\" ] || [ \"$PACKET_BUILDABLE_TASKS\" != \"$TASK_COUNT\" ]; then",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "if [ -n \"$ACTIVE_TASK$BLOCKING_TASK$RESUME_TASK\" ]; then",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "REVIEW_GATE_JSON=$(\"$_SUPERPOWERS_ROOT/bin/superpowers\" plan execution gate-review --plan \"$APPROVED_PLAN_PATH\")",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "if [ \"$REVIEW_ALLOWED\" != \"true\" ]; then",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "treat `execution_started` as an executor-resume signal only when the reported `phase` is `executing`",
    );
    assert_file_contains(
        root.join("skills/using-superpowers/SKILL.md"),
        "If the handoff reports a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of resuming `superpowers:subagent-driven-development` or `superpowers:executing-plans` just because `execution_started` is `yes`.",
    );
    assert_file_contains(
        root.join("commands/execute-plan.md"),
        "If the handoff reports `phase` `executing`, use the approved plan path from handoff plus `superpowers plan execution status --plan <approved-plan-path>` to resume the current execution flow.",
    );
    assert_file_contains(
        root.join("commands/execute-plan.md"),
        "If the handoff reports any later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow the reported `phase` and `next_action`, or use `superpowers workflow next`, instead of resuming an executor merely because `execution_started` is `yes`.",
    );

    assert_file_contains(
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "# Code Review Briefing Template",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "This file is the skill-local reviewer briefing template, not the generated agent system prompt.",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "**Approved plan path:** {APPROVED_PLAN_PATH}",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "**Execution evidence path:** {EXECUTION_EVIDENCE_PATH}",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "same locally derivable base-branch contract as `document-release` and `gate-finish`",
    );
    assert_file_not_contains(
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "gh pr view --json baseRefName",
    );

    assert_file_contains(
        root.join("README.md"),
        "brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation",
    );
    assert_file_contains(
        root.join("README.md"),
        "execution preflight boundary for the approved plan",
    );
    assert_file_contains(
        root.join("docs/test-suite-enhancement-plan.md"),
        "The active deterministic suite and recommended commands now live in `docs/testing.md`.",
    );
    assert_file_contains(
        root.join("docs/test-suite-enhancement-plan.md"),
        "cargo nextest run --test runtime_instruction_contracts",
    );
    assert_file_not_contains(
        root.join("docs/test-suite-enhancement-plan.md"),
        "bash tests/codex-runtime/test-runtime-instructions.sh",
    );
    assert_file_not_contains(
        root.join("docs/test-suite-enhancement-plan.md"),
        "bash tests/codex-runtime/test-workflow-sequencing.sh",
    );

    let fixture_root = root.join("tests/codex-runtime/fixtures/workflow-artifacts");
    for spec in [
        "specs/2026-01-22-document-review-system-design.md",
        "specs/2026-01-22-document-review-system-design-v2.md",
        "specs/2026-02-19-visual-brainstorming-refactor-design.md",
        "specs/2026-03-11-zero-dep-brainstorm-server-design.md",
    ] {
        assert_file_contains(fixture_root.join(spec), "**Workflow State:** CEO Approved");
        assert_file_contains(fixture_root.join(spec), "**Spec Revision:** 1");
        assert_file_contains(
            fixture_root.join(spec),
            "**Last Reviewed By:** plan-ceo-review",
        );
    }
    for plan in [
        "plans/2026-01-22-document-review-system.md",
        "plans/2026-02-19-visual-brainstorming-refactor.md",
        "plans/2026-03-11-zero-dep-brainstorm-server.md",
    ] {
        assert_file_contains(
            fixture_root.join(plan),
            "**Workflow State:** Engineering Approved",
        );
        assert_file_contains(fixture_root.join(plan), "**Source Spec:**");
        assert_file_contains(fixture_root.join(plan), "**Source Spec Revision:** 1");
        assert_file_contains(
            fixture_root.join(plan),
            "**Last Reviewed By:** plan-eng-review",
        );
    }
    assert_file_contains(
        fixture_root.join("README.md"),
        "Requirement Index and Requirement Coverage Matrix structure",
    );
    assert_file_contains(
        fixture_root.join("README.md"),
        "canonical `## Task N:` plus parseable `**Files:**` blocks",
    );
}

#[test]
fn using_superpowers_preamble_prefers_valid_repo_roots_over_fallback_installs() {
    let content = read_utf8(repo_root().join("skills/using-superpowers/SKILL.md"));
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let tmp_root = TempDir::new().expect("temp root should exist");

    let shared_home = tmp_root.path().join("shared-home");
    fs::create_dir_all(shared_home.join(".superpowers")).expect("shared home should exist");
    make_runtime_root(&shared_home.join(".superpowers/install"));
    let renamed_repo = tmp_root.path().join("runtime-dev-checkout");
    fs::create_dir_all(&renamed_repo).expect("renamed repo should exist");
    make_runtime_repo(&renamed_repo);
    let expected_repo_root =
        fs::canonicalize(&renamed_repo).expect("repo root should canonicalize");

    let mut command = Command::new("bash");
    command
        .arg("-lc")
        .arg(format!(
            "{preamble}\nprintf \"SUPERPOWERS_ROOT=%s\\n\" \"$_SUPERPOWERS_ROOT\"\n"
        ))
        .current_dir(&renamed_repo)
        .env("HOME", &shared_home);
    let output = run_checked(command, "run generated using-superpowers preamble");
    let stdout = String::from_utf8(output.stdout).expect("preamble output should be utf8");
    assert_contains(
        &stdout,
        &format!("SUPERPOWERS_ROOT={}", expected_repo_root.display()),
        "using-superpowers preamble output",
    );

    let invalid_home = tmp_root.path().join("invalid-home");
    fs::create_dir_all(invalid_home.join(".superpowers")).expect("invalid home should exist");
    make_runtime_root(&invalid_home.join(".superpowers/install"));
    let invalid_repo = tmp_root.path().join("not-a-runtime");
    fs::create_dir_all(&invalid_repo).expect("invalid repo should exist");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(&invalid_repo);
    run_checked(git_init, "git init invalid repo");

    let mut fallback_command = Command::new("bash");
    fallback_command
        .arg("-lc")
        .arg(format!(
            "{preamble}\nprintf \"SUPERPOWERS_ROOT=%s\\n\" \"$_SUPERPOWERS_ROOT\"\n"
        ))
        .current_dir(&invalid_repo)
        .env("HOME", &invalid_home);
    let fallback = run_checked(fallback_command, "run fallback using-superpowers preamble");
    let fallback_stdout =
        String::from_utf8(fallback.stdout).expect("fallback output should be utf8");
    assert_contains(
        &fallback_stdout,
        &format!(
            "SUPERPOWERS_ROOT={}",
            invalid_home.join(".superpowers/install").display()
        ),
        "using-superpowers fallback output",
    );
}
