# Record Manager Data Storage Documentation

## 📊 **Overview**

The LangChain Record Manager stores all data in your existing Supabase PostgreSQL database across multiple interconnected tables with integrated vector data isolation. This document provides a complete reference for understanding where and how Record Manager data is stored, including vector isolation and access control features.

## 🗄️ **Database Schema Overview**

### **Storage Architecture**
```
📊 Your Supabase Database
├── 📋 a_00900_doccontrol_documents (ENHANCED + Vector Isolation)
├── 🔗 a_00900_doccontrol_document_embeddings (NEW)
├── ⚙️ a_00900_doccontrol_langchain_jobs (NEW + Isolation Context)
├── 👤 a_0900_user_langchain_settings (NEW)
├── 🛡️ vector_workspaces (NEW - Workspace Management)
├── 👥 user_organization_access (NEW - Access Control)
├── 🏢 user_discipline_access (NEW - Discipline Permissions)
├── 📊 audit_log_vector_isolation (NEW - Security Audit)
├── 🔍 access_log_vector_isolation (NEW - Access Monitoring)
└── 🚨 security_incident_log (NEW - Security Events)

📁 Supabase Storage
└── documents/ (File content storage)

🎯 Discipline-Specific Vector Tables
├── a_01900_procurement_vector (Procurement documents)
├── a_00435_contracts_post_vector (Contracts documents)
├── a_00850_civileng_vector (Civil Engineering documents)
└── [Additional discipline tables as needed]
```

## 📋 **Table Specifications**

### **1. Enhanced Documents Table: `a_00900_doccontrol_documents`**

#### **Purpose**
Your existing documents table enhanced with LangChain processing columns.

#### **New Columns Added**
```sql
-- LangChain Processing Metadata
langchain_metadata JSONB DEFAULT '{}'           -- Complete processing metadata
langchain_loader_type VARCHAR(100)              -- PyPDFLoader, Docx2txtLoader, etc.
langchain_processing_status VARCHAR(50)         -- pending, processing, completed, failed
langchain_trace_id UUID                         -- LangSmith trace ID for observability
langchain_chunk_count INTEGER DEFAULT 0         -- Number of text chunks generated
langchain_embedding_model VARCHAR(100)          -- text-embedding-3-small, etc.
langchain_embedding_provider VARCHAR(50)        -- openai, cohere, anthropic, etc.
langchain_processed_at TIMESTAMP WITH TIME ZONE -- When processing completed

-- Vector Isolation columns
access_scope VARCHAR(50) DEFAULT 'private'       -- private, team, shared, public, temporary
created_by_user_id UUID REFERENCES auth.users(id)
shared_with_disciplines TEXT[] DEFAULT ARRAY[]::TEXT[]
workspace_id UUID REFERENCES vector_workspaces(id)
workspace_type VARCHAR(50) DEFAULT 'personal'    -- personal, team, temporary, archive
document_type VARCHAR(100)                      -- contract, specification, report, etc.
auto_cleanup VARCHAR(50)                        -- cleanup period for temporary docs
deleted_at TIMESTAMP WITH TIME ZONE
deleted_by UUID REFERENCES auth.users(id)
deletion_reason TEXT
scheduled_hard_delete_at TIMESTAMP WITH TIME ZONE
organisation_id UUID
project_id UUID
discipline_code VARCHAR(10)
```

#### **Example Data**
```json
{
  "id": "doc-uuid-123",
  "file_name": "contract.pdf",
  "langchain_metadata": {
    "source": "ui",
    "processing_options": {
      "extract_text": true,
      "generate_embeddings": true,
      "chunk_size": 1000
    },
    "loader_config": {
      "extract_images": false,
      "ocr_enabled": true
    }
  },
  "langchain_loader_type": "PyPDFLoader",
  "langchain_processing_status": "completed",
  "langchain_trace_id": "trace-uuid-456",
  "langchain_chunk_count": 25,
  "langchain_embedding_model": "text-embedding-3-small",
  "langchain_embedding_provider": "openai",
  "langchain_processed_at": "2025-01-07T06:00:00Z"
}
```

### **2. Vector Embeddings Table: `a_00900_doccontrol_document_embeddings`**

#### **Purpose**
Stores text chunks and their vector embeddings for semantic search and retrieval.

#### **Complete Schema**
```sql
CREATE TABLE a_00900_doccontrol_document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES a_00900_doccontrol_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,              -- Sequential chunk number (0, 1, 2, ...)
    chunk_text TEXT NOT NULL,                  -- Actual text content of the chunk
    chunk_metadata JSONB DEFAULT '{}',         -- Chunk-specific metadata
    embedding VECTOR(1536),                    -- Vector embedding (1536 dimensions for OpenAI)
    embedding_model VARCHAR(100) NOT NULL,     -- Model used for embedding generation
    embedding_provider VARCHAR(50) NOT NULL,   -- Provider (openai, cohere, anthropic, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(document_id, chunk_index)           -- Ensure unique chunks per document
);
```

