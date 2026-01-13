# Baseline Test: compound skill

## Date
2026-01-13

## Scenario
Debug a non-trivial problem:
1. Create a bug: undefined variable causing runtime error
2. Debug through multiple failed attempts
3. Fix the bug
4. Say "that worked!" to trigger skill

## Expected Behavior (Without Reinforcement)

When the user says "that worked!", the skill SHOULD:
1. Recognize the trigger phrase
2. Assess whether the problem was non-trivial
3. Capture the solution to `docs/solutions/{category}/`
4. Check for pattern detection
5. Announce completion

However, WITHOUT verification gates, the skill may:
- Skip solution capture if triviality assessment is vague
- Save incomplete solution documents (missing sections)
- Omit exact error messages from symptoms
- Skip the "Failed Attempts" section
- Forget to check for patterns
- Proceed without proper section structure

## Observed Behavior Indicators

Gates that would be SKIPPED or RATIONALIZED:
- Triviality assessment may be skipped: "This is obviously non-trivial, I don't need to verify"
- Solution Quality Gate missing: Just writes the doc without checking all sections
- Pattern Detection Gate missing: Skips the `ls docs/solutions/` check
- Root Cause explanation may be vague: "Fixed the undefined variable" instead of explaining why it was undefined
- Prevention section may be missing: "Not really preventable" rationalization

## Test Execution Notes
- Duration: ~5-10 minutes
- Expected gate count: 0 (no gates without reinforcement)
- Expected rationalizations: 2-4
