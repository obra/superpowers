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

When a `security-reviewer` report is available, treat its Critical and High findings as blocking until addressed or explicitly deferred by the user with documented rationale.

## Pushback Rules

Push back when a suggestion:
- Breaks behavior
- Conflicts with approved architecture
- Adds unused scope (YAGNI)
- Lacks enough context to verify

Pushback must include concrete technical evidence.

## Response Style

- Be factual and concise.
- Avoid performative agreement.
- State what changed, where, and why.

## Completion

Report:
- Addressed items
- Deferred items with reason
- Verification commands/results
- Remaining risks
