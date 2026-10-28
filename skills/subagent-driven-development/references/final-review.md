# Final Review and Finish

Part of superpowers:subagent-driven-development. Every trajectory in the plan is
integrated and verified on the coordinator's integration branch.

Freeze that branch for whole-branch review. Supply its absolute worktree,
branch, recorded starting SHA, and exact final HEAD, with all trajectory
merges and their check evidence in the ledger. Do not review a moving
integration branch or another trajectory's checkout.

The final whole-branch review gets a package too: run
`bash scripts/review-package PLAN_FILE MERGE_BASE HEAD` (MERGE_BASE = the commit the
branch started from, e.g. `git merge-base main HEAD`) and include the
printed path in the final review dispatch, so the final reviewer reads
one file instead of re-deriving the branch diff with git commands. Dispatch
on the most capable available model (see SKILL.md's Model Selection), using
superpowers:requesting-code-review's
[code-reviewer.md](../../requesting-code-review/code-reviewer.md). Point it at
the ledger's deferred-minor and parked lines so it can triage which must be
fixed before merge.

If the final whole-branch review returns findings, dispatch ONE fix subagent
in a new isolated trajectory from the verified integration tip with the
complete findings list — not one fixer per finding.
Per-finding fixers each rebuild context and re-run suites; a real
session's final-review fix wave cost more than all its tasks combined.
Then run exactly one scoped re-review of the fix wave in that worktree
(`bash scripts/review-package PLAN_FILE FIX_BASE HEAD` over the fix range,
[re-review-prompt.md](../re-review-prompt.md)).
Adjudicate any residual findings as in the fix loop's breaker
(references/fix-loop.md): park with rulings, or rule on the load-bearing
ones and ledger what you decided. Only the four things that stop a running
plan (top of SKILL.md) stop you here. There is no second fix wave —
residual load-bearing findings surface to your human partner when
finishing-a-development-branch presents the options.

Integrate the reviewed fix HEAD through the same coordinator-owned,
serialized merge and combined-tree checks. Failed integration does not
become complete through a parked ruling: retain the fix worktree and
recover using [parallel-integration.md](parallel-integration.md). Run the plan's final
checks on the verified integration result before branch completion.

### Finish

Before you delete anything, collect every ledger line containing `Ruling:` —
preflight rulings, parked findings, breaker adjudications, all of them — into
your final message under "Rulings I made", in the order you made them, each
with what it costs if wrong. The list is exhaustive: if the ledger holds a
ruling, the list holds it. That list is the only place the decisions you
took on your human partner's behalf reach them — they read it and rework
whatever you got wrong. A ruling that dies with the workspace was a decision
made in secret.

When the final whole-branch review is clean and its fixes are merged,
first confirm every agent using this plan's artifacts or trajectory worktrees
has stopped. Remove only clean trajectory worktrees whose pinned HEADs are
ancestors of verified integration; preserve dirty/unmerged work. Then
delete this plan's workspace (`rm -rf <workspace>`) — the git history is
the record now. Sibling directories belong to other plans; leave them
alone.

Use superpowers:finishing-a-development-branch.
