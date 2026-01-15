---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs
allowed-tools: Bash, Read, Grep, Glob, AskUserQuestion
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

<requirements>
## Requirements

1. Run actual verification commands. "Should work" is not verification.
2. Show command output as evidence. Confidence is not evidence.
3. Only claim completion when tests pass.
</requirements>

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

<verification>
## The Gate Function

Before claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skipping steps produces false claims, not verified results.

**STOP CONDITION:** If about to claim completion without running verification command in THIS message, STOP. Run the command first.
</verification>

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
| Issue offers done | Offers PRESENTED (user decided) | "No tracker, skipping" without manual check |

<verification>
## Evidence-Based Completion Checklist

Before claiming ANY work is complete:

**Required Evidence** (unchecked items block completion):

- [ ] Tests RUN (not just written) - show passing output
- [ ] Build SUCCEEDED - show build output
- [ ] Linting PASSED - show lint output
- [ ] Edge cases TESTED - list which ones
- [ ] Related functionality VERIFIED - nothing broken
- [ ] Issue tracking offers PRESENTED - discovered work creation, original issue update (see Issue Offers phase below)
- [ ] Acceptance criteria VERIFIED (if Original Issue was Authoritative - see below)

**STOP CONDITION:** If ANY checkbox is unchecked, do NOT claim completion. Complete the missing verification(s) first.
</verification>

**Red Flags for Premature Claims:**
- "Tests should pass" (should ≠ did)
- "The implementation looks correct" (looks ≠ verified)
- "I made the changes as requested" (changes ≠ working)
- Claiming success without showing command output

**If ANY checkbox is unchecked:** Cannot claim completion.

## Issue Offers Phase

**After all verification passes, before claiming completion:**

This phase executes after verification passes. Offers are presented to the user, who decides execution.

### Step 1: Create Issues for Discovered Work

Read `docs/current-progress.md` "Discovered Work" section.

For each item, use AskUserQuestion tool to present creation offer (plain text questions prevent structured response):
```
AskUserQuestion(
  questions: [{
    question: "Create issue for discovered work: 'Need to add rate limiting to API'?",
    header: "Issue 1",
    options: [
      {label: "Create", description: "Create this as a new issue"},
      {label: "Skip", description: "Don't create an issue for this"}
    ],
    multiSelect: false
  }]
)
```

Present one AskUserQuestion per discovered item. Batch presentation is NOT acceptable - each item needs individual AskUserQuestion approval.

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

Use AskUserQuestion tool to present offer:
```
AskUserQuestion(
  questions: [{
    question: "Update issue PROJ-123 with completion summary?",
    header: "Update",
    options: [
      {label: "Yes", description: "Add comment: 'Implemented JWT-based auth...'"},
      {label: "Edit", description: "Let me modify the summary first"},
      {label: "Skip", description: "Don't update the issue"}
    ],
    multiSelect: false
  }]
)
```

### No Tracker Detected

If issue-tracking agent returned `ISSUE_TRACKER: none`:
```
Note: No issue tracker detected.

Manual verification required:
- [ ] Checked for discovered work that should be tracked elsewhere
- [ ] Verified original task/request is addressed

Consider configuring issue tracking in CLAUDE.md for automated tracking.
```

**The phase still executes** - offers change to manual verification prompts.

<verification>
## Acceptance Criteria Verification (Authoritative Issues Only)

**If the plan contains an Original Issue block with Status: Authoritative:**

This phase executes for Authoritative issues. Skipping produces incomplete deliverables.

### Step 1: Extract Acceptance Criteria

Parse the Original Issue body for:
- `- [ ]` checklist items
- Numbered requirements
- "Must", "Should", "Shall" statements

### Step 2: Verify Each Criterion

For each criterion found:
```
Acceptance Criteria Verification:

1. "Identify where context is currently lost in skill transitions"
   ✅ VERIFIED: Task 1 analyzed issue-tracking agent, Tasks 2-4 added capture points
   Evidence: [specific file changes or test results]

2. "Add explicit spec/issue context forwarding in relevant skills"
   ✅ VERIFIED: Tasks 2-6 added forwarding in all 5 skills
   Evidence: [commit SHAs or grep results]

3. [etc.]
```

### Step 3: Report Gaps

If ANY criterion is not verified:
```
⚠️ Acceptance Criteria Gap:

Criterion: "[unmet criterion]"
Status: NOT VERIFIED
Gap: [what's missing]
Action needed: [specific fix required]
```

**STOP CONDITION:** If ANY Authoritative acceptance criterion is unverified, do NOT claim completion.

### Reference Only Issues

If Original Issue status is "Reference Only", skip this phase:
```
Note: Original Issue marked Reference Only - skipping acceptance criteria verification.
Proceeding with standard verification checklist.
```
</verification>

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

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| **Plain text questions instead of AskUserQuestion** | User can't respond via structured UI | Use AskUserQuestion tool |
| Using "should", "probably", "seems to" | Uncertainty words = no evidence | Run verification command NOW |
| "Great!", "Perfect!", "Done!" before verification | Premature satisfaction = false confidence | Verify THEN celebrate |
| About to commit/push/PR without verification | Ships broken code | Run full test suite first |
| Trusting agent success reports | Agents can be wrong | Independently verify with VCS diff |
| Relying on partial verification | Partial proves nothing | Run FULL verification |
| "Just this once" | Exceptions become patterns | No exceptions, verify always |
| Tired and wanting work over | Exhaustion leads to mistakes | Verify anyway, then rest |
| ANY wording implying success | Words without evidence = lying | Run command, show output |

AskUserQuestion is required for all Issue Offers (discovered work, original issue update). Plain text questions prevent structured response.

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
✅ Write → Run (pass) → Revert fix → Run (fails) → Restore → Run (pass)
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

<requirements>
## Requirements (Reminder)

1. Run actual verification commands. "Should work" is not verification.
2. Show command output as evidence. Confidence is not evidence.
3. Only claim completion when tests pass.
</requirements>

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.
