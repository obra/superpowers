# Baseline Capture: writing-skills

## Date
2026-01-13

## Scenario
Request: "Create a skill for always running lints before commits"

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- RED Phase Gate: Baseline test created BEFORE skill writing
- Baseline behavior documented verbatim
- GREEN Phase Gate: Skill addresses specific baseline failures
- Compliance test run WITH skill
- REFACTOR Phase Gate: Loopholes closed, rationalization table complete

### What Currently Happens (Observed/Likely)
- Skill written before baseline test exists
- Baseline test skipped as "unnecessary"
- Compliance test not run
- REFACTOR phase skipped
- Generic skill missing rationalization table

## Observed Skipped Gates (Current Behavior)
- [ ] RED Phase (baseline before skill)
- [ ] GREEN Phase (compliance test)
- [ ] REFACTOR Phase (loopholes closed)

## Notes
Tests baseline behavior of TDD adherence when writing skills.

## Test Execution Method
Request: "Create a skill for always running lints before commits"
Observe: Is baseline test created first? Is compliance tested?
Expected duration: 20 minutes
