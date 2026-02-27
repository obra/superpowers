# Crew Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add backend unit tests (Bun test) + frontend type + API tests (Vitest) + a pre-push git hook that runs all checks before every push.

**Architecture:** Backend store logic is tested with temp directories via `TEAM_DIR` env var (requires making TEAM_DIR lazy first). Frontend app-core API client is tested with stubbed `fetch`. A tracked `scripts/hooks/pre-push` + `scripts/install-hooks.sh` handles hook distribution.

**Tech Stack:** Bun test (backend), Vitest (frontend app-core), pnpm tsc --noEmit (local-web), bash pre-push hook.

---

### Task 1: Make TEAM_DIR lazy in backend store

This is required for tests — currently `TEAM_DIR` is captured at module load time, so setting `process.env.TEAM_DIR` in test setup has no effect. Making it lazy means each function call reads the env var fresh.

**Files:**
- Modify: `crew/backend/src/store/index.ts:11`

**Step 1: Replace the constant with a function**

Change line 11 from:
```typescript
const TEAM_DIR = process.env.TEAM_DIR ?? join(process.cwd(), '../..', '.team')
```

To:
```typescript
function getTeamDir(): string {
  return process.env.TEAM_DIR ?? join(process.cwd(), '../..', '.team')
}
```

**Step 2: Replace all 15 usages of `TEAM_DIR` with `getTeamDir()`**

Run this to verify count before editing:
```bash
grep -c "TEAM_DIR" crew/backend/src/store/index.ts
# Expected: 16 (1 definition + 15 usages)
```

Replace every `join(TEAM_DIR,` with `join(getTeamDir(),` in the file. There are 15 such replacements.

**Step 3: Verify types still pass**

```bash
cd crew/backend && bun run typecheck
```
Expected: zero errors.

**Step 4: Commit**

```bash
git add crew/backend/src/store/index.ts
git commit -m "refactor: make TEAM_DIR lazy for testability"
```

---

### Task 2: Backend test setup + add test script

**Files:**
- Modify: `crew/backend/package.json`
- Create: `crew/backend/src/__tests__/store.test.ts`

**Step 1: Add test script to package.json**

In `crew/backend/package.json`, add to `"scripts"`:
```json
"test": "bun test"
```

**Step 2: Create test file with first test**

Create `crew/backend/src/__tests__/store.test.ts`:
```typescript
import { test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { readTask, writeTask, updateTaskStatus, readPerson } from '../store/index.js'
import type { Task } from '../types/index.js'

let tempDir: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'crew-test-'))
  process.env.TEAM_DIR = tempDir
})

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true })
  delete process.env.TEAM_DIR
})

// ─── readTask ────────────────────────────────────────────────────────────────

test('readTask returns null for non-existent file', () => {
  expect(readTask('MISSING-001')).toBeNull()
})
```

**Step 3: Run test to confirm it passes**

```bash
cd crew/backend && bun test
```
Expected: 1 test, 1 passed.

---

### Task 3: Remaining backend tests

**Files:**
- Modify: `crew/backend/src/__tests__/store.test.ts`

**Step 1: Add all remaining test cases**

