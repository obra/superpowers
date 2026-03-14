---
name: dispatching-parallel-agents
description: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
---

# Dispatching Parallel Agents

## Overview

Use Codex roles to split truly independent work across multiple agent threads.
Keep each role narrow, each scope explicit, and each ownership boundary clear.

**Core principle:** Dispatch one agent per independent problem domain. Let them work concurrently.

## When to Use

```dot
digraph when_to_use {
    "Multiple failures?" [shape=diamond];
    "Are they independent?" [shape=diamond];
    "Single agent investigates all" [shape=box];
    "One agent per problem domain" [shape=box];
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

**Use when:**
- 3+ test files failing with different root causes
- Multiple subsystems broken independently
- Each problem can be understood without context from others
- No shared state between investigations

**Don't use when:**
- Failures are related (fix one might fix others)
- Need to understand full system state
- Agents would interfere with each other

## The Pattern

### 1. Identify Independent Domains

Group failures by what's broken:
- File A tests: Tool approval flow
- File B tests: Batch completion behavior
- File C tests: Abort functionality

Each domain is independent - fixing tool approval doesn't affect abort tests.

### 2. Choose the Right Roles

Use the example Codex roles from `.codex/examples/agents/`:

- `explorer` - maps code paths and gathers evidence in read-only mode
- `worker` - owns the smallest safe fix inside an explicit file scope
- `reviewer` - summarizes cross-domain risk before integration
- `monitor` - watches long-running verification or background jobs
- `browser_debugger` - optional UI reproduction with browser tooling

If `browser_debugger` is not configured, fall back to `explorer + worker`.

### 3. Dispatch in Parallel

Each parallel agent gets:

- **Specific scope:** one domain, subsystem, or file group
- **Explicit ownership:** which files it may or may not touch
- **Role-appropriate job:** explore, reproduce, fix, or monitor
- **Expected output:** concise evidence and next step

Use `send_input` to clarify a running agent's task instead of replacing it.
Use `wait` only when you are blocked on results. Close completed agents with
`close_agent` after you integrate the outcome.

### 4. Review and Integrate

When the agents return:

- read each summary
- check for shared ownership or conflicting edits
- run the relevant verification
- use `reviewer` if you need a final cross-domain risk pass
- integrate only after the domains still look independent

## Prompt Patterns

Codex works best with prompts that assign named roles and a clear orchestration
goal.

### Independent failure domains

```text
Investigate these failures in parallel. Have explorer map the code path for
each domain, have worker own the smallest safe fix only when the root cause is
clear, and have reviewer summarize any shared risk before integration.
```

### UI debugging

```text
Investigate why the settings modal fails to save. Have browser_debugger
reproduce it, explorer trace the responsible code path, and worker implement
the smallest fix once the failure mode is clear.
```

### Homogeneous fan-out

Use `spawn_agents_on_csv` when the work is repeated row-by-row with the same
prompt shape. See `.codex/examples/prompts/dispatching-parallel-agents.md` for
ready-to-paste examples.

## Common Mistakes

**❌ Too broad:** "Fix everything that's broken"
**✅ Specific:** "Have explorer map the auth regression and worker own only the
session code path"

**❌ Shared ownership:** multiple workers editing the same files
**✅ Explicit ownership:** one worker per disjoint file scope

**❌ Vague orchestration:** "Use some subagents"
**✅ Named roles:** "Have explorer do X, worker do Y, reviewer summarize Z"

## When NOT to Use

**Related failures:** fixing one might resolve the others
**Need full system context:** one controller should reason about the whole flow
**Shared state:** multiple workers would touch the same files or resources
**Unclear ownership:** you cannot define who owns which change

## Verification

After agents return:

1. review each summary
2. confirm file ownership did not overlap
3. run the relevant verification
4. spot-check any surprising or high-risk fix

See `.codex/examples/prompts/dispatching-parallel-agents.md` for ready-to-paste
Codex prompt examples.
