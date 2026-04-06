---
name: receiving-code-review
description: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation
---

# Code Review Reception

**Core principle:** Verify before implementing. Ask before assuming. Technical correctness over social comfort.

## The Response Pattern

```
WHEN receiving code review feedback:
1. READ: Complete feedback without reacting
2. UNDERSTAND: Restate requirement in own words (or ask)
3. VERIFY: Check against codebase reality
4. EVALUATE: Technically sound for THIS codebase?
5. RESPOND: Technical acknowledgment or reasoned pushback
6. IMPLEMENT: One item at a time, test each
```

## Handling Unclear Feedback

**If ANY item is unclear: STOP — do not implement anything yet.** Items may be related. Partial understanding = wrong implementation. Ask for clarification on all unclear items before proceeding.

## Source-Specific Handling

**From your human partner:** Trusted — implement after understanding. Still ask if scope unclear. No performative agreement. Skip to action.

**From external reviewers:** Before implementing, check: technically correct for THIS codebase? Breaks existing functionality? Reason for current implementation? If suggestion seems wrong, push back with technical reasoning. If conflicts with your human partner's prior decisions, stop and discuss with partner first.

## YAGNI Check

If reviewer suggests "implementing properly": grep codebase for actual usage. Unused? Suggest removing (YAGNI). Used? Then implement properly.

## Implementation Order

For multi-item feedback:
1. Clarify anything unclear FIRST
2. Blocking issues → simple fixes → complex fixes
3. Test each fix individually, verify no regressions

## When to Push Back

Push back when: breaks existing functionality, reviewer lacks full context, violates YAGNI, technically incorrect, legacy/compat reasons, conflicts with partner's architecture.

**Signal if uncomfortable pushing back:** "Strange things are afoot at the Circle K"

See `references/response-patterns.md` for forbidden responses, real examples, and common mistakes.
