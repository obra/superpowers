---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks with optional quality gates, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## Step 0: Opt-In Gates (Ask User BEFORE Starting)

Before starting execution, ask the user which quality gates to activate:

```
Before we begin, this plan has [N] tasks. I can activate optional quality gates:

1. **TDD Enforcement** — After each task, I'll review my own git history to verify
   I followed Red-Green-Refactor (wrote tests before production code).
   Cost: ~2 min extra per task. Recommended for all tasks.

2. **Self-Adversarial Review** — After each task passes quality checks, I'll do a
   structured adversarial pass checking security, edge cases, and architecture.
   Cost: ~5 min extra per task. Recommended for tasks touching auth/data/APIs.

Which gates do you want active?
  (a) Both TDD + Adversarial [maximum quality]
  (b) TDD only [balanced]
  (c) Adversarial only [security focus]
  (d) Neither [fast mode]
```

Store the choice and apply consistently. Don't re-ask per task.

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
4. **If TDD gate active:** Before marking complete, review your own git log:
   - Were test files created/modified BEFORE production code?
   - Did you follow Red-Green-Refactor?
   - If NOT: undo production code, write failing test first, then re-implement
5. **If Adversarial gate active:** After implementation passes, run the adversarial checklist:
   - **Security:** Can user input reach dangerous sinks? Auth bypasses? Data leaks?
   - **Edge cases:** Empty/null inputs? Boundary values? Network failures? Concurrency?
   - **Architecture:** SOLID violations? DRY issues? Coupling problems?
   - If findings with CRITICAL/HIGH severity: fix them before marking complete
   - Max 3 fix attempts per task — if still failing, stop and ask user
6. Mark as completed

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
- Adversarial self-review finds issues you can't fix in 3 attempts

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Ask about quality gates before starting
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
