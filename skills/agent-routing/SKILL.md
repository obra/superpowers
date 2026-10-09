---
name: agent-routing
description: Use before any dispatch that needs a role resolved. Callers request logical roles and never pick concrete agents themselves.
---

# Agent Routing

## The routing text

A session-start hook injects the project's routing text for your harness in an `<AGENT-ROUTING source="...">` block, read from `.toolbelt/routing/<harness>.md` in the project's main checkout. Route every dispatch from it.

When no block is in your context, read the bundled default for your harness, `routing/claude.md` or `routing/codex.md`, next to this `SKILL.md`.

Map the model and effort the text names to an agent you can launch: a native subagent for your own harness, AGX for the other. Run `codex exec` or `claude -p` directly only when AGX is not installed. If the text names something you cannot launch, stop and tell your human partner. Never substitute a different model.

## Roles

| Role | Owns |
|---|---|
| `explorer` | Codebase context, architecture, prior art, external research. Read-only. |
| `planner` | All planning work, however small it looks. |
| `implementer` | All code operations. Every repository edit. |
| `errand` | Tracker tickets, notifications, status checks, scripted browser capture. Never edits repository files. |
| `monitor` | A pull request through CI, review providers, review-finding fixes, and merge. |
| `reviewer` | Review, with specialty `code`, `spec`, `plan`, `ux`, or `gate`. |

The boundary that matters: **planning goes to the planner, always; code goes to the implementer, except review findings on the monitor's own PR, which it fixes inline.** `errand` is cheap because its work is small, never a shortcut for real work.

When the routing text does not name a role you need, stop and tell your human partner rather than choosing one.

## Reviewer independence

A reviewer always runs on a different harness from the one that wrote the work. If the routing text would put the review on the author's harness, stop and tell your human partner.

## Precedence

A plan's `## Agent Routing` section, in plain words, overrides the routing text for that plan's work; the routing text overrides the bundled default. A plan may route implementer, task-reviewer, and final-reviewer work, but never the session orchestrator.

## Provider-outage emergency override

Reviewer independence has exactly one exception. The trigger is **dispatch-time provider failure**: dispatching the routed reviewer and each different-harness fallback the routing text names failed with provider availability errors on repeated attempts. When the trigger is met, the orchestrator may dispatch a **fresh instance** of the most capable reachable route as the reviewer, even on the author's harness. Constraints:

- Record the audit trail before invoking it: each failed route, the error, and the attempt times.
- Never the author's own thread or instance — always a fresh dispatch with independently constructed context.
- The review report and any resulting PR body carry an `EMERGENCY SAME-HARNESS REVIEW` flag naming the outage.
- Do not downgrade to a lower-capability route to manufacture independence; a capable same-harness review beats an incapable different-harness one.
- The override lasts only as long as the outage: resume normal routing — including for delta re-gates of work reviewed under the override — the moment a different-harness route is reachable.
- The routing text may name the concrete emergency route and routes excluded from review; it governs.

## Setup

Claude Code runs the hook from this plugin. Codex does not run plugin hooks: run `scripts/setup-codex-routing` from the toolbelt checkout once per machine, then trust the hook when Codex next starts.
