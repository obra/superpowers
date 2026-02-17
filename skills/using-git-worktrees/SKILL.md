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

### 1. Check Existing Directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

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

## Multi-Worktree Readiness Audit

**REQUIRED before creating multiple worktrees.** Parallel worktrees share a machine, and many project conventions assume a single working copy. Audit and resolve these before creating any worktrees for multi-feature work.

### Git Habits That Break

| Habit | Problem | Fix |
|-------|---------|-----|
| `git add .` or `git add -A` | Stages files from the wrong context if run from the wrong directory | Always use explicit file paths: `git add src/auth/login.ts` |
| `git checkout <branch>` | Worktrees lock their branch — you can't check out a branch that another worktree has checked out | Never switch branches inside a worktree. Each worktree owns its branch. |
| `git stash` | Stash is global across worktrees — stashing in one can leak into another | Avoid stash in multi-worktree setups. Commit or discard instead. |
| Relative paths in scripts | Scripts using `../` or assuming repo root may resolve incorrectly | Use `git rev-parse --show-toplevel` to get the worktree's root |

### Port and Service Conflicts

Multiple worktrees running dev servers, watchers, or test suites will fight over shared ports and resources.

**Audit checklist:**

```bash
# Search for hardcoded ports in project config
grep -rn "port" .env* vite.config.* webpack.config.* next.config.* docker-compose.* 2>/dev/null
grep -rn "PORT" package.json Makefile 2>/dev/null
```

**Common conflicts and mitigations:**

| Resource | Problem | Mitigation |
|----------|---------|------------|
| Dev server port (3000, 8080, etc.) | Two worktrees can't bind the same port | Use `PORT=0` for random port, or assign per-worktree: `PORT=300N` |
| Database | Shared local DB means shared state | Use per-worktree DB name, or use Docker with unique container names |
| Docker containers | Name collisions, port conflicts | Prefix container names with worktree/feature name |
| File watchers (webpack, vite, tsc) | Multiple watchers on overlapping paths can thrash | Only run watchers in the worktree you're actively working in |
| Lock files (`.lock`, `pidfile`) | Process in one worktree blocks another | Use per-worktree lock paths, or check for locks before starting |

**If the project can't easily support parallel servers:** Note this in the coordination manifest. The orchestrator should run dependency and feature worktrees sequentially rather than in parallel, or accept that only one worktree runs a dev server at a time.

### Platform-Specific Isolation

Some platforms require more than just a separate directory — they need entirely separate environments.

**Salesforce / SFDX:**
- Each feature worktree likely needs its own scratch org
- Create orgs before feature execution: `sf org create scratch --alias feature-1-org`
- Map worktree → org in the coordination manifest so agents authenticate to the right org
- Scratch org limits may constrain how many features can run in parallel

**Mobile (iOS/Android):**
- Simulators and emulators bind to specific ports and device IDs
- Build caches (DerivedData, Gradle build dir) should be per-worktree
- CocoaPods / Gradle dependencies need separate install per worktree

### Dependency Installation

Each worktree is a separate directory tree. Dependency managers install into the worktree, not globally (usually). Every worktree needs its own install.

| Ecosystem | What to watch for |
|-----------|-------------------|
| **Node.js** | `node_modules/` is per-worktree — `npm install` in each. If using a lockfile, all worktrees get the same versions (good). If using workspaces or monorepo tools (nx, turbo), verify they resolve paths relative to the worktree root, not a hardcoded parent. |
| **Python** | Virtual environments are per-directory. Create a separate venv per worktree: `python -m venv .venv` in each. If using `pyenv` with `.python-version`, the file is shared via git — that's fine, but the venv is not. Poetry and pipenv create envs keyed to directory path, so they naturally isolate. |
| **Rust** | `target/` is per-worktree by default. No special handling needed. Cargo caches are global and shared safely. |
| **Go** | Module cache is global and shared safely. `go build` outputs are per-directory. No special handling. |
| **Java/Kotlin** | Gradle and Maven caches are global. Build dirs (`.gradle/`, `target/`) are per-worktree. Watch for Gradle daemon port conflicts if running parallel builds. |
| **Ruby** | Bundler installs to `vendor/bundle` per-worktree if configured. Run `bundle install` in each worktree. |

### Environment Files

`.env` files are typically gitignored and won't exist in new worktrees. The orchestrator must handle this:

