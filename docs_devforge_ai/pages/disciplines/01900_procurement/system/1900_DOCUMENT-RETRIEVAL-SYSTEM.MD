# 1300_01900_DOCUMENT_RETRIEVAL_SYSTEM.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-09-21): Initial documentation for automatic document retrieval system

## Overview
This document outlines the **Automatic Document Retrieval System** implemented for the Procurement and Sales modules. The system automatically downloads and processes all related documents when tender opportunities are selected in the Fetched Tender Opportunities modal.

### Module Support
- **01900 - Procurement Module**: Full document retrieval and tender management
- **00875 - Sales Module**: Standalone tender management pages with document retrieval integration

## Requirements
- Automatically retrieve all related documents for selected tenders
- Download documents and insert them into the applicable database table
- Queue management for bulk document downloads
- Error handling and retry mechanisms
- Progress tracking and user feedback
- Support for multiple document types and formats

## Implementation

### 🗄️ **Database Schema (sql/document_management_system.sql)**

#### Core Tables

**document_download_queue**
- Manages concurrent document downloads
- Tracks download priority, status, and retry attempts
- Stores download options (timeout, headers, authentication)

**tender_documents**
- Stores processed documents with metadata
- Includes checksums for duplicate detection
- Supports multiple formats (PDF, DOC, XLS, etc.)

**document_processing_history**
- Audit trail for all document processing operations
- Tracks processing metrics and performance data
- Stores metadata collected during processing

**document_access_logs**
- Tracks document access patterns
- Supports compliance and security monitoring
- Maintains user activity records

**document_categories**
- Categorizes documents by type and purpose
- Configurable category mappings
- Supports custom document classification

### 🔧 **Backend Implementation**

#### Document Retrieval Service (`server/src/services/document-retrieval-service.js`)

**Core Features:**
- **Queue Management**: Processes downloads in batches with configurable concurrency
- **Automatic Retries**: Exponential backoff for failed downloads
- **Format Detection**: Automatic MIME type and file extension detection
- **Checksum Validation**: MD5 hashing for duplicate document detection
- **Storage Integration**: Direct upload to Supabase Storage buckets
- **Error Recovery**: Comprehensive error handling with detailed logging

**Key Methods:**
```javascript
// Queue documents for download
async queueDocumentsForDownload(tenderId, documents, options)

// Process download queue
async processDownloadQueue()

// Download single document
async processDownloadJob(downloadJob)

// Upload to storage and create record
async createDocumentRecord(downloadJob, downloadResult)
```

#### API Endpoints (`server/src/routes/document-management-routes.js`)

**Endpoints:**
- `POST /api/documents/queue/:tenderId` - Queue documents for tender
- `GET /api/documents/queue/stats` - Get queue statistics
- `GET /api/documents/health` - Service health check
- `GET /api/documents/:tenderId` - Get documents for tender

### 🖥️ **Frontend Implementation**

#### PopulateTendersModal Enhancement (`client/src/pages/01900-procurement/components/modals/01900-PopulateTendersModal.js`)

**Document Retrieval Trigger:**
- Automatically called when tenders are selected
- Queues documents from Fetched Tender Opportunities
- Provides real-time feedback during download process
- Handles multiple concurrent downloads gracefully

**Integration Points:**
```javascript
// Trigger document download when tenders selected
const handleDocumentRetrieval = async (selectedTenders) => {
  const response = await api.queueDocuments(selectedTenders);
  // Update UI with progress feedback
};

// Integrate with existing tender population workflow
const handlePopulateTenders = async () => {
  // Existing tender population logic
  await populateSelectedTenders();

  // NEW: Automatic document retrieval
  await triggerDocumentDownload(selectedTenders);
};
```

### ⚙️ **System Configuration**

#### Storage Configuration
- **Bucket**: `tender-documents`
- **Folder Structure**: `{tender_id}/{document_type}/{filename}`
- **Allowed Extensions**: PDF, DOC, DOCX, XLS, XLSX, ZIP, images

#### Download Configuration
- **Timeout**: 30 seconds per document
- **Max Concurrency**: 5 simultaneous downloads
- **Max Retries**: 3 attempts with exponential backoff
- **Max File Size**: 100MB per document

#### Queue Configuration
- **Priority Levels**: 1 (low) to 5 (high)
- **Batch Processing**: 5 downloads per batch
- **Scheduling**: Automatic processing every 30 seconds

### 🚀 **Workflow Architecture**

#### 1. Document Discovery
```
User selects tenders in Fetched Tender Opportunities modal
↓
Modal calls backend API to queue documents
↓
Documents added to document_download_queue with status='queued'
```

#### 2. Download Processing
```
Background service processes queue every 30 seconds
↓
Downloads process in batches of 5 simultaneously
↓
Each download: fetch → validate → store → record metadata
↓
Updates document_download_queue status to 'completed' or 'failed'
```

#### 3. Document Storage
```
Successful downloads stored in Supabase Storage
↓
Metadata saved to tender_documents table
↓
Processing history logged to document_processing_history
↓
Access audit trail created in document_access_logs
```

#### 4. Error Handling
```
Failed downloads retried with exponential backoff (5, 10, 40 min delays)
↓
Maximum 3 retry attempts before marking as failed
↓
Failed downloads logged with detailed error information
↓
Queue statistics updated for monitoring and alerting
```

### 📊 **Database Schema Details**

