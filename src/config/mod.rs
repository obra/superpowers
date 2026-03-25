use std::fs;
use std::path::{Path, PathBuf};

use crate::cli::config::{ConfigGetArgs, ConfigSetArgs};
use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::paths::{featureforge_state_dir, write_atomic as write_atomic_file};

pub const LEGACY_CONFIG_FILE: &str = "config.yaml";
pub const CANONICAL_CONFIG_FILE: &str = "config/config.yaml";
pub const CONFIG_BACKUP_FILE: &str = "config.yaml.bak";

#[derive(Debug, Default, Clone, PartialEq, Eq)]
struct ConfigValues {
    update_check: Option<bool>,
    featureforge_contributor: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConfigMigration {
    pub migrated: bool,
    pub backup_created: bool,
    pub canonical_path: PathBuf,
    pub backup_path: PathBuf,
}

pub fn get(args: &ConfigGetArgs) -> Result<String, DiagnosticError> {
    let state_dir = state_dir();
    let values = load_config(&state_dir)?;
    let value = match normalize_key(&args.key)?.as_str() {
        "update_check" => values.update_check.map(render_bool),
        "featureforge_contributor" => values.featureforge_contributor.map(render_bool),
        _ => None,
    };
    Ok(value.unwrap_or_default())
}

pub fn set(args: &ConfigSetArgs) -> Result<String, DiagnosticError> {
    let state_dir = state_dir();
    let mut values = load_config(&state_dir)?;
    let key = normalize_key(&args.key)?;
    let value = parse_bool(&args.value)?;

    match key.as_str() {
        "update_check" => values.update_check = Some(value),
        "featureforge_contributor" => values.featureforge_contributor = Some(value),
        _ => {}
    }

    write_config(&state_dir.join(CANONICAL_CONFIG_FILE), &values)?;
    Ok(String::new())
}

pub fn list() -> Result<String, DiagnosticError> {
    let state_dir = state_dir();
    Ok(render_config(&load_config(&state_dir)?))
}

pub fn read_update_check_preference(state_dir: &Path) -> Result<Option<bool>, DiagnosticError> {
    Ok(load_config(state_dir)?.update_check)
}

pub fn pending_explicit_migration(_: &Path) -> bool {
    false
}

pub fn migrate_explicit(state_dir: &Path) -> Result<ConfigMigration, DiagnosticError> {
    let canonical_path = state_dir.join(CANONICAL_CONFIG_FILE);
    let backup_path = state_dir.join(CONFIG_BACKUP_FILE);
    let legacy_path = state_dir.join(LEGACY_CONFIG_FILE);

    if !legacy_path.is_file() {
        return Ok(ConfigMigration {
            migrated: false,
            backup_created: false,
            canonical_path,
            backup_path,
        });
    }

    let contents = fs::read_to_string(&legacy_path).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InvalidConfigFormat,
            format!(
                "Could not read the legacy config file {}: {error}",
                legacy_path.display()
            ),
        )
    })?;
    let parsed = parse_config_source(&contents)?;
    let backup_created = ensure_backup(&backup_path, &contents)?;
    write_config(&canonical_path, &parsed)?;
    fs::remove_file(&legacy_path).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InvalidConfigFormat,
            format!(
                "Could not remove the legacy config file {} after migration: {error}",
                legacy_path.display()
            ),
        )
    })?;

    Ok(ConfigMigration {
        migrated: true,
        backup_created,
        canonical_path,
        backup_path,
    })
}

pub fn state_dir() -> PathBuf {
    featureforge_state_dir()
}

fn load_config(state_dir: &Path) -> Result<ConfigValues, DiagnosticError> {
    let canonical_path = state_dir.join(CANONICAL_CONFIG_FILE);
    if canonical_path.is_file() {
        return parse_config_file(&canonical_path);
    }
    Ok(ConfigValues::default())
}

fn ensure_backup(path: &Path, contents: &str) -> Result<bool, DiagnosticError> {
    if path.exists() {
        return Ok(false);
    }
    write_atomic(path, contents)?;
    Ok(true)
}

fn parse_config_file(path: &Path) -> Result<ConfigValues, DiagnosticError> {
    let contents = fs::read_to_string(path).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InvalidConfigFormat,
            format!("Could not read config file {}: {error}", path.display()),
        )
    })?;
    parse_config_source(&contents)
}

fn parse_config_source(source: &str) -> Result<ConfigValues, DiagnosticError> {
    let mut config = ConfigValues::default();

    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if line.starts_with(' ') || line.starts_with('\t') {
            return Err(invalid_config(
                "Nested or indented YAML entries are not supported.",
            ));
        }
        let (raw_key, raw_value) = trimmed
            .split_once(':')
            .ok_or_else(|| invalid_config("Config entries must use a single 'key: value' form."))?;
        let key = normalize_key(raw_key)?;
        let value = parse_bool(raw_value.trim())?;

        match key.as_str() {
            "update_check" => config.update_check = Some(value),
            "featureforge_contributor" => config.featureforge_contributor = Some(value),
            _ => return Err(invalid_config("Unsupported config key.")),
        }
    }

    Ok(config)
}

fn normalize_key(key: &str) -> Result<String, DiagnosticError> {
    let trimmed = key.trim();
    match trimmed {
        "update_check" | "featureforge_contributor" => Ok(trimmed.to_owned()),
        _ => Err(invalid_config("Unsupported config key.")),
    }
}

fn parse_bool(value: &str) -> Result<bool, DiagnosticError> {
    match value.trim() {
        "true" => Ok(true),
        "false" => Ok(false),
        _ => Err(invalid_config(
            "Config values must be plain true or false scalars.",
        )),
    }
}

fn render_config(config: &ConfigValues) -> String {
    let mut lines = Vec::new();
    if let Some(value) = config.update_check {
        lines.push(format!("update_check: {}", render_bool(value)));
    }
    if let Some(value) = config.featureforge_contributor {
        lines.push(format!("featureforge_contributor: {}", render_bool(value)));
    }
    if lines.is_empty() {
        String::new()
    } else {
        format!("{}\n", lines.join("\n"))
    }
}

fn render_bool(value: bool) -> String {
    if value {
        String::from("true")
    } else {
        String::from("false")
    }
}

fn write_config(path: &Path, config: &ConfigValues) -> Result<(), DiagnosticError> {
    write_atomic(path, &render_config(config))
}

fn write_atomic(path: &Path, contents: &str) -> Result<(), DiagnosticError> {
    write_atomic_file(path, contents).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InvalidConfigFormat,
            format!("Could not persist config file {}: {error}", path.display()),
        )
    })
}

fn invalid_config(message: &str) -> DiagnosticError {
    DiagnosticError::new(FailureClass::InvalidConfigFormat, message)
}
