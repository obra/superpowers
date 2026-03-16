---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches. For Rails projects, three-stage review after each batch: spec compliance, Rails conventions, code quality.

**Core principle:** Batch execution with checkpoints for architect review.

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

## Rails Projects - MANDATORY

**For Rails projects, load ALL convention skills BEFORE executing any task:**

```
superpowers:rails-controller-conventions
superpowers:rails-model-conventions
superpowers:rails-view-conventions
superpowers:rails-policy-conventions
superpowers:rails-job-conventions
superpowers:rails-migration-conventions
superpowers:rails-stimulus-conventions
superpowers:rails-testing-conventions
```

**After each batch, add Rails conventions check:**
1. Spec compliance (does code match plan?)
2. Rails conventions (does code follow project conventions?)
3. Code quality (is code well-structured?)

| Rationalization | Reality |
|-----------------|---------|
| "I already know Rails conventions" | These are PROJECT conventions. Load them. |
| "Plan already covers conventions" | Plan is architecture. Skills are implementation. |
| "Batch is small, conventions don't matter" | Small violations compound. Check every batch. |

### Step 3: Report
When batch complete:
- Show what was implemented
- Show verification output
- **For Rails projects:** Note any convention considerations
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
- **For Rails projects:** Load ALL convention skills before first task
- Between batches: just report and wait
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
