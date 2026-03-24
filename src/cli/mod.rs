use clap::{Args, Parser, Subcommand};

pub mod config;
pub mod install;
pub mod plan_contract;
pub mod plan_execution;
pub mod repo_safety;
pub mod session_entry;
pub mod slug;
pub mod update_check;
pub mod workflow;

#[derive(Debug, Parser)]
#[command(
    name = "superpowers",
    version,
    about = "Unified Rust runtime for the Superpowers workflow toolkit",
    long_about = None
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Command>,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    Config(config::ConfigCli),
    Install(InstallCli),
    Plan(PlanCli),
    Repo(RepoCli),
    #[command(name = "repo-safety")]
    RepoSafety(repo_safety::RepoSafetyCli),
    #[command(name = "session-entry")]
    SessionEntry(session_entry::SessionEntryCli),
    #[command(name = "update-check")]
    UpdateCheck(update_check::UpdateCheckCli),
    Workflow(workflow::WorkflowCli),
}

#[derive(Debug, Args)]
pub struct InstallCli {
    #[command(subcommand)]
    pub command: InstallCommand,
}

#[derive(Debug, Subcommand)]
pub enum InstallCommand {
    Migrate(install::InstallMigrateArgs),
}

#[derive(Debug, Args)]
pub struct PlanCli {
    #[command(subcommand)]
    pub command: PlanCommand,
}

#[derive(Debug, Subcommand)]
pub enum PlanCommand {
    Contract(plan_contract::PlanContractCli),
    Execution(plan_execution::PlanExecutionCli),
}

#[derive(Debug, Args)]
pub struct RepoCli {
    #[command(subcommand)]
    pub command: RepoCommand,
}

#[derive(Debug, Subcommand)]
pub enum RepoCommand {
    Slug(slug::SlugCli),
}
