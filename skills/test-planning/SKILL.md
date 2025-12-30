---
name: test-planning
description: Use when planning what to test and at what granularity, before writing tests
---

# Test Planning

## Overview

Decide what to test and how before writing tests. TDD tells you HOW to write tests. This skill tells you WHAT to test and at what granularity.

## The Testing Pyramid

```
       /\
      /E2E\        Few, slow, high confidence
     /------\
    / Integr \     Some, medium speed
   /----------\
  /    Unit    \   Many, fast, focused
```

### Unit Tests
- **What:** Single function/method in isolation
- **When:** Pure logic, calculations, transformations
- **Mock:** External dependencies only (APIs, databases)
- **Example:** Validation logic, formatters, calculators

### Integration Tests
- **What:** Multiple components working together
- **When:** Component boundaries, data flow, API contracts
- **Mock:** External services only (not internal components)
- **Example:** API routes with database, component with state management

### E2E Tests
- **What:** Full user journey through the system
- **When:** Critical user paths, regression prevention
- **Mock:** Nothing (or only truly external services)
- **Example:** Login flow, checkout process, signup journey

## Granularity Decision Tree

```
Is this testing a single function's logic?
├─ YES → Unit test
└─ NO
   ├─ Is this testing how components interact?
   │  ├─ YES → Integration test
   │  └─ NO
   │     └─ Is this testing a user-visible workflow?
   │        ├─ YES → E2E test
   │        └─ NO → Reconsider what you're testing
```

## What to Test

**Always test:**
- Public APIs and interfaces
- Edge cases and error conditions
- User-facing behavior
- Critical business logic

**Don't test:**
- Private implementation details
- Framework/library code
- Trivial getters/setters
- Third-party service internals

## Test Review

After writing tests, invoke the `test-reviewer` subagent for independent review.

The test-reviewer catches "cheat tests" that pass but don't verify behavior:
- Implementation mirroring
- Over-mocking
- Tautological assertions

**When to invoke:**
- After completing a TDD cycle
- Before merging test changes
- When reviewing existing test suite

## Integration with TDD

This skill (test-planning) + TDD skill work together:

1. **test-planning** → Decide WHAT to test, at what granularity
2. **test-driven-development** → Write tests RED-GREEN-REFACTOR
3. **test-reviewer** (subagent) → Review tests for quality

## Quick Reference

| Question | Answer |
|----------|--------|
| What level? | Use decision tree above |
| What to mock? | External dependencies only |
| What to assert? | Behavior, not implementation |
| When done? | Invoke test-reviewer |
