# Grid Positioning Audit Report
**Generated:** 2026-02-06T11:42:19.068Z

## Summary

- **Total Pages Audited:** 47
- **Compliant:** 0
- **Non-Compliant:** 47
- **Missing:** 0
- **Errors:** 0

## ❌ Non-Compliant Pages (47)

### 00825 - Architectural
**File:** `/client/src/pages/00825-architectural/components/00825-architectural-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0825-button-container (should be 5 digits)

**Warnings:**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00825-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00825-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 00880 - Board of Directors
**File:** `/client/src/pages/00880-board-of-directors/components/00880-board-of-directors-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0880-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00880-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00880-nav-row

### 00835 - Chemical Engineering
**File:** `/client/src/pages/00835-chemical-engineering/components/00835-chemical-engineering-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0835-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00835-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00835-nav-row

### 00850 - Civil Engineering
**File:** `/client/src/pages/00850-civil-engineering/components/00850-civil-engineering-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0850-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00850-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00850-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 00300 - Construction
**File:** `/client/src/pages/00300-construction/components/00300-construction-page.js`

**Issues:**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00300-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00300-nav-row
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 00400 - Contracts
**File:** `/client/src/pages/00400-contracts/components/00400-contracts-page.js`

**Issues:**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00400-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00400-nav-row
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 00435 - Contracts Post Award
**File:** `/client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`

**Issues:**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00435-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00435-nav-row

### 00425 - Contracts Pre Award
**File:** `/client/src/pages/00425-contracts-pre-award/components/00425-contracts-pre-award-page.js`

