---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
allowed-tools: Task, Bash, Read
---

# Requesting Code Review

## Overview

Dispatch hyperpowers:code-reviewer subagent to catch issues before they cascade.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## Two-Stage Review Pattern

Reviews follow two stages in order:

**Stage 1: Spec Compliance**
- Does the code do what was requested?
- Are all requirements met?
- Is anything missing from the spec?
- Is anything EXTRA that wasn't requested?

**Stage 2: Code Quality**
- Is the implementation well-designed?
- Are there bugs, edge cases, security issues?
- Is it maintainable, readable, testable?
- Does it follow project patterns?

**Why two stages?**
- Spec compliance catches over/under-building FIRST
- No point polishing code that doesn't meet requirements
- Code quality assumes spec is already met

## Quick Reference

| Stage | Focus | Key Questions |
|-------|-------|---------------|
| 1. Spec Compliance | Requirements | Does it do what was requested? Anything missing/extra? |
| 2. Code Quality | Implementation | Bugs? Security? Maintainable? Follows patterns? |

| Trigger | Action |
|---------|--------|
| After each subagent task | Dispatch code-reviewer |
| After major feature | Dispatch code-reviewer |
| Before merge to main | Dispatch code-reviewer |
| When stuck | Dispatch code-reviewer (fresh perspective) |

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Prepare review request:**

```markdown
## Review Request

**Spec Reference:** [link to spec.md or task description]

**Changes:**
- [list of changes made]

**Testing:**
- [tests written/run]
- [verification evidence]

**Areas of Concern:**
- [anything you're unsure about]

**Git Range:**
git diff <base>..<head>
```

This format enables focused review and reduces back-and-forth.

**3. Dispatch code-reviewer subagent:**

Use Task tool with hyperpowers:code-reviewer type, fill template at `./code-reviewer.md`

**Model selection:** Use `model: haiku` when dispatching the code-reviewer subagent. Code review is a validation task that benefits from Haiku's speed and cost efficiency.

```typescript
Task(code_review_prompt, model: "haiku")
```

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**4. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch hyperpowers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: `./code-reviewer.md`
