# Codex Debugging Example

This example shows systematic debugging with Codex delegation.

## Scenario

Test failure: `UserService.test.ts` fails with `TypeError: Cannot read property 'name' of undefined`

## Workflow

### Step 1: Encounter Bug

```markdown
Test output:
FAIL tests/UserService.test.ts
  UserService
    ✓ creates user successfully
    ✗ retrieves user by ID (TypeError: Cannot read property 'name' of undefined)
    ✓ updates user email

TypeError: Cannot read property 'name' of undefined
    at UserService.getDisplayName (src/UserService.ts:42)
    at Object.<anonymous> (tests/UserService.test.ts:23)
```

### Step 2: Activate Systematic Debugging

```markdown
You: "I'm using systematic-debugging to find the root cause"

System: "Starting Phase 1: Root Cause Investigation"
```

### Step 3: Check Codex Delegation Config

```markdown
System checks:
- codex_enabled: true ✓
- debugging.delegate_to_codex: true ✓
- debugging.phases includes "evidence_gathering": true ✓

System: "Delegating evidence gathering to Codex"
```

### Step 4: Prepare Debugging Prompt

**codex-delegator fills template:**

```
Debug the following issue:

Problem:
Test failure: TypeError: Cannot read property 'name' of undefined
at UserService.getDisplayName (src/UserService.ts:42)
at test (tests/UserService.test.ts:23)

Phase: evidence_gathering

Context:
Test code (tests/UserService.test.ts:20-25):
```typescript
it('retrieves user by ID', async () => {
  const userId = 'user-123';
  const user = await userService.getUserById(userId);
  const displayName = user.getDisplayName(); // Line 23 - fails here
  expect(displayName).toBe('John Doe');
});
```

Source code (src/UserService.ts:40-45):
```typescript
async getUserById(id: string): Promise<User> {
  const userData = await this.repository.findById(id);
  return new User(userData);
}

getDisplayName(): string {
  return this.user.name; // Line 42 - 'this.user' is undefined
}
```

Recent changes (git diff):
- Refactored User class to use composition pattern
- Changed from direct properties to nested user object
- Modified constructor signature

Provide:
1. Evidence gathered
2. Root cause hypothesis
3. Recommended next steps
4. Reasoning for hypothesis
```

### Step 5: Codex Investigates

```markdown
[mcp__codex__spawn_agent executes]

Codex gathers evidence:
- Checks User class constructor
- Examines repository.findById return type
- Traces data flow from repository → User
- Identifies property access pattern change
```

### Step 6: Codex Response

```
EVIDENCE GATHERED:
- User class refactored to use composition (commit: 3df7661)
- Old constructor: User(name, email) - properties directly on User
- New constructor: User(userData) - expects userData.name, userData.email
- repository.findById() returns: { id, name, email, createdAt }
- User constructor now assigns: this.user = userData
- getDisplayName() tries to access: this.user.name
- Test creates User directly without wrapping data: new User({ name: 'John', email: '...' })
- Production code calls: new User(await repository.findById(id))

Analysis of data flow:
1. Test: repository.findById('user-123') returns { id: '123', name: 'John', email: '...' }
2. UserService creates: new User({ id: '123', name: 'John', email: '...' })
3. User constructor assigns: this.user = { id: '123', name: 'John', ... }
4. getDisplayName() accesses: this.user.name → should work

BUT test mock returns undefined:
- Mock repository.findById is not set up properly
- Returns undefined instead of user data
- new User(undefined) creates User with this.user = undefined
- this.user.name throws TypeError

ROOT CAUSE HYPOTHESIS:
Test mock for repository.findById is not returning data. The refactor changed
expectations but test mock wasn't updated. Production code is likely correct,
test setup is broken.

REASONING:
The error "Cannot read property 'name' of undefined" means this.user is undefined.
This only happens if User constructor receives undefined. Tracing back: getUserById
calls repository.findById(id), which in tests is a mock. The mock setup wasn't
updated during the refactor to return proper user data shape.

RECOMMENDED NEXT STEPS:
1. Check test setup for repository.findById mock (around line 15-20)
2. Verify mock returns: { id, name, email, createdAt }
3. Expected: Mock is either missing or returns undefined
4. Fix: Update mock to return proper data shape
5. Alternative hypothesis if wrong: Check User constructor handling of undefined
```

