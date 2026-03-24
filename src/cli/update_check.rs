use clap::Args;

#[derive(Debug, Clone, Args)]
pub struct UpdateCheckCli {
    #[arg(long)]
    pub force: bool,
}
