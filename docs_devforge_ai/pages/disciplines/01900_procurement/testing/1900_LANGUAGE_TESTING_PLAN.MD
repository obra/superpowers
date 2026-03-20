# Test Plan: 01900 Discipline Page & Multi-Language Support

## Executive Summary

This test plan covers:
1. **Language Expansion**: Adding Finnish (fi) and Swedish (sv) to existing i18n infrastructure
2. **UI Component Testing**: Button clicks, modal functionality, dropdown validation
3. **Accessibility & Performance Testing**: Comprehensive validation suite

---

## Part 1: Language Support Expansion

### 1.1 Current State Analysis

**Existing Languages** (in `client/src/common/js/config/00200-i18n-config.js`):
```javascript
supportedLngs: ["en", "pt", "es", "fr", "ar", "zu", "xh", "sw", "de"]
```

**Existing Translation Directories**:
```
client/public/locales/
├── ar/   (Arabic)
├── de/   (German)
├── en/   (English)
├── es/   (Spanish)
├── fr/   (French)
├── pt/   (Portuguese)
├── sw/   (Swahili)
├── xh/   (Xhosa)
└── zu/   (Zulu)
```

### 1.2 Required Changes for Finnish & Swedish

#### Step 1: Update i18n Configuration
**File**: `client/src/common/js/config/00200-i18n-config.js`

```javascript
// Change supportedLngs array to:
supportedLngs: ["en", "pt", "es", "fr", "ar", "zu", "xh", "sw", "de", "fi", "sv"]
```

#### Step 2: Create Translation Directories
```
client/public/locales/
├── fi/   (Finnish - NEW)
└── sv/   (Swedish - NEW)
```

#### Step 3: Create Translation Files
Each language directory needs:
- `0165-ui-settings.json` (UI Settings namespace)
- `0200-accordion.json` (Accordion namespace)

### 1.3 Translation Test Cases

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| LANG-01 | Switch to Finnish (fi) | UI displays Finnish translations |
| LANG-02 | Switch to Swedish (sv) | UI displays Swedish translations |
| LANG-03 | Fallback to English when translation missing | English text displays |
| LANG-04 | Language persists after page refresh | Selected language loads correctly |
| LANG-05 | RTL languages still work (Arabic) | Arabic displays right-to-left |

---

## Part 2: UI Component Testing (01900 Procurement Page)

### 2.1 Button Click Events

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| BTN-01 | Click "Correspondence Reply" button | Modal opens or action starts |
| BTN-02 | Click "Create Tender" button | AddTenderModal opens |
| BTN-03 | Click "Supplier Analysis" button | SupplierAnalysisModal opens |
| BTN-04 | Click "Contract Review" button | Modal opens or action starts |
| BTN-05 | Click "Add Procurement Order" button | Modal opens |
| BTN-06 | Click "Update Contract" button | Modal opens |
| BTN-07 | Click "Create Purchase Order" button | Modal opens |
| BTN-08 | Click "Edit Supplier" button | Modal opens |
| BTN-09 | Click "Project Documents" button | Modal opens |
| BTN-10 | Click "Minutes Compilation" button | Modal opens |
| BTN-11 | Click "Budget Tracking" button | Modal opens |

### 2.2 Modal Functionality Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| MODAL-01 | Modal opens within 2 seconds | Performance SLA met |
| MODAL-02 | Modal has proper title | Title matches button action |
| MODAL-03 | Modal has close button | Close button works |
| MODAL-04 | Click outside modal closes it | Backdrop click works |
| MODAL-05 | ESC key closes modal | Keyboard navigation works |
| MODAL-06 | Modal form fields are editable | Input fields accept data |
| MODAL-07 | Modal has submit button | Submit action triggers |
| MODAL-08 | Modal has cancel button | Cancel action works |

### 2.3 Dropdown Functionality Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| DROP-01 | Dropdown shows options when clicked | Options list displays |
| DROP-02 | Dropdown has data (not empty) | At least one option available |
| DROP-03 | Dropdown search/filter works | Can find specific option |
| DROP-04 | Dropdown selection updates value | Selected value persists |
| DROP-05 | Dropdown supports keyboard navigation | Arrow keys work |