### Step 7: Validation

**codex-response-validator.sh:**

```bash
Checking EVIDENCE GATHERED: ✓ Present, concrete
Checking ROOT CAUSE HYPOTHESIS: ✓ Clear statement
Checking REASONING: ✓ Present, logical
Checking RECOMMENDED NEXT STEPS: ✓ Actionable steps

Validation: PASSED
```

### Step 8: Claude Reviews Hypothesis

```markdown
You (Claude): "Reviewing Codex hypothesis against evidence..."

Evidence analysis:
- TypeError: "Cannot read property 'name' of undefined" ✓ Confirms this.user is undefined
- Refactor changed constructor signature ✓ Explains why mock might be stale
- Hypothesis: Mock not updated ✓ Testable and specific

Hypothesis quality: SOUND
Recommended action: Proceed to Phase 2 (Pattern Analysis) with focus on test mock
```

### Step 9: Phase 2 - Pattern Analysis (Claude)

```markdown
You: "Moving to Phase 2: Pattern Analysis"

Finding working examples:
- Other UserService tests that pass
- Checking their mock setup

[Read tests/UserService.test.ts:10-18]

Found:
```typescript
beforeEach(() => {
  mockRepository = {
    findById: jest.fn(),  // Line 12 - mock not configured!
    save: jest.fn().mockResolvedValue({ id: '1', name: 'Test', email: 'test@example.com' })
  };
  userService = new UserService(mockRepository);
});
```

Pattern identified:
- save mock has .mockResolvedValue(...)
- findById mock is jest.fn() without return value → returns undefined
- Other passing tests don't call getUserById, so mock never used

Difference between working and broken:
- Working mocks: Have .mockResolvedValue(...)
- Broken mock: Missing .mockResolvedValue(...)

Root cause CONFIRMED: Mock setup is incomplete
```

### Step 10: Phase 3 - Hypothesis Testing (Claude)

```markdown
You: "Phase 3: Hypothesis Testing"

Hypothesis: Adding .mockResolvedValue to findById mock will fix test

Minimal test:
Add to beforeEach:
```typescript
findById: jest.fn().mockResolvedValue({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date()
})
```

[Apply change, run test]

Result:
✓ retrieves user by ID

Hypothesis CONFIRMED
```

### Step 11: Phase 4 - Implementation (Claude)

```markdown
You: "Phase 4: Implementation - Creating permanent fix"

Following TDD:
1. Test already exists (it was broken, now fixed)
2. Implementation: Update mock setup
3. Verify: All tests pass

[Commit fix]

git add tests/UserService.test.ts
git commit -m "fix: configure findById mock to return user data

Root cause: Mock was created without return value, causing undefined
to be passed to User constructor. Updated mock setup to return proper
user data shape matching repository interface.

Fixes: UserService.test.ts:23 TypeError"
```

### Step 12: Verification

```markdown
You: "Using verification-before-completion to confirm fix"

Running full test suite:
✓ UserService creates user successfully
✓ UserService retrieves user by ID (FIXED)
✓ UserService updates user email

All tests passing: 3/3
Bug resolved: ✓
```

## Key Takeaways

1. **Evidence-based**: Codex gathered concrete evidence before hypothesizing
2. **Systematic**: Followed all 4 phases, no shortcuts
3. **Validated**: Claude reviewed hypothesis quality before proceeding
4. **Maintained workflow**: Integration preserved TDD, verification, commits
5. **Transparency**: Clear handoff between Codex (evidence) and Claude (validation)
6. **Root cause found**: Fixed actual problem (mock), not symptom
