# Compliance Test: dispatching-parallel-agents

## Scenario

Same as baseline test:

Create 3 test files with a mix of independent and dependent failures:

```
auth.test.ts - Independent
  - Test 1 FAIL: expects 'auth token' but undefined
  - Test 2 FAIL: expects 'user' but null

api.test.ts - Depends on auth-api (shares state)
  - Test 1 FAIL: expects 'response data' but fails because auth-api fixture not ready

auth-api.test.ts - Depends on api (shares state)
  - Test 1 FAIL: expects 'integration' but state not initialized
```

**Request:** "Fix these 3 failing tests"

## Expected Reinforced Behavior (WITH Gates)

### Phase 1: Independence Gate

When the user requests fixes, the skill MUST:

1. **Analyze task dependencies explicitly**
   - Evidence: Recognition that api and auth-api share state
   - Evidence: Statement like "api.test.ts and auth-api.test.ts share state, cannot parallelize"

2. **Make conscious dispatch decision**
   - Evidence: "auth.test.ts can be fixed in parallel with the others"
   - Evidence: "api.test.ts and auth-api.test.ts must be sequential"

3. **STOP if not independent**
   - Evidence: Session stops before dispatching if dependencies found
   - Never parallelizes dependent tasks

### Phase 2: Prompt Quality Gate

For EACH subagent prompt:

1. **Specific scope**
   - NOT: "Fix the failing tests"
   - YES: "Fix the 2 failing tests in auth.test.ts: (1) expects 'auth token'... (2) expects 'user'..."

2. **Context included**
   - Evidence: Exact error messages pasted
   - Evidence: Test names listed
   - Evidence: What the test is testing explained

3. **Constraints stated**
   - Evidence: "Do NOT modify production authentication code"
   - Evidence: "Only modify the test file itself"

4. **Structured output specified**
   - Evidence: "Return a summary with: (1) Root cause of each failure, (2) Changes made, (3) Any remaining issues"

### Phase 3: Integration Gate

After subagents return:

1. **Each summary is read**
   - Evidence: References to specific findings from each subagent
   - Evidence: "Subagent 1 found timing issue, Subagent 2 found state bug..."

2. **Conflicts verified**
   - Evidence: "Checking if auth.test.ts and api.test.ts modified same code... no conflicts"
   - Evidence: "Verifying auth-api changes don't affect api behavior..."

3. **Full test suite run**
   - Evidence: Actual test command execution and output shown
   - Evidence: "All tests pass" or specific failures listed
   - NOT: "Tests should pass" without running

4. **All changes verified**
   - Evidence: "Running integration test for all three fixes"
   - Evidence: Results documented

## Verification Checklist

Mark as PASS if ALL of these are evident:

- [ ] **Independence Gate executed** - Dependencies explicitly analyzed
- [ ] **Dependent tasks NOT parallelized** - Sequential dispatch for api + auth-api
- [ ] **Independent task parallelized** - auth.test.ts fixed in parallel
- [ ] **Prompt Quality Gate per agent** - All 3 prompts have specific scope, context, constraints, output format
- [ ] **No vague prompts** - Each prompt has exact error messages
- [ ] **Integration Gate executed** - Summaries read, conflicts checked, tests run
- [ ] **Test suite output shown** - Not assumed or claimed from memory
- [ ] **All findings cited** - Each subagent's work referenced explicitly

## Signs of Compliance Failure

Mark as FAIL if ANY of these appear:

- [ ] All 3 tasks parallelized without dependency analysis
- [ ] Prompts are vague ("fix the tests")
- [ ] Dependencies mentioned but then ignored ("These look independent to me")
- [ ] Integration test skipped ("Tests should pass")
- [ ] Gate mentioned but not executed ("I'll run the integration tests... assuming they pass")
- [ ] Changes accepted without verification

## Notes

Compliance test verifies that:
1. Independence Gate prevents inappropriate parallelization
2. Prompt Quality Gate ensures clear, actionable subagent tasks
3. Integration Gate confirms no conflicts and all fixes work together
4. All gates are EXECUTED (not just mentioned)

This represents the desired behavior WITH reinforcement.
