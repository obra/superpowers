# Sync Requirements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `sync-requirements` skill that lets completed Superpowers work update durable PRD-style requirements documents at `docs/req/<module>/req.md`.

**Architecture:** This is a behavior-shaping skill change, so the implementation is documentation plus static workflow checks. A new `sync-requirements` skill owns context resolution, durable requirement extraction, module selection, convention-aware merging, and reporting. `finishing-a-development-branch` only prompts after tests pass and delegates the merge workflow to the new skill.

**Tech Stack:** Markdown skill files, bash static regression tests, existing `tests/claude-code/run-skill-tests.sh` runner, repository README workflow docs.

## Global Constraints

- Main requirements documents live at `docs/req/<module>/req.md`.
- The new skill name is exactly `sync-requirements`.
- Dated brainstorming specs remain under `docs/superpowers/specs/`; dated writing plans remain under `docs/superpowers/plans/`.
- The sync workflow must consider active-session user requirements that were added after the original spec or plan.
- Requirement authoring conventions must include `SHALL`, `MUST`, `SHALL NOT`, `MUST NOT`, `### Requirement:`, `#### Scenario:`, and scenario bullets using `**GIVEN**`, `**WHEN**`, `**THEN**`, `**AND**`, and `**BUT**`.
- `**BUT**` is only for prohibited behavior, exceptions, or negative expectations.
- Do not add runtime dependencies or require OpenSpec CLI.
- Do not archive or rewrite dated design specs or implementation plans.
- Use PowerShell-safe command chaining when running commands on Windows; do not use `&&`.

---

## File Structure

- Create `skills/sync-requirements/SKILL.md`: the new skill. It contains the full workflow and authoring conventions.
- Create `tests/claude-code/test-sync-requirements-skill.sh`: static regression test for the skill, finishing-flow prompt, and README workflow docs.
- Modify `tests/claude-code/run-skill-tests.sh`: include the new static test in the fast skill test suite.
- Modify `skills/finishing-a-development-branch/SKILL.md`: add a requirement-sync prompt after test verification and before environment detection.
- Modify `README.md`: document `sync-requirements` in the basic workflow and skills list.

## Task 1: Add `sync-requirements` Skill With Static Guards

**Files:**
- Create: `skills/sync-requirements/SKILL.md`
- Create: `tests/claude-code/test-sync-requirements-skill.sh`
- Modify: `tests/claude-code/run-skill-tests.sh`

**Interfaces:**
- Produces: `skills/sync-requirements/SKILL.md` with frontmatter `name: sync-requirements`.
- Produces: `tests/claude-code/test-sync-requirements-skill.sh`, a bash test that later tasks will extend.
- Consumes: Existing static test style from `tests/claude-code/test-worktree-path-policy.sh`.

- [ ] **Step 1: Write the failing static test for the new skill**

Create `tests/claude-code/test-sync-requirements-skill.sh` with this content:

