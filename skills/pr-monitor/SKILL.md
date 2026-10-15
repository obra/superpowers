---
name: pr-monitor
description: Use when a reviewed branch needs its pull request, or a chain of dependent pull requests, published and carried through CI, review providers, and fixes to merge.
---

# PR Monitor

Own one chain through merge: a single PR, or a stack of PRs each targeting the one below. This skill is the sole source of PR review, CI, fix-loop, and merge mechanics.

## Project policy

Read `.toolbelt/pr-policy.md` at the repository root if present. It names the review providers and how to request them, the wait command, complexity lanes, and timeouts, and it overrides this skill. Without it, a PR is merge-ready on exact-head green CI, zero unresolved review threads, and no requested-changes review. Never hard-code a provider this file does not name.

## Publish

For an unpublished branch, run toolbelt:finishing-a-development-branch on the pull-request route with the caller's target base; it runs the branch's related tests and opens the PR. When the caller gave you a delivery ledger, append `Boundary <N>: PR #<number> opened` to it with `../subagent-driven-development/scripts/ledger-append`.

For each PR, record its number, branch, base, head SHA, and local-gate SHA. The local final gate must have approved this exact head before monitoring begins.

**Evidence belongs to one head.** Any push starts a new cycle: CI and provider reviews complete again on the new head. The local gate carries forward through your own fix pushes. A rebase that leaves `git patch-id --stable` unchanged carries forward the local gate and completed provider reviews, unless the policy file says otherwise; a docs-only push, as finishing-a-development-branch Step 1 defines it, carries forward completed provider reviews. Record the head range each carried review covers.

## Chain rules

**Lowest first.** The lowest unmerged PR gets all attention until it merges. Collect review threads on the PRs above; fix none until the bottom is merge-ready.

**Fix in the owner.** A finding lands in the lowest PR whose diff contains the code. After pushing that PR, rebase each PR above it one at a time, upward, onto its parent's new head: `git rebase --onto <parent-new-head> <parent-old-head> <branch>`, where the parent is the PR directly below. Push each with `--force-with-lease`.

**One topology writer.** Only the monitor rebases, retargets, or force-pushes a published branch. Each time you move a branch, append `Boundary <N>: rebased <old SHA> → <new SHA>` to the delivery ledger when there is one, with `ledger-append`, and update that PR's recorded head.

**Merge bottom-up.** Squash-merge the bottom PR and delete its branch. GitHub retargets the next PR to the deleted branch's base; confirm with `gh pr view --json baseRefName`, or set it with `gh pr edit --base`. Rebase it with `git rebase --onto <base-branch> <merged-pr-old-head> <branch>` so the squashed commits are not replayed. Propagate upward through every PR above it, using each immediate parent's recorded old and new heads, and push each with `--force-with-lease`. Continue merging upward until a PR is not merge-ready.

On a rebase conflict, run `git rebase --abort` and return that PR as blocked with the conflicting paths.

## Monitor loop

1. Refresh the PR head, merge state, and unresolved threads. A conflicting PR schedules no CI: resolve the conflict first.
2. Refresh exact-head CI with the policy file's command, or `gh pr checks` without a policy. Distinguish failed, pending, and unavailable; fail closed on unavailable.
3. Request each policy-named provider at most once per head, then await it. A provider has completed when a review object or authenticated completion names the current head, or a head it carries forward from.
4. Once every awaited provider has completed on the current head, verify each finding against the code and judge it yourself: fix what is real, inline in your own session, and rebut what is not on the thread with code evidence. Each fix carries fresh passing covering-test evidence; the full suite is CI's. Push all fixes as one batch. The providers' next round on the new head is the re-review: request no local review of a fix round and dispatch no fixer. Escalate to the caller only when a finding would substantially change the design or the PR has diverged from its plan: send the decision needed, your recommendation, and minimal code evidence.
5. With nothing actionable, wait with one call: the policy's wait command (foreground, timeout above its ceiling) or one bounded interval (default 180 seconds). Between waits, never poll, sleep-loop, tail logs, or emit keep-alive commands. Do not nest another watcher.

## Fallback

A provider that hits the policy timeout on one head (default 20 minutes), or explicitly fails, skips, or rate-limits, drops out of the awaited set for that head. Record the fallback reason in the PR body before merging and in your return; the policy file decides whether a recorded fallback blocks. Every other condition still applies; never switch to an unnamed provider.

## Merge and return

Before merging a PR, check its expected head: each policy-named provider completed or recorded as a fallback, exact-head green CI, mergeable, and zero unresolved threads. Merge when all pass, then confirm the remote PR is `MERGED`.

Return when every PR is merged or one is durably blocked, never on a round count or elapsed time. Return one entry per PR: number, final head SHA, remote state (`MERGED`, `OPEN`, `CLOSED`), merge commit when merged, target branch, and any blocker. A bottom PR closed without merging blocks every PR above it. The caller owns post-merge reconciliation.
