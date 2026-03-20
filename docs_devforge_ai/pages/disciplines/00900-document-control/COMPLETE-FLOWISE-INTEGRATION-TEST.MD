# Complete Flowise Integration Test Suite

## Overview

This document describes the comprehensive test suite for verifying the complete Flowise Document Store integration workflow, including template-based uploads, Supabase Storage, vector store processing, Record Manager functionality, and document viewing capabilities.

## Test Coverage

The test suite verifies the following components and workflows:

### 1. Prerequisites Verification
- Environment variables configuration
- Backend server connectivity
- Supabase database connection
- Record Manager table existence

### 2. Template Configuration
- Upload templates document store verification
- Template configuration retrieval for specific page prefixes
- Chunking and Record Manager configuration validation

### 3. Document Upload with Template
- Template-based document upload via `/api/documents/upsert-with-template`
- Automatic template selection based on page prefix
- Metadata collection and processing

### 4. Supabase Storage Integration
- Document record creation in `a_00900_doccontrol_documents` table
- File storage in Supabase Storage buckets
- Storage URL generation and accessibility

### 5. Flowise Vector Store Processing
- Document processing into vector embeddings
- Chunk creation and storage
- Vector store integration verification

### 6. Record Manager Functionality
- Duplicate prevention mechanism
- Record tracking in `flowise_record_manager` table
- Namespace and key management

### 7. Document Viewing
- View endpoint functionality (`/api/documents/:id/view`)
- Download endpoint functionality (`/api/documents/:id/download`)
- Metadata endpoint functionality (`/api/documents/:id/metadata`)

## Test Files

### Main Test Suite
**File:** `test-complete-flowise-integration.js`

**Purpose:** Comprehensive end-to-end testing of the entire Flowise integration workflow.

**Key Features:**
- Automated test document creation
- Step-by-step workflow verification
- Detailed logging and error reporting
- Automatic cleanup of test data

### Supporting Files
- `package.json` - Dependencies and test scripts
- `test-view-endpoint.js` - Standalone document viewing test server
- `test-modal-with-document.html` - Frontend testing interface

## Prerequisites

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Flowise Configuration
FLOWISE_API_URL=your_flowise_api_url
FLOWISE_API_KEY=your_flowise_api_key

# Record Manager Configuration (Transaction Pooler)
RECORD_MANAGER_HOST=aws-0-eu-central-1.pooler.supabase.com
RECORD_MANAGER_PORT=6543
RECORD_MANAGER_DATABASE=postgres
RECORD_MANAGER_USER=postgres.mseizswoiwyewsidknta
RECORD_MANAGER_PASSWORD=your_database_password
RECORD_MANAGER_POOL_MODE=transaction

# Optional: Backend Server Configuration
SERVER_PORT=3060
```

### Database Setup

Ensure the following database components are properly configured:

1. **Document Stores Table** (`document_stores`)
   - Contains active document stores
   - Includes upload templates store with ID `893b5d24-a6cc-4af2-b1fe-04fa07d265cb`

2. **Documents Table** (`a_00900_doccontrol_documents`)
   - Primary document metadata storage
   - Includes fields for Flowise integration

3. **Record Manager Table** (`flowise_record_manager`)
   - Tracks processed document chunks
   - Prevents duplicate processing

4. **Flowise Documents View** (`flowise_documents_with_stores`)
   - Provides combined view of Flowise documents and stores
   - Used for verification of vector store processing

### Backend Server

Ensure the backend server is running with the following endpoints:

- `GET /api/documents/stores` - Document stores listing
- `POST /api/documents/upsert-with-template` - Template-based upload
- `GET /api/flowise/template-config/:pagePrefix` - Template configuration
- `GET /api/documents/:id/view` - Document viewing
- `GET /api/documents/:id/download` - Document download
- `GET /api/documents/:id/metadata` - Document metadata

## Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Backend Server:**
   ```bash
   cd server
   npm start
   ```

## Running Tests

### Complete Integration Test

Run the comprehensive test suite:

```bash
npm run test:complete
```

**Expected Output:**
```
🧪 Complete Flowise Integration Test Suite
This test verifies the entire document workflow:
- Template-based document upload
- Supabase Storage integration
- Flowise vector store processing
- Record Manager duplicate prevention
- Document viewing functionality

🚀 Starting Complete Flowise Integration Test
============================================================

📋 Step 1: Verifying Prerequisites...
  🔍 Checking environment variables...
  ✅ Environment variables verified
  🔍 Checking backend server...
  ✅ Backend server is running
  🔍 Checking Supabase connection...
  ✅ Supabase connection verified
  🔍 Checking Record Manager table...
  ✅ Record Manager table exists

