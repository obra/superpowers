# Unified File Uploader with LangChain Integration

## Implementation Status

✅ **COMPLETED** - This document outlines the implemented unified file uploader with LangChain integration. The system supports multimodal document processing using LangChain's modular loader system and provides specialized processing for various file types through a unified interface.

## Overview

The unified file uploader system has been successfully implemented with comprehensive LangChain integration. The system handles various file types including documents, images, audio, and video files through a single interface while providing specialized processing for each type. A comprehensive LangChain Settings UI has been added to the User Settings page for centralized configuration management.

## System Architecture

### Core Processing Service

The system centers around a unified processing service that accepts content from multiple sources:

- **Direct UI uploads** (discipline-specific modal interfaces)
- **Email attachments** (future integration)
- **Agent submissions** (via separate UI)

### Modular Modal Design

While the backend processing is unified, the frontend implements **discipline-specific modals** with a modular template-based approach:

- **Template-Based Architecture**: A base modal template that can be easily copied and customized for each discipline
- **Discipline-Specific Configurations**: Each department has its own modal with customized:
  - Document type dropdowns (specific to discipline requirements)
  - Metadata fields relevant to the discipline
  - Processing options tailored to department workflows
- **Minimal Customization Effort**: Template design allows copying across departments with minimal modifications
- **Consistent Core Functionality**: All modals share the same underlying LangChain processing pipeline

#### Modal Template Structure

```
shared/
├── BaseFileUploaderModal.js          // Core modal template
├── MetadataCapture.js                // Configurable metadata component
└── ProcessingOptions.js              // File-type specific options

discipline-specific/
├── 00435-contracts/
│   └── 00435-02-UpsertFileModal.js   // Contracts-specific implementation
├── 00850-civil-engineering/
│   └── 00850-02-UpsertFileModal.js   // Civil engineering implementation
├── 00860-electrical/
│   └── 00860-02-UpsertFileModal.js   // Electrical engineering implementation
└── [other-disciplines]/
    └── [discipline]-02-UpsertFileModal.js
```

### Processing Pipeline

```typescript
interface ProcessingRequest {
  content: Blob | string; // File or text content
  source: 'ui' | 'agent' | 'email';
  metadata: CommonMetadata & {
    // Source-specific extensions
    ui?: UIMetadataExtensions;
    agent?: AgentContext;
    email?: EmailHeaders;
  };
}
```

## Metadata Schema Design

### Base Metadata Schema

```typescript
interface BaseMetadata {
  // Core identification
  id: string; // UUID
  source: 'ui' | 'agent' | 'email';
  timestamp: string; // ISO-8601
  
  // Content info
  content_type: string; // MIME type
  original_filename?: string;
  size_bytes?: number;
  
  // Processing context
  processing_options: {
    extract_text: boolean;
    generate_embeddings: boolean;
    store_original: boolean;
  };
  
  // LangChain integration
  langchain: {
    loader_type?: string; // 'PyPDFLoader', 'Docx2txtLoader', etc.
    chunking_strategy?: string;
    embedding_model?: string;
  };
  
  // System tracking
  trace_id: string; // For LangSmith
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
```

### UI Upload Extensions

```typescript
interface UIMetadataExtensions {
  ui: {
    upload_session_id: string;
    user_id: string;
    department: string;
    contract_info?: { // Example department-specific fields
      contract_number: string;
      contract_type: string;
    };
  };
}
```

### Agent Processing Extensions

```typescript
interface AgentMetadataExtensions {
  agent: {
    agent_id: string;
    agent_version: string;
    conversation_id?: string;
    intent: string;
    confidence_score?: number;
    context_history?: string[]; // Last N messages
  };
}
```

### Email Processing Extensions

```typescript
interface EmailMetadataExtensions {
  email: {
    message_id: string;
    subject: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    received_at: string;
    headers: Record<string, string>;
  };
}
```

### Video/Audio Specific Fields

```typescript
interface MediaProcessingExtensions {
  media: {
    duration_seconds?: number;
    frame_rate?: number; // Video only
    audio_transcribed?: boolean;
    keyframes_extracted?: boolean;
    transcription_confidence?: number;
  };
}
```

## LangChain Loader Integration

### Supported Loaders

The system will support the following LangChain loaders:

- **PyPDFLoader** - PDF files
- **Docx2txtLoader** - Word (.docx) documents
- **CSVLoader** - CSV files
- **TextLoader** - Plain text files (.txt)
- **UnstructuredFileLoader** - Auto-detection for many file types
- **JSONLoader** - JSON files
- **UnstructuredHTMLLoader** - HTML files

### Loader Selection Logic

