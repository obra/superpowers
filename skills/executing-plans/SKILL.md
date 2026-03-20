---
name: executing-plans
description: Executes a written implementation plan task-by-task with review checkpoints, stopping at blockers and invoking sub-skills as required. Use when you have a written plan to execute in a separate session.
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## The Process

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
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

## Examples

**Example 1: Standard plan execution**

User says: "Execute the plan at docs/superpowers/plans/2026-03-20-auth.md"
Actions:
1. Read plan, review critically - notice Task 3 references a file path that doesn't exist yet
2. Raise concern: "Task 3 references `src/auth/tokens.ts` but Task 1 creates it - order looks correct, proceeding"
3. Create TodoWrite with all tasks
4. Execute Task 1 step-by-step: write test, verify it fails, implement, verify it passes, commit
5. Continue through all tasks
6. Invoke finishing-a-development-branch skill at end
Result: Plan executed with all tests passing, branch ready to merge/PR

**Example 2: Blocked execution**

User says: "Run the plan"
Actions:
1. Read plan - Task 2 says "configure Stripe webhook secret" but no secret provided
2. STOP: "I'm blocked on Task 2. The plan requires a Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`). Where should I get this value?"
Result: Human provides the value, execution resumes

## Troubleshooting

**Error:** A plan step says to run a test but the test command is wrong for this project
Cause: Plan was written without knowing exact test runner command
Solution: Stop, identify the correct test command (`package.json` scripts or project README), ask human to confirm before running.

**Error:** Step says to modify a file at a specific line number but the file has changed
Cause: Plan was written before the file was edited
Solution: Read the file, find the equivalent location, apply the change to the correct location. Note the discrepancy in your summary.

**Error:** Task has no verification step
Cause: Plan author skipped verification
Solution: Add your own verification: run tests for the affected area before marking the task complete.
