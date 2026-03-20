# Flowise Document Store Implementation Plan (1360)

## Overview

This document outlines the implementation plan for integrating Flowise Document Store functionality with the existing document control system. The plan creates a hybrid storage approach that leverages Flowise for AI-searchable documents while maintaining Supabase storage for original document access.

**Important Note**: It has been confirmed that Flowise Document Store's public API does **not** provide direct access to the original binary files for viewing or downloading. Its primary function is to extract text chunks for AI processing and vector search. Therefore, a dedicated storage solution for original files is essential.

**Status**: ✅ **IN PROGRESS** - Core storage and retrieval mechanisms implemented. Access control (RLS) is the next phase.

## Implementation Results

### Document Store Discovery Success

Using the correct Flowise API endpoint `/api/v1/document-store/store`, we successfully discovered and integrated **all 44 document stores** with their proper names:

#### Active Document Stores (with existing documents):
- **00435-Contracts post-award** (UPSERTED) - Contains contract correspondence and variations
- **01300-Governance** (SYNC) - Governance and compliance documents  
- **02400-Safety** (SYNC) - Safety protocols and incident reports
- **02075-Inspection** (SYNC) - Inspection reports and documentation
- **02025-Quantity surveying** (UPSERTED) - Quantity surveying and measurement documents
- **00102-Administration** (SYNC) - Administrative procedures and forms

#### Available Document Stores (ready for new documents):
**Engineering Disciplines:**
- 00825-Architectural, 00835-Engineering - chemical, 00850-Engineering - civil
- 00860-Engineering - electrical, 00870-Engineering - mechanical

**Management & Leadership:**
- 00880-Board of Directors, 00882-Director Construction, 00883-Director Contracts
- 00884-Director Engineering, 00884-1-Director Finance, 00885-Director HSE
- 00886-Director Logistics, 00888-Director Procurement, 00890-Director Projects

**Operations & Compliance:**
- 00200-Commercial, 00300-Construction, 00425-Contracts pre-award
- 00872-Developer, 00875-Sales, 00900-Document control
- 01000-Environmental, 01100-Ethics, 01200-Finance, 01400-Health
- 01500-Human Resources, 01600-Local Content, 01700-Logistics, 01750-Legal
- 01800-Operations, 01850-Other Parties, 01900-Procurement
- 02035-Scheduling, 02050-Information Technology, 02100-Public Relations
- 02200-Quality assurance, 02250-Quality control, 02500-Security, 03000-Landscaping

### Discovery Script Performance
- **Script**: `scripts/get-all-document-stores.js`
- **API Endpoint**: `/api/v1/document-store/store` 
- **Success Rate**: 100% (44/44 stores discovered)
- **Sync Rate**: 100% (44/44 stores synced to database)
- **Data Quality**: All stores have meaningful names following project conventions

## Project Goals

1. **Formalize Document Store Management**: Create a structured approach to managing documents destined for AI processing via Flowise
2. **Hybrid Storage Strategy**: Implement dual pathways for document storage (Flowise vs. Supabase bucket)
3. **Seamless Integration**: Extend existing document control and vector search systems without disruption
4. **User-Friendly Interface**: Provide an intuitive modal-based UI for document upload and management

## Architecture Overview

```mermaid
graph TD
    subgraph "UI Layer (Modals)"
        A[User Clicks 'Add Document'] --> B{Open Discipline-Specific Upload Modal};
        B --> C[Document Upload Modal (e.g., 0200-DocumentUploadModal.js)];
        C -- User Fills Form & Submits --> D{Centralized Frontend Upload Utility};
    end

    subgraph "Frontend Utility (document-upload-service.js)"
        D --> E[1. Upload Original File to Supabase Storage];
        E -- Get Public URL --> F[2. Save Metadata & Storage URL to Supabase DB];
        F --> G[3. Send Original File to Flowise for AI Processing];
    end

    subgraph "Backend API (document-routes.js)"
        H[User Requests Document (View/Download)] --> I{/api/documents/:id/view or /download};
        I -- Fetches Metadata --> J[Supabase DB: a_00900_doccontrol_documents];
        J -- Contains storage_url --> K[Prioritize Fetching from Supabase Storage];
        J -- Contains flowise_loader_id --> L[Fallback: Fetch Chunks from Flowise (for AI context)];
    end

    subgraph "Storage & Processing"
        E --> M[Supabase Storage Bucket (e.g., 'documents')];
        G --> N[Flowise Document Store];
        N -- Upserts to --> O[Supabase Vector DB];
    end
    
    subgraph "Central Manifest"
        F -- Updates --> P[Table: a_00900_doccontrol_documents];
    end

    style C fill:#e6f7ff,stroke:#00609e
    style P fill:#fff3cd,stroke:#856404
    style M fill:#d4edda,stroke:#155724
    style N fill:#f8d7da,stroke:#721c24
```

## Implementation Phases

### Phase 1: Database Schema Enhancement

#### 1.1 Create Document Stores Table

Create a new table to manage logical document store groupings:

