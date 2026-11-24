---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
---

# Finishing a Development Branch

## Overview

**Core principle:** Verify tests → Detect environment → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Step 1: Verify Tests

Run the full test suite (`npm test`, `cargo test`, `pytest`, `go test ./...`).

**If tests fail**, report failures and stop:

```
Tests failing (<N> failures). Must fix before completing:

[Show failures]
```

**If tests pass:** continue to Step 2.

## Step 2: Detect Environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
test -n "$WORKTREE_PATH"
printf 'GIT_DIR=%s\nGIT_COMMON=%s\nBRANCH=%s\nWORKTREE_PATH=%s\n' "$GIT_DIR" "$GIT_COMMON" "$BRANCH" "$WORKTREE_PATH"
```

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (in-place) | Standard 3 options | None |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 3 options | Ownership-based (Step 6) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 2 options (no merge) | Leave in place |

## Step 3: Determine Base Branch

The base branch is what this forked from (plan, conversation, or upstream). If unknown, ask: "This branch split from <your best guess> - is that correct?" Merging into the wrong base is expensive to undo.

## Step 4: Present Options

**Normal repo and named-branch worktree — present exactly these 3 options:**

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)

Which option?
```

**Detached HEAD — present exactly these 2 options:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)

Which option?
```

Present the menu verbatim. Discard happens only on your human partner's explicit request (below). Wait for their decision.

## Step 5: Execute Choice

Option 1 and Discard run both checks below; Options 2–3 keep the worktree.

### Unique-File Check (linked worktrees)

```bash
test -n "$WORKTREE_PATH"
git -C "$WORKTREE_PATH" status --porcelain -uall --ignored=matching
git -C "$WORKTREE_PATH" ls-files --others --exclude-standard -- .superpowers
git -C "$WORKTREE_PATH" ls-files --others --ignored --exclude-standard -- .superpowers
```

Stop on failure. Skip `.superpowers/sdd/.gitignore`, `.superpowers/sdd/<plan>/` dirs whose `progress.md` ends with exact line `finish` (else **unfinished**), `.superpowers/brainstorm/.last-port`, `.superpowers/brainstorm/.last-token`, `.DS_Store`/`Thumbs.db`, and build/dependency caches (`node_modules/`, `.venv/`, `venv/`, `target/`, `dist/`, `build/`, `__pycache__/`, `.pytest_cache/`, `.ruff_cache/`, `.mypy_cache/`, `.next/`, `.turbo/`). Anything else exists only in this worktree — *when in doubt, ask*.

### Resolve Primary Checkout (Option 1 and Discard)

```bash
first_wt=$(git -c core.quotePath=false worktree list --porcelain | sed -n '1s/^worktree //p')
MAIN_ROOT=$(git -C "$first_wt" rev-parse --show-toplevel 2>/dev/null || true)
```

If `MAIN_ROOT` is empty (bare hub): Option 1 stops (no local checkout of `<base-branch>` — offer Option 2 or 3); Discard uses `git --git-dir="$GIT_COMMON"` from `"$GIT_COMMON"`.

### Option 1: Merge Locally

1. **Pre-merge file check:**
   - `GIT_DIR == GIT_COMMON`: ignored files stay in `<MAIN_ROOT>`. If `git -C "$WORKTREE_PATH" status --porcelain -uall` is non-empty, ask whether to commit to `<feature-branch>`; never pass `-f`/`--force` to `git checkout`.
   - `GIT_DIR != GIT_COMMON`: run **Unique-File Check**. If any remain, show them and wait:

     ```
     These files have changes or untracked/ignored content that exist only in this worktree:

     <file list>

     1. Commit modified/untracked files to <feature-branch> (never `git add -f` ignored files unless asked)
     2. Move/copy into <MAIN_ROOT> after green merge (without overwriting any existing `<MAIN_ROOT>` file unless your human partner confirms)
     3. Keep worktree after merging
     4. Delete permanently (requires typing `discard` naming them)

     Which?
     ```

2. **Under `.claude/worktrees/`:** Run `ExitWorktree(action="keep")` then `cd "$MAIN_ROOT"`; if blocked, print the `MAIN_ROOT` merge + cleanup commands (honoring Move/copy and unless **Keep** was chosen) and stop.

3. **Merge and test in `MAIN_ROOT`** (abort on any error; ask before touching colliding ignored files):

   ```bash
   cd "$MAIN_ROOT" &&
     git checkout --no-overwrite-ignore <base-branch> &&
     { ! git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1 || { git fetch && git merge --ff-only --no-overwrite-ignore '@{u}'; }; } &&
     git merge --no-overwrite-ignore <feature-branch> &&
     <test command>
   ```

   If tests fail: stop and keep worktree and branch while investigating.

4. **Once green:** Apply **Move/copy** without silent overwrite.
   - `GIT_DIR == GIT_COMMON`: delete finished SDD workspaces and branch:

     ```bash
     if [ -d "$MAIN_ROOT/.superpowers/sdd" ]; then
       find "$MAIN_ROOT/.superpowers/sdd" -mindepth 1 -maxdepth 1 -type d | while IFS= read -r d; do
         if [ -f "$d/progress.md" ] && [ "$(tail -n 1 "$d/progress.md" | tr -d '\r')" = "finish" ]; then rm -rf "$d"; fi
       done
     fi
     git branch -d <feature-branch>
     ```

   - `GIT_DIR != GIT_COMMON`: unless **Keep** was chosen, clean up worktree (Step 6), then `git branch -d <feature-branch>` only if removal succeeded.

### Option 2: Push and Create PR

```bash
git push -u origin <feature-branch>
# From a detached HEAD, name the new branch on the remote:
# git push origin HEAD:refs/heads/<new-branch>
```

Then create the pull/merge request against <base-branch> with the forge's
tooling — its CLI if one is available, or the creation URL most forges
print when you push — following the repo's PR template and conventions if
present, and report the URL to your human partner.

Keep the worktree — your human partner iterates on PR feedback there.

### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

### If your human partner asks to discard the work

Only on explicit request (never offer to commit to `<branch>`). Scan first (**Unique-File Check** if `GIT_DIR != GIT_COMMON`; else `git -C "$WORKTREE_PATH" status --porcelain -uall`):

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path> (or uncommitted changes if in-place)
- Unique files in worktree: <list or "none"> (if linked worktree)

Ask me to move any unique files to <MAIN_ROOT> before typing 'discard'.
Type 'discard' to confirm.
```

