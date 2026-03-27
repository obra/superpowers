use std::collections::BTreeSet;
use std::fs;
use std::path::Path;

use schemars::JsonSchema;
use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::diagnostics::{DiagnosticError, FailureClass};

const CONTRACT_VERSION: u32 = 1;
const REPORT_VERSION: u32 = 1;
const HANDOFF_VERSION: u32 = 1;
const EVIDENCE_ARTIFACT_VERSION: u32 = 1;

const SUPPORTED_SATISFACTION_RULES: [&str; 3] = ["all_of", "any_of", "per_step"];
const SUPPORTED_EVALUATOR_KINDS: [&str; 2] = ["spec_compliance", "code_quality"];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct ExecutionContract {
    pub contract_version: u32,
    pub authoritative_sequence: u64,
    pub source_plan_path: String,
    pub source_plan_revision: u32,
    pub source_plan_fingerprint: String,
    pub source_spec_path: String,
    pub source_spec_revision: u32,
    pub source_spec_fingerprint: String,
    pub source_task_packet_fingerprints: Vec<String>,
    pub chunk_id: String,
    pub chunking_strategy: String,
    pub covered_steps: Vec<String>,
    pub requirement_ids: Vec<String>,
    pub criteria: Vec<ContractCriterion>,
    pub non_goals: Vec<String>,
    pub verifiers: Vec<String>,
    pub evidence_requirements: Vec<EvidenceRequirement>,
    pub retry_budget: u32,
    pub pivot_threshold: u32,
    pub reset_policy: String,
    pub generated_by: String,
    pub generated_at: String,
    pub contract_fingerprint: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct ContractCriterion {
    pub criterion_id: String,
    pub title: String,
    pub description: String,
    pub requirement_ids: Vec<String>,
    pub covered_steps: Vec<String>,
    pub verifier_types: Vec<String>,
    pub threshold: String,
    pub notes: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct EvidenceRequirement {
    pub evidence_requirement_id: String,
    pub kind: String,
    pub requirement_ids: Vec<String>,
    pub covered_steps: Vec<String>,
    pub satisfaction_rule: String,
    pub notes: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct EvaluationReport {
    pub report_version: u32,
    pub authoritative_sequence: u64,
    pub source_plan_path: String,
    pub source_plan_revision: u32,
    pub source_plan_fingerprint: String,
    pub source_contract_fingerprint: String,
    pub evaluator_kind: String,
    pub verdict: String,
    pub criterion_results: Vec<CriterionResult>,
    pub affected_steps: Vec<String>,
    pub evidence_refs: Vec<EvaluationEvidenceRef>,
    pub recommended_action: String,
    pub summary: String,
    pub generated_by: String,
    pub generated_at: String,
    pub report_fingerprint: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct CriterionResult {
    pub criterion_id: String,
    pub status: String,
    pub requirement_ids: Vec<String>,
    pub covered_steps: Vec<String>,
    pub finding: String,
    pub evidence_refs: Vec<String>,
    pub severity: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct EvaluationEvidenceRef {
    pub evidence_ref_id: String,
    pub kind: String,
    pub source: String,
    pub requirement_ids: Vec<String>,
    pub covered_steps: Vec<String>,
    pub evidence_requirement_ids: Vec<String>,
    pub summary: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct ExecutionHandoff {
    pub handoff_version: u32,
    pub authoritative_sequence: u64,
    pub source_plan_path: String,
    pub source_plan_revision: u32,
    pub source_contract_fingerprint: String,
    pub harness_phase: String,
    pub chunk_id: String,
    pub satisfied_criteria: Vec<String>,
    pub open_criteria: Vec<String>,
    pub open_findings: Vec<String>,
    pub files_touched: Vec<String>,
    pub next_action: String,
    pub workspace_notes: String,
    pub commands_run: Vec<String>,
    pub risks: Vec<String>,
    pub generated_by: String,
    pub generated_at: String,
    pub handoff_fingerprint: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct EvidenceArtifact {
    pub evidence_artifact_version: u32,
    pub evidence_artifact_fingerprint: String,
    pub evidence_kind: String,
    pub source_locator: String,
    pub repo_state_baseline_head_sha: String,
    pub repo_state_baseline_worktree_fingerprint: String,
    pub relative_path: String,
    pub captured_content_fingerprint: String,
    pub generated_by: String,
    pub generated_at: String,
    pub captured_content: String,
}

pub fn read_execution_contract(
    path: impl AsRef<Path>,
) -> Result<ExecutionContract, DiagnosticError> {
    let source = read_markdown(path.as_ref(), "execution contract")?;
    parse_execution_contract(&source)
}

pub fn read_evaluation_report(path: impl AsRef<Path>) -> Result<EvaluationReport, DiagnosticError> {
    let source = read_markdown(path.as_ref(), "evaluation report")?;
    parse_evaluation_report(&source)
}

pub fn read_execution_handoff(path: impl AsRef<Path>) -> Result<ExecutionHandoff, DiagnosticError> {
    let source = read_markdown(path.as_ref(), "execution handoff")?;
    parse_execution_handoff(&source)
}

pub fn read_evidence_artifact(path: impl AsRef<Path>) -> Result<EvidenceArtifact, DiagnosticError> {
    let source = read_markdown(path.as_ref(), "evidence artifact")?;
    parse_evidence_artifact(&source)
}

pub fn fingerprint_execution_contract(markdown: &str) -> String {
    sha256_hex(markdown)
}

pub fn fingerprint_evaluation_report(markdown: &str) -> String {
    sha256_hex(markdown)
}

pub fn fingerprint_execution_handoff(markdown: &str) -> String {
    sha256_hex(markdown)
}

pub fn fingerprint_evidence_artifact(markdown: &str) -> String {
    sha256_hex(markdown)
}

pub fn sha256_hex(contents: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(contents.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn parse_execution_contract(source: &str) -> Result<ExecutionContract, DiagnosticError> {
    let lines: Vec<&str> = source.lines().collect();

    let contract_version = parse_u32_header(source, "Contract Version", "contract_version")?;
    if contract_version != CONTRACT_VERSION {
        return Err(parse_error(format!(
            "Unsupported contract_version: {contract_version}."
        )));
    }

    let authoritative_sequence =
        parse_u64_header(source, "Authoritative Sequence", "authoritative_sequence")?;
    let source_plan_path = parse_string_header(source, "Source Plan Path", "source_plan_path")?;
    let source_plan_revision =
        parse_u32_header(source, "Source Plan Revision", "source_plan_revision")?;
    let source_plan_fingerprint =
        parse_string_header(source, "Source Plan Fingerprint", "source_plan_fingerprint")?;
    let source_spec_path = parse_string_header(source, "Source Spec Path", "source_spec_path")?;
    let source_spec_revision =
        parse_u32_header(source, "Source Spec Revision", "source_spec_revision")?;
    let source_spec_fingerprint =
        parse_string_header(source, "Source Spec Fingerprint", "source_spec_fingerprint")?;
    let source_task_packet_fingerprints = parse_list_between_markers(
        &lines,
        0,
        "**Source Task Packet Fingerprints:**",
        "**Chunk ID:**",
        "source_task_packet_fingerprints",
    )?;
    let chunk_id = parse_string_header(source, "Chunk ID", "chunk_id")?;
    let chunking_strategy = parse_string_header(source, "Chunking Strategy", "chunking_strategy")?;
    let covered_steps = parse_list_between_markers(
        &lines,
        0,
        "**Covered Steps:**",
        "**Requirement IDs:**",
        "covered_steps",
    )?;
    if covered_steps.is_empty() {
        return Err(parse_error(
            "ExecutionContract has empty scope (covered_steps).",
        ));
    }
    let requirement_ids = parse_list_between_markers(
        &lines,
        0,
        "**Requirement IDs:**",
        "**Criteria:**",
        "requirement_ids",
    )?;

    let criteria_section =
        parse_section_between_markers(&lines, 0, "**Criteria:**", "**Non Goals:**", "criteria")?;
    let criteria = parse_contract_criteria(&criteria_section)?;
    if criteria.is_empty() {
        return Err(parse_error("ExecutionContract has empty criteria."));
    }

    let non_goals =
        parse_list_between_markers(&lines, 0, "**Non Goals:**", "**Verifiers:**", "non_goals")?;
    let verifiers = parse_list_between_markers(
        &lines,
        0,
        "**Verifiers:**",
        "**Evidence Requirements:**",
        "verifiers",
    )?;
    if verifiers.is_empty() {
        return Err(parse_error(
            "ExecutionContract has empty verifier declarations.",
        ));
    }
    validate_contract_evaluator_kinds(&verifiers, &criteria)?;

    let evidence_requirements_section = parse_section_between_markers(
        &lines,
        0,
        "**Evidence Requirements:**",
        "**Retry Budget:**",
        "evidence_requirements",
    )?;
    let evidence_requirements = parse_evidence_requirements(&evidence_requirements_section)?;

    let retry_budget = parse_u32_header(source, "Retry Budget", "retry_budget")?;
    let pivot_threshold = parse_u32_header(source, "Pivot Threshold", "pivot_threshold")?;
    let reset_policy = parse_string_header(source, "Reset Policy", "reset_policy")?;
    let generated_by = parse_string_header(source, "Generated By", "generated_by")?;
    let generated_at = parse_string_header(source, "Generated At", "generated_at")?;
    let contract_fingerprint =
        parse_string_header(source, "Contract Fingerprint", "contract_fingerprint")?;

    Ok(ExecutionContract {
        contract_version,
        authoritative_sequence,
        source_plan_path,
        source_plan_revision,
        source_plan_fingerprint,
        source_spec_path,
        source_spec_revision,
        source_spec_fingerprint,
        source_task_packet_fingerprints,
        chunk_id,
        chunking_strategy,
        covered_steps,
        requirement_ids,
        criteria,
        non_goals,
        verifiers,
        evidence_requirements,
        retry_budget,
        pivot_threshold,
        reset_policy,
        generated_by,
        generated_at,
        contract_fingerprint,
    })
}

fn parse_evaluation_report(source: &str) -> Result<EvaluationReport, DiagnosticError> {
    let lines: Vec<&str> = source.lines().collect();

    let report_version = parse_u32_header(source, "Report Version", "report_version")?;
    if report_version != REPORT_VERSION {
        return Err(parse_error(format!(
            "Unsupported report_version: {report_version}."
        )));
    }

    let authoritative_sequence =
        parse_u64_header(source, "Authoritative Sequence", "authoritative_sequence")?;
    let source_plan_path = parse_string_header(source, "Source Plan Path", "source_plan_path")?;
    let source_plan_revision =
        parse_u32_header(source, "Source Plan Revision", "source_plan_revision")?;
    let source_plan_fingerprint =
        parse_string_header(source, "Source Plan Fingerprint", "source_plan_fingerprint")?;
    let source_contract_fingerprint = parse_string_header(
        source,
        "Source Contract Fingerprint",
        "source_contract_fingerprint",
    )?;
    let evaluator_kind = parse_string_header(source, "Evaluator Kind", "evaluator_kind")?;
    let verdict = parse_string_header(source, "Verdict", "verdict")?;

    let criterion_results_section = parse_section_between_markers(
        &lines,
        0,
        "**Criterion Results:**",
        "**Affected Steps:**",
        "criterion_results",
    )?;
    let criterion_results = parse_criterion_results(&criterion_results_section)?;

    let affected_idx = find_marker_index(&lines, 0, "**Affected Steps:**")
        .ok_or_else(|| parse_error("Missing or malformed affected_steps."))?;
    let affected_steps = parse_list_between_markers(
        &lines,
        affected_idx,
        "**Affected Steps:**",
        "**Evidence Refs:**",
        "affected_steps",
    )?;
    let evidence_refs_section = parse_section_between_markers(
        &lines,
        affected_idx + 1,
        "**Evidence Refs:**",
        "**Recommended Action:**",
        "evidence_refs",
    )?;
    let evidence_refs = parse_evaluation_evidence_refs(&evidence_refs_section)?;

    let recommended_action =
        parse_string_header(source, "Recommended Action", "recommended_action")?;
    let recommended_action_idx = find_marker_index(&lines, 0, "**Recommended Action:**")
        .ok_or_else(|| parse_error("Missing or malformed recommended_action."))?;
    let summary =
        parse_string_header_after(&lines, recommended_action_idx + 1, "Summary", "summary")?;
    let generated_by = parse_string_header(source, "Generated By", "generated_by")?;
    let generated_at = parse_string_header(source, "Generated At", "generated_at")?;
    let report_fingerprint =
        parse_string_header(source, "Report Fingerprint", "report_fingerprint")?;

    Ok(EvaluationReport {
        report_version,
        authoritative_sequence,
        source_plan_path,
        source_plan_revision,
        source_plan_fingerprint,
        source_contract_fingerprint,
        evaluator_kind,
        verdict,
        criterion_results,
        affected_steps,
        evidence_refs,
        recommended_action,
        summary,
        generated_by,
        generated_at,
        report_fingerprint,
    })
}

fn parse_execution_handoff(source: &str) -> Result<ExecutionHandoff, DiagnosticError> {
    let lines: Vec<&str> = source.lines().collect();

    let handoff_version = parse_u32_header(source, "Handoff Version", "handoff_version")?;
    if handoff_version != HANDOFF_VERSION {
        return Err(parse_error(format!(
            "Unsupported handoff_version: {handoff_version}."
        )));
    }

    let authoritative_sequence =
        parse_u64_header(source, "Authoritative Sequence", "authoritative_sequence")?;
    let source_plan_path = parse_string_header(source, "Source Plan Path", "source_plan_path")?;
    let source_plan_revision =
        parse_u32_header(source, "Source Plan Revision", "source_plan_revision")?;
    let source_contract_fingerprint = parse_string_header(
        source,
        "Source Contract Fingerprint",
        "source_contract_fingerprint",
    )?;
    let harness_phase = parse_string_header(source, "Harness Phase", "harness_phase")?;
    let chunk_id = parse_string_header(source, "Chunk ID", "chunk_id")?;
    let satisfied_criteria = parse_list_between_markers(
        &lines,
        0,
        "**Satisfied Criteria:**",
        "**Open Criteria:**",
        "satisfied_criteria",
    )?;
    let open_criteria = parse_list_between_markers(
        &lines,
        0,
        "**Open Criteria:**",
        "**Open Findings:**",
        "open_criteria",
    )?;
    let open_findings = parse_list_between_markers(
        &lines,
        0,
        "**Open Findings:**",
        "**Files Touched:**",
        "open_findings",
    )?;
    let files_touched = parse_list_between_markers(
        &lines,
        0,
        "**Files Touched:**",
        "**Next Action:**",
        "files_touched",
    )?;
    let next_action = parse_string_header(source, "Next Action", "next_action")?;
    if next_action.trim().is_empty() {
        return Err(parse_error(
            "ExecutionHandoff is missing a concrete next action.",
        ));
    }
    let workspace_notes = parse_string_header(source, "Workspace Notes", "workspace_notes")?;
    let commands_run =
        parse_list_between_markers(&lines, 0, "**Commands Run:**", "**Risks:**", "commands_run")?;
    let risks = parse_list_between_markers(&lines, 0, "**Risks:**", "**Generated By:**", "risks")?;
    let generated_by = parse_string_header(source, "Generated By", "generated_by")?;
    let generated_at = parse_string_header(source, "Generated At", "generated_at")?;
    let handoff_fingerprint =
        parse_string_header(source, "Handoff Fingerprint", "handoff_fingerprint")?;

    Ok(ExecutionHandoff {
        handoff_version,
        authoritative_sequence,
        source_plan_path,
        source_plan_revision,
        source_contract_fingerprint,
        harness_phase,
        chunk_id,
        satisfied_criteria,
        open_criteria,
        open_findings,
        files_touched,
        next_action,
        workspace_notes,
        commands_run,
        risks,
        generated_by,
        generated_at,
        handoff_fingerprint,
    })
}

fn parse_evidence_artifact(source: &str) -> Result<EvidenceArtifact, DiagnosticError> {
    let evidence_artifact_version = parse_u32_header(
        source,
        "Evidence Artifact Version",
        "evidence_artifact_version",
    )?;
    if evidence_artifact_version != EVIDENCE_ARTIFACT_VERSION {
        return Err(parse_error(format!(
            "Unsupported evidence_artifact_version: {evidence_artifact_version}."
        )));
    }

    Ok(EvidenceArtifact {
        evidence_artifact_version,
        evidence_artifact_fingerprint: parse_string_header(
            source,
            "Evidence Artifact Fingerprint",
            "evidence_artifact_fingerprint",
        )?,
        evidence_kind: parse_string_header(source, "Evidence Kind", "evidence_kind")?,
        source_locator: parse_string_header(source, "Source Locator", "source_locator")?,
        repo_state_baseline_head_sha: parse_string_header(
            source,
            "Repo State Baseline Head SHA",
            "repo_state_baseline_head_sha",
        )?,
        repo_state_baseline_worktree_fingerprint: parse_string_header(
            source,
            "Repo State Baseline Worktree Fingerprint",
            "repo_state_baseline_worktree_fingerprint",
        )?,
        relative_path: parse_string_header(source, "Relative Path", "relative_path")?,
        captured_content_fingerprint: parse_string_header(
            source,
            "Captured Content Fingerprint",
            "captured_content_fingerprint",
        )?,
        generated_by: parse_string_header(source, "Generated By", "generated_by")?,
        generated_at: parse_string_header(source, "Generated At", "generated_at")?,
        captured_content: parse_captured_content(source),
    })
}

fn parse_contract_criteria(section: &str) -> Result<Vec<ContractCriterion>, DiagnosticError> {
    if section.trim() == "[]" {
        return Ok(Vec::new());
    }
    let blocks = parse_blocks(section, "### Criterion ", "criteria")?;
    blocks
        .iter()
        .map(|block| {
            Ok(ContractCriterion {
                criterion_id: parse_string_from_block(block, "Criterion ID", "criterion_id")?,
                title: parse_string_from_block(block, "Title", "title")?,
                description: parse_string_from_block(block, "Description", "description")?,
                requirement_ids: parse_list_from_block(
                    block,
                    "Requirement IDs",
                    "criterion.requirement_ids",
                )?,
                covered_steps: parse_list_from_block(
                    block,
                    "Covered Steps",
                    "criterion.covered_steps",
                )?,
                verifier_types: parse_list_from_block(
                    block,
                    "Verifier Types",
                    "criterion.verifier_types",
                )?,
                threshold: parse_string_from_block(block, "Threshold", "criterion.threshold")?,
                notes: parse_string_from_block(block, "Notes", "criterion.notes")?,
            })
        })
        .collect()
}

fn parse_evidence_requirements(section: &str) -> Result<Vec<EvidenceRequirement>, DiagnosticError> {
    if section.trim() == "[]" {
        return Ok(Vec::new());
    }
    let blocks = parse_blocks(
        section,
        "### Evidence Requirement ",
        "evidence_requirements",
    )?;
    blocks
        .iter()
        .map(|block| {
            let satisfaction_rule = parse_string_from_block(
                block,
                "Satisfaction Rule",
                "evidence_requirements.satisfaction_rule",
            )?;
            if !SUPPORTED_SATISFACTION_RULES
                .iter()
                .any(|rule| *rule == satisfaction_rule)
            {
                return Err(parse_error(format!(
                    "Unsupported satisfaction_rule `{satisfaction_rule}` (reason: invalid_evidence_satisfaction_rule)."
                )));
            }

            Ok(EvidenceRequirement {
                evidence_requirement_id: parse_string_from_block(
                    block,
                    "Evidence Requirement ID",
                    "evidence_requirements.evidence_requirement_id",
                )?,
                kind: parse_string_from_block(block, "Kind", "evidence_requirements.kind")?,
                requirement_ids: parse_list_from_block(
                    block,
                    "Requirement IDs",
                    "evidence_requirements.requirement_ids",
                )?,
                covered_steps: parse_list_from_block(
                    block,
                    "Covered Steps",
                    "evidence_requirements.covered_steps",
                )?,
                satisfaction_rule,
                notes: parse_string_from_block(block, "Notes", "evidence_requirements.notes")?,
            })
        })
        .collect()
}

fn parse_criterion_results(section: &str) -> Result<Vec<CriterionResult>, DiagnosticError> {
    if section.trim() == "[]" {
        return Ok(Vec::new());
    }
    let blocks = parse_blocks(section, "### Criterion Result ", "criterion_results")?;
    blocks
        .iter()
        .map(|block| {
            Ok(CriterionResult {
                criterion_id: parse_string_from_block(block, "Criterion ID", "criterion_id")?,
                status: parse_string_from_block(block, "Status", "status")?,
                requirement_ids: parse_list_from_block(
                    block,
                    "Requirement IDs",
                    "requirement_ids",
                )?,
                covered_steps: parse_list_from_block(block, "Covered Steps", "covered_steps")?,
                finding: parse_string_from_block(block, "Finding", "finding")?,
                evidence_refs: parse_list_from_block(block, "Evidence Refs", "evidence_refs")?,
                severity: parse_string_from_block(block, "Severity", "severity")?,
            })
        })
        .collect()
}

fn parse_evaluation_evidence_refs(
    section: &str,
) -> Result<Vec<EvaluationEvidenceRef>, DiagnosticError> {
    if section.trim() == "[]" {
        return Ok(Vec::new());
    }
    let blocks = parse_blocks(section, "### Evidence Ref ", "evidence_refs")?;
    blocks
        .iter()
        .map(|block| {
            Ok(EvaluationEvidenceRef {
                evidence_ref_id: parse_string_from_block(
                    block,
                    "Evidence Ref ID",
                    "evidence_ref_id",
                )?,
                kind: parse_string_from_block(block, "Kind", "kind")?,
                source: parse_string_from_block(block, "Source", "source")?,
                requirement_ids: parse_list_from_block(
                    block,
                    "Requirement IDs",
                    "requirement_ids",
                )?,
                covered_steps: parse_list_from_block(block, "Covered Steps", "covered_steps")?,
                evidence_requirement_ids: parse_list_from_block(
                    block,
                    "Evidence Requirement IDs",
                    "evidence_requirement_ids",
                )?,
                summary: parse_string_from_block(block, "Summary", "summary")?,
            })
        })
        .collect()
}

fn validate_contract_evaluator_kinds(
    verifiers: &[String],
    criteria: &[ContractCriterion],
) -> Result<(), DiagnosticError> {
    for evaluator_kind in verifiers {
        if !is_supported_evaluator_kind(evaluator_kind) {
            return Err(parse_error(format!(
                "ExecutionContract declares unsupported evaluator kind `{evaluator_kind}` in verifiers (reason: unsupported_evaluator_kind)."
            )));
        }
    }

    let declared_verifiers: BTreeSet<&str> = verifiers.iter().map(String::as_str).collect();
    for criterion in criteria {
        if criterion.verifier_types.len() != 1 {
            return Err(parse_error(format!(
                "ExecutionContract criterion `{}` must declare exactly one evaluator kind in verifier_types; found {} (reason: invalid_criterion_verifier_owner_count).",
                criterion.criterion_id,
                criterion.verifier_types.len()
            )));
        }

        let evaluator_kind = &criterion.verifier_types[0];
        if !is_supported_evaluator_kind(evaluator_kind) {
            return Err(parse_error(format!(
                "ExecutionContract criterion `{}` declares unsupported evaluator kind `{evaluator_kind}` in verifier_types (reason: unsupported_evaluator_kind).",
                criterion.criterion_id
            )));
        }
        if !declared_verifiers.contains(evaluator_kind.as_str()) {
            return Err(parse_error(format!(
                "ExecutionContract criterion `{}` declares undeclared evaluator kind `{evaluator_kind}` not present in top-level verifiers (reason: undeclared_evaluator_kind).",
                criterion.criterion_id
            )));
        }
    }

    Ok(())
}

fn is_supported_evaluator_kind(value: &str) -> bool {
    SUPPORTED_EVALUATOR_KINDS
        .iter()
        .any(|supported| *supported == value)
}

fn parse_blocks(
    section: &str,
    block_prefix: &str,
    field_name: &str,
) -> Result<Vec<String>, DiagnosticError> {
    let mut blocks: Vec<String> = Vec::new();
    let mut current: Vec<String> = Vec::new();

    for line in section.lines() {
        let trimmed_start = line.trim_start();
        if trimmed_start.starts_with(block_prefix) {
            if !current.is_empty() {
                blocks.push(current.join("\n"));
                current.clear();
            }
        }
        if !current.is_empty() || trimmed_start.starts_with(block_prefix) {
            current.push(line.to_owned());
        }
    }
    if !current.is_empty() {
        blocks.push(current.join("\n"));
    }

    if blocks.is_empty() {
        return Err(parse_error(format!("Missing or malformed {field_name}.")));
    }

    Ok(blocks)
}

fn parse_string_header(
    source: &str,
    header: &str,
    field_name: &str,
) -> Result<String, DiagnosticError> {
    parse_header_value(&source.lines().collect::<Vec<_>>(), 0, header, field_name)
}

fn parse_string_header_after(
    lines: &[&str],
    start_idx: usize,
    header: &str,
    field_name: &str,
) -> Result<String, DiagnosticError> {
    parse_header_value(lines, start_idx, header, field_name)
}

fn parse_u32_header(source: &str, header: &str, field_name: &str) -> Result<u32, DiagnosticError> {
    parse_string_header(source, header, field_name)?
        .parse::<u32>()
        .map_err(|_| parse_error(format!("Missing or malformed {field_name}.")))
}

fn parse_u64_header(source: &str, header: &str, field_name: &str) -> Result<u64, DiagnosticError> {
    parse_string_header(source, header, field_name)?
        .parse::<u64>()
        .map_err(|_| parse_error(format!("Missing or malformed {field_name}.")))
}

fn parse_header_value(
    lines: &[&str],
    start_idx: usize,
    header: &str,
    field_name: &str,
) -> Result<String, DiagnosticError> {
    let marker = format!("**{header}:**");
    for line in lines.iter().skip(start_idx) {
        let trimmed = line.trim();
        if let Some(rest) = trimmed.strip_prefix(&marker) {
            return Ok(rest.trim().trim_matches('`').to_owned());
        }
    }
    Err(parse_error(format!("Missing or malformed {field_name}.")))
}

fn parse_section_between_markers(
    lines: &[&str],
    start_search: usize,
    start_marker: &str,
    end_marker: &str,
    field_name: &str,
) -> Result<String, DiagnosticError> {
    let start_idx = find_marker_index(lines, start_search, start_marker)
        .ok_or_else(|| parse_error(format!("Missing or malformed {field_name}.")))?;
    let end_idx = find_marker_index(lines, start_idx + 1, end_marker)
        .ok_or_else(|| parse_error(format!("Missing or malformed {field_name}.")))?;
    Ok(lines[start_idx + 1..end_idx].join("\n"))
}

fn parse_list_between_markers(
    lines: &[&str],
    start_search: usize,
    start_marker: &str,
    end_marker: &str,
    field_name: &str,
) -> Result<Vec<String>, DiagnosticError> {
    let section =
        parse_section_between_markers(lines, start_search, start_marker, end_marker, field_name)?;
    parse_list(&section, field_name)
}

fn parse_string_from_block(
    block: &str,
    header: &str,
    field_name: &str,
) -> Result<String, DiagnosticError> {
    parse_header_value(&block.lines().collect::<Vec<_>>(), 0, header, field_name)
}

fn parse_list_from_block(
    block: &str,
    header: &str,
    field_name: &str,
) -> Result<Vec<String>, DiagnosticError> {
    let lines: Vec<&str> = block.lines().collect();
    let marker = format!("**{header}:**");
    let start_idx = lines
        .iter()
        .position(|line| line.trim().starts_with(&marker))
        .ok_or_else(|| parse_error(format!("Missing or malformed {field_name}.")))?;

    let mut end_idx = lines.len();
    for (idx, line) in lines.iter().enumerate().skip(start_idx + 1) {
        let trimmed = line.trim();
        if trimmed.starts_with("**") || trimmed.starts_with("### ") {
            end_idx = idx;
            break;
        }
    }

    parse_list(&lines[start_idx + 1..end_idx].join("\n"), field_name)
}

fn parse_list(section: &str, field_name: &str) -> Result<Vec<String>, DiagnosticError> {
    let mut values = Vec::new();
    let mut saw_content = false;
    for line in section.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        saw_content = true;
        if trimmed == "[]" {
            return Ok(Vec::new());
        }
        let value = trimmed
            .strip_prefix("- ")
            .ok_or_else(|| parse_error(format!("Malformed {field_name} list entry: {trimmed}")))?;
        values.push(value.trim().trim_matches('`').to_owned());
    }

    if !saw_content {
        return Err(parse_error(format!("Missing or malformed {field_name}.")));
    }

    Ok(values)
}

fn parse_captured_content(source: &str) -> String {
    let lines: Vec<&str> = source.lines().collect();
    if let Some(index) = find_exact_line(&lines, "## Captured Content") {
        return lines[index + 1..].join("\n").trim().to_owned();
    }
    String::new()
}

fn find_marker_index(lines: &[&str], start_idx: usize, marker: &str) -> Option<usize> {
    lines
        .iter()
        .enumerate()
        .skip(start_idx)
        .find_map(|(idx, line)| line.trim().starts_with(marker).then_some(idx))
}

fn find_exact_line(lines: &[&str], value: &str) -> Option<usize> {
    lines
        .iter()
        .enumerate()
        .find_map(|(idx, line)| (line.trim() == value).then_some(idx))
}

fn read_markdown(path: &Path, artifact: &str) -> Result<String, DiagnosticError> {
    fs::read_to_string(path).map_err(|err| {
        parse_error(format!(
            "Could not read {artifact} {}: {err}",
            path.display()
        ))
    })
}

fn parse_error(message: impl Into<String>) -> DiagnosticError {
    DiagnosticError::new(FailureClass::InstructionParseFailed, message)
}
