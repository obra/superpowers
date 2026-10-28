# Resuming From an Existing Ledger

Part of superpowers:subagent-driven-development. This plan's workspace
already has a ledger at `<workspace>/progress.md`.

If the ledger's first line names your plan file, read its recorded boundary
amendments and reconcile both task and trajectory states with Git before
dispatch. A `Task <N>: complete` record needs its reviewed task BASE/HEAD and
owning trajectory, not a plan-integration merge. Verify its review evidence
and that its HEAD is an ancestor of the current trajectory HEAD. Resume at
the next pending internal task, or trajectory completion/integration if all
tasks finished; never replay completed local work just because it is unmerged.

A `Trajectory <T>: integrated` record needs its verified merge SHA, pinned
trajectory HEAD, completion scope and check evidence. Confirm commits exist
and are ancestors of verified integration before releasing external dependents.
Reviewed-but-unintegrated trajectories do not release external work.

For legacy task completion entries, recover their recorded commits, review,
checks and any integration evidence before adopting them as completed or
integrated. Preserve already verified integration and record an explicit
legacy trajectory mapping. A bare completion label is insufficient evidence,
but missing metadata is not permission to reimplement existing commits.
Native task completion records carry test evidence, not independent review.
Recover their commits and obtain any missing review needed by SDD rather
than replaying implementation or assuming an SDD review gate already passed.

For incomplete tasks, recover their owning trajectory's branch/worktree,
original dispatch base, current HEAD and resources, plus task BASE/HEAD,
agent identity and review state. Resume the
existing implementer or review/integration stage instead of duplicating
committed work. A task whose last line is a fix round is mid-loop:
resume the next round in that task's worktree. Restore clean verified
integration after an interrupted merge before attempting another merge.
Never blindly abort a merge whose ownership is unclear. Release only
trajectories whose external prerequisites are verified integrated, and
tasks whose internal prerequisites passed review; unknown state remains
blocked until reconciled.

A ledger whose first line names a
different plan file — or a stray ledger at the old flat path
`.superpowers/sdd/progress.md` — is another plan's progress: leave it in
place and start your own, fresh.