#### tender_documents Table
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| tender_id | UUID | Foreign key to tenders |
| document_type | VARCHAR | Type classification |
| document_name | TEXT | Display name |
| document_category | VARCHAR | Higher-level categorization |
| file_path | TEXT | Storage path |
| file_url | TEXT | Public access URL |
| file_size | INTEGER | File size in bytes |
| mime_type | VARCHAR | MIME type |
| download_status | VARCHAR | Processing status |
| checksum_hash | TEXT | MD5 for deduplication |
| processing_status | VARCHAR | Detailed processing state |
| metadata | JSONB | Extended document metadata |

#### document_download_queue Table
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| tender_id | UUID | Associated tender |
| document_url | TEXT | Source URL for download |
| document_type | VARCHAR | Document classification |
| priority | INTEGER | Queue priority (1-5) |
| status | VARCHAR | Queue status |
| retry_count | INTEGER | Number of retry attempts |
| created_at | TIMESTAMP | Creation timestamp |
| started_at | TIMESTAMP | Processing start time |
| completed_at | TIMESTAMP | Completion timestamp |

### 🔍 **API Integration**

#### Service Health Check
```javascript
GET /api/documents/health
Response: {
  "status": "healthy",
  "queue_stats": {
    "queued": 5,
    "processing": 2,
    "completed": 150,
    "failed": 3,
    "total": 160
  }
}
```

#### Queue Documents
```javascript
POST /api/documents/queue/:tenderId
Request: {
  "documents": [
    {
      "url": "https://example.com/doc.pdf",
      "type": "tender_specification"
    }
  ],
  "options": {
    "timeout": 30000,
    "headers": {...}
  }
}
Response: {
  "success": true,
  "queued": 1,
  "tender_id": "uuid-123"
}
```

### 🔒 **Security & Compliance**

#### Access Control
- Documents linked to specific tenders and organizations
- User access logs maintained for audit trails
- API endpoints protected with authentication
- Download credentials isolated per organization

#### Data Protection
- Secure storage in Supabase Storage with encryption
- HTTPS-only document access
- Checksums prevent unauthorized document replacement
- Configurable retention policies

### 📈 **Monitoring & Analytics**

#### Queue Statistics
- Real-time queue status monitoring
- Processing rate tracking
- Error rate and failure analysis
- Performance metrics collection

#### Health Monitoring
- Service availability checks
- Database connection health
- Storage bucket accessibility
- API endpoint responsiveness

### 🎯 **Key Features**

#### ✅ **Automatic Document Retrieval**
- Triggered by tender selection in PopulateTendersModal
- Background processing with progress updates
- Support for multiple document types
- Configurable timeouts and retry policies

#### ✅ **Robust Queue Management**
- Priority-based processing
- Batch processing with concurrency limits
- Exponential backoff retry logic
- Comprehensive error handling

#### ✅ **Document Processing Pipeline**
- URL validation and security checks
- Content type detection
- File sanitization and naming
- Duplicate document detection
- Metadata extraction and storage

#### ✅ **Storage Integration**
- Direct Supabase Storage uploads
- Organized folder structure by tender/document type
- Public URL generation for access
- Storage quota management

#### ✅ **Audit & Compliance**
- Complete processing history
- Document access logging
- Checksum-based integrity checks
- Configurable retention policies

### 🛠️ **Maintenance & Operations**

#### Database Maintenance
- Index optimization for large document collections
- Archive cleanup for processed queues
- Statistics aggregation for reporting
- Backup verification and integrity checks

#### Service Maintenance
- Memory usage monitoring
- Connection pool management
- Log rotation and archiving
- Performance tuning based on load patterns

### 📋 **Testing & Quality Assurance**

#### Integration Tests
- End-to-end document download workflows
- Queue processing validation
- Storage integration verification
- API endpoint testing

#### Performance Tests
- Concurrent download capacity testing
- Large file processing validation
- Queue throughput measurement
- Error recovery testing

#### Security Tests
- Access control validation
- URL sanitization testing
- File upload security checks
- Data integrity verification

### 🚀 **Deployment Checklist**

- [x] Database schema deployed (`sql/document_management_system.sql`)
- [x] Server services restarted (DocumentRetrievalService initialized)
- [x] API endpoints registered (`/api/documents/*`)
- [x] Frontend modal updated (PopulateTendersModal)
- [x] Storage bucket configured (`tender-documents`)
- [x] Test document downloads successful
- [x] Queue processing verified
- [x] Monitoring dashboards enabled

### 🎉 **Success Metrics**

#### Operational Metrics
- **Document Download Success Rate**: >95%
- **Average Processing Time**: <30 seconds per document
- **Queue Processing Lag**: <5 minutes
- **System Uptime**: >99%

#### User Experience Metrics
- **Automated Processing**: Zero manual intervention required
- **Real-time Feedback**: Progress updates during downloads
- **Error Transparency**: Clear error messages for failed downloads
- **Performance**: Non-blocking UI during batch operations

### 📚 **Related Documentation**

- **[1300_01900 Procurement Database Integration](./1300_01900_PROCUREMENT_DATABASE_INTEGRATION.md)** - Tender management system details
- **[0000_DOCUMENTATION_GUIDE.md](./0000_DOCUMENTATION_GUIDE.md)** - Main documentation guide
- **[0200_SYSTEM_ARCHITECTURE.md](./0200_SYSTEM_ARCHITECTURE.md)** - System architecture overview
