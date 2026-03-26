# Code Quality Reviewer Prompt Template

Use this template when spawning a code quality reviewer as an Agent Team member.

**Dispatch method:** `Agent(team_name="<team>", name="quality-rev-task-N", model="opus", prompt="<below>")`

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only spawn after spec compliance review passes.**

```
Agent(team_name="<team>", name="quality-rev-task-N", model="opus"):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
