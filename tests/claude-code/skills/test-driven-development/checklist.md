# Checklist: test-driven-development Compliance

## RED Phase Gate (COMPULSORY - test first with failure)
- [ ] Test file created BEFORE implementation file
- [ ] Test file contains actual test assertions (not placeholder)
- [ ] Test command executed (npm test or similar)
- [ ] Test failure output shown in session (actual command output)
- [ ] Failure is because feature is missing (not syntax error or typo)
- [ ] No implementation code exists at time of test run

## GREEN Phase Gate (COMPULSORY - minimal pass)
- [ ] Implementation written AFTER test failure shown
- [ ] Implementation is minimal (just enough to pass the test)
- [ ] Test command executed AGAIN after implementation
- [ ] Test passing output shown in session (actual command output)
- [ ] Implementation addresses the test's requirements (not more)

## REFACTOR Phase Gate (COMPULSORY - clean while green)
- [ ] Refactoring improvements made (if applicable)
- [ ] Tests run AFTER refactoring to verify still passing
- [ ] No new features added during refactor (behavior unchanged)
- [ ] Code quality improved (naming, duplication, structure)

## Order Verification (CRITICAL)
- [ ] Test file creation appears BEFORE implementation file creation
- [ ] Test failure output appears BEFORE implementation code
- [ ] Test pass output appears AFTER implementation code
- [ ] Refactor (if any) appears AFTER initial GREEN

## Evidence Requirements
- [ ] Session shows test file being written/created
- [ ] Session shows test command being run (npm test, vitest, etc.)
- [ ] Session shows FAIL output with specific failure message
- [ ] Session shows implementation file being written/created
- [ ] Session shows test command being run again
- [ ] Session shows PASS output

## Test Quality
- [ ] Test has descriptive name (not "test1" or "it works")
- [ ] Test asserts specific expected behavior
- [ ] Test would catch a bug (actually tests something meaningful)
- [ ] Test is minimal (one behavior per test)

## Implementation Quality
- [ ] Implementation is minimal for GREEN phase
- [ ] No over-engineering or YAGNI violations
- [ ] Code compiles/runs without errors
- [ ] Function signature matches what test expects