#### **Example Data**
```json
{
  "id": "embed-uuid-789",
  "document_id": "doc-uuid-123",
  "chunk_index": 0,
  "chunk_text": "This contract establishes the terms and conditions for the construction project...",
  "chunk_metadata": {
    "page_number": 1,
    "section": "introduction",
    "word_count": 150,
    "char_count": 892
  },
  "embedding": [0.123, -0.456, 0.789, ...], // 1536 dimensional vector
  "embedding_model": "text-embedding-3-small",
  "embedding_provider": "openai",
  "created_at": "2025-01-07T06:01:00Z"
}
```

### **3. Processing Jobs Table: `a_00900_doccontrol_langchain_jobs`**

#### **Purpose**
Manages asynchronous LangChain processing jobs with retry logic and status tracking.

#### **Complete Schema**
```sql
CREATE TABLE a_00900_doccontrol_langchain_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES a_00900_doccontrol_documents(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,             -- text_extraction, embedding_generation, video_processing, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    priority INTEGER DEFAULT 5,                -- 1 (highest) to 10 (lowest)
    
    -- Job Configuration
    job_config JSONB DEFAULT '{}',            -- Job-specific configuration
    
    -- Processing Details
    started_at TIMESTAMP WITH TIME ZONE,       -- When job processing started
    completed_at TIMESTAMP WITH TIME ZONE,     -- When job processing completed
    error_message TEXT,                        -- Error details if job failed
    retry_count INTEGER DEFAULT 0,             -- Number of retry attempts
    max_retries INTEGER DEFAULT 3,             -- Maximum retry attempts allowed
    
    -- LangSmith Integration
    trace_id UUID,                             -- LangSmith trace ID for observability
    langsmith_run_id VARCHAR(255),            -- LangSmith run ID
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Example Data**
```json
{
  "id": "job-uuid-101",
  "document_id": "doc-uuid-123",
  "job_type": "embedding_generation",
  "status": "completed",
  "priority": 5,
  "job_config": {
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "embedding_model": "text-embedding-3-small",
    "batch_size": 100
  },
  "started_at": "2025-01-07T06:00:30Z",
  "completed_at": "2025-01-07T06:01:45Z",
  "error_message": null,
  "retry_count": 0,
  "max_retries": 3,
  "trace_id": "trace-uuid-456",
  "langsmith_run_id": "run_abc123"
}
```

### **4. User Settings Table: `a_0900_user_langchain_settings`**

#### **Purpose**
Stores user-specific LangChain configuration settings and preferences.

#### **Complete Schema**
```sql
CREATE TABLE a_0900_user_langchain_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                     -- References auth.users(id) in Supabase
    organization_id UUID,                      -- Optional organization-specific settings
    
    -- LLM Configuration
    llm_provider VARCHAR(50) DEFAULT 'openai',
    llm_model VARCHAR(100) DEFAULT 'gpt-4o-mini',
    llm_api_key_encrypted TEXT,               -- Encrypted API key
    llm_base_url VARCHAR(255),                -- Custom base URL for local/custom providers
    llm_temperature DECIMAL(3,2) DEFAULT 0.1,
    llm_max_tokens INTEGER DEFAULT 4000,
    llm_timeout INTEGER DEFAULT 30000,        -- Timeout in milliseconds
    
    -- Embedding Configuration  
    embedding_provider VARCHAR(50) DEFAULT 'openai',
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    embedding_api_key_encrypted TEXT,         -- Encrypted API key
    embedding_base_url VARCHAR(255),          -- Custom base URL
    embedding_dimensions INTEGER DEFAULT 1536,
    embedding_batch_size INTEGER DEFAULT 100,
    
    -- Text Processing Configuration
    text_chunk_size INTEGER DEFAULT 1000,
    text_chunk_overlap INTEGER DEFAULT 200,
    text_separators JSONB DEFAULT '["\\n\\n", "\\n", " ", ""]',
    text_keep_separator BOOLEAN DEFAULT true,
    text_length_function VARCHAR(50) DEFAULT 'len',
    
    -- Processing Defaults
    enable_embeddings BOOLEAN DEFAULT true,
    enable_summarization BOOLEAN DEFAULT false,
    enable_keyword_extraction BOOLEAN DEFAULT false,
    enable_entity_extraction BOOLEAN DEFAULT false,
    batch_processing BOOLEAN DEFAULT true,
    max_concurrent_jobs INTEGER DEFAULT 3,
    retry_attempts INTEGER DEFAULT 3,
    retry_delay INTEGER DEFAULT 5000,         -- Delay between retries in milliseconds
    
    -- LangSmith Configuration
    langsmith_enabled BOOLEAN DEFAULT false,
    langsmith_api_key_encrypted TEXT,         -- Encrypted API key
    langsmith_project_name VARCHAR(100) DEFAULT 'simandou-ai-bundle',
    langsmith_endpoint VARCHAR(255) DEFAULT 'https://api.smith.langchain.com',
    langsmith_tracing_enabled BOOLEAN DEFAULT false,
    langsmith_evaluation_enabled BOOLEAN DEFAULT false,
    
    -- Vector Store Configuration
    vector_store_provider VARCHAR(50) DEFAULT 'supabase',
    vector_store_connection_string_encrypted TEXT, -- Encrypted connection string
    vector_store_table_name VARCHAR(100) DEFAULT 'a_00900_doccontrol_document_embeddings',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, organization_id)          -- One settings record per user per organization
);
```

#### **Example Data**
```json
{
  "id": "settings-uuid-202",
  "user_id": "user-uuid-303",
  "organization_id": "org-uuid-404",
  "llm_provider": "openai",
  "llm_model": "gpt-4o-mini",
  "llm_api_key_encrypted": "encrypted_key_data",
  "llm_temperature": 0.1,
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small",
  "embedding_dimensions": 1536,
  "text_chunk_size": 1000,
  "text_chunk_overlap": 200,
  "enable_embeddings": true,
  "langsmith_enabled": false,
  "created_at": "2025-01-07T05:00:00Z"
}
```

## 🔗 **Data Relationships**

### **Foreign Key Constraints**
```sql
-- Embeddings are linked to documents with CASCADE DELETE
a_00900_doccontrol_document_embeddings.document_id 
  → a_00900_doccontrol_documents.id ON DELETE CASCADE

