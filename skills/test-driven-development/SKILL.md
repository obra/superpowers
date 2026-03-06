---
name: test-driven-development
description: Use when implementing or fixing behavior so tests are written first and verified failing before code changes.
---

# Test-Driven Development

Write failing tests first. Then write minimal code to pass.

## Iron Law

No production code before a failing test proves the behavior is missing.

If code was written first, delete it and restart from a test.

## Cycle

1. **RED**: Add one small failing test for one behavior.
2. **VERIFY RED**: Run test and confirm failure is for the expected reason.
3. **GREEN**: Write minimal production code to pass.
4. **VERIFY GREEN**: Run target tests (and relevant broader tests) to confirm pass.
5. **REFACTOR**: Improve structure without changing behavior; keep tests green.

Repeat per behavior.

## Test Quality Rules

- One behavior per test.
- Clear behavior-oriented test names.
- Prefer real behavior checks over mock-only assertions.
- Cover edge and error paths for changed behavior.

## Anti-Patterns

- Writing tests after implementation.
- Adding multiple features before rerunning tests.
- Accepting passing tests that never failed first.
- Fixing bugs without a regression test.

## Completion Checklist

- Every changed behavior has a test.
- Each new test was observed failing before implementation.
- Changed tests pass.
- Relevant suite passes.

## Related

- Use `systematic-debugging` to find root cause before writing the fix test.
- Use `verification-before-completion` before success claims.
- Read `testing-anti-patterns.md` when introducing heavy mocking.
- For complex, high-risk, or hard-to-test behavior, consider using `testing-specialist` to design a deeper test strategy (e.g., property-based tests, broader coverage, or layered test suites) while still following this RED–GREEN–REFACTOR cycle.
