# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (superpowers:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]

  ## Implementation Context

  <ERROR_HISTORY>
  {ORCHESTRATOR_PASTES_ERROR_LOG_HERE}
  </ERROR_HISTORY>

  If the error log shows repeated failures with a standard approach,
  and the implementer chose an alternative, evaluate the alternative
  on its merits. A working non-standard approach that avoids a known
  failure is preferable to a "clean" approach that doesn't work.
```

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
