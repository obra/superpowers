---
name: delivery
description: Use when an approved implementation plan is ready to be implemented and shipped.
---

# Delivery

Take an approved plan from its first PR boundary to every PR merged and cleaned up. A **boundary** is one row of the plan's `## PR Boundaries`: one branch, one implementer, one PR. A **chain** is a stack of dependent boundaries. Call this skill's scripts as `bash scripts/<name>`.

## What you read

Read the plan, this skill, [branch-lifecycle.md](branch-lifecycle.md), agent-routing with the routing text, using-git-worktrees with the worktree policy, the ledger, and each implementer's reply. `dispatch-prompt` fills the prompt templates, so do not read them. Diffs, reviews, and logs move by path. Check an implementer's claim against the diff before you raise it to your human partner.

## Start

1. Run `bash ../writing-plans/scripts/plan-check PLAN`. A failure goes back to planning.
2. Run `bash scripts/workspace PLAN` from the starting checkout, and keep that checkout until every boundary closes. The ledger is `<workspace>/delivery.md`.
3. Resolve the implementer, reviewer, and monitor routes with agent-routing, plus an `errand` gate runner when a boundary runs ux-gate.
4. If the ledger already has lines, recover first.

## Per boundary

Up to three implementers run at once, on independent boundaries with disjoint files, unless the worktree policy sets a lower limit. A dependent boundary starts once its predecessor's PR is recorded.

1. **Worktree.** Branch from the base branch, or from the predecessor's head while its PR is open. Create the worktree with using-git-worktrees on branch `<plan-slug>/pr-<N>` and record the fork SHA. A boundary that follows interactive-design keeps the prototype branch, worktree, and baseline; its review BASE is the commit before the prototype commits.
2. **Dispatch.** Run `bash scripts/dispatch-prompt implementer --plan PLAN --boundary N --worktree DIR`. Dispatch one implementer with "Read <printed path> and follow it", and record its agent id.
3. **Reply.** Save it to `<workspace>/boundary-N-report.md`. `DONE` continues. `NEEDS_DECISION` goes to your human partner; append the ruling under `## Rulings` in the brief it concerns and resume the implementer. Retry `BLOCKED` once with what it asked for or a stronger routed model; a second `BLOCKED` goes to your human partner.
4. **Liveness.** Wait on agents with one blocking call. Check any agent with no new commit or output for 60 minutes. Replace a stuck or unresumable implementer with a fresh one, given the prompt path, the report so far, and the current head.
5. **UX gate.** When ux-gate's entry condition holds, dispatch the gate runner with toolbelt:ux-gate, the changed pages, acceptance criteria, environment, range, the plan's absolute path, and the prototype ledger's absolute path when the boundary follows interactive-design. Its review file goes to the same implementer.
6. **Review**, then **Publish**.

## Review

- `Risk: none` skips the review.
- Otherwise rebase an unpublished dependent boundary per branch-lifecycle.md. Run `bash scripts/review-package --plan PLAN BASE HEAD`, BASE being the fork SHA or the new parent head after a rebase.
- Run `bash scripts/dispatch-prompt reviewer --plan PLAN --boundary N --package FILE`, and dispatch the routed reviewer at the effort the row's `Risk` sets with "Read <printed path> and follow it."
- Over 2,000 changed lines, or across areas one reader cannot hold, give up to three reviewers one path slice each (`review-package ... -- <paths>`, `dispatch-prompt reviewer ... --slice "<paths>"`). Run them in parallel and merge their findings.
- Send every Critical and Important finding to the same implementer in one dispatch. Run no local re-review; the providers' next round is the re-check. A `plan-gap` finding goes to your human partner.
- Record `Review: clean|fixed|skipped at <SHA>`.

## Publish

Hand the boundary to toolbelt:pr-monitor with the worktree, the target base (the predecessor's branch, or the base branch), the review SHA, and the ledger path. The first boundary of a chain starts a monitor in the background; a dependent boundary resumes its chain's monitor; independent boundaries may share one. Check the ledger for a live monitor before starting another. Keep delivering while monitors run.

## On return

- **Merged:** confirm the PR is `MERGED` on the remote, reconcile the issue tracker when the plan links one, and clean up per branch-lifecycle.md.
- **Blocked:** take it to your human partner and continue whatever it does not block.

You are done when every boundary is merged and cleaned up, or blocked with your human partner told. Waiting on a monitor is not done.

## Ledger

Append with `bash scripts/ledger-append LEDGER "line"` at gates only: a dispatch or reply, a ruling, a review verdict, a rebase, a PR opened or merged, a blocker raised or cleared. Point one line at each saved report. Before the final cleanup, append an `## Inefficiencies` section by plain append, listing every wait, repeat, or stop the run did not need, and include it in your closing message.

## Recovery

Read the ledger and `git log`, list worktrees, check live agents and remote PRs, then continue from the latest `Next:`. A recorded review counts only at the current head. Never redispatch a boundary already reviewed or published.

## Questions

Only product, money, or cross-team questions go to your human partner, in plain words. Decide everything else the money-safe way and note it in the ledger.
