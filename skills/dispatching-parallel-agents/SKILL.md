---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
---

# Dispatching Parallel Agents

Delegate tasks to specialized agents with isolated context. They never inherit your session — you construct exactly what they need.

**Core principle:** One agent per independent problem domain. Let them work concurrently.

## When to Use

```dot
digraph when_to_use {
    "Multiple failures?" [shape=diamond];
    "Are they independent?" [shape=diamond];
    "Single agent investigates all" [shape=box];
    "Can they work in parallel?" [shape=diamond];
    "Sequential agents" [shape=box];
    "Parallel dispatch" [shape=box];

    "Multiple failures?" -> "Are they independent?" [label="yes"];
    "Are they independent?" -> "Single agent investigates all" [label="no - related"];
    "Are they independent?" -> "Can they work in parallel?" [label="yes"];
    "Can they work in parallel?" -> "Parallel dispatch" [label="yes"];
    "Can they work in parallel?" -> "Sequential agents" [label="no - shared state"];
}
```

**Use when:** 3+ failures with different root causes, multiple independent subsystems broken, no shared state between investigations.

**Don't use when:** Failures are related, need full system context, agents would interfere (editing same files).

## Batch Sizing

For **bulk file changes** (same edit across many files), batch 5-8 files per agent. Too few agents = slow. Too many files per agent = context overload.

| Files | Agents | Files/Agent |
|-------|--------|-------------|
| 6-8   | 1      | 6-8         |
| 9-16  | 2      | 5-8         |
| 17-24 | 3      | 6-8         |
| 25+   | 4-5    | 5-8         |

For **distinct problem domains** (debugging, different subsystems), use 1 agent per domain regardless of file count.

## The Pattern

1. **Identify independent domains** — group by what's broken or what's changing
2. **Size batches** — bulk changes: 5-8 files/agent. Distinct problems: 1 agent/domain
3. **Create focused agent tasks** — each gets: specific scope, clear goal, constraints, expected output format
4. **Dispatch in parallel** — all agents run concurrently
5. **Review and integrate** — read summaries, verify no conflicts, run full suite

## Verification After Integration

1. Review each agent's summary
2. Check for conflicts (did agents edit same code?)
3. Run full test suite
4. Spot check — agents can make systematic errors

See `references/examples.md` for prompt templates, common mistakes, and a real-world walkthrough.
