# Document Management Documentation

This document provides comprehensive documentation for the document management system, including Flowise integration, document storage, and processing workflows.

## Overview

The document management system handles the ingestion, storage, processing, and retrieval of documents across the EPCM platform, with deep integration into AI chatbot systems for intelligent document analysis.

## Core Table Structure

### flowise_documents
**Purpose**: Stores documents processed by Flowise chatbot system  
**Columns**:
- id (uuid) - Primary key
- store_id (uuid) - Foreign key to document_stores
- document_name (text) - Original document name
- file_name (text) - Stored filename
- mime_type (text) - Document MIME type
- file_extension (text) - File extension
- is_embedded (boolean) - Whether document is embedded
- flowise_document_id (text) - Flowise document ID
- created_at (timestamp) - Creation time

### document_stores
**Purpose**: Manages document storage locations and configurations  
**Columns**:
- id (uuid) - Primary key
- storage_type (text) - Storage provider (supabase, s3, etc.)
- storage_path (text) - Storage path prefix
- storage_url (text) - Base URL for storage
- created_at (timestamp) - Creation time

## Document Processing Workflow

### 1. Document Ingestion
- **Upload**: Documents uploaded through UI or API
- **Metadata extraction**: File name, MIME type, extension captured
- **Storage assignment**: Assigned to appropriate document store
- **Flowise registration**: Document registered with Flowise system

### 2. Embedding Process
- **Text extraction**: Content extracted from documents
- **Vector embedding**: Content converted to vector representations
- **Flowise integration**: Embedded documents available for chatbot queries
- **Status tracking**: `is_embedded` flag updated upon completion

### 3. Storage Architecture

#### Storage Types
- **supabase**: Primary storage using Supabase Storage
- **s3**: AWS S3 integration for scalable storage
- **local**: Local file system storage (development)

#### Storage Path Structure
```
{storage_type}://{storage_path}/{page_prefix}/{document_type}/{year}/{month}/
```

**Example**: `supabase://documents/00435/contracts/2024/07/`

## Document Categories

### Supported File Types
- **PDF**: Primary document format for contracts, reports
- **DOC/DOCX**: Microsoft Word documents
- **TXT**: Plain text files
- **CSV**: Data exports and reports
- **JSON**: Structured data and configurations

### Document Types by Page
| Page Prefix | Document Types | Use Cases |
|-------------|----------------|-----------|
| **00435** | Contracts, Legal docs, Correspondence | Contract analysis, legal review |
| **00889** | Financial reports, Budgets, Invoices | Financial analysis, budget tracking |
| **03010** | Emails, Attachments, Archives | Email processing, archive search |
| **00300** | Construction plans, Safety reports | Progress tracking, safety analysis |

## Flowise Integration

### Document Store Configuration
Each page has dedicated Flowise document stores:
- **00435-store**: Contracts and legal documents
- **00889-store**: Financial documents
- **03010-store**: Email archives
- **00300-store**: Construction documents

### Chatbot Integration
- **Vector search**: Documents embedded for semantic search
- **Context awareness**: Chatbots can reference specific documents
- **Real-time updates**: New documents immediately available
- **Multi-document queries**: Cross-document analysis capabilities

## API Integration

### Document Upload Endpoints
```javascript
// Upload document to specific store
POST /api/documents/upload
{
  "file": File,
  "store_id": "uuid",
  "document_name": "Contract_Agreement.pdf",
  "page_prefix": "00435"
}
```

### Document Query Endpoints
```javascript
// Search documents in store
GET /api/documents/search?store_id=uuid&query=contract terms

// Get document metadata
GET /api/documents/{document_id}/metadata

// Download document
GET /api/documents/{document_id}/download
```

## Storage Configuration

