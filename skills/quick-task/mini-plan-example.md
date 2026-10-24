# Quick task: Rename the export button

**Goal:** The invoice list's export button reads "Download CSV".

## Risks

- `tests/e2e/invoices.spec.ts` selects the button by its text.

## PR Boundaries

| PR | Outcome | Tasks | Depends on | Risk | Independent verification |
|---|---|---|---|---|---|
| 1 | The export button reads "Download CSV" | 1 | none | medium | `npm test -- invoices` |

### Task 1: Rename the export button

**Files:** `src/invoices/InvoiceList.tsx`, `tests/e2e/invoices.spec.ts`

**Contract:** The export button `InvoiceList` renders reads "Download CSV" and keeps its click handler.

**Reuses:** none — copy-only change; no component involved

**Proves:** The rendered export button reads "Download CSV".

**Verify:** `npm test -- invoices`
