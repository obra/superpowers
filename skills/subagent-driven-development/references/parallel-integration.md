# Parallel Trajectories and Integration

A trajectory is an independently mergeable task (or an eligible batch).
Maintain per-trajectory state in the coordinator's ledger: prerequisites,
ownership/interfaces, branch, absolute worktree, dispatch base SHA,
current reviewed HEAD, agent identity, resource assignments, review state,
and verified integration SHA. DONE is ready for review, not integrated.

Use superpowers:using-git-worktrees to create a unique branch/worktree per
ready trajectory from the verified integration tip containing all its
prerequisites. Existing isolation of the coordinator is not isolation for
another worker. Never reuse an active worker's branch/worktree. Dispatch
independent ready tasks concurrently within user/runtime capacity; if safe
isolation is unavailable, serialize them instead. One writer per task;
overlapping files, lockfiles, ports, databases, outputs, and external
services require planned ownership, isolation, or serialized access.

Run workspace, brief, and review-package helpers from the integration
worktree using absolute script and plan paths. Git can read task commits
through shared repository objects; pass the task's exact SHAs, not the
integration branch's HEAD. Hand artifacts over by absolute path. Only the
coordinator writes the ledger/briefs/packages; a worker may write only its
explicitly assigned report file in that shared scratch workspace.

Record transitions separately: pending -> implementing -> reviewing ->
ready to integrate -> integrated. Freeze the task worktree during review;
verify its branch, clean status, and final HEAD before packaging and again
before integration. Review finished tasks without waiting for unrelated
siblings. A fix needs the existing scoped re-review; unexpected new
commits or a changed review base invalidate readiness and require a fresh
task review. Parked rulings never waive prerequisite or integration gates.

**Only the coordinator integrates, one result at a time.** Verify its
integration worktree is clean, on the assigned branch at the last verified
SHA, and that the task still matches its reviewed HEAD. Merge that SHA,
not a moving branch name:

```bash
git -C "$integration_dir" status --porcelain
git -C "$integration_dir" branch --show-current
git -C "$integration_dir" rev-parse HEAD
# Proceed only after checking those results against the ledger.
git -C "$integration_dir" merge --no-ff --no-commit "$reviewed_head"
# Run the plan's exact combined-tree checks here; stop on any failure.
git -C "$integration_dir" diff --exit-code
# No hand edits or test-generated tracked changes may slip into this merge.
git -C "$integration_dir" commit -m "merge: integrate task $task_number"
git -C "$integration_dir" rev-parse HEAD
```

Set these variables from the ledger. These are ordered gates, not an
unconditional script. Honor repository commit-message rules. Relevant
build/type/lint checks and the planned cross-trajectory checks must pass
on the combined tree before the merge commit. Only then record its SHA,
mark the task complete, and release dependents from that verified tip.
Integrate ready results without waiting for unrelated siblings.

On conflict or failed integration checks, leave the task unintegrated and
dependents blocked. Report the failure; abort only this coordinator's
in-progress merge with `git merge --abort`. Preserve the last verified
integration tip and the task branch/worktree; never hard-reset, force
ours/theirs, or delete unmerged work. Do not hand-edit the integration
tree. Send reconciliation to the isolated implementer. The coordinator
may explicitly authorize merging a pinned verified integration SHA into
that task branch while no reviewer is reading it; never rebase an active
branch. Update the task's review base to that included SHA, re-test,
pin the new HEAD, and obtain a fresh task review before retrying.
Unrelated isolated work may continue; merges resume only after the clean
verified integration state is restored.

If nothing is ready or active, inspect blocked prerequisites or a cycle;
do not declare completion. Final review requires every task to be
integrated. Cleanup requires all agents stopped, clean task worktrees,
and `git merge-base --is-ancestor <reviewed-head> <verified-integration-head>`
to succeed. Use normal Git worktree removal and merged-branch deletion,
never forced deletion; preserve dirty or unmerged work for recovery.
