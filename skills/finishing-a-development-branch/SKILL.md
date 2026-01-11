---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to finalize documentation and integrate the work - handles documentation, plan tracking, and git workflow (merge, PR, or cleanup)
---

# Finishing a Development Branch

## Overview

Finalize completed implementation: document what was built, track in history, then integrate via git workflow.

**Core principle:** Document → Verify → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 0: Pre-flight Check

**Verify clean working directory before starting:**

```bash
git status --short
```

**If output is empty:** Working directory is clean, proceed to Step 1.

**If uncommitted changes exist:** Present options to user:

```
⚠️  You have uncommitted changes:

[Show git status output]

What would you like to do?

1. Commit them now (recommended)
2. Stash them temporarily
3. Cancel - I'll handle this manually

Which option?
```

**Option 1 selected - Commit changes:**
```bash
git add -A
git commit -m "work in progress: preparing to finish branch"
```

**Option 2 selected - Stash changes:**
```bash
git stash push -m "WIP before finishing branch"
```

**Option 3 selected - Cancel:**
Stop the workflow. Report to user: "Please handle uncommitted changes, then run this skill again."

**Only proceed to Step 1 if working directory is clean.**

### Step 1: Document Completed Work

**REQUIRED:** If implementation was based on a plan in `docs/plans/`, invoke `documenting-completed-implementation` skill first.

```
Use the Skill tool to invoke: documenting-completed-implementation
```

This will:
- Mark plan as completed with status header
- Update CLAUDE.md (Implementation History + feature docs)
- Update README.md with user-facing information
- Move plan to docs/plans/completed/YYYY-MM-DD-name.md
- Commit all documentation changes

**If no plan file exists:** Skip Step 1 entirely and proceed to Step 2.

### Step 2: Verify Tests

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

Stop. Don't proceed to Step 3.

**If tests pass:** Continue to Step 3.

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

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Create PR | - | ✓ | ✓ | - |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| **Skip documentation** | Step 1 is REQUIRED if plan exists. Invoke documenting-completed-implementation first. |
| **Skip test verification** | Merge broken code, create failing PR |
| **Open-ended questions** | "What should I do next?" → ambiguous. Present 4 structured options. |
| **Automatic worktree cleanup** | Remove worktree when might need it (Option 2, 3) |
| **No confirmation for discard** | Accidentally delete work |

## Red Flags

**Never:**
- Skip documentation if plan exists (invoke documenting-completed-implementation)
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Invoke documenting-completed-implementation first (if plan exists)
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (final step) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill