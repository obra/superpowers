---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

**Important:** Prefer global worktree locations by default to avoid nested-worktree `CLAUDE.md` double-loading.

## Directory Selection Process

Follow this priority order:

### 1. Check CLAUDE.md Preference First

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 2. Reuse Existing Directory Convention

```bash
project=$(basename "$(git rev-parse --show-toplevel)")

# Check existing locations
ls -d "$HOME/.config/superpowers/worktrees/$project" 2>/dev/null  # Preferred (global)
ls -d .worktrees 2>/dev/null                                        # Project-local (hidden)
ls -d worktrees 2>/dev/null                                         # Project-local (visible)
```

**If found:** Reuse that location to keep consistency. If both project-local directories exist, `.worktrees` wins.

### 3. Default to Global Location (Recommended)

If no directory exists and no CLAUDE.md preference, default to:

```bash
~/.config/superpowers/worktrees/<project-name>/
```

**Why default global:** Project-local worktrees can cause parent `CLAUDE.md` files to be loaded in nested worktrees, creating conflicting instructions.

### 4. Ask User If They Need Project-Local

If the user has a strong preference for project-local worktrees, ask explicitly:

```
No existing worktree directory found. I recommend the global location to avoid duplicate CLAUDE.md loading:

1. ~/.config/superpowers/worktrees/<project-name>/ (recommended)
2. .worktrees/ (project-local, hidden)

Which would you prefer?
```

If user has no preference, use option 1.

## Safety Verification

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
| CLAUDE.md specifies location | Use that location |
| Global worktree dir exists | Reuse global location |
| `.worktrees/` exists | Reuse it (verify ignored) |
| `worktrees/` exists | Reuse it (verify ignored) |
| Neither exists | Default to global location |
| User requests project-local | Use `.worktrees/` (verify ignored) |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: CLAUDE.md preference > existing convention > global default > ask if needed

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check CLAUDE.md - no preference]
[No existing worktree dir found]
[Use global default: ~/.config/superpowers/worktrees/myproject/feature-auth]
[Create worktree: git worktree add ~/.config/superpowers/worktrees/myproject/feature-auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/.config/superpowers/worktrees/myproject/feature-auth
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

**Always:**
- Follow directory priority: CLAUDE.md preference > existing convention > global default
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
