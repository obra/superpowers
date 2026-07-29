# TDD Patterns - Test-Driven Development Guidelines

## Table of Contents

- [What is TDD?](#what-is-tdd)
- [The Red-Green-Refactor Cycle](#the-red-green-refactor-cycle)
- [TDD in Plans](#tdd-in-plans)
- [Common TDD Violations](#common-tdd-violations)
- [Plan Validation Checklist](#plan-validation-checklist)
- [Red Flags in Plans](#red-flags-in-plans)
- [TDD Task Patterns](#tdd-task-patterns)
- [Test Coverage Expectations](#test-coverage-expectations)
- [Commits in TDD](#commits-in-tdd)
- [Framework-Specific Patterns](#framework-specific-patterns)
- [Validation Examples](#validation-examples)

## What is TDD?

**Test-Driven Development (TDD)** is a software development process where tests are written before the implementation code, following the **Red-Green-Refactor** cycle.

## The Red-Green-Refactor Cycle

### 1. RED - Write a failing test
- Write a test for the next bit of functionality
- Run the test and watch it fail
- Verify the failure message is meaningful

### 2. GREEN - Make it pass
- Write minimal code to make the test pass
- Focus on correctness, not elegance
- All tests should pass now

### 3. REFACTOR - Improve the code
- Clean up the implementation
- Improve design without changing behavior
- Keep tests passing

## TDD in Plans

### Correct TDD Task Structure

```markdown
### Task N: [Feature Component]

**Files:**
- Create: `src/path/to/file.ts`
- Test: `src/path/to/file.test.ts`

**Step 1: Write the failing test**

```typescript
describe('ComponentName', () => {
  it('should do X when Y', () => {
    const result = functionUnderTest(input);
    expect(result).toBe(expectedOutput);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test ComponentName.test.ts`
Expected: FAIL - "functionUnderTest is not defined"

**Step 3: Write minimal implementation**

```typescript
export function functionUnderTest(input) {
  return expectedOutput;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test ComponentName.test.ts`
Expected: PASS

**Step 5: Refactor if needed**

[Refactoring steps if applicable]

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add functionUnderTest"
```
```

## Common TDD Violations

### 1. Testing After Implementation

**❌ Violation:**
```markdown
### Task 1: Implement feature
- Write all the code

### Task 5: Add tests
- Write tests for the code
```

**✅ Correct:**
```markdown
### Task 1: Feature X
**Step 1:** Write failing test
**Step 2:** Run test (expect FAIL)
**Step 3:** Write minimal code
**Step 4:** Run test (expect PASS)
**Step 5:** Commit
```

### 2. Missing Red Phase

**❌ Violation:**
```markdown
**Step 1:** Write test
**Step 2:** Run test
```

**✅ Correct:**
```markdown
**Step 1:** Write failing test
**Step 2:** Run test - Expected: FAIL with "[specific error]"
```

### 3. Vague Test Instructions

**❌ Violation:**
```markdown
- Write tests for the component
- Make sure it works
```

**✅ Correct:**
```markdown
- Write test: "when user is authenticated, show dashboard"
- Write test: "when user is not authenticated, redirect to login"
```

### 4. Big Bang Implementation

**❌ Violation:**
```markdown
### Task 1: Build entire feature
- Implement all components
- Add all tests at the end
```

**✅ Correct:**
```markdown
### Task 1: Component A - test & implement
### Task 2: Component B - test & implement
### Task 3: Integration - test & implement
```

## Plan Validation Checklist

### For Each Task

- [ ] Is there a test step BEFORE implementation?
- [ ] Is the expected failure specified?
- [ ] Is the exact test command provided?
- [ ] Is the expected pass output specified?
- [ ] Is there a commit step after tests pass?

### Test Structure

- [ ] Are test descriptions specific?
- [ ] Do tests cover edge cases?
- [ ] Is there a test for error conditions?
- [ ] Are tests independent of each other?

### Implementation Steps

- [ ] Is implementation minimal to pass tests?
- [ ] Is refactoring explicitly mentioned?
- [ ] Are there implementation examples?
- [ ] Is the scope appropriate (not too large)?

## Red Flags in Plans

### Critical (Must Fix)
- Tests mentioned only at the end
- No specific test commands
- Implementation without test steps
- Missing expected failure verification

### Warning (Should Improve)
- Tests in separate section from implementation
- Vague test descriptions
- No commit after test milestones
- Missing edge case coverage

### Info (Nice to Have)
- Could add more specific test cases
- Could include performance tests
- Could add integration test examples

## TDD Task Patterns

### Pattern 1: New Function/Method

```markdown
**Step 1:** Write failing test
```typescript
expect(calculateTotal([1, 2, 3])).toBe(6);
```

**Step 2:** Run test - Expected: "calculateTotal is not defined"

**Step 3:** Write minimal implementation
```typescript
export const calculateTotal = (items) => items.reduce((a, b) => a + b, 0);
```

**Step 4:** Run test - Expected: PASS
```

### Pattern 2: Component Rendering

```markdown
**Step 1:** Write failing test
```typescript
render(<Button>Click me</Button>);
expect(screen.getByText('Click me')).toBeInTheDocument();
```

**Step 2:** Run test - Expected: "Button is not defined"

**Step 3:** Write minimal implementation
```tsx
export const Button = ({ children }) => <button>{children}</button>;
```

**Step 4:** Run test - Expected: PASS
```

### Pattern 3: API Endpoint

```markdown
**Step 1:** Write failing test
```typescript
const response = await request(app).get('/api/users');
expect(response.status).toBe(200);
expect(response.body).toEqual([{ id: 1, name: 'John' }]);
```

**Step 2:** Run test - Expected: "Cannot GET /api/users"

**Step 3:** Write minimal implementation
```typescript
app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});
```

**Step 4:** Run test - Expected: PASS
```

## Test Coverage Expectations

### Minimum Coverage

| Component Type | Minimum Tests |
|----------------|---------------|
| Utility function | 1 success, 1 failure case |
| React component | Render, interaction, edge case |
| API endpoint | Success, error, validation |
| Database model | Create, read, update, delete |

### Edge Cases to Test

1. **Empty/null inputs**
   ```typescript
   expect(processItems([])).toEqual([]);
   expect(processItems(null)).toThrow();
   ```

2. **Boundary values**
   ```typescript
   expect(validateAge(0)).toBe(false);
   expect(validateAge(120)).toBe(true);
   expect(validateAge(121)).toBe(false);
   ```

3. **Error conditions**
   ```typescript
   expect(() => divide(10, 0)).toThrow('Division by zero');
   ```

## Commits in TDD

### Commit Granularity

**After each test passes:**
```bash
git commit -m "test: add failing test for [feature]"
git commit -m "feat: implement [feature] to pass tests"
git commit -m "refactor: simplify [feature] implementation"
```

### Commit Messages

| Phase | Message Format |
|-------|----------------|
| Red | `test: add failing test for [feature]` |
| Green | `feat: implement [feature]` |
| Refactor | `refactor: improve [feature]` |

## Framework-Specific Patterns

### Jest

```markdown
**Step 1:** Write test
```typescript
describe('Feature', () => {
  it('should do X', () => {
    expect(result).toBe(expected);
  });
});
```

**Step 2:** Run `jest Feature.test.ts`
```

### Vitest

```markdown
**Step 1:** Write test
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature', () => {
  it('should do X', () => {
    expect(result).toBe(expected);
  });
});
```

**Step 2:** Run `vitest run Feature.test.ts`
```

### pytest

```markdown
**Step 1:** Write test
```python
def test_feature_does_x():
    result = function()
    assert result == expected
```

**Step 2:** Run `pytest test_feature.py::test_feature_does_x -v`
```

## Validation Examples

### Example 1: Missing TDD Structure

**Plan says:**
```markdown
### Task 1: Implement login
- Create login form
- Add validation
- Write tests
```

**Issue:** Tests after implementation

**Recommendation:**
```markdown
### Task 1: Login form
**Step 1:** Write failing test for form rendering
**Step 2:** Run test (expect FAIL)
**Step 3:** Create minimal LoginForm component
**Step 4:** Run test (expect PASS)
**Step 5:** Commit

### Task 2: Form validation
**Step 1:** Write failing test for validation
...
```

### Example 2: Vague Test Step

**Plan says:**
```markdown
- Write tests for the feature
- Run tests
- Implement feature
```

**Issue:** No specific tests, no expected outcomes

**Recommendation:**
```markdown
**Step 1:** Write failing tests
```typescript
it('rejects invalid email', () => {
  expect(validateEmail('invalid')).toBe(false);
});
it('accepts valid email', () => {
  expect(validateEmail('user@example.com')).toBe(true);
});
```

**Step 2:** Run tests - Expected: "validateEmail is not defined"

**Step 3:** Implement validateEmail function
...
```
