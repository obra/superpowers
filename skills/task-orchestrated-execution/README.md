# Task-Orchestrated Execution

Executes task graphs by dispatching waves of parallel agents while respecting dependencies.

## Purpose

Automates execution of task graphs created by `task-dependency-management`. Maximizes parallelism by dispatching multiple agents per wave, only waiting when dependencies require it.

## Key Features

- Finds ready tasks (blockedBy: [], status: pending)
- Dispatches parallel agents for independent tasks
- Monitors completion and handles failures
- Updates task status to unblock dependent tasks
- Repeats in waves until all tasks complete
- Provides concrete workflow with actual tool calls

## When to Use

Use after creating a task graph. Automates parallel execution without manual orchestration.

## Files

- `SKILL.md` - Main skill with execution loop, examples, and failure handling

## Integration

**Requires:** `superpowers:task-dependency-management` (to create task graph)

**Invokes:** `superpowers:finishing-a-development-branch` (when all tasks complete)

## Example Workflow

```
Wave 1: Dispatch Task 1 → wait → mark complete
Wave 2: Dispatch Tasks 2, 3 in parallel → wait → mark both complete
Wave 3: Dispatch Task 4 → wait → mark complete
All complete → verify → finish development
```

## Key Difference from Other Skills

- **vs. executing-plans**: Parallel execution with dependency tracking (not sequential)
- **vs. subagent-driven-development**: Automated waves (not manual review per task)
- **vs. dispatching-parallel-agents**: Handles dependencies (not just independent tasks)
