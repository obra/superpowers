use std::path::PathBuf;

use clap::{Args, Subcommand, ValueEnum};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

fn parse_positive_u32(raw: &str) -> Result<u32, String> {
    let value = raw
        .parse::<u32>()
        .map_err(|_| String::from("--max-jobs must be a positive integer."))?;
    if value == 0 {
        return Err(String::from("--max-jobs must be a positive integer."));
    }
    Ok(value)
}

#[derive(Debug, Args)]
pub struct PlanExecutionCli {
    #[command(subcommand)]
    pub command: PlanExecutionCommand,
}

#[derive(Debug, Subcommand)]
pub enum PlanExecutionCommand {
    Status(StatusArgs),
    Recommend(RecommendArgs),
    Preflight(StatusArgs),
    #[command(name = "rebuild-evidence")]
    RebuildEvidence(RebuildEvidenceArgs),
    #[command(name = "gate-contract")]
    GateContract(GateContractArgs),
    #[command(name = "record-contract")]
    RecordContract(RecordContractArgs),
    #[command(name = "gate-evaluator")]
    GateEvaluator(GateEvaluatorArgs),
    #[command(name = "record-evaluation")]
    RecordEvaluation(RecordEvaluationArgs),
    #[command(name = "gate-handoff")]
    GateHandoff(GateHandoffArgs),
    #[command(name = "record-handoff")]
    RecordHandoff(RecordHandoffArgs),
    #[command(name = "gate-review")]
    GateReview(StatusArgs),
    #[command(name = "gate-review-dispatch")]
    GateReviewDispatch(StatusArgs),
    #[command(name = "gate-finish")]
    GateFinish(StatusArgs),
    Begin(BeginArgs),
    Note(NoteArgs),
    Complete(CompleteArgs),
    Reopen(ReopenArgs),
    Transfer(TransferArgs),
}

#[derive(Debug, Clone, Args)]
pub struct StatusArgs {
    #[arg(long)]
    pub plan: PathBuf,
}

#[derive(Debug, Clone, Args)]
pub struct GateContractArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub contract: PathBuf,
}

#[derive(Debug, Clone, Args)]
pub struct RecordContractArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub contract: PathBuf,
}

#[derive(Debug, Clone, Args)]
pub struct GateEvaluatorArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long = "evaluation")]
    pub evaluation: PathBuf,
}

#[derive(Debug, Clone, Args)]
pub struct RecordEvaluationArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long = "evaluation")]
    pub evaluation: PathBuf,
}

#[derive(Debug, Clone, Args)]
pub struct GateHandoffArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub handoff: PathBuf,
}

#[derive(Debug, Clone, Args)]
pub struct RecordHandoffArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub handoff: PathBuf,
}

#[derive(Debug, Clone, Args)]
pub struct RecommendArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long = "isolated-agents")]
    pub isolated_agents: Option<IsolatedAgentsArg>,
    #[arg(long = "session-intent")]
    pub session_intent: Option<SessionIntentArg>,
    #[arg(long = "workspace-prepared")]
    pub workspace_prepared: Option<WorkspacePreparedArg>,
}

#[derive(Debug, Clone, Args)]
pub struct RebuildEvidenceArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub all: bool,
    #[arg(long = "task")]
    pub tasks: Vec<u32>,
    #[arg(long = "step")]
    pub steps: Vec<String>,
    #[arg(long = "include-open")]
    pub include_open: bool,
    #[arg(long = "skip-manual-fallback")]
    pub skip_manual_fallback: bool,
    #[arg(long = "continue-on-error")]
    pub continue_on_error: bool,
    #[arg(long = "dry-run")]
    pub dry_run: bool,
    #[arg(long = "max-jobs", default_value_t = 1, value_parser = parse_positive_u32)]
    pub max_jobs: u32,
    #[arg(
        long = "no-output",
        help = "Suppress command stream capture while preserving deterministic verification summaries."
    )]
    pub no_output: bool,
    #[arg(long)]
    pub json: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema, ValueEnum)]
#[serde(rename_all = "kebab-case")]
pub enum ExecutionTopologyArg {
    #[value(name = "worktree-backed-parallel")]
    WorktreeBackedParallel,
    #[value(name = "conservative-fallback")]
    ConservativeFallback,
}

impl ExecutionTopologyArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::WorktreeBackedParallel => "worktree-backed-parallel",
            Self::ConservativeFallback => "conservative-fallback",
        }
    }
}

#[derive(Debug, Clone, Args)]
pub struct BeginArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub task: u32,
    #[arg(long)]
    pub step: u32,
    #[arg(long = "execution-mode")]
    pub execution_mode: Option<ExecutionModeArg>,
    #[arg(long = "expect-execution-fingerprint")]
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone, Args)]
pub struct NoteArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub task: u32,
    #[arg(long)]
    pub step: u32,
    #[arg(long)]
    pub state: NoteStateArg,
    #[arg(long)]
    pub message: String,
    #[arg(long = "expect-execution-fingerprint")]
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone, Args)]
pub struct CompleteArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub task: u32,
    #[arg(long)]
    pub step: u32,
    #[arg(long)]
    pub source: ExecutionModeArg,
    #[arg(long)]
    pub claim: String,
    #[arg(long = "file")]
    pub files: Vec<String>,
    #[arg(long = "verify-command")]
    pub verify_command: Option<String>,
    #[arg(long = "verify-result")]
    pub verify_result: Option<String>,
    #[arg(long = "manual-verify-summary")]
    pub manual_verify_summary: Option<String>,
    #[arg(long = "expect-execution-fingerprint")]
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone, Args)]
pub struct ReopenArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long)]
    pub task: u32,
    #[arg(long)]
    pub step: u32,
    #[arg(long)]
    pub source: ExecutionModeArg,
    #[arg(long)]
    pub reason: String,
    #[arg(long = "expect-execution-fingerprint")]
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone, Args)]
pub struct TransferArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long = "repair-task")]
    pub repair_task: u32,
    #[arg(long = "repair-step")]
    pub repair_step: u32,
    #[arg(long)]
    pub source: ExecutionModeArg,
    #[arg(long)]
    pub reason: String,
    #[arg(long = "expect-execution-fingerprint")]
    pub expect_execution_fingerprint: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum IsolatedAgentsArg {
    Available,
    Unavailable,
}

impl IsolatedAgentsArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Available => "available",
            Self::Unavailable => "unavailable",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum SessionIntentArg {
    Stay,
    Separate,
    Unknown,
}

impl SessionIntentArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Stay => "stay",
            Self::Separate => "separate",
            Self::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum WorkspacePreparedArg {
    Yes,
    No,
    Unknown,
}

impl WorkspacePreparedArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Yes => "yes",
            Self::No => "no",
            Self::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum ExecutionModeArg {
    #[value(name = "featureforge:executing-plans")]
    ExecutingPlans,
    #[value(name = "featureforge:subagent-driven-development")]
    SubagentDrivenDevelopment,
}

impl ExecutionModeArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ExecutingPlans => "featureforge:executing-plans",
            Self::SubagentDrivenDevelopment => "featureforge:subagent-driven-development",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum NoteStateArg {
    Blocked,
    Interrupted,
}

impl NoteStateArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Blocked => "blocked",
            Self::Interrupted => "interrupted",
        }
    }
}