🔧 Step 2: Checking Template Configuration...
  🔍 Checking template for page prefix: 00435...
  ✅ Upload templates document store found
  ✅ Template configuration retrieved: {
    pagePrefix: '00435',
    hasChunkingConfig: true,
    hasRecordManager: true
  }

📤 Step 3: Testing Document Upload with Template...
  📤 Creating test document...
  📤 Uploading document with template...
  ✅ Document uploaded successfully: {
    documentId: 'uuid-here',
    flowiseDocumentId: 'flowise-id-here',
    pagePrefix: '00435',
    templateApplied: true
  }

💾 Step 4: Verifying Supabase Storage...
  🔍 Checking document record in database...
  ✅ Document record found: {
    id: 'uuid-here',
    title: 'Test Contract Document for Flowise Integration',
    storageType: 'supabase',
    hasStorageUrl: true,
    isEmbedded: true,
    flowiseDocumentId: 'flowise-id-here'
  }
  🔍 Verifying file in Supabase Storage...
  ✅ File verified in Supabase Storage

🔍 Step 5: Verifying Flowise Vector Store...
  🔍 Checking document in Flowise vector store...
  ✅ Document found in Flowise vector store: {
    id: 'flowise-id-here',
    documentName: 'test-contract-document.pdf',
    storeId: 'store-uuid',
    storeName: 'Contracts Post Award',
    totalChunks: 5,
    totalCharacters: 1250,
    status: 'SYNC'
  }
  ✅ Document processed into 5 chunks

🛡️ Step 6: Testing Record Manager (Duplicate Prevention)...
  🔍 Checking Record Manager entries...
  ✅ Found 5 Record Manager entries
  📊 Record Manager entry details: {
    namespace: 'flowise-id-here',
    key: 'chunk-key-1',
    groupId: 'group-id',
    updatedAt: '2025-06-28T04:39:00.000Z'
  }
  🔄 Testing duplicate prevention...
    📤 Attempting duplicate upload...
    ✅ Duplicate upload handled successfully
    📊 Record Manager prevented duplicate processing

👁️ Step 7: Testing Document Viewing...
  🔍 Testing document viewing endpoint...
  ✅ Document viewing endpoint working: {
    status: 200,
    contentType: 'application/pdf',
    contentLength: '622'
  }
  ✅ Document download endpoint working: {
    status: 200,
    contentType: 'application/pdf',
    contentDisposition: 'attachment; filename="test-contract-document.pdf"'
  }
  ✅ Document metadata endpoint working: {
    id: 'uuid-here',
    title: 'Test Contract Document for Flowise Integration',
    filename: 'test-contract-document.pdf',
    fileType: 'pdf',
    flowiseAvailable: true
  }

🧹 Step 8: Cleanup...
  🧹 Cleaning up test data...
  ✅ Document record deleted
  ✅ Cleanup completed

✅ Complete Flowise Integration Test PASSED!
============================================================

🎉 All tests completed successfully!
```

### Individual Test Components

**View Endpoint Test:**
```bash
npm run test:view
```

**Record Manager Test:**
```bash
npm run test:record-manager
```

## Test Configuration

### Test Document Settings

The test uses the following configuration:

```javascript
const TEST_CONFIG = {
  pagePrefix: '00435', // Contracts Post Award
  testDocumentTitle: 'Test Contract Document for Flowise Integration',
  testDocumentDescription: 'A comprehensive test document to verify the complete Flowise integration workflow',
  discipline: 'contracts',
  serverUrl: 'http://localhost:3060',
  testFilename: 'test-contract-document.pdf'
};
```

### Customizing Tests

To test different page prefixes or document types:

1. **Modify TEST_CONFIG** in `test-complete-flowise-integration.js`
2. **Update page prefix** to match your template configuration
3. **Adjust discipline** and document metadata as needed

Example for testing Engineering documents:

```javascript
const TEST_CONFIG = {
  pagePrefix: '00850', // Civil Engineering
  testDocumentTitle: 'Test Engineering Document',
  testDocumentDescription: 'Engineering document for testing',
  discipline: 'engineering',
  serverUrl: 'http://localhost:3060',
  testFilename: 'test-engineering-document.pdf'
};
```

## Troubleshooting

### Common Issues

**Issue:** `Missing required environment variable`
**Solution:** Ensure all required environment variables are set in `.env` file

**Issue:** `Backend server not responding`
**Solution:** Start the backend server and verify it's running on the correct port

**Issue:** `Upload templates document store not found`
**Solution:** Verify the upload templates store exists in the `document_stores` table with the correct Flowise ID

**Issue:** `Template configuration request failed`
**Solution:** Check that the page prefix has a corresponding template in the upload templates store

**Issue:** `No active document stores found`
**Solution:** Ensure at least one document store is marked as active in the database

**Issue:** `Document not found in Flowise vector store`
**Solution:** Check Flowise API connectivity and document processing status

### Debug Mode

Enable detailed logging by setting the `DEBUG` environment variable:

```bash
DEBUG=true npm run test:complete
```

### Manual Verification

If automated tests fail, you can manually verify components:

1. **Check Database Records:**
   ```sql
   SELECT * FROM a_00900_doccontrol_documents WHERE title LIKE '%Test%';
   SELECT * FROM flowise_record_manager WHERE namespace LIKE '%test%';
   ```

2. **Test API Endpoints:**
   ```bash
   curl -X GET "http://localhost:3060/api/documents/stores"
   curl -X GET "http://localhost:3060/api/flowise/template-config/00435"
   ```

3. **Verify Supabase Storage:**
   - Check the Supabase dashboard for uploaded files
   - Verify bucket permissions and policies

## Test Data Cleanup

The test suite automatically cleans up test data, but you can manually clean up if needed:

```sql
-- Remove test documents
DELETE FROM a_00900_doccontrol_documents 
WHERE title LIKE '%Test%' OR description LIKE '%test%';

