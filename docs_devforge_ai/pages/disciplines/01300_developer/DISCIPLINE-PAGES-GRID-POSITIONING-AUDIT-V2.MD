# Grid Positioning Audit Report
**Generated:** 2026-02-06T11:46:11.957Z

**Note:** This audit checks main page files ({code}-{name}-page.js) only, excluding backup files.

## Summary

- **Total Pages Audited:** 47
- **Compliant:** 0
- **Non-Compliant:** 47
- **Missing:** 0
- **Errors:** 0

- **Compliance Rate:** 0.0%

## ❌ Non-Compliant Pages (47)

### 00825 - Architectural
**File:** `/client/src/pages/00825-architectural/components/00825-architectural-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00825-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00825-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 00880 - Board Of Directors
**File:** `/client/src/pages/00880-board-of-directors/components/00880-board-of-directors-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00880-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00880-nav-row
- ✅ Button container uses correct 5-digit class: A-00880-button-container
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 00835 - Chemical Engineering
**File:** `/client/src/pages/00835-chemical-engineering/components/00835-chemical-engineering-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00835-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00835-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 00850 - Civil Engineering
**File:** `/client/src/pages/00850-civil-engineering/components/00850-civil-engineering-page.js`

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00850-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00850-nav-row
- ✅ Button container uses correct 5-digit class: A-00850-button-container
- ✅ Uses useState(null) to prevent grid flash

### 00300 - Construction
**File:** `/client/src/pages/00300-construction/components/00300-construction-page.js`

**Issues (Must Fix):**
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
- ✅ Button container uses correct 5-digit class: A-00300-button-container
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 00400 - Contracts
**File:** `/client/src/pages/00400-contracts/components/00400-contracts-page.js`

**Issues (Must Fix):**
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
- ✅ Button container uses correct 5-digit class: A-00400-button-container
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 00435 - Contracts Post Award
**File:** `/client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
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
- ✅ Button container uses correct 5-digit class: A-00435-button-container

### 00425 - Contracts Pre Award
**File:** `/client/src/pages/00425-contracts-pre-award/components/00425-contracts-pre-award-page.js`

**Issues (Must Fix):**
- ❌ Nav row uses incorrect digit count: A-0425-nav-row (expected 5 digits)
- ❌ CRITICAL: Button container uses incorrect digit count: A-0425-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0425-nav-row (should be 5 digits)

**Warnings (Should Review):**
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

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
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

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
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
- ✅ Button container uses correct 5-digit class: A-00872-button-container
- ✅ Conditionally renders grid based on currentState

### 00882 - Director Construction
**File:** `/client/src/pages/00882-director-construction/components/00882-director-construction-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-088-nav-row (expected 5 digits)
- ❌ CRITICAL: Button container uses incorrect digit count: A-088-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 3-digit class: A-088-nav-row (should be 5 digits)

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00882-navigation-container

### 00883 - Director Contracts
**File:** `/client/src/pages/00883-director-contracts/components/00883-director-contracts-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Button container uses incorrect digit count: A-0883-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0883-button-container (should be 5 digits)

**Warnings (Should Review):**
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
**File:** `/client/src/pages/00884-director-engineering/components/00884-director-engineering-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00884-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00884-nav-row

### 00889 - Director Finance
**File:** `/client/src/pages/00889-director-finance/components/00889-director-finance-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No nav row class found
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00889-navigation-container

### 00885 - Director Hse
**File:** `/client/src/pages/00885-director-hse/components/00885-director-hse-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Button container uses incorrect digit count: A-0885-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0885-button-container (should be 5 digits)

**Warnings (Should Review):**
- ⚠️ Grid may not be vertically centered at 50%
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00885-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00885-nav-row

### 00886 - Director Logistics
**File:** `/client/src/pages/00886-director-logistics/components/00886-director-logistics-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Button container uses incorrect digit count: A-0886-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0886-button-container (should be 5 digits)

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00886-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00886-nav-row

