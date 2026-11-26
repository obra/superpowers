---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback
---

# Using Git Worktrees

## Overview

Ensure work happens in an isolated workspace. Prefer your platform's native worktree tools. Fall back to manual git worktrees only when no native tool is available.

**Core principle:** Detect existing isolation first. Then use native tools. Then fall back to git. Never fight the harness.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Step 0: Detect Existing Isolation

**Before creating anything, check if you are already in an isolated workspace.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
START_HEAD=$(git rev-parse --verify HEAD 2>/dev/null || echo unborn)
printf 'GIT_DIR=%s\nGIT_COMMON=%s\nBRANCH=%s\nSTART_HEAD=%s\n' "$GIT_DIR" "$GIT_COMMON" "$BRANCH" "$START_HEAD"
```

Keep the printed `START_HEAD` (`<START_HEAD>`) and `BRANCH` (`<START_BRANCH>`) visible.

**Submodule guard:** Before concluding "already in a worktree," verify you are not in a submodule:

```bash
# If this returns a path, you're in a submodule, not a worktree — treat as normal repo
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**If `GIT_DIR != GIT_COMMON` (and not a submodule):** You are already in a linked worktree. Skip to Step 2 (Project Setup). Do NOT create another worktree.

Report with branch state:
- On a branch: "Already in isolated workspace at `<path>` on branch `<name>`."
- Detached HEAD: "Already in isolated workspace at `<path>` (detached HEAD, externally managed). Branch creation needed at finish time."

**If `GIT_DIR == GIT_COMMON` (or in a submodule):** You are in a normal repo checkout.

Has the user already indicated their worktree preference in your instructions? If not, ask for consent before creating a worktree:

> "Would you like me to set up an isolated worktree? It protects your current branch from changes."

Honor any existing declared preference without asking. If the user declines consent, work in place and skip to Step 2.

## Step 1: Create Isolated Workspace

**You have two mechanisms. Try them in this order.**

### 1a. Native Worktree Tools (preferred)

The user has asked for an isolated workspace (Step 0 consent). Do you already have a way to create a worktree? It might be a tool with a name like `EnterWorktree` or `create_worktree`, a `/worktree` command, or a `--worktree` flag. If you do, use it, then verify the base commit before Step 2. If the tool accepts a base ref or revision, pass `<START_HEAD>`.

Native tools handle directory placement, branch creation, and cleanup automatically. Using `git worktree add` when you have a native tool creates phantom state your harness can't see or manage.

**Work in the new worktree.** Some tools move your session into it (`EnterWorktree` does). Others leave you in your current checkout and return the new path. Codex `create_worktree` does this, and it also returns before the worktree is ready: poll `get_worktree_creation_status` until it is. Then run the base check below, Step 2, Step 3 and all of the work in that path, not in the checkout you started from.

**Verify the base commit before Step 2.** Skip this check if `<START_HEAD>` is `unborn`. A native tool may start the new worktree from the remote default branch instead of the commit you were on. Run this in the new worktree:

```bash
git rev-parse HEAD
git merge-base --is-ancestor HEAD <START_HEAD> && echo "start-ahead"
git merge-base --is-ancestor <START_HEAD> HEAD && echo "worktree-ahead"
git symbolic-ref --short -q refs/remotes/origin/HEAD || echo "no origin/HEAD"
```

Take the first line that applies:

- **Printed both `start-ahead` and `worktree-ahead`:** the worktree is at `<START_HEAD>`. Continue to Step 2.
- **Printed `start-ahead` only:** the worktree lacks commits you started from, such as an unpushed plan. Run `git merge --ff-only <START_HEAD>`, then continue. If the merge refuses, stop and report its message.
- **Printed `worktree-ahead` only, and the last line is `origin/<START_BRANCH>`:** your local default branch was behind its remote, so nothing is missing. Continue to Step 2.
- **Anything else:** stop and ask your human partner which commit to build on, giving both SHAs. If they choose `<START_HEAD>`, run `git switch -C "$(git branch --show-current)" <START_HEAD>`, or `git switch --detach <START_HEAD>` if the worktree is on a detached HEAD.

Only proceed to Step 1b if you have no native worktree tool available.

### 1b. Git Worktree Fallback

**Only use this if Step 1a does not apply** — you have no native worktree tool available. Create a worktree manually using git.

#### Directory Selection

Follow this priority order. Explicit user preference always beats observed filesystem state.

1. **Check your instructions for a declared worktree directory preference.** If the user has already specified one, use it without asking.

2. **Check for an existing project-local worktree directory:**
   ```bash
   ls -d .worktrees 2>/dev/null     # Preferred (hidden)
   ls -d worktrees 2>/dev/null      # Alternative
   ```
   If found, use it. If both exist, `.worktrees` wins.

3. **If there is no other guidance available**, default to `.worktrees/` at the project root.

#### Safety Verification (project-local directories only)

**MUST verify directory is ignored before creating worktree:**

```bash
: "${LOCATION:?set LOCATION to the directory you selected above}"
git check-ignore -q "${LOCATION%/}/"
```

**If NOT ignored:** Add to .gitignore, commit the change, then proceed.

**Why critical:** Prevents accidentally committing worktree contents to repository.

#### Create the Worktree

```bash
# Determine path based on chosen location
worktree_path="$LOCATION/$BRANCH_NAME"

git worktree add "$worktree_path" -b "$BRANCH_NAME"
cd "$worktree_path"
```

**Sandbox fallback:** If `git worktree add` fails with a permission error (sandbox denial), tell the user the sandbox blocked worktree creation and you're working in the current directory instead. Then run setup and baseline tests in place.

## Step 2: Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f poetry.lock ] || grep -q '\[tool\.poetry\]' pyproject.toml 2>/dev/null; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

## Step 3: Verify Clean Baseline

Run tests to ensure workspace starts clean:

```bash
# Use project-appropriate command
npm test / cargo test / pytest / go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### Report

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| Already in linked worktree | Skip creation (Step 0) |
| In a submodule | Treat as normal repo (Step 0 guard) |
| Native worktree tool available | Use it (Step 1a) |
| No native tool | Git worktree fallback (Step 1b) |
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check instruction file, then default `.worktrees/` |
| Directory not ignored | Add to .gitignore + commit |
| Permission error on create | Sandbox fallback, work in place |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "I'm obviously not in a worktree — no need to check" | Run Step 0. Harness-created isolation and submodules both fool eyeballing; the detection commands settle it. |
| "`git worktree add` is quicker than hunting for a native tool" | A native tool (e.g. `EnterWorktree`) owns placement, branching, and cleanup. Bypassing it is the #1 mistake — it creates phantom state your harness can't see or manage. |
| "The worktree directory is surely ignored already" | Run `git check-ignore`. An unignored worktree directory commits the whole tree into the repo. |
| "Any directory name works" | Explicit instructions beat an existing project-local directory, which beats the `.worktrees/` default. |
| "The workspace is fresh — baseline tests can wait" | A dirty baseline makes every later failure ambiguous. Run the tests now; proceeding past failures is your human partner's call. |
