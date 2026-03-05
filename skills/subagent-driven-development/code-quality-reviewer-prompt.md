# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Recommended model:** `opus` (quality review benefits from deeper reasoning about coupling, edge cases, architectural drift)
**Sonnet acceptable for:** trivial single-function changes with no architectural impact

**Only dispatch after spec compliance review passes.**

```
Task tool (superpowers:code-reviewer, model: opus):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
