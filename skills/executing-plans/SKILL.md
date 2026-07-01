---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (Claude Code, Codex CLI, Codex App, and Copilot CLI all qualify; see the per-platform tool refs in `../using-superpowers/references/`). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create todos for the plan items and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed
5. **Tick `[x]` in the plan file** — write this immediately after each task completes. This is the cross-session progress record; it is what allows a fresh context to resume without re-reading history.
6. **Offer a context checkpoint** if the plan has more tasks remaining (see below)

### Context Checkpoints

Long plans accumulate tool output, file reads, and test results that consume context without helping future steps. After each task, offer a checkpoint when:

- 5 or more tasks have completed, **or**
- The session has produced heavy output (many file reads, large test runs, repeated diffs)

**Checkpoint offer (copy verbatim):**

> "Task N complete — `[x]` marked in the plan. Context is growing after N tasks. To keep subsequent tasks sharp: type `/clear`, then `execute <plan-file>` — the `[x]` marks track progress and the next session will skip completed tasks automatically."

**Never offer a checkpoint** after the final task — proceed directly to Step 3.

**If the user clears context and restarts:** Read the plan file, skip all `[x]`-marked tasks, announce which task you are resuming from, and continue.

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
- Tick `[x]` in the plan file immediately after each task — it is the only progress record that survives a context clear
- Offer a context checkpoint after every 5 tasks or any heavy-output session; never after the last task

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Ensures isolated workspace (creates one or verifies existing)
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
