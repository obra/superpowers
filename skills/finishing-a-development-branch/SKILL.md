---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
allowed-tools: Bash, Read, Grep, Glob, Task, AskUserQuestion
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

<requirements>
## Requirements

1. Verify all tests pass before merging. Merging with failures introduces bugs.
2. Present merge options via AskUserQuestion. Let user decide integration approach.
3. Clean up worktree after successful merge.
</requirements>

## When to Use

**Use this skill when:**
- Implementation is complete
- All tests pass
- Ready to decide: merge, PR, keep, or discard

**Don't use when:**
- Tests are failing
- Work is incomplete
- Still in development (use verification-before-completion first)

## The Process

### Step 1: Pre-Completion Verification Gate

Use hyperpowers:verification-before-completion before presenting options. Skipping verification risks merging broken code.

The verification gate checks:
- Tests pass
- Build succeeds
- Lint passes

**If ANY verification fails:** Cannot proceed with completion. Fix issues first.

**If all pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or use AskUserQuestion to confirm (plain text questions bypass structured response UI):
```
AskUserQuestion(
  questions: [{
    question: "This branch split from main - is that correct?",
    header: "Base",
    options: [
      {label: "Yes, main", description: "main is the base branch"},
      {label: "No, master", description: "master is the base branch"},
      {label: "Other", description: "Different base branch"}
    ],
    multiSelect: false
  }]
)
```

### Step 3: Present Options

Use AskUserQuestion to present exactly these 4 options:

```
AskUserQuestion(
  questions: [{
    question: "Implementation complete. What would you like to do?",
    header: "Finish",
    options: [
      {label: "Merge locally", description: "Merge back to <base-branch> locally"},
      {label: "Create PR", description: "Push and create a Pull Request"},
      {label: "Keep as-is", description: "Keep the branch, I'll handle it later"},
      {label: "Discard", description: "Discard this work entirely"}
    ],
    multiSelect: false
  }]
)
```

**Don't add explanation** - keep options concise. The AskUserQuestion descriptions provide context.

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

First, get issue reference from issue-tracking agent:
```
Task(description: "Get issue for PR",
     prompt: "Operation: discover
Context: [branch name, plan goal]
Return: Primary issue for PR reference",
     model: "haiku",
     subagent_type: "general-purpose")
```

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR with issue reference
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>

Closes <issue-reference>
EOF
)"
```

**Issue reference format by tracker:**
- GitHub: `Closes #123` or `Closes org/repo#123`
- Jira: `Closes PROJ-123`
- Beads: `Related: beads-123` (manual close after merge)

Then: Cleanup worktree (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

Use AskUserQuestion to confirm first (prevents accidental work deletion):
```
AskUserQuestion(
  questions: [{
    question: "This will permanently delete branch <name>, all commits, and worktree. Are you sure?",
    header: "Confirm",
    options: [
      {label: "Yes, discard", description: "Permanently delete all work on this branch"},
      {label: "No, keep it", description: "Cancel and keep the branch"}
    ],
    multiSelect: false
  }]
)
```

Wait for explicit "Yes, discard" response via AskUserQuestion. Do NOT proceed on any other response.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Worktree Cleanup Integration

**For Options 1 and 4:**

Check if currently in a worktree:
```bash
git worktree list | grep $(pwd)
```

If yes, cleanup:
```bash
# Store paths
WORKTREE_PATH=$(pwd)
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')

# Return to main repo first
cd "$MAIN_REPO"

# Remove worktree
git worktree remove "$WORKTREE_PATH"
```

**For Option 3 (Keep as-is):** Do NOT cleanup - worktree still needed.

### Step 6: Issue Close Offer

For Options 1 and 2: Present issue close offer if issue was tracked at session start. Skipping this leaves issues open after completion.

**For Options 1 (Merge) and 2 (PR after merge confirmed):**

Dispatch issue-tracking agent:
```
Task(description: "Prepare close command",
     prompt: "Operation: close
Issue: [primary issue ID]",
     model: "haiku",
     subagent_type: "general-purpose")
```

**If no primary issue was tracked:**
```
Note: No primary issue was tracked during this session.

Manual verification:
- [ ] Work matches original request
- [ ] No issue should be closed for this work

Consider using issue tracking for future work.
```

Use AskUserQuestion to present close offer:
```
AskUserQuestion(
  questions: [{
    question: "Close issue PROJ-123 'Add user authentication'?",
    header: "Close",
    options: [
      {label: "Yes", description: "Close issue - work is complete"},
      {label: "Skip", description: "Leave issue open"}
    ],
    multiSelect: false
  }]
)
```

**Close timing logic:**
- If PR workflow: Offer after merge confirmed
- If direct-to-main: Offer after push confirmed
- If GitHub with `Closes #N` in PR: Skip offer (auto-closed on merge)

**For Option 3 (Keep as-is):** No close offer - work not complete.
**For Option 4 (Discard):** No close offer - work discarded.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch | Issue Close |
|--------|-------|------|---------------|----------------|-------------|
| 1. Merge locally | ✓ | - | - | ✓ | Offer |
| 2. Create PR | - | ✓ | ✓ | - | After merge |
| 3. Keep as-is | - | - | ✓ | - | - |
| 4. Discard | - | - | - | ✓ (force) | - |

**Note:** Present issue close offer for Options 1 and 2 when an issue was tracked. User decides execution.

## Common Mistakes

**Skipping verification gate**
- **Problem:** Merge broken code, create failing PR, lint errors in PR
- **Fix:** Always use hyperpowers:verification-before-completion before offering options

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

**Avoid:**
- Plain text questions instead of AskUserQuestion (bypasses structured response UI)
- Proceeding with failing tests, build, or lint
- Presenting options before all verifications pass
- Merging without verifying tests on result
- Deleting work without confirmation
- Force-pushing without explicit request

**Practice:**
- Use AskUserQuestion for user interaction (options, confirmations, questions)
- Run full verification gate before offering options
- Present exactly 4 options via AskUserQuestion
- Get confirmation via AskUserQuestion for Option 4
- Clean up worktree for Options 1 and 4 only

<verification>
## Pre-Completion Gate

This gate passes before presenting options:

- [ ] Tests pass (fresh run, not from memory)
- [ ] Build succeeds (fresh run)
- [ ] Lint passes (fresh run)

**If ANY verification fails:** Do not present options. Fix issues first.

**Evidence Required:**

- Show test command output
- Show build command output
- Show lint command output

"Should pass" or "passed earlier" is not evidence. Fresh run required.
</verification>

<verification>
## Option Execution Verification

After user selects option:

**Option 1 (Merge) Gate:**

- [ ] Switched to base branch
- [ ] Pulled latest
- [ ] Merged feature branch
- [ ] Tests pass on merged result
- [ ] Branch deleted

**Option 2 (PR) Gate:**

- [ ] Pushed with -u flag
- [ ] PR created with issue reference
- [ ] PR URL reported to user

**Option 4 (Discard) Gate:**

- [ ] User confirmed via AskUserQuestion
- [ ] Branch deleted with -D flag

**If any step fails:** Stop and report.
</verification>

<requirements>
## Requirements Reminder

1. Verify all tests pass before merging. Merging with failures introduces bugs.
2. Present merge options via AskUserQuestion. Let user decide integration approach.
3. Clean up worktree after successful merge.
</requirements>

## Integration

**Calls:**
- **verification-before-completion** (Step 1) - Pre-completion checks

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
