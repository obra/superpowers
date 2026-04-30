---
name: executing-plans
description: Use when executing a written implementation plan in Codex with review checkpoints and verification gates.
---

# Executing Plans

## Overview

Load the plan, review it critically, execute the tasks, and verify the result before claiming completion.

Announce at start: "I'm using the executing-plans skill to implement this plan."

## Process

### Step 1: Load And Review

1. Read the full plan.
2. Identify scope limits, required files, verification commands, and blockers.
3. If there is a critical gap, stop and ask the user before editing.
4. If the plan is executable, create an `update_plan` checklist and proceed.

Never start implementation on `main` or `master` unless the user explicitly permits it. Read-only analysis, plan review, docs-only planning, and other non-editing preparation are allowed on those branches.

### Step 2: Select Execution Mode

Choose one mode before starting implementation:

- **Inline mode**: use for normal plans with no request for team-driven execution.
- **Team-driven mode**: use only after explicit user authorization for team-driven development, subagents, delegation, parallel agent work, or a reviewer workflow.

Plans may recommend team-driven mode, subagents, delegation, parallel agent work, or a reviewer workflow, but a plan file is not explicit user authorization. If the plan recommends team-driven mode and the current user request did not explicitly authorize it, stop and ask the user before invoking `team-driven-development` or creating agents.

If the trigger is ambiguous, stop and ask the user which mode to use. Do not silently choose inline mode for broad, risky, or multi-owner plans.

Before selecting inline mode, check whether the plan is high-risk. High-risk plans include shared behavior, security or data-loss risk, migrations, API contracts, multi-module or multi-owner work, broad refactors, and parallel-safe independent tasks. For those plans, pause and ask the user whether to authorize team-driven mode, narrow the scope, or explicitly approve inline execution for the risky scope.

This mode check does not allow `spawn_agent` by default. Use `spawn_agent` only after the user has explicitly authorized team-driven mode, subagents, delegation, parallel agent work, or a reviewer workflow.

### Step 3A: Inline Mode

In inline mode, execute batches in the current Codex session.

For each task:

1. Mark it `in_progress` with `update_plan`.
2. Follow the plan's steps.
3. Run the specified verification.
4. Mark it `completed` only after verification supports that status.

### Step 3B: Team-Driven Mode

In team-driven mode, the main Codex session is orchestration-only. Do not follow implementation steps directly, edit files directly, or complete tasks from worker self-reports.

Required protocol:

1. Invoke `team-driven-development`.
2. Split the plan into bounded worker tasks with clear file ownership.
3. Create each implementation worker with `spawn_agent`.
4. Continue only orchestration work in the main session while workers run.
5. Use `wait_agent` when blocked on a worker or reviewer result.
6. Review each worker summary, changed file list, verification evidence, and actual diff or patch.
7. Create a separate reviewer subagent with `spawn_agent` for each worker result, and pass the actual `git diff` or file patch text whenever practical. If the diff is too large to paste, require the reviewer to inspect the exact changed files and patch before deciding.
8. Require the reviewer final line to be exactly `Verdict: APPROVE` or `Verdict: REJECT`; explanatory text before the final line is allowed.
9. If the reviewer verdict is `Verdict: APPROVE`, inspect the task diff and test evidence before marking the task complete.
10. If the reviewer verdict is `Verdict: REJECT`, send the reviewer findings back to the same worker with `send_input`, wait for revision, then send the revised result to a separate reviewer again.
11. If the original worker was closed before rework, try `resume_agent`; if that is unavailable or unsuitable, spawn a replacement worker with the previous diff, reviewer findings, exact ownership boundaries, and rework instructions.

Do not replace per-task reviewer approval with a shared final audit. Do not allow overlapping worker file ownership unless the overlap is explicit, intentional, and coordinated before spawning workers.

### Step 4: Final Verification

After all tasks are implemented:

1. Re-read the plan's success criteria.
2. In team-driven mode, confirm every task has a reviewer final line of `Verdict: APPROVE`.
3. Review the full diff for scope control and integration risk.
4. Run the full verification commands.
5. In team-driven mode, inspect the reviewer findings, worker summaries, and test evidence against the final diff.
6. Use `verification-before-completion` before making any completion claim.

## Stop Conditions

Stop and ask for help when:

- A plan instruction is unclear enough that guessing could change scope.
- A dependency or required file is missing.
- Verification repeatedly fails and the next fix is not clear.
- The requested change would require editing files outside the plan's allowed scope.
- Team-driven mode receives two consecutive `Verdict: REJECT` results for the same task.
- A reviewer final verdict line is missing, conditional, mixed, or anything other than exactly `Verdict: APPROVE` or `Verdict: REJECT`.
- A worker and reviewer disagree about task scope or file ownership in a way the main session cannot resolve from the plan.
- Worker file ownership overlaps unexpectedly or risks overwriting another worker's changes.
