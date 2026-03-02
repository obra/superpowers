---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Evidence Format

All verification claims must include one or more of these evidence types. Reports without required evidence are rejected with: **"Missing evidence. Required: [type]."**

| Type | Use when | Must contain |
|------|----------|-------------|
| **Command** | Running tests, builds, linters | Command, verbatim output (last 50 lines), exit code |
| **Citation** | Spec/requirements review | file:line reference, code excerpt, verdict per requirement |
| **Diff** | Reporting implementation complete | `git diff --stat`, commit SHA |

**Which context requires which type:**

| Situation | Required evidence |
|-----------|-----------------|
| "Tests pass" | Command (test runner output) |
| "Build succeeded" | Command (build output, exit 0) |
| "Requirements met" | Citation (each requirement checked) |
| "Agent completed task" | Diff (VCS changes confirmed) + Command (test output) |
| "Spec compliant" | Citation (file:line per spec item) |
| "Implementation done" | Diff + Command |

**Re-review loop bound:** After 3 rejection cycles on the same claim, escalate to the user with the full rejection history rather than looping again.

## Common Failures

| Claim | Required evidence | Not sufficient |
|-------|----------|----------------|
| Tests pass | Command: test output, 0 failures | Previous run, "should pass" |
| Linter clean | Command: linter output, 0 errors | Partial check, extrapolation |
| Build succeeds | Command: build output, exit 0 | Linter passing, logs look good |
| Bug fixed | Command: original symptom now passes | Code changed, assumed fixed |
| Regression test works | Command: red-green cycle verified | Test passes once |
| Agent completed | Diff: VCS changes + Command: tests pass | Agent reports "success" |
| Requirements met | Citation: line-by-line per requirement | Tests passing |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ≠ excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**
```
✅ Agent reports success → Check git diff --stat → Verify commit SHA → Run tests → Report actual state
   Evidence: Diff (VCS changes) + Command (test output)
❌ Trust agent report without diff or test evidence
```

## Why This Matters

From observed failure patterns:
- Users have reported "I don't believe you" - trust broken
- Undefined functions shipped - would crash
- Missing requirements shipped - incomplete features
- Time wasted on false completion → redirect → rework
- Violates: "Honesty is a core value. If you lie, you'll be replaced."

## State Integration

Verification results may optionally be recorded in `.superpowers/state.yml` at key milestones:

```yaml
verification:
  last_run: 2026-03-01T14:22:00Z
  task: 3
  result: pass  # pass | fail
  evidence_type: command
```

This allows session-resume to know the last verified state without re-running all checks.

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

**Rule applies to:**
- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion/correctness

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.

## Integration

**Called by:**
- **subagent-driven-development** — REQUIRED after each task completion
- **agent-team-driven-development** — REQUIRED for implementer completion reports
- **executing-plans** — REQUIRED before marking any task done
- **requesting-code-review** — reviewer uses evidence format for findings

**Pairs with:**
- **requesting-code-review** — reviewer uses the canonical evidence format defined here
- **finishing-a-development-branch** — final verification before merge/PR
