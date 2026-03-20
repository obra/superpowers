# Grid Positioning Audit Summary - 47 Discipline Pages

**Audit Date:** February 6, 2026  
**Auditor:** AI Assistant  
**Standard Reference:** PAGE_STANDARDIZATION_IMPLEMENTATION_PLAN.md

---

## Executive Summary

A comprehensive audit was conducted on all 47 EPCM discipline pages to verify grid positioning compliance against the standardized patterns defined in the PAGE_STANDARDIZATION_IMPLEMENTATION_PLAN.md.

### Audit Results

| Metric | Value |
|--------|-------|
| **Total Pages Audited** | 47 |
| **Fully Compliant** | 0 |
| **Non-Compliant** | 47 |
| **Compliance Rate** | **0.0%** |

---

## Critical Findings

### 1. State Button Implementation (45 pages affected)

**Issue:** The majority of pages are missing the standard state button implementation:
- ❌ Missing "Agents" state button
- ❌ Missing "Upserts" state button  
- ❌ Missing "Workspace" state button

**Standard Pattern Required:**
```jsx
<div className="A-XXXXX-nav-row">
  <button className={`state-button ${currentState === "agents" ? "active" : ""}`} 
          onClick={() => handleStateChange("agents")}>Agents</button>
  <button className={`state-button ${currentState === "upserts" ? "active" : ""}`}
          onClick={() => handleStateChange("upserts")}>Upserts</button>
  <button className={`state-button ${currentState === "workspace" ? "active" : ""}`}
          onClick={() => handleStateChange("workspace")}>Workspace</button>
</div>
```

### 2. CSS Class Naming Errors (11 pages affected)

**Critical Issue:** Several pages use incorrect digit counts in CSS class names:

| Page Code | Class Name Issue |
|-----------|------------------|
| 00425 | Uses `A-0425-nav-row` (4 digits) instead of `A-00425-nav-row` (5 digits) |
| 00882 | Uses `A-088-nav-row` (3 digits) instead of `A-00882-nav-row` (5 digits) |
| 00883 | Uses `A-0883-button-container` (4 digits) instead of `A-00883-button-container` (5 digits) |
| 00885 | Uses `A-0885-button-container` (4 digits) instead of `A-00885-button-container` (5 digits) |
| 00886 | Uses `A-0886-button-container` (4 digits) instead of `A-00886-button-container` (5 digits) |
| 00895 | Uses `A-089-nav-row` (3 digits) instead of `A-00895-nav-row` (5 digits) |
| 00855 | Uses `A-0855-button-container` (4 digits) instead of `A-00855-button-container` (5 digits) |
| 00871 | Uses `A-0871-button-container` (4 digits) instead of `A-00871-button-container` (5 digits) |
| 02035 | Uses `A-2035-button-container` (4 digits) instead of `A-02035-button-container` (5 digits) |

**Impact:** These naming errors cause CSS styles to not be applied, resulting in broken navigation layouts.

### 3. Grid Positioning Errors (7 pages affected)

**Issue:** Grid positioned at incorrect vertical position:

| Page Code | Issue |
|-----------|-------|
| 01300 | Grid at `top: 60%` instead of `top: 50%` |
| 01400 | Grid at `top: 60%` instead of `top: 50%` |
| 01500 | Grid at `top: 60%` instead of `top: 50%` |
| 02100 | Grid at `top: 60%` instead of `top: 50%` |
| 02200 | Grid at `top: 60%` instead of `top: 50%` |
| 02250 | Grid at `top: 60%` instead of `top: 50%` |
| 00877 | Grid at `top: 60%` instead of `top: 50%` |

**Standard Pattern Required:**
```jsx
style={{
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "rgba(255, 255, 255, 0.6)",
}}
```

### 4. Missing getCurrentButtons Function (26 pages affected)

**Issue:** Pages lacking the standardized `getCurrentButtons()` function for state-based button management.

**Standard Pattern Required:**
```jsx
const getCurrentButtons = () => {
  switch (currentState) {
    case "agents":
      return sortButtonsAlphabetically(agentsButtons);
    case "upserts":
      return sortButtonsAlphabetically(upsertButtons);
    case "workspace":
      return sortButtonsAlphabetically(workspaceButtons);
    default:
      return sortButtonsAlphabetically(agentsButtons);
  }
};
```

### 5. Missing Opaque Background (22 pages affected)

**Issue:** Grid containers missing the required opaque background.

**Standard Required:**
```jsx
backgroundColor: "rgba(255, 255, 255, 0.6)"
```

---

## Priority Fix List

Pages ranked by number of issues (highest priority first):

