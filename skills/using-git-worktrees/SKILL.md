---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from the current workspace or before executing implementation plans, especially when deciding between Codex App worktrees and manual git worktrees
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Codex App compatibility first. If the user is working in Codex App, prefer App-managed worktrees. Use manual `git worktree` only when App-managed flow is unavailable or explicitly not desired.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Workspace Mode Selection

Follow this priority order:

### 1. Prefer Codex App-managed worktrees

If the task is happening in Codex App, or the user mentions Codex App compatibility, do not create a manual git worktree by default.

Instead:
1. Tell the user to use Codex App's built-in "Fork into new worktree" flow.
2. Continue implementation inside that App-managed worktree.

Why:
- Codex App currently appears to manage its own worktree lifecycle.
- Manual worktrees may work fine with Git and Codex CLI, but may not be attachable or switchable from Codex App's built-in worktree UI.

### 2. Reuse the current worktree if already inside one

If the current cwd is already inside a git worktree, use it. Do not create a nested or parallel worktree unless the user explicitly asks.

### 3. Use manual git worktree only as fallback

Create a manual worktree only if one of these is true:
- the user explicitly asks for `git worktree`
- Codex App worktree flow is unavailable
- the task is CLI-only and App compatibility is not required

### 4. Select manual worktree location

When manual mode is required, follow this priority order:

1. Check existing directories:

```bash
ls -d ~/.config/superpowers/worktrees/"$(basename "$(git rev-parse --show-toplevel)")" 2>/dev/null
ls -d .worktrees 2>/dev/null
ls -d worktrees 2>/dev/null
```

If found, use the first match in this order:
- `$HOME/.config/superpowers/worktrees/<project-name>/`
- `.worktrees/`
- `worktrees/`

2. Check `CLAUDE.md`:

```bash
grep -i "worktree.*directory" CLAUDE.md 2>/dev/null
```

If preference specified, use it without asking.

3. Ask the user:

```text
No worktree directory found. Where should I create manual worktrees?

1. ~/.config/superpowers/worktrees/<project-name>/ (preferred for Codex App coexistence)
2. .worktrees/ (project-local)
3. worktrees/ (project-local, visible)

Which would you prefer?
```

**Preferred default:** `$HOME/.config/superpowers/worktrees/<project-name>/`

Why:
- keeps manual worktrees clearly separate from Codex App-managed worktrees
- avoids implying Codex App can manage manually created worktrees
- reduces repository pollution

## Safety Verification For Manual Mode

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

### 2. Choose creation path

#### App-managed mode

- Do not run `git worktree add` yourself by default.
- Tell the user to create the worktree from Codex App.
- Once the App-managed worktree is active, run setup and baseline verification in that directory.

#### Manual git-worktree mode

Determine full path:

```bash
case $LOCATION in
  "$HOME"/.config/superpowers/worktrees/*)
    path="$HOME/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  *)
    echo "Unsupported worktree location: $LOCATION" >&2
    exit 1
    ;;
esac

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
if [ -f uv.lock ]; then uv sync --dev; fi
if [ -f requirements.txt ] && [ ! -f uv.lock ]; then python -m pip install -r requirements.txt; fi
if [ -f pyproject.toml ] && [ ! -f uv.lock ] && [ ! -f requirements.txt ]; then python -m pip install -e .; fi

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
| User cares about Codex App compatibility | Prefer App-managed worktree |
| Already inside a worktree | Reuse it |
| Need manual worktree | Prefer `$HOME/.config/superpowers/worktrees/<project-name>/` |
| `.worktrees/` exists | Use it only in manual mode and verify ignored |
| `worktrees/` exists | Use it only in manual mode and verify ignored |
| Neither exists | Check `CLAUDE.md` → Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |
| Python project with `uv.lock` | Run `uv sync --dev` |

## Common Mistakes

### Treating Codex App and manual worktrees as interchangeable

- **Problem:** Manual `git worktree` directories may not be manageable from Codex App's built-in worktree UI
- **Fix:** If Codex App compatibility matters, use App-managed worktrees first

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming project-local directories should be the default

- **Problem:** Creates confusion with Codex App-managed worktrees and increases repo clutter
- **Fix:** In manual mode, prefer `$HOME/.config/superpowers/worktrees/<project-name>/` unless the project already standardizes on a local directory

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[User is working in Codex App]
[Prefer App-managed worktree]
[User creates worktree via "Fork into new worktree"]
[Run project setup inside the new worktree]
[Run baseline tests]

Worktree ready at <app-managed-worktree-path>
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Red Flags

**Never:**
- Create a manual git worktree first when Codex App compatibility is required
- Create worktree without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Skip CLAUDE.md check

**Always:**
- Prefer App-managed worktrees when the user is using Codex App
- Reuse an existing worktree instead of creating another one unnecessarily
- In manual mode, prefer global worktree storage before project-local directories
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Called by:**
- **brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows
- **subagent-driven-development** - REQUIRED before executing any tasks
- **executing-plans** - REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** - REQUIRED for cleanup after work complete
