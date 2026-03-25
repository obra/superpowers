use std::collections::BTreeSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use schemars::{JsonSchema, schema_for};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::cli::repo_safety::{RepoSafetyApproveArgs, RepoSafetyCheckArgs};
use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::git::{discover_repo_identity, discover_slug_identity};
use crate::instructions::{collect_active_instruction_files, parse_protected_branches};
use crate::paths::{
    RepoPath, branch_storage_key, featureforge_state_dir, normalize_identifier_token,
    normalize_whitespace, write_atomic as write_atomic_file,
};

const DEFAULT_PROTECTED_BRANCHES: &[&str] = &["main", "master", "dev", "develop"];
const WRITE_TARGET_ALLOWLIST: &[&str] = &[
    "spec-artifact-write",
    "plan-artifact-write",
    "approval-header-write",
    "execution-task-slice",
    "release-doc-write",
    "repo-file-write",
    "git-commit",
    "git-merge",
    "git-push",
    "git-worktree-cleanup",
    "branch-finish",
];
const MAX_REASON_LENGTH: usize = 240;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RepoSafetyResult {
    pub outcome: String,
    pub intent: String,
    pub branch: String,
    pub protected: bool,
    pub protected_by: String,
    pub task_id: String,
    pub approval_fingerprint: String,
    pub approval_path: String,
    pub failure_class: String,
    pub reason: String,
    pub suggested_next_skill: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ApprovalMigrationSummary {
    pub migrated: Vec<(PathBuf, PathBuf)>,
    pub invalidated_backups: Vec<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ApprovalRecord {
    repo_root: String,
    branch: String,
    stage: String,
    task_id: String,
    paths: Vec<String>,
    write_targets: Vec<String>,
    approval_fingerprint: String,
    approval_reason: String,
    protected_by: String,
    approved_at: String,
}

#[derive(Debug, Clone)]
struct Scope {
    stage: String,
    task_id: String,
    paths: Vec<String>,
    write_targets: Vec<String>,
    approval_fingerprint: String,
    canonical_approval_path: PathBuf,
}

#[derive(Debug, Clone)]
pub struct RepoSafetyRuntime {
    repo_root: PathBuf,
    branch_name: String,
    repo_slug: String,
    safe_branch: String,
    state_dir: PathBuf,
    protected: bool,
    protected_by: String,
}

impl RepoSafetyRuntime {
    pub fn discover(current_dir: &Path) -> Result<Self, DiagnosticError> {
        if env::var("FEATUREFORGE_REPO_SAFETY_TEST_FAILPOINT").as_deref()
            == Ok("instruction_parse_failure")
        {
            return Err(DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                "Repo-safety test failpoint requested an instruction-parse failure.",
            ));
        }
        let identity = discover_repo_identity(current_dir)?;
        let slug_identity = discover_slug_identity(current_dir);
        let normalized_branch = normalize_identifier_token(&identity.branch_name);
        let safe_branch = branch_storage_key(&identity.branch_name);
        let (protected, protected_by) =
            branch_protection(current_dir, &identity.repo_root, &normalized_branch)?;

        Ok(Self {
            repo_root: identity.repo_root,
            branch_name: identity.branch_name,
            repo_slug: slug_identity.repo_slug,
            safe_branch,
            state_dir: state_dir(),
            protected,
            protected_by,
        })
    }

    pub fn check(&self, args: &RepoSafetyCheckArgs) -> Result<RepoSafetyResult, DiagnosticError> {
        let intent = match args.intent.as_str() {
            "read" | "write" => args.intent.as_str(),
            _ => {
                return Err(DiagnosticError::new(
                    FailureClass::InvalidCommandInput,
                    "check requires --intent read|write.",
                ));
            }
        };
        let scope = self.prepare_scope(
            &args.stage,
            args.task_id.as_deref(),
            &args.paths,
            &args.write_targets,
        )?;

        if intent == "read" {
            return Ok(self.result("allowed", intent, &scope, "", "read_allowed", ""));
        }
        if !self.protected {
            return Ok(self.result("allowed", intent, &scope, "", "branch_not_protected", ""));
        }

        match self.read_approval(&scope)? {
            ApprovalLookup::Missing => Ok(self.result(
                "blocked",
                intent,
                &scope,
                "ProtectedBranchDetected",
                "protected_branch_requires_approval",
                "featureforge:using-git-worktrees",
            )),
            ApprovalLookup::Found(record) => {
                if !record_matches_scope(&record, &self.repo_root, &self.branch_name, &scope) {
                    return Ok(self.result(
                        "blocked",
                        intent,
                        &scope,
                        "ApprovalScopeMismatch",
                        "approval_scope_mismatch",
                        "featureforge:using-git-worktrees",
                    ));
                }
                if record.approval_fingerprint != scope.approval_fingerprint {
                    return Ok(self.result(
                        "blocked",
                        intent,
                        &scope,
                        "ApprovalFingerprintMismatch",
                        "approval_fingerprint_mismatch",
                        "featureforge:using-git-worktrees",
                    ));
                }
                Ok(self.result("allowed", intent, &scope, "", "approval_matched", ""))
            }
        }
    }

    pub fn approve(
        &self,
        args: &RepoSafetyApproveArgs,
    ) -> Result<RepoSafetyResult, DiagnosticError> {
        let scope = self.prepare_scope(
            &args.stage,
            args.task_id.as_deref(),
            &args.paths,
            &args.write_targets,
        )?;
        let approval_reason = normalize_reason(&args.reason)?;
        let record = ApprovalRecord {
            repo_root: self.repo_root.to_string_lossy().into_owned(),
            branch: self.branch_name.clone(),
            stage: scope.stage.clone(),
            task_id: scope.task_id.clone(),
            paths: scope.paths.clone(),
            write_targets: scope.write_targets.clone(),
            approval_fingerprint: scope.approval_fingerprint.clone(),
            approval_reason,
            protected_by: self.protected_by.clone(),
            approved_at: String::from("1970-01-01T00:00:00Z"),
        };
        self.write_approval_record(&scope.canonical_approval_path, &record)?;

        Ok(self.result("allowed", "write", &scope, "", "approval_recorded", ""))
    }

    fn prepare_scope(
        &self,
        stage: &str,
        raw_task_id: Option<&str>,
        raw_paths: &[String],
        raw_write_targets: &[String],
    ) -> Result<Scope, DiagnosticError> {
        if stage.is_empty() {
            return Err(DiagnosticError::new(
                FailureClass::InvalidCommandInput,
                "Repo safety requires --stage.",
            ));
        }
        let paths = normalize_paths(raw_paths)?;
        let write_targets = normalize_write_targets(raw_write_targets)?;
        let task_id = derive_task_id(stage, raw_task_id, &paths, &write_targets)?;
        let approval_fingerprint = compute_fingerprint(
            &self.repo_root,
            &self.branch_name,
            stage,
            &task_id,
            &paths,
            &write_targets,
        );
        let task_hash = short_hash(&format!("{stage}\n{task_id}"), 16);

        Ok(Scope {
            stage: stage.to_owned(),
            task_id,
            paths,
            write_targets,
            approval_fingerprint,
            canonical_approval_path: self
                .state_dir
                .join("repo-safety")
                .join("approvals")
                .join(&self.repo_slug)
                .join(format!("{}-{}", current_user_name(), self.safe_branch))
                .join(format!("{task_hash}.json")),
        })
    }

    fn read_approval(&self, scope: &Scope) -> Result<ApprovalLookup, DiagnosticError> {
        if let Some(record) = read_approval_record(&scope.canonical_approval_path)? {
            return Ok(ApprovalLookup::Found(record));
        }
        Ok(ApprovalLookup::Missing)
    }

    fn write_approval_record(
        &self,
        path: &Path,
        record: &ApprovalRecord,
    ) -> Result<(), DiagnosticError> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| {
                DiagnosticError::new(
                    FailureClass::ApprovalWriteFailed,
                    format!(
                        "Could not create approval directory {}: {error}",
                        parent.display()
                    ),
                )
            })?;
        }
        let tmp_path = path.with_extension("tmp");
        let payload = serde_json::to_string(record).map_err(|error| {
            DiagnosticError::new(
                FailureClass::ApprovalWriteFailed,
                format!("Could not serialize approval record: {error}"),
            )
        })?;
        fs::write(&tmp_path, payload).map_err(|error| {
            DiagnosticError::new(
                FailureClass::ApprovalWriteFailed,
                format!(
                    "Could not write approval temp file {}: {error}",
                    tmp_path.display()
                ),
            )
        })?;
        fs::rename(&tmp_path, path).map_err(|error| {
            DiagnosticError::new(
                FailureClass::ApprovalWriteFailed,
                format!(
                    "Could not move approval record into place {}: {error}",
                    path.display()
                ),
            )
        })?;
        Ok(())
    }

    fn result(
        &self,
        outcome: &str,
        intent: &str,
        scope: &Scope,
        failure_class: &str,
        reason: &str,
        suggested_next_skill: &str,
    ) -> RepoSafetyResult {
        RepoSafetyResult {
            outcome: outcome.to_owned(),
            intent: intent.to_owned(),
            branch: self.branch_name.clone(),
            protected: self.protected,
            protected_by: self.protected_by.clone(),
            task_id: scope.task_id.clone(),
            approval_fingerprint: scope.approval_fingerprint.clone(),
            approval_path: scope.canonical_approval_path.to_string_lossy().into_owned(),
            failure_class: failure_class.to_owned(),
            reason: reason.to_owned(),
            suggested_next_skill: suggested_next_skill.to_owned(),
        }
    }
}

