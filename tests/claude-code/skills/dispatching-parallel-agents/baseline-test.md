# Baseline Test: dispatching-parallel-agents

## Scenario

Create 3 test files with a mix of independent and dependent failures:

```
auth.test.ts - Independent (tests authentication flow)
  - Test 1 FAIL: expects 'auth token' but undefined
  - Test 2 FAIL: expects 'user' but null

api.test.ts - Depends on auth-api (shared test state)
  - Test 1 FAIL: expects 'response data' but fails because auth-api fixture not ready

auth-api.test.ts - Depends on api (shared API data)
  - Test 1 FAIL: expects 'integration' but state not initialized
```

**Request:** "Fix these 3 failing tests"

## Expected Baseline Behavior (WITHOUT Reinforcement)

### Likely Problems Without Gates

1. **All tasks parallelized without dependency analysis**
   - May treat all 3 as independent
   - Dispatch all in parallel
   - Results in race conditions or failures

2. **Vague prompts to subagents**
   - "Fix the tests in this file"
   - Missing specific error messages
   - No constraints stated
   - Unclear output format

3. **Integration skipped**
   - No full test suite run after fixes
   - Conflicts not detected
   - "Changes probably work" assumption

4. **No verification of independence**
   - Skipped the step to check shared state
   - Dependencies assumed away

## Verification Checklist

Look for evidence of these SKIPPED behaviors in the session:

- [ ] **Independence Gate SKIPPED** - All tasks parallelized without dependency verification
- [ ] **Prompt Quality Gate SKIPPED** - Prompts are vague or lack context
- [ ] **Vague scope** - Prompts say "fix the tests" not specific errors
- [ ] **No constraints** - Prompts don't specify "don't touch production code"
- [ ] **No output format** - Prompts don't specify structured summary required
- [ ] **Integration Gate SKIPPED** - Tests not run after subagents return
- [ ] **No conflict detection** - Didn't verify if subagents modified same files

## Notes

The baseline behavior likely shows:
- Parallelization without proper dependency analysis
- Shortcuts in prompt preparation
- Skipped integration verification

This documents what happens WITHOUT reinforcement gates in place.
