---
description: "Execute implementation plans using subagent-driven development. Use when you have a written plan ready to implement."
---

# /superpowers:execute

**REQUIRED SKILL:** `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`

## When to Use

- Have a written implementation plan ready
- Want to execute tasks with review checkpoints
- Need fast iteration with subagent-driven development

## What It Does

Executes implementation plans using one of two approaches:

### Option 1: Subagent-Driven (Recommended)

- Fresh subagent dispatched per task
- Two-stage review between tasks
- Fast iteration with isolation
- Better for multi-task plans

### Option 2: Inline Execution

- Execute tasks in current session
- Batch execution with checkpoints
- Review points for feedback
- Better for single-task plans

## Execution Process

For each task:
1. Mark task as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark task as completed
5. Review before moving to next task

## Rules

- **Stop immediately** when hitting a blocker
- **Ask for clarification** rather than guessing
- **Don't skip verifications**
- **Follow plan steps exactly**
- **Never start on main/master branch** without explicit consent

## After Completion

- All tasks completed and verified
- Invoke `superpowers:finishing-a-development-branch`
- Present completion summary to user
