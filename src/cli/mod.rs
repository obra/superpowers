use clap::{Args, Parser, Subcommand};

pub mod config;
pub mod plan_contract;
pub mod plan_execution;
pub mod repo_safety;
pub mod runtime_root;
pub mod slug;
pub mod update_check;
pub mod workflow;

#[derive(Debug, Parser)]
#[command(
    name = "featureforge",
    version,
    about = "Unified Rust runtime for the FeatureForge workflow toolkit",
    long_about = None
)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Command>,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    Config(config::ConfigCli),
    Plan(PlanCli),
    Repo(RepoCli),
    #[command(name = "repo-safety")]
    RepoSafety(repo_safety::RepoSafetyCli),
    #[command(name = "update-check")]
    UpdateCheck(update_check::UpdateCheckCli),
    Workflow(workflow::WorkflowCli),
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
    #[command(name = "runtime-root")]
    RuntimeRoot(runtime_root::RuntimeRootCli),
}
