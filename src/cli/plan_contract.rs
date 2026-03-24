use clap::{Args, Subcommand, ValueEnum};

#[derive(Debug, Args)]
pub struct PlanContractCli {
    #[command(subcommand)]
    pub command: PlanContractCommand,
}

#[derive(Debug, Subcommand)]
pub enum PlanContractCommand {
    Lint(LintArgs),
    #[command(name = "analyze-plan")]
    AnalyzePlan(AnalyzePlanArgs),
    #[command(name = "build-task-packet")]
    BuildTaskPacket(BuildTaskPacketArgs),
}

#[derive(Debug, Clone, Args)]
pub struct LintArgs {
    #[arg(long)]
    pub spec: String,
    #[arg(long)]
    pub plan: String,
}

#[derive(Debug, Clone, Args)]
pub struct AnalyzePlanArgs {
    #[arg(long)]
    pub spec: String,
    #[arg(long)]
    pub plan: String,
    #[arg(long, value_enum, default_value_t = AnalyzeOutputFormat::Json)]
    pub format: AnalyzeOutputFormat,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum AnalyzeOutputFormat {
    Json,
}

#[derive(Debug, Clone, Args)]
pub struct BuildTaskPacketArgs {
    #[arg(long)]
    pub plan: String,
    #[arg(long)]
    pub task: u32,
    #[arg(long, value_enum, default_value_t = PacketOutputFormat::Json)]
    pub format: PacketOutputFormat,
    #[arg(long, value_enum, default_value_t = PersistMode::No)]
    pub persist: PersistMode,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum PacketOutputFormat {
    Json,
    Markdown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum PersistMode {
    Yes,
    No,
}
