---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Detect environment → Present options → Execute choice → Clean up.

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

### Step 2: Detect Environment

**Determine workspace state before presenting options:**

```bash
JJ_ROOT=$(jj workspace root 2>/dev/null)
if [ -z "$JJ_ROOT" ]; then
  WORKSPACE_KIND=none           # Not a jj repo
elif [ -f "$JJ_ROOT/.jj/repo" ]; then
  WORKSPACE_KIND=linked         # Linked workspace, owns cleanup if we created it
else
  WORKSPACE_KIND=main           # Main workspace, no workspace cleanup
fi

CURRENT_BOOKMARK=$(jj log -r @ --no-graph -T 'bookmarks.join(",") ++ "\n"' 2>/dev/null)
```

This determines which menu to show and how cleanup works:

| State | Menu | Cleanup |
|-------|------|---------|
| `WORKSPACE_KIND=main` (or `none`) | Standard 4 options | No workspace to clean up |
| `WORKSPACE_KIND=linked`, bookmark on `@` | Standard 4 options | Provenance-based (see Step 6) |
| `WORKSPACE_KIND=linked`, no bookmark (anonymous change) | Reduced 3 options (no merge) | No cleanup (externally managed) |

### Step 3: Determine Base Bookmark

```bash
# Try common base bookmarks
jj log -r 'heads(::@ & ::main)' --no-graph -T 'commit_id ++ "\n"' 2>/dev/null \
  || jj log -r 'heads(::@ & ::master)' --no-graph -T 'commit_id ++ "\n"' 2>/dev/null
```

Or ask: "This branch split from main — is that correct?"

### Step 4: Present Options

**Main workspace and linked workspace with a bookmark — present exactly these 4 options:**

```
Implementation complete. What would you like to do?

1. Merge back to <base-bookmark> locally
2. Push and create a Pull Request
3. Keep the bookmark as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Linked workspace with no bookmark (anonymous change) — present exactly these 3 options:**

```
Implementation complete. You're on an anonymous change (externally managed workspace).

1. Create a bookmark, push, and open a Pull Request
2. Keep as-is (I'll handle it later)
3. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 5: Execute Choice

#### Option 1: Merge Locally

```bash
# Move to the main workspace root for CWD safety
MAIN_ROOT=$(jj workspace root --name default 2>/dev/null)
cd "$MAIN_ROOT"

# Fetch latest, then advance the base bookmark to include the feature.
jj git fetch
jj new "$BASE_BOOKMARK"                      # land on base tip
jj rebase -s "$FEATURE_BOOKMARK" -d "$BASE_BOOKMARK"
jj bookmark set "$BASE_BOOKMARK" -r "$FEATURE_BOOKMARK"

# Verify tests on merged result
<test command>

# Only after success: cleanup workspace (Step 6), then drop the feature bookmark
```

Then: Cleanup workspace (Step 6), then drop the feature bookmark:

```bash
jj bookmark delete "$FEATURE_BOOKMARK"
```

(Use `jj bookmark forget <name>` instead if the bookmark was never pushed and you don't want a deletion propagated to remotes.)

#### Option 2: Push and Create PR

```bash
# Push the bookmark (creates remote bookmark if new)
jj git push --bookmark "$FEATURE_BOOKMARK" --allow-new

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

**Do NOT clean up workspace** — user needs it alive to iterate on PR feedback.

#### Option 3: Keep As-Is

Report: "Keeping bookmark <name>. Workspace preserved at <path>."

**Don't cleanup workspace.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Bookmark <name>
- All changes: <change-list>
- Workspace at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
MAIN_ROOT=$(jj workspace root --name default 2>/dev/null)
cd "$MAIN_ROOT"
```

Then: Cleanup workspace (Step 6), then forget the feature bookmark and abandon its changes:
```bash
jj bookmark forget "$FEATURE_BOOKMARK"
jj abandon "$FEATURE_BOOKMARK"  # drop the commits locally
```

### Step 6: Cleanup Workspace

**Only runs for Options 1 and 4.** Options 2 and 3 always preserve the workspace.

```bash
JJ_ROOT=$(jj workspace root 2>/dev/null)
WORKSPACE_PATH="$JJ_ROOT"
```

**If `WORKSPACE_KIND=main` or `none`:** No workspace to clean up. Done.

**If workspace path is under `.worktrees/`, `worktrees/`, or `~/.config/superpowers/worktrees/`:** Superpowers created this workspace — we own cleanup.

```bash
MAIN_ROOT=$(jj workspace root --name default 2>/dev/null)
cd "$MAIN_ROOT"

# Identify the workspace name by matching its root path
WORKSPACE_NAME=$(jj workspace list -T 'name ++ "\t" ++ "\n"' \
  | awk -v root="$WORKSPACE_PATH" -F'\t' '$0 ~ root {print $1}' | head -1)

# Forget the workspace registration, then remove the directory.
jj workspace forget "$WORKSPACE_NAME"
rm -rf "$WORKSPACE_PATH"
```

**Otherwise:** The host environment (harness) owns this workspace. Do NOT remove it. If your platform provides a workspace-exit tool, use it. Otherwise, leave the workspace in place.

## Quick Reference

| Option | Merge | Push | Keep Workspace | Cleanup Bookmark |
|--------|-------|------|----------------|------------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (abandon) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" is ambiguous
- **Fix:** Present exactly 4 structured options (or 3 for anonymous change)

**Cleaning up workspace for Option 2**
- **Problem:** Remove workspace user needs for PR iteration
- **Fix:** Only cleanup for Options 1 and 4

**Forgetting workspace before removing files**
- **Problem:** `rm -rf` leaves a stale workspace registration in `jj workspace list`
- **Fix:** Always `jj workspace forget <name>` first, then `rm -rf` the directory

**Running `jj workspace forget` from inside the workspace being forgotten**
- **Problem:** Forgetting the workspace you're standing in leaves jj confused about CWD
- **Fix:** Always `cd` to the main workspace root before forgetting

**Cleaning up harness-owned workspaces**
- **Problem:** Removing a workspace the harness created causes phantom state
- **Fix:** Only clean up workspaces under `.worktrees/`, `worktrees/`, or `~/.config/superpowers/worktrees/`

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Remove a workspace before confirming merge success
- Clean up workspaces you didn't create (provenance check)
- Run `jj workspace forget` from inside the workspace being forgotten

**Always:**
- Verify tests before offering options
- Detect environment before presenting menu
- Present exactly 4 options (or 3 for anonymous change)
- Get typed confirmation for Option 4
- Clean up workspace for Options 1 & 4 only
- `cd` to main workspace root before forgetting/removing
- `jj workspace forget` before `rm -rf`
