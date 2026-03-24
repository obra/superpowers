use superpowers::compat::argv0::canonical_command_from_argv0;
use superpowers::paths::RepoPath;

#[test]
fn repo_paths_normalize_backslashes_and_dot_segments() {
    let path = RepoPath::parse(r"docs\superpowers//specs/./new-spec.md").unwrap();
    assert_eq!(path.as_str(), "docs/superpowers/specs/new-spec.md");
}

#[test]
fn repo_paths_reject_absolute_and_traversing_inputs() {
    for input in [
        "",
        ".",
        "..",
        "../spec.md",
        "/tmp/spec.md",
        r"C:\temp\spec.md",
        "C:/temp/spec.md",
        r"\\server\share\spec.md",
    ] {
        let err = RepoPath::parse(input).unwrap_err();
        assert_eq!(err.failure_class(), "InvalidRepoPath", "input: {input}");
    }
}

#[test]
fn argv0_dispatch_preserves_canonical_command_tree() {
    assert_eq!(canonical_command_from_argv0("superpowers"), &[] as &[&str]);
    assert_eq!(
        canonical_command_from_argv0("superpowers-workflow-status"),
        &["workflow", "status"]
    );
    assert_eq!(
        canonical_command_from_argv0("superpowers-plan-contract"),
        &["plan", "contract"]
    );
    assert_eq!(
        canonical_command_from_argv0("superpowers-repo-safety"),
        &["repo-safety"]
    );
}
