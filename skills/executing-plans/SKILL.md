---
name: executing-plans
description: >
  MUST USE when executing an existing implementation plan in batches with
  review checkpoints. Triggers on: "execute the plan", "start building",
  "follow the plan", when a plan.md exists and user wants to begin work.
---

# Executing Plans

Implement an approved plan in controlled batches with explicit verification.

## Required Start

Announce: `I'm using the executing-plans skill to implement this plan.`

## Process

1. Read the plan completely.
2. Ensure isolated workspace is ready (`using-git-worktrees`).
3. Identify blockers or ambiguities; ask before starting if any exist.
4. Create task tracking entries.
5. Execute the next batch (default: 3 tasks).
6. Run required verification commands for each task.
7. Report completed work and evidence.
8. Wait for feedback, then continue with next batch.
9. For particularly complex or architectural tasks, consider invoking `senior-engineer` for design and approach validation before implementation.
10. For tasks involving UI/UX or frontend implementation, apply guidance from `frontend-craftmanship` to ensure production-grade, accessible interfaces.

### (Claude Code only) Align with native tasks

When native tasks and a `.tasks.json` file exist:

- At the start of execution, use `TaskList` and the `.tasks.json` next to the plan (for example `docs/plans/<plan>.md.tasks.json`) to:
  - Reconcile which tasks are `pending`, `in_progress`, or `completed`.
  - Recreate any missing native tasks or dependencies with `TaskCreate` / `TaskUpdate`.
- As you start a task from the plan, you may:

```yaml
TaskUpdate:
  taskId: <task-id>
  status: in_progress
```

- When you complete a task and its verifications:

```yaml
TaskUpdate:
  taskId: <task-id>
  status: completed
```

- After each status change, update the corresponding entry in `.tasks.json` (status and `lastUpdated` timestamp) so new sessions can resume correctly.

## Execution Rules

- Do not skip plan steps unless user approves deviation.
- Stop immediately on repeated verification failures.
- Keep edits scoped to the current task batch.
- Do not claim completion without fresh command output.

## Context Hygiene

For each batch, restate only:
- Current tasks
- Constraints
- Relevant prior decisions
- Verification evidence

Do not carry long historical summaries that are unrelated to the current batch.

## Completion

After all tasks pass verification:
1. Announce `finishing-a-development-branch`.
2. Invoke `superpowers-custom:finishing-a-development-branch`.
