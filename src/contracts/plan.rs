use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::contracts::headers;
use crate::contracts::spec::{SpecDocument, parse_spec_file, repo_relative_string};
use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::git::discover_slug_identity;
use crate::paths::{RepoPath, featureforge_state_dir, harness_branch_root};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct PlanStep {
    pub number: u32,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct TaskFileEntry {
    pub action: String,
    pub path: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct PlanTask {
    pub number: u32,
    pub title: String,
    pub spec_coverage: Vec<String>,
    pub task_outcome: String,
    pub plan_constraints: Vec<String>,
    pub open_questions: String,
    pub files: Vec<TaskFileEntry>,
    pub steps: Vec<PlanStep>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct PlanDocument {
    pub path: String,
    pub workflow_state: String,
    pub plan_revision: u32,
    pub execution_mode: String,
    pub source_spec_path: String,
    pub source_spec_revision: u32,
    pub last_reviewed_by: String,
    pub coverage_matrix: BTreeMap<String, Vec<u32>>,
    pub tasks: Vec<PlanTask>,
    #[serde(skip)]
    pub source: String,
}

pub const PLAN_FIDELITY_RECEIPT_SCHEMA_VERSION: u32 = 2;
pub const PLAN_FIDELITY_RECEIPT_KIND: &str = "plan_fidelity_receipt";
pub const PLAN_FIDELITY_REVIEW_STAGE: &str = "featureforge:plan-fidelity-review";
pub const PLAN_FIDELITY_REQUIRED_SURFACES: [&str; 2] = ["requirement_index", "execution_topology"];
pub const PLAN_FIDELITY_DISTINCT_STAGES: [&str; 2] =
    ["featureforge:writing-plans", "featureforge:plan-eng-review"];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct PlanFidelityReviewerProvenance {
    pub review_stage: String,
    pub reviewer_source: String,
    pub reviewer_id: String,
    pub distinct_from_stages: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct PlanFidelityVerification {
    pub checked_surfaces: Vec<String>,
    pub verified_requirement_ids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct PlanFidelityReceipt {
    pub schema_version: u32,
    pub receipt_kind: String,
    pub verdict: String,
    pub spec_path: String,
    pub spec_revision: u32,
    pub spec_fingerprint: String,
    pub plan_path: String,
    pub plan_revision: u32,
    pub plan_fingerprint: String,
    pub review_artifact_path: String,
    pub review_artifact_fingerprint: String,
    pub reviewer_provenance: PlanFidelityReviewerProvenance,
    pub verification: PlanFidelityVerification,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct PlanFidelityGateReport {
    pub state: String,
    pub receipt_path: String,
    pub reviewer_stage: String,
    pub provenance_source: String,
    pub verified_requirement_index: bool,
    pub verified_execution_topology: bool,
    pub reason_codes: Vec<String>,
    pub diagnostics: Vec<ContractDiagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct ContractDiagnostic {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct OverlappingWriteScope {
    pub path: String,
    pub tasks: Vec<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct ParallelWorktreeRequirement {
    pub tasks: Vec<u32>,
    pub declared_worktrees: usize,
    pub required_worktrees: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct AnalyzePlanReport {
    pub contract_state: String,
    pub spec_path: String,
    pub spec_revision: u32,
    pub spec_fingerprint: String,
    pub plan_path: String,
    pub plan_revision: u32,
    pub plan_fingerprint: String,
    pub task_count: usize,
    pub packet_buildable_tasks: usize,
    pub coverage_complete: bool,
    pub open_questions_resolved: bool,
    pub task_structure_valid: bool,
    pub files_blocks_valid: bool,
    pub execution_strategy_present: bool,
    pub dependency_diagram_present: bool,
    pub execution_topology_valid: bool,
    pub serial_hazards_resolved: bool,
    pub parallel_lane_ownership_valid: bool,
    pub parallel_workspace_isolation_valid: bool,
    pub parallel_worktree_groups: Vec<Vec<u32>>,
    pub parallel_worktree_requirements: Vec<ParallelWorktreeRequirement>,
    pub reason_codes: Vec<String>,
    pub overlapping_write_scopes: Vec<OverlappingWriteScope>,
    pub plan_fidelity_receipt: PlanFidelityGateReport,
    pub diagnostics: Vec<ContractDiagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ExecutionTopologyAnalysis {
    pub execution_strategy_present: bool,
    pub dependency_diagram_present: bool,
    pub execution_topology_valid: bool,
    pub serial_hazards_resolved: bool,
    pub parallel_lane_ownership_valid: bool,
    pub parallel_workspace_isolation_valid: bool,
    pub parallel_worktree_groups: Vec<Vec<u32>>,
    pub parallel_worktree_requirements: Vec<ParallelWorktreeRequirement>,
    pub reason_codes: Vec<String>,
    pub diagnostics: Vec<ContractDiagnostic>,
}

pub fn parse_plan_file(path: impl AsRef<Path>) -> Result<PlanDocument, DiagnosticError> {
    let path = path.as_ref();
    let source = fs::read_to_string(path).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not read plan file {}: {err}", path.display()),
        )
    })?;
    parse_plan_source(path, source)
}

pub fn analyze_plan(
    spec_path: impl AsRef<Path>,
    plan_path: impl AsRef<Path>,
) -> Result<AnalyzePlanReport, DiagnosticError> {
    let spec_path = spec_path.as_ref();
    let plan_path = plan_path.as_ref();
    let spec = parse_spec_file(spec_path)?;
    let plan = parse_plan_file(plan_path)?;
    let mut report = analyze_documents(&spec, &plan);
    if plan.workflow_state == "Draft" {
        let gate = evaluate_plan_fidelity_receipt_at_path(
            &spec,
            &plan,
            repo_root_for_artifact_paths(spec_path, plan_path),
            plan_fidelity_receipt_path_for_repo(repo_root_for_artifact_paths(spec_path, plan_path)),
        );
        merge_plan_fidelity_gate(&mut report, &gate);
        report.plan_fidelity_receipt = gate;
    }
    Ok(report)
}

pub fn analyze_documents(spec: &SpecDocument, plan: &PlanDocument) -> AnalyzePlanReport {
    let mut diagnostics = Vec::new();
    let mut reason_codes = Vec::new();

    if plan.source_spec_path != spec.path || plan.source_spec_revision != spec.spec_revision {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "stale_spec_plan_linkage",
            "Plan source spec linkage does not match the current approved spec.",
        );
    }

    let spec_requirement_ids: BTreeSet<_> =
        spec.requirements.iter().map(|req| req.id.clone()).collect();
    let coverage_complete = spec_requirement_ids
        .iter()
        .all(|requirement_id| plan.coverage_matrix.contains_key(requirement_id));
    if !coverage_complete {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "missing_requirement_coverage",
            "Every indexed requirement must appear in the coverage matrix.",
        );
    }

    let open_questions_resolved = plan.tasks.iter().all(|task| task.open_questions == "none");
    let task_structure_valid = true;
    let files_blocks_valid = plan.tasks.iter().all(|task| !task.files.is_empty());
    let packet_buildable_tasks = plan
        .tasks
        .iter()
        .filter(|task| !task.files.is_empty())
        .count();
    let overlapping_write_scopes = detect_overlapping_write_scopes(&plan.tasks);
    let topology = analyze_execution_topology(
        &plan.source,
        &plan
            .tasks
            .iter()
            .map(|task| {
                (
                    task.number,
                    task.files
                        .iter()
                        .filter(|file| file.action != "Test")
                        .map(|file| file.path.clone())
                        .collect::<Vec<_>>(),
                )
            })
            .collect::<Vec<_>>(),
    );
    for code in &topology.reason_codes {
        if !reason_codes.iter().any(|existing| existing == code) {
            reason_codes.push(code.clone());
        }
    }
    for diagnostic in &topology.diagnostics {
        if !diagnostics.iter().any(|existing| {
            existing.code == diagnostic.code && existing.message == diagnostic.message
        }) {
            diagnostics.push(diagnostic.clone());
        }
    }
    let contract_state = if diagnostics.is_empty() {
        "valid"
    } else {
        "invalid"
    };

    AnalyzePlanReport {
        contract_state: contract_state.to_owned(),
        spec_path: spec.path.clone(),
        spec_revision: spec.spec_revision,
        spec_fingerprint: sha256_hex(spec.source.as_bytes()),
        plan_path: plan.path.clone(),
        plan_revision: plan.plan_revision,
        plan_fingerprint: sha256_hex(plan.source.as_bytes()),
        task_count: plan.tasks.len(),
        packet_buildable_tasks,
        coverage_complete,
        open_questions_resolved,
        task_structure_valid,
        files_blocks_valid,
        execution_strategy_present: topology.execution_strategy_present,
        dependency_diagram_present: topology.dependency_diagram_present,
        execution_topology_valid: topology.execution_topology_valid,
        serial_hazards_resolved: topology.serial_hazards_resolved,
        parallel_lane_ownership_valid: topology.parallel_lane_ownership_valid,
        parallel_workspace_isolation_valid: topology.parallel_workspace_isolation_valid,
        parallel_worktree_groups: topology.parallel_worktree_groups,
        parallel_worktree_requirements: topology.parallel_worktree_requirements,
        reason_codes,
        overlapping_write_scopes,
        plan_fidelity_receipt: PlanFidelityGateReport {
            state: String::from("not_applicable"),
            receipt_path: String::new(),
            reviewer_stage: String::new(),
            provenance_source: String::new(),
            verified_requirement_index: false,
            verified_execution_topology: false,
            reason_codes: Vec::new(),
            diagnostics: Vec::new(),
        },
        diagnostics,
    }
}

pub fn evaluate_plan_fidelity_receipt_at_path(
    spec: &SpecDocument,
    plan: &PlanDocument,
    repo_root: &Path,
    receipt_path: impl AsRef<Path>,
) -> PlanFidelityGateReport {
    let receipt_path = receipt_path.as_ref();
    let receipt_path_string = receipt_path.display().to_string();
    let mut diagnostics = Vec::new();
    let mut reason_codes = Vec::new();

    let source = match fs::read_to_string(receipt_path) {
        Ok(source) => source,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            push_diagnostic(
                &mut diagnostics,
                &mut reason_codes,
                "missing_plan_fidelity_receipt",
                "Plan-fidelity receipt is missing for the current draft plan.",
            );
            return PlanFidelityGateReport {
                state: String::from("missing"),
                receipt_path: receipt_path_string,
                reviewer_stage: String::new(),
                provenance_source: String::new(),
                verified_requirement_index: false,
                verified_execution_topology: false,
                reason_codes,
                diagnostics,
            };
        }
        Err(error) => {
            push_diagnostic(
                &mut diagnostics,
                &mut reason_codes,
                "malformed_plan_fidelity_receipt",
                &format!(
                    "Could not read plan-fidelity receipt {}: {error}",
                    receipt_path.display()
                ),
            );
            return PlanFidelityGateReport {
                state: String::from("malformed"),
                receipt_path: receipt_path_string,
                reviewer_stage: String::new(),
                provenance_source: String::new(),
                verified_requirement_index: false,
                verified_execution_topology: false,
                reason_codes,
                diagnostics,
            };
        }
    };

    let receipt = match serde_json::from_str::<PlanFidelityReceipt>(&source) {
        Ok(receipt) => receipt,
        Err(error) => {
            push_diagnostic(
                &mut diagnostics,
                &mut reason_codes,
                "malformed_plan_fidelity_receipt",
                &format!("Plan-fidelity receipt is not valid json: {error}"),
            );
            return PlanFidelityGateReport {
                state: String::from("malformed"),
                receipt_path: receipt_path_string,
                reviewer_stage: String::new(),
                provenance_source: String::new(),
                verified_requirement_index: false,
                verified_execution_topology: false,
                reason_codes,
                diagnostics,
            };
        }
    };

    if receipt.schema_version != PLAN_FIDELITY_RECEIPT_SCHEMA_VERSION
        || receipt.receipt_kind != PLAN_FIDELITY_RECEIPT_KIND
    {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "malformed_plan_fidelity_receipt",
            "Plan-fidelity receipt has an unsupported schema version or receipt kind.",
        );
        return PlanFidelityGateReport {
            state: String::from("malformed"),
            receipt_path: receipt_path_string,
            reviewer_stage: receipt.reviewer_provenance.review_stage,
            provenance_source: receipt.reviewer_provenance.reviewer_source,
            verified_requirement_index: false,
            verified_execution_topology: false,
            reason_codes,
            diagnostics,
        };
    }

    let spec_fingerprint = sha256_hex(spec.source.as_bytes());
    let plan_fingerprint = sha256_hex(plan.source.as_bytes());
    let stale_binding = receipt.spec_path != spec.path
        || receipt.spec_revision != spec.spec_revision
        || receipt.spec_fingerprint != spec_fingerprint
        || receipt.plan_path != plan.path
        || receipt.plan_revision != plan.plan_revision
        || receipt.plan_fingerprint != plan_fingerprint;
    if stale_binding {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "stale_plan_fidelity_receipt",
            "Plan-fidelity receipt does not match the current approved spec and draft plan revision.",
        );
    }

    if receipt.verdict != "pass" {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_receipt_not_pass",
            "Plan-fidelity receipt is not in pass state.",
        );
    }
    if spec.workflow_state != "CEO Approved" || spec.last_reviewed_by != "plan-ceo-review" {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_source_spec_not_ceo_approved",
            "Plan-fidelity review requires a workflow-valid CEO-approved source spec reviewed by plan-ceo-review.",
        );
    }
    if receipt.review_artifact_path.trim().is_empty()
        || receipt.review_artifact_fingerprint.trim().is_empty()
    {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_receipt_missing_review_artifact_binding",
            "Plan-fidelity receipt must bind to a concrete review artifact path and fingerprint.",
        );
    } else {
        match RepoPath::parse(&receipt.review_artifact_path) {
            Ok(review_artifact_path) => {
                let review_artifact_abs = repo_root.join(review_artifact_path.as_str());
                match fs::read(&review_artifact_abs) {
                    Ok(bytes) => {
                        if sha256_hex(&bytes) != receipt.review_artifact_fingerprint {
                            push_diagnostic(
                                &mut diagnostics,
                                &mut reason_codes,
                                "plan_fidelity_review_artifact_fingerprint_mismatch",
                                "Plan-fidelity receipt review artifact fingerprint does not match the current artifact contents.",
                            );
                        }
                    }
                    Err(_) => {
                        push_diagnostic(
                            &mut diagnostics,
                            &mut reason_codes,
                            "plan_fidelity_review_artifact_missing",
                            "Plan-fidelity receipt review artifact is missing or unreadable.",
                        );
                    }
                }
            }
            Err(_) => {
                push_diagnostic(
                    &mut diagnostics,
                    &mut reason_codes,
                    "plan_fidelity_review_artifact_invalid_path",
                    "Plan-fidelity receipt review artifact path must stay repo-relative.",
                );
            }
        }
    }

    let provenance = &receipt.reviewer_provenance;
    let distinct_stages = provenance
        .distinct_from_stages
        .iter()
        .map(String::as_str)
        .collect::<BTreeSet<_>>();
    let provenance_valid = provenance.review_stage == PLAN_FIDELITY_REVIEW_STAGE
        && matches!(
            provenance.reviewer_source.as_str(),
            "fresh-context-subagent" | "cross-model"
        )
        && !provenance.reviewer_id.trim().is_empty()
        && PLAN_FIDELITY_DISTINCT_STAGES
            .iter()
            .all(|stage| distinct_stages.contains(stage));
    if !provenance_valid {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_receipt_not_independent",
            "Plan-fidelity reviewer provenance must prove the dedicated reviewer stage stayed distinct from writing-plans and plan-eng-review.",
        );
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_reviewer_provenance_invalid",
            "Plan-fidelity receipt reviewer provenance is malformed or not independent.",
        );
    }

    let checked_surfaces = receipt
        .verification
        .checked_surfaces
        .iter()
        .map(String::as_str)
        .collect::<BTreeSet<_>>();
    let verified_requirement_ids = receipt
        .verification
        .verified_requirement_ids
        .iter()
        .cloned()
        .collect::<BTreeSet<_>>();
    let expected_requirement_ids = spec
        .requirements
        .iter()
        .map(|requirement| requirement.id.clone())
        .collect::<BTreeSet<_>>();
    let verified_requirement_index = checked_surfaces.contains("requirement_index")
        && verified_requirement_ids == expected_requirement_ids;
    let verified_execution_topology = checked_surfaces.contains("execution_topology");
    if !verified_requirement_index {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_receipt_missing_requirement_index_check",
            "Plan-fidelity receipt must prove the reviewer checked the full Requirement Index.",
        );
    }
    if !verified_execution_topology {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_receipt_missing_execution_topology_check",
            "Plan-fidelity receipt must prove the reviewer checked the draft plan's execution-topology claims.",
        );
    }
    if !verified_requirement_index || !verified_execution_topology {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "plan_fidelity_verification_incomplete",
            "Plan-fidelity receipt is missing one or more required verification surfaces.",
        );
    }

    let state = if reason_codes.is_empty() {
        String::from("pass")
    } else if stale_binding {
        String::from("stale")
    } else {
        String::from("invalid")
    };

    PlanFidelityGateReport {
        state,
        receipt_path: receipt_path_string,
        reviewer_stage: provenance.review_stage.clone(),
        provenance_source: provenance.reviewer_source.clone(),
        verified_requirement_index,
        verified_execution_topology,
        reason_codes,
        diagnostics,
    }
}

