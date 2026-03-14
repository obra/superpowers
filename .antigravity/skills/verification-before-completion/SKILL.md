---
name: verification-before-completion
description: Use before claiming work is complete, fixed, passing, or successful - requires running verification commands and reading output before making any success claims
---

# Verification Before Completion

> **This skill mirrors the `/verification-before-completion` workflow.**

## Overview

**Core principle:** Evidence before claims, always. No completion claims without fresh verification evidence.

## The Gate Function

```text
BEFORE claiming any status:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh)
3. READ: Full output, check exit code
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim
```

## Common Failures

| Claim          | Requires                | Not Sufficient  |
| -------------- | ----------------------- | --------------- |
| Tests pass     | Test output: 0 failures | "Should pass"   |
| Build succeeds | Build: exit 0           | "Linter passed" |
| Bug fixed      | Original symptom passes | "Code changed"  |

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit without verification
- **ANY wording implying success without running verification**

## The Bottom Line

Run the command. Read the output. THEN claim the result. Non-negotiable.
