use clap::{Args, ValueEnum};

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum RuntimeRootFieldCli {
    #[value(name = "upgrade-eligible")]
    UpgradeEligible,
}

#[derive(Debug, Clone, Args)]
pub struct RuntimeRootCli {
    #[arg(long)]
    pub json: bool,

    #[arg(long, conflicts_with = "json")]
    pub path: bool,

    #[arg(long, value_enum, conflicts_with_all = ["json", "path"])]
    pub field: Option<RuntimeRootFieldCli>,
}
