---
name: task-orchestrated-execution
description: Use when you need to execute a task graph with dependency-aware parallel agents
---

# Task-Orchestrated Execution

## Overview

Execute task graphs by dispatching waves of parallel agents. Each wave handles tasks whose dependencies are satisfied. Maximizes parallelism while respecting blockers.

**Core principle:** Find ready tasks (blockedBy empty), dispatch agents in parallel, mark complete, repeat. Simple loop with dependency awareness.

**Works with durable plans:** This skill orchestrates execution of implementation plans created by `writing-plans`. The plan file remains the source of truth; this skill uses TaskList for runtime coordination. Task graphs can be persisted to JSON by `task-dependency-management` for durability.

**Note:** This is a NEW skill that adds functionality not present in existing superpowers skills. It does not modify or replace any existing workflows.

**Announce at start:** "I'm using the task-orchestrated-execution skill to execute this task graph with parallel agents."

**Prerequisites:**
- Task graph created (use superpowers:task-dependency-management)
- Tasks have proper dependencies set
- Working in environment with Task and TaskUpdate tools

**Important:** These skills use Claude Code's TaskCreate/TaskUpdate/TaskList tools. Do NOT use TodoWrite checkboxes in combination with these skills, as it creates duplicate tracking. Choose one approach:
- TaskCreate/TaskUpdate → Use these skills
- TodoWrite checkboxes → Use subagent-driven-development or executing-plans

**Platform Note:** TaskCreate/TaskUpdate/TaskList are Claude Code-specific tools. The task dependency management skill exports a JSON task graph (platform-neutral) for durability. The implementation plan from `writing-plans` remains the authoritative source of task content.

**Session Management:** TaskList state is session-local. For long-running work, the JSON task graph from `task-dependency-management` allows resumption. Task status updates during execution are in-memory only unless explicitly persisted.

## Quick Start

1. Find ready tasks → 2. Dispatch parallel agents → 3. Wait → 4. Mark complete → 5. Repeat

See full process below for details.

## When to Use

Use when:
- Task graph exists (TaskList shows tasks with dependencies)
- Want automated parallel execution
- Tasks are well-specified (agents can execute independently)
- Don't need human review between every task

Don't use when:
- No task graph - use superpowers:task-dependency-management first
- Need review between tasks - use superpowers:subagent-driven-development
- Tasks aren't independent - agents would conflict

## Choosing the Right Execution Skill

| Feature | task-orchestrated-execution | subagent-driven-development | executing-plans |
|---------|---------------------------|----------------------------|-----------------|
| Parallelism | ✅ Multi-wave | ❌ Sequential | ❌ Sequential |
| Review between tasks | ❌ No | ✅ Yes (2-stage) | ⚠️ Checkpoints only |
| Dependency tracking | ✅ Automatic (blockedBy) | ❌ Manual order | ❌ Manual order |
| Task state management | ✅ TaskList | ⚠️ TodoWrite | ⚠️ TodoWrite |
| Resumability | ✅ Yes (persistent state) | ⚠️ Limited | ⚠️ Limited |
| Speed | ⭐⭐⭐ Fast (parallel) | ⭐⭐ Medium | ⭐ Slow (sequential) |
| Supervision | Low (automated) | High (review each) | Medium (checkpoints) |

**Choose this when:**
- You want automatic parallelization
- Tasks have dependencies to track
- You trust the plan and want speed
- You don't need review between every task

**Choose subagent-driven-development when:**
- You want review between every task
- Quality matters more than speed
- Tasks are complex and need scrutiny

**Choose executing-plans when:**
- Plan is simple (< 5 tasks)
- No parallelism opportunities
- Want simple, straightforward execution

## The Process

### Initial Setup

```
TaskList()
```

**Verify before starting:**

```
# Check tasks exist
IF TaskList returns empty:
  ERROR: "No tasks found. Did you run task-dependency-management first?"
  EXIT

# Check dependencies are set
IF all tasks show blockedBy: undefined:
  ERROR: "Dependencies not set. Run task-dependency-management first."
  EXIT

# Check tasks are pending
IF no tasks have status: "pending":
  ERROR: "No pending tasks. All tasks may already be completed."
  EXIT

# Ready to begin orchestration
```

