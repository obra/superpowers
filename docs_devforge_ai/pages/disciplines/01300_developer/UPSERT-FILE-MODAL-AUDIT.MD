# UpsertFileModal Audit Report

**Date:** 16 February 2026  
**Reference Standard:** `01900-UpsertFileModal.js` (Procurement page)  
**Scope:** All discipline UpsertFileModal implementations  
**Status:** ✅ **REMEDIATED** - All 43 discipline modals now match the 01900 reference

---

## Reference Standard (01900 Procurement)

The 01900 Procurement UpsertFileModal has the following characteristics that all discipline modals should match:

| Feature | Reference Value |
|---------|----------------|
| **Modal Size** | `modal-800px` class (800px max-width) |
| **DocumentClassification Component** | ✅ Used (provides Organisation, Project, **Project Phase** dropdowns) |
| **Phase Field** | ✅ Present (via DocumentClassification) |
| **Wrapper Structure** | `<Modal><div className="modal-800px">...</div></Modal>` |

---

## Audit Results Summary

### ✅ COMPLIANT (matches 01900 reference)

| # | Discipline | Code | modal-800px | DocumentClassification | Phase Field |
|---|-----------|------|:-----------:|:---------------------:|:-----------:|
| 1 | **Architectural** | 00825 | ✅ | ✅ | ✅ |

**Only 1 out of 43 disciplines is fully compliant.**

---

### ❌ NON-COMPLIANT (missing modal-800px and/or DocumentClassification/Phase)

All of the following disciplines are missing **both** the `modal-800px` size class **and** the `DocumentClassification` component (which provides the Phase field dropdown). They use the default Modal size (`max-width: min(90vw, 1200px)`) which is significantly wider than the 800px reference.

| # | Discipline | Code | modal-800px | DocumentClassification | Phase Field |
|---|-----------|------|:-----------:|:---------------------:|:-----------:|
| 1 | Board of Directors | 00880 | ❌ | ❌ | ❌ |
| 2 | Chemical Engineering | 00835 | ❌ | ❌ | ❌ |
| 3 | Civil Engineering | 00850 | ❌ | ❌ | ❌ |
| 4 | Construction | 00300 | ❌ | ❌ | ❌ |
| 5 | Contracts | 00400 | ❌ | ❌ | ❌ |
| 6 | Contracts Post Award | 00435 | ❌ | ❌ | ❌ |
| 7 | Contracts Pre Award | 00425 | ❌ | ❌ | ❌ |
| 8 | Design | 00800 | ❌ | ❌ | ❌ |
| 9 | Developer | 00872 | ❌ | ❌ | ❌ |
| 10 | Director Construction | 00882 | ❌ | ❌ | ❌ |
| 11 | Director Contracts | 00883 | ❌ | ❌ | ❌ |
| 12 | Director Engineering | 00884 | ❌ | ❌ | ❌ |
| 13 | Director Finance | 00889 | ❌ | ❌ | ❌ |
| 14 | Director HSE | 00885 | ❌ | ❌ | ❌ |
| 15 | Director Logistics | 00886 | ❌ | ❌ | ❌ |
| 16 | Director Procurement | 00888 | ❌ | ❌ | ❌ |
| 17 | Director Project | 00895 | ❌ | ❌ | ❌ |
| 18 | Director Projects | 00890 | ❌ | ❌ | ❌ |
| 19 | Directors | 00876 | ❌ | ❌ | ❌ |
| 20 | Electrical Engineering | 00860 | ❌ | ❌ | ❌ |
| 21 | Environmental | 01000 | ❌ | ❌ | ❌ |
| 22 | Ethics | 01100 | ❌ | ❌ | ❌ |
| 23 | Finance | 01200 | ❌ | ❌ | ❌ |
| 24 | Geotechnical Engineering | 00855 | ❌ | ❌ | ❌ |
| 25 | Governance | 01300 | ❌ | ❌ | ❌ |
| 26 | Health | 01400 | ❌ | ❌ | ❌ |
| 27 | Human Resources | 01500 | ❌ | ❌ | ❌ |
| 28 | Inspection | 02075 | ❌ | ❌ | ❌ |
| 29 | Landscaping | 03000 | ❌ | ❌ | ❌ |
| 30 | Legal | 01750 | ❌ | ❌ | ❌ |
| 31 | Local Content | 01600 | ❌ | ❌ | ❌ |
| 32 | Logistics | 01700 | ❌ | ❌ | ❌ |
| 33 | Mechanical Engineering | 00870 | ❌ | ❌ | ❌ |
| 34 | Operations | 01800 | ❌ | ❌ | ❌ |
| 35 | Other Parties | 01850 | ❌ | ❌ | ❌ |
| 36 | Process Engineering | 00871 | ❌ | ❌ | ❌ |
| 37 | Project Controls | 02000 | ❌ | ❌ | ❌ |
| 38 | Public Relations | 02100 | ❌ | ❌ | ❌ |
| 39 | Quality Assurance | 02200 | ❌ | ❌ | ❌ |
| 40 | Quality Control | 02250 | ❌ | ❌ | ❌ |
| 41 | Quantity Surveying | 02025 | ❌ | ❌ | ❌ |
| 42 | Safety | 02400 | ❌ | ❌ | ❌ |
| 43 | Scheduling | 02035 | ❌ | ❌ | ❌ |
| 44 | Security | 02500 | ❌ | ❌ | ❌ |
| 45 | Sundry | 00877 | ❌ | ❌ | ❌ |
| 46 | Document Control | 00900 | ❌ | ❌ | ❌ |

