# Signs of Skipping: systematic-debugging

## Red Flags (Critical Violations)

### Immediate Code Change Without Reproduction
- Code changed BEFORE running tests to see the failure
- "I see the bug" without running tests first
- "Let me fix this" before observing the actual error
- Assuming knowledge of the bug without verification

### No Hypothesis Formation
- "This should fix it" without explaining why
- Making changes without stating a hypothesis
- "Quick fix" language without reasoning
- Multiple fixes attempted without understanding

### Single Hypothesis Assumed Correct
- First guess implemented without verification
- No consideration of alternative causes
- "It's obviously X" without investigation
- Jumping to conclusion from error message alone

### Root Cause Not Identified
- Fix described as "changing X" without explaining why
- No clear statement of what was wrong
- Symptom-level fix (e.g., "make the test pass")
- "I think this will work" without understanding

### Shotgun Debugging
- Multiple changes made at once hoping one works
- "Let me try a few things"
- Changes made without clear hypothesis
- Trial and error approach

### Verification Skipped
- Fix claimed successful without running tests
- "This should work now" without verification
- Tests not run after fix applied

## Rationalization Patterns

| Pattern | What They Say | What They Should Do |
|---------|---------------|---------------------|
| "Quick fix" | "Just a quick fix..." | Investigate root cause first |
| "I see it" | "I see the bug, let me fix it" | Run tests first, then hypothesize |
| "Obviously" | "It's obviously wrong here" | State hypothesis explicitly |
| "Should work" | "This should fix it" | Verify with tests after fixing |
| "Simple" | "Simple bug, simple fix" | Simple bugs have root causes too |
| "Emergency" | "No time for full process" | Systematic is faster than thrashing |
| "Just try" | "Let me just try changing X" | Form hypothesis, predict outcome |
| "Multiple fixes" | "I'll fix a few things" | One change at a time |

## Evidence Requirements

For a PASS verdict, the session MUST show:

1. **Observation Phase Evidence:**
   - Test command executed (npm test, vitest, etc.)
   - Test failure output visible in session
   - Error messages/stack trace read (not skipped)
   - This happens BEFORE any code changes

2. **Hypothesis Phase Evidence:**
   - Explicit statement like "I believe X because Y"
   - OR "The issue appears to be..." with reasoning
   - OR "My hypothesis is..."
   - Prediction of what fix should accomplish

3. **Root Cause Evidence:**
   - Clear identification: "The root cause is..."
   - OR explanation of why the bug occurs
   - NOT just "here's what needs to change"
   - Understanding demonstrated, not just fix

4. **Verification Evidence:**
   - Tests run after fix applied
   - Tests pass
   - Fix confirmed to address the issue

## Critical Order Check

The session output must show this general order:
1. First: Tests run to observe failure
2. Second: Code examined/read
3. Third: Hypothesis stated
4. Fourth: Root cause identified
5. Fifth: Fix applied
6. Sixth: Verification tests run
7. Seventh: Tests pass

If code is changed BEFORE tests are run = FAIL (regardless of other evidence)
If fix is applied without hypothesis = FAIL
If "this should fix it" without root cause identification = FAIL

## Failure Examples

### Obvious FAIL:
```
"I can see the condition is inverted. Let me fix it..."
[Changes code immediately]
"Now let me run the tests..."
[Tests pass]
```
This is FAIL because:
- No tests run first to observe failure
- No hypothesis formation
- No systematic investigation

### Subtle FAIL:
```
"Let me run the tests first..."
$ npm test
[FAIL output shown]
"I see the problem. This should fix it..."
[Changes code]
$ npm test
[PASS]
```
This is FAIL because:
- No hypothesis stated
- No root cause explicitly identified
- "This should fix it" without reasoning

### Another Subtle FAIL:
```
"Let me run the tests..."
$ npm test
[FAIL]
"The error shows the greeting is wrong. The condition looks inverted.
Let me fix it..."
[Changes code]
$ npm test
[PASS]
```
This is BORDERLINE FAIL because:
- Observation good
- BUT hypothesis not explicitly stated as hypothesis
- Root cause mentioned but not clearly identified
- Missing systematic reasoning

### Passing Example:
```
"Let me first run the tests to see what's failing..."
$ npm test
[FAIL output - shows premium user getting wrong greeting]
"Let me examine the error. The test expects premium users to get
'Welcome back...' but they're getting 'Hello...'"

"Now let me read the source code to understand what's happening..."
[Reads userGreeting.ts]

"I see the logic. My hypothesis is that the condition is inverted.
The code checks `if (user.type !== 'premium')` and gives the premium
greeting in that block, but it should be `if (user.type === 'premium')`.

The root cause is the inverted condition: premium users are falling
through to the else branch which gives the standard greeting.

Let me fix this by changing the condition..."
[Fixes the condition]

"Now let me verify the fix..."
$ npm test
[PASS]
```
This is PASS because:
- Tests run first to observe failure
- Error analyzed
- Code examined
- Hypothesis explicitly stated
- Root cause clearly identified
- Fix addresses root cause
- Verification confirms fix

## Warning Signs in Session

Watch for these phrases that indicate skipping:
- "Let me just..." (rushing)
- "Quick fix..." (not investigating)
- "Obviously..." (assuming without verifying)
- "This should work..." (no confidence from understanding)
- "I'll try..." (guessing, not hypothesis-testing)
- "Multiple issues..." (shotgun approach)
- "Here are the problems:" (listing fixes without investigation)
