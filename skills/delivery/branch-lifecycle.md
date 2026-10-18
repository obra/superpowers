# Branch lifecycle

## Ledger

The ledger is `<workspace>/delivery.md`. Its first line is the plan path. It is append-only, and each gate line ends with `Next: <event>`. Line formats:

- State, appended when the boundary is prepared and whenever it changes; the latest wins: `Boundary <N>: branch <name>, base <branch>, fork <sha7>, worktree <path>, PR <#num|none>, state <prepared|open|merged|blocked>`
- `Boundary <N>: implementer <agent id>, route <harness>/<model>/<effort>`
- `Boundary <N>: <status>, report <path>`
- `Boundary <N>: ruling — <decision>`
- `Boundary <N>: Review: clean|fixed|skipped at <SHA>`
- `Boundary <N>: rebased <old SHA> → <new SHA>`, appended by whoever moved the branch, so a later rebase can find the old head.

## Rebases

Delivery rebases an unpublished branch once, right before its review. Once the PR exists, only its monitor moves the branch. Implementers never rebase. A behavior-neutral PR never waits on another workstream; whichever PR merges second rebases.

With the predecessor's branch as the parent:

- **Parent moved:** `git rebase --onto <parent-new> <parent-old> <branch>`.
- **Parent merged:** `git rebase --onto <base-branch> <parent-old> <branch>`, with `<parent-old>` from the ledger, then retarget the boundary's base to the base branch.

On conflict, run `git rebase --abort` and report the paths to your human partner. After a clean rebase, reuse UX evidence only under ux-gate's carry-forward rule.

## Cleanup

After the PR is confirmed merged:

1. Append the boundary's `merged` record.
2. Confirm the local branch head is the final head SHA the monitor returned. Anything beyond it is unpublished work: stop and ask your human partner.
3. Release any teardown `.toolbelt/worktree-policy.md` defines. From the main repo root, run `git worktree remove <path>`, `git worktree prune`, and `git branch -D <branch>`; a squash merge leaves its commits unmerged by ancestry.

Never remove a worktree with live agents or evidence another open boundary needs. Keep prototype baselines until the boundaries that use them close. Remove the workspace only after every boundary closes. Abandoning a boundary takes your human partner's explicit instruction.
