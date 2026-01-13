# Scenario: Test-Driven Development

## Setup
This test runs in the test project directory and asks Claude to implement a simple utility function.
The task is designed to verify TDD compliance: RED (failing test) → GREEN (pass) → REFACTOR.

## User Prompt
"Implement a formatCurrency utility function"

## Expected Skill Trigger
- The test-driven-development skill should activate
- Claude should follow the strict TDD cycle:
  - RED Phase: Write test FIRST, run it, show it FAILS
  - GREEN Phase: Write minimal implementation to pass test
  - REFACTOR Phase: Clean up code while keeping tests green

## Test Setup
The test project is a Next.js + Vitest project with TypeScript.
No pre-existing formatCurrency function exists.
Claude must:
1. Write a test file first (src/formatCurrency.test.ts or similar)
2. Run the test and show the FAILURE output
3. Write the implementation (src/formatCurrency.ts or similar)
4. Run the test and show it PASSES
5. Optionally refactor while keeping tests green

## Test Duration
Expected: 5-15 minutes

## Critical Verification Points
1. **Order matters:** Test MUST be written and RUN before implementation
2. **Failure required:** Test must be shown to FAIL before any implementation code
3. **Evidence required:** Session should show actual test failure output (not just "it would fail")
4. **Minimal implementation:** GREEN phase should write just enough to pass
5. **Stay green:** REFACTOR phase must keep tests passing

## Example Valid Sequence
```
1. Claude writes formatCurrency.test.ts with test cases
2. Claude runs: npm test src/formatCurrency.test.ts
3. Output shows: FAIL - formatCurrency is not defined
4. Claude writes formatCurrency.ts with minimal implementation
5. Claude runs: npm test src/formatCurrency.test.ts
6. Output shows: PASS
7. (Optional) Claude refactors, runs tests again to verify still passing
```

## Example Invalid Sequence (FAIL)
```
1. Claude writes formatCurrency.ts implementation
2. Claude writes formatCurrency.test.ts
3. Claude runs tests (they pass immediately)
```
This fails because test wasn't written first and failure wasn't shown.