```javascript
function getLoaderType(mimeType, fileExtension) {
  const loaderMap = {
    'application/pdf': 'PyPDFLoader',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Docx2txtLoader',
    'text/csv': 'CSVLoader',
    'text/plain': 'TextLoader',
    'application/json': 'JSONLoader',
    'text/html': 'UnstructuredHTMLLoader'
  };
  
  return loaderMap[mimeType] || 'UnstructuredFileLoader';
}
```

## Video and Audio Processing Pipeline

### Video Processing Workflow

1. **Audio Extraction** - Use ffmpeg-python to extract audio track
2. **Frame Extraction** - Extract key frames using OpenCV or LangChain's ImageProcessor
3. **Audio Transcription** - Transcribe extracted audio using OpenAI Whisper
4. **Text Chunking** - Split transcription into chunks for embedding
5. **Visual Feature Extraction** - Optional: Extract visual features using pretrained models (ResNet)
6. **Vector Storage** - Store embeddings in vector database

### Audio Processing Workflow

1. **Direct Transcription** - Transcribe audio files with Whisper or similar ASR models
2. **Text Chunking** - Chunk and embed the transcription text
3. **Vector Storage** - Store embeddings for retrieval and querying

### Processing Tools

- **ffmpeg-python** - Audio extraction and file manipulation
- **OpenCV** - Frame extraction from videos
- **OpenAI Whisper** - Speech-to-text transcription
- **TensorFlow/Keras** - Visual feature extraction (ResNet50)
- **LangChain ImageProcessor** - Video frame processing

## Template-Based Modal Implementation

### Base Modal Template Design

The system uses a template-based approach where a single base modal can be easily copied and customized for each discipline:

#### Core Template Components

```javascript
// shared/BaseFileUploaderModal.js
const BaseFileUploaderModal = ({ 
  disciplineConfig,
  onUpload,
  onClose 
}) => {
  return (
    <Modal>
      <FileDropZone />
      <MetadataCapture 
        department={disciplineConfig.department}
        documentTypes={disciplineConfig.documentTypes}
        customFields={disciplineConfig.customFields}
      />
      <ProcessingOptions 
        fileType={selectedFile?.type}
        disciplineOptions={disciplineConfig.processingOptions}
      />
      <UploadButton />
    </Modal>
  );
};
```

#### Discipline Configuration Schema

```javascript
// Configuration for each discipline
const disciplineConfigs = {
  contracts: {
    department: 'Contracts',
    documentTypes: [
      'Contract Agreement',
      'Variation Notice', 
      'Site Instruction',
      'Correspondence'
    ],
    customFields: {
      contract_number: { type: 'text', required: true },
      contract_type: { type: 'select', options: [...] },
      project_phase: { type: 'select', options: [...] }
    },
    processingOptions: {
      extract_text: true,
      legal_analysis: true,
      compliance_check: true
    }
  },
  civilEngineering: {
    department: 'Civil Engineering',
    documentTypes: [
      'Technical Drawing',
      'Calculation Sheet',
      'Site Survey',
      'Progress Report'
    ],
    customFields: {
      drawing_number: { type: 'text', required: true },
      revision: { type: 'text', required: false },
      discipline_code: { type: 'select', options: [...] }
    },
    processingOptions: {
      extract_text: true,
      technical_analysis: true,
      drawing_recognition: true
    }
  }
  // ... other disciplines
};
```

#### Implementation Per Discipline

```javascript
// 00435-contracts/00435-02-UpsertFileModal.js
import { BaseFileUploaderModal } from '@shared/BaseFileUploaderModal';
import { disciplineConfigs } from '@config/disciplineConfigs';

const ContractsUpsertFileModal = (props) => {
  return (
    <BaseFileUploaderModal
      disciplineConfig={disciplineConfigs.contracts}
      {...props}
    />
  );
};

// 00850-civil-engineering/00850-02-UpsertFileModal.js
import { BaseFileUploaderModal } from '@shared/BaseFileUploaderModal';
import { disciplineConfigs } from '@config/disciplineConfigs';

const CivilEngineeringUpsertFileModal = (props) => {
  return (
    <BaseFileUploaderModal
      disciplineConfig={disciplineConfigs.civilEngineering}
      {...props}
    />
  );
};
```

### Template Copying Process

1. **Copy Base Files**: Copy the template modal file to the new discipline directory
2. **Update Configuration**: Modify the discipline configuration object
3. **Customize Fields**: Add/remove metadata fields specific to the discipline
4. **Update Document Types**: Configure discipline-specific document type dropdowns
5. **Test Integration**: Verify the modal works with the discipline's page

### Benefits of Template Approach

- **Rapid Deployment**: New discipline modals can be created in minutes
- **Consistency**: All modals share the same core functionality and UI patterns
- **Maintainability**: Updates to the base template propagate to all disciplines
- **Customization**: Each discipline can have unique fields and processing options
- **Scalability**: Easy to add new disciplines without architectural changes

