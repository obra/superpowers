# Security Reviewer Prompt Template

Use this template when dispatching a security-focused reviewer subagent.

**Purpose:** Identify security vulnerabilities, risks, and compliance issues

**Only dispatch after code quality review passes.**

```
Task tool (superpowers:security-reviewer):
  Use template at requesting-code-review/security-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
```

**Security reviewer returns:** Vulnerabilities (Critical/High/Medium/Low), Risk Assessment, Recommendations
