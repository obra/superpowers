---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.
**Hard policy reminder:** Keep at most 1 linked worktree, keep worktree storage under 1GiB, and always remove all linked worktrees plus worktree directory at task end.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run one project-appropriate test command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

If failure is missing dependencies, try environment switching and re-run once (e.g., `. .venv/bin/activate && pytest`,
`micromamba run -n <env> pytest`, `mamba/conda run -n <env> pytest`).
Cannot proceed with merge/PR until tests pass.
```

If still failing, stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Resolve base branch name (not merge-base commit)
if git show-ref --verify --quiet refs/heads/main; then
  base_branch=main
elif git show-ref --verify --quiet refs/heads/master; then
  base_branch=master
else
  echo "No local main/master branch found; ask user."
fi
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch only (worktree will still be cleaned up)
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

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

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

#### Option 3: Keep Branch Only

Report: "Keeping branch <name>. Worktree will be removed per policy."

Then: Cleanup worktree (Step 5)

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
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree (All Options)

Run the same cleanup flow for Options 1, 2, 3, 4:

```bash
# WARNING: this removes ALL linked worktrees for this repository by policy.
git worktree list --porcelain
git worktree list --porcelain | awk '/^worktree /{print substr($0,10)}' | sed '1d' | while IFS= read -r wt; do
  git worktree remove --force "$wt" || git worktree remove --force --force "$wt"
done
git worktree prune --expire now --verbose
git worktree list

project=$(basename "$(git rev-parse --show-toplevel)")
if [ -d .worktrees ]; then
  LOCATION_PATH=".worktrees"
elif [ -d worktrees ]; then
  LOCATION_PATH="worktrees"
else
  LOCATION_PATH="$HOME/.config/superpowers/worktrees/$project"
fi
rm -rf "$LOCATION_PATH"

# Maintenance (only when safe and no other git operations are running)
git maintenance run --task=worktree-prune --task=incremental-repack
git gc --prune=now
```

## Quick Reference

| Option | Merge | Push | Keep Branch | Cleanup Worktree |
|--------|-------|------|-------------|------------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | ✓ |
| 3. Keep branch only | - | - | ✓ | ✓ |
| 4. Discard | - | - | - | ✓ |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Skipping mandatory worktree cleanup**
- **Problem:** Linked worktrees and worktree directories accumulate and exceed storage limits
- **Fix:** Always run Step 5 cleanup flow for every option

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
- Clean up worktree and remove worktree directory for all options

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
