---
name: agent-routing
description: Use before any dispatch that needs a role resolved. Callers request logical roles and never pick concrete agents themselves.
---

# Agent Routing

## The routing text

A session-start hook injects `.toolbelt/routing/<harness>.md` from the project's main checkout in an `<AGENT-ROUTING source="...">` block. Without the block, read the bundled `routing/claude.md` or `routing/codex.md` next to this file. Route every dispatch from it.

Map each model and effort to an agent you can launch: a native subagent on your own harness, AGX for the other. Run `codex exec` or `claude -p` directly only when AGX is not installed. If you cannot launch what the text names, stop and tell your human partner rather than substituting a model.

## Roles

| Role | Owns |
|---|---|
| `implementer` | Every repository edit. |
| `planner` | All planning work. |
| `explorer` | Read-only codebase context and research. |
| `errand` | Tickets, status checks, scripted capture. Never edits repository files. |
| `monitor` | PRs through CI, review providers, review fixes, and merge. |
| `reviewer` | Review, with specialty `code`, `spec`, `plan`, `ux`, or `gate`. |

The monitor fixes review findings on its own PR inline; all other code goes to the implementer. When the text names no route for a role you need, stop and tell your human partner.

The plan's `Risk` column raises effort and never changes the model. A `high` row raises the reviewer one effort level above its route.

## Reviewer independence

A reviewer runs on a different harness from the implementer's. If the text would put a review on the implementer's harness, stop and tell your human partner.

## Precedence

Your human partner's direct instruction wins, then the routing text, then the bundled default. Plans carry no routing, and a route in a ledger is audit metadata.

## Outage override

The trigger: the routed reviewer and every other-harness fallback the text names failed with provider availability errors on repeated attempts. Then dispatch a fresh instance of the most capable reachable route as the reviewer, even on the implementer's harness:

- Record each failed route, its error, and the attempt times first.
- Use a fresh dispatch with its own context, never the author's thread.
- Flag the review report and the PR body `EMERGENCY SAME-HARNESS REVIEW`, naming the outage.
- Keep capability; never downgrade to manufacture independence.

The override ends the moment an other-harness route is reachable.

## Setup

Claude Code runs the hook from this plugin. Codex does not run plugin hooks: run `scripts/setup-codex-routing` from the toolbelt checkout once per machine, then trust the hook when Codex next starts.
