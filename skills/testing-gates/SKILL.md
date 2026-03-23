---
name: testing-gates
description: Use when running CI test gates to validate code changes - detects what changed, runs relevant gates, and reports structured pass/fail results
---

# Testing Gates

## Overview

Run the right tests for what changed. Report results clearly. Don't skip gates, don't run irrelevant ones.

**Core principle:** Smart detection, complete execution, structured reporting.

## When to Use

- After implementing a fix or feature
- Before committing or creating a PR
- When the loop orchestrator dispatches the Test stage
- Any time you need a pass/fail verdict on the current state

## Modes

### Smart Mode (default)

Detect what changed and run only the relevant gates:

1. Compare current branch to base branch (e.g., `origin/dev`, `origin/main`)
2. Categorize changed files by type/language
3. Run gates for each category that has changes

This avoids running frontend gates when only backend code changed, and vice versa.

### Full Mode

Run all gates regardless of what changed. Use when:
- Preparing for a PR/merge
- Uncertain what's affected
- After a rebase or merge

### Targeted Mode

Run a specific subset of gates. Use when:
- Iterating on a specific area during development
- Re-running a failed gate after a fix

## Gate Structure

Gates are defined by the consuming project in `.claude/shared/test-project.md` or `project-flows.json`. A typical gate set:

```
Gate Name        | Trigger (smart mode)          | Command
-----------------|-------------------------------|--------
Linting          | Any source file changed       | (project-specific)
Type checking    | Any typed source file changed  | (project-specific)
Unit tests       | Any source file changed       | (project-specific)
Integration tests| API/service files changed      | (project-specific)
Regression tests | Core logic files changed       | (project-specific)
```

This skill does NOT hardcode test commands. It reads them from the project config. If no project config exists, ask the user what test commands to run.

## The Process

### Step 1: Detect Changes

```bash
git diff --name-only <base-branch>...HEAD
```

Categorize files by extension/path to determine which gates apply.

### Step 2: Select Gates

- **Smart mode:** Match changed file categories to relevant gates
- **Full mode:** Select all gates
- **Targeted mode:** Select specified gate(s)

### Step 3: Execute Gates

Run each selected gate. For each gate:
1. Run the command
2. Capture exit code and output
3. Record PASS (exit 0) or FAIL (non-zero exit)
4. On failure: capture the error output for reporting

**Do not stop on first failure** — run all selected gates so the full picture is visible.

### Step 4: Report Results

Present a summary table:

```
| Gate              | Result |
|-------------------|--------|
| Linting           | PASS   |
| Type checking     | PASS   |
| Unit tests        | FAIL   |
| Regression tests  | PASS   |
```

For failures: include the relevant error output below the table.

### Step 5: Verdict

- **PASS:** All gates passed
- **FAIL:** One or more gates failed — list which ones

## Regression Test Handling

When regression tests fail because the fix/feature intentionally changes output:
- Flag this to the user/handler
- Distinguish between "test caught a real regression" vs "expected output changed"
- If expected output changed: suggest updating golden files / valid results
- Do NOT auto-update golden files without approval

## Modes (Interactive vs Loop)

### Interactive Mode
- Present results in chat
- On failure: suggest fixes or next steps

### Loop Mode (Async)
- Post `[TEST_PASS]` marker on GitHub issue with summary table
- Post `[TEST_FAIL]` marker on GitHub issue with failing gates and error output
- Never block on terminal input

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Running all gates when only one file changed | Wastes time, noise in results |
| Stopping at first failure | Hides other failures that would need fixing anyway |
| Not reporting which gates ran | Can't tell if a gate was skipped or passed |
| Auto-updating golden files | Hides real regressions |
| Skipping gates "because they're slow" | Slow gates still catch bugs |

## Integration

**Preceded by:**
- **superpowers:bug-fix** — fix is implemented, ready for gate validation
- **superpowers:subagent-driven-development** — task implemented, needs gate check

**Followed by:**
- **superpowers:user-acceptance-testing** — if gates pass and user-facing changes exist
- **superpowers:committing** — if gates pass and ready to PR