| Priority | Code | Name | Issues | Warnings |
|----------|------|------|--------|----------|
| 1 | 02035 | Scheduling | 9 | 4 |
| 2 | 00882 | Director Construction | 7 | 2 |
| 3 | 00883 | Director Contracts | 7 | 3 |
| 4 | 00895 | Director Project | 7 | 1 |
| 5 | 00855 | Geotechnical Engineering | 7 | 1 |
| 6 | 00871 | Process Engineering | 7 | 2 |
| 7 | 00425 | Contracts Pre Award | 6 | 1 |
| 8 | 00885 | Director HSE | 6 | 3 |
| 9 | 00886 | Director Logistics | 6 | 2 |
| 10 | 00876 | Directors | 5 | 2 |
| 11 | 00860 | Electrical Engineering | 5 | 2 |
| 12 | 01300 | Governance | 5 | 1 |
| 13 | 01400 | Health | 5 | 1 |
| 14 | 01500 | Human Resources | 5 | 1 |
| 15 | 01750 | Legal | 5 | 3 |
| 16 | 01600 | Local Content | 5 | 3 |
| 17 | 01700 | Logistics | 5 | 3 |
| 18 | 00870 | Mechanical Engineering | 5 | 2 |
| 19 | 01800 | Operations | 5 | 3 |
| 20 | 02100 | Public Relations | 5 | 1 |
| 21 | 02250 | Quality Control | 5 | 2 |
| 22 | 02025 | Quantity Surveying | 5 | 3 |
| 23 | 02400 | Safety | 5 | 2 |
| 24 | 02500 | Security | 5 | 3 |
| 25 | 00877 | Sundry | 5 | 1 |

---

## Pages Closest to Compliance

These pages have the fewest issues and could be brought to compliance most quickly:

| Code | Name | Issues | Key Missing Items |
|------|------|--------|-------------------|
| 02200 | Quality Assurance | 2 | Opaque background, Grid at 60% |
| 01850 | Other Parties | 2 | Opaque background, getCurrentButtons |
| 00300 | Construction | 3 | State buttons |
| 00400 | Contracts | 3 | State buttons |
| 00850 | Civil Engineering | 3 | State buttons |
| 01100 | Ethics | 3 | State buttons |
| 01200 | Finance | 3 | State buttons |
| 03000 | Landscaping | 3 | State buttons |
| 01900 | Procurement | 3 | State buttons |

---

## Example: Correct Implementation (00400 Contracts)

The 00400 Contracts page demonstrates the correct grid positioning pattern:

```jsx
// Grid container with proper positioning
{currentState && currentButtons.length > 0 && (
  <div
    className={`A-00400-button-container ${isButtonContainerVisible ? "visible" : ""}`}
    style={{
      position: "fixed",           // ✅ Viewport-relative positioning
      top: "50%", left: "50%",     // ✅ Perfect centering
      transform: "translate(-50%, -50%)",
      backgroundColor: "rgba(255, 255, 255, 0.6)",  // ✅ Opaque background
      display: "grid",
      gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
      gap: "15px",
      placeItems: "center",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      zIndex: 100,
      maxWidth: "800px",
      width: "95%",
    }}
  >
    {/* Buttons mapped with grid positioning */}
    {currentButtons.map((button, index) => {
      const position = gridLayout.positions[index];
      const safeCol = position?.col || 1;
      const safeRow = position?.row || 1;
      return (
        <button
          key={index}
          type="button"
          className="modal-trigger-button"
          style={{
            gridColumn: safeCol,
            gridRow: safeRow,
          }}
          onClick={() => { /* handle click */ }}
        >
          {button.label}
        </button>
      );
    })}
  </div>
)}
```

---

## Recommendations

### Immediate Actions (High Priority)

1. **Fix CSS Class Naming Errors**
   - Pages with 3-4 digit class names must be corrected to 5 digits
   - This is breaking navigation layouts

2. **Correct Grid Positioning**
   - Change `top: "60%"` to `top: "50%"` on affected pages
   - Ensures consistent vertical centering

3. **Add Opaque Backgrounds**
   - Add `backgroundColor: "rgba(255, 255, 255, 0.6)"` to grid containers
   - Improves readability and visual consistency

### Short-term Actions (Medium Priority)

4. **Implement getCurrentButtons Function**
   - Add standardized button state management
   - 26 pages need this function

5. **Add State Button Navigation**
   - Implement Agents/Upserts/Workspace state buttons
   - Required for state-based grid functionality

### Long-term Actions (Lower Priority)

6. **Standardize Initial State**
   - Use `useState(null)` instead of `useState("agents")` to prevent grid flash
   - 15+ pages need this change

7. **Add Conditional Grid Rendering**
   - Wrap grid containers with `{currentState && currentButtons.length > 0 && (...)}`
   - Prevents empty grid display

---

## Compliance Checklist

For a page to be considered compliant, it must have:

- [ ] **Grid Positioning:** `position: "fixed"` (not absolute)
- [ ] **Grid Centering:** `top: "50%"`, `left: "50%"`, `transform: "translate(-50%, -50%)"`
- [ ] **Opaque Background:** `backgroundColor: "rgba(255, 255, 255, 0.6)"`
- [ ] **Shared Utilities:** Uses `calculateGridLayout` and `sortButtonsAlphabetically` from gridUtils
- [ ] **Button Management:** Has `getCurrentButtons()` function with switch cases
- [ ] **CSS Classes:** All classes use correct 5-digit format (A-{5-digit-code}-...)
- [ ] **State Buttons:** Has Agents, Upserts, and Workspace state buttons
- [ ] **Initial State:** Uses `useState(null)` to prevent flash
- [ ] **Conditional Rendering:** Grid only renders when `currentState` is set

---

## Files Audited

All 47 discipline pages were audited. The complete detailed report with per-page analysis is available at:

📄 `docs/schema/reports/discipline-pages-grid-positioning-audit-v2.md`

---

**End of Report**