-- Jobs are linked to documents with CASCADE DELETE  
a_00900_doccontrol_langchain_jobs.document_id 
  → a_00900_doccontrol_documents.id ON DELETE CASCADE

-- Settings are linked to Supabase auth users
a_0900_user_langchain_settings.user_id 
  → auth.users.id (Supabase authentication)
```

### **Data Flow Diagram**
```
📄 Document Upload
    ↓
📋 a_00900_doccontrol_documents (enhanced with LangChain columns)
    ↓
⚙️ a_00900_doccontrol_langchain_jobs (processing job created)
    ↓
🔗 a_00900_doccontrol_document_embeddings (chunks and vectors stored)
    ↑
👤 a_0900_user_langchain_settings (user preferences applied)
```

## 📈 **Performance Optimizations**

### **Database Indexes**
```sql
-- Document processing status queries
CREATE INDEX idx_documents_langchain_status 
ON a_00900_doccontrol_documents(langchain_processing_status);

-- LangSmith trace lookups
CREATE INDEX idx_documents_langchain_trace_id 
ON a_00900_doccontrol_documents(langchain_trace_id);

-- Document loader type queries
CREATE INDEX idx_documents_langchain_loader 
ON a_00900_doccontrol_documents(langchain_loader_type);

-- Embedding lookups by document
CREATE INDEX idx_embeddings_document_id 
ON a_00900_doccontrol_document_embeddings(document_id);

-- Embedding model queries
CREATE INDEX idx_embeddings_model 
ON a_00900_doccontrol_document_embeddings(embedding_model);

-- Job processing queries
CREATE INDEX idx_langchain_jobs_status 
ON a_00900_doccontrol_langchain_jobs(status);

-- Job priority and scheduling
CREATE INDEX idx_langchain_jobs_priority 
ON a_00900_doccontrol_langchain_jobs(priority, created_at);

-- Job document lookups
CREATE INDEX idx_langchain_jobs_document_id 
ON a_00900_doccontrol_langchain_jobs(document_id);

-- Job trace lookups
CREATE INDEX idx_langchain_jobs_trace_id 
ON a_00900_doccontrol_langchain_jobs(trace_id);

-- User settings lookups
CREATE INDEX idx_user_langchain_settings_user_id 
ON a_0900_user_langchain_settings(user_id);

-- Organization settings lookups
CREATE INDEX idx_user_langchain_settings_org_id 
ON a_0900_user_langchain_settings(organization_id);
```

### **Automatic Triggers**
```sql
-- Automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applied to all tables with updated_at columns
CREATE TRIGGER update_document_embeddings_updated_at 
    BEFORE UPDATE ON a_00900_doccontrol_document_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_langchain_jobs_updated_at 
    BEFORE UPDATE ON a_00900_doccontrol_langchain_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_langchain_settings_updated_at 
    BEFORE UPDATE ON a_0900_user_langchain_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔍 **Common Queries**

### **Get Document with All Related Data**
```sql
SELECT 
    d.*,
    COUNT(DISTINCT e.id) as embedding_count,
    COUNT(DISTINCT j.id) as job_count,
    MAX(j.completed_at) as last_job_completed
FROM a_00900_doccontrol_documents d
LEFT JOIN a_00900_doccontrol_document_embeddings e ON d.id = e.document_id
LEFT JOIN a_00900_doccontrol_langchain_jobs j ON d.id = j.document_id
WHERE d.id = $1
GROUP BY d.id;
```

### **Get User's LangChain Settings**
```sql
SELECT * FROM a_0900_user_langchain_settings 
WHERE user_id = $1 
AND (organization_id = $2 OR organization_id IS NULL)
ORDER BY organization_id NULLS LAST
LIMIT 1;
```

### **Get Processing Status for Multiple Documents**
```sql
SELECT 
    id,
    file_name,
    langchain_processing_status,
    langchain_chunk_count,
    langchain_processed_at,
    (SELECT COUNT(*) FROM a_00900_doccontrol_document_embeddings WHERE document_id = d.id) as actual_embedding_count
FROM a_00900_doccontrol_documents d
WHERE id = ANY($1);
```

### **Get Pending Processing Jobs**
```sql
SELECT * FROM a_00900_doccontrol_langchain_jobs 
WHERE status = 'pending' 
AND retry_count < max_retries
ORDER BY priority ASC, created_at ASC
LIMIT 10;
```

### **Get Document Embeddings for Vector Search**
```sql
SELECT 
    chunk_text,
    chunk_metadata,
    embedding
FROM a_00900_doccontrol_document_embeddings
WHERE document_id = $1
ORDER BY chunk_index;
```

## 💾 **Storage Locations Summary**

### **Database Storage (Supabase PostgreSQL)**
- **Document Metadata**: `a_00900_doccontrol_documents` (enhanced)
- **Vector Embeddings**: `a_00900_doccontrol_document_embeddings`
- **Processing Jobs**: `a_00900_doccontrol_langchain_jobs`
- **User Settings**: `a_0900_user_langchain_settings`

### **File Storage (Supabase Storage)**
- **Original Files**: `documents/` bucket with organized folder structure
- **Path Format**: `documents/{org}/{project}/{discipline}/{phase}/{type}/{timestamp}-{filename}`

### **External Storage (Optional)**
- **LangSmith Traces**: LangSmith platform (if enabled)
- **Vector Database**: pgvector extension (if advanced vector search enabled)

## 🔒 **Data Security**

### **Encryption**
- **API Keys**: Stored encrypted in `*_api_key_encrypted` columns
- **Connection Strings**: Stored encrypted in `*_connection_string_encrypted` columns
- **File Content**: Secured by Supabase Storage access policies

### **Access Control**
- **Row Level Security**: Can be enabled on all tables
- **Foreign Key Constraints**: Ensure data integrity
- **Cascade Deletes**: Automatic cleanup when documents are deleted

## 📊 **Data Lifecycle**

### **Document Creation**
1. Document record created in `a_00900_doccontrol_documents`
2. Processing job created in `a_00900_doccontrol_langchain_jobs`
3. User settings retrieved from `a_0900_user_langchain_settings`
4. File uploaded to Supabase Storage

### **Document Processing**
1. Job status updated to 'processing'
2. Text extracted and chunked
3. Embeddings generated and stored in `a_00900_doccontrol_document_embeddings`
4. Document status updated to 'completed'
5. Job marked as 'completed'

### **Document Deletion**
1. Document deleted from `a_00900_doccontrol_documents`
2. Related embeddings automatically deleted (CASCADE)
3. Related jobs automatically deleted (CASCADE)
4. File optionally deleted from Supabase Storage

## 🎯 **Key Benefits**

### **Integrated Storage**
- **Single Database**: All data in your existing Supabase database
- **No External Dependencies**: No additional databases required
- **Consistent Backups**: Part of your existing backup strategy

### **Performance Optimized**
- **Proper Indexing**: Optimized for common query patterns
- **Foreign Key Constraints**: Ensure data integrity
- **Automatic Cleanup**: Cascade deletes prevent orphaned data

### **Scalable Design**
- **Batch Processing**: Efficient handling of large documents
- **Async Jobs**: Non-blocking processing workflow
- **Vector Storage**: Ready for semantic search and AI applications

This comprehensive data storage architecture ensures that all Record Manager data is properly organized, performant, and maintainable within your existing Supabase infrastructure.
