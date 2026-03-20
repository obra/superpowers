# 1650 - UpsertFileModal AI Enhancement Plan

## Executive Summary
This document outlines the enhancement of the 00435-02-UpsertFileModal.js to integrate with pathGenerationService and document numbering utilities while adding AI-assisted document processing capabilities.

## Current State Analysis
### Existing Components
- **UpsertFileModal**: Handles document uploads for Contracts Post-Award
- **pathGenerationService**: Generates standardized document paths
- **Document Numbering System**: Organization-based numbering (1600_DOCUMENT_NUMBERING_SYSTEM.md)

### Limitations
- Batch processing treats all files with same metadata
- No AI-assisted metadata extraction
- Manual path configuration
- No per-document processing options

## Enhanced Architecture

```
File Upload
    ↓
Per-Document Processing Pipeline:
    ↓
AI Document Analysis → Metadata Extraction
    ↓
Individual Form Section → Human Review
    ↓
Organization-Specific Path Generation
    ↓
Document Number Generation
    ↓
Validation & Upload
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. Restructure UpsertFileModal state management
2. Implement per-document processing queues
3. Add AI service integration points

### Phase 2: AI Integration
1. Implement document analysis service
2. Add metadata extraction from content
3. Create suggestion review interface

### Phase 3: Path & Numbering
1. Integrate pathGenerationService
2. Connect document numbering system
3. Implement validation rules

### Phase 4: UI Enhancements
1. Add document processing cards
2. Implement real-time previews
3. Add status indicators

## Technical Specifications

### AI Document Analysis Service
```javascript
class DocumentAnalysisService {
  async analyzeDocument(file) {
    // Extract text and analyze with AI
    return {
      organization: { id, name, confidence },
      project: { id, name, confidence },
      documentType: { value, confidence },
      summary: string,
      keyEntities: [...]
    };
  }
}
```

### Per-Document State Management
```javascript
const [documents, setDocuments] = useState({
  [fileId]: {
    file: File,
    status: 'queued'|'processing'|'completed',
    aiAnalysis: {...},
    metadata: {...},
    pathConfig: {...},
    processingOptions: {...}
  }
});
```

## Database Schema Changes

### New Tables
```sql
-- AI Analysis Results for Documents
CREATE TABLE document_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES a_00900_doccontrol_documents(id),
  analysis_results JSONB NOT NULL,
  confidence_scores JSONB NOT NULL,
  human_corrections JSONB,
  processing_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Path Configuration Templates
CREATE TABLE path_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organisations(id),
  name TEXT NOT NULL,
  components JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Processing Queue
CREATE TABLE document_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  document_id UUID REFERENCES a_00900_doccontrol_documents(id),
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  metadata JSONB,
  ai_analysis JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_document_ai_analysis_document_id ON document_ai_analysis(document_id);
CREATE INDEX idx_path_configurations_org_id ON path_configurations(organization_id);
CREATE INDEX idx_document_processing_queue_status ON document_processing_queue(status);
CREATE INDEX idx_document_processing_queue_file_id ON document_processing_queue(file_id);
```

## Risk Assessment

| Risk | Mitigation Strategy |
|------|---------------------|
| AI accuracy issues | Confidence thresholds + human review |
| Performance impact | Async processing + queue management |
| Naming standard violations | Rigid template enforcement |
| State management complexity | Isolated per-document state |

## Success Metrics
- 80% reduction in manual metadata entry
- 95% compliance with naming standards
- 50% faster document processing
- 100% organization-specific path generation

## Timeline
- Phase 1: 2 weeks
- Phase 2: 3 weeks
- Phase 3: 2 weeks
- Phase 4: 1 week
- Testing & Deployment: 2 weeks

## Dependencies
- pathGenerationService updates
- Document numbering system API
- AI service availability
