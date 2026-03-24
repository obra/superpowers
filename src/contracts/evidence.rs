use std::fs;
use std::path::Path;

use schemars::JsonSchema;
use serde::Serialize;

use crate::diagnostics::{DiagnosticError, FailureClass};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct EvidenceStep {
    pub task_number: u32,
    pub step_number: u32,
    pub status: String,
    pub claim: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct ExecutionEvidence {
    pub plan_path: String,
    pub plan_revision: u32,
    pub source_spec_path: String,
    pub source_spec_revision: u32,
    pub steps: Vec<EvidenceStep>,
}

pub fn read_execution_evidence(
    path: impl AsRef<Path>,
) -> Result<ExecutionEvidence, DiagnosticError> {
    let path = path.as_ref();
    let source = fs::read_to_string(path).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!(
                "Could not read execution evidence {}: {err}",
                path.display()
            ),
        )
    })?;
    parse_execution_evidence(&source)
}

fn parse_execution_evidence(source: &str) -> Result<ExecutionEvidence, DiagnosticError> {
    let plan_path = parse_required_header(source, "Plan Path")?;
    let plan_revision = parse_required_header(source, "Plan Revision")?
        .parse::<u32>()
        .map_err(|_| missing_header("Plan Revision"))?;
    let source_spec_path = parse_required_header(source, "Source Spec Path")?;
    let source_spec_revision = parse_required_header(source, "Source Spec Revision")?
        .parse::<u32>()
        .map_err(|_| missing_header("Source Spec Revision"))?;
    let steps = parse_steps(source)?;

    Ok(ExecutionEvidence {
        plan_path,
        plan_revision,
        source_spec_path,
        source_spec_revision,
        steps,
    })
}

fn parse_required_header(source: &str, header: &str) -> Result<String, DiagnosticError> {
    let prefix = format!("**{header}:** ");
    source
        .lines()
        .find_map(|line| line.strip_prefix(&prefix))
        .map(|value| value.trim_matches('`').to_owned())
        .ok_or_else(|| missing_header(header))
}

fn parse_steps(source: &str) -> Result<Vec<EvidenceStep>, DiagnosticError> {
    let chunks = source
        .split("\n### Task ")
        .skip(1)
        .map(|chunk| format!("### Task {chunk}"))
        .collect::<Vec<_>>();
    chunks
        .into_iter()
        .map(|chunk| parse_step_chunk(&chunk))
        .collect()
}

fn parse_step_chunk(chunk: &str) -> Result<EvidenceStep, DiagnosticError> {
    let mut lines = chunk.lines();
    let heading = lines
        .next()
        .ok_or_else(|| missing_header("Evidence step heading"))?;
    let heading = heading
        .strip_prefix("### Task ")
        .ok_or_else(|| missing_header("Evidence step heading"))?;
    let (task_number, step_number) = heading
        .split_once(" Step ")
        .ok_or_else(|| missing_header("Evidence step heading"))?;
    let block = lines.collect::<Vec<_>>();

    Ok(EvidenceStep {
        task_number: task_number
            .parse::<u32>()
            .map_err(|_| missing_header("Evidence task number"))?,
        step_number: step_number
            .parse::<u32>()
            .map_err(|_| missing_header("Evidence step number"))?,
        status: parse_scalar_field(&block, "Status")?,
        claim: parse_scalar_field(&block, "Claim")?,
    })
}

fn parse_scalar_field(lines: &[&str], field: &str) -> Result<String, DiagnosticError> {
    let prefix = format!("**{field}:** ");
    lines
        .iter()
        .find_map(|line| line.strip_prefix(&prefix))
        .map(ToOwned::to_owned)
        .ok_or_else(|| missing_header(field))
}

fn missing_header(header: &str) -> DiagnosticError {
    DiagnosticError::new(
        FailureClass::InstructionParseFailed,
        format!("Missing or malformed {header}."),
    )
}
