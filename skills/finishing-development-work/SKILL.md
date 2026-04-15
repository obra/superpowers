---
name: finishing-development-work
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing Development Work

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-development-work skill to complete this work."

**VCS commands:** All VCS operations below use abstract names. See `references/vcs-operations.md` for the concrete command matching your user's VCS (injected as `VCS: git` or `VCS: jj` in session context).

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

### Step 2: Determine Base

Use the "Determine base" operation from `references/vcs-operations.md` to find the base revision.

Or ask: "This work started from main - is that correct?"

### Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back to <base> locally
2. Push and create a Pull Request
3. Keep the work as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

Use the "Merge to base" operation from `references/vcs-operations.md`.

Then verify tests on the merged result:
```bash
<test command>
```

If tests pass, the feature ref/branch can be cleaned up.

Then: Cleanup workspace (Step 5)

#### Option 2: Push and Create PR

Use the "Push to remote" operation from `references/vcs-operations.md`.

**jj note:** Ensure a bookmark exists before pushing. If no bookmark was created during workspace setup, use the "Create named ref" operation first.

Then create PR:
```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup workspace (Step 5)

#### Option 3: Keep As-Is

Report: "Keeping work in current state. Workspace preserved at <path>."

**Don't cleanup workspace.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- All work in this workspace
- Revision(s): <revision-list>
- Workspace at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed, use the "Discard feature work" operation from `references/vcs-operations.md`.

Then: Cleanup workspace (Step 5)

### Step 5: Cleanup Workspace

**For Options 1, 2, 4:**

Check if in a linked workspace using the "Check if in linked workspace" operation from `references/vcs-operations.md`.

If yes, use the "Remove workspace" operation to clean up.

**For Option 3:** Keep workspace.

## Quick Reference

| Option | Merge | Push | Keep Workspace | Cleanup Ref |
|--------|-------|------|----------------|-------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic workspace cleanup**
- **Problem:** Remove workspace when might need it (Option 2, 3)
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
- Clean up workspace for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-workspaces** - Cleans up workspace created by that skill
