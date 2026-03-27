use std::env;
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

use crate::diagnostics::{DiagnosticError, FailureClass};

const PROJECTS_DIR: &str = "projects";
const BRANCHES_DIR: &str = "branches";
const EXECUTION_HARNESS_DIR: &str = "execution-harness";
const HARNESS_STATE_FILE: &str = "state.json";
const HARNESS_DEPENDENCY_INDEX_FILE: &str = "dependency-index.json";
const HARNESS_AUTHORITATIVE_ARTIFACTS_DIR: &str = "authoritative-artifacts";
const HARNESS_OBSERVABILITY_EVENTS_FILE: &str = "observability-events.jsonl";
const HARNESS_TELEMETRY_COUNTERS_FILE: &str = "telemetry-counters.json";

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct RepoPath(String);

impl RepoPath {
    pub fn parse(input: &str) -> Result<Self, DiagnosticError> {
        normalize_repo_relative_path(input).map(Self)
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

pub fn normalize_repo_relative_path(input: &str) -> Result<String, DiagnosticError> {
    if input.is_empty() || input.starts_with('/') {
        return Err(invalid_repo_path(input));
    }
    if looks_like_windows_absolute(input) {
        return Err(invalid_repo_path(input));
    }

    let normalized_input = input.replace('\\', "/");
    if normalized_input.is_empty()
        || normalized_input.starts_with('/')
        || normalized_input.starts_with("//")
        || looks_like_windows_absolute(&normalized_input)
    {
        return Err(invalid_repo_path(input));
    }

    let mut parts = Vec::new();
    for part in normalized_input.split('/') {
        match part {
            "" | "." => {}
            ".." => return Err(invalid_repo_path(input)),
            value => parts.push(value),
        }
    }

    if parts.is_empty() {
        return Err(invalid_repo_path(input));
    }

    Ok(parts.join("/"))
}

pub fn normalize_whitespace(value: &str) -> String {
    let mut normalized = String::new();
    for token in value.split_whitespace() {
        if !normalized.is_empty() {
            normalized.push(' ');
        }
        normalized.push_str(token);
    }
    normalized
}

pub fn normalize_identifier_token(value: &str) -> String {
    let normalized = normalize_whitespace(value);
    if normalized.is_empty() {
        return String::new();
    }

    let mut output = String::with_capacity(normalized.len());
    for ch in normalized.chars() {
        if ch.is_ascii_alphanumeric() || matches!(ch, '.' | '_' | '-') {
            output.push(ch);
        } else {
            output.push('-');
        }
    }

    if output.chars().all(|ch| ch == '-') {
        String::new()
    } else {
        output
    }
}

pub fn branch_storage_key(value: &str) -> String {
    let normalized = normalize_identifier_token(value);
    if normalized.is_empty() {
        return String::from("current");
    }
    if normalized == value {
        return normalized;
    }

    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    let digest = format!("{:x}", hasher.finalize());
    format!("{normalized}-{}", &digest[..12])
}

pub fn featureforge_home_dir() -> Option<PathBuf> {
    resolve_home_dir(|key| env::var_os(key))
}

pub fn featureforge_state_dir() -> PathBuf {
    env::var_os("FEATUREFORGE_STATE_DIR")
        .map(PathBuf::from)
        .or_else(|| featureforge_home_dir().map(|home| home.join(".featureforge")))
        .unwrap_or_else(|| PathBuf::from(".featureforge"))
}

pub fn harness_branch_root(state_dir: &Path, repo_slug: &str, branch_name: &str) -> PathBuf {
    let safe_branch = branch_storage_key(branch_name);
    state_dir
        .join(PROJECTS_DIR)
        .join(repo_slug)
        .join(BRANCHES_DIR)
        .join(safe_branch)
        .join(EXECUTION_HARNESS_DIR)
}

pub fn harness_state_path(state_dir: &Path, repo_slug: &str, branch_name: &str) -> PathBuf {
    harness_branch_root(state_dir, repo_slug, branch_name).join(HARNESS_STATE_FILE)
}

pub fn harness_dependency_index_path(
    state_dir: &Path,
    repo_slug: &str,
    branch_name: &str,
) -> PathBuf {
    harness_branch_root(state_dir, repo_slug, branch_name).join(HARNESS_DEPENDENCY_INDEX_FILE)
}

pub fn harness_observability_events_path(
    state_dir: &Path,
    repo_slug: &str,
    branch_name: &str,
) -> PathBuf {
    harness_branch_root(state_dir, repo_slug, branch_name).join(HARNESS_OBSERVABILITY_EVENTS_FILE)
}

pub fn harness_telemetry_counters_path(
    state_dir: &Path,
    repo_slug: &str,
    branch_name: &str,
) -> PathBuf {
    harness_branch_root(state_dir, repo_slug, branch_name).join(HARNESS_TELEMETRY_COUNTERS_FILE)
}

pub fn harness_authoritative_artifacts_dir(
    state_dir: &Path,
    repo_slug: &str,
    branch_name: &str,
) -> PathBuf {
    harness_branch_root(state_dir, repo_slug, branch_name).join(HARNESS_AUTHORITATIVE_ARTIFACTS_DIR)
}

pub fn harness_authoritative_artifact_path(
    state_dir: &Path,
    repo_slug: &str,
    branch_name: &str,
    artifact_file_name: &str,
) -> PathBuf {
    harness_authoritative_artifacts_dir(state_dir, repo_slug, branch_name).join(artifact_file_name)
}

pub fn harness_state_publish_temp_path(
    state_dir: &Path,
    repo_slug: &str,
    branch_name: &str,
) -> PathBuf {
    let state_path = harness_state_path(state_dir, repo_slug, branch_name);
    atomic_publish_temp_path(&state_path)
}

pub fn harness_authoritative_artifact_publish_temp_path(
    state_dir: &Path,
    repo_slug: &str,
    branch_name: &str,
    artifact_file_name: &str,
) -> PathBuf {
    let artifact_path =
        harness_authoritative_artifact_path(state_dir, repo_slug, branch_name, artifact_file_name);
    atomic_publish_temp_path(&artifact_path)
}

pub fn write_atomic(path: &Path, contents: impl AsRef<[u8]>) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let temp_path = atomic_publish_temp_path(path);
    fs::write(&temp_path, contents)?;
    match fs::rename(&temp_path, path) {
        Ok(()) => Ok(()),
        Err(error) => {
            let _ = fs::remove_file(&temp_path);
            Err(error)
        }
    }
}

fn invalid_repo_path(input: &str) -> DiagnosticError {
    DiagnosticError::new(
        FailureClass::InvalidRepoPath,
        format!("Paths must stay repo-relative and non-traversing: {input}"),
    )
}

fn looks_like_windows_absolute(input: &str) -> bool {
    let bytes = input.as_bytes();
    matches!(bytes, [drive, b':', b'/' | b'\\', ..] if drive.is_ascii_alphabetic())
        || input.starts_with("\\\\")
}

pub fn atomic_publish_temp_path(path: &Path) -> PathBuf {
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0);
    let pid = std::process::id();
    let file_name = path
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or("state");
    path.with_file_name(format!("{file_name}.tmp-{pid}-{stamp}"))
}

fn resolve_home_dir<F>(mut get_var: F) -> Option<PathBuf>
where
    F: FnMut(&str) -> Option<OsString>,
{
    get_var("HOME")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .or_else(|| {
            get_var("USERPROFILE")
                .filter(|value| !value.is_empty())
                .map(PathBuf::from)
        })
        .or_else(|| {
            let home_drive = get_var("HOMEDRIVE").filter(|value| !value.is_empty())?;
            let home_path = get_var("HOMEPATH").filter(|value| !value.is_empty())?;
            let mut combined = home_drive;
            combined.push(home_path);
            Some(PathBuf::from(combined))
        })
}
