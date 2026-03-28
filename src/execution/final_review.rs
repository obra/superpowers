use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use crate::diagnostics::{FailureClass, JsonFailure};
use crate::execution::leases::load_status_authoritative_overlay_checked;
use crate::execution::state::ExecutionContext;
use crate::git::sha256_hex;
use crate::paths::harness_authoritative_artifacts_dir;

#[derive(Debug, Default, Clone)]
pub(crate) struct ArtifactDocument {
    pub(crate) title: Option<String>,
    pub(crate) headers: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FinalReviewReceipt {
    pub title: Option<String>,
    pub review_stage: Option<String>,
    pub reviewer_provenance: Option<String>,
    pub reviewer_source: Option<String>,
    pub reviewer_id: Option<String>,
    pub reviewer_artifact_path: Option<String>,
    pub reviewer_artifact_fingerprint: Option<String>,
    pub distinct_from_stages: Vec<String>,
    pub source_plan: Option<String>,
    pub source_plan_revision: Option<u32>,
    pub strategy_checkpoint_fingerprint: Option<String>,
    pub branch: Option<String>,
    pub repo: Option<String>,
    pub base_branch: Option<String>,
    pub head_sha: Option<String>,
    pub result: Option<String>,
    pub generated_by: Option<String>,
    pub recorded_execution_deviations: Option<String>,
    pub deviation_review_verdict: Option<String>,
}

#[derive(Debug, Clone, Copy)]
struct ReviewerArtifactExpectations<'a> {
    expected_plan_path: &'a str,
    expected_plan_revision: u32,
    expected_strategy_checkpoint_fingerprint: Option<&'a str>,
    expected_branch: &'a str,
    expected_repo: &'a str,
    expected_head_sha: &'a str,
    expected_base_branch: &'a str,
    expected_deviation_record: &'a str,
    expected_deviation_verdict: &'a str,
}

#[derive(Debug, Clone, Copy)]
pub struct FinalReviewReceiptExpectations<'a> {
    pub expected_plan_path: &'a str,
    pub expected_plan_revision: u32,
    pub expected_strategy_checkpoint_fingerprint: Option<&'a str>,
    pub expected_head_sha: &'a str,
    pub expected_base_branch: &'a str,
    pub deviations_required: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FinalReviewReceiptIssue {
    ReviewStageMismatch,
    ReviewerProvenanceMissing,
    ReviewerIdentityMissing,
    ReviewerSourceNotIndependent,
    ReviewerArtifactPathMissing,
    ReviewerArtifactUnreadable,
    ReviewerArtifactNotRuntimeOwned,
    ReviewerArtifactFingerprintInvalid,
    ReviewerArtifactFingerprintMismatch,
    ReviewerArtifactIdentityMismatch,
    ReviewerArtifactContractMismatch,
    DistinctFromStagesMissing,
    DistinctFromStagesInvalid,
    SourcePlanMismatch,
    SourcePlanRevisionMismatch,
    StrategyCheckpointFingerprintMissing,
    StrategyCheckpointFingerprintMismatch,
    HeadMismatch,
    ResultNotPass,
    GeneratedByMismatch,
    DeviationRecordMismatch,
    DeviationReviewVerdictMismatch,
}

