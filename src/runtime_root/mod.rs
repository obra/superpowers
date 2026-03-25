use std::collections::HashSet;
use std::env;
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};

use schemars::{JsonSchema, schema_for};
use serde::Serialize;

use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::git;
use crate::paths::featureforge_home_dir;

const FEATUREFORGE_DIR_ENV: &str = "FEATUREFORGE_DIR";
const RUNTIME_ROOT_SCHEMA_FILE: &str = "repo-runtime-root.schema.json";
const RUNTIME_BINARY_NAMES: &[&str] = &["featureforge", "featureforge.exe"];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RuntimeRootField {
    UpgradeEligible,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RuntimeRootValidation {
    pub has_version: bool,
    pub has_binary: bool,
    pub upgrade_eligible: bool,
}

impl RuntimeRootValidation {
    fn unresolved() -> Self {
        Self {
            has_version: false,
            has_binary: false,
            upgrade_eligible: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct RuntimeRootOutput {
    pub resolved: bool,
    pub root: Option<String>,
    #[schemars(with = "RuntimeRootSourceSchemaDoc")]
    pub source: String,
    pub validation: RuntimeRootValidation,
}

impl RuntimeRootOutput {
    pub fn unresolved() -> Self {
        Self {
            resolved: false,
            root: None,
            source: String::from("unresolved"),
            validation: RuntimeRootValidation::unresolved(),
        }
    }
}

#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
enum RuntimeRootSourceSchemaDoc {
    Unresolved,
    FeatureforgeDirEnv,
    RepoLocal,
    BinaryAdjacent,
    CanonicalInstall,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedRuntimeRoot {
    pub root: PathBuf,
    pub source: String,
    pub validation: RuntimeRootValidation,
}

impl ResolvedRuntimeRoot {
    pub fn as_output(&self) -> RuntimeRootOutput {
        RuntimeRootOutput {
            resolved: true,
            root: Some(self.root.to_string_lossy().into_owned()),
            source: self.source.clone(),
            validation: self.validation.clone(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CandidateSource {
    FeatureforgeDir,
    RepoLocal,
    BinaryAdjacent,
    CanonicalInstall,
}

impl CandidateSource {
    const fn as_str(self) -> &'static str {
        match self {
            Self::FeatureforgeDir => "featureforge_dir_env",
            Self::RepoLocal => "repo_local",
            Self::BinaryAdjacent => "binary_adjacent",
            Self::CanonicalInstall => "canonical_install",
        }
    }
}

pub fn resolve_current_output() -> Result<RuntimeRootOutput, DiagnosticError> {
    Ok(resolve_current_root()?
        .map(|resolved| resolved.as_output())
        .unwrap_or_else(RuntimeRootOutput::unresolved))
}

pub fn resolve_current_path_output() -> Result<String, DiagnosticError> {
    Ok(resolve_current_root()?
        .map(|resolved| format!("{}\n", resolved.root.display()))
        .unwrap_or_default())
}

pub fn resolve_current_field_output(field: RuntimeRootField) -> Result<String, DiagnosticError> {
    let resolved = resolve_current_root()?;
    Ok(match field {
        RuntimeRootField::UpgradeEligible => resolved
            .map(|resolved| {
                if resolved.validation.upgrade_eligible {
                    String::from("true\n")
                } else {
                    String::from("false\n")
                }
            })
            .unwrap_or_default(),
    })
}

pub fn resolve_current_root() -> Result<Option<ResolvedRuntimeRoot>, DiagnosticError> {
    let current_dir = env::current_dir().map_err(|error| {
        DiagnosticError::new(
            FailureClass::ResolverRuntimeFailure,
            format!(
                "Could not determine the current directory for runtime-root resolution: {error}"
            ),
        )
    })?;
    let current_exe = env::current_exe().map_err(|error| {
        DiagnosticError::new(
            FailureClass::ResolverRuntimeFailure,
            format!(
                "Could not determine the current executable for runtime-root resolution: {error}"
            ),
        )
    })?;
    resolve_with_context(
        &current_dir,
        &current_exe,
        env::var_os(FEATUREFORGE_DIR_ENV).as_deref(),
    )
}

pub fn write_runtime_root_schema(output_dir: &Path) -> Result<(), DiagnosticError> {
    fs::create_dir_all(output_dir).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!(
                "Could not create runtime-root schema directory {}: {error}",
                output_dir.display()
            ),
        )
    })?;
    let schema =
        serde_json::to_string_pretty(&schema_for!(RuntimeRootOutput)).map_err(|error| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Could not serialize runtime-root schema: {error}"),
            )
        })?;
    fs::write(output_dir.join(RUNTIME_ROOT_SCHEMA_FILE), schema).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not write runtime-root schema: {error}"),
        )
    })?;
    Ok(())
}