### Supabase Storage Setup
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('documents-00435', 'contracts-documents', true),
('documents-00889', 'finance-documents', true),
('documents-03010', 'email-documents', true),
('documents-00300', 'construction-documents', true);
```

### Document Store Records
```sql
-- Example document store configurations
INSERT INTO document_stores (id, storage_type, storage_path, storage_url) VALUES
('00435-store-uuid', 'supabase', 'documents/00435', 'https://storage.supabase.com'),
('00889-store-uuid', 'supabase', 'documents/00889', 'https://storage.supabase.com'),
('03010-store-uuid', 'supabase', 'documents/03010', 'https://storage.supabase.com'),
('00300-store-uuid', 'supabase', 'documents/00300', 'https://storage.supabase.com');
```

## Processing Status Tracking

### Document States
- **uploaded**: Document uploaded but not processed
- **processing**: Currently being embedded
- **embedded**: Successfully processed and available
- **failed**: Processing failed, needs retry
- **archived**: Document archived, not active

### Monitoring Queries
```sql
-- Get processing status by store
SELECT 
  ds.storage_type,
  COUNT(*) as total_documents,
  COUNT(CASE WHEN fd.is_embedded = true THEN 1 END) as embedded_documents,
  COUNT(CASE WHEN fd.is_embedded = false THEN 1 END) as pending_documents
FROM flowise_documents fd
JOIN document_stores ds ON fd.store_id = ds.id
GROUP BY ds.storage_type;

-- Get documents by page prefix
SELECT 
  fd.document_name,
  fd.mime_type,
  fd.is_embedded,
  fd.created_at
FROM flowise_documents fd
JOIN document_stores ds ON fd.store_id = ds.id
WHERE ds.storage_path LIKE '%00435%'
ORDER BY fd.created_at DESC;
```

## Security & Access Control

### Document Permissions
- **Page-level access**: Documents restricted by page prefix
- **Contributor permissions**: Based on contributor_id
- **Organization isolation**: Documents scoped to organizations
- **Audit logging**: All document access logged

### RLS Policies
```sql
-- Enable RLS on document tables
ALTER TABLE flowise_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_stores ENABLE ROW LEVEL SECURITY;

-- Create policies for document access
CREATE POLICY "Users can access documents from their organization"
ON flowise_documents FOR SELECT
USING (
  store_id IN (
    SELECT id FROM document_stores 
    WHERE organization_id = auth.jwt()->>'org_id'
  )
);
```

## Best Practices

### Document Naming
- Use descriptive, searchable names
- Include date/version in filename
- Follow consistent naming conventions
- Avoid special characters

### Storage Optimization
- Compress large documents before upload
- Use appropriate file formats (PDF for contracts, CSV for data)
- Implement document lifecycle policies
- Regular cleanup of unused documents

### Performance Considerations
- Batch document uploads when possible
- Implement document caching
- Use CDN for frequently accessed documents
- Monitor storage usage and costs

## Troubleshooting

### Common Issues
1. **Embedding failures**: Check document format and size
2. **Storage errors**: Verify storage credentials and permissions
3. **Flowise connectivity**: Ensure Flowise service is running
4. **Document not found**: Check storage path and file existence

### Debug Queries
```sql
-- Check for failed embeddings
SELECT * FROM flowise_documents 
WHERE is_embedded = false 
AND created_at < NOW() - INTERVAL '1 hour';

-- Verify storage configuration
SELECT * FROM document_stores 
WHERE storage_type = 'supabase' 
AND storage_url IS NOT NULL;

-- Check document count by type
SELECT 
  file_extension,
  COUNT(*) as count,
  AVG(LENGTH(file_name)) as avg_filename_length
FROM flowise_documents
GROUP BY file_extension
ORDER BY count DESC;
```

## Future Enhancements

### Planned Features
- **Document versioning**: Track document changes over time
- **OCR integration**: Extract text from scanned documents
- **Advanced search**: Full-text search with highlighting
- **Document workflows**: Approval and review processes

### Integration Roadmap
- **AI document classification**: Automatic categorization
- **Document summarization**: AI-generated summaries
- **Cross-store search**: Unified search across all stores
- **External storage**: Google Drive, Dropbox integration
