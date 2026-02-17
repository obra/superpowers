---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Batch
**Default: First 3 tasks**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Report
When batch complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## Multi-Feature Context

When executing a plan that is part of a multi-feature coordination manifest, you are one agent in one worktree working on one plan. The orchestrator manages the bigger picture.

**What changes:**
- Your plan file is one of several referenced by a coordination manifest
- You work only in your assigned worktree — never modify files outside it
- Shared dependencies may have been merged into your worktree before you started — treat them as existing code, not something you build
- When you finish, report completion to the orchestrator. Do NOT start work on another feature's plan

**What stays the same:**
- Load and review your plan exactly as in single-feature mode
- Execute in batches with checkpoints
- Follow all the same quality gates
- Use finishing-a-development-branch when your plan is done

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
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
- Between batches: just report and wait
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes (and coordination manifest in multi-feature mode)
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

**Multi-feature context:**
- Orchestrator dispatches one executing-plans agent per worktree
- Agent works only on the plan assigned to its worktree
- Shared dependencies are distributed by the orchestrator before feature agents start
