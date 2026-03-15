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

## Triage Rules

- Fix all Critical issues before proceeding.
- Fix Important issues unless user explicitly defers.
- Track Minor issues for later.
- Push back with evidence when feedback is incorrect.

## Output Requirement

Review must include severity, file references, security findings (if applicable), and merge readiness verdict.
