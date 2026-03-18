# TODOS

## Workflow Runtime

### Supported User-Facing Workflow CLI

**What:** Add a supported user-facing CLI for inspecting and navigating Superpowers workflow state on top of the internal workflow-status helper and manifest.

**Why:** The internal helper solves runtime routing first, but users will eventually need a stable, documented way to inspect workflow state directly without reading local manifest files or skill internals.

**Context:** The workflow-state runtime design keeps repo docs authoritative and introduces a branch-scoped local manifest under `~/.superpowers/projects/<repo-slug>/<user>-<safe-branch>-workflow-state.json`. This follow-up should wait until the internal contract is stable, then expose a clear public surface for status, expected next step, and artifact discovery.

**Effort:** M
**Priority:** P3
**Depends on:** Workflow-state runtime v1

## Completed

### Enforce Plan Checklist State During Execution

Completed in the execution-workflow helper plus execution/review workflow skills. Execution now flips approved-plan step checkboxes through `superpowers-plan-execution`, the execution skills treat the approved plan checklist as the execution progress record, and the review/branch-finish gates fail closed when checked steps or evidence drift out of truth.

### Execution Handoff Recommendation Flow

Completed in the execution-workflow helper. `superpowers-plan-execution recommend --plan <approved-plan-path>` now derives `tasks_independent` from task `**Files:**` write scopes, combines that with the session-context inputs, and recommends either `superpowers:subagent-driven-development` or `superpowers:executing-plans` through the approved handoff flow.
