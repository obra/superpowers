use std::path::Path;

use featureforge::compat::argv0::canonical_command_from_argv0;
use featureforge::paths::{
    RepoPath, atomic_publish_temp_path, branch_storage_key, harness_authoritative_artifact_path,
    harness_authoritative_artifact_publish_temp_path, harness_authoritative_artifacts_dir,
    harness_dependency_index_path, harness_state_path, harness_state_publish_temp_path,
};

#[test]
fn repo_paths_normalize_backslashes_and_dot_segments() {
    let path = RepoPath::parse(r"docs\featureforge//specs/./new-spec.md").unwrap();
    assert_eq!(path.as_str(), "docs/featureforge/specs/new-spec.md");
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
    assert_eq!(canonical_command_from_argv0("featureforge"), &[] as &[&str]);
    assert_eq!(
        canonical_command_from_argv0("featureforge-workflow-status"),
        &["workflow", "status"]
    );
    assert_eq!(
        canonical_command_from_argv0("featureforge-plan-contract"),
        &["plan", "contract"]
    );
    assert_eq!(
        canonical_command_from_argv0("featureforge-repo-safety"),
        &["repo-safety"]
    );
}

#[test]
fn harness_paths_are_branch_scoped_and_centralized() {
    let state_dir = Path::new("/tmp/featureforge-state");
    let repo_slug = "example-repo";
    let branch_name = "feature/execution-harness";
    let safe_branch = branch_storage_key(branch_name);

    let harness_root = state_dir
        .join("projects")
        .join(repo_slug)
        .join("branches")
        .join(&safe_branch)
        .join("execution-harness");
    assert_eq!(
        harness_state_path(state_dir, repo_slug, branch_name),
        harness_root.join("state.json")
    );
    assert_eq!(
        harness_dependency_index_path(state_dir, repo_slug, branch_name),
        harness_root.join("dependency-index.json")
    );
    assert_eq!(
        harness_authoritative_artifacts_dir(state_dir, repo_slug, branch_name),
        harness_root.join("authoritative-artifacts")
    );
    assert_eq!(
        harness_authoritative_artifact_path(
            state_dir,
            repo_slug,
            branch_name,
            "contract-r1-a12.md",
        ),
        harness_root
            .join("authoritative-artifacts")
            .join("contract-r1-a12.md")
    );
}

#[test]
fn atomic_publish_helpers_keep_temp_paths_adjacent_to_canonical_targets() {
    let state_dir = Path::new("/tmp/featureforge-state");
    let repo_slug = "example-repo";
    let branch_name = "feature/execution-harness";

    let state_path = harness_state_path(state_dir, repo_slug, branch_name);
    let state_publish_path = harness_state_publish_temp_path(state_dir, repo_slug, branch_name);
    assert_ne!(state_publish_path, state_path);
    assert_eq!(state_publish_path.parent(), state_path.parent());
    let state_name = state_path
        .file_name()
        .expect("state path should have a file name")
        .to_string_lossy()
        .to_string();
    let state_publish_name = state_publish_path
        .file_name()
        .expect("publish path should have a file name")
        .to_string_lossy()
        .to_string();
    assert!(state_publish_name.starts_with(&format!("{state_name}.tmp-")));

    let artifact_path = harness_authoritative_artifact_path(
        state_dir,
        repo_slug,
        branch_name,
        "evaluation-r1-a13.md",
    );
    let artifact_publish_path = harness_authoritative_artifact_publish_temp_path(
        state_dir,
        repo_slug,
        branch_name,
        "evaluation-r1-a13.md",
    );
    assert_ne!(artifact_publish_path, artifact_path);
    assert_eq!(artifact_publish_path.parent(), artifact_path.parent());
    let artifact_name = artifact_path
        .file_name()
        .expect("artifact path should have a file name")
        .to_string_lossy()
        .to_string();
    let artifact_publish_name = artifact_publish_path
        .file_name()
        .expect("artifact publish path should have a file name")
        .to_string_lossy()
        .to_string();
    assert!(artifact_publish_name.starts_with(&format!("{artifact_name}.tmp-")));

    let direct_publish_path = atomic_publish_temp_path(&artifact_path);
    assert_ne!(direct_publish_path, artifact_path);
    assert_eq!(direct_publish_path.parent(), artifact_path.parent());
}
