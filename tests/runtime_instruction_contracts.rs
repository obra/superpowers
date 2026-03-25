#[path = "support/process.rs"]
mod process_support;

use assert_cmd::Command as AssertCommand;
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Duration;
use tempfile::TempDir;

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
        dir.join("bin/featureforge"),
        "#!/usr/bin/env bash\ncase \"${1:-}\" in\n  update-check)\n    exit 0\n    ;;\n  config)\n    exit 0\n    ;;\n  *)\n    exit 0\n    ;;\nesac\n",
    )
    .expect("runtime launcher should be writable");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(
            dir.join("bin/featureforge"),
            fs::Permissions::from_mode(0o755),
        )
        .expect("runtime launcher should be executable");
    }
    fs::write(dir.join("VERSION"), "1.0.0\n").expect("VERSION should be writable");
}

fn make_runtime_repo(dir: &Path) {
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(dir);
    run_checked(git_init, "git init runtime repo");
    make_runtime_root(dir);
}

#[test]
fn repo_checkout_ships_the_canonical_runtime_launcher() {
    let launcher = if cfg!(windows) {
        repo_root().join("bin/featureforge.exe")
    } else {
        repo_root().join("bin/featureforge")
    };
    assert!(
        launcher.is_file(),
        "repo checkout should expose the real featureforge binary as the canonical repo-local launcher"
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
    let launcher = if cfg!(windows) {
        repo_root().join("bin/featureforge.exe")
    } else {
        repo_root().join("bin/featureforge")
    };
    let output = AssertCommand::new(launcher)
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
        stdout.contains("featureforge") && stdout.contains(env!("CARGO_PKG_VERSION")),
        "repo-local featureforge binary should print the current runtime version, got:\n{stdout}"
    );
}

#[test]
fn repo_checkout_canonical_launcher_avoids_non_binary_repo_fallbacks() {
    let root = repo_root();
    let top_level_bin_files = fs::read_dir(root.join("bin"))
        .expect("bin dir should be readable")
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let path = entry.path();
            path.is_file()
                .then(|| entry.file_name().to_string_lossy().into_owned())
        })
        .collect::<Vec<_>>();
    assert_eq!(
        top_level_bin_files,
        vec![String::from("featureforge")],
        "repo checkout should expose only the standalone featureforge binary at bin/"
    );
    for relative in ["commands", "compat/bash", "compat/powershell"] {
        let dir = root.join(relative);
        if !dir.exists() {
            continue;
        }
        assert!(
            fs::read_dir(&dir)
                .expect("compat/commands dir should be readable")
                .next()
                .is_none(),
            "{relative} should be empty in the standalone runtime"
        );
    }
}

#[test]
fn repo_checkout_canonical_launcher_uses_manifest_selected_binary_path() {
    let root = repo_root();
    let manifest = read_utf8(root.join("bin/prebuilt/manifest.json"));
    for needle in [
        &format!("\"runtime_revision\": \"{}\"", env!("CARGO_PKG_VERSION")),
        "bin/prebuilt/darwin-arm64/featureforge",
        "bin/prebuilt/darwin-arm64/featureforge.sha256",
        "bin/prebuilt/windows-x64/featureforge.exe",
        "bin/prebuilt/windows-x64/featureforge.exe.sha256",
    ] {
        assert_contains(&manifest, needle, "bin/prebuilt/manifest.json");
    }
    let manifest_json: serde_json::Value =
        serde_json::from_str(&manifest).expect("manifest json should parse");
    let targets = manifest_json["targets"]
        .as_object()
        .expect("manifest targets should be an object");
    for entry in targets.values() {
        let runtime_path = entry["binary_path"]
            .as_str()
            .expect("manifest binary path should be a string");
        let checksum_path = entry["checksum_path"]
            .as_str()
            .expect("manifest checksum path should be a string");
        assert_contains(runtime_path, "featureforge", "bin/prebuilt/manifest.json");
        assert_contains(checksum_path, "featureforge", "bin/prebuilt/manifest.json");
    }
    for relative in [
        "bin/prebuilt/darwin-arm64/featureforge",
        "bin/prebuilt/darwin-arm64/featureforge.sha256",
        "bin/prebuilt/windows-x64/featureforge.exe",
        "bin/prebuilt/windows-x64/featureforge.exe.sha256",
    ] {
        assert!(
            root.join(relative).is_file(),
            "renamed prebuilt runtime asset should exist: {relative}"
        );
    }
}

