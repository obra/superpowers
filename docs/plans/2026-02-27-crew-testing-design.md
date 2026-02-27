---
title: "Crew Testing Design"
date: "2026-02-27"
author: admin
status: approved
---

## Goal

Add basic automated tests that run before every `git push`, catching regressions in the data layer and type errors in the UI layer.

## Approach

**Option chosen: A — Bun test (backend) + Vitest (frontend) + pre-push hook**

### Backend tests — `crew/backend/src/__tests__/store.test.ts`

Framework: Bun built-in test runner (`bun test`). Zero extra dependencies.

Test cases:
- `readTask` — parses YAML frontmatter + markdown body into a valid `Task` object
- `readTask` — applies correct defaults (`status='backlog'`, `priority='P2'`, empty arrays)
- `readTask` — returns `null` for non-existent file
- `writeTask` + `readTask` round-trip — data survives serialization
- `updateTaskStatus` — persists status change to disk
- `readPerson` — parses `Person` object correctly
- `readPerson` — returns `null` for non-existent file

Isolation: Each test uses `os.tmpdir()` + a unique subdirectory, set via the `TEAM_DIR` env var. Cleaned up after each test.

`crew/backend/package.json` gets `"test": "bun test"`.

### Frontend — `crew/frontend/packages/app-core`

Framework: Vitest + `@vitest/ui`. Tests for any utility/transformation logic in `src/api.ts`.

`tsc --noEmit` also runs as part of the check.

### Frontend — `crew/frontend/packages/local-web`

TypeScript check only (`tsc --noEmit`). Route components are pure render; mocking the full React Query + Router stack is low value.

### Pre-push git hook — `.git/hooks/pre-push`

```bash
#!/usr/bin/env bash
set -e
echo "[pre-push] Running backend tests..."
cd "$(git rev-parse --show-toplevel)/crew/backend" && bun test

echo "[pre-push] Checking frontend types (app-core)..."
cd "../frontend/packages/app-core" && pnpm tsc --noEmit

echo "[pre-push] Checking frontend types (local-web)..."
cd "../local-web" && pnpm tsc --noEmit

echo "[pre-push] All checks passed."
```

Any non-zero exit code aborts the push.

## File changes

| File | Action |
|------|--------|
| `crew/backend/src/__tests__/store.test.ts` | Create |
| `crew/backend/package.json` | Add `"test"` script |
| `crew/frontend/packages/app-core/package.json` | Add vitest dev deps + `"test"` script |
| `crew/frontend/packages/app-core/vite.config.ts` | Create with vitest config |
| `crew/frontend/packages/app-core/src/__tests__/api.test.ts` | Create |
| `.git/hooks/pre-push` | Create (not tracked in git) |
| `scripts/install-hooks.sh` | Create — installs pre-push hook (tracked in git) |
