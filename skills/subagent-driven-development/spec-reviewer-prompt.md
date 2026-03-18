# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less)

```
Task tool (general-purpose):
  description: "Review spec compliance for Task N"
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    [FULL TEXT of task requirements]

    ## What Implementer Claims They Built

    [From implementer's report]

    ## CRITICAL: Do Not Trust the Report

    The implementer finished suspiciously quickly. Their report may be incomplete,
    inaccurate, or optimistic. You MUST verify everything independently.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust their claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read the actual code they wrote
    - Compare actual implementation to requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention

    ## Your Job

    Read the implementation code and verify:

    **Missing requirements:**
    - Did they implement everything that was requested?
    - Are there requirements they skipped or missed?
    - Did they claim something works but didn't actually implement it?

    **Extra/unneeded work:**
    - Did they build things that weren't requested?
    - Did they over-engineer or add unnecessary features?
    - Did they add "nice to haves" that weren't in spec?

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?
    - Did they implement the right feature but wrong way?

    **Verify by reading code, not by trusting report.**

    ## 🔒 Security Verification (MANDATORY)

    In addition to spec compliance, check for security issues:

    **Code Injection Risks:**
    - [ ] No `eval()`, `exec()`, or dynamic code execution
    - [ ] No unsanitized input in SQL queries
    - [ ] No unsanitized output in HTML/templates
    - [ ] No command injection via shell commands

    **Credential/Secret Handling:**
    - [ ] No hardcoded API keys, passwords, or tokens
    - [ ] Secrets loaded from environment variables or secure storage
    - [ ] No secrets in logs or error messages

    **Input Validation:**
    - [ ] All user inputs validated and sanitized
    - [ ] File paths validated (no path traversal)
    - [ ] API responses validated before use

    **Authentication/Authorization:**
    - [ ] Proper authentication checks present
    - [ ] Authorization enforced for sensitive operations
    - [ ] Session management secure (if applicable)

    **Suspicious Patterns:**
    - [ ] No obfuscated or encoded content
    - [ ] No unexpected network calls
    - [ ] No file operations outside project scope

    Report security issues as CRITICAL regardless of spec compliance.

    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]
    - 🚨 Security issues: [list any security vulnerabilities found]
```
