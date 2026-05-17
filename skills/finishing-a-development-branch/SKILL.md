---
name: finishing-a-development-branch
description: >
  MUST USE when implementation is verified and you need to choose the
  branch outcome: merge, PR, keep, or discard. Triggers on: "merge this",
  "create a PR", "squash and merge", "we're done with this branch",
  "clean up the branch", "push this", "get it merged", after
  verification-before-completion passes. Routed by using-superpowers
  or executing-plans at completion.
---

# Finishing a Development Branch

Close development work with explicit integration choice.

## Step 1: Verify

Run full project verification before offering options.

**Core principle:** Verify tests → Detect environment → Present options → Execute choice → Clean up.

If verification fails, stop and return to implementation.

### Step 2: Detect Environment

**Determine workspace state before presenting options:**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

This determines which menu to show and how cleanup works:

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 4 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 4 options | Provenance-based (see Step 6) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 3 options (no merge) | No cleanup (externally managed) |

## Step 3: Identify Base Branch

Detect merge base (`main`/`master` or repo default) and confirm if unclear.

## Step 4: Offer Exactly Four Options

1. Merge back to `<base-branch>` locally
2. Push branch and open PR
3. Keep branch/worktree as-is
4. Discard branch/worktree

## Step 5: Execute Safely

### Option 1
- Checkout base
- Pull latest
- Merge feature branch
- Re-run verification
- Delete merged branch
- Remove worktree

### Option 2
- Push feature branch
- Create PR with a description that includes:
  - **What changed** — one-paragraph summary of the change set
  - **Why** — the motivation or problem this solves (link to plan doc if one exists)
  - **How to verify** — exact commands or steps a reviewer can run to confirm the change works
  - **Notable decisions** — any trade-offs made, alternatives rejected, or non-obvious choices.
    If `session-log.md` has `[saved]` entries written during this branch's lifetime, extract the Decisions and Rejected bullets from the most recent entry and include them here. This ensures PR reviewers see the "why" without needing to read the log.
- Keep worktree by default (remove only if user asks)

### Option 3
- Keep branch and worktree
- Report exact path and branch name

### Option 4
- Show destructive impact summary
- Require exact confirmation: `discard`
- Delete branch and remove worktree

Wait for exact confirmation.

If confirmed:
```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then: Cleanup worktree (Step 6), then force-delete branch:
```bash
git branch -D <feature-branch>
```

### Step 6: Cleanup Workspace

**Only runs for Options 1 and 4.** Options 2 and 3 always preserve the worktree.

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If worktree path is under `.worktrees/`, `worktrees/`, or `~/.config/superpowers/worktrees/`:** Superpowers created this worktree — we own cleanup.

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**Otherwise:** The host environment (harness) owns this workspace. Do NOT remove it. If your platform provides a workspace-exit tool, use it. Otherwise, leave the workspace in place.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" is ambiguous
- **Fix:** Present exactly 4 structured options (or 3 for detached HEAD)

**Cleaning up worktree for Option 2**
- **Problem:** Remove worktree user needs for PR iteration
- **Fix:** Only cleanup for Options 1 and 4

**Deleting branch before removing worktree**
- **Problem:** `git branch -d` fails because worktree still references the branch
- **Fix:** Merge first, remove worktree, then delete branch

**Running git worktree remove from inside the worktree**
- **Problem:** Command fails silently when CWD is inside the worktree being removed
- **Fix:** Always `cd` to main repo root before `git worktree remove`

**Cleaning up harness-owned worktrees**
- **Problem:** Removing a worktree the harness created causes phantom state
- **Fix:** Only clean up worktrees under `.worktrees/`, `worktrees/`, or `~/.config/superpowers/worktrees/`

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Remove a worktree before confirming merge success
- Clean up worktrees you didn't create (provenance check)
- Run `git worktree remove` from inside the worktree

**Always:**
- Verify tests before offering options
- Detect environment before presenting menu
- Present exactly 4 options (or 3 for detached HEAD)
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only
- `cd` to main repo root before worktree removal
- Run `git worktree prune` after removal

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
