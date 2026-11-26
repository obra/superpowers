---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
---

# Finishing a Development Branch

## Overview

**Core principle:** Verify tests → Detect environment → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Never-committed files are not yours to delete

A file in a worktree that was never committed (anything `git status
--porcelain` lists) exists nowhere else: not on any branch, not in git
history, not recoverable. Do not delete it yourself, by any route: no
`rm`, no `git clean`, no `git stash`, no `git checkout`/`git restore`, no
`git worktree remove --force`. "Clean up", "remove the worktree" and
"delete the branch" do not cover these files. Only your human partner's
answer about these specific files does.

If you ask and get no answer (the question is skipped, the session is
non-interactive, or they don't reply), the answer is **keep them**: leave
the files and their worktree in place, finish the rest of the work, and
end your turn with the file list and the question.

## Step 1: Verify Tests

Run the project's full test suite (`npm test` / `cargo test` / `pytest` / `go test ./...`).

**If tests fail**, report the failures and stop — the menu comes after a green suite:

```
Tests failing (<N> failures). Must fix before completing:

[Show failures]
```

**If tests pass:** continue to Step 2.

## Step 2: Detect Environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
# Capture now, while still inside the workspace — Step 5 changes directory
# before cleanup (Step 6) needs this value
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

If `GIT_DIR != GIT_COMMON`, list files that exist only in this worktree:

```bash
git status --porcelain -uall
```

If it prints anything, the worktree cannot be cleaned up until your human
partner decides what happens to those files (see Step 6). Tests and the
chosen integration can still go ahead.

That listing leaves out ignored files, which exist only in this worktree
too, and Step 6's `git worktree remove` deletes them without refusing.
From the top of the worktree, list them as well:

```bash
git status --porcelain --ignored=matching -unormal
git ls-files --others --ignored --exclude-standard -- .superpowers
```

Each `!!` entry counts as a listed file. Under `.superpowers/`, go by the
second command instead: it names each ignored file there; the first can
show the whole directory as one entry. Of these, leave out only
`.superpowers/sdd/.gitignore`, `.superpowers/brainstorm/.last-port`,
`.superpowers/brainstorm/.last-token`, and dependency and build caches
such as `node_modules/`, `.venv/`, `target/`, `dist/`, `build/` and
`__pycache__/`. When unsure whether an entry is a cache, keep it listed.
A plan workspace still present in `.superpowers/sdd/` stays listed: it is
an unfinished run.

This determines which menu to show and how cleanup works:

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 3 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 3 options | Provenance-based (see Step 6) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 2 options (no merge) | Externally managed — leave in place |

## Step 3: Determine Base Branch

The base branch is whatever this work forked from — usually named in the
plan, the conversation, or the branch's upstream. If it is not already
known, ask: "This branch split from <your best guess> - is that correct?"
Confirm before merging: merging into the wrong base is expensive to undo.

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

Present the menu exactly as written — concise, with every option coming
from the list above. Discarding the work happens only in response to your
human partner explicitly asking for it (see "If your human partner asks to
discard the work" below). Wait for their answer; the integration decision
is theirs.

## Step 5: Execute Choice

### Option 1: Merge Locally

```bash
# Get main repo root for CWD safety
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Merge first — verify success before removing anything
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
<test command>
```

If tests fail on the merged result: stop, leave the worktree and branch in
place, and investigate — nothing has been pushed, so the merge is local
and recoverable.

Once the merged result is green: clean up the worktree (Step 6), then
delete the branch:

```bash
git branch -d <feature-branch>
```

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

If a plan executor's final message listed deferred minors or parked
findings, copy those lines into the PR description under
"Deferred items": that is where your human partner reviews, and it
outlives the session.

Keep the worktree — your human partner iterates on PR feedback there.

### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

### If your human partner asks to discard the work

This path exists only as a response to an explicit request to throw the
work away. Confirm first:

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for that exact confirmation. When it arrives:

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then clean up the worktree (Step 6) and force-delete the branch:

```bash
git branch -D <feature-branch>
```

## Step 6: Cleanup Workspace

**Runs for Option 1 and confirmed discards.** Options 2 and 3 always
preserve the worktree. Both callers have already changed directory to the
main repo root — worktree removal must run from outside the worktree —
and use the `GIT_DIR`/`GIT_COMMON`/`WORKTREE_PATH` values captured in
Step 2, from before that directory change.

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If `WORKTREE_PATH` is under `.worktrees/` or `worktrees/`, or under the worktree directory your instructions declare:** Superpowers
created this worktree — we own cleanup:

Run the block below only when both Step 2 listings, run again with
`git -C "$WORKTREE_PATH"`, list no files: `git worktree remove` deletes
ignored files without refusing.

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**If removal is refused** (`contains modified or untracked files`), or
Step 2 listed files: the worktree holds files that exist nowhere else —
uncommitted plans, notes, or scratch work. Stop cleanup here. Leave the
worktree, its files, and its branch exactly as they are, and ask:

```
Merged and tested. I stopped before removing the worktree, because these
files in <path> were never committed and exist nowhere else (not in git
history):

<file list>

1. Commit them to <branch>, then I remove the worktree
2. Move them into <main repo root>, then I remove the worktree
3. Delete them permanently
4. Leave the worktree as it is

Which?
```

Act only on the option they pick. No answer means option 4. Never pick
option 3 for them, and never describe deleted files as recoverable.

Never commit an ignored file or force-add it (`git add -f`), so for
ignored files only options 2, 3 and 4 apply. After carrying out option
1, 2 or 3, run both Step 2 listings again and ask about anything still
listed; once they list no files, remove the worktree.

**Otherwise:** The host environment owns this workspace — leave it in
place. If your platform provides a workspace-exit tool, use it.

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
| "This other worktree looks stale — I'll clean it too" | Clean up only worktrees under `.worktrees/` or `worktrees/`, or under the worktree directory your instructions declare. Everything else belongs to the host. |
| "Removal refused — `--force` is just finishing the cleanup" | The refusal means files exist only in that worktree. `--force` destroys them permanently. Show your human partner and ask. |
| "I'll delete the untracked files first, so removal works without `--force`" | Same loss as `--force`. `rm`, `git clean`, and `git stash` are all deletion here. Show the list and ask. |
| "They said clean up, so that covers these files" | They asked to clean up a worktree. They have not seen these files. Ask about the files. |
| "I asked, the question was skipped, so I'll use my judgment" | A skipped question is not a yes. Keep the files, leave the worktree, ask in your final message. |
| "They're only scratch notes" | You can't know what they're worth. Only your human partner can. |
| "They can be restored from git history" | Never-committed files are not in git history. Once deleted, they are gone. |
| "The merged-result failure is probably flaky" | A failing merged result stops everything. Branch and worktree stay put while you investigate. |
| "The base branch is obviously main" | Confirm the fork point or ask. Merging into the wrong base is expensive to undo. |
| "The push was rejected — force-push will fix it" | A rejected push means the remote moved. Investigate; force-push only on your human partner's explicit request. |
