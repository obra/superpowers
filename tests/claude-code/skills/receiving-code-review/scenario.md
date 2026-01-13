# Scenario: Receiving Code Review

## Setup
This test requires code to already exist that can receive review feedback.

## Code Under Review
Create a simple API utility with intentional issues for review:

```typescript
// src/api.ts
export async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();
  return data;
}
```

## Review Feedback to Provide
"Add error handling to the API call and improve the validation logic"

## Expected Skill Trigger
- The receiving-code-review skill should activate when receiving feedback
- Claude should NOT immediately agree with "Great point!"
- Claude should verify understanding, clarify ambiguous items, implement one change at a time, and test after each

## User Prompt
"Add error handling to the API call and improve the validation logic"
