# Comprehensive Prompt: Sharing 01900 Buttons and Modals to Other Discipline Pages

**Document ID**: `01900_SHARE_COMPONENTS_PROMPT.md`
**Created**: 2026-02-15
**Author**: AI Review
**Purpose**: Generate implementation prompt for sharing buttons and modals from the 01900 procurement page to other discipline pages

---

## Executive Summary

This document provides a comprehensive prompt for implementing **shared** buttons and modals from the **01900 Procurement** page to all other discipline pages in the Construct AI system.

### Key Implementation Approach: Modal Sharing via ModalProvider

The system uses a **shared modal component** approach:
1. Common modal components are registered in `ModalProvider` (`client/src/components/modal/context/00170-ModalProvider.js`)
2. Discipline pages use common modal IDs (e.g., `UpsertCloudModal`) without discipline prefixes
3. The `discipline` prop is passed when opening the modal to route data to the correct vector table

This means we are **sharing** modals from 01900 by using the common components - NOT by creating discipline-specific copies.

---

## 1. Source Page Analysis: 01900 Procurement

### 1.1 Page Structure

The 01900 Procurement page uses a **state-based navigation system** with three main states:

1. **Agents State** - Agent-related actions
2. **Upserts State** - Document import/upload functionality
3. **Workspace State** - Workspace and permission management

### 1.2 Buttons and Modals to Share

#### **EXCLUDED** (Procurement-specific functionality that should NOT be shared):
- ❌ `Create Procurement Order` - Uses 01900-ProcurementInputAgentModal (procurement-specific)
- ❌ `Contact Scraper` - Uses 01900-ContactScraperModal (procurement-specific)
- ❌ `Supplier Setup` - Uses 01900-SupplierSetupModal (procurement-specific)

#### **TO BE SHARED** (Buttons/Modals to replicate on other discipline pages):

| State | Button Label | Modal ID | Modal File | Purpose |
|-------|--------------|-----------|------------|---------|
| **Agents** | Correspondence Reply | `01900-03-CorrespondenceReplyModal` | `01900-03-CorrespondenceReplyModal.js` | Reply to correspondence |
| **Upserts** | Cloud Upsert | `01900-UpsertCloudModal` | `01900-UpsertCloudModal.jsx` | Import from cloud services |
| **Upserts** | Upsert from URL | `01900-UpsertUrlModal` | `01900-UpsertUrlModal.js` | Import from URL |
| **Upserts** | Upsert Files | `01900-UpsertFileModal` | `01900-UpsertFileModal.js` | Local file upload |
| **Workspace** | Access Permissions | `AccessPermissionVisualizerModal` | **Common Component** | Visualize permissions |
| **Workspace** | Cross-Discipline Sharing | `DisciplinePermissionMatrixModal` | **Common Component** | Share across disciplines |
| **Workspace** | Manage Workspaces | `WorkspaceManagementModal` | **Common Component** | Workspace management |
| **Workspace** | Vector Data Manager | `VectorDataManagerModal` | **Common Component** | Vector data management |

### 1.3 Current 01900 Button Configuration

```javascript
// Agents State Buttons
const agentsButtons = sortButtonsAlphabetically([
  {
    label: "Correspondence Reply",
    modalId: "01900-03-CorrespondenceReplyModal",
    modalTitle: "Procurement Correspondence Reply",
  },
  {
    label: "Create Procurement Order", // EXCLUDED
    modalId: "01900-ProcurementInputAgentModal",
    modalTitle: "Create Procurement Order via Agent",
  },
]);

// Upserts State Buttons
const upsertButtons = sortButtonsAlphabetically([
  {
    label: "Cloud Upsert",
    modalId: "01900-UpsertCloudModal",
    modalTitle: "Cloud Upsert",
  },
  {
    label: "Upsert from URL",
    modalId: "01900-UpsertUrlModal",
    modalTitle: "Upsert from URL",
  },
  {
    label: "Upsert Files",
    modalId: "01900-UpsertFileModal",
    modalTitle: "Upsert Files",
  },
]);

// Workspace State Buttons
const workspaceButtons = sortButtonsAlphabetically([
  {
    label: "Access Permissions",
    modalId: "AccessPermissionVisualizerModal",
    modalTitle: "Access Permission Visualizer",
  },
  {
    label: "Contact Scraper", // EXCLUDED
    modalId: "01900-ContactScraperModal",
    modalTitle: "Contact Scraper",
  },
  {
    label: "Cross-Discipline Sharing",
    modalId: "DisciplinePermissionMatrixModal",
    modalTitle: "Cross-Discipline Permissions",
  },
  {
    label: "Manage Workspaces",
    modalId: "WorkspaceManagementModal",
    modalTitle: "Manage Workspaces",
  },
  {
    label: "Supplier Setup", // EXCLUDED
    modalId: "01900-SupplierSetupModal",
    modalTitle: "Supplier Setup",
  },
  {
    label: "Vector Data Manager",
    modalId: "VectorDataManagerModal",
    modalTitle: "Vector Data Manager",
  },
]);
```

