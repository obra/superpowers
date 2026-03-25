use std::fs;
use std::path::{Path, PathBuf};

use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::paths::{normalize_identifier_token, normalize_whitespace};

pub fn collect_active_instruction_files(
    repo_root: &Path,
    start_dir: &Path,
) -> Result<Vec<PathBuf>, DiagnosticError> {
    let repo_root = fs::canonicalize(repo_root).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not resolve the repo root for instruction discovery: {err}"),
        )
    })?;
    let start_dir = fs::canonicalize(start_dir).unwrap_or_else(|_| repo_root.clone());
    let mut files = Vec::new();

    push_if_file(&mut files, repo_root.join("AGENTS.md"));
    push_if_file(&mut files, repo_root.join("AGENTS.override.md"));
    push_if_file(
        &mut files,
        repo_root.join(".github/copilot-instructions.md"),
    );

    let instructions_dir = repo_root.join(".github/instructions");
    if instructions_dir.is_dir() {
        let mut instruction_files: Vec<_> = fs::read_dir(&instructions_dir)
            .map_err(|err| {
                DiagnosticError::new(
                    FailureClass::InstructionParseFailed,
                    format!("Could not list instruction files: {err}"),
                )
            })?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .filter(|path| path.extension().is_some_and(|ext| ext == "md"))
            .filter(|path| {
                path.file_name()
                    .and_then(std::ffi::OsStr::to_str)
                    .is_some_and(|name| name.ends_with(".instructions.md"))
            })
            .collect();
        instruction_files.sort();
        files.extend(instruction_files);
    }

    let effective_start = if start_dir.starts_with(&repo_root) {
        start_dir
    } else {
        repo_root.clone()
    };
    let mut nested_dirs = Vec::new();
    let mut cursor = effective_start.clone();
    loop {
        nested_dirs.push(cursor.clone());
        if cursor == repo_root {
            break;
        }
        cursor = cursor
            .parent()
            .map(Path::to_path_buf)
            .unwrap_or_else(|| repo_root.clone());
    }
    nested_dirs.reverse();

    for dir in nested_dirs.into_iter().skip(1) {
        push_if_file(&mut files, dir.join("AGENTS.md"));
        push_if_file(&mut files, dir.join("AGENTS.override.md"));
    }

    Ok(files)
}

pub fn parse_protected_branches(files: &[PathBuf]) -> Result<Vec<String>, DiagnosticError> {
    let mut branches = Vec::new();

    for file in files {
        let contents = fs::read_to_string(file).map_err(|err| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Could not read instruction file {}: {err}", file.display()),
            )
        })?;
        for line in contents.lines() {
            let trimmed = line.trim_start();
            let Some(raw_list) = trimmed.strip_prefix("FeatureForge protected branches:") else {
                continue;
            };
            for raw_branch_name in raw_list.split(',') {
                let raw_branch_name = normalize_whitespace(raw_branch_name);
                if raw_branch_name.is_empty() {
                    return Err(parse_failure(
                        "Protected-branch instruction entries may not be blank.",
                    ));
                }
                let normalized_branch_name = normalize_identifier_token(&raw_branch_name);
                if normalized_branch_name.is_empty() {
                    return Err(parse_failure(
                        "Protected-branch instruction entries may not be blank after normalization.",
                    ));
                }
                if raw_branch_name != normalized_branch_name {
                    return Err(parse_failure(
                        "Protected-branch instruction entries must already use normalized exact branch names.",
                    ));
                }
                branches.push(normalized_branch_name);
            }
        }
    }

    Ok(branches)
}

fn push_if_file(files: &mut Vec<PathBuf>, candidate: PathBuf) {
    if candidate.is_file() {
        files.push(candidate);
    }
}

fn parse_failure(message: &str) -> DiagnosticError {
    DiagnosticError::new(FailureClass::InstructionParseFailed, message)
}
