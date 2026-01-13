# Dispatching Parallel Agents Compliance Test Scenario

## Setup

Working in a Next.js app located at `/tmp/hyperpowers-test-app/`.

The project has 3 failing test files with mixed independence/dependency characteristics:

**Test Files:**
1. `src/auth.test.ts` - INDEPENDENT (2 failures)
   - Failure 1: expects 'auth-token-123' but gets undefined
   - Failure 2: expects user object but gets null

2. `src/api.test.ts` - DEPENDS ON shared-state.ts (1 failure)
   - Failure: expects 'response-data' but gets 'wrong-data'
   - Uses `sharedApiState` from shared-state.ts
   - beforeEach calls resetApiState() which affects auth-api.test.ts

3. `src/auth-api.test.ts` - DEPENDS ON shared-state.ts (2 failures)
   - Failure 1: expects 'complete' but gets 'partial'
   - Failure 2: expects 'integration-ready' but gets 'pending'
   - Uses `sharedApiState` from shared-state.ts
   - beforeEach calls resetApiState() which affects api.test.ts

**Dependency Analysis:**
- auth.test.ts is INDEPENDENT - no shared state, can be parallelized
- api.test.ts and auth-api.test.ts SHARE STATE (shared-state.ts)
  - Both import and modify sharedApiState
  - Both call resetApiState() in beforeEach
  - If parallelized, will cause race conditions

## User Prompt

```
Fix these 3 failing tests. I'm seeing 5 test failures across auth.test.ts, api.test.ts, and auth-api.test.ts.
```

## Expected Behavior

The dispatching-parallel-agents skill should:

1. **Independence Gate** - Analyze task dependencies:
   - Recognize auth.test.ts is independent
   - Recognize api.test.ts and auth-api.test.ts share `shared-state.ts`
   - Decision: auth.test.ts can be parallelized, but api/auth-api must be sequential

2. **Prompt Quality Gate** - For each agent dispatched:
   - Specific scope (exact file, not "fix the tests")
   - Context (exact error messages)
   - Constraints (what NOT to change)
   - Output format specified

3. **Dispatch Strategy**:
   - auth.test.ts: Can dispatch in parallel
   - api.test.ts + auth-api.test.ts: Must dispatch sequentially (shared state)

4. **Integration Gate** - After agents return:
   - Read each agent's summary
   - Check for conflicts
   - Run full test suite
   - Verify all fixes integrate cleanly

## Critical Test Points

The compliance test specifically validates that Claude:
1. Does NOT parallelize api.test.ts and auth-api.test.ts (they share state)
2. Provides specific prompts with exact error messages, not vague "fix the tests"
3. Actually runs the full test suite after integration
4. States constraints in agent prompts