impl FinalReviewReceiptIssue {
    pub fn reason_code(self) -> &'static str {
        match self {
            Self::ReviewStageMismatch => "review_receipt_stage_mismatch",
            Self::ReviewerProvenanceMissing => "review_receipt_not_dedicated",
            Self::ReviewerIdentityMissing => "review_receipt_reviewer_identity_missing",
            Self::ReviewerSourceNotIndependent => "review_receipt_reviewer_source_not_independent",
            Self::ReviewerArtifactPathMissing => "review_receipt_reviewer_artifact_path_missing",
            Self::ReviewerArtifactUnreadable => "review_receipt_reviewer_artifact_unreadable",
            Self::ReviewerArtifactNotRuntimeOwned => {
                "review_receipt_reviewer_artifact_not_runtime_owned"
            }
            Self::ReviewerArtifactFingerprintInvalid => {
                "review_receipt_reviewer_fingerprint_invalid"
            }
            Self::ReviewerArtifactFingerprintMismatch => {
                "review_receipt_reviewer_fingerprint_mismatch"
            }
            Self::ReviewerArtifactIdentityMismatch => "review_receipt_reviewer_identity_mismatch",
            Self::ReviewerArtifactContractMismatch => {
                "review_receipt_reviewer_artifact_contract_mismatch"
            }
            Self::DistinctFromStagesMissing => "review_receipt_distinct_from_stages_missing",
            Self::DistinctFromStagesInvalid => "review_receipt_distinct_from_stages_invalid",
            Self::SourcePlanMismatch => "review_receipt_plan_mismatch",
            Self::SourcePlanRevisionMismatch => "review_receipt_plan_revision_mismatch",
            Self::StrategyCheckpointFingerprintMissing => {
                "review_receipt_strategy_checkpoint_fingerprint_missing"
            }
            Self::StrategyCheckpointFingerprintMismatch => {
                "review_receipt_strategy_checkpoint_fingerprint_mismatch"
            }
            Self::HeadMismatch => "review_receipt_head_mismatch",
            Self::ResultNotPass => "review_receipt_result_not_pass",
            Self::GeneratedByMismatch => "review_receipt_generator_mismatch",
            Self::DeviationRecordMismatch => "review_receipt_deviation_record_mismatch",
            Self::DeviationReviewVerdictMismatch => "review_receipt_deviation_verdict_mismatch",
        }
    }

    pub fn message(self) -> &'static str {
        match self {
            Self::ReviewStageMismatch => {
                "The latest code-review artifact does not prove the dedicated final-review stage."
            }
            Self::ReviewerProvenanceMissing => {
                "The latest code-review artifact does not prove dedicated-independent reviewer provenance."
            }
            Self::ReviewerIdentityMissing => {
                "The latest code-review artifact is missing dedicated reviewer identity headers."
            }
            Self::ReviewerSourceNotIndependent => {
                "The latest code-review artifact reviewer source is not an approved independent reviewer source."
            }
            Self::ReviewerArtifactPathMissing => {
                "The latest code-review artifact is missing a dedicated reviewer artifact path."
            }
            Self::ReviewerArtifactUnreadable => {
                "The latest code-review artifact does not point at a readable dedicated reviewer artifact."
            }
            Self::ReviewerArtifactNotRuntimeOwned => {
                "The latest code-review artifact reviewer path is outside runtime-owned project artifacts."
            }
            Self::ReviewerArtifactFingerprintInvalid => {
                "The latest code-review artifact is missing a canonical dedicated reviewer artifact fingerprint."
            }
            Self::ReviewerArtifactFingerprintMismatch => {
                "The latest code-review artifact reviewer fingerprint does not match the referenced dedicated reviewer artifact."
            }
            Self::ReviewerArtifactIdentityMismatch => {
                "The latest code-review artifact reviewer source or reviewer id does not match the referenced dedicated reviewer artifact."
            }
            Self::ReviewerArtifactContractMismatch => {
                "The referenced dedicated reviewer artifact does not prove the current final-review contract."
            }
            Self::DistinctFromStagesMissing => {
                "The latest code-review artifact is missing implementation-stage distinctness provenance."
            }
            Self::DistinctFromStagesInvalid => {
                "The latest code-review artifact does not prove independence from both implementation stages."
            }
            Self::SourcePlanMismatch => {
                "The latest code-review artifact does not match the current approved plan path."
            }
            Self::SourcePlanRevisionMismatch => {
                "The latest code-review artifact does not match the current approved plan revision."
            }
            Self::StrategyCheckpointFingerprintMissing => {
                "The latest code-review artifact is missing its runtime strategy checkpoint fingerprint binding."
            }
            Self::StrategyCheckpointFingerprintMismatch => {
                "The latest code-review artifact strategy checkpoint fingerprint does not match the active runtime strategy checkpoint."
            }
            Self::HeadMismatch => {
                "The latest code-review artifact does not match the current HEAD."
            }
            Self::ResultNotPass => "The latest code-review artifact is not marked pass.",
            Self::GeneratedByMismatch => {
                "The latest code-review artifact was not generated by requesting-code-review."
            }
            Self::DeviationRecordMismatch => {
                "The latest code-review artifact has an invalid execution-deviation disposition."
            }
            Self::DeviationReviewVerdictMismatch => {
                "The latest code-review artifact has an invalid execution-deviation review verdict."
            }
        }
    }
}

pub(crate) fn parse_artifact_document(path: &Path) -> ArtifactDocument {
    let Ok(source) = fs::read_to_string(path) else {
        return ArtifactDocument::default();
    };
    ArtifactDocument {
        title: source
            .lines()
            .map(str::trim)
            .find(|line| !line.is_empty())
            .map(str::to_owned),
        headers: parse_headers(&source),
    }
}

