---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
---

# Dispatching Parallel Agents

Subagents inherit none of your session's context. Construct exactly what each one needs.

## When to parallelize

Dispatch one agent per independent problem domain when two or more tasks — failing test files with different root causes, subsystems broken independently — are each understandable without the others and share no state.

Work through it yourself instead when:

- **Failures are related** — fixing one might fix others. Investigate together first.
- **You need full system state** — understanding requires seeing the whole picture.
- **Exploratory debugging** — you don't know what's broken yet.
- **Shared state** — agents would edit the same files or contend for the same resources.
- **Executing plan tasks in parallel** — that belongs to subagent-driven-development's Execution Tracks, declared in the plan. This skill stays ad-hoc independent work in one workspace.

## The brief

Each agent gets one task: the goal, the files it owns, the error messages and test names behind the failure, the constraint on what it must not touch, and the shape of the report you want back. Name the root cause you want found, so the agent does not settle for suppressing the symptom.

Issue every dispatch in the same response — one per response runs them sequentially.

```text
Subagent (role: implementer): "Fix agent-tool-abort.test.ts failures"
Subagent (role: implementer): "Fix batch-completion-behavior.test.ts failures"
```

## Integrate the results yourself

Read each report. Check whether agents edited the same code, and re-verify the seams where their changes meet. Run the checks toolbelt:verification-before-completion scopes for the changed files, plus focused checks where the waves' changes meet. Spot check the work: an agent can make a systematic error and report success.