Wait for typed `discard` (move requested files without silent overwrite first). If `.claude/worktrees/`, run `ExitWorktree(action="keep")` (or print commands and stop); `cd "${MAIN_ROOT:-$GIT_COMMON}"`. In-place: discard confirmed changes and `git checkout --no-overwrite-ignore <base-branch>`. Linked: clean up (Step 6). Then, only if removal succeeded, `git branch -D <feature-branch>` (via `git --git-dir="$GIT_COMMON"` if `MAIN_ROOT` empty).

## Step 6: Cleanup Workspace

**Runs for Option 1 (unless keeping worktree) and confirmed discards** (after leaving `$WORKTREE_PATH`).

- Silence, timeout, or autonomous mode means **keep** the worktree and files.
- `"clean up"`, `"remove the worktree"`, or `"delete the branch"` never authorize deleting unique files. Without typed `discard` naming them, **never** run `--force`, `rm`, `git clean`, `git checkout --`, `git restore`, `git stash`, or `ExitWorktree(action="remove")`.

**`GIT_DIR == GIT_COMMON`:** Normal repo — done.

**Owned `WORKTREE_PATH`** (`<MAIN_ROOT>`'s `.worktrees/` or `worktrees/`, `.claude/worktrees/`, or the worktree directory declared in instructions):

```bash
# Single --force ONLY after typed 'discard' and clean `git -C "$WORKTREE_PATH" submodule status` (never use -f -f)
git worktree remove "$WORKTREE_PATH"
git worktree prune
```

If removal refuses (`locked`, submodules matching `^[^-]`, sandbox denial, or unconfirmed files): never use `-f -f` and **do not** run `git branch -d`/`-D` — run **Unique-File Check**, or report the refusal with `git worktree remove "$WORKTREE_PATH" && git branch -d <feature-branch>` (`--force`/`-D` only after saving submodule work or confirmed discard).

**Otherwise:** Externally owned — leave this and all other worktrees untouched; do not run `git branch -d` while checked out there.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| Discard (explicit request only) | - | - | - | yes (force) |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Tests passed earlier this session" | Run the suite on the tree you are about to integrate. A green run only proves the tree it ran on. |
| "They obviously want it merged" | Integration is your human partner's decision. Present the menu and wait. |
| "They seem done with this feature — I'll offer to discard it" | The menu is complete as written. Discard happens only when your human partner asks for it in so many words. |
| "'Yeah, get rid of it' counts as confirmation" | Only the typed word `discard` authorizes deletion. |
| "The PR is up, so the worktree is clutter now" | PR feedback gets fixed in that worktree. It stays until the work lands. |
| "This other worktree looks stale — I'll clean it too" | Clean up only THIS branch's worktree (when under `.worktrees/` or `worktrees/`, `.claude/worktrees/`, or the declared worktree directory). Leave every other worktree untouched. |
| "Removal refused — `--force` is just finishing the cleanup" | The refusal means files exist only in that worktree. `--force` destroys them permanently. Show your human partner and ask. |
| "The merged-result failure is probably flaky" | A failing merged result stops everything. Branch and worktree stay put while you investigate. |
| "The base branch is obviously main" | Confirm the fork point or ask. Merging into the wrong base is expensive to undo. |
| "The push was rejected — force-push will fix it" | A rejected push means the remote moved. Investigate; force-push only on your human partner's explicit request. |
