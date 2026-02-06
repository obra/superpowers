---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Hard Policy (Non-Negotiable)

- Only 1 linked worktree is allowed at any time.
- Worktree storage directory (`$LOCATION_PATH`) total size must never exceed 1GiB (1024MB).
- If any linked worktree exceeds 1024MB: immediately `git -C <path> clean -fdx`, recheck size; if still >1024MB, destroy the worktree.
- Do not store datasets, papers, models, checkpoints, logs, or non-dependency caches/build outputs in the worktree. Use external locations (e.g., `/data` or a project-defined data directory).
- Dependency install artifacts are allowed, but keep them under 1GiB and externalize caches/build outputs where supported: `CARGO_TARGET_DIR`, `PIP_CACHE_DIR`, `npm_config_cache`, `npm_config_prefix` (all outside the worktree).
- End of task: delete all linked worktrees and delete the selected worktree directory (`$LOCATION_PATH`), then run maintenance commands when safe.

## Directory Selection Process

Follow this priority order:

### 1. Check Existing Directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*directory" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no CLAUDE.md preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. $HOME/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

### 4. Resolve LOCATION Path

After choosing, set `LOCATION` to `.worktrees`, `worktrees`, or `$HOME/.config/superpowers/worktrees`.

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
case "$LOCATION" in
  .worktrees|worktrees)
    LOCATION_PATH="$LOCATION"
    ;;
  "$HOME"/.config/superpowers/worktrees|"$HOME"/.config/superpowers/worktrees/*)
    LOCATION_PATH="$HOME/.config/superpowers/worktrees/$project"
    ;;
esac
```

## Pre-Create Checklist (Hard Gate)

Run these BEFORE creating a worktree:

```bash
git worktree list --porcelain
```

**If any linked worktree exists:** run the **Cleanup Flow** below, then re-run the list until zero linked worktrees remain.

**If `$LOCATION_PATH` exists:** check size and enforce the 1GiB cap before proceeding.

```bash
du -sm "$LOCATION_PATH" 2>/dev/null
```

## Safety Verification

### For Project-Local Directories (.worktrees or worktrees)

**MUST verify directory is ignored before creating worktree:**

```bash
# Check if the selected directory is ignored (respects local, global, and system gitignore)
git check-ignore -q "$LOCATION" 2>/dev/null
```

**If NOT ignored:**

Per Jesse's rule "Fix broken things immediately":
1. Add appropriate line to .gitignore
2. Commit the change
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to repository.

### For Global Directory ($HOME/.config/superpowers/worktrees)

No .gitignore verification needed - outside project entirely.

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Determine full path
case "$LOCATION" in
  .worktrees|worktrees)
    LOCATION_PATH="$LOCATION"
    ;;
  "$HOME"/.config/superpowers/worktrees|"$HOME"/.config/superpowers/worktrees/*)
    LOCATION_PATH="$HOME/.config/superpowers/worktrees/$project"
    ;;
esac
path="$LOCATION_PATH/$BRANCH_NAME"

# Create worktree with new branch
mkdir -p "$LOCATION_PATH"
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Externalize caches/build outputs (required where supported)
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$HOME/.cache/cargo-targets/$project}"
export PIP_CACHE_DIR="${PIP_CACHE_DIR:-$HOME/.cache/pip}"
export npm_config_cache="${npm_config_cache:-$HOME/.cache/npm}"
export npm_config_prefix="${npm_config_prefix:-$HOME/.cache/npm-prefix}"

# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python - try multiple environments before failing
if [ -f requirements.txt ]; then
  if ! python -m pip install -r requirements.txt; then
    echo "pip failed; trying other environments..."
    [ -d .venv ] && . .venv/bin/activate && python -m pip install -r requirements.txt
    for tool in micromamba mamba conda; do
      command -v "$tool" >/dev/null 2>&1 || continue
      "$tool" env list | awk 'NR>1 && $1 !~ /^#/ {gsub(/\*/, "", $1); print $1}' | while read -r env; do
        "$tool" run -n "$env" python -m pip install -r requirements.txt && break
      done
    done
  fi
fi
if [ -f pyproject.toml ]; then
  poetry install || python -m pip install -e . || (
    command -v micromamba >/dev/null 2>&1 && micromamba run -n base python -m pip install -e .
  )
fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

## Runtime Size Checks (Mandatory)

Check size before and after each major step (dependency install, builds, large commands), and at least once per session:

```bash
du -sm "$LOCATION_PATH" 2>/dev/null
du -sm "$path"
```

**If any linked worktree exceeds 1024MB:**

```bash
git -C "$path" clean -fdx
du -sm "$path"
```

If still >1024MB, destroy it immediately:

```bash
git worktree remove "$path" --force
git worktree prune
```

