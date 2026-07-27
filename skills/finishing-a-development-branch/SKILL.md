---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and the work needs to be integrated - opens a Pull Request by default, with merge-locally and discard available on explicit request
---

# Finishing a Development Branch

## Overview

**Core principle:** Verify tests → Detect environment → Announce the default → Open the PR → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

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
Confirm before merging or opening a PR: landing on the wrong base is
expensive to undo either way.

If the repo's `CLAUDE.md`, `AGENTS.md`, or `CONTRIBUTING.md` names a
required PR target branch, use that. (This repo is a live example — its
own docs require PRs against `dev`, not `main`.)

## Step 4: Present Options and Proceed

**Normal repo and named-branch worktree — present exactly this menu:**

```
Implementation complete.

1. Push and create a Pull Request  <- doing this now
2. Merge back to <base-branch> locally
3. Keep the branch as-is

Proceeding with the PR. Say so now if you want 2 or 3 instead.
```

**Detached HEAD — present exactly this menu:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request  <- doing this now
2. Keep as-is

Proceeding with the PR. Say so now if you want 2 instead.
```

Print the menu, then act on the PR immediately — **do not wait for a reply**.
Pushing a branch and opening a PR are additive and reversible: close the PR,
delete the remote branch, nothing is lost. Merging into a base branch and
discarding work are not reversible, so those run only when your human partner
asks for them by name. The menu exists so they can redirect, not to gate the
default.

If your human partner redirects to another option after the PR is already
up, make good on that reversibility before switching: close the PR and
delete the remote branch first, then take the requested path.

Acting without waiting applies to the integration *choice*, not to the gates
in front of it. A red test suite (Step 1) or an unconfirmed base branch
(Step 3) still stops everything.

## Step 5: Execute Choice

### Push and Create PR (the default)

The worktree is kept specifically so PR feedback can be addressed here, so
re-entering this skill on a branch that already has a PR is expected, not an
error. Before pushing, check whether one is already open (`gh pr view
--json url` or equivalent). If one exists: push the update and report the
existing URL instead of trying to create a new one.

```bash
git push -u origin <feature-branch>
# From a detached HEAD, name the new branch on the remote:
# git push origin HEAD:refs/heads/<new-branch>
```

Assemble the PR before creating it (skip this on re-entry — the existing PR
keeps its own title and body):

1. **Ticket key.** Match `[A-Z][A-Z0-9]+-[0-9]+` against the branch name. No
   match — look for a ticket key in the session. Neither — skip the ticket
   link and carry on. A missing link never blocks the PR.
2. **Title.** `<KEY>: <summary>` when a key was found. The summary comes
   from the commit log (`git log <base-branch>..HEAD`), falling back to the
   de-slugged branch name if the log has nothing usable. No key — a
   conventional-commit style title built the same way.
3. **Body.** Use `.github/PULL_REQUEST_TEMPLATE.md` when the repo has one and
   fill every section with real content. No template — use `## Summary`,
   `## Changes`, `## Testing`.
4. **Sources.** `git log <base-branch>..HEAD` for the change narrative, plus
   the `docs/superpowers/specs/*-design.md` written for this work if one
   exists. When a key was found, add a ticket *reference* line — a URL only
   if the Jira base URL is already known from the session or from a Jira MCP
   tool, otherwise the bare key. Never guess a hostname.
5. **Ready for review, not a draft.**

Create it with the forge's CLI when one is available (`gh pr create --base
<base-branch> --title ... --body-file ...`), otherwise via the creation URL the
remote prints on push. Report the URL to your human partner.

Keep the worktree — your human partner iterates on PR feedback there.

### Merge Locally (on explicit request)

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

### Keep As-Is (on explicit request)

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

**Runs for the merge-locally path and confirmed discards.** The PR and
keep-as-is paths always preserve the worktree. Both callers have already changed directory to the
main repo root — worktree removal must run from outside the worktree —
and use the `GIT_DIR`/`GIT_COMMON`/`WORKTREE_PATH` values captured in
Step 2, from before that directory change.

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If `WORKTREE_PATH` is under `.worktrees/` or `worktrees/`:** Superpowers
created this worktree — we own cleanup:

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**Otherwise:** The host environment owns this workspace — leave it in
place. If your platform provides a workspace-exit tool, use it.

## Quick Reference

| Path | Merge | Push | Keep Worktree | Cleanup Branch |
|------|-------|------|---------------|----------------|
| Create PR (default) | - | yes | yes | - |
| Merge locally (on request) | yes | - | - | yes |
| Keep as-is (on request) | - | - | yes | - |
| Discard (explicit request only) | - | - | - | yes (force) |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Tests passed earlier this session" | Run the suite on the tree you are about to integrate. A green run only proves the tree it ran on. |
| "They seem done with this feature — I'll offer to discard it" | The menu is complete as written. Discard happens only when your human partner asks for it in so many words. |
| "'Yeah, get rid of it' counts as confirmation" | Only the typed word `discard` authorizes deletion. |
| "The PR is up, so the worktree is clutter now" | PR feedback gets fixed in that worktree. It stays until the work lands. |
| "This other worktree looks stale — I'll clean it too" | Clean up only worktrees under `.worktrees/` or `worktrees/`. Everything else belongs to the host. |
| "The merged-result failure is probably flaky" | A failing merged result stops everything. Branch and worktree stay put while you investigate. |
| "The base branch is obviously main" | Confirm the fork point or ask. Merging into the wrong base is expensive to undo. |
| "The push was rejected — force-push will fix it" | A rejected push means the remote moved. Investigate; force-push only on your human partner's explicit request. |
| "They'll probably want a local merge this time" | PR is the default. Merge-local runs only when your human partner asks for it by name. |
| "No PR template section applies here, I'll write N/A" | Fill it, or say in one sentence why it does not apply. Placeholders are why PRs get closed. |
| "Tests are red but the PR is only for review" | A red test suite blocks the PR exactly as it blocks a merge. |
| "No ticket key on the branch, I'll stop and ask" | A missing ticket link never blocks the PR. Open it without the link. |