pub fn parse_final_review_receipt(path: &Path) -> FinalReviewReceipt {
    let document = parse_artifact_document(path);
    FinalReviewReceipt {
        title: document.title.clone(),
        review_stage: document.headers.get("Review Stage").cloned(),
        reviewer_provenance: document.headers.get("Reviewer Provenance").cloned(),
        reviewer_source: document.headers.get("Reviewer Source").cloned(),
        reviewer_id: document.headers.get("Reviewer ID").cloned(),
        reviewer_artifact_path: document
            .headers
            .get("Reviewer Artifact Path")
            .map(|value| strip_backticks(value)),
        reviewer_artifact_fingerprint: document
            .headers
            .get("Reviewer Artifact Fingerprint")
            .cloned(),
        distinct_from_stages: parse_csv_header(document.headers.get("Distinct From Stages")),
        source_plan: document
            .headers
            .get("Source Plan")
            .map(|value| strip_backticks(value)),
        source_plan_revision: document
            .headers
            .get("Source Plan Revision")
            .and_then(|value| value.trim().parse::<u32>().ok()),
        strategy_checkpoint_fingerprint: document
            .headers
            .get("Strategy Checkpoint Fingerprint")
            .cloned(),
        branch: document.headers.get("Branch").cloned(),
        repo: document.headers.get("Repo").cloned(),
        base_branch: document.headers.get("Base Branch").cloned(),
        head_sha: document.headers.get("Head SHA").cloned(),
        result: document.headers.get("Result").cloned(),
        generated_by: document.headers.get("Generated By").cloned(),
        recorded_execution_deviations: document
            .headers
            .get("Recorded Execution Deviations")
            .cloned(),
        deviation_review_verdict: document.headers.get("Deviation Review Verdict").cloned(),
    }
}

pub fn validate_final_review_receipt(
    receipt: &FinalReviewReceipt,
    review_receipt_path: &Path,
    expectations: &FinalReviewReceiptExpectations<'_>,
) -> Result<(), FinalReviewReceiptIssue> {
    if receipt.title.as_deref() != Some("# Code Review Result")
        || receipt.review_stage.as_deref() != Some("featureforge:requesting-code-review")
    {
        return Err(FinalReviewReceiptIssue::ReviewStageMismatch);
    }
    if receipt.reviewer_provenance.as_deref() != Some("dedicated-independent") {
        return Err(FinalReviewReceiptIssue::ReviewerProvenanceMissing);
    }
    let reviewer_source = receipt
        .reviewer_source
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    let reviewer_id = receipt
        .reviewer_id
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    if reviewer_source.is_empty() || reviewer_id.is_empty() {
        return Err(FinalReviewReceiptIssue::ReviewerIdentityMissing);
    }
    if !matches!(reviewer_source, "fresh-context-subagent" | "cross-model") {
        return Err(FinalReviewReceiptIssue::ReviewerSourceNotIndependent);
    }
    let reviewer_artifact_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    if !is_canonical_fingerprint(reviewer_artifact_fingerprint) {
        return Err(FinalReviewReceiptIssue::ReviewerArtifactFingerprintInvalid);
    }
    let expected_deviation_record = if expectations.deviations_required {
        "present"
    } else {
        "none"
    };
    let expected_deviation_verdict = if expectations.deviations_required {
        "pass"
    } else {
        "not_required"
    };
    if receipt.distinct_from_stages.is_empty() {
        return Err(FinalReviewReceiptIssue::DistinctFromStagesMissing);
    }
    if !has_required_final_review_distinctness(&receipt.distinct_from_stages) {
        return Err(FinalReviewReceiptIssue::DistinctFromStagesInvalid);
    }
    if receipt.source_plan.as_deref() != Some(expectations.expected_plan_path) {
        return Err(FinalReviewReceiptIssue::SourcePlanMismatch);
    }
    if receipt.source_plan_revision != Some(expectations.expected_plan_revision) {
        return Err(FinalReviewReceiptIssue::SourcePlanRevisionMismatch);
    }
    if let Some(expected_strategy_checkpoint_fingerprint) = expectations
        .expected_strategy_checkpoint_fingerprint
        .map(str::trim)
    {
        let Some(receipt_strategy_checkpoint_fingerprint) = receipt
            .strategy_checkpoint_fingerprint
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
        else {
            return Err(FinalReviewReceiptIssue::StrategyCheckpointFingerprintMissing);
        };
        if receipt_strategy_checkpoint_fingerprint != expected_strategy_checkpoint_fingerprint {
            return Err(FinalReviewReceiptIssue::StrategyCheckpointFingerprintMismatch);
        }
    }
    if receipt.head_sha.as_deref() != Some(expectations.expected_head_sha) {
        return Err(FinalReviewReceiptIssue::HeadMismatch);
    }
    if receipt.result.as_deref() != Some("pass") {
        return Err(FinalReviewReceiptIssue::ResultNotPass);
    }
    if receipt.generated_by.as_deref() != Some("featureforge:requesting-code-review") {
        return Err(FinalReviewReceiptIssue::GeneratedByMismatch);
    }
    if receipt.recorded_execution_deviations.as_deref() != Some(expected_deviation_record) {
        return Err(FinalReviewReceiptIssue::DeviationRecordMismatch);
    }
    if receipt.deviation_review_verdict.as_deref() != Some(expected_deviation_verdict) {
        return Err(FinalReviewReceiptIssue::DeviationReviewVerdictMismatch);
    }
    let expectations = ReviewerArtifactExpectations {
        expected_plan_path: expectations.expected_plan_path,
        expected_plan_revision: expectations.expected_plan_revision,
        expected_strategy_checkpoint_fingerprint: expectations
            .expected_strategy_checkpoint_fingerprint,
        expected_branch: receipt.branch.as_deref().map(str::trim).unwrap_or_default(),
        expected_repo: receipt.repo.as_deref().map(str::trim).unwrap_or_default(),
        expected_head_sha: expectations.expected_head_sha,
        expected_base_branch: expectations.expected_base_branch,
        expected_deviation_record,
        expected_deviation_verdict,
    };
    validate_reviewer_artifact_binding(receipt, review_receipt_path, &expectations)?;
    Ok(())
}