### 00888 - Director Procurement
**File:** `/client/src/pages/00888-director-procurement/components/00888-director-procurement-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00888-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00888-nav-row

### 00895 - Director Project
**File:** `/client/src/pages/00895-director-project/components/00895-director-project-page.js`

**Issues (Must Fix):**
- ❌ Missing getCurrentButtons function
- ❌ Nav row uses incorrect digit count: A-089-nav-row (expected 5 digits)
- ❌ CRITICAL: Button container uses incorrect digit count: A-089-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 3-digit class: A-089-nav-row (should be 5 digits)

**Warnings (Should Review):**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00895-navigation-container
- ✅ Uses useState(null) to prevent grid flash

### 00890 - Director Projects
**File:** `/client/src/pages/00890-director-projects/components/00890-director-projects-page.js`

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00890-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00890-nav-row
- ✅ Button container uses correct 5-digit class: A-00890-button-container

### 00876 - Directors
**File:** `/client/src/pages/00876-directors/components/00876-directors-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00876-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00876-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 00860 - Electrical Engineering
**File:** `/client/src/pages/00860-electrical-engineering/components/00860-electrical-engineering-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00860-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00860-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 01000 - Environmental
**File:** `/client/src/pages/01000-environmental/components/01000-environmental-page.js`

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-01000-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01000-nav-row
- ✅ Button container uses correct 5-digit class: A-01000-button-container

### 01100 - Ethics
**File:** `/client/src/pages/01100-ethics/components/01100-ethics-page.js`

**Issues (Must Fix):**
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
- ✅ Navigation container uses correct 5-digit class: A-01100-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01100-nav-row
- ✅ Button container uses correct 5-digit class: A-01100-button-container
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 01200 - Finance
**File:** `/client/src/pages/01200-finance/components/01200-finance-page.js`

**Issues (Must Fix):**
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
- ✅ Navigation container uses correct 5-digit class: A-01200-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01200-nav-row
- ✅ Button container uses correct 5-digit class: A-01200-button-container
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 00855 - Geotechnical Engineering
**File:** `/client/src/pages/00855-geotechnical-engineering/components/00855-geotechnical-engineering-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Button container uses incorrect digit count: A-0855-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0855-button-container (should be 5 digits)

**Warnings (Should Review):**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00855-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00855-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 01300 - Governance
**File:** `/client/src/pages/01300-governance/components/01300-governance-page.js`

**Issues (Must Fix):**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-01300-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01300-nav-row
- ✅ Button container uses correct 5-digit class: A-01300-button-container
- ✅ Conditionally renders grid based on currentState

### 01400 - Health
**File:** `/client/src/pages/01400-health/components/01400-health-page.js`

**Issues (Must Fix):**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-01400-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01400-nav-row
- ✅ Button container uses correct 5-digit class: A-01400-button-container
- ✅ Conditionally renders grid based on currentState

### 01500 - Human Resources
**File:** `/client/src/pages/01500-human-resources/components/01500-human-resources-page.js`

**Issues (Must Fix):**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-01500-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01500-nav-row
- ✅ Button container uses correct 5-digit class: A-01500-button-container
- ✅ Conditionally renders grid based on currentState

### 02075 - Inspection
**File:** `/client/src/pages/02075-inspection/components/02075-inspection-page.js`

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No navigation container class found

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Nav row uses correct 5-digit class: A-02075-nav-row
- ✅ Button container uses correct 5-digit class: A-02075-button-container
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 03000 - Landscaping
**File:** `/client/src/pages/03000-landscaping/components/03000-landscaping-page.js`

**Issues (Must Fix):**
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
- ✅ Button container uses correct 5-digit class: A-03000-button-container
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 01750 - Legal
**File:** `/client/src/pages/01750-legal/components/01750-legal-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01750-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01750-nav-row

### 01600 - Local Content
**File:** `/client/src/pages/01600-local-content/components/01600-local-content-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01600-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01600-nav-row

### 01700 - Logistics
**File:** `/client/src/pages/01700-logistics/components/01700-logistics-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
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
**File:** `/client/src/pages/00870-mechanical-engineering/components/00870-mechanical-engineering-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-00870-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00870-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 01800 - Operations
**File:** `/client/src/pages/01800-operations/components/01800-operations-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-01800-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01800-nav-row

### 01850 - Other Parties
**File:** `/client/src/pages/01850-other-parties/components/01850-other-parties-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
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

