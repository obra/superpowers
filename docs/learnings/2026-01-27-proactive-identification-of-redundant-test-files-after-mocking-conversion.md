---
date: 2026-01-27
type: user-correction
source: ai-detected
confidence: medium
tags: [testing, jest, mocking, cleanup, codebase-maintenance]
project: calendar-prep-mvp
---

# Proactive identification of redundant test files after mocking conversion

## What Happened

User converted integration tests to unit tests with mocks (stateManager.schedules.test.js). Later, user had to explicitly ask "or check if we still need this?" about `todoist/test.js` manual test file.

AI should have proactively identified and flagged other manual/integration test files that might be redundant after mock conversion.

## AI Assumption

AI focused only on the specific test file user mentioned (stateManager.schedules.test.js) and didn't scan for related manual test files that might also be obsolete.

## Reality

When converting integration tests to mocks, there are often other related test artifacts:
- Manual test scripts (node scripts/test-*.js)
- Integration test helpers
- Demonstration scripts from initial implementation
- Old manual test files (test.js, manual-test.js)

These should be proactively identified and presented to user for review.

## Lesson

**After converting tests to mocks, proactively scan for redundant test files:**

```bash
# Find manual test scripts
find packages -name "test-*.js" -not -path "*/__tests__/*" -not -path "*/.aws-sam/*"

# Find manual test files
find packages -name "test.js" -o -name "manual-test.js" | grep -v "__tests__"

# Look for integration test helpers
grep -r "integration" --include="*test*.js"
```

**Present findings to user:**
```
I converted the integration tests to mocks. I also found these related test files:
- packages/lambda/src/scripts/test-processor-mocked.js (manual script)
- packages/lambda/src/functions/outputs/todoist/test.js (manual demo)

Should we review these for cleanup?
```

## Context

Applies when converting integration tests to unit tests. Especially relevant in projects with:
- Mix of automated and manual tests
- Scripts in src/scripts/ directory
- Development artifacts from initial implementation

## Suggested Action

Add to test-driven-development or verification-before-completion skill:

**After converting tests to mocks, scan for redundant manual test files:**
- Manual test scripts in scripts/
- Manual test files (test.js, manual-test.js not in __tests__/)
- Integration test helpers
- Present findings to user for review
