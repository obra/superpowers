---
name: security-review
description: Use when reviewing code for security vulnerabilities, especially for financial services, authentication, data handling, or API endpoints
---

# Security Review

## Overview

Security review identifies vulnerabilities in code before they reach production. For financial services applications, security review is **mandatory** and uses **strict** severity blocking (Critical and High issues must be fixed).

**Core principle:** Find security issues early - fixing vulnerabilities in development is 10-100x cheaper than in production.

## When to Use

- Any code handling authentication or authorization
- Any code handling sensitive data (PII, financial, M&A)
- Any code with OAuth/token management
- Any API endpoints
- Any database queries with user input
- Any file uploads or external integrations

## Security Checklist

### CRITICAL (Must Block) 🛑

| Category | What to Check |
|----------|---------------|
| **Hardcoded Secrets** | API keys, passwords, tokens in source code |
| **SQL Injection** | Raw queries with unsanitized user input |
| **Command Injection** | Shell commands with user input |
| **Authentication Bypass** | Missing auth on sensitive endpoints |
| **Broken Access Control** | Missing permission checks, privilege escalation |
| **Token Exposure** | Tokens in logs, URLs, localStorage |
| **Missing Encryption** | Sensitive data unencrypted at rest or in transit |

### HIGH (Should Block) ⚠️

| Category | What to Check |
|----------|---------------|
| **Input Validation** | Missing or client-side only validation |
| **Session Issues** | Weak tokens, no timeout, fixation vulnerabilities |
| **IDOR** | Direct object references without authorization |
| **Missing Rate Limiting** | No protection against brute force |
| **Vulnerable Dependencies** | Known CVEs in packages |
| **Audit Logging** | No logging of security events |

### MEDIUM (Warn) 📝

| Category | What to Check |
|----------|---------------|
| **Missing Headers** | No CSP, X-Frame-Options, X-Content-Type-Options |
| **CORS Issues** | Overly permissive cross-origin access |
| **Cookie Flags** | Missing HttpOnly, Secure, SameSite |
| **Verbose Errors** | Stack traces or internals exposed |

## Quick Reference: Common Vulnerabilities

### SQL Injection
```javascript
// ❌ BAD - vulnerable
db.query(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ GOOD - parameterized
db.query('SELECT * FROM users WHERE id = $1', [userId])
```

### Token Storage
```javascript
// ❌ BAD - accessible to XSS
localStorage.setItem('token', accessToken)

// ✅ GOOD - httpOnly cookie (set by server)
// Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict
```

### Secrets Management
```javascript
// ❌ BAD - hardcoded
const API_KEY = 'sk_live_abc123'

// ✅ GOOD - environment variable
const API_KEY = process.env.API_KEY
```

### Authorization Check
```javascript
// ❌ BAD - no ownership check
app.get('/deal/:id', async (req, res) => {
  const deal = await Deal.findById(req.params.id)
  res.json(deal)
})

// ✅ GOOD - verify ownership
app.get('/deal/:id', async (req, res) => {
  const deal = await Deal.findById(req.params.id)
  if (deal.ownerId !== req.user.id) return res.status(403).send('Forbidden')
  res.json(deal)
})
```

## Financial Services Context

For investment banking, M&A, and due diligence applications:

| Data Type | Required Protection |
|-----------|---------------------|
| Deal information | Encryption at rest, strict access control, audit logging |
| Email/OAuth tokens | Encrypted storage, secure cookies, token rotation |
| Buyer communications | TLS in transit, access logging, data retention policies |
| User credentials | Hashed passwords (bcrypt), MFA support |

**Regulatory considerations:**
- SOC2 compliance requires audit trails
- GDPR requires data protection and breach notification
- Financial regulations may require specific encryption standards

## Integration

**Used by:**
- **superpowers:subagent-driven-development** - Security review step in three-stage review process

**Complements:**
- **superpowers:test-driven-development** - Security tests should be part of TDD
- **superpowers:verification-before-completion** - Verify security fixes work

## Skip Option

Security review can be skipped ONLY with explicit user confirmation:

1. User must state: "Skip security review for [task name]"
2. User must provide reason
3. Skip is logged in commit message

**Never skip for:**
- Authentication/authorization code
- Data handling code
- OAuth/token management
- API endpoints
- Database operations

## Resources

- [OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
