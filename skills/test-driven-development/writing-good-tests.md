# Writing Good Tests

**Load this reference when:** writing or changing tests, adding mocks, or
adding cleanup/helper methods for tests.

## Overview

Good tests verify real behavior. Mocks exist to isolate the code under
test — they are never the thing being tested.

**Core principle:** Test what the code does, not what the mocks do — and
make every test able to fail.

Strict TDD produces every rule below naturally: a test written first and
watched failing against real code has already proven it can fail, and
only earns a mock when the real dependency proves slow or external. A
test asserting on a mock means TDD was skipped somewhere.

## The Iron Laws

```
1. Every test can fail — name the production change that would fail it
2. Assert on real behavior, never on mock behavior
3. Production classes carry production methods only
4. Understand a dependency's side effects before mocking it
```

## Rule 1: Write Tests That Can Fail

Before writing or changing a test, name the production change that would
make it fail. If you cannot, redesign the test around an observable
behavior — a test that cannot fail protects nothing.

Derive expected values independently of the code under test: literals,
hand-checked fixtures, small worked examples, or invariant assertions.
Keep test logic simple enough to review by inspection — table-driven
tests with literal `want` values are the preferred shape.

```typescript
// ✅ GOOD: literal, hand-derived expectation
test('builds tag query', () => {
  expect(buildSearchQuery({ tag: 'urgent' })).toBe('tag:"urgent"');
});
```

```typescript
// ❌ The violation: expectation computed by the logic under test
test('builds tag query', () => {
  const expected = buildSearchQuery({ tag: 'urgent' });  // same builder!
  expect(buildSearchQuery({ tag: 'urgent' })).toBe(expected);  // always true
});

// ❌ Subtler: the expectation reuses the same helper the code calls
test('formats timestamp', () => {
  expect(render(entry)).toContain(formatTime(entry.ts));  // mirrors implementation
});
```

A mirror assertion re-derives the answer with the answer's own machinery:
it passes no matter what that machinery does.

**Falsifiable is necessary, not sufficient — name the break.** A test must
fail for the right reason: name the wrong branch, missing side effect,
wrong argument, boundary case, or contract violation it would catch. If
every change that could fail it is an intentional decision — a constant's
value, the exact wording of a message, private structure — you have
written a change detector, not a test: it fires on redesign and sleeps
through bugs. Test the behavior that depends on the decision instead.

**The string-presence trap.** For a script, skill, prompt, or config, a
test that asserts the source contains an exact line counterfeits this
rule: it can fail (delete the line), so it passes the letter of
falsifiability while asserting only that the source is the source. It
breaks on every legitimate rewording and survives every real regression.
The observable for a script is what it does — run it against controlled
inputs and assert outputs, side effects, or exit codes. The observable
for a document that instructs an agent is the consuming agent's behavior
— pressure-test it. Text containment is never the observable.

### Gate Function

```
BEFORE writing the test body:
  Ask: "What production change should make this test fail?"

  IF you cannot name one:
    STOP - Redesign the test around an observable behavior

  IF the only answer is "the source text changed":
    STOP - Run the artifact and assert its effects instead

  Ask: "What BREAK would this catch?"

  IF every failing change is an intentional decision, never a bug:
    STOP - That is a change detector; test the behavior that
    depends on the decision instead

  Ask: "Is the expected value derived independently of the code under test?"

  IF it reuses the code's own logic or helpers:
    STOP - Replace it with a literal or hand-checked fixture
```

## Rule 2: Assert on Real Behavior

```typescript
// ✅ GOOD: Test the real component
test('renders sidebar', () => {
  render(<Page />);  // Sidebar unmocked
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

If the sidebar must be mocked for isolation, assert on Page's behavior
with the sidebar present — the mock itself earns no assertions.

```typescript
// ❌ The violation: asserting that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

A mock assertion passes when the mock is present and fails when it is
absent — it says nothing about the component. **your human partner's
correction:** "Are we testing the behavior of a mock?"

### Gate Function

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real component behavior or just mock existence?"

  IF testing mock existence:
    STOP - Delete the assertion or unmock the component

  Test real behavior instead
```

## Rule 3: Keep Test Cleanup in Test Utilities

```typescript
// ✅ GOOD: Test utilities own test cleanup
// Session has no destroy() - it's stateless in production

// In test-utils/
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// In tests
afterEach(() => cleanupSession(session));
```

```typescript
// ❌ The violation: destroy() exists only for tests
class Session {
  async destroy() {  // Looks like production API!
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... cleanup
  }
}

// In tests
afterEach(() => session.destroy());
```

A test-only method pollutes the production class, is dangerous if
production code ever calls it, and confuses object lifecycle with entity
lifecycle.

### Gate Function

```
BEFORE adding any method to a production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP - Put it in test utilities instead

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP - Wrong class for this method
```

## Rule 4: Mock at the Right Level

Learn what the real method does — every side effect — before replacing
it. Mock the slow or external operation and preserve the behavior your
test depends on.

Make doubles specific to their contract: when arguments, call counts, or
ordering matter, assert them — a fake that accepts anything verifies
nothing. And give each branch its own double: success, error, and
malformed paths each get their own fixture or spy, so the wrong branch
cannot satisfy the expectation.

```typescript
// ✅ GOOD: Mock the slow part, preserve behavior the test needs
test('detects duplicate server', () => {
  vi.mock('MCPServerManager'); // Just mock slow server startup

  await addServer(config);  // Config written
  await addServer(config);  // Duplicate detected ✓
});
```

```typescript
// ❌ The violation: the mock swallows the side effect the test depends on
test('detects duplicate server', () => {
  // Mock prevents the config write that duplicate detection reads!
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // Should throw - but won't!
});
```

### Gate Function

```
BEFORE mocking any method:
  STOP - Understand before replacing

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF the test depends on side effects:
    Mock at the lower level (the actual slow/external operation)
    OR use test doubles that preserve the necessary behavior
    — keep the high-level method the test depends on real

  IF unsure what the test depends on:
    Run the test with the real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level

  Warning signs:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - Mocking before tracing the dependency chain
