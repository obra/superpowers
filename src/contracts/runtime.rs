use std::collections::{BTreeMap, BTreeSet};
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use jiff::Timestamp;
use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::cli::plan_contract::{
    AnalyzePlanArgs, BuildTaskPacketArgs, LintArgs, PacketOutputFormat, PersistMode,
};
use crate::contracts::plan::{AnalyzePlanReport, ContractDiagnostic, OverlappingWriteScope};
use crate::diagnostics::{DiagnosticError, FailureClass, JsonFailure};
use crate::git::discover_slug_identity;
use crate::paths::{
    normalize_identifier_token, normalize_repo_relative_path, normalize_whitespace,
    superpowers_state_dir,
};

const AMBIGUOUS_PHRASES: &[&str] = &[
    "if needed",
    "as appropriate",
    "handle edge cases",
    "clean up related code",
    "support similar behavior",
    "or equivalent",
    "use a reasonable default",
    "consider adding",
    "if useful",
    "etc.",
];

#[derive(Debug, Clone)]
struct IndexedRequirement {
    id: String,
    kind: String,
    statement: String,
    normalized_lower: String,
}

#[derive(Debug, Clone)]
struct SpecContract {
    requirements: Vec<IndexedRequirement>,
    requirement_index: BTreeMap<String, usize>,
}

#[derive(Debug, Clone)]
struct PlanHeaders {
    plan_revision: u32,
    source_spec_path: String,
    source_spec_revision: u32,
}

#[derive(Debug, Clone)]
struct ParsedFileEntry {
    action: String,
    path: String,
    normalized_path: String,
}

#[derive(Debug, Clone)]
struct ParsedTask {
    number: u32,
    title: String,
    block: String,
    spec_coverage_ids: Vec<String>,
    plan_constraints: Vec<String>,
    open_questions: String,
    file_entries: Vec<ParsedFileEntry>,
    file_scope: Vec<String>,
    steps_raw: Vec<String>,
}

#[derive(Debug, Clone)]
struct ParsedPlan {
    tasks: Vec<ParsedTask>,
}

#[derive(Debug, Clone)]
struct LooseTask {
    number: u32,
    block: String,
    spec_coverage_raw: String,
    open_questions: String,
}

#[derive(Debug, Clone)]
struct HeaderError {
    reason_code: String,
    message: String,
}

#[derive(Debug, Clone)]
struct TaskParseError {
    error_class: String,
    message: String,
}

