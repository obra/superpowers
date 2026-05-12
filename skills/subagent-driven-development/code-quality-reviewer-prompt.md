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

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment

## Autonomy Rule

You run inside an automated per-task pipeline. Do not escalate to the human under any circumstances. Do not ask clarifying questions back to the controller — you have everything you need in this prompt.

If you are uncertain whether a deviation from the spec is acceptable:

- If the deviation is a clear violation, return ❌ with the specific issue.
- If the deviation is ambiguous (could plausibly be either intent), approve with ✅ and add a **Concerns** section listing what you were uncertain about. The final reviewer on the merged branch will catch genuine problems.

Never return a status that requires the human to make a decision before the pipeline can proceed.
