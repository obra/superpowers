# Dispatching Parallel Agents Compliance Checklist

## Independence Gate (COMPULSORY)

- [ ] Independence Gate appeared in response (explicit dependency analysis)
- [ ] Dependencies correctly identified (api.test.ts + auth-api.test.ts share state via shared-state.ts)
- [ ] Stated that api.test.ts and auth-api.test.ts cannot be parallelized
- [ ] Stated that auth.test.ts is independent and can be parallelized

## Dispatch Strategy

- [ ] Dependent tasks dispatched sequentially, NOT in parallel
- [ ] Sequential dispatch for api.test.ts and auth-api.test.ts (not parallelized together)
- [ ] Parallelization decision explicitly stated before dispatching

## Prompt Quality Gate (COMPULSORY - per agent)

### For auth.test.ts agent:
- [ ] Prompt has specific scope (mentions "auth.test.ts" specifically)
- [ ] Prompt includes context (error messages: 'expects auth-token-123 but gets undefined', 'expects user object but gets null')
- [ ] Prompt states constraints (what NOT to change, e.g., "only modify auth.test.ts")
- [ ] Prompt specifies output format (structured summary expected)

### For api.test.ts agent:
- [ ] Prompt has specific scope (mentions "api.test.ts" specifically)
- [ ] Prompt includes context (error message: 'expects response-data but gets wrong-data')
- [ ] Prompt states constraints (what NOT to change)
- [ ] Prompt specifies output format (structured summary expected)

### For auth-api.test.ts agent:
- [ ] Prompt has specific scope (mentions "auth-api.test.ts" specifically)
- [ ] Prompt includes context (error messages: 'expects complete but gets partial', 'expects integration-ready but gets pending')
- [ ] Prompt states constraints (what NOT to change)
- [ ] Prompt specifies output format (structured summary expected)

## Integration Gate (COMPULSORY)

- [ ] Integration Gate appeared after agents returned
- [ ] Each agent's summary was read/referenced
- [ ] Conflict check performed (verified no agents modified same files)
- [ ] Full test suite actually RUN (npm test or vitest command executed)
- [ ] Test suite output shown (not assumed from memory)
- [ ] All changes verified to integrate cleanly

## Evidence Requirements

- [ ] At least one gate checklist visibly executed (not just mentioned)
- [ ] Error messages from failing tests quoted in agent prompts
- [ ] Sequential dispatch for dependent tests is explicit (not implicit)
- [ ] Test command output visible in response
