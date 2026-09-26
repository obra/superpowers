---
name: dispatching-parallel-agents
description: Use when facing two or more independent tasks that can be worked on without shared state or sequential dependencies. Dispatch one agent per independent problem domain, concurrently.
---

# Dispatching Parallel Agents

**Announce:** "I'm using the dispatching-parallel-agents skill."

## Core principle

Dispatch one agent per independent problem domain. Let them work concurrently. Investigating or
building independent things sequentially wastes time.

## When to use

- Multiple independent failures (different files, different subsystems, different bugs).
- Multiple independent features/tasks that share no state and have no ordering dependency.

## When NOT to use

- Tasks that share state, touch the same files, or have a dependency between them. Parallel agents
  editing the same code collide. Keep those sequential (see `subagent-driven-development`).

## How

1. Split the work into independent problem domains.
2. Dispatch one agent per domain, each with precise, self-contained context: the goal, the exact
   files, the acceptance criteria, and the project conventions (from `AGENTS.md`). Never share
   session history.
3. Run them concurrently.
4. Collect and review each result against its acceptance criteria (see `requesting-code-review`).

## Guardrails

- Do not let two agents edit the same file at once.
- Give each agent a clean, isolated scope; the isolation is what makes parallel safe.
- Review each result before integrating, then run the full suite.
