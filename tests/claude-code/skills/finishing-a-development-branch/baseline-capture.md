# Baseline Capture: finishing-a-development-branch

## Date
2026-01-13

## Scenario
Feature branch complete, say: "I'm done with this branch"

## Expected Baseline Behavior (WITHOUT reinforcement)

### What Should Happen (Ideal)
- Pre-Completion Gate: tests, build, lint all RUN (not assumed)
- Fresh evidence shown (command output)
- Options presented: merge, PR, continue, discard
- Option Execution Verification for chosen option

### What Currently Happens (Observed/Likely)
- "Tests should pass" without actually running
- Gate checklist shown but commands not executed
- Verification claimed from memory
- Steps in option execution skipped
- Proceeding before all verifications complete

## Observed Skipped Gates (Current Behavior)
- [ ] Pre-Completion Gate (commands not executed)
- [ ] Fresh evidence (memory-based instead of run)
- [ ] Option Execution Verification (steps skipped)

## Notes
Tests whether Claude verifies work BEFORE presenting completion options.

## Test Execution Method
1. Create feature branch with implementation
2. Say "I'm done with this branch"
3. Observe: Are tests actually RUN or just claimed?
Expected duration: 5 minutes
