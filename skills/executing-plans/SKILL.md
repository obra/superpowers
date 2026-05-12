---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## Parallel Sessions via DAG

When a plan declares `depends_on` on its tasks, execute the DAG using parallel sessions instead of single sequential handoff:

1. Build the DAG from the plan.
2. Compute the ready set: tasks whose dependencies have all completed.
3. For each parallel-safe ready task, spawn a separate session in its own git worktree (`git worktree add ../wt-<task-id> -b task/<task-id>`). Hand each session the full task spec plus the constraint that it commit its work to its own branch.
4. When a session completes, attempt `git merge --no-ff task/<task-id>` into the work branch. Clean → mark DONE. Conflict → push the branch, open a draft PR with `gh pr create --draft`, mark BLOCKED-on-human, continue with other ready tasks.
5. Recompute the ready set and dispatch the next layer.

For tasks marked `parallel_safe: false`, run a single foreground session on the work branch (no worktree).

For plans with no `depends_on` declarations, fall back to the original single-session sequential execution flow described below.

Worktree, dispatch, and conflict-PR mechanics: see `superpowers:dispatching-parallel-agents` (canonical reference).

## The Process

> **Sequential mode** — used only when the plan has no `depends_on` declarations. For DAG plans, see "Parallel Sessions via DAG" above.

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Ensures isolated workspace (creates one or verifies existing)
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
