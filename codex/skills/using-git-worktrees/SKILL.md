---
name: using-git-worktrees
description: Use when feature work needs isolation from the current workspace, branch switching would disturb dirty changes, or a plan calls for an isolated workspace.
---

# Using Git Worktrees In Codex

## Core Idea

Git worktrees provide isolated directories for branch work while preserving the current workspace. In Codex, worktrees are optional safety tools, not a blanket requirement for every task.

Use a worktree when isolation is valuable:

- The current worktree has unrelated dirty changes.
- The task requires branch switching.
- Multiple workers need isolated branches.
- The user or plan asks for an isolated workspace.
- The change is large enough that protecting the current workspace matters.

Do not create a worktree when the user explicitly directs work in the current workspace or when creating one would violate the task's write boundaries.

## Preserve Dirty Work

Before changing branches or creating a worktree, inspect:

```bash
git status --short
git branch --show-current
git worktree list
```

Treat all existing dirty files as user or other-worker changes. Do not revert, overwrite, format, stage, stash, or commit them unless the user explicitly asks.

If dirty files overlap the requested change, stop and ask how to proceed. If they are unrelated, leave them alone.

## Directory Selection

Use this priority:

1. Existing `.worktrees/` directory.
2. Existing `worktrees/` directory.
3. Repository instructions that specify a worktree location.
4. Ask the user for a location.

For project-local directories, verify the worktree directory is ignored:

```bash
git check-ignore -q .worktrees 2>/dev/null
git check-ignore -q worktrees 2>/dev/null
```

If the chosen project-local directory is not ignored, stop and ask before editing ignore files. Do not add ignore rules or commit them unless the user requested that maintenance.

Global directories outside the repository do not need repository ignore rules.

## Create The Worktree

Choose a branch name that starts with the repository's requested prefix when one exists. In Codex desktop, prefer `codex/` unless the user asked for another prefix.

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
git worktree add <path> -b <branch-name>
cd <path>
git status --short
```

If the branch already exists, decide whether to reuse it, choose a new branch name, or ask the user. Do not force-update a branch without explicit instruction.

## Setup And Baseline

Run only setup commands that are appropriate for the project and safe in the isolated directory. Detect from files instead of assuming:

- `package.json`: install or use the repo's documented package manager.
- `Cargo.toml`: use the Rust build/test commands documented by the repo.
- `requirements.txt` or `pyproject.toml`: use the repo's Python workflow.
- `go.mod`: use Go module commands.

Then run the smallest useful baseline verification. If it fails, report the failure and ask whether to proceed or investigate.

## Parallel Worker Worktrees

When multiple workers need separate worktrees:

- Give each worker a unique branch and directory.
- Give each worker disjoint file ownership.
- Do not let workers share generated outputs or dependency install directories unless safe.
- Require each worker to report its path, branch, changed files, and verification output.

## Completion

When a worktree is no longer needed, do not remove it automatically unless the user chooses a cleanup workflow. `finishing-a-development-branch` handles branch completion options and Codex git directives.

If cleanup is requested, verify there is no uncommitted work in that worktree before removal:

```bash
git -C <worktree-path> status --short
git worktree remove <worktree-path>
```

Never delete a worktree or branch that contains uncommitted or unpushed work without explicit confirmation.
