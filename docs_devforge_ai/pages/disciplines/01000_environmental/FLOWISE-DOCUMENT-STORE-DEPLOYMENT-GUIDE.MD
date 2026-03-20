# Flowise Document Store Deployment Guide (1361)

## Overview

This guide provides step-by-step instructions for deploying the Flowise Document Store integration, focusing on a hybrid storage approach. This approach leverages Flowise for AI-searchable document content while utilizing Supabase Storage for the original binary files, as Flowise's public API does not provide direct access to original uploaded documents.

**Important Note**: It has been confirmed that Flowise Document Store's public API does **not** provide direct access to the original binary files for viewing or downloading. Its primary function is to extract text chunks for AI processing and vector search. Therefore, a dedicated storage solution for original files (Supabase Storage) is essential for viewing and downloading.

## Prerequisites

- Access to Supabase database with admin privileges
- **Manually created Supabase Storage bucket named `documents`** (e.g., public access for viewing)
- **`storage_url` column added to `public.a_00900_doccontrol_documents` table (TEXT type)**
- Flowise instance with Document Store capability
- Node.js server environment
- React client application

## Phase 1: Flowise Integration Setup

### Step 1: Discover ALL Flowise Document Stores ✅ COMPLETED

**Result**: Successfully discovered all 44 Flowise document stores using the correct API endpoint.

```bash
# Run from project root - COMPLETED SUCCESSFULLY
node scripts/get-all-document-stores.js
```

**Discovery Results:**

- ✅ **44 document stores** discovered using `/api/v1/document-store/store` endpoint
- ✅ **100% success rate** - all stores synced to database
- ✅ **Meaningful names** like "00435-Contracts post-award", "02400-Safety"
- ✅ **Status tracking** showing which stores have existing documents (UPSERTED/SYNC/EMPTY)

**Key Document Categories:**

- **Engineering**: 00435-Contracts, 02025-Quantity Surveying, 02400-Safety
- **Management**: 00102-Administration, 01300-Governance  
- **Operations**: 02075-Inspection, 02200-Maintenance
- **Compliance**: 03000-Regulatory, 03100-Audits

**Environment Configuration**: ✅ Already configured in `.env` file

### Step 2: Database Schema & Storage Setup (Manual Steps)

**2.1 Create Supabase Storage Bucket**

Manually create a new storage bucket in your Supabase project:

- Go to **Storage** in your Supabase dashboard.
- Click **"New bucket"**.
- Name the bucket: `documents`
- Set its public/private status. For direct viewing via public URLs, it should be **public**.

**2.2 Add `storage_url` Column to Document Control Table**

Manually add a `storage_url` column to your `a_00900_doccontrol_documents` table:

- Go to **Database > Tables** in your Supabase dashboard.
- Select the `a_00900_doccontrol_documents` table.
- Add a new column:
  - **Name**: `storage_url`
  - **Type**: `TEXT`
  - **Default Value**: `NULL`
  - **Nullable**: Yes

**2.3 Execute Database Schema Scripts (if not already done)**

Ensure the following SQL scripts have been executed in your Supabase SQL editor:

```bash
# Category Schema
sql/create_document_categories_table.sql  # Creates category table
sql/add-category-column.sql              # Adds category_id to documents

# Document Processing
sql/enhance_doccontrol_documents_table.sql  # Adds Flowise columns
sql/register_document_upload_modal.sql      # Registers upload modal

# Migration (if needed)
sql/migrate-document-system-rationalization.sql  # Consolidates document tables
```

These scripts create the `document_categories` table, enhance `a_00900_doccontrol_documents` with Flowise-related columns (excluding `storage_url` which is added manually), and register the upload modal.

### Step 3: Sync Document Categories

Use the sync script to populate document categories in the local database. This populates the `document_categories` table and enables dropdowns.

```bash
# Run from project root
node scripts/sync-document-categories.js
```

## Phase 2: Server Configuration

### Step 1: Install Dependencies

Install new dependencies in the project root:

```bash
npm install uuid
```

