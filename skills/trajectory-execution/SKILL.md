---
name: trajectory-execution
description: Use when an SDD coordinator is advancing tasks inside an assigned trajectory, handling a task report or review, or assessing trajectory completion
---

# Trajectory Execution

**A trajectory contains tasks. Task review advances the workstream;
verified trajectory integration releases other workstreams.**

Use this skill directly in the SDD coordinator's context. It is a task-loop
protocol, not a request for another coordinator agent. SDD owns the plan's
graph, ledger, worktrees, boundary changes, integration and final review.

## The Next Transition

Advance the selected trajectory to its next dispatch or completed transition,
then return to SDD's scheduler. While an agent runs, process other ready
trajectories and incoming results. Do not run a blocking trajectory-to-completion
loop that serializes independent work.

| State | Coordinator action |
|---|---|
| Pending task, internal prerequisites reviewed | Dispatch a fresh implementer |
| Implementer DONE | Freeze task HEAD and dispatch separate task reviewer |
| Review finds blocking issues | Resume implementer and use the existing fix loop |
| Task review gate satisfied | Record task complete; release its internal dependents |
| All assigned tasks complete | Run trajectory completion checks and freeze final HEAD |
| Trajectory ready | Return pinned result to SDD for serialized integration |

Only one task writer is active in a trajectory worktree. Stop writes and
processes before review; keep the worktree frozen while its reviewer reads.
Sequential tasks can edit the same file. Concurrent writers need separate
trajectories with safe ownership and resource isolation.

## Dispatch a Task

Read the plan's Global Constraints and this task's contracts. Record the
task's BASE as the exact current reviewed trajectory HEAD **before dispatch**.
The first task starts at the trajectory's dispatch base; later tasks start
at the previous completed task's HEAD, not at plan integration.

Use absolute paths to SDD's existing helpers from the integration worktree:

```text
bash <sdd>/scripts/task-brief <absolute-plan> <global-task-number>
bash <sdd>/scripts/review-package <absolute-plan> <task-base> <task-head>
```

After extraction, apply applicable recorded boundary amendments to the
generated brief: retain its global task ID and include its current owning
trajectory, revised contracts and amendment provenance. Repeat this on
regeneration; the original plan heading may still name the former trajectory.

Give the implementer the brief path, inherited constraints, prerequisite
interfaces and rulings, trajectory ID/worktree/branch, expected starting HEAD,
task BASE, allowed files, resources, check commands and assigned report path.
Use SDD's [implementer template](../subagent-driven-development/implementer-prompt.md).
The brief is the requirement source; do not paste session history or make
the worker read the whole plan. Workers never write the shared ledger.

A fresh implementer owns the task's production code **and tests**. Follow
superpowers:test-driven-development: write a failing test, observe RED,
implement, observe GREEN. The implementer verifies, commits, self-reviews and
reports. It never dispatches helpers or reviewers. There is no separate
test-authoring agent.

Use the existing narrow [batching rule](../subagent-driven-development/references/batching.md)
only for eligible same-shape work within this trajectory.

## Handle Reports and Reviews

DONE means ready for task review. Other statuses use SDD's
[report handling](../subagent-driven-development/references/handling-reports.md).
Do not advance an unclear or blocked task by treating concerns as approval.

Verify branch, clean worktree, stopped writer and exact task HEAD. Generate
the review package from the recorded **task BASE..HEAD**, not trajectory
BASE..HEAD, integration HEAD or HEAD~1. Dispatch a fresh task reviewer with
the brief, report and package paths, binding constraints, trajectory assignment,
ownership/resources and exact SHAs, using the
[task-reviewer template](../subagent-driven-development/task-reviewer-prompt.md).
It checks spec compliance, then quality, including test quality. The report
carries test evidence; reviewers do not rerun the suite merely to repeat it.

Resolve [cannot-verify items](../subagent-driven-development/references/cannot-verify.md)
and use the existing [fix loop](../subagent-driven-development/references/fix-loop.md)
for blocking findings. Fixes stay in this trajectory, with no competing writer.
Keep existing round caps, scoped re-reviews and explicit parked rulings.

After the review gate is satisfied, record:

```text
Task <N>: complete (trajectory <T>, commits <task-base>..<task-head>, review clean)
```

If findings were parked at the cap, record their count instead of `review clean`.
Mark the task todo complete and release only internal task dependents. Keep
the trajectory branch/worktree for its remaining tasks; **do not merge the
task into plan integration**.

Example: T2 contains persistence Task 2 and API Task 3; T3 contains independent
panel Task 4. After Task 2's review, dispatch Task 3 from its HEAD in T2's
existing worktree while T3 continues. T2 is not ready to integrate yet.

## Finish the Trajectory

When every task in its current recorded scope is complete, run its exact
completion checks against the complete trajectory tree. Confirm no task
writer/reviewer or resource-using process remains active, the worktree is
clean, and every new commit has its applicable review gate satisfied.
Record the final pinned HEAD and check evidence; set the trajectory ready.
SDD performs [serialized integration](../subagent-driven-development/references/parallel-integration.md).
Readiness is not integration and releases no external dependent.

If there is a clean earlier boundary, return that candidate and remaining
task IDs to SDD. Only SDD revises scope/dependencies and creates successors;
do not silently integrate partial work or drop pending tasks.

## Common Mistakes

- One branch per task: branches/worktrees belong to trajectories; task
  reviews use successive task-local bases on that branch.
- DONE equals integrated: implementer DONE starts review; task complete
  advances internal work; verified trajectory integration releases external work.
- New coordinator per trajectory: invoke this skill directly; dispatch only
  the original implementer/reviewer roles.
- Cleanup after a task: preserve the worktree until its trajectory is verified
  integrated and all agents stop.