pub fn parse_plan_source(path: &Path, source: String) -> Result<PlanDocument, DiagnosticError> {
    let workflow_state = parse_required_header(&source, "Workflow State")?;
    validate_plan_workflow_state(&workflow_state)?;
    let plan_revision = parse_required_header(&source, "Plan Revision")?
        .parse::<u32>()
        .map_err(|_| missing_header("Plan Revision"))?;
    let execution_mode = parse_required_header(&source, "Execution Mode")?;
    validate_plan_execution_mode(&execution_mode)?;
    let source_spec_path =
        RepoPath::parse(parse_required_header(&source, "Source Spec")?.trim_matches('`'))
            .map(|path| path.as_str().to_owned())
            .map_err(|_| missing_header("Source Spec"))?;
    let source_spec_revision = parse_required_header(&source, "Source Spec Revision")?
        .parse::<u32>()
        .map_err(|_| missing_header("Source Spec Revision"))?;
    let last_reviewed_by = parse_required_header(&source, "Last Reviewed By")?;
    validate_plan_last_reviewed_by(&last_reviewed_by)?;
    let coverage_matrix = parse_coverage_matrix(&source)?;
    let tasks = parse_tasks(&source)?;

    Ok(PlanDocument {
        path: repo_relative_string(path),
        workflow_state,
        plan_revision,
        execution_mode,
        source_spec_path,
        source_spec_revision,
        last_reviewed_by,
        coverage_matrix,
        tasks,
        source,
    })
}

