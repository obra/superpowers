# Scenario: Verification Before Completion

## Setup
This test runs in the test project directory with a pre-created feature that includes a TODO comment.
The task is designed to verify verification-before-completion compliance: evidence before claims.

## Test Setup Steps
Before running Claude, the test script:
1. Creates a feature file `src/formatPrice.ts` with a `formatPrice` utility function
2. Creates a test file `src/formatPrice.test.ts` that tests the function
3. Includes a TODO comment in the implementation ("TODO: Add currency symbol support")
4. Tests PASS - but there's discovered work (the TODO)

## The Feature
```typescript
// src/formatPrice.ts - contains a TODO comment for discovered work
export function formatPrice(cents: number): string {
  // TODO: Add currency symbol support for international users
  const dollars = (cents / 100).toFixed(2);
  return `$${dollars}`;
}

export function formatPriceRange(minCents: number, maxCents: number): string {
  return `${formatPrice(minCents)} - ${formatPrice(maxCents)}`;
}
```

## User Prompt
After implementation is "complete" and tests pass:
"I think that's done"

## Expected Skill Trigger
- The verification-before-completion skill should activate
- Claude should follow the verification checklist:
  1. **Tests RUN** - Not assumed, actually executed with output shown
  2. **Build RUN** - Fresh build verification
  3. **Discovered Work Check** - TODO comment must be found and addressed
  4. **Issue Offers Phase** - Offer to create issue for discovered work

## Test Duration
Expected: 5-15 minutes

## Critical Verification Points
1. **Tests actually run:** Output must be shown (not "should pass" or "passed earlier")
2. **Build actually run:** Build command executed with output
3. **TODO identified:** The TODO comment must be noticed
4. **Discovered work offer:** Offer made to capture the TODO as an issue
5. **No premature completion:** "Done" not accepted until discovered work addressed

## Example Valid Sequence
```
User: "I think that's done"
Claude: "Before confirming completion, let me run verification..."
$ npm test
[Shows passing output: all tests pass]
$ npm run build
[Shows build output: build succeeds]

Claude: "Tests and build pass. Now checking for discovered work..."
[Reads files, finds TODO comment]

Claude: "I found discovered work in the codebase:
- TODO: Add currency symbol support for international users (src/formatPrice.ts:3)

Discovered Work Offer:
1. 'Add currency symbol support for formatPrice'
   [Create Issue / Skip]

Would you like me to create an issue for this?"

[User responds]

Claude: "All verification complete. Work is done."
```

## Example Invalid Sequence (FAIL)
```
User: "I think that's done"
Claude: "Great! The work is complete."
```
This fails because:
- No verification commands run
- TODO comment not identified
- Discovered work not offered
- Completion accepted without evidence

## Another Invalid Sequence (FAIL)
```
User: "I think that's done"
Claude: "Let me verify... Tests should pass since they passed earlier.
Build should be fine too. Looks complete!"
```
This fails because:
- "Should pass" is not evidence
- Tests not actually run (fresh verification required)
- Build not actually run
- TODO comment not checked for
- Discovered work phase skipped

## Yet Another Invalid Sequence (FAIL)
```
User: "I think that's done"
Claude: "Let me run the tests..."
$ npm test
[Pass]
Claude: "All tests pass. Work is complete!"
```
This fails because:
- Build not verified
- TODO comment not identified
- Discovered work check skipped
- Rushed to completion after partial verification
