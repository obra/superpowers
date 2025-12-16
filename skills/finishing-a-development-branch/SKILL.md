---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion with structured options and explicit approval gates for destructive operations
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

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Push and Create PR

**Step 1: Push branch**

```bash
git push -u origin <feature-branch>
```

**Step 2: Generate PR description**

Draft PR title and body based on commit history.

**Step 3: Show preview and request confirmation**

Present:
```
Ready to create PR with:

Title: <title>
Body:
<body-preview>

Create this PR? (yes/no)
```

**Wait for explicit "yes" confirmation.**

- If user confirms "yes": Proceed to Step 4
- If user says "no": Report "PR creation cancelled. Branch pushed to remote."

**Step 4: Create PR only if confirmed**

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
<body>
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
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktree

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

**Skipping PR preview**
- **Problem:** Create PR without showing user the content first
- **Fix:** Always show title/body, wait for "yes" confirmation

## Rationalization Table

Common excuses for skipping approval steps:

| Excuse | Reality |
|--------|---------|
| "User selected option 2, that's consent" | Selection is consent to PR workflow, not blanket approval. Show preview first. |
| "Permission system will catch it" | Permission system only prompts ONCE per session. Skill must enforce approval. |
| "Preview adds unnecessary friction" | Safety > convenience. PR creation is public and permanent. |
| "This is different from Option 4" | PRs are as permanent as deleted code. Same approval rigor required. |
| "I'll describe what I'm creating" | Description ≠ approval. Must show preview AND wait for "yes". |

## Red Flags - You're About to Skip Approval

If you catch yourself thinking:
- "User picked option 2, I can proceed" → WRONG. Show preview first.
- "I'll explain what PR will contain" → WRONG. Show actual content, get confirmation.
- "Permission system is enough" → WRONG. Skill must enforce its own approval gate.
- "This adds too much friction" → WRONG. Safety is mandatory for public operations.

**All of these mean: STOP. Show preview. Wait for "yes" confirmation.**

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Create PR without showing preview first
- Skip confirmation step "to save time"

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Show preview and get "yes" for Option 2
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