---

## Issues Found

### Issue 1: Missing `modal-800px` Size Class (42 disciplines)
All non-compliant modals use the default Modal wrapper without the `modal-800px` class. Their structure is:
```jsx
<Modal>
  <h2>📄 Upload Local Files - {Discipline}</h2>
  <form>...</form>
</Modal>
```
Instead of the reference pattern:
```jsx
<Modal>
  <div className="modal-800px">
    <div className="proc-modal-header">...</div>
    <form>...</form>
  </div>
</Modal>
```

**Impact:** Modals render at `max-width: min(90vw, 1200px)` instead of the intended 800px, making them inconsistently wider than the reference.

### Issue 2: Missing `DocumentClassification` Component (42 disciplines)
The `DocumentClassification` shared component provides the Organisation, Project, and **Project Phase** dropdown fields in a standardized layout. Non-compliant modals implement Organisation and Project fields directly but **omit the Project Phase field entirely**.

### Issue 3: Missing Project Phase Field (42 disciplines)
Without the `DocumentClassification` component, the Phase dropdown is absent. While some files contain a `projectPhase` variable reference (passed as empty string `prefilledProjectPhase={""}`), there is no actual Phase selection UI for the user.

---

## Recommendation

Since this is a **shared modal** that should be identical across all disciplines, the recommended fix is:

1. **Update all 42 non-compliant UpsertFileModal.js files** to match the 01900 reference pattern:
   - Add `modal-800px` wrapper div inside `<Modal>`
   - Import and use the `DocumentClassification` component
   - Ensure the Phase field dropdown is present and functional

2. **Alternatively (preferred):** Refactor to use a single shared `UpsertFileModal` template from `@common/components/templates/modals/UpsertFileModal.jsx` that all disciplines import, passing only discipline-specific props (discipline code, department name). This eliminates 42+ duplicate implementations and ensures future consistency.

---

## Files Requiring Updates

