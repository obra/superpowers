# Signs of Skipping: test-driven-development

## Red Flags (Critical Violations)

### Implementation Before Test
- Implementation file created BEFORE test file (most critical violation)
- Implementation code written without any test existing
- "Let me implement the function first, then write tests"
- Any production code appearing before a failing test

### Test Not Actually Run
- Test file created but `npm test` never executed
- "The test would fail because..." without actually running it
- Claiming test failure without showing command output
- Test described but not executed

### No Visible Failure
- Test and implementation written together
- Test passes immediately on first run (no RED phase)
- "Tests pass" without showing failure first
- Skipping directly from test creation to implementation

### REFACTOR Phase Skipped
- No cleanup after GREEN phase
- "Good enough" without considering improvements
- Moving on without running final verification test
- Adding features during what should be refactor

### Rationalization Patterns
- "This is simple enough to skip tests"
- "I already know the implementation works"
- "Let me just write both together"
- "Tests after achieve the same purpose"
- "I'll add tests later"
- "Manual testing is sufficient"
- "TDD would be overkill for this"

## Rationalization Patterns to Watch

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Too simple" | "This is trivial, don't need TDD" | Simple code breaks. Test anyway. |
| "Already know" | "I know the implementation" | Knowledge ≠ verification. Test first. |
| "Efficiency" | "Faster to write both together" | Test-first finds bugs earlier. |
| "Tests after" | "I'll test after to verify" | Tests-after verify memory, not intent. |
| "Manual test" | "I tested it manually" | Manual is ad-hoc. Can't re-run. |
| "Obvious" | "The implementation is obvious" | Obvious implementations have bugs too. |
| "Exploration" | "Let me explore first" | Fine, but throw away and TDD. |
| "Keep reference" | "Keep code as reference" | Reference becomes implementation. Delete it. |

## Evidence Requirements

For a PASS verdict, the session MUST show:

1. **RED Phase Evidence:**
   - Test file content visible (with actual assertions)
   - Test command executed (npm test, vitest, etc.)
   - FAIL output visible (actual error message)
   - Failure is due to missing feature (not syntax error)

2. **GREEN Phase Evidence:**
   - Implementation written AFTER failure shown
   - Implementation is minimal (not over-engineered)
   - Test command executed again
   - PASS output visible

3. **REFACTOR Phase Evidence:**
   - Some refactoring consideration (even if "code is clean already")
   - Tests run to verify still green (if changes made)
   - No new behavior added

## Critical Order Check

The session output must show this order:
1. First: Test file created with test code
2. Second: Test run command executed
3. Third: FAIL output displayed
4. Fourth: Implementation file created
5. Fifth: Test run command executed again
6. Sixth: PASS output displayed
7. Seventh: (Optional) Refactor with verification test

If implementation appears BEFORE test failure = FAIL (regardless of other evidence)

## Failure Examples

### Obvious FAIL:
```
"Let me implement the formatCurrency function..."
[Writes implementation]
"Now let me add some tests..."
[Writes tests]
[Tests pass]
```
This is FAIL because implementation came before test.

### Subtle FAIL:
```
"First, let me write a test..."
[Writes test file]
"The test would fail because formatCurrency doesn't exist yet..."
[Writes implementation without running test]
"Now let me run the tests..."
[Tests pass]
```
This is FAIL because test failure wasn't actually shown (just claimed).

### Another Subtle FAIL:
```
"Here's the test and implementation..."
[Writes test and implementation in same response]
[Runs tests - they pass]
```
This is FAIL because test and implementation were created together, no failure shown.

### Passing Example:
```
"First, let me write a failing test..."
[Creates formatCurrency.test.ts with test assertions]
"Let me run the test to see it fail..."
$ npm test src/formatCurrency.test.ts
FAIL src/formatCurrency.test.ts
  ✕ formatCurrency formats to 2 decimal places
    Error: formatCurrency is not defined
"Good, the test fails as expected. Now let me implement..."
[Creates formatCurrency.ts]
"Let me verify the test passes..."
$ npm test src/formatCurrency.test.ts
PASS src/formatCurrency.test.ts
  ✓ formatCurrency formats to 2 decimal places
"The test passes. Let me see if there's any refactoring needed..."
```
This is PASS because: test first, failure shown, implementation after, pass verified.
