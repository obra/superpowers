use std::fs;
use std::path::Path;

use schemars::JsonSchema;
use serde::Serialize;

use crate::contracts::headers;
use crate::diagnostics::{DiagnosticError, FailureClass};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct EvidenceStep {
    pub task_number: u32,
    pub step_number: u32,
    pub status: String,
    pub claim: String,
    pub source_contract_path: Option<String>,
    pub source_contract_fingerprint: Option<String>,
    pub source_evaluation_report_fingerprint: Option<String>,
    pub evaluator_verdict: Option<String>,
    pub failing_criterion_ids: Vec<String>,
    pub source_handoff_fingerprint: Option<String>,
    pub repo_state_baseline_head_sha: Option<String>,
    pub repo_state_baseline_worktree_fingerprint: Option<String>,
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
    headers::parse_required_header(source, header)
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
        source_contract_path: parse_optional_scalar_field(&block, "Source Contract Path"),
        source_contract_fingerprint: parse_optional_scalar_field(
            &block,
            "Source Contract Fingerprint",
        ),
        source_evaluation_report_fingerprint: parse_optional_scalar_field(
            &block,
            "Source Evaluation Report Fingerprint",
        ),
        evaluator_verdict: parse_optional_scalar_field(&block, "Evaluator Verdict"),
        failing_criterion_ids: parse_optional_list_field(&block, "Failing Criterion IDs"),
        source_handoff_fingerprint: parse_optional_scalar_field(
            &block,
            "Source Handoff Fingerprint",
        ),
        repo_state_baseline_head_sha: parse_optional_scalar_field(
            &block,
            "Repo State Baseline Head SHA",
        ),
        repo_state_baseline_worktree_fingerprint: parse_optional_scalar_field(
            &block,
            "Repo State Baseline Worktree Fingerprint",
        ),
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

fn parse_optional_scalar_field(lines: &[&str], field: &str) -> Option<String> {
    let prefix = format!("**{field}:** ");
    lines
        .iter()
        .find_map(|line| line.strip_prefix(&prefix))
        .map(str::trim)
        .map(|value| value.trim_matches('`'))
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn parse_optional_list_field(lines: &[&str], field: &str) -> Vec<String> {
    let marker = format!("**{field}:**");
    let Some(start_idx) = lines.iter().position(|line| line.trim() == marker) else {
        return Vec::new();
    };

    let mut values = Vec::new();
    let mut cursor = start_idx + 1;
    while cursor < lines.len() {
        let line = lines[cursor].trim();
        if line.is_empty() {
            cursor += 1;
            continue;
        }
        if line == "[]" {
            return Vec::new();
        }
        if line.starts_with("**") || line.starts_with("### ") || line.starts_with("#### ") {
            break;
        }
        if let Some(value) = line.strip_prefix("- ") {
            let value = value.trim_matches('`');
            if !value.is_empty() {
                values.push(value.to_owned());
            }
            cursor += 1;
            continue;
        }
        break;
    }

    values
}

fn missing_header(header: &str) -> DiagnosticError {
    DiagnosticError::new(
        FailureClass::InstructionParseFailed,
        format!("Missing or malformed {header}."),
    )
}