fn parse_required_header(source: &str, header: &str) -> Result<String, DiagnosticError> {
    headers::parse_required_header(source, header).ok_or_else(|| missing_header(header))
}

fn validate_plan_workflow_state(workflow_state: &str) -> Result<(), DiagnosticError> {
    match workflow_state {
        "Draft" | "Engineering Approved" => Ok(()),
        _ => Err(malformed_header("Workflow State")),
    }
}

fn validate_plan_execution_mode(execution_mode: &str) -> Result<(), DiagnosticError> {
    match execution_mode {
        "none" | "featureforge:executing-plans" | "featureforge:subagent-driven-development" => {
            Ok(())
        }
        _ => Err(malformed_header("Execution Mode")),
    }
}

fn validate_plan_last_reviewed_by(last_reviewed_by: &str) -> Result<(), DiagnosticError> {
    match last_reviewed_by {
        "writing-plans" | "plan-eng-review" => Ok(()),
        _ => Err(malformed_header("Last Reviewed By")),
    }
}

fn parse_coverage_matrix(source: &str) -> Result<BTreeMap<String, Vec<u32>>, DiagnosticError> {
    let mut in_matrix = false;
    let mut coverage = BTreeMap::new();

    for line in source.lines() {
        if line == "## Requirement Coverage Matrix" {
            in_matrix = true;
            continue;
        }
        if in_matrix && line.starts_with("## ") {
            break;
        }
        if !in_matrix {
            continue;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let Some(rest) = trimmed.strip_prefix("- ") else {
            continue;
        };
        let (requirement_id, task_list) = rest.split_once(" -> ").ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Malformed coverage matrix entry: {trimmed}"),
            )
        })?;
        let tasks = task_list
            .trim_start_matches("Task ")
            .split(", Task ")
            .map(|task| {
                task.parse::<u32>().map_err(|_| {
                    DiagnosticError::new(
                        FailureClass::InstructionParseFailed,
                        format!("Malformed coverage task number: {task}"),
                    )
                })
            })
            .collect::<Result<Vec<_>, _>>()?;
        coverage.insert(requirement_id.to_owned(), tasks);
    }

    Ok(coverage)
}

