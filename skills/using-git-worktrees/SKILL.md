---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees as sibling directories with per-worktree dependencies
license: MIT
metadata:
  author: obra
  version: "1.0"
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository. One branch per worktree, one agent per worktree.

**Core principle:** Sibling directories + per-worktree dependencies + proper cleanup = reliable parallel work.

**Important:** Worktrees are a convenience, not a security boundary. They do not prevent an agent from accessing other directories. If you need true confinement, use containers or filesystem permissions.

## Directory Structure

Worktrees go as **sibling directories** next to the main working copy, not nested inside it. This prevents agents and IDEs from indexing sibling worktrees.

```
projects/
├── my-app/                    # Main working copy
├── my-app--feature-auth/      # Agent 1 worktree
├── my-app--feature-api/       # Agent 2 worktree
└── my-app--bugfix-login/      # Agent 3 worktree
```

**Naming convention:** `project--branch-name` (double dash separates project from branch).

## Creating a Worktree

### 1. Determine Paths

```bash
PROJECT_DIR="$(git rev-parse --show-toplevel)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
BRANCH_NAME="feature/your-feature"
SAFE_BRANCH="$(echo "$BRANCH_NAME" | tr '/' '-')"
WORKTREE_DIR="$(dirname "$PROJECT_DIR")/${PROJECT_NAME}--${SAFE_BRANCH}"
```

### 2. Create Worktree

```bash
git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" main
cd "$WORKTREE_DIR"
```

### 3. Install Dependencies (Per-Worktree)

Each worktree MUST have its own dependency install. Never symlink `node_modules`, `.venv`, or similar — it causes path resolution bugs, race conditions, and wrong dependency versions.

```bash
# Node.js (prefer pnpm for shared content-addressable store)
if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile
elif [ -f package-lock.json ]; then npm ci
elif [ -f yarn.lock ]; then yarn install --frozen-lockfile
elif [ -f package.json ]; then npm install; fi

# Python
if [ -f pyproject.toml ]; then uv sync
elif [ -f requirements.txt ]; then uv pip install -r requirements.txt; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. Configure Environment

Symlink shared secrets, create per-worktree overrides:

```bash
# Shared secrets (symlink from main)
if [ -f "$PROJECT_DIR/.env" ]; then
    ln -s "$PROJECT_DIR/.env" .env
fi

# Per-worktree overrides (unique port)
PORT_OFFSET=$(git worktree list | wc -l)
echo "PORT=$((3000 + PORT_OFFSET))" > .env.local
```

### 5. Verify Clean Baseline

```bash
# Run project-appropriate test command
# If tests fail: report failures, ask whether to proceed
# If tests pass: report ready
```

### 6. Report

```
Worktree ready at <full-path>
Branch: <branch-name>
Tests passing (<N> tests, 0 failures)
```

## Cleanup

**Always use `git worktree remove`, never `rm -rf`.** Deleting the folder leaves stale metadata in `.git/worktrees/`.

```bash
# From any worktree or the main working copy
git worktree remove "$WORKTREE_DIR"
git branch -d "$BRANCH_NAME"   # only if merged; -D to force

# Periodically clean stale entries
git worktree prune
```

## After Merging

When merging agent branches back to main:

1. **Merge one branch at a time** and run tests after each merge
2. **Lockfile conflicts are expected** — if two agents both added dependencies, regenerate the lockfile after merge (`npm install`, `pnpm install`, etc.)
3. **Submodules** need `git submodule update --init` per worktree if used

## What to Watch Out For

| Issue | Solution |
|-------|----------|
| Port collisions | Assign unique ports per worktree via `.env.local` |
| Lockfile merge conflicts | Regenerate lockfile after merge |
| Symlinked `node_modules` | Don't. Use `pnpm` for space savings instead |
| Database collisions | Each worktree needs its own DB if agents run migrations |
| `git gc` during active work | Disable auto-gc or run manually during quiet periods |
| IDE indexing siblings | Open each worktree in a separate window, not the parent |
| Submodules | Run `git submodule update --init` per worktree |

## Quick Reference

| Command | Purpose |
|---------|---------|
| `git worktree add -b BRANCH PATH main` | Create worktree with new branch |
| `git worktree list` | Show all worktrees |
| `git worktree remove PATH` | Remove worktree (proper cleanup) |
| `git worktree prune` | Clean stale worktree metadata |

## Integration

**Called by:**
- **brainstorming** — when design is approved and implementation follows
- **executing-plans** — before executing any tasks
- **agent-teams** — for isolating each teammate's work

**Pairs with:**
- **finishing-a-development-branch** — for cleanup after work complete
