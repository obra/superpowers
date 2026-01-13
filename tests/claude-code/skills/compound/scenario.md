# Compound Compliance Test Scenario

## Setup

Working in a Next.js app located at `/tmp/hyperpowers-test-app/`.

## Test Flow

This test requires a multi-step interaction to trigger the compound skill:

1. First, a bug is introduced (undefined variable causing runtime error)
2. User reports the bug and asks for help
3. After debugging and fixing, user says "that worked!" to trigger compound skill

## User Prompt (Multi-Turn)

Turn 1 (Bug Setup):
```
I'm getting an error when I try to render the homepage. Here's the error:
"ReferenceError: userData is not defined"
Can you help me fix this?
```

Turn 2 (After first failed attempt):
```
That didn't work - still getting the same error. Maybe it's something else?
```

Turn 3 (After fix works):
```
that worked!
```

## Expected Context

- This is a Next.js TypeScript project
- The bug involves an undefined variable in a React component
- The debugging process should involve multiple attempts
- After the fix, the phrase "that worked!" should trigger the compound skill
- The compound skill should create a solution document in docs/solutions/

## Single-Turn Test Prompt

For automated testing, use this single prompt that simulates the full scenario:

```
I was debugging an issue where I got "ReferenceError: userData is not defined" in my React component. I first tried adding an import but that didn't help. Then I realized the variable was declared inside a useEffect but used outside it. Moving the declaration outside the useEffect fixed it. that worked! Please document this solution.
```

This prompt provides enough context for the compound skill to:
1. Assess non-triviality (multiple attempts were made)
2. Identify symptoms (exact error message provided)
3. Note failed attempts (tried adding import)
4. Understand root cause (variable scope issue)
5. Document the solution
