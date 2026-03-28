use std::fs;
use std::path::{Path, PathBuf};

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf()
}

fn assert_file_contains(path: PathBuf, needle: &str) {
    let source = fs::read_to_string(&path)
        .unwrap_or_else(|error| panic!("{} should be readable: {error}", path.display()));
    assert!(
        source.contains(needle),
        "{} should contain {:?}",
        path.display(),
        needle
    );
}

#[test]
fn skill_docs_require_parallel_first_execution_topology_sections() {
    let root = repo_root();

    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "## Execution Strategy",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "## Dependency Diagram",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "After Task 4, create three worktrees and run Tasks 5, 6, and 7 in parallel:",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Task 5 owns lease and downgrade artifact contracts plus observability helpers.",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Execute Task 8 serially after Tasks 5 and 6 merge back.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "execution_strategy_present",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "dependency_diagram_present",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "execution_topology_valid",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "serial_hazards_resolved",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "parallel_lane_ownership_valid",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "parallel_workspace_isolation_valid",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "fake-parallel hotspot files",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Either declare one isolated worktree per task or state an explicit worktree count that exactly matches the parallel batch size.",
    );
}
