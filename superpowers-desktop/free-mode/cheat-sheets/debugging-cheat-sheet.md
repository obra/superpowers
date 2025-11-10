# Systematic Debugging Cheat Sheet

## The Iron Law
**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

## 4-Phase Process

```
Phase 1         → Phase 2        → Phase 3       → Phase 4
Root Cause        Pattern          Hypothesis      Implementation
Investigate       Analyze          Test            Fix
```

## Phase 1: Root Cause

1. **Read errors** - Complete stack traces, line numbers
2. **Reproduce** - Reliable steps to trigger
3. **Check changes** - Git diff, recent commits
4. **Gather evidence** - Log at each boundary (multi-component)
5. **Trace data** - Where does bad value originate? Fix source.

## Phase 2: Pattern

1. **Find working** - Similar code that works
2. **Compare** - Read reference completely, don't skim
3. **Differences** - List every difference
4. **Dependencies** - What does it need?

## Phase 3: Hypothesis

1. **Form hypothesis** - "I think X because Y" (write it down)
2. **Test minimally** - Smallest change, one variable
3. **Verify** - Worked? Phase 4. Didn't? New hypothesis.

## Phase 4: Fix

1. **Failing test** - Create reproduction (use TDD)
2. **Single fix** - Address root cause only
3. **Verify** - Test passes, nothing else breaks
4. **If 3+ fixes failed** - STOP. Question architecture.

## Red Flags = STOP, PHASE 1

- ❌ "Quick fix for now"
- ❌ "Just try X"
- ❌ "Multiple changes"
- ❌ "Skip the test"
- ❌ "It's probably X"
- ❌ "One more fix" (after 2+)

**All mean: Return to Phase 1.**

## Common Mistakes

| Mistake | Reality |
|---------|---------|
| "Simple issue" | Process is fast |
| "No time" | Systematic > thrashing |
| "Just try first" | Sets bad pattern |
| "Test after" | Untested fixes don't stick |

## Example Flow

```
1. Read error: "Cannot read property 'x' of undefined"
2. Trace: data → transform → render (breaks in render)
3. Find: transform returns null when empty
4. Hypothesis: "Missing null check in transform"
5. Test: Write failing test for empty input
6. Fix: Add null check in transform
7. Verify: Test passes, bug resolved
```

## Remember

> "Symptom fixes waste time and create new bugs.
> Always find root cause first."
