---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from the current workspace, before executing implementation plans, or when setting up team member worktrees
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Delegate creation to the platform's native worktree tool when available, then add safety verification on top.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Optional Skip

Some situations don't need a worktree. Check before proceeding:

```
IF user opted out via CLAUDE.md (worktrees: false) OR
   task is a trivial one-file fix AND no team involved:

  Record in state.yml:
    worktree: null

  Skip the rest of this skill.
  Proceed directly to the next step.
```

If skipping, note it explicitly so downstream skills know why `worktree.main.path` is absent.

## Creating the Worktree

**Claude Code:** Use the native `EnterWorktree` tool:

```
EnterWorktree(name: "<feature-name>")
```

**Cursor / Codex / other platforms:** If no native worktree tool is available, create manually:

```bash
git worktree add .worktrees/<feature-name> -b <feature-name>
cd .worktrees/<feature-name>
```

Verify the worktree directory is gitignored before creating:
```bash
git check-ignore -q .worktrees 2>/dev/null || echo ".worktrees/" >> .gitignore
```

The native tool (when available) handles directory selection, branch creation, and gitignore verification automatically.

## After Creation

Once the worktree is created:

### 1. Check CLAUDE.md Preferences

```bash
grep -i "worktree\|setup\|install" CLAUDE.md 2>/dev/null
```

If a setup command is specified, use it. Otherwise auto-detect below.

### 1.5. Copy Environment Files

Worktrees share the git repository but NOT untracked files. Copy these if they exist:

```bash
# From the repo root (worktree.repo_root in state.yml):
REPO_ROOT="$(git rev-parse --show-superproject-working-tree 2>/dev/null || git worktree list --porcelain | head -1 | sed 's/worktree //')"

# Environment files
[ -f "$REPO_ROOT/.env" ] && cp "$REPO_ROOT/.env" .
[ -f "$REPO_ROOT/.env.local" ] && cp "$REPO_ROOT/.env.local" .

# Database configs
[ -f "$REPO_ROOT/database.yml" ] && cp "$REPO_ROOT/database.yml" .

# MCP configuration
[ -d "$REPO_ROOT/.mcp" ] && cp -r "$REPO_ROOT/.mcp" .

# Check CLAUDE.md for project-specific files to copy
```

**If the user's project has unusual env files, ask which ones to copy.**

### 2. Run Project Setup

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

### 3. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Use project-appropriate command — examples:
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures. Ask whether to proceed or investigate first.

**If tests pass:** Continue.

### 4. Record in state.yml

After a successful baseline, write to `.superpowers/state.yml`:

```yaml
worktree:
  main:
    path: <absolute-path-to-worktree>    # from EnterWorktree result
    branch: <branch-name>                # from EnterWorktree result
    repo_root: <absolute-path-to-repo>   # git rev-parse --show-toplevel
```

Also update `phase: executing` if entering execution from here.

```bash
# Get repo root for state.yml
git rev-parse --show-toplevel
```

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
State recorded in .superpowers/state.yml
Ready to implement <feature-name>
```

## Team Mode

When running as a lead with multiple implementers (agent-team-driven-development):

### Per-Implementer Worktrees

**Claude Code:** Each implementer gets their own worktree automatically via `isolation: "worktree"` in their spawn configuration.

**Cursor / Codex / other platforms:** The lead creates worktrees manually for each implementer before dispatching:

```bash
git worktree add .worktrees/<implementer-name> -b <implementer-name>
```

After each implementer's worktree is created, record it in state.yml:

```yaml
worktree:
  implementers:
    react-engineer:
      path: /tmp/.claude/worktrees/wt-abc123
      branch: wt-abc123
      last_sha: ""   # populated after first commit
```

### QA Worktree Strategy

QA agents write test files in the **lead's worktree**, not a separate QA worktree:

- QA tests live in `worktree.main.path`
- Implementers work in their own `worktree.implementers.<role>.path`
- No conflict: test files and implementation files are in different locations

### Between-Wave Merge Workflow

After each implementation wave completes:

```bash
# In lead's worktree
cd <worktree.main.path>

# Merge each implementer's branch
git merge <implementer-branch-1>
git merge <implementer-branch-2>

# Verify all tests still pass
npm test   # or project equivalent

# Update state.yml: clear implementer entries that are merged
```

Next wave's implementers branch from the merged result.

## Common Mistakes

### Reimplementing directory selection

- **Problem:** Hard-codes `.worktrees/` logic that conflicts with native tool
- **Fix:** Use `EnterWorktree` — it handles directory selection

### Skipping baseline verification

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Always run tests after setup, before implementing

### Proceeding with failing tests

- **Problem:** Breaks TDD red/green proof — can't confirm fixes later
- **Fix:** Report failures, get explicit permission to proceed

### Forgetting state.yml write

- **Problem:** Cross-session recovery fails; finishing skill can't find repo_root
- **Fix:** Always write `worktree.main.*` before starting work

### Auto-committing .gitignore changes

- **Problem:** Violates user's commit hygiene — don't commit without consent
- **Fix:** If .gitignore needs updating, flag it and ask the user before committing

## Red Flags

**Never:**
- Skip baseline test verification
- Proceed with failing tests without asking
- Commit repository changes (like .gitignore edits) without user consent
- Omit state.yml write after worktree creation

**Always:**
- Check CLAUDE.md for setup preferences
- Auto-detect and run project setup
- Verify clean test baseline
- Record worktree paths in state.yml

## Integration

**Called by:**
- **brainstorming** (after design approval) — REQUIRED before implementation
- **subagent-driven-development** — REQUIRED before executing any tasks
- **executing-plans** — REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** — REQUIRED for cleanup after work complete; uses `worktree.repo_root` from state.yml

**Reads from state.yml:** `worktree: null` (skip signal), phase
**Writes to state.yml:** `worktree.main.*`, `phase: executing`