#[derive(Debug, Clone)]
struct LintContractError {
    error_class: String,
    message: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RequirementIndexState {
    Malformed,
    Missing,
    Unexpected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CoverageMatrixState {
    Malformed,
    Missing,
    Unexpected,
}

#[derive(Debug, Clone)]
struct CoverageMatrix {
    entries: BTreeMap<String, Vec<u32>>,
}

#[derive(Debug, Clone, Serialize)]
struct LintFailure {
    status: String,
    error_class: String,
    message: String,
    spec_path: String,
    plan_path: String,
    errors: Vec<ContractDiagnostic>,
    warnings: Vec<ContractDiagnostic>,
}

#[derive(Debug, Clone, Serialize)]
struct LintSuccess {
    status: String,
    errors: Vec<ContractDiagnostic>,
    warnings: Vec<ContractDiagnostic>,
    spec_requirement_count: usize,
    plan_task_count: usize,
    coverage: BTreeMap<String, Vec<u32>>,
}

#[derive(Debug, Clone, Serialize)]
struct RequirementStatement {
    id: String,
    #[serde(rename = "type")]
    kind: String,
    statement: String,
}

#[derive(Debug, Clone, Serialize)]
struct PacketFileEntry {
    action: String,
    path: String,
    normalized_path: String,
}

#[derive(Debug, Clone, Serialize)]
struct BuildTaskPacketSuccess {
    status: String,
    plan_path: String,
    plan_revision: u32,
    plan_fingerprint: String,
    source_spec_path: String,
    source_spec_revision: u32,
    source_spec_fingerprint: String,
    task_number: u32,
    task_title: String,
    task_block: String,
    step_list: Vec<String>,
    file_entries: Vec<PacketFileEntry>,
    file_scope: Vec<String>,
    requirement_ids: Vec<String>,
    requirement_statements: Vec<RequirementStatement>,
    plan_constraints: Vec<String>,
    open_questions: String,
    packet_timestamp: String,
    packet_fingerprint: String,
    persisted: bool,
    cache_status: String,
    packet_path: Option<String>,
    packet_markdown: String,
}

#[derive(Debug, Clone)]
struct PacketCacheMetadata {
    plan_path: String,
    plan_revision: u32,
    plan_fingerprint: String,
    source_spec_path: String,
    source_spec_revision: u32,
    source_spec_fingerprint: String,
    task_number: u32,
    packet_fingerprint: String,
}

#[derive(Debug, Clone)]
struct ParsedStep {
    number: u32,
}

pub fn run_lint(args: &LintArgs) -> std::process::ExitCode {
    let spec_path = match normalize_cli_repo_path(&args.spec, "spec path") {
        Ok(path) => path,
        Err(error) => return emit_json_failure(error),
    };
    let plan_path = match normalize_cli_repo_path(&args.plan, "plan path") {
        Ok(path) => path,
        Err(error) => return emit_json_failure(error),
    };

    let repo_root = repo_root();
    let plan_abs = repo_root.join(&plan_path);
    if !plan_abs.is_file() {
        return emit_json_failure(JsonFailure::new(
            FailureClass::InstructionParseFailed,
            "PlanContractInvalid: Plan file does not exist.",
        ));
    }

    let spec_abs = repo_root.join(&spec_path);
    if !spec_abs.is_file() {
        return emit_lint_failure(
            &spec_path,
            &plan_path,
            "MissingRequirementIndex",
            "Spec file does not exist.",
        );
    }

    let plan_source = match fs::read_to_string(&plan_abs) {
        Ok(source) => source,
        Err(error) => {
            return emit_json_failure(JsonFailure::new(
                FailureClass::InstructionParseFailed,
                format!(
                    "PlanContractInvalid: Could not read plan file {}: {error}",
                    plan_abs.display()
                ),
            ));
        }
    };
    let spec_source = match fs::read_to_string(&spec_abs) {
        Ok(source) => source,
        Err(error) => {
            return emit_lint_failure(
                &spec_path,
                &plan_path,
                "MissingRequirementIndex",
                &format!("Could not read spec file {}: {error}", spec_abs.display()),
            );
        }
    };

    let headers = match parse_plan_headers(&plan_source) {
        Ok(headers) => headers,
        Err(_) => {
            return emit_lint_failure(
                &spec_path,
                &plan_path,
                "UnexpectedPlanContractFailure",
                "Plan headers are missing or malformed.",
            );
        }
    };
    if headers.source_spec_path != spec_path {
        return emit_lint_failure(
            &spec_path,
            &plan_path,
            "UnexpectedPlanContractFailure",
            "Plan Source Spec does not match the provided spec path.",
        );
    }

    match validate_contract(&spec_source, &plan_source) {
        Ok((spec, plan, matrix)) => emit_json_value(&LintSuccess {
            status: String::from("ok"),
            errors: Vec::new(),
            warnings: Vec::new(),
            spec_requirement_count: spec.requirements.len(),
            plan_task_count: plan.tasks.len(),
            coverage: matrix.entries,
        }),
        Err(error) => emit_lint_failure(&spec_path, &plan_path, &error.error_class, &error.message),
    }
}

pub fn run_analyze_plan(args: &AnalyzePlanArgs) -> std::process::ExitCode {
    let spec_path = match normalize_cli_repo_path(&args.spec, "spec path") {
        Ok(path) => path,
        Err(error) => return emit_json_failure(error),
    };
    let plan_path = match normalize_cli_repo_path(&args.plan, "plan path") {
        Ok(path) => path,
        Err(error) => return emit_json_failure(error),
    };

    let repo_root = repo_root();
    let plan_abs = repo_root.join(&plan_path);
    if !plan_abs.is_file() {
        return emit_json_failure(JsonFailure::new(
            FailureClass::InstructionParseFailed,
            "PlanContractInvalid: Plan file does not exist.",
        ));
    }
    let spec_abs = repo_root.join(&spec_path);
    if !spec_abs.is_file() {
        return emit_json_failure(JsonFailure::new(
            FailureClass::InstructionParseFailed,
            "PlanContractInvalid: Spec file does not exist.",
        ));
    }

    let plan_source = match fs::read_to_string(&plan_abs) {
        Ok(source) => source,
        Err(error) => {
            return emit_json_failure(JsonFailure::new(
                FailureClass::InstructionParseFailed,
                format!(
                    "PlanContractInvalid: Could not read plan file {}: {error}",
                    plan_abs.display()
                ),
            ));
        }
    };
    let spec_source = match fs::read_to_string(&spec_abs) {
        Ok(source) => source,
        Err(error) => {
            return emit_json_failure(JsonFailure::new(
                FailureClass::InstructionParseFailed,
                format!(
                    "PlanContractInvalid: Could not read spec file {}: {error}",
                    spec_abs.display()
                ),
            ));
        }
    };

    emit_json_value(&analyze_contract(
        &spec_path,
        &plan_path,
        &spec_source,
        &plan_source,
    ))
}

pub fn run_build_task_packet(args: &BuildTaskPacketArgs) -> std::process::ExitCode {
    let plan_path = match normalize_cli_repo_path(&args.plan, "plan path") {
        Ok(path) => path,
        Err(error) => return emit_json_failure(error),
    };

    let repo_root = repo_root();
    let plan_abs = repo_root.join(&plan_path);
    if !plan_abs.is_file() {
        return emit_json_failure(JsonFailure {
            error_class: String::from("PlanContractInvalid"),
            message: String::from("Plan file does not exist."),
        });
    }

    let plan_source = match fs::read_to_string(&plan_abs) {
        Ok(source) => source,
        Err(error) => {
            return emit_json_failure(JsonFailure {
                error_class: String::from("PlanContractInvalid"),
                message: format!("Could not read plan file {}: {error}", plan_abs.display()),
            });
        }
    };

    let headers = match parse_plan_headers(&plan_source) {
        Ok(headers) => headers,
        Err(_) => {
            return emit_json_failure(JsonFailure {
                error_class: String::from("UnsupportedPlanRevision"),
                message: String::from("Plan headers are missing or malformed."),
            });
        }
    };

    let spec_abs = repo_root.join(&headers.source_spec_path);
    if !spec_abs.is_file() {
        return emit_json_failure(JsonFailure {
            error_class: String::from("SourceSpecUnavailable"),
            message: String::from("Source spec cannot be loaded from the approved plan."),
        });
    }
    let spec_source = match fs::read_to_string(&spec_abs) {
        Ok(source) => source,
        Err(error) => {
            return emit_json_failure(JsonFailure {
                error_class: String::from("SourceSpecUnavailable"),
                message: format!("Could not read source spec {}: {error}", spec_abs.display()),
            });
        }
    };

    let (spec, plan, _) = match validate_contract(&spec_source, &plan_source) {
        Ok(values) => values,
        Err(error) => {
            return emit_json_failure(JsonFailure {
                error_class: String::from("PlanContractInvalid"),
                message: format!("{}: {}", error.error_class, error.message),
            });
        }
    };

    let Some(task) = plan.tasks.iter().find(|task| task.number == args.task) else {
        return emit_json_failure(JsonFailure {
            error_class: String::from("TaskNotFound"),
            message: format!("Task {} does not exist in the approved plan.", args.task),
        });
    };

    let plan_fingerprint = sha256_hex(plan_source.as_bytes());
    let source_spec_fingerprint = sha256_hex(spec_source.as_bytes());
    let packet_fingerprint = build_packet_fingerprint(
        &plan_path,
        headers.plan_revision,
        &plan_fingerprint,
        &headers.source_spec_path,
        headers.source_spec_revision,
        &source_spec_fingerprint,
        task,
    );
    let generated_at = Timestamp::now().to_string();
    let requirement_statements = task
        .spec_coverage_ids
        .iter()
        .filter_map(|requirement_id| {
            spec.requirement_index
                .get(requirement_id)
                .and_then(|index| spec.requirements.get(*index))
        })
        .map(|requirement| RequirementStatement {
            id: requirement.id.clone(),
            kind: requirement.kind.clone(),
            statement: requirement.statement.clone(),
        })
        .collect::<Vec<_>>();
    let packet_markdown = render_packet_markdown(
        &plan_path,
        headers.plan_revision,
        &plan_fingerprint,
        &headers.source_spec_path,
        headers.source_spec_revision,
        &source_spec_fingerprint,
        task,
        &requirement_statements,
        &generated_at,
        &packet_fingerprint,
    );

    let persisted = args.persist == PersistMode::Yes;
    let mut cache_status = String::from("ephemeral");
    let mut packet_path = None;
    if persisted {
        let path = packet_cache_path(&plan_path, args.task);
        let metadata = PacketCacheMetadata {
            plan_path: plan_path.clone(),
            plan_revision: headers.plan_revision,
            plan_fingerprint: plan_fingerprint.clone(),
            source_spec_path: headers.source_spec_path.clone(),
            source_spec_revision: headers.source_spec_revision,
            source_spec_fingerprint: source_spec_fingerprint.clone(),
            task_number: args.task,
            packet_fingerprint: packet_fingerprint.clone(),
        };
        if packet_cache_matches_current(&path, &metadata) {
            cache_status = String::from("reused");
        } else {
            cache_status = if path.is_file() {
                String::from("regenerated")
            } else {
                String::from("fresh")
            };
            if let Err(error) =
                write_packet_cache(&path, &metadata, &generated_at, &packet_markdown)
            {
                return emit_json_failure(JsonFailure {
                    error_class: String::from("TaskPacketBuildFailed"),
                    message: format!("Could not persist the task packet: {error}"),
                });
            }
        }
        if let Some(parent) = path.parent() {
            prune_packet_cache(parent, &path);
        }
        packet_path = Some(path.display().to_string());
    }

    let output = BuildTaskPacketSuccess {
        status: String::from("ok"),
        plan_path,
        plan_revision: headers.plan_revision,
        plan_fingerprint,
        source_spec_path: headers.source_spec_path,
        source_spec_revision: headers.source_spec_revision,
        source_spec_fingerprint,
        task_number: task.number,
        task_title: task.title.clone(),
        task_block: task.block.clone(),
        step_list: task.steps_raw.clone(),
        file_entries: task
            .file_entries
            .iter()
            .map(|entry| PacketFileEntry {
                action: entry.action.clone(),
                path: entry.path.clone(),
                normalized_path: entry.normalized_path.clone(),
            })
            .collect(),
        file_scope: task.file_scope.clone(),
        requirement_ids: task.spec_coverage_ids.clone(),
        requirement_statements,
        plan_constraints: task.plan_constraints.clone(),
        open_questions: task.open_questions.clone(),
        packet_timestamp: generated_at,
        packet_fingerprint,
        persisted,
        cache_status,
        packet_path,
        packet_markdown: packet_markdown.clone(),
    };

    if args.format == PacketOutputFormat::Markdown {
        println!("{packet_markdown}");
        std::process::ExitCode::SUCCESS
    } else {
        emit_json_value(&output)
    }
}

fn validate_contract(
    spec_source: &str,
    plan_source: &str,
) -> Result<(SpecContract, ParsedPlan, CoverageMatrix), LintContractError> {
    let spec = match parse_requirement_index(spec_source) {
        Ok(spec) => spec,
        Err(RequirementIndexState::Malformed) => {
            return Err(LintContractError {
                error_class: String::from("MalformedRequirementIndex"),
                message: String::from(
                    "Requirement Index is missing entries or contains malformed lines.",
                ),
            });
        }
        Err(RequirementIndexState::Missing) => {
            return Err(LintContractError {
                error_class: String::from("MissingRequirementIndex"),
                message: String::from("Spec is missing the required Requirement Index section."),
            });
        }
        Err(RequirementIndexState::Unexpected) => {
            return Err(LintContractError {
                error_class: String::from("UnexpectedPlanContractFailure"),
                message: String::from("Could not parse the source spec Requirement Index."),
            });
        }
    };

    let plan = parse_plan(plan_source).map_err(|error| LintContractError {
        error_class: error.error_class,
        message: error.message,
    })?;

    let matrix = match parse_coverage_matrix(plan_source) {
        Ok(matrix) => matrix,
        Err(CoverageMatrixState::Malformed) => {
            return Err(LintContractError {
                error_class: String::from("CoverageMatrixMismatch"),
                message: String::from("Requirement Coverage Matrix is malformed."),
            });
        }
        Err(CoverageMatrixState::Missing) => {
            return Err(LintContractError {
                error_class: String::from("MissingRequirementCoverage"),
                message: String::from("Requirement Coverage Matrix is missing or empty."),
            });
        }
        Err(CoverageMatrixState::Unexpected) => {
            return Err(LintContractError {
                error_class: String::from("UnexpectedPlanContractFailure"),
                message: String::from("Could not parse the Requirement Coverage Matrix."),
            });
        }
    };

    let mut covered = BTreeSet::new();
    for task in &plan.tasks {
        if task.spec_coverage_ids.is_empty() {
            return Err(LintContractError {
                error_class: String::from("TaskMissingSpecCoverage"),
                message: format!(
                    "Task {} must include at least one Spec Coverage id.",
                    task.number
                ),
            });
        }
        for requirement_id in &task.spec_coverage_ids {
            if !spec.requirement_index.contains_key(requirement_id) {
                return Err(LintContractError {
                    error_class: String::from("UnknownRequirementId"),
                    message: format!(
                        "Task {} references unknown requirement id {}.",
                        task.number, requirement_id
                    ),
                });
            }
            match matrix.entries.get(requirement_id) {
                Some(task_numbers) if task_numbers.contains(&task.number) => {}
                _ => {
                    return Err(LintContractError {
                        error_class: String::from("CoverageMatrixMismatch"),
                        message: format!(
                            "Coverage Matrix does not map {} to Task {}.",
                            requirement_id, task.number
                        ),
                    });
                }
            }
            covered.insert(requirement_id.clone());
        }
        if normalize_whitespace(&task.open_questions) != "none" {
            return Err(LintContractError {
                error_class: String::from("TaskOpenQuestionsNotResolved"),
                message: format!("Task {} has unresolved Open Questions.", task.number),
            });
        }
        let lower_task = task.block.to_lowercase();
        if let Some(phrase) = detect_ambiguous_task_wording(&lower_task) {
            return Err(LintContractError {
                error_class: String::from("AmbiguousTaskWording"),
                message: format!(
                    "Task {} uses ambiguous wording ('{}').",
                    task.number, phrase
                ),
            });
        }
        if let Some(message) =
            detect_requirement_weakening(&spec, task.number, &lower_task, &task.spec_coverage_ids)
        {
            return Err(LintContractError {
                error_class: String::from("RequirementWeakeningDetected"),
                message,
            });
        }
    }

    for (requirement_id, task_numbers) in &matrix.entries {
        if !spec.requirement_index.contains_key(requirement_id) {
            return Err(LintContractError {
                error_class: String::from("UnknownRequirementId"),
                message: format!(
                    "Requirement Coverage Matrix references unknown requirement id {}.",
                    requirement_id
                ),
            });
        }
        for task_number in task_numbers {
            if !plan.tasks.iter().any(|task| task.number == *task_number) {
                return Err(LintContractError {
                    error_class: String::from("CoverageMatrixMismatch"),
                    message: format!(
                        "Requirement Coverage Matrix references missing Task {}.",
                        task_number
                    ),
                });
            }
        }
    }

    for requirement in &spec.requirements {
        if !covered.contains(&requirement.id) {
            return Err(LintContractError {
                error_class: String::from("MissingRequirementCoverage"),
                message: format!("{} is not covered by any task.", requirement.id),
            });
        }
        if !matrix.entries.contains_key(&requirement.id) {
            return Err(LintContractError {
                error_class: String::from("MissingRequirementCoverage"),
                message: format!(
                    "{} is missing from the Requirement Coverage Matrix.",
                    requirement.id
                ),
            });
        }
    }

    Ok((spec, plan, matrix))
}

fn analyze_contract(
    spec_path: &str,
    plan_path: &str,
    spec_source: &str,
    plan_source: &str,
) -> AnalyzePlanReport {
    let mut report = AnalyzePlanReport {
        contract_state: String::from("invalid"),
        spec_path: spec_path.to_owned(),
        spec_revision: 0,
        spec_fingerprint: sha256_hex(spec_source.as_bytes()),
        plan_path: plan_path.to_owned(),
        plan_revision: 0,
        plan_fingerprint: sha256_hex(plan_source.as_bytes()),
        task_count: 0,
        packet_buildable_tasks: 0,
        coverage_complete: true,
        open_questions_resolved: true,
        task_structure_valid: true,
        files_blocks_valid: true,
        reason_codes: Vec::new(),
        overlapping_write_scopes: Vec::new(),
        diagnostics: Vec::new(),
    };

    match parse_spec_revision(spec_source) {
        Ok(revision) => report.spec_revision = revision,
        Err(()) => {
            report.coverage_complete = false;
            push_reason(
                &mut report,
                "missing_spec_revision",
                "Spec Revision header is missing or malformed.",
            );
        }
    }

    let headers = match parse_plan_headers(plan_source) {
        Ok(headers) => {
            report.plan_revision = headers.plan_revision;
            if headers.source_spec_path != spec_path
                || (report.spec_revision != 0
                    && headers.source_spec_revision != report.spec_revision)
            {
                push_reason(
                    &mut report,
                    "stale_spec_plan_linkage",
                    "Plan source spec linkage does not match the current approved spec.",
                );
            }
            Some(headers)
        }
        Err(error) => {
            push_reason(&mut report, &error.reason_code, &error.message);
            None
        }
    };

    let loose_tasks = parse_loose_tasks(plan_source);
    let full_plan = parse_plan(plan_source);
    match &full_plan {
        Ok(plan) => {
            report.task_count = plan.tasks.len();
            report.packet_buildable_tasks = plan.tasks.len();
        }
        Err(error) => {
            report.task_count = loose_tasks.len();
            report.packet_buildable_tasks = 0;
            if error.error_class == "MalformedFilesBlock" {
                report.files_blocks_valid = false;
                push_reason(&mut report, "malformed_files_block", &error.message);
            } else {
                report.task_structure_valid = false;
                push_reason(&mut report, "malformed_task_structure", &error.message);
            }
        }
    }

    let spec_result = match std::env::var("SUPERPOWERS_PLAN_CONTRACT_TEST_FAILPOINT") {
        Ok(value) if value == "requirement_index_unexpected_failure" => {
            Err(RequirementIndexState::Unexpected)
        }
        _ => parse_requirement_index(spec_source),
    };
    let spec = match spec_result {
        Ok(spec) => Some(spec),
        Err(RequirementIndexState::Malformed) => {
            report.coverage_complete = false;
            push_reason(
                &mut report,
                "malformed_requirement_index",
                "Requirement Index is missing entries or contains malformed lines.",
            );
            None
        }
        Err(RequirementIndexState::Missing) => {
            report.coverage_complete = false;
            push_reason(
                &mut report,
                "missing_requirement_index",
                "Spec is missing the required Requirement Index section.",
            );
            None
        }
        Err(RequirementIndexState::Unexpected) => {
            report.coverage_complete = false;
            push_reason(
                &mut report,
                "unexpected_plan_contract_failure",
                "Could not parse the source spec Requirement Index.",
            );
            None
        }
    };

    let matrix_result = match std::env::var("SUPERPOWERS_PLAN_CONTRACT_TEST_FAILPOINT") {
        Ok(value) if value == "coverage_matrix_unexpected_failure" => {
            Err(CoverageMatrixState::Unexpected)
        }
        _ => parse_coverage_matrix(plan_source),
    };
    let matrix = match matrix_result {
        Ok(matrix) => Some(matrix),
        Err(CoverageMatrixState::Malformed) => {
            report.coverage_complete = false;
            push_reason(
                &mut report,
                "coverage_matrix_mismatch",
                "Requirement Coverage Matrix is malformed.",
            );
            None
        }
        Err(CoverageMatrixState::Missing) => {
            report.coverage_complete = false;
            push_reason(
                &mut report,
                "missing_requirement_coverage",
                "Requirement Coverage Matrix is missing or empty.",
            );
            None
        }
        Err(CoverageMatrixState::Unexpected) => {
            report.coverage_complete = false;
            push_reason(
                &mut report,
                "unexpected_plan_contract_failure",
                "Could not parse the Requirement Coverage Matrix.",
            );
            None
        }
    };

    let mut task_scopes = Vec::new();
    let mut covered = BTreeSet::new();
    for task in &loose_tasks {
        if normalize_whitespace(&task.open_questions) != "none" {
            report.open_questions_resolved = false;
            push_reason(
                &mut report,
                "task_open_questions_not_resolved",
                &format!("Task {} has unresolved Open Questions.", task.number),
            );
        }

        if full_plan.is_err() {
            match parse_task_block(&task.block) {
                Ok(parsed) => {
                    report.packet_buildable_tasks += 1;
                    task_scopes.push((parsed.number, parsed.file_scope.clone()));
                }
                Err(error) => {
                    if error.error_class == "MalformedFilesBlock" {
                        report.files_blocks_valid = false;
                        push_reason(&mut report, "malformed_files_block", &error.message);
                    } else {
                        report.task_structure_valid = false;
                        push_reason(&mut report, "malformed_task_structure", &error.message);
                    }
                }
            }
        }

        if let (Some(spec), Some(matrix)) = (&spec, &matrix) {
            let coverage_ids = parse_task_coverage_ids(&task.spec_coverage_raw);
            if coverage_ids.is_empty() {
                report.coverage_complete = false;
                push_reason(
                    &mut report,
                    "task_missing_spec_coverage",
                    &format!(
                        "Task {} must include at least one Spec Coverage id.",
                        task.number
                    ),
                );
            } else {
                for requirement_id in &coverage_ids {
                    if !spec.requirement_index.contains_key(requirement_id) {
                        report.coverage_complete = false;
                        push_reason(
                            &mut report,
                            "unknown_requirement_id",
                            &format!(
                                "Task {} references unknown requirement id {}.",
                                task.number, requirement_id
                            ),
                        );
                        continue;
                    }
                    match matrix.entries.get(requirement_id) {
                        Some(task_numbers) if task_numbers.contains(&task.number) => {}
                        _ => {
                            report.coverage_complete = false;
                            push_reason(
                                &mut report,
                                "coverage_matrix_mismatch",
                                &format!(
                                    "Coverage Matrix does not map {} to Task {}.",
                                    requirement_id, task.number
                                ),
                            );
                        }
                    }
                    covered.insert(requirement_id.clone());
                }
                let lower_task = task.block.to_lowercase();
                if let Some(phrase) = detect_ambiguous_task_wording(&lower_task) {
                    push_reason(
                        &mut report,
                        "ambiguous_task_wording",
                        &format!(
                            "Task {} uses ambiguous wording ('{}').",
                            task.number, phrase
                        ),
                    );
                }
                if let Some(message) =
                    detect_requirement_weakening(spec, task.number, &lower_task, &coverage_ids)
                {
                    push_reason(&mut report, "requirement_weakening_detected", &message);
                }
            }
        }
    }

    if let (Some(spec), Some(matrix)) = (&spec, &matrix) {
        for (requirement_id, task_numbers) in &matrix.entries {
            if !spec.requirement_index.contains_key(requirement_id) {
                report.coverage_complete = false;
                push_reason(
                    &mut report,
                    "unknown_requirement_id",
                    &format!(
                        "Requirement Coverage Matrix references unknown requirement id {}.",
                        requirement_id
                    ),
                );
            }
            for task_number in task_numbers {
                if !loose_tasks.iter().any(|task| task.number == *task_number) {
                    report.coverage_complete = false;
                    push_reason(
                        &mut report,
                        "coverage_matrix_mismatch",
                        &format!(
                            "Requirement Coverage Matrix references missing Task {}.",
                            task_number
                        ),
                    );
                }
            }
        }
        for requirement in &spec.requirements {
            if !covered.contains(&requirement.id) {
                report.coverage_complete = false;
                push_reason(
                    &mut report,
                    "missing_requirement_coverage",
                    &format!("{} is not covered by any task.", requirement.id),
                );
            }
            if !matrix.entries.contains_key(&requirement.id) {
                report.coverage_complete = false;
                push_reason(
                    &mut report,
                    "missing_requirement_coverage",
                    &format!(
                        "{} is missing from the Requirement Coverage Matrix.",
                        requirement.id
                    ),
                );
            }
        }
    }

    if let Ok(plan) = full_plan {
        task_scopes = plan
            .tasks
            .iter()
            .map(|task| (task.number, task.file_scope.clone()))
            .collect();
    }
    report.overlapping_write_scopes = overlapping_scopes(&task_scopes);
    if report.reason_codes.is_empty() {
        report.contract_state = String::from("valid");
    }
    if headers.is_none() {
        report.plan_revision = 0;
    }
    report
}

pub fn analyze_contract_report(
    spec_path: &str,
    plan_path: &str,
    spec_source: &str,
    plan_source: &str,
) -> AnalyzePlanReport {
    analyze_contract(spec_path, plan_path, spec_source, plan_source)
}

fn parse_spec_revision(source: &str) -> Result<u32, ()> {
    find_header_value(source, "Spec Revision")
        .ok_or(())
        .and_then(|value| value.parse::<u32>().map_err(|_| ()))
}

fn parse_requirement_index(source: &str) -> Result<SpecContract, RequirementIndexState> {
    let revision = parse_spec_revision(source).map_err(|_| RequirementIndexState::Unexpected)?;
    let mut requirements = Vec::new();
    let mut requirement_index = BTreeMap::new();
    let mut in_index = false;
    let mut in_fence = false;
    let mut saw_index = false;

    for line in source.lines() {
        if !in_index && line.trim_start().starts_with("```") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence {
            continue;
        }
        if line == "## Requirement Index" {
            in_index = true;
            saw_index = true;
            continue;
        }
        if in_index && line.starts_with("## ") {
            break;
        }
        if !in_index {
            continue;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let Some(rest) = trimmed.strip_prefix("- [") else {
            return Err(RequirementIndexState::Malformed);
        };
        let Some((id, rest)) = rest.split_once("][") else {
            return Err(RequirementIndexState::Malformed);
        };
        let Some((kind, statement)) = rest.split_once("] ") else {
            return Err(RequirementIndexState::Malformed);
        };
        if requirement_index.contains_key(id) {
            return Err(RequirementIndexState::Malformed);
        }
        requirement_index.insert(id.to_owned(), requirements.len());
        requirements.push(IndexedRequirement {
            id: id.to_owned(),
            kind: kind.to_owned(),
            statement: statement.to_owned(),
            normalized_lower: normalize_whitespace(statement).to_lowercase(),
        });
    }

    if !saw_index {
        return Err(RequirementIndexState::Missing);
    }
    if requirements.is_empty() {
        return Err(RequirementIndexState::Malformed);
    }

    let _ = revision;
    Ok(SpecContract {
        requirements,
        requirement_index,
    })
}

fn parse_plan_headers(source: &str) -> Result<PlanHeaders, HeaderError> {
    let workflow_state =
        find_header_value(source, "Workflow State").ok_or_else(|| HeaderError {
            reason_code: String::from("missing_workflow_state"),
            message: String::from("Workflow State header is missing or malformed."),
        })?;
    match workflow_state {
        "Draft" | "Engineering Approved" => {}
        _ => {
            return Err(HeaderError {
                reason_code: String::from("invalid_workflow_state"),
                message: String::from("Workflow State header is missing or malformed."),
            });
        }
    }

    let plan_revision = find_header_value(source, "Plan Revision").ok_or_else(|| HeaderError {
        reason_code: String::from("missing_plan_revision"),
        message: String::from("Plan Revision header is missing or malformed."),
    })?;
    let plan_revision = plan_revision.parse::<u32>().map_err(|_| HeaderError {
        reason_code: String::from("missing_plan_revision"),
        message: String::from("Plan Revision header is missing or malformed."),
    })?;

    let execution_mode =
        find_header_value(source, "Execution Mode").ok_or_else(|| HeaderError {
            reason_code: String::from("missing_execution_mode"),
            message: String::from("Execution Mode header is missing or malformed."),
        })?;
    match execution_mode {
        "none" | "superpowers:executing-plans" | "superpowers:subagent-driven-development" => {}
        _ => {
            return Err(HeaderError {
                reason_code: String::from("invalid_execution_mode"),
                message: String::from("Execution Mode header is missing or malformed."),
            });
        }
    }

    let source_spec_path = find_header_value(source, "Source Spec").ok_or_else(|| HeaderError {
        reason_code: String::from("missing_source_spec"),
        message: String::from("Source Spec header is missing or malformed."),
    })?;
    if !(source_spec_path.starts_with('`') && source_spec_path.ends_with('`')) {
        return Err(HeaderError {
            reason_code: String::from("missing_source_spec"),
            message: String::from("Source Spec header is missing or malformed."),
        });
    }
    let source_spec_path = source_spec_path.trim_matches('`').to_owned();

    let source_spec_revision =
        find_header_value(source, "Source Spec Revision").ok_or_else(|| HeaderError {
            reason_code: String::from("missing_source_spec_revision"),
            message: String::from("Source Spec Revision header is missing or malformed."),
        })?;
    let source_spec_revision = source_spec_revision
        .parse::<u32>()
        .map_err(|_| HeaderError {
            reason_code: String::from("missing_source_spec_revision"),
            message: String::from("Source Spec Revision header is missing or malformed."),
        })?;

    let last_reviewed_by =
        find_header_value(source, "Last Reviewed By").ok_or_else(|| HeaderError {
            reason_code: String::from("missing_last_reviewed_by"),
            message: String::from("Last Reviewed By header is missing or malformed."),
        })?;
    match last_reviewed_by {
        "writing-plans" | "plan-eng-review" => {}
        _ => {
            return Err(HeaderError {
                reason_code: String::from("invalid_last_reviewed_by"),
                message: String::from("Last Reviewed By header is missing or malformed."),
            });
        }
    }

    Ok(PlanHeaders {
        plan_revision,
        source_spec_path,
        source_spec_revision,
    })
}

fn parse_plan(source: &str) -> Result<ParsedPlan, TaskParseError> {
    let headers = parse_plan_headers(source).map_err(|error| TaskParseError {
        error_class: String::from("MalformedTaskStructure"),
        message: error.message,
    })?;
    let tasks = parse_tasks(source)?;
    let _ = headers;
    Ok(ParsedPlan { tasks })
}

fn parse_tasks(source: &str) -> Result<Vec<ParsedTask>, TaskParseError> {
    let lines = source.lines().collect::<Vec<_>>();
    let mut tasks = Vec::new();
    let mut index = 0;
    let mut seen_numbers = BTreeSet::new();
    while index < lines.len() {
        let line = lines[index];
        if line.starts_with("### Task ") {
            return Err(TaskParseError {
                error_class: String::from("MalformedTaskStructure"),
                message: String::from("Task headings must use canonical '## Task N:' form."),
            });
        }
        if !line.starts_with("## Task ") {
            index += 1;
            continue;
        }
        let heading = line
            .strip_prefix("## Task ")
            .ok_or_else(|| TaskParseError {
                error_class: String::from("MalformedTaskStructure"),
                message: String::from("Task headings must use canonical '## Task N:' form."),
            })?;
        let (number, _) = heading.split_once(": ").ok_or_else(|| TaskParseError {
            error_class: String::from("MalformedTaskStructure"),
            message: String::from("Task headings must use canonical '## Task N:' form."),
        })?;
        let number = number.parse::<u32>().map_err(|_| TaskParseError {
            error_class: String::from("MalformedTaskStructure"),
            message: String::from("Task headings must use canonical '## Task N:' form."),
        })?;
        if !seen_numbers.insert(number) {
            return Err(TaskParseError {
                error_class: String::from("MalformedTaskStructure"),
                message: String::from("Task numbers must be unique within the plan."),
            });
        }
        let mut block = vec![line];
        index += 1;
        while index < lines.len() && !lines[index].starts_with("## Task ") {
            if lines[index].starts_with("### Task ") {
                return Err(TaskParseError {
                    error_class: String::from("MalformedTaskStructure"),
                    message: String::from("Task headings must use canonical '## Task N:' form."),
                });
            }
            block.push(lines[index]);
            index += 1;
        }
        tasks.push(parse_task_block(&block.join("\n"))?);
    }
    Ok(tasks)
}

fn parse_task_block(block: &str) -> Result<ParsedTask, TaskParseError> {
    let lines = block.lines().collect::<Vec<_>>();
    let heading = lines.first().copied().ok_or_else(|| TaskParseError {
        error_class: String::from("MalformedTaskStructure"),
        message: String::from("Plan task structure is malformed."),
    })?;
    let heading = heading
        .strip_prefix("## Task ")
        .ok_or_else(|| TaskParseError {
            error_class: String::from("MalformedTaskStructure"),
            message: String::from("Task headings must use canonical '## Task N:' form."),
        })?;
    let (number, title) = heading.split_once(": ").ok_or_else(|| TaskParseError {
        error_class: String::from("MalformedTaskStructure"),
        message: String::from("Task headings must use canonical '## Task N:' form."),
    })?;
    let number = number.parse::<u32>().map_err(|_| TaskParseError {
        error_class: String::from("MalformedTaskStructure"),
        message: String::from("Task headings must use canonical '## Task N:' form."),
    })?;

    let mut spec_coverage_raw = None;
    let mut task_outcome = None;
    let mut plan_constraints = Vec::new();
    let mut open_questions = None;
    let mut file_entries = Vec::new();
    let mut file_scope = Vec::new();
    let mut steps_raw = Vec::new();
    let mut step_numbers = BTreeSet::new();
    let mut in_constraints = false;
    let mut in_files = false;
    let mut files_seen = false;

    for line in &lines[1..] {
        let normalized = normalize_whitespace(line);
        if in_constraints {
            if let Some(constraint) = line.strip_prefix("- ") {
                plan_constraints.push(constraint.to_owned());
                continue;
            }
            if normalized.is_empty() {
                continue;
            }
            in_constraints = false;
        }

        if in_files {
            if normalized.is_empty() {
                continue;
            }
            if is_step_line(line) {
                in_files = false;
            } else {
                if let Some(file_entry) = parse_file_entry(line, number)? {
                    file_scope.push(file_entry.normalized_path.clone());
                    file_entries.push(file_entry);
                    continue;
                }
                return Err(TaskParseError {
                    error_class: String::from("MalformedFilesBlock"),
                    message: format!("Task {} contains a malformed Files block.", number),
                });
            }
        }

        if let Some(value) = line.strip_prefix("**Spec Coverage:** ") {
            spec_coverage_raw = Some(value.to_owned());
            continue;
        }
        if let Some(value) = line.strip_prefix("**Task Outcome:** ") {
            task_outcome = Some(value.to_owned());
            continue;
        }
        if *line == "**Plan Constraints:**" {
            in_constraints = true;
            continue;
        }
        if let Some(value) = line.strip_prefix("**Open Questions:** ") {
            open_questions = Some(value.to_owned());
            continue;
        }
        if *line == "**Files:**" {
            files_seen = true;
            in_files = true;
            continue;
        }
        if let Some(step) = parse_step_line(line) {
            if !files_seen {
                return Err(TaskParseError {
                    error_class: String::from("MalformedTaskStructure"),
                    message: format!("Task {} steps must appear after a Files block.", number),
                });
            }
            if !step_numbers.insert(step.number) {
                return Err(TaskParseError {
                    error_class: String::from("MalformedTaskStructure"),
                    message: format!("Task {} has duplicate Step {}.", number, step.number),
                });
            }
            steps_raw.push((*line).to_owned());
        }
    }

    let spec_coverage_raw = spec_coverage_raw.ok_or_else(|| TaskParseError {
        error_class: String::from("TaskMissingSpecCoverage"),
        message: format!("Task {} is missing Spec Coverage.", number),
    })?;
    if task_outcome.is_none() {
        return Err(TaskParseError {
            error_class: String::from("MalformedTaskStructure"),
            message: format!("Task {} is missing Task Outcome.", number),
        });
    }
    if plan_constraints.is_empty() {
        return Err(TaskParseError {
            error_class: String::from("MalformedTaskStructure"),
            message: format!("Task {} is missing Plan Constraints.", number),
        });
    }
    let open_questions = open_questions.ok_or_else(|| TaskParseError {
        error_class: String::from("MalformedTaskStructure"),
        message: format!("Task {} is missing Open Questions.", number),
    })?;
    if !files_seen || file_entries.is_empty() {
        return Err(TaskParseError {
            error_class: String::from("MalformedFilesBlock"),
            message: format!("Task {} is missing a parseable Files block.", number),
        });
    }
    if steps_raw.is_empty() {
        return Err(TaskParseError {
            error_class: String::from("MalformedTaskStructure"),
            message: format!("Task {} must include at least one step.", number),
        });
    }

    Ok(ParsedTask {
        number,
        title: title.to_owned(),
        block: block.to_owned(),
        spec_coverage_ids: parse_task_coverage_ids(&spec_coverage_raw),
        plan_constraints,
        open_questions,
        file_entries,
        file_scope,
        steps_raw,
    })
}

fn parse_loose_tasks(source: &str) -> Vec<LooseTask> {
    let mut tasks = Vec::new();
    let mut current_number = None;
    let mut current_block = Vec::new();
    let mut current_spec_coverage = String::new();
    let mut current_open_questions = String::new();

    for line in source.lines() {
        if let Some(rest) = line.strip_prefix("## Task ") {
            if let Some(number) = current_number.take() {
                tasks.push(LooseTask {
                    number,
                    block: current_block.join("\n"),
                    spec_coverage_raw: std::mem::take(&mut current_spec_coverage),
                    open_questions: std::mem::take(&mut current_open_questions),
                });
                current_block.clear();
            }
            current_number = rest
                .split_once(": ")
                .and_then(|(number, _)| number.parse::<u32>().ok());
        }
        if current_number.is_some() {
            current_block.push(line);
            if let Some(value) = line.strip_prefix("**Spec Coverage:** ") {
                current_spec_coverage = value.to_owned();
            } else if let Some(value) = line.strip_prefix("**Open Questions:** ") {
                current_open_questions = value.to_owned();
            }
        }
    }

    if let Some(number) = current_number {
        tasks.push(LooseTask {
            number,
            block: current_block.join("\n"),
            spec_coverage_raw: current_spec_coverage,
            open_questions: current_open_questions,
        });
    }

    tasks
}

fn parse_file_entry(
    line: &str,
    task_number: u32,
) -> Result<Option<ParsedFileEntry>, TaskParseError> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    let Some(rest) = trimmed.strip_prefix("- ") else {
        return Ok(None);
    };
    let Some((action, value)) = rest.split_once(": ") else {
        return Err(TaskParseError {
            error_class: String::from("MalformedFilesBlock"),
            message: format!("Task {} contains a malformed Files block.", task_number),
        });
    };
    match action {
        "Create" | "Modify" | "Delete" | "Test" => {}
        _ => {
            return Err(TaskParseError {
                error_class: String::from("MalformedFilesBlock"),
                message: format!("Task {} contains a malformed Files block.", task_number),
            });
        }
    }
    if !(value.starts_with('`') && value.ends_with('`')) {
        return Err(TaskParseError {
            error_class: String::from("MalformedFilesBlock"),
            message: format!("Task {} contains a malformed Files block.", task_number),
        });
    }
    let path = value.trim_matches('`').to_owned();
    let normalized_path = normalize_scope_path(&path).map_err(|_| TaskParseError {
        error_class: String::from("MalformedFilesBlock"),
        message: format!("Task {} contains an invalid Files entry path.", task_number),
    })?;
    Ok(Some(ParsedFileEntry {
        action: action.to_owned(),
        path,
        normalized_path,
    }))
}

fn parse_step_line(line: &str) -> Option<ParsedStep> {
    let trimmed = line.trim();
    let rest = trimmed
        .strip_prefix("- [ ] **Step ")
        .or_else(|| trimmed.strip_prefix("- [x] **Step "))?;
    let (number, _) = rest.split_once(": ")?;
    Some(ParsedStep {
        number: number.parse::<u32>().ok()?,
    })
}

fn is_step_line(line: &str) -> bool {
    line.trim_start().starts_with("- [ ] **Step ") || line.trim_start().starts_with("- [x] **Step ")
}

fn parse_coverage_matrix(source: &str) -> Result<CoverageMatrix, CoverageMatrixState> {
    let mut in_matrix = false;
    let mut entries = BTreeMap::new();
    let mut saw_matrix = false;

    for line in source.lines() {
        if line == "## Requirement Coverage Matrix" {
            in_matrix = true;
            saw_matrix = true;
            continue;
        }
        if in_matrix && line.starts_with("## ") {
            break;
        }
        if !in_matrix {
            continue;
        }
        let normalized = normalize_whitespace(line);
        if normalized.is_empty() {
            continue;
        }
        let Some(rest) = normalized.strip_prefix("- ") else {
            return Err(CoverageMatrixState::Malformed);
        };
        let Some((requirement_id, task_list)) = rest.split_once(" -> ") else {
            return Err(CoverageMatrixState::Malformed);
        };
        if !is_requirement_id(requirement_id) {
            return Err(CoverageMatrixState::Malformed);
        }
        let mut seen = BTreeSet::new();
        let mut task_numbers = Vec::new();
        for item in task_list.split(", ") {
            let Some(task_number) = item.strip_prefix("Task ") else {
                return Err(CoverageMatrixState::Malformed);
            };
            let task_number = task_number
                .parse::<u32>()
                .map_err(|_| CoverageMatrixState::Malformed)?;
            if !seen.insert(task_number) {
                return Err(CoverageMatrixState::Malformed);
            }
            task_numbers.push(task_number);
        }
        entries.insert(requirement_id.to_owned(), task_numbers);
    }

    if !saw_matrix || entries.is_empty() {
        return Err(CoverageMatrixState::Missing);
    }
    Ok(CoverageMatrix { entries })
}

fn parse_task_coverage_ids(raw: &str) -> Vec<String> {
    let mut seen = BTreeSet::new();
    let mut values = Vec::new();
    for item in raw.split(',') {
        let normalized = normalize_whitespace(item);
        if normalized.is_empty() || !seen.insert(normalized.clone()) {
            continue;
        }
        values.push(normalized);
    }
    values
}

fn detect_ambiguous_task_wording(lower_task: &str) -> Option<&'static str> {
    AMBIGUOUS_PHRASES
        .iter()
        .copied()
        .find(|phrase| lower_task.contains(phrase))
}

fn detect_requirement_weakening(
    spec: &SpecContract,
    task_number: u32,
    lower_task: &str,
    coverage_ids: &[String],
) -> Option<String> {
    for requirement_id in coverage_ids {
        let index = *spec.requirement_index.get(requirement_id)?;
        let requirement = spec.requirements.get(index)?;
        if requirement.normalized_lower.contains(" must ") {
            let weakened = requirement.normalized_lower.replace(" must ", " should ");
            if lower_task.contains(&weakened) {
                return Some(format!(
                    "Task {} weakens {} from 'must' to 'should'.",
                    task_number, requirement_id
                ));
            }
        }
        if requirement.normalized_lower.contains(" must not ") {
            let weakened = requirement
                .normalized_lower
                .replace(" must not ", " should not ");
            if lower_task.contains(&weakened) {
                return Some(format!(
                    "Task {} weakens {} from 'must not' to 'should not'.",
                    task_number, requirement_id
                ));
            }
        }
        if lower_task.contains(" should ") {
            for token in extract_backtick_tokens(&requirement.statement) {
                let anchor = normalize_whitespace(&token).to_lowercase();
                if !anchor.is_empty() && lower_task.contains(&anchor) {
                    return Some(format!(
                        "Task {} weakens {} by downgrading requirement force around {}.",
                        task_number, requirement_id, token
                    ));
                }
            }
        }
    }
    None
}

fn extract_backtick_tokens(text: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut rest = text;
    while let Some(start) = rest.find('`') {
        let tail = &rest[start + 1..];
        let Some(end) = tail.find('`') else {
            break;
        };
        let token = &tail[..end];
        if !token.is_empty() {
            tokens.push(format!("`{token}`"));
        }
        rest = &tail[end + 1..];
    }
    tokens
}

fn build_packet_fingerprint(
    plan_path: &str,
    plan_revision: u32,
    plan_fingerprint: &str,
    source_spec_path: &str,
    source_spec_revision: u32,
    source_spec_fingerprint: &str,
    task: &ParsedTask,
) -> String {
    let mut body = String::new();
    body.push_str(&format!("plan_path={plan_path}\n"));
    body.push_str(&format!("plan_revision={plan_revision}\n"));
    body.push_str(&format!("plan_fingerprint={plan_fingerprint}\n"));
    body.push_str(&format!("source_spec_path={source_spec_path}\n"));
    body.push_str(&format!("source_spec_revision={source_spec_revision}\n"));
    body.push_str(&format!(
        "source_spec_fingerprint={source_spec_fingerprint}\n"
    ));
    body.push_str(&format!("task_number={}\n", task.number));
    body.push_str(&format!("task_title={}\n", task.title));
    body.push_str("coverage=");
    body.push_str(&task.spec_coverage_ids.join("\n"));
    body.push('\n');
    body.push_str("constraints=");
    body.push_str(&task.plan_constraints.join("\n"));
    body.push('\n');
    body.push_str(&task.block);
    sha256_hex(body.as_bytes())
}

fn render_packet_markdown(
    plan_path: &str,
    plan_revision: u32,
    plan_fingerprint: &str,
    source_spec_path: &str,
    source_spec_revision: u32,
    source_spec_fingerprint: &str,
    task: &ParsedTask,
    requirement_statements: &[RequirementStatement],
    generated_at: &str,
    packet_fingerprint: &str,
) -> String {
    let mut markdown = String::new();
    markdown.push_str("## Task Packet\n\n");
    markdown.push_str(&format!("**Plan Path:** `{plan_path}`\n"));
    markdown.push_str(&format!("**Plan Revision:** {plan_revision}\n"));
    markdown.push_str(&format!("**Plan Fingerprint:** `{plan_fingerprint}`\n"));
    markdown.push_str(&format!("**Source Spec Path:** `{source_spec_path}`\n"));
    markdown.push_str(&format!(
        "**Source Spec Revision:** {source_spec_revision}\n"
    ));
    markdown.push_str(&format!(
        "**Source Spec Fingerprint:** `{source_spec_fingerprint}`\n"
    ));
    markdown.push_str(&format!("**Task Number:** {}\n", task.number));
    markdown.push_str(&format!("**Task Title:** {}\n", task.title));
    markdown.push_str(&format!("**Open Questions:** {}\n", task.open_questions));
    markdown.push_str(&format!("**Packet Fingerprint:** `{packet_fingerprint}`\n"));
    markdown.push_str(&format!("**Generated At:** {generated_at}\n\n"));
    markdown.push_str("## Covered Requirements\n\n");
    for requirement in requirement_statements {
        markdown.push_str(&format!(
            "- [{}][{}] {}\n",
            requirement.id, requirement.kind, requirement.statement
        ));
    }
    markdown.push_str("\n## Plan Constraints\n\n");
    for constraint in &task.plan_constraints {
        markdown.push_str(&format!("- {constraint}\n"));
    }
    markdown.push_str("\n## Task Block\n\n");
    markdown.push_str(&task.block);
    markdown.push('\n');
    markdown
}

fn packet_cache_path(plan_path: &str, task_number: u32) -> PathBuf {
    let base = Path::new(plan_path)
        .file_stem()
        .and_then(OsStr::to_str)
        .unwrap_or("plan");
    let safe_base = normalize_identifier_token(base);
    let slug = discover_slug_identity(&std::env::current_dir().unwrap_or_else(|_| repo_root()));
    state_dir()
        .join("projects")
        .join(slug.repo_slug)
        .join(format!(
            "{}-{}-task-packets",
            current_username(),
            slug.safe_branch
        ))
        .join(format!("{safe_base}-task-{task_number}.packet.md"))
}

fn packet_cache_matches_current(path: &Path, metadata: &PacketCacheMetadata) -> bool {
    let Ok(source) = fs::read_to_string(path) else {
        return false;
    };
    let mut values = BTreeMap::new();
    for line in source.lines() {
        if line == "---" {
            break;
        }
        let Some((key, value)) = line.split_once('=') else {
            return false;
        };
        values.insert(key.to_owned(), value.to_owned());
    }
    values.get("plan_path") == Some(&metadata.plan_path)
        && values.get("plan_revision") == Some(&metadata.plan_revision.to_string())
        && values.get("plan_fingerprint") == Some(&metadata.plan_fingerprint)
        && values.get("source_spec_path") == Some(&metadata.source_spec_path)
        && values.get("source_spec_revision") == Some(&metadata.source_spec_revision.to_string())
        && values.get("source_spec_fingerprint") == Some(&metadata.source_spec_fingerprint)
        && values.get("task_number") == Some(&metadata.task_number.to_string())
        && values.get("packet_fingerprint") == Some(&metadata.packet_fingerprint)
}

fn write_packet_cache(
    path: &Path,
    metadata: &PacketCacheMetadata,
    generated_at: &str,
    packet_markdown: &str,
) -> std::io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut body = String::new();
    body.push_str(&format!("plan_path={}\n", metadata.plan_path));
    body.push_str(&format!("plan_revision={}\n", metadata.plan_revision));
    body.push_str(&format!("plan_fingerprint={}\n", metadata.plan_fingerprint));
    body.push_str(&format!("source_spec_path={}\n", metadata.source_spec_path));
    body.push_str(&format!(
        "source_spec_revision={}\n",
        metadata.source_spec_revision
    ));
    body.push_str(&format!(
        "source_spec_fingerprint={}\n",
        metadata.source_spec_fingerprint
    ));
    body.push_str(&format!("task_number={}\n", metadata.task_number));
    body.push_str(&format!(
        "packet_fingerprint={}\n",
        metadata.packet_fingerprint
    ));
    body.push_str(&format!("generated_at={generated_at}\n"));
    body.push_str("---\n");
    body.push_str(packet_markdown);
    fs::write(path, body)
}