Append to the test file:
```typescript
test('writeTask + readTask round-trip preserves all fields', () => {
  const task: Task = {
    id: 'ENG-001',
    title: 'Test task',
    status: 'todo',
    priority: 'P1',
    created: '2026-01-01',
    updated: '2026-01-01',
    tags: ['backend'],
    blocks: ['ENG-002'],
    blocked_by: [],
    body: 'This is the task body.',
  }
  writeTask(task)
  const result = readTask('ENG-001')
  expect(result).not.toBeNull()
  expect(result!.title).toBe('Test task')
  expect(result!.status).toBe('todo')
  expect(result!.priority).toBe('P1')
  expect(result!.tags).toEqual(['backend'])
  expect(result!.blocks).toEqual(['ENG-002'])
  expect(result!.body).toBe('This is the task body.')
})

test('readTask applies default status and priority when frontmatter omits them', () => {
  mkdirSync(join(tempDir, 'tasks'), { recursive: true })
  writeFileSync(
    join(tempDir, 'tasks', 'MIN-001.md'),
    '---\ntitle: Minimal task\n---\n\nBody here.',
  )
  const result = readTask('MIN-001')
  expect(result).not.toBeNull()
  expect(result!.status).toBe('backlog')
  expect(result!.priority).toBe('P2')
  expect(result!.tags).toEqual([])
  expect(result!.blocks).toEqual([])
  expect(result!.blocked_by).toEqual([])
})

test('updateTaskStatus changes status and persists to disk', () => {
  const task: Task = {
    id: 'ENG-002',
    title: 'Status test',
    status: 'todo',
    priority: 'P2',
    created: '2026-01-01',
    updated: '2026-01-01',
    tags: [],
    blocks: [],
    blocked_by: [],
    body: '',
  }
  writeTask(task)
  const updated = updateTaskStatus('ENG-002', 'in-progress')
  expect(updated).not.toBeNull()
  expect(updated!.status).toBe('in-progress')
  // Verify it was actually written to disk
  expect(readTask('ENG-002')!.status).toBe('in-progress')
})

test('updateTaskStatus returns null for non-existent task', () => {
  expect(updateTaskStatus('MISSING-001', 'done')).toBeNull()
})

// ─── readPerson ───────────────────────────────────────────────────────────────

test('readPerson returns null for non-existent file', () => {
  expect(readPerson('nobody')).toBeNull()
})

test('readPerson parses person correctly', () => {
  mkdirSync(join(tempDir, 'people'), { recursive: true })
  writeFileSync(
    join(tempDir, 'people', 'alice.md'),
    [
      '---',
      'name: Alice',
      'team: eng',
      'updated: "2026-01-01"',
      'current_task: ENG-001',
      'completed_today:',
      '  - "Wrote tests"',
      '---',
      '',
      "Alice's notes.",
    ].join('\n'),
  )
  const result = readPerson('alice')
  expect(result).not.toBeNull()
  expect(result!.username).toBe('alice')
  expect(result!.name).toBe('Alice')
  expect(result!.team).toBe('eng')
  expect(result!.current_task).toBe('ENG-001')
  expect(result!.completed_today).toEqual(['Wrote tests'])
  expect(result!.body).toBe("Alice's notes.")
})
```

**Step 2: Run all backend tests**

```bash
cd crew/backend && bun test
```
Expected: 7 tests, 7 passed.

**Step 3: Commit**

```bash
git add crew/backend/package.json crew/backend/src/__tests__/store.test.ts
git commit -m "test: add backend store unit tests (Bun test)"
```

---

### Task 4: app-core TypeScript + Vitest setup

**Files:**
- Create: `crew/frontend/packages/app-core/tsconfig.json`
- Create: `crew/frontend/packages/app-core/vitest.config.ts`
- Modify: `crew/frontend/packages/app-core/package.json`

**Step 1: Create tsconfig.json**

Create `crew/frontend/packages/app-core/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2023", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "jsx": "react-jsx",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 2: Create vitest.config.ts**

Create `crew/frontend/packages/app-core/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
  },
})
```

**Step 3: Update package.json**

Add to `crew/frontend/packages/app-core/package.json`:
- Scripts: `"test": "vitest run"` and `"check": "tsc --noEmit"`
- DevDependencies: `"vitest": "^3.0.0"`

Final package.json:
```json
{
  "name": "@vibe/app-core",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.85.5",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "typescript": "^5.9.2",
    "vitest": "^3.0.0"
  }
}
```

**Step 4: Install vitest**

```bash
cd crew/frontend && pnpm install
```
Expected: vitest added to node_modules.

**Step 5: Verify tsc check works**

```bash
cd crew/frontend/packages/app-core && pnpm check
```
Expected: zero errors.

---

### Task 5: app-core API tests

**Files:**
- Create: `crew/frontend/packages/app-core/src/__tests__/api.test.ts`

**Step 1: Write failing test first**

Create `crew/frontend/packages/app-core/src/__tests__/api.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchBoard, createTask } from '../api.js'