```sql
CREATE TABLE public.document_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

COMMENT ON TABLE public.document_stores IS 'Logical grouping for documents to be managed and upserted via Flowise';
COMMENT ON COLUMN public.document_stores.name IS 'Unique name for the document store';
COMMENT ON COLUMN public.document_stores.description IS 'Human-readable description of the store purpose';
COMMENT ON COLUMN public.document_stores.metadata IS 'Additional configuration and metadata for the store';
COMMENT ON COLUMN public.document_stores.is_active IS 'Whether this store is currently active for new documents';

-- Create indexes for performance
CREATE INDEX idx_document_stores_name ON public.document_stores(name);
CREATE INDEX idx_document_stores_active ON public.document_stores(is_active);
```

#### 1.2 Enhance Document Control Table

Add columns to track hybrid storage approach:

```sql
ALTER TABLE public.a_00900_doccontrol_documents 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.document_categories(id),
ADD COLUMN IF NOT EXISTS storage_type TEXT CHECK (storage_type IN ('flowise_store', 'supabase_bucket')),
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS is_embedded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS embedding_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS flowise_document_id TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.a_00900_doccontrol_documents.category_id IS 'Reference to the document category';
COMMENT ON COLUMN public.a_00900_doccontrol_documents.storage_type IS 'Type of storage used: flowise_store or supabase_bucket';
COMMENT ON COLUMN public.a_00900_doccontrol_documents.storage_path IS 'Path/ID for retrieving the document from storage';
COMMENT ON COLUMN public.a_00900_doccontrol_documents.is_embedded IS 'Whether document has been processed for vector search';
COMMENT ON COLUMN public.a_00900_doccontrol_documents.embedding_details IS 'Metadata about embedding process (model, chunking, etc.)';
COMMENT ON COLUMN public.a_00900_doccontrol_documents.flowise_document_id IS 'ID returned by Flowise after document upsert';

-- Create indexes for new columns
CREATE INDEX idx_doccontrol_store_id ON public.a_00900_doccontrol_documents(store_id);
CREATE INDEX idx_doccontrol_storage_type ON public.a_00900_doccontrol_documents(storage_type);
CREATE INDEX idx_doccontrol_is_embedded ON public.a_00900_doccontrol_documents(is_embedded);
```

#### 1.3 Insert Initial Document Stores

```sql
INSERT INTO public.document_stores (name, description, metadata) VALUES
('general', 'General purpose document store', '{"default": true}'),
('contracts', 'Contract-related documents', '{"discipline": "contracts"}'),
('engineering', 'Engineering documentation', '{"discipline": "engineering"}'),
('safety', 'Safety and compliance documents', '{"discipline": "safety"}');
```

### Phase 2: Backend API Development

#### 2.1 Flowise Upsert Endpoint

Create `/api/documents/upsert-to-flowise` endpoint:

**Key Features:**
- Accept multipart form data (file + metadata)
- Authenticate with Flowise API
- Handle file upload to Flowise Document Store
- Process Flowise response and extract document ID
- Update central manifest table with results
- Comprehensive error handling and logging

**Expected Request Format:**
```javascript
FormData {
  file: File,
  title: string,
  description: string,
  store_id: UUID,
  discipline: string,
  metadata: JSON
}
```

**Expected Response Format:**
```javascript
{
  success: boolean,
  document_id: string,
  flowise_document_id: string,
  message: string,
  embedding_details?: object
}
```

#### 2.2 Supabase Bucket Upload Endpoint

Create `/api/documents/upload-to-bucket` endpoint:

**Key Features:**
- Accept multipart form data (file + metadata)
- Upload file to designated Supabase storage bucket
- Generate secure file path/URL
- Update central manifest table
- Handle file type validation and size limits

**Expected Request Format:**
```javascript
FormData {
  file: File,
  title: string,
  description: string,
  store_id: UUID,
  metadata: JSON
}
```

**Expected Response Format:**
```javascript
{
  success: boolean,
  document_id: string,
  file_path: string,
  file_url: string,
  message: string
}
```

### Phase 3: Frontend Modal Implementation

#### 3.1 Document Upload Modal Component

Implement `client/src/pages/0900-document-control/components/modals/0900-DocumentUploadModal.js`:

**Component Features:**
- File drag-and-drop input area
- Form fields for title, description, and metadata
- Document store selection dropdown
- "Make document searchable" checkbox toggle
- Real-time form validation
- Upload progress indication
- Success/error status display

**Form Fields:**
```javascript
const formFields = {
  file: File | null,
  title: string,
  description: string,
  store_id: string,
  discipline: string,
  makeSearchable: boolean,
  // Additional metadata fields as needed
};
```

**Styling Pattern:**
Follow the exact styling patterns from `02400-MinutesCompileModal.js`:
- Inline style objects for consistency
- Form layout and spacing
- Button styling and colors
- Status message styling

#### 3.2 Data Fetching Logic

