---
name: using-git-worktrees
description: Use when starting feature work that should be isolated from other branches - creates git worktree with clean baseline verification before implementation
---

# Using Git Worktrees

> **This skill mirrors the `/using-git-worktrees` workflow.**

## Overview
Git worktrees create isolated workspaces sharing the same repository.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

## Directory Priority
1. Check for existing `.worktrees/` or `worktrees/`
2. Check project config
3. Ask user

**Safety:** Verify directory is in `.gitignore` before creating.

## Creation Steps
1. **Detect project** — `basename $(git rev-parse --show-toplevel)`
2. **Create worktree** — `git worktree add ".worktrees/name" -b "feature/name"`
3. **Run setup** — Auto-detect: npm install / cargo build / pip install / etc.
4. **Verify baseline** — Run tests, confirm clean starting point
5. **Report** — "Worktree ready at `<path>`. Tests passing."

## Red Flags
Never: Create without verifying .gitignore, skip baseline tests, proceed with failing tests, assume directory location.
