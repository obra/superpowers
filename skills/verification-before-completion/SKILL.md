---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; for work with no test command (reports, research, recipes, correspondence, audits) requires re-opening the artifact and accounting for every part of the request; evidence before assertions always
---

# Verification Before Completion

## Overview

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
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

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

---

## When There Is No Test Command

### Why this section exists

Everything above assumes an external judge: a test suite, a linter, an exit code.
The machine says pass or fail and you cannot argue with it.

Most work has no such judge. Nothing can run a report, a recipe or a research
answer and return "correct". The rule does not change — **no completion claim
without evidence** — only what evidence means.

### The failure this stops

Reporting what you INTENDED to produce rather than what is actually on disk.

**If you have not re-opened the artifact in this message, you have not checked
it.** You are remembering your own intentions, which is exactly the state in
which things get missed.

### Two levels, in this order

#### 1. Prove whatever CAN be proven

Some things are as binary as a test suite:

| Claim | Evidence |
|---|---|
| Followed the required structure | Open the file. Name each required section and where it appears. |
| Sources cited | Every claim carries a reference, present and in the required format |
| Standing constraints held | Re-read start to finish. A constraint honoured in step 1 and dropped in step 8 is a failure. |
| Findings are real | Every finding points at a location — a line, a quoted span. A finding with no location was recalled, not read. |
| Data reconciles | Totals add up; numbers in the summary match numbers in the table |
| Nothing was truncated | The output ends where it should, not mid-section |

#### 2. For everything else, account for the request in full

- Break what was asked into its separate parts.
- Open what you actually produced.
- Confirm each part is addressed.
- **State plainly anything you did not do.**

Four of five things done is not "done". Say which four.

### What this does NOT claim

Confirming that work is complete, consistent and within spec does not make it
correct. A recipe can hang together perfectly and still taste wrong; a report can
follow its structure and still reach the wrong conclusion.

**Say which you verified: that the work is *complete*, not that it is *right*.**
