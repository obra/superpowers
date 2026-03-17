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

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Quick Reference

| Action | Verification Required |
|--------|----------------------|
| "Tests pass" | Run test suite, show 0 failures |
| "Build succeeds" | Run build, show exit 0 |
| "Bug fixed" | Reproduce original symptom, show it's gone |
| "Ready to merge" | Tests + build + requirements checklist |
| "Agent completed" | Check VCS diff independently |

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
| "I'm confident" | Confidence does not equal evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter does not equal compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion does not equal excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
OK  [Run test command] [See: 34/34 pass] "All tests pass"
BAD "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
OK  Write -> Run (pass) -> Revert fix -> Run (MUST FAIL) -> Restore -> Run (pass)
BAD "I've written a regression test" (without red-green verification)
```

**Build:**
```
OK  [Run build] [See: exit 0] "Build passes"
BAD "Linter passed" (linter doesn't check compilation)
```

**Requirements:**
```
OK  Re-read plan -> Create checklist -> Verify each -> Report gaps or completion
BAD "Tests pass, phase complete"
```

**Agent delegation:**
```
OK  Agent reports success -> Check VCS diff -> Verify changes -> Report actual state
BAD Trust agent report
```

## Why This Matters

From repeated verification failures observed across sessions:
- User said "I don't believe you" — trust broken
- Undefined functions shipped — would crash in production
- Missing requirements shipped — incomplete features
- Time wasted on false completion, redirect, rework
- Unverified claims erode user trust and create compounding rework cycles

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

## Integration

**Use with every workflow:**
- **superpowers:systematic-debugging** - Verify fix worked before claiming bug resolved
- **superpowers:subagent-driven-development** - Verify each subagent's work independently
- **superpowers:dispatching-parallel-agents** - Verify each parallel agent's results before integrating

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
