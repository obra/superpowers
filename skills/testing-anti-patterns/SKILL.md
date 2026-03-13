---
name: testing-anti-patterns
description: Use when writing tests, mocks, or reviewing test code - identifies patterns that cause tests to pass while hiding real bugs
---

# Testing Anti-Patterns

## Overview

Tests that pass while hiding bugs are worse than no tests. They give false confidence and let bugs reach production.

**Core principle:** Tests must be capable of failing. If a test can't fail, it proves nothing.

## Anti-Pattern 1: Testing Mocks Instead of Logic

**The violation:**
```typescript
// Mock always returns what the test expects
const mock = { getData: vi.fn().mockResolvedValue({ result: "success" }) };
// Test passes but tests nothing real
expect(await processData(mock)).toBe("success");
```

**The fix:** Test observable behavior and side effects, not mock return values.

---

## Anti-Pattern 2: Asserting Without Acting

**The violation:**
```typescript
// Action is commented out or missing
// await sendEmail(user);
expect(emailSent).toBe(true);  // Always false, always fails, or just never runs
```

**The fix:** Ensure every assertion has a corresponding action that could produce the expected result.

---

## Anti-Pattern 3: Over-Mocking Dependencies

**The violation:**
```typescript
// Mocking the thing being tested
vi.mock('./myModule', () => ({ myFunction: vi.fn().mockReturnValue(42) }));
// Now testing that the mock returns 42
expect(myFunction()).toBe(42);
```

**The fix:** Only mock external dependencies (network, database, filesystem). Test real logic.

---

## Anti-Pattern 4: Mocking Without Understanding

**The violation:**
```typescript
// Added mock because test was failing, without understanding why
vi.mock('./validator', () => ({ validate: vi.fn().mockReturnValue(true) }));
// Test passes, but real validation bug is hidden
```

**The fix:** Understand why a mock is needed before adding it. If mocking makes a test pass, verify the test actually validates real behavior.

---

## Anti-Pattern 5: Missing Negative Tests

**The violation:**
```typescript
// Only tests happy path
it('validates email', () => {
  expect(validateEmail('user@example.com')).toBe(true);
});
// Never tests invalid emails
```

**The fix:** For every validation or guard, test both passing and failing cases.

---

## Anti-Pattern 6: Mocks Derived from Implementation

**The violation:**
```typescript
// Interface defines close()
interface PlatformAdapter {
  close(): Promise<void>;
}

// Code (BUGGY) calls cleanup()
await adapter.cleanup();

// Mock (MATCHES BUG) defines cleanup()
const mock = {
  cleanup: vi.fn().mockResolvedValue(undefined)  // Wrong!
};
```

Tests pass. Runtime crashes: "adapter.cleanup is not a function."

**Why this happens:**
- Developer looks at buggy code to write mock
- Mock encodes the bug
- TypeScript can't catch inline mocks with wrong method names
- Tests pass because both code and mock are wrong

**The fix:**
```typescript
// ✅ GOOD: Derive mock from interface, not implementation

// Step 1: Open interface definition (PlatformAdapter)
// Step 2: List methods defined there (close, initialize, etc.)
// Step 3: Mock EXACTLY those methods

const mock = {
  initialize: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),  // From interface!
};

// Now test FAILS because code calls cleanup() which doesn't exist
// That failure reveals the bug BEFORE runtime
```

### Gate Function

```
BEFORE writing any mock:

  1. STOP - Do NOT look at the code under test yet
  2. FIND: The interface/type definition for the dependency
  3. READ: The interface file
  4. LIST: Methods defined in the interface
  5. MOCK: ONLY those methods with EXACTLY those names
  6. DO NOT: Look at what your code calls

  IF your test fails because code calls something not in mock:
    ✅ GOOD - The test found a bug in your code
    Fix the code to call the correct interface method
    NOT the mock

  Red flags:
    - "I'll mock what the code calls"
    - Copying method names from implementation
    - Mock written without reading interface
    - "The test is failing so I'll add this method to the mock"
```

### Detection

When you see runtime error "X is not a function" and tests pass:
1. Check if X is mocked
2. Compare mock methods to interface methods
3. Look for method name mismatches

---

## Summary Table

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| Testing mocks | Tests always pass | Test real behavior |
| Asserting without acting | Assertions disconnected from actions | Ensure action → assertion chain |
| Over-mocking | Testing mock return values | Only mock external deps |
| Mocking without understanding | Added mock to make test pass | Understand why before mocking |
| Missing negative tests | Only happy path covered | Test both pass and fail cases |
| Mocks from implementation | Runtime crashes despite passing tests | Derive mocks from interface |

## The Bottom Line

**Write tests that can fail.** A passing test that couldn't fail proved nothing. A failing test that reveals a real bug is doing its job.
