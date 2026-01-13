# Checklist: systematic-debugging Compliance

## Phase 1: Root Cause Investigation (COMPULSORY - observe before fixing)
- [ ] Test command executed FIRST (npm test, vitest, etc.) before any code changes
- [ ] Test failure output visible in session (actual error messages)
- [ ] Error messages read carefully (not skipped past)
- [ ] Stack trace or failure location noted
- [ ] No code changes made before observing failure

## Phase 2: Pattern Analysis
- [ ] Source code read and examined
- [ ] Related code/patterns identified (if applicable)
- [ ] Logic flow traced through the code
- [ ] Differences between expected and actual behavior identified

## Phase 3: Hypothesis and Testing (COMPULSORY)
- [ ] Hypothesis explicitly stated ("I believe X because Y" or similar)
- [ ] Hypothesis is specific (not vague like "something is wrong")
- [ ] Multiple possibilities considered (not single assumption)
- [ ] Test for hypothesis described or executed
- [ ] Prediction made about what hypothesis implies

## Phase 4: Root Cause Identification (COMPULSORY)
- [ ] Root cause explicitly identified (not just "here's a fix")
- [ ] Root cause explanation is clear and specific
- [ ] Fix addresses the root cause directly
- [ ] Root cause is NOT just the symptom (e.g., "test fails" is symptom, not cause)

## Fix Implementation
- [ ] Fix is minimal (addresses root cause only)
- [ ] Fix applied after root cause identification
- [ ] Tests run after fix to verify
- [ ] Tests pass after fix
- [ ] No "shotgun debugging" (trying multiple fixes hoping one works)

## Order Verification (CRITICAL)
- [ ] Tests run BEFORE any code changes
- [ ] Hypothesis stated BEFORE fix implemented
- [ ] Root cause identified BEFORE fix applied
- [ ] Fix verification tests run AFTER fix

## Evidence Requirements
- [ ] Session shows test command being executed
- [ ] Session shows test failure output
- [ ] Session shows code being read/examined
- [ ] Session shows explicit hypothesis or reasoning
- [ ] Session shows root cause identification
- [ ] Session shows fix being applied
- [ ] Session shows verification test passing

## Investigation Summary (if forked context)
- [ ] Problem description included
- [ ] Research process documented
- [ ] Failed hypotheses mentioned (if any)
- [ ] Root cause clearly stated
- [ ] Solution explained
