---
name: test-driven-development
description: Use when implementing a feature, bug fix, refactor, or behavior change; requires RED-GREEN-REFACTOR.
---

# Test-Driven Development

## Core Rule

No production behavior change without a failing test first.

Write the smallest meaningful test for the behavior, run it, confirm it fails for the expected reason, then implement the smallest change that makes it pass.

If you write production code before the failing test, delete or discard that implementation and start over from the test. Do not keep it as a reference, adapt it while writing the test, or treat a later test as equivalent to a real red phase.

## RED-GREEN-REFACTOR

### RED

Write one minimal test that describes the desired behavior.

The test should:

- Exercise real behavior where practical.
- Have a clear name.
- Check one behavior.
- Fail because the behavior is missing or wrong.

Run the targeted test and confirm the failure is expected. If the test passes immediately, it is not proving the missing behavior. If it errors for setup or syntax reasons, fix the test and run it again until it fails correctly.

### GREEN

Implement the smallest change that makes the failing test pass.

Do not add adjacent features, broad refactors, or speculative options while getting to green.

Run the targeted test again and confirm it passes.

### REFACTOR

After the test passes, clean up names, duplication, and structure while preserving behavior.

Run the relevant tests after refactoring.

## Scope

Use this workflow for:

- New behavior.
- Bug fixes.
- Refactors that can change behavior.
- Compatibility tests.

For pure documentation edits, still prefer executable checks when the repository has validation scripts.

## Common Rationalizations

| Rationalization | Reality |
| --- | --- |
| "I'll write tests later" | Tests after implementation do not prove the test catches the missing behavior. |
| "Manual testing is enough" | Manual checks are not repeatable regression tests. |
| "This is too simple" | Simple behavior still breaks and still needs a red phase. |
| "Just this once" | One skipped cycle creates untested production behavior. |
| "Deleting this work is wasteful" | Sunk cost is not a reason to keep code written before the test. |
| "I followed the spirit, not the letter" | The red phase is the discipline; skipping it changes the result. |

## No Executable Test Harness

If no executable test harness exists for the change, do not skip validation. Use the smallest deterministic check available and document why it is the best available substitute.

Fallback validation is not TDD when a real failing test is possible. Use fallback checks only when the artifact or environment cannot produce a meaningful red test first.

Acceptable fallback validation includes:

- A compatibility script that checks the changed contract.
- A schema, lint, parser, or format check for the edited artifact.
- A focused command that exercises the changed path without a full test runner.
- A documented inspection checklist tied to the requirement, expected output, and changed files.

Run the fallback check before implementation when it can expose the current failure. If no pre-change failure is possible, record that limitation, make the smallest change, then run the fallback check after the change.

## Final Gate

Before claiming the work is complete, use `verification-before-completion` and run the full relevant verification command, not only the targeted TDD test.
