# TODOS

## Review

### Revisit Borrowed-Layer Drift Policy If Gstack Surface Grows

**What:** Re-evaluate whether Superpowers needs an explicit recurring review policy for gstack-derived borrowed-layer drift if more upstream surface area continues landing here.

**Why:** The current alignment spec intentionally stays narrow and tactical. If the borrowed layer keeps expanding, relying on one-off comparisons may stop being disciplined enough.

**Context:** Deferred explicitly by `docs/superpowers/specs/2026-03-18-gstack-borrowed-layer-alignment-design.md`. This is not required for the current change and should stay out of the initial implementation plan.

**Effort:** S
**Priority:** P3
**Depends on:** Shipping and operating the current 4-item alignment package first

### Public Inspection Surface For Accelerator Packets

**What:** Add a supported CLI or status/debug surface for persisted accelerated-review packets, resume eligibility, stale-fingerprint reasons, and retention state.

**Why:** Once accelerated CEO/ENG review ships, operators will eventually need a safer and clearer way to inspect saved review state than reading raw files under `~/.superpowers/projects/...`.

**Context:** The approved review-accelerator design intentionally keeps persisted packet state inside skill instructions, markdown artifacts, and deterministic tests. This should stay out of the current PR, but after real usage we should decide whether `superpowers-workflow` or `superpowers-workflow-status` needs a read-only inspection surface for packet history, resume diagnostics, and cleanup visibility.

**Effort:** M
**Priority:** P3
**Depends on:** Shipping and exercising the core accelerated review flow first

## Completed

### Harden Session-Entry Bootstrap And Branch-Safety Guarantees

Completed in the runtime and workflow layers. Superpowers now ships runtime-owned `superpowers-session-entry` and `superpowers-repo-safety` helpers, blocks repo-writing workflow stages on protected branches by default unless task-scoped approval survives helper re-check, and carries deterministic plus doc-driven coverage for the first-turn bootstrap and protected-branch guarantees that were missing when this item was opened.

### Supported User-Facing Workflow CLI

Completed in the workflow runtime. Superpowers now ships `bin/superpowers-workflow` and `bin/superpowers-workflow.ps1` as the supported public read-only inspection CLI for `status`, `next`, `artifacts`, `explain`, and `help`, backed by the side-effect-free internal `resolve` path in `bin/superpowers-workflow-status`.

### Enforce Plan Checklist State During Execution

Completed in the execution-workflow helper plus execution/review workflow skills. Execution now flips approved-plan step checkboxes through `superpowers-plan-execution`, the execution skills treat the approved plan checklist as the execution progress record, and the review/branch-finish gates fail closed when checked steps or evidence drift out of truth.

### Execution Handoff Recommendation Flow

Completed in the execution-workflow helper. `superpowers-plan-execution recommend --plan <approved-plan-path>` now derives `tasks_independent` from task `**Files:**` write scopes, combines that with the session-context inputs, and recommends either `superpowers:subagent-driven-development` or `superpowers:executing-plans` through the approved handoff flow.
