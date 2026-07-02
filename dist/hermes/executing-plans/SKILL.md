---
name: superpowers:executing-plans
description: "Use when executing implementation plans in this session — batch execution with checkpoints"
source: https://github.com/obra/superpowers/tree/main/skills/executing-plans
hermes-adapted: true
upstream-version: "6.0.3"
tool-mapping: "skill_view/skills_list=Skill, todo=TodoWrite, delegate_task=Subagent/Task, search_files=Glob/grep"
install: "hermes skills install <url-to-raw-SKILL.md> --name superpowers:executing-plans"
---

---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---
# Executing Plans
## Overview
Load plan, review critically, execute all tasks, report when complete.
\*\*Announce at start:\*\* "I'm using the executing-plans skill to implement this plan."
\*\*Note:\*\* Tell your human partner that Superpowers works much better with access to delegate_tasks. The quality of its work will be significantly higher if run on a platform with delegate_task support (Claude Code, Codex CLI, Codex App, and Copilot CLI all qualify; see the per-platform tool refs in `../using-superpowers/references/`). If delegate_tasks are available, use superpowers:delegate_task-driven-development instead of this skill.
## The Process
### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create todos for the plan items and proceed
### Step 2: Execute Tasks
For each task:
1. Mark as in\_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed
### Step 3: Complete Development
After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- \*\*REQUIRED SUB-SKILL:\*\* Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice
## When to Stop and Ask for Help
\*\*STOP executing immediately when:\*\*
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly
\*\*Ask for clarification rather than guessing.\*\*
## When to Revisit Earlier Steps
\*\*Return to Review (Step 1) when:\*\*
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking
\*\*Don't force through blockers\*\* - stop and ask.
## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent
## Integration
\*\*Required workflow skills:\*\*
- \*\*superpowers:using-git-worktrees\*\* - Ensures isolated workspace (creates one or verifies existing)
- \*\*superpowers:writing-plans\*\* - Creates the plan this skill executes
- \*\*superpowers:finishing-a-development-branch\*\* - Complete development after all tasks