pub fn write_repo_safety_schema(output_dir: &Path) -> Result<(), DiagnosticError> {
    fs::create_dir_all(output_dir).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!(
                "Could not create repo-safety schema directory {}: {error}",
                output_dir.display()
            ),
        )
    })?;
    let schema = serde_json::to_string_pretty(&schema_for!(RepoSafetyResult)).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not serialize repo-safety check schema: {error}"),
        )
    })?;
    fs::write(output_dir.join("repo-safety-check.schema.json"), schema).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not write repo-safety check schema: {error}"),
        )
    })?;
    Ok(())
}

pub fn pending_explicit_migration(state_dir: &Path) -> bool {
    !legacy_approval_files(state_dir).is_empty()
}

pub fn migrate_legacy_approvals(
    state_dir: &Path,
) -> Result<ApprovalMigrationSummary, DiagnosticError> {
    let mut migrated = Vec::new();
    let mut invalidated_backups = Vec::new();

    for legacy_path in legacy_approval_files(state_dir) {
        let canonical_path = canonical_path_for_legacy(state_dir, &legacy_path)?;
        if let Some(record) = read_approval_record(&legacy_path)? {
            if let Some(parent) = canonical_path.parent() {
                fs::create_dir_all(parent).map_err(|error| {
                    DiagnosticError::new(
                        FailureClass::ApprovalWriteFailed,
                        format!(
                            "Could not create approval directory {}: {error}",
                            parent.display()
                        ),
                    )
                })?;
            }
            write_json_atomic(&canonical_path, &record)?;
            let backup_path = backup_legacy_path(state_dir, &legacy_path)?;
            move_file(&legacy_path, &backup_path)?;
            migrated.push((backup_path, canonical_path));
        } else {
            let backup_path = backup_legacy_path(state_dir, &legacy_path)?;
            move_file(&legacy_path, &backup_path)?;
            invalidated_backups.push(backup_path);
        }
    }

    Ok(ApprovalMigrationSummary {
        migrated,
        invalidated_backups,
    })
}

