# Writing Good Tests

**Load this reference when:** writing or changing tests, adding mocks, or
adding cleanup/helper methods for tests.

## Overview

Good tests verify real behavior. Mocks exist to isolate the code under
test — they are never the thing being tested.

**Core principle:** Test what the code does, not what the mocks do.

Strict TDD produces every rule below naturally: a test written first and
watched failing against real code only earns a mock when the real
dependency proves slow or external. A test asserting on a mock means TDD
was skipped somewhere.

## The Iron Laws

```
1. Assert on real behavior, never on mock behavior
2. Production classes carry production methods only
3. Understand a dependency's side effects before mocking it
```

## Rule 1: Assert on Real Behavior

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

## Rule 2: Keep Test Cleanup in Test Utilities

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

## Rule 3: Mock at the Right Level

Learn what the real method does — every side effect — before replacing
it. Mock the slow or external operation and preserve the behavior your
test depends on.

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

## Rule 4: Mirror Real Data Completely

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

## Rule 5: Tests Ship With the Implementation

Testing is part of implementation. The TDD cycle — failing test, minimal
implementation, refactor — is what "complete" means; "implementation
complete, ready for testing" describes an unfinished task.

## Rule 6: Prefer Real Components Over Complex Mocks

Integration tests with real components are often simpler than elaborate
mocks. Reach for one when you see:

- Mock setup longer than the test logic
- Mocking everything to make the test pass
- Mocks missing methods the real components have
- Tests breaking when the mock changes

**your human partner's question:** "Do we need to be using a mock here?"

## Quick Reference

| When you... | Do |
|-------------|-----|
| Want to assert on a mocked element | Test the real component, or unmock it |
| Need cleanup that only tests use | Put it in test utilities |
| Are about to mock a method | Learn its side effects first; mock the slow/external level |
| Build a mock response | Mirror the real structure completely |
| Finish an implementation | Tests already exist (TDD) — or it is unfinished |
| Watch mock setup balloon | Switch to an integration test with real components |

## Warning Signs

- An assertion checks for a `*-mock` test ID
- A method is called only from test files
- Mock setup is more than half the test
- The test fails when you remove the mock
- You can't explain why the mock is needed
- Mocking "just to be safe"