Verify:
- Tasks exist
- Dependencies are set (blockedBy arrays populated)
- All tasks status: "pending"

### Main Execution Loop

```
iteration_without_progress = 0
max_iterations = 3

WHILE TaskList() shows pending tasks:

  1. Find ready tasks (blockedBy: [], status: pending)

  # Deadlock detection
  IF no ready tasks found:
    iteration_without_progress += 1
    IF iteration_without_progress >= max_iterations:
      STOP orchestration
      ERROR: "No tasks are ready after 3 iterations. Possible circular dependency."
      Show: TaskList with all blockedBy arrays
      Ask user to check dependency graph
      EXIT
  ELSE:
    iteration_without_progress = 0  # Reset counter

  2. Check for file conflicts between ready tasks
  3. Dispatch agents (parallel for non-conflicting tasks)
  4. Mark tasks as in_progress
  5. Wait for all agents in wave to complete
  6. Review agent outputs
  7. Mark successful tasks as completed
  8. Handle failed tasks
  9. Loop back (newly unblocked tasks now ready)

END WHILE
```

### Step-by-Step

**Step 1: Find Ready Tasks**

```
TaskList()

# Look for:
# - status: "pending"
# - blockedBy: [] (empty array)

Example output:
Task 1: pending, blockedBy: []       ← Ready!
Task 2: pending, blockedBy: [1]      ← Blocked
Task 3: pending, blockedBy: [1]      ← Blocked
```

Tasks 2 and 3 are waiting for Task 1 to complete.

**When to use TaskGet vs TaskList:**
- **TaskList:** Get overview of all tasks (subject, status, blockedBy)
- **TaskGet:** Get full description/instructions for a specific task

In orchestration:
- Use TaskList to find ready tasks
- Use TaskGet only when dispatching agent (to get full instructions)

**Step 2: Check for File Conflicts**

Before dispatching multiple ready tasks in parallel, check if they modify the same files:

```
ready_tasks = [Task 3, Task 4]

# Get files each task will modify (from task descriptions)
task3_files = ["src/transports/email.py", "tests/test_email.py"]
task4_files = ["src/transports/sms.py", "tests/test_sms.py"]

# Check for overlap
overlapping_files = intersection(task3_files, task4_files)

IF overlapping_files is not empty:
  # File conflict - dispatch sequentially
  Dispatch Task 3 → wait → complete → then Task 4
ELSE:
  # No conflict - safe to parallelize
  Dispatch Task 3 and Task 4 in parallel
```

**Common conflict scenarios:**
- Both tasks modify `config.py`
- Both tasks modify same model file
- Both tasks run migrations on same database

**Solution:** Dispatch sequentially even if both ready.

**Step 3: Dispatch Agents in Parallel**

For each ready task (without file conflicts), dispatch using Task tool:

```
# Get full task details
TaskGet("1")

# Dispatch agent
Task({
  subagent_type: "general-purpose",
  description: "Execute Task 1 from implementation plan",
  prompt: `
    You are executing a task from an implementation plan.

    **Task:** Task 1: Create User Model

    **Full task content:**
    ${taskDescription from TaskGet}

    **Instructions:**
    1. Read the plan task steps carefully
    2. Execute each step exactly as specified
    3. Run all tests/verifications mentioned
    4. Commit when instructed
    5. Report back with:
       - Summary of what you did
       - Files created/modified
       - Test results
       - Any issues encountered

    **Important:** Stay within the scope of this task. Other tasks depend on you completing this correctly.
  `
})
```

**Step 4: Mark as In Progress**

For multiple tasks in a wave, use parallel tool calls:

```
# Dispatch both agents in parallel in same message
Task({...prompt for Task 3...})
Task({...prompt for Task 4...})

# Then mark both in_progress in parallel
TaskUpdate({taskId: "3", status: "in_progress"})
TaskUpdate({taskId: "4", status: "in_progress"})
# Both TaskUpdate calls can be made in same message for efficiency
```

This prevents dispatching them again in next iteration.

**Step 5: Wait for Completion**

Agents run and return results. Read their output:

```
Agent (Task 1) returns:
"Task complete. Created src/models/user.py with User class.
All tests passing (3/3). Committed with message 'feat: add User model'"
```

