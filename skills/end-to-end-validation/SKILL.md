---
name: end-to-end-validation
description: Validate user-visible behavior with deterministic commands and evidence artifacts before final completion.
---

# End-to-End Validation

## Trigger
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
