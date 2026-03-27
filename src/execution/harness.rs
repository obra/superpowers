use std::error::Error;
use std::fmt;
use std::str::FromStr;

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub const INITIAL_AUTHORITATIVE_SEQUENCE: u64 = 0;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum HarnessPhase {
    ImplementationHandoff,
    ExecutionPreflight,
    ContractDrafting,
    ContractPendingApproval,
    ContractApproved,
    Executing,
    Evaluating,
    Repairing,
    PivotRequired,
    HandoffRequired,
    FinalReviewPending,
    QaPending,
    DocumentReleasePending,
    ReadyForBranchCompletion,
}

impl HarnessPhase {
    pub const ALL: [Self; 14] = [
        Self::ImplementationHandoff,
        Self::ExecutionPreflight,
        Self::ContractDrafting,
        Self::ContractPendingApproval,
        Self::ContractApproved,
        Self::Executing,
        Self::Evaluating,
        Self::Repairing,
        Self::PivotRequired,
        Self::HandoffRequired,
        Self::FinalReviewPending,
        Self::QaPending,
        Self::DocumentReleasePending,
        Self::ReadyForBranchCompletion,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::ImplementationHandoff => "implementation_handoff",
            Self::ExecutionPreflight => "execution_preflight",
            Self::ContractDrafting => "contract_drafting",
            Self::ContractPendingApproval => "contract_pending_approval",
            Self::ContractApproved => "contract_approved",
            Self::Executing => "executing",
            Self::Evaluating => "evaluating",
            Self::Repairing => "repairing",
            Self::PivotRequired => "pivot_required",
            Self::HandoffRequired => "handoff_required",
            Self::FinalReviewPending => "final_review_pending",
            Self::QaPending => "qa_pending",
            Self::DocumentReleasePending => "document_release_pending",
            Self::ReadyForBranchCompletion => "ready_for_branch_completion",
        }
    }

    pub fn is_public_phase(value: &str) -> bool {
        Self::ALL.iter().any(|phase| phase.as_str() == value)
    }
}

impl fmt::Display for HarnessPhase {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for HarnessPhase {
    type Err = ParseHarnessPhaseError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "implementation_handoff" => Ok(Self::ImplementationHandoff),
            "execution_preflight" => Ok(Self::ExecutionPreflight),
            "contract_drafting" => Ok(Self::ContractDrafting),
            "contract_pending_approval" => Ok(Self::ContractPendingApproval),
            "contract_approved" => Ok(Self::ContractApproved),
            "executing" => Ok(Self::Executing),
            "evaluating" => Ok(Self::Evaluating),
            "repairing" => Ok(Self::Repairing),
            "pivot_required" => Ok(Self::PivotRequired),
            "handoff_required" => Ok(Self::HandoffRequired),
            "final_review_pending" => Ok(Self::FinalReviewPending),
            "qa_pending" => Ok(Self::QaPending),
            "document_release_pending" => Ok(Self::DocumentReleasePending),
            "ready_for_branch_completion" => Ok(Self::ReadyForBranchCompletion),
            _ => Err(ParseHarnessPhaseError {
                invalid_value: value.to_owned(),
            }),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseHarnessPhaseError {
    pub invalid_value: String,
}

impl fmt::Display for ParseHarnessPhaseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "unknown harness phase value `{}`", self.invalid_value)
    }
}

impl Error for ParseHarnessPhaseError {}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize, JsonSchema)]
pub struct ExecutionRunId(pub String);

impl ExecutionRunId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for ExecutionRunId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize, JsonSchema)]
pub struct ChunkId(pub String);

impl ChunkId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for ChunkId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub enum ChunkingStrategy {
    #[serde(rename = "task")]
    Task,
    #[serde(rename = "task-group")]
    TaskGroup,
    #[serde(rename = "whole-run")]
    WholeRun,
}

impl ChunkingStrategy {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Task => "task",
            Self::TaskGroup => "task-group",
            Self::WholeRun => "whole-run",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub enum ResetPolicy {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "chunk-boundary")]
    ChunkBoundary,
    #[serde(rename = "adaptive")]
    Adaptive,
}

impl ResetPolicy {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::ChunkBoundary => "chunk-boundary",
            Self::Adaptive => "adaptive",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct EvaluatorPolicyName(pub String);

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct FrozenPolicySnapshot {
    pub chunking_strategy: ChunkingStrategy,
    pub evaluator_policy: EvaluatorPolicyName,
    pub reset_policy: ResetPolicy,
    pub review_stack: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct RunIdentitySnapshot {
    pub execution_run_id: ExecutionRunId,
    pub source_plan_path: String,
    pub source_plan_revision: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum EvaluatorKind {
    SpecCompliance,
    CodeQuality,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum EvaluationVerdict {
    Pass,
    Fail,
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum AggregateEvaluationState {
    Pass,
    Pending,
    Fail,
    Blocked,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct AuthoritativeArtifactPointers {
    pub active_contract_path: Option<String>,
    pub active_contract_fingerprint: Option<String>,
    pub last_evaluation_report_path: Option<String>,
    pub last_evaluation_report_fingerprint: Option<String>,
    pub last_evaluation_evaluator_kind: Option<EvaluatorKind>,
    pub last_evaluation_verdict: Option<EvaluationVerdict>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct EvaluatorSetSnapshot {
    pub required_evaluator_kinds: Vec<EvaluatorKind>,
    pub completed_evaluator_kinds: Vec<EvaluatorKind>,
    pub pending_evaluator_kinds: Vec<EvaluatorKind>,
    pub non_passing_evaluator_kinds: Vec<EvaluatorKind>,
    pub aggregate_evaluation_state: AggregateEvaluationState,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct ChunkRetrySnapshot {
    pub current_chunk_retry_count: u32,
    pub current_chunk_retry_budget: u32,
    pub current_chunk_pivot_threshold: u32,
    pub handoff_required: bool,
    pub open_failed_criteria: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum DownstreamFreshnessState {
    NotRequired,
    Missing,
    Fresh,
    Stale,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct DownstreamFreshnessSnapshot {
    pub final_review_state: DownstreamFreshnessState,
    pub browser_qa_state: DownstreamFreshnessState,
    pub release_docs_state: DownstreamFreshnessState,
    pub last_final_review_artifact_fingerprint: Option<String>,
    pub last_browser_qa_artifact_fingerprint: Option<String>,
    pub last_release_docs_artifact_fingerprint: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct RepoStateSnapshot {
    pub repo_state_baseline_head_sha: Option<String>,
    pub repo_state_baseline_worktree_fingerprint: Option<String>,
    pub repo_state_drift_state: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct WriteAuthorityDiagnostics {
    pub write_authority_state: String,
    pub write_authority_holder: Option<String>,
    pub write_authority_worktree: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct AuthoritativeOrderingState {
    pub latest_authoritative_sequence: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct AuthoritativeHarnessState {
    pub harness_phase: HarnessPhase,
    pub chunk_id: ChunkId,
    pub run_identity: Option<RunIdentitySnapshot>,
    pub ordering: AuthoritativeOrderingState,
    pub policy_snapshot: Option<FrozenPolicySnapshot>,
    pub artifact_pointers: AuthoritativeArtifactPointers,
    pub evaluators: EvaluatorSetSnapshot,
    pub retry: ChunkRetrySnapshot,
    pub write_authority: WriteAuthorityDiagnostics,
    pub repo_state: RepoStateSnapshot,
    pub dependency_index_state: String,
    pub downstream_freshness: DownstreamFreshnessSnapshot,
    pub reason_codes: Vec<String>,
}
