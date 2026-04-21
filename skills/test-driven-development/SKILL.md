---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development (TDD)

Write the test first. Watch it fail. Write minimal code to pass.

If you didn't watch the test fail, you don't know if it tests the right thing.

## Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Code written before its test? Delete it. Implement fresh from tests. Don't keep it as "reference" — you'll adapt it, and that's tests-after wearing a disguise.

## When to Use

**Default:** new features, bug fixes, refactors, behavior changes.

**Exceptions (document in commit):**
- Trivial tier — typo, copy, one-line fix, config value, comment (see `using-superpowers` § Risk Tiers)
- Throwaway prototypes — commit message: "prototype, TDD waived"
- Generated code — cite generator
- Config files with no runtime behavior
- Refactors covered by existing tests — name them in the commit

Silent skips are violations. Documented skips in the allowed categories are fine.

## Red-Green-Refactor

1. **RED** — write one failing test for the target behavior. One thing. Clear name. Prefer real code over mocks.
2. **Verify RED** — run it. Must fail, and fail for the right reason (feature missing, not typo). If it errors or passes, fix the test first.
3. **GREEN** — minimal code to pass. No extra features, options, or adjacent cleanup.
4. **Verify GREEN** — run. Target test passes, other tests still pass, output pristine.
5. **REFACTOR** — dedupe, rename, extract. Keep tests green. Don't add behavior.
6. **Next test.**

### Quick example (bug fix)

```typescript
// RED
test('rejects empty email', async () => {
  const r = await submitForm({ email: '' });
  expect(r.error).toBe('Email required');
});
// → run, see fail.
// GREEN
function submitForm(data) {
  if (!data.email?.trim()) return { error: 'Email required' };
  // ...
}
// → run, see pass.
```

## Good Tests

- **Minimal:** one behavior. "and" in the name → split.
- **Clear name:** describes behavior, not implementation.
- **Tests real code:** mocks only when unavoidable. Mock-heavy tests verify the mock, not the code.

## When Stuck

| Problem | Likely cause |
|---------|--------------|
| Don't know how to test | Write the wished-for API from the test's point of view first |
| Test too complicated | Design too complicated — simplify the interface |
| Must mock everything | Coupling too tight — inject dependencies |
| Test setup huge | Extract helpers, then question the design |

## Debugging Integration

Bug → reproduce with a failing test → TDD cycle → fix. Never fix without a test.

## Testing Anti-Patterns

See `@testing-anti-patterns.md` for the common traps (testing mock behavior, test-only hooks in production, mocking without understanding deps).

## Final Rule

Production code → test exists and failed first. Otherwise it's not TDD.
