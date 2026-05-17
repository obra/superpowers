# Code Quality Reviewer Prompt Template

Dispatch only after spec compliance passes.

Include in the reviewer prompt: "You are a focused subagent. Do NOT invoke any skills from the superpowers-prepared plugin. Do NOT use the Skill tool. Your only job is the review task described below."

```
Task tool (superpowers-prepared:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: <implementer summary>
  PLAN_OR_REQUIREMENTS: Task N from <plan-file>
  BASE_SHA: <pre-task sha>
  HEAD_SHA: <post-task sha>
  DESCRIPTION: <task summary>
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
