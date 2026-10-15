---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development

**Iron Law: no production code without a failing test first.**

This covers new features, bug fixes, refactoring, and behavior changes. The exceptions are throwaway prototypes, generated code, configuration files, and plan tasks whose `Verify:` mode is `test-with` or `checks-only`, where the approved plan already made the call. Any other exception is your human partner's to grant.

If you wrote the code first, delete it and start from the test. Don't keep it open as a reference or adapt it while writing the test: either way the test ends up describing what you built instead of what was required.

## Red, green, refactor

**Red.** Write one minimal test for one behavior, named for that behavior, exercising real code; mock only what you cannot otherwise run. Run it and confirm it fails rather than errors, with the message you expected, because the behavior is missing and not because of a typo or a bad import. A test that passes on the first run is testing something that already exists; fix the test.

**Green.** Write the simplest code that passes: no extra options, no unrelated refactoring. Confirm this test and the others pass, and the output shows no new errors or warnings. If the test still fails, fix the code, not the test.

**Refactor.** With tests green, remove duplication and improve names without changing behavior. Then write the next failing test.

A bug fix is the same cycle: the failing test reproduces the bug, proving the fix and keeping it from coming back.

A guard — a permission check, a tenant filter, a rejection path — must fail first against code that lacks the guard, not against a missing module: build the happy path first, then write the guard's test, watch it fail, and add the guard.

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

When writing or changing any test, adding mocks, or adding test-only helpers, read [writing-good-tests.md](writing-good-tests.md). Its rules in brief:

- Name the production change that would make the test fail, before writing it
- Derive expected values by hand, never with the code under test
- Assert on real behavior, never on mock behavior or source text
- Keep test-only code in test utilities, out of production classes
- Run the mutation check before you call a test file done
