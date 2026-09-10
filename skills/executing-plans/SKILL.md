---
name: executing-plans
description: Use when executing one approved phase of a written implementation plan directly in the current session
---

# Executing Plans

## Overview

Load a plan, review it critically, execute one approved phase, and stop at the
phase boundary.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

Use this skill for direct execution in the current session. If delegated work
is proposed, use `superpowers:subagent-driven-development` and obtain approval
for its bounded phase/pair topology before creating any child.

## The Process

### Step 1: Load and Review Plan
1. Ensure an isolated workspace: use superpowers:using-git-worktrees to create one or verify the existing one
2. Read plan file
3. Select one phase containing at most 2-3 closely related, independently
   testable and committable milestones
4. Review critically - identify any questions or concerns about the phase
5. If concerns: Raise them with your human partner before starting
6. If no concerns: Create todos for the phase milestones and proceed

### Step 2: Execute Tasks

For each milestone in the approved phase:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development

After all phase milestones complete and are verified:
- Report the completed phase and validation evidence
- Stop before the next phase
- Do not automatically push, create a PR, merge, deploy, request extra review,
  or invoke `superpowers:finishing-a-development-branch`

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly
- The approved phase boundary is reached

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
- Approval for one phase does not authorize the next phase
