# VCS Abstraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let superpowers users choose git or jj as their VCS via a user-level config, with skills referencing a VCS operations mapping doc instead of hardcoding git commands.

**Architecture:** User config at `~/.config/superpowers/config.json` is read by the session-start hook and injected into context. Skills use abstract language for VCS operations; a reference doc (`references/vcs-operations.md`) maps abstract operations to concrete commands per VCS. Two skills are renamed to VCS-neutral names.

**Tech Stack:** Bash (hooks), Markdown (skills, reference doc)

---

## File Structure

| File | Responsibility | Action |
|------|---------------|--------|
| `skills/using-superpowers/references/vcs-operations.md` | Maps abstract VCS operations to git/jj commands | Create |
| `hooks/session-start` | Session bootstrap, now also injects VCS preference | Modify |
| `tests/claude-code/test-session-start-vcs.sh` | Tests VCS config reading in session-start hook | Create |
| `skills/using-workspaces/SKILL.md` | Workspace isolation skill (replaces using-git-worktrees) | Create (rename + rewrite) |
| `skills/finishing-development-work/SKILL.md` | Development completion skill (replaces finishing-a-development-branch) | Create (rename + rewrite) |
| `skills/requesting-code-review/SKILL.md` | Code review dispatch | Modify |
| `skills/requesting-code-review/code-reviewer.md` | Code reviewer template | Modify |
| `skills/writing-plans/SKILL.md` | Plan writing skill | Modify |
| `skills/subagent-driven-development/SKILL.md` | Subagent orchestration | Modify |
| `skills/subagent-driven-development/code-quality-reviewer-prompt.md` | Code quality reviewer template | Modify |
| `skills/executing-plans/SKILL.md` | Plan execution skill | Modify |
| `skills/using-superpowers/references/codex-tools.md` | Codex platform mapping | Modify |
| `README.md` | Project overview | Modify |

---

### Task 1: Create VCS Operations Reference Doc

**Files:**
- Create: `skills/using-superpowers/references/vcs-operations.md`

- [ ] **Step 1: Create the reference doc**

```markdown
# VCS Operations Reference

Skills describe VCS operations abstractly. Use the column matching your VCS (injected as `VCS: git` or `VCS: jj` in session context) for concrete commands.

## Key Conceptual Differences

Before using the command table, understand how the two VCS models differ:

- **No staging area in jj.** The working copy is automatically tracked. `jj describe` sets the commit message for the current change; `jj new` starts a new change. This replaces git's add/commit workflow.
- **Bookmarks, not branches.** jj "bookmarks" map to git branches on push, but they're optional — jj works with anonymous revisions by default. You only need a bookmark when pushing to a remote.
- **Change IDs, not SHAs.** jj identifies revisions by change ID (a stable identifier that survives rewrites). Review commands use revision expressions (`@` for current, `trunk()` for main branch, change IDs) rather than SHA ranges.
- **Workspaces don't auto-create named refs.** Unlike git worktrees (which require a branch), jj workspaces create a new working copy at a revision. Create a bookmark explicitly if you want a named ref.

## Operation Mapping

| Operation | git | jj |
|-----------|-----|-----|
| **Workspace isolation** | | |
| Detect project root | `git rev-parse --show-toplevel` | `jj root` |
| Create isolated workspace | `git worktree add "$path" -b "$BRANCH"` | `jj workspace add "$path"` |
| Remove workspace | `git worktree remove "$path"` | `jj workspace forget "$name" && rm -rf "$path"` |
| List workspaces | `git worktree list` | `jj workspace list` |
| Check if in linked workspace | `GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)` / `GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)` / compare: `GIT_DIR != GIT_COMMON` | `jj workspace list` shows more than one entry |
| **Branching & bookmarks** | | |
| Create named ref | `git checkout -b "$name"` | `jj bookmark create "$name"` |
| Current ref name | `git branch --show-current` | `jj bookmark list --all` (look for bookmark pointing at `@`) |
| Determine base | `git merge-base HEAD main` | `jj log -r 'trunk()' --no-graph -T 'change_id ++ "\n"' \| head -1` |
| **History & review** | | |
| Show diff for range | `git diff $BASE..$HEAD` | `jj diff -r "$rev"` |
| Diff stats for range | `git diff --stat $BASE..$HEAD` | `jj diff --stat -r "$rev"` |
| Log recent history | `git log --oneline` | `jj log --no-graph` |
| Current revision identifier | `git rev-parse HEAD` | `jj log -r @ --no-graph -T 'change_id ++ "\n"' \| head -1` |
| **Committing** | | |
| Stage and commit | `git add <files> && git commit -m "msg"` | `jj describe -m "msg" && jj new` |
| **Integration** | | |
| Merge to base | `git checkout $base && git merge $feature` | `jj new $base_rev $feature_rev` (creates merge commit) |
| Push to remote | `git push -u origin "$branch"` | `jj git push -b "$bookmark"` |
| **Safety** | | |
| Check if directory is ignored | `git check-ignore -q "$dir"` | `git check-ignore -q "$dir"` (jj uses .gitignore) |
| Discard work | `git branch -D "$name"` | `jj abandon "$rev"` |
```

