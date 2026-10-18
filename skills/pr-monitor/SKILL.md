---
name: pr-monitor
description: Use when a reviewed branch needs its pull request, or a chain of dependent pull requests, published and carried through CI, review providers, and fixes to merge.
---

# PR Monitor

Carry one chain of stacked PRs, or a set of independent PRs, to merge. A chain has exactly one monitor. Call this skill's scripts as `bash scripts/<name>`.

## Policy

Read `.toolbelt/pr-policy.md` at the repository root when present; it overrides this skill. It names the review providers, the PR-state and wait commands, and timeouts. Without it, a PR is merge-ready on exact-head green CI, no unresolved review thread, and no requested-changes review. Request only the providers the policy names.

## Publish

For an unpublished branch, run finishing-a-development-branch on the pull-request route with the caller's target base. Run no local tests: the `Review:` record at head is the gate evidence, and CI is the merge gate. With a ledger, append the boundary's state record with the PR number and `state open`, using `bash ../delivery/scripts/ledger-append`.

## Each round

1. Read `bash scripts/pr-state <PR>`, or the policy's command. Exit 2 or 3 means the state is unknown, never clean. Resolve a merge conflict first; a conflicting PR schedules no CI.
2. Evidence belongs to one head. Request each policy provider once per head: when the PR opens and after every push, fix or rebase. A docs-only push, per finishing-a-development-branch Step 1, carries completed provider reviews forward.
3. A provider has completed when its review covers the current head. One that passes the policy timeout (default 20 minutes), or fails, skips, or rate-limits, drops out for that head; record the fallback in the PR body.
4. Once every awaited provider has completed, fix what is real, with its siblings (toolbelt:receiving-code-review), and run only the tests that cover the fix. Push the fixes as one batch, and rebut the rest on the thread with code evidence. The providers' next round is the re-review.
5. After two provider rounds, move a finding to a `## Follow-ups` list in the PR body and resolve its thread when the provider rates it below its top two severities and it touches no data, security, or money, unless the policy forbids it.
6. A finding that would change the design, or a PR that has diverged from its plan, blocks that PR. Record why in the ledger and keep carrying the other PRs.
7. With nothing actionable, wait with one call: the policy's wait command, or 180 seconds. Waiting on a provider or CI is not a reason to return; wait again in the same turn.

## Chains

- The lowest unmerged PR gets all attention; fix nothing above it until it merges.
- Fix a finding in the lowest PR whose diff contains the code. Then rebase each PR above, one at a time upward, with `git rebase --onto <parent-new-head> <parent-old-head> <branch>`, and push with `--force-with-lease`.
- Only the monitor moves a published branch. Append `Boundary <N>: rebased <old SHA> → <new SHA>` to the ledger each time.
- Merge bottom-up: squash-merge the bottom PR and delete its branch. Confirm the next PR's base with `gh pr view --json baseRefName`, or set it with `gh pr edit --base`. Rebase it with `git rebase --onto <base-branch> <merged-pr-old-head> <branch>`, then propagate upward.
- On a rebase conflict, run `git rebase --abort` and mark that PR blocked with the conflicting paths.
- A blocked or closed-unmerged PR blocks every PR above it in its chain.

## Merge and return

Merge a PR when its head has every provider completed or recorded as a fallback, green CI, a mergeable state, and no unresolved thread. Confirm the remote PR is `MERGED`.

Return when every PR is merged or blocked, with one entry per PR: number, final head SHA, remote state, merge commit, target branch, and any blocker.
