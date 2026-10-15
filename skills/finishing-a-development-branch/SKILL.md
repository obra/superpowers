---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
---

# Finishing a Development Branch

**Declared route:** if the prompt that invoked this skill already named one route, optionally with a target base branch, run Step 1, then that route and its cleanup without showing the menu. With no route, or an ambiguous one, show the menu. Either way, every check and cleanup rule applies.

## Step 1: Verify tests

Run the tests related to the files the branch changed from its base, plus an incremental typecheck and lint of the touched packages. CI runs the full suite before a PR merges; a local merge runs it after merging (Step 5). Skip this run when one of these applies:

- **Exact-head evidence:** the caller supplies that run at the current head SHA: the command, its passing output with the final pass or exit state visible, and the SHA it ran against. Read that output yourself; it stands in for the run. A report missing the command, the output, or the SHA is a claim, not evidence.
- **Docs-only:** every changed file is Markdown under `docs/**` or at the repository root, or `.toolbelt/**` scratch, and none is a file the application builds, renders, or serves, or that CI executes.

Both exceptions require a clean worktree.

If tests fail, stop and report the failures. Nothing below runs until they pass.

## Step 2: Detect the environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

| State | Menu |
|-------|------|
| `GIT_DIR == GIT_COMMON` (normal repo) | 4 options |
| `GIT_DIR != GIT_COMMON`, named branch (linked worktree) | 4 options |
| `GIT_DIR != GIT_COMMON`, detached HEAD (externally managed) | 3 options, no merge, no cleanup |

## Step 3: Determine the base branch

Use the base the caller named. Otherwise find the branch this one split from (usually `main` or `master`) and confirm it: "This branch split from main — is that correct?"

## Step 4: Present options

**Normal repo or named-branch worktree — exactly these 4:**

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Detached HEAD — exactly these 3:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)
3. Discard this work

Which option?
```

No added explanation.

## Step 5: Execute the choice

### Merge locally

From the main repo root (Step 6):

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>
<full test suite command>
```

If the merged result fails its tests, stop and report. Otherwise clean up the worktree (Step 6), since a checked-out branch cannot be deleted, then `git branch -d <feature-branch>`.

### Push and create a PR

```bash
git push -u origin <feature-branch>
gh pr create --base <base-branch> --title <title> --body <body>
```

"PR is open" is not a terminal state. Hand the PR to toolbelt:pr-monitor, unless pr-monitor is the one running this skill, in which case return the PR to it. Don't request reviews here; the monitor does. Publishing never force-pushes. The worktree stays for PR feedback.

### Keep as-is

Report: "Keeping branch <name>. Worktree preserved at <path>."

### Discard

Confirm first and wait for the exact word:

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

If confirmed, clean up the worktree (Step 6), then `git branch -D <feature-branch>`.

## Step 6: Clean up the worktree

For a local merge or a discard, and for delivery's post-merge cleanup. In a normal repo (`GIT_DIR == GIT_COMMON`) there is nothing to clean up.

1. If `.toolbelt/worktree-policy.md` defines teardown (sidecar containers, allocated ports, running processes, per-worktree data), release those first.
2. Remove the worktree only when its path is under `.worktrees/` or `worktrees/`, because toolbelt created those. Run the removal from the main repo root; it fails from inside the worktree:

   ```bash
   WORKTREE_PATH=$(git rev-parse --show-toplevel)
   MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
   cd "$MAIN_ROOT"
   git worktree remove "$WORKTREE_PATH"
   git worktree prune
   ```

3. Any other path belongs to the host harness: leave it in place, or use your platform's workspace-exit tool.