---

## 2. Target Discipline Pages

### 2.1 List of Discipline Pages to Update

The following discipline pages should receive the shared buttons and modals:

| Discipline Code | Page Name | Path | Current Status |
|----------------|-----------|------|----------------|
| 00300 | Construction | `client/src/pages/00300-construction/` | Has some shared components |
| 00400 | Contracts | `client/src/pages/00400-contracts/` | Needs update |
| 00425 | Contracts Pre-Award | `client/src/pages/00425-contracts-pre-award/` | Needs update |
| 00435 | Contracts Post-Award | `client/src/pages/00435-contracts-post-award/` | Needs update |
| 00800 | Design | `client/src/pages/00800-design/` | Has some shared components |
| 00825 | Architectural | `client/src/pages/00825-architectural/` | Needs update |
| 00835 | Chemical Engineering | `client/src/pages/00835-chemical-engineering/` | Needs update |
| 00850 | Civil Engineering | `client/src/pages/00850-civil-engineering/` | Needs update |
| 00855 | Geotechnical Engineering | `client/src/pages/00855-geotechnical-engineering/` | Needs update |
| 00860 | Electrical Engineering | `client/src/pages/00860-electrical-engineering/` | Needs update |
| 00870 | Mechanical Engineering | `client/src/pages/00870-mechanical-engineering/` | Needs update |
| 00871 | Process Engineering | `client/src/pages/00871-process-engineering/` | Has some shared components |
| 00872 | Developer | `client/src/pages/00872-developer/` | Needs update |
| 00875 | Sales | `client/src/pages/00875-sales/` | Needs update |
| 00876 | Directors | `client/src/pages/00876-directors/` | Needs update |
| 00877 | Sundry | `client/src/pages/00877-sundry/` | Needs update |
| 00880 | Board of Directors | `client/src/pages/00880-board-of-directors/` | Has some shared components |
| 00882 | Director Construction | `client/src/pages/00882-director-construction/` | Needs update |
| 00883 | Director Contracts | `client/src/pages/00883-director-contracts/` | Needs update |
| 00884 | Director Engineering | `client/src/pages/00884-director-engineering/` | Needs update |
| 00885 | Director HSE | `client/src/pages/00885-director-hse/` | Needs update |
| 00886 | Director Logistics | `client/src/pages/00886-director-logistics/` | Needs update |
| 00888 | Director Procurement | `client/src/pages/00888-director-procurement/` | Needs update |
| 00889 | Director Finance | `client/src/pages/00889-director-finance/` | Has some shared components |
| 00890 | Director Projects | `client/src/pages/00890-director-projects/` | Needs update |
| 00895 | Director Project | `client/src/pages/00895-director-project/` | Needs update |
| 00900 | Document Control | `client/src/pages/00900-document-control/` | Needs update |
| 01000 | Environmental | `client/src/pages/01000-environmental/` | Needs update |
| 01100 | Ethics | `client/src/pages/01100-ethics/` | Needs update |
| 01200 | Finance | `client/src/pages/01200-finance/` | Needs update |
| 01300 | Governance | `client/src/pages/01300-governance/` | Needs update |
| 01400 | Health | `client/src/pages/01400-health/` | Needs update |
| 01500 | Human Resources | `client/src/pages/01500-human-resources/` | Needs update |
| 01600 | Local Content | `client/src/pages/01600-local-content/` | Needs update |
| 01700 | Logistics | `client/src/pages/01700-logistics/` | Has some shared components |
| 01750 | Legal | `client/src/pages/01750-legal/` | Needs update |
| 01800 | Operations | `client/src/pages/01800-operations/` | Needs update |
| 01850 | Other Parties | `client/src/pages/01850-other-parties/` | Needs update |
| 02000 | Project Controls | `client/src/pages/02000-project-controls/` | Needs update |
| 02035 | Scheduling | `client/src/pages/02035-scheduling/` | Needs update |
| 02075 | Inspection | `client/src/pages/02075-inspection/` | Needs update |
| 02076 | Quality Assurance | `client/src/pages/02076-quality-assurance/` | Needs update |
| 02100 | Public Relations | `client/src/pages/02100-public-relations/` | Needs update |
| 02250 | Quality Control | `client/src/pages/02250-quality-control/` | Has some shared components |
| 02400 | Safety | `client/src/pages/02400-safety/` | Needs update |
| 02400 | Safety Performance | `client/src/pages/02400-safety-performance/` | Needs update |
| 03000 | Landscaping | `client/src/pages/03000-landscaping/` | Needs update |

