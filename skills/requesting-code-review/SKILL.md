---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements - dispatches superpowers:code-reviewer subagent to review implementation against plan or requirements before proceeding
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

**3. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Codex Integration

**NEW: Automatic delegation to Codex**

When Codex delegation is enabled in config, reviews are automatically delegated to Codex CLI.

**How it works:**

**Step 1: Check codex delegation config**

Review process automatically checks:
- Is `codex_enabled: true` in config?
- Is `code_review.delegate_to_codex: true`?

**Step 2A: If Codex enabled → Delegate**

**REQUIRED SUB-SKILL:** Use superpowers:codex-delegator

1. Codex delegator prepares prompt from template
2. Calls `mcp__codex__spawn_agent` with review context
3. Validates Codex response
4. Returns structured feedback (same format as code-reviewer subagent)

**Step 2B: If Codex disabled → Traditional flow**

Use Task tool with superpowers:code-reviewer subagent (existing behavior)

**Step 3: Act on feedback (same regardless of source)**

- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer (Claude or Codex) is wrong

**Fallback behavior:**

If Codex delegation fails and `fallback_to_claude: true`:
- Automatically retry with code-reviewer subagent
- User notified of fallback
- Review continues without interruption

**Manual override:**

To force Claude review (bypass Codex):
- Temporarily set `code_review.delegate_to_codex: false`
- Or directly dispatch code-reviewer subagent

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

**Codex-Enhanced Workflow:**
- Config checked automatically
- Codex reviews when enabled
- Same feedback format
- Same action steps
- Transparent delegation (works like traditional review)

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

See template at: requesting-code-review/code-reviewer.md
