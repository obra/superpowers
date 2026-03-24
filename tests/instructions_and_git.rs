use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use superpowers::git::discover_repo_identity;
use superpowers::instructions::{collect_active_instruction_files, parse_protected_branches};

fn unique_temp_dir(label: &str) -> std::path::PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock should be after unix epoch")
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("superpowers-{label}-{nanos}"));
    fs::create_dir_all(&dir).expect("temp dir should be created");
    dir
}

fn write_file(path: impl AsRef<Path>, contents: &str) {
    let path = path.as_ref();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("parent directories should exist");
    }
    fs::write(path, contents).expect("file should be written");
}

fn run_git(repo_dir: &Path, args: &[&str]) {
    let status = Command::new("git")
        .args(args)
        .current_dir(repo_dir)
        .status()
        .expect("git should launch for test setup");
    assert!(status.success(), "git {:?} should succeed", args);
}

#[test]
fn instruction_chain_respects_root_then_nested_order() {
    let repo_root = unique_temp_dir("instruction-order");
    let start_dir = repo_root.join("apps/cli");
    fs::create_dir_all(&start_dir).expect("nested start dir should exist");

    write_file(repo_root.join("AGENTS.md"), "# root agents\n");
    write_file(repo_root.join("AGENTS.override.md"), "# root override\n");
    write_file(
        repo_root.join(".github/copilot-instructions.md"),
        "# root copilot\n",
    );
    write_file(
        repo_root.join(".github/instructions/10-base.instructions.md"),
        "# base instruction\n",
    );
    write_file(
        repo_root.join(".github/instructions/20-extra.instructions.md"),
        "# extra instruction\n",
    );
    write_file(repo_root.join("apps/AGENTS.md"), "# nested agents\n");
    write_file(
        repo_root.join("apps/AGENTS.override.md"),
        "# nested override\n",
    );

    let canonical_repo_root = fs::canonicalize(&repo_root).expect("repo root should canonicalize");
    let files =
        collect_active_instruction_files(canonical_repo_root.as_path(), start_dir.as_path())
            .unwrap();
    let rel_files: Vec<_> = files
        .iter()
        .map(|path: &std::path::PathBuf| {
            path.strip_prefix(&canonical_repo_root)
                .expect("instruction file should stay under repo root")
                .to_string_lossy()
                .replace('\\', "/")
        })
        .collect();

    assert_eq!(
        rel_files,
        vec![
            "AGENTS.md",
            "AGENTS.override.md",
            ".github/copilot-instructions.md",
            ".github/instructions/10-base.instructions.md",
            ".github/instructions/20-extra.instructions.md",
            "apps/AGENTS.md",
            "apps/AGENTS.override.md",
        ]
    );
}

#[test]
fn invalid_protected_branch_instruction_fails_closed() {
    let repo_root = unique_temp_dir("instruction-invalid");
    write_file(
        repo_root.join("AGENTS.override.md"),
        "Superpowers protected branches: release/*\n",
    );

    let files = collect_active_instruction_files(repo_root.as_path(), repo_root.as_path()).unwrap();
    let err = parse_protected_branches(&files).unwrap_err();
    assert_eq!(err.failure_class(), "InstructionParseFailed");
}

#[test]
fn detached_head_uses_current_branch_name() {
    let repo_root = unique_temp_dir("detached-head");
    write_file(repo_root.join("README.md"), "# detached head fixture\n");

    run_git(&repo_root, &["init"]);
    run_git(&repo_root, &["config", "user.name", "Superpowers Tests"]);
    run_git(
        &repo_root,
        &["config", "user.email", "superpowers-tests@example.com"],
    );
    run_git(&repo_root, &["add", "README.md"]);
    run_git(&repo_root, &["commit", "-m", "init"]);
    run_git(&repo_root, &["checkout", "--detach", "HEAD"]);

    let identity = discover_repo_identity(repo_root.as_path()).unwrap();
    assert_eq!(identity.branch_name, "current");
}

#[test]
fn source_files_reject_git_cli_and_shell_eval_shortcuts() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    for relative in [
        "src/git/mod.rs",
        "src/instructions/mod.rs",
        "src/compat/argv0.rs",
    ] {
        let contents = fs::read_to_string(manifest_dir.join(relative))
            .expect("foundation source file should exist");
        for forbidden in [
            "Command::new(\"git\")",
            "git rev-parse",
            "sh -c",
            "powershell -Command",
            "eval(",
        ] {
            assert!(
                !contents.contains(forbidden),
                "{relative} should not contain forbidden shortcut pattern: {forbidden}"
            );
        }
    }
}
