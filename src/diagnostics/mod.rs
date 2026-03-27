use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FailureClass {
    ApprovalWriteFailed,
    ArtifactIntegrityMismatch,
    AuthoritativeOrderingMismatch,
    BlockedOnPlanPivot,
    BranchDetectionFailed,
    ConcurrentWriterConflict,
    ContractMismatch,
    DecisionReadFailed,
    DecisionWriteFailed,
    DependencyIndexMismatch,
    EvidenceWriteFailed,
    EvaluationMismatch,
    ExecutionStateNotReady,
    IdempotencyConflict,
    IllegalHarnessPhase,
    InstructionParseFailed,
    InvalidCommandInput,
    InvalidConfigFormat,
    InvalidExecutionMode,
    InvalidRepoPath,
    InvalidWriteTarget,
    InvalidStepTransition,
    MalformedExecutionState,
    MissedReopenRequired,
    MissingRequiredHandoff,
    NonAuthoritativeArtifact,
    NonHarnessProvenance,
    PartialAuthoritativeMutation,
    PlanNotExecutionReady,
    PromptPayloadBuildFailed,
    QaArtifactNotFresh,
    RepoStateDrift,
    ReviewArtifactNotFresh,
    RecommendAfterExecutionStart,
    RepoContextUnavailable,
    ReleaseArtifactNotFresh,
    ResolverContractViolation,
    ResolverRuntimeFailure,
    StaleProvenance,
    StaleExecutionEvidence,
    StaleMutation,
    UnsupportedArtifactVersion,
    UpdateCheckStateFailed,
    WorkspaceNotSafe,
}

impl FailureClass {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::ApprovalWriteFailed => "ApprovalWriteFailed",
            Self::ArtifactIntegrityMismatch => "ArtifactIntegrityMismatch",
            Self::AuthoritativeOrderingMismatch => "AuthoritativeOrderingMismatch",
            Self::BlockedOnPlanPivot => "BlockedOnPlanPivot",
            Self::BranchDetectionFailed => "BranchDetectionFailed",
            Self::ConcurrentWriterConflict => "ConcurrentWriterConflict",
            Self::ContractMismatch => "ContractMismatch",
            Self::DecisionReadFailed => "DecisionReadFailed",
            Self::DecisionWriteFailed => "DecisionWriteFailed",
            Self::DependencyIndexMismatch => "DependencyIndexMismatch",
            Self::EvidenceWriteFailed => "EvidenceWriteFailed",
            Self::EvaluationMismatch => "EvaluationMismatch",
            Self::ExecutionStateNotReady => "ExecutionStateNotReady",
            Self::IdempotencyConflict => "IdempotencyConflict",
            Self::IllegalHarnessPhase => "IllegalHarnessPhase",
            Self::InstructionParseFailed => "InstructionParseFailed",
            Self::InvalidCommandInput => "InvalidCommandInput",
            Self::InvalidConfigFormat => "InvalidConfigFormat",
            Self::InvalidExecutionMode => "InvalidExecutionMode",
            Self::InvalidRepoPath => "InvalidRepoPath",
            Self::InvalidWriteTarget => "InvalidWriteTarget",
            Self::InvalidStepTransition => "InvalidStepTransition",
            Self::MalformedExecutionState => "MalformedExecutionState",
            Self::MissedReopenRequired => "MissedReopenRequired",
            Self::MissingRequiredHandoff => "MissingRequiredHandoff",
            Self::NonAuthoritativeArtifact => "NonAuthoritativeArtifact",
            Self::NonHarnessProvenance => "NonHarnessProvenance",
            Self::PartialAuthoritativeMutation => "PartialAuthoritativeMutation",
            Self::PlanNotExecutionReady => "PlanNotExecutionReady",
            Self::PromptPayloadBuildFailed => "PromptPayloadBuildFailed",
            Self::QaArtifactNotFresh => "QaArtifactNotFresh",
            Self::RepoStateDrift => "RepoStateDrift",
            Self::ReviewArtifactNotFresh => "ReviewArtifactNotFresh",
            Self::RecommendAfterExecutionStart => "RecommendAfterExecutionStart",
            Self::RepoContextUnavailable => "RepoContextUnavailable",
            Self::ReleaseArtifactNotFresh => "ReleaseArtifactNotFresh",
            Self::ResolverContractViolation => "ResolverContractViolation",
            Self::ResolverRuntimeFailure => "ResolverRuntimeFailure",
            Self::StaleProvenance => "StaleProvenance",
            Self::StaleExecutionEvidence => "StaleExecutionEvidence",
            Self::StaleMutation => "StaleMutation",
            Self::UnsupportedArtifactVersion => "UnsupportedArtifactVersion",
            Self::UpdateCheckStateFailed => "UpdateCheckStateFailed",
            Self::WorkspaceNotSafe => "WorkspaceNotSafe",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Error)]
#[error("{message}")]
pub struct DiagnosticError {
    failure_class: FailureClass,
    message: String,
}

impl DiagnosticError {
    pub fn new(failure_class: FailureClass, message: impl Into<String>) -> Self {
        Self {
            failure_class,
            message: message.into(),
        }
    }

    pub const fn failure_class_enum(&self) -> FailureClass {
        self.failure_class
    }

    pub const fn failure_class(&self) -> &'static str {
        self.failure_class.as_str()
    }

    pub fn message(&self) -> &str {
        &self.message
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct JsonFailure {
    pub error_class: String,
    pub message: String,
}

impl JsonFailure {
    pub fn new(failure_class: FailureClass, message: impl Into<String>) -> Self {
        Self {
            error_class: failure_class.as_str().to_owned(),
            message: message.into(),
        }
    }
}

impl From<DiagnosticError> for JsonFailure {
    fn from(value: DiagnosticError) -> Self {
        Self {
            error_class: value.failure_class().to_owned(),
            message: value.message().to_owned(),
        }
    }
}