enum ApprovalLookup {
    Missing,
    Found(ApprovalRecord),
}

fn branch_protection(
    current_dir: &Path,
    repo_root: &Path,
    normalized_branch: &str,
) -> Result<(bool, String), DiagnosticError> {
    if DEFAULT_PROTECTED_BRANCHES.contains(&normalized_branch) {
        return Ok((true, String::from("default")));
    }
    let files = collect_active_instruction_files(repo_root, current_dir)?;
    let protected_branches = parse_protected_branches(&files)?;
    if protected_branches
        .iter()
        .any(|branch| branch == normalized_branch)
    {
        return Ok((true, String::from("instructions")));
    }
    Ok((false, String::from("default")))
}

fn normalize_paths(raw_paths: &[String]) -> Result<Vec<String>, DiagnosticError> {
    raw_paths
        .iter()
        .map(|path| {
            RepoPath::parse(path).map_err(|_| {
                DiagnosticError::new(
                    FailureClass::InvalidCommandInput,
                    "Paths must be normalized repo-relative paths inside the repo root.",
                )
            })
        })
        .collect::<Result<BTreeSet<_>, _>>()
        .map(|paths| {
            paths
                .into_iter()
                .map(|path| path.as_str().to_owned())
                .collect()
        })
}

fn normalize_write_targets(raw_write_targets: &[String]) -> Result<Vec<String>, DiagnosticError> {
    raw_write_targets
        .iter()
        .map(|target| {
            if WRITE_TARGET_ALLOWLIST.contains(&target.as_str()) {
                Ok(target.clone())
            } else {
                Err(DiagnosticError::new(
                    FailureClass::InvalidWriteTarget,
                    format!("Unsupported write target: {target}"),
                ))
            }
        })
        .collect::<Result<BTreeSet<_>, _>>()
        .map(|targets| targets.into_iter().collect())
}

