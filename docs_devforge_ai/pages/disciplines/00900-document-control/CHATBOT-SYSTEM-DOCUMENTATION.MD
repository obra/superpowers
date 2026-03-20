!# Chatbot System Documentation

This document provides comprehensive documentation for the chatbot system, including LangChain AI integration, document processing, and conversational AI capabilities.

## Overview

The chatbot system leverages LangChain AI to provide intelligent document analysis and conversational interfaces across the EPCM platform. It integrates seamlessly with the document management system to enable AI-powered interactions with uploaded documents.

## 📊 Supabase Table Tracking for Disciplines/Pages

**📍 Location:** The `vector_search_criteria` table in Supabase serves as the central registry for tracking all vector search tables created for different disciplines and pages.

**🔧 Tracking Mechanism:**
- **Table:** `vector_search_criteria`
- **Purpose:** Stores discipline-to-table mappings and search configurations
- **Documentation:** [1350_VECTOR_SYSTEM_VECTOR_SEARCH_SYSTEM.md](../data-processing/1350_VECTOR_SYSTEM_VECTOR_SEARCH_SYSTEM.md)
- **SQL Schema:** `sql/create_enhanced_search_criteria_table.sql`

**📊 Current Implementation Status:**
- **Total Pages Analyzed**: 134
- **Pages with Chatbots**: **67** (50% complete)
- **Implementation Quality**: Enterprise-grade with context-aware AI
- **Phases Completed**: Core Engineering (Phase 1) ✅, Contract Management (Phase 2) ✅, Executive Leadership (Phase 3) ✅, Document Compilation Suite (Phase 4) ✅, Administrative & Operational (Phase 5) ✅

**📋 Current Tracked Disciplines:**
| Discipline | Table Name | Status | Pages with Chatbots |
|------------|------------|--------|-------------------|
| Administration | `a_00102_administration_vector` | ✅ Active | 1 (Final Onboarding) |
| Architectural | `a_00825_architectural_vector` | ✅ Active | 1 |
| Board of Directors | `a_00880_board_vector` | ✅ Active | 1 |
| Chemical Engineering | `a_00835_chemical_vector` | ✅ Active | 1 |
| Civil Engineering | `a_00850_civil_engineering_vector` | ✅ Active | 1 |
| Construction | `a_00300_construction_vector` | ✅ Active | 1 |
| Contracts Post-Award | `a_00435_contracts_post_vector` | ✅ Active | 1 |
| Contracts Pre-Award | `a_00425_contracts_pre_vector` | ✅ Active | 1 |
| Design | `a_00800_design_vector` | ✅ Active | 1 |
| Director Contracts | `a_00883_director_contracts_vector` | ✅ Active | 1 |
| Director Engineering | `a_00884_director_engineering_vector` | ✅ Active | 1 |
| Director Finance | `a_00889_director_finance_vector` | ✅ Active | 1 |
| Director HSE | `a_00885_director_hse_vector` | ✅ Active | 1 |
| Director Logistics | `a_00886_director_logistics_vector` | ✅ Active | 1 |
| Director Procurement | `a_00888_director_procurement_vector` | ✅ Active | 1 |
| Director Projects | `a_00890_director_projects_vector` | ✅ Active | 1 |
| Electrical Engineering | `a_00860_electrical_engineering_vector` | ✅ Active | 1 |
| Human Resources | `a_01500_hr_vector` | ✅ Active | 1 |
| Mechanical Engineering | `a_00870_mechanical_engineering_vector` | ✅ Active | 1 |
| Process Engineering | `a_00871_process_vector` | ✅ Active | 1 |
| Procurement | `a_01900_procurement_vector` | ✅ Active | 1 |
| Scheduling (Universal Gantt) | `a_02035_scheduling_vector` | ✅ Active | 1 |

**🔄 Adding New Disciplines:**
New discipline vector tables are registered by inserting records into the `vector_search_criteria` table with the appropriate `discipline`, `table_name`, and search configurations. This automatically makes them discoverable by the vector search system without requiring code changes.

**📚 Related Documentation:**
- [1350_VECTOR_MASTER_AI_VECTOR_SEARCH_MASTER_GUIDE.md](../data-processing/1350_VECTOR_MASTER_AI_VECTOR_SEARCH_MASTER_GUIDE.md) - Complete vector search system overview
- [0307_TABLE_INVENTORY_MASTER.md](../database-systems/0307_TABLE_INVENTORY_MASTER.md) - Complete table inventory with migration status