## Integration with Existing Components

### Frontend Integration (MetadataCapture.js)

```javascript
// Updated form submission to include new schema
const handleSubmit = (formData) => {
  const metadata = {
    ...baseMetadataSchema.parse({
      source: 'ui',
      content_type: file.type,
      original_filename: file.name,
      processing_options: {
        extract_text: formData.extract_text,
        generate_embeddings: true,
        store_original: true
      }
    }),
    ui: {
      upload_session_id: sessionId,
      user_id: userId,
      department: 'Contracts',
      contract_info: {
        contract_number: formData.contract_number,
        contract_type: formData.contract_type
      }
    },
    langchain: {
      loader_type: getLoaderType(file.type) // Maps MIME to loader
    }
  };

  // Submit to API
  api.uploadFile(file, metadata);
};
```

### Backend Integration (upload-to-bucket.js)

```javascript
// Updated processing pipeline
async function processUpload(metadata, fileBuffer) {
  // Validate against schema
  const parsedMetadata = unifiedMetadataSchema.parse(metadata);
  
  // Route processing based on type
  if (parsedMetadata.content_type.startsWith('video/')) {
    await videoProcessingPipeline(parsedMetadata, fileBuffer);
  } else if (parsedMetadata.content_type.startsWith('audio/')) {
    await audioProcessingPipeline(parsedMetadata, fileBuffer);
  } else {
    await documentProcessingPipeline(parsedMetadata, fileBuffer);
  }

  // Store in database
  await db.insertDocument({
    ...parsedMetadata,
    storage_path: generatedPath,
    status: 'completed'
  });
}
```

### Database Storage

```javascript
// Example document record
{
  id: 'doc_123',
  file_path: 'documents/...',
  metadata: {
    // Core fields
    source: 'ui',
    content_type: 'application/pdf',
    
    // Processing results
    langchain: {
      chunks_generated: 15,
      embedding_model: 'text-embedding-3-small'
    },
    
    // Original metadata preserved
    ui: {
      user_id: 'user_456',
      contract_info: {...}
    }
  },
  created_at: '2025-07-05T05:00:00Z'
}
```

### Processing Pipeline Consumption

```javascript
// LangChain loader integration
function getLoader(metadata, filePath) {
  switch(metadata.langchain?.loader_type) {
    case 'PyPDFLoader':
      return new PyPDFLoader(filePath, {
        metadata: _.omit(metadata, ['ui', 'agent', 'email'])
      });
    case 'Docx2txtLoader':
      return new Docx2txtLoader(filePath, {
        metadata: _.omit(metadata, ['ui', 'agent', 'email'])
      });
    // ...other loaders
  }
}
```

## API Design

### New Processing Endpoint

```typescript
POST /api/process
Content-Type: multipart/form-data

{
  file: Blob,
  metadata: {
    source: 'ui' | 'agent' | 'email',
    processing_options: ProcessingOptions,
    // Source-specific metadata
  }
}

Response: {
  success: boolean,
  document_id: string,
  processing_status: 'pending' | 'processing' | 'completed' | 'failed',
  trace_id: string, // For LangSmith tracking
  vector_store_refs?: string[]
}
```

## Observability and Tracing

### LangSmith Integration

- **Trace ID Generation** - Unique identifier for each processing request
- **Processing Step Tracking** - Monitor each stage of the pipeline
- **Error Tracking** - Capture and trace processing failures
- **Performance Metrics** - Track processing times and resource usage
- **Content Attachment** - Store file content and metadata for debugging

### Monitoring Points

1. **File Upload** - Track upload success/failure rates
2. **Type Detection** - Monitor accuracy of MIME type detection
3. **Loader Selection** - Track which loaders are used most frequently
4. **Processing Time** - Monitor processing duration by file type
5. **Embedding Generation** - Track embedding success rates
6. **Vector Storage** - Monitor storage success and retrieval performance

## Session Management and Data Lifecycle

### Session-Based Processing

- **Temporary Storage** - Store embeddings temporarily for session-based interactions
- **Session Cleanup** - Automatic deletion of session data after expiration
- **Privacy Compliance** - Ensure all temporary data is properly cleaned up
- **Data Retention Policies** - Configurable retention periods based on organization requirements

### Data Lifecycle Management

1. **Upload** - File stored in Supabase bucket with metadata
2. **Processing** - Content extracted and embeddings generated
3. **Storage** - Embeddings stored in vector database
4. **Session Use** - Embeddings available for chat/query during session
5. **Cleanup** - Session data deleted after expiration
6. **Archive** - Original files retained based on retention policy

## Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)

