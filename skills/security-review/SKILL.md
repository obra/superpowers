---
name: security-review
description: Use when working with authentication, authorization, secrets, cryptography, wallet integrations, private keys, API tokens, or handling sensitive user data
---

# Security Review

## Overview

Security vulnerabilities shipped to production are catastrophic. Quick implementations bypass critical safeguards.

**Core principle:** ALWAYS verify security controls before shipping code that handles sensitive data.

**Violating the letter of this process is violating the spirit of security.**

## The Iron Law

```
NO CODE TOUCHING SECRETS WITHOUT SECURITY REVIEW FIRST
```

If you haven't completed the security checklist, you cannot ship code handling sensitive data.

## When to Use

Use for ANY code involving:
- Private keys, mnemonics, seed phrases
- API tokens, credentials, passwords
- Authentication/authorization flows
- Cryptographic operations
- Wallet integrations (Web3, crypto)
- User PII (personal identifiable information)
- Payment processing
- Session management

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make shortcuts tempting)
- "Just logging for debugging" seems harmless
- Implementing third-party auth integrations
- Handling blockchain transactions

**Don't skip when:**
- Issue seems simple (simple code leaks secrets too)
- You're in a hurry (security debt is expensive)
- "It's just internal" (internal breaches happen)

## The Four Gates

You MUST pass each gate before shipping.

### Gate 1: Secret Storage Verification

**NEVER store secrets in:**
- Source code (hardcoded)
- Plain text files
- Logs or console output
- Version control
- Client-side storage (localStorage, cookies without httpOnly)

**ALWAYS use:**
- Secure storage APIs (Keychain, Keystore, flutter_secure_storage)
- Environment variables (server-side only)
- Secret management services (Vault, AWS Secrets Manager)

**Verification checklist:**
```
[ ] grep -r "private" --include="*.{ts,js,dart,py}" | review for hardcoded keys
[ ] grep -r "secret" --include="*.{ts,js,dart,py}" | review for hardcoded secrets
[ ] grep -r "mnemonic" | ensure NO plaintext storage
[ ] grep -r "seed" | ensure NO plaintext storage
[ ] Check .gitignore includes: .env, *.pem, *.key, credentials.*
```

### Gate 2: Logging & Output Audit

**NEVER log or print:**
- Private keys
- Mnemonics or seed phrases
- Passwords or API tokens
- Full credit card numbers
- Session tokens

**Verification checklist:**
```
[ ] Search for console.log/print/logger calls near sensitive operations
[ ] Verify error handlers don't expose secrets in stack traces
[ ] Check crash reporting excludes sensitive fields
[ ] Review debug flags are disabled in production builds
```

### Gate 3: Input Validation & Sanitization

**ALWAYS validate at boundaries:**
- User input (forms, URLs, file uploads)
- External API responses
- Database queries (prevent injection)
- File paths (prevent traversal)

**For crypto/wallet operations:**
```
[ ] Validate addresses before transactions (checksum verification)
[ ] Verify transaction amounts are within expected ranges
[ ] Confirm chain ID matches expected network
[ ] Check gas estimation BEFORE transaction signing
```

### Gate 4: Secure Communication

**ALWAYS ensure:**
- HTTPS for all external communication
- Certificate pinning for sensitive APIs
- Encrypted storage for data at rest
- Secure RPC endpoints for blockchain

**Verification checklist:**
```
[ ] No HTTP URLs in production code
[ ] API clients enforce TLS
[ ] WebSocket connections use WSS
[ ] RPC endpoints use HTTPS
```

## Transaction Security (Web3/Crypto)

**Critical flow for ANY transaction:**

1. **Gas estimation FIRST** - Always estimate before signing
2. **User confirmation** - Clear display of amount + fees
3. **Sign in isolated scope** - No key exposure outside signing
4. **Broadcast and monitor** - Track until confirmed
5. **Handle failures gracefully** - No stuck transactions

**Red flags in transaction code:**
- Signing without user confirmation
- Hardcoded gas values
- Missing nonce management
- No RPC fallback strategy

## Red Flags - STOP and Review

If you catch yourself thinking:
- "Just log the key for debugging"
- "It's encrypted anyway"
- "Only internal users have access"
- "I'll remove it before production"
- "The secret is in an environment variable" (client-side)
- "It's just a test key"

**ALL of these mean: STOP. Complete security review.**

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Just for debugging" | Debug logs ship to production. Remove before commit. |
| "It's encrypted" | Encryption keys can leak too. Defense in depth. |
| "Internal only" | Internal breaches happen. Treat all data as sensitive. |
| "Test environment" | Test credentials often match production. Never expose. |
| "I'll fix it later" | Security debt compounds. Fix now or don't ship. |
| "Too slow to encrypt" | Performance is not an excuse for insecurity. |

## Quick Reference

| Gate | Key Checks | Failure = Block |
|------|-----------|-----------------|
| **1. Storage** | No hardcoded secrets, secure APIs only | Secrets in code |
| **2. Logging** | No sensitive data in logs/output | Keys in console |
| **3. Validation** | All inputs validated, addresses verified | Injection possible |
| **4. Communication** | HTTPS only, cert pinning | HTTP in production |

## OWASP Top 10 Checklist

Before shipping, verify against common vulnerabilities:

- [ ] **Injection** - Parameterized queries, no string concatenation
- [ ] **Broken Auth** - Secure session management, MFA support
- [ ] **Sensitive Data Exposure** - Encryption at rest and in transit
- [ ] **XXE** - Disable external entity processing
- [ ] **Broken Access Control** - Verify authorization on every request
- [ ] **Security Misconfiguration** - No default credentials, minimal permissions
- [ ] **XSS** - Output encoding, CSP headers
- [ ] **Insecure Deserialization** - Validate before deserializing
- [ ] **Using Components with Known Vulnerabilities** - Dependency audit
- [ ] **Insufficient Logging** - Audit logs for security events

## Related Skills

- **superpowers:verification-before-completion** - Verify security controls work before shipping
- **superpowers:systematic-debugging** - Investigate security issues systematically

## Real-World Impact

Security failures are irreversible:
- Leaked private keys = stolen funds (cannot recover)
- Exposed API tokens = account compromise
- Logged passwords = breach notification required
- Hardcoded credentials = CVE publication

**The cost of security review: minutes. The cost of a breach: reputation, money, users.**
