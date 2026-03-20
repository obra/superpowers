# 1350 Vector System Master Guide

## Overview

This master guide consolidates the comprehensive vector search and AI document processing system for the Construct AI platform. It integrates LangChain, Supabase vector storage, record management, and AI-powered document processing capabilities into a unified, enterprise-grade solution.

**System Components:**
- 🤖 **LangChain Integration**: Complete AI workflow orchestration
- 🗄️ **Supabase Vector Storage**: High-performance vector search and storage
- 📊 **Record Management**: Document lifecycle and metadata management
- 🔒 **Security Architecture**: Discipline-specific data isolation
- 🎯 **AI Document Processing**: Scope of work generation and intelligent analysis

---

## 🤖 LangChain Integration System

### Core Implementation Status: ✅ **FULLY OPERATIONAL**

#### **Frontend Configuration**
- **Settings UI**: `client/src/pages/00165-ui-settings/components/00165-LangChainSettings.js`
- **Service Layer**: `client/src/services/langchainSettingsService.js`
- **Features**:
  - Multi-provider support (OpenAI, Anthropic, Cohere, Local/Ollama)
  - Real-time connection testing and validation
  - Persistent user-specific configurations
  - Automatic initialization on app startup

#### **Backend Processing Pipeline**
- **API Endpoint**: `server/api/process/index.js`
- **Processing Service**: `server/services/langchainProcessingService.js`
- **Database Schema**: Enhanced `a_00900_doccontrol_documents` table with LangChain metadata
- **Features**:
  - Unified metadata schema across all document types
  - Automatic LangChain loader detection and selection
  - Async processing with comprehensive job management
  - Enterprise-grade error handling and logging
  - LangSmith tracing integration

#### **Supported File Types & Processing**
- **Documents**: PDF (PyPDFLoader), Word (Docx2txtLoader), Text (TextLoader)
- **Structured Data**: CSV, JSON with intelligent parsing
- **Web Content**: HTML processing with UnstructuredHTMLLoader
- **Multimodal**: Video transcription, image OCR, audio processing
- **Advanced Features**: Text chunking, embedding generation, summarization, entity extraction

#### **Configuration Options**
```javascript
// Multi-provider LLM configuration
const llmConfig = {
  provider: 'openai|anthropic|cohere|local',
  model: 'gpt-4o-mini|claude-3-sonnet|command-r-plus',
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 30000
};

// Embedding configuration
const embeddingConfig = {
  provider: 'openai|cohere',
  model: 'text-embedding-3-small|embed-multilingual-v2',
  dimensions: 1536,
  batchSize: 100
};
```

---

## 🗄️ Supabase Vector Storage & Search

### Implementation Status: ✅ **PRODUCTION READY**

#### **Dynamic Search Criteria System**
- **Database Table**: `vector_search_criteria` for configurable search filters
- **Edge Function**: `supabase/functions/vector-search/index.ts`
- **Client Library**: `client-vector-search.js`
- **Features**:
  - Dynamic filter configuration stored in database
  - RESTful API with comprehensive error handling
  - Automatic table-to-function mapping
  - Predefined search methods for common use cases

#### **Search Criteria Management**
```sql
-- Dynamic search configuration
CREATE TABLE vector_search_criteria (
  id UUID PRIMARY KEY,
  table_name TEXT NOT NULL,
  search_name TEXT UNIQUE NOT NULL,
  description TEXT,
  filter_criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Client Usage Examples**
```javascript
// Initialize client
const vectorSearch = new VectorSearchClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Predefined search methods
const vi003Results = await vectorSearch.searchVI003(queryEmbedding, 10);
const contractResults = await vectorSearch.searchContractsPostAward(queryEmbedding, 5);

// Custom search with filters
const customResults = await vectorSearch.search({
  query_embedding: embedding,
  search_name: 'urgent_documents',
  match_count: 20,
  custom_filter: { priority: 'urgent', status: 'active' }
});
```

#### **Response Format**
```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "content": "document content...",
      "metadata": { "reference_id": "VI-003", "title_subject": "..." },
      "similarity": 0.8542
    }
  ],
  "metadata": {
    "search_name": "vi_003_search",
    "table_name": "a_00435_contracts_post_vector",
    "filter_applied": {"reference_id": "VI-003"},
    "results_count": 3
  }
}
```

---

## 📊 Record Management System

### Implementation Status: ✅ **FULLY OPERATIONAL**

#### **Core Components**
- **Record Manager Service**: `server/services/langchainRecordManager.js`
- **API Endpoints**: `server/api/documents/manage.js`
- **Processing Integration**: `server/services/langchainProcessingService.js`

#### **Document Lifecycle Management**
```javascript
// Complete document lifecycle
const recordManager = new LangChainRecordManager();

