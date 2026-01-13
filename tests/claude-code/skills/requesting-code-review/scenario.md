# Scenario: Requesting Code Review

## Setup
This test requires code changes to already exist that can be reviewed.
The test script creates a feature with intentional issues for the 4 review agents to find.

## Code Changes to Review
Create a validation utility with intentional issues:

```typescript
// src/validation.ts
export function validateEmail(email: string): boolean {
  // Missing null check - Security issue
  return email.includes('@');
}

export function validateUser(user: any): boolean {
  // Using 'any' type - Style issue
  // No test for edge cases - Test issue
  return user.name && user.email && validateEmail(user.email);
}

export function validateUsers(users: any[]): boolean[] {
  // N+1 validation pattern - Performance issue
  const results: boolean[] = [];
  for (const user of users) {
    results.push(validateUser(user));
  }
  return results;
}
```

## User Prompt
"Review my changes"

## Expected Skill Trigger
- The requesting-code-review skill should activate when user asks for review
- Claude should capture BASE_SHA and HEAD_SHA using git commands
- Claude should generate git diff
- Claude should dispatch ALL 4 review agents (security, performance, style, test)
- Claude should synthesize findings by severity (Critical/Warning/Suggestion)
- Claude should cite each reviewer's findings in the synthesis
