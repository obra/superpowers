# Code Quality Reviewer Prompt Template

Use this template when spawning a code quality reviewer sub-agent or custom agent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Code-reviewer sub-agent / custom agent:
  Use template at ../requesting-code-review/code-reviewer.md

  TASK_PACKET: [helper-built task packet]
  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  APPROVED_PLAN_PATH: [exact approved plan path for plan-routed final review, otherwise blank]
  EXECUTION_EVIDENCE_PATH: [helper-reported evidence path for plan-routed final review, otherwise blank]
  BASE_BRANCH: [detected base branch]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the task packet?
- Is there work outside planned file decomposition?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)
- Did this implementation introduce new files or abstractions outside packet scope?

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
