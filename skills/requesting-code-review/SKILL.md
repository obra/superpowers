---
name: requesting-code-review
description: >
  Structured code review against requirements, quality, and security
  standards. Invoke after meaningful code changes or before merge.
  Triggers on: "review my code", "code review", "check this before
  merge", "security review", "is this secure". Routed by
  using-superpowers or executing-plans after implementation.
---

# Requesting Code Review

Request review early to catch issues before they spread.

## When

- After completing a plan task or batch
- After major refactor/feature work
- Before merge or PR finalization

## How

1. Determine review range (`BASE_SHA` -> `HEAD_SHA`).
2. Dispatch `superpowers-optimized:code-reviewer` using `requesting-code-review/code-reviewer.md`.
3. Provide:
- What changed
- Requirement or plan reference
- SHA range
- Short summary

## Security Review (Built-In)

When changes touch security-relevant areas, the code review **must** include a security pass. This is not a separate step — it's part of every review where applicable.

**Triggers automatically when changes touch:**
- Authentication or authorization flows
- Input validation or output encoding
- API endpoints handling user data
- Secrets management or credential handling
- Cryptography, key management, or token generation
- Infrastructure, deployment, or CI/CD configs

**Security checklist:**
- OWASP Top 10 and CWE vulnerability scan
- OWASP API Security Top 10: broken object/function-level authorization, unrestricted resource consumption, SSRF, mass assignment, improper inventory management
- Input validation and injection risk (SQL, XSS, CSRF, command injection)
- Auth flow correctness (session handling, token expiry, privilege escalation, rate limiting on auth endpoints)
- Secrets handling (no hardcoded credentials, proper env var usage)
- Dependency vulnerabilities (known CVEs in imported packages)
- API hardening (security headers, CORS configuration, error message sanitization, rate limiting)
- Logging hygiene (no secrets in logs, adequate audit trail)

**Severity enforcement:**
- Critical/High security findings **block merge** until addressed or the user explicitly accepts the risk with documented rationale.
- Medium security findings should be fixed before merge unless explicitly deferred.

## Adversarial Red Team (Optional)

For changes involving complex logic, concurrency, state management, or critical data paths, dispatch `superpowers-optimized:red-team` in parallel with the code reviewer.

**Triggers when changes touch:**
- State machines or multi-step workflows
- Concurrent access to shared resources
- Complex business logic with branching conditions
- Data transformation pipelines
- Retry/recovery/rollback logic
- Performance-critical paths handling large inputs

The red team agent finds concrete failure scenarios (specific inputs, race conditions, state corruption, resource exhaustion) that checklist-based review misses. It does NOT duplicate the security review — its focus is adversarial logic analysis, not OWASP/CWE compliance.

**Red team critical findings block merge** alongside security critical findings.

## Auto-Fix Pipeline

When the red team report contains Critical or High findings, run the auto-fix pipeline before proceeding. Do NOT skip findings or batch them — process each one individually in severity order (Critical first).

**For each Critical/High finding:**

1. **Write the failing test.** Take the test case skeleton from the red team report, flesh it out into a real test, and run it. It MUST fail — this proves the scenario is real. If the test passes, the finding was a false positive; skip it and note that in the triage.
2. **Fix the code.** Make the minimum change to pass the test. Do not refactor or improve surrounding code.
3. **Run the full test suite.** Confirm no regressions. If a regression appears, fix it before moving to the next finding.

**After all Critical/High findings are processed:**
- Re-run the full test suite one final time.
- Report: how many findings were real (test failed), how many were false positives (test passed), what was fixed.

**Skip conditions:**
- If the red team report has zero Critical/High findings, skip the pipeline entirely.
- Medium findings are tracked for later, not auto-fixed.
- If the user explicitly says to skip auto-fix, respect that.

## Triage Rules

- Fix all Critical issues before proceeding.
- Fix Important issues unless user explicitly defers.
- Track Minor issues for later.
- Push back with evidence when feedback is incorrect.

## Output Requirement

Review must include severity, file references, security findings (if applicable), and merge readiness verdict.