## System Architecture

### LangChain Integration
- **Platform**: LangChain AI for building LLM applications
- **Document Processing**: Automatic embedding and vector storage
- **Conversational AI**: Natural language queries against document content
- **Multi-modal Support**: Text, PDF, and structured data processing

### Core Components
- **Document Stores**: Dedicated storage for each page's documents
- **Vector Embeddings**: Semantic search capabilities
- **Chat Interfaces**: Modal-based chat windows
- **Context Management**: Maintains conversation history and context

## Document Store Integration

### Store Configuration
Each page has dedicated LangChain document stores:
- **00435-store**: Contracts and legal documents
- **00889-store**: Financial documents
- **03010-store**: Email archives
- **00300-store**: Construction documents

### Store Capabilities
- **Vector Search**: Semantic similarity search
- **Context Retrieval**: Relevant document excerpts
- **Multi-document Queries**: Cross-document analysis
- **Real-time Updates**: New documents immediately available

### Cross-Discipline Vector Data Sharing

The chatbot system supports controlled sharing of vector data between disciplines and users while maintaining security and access controls:

#### Multi-Table Search Architecture
```javascript
// Advanced multi-table vector search with cross-discipline access
const performCrossDisciplineSearch = async (query, userContext) => {
  const { primaryDiscipline, userPermissions, accessLevel } = userContext;

  // Define search scope based on permissions
  const searchTables = [];

  // Primary discipline table
  const primaryTable = `a_${primaryDiscipline}_vector`;
  searchTables.push(primaryTable);

  // Related discipline tables (if permitted)
  const relatedTables = await getRelatedDisciplineTables(primaryDiscipline, userPermissions);
  searchTables.push(...relatedTables);

  // Shared/common knowledge tables (governance, templates, etc.)
  const sharedTables = await getSharedKnowledgeTables(userPermissions, accessLevel);
  searchTables.push(...sharedTables);

  // Perform multi-table vector search
  return await vectorSearch.multiTableQuery({
    query: query,
    tables: searchTables,
    filters: {
      userPermissions: userPermissions,
      accessLevel: accessLevel,
      disciplineScope: [primaryDiscipline, ...relatedTables.map(t => t.discipline)]
    },
    limit: 5,
    threshold: 0.7
  });
};
```

#### Related Discipline Access
Disciplines can access related field data based on organizational permissions:

- **Civil Engineering** → Structural Engineering, Geotechnical Engineering
- **Contracts** → Legal, Procurement
- **Finance** → Governance, Compliance
- **Engineering Disciplines** → Quality Assurance, Safety Protocols

#### Shared Knowledge Bases
Common resources available across disciplines with appropriate permissions:

- **Governance Tables** (`shared_governance_vector`) - Policies, procedures, compliance frameworks
- **Template Libraries** (`shared_templates_vector`) - Standardized document templates
- **Quality Assurance** (`shared_quality_vector`) - QA standards and processes
- **Safety Protocols** (`shared_safety_vector`) - Safety procedures and compliance

#### Access Control Implementation
```sql
-- Row-Level Security for cross-discipline access
CREATE POLICY "cross_discipline_vector_access" ON shared_governance_vector
FOR SELECT USING (
  auth.jwt() ->> 'discipline' = ANY(ARRAY['finance', 'contracts', 'governance'])
  OR auth.jwt() ->> 'role' IN ('director', 'admin')
  OR auth.jwt() ->> 'has_governance_access' = 'true'
);

-- Related discipline access example
CREATE POLICY "civil_engineering_related_access" ON a_structural_vector
FOR SELECT USING (
  auth.jwt() ->> 'discipline' = 'civil_engineering'
  OR auth.jwt() ->> 'related_disciplines' @> '["civil_engineering"]'
  OR auth.jwt() ->> 'role' IN ('director', 'admin')
);
```

#### Benefits of Cross-Discipline Sharing
- **Enhanced Knowledge Access**: Users can leverage related discipline knowledge
- **Improved Collaboration**: Cross-functional teams access relevant shared resources
- **Consistency**: Standardized templates and procedures across disciplines
- **Efficiency**: Reduced duplication of common knowledge and procedures

## Chatbot Types

