---
name: subagent-driven-development
description: Use when executing a plan in the current session with subagents, per-task implementation, and staged reviews.
---

# Subagent-Driven Development

Execute a plan with fresh subagents per task and strict review gates.

## Required Start

Announce: `I'm using subagent-driven-development to execute this plan.`

## Core Flow

1. Read the plan once and extract all tasks.
2. Create task tracking for all tasks.
3. For each task:
- Dispatch implementer subagent with full task text and minimal required context.
- Resolve implementer questions before coding.
- Require implementer verification evidence.
- Run spec-compliance review.
- If spec fails, return to implementer and re-review.
- Run code-quality review.
- If quality fails, return to implementer and re-review.
- Mark task complete.
   - For complex or high-risk tasks, you may dispatch a `senior-engineer` subagent to review or refine the approach before or after the implementer’s work.
   - For tasks centered on frontend/UI, you may apply `frontend-craftmanship` standards to guide structure, styling, and accessibility.
4. Run final whole-branch review.
5. Invoke `finishing-a-development-branch`.

### (Claude Code only) Native task sync

If the plan has an associated `.tasks.json` file and native tasks:

- When you first extract tasks from the plan, you may ensure there is one native task per plan task (creating any missing ones with `TaskCreate` and full task text).
- Each time a task passes both spec-compliance and code-quality review, you may:

```yaml
TaskUpdate:
  taskId: <task-id>
  status: completed
```

- Keep the `.tasks.json` file in sync with the native task statuses and `lastUpdated` timestamps so other sessions can resume execution with the same task graph.

## Optional Speed Mode: Parallel Waves

Use only when tasks are independent and touch disjoint files.

1. Build a wave of independent tasks.
2. Dispatch implementers in parallel for that wave.
3. Review each task with the same two-stage gate.
4. Run integration verification after the wave.

If any overlap or shared-state risk exists, revert to single-task sequence.

## Blocked Task Protocol

When an implementer fails on the same task after 2 attempts:

1. Stop. Do not attempt a third implementation.
2. Surface the block to the user with: task name, failure evidence, and what was tried.
3. If the block is architectural or design-level: invoke `senior-engineer` subagent to review the approach before attempting again.
4. If the user is unavailable and the task is non-critical: document the block in `state.md` and advance to the next independent task. Never silently skip or mark a blocked task complete.

## Hard Rules

- Do not execute implementation on `main`/`master` without explicit user permission.
- Do not skip spec review.
- Do not skip quality review.
- Do not accept unresolved review findings.
- Do not ask subagents to read long plan files when task text can be passed directly.

## Context Hygiene

For each subagent prompt include only:
- Task text
- Acceptance criteria
- Needed file paths
- Relevant constraints

Exclude unrelated prior assistant analysis and old failed hypotheses.

## Prompt Templates

Use:
- `./implementer-prompt.md`
- `./spec-reviewer-prompt.md`
- `./code-quality-reviewer-prompt.md`

## Integration

- Setup workspace first with `using-git-worktrees`.
- Use `requesting-code-review` templates for quality review structure.
- Finish with `finishing-a-development-branch`.
