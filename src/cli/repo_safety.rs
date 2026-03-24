use clap::{Args, Subcommand};

#[derive(Debug, Args)]
pub struct RepoSafetyCli {
    #[command(subcommand)]
    pub command: RepoSafetyCommand,
}

#[derive(Debug, Subcommand)]
pub enum RepoSafetyCommand {
    Check(RepoSafetyCheckArgs),
    Approve(RepoSafetyApproveArgs),
}

#[derive(Debug, Clone, Args)]
pub struct RepoSafetyCheckArgs {
    #[arg(long)]
    pub intent: String,
    #[arg(long)]
    pub stage: String,
    #[arg(long = "task-id")]
    pub task_id: Option<String>,
    #[arg(long = "path")]
    pub paths: Vec<String>,
    #[arg(long = "write-target")]
    pub write_targets: Vec<String>,
}

#[derive(Debug, Clone, Args)]
pub struct RepoSafetyApproveArgs {
    #[arg(long)]
    pub stage: String,
    #[arg(long = "task-id")]
    pub task_id: Option<String>,
    #[arg(long)]
    pub reason: String,
    #[arg(long = "path")]
    pub paths: Vec<String>,
    #[arg(long = "write-target")]
    pub write_targets: Vec<String>,
}