**Step 6: Review Output**

Check:
- Did agent complete the task?
- Were all steps executed?
- Tests passing?
- Any errors?

**Step 7: Mark Complete (if successful)**

```
TaskUpdate({
  taskId: "1",
  status: "completed"
})
```

This automatically unblocks dependent tasks!

**Step 8: Loop Back**

```
TaskList()

Output:
Task 1: completed, blockedBy: []
Task 2: pending, blockedBy: []   ← NOW READY (Task 1 is complete)
Task 3: pending, blockedBy: []   ← NOW READY (Task 1 is complete)
```

Dispatch Tasks 2 and 3 **in parallel** in Wave 2.

## Complete Example

**Starting state:**
```
Task 1: pending, blockedBy: []
Task 2: pending, blockedBy: []
Task 3: pending, blockedBy: [1, 2]
Task 4: pending, blockedBy: [1, 2]
Task 5: pending, blockedBy: [3, 4]
```

### Wave 1: Tasks 1 & 2 (Parallel)

```
You: TaskList shows Tasks 1 and 2 ready (both blockedBy: [])

You: Checking for file conflicts...
Task 1 files: [src/models/notification.py]
Task 2 files: [src/models/user.py]
No overlap → safe to parallelize

You: Dispatching agents for Tasks 1 and 2 in parallel...

[Call Task tool for Task 1]
[Call Task tool for Task 2]

You: Marking both as in_progress...

TaskUpdate({taskId: "1", status: "in_progress"})
TaskUpdate({taskId: "2", status: "in_progress"})

You: Waiting for both agents to complete...

Agent 1: Task complete. Created notification.py. Tests pass. Committed.
Agent 2: Task complete. Created user.py. Tests pass. Committed.

You: Reviewing both outputs... both look good.

You: Marking both as completed...

TaskUpdate({taskId: "1", status: "completed"})
TaskUpdate({taskId: "2", status: "completed"})

You: Tasks 1 and 2 complete. Checking for newly ready tasks...
```

### Wave 2: Tasks 3 & 4 (Parallel)

```
You: TaskList shows Tasks 3 and 4 ready (both blockedBy: [] now)

You: Checking for file conflicts...
Task 3 files: [src/transports/email.py]
Task 4 files: [src/transports/sms.py]
No overlap → safe to parallelize

You: Dispatching agents for Tasks 3 and 4 in parallel...

[Call Task tool for Task 3]
[Call Task tool for Task 4]

TaskUpdate({taskId: "3", status: "in_progress"})
TaskUpdate({taskId: "4", status: "in_progress"})

Agent 3: Task complete. Created email.py. Tests pass. Committed.
Agent 4: Task complete. Created sms.py. Tests pass. Committed.

TaskUpdate({taskId: "3", status: "completed"})
TaskUpdate({taskId: "4", status: "completed"})

You: Tasks 3 and 4 complete. Checking for newly ready tasks...
```

### Wave 3: Task 5

```
You: TaskList shows Task 5 ready (blockedBy: [] now - both 3 and 4 are complete)

You: Dispatching agent for Task 5...

[Call Task tool for Task 5]

TaskUpdate({taskId: "5", status: "in_progress"})

Agent: Task complete. Created service.py. Tests pass. Committed.

TaskUpdate({taskId: "5", status: "completed"})

You: All tasks complete!

TaskList():
Task 1: completed
Task 2: completed
Task 3: completed
Task 4: completed
Task 5: completed

You: Running final verification...
```

## Handling Failures

### Agent Reports Failure

```
Agent: ERROR: Tests failing. Cannot complete task.

# Do NOT mark as completed
# Keep status: in_progress

You: Agent failed on Task 2. Error: Tests failing.

You: Reading agent output to understand issue...

[Read error details]

You: Issue is X. Need to fix before proceeding.

Options:
1. Fix manually and re-run task
2. Re-dispatch agent with more context
3. Stop orchestration and ask user

# Never mark failed task as complete
# Dependent tasks should not dispatch
```

### Agent Gets Stuck

```
Agent: I don't have enough context to complete this task.

You: Agent blocked on Task 3 due to missing context.

# Keep as in_progress
# Provide context manually or ask user

You: Providing additional context...

[Re-dispatch agent with context]
```