fn derive_task_id(
    stage: &str,
    raw_task_id: Option<&str>,
    paths: &[String],
    write_targets: &[String],
) -> Result<String, DiagnosticError> {
    if let Some(raw_task_id) = raw_task_id {
        let normalized_task_id = normalize_identifier_token(raw_task_id);
        if normalized_task_id.is_empty() {
            return Err(DiagnosticError::new(
                FailureClass::InvalidCommandInput,
                "Task id may not be blank after normalization.",
            ));
        }
        return Ok(normalized_task_id);
    }

    let normalized_stage = normalize_identifier_token(stage);
    if normalized_stage.is_empty() {
        return Err(DiagnosticError::new(
            FailureClass::InvalidCommandInput,
            "Stage may not be blank after normalization.",
        ));
    }

    let mut hasher = Sha256::new();
    hasher.update(stage.as_bytes());
    for path in paths {
        hasher.update(b"\n");
        hasher.update(path.as_bytes());
    }
    hasher.update(b"\n--targets--\n");
    for target in write_targets {
        hasher.update(target.as_bytes());
        hasher.update(b"\n");
    }
    let scope_hash = format!("{:x}", hasher.finalize())[..16].to_owned();
    Ok(format!("{normalized_stage}-{scope_hash}"))
}

fn compute_fingerprint(
    repo_root: &Path,
    branch_name: &str,
    stage: &str,
    task_id: &str,
    paths: &[String],
    write_targets: &[String],
) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{}\n", repo_root.to_string_lossy()).as_bytes());
    hasher.update(format!("{branch_name}\n").as_bytes());
    hasher.update(format!("{stage}\n").as_bytes());
    hasher.update(format!("{task_id}\n").as_bytes());
    hasher.update(b"--paths--\n");
    if !paths.is_empty() {
        hasher.update(paths.join("\n").as_bytes());
    }
    hasher.update(b"\n--targets--\n");
    if !write_targets.is_empty() {
        hasher.update(write_targets.join("\n").as_bytes());
    }
    format!("{:x}", hasher.finalize())
}

fn record_matches_scope(
    record: &ApprovalRecord,
    repo_root: &Path,
    branch_name: &str,
    scope: &Scope,
) -> bool {
    record.repo_root == repo_root.to_string_lossy()
        && record.branch == branch_name
        && record.stage == scope.stage
        && record.task_id == scope.task_id
}

fn read_approval_record(path: &Path) -> Result<Option<ApprovalRecord>, DiagnosticError> {
    if !path.exists() {
        return Ok(None);
    }
    if !path.is_file() {
        return Ok(None);
    }
    let source = fs::read_to_string(path).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not read approval record {}: {error}", path.display()),
        )
    })?;
    serde_json::from_str(&source).map(Some).or(Ok(None))
}

fn legacy_approval_files(state_dir: &Path) -> Vec<PathBuf> {
    let root = state_dir.join("projects");
    let mut files = Vec::new();
    collect_json_files(&root, &mut files);
    files.sort();
    files
}

fn collect_json_files(path: &Path, files: &mut Vec<PathBuf>) {
    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_json_files(&path, files);
        } else if path.extension().and_then(std::ffi::OsStr::to_str) == Some("json") {
            files.push(path);
        }
    }
}

