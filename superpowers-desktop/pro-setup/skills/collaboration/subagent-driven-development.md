---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session - break down into sequential tasks for each task with code review between tasks, enabling fast iteration with quality gates
---


> **Note for Claude Desktop:** This skill has been adapted from the Claude Code plugin. Some automation features (like automatic activation and TodoWrite tracking) require manual implementation. Track checklists explicitly in your responses.
# Subagent-Driven Development

Execute plan by break down into sequential tasks per task, with code review after each.

**Core principle:** Fresh separate task per task + review between tasks = high quality, fast iteration

## Overview

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh separate task per task (no context pollution)
- Code review after each task (catch issues early)
- Faster iteration (no human-in-loop between tasks)

**When to use:**
- Staying in this session
- Tasks are mostly independent
- Want continuous progress with quality gates

**When NOT to use:**
- Need to review plan first (use executing-plans)
- Tasks are tightly coupled (manual execution better)
- Plan needs revision (brainstorm first)

## The Process

### 1. Load Plan

Read plan file, create explicit checklist tracking with all tasks.

### 2. Execute Task with Subagent

For each task:

**Dispatch fresh separate task:**
```
manual task breakdown (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N from [plan-file].

    Read that task carefully. Your job is to:
    1. Implement exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. Verify implementation works
    4. Commit your work
    5. Report back

    Work from: [directory]

    Report: What you implemented, what you tested, test results, files changed, any issues
```

**Subagent reports back** with summary of work.

### 3. Review Subagent's Work

**Dispatch code-reviewer separate task:**
```
manual task breakdown (code-reviewer.md (in project knowledge)):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from separate task's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment

### 4. Apply Review Feedback

**If issues found:**
- Fix Critical issues immediately
- Fix Important issues before next task
- Note Minor issues

**Dispatch follow-up separate task if needed:**
```
"Fix issues from code review: [list issues]"
```

### 5. Mark Complete, Next Task

- Mark task as completed in explicit checklist tracking
- Move to next task
- Repeat steps 2-5

### 6. Final Review

After all tasks complete, dispatch final code-reviewer:
- Reviews entire implementation
- Checks all plan requirements met
- Validates overall architecture

### 7. Complete Development

After final review passes:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use finishing-a-development-branch.md (in project knowledge)
- Follow that skill to verify tests, present options, execute choice

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Load plan, create explicit checklist tracking]

Task 1: Hook installation script

[Dispatch implementation separate task]
Subagent: Implemented install-hook with tests, 5/5 passing

[Get git SHAs, dispatch code-reviewer]
Reviewer: Strengths: Good test coverage. Issues: None. Ready.

[Mark Task 1 complete]

Task 2: Recovery modes

[Dispatch implementation separate task]
Subagent: Added verify/repair, 8/8 tests passing

[Dispatch code-reviewer]
Reviewer: Strengths: Solid. Issues (Important): Missing progress reporting

[Dispatch fix separate task]
Fix separate task: Added progress every 100 conversations

[Verify fix, mark Task 2 complete]

...

[After all tasks]
[Dispatch final code-reviewer]
Final reviewer: All requirements met, ready to merge

Done!
```

## Advantages

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (separate tasks don't interfere)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Cost:**
- More separate task invocations
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- Skip code review between tasks
- Proceed with unfixed Critical issues
- Dispatch multiple implementation separate tasks in parallel (conflicts)
- Implement without reading plan task

**If separate task fails task:**
- Dispatch fix separate task with specific instructions
- Don't try to fix manually (context pollution)

## Integration

**Required workflow skills:**
- **writing-plans** - REQUIRED: Creates the plan that this skill executes
- **requesting-code-review** - REQUIRED: Review after each task (see Step 3)
- **finishing-a-development-branch** - REQUIRED: Complete development after all tasks (see Step 7)

**Subagents must use:**
- **test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **executing-plans** - Use for parallel session instead of same-session execution

See code-reviewer template: requesting-code-review/code-reviewer.md