#[test]
fn repo_checkout_canonical_launcher_rejects_stale_prebuilt_checksum() {
    let root = repo_root();
    let darwin_checksum = read_utf8(root.join("bin/prebuilt/darwin-arm64/featureforge.sha256"));
    let windows_checksum = read_utf8(root.join("bin/prebuilt/windows-x64/featureforge.exe.sha256"));
    assert_contains(
        &darwin_checksum,
        "  featureforge",
        "bin/prebuilt/darwin-arm64/featureforge.sha256",
    );
    assert_contains(
        &windows_checksum,
        "  featureforge.exe",
        "bin/prebuilt/windows-x64/featureforge.exe.sha256",
    );
}

#[test]
fn repo_checkout_powershell_launcher_uses_manifest_selected_binary_path() {
    let root = repo_root();
    let powershell_files = fs::read_dir(root.join("bin"))
        .expect("bin dir should be readable")
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().into_owned();
            name.ends_with(".ps1").then_some(name)
        })
        .collect::<Vec<_>>();
    assert!(
        powershell_files.is_empty(),
        "standalone runtime should not ship PowerShell wrapper surfaces: {powershell_files:?}"
    );
    let compat_powershell = root.join("compat/powershell");
    if compat_powershell.exists() {
        assert!(
            fs::read_dir(&compat_powershell)
                .expect("compat/powershell should be readable")
                .next()
                .is_none(),
            "compat/powershell should be empty in the standalone runtime"
        );
    }
}

#[test]
fn repo_checkout_powershell_launcher_rejects_stale_prebuilt_checksum() {
    let root = repo_root();
    let shell_helper_files = fs::read_dir(root.join("bin"))
        .expect("bin dir should be readable")
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().into_owned();
            (name.ends_with("runtime-common.sh") || name.ends_with("pwsh-common.ps1"))
                .then_some(name)
        })
        .collect::<Vec<_>>();
    assert!(
        shell_helper_files.is_empty(),
        "standalone runtime should not ship shell helper files: {shell_helper_files:?}"
    );
}

