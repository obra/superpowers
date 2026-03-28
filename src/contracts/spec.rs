use std::fs;
use std::path::Path;

use schemars::JsonSchema;
use serde::Serialize;

use crate::contracts::headers;
use crate::diagnostics::{DiagnosticError, FailureClass};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct Requirement {
    pub id: String,
    pub kind: String,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct SpecDocument {
    pub path: String,
    pub workflow_state: String,
    pub spec_revision: u32,
    pub last_reviewed_by: String,
    pub requirements: Vec<Requirement>,
    #[serde(skip)]
    pub source: String,
}

pub fn parse_spec_file(path: impl AsRef<Path>) -> Result<SpecDocument, DiagnosticError> {
    let path = path.as_ref();
    let source = fs::read_to_string(path).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not read spec file {}: {err}", path.display()),
        )
    })?;
    parse_spec_source(path, source)
}

pub fn parse_spec_source(path: &Path, source: String) -> Result<SpecDocument, DiagnosticError> {
    let workflow_state = parse_required_header(&source, "Workflow State")?;
    let spec_revision = parse_required_header(&source, "Spec Revision")?
        .parse::<u32>()
        .map_err(|_| missing_header("Spec Revision"))?;
    let last_reviewed_by = parse_required_header(&source, "Last Reviewed By")?;
    let requirements = parse_requirement_index(&source)?;

    Ok(SpecDocument {
        path: repo_relative_string(path),
        workflow_state,
        spec_revision,
        last_reviewed_by,
        requirements,
        source,
    })
}

fn parse_required_header(source: &str, header: &str) -> Result<String, DiagnosticError> {
    headers::parse_required_header(source, header).ok_or_else(|| missing_header(header))
}

fn parse_requirement_index(source: &str) -> Result<Vec<Requirement>, DiagnosticError> {
    let mut in_requirement_index = false;
    let mut in_fence = false;
    let mut requirements = Vec::new();

    for line in source.lines() {
        if line.trim_start().starts_with("```") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence {
            continue;
        }
        if line == "## Requirement Index" {
            in_requirement_index = true;
            continue;
        }
        if in_requirement_index && line.starts_with("## ") {
            break;
        }
        if !in_requirement_index {
            continue;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if let Some(requirement) = parse_requirement_line(trimmed) {
            requirements.push(requirement);
            continue;
        }
        return Err(DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Malformed requirement index entry: {trimmed}"),
        ));
    }

    if requirements.is_empty() {
        return Err(DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            "Missing requirement index.",
        ));
    }

    Ok(requirements)
}

fn parse_requirement_line(line: &str) -> Option<Requirement> {
    let rest = line.strip_prefix("- [")?;
    let (id, rest) = rest.split_once("][")?;
    let (kind, text) = rest.split_once("] ")?;
    Some(Requirement {
        id: id.to_owned(),
        kind: kind.to_owned(),
        text: text.to_owned(),
    })
}

fn missing_header(header: &str) -> DiagnosticError {
    DiagnosticError::new(
        FailureClass::InstructionParseFailed,
        format!("Missing or malformed {header} header."),
    )
}

pub(crate) fn repo_relative_string(path: &Path) -> String {
    let start = if path.is_dir() {
        path
    } else {
        path.parent().unwrap_or(path)
    };
    for ancestor in start.ancestors() {
        if (ancestor.join(".git").is_dir() || ancestor.join("docs/featureforge").is_dir())
            && let Ok(relative) = path.strip_prefix(ancestor)
        {
            return relative.display().to_string().replace('\\', "/");
        }
    }
    path.file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or_default()
        .to_owned()
}
