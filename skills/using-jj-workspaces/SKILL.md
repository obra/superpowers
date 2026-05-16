---
name: using-jj-workspaces
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or jj workspace fallback
---

# Using Jujutsu Workspaces

## Overview

Ensure work happens in an isolated workspace. Prefer your platform's native worktree/workspace tools. Fall back to `jj workspace add` only when no native tool is available.

**Core principle:** Detect existing isolation first. Then use native tools. Then fall back to jj. Never fight the harness.

**Announce at start:** "I'm using the using-jj-workspaces skill to set up an isolated workspace."

## Step 0: Detect Existing Isolation

**Before creating anything, check if you are already in an isolated workspace.**

```bash
JJ_ROOT=$(jj workspace root 2>/dev/null)
```

**If `JJ_ROOT` is empty:** Not in a jj repo. Either initialize one (`jj git init --colocate` in an existing git repo) or treat as a normal git checkout and skip ahead to Step 3.

**Otherwise, identify whether this is the main or a linked workspace:**

```bash
# Linked workspaces have a *file* at .jj/repo pointing back to the main repo.
# The main workspace has a *directory* at .jj/repo.
if [ -f "$JJ_ROOT/.jj/repo" ]; then
  WORKSPACE_KIND=linked
else
  WORKSPACE_KIND=main
fi

CHANGE_ID=$(jj log -r @ --no-graph -T 'change_id.short() ++ "\n"' 2>/dev/null)
BOOKMARKS=$(jj log -r @ --no-graph -T 'bookmarks.join(",") ++ "\n"' 2>/dev/null)
```

**If `WORKSPACE_KIND=linked`:** You are already in a linked jj workspace. Skip to Step 3 (Project Setup). Do NOT create another workspace.

Report with state:
- Bookmark attached: "Already in isolated workspace at `<path>` on bookmark `<name>`."
- No bookmark (anonymous change): "Already in isolated workspace at `<path>` (anonymous change `<change_id>`, externally managed). Bookmark creation needed at finish time."

**If `WORKSPACE_KIND=main`:** You are in the main checkout.

Has the user already indicated their workspace preference in your instructions? If not, ask for consent before creating a workspace:

> "Would you like me to set up an isolated workspace? It protects your current working copy from changes."

Honor any existing declared preference without asking. If the user declines consent, work in place and skip to Step 3.

## Step 1: Create Isolated Workspace

**You have two mechanisms. Try them in this order.**

### 1a. Native Worktree Tools (preferred)

The user has asked for an isolated workspace (Step 0 consent). Do you already have a way to create a worktree? It might be a tool with a name like `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree` flag. If you do, use it and skip to Step 3.

Native tools handle directory placement, bookmark creation, and cleanup automatically. Running `jj workspace add` when you have a native tool creates phantom state your harness can't see or manage.

Only proceed to Step 1b if you have no native worktree tool available.

### 1b. jj workspace Fallback

**Only use this if Step 1a does not apply** — you have no native workspace tool available. Create a workspace manually using jj.

#### Directory Selection

Follow this priority order. Explicit user preference always beats observed filesystem state.

1. **Check your instructions for a declared workspace directory preference.** If the user has already specified one, use it without asking.

2. **Check for an existing project-local workspace directory:**
   ```bash
   ls -d .worktrees 2>/dev/null     # Preferred (hidden)
   ls -d worktrees 2>/dev/null      # Alternative
   ```
   If found, use it. If both exist, `.worktrees` wins.

3. **Check for an existing global directory:**
   ```bash
   project=$(basename "$(jj workspace root)")
   ls -d ~/.config/superpowers/worktrees/$project 2>/dev/null
   ```
   If found, use it (backward compatibility with legacy global path).

4. **If there is no other guidance available**, default to `.worktrees/` at the project root.

#### Safety Verification (project-local directories only)

**MUST verify directory is ignored before creating workspace:**

```bash
# In a colocated jj+git repo, .gitignore still governs file visibility.
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:** Add to `.gitignore`, commit the change (`jj commit -m "ignore worktrees"`), then proceed.

**Why critical:** Prevents accidentally tracking workspace contents from the main workspace.

Global directories (`~/.config/superpowers/worktrees/`) need no verification.

#### Create the Workspace

```bash
project=$(basename "$(jj workspace root)")

# Determine path based on chosen location
# For project-local: path="$LOCATION/$BOOKMARK_NAME"
# For global:        path="$HOME/.config/superpowers/worktrees/$project/$BOOKMARK_NAME"

jj workspace add --name "$BOOKMARK_NAME" "$path"
cd "$path"

# Place a bookmark on the workspace's working-copy change so it can be
# pushed/merged later. (Skip if your finishing flow uses anonymous changes.)
jj bookmark create "$BOOKMARK_NAME" -r @
```

**Sandbox fallback:** If `jj workspace add` fails with a permission error (sandbox denial), tell the user the sandbox blocked workspace creation and you're working in the current directory instead. Then run setup and baseline tests in place.

## Step 3: Project Setup

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

## Step 4: Verify Clean Baseline

Run tests to ensure workspace starts clean:

```bash
# Use project-appropriate command
npm test / cargo test / pytest / go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### Report

```
Workspace ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| Already in linked workspace (`.jj/repo` is a file) | Skip creation (Step 0) |
| Not in a jj repo at all | `jj git init --colocate` or treat as normal repo |
| Native worktree tool available | Use it (Step 1a) |
| No native tool | `jj workspace add` fallback (Step 1b) |
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check instruction file, then default `.worktrees/` |
| Global path exists | Use it (backward compat) |
| Directory not ignored | Add to `.gitignore` + commit |
| Permission error on create | Sandbox fallback, work in place |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Fighting the harness

- **Problem:** Using `jj workspace add` (or `git worktree add`) when the platform already provides isolation
- **Fix:** Step 0 detects existing isolation. Step 1a defers to native tools.

### Skipping detection

- **Problem:** Creating a nested workspace inside an existing one
- **Fix:** Always run Step 0 before creating anything

### Skipping ignore verification

- **Problem:** Workspace contents get tracked, pollute working-copy snapshots
- **Fix:** Always verify the directory is gitignored before creating a project-local workspace

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > global legacy > instruction file > default

### Forgetting to create a bookmark

- **Problem:** Anonymous changes have no name to push, merge, or hand off later
- **Fix:** Run `jj bookmark create <name> -r @` right after `jj workspace add`

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

## Red Flags

**Never:**
- Create a workspace when Step 0 detects existing isolation
- Use `jj workspace add` when you have a native workspace tool (e.g., `EnterWorktree`). This is the #1 mistake — if you have it, use it.
- Skip Step 1a by jumping straight to Step 1b's jj commands
- Create a workspace without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking

**Always:**
- Run Step 0 detection first
- Prefer native tools over jj fallback
- Follow directory priority: existing > global legacy > instruction file > default
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline
