# All Documents Page Documentation (For All Departments)

## Overview

The All Documents page provides general functionality for **all departments** to manage project documents, revisions, and approvals. It is a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing. This page is located at `/0200-all-documents`.

For specialized document control functionalities intended for dedicated document control specialists, please refer to the documentation for the Document Control Page:
`docs/1300_00900_DOCUMENT_CONTROL_PAGE.md`

## File Structure

```
client/src/pages/0200-all-documents/
├── components/               # React components
│   ├── DocumentSearchView.js
│   ├── DocumentVersionsView.js
│   ├── all-documents-page.js # Main page component
│   └── modals/
│       ├── DocumentAgentsModal.js
│       ├── DocumentDetailModal.js
│       └── DocumentUploadModal.js
├── css/                     # Page-specific CSS
│   └── 0200-pages-style.css # Page-specific styles (located in common/css/pages)
├── 0200-all-documents.html  # Entry HTML for the page
└── 0200-index.js            # Entry point for the page's JavaScript
```

## Database Tables

The All Documents page interacts with several database tables to manage documents, versions, and metadata. This includes core document tables and discipline-specific metadata tables, integrated with the application's user and role management system for access control.

- **a_00900_doccontrol_documents:** Stores core metadata for all documents, including file paths, names, versions, links to users and discipline-specific data, and a `storage_url` for the original file in Supabase Storage.
- **a_00900_doccontrol_document_versions:** Tracks the history and different versions of each document, linking back to the core document record.
- **a_00900_doccontrol_data:** Stores metadata specific to documents managed by the 0900 Document Control page. Discipline-specific metadata for documents belonging to other pages/disciplines will reside in their respective `a_[page_number]_[discipline]_data` tables.
- **document_stores:** A new table that manages logical document store groupings for Flowise integration.
- **disciplines:** A lookup table for disciplines and their associated page numbers, used for categorization and potentially access control.

Access control (Row Level Security) for these tables relies on the existing `user_management` table for admin checks. Discipline-based access control will be implemented based on the structure of `user_role_assignments` or other relevant tables.

The page may also interact with existing discipline-specific vector tables (e.g., `a_00102_admin_vector`, `a_00900_doccontrol_vector`) for functionalities like searching or analysis, although the primary document metadata is stored in the new tables.

### AI Tools Integration

The All Documents page, via the "AI Document Tools" modal, provides access to specialized AI functionalities:

-   **Document Summarizer**: Utilizes a dedicated Flowise chatbot (`0900-DocumentSummaryAgentChatbot.js`) to generate comprehensive summaries.
-   **Content Analyzer**: Utilizes a dedicated Flowise chatbot (`0900-DocumentContentAnalyzerChatbot.js`) for detailed content breakdown and insights.

Both tools feature:
-   Automatic prompt copying to clipboard for user convenience.
-   Automatic clearing of previous chat history for clean context.
-   Consistent orange branding.

## UI Layout

### Background Image

The page utilizes the themed background image system using `getThemedImagePath` helper function. The background image is applied via inline styles directly on the main page component div. The specific image is `client/public/assets/default/00900.png`.

```javascript
// Background image implementation in 0200-all-documents/components/all-documents-page.js
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";

const AllDocumentsPage = () => {
  // Get the themed background image path
  const backgroundImagePath = getThemedImagePath("00900.png");

  return (
    <div
      className="document-control-page page-background"
      style={{
        backgroundImage: `url(${backgroundImagePath})`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Page content */}
    </div>
  );
};
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-00900-navigation-container`):** Bottom center, contains State Buttons ("Agents", "Upsert", "Workspace") and the Title Button ("Document Control").
2. **Action Button Container (`.A-00900-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state.
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-00900-...` follow the pattern established in other pages, using the page number prefix)_

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container {
  /* Centered */
}
.modal-overlay {
  /* Full screen overlay */
}
```

## UI Design Outline

The UI for the All Documents page is designed as a common interface with access controlled at both the data (via RLS) and UI levels, based on the user's discipline. It leverages the existing page structure.

1.  **Common Layout:**

    - Utilizes the standard fixed-position elements: Navigation Container (State Buttons: "Agents", "Upsert", "Workspace"; Title Button: "Document Control"), Action Button Container (context-sensitive buttons), Accordion Toggle, Logout Button, Accordion Menu.
    - The background image is excluded from this page's design.

2.  **Content Area:**

    - The main central area dynamically changes its displayed content and available interactions based on the selected state and the user's discipline.
    - **"Agents" State:** Displays available automated document control workflows or "agents". The visibility of specific agent buttons or options will be controlled based on the user's assigned discipline(s).
    - **"Upsert" State:** Provides forms for uploading new documents and updating existing ones. This state on the 0200 page is primarily for general users to upload documents not tied to a specific discipline. It utilizes a centralized `DocumentUploadModal.js` component for the core upload logic (Supabase Storage + Flowise integration). Discipline-specific document uploads will occur via tailored "Upsert" modals on their respective discipline pages, which will also leverage the same centralized upload logic.
    - **"Workspace" State:** The primary centralized document management area. It will include a searchable and filterable view of documents from across all disciplines the user has permission to access. Filtering options and default filter settings (e.g., pre-setting the discipline filter) will be influenced by the user's discipline. AI-enhanced search and interaction with document content will be key features here.

3.  **Access Control in UI:**

    - Beyond database-level RLS, frontend logic within components will conditionally render or enable/disable UI elements (like specific buttons, form fields, or filter options) based on the authenticated user's role and assigned discipline(s). This ensures users only see and can interact with features relevant to their access level.

4.  **Modals:**
    - The common modal system is used for specific actions (upload, view details, etc.), with modal content and available actions potentially discipline-aware.

This design ensures a consistent layout while providing a tailored and secure experience based on the user's discipline and role.

## Webpack Configuration

The All Documents page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### All Documents Page Component

The main page component (`client/src/pages/0200-all-documents/components/all-documents-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0200-all-documents/components/all-documents-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component";
import settingsManager from "@common/js/ui/00100-ui-display-settings";
// ... import modal components if applicable

const AllDocumentsPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("0200 AllDocumentsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0200 AllDocumentsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "0200 AllDocumentsPage: Error initializing settings:",
          error
        );
      }
    };
    init();
  }, []);

  const handleStateChange = (newState) => {
    setCurrentState(newState);
    // Logic to show/hide action buttons based on state
  };

  const handleToggleAccordion = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // ... other handlers (logout, modal triggers)
  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 0200 All Documents modal:", modalTarget);
  };

  const handleLogout = () => {
    if (window.handleLogout) window.handleLogout();
  };

  return (
    <div className="page-background">
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-00900-button-container">
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="A-00900-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0900-01-02-modal-document-upload")
                  }
                >
                  Upload Document
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-00900-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0900-03-01-modal-summarize-doc-input")
                  }
                >
                  Summarize Document
                </button>
                <button
                  type="button"
                  className="A-00900-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0900-03-02-modal-qa-doc-input")
                  }
                >
                  Q&A Document
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="A-00900-modal-trigger-button"
                onClick={() =>
                  handleModalClick("A-0900-01-01-modal-document-details")
                }
              >
                Document Details
              </button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-00900-navigation-container">
            <div className="A-00900-nav-row">
              <button
                onClick={() => handleStateChange("agents")}
                className={`state-button ${
                  currentState === "agents" ? "active" : ""
                }`}
              >
                Agents
              </button>
              <button
                onClick={() => handleStateChange("upsert")}
                className={`state-button ${
                  currentState === "upsert" ? "active" : ""
                }`}
              >
                Upsert
              </button>
              <button
                onClick={() => handleStateChange("workspace")}
                className={`state-button ${
                  currentState === "workspace" ? "active" : ""
                }`}
              >
                Workspace
              </button>
            </div>
            <button className="nav-button primary">Document Control</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-00900-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button
            id="logout-button"
            onClick={handleLogout}
            className="A-00900-logout-button"
          >
            Logout
          </button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? "visible" : ""}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div
            id="A-00900-modal-container"
            className="modal-container-root"
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AllDocumentsPage;
```

### Modal System

The All Documents page now integrates with the common modal system (`modal-context`, `BaseModal`) and utilizes specific modals:

- `DocumentDetailModal.js`: Used for displaying detailed information about a document with **View Document** functionality.
- `DocumentUploadModal.js`: The primary modal for uploading new documents, integrating with Supabase Storage and Flowise.
- `DocumentAgentsModal.js`: Provides access to AI functionalities like summarization and content analysis.

#### Document Detail Modal - View Document Feature

The `DocumentDetailModal.js` component now includes comprehensive document viewing capabilities:

**Primary Actions:**
- **View Document**: Opens documents directly in new browser tabs using `window.open()`
- **Download Document**: Triggers file downloads with proper filename handling
- **Version History**: Access to document version management
- **Share Document**: Document sharing functionality
- **Request Review**: Workflow integration for document reviews

**Implementation Details:**
```javascript
const handleViewDocument = async () => {
  try {
    if (!document || !document.id) {
      alert('No document selected for viewing.');
      return;
    }
    
    // Use the backend API to view the document
    const viewUrl = `/api/documents/${document.id}/view`;
    
    // Open the document in a new tab/window
    window.open(viewUrl, '_blank');
    
  } catch (error) {
    console.error('Error opening document for viewing:', error);
    alert('Failed to open document for viewing. Please try again.');
  }
};
```

**UI Layout:**
- **Primary "View Document" button**: Blue/contained style, prominently displayed in both actions section and dialog footer
- **Secondary "Download" button**: Outlined style for file downloads
- **Additional actions**: Outlined buttons for version history, sharing, and review requests
- **Error handling**: User-friendly alerts and detailed console logging

**Backend Integration:**
- Endpoint: `GET /api/documents/:id/view`
- Content-Type: `application/pdf` (or appropriate MIME type)
- Content-Disposition: `inline` for viewing, `attachment` for downloads
- Multi-source support: Supabase Storage, Flowise, legacy file systems

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple document-control-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:3000/0200-all-documents`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The All Documents page (0200-all-documents) has been created based on the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`all-documents-page.js`, `DocumentSearchView.js`, `DocumentVersionsView.js`, and modals).
2. Webpack entry point (`0200-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. State buttons renamed to: Agents, Upsert, Workspace.
7. Modal trigger buttons updated to reflect actual modal names and functionality.

## Future Improvements

1.  **Implement robust access control logic for UI elements based on user roles and disciplines.** (This is the next major phase of the overall plan.)
2.  **Develop AI-enhanced search and interaction features for document content.**
3.  **Implement bulk upload/migration functionality.**
4.  **Integrate with external document management systems if required.**
5.  Implement specific document control-related modals.
6.  Add data fetching for documents.
7.  Implement state management for document data if needed.
8.  Refine UI/UX based on specific document control workflows.
9.  Add relevant unit/integration tests.
10. Implement document versioning.
11. Support advanced metadata schemas per document type.
12. Expand integration with additional AI processing services.
13. Develop an analytics dashboard for usage metrics.
