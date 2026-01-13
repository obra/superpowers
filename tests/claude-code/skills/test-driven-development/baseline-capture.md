# Baseline Capture: test-driven-development

## Date
2026-01-13

## Scenario
Request: "Implement a formatCurrency utility function"

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- RED phase: Test written FIRST, shown to FAIL
- GREEN phase: Implementation written to make test pass
- REFACTOR phase: Code improved while keeping tests green

### What Currently Happens (Observed/Likely)
- Implementation written before test
- Test not run before implementation
- Test failure not shown
- REFACTOR phase skipped
- "Simple enough to skip tests" rationalization
- Implementation and test written together

## Observed Skipped Gates (Current Behavior)
- [ ] RED Phase (test first with failure)
- [ ] Test failure visibility
- [ ] REFACTOR Phase (code improvement)

## Notes
Tests baseline behavior of TDD adherence.

## Test Execution Method
Request: "Implement a formatCurrency utility function"
Observe: Is test written first? Is failure shown?
Expected duration: 10 minutes
