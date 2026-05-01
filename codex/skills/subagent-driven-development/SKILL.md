---
name: subagent-driven-development
description: Use when the user explicitly requests the legacy subagent-driven workflow or asks to execute a plan with Codex subagents.
---

# Subagent-Driven Development In Codex

## Status

This is a compatibility workflow for users who ask for subagent-driven development by name. For new Codex team workflows, prefer `team-driven-development`.

Use this skill only when the user explicitly authorizes subagents, delegation, parallel agent work, a team workflow, or a reviewer workflow. Without that authorization, execute the plan inline.

## Core Idea

The main Codex session orchestrates. Worker subagents implement bounded tasks. Reviewer subagents inspect the actual diff or patch and verification evidence. The main session does final integration and verification.

Do not require commits, pushes, or merges unless the user asks for them.

## Setup

1. Read the plan or user request once in the main session.
2. Extract each task with its full requirements, dependencies, owned files, forbidden files, and verification commands.
3. Use `update_plan` to track each task and review gate.
4. Confirm the working tree state and preserve unrelated dirty changes.
5. Stop if a task would require touching files outside its ownership boundary.

If the current branch is `main` or `master`, do not start implementation unless the user has permitted working there.

## Per-Task Loop

For each task:

1. Mark the task `in_progress`.
2. Create an implementer with `spawn_agent`.
3. Wait for the implementer only when the next step is blocked.
4. Inspect the worker report, changed files, and local diff.
5. Create a spec reviewer with `spawn_agent`.
6. If spec review approves, create a quality reviewer with `spawn_agent`.
7. If either reviewer rejects, route findings back to the worker with `send_input`.
8. Re-review after each revision.
9. Mark the task complete only after review approval and current-session verification.

Do not run quality review before spec review passes.

## Implementer Prompt Requirements

Include:

- Full task text pasted into the prompt.
- Context explaining where the task fits.
- Owned write paths and forbidden paths.
- Explicit instruction not to revert, overwrite, stage, commit, or format other agents' changes.
- Required verification commands.
- Request to ask questions before changing files if anything is unclear.
- Required report: implemented changes, files changed, verification output, self-review findings, blockers.

Workers should implement only the requested task and should preserve unrelated dirty work.

## Reviewer Prompt Requirements

Spec reviewer checks whether the implementation matches the requested behavior: nothing missing, nothing extra.

Quality reviewer checks maintainability, tests, integration risk, and fit with existing code patterns.

Reviewer handoff must include:

- The original task requirements.
- The worker's summary and changed file list.
- The actual `git diff` output or file patch text whenever practical.
- Verification commands and exact output or evidence.
- Clear review criteria.

Reviewers must not approve from the report alone. They must inspect the actual diff or patch and verification evidence.

Reviewer output must end with exactly one parseable verdict line:

```text
Verdict: APPROVE
```

or:

```text
Verdict: REJECT
```

## Rework Fallback

When review rejects the work:

1. Send the reviewer findings to the same worker with `send_input`.
2. Include the exact rejected diff or patch, required fixes, and unchanged ownership boundaries.
3. Wait for the revision and repeat review.

If the worker is closed or unsuitable:

1. Try `resume_agent` when available.
2. If resuming is not possible, create a replacement worker with `spawn_agent`.
3. Provide the previous worker report, actual diff or patch, reviewer findings, and exact rework instructions.

Do not silently fix rejected worker output in the main session while this workflow is active.

## Final Gate

After all tasks are approved:

1. Re-read the original plan or request.
2. Inspect the full diff.
3. Run the relevant verification commands in the current session.
4. Confirm each task has reviewer approval based on actual diff or patch review.
5. Use `finishing-a-development-branch` only if implementation is complete and the user wants branch completion options.

Report blockers instead of forcing through ambiguous ownership, failing verification, or unresolved reviewer findings.
