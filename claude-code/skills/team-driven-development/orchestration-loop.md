# Orchestration Loop

The loop runs from Step 5 until all tasks are complete. Every single turn MUST be one of the loop actions below.

```
REPEAT until all tasks are completed:

  Track DEFER_STREAK counter (starts at 0):
  - Increment when ALL ready tasks are deferred in a cycle
  - Reset to 0 when a new worker is spawned OR a task is completed
    OR an active worker sends a message

  1. CHECK READY TASKS:
     TaskList → find tasks with status "pending", no owner, empty blockedBy

  2. FILE CONFLICT CHECK (before spawning):
     Maintain an ACTIVE FILE LOCK TABLE (mental or noted):
     - When spawning a worker: add its target_files to the lock table
     - When shutting down a worker: remove its target_files from the lock table
     - This avoids re-fetching metadata.target_files via TaskGet every cycle
     For each ready task, compare its metadata.target_files against the lock table:
     - If ANY target file overlaps with an active worker's task → DO NOT spawn, skip this task
     - Only spawn tasks whose target_files have ZERO overlap with active workers
     - Log skipped tasks: "Task N deferred — file conflict with worker-M on <file>"

  3. DEPENDENCY VERIFICATION (before spawning):
     For each ready task, verify:
     - ALL blockedBy tasks have status "completed" (not just "in_progress")
     - If a blockedBy task failed audit and is being reworked → task stays blocked
     - Double-check: TaskGet each blockedBy task to confirm completion

  4. SPAWN: For each ready task that passed conflict + dependency checks (up to 12 concurrent):
     - Spawn ONE worker per task (see worker-spawn-template.md)
     - Set task owner to worker name
     - TaskUpdate: { taskId: N, status: "in_progress", owner: "<worker-name>" }

  5. WAIT: For worker messages (automatic delivery)

  6. ROUTE: Based on message content:
     - API query → Direct the worker to check docs/api/ directory for contracts
     - Task complete → Forward summary to audit-agent
     - Blocker/question → Resolve and respond to worker
     - File conflict reported → STOP worker, resolve conflict, then resume

  7. AUDIT RESULT:
     - If audit-agent APPROVES:
       a. Shutdown worker (see Worker Shutdown Protocol below)
       b. TaskUpdate: { taskId: N, status: "completed" }
       c. Go to step 1 (completed task may unblock others + free file locks)
     - If audit-agent REJECTS:
       a. Forward rejection feedback to worker
       b. Report to user (brief):
          "audit-agent rejected Task N.
          Type: <reject type>
          Reason: <one-line summary>
          Fix instructions forwarded to worker."
       c. Go to step 5 (wait for worker's fix)

  8. DYNAMIC SCALING:
     - If a blocked task becomes unblocked (dependency completed) → check file conflicts → spawn if clear
     - If worker is stuck > 3 messages without progress → investigate, consider replacing
     - If new task discovered during work → TaskCreate with target_files + dependencies → add to loop
     - If file conflict resolved (worker shutdown) → re-check deferred tasks for spawning
     - SPIN DETECTION: If DEFER_STREAK reaches 3 (no new workers spawned,
       no tasks completed, AND no active worker messages received during
       those cycles), PAUSE the loop and escalate as blocker resolution
       (permitted action #6):
       a. Report the deadlock to your human partner with details
       b. List which tasks are deferred and why (file conflicts or dependency issues)
       c. Ask for guidance: split tasks, reorder dependencies, or force-proceed
       After receiving guidance, reset DEFER_STREAK to 0 and return to Step 1.
```

**Max concurrent workers:** Spawn up to 12 workers in parallel for independent tasks. When one completes and shuts down, its file locks are released and deferred tasks become eligible for spawning.

## Worker Shutdown Protocol

When audit-agent approves a worker's task:

```
1. SendMessage type: "shutdown_request" to worker-N
   content: "Task N approved by audit. Great work. Shutting down."
2. Worker responds with shutdown_response (approve: true)
3. TaskUpdate: { taskId: N, status: "completed" }
4. Worker process terminates — resources freed
5. Immediately check TaskList for next ready task
```

**If worker rejects shutdown** (still has work):
- Investigate — did audit miss something?
- If worker is wrong, re-send shutdown_request with explanation
- If worker is right, let it finish and re-route to audit