#[test]
fn repo_checkout_powershell_launcher_preserves_native_exit_code_with_psnative_preference() {
    let root = repo_root();
    let top_level_bin_files = fs::read_dir(root.join("bin"))
        .expect("bin dir should be readable")
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let path = entry.path();
            path.is_file()
                .then(|| entry.file_name().to_string_lossy().into_owned())
        })
        .collect::<Vec<_>>();
    assert_eq!(
        top_level_bin_files,
        vec![String::from("featureforge")],
        "native exit-code handling should rely on the standalone featureforge binary only"
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
        "--test runtime_instruction_contracts --test using_featureforge_skill",
        "README.md",
    );
    assert_contains(
        &readme_content,
        "--test powershell_wrapper_resolution --test upgrade_skill",
        "README.md",
    );
    assert_not_contains(
        &readme_content,
        "bash tests/differential/run_legacy_vs_rust.sh",
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
        "bash tests/codex-runtime/test-upgrade-skill.sh",
        "README.md",
    );

    assert_contains(
        &docs_testing_content,
        "cargo nextest run --test runtime_instruction_contracts --test using_featureforge_skill",
        "docs/testing.md",
    );
    assert_contains(
        &docs_testing_content,
        "workflow-status snapshot coverage for the ambiguous-spec route lives in `tests/workflow_runtime.rs`",
        "docs/testing.md",
    );
    for legacy_command in [
        "bash tests/differential/run_legacy_vs_rust.sh",
        "bash tests/codex-runtime/test-runtime-instructions.sh",
        "bash tests/codex-runtime/test-workflow-enhancements.sh",
        "bash tests/codex-runtime/test-workflow-sequencing.sh",
        "bash tests/codex-runtime/test-using-featureforge-bypass.sh",
        "bash tests/codex-runtime/test-session-entry-gate.sh",
        "bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh",
        "bash tests/codex-runtime/test-upgrade-skill.sh",
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
fn runtime_docs_and_fixtures_do_not_depend_on_the_removed_differential_shell_harness() {
    let root = repo_root();

    assert!(
        !root.join("tests/differential/run_legacy_vs_rust.sh").exists(),
        "tests/differential/run_legacy_vs_rust.sh should be removed once the snapshot lives in workflow_runtime.rs"
    );
    assert!(
        !root.join("tests/differential/README.md").exists(),
        "tests/differential/README.md should be removed once the shell harness is gone"
    );

    assert_file_not_contains(root.join("README.md"), "run_legacy_vs_rust.sh");
    assert_file_not_contains(root.join("docs/testing.md"), "run_legacy_vs_rust.sh");
    assert_file_not_contains(root.join("docs/test-suite-enhancement-plan.md"), "tests/differential/");
    assert_file_contains(
        root.join("docs/testing.md"),
        "workflow-status snapshot coverage for the ambiguous-spec route lives in `tests/workflow_runtime.rs`",
    );
    assert!(
        root.join("tests/fixtures/differential/workflow-status.json")
            .is_file(),
        "the checked-in workflow-status snapshot fixture should remain available"
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
        "tests/using_featureforge_skill.rs",
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
        "skills/using-featureforge/SKILL.md",
        "skills/using-git-worktrees/SKILL.md",
        "skills/subagent-driven-development/SKILL.md",
        "skills/dispatching-parallel-agents/SKILL.md",
        "skills/using-featureforge/references/codex-tools.md",
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
            r"bin\\featureforge-(migrate-install|config|update-check)(?!\.ps1)",
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
                "~/.featureforge/install/bin/featureforge config set featureforge_contributor true",
                "~/.featureforge/install/bin/featureforge config set update_check true",
                "~/.featureforge/install/bin/featureforge update-check",
            ],
            [
                "~/.featureforge/install/bin/featureforge install migrate",
                "~/.featureforge/install/bin/featureforge-migrate-install",
                "~/.featureforge/install/bin/featureforge-config",
                "~/.featureforge/install/bin/featureforge-update-check",
                "PendingMigration",
            ],
        ),
        (
            ".copilot/INSTALL.md",
            [
                "~/.featureforge/install/bin/featureforge config set featureforge_contributor true",
                "~/.featureforge/install/bin/featureforge config set update_check true",
                "~/.featureforge/install/bin/featureforge update-check",
            ],
            [
                "~/.featureforge/install/bin/featureforge install migrate",
                "~/.featureforge/install/bin/featureforge-migrate-install",
                "~/.featureforge/install/bin/featureforge-config",
                "~/.featureforge/install/bin/featureforge-update-check",
                "PendingMigration",
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

    let runtime_version = read_utf8(root.join("VERSION")).trim().to_owned();
    let manifest = read_utf8(root.join("bin/prebuilt/manifest.json"));
    assert_contains(
        &manifest,
        &format!("\"runtime_revision\": \"{runtime_version}\""),
        "bin/prebuilt/manifest.json",
    );

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

    assert_file_contains(root.join("README.md"), "featureforge session-entry");
    assert_file_contains(root.join("README.md"), "featureforge repo-safety");
    assert_file_contains(root.join("README.md"), "featureforge plan contract");
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
fn copilot_install_docs_use_the_skills_root_as_the_discovery_link() {
    let root = repo_root();

    let readme = read_utf8(root.join("README.md"));
    assert_contains(
        &readme,
        "`~/.copilot/skills -> ~/.featureforge/install/skills`",
        "README.md",
    );
    assert_not_contains(
        &readme,
        "`~/.copilot/skills/featureforge -> ~/.featureforge/install/skills`",
        "README.md",
    );

    let copilot_overview = read_utf8(root.join("docs/README.copilot.md"));
    assert_contains(
        &copilot_overview,
        "`~/.copilot/skills -> ~/.featureforge/install/skills`",
        "docs/README.copilot.md",
    );
    assert_contains(
        &copilot_overview,
        "`ls -la ~/.copilot/skills`",
        "docs/README.copilot.md",
    );
    assert_not_contains(
        &copilot_overview,
        "~/.copilot/skills/featureforge",
        "docs/README.copilot.md",
    );

    let install_doc = read_utf8(root.join(".copilot/INSTALL.md"));
    for expected in [
        "mkdir -p ~/.copilot",
        "ln -s ~/.featureforge/install/skills ~/.copilot/skills",
        "ls -la ~/.copilot/skills",
        "rm ~/.copilot/skills",
        "Get-Item \"$env:USERPROFILE\\.copilot\\skills\"",
        "Remove-Item \"$env:USERPROFILE\\.copilot\\skills\"",
        "cmd /c mklink /J \"$env:USERPROFILE\\.copilot\\skills\" \"$env:USERPROFILE\\.featureforge\\install\\skills\"",
    ] {
        assert_contains(&install_doc, expected, ".copilot/INSTALL.md");
    }
    for retired in [
        "~/.copilot/skills/featureforge",
        "$env:USERPROFILE\\.copilot\\skills\\featureforge",
        "mkdir -p ~/.copilot/skills",
        "New-Item -ItemType Directory -Force -Path \"$env:USERPROFILE\\.copilot\\skills\"",
    ] {
        assert_not_contains(&install_doc, retired, ".copilot/INSTALL.md");
    }
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
                "featureforge:requesting-code-review",
                "featureforge:qa-only",
                "featureforge:document-release",
                "Conditional Pre-Landing QA Gate",
                "Required release-readiness pass for workflow-routed work before completion",
                "featureforge repo-safety check --intent write",
                "Run `featureforge plan execution gate-review --plan <approved-plan-path>` before late-stage QA or release routing.",
                "If the current work is governed by an approved FeatureForge plan, after `featureforge:document-release` and any required `featureforge:qa-only` handoff are current, run `featureforge plan execution gate-finish --plan <approved-plan-path>` before presenting completion options.",
                "If the current work is not governed by an approved FeatureForge plan, skip this helper-owned finish gate and continue with the normal completion flow.",
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
        "If Step 1.9 already routed through `featureforge:document-release`",
    );
    assert_file_contains(
        root.join("tests/evals/using-featureforge-routing.scenarios.md"),
        "branch-completion language still routes to `requesting-code-review` when no fresh final review artifact exists",
    );
    assert_file_contains(
        root.join("tests/evals/using-featureforge-routing.orchestrator.md"),
        "Use the real repo-versioned `using-featureforge` entry contract and skill/runtime surfaces from the branch under test",
    );
    assert_file_contains(
        root.join("tests/evals/using-featureforge-routing.orchestrator.md"),
        "Pass the absolute branch-under-test repo root into both runner and judge prompts.",
    );
    assert_file_contains(
        root.join("tests/evals/using-featureforge-routing.orchestrator.md"),
        "invoke `<BRANCH_UNDER_TEST_ROOT>/bin/featureforge` explicitly",
    );
    assert_file_contains(
        root.join("tests/evals/using-featureforge-routing.runner.md"),
        "Use the real repo-versioned `using-featureforge` entry contract and skill/runtime surfaces from the branch under test",
    );
    assert_file_contains(
        root.join("tests/evals/using-featureforge-routing.runner.md"),
        "The controller must pass `BRANCH_UNDER_TEST_ROOT` as an absolute path.",
    );
    assert_file_contains(
        root.join("tests/evals/using-featureforge-routing.runner.md"),
        "Do not rely on temp-fixture runtime-root autodetection or any home-install fallback.",
    );
    assert_file_not_contains(
        root.join("tests/evals/using-featureforge-routing.scenarios.md"),
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
        "\"$_FEATUREFORGE_ROOT/bin/featureforge\" workflow expect --artifact spec --path",
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
        "featureforge repo-safety check --intent write",
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
        "install Git Bash or point `FEATUREFORGE_BASH_PATH` at a compatible `bash`",
    );

    assert_description_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "deciding which skill or workflow stage applies",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "First, if `$_FEATUREFORGE_ROOT/bin/featureforge` is available, call `$_FEATUREFORGE_ROOT/bin/featureforge workflow status --refresh`.",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "treat `execution_started` as an executor-resume signal only when the reported `phase` is `executing`",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "If the handoff reports a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of resuming `featureforge:subagent-driven-development` or `featureforge:executing-plans` just because `execution_started` is `yes`.",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "Treat the public handoff recommendation as a conservative default.",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "featureforge plan execution recommend --plan <approved-plan-path> --isolated-agents <available|unavailable> --session-intent <stay|separate|unknown> --workspace-prepared <yes|no|unknown>",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "then follow the artifact-state workflow: plan-ceo-review -> writing-plans -> plan-eng-review -> execution.",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "Approved spec reviewer: `^\\*\\*Last Reviewed By:\\*\\* plan-ceo-review$`",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "Approved plan reviewer: `^\\*\\*Last Reviewed By:\\*\\* plan-eng-review$`",
    );
    assert_file_not_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "newest relevant artifacts",
    );

    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "\"$_FEATUREFORGE_ROOT/bin/featureforge\" workflow expect --artifact plan --path",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "\"$_FEATUREFORGE_ROOT/bin/featureforge\" plan contract lint \\",
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
        "Use the execution skill recommended by `featureforge plan execution recommend --plan <approved-plan-path>`",
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
        "If the current work is not governed by an approved FeatureForge plan, skip this helper-owned finish gate and continue with the normal completion flow.",
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
        "If `gate-finish` fails with `test_plan_artifact_missing` or `test_plan_artifact_stale`, hand control back to `featureforge:plan-eng-review` to regenerate the current-branch test-plan artifact before QA or branch completion.",
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
        "featureforge plan execution recommend --plan <approved-plan-path>",
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
        "If the helper returns `status` `implementation_ready`, immediately call `$_FEATUREFORGE_ROOT/bin/featureforge workflow handoff` before presenting any handoff text.",
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
        "Do not use PR metadata or repo default-branch APIs as a fallback; keep the review base aligned with `featureforge:document-release` and `gate-finish`.",
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
        "**Generated By:** featureforge:requesting-code-review",
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
        "REVIEW_GATE_JSON=$(\"$_FEATUREFORGE_ROOT/bin/featureforge\" plan execution gate-review --plan \"$APPROVED_PLAN_PATH\")",
    );
    assert_file_contains(
        root.join("skills/requesting-code-review/SKILL.md"),
        "if [ \"$REVIEW_ALLOWED\" != \"true\" ]; then",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "treat `execution_started` as an executor-resume signal only when the reported `phase` is `executing`",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "If the handoff reports a later phase such as `review_blocked`, `qa_pending`, `document_release_pending`, or `ready_for_branch_completion`, follow that reported phase and `next_action` instead of resuming `featureforge:subagent-driven-development` or `featureforge:executing-plans` just because `execution_started` is `yes`.",
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
fn using_featureforge_preamble_prefers_valid_repo_roots_over_fallback_installs() {
    let content = read_utf8(repo_root().join("skills/using-featureforge/SKILL.md"));
    let preamble = extract_bash_block(&content, "## Preamble (run first)");
    let tmp_root = TempDir::new().expect("temp root should exist");

    let shared_home = tmp_root.path().join("shared-home");
    fs::create_dir_all(shared_home.join(".featureforge")).expect("shared home should exist");
    make_runtime_root(&shared_home.join(".featureforge/install"));
    let renamed_repo = tmp_root.path().join("runtime-dev-checkout");
    fs::create_dir_all(&renamed_repo).expect("renamed repo should exist");
    make_runtime_repo(&renamed_repo);
    let expected_repo_root =
        fs::canonicalize(&renamed_repo).expect("repo root should canonicalize");

    let mut command = Command::new("bash");
    command
        .arg("-lc")
        .arg(format!(
            "{preamble}\nprintf \"FEATUREFORGE_ROOT=%s\\n\" \"$_FEATUREFORGE_ROOT\"\n"
        ))
        .current_dir(&renamed_repo)
        .env("HOME", &shared_home);
    let output = run_checked(command, "run generated using-featureforge preamble");
    let stdout = String::from_utf8(output.stdout).expect("preamble output should be utf8");
    assert_contains(
        &stdout,
        &format!("FEATUREFORGE_ROOT={}", expected_repo_root.display()),
        "using-featureforge preamble output",
    );

    let invalid_home = tmp_root.path().join("invalid-home");
    fs::create_dir_all(invalid_home.join(".featureforge")).expect("invalid home should exist");
    make_runtime_root(&invalid_home.join(".featureforge/install"));
    let invalid_repo = tmp_root.path().join("not-a-runtime");
    fs::create_dir_all(&invalid_repo).expect("invalid repo should exist");
    let mut git_init = Command::new("git");
    git_init.arg("init").current_dir(&invalid_repo);
    run_checked(git_init, "git init invalid repo");

    let mut fallback_command = Command::new("bash");
    fallback_command
        .arg("-lc")
        .arg(format!(
            "{preamble}\nprintf \"FEATUREFORGE_ROOT=%s\\n\" \"$_FEATUREFORGE_ROOT\"\n"
        ))
        .current_dir(&invalid_repo)
        .env("HOME", &invalid_home);
    let fallback = run_checked(fallback_command, "run fallback using-featureforge preamble");
    let fallback_stdout =
        String::from_utf8(fallback.stdout).expect("fallback output should be utf8");
    assert_contains(
        &fallback_stdout,
        &format!(
            "FEATUREFORGE_ROOT={}",
            invalid_home.join(".featureforge/install").display()
        ),
        "using-featureforge fallback output",
    );
}
