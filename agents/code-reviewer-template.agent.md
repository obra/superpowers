---
name: code-reviewer-template
description: Prompt template for dispatching code quality reviewer subagents via runSubagent. Use this template after spec compliance review passes, to verify implementation quality, maintainability, and best practices.
model: inherit
---

# Code Quality Reviewer Prompt Template for Copilot

Use this template when dispatching a code quality reviewer subagent via `runSubagent`.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
runSubagent with code-reviewer agent:
  WHAT_WAS_IMPLEMENTED: [From implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [Starting commit]
  HEAD_SHA: [Ending commit]
```

## Review Criteria

**Readability** — Easy to understand? Clear names?
**Maintainability** — Easy to modify or extend? Well-structured?
**Testability** — Structured for testing? Tests comprehensive?
**Best Practices** — DRY, SOLID? Follows codebase patterns?
**Efficiency** — Obvious performance bottlenecks?
**Error Handling** — Robust and appropriate?

## Report Format

**Strengths:** Positive aspects of the code.

**Issues:** Grouped by:
- `Critical` (must fix) — breaks functionality, security issues
- `Important` (should fix) — maintainability, clarity issues
- `Minor` (suggestion) — nice-to-have improvements

**Overall Assessment:**
- "Approved" — no issues
- "Approved with minor suggestions" — only Minor issues
- "Changes required" — Critical or Important issues found
