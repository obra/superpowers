---
date: 2026-01-23
tags: [documentation, workflow, context-preservation, maintenance]
workflow: [executing-plans, finishing-a-development-branch]
---

# Updating documentation immediately when discovering implementation details prevents documentation drift and captures context while fresh

## Problem

During schedule manager Lambda implementation, discovered the actual IAM role name (`CalendarPrepAmplifyRole`) differed from initial assumption (`CalendarPrepComputeRole`).

If documentation updates were deferred:
- Plan file would show wrong role name for future reference
- CLAUDE.md would have incorrect architecture docs
- Future developers would repeat the same mistake
- Context about "why this role" would be lost

## Solution

Immediately after fixing the IAM role issue:
1. Updated `docs/fix-amplify-scheduler-permissions.md` (corrected role name in Components section)
2. Updated `docs/plans/2026-01-23-schedule-manager-lambda.md` (Task 3 instructions)
3. Committed both with message: "docs: correct Amplify role name in documentation"

This happened in the same session as the fix, while all context was still in working memory:
- Why the role name was wrong (Amplify generates dynamic names)
- What the error message looked like
- How to verify the correct role

## Prevention

**Update documentation in the same commit as code fixes when:**
- Discovering actual vs. assumed infrastructure names (IAM roles, resources)
- Learning new constraints or limitations
- Finding undocumented behavior
- Correcting initial architecture assumptions

**Pattern:**
```bash
# Fix code
git add src/

# IMMEDIATELY update docs
git add docs/plans/ docs/fix-*.md CLAUDE.md

# Single commit with both
git commit -m "fix + docs: [description]"
```

**Benefits:**
- Documentation stays synchronized with reality
- Future readers see the correction in git history
- Context captured while still fresh (error messages, reasoning)
- No "TODO: update docs" backlog

**Red flags:**
- Fixing code without updating related docs
- Planning to "update docs later"
- Documentation showing outdated assumptions
