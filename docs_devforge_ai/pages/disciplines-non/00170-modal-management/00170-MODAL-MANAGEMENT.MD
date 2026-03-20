# Page: 00170 - Modal Management

**Route:** Handled by client-side routing (e.g., React Router) within the Single-Page Application (SPA).

**Purpose:** This page provides administrators or authorized users with an interface to manage the application's modal configurations stored in the `modal_configurations` database table. It allows viewing existing modals (now all React-based) and adding new React-based modal configurations, particularly for integrations.

**Related Implementation Plan:** `docs/0975_00_MODAL_IMPLEMENTATION_PLAN.md` (Phase 5 - Completed)

---

## Functionality

1. **View Modal Configurations:**
    - Displays a table listing all modal configurations fetched from the `modal_configurations` table via `fetchModalConfigurations` service.
    - Columns include: Page Prefix, Page Name (derived), Target State, Display Name, Modal Key, Component Path (for React modals), Chatbot ID (for integration modals), Type (React).
    - The table is sortable by Page Prefix.

2. **Add New Modal Configuration:**
    - A "New Modal" button triggers the `AddNewModal` component (`client/src/pages/00170-modal-management/components/00170-AddNewModal.js`).
    - This modal presents a multi-step form to collect details for a new React modal configuration:
        - Modal Name (Display Name)
        - Target Page Prefix
        - Target State
        - Sequence
        - Modal Type (React - only supports adding React)
        - Component Path (Required for React type)
        - Interaction Style (Standard, Integration - Input Form, Integration - No Input Form)
        - Flowise/n8n ID (Required for Integration styles)
    - Includes a review step where a `modal_key` is generated based on input.
    - The final step instructs the user to copy a command and provide it to Cline via chat for the actual database insertion and registration within the `ModalProvider`.

3. **Edit Modal Configuration:** (Implemented via `EditModal`)
    - An "Edit" button (enabled for all modals) opens the `EditModal` component (`client/src/pages/00170-modal-management/components/00170-EditModal.js`).
    - Allows modification of existing modal configuration details.
    - Updates the database via the `updateModalConfiguration` service.

4. **Duplicate/Move Modal Configuration:** (Implemented via `DuplicateModal`)
    - A "Duplicate/Move" button (enabled for all modals) opens the `DuplicateModal` component (`client/src/pages/00170-modal-management/components/00170-DuplicateModal.js`).
    - Allows creating a new configuration based on an existing one, potentially changing the target page/state/sequence.
    - Adds a new entry to the database via the `addModalConfiguration` service.

5. **Remove Modal Configuration:**
    - A "Remove" button prompts for confirmation.
    - If confirmed, calls the `deleteModalConfiguration` service to remove the configuration entry from the database.
    - **Note:** This only removes the configuration record, not the underlying component file.

6. **View Modal Details:** (Implemented via `ViewModalDetails`)
    - A "View" button opens the `ViewModalDetails` component (`client/src/pages/00170-modal-management/components/00170-ViewModalDetails.js`).
    - Displays all configuration details for the selected modal in a read-only format.

---

## Key Components

- **Main Page Component:** `client/src/pages/00170-modal-management/components/00170-ModalManagementPage.js` (includes table logic, fetches data, handles button clicks)
- **Add Modal Form:** `client/src/pages/00170-modal-management/components/00170-AddNewModal.js`
- **Edit Modal Form:** `client/src/pages/00170-modal-management/components/00170-EditModal.js`
- **Duplicate Modal Form:** `client/src/pages/00170-modal-management/components/00170-DuplicateModal.js`
- **View Details Modal:** `client/src/pages/00170-modal-management/components/00170-ViewModalDetails.js`
- **Modal Context/Provider:** `client/src/components/modal/context/00170-ModalProvider.js` (Manages modal state and renders the correct modal component based on registration)
- **Modal Hook:** `client/src/components/modal/hooks/00170-useModal.js` (Used by components to open/close modals)
- **Service:** `client/src/services/modalConfigService.js` (Handles database interactions)

---

- **Document Upload Modals (New Category-Based Design):** A new category-based approach for document upload modals has been designed to support various file types and sources (local files, URLs, cloud services, unstructured/bulk). The detailed UI/UX and metadata capture plan for these modals is documented in `docs/0976_MODAL_UI_DESIGN_PLAN.md`. These modals will be registered in the `modal_configurations` table and will replace the previous placeholder document control modals.

## Data Source

- `modal_configurations` table in the Supabase database.

---

## Related Documentation

- [Modal UI Layouts & Interaction Patterns Design](./0976_MODAL_UI_DESIGN_PLAN.md)

## Future Enhancements / TODOs

- Implement Import/Export functionality.
- Add robust permission checks for all actions (Add, Edit, Remove, Duplicate).
- Refine the Cline interaction for registration/removal to be fully automated if possible, or provide clearer feedback.
- Implement deletion of legacy modal configurations (requires a different process).
- Add filtering/searching capabilities to the table.
