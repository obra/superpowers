---
name: adaptive-workflow-selector
description: Use before technical execution to classify task complexity and choose a lightweight or full superpowers workflow path.
---

# Adaptive Workflow Selector

Choose the smallest safe workflow for the current task.

## Input

- Current user request
- Known constraints
- Current repository state (if needed)

## Decision Rules

Choose `lightweight` when all are true:
- Change scope is small (about <=2 files)
- No new behavior or architecture change
- No cross-module dependency risk
- No migration or data-shape change

Otherwise choose `full`.

`full` must include design/planning workflow before broad implementation.

## Required Output

Return JSON only:

```json
{
  "path": "lightweight|full",
  "reason": "brief explanation",
  "skills_to_invoke": ["skill-a", "skill-b"],
  "risk_flags": ["optional-risk-1"]
}
```

## Skill Invocation Guide

**Micro tasks** (typo fix, single variable rename, 1-line config change): Skip this selector entirely. Just do it.

**Lightweight path** — invoke only:
- `test-driven-development` (if behavior changes)
- `verification-before-completion`

Skip on lightweight: `brainstorming`, `writing-plans`, `using-git-worktrees`, `dispatching-parallel-agents`, `subagent-driven-development`.

**Full path** — follow `using-superpowers` routing guide for the full pipeline.

## Guardrails

- Never skip `test-driven-development` for behavior changes.
- Route bugfixes through `systematic-debugging` first.
- Route completion claims through `verification-before-completion`.