```

## Rule 5: Mirror Real Data Completely

Mock the COMPLETE data structure as it exists in reality, not just the
fields your immediate test uses.

```typescript
// ✅ GOOD: Mirror real API completeness
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // All fields real API returns
};
```

```typescript
// ❌ The violation: only the fields you thought you needed
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // Missing: metadata that downstream code uses
};

// Later: breaks when code accesses response.metadata.requestId
```

Partial mocks hide structural assumptions and fail silently when
downstream code reads an omitted field: the test passes while integration
breaks.

### Gate Function

```
BEFORE creating mock responses:
  Check: "What fields does the real API response contain?"

  Actions:
    1. Examine the actual API response from docs/examples
    2. Include ALL fields the system might consume downstream
    3. Verify the mock matches the real response schema completely

  If uncertain: include all documented fields
```

## Rule 6: Test Your Code, Not the Framework

Test the contract your code makes at its boundaries — the route you
register, the query you emit, the payload shape you produce, the value
handoff between layers. Dependencies' documented mechanics are their
maintainers' tests to write.

```typescript
// ✅ GOOD: your contract at the boundary
test('GET /sessions/:id returns 404 for unknown id', async () => {
  const res = await request(app).get('/sessions/nope');
  expect(res.status).toBe(404);
  expect(res.body.error).toMatch(/not found/);  // contract, not exact copy
});
```

```typescript
// ❌ The violation: re-proving the router works as documented
test('router calls handler for matching route', () => {
  const handler = vi.fn();
  router.get('/x', handler);
  router.handle(makeRequest('/x'));
  expect(handler).toHaveBeenCalled();
});
```

When upstream behavior genuinely surprised you (a quoting rule, an event
ordering), write one narrow characterization test around your integration
point and name the assumption in the test name or a comment.

The same boundary applies inside your own code: test behavior, not that
the implementation is written the way it is currently written. Plain
constructor assignment, getters, constants, trivial forwarding, and
data-only structs earn tests only when they validate, normalize, default,
derive, enforce, or cause side effects — otherwise assert the first
consumer-visible result that depends on them.

## Rule 7: Tests Ship With the Implementation

Testing is part of implementation. The TDD cycle — failing test, minimal
implementation, refactor — is what "complete" means; "implementation
complete, ready for testing" describes an unfinished task.

Ship the tests the behavior needs — and only those. A change that touches
only trivial code (Rule 6) earns no ceremonial test: a test written to
satisfy process protects nothing and costs maintenance forever.

## Rule 8: Prefer Real Components Over Complex Mocks

Integration tests with real components are often simpler than elaborate
mocks. Reach for one when you see:

- Mock setup longer than the test logic
- Mocking everything to make the test pass
- Mocks missing methods the real components have
- Tests breaking when the mock changes

**your human partner's question:** "Do we need to be using a mock here?"

## The Mutation Check

Before finishing, mentally mutate the production code. At least one test
should fail for each realistic mutation:

- Wrong constant or argument
- Wrong branch handler
- Missing state change or side effect (row not written, event not emitted)
- Empty or default return
- Missing validation for zero, empty, nil, unauthorized, or malformed input

A mutation no test can catch marks the behavior as unprotected — or the
test as tautological.

## Quick Reference

| When you... | Do |
|-------------|-----|
| Write any test | Name the production change that would make it fail |
| Build an expected value | Derive it independently — literal or hand-checked fixture |
| Want to assert on a mocked element | Test the real component, or unmock it |
| Need cleanup that only tests use | Put it in test utilities |
| Are about to mock a method | Learn its side effects first; mock the slow/external level |
| Build a mock response | Mirror the real structure completely |
| Reach for a dependency test | Test your boundary contract, not their documented mechanics |
| Finish an implementation | Tests already exist (TDD) — or it is unfinished |
| Finish a test file | Run the mutation check |
| Watch mock setup balloon | Switch to an integration test with real components |

## Warning Signs

- An assertion checks for a `*-mock` test ID
- A method is called only from test files
- Mock setup is more than half the test
- The test fails when you remove the mock
- You can't explain why the mock is needed
- Mocking "just to be safe"
- Setup and assertion share the same object, guaranteeing equality
- The test can fail only through a panic, crash, or missing selector
- The test would still matter if only the framework remained
- Expected values are hidden behind loops, builders, or helpers
- The test greps source text instead of observing behavior
- The test asserts that a removed function, file, or symbol stays removed
- The test exists for coverage, checking no side effect, boundary, or outcome
- The test fails on every intentional change and never on accidental breakage
