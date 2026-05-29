# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (general-purpose):
  Use template at requesting-code-review/code-reviewer.md

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)
- Are the same runtime mechanics (API calls, parsing, validation, payload transforms) duplicated across multiple files? If so, flag extracting them into one reusable service-layer module, keeping domain policy (auth, business rules, error classification) in the calling route/action.
- If you recommend an extraction, is it behavior-preserving and a small, focused diff? (No whole-app refactor, no naming churn — cleanup is scoped to what this change touched.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
