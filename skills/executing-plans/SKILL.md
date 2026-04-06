---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

Load plan, review critically, execute all tasks, report when complete. If subagents are available, prefer sspower:subagent-driven-development over this skill.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically — identify questions or concerns
3. If concerns: raise with your human partner before starting
4. If no concerns: create TodoWrite and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development

After all tasks complete and verified:
- **REQUIRED SUB-SKILL:** Use sspower:finishing-a-development-branch

## Hard Stops

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Return to Step 1 when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Ask for clarification rather than guessing.**

## Rules
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **sspower:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting
- **sspower:writing-plans** - Creates the plan this skill executes
- **Codex option** - At each task, you may delegate to Codex via `/codex:rescue` as an alternative to inline or subagent execution
- **sspower:finishing-a-development-branch** - Complete development after all tasks