### Page-Specific Chatbots
| Page Prefix | Chatbot Focus | Document Types |
|-------------|---------------|----------------|
| **00435** | Contract Analysis | Legal contracts, agreements, correspondence |
| **00889** | Financial Analysis | Budgets, invoices, financial reports |
| **03010** | Email Management | Email archives, attachments, communications |
| **00300** | Construction Analysis | Plans, safety reports, progress documents |

### Agent Integration
Chatbots are integrated with specific AI agents:
- **Legal Analysis Agent**: Contract interpretation and analysis
- **Financial Analysis Agent**: Budget and financial data insights
- **Email Categorization Agent**: Email content classification
- **Construction Progress Agent**: Project status and safety analysis

## Conversational Capabilities

### Query Types
- **Document Q&A**: Ask questions about specific documents
- **Comparative Analysis**: Compare multiple documents
- **Summary Generation**: Generate document summaries
- **Extraction**: Extract specific information (dates, amounts, terms)

### Context Features
- **Conversation History**: Maintains chat context
- **Document References**: Links to source documents
- **Citation Tracking**: Shows document sources for answers
- **Multi-turn Dialog**: Follow-up questions and clarifications

## Technical Implementation

### CSS Architecture Update (2025-11-27)
**Important**: The chatbot CSS architecture has been updated to resolve styling conflicts:

- ✅ **Current Active Files**:
  - `client/src/components/chatbots/base/chatbot-pure-css.css` - Primary CSS file (single source of truth)
  - `client/src/components/chatbots/base/chatbot-base.css` - Base styles with dimension handling

- ❌ **Deprecated Files** (commented out due to CSS conflicts):
  - `client/src/common/css/components/00200-chatbot-consolidated.css`
  - `client/src/common/css/components/00200-chatbot-consolidated 2.css`

**Migration**: All chatbot styling now uses `chatbot-pure-css.css` as the single source of truth. The deprecated consolidated files contain Bootstrap dependencies that caused styling conflicts and red badge issues.

### LangChain Configuration
```json
{
  "chatbot": {
    "name": "EPCM Document Chatbot",
    "components": [
      {
        "type": "VectorStore",
        "config": {
          "storeId": "00435-store-uuid",
          "chunkSize": 1000,
          "chunkOverlap": 200
        }
      },
      {
        "type": "ConversationalRetrievalChain",
        "config": {
          "llm": "gpt-4",
          "memory": true,
          "returnSourceDocuments": true
        }
      }
    ]
  }
}
```

### API Integration
```javascript
// Initialize chatbot session
POST /api/chatbot/init
{
  "store_id": "00435-store-uuid",
  "page_prefix": "00435",
  "user_id": "contributor-uuid"
}

// Send message to chatbot
POST /api/chatbot/message
{
  "session_id": "session-uuid",
  "message": "What are the key terms in this contract?",
  "document_ids": ["doc-uuid-1", "doc-uuid-2"]
}

// Get conversation history
GET /api/chatbot/history?session_id=session-uuid
```

## Document Processing Pipeline

### 1. Document Ingestion
- **Upload**: Documents uploaded to appropriate store
- **Text Extraction**: Content extracted using appropriate parsers
- **Chunking**: Documents split into manageable chunks
- **Embedding**: Text converted to vector representations

### 2. Vector Storage
- **Storage**: Vectors stored in LangChain document store
- **Indexing**: Optimized for fast retrieval
- **Metadata**: Document metadata preserved
- **Updates**: Real-time updates when documents added

### 3. Query Processing
- **Vector Search**: Semantic similarity matching
- **Context Assembly**: Relevant chunks assembled
- **LLM Processing**: GPT models generate responses
- **Response Formatting**: Human-readable answers with sources

## Chat Interface Design

### Modal Integration
Chatbots are integrated into modal dialogs:
- **Full-screen Mode**: Dedicated chat interface
- **Side Panel**: Document preview with chat
- **Inline Chat**: Contextual chat within documents
- **Mobile Responsive**: Optimized for mobile devices

### UI Components
```javascript
// Chatbot modal component structure
<ChatbotModal>
  <DocumentViewer />
  <ChatInterface>
    <MessageHistory />
    <InputArea />
    <QuickActions />
  </ChatInterface>
</ChatbotModal>
```

## Performance Optimization

### Caching Strategy
- **Query Cache**: Cache frequent queries
- **Document Cache**: Cache processed documents
- **Embedding Cache**: Cache vector embeddings
- **Session Cache**: Cache conversation context

