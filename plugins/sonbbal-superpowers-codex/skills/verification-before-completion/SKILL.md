---
name: verification-before-completion
description: Use before claiming work is complete, fixed, or passing; requires fresh verification evidence.
---

# Verification Before Completion

## Core Rule

Evidence before completion claims, always.

Do not say work is complete, fixed, passing, ready, or equivalent until you have run the command or inspection that proves that exact claim in the current turn.

## Verification Gate

Before making a success claim:

1. Identify the command or inspection that proves the claim.
2. Run the full command or perform the full inspection.
3. Read the output and check the exit code.
4. Compare the result against the requirement.
5. Report the actual result.

If verification fails, state the failure and either continue fixing it or explain the blocker.

## Common Claims And Required Evidence

| Claim | Required evidence |
| --- | --- |
| Tests pass | Fresh test command exits 0 with no failures. |
| Compatibility check passes | Fresh compatibility test exits 0. |
| Build succeeds | Fresh build command exits 0. |
| Bug fixed | A regression check for the original symptom passes. |
| Requirements met | Requirement checklist has been re-read and matched to implementation. |
| Delegated work integrated | Diff and verification have been reviewed locally after the delegated result. |

## Red Flags

Stop and verify if you are about to write:

- should pass
- looks fixed
- probably works
- done
- ready
- all set

Those words require evidence first.

## Reporting

Report verification concretely:

- Command run.
- Exit status.
- Important result lines or failure summary.

No shortcuts. The verification result is the status.