fn parse_tasks(source: &str) -> Result<Vec<PlanTask>, DiagnosticError> {
    let task_chunks = source
        .split("\n## Task ")
        .skip(1)
        .map(|chunk| format!("## Task {chunk}"))
        .collect::<Vec<_>>();

    task_chunks
        .into_iter()
        .map(|chunk| parse_task_chunk(&chunk))
        .collect()
}

fn parse_task_chunk(chunk: &str) -> Result<PlanTask, DiagnosticError> {
    let mut lines = chunk.lines();
    let heading = lines.next().ok_or_else(|| missing_header("Task heading"))?;
    let heading = heading
        .strip_prefix("## Task ")
        .ok_or_else(|| missing_header("Task heading"))?;
    let (number, title) = heading
        .split_once(": ")
        .ok_or_else(|| missing_header("Task heading"))?;

    let block = lines.collect::<Vec<_>>();
    let spec_coverage = parse_csv_field(&block, "Spec Coverage")?;
    let task_outcome = parse_scalar_field(&block, "Task Outcome")?;
    let plan_constraints = parse_bullets_after_field(&block, "Plan Constraints");
    let open_questions = parse_scalar_field(&block, "Open Questions")?;
    let files = parse_file_entries(&block)?;
    let steps = parse_steps(&block)?;

    Ok(PlanTask {
        number: number
            .parse::<u32>()
            .map_err(|_| missing_header("Task number"))?,
        title: title.to_owned(),
        spec_coverage,
        task_outcome,
        plan_constraints,
        open_questions,
        files,
        steps,
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

fn parse_csv_field(lines: &[&str], field: &str) -> Result<Vec<String>, DiagnosticError> {
    Ok(parse_scalar_field(lines, field)?
        .split(", ")
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
        .collect())
}

fn parse_bullets_after_field(lines: &[&str], field: &str) -> Vec<String> {
    let target = format!("**{field}:**");
    let mut collecting = false;
    let mut values = Vec::new();
    for line in lines {
        if *line == target {
            collecting = true;
            continue;
        }
        if collecting && line.starts_with("**") {
            break;
        }
        if collecting {
            let trimmed = line.trim();
            if let Some(value) = trimmed.strip_prefix("- ") {
                values.push(value.to_owned());
            }
        }
    }
    values
}

fn parse_file_entries(lines: &[&str]) -> Result<Vec<TaskFileEntry>, DiagnosticError> {
    let mut collecting = false;
    let mut files = Vec::new();

    for line in lines {
        if *line == "**Files:**" {
            collecting = true;
            continue;
        }
        if collecting && is_plan_step_prefix(line.trim()) {
            break;
        }
        if !collecting {
            continue;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let Some(rest) = trimmed.strip_prefix("- ") else {
            continue;
        };
        let (action, path) = rest.split_once(": ").ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Malformed files block entry: {trimmed}"),
            )
        })?;
        match action {
            "Create" | "Modify" | "Delete" | "Test" => {}
            _ => {
                return Err(DiagnosticError::new(
                    FailureClass::InstructionParseFailed,
                    format!("Malformed files block entry: {trimmed}"),
                ));
            }
        }
        if !(path.starts_with('`') && path.ends_with('`')) {
            return Err(DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Malformed files block entry: {trimmed}"),
            ));
        }
        let normalized = RepoPath::parse(path.trim_matches('`')).map_err(|_| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Malformed files block entry: {trimmed}"),
            )
        })?;
        files.push(TaskFileEntry {
            action: action.to_owned(),
            path: normalized.as_str().to_owned(),
        });
    }

    Ok(files)
}

fn parse_steps(lines: &[&str]) -> Result<Vec<PlanStep>, DiagnosticError> {
    let mut steps = Vec::new();
    for line in lines {
        let Some((number, text)) = parse_plan_step_line(line.trim())? else {
            continue;
        };
        steps.push(PlanStep { number, text });
    }
    Ok(steps)
}

fn is_plan_step_prefix(line: &str) -> bool {
    let Some(rest) = line.strip_prefix("- [") else {
        return false;
    };
    let Some(mark) = rest.chars().next() else {
        return false;
    };
    if mark != 'x' && mark != ' ' {
        return false;
    }
    let rest = &rest[mark.len_utf8()..];
    rest.starts_with("] **Step ")
}

