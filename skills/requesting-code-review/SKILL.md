---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch superpowers:code-reviewer subagent to catch issues before they cascade.

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

**2. Dispatch code-reviewer subagent:**

Use Task tool with superpowers:code-reviewer type, fill template at `code-reviewer.md`

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**3. Verify evidence from reviewer:**

Reviewer reports must include **citation evidence** (file:line per requirement). Prose-only verdicts ("looks good", "all requirements met") are not sufficient — reject them:

> "Please provide citation evidence: file:line reference and verdict per requirement."

See `superpowers:verification-before-completion` for the canonical evidence format.

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

[Dispatch superpowers:code-reviewer subagent]
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

## Team-Aware Review

**Roster-aware reviewer dispatch:**
When a team roster (from composing-teams) includes reviewer agents (e.g., `architect`, `security-reviewer`), use those agent definitions for review dispatch instead of the default `superpowers:code-reviewer`.

**Peer review in teams:**
When operating in a team context, specialists can peer-review each other's work:
- Specialist A reviews Specialist B's work (within same wave or across waves)
- Cross-domain review catches integration issues early
- Peer review supplements (does not replace) formal spec and code quality review

## Re-Review Loop Bound

After 3 rejection cycles on the same review (reviewer keeps finding new issues after fixes), stop and escalate to the user with the full rejection history. Do NOT silently loop a 4th time.

## Uncommitted Changes Check

Before dispatching any review, run `git status` to confirm all relevant changes are committed. Review against floating uncommitted changes produces incorrect verdicts.

## Team Mode: Per-Implementer SHA

In team execution, each implementer has their own branch. Use branch-specific SHAs — not main's HEAD — when dispatching review for a specific implementer's work:

```bash
BASE_SHA=$(git merge-base main <implementer-branch>)
HEAD_SHA=$(git rev-parse <implementer-branch>)
```

## Security Review Tier

For tasks touching auth, payment, or sensitive data: after standard code quality review, add a security-focused review pass. Dispatch with explicit instruction: "Focus on security: input validation, auth checks, data exposure, injection vectors."

## Red Flags

**Never:**
- Skip review because "it's simple" — **complexity is not the only reason reviews catch bugs**
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback
- Accept prose-only verdicts without citation evidence (file:line per requirement)

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

**Pairs with:**
- **receiving-code-review** — the other side of the review process; handles responding to review feedback

See template at: requesting-code-review/code-reviewer.md
