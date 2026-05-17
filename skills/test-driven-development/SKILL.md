---
name: test-driven-development
description: >
  MUST USE for any behavior change: write failing tests before production
  code. No exceptions. Triggers on: "TDD", "write tests first", any
  implementation task, bug fix needing regression tests, behavior changes
  during execution. Routed by using-superpowers, or invoke directly via
  /test-driven-development.
---

# Test-Driven Development

Write failing tests first. Then write minimal code to pass.

## Iron Law

**No production code before a failing test proves the behavior is missing.**

If code was written first, **delete it** and restart from a test. No exceptions.

This is the hardest rule to follow and the most important. Every rationalization to skip it leads to untested behavior that breaks later.

## Cycle

1. **RED**: Write one small failing test for one behavior.
2. **VERIFY RED**: Run the test. Confirm it fails **for the expected reason** (not a syntax error or import issue).
3. **GREEN**: Write the **minimum** production code to make the test pass. Nothing more.
4. **VERIFY GREEN**: Run the target test and relevant broader tests. Confirm pass.
5. **REFACTOR**: Improve structure without changing behavior. Tests must stay green.

Repeat per behavior. Never skip VERIFY steps.

## Test Infrastructure Check

Before writing the first test, verify the project has a test runner:

1. Check for test config: `jest.config.*`, `vitest.config.*`, `pytest.ini`, `pyproject.toml [tool.pytest]`, `go.mod`, `Cargo.toml`, `.rspec`, `phpunit.xml`
2. Check for test script: `npm test`, `yarn test`, `make test`, or equivalent
3. If no test infrastructure exists:
   - Ask the user: "No test runner detected. Should I set up [recommended runner for this language/framework]?"
   - If yes: install and configure the minimal test runner. Write one smoke test to confirm it works.
   - If no: note that TDD requires a test runner and proceed only if the user provides an alternative.

Do not skip this step — a "failing test" that fails because the runner doesn't exist teaches nothing.

## Right vs Wrong

**Wrong — code first:**
```
1. Write the handler function
2. Write tests to verify it works
3. All tests pass on first run ← this means the tests prove nothing
```

**Right — test first:**
```
1. Write test: POST /users returns 201 with valid body
2. Run test → FAILS (handler doesn't exist yet) ← good
3. Write minimal handler to return 201
4. Run test → PASSES ← test proved the behavior was missing, now it works
5. Refactor handler if needed, tests stay green
```

## Rationalization Table — Do Not Skip Tests

| Temptation | Why it fails |
|---|---|
| "This is too simple to test" | Simple code has the longest lifespan. It will be changed by someone who doesn't know the intent. |
| "I'll write tests after" | After never comes. And tests written after pass immediately, proving nothing. |
| "I'm just refactoring, no new behavior" | If behavior doesn't change, existing tests must stay green. Run them. |
| "Tests slow me down" | Tests save you from debugging sessions that take 10x longer. |
| "The type system catches this" | Types catch shape errors, not logic errors. Test the logic. |
| "I need to see the shape of the code first" | Spike in a scratch file. Then delete it and TDD the real implementation. |

## Test Quality Rules

- One behavior per test.
- Clear behavior-oriented test names (e.g., `test_expired_token_returns_401`).
- Prefer real behavior checks over mock-only assertions.
- Cover edge and error paths for changed behavior.
- A test that has never been seen failing is not a test — it's a wish.

## Anti-Patterns

- Writing tests after implementation.
- Adding multiple features before rerunning tests.
- Accepting passing tests that never failed first.
- Fixing bugs without a regression test.
- Testing mock behavior instead of real behavior.

## Completion Checklist

- [ ] Every changed behavior has a test.
- [ ] Each new test was observed failing before implementation.
- [ ] Changed tests pass.
- [ ] Relevant suite passes.

## Advanced Test Strategy

For complex, high-risk, or hard-to-test behavior, go beyond basic unit tests while still following RED-GREEN-REFACTOR:

- **Integration tests**: Test real interactions between components (database, API, filesystem). Prefer real dependencies over mocks.
- **E2E tests**: For user-facing flows, verify the full path from input to output.
- **Property-based tests**: When behavior has invariants (e.g., "sort output is always ordered"), generate random inputs to find edge cases.
- **Performance tests**: When latency or throughput matters, add benchmarks with clear thresholds.
- **Flaky test diagnosis**: If a test passes/fails inconsistently, treat it as a bug — find the race condition, timing dependency, or shared state causing it.
- **Coverage strategy**: Focus coverage on behavior boundaries and error paths, not line counts. 80% meaningful coverage beats 100% trivial coverage.

Choose appropriate frameworks and libraries for the current stack. Write tests that are fast, deterministic, and maintainable.

## Related

- Use `systematic-debugging` to find root cause before writing the fix test.
- Use `verification-before-completion` before success claims.
- Read `testing-anti-patterns.md` when introducing heavy mocking.
