---
name: cortx:auto
description: "Autonomous orchestration mode. Takes an objective, decomposes into tasks, dispatches sub-agents, reviews, and drives to completion. Use when the user invokes /cortx:auto."
---

# Autonomous Orchestration

Takes an objective and drives it to completion: decompose, dispatch, review,
gate, repeat. The user invokes `/cortx:auto "objective"` and the skill handles
everything from planning through merge.

**Announce at start:** "Starting cortx:auto -- autonomous orchestration mode."

## Entry Validation

1. Call `memory_status` to verify cortx MCP is connected. If it fails, stop:
   "cortx MCP not connected. Install cortx and configure the MCP server."
2. Extract the objective from the arguments passed to `/cortx:auto`.
3. If no objective was provided, ask the user: "What's the objective?"

## Configuration Display

Present hardcoded defaults and ask for confirmation before proceeding:

```
Objective understood. Here's my config:
  approve_decomposition:  true   -- review task list before execution
  spec_compliance_review: true   -- spec review after each task
  code_quality_review:    true   -- code review after each task
  approve_before_merge:   true   -- final approval before merge
  approve_each_task:      false  -- no per-task approval gate
  max_retries_before_escalate: 3
  parallel_agents:        2

Go? (or adjust what you want)
```

User confirms or adjusts conversationally. No config file -- hold config in
memory for the session.

## Phase 1: INIT

1. Call `memory_recall` with the current working directory to load project
   context (recent patterns, past decisions, known gotchas).
2. Call `proxy_status` to check remaining command budget.
3. If budget is below 50, warn: "Command budget is low ({N} remaining). Large
   objectives may not complete. Continue?"

## Phase 2: DECOMPOSE

1. Analyze the objective against the loaded project context.
2. Call `planning_decompose` to create tasks on the board with a dependency DAG.
   Each task needs: title, description, dependencies, and acceptance criteria.
3. Call `planning_list_tasks` to confirm the created tasks and their DAG.
4. **Gate**: if `approve_decomposition` is true, present the full task list with
   dependency graph and STOP. Do not proceed until the user approves. If the
   user requests changes, update and re-present.

## Phase 3: DISPATCH

Hand off execution to the orchestrator agent. Dispatch via the Agent tool with
the prompt from `agents/orchestrator.md`, filling these placeholders:

| Placeholder | Value |
|-------------|-------|
| `{OBJECTIVE}` | The user's objective |
| `{BOARD_ID}` | Board ID from `planning_decompose` |
| `{MEMORY_CONTEXT}` | Context loaded in INIT phase |
| `{CONFIG}` | Confirmed configuration object |
| `{PROJECT_ROOT}` | Current working directory |

The orchestrator agent handles the full cycle autonomously:
- **Phase 2** (execute loop): claim, context, dispatch implementer, handle
  result, review, gate, release -- per task in DAG order
- **Phase 3** (parallel): when `parallel_agents > 1` and independent tasks are
  ready, dispatch up to N implementers simultaneously in worktrees
- **Phase 4** (finish): final gate validation, session report, merge options

## Phase 4: MONITOR

After dispatching the orchestrator, you are done coordinating. The orchestrator
drives autonomously. It will:

- Report status at each phase transition
- Stop and ask the user at configured approval gates
- Escalate blocked tasks to the user
- Invoke `cortx:finishing-a-development-branch` when all tasks are done

## Phase 5: FINISH

The orchestrator completes the session by:

1. Calling `session_report` for a full summary
2. Calling `memory_store` with session-level learnings
3. Presenting merge options (merge, PR, keep, discard) per
   `cortx:finishing-a-development-branch`

**Early termination** -- if budget runs out or all tasks are escalated, the
orchestrator stops immediately, calls `session_report`, and reports status to
the user.

## Error Handling

| Situation | Action |
|-----------|--------|
| cortx MCP not connected | Stop at entry validation |
| No objective provided | Ask the user |
| Low command budget | Warn before proceeding |
| Orchestrator reports all tasks escalated | Present blocker summary |
| Budget exhausted mid-execution | Orchestrator stops, reports progress |

## Red Flags

- **Never skip entry validation** -- always verify MCP connection first
- **Never skip decomposition approval** -- if the gate is on, wait for the user
- **Never bypass the orchestrator** -- do not inline-execute tasks yourself
- **Never proceed without user confirmation on config** -- always present and wait
