---
name: executing-plans
description: >
  Executes an existing implementation plan in controlled batches with
  verification checkpoints. Invoke when a plan.md exists and user says
  "execute the plan", "start building", or "follow the plan". Routed by
  using-superpowers or writing-plans handoff.
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
10. For tasks involving UI/UX or frontend implementation, apply guidance from `frontend-craftsmanship` to ensure production-grade, accessible interfaces.

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
2. Invoke `finishing-a-development-branch`.