```bash
# After creating each worktree, copy environment config
cp .env "$WORKTREE_DIR/feature-1/.env"

# Or if env differs per feature (different ports, different DB names):
# Create a modified .env per worktree
sed 's/PORT=3000/PORT=3001/' .env > "$WORKTREE_DIR/feature-1/.env"
```

**If `.env` contains secrets:** Ask the user rather than copying automatically. Never commit `.env` files.

### The Readiness Report

After auditing, present findings before creating worktrees:

```
Multi-worktree readiness audit:

✅ No port conflicts found (project uses PORT env var)
✅ node_modules will install per-worktree
⚠️  .env not tracked — will copy to each worktree
⚠️  docker-compose.yml uses hardcoded container name "app-db"
   → Will need unique names per worktree, or run sequentially
❌ Salesforce project — each worktree needs its own scratch org
   → Will create scratch orgs before feature execution

Proceed with worktree creation? Or address issues first?
```

**If blockers found:** Fix them before creating worktrees. This might mean:
- Adding port configuration support to the project
- Creating a `.env.template` that uses dynamic values
- Documenting scratch org creation in the coordination manifest
- Deciding to run features sequentially instead of in parallel

These fixes become tasks in the shared dependency plan or in the coordination manifest's setup phase.

## Multi-Feature Worktrees

When a coordination manifest exists (multi-feature mode), each feature and each shared dependency gets its own worktree. The orchestrator creates them all up front — **after the readiness audit above passes.**

### Creating Multiple Worktrees

Follow the same directory selection and safety verification as single worktrees. Create one worktree per plan entry:

```bash
# From the manifest — shared dependencies first
git worktree add "$WORKTREE_DIR/shared-dep-1" -b feature/shared-dep-1
git worktree add "$WORKTREE_DIR/feature-1" -b feature/feature-1
git worktree add "$WORKTREE_DIR/feature-2" -b feature/feature-2
```

Run project setup and baseline tests in each worktree (same as single worktree flow).

Report all worktrees at once:

```
Worktrees ready:
  shared-dep-1  → <full-path>  (tests passing)
  feature-1     → <full-path>  (tests passing)
  feature-2     → <full-path>  (tests passing)
```

### Dependency Distribution

When a shared dependency completes (all tasks done, tests green, reviewed), its changes must be distributed to every dependent feature worktree before those features begin implementation.

**Process:**

```bash
# In the shared dependency worktree — ensure all work is committed
cd "$WORKTREE_DIR/shared-dep-1"
git log --oneline -5  # Verify commits look right

# In each dependent feature worktree — merge the dependency branch
cd "$WORKTREE_DIR/feature-1"
git merge feature/shared-dep-1 --no-edit

# Verify tests still pass after merge
<test command>

# Repeat for each dependent feature worktree
cd "$WORKTREE_DIR/feature-2"
git merge feature/shared-dep-1 --no-edit
<test command>
```

**If merge conflicts occur:**
- Resolve them in the feature worktree
- Conflicts likely mean the dependency and feature touched the same code — escalate to the user
- Do NOT proceed with feature implementation until the merge is clean and tests pass

**If tests fail after merge:**
- The dependency introduced a breaking change for the feature's baseline
- Investigate and fix before proceeding
- This is a sign the dependency's scope may need adjustment

### Worktree Lifecycle in Multi-Feature Mode

| Phase | Action |
|-------|--------|
| Readiness audit | Identify port conflicts, env gaps, platform needs (see above) |
| Remediation | Fix blockers — add port config, create scratch orgs, prepare env files |
| Setup | Create all worktrees (dependencies + features), install deps in each |
| Dependency execution | One agent per dependency worktree |
| Distribution | Merge completed dependency branches into feature worktrees |
| Feature execution | One agent per feature worktree (parallel if readiness allows, sequential otherwise) |
| Integration | Merge feature branches into base in dependency order |
| Cleanup | Remove all worktrees, scratch orgs, temp env files after integration |

### Key Rule: One Agent Per Worktree

Each worktree is a single agent's workspace. The agent works only within that worktree on the plan assigned to it. The orchestrator (lead agent or the user) coordinates between worktrees — agents never reach into another worktree.

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

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

**Always:**
- Follow directory priority: existing > CLAUDE.md > ask
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Called by:**
- **brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows
- **writing-plans** (multi-feature handoff) - Creates all worktrees per coordination manifest
- **subagent-driven-development** - REQUIRED before executing any tasks
- **executing-plans** - REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** - REQUIRED for cleanup after work complete (called per worktree in multi-feature mode)
