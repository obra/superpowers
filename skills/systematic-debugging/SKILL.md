---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

**Violating the letter of this process is violating the spirit of debugging.**

## Pre-flight: check known gotchas

Before Phase 1, read `<cwd>/.claude/wiki/gotchas.md` if it exists. Match the current symptom against known gotchas FIRST — if the bug is already documented, apply the recorded fix and skip a fresh investigation. Skip silently if the file doesn't exist.

After fixing a new (un-documented) gotcha, append it to that file so the next session benefits.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## The Four Phases

You MUST complete each phase before proceeding to the next. Read `references/phases.md` for full details on each phase.

**Phase 1: Root Cause Investigation** — Read errors, reproduce, check changes, gather evidence, trace data flow. In multi-component systems: add diagnostic instrumentation BEFORE proposing fixes.

**Phase 2: Pattern Analysis** — Find working examples, compare against references (read completely), identify every difference, understand dependencies.

**Phase 3: Hypothesis and Testing** — Form single hypothesis, test with smallest possible change, one variable at a time. Didn't work? New hypothesis — DON'T stack fixes.

**Phase 4: Implementation** — Create failing test (use sspower:test-driven-development), implement ONE fix at root cause, verify. If fix doesn't work after <3 attempts: return to Phase 1. **If ≥3 fixes failed: STOP — question the architecture, discuss with your human partner.**

## Red Flags — STOP and Return to Phase 1

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place**

**ALL mean: STOP. Return to Phase 1.**
**If 3+ fixes failed: Question the architecture.**

See `references/rationalizations.md` for full rationalization tables and human partner signals.

## Supporting Techniques

- **`root-cause-tracing.md`** - Trace bugs backward through call stack
- **`defense-in-depth.md`** - Add validation at multiple layers after finding root cause
- **`condition-based-waiting.md`** - Replace arbitrary timeouts with condition polling

**Related skills:**
- **sspower:test-driven-development** - For creating failing test case (Phase 4)
- **sspower:verification-before-completion** - Verify fix worked before claiming success