fn parse_plan_step_line(line: &str) -> Result<Option<(u32, String)>, DiagnosticError> {
    if !is_plan_step_prefix(line) {
        return Ok(None);
    }
    let rest = line
        .strip_prefix("- [")
        .expect("step prefix should be present after is_plan_step_prefix");
    let mark = rest
        .chars()
        .next()
        .expect("step mark should be present after is_plan_step_prefix");
    let rest = &rest[mark.len_utf8()..];
    let rest = rest
        .strip_prefix("] **Step ")
        .expect("step body should be present after is_plan_step_prefix");
    let (number, text) = rest.split_once(": ").ok_or_else(|| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Malformed step entry: {line}"),
        )
    })?;
    Ok(Some((
        number
            .parse::<u32>()
            .map_err(|_| missing_header("Step number"))?,
        text.trim_end_matches("**").to_owned(),
    )))
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum ExecutionDirectiveKind {
    Serial,
    Parallel,
    Last,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ExecutionDirective {
    kind: ExecutionDirectiveKind,
    tasks: Vec<u32>,
    dependencies: Vec<u32>,
    reason: String,
    ownership_tasks: BTreeSet<u32>,
    declared_worktrees: Option<usize>,
}

pub(crate) fn analyze_execution_topology(
    source: &str,
    task_scopes: &[(u32, Vec<String>)],
) -> ExecutionTopologyAnalysis {
    let mut diagnostics = Vec::new();
    let mut reason_codes = Vec::new();
    let task_numbers = task_scopes
        .iter()
        .map(|(number, _)| *number)
        .collect::<Vec<_>>();
    let execution_strategy = markdown_section(source, "Execution Strategy");
    let execution_strategy_present = execution_strategy.is_some();
    let dependency_diagram = markdown_section(source, "Dependency Diagram");
    let dependency_diagram_present = dependency_diagram.is_some();

    if !execution_strategy_present {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "missing_execution_strategy",
            "Plans must include a canonical Execution Strategy section.",
        );
    }
    if !dependency_diagram_present {
        push_diagnostic(
            &mut diagnostics,
            &mut reason_codes,
            "missing_dependency_diagram",
            "Plans must include a canonical Dependency Diagram section.",
        );
    }

    let mut serial_hazards_resolved = true;
    let mut parallel_lane_ownership_valid = true;
    let mut parallel_workspace_isolation_valid = true;
    let mut parallel_worktree_groups = Vec::new();
    let mut parallel_worktree_requirements = Vec::new();
    let mut task_assignment = BTreeMap::new();
    let mut dependencies: BTreeMap<u32, BTreeSet<u32>> = task_numbers
        .iter()
        .map(|task| (*task, BTreeSet::new()))
        .collect();
    let mut expected_dependency_edges = BTreeSet::new();
    let task_scope_index = task_scopes
        .iter()
        .map(|(task, scopes)| (*task, scopes.iter().cloned().collect::<BTreeSet<_>>()))
        .collect::<BTreeMap<_, _>>();

    let directives = execution_strategy
        .as_ref()
        .map(|section| {
            parse_execution_strategy_directives(section, &mut diagnostics, &mut reason_codes)
        })
        .unwrap_or_default();

    for directive in &directives {
        let mut sorted_tasks = directive.tasks.clone();
        sorted_tasks.sort_unstable();
        sorted_tasks.dedup();
        for task in &sorted_tasks {
            if !task_numbers.contains(task) {
                push_diagnostic(
                    &mut diagnostics,
                    &mut reason_codes,
                    "execution_topology_unknown_task",
                    &format!(
                        "Execution Strategy references Task {} but the task does not exist in the plan.",
                        task
                    ),
                );
                continue;
            }
            if task_assignment
                .insert(*task, directive.kind.clone())
                .is_some()
            {
                push_diagnostic(
                    &mut diagnostics,
                    &mut reason_codes,
                    "execution_topology_duplicate_task",
                    &format!("Execution Strategy assigns Task {} more than once.", task),
                );
            }
        }

        match directive.kind {
            ExecutionDirectiveKind::Serial => {
                if directive.reason.trim().is_empty() {
                    serial_hazards_resolved = false;
                    push_diagnostic(
                        &mut diagnostics,
                        &mut reason_codes,
                        "serial_execution_needs_reason",
                        &format!(
                            "Serialized work for Task {} must include an explicit reason.",
                            sorted_tasks.first().copied().unwrap_or_default()
                        ),
                    );
                }
                if let Some(first) = sorted_tasks.first().copied() {
                    dependencies
                        .entry(first)
                        .or_default()
                        .extend(directive.dependencies.iter().copied());
                    for dependency in &directive.dependencies {
                        expected_dependency_edges.insert((*dependency, first));
                    }
                }
                for pair in sorted_tasks.windows(2) {
                    dependencies.entry(pair[1]).or_default().insert(pair[0]);
                    expected_dependency_edges.insert((pair[0], pair[1]));
                }
            }
            ExecutionDirectiveKind::Parallel => {
                let required_worktrees = sorted_tasks.len();
                let declared_worktrees = directive.declared_worktrees.unwrap_or_default();
                if directive.declared_worktrees != Some(required_worktrees) {
                    parallel_workspace_isolation_valid = false;
                    push_diagnostic(
                        &mut diagnostics,
                        &mut reason_codes,
                        "parallel_workspace_isolation_mismatch",
                        &format!(
                            "Parallel execution groups must declare one isolated worktree per task; Tasks {:?} declare {} worktree(s) but require {}.",
                            sorted_tasks, declared_worktrees, required_worktrees
                        ),
                    );
                }
                let expected_tasks = sorted_tasks.iter().copied().collect::<BTreeSet<_>>();
                if directive.ownership_tasks != expected_tasks {
                    parallel_lane_ownership_valid = false;
                    push_diagnostic(
                        &mut diagnostics,
                        &mut reason_codes,
                        "parallel_lane_missing_ownership",
                        "Parallel execution groups must declare a lane-ownership bullet for every task in the group.",
                    );
                }
                parallel_worktree_groups.push(sorted_tasks.clone());
                parallel_worktree_requirements.push(ParallelWorktreeRequirement {
                    tasks: sorted_tasks.clone(),
                    declared_worktrees,
                    required_worktrees,
                });
                for task in sorted_tasks {
                    dependencies
                        .entry(task)
                        .or_default()
                        .extend(directive.dependencies.iter().copied());
                    for dependency in &directive.dependencies {
                        expected_dependency_edges.insert((*dependency, task));
                    }
                }
            }
            ExecutionDirectiveKind::Last => {
                if directive.reason.trim().is_empty() {
                    serial_hazards_resolved = false;
                    push_diagnostic(
                        &mut diagnostics,
                        &mut reason_codes,
                        "serial_execution_needs_reason",
                        &format!(
                            "Serialized work for Task {} must include an explicit reason.",
                            sorted_tasks.first().copied().unwrap_or_default()
                        ),
                    );
                }
                if let Some(task) = sorted_tasks.first().copied()
                    && task != *task_numbers.last().unwrap_or(&task)
                {
                    serial_hazards_resolved = false;
                    push_diagnostic(
                        &mut diagnostics,
                        &mut reason_codes,
                        "last_execution_not_final_task",
                        &format!(
                            "`Execute Task {} last` is only valid for the numerically final task in the plan.",
                            task
                        ),
                    );
                }
            }
        }
    }

    for task in &task_numbers {
        if !task_assignment.contains_key(task) {
            push_diagnostic(
                &mut diagnostics,
                &mut reason_codes,
                "execution_topology_missing_task_coverage",
                &format!(
                    "Execution Strategy does not assign Task {} to a serial or parallel execution directive.",
                    task
                ),
            );
        }
    }

    for directive in &directives {
        if !matches!(directive.kind, ExecutionDirectiveKind::Last) {
            continue;
        }
        let Some(task) = directive.tasks.first().copied() else {
            continue;
        };
        let prior_tasks = task_numbers
            .iter()
            .copied()
            .filter(|candidate| *candidate != task)
            .collect::<BTreeSet<_>>();
        let mut sink_tasks = prior_tasks.clone();
        for (from, to) in &expected_dependency_edges {
            if prior_tasks.contains(from) && prior_tasks.contains(to) {
                sink_tasks.remove(from);
            }
        }
        for dependency in sink_tasks {
            dependencies.entry(task).or_default().insert(dependency);
            expected_dependency_edges.insert((dependency, task));
        }
    }

    for directive in &directives {
        let mut sorted_tasks = directive.tasks.clone();
        sorted_tasks.sort_unstable();
        sorted_tasks.dedup();
        match directive.kind {
            ExecutionDirectiveKind::Serial => {
                let seam_justified = reason_names_reintegration_seam(&directive.reason)
                    && directive.dependencies.iter().any(|dependency| {
                        task_assignment
                            .get(dependency)
                            .is_some_and(|kind| *kind == ExecutionDirectiveKind::Parallel)
                    });
                let objectively_justified = if sorted_tasks.len() > 1 {
                    sorted_tasks
                        .windows(2)
                        .all(|pair| tasks_share_write_scope(&task_scope_index, pair[0], pair[1]))
                        || seam_justified
                } else if let Some(task) = sorted_tasks.first().copied() {
                    !directive.dependencies.is_empty()
                        || expected_dependency_edges
                            .iter()
                            .any(|(dependency, _)| *dependency == task)
                } else {
                    false
                };
                if !objectively_justified {
                    serial_hazards_resolved = false;
                    push_diagnostic(
                        &mut diagnostics,
                        &mut reason_codes,
                        "serial_execution_unproven",
                        &format!(
                            "Serialized work for Task {} must prove a real hazard through dependency edges or overlapping write scope; prose-only serialization is not allowed.",
                            sorted_tasks.first().copied().unwrap_or_default()
                        ),
                    );
                }
            }
            ExecutionDirectiveKind::Parallel | ExecutionDirectiveKind::Last => {}
        }
    }

    let dependency_closure = transitive_dependencies(&dependencies);
    if let Some(diagram) = dependency_diagram {
        match parse_dependency_diagram_edges(&diagram) {
            Some(edges) => {
                if edges != expected_dependency_edges {
                    push_diagnostic(
                        &mut diagnostics,
                        &mut reason_codes,
                        "dependency_diagram_mismatch",
                        "Dependency Diagram does not express the dependency edges claimed by Execution Strategy.",
                    );
                }
            }
            None => {
                push_diagnostic(
                    &mut diagnostics,
                    &mut reason_codes,
                    "malformed_dependency_diagram",
                    "Dependency Diagram must be parseable and machine-checkable.",
                );
            }
        }
    }
    for overlap in overlapping_scopes(task_scopes) {
        let mut unordered_conflict = false;
        for left_index in 0..overlap.tasks.len() {
            for right_index in left_index + 1..overlap.tasks.len() {
                let left = overlap.tasks[left_index];
                let right = overlap.tasks[right_index];
                let ordered = dependency_closure
                    .get(&left)
                    .is_some_and(|deps| deps.contains(&right))
                    || dependency_closure
                        .get(&right)
                        .is_some_and(|deps| deps.contains(&left));
                if !ordered {
                    unordered_conflict = true;
                    break;
                }
            }
            if unordered_conflict {
                break;
            }
        }
        if unordered_conflict {
            push_diagnostic(
                &mut diagnostics,
                &mut reason_codes,
                "parallel_hotspot_conflict",
                &format!(
                    "Execution Strategy leaves hotspot path {} unordered across tasks {:?}.",
                    overlap.path, overlap.tasks
                ),
            );
        }
    }

    let execution_topology_valid = diagnostics.is_empty();

    ExecutionTopologyAnalysis {
        execution_strategy_present,
        dependency_diagram_present,
        execution_topology_valid,
        serial_hazards_resolved,
        parallel_lane_ownership_valid,
        parallel_workspace_isolation_valid,
        parallel_worktree_groups,
        parallel_worktree_requirements,
        reason_codes,
        diagnostics,
    }
}

