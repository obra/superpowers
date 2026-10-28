# Resuming From an Existing Ledger

Part of superpowers:subagent-driven-development. This plan's workspace
already has a ledger at `<workspace>/progress.md`.

If the ledger's first line names your plan file, reconcile its states with
Git before dispatch. A `Task <N>: complete` line must include its verified
integration SHA: confirm that merge commit and its recorded task HEAD
exist and are ancestors of the current verified integration tip. Check
the recorded integration evidence; a completion label alone is not proof.
Do not re-dispatch tasks already integrated. For older entries without
integration metadata, inspect their recorded commits and check results
before adopting them as integrated; record the recovered evidence.

For incomplete tasks, recover their assigned branch/worktree, base,
current HEAD, agent identity, review state, and resources. Resume the
existing implementer or review/integration stage instead of duplicating
committed work. A task whose last line is a fix round is mid-loop:
resume the next round in that task's worktree. Restore clean verified
integration after an interrupted merge before attempting another merge.
Never blindly abort a merge whose ownership is unclear. Release only
tasks whose prerequisites are verified integrated; unknown state remains
blocked until reconciled.

A ledger whose first line names a
different plan file — or a stray ledger at the old flat path
`.superpowers/sdd/progress.md` — is another plan's progress: leave it in
place and start your own, fresh.