- [ ] **Step 2: Verify the file is in the right location**

Run: `ls skills/using-superpowers/references/`
Expected: `codex-tools.md  vcs-operations.md`

- [ ] **Step 3: Commit**

```bash
git add skills/using-superpowers/references/vcs-operations.md
git commit -m "feat: add VCS operations reference doc for git/jj command mapping"
```

---

### Task 2: Add VCS Config Reading to Session-Start Hook

**Files:**
- Create: `tests/claude-code/test-session-start-vcs.sh`
- Modify: `hooks/session-start:1-57`

- [ ] **Step 1: Write the test script**

Create `tests/claude-code/test-session-start-vcs.sh`:

```bash
#!/usr/bin/env bash
# Tests for VCS config reading in session-start hook
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$(cd "$SCRIPT_DIR/../../hooks" && pwd)/session-start"
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

echo "=== Session-start VCS config tests ==="

# --- Test 1: Default VCS is git when no config file ---
echo "Test 1: Default VCS is git when no config exists"
TMPDIR_T=$(mktemp -d)
HOME_ORIG="$HOME"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "default is git"
else
    fail "default is git — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 2: VCS reads jj from config ---
echo "Test 2: VCS reads jj from config"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"vcs": "jj"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: jj'; then
    pass "reads jj from config"
else
    fail "reads jj from config — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 3: VCS reads git from config ---
echo "Test 3: VCS reads explicit git from config"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"vcs": "git"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "reads git from config"
else
    fail "reads git from config — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 4: Invalid VCS value falls back to git ---
echo "Test 4: Invalid VCS value falls back to git"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"vcs": "svn"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "invalid value falls back to git"
else
    fail "invalid value falls back to git — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 5: Missing vcs key falls back to git ---
echo "Test 5: Config exists but no vcs key"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"other": "value"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "missing key falls back to git"
else
    fail "missing key falls back to git — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

echo ""
if [ "$FAILURES" -eq 0 ]; then
    echo "All tests passed."
    exit 0
else
    echo "$FAILURES test(s) failed."
    exit 1
fi
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash tests/claude-code/test-session-start-vcs.sh`
Expected: Tests 1-5 all FAIL (hook doesn't emit VCS line yet)

- [ ] **Step 3: Add VCS config reading to hooks/session-start**

In `hooks/session-start`, after the `PLUGIN_ROOT` line (line 8) and before the legacy skills check (line 11), add the VCS config reading block:

```bash
# Read VCS preference from user config (default: git)
VCS="git"
SUPERPOWERS_CONFIG="${HOME}/.config/superpowers/config.json"
if [ -f "$SUPERPOWERS_CONFIG" ]; then
    vcs_detected=$(grep -o '"vcs"[[:space:]]*:[[:space:]]*"[^"]*"' "$SUPERPOWERS_CONFIG" 2>/dev/null | grep -o '"[^"]*"$' | tr -d '"' || true)
    if [ "$vcs_detected" = "git" ] || [ "$vcs_detected" = "jj" ]; then
        VCS="$vcs_detected"
    fi
fi
```

Then modify the `session_context` line (currently line 35) to append the VCS context. Change:

```bash
session_context="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n\n${warning_escaped}\n</EXTREMELY_IMPORTANT>"
```

To:

```bash
session_context="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n${using_superpowers_escaped}\n\n${warning_escaped}\n\nVCS: ${VCS}\n\nYour user uses ${VCS} for version control. When skills reference VCS operations, use the ${VCS} column from references/vcs-operations.md for concrete commands.\n</EXTREMELY_IMPORTANT>"
```

Note: No separate variable or `escape_for_json` needed — `$VCS` is just "git" or "jj" (no special characters), and `session_context` uses literal `\n` sequences like the rest of the string.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bash tests/claude-code/test-session-start-vcs.sh`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add tests/claude-code/test-session-start-vcs.sh hooks/session-start
git commit -m "feat: session-start hook reads VCS preference from user config

Reads ~/.config/superpowers/config.json for vcs setting (git or jj).
Injects VCS context into session so all skills see the preference.
Defaults to git. Invalid values fall back to git."
```

---

### Task 3: Rename and Rewrite using-workspaces Skill

**Files:**
- Delete: `skills/using-git-worktrees/SKILL.md`
- Create: `skills/using-workspaces/SKILL.md`

- [ ] **Step 1: Rename the skill directory**

```bash
git mv skills/using-git-worktrees skills/using-workspaces
```

- [ ] **Step 2: Rewrite SKILL.md with VCS-abstract content**

Replace the entire content of `skills/using-workspaces/SKILL.md` with:

```markdown
---
name: using-workspaces
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated workspaces with smart directory selection and safety verification
---

# Using Workspaces

## Overview

Isolated workspaces let you work on multiple tasks simultaneously without interference, sharing the same repository.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-workspaces skill to set up an isolated workspace."

**VCS commands:** All VCS operations below use abstract names. See `references/vcs-operations.md` for the concrete command matching your user's VCS (injected as `VCS: git` or `VCS: jj` in session context).

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
grep -i "worktree.*director\|workspace.*director" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no CLAUDE.md preference:

```
No workspace directory found. Where should I create workspaces?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

## Safety Verification

### For Project-Local Directories (.worktrees or worktrees)

**MUST verify directory is ignored before creating workspace:**

Use the "Check if directory is ignored" operation from `references/vcs-operations.md`.

**If NOT ignored:**

Per Jesse's rule "Fix broken things immediately":
1. Add appropriate line to .gitignore
2. Commit the change
3. Proceed with workspace creation

**Why critical:** Prevents accidentally committing workspace contents to repository.

### For Global Directory (~/.config/superpowers/worktrees)

No .gitignore verification needed - outside project entirely.

## Creation Steps

### 1. Detect Project Name

Use the "Detect project root" operation from `references/vcs-operations.md`, then extract the directory name.

### 2. Create Workspace

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$WORKSPACE_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$WORKSPACE_NAME"
    ;;
esac
```

Use the "Create isolated workspace" operation from `references/vcs-operations.md` with the path and workspace name.

**jj note:** jj workspaces don't automatically create a named ref. If the user wants a named ref (needed for pushing/PRs later), use the "Create named ref" operation to create a bookmark after workspace creation.

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

Run tests to ensure workspace starts clean:

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
Workspace ready at <full-path>
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

- **Problem:** Workspace contents get tracked, pollute status
- **Fix:** Always verify directory is ignored before creating project-local workspace

### Assuming directory location

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > CLAUDE.md > ask

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Example Workflow

```
You: I'm using the using-workspaces skill to set up an isolated workspace.

[Check .worktrees/ - exists]
[Verify ignored - confirmed .worktrees/ is ignored]
[Create workspace using "Create isolated workspace" operation from vcs-operations.md]
[Run npm install]
[Run npm test - 47 passing]

Workspace ready at /Users/jesse/myproject/.worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Red Flags

**Never:**
- Create workspace without verifying it's ignored (project-local)
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
- **subagent-driven-development** - REQUIRED before executing any tasks
- **executing-plans** - REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-development-work** - REQUIRED for cleanup after work complete
```

- [ ] **Step 3: Verify no stale references within the file**

Run: `grep -n "git worktree\|git branch\|git checkout\|git rev-parse" skills/using-workspaces/SKILL.md`
Expected: No matches (all git commands removed from skill, moved to reference doc)

- [ ] **Step 4: Commit**

```bash
git add skills/using-git-worktrees skills/using-workspaces
git commit -m "feat: rename using-git-worktrees to using-workspaces, abstract VCS commands

Skill now uses abstract VCS operation names and references
vcs-operations.md for concrete commands. Workflow logic unchanged.
Adds jj-specific callout for bookmark creation."
```

---

### Task 4: Rename and Rewrite finishing-development-work Skill

**Files:**
- Delete: `skills/finishing-a-development-branch/SKILL.md`
- Create: `skills/finishing-development-work/SKILL.md`

- [ ] **Step 1: Rename the skill directory**

```bash
git mv skills/finishing-a-development-branch skills/finishing-development-work
```

- [ ] **Step 2: Rewrite SKILL.md with VCS-abstract content**

Replace the entire content of `skills/finishing-development-work/SKILL.md` with:

```markdown
---
name: finishing-development-work
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing Development Work

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-development-work skill to complete this work."

**VCS commands:** All VCS operations below use abstract names. See `references/vcs-operations.md` for the concrete command matching your user's VCS (injected as `VCS: git` or `VCS: jj` in session context).

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base

Use the "Determine base" operation from `references/vcs-operations.md` to find the base revision.

Or ask: "This work started from main - is that correct?"

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base> locally
2. Push and create a Pull Request
3. Keep the work as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

Use the "Merge to base" operation from `references/vcs-operations.md`.

Then verify tests on the merged result:
```bash
<test command>
```

If tests pass, the feature ref/branch can be cleaned up.

Then: Cleanup workspace (Step 5)

#### Option 2: Push and Create PR

Use the "Push to remote" operation from `references/vcs-operations.md`.

**jj note:** Ensure a bookmark exists before pushing. If no bookmark was created during workspace setup, use the "Create named ref" operation first.

Then create PR:
```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup workspace (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping work in current state. Workspace preserved at <path>."

**Don't cleanup workspace.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- All work in this workspace
- Revision(s): <revision-list>
- Workspace at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed, use the "Discard work" operation from `references/vcs-operations.md`.

Then: Cleanup workspace (Step 5)

### Step 5: Cleanup Workspace

**For Options 1, 2, 4:**

Check if in a linked workspace using the "Check if in linked workspace" operation from `references/vcs-operations.md`.

If yes, use the "Remove workspace" operation to clean up.

**For Option 3:** Keep workspace.

## Quick Reference

| Option | Merge | Push | Keep Workspace | Cleanup Ref |
|--------|-------|------|----------------|-------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic workspace cleanup**
- **Problem:** Remove workspace when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up workspace for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-workspaces** - Cleans up workspace created by that skill
```

- [ ] **Step 3: Verify no stale references within the file**

Run: `grep -n "git merge\|git checkout\|git push\|git branch\|git worktree\|worktree" skills/finishing-development-work/SKILL.md`
Expected: No matches (all git commands and "worktree" references removed)

- [ ] **Step 4: Commit**

```bash
git add skills/finishing-a-development-branch skills/finishing-development-work
git commit -m "feat: rename finishing-a-development-branch to finishing-development-work, abstract VCS commands

Skill now uses abstract VCS operation names and references
vcs-operations.md for concrete commands. Workflow and 4-option
menu unchanged. Adds jj-specific callout for bookmark creation
before pushing."
```

---

### Task 5: Update requesting-code-review Skill and Template

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md:27-63`
- Modify: `skills/requesting-code-review/code-reviewer.md:22-27`

- [ ] **Step 1: Update SKILL.md — abstract VCS commands and rename placeholders**

In `skills/requesting-code-review/SKILL.md`, replace the section at lines 27-40:

```markdown
**1. Get revision identifiers:**

Use the "Current revision identifier" operation from `references/vcs-operations.md` to get the base and head revisions.

**2. Dispatch code-reviewer subagent:**

Use Task tool with superpowers:code-reviewer type, fill template at `code-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_REV}` - Starting revision
- `{HEAD_REV}` - Ending revision
- `{DESCRIPTION}` - Brief summary
```

Replace the example section at lines 52-63:

```markdown
```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

[Get base revision using "Current revision identifier" from vcs-operations.md]
[Get head revision]

[Dispatch superpowers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_REV: <base-revision-identifier>
  HEAD_REV: <head-revision-identifier>
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
```
```

- [ ] **Step 2: Update code-reviewer.md — abstract VCS commands and rename placeholders**

In `skills/requesting-code-review/code-reviewer.md`, replace lines 22-27:

```markdown
**Base:** {BASE_REV}
**Head:** {HEAD_REV}

Use the "Show diff for range" and "Diff stats for range" operations from `references/vcs-operations.md` to review the changes between BASE_REV and HEAD_REV.
```

- [ ] **Step 3: Verify no stale SHA references**

Run: `grep -n "BASE_SHA\|HEAD_SHA\|git diff\|git log\|git rev-parse" skills/requesting-code-review/`
Expected: No matches

- [ ] **Step 4: Commit**

```bash
git add skills/requesting-code-review/SKILL.md skills/requesting-code-review/code-reviewer.md
git commit -m "feat: abstract VCS commands in requesting-code-review skill

Rename BASE_SHA/HEAD_SHA to BASE_REV/HEAD_REV. Replace hardcoded
git commands with references to vcs-operations.md."
```

---

### Task 6: Update writing-plans Skill

**Files:**
- Modify: `skills/writing-plans/SKILL.md:99-103`

- [ ] **Step 1: Replace the commit step example**

In `skills/writing-plans/SKILL.md`, replace lines 99-103 (the commit step in the task structure example):

```markdown
- [ ] **Step 5: Commit**

Use the "Stage and commit" operation from `references/vcs-operations.md`:
- Stage the test file and implementation file
- Commit with message: "feat: add specific feature"
```

- [ ] **Step 2: Verify no stale git commands in the example**

Run: `grep -n "git add\|git commit" skills/writing-plans/SKILL.md`
Expected: No matches

- [ ] **Step 3: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat: abstract VCS commands in writing-plans skill commit example"
```

---

### Task 7: Update subagent-driven-development Skill and Template

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md:64,83,268,271`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md:15-16`

- [ ] **Step 1: Update SKILL.md — replace old skill name references**

In `skills/subagent-driven-development/SKILL.md`:

Replace all instances of `superpowers:finishing-a-development-branch` with `superpowers:finishing-development-work` (appears in the dot graph at lines 64, 83 and in Integration at line 271).

Replace all instances of `superpowers:using-git-worktrees` with `superpowers:using-workspaces` (appears in Integration at line 268).

Replace the label text `"Use superpowers:finishing-a-development-branch"` in the dot graph with `"Use superpowers:finishing-development-work"`.

- [ ] **Step 2: Update code-quality-reviewer-prompt.md — rename placeholders**

In `skills/subagent-driven-development/code-quality-reviewer-prompt.md`, replace lines 15-16:

```markdown
  BASE_REV: [revision before task]
  HEAD_REV: [current revision]
```

- [ ] **Step 3: Verify no stale references**

Run: `grep -n "using-git-worktrees\|finishing-a-development-branch\|BASE_SHA\|HEAD_SHA" skills/subagent-driven-development/`
Expected: No matches

- [ ] **Step 4: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md skills/subagent-driven-development/code-quality-reviewer-prompt.md
git commit -m "feat: update subagent-driven-development to use renamed skills and REV placeholders"
```

---

### Task 8: Update executing-plans Skill

**Files:**
- Modify: `skills/executing-plans/SKILL.md:35-36,68,70`

- [ ] **Step 1: Update skill name references**

In `skills/executing-plans/SKILL.md`:

Replace line 35:
```markdown
- Announce: "I'm using the finishing-development-work skill to complete this work."
```

Replace line 36:
```markdown
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-development-work
```

Replace line 68:
```markdown
- **superpowers:using-workspaces** - REQUIRED: Set up isolated workspace before starting
```

Replace line 70:
```markdown
- **superpowers:finishing-development-work** - Complete development after all tasks
```

- [ ] **Step 2: Verify no stale references**

Run: `grep -n "using-git-worktrees\|finishing-a-development-branch" skills/executing-plans/SKILL.md`
Expected: No matches

- [ ] **Step 3: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "feat: update executing-plans to reference renamed skills"
```

---

### Task 9: Update codex-tools.md Reference

**Files:**
- Modify: `skills/using-superpowers/references/codex-tools.md:38,76-99`

- [ ] **Step 1: Update placeholder reference**

In `skills/using-superpowers/references/codex-tools.md`, replace `{BASE_SHA}` on line 38 with `{BASE_REV}`:

```markdown
3. Fill any template placeholders (`{BASE_REV}`, `{WHAT_WAS_IMPLEMENTED}`, etc.)
```

- [ ] **Step 2: Update Environment Detection section**

Replace lines 76-99 (the Environment Detection and Codex App Finishing sections) with:

```markdown
## Environment Detection

Skills that create workspaces or finish development work should detect their
environment before proceeding. The approach depends on the user's VCS
(injected as `VCS: git` or `VCS: jj` in session context).

**For git users:**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR from sandbox)

**For jj users:**

```bash
jj workspace list 2>/dev/null
```

- More than one workspace listed → already in a linked workspace (skip creation)
- Check if current workspace has a bookmark: `jj bookmark list --all`

See `using-workspaces` and `finishing-development-work`
for how each skill uses these signals.

## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), the agent commits all work and informs
the user to use the App's native controls:

- **"Create branch"** — names the branch, then commit/push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout

The agent can still run tests, stage files, and output suggested branch
names, commit messages, and PR descriptions for the user to copy.
```

- [ ] **Step 3: Verify no stale references**

Run: `grep -n "using-git-worktrees\|finishing-a-development-branch" skills/using-superpowers/references/codex-tools.md`
Expected: No matches

- [ ] **Step 4: Commit**

```bash
git add skills/using-superpowers/references/codex-tools.md
git commit -m "feat: update codex-tools.md with VCS-conditional environment detection"
```

---

### Task 10: Update README.md

**Files:**
- Modify: `README.md:112,122,144-145`

- [ ] **Step 1: Update Basic Workflow section**

In `README.md`, replace line 112:

```markdown
2. **using-workspaces** - Activates after design approval. Creates isolated workspace, runs project setup, verifies clean test baseline.
```

Replace line 122:

```markdown
7. **finishing-development-work** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up workspace.
```

- [ ] **Step 2: Update Skills Library section**

In `README.md`, replace lines 144-145:

```markdown
- **using-workspaces** - Isolated development workspaces
- **finishing-development-work** - Merge/PR decision workflow
```

- [ ] **Step 3: Verify no stale references**

Run: `grep -n "using-git-worktrees\|finishing-a-development-branch" README.md`
Expected: No matches

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README with renamed skill names"
```
