---
name: test-driven-development
description: Use when writing new features, fixing bugs, refactoring, or making any behavior changes - enforces RED-GREEN-REFACTOR cycle where tests must be written and seen to fail before any production code
---

# Test-Driven Development (TDD)

> **This skill mirrors the `/test-driven-development` workflow.**

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## The Iron Law

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

## Red-Green-Refactor Cycle

1. **RED** — Write one minimal failing test. Tests one behavior, clear name, real code.
2. **Verify RED** — Run it. Confirm it fails for the expected reason (not typos).
3. **GREEN** — Write the simplest code to make it pass. YAGNI.
4. **Verify GREEN** — Run it. All tests pass, clean output.
5. **REFACTOR** — Remove duplication, improve names. Keep tests green.
6. **Repeat** — Next failing test for next feature.

## When to Use

**Always:** New features, bug fixes, refactoring, behavior changes.
**Exceptions (ask user):** Throwaway prototypes, generated code, config files.

## Verification Checklist

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass with clean output
- [ ] Edge cases and errors covered

## Common Rationalizations

| Excuse                    | Reality                                    |
| ------------------------- | ------------------------------------------ |
| "Too simple to test"      | Simple code breaks. Test takes 30 seconds. |
| "I'll test after"         | Tests passing immediately prove nothing.   |
| "TDD will slow me down"   | TDD is faster than debugging.              |
| "Already manually tested" | Ad-hoc ≠ systematic.                       |

## Red Flags — STOP and Start Over

Code before test, test passes immediately, rationalizing "just this once" → Delete code, start over with TDD.
