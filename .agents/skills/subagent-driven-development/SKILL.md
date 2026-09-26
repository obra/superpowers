---
name: subagent-driven-development
description: Use when executing an implementation plan whose tasks are independent. Dispatch a fresh implementer subagent per task, review each, then do a whole-branch review at the end.
---

# Subagent-Driven Development

Execute a plan by dispatching a fresh implementer subagent per task, a review after each, and a
broad whole-branch review at the end.

**Announce:** "I'm using the subagent-driven-development skill."

**When not to use:** a high-level goal that should become GitHub Issues and serial PRs —
use `orchestrated-delivery` instead.

## Why subagents

You delegate tasks to specialized agents with isolated context. By precisely crafting their
instructions and context, you keep them focused and successful. They should never inherit your
session's context or history — you construct exactly what they need. This preserves your own
context for coordination.

## Core principle

Fresh subagent per task + review (spec + quality) + broad final review = high quality, fast
iteration.

## Per task

1. Dispatch a fresh subagent with: the task, the exact files to touch, the acceptance criteria,
   the test command, and the project conventions (from `AGENTS.md`). Give it no extra history.
2. After it returns, run a review: spec compliance + code quality.
3. Address findings before moving on (see `requesting-code-review` / `receiving-code-review`).

## Continuous execution

Do not pause to check in with the human between tasks. Execute the whole plan. Only stop for: a
genuinely required human decision, a real external blocker, or all tasks complete.

## Rulings, not stalls

Conflicts, ambiguities, or plan defects — decide them. The spec is binding, the plan is its
argument, and your judgment settles what neither answers. Record each decision as
`Ruling: <what> — <why> — <cost if wrong>` and keep going. A wrong ruling costs rework a human can
undo; a session parked on a question costs the whole day.

## Final review

When all tasks are done, do a whole-branch review against the plan, verify the full suite, then
hand off to `finishing-a-development-branch`.
