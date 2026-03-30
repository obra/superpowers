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

### Step 1.5: Read Session Metadata

Check for `.superpowers-session.json` in the current directory:

```bash
cat .superpowers-session.json 2>/dev/null
```

**If found:** Extract `base_branch` and `base_commit`. Update `stage` to `"finishing"`. Use `base_branch` as the base branch for all subsequent steps (skip Step 2's detection logic).

**If not found:** Fall through to Step 2's existing detection logic. Delta analysis (Step 2.5) will be skipped since there's no baseline to compare against.

### Step 2: Determine Base Branch

**If `.superpowers-session.json` was found in Step 1.5:** Use `base_branch` from the metadata. Skip this step.

**Otherwise:** Detect the base branch:

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 2.5: Rebase and Delta Analysis

**Skip this step if no `.superpowers-session.json` was found** (no baseline to compare against).

#### A. Rebase onto base branch

```bash
# Fetch latest
git fetch origin <base_branch>

# Attempt rebase
git rebase origin/<base_branch>
```

**If merge conflicts occur:** Escalate to at least Level 2 (spec drift). Present the conflicts to the user and let them resolve. After resolution, continue to the delta analysis below.

**If the base branch is local-only** (no remote tracking): rebase onto the local branch instead:

```bash
git rebase <base_branch>
```

#### B. Delta analysis

Compare what changed on the base branch since we branched:

```bash
git diff <base_commit>..<base_branch>
```

Where `<base_commit>` is from `.superpowers-session.json`.

**If the diff is empty:** No changes on the base branch since we started. Proceed to Step 3 (Present Options).

**If the diff is non-empty:** Analyze the changes against:
- The spec document (find it via git log for files in `docs/superpowers/specs/`)
- The implementation plan (find it via git log for files in `docs/superpowers/plans/`)
- The implementation itself (all other commits on this branch)

Classify the drift into one of three levels. **When in doubt, escalate to the higher level.**

**Recommend using the highest-capacity model available for this analysis** (e.g., Opus). The escalation decision is safety-critical.

#### C. Escalation levels

**Level 0 — No meaningful drift:** The base branch changes don't affect our work at all (e.g., changes to unrelated files, documentation updates). Proceed to Step 3.

**Level 1 — Implementation drift:** The spec is still correct, but the base branch changes affect how our work should be implemented. Examples: a file we extend was refactored, an interface we use changed its signature, a utility we depend on was moved.

→ Present to user: "The base branch has changed since this session started. The changes affect implementation details but not the spec. I recommend creating a delta implementation plan to address the gaps."
→ If user confirms: Route to `superpowers:writing-plans` to create a delta plan, then re-execute, then return to this step.

**Level 2 — Spec drift:** The spec's assumptions are partially invalidated, but the original problem statement still holds. Examples: new instances of something the spec enumerates, a module boundary the spec assumes was reorganized, a dependency the spec relies on was replaced.

→ Present to user: "The base branch has changed since this session started. The changes partially invalidate the spec. I recommend updating the spec to account for the new state, then re-planning and re-executing."
→ If user confirms: Route to the brainstorming skill's "present design" phase to update the spec, then re-plan via `superpowers:writing-plans`, then re-execute, then return to this step.

**Level 3 — Fundamental drift:** The changes undermine the original problem statement or approach. Examples: another session already implemented what we were building, the architecture was fundamentally restructured, the feature we're extending was removed.

→ Present to user: "The base branch has changed significantly since this session started. The changes fundamentally affect what we were building. I recommend restarting the brainstorming process from scratch with full re-analysis of the codebase."
→ If user confirms: Route to `superpowers:brainstorming` for a full restart (including re-analysis of the codebase, clarifying questions, approach selection, and design review). The existing worktree and branch are preserved as context.

**User confirmation is required before routing.** The model proposes the level with reasoning; the user confirms or overrides.

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

**Also clean up session metadata:**

```bash
# Remove session metadata (if in worktree, it's removed with the worktree)
# If in fallback mode (no worktree), remove explicitly:
rm -f .superpowers-session.json
```

**For Option 3:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch | Remove .superpowers-session.json |
|--------|-------|------|---------------|----------------|----------------------------------|
| 1. Merge locally | ✓ | - | - | ✓ | ✓ |
| 2. Create PR | - | ✓ | ✓ | - | - |
| 3. Keep as-is | - | - | ✓ | - | - |
| 4. Discard | - | - | - | ✓ (force) | ✓ |

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