// Create with vector tracking
await recordManager.createDocument({
  documentId,
  filePath,
  metadata,
  userSettings,
  organizationId,
  projectId
});

// Update with reprocessing option
await recordManager.updateDocument(documentId, updates, reprocessEmbeddings);

// Delete with cleanup
await recordManager.deleteDocument(documentId, { cleanupEmbeddings: true });
```

#### **Database Schema Integration**
```sql
-- Enhanced documents table
ALTER TABLE a_00900_doccontrol_documents
ADD COLUMN langchain_metadata JSONB DEFAULT '{}',
ADD COLUMN langchain_processing_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN langchain_trace_id UUID,
ADD COLUMN langchain_chunk_count INTEGER DEFAULT 0;

-- Vector embeddings table
CREATE TABLE a_00900_doccontrol_document_embeddings (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES a_00900_doccontrol_documents(id),
  chunk_index INTEGER,
  chunk_text TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing jobs table
CREATE TABLE a_00900_doccontrol_langchain_jobs (
  id UUID PRIMARY KEY,
  document_id UUID,
  job_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

#### **API Operations**
```javascript
// Comprehensive document management
GET    /api/documents/manage?documentId=xxx&action=stats
PUT    /api/documents/manage  // Update with reprocessing
DELETE /api/documents/manage // Soft delete with cleanup
POST   /api/documents/manage // Bulk operations
```

---

## 🔒 Security Architecture

### Implementation Status: ✅ **ENTERPRISE GRADE**

#### **Hybrid Security Model**
- **Database Layer**: Single unified table (`a_00900_doccontrol_documents`)
- **Vector Store Layer**: Discipline-specific Flowise stores for physical isolation
- **Access Control**: Row-level security + role-based permissions

#### **Discipline-Specific Vector Stores**
```javascript
const DISCIPLINE_VECTOR_STORES = {
  // Critical Security
  '00880': { storeId: 'board-documents-store', security: 'critical', access: ['board-members'] },
  '01200': { storeId: 'finance-documents-store', security: 'critical', access: ['finance-team'] },
  '02400': { storeId: 'safety-documents-store', security: 'critical', access: ['safety-officers'] },

  // High Security
  '00435': { storeId: '977a0660-2843-4ea0-bcd0-37e3194ceb1f', security: 'high', access: ['contracts-team'] },
  '01900': { storeId: 'procurement-documents-store', security: 'high', access: ['procurement-team'] },

  // Engineering Disciplines
  '00850': { storeId: 'civil-engineering-store', security: 'medium', access: ['civil-engineers'] },
  '00860': { storeId: 'electrical-engineering-store', security: 'medium', access: ['electrical-engineers'] }
};
```

#### **Security Benefits**
- **Physical Isolation**: Breach in one discipline doesn't affect others
- **Compliance**: Meets SOX, GDPR, industry-specific requirements
- **Access Control**: Granular role-based permissions
- **Audit Trail**: Complete separation of access logs

#### **Database Security**
```sql
-- Row-level security policy
CREATE POLICY "discipline_access" ON a_00900_doccontrol_documents
FOR ALL USING (
  discipline = current_user_discipline() OR
  has_cross_discipline_access(auth.uid())
);

-- Audit logging triggers
CREATE TRIGGER audit_document_access
  AFTER INSERT OR UPDATE OR DELETE ON a_00900_doccontrol_documents
  FOR EACH ROW EXECUTE FUNCTION log_document_changes();
```

---

## 🎯 AI Document Processing

### Implementation Status: ✅ **PRODUCTION READY**

#### **Scope of Work Generation**
- **AI Service**: `client/src/services/scopeOfWorkGenerationService.js`
- **UI Integration**: `client/src/pages/01900-procurement/components/modals/01900-ScopeOfWorkModal.js`
- **Features**:
  - Magic wand AI generation with category-specific templates
  - Multi-provider LLM support (OpenAI GPT-4o-mini, Anthropic Claude)
  - Industry-specific content generation
  - Compliance-aware document creation

#### **Template Categories**
- **Industrial Equipment (B)**: Certifications, maintenance, safety specs
- **Industrial Supplies (C06)**: Product grades, quality certifications, storage
- **Engineering Services (J,K,L,M)**: Qualifications, regulatory compliance
- **Energy Systems (A)**: Safety considerations, environmental compliance
- **Real Estate (E)**: Occupancy regulations, facility management
- **Construction Materials (G,H,D)**: Material standards, inspection requirements

#### **AI Processing Workflow**
```javascript
// Enhanced SOW generation
const generateSOW = async (userInput, category, compliance) => {
  // 1. Category-specific prompt building
  const prompt = buildCategoryPrompt(userInput, category, compliance);

  // 2. Multi-provider LLM processing
  const aiResponse = await processWithLLM(prompt, {
    provider: 'openai', // or 'anthropic'
    model: 'gpt-4o-mini',
    temperature: 0.7
  });

  // 3. Structured content parsing
  return parseSOWContent(aiResponse, category);
};
```

---

## 🚀 Production Deployment

### Environment Setup
```bash
# Required environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key

# AI provider keys (optional)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
COHERE_API_KEY=your_cohere_key

# LangSmith tracing (optional)
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=construct-ai
```

### Database Migration
```bash
# Execute LangChain schema enhancements
# Run in Supabase SQL Editor
sql/add_langchain_metadata_columns.sql

# Create search criteria table
sql/create_search_criteria_table.sql

# Initialize vector stores sync
node create-flowise-store-sync.js
```

### Dependencies Installation
```bash
# Core LangChain (for full processing)
npm install langchain @langchain/openai @langchain/anthropic @langchain/cohere

# Vector operations
npm install @supabase/vecs pg

# Additional processing
npm install mammoth pdf-parse csv-parser
```

### Service Deployment
```bash
# Deploy Supabase Edge Functions
supabase functions deploy vector-search

# Start application services
npm run dev  # Development
npm run build && npm start  # Production
```

---

## 📈 Performance & Monitoring

### Optimization Features
- **Database Indexes**: Optimized queries on processing status, user IDs, timestamps
- **Caching Layer**: 5-minute cache for vector store configurations
- **Batch Processing**: Configurable batch sizes for embedding generation
- **Async Operations**: Non-blocking document processing with job queues

### Monitoring Integration
- **LangSmith Tracing**: Complete AI operation observability
- **Database Metrics**: Query performance and storage utilization
- **API Monitoring**: Endpoint response times and error rates
- **Security Auditing**: Access pattern analysis and anomaly detection

### Health Checks
```javascript
// System health verification
const healthCheck = await langchainRecordManager.performHealthCheck();
// Returns: total documents, embedded docs, pending jobs, orphaned records
```

---

## 🧪 Testing & Validation

### Test Coverage
- **Unit Tests**: Individual component functionality
- **Integration Tests**: End-to-end document processing workflows
- **Security Tests**: Access control and data isolation validation
- **Performance Tests**: Load testing under various conditions

### Validation Scripts
```bash
# Complete system validation
node test-complete-flowise-integration.js
node test-supabase-search.cjs
node systematic-schema-test.js

# Performance benchmarking
node test-langchain-processing-performance.js
```

---

## 🔧 Configuration & Customization

### System Configuration
```javascript
// Core system settings
const systemConfig = {
  // Processing
  batchSize: 100,
  maxConcurrentJobs: 5,
  retryAttempts: 3,

  // Storage
  embeddingDimensions: 1536,
  chunkSize: 1000,
  chunkOverlap: 200,

  // Security
  cacheExpiryMinutes: 5,
  auditLogRetentionDays: 90,

  // AI
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
  temperature: 0.7
};
```

### Custom Extensions
```javascript
// Adding new document processors
class CustomDocumentProcessor extends BaseDocumentProcessor {
  async process(fileBuffer, metadata) {
    // Custom processing logic
    const processedContent = await this.customExtraction(fileBuffer);
    return {
      content: processedContent,
      metadata: { ...metadata, processor: 'custom' }
    };
  }
}

// Registering new search criteria
await vectorSearch.addSearchCriteria({
  table_name: 'custom_vector_table',
  search_name: 'custom_search',
  description: 'Custom search criteria',
  filter_criteria: { custom_field: 'value' }
});
```

---

## 📚 API Reference

### LangChain Record Manager API
```javascript
// Document management
await recordManager.createDocument(documentData);
await recordManager.updateDocument(documentId, updates, reprocess);
await recordManager.deleteDocument(documentId, options);

// Statistics and monitoring
const stats = await recordManager.getDocumentStats(documentId);
const health = await recordManager.performHealthCheck();
```

### Vector Search API
```javascript
// Search operations
const results = await vectorSearch.search({
  query_embedding: embedding,
  search_name: 'criteria_name',
  match_count: 10,
  custom_filter: { field: 'value' }
});

// Criteria management
await vectorSearch.addSearchCriteria(criteria);
await vectorSearch.updateSearchCriteria(searchName, updates);
await vectorSearch.removeSearchCriteria(searchName);
```

### Security API
```javascript
// Access control
const hasAccess = await securityManager.checkDisciplineAccess(userId, discipline);
const userStores = await securityManager.getUserVectorStores(userId);

// Audit logging
await securityManager.logAccess(userId, action, resourceId, metadata);
```

---

## 🛠️ Troubleshooting

### Common Issues

#### **LangChain Processing Errors**
```javascript
// Check service health
const health = await langchainProcessingService.healthCheck();

// Verify configuration
const config = await langchainSettingsService.getUserSettings(userId);

// Check API keys
const keyStatus = await langchainSettingsService.testConnection(provider);
```

#### **Vector Search Issues**
```javascript
// Validate search criteria
const criteria = await vectorSearch.getSearchCriteria(searchName);

// Check table existence
const tableExists = await vectorSearch.validateTable(tableName);

// Test embeddings
const testResults = await vectorSearch.testEmbedding(embedding);
```

#### **Security Access Problems**
```javascript
// Verify user roles
const userRoles = await securityManager.getUserRoles(userId);

// Check discipline access
const disciplineAccess = await securityManager.getUserDisciplines(userId);

// Validate store permissions
const storeAccess = await securityManager.checkStoreAccess(userId, storeId);
```

---

## 📋 Implementation Checklist

### Pre-Deployment
- [ ] Database schema migrations completed
- [ ] Environment variables configured
- [ ] Supabase Edge Functions deployed
- [ ] Vector stores synchronized
- [ ] API keys validated

### Post-Deployment
- [ ] User settings UI tested
- [ ] Document upload workflow verified
- [ ] Vector search functionality confirmed
- [ ] Security policies validated
- [ ] Performance benchmarks met

### Monitoring Setup
- [ ] LangSmith tracing configured
- [ ] Database monitoring active
- [ ] Error alerting enabled
- [ ] Performance dashboards created

---

## 🎯 Success Metrics

### Performance Targets
- **Query Response Time**: <5 seconds for vector searches
- **Document Processing**: <30 seconds for typical documents
- **System Availability**: 99.9% uptime
- **Search Accuracy**: >95% relevant results

### User Experience Goals
- **Time to Upload**: <10 seconds for document processing
- **Search Speed**: <2 seconds for result retrieval
- **Configuration Ease**: <5 minutes for initial setup
- **Error Rate**: <1% failed operations

### Security Compliance
- **Data Isolation**: 100% discipline separation
- **Access Control**: 100% policy enforcement
- **Audit Coverage**: 100% operations logged
- **Compliance Rate**: 100% regulatory requirements met

---

## 📞 Support & Resources

### Documentation Links
- [LangChain Complete Implementation](1350_VECTOR_LANGCHAIN_COMPLETE_IMPLEMENTATION.md)
- [Supabase Vector Search Setup](1350_VECTOR_SETUP_SUPABASE_VECTOR_SEARCH.md)
- [Record Manager Documentation](1350_VECTOR_LANGCHAIN_RECORD_MANAGER.md)
- [Security Architecture](1350_VECTOR_SECURITY_VECTOR_STORE_SECURITY.md)
- [AI Document Processing](1350_VECTOR_DOCUMENT_SCOPE_OF_WORK_GENERATION.md)

### Support Contacts
- **Technical Issues**: Development Team
- **Security Concerns**: Security Team
- **Performance Issues**: DevOps Team
- **Integration Help**: Integration Team

### Community Resources
- **GitHub Issues**: Bug reports and feature requests
- **Documentation Wiki**: Extended guides and examples
- **API Reference**: Complete API documentation
- **Training Materials**: User guides and tutorials

---

*This master guide consolidates the complete 1350 vector system across 20+ individual documentation files into a comprehensive, navigable reference for implementation and maintenance.*

**Version**: 1.0
**Last Updated**: 2025-11-29
**Status**: ✅ **PRODUCTION READY**