---

## 3. Implementation Requirements

### 3.1 Modal Registration in ModalProvider

The key to sharing modals is registering them in the **ModalProvider**. This allows all disciplines to use common modal IDs without creating discipline-specific copies.

**File**: `client/src/components/modal/context/00170-ModalProvider.js`

**Required Registration**:
```javascript
// --- Common Upsert Modals (shared across disciplines) ---
const UpsertCloudModal = safeImport(
  () => import("@common/components/templates/modals/UpsertCloudModal"),
  "UpsertCloudModal"
);
const UpsertFileModal = safeImport(
  () => import("@common/components/templates/modals/UpsertFileModal"),
  "UpsertFileModal"
);
const UpsertUrlModal = safeImport(
  () => import("@common/components/templates/modals/UpsertUrlModal"),
  "UpsertUrlModal"
);

// Add to managementModals registry:
const managementModals = {
  // ... other modals ...
  // Common Upsert Modals (shared across disciplines)
  UpsertCloudModal: UpsertCloudModal,
  UpsertFileModal: UpsertFileModal,
  UpsertUrlModal: UpsertUrlModal,
};
```

**How it works**:
1. The common modal components are registered in ModalProvider's `managementModals` object
2. Discipline pages use common modal IDs (e.g., `UpsertCloudModal`) without prefixes
3. When opening a modal, pass the `discipline` prop to route data to the correct vector table
4. The common components support discipline routing via the `discipline` prop

### 3.2 Page Component Updates

#### 3.2.1 No Import Statements Required

Since we're using **shared modals** from ModalProvider, you don't need to import modal components in your discipline page. The ModalProvider handles rendering based on modal ID.

**What you need to do**:
1. Ensure the common modals are registered in `ModalProvider` (see section 3.1)
2. Use the `useModal` hook to open modals by ID
3. Pass the correct `discipline` prop to route data to the correct vector table

#### 3.2.2 Button Configuration

Update the button arrays to use the common component modal IDs (NOT discipline-specific IDs):

```javascript
// Agents State - Add Correspondence Reply
const agentsButtons = sortButtonsAlphabetically([
  {
    label: "Correspondence Reply",
    modalId: "CorrespondenceReplyModal",  // Use common component ID
    modalTitle: "{Discipline Name} Correspondence Reply",
  },
  // Add other agent buttons specific to discipline...
]);

// Upserts State - Use common component modal IDs
const upsertButtons = sortButtonsAlphabetically([
  {
    label: "Cloud Import",
    modalId: "UpsertCloudModal",  // NOT "00872-UpsertCloudModal" - use common component ID
    modalTitle: "Cloud Import",
  },
  {
    label: "Import from URL",
    modalId: "UpsertUrlModal",  // NOT "00872-UpsertUrlModal" - use common component ID
    modalTitle: "Import from URL",
  },
  {
    label: "Upload Files",
    modalId: "UpsertFileModal",  // NOT "00872-UpsertFileModal" - use common component ID
    modalTitle: "Upload Files",
  },
]);

// Workspace State - Use common components
const workspaceButtons = sortButtonsAlphabetically([
  {
    label: "Access Permissions",
    modalId: "AccessPermissionVisualizerModal",
    modalTitle: "Access Permission Visualizer",
  },
  {
    label: "Cross-Discipline Sharing",
    modalId: "DisciplinePermissionMatrixModal",
    modalTitle: "Cross-Discipline Permissions",
  },
  {
    label: "Manage Workspaces",
    modalId: "WorkspaceManagementModal",
    modalTitle: "Manage Workspaces",
  },
  {
    label: "Vector Data Manager",
    modalId: "VectorDataManagerModal",
    modalTitle: "Vector Data Manager",
  },
]);
```

