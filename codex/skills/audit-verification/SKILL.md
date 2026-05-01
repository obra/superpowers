---
name: audit-verification
description: Use when validating completed implementation work against a task spec, plan, ownership boundary, or acceptance criteria before calling it complete
---

# Audit Verification

## Overview

Completion claims need independent evidence. Audit verification compares the actual implementation against the spec, diff, tests, contracts, and ownership boundaries before work is considered complete.

Core principle: no completion claim without fresh verification evidence.

## When To Use

Use after:
- A worker reports a task complete in a team workflow.
- A batch of plan tasks is ready to mark done.
- A significant local implementation is complete.
- A change touches APIs, migrations, security, data handling, or shared behavior.
- The user asks whether work satisfies a plan or spec.

In team mode, audit verification must use a separate reviewer subagent for each worker task. Outside team mode, perform the audit locally.

## Audit Inputs

Collect:
- Original task spec, plan section, or acceptance criteria.
- Claimed completion summary.
- Actual `git diff` or file patch.
- File ownership and forbidden-path constraints.
- Verification commands and fresh results.
- API, event, schema, or documentation contracts relevant to the task.
- Known follow-ups or deferred items.

## Local Audit Process

1. Read the task spec.
2. Inspect the actual changed files and diff.
3. Compare each requirement against implementation.
4. Verify tests or deterministic checks exist for the risk level.
5. Run or review fresh verification output from the current turn.
6. Check API and shared-data consistency against source-of-truth docs when relevant.
7. Check for scope creep and forbidden-path edits.
8. Issue a verdict with specific findings.

## Team Audit Process

Use a reviewer subagent only when the user explicitly asks for subagents, delegation, parallel work, reviewer workflow, or team workflow.

When assigning an audit reviewer:
- Pass the task spec and acceptance criteria.
- Pass the actual diff or patch text whenever practical.
- Pass verification evidence and any known failures.
- Pass ownership boundaries and forbidden paths.
- Require a final verdict line: `Verdict: APPROVE` or `Verdict: REJECT`.

If the reviewer rejects the task, route the specific findings back to the implementer. If the original worker is unavailable, use `resume_agent` when suitable or start a new worker with the prior context, diff, findings, and exact ownership boundaries.

## Audit Report Format

```markdown
## Audit Report

**Task:** <task title or id>
**Scope:** <files or modules reviewed>
**Verdict:** APPROVE / REJECT

### Spec Coverage
- <requirement>: pass/fail with evidence

### Findings
- <severity>: <file:line> <issue and required fix>

### Verification
- `<command>`: pass/fail

### Notes
- <scope decisions, follow-ups, or deferred items>
```

## Wiki And API Contract Checks

If `docs/wiki/` exists, use relevant wiki pages as a fast spec index. Check pages such as `docs/wiki/features.md` and `docs/wiki/api-contracts.md` when they exist.

If `docs/api/` exists and the task touches endpoints, events, shared types, or cross-boundary data:
- Compare implementation against the relevant API docs.
- Flag undocumented new or changed contracts.
- Note docs that appear stale rather than silently treating them as implementation truth.

Do not edit docs or wiki files unless the current task explicitly owns those paths.

## Rejection Criteria

Reject or block completion when:
- Required behavior is missing.
- Tests or deterministic validation are absent for meaningful risk.
- Verification was not run or is stale.
- The diff includes forbidden paths or unexplained scope creep.
- API or shared-data contracts are invented or inconsistent.
- Security, data loss, migration, or compatibility risks remain unresolved.

## Red Flags

Stop and verify instead of approving when:
- The report says "done" but does not include files changed.
- The reviewer has not inspected the diff.
- Checks are described but not shown with commands.
- A worker changed files outside ownership.
- A task appears correct only because the summary says so.

## Completion Standard

An audit is complete only when the verdict is backed by:
- Requirement-by-requirement comparison.
- Actual diff inspection.
- Fresh verification results.
- Specific findings or explicit statement that no issues were found.
