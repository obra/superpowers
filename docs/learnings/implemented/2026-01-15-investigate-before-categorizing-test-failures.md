---
date: 2026-01-15
type: user-correction
source: ai-detected
confidence: high
tags: [testing, systematic-debugging, investigation]
project: calendar-prep-mvp
---

# Investigate test failures properly before categorizing them

## What Happened

Test script failed with error "No .env.local or .env file found". I immediately presented two options to user:
1. Missing configuration - safe to merge
2. Actual bugs - must fix

User corrected: "the .env.local is present, why is this not being used?"

## AI Assumption

Assumed the error message accurately described the problem (missing .env file) without investigating where the test was looking for the file.

## Reality

The .env.local file existed in the repo root and admin-ui directories. The test script was looking in `packages/lambda/` (via `process.cwd()`) where it didn't exist. The real issue was:
- Test script looking in wrong directory
- Need symlink from packages/lambda to repo root

I categorized it as "missing configuration" when it was actually "wrong path configuration".

## Lesson

**When tests fail, INVESTIGATE FIRST before categorizing:**

1. Read the error message carefully
2. Verify the error's claim (e.g., "file not found" - check if file actually exists elsewhere)
3. Trace the code path to understand what's being checked
4. THEN categorize as config issue vs bug vs infrastructure

**Don't trust error messages at face value** - they describe symptoms, not root causes.

## Context

Applies to all testing scenarios. Part of systematic-debugging Phase 1 (Root Cause Investigation).

## Suggested Action

When presenting test failure options in finishing-a-development-branch Step 2, always investigate first:

```bash
# Before categorizing, check:
- Does the missing file exist elsewhere?
- Is the path correct?
- Are permissions correct?
- Is the environment correct?
```

Only present options AFTER understanding the root cause.

---

**IMPLEMENTED (2026-01-15):** Enhanced multiple skills in v4.1.2:
- systematic-debugging Phase 1: Added "don't trust error messages at face value"
- verification-before-completion: Added Step 4 INVESTIGATE before interpreting
- finishing-a-development-branch Step 2: Added investigation workflow before categorization
