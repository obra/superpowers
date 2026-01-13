# Scenario: Systematic Debugging

## Setup
This test runs in the test project directory with a pre-created bug causing test failure.
The task is designed to verify systematic debugging compliance: investigation before fixes.

## Test Setup Steps
Before running Claude, the test script:
1. Creates a utility function `getUserGreeting(userId)` in `src/userGreeting.ts`
2. Creates a test file `src/userGreeting.test.ts` that tests the function
3. Introduces a bug: returns wrong greeting based on user type
4. The bug is NOT obvious - requires investigation to find root cause

## The Bug
```typescript
// src/userGreeting.ts - contains a subtle bug
export function getUserGreeting(userId: string): string {
  const users: Record<string, { name: string; type: 'premium' | 'standard' }> = {
    '1': { name: 'Alice', type: 'premium' },
    '2': { name: 'Bob', type: 'standard' },
    '3': { name: 'Charlie', type: 'premium' }
  };

  const user = users[userId];
  if (!user) return 'Hello, Guest!';

  // BUG: condition is inverted - premium users get standard greeting
  if (user.type !== 'premium') {
    return `Welcome back, ${user.name}! Enjoy your premium benefits.`;
  }
  return `Hello, ${user.name}!`;
}
```

## User Prompt
"Tests are failing, can you fix it?"

## Expected Skill Trigger
- The systematic-debugging skill should activate
- Claude should follow the four phases:
  1. **Phase 1: Root Cause Investigation** - Read errors, reproduce, gather evidence
  2. **Phase 2: Pattern Analysis** - Find working examples, compare
  3. **Phase 3: Hypothesis and Testing** - Form hypothesis, test minimally
  4. **Phase 4: Implementation** - Fix root cause with TDD

## Test Duration
Expected: 10-20 minutes

## Critical Verification Points
1. **Observation first:** Error must be reproduced (tests run) BEFORE any code changes
2. **Facts gathered:** Test output analyzed, stack trace examined
3. **Hypothesis stated:** Claude must state "I believe X is wrong because Y"
4. **Root cause identified:** The inverted condition must be identified as root cause
5. **Fix addresses root cause:** Fix changes the condition, not symptoms

## Example Valid Sequence
```
1. Claude runs: npm test (or vitest)
2. Claude reads test failure output carefully
3. Claude reads the source code
4. Claude states hypothesis: "The condition seems inverted..."
5. Claude traces the logic to confirm
6. Claude fixes the inverted condition
7. Claude runs tests again to verify
```

## Example Invalid Sequence (FAIL)
```
1. Claude reads the code
2. Claude immediately says "I see the bug, let me fix it"
3. Claude changes code without running tests first
4. Claude runs tests (they pass)
```
This fails because:
- Error wasn't reproduced first
- No hypothesis was stated
- Root cause wasn't explicitly identified
- "Quick fix" approach used

## Another Invalid Sequence (FAIL)
```
1. Claude runs tests
2. Claude says "This should fix it" without explaining why
3. Claude makes a change
4. Claude runs tests
```
This fails because:
- No hypothesis formation
- No root cause identification
- No systematic investigation
