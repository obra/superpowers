# Feedback Compliance Test Scenario

## Setup

Working in a Next.js app located at `/tmp/hyperpowers-test-app/`.

This is a standard Next.js project with:
- TypeScript configured
- ESLint configured
- Vitest for testing
- Basic app structure with layout and page components

## Pre-Scenario Setup

Before running this test, create a simple design document at `docs/designs/2026-01-13-data-fetching.md`:

```markdown
# Data Fetching Design

## Problem Statement
We need to fetch user data from an API and display it on the profile page.

## Success Criteria
- User data loads when profile page mounts
- Loading state shows while fetching
- Errors are displayed gracefully

## Constraints / Out of Scope
- No caching requirements for initial version
- No offline support needed

## Approach
Use useEffect hook with fetch API to load user data on component mount.

```typescript
function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);

  // render logic...
}
```

## Open Questions
- Should we add retry logic on failure?
- What's the appropriate timeout?
```

## User Prompt

After creating the design doc, provide this feedback:

```
Change the data fetching approach to use React Query instead of useEffect
```

## Expected Behavior

The feedback skill should trigger and:

1. **Clarification Gate** - Assess confidence in understanding the feedback:
   - Is it clear which sections need to change?
   - Is React Query integration scope clear?
   - If confidence < 85%, ask clarifying questions

2. **Approval Gate** - For each proposed change:
   - Present Old/New diff format
   - Wait for explicit approval (yes/no/modify)
   - Handle one change at a time (not batched)

3. **Changelog Gate** - After all approved changes:
   - Create or append to Changelog section
   - Include dated entry with feedback round number
   - Note research tier if used

## Critical Test Points

The compliance test specifically validates that Claude:
1. Assesses confidence level before proceeding
2. Asks clarifying questions if feedback is ambiguous
3. Shows each change with Old/New diff format
4. Gets explicit approval per change (not batched)
5. Updates the Changelog section

## Why This Feedback Tests the Skill

The feedback "use React Query instead of useEffect" is:
- Moderately clear (specific technology change)
- Affects the Approach section significantly
- May require research (Tier 1 or 2) for React Query patterns
- Should trigger multiple changes (imports, code pattern, etc.)
- Requires per-change approval demonstration

## Test Duration

Expected: 5-8 minutes for full feedback workflow with approval gates