### Dependency Issue Discovered

```
Agent: This task requires file X but it doesn't exist.

You: Dependency error - Task 4 needs file X from Task 2, but Task 2 didn't create it.

# STOP orchestration
# Report issue to user

You: Stopping orchestration. Dependency graph is incorrect. Task 4 depends on file that Task 2 should have created but didn't.
```

### Deadlock Detected

```
Iteration 1: No ready tasks (all have blockers)
Iteration 2: No ready tasks (all still blocked)
Iteration 3: No ready tasks (all still blocked)

# Deadlock detection triggers

You: STOPPING orchestration. No tasks have become ready after 3 iterations.

You: Current state:
TaskList()
Task A: pending, blockedBy: [B]
Task B: pending, blockedBy: [A]

You: Circular dependency detected. Task A waits for B, B waits for A.

You: Please revise the dependency graph using task-dependency-management.
```

## Parallelism Rules

**Can dispatch in parallel when:**
- Tasks have no blockers (blockedBy: [])
- Tasks don't modify same files
- Tasks are in same wave

**Example:**
```
Task 2: Create user_service.py, blockedBy: [1]
Task 3: Create payment_service.py, blockedBy: [1]
```

After Task 1 completes, both become ready. Different files, no conflicts → dispatch both.

**Cannot dispatch in parallel when:**
- Both modify same file (conflict risk)
- One depends on other
- Shared state (database, external service)

**Example:**
```
Task 2: Modify config.py
Task 3: Modify config.py
```

Even if both ready, dispatch sequentially to avoid conflicts.

## Verification Before Completion

After all tasks complete:

```
TaskList()
# Verify all show status: completed

Bash("pytest")
# Run full test suite

Bash("git status")
# Check for unexpected changes

# If all good:
Use superpowers:finishing-a-development-branch
```

## Common Mistakes

**❌ Not waiting for wave to complete**
```
Dispatch Task 1
TaskUpdate Task 1 → in_progress
Immediately check TaskList
# Task 1 not done yet! Don't start wave 2
```

**✅ Correct:** Wait for all agents in wave to complete before checking for next wave

**❌ Marking failed tasks as complete**
```
Agent: Tests failed
TaskUpdate({taskId: "2", status: "completed"})
# WRONG - dependent tasks will start and fail
```

**✅ Correct:** Keep failed tasks in_progress, investigate

**❌ Dispatching blocked tasks**
```
Task 2 blockedBy: [1]
Task 1 status: in_progress (not complete yet)
# Dispatch Task 2 anyway
# WRONG - Task 2 will fail, missing dependencies
```

**✅ Correct:** Only dispatch when blockedBy is FULLY satisfied (all blocking tasks completed)

**❌ Forgetting to mark in_progress**
```
Dispatch Task 1
# Forget to TaskUpdate
Next iteration: Task 1 still shows as pending
Dispatch Task 1 again!
# Now two agents working on same task
```

**✅ Correct:** Always TaskUpdate to in_progress immediately after dispatch

**❌ Ignoring deadlock warnings**
```
No ready tasks for 3 iterations
# Keep looping forever
# System hangs
```

**✅ Correct:** Exit when deadlock detected, report to user

**❌ Parallel dispatch with file conflicts**
```
Task 3: Modify config.py
Task 4: Modify config.py
# Both ready, dispatch in parallel
# Git merge conflicts!
```

**✅ Correct:** Check for file overlap, dispatch sequentially if conflict

## Integration with Other Skills

**Required predecessor:**
- **superpowers:task-dependency-management** - Creates the task graph

**Can invoke:**
- **superpowers:finishing-a-development-branch** - After all tasks complete

**Alternative to:**
- **superpowers:executing-plans** - Sequential, no task management
- **superpowers:subagent-driven-development** - Manual review between tasks

## Remember

- Verify TaskList has tasks before starting
- Find ready tasks: blockedBy empty, status pending
- Check for file conflicts before parallel dispatch
- Dispatch in parallel when safe
- Mark in_progress immediately
- Wait for wave to complete
- Review outputs carefully
- Mark completed only if successful
- Handle failures gracefully
- Detect deadlocks (no progress for 3 iterations)
- Loop until all complete
- Verify before finishing
