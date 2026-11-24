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
GIT_DIR=$(d=$(git rev-parse --git-dir 2>/dev/null) && cd "$d" && pwd -P || true)
GIT_COMMON=$(d=$(git rev-parse --git-common-dir 2>/dev/null) && cd "$d" && pwd -P || true)
BRANCH=$(git branch --show-current 2>/dev/null || true)
START_HEAD=$(git rev-parse --verify HEAD 2>/dev/null || echo unborn)
printf 'GIT_DIR=%s\nGIT_COMMON=%s\nBRANCH=%s\nSTART_HEAD=%s\n' "$GIT_DIR" "$GIT_COMMON" "$BRANCH" "$START_HEAD"
```

Keep the printed `START_HEAD` (`<START_HEAD>`) and `BRANCH` (`<START_BRANCH>`) visible; if `START_HEAD` is `unborn` (0-commit repo), git worktrees require an initial commit — work in place or ask your human partner.

**Submodule guard:** A submodule checkout is not a feature worktree. Verify before concluding "already in a worktree":

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

The user has asked for an isolated workspace (Step 0 consent). Do you already have a way to create a worktree? It might be a tool with a name like `EnterWorktree`, `create_worktree` (Codex, pass `<START_HEAD>` if supported), a `/worktree` command, or a `--worktree` flag. If you do, use it, then verify the base commit before Step 2.

Native tools handle placement, branching, and cleanup, though they often branch from `origin/<default>` rather than `<START_HEAD>`. Using `git worktree add` when you have a native tool creates phantom state your harness can't see or manage.

**Verify base commit before Step 2** (unless `<START_HEAD>` was `unborn`): if `git rev-parse HEAD` differs from `<START_HEAD>`:
- If `<START_BRANCH>` is `main`, `master`, or `dev`, `git status --porcelain` is clean, **and** `git merge-base --is-ancestor HEAD <START_HEAD>` succeeds, run `git merge --ff-only <START_HEAD>`.
- Otherwise **stop, report both refs/SHAs, and ask your human partner** whether to run `git switch -C <worktree-branch> <START_HEAD>` or keep the native base.

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

#### Safety Verification (project-local only)

Skip Safety Verification when `<chosen-dir>` is outside `$(git rev-parse --show-toplevel)`.

**MUST verify `<chosen-dir>/` is ignored**; if not, create self-ignoring `<chosen-dir>/.gitignore` (`*`) and re-verify `<chosen-dir>/<branch-name>` (never edit root `.gitignore` or commit):

```bash
git check-ignore -q "<chosen-dir>/" || { mkdir -p "<chosen-dir>" && { [ -e "<chosen-dir>/.gitignore" ] || printf '*\n' > "<chosen-dir>/.gitignore"; }; }
git check-ignore -q "<chosen-dir>/<branch-name>"
```

If `<chosen-dir>/<branch-name>` still does not ignore the target (`git check-ignore` exits `1`), stop and ask your human partner (never edit root `.gitignore` or commit).

#### Create the Worktree

```bash
git worktree add --no-track "<chosen-dir>/<branch-name>" -b "<branch-name>" HEAD
cd "<chosen-dir>/<branch-name>"
```

**Sandbox denial:** If `git worktree add` fails with a permission error, stop, report it, and **ask your human partner** before working in place.

## Step 2: Project Setup

Install dependencies using the project's lockfile or docs (`package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`/`bun.lock`, `uv.lock`/`poetry.lock`/`requirements.txt`, `Cargo.toml`, `go.mod`); skip if none exist.

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
| Native worktree tool available | Use it, then verify base commit (Step 1a) |
| No native tool | Git worktree fallback (Step 1b) |
| Instruction file sets directory | Use declared directory (skip Safety Verification if external) |
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Default `.worktrees/` |
| Directory not ignored | Create self-ignoring `<chosen-dir>/.gitignore` (`*`) |
| Permission error on create | Report denial + ask |
| Tests fail during baseline | Report failures + ask |
| No dependency manifest/lockfile | Skip dependency install |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "I'm obviously not in a worktree — no need to check" | Run Step 0. Harness-created isolation and submodules both fool eyeballing; the detection commands settle it. |
| "`git worktree add` is quicker than hunting for a native tool" | A native tool (e.g. `EnterWorktree`, `create_worktree`) handles placement and isolation; use it, then verify the base commit against `<START_HEAD>` (Step 1a). Bypassing it is the #1 mistake and creates phantom state. |
| "The worktree directory is surely ignored already" | Run `git check-ignore`. An unignored worktree directory commits the whole tree into the repo. |
| "Any directory name works" | Explicit instructions beat an existing project-local directory, which beats the `.worktrees/` default. |
| "The workspace is fresh — baseline tests can wait" | A dirty baseline makes every later failure ambiguous. Run the tests now; proceeding past failures is your human partner's call. |
