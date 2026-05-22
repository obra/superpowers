# Plan Status Contract

Superpowers plans are markdown files written for humans first. Agents should be
able to recover progress from the same file without a new slash command, a
separate state database, or brittle transcript parsing.

This document defines the lightweight status contract for generated plans. It
is intentionally small: task headings and step checkboxes are the durable state,
with optional status notes for cases a checkbox cannot express.

## Goals

- Show which tasks are pending, in progress, done, blocked, or skipped.
- Let a later session resume from the next unfinished task without reading an
  entire long plan into context.
- Keep plan files readable in plain markdown and GitHub.
- Avoid adding a new command surface. Users should still be able to ask the
  agent for status or continuation in ordinary language.

## Non-Goals

- This is not a task database.
- This does not require parsing chat transcripts or tool logs.
- This does not define a new slash command.
- This does not make execution agents update status automatically yet.

## Plan Structure

Plan documents should keep the existing generated shape:

```markdown
# Feature Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One sentence.

**Architecture:** Two or three sentences.

**Tech Stack:** Key technologies.

---

### Task 1: First Component

**Files:**
- Create: `src/example.py`
- Test: `tests/test_example.py`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
```

The status contract depends on:

- The document header before the first task.
- Stable task headings in the form `### Task N: Name`.
- Checkbox steps under each task using `- [ ]` and `- [x]`.
- Optional task metadata lines directly below the task heading.

## Status Rules

Agents should compute task status from the task body:

| Status | Rule |
| --- | --- |
| `pending` | The task has no checked steps and no explicit `Status` line. |
| `in_progress` | The task has a mix of checked and unchecked steps. |
| `done` | Every required step checkbox in the task is checked. |
| `blocked` | The task has `**Status:** blocked - reason`. |
| `skipped` | The task has `**Status:** skipped - reason`. |

Use `done`, not a separate `complete` spelling. Use `pending`, not `todo`, for
not-started tasks.

Explicit `blocked` and `skipped` status lines are authoritative when checkbox
state is ambiguous. If every required checkbox is checked but the task still has
an explicit `blocked` or `skipped` status line, agents should report the
conflict instead of silently choosing one state.

## Optional Metadata

When checkbox state is not enough, agents may add metadata directly below the
task heading:

```markdown
### Task 3: Migration

**Status:** blocked - waiting for the API schema decision in issue #123
**Evidence:** `npm test -- migration.test.ts`, failing on missing schema field
**Next:** Re-run the schema generator after #123 is resolved.
```

Supported metadata:

- `**Status:** blocked - reason`
- `**Status:** skipped - reason`
- `**Evidence:** command, file, commit, PR, or issue reference`
- `**Next:** one concrete next action`

Do not add metadata for ordinary `pending`, `in_progress`, or `done` tasks if
checkboxes already describe the state.

## Resume Target

When asked to continue a plan, an agent should choose the resume target in this
order:

1. The first `in_progress` task.
2. The first `pending` task.
3. The first `blocked` task only if the blocker has been resolved.

Within a task, resume at the first unchecked step. If every task is `done` or
`skipped`, the agent should move to finishing the development branch instead of
starting new implementation work.

## Context-Frugal Reading

For long plans, agents should avoid loading the whole file when the user only
asks for status or continuation:

1. Read the document header.
2. Scan task headings and checkbox summaries.
3. Read only the current resume target task in full.

This keeps the workflow compatible with ordinary conversation while addressing
large-plan context usage.

## Eval Evidence

Behavior changes that consume this contract should include fixtures for:

- A fresh plan where every task is `pending`.
- A partially completed plan with one `in_progress` task.
- A plan with a `blocked` task and a later `pending` task.
- A plan where every required task is `done`.
- A stale status line that conflicts with checkbox state.

The expected behavior should state which task and step the agent resumes from,
and what it reports to the user.
