---
name: systematic-debugging
description: Use when encountering any bug, error, test failure, unexpected behavior, performance problem, or build failure - requires root cause investigation before attempting any fix
---

# Systematic Debugging

> **This skill mirrors the `/systematic-debugging` workflow.** Full instructions are below.

## Overview
Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law
```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use
Use for ANY technical issue:
- Test failures, bugs, unexpected behavior
- Performance problems, build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully** — Don't skip past errors or warnings. Read stack traces completely. Note line numbers, file paths, error codes.
2. **Reproduce Consistently** — Can you trigger it reliably? If not reproducible → gather more data, don't guess.
3. **Check Recent Changes** — Git diff, recent commits, new dependencies, config changes.
4. **Gather Evidence in Multi-Component Systems** — For EACH component boundary: log what data enters/exits. Run once to gather evidence showing WHERE it breaks.
5. **Trace Data Flow** — Where does the bad value originate? Keep tracing up until you find the source. Fix at source, not at symptom.

### Phase 2: Pattern Analysis

1. **Find Working Examples** — Locate similar working code in same codebase
2. **Compare Against References** — Read reference implementation COMPLETELY, don't skim
3. **Identify Differences** — List every difference, however small
4. **Understand Dependencies** — What other components, settings, config does this need?

### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis** — "I think X is the root cause because Y"
2. **Test Minimally** — SMALLEST possible change. One variable at a time.
3. **Verify Before Continuing** — Worked? → Phase 4. No? → New hypothesis. Don't stack fixes.

### Phase 4: Implementation

1. **Create Failing Test Case** — Use `test-driven-development` skill for proper failing tests.
2. **Implement Single Fix** — ONE change at a time.
3. **Verify Fix** — Test passes? No other tests broken?
4. **If ≥ 3 attempts fail:** STOP and question the architecture. Discuss with user.

## Red Flags — STOP and Return to Phase 1

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- Proposing solutions before tracing data flow

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| 1. Root Cause | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| 2. Pattern | Find working examples, compare | Identify differences |
| 3. Hypothesis | Form theory, test minimally | Confirmed or rejected |
| 4. Implementation | Create test, fix, verify | Bug resolved, tests pass |