fn canonical_path_for_legacy(
    state_dir: &Path,
    legacy_path: &Path,
) -> Result<PathBuf, DiagnosticError> {
    let relative = legacy_path
        .strip_prefix(state_dir.join("projects"))
        .map_err(|_| {
            DiagnosticError::new(
                FailureClass::ApprovalWriteFailed,
                format!(
                    "Legacy approval path {} does not live under the expected projects root.",
                    legacy_path.display()
                ),
            )
        })?;
    let mut components = relative.components();
    let repo_slug = components
        .next()
        .and_then(|component| component.as_os_str().to_str())
        .ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::ApprovalWriteFailed,
                format!(
                    "Legacy approval path {} is missing its repo slug.",
                    legacy_path.display()
                ),
            )
        })?;
    let user_branch = components
        .next()
        .and_then(|component| component.as_os_str().to_str())
        .ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::ApprovalWriteFailed,
                format!(
                    "Legacy approval path {} is missing its user-branch segment.",
                    legacy_path.display()
                ),
            )
        })?;
    let user_branch = user_branch.strip_suffix("-repo-safety").ok_or_else(|| {
        DiagnosticError::new(
            FailureClass::ApprovalWriteFailed,
            format!(
                "Legacy approval path {} has an invalid user-branch segment.",
                legacy_path.display()
            ),
        )
    })?;
    let file_name = legacy_path.file_name().ok_or_else(|| {
        DiagnosticError::new(
            FailureClass::ApprovalWriteFailed,
            format!(
                "Legacy approval path {} is missing a file name.",
                legacy_path.display()
            ),
        )
    })?;

    Ok(state_dir
        .join("repo-safety")
        .join("approvals")
        .join(repo_slug)
        .join(user_branch)
        .join(file_name))
}

fn backup_legacy_path(state_dir: &Path, legacy_path: &Path) -> Result<PathBuf, DiagnosticError> {
    let relative = legacy_path.strip_prefix(state_dir).map_err(|_| {
        DiagnosticError::new(
            FailureClass::ApprovalWriteFailed,
            format!(
                "Legacy approval path {} does not live under the runtime state root.",
                legacy_path.display()
            ),
        )
    })?;
    Ok(state_dir
        .join("install")
        .join("backups")
        .join(relative)
        .with_extension("json.bak"))
}

fn move_file(source: &Path, destination: &Path) -> Result<(), DiagnosticError> {
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| {
            DiagnosticError::new(
                FailureClass::ApprovalWriteFailed,
                format!(
                    "Could not create backup directory {}: {error}",
                    parent.display()
                ),
            )
        })?;
    }
    fs::rename(source, destination).map_err(|error| {
        DiagnosticError::new(
            FailureClass::ApprovalWriteFailed,
            format!(
                "Could not move legacy approval {} to {}: {error}",
                source.display(),
                destination.display()
            ),
        )
    })
}

fn write_json_atomic(path: &Path, record: &ApprovalRecord) -> Result<(), DiagnosticError> {
    let payload = serde_json::to_string(record).map_err(|error| {
        DiagnosticError::new(
            FailureClass::ApprovalWriteFailed,
            format!("Could not serialize approval record: {error}"),
        )
    })?;
    write_atomic_file(path, payload).map_err(|error| {
        DiagnosticError::new(
            FailureClass::ApprovalWriteFailed,
            format!(
                "Could not persist approval record {}: {error}",
                path.display()
            ),
        )
    })?;
    Ok(())
}

fn normalize_reason(raw_reason: &str) -> Result<String, DiagnosticError> {
    let normalized = normalize_whitespace(raw_reason);
    if normalized.is_empty() || normalized.len() > MAX_REASON_LENGTH {
        return Err(DiagnosticError::new(
            FailureClass::InvalidCommandInput,
            "Approval reasons may not be blank after whitespace normalization and must stay within the length limit.",
        ));
    }
    Ok(normalized)
}

fn current_user_name() -> String {
    env::var("USER")
        .or_else(|_| env::var("USERNAME"))
        .unwrap_or_else(|_| String::from("user"))
}

fn state_dir() -> PathBuf {
    featureforge_state_dir()
}

fn short_hash(value: &str, width: usize) -> String {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    format!("{:x}", hasher.finalize())[..width].to_owned()
}
