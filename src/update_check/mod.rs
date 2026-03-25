use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use schemars::{JsonSchema, schema_for};
use serde::Serialize;

use crate::cli::update_check::UpdateCheckCli;
use crate::config;
use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::paths::{featureforge_home_dir, write_atomic as write_atomic_file};

const UP_TO_DATE_TTL: Duration = Duration::from_secs(60 * 60);
const UPGRADE_AVAILABLE_TTL: Duration = Duration::from_secs(60 * 60 * 12);

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct UpdateCheckSchema {
    pub schema_version: String,
    pub outcome: String,
    pub local_version: String,
    pub remote_version: Option<String>,
    pub cache_path: String,
    pub snooze_path: String,
}

#[derive(Debug, Clone)]
struct UpdateCheckPaths {
    state_dir: PathBuf,
    install_dir: PathBuf,
    remote_url: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct CacheRecord {
    raw: String,
    local_version: String,
    remote_version: Option<String>,
    relation: CacheRelation,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CacheRelation {
    UpToDate,
    UpgradeAvailable,
}

pub fn check(args: &UpdateCheckCli) -> Result<String, DiagnosticError> {
    let paths = discover_paths()?;
    if matches!(
        config::read_update_check_preference(&paths.state_dir)?,
        Some(false)
    ) {
        return Ok(String::new());
    }

    let local_version = read_local_version(&paths.install_dir)?;
    if local_version.is_empty() || parse_numeric_version(&local_version).is_none() {
        return Ok(String::new());
    }

    if let Some(marker) = read_first_existing(&paths, "just-upgraded-from")? {
        remove_state_file(&canonical_path(&paths, "just-upgraded-from"))?;
        remove_state_file(&legacy_path(&paths, "just-upgraded-from"))?;
        remove_state_file(&canonical_path(&paths, "update-snoozed"))?;
        remove_state_file(&legacy_path(&paths, "update-snoozed"))?;
        write_state_file(
            &canonical_path(&paths, "last-update-check"),
            &format!("UP_TO_DATE {local_version}\n"),
        )?;
        remove_state_file(&legacy_path(&paths, "last-update-check"))?;
        let old_version = marker.trim();
        if old_version.is_empty() {
            return Ok(String::new());
        }
        return Ok(format!("JUST_UPGRADED {old_version} {local_version}"));
    }

    if !args.force {
        if let Some(cache) = read_cache(&paths)? {
            if cache.relation == CacheRelation::UpToDate
                && cache.local_version == local_version
                && cache_is_fresh(
                    &canonical_or_legacy_path(&paths, "last-update-check"),
                    UP_TO_DATE_TTL,
                )?
            {
                promote_cache_if_needed(&paths, &cache)?;
                return Ok(String::new());
            }
            if cache.relation == CacheRelation::UpgradeAvailable
                && cache.local_version == local_version
                && cache_is_fresh(
                    &canonical_or_legacy_path(&paths, "last-update-check"),
                    UPGRADE_AVAILABLE_TTL,
                )?
            {
                promote_cache_if_needed(&paths, &cache)?;
                if let Some(remote_version) = cache.remote_version.as_deref() {
                    if snoozed(&paths, remote_version)? {
                        return Ok(String::new());
                    }
                }
                return Ok(cache.raw);
            }
        }
    }

    let remote_version = match fetch_remote_version(&paths.remote_url) {
        Ok(version) => version,
        Err(_) => return Ok(String::new()),
    };
    if parse_numeric_version(&remote_version).is_none() {
        return Ok(String::new());
    }

    let relation = compare_versions(&local_version, &remote_version);
    match relation {
        VersionRelation::Equal | VersionRelation::LocalAhead => {
            write_state_file(
                &canonical_path(&paths, "last-update-check"),
                &format!("UP_TO_DATE {local_version}\n"),
            )?;
            remove_state_file(&legacy_path(&paths, "last-update-check"))?;
            Ok(String::new())
        }
        VersionRelation::Upgrade => {
            let rendered = format!("UPGRADE_AVAILABLE {local_version} {remote_version}");
            write_state_file(
                &canonical_path(&paths, "last-update-check"),
                &format!("{rendered}\n"),
            )?;
            remove_state_file(&legacy_path(&paths, "last-update-check"))?;
            if snoozed(&paths, &remote_version)? {
                Ok(String::new())
            } else {
                Ok(rendered)
            }
        }
    }
}

fn promote_cache_if_needed(
    paths: &UpdateCheckPaths,
    cache: &CacheRecord,
) -> Result<(), DiagnosticError> {
    let canonical = canonical_path(paths, "last-update-check");
    let legacy = legacy_path(paths, "last-update-check");
    if canonical.exists() || !legacy.exists() {
        return Ok(());
    }
    let rendered = match cache.relation {
        CacheRelation::UpToDate => format!("UP_TO_DATE {}\n", cache.local_version),
        CacheRelation::UpgradeAvailable => format!(
            "UPGRADE_AVAILABLE {} {}\n",
            cache.local_version,
            cache.remote_version.as_deref().unwrap_or_default()
        ),
    };
    write_state_file(&canonical, &rendered)?;
    remove_state_file(&legacy)?;
    Ok(())
}

pub fn write_update_check_schema(output_dir: &Path) -> Result<(), DiagnosticError> {
    fs::create_dir_all(output_dir).map_err(|error| {
        DiagnosticError::new(
            FailureClass::UpdateCheckStateFailed,
            format!(
                "Could not create update-check schema directory {}: {error}",
                output_dir.display()
            ),
        )
    })?;
    let schema =
        serde_json::to_string_pretty(&schema_for!(UpdateCheckSchema)).map_err(|error| {
            DiagnosticError::new(
                FailureClass::UpdateCheckStateFailed,
                format!("Could not serialize update-check schema: {error}"),
            )
        })?;
    fs::write(output_dir.join("update-check.schema.json"), schema).map_err(|error| {
        DiagnosticError::new(
            FailureClass::UpdateCheckStateFailed,
            format!("Could not write update-check schema: {error}"),
        )
    })?;
    Ok(())
}

fn discover_paths() -> Result<UpdateCheckPaths, DiagnosticError> {
    let state_dir = config::state_dir();
    let install_dir = env::var_os("FEATUREFORGE_DIR")
        .map(PathBuf::from)
        .or_else(default_install_dir)
        .ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::UpdateCheckStateFailed,
                "Could not determine the FeatureForge install root for update-check.",
            )
        })?;
    let remote_url = env::var("FEATUREFORGE_REMOTE_URL").unwrap_or_else(|_| {
        String::from("https://raw.githubusercontent.com/dmulcahey/featureforge/main/VERSION")
    });
    Ok(UpdateCheckPaths {
        state_dir,
        install_dir,
        remote_url,
    })
}

