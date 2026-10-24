# Fixture Plan

**Goal:** Exercise plan-check.

## Global Constraints

- None.

## Risks

- The importer also writes these rows; it calls `assertAccess`.

## PR Boundaries

| PR | Outcome | Tasks | Depends on | Risk | Independent verification |
|---|---|---|---|---|---|
| 1 | First outcome | 1–2 | none | high | tests pass |
| 2 | Second outcome | 3 | 1 | none | tests pass |

### Task 1: Step 1

**Files:**
- Modify: `src/step1.ts`

**Contract:** `step1()` returns `1`.

**Reuses:** `assertAccess` in `src/auth.ts`, the access check the importer already uses.

**Proves:**
- (guard) `step1()` rejects a caller without access.

**Verify:** `npm test -- step1`

### Task 2: Step 2

**Files:**
- Modify: `src/step2.ts`

**Contract:** `step2()` returns `2`.

**Reuses:** `assertAccess` in `src/auth.ts`, the access check the importer already uses.

**Proves:**
- (guard) `step2()` rejects a caller without access.

**Verify:** `npm test -- step2`

### Task 3: Step 3

**Files:**
- Modify: `src/step3.ts`

**Contract:** `step3()` returns `3`.

**Reuses:** `assertAccess` in `src/auth.ts`, the access check the importer already uses.

**Proves:**
- (guard) `step3()` rejects a caller without access.

**Verify:** `npm test -- step3`

### Task 2: Step 2

**Files:**
- Modify: `src/step2.ts`

**Contract:** `step2()` returns `2`.

**Reuses:** `assertAccess` in `src/auth.ts`, the access check the importer already uses.

**Proves:**
- (guard) `step2()` rejects a caller without access.

**Verify:** `npm test -- step2`

## After release

Cite `src/legacy.ts:12` here; it is outside every task.