// Candidate order is intentionally bounded: explicit env, repo-local root,
// binary-adjacent root, then canonical install. Anything else is unresolved.
fn resolve_with_context(
    current_dir: &Path,
    current_exe: &Path,
    featureforge_dir: Option<&OsStr>,
) -> Result<Option<ResolvedRuntimeRoot>, DiagnosticError> {
    let mut seen = HashSet::new();

    if let Some(explicit_candidate) = featureforge_dir {
        let explicit_candidate = explicit_candidate_path(explicit_candidate, current_dir)?;
        seen.insert(explicit_candidate.clone());
        return validate_explicit_candidate(&explicit_candidate);
    }

    let repo_local = git::discover_repo_identity(current_dir)
        .map(|identity| identity.repo_root)
        .unwrap_or_else(|_| current_dir.to_path_buf());
    if seen.insert(repo_local.clone()) {
        if let Some(resolved) =
            validate_optional_candidate(&repo_local, CandidateSource::RepoLocal)?
        {
            return Ok(Some(resolved));
        }
    }

    let binary_adjacent = binary_adjacent_candidate(current_exe)?;
    if seen.insert(binary_adjacent.clone()) {
        if let Some(resolved) =
            validate_optional_candidate(&binary_adjacent, CandidateSource::BinaryAdjacent)?
        {
            return Ok(Some(resolved));
        }
    }

    if let Some(canonical_install) = canonical_install_candidate() {
        if seen.insert(canonical_install.clone()) {
            if let Some(resolved) =
                validate_optional_candidate(&canonical_install, CandidateSource::CanonicalInstall)?
            {
                return Ok(Some(resolved));
            }
        }
    }

    Ok(None)
}

fn explicit_candidate_path(value: &OsStr, current_dir: &Path) -> Result<PathBuf, DiagnosticError> {
    let candidate = PathBuf::from(value);
    if candidate.as_os_str().is_empty() {
        return Err(DiagnosticError::new(
            FailureClass::ResolverContractViolation,
            "FEATUREFORGE_DIR must point to a valid FeatureForge runtime root.",
        ));
    }
    Ok(absolutize_candidate(&candidate, current_dir))
}

fn absolutize_candidate(candidate: &Path, current_dir: &Path) -> PathBuf {
    if candidate.is_absolute() {
        candidate.to_path_buf()
    } else {
        current_dir.join(candidate)
    }
}

fn binary_adjacent_candidate(current_exe: &Path) -> Result<PathBuf, DiagnosticError> {
    current_exe
        .parent()
        .and_then(Path::parent)
        .map(Path::to_path_buf)
        .ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::ResolverRuntimeFailure,
                format!(
                    "Could not derive a binary-adjacent runtime root from {}.",
                    current_exe.display()
                ),
            )
        })
}

fn canonical_install_candidate() -> Option<PathBuf> {
    featureforge_home_dir().map(|home| home.join(".featureforge").join("install"))
}

fn validate_explicit_candidate(
    candidate: &Path,
) -> Result<Option<ResolvedRuntimeRoot>, DiagnosticError> {
    let validation = inspect_candidate(candidate)?;
    if validation.has_version && validation.has_binary {
        return Ok(Some(ResolvedRuntimeRoot {
            root: candidate.to_path_buf(),
            source: String::from(CandidateSource::FeatureforgeDir.as_str()),
            validation,
        }));
    }

    Err(DiagnosticError::new(
        FailureClass::ResolverContractViolation,
        format!(
            "FEATUREFORGE_DIR points to {} but it is not a valid FeatureForge runtime root (requires VERSION and bin/featureforge).",
            candidate.display()
        ),
    ))
}

fn validate_optional_candidate(
    candidate: &Path,
    source: CandidateSource,
) -> Result<Option<ResolvedRuntimeRoot>, DiagnosticError> {
    let validation = inspect_candidate(candidate)?;
    if validation.has_version && validation.has_binary {
        return Ok(Some(ResolvedRuntimeRoot {
            root: candidate.to_path_buf(),
            source: String::from(source.as_str()),
            validation,
        }));
    }
    Ok(None)
}

fn inspect_candidate(candidate: &Path) -> Result<RuntimeRootValidation, DiagnosticError> {
    Ok(RuntimeRootValidation {
        has_version: metadata_is_file(&candidate.join("VERSION"))?,
        has_binary: runtime_binary_present(candidate)?,
        upgrade_eligible: git_marker_present(candidate)?,
    })
}

fn runtime_binary_present(candidate: &Path) -> Result<bool, DiagnosticError> {
    for binary_name in RUNTIME_BINARY_NAMES {
        let binary_path = candidate.join("bin").join(binary_name);
        let metadata = match fs::metadata(&binary_path) {
            Ok(metadata) => metadata,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => continue,
            Err(error) => return Err(runtime_failure(&binary_path, error)),
        };
        if !metadata.is_file() {
            continue;
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            return Ok(metadata.permissions().mode() & 0o111 != 0);
        }
        #[cfg(not(unix))]
        {
            return Ok(true);
        }
    }
    Ok(false)
}

fn metadata_is_file(path: &Path) -> Result<bool, DiagnosticError> {
    match fs::metadata(path) {
        Ok(metadata) => Ok(metadata.is_file()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(error) => Err(runtime_failure(path, error)),
    }
}

fn git_marker_present(candidate: &Path) -> Result<bool, DiagnosticError> {
    let git_marker = candidate.join(".git");
    match fs::metadata(&git_marker) {
        Ok(metadata) => Ok(metadata.is_dir() || metadata.is_file()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
        Err(error) => Err(runtime_failure(&git_marker, error)),
    }
}

fn runtime_failure(path: &Path, error: std::io::Error) -> DiagnosticError {
    DiagnosticError::new(
        FailureClass::ResolverRuntimeFailure,
        format!(
            "Could not inspect {} during runtime-root resolution: {error}",
            path.display()
        ),
    )
}
