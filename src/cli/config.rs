use clap::{Args, Subcommand};

#[derive(Debug, Args)]
pub struct ConfigCli {
    #[command(subcommand)]
    pub command: ConfigCommand,
}

#[derive(Debug, Subcommand)]
pub enum ConfigCommand {
    Get(ConfigGetArgs),
    Set(ConfigSetArgs),
    List,
}

#[derive(Debug, Clone, Args)]
pub struct ConfigGetArgs {
    pub key: String,
}

#[derive(Debug, Clone, Args)]
pub struct ConfigSetArgs {
    pub key: String,
    pub value: String,
}
