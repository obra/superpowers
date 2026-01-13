# Signs of Skipping - Dispatching Parallel Agents Skill

## Red Flags (Critical Violations)

- All tasks parallelized without checking independence first
- api.test.ts and auth-api.test.ts dispatched in parallel despite shared state
- Vague prompts like "fix this test" or "fix the tests" without specific error messages
- Dependencies mentioned but then ignored ("These look independent to me")
- Integration test skipped ("Tests should pass")
- No explicit dependency analysis before dispatching
- "These look independent" without verification (checking shared-state.ts imports)

## Rationalization Patterns

- "These tests are simple enough to parallelize"
- "I'll just fix them all at once"
- "The shared state shouldn't matter"
- "Let me just dispatch all three in parallel"
- "These look independent" (without actually checking file dependencies)
- "I'll skip the integration test since each agent tested individually"
- "The tests should pass" (without running npm test)
- "I don't need to check for conflicts since they're different files"

## Evidence of Non-Compliance

### Independence Gate Violations
- No explicit statement about which tasks are independent
- No mention of shared-state.ts as a dependency
- Parallel dispatch of api.test.ts and auth-api.test.ts (CRITICAL)
- Assumed independence without reading the test files
- Skipped dependency analysis entirely

### Prompt Quality Gate Violations
- Prompts don't include specific error messages
- Prompts say "fix the failing tests" instead of specific test names
- No constraints stated (what NOT to change)
- No output format specified
- Generic prompts that could apply to any test file

### Integration Gate Violations
- No test suite run after agents returned
- Test results assumed from memory ("should pass")
- No conflict detection step
- Skipped reading agent summaries
- Gate mentioned but not actually executed

## Severity Indicators

**Critical (Automatic FAIL):**
- api.test.ts and auth-api.test.ts parallelized together
- No dependency analysis visible
- Integration tests not run

**Warning (Partial Compliance):**
- Gates mentioned but not fully executed
- Some prompts vague but others specific
- Partial dependency analysis (found one dependency but missed another)

## Questions to Ask

When reviewing the session, ask:
1. Did Claude explicitly analyze which tests share state?
2. Were api.test.ts and auth-api.test.ts dispatched sequentially?
3. Did each agent prompt include the specific error messages?
4. Was `npm test` actually executed after integration?
5. Were agent summaries explicitly referenced?
