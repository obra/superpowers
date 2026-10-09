---
name: delivery
description: Use when an approved implementation plan is ready to be implemented and shipped.
---

# Delivery

Take an approved plan from its first PR boundary to every PR merged and cleaned up. A **boundary** is one row of the plan's `## PR Boundaries`: one branch, one PR. A **chain** is a stack of dependent boundaries, each PR targeting its predecessor's branch.

## 1. Start

Invoke toolbelt:orchestrating first; its read list holds throughout. Read the plan and [branch-lifecycle.md](branch-lifecycle.md), and open the delivery ledger it describes before creating any worktree. Execute the boundaries in the plan's order. The plan is approved: take any product decision it leaves open to your human partner rather than redesigning it.

After an interruption, recover from the ledger, Git and worktree state, and live PR state before dispatching anything.

## 2. Resolve routes

Route every role with toolbelt:agent-routing; precedence is plan route, then project route, then bundled default. The plan's optional `## Agent Routing` section may route the implementer, task reviewer, and final reviewer (specialty `gate`); the session agent remains the orchestrator and is never plan-routed. The monitor, and the `errand` gate runner for a boundary that runs ux-gate, come from the project's routing text or the bundled default. If either reviewer lacks a route independent of the implementer, stop, unless agent-routing's outage override applies.

## Who does what

Dispatch prompts never reassign these.

| Work | Owner |
|---|---|
| Code, tests, commits, task reports, UI smoke of the touched pathway | Implementer, fresh per task |
| Task reviews and the whole-branch final review | Reviewers |
| Boundary UX capture and verdict | Gate runner with toolbelt:ux-gate, which dispatches a `ux` reviewer |
| Workspace suite, PR publication, CI, provider reviews, PR fixes, published-branch rebases, merge | pr-monitor, one per chain |
| Worktrees, unpublished-branch rebases, issue-tracker reconciliation, cleanup | You |

## 3. Execute each boundary

1. **Branch point.** An independent boundary branches from the base branch. A dependent boundary's `Depends on` may name one predecessor still open as a PR: fetch its remote head and branch from that SHA; if it has merged, branch from the updated base branch. Every other dependency must already be merged. An approved interactive-design prototype keeps its own branch, worktree, and baseline and ships as one PR.
2. **Worktree.** Create it with toolbelt:using-git-worktrees on branch `<plan-slug>/pr-<N>` (the plan file's basename without date or extension, and the boundary number), and record the boundary in the ledger.
3. **UX gate.** When the boundary meets ux-gate's entry condition (new user flows, material interaction, layout, or responsive changes, or an explicit UX-review request), give SDD the gate runner's route and what the runner needs: the changed pages, acceptance criteria, and environment. SDD adds the commit range when it dispatches. Routine cosmetic changes need no gate.
4. **Execute** with toolbelt:subagent-driven-development, giving it the boundary number, its task set, the starting SHA, the resolved routes, and the gate runner if any. SDD's final review is the boundary's gate; add no other whole-branch review.

Start the next boundary as soon as this one's monitor is running; any number may be open at once. A dependent boundary starts only after its predecessor's PR is recorded in the ledger.

## 4. Ship

When the final review is clean, hand the branch to the chain's pr-monitor, dispatched with toolbelt:pr-monitor, giving it:

- the worktree path and target base (the predecessor's branch for a dependent boundary, the base branch otherwise)
- the final-review SHA
- both ledger paths: `delivery.md` and the boundary's SDD `progress.md`

The first boundary of a chain starts its monitor in the background. A dependent boundary goes to its chain's running monitor by resuming it. A chain has exactly one pr-monitor: one that looks dead is not grounds to start a second one; check that state directly first.

Keep delivering independent boundaries while monitors run, then wait for their returns. Never report the work complete or end the session while a monitor runs. On each return:

- **Merged:** confirm the PR is `MERGED` on the remote, never commit ancestry; reconcile the issue tracker only when the plan is linked to one; then clean up per branch-lifecycle.md.
- **Blocked or escalated:** take it to your human partner. A bottom PR closed without merging blocks its whole chain; start no more boundaries in it.
