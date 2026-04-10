---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - detects environment, offers worktree isolation when appropriate
---

# Using Git Worktrees

## Overview

Detect the workspace environment. Work in place by default. Offer worktree isolation when the user would benefit, but only create one when they explicitly ask.

**Core principle:** Detect first. Default to working in place. Create worktrees only on explicit user request. Never fight the harness.

**Announce at start:** "I'm using the using-git-worktrees skill to check the workspace."

## Step 1: Detect Existing Isolation

**Before anything else, check if you are already in an isolated workspace.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**Submodule guard:** `GIT_DIR != GIT_COMMON` is also true inside git submodules. Before concluding "already in a worktree," verify you are not in a submodule:

```bash
# If this returns a path, you're in a submodule, not a worktree — treat as normal repo
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**If `GIT_DIR != GIT_COMMON` (and not a submodule):** You are already in a linked worktree. Skip to Step 4 (Project Setup). Do NOT create another worktree.

Report with branch state:
- On a branch: "Already in isolated workspace at `<path>` on branch `<name>`."
- Detached HEAD: "Already in isolated workspace at `<path>` (detached HEAD, externally managed). Branch creation needed at finish time."

**If `GIT_DIR == GIT_COMMON` (or in a submodule):** You are in a normal repo checkout. Proceed to Step 2.

## Step 2: Offer Workspace Options

**The default path is to work in place on your current branch.** Do NOT create a worktree unless the user explicitly asks for one.

```bash
# Report current state to the user
echo "Current branch: $BRANCH"
echo "Repository: $(basename "$(git rev-parse --show-toplevel)")"
```

Tell the user their options, then **wait for a reply**:

> "You're on `<branch>` in `<repo>`. I can set up an isolated worktree, or we can work directly here. What do you prefer?"

**Routing:**
- **User explicitly asks for a worktree** → proceed to Step 3
- **User says work in place** → skip to Step 4
- **User gives no clear worktree preference** → skip to Step 4 (default is in-place)
- **Silence or unrelated reply** → ask once more, then skip to Step 4 if still unclear

The default is always Step 4. Step 3 requires an explicit "yes, create a worktree" from the user.

## Step 3: Create Worktree

**You only reach this step because the user explicitly asked for a worktree in Step 2.**

You have two mechanisms. Try them in this order.

### 3a. Native Worktree Tools (preferred)

Do you already have a way to create a worktree? It might be a tool with a name like `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree` flag. If you do, use it and skip to Step 4.

Native tools handle directory placement, branch creation, and cleanup automatically. Using `git worktree add` when you have a native tool creates phantom state your harness can't see or manage.

Only proceed to Step 3b if you have no native worktree tool available.

### 3b. Git Worktree Fallback

**Only use this if Step 3a does not apply** — you have no native worktree tool available. Create a worktree manually using git.

#### Directory Selection

Follow this priority order. Explicit user preference always beats observed filesystem state.

1. **Check your instructions for a declared worktree directory preference.** If the user has already specified one, use it without asking.

2. **Check for an existing project-local worktree directory:**
   ```bash
   ls -d .worktrees 2>/dev/null     # Preferred (hidden)
   ls -d worktrees 2>/dev/null      # Alternative
   ```
   If found, use it. If both exist, `.worktrees` wins.

3. **Check for an existing global directory:**
   ```bash
   project=$(basename "$(git rev-parse --show-toplevel)")
   ls -d ~/.config/superpowers/worktrees/$project 2>/dev/null
   ```
   If found, use it (backward compatibility with legacy global path).

4. **If there is no other guidance available**, default to `.worktrees/` at the project root.

#### Safety Verification (project-local directories only)

**MUST verify directory is ignored before creating worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:** Add to .gitignore, commit the change, then proceed.

**Why critical:** Prevents accidentally committing worktree contents to repository.

Global directories (`~/.config/superpowers/worktrees/`) need no verification.

#### Create the Worktree

```bash
project=$(basename "$(git rev-parse --show-toplevel)")

# Determine path based on chosen location
# For project-local: path="$LOCATION/$BRANCH_NAME"
# For global: path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"

git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**Sandbox fallback:** If `git worktree add` fails with a permission error (sandbox denial), tell the user the sandbox blocked worktree creation and you're working in the current directory instead. Then run setup and baseline tests in place.

## Step 4: Project Setup

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

## Step 5: Verify Clean Baseline

Run tests to ensure workspace starts clean:

```bash
# Use project-appropriate command
npm test / cargo test / pytest / go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### Report

If working in a worktree:
```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

If working in place:
```
Working in place on <branch> at <path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| Already in linked worktree | Skip creation, go to Step 4 (Step 1) |
| In a submodule | Treat as normal repo (Step 1 guard) |
| Normal repo, user wants in-place | Work in place, go to Step 4 (Step 2 default) |
| Normal repo, user asks for worktree | Create worktree (Step 3) |
| Native worktree tool available | Use it (Step 3a) |
| No native tool | Git worktree fallback (Step 3b) |
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check instruction file, then default `.worktrees/` |
| Global path exists | Use it (backward compat) |
| Directory not ignored | Add to .gitignore + commit |
| Permission error on create | Sandbox fallback, work in place |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |
| User gives no worktree preference | Work in place (Step 2 default) |
| Plan touches multiple repos | Offer a matching worktree per repo, same branch name |

## Common Mistakes

### Creating a worktree without being asked

- **Problem:** Agent creates a worktree because the skill was invoked, without the user requesting one
- **Fix:** Step 2 defaults to working in place. Only Step 3 creates, and only after explicit user request.

### Fighting the harness

- **Problem:** Using `git worktree add` when the platform already provides isolation
- **Fix:** Step 1 detects existing isolation. Step 3a defers to native tools.

### Skipping detection

- **Problem:** Creating a nested worktree inside an existing one
- **Fix:** Always run Step 1 before creating anything

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > global legacy > instruction file > default

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

## Red Flags

**Never:**
- Create a worktree without the user explicitly asking for one
- Create a worktree when Step 1 detects existing isolation
- Use `git worktree add` when you have a native worktree tool (e.g., `EnterWorktree`). This is the #1 mistake — if you have it, use it.
- Skip Step 3a by jumping straight to Step 3b's git commands
- Create worktree without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking
- Infer worktree consent from the task description, plan, or skill invocation — only an explicit user reply counts

**Always:**
- Run Step 1 detection first
- Default to working in place (Step 2 → Step 4)
- Only create a worktree after explicit user request
- Prefer native tools over git fallback
- Follow directory priority: existing > global legacy > instruction file > default
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Called by:**
- **subagent-driven-development** - Ensures isolated workspace (creates one or verifies existing)
- **executing-plans** - Ensures isolated workspace (creates one or verifies existing)
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** - REQUIRED for cleanup after work complete
