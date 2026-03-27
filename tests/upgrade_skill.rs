#[path = "support/executable.rs"]
mod executable_support;
#[path = "support/files.rs"]
mod files_support;
#[path = "support/install.rs"]
mod install_support;
#[path = "support/prebuilt.rs"]
mod prebuilt_support;
#[path = "support/process.rs"]
mod process_support;

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output};

use tempfile::TempDir;

use executable_support::make_executable;
use files_support::write_file;
use install_support::{canonical_install_bin, canonical_install_root};
use prebuilt_support::{
    DARWIN_ARM64_BINARY_REL, DARWIN_ARM64_CHECKSUM_REL, WINDOWS_X64_BINARY_REL,
    WINDOWS_X64_CHECKSUM_REL, write_canonical_prebuilt_layout,
};
use process_support::{repo_root, run};

fn skill_doc_path() -> PathBuf {
    repo_root().join("featureforge-upgrade/SKILL.md")
}

fn read_skill_doc() -> String {
    fs::read_to_string(skill_doc_path()).expect("featureforge-upgrade skill doc should be readable")
}

fn assert_contains(content: &str, needle: &str, label: &str) {
    assert!(
        content.contains(needle),
        "{label} should contain {needle:?}"
    );
}

fn assert_no_runtime_fallback_execution(content: &str, label: &str) {
    // Intentional invariant: skill installs package the runtime binary on
    // purpose. Runtime-root resolution may locate companion files from that
    // install, but it must NEVER redirect command execution to INSTALL_DIR,
    // $_FEATUREFORGE_ROOT, PATH, or any other discovered binary.
    for needle in [
        "${_FEATUREFORGE_BIN:-featureforge}",
        "command -v featureforge",
    ] {
        assert!(
            !content.contains(needle),
            "{label} should not contain {needle:?}"
        );
    }
    for line in content.lines().map(str::trim_start) {
        assert!(
            !line.starts_with("\"$_FEATUREFORGE_ROOT/bin/featureforge\""),
            "{label} should not execute runtime commands through $_FEATUREFORGE_ROOT/bin/featureforge"
        );
        assert!(
            !line.starts_with("\"$INSTALL_DIR/bin/featureforge\""),
            "{label} should not execute runtime commands through $INSTALL_DIR/bin/featureforge"
        );
        assert!(
            !line.starts_with("\"$_FEATUREFORGE_ROOT/bin/featureforge.exe\""),
            "{label} should not execute runtime commands through $_FEATUREFORGE_ROOT/bin/featureforge.exe"
        );
        assert!(
            !line.starts_with("\"$INSTALL_DIR/bin/featureforge.exe\""),
            "{label} should not execute runtime commands through $INSTALL_DIR/bin/featureforge.exe"
        );
        assert!(
            !line.starts_with("\"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN"
        );
        assert!(
            !line.starts_with("if \"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN in conditionals"
        );
        assert!(
            !line.starts_with("if ! \"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN in negated conditionals"
        );
        assert!(
            !line.starts_with("while \"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN in loops"
        );
        assert!(
            !line.starts_with("while ! \"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN in negated loops"
        );
        assert!(
            !line.starts_with("until \"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN in loops"
        );
        assert!(
            !line.starts_with("until ! \"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN in negated loops"
        );
        assert!(
            !line.starts_with("! \"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN with negation"
        );
        assert!(
            !line.contains("$(\"$INSTALL_RUNTIME_BIN\""),
            "{label} should not execute runtime commands through INSTALL_RUNTIME_BIN in command substitutions"
        );
        assert!(
            !line.starts_with("FEATUREFORGE_RUNTIME_BIN=\"$_FEATUREFORGE_ROOT/bin/featureforge\""),
            "{label} should not assign FEATUREFORGE_RUNTIME_BIN from $_FEATUREFORGE_ROOT"
        );
        assert!(
            !line.starts_with("FEATUREFORGE_RUNTIME_BIN=\"$INSTALL_DIR/bin/featureforge\""),
            "{label} should not assign FEATUREFORGE_RUNTIME_BIN from INSTALL_DIR"
        );
        assert!(
            !line.starts_with(
                "FEATUREFORGE_RUNTIME_BIN=\"$_FEATUREFORGE_ROOT/bin/featureforge.exe\""
            ),
            "{label} should not assign FEATUREFORGE_RUNTIME_BIN from $_FEATUREFORGE_ROOT/bin/featureforge.exe"
        );
        assert!(
            !line.starts_with("FEATUREFORGE_RUNTIME_BIN=\"$INSTALL_DIR/bin/featureforge.exe\""),
            "{label} should not assign FEATUREFORGE_RUNTIME_BIN from INSTALL_DIR/bin/featureforge.exe"
        );
        assert!(
            !line.starts_with("FEATUREFORGE_RUNTIME_BIN=\"$INSTALL_RUNTIME_BIN\""),
            "{label} should not assign FEATUREFORGE_RUNTIME_BIN from INSTALL_RUNTIME_BIN"
        );
    }
}

fn combined_output(output: &Output) -> String {
    format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
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

fn run_bash_block(
    cwd: &Path,
    home_dir: &Path,
    script: &str,
    extra_env: &[(&str, &str)],
    context: &str,
) -> Output {
    let mut command = Command::new("bash");
    command.arg("-euo").arg("pipefail").arg("-c").arg(script);
    command.current_dir(cwd);
    command.env("HOME", home_dir);
    for (key, value) in extra_env {
        command.env(key, value);
    }
    run(command, context)
}

fn make_valid_install(dir: &Path, git_mode: &str) {
    fs::create_dir_all(dir.join("bin")).expect("install bin dir should exist");
    write_file(&dir.join("bin/featureforge"), "");
    make_executable(&dir.join("bin/featureforge"));
    write_file(&dir.join("VERSION"), "1.0.0\n");
    write_canonical_prebuilt_layout(
        dir,
        "1.0.0",
        "#!/usr/bin/env bash\nprintf 'darwin runtime\\n'\n",
        "windows runtime\n",
    );
    match git_mode {
        "dir" => {
            fs::create_dir_all(dir.join(".git")).expect(".git dir should exist");
        }
        "file" => {
            write_file(&dir.join(".git"), "gitdir: /tmp/fake-worktree\n");
        }
        _ => panic!("unexpected git mode {git_mode}"),
    }
}

fn make_windows_only_install(dir: &Path, git_mode: &str) {
    fs::create_dir_all(dir.join("bin")).expect("windows install bin dir should exist");
    write_file(&dir.join("bin/featureforge.exe"), "");
    make_executable(&dir.join("bin/featureforge.exe"));
    write_file(&dir.join("VERSION"), "1.0.0\n");
    write_canonical_prebuilt_layout(
        dir,
        "1.0.0",
        "#!/usr/bin/env bash\nprintf 'darwin runtime\\n'\n",
        "windows runtime\n",
    );
    match git_mode {
        "dir" => {
            fs::create_dir_all(dir.join(".git")).expect(".git dir should exist");
        }
        "file" => {
            write_file(&dir.join(".git"), "gitdir: /tmp/fake-worktree\n");
        }
        _ => panic!("unexpected git mode {git_mode}"),
    }
}

fn write_mock_featureforge(bin_dir: &Path, script_body: &str) {
    fs::create_dir_all(bin_dir).expect("mock featureforge bin dir should exist");
    let helper_path = bin_dir.join("featureforge");
    write_file(&helper_path, script_body);
    make_executable(&helper_path);
}

fn install_mock_featureforge(home_dir: &Path, script_body: &str) -> PathBuf {
    let helper_path = canonical_install_bin(home_dir);
    write_file(&helper_path, script_body);
    make_executable(&helper_path);
    helper_path
}

fn install_mock_featureforge_exe(home_dir: &Path, script_body: &str) -> PathBuf {
    let helper_path = canonical_install_root(home_dir)
        .join("bin")
        .join("featureforge.exe");
    write_file(&helper_path, script_body);
    make_executable(&helper_path);
    helper_path
}

fn resolved_runtime_root_path(root: &Path) -> String {
    format!("{}\n", root.to_string_lossy())
}

#[test]
fn upgrade_skill_contract_tracks_doc_patterns_and_install_root_resolution() {
    let skill_doc = read_skill_doc();
    for pattern in [
        "repo runtime-root --path",
        "_FEATUREFORGE_INSTALL_ROOT=\"$HOME/.featureforge/install\"",
        "FEATUREFORGE_RUNTIME_BIN=\"${_FEATUREFORGE_BIN:-}\"",
        "if [ -z \"$FEATUREFORGE_RUNTIME_BIN\" ]; then",
        "if [ -x \"$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge\" ]; then",
        "elif [ -f \"$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe\" ]; then",
        "INSTALL_DIR=\"${_FEATUREFORGE_ROOT:-}\"",
        "repo runtime-root --field upgrade-eligible",
        "UPGRADE_ELIGIBLE=",
        "bin/featureforge",
        "bin/featureforge.exe",
        "FEATUREFORGE_RUNTIME_BIN",
        "INSTALL_RUNTIME_BIN=",
        "VERSION",
        "ERROR: featureforge runtime-root helper unavailable",
        "ERROR: featureforge runtime root unavailable",
        "ERROR: featureforge runtime root returned no executable featureforge binary",
        "ERROR: featureforge runtime root is not upgrade-eligible",
        "Read `$INSTALL_DIR/RELEASE-NOTES.md`.",
        "git stash push --include-untracked",
        "git stash pop",
        "ERROR: featureforge upgrade failed during git pull",
        "Run $FEATUREFORGE_RUNTIME_BIN config set update_check true to re-enable.",
        "_UPDATE_CHECK_DIR=\"$_SP_STATE_DIR/update-check\"",
        "_SNOOZE_FILE=\"$_UPDATE_CHECK_DIR/update-snoozed\"",
        "rm -f \"$_UPDATE_CHECK_DIR/last-update-check\" \"$_UPDATE_CHECK_DIR/update-snoozed\"",
        "echo \"$OLD_VERSION\" > \"$_UPDATE_CHECK_DIR/just-upgraded-from\"",
        "REMOTE_URL=\"${FEATUREFORGE_REMOTE_URL:-https://raw.githubusercontent.com/dmulcahey/featureforge/main/VERSION}\"",
        "REMOTE_STATUS=",
        "VERSION_RELATION=",
        "If `REMOTE_STATUS=unavailable` and this skill was invoked directly, stop before Step 3.",
        "FeatureForge couldn't verify the latest version right now.",
        "If `VERSION_RELATION=equal`, tell the user: `You're already on the latest known version (v$LOCAL_VERSION).`",
        "If `VERSION_RELATION=local_ahead`, tell the user: `Your local FeatureForge install (v$LOCAL_VERSION) is newer than the fetched remote version (v$REMOTE_VERSION).`",
        "If this skill was invoked from an `UPGRADE_AVAILABLE` handoff",
        "You're already on the latest known version (v$LOCAL_VERSION).",
    ] {
        assert_contains(&skill_doc, pattern, "featureforge-upgrade/SKILL.md");
    }
    assert_no_runtime_fallback_execution(&skill_doc, "featureforge-upgrade/SKILL.md");
    assert!(
        !skill_doc.contains("featureforge-update-check"),
        "featureforge-upgrade/SKILL.md should not reference removed helper binaries"
    );
    assert!(
        !skill_doc.contains("featureforge-config"),
        "featureforge-upgrade/SKILL.md should not reference removed helper binaries"
    );

    let step_one = extract_bash_block(&skill_doc, "### Step 1: Resolve install root");

    let tmp_root = TempDir::new().expect("temp root should exist");
    let home_dir = tmp_root.path().join("home");
    fs::create_dir_all(&home_dir).expect("home should exist");
    let current_root = tmp_root.path().join("current-project");
    fs::create_dir_all(&current_root).expect("project root should exist");
    let resolved_install = tmp_root.path().join("resolved-install");
    make_valid_install(&resolved_install, "dir");
    install_mock_featureforge(
        &home_dir,
        &format!(
            "#!/usr/bin/env bash\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--path\" ]; then\n  printf '%s' '{}'\n  exit 0\nfi\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--field\" ] && [ \"${{4:-}}\" = \"upgrade-eligible\" ]; then\n  printf 'true\\n'\n  exit 0\nfi\nexit 0\n",
            resolved_runtime_root_path(&resolved_install)
        ),
    );

    let active_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 resolved helper",
    );
    let active_stdout = String::from_utf8_lossy(&active_output.stdout);
    assert_contains(
        &active_stdout,
        &format!("INSTALL_DIR={}", resolved_install.display()),
        "upgrade skill step 1 resolved helper",
    );

    let renamed_root = tmp_root.path().join("custom-runtime-name");
    make_valid_install(&renamed_root, "dir");
    install_mock_featureforge(
        &home_dir,
        &format!(
            "#!/usr/bin/env bash\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--path\" ]; then\n  printf '%s' '{}'\n  exit 0\nfi\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--field\" ] && [ \"${{4:-}}\" = \"upgrade-eligible\" ]; then\n  printf 'true\\n'\n  exit 0\nfi\nexit 0\n",
            resolved_runtime_root_path(
                &renamed_root
                    .canonicalize()
                    .expect("renamed root canonicalize")
            )
        ),
    );
    let renamed_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 arbitrary resolved path",
    );
    let renamed_stdout = String::from_utf8_lossy(&renamed_output.stdout);
    assert_contains(
        &renamed_stdout,
        &format!(
            "INSTALL_DIR={}",
            renamed_root
                .canonicalize()
                .expect("renamed root canonicalize")
                .display()
        ),
        "upgrade skill step 1 arbitrary resolved path",
    );

    let selected_runtime = tmp_root.path().join("selected-runtime");
    make_valid_install(&selected_runtime, "dir");
    install_mock_featureforge(
        &home_dir,
        "#!/usr/bin/env bash\nif [ \"${1:-}\" = \"repo\" ] && [ \"${2:-}\" = \"runtime-root\" ] && [ \"${3:-}\" = \"--field\" ] && [ \"${4:-}\" = \"upgrade-eligible\" ]; then\n  printf 'true\\n'\n  exit 0\nfi\necho '/wrong-runtime'\nexit 0\n",
    );
    let selected_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[(
            "_FEATUREFORGE_ROOT",
            selected_runtime.to_string_lossy().as_ref(),
        )],
        "upgrade skill step 1 prefers selected runtime root",
    );
    let selected_stdout = String::from_utf8_lossy(&selected_output.stdout);
    assert_contains(
        &selected_stdout,
        &format!("INSTALL_DIR={}", selected_runtime.display()),
        "upgrade skill step 1 prefers selected runtime root",
    );

    let selected_bin_runtime = tmp_root.path().join("selected-bin-runtime");
    make_valid_install(&selected_bin_runtime, "dir");
    let selected_bin = tmp_root.path().join("selected-bin").join("featureforge");
    write_mock_featureforge(
        selected_bin
            .parent()
            .expect("selected bin parent should exist"),
        &format!(
            "#!/usr/bin/env bash\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--path\" ]; then\n  printf '%s' '{}'\n  exit 0\nfi\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--field\" ] && [ \"${{4:-}}\" = \"upgrade-eligible\" ]; then\n  printf 'true\\n'\n  exit 0\nfi\nexit 0\n",
            resolved_runtime_root_path(&selected_bin_runtime)
        ),
    );
    install_mock_featureforge(
        &home_dir,
        "#!/usr/bin/env bash\necho '/wrong-runtime'\nexit 0\n",
    );
    let selected_bin_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[("_FEATUREFORGE_BIN", selected_bin.to_string_lossy().as_ref())],
        "upgrade skill step 1 prefers selected runtime binary",
    );
    let selected_bin_stdout = String::from_utf8_lossy(&selected_bin_output.stdout);
    assert_contains(
        &selected_bin_stdout,
        &format!("INSTALL_DIR={}", selected_bin_runtime.display()),
        "upgrade skill step 1 prefers selected runtime binary",
    );

    let windows_only_runtime = tmp_root.path().join("windows-only-runtime");
    make_windows_only_install(&windows_only_runtime, "dir");
    install_mock_featureforge(
        &home_dir,
        &format!(
            "#!/usr/bin/env bash\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--path\" ]; then\n  printf '%s' '{}'\n  exit 0\nfi\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--field\" ] && [ \"${{4:-}}\" = \"upgrade-eligible\" ]; then\n  printf 'true\\n'\n  exit 0\nfi\nexit 0\n",
            resolved_runtime_root_path(&windows_only_runtime)
        ),
    );
    let windows_only_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 windows-only runtime",
    );
    let windows_only_stdout = String::from_utf8_lossy(&windows_only_output.stdout);
    assert_contains(
        &windows_only_stdout,
        &format!("INSTALL_DIR={}", windows_only_runtime.display()),
        "upgrade skill step 1 windows-only runtime",
    );
    assert_contains(
        &windows_only_stdout,
        &format!(
            "INSTALL_RUNTIME_BIN={}",
            windows_only_runtime.join("bin/featureforge.exe").display()
        ),
        "upgrade skill step 1 windows-only runtime",
    );

    let canonical_unix_helper = canonical_install_bin(&home_dir);
    if canonical_unix_helper.exists() {
        fs::remove_file(&canonical_unix_helper)
            .expect("windows-only direct-upgrade fixture should remove the unix helper");
    }
    let direct_windows_install = canonical_install_root(&home_dir);
    make_windows_only_install(&direct_windows_install, "dir");
    install_mock_featureforge_exe(
        &home_dir,
        &format!(
            "#!/usr/bin/env bash\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--path\" ]; then\n  printf '%s' '{}'\n  exit 0\nfi\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--field\" ] && [ \"${{4:-}}\" = \"upgrade-eligible\" ]; then\n  printf 'true\\n'\n  exit 0\nfi\nexit 0\n",
            resolved_runtime_root_path(&direct_windows_install)
        ),
    );
    let direct_windows_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 direct windows install",
    );
    assert!(
        direct_windows_output.status.success(),
        "direct windows install should stay self-contained for manual /featureforge-upgrade use\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&direct_windows_output.stdout),
        String::from_utf8_lossy(&direct_windows_output.stderr)
    );
    let direct_windows_stdout = String::from_utf8_lossy(&direct_windows_output.stdout);
    assert_contains(
        &direct_windows_stdout,
        &format!("INSTALL_DIR={}", direct_windows_install.display()),
        "upgrade skill step 1 direct windows install",
    );
    assert_contains(
        &direct_windows_stdout,
        &format!(
            "FEATUREFORGE_RUNTIME_BIN={}",
            direct_windows_install
                .join("bin/featureforge.exe")
                .display()
        ),
        "upgrade skill step 1 direct windows install",
    );
    assert_contains(
        &direct_windows_stdout,
        &format!(
            "INSTALL_RUNTIME_BIN={}",
            direct_windows_install
                .join("bin/featureforge.exe")
                .display()
        ),
        "upgrade skill step 1 direct windows install",
    );

    install_mock_featureforge(&home_dir, "#!/usr/bin/env bash\nexit 0\n");
    let unresolved_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 unresolved helper",
    );
    assert!(
        !unresolved_output.status.success(),
        "unresolved helper output should fail closed"
    );
    assert_contains(
        &combined_output(&unresolved_output),
        "ERROR: featureforge runtime root unavailable",
        "upgrade skill step 1 unresolved helper",
    );

    let non_runtime_dir = tmp_root.path().join("non-runtime");
    fs::create_dir_all(&non_runtime_dir).expect("non-runtime dir should exist");
    install_mock_featureforge(
        &home_dir,
        &format!(
            "#!/usr/bin/env bash\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--path\" ]; then\n  printf '%s' '{}'\n  exit 0\nfi\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--field\" ] && [ \"${{4:-}}\" = \"upgrade-eligible\" ]; then\n  printf 'false\\n'\n  exit 0\nfi\nexit 0\n",
            resolved_runtime_root_path(&non_runtime_dir)
        ),
    );
    let malformed_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 non-runtime helper result",
    );
    assert!(
        !malformed_output.status.success(),
        "non-runtime helper output should fail closed"
    );
    assert_contains(
        &combined_output(&malformed_output),
        "ERROR: featureforge runtime root returned no executable featureforge binary",
        "upgrade skill step 1 non-runtime helper result",
    );

    let not_upgrade_eligible = tmp_root.path().join("not-upgrade-eligible");
    fs::create_dir_all(not_upgrade_eligible.join("bin")).expect("non-upgrade-eligible bin dir");
    write_file(&not_upgrade_eligible.join("bin/featureforge"), "");
    make_executable(&not_upgrade_eligible.join("bin/featureforge"));
    write_file(&not_upgrade_eligible.join("VERSION"), "1.0.0\n");
    install_mock_featureforge(
        &home_dir,
        &format!(
            "#!/usr/bin/env bash\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--path\" ]; then\n  printf '%s' '{}'\n  exit 0\nfi\nif [ \"${{1:-}}\" = \"repo\" ] && [ \"${{2:-}}\" = \"runtime-root\" ] && [ \"${{3:-}}\" = \"--field\" ] && [ \"${{4:-}}\" = \"upgrade-eligible\" ]; then\n  printf 'false\\n'\n  exit 0\nfi\nexit 0\n",
            resolved_runtime_root_path(&not_upgrade_eligible)
        ),
    );
    let not_upgrade_eligible_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 non-upgrade-eligible runtime",
    );
    assert!(
        !not_upgrade_eligible_output.status.success(),
        "non-upgrade-eligible runtime should fail closed"
    );
    assert_contains(
        &combined_output(&not_upgrade_eligible_output),
        "ERROR: featureforge runtime root is not upgrade-eligible",
        "upgrade skill step 1 non-upgrade-eligible runtime",
    );

    fs::remove_file(canonical_install_bin(&home_dir)).expect("mock helper should remove");
    fs::remove_file(
        canonical_install_root(&home_dir)
            .join("bin")
            .join("featureforge.exe"),
    )
    .expect("windows packaged helper should remove");
    let unavailable_output = run_bash_block(
        &current_root,
        &home_dir,
        &step_one,
        &[],
        "upgrade skill step 1 unavailable helper",
    );
    assert!(
        !unavailable_output.status.success(),
        "missing helper should fail closed"
    );
    assert_contains(
        &combined_output(&unavailable_output),
        "ERROR: featureforge runtime-root helper unavailable",
        "upgrade skill step 1 unavailable helper",
    );
}