fn default_install_dir() -> Option<PathBuf> {
    let current_dir = env::current_dir().ok()?;
    if current_dir.join("VERSION").is_file() {
        return Some(current_dir);
    }
    featureforge_home_dir().map(|home| home.join(".featureforge").join("install"))
}

fn read_local_version(install_dir: &Path) -> Result<String, DiagnosticError> {
    let version_path = install_dir.join("VERSION");
    if !version_path.is_file() {
        return Ok(String::new());
    }
    fs::read_to_string(&version_path)
        .map(|contents| contents.trim().to_owned())
        .map_err(|error| {
            DiagnosticError::new(
                FailureClass::UpdateCheckStateFailed,
                format!("Could not read {}: {error}", version_path.display()),
            )
        })
}

fn read_cache(paths: &UpdateCheckPaths) -> Result<Option<CacheRecord>, DiagnosticError> {
    let contents = match read_first_existing(paths, "last-update-check")? {
        Some(contents) => contents,
        None => return Ok(None),
    };
    let trimmed = contents.trim();
    if let Some(local_version) = trimmed.strip_prefix("UP_TO_DATE ") {
        return Ok(Some(CacheRecord {
            raw: String::new(),
            local_version: local_version.to_owned(),
            remote_version: None,
            relation: CacheRelation::UpToDate,
        }));
    }
    if let Some(rest) = trimmed.strip_prefix("UPGRADE_AVAILABLE ") {
        let mut parts = rest.split_whitespace();
        let local_version = parts.next().unwrap_or_default().to_owned();
        let remote_version = parts.next().unwrap_or_default().to_owned();
        if !local_version.is_empty() && !remote_version.is_empty() {
            return Ok(Some(CacheRecord {
                raw: format!("UPGRADE_AVAILABLE {local_version} {remote_version}"),
                local_version,
                remote_version: Some(remote_version),
                relation: CacheRelation::UpgradeAvailable,
            }));
        }
    }
    Ok(None)
}

fn read_first_existing(
    paths: &UpdateCheckPaths,
    file_name: &str,
) -> Result<Option<String>, DiagnosticError> {
    for path in [
        canonical_path(paths, file_name),
        legacy_path(paths, file_name),
    ] {
        if path.is_file() {
            return fs::read_to_string(&path).map(Some).map_err(|error| {
                DiagnosticError::new(
                    FailureClass::UpdateCheckStateFailed,
                    format!(
                        "Could not read update-check state {}: {error}",
                        path.display()
                    ),
                )
            });
        }
    }
    Ok(None)
}

fn write_state_file(path: &Path, contents: &str) -> Result<(), DiagnosticError> {
    write_atomic_file(path, contents).map_err(|error| {
        DiagnosticError::new(
            FailureClass::UpdateCheckStateFailed,
            format!(
                "Could not persist update-check state {}: {error}",
                path.display()
            ),
        )
    })
}

