---
name: using-git-worktrees
description: Use before implementation when work should be isolated from the current branch or workspace.
---

# Using Git Worktrees

Create an isolated branch workspace with safe defaults.

## Required Start

Announce: `I'm using the using-git-worktrees skill to set up an isolated workspace.`

## Directory Selection Priority

1. Existing `.worktrees/`
2. Existing `worktrees/`
3. Project guidance file (for example `CLAUDE.md`)
4. Ask user

## Safety Check

For project-local worktree directories, verify ignore rules before creating:

```bash
git check-ignore -q .worktrees || git check-ignore -q worktrees
```

If not ignored, add ignore entry before proceeding.

## Creation Steps

1. Detect project root and feature branch name.
2. Create worktree and branch:

```bash
git worktree add <path> -b <branch>
cd <path>
```

3. Run project setup based on detected toolchain (`npm install`, `poetry install`, `cargo build`, etc.).
4. Run baseline tests.

## Failure Handling

If baseline tests fail, report failures and ask whether to continue.

## Success Output

Report:
- Worktree path
- Branch name
- Setup command(s) run
- Baseline test status

## Integration

Use with:
- `writing-plans`
- `subagent-driven-development`
- `executing-plans`

Cleanup is handled by `finishing-a-development-branch`.
