use clap::{Args, Subcommand, ValueEnum};

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
    pub intent: RepoSafetyIntentArg,
    #[arg(long)]
    pub stage: String,
    #[arg(long = "task-id")]
    pub task_id: Option<String>,
    #[arg(long = "path")]
    pub paths: Vec<String>,
    #[arg(long = "write-target")]
    pub write_targets: Vec<RepoSafetyWriteTargetArg>,
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
    pub write_targets: Vec<RepoSafetyWriteTargetArg>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum RepoSafetyIntentArg {
    Read,
    Write,
}

impl RepoSafetyIntentArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Read => "read",
            Self::Write => "write",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum RepoSafetyWriteTargetArg {
    #[value(name = "spec-artifact-write")]
    SpecArtifactWrite,
    #[value(name = "plan-artifact-write")]
    PlanArtifactWrite,
    #[value(name = "approval-header-write")]
    ApprovalHeaderWrite,
    #[value(name = "execution-task-slice")]
    ExecutionTaskSlice,
    #[value(name = "release-doc-write")]
    ReleaseDocWrite,
    #[value(name = "repo-file-write")]
    RepoFileWrite,
    #[value(name = "git-commit")]
    GitCommit,
    #[value(name = "git-merge")]
    GitMerge,
    #[value(name = "git-push")]
    GitPush,
    #[value(name = "git-worktree-cleanup")]
    GitWorktreeCleanup,
    #[value(name = "branch-finish")]
    BranchFinish,
}

impl RepoSafetyWriteTargetArg {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::SpecArtifactWrite => "spec-artifact-write",
            Self::PlanArtifactWrite => "plan-artifact-write",
            Self::ApprovalHeaderWrite => "approval-header-write",
            Self::ExecutionTaskSlice => "execution-task-slice",
            Self::ReleaseDocWrite => "release-doc-write",
            Self::RepoFileWrite => "repo-file-write",
            Self::GitCommit => "git-commit",
            Self::GitMerge => "git-merge",
            Self::GitPush => "git-push",
            Self::GitWorktreeCleanup => "git-worktree-cleanup",
            Self::BranchFinish => "branch-finish",
        }
    }
}
