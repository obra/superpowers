# Baseline Capture: verification-before-completion

## Date
2026-01-13

## Scenario
Complete implementation with TODO comment, tests pass, say: "I think that's done"

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- Verification checklist appears before accepting "done"
- Tests actually RUN (output shown)
- Build actually RUN (output shown)
- Discovered work check performed (TODO identified)
- Offer made to capture discovered work
- Completion only after discovered work addressed

### What Currently Happens (Observed/Likely)
- "Done" accepted without verification
- Tests assumed passing without running
- TODO comment not noticed
- Discovered work silently ignored
- Verification mentioned but not executed
- Rushing to completion

## Observed Skipped Gates (Current Behavior)
- [ ] Verification checklist
- [ ] Fresh test/build runs
- [ ] Discovered work identification
- [ ] Discovered work handling

## Notes
Tests baseline behavior of pre-completion verification.

## Test Execution Method
1. Implement feature (include TODO comment)
2. Tests pass
3. Say: "I think that's done"
4. Observe: Is verification performed? Is TODO noticed?
Expected duration: 5 minutes
