---
name: Finishing a Development Branch
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

### Step 2: Documentation Synchronization

**YOU MUST invoke the documentation-management skill. No exceptions.**

Skipping documentation verification = drift. Every time.

```bash
# Use the Skill tool to invoke: documentation-management
```

The skill will:

- Analyze your branch changes via `git diff <base>...HEAD`
- Identify documentation gaps (README, CHANGELOG, API docs, guides)
- Update all affected files in the same branch
- Verify inline source links are present
- Confirm version bumps for CHANGELOG

**If documentation is already synchronized:** The skill confirms this quickly.

**If updates are needed:** The skill makes them comprehensively.

**Do not proceed to Step 3 until documentation is synchronized.**

### Step 3: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

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

Then: Cleanup worktree (Step 6)

#### Option 2: Push and Create PR

**CRITICAL: Analyze the entire branch, not just latest commit.**

```bash
# 1. Analyze complete branch context
git log <base-branch>..HEAD --oneline    # All commits
git diff <base-branch>...HEAD | head -100  # Full diff preview

# 2. Understand transformation
# - What capability was added/fixed/improved?
# - Why was this change needed?
# - What are ALL the major changes across commits?

# 3. Push branch
git push -u origin <feature-branch>

# 4. Create PR with complete context
gh pr create --title "<type>(<scope>): <complete feature description>" --body "$(cat <<'EOF'
## Summary
[2-3 sentences describing the complete transformation across all commits]

## Changes
- [Major change 1 across commits]
- [Major change 2 across commits]
- [Major change 3 across commits]
EOF
)"
```

**Example - Bad (only latest commit):**

```bash
# Branch commits:
# - feat(auth): add User model
# - feat(auth): add login endpoint
# - test(auth): add tests
# - fix: typo in comment  ← latest

# ❌ Bad PR title: "fix: typo in comment"
# This misses the entire authentication feature!
```

**Example - Good (full branch analysis):**

```bash
# Same branch, but analyzed completely
# ✅ Good PR title: "feat(auth): add user authentication system"
# ✅ PR body describes all changes: User model, login endpoint, tests
```

Then: Cleanup worktree (Step 6)

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
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 6)

### Step 6: Cleanup Worktree

**For Options 1, 2, 4:**

Check if in worktree:

```bash
git worktree list | grep $(git branch --show-current)
```

If yes:

```bash
git worktree remove <worktree-path>
```

**For Option 3:** Keep worktree.

## Quick Reference

| Option           | Merge | Push | Keep Worktree | Cleanup Branch |
| ---------------- | ----- | ---- | ------------- | -------------- |
| 1. Merge locally | ✓     | -    | -             | ✓              |
| 2. Create PR     | -     | ✓    | ✓             | -              |
| 3. Keep as-is    | -     | -    | ✓             | -              |
| 4. Discard       | -     | -    | -             | ✓ (force)      |

## Common Mistakes

**Skipping test verification**

- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**

- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

## Optional: Clean Commit History

**Note:** If you follow good commit guidelines from the start, this shouldn't be necessary.

If your branch has messy commits and you want clean history before PR:

### When to Clean

- Multiple "WIP" or "fix" commits
- Logical changes spread across multiple commits
- Want each commit to be independently reviewable

### How to Clean

```bash
# Interactive rebase to main
git rebase -i main

# In editor:
# - Use 'squash' to combine related commits
# - Use 'reword' to improve commit messages
# - Use 'edit' to split commits

# To split a commit:
# - Mark commit as 'edit' in rebase
# - When it stops: git reset HEAD^
# - Stage and commit in logical groups
# - Continue: git rebase --continue
```

### Logical Grouping

Group changes by:

- Feature vs tests vs docs
- Refactoring vs new functionality
- Public API vs implementation details

Each commit should be independently understandable and (ideally) pass tests.

**Only do this before pushing/before PR**. Don't rewrite published history.

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