> ⚠️ **IMPORTANT**: Use the common component modal IDs WITHOUT the discipline prefix (e.g., use `UpsertCloudModal` NOT `00872-UpsertCloudModal`). The ModalProvider uses these common IDs to load the shared modal components.

#### 3.2.3 Modal Opening Handler

Update the `handleOpenModal` function to pass correct props:

```javascript
const handleOpenModal = (modalId, modalProps = {}) => {
  // Set trigger page
  window.currentModalTriggerPage = modalProps.triggerPage;

  // Discipline-specific modals
  if (modalId === "DisciplinePermissionMatrixModal") {
    openModal(modalId, {
      currentDiscipline: DISCIPLINE_CODE,
      modalTitle: modalProps.modalTitle,
      triggerPage: `${DISCIPLINE_CODE}-${disciplineSlug}`,
    });
    return;
  }

  if (modalId === "VectorDataManagerModal" || modalId === "WorkspaceManagementModal") {
    openModal(modalId, {
      discipline: DISCIPLINE_CODE,
      modalTitle: modalProps.modalTitle,
      triggerPage: `${DISCIPLINE_CODE}-${disciplineSlug}`,
    });
    return;
  }

  if (modalId === "AccessPermissionVisualizerModal") {
    openModal(modalId, {
      discipline: DISCIPLINE_CODE,
      modalTitle: modalProps.modalTitle,
      triggerPage: `${DISCIPLINE_CODE}-${disciplineSlug}`,
    });
    return;
  }

  // For discipline-specific modals (upserts, correspondence)
  openModal(modalId, {
    disciplineCode: DISCIPLINE_CODE,
    vectorTable: `a_${DISCIPLINE_CODE}_${disciplineName}_vector`,
    modalTitle: modalProps.modalTitle,
    triggerPage: `${DISCIPLINE_CODE}-${disciplineSlug}`,
  });
};
```

---

## 4. Vector Table Requirements

### 4.1 Existing Vector Tables

The following discipline-specific vector tables should already exist:

| Discipline Code | Table Name | Status |
|-----------------|------------|--------|
| 01900 | `a_01900_procurement_vector` | ✅ Existing |
| 00300 | `a_00300_construction_vector` | ✅ May exist |
| 00435 | `a_00435_contracts_vector` | ✅ May exist |
| 00800 | `a_00800_design_vector` | ✅ May exist |
| 00850 | `a_00850_civil_engineering_vector` | ✅ May exist |
| 00871 | `a_00871_process_engineering_vector` | ✅ May exist |
| 01700 | `a_01700_logistics_vector` | ✅ May exist |

### 4.2 Creating Missing Vector Tables

For disciplines without vector tables, create using this template:

```sql
-- Create discipline-specific vector table
DO $$
DECLARE
    discipline_code TEXT := '{DISCIPLINE_CODE}';
    discipline_name TEXT := '{discipline_name}';
    table_name TEXT;
BEGIN
    table_name := 'a_' || discipline_code || '_' || discipline_name || '_vector';

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            embedding vector(1536),
            metadata jsonb,
            content text,
            created_by_user_id uuid,
            access_scope text DEFAULT ''private''::text,
            organisation_id uuid,
            shared_with_disciplines text,
            workspace_id uuid,
            workspace_type text,
            deleted_at timestamp with time zone,
            deleted_by uuid,
            deletion_reason text,
            scheduled_hard_delete_at timestamp with time zone,
            isolation_metadata jsonb DEFAULT ''{}''::jsonb,
            discipline_code text DEFAULT %L,
            chunks jsonb DEFAULT ''[]''::jsonb
        )', table_name, discipline_code);

    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

    -- Create access policy
    EXECUTE format('
        CREATE POLICY %I ON %I
        FOR ALL USING (
            organisation_id IN (
                SELECT organisation_id FROM active_entities WHERE user_id = auth.uid()
            )
            AND discipline_code = %L
        )', table_name || '_access_policy', table_name, discipline_code);

    RAISE NOTICE 'Created vector table: %', table_name;
END $$;
```

### 4.3 Upsert Procedure Customization

When documents are upserted through the modals, they must be stored in the **correct discipline-specific vector table**. This is handled by passing the correct `discipline_code` and `vector_table` parameters to the API.

