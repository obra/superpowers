---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs
allowed-tools: Bash, Read, Grep, Glob
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## When to Use

**Use this skill when:**
- About to claim work is complete, fixed, or passing
- Before committing code
- Before creating PRs
- Before moving to next task

**Don't use when:**
- Still actively developing (wait until claiming done)

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
| Work complete | Issue offers reviewed, original issue updated | "No issue tracked this" without checking |

## Evidence-Based Completion Checklist

Before claiming ANY work is complete:

**Required Evidence:**
- [ ] Tests RUN (not just written) - show passing output
- [ ] Build SUCCEEDED - show build output
- [ ] Linting PASSED - show lint output
- [ ] Edge cases TESTED - list which ones
- [ ] Related functionality VERIFIED - nothing broken
- [ ] Issue tracking offers reviewed - discovered work creation, original issue update (see Issue Offers phase below)

**Red Flags for Premature Claims:**
- "Tests should pass" (should ≠ did)
- "The implementation looks correct" (looks ≠ verified)
- "I made the changes as requested" (changes ≠ working)
- Claiming success without showing command output

**If ANY checkbox is unchecked:** Cannot claim completion.

## Issue Offers Phase

**After all verification passes, before claiming completion:**

### Step 1: Create Issues for Discovered Work

Read `docs/current-progress.md` "Discovered Work" section.

For each item, present creation offer:
```
New Issue Offers (Discovered During Work):

1. "Need to add rate limiting to API"
   Command: [from issue-tracking agent]
   [Create / Skip]

2. "Auth tokens should expire after 24h"
   Command: [from issue-tracking agent]
   [Create / Skip]
```

Batch presentation, individual approval per item.

### Step 2: Update Original Issue

If primary issue tracked, dispatch issue-tracking agent:
```
Task(description: "Compose issue update",
     prompt: "Operation: add-comment
Issue: [primary issue ID]
Summary: [work completed summary]",
     model: "haiku",
     subagent_type: "general-purpose")
```

Present offer:
```
Issue Update Offer:
- Issue: PROJ-123 "Add user authentication"
- Action: Add comment summarizing work completed
- Summary: "Implemented JWT-based auth with login/logout endpoints,
  added middleware, tests passing. Ready for review."
- Command: [from agent]

Update issue? [Yes / Edit Summary / Skip]
```

### No Tracker Detected

If issue-tracking agent returned `ISSUE_TRACKER: none`:
```
Note: No issue tracker detected. Skipping issue offers.
Consider configuring issue tracking in CLAUDE.md.
```

## Fresh Verification Requirement

**Stale evidence is not evidence.**

Before claiming completion:
1. Run verification commands NOW (not from memory)
2. Read the ACTUAL output (not expected output)
3. Verify output indicates SUCCESS (not just "ran")
4. Show evidence in your response

**Invalid evidence:**
- "Tests passed earlier"
- "It was working before"
- "I already ran this"

**Valid evidence:**
- Command output showing current pass/success status
- Timestamps indicating recent execution

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

## Why This Matters

From 24 failure memories:
- your human partner said "I don't believe you" - trust broken
- Undefined functions shipped - would crash
- Missing requirements shipped - incomplete features
- Time wasted on false completion → redirect → rework
- Violates: "Honesty is a core value. If you lie, you'll be replaced."

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
