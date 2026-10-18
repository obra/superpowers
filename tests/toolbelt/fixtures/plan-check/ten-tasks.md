# Fixture Plan

**Goal:** Exercise plan-check.

## Global Constraints

- None.

## Risks

- The importer also writes these rows; it calls `assertAccess`.

## PR Boundaries

| PR | Outcome | Tasks | Depends on | Risk | Independent verification |
|---|---|---|---|---|---|
| 1 | Big outcome | 1–10 | none | medium | tests pass |

### Task 1: Step 1

**Files:**
- Modify: `src/step1.ts`

**Contract:** `step1()` returns `1`.

**Proves:**
- (guard) `step1()` rejects a caller without access.

**Verify:** `npm test -- step1`

### Task 2: Step 2

**Files:**
- Modify: `src/step2.ts`

**Contract:** `step2()` returns `2`.

**Proves:**
- (guard) `step2()` rejects a caller without access.

**Verify:** `npm test -- step2`

### Task 3: Step 3

**Files:**
- Modify: `src/step3.ts`

**Contract:** `step3()` returns `3`.

**Proves:**
- (guard) `step3()` rejects a caller without access.

**Verify:** `npm test -- step3`

### Task 4: Step 4

**Files:**
- Modify: `src/step4.ts`

**Contract:** `step4()` returns `4`.

**Proves:**
- (guard) `step4()` rejects a caller without access.

**Verify:** `npm test -- step4`

### Task 5: Step 5

**Files:**
- Modify: `src/step5.ts`

**Contract:** `step5()` returns `5`.

**Proves:**
- (guard) `step5()` rejects a caller without access.

**Verify:** `npm test -- step5`

### Task 6: Step 6

**Files:**
- Modify: `src/step6.ts`

**Contract:** `step6()` returns `6`.

**Proves:**
- (guard) `step6()` rejects a caller without access.

**Verify:** `npm test -- step6`

### Task 7: Step 7

**Files:**
- Modify: `src/step7.ts`

**Contract:** `step7()` returns `7`.

**Proves:**
- (guard) `step7()` rejects a caller without access.

**Verify:** `npm test -- step7`

### Task 8: Step 8

**Files:**
- Modify: `src/step8.ts`

**Contract:** `step8()` returns `8`.

**Proves:**
- (guard) `step8()` rejects a caller without access.

**Verify:** `npm test -- step8`

### Task 9: Step 9

**Files:**
- Modify: `src/step9.ts`

**Contract:** `step9()` returns `9`.

**Proves:**
- (guard) `step9()` rejects a caller without access.

**Verify:** `npm test -- step9`

### Task 10: Step 10

**Files:**
- Modify: `src/step10.ts`

**Contract:** `step10()` returns `10`.

**Proves:**
- (guard) `step10()` rejects a caller without access.

**Verify:** `npm test -- step10`

## After release

Cite `src/legacy.ts:12` here; it is outside every task.
