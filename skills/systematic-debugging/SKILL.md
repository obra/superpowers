---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

Find the cause before changing the code.

1. **Investigate.** Read the whole error and stack trace. Reproduce the failure reliably, or gather more data instead of guessing. Check recent changes: commits, dependencies, config, environment. Trace the bad value back to its source.
2. **Analyze.** List every difference from similar working code in the same codebase. Read a reference implementation and its assumptions before copying it. In a multi-component system (CI → build → signing, API → service → database), log what enters and leaves each boundary to find the failing one.
3. **Hypothesize.** State one hypothesis: "X is the root cause because Y." Test it with the smallest change, one variable at a time. If it fails, return to step 1 with what you learned instead of stacking another fix. If you do not understand something, say so and ask.
4. **Implement.** Write the simplest failing reproduction with `toolbelt:test-driven-development`. Make one fix at the root cause, with no bundled refactoring. Confirm the test passes, nothing else broke, and the original symptom is gone.

After three failed fixes, stop and ask your human partner whether the design is sound. Fixes that expose shared state, need broad refactoring, or create new symptoms point to a design problem.

For an environmental, timing, or external cause, record what you ruled out, add handling (retry, timeout, a clear error), and add logging. If the evidence stays inconclusive, say what remains unknown.

After the fix, add validation only where bad input enters or before a destructive operation, not at every layer.

- [root-cause-tracing.md](root-cause-tracing.md): when an error surfaces deep in a call chain, or a test leaves files or state behind.
- [condition-based-waiting.md](condition-based-waiting.md): when a test is flaky or contains a fixed sleep.
