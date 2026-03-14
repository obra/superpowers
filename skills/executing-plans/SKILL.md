---
name: executing-plans
description: >
  MUST USE when a plan.md exists and implementation needs to begin.
  Executes in controlled batches with verification checkpoints. Triggers
  on: "execute the plan", "start building", "follow the plan", "go".
  Routed by using-superpowers or writing-plans handoff.
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
9. For tasks involving UI/UX or frontend implementation, apply guidance from `frontend-craftsmanship` to ensure production-grade, accessible interfaces.

## Engineering Rigor for Complex Tasks

When a task is architectural, high-risk, or touches cross-module boundaries:
- Validate the approach against requirements and constraints before coding.
- Identify edge cases and error paths specific to this task.
- Consider simpler architectures or alternative approaches.
- Ensure changes remain maintainable and don't create hidden coupling.
- If 2 implementation attempts fail, pause and reassess the approach rather than forcing a third attempt.

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

Do not carry long historical summaries that are unrelated to the current batch. Never forward full session history to subagents — construct their prompts from scratch with only the items above.

## Completion

After all tasks pass verification:
1. Announce `finishing-a-development-branch`.
2. Invoke `finishing-a-development-branch`.
