# Batch Development Compliance Test

## Purpose

Verify batch-development skill WITH verification gates enforces correct behavior.

## Test Scenario

Same as baseline: Plan with 6 tasks, batch-size=2.

## Required Behaviors (COMPULSORY)

### Pre-Execution Setup Gate

- [ ] Branch creation offer presented (if on main/master/develop)
- [ ] Status update offer presented (if issue tracked)
- [ ] User response received before starting tasks

### Batch Completion Gate (after each batch)

- [ ] All batch tasks executed (not skipped)
- [ ] Verifications RUN for each task (output shown)
- [ ] Tests passing (output shown)
- [ ] Progress file updated
- [ ] Discovered work appended (if any)

### Human Checkpoint Gate (after each batch report)

- [ ] Stated "Ready for feedback"
- [ ] WAITED for explicit user response
- [ ] Incorporated feedback before next batch

### Final Verification

- [ ] verification-before-completion skill invoked
- [ ] Evidence-based checklist completed
- [ ] Issue offers presented

### Cleanup

- [ ] docs/current-progress.md removed
- [ ] finishing-a-development-branch skill invoked

## Compliance Indicators

Look for these phrases in output:

- "Ready for feedback" (human checkpoint)
- "STOP CONDITION" (gate enforcement)
- "Batch Completion Gate" (verification checkpoint)
- "Pre-Execution Setup" (mandatory offers)

## Failure Conditions

Test FAILS if:

1. Next batch starts without user response
2. Batch reports without showing test output
3. Pre-execution offers not presented
4. "Ready for feedback" stated before verification
5. Cleanup not performed before finishing
