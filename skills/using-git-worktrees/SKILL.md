---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from the current checkout, or when delivery prepares a PR boundary's worktree
---

# Using Git Worktrees

A caller may name a **source ref** (default `HEAD`) and a branch name. A caller that asks for a new worktree, as delivery does, always gets one: go to Step 1.

## Step 0: Check for existing isolation

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
git rev-parse --show-superproject-working-tree 2>/dev/null   # prints a path inside a submodule
```

- **`GIT_DIR != GIT_COMMON` and not a submodule:** you are already in a linked worktree. Report "Already in isolated workspace at `<path>` on branch `<name>`" (or "detached HEAD, externally managed; a branch is needed at finish time") and go to Step 2.
- **Otherwise** (a normal checkout, or a submodule): follow any worktree preference in your instructions. With none, ask: "Would you like me to set up an isolated worktree? It protects your current branch from changes." If your human partner declines, work in place and go to Step 2.

## Project worktree policy

Read `<repo-root>/.toolbelt/worktree-policy.md` when it exists and follow it for the rest of this skill: port ranges and how to pick a set no other worktree uses, sidecar containers, per-worktree data, environment files to derive rather than copy, teardown, and the concurrency limit. Report the set you claimed. Without a policy file, use the project's defaults rather than inventing a scheme the next worktree collides with.

## Step 1: Create the worktree

**Native tool first.** If the harness has a worktree tool (named like `EnterWorktree` or `WorktreeCreate`, or a `/worktree` command), use it and go to Step 2: it owns placement, branching, and cleanup, and a `git worktree add` beside it creates state the harness can't see. Fall back to git only when there is no such tool, or it can't take the caller's source ref or branch name.

**Git fallback.** Put worktrees in the directory your instructions prefer; otherwise an existing `.worktrees/` or `worktrees/` (`.worktrees` wins if both exist); otherwise `.worktrees/` at the project root. `LOCATION` is that directory relative to the repo root. It must be git-ignored, or the next commit sweeps the whole tree into the repo:

```bash
mkdir -p "$LOCATION"
git check-ignore -q "$LOCATION" || echo "/$LOCATION/" >> "$(git rev-parse --git-common-dir)/info/exclude"
git check-ignore -q "$LOCATION" || { echo "cannot ignore $LOCATION" >&2; exit 1; }
git worktree add "$LOCATION/$BRANCH_NAME" -b "$BRANCH_NAME" "${SOURCE_REF:-HEAD}"
cd "$LOCATION/$BRANCH_NAME"
```

If `git worktree add` fails with a permission error, the sandbox blocked it. With a clean working tree, run `git switch -c "$BRANCH_NAME" "${SOURCE_REF:-HEAD}"` in place and tell your human partner. Otherwise stop and ask; never continue on the base branch.

## Step 2: Set up the project

Apply the policy's setup, then install dependencies the way the project's manifest says.

## Step 3: Verify a clean baseline

Run the tests the work will rely on, not a package-wide baseline. When the base commit already has green CI or test evidence, cite it instead. Docs-only work needs no baseline.

If the baseline fails, report it and ask whether to proceed. Otherwise report:

```
Worktree ready at <full-path>
Baseline: <focused tests passing (N tests, 0 failures) | cited base CI/evidence <ref> | docs-only, no suite required>
Resources: <ports/containers claimed per worktree policy, or "project defaults, no policy file">
Ready to implement <feature-name>
```
