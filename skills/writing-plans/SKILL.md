---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Amplifier Agent Assignment

Each task gets an `Agent:` field specifying which Amplifier agent will handle it during execution. Consult `AMPLIFIER-AGENTS.md` in the superpowers plugin directory for the full mapping.

**Auto-assign by scanning the task description:**
- Implementation tasks (build, create, add) → `modular-builder`
- Test tasks (test, coverage, verify) → `test-coverage`
- Fix/debug tasks (fix, debug, error) → `bug-hunter`
- Security tasks (auth, secrets, permissions) → `security-guardian`
- API tasks (endpoint, contract, route) → `api-contract-designer`
- Database tasks (schema, migration, query) → `database-architect`
- UI tasks (component, frontend, visual) → `component-designer`
- Integration tasks (API, MCP, external) → `integration-specialist`
- Performance tasks (optimize, bottleneck) → `performance-optimizer`

When in doubt, use `modular-builder` for building and `bug-hunter` for fixing.

**Review tasks use dedicated agents:**
- Spec compliance review → `test-coverage`
- Code quality review → `zen-architect` (REVIEW mode)
- Security review → `security-guardian`
- Final cleanup → `post-task-cleanup`

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan task-by-task. Each task specifies its Agent — dispatch that Amplifier agent as the subagent for implementation.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

```markdown
### Task N: [Component Name]

**Agent:** [agent-name from AMPLIFIER-AGENTS.md]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

` ` `python
def test_specific_behavior():
    result = function(input)
    assert result == expected
` ` `

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

` ` `python
def function(input):
    return expected
` ` `

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

` ` `bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
` ` `
```

## Review Tasks

Include explicit review tasks in the plan for security-sensitive or complex implementations:

```markdown
### Task N+1: Security Review

**Agent:** security-guardian

**Scope:** Review Tasks 1-N for OWASP Top 10, secret detection, auth patterns
**Output:** Security findings with file:line references
**Action:** If issues found, create fix tasks and re-review
```

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits
- Every task has an Agent: field

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh Amplifier agents per task (using each task's Agent field), with two-stage review between tasks

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Stay in this session
- Fresh Amplifier agent per task + two-stage review

**If Parallel Session chosen:**
- Guide them to open new session in worktree
- **REQUIRED SUB-SKILL:** New session uses superpowers:executing-plans
