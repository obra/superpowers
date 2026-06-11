# Loop State Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `loop-state` skill that defines cross-session loop state as factual summaries, external cursors, and worktree provenance.

**Architecture:** Add one static shell test that verifies the skill's discovery metadata and core content, then add `skills/loop-state/SKILL.md`. The first implementation is documentation-only: no runtime state engine, automation, MCP connector, or database.

**Tech Stack:** Markdown skill documentation and Bash static tests.

---

## File Structure

- Create `tests/loop-state/test-loop-state-skill.sh` - static validation for the new skill.
- Create `skills/loop-state/SKILL.md` - the skill body with storage layout, entity state, loop summaries, worktree state, resume/reconcile workflow, and red lines.

## Task 1: Add Failing Static Test

**Files:**
- Create: `tests/loop-state/test-loop-state-skill.sh`
- Test target: `skills/loop-state/SKILL.md`

- [ ] **Step 1: Write the failing test**

Create `tests/loop-state/test-loop-state-skill.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILL="$ROOT/skills/loop-state/SKILL.md"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[PASS] $1"
}

contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if ! grep -Fq "$pattern" "$file"; then
    fail "$label missing '$pattern'"
  fi
}

[[ -f "$SKILL" ]] || fail "Missing skill: $SKILL"

contains "$SKILL" "name: loop-state" "frontmatter name"
contains "$SKILL" "description: Use when" "frontmatter description"
contains "$SKILL" "cross-session" "trigger wording"
contains "$SKILL" "external events" "trigger wording"
contains "$SKILL" "State is facts, not plans" "core principle"
contains "$SKILL" ".superpowers/state/" "storage layout"
contains "$SKILL" "entities/" "entity storage"
contains "$SKILL" "loops/" "loop summary storage"
contains "$SKILL" "worktrees/" "worktree storage"
contains "$SKILL" "worktree_id" "worktree identity"
contains "$SKILL" "last_observed" "external cursor"
contains "$SKILL" "timeline_cursor" "timeline cursor"
contains "$SKILL" "Loop Summary" "loop summary template"
contains "$SKILL" "Resume and Reconcile" "resume workflow"
contains "$SKILL" "source of truth" "external ownership"
contains "$SKILL" "Do not store" "red lines"
contains "$SKILL" "next_step" "planner-field prohibition"
contains "$SKILL" "next_trigger" "planner-field prohibition"
contains "$SKILL" "full chat transcripts" "transcript prohibition"

if grep -Fq "Next Step:" "$SKILL"; then
  fail "Skill must not define a Next Step field"
fi

if grep -Fq "Next Trigger:" "$SKILL"; then
  fail "Skill must not define a Next Trigger field"
fi

pass "loop-state skill structure is present"
```

- [ ] **Step 2: Make the test executable**

Run: `chmod +x tests/loop-state/test-loop-state-skill.sh`

Expected: no output.

- [ ] **Step 3: Run RED**

Run: `tests/loop-state/test-loop-state-skill.sh`

Expected: fails with `Missing skill`.

## Task 2: Add the Loop State Skill

**Files:**
- Create: `skills/loop-state/SKILL.md`
- Test: `tests/loop-state/test-loop-state-skill.sh`

- [ ] **Step 1: Add the skill**

Create `skills/loop-state/SKILL.md` with frontmatter:

```markdown
---
name: loop-state
description: Use when ending or resuming cross-session agent loops that must remember facts about PRs, issues, branches, worktrees, external events, decisions, or verification without turning notes into a task plan
---
```

The body must include:

- Core principle: state is facts, not plans.
- Storage layout under `.superpowers/state/`.
- Entity state JSON example.
- Loop summary Markdown template.
- Worktree state JSON example with `worktree_id`.
- Resume and reconcile workflow.
- Red lines forbidding planner fields, transcripts, secrets, and local copies of external systems.

- [ ] **Step 2: Run GREEN**

Run: `tests/loop-state/test-loop-state-skill.sh`

Expected: `[PASS] loop-state skill structure is present`.

## Task 3: Validate Related Fast Tests

**Files:**
- Test: `tests/opencode/run-tests.sh`

- [ ] **Step 1: Run targeted OpenCode static tests**

Run: `tests/opencode/run-tests.sh`

Expected: `STATUS: PASSED`.

- [ ] **Step 2: Inspect git diff**

Run: `git diff -- docs/superpowers/specs/2026-06-11-loop-state-design.md docs/superpowers/plans/2026-06-11-loop-state.md tests/loop-state/test-loop-state-skill.sh skills/loop-state/SKILL.md`

Expected: diff is limited to the design doc, implementation plan, test, and new skill.
