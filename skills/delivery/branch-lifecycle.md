# Branch lifecycle

## Ledger

Resolve the installed SDD skill's `scripts/sdd-workspace` and run it with the plan path from the starting worktree. Keep `delivery.md` in the workspace it prints, and keep the starting worktree until every boundary closes. Each boundary's SDD ledger header records the absolute path of `delivery.md`.

Lines are appended per orchestrating's What you write; the latest line for a boundary is its state. Append one when the boundary is prepared and each time its state changes:

`Boundary <N>: branch <name>, base <branch>, fork <sha7>, workspace <SDD workspace path>, PR <#num|none>, state <prepared|open|merged|blocked>`

Whoever moves a branch appends `Boundary <N>: rebased <old SHA> → <new SHA>`, so a later rebase can find the old head after compaction.

The SDD ledger carries the gate evidence SDD and pr-monitor record. After an interruption, reuse a recorded result only when its SHA is the current head; rerun only the gate whose evidence is missing or stale. Check the remote for an existing PR before publishing again.

## Rebases

Ownership follows publication: you rebase an unpublished boundary; once its PR exists, only its monitor moves the branch. Implementers and fixers never rebase.

While a dependent boundary is executing, check its predecessor between tasks. If the predecessor's head moved or it merged, rebase before the boundary's final review:

1. Stop starting tracks, merge the active ones, and wait until no implementer, fixer, or reviewer is working in the primary worktree.
2. Run `git rebase --onto <parent-new> <parent-old> <boundary-branch>`, where the parent is the predecessor's branch, or the updated base branch once it has merged. On conflict, `git rebase --abort` and report the paths to your human partner.
3. After a merge, retarget the boundary's base to the base branch.

Completed task reviews stand after a clean rebase; the final review runs on the rebased head. Reuse UX evidence only under ux-gate's rendered-dependency rule. A predecessor closed without merging blocks this boundary.

## Cleanup

After the PR is confirmed merged and the issue tracker reconciled:

1. Append the boundary's `merged` line.
2. Confirm the local branch head is the final head SHA the monitor returned. Anything beyond it is unpublished work: stop and ask your human partner.
3. Release any teardown `.toolbelt/worktree-policy.md` defines (containers, ports, processes, per-worktree data). From the main repo root, `git worktree remove <path>` and `git worktree prune`, then `git branch -D <branch>` (a squash merge leaves its commits unmerged by ancestry).

Never remove a worktree with live agents, unmerged track work, or evidence another open boundary needs. Keep prototype baselines until the boundaries that use them close. Remove `delivery.md` and its workspace only after every boundary closes. Abandoning a boundary takes your human partner's explicit instruction.