pub fn resolve_release_base_branch(git_dir: &Path, current_branch: &str) -> Option<String> {
    const COMMON_BASE_BRANCHES: &[&str] = &["main", "master", "develop", "dev", "trunk"];
    let common_git_dir = common_git_dir(git_dir);

    if COMMON_BASE_BRANCHES.contains(&current_branch) {
        return Some(current_branch.to_owned());
    }

    if let Some(branch) = branch_merge_base_from_config(&common_git_dir, current_branch) {
        return Some(branch);
    }
    if let Some(branch) = origin_head_branch(&common_git_dir) {
        return Some(branch);
    }

    let branches = local_head_branches(&common_git_dir.join("refs/heads"));
    for candidate in COMMON_BASE_BRANCHES {
        if branches.iter().any(|branch| branch == candidate) {
            return Some((*candidate).to_owned());
        }
    }

    let mut non_current = branches
        .into_iter()
        .filter(|branch| branch != current_branch)
        .collect::<Vec<_>>();
    non_current.sort();
    non_current.dedup();
    if non_current.len() == 1 {
        return non_current.pop();
    }
    None
}

pub fn latest_branch_artifact_path(
    artifact_dir: &Path,
    branch_name: &str,
    kind: &str,
) -> Option<PathBuf> {
    let entries = fs::read_dir(artifact_dir).ok()?;
    let mut candidates = entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().and_then(std::ffi::OsStr::to_str) == Some("md"))
        .filter(|path| {
            path.file_name()
                .and_then(std::ffi::OsStr::to_str)
                .is_some_and(|name| {
                    name.strip_suffix(".md")
                        .and_then(|stem| stem.rsplit_once(&format!("-{kind}-")))
                        .is_some_and(|(_, timestamp)| !timestamp.is_empty())
                })
        })
        .filter(|path| {
            parse_artifact_document(path)
                .headers
                .get("Branch")
                .is_some_and(|value| value == branch_name)
        })
        .collect::<Vec<_>>();
    candidates.sort_by(|left, right| {
        artifact_timestamp_key(left, kind)
            .cmp(&artifact_timestamp_key(right, kind))
            .then_with(|| left.file_name().cmp(&right.file_name()))
    });
    candidates.pop()
}

pub(crate) fn authoritative_final_review_artifact_path_checked(
    context: &ExecutionContext,
) -> Result<Option<PathBuf>, JsonFailure> {
    let Some(overlay) = load_status_authoritative_overlay_checked(context)? else {
        return Ok(None);
    };
    authoritative_fingerprinted_artifact_path_checked(
        context,
        overlay.final_review_state.as_deref(),
        overlay.last_final_review_artifact_fingerprint.as_deref(),
        "final-review",
        "final review",
        "last_final_review_artifact_fingerprint",
    )
}

pub(crate) fn authoritative_strategy_checkpoint_fingerprint_checked(
    context: &ExecutionContext,
) -> Result<Option<String>, JsonFailure> {
    let Some(overlay) = load_status_authoritative_overlay_checked(context)? else {
        return Ok(None);
    };
    let Some(fingerprint) = overlay
        .last_strategy_checkpoint_fingerprint
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
    else {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Authoritative harness state is missing last_strategy_checkpoint_fingerprint required for final-review provenance binding.",
        ));
    };
    if !is_canonical_fingerprint(&fingerprint) {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            "Authoritative harness state last_strategy_checkpoint_fingerprint is not a canonical fingerprint.",
        ));
    }
    Ok(Some(fingerprint))
}

