---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from the current workspace, or before executing an implementation plan. Ensure an isolated worktree or feature branch exists.
---

# Using Git Worktrees

**Announce:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Step 0 — detect existing isolation

Before creating anything, check if you're already isolated:

```bash
git branch --show-current
git rev-parse --show-toplevel
```

If you're on a feature branch off a clean baseline (and not on `main`), you're already isolated.

## Isolate the work

Prefer the platform's native worktree tooling if available (Cursor / Antigravity), else git:

```bash
git worktree add ../<feature>-wt -b feature/<name>
```

Work in the worktree; keep `main` untouched.

For **ticketed orchestrated work**, use the pattern in `docs/agent_invariants.md` →
`ticket_worktree_pattern` (default `./tkt-<n>-<slug>/`), branch from the **pinned**
`origin/<base_branch>` SHA (never local base), and ensure the pattern is gitignored. If
`worktree-already-exists`, stop and reconcile — do not invent a second path. Do not "fix"
`.gitignore` mid-ticket; report the gap in the hand-back.

## Before you start

- Confirm a clean test baseline on `main` (tests pass on a fresh checkout).
- Confirm the worktree is on a new branch, not `main`.

## Guardrails

- Do not build directly on `main`.
- Commit work in the isolated workspace; merge only after review (see
  `finishing-a-development-branch`).
