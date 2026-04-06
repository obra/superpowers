---
name: router-first
description: Use when starting any conversation in Claude Code or Codex and you need to choose the lightest safe process for the task
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

# Router-First

## Overview

This is the default Superpowers entrypoint for Claude Code and Codex.

Choose the lightest safe path for the task. Default to execution. Escalate only when risk or ambiguity justifies the overhead.

**Core principle:** Skills are tools, not a constitution. Use only the process needed to complete the task safely.

## Instruction Priority

Superpowers skills override default system behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests)
2. **Superpowers skills**
3. **Default system prompt**

If the user explicitly asks for the full heavy workflow, enter it. If the user explicitly asks to keep things light, do not escalate unless they approve.

## The Routing Rule

Before acting, classify the task only as much as needed to choose the lightest safe path:

1. Check whether the task is `large`
2. If not, check whether it is `medium`
3. Otherwise treat it as `small`

Do not turn simple work into process theater.

## Task Sizes

### `small`

Use when the request is clear, bounded, and low-risk.

Typical examples:
- Small bugfixes
- Small test additions
- Copy, config, script, or tooling tweaks
- A small, clearly specified feature slice
- Local refactors that do not change architectural boundaries

Default path:
1. Inspect quickly
2. Act directly
3. Verify before claiming success

Do not start brainstorming or write a formal plan for `small` tasks.

### `medium`

Use when the request is clear, but the work needs a few coordinated steps.

Typical examples:
- A modest feature addition touching a few related areas
- A command or workflow change that also needs tests or docs
- A fix that needs a short inspection pass before implementation

Default path:
1. Tell the user the short execution plan first
2. Keep the plan light: 2-5 concrete steps
3. Execute
4. Verify before claiming success

The short plan is not a spec and not a formal implementation document.

### `large`

Treat the task as `large` when ANY of these are true:
- The requirements are unclear and need design work
- The task will materially change product behavior and there are multiple reasonable approaches
- The task crosses multiple independent subsystems
- The task involves architecture changes, migrations, deletions, or compatibility strategy
- The task involves security, permissions, payments, release flow, or data correctness risk
- The task is likely to require long, multi-round coordination
- You have already tried multiple times and still do not understand the root cause

Default path:
1. Explain why the task is high-risk
2. Ask whether the user wants to switch to the heavy workflow
3. Only enter the heavy workflow if the user explicitly agrees

If the user declines, stop implementation. Offer advice, decomposition, or risk analysis only.

## Heavy Workflow

When the user explicitly asks for the full workflow, or approves escalation from a `large` task, switch into the existing heavy Superpowers path:

1. `using-superpowers`
2. `brainstorming`
3. `writing-plans`
4. Execution and review skills as needed

Do not silently switch into heavy mode.

## Skill Triggers

### Always enforce

- `verification-before-completion`
  - Before claiming something is complete, fixed, or passing, run the relevant verification and check the result

### Conditionally enforce

- `systematic-debugging`
  - Use when the task is a bug, test failure, flaky issue, unexpected behavior, or the root cause is unclear

### Use only when needed

- `brainstorming`
  - Only after the user explicitly wants heavy mode or approves escalation for a `large` task
- `writing-plans`
  - Only after heavy mode is entered and a formal implementation plan is actually warranted
- `test-driven-development`
  - Recommended when it fits the task; not a top-level hard gate for every change
- `requesting-code-review`
  - Use for larger changes, merge prep, or when the user asks for review
- `subagent-driven-development`
  - Use only inside heavy execution flows
- `using-git-worktrees`
  - Use when isolation is useful, not by default

## Communication Style

- For `small` tasks, move quickly and keep preamble minimal
- For `medium` tasks, share a short execution plan before acting
- For `large` tasks, explain the risk briefly and ask whether to enter heavy mode

Do not:
- Force design discussions for simple work
- Ask serial clarification questions when the task is already clear enough to execute
- Turn a short plan into a formal design document
- Silently escalate to heavy mode

## Bottom Line

Default to the lightest safe path:
- `small` -> inspect, act, verify
- `medium` -> short plan, act, verify
- `large` -> ask before escalating to heavy
