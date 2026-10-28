# Parallel Trajectories and Integration

A trajectory is a coherent, independently mergeable workstream containing
one or more tasks. It owns a branch/worktree, not a fresh one per task.
Maintain per-trajectory state in the coordinator's ledger: prerequisites,
ownership/interfaces, branch, absolute worktree, dispatch base SHA,
task membership, completion boundary/checks, current HEAD, pinned final HEAD,
resource assignments, readiness, and verified integration SHA. Separately
record each task's BASE/HEAD, implementer identity and review/fix state.
Task DONE starts review; task complete advances internal work; only
trajectory integration satisfies cross-trajectory dependencies.

Use superpowers:using-git-worktrees to create a unique branch/worktree per
ready trajectory from the verified integration tip containing all its
prerequisites. Existing isolation of the coordinator is not isolation for
another worker. Never reuse an active worker's branch/worktree. Dispatch
independent ready trajectories concurrently within user/runtime capacity; if safe
isolation is unavailable, serialize them instead. One writer per trajectory;
overlapping files, lockfiles, ports, databases, outputs, and external
services require planned ownership, isolation, or serialized access.

Run workspace, brief, and review-package helpers from the integration
worktree using absolute script and plan paths. Git can read task commits
through shared repository objects; pass the task's exact SHAs, not the
integration branch's HEAD. Hand artifacts over by absolute path. Only the
coordinator writes the ledger/briefs/packages; a worker may write only its
explicitly assigned report file in that shared scratch workspace.

Record task transitions separately: pending -> implementing -> reviewing ->
complete. Trajectories move pending -> active -> ready to integrate ->
integrated. A task complete record names its owning trajectory and reviewed
task range; it needs no integration SHA. Freeze the trajectory worktree during task review;
verify its branch, clean status, and final HEAD before packaging and again
before integration. Review finished tasks without waiting for unrelated
trajectories. A fix needs the existing scoped re-review; unexpected new
commits or a changed review base invalidate readiness and require a fresh
task review. Parked rulings never waive prerequisite or integration gates.

All tasks in the trajectory's recorded scope must satisfy their review gates,
and its completion checks must pass before it becomes ready. Stop all its
agents/processes and pin its clean final HEAD. Earlier task review targets
remain in the ledger as history; integrate the completed trajectory HEAD.

**Only the coordinator integrates, one result at a time.** Verify its
integration worktree is clean, on the assigned branch at the last verified
SHA, and that the completed trajectory still matches its pinned HEAD. Merge that SHA,
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
git -C "$integration_dir" commit -m "merge: integrate trajectory $trajectory_id"
git -C "$integration_dir" rev-parse HEAD
```

Set these variables from the ledger. These are ordered gates, not an
unconditional script. Honor repository commit-message rules. Relevant
build/type/lint checks and the planned cross-trajectory checks must pass
on the combined tree before the merge commit. Only then record its SHA,
record `Trajectory <T>: integrated (base <dispatch-base>, head <pinned-head>, merge <merge-sha>, checks <evidence>)`,
and release external dependents from that verified tip.
Integrate ready results without waiting for unrelated siblings.

On conflict or failed integration checks, leave the trajectory unintegrated and
dependents blocked. Report the failure; abort only this coordinator's
in-progress merge with `git merge --abort`. Preserve the last verified
integration tip and the trajectory branch/worktree; never hard-reset, force
ours/theirs, or delete unmerged work. Do not hand-edit the integration
tree. Send reconciliation to the isolated implementer. The coordinator
may explicitly authorize merging a pinned verified integration SHA into
that trajectory branch while no reviewer is reading it; never rebase an active
branch. Keep its original dispatch base and historical task BASEs intact.
Record the included integration SHA as the reconciliation review base,
re-test, pin the new HEAD, and obtain fresh review of its trajectory delta
from that included SHA, with the affected task briefs/contracts, before retrying.
Unrelated isolated work may continue; merges resume only after the clean
verified integration state is restored.

If nothing is ready or active, inspect blocked prerequisites or a cycle;
do not declare completion. Final review requires every trajectory to be
integrated. Cleanup requires all agents stopped, clean trajectory worktrees,
and `git merge-base --is-ancestor <reviewed-head> <verified-integration-head>`
to succeed. Use normal Git worktree removal and merged-branch deletion,
never forced deletion; preserve dirty or unmerged work for recovery.