### 2.4 Form Validation Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| FORM-01 | Required field validation | Error shows when empty |
| FORM-02 | Email format validation | Invalid email rejected |
| FORM-03 | Numeric field validation | Non-numeric input rejected |
| FORM-04 | Character limit enforced | Max length respected |
| FORM-05 | Form submission with valid data | Success message shown |

---

## Part 3: Accessibility Testing

### 3.1 WCAG Compliance Tests

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| A11Y-01 | All buttons have accessible names | Screen reader can identify |
| A11Y-02 | Modal has focus trap | Focus stays within modal |
| A11Y-03 | Tab order is logical | Navigation flows correctly |
| A11Y-04 | Color contrast meets WCAG AA | 4.5:1 ratio for text |
| A11Y-05 | Error messages are descriptive | Clear error guidance |
| A11Y-06 | Form labels are associated | Label + input properly linked |
| A11Y-07 | Keyboard can activate all buttons | Tab + Enter works |
| A11Y-08 | Skip links present | Can skip to main content |

### 3.2 Keyboard Navigation

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| KEY-01 | Tab navigates forward | Focus moves forward |
| KEY-02 | Shift+Tab navigates backward | Focus moves backward |
| KEY-03 | Enter activates buttons | Button triggers action |
| KEY-04 | Space activates buttons | Button triggers action |
| KEY-05 | Escape closes modals | Modal dismisses |

---

## Part 4: Performance Testing

| Test ID | Test Case | Expected Result |
|---------|-----------|------------------|
| PERF-01 | Page initial load | < 3 seconds |
| PERF-02 | Button click response | < 500ms |
| PERF-03 | Modal open time | < 2 seconds |
| PERF-04 | Dropdown population | < 1 second |
| PERF-05 | Language switch | < 2 seconds |

---

## Part 5: Cross-Browser Testing

| Browser | Version | Test Scope |
|---------|---------|------------|
| Chrome | Latest | Full |
| Firefox | Latest | Full |
| Safari | Latest | Full |
| Edge | Latest | Full |
| Mobile Chrome | Latest | Touch events |
| Mobile Safari | Latest | Touch events |

---

## Part 6: Test Execution Strategy

### Phase 1: Language Infrastructure (Priority: HIGH)
1. Add Finnish and Swedish to config
2. Create translation directory structure
3. Copy English translation files as templates
4. Verify i18n loads new languages

### Phase 2: UI Component Testing (Priority: HIGH)
1. Run button click tests
2. Verify modal functionality
3. Test dropdown data presence

### Phase 3: Accessibility & Performance (Priority: MEDIUM)
1. Run accessibility audit
2. Performance benchmarking
3. Cross-browser validation

---

## How to Execute Tests & Download Results

### Option 1: Via Agent Operations Center
1. Navigate to: http://localhost:3060/#/agent-operations-center
2. Go to **Discipline Tests** tab
3. Select discipline: **01900** (Procurement)
4. Select test type (e.g., "UI Buttons Analysis" or "UI Configuration Validation")
5. Click **Run Tests**
6. After tests complete, use the **Export buttons** to download results:
   - **💾 Export Results** - Downloads JSON file with full test data
   - **💾 Export TXT** - Downloads human-readable text report

### Option 3: Via Debug Pipeline
1. Navigate to: http://localhost:3060/#/agent-operations-center
2. Go to **Debug Pipeline** tab
3. Select discipline: **01900**
4. Add agents:
   - UI Config Validator
   - Agent Validator
5. Run pipeline
6. Results are displayed in the Pipeline Results section

### Option 4: Via Python Script
```python
from deep_agents.agents.shared.ai_it_specialists.a_0000_ui_configuration_validator import run_functional_tests

# Test 01900 discipline
result = await run_functional_tests(discipline="01900")

# Test all disciplines
result = await run_functional_tests(discipline="all")
```

---

## Expected Deliverables

1. ✅ Finnish (fi) language fully functional
2. ✅ Swedish (sv) language fully functional  
3. ✅ All 11 buttons on 01900 page have click events
4. ✅ All modals open correctly
5. ✅ Dropdowns function with data
6. ✅ Accessibility score > 90%
7. ✅ Performance targets met
8. ✅ Test report generated

---

## Notes

- Current issues identified in button analysis:
  - "Correspondence Reply" - Missing trigger
  - "Contract Review" - Missing trigger
  - "Create Purchase Order" - Invalid modal config
  - "Minutes Compilation" - Invalid modal config

These issues should be fixed before final testing.