(Note: `multer` is typically a server-side dependency and is not needed client-side for `document-upload-service.js`.)

### Step 2: Environment Variables

Copy the required environment variables to your `.env` file:

```bash
# Copy from .env.flowise.example
FLOWISE_URL=https://your-flowise-instance.com
FLOWISE_API_KEY=your_flowise_api_key_here
FLOWISE_DOCUMENT_STORE_ID=your_document_store_id_here
```

**Important**: Replace placeholder values with your actual Flowise credentials.

### Step 3: Restart Server

Restart your server and rebuild the client to load the new code and dependencies:

```bash
# From project root
./build_and_serve.sh
```

## Phase 3: Client Configuration

### Step 1: Client-Side Code Updates (Already Implemented)

The following client-side files have been updated to implement the hybrid upload and viewing logic:

- `client/src/common/js/utils/document-upload-service.js`: New utility for Supabase Storage upload, database insertion, and Flowise upsert.
- `client/src/pages/0200-all-documents/components/modals/DocumentUploadModal.js`: Modified to use the new `document-upload-service.js`.
- `client/src/pages/0200-all-documents/components/modals/DocumentDetailModal.js`: Updated to use `storage_url` for viewing/downloading.

### Step 2: Backend API Updates (Already Implemented)

The following server-side files have been updated to support the new storage and retrieval:

