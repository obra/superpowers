---
name: verification-before-completion
description: >
  Invoke BEFORE saying "done", "tests pass", "ready to merge", or any
  completion claim. Requires fresh command output as evidence — no
  completion without proof. Also routed by using-superpowers at task end.
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

## Self-Consistency Verification

When the verification reasoning is non-trivial (multi-step inference, ambiguous evidence, or configuration changes), apply multi-path reasoning (see `self-consistency-reasoner`) before declaring the verdict:

1. Generate 3 **independent** reasoning paths evaluating: "Does this evidence actually prove the claim?"
2. Each path should approach the evaluation differently: one checks what the evidence proves, one checks what it *doesn't* prove, one considers alternative explanations for the output.
3. Take the majority-vote verdict:
   - **All agree "verified"**: claim is proven.
   - **Majority agrees but minority dissents**: flag what the dissenting path identified — it may reveal a gap in the evidence.
   - **No majority**: evidence is insufficient. Do not claim completion. State what additional evidence is needed.

This prevents the most expensive verification failure: confidently declaring "done" based on evidence that doesn't actually prove what you think it proves.

## Configuration Change Verification

When a change affects provider selection, feature flags, environment variables, or credentials:

Do not claim success based on operation success alone. Verify the **outcome reflects the intended change**.

| Change | Insufficient | Required |
|--------|-------------|----------|
| Switch API/LLM provider | Status 200 | Response contains expected provider or model name |
| Enable feature flag | No errors | Feature behavior is actually active |
| Change environment | Deploy succeeds | Logs or env vars reference the new environment |
| Set credentials | Auth succeeds | Authenticated identity or context is correct |

**Gate:**
1. Identify: what should be *different* after this change?
2. Locate: where is that difference observable? (response field, log line, runtime behavior)
3. Run: a command that shows the observable difference.
4. Verify: output contains the expected difference — not just that the operation completed.
