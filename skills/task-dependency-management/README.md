# Task Dependency Management

Converts implementation plans into managed task graphs with explicit dependency tracking, creating both runtime TaskList entries and durable JSON artifacts.

## Purpose

Makes implicit dependencies in plans explicit using TaskCreate/TaskUpdate tools (runtime) and JSON files (durable artifacts). Enables parallel execution by clearly showing which tasks can run simultaneously and which must wait. The implementation plan from `writing-plans` remains the source of truth.

## Key Features

- Parses implementation plans created by `writing-plans`
- Extracts tasks, files, and dependencies
- Creates managed tasks with TaskCreate (runtime tracking)
- Exports task graph to JSON file (durable artifact)
- Sets up dependency graph with TaskUpdate (blockedBy/blocks)
- Detects file-based, type-based, and sequential dependencies
- Handles edge cases (circular dependencies, conflicts)
- Enables session resumption via JSON artifact

## When to Use

Use before executing multi-task implementation plans. Prepares the task graph for systematic execution.

## Files

- `SKILL.md` - Main skill documentation with parsing rules and examples

## Integration

**Requires:** `superpowers:writing-plans` (to create the plan)

**Enables:**
- `superpowers:task-orchestrated-execution` (to execute the task graph)
- Manual execution with TaskList + Task tool

## Example Output

After running this skill, TaskList shows:
```
Task 1: pending, blockedBy: []
Task 2: pending, blockedBy: [1]
Task 3: pending, blockedBy: [1]
Task 4: pending, blockedBy: [2, 3]
```

Ready for orchestrated execution.
