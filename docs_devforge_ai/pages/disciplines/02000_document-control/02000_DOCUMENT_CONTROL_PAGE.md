# Document Control Page Documentation (For Document Control Specialists)

## Overview

The Document Control page (0900) is specifically designed for **dedicated document control specialists**. It provides advanced functionalities related to managing project documents, revisions, and approvals. While some core functionalities have been migrated to the new All Documents Page (0200) for broader access, this 0900 page retains features and workflows tailored for specialist roles.

**This page is intended for use by Document Control personnel only.**

It also integrates with advanced AI tools for document summarization and content analysis, leveraging dedicated Flowise chatbot instances for specialized processing.

## File Structure

The `client/src/pages/00900-document-control/` directory contains components and files specific to the Document Control Specialist's interface.

For general document access and usage by other departments, please refer to the documentation for the All Documents Page:
`docs/1300_0200_ALL_DOCUMENTS_PAGE.md`

## Database Tables

The Document Control System (DCS) provides centralized document management across all disciplines. The DCS tables are the core infrastructure for document storage, version control, and cross-system integration.

### Core DCS Tables
*   **a_00900_doccontrol_documents:** Central document repository for ALL disciplines (civil, electrical, mechanical, etc.)
  - Auto-generated document numbers: `00850-CIVIL-SPEC-2025-0001`
  - Discipline-specific categorization with `discipline_code` (00850, 00860, etc.)
  - Approval workflows and version control
  - Procurement/contract relevance tagging
  - Cross-system integration capabilities

*   **a_00900_doccontrol_document_versions:** Complete version history for all documents
  - Tracks changes, approvals, and rollback capabilities
  - Maintains file paths and metadata for each version
  - Audit trail for document evolution

*   **a_00900_doccontrol_data:** Universal metadata for all DCS documents
  - Author, reviewer, and approver information
  - Access control and archival settings
  - Custom metadata for extensibility

### Discipline-Specific Extensions
*   **a_00850_civil_data:** Civil engineering specific metadata
  - Engineering standards (SANS, Eurocode, etc.)
  - Design codes and technical specifications
  - Structure types, material types, foundation types
  - Engineering calculations and design parameters

*   **disciplines:** Lookup table for discipline codes and page mappings
  - Maps discipline codes to page numbers and names
  - Supports dynamic discipline-specific interfaces

### Cross-System Integration Tables
*   **procurement_order_documents:** Universal document linking table
  - Links ANY document to procurement orders (POs, WOs, SOs, contracts)
  - Supports documents from all disciplines (civil, electrical, mechanical, etc.)
  - Enables procurement teams to access technical documents from design disciplines
  - Reference types: auto, sow, template, manual, engineering

*   **procurement_document_links:** Legacy procurement document links
  - Enables procurement teams to reference engineering documents
  - Supports multiple link types (reference, supersedes, related)
  - Maintains audit trail of document usage

Access control uses Row Level Security (RLS) policies based on organization membership and user roles. The DCS supports both organization-wide access and department-specific restrictions.

### Cross-Discipline Document Access System

The Document Control System enables seamless access to technical documents across all design disciplines for procurement and contracts teams:

#### How Cross-Discipline Access Works
1. **Document Creation**: Design disciplines (Civil, Electrical, Mechanical, etc.) create technical documents in their respective tables
2. **Document Approval**: Documents go through approval workflows and are marked as approved
3. **Procurement Linking**: Procurement teams can link approved documents from any discipline to their POs/WOs/SOs
4. **Universal Access**: Procurement and contracts teams access all linked technical documents through the procurement order interface

#### Document Linking Architecture
```sql
-- Universal linking table allows any document to be linked to any procurement order
CREATE TABLE procurement_order_documents (
  procurement_order_id UUID REFERENCES procurement_orders(id),
  document_id UUID, -- Can reference ANY document from ANY table
  document_type VARCHAR(50), -- specification, drawing, manual, etc.
  reference_type VARCHAR(20), -- auto, sow, template, manual, engineering
  project_phase VARCHAR(50),
  added_by UUID REFERENCES user_profiles(user_id),
  notes TEXT
);
```

#### API Integration for Document Linking
```javascript
// Link documents from any discipline to procurement orders
POST /api/procurement-orders/:orderId/documents
{
  "documents": [
    {
      "documentId": "uuid-from-civil-engineering-documents",
      "documentType": "specification",
      "referenceType": "engineering"
    },
    {
      "documentId": "uuid-from-electrical-documents",
      "documentType": "drawing",
      "referenceType": "engineering"
    }
  ]
}

// Get procurement order with all linked technical documents
GET /api/procurement-orders/:orderId
// Returns linked_documents array with documents from all disciplines
```

#### Benefits for Procurement Teams
- **Complete Technical Package**: Access all relevant specifications, drawings, manuals from design disciplines
- **No Data Duplication**: Documents remain in source tables while being accessible across disciplines
- **Version Control**: Linked documents maintain version integrity and audit trails
- **Smart Suggestions**: System suggests relevant technical documents based on order type and project context

### AI Tools Integration

The Document Control page, via the "AI Document Tools" modal, provides access to specialized AI functionalities:

-   **Document Summarizer**: Utilizes a dedicated Flowise chatbot (`0900-DocumentSummaryAgentChatbot.js`) to generate comprehensive summaries.
-   **Content Analyzer**: Utilizes a dedicated Flowise chatbot (`0900-DocumentContentAnalyzerChatbot.js`) for detailed content breakdown and insights.

Both tools feature:
-   Automatic prompt copying to clipboard for user convenience.
-   Automatic clearing of previous chat history for clean context.
-   Consistent orange branding.

## UI Layout

The UI layout for the Document Control Specialist's page (0900) is tailored for their specific workflows.

## UI Design Outline

The UI for the Document Control page (0900) is designed as a specialized interface with access controlled at both the data (via RLS) and UI levels, based on the user's role as a document control specialist.

## Webpack Configuration

The Document Control page (0900) is part of the main Single-Page Application (SPA) bundle.

## Components

The components under `client/src/pages/00900-document-control/components/` are specific to the Document Control Specialist's interface.

## State Management

Primarily uses React's local state (`useState`) for UI control and integrates with `settingsManager` for UI display settings.

## Authentication

Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

To run the development server:

```bash
cd client
npm run dev
```

Access the Document Control Specialist page via its specific route (e.g., `http://localhost:3000/00900-document-control`).

## Build

To build the application for production:

```bash
cd client
npm run build
```

## Migration Notes

This document clarifies the role of the 0900 Document Control page as a specialist interface, distinct from the general-purpose 0200 All Documents page.

## Integration with Form Management System

The Document Control page has been enhanced through integration with the **Governance Form Management System** (01300). This integration provides:

### Form Management Features 🤖
- **Document Control Form Workflows:** Standardized forms for document approval processes
- **Version Control Integration:** Enhanced document versioning through form-based workflows
- **Compliance Tracking:** Forms for regulatory compliance documentation and tracking
- **Audit Trail Enhancement:** Automated form submissions for audit documentation

### Active Directory Integration 📋
```javascript
// Form system provides enhanced document control workflows
const documentControlForm = new FormWorkflow({
  type: 'document_control',
  departments: ['HR', 'Finance', 'Operations', 'Safety'],
  approvalRoutes: ['Document Controller', 'Department Head', 'Compliance Officer'],
  versionTracking: true,
  auditTrail: true
});
```

### Benefits for Document Control Specialists 🔍
- **Unified Interface:** Combined document management with form workflows
- **Enhanced Compliance:** Automated compliance form generation and tracking
- **Approval Workflows:** Integrated approval processes with document versioning
- **Analytics Integration:** Form submission analytics tied to document metrics

### Cross-System Benefits 🔄
- **Scope of Work Generation:** AI-enhanced SOW generation integrated with document control
- **Template Management:** Document control templates synchronized with form system
- **User Management:** Consistent user authorization between document and form systems
- **Performance Metrics:** Combined analytics for document and form performance

## Future Improvements

Future improvements for the Document Control Specialist's functionalities will be tracked here.

1. ✅ **COMPLETED:** Form Management System integration implemented
2. ✅ **COMPLETED:** AI-powered content generation for documents
3. ✅ **COMPLETED:** Modal system fixes and error resolution
4. Additional AI document analysis tools
5. Enhanced document classification automation
6. Integration with external document management systems