- `server/routes/document-routes.js`: Modified to prioritize fetching documents from Supabase Storage via `storage_url`.
- `server/services/flowiseService.js`: Added `getOriginalDocument` (though confirmed Flowise API doesn't support direct binary download).
- `server/src/index.js`: Updated Content-Security-Policy (CSP) to allow `blob:` and `data:` URIs for in-browser viewing.

### Step 2: Verify Modal Registration

Check that the modal is properly registered by:

1. Starting the client application
2. Navigating to the Modal Management page (if available)
3. Verifying `A-0900-upload-doc-01-standard` appears in the list

## Phase 4: Integration Testing

### Step 1: Test Document Category Creation

Verify the document categories were created:

```sql
SELECT * FROM public.document_categories WHERE is_active = true;
```

Expected result: Categories matching the project disciplines

### Step 2: Test API Endpoints

Test the new API endpoints and document retrieval:

```bash
# Test document stores endpoint
curl http://localhost:3060/api/documents/stores

# Expected: JSON response with document stores

# Test document metadata endpoint (replace {document_id} with an actual ID)
curl http://localhost:3060/api/documents/{document_id}/metadata

# Expected: JSON response including 'storage_url' and Flowise IDs

# Test document viewing (replace {document_id} with an actual ID)
# This should open the document in your browser if the server is running
open http://localhost:3060/api/documents/{document_id}/view

# Test document downloading (replace {document_id} with an actual ID)
curl -O http://localhost:3060/api/documents/{document_id}/download

# Expected: The original file should be downloaded
```

### Step 3: Test Modal Functionality

1.  Navigate to the "All Documents Page" (`/0200-all-documents`) in your application.
2.  Go to the "Upsert" state and open the "Upload New Document" modal.
3.  Fill in the required metadata (Title, Department, etc.) and select a PDF or DOCX file.
4.  Click "Upload Document".
    - **Verify**: The upload completes successfully without errors in the browser console or the server logs.
    - **Verify**: Check your Supabase Storage bucket (`documents`) to confirm the file is uploaded.
    - **Verify**: Check your `a_00900_doccontrol_documents` table in Supabase to confirm a new record with `storage_url`, `flowise_loader_id`, and other metadata.
5.  **Test viewing and downloading the newly uploaded document**:
    - Find the newly uploaded document in your document list (e.g., via the Document Detail Modal).
    - If you have a "View Document" button (which was previously removed but can be re-added for testing, or you can directly navigate to the URL `http://localhost:3060/api/documents/{document_id}/view`), click it.
      - A PDF should open and display directly in a new browser tab.
      - A DOCX or other binary file should prompt a download.
    - Test the "Download Document" button to ensure it downloads the original file.

## Integration with Frontend Pages

### Add Upload Button (Example for All Documents Page)

To integrate the upload modal, add a button to the relevant page (e.g., the "All Documents Page" or a discipline-specific page). The `DocumentUploadModal` is designed to be reusable.

```javascript
// In client/src/pages/0200-all-documents/components/all-documents-page.js (or similar)
import { useModal } from "@components/modal/hooks/00170-useModal";
import DocumentUploadModal from "@pages/0200-all-documents/components/modals/DocumentUploadModal.js"; // Import the modal component

const AllDocumentsPage = () => {
  const { openModal, closeModal, isModalOpen } = useModal(); // Use isModalOpen to conditionally render

  const handleOpenUploadModal = () => {
    openModal("documentUploadModal", {
      // Use the modalKey registered in modalRegistry.js
      // You can pass initial form data here if it's a discipline-specific upload
      // initialFormData: { department: 'construction' }
    });
  };

  return (
    <div>
      {/* ... existing page content ... */}

      <button
        onClick={handleOpenUploadModal}
        style={{
          padding: "10px 15px",
          backgroundColor: "#FFDAB9",
          color: "#000000",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Upload New Document
      </button>

      {/* Render the modal if it's open */}
      {isModalOpen("documentUploadModal") && (
        <DocumentUploadModal
          onClose={() => closeModal("documentUploadModal")}
          // Pass any other props needed by the modal
        />
      )}
    </div>
  );
};
```

**Note**: Ensure `documentUploadModal` is registered in `client/src/generated/modalRegistry.js` (which is auto-generated from `modal_configurations` table).

## Troubleshooting

### Common Issues

#### 1. Modal Not Appearing

**Symptoms**: Button click doesn't open modal
**Solutions**:

- Verify modal is registered in database
- Check browser console for errors
- Ensure client was rebuilt after modal registration

#### 2. File Upload Fails

**Symptoms**: Upload button shows error
**Solutions**:

- Check server logs for detailed error messages
- Verify Flowise API credentials in `.env`
- Ensure Supabase service role key is correct
- Check file size (max 50MB)

#### 3. Document Categories Not Loading

**Symptoms**: Dropdown is empty
**Solutions**:

- Verify `document_categories` table was created
- Check Supabase client connection
- Review browser console for fetch errors

#### 4. Flowise Integration Issues

**Symptoms**: "Make searchable" uploads fail
**Solutions**:

- Verify `FLOWISE_DOCUMENT_STORE_ID` is correct
- Check Flowise instance is accessible
- Ensure Flowise API key has proper permissions
- Review Flowise logs for processing errors

### Debug Mode

Enable detailed logging by adding to your `.env`:

```bash
DEBUG=true
LOG_LEVEL=debug
```

### Health Check Endpoints

Test system health:

```bash
# Test document stores
curl http://localhost:3001/api/documents/stores

# Test server status
curl http://localhost:3001/health
```

## Security Considerations

### File Upload Security

The system includes several security measures:

1. **File Type Validation**: Only allows document types (PDF, Word, Excel, Text)
2. **File Size Limits**: Maximum 50MB per file
3. **Authentication**: Requires valid Supabase session
4. **Path Sanitization**: Prevents directory traversal attacks

### API Security

- All endpoints require authentication
- Service role key used for server-side operations
- Input validation on all form fields
- Error messages don't expose sensitive information

## Performance Optimization

### Database Indexes

The implementation includes optimized indexes:

```sql
-- Document stores
CREATE INDEX idx_document_stores_name ON document_stores(name);
CREATE INDEX idx_document_stores_active ON document_stores(is_active);

-- Document control
CREATE INDEX idx_doccontrol_store_id ON a_00900_doccontrol_documents(store_id);
CREATE INDEX idx_doccontrol_storage_type ON a_00900_doccontrol_documents(storage_type);
CREATE INDEX idx_doccontrol_is_embedded ON a_00900_doccontrol_documents(is_embedded);
```

### File Upload Optimization

- Uses memory storage for processing (faster than disk)
- Streams large files to prevent memory issues
- Implements proper cleanup on errors

## Monitoring and Maintenance

### Log Monitoring

Monitor these log patterns:

```bash
# Successful uploads
grep "Document successfully" server.log

# Failed uploads
grep "Upload failed" server.log

# Flowise API errors
grep "Flowise API error" server.log
```

### Database Maintenance

Regular maintenance tasks:

```sql
-- Check document category usage
SELECT
  dc.name,
  COUNT(doc.id) as document_count,
  SUM(CASE WHEN doc.is_embedded THEN 1 ELSE 0 END) as embedded_count
FROM document_categories dc
LEFT JOIN a_00900_doccontrol_documents doc ON dc.id = doc.category_id
GROUP BY dc.id, dc.name;

-- Clean up orphaned documents (if needed)
DELETE FROM a_00900_doccontrol_documents
WHERE category_id NOT IN (SELECT id FROM document_categories WHERE is_active = true);
```

## Success Verification

### Functional Tests

Verify these capabilities work:

- ✅ Document stores load in dropdown
- ✅ File drag-and-drop works
- ✅ File selection via click works
- ✅ Title auto-populates from filename
- ✅ Form validation prevents empty submissions
- ✅ Searchable documents go to Flowise
- ✅ Non-searchable documents go to Supabase bucket
- ✅ Success/error messages display correctly
- ✅ Form resets after successful upload

### Integration Tests

Verify these integrations work:

- ✅ Modal opens from Document Control page
- ✅ Supabase client connects successfully
- ✅ Document stores fetch correctly
- ✅ File uploads to correct storage
- ✅ Metadata saves to manifest table
- ✅ Vector search finds uploaded documents

## Next Steps

After successful deployment:

1. **User Training**: Train document control specialists on the new interface
2. **Monitoring Setup**: Implement monitoring for upload success rates
3. **Backup Verification**: Ensure document stores are included in backups
4. **Performance Tuning**: Monitor and optimize based on usage patterns
5. **Feature Enhancement**: Consider implementing bulk upload, versioning, etc.

## File Structure Summary

The implementation follows the project's naming conventions:

### Server Files

- **Services**: `server/services/flowiseService.js` (updated for original document retrieval)
- **Routes**: `server/routes/document-routes.js` (updated for Supabase Storage priority)
- **Main App**: `server/src/index.js` (updated CSP)

### Client Files

- **Upload Service**: `client/src/common/js/utils/document-upload-service.js` (NEW)
- **Upload Modal**: `client/src/pages/0200-all-documents/components/modals/DocumentUploadModal.js` (updated to use new service)
- **Detail Modal**: `client/src/pages/0200-all-documents/components/modals/DocumentDetailModal.js` (updated for viewing from storage)
- **Main App**: `client/src/App.js` (Supabase client access)

### Client Files

- **Modal**: `client/src/pages/00900-document-control/components/modals/00900-DocumentUploadModal.js`
- **Button Component**: `client/src/pages/0200-all-documents/components/0200-DocumentUploadButton.js`

### Scripts & SQL

- **Category Management**:
  - `scripts/sync-document-categories.js` - Syncs discipline-based categories
  - `sql/create_document_categories_table.sql` - Creates category table
  - `sql/add-category-column.sql` - Adds category_id to documents

- **Document Processing**:
  - `scripts/get-all-document-stores.js` - Discovers document stores
  - `sql/enhance_doccontrol_documents_table.sql` - Adds Flowise columns
  - `sql/register_document_upload_modal.sql` - Registers upload modal

- **Migration**:
  - `sql/migrate-document-system-rationalization.sql` - Consolidates document tables
  - `run-migration.js` - Executes migration scripts

### Configuration

- **Environment Template**: `.env.flowise.example`

---

**Deployment Version**: 1.0  
**Last Updated**: 2025-06-26  
**Tested On**: Development Environment  
**Production Ready**: Yes (with proper configuration)
