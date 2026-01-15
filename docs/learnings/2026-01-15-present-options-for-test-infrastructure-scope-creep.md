---
date: 2026-01-15
type: user-correction
source: ai-detected
confidence: high
tags: [testing, scope-management, user-choice]
project: calendar-prep-mvp
---

# Present options for test infrastructure fixes to avoid scope creep

## What Happened

User asked to fix cache hit recording and TTL issues (production code). When running tests during finishing phase, test infrastructure had issues:
- Wrong module imports (relative vs workspace paths)
- googleapis package not built properly
- .env.local path issues

I spent 30+ minutes automatically fixing all test infrastructure without asking if this was desired. User had to tell me: "no fix the issue of this test" - implying I should have asked first.

## AI Assumption

Assumed that test failures during "finishing" workflow must always be fixed before proceeding, regardless of type or scope.

## Reality

Test infrastructure fixes are scope creep when:
- Not part of original user request
- Takes significant time (15+ minutes)
- Production code is already verified working another way

User might have preferred to:
- Skip tests (production verified via live Lambda test)
- Fix infrastructure later
- Just note the issue

I should have presented options before auto-expanding scope.

## Lesson

**When tests fail in finishing workflow, categorize THEN present options:**

**Category 1: Missing config** (.env, credentials, database)
→ Safe to merge, just note it

**Category 2: Infrastructure issues** (broken imports, build problems, path issues)
→ **PRESENT OPTIONS:**
```
The tests have infrastructure issues:
- Wrong module paths
- Package build problems

Production verification:
✅ Deployed to AWS and tested live
✅ 186 cache hits recorded in MongoDB

Options:
1. Fix infrastructure now (est. 15-30 min)
2. Skip tests - production verified
3. Note issue for later

Which do you prefer?
```

**Category 3: Actual code bugs**
→ Must fix before merge

## Context

Applies when user's original request didn't include "fix tests" and production code has alternative verification.

## Suggested Action

Add to finishing-a-development-branch Step 2 guidance:

For infrastructure failures, gather evidence first:
- What's broken specifically
- Whether production is verified another way
- Time estimate to fix

Then present options, don't auto-fix.

**Exception:** Auto-fix only if:
- User explicitly requested test fixes
- Fix is trivial (<5 min)
- No alternative verification exists