**Issues:**
- ❌ Nav row uses incorrect digit count: A-0425-nav-row (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0425-nav-row (should be 5 digits)

**Warnings:**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00425-navigation-container
- ✅ Uses useState(null) to prevent grid flash

### 00800 - Design
**File:** `/client/src/pages/00800-design/components/00800-design-page.js`

**Issues:**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00800-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00800-nav-row

### 00872 - Developer
**File:** `/client/src/pages/00872-developer/components/00872-developer-page.js`

**Issues:**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00872-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00872-nav-row
- ✅ Conditionally renders grid based on currentState

### 00882 - Director Construction
**File:** `/client/src/pages/00882-director-construction/components/00882-director-construction-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-088-nav-row (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00882-navigation-container

### 00883 - Director Contracts
**File:** `/client/src/pages/00883-director-contracts/components/00883-director-contracts-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0883-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00883-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00883-nav-row

### 00884 - Director Engineering
**File:** `/client/src/pages/00884-director-engineering/components/00884-director-engineering-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0884-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00884-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00884-nav-row

### 00889 - Director Finance
**File:** `/client/src/pages/00889-director-finance/components/00889-director-finance-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00889-navigation-container

### 00885 - Director HSE
**File:** `/client/src/pages/00885-director-hse/components/00885-director-hse-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0885-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00885-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00885-nav-row

### 00886 - Director Logistics
**File:** `/client/src/pages/00886-director-logistics/components/00886-director-logistics-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0886-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00886-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00886-nav-row

### 00888 - Director Procurement
**File:** `/client/src/pages/00888-director-procurement/components/00888-director-procurement-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00888-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00888-nav-row

### 00895 - Director Project
**File:** `/client/src/pages/00895-director-project/components/00895-director-project-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-089-nav-row (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00895-navigation-container

### 00890 - Director Projects
**File:** `/client/src/pages/00890-director-projects/components/00890-director-projects-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00890-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00890-nav-row

### 00876 - Directors
**File:** `/client/src/pages/00876-directors/components/00876-directors-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0876-button-container (should be 5 digits)

**Warnings:**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00876-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00876-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 00860 - Electrical Engineering
**File:** `/client/src/pages/00860-electrical-engineering/components/00860-electrical-engineering-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-0860-nav-row (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0860-nav-row (should be 5 digits)

**Warnings:**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00860-navigation-container
- ✅ Uses useState(null) to prevent grid flash

### 01000 - Environmental
**File:** `/client/src/pages/01000-environmental/components/01000-AgentsView.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

### 01100 - Ethics
**File:** `/client/src/pages/01100-ethics/components/01100-ethics-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-1100-button-container (should be 5 digits)

**Warnings:**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01100-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01100-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 01200 - Finance
**File:** `/client/src/pages/01200-finance/components/01200-finance-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-2400-nav-row (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-2400-nav-row (should be 5 digits)

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01200-navigation-container

### 00855 - Geotechnical Engineering
**File:** `/client/src/pages/00855-geotechnical-engineering/components/00855-geotechnical-engineering-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0855-button-container (should be 5 digits)

**Warnings:**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00855-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00855-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 01300 - Governance
**File:** `/client/src/pages/01300-governance/components/01300-01-approval-matrix.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses useState(null) to prevent grid flash

### 01400 - Health
**File:** `/client/src/pages/01400-health/components/01400-health-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-140-nav-row (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01400-navigation-container

### 01500 - Human Resources
**File:** `/client/src/pages/01500-human-resources/components/01500-cv-processing-agent.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses useState(null) to prevent grid flash

### 02075 - Inspection
**File:** `/client/src/pages/02075-inspection/components/02075-inspection-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Upserts state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-2075-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-02075-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02075-nav-row
- ✅ Has Agents state button
- ✅ Has Workspace state button

### 03000 - Landscaping
**File:** `/client/src/pages/03000-landscaping/components/03000-landscaping-page.js`

**Issues:**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-03000-navigation-container
- ✅ Nav row uses correct 5-digit class: A-03000-nav-row
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 01750 - Legal
**File:** `/client/src/pages/01750-legal/components/01750-legal-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01750-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01750-nav-row
- ✅ Has Agents state button
- ✅ Has Upserts state button
- ✅ Has Workspace state button

### 01600 - Local Content
**File:** `/client/src/pages/01600-local-content/components/01600-local-content-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-1600-nav-row (expected 5 digits)
- ❌ Missing Upserts state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-1600-nav-row (should be 5 digits)

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01600-navigation-container
- ✅ Has Agents state button
- ✅ Has Workspace state button
- ✅ Uses useState(null) to prevent grid flash

### 01700 - Logistics
**File:** `/client/src/pages/01700-logistics/components/01700-logistics-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01700-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01700-nav-row

### 00870 - Mechanical Engineering
**File:** `/client/src/pages/00870-mechanical-engineering/components/00870-mechanical-engineering-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0870-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00870-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00870-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 01800 - Operations
**File:** `/client/src/pages/01800-operations/components/01800-fuel-lubricants-chatbot.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses useState(null) to prevent grid flash

### 01850 - Other Parties
**File:** `/client/src/pages/01850-other-parties/components/01850-other-parties-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function

**Warnings:**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01850-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01850-nav-row
- ✅ Has Agents state button
- ✅ Has Upserts state button
- ✅ Has Workspace state button
- ✅ Uses useState(null) to prevent grid flash

### 00871 - Process Engineering
**File:** `/client/src/pages/00871-process-engineering/components/00871-process-engineering-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0871-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00871-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00871-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 01900 - Procurement
**File:** `/client/src/pages/01900-procurement/components/01900-agent-orchestration-dashboard.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses useState(null) to prevent grid flash

### 02000 - Project Controls
**File:** `/client/src/pages/02000-project-controls/components/02000-project-controls-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Uses incorrect 4-digit class: A-2000-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-02000-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02000-nav-row
- ✅ Has Agents state button
- ✅ Has Upserts state button
- ✅ Has Workspace state button

### 02100 - Public Relations
**File:** `/client/src/pages/02100-public-relations/components/02100-public-relations-page.js`

**Issues:**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-02100-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02100-nav-row
- ✅ Conditionally renders grid based on currentState

### 02200 - Quality Assurance
**File:** `/client/src/pages/02200-agent-monitoring/components/AgentDashboardTab.jsx`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

### 02250 - Quality Control
**File:** `/client/src/pages/02250-quality-control/components/02250-quality-control-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Upserts state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-2250-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-02250-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02250-nav-row
- ✅ Has Agents state button
- ✅ Has Workspace state button
- ✅ Uses useState(null) to prevent grid flash

### 02025 - Quantity Surveying
**File:** `/client/src/pages/02025-quantity-surveying/components/02025-drawing-analysis-upload.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

### 02400 - Safety
**File:** `/client/src/pages/02400-safety/components/02400-safety-document-templates-page.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses useState(null) to prevent grid flash

### 02035 - Scheduling
**File:** `/client/src/pages/02035-scheduling/components/02035-scheduling-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Uses incorrect 4-digit class: A-2035-button-container (should be 5 digits)

**Warnings:**
- ⚠️ Cannot determine grid positioning
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-02035-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02035-nav-row
- ✅ Has Agents state button
- ✅ Has Upserts state button
- ✅ Has Workspace state button
- ✅ Uses useState(null) to prevent grid flash

### 02500 - Security
**File:** `/client/src/pages/02500-security/components/02500-security-page.backup.js`

**Issues:**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-02500-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02500-nav-row

### 00877 - Sundry
**File:** `/client/src/pages/00877-sundry/components/00877-sundry-page.js`

**Issues:**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings:**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00877-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00877-nav-row
- ✅ Conditionally renders grid based on currentState

## Priority Fix List

Pages requiring immediate attention (sorted by issue count):

| Priority | Code | Name | Issues | Warnings |
|----------|------|------|--------|----------|
| 1 | 00860 | Electrical Engineering | 7 | 1 |
| 2 | 01000 | Environmental | 7 | 2 |
| 3 | 01200 | Finance | 7 | 2 |
| 4 | 01300 | Governance | 7 | 2 |
| 5 | 01500 | Human Resources | 7 | 2 |
| 6 | 01800 | Operations | 7 | 2 |
| 7 | 01900 | Procurement | 7 | 2 |
| 8 | 02200 | Quality Assurance | 7 | 2 |
| 9 | 02025 | Quantity Surveying | 7 | 2 |
| 10 | 02400 | Safety | 7 | 2 |
| 11 | 00825 | Architectural | 6 | 1 |
| 12 | 00880 | Board of Directors | 6 | 3 |
| 13 | 00835 | Chemical Engineering | 6 | 2 |
| 14 | 00850 | Civil Engineering | 6 | 2 |
| 15 | 00882 | Director Construction | 6 | 2 |
| 16 | 00883 | Director Contracts | 6 | 3 |
| 17 | 00884 | Director Engineering | 6 | 3 |
| 18 | 00885 | Director HSE | 6 | 3 |
| 19 | 00886 | Director Logistics | 6 | 2 |
| 20 | 00895 | Director Project | 6 | 2 |
| 21 | 00876 | Directors | 6 | 1 |
| 22 | 01100 | Ethics | 6 | 1 |
| 23 | 00855 | Geotechnical Engineering | 6 | 1 |
| 24 | 01400 | Health | 6 | 2 |
| 25 | 00870 | Mechanical Engineering | 6 | 2 |
| 26 | 00871 | Process Engineering | 6 | 2 |
| 27 | 00425 | Contracts Pre Award | 5 | 1 |
| 28 | 00889 | Director Finance | 5 | 2 |
| 29 | 00888 | Director Procurement | 5 | 2 |
| 30 | 00890 | Director Projects | 5 | 2 |
| 31 | 01600 | Local Content | 5 | 2 |
| 32 | 01700 | Logistics | 5 | 2 |
| 33 | 02100 | Public Relations | 5 | 1 |
| 34 | 02500 | Security | 5 | 2 |
| 35 | 00877 | Sundry | 5 | 1 |
| 36 | 00800 | Design | 4 | 2 |
| 37 | 02075 | Inspection | 4 | 3 |
| 38 | 02250 | Quality Control | 4 | 2 |
| 39 | 00300 | Construction | 3 | 0 |
| 40 | 00400 | Contracts | 3 | 0 |
| 41 | 00435 | Contracts Post Award | 3 | 2 |
| 42 | 00872 | Developer | 3 | 1 |
| 43 | 03000 | Landscaping | 3 | 0 |
| 44 | 02000 | Project Controls | 3 | 3 |
| 45 | 02035 | Scheduling | 3 | 2 |
| 46 | 01750 | Legal | 2 | 2 |
| 47 | 01850 | Other Parties | 2 | 1 |