#[test]
fn valid_install_fixture_includes_checked_in_prebuilt_layout() {
    let install_root = TempDir::new().expect("install root tempdir should exist");
    make_valid_install(install_root.path(), "dir");

    for relative in [
        DARWIN_ARM64_BINARY_REL,
        DARWIN_ARM64_CHECKSUM_REL,
        WINDOWS_X64_BINARY_REL,
        WINDOWS_X64_CHECKSUM_REL,
        "bin/prebuilt/manifest.json",
    ] {
        assert!(
            install_root.path().join(relative).is_file(),
            "valid install fixture should include {relative}"
        );
    }
}

#[test]
fn upgrade_skill_version_resolution_matches_shell_contract() {
    let skill_doc = read_skill_doc();
    let step_two = extract_bash_block(
        &skill_doc,
        "### Step 2: Resolve versions and auto-upgrade preference",
    );

    let version_root = TempDir::new().expect("version root should exist");

    let behind_install = version_root.path().join("behind");
    make_valid_install(&behind_install, "dir");
    write_file(&behind_install.join("VERSION"), "5.1.2\n");
    let behind_remote = version_root.path().join("behind-remote");
    write_file(&behind_remote, "5.1.10\n");
    let behind_remote_url = format!("file://{}", behind_remote.display());
    let behind_output = run_bash_block(
        &behind_install,
        version_root.path(),
        &step_two,
        &[
            ("INSTALL_DIR", behind_install.to_string_lossy().as_ref()),
            ("FEATUREFORGE_REMOTE_URL", behind_remote_url.as_str()),
        ],
        "upgrade skill step 2 upgrade relation",
    );
    let behind_stdout = String::from_utf8_lossy(&behind_output.stdout);
    assert_contains(&behind_stdout, "LOCAL_VERSION=5.1.2", "upgrade relation");
    assert_contains(&behind_stdout, "REMOTE_VERSION=5.1.10", "upgrade relation");
    assert_contains(
        &behind_stdout,
        "VERSION_RELATION=upgrade",
        "upgrade relation",
    );

    let equal_install = version_root.path().join("equal");
    make_valid_install(&equal_install, "dir");
    write_file(&equal_install.join("VERSION"), "5.1.0\n");
    let equal_remote = version_root.path().join("equal-remote");
    write_file(&equal_remote, "5.1\n");
    let equal_remote_url = format!("file://{}", equal_remote.display());
    let equal_output = run_bash_block(
        &equal_install,
        version_root.path(),
        &step_two,
        &[
            ("INSTALL_DIR", equal_install.to_string_lossy().as_ref()),
            ("FEATUREFORGE_REMOTE_URL", equal_remote_url.as_str()),
        ],
        "upgrade skill step 2 equal relation",
    );
    let equal_stdout = String::from_utf8_lossy(&equal_output.stdout);
    assert_contains(&equal_stdout, "LOCAL_VERSION=5.1.0", "equal relation");
    assert_contains(&equal_stdout, "REMOTE_VERSION=5.1", "equal relation");
    assert_contains(&equal_stdout, "VERSION_RELATION=equal", "equal relation");

    let ahead_install = version_root.path().join("ahead");
    make_valid_install(&ahead_install, "dir");
    write_file(&ahead_install.join("VERSION"), "5.2.0\n");
    let ahead_remote = version_root.path().join("ahead-remote");
    write_file(&ahead_remote, "5.1.9\n");
    let ahead_remote_url = format!("file://{}", ahead_remote.display());
    let ahead_output = run_bash_block(
        &ahead_install,
        version_root.path(),
        &step_two,
        &[
            ("INSTALL_DIR", ahead_install.to_string_lossy().as_ref()),
            ("FEATUREFORGE_REMOTE_URL", ahead_remote_url.as_str()),
        ],
        "upgrade skill step 2 local ahead relation",
    );
    let ahead_stdout = String::from_utf8_lossy(&ahead_output.stdout);
    assert_contains(&ahead_stdout, "LOCAL_VERSION=5.2.0", "local ahead relation");
    assert_contains(
        &ahead_stdout,
        "REMOTE_VERSION=5.1.9",
        "local ahead relation",
    );
    assert_contains(
        &ahead_stdout,
        "VERSION_RELATION=local_ahead",
        "local ahead relation",
    );

    let unavailable_install = version_root.path().join("unavailable");
    make_valid_install(&unavailable_install, "dir");
    write_file(&unavailable_install.join("VERSION"), "5.1.0\n");
    let unavailable_remote_url = format!(
        "file://{}",
        version_root.path().join("does-not-exist").display()
    );
    let unavailable_output = run_bash_block(
        &unavailable_install,
        version_root.path(),
        &step_two,
        &[
            (
                "INSTALL_DIR",
                unavailable_install.to_string_lossy().as_ref(),
            ),
            ("FEATUREFORGE_REMOTE_URL", unavailable_remote_url.as_str()),
        ],
        "upgrade skill step 2 unavailable relation",
    );
    let unavailable_stdout = String::from_utf8_lossy(&unavailable_output.stdout);
    assert_contains(
        &unavailable_stdout,
        "LOCAL_VERSION=5.1.0",
        "remote unavailable",
    );
    assert_contains(&unavailable_stdout, "REMOTE_VERSION=", "remote unavailable");
    assert_contains(
        &unavailable_stdout,
        "REMOTE_STATUS=unavailable",
        "remote unavailable",
    );
    assert_contains(
        &unavailable_stdout,
        "VERSION_RELATION=unknown",
        "remote unavailable",
    );
}
