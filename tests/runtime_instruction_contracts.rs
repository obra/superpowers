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
                "After `superpowers:document-release` and any required `superpowers:qa-only` handoff are current, run `superpowers plan execution gate-finish --plan <approved-plan-path>` before presenting completion options.",
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
    assert_file_not_contains(
        root.join("skills/finishing-a-development-branch/SKILL.md"),
        "If Step 1.9 already routed through `superpowers:document-release`",
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
        "then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-eng-review -> execution.",
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
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "**Approved plan path:** {APPROVED_PLAN_PATH}",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/code-reviewer.md"),
        "**Execution evidence path:** {EXECUTION_EVIDENCE_PATH}",
    );

    assert_file_contains(
        root.join("README.md"),
        "brainstorming -> plan-ceo-review -> writing-plans -> plan-eng-review -> implementation",
    );
    assert_file_contains(
        root.join("README.md"),
        "execution preflight boundary for the approved plan",
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
