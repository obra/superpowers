use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::git::RepositoryIdentity;
use crate::paths::{branch_storage_key, write_atomic as write_atomic_file};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
pub struct WorkflowManifest {
    pub version: u32,
    pub repo_root: String,
    pub branch: String,
    pub expected_spec_path: String,
    pub expected_plan_path: String,
    pub status: String,
    pub next_skill: String,
    pub reason: String,
    pub note: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ManifestLoadResult {
    Missing,
    Loaded(WorkflowManifest),
    Corrupt { backup_path: PathBuf },
}

const CROSS_SLUG_RECOVERY_LIMIT: usize = 12;

pub fn manifest_path(identity: &RepositoryIdentity, state_dir: &Path) -> PathBuf {
    let slug = derive_repo_slug(identity);
    let safe_branch = branch_storage_key(&identity.branch_name);
    let user_name = env::var("USER").unwrap_or_else(|_| String::from("user"));
    state_dir
        .join("projects")
        .join(slug)
        .join(format!("{user_name}-{safe_branch}-workflow-state.json"))
}

pub fn load_manifest(path: &Path) -> ManifestLoadResult {
    let Ok(source) = fs::read_to_string(path) else {
        return ManifestLoadResult::Missing;
    };
    match serde_json::from_str(&source) {
        Ok(manifest) => ManifestLoadResult::Loaded(manifest),
        Err(_) => {
            let backup_path = corrupt_backup_path(path);
            let _ = fs::rename(path, &backup_path);
            ManifestLoadResult::Corrupt { backup_path }
        }
    }
}

pub fn load_manifest_read_only(path: &Path) -> ManifestLoadResult {
    let Ok(source) = fs::read_to_string(path) else {
        return ManifestLoadResult::Missing;
    };
    match serde_json::from_str(&source) {
        Ok(manifest) => ManifestLoadResult::Loaded(manifest),
        Err(_) => ManifestLoadResult::Corrupt {
            backup_path: corrupt_backup_path(path),
        },
    }
}

pub fn recover_slug_changed_manifest(
    identity: &RepositoryIdentity,
    state_dir: &Path,
    current_manifest_path: &Path,
) -> Option<WorkflowManifest> {
    recover_slug_changed_manifest_with_loader(
        identity,
        state_dir,
        current_manifest_path,
        load_manifest,
    )
}

pub fn recover_slug_changed_manifest_read_only(
    identity: &RepositoryIdentity,
    state_dir: &Path,
    current_manifest_path: &Path,
) -> Option<WorkflowManifest> {
    recover_slug_changed_manifest_with_loader(
        identity,
        state_dir,
        current_manifest_path,
        load_manifest_read_only,
    )
}

fn recover_slug_changed_manifest_with_loader(
    identity: &RepositoryIdentity,
    state_dir: &Path,
    current_manifest_path: &Path,
    loader: fn(&Path) -> ManifestLoadResult,
) -> Option<WorkflowManifest> {
    let projects_dir = state_dir.join("projects");
    let manifest_name = current_manifest_path.file_name()?;
    let current_project_dir = current_manifest_path.parent();
    let mut candidate_dirs = fs::read_dir(&projects_dir)
        .ok()?
        .flatten()
        .map(|entry| entry.path())
        .filter(|path| path.is_dir())
        .filter(|path| current_project_dir != Some(path.as_path()))
        .collect::<Vec<_>>();
    candidate_dirs.sort();

    let expected_repo_root = identity.repo_root.to_string_lossy();
    for project_dir in candidate_dirs.into_iter().take(CROSS_SLUG_RECOVERY_LIMIT) {
        let candidate_path = project_dir.join(manifest_name);
        let ManifestLoadResult::Loaded(manifest) = loader(&candidate_path) else {
            continue;
        };
        if manifest.repo_root == expected_repo_root && manifest.branch == identity.branch_name {
            return Some(manifest);
        }
    }

    None
}

pub fn save_manifest(path: &Path, manifest: &WorkflowManifest) -> std::io::Result<()> {
    let payload = serde_json::to_string(manifest)
        .expect("workflow manifest serialization should stay valid json");
    write_atomic_file(path, payload)
}

fn derive_repo_slug(identity: &RepositoryIdentity) -> String {
    if let Some(remote) = identity.remote_url.as_deref() {
        let normalized = remote.trim_end_matches(".git").replace(':', "/");
        let parts = normalized
            .split('/')
            .filter(|part| !part.is_empty())
            .collect::<Vec<_>>();
        if let [.., owner, repo] = parts.as_slice() {
            return format!("{owner}-{repo}");
        }
    }

    let repo_name = identity
        .repo_root
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("repo");
    let digest = Sha256::digest(identity.repo_root.to_string_lossy().as_bytes());
    let suffix = format!("{digest:x}");
    format!("{repo_name}-{}", &suffix[..12])
}

fn corrupt_backup_path(path: &Path) -> PathBuf {
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0);
    let file_name = path
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("workflow-state.json");
    path.with_file_name(format!("{file_name}.corrupt-{stamp}"))
}
