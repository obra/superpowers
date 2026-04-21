---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

Find root cause before fixing. Symptom fixes fail.

## Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST (when Phase 1 is required)
```

## When Phase 1 Is Required

- Bug reached main / CI / staging / prod
- At least one fix already attempted and failed
- Debugging the same issue for more than ~15 min
- Failure spans multiple components/layers
- Risk tier = critical (see `using-superpowers` § Risk Tiers)
- Touches a Non-Negotiable (auth, RLS, secrets, data migration, destructive ops, CI/CD) — treat as critical regardless of surface signals

## When Phase 1 May Be Skipped (note in commit)

- Clear typo/syntax error, compiler/linter points at the exact line
- Fresh code, immediate repro, cause obvious on first read
- Failing test with a single unambiguous line-level cause

Phases 2-4 still apply once a fix is proposed, even if Phase 1 was skipped.

## The Four Phases

### 1. Root Cause Investigation

- Read error messages, stack traces, exit codes completely.
- Reproduce consistently. If you can't, gather more data; don't guess.
- Check recent changes (git diff, new deps, config changes, env deltas).
- **Multi-component systems** — instrument each boundary (what enters / what exits / config propagation / state at each layer) and run once to reveal where it breaks before proposing a fix.
- **Trace data flow backward** from the bad value to its source. Fix at source, not at symptom. See `root-cause-tracing.md`.

### 2. Pattern Analysis

- Find similar working code in the same codebase.
- If implementing a known pattern, read the reference completely — no skim.
- List every difference between working and broken, including ones that "can't matter."

### 3. Hypothesis & Test

- Single hypothesis, stated clearly: "X is the root cause because Y."
- Smallest possible change to test it. One variable at a time.
- Didn't work → new hypothesis. Don't stack fixes.
- If you don't understand something, say so — don't pretend.

### 4. Fix

- Failing test reproducing the bug first (use `superpowers:test-driven-development`).
- One change. No bundled improvements.
- Verify: target test passes, other tests pass, symptom gone.
- **3+ failed fix attempts** → stop. This is an architectural problem, not a failed hypothesis. Discuss with the user before attempt #4. Signals: each fix reveals a new coupling elsewhere, fixes require "massive refactoring," fixes create new symptoms.

## Stop signals from the user

Phrases that mean you're off track — return to Phase 1:
- "Is that not happening?" → you assumed without verifying
- "Will it show us…?" → you should have added instrumentation
- "Stop guessing" → you're proposing before understanding
- "Ultrathink this" → question fundamentals, not symptoms

## Environmental / external bugs

If investigation genuinely reveals environmental / timing / external cause, document what you checked, implement appropriate handling (retry, timeout, clear error), add monitoring. 95% of "no root cause" cases are incomplete investigation though.

## Supporting techniques (same directory)

- `root-cause-tracing.md` — backward tracing through the call stack
- `defense-in-depth.md` — multi-layer validation after root cause found
- `condition-based-waiting.md` — replace arbitrary timeouts with condition polling

## Related

- `superpowers:test-driven-development` — failing test for Phase 4
- `superpowers:verification-before-completion` — verify fix worked