### 00871 - Process Engineering
**File:** `/client/src/pages/00871-process-engineering/components/00871-process-engineering-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Button container uses incorrect digit count: A-0871-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-0871-button-container (should be 5 digits)

**Warnings (Should Review):**
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
**File:** `/client/src/pages/01900-procurement/components/01900-procurement-page.js`

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-01900-navigation-container
- ✅ Nav row uses correct 5-digit class: A-01900-nav-row
- ✅ Button container uses correct 5-digit class: A-01900-button-container
- ✅ Uses useState(null) to prevent grid flash

### 02000 - Project Controls
**File:** `/client/src/pages/02000-project-controls/components/02000-project-controls-page.js`

**Issues (Must Fix):**
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No nav row class found
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Has opaque background rgba(255, 255, 255, 0.6)
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-02000-navigation-container
- ✅ Button container uses correct 5-digit class: A-02000-button-container
- ✅ Conditionally renders grid based on currentState

### 02100 - Public Relations
**File:** `/client/src/pages/02100-public-relations/components/02100-public-relations-page.js`

**Issues (Must Fix):**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-02100-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02100-nav-row
- ✅ Button container uses correct 5-digit class: A-02100-button-container
- ✅ Conditionally renders grid based on currentState

### 02200 - Quality Assurance
**File:** `/client/src/pages/02200-quality-assurance/components/02200-quality-assurance-page.js`

**Issues (Must Fix):**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-02200-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02200-nav-row
- ✅ Button container uses correct 5-digit class: A-02200-button-container
- ✅ Has Agents state button
- ✅ Has Upserts state button
- ✅ Has Workspace state button
- ✅ Uses useState(null) to prevent grid flash
- ✅ Conditionally renders grid based on currentState

### 02250 - Quality Control
**File:** `/client/src/pages/02250-quality-control/components/02250-quality-control-page.js`

**Issues (Must Fix):**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No nav row class found
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-02250-navigation-container
- ✅ Button container uses correct 5-digit class: A-02250-button-container
- ✅ Conditionally renders grid based on currentState

### 02025 - Quantity Surveying
**File:** `/client/src/pages/02025-quantity-surveying/components/02025-quantity-surveying-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-02025-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02025-nav-row

### 02400 - Safety
**File:** `/client/src/pages/02400-safety/components/02400-safety-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Grid centered at top: 50%, left: 50% with transform
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Navigation container uses correct 5-digit class: A-02400-navigation-container
- ✅ Nav row uses correct 5-digit class: A-02400-nav-row
- ✅ Uses useState(null) to prevent grid flash

### 02035 - Scheduling
**File:** `/client/src/pages/02035-scheduling/components/02035-scheduling-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Does not use calculateGridLayout shared utility
- ❌ Does not use sortButtonsAlphabetically shared utility
- ❌ Missing getCurrentButtons function
- ❌ CRITICAL: Button container uses incorrect digit count: A-2035-button-container (expected 5 digits)
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button
- ❌ CRITICAL: Uses incorrect 4-digit class: A-2035-button-container (should be 5 digits)

**Warnings (Should Review):**
- ⚠️ Cannot determine grid positioning
- ⚠️ No nav row class found
- ⚠️ Uses useState("agents") which may cause grid flash on load
- ⚠️ May not conditionally render grid container

**Correct Patterns:**
- ✅ Navigation container uses correct 5-digit class: A-02035-navigation-container

### 02500 - Security
**File:** `/client/src/pages/02500-security/components/02500-security-page.js`

**Issues (Must Fix):**
- ❌ Missing or incorrect opaque background
- ❌ Missing getCurrentButtons function
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ No button container class found
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

**Issues (Must Fix):**
- ❌ Grid positioned at top: 60% instead of top: 50%
- ❌ Missing or incorrect opaque background
- ❌ Missing Agents state button
- ❌ Missing Upserts state button
- ❌ Missing Workspace state button

**Warnings (Should Review):**
- ⚠️ Uses useState("agents") which may cause grid flash on load

