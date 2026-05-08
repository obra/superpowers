---
name: security-audit
description: Use when performing a security review, checking for vulnerabilities, or auditing dependencies
---

# Security Audit

## Overview

Security cannot be "sprinkled on" at the end. It must be systematically audited. Guessing at vulnerabilities leads to a false sense of security.

**Core principle:** ALWAYS identify the attack surface and data flow before searching for vulnerabilities.

## The Iron Law

```
NO VULNERABILITY FIXES WITHOUT A SYSTEMATIC AUDIT FIRST
```

If you haven't completed Phase 1 and 2, you cannot claim a system is "secure" or propose "hardening" fixes.

## When to Use

Use for ANY security-related task:
- Auditing a new codebase
- Checking for CVEs in dependencies
- Reviewing sensitive code (auth, crypto, file I/O)
- Responding to a reported vulnerability
- Performing a "sanity check" before a release

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Attack Surface Discovery

**BEFORE searching for bugs:**

1. **Map Entry Points**
   - Identify all ways data enters the system (APIs, CLI flags, Environment variables, Files, Network sockets).
   - Use `attack-surface.md` in this directory for mapping techniques.

2. **Identify Trust Boundaries**
   - Where does untrusted user data meet trusted system logic?
   - Note where data crosses between different permissions or systems.

3. **List High-Value Targets**
   - Where is the sensitive data (PII, credentials, financial data)?
   - Which code paths have the most "power" (filesystem access, shell execution)?

### Phase 2: Dependency Audit

**Check the foundation:**

1. **Audit Package Manifests**
   - Use standard tools: `npm audit`, `pip audit`, `cargo audit`, `go list -m all`.
   - Don't just look for "high" severity - understand what the vulnerabilities actually are.

2. **Check for "Shadow" Dependencies**
   - Look for vendored code or manual downloads that aren't tracked by package managers.

3. **Verify Lockfiles**
   - Ensure lockfiles exist and match the manifest.

### Phase 3: Systematic Static Analysis

**Search for patterns, not just bugs:**

1. **Secret Scanning**
   - Search for hardcoded keys, passwords, and tokens.
   - `grep -rEi "api_key|password|secret|token" .`

2. **Pattern Matching**
   - Use `vulnerability-patterns.md` to search for common flaws:
     - **Injection:** SQL, Shell, Template
     - **Broken Auth:** Weak session management, hardcoded credentials
     - **Sensitive Data Exposure:** Unencrypted storage, verbose logging
     - **Broken Access Control:** Missing permission checks
     - **Insecure Deserialization:** Unsafe `pickle.load`, `eval`, etc.

3. **Trace Data Flow**
   - For every entry point identified in Phase 1, trace the data to its "sink" (e.g., database, shell, file).
   - Verify validation occurs at every layer (see `defense-in-depth.md` in `systematic-debugging`).

### Phase 4: Verification and Reporting

**Prove the vulnerability exists before fixing:**

1. **Create Proof of Concept (PoC)**
   - Can you trigger the vulnerability?
   - A PoC is the security equivalent of a "failing test case."
   - DO NOT perform destructive PoCs on production systems.

2. **Categorize Risk**
   - Impact (How bad is it?) x Likelihood (How easy is it to trigger?)
   - Use CVSS-like thinking (Low, Medium, High, Critical).

3. **Propose Systematic Fixes**
   - Don't just "sanitize" the specific input. Fix the root cause (e.g., use parameterized queries instead of string concatenation).

## Red Flags - STOP and Follow Process

If you catch yourself thinking:
- "I'll just run a scanner and fix what it finds" (Scanners miss context-specific logic flaws).
- "This code looks safe enough" (Assumptions are the root of all vulnerabilities).
- "We don't need to check dependencies, they're popular" (Popularity != Security).
- "I'll fix this one SQLi I found and we're done" (Where there is one, there are usually more).
- "I don't need to map entry points, I know the code" (You will miss something).

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's an internal tool, no risk" | Internal tools are often the entry point for lateral movement. |
| "Users are trusted" | Accounts can be compromised. Malicious insiders exist. |
| "We use a framework, it's secure" | Frameworks can be misused or have their own vulns. |
| "The code is too complex to audit" | Complexity is where vulnerabilities hide. Simplify or audit harder. |

## Supporting Techniques

- **`attack-surface.md`** - Mapping entry points and trust boundaries.
- **`vulnerability-patterns.md`** - Common flaws and grep patterns.
- **`defense-in-depth.md`** (in `systematic-debugging`) - For verifying multi-layer validation.