**If `$LOCATION_PATH` total exceeds 1024MB:** remove linked worktrees until the cap is met, then re-check.

### 4. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Try environment switching and re-run first (e.g., `. .venv/bin/activate && pytest`,
`micromamba run -n <env> pytest`, `mamba/conda run -n <env> pytest`). Only report after reasonable
environment attempts.

**If tests pass:** Report ready.

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Cleanup Flow (End of Task, Mandatory)

Run from the repo root when the task is complete:

```bash
git worktree list --porcelain

# Remove each linked worktree
git worktree list --porcelain | awk '/^worktree /{print substr($0,10)}' | sed '1d' | while IFS= read -r wt; do
  git worktree remove --force "$wt" || git worktree remove --force --force "$wt"
done

git worktree prune --expire now --verbose
git worktree list

# Delete the worktree directory itself (based on LOCATION)
project=$(basename "$(git rev-parse --show-toplevel)")
if [ -z "$LOCATION_PATH" ]; then
  if [ -d .worktrees ]; then
    LOCATION_PATH=".worktrees"
  elif [ -d worktrees ]; then
    LOCATION_PATH="worktrees"
  else
    LOCATION_PATH="$HOME/.config/superpowers/worktrees/$project"
  fi
fi
rm -rf "$LOCATION_PATH"

# Verify no residual worktrees
worktrees_path=$(git rev-parse --git-path worktrees)
test -z "$(ls -A "$worktrees_path" 2>/dev/null)"

# Maintenance (only when safe and no other git operations are running)
git maintenance run --task=worktree-prune --task=incremental-repack
git gc --prune=now
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check CLAUDE.md → Ask user |
| Any linked worktree exists | Run Cleanup Flow; only then create |
| Linked worktree >1024MB | `git -C <path> clean -fdx`, recheck; if still >1024MB destroy |
| Worktree directory total >1024MB | Remove linked worktree(s) until under cap, then recheck |
| End of task | Remove all linked worktrees, delete `$LOCATION_PATH`, run maintenance |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Try env switch + rerun, then report |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Skipping size checks

- **Problem:** Worktree directory exceeds 1GiB or a linked worktree grows beyond 1024MB
- **Fix:** Run `du -sm` checks, clean with `git -C <path> clean -fdx`, recheck, destroy if still >1024MB

### Keeping worktrees after task completion

- **Problem:** Linked worktrees remain and the worktree directory is not removed
- **Fix:** Run the **Cleanup Flow** and delete `$LOCATION_PATH` every time

### Storing data or caches in the worktree

- **Problem:** Datasets/models/logs or non-dependency caches/build outputs bloat the worktree
- **Fix:** Use external storage (e.g., `/data` or project-defined data directories); keep dependency caches/build outputs outside the worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > CLAUDE.md > ask

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Try environment switching and re-run first; then report and get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Pre-create: git worktree list --porcelain -> no linked worktrees]
[Check .worktrees/ - exists]
[Verify ignored - git check-ignore confirms .worktrees/ is ignored]
[Create worktree: git worktree add .worktrees/auth -b feature/auth]
[Export cache vars to $HOME/.cache/...]
[Run npm install]
[Size check: du -sm $LOCATION_PATH -> 320]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature

[Task complete: git worktree remove .worktrees/auth --force]
[git worktree prune]
[rm -rf $LOCATION_PATH]
[git maintenance run --task=worktree-prune --task=incremental-repack]
[git gc --prune=now]
```

## Rationalization Table

| Excuse | Rule |
|--------|------|
| "I'll clean after this run" | If any linked worktree is >1024MB, clean and recheck immediately; if still >1024MB, destroy now. |
| "Two worktrees are faster right now" | Only 1 linked worktree is allowed. Remove existing linked worktree(s) before creating a new one. |
| "I'll keep data in worktree temporarily" | Datasets, papers, models, checkpoints, logs, and non-dependency caches/build outputs are prohibited in worktrees. |
| "Leave worktree for tomorrow to save time" | End-of-task cleanup is mandatory: remove all linked worktrees and delete the worktree directory. |

## Red Flags

**Never:**
- Create worktree without verifying it's ignored (project-local)
- Create a second linked worktree or proceed when one already exists
- Let the worktree directory exceed 1GiB or a linked worktree exceed 1024MB
- Store datasets/models/logs or non-dependency caches/build outputs inside the worktree
- Leave linked worktrees or the worktree directory after task completion
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Skip CLAUDE.md check

**Always:**
- Follow directory priority: existing > CLAUDE.md > ask
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline
- Run size checks and enforce the clean/recheck/destroy flow
- Run Cleanup Flow at end of task

## Integration

**Called by:**
- **brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows
- **subagent-driven-development** - REQUIRED before executing any tasks
- **executing-plans** - REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** - REQUIRED for cleanup after work complete
