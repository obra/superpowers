---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests scoped to this branch's changes → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify the tests that cover this branch's changes pass.** Do not run the project's full suite — only the files/suites touched by the branch diff plus their direct test counterparts.

1. Compute the changed surface relative to the base branch:
   ```bash
   git diff --name-only $(git merge-base HEAD <base-branch>)..HEAD
   ```
2. Map those paths to their test files (matching `*.spec.ts` / `*.test.ts` / `*.spec.ts` next to source, or the relevant `test/**` mirror).
3. If the branch was executed from a plan, reuse the plan's final-wave scope (the suite paths already enumerated by `nestjs-test` / `nuxt-test`). Do not widen it.
4. Run the test runner with explicit paths only, e.g.:
   ```bash
   pnpm test -- --runInBand <scoped-suite-paths>
   # or pnpm playwright test <scoped-spec-paths>
   ```
   Bare `pnpm test` / `npm test` / `pytest` / `go test ./...` are forbidden here.
5. If the diff is empty, skip Step 1 and continue.

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

Present the 4 options using the `AskUserQuestion` tool. Do not narrate them as free-form prose.

Question: "Implementation complete. What would you like to do?"

Options (in this order, single-select):

1. **Merge locally** — merge back to `<base-branch>` and delete the feature branch
2. **Create PR** — push the branch and open a Pull Request
3. **Keep as-is** — leave the branch and worktree untouched
4. **Discard** — delete the branch and worktree (requires typed confirmation in Step 4)

**Don't add explanation outside the option `description` fields** — keep the prompt tight.

### Step 4: Execute Choice

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result — same scoped command from Step 1, not the full suite
<scoped test command>

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
- **Fix:** Always verify tests before offering options — but scoped to the branch's diff, never the full project suite

**Running the full suite "to be safe"**
- **Problem:** Slow loop, masks unrelated failures as if they were the branch's, and contradicts the plan's final-wave scope
- **Fix:** Always pass explicit suite paths derived from `git diff` against the base branch (or reuse the plan's `nestjs-test` / `nuxt-test` scope)

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options via `AskUserQuestion`

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
- Run the full project test suite as the verification step (no bare `npm test` / `pnpm test` / `pytest` / `go test ./...`)
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Verify tests before offering options, scoped to the branch's diff
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
