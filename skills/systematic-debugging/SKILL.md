---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
context: fork
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** Find root cause before attempting fixes. Symptom fixes are failure.

### Context Isolation

This skill runs in **forked context** (`context: fork`):
- Investigation (Phases 1-3) runs in isolated sub-agent context
- Keeps main conversation clean for decision-making
- Returns structured **Investigation Summary** (see end of skill)

**Phase 4 (Implementation) uses fresh subagents** via TDD skill—the fork is for investigation only.

<requirements>
## Requirements

1. Create hypothesis BEFORE making changes. Guessing-and-checking = not debugging.
2. Verify hypothesis with evidence. "I think" is not evidence.
3. Document findings in debugging log.
</requirements>

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## Hypothesis-Driven Debugging

Each debugging attempt requires:
1. **State hypothesis**: "I believe the bug is caused by X because Y"
2. **Define test**: "I will verify by Z"
3. **Predict outcome**: "If hypothesis is correct, I expect A; if wrong, I expect B"
4. **Execute and observe**: Run test, record actual outcome
5. **Update understanding**: Revise hypothesis based on evidence

**Red Flag:** If you find yourself trying multiple fixes without stating hypotheses, STOP. You're guessing, not debugging.

## When to Use

Use for ANY technical issue: test failures, bugs, unexpected behavior, performance problems, build failures, integration issues.

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- You don't fully understand the issue

## Priority: Systematic Debugging vs TDD

**Use Systematic Debugging when root cause is UNKNOWN:**
- Mysterious behavior without clear trigger
- "It just stopped working"
- Intermittent failures

**Use TDD directly when root cause is KNOWN:**
- Clear reproduction steps exist
- User says "X causes Y"
- Error message points to specific code

**Handoff:** After Phase 4 establishes root cause, use TDD (hyperpowers:test-driven-development) for the actual fix.

## The Four Phases

Complete each phase before proceeding to the next. Skipping phases means missing the real bug.

<verification>
## Phase Gate Verification

**Phase 1 Gate** (before proposing ANY fix):
- [ ] Error messages read completely (not skimmed)
- [ ] Bug reproduced consistently OR documented as intermittent
- [ ] Recent changes checked (git diff/log)
- [ ] Evidence gathered (logs, traces, state)

**STOP CONDITION:** Proposing a fix without all checkboxes? Return to investigation.

**Phase 2 Gate** (before forming hypothesis):
- [ ] Working example found in codebase
- [ ] Differences between working and broken identified
- [ ] Dependencies understood

**STOP CONDITION:** Forming hypothesis without pattern analysis? Find working examples first.

**Phase 3 Gate** (before implementing fix):
- [ ] Hypothesis stated explicitly ("I believe X because Y")
- [ ] Test defined for hypothesis
- [ ] Outcome predicted (what success/failure looks like)

**STOP CONDITION:** Implementing without stated hypothesis? You're guessing.

**Phase 4 Gate** (before claiming fix complete):
- [ ] Failing test created FIRST
- [ ] Single fix implemented (not multiple)
- [ ] Test passes now
- [ ] Full test suite passes (not just the failing test)
- [ ] Investigation Summary written (see end of skill)

**STOP CONDITION:** Claiming success without Investigation Summary? Complete the summary.

**Fix Attempt Counter Gate:**
- [ ] Current fix attempt number stated
- [ ] If attempt >= 3: Architecture discussion triggered

**STOP CONDITION:** Attempting fix #4+ without questioning architecture? Discuss with human partner.
</verification>

## Pre-Phase 1: Solution Search

Before starting fresh investigation, check `docs/solutions/` for matching symptoms:

```bash
# Search by error message or symptom
grep -ri "error text" docs/solutions/
```

If solution found and applies, try it first. If unsuccessful, note what didn't work and proceed to Phase 1.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - If not reproducible, gather more data. Don't guess.

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits, new dependencies, config changes

