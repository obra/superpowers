---
name: requesting-code-review
description: Use when completing a task, finishing a significant change, preparing to merge, or wanting independent scrutiny of implementation quality and requirement coverage
---

# Requesting Code Review

## Overview

Review early enough that issues are cheap to fix. A useful review checks the actual diff against the requirements and the codebase, not just the completion summary.

Core principle: pass reviewers the concrete patch, requirements, and verification evidence.

## When To Request Review

Request review:
- After completing a significant task or feature.
- Before merging to a protected or shared branch.
- After fixing a complex bug.
- Before broad refactors, to establish baseline risks.
- When stuck and a focused second pass may reveal missed evidence.

In team workflows, request review at the checkpoints defined by the plan or team workflow.

## Review Modes

### Local Review Mode

Use this by default unless the user explicitly requests a reviewer subagent or team workflow.

1. Inspect the diff yourself from a code-review stance.
2. Compare behavior against the stated requirements.
3. Lead with bugs, regressions, missing tests, and contract violations.
4. Use tight file and line references.
5. Emit `::code-comment{...}` findings only when inline review findings are useful in the final response.

### Reviewer Subagent Mode

Use `spawn_agent` only when the user explicitly asks for subagents, delegation, a reviewer workflow, or team execution.

When spawning a reviewer:
- Include the requirements or plan section.
- Include `git diff` or file patch text whenever practical.
- Include verification commands and current results.
- Include ownership boundaries and forbidden paths.
- Ask for a final parseable verdict line: `Verdict: APPROVE` or `Verdict: REJECT`.

If the reviewer cannot see the worker fork or local diff, paste the relevant patch into the prompt. Do not assume shared visibility.

## How To Prepare Review Context

Use the smallest range that covers the work:

```bash
git status --short
git diff --stat <base>..<head>
git diff <base>..<head>
```

For uncommitted work, use:

```bash
git diff --stat
git diff
```

If only specific files are in scope, restrict the diff to those paths.

## Review Request Checklist

Provide:
- What changed and why.
- Requirements, task spec, or plan reference.
- Base and head commits, or uncommitted diff.
- Exact files in scope.
- Tests or validation commands run, with pass/fail status.
- Known risks, tradeoffs, or intentionally deferred items.

Use `code-reviewer.md` in this directory as a prompt template when a reviewer subagent is authorized.

## Acting On Feedback

- Fix critical issues before proceeding.
- Fix important issues unless there is a clear technical reason not to.
- Track minor issues as follow-up when they are not necessary for correctness.
- Push back on incorrect feedback with code, tests, or requirements evidence.
- If feedback is unclear, use the receiving-code-review skill before making changes.

## Red Flags

Do not:
- Ask for review without showing the diff.
- Accept "looks good" if the reviewer did not inspect code.
- Proceed with unresolved critical or important findings.
- Treat review as a formality after deciding the work is done.
- Hide failing checks or omit known risks.

## Completion Standard

A review is useful only if it answers:
- Does the implementation satisfy the requirements?
- Are there correctness, security, performance, migration, or compatibility risks?
- Are tests or deterministic validation adequate?
- Is the final verdict clear enough to act on?
