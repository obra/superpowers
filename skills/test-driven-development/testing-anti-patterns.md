# Testing Anti-Patterns

**Load this reference when:** writing or changing tests, adding mocks, or tempted to add test-only methods to production code.

## Overview

Tests must verify real behavior, not mock behavior. Mocks are a means to isolate, not the thing being tested.

**Core principle:** Test what the code does, not what the mocks do.

**Following strict TDD prevents these anti-patterns.**

## The Iron Laws

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## Anti-Pattern 1: Testing Mock Behavior

**The violation:**
```ruby
# ❌ BAD: Testing that the stub was called, not what happened
test "sidebar renders" do
  sidebar = stub(render: "<nav>stub</nav>")
  page = Page.new(sidebar: sidebar)
  page.render
  assert sidebar.received_render  # testing the stub, not the page
end
```

**Why this is wrong:**
- You're verifying the stub works, not that the page works
- Test passes when stub is present, fails when it's not
- Tells you nothing about real behavior

**your human partner's correction:** "Are we testing the behavior of a mock?"

**The fix:**
```ruby
# ✅ GOOD: Test real controller response or don't stub it
test "shows navigation" do
  get dashboard_url
  assert_dom "nav", text: /Dashboard/  # test real output
end

# OR if collaborator must be isolated:
# Don't assert on the stub — test the subject's observable behavior
```

### Gate Function

```
BEFORE asserting on any mock element:
  Ask: "Am I testing real component behavior or just mock existence?"

  IF testing mock existence:
    STOP - Delete the assertion or unmock the component

  Test real behavior instead
```

## Anti-Pattern 2: Test-Only Methods in Production

**The violation:**
```ruby
# ❌ BAD: reset_state only called in tests
class Session
  def reset_state  # Looks like production API!
    @workspace = nil
    @events.clear
  end
end

# In tests
teardown { @session.reset_state }
```

**Why this is wrong:**
- Production class polluted with test-only code
- Dangerous if accidentally called in production
- Violates YAGNI and separation of concerns
- Confuses object lifecycle with entity lifecycle

**The fix:**
```ruby
# ✅ GOOD: Use teardown helpers or fixtures, not production methods
# Session has no reset_state — each test gets a fresh instance

# In test helper
def new_session
  Session.new(workspace: workspaces(:default))
end

# In tests
setup { @session = new_session }
# No teardown needed — fixtures wrap each test in a rolled-back transaction
```

### Gate Function

```
BEFORE adding any method to production class:
  Ask: "Is this only used by tests?"

  IF yes:
    STOP - Don't add it
    Put it in test utilities instead

  Ask: "Does this class own this resource's lifecycle?"

  IF no:
    STOP - Wrong class for this method
```

## Anti-Pattern 3: Mocking Without Understanding

**The violation:**
```ruby
# ❌ BAD: Stub prevents side effect the test depends on
test "detects duplicate server" do
  # Stubbing add_to_catalog wipes out the config write!
  ServerRegistry.stub(:add_to_catalog, nil) do
    add_server(config)
    add_server(config)  # Should raise — but won't!
  end
end
```

**Why this is wrong:**
- Stubbed method had side effect test depended on
- Over-mocking to "be safe" breaks actual behavior
- Test passes for wrong reason or fails mysteriously

**The fix:**
```ruby
# ✅ GOOD: Stub only the slow external boundary, preserve behavior
test "detects duplicate server" do
  # Stub the slow HTTP call, not the config write
  HTTPClient.stub(:connect, true) do
    add_server(config)        # config written
    assert_raises(DuplicateServerError) { add_server(config) }
  end
end
```

### Gate Function

```
BEFORE mocking any method:
  STOP - Don't mock yet

  1. Ask: "What side effects does the real method have?"
  2. Ask: "Does this test depend on any of those side effects?"
  3. Ask: "Do I fully understand what this test needs?"

  IF depends on side effects:
    Mock at lower level (the actual slow/external operation)
    OR use test doubles that preserve necessary behavior
    NOT the high-level method the test depends on

  IF unsure what test depends on:
    Run test with real implementation FIRST
    Observe what actually needs to happen
    THEN add minimal mocking at the right level

  Red flags:
    - "I'll mock this to be safe"
    - "This might be slow, better mock it"
    - Mocking without understanding the dependency chain
```

## Anti-Pattern 4: Incomplete Mocks

**The violation:**
```ruby
# ❌ BAD: Partial stub hash — missing fields downstream code uses
stub_response = {
  status: "success",
  data: { user_id: "123", name: "Alice" }
  # Missing: metadata that downstream code accesses
}
# Later: breaks with NoMethodError when code calls response[:metadata][:request_id]
```

**Why this is wrong:**
- **Partial mocks hide structural assumptions** — you only stubbed fields you know about
- **Downstream code may depend on fields you didn't include** — silent failures
- **Tests pass but integration fails** — stub incomplete, real API complete
- **False confidence** — test proves nothing about real behavior

**The Iron Rule:** Mirror the COMPLETE data structure as it exists in reality, not just fields your immediate test uses.

**The fix:**
```ruby
# ✅ GOOD: Mirror real API response completely
stub_response = {
  status: "success",
  data: { user_id: "123", name: "Alice" },
  metadata: { request_id: "req-789", timestamp: Time.now.to_i }
  # All keys the real API returns
}
```

### Gate Function

```
BEFORE creating mock responses:
  Check: "What fields does the real API response contain?"

  Actions:
    1. Examine actual API response from docs/examples
    2. Include ALL fields system might consume downstream
    3. Verify mock matches real response schema completely

  Critical:
    If you're creating a mock, you must understand the ENTIRE structure
    Partial mocks fail silently when code depends on omitted fields

  If uncertain: Include all documented fields
```

## Anti-Pattern 5: Integration Tests as Afterthought

**The violation:**
```
✅ Implementation complete
❌ No tests written
"Ready for testing"
```

**Why this is wrong:**
- Testing is part of implementation, not optional follow-up
- TDD would have caught this
- Can't claim complete without tests

**The fix:**
```
TDD cycle:
1. Write failing test
2. Implement to pass
3. Refactor
4. THEN claim complete
```

## When Mocks Become Too Complex

**Warning signs:**
- Mock setup longer than test logic
- Mocking everything to make test pass
- Mocks missing methods real components have
- Test breaks when mock changes

**your human partner's question:** "Do we need to be using a mock here?"

**Consider:** Integration tests with real components often simpler than complex mocks

## TDD Prevents These Anti-Patterns

**Why TDD helps:**
1. **Write test first** → Forces you to think about what you're actually testing
2. **Watch it fail** → Confirms test tests real behavior, not mocks
3. **Minimal implementation** → No test-only methods creep in
4. **Real dependencies** → You see what the test actually needs before mocking

**If you're testing mock behavior, you violated TDD** - you added mocks without watching test fail against real code first.

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Assert on mock elements | Test real component or unmock it |
| Test-only methods in production | Move to test utilities |
| Mock without understanding | Understand dependencies first, mock minimally |
| Incomplete mocks | Mirror real API completely |
| Tests as afterthought | TDD - tests first |
| Over-complex mocks | Consider integration tests |

## Red Flags

- Assertion checks for `*-mock` test IDs
- Methods only called in test files
- Mock setup is >50% of test
- Test fails when you remove mock
- Can't explain why mock is needed
- Mocking "just to be safe"

## The Bottom Line

**Mocks are tools to isolate, not things to test.**

If TDD reveals you're testing mock behavior, you've gone wrong.

Fix: Test real behavior or question why you're mocking at all.