pub(crate) fn authoritative_browser_qa_artifact_path_checked(
    context: &ExecutionContext,
) -> Result<Option<PathBuf>, JsonFailure> {
    let Some(overlay) = load_status_authoritative_overlay_checked(context)? else {
        return Ok(None);
    };
    authoritative_fingerprinted_artifact_path_checked(
        context,
        overlay.browser_qa_state.as_deref(),
        overlay.last_browser_qa_artifact_fingerprint.as_deref(),
        "browser-qa",
        "browser QA",
        "last_browser_qa_artifact_fingerprint",
    )
}

pub(crate) fn authoritative_release_docs_artifact_path_checked(
    context: &ExecutionContext,
) -> Result<Option<PathBuf>, JsonFailure> {
    let Some(overlay) = load_status_authoritative_overlay_checked(context)? else {
        return Ok(None);
    };
    authoritative_fingerprinted_artifact_path_checked(
        context,
        overlay.release_docs_state.as_deref(),
        overlay.last_release_docs_artifact_fingerprint.as_deref(),
        "release-docs",
        "release docs",
        "last_release_docs_artifact_fingerprint",
    )
}

pub(crate) fn authoritative_test_plan_artifact_path_from_qa_checked(
    qa_artifact_path: &Path,
) -> Result<Option<PathBuf>, JsonFailure> {
    let qa = parse_artifact_document(qa_artifact_path);
    let Some(source_test_plan) = qa.headers.get("Source Test Plan") else {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact {} is missing Source Test Plan provenance.",
                qa_artifact_path.display()
            ),
        ));
    };
    let source_test_plan = strip_backticks(source_test_plan);
    let source_test_plan = source_test_plan.trim();
    if source_test_plan.is_empty() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact {} has an empty Source Test Plan provenance.",
                qa_artifact_path.display()
            ),
        ));
    }

    let source_test_plan_path = PathBuf::from(source_test_plan);
    let authoritative_artifacts_dir = qa_artifact_path.parent().unwrap_or_else(|| Path::new("."));
    let resolved_path = if source_test_plan_path.is_absolute() {
        source_test_plan_path
    } else {
        authoritative_artifacts_dir.join(source_test_plan_path)
    };
    let metadata = fs::symlink_metadata(&resolved_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact points at unreadable test plan {}: {error}",
                resolved_path.display()
            ),
        )
    })?;
    if metadata.file_type().is_symlink() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact must point at a regular test-plan file in {}.",
                resolved_path.display()
            ),
        ));
    }
    let resolved_path = fs::canonicalize(&resolved_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact points at unreadable test plan {}: {error}",
                resolved_path.display()
            ),
        )
    })?;
    let authoritative_artifacts_dir =
        fs::canonicalize(authoritative_artifacts_dir).map_err(|error| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Could not resolve authoritative artifacts directory for browser QA artifact {}: {error}",
                    qa_artifact_path.display()
                ),
            )
        })?;
    if !resolved_path.starts_with(&authoritative_artifacts_dir) {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact Source Test Plan must stay within authoritative artifacts {}.",
                authoritative_artifacts_dir.display()
            ),
        ));
    }
    let metadata = fs::metadata(&resolved_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact points at unreadable test plan {}: {error}",
                resolved_path.display()
            ),
        )
    })?;
    if !metadata.is_file() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact must point at a regular test-plan file in {}.",
                resolved_path.display()
            ),
        ));
    }
    let expected_fingerprint = resolved_path
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .and_then(|name| name.strip_prefix("test-plan-"))
        .and_then(|name| name.strip_suffix(".md"))
        .filter(|value| is_canonical_fingerprint(value))
        .ok_or_else(|| {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Authoritative browser QA artifact Source Test Plan must point at a canonical test-plan-<fingerprint>.md artifact in {}.",
                    authoritative_artifacts_dir.display()
                ),
            )
        })?;
    let test_plan_source = fs::read(&resolved_path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative browser QA artifact points at unreadable test plan {}: {error}",
                resolved_path.display()
            ),
        )
    })?;
    if sha256_hex(&test_plan_source) != expected_fingerprint {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            format!(
                "Authoritative browser QA artifact points at test plan {} whose content fingerprint does not match its canonical artifact identity.",
                resolved_path.display()
            ),
        ));
    }

    Ok(Some(resolved_path))
}