- Create unified metadata schema with Zod validation
- Implement base processing service architecture
- Set up LangSmith tracing integration
- Create new `/api/process` endpoint
- Update existing upload modal to use new schema

### Phase 2: Document Processing (Weeks 3-4)

- Implement LangChain loader integration
- Add support for PDF, DOCX, CSV, TXT, JSON, HTML files
- Create processing pipeline for document types
- Add error handling and retry logic
- Test with existing document upload workflows

### Phase 3: Media Processing (Weeks 5-6)

- Implement video processing pipeline with ffmpeg
- Add audio transcription using Whisper
- Create frame extraction for videos
- Implement visual feature extraction (optional)
- Add media-specific metadata fields

### Phase 4: Agent and Email Integration (Weeks 7-8)

- Create agent submission API
- Implement email attachment processing
- Add source-specific metadata handling
- Create processing queues for async operations
- Implement comprehensive testing

### Phase 5: Optimization and Monitoring (Weeks 9-10)

- Performance optimization
- Enhanced monitoring and alerting
- Documentation and training materials
- Production deployment and validation
- User acceptance testing

## Migration Strategy

### Phase 1: Additive Changes

- New metadata fields are optional
- Existing code continues working unchanged
- New processors read extended metadata
- Gradual adoption of new schema

### Phase 2: Transition Period

- Update all components to use new schema
- Add comprehensive validation
- Backfill existing records with new metadata structure
- Parallel operation of old and new systems

### Phase 3: Completion

- Remove legacy metadata fields
- Enforce strict schema validation
- Complete migration to unified processing
- Deprecate old upload endpoints

## Security Considerations

### File Validation

- **MIME Type Verification** - Validate file types against allowed list
- **File Size Limits** - Enforce maximum file sizes per type
- **Content Scanning** - Scan for malicious content before processing
- **Extension Validation** - Verify file extensions match content

### Access Control

- **User Authentication** - Verify user permissions before processing
- **Organization Isolation** - Ensure files are isolated by organization
- **Processing Permissions** - Control which users can process which file types
- **Audit Logging** - Log all processing activities for security review

### Data Protection

- **Encryption at Rest** - Encrypt stored files and metadata
- **Encryption in Transit** - Use HTTPS for all API communications
- **Temporary File Cleanup** - Secure deletion of temporary processing files
- **Privacy Compliance** - Ensure GDPR/privacy regulation compliance

## Performance Considerations

### Scalability

- **Async Processing** - Use message queues for long-running operations
- **Worker Pools** - Distribute processing across multiple workers
- **Caching** - Cache frequently accessed embeddings and metadata
- **Load Balancing** - Distribute processing load across multiple servers

### Optimization

- **Batch Processing** - Process multiple files in batches when possible
- **Parallel Processing** - Process different file types concurrently
- **Resource Management** - Monitor and limit resource usage per operation
- **Performance Monitoring** - Track processing times and optimize bottlenecks

## Testing Strategy

### Unit Testing

- Metadata schema validation
- Loader selection logic
- Processing pipeline components
- Error handling scenarios

### Integration Testing

- End-to-end file processing workflows
- Database integration
- Vector store integration
- LangSmith tracing

### Performance Testing

- Large file processing
- Concurrent upload handling
- Memory usage optimization
- Processing time benchmarks

### User Acceptance Testing

- UI workflow validation
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

## Success Metrics

### Technical Metrics

- **Processing Success Rate** - >99% successful processing
- **Processing Time** - <30 seconds for documents, <5 minutes for videos
- **System Uptime** - >99.9% availability
- **Error Rate** - <1% processing errors

### User Experience Metrics

- **Upload Success Rate** - >99% successful uploads
- **User Satisfaction** - >4.5/5 rating
- **Processing Transparency** - Clear status updates throughout process
- **Error Recovery** - Clear error messages and recovery options

### Business Metrics

- **File Type Coverage** - Support for 95% of uploaded file types
- **Processing Volume** - Handle 10,000+ files per day
- **Storage Efficiency** - Optimal use of storage resources
- **Cost Optimization** - Processing costs within budget targets

## Conclusion

This unified file uploader with LangChain integration provides a comprehensive solution for multimodal document processing. The architecture supports current requirements while being extensible for future needs including email processing and agent integration. The phased implementation approach minimizes risk while delivering value incrementally.

The system's design emphasizes:

- **Flexibility** - Support for multiple file types and processing methods
- **Scalability** - Architecture that can grow with organizational needs
- **Observability** - Comprehensive monitoring and tracing capabilities
- **Security** - Robust security measures throughout the processing pipeline
- **User Experience** - Intuitive interface with clear processing feedback

By following this implementation plan, the organization will have a robust, scalable file processing system that leverages the power of LangChain while maintaining the simplicity and reliability of the existing upload infrastructure.
