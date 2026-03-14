---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Use the Codex `reviewer` role to catch issues before they cascade. Give the
reviewer precise scope, explicit SHAs, and the plan or requirements that define
success. The reviewer should focus on the work product, not your session
history.

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

## How to Request

**1. Get git SHAs:**

```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch the `reviewer` role:**

Use a prompt like:

```text
Review this change from BASE_SHA to HEAD_SHA.
Have reviewer inspect correctness, regressions, security risks, and missing
tests against the stated plan or requirements. Summarize findings first, with
the highest-risk issues at the top.
```

Provide:

- what was implemented
- the plan or requirements
- `BASE_SHA`
- `HEAD_SHA`
- a short description of the change

**3. Act on feedback:**

- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong, with technical reasoning

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch reviewer role]
Review this change from a7981ec to 3df7661.
Have reviewer inspect correctness, regressions, and missing tests against Task 2
from docs/superpowers/plans/deployment-plan.md.

[Reviewer returns]:
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

The existing guidance in `agents/code-reviewer.md` is still useful as reviewer
source material, but the Codex contract is the `reviewer` role, not a legacy
tool-specific subagent type.
