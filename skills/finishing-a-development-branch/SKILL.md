---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Detect environment → Review diff → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run the project's test suite (use appropriate command)
npm test
# or: cargo test
# or: pytest
# or: go test ./...
```

**If tests fail:**

```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Detect Environment

**Determine workspace state before presenting options:**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

This determines which menu to show and how cleanup works:

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 5 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 5 options | Provenance-based (see Step 7) |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 3 options (no merge) | No cleanup (externally managed) |

### Step 3: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 4: Review the Diff

**Before presenting options, review the full diff against the base branch:**

```bash
git diff <base-branch>...HEAD
```

This is a quick sanity check — not a deep review. You're checking *what actually changed*, not *what you intended to change*. Look for:

- **Unexpected files** — files touched that shouldn't have been
- **Scope creep** — changes beyond what the spec/plan required
- **Leftover debug code** — console.log, print statements, TODO comments
- **Accidental commits** — config files, secrets, generated files
- **Cross-task conflicts** — changes in Task A that contradict Task B

**If something looks wrong:** Fix it now, before offering options. Commit the fix.

**If the diff looks clean:** Continue to Step 5.

**Why this matters:** Per-task reviews catch issues within each task. This review catches issues that only emerge when you see the full picture — the same reason you'd review your own PR in a browser before clicking "Create Pull Request."

### Step 5: Present Options

**Normal repo and named-branch worktree — present exactly these 5 options:**

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Merge and create a Release
4. Keep the branch as-is (I'll handle it later)
5. Discard this work

Which option?
```

**Detached HEAD — present exactly these 3 options:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)
3. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 6: Execute Choice

#### Option 1: Merge Locally

```bash
# Get main repo root for CWD safety
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# If merge produces conflicts:
#   → Invoke merge-conflict-resolution skill
#   → Then continue with test verification

# Verify tests on merged result
<test command>
```

Then: Cleanup worktree (Step 7), then delete branch:

```bash
git branch -d <feature-branch>
```

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR using your forge tooling (e.g., `gh pr create`, `glab mr create`, or your harness's PR tool)
# Add --milestone if a milestone exists for this work
```

**If no milestone exists** for this work, omit the `--milestone` flag.

**Do NOT clean up worktree** — user needs it alive to iterate on PR feedback.

**After PR is merged:**

```bash
# Pull merged main
git pull

# Clean up worktree and branch (see Step 7)
```

Then check if a release is warranted:

```bash
# Detect release notes file
RELEASE_FILE=$(ls RELEASE-NOTES.md CHANGELOG.md 2>/dev/null | head -1)
grep -q "^\#\# \[Unreleased\]\|^## \[Unreleased\]" "$RELEASE_FILE" 2>/dev/null
```

If release notes have `[Unreleased]` entries, offer to invoke the releasing skill.

#### Option 3: Merge and Create Release

First complete Option 1 (Merge Locally), then:

**Invoke releasing skill:**
```
I'll now use the releasing skill to create a release.
```

Follow `skills/releasing/SKILL.md` workflow:
- Pre-release checklist
- Release notes verification
- Tag creation
- GitHub release

After release completes, cleanup worktree (Step 7).

#### Option 4: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 5: Discard

**Confirm first:**

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then: Cleanup worktree (Step 7), then force-delete branch:

```bash
git branch -D <feature-branch>
```

#### Detached HEAD Options

**Detached Option 1: Push as new branch and create PR**

```bash
# Create a named branch from current detached HEAD
git checkout -b <new-branch-name>

# Then follow standard Option 2 flow
git push -u origin <new-branch-name>

# Create PR using your forge tooling (e.g., `gh pr create`, `glab mr create`, or your harness's PR tool)
```

**Do NOT clean up worktree** — same as standard Option 2.

**Detached Option 2: Keep as-is**

Same as standard Option 4. Report: "Keeping workspace at `<path>` (detached HEAD)."

**Don't cleanup worktree.**

**Detached Option 3: Discard**

**Confirm first:**

```
This will permanently abandon:
- All uncommitted/unreachable commits
- Workspace at <path>

Type 'discard' to confirm.
```

If confirmed: No branch to delete (detached HEAD). If in a harness-owned worktree, use your platform's workspace-exit tool or leave in place.

### Step 7: Cleanup Workspace

**Only runs for Options 1, 3, and 5.** Options 2 and 4 always preserve the worktree.

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

**If `GIT_DIR == GIT_COMMON`:** Normal repo, no worktree to clean up. Done.

**If worktree path is under `.worktrees/`, `worktrees/`, or `.letta/worktrees/`:** Superpowers created this worktree — we own cleanup.

```bash
# Check if worktree is under a superpowers-managed directory
case "$WORKTREE_PATH" in
  */.worktrees/*|*/worktrees/*|*/.letta/worktrees/*)
    echo "superpowers-owned"
    ;;
  *)
    echo "harness-owned"
    ;;
esac
```

```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
git worktree remove "$WORKTREE_PATH"
git worktree prune  # Self-healing: clean up any stale registrations
```

**Otherwise:** The host environment (harness) owns this workspace. Do NOT remove it. If your platform provides a workspace-exit tool, use it. Otherwise, leave the workspace in place.

## Quick Reference

### Standard Menu (normal repo or named-branch worktree)

| Option | Merge | Push | Release | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------|---------------|----------------|
| 1. Merge locally | yes | - | - | - | yes |
| 2. Create PR | - | yes | post-merge | yes | - |
| 3. Merge+Release | yes | - | yes | - | yes |
| 4. Keep as-is | - | - | - | yes | - |
| 5. Discard | - | - | - | - | yes (force) |

### Detached HEAD Menu

| Option | Push | Keep Worktree | Cleanup Branch |
|--------|------|---------------|----------------|
| 1. Push+PR | yes | yes | - |
| 2. Keep as-is | - | yes | - |
| 3. Discard | - | - | — (detached) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Skipping diff review**
- **Problem:** Push unexpected changes, scope creep, leftover debug code
- **Fix:** Always review the full diff before presenting options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 5 structured options (or 3 for detached HEAD)

**Cleaning up worktree for Option 2**
- **Problem:** Remove worktree user needs for PR iteration
- **Fix:** Only cleanup for Options 1, 3, and 5

**Deleting branch before removing worktree**
- **Problem:** `git branch -d` fails because worktree still references the branch
- **Fix:** Merge first, remove worktree, then delete branch

**Running git worktree remove from inside the worktree**
- **Problem:** Command fails silently when CWD is inside the worktree being removed
- **Fix:** Always `cd` to main repo root before `git worktree remove`

**Cleaning up harness-owned worktrees**
- **Problem:** Removing a worktree the harness created causes phantom state
- **Fix:** Only clean up worktrees under `.worktrees/`, `worktrees/`, or `.letta/worktrees/`

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
- Skip the diff review before presenting options

**Always:**
- Verify tests before offering options
- Detect environment before presenting menu
- Review the full diff before presenting options
- Present exactly 5 options (or 3 for detached HEAD)
- Get typed confirmation for Option 5
- Clean up worktree for Options 1, 3 & 5 only
- `cd` to main repo root before worktree removal
- Run `git worktree prune` after removal

## Integration

**Called by:**

- **subagent-driven-development** (after all tasks complete) - Final step in per-task loop
- **executing-plans** (Step 3) - After all tasks complete

**Pairs with:**

- **using-git-worktrees** - Cleans up worktree created by that skill
- **releasing** - Invoked by Option 3 (Merge and Create Release)
