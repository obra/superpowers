---
name: executing-plans
description: Use when executing an approved implementation plan in a separate or resumable Claude Code session
---

# Executing Plans

## Overview

This skill executes an approved implementation plan when the work is intentionally being carried out as a separate or resumable session — for example, a session started specifically to pick up an existing plan, possibly one that a prior session already made progress on.

**Core principle:** Load plan → Read fully → Review critically → Execute directly, task by task, with verification and self-review → Final verification → Inspect working tree → Hand off to user.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

### How this differs from subagent-driven-development

Both skills execute an approved plan through direct implementation by the primary agent, with optional subagents only where they provide concrete value. Neither makes subagents mandatory or preferred, and neither hands off to the other automatically.

| | subagent-driven-development | executing-plans |
|---|---|---|
| Session | Same session that has the plan and its context | A separate or resumable session, possibly new |
| Starting state | Plan and context already in conversation | Plan may need to be located and loaded fresh |
| Resumability | Not a concern — one continuous session | Central concern — may continue from a prior session's progress |

Pick whichever of the two matches how the work is actually being carried out. Do not treat one as an upgrade path for the other.

## The Process

### Step 1: Load the Plan

1. Locate the approved implementation plan (path given by the user, referenced in the conversation, or the most recent plan matching the task).
2. Read the entire plan before doing anything else.
3. If this session did not write the plan itself, treat repository state as the source of truth for what has actually happened so far.

### Step 2: Determine What's Already Done

The plan may have been partially executed already, in this session or a previous one.

* Determine which tasks are already complete from repository state, git history/diff, and any available conversation context.
* Verify completed work rather than blindly repeating it — run the task's verification and confirm it still passes rather than assuming a prior session's claim.
* Continue from the next incomplete task.

Do not introduce a `.superpowers` execution ledger, a hidden execution-state system, or a custom progress file created solely for this skill. The plan, the repository, git inspection, and the conversation are the source of truth — nothing else needs to be maintained.

### Step 3: Review the Plan Critically

Before executing anything, check the plan for:

* contradictory requirements
* missing dependencies
* incorrect assumptions
* ambiguous behaviour
* outdated architecture references
* incorrect paths
* missing test coverage
* conflicts with the current codebase

Resolve issues from the codebase when they can be safely inferred from existing code and requirements, and continue.

If the plan is fundamentally broken, or requires a decision only the user can make, raise it with the user before proceeding. Do not spawn agents merely because the plan is unclear — an unclear plan is resolved by reading the codebase and asking the user, not by delegation.

Once there are no unresolved concerns, create a task checklist from the plan.

### Step 4: Execute Tasks

For each task, in order:

1. Execute the task directly in the primary session.
2. Run focused verification for that task (tests, type checking, linting, build, or another targeted check appropriate to the change).
3. Self-review the task: every requirement implemented, no unrequested behaviour, changes stay in scope, edge cases and errors handled correctly, tests pass.
4. If verification or self-review turns up a problem, fix it and re-test before moving on.
5. Continue to the next task only once the current one is verified.

Optional subagents may be used for a task the same way subagent-driven-development permits them — genuinely independent parallel work, large isolated research, or specialist analysis — never as the default execution mechanism, and never because a task is merely tedious.

### Step 5: Final Verification and Hand-off

Once every task is complete:

1. Run the full relevant test suite.
2. Inspect `git status`.
3. Inspect `git diff`.
4. Explicitly inspect untracked files.
5. Compare the implementation against the original plan.
6. Check acceptance criteria.
7. Check for accidental unrelated changes, temporary/debug files, and generated files that should not exist.
8. Fix anything within the scope of the current task and re-run relevant verification.
9. Report what was implemented and tested.
10. Report the current working-tree state.
11. Stop and return control to the user.

This skill does not perform Git operations itself and does not decide integration. Staging, committing, pushing, merging, rebasing, and branch management remain entirely the user's decision.

## When to Stop and Ask for Help

**Stop executing immediately when:**

* You hit a blocker (missing dependency, a test that fails for reasons outside this task's scope, an unclear instruction)
* The plan has a critical gap that prevents starting or continuing a task
* You don't understand an instruction
* Verification fails repeatedly for the same task

Ask for clarification rather than guessing.

## When to Revisit Earlier Steps

**Return to Step 3 (Review) when:**

* The user updates the plan based on your feedback
* The fundamental approach needs rethinking

Don't force through blockers — stop and ask.

## Remember

* Review the plan critically before executing anything
* Determine what's already done before repeating work — verify, don't assume
* Execute directly; reach for a subagent only when it provides concrete value
* Self-review and verify every task before moving to the next
* Don't skip verification
* No execution ledgers, no hidden progress files — the plan, the repo, and git are the source of truth
* Stop when blocked, don't guess
* Final hand-off is verify → inspect → report → stop — not a Git-management step
