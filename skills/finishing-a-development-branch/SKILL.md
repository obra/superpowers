---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
license: MIT
metadata:
  author: obra
  version: "1.0"
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

Run the project's test suite. If tests fail, show failures and fix them — don't proceed until green.

### Step 2: Determine Base Branch

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

### Step 3: Present Options

Use AskUserQuestion with these 3 options:

- **Merge locally** — Merge back to base branch, delete feature branch, clean up worktree
- **Create PR** — Push and create a Pull Request, keep worktree for revisions
- **Keep as-is** — Leave the branch and worktree for later

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result — merges can break things
<test command>

# Only after tests pass
git branch -d <feature-branch>
```

Then clean up the worktree (Step 5).

#### Option 2: Push and Create PR

```bash
git push -u origin <feature-branch>

gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Keep the worktree — you may need it for PR revisions.

#### Option 3: Keep As-Is

Report the branch name and worktree path. Done.

### Step 5: Cleanup Worktree

**For Option 1 only** (Option 2 keeps worktree for revisions, Option 3 is a no-op):

```bash
# Worktrees are sibling directories: project--branch-name
git worktree remove <worktree-path>
git worktree prune
```

## Quick Reference

| Option | Merge | Push | Keep Worktree | Delete Branch |
|--------|-------|------|---------------|---------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