**Key Parameters for Upsert**:
```javascript
{
  // Identifies which vector table to use
  disciplineCode: "00300",           // Must match target discipline
  vectorTable: "a_00300_construction_vector",  // Must match target table
  
  // Document metadata
  documentType: "contract",
  projectId: "uuid",
  projectPhaseId: "uuid",
  
  // Security
  accessScope: "private",
  isolationMetadata: {
    discipline_code: "00300",
    organization_id: "uuid"
  }
}
```

---

## 5. Implementation Checklist

### Phase 1: Prepare Modal Templates

- [ ] Create discipline-specific UpsertCloudModal template
- [ ] Create discipline-specific UpsertUrlModal template
- [ ] Create discipline-specific UpsertFileModal template
- [ ] Create discipline-specific CorrespondenceReplyModal template
- [ ] Verify common components (WorkspaceManagement, VectorDataManager, etc.) are accessible

### Phase 2: Update Each Discipline Page

For each target discipline page:

- [ ] Import new discipline-specific modals (if needed for custom modals)
- [ ] Update button configurations (agents, upserts, workspace)
- [ ] Update handleOpenModal function for discipline context
- [ ] Test modal opening/closing
- [ ] Test document upload to correct vector table

> ⚠️ **IMPORTANT: Do NOT render modal components in JSX**
> 
> The modal system uses a global ModalProvider that handles modal rendering. You should NOT import and render modal components directly in your page's JSX. Instead:
> 1. Use the `openModal(modalId, props)` function from the `useModal` hook to trigger modals
> 2. The ModalProvider automatically finds and renders the correct modal based on the modalId
> 3. Modal components are registered either in the static `managementModals` object or in the `generatedModalRegistry` from the database
>
> **Wrong approach (DO NOT DO THIS):**
> ```jsx
> // ❌ DON'T do this - will cause modals to auto-open!
> <UpsertFileModal modalId="00872-UpsertFileModal" />
> ```
>
> **Correct approach:**
> ```jsx
> // ✅ DO this - call openModal when button is clicked
> const { openModal } = useModal();
> 
> const handleButtonClick = () => {
>   openModal("00872-UpsertFileModal", {
>     modalTitle: "Upload Files",
>     triggerPage: "00872-developer"
>   });
> };
> ```

### Phase 2.1: Remove Advanced/Bulk Button (If Exists)

> ⚠️ **IMPORTANT**: Some discipline pages (e.g., 00872 Developer) may have an "Advanced/Bulk" button in the Upserts section that was not part of the 01900 standard. This button should be removed during the migration to maintain consistency.

**Steps to remove Advanced/Bulk button:**
1. Check if the target page has an "Advanced/Bulk" button in `upsertButtons` array
2. If found, remove it from the button configuration
3. Verify no modal component for "UpsertUnstructuredModal" is being used

**Example - Remove from upsertButtons:**
```javascript
// BEFORE (contains Advanced/Bulk - REMOVE this)
const upsertButtons = sortButtonsAlphabetically([
  {
    label: "Advanced/Bulk",  // ← REMOVE THIS ENTRY
    modalId: "UpsertUnstructuredModal",
    modalTitle: "Advanced/Bulk Processing",
  },
  {
    label: "Cloud Import",
    modalId: "00872-UpsertCloudModal",
    modalTitle: "Cloud Import",
  },
  // ... rest of buttons
]);

// AFTER (standard 01900 buttons only)
const upsertButtons = sortButtonsAlphabetically([
  {
    label: "Cloud Import",
    modalId: "00872-UpsertCloudModal",
    modalTitle: "Cloud Import",
  },
  {
    label: "Import from URL",
    modalId: "00872-UpsertUrlModal",
    modalTitle: "Import from URL",
  },
  {
    label: "Upload Files",
    modalId: "00872-UpsertFileModal",
    modalTitle: "Upload Files",
  },
]);
```

### Phase 3: Verify Vector Table Integration

- [ ] Verify vector table exists for each discipline
- [ ] Test upsert functionality stores to correct table
- [ ] Verify RLS policies are working
- [ ] Test cross-discipline sharing if applicable

### Phase 4: Common Components (VERIFIED - Already Implemented)

These common components are already available in the codebase and exported from `@common/components/templates/modals/index.js`:

**Location**: `client/src/common/components/templates/modals/`

