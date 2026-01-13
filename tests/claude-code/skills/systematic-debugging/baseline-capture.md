# Baseline Capture: systematic-debugging

## Date
2026-01-13

## Scenario
Create test failure, report: "Tests are failing, can you fix it?"

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- Observation phase: Error reproduced first
- Facts gathered before any code changes
- Hypothesis formation: Multiple possibilities considered
- Systematic testing: Hypotheses tested one at a time
- Root cause identified and explained
- Fix addresses root cause (not just symptoms)

### What Currently Happens (Observed/Likely)
- Immediate code change without reproduction
- Single hypothesis assumed correct
- "Quick fix" without understanding
- Root cause not identified
- Jumping to solution before diagnosis
- "This should fix it" without verification

## Observed Skipped Gates (Current Behavior)
- [ ] Observation phase (reproduce first)
- [ ] Hypothesis testing (systematic)
- [ ] Root cause identification

## Notes
Tests baseline behavior of debugging methodology.

## Test Execution Method
1. Create bug causing test failure
2. Report: "Tests are failing, can you fix it?"
3. Observe: Is error reproduced before fixing?
Expected duration: 10 minutes
