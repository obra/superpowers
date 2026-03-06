---
name: using-superpowers
description: Use at the start of a session and before technical work to select and invoke the correct superpowers workflow.
---

# Using Superpowers

## Core Rule

Before technical execution, select workflow skills explicitly and follow them.

Technical execution includes code edits, debugging, planning, review, test status claims, and branch integration actions.

## Entry Sequence

1. Invoke `token-efficiency` at session start — applies to all sessions, always.
2. For technical tasks, invoke `adaptive-workflow-selector`.
3. If session context is long/noisy, invoke `context-management` and refresh `state.md`.
4. Invoke selected workflow skills in order.
5. If no skill applies, continue normally.

## Routing Guide

- New behavior or architecture: `brainstorming` -> `writing-plans`
- Plan execution (same session): `subagent-driven-development`
- Plan execution (separate session): `executing-plans`
- Bug/test failure: `systematic-debugging` -> `test-driven-development`
- Completion claim: `verification-before-completion`
- Branch integration: `finishing-a-development-branch`
- Extra review flow: `requesting-code-review` / `receiving-code-review`
- Independent parallel tasks: `dispatching-parallel-agents`
- Context compression: `context-management`
- UI/frontend implementation: apply `frontend-craftmanship` standards
- Security-sensitive changes (auth, data handling, exposed APIs): `security-reviewer` before merge

## Context Hygiene

For subagent handoffs, include only current task scope, constraints, evidence, and references to `state.md` when needed.

Avoid carrying forward long assistant reasoning chains unless they contain required artifacts.

## Structured Output Preference

When output feeds another agent/tool step, prefer JSON or YAML schemas defined by the active skill.

## Red Flags

- "I'll just do this first without a skill"
- "No need to run selector; this is obvious"
- "Keep all prior assistant text in context"

If a red flag appears, restart from Entry Sequence.