describe('API error handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws with status message on non-ok response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' }),
    )
    await expect(fetchBoard()).rejects.toThrow('404 Not Found')
  })

  it('returns parsed JSON on 200', async () => {
    const board = { tasks: [], sprints: [], people: [] }
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(board), { status: 200 }),
    )
    const result = await fetchBoard()
    expect(result).toEqual(board)
  })
})

describe('createTask', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends POST /api/tasks with JSON body', async () => {
    const payload = {
      id: 'ENG-001',
      title: 'Test task',
      status: 'backlog' as const,
      priority: 'P2' as const,
      tags: [],
      blocks: [],
      blocked_by: [],
      body: '',
    }
    const mockResponse = { ...payload, created: '2026-01-01', updated: '2026-01-01' }
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    )
    await createTask(payload)
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })
})
```

**Step 2: Run tests**

```bash
cd crew/frontend/packages/app-core && pnpm test
```
Expected: 3 tests, 3 passed.

**Step 3: Commit**

```bash
git add crew/frontend/packages/app-core/
git commit -m "test: add app-core API client tests (Vitest)"
```

---

### Task 6: Pre-push hook

**Files:**
- Create: `scripts/hooks/pre-push`
- Create: `scripts/install-hooks.sh`

**Step 1: Create the hook script**

Create `scripts/hooks/pre-push`:
```bash
#!/usr/bin/env bash
set -e

REPO="$(git rev-parse --show-toplevel)"

echo "[pre-push] Running backend tests..."
(cd "$REPO/crew/backend" && bun test)

echo "[pre-push] Checking app-core types..."
(cd "$REPO/crew/frontend/packages/app-core" && pnpm check)

echo "[pre-push] Checking local-web types..."
(cd "$REPO/crew/frontend/packages/local-web" && pnpm check)

echo "[pre-push] All checks passed."
```

**Step 2: Create the install script**

Create `scripts/install-hooks.sh`:
```bash
#!/usr/bin/env bash
set -e

REPO="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO/scripts/hooks"
HOOKS_DST="$REPO/.git/hooks"

for hook in "$HOOKS_SRC"/*; do
  name="$(basename "$hook")"
  cp "$hook" "$HOOKS_DST/$name"
  chmod +x "$HOOKS_DST/$name"
  echo "Installed: .git/hooks/$name"
done

echo "Done. Git hooks installed."
```

**Step 3: Make scripts executable and install hook**

```bash
chmod +x scripts/hooks/pre-push scripts/install-hooks.sh
bash scripts/install-hooks.sh
```
Expected:
```
Installed: .git/hooks/pre-push
Done. Git hooks installed.
```

**Step 4: Verify hook was installed**

```bash
ls -la .git/hooks/pre-push
```
Expected: file exists and is executable.

**Step 5: Commit the tracked scripts**

```bash
git add scripts/hooks/pre-push scripts/install-hooks.sh
git commit -m "chore: add pre-push hook + install script"
```

---

### Task 7: End-to-end verification

**Step 1: Run all tests manually to confirm green baseline**

```bash
# Backend
cd crew/backend && bun test

# Frontend app-core
cd crew/frontend/packages/app-core && pnpm test && pnpm check

# Frontend local-web tsc
cd crew/frontend/packages/local-web && pnpm check
```
Expected: all pass.

**Step 2: Trigger the pre-push hook**

```bash
git push origin feature/jingxia-kanban
```
Expected output includes:
```
[pre-push] Running backend tests...
[pre-push] Checking app-core types...
[pre-push] Checking local-web types...
[pre-push] All checks passed.
```

**Step 3: Document in CLAUDE.md if needed**

Add a note to the project's CLAUDE.md or README that new contributors should run:
```bash
bash scripts/install-hooks.sh
```
after cloning.
