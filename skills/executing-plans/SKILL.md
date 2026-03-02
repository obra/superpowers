---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report evidence for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

<HARD-GATE>
Do NOT use `EnterPlanMode` or `ExitPlanMode` during plan execution. These tools trap the session in plan mode where Write/Edit tools are restricted, preventing implementation work.
</HARD-GATE>

## Session Start: Cold Resume

On every session start, check for `.superpowers/state.yml`:

```yaml
# If state.yml exists and phase == executing:
plan:
  path: docs/plans/my-feature/plan.md
  completed_tasks: [1, 2, 3]
  total_tasks: 6
```

If resuming, announce: "Resuming from task 4 of 6 (tasks 1-3 complete)." Load the plan and skip to the next incomplete task. Do not re-execute completed tasks.

If no state.yml exists, proceed from Step 1.

## Pre-flight Check

Before executing any batch, verify:
- Context remaining: if below ~50%, run `/compact` before starting next batch
- All previous batch tasks marked complete in state.yml
- Worktree is on the right branch (`git status`)

**Worktree:** Execute all tasks in `worktree.main.path` from state.yml. If worktree is null (user opted out), execute in the current directory.

## The Process

### Step 1: Load and Review Plan

If the plan uses directory-based structure (`docs/plans/<project>/`), load task files individually:
- `plan.md` for the overview and task list
- `tasks/NN-name.md` for each task as you reach it (not all at once)

This keeps context lean — load only the task file for the current batch.

Review plan critically:
- Identify questions or concerns
- If concerns: raise with the user before starting
- If no concerns: create tasks with TaskCreate and proceed

### Plan Verification (3-Example Rule)

Before executing the first task, spot-check 3 claims from the plan against the actual codebase:
1. Pick 3 file paths, function names, or architectural assumptions from the plan
2. Verify each exists and matches what the plan expects
3. If any check fails: flag it, assess impact, revise the affected tasks before proceeding

This catches stale plans, renamed files, and wrong assumptions before wasted implementation work.

### Step 2: Execute Batch

**Default: First 3 tasks**

For each task:
1. Mark as in_progress with TaskUpdate
2. Follow plan intent — make implementation decisions within that intent (the plan specifies what/where/why, you decide how)
3. Run TDD gate: verify RED evidence exists before implementing, GREEN evidence before completing
4. Run verifications as specified
5. Mark as completed with TaskUpdate
6. Update `plan.completed_tasks` in state.yml

**TDD gate per task:**

Before marking implementation complete, confirm:
- RED evidence: test ran, failed for the right reason
- GREEN evidence: test ran, passed after implementation

If the plan includes test expectations per task, use them. If not, write your own test first.

### Step 3: Report with Evidence

When batch complete, report:

```
## Batch Complete: Tasks [N-M]

### Task N: [title]
**Changes:** [what was implemented]
**RED evidence:**
  Command: [test command]
  Output: [last 20 lines]
  Exit: 1
**GREEN evidence:**
  Command: [test command]
  Output: [last 20 lines]
  Exit: 0
**Diff:** [git diff --stat]

[Repeat for each task in batch]

### Batch summary
All N tasks complete. Commit SHA: [sha]
Ready for feedback.
```

Reports without RED+GREEN evidence per task are incomplete. See `superpowers:verification-before-completion` for the canonical evidence format.

### Step 4: Structured Review Checkpoint

After each batch report, pause for the user to review. They may:
- Approve: continue to next batch
- Request changes: apply, re-verify, re-report
- Redirect: return to Step 1 with updated plan

**Re-review loop bound:** Maximum 3 correction cycles per batch. If still unresolved after 3 cycles, escalate: "I've attempted this 3 times. Here is the full history of attempts and outcomes. Please advise on the approach."

### Step 5: Cross-Cutting Review Before Finishing

After all tasks complete, before calling finishing-a-development-branch, run a final cross-cutting review:

1. Read all changed files end-to-end
2. Check: Do the pieces fit together? Any interface mismatches?
3. Run full test suite (not just per-task tests)
4. Check for regressions in unrelated code
5. Report: "Cross-cutting review complete. [N files changed, full suite passes, no regressions]."

### Step 6: Complete Development

After cross-cutting review passes:
- Update the plan document's YAML frontmatter from `status: pending` to `status: executed`.
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- User updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** — stop and ask.

### Plan Revision Escalation

If during execution you discover the plan is fundamentally wrong (not just a minor adjustment):
- **STOP execution** — do not silently deviate from the plan
- **Report to the user:** what you found, why the plan needs revision, what you recommend
- **Wait for approval** before continuing with a modified approach
- Minor adjustments (file path changes, small API differences) are fine — document them in the task completion report

## Remember
- Check state.yml on session start for cold resume
- Load individual task files, not entire plan at once
- Follow plan intent, not plan steps literally — make implementation decisions
- TDD gate: RED then GREEN evidence per task
- Include evidence in every batch report
- Between batches: report and wait
- Run cross-cutting review before finishing
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:test-driven-development** - TDD cycle for each task
- **superpowers:verification-before-completion** - Evidence format for batch reports
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

## Team Alternative

For same-session parallel execution with persistent specialists, see **agent-team-driven-development**. It orchestrates multiple implementer agents working in parallel across waves, with two-stage review after each task.

| Approach | Session | Parallelism | Best for |
|----------|---------|-------------|----------|
| Executing Plans | Separate | Batch (3 tasks) | Human-in-loop between batches |
| Subagent-Driven | Same | Serial | Fast iteration, no team overhead |
| Agent Team-Driven | Same | Parallel waves | 4+ tasks with independence |
