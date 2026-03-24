use std::env;
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};

use crate::diagnostics::{DiagnosticError, FailureClass};

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

pub fn superpowers_home_dir() -> Option<PathBuf> {
    resolve_home_dir(|key| env::var_os(key))
}

pub fn superpowers_state_dir() -> PathBuf {
    env::var_os("SUPERPOWERS_STATE_DIR")
        .map(PathBuf::from)
        .or_else(|| superpowers_home_dir().map(|home| home.join(".superpowers")))
        .unwrap_or_else(|| PathBuf::from(".superpowers"))
}

pub fn write_atomic(path: &Path, contents: impl AsRef<[u8]>) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let temp_path = atomic_temp_path(path);
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

fn atomic_temp_path(path: &Path) -> PathBuf {
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
