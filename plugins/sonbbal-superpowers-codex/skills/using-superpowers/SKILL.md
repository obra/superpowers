---
name: using-superpowers
description: Use when starting a Codex conversation or task to identify and follow the relevant installed skills before acting.
---

# Using Superpowers In Codex

## Core Rule

Before acting, check whether an installed skill applies to the user's request. If a skill applies, read the relevant `SKILL.md`, announce the skill you are using in one short line, and follow its workflow.

Do not rely on memory. Skill files are the source of truth.

## How To Use Skills

1. Identify likely skills from the installed Codex skill package.
2. Read only the needed `SKILL.md` files and any directly referenced support files.
3. Announce the chosen skill and purpose.
4. Use `update_plan` for visible checklists or multi-step progress.
5. Execute the task according to the skill.

## Codex Tool Rules

Use Codex-native tools and names:

- `update_plan` for progress tracking.
- `spawn_agent` only when the user explicitly asks for subagents, delegation, parallel agent work, or a team workflow.
- `send_input` only for follow-up instructions to an existing delegated agent.
- `wait_agent` only when the next local step is blocked on a delegated result.

Do not describe non-Codex runtime APIs as available actions.

## Delegation Gate

Do not spawn agents just because a task is complex. In Codex, complexity alone is not permission to delegate.

Delegation is allowed only when the user explicitly requests one of these:

- subagents
- delegation
- parallel agents
- team workflow
- a named team-driven workflow

If the user does not explicitly request delegation, execute inline in the current Codex session and use local review checklists for quality gates.

## Priority

When multiple skills apply:

1. Process skills first, such as planning, debugging, or TDD.
2. Execution skills second, such as executing a plan or team-driven development.
3. Verification skills whenever you are about to claim work is complete, fixed, or passing.

User instructions define what to do. Skills define how to do it safely.
