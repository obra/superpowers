---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
allowed-tools: Task, Bash, Read
---

# Requesting Code Review

## Overview

Dispatch 4 specialized review agents in parallel to catch issues before they cascade.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## Specialized Review Pattern

Code review dispatches 4 parallel specialized agents:

| Agent | Focus | Key Checks |
|-------|-------|-----------|
| **Security Reviewer** | Vulnerabilities | Injection, auth, secrets, input validation |
| **Performance Reviewer** | Efficiency | N+1, memory leaks, scaling, caching |
| **Style Reviewer** | Conventions | Naming, organization, patterns, formatting |
| **Test Reviewer** | Coverage | Gaps, edge cases, test quality |

Each agent reviews the same changes independently, then findings are synthesized by severity.

### Model Selection

All 4 specialized agents use `haiku` for fast, focused analysis.
Orchestrator (you) handles synthesis with full reasoning capability.

## Quick Reference

| Step | Action |
|------|--------|
| 1 | Gather git context (BASE_SHA, HEAD_SHA) |
| 2 | Summarize what was implemented |
| 3 | Dispatch 4 parallel review agents |
| 4 | Synthesize findings by severity |
| 5 | Check docs/solutions/ for known fixes |
| 6 | Present unified checklist |

## How to Request Code Review

### Step 1: Gather Git Context

```bash
BASE_SHA=$(git merge-base HEAD origin/main)  # or appropriate base
HEAD_SHA=$(git rev-parse HEAD)
git diff $BASE_SHA..$HEAD_SHA --stat
```

### Step 2: Identify What Was Implemented

Summarize the changes:
- What feature/fix was implemented
- Which files were changed
- What requirements it should meet

### Step 3: Dispatch 4 Parallel Review Agents

Dispatch all 4 agents simultaneously:

```
Task(description: "Security review",
     prompt: [security-reviewer with diff context],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Performance review",
     prompt: [performance-reviewer with diff context],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Style review",
     prompt: [style-reviewer with diff context],
     model: "haiku",
     subagent_type: "general-purpose")

Task(description: "Test review",
     prompt: [test-reviewer with diff context],
     model: "haiku",
     subagent_type: "general-purpose")
```

Each agent prompt should include:
- The git diff or changed file contents
- Summary of what was implemented
- The agent's checklist and output format

### Step 4: Synthesize Findings

After all agents complete, combine findings by severity:

```markdown
## Code Review Results

### Critical Issues
[Must fix before merge]
- [ ] **[CATEGORY]** [Issue] at `file:line`
  - [Details and fix recommendation]

### Warnings
[Should fix, may proceed with justification]
- [ ] **[CATEGORY]** [Issue] at `file:line`
  - [Details and fix recommendation]

### Suggestions
[Optional improvements]
- [ ] **[CATEGORY]** [Issue] at `file:line`
  - [Details]
```

### Step 5: Check for Known Solutions

For Critical/Warning findings, check `docs/solutions/` for prior solutions:
- If match found: Include link in recommendation
- Example: "See `docs/solutions/performance-issues/n-plus-one-2026-01-08.md`"

### Step 6: Present to User

Present the synthesized checklist. User should:
- Fix all Critical issues
- Address Warnings before merge (or justify skipping)
- Consider Suggestions for future improvement

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git merge-base HEAD origin/main)
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch 4 parallel review agents with diff context]

[All agents return, orchestrator synthesizes]:

## Code Review Results

### Critical Issues
(none)

### Warnings
- [ ] **[PERFORMANCE]** verifyIndex() loads entire file into memory at `src/verify.ts:45`
  - Consider streaming for large files

### Suggestions
- [ ] **[STYLE]** Magic number (100) for reporting interval at `src/verify.ts:78`
  - Extract to named constant
- [ ] **[TEST]** Missing edge case test for empty index at `tests/verify.test.ts`
  - Add test for empty index scenario

You: [Fix memory issue, note suggestions for later]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

## COMPULSORY: Review Dispatch Verification

Before dispatching review agents:

**Context Gate** (COMPULSORY):

- [ ] BASE_SHA and HEAD_SHA captured
- [ ] Git diff generated
- [ ] Summary of changes prepared

**STOP CONDITION:** If context incomplete, gather it first.

**Dispatch Gate** (COMPULSORY - must dispatch all 4):

- [ ] Security Reviewer dispatched
- [ ] Performance Reviewer dispatched
- [ ] Style Reviewer dispatched
- [ ] Test Reviewer dispatched

**STOP CONDITION:** If fewer than 4 agents dispatched, dispatch missing agents.

After agents return:

**Synthesis Gate** (COMPULSORY):

- [ ] All 4 agents completed
- [ ] Findings grouped by severity (Critical/Warning/Suggestion)
- [ ] Checked docs/solutions/ for known fixes
- [ ] Unified checklist presented

**STOP CONDITION:** If any agent missing from synthesis, wait or re-dispatch.

## COMPULSORY: Handoff Consumption Verification

**Consumption Gate** (COMPULSORY - for each reviewer's findings):

- [ ] Each reviewer's output file path stated
- [ ] Key findings from EACH reviewer quoted/referenced
- [ ] Severity classifications traced back to specific reviewer

**STOP CONDITION:** If synthesizing without citing specific reviewer outputs, STOP. Quote each reviewer's findings.

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Fewer than 4 reviewers dispatched | Incomplete review coverage | Re-dispatch missing agents |
| Synthesis doesn't cite all reviewers | Information loss | Include quotes from each reviewer |
| Reviewer findings summarized without quotes | Can't trace back to source | Quote specific findings per reviewer |
| Severity grouping missing | Prioritization unclear | Group as Critical/Warning/Suggestion |
| Any reviewer's findings dropped | Some issues missed | Ensure all 4 reviewers in synthesis |
