---
name: executing-plans
description: Use when an implementation plan is approved and ready to implement. Execute it task-by-task with isolation, TDD, verification, and review gates between tasks.
---

# Executing Plans

**Announce:** "I'm using the executing-plans skill."

Implement the approved plan one task at a time.

## The loop (per task)

1. Work in an isolated workspace (see `using-git-worktrees`).
2. Follow test-driven-development: write failing test → run → implement → run → commit.
3. Verify each step by running the actual test command.
4. Gate the task with review (see `requesting-code-review`) before moving on.
5. Commit.

## Continuous execution

Do not stop to check in between tasks unless there's a real blocker. Keep executing the plan.
Record any decision you make in the run as `Ruling: <what> — <why> — <cost if wrong>` and keep
going.

## When to stop

Only stop for: a genuinely required human decision, a real external blocker, or all tasks complete.

## End

When all tasks are done, verify the full suite and hand off for branch completion (see
`finishing-a-development-branch`).
