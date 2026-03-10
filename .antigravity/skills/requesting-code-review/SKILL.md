---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging - pre-review checklist to verify work meets requirements before requesting review
---

# Requesting Code Review

> **This skill mirrors the `/requesting-code-review` workflow.**

## Overview
**Core principle:** Review early, review often.

## When to Request
**Mandatory:** After major features, before merge, after complex bug fixes.
**Optional:** When stuck, before refactoring.

## Pre-Review Checklist
- [ ] All tests pass
- [ ] No linter errors
- [ ] Build succeeds
- [ ] Code is committed
- [ ] Commit messages are clear

## Review Request Format
```
**What:** [What was implemented]
**Why:** [What problem it solves]
**Changes:** [Files modified, key decisions]
**Testing:** [How it was verified]
**Commits:** [BASE_SHA..HEAD_SHA]
```

## Acting on Feedback
| Priority | Action |
|----------|--------|
| Critical | Fix immediately |
| Important | Fix before proceeding |
| Minor | Note for later |
