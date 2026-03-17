---
name: finishing-a-development-branch
description: Use when implementation is complete and all tests pass - guides the decision between merge, PR, keep, or discard with structured options and worktree cleanup
---

# Finishing a Development Branch

> **This skill mirrors the `/finishing-a-development-branch` workflow.**

## Overview

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

## Process

1. **Verify tests pass** — If tests fail, STOP.
2. **Determine base branch** — main or master?
3. **Present 4 options:**
   1. Merge locally
   2. Push and create PR
   3. Keep as-is
   4. Discard (requires typing "discard" to confirm)
4. **Execute chosen option**
5. **Clean up worktree** (Options 1, 2, 4 only)

## Quick Reference

| Option     | Merge | Push | Keep Worktree | Delete Branch |
| ---------- | ----- | ---- | ------------- | ------------- |
| 1. Merge   | ✓     | -    | -             | ✓             |
| 2. PR      | -     | ✓    | ✓             | -             |
| 3. Keep    | -     | -    | ✓             | -             |
| 4. Discard | -     | -    | -             | ✓ (force)     |

## Red Flags

Never: Proceed with failing tests, delete without confirmation, force-push without explicit request.