**Verified Components**:
- [x] `WorkspaceManagementModal.jsx` - Located at `@common/components/templates/modals/`
- [x] `VectorDataManagerModal.jsx` - Located at `@common/components/templates/modals/`
- [x] `AccessPermissionVisualizerModal.jsx` - Located at `@common/components/templates/modals/`
- [x] `DisciplinePermissionMatrixModal.jsx` - Located at `@common/components/templates/modals/`
- [x] `UpsertFileModal.jsx` - Located at `@common/components/templates/modals/`
- [x] `UpsertCloudModal.jsx` - Located at `@common/components/templates/modals/`

**✅ VERIFIED: Common Components Support Discipline Routing**

The common components have been verified to accept a `discipline` prop that routes data to the correct vector table:

```javascript
// Example from UpsertCloudModal.jsx - line in source:
const discipline = modalProps?.discipline || "00435";
```

This means these components can be reused directly WITHOUT creating discipline-specific versions, as long as the correct `discipline` prop is passed when opening the modal.

**Import Pattern**:
```javascript
import {
  WorkspaceManagementModal,
  VectorDataManagerModal,
  AccessPermissionVisualizerModal,
  DisciplinePermissionMatrixModal,
  UpsertFileModal,
  UpsertCloudModal,
} from "@common/components/templates/modals";
```

**Key Point**: The modal handler MUST pass the correct `discipline` prop:
```javascript
openModal("UpsertCloudModal", {
  discipline: "00300",  // ← This routes to correct vector table
  modalTitle: "Cloud Upsert",
  triggerPage: "00300-construction"
});
```

---

## 6. Example Implementation: Construction Page (00300)

### 6.1 New Modal Files to Create

```
client/src/pages/00300-construction/components/modals/
├── 00300-UpsertCloudModal.js      # NEW - from 01900-UpsertCloudModal.jsx
├── 00300-UpsertUrlModal.js        # NEW - from 01900-UpsertUrlModal.js
├── 00300-UpsertFileModal.js      # NEW - from 01900-UpsertFileModal.js
└── 00300-CorrespondenceReplyModal.js  # NEW - from 01900-03-CorrespondenceReplyModal.js
```

### 6.2 Page Component Updates

**File**: `client/src/pages/00300-construction/components/00300-construction-page.js`

```javascript
// Note: Modal components are NOT imported - they are rendered globally by ModalProvider
// Use the useModal hook to open modals

import {
  WorkspaceManagementModal,
  VectorDataManagerModal,
  AccessPermissionVisualizerModal,
  DisciplinePermissionMatrixModal,
} from "@common/components/templates/modals";

// Define constants
const DISCIPLINE_CODE = "00300";
const DISCIPLINE_NAME = "construction";

// Update buttons - use COMMON component modal IDs (without discipline prefix)
const agentsButtons = [
  {
    label: "Correspondence Reply",
    modalId: "CorrespondenceReplyModal",  // Use common component ID
    modalTitle: "Construction Correspondence Reply",
  },
];

const upsertButtons = [
  {
    label: "Cloud Import",
    modalId: "UpsertCloudModal",  // Use common component ID - NOT "00300-UpsertCloudModal"
    modalTitle: "Cloud Import",
  },
  {
    label: "Import from URL",
    modalId: "UpsertUrlModal",  // Use common component ID - NOT "00300-UpsertUrlModal"
    modalTitle: "Import from URL",
  },
  {
    label: "Upload Files",
    modalId: "UpsertFileModal",  // Use common component ID - NOT "00300-UpsertFileModal"
    modalTitle: "Upload Files",
  },
];

const workspaceButtons = [
  {
    label: "Access Permissions",
    modalId: "AccessPermissionVisualizerModal",
    modalTitle: "Access Permission Visualizer",
  },
  {
    label: "Cross-Discipline Sharing",
    modalId: "DisciplinePermissionMatrixModal",
    modalTitle: "Cross-Discipline Permissions",
  },
  {
    label: "Manage Workspaces",
    modalId: "WorkspaceManagementModal",
    modalTitle: "Manage Workspaces",
  },
  {
    label: "Vector Data Manager",
    modalId: "VectorDataManagerModal",
    modalTitle: "Vector Data Manager",
  },
];

// Update handleOpenModal for discipline context
const handleOpenModal = (modalId, modalProps = {}) => {
  window.currentModalTriggerPage = modalProps.triggerPage;

  if (modalId === "DisciplinePermissionMatrixModal") {
    openModal(modalId, {
      currentDiscipline: DISCIPLINE_CODE,
      modalTitle: modalProps.modalTitle,
      triggerPage: "00300-construction",
    });
    return;
  }

  if (modalId === "VectorDataManagerModal" || modalId === "WorkspaceManagementModal") {
    openModal(modalId, {
      discipline: DISCIPLINE_CODE,
      modalTitle: modalProps.modalTitle,
      triggerPage: "00300-construction",
    });
    return;
  }

  if (modalId === "AccessPermissionVisualizerModal") {
    openModal(modalId, {
      discipline: DISCIPLINE_CODE,
      modalTitle: modalProps.modalTitle,
      triggerPage: "00300-construction",
    });
    return;
  }

  // Handle upsert modals (common components)
  if (modalId === "UpsertCloudModal" || modalId === "UpsertUrlModal" || modalId === "UpsertFileModal") {
    openModal(modalId, {
      discipline: DISCIPLINE_CODE,
      modalTitle: modalProps.modalTitle,
      triggerPage: "00300-construction",
    });
    return;
  }

  // Handle correspondence modal
  if (modalId === "CorrespondenceReplyModal") {
    openModal(modalId, {
      discipline: DISCIPLINE_CODE,
      category: "Construction",
      modalTitle: modalProps.modalTitle,
      triggerPage: "00300-construction",
    });
    return;
  }
};
```

