---
name: verification-before-completion
description: Use before claiming completion, correctness, or readiness for commit/PR to require fresh verification evidence.
---

# Verification Before Completion

Do not claim success without fresh command evidence.

## Gate

Before any completion claim:

1. Identify the command that proves the claim.
2. Run the full command now.
3. Inspect exit code and output.
4. State results exactly as observed.

## Applies To

- "Tests pass"
- "Bug is fixed"
- "Build succeeds"
- "Ready to merge"
- Any equivalent wording

## Not Acceptable

- "Should pass"
- "Looks good"
- Trusting old outputs
- Trusting subagent reports without verification

## Minimum Evidence Examples

- Tests: command output with zero failures
- Build: successful exit code
- Bugfix: reproduction case now passes
- Requirements: explicit checklist against plan

## Rule

If evidence is missing, report current status as unverified and run the command.
