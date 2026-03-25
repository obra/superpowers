use std::fs;
use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::paths::branch_storage_key;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RepositoryIdentity {
    pub repo_root: PathBuf,
    pub remote_url: Option<String>,
    pub branch_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlugIdentity {
    pub repo_root: PathBuf,
    pub remote_url: Option<String>,
    pub branch_name: String,
    pub repo_slug: String,
    pub safe_branch: String,
}

pub fn canonicalize_repo_root_path(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

pub fn canonicalize_repo_root_string(path: &Path) -> String {
    canonicalize_repo_root_path(path)
        .to_string_lossy()
        .into_owned()
}

pub fn stored_repo_root_matches_current(stored_repo_root: &str, current_repo_root: &Path) -> bool {
    if stored_repo_root.is_empty() {
        return false;
    }
    let current = canonicalize_repo_root_string(current_repo_root);
    if stored_repo_root == current {
        return true;
    }
    let stored_path = Path::new(stored_repo_root);
    stored_path.is_absolute() && canonicalize_repo_root_string(stored_path) == current
}

pub fn discover_repo_identity(start_dir: &Path) -> Result<RepositoryIdentity, DiagnosticError> {
    let repo = gix::discover(start_dir).map_err(|err| {
        DiagnosticError::new(
            FailureClass::BranchDetectionFailed,
            format!("Could not discover the current repository: {err}"),
        )
    })?;
    let head = repo.head().map_err(|err| {
        DiagnosticError::new(
            FailureClass::BranchDetectionFailed,
            format!("Could not determine the current branch: {err}"),
        )
    })?;

    let repo_root = repo
        .workdir()
        .map_or_else(|| repo.path().to_path_buf(), Path::to_path_buf);
    let repo_root = canonicalize_repo_root_path(&repo_root);
    let branch_name = if head.is_detached() {
        String::from("current")
    } else {
        head.referent_name()
            .map(|name| name.shorten().to_string())
            .filter(|name| !name.is_empty())
            .unwrap_or_else(|| String::from("current"))
    };
    let remote_url = repo.find_remote("origin").ok().and_then(|remote| {
        remote
            .url(gix::remote::Direction::Fetch)
            .map(|url| url.to_string())
    });

    Ok(RepositoryIdentity {
        repo_root,
        remote_url,
        branch_name,
    })
}

pub fn discover_slug_identity(start_dir: &Path) -> SlugIdentity {
    match discover_repo_identity(start_dir) {
        Ok(identity) => {
            let safe_branch = branch_storage_key(&identity.branch_name);
            SlugIdentity {
                repo_slug: derive_repo_slug(&identity.repo_root, identity.remote_url.as_deref()),
                safe_branch,
                repo_root: identity.repo_root,
                remote_url: identity.remote_url,
                branch_name: identity.branch_name,
            }
        }
        Err(_) => {
            let repo_root = canonicalize_repo_root_path(start_dir);
            let branch_name = String::from("current");
            SlugIdentity {
                repo_slug: derive_repo_slug(&repo_root, None),
                safe_branch: String::from("current"),
                repo_root,
                remote_url: None,
                branch_name,
            }
        }
    }
}

pub fn derive_repo_slug(repo_root: &Path, remote_url: Option<&str>) -> String {
    if let Some(remote_url) = remote_url {
        if let Some(slug) = slug_from_remote(remote_url) {
            return slug;
        }
    }

    let repo_name = repo_root
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("repo");
    format!("{repo_name}-{}", hash_repo_root(repo_root))
}

fn slug_from_remote(remote_url: &str) -> Option<String> {
    let trimmed = remote_url.trim_end_matches(".git");
    let mut parts = trimmed
        .split(['/', ':'])
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>();
    if parts.len() < 2 {
        return None;
    }
    let repo = parts.pop()?;
    let owner = parts.pop()?;
    Some(format!("{owner}-{repo}"))
}

pub fn sha256_hex(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    format!("{digest:x}")
}

pub fn short_sha256_hex(bytes: &[u8], width: usize) -> String {
    sha256_hex(bytes)[..width].to_owned()
}

fn hash_repo_root(repo_root: &Path) -> String {
    short_sha256_hex(repo_root.to_string_lossy().as_bytes(), 12)
}