```bash
#!/usr/bin/env bash
# Regression check: sync-requirements owns durable requirements sync.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SYNC_SKILL="$REPO_ROOT/skills/sync-requirements/SKILL.md"
FINISHING_SKILL="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"
README_FILE="$REPO_ROOT/README.md"

failures=0

assert_file_exists() {
    local file="$1"
    local label="$2"

    if [ -f "$file" ]; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Missing file: $file"
        failures=$((failures + 1))
    fi
}

assert_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Fq "$pattern" "$file"; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected to find: $pattern"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

assert_order() {
    local file="$1"
    local first="$2"
    local second="$3"
    local label="$4"
    local first_line
    local second_line

    first_line=$(grep -Fn "$first" "$file" | head -1 | cut -d: -f1 || true)
    second_line=$(grep -Fn "$second" "$file" | head -1 | cut -d: -f1 || true)

    if [ -n "$first_line" ] && [ -n "$second_line" ] && [ "$first_line" -lt "$second_line" ]; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected '$first' before '$second'"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

echo "=== Sync Requirements Skill Test ==="
echo ""

assert_file_exists "$SYNC_SKILL" "sync-requirements skill exists"

if [ -f "$SYNC_SKILL" ]; then
    assert_contains "$SYNC_SKILL" "name: sync-requirements" "skill frontmatter uses exact name"
    assert_contains "$SYNC_SKILL" "description: Use when" "skill frontmatter has trigger description"
    assert_contains "$SYNC_SKILL" 'docs/req/<module>/req.md' "skill documents canonical req path"
    assert_contains "$SYNC_SKILL" 'docs/superpowers/specs/' "skill keeps dated brainstorming specs as inputs"
    assert_contains "$SYNC_SKILL" 'docs/superpowers/plans/' "skill keeps dated writing plans as inputs"
    assert_contains "$SYNC_SKILL" 'session-only user requirements' "skill considers session-only requirements"
    assert_contains "$SYNC_SKILL" 'SHALL NOT' "skill supports SHALL NOT"
    assert_contains "$SYNC_SKILL" 'MUST NOT' "skill supports MUST NOT"
    assert_contains "$SYNC_SKILL" '**BUT**' "skill supports BUT scenario steps"
    assert_contains "$SYNC_SKILL" 'prohibited behavior, exceptions, or negative expectations' "skill constrains BUT semantics"
    assert_contains "$SYNC_SKILL" '### Requirement:' "skill documents requirement heading format"
    assert_contains "$SYNC_SKILL" '#### Scenario:' "skill documents scenario heading format"
    assert_contains "$SYNC_SKILL" 'idempotent' "skill requires idempotent sync"
    assert_contains "$SYNC_SKILL" 'Do not require the OpenSpec CLI' "skill avoids OpenSpec runtime dependency"
    assert_order "$SYNC_SKILL" 'Resolve Work Context' 'Extract Durable Requirements' "skill resolves context before extraction"
    assert_order "$SYNC_SKILL" 'Extract Durable Requirements' 'Select Target Modules' "skill extracts before module selection"
    assert_order "$SYNC_SKILL" 'Select Target Modules' 'Merge Intelligently' "skill selects modules before merge"
fi

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
bash tests/claude-code/test-sync-requirements-skill.sh
```

Expected: FAIL with at least:

```text
[FAIL] sync-requirements skill exists
STATUS: FAILED
```

- [ ] **Step 3: Create the minimal `sync-requirements` skill**

Create `skills/sync-requirements/SKILL.md` with this content:

````markdown
---
name: sync-requirements
description: Use when implementation work is complete or durable requirements need to be merged from specs, plans, commits, reports, or session discussion into long-lived requirements documents
---

# Sync Requirements

## Overview

Merge durable requirements learned during Superpowers-driven work into
PRD-style module requirements documents.

**Core principle:** dated specs and plans are execution artifacts; durable
requirements belong in `docs/req/<module>/req.md`.

**Announce at start:** "I'm using the sync-requirements skill to update durable requirements."

## When to Use

Use this skill when:

- Implementation work is complete and requirements may need to be preserved.
- A user asks to merge a brainstorming spec or writing plan into long-lived requirements.
- A session included user-requested behavior changes after the original spec or plan.
- You need to update `docs/req/<module>/req.md` without archiving or rewriting dated artifacts.

Do not use this skill for:

- Temporary notes, command output, or debugging traces.
- Pure implementation details that belong in design docs, plans, or code comments.
- OpenSpec project state under `openspec/`; do not require the OpenSpec CLI.

## Requirements Document Convention

Main requirements documents live at:

```text
docs/req/<module>/req.md
```

Use stable, lowercase, hyphen-separated module names.

Each req document uses this structure:

```markdown
# <module> Requirements

## Purpose
One short paragraph explaining what durable capability this module describes.

## Requirements

### Requirement: <Name>
The system SHALL describe one durable behavior, constraint, or user-visible rule.

#### Scenario: <Scenario Name>
- **GIVEN** an initial state, when the state matters
- **WHEN** a condition, trigger, or user action occurs
- **THEN** an observable result is required
- **AND** an additional condition or outcome also applies
- **BUT** a prohibited behavior, exception, or negative expectation must hold
```

Requirement bodies use normative language:

