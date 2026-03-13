---
name: receiving-code-review
description: >
  Handles review feedback with technical rigor: verify suggestions,
  resolve unclear items, implement fixes in priority order. Invoke when
  review comments are received or user says "address review feedback".
  Routed by using-superpowers when review feedback arrives.
---

# Receiving Code Review

Treat feedback as technical input to validate, not as instructions to apply blindly.

## Sequence

1. Read all feedback.
2. Clarify unclear items before implementing anything.
3. Validate each suggestion against codebase behavior and requirements.
4. Implement fixes in priority order.
5. Re-test and summarize outcomes.

## Priority

1. Correctness/security regressions
2. Requirement mismatches
3. Maintainability issues
4. Minor polish

Treat Critical and High security findings as blocking until addressed or explicitly deferred by the user with documented rationale.

## Forbidden Responses

Never say any of the following. They signal performative agreement, not technical engagement:

- "You're absolutely right!"
- "Great point!"
- "Good catch!"
- "Thanks for catching that!"
- Any gratitude expression before analysis
- Any agreement before verification

Instead: state what you verified, what you changed, and why. If the reviewer is right, the code change speaks for itself.

## Pushback Rules

Push back when a suggestion:
- Breaks existing behavior
- Conflicts with approved architecture
- Adds unused scope (YAGNI)
- Lacks enough context to verify

Pushback must include **concrete technical evidence** — not opinions, not "I think", not "it should be fine."

## Response Style

- Be factual and concise.
- State what changed, where, and why.
- If you disagree, explain with code or test output — not with rhetoric.

## Completion

Report:
- Addressed items
- Deferred items with reason
- Verification commands/results
- Remaining risks
