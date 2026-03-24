use std::path::PathBuf;

use clap::{Args, Subcommand, ValueEnum};

#[derive(Debug, clap::Args)]
pub struct WorkflowCli {
    #[command(subcommand)]
    pub command: WorkflowCommand,
}

#[derive(Debug, Subcommand)]
pub enum WorkflowCommand {
    Status(StatusArgs),
    Resolve,
    Expect(ExpectArgs),
    Sync(SyncArgs),
    Next,
    Artifacts,
    Explain,
    Phase(PhaseArgs),
    Doctor(JsonModeArgs),
    Handoff(JsonModeArgs),
    Preflight(PlanArgs),
    Gate(WorkflowGateCli),
}

#[derive(Debug, Args)]
pub struct StatusArgs {
    #[arg(long, default_value_t = false)]
    pub refresh: bool,
    #[arg(long, default_value_t = false)]
    pub summary: bool,
}

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum ArtifactKind {
    Spec,
    Plan,
}

#[derive(Debug, Args)]
pub struct ExpectArgs {
    #[arg(long, value_enum)]
    pub artifact: ArtifactKind,
    #[arg(long)]
    pub path: PathBuf,
}

#[derive(Debug, Args)]
pub struct SyncArgs {
    #[arg(long, value_enum)]
    pub artifact: ArtifactKind,
    #[arg(long)]
    pub path: Option<PathBuf>,
}

#[derive(Debug, Args)]
pub struct PhaseArgs {
    #[arg(long, default_value_t = false)]
    pub json: bool,
}

#[derive(Debug, Clone, Args)]
pub struct JsonModeArgs {
    #[arg(long, default_value_t = false)]
    pub json: bool,
}

#[derive(Debug, Clone, Args)]
pub struct PlanArgs {
    #[arg(long)]
    pub plan: PathBuf,
    #[arg(long, default_value_t = false)]
    pub json: bool,
}

#[derive(Debug, Args)]
pub struct WorkflowGateCli {
    #[command(subcommand)]
    pub command: WorkflowGateCommand,
}

#[derive(Debug, Subcommand)]
pub enum WorkflowGateCommand {
    Review(PlanArgs),
    Finish(PlanArgs),
}
