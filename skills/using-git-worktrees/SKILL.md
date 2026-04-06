---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

Git worktrees create isolated workspaces sharing the same repository.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection (priority order)

1. **Check existing:** `ls -d .worktrees worktrees 2>/dev/null` — if found, use it (`.worktrees` wins if both exist)
2. **Check CLAUDE.md:** `grep -i "worktree.*director" CLAUDE.md` — if preference specified, use it
3. **Ask user:** Offer `.worktrees/` (project-local, hidden) or `~/.config/superpowers/worktrees/<project>/` (global)

## Safety: Verify Ignored

**For project-local directories — MUST verify before creating:**
```bash
git check-ignore -q .worktrees 2>/dev/null
```
**If NOT ignored:** Add to `.gitignore`, commit, then proceed. This prevents worktree contents polluting git status.

Global directories (`~/.config/...`) need no verification.

## Creation Steps

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**Auto-detect and run setup:** `npm install` / `cargo build` / `pip install` / `go mod download` based on project files.

**Verify clean baseline:** Run test suite. If tests fail, report and ask whether to proceed.

**Report:** "Worktree ready at `<path>`. Tests passing (`<N>` tests). Ready to implement `<feature>`."

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | CLAUDE.md → Ask user |
| Not ignored | Add to .gitignore + commit |
| Tests fail | Report + ask |

## Red Flags

**Never:** Create worktree without verifying ignored (project-local), skip baseline tests, proceed with failing tests without asking, assume directory location.

**Always:** Follow directory priority, verify ignored, auto-detect setup, verify clean baseline.

## Integration

**Called by:** brainstorming, sspower:subagent-driven-development, sspower:executing-plans
**Pairs with:** sspower:finishing-a-development-branch (cleanup)
