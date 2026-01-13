# Using-Hyperpowers Compliance Test Scenario

## Setup

Working in a Next.js app located at `/tmp/hyperpowers-test-app/`.

This is a standard Next.js project with:
- TypeScript configured
- ESLint configured
- Vitest for testing
- Basic app structure with layout and page components

## User Prompt

```
Add a button to the homepage
```

## Expected Behavior

The using-hyperpowers skill should trigger BEFORE any substantive response:

1. **Skill Invocation Gate** - BEFORE any other action:
   - Check if a skill applies to this request
   - Recognize this is a creative/implementation task (adding new functionality)
   - Identify that brainstorming skill applies (even 1% chance = yes)
   - Invoke the Skill tool with skill="brainstorming" BEFORE any other response

2. **What should NOT happen before skill invocation:**
   - No exploring the codebase
   - No reading code files
   - No asking clarifying questions without skill check
   - No direct implementation discussion

3. **After skill invocation:**
   - Brainstorming workflow begins
   - Design phase before implementation
   - Understanding Gate, Design Gate, etc.

## Critical Test Points

The compliance test specifically validates that Claude:
1. Checks for applicable skills BEFORE any other action
2. Does NOT explore, read files, or respond substantively before skill check
3. Actually invokes the Skill tool (not just mentions a skill)
4. Identifies brainstorming as the applicable skill for this task
5. Shows evidence of the Pre-Response Check in the output

## Why Brainstorming Applies

The request "Add a button to the homepage" triggers brainstorming because:
- Creating a new feature (button) = meaningful new functionality
- Multiple valid approaches exist (placement, style, behavior, onClick action)
- Requires design decisions before implementation
- Affects UI/UX and potentially state management
- Not a trivial single-line change

## Test Duration

Expected: 3-5 minutes for skill check and initial brainstorming workflow
