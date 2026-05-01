---
name: writing-plans
description: Use when turning requirements into a multi-step Codex implementation plan.
---

# Writing Plans

## Overview

Write Codex implementation plans that can execute inline in the current session or through team-driven subagent orchestration. Include exact files, concrete steps, verification commands, expected outcomes, and enough context for `spawn_agent` workers, separate reviewer subagents, and the main Codex session to coordinate without prior context.

Save plans to `docs/codex/plans/YYYY-MM-DD-<feature-name>.md` unless the user specifies another location.

## Plan Header

Every plan should start with:

```markdown
# <Feature Name> Implementation Plan

> For Codex: execute inline with `executing-plans` unless the user explicitly asks for subagents, delegation, parallel agent work, or a team workflow. For team-driven execution, the main Codex session is orchestration-only: create worker subagents with `spawn_agent`, review each worker result with a separate reviewer subagent, and route rework with `send_input`.

**Goal:** <one sentence>

**Architecture:** <short implementation approach>

**Tech Stack:** <key tools and file types>
```

## Task Structure

Use bite-sized tasks. Each task should include:

- Files to create, modify, or test.
- A failing test or validation step where practical.
- The minimal implementation step.
- The command that verifies the task.
- Expected output or observable result.

Prefer steps that take a few minutes each.

## Team-Driven Task Contract

For plans that may run in team-driven mode, every task must be handoff-ready:

- **Task ID:** stable identifier such as `T1`, `T2`, or `API-1`.
- **Objective:** one concrete outcome the worker must produce.
- **Scope Boundaries:** what is included and what is explicitly out of scope.
- **Owned Files/Modules:** files, directories, or modules the worker may edit.
- **Forbidden Files:** any files or areas the worker must not touch, when relevant.
- **Dependencies:** prior task IDs, external inputs, generated artifacts, or shared assumptions.
- **Parallelizable:** `yes`, `no`, or `after <task-id>`, with the reason.
- **Verification:** exact command(s), expected evidence, and where evidence should be reported.

Each task should be small enough for one clean-context worker subagent to complete without needing the rest of the plan conversation.

## Worker Instructions

Team-driven plans must tell each worker subagent:

- Implement only the assigned task and stay inside the owned files/modules.
- Do not edit forbidden files or broaden scope without main-session approval.
- Report changed files, verification commands run, results, and any unresolved risks.
- Include enough detail for the main session to route reviewer findings back with `send_input`.

Worker self-report is never sufficient for completion.

## Reviewer Contract

Team-driven plans must assign a separate reviewer subagent for each worker result. Reviewer instructions must include:

- Review only the assigned task objective, owned files/modules, actual diff or patch, and verification evidence.
- Pass the actual `git diff` or file patch text to the reviewer whenever practical; if too large, require direct inspection of the exact changed files and patch before deciding.
- Check correctness, scope control, integration risk, test adequacy, and whether forbidden files were touched.
- End with an exact final verdict line: `Verdict: APPROVE` or `Verdict: REJECT`.
- For `Verdict: REJECT`, list required revisions as concrete, worker-actionable items tied to files, commands, or observed failures.

Any final verdict line other than exactly `Verdict: APPROVE` or `Verdict: REJECT` is invalid and must be clarified before proceeding.

## Rework Handling

Team-driven plans must define the rework loop:

1. Main Codex receives reviewer findings.
2. If the verdict is `Verdict: REJECT`, main Codex sends the required revisions back to the original worker with `send_input`.
3. If the original worker is closed, main Codex tries `resume_agent`; if that is unavailable or unsuitable, main Codex spawns a replacement worker with the previous diff, reviewer findings, exact ownership boundaries, and rework instructions.
4. The worker reports the updated diff and verification evidence.
5. A separate reviewer subagent reviews the updated result and ends with exactly `Verdict: APPROVE` or `Verdict: REJECT`.
6. Repeat until reviewer verdict is `Verdict: APPROVE` or main Codex escalates the blocker to the user.

Tasks need enough objective, file ownership, verification, and expected-result detail for the main session to route this loop without inventing missing requirements.

## Completion Rule

In team-driven execution, a task is complete only after:

- The worker reports changed files and verification evidence.
- A separate reviewer subagent returns final line `Verdict: APPROVE`.
- Main Codex inspects the relevant diff and verification output.

Do not mark a task complete from worker self-report alone.

## Progress Tracking

When executing or handing off the plan in Codex, use `update_plan` for the visible checklist.

Do not require automatic commits unless the user explicitly asks for commits.

## Execution Handoff

After saving the plan, offer these execution paths:

1. Codex Team-Driven: only when the user explicitly wants parallel agents, delegation, or a team workflow.
2. Inline Execution: execute in the current Codex session with `executing-plans`.

If the user chooses team-driven execution, apply `team-driven-development` and obey the Codex delegation gate.

If the user chooses inline execution, apply `executing-plans` and keep work local unless the user later authorizes delegation.
