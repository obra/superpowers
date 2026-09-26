---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code. Turn it into a bite-sized implementation plan.
---

# Writing Plans

Write a comprehensive implementation plan assuming the implementer has zero context for the
codebase and questionable taste. Document everything: which files to touch, complete code, how to
test, how to verify. Bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

**Announce:** "I'm using the writing-plans skill to create the implementation plan."

## Use the template

Fill in `templates/implementation-plan.md` (installed by bootstrap). It has the plan header, a
file-structure/responsibility table, and the per-task TDD structure.

## File structure

Before defining tasks, map which files will be created or modified and what each is responsible
for. One clear responsibility per file. Files that change together live together. Split by
responsibility, not by technical layer.

## Task right-sizing

A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate.
Each task ends in an independently testable deliverable.

## Bite-sized granularity

Each step is one action (2-5 min): write the failing test → run to confirm it fails → implement the
minimal code → run to confirm it passes → commit.

## Plan header (every plan)

```markdown
# [Feature Name] Implementation Plan

**Goal:** [one sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [key technologies]

---
```

## Review the plan

Check: tasks sequential and logical; each bite-sized; file paths exact; code examples complete and
copy-pasteable; commands exact with expected output; DRY/YAGNI/TDD applied.

## Execution handoff

After the plan is approved, implement it task-by-task. Isolate the work (worktree/branch), follow
TDD per task, and gate each task with review before moving on. See `test-driven-development` and
`requesting-code-review`.