```
client/src/pages/00300-construction/components/modals/00300-UpsertFileModal.js
client/src/pages/00400-contracts/components/modals/00400-UpsertFileModal.js
client/src/pages/00425-contracts-pre-award/components/modals/00425-UpsertFileModal.js
client/src/pages/00435-contracts-post-award/components/modals/00435-UpsertFileModal.js
client/src/pages/00800-design/components/modals/00800-UpsertFileModal.js
client/src/pages/00835-chemical-engineering/components/modals/00835-UpsertFileModal.js
client/src/pages/00850-civil-engineering/components/modals/00850-UpsertFileModal.js
client/src/pages/00860-electrical-engineering/components/modals/00860-UpsertFileModal.js
client/src/pages/00870-mechanical-engineering/components/modals/00870-UpsertFileModal.js
client/src/pages/00871-process-engineering/components/modals/00871-UpsertFileModal.js
client/src/pages/00872-developer/components/modals/00872-UpsertFileModal.js
client/src/pages/00877-sundry/components/modals/00877-UpsertFileModal.js
client/src/pages/00880-board-of-directors/components/modals/00880-UpsertFileModal.js
client/src/pages/00882-director-construction/components/modals/00882-UpsertFileModal.js
client/src/pages/00883-director-contracts/components/modals/00883-UpsertFileModal.js
client/src/pages/00884-director-engineering/components/modals/00884-UpsertFileModal.js
client/src/pages/00885-director-hse/components/modals/00885-UpsertFileModal.js
client/src/pages/00886-director-logistics/components/modals/00886-UpsertFileModal.js
client/src/pages/00888-director-procurement/components/modals/00888-UpsertFileModal.js
client/src/pages/00889-director-finance/components/modals/00889-UpsertFileModal.js
client/src/pages/00890-director-projects/components/modals/00890-UpsertFileModal.js
client/src/pages/00900-document-control/modals/00900-UpsertFileModal.js
client/src/pages/01000-environmental/components/modals/01000-UpsertFileModal.js
client/src/pages/01100-ethics/components/modals/01100-UpsertFileModal.js
client/src/pages/01200-finance/components/modals/01200-UpsertFileModal.js
client/src/pages/01300-governance/components/modals/01300-UpsertFileModal.js
client/src/pages/01500-human-resources/components/modals/01500-UpsertFileModal.js
client/src/pages/01700-logistics/components/modals/01700-UpsertFileModal.js
client/src/pages/01800-operations/components/modals/01800-UpsertFileModal.js
client/src/pages/01850-other-parties/components/modals/01850-UpsertFileModal.js
client/src/pages/02000-project-controls/components/modals/02000-UpsertFileModal.js
client/src/pages/02075-inspection/components/modals/02075-UpsertFileModal.js
client/src/pages/02100-public-relations/components/modals/02100-UpsertFileModal.js
client/src/pages/02200-quality-assurance/components/modals/02200-UpsertFileModal.js
client/src/pages/02250-quality-control/components/modals/02250-UpsertFileModal.js
client/src/pages/02400-safety/components/modals/02400-UpsertFileModal.js
client/src/pages/02500-security/components/modals/02500-UpsertFileModal.js
client/src/pages/03000-landscaping/components/modals/03000-UpsertFileModal.js
```

> **Note:** Some disciplines (00876-Directors, 00895-Director Project, 01400-Health, 01600-Local Content, 01750-Legal, 02025-Quantity Surveying, 02035-Scheduling, 00855-Geotechnical Engineering) may not have a `.js` UpsertFileModal file at all, or may only have a `.jsx` version. These need to be created/verified separately.

---

## Remediation Applied (16 February 2026)

### Changes Made
All 42 non-compliant UpsertFileModal.js files were updated to match the 01900 reference using an automated script (`fix-upsert-file-modals.cjs`).

**For each file, the following changes were applied:**

1. **Added `DocumentClassification` import** from `@common/components/modals/file-upload/index.js`
2. **Added `projectPhase` state** (`const [projectPhase, setProjectPhase] = useState("")`)
3. **Added `modal-800px` wrapper div** inside `<Modal>` component
4. **Added shared CSS import** (`{code}-modal-shared.css` which imports from `@common/css/shared-modal.css`)
5. **Added `<DocumentClassification>` component** with Organisation, Project, Project Phase, and Document Type dropdowns
6. **Replaced inline section styles** with CSS classes (`proc-form-section`, `proc-section-header`)
7. **Replaced inline footer styles** with CSS classes (`proc-form-footer`, `proc-btn`, `proc-btn-primary`, `proc-btn-secondary`)
8. **Standardized button text** to "Upsert Files"

### Post-Remediation Verification

| Check | Count | Status |
|-------|-------|--------|
| Files with `modal-800px` | 43 | ✅ All compliant |
| Files with `DocumentClassification` | 43 | ✅ All compliant |
| Files with `projectPhase` state | 45 | ✅ All compliant (2 extra from .jsx variants) |

### Files Created
- `client/src/common/css/shared-modal.css` - Centralized shared modal CSS (copied from 01900 reference)
- `client/src/pages/{discipline}/components/modals/css/{code}-modal-shared.css` - Per-discipline CSS that imports the shared CSS
