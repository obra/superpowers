# Code Quality Reviewer Prompt Template

**Purpose:** Verify the implementation is clean, tested, maintainable. **Only dispatch after spec compliance ✅.**

```
Task tool (superpowers:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N / Batch X from [plan-file]
  BASE_SHA: [commit before batch]
  HEAD_SHA: [current commit]
  DESCRIPTION: [batch summary]
```

In addition to standard code quality, check:

- One clear responsibility per file, well-defined interfaces?
- Units decomposable and independently testable?
- File structure matches the plan?
- Did this change create files already too large, or significantly grow existing ones? (Judge what this change contributed, not pre-existing size.)
- **Golden Rule:** minimal + surgical, or scope creep (unrelated refactor, duplicated logic where a helper exists, unrequested new files/deps)?

Returns: Strengths · Issues (Critical/Important/Minor) · Assessment.