fn markdown_section(source: &str, heading: &str) -> Option<String> {
    let target = format!("## {heading}");
    let mut in_section = false;
    let mut lines = Vec::new();
    for line in source.lines() {
        if !in_section {
            if line == target {
                in_section = true;
            }
            continue;
        }
        if line.starts_with("## ") {
            break;
        }
        lines.push(line);
    }
    let content = lines.join("\n").trim().to_owned();
    (!content.is_empty()).then_some(content)
}

fn parse_dependency_diagram_edges(section: &str) -> Option<BTreeSet<(u32, u32)>> {
    let diagram = extract_fenced_text(section).unwrap_or_else(|| section.to_owned());
    let lines = diagram.lines().collect::<Vec<_>>();
    let width = lines
        .iter()
        .map(|line| line.chars().count())
        .max()
        .unwrap_or(0);
    if width == 0 {
        return None;
    }
    let grid = lines
        .iter()
        .map(|line| {
            let mut chars = line.chars().collect::<Vec<_>>();
            chars.resize(width, ' ');
            chars
        })
        .collect::<Vec<_>>();
    let nodes = diagram_nodes(&lines);
    if nodes.is_empty() {
        return None;
    }
    let mut edges = BTreeSet::new();
    for node in &nodes {
        for start in dependency_starts(node, &grid) {
            follow_dependency_edges(node, start, &grid, &nodes, &mut edges);
        }
    }
    Some(edges)
}

