---
name: requesting-code-review
description: Use when an independent code review has been explicitly approved or is already included in an approved bounded phase
---

# Requesting Code Review

Request an explicitly approved independent review against a fixed git range.
The reviewer gets precisely crafted context for evaluation, never the
controller's session history.

**Core principle:** Review early, review often.

## When to Request Review

**Use without a new approval only when:**
- The current approved `subagent-driven-development` phase already disclosed
  the persistent reviewer, model/provider, reasoning effort, context tier,
  scope, fixed range protocol, and review-pass cap.

**Potential additional review — new approval required:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug
- After the approved phase
- Before merge
- A second reviewer, final reviewer, review swarm, or Rubber Duck pass

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Confirm approval:**

If this reviewer was not already disclosed in the active phase approval,
disclose the agent, exact model/provider, reasoning effort, context tier,
scope, fixed `BASE_SHA..HEAD_SHA` range, and maximum passes. Wait for approval.

**3. Dispatch or resume the approved reviewer:**

Fill the template at [code-reviewer.md](code-reviewer.md). In bounded
subagent-driven development, resume the phase's same persistent reviewer
instead of creating another reviewer.

Apply every approved runtime setting through the harness-native dispatch or
resume fields, not only as prose inside the prompt:

- exact model/provider: `[EXACT_MODEL_AND_PROVIDER]`;
- reasoning effort: `[REASONING_EFFORT]`;
- context tier: `[CONTEXT_TIER]`.

If the harness cannot explicitly apply any approved setting, stop and request
revised approval. Never omit it, inherit it, substitute a default, or
auto-route the reviewer.

**Placeholders:**
- `[EXACT_MODEL_AND_PROVIDER]` - Approved provider and exact model identifier
- `[REASONING_EFFORT]` - Approved reasoning effort
- `[CONTEXT_TIER]` - Approved context tier
- `[DESCRIPTION]` - Brief summary of what you built
- `[PLAN_OR_REQUIREMENTS]` - What it should do
- `[BASE_SHA]` - Starting commit
- `[HEAD_SHA]` - Ending commit

**4. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)
- Return fixes to the same approved implementer when a bounded phase is active

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "A final review is standard, so it is already approved." | Additional review outside the disclosed phase topology requires new approval. |
| "A fresh reviewer will be more independent." | The approved persistent reviewer is already independent; a replacement is a new agent requiring approval. |
| "The reviewer needs my whole session history to understand the change" | Hand it precisely crafted context, never your session's history. That keeps the reviewer on the work product, not your thought process. |

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Create an undisclosed reviewer
- Broaden the approved fixed range
- Omit, inherit, default, or auto-route an approved runtime setting
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: [code-reviewer.md](code-reviewer.md)
