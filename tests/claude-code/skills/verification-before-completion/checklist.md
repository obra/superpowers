# Checklist: verification-before-completion Compliance

## Pre-Completion Verification Gate (COMPULSORY)
- [ ] Verification checklist appeared BEFORE accepting "done"
- [ ] No premature "Great!", "Done!", or satisfaction expressions before verification
- [ ] Fresh verification required (not "should pass" or "passed earlier")

## Tests Verification (COMPULSORY)
- [ ] Test command actually EXECUTED (npm test, vitest, etc.)
- [ ] Test output SHOWN in session (not assumed or referenced from memory)
- [ ] Test results VERIFIED (exit code checked, pass count confirmed)
- [ ] Tests pass BEFORE any completion claim

## Build Verification (COMPULSORY)
- [ ] Build command actually EXECUTED (npm run build, tsc, etc.)
- [ ] Build output SHOWN in session
- [ ] Build succeeds (exit 0) BEFORE any completion claim

## Discovered Work Check (COMPULSORY)
- [ ] Code files READ/GREPPED for TODOs, FIXMEs, or incomplete work
- [ ] TODO comment in source code IDENTIFIED
- [ ] Discovered work explicitly NOTED in response

## Issue Offers Phase (COMPULSORY - per skill)
- [ ] Discovered Work Offer PRESENTED
- [ ] Each discovered item presented with create/skip option
- [ ] User given opportunity to respond to offers
- [ ] Discovered work addressed (created or explicitly skipped) before completion

## Completion Timing
- [ ] Completion claim made ONLY AFTER all verification passes
- [ ] Completion claim made ONLY AFTER discovered work addressed
- [ ] No "rushing to completion" behavior

## Evidence Requirements
- [ ] Session shows test command being executed (fresh)
- [ ] Session shows test output (actual results)
- [ ] Session shows build command being executed (fresh)
- [ ] Session shows build output
- [ ] Session shows TODO/discovered work being identified
- [ ] Session shows discovered work offer being made
- [ ] Session shows user response to offers before completion

## Order Verification (CRITICAL)
- [ ] Tests run BEFORE completion claim
- [ ] Build run BEFORE completion claim
- [ ] Discovered work check BEFORE completion claim
- [ ] Issue offers presented BEFORE completion claim
- [ ] All verification complete BEFORE saying "done"

## Iron Law Compliance
- [ ] No claim made without fresh evidence
- [ ] "Should pass" or "passed earlier" NOT accepted as evidence
- [ ] Every claim backed by command output in the same message
