use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::execution::harness::{ChunkId, ExecutionRunId};

pub const DEPENDENCY_INDEX_VERSION: u32 = 1;
pub const DEFAULT_RETENTION_WINDOW_DAYS: u32 = 30;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema, Default)]
#[serde(rename_all = "snake_case")]
pub enum DependencyIndexState {
    Healthy,
    #[default]
    Missing,
    Malformed,
    Inconsistent,
    Recovering,
}

impl DependencyIndexState {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Healthy => "healthy",
            Self::Missing => "missing",
            Self::Malformed => "malformed",
            Self::Inconsistent => "inconsistent",
            Self::Recovering => "recovering",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct DependencyIndexIssue {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct DependencyIndexHealth {
    pub state: DependencyIndexState,
    pub issues: Vec<DependencyIndexIssue>,
    pub requires_fail_closed: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize, JsonSchema)]
pub struct DependencyNodeId(pub String);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum IndexedArtifactKind {
    Contract,
    EvaluationReport,
    Handoff,
    EvidenceArtifact,
    FinalReviewArtifact,
    BrowserQaArtifact,
    ReleaseDocsArtifact,
    CandidateContract,
    CandidateEvaluationReport,
    CandidateHandoff,
}

impl IndexedArtifactKind {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Contract => "contract",
            Self::EvaluationReport => "evaluation_report",
            Self::Handoff => "handoff",
            Self::EvidenceArtifact => "evidence_artifact",
            Self::FinalReviewArtifact => "final_review_artifact",
            Self::BrowserQaArtifact => "browser_qa_artifact",
            Self::ReleaseDocsArtifact => "release_docs_artifact",
            Self::CandidateContract => "candidate_contract",
            Self::CandidateEvaluationReport => "candidate_evaluation_report",
            Self::CandidateHandoff => "candidate_handoff",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct DependencyNode {
    pub node_id: DependencyNodeId,
    pub artifact_kind: IndexedArtifactKind,
    pub artifact_fingerprint: String,
    pub authoritative: bool,
    pub execution_run_id: Option<ExecutionRunId>,
    pub chunk_id: Option<ChunkId>,
    pub authoritative_sequence: Option<u64>,
    pub source_plan_path: Option<String>,
    pub source_plan_revision: Option<u32>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum DependencyEdgeKind {
    DependsOn,
    Supersedes,
    Invalidates,
    RequiredByGate,
    CandidateRetentionClaim,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct DependencyEdge {
    pub from: DependencyNodeId,
    pub to: DependencyNodeId,
    pub kind: DependencyEdgeKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct CandidateArtifactDependencyClaim {
    pub claim_id: String,
    pub artifact_fingerprint: String,
    pub artifact_kind: IndexedArtifactKind,
    pub execution_run_id: Option<ExecutionRunId>,
    pub chunk_id: Option<ChunkId>,
    pub controller_id: String,
    pub reason: String,
    pub created_at: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct DependencyIndex {
    pub version: u32,
    pub state: DependencyIndexState,
    pub health: DependencyIndexHealth,
    pub nodes: Vec<DependencyNode>,
    pub edges: Vec<DependencyEdge>,
    pub candidate_claims: Vec<CandidateArtifactDependencyClaim>,
}

impl DependencyIndex {
    pub fn healthy_empty() -> Self {
        Self {
            version: DEPENDENCY_INDEX_VERSION,
            state: DependencyIndexState::Healthy,
            health: DependencyIndexHealth::healthy(),
            nodes: Vec::new(),
            edges: Vec::new(),
            candidate_claims: Vec::new(),
        }
    }
}

impl DependencyIndexHealth {
    pub fn healthy() -> Self {
        Self {
            state: DependencyIndexState::Healthy,
            issues: Vec::new(),
            requires_fail_closed: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct RetentionWindow {
    pub max_age_days: u32,
}

impl Default for RetentionWindow {
    fn default() -> Self {
        Self {
            max_age_days: DEFAULT_RETENTION_WINDOW_DAYS,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct RetentionEligibility {
    pub artifact_fingerprint: String,
    pub retain: bool,
    pub reasons: Vec<String>,
}

impl RetentionEligibility {
    pub fn retain(artifact_fingerprint: impl Into<String>, reason: impl Into<String>) -> Self {
        Self {
            artifact_fingerprint: artifact_fingerprint.into(),
            retain: true,
            reasons: vec![reason.into()],
        }
    }

    pub fn prune(artifact_fingerprint: impl Into<String>, reason: impl Into<String>) -> Self {
        Self {
            artifact_fingerprint: artifact_fingerprint.into(),
            retain: false,
            reasons: vec![reason.into()],
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
pub struct RetentionEligibilityReport {
    pub window: RetentionWindow,
    pub dependency_index_state: DependencyIndexState,
    pub decisions: Vec<RetentionEligibility>,
    pub skipped: bool,
    pub skip_reason: Option<String>,
}
