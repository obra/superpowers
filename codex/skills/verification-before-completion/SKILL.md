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

## Team-Driven Completion Gate

In team-driven mode, the main Codex session is orchestration-only. Worker self-reports, summaries, and "done" messages are inputs for review, not completion evidence.

Before claiming delegated work is complete, evidence must include:

1. A separate reviewer subagent verdict final line of `Verdict: APPROVE` for every worker task created with `spawn_agent`.
2. Every reviewer `Verdict: REJECT` finding sent back to the worker with `send_input`, reworked, and reviewed again by a separate reviewer subagent until the final line is `Verdict: APPROVE`. If the original worker is closed, try `resume_agent`; if that is unavailable or unsuitable, spawn a replacement worker with the prior diff, reviewer findings, exact ownership boundaries, and rework instructions.
3. A final main-session inspection of the integrated diff and relevant test or verification output.

Reviewer output may include explanation, but the final verdict line must be exactly `Verdict: APPROVE` or `Verdict: REJECT`. Anything else is not a completion gate result.

## Common Claims And Required Evidence

| Claim | Required evidence |
| --- | --- |
| Tests pass | Fresh test command exits 0 with no failures. |
| Compatibility check passes | Fresh compatibility test exits 0. |
| Build succeeds | Fresh build command exits 0. |
| Bug fixed | A regression check for the original symptom passes. |
| Requirements met | Requirement checklist has been re-read and matched to implementation. |
| Delegated work integrated | Team-driven completion gate is satisfied, then diff and verification have been reviewed locally. |
| No executable test harness exists | Smallest deterministic fallback validation, such as a compatibility script, schema check, focused command, or documented inspection checklist, has fresh evidence. |

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