- Use **SHALL** or **MUST** for required behavior.
- Use **SHALL NOT** or **MUST NOT** for prohibited behavior.
- Do not use weak substitutes such as "should avoid" or "does not usually".
- Every requirement must have at least one `#### Scenario:` block.
- Scenario steps use **WHEN** and **THEN** at minimum.
- Use **GIVEN** only when an initial state matters.
- Use **AND** for additional conditions or outcomes.
- Use **BUT** only for prohibited behavior, exceptions, or negative expectations.

## Workflow

### 1. Resolve Work Context

Identify the work to sync. Look for:

- A referenced or recently created design spec under `docs/superpowers/specs/`.
- A referenced or recently created plan under `docs/superpowers/plans/`.
- Current branch commits, task reports, progress ledgers, and final summaries.
- Session-only user requirements added after the original spec or plan.

If the relevant spec or plan cannot be inferred uniquely, ask the user to choose
from candidate files. Do not invent a context.

### 2. Extract Durable Requirements

Read the available design spec and plan, then review the active session for
additional user requirements.

Extract durable product, workflow, behavior, and constraint requirements.

Skip:

- Transient test failures.
- Debugging dead ends.
- Local command output.
- Implementation accidents.
- Branch management choices.

Keep a requirement from those skipped categories only when the user explicitly
changed the intended durable behavior.

When a later user message conflicts with the original spec or plan, the later
explicit user message wins. Mention that replacement in the sync summary.

### 3. Select Target Modules

Map each durable requirement to one or more module req documents under
`docs/req/<module>/req.md`.

If the target req document does not exist, create it with `# <module> Requirements`,
`## Purpose`, and `## Requirements`.

If the module boundary is unclear, ask one multiple-choice question showing the
plausible module names and why each is plausible.

### 4. Merge Intelligently

Apply requirements by intent rather than copying artifact text:

- New durable behavior becomes a new `### Requirement`.
- Additional examples or edge cases become new `#### Scenario` entries under an existing requirement.
- Changed behavior updates the existing requirement or scenario while preserving unrelated content.
- Removed behavior is deleted only when the current work explicitly deprecated it.
- Renames update headings while preserving scenarios that still apply.

The operation must be idempotent. If the target req document already states the
same requirement or scenario, report that it is already synchronized instead of
duplicating it.

### 5. Report Results

After syncing, report:

- Which module requirements documents were created or modified.
- Which requirements or scenarios were added, modified, removed, or already in sync.
- Which session-only user requirements were captured.
- Which candidate details were skipped as temporary or non-durable.

## Guardrails

- Do not require the OpenSpec CLI.
- Do not create an `openspec/` directory.
- Do not archive or rewrite dated specs in `docs/superpowers/specs/`.
- Do not archive or rewrite dated plans in `docs/superpowers/plans/`.
- Do not silently edit requirements if module selection is ambiguous.
- Preserve existing req document content not mentioned by the current work.
````

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
bash tests/claude-code/test-sync-requirements-skill.sh
```

Expected:

```text
STATUS: PASSED
```

- [ ] **Step 5: Wire the test into the fast skill test runner**

In `tests/claude-code/run-skill-tests.sh`, change the fast test list from:

```bash
tests=(
    "test-worktree-path-policy.sh"
    "test-sdd-workspace.sh"
    "test-subagent-driven-development.sh"
)
```

to:

```bash
tests=(
    "test-worktree-path-policy.sh"
    "test-sync-requirements-skill.sh"
    "test-sdd-workspace.sh"
    "test-subagent-driven-development.sh"
)
```

- [ ] **Step 6: Run the new test through the runner**

Run:

```bash
bash tests/claude-code/run-skill-tests.sh --test test-sync-requirements-skill.sh
```

Expected:

```text
Running: test-sync-requirements-skill.sh
[PASS]
STATUS: PASSED
```

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add skills/sync-requirements/SKILL.md tests/claude-code/test-sync-requirements-skill.sh tests/claude-code/run-skill-tests.sh
git commit -m "feat: add sync-requirements skill"
```

## Task 2: Add Requirement Sync Prompt to Branch Finishing

**Files:**
- Modify: `tests/claude-code/test-sync-requirements-skill.sh`
- Modify: `skills/finishing-a-development-branch/SKILL.md`

**Interfaces:**
- Consumes: `sync-requirements` skill from Task 1.
- Produces: Finishing workflow step that prompts after tests pass and before environment detection.