**Correct Patterns:**
- ✅ Uses position: fixed for viewport centering
- ✅ Uses calculateGridLayout from gridUtils
- ✅ Uses sortButtonsAlphabetically from gridUtils
- ✅ Has getCurrentButtons function
- ✅ Navigation container uses correct 5-digit class: A-00877-navigation-container
- ✅ Nav row uses correct 5-digit class: A-00877-nav-row
- ✅ Button container uses correct 5-digit class: A-00877-button-container
- ✅ Conditionally renders grid based on currentState

## Priority Fix List

Pages requiring immediate attention (sorted by issue count):

| Priority | Code | Name | Issues | Warnings |
|----------|------|------|--------|----------|
| 1 | 02035 | Scheduling | 9 | 4 |
| 2 | 00882 | Director Construction | 7 | 2 |
| 3 | 00883 | Director Contracts | 7 | 3 |
| 4 | 00895 | Director Project | 7 | 1 |
| 5 | 00855 | Geotechnical Engineering | 7 | 1 |
| 6 | 00871 | Process Engineering | 7 | 2 |
| 7 | 00425 | Contracts Pre Award | 6 | 1 |
| 8 | 00885 | Director Hse | 6 | 3 |
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
| 26 | 00825 | Architectural | 4 | 2 |
| 27 | 00880 | Board Of Directors | 4 | 0 |
| 28 | 00835 | Chemical Engineering | 4 | 2 |
| 29 | 00800 | Design | 4 | 3 |
| 30 | 00884 | Director Engineering | 4 | 3 |
| 31 | 00889 | Director Finance | 4 | 4 |
| 32 | 00888 | Director Procurement | 4 | 3 |
| 33 | 00850 | Civil Engineering | 3 | 1 |
| 34 | 00300 | Construction | 3 | 0 |
| 35 | 00400 | Contracts | 3 | 0 |
| 36 | 00435 | Contracts Post Award | 3 | 2 |
| 37 | 00872 | Developer | 3 | 1 |
| 38 | 00890 | Director Projects | 3 | 2 |
| 39 | 01000 | Environmental | 3 | 2 |
| 40 | 01100 | Ethics | 3 | 0 |
| 41 | 01200 | Finance | 3 | 0 |
| 42 | 02075 | Inspection | 3 | 1 |
| 43 | 03000 | Landscaping | 3 | 0 |
| 44 | 01900 | Procurement | 3 | 1 |
| 45 | 02000 | Project Controls | 3 | 2 |
| 46 | 01850 | Other Parties | 2 | 3 |
| 47 | 02200 | Quality Assurance | 2 | 0 |

## Common Issues Summary

| Issue | Count |
|-------|-------|
| Missing Agents state button | 45 |
| Missing Upserts state button | 45 |
| Missing Workspace state button | 45 |
| Missing getCurrentButtons function | 26 |
| Missing or incorrect opaque background | 22 |
| Grid positioned at top: 60% instead of top: 50% | 7 |
| Nav row uses incorrect digit count: A-0425-nav-row (expected 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-0425-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 4-digit class: A-0425-nav-row (should be 5 digits) | 1 |
| Nav row uses incorrect digit count: A-088-nav-row (expected 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-088-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 3-digit class: A-088-nav-row (should be 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-0883-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 4-digit class: A-0883-button-container (should be 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-0885-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 4-digit class: A-0885-button-container (should be 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-0886-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 4-digit class: A-0886-button-container (should be 5 digits) | 1 |
| Nav row uses incorrect digit count: A-089-nav-row (expected 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-089-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 3-digit class: A-089-nav-row (should be 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-0855-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 4-digit class: A-0855-button-container (should be 5 digits) | 1 |
| CRITICAL: Button container uses incorrect digit count: A-0871-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 4-digit class: A-0871-button-container (should be 5 digits) | 1 |
| Does not use calculateGridLayout shared utility | 1 |
| Does not use sortButtonsAlphabetically shared utility | 1 |
| CRITICAL: Button container uses incorrect digit count: A-2035-button-container (expected 5 digits) | 1 |
| CRITICAL: Uses incorrect 4-digit class: A-2035-button-container (should be 5 digits) | 1 |
