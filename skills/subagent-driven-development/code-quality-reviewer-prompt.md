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
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**🔒 Security Review (MANDATORY):**
The code reviewer MUST check for security issues using the OWASP Top 10 checklist in `requesting-code-review/code-reviewer.md`:
- Injection prevention (SQL, XSS, command injection)
- Authentication and authorization
- Hardcoded secrets or credentials
- Input validation and sanitization
- Secure dependency versions
- Path traversal prevention
- Proper error handling (no sensitive data in errors)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
