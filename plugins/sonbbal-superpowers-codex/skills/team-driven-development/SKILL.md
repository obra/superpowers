---
name: team-driven-development
description: Use when the user explicitly requests a Codex team workflow, delegated workers, or parallel agent work.
---

# Team-Driven Development In Codex

## Core Rule

Do not spawn agents just because a task is complex. Spawn agents only when the user explicitly requested subagents, delegation, parallel agents, or a team workflow.

If that request is absent, execute inline and use the local checklists in this skill.

## Roles

| Role | Codex behavior |
| --- | --- |
| Team Lead | The current Codex session. Coordinates work, maintains `update_plan`, reviews diffs, integrates results. |
| API/EDR Reviewer | Delegated only when parallel agent work is explicitly requested. Otherwise, perform the API and contract checklist locally. |
| Audit Reviewer | Delegated only when parallel agent work is explicitly requested. Otherwise, perform the verification checklist locally. |
| Worker | A `spawn_agent` worker only when the user explicitly authorized delegation or parallel agent work. |

## Local Checklist Mode

Use this mode when the user did not authorize delegation.

1. Review the plan and create an `update_plan` checklist.
2. Identify API contracts, data structures, and naming rules before editing.
3. Execute tasks inline.
4. Run task-level verification.
5. Review changed files against the plan.
6. Run final verification before reporting status.

## Delegated Mode

Use this mode only when delegation is explicitly authorized.

1. Keep the current Codex session as Team Lead.
2. Split only independent work into bounded tasks with disjoint file ownership.
3. Use `spawn_agent` for workers when parallel execution will materially help.
4. Tell each worker they are not alone in the codebase and must not revert others' changes.
5. Use `send_input` for follow-up instructions to existing agents.
6. Use `wait_agent` only when blocked on an agent result.
7. Review every returned diff locally before integrating or marking work complete.

## API/EDR Review Checklist

Before implementation, confirm:

- Existing APIs, file formats, and data shapes.
- Required environment variables or configuration names.
- Naming consistency across docs, tests, and implementation.
- Any new contract is documented in the appropriate project location.

Do not invent endpoints, schemas, variable names, or file formats when the repository already defines them.

## Audit Review Checklist

Before marking a task complete, confirm:

- The changed files match the plan's scope.
- The stated tests or validation commands ran.
- Failures are either fixed or reported as blockers.
- No unrelated root package, hook, or metadata changes slipped in.
- Final verification has fresh evidence.

## Model And Reasoning

Use `model-assignment` before delegating. Prefer inherited model settings for straightforward workers and higher reasoning effort for difficult review or integration tasks when the delegation tool supports it.
