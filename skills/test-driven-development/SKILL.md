---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

<requirements>
## Requirements

1. Write test BEFORE implementation. Implementation without failing test = not TDD.
2. Run tests after each change. Untested changes may introduce regressions.
3. Refactor only when tests pass. Refactoring with failing tests risks masking bugs.
</requirements>

## When to Use

**Always:** New features, bug fixes, refactoring, behavior changes.

**Exceptions (ask your human partner):** Throwaway prototypes, generated code, configuration files.

## Priority: TDD vs Systematic Debugging

**Use TDD when root cause is KNOWN:**
- User provides clear reproduction steps
- Error message points to specific code
- "X causes Y" relationship is established

**Use Systematic Debugging when root cause is UNKNOWN:**
- "It just broke" with no clear trigger
- Intermittent or non-reproducible
- Multiple potential causes

**After Systematic Debugging establishes root cause:** Return to TDD for the fix.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. Don't keep it as "reference" - delete means delete.

<verification>
## Phase Gate Verification

**RED Phase Gate** (before writing ANY production code):
- [ ] Test exists and has been RUN
- [ ] Test FAILED (not errored)
- [ ] Failure message is expected (feature missing, not typo)
- [ ] No production code exists yet

**STOP CONDITION:** If ANY checkbox unchecked, do NOT write production code. Complete RED phase first.

**GREEN Phase Gate** (before refactoring):
- [ ] Test PASSES
- [ ] Minimal code written (just enough to pass)
- [ ] No additional features added
- [ ] All other tests still pass

**STOP CONDITION:** If test doesn't pass or extra features added, fix before proceeding.

**REFACTOR Phase Gate** (before next cycle):
- [ ] All tests still pass after refactoring
- [ ] No behavior changes introduced
- [ ] Code cleaner than before

**STOP CONDITION:** If tests fail after refactoring, undo refactoring, restore green state.
</verification>

## Circular Validation Anti-Pattern

Tests written AFTER implementation lead to:
- Tests that validate buggy behavior rather than correct behavior
- Tests that mirror implementation instead of testing intent
- False confidence in code that passes "tests" but is wrong

**Prevention:** Test must exist and FAIL before any implementation. If you wrote code first, delete it.

## Red-Green-Refactor

### RED - Write Failing Test

Write one minimal test showing what should happen.

<Good>
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
Clear name, tests real behavior, one thing
</Good>

<Bad>
```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```
Vague name, tests mock not code
</Bad>

**Requirements:** One behavior, clear name, real code (no mocks unless unavoidable).

### Verify RED - Watch It Fail

Run the test and confirm:
- Test fails (not errors)
- Failure message is expected
- Fails because feature missing (not typos)

**Test passes?** You're testing existing behavior. Fix test.
**Test errors?** Fix error, re-run until it fails correctly.

### GREEN - Minimal Code

Write simplest code to pass the test.

<Good>
```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}
```
Just enough to pass
</Good>

<Bad>
```typescript
async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  // YAGNI
}
```
Over-engineered
</Bad>

Don't add features, refactor other code, or "improve" beyond the test.

### Verify GREEN - Watch It Pass

Run test and confirm:
- Test passes
- Other tests still pass
- Output pristine (no errors, warnings)

**Test fails?** Fix code, not test.
**Other tests fail?** Fix now.

### REFACTOR - Clean Up

After green only: Remove duplication, improve names, extract helpers.

Keep tests green. Don't add behavior.

### Repeat

Next failing test for next feature.

## Good Tests

| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One thing. "and" in name? Split it. | `test('validates email and domain and whitespace')` |
| **Clear** | Name describes behavior | `test('test1')` |
| **Shows intent** | Demonstrates desired API | Obscures what code should do |

## Why Order Matters

**"I'll write tests after"** - Tests passing immediately prove nothing. You never saw the test catch the bug.

**"Already manually tested"** - Manual testing is ad-hoc: no record, can't re-run, easy to forget cases.

**"Deleting X hours is wasteful"** - Sunk cost fallacy. Keeping code you can't trust is technical debt.

**"TDD is dogmatic"** - TDD is pragmatic: finds bugs before commit, prevents regressions, documents behavior, enables refactoring.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "Test hard = design unclear" | Listen to test. Hard to test = hard to use. |
| "TDD will slow me down" | TDD faster than debugging. |

## Red Flags

| Violation | Recovery |
|-----------|----------|
| Code before test | Delete code, write test first |
| Test passes immediately | Fix test to actually test new code |
| "Just this once" | No exceptions, follow TDD |
| "Keep as reference" | Delete completely, no peeking |
| "This is different" | It's not different, follow the process |

**All of these mean: Delete code. Start over with TDD.**

## Example: Bug Fix

**Bug:** Empty email accepted

**RED**
```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

**Verify RED** - Test fails: `expected 'Email required', got undefined`

**GREEN**
```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  // ...
}
```

**Verify GREEN** - Test passes.

**REFACTOR** - Extract validation for multiple fields if needed.

<verification>
## Verification Checklist

Before marking work complete:

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Output pristine (no errors, warnings)
- [ ] Tests use real code (mocks only if unavoidable)
- [ ] Edge cases and errors covered

Can't check all boxes? You skipped TDD. Start over.
</verification>

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write wished-for API. Ask your human partner. |
| Test too complicated | Design too complicated. Simplify interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify design. |

## Debugging Integration

Bug found? Write failing test reproducing it. Follow TDD cycle. Test proves fix and prevents regression.

## Testing Anti-Patterns

When adding mocks or test utilities, read @testing-anti-patterns.md to avoid common pitfalls.

<requirements>
## Requirements (reminder)

1. Write test BEFORE implementation.
2. Run tests after each change.
3. Refactor only when tests pass.
</requirements>

## Final Rule

```
Production code → test exists and failed first
Otherwise → not TDD
```

No exceptions without your human partner's permission.
