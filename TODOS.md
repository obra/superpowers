# TODOS

## Completed

### Supported User-Facing Workflow CLI

Completed in the workflow runtime. Superpowers now ships `bin/superpowers-workflow` and `bin/superpowers-workflow.ps1` as the supported public read-only inspection CLI for `status`, `next`, `artifacts`, `explain`, and `help`, backed by the side-effect-free internal `resolve` path in `bin/superpowers-workflow-status`.

### Enforce Plan Checklist State During Execution

Completed in the execution-workflow helper plus execution/review workflow skills. Execution now flips approved-plan step checkboxes through `superpowers-plan-execution`, the execution skills treat the approved plan checklist as the execution progress record, and the review/branch-finish gates fail closed when checked steps or evidence drift out of truth.

### Execution Handoff Recommendation Flow

Completed in the execution-workflow helper. `superpowers-plan-execution recommend --plan <approved-plan-path>` now derives `tasks_independent` from task `**Files:**` write scopes, combines that with the session-context inputs, and recommends either `superpowers:subagent-driven-development` or `superpowers:executing-plans` through the approved handoff flow.
