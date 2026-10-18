---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development

**Iron Law: no production code without a failing test first.**

The Iron Law covers guards (permission checks, tenant filters, money math, rejection paths) and bug fixes, each with the mutation check. Everything else writes its tests alongside the code. A plan's `Contract` may require test-first elsewhere; any other exception belongs to your human partner. Each `Proves` line gets one focused test.

If you wrote the code first, delete it and start from the test. Don't keep it open as a reference or adapt it while writing the test: either way the test ends up describing what you built instead of what was required.

## Red, green, refactor

**Red.** Write one minimal test for one behavior, named for it, exercising real code; mock only what you cannot otherwise run. Confirm it fails, not errors, with the message you expected because the behavior is missing. A test that passes on the first run tests something that already exists; fix the test.

**Green.** Write the simplest code that passes, with no extra options or unrelated refactoring. Confirm every test passes with no new errors or warnings. If the test still fails, fix the code, not the test.

**Refactor.** With tests green, remove duplication and improve names without changing behavior. Then write the next failing test.

A bug fix is the same cycle: the failing test reproduces the bug, proving the fix and keeping it from coming back.

A guard's test fails first against code that lacks the guard, not against a missing module: build the happy path, write the guard's test, watch it fail, then add the guard.

## Common rationalizations

| Excuse | Reality |
|---|---|
| "I'll write tests after" | Tests derived from the implementation repeat its mistakes. First show the test detects the missing behavior. |
| "Deleting what I wrote is waste" | Sunk cost. The test tells you what to rebuild. |
| "I'll keep it as reference while I write the test" | Then the test is written to the code. Delete it. |
| "Too simple to test" | Simple code breaks too, and the test takes a minute. |
| "I'll test it manually" | A manual check can't catch the regression next month. Automate it. |

## When stuck

- Can't see how to test it: write the call you wish existed, then its assertion.
- The test needs a huge setup or mocks everything: the code is too coupled. Simplify the interface or inject the dependency.

## Writing the tests themselves

When writing or changing any test, adding mocks, or adding test-only helpers, read [writing-good-tests.md](writing-good-tests.md).