fn extract_fenced_text(section: &str) -> Option<String> {
    let mut in_fence = false;
    let mut lines = Vec::new();
    for line in section.lines() {
        if line.trim_start().starts_with("```") {
            if in_fence {
                break;
            }
            in_fence = true;
            continue;
        }
        if in_fence {
            lines.push(line);
        }
    }
    (!lines.is_empty()).then_some(lines.join("\n"))
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct DiagramNode {
    task: u32,
    row: usize,
    start: usize,
    end: usize,
}

fn diagram_nodes(lines: &[&str]) -> Vec<DiagramNode> {
    let mut nodes = Vec::new();
    for (row, line) in lines.iter().enumerate() {
        let chars = line.chars().collect::<Vec<_>>();
        let mut index = 0;
        while index + 5 <= chars.len() {
            if chars[index..].starts_with(&['T', 'a', 's', 'k', ' ']) {
                let number_start = index + 5;
                let mut number_end = number_start;
                while number_end < chars.len() && chars[number_end].is_ascii_digit() {
                    number_end += 1;
                }
                if number_end > number_start {
                    if let Ok(task) = chars[number_start..number_end]
                        .iter()
                        .collect::<String>()
                        .parse::<u32>()
                    {
                        nodes.push(DiagramNode {
                            task,
                            row,
                            start: index,
                            end: number_end.saturating_sub(1),
                        });
                    }
                    index = number_end;
                    continue;
                }
            }
            index += 1;
        }
    }
    nodes
}

fn dependency_starts(node: &DiagramNode, grid: &[Vec<char>]) -> Vec<(usize, usize)> {
    let mut starts = Vec::new();
    if let Some(row) = grid.get(node.row) {
        for (col, ch) in row.iter().enumerate().skip(node.end + 1) {
            if *ch == ' ' {
                continue;
            }
            if is_dependency_connector(*ch) {
                starts.push((node.row, col));
            }
            break;
        }
    }
    let max_row = usize::min(node.row + 4, grid.len().saturating_sub(1));
    for (row_index, row) in grid.iter().enumerate().take(max_row + 1).skip(node.row + 1) {
        for (col, ch) in row.iter().enumerate().take(node.end + 1).skip(node.start) {
            if is_dependency_connector(*ch) {
                starts.push((row_index, col));
            }
        }
        if !starts.is_empty() {
            break;
        }
    }
    starts.sort_unstable();
    starts.dedup();
    starts
}

fn follow_dependency_edges(
    source: &DiagramNode,
    start: (usize, usize),
    grid: &[Vec<char>],
    nodes: &[DiagramNode],
    edges: &mut BTreeSet<(u32, u32)>,
) {
    let mut queue = vec![start];
    let mut seen = BTreeSet::new();
    while let Some((row, col)) = queue.pop() {
        if !seen.insert((row, col)) {
            continue;
        }
        let ch = grid[row][col];
        if !is_dependency_connector(ch) {
            continue;
        }
        for target in nodes {
            if target.task == source.task {
                continue;
            }
            if row + 1 == target.row && col >= target.start && col <= target.end {
                edges.insert((source.task, target.task));
            }
            if row == target.row && col + 2 >= target.start && col <= target.start {
                edges.insert((source.task, target.task));
            }
        }
        for (next_row, next_col) in dependency_neighbors(row, col, ch, grid) {
            queue.push((next_row, next_col));
        }
    }
}

fn dependency_neighbors(
    row: usize,
    col: usize,
    ch: char,
    grid: &[Vec<char>],
) -> Vec<(usize, usize)> {
    let mut neighbors = Vec::new();
    let last_col = grid[row].len().saturating_sub(1);
    match ch {
        '|' => {
            if row + 1 < grid.len() && is_dependency_connector(grid[row + 1][col]) {
                neighbors.push((row + 1, col));
            }
        }
        '-' => {
            if col > 0 && is_dependency_connector(grid[row][col - 1]) {
                neighbors.push((row, col - 1));
            }
            if col < last_col && is_dependency_connector(grid[row][col + 1]) {
                neighbors.push((row, col + 1));
            }
        }
        '+' => {
            if row + 1 < grid.len() && is_dependency_connector(grid[row + 1][col]) {
                neighbors.push((row + 1, col));
            }
            if col > 0 && is_dependency_connector(grid[row][col - 1]) {
                neighbors.push((row, col - 1));
            }
            if col < last_col && is_dependency_connector(grid[row][col + 1]) {
                neighbors.push((row, col + 1));
            }
        }
        'v' => {
            if row + 1 < grid.len() && is_dependency_connector(grid[row + 1][col]) {
                neighbors.push((row + 1, col));
            }
        }
        '>' => {
            if col < last_col && is_dependency_connector(grid[row][col + 1]) {
                neighbors.push((row, col + 1));
            }
        }
        _ => {}
    }
    neighbors
}

fn is_dependency_connector(ch: char) -> bool {
    matches!(ch, '|' | '-' | '+' | 'v' | '>')
}

fn parse_execution_strategy_directives(
    section: &str,
    diagnostics: &mut Vec<ContractDiagnostic>,
    reason_codes: &mut Vec<String>,
) -> Vec<ExecutionDirective> {
    let lines = section.lines().collect::<Vec<_>>();
    let mut directives = Vec::new();
    let mut index = 0;
    while index < lines.len() {
        let line = lines[index];
        let trimmed = line.trim_end();
        if trimmed.is_empty() {
            index += 1;
            continue;
        }
        if !trimmed.starts_with("- ") {
            index += 1;
            continue;
        }
        if trimmed.starts_with("- Execute ") {
            match parse_execute_directive(trimmed) {
                Some(directive) => directives.push(directive),
                None => push_diagnostic(
                    diagnostics,
                    reason_codes,
                    "malformed_execution_strategy",
                    "Execution Strategy contains an unparseable Execute directive.",
                ),
            }
            index += 1;
            continue;
        }
        if trimmed.starts_with("- After ") {
            match parse_parallel_directive(&lines, index) {
                Some((directive, consumed)) => {
                    directives.push(directive);
                    index += consumed;
                }
                None => {
                    push_diagnostic(
                        diagnostics,
                        reason_codes,
                        "malformed_execution_strategy",
                        "Execution Strategy contains an unparseable parallel directive.",
                    );
                    index += 1;
                }
            }
            continue;
        }
        index += 1;
    }
    directives
}

fn parse_execute_directive(line: &str) -> Option<ExecutionDirective> {
    let body = line.trim_start_matches("- Execute ").trim_end();
    if body.contains(" serially") {
        let (head, reason) = split_head_and_reason(body);
        let (tasks_part, dependencies_part) =
            if let Some((tasks, deps)) = head.split_once(" after ") {
                (tasks, deps)
            } else {
                (head, "")
            };
        let tasks = extract_numbers(tasks_part);
        if tasks.is_empty() {
            return None;
        }
        return Some(ExecutionDirective {
            kind: ExecutionDirectiveKind::Serial,
            tasks,
            dependencies: extract_numbers(dependencies_part),
            reason,
            ownership_tasks: BTreeSet::new(),
            declared_worktrees: None,
        });
    }
    if body.contains(" last") {
        let normalized = body.trim_end_matches('.');
        let tasks = extract_numbers(normalized);
        if tasks.len() != 1 {
            return None;
        }
        let reason = normalized
            .split_once(" last")
            .map(|(_, rest)| rest.trim().trim_start_matches('.').trim().to_owned())
            .unwrap_or_default();
        return Some(ExecutionDirective {
            kind: ExecutionDirectiveKind::Last,
            tasks,
            dependencies: Vec::new(),
            reason,
            ownership_tasks: BTreeSet::new(),
            declared_worktrees: None,
        });
    }
    None
}

fn parse_parallel_directive(
    lines: &[&str],
    start_index: usize,
) -> Option<(ExecutionDirective, usize)> {
    let line = lines.get(start_index)?.trim_end();
    let body = line.trim_start_matches("- After ").trim_end_matches(':');
    let (dependency_part, rest) = body.split_once(", ")?;
    let (workspace_part, run_part) = rest.split_once(" and run ")?;
    let (task_part, _) = run_part.split_once(" in parallel")?;
    let tasks = extract_numbers(task_part);
    if tasks.is_empty() {
        return None;
    }
    let task_count = tasks.len();

    let mut ownership_tasks = BTreeSet::new();
    let mut consumed = 1;
    for nested in lines.iter().skip(start_index + 1) {
        if nested.trim().is_empty() {
            consumed += 1;
            continue;
        }
        if nested.starts_with("  - Task ") {
            if let Some(task) = parse_ownership_task(nested.trim()) {
                ownership_tasks.insert(task);
            }
            consumed += 1;
            continue;
        }
        break;
    }

    Some((
        ExecutionDirective {
            kind: ExecutionDirectiveKind::Parallel,
            tasks,
            dependencies: extract_numbers(dependency_part),
            reason: String::new(),
            ownership_tasks,
            declared_worktrees: parse_declared_worktree_count(workspace_part, task_count),
        },
        consumed,
    ))
}

fn parse_ownership_task(line: &str) -> Option<u32> {
    let rest = line.strip_prefix("- Task ")?;
    let (number, _) = rest.split_once(" owns ")?;
    number.parse::<u32>().ok()
}

fn parse_declared_worktree_count(workspace_part: &str, task_count: usize) -> Option<usize> {
    let normalized = workspace_part.to_ascii_lowercase();
    if normalized.contains("per task")
        && (normalized.contains("worktree") || normalized.contains("worktrees"))
    {
        return Some(task_count);
    }
    let tokens = workspace_part
        .split_whitespace()
        .map(|token| token.trim_matches(|ch: char| !ch.is_ascii_alphanumeric()))
        .filter(|token| !token.is_empty())
        .collect::<Vec<_>>();
    for (index, token) in tokens.iter().enumerate() {
        let Some(count) = parse_count_token(token) else {
            continue;
        };
        let window_end = usize::min(index + 3, tokens.len());
        if tokens[index + 1..window_end]
            .iter()
            .any(|candidate| matches!(*candidate, "worktree" | "worktrees"))
        {
            return Some(count);
        }
    }
    None
}

fn parse_count_token(token: &str) -> Option<usize> {
    match token.to_ascii_lowercase().as_str() {
        "one" => Some(1),
        "two" => Some(2),
        "three" => Some(3),
        "four" => Some(4),
        "five" => Some(5),
        "six" => Some(6),
        "seven" => Some(7),
        "eight" => Some(8),
        "nine" => Some(9),
        "ten" => Some(10),
        _ => token.parse::<usize>().ok(),
    }
}

fn split_head_and_reason(body: &str) -> (&str, String) {
    if let Some((head, reason)) = body.split_once(". ") {
        return (
            head.trim_end_matches('.'),
            reason.trim().trim_end_matches('.').to_owned(),
        );
    }
    (body.trim_end_matches('.'), String::new())
}

fn extract_numbers(value: &str) -> Vec<u32> {
    let mut numbers = Vec::new();
    let mut current = String::new();
    for ch in value.chars() {
        if ch.is_ascii_digit() {
            current.push(ch);
        } else if !current.is_empty() {
            if let Ok(number) = current.parse::<u32>() {
                numbers.push(number);
            }
            current.clear();
        }
    }
    if !current.is_empty()
        && let Ok(number) = current.parse::<u32>()
    {
        numbers.push(number);
    }
    numbers
}

fn transitive_dependencies(direct: &BTreeMap<u32, BTreeSet<u32>>) -> BTreeMap<u32, BTreeSet<u32>> {
    direct
        .keys()
        .copied()
        .map(|task| {
            (
                task,
                collect_dependencies(task, direct, &mut BTreeSet::new()),
            )
        })
        .collect()
}

fn collect_dependencies(
    task: u32,
    direct: &BTreeMap<u32, BTreeSet<u32>>,
    seen: &mut BTreeSet<u32>,
) -> BTreeSet<u32> {
    let mut collected = BTreeSet::new();
    for dependency in direct.get(&task).into_iter().flatten().copied() {
        if !seen.insert(dependency) {
            continue;
        }
        collected.insert(dependency);
        collected.extend(collect_dependencies(dependency, direct, seen));
    }
    collected
}

fn overlapping_scopes(task_scopes: &[(u32, Vec<String>)]) -> Vec<OverlappingWriteScope> {
    let mut index: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    for (task, scopes) in task_scopes {
        for scope in scopes {
            index.entry(scope.clone()).or_default().push(*task);
        }
    }
    index
        .into_iter()
        .filter_map(|(path, mut tasks)| {
            tasks.sort_unstable();
            tasks.dedup();
            (tasks.len() > 1).then_some(OverlappingWriteScope { path, tasks })
        })
        .collect()
}

fn tasks_share_write_scope(
    task_scope_index: &BTreeMap<u32, BTreeSet<String>>,
    left: u32,
    right: u32,
) -> bool {
    let Some(left_scopes) = task_scope_index.get(&left) else {
        return false;
    };
    let Some(right_scopes) = task_scope_index.get(&right) else {
        return false;
    };
    left_scopes.iter().any(|scope| right_scopes.contains(scope))
}

fn reason_names_reintegration_seam(reason: &str) -> bool {
    let normalized = reason.to_ascii_lowercase();
    normalized.contains("reintegration")
        || normalized.contains("integration seam")
        || normalized.contains("merge-back")
        || normalized.contains("merge back")
        || normalized.contains("shared glue")
        || normalized.contains("integration risk")
        || normalized.contains("cannot be isolated")
}

fn detect_overlapping_write_scopes(tasks: &[PlanTask]) -> Vec<OverlappingWriteScope> {
    let mut index: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    for task in tasks {
        for file in &task.files {
            if file.action == "Test" {
                continue;
            }
            index
                .entry(file.path.clone())
                .or_default()
                .push(task.number);
        }
    }
    index
        .into_iter()
        .filter_map(|(path, mut tasks)| {
            tasks.sort_unstable();
            tasks.dedup();
            (tasks.len() > 1).then_some(OverlappingWriteScope { path, tasks })
        })
        .collect()
}

fn push_diagnostic(
    diagnostics: &mut Vec<ContractDiagnostic>,
    reason_codes: &mut Vec<String>,
    code: &str,
    message: &str,
) {
    diagnostics.push(ContractDiagnostic {
        code: code.to_owned(),
        message: message.to_owned(),
    });
    reason_codes.push(code.to_owned());
}

fn malformed_header(header: &str) -> DiagnosticError {
    DiagnosticError::new(
        FailureClass::InstructionParseFailed,
        format!("{header} header is missing or malformed."),
    )
}

fn merge_plan_fidelity_gate(report: &mut AnalyzePlanReport, gate: &PlanFidelityGateReport) {
    if gate.state == "pass" || gate.state == "not_applicable" {
        return;
    }
    report.contract_state = String::from("invalid");
    for code in &gate.reason_codes {
        if !report.reason_codes.iter().any(|existing| existing == code) {
            report.reason_codes.push(code.clone());
        }
    }
    for diagnostic in &gate.diagnostics {
        if report
            .diagnostics
            .iter()
            .any(|existing| existing.code == diagnostic.code)
        {
            continue;
        }
        report.diagnostics.push(diagnostic.clone());
    }
}

pub fn plan_fidelity_receipt_path_for_repo(repo_root: &Path) -> PathBuf {
    let state_dir = featureforge_state_dir();
    let slug_identity = discover_slug_identity(repo_root);
    let branch_root = harness_branch_root(
        &state_dir,
        &slug_identity.repo_slug,
        &slug_identity.branch_name,
    )
    .parent()
    .map(Path::to_path_buf)
    .unwrap_or_else(|| {
        harness_branch_root(
            &state_dir,
            &slug_identity.repo_slug,
            &slug_identity.branch_name,
        )
    });
    branch_root
        .join("workflow")
        .join("plan-fidelity-receipt.json")
}

fn repo_root_for_artifact_paths<'a>(spec_path: &'a Path, plan_path: &'a Path) -> &'a Path {
    for ancestor in plan_path.ancestors() {
        if ancestor.join("docs/featureforge").is_dir() || ancestor.join(".git").is_dir() {
            return ancestor;
        }
    }
    spec_path
        .parent()
        .or_else(|| plan_path.parent())
        .unwrap_or_else(|| Path::new("."))
}

fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

fn missing_header(header: &str) -> DiagnosticError {
    DiagnosticError::new(
        FailureClass::InstructionParseFailed,
        format!("Missing or malformed {header}."),
    )
}
