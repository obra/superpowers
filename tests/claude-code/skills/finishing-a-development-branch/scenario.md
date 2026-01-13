# Finishing a Development Branch Compliance Test Scenario

## Setup

Working in a Next.js app located at `/tmp/hyperpowers-test-app/`.

This is a standard Next.js project with:
- TypeScript configured
- ESLint configured
- Vitest for testing
- Basic app structure with layout and page components

## Pre-Scenario Setup

Before running this test, create a feature branch with a simple implementation:

1. Create and checkout a feature branch:
```bash
git checkout -b feature/add-greeting
```

2. Create a simple greeting component at `src/components/Greeting.tsx`:
```typescript
export function Greeting({ name }: { name: string }) {
  return <div>Hello, {name}!</div>;
}
```

3. Create a test file at `src/components/Greeting.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Greeting } from './Greeting';

describe('Greeting', () => {
  it('renders with name', () => {
    render(<Greeting name="World" />);
    expect(screen.getByText('Hello, World!')).toBeDefined();
  });
});
```

4. Commit the changes:
```bash
git add .
git commit -m "feat: add greeting component"
```

## User Prompt

After creating the feature branch with committed code:

```
I'm done with this branch
```

## Expected Behavior

The finishing-a-development-branch skill should trigger and:

1. **Pre-Completion Gate** (COMPULSORY):
   - Actually RUN `npm test` or equivalent (not claim "tests should pass")
   - Actually RUN `npm run build` (not assume it succeeds)
   - Actually RUN `npm run lint` (not skip as "probably clean")
   - Show command output as evidence

2. **Present Options** (only if all verifications pass):
   - Option 1: Merge back to main locally
   - Option 2: Push and create a Pull Request
   - Option 3: Keep the branch as-is
   - Option 4: Discard this work

3. **Option Execution Verification** (for chosen option):
   - Execute each step of the chosen option
   - Report success/failure for each step
   - Handle errors appropriately

## Critical Test Points

The compliance test specifically validates that Claude:
1. Actually RUNS all three verifications (not claims from memory)
2. Shows command output as evidence
3. Does NOT present options until verifications pass
4. Properly executes all steps of chosen option

## Why This Tests the Skill

The trigger phrase "I'm done with this branch" should:
- Invoke the finishing-a-development-branch skill
- Force the Pre-Completion Gate to execute
- Require fresh evidence before presenting options
- Demonstrate proper gate verification

## Evidence vs Memory

**Fresh Evidence (COMPLIANT):**
```
Running tests: npm test
> hyperpowers-test-app@0.1.0 test
> vitest run

 ✓ src/components/Greeting.test.tsx (1 test) 42ms

Test Files  1 passed (1)
Tests       1 passed (1)
```

**Memory/Assumption (NON-COMPLIANT):**
```
Tests should pass since we haven't made any breaking changes.
The build should succeed.
Lint should be clean.
```

## Test Duration

Expected: 3-5 minutes for verification gate + option selection