fn parse_headers(source: &str) -> BTreeMap<String, String> {
    source
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            let rest = line.strip_prefix("**")?;
            let (key, value) = rest.split_once(":** ")?;
            Some((key.to_owned(), value.to_owned()))
        })
        .collect()
}

fn common_git_dir(git_dir: &Path) -> PathBuf {
    let commondir = git_dir.join("commondir");
    let Ok(source) = fs::read_to_string(commondir) else {
        return git_dir.to_path_buf();
    };
    let relative = source.trim();
    if relative.is_empty() {
        return git_dir.to_path_buf();
    }
    let common = Path::new(relative);
    if common.is_absolute() {
        common.to_path_buf()
    } else {
        git_dir.join(common)
    }
}

fn artifact_timestamp_key(path: &Path, kind: &str) -> Option<String> {
    path.file_name()
        .and_then(std::ffi::OsStr::to_str)
        .and_then(|name| name.strip_suffix(".md"))
        .and_then(|stem| stem.rsplit_once(&format!("-{kind}-")))
        .map(|(_, timestamp)| timestamp.to_owned())
}

fn branch_merge_base_from_config(git_dir: &Path, current_branch: &str) -> Option<String> {
    let source = fs::read_to_string(git_dir.join("config")).ok()?;
    let target_section = format!(r#"[branch "{current_branch}"]"#);
    let mut in_target_section = false;

    for line in source.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            in_target_section = trimmed == target_section;
            continue;
        }
        if !in_target_section
            || trimmed.is_empty()
            || trimmed.starts_with('#')
            || trimmed.starts_with(';')
        {
            continue;
        }
        let (key, value) = trimmed.split_once('=')?;
        if key.trim() == "gh-merge-base" {
            let normalized = value.trim();
            if !normalized.is_empty() {
                return Some(normalized.to_owned());
            }
        }
    }

    None
}

fn origin_head_branch(git_dir: &Path) -> Option<String> {
    let source = fs::read_to_string(git_dir.join("refs/remotes/origin/HEAD")).ok()?;
    let reference = source.trim().strip_prefix("ref: ")?;
    let branch = reference.strip_prefix("refs/remotes/origin/")?.trim();
    if branch.is_empty() {
        None
    } else {
        Some(branch.to_owned())
    }
}

fn local_head_branches(heads_dir: &Path) -> Vec<String> {
    let Ok(entries) = fs::read_dir(heads_dir) else {
        return Vec::new();
    };
    let mut branches = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            branches.extend(local_head_branches(&path).into_iter().filter_map(|branch| {
                path.file_name()
                    .and_then(std::ffi::OsStr::to_str)
                    .map(|prefix| format!("{prefix}/{branch}"))
            }));
            continue;
        }
        if let Some(name) = path.file_name().and_then(std::ffi::OsStr::to_str) {
            branches.push(name.to_owned());
        }
    }
    branches
}

fn authoritative_fingerprinted_artifact_path_checked(
    context: &ExecutionContext,
    freshness_state: Option<&str>,
    fingerprint: Option<&str>,
    artifact_prefix: &str,
    artifact_label: &str,
    fingerprint_field: &str,
) -> Result<Option<PathBuf>, JsonFailure> {
    let Some(freshness_state) = normalize_optional_overlay_value(freshness_state) else {
        return Ok(None);
    };
    if freshness_state != "fresh" {
        return Ok(None);
    }

    let fingerprint = fingerprint.map(str::trim).filter(|value| !value.is_empty()).ok_or_else(
        || {
            JsonFailure::new(
                FailureClass::MalformedExecutionState,
                format!(
                    "Authoritative harness state marks {artifact_label} fresh but is missing {fingerprint_field}."
                ),
            )
        },
    )?;
    if fingerprint.len() != 64 || !fingerprint.chars().all(|value| value.is_ascii_hexdigit()) {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state marks {artifact_label} fresh but {fingerprint_field} is not a canonical fingerprint."
            ),
        ));
    }

    let path = harness_authoritative_artifacts_dir(
        &context.runtime.state_dir,
        &context.runtime.repo_slug,
        &context.runtime.branch_name,
    )
    .join(format!("{artifact_prefix}-{fingerprint}.md"));
    let metadata = fs::symlink_metadata(&path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state points {artifact_label} at unreadable artifact {}: {error}",
                path.display()
            ),
        )
    })?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err(JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state must point {artifact_label} at a regular artifact file in {}.",
                path.display()
            ),
        ));
    }
    let source = fs::read(&path).map_err(|error| {
        JsonFailure::new(
            FailureClass::MalformedExecutionState,
            format!(
                "Authoritative harness state points {artifact_label} at unreadable artifact {}: {error}",
                path.display()
            ),
        )
    })?;
    let canonical_fingerprint = sha256_hex(&source);
    if canonical_fingerprint != fingerprint {
        return Err(JsonFailure::new(
            FailureClass::ArtifactIntegrityMismatch,
            format!(
                "Authoritative harness state points {artifact_label} at artifact {} whose content fingerprint does not match {fingerprint_field}.",
                path.display()
            ),
        ));
    }
    Ok(Some(path))
}

