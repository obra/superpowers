---
name: using-superpowers
description: >
  BLOCKING REQUIREMENT — invoke this skill BEFORE writing any code, editing
  files, debugging, planning, reviewing, or making any technical tool calls
  beyond reading files. This is the mandatory workflow router for ALL technical
  tasks. Matches: "implement", "build", "fix", "debug", "refactor", "optimize",
  "add feature", "change", "update", "create", "develop", "plan", "review",
  "test", or ANY request that involves code changes. Do NOT skip this skill
  even if the task seems simple. Invoke FIRST, then follow its routing.
---

# Using Superpowers

## Trigger Conditions

This skill MUST be invoked when any of the following occur:

- A new session starts with a technical request
- The user gives a new task or changes topic mid-session
- Any technical work is about to begin without a skill selected
- The user asks "what should I use" or "which workflow"

**Exception:** Micro tasks (typo fix, single variable rename, 1-line config change) can skip the entry sequence entirely. Just do them.

## Core Rule

Before technical execution, select workflow skills explicitly and follow them.

Technical execution includes code edits, debugging, planning, review, test status claims, and branch integration actions.

## Entry Sequence

1. Invoke `token-efficiency` at session start — applies to all sessions, always.
2. For technical tasks, invoke `adaptive-workflow-selector`.
3. If resuming work from a prior session, read `state.md` if it exists. Use `context-management` to save state before ending a session with ongoing work.
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
- Cross-session state persistence: `context-management`
- UI/frontend implementation: apply `frontend-craftsmanship` standards
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