fn prune_packet_cache(packet_dir: &Path, current_packet: &Path) {
    let mut limit = std::env::var("SUPERPOWERS_PLAN_PACKET_RETENTION")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .unwrap_or(20);
    if limit == 0 {
        limit = 20;
    }
    let Ok(read_dir) = fs::read_dir(packet_dir) else {
        return;
    };
    let mut packets = read_dir
        .filter_map(Result::ok)
        .filter(|entry| {
            entry
                .path()
                .file_name()
                .and_then(OsStr::to_str)
                .is_some_and(|name| name.ends_with(".packet.md"))
        })
        .map(|entry| {
            let modified = entry
                .metadata()
                .and_then(|metadata| metadata.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH);
            (entry.path(), modified)
        })
        .collect::<Vec<_>>();
    packets.sort_by(|left, right| right.1.cmp(&left.1));
    let current_is_present = packets.iter().any(|(path, _)| path == current_packet);
    let keep_others = if current_is_present {
        limit.saturating_sub(1)
    } else {
        limit
    };
    let mut kept_others = 0usize;
    for (path, _) in packets {
        if path == current_packet {
            continue;
        }
        if kept_others < keep_others {
            kept_others += 1;
            continue;
        }
        let _ = fs::remove_file(path);
    }
}

fn overlapping_scopes(task_scopes: &[(u32, Vec<String>)]) -> Vec<OverlappingWriteScope> {
    let mut index = BTreeMap::<String, Vec<u32>>::new();
    for (task_number, scopes) in task_scopes {
        for scope in scopes {
            index.entry(scope.clone()).or_default().push(*task_number);
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

fn push_reason(report: &mut AnalyzePlanReport, code: &str, message: &str) {
    if !report.reason_codes.iter().any(|existing| existing == code) {
        report.reason_codes.push(code.to_owned());
    }
    if !report
        .diagnostics
        .iter()
        .any(|diagnostic| diagnostic.code == code)
    {
        report.diagnostics.push(ContractDiagnostic {
            code: code.to_owned(),
            message: message.to_owned(),
        });
    }
}

fn find_header_value<'a>(source: &'a str, header: &str) -> Option<&'a str> {
    let prefix = format!("**{header}:** ");
    source.lines().find_map(|line| line.strip_prefix(&prefix))
}

fn normalize_cli_repo_path(raw: &str, label: &str) -> Result<String, JsonFailure> {
    normalize_repo_relative_path(raw).map_err(|_| JsonFailure {
        error_class: String::from("InvalidCommandInput"),
        message: format!("{label} must be a normalized repo-relative path."),
    })
}

fn normalize_scope_path(raw: &str) -> Result<String, DiagnosticError> {
    normalize_repo_relative_path(&strip_file_reference_suffix(raw))
}

fn strip_file_reference_suffix(raw: &str) -> String {
    let mut value = raw.to_owned();
    loop {
        let bytes = value.as_bytes();
        let mut end = bytes.len();
        while end > 0 && bytes[end - 1].is_ascii_digit() {
            end -= 1;
        }
        if end == bytes.len() || end == 0 {
            break;
        }
        let separator = bytes[end - 1];
        if separator != b':' && separator != b'-' {
            break;
        }
        value.truncate(end - 1);
    }
    value
}

fn is_requirement_id(value: &str) -> bool {
    let Some((prefix, suffix)) = value.split_once('-') else {
        return false;
    };
    !prefix.is_empty()
        && prefix.chars().all(|ch| ch.is_ascii_uppercase())
        && !suffix.is_empty()
        && suffix.chars().all(|ch| ch.is_ascii_digit())
}

fn emit_json_value<T: Serialize>(value: &T) -> std::process::ExitCode {
    match serde_json::to_string(value) {
        Ok(json) => {
            println!("{json}");
            std::process::ExitCode::SUCCESS
        }
        Err(error) => {
            eprintln!(
                "{{\"error_class\":\"InstructionParseFailed\",\"message\":\"Could not serialize JSON output: {error}\"}}"
            );
            std::process::ExitCode::from(1)
        }
    }
}

fn emit_lint_failure(
    spec_path: &str,
    plan_path: &str,
    error_class: &str,
    message: &str,
) -> std::process::ExitCode {
    let failure = LintFailure {
        status: String::from("invalid"),
        error_class: error_class.to_owned(),
        message: message.to_owned(),
        spec_path: spec_path.to_owned(),
        plan_path: plan_path.to_owned(),
        errors: vec![ContractDiagnostic {
            code: error_class.to_owned(),
            message: message.to_owned(),
        }],
        warnings: Vec::new(),
    };
    match serde_json::to_string(&failure) {
        Ok(json) => {
            eprintln!("{json}");
            std::process::ExitCode::from(1)
        }
        Err(error) => {
            eprintln!(
                "{{\"error_class\":\"InstructionParseFailed\",\"message\":\"Could not serialize lint failure: {error}\"}}"
            );
            std::process::ExitCode::from(1)
        }
    }
}

fn emit_json_failure(error: JsonFailure) -> std::process::ExitCode {
    match serde_json::to_string(&error) {
        Ok(json) => {
            eprintln!("{json}");
            std::process::ExitCode::from(1)
        }
        Err(serialize_error) => {
            eprintln!(
                "{{\"error_class\":\"InstructionParseFailed\",\"message\":\"Could not serialize error output: {serialize_error}\"}}"
            );
            std::process::ExitCode::from(1)
        }
    }
}

fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

fn repo_root() -> PathBuf {
    std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

fn state_dir() -> PathBuf {
    superpowers_state_dir()
}

fn current_username() -> String {
    std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| String::from("user"))
}
