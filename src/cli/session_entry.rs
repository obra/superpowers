use std::path::PathBuf;

use clap::{Args, Subcommand, ValueEnum};

#[derive(Debug, Args)]
pub struct SessionEntryCli {
    #[command(subcommand)]
    pub command: SessionEntryCommand,
}

#[derive(Debug, Subcommand)]
pub enum SessionEntryCommand {
    Resolve(SessionEntryResolveArgs),
    Record(SessionEntryRecordArgs),
}

#[derive(Debug, Clone, Args)]
pub struct SessionEntryResolveArgs {
    #[arg(long = "message-file")]
    pub message_file: PathBuf,
    #[arg(long = "session-key")]
    pub session_key: Option<String>,
    #[arg(long = "spawned-subagent")]
    pub spawned_subagent: bool,
    #[arg(long = "spawned-subagent-opt-in", requires = "spawned_subagent")]
    pub spawned_subagent_opt_in: bool,
}

#[derive(Debug, Clone, Args)]
pub struct SessionEntryRecordArgs {
    #[arg(long)]
    pub decision: SessionDecisionArg,
    #[arg(long = "session-key")]
    pub session_key: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum SessionDecisionArg {
    Enabled,
    Bypassed,
}

impl SessionDecisionArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Enabled => "enabled",
            Self::Bypassed => "bypassed",
        }
    }
}