- [ ] **Step 1: Extend the static test for finishing workflow integration**

Replace `tests/claude-code/test-sync-requirements-skill.sh` with this content:

```bash
#!/usr/bin/env bash
# Regression check: sync-requirements owns durable requirements sync.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SYNC_SKILL="$REPO_ROOT/skills/sync-requirements/SKILL.md"
FINISHING_SKILL="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"
README_FILE="$REPO_ROOT/README.md"

failures=0

assert_file_exists() {
    local file="$1"
    local label="$2"

    if [ -f "$file" ]; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Missing file: $file"
        failures=$((failures + 1))
    fi
}

assert_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Fq "$pattern" "$file"; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected to find: $pattern"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

assert_order() {
    local file="$1"
    local first="$2"
    local second="$3"
    local label="$4"
    local first_line
    local second_line

    first_line=$(grep -Fn "$first" "$file" | head -1 | cut -d: -f1 || true)
    second_line=$(grep -Fn "$second" "$file" | head -1 | cut -d: -f1 || true)

    if [ -n "$first_line" ] && [ -n "$second_line" ] && [ "$first_line" -lt "$second_line" ]; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected '$first' before '$second'"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

echo "=== Sync Requirements Skill Test ==="
echo ""

assert_file_exists "$SYNC_SKILL" "sync-requirements skill exists"

if [ -f "$SYNC_SKILL" ]; then
    assert_contains "$SYNC_SKILL" "name: sync-requirements" "skill frontmatter uses exact name"
    assert_contains "$SYNC_SKILL" "description: Use when" "skill frontmatter has trigger description"
    assert_contains "$SYNC_SKILL" 'docs/req/<module>/req.md' "skill documents canonical req path"
    assert_contains "$SYNC_SKILL" 'docs/superpowers/specs/' "skill keeps dated brainstorming specs as inputs"
    assert_contains "$SYNC_SKILL" 'docs/superpowers/plans/' "skill keeps dated writing plans as inputs"
    assert_contains "$SYNC_SKILL" 'session-only user requirements' "skill considers session-only requirements"
    assert_contains "$SYNC_SKILL" 'SHALL NOT' "skill supports SHALL NOT"
    assert_contains "$SYNC_SKILL" 'MUST NOT' "skill supports MUST NOT"
    assert_contains "$SYNC_SKILL" '**BUT**' "skill supports BUT scenario steps"
    assert_contains "$SYNC_SKILL" 'prohibited behavior, exceptions, or negative expectations' "skill constrains BUT semantics"
    assert_contains "$SYNC_SKILL" '### Requirement:' "skill documents requirement heading format"
    assert_contains "$SYNC_SKILL" '#### Scenario:' "skill documents scenario heading format"
    assert_contains "$SYNC_SKILL" 'idempotent' "skill requires idempotent sync"
    assert_contains "$SYNC_SKILL" 'Do not require the OpenSpec CLI' "skill avoids OpenSpec runtime dependency"
    assert_order "$SYNC_SKILL" 'Resolve Work Context' 'Extract Durable Requirements' "skill resolves context before extraction"
    assert_order "$SYNC_SKILL" 'Extract Durable Requirements' 'Select Target Modules' "skill extracts before module selection"
    assert_order "$SYNC_SKILL" 'Select Target Modules' 'Merge Intelligently' "skill selects modules before merge"
fi

assert_contains "$FINISHING_SKILL" '### Step 1.5: Requirement Sync Prompt' "finishing skill has requirement sync step"
assert_contains "$FINISHING_SKILL" 'Sync requirements now (recommended)' "finishing prompt includes recommended sync option"
assert_contains "$FINISHING_SKILL" 'Skip sync and continue finishing' "finishing prompt includes skip option"
assert_contains "$FINISHING_SKILL" 'Cancel finishing' "finishing prompt includes cancel option"
assert_contains "$FINISHING_SKILL" 'sync-requirements' "finishing skill delegates to sync-requirements"
assert_contains "$FINISHING_SKILL" 'docs/req/<module>/req.md' "finishing prompt names req path"
assert_order "$FINISHING_SKILL" '**If tests pass:** Continue to Step 1.5.' '### Step 1.5: Requirement Sync Prompt' "finishing enters sync prompt after tests pass"
assert_order "$FINISHING_SKILL" '### Step 1.5: Requirement Sync Prompt' '### Step 2: Detect Environment' "sync prompt happens before environment detection"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
```

