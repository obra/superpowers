use std::path::PathBuf;

use clap::{Args, Subcommand};

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
}

#[derive(Debug, Clone, Args)]
pub struct SessionEntryRecordArgs {
    #[arg(long)]
    pub decision: String,
    #[arg(long = "session-key")]
    pub session_key: Option<String>,
}
