---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

Verify → Present 4 options → Execute → Clean up.

## Step 1 — Verify

**Non-negotiables pre-check:** if this branch touched anything in `using-superpowers § Non-Negotiables` (secrets/.env, auth/session, RLS, data migrations, destructive ops, new external deps, CI/CD), confirm critical-tier ceremony was applied to those commits. If not, escalate to the user before merging.

**Then run the test suite.** If it fails, list failures and stop — no Step 2 until green.

## Step 2 — Base Branch

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask.

## Step 3 — Present Options

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

No extra explanation.

## Step 4 — Execute

### Option 1 — Merge locally

```bash
git checkout <base-branch>
git pull
git merge <feature-branch>
<test command>          # verify on merged result
git branch -d <feature-branch>
```
→ cleanup worktree.

### Option 2 — PR

```bash
git push -u origin <feature-branch>
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets>

## Test Plan
- [ ] <verification steps>
EOF
)"
```
→ cleanup worktree.

### Option 3 — Keep

Report path. Keep worktree and branch.

### Option 4 — Discard

Confirm with typed `discard`:

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Then:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```
→ cleanup worktree.

## Step 5 — Cleanup Worktree

For options 1, 2, 4 only:
```bash
git worktree list | grep $(git branch --show-current)
git worktree remove <worktree-path>
```

## Quick Reference

| Option | Merge | Push | Keep worktree | Delete branch |
|---|:-:|:-:|:-:|:-:|
| 1. Merge locally | ✓ | – | – | ✓ |
| 2. PR | – | ✓ | ✓ | – |
| 3. Keep | – | – | ✓ | – |
| 4. Discard | – | – | – | ✓ (force) |

## Guardrails

- Never merge/push with failing tests.
- Never delete work without typed confirmation.
- Never force-push unless the user asks.
- Worktree cleanup: only options 1 and 4.

## Integration

Called by `subagent-driven-development` and `executing-plans` at sprint exit. Pairs with `using-git-worktrees`.
