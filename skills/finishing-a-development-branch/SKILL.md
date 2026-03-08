---
name: finishing-a-development-branch
description: >
  MUST USE when implementation is verified and you need to choose the
  branch outcome: merge, PR, keep, or discard. Triggers on: "merge this",
  "create a PR", "we're done with this branch", "clean up the branch",
  after verification-before-completion passes.
---

# Finishing a Development Branch

Close development work with explicit integration choice.

## Step 1: Verify

Run full project verification before offering options.

If verification fails, stop and return to implementation.

## Step 2: Identify Base Branch

Detect merge base (`main`/`master` or repo default) and confirm if unclear.

## Step 3: Offer Exactly Four Options

1. Merge back to `<base-branch>` locally
2. Push branch and open PR
3. Keep branch/worktree as-is
4. Discard branch/worktree

## Step 4: Execute Safely

### Option 1
- Checkout base
- Pull latest
- Merge feature branch
- Re-run verification
- Delete merged branch
- Remove worktree

### Option 2
- Push feature branch
- Create PR
- Keep worktree by default (remove only if user asks)

### Option 3
- Keep branch and worktree
- Report exact path and branch name

### Option 4
- Show destructive impact summary
- Require exact confirmation: `discard`
- Delete branch and remove worktree

## Hard Rules

- Never merge with failing tests.
- Never delete work without explicit confirmation.
- Never force-push unless explicitly requested.

## Final Report

Include:
- Selected option
- Commands executed
- Final branch/worktree status
- PR link (if created)