### Scaling Considerations
- **Load Balancing**: Distribute across multiple LangChain instances
- **Document Sharding**: Split large document sets
- **Rate Limiting**: Prevent API abuse
- **Resource Monitoring**: Track usage and performance

## Security & Privacy

### Data Protection
- **Document Encryption**: Encrypted storage for sensitive documents
- **Access Control**: Role-based document access
- **Audit Logging**: Track all chatbot interactions
- **Data Retention**: Configurable retention policies

### Privacy Features
- **PII Detection**: Automatic detection of personal information
- **Redaction**: Sensitive information redaction
- **Consent Management**: User consent for document processing
- **Right to be Forgotten**: Document deletion capabilities

## Monitoring & Analytics

### Usage Metrics
- **Query Volume**: Number of questions asked
- **Response Quality**: User satisfaction ratings
- **Document Usage**: Most frequently accessed documents
- **Performance Metrics**: Response times and accuracy

### Health Monitoring
```sql
-- Check chatbot usage by page
SELECT 
  ds.storage_path,
  COUNT(*) as total_queries,
  AVG(response_time) as avg_response_time,
  COUNT(DISTINCT user_id) as unique_users
FROM chatbot_sessions cs
JOIN document_stores ds ON cs.store_id = ds.id
WHERE cs.created_at > NOW() - INTERVAL '7 days'
GROUP BY ds.storage_path;

-- Monitor document processing status
SELECT 
  store_id,
  COUNT(*) as total_docs,
  SUM(CASE WHEN is_embedded = true THEN 1 ELSE 0 END) as embedded_docs,
  AVG(processing_time) as avg_processing_time
FROM flowise_documents
GROUP BY store_id;
```

## Troubleshooting

### Common Issues
1. **Chatbot not responding**: Check LangChain service status
2. **Document not found**: Verify document store configuration
3. **Slow responses**: Check vector store performance
4. **Inaccurate answers**: Review document quality and embedding settings

### Debug Tools
```javascript
// Test chatbot connectivity
GET /api/chatbot/health

// Check document store status
GET /api/chatbot/store/{store_id}/status

// Validate document embedding
GET /api/chatbot/document/{document_id}/validate

// Reset chatbot session
POST /api/chatbot/session/{session_id}/reset
```

## Best Practices

### Document Preparation
- **Quality Documents**: Ensure documents are high-quality and readable
- **Consistent Formatting**: Use consistent document formats
- **Clear Structure**: Well-structured documents yield better results
- **Metadata**: Include relevant metadata for context

### Query Optimization
- **Specific Questions**: Ask specific, focused questions
- **Context Provision**: Provide context when asking questions
- **Document Selection**: Select relevant documents for queries
- **Follow-up Questions**: Use conversation history effectively

### User Experience
- **Clear Instructions**: Provide clear guidance on chatbot usage
- **Feedback Mechanism**: Allow users to rate responses
- **Help Documentation**: Provide examples and tips
- **Error Handling**: Graceful handling of errors and edge cases

## Future Enhancements

### Planned Features
- **Multi-language Support**: Support for multiple languages
- **Voice Integration**: Voice-to-text and text-to-voice
- **Advanced Analytics**: Detailed conversation analytics
- **Custom Models**: Fine-tuned models for specific domains

### Integration Roadmap
- **External APIs**: Integration with external document sources
- **Collaborative Features**: Shared chat sessions and annotations
- **Mobile App**: Native mobile chatbot applications
- **Voice Assistants**: Integration with voice assistants like Alexa/Siri

### Vector Data Sharing Cross-References

- **[0000_CHATBOT_IMPLEMENTATION_PROCEDURE.md](../procedures/0000_CHATBOT_IMPLEMENTATION_PROCEDURE.md)**: Implementation planning and backend service details for cross-discipline vector data sharing
- **[1300_PAGES_CHATBOT_FUNCTIONALITY_GUIDE.md](../pages-chatbots/1300_PAGES_CHATBOT_FUNCTIONALITY_GUIDE.md)**: Comprehensive security model and standardized assignment utility for cross-discipline vector data sharing
- **[0000_TASK_WORKFLOW_PROCEDURE.md](../procedures/0000_TASK_WORKFLOW_PROCEDURE.md)**: Original assignment logic that forms the basis for the standardized discipline/user assignment utility
