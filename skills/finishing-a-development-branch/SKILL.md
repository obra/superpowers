---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify clean tree + tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Clean Tree and Tests

**Before presenting options, verify two things:**

**1a. Working tree is clean:**

```bash
git status --porcelain
```

**If output is non-empty:**
```
Uncommitted changes in working tree:

[git status --porcelain output]

Cannot proceed — finish-branch only integrates *committed* work. Commit or stash first, then re-run.
```

Stop. Do not proceed. The user must decide what belongs on the branch before finishing it — this skill will not stage changes on their behalf.

**1b. Tests pass:**

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

**If both pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Identify Worktree Context

**Capture context before any destructive action.** If the current shell is inside a linked worktree that will later be removed, every subsequent command will fail with "cwd doesn't exist" the instant `git worktree remove` runs — you must know where to `cd` *before* then.

```bash
# Current working tree (where the shell is now)
CURRENT_WORKTREE="$(git rev-parse --show-toplevel)"

# Main working tree (first entry in `git worktree list`)
MAIN_WORKTREE="$(git worktree list --porcelain | awk 'NR==1 && /^worktree / {print $2}')"

# Are we inside a linked worktree (not the main one)?
if [ "$CURRENT_WORKTREE" != "$MAIN_WORKTREE" ]; then
  IN_WORKTREE=yes
  WORKTREE_PATH="$CURRENT_WORKTREE"
else
  IN_WORKTREE=no
fi
```

Remember `$MAIN_WORKTREE` and `$WORKTREE_PATH` for later steps.

### Step 4: Present Options

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

### Step 5: Execute Choice

#### Option 1: Merge Locally

**CRITICAL:** If `IN_WORKTREE=yes`, `cd` to `$MAIN_WORKTREE` *before* touching branches. Running `git checkout <base-branch>` inside a linked worktree switches *that* worktree, not the main one — then Step 6 deletes the directory the shell is standing in.

```bash
# Leave the linked worktree before doing branch ops
[ "$IN_WORKTREE" = yes ] && cd "$MAIN_WORKTREE"

# Switch to base branch (safely, in the main working tree)
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 6)

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

No `cd` needed — Option 2 does not remove the worktree.

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
# Same cwd safety as Option 1
[ "$IN_WORKTREE" = yes ] && cd "$MAIN_WORKTREE"

git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 6)

### Step 6: Cleanup Worktree

**For Options 1, 2, 4 — if `IN_WORKTREE=yes`:**

**CRITICAL:** The shell must *not* be inside the worktree you're removing. If Step 5 already `cd`-ed out, this is a no-op; if you skipped it, do it now.

```bash
# Make sure we're not standing in the directory about to be removed
cd "$MAIN_WORKTREE"

git worktree remove "$WORKTREE_PATH"
```

If you skip the `cd`, `git worktree remove` deletes the shell's cwd and every subsequent command fails with "cwd doesn't exist".

**For Option 3:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch | Needs cd out |
|--------|-------|------|---------------|----------------|--------------|
| 1. Merge locally | ✓ | - | - | ✓ | ✓ |
| 2. Create PR | - | ✓ | ✓ | - | - |
| 3. Keep as-is | - | - | ✓ | - | - |
| 4. Discard | - | - | - | ✓ (force) | ✓ |

## Common Mistakes

**Skipping clean-tree verification**
- **Problem:** Proceeding with uncommitted changes causes confusion — user expects the skill to stage their unsaved work, skill assumes committed work, and options become ambiguous ("what does discard mean for my uncommitted files?").
- **Fix:** In Step 1, refuse if `git status --porcelain` is non-empty. Point user to `git add` + `git commit` or `git stash` first.

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

**Running destructive ops from inside the worktree being removed**
- **Problem:** `git worktree remove` deletes the shell's cwd; every subsequent command fails with "cwd doesn't exist" and the session wedges.
- **Fix:** In Step 3, capture `$MAIN_WORKTREE`. Before any `checkout`/`merge`/`branch -d`/`worktree remove`, `cd "$MAIN_WORKTREE"` when `IN_WORKTREE=yes`.

**Running `git checkout <base>` inside a linked worktree**
- **Problem:** Switches the linked worktree's HEAD to base, instead of operating in the main working tree. Merge lands in the wrong files and the worktree you're about to delete is now checked out to base.
- **Fix:** `cd "$MAIN_WORKTREE"` *before* the checkout (Options 1 and 4).

## Red Flags

**Never:**
- Proceed with a dirty working tree (uncommitted changes)
- Proceed with failing tests
- Stage uncommitted files on the user's behalf — that's a separate decision
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Run `git worktree remove` while the shell's cwd is inside that worktree

**Always:**
- Verify `git status --porcelain` is empty before offering options
- Verify tests before offering options
- Capture `$MAIN_WORKTREE` / `$WORKTREE_PATH` in Step 3 before any destructive op
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only, from `$MAIN_WORKTREE`

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
