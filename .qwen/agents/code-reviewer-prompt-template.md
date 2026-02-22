# Code Quality Reviewer Prompt Template for Qwen Code

Use this template when dispatching a code quality reviewer subagent using Qwen Code's `task()` tool.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```python
task(
    description="Code quality review for Task N",
    subagent_type="code-reviewer",
    prompt="""
You are reviewing code quality for an implementation that has passed spec compliance review.

## What Was Implemented

[From implementer's report]

## Plan/Requirements

Task N from [plan-file]

## Code Review

Review the code changes between BASE_SHA and HEAD_SHA for:

**Readability:**
- Is the code easy to understand?
- Are names clear and accurate?

**Maintainability:**
- Is it easy to modify or extend?
- Is it well-structured?

**Testability:**
- Is the code structured for easy testing?
- Are tests comprehensive?

**Best Practices:**
- Does it follow established principles (DRY, SOLID)?
- Does it follow existing codebase patterns?

**Efficiency:**
- Are there obvious performance bottlenecks?

**Error Handling:**
- Is error handling robust and appropriate?

**Comments/Documentation:**
- Are complex parts explained where necessary?

## Report Format

Your report should clearly state:

**Strengths:** Positive aspects of the code.

**Issues:** Grouped by:
- `Critical` (must fix) - breaks functionality, security issues
- `Important` (should fix) - maintainability, clarity issues
- `Minor` (suggestion) - nice-to-have improvements

**Overall Assessment:**
- "Approved" - no issues
- "Approved with minor suggestions" - only Minor issues
- "Changes required" - Critical or Important issues found
"""
)
```