**Supabase Integration:**
```javascript
// Fetch document stores for dropdown
useEffect(() => {
  if (supabaseClient) {
    const fetchDocumentStores = async () => {
      const { data, error } = await supabaseClient
        .from('document_stores')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
      
      if (!error) {
        setDocumentStoreOptions(data);
      }
    };
    fetchDocumentStores();
  }
}, [supabaseClient]);
```

#### 3.3 Form Submission Logic

**Hybrid Submission Handler:**
```javascript
const handleSubmit = async (event) => {
  event.preventDefault();
  setIsSubmitting(true);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('description', description);
  formData.append('store_id', storeId);
  formData.append('discipline', discipline);
  
  const endpoint = makeSearchable 
    ? '/api/documents/upsert-to-flowise'
    : '/api/documents/upload-to-bucket';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      setSubmitStatus({ 
        message: 'Document uploaded successfully!', 
        type: 'success' 
      });
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    setSubmitStatus({ 
      message: `Upload failed: ${error.message}`, 
      type: 'error' 
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Phase 4: Modal System Integration

#### 4.1 Modal Registration

Add entry to `modal_configurations` table:

```sql
INSERT INTO public.modal_configurations (
  modal_key,
  display_name,
  component_path,
  modal_type,
  is_active,
  description
) VALUES (
  'A-0900-upload-doc-01-standard',
  'Document Upload',
  'client/src/pages/0900-document-control/components/modals/0900-DocumentUploadModal.js',
  'React',
  true,
  'Modal for uploading documents to Flowise Document Store or Supabase bucket'
);
```

#### 4.2 Trigger Button Implementation

Add "Add Document" button to Document Control page:

```javascript
// In the Document Control page component
import { useModal } from '@components/modal/hooks/00170-useModal';

const { openModal } = useModal();

const handleAddDocument = () => {
  openModal('A-0900-upload-doc-01-standard', {
    triggerPage: 'Document Control'
  });
};

// Button JSX
<button 
  onClick={handleAddDocument}
  style={primaryButtonStyle}
>
  Add Document
</button>
```

#### 4.3 Build Process

After modal registration, rebuild the application:

```bash
cd client
npm run build
```

This regenerates the modal registry and makes the new modal available.

## Risk Assessment & Mitigation

### Low Risk Areas

1. **Frontend Modal Development**: Following established patterns from `MinutesCompileModal`
2. **Database Schema Changes**: Additive changes with proper migration scripts
3. **Modal System Integration**: Well-documented process with clear steps

### Medium Risk Areas

1. **Flowise API Integration**: New external dependency requiring careful error handling
2. **File Upload Handling**: Large files and network timeouts need consideration
3. **Authentication & Security**: Proper validation and access control required

### Mitigation Strategies

1. **Incremental Development**: Build and test each component separately
2. **Comprehensive Logging**: Detailed logs for debugging API interactions
3. **Error Handling**: Graceful degradation and user-friendly error messages
4. **Testing Strategy**: Test with various file types and sizes
5. **Staging Environment**: Test all changes in non-production environment first

## Testing Plan

### Unit Testing
- Modal component rendering and form validation
- API endpoint request/response handling
- Database query functions

### Integration Testing
- End-to-end document upload workflow
- Flowise API communication
- Database transaction integrity

### User Acceptance Testing
- Document upload via modal interface
- File retrieval and search functionality
- Error scenarios and edge cases

## Success Metrics

1. **Functional Metrics**:
   - Documents successfully uploaded to both storage types
   - Metadata correctly stored in central manifest
   - Search functionality working for embedded documents

2. **Performance Metrics**:
   - Upload completion time < 30 seconds for typical documents
   - Modal load time < 2 seconds
   - API response time < 5 seconds

3. **User Experience Metrics**:
   - Intuitive workflow requiring minimal training
   - Clear feedback on upload status and errors
   - Consistent visual design with existing application

## Implementation Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database Schema | 1-2 days | Database access, migration testing |
| Phase 2: Backend APIs | 3-4 days | Flowise API documentation, authentication setup |
| Phase 3: Frontend Modal | 2-3 days | Phase 1 completion, UI/UX review |
| Phase 4: Integration & Testing | 2-3 days | All previous phases, staging environment |

**Total Estimated Duration: 8-12 days**

## Maintenance Considerations

1. **Documentation Updates**: Keep API documentation current with any changes
2. **Monitoring**: Implement logging and monitoring for new endpoints
3. **Backup Strategy**: Ensure document stores are included in backup procedures
4. **Version Compatibility**: Monitor Flowise API changes and update accordingly

## Future Enhancements

1. **Bulk Upload**: Support for multiple document upload
2. **Document Versioning**: Track document revisions and changes
3. **Advanced Metadata**: Custom metadata schemas per document type
4. **Integration Expansion**: Support for additional AI processing services
5. **Analytics Dashboard**: Usage metrics and document store analytics

---

**Document Version**: 1.0  
**Last Updated**: 2025-06-26  
**Next Review**: 2025-07-26  
**Owner**: Development Team  
**Stakeholders**: Document Control Specialists, System Administrators
