---
name: end-to-end-validation
description: Use when you need to validate user-visible behavior for real user flows with deterministic commands and evidence artifacts before final completion.
---

# End-to-End Validation

## When to Use
Use before claiming a feature works for real user flows.

## Required command contract
1. Identify one canonical e2e command.
2. Run command with deterministic env vars.
3. Save output artifact JSON.
4. Report pass/fail with evidence.

## Failure taxonomy
- CONFIG_ERROR
- ENV_ERROR
- CHECK_FAIL
- NON_DETERMINISM
- INTERNAL_ERROR
