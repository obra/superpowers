---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or merging. Requires running verification and confirming output before any success claim.
---

# Verification Before Completion

**Core principle:** Evidence before claims, always. Violating the letter of this rule is violating
its spirit.

## The iron law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this exchange, you cannot claim it passes.

## The gate function

Before claiming any status or expressing satisfaction with a change:

1. Run the actual test/lint/build command for the change.
2. Capture the real output (not "should pass" — the actual result).
3. Only then state the outcome, citing the command and its output.

## What counts

- Unit tests verify deterministic behavior.
- For non-deterministic work (an agent pipeline, a generated response, a multi-step flow), verify
  against the real behavior or an explicit eval, not just one good example.
- The dangerous failure is code that "looks right" and "passes basic tests" but is wrong. Verify
  integration points and edge cases, not just the happy path.
- **Invariant / guard changes:** a green suite is not evidence. Use mutation (delete/invert the
  guard and watch a named test fail) per `docs/agent_invariants.md` → Mutation shapes, and
  `hardening-invariant-tests` / `falsifying-review` on ticketed work. Restoring the guard after
  mutation is mandatory.

## Do not

- Claim "done", "fixed", "passing", or "live" without running the check.
- Report a result you did not produce.
- Silently weaken a test to make it pass.