- [ ] **Step 2: Run the test and verify the finishing assertions fail**

Run:

```bash
bash tests/claude-code/test-sync-requirements-skill.sh
```

Expected: FAIL with at least:

```text
[FAIL] finishing skill has requirement sync step
STATUS: FAILED
```

- [ ] **Step 3: Update the finishing workflow core principle**

In `skills/finishing-a-development-branch/SKILL.md`, replace:

```markdown
**Core principle:** Verify tests → Detect environment → Present options → Execute choice → Clean up.
```

with:

```markdown
**Core principle:** Verify tests → Offer requirements sync → Detect environment → Present options → Execute choice → Clean up.
```

- [ ] **Step 4: Route test success to the new Step 1.5**

In `skills/finishing-a-development-branch/SKILL.md`, replace:

```markdown
**If tests pass:** Continue to Step 2.
```

with:

```markdown
**If tests pass:** Continue to Step 1.5.
```

- [ ] **Step 5: Add Step 1.5 before environment detection**

Insert this section immediately before the existing `### Step 2: Detect Environment` heading:

````markdown
### Step 1.5: Requirement Sync Prompt

Before finishing the branch, offer to sync durable requirements learned during
the session into `docs/req/<module>/req.md`.

Present exactly these 3 options:

```
Requirements may have changed during this session. Would you like to sync the
durable requirements into docs/req/<module>/req.md before finishing?

1. Sync requirements now (recommended)
2. Skip sync and continue finishing
3. Cancel finishing

Which option?
```

**If user chooses 1:** Announce: "I'm using the sync-requirements skill to update durable requirements." Use `sync-requirements`, then return to Step 2.

**If user chooses 2:** Continue to Step 2.

**If user chooses 3:** Stop. Do not present merge, PR, keep, or discard options.

**Do not inline the merge algorithm here.** This skill only prompts; `sync-requirements` owns context resolution, durable requirement extraction, module selection, merging, and reporting.

````

- [ ] **Step 6: Update finishing quick reference and red flags**

In `skills/finishing-a-development-branch/SKILL.md`, under `## Common Mistakes`, add this section before `**Open-ended questions**`:

```markdown
**Skipping requirement sync prompt**
- **Problem:** Durable requirements learned during implementation disappear after branch completion
- **Fix:** Always offer Step 1.5 after tests pass and before branch finishing choices
```

In the `Always:` list under `## Red Flags`, insert this bullet after `Verify tests before offering options`:

```markdown
- Offer requirements sync after tests pass
```

- [ ] **Step 7: Run the focused test and verify it passes**

Run:

```bash
bash tests/claude-code/test-sync-requirements-skill.sh
```

Expected:

```text
STATUS: PASSED
```

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add tests/claude-code/test-sync-requirements-skill.sh skills/finishing-a-development-branch/SKILL.md
git commit -m "feat: prompt for requirements sync when finishing"
```

## Task 3: Document the Workflow in README

**Files:**
- Modify: `tests/claude-code/test-sync-requirements-skill.sh`
- Modify: `README.md`

**Interfaces:**
- Consumes: `sync-requirements` skill and finishing prompt from Tasks 1 and 2.
- Produces: README workflow docs that mention the new skill in the basic workflow and skills library.

- [ ] **Step 1: Extend the static test for README documentation**

In `tests/claude-code/test-sync-requirements-skill.sh`, add these assertions after the finishing assertions and before `echo ""`:

```bash
assert_contains "$README_FILE" '**sync-requirements**' "README lists sync-requirements"
assert_contains "$README_FILE" 'docs/req/<module>/req.md' "README documents req path"
assert_order "$README_FILE" '**requesting-code-review**' '**sync-requirements**' "README places sync before finishing in workflow"
assert_order "$README_FILE" '**sync-requirements**' '**finishing-a-development-branch**' "README places finishing after sync"
```

- [ ] **Step 2: Run the test and verify README assertions fail**

Run:

```bash
bash tests/claude-code/test-sync-requirements-skill.sh
```

Expected: FAIL with at least:

```text
[FAIL] README lists sync-requirements
STATUS: FAILED
```

- [ ] **Step 3: Update the README basic workflow**

In `README.md`, replace the current workflow ending:

```markdown
6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.
```

with:

```markdown
6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **sync-requirements** - Activates when tasks complete and durable requirements should be preserved. Merges specs, plans, commits, reports, and session-only user requirements into `docs/req/<module>/req.md`.

8. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, offers requirement sync, presents options (merge/PR/keep/discard), cleans up worktree.
```

- [ ] **Step 4: Update the README skills list**

In the `**Collaboration**` section of `README.md`, replace:

```markdown
- **finishing-a-development-branch** - Merge/PR decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)
```

with:

```markdown
- **finishing-a-development-branch** - Merge/PR decision workflow
- **sync-requirements** - Durable requirements sync into `docs/req/<module>/req.md`
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
bash tests/claude-code/test-sync-requirements-skill.sh
```

Expected:

```text
STATUS: PASSED
```

- [ ] **Step 6: Run the fast skill test runner for the new test**

Run:

```bash
bash tests/claude-code/run-skill-tests.sh --test test-sync-requirements-skill.sh
```

Expected:

```text
Running: test-sync-requirements-skill.sh
[PASS]
STATUS: PASSED
```

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add tests/claude-code/test-sync-requirements-skill.sh README.md
git commit -m "docs: document requirements sync workflow"
```

## Task 4: Final Verification

**Files:**
- Verify: `skills/sync-requirements/SKILL.md`
- Verify: `skills/finishing-a-development-branch/SKILL.md`
- Verify: `README.md`
- Verify: `tests/claude-code/test-sync-requirements-skill.sh`
- Verify: `tests/claude-code/run-skill-tests.sh`

**Interfaces:**
- Consumes: all outputs from Tasks 1-3.
- Produces: verification evidence and final commit only if a fix is needed.

- [ ] **Step 1: Run the focused static test**

Run:

```bash
bash tests/claude-code/test-sync-requirements-skill.sh
```

Expected:

```text
STATUS: PASSED
```

- [ ] **Step 2: Run the fast skill test entry for the new test**

Run:

```bash
bash tests/claude-code/run-skill-tests.sh --test test-sync-requirements-skill.sh
```

Expected:

```text
Running: test-sync-requirements-skill.sh
[PASS]
STATUS: PASSED
```

- [ ] **Step 3: Check for forbidden stale paths and missing syntax**

Run:

```bash
grep -R "docs/specs/<module>/spec.md" skills/sync-requirements skills/finishing-a-development-branch/SKILL.md README.md tests/claude-code/test-sync-requirements-skill.sh
```

Expected: command exits non-zero with no matches.

Run:

```bash
grep -R "SHALL NOT\|MUST NOT\|\*\*BUT\*\*" skills/sync-requirements/SKILL.md tests/claude-code/test-sync-requirements-skill.sh
```

Expected: command exits zero and prints matches from both files.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- skills/sync-requirements/SKILL.md skills/finishing-a-development-branch/SKILL.md README.md tests/claude-code/test-sync-requirements-skill.sh tests/claude-code/run-skill-tests.sh
```

Expected:

```text
skills/sync-requirements/SKILL.md
skills/finishing-a-development-branch/SKILL.md
README.md
tests/claude-code/test-sync-requirements-skill.sh
tests/claude-code/run-skill-tests.sh
```

The diff should show no edits to `docs/superpowers/specs/` or `docs/superpowers/plans/` beyond the already committed design and this implementation plan.

- [ ] **Step 5: Commit final verification fix only if needed**

If Step 1-4 expose a missing wording or test assertion, fix it and run:

```bash
git add skills/sync-requirements/SKILL.md skills/finishing-a-development-branch/SKILL.md README.md tests/claude-code/test-sync-requirements-skill.sh tests/claude-code/run-skill-tests.sh
git commit -m "fix: tighten requirements sync workflow checks"
```

Expected: only run this commit if there was a verification fix. If no fix was needed, do not create an empty commit.
