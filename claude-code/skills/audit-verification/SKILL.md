---
name: audit-verification
description: Use when any task is completed by a worker agent — mandatory audit gate that verifies task output matches spec before allowing completion
---

# Audit Verification

## Overview

Every completed task MUST be verified by the Audit Agent before it can be marked as done. This skill defines the mandatory audit process that prevents incomplete or non-compliant work from passing through.

**Core principle:** No task is complete without Audit Agent approval. Self-reporting is insufficient — independent verification is mandatory.

**Announce at start:** "I'm using the audit-verification skill to verify task completion before marking it done."

<HARD-GATE>
You MUST NOT mark any task as "completed" in TaskUpdate without Audit Agent approval.
"The task is obviously correct" is NEVER a valid reason to skip audit.
"It's just a small change" is NEVER a valid reason to skip audit.
The Audit Agent runs on Opus and catches issues that workers miss. Always.
</HARD-GATE>

## When to Use

- After ANY worker completes a task in team-driven-development
- After batch completion in executing-plans
- Before marking any TaskUpdate status to "completed"
- Before proceeding to the next task

## The Audit Gate

```dot
digraph audit_gate {
    "Worker completes task" [shape=box];
    "Worker sends completion report to audit-agent" [shape=box style=filled fillcolor=lightyellow];
    "Audit Agent reads task spec" [shape=box];
    "Audit Agent reads git diff" [shape=box];
    "Audit Agent runs verification checklist" [shape=box];
    "All checks pass?" [shape=diamond];
    "APPROVED" [shape=box style=filled fillcolor=lightgreen];
    "REJECTED with specific issues" [shape=box style=filled fillcolor=lightcoral];
    "Worker fixes issues" [shape=box];
    "Worker resubmits" [shape=box];
    "Mark task complete" [shape=box style=filled fillcolor=lightgreen];

    "Worker completes task" -> "Worker sends completion report to audit-agent";
    "Worker sends completion report to audit-agent" -> "Audit Agent reads task spec";
    "Audit Agent reads task spec" -> "Audit Agent reads git diff";
    "Audit Agent reads git diff" -> "Audit Agent runs verification checklist";
    "Audit Agent runs verification checklist" -> "All checks pass?";
    "All checks pass?" -> "APPROVED" [label="yes"];
    "All checks pass?" -> "REJECTED with specific issues" [label="no"];
    "REJECTED with specific issues" -> "Worker fixes issues";
    "Worker fixes issues" -> "Worker resubmits";
    "Worker resubmits" -> "Audit Agent reads git diff";
    "APPROVED" -> "Mark task complete";
}
```

## Worker Completion Report Format

Workers MUST send this to the Audit Agent:

```markdown
## Task Completion Report

**Task:** N — <task title>
**Worker:** worker-<number>

### What Was Done
- <bullet list of implemented items>

### Files Changed
- <file paths with brief description of changes>

### Tests
- <number> tests added/modified
- All passing: yes/no
- Command: <test command used>

### API Contracts Used
- <list of endpoints/events used, documented in docs/api/>

### Commits
- <commit hashes and messages>
```

## Audit Agent Verification Steps

1. **Read the original task spec** from the implementation plan
2. **Read the git diff** for the worker's commits
3. **Compare spec vs implementation** line by line
4. **Verify tests exist and pass** by running them
5. **Check API consistency** against docs/api/ documentation
6. **Verify no scope creep** — nothing extra beyond spec
7. **Issue verdict:** APPROVED or REJECTED

## Escalation Rules

| Situation | Action |
|-----------|--------|
| First rejection | Worker fixes and resubmits |
| Second rejection (same issue) | Audit Agent notifies Team Lead |
| Third rejection (same task) | Team Lead intervenes — possible task redesign |
| Critical security issue | Broadcast BLOCK to entire team |
| Cross-task conflict | Notify Team Lead + affected workers |

## Red Flags - STOP and Verify

**Never:**
- Skip audit because "it's obvious"
- Let workers mark tasks complete without audit approval
- Accept incomplete completion reports
- Approve without reading the actual git diff
- Rush audit under time pressure

## Integration

**Called by:**
- **superpowers:team-driven-development** — All task completions go through audit
- **superpowers:verification-before-completion** — Audit is part of final verification

**Pairs with:**
- **superpowers:api-edr-validation** — Audit checks API consistency
- **superpowers:test-driven-development** — Audit verifies TDD was followed

## Wiki Integration

When `docs/wiki/` exists in the project, the Audit Agent MUST include wiki-based spec comparison as part of the verification process.

**Guard:** If `docs/wiki/` does not exist, skip this section entirely and proceed with normal audit steps above.

### Steps

1. **Reference wiki for spec vs implementation comparison**
   - Before comparing spec to git diff, check `docs/wiki/index.md` for relevant wiki pages
   - Use wiki pages as a pre-compiled summary of specs, reducing the need to re-read full raw documents

2. **Check `docs/wiki/features.md`**
   - Verify the completed task aligns with documented feature definitions and status
   - Confirm the feature scope in wiki matches the task spec — flag any discrepancy

3. **Check `docs/wiki/api-contracts.md`**
   - Cross-reference API usage in the worker's changes against the wiki's API contract summary
   - This supplements (not replaces) the existing API consistency check against `docs/api/`

4. **Flag wiki-implementation discrepancies**
   - If the implementation diverges from what the wiki documents, include this in the audit verdict
   - Discrepancies are NOT automatic rejections — they may indicate the wiki is outdated
   - When a discrepancy is found, note it in the audit report and recommend a wiki update as a follow-up
