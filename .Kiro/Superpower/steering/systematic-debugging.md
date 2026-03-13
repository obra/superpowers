---
name: systematic-debugging
description: Use when facing bugs, errors, or unexpected behavior that needs investigation
inclusion: always
---

# Systematic Debugging

## Overview

4-phase systematic approach to debugging: Reproduce, Isolate, Understand, Fix. No guessing, no random changes.

**Core principle:** Systematic investigation beats random fixes every time.

## When to Use

- Bug reports from users
- Test failures
- Unexpected behavior
- Performance issues
- Integration problems

## The 4-Phase Process

### Phase 1: Reproduce

**Goal:** Create reliable way to trigger the bug

**Steps:**
1. Gather exact conditions when bug occurs
2. Create minimal reproduction case
3. Document steps to reproduce
4. Verify reproduction is consistent

**Success criteria:** Can trigger bug on demand

### Phase 2: Isolate

**Goal:** Narrow down where the problem occurs

**Techniques:**
- Binary search through code paths
- Add logging/debugging statements
- Remove components one by one
- Test with minimal inputs

**Success criteria:** Know which component/function contains the bug

### Phase 3: Understand

**Goal:** Understand why the bug happens

**Questions to answer:**
- What is the code supposed to do?
- What is it actually doing?
- What assumptions are being violated?
- What edge case is being missed?

**Success criteria:** Can explain the root cause

### Phase 4: Fix

**Goal:** Fix the root cause, not just symptoms

**Steps:**
1. Write failing test that reproduces the bug
2. Fix the root cause (not symptoms)
3. Verify test now passes
4. Run full test suite
5. Consider if similar bugs exist elsewhere

**Success criteria:** Bug is fixed and won't regress

## Root Cause Tracing

When bugs are complex, use systematic root cause analysis:

1. **State the problem clearly** - What should happen vs what does happen
2. **Gather evidence** - Logs, stack traces, reproduction steps
3. **Form hypotheses** - What could cause this behavior?
4. **Test hypotheses** - Design experiments to prove/disprove
5. **Follow the evidence** - Let data guide you, not assumptions

## Defense in Depth

After fixing, add multiple layers of protection:

1. **Input validation** - Prevent bad data from entering
2. **Assertions** - Catch violations of assumptions
3. **Error handling** - Graceful degradation when things go wrong
4. **Monitoring** - Detect problems in production
5. **Tests** - Prevent regressions

## Common Anti-Patterns

**Don't do these:**
- Random code changes hoping something works
- Fixing symptoms instead of root cause
- Adding try/catch without understanding the error
- Assuming the bug is in someone else's code
- Skipping the reproduction step
- Not writing a test for the bug

## Condition-Based Waiting

For async/timing issues, use systematic waiting:

```typescript
async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}
```

## Verification Before Completion

Before declaring a bug fixed:

1. **Original reproduction case passes**
2. **All existing tests still pass**
3. **New test prevents regression**
4. **Similar code paths checked for same issue**
5. **Edge cases considered and tested**

## Integration

**Use with other skills:**
- **test-driven-development** - Write failing test for bug before fixing
- **verification-before-completion** - Ensure fix actually works
- **requesting-code-review** - Get second pair of eyes on fix