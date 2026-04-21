---
name: verification-before-completion
description: Use before claiming work is complete, fixed, or passing at a sprint boundary
---

# Verification Before Completion

Evidence before claims.

## Iron Law

```
NO USER-VISIBLE OR IRREVERSIBLE COMPLETION CLAIM WITHOUT FRESH VERIFICATION
```

Progress notes within a sprint are not completion claims. The Iron Law applies at sprint boundaries, not after every edit.

## Gate

Before a completion claim:
1. Identify the command that proves it.
2. Run it fresh. Read full output, exit code, failure count.
3. Only then state the claim, with evidence.

## When To Apply

**Always before:**
- PR creation, merge commit, push to shared branch
- Claim of end-of-sprint / end-of-plan / major-feature complete
- Bug-fixed claim once the fix touched main
- Destructive ops
- Handoff to CI, deploy, customer-facing systems
- Closing a batch review or dismissing reviewer feedback

**Not required for:**
- Intermediate commits inside a sprint
- "Task 2 done, moving on" progress notes
- Exploratory runs followed by more work
- Internal subagent status reports (verify the batch, not each step)

## Common Failures

| Claim | Requires | Not enough |
|-------|----------|------------|
| Tests pass | Test command output: 0 failures | Previous run |
| Build succeeds | Build command: exit 0 | Linter passing |
| Bug fixed | Original-symptom test passes | Code changed |
| Regression test works | Red-green cycle verified | Passes once |
| Agent completed | VCS diff shows changes | Agent reports success |
| Requirements met | Line-by-line checklist | Tests passing |

## Patterns

**Regression tests (TDD red-green):** write → run (pass) → revert fix → run (MUST FAIL) → restore → run (pass).

**Agent delegation:** agent reports success → inspect diff → report actual state.

**Requirements:** re-read plan → checklist → verify each → report gaps or completion.
