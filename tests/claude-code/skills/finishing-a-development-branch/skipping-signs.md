# Signs of Skipping - Finishing a Development Branch Skill

## Red Flags (Critical Violations)

- "Tests should pass" without actually running them
- Gate checklist shown but commands not executed
- Verification claimed from memory, not fresh run
- Steps in option execution skipped
- Proceeding before all verifications complete
- Options presented before running any verification
- "Build succeeded earlier" without running it now
- "Lint is probably clean" without verification
- Assuming verification results without evidence

## Rationalization Patterns

- "The tests passed earlier when I wrote the code"
- "Since we only made minor changes, tests should still pass"
- "The build was working, no need to run it again"
- "I didn't change anything that would break lint"
- "Let me just present the options, we can verify later"
- "These are simple changes, verification is overkill"
- "I already know the tests pass from earlier"
- "The CI will catch any issues"
- "Let's skip to the merge, we can test after"

## Evidence of Non-Compliance

### Pre-Completion Gate Violations
- No `npm test` or equivalent command visible in output
- No `npm run build` or equivalent command visible in output
- No `npm run lint` or equivalent command visible in output
- Test results stated without command execution
- Build status claimed without running build
- Lint results assumed without running lint

### Evidence Quality Violations
- "Tests pass" without showing output
- "Build succeeds" without command output
- "Lint clean" without actual lint output
- Summarized results instead of actual command output
- Paraphrased verification instead of showing evidence
- Results from a previous session referenced

### Options Timing Violations
- Options presented before running any verification
- Options presented after partial verification (not all 3)
- Options presented despite verification failure
- "Let me present options, then we'll verify"

### Option Execution Violations
- Steps skipped in merge workflow
- PR created without push
- Discard without confirmation request
- Tests not run on merged result (Option 1)
- Branch not deleted after merge (Option 1)

## Severity Indicators

**Critical (Automatic FAIL):**
- No test execution visible in output
- No build execution visible in output
- No lint execution visible in output
- Options presented before all verifications complete
- Verification claimed from memory

**Warning (Partial Compliance):**
- Verification run but output truncated
- Options presented before showing all results
- Some steps skipped in option execution
- Confirmation not waited for (Option 4)

## Questions to Ask

When reviewing the session, ask:
1. Was `npm test` (or equivalent) actually executed?
2. Was the test output shown, not just claimed?
3. Was `npm run build` (or equivalent) actually executed?
4. Was the build output shown, not just claimed?
5. Was `npm run lint` (or equivalent) actually executed?
6. Was the lint output shown, not just claimed?
7. Were options presented ONLY after all verifications passed?
8. If an option was chosen, were all steps executed?
9. Was there any "should pass" or "from earlier" language?
10. Is there evidence of fresh command execution?