---

## 7. Testing Requirements

### 7.1 Modal Functionality Tests

For each discipline page after implementation:

1. **Open Each Modal**: Click each button and verify modal opens
2. **Verify Title**: Check modal title shows correct discipline name
3. **Test Form Submission**: Complete any forms and verify submission
4. **Verify Data Isolation**: Check documents go to correct vector table

### 7.2 Vector Table Tests

```sql
-- Verify documents are stored in correct table
SELECT 
    id,
    discipline_code,
    content,
    metadata,
    created_at
FROM a_00300_construction_vector
ORDER BY created_at DESC
LIMIT 10;
```

### 7.3 RLS Policy Tests

```sql
-- Verify RLS is enabled
SELECT 
    relname,
    relrowsecurity
FROM pg_class
WHERE relname LIKE 'a\_%\_vector';
```

---

## 8. Rollout Plan

### Batch 1: High-Priority Disciplines
- 00300 Construction
- 00400 Contracts
- 00435 Contracts Post-Award
- 00800 Design

### Batch 2: Engineering Disciplines
- 00850 Civil Engineering
- 00860 Electrical Engineering
- 00870 Mechanical Engineering
- 00871 Process Engineering

### Batch 3: Support Disciplines
- 00900 Document Control
- 01700 Logistics
- 02035 Scheduling
- 02250 Quality Control

### Batch 4: Remaining Disciplines
- All remaining disciplines from the list

---

## 9. Summary

This prompt provides all the necessary information to implement shared buttons and modals from the 01900 Procurement page to all other discipline pages. The key points are:

### Buttons/Modals to Replicate on Target Pages

1. **CorrespondenceReplyModal** (Create discipline-specific version):
   - For replying to correspondence/documents (Agents state)
   - Copy from `01900-03-CorrespondenceReplyModal.js` and customize for each discipline

2. **UpsertUrlModal** (Create discipline-specific version):
   - For importing from web URLs (Upserts state)
   - Copy from `01900-UpsertUrlModal.js` and customize for each discipline

3. **Common Components Available** (6 components - import from `@common/components/templates/modals`):
   - ✅ **UpsertCloudModal** - Supports discipline routing via `discipline` prop
   - ✅ **UpsertFileModal** - Supports discipline routing via `discipline` prop
   - ✅ WorkspaceManagementModal
   - ✅ VectorDataManagerModal
   - ✅ AccessPermissionVisualizerModal
   - ✅ DisciplinePermissionMatrixModal

### Excluded Items (Procurement-Specific - Do NOT Share):
- ❌ Create Procurement Order
- ❌ Contact Scraper  
- ❌ Supplier Setup

### Critical Implementation Notes:

1. **Common components are verified** to support discipline routing - no discipline-specific versions needed for UpsertCloudModal and UpsertFileModal

2. **Modal handler must pass discipline prop**:
   ```javascript
   openModal("UpsertCloudModal", { discipline: "00300", ... })
   ```

3. **Vector table isolation**: Documents uploaded through these modals must be stored in the discipline-specific vector table to maintain data isolation.

---

**End of Document**
