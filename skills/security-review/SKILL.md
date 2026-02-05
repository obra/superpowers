---
name: security-review
description: Use when working with authentication, authorization, secrets, cryptography, wallet integrations, private keys, API tokens, or handling sensitive user data
---

# Security Review

## The Iron Law

```
NO CODE TOUCHING SECRETS WITHOUT SECURITY REVIEW FIRST
```

## Quick Reference

| Gate | Checks | Block If |
|------|--------|----------|
| **1. Storage** | Secure APIs only, no hardcoded secrets | Secrets in code |
| **2. Logging** | No sensitive data in logs/output | Keys in console |
| **3. Validation** | All inputs validated, addresses verified | Injection possible |
| **4. Communication** | HTTPS only, cert pinning | HTTP in production |

## Gate Details

### Gate 1: Secret Storage
**NEVER:** hardcode, plain text, logs, VCS, client localStorage
**ALWAYS:** Keychain/Keystore, flutter_secure_storage, env vars (server-side), Vault

- [ ] No hardcoded private keys, mnemonics, API tokens
- [ ] .gitignore includes: .env, *.pem, *.key, credentials.*

### Gate 2: Logging Audit
**NEVER log:** private keys, mnemonics, passwords, session tokens

- [ ] No console.log/print near sensitive operations
- [ ] Error handlers don't expose secrets in stack traces
- [ ] Debug flags disabled in production

### Gate 3: Input Validation
- [ ] User input sanitized (forms, URLs, files)
- [ ] Database queries parameterized (no injection)
- [ ] Wallet addresses validated with checksum
- [ ] Transaction amounts within expected ranges

### Gate 4: Secure Communication
- [ ] All external calls use HTTPS
- [ ] Certificate pinning for sensitive APIs
- [ ] WebSocket uses WSS, RPC endpoints use HTTPS

## Web3 Transaction Flow

1. **Gas estimation FIRST** - before signing
2. **User confirmation** - clear amount + fees display
3. **Sign in isolated scope** - no key exposure
4. **Broadcast and monitor** - track until confirmed
5. **Handle failures** - no stuck transactions

## Red Flags - STOP

- "Just log the key for debugging"
- "It's encrypted anyway"
- "Only internal users have access"
- "I'll remove it before production"
- "It's just a test key"

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Just for debugging" | Debug logs ship to production |
| "It's encrypted" | Encryption keys leak too |
| "Internal only" | Internal breaches happen |

## OWASP Reference

See: https://owasp.org/Top10/

## Related Skills

- **superpowers:verification-before-completion** - Verify controls work
- **superpowers:systematic-debugging** - Investigate issues

**Cost of review: minutes. Cost of breach: reputation, money, users.**
