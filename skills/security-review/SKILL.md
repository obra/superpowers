---
name: security-review
description: Use when implementation is complete and before merging, committing, or claiming code is ready - catches injection, auth, data exposure, dependency, and configuration vulnerabilities
---

# Security Review

## Overview

Shipping code without security review is shipping vulnerabilities to production.

Every code change is a potential attack surface. Review BEFORE merge, not after incident.

**Violating the letter of this process is violating the spirit of security.**

## The Iron Law

```text
NO MERGE WITHOUT SECURITY CHECKLIST COMPLETION
```

If you haven't checked every category below against the diff, you cannot claim code is ready.

## When to Use

**Always before:**
- Merging to main/production branch
- Marking pull requests as merge-ready (or requesting final approval)
- Claiming implementation is complete

**Especially when:**
- Code handles user input
- Authentication or authorization logic changed
- New dependencies added
- Configuration or environment variables modified
- APIs or endpoints added/changed

## The Security Checklist

**You MUST check EVERY category against the actual diff. Skipping a category = skipping the review.**

### 1. Input Validation
- [ ] All user input sanitized/validated before use
- [ ] No string concatenation in SQL, shell commands, or HTML output
- [ ] File paths validated against traversal (no unvalidated `../`)
- [ ] Deserialization of untrusted data uses safe parsers

### 2. Authentication & Authorization
- [ ] Auth checks on every protected endpoint/route
- [ ] No privilege escalation paths (user accessing admin resources)
- [ ] Session tokens generated securely, expired appropriately
- [ ] No auth bypass via parameter manipulation

### 3. Data Exposure
- [ ] No secrets, keys, or credentials hardcoded or committed
- [ ] Sensitive data excluded from logs and error messages
- [ ] PII encrypted at rest and in transit
- [ ] API responses do not leak internal state or stack traces

### 4. Dependencies
- [ ] New dependencies checked for known vulnerabilities
- [ ] No unnecessary permissions or scopes in dependency usage
- [ ] Lock files updated and committed

### 5. Configuration
- [ ] Debug/development modes disabled for production
- [ ] CORS policy restricts to required origins only
- [ ] Security headers present (CSP, HSTS, X-Frame-Options)
- [ ] Error handling does not expose internals to users

## Hard Gate

```text
BEFORE claiming merge-ready:

1. DIFF:   Review every changed file in the diff
2. CHECK:  Walk each checklist category above
3. FLAG:   Note any items that need attention
4. FIX:    Resolve flagged items before proceeding
5. VERIFY: Confirm fixes don't introduce new issues

Skip any step = security review not completed
```

## Red Flags - STOP

- Merging without reviewing the diff for security
- "No user input in this change" (verify, don't assume)
- "It's an internal API" (internal APIs get compromised)
- "I'll add security later" (later never comes)
- "Tests pass so it's secure" (tests check functionality, not security)
- Hardcoded strings that look like tokens, keys, or passwords
- `eval()`, `exec()`, raw SQL, `innerHTML` with user data

**Any of these mean: STOP. Complete the checklist.**

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "No user-facing changes" | Internal code still processes external data. Check it. |
| "It's behind auth" | Auth doesn't prevent injection by authenticated users. |
| "Small change, low risk" | Largest breaches started with small oversights. |
| "Security team will catch it" | You ARE the first line. Don't shift responsibility. |
| "Just a dependency update" | Dependency updates are a top attack vector. Check CVEs. |
| "Tests cover this" | Tests verify behavior, not security. Different concerns. |
| "Same pattern as before" | Previous pattern may also be vulnerable. Verify both. |
| "Will fix in follow-up PR" | Vulnerabilities in production don't wait for follow-ups. |

## Quick Reference

| Category | Key Checks | Common Vulnerabilities |
|----------|-----------|----------------------|
| **Input** | Sanitize, parameterize, validate | SQLi, XSS, command injection, path traversal |
| **Auth** | Check every route, no escalation | Broken auth, IDOR, missing checks |
| **Data** | No secrets in code/logs, encrypt | Credential leaks, PII exposure |
| **Deps** | Check CVEs, lock files | Supply chain attacks, known vulns |
| **Config** | No debug mode, strict CORS | Misconfiguration, header omission |

## Integration with Other Skills

- **REQUIRED:** Use `superpowers:verification-before-completion` to verify security fixes actually work
- **RECOMMENDED:** Use `superpowers:requesting-code-review` for a second set of eyes on security-sensitive changes
- **PAIRS WITH:** `superpowers:finishing-a-development-branch` -- security review should happen before presenting merge options

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Reviewing only new files | Review ALL changed files in the diff |
| Skipping categories without changes | Briefly confirm -- changes can have indirect effects |
| Checking once, not after fixes | Re-check after every security fix |
| Generic "looks secure" statement | Specific per-category confirmation with evidence |
