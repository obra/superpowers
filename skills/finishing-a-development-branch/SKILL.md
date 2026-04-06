---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>
```

Then: Cleanup worktree (Step 5) — **worktree removal must happen
before `git branch -d`**, because the feature branch is still
checked out in the agent worktree until the worktree is removed.

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

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
git checkout <base-branch>
```

Then: Cleanup worktree (Step 5) — worktree removal must happen
before `git branch -D`, same reason as Option 1.

### Step 5: Cleanup Worktree and Feature Branch

**For Options 1, 2, 4:**

Find the worktree that has the feature branch checked out — do NOT
grep for the *current* branch, because after `git checkout <base>`
in Step 4 the current branch is the base branch, not the feature
branch.

```bash
# Find the worktree path for the feature branch (column 3 of
# `git worktree list` is the bracketed branch name).
worktree_path=$(git worktree list | awk -v b="[<feature-branch>]" '$3==b {print $1}')
```

If `$worktree_path` is non-empty and points to an agent worktree
(typically under `.claude/worktrees/`), remove it:

```bash
git worktree remove "$worktree_path"
```

**Run this from the main repo, never from inside the worktree
itself.** On Windows the shell holds a lock on its own cwd, so a
process running inside the worktree cannot delete it — `git
worktree remove` will fail with a permission error and `rm -rf`
will report "Device or resource busy". This skill is intended to
be invoked by the parent context that dispatched the subagent,
*after* the subagent has returned, not by the subagent on itself.

**Self-heal stale registrations.** If the worktree directory was
already deleted outside git (common when a `.claude/` cleanup or
the OS reclaimed it), `git worktree remove` will error. In that
case, prune any registrations whose gitdir points to a missing
location:

```bash
git worktree prune -v
```

After the worktree is gone (or pruned), the feature branch is no
longer "checked out" anywhere and can be deleted safely:

```bash
# Option 1 (merged — safe delete):
git branch -d <feature-branch>

# Option 4 (discarded — force delete, already confirmed in Step 4):
git branch -D <feature-branch>
```

**Defensive prune.** Even on successful runs it's cheap to finish
with `git worktree prune` so any sibling stale registrations (left
behind by earlier sessions that didn't clean up) get swept up too.

**For Option 3:** Keep worktree. Don't prune — you might have
legitimate orphans you want to recover.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
