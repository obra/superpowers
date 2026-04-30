---
name: writing-plans
description: Use when turning requirements into a multi-step Codex implementation plan.
---

# Writing Plans

## Overview

Write implementation plans that a skilled engineer can execute without prior context. Include exact files, concrete steps, verification commands, and expected outcomes.

Save plans to `docs/codex/plans/YYYY-MM-DD-<feature-name>.md` unless the user specifies another location.

## Plan Header

Every plan should start with:

```markdown
# <Feature Name> Implementation Plan

> For Codex: execute inline with `executing-plans` unless the user explicitly asks for subagents, delegation, parallel agent work, or a team workflow.

**Goal:** <one sentence>

**Architecture:** <short implementation approach>

**Tech Stack:** <key tools and file types>
```

## Task Structure

Use bite-sized tasks. Each task should include:

- Files to create, modify, or test.
- A failing test or validation step where practical.
- The minimal implementation step.
- The command that verifies the task.
- Expected output or observable result.

Prefer steps that take a few minutes each.

## Progress Tracking

When executing or handing off the plan in Codex, use `update_plan` for the visible checklist.

Do not require automatic commits unless the user explicitly asks for commits.

## Execution Handoff

After saving the plan, offer these execution paths:

1. Codex Team-Driven: only when the user explicitly wants parallel agents, delegation, or a team workflow.
2. Inline Execution: execute in the current Codex session with `executing-plans`.

If the user chooses team-driven execution, apply `team-driven-development` and obey the Codex delegation gate.

If the user chooses inline execution, apply `executing-plans` and keep work local unless the user later authorizes delegation.
