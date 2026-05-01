---
name: model-assignment
description: Use when deciding Codex model and reasoning settings for delegated agents.
---

# Model Assignment In Codex

## Overview

Prefer the current session's inherited model for most delegated work. In team-driven mode, the main Codex session is orchestration-only: assign implementation to worker subagents with `spawn_agent`, then assign review to separate reviewer subagents. Adjust reasoning effort only when the task complexity, role, and risk justify it and the delegation tool supports that option.

Do not name provider-specific model tiers as operational choices in this skill. Codex environments expose their own available models and reasoning controls.

## Default Assignments

| Task type | Worker subagent assignment | Reviewer subagent assignment |
| --- | --- | --- |
| Simple documentation, config, or mechanical edits | Keep inherited model and default reasoning. | Keep inherited model and default reasoning. |
| Focused implementation following clear local patterns | Keep inherited model; consider medium reasoning if available. | Keep inherited model; consider medium reasoning for non-trivial diffs. |
| Architecture, security, data migration, integration, or broad cross-file changes | Use enough reasoning for the implementation complexity; prefer higher reasoning when the work can affect shared behavior or irreversible state. | Prefer higher reasoning because reviewer scrutiny is the control point for architecture, security, integration, migration, and broad diff risk. |
| Unclear ownership, scope, or acceptance criteria | Main splits the task into bounded worker assignments or asks the user before delegation. | Review only after the worker assignment and acceptance criteria are bounded. |
| Final audit or cross-file consistency review | No implementation worker unless rework is needed. | Prefer higher reasoning for broad final review. |

## Delegation Decision

Before assigning a worker subagent, confirm delegation is allowed:

- The user explicitly requested subagents, delegation, parallel agent work, or a team workflow.
- The task is bounded and has clear ownership.
- The delegated result can be reviewed by a separate reviewer subagent.

In team-driven mode, the main Codex session does not implement directly. If ownership or scope is unclear, main splits the task into smaller worker assignments or asks the user for clarification.

## Worker Subagent Assignment

Assign worker subagents implementation tasks only after the main session defines ownership, scope, and expected output. Match reasoning effort to implementation complexity:

- Use default reasoning for straightforward copy edits, mechanical changes, and small tests with clear expected output.
- Use medium reasoning when the worker must understand local patterns, update related tests, or make focused cross-file edits.
- Use higher reasoning when implementation involves architecture, security, data migration, integration behavior, complex debugging, or broad shared contracts.

Workers return their result to main. Main then assigns review to a separate reviewer subagent.

## Reviewer Subagent Assignment

Assign reviewer subagents to inspect worker output independently. Reviewer scrutiny is often higher than worker reasoning when the review covers:

- Architecture or shared abstractions.
- Security-sensitive behavior.
- Data migrations or irreversible changes.
- Integration behavior across modules or services.
- Broad diffs, final audits, or cross-file consistency.

Reviewer output may include explanatory text, but the final line must be exactly `Verdict: APPROVE` or `Verdict: REJECT`. On `Verdict: REJECT`, main orchestrates the rework loop with `send_input` back to the worker, then sends the revised result to a separate reviewer subagent for review. If the original worker is closed, main tries `resume_agent`; if that is unavailable or unsuitable, main creates a replacement worker with the prior diff, reviewer findings, exact ownership boundaries, and rework instructions.

## Reasoning Effort

Use higher reasoning effort when task risk or role requires it:

- Implementation workers need enough reasoning for the task complexity and blast radius.
- Reviewer subagents often need higher scrutiny for architecture, security, integration, data migration, or broad diff review.
- Complex debugging or root-cause analysis usually requires higher reasoning for both worker and reviewer roles.

Use default reasoning for:

- Straightforward copy edits.
- Package metadata updates.
- Small tests with clear expected output.
- Mechanical changes following an existing pattern.
