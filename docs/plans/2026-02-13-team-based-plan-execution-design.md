# Team-Based Plan Execution

## Problem

The execution skills (`executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`) use a sequential subagent dispatch pattern: one subagent at a time, with the main agent as controller. Claude Code now offers an agent teams feature (`TeamCreate`, `SendMessage`, shared `TaskList`) that enables true parallel execution with persistent inter-agent coordination.

Since superpowers is cross-platform (Claude Code, Codex, OpenCode), team support must be additive: detect availability, ask the user, and fall back to the current pattern when teams aren't available.

## Suggested Approach

### Detection & User Choice Flow

When an execution skill starts, before dispatching work:

1. **Detect** whether the environment supports teams (e.g., attempt `TeamCreate` or check for the tool's availability)
2. **If available**, ask the user: "Agent teams are available. Would you like to use a team for parallel execution, or proceed with the standard sequential approach?"
3. **If not available** (or user declines), proceed with the current subagent pattern unchanged

This keeps superpowers fully functional on Codex, OpenCode, and Claude Code installations without teams enabled.

### What Teams Enable

- **True parallelism:** Multiple implementer agents working on independent tasks simultaneously, instead of one-at-a-time
- **Persistent coordination:** Team members can message each other, share findings, and coordinate through a shared task list - the controller isn't a bottleneck
- **Structured lifecycle:** Teams have explicit creation, task assignment, and shutdown phases that map naturally to plan execution

## Per-Skill Impact

### `subagent-driven-development` (highest value)

Currently dispatches one implementer subagent at a time, waits for completion, runs two review stages, then moves to next task. With teams:

- Spawn a team with implementer agents that can work on independent tasks in parallel
- Reviewer agents can be dispatched as tasks complete, without blocking other implementers
- The controller orchestrates via the shared task list and messages rather than sequential dispatch
- Constraint: tasks with dependencies still run sequentially - only independent tasks parallelize

### `dispatching-parallel-agents` (natural fit)

Already designed for parallel independent work, but currently uses individual `Task` tool calls without coordination. With teams:

- Agents become team members that can share findings via `SendMessage`
- Results are collected through the shared task list rather than waiting for individual agent returns
- Better visibility into progress while agents work

### `executing-plans` (modest benefit)

Designed for batch execution with human review checkpoints between batches. With teams:

- Tasks within a batch could run in parallel instead of sequentially
- Review checkpoints between batches remain unchanged (human-in-the-loop)
- Benefit is smaller here since the human review gates limit parallelism

## Proposed Phases

### Phase 1: Team detection and user choice infrastructure

Add a shared pattern (usable by all three skills) that detects team availability and prompts the user. When teams aren't available or declined, the existing behavior is preserved exactly.

### Phase 2: `subagent-driven-development` team mode

Highest value - this skill already orchestrates multiple subagents and has the most to gain from parallelism. Implement team-based execution as an alternative path alongside the current sequential path.

### Phase 3: `dispatching-parallel-agents` team mode

Natural fit - upgrade from fire-and-forget parallel `Task` calls to coordinated team members with messaging and shared task tracking.

### Phase 4: `executing-plans` team mode

Modest benefit - parallelize tasks within a batch while preserving human review checkpoints between batches.

## Cross-Platform Considerations

Since superpowers supports Claude Code, Codex, and OpenCode, all team-related instructions must be gated behind detection. Skills should maintain two clear paths:

- **Current subagent pattern** (default, works everywhere)
- **Team pattern** (Claude Code with teams enabled, user opted in)

No skill should break or degrade on non-Claude-Code environments.