fn remove_state_file(path: &Path) -> Result<(), DiagnosticError> {
    if !path.exists() {
        return Ok(());
    }
    fs::remove_file(path).map_err(|error| {
        DiagnosticError::new(
            FailureClass::UpdateCheckStateFailed,
            format!(
                "Could not remove update-check state {}: {error}",
                path.display()
            ),
        )
    })
}

fn canonical_path(paths: &UpdateCheckPaths, file_name: &str) -> PathBuf {
    paths.state_dir.join("update-check").join(file_name)
}

fn legacy_path(paths: &UpdateCheckPaths, file_name: &str) -> PathBuf {
    paths.state_dir.join(file_name)
}

fn canonical_or_legacy_path(paths: &UpdateCheckPaths, file_name: &str) -> PathBuf {
    let canonical = canonical_path(paths, file_name);
    if canonical.exists() {
        canonical
    } else {
        legacy_path(paths, file_name)
    }
}

fn cache_is_fresh(path: &Path, ttl: Duration) -> Result<bool, DiagnosticError> {
    let metadata = fs::metadata(path).map_err(|error| {
        DiagnosticError::new(
            FailureClass::UpdateCheckStateFailed,
            format!(
                "Could not inspect update-check cache {}: {error}",
                path.display()
            ),
        )
    })?;
    let modified = metadata.modified().map_err(|error| {
        DiagnosticError::new(
            FailureClass::UpdateCheckStateFailed,
            format!(
                "Could not read update-check cache modification time {}: {error}",
                path.display()
            ),
        )
    })?;
    Ok(SystemTime::now()
        .duration_since(modified)
        .unwrap_or(Duration::from_secs(0))
        <= ttl)
}

fn snoozed(paths: &UpdateCheckPaths, remote_version: &str) -> Result<bool, DiagnosticError> {
    let contents = match read_first_existing(paths, "update-snoozed")? {
        Some(contents) => contents,
        None => return Ok(false),
    };
    let mut parts = contents.split_whitespace();
    let snoozed_version = parts.next().unwrap_or_default();
    let level = parts.next().unwrap_or_default();
    let epoch = parts.next().unwrap_or_default();
    if snoozed_version != remote_version {
        return Ok(false);
    }
    let level = level.parse::<u64>().ok();
    let epoch = epoch.parse::<u64>().ok();
    let (level, epoch) = match (level, epoch) {
        (Some(level), Some(epoch)) => (level, epoch),
        _ => return Ok(false),
    };
    let duration = match level {
        1 => 86_400,
        2 => 172_800,
        _ => 604_800,
    };
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    Ok(now < epoch + duration)
}

fn fetch_remote_version(remote_url: &str) -> Result<String, DiagnosticError> {
    if let Some(path) = remote_url.strip_prefix("file://") {
        return fs::read_to_string(path)
            .map(|contents| contents.trim().to_owned())
            .map_err(|error| {
                DiagnosticError::new(
                    FailureClass::UpdateCheckStateFailed,
                    format!("Could not read remote version file {path}: {error}"),
                )
            });
    }
    let response = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|error| {
            DiagnosticError::new(
                FailureClass::UpdateCheckStateFailed,
                format!("Could not create update-check HTTP client: {error}"),
            )
        })?
        .get(remote_url)
        .send()
        .and_then(reqwest::blocking::Response::error_for_status)
        .map_err(|error| {
            DiagnosticError::new(
                FailureClass::UpdateCheckStateFailed,
                format!("Could not fetch the remote version from {remote_url}: {error}"),
            )
        })?;
    response
        .text()
        .map(|body| body.trim().to_owned())
        .map_err(|error| {
            DiagnosticError::new(
                FailureClass::UpdateCheckStateFailed,
                format!("Could not read the remote version response body: {error}"),
            )
        })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum VersionRelation {
    Equal,
    LocalAhead,
    Upgrade,
}

fn compare_versions(local: &str, remote: &str) -> VersionRelation {
    let local = parse_numeric_version(local).unwrap_or_default();
    let remote = parse_numeric_version(remote).unwrap_or_default();
    let width = local.len().max(remote.len());
    for index in 0..width {
        let local_part = *local.get(index).unwrap_or(&0);
        let remote_part = *remote.get(index).unwrap_or(&0);
        if local_part < remote_part {
            return VersionRelation::Upgrade;
        }
        if local_part > remote_part {
            return VersionRelation::LocalAhead;
        }
    }
    VersionRelation::Equal
}

fn parse_numeric_version(version: &str) -> Option<Vec<u64>> {
    let mut parts = Vec::new();
    for part in version.split('.') {
        if part.is_empty() {
            return None;
        }
        parts.push(part.parse::<u64>().ok()?);
    }
    if parts.is_empty() { None } else { Some(parts) }
}
