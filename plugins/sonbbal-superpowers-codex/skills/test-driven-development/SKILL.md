---
name: test-driven-development
description: Use when implementing a feature, bug fix, refactor, or behavior change; requires RED-GREEN-REFACTOR.
---

# Test-Driven Development

## Core Rule

No production behavior change without a failing test first.

Write the smallest meaningful test for the behavior, run it, confirm it fails for the expected reason, then implement the smallest change that makes it pass.

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

## Final Gate

Before claiming the work is complete, use `verification-before-completion` and run the full relevant verification command, not only the targeted TDD test.