-- Remove test Record Manager entries (optional)
DELETE FROM flowise_record_manager 
WHERE namespace LIKE '%test%';
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Flowise Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Setup environment
      run: |
        echo "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" >> .env
        echo "SUPABASE_SERVICE_KEY=${{ secrets.SUPABASE_SERVICE_KEY }}" >> .env
        echo "FLOWISE_API_URL=${{ secrets.FLOWISE_API_URL }}" >> .env
        echo "FLOWISE_API_KEY=${{ secrets.FLOWISE_API_KEY }}" >> .env
        
    - name: Start backend server
      run: |
        cd server
        npm install
        npm start &
        sleep 10
        
    - name: Run integration tests
      run: npm run test:complete
```

## Performance Considerations

### Test Execution Time

- **Complete test suite:** ~2-5 minutes
- **Individual components:** ~30-60 seconds each
- **Network-dependent:** Flowise API calls may add latency

### Resource Usage

- **Memory:** ~50MB for test execution
- **Storage:** Temporary test files (~1KB each)
- **Network:** API calls to Supabase and Flowise

### Optimization Tips

1. **Parallel Testing:** Run individual component tests in parallel
2. **Test Data Reuse:** Cache template configurations between tests
3. **Mock Services:** Use mocked services for faster unit testing
4. **Selective Testing:** Run only relevant tests during development

## Related Documentation

- [Document View Functionality](./1370_DOCUMENT_VIEW_FUNCTIONALITY.md)
- [Flowise Document Store Implementation](./1360_FLOWISE_DOCUMENT_STORE_IMPLEMENTATION_PLAN.md)
- [Flowise Record Manager Setup](./1362_FLOWISE_RECORD_MANAGER_SETUP_GUIDE.md)
- [All Documents Page Documentation](./1300_0200_ALL_DOCUMENTS_PAGE.md)

---

**Last Updated:** June 28, 2025  
**Author:** System Implementation  
**Status:** ✅ Dashboard Persistence Fix Validated - Service Recovery Required

## Current Status Update (June 28, 2025)

### ✅ **VALIDATED COMPONENTS**
- **Dashboard Persistence Fix**: ✅ **CONFIRMED WORKING** - Unique docId generation functioning correctly
- **Hybrid Storage System**: ✅ **FULLY OPERATIONAL** - Supabase storage and graceful degradation working
- **Client-Side Integration**: ✅ **FUNCTIONAL** - Build system and environment variables properly configured
- **Template System**: ✅ **WORKING** - Page prefix-based uploads and metadata handling operational

### ❌ **EXTERNAL SERVICE ISSUES**
- **Flowise Service Health**: ❌ **DEGRADED STATE** - API endpoints returning HTML instead of JSON
- **Document Loader Creation**: ❌ **FAILING** - Internal Flowise service problem with loader creation
- **Store Synchronization**: ❌ **CACHE ISSUES** - Recent store deletions not reflected in local cache

### **Next Actions Required**
1. **Restart Flowise service** in Render to restore API functionality
2. **Verify store cleanup** - confirm duplicate store deletion took effect
3. **Re-test end-to-end workflow** once service is restored

**For detailed validation results, see:** [Flowise Dashboard Persistence Fix Validation](./1373_FLOWISE_DASHBOARD_PERSISTENCE_FIX_VALIDATION.md)