fn normalize_optional_overlay_value(value: Option<&str>) -> Option<&str> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty() && *value != "unknown")
}

fn strip_backticks(value: &str) -> String {
    value.trim_matches('`').to_owned()
}

fn parse_csv_header(value: Option<&String>) -> Vec<String> {
    value
        .map(|raw| {
            raw.split(',')
                .map(str::trim)
                .filter(|item| !item.is_empty())
                .map(str::to_owned)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

fn is_canonical_fingerprint(value: &str) -> bool {
    value.len() == 64 && value.chars().all(|character| character.is_ascii_hexdigit())
}

fn validate_reviewer_artifact_binding(
    receipt: &FinalReviewReceipt,
    review_receipt_path: &Path,
    expectations: &ReviewerArtifactExpectations<'_>,
) -> Result<(), FinalReviewReceiptIssue> {
    let reviewer_artifact_path = receipt
        .reviewer_artifact_path
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or(FinalReviewReceiptIssue::ReviewerArtifactPathMissing)?;
    let reviewer_artifact_path = PathBuf::from(reviewer_artifact_path);
    let reviewer_artifact_path = if reviewer_artifact_path.is_absolute() {
        reviewer_artifact_path
    } else {
        review_receipt_path
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .join(reviewer_artifact_path)
    };
    let metadata = fs::symlink_metadata(&reviewer_artifact_path)
        .map_err(|_| FinalReviewReceiptIssue::ReviewerArtifactUnreadable)?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err(FinalReviewReceiptIssue::ReviewerArtifactUnreadable);
    }
    let review_artifact_dir = fs::canonicalize(
        review_receipt_path
            .parent()
            .unwrap_or_else(|| Path::new(".")),
    )
    .map_err(|_| FinalReviewReceiptIssue::ReviewerArtifactUnreadable)?;
    let canonical_review_receipt_path = fs::canonicalize(review_receipt_path)
        .map_err(|_| FinalReviewReceiptIssue::ReviewerArtifactUnreadable)?;
    let reviewer_artifact_path = fs::canonicalize(&reviewer_artifact_path)
        .map_err(|_| FinalReviewReceiptIssue::ReviewerArtifactUnreadable)?;
    let project_artifact_scope = project_artifact_scope_from_review_receipt(review_receipt_path)
        .unwrap_or(review_artifact_dir);
    if !reviewer_artifact_path.starts_with(&project_artifact_scope) {
        return Err(FinalReviewReceiptIssue::ReviewerArtifactNotRuntimeOwned);
    }
    if reviewer_artifact_path == canonical_review_receipt_path
        || !is_dedicated_reviewer_artifact_filename(&reviewer_artifact_path)
    {
        return Err(FinalReviewReceiptIssue::ReviewerArtifactContractMismatch);
    }
    let source = fs::read(&reviewer_artifact_path)
        .map_err(|_| FinalReviewReceiptIssue::ReviewerArtifactUnreadable)?;
    let expected_fingerprint = receipt
        .reviewer_artifact_fingerprint
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    if sha256_hex(&source) != expected_fingerprint {
        return Err(FinalReviewReceiptIssue::ReviewerArtifactFingerprintMismatch);
    }
    let reviewer_artifact = parse_artifact_document(&reviewer_artifact_path);
    let reviewer_source = receipt
        .reviewer_source
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    let reviewer_id = receipt
        .reviewer_id
        .as_deref()
        .map(str::trim)
        .unwrap_or_default();
    if reviewer_artifact
        .headers
        .get("Reviewer Source")
        .map(String::as_str)
        != Some(reviewer_source)
        || reviewer_artifact
            .headers
            .get("Reviewer ID")
            .map(String::as_str)
            != Some(reviewer_id)
    {
        return Err(FinalReviewReceiptIssue::ReviewerArtifactIdentityMismatch);
    }
    if !reviewer_artifact_matches_final_review_contract(&reviewer_artifact, expectations) {
        return Err(FinalReviewReceiptIssue::ReviewerArtifactContractMismatch);
    }
    Ok(())
}

fn reviewer_artifact_matches_final_review_contract(
    reviewer_artifact: &ArtifactDocument,
    expectations: &ReviewerArtifactExpectations<'_>,
) -> bool {
    if reviewer_artifact.title.as_deref() != Some("# Code Review Result") {
        return false;
    }
    if reviewer_artifact
        .headers
        .get("Review Stage")
        .map(String::as_str)
        != Some("featureforge:requesting-code-review")
    {
        return false;
    }
    if reviewer_artifact
        .headers
        .get("Reviewer Provenance")
        .map(String::as_str)
        != Some("dedicated-independent")
    {
        return false;
    }
    if reviewer_artifact.headers.get("Result").map(String::as_str) != Some("pass") {
        return false;
    }
    if reviewer_artifact
        .headers
        .get("Generated By")
        .map(String::as_str)
        != Some("featureforge:requesting-code-review")
    {
        return false;
    }
    if reviewer_artifact
        .headers
        .contains_key("Reviewer Artifact Path")
        || reviewer_artifact
            .headers
            .contains_key("Reviewer Artifact Fingerprint")
    {
        return false;
    }
    let Some(reviewer_artifact_source_plan) = reviewer_artifact
        .headers
        .get("Source Plan")
        .map(|value| strip_backticks(value))
    else {
        return false;
    };
    if reviewer_artifact_source_plan != expectations.expected_plan_path {
        return false;
    }
    let reviewer_artifact_source_plan_revision = reviewer_artifact
        .headers
        .get("Source Plan Revision")
        .and_then(|value| value.trim().parse::<u32>().ok());
    if reviewer_artifact_source_plan_revision != Some(expectations.expected_plan_revision) {
        return false;
    }
    if let Some(expected_strategy_checkpoint_fingerprint) =
        expectations.expected_strategy_checkpoint_fingerprint
        && reviewer_artifact
            .headers
            .get("Strategy Checkpoint Fingerprint")
            .map(String::as_str)
            != Some(expected_strategy_checkpoint_fingerprint)
    {
        return false;
    }
    if reviewer_artifact.headers.get("Branch").map(String::as_str)
        != Some(expectations.expected_branch)
    {
        return false;
    }
    if reviewer_artifact.headers.get("Repo").map(String::as_str) != Some(expectations.expected_repo)
    {
        return false;
    }
    if reviewer_artifact
        .headers
        .get("Head SHA")
        .map(String::as_str)
        != Some(expectations.expected_head_sha)
    {
        return false;
    }
    if reviewer_artifact
        .headers
        .get("Base Branch")
        .map(String::as_str)
        != Some(expectations.expected_base_branch)
    {
        return false;
    }
    if reviewer_artifact
        .headers
        .get("Recorded Execution Deviations")
        .map(String::as_str)
        != Some(expectations.expected_deviation_record)
    {
        return false;
    }
    if reviewer_artifact
        .headers
        .get("Deviation Review Verdict")
        .map(String::as_str)
        != Some(expectations.expected_deviation_verdict)
    {
        return false;
    }
    let reviewer_distinct_stages =
        parse_csv_header(reviewer_artifact.headers.get("Distinct From Stages"));
    has_required_final_review_distinctness(&reviewer_distinct_stages)
}

fn has_required_final_review_distinctness(stages: &[String]) -> bool {
    let has_executing_plans = stages
        .iter()
        .any(|stage| stage == "featureforge:executing-plans");
    let has_subagent_driven = stages
        .iter()
        .any(|stage| stage == "featureforge:subagent-driven-development");
    has_executing_plans && has_subagent_driven
}

fn is_dedicated_reviewer_artifact_filename(path: &Path) -> bool {
    path.file_name()
        .and_then(std::ffi::OsStr::to_str)
        .is_some_and(|name| name.contains("-independent-review-"))
}

fn project_artifact_scope_from_review_receipt(review_receipt_path: &Path) -> Option<PathBuf> {
    let canonical_receipt_path = fs::canonicalize(review_receipt_path).ok()?;
    let mut ancestor = canonical_receipt_path.parent();
    while let Some(path) = ancestor {
        if path
            .parent()
            .and_then(Path::file_name)
            .and_then(std::ffi::OsStr::to_str)
            == Some("projects")
        {
            return Some(path.to_path_buf());
        }
        if path
            .parent()
            .and_then(Path::file_name)
            .and_then(std::ffi::OsStr::to_str)
            == Some("execution")
        {
            let state_root = path.parent().and_then(Path::parent)?;
            let slug = path.file_name()?;
            let project_scope = state_root.join("projects").join(slug);
            return fs::canonicalize(&project_scope)
                .ok()
                .or(Some(project_scope));
        }
        ancestor = path.parent();
    }
    None
}
