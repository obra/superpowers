# Toolbelt Workflow Summary

Canonical two-paragraph workflow explanation for a consuming project's `AGENTS.md`. If a new capability cannot fit here or needs a third entry point, redesign the capability, not this summary.

New or ambiguous work uses `brainstorming` and `writing-plans`. Delivery starts from either a small decision-complete request or an approved implementation plan; tracker reconciliation is optional and happens only when the plan is linked to it.

Delivery gives each PR boundary one implementer in an isolated worktree, optionally gates material user-visible changes, runs one review scaled to the boundary's risk, and hands the PR to a monitor that carries it through merge and cleanup.

Two public entry points:

- `quick-task`: a small decision-complete change, straight to one reviewed, merged PR.
- `delivery`: an approved implementation plan, one reviewed, merged PR per boundary, then cleanup.
