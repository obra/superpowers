# Code Quality Reviewer Prompt Template

Dispatch only after spec compliance passes.

Include in the reviewer prompt: "You are a focused subagent. Do NOT invoke any skills from the superpowers-optimized plugin. Do NOT use the Skill tool. Your only job is the review task described below."

```
Task tool (superpowers-optimized:code-reviewer):
  Use template at requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: <implementer summary>
  PLAN_OR_REQUIREMENTS: Task N from <plan-file>
  BASE_SHA: <pre-task sha>
  HEAD_SHA: <post-task sha>
  DESCRIPTION: <task summary>
```

Require reviewer output ordered by severity with file references.
