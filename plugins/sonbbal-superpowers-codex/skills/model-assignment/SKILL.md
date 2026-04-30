---
name: model-assignment
description: Use when deciding Codex model and reasoning settings for delegated agents.
---

# Model Assignment In Codex

## Overview

Prefer the current session's inherited model for most delegated work. Adjust reasoning effort only when the task complexity justifies it and the delegation tool supports that option.

Do not name provider-specific model tiers as operational choices in this skill. Codex environments expose their own available models and reasoning controls.

## Default Assignments

| Task type | Assignment |
| --- | --- |
| Simple documentation, config, or mechanical edits | Keep inherited model and default reasoning. |
| Focused implementation following clear local patterns | Keep inherited model; consider medium reasoning if available. |
| Security, architecture, data migration, integration, or unclear requirements | Prefer local review first; use high-reasoning delegated review only when delegation is explicitly allowed. |
| Final audit or cross-file consistency review | Prefer local verification; use high-reasoning delegated review only when delegation is explicitly allowed. |

## Delegation Decision

Before assigning a model, confirm delegation is allowed:

- The user explicitly requested subagents, delegation, parallel agent work, or a team workflow.
- The task is bounded and has clear ownership.
- The delegated result can be reviewed locally.

If any condition is false, do the work inline.

## Reasoning Effort

Use higher reasoning effort for:

- Cross-module architecture decisions.
- Security-sensitive behavior.
- Data migrations or irreversible changes.
- Complex debugging or root-cause analysis.
- Final review of broad changes.

Use default reasoning for:

- Straightforward copy edits.
- Package metadata updates.
- Small tests with clear expected output.
- Mechanical changes following an existing pattern.

When in doubt, keep the work local and verify thoroughly.
