---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection Process

Follow this priority order:

### 0. Check for gtr (git-worktree-runner)

```bash
test -f .gtrconfig && command -v git-gtr >/dev/null 2>&1
```

**If `.gtrconfig` exists AND `git gtr` is installed:** This project uses [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner).
Delegate ALL worktree operations to `git gtr` and **skip all manual steps below** (Steps 1–3).
**`.gtrconfig` takes absolute precedence** over `.worktrees/` or `worktrees/` directories — even if they exist.

- **Create:** `git gtr new <BRANCH_NAME> --yes`
- **Location:** gtr places worktrees at `<repo-root>-worktrees/<branch>` automatically (outside the repo root)
- **Setup:** gtr runs `[hooks] postCreate` commands from `.gtrconfig` (dependency install, file copy, etc.)
  - If `.gtrconfig` has **no** `postCreate` hooks, fall back to Step 3 (Run Project Setup) for dependency installation
- **Baseline tests:** Still run tests after gtr completes to verify clean state
- **Report (suggest to user, do NOT execute):** `git gtr editor <branch>` to open in editor, or `git gtr ai <branch>` to start a new AI session in the worktree

**Error handling:** If `git gtr new` fails (parse error, config issue, etc.):
1. Report the error output to the user
2. Ask whether to (a) fix `.gtrconfig` and retry, or (b) fall back to manual worktree creation (continue from Step 1)

**If `.gtrconfig` exists but `git gtr` is NOT installed:**
- Warn: ".gtrconfig found but git-gtr is not installed. Install from https://github.com/coderabbitai/git-worktree-runner"
- Ask user: install gtr, or proceed with manual worktree creation (Steps 1–3)?

**Skip to:** "Verify Clean Baseline" (Step 4) after successful `git gtr new` — unless postCreate hooks are absent (then do Step 3 first).

### 1. Check Existing Directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

> **Note:** If Step 0 matched (`.gtrconfig` detected with `git gtr` available), skip this step entirely. `.gtrconfig` always takes precedence over `.worktrees/` or `worktrees/`.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no CLAUDE.md preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

## Safety Verification

> **Note:** If using gtr (Step 0), this section does not apply — gtr places worktrees outside the repository root at `<repo-root>-worktrees/`, so `.gitignore` verification is unnecessary.

### For Project-Local Directories (.worktrees or worktrees)

**MUST verify directory is ignored before creating worktree:**

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:**

Per Jesse's rule "Fix broken things immediately":
1. Add appropriate line to .gitignore
2. Commit the change
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to repository.

### For Global Directory (~/.config/superpowers/worktrees)

No .gitignore verification needed - outside project entirely.

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Worktree

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.gtrconfig` + `git gtr` installed | Use `git gtr new --yes` (skip Steps 1–3, gtr takes precedence) |
| `.gtrconfig` but no `git gtr` | Warn user, offer install or manual fallback |
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check CLAUDE.md → Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > CLAUDE.md > ask

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

### Ignoring .gtrconfig

- **Problem:** Manual worktree creation overrides project's gtr conventions, creates worktree at wrong path
- **Fix:** Always check for `.gtrconfig` first; if present and `git gtr` is installed, use `git gtr new --yes`

### Running git gtr ai in current session

- **Problem:** Spawns a nested AI instance inside the existing Claude session
- **Fix:** Only SUGGEST `git gtr ai <branch>` to the user; never execute it yourself

## Example Workflow

### gtr Project (.gtrconfig present)

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check .gtrconfig - exists]
[Check git gtr installed - confirmed]
[Run: git gtr new feature/auth --yes]
[gtr copies .env.example, remotion/public/jingle, remotion/public/bg, .claude/hooks]
[gtr runs postCreate hooks: pnpm install --frozen-lockfile, cp .env.example .env, copy-claude-memory.sh]
[Run tests - 47 passing]

Worktree ready at /home/user/myproject-worktrees/feature-auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
Suggest to user: git gtr editor feature/auth or git gtr ai feature/auth
```

### Manual Project (no .gtrconfig)

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check .gtrconfig - not found]
[Check .worktrees/ - exists]
[Verify ignored - git check-ignore confirms .worktrees/ is ignored]
[Create worktree: git worktree add .worktrees/auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Red Flags

**Never:**
- Create worktree without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Skip CLAUDE.md check
- Use manual `git worktree add` when `.gtrconfig` exists and `git gtr` is available
- Run `git gtr ai` or `git gtr editor` yourself (suggest to user only)

**Always:**
- Follow directory priority: existing > CLAUDE.md > ask
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline
- Check for `.gtrconfig` before any manual worktree operation
- Use `--yes` flag with `git gtr new` to avoid interactive prompts

## Integration

**Called by:**
- **brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows
- **subagent-driven-development** - REQUIRED before executing any tasks
- **executing-plans** - REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** - REQUIRED for cleanup after work complete

**gtr path note:** When gtr is used, the worktree path is determined by gtr output (typically `<repo-root>-worktrees/<branch>`), not `.worktrees/<branch>`. Calling skills must use the reported path, not assume a fixed location.

**Follow-up needed:** `finishing-a-development-branch` (Step 5) currently uses `git worktree remove <path>` for cleanup. For gtr-created worktrees, `git gtr rm <branch>` should be used instead to properly run `preRemove` hooks and clean up gtr-managed resources. A separate update to that skill is required.
