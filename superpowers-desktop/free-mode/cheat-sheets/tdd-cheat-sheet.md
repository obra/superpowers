# TDD Cheat Sheet

## The Iron Law
**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**

## RED-GREEN-REFACTOR

```
RED          → Verify RED → GREEN           → Verify GREEN → REFACTOR
Write test     Watch fail   Write min code    Watch pass     Clean up
```

## The Cycle

1. **RED**: Write one minimal test (1 behavior, clear name, real code)
2. **Verify RED**: Run test, confirm it fails correctly **(MANDATORY)**
3. **GREEN**: Write simplest code to pass (no extras, no YAGNI)
4. **Verify GREEN**: Run test, confirm it passes **(MANDATORY)**
5. **REFACTOR**: Remove duplication, improve names, stay green
6. **Repeat**: Next test for next feature

## Red Flags = DELETE CODE

- ❌ Code before test
- ❌ Test passes immediately
- ❌ "I'll test after"
- ❌ "Already manually tested"
- ❌ "Keep as reference"
- ❌ "Too simple to test"

**All mean: Delete code. Start over with TDD.**

## Good Test

```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

✅ Clear name
✅ One behavior
✅ Real code

## Completion Checklist

- [ ] Every function has a test
- [ ] Watched each test fail first
- [ ] Failed for expected reason
- [ ] Wrote minimal code to pass
- [ ] All tests pass
- [ ] No errors/warnings
- [ ] Edge cases covered

## Remember

> "Tests written after code pass immediately.
> Passing immediately proves nothing."