4. **Gather Evidence in Multi-Component Systems**

   When system has multiple components (CI -> build -> signing, API -> service -> database):

   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation

   Run once to gather evidence showing WHERE it breaks
   THEN investigate that specific component
   ```

5. **Trace Data Flow**

   When error is deep in call stack:
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

   See `root-cause-tracing.md` for complete technique.

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find Working Examples** - Locate similar working code in same codebase
2. **Compare Against References** - Read reference implementation COMPLETELY. Don't skim.
3. **Identify Differences** - List every difference between working and broken
4. **Understand Dependencies** - What components, settings, environment required?

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form Single Hypothesis** - State clearly: "I think X is the root cause because Y"
2. **Test Minimally** - Make the SMALLEST possible change to test hypothesis
3. **Verify Before Continuing** - Did it work? Yes -> Phase 4. No -> Form NEW hypothesis. Don't add more fixes on top.
4. **When You Don't Know** - Say "I don't understand X". Don't pretend to know.

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Create Failing Test Case** - Use `hyperpowers:test-driven-development` skill. Having no failing test before fixing means you can't prove the fix works.
2. **Implement Single Fix** - ONE change at a time. No "while I'm here" improvements.
3. **Verify Fix** - Test passes? No other tests broken?

4. **If Fix Doesn't Work**
   - Count: How many fixes have you tried?
   - If < 3: Return to Phase 1, re-analyze with new information
   - If >= 3: STOP and question the architecture (step 5)

5. **If 3+ Fixes Failed: Question Architecture**

   Pattern indicating architectural problem:
   - Each fix reveals new shared state/coupling
   - Fixes require "massive refactoring"
   - Each fix creates new symptoms elsewhere

   **Discuss with your human partner before attempting more fixes.** This is not a failed hypothesis—this is a wrong architecture.

## Red Flags - IMMEDIATE STOP

| Violation | Recovery |
|-----------|----------|
| "Quick fix for now, investigate later" | Return to Phase 1 |
| "Just try changing X and see" | State hypothesis first |
| "Add multiple changes, run tests" | One change at a time |
| "Skip the test, I'll manually verify" | Write automated test |
| "It's probably X, let me fix that" | Verify X is actually the cause |
| "I don't understand but this might work" | Research until you understand |
| "One more fix attempt" (2+ already tried) | Question architecture with human |
| Each fix reveals problem in different place | Stop fixing, discuss redesign |
| "Root cause: X" without research process | Document how you found it |

**ALL of these mean: STOP. Return to Phase 1.**

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass |

## Supporting Techniques

In this directory:
- **`root-cause-tracing.md`** - Trace bugs backward through call stack
- **`defense-in-depth.md`** - Add validation at multiple layers
- **`condition-based-waiting.md`** - Replace arbitrary timeouts with condition polling

Related skills:
- **hyperpowers:test-driven-development** - For creating failing test case (Phase 4)
- **hyperpowers:verification-before-completion** - Verify fix worked before claiming success
- **hyperpowers:compound** - After resolving a non-trivial issue, capture for future reference

<requirements>
## Requirements (reminder)

1. Create hypothesis BEFORE making changes.
2. Verify hypothesis with evidence.
3. Document findings.
</requirements>

## Investigation Summary (Required Return)

Because this skill runs in forked context, return a structured summary. Skipping the summary means losing debugging knowledge.

~~~markdown
## Investigation Summary

### Problem
[Brief description of the bug/failure]

### Research Process
1. [What was checked first and why]
2. [Key files/components examined]
3. [Hypotheses tested and results]
4. [Dead ends encountered—valuable for future reference]

### Root Cause
[Clear explanation of what was wrong]

### Solution
[The fix applied or recommendation for Phase 4]

### Learnings
- [Pattern to watch for in future]
- [Related areas that might have similar issues]
~~~

Returning just "root cause: X" without explaining HOW you found it violates this requirement.
