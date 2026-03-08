---
name: dispatching-parallel-agents
description: >
  Use when multiple tasks are independent and can run concurrently without
  file or state conflicts. Triggers on: "run these in parallel",
  "do these at the same time", plans with 3+ independent tasks,
  when subagent-driven-development identifies parallelizable work.
---

# Dispatching Parallel Agents

Use parallel subagents only for truly independent work.

## Decision Check

Use parallel dispatch when all are true:
- Problems have separate root causes.
- Tasks do not edit the same files.
- Tasks do not require shared intermediate state.

If any condition fails, run sequentially.

## Procedure

1. Split work into independent domains.
2. Write one focused prompt per domain.
3. Dispatch all prompts concurrently.
4. Collect summaries and changed files.
5. Resolve conflicts between summaries and changed files.
6. Run integration verification: execute the full project test suite plus any cross-domain checks. Do not mark the wave complete until integration passes.

## Prompt Requirements

Each agent prompt must include:
- Exact scope
- Acceptance criteria
- Constraints (what not to touch)
- Required output format

## Risks

- False independence assumptions
- Merge conflicts across shared files
- Inconsistent behavior across parallel fixes

When risk is high, fall back to sequential execution.
