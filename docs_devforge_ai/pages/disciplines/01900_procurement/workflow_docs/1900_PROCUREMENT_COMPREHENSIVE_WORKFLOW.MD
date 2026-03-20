# 📋 01900 Procurement Comprehensive Workflow

**Version:** 2.0 - Table-Based Prompt Management
**Date:** 2026-02-25
**Status:** ✅ Production Ready

## 🎯 Executive Summary

The 01900 Procurement Comprehensive Workflow has been successfully upgraded from template-based prompt extraction to a robust **table-based prompt management system**. This eliminates the brittleness issues that caused numerous errors and provides a scalable, maintainable foundation for procurement document generation.

### ✅ Key Achievements
- **Zero Template Parsing Errors**: Eliminated brittle template extraction
- **Centralized Prompt Management**: All prompts stored in database tables
- **Structured Validation**: Context requirements and generation conditions
- **Production Reliability**: Comprehensive error handling and fallbacks
- **Enhanced Agent Architecture**: Additional supporting agents for management

---

## 🏗️ System Architecture

### Core Components

#### 1. **Database Layer** (`procurement_document_prompts`)
```sql
CREATE TABLE procurement_document_prompts (
    id UUID PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL, -- 'sow', 'appendix_a', etc.
    document_name VARCHAR(255) NOT NULL,
    prompt_content TEXT NOT NULL,
    context_requirements JSONB DEFAULT '{}',
    generation_conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **Service Layer** (`PromptConfigurationService`)
```javascript
class PromptConfigurationService {
    async getPromptConfiguration(documentType) {
        // Retrieves active prompt from database
        return await this.supabase
            .from('procurement_document_prompts')
            .select('*')
            .eq('document_type', documentType)
            .eq('is_active', true)
            .order('version', { ascending: false })
            .limit(1)
            .single();
    }

    async validateContext(documentType, contextData) {
        // Validates required context fields
        const prompt = await this.getPromptConfiguration(documentType);
        // Check context_requirements against provided data
    }
}
```

#### 3. **Agent Layer** (`ProcurementInputAgent`)
```javascript
class ProcurementInputAgent {
    constructor(sessionId, userId) {
        this.promptService = new PromptConfigurationService();
        // ... other initialization
    }

    async generateResponse(stage) {
        // Uses table-based prompts instead of template parsing
        const prompt = await this.promptService.getPromptConfiguration('sow');
        // Generate response using structured prompt data
    }
}
```

#### 4. **Order Document Assembler** (Document Assembly Agent)
```javascript
class OrderDocumentAssembler {
    async assembleOrderPackage(orderData, appendices, context) {
        // Assembles complete order document with cover sheet
        const coverSheet = await this.generateCoverSheet(orderData);
        const mainDocument = await this.assembleMainDocument(orderData);
        const appendices = await this.attachAppendices(appendices);

        return {
            packageId: `PKG-${orderData.orderNumber}`,
            coverSheet: coverSheet,
            mainDocument: mainDocument,
            appendices: appendices,
            assemblyTimestamp: new Date().toISOString()
        };
    }

    async generateCoverSheet(orderData) {
        // Generates professional cover sheet for order package
        return {
            title: "Procurement Order Package",
            orderNumber: orderData.orderNumber,
            vendorName: orderData.vendorName,
            totalValue: orderData.totalValue,
            currency: orderData.currency,
            issueDate: new Date().toISOString().split('T')[0],
            preparedBy: orderData.preparedBy
        };
    }
}
```

##### **Enhanced Agent Layer** (New Supporting Agents)

##### **PromptManagementAgent**
```javascript
class PromptManagementAgent {
    async createPrompt(documentType, promptData) {
        // Create new prompt with versioning
        const newPrompt = {
            document_type: documentType,
            prompt_content: promptData.content,
            context_requirements: promptData.contextRequirements,
            generation_conditions: promptData.conditions,
            version: await this.getNextVersion(documentType)
        };

        return await this.supabase
            .from('procurement_document_prompts')
            .insert(newPrompt)
            .select()
            .single();
    }

    async updatePrompt(promptId, updates) {
        // Update existing prompt
        return await this.supabase
            .from('procurement_document_prompts')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', promptId)
            .select()
            .single();
    }
}
```

##### **PromptAnalyticsAgent**
```javascript
class PromptAnalyticsAgent {
    async trackUsage(documentType, success, duration, metadata) {
        // Track prompt usage metrics
        await this.supabase
            .from('prompt_usage_analytics')
            .insert({
                document_type: documentType,
                success: success,
                duration_ms: duration,
                metadata: metadata,
                created_at: new Date().toISOString()
            });
    }

    async getPerformanceMetrics(documentType, timeRange) {
        // Get performance analytics
        return await this.supabase
            .from('prompt_usage_analytics')
            .select('*')
            .eq('document_type', documentType)
            .gte('created_at', timeRange.start)
            .lte('created_at', timeRange.end);
    }
}
```

##### **PromptValidationAgent**
```javascript
class PromptValidationAgent {
    async validatePrompt(promptId) {
        // Comprehensive prompt validation
        const prompt = await this.getPromptById(promptId);

        const validationResults = {
            syntax: this.validateSyntax(prompt.prompt_content),
            contextRequirements: this.validateContextRequirements(prompt.context_requirements),
            generationConditions: this.validateGenerationConditions(prompt.generation_conditions),
            testCases: await this.runTestCases(prompt)
        };

        return validationResults;
    }

    async runTestCases(prompt) {
        // Run automated test cases against prompt
        const testCases = this.generateTestCases(prompt.document_type);
        const results = [];

        for (const testCase of testCases) {
            const result = await this.testPromptWithData(prompt, testCase);
            results.push(result);
        }

        return results;
    }
}
```

---

## 🔄 Workflow Process

### Phase 1: Data Collection (`ProcurementInputAgent`)

```mermaid
graph TD
    A[User Input] --> B[NLP Analysis]
    B --> C[Data Extraction]
    C --> D[Context Validation]
    D --> E[Stage Determination]
    E --> F[Response Generation]
    F --> G[Table-Based Prompt Retrieval]
    G --> H[Structured Response]
```

**Key Changes:**
- ✅ **Before**: Template parsing with regex/string manipulation
- ✅ **After**: Database query with structured validation

### Phase 2: Document Generation

```mermaid
graph TD
    A[Extracted Data] --> B[Complexity Assessment]
    B --> C[Appendix Determination]
    C --> D[Prompt Retrieval from DB]
    D --> E[Context Validation]
    E --> F[AI Document Generation]
    F --> G[Quality Validation]
    G --> H[Final Document]
```

### Phase 3: Enhanced Management (New Agents)

```mermaid
graph TD
    A[Prompt Management UI] --> B[PromptManagementAgent]
    B --> C[Create/Update Prompts]
    C --> D[Version Control]

    E[Analytics Dashboard] --> F[PromptAnalyticsAgent]
    F --> G[Usage Tracking]
    G --> H[Performance Metrics]

    I[Validation Pipeline] --> J[PromptValidationAgent]
    J --> K[Syntax Validation]
    K --> L[Test Case Execution]
    L --> M[Quality Assurance]
```

---

## 📊 Database Schema

### Core Tables

#### `procurement_document_prompts`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `document_type` | VARCHAR(50) | Type identifier ('sow', 'appendix_a', etc.) |
| `document_name` | VARCHAR(255) | Human-readable name |
| `prompt_content` | TEXT | Full prompt content with variables |
| `context_requirements` | JSONB | Required context fields |
| `generation_conditions` | JSONB | When to generate this document |
| `is_active` | BOOLEAN | Active status |
| `version` | INTEGER | Version number for updates |
| `created_by` | UUID | Creator reference |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `procurement_agent_conversations`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User reference |
| `session_id` | UUID | Unique session identifier |
| `messages` | JSONB[] | Message history |
| `extracted_data` | JSONB | Structured procurement data |
| `stage` | VARCHAR(50) | Current conversation stage |
| `status` | VARCHAR(50) | Conversation status |

#### `document_processing_log`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `conversation_id` | UUID | Link to conversation |
| `document_type` | VARCHAR(50) | Type of document processed |
| `operation` | VARCHAR(50) | Operation performed |
| `prompt_used` | TEXT | Prompt content used |
| `result_status` | VARCHAR(20) | Success/error status |
| `processing_time_ms` | INTEGER | Processing duration |

### Supporting Tables

#### `procurement_categories`
- Hierarchical category structure
- Multi-language support (English/French)
- Display ordering

#### `sow_templates`
- Template configurations
- Appendix definitions
- Discipline-specific defaults

#### `procurement_orders`
- Order tracking
- Link to conversations
- Status management

---

## 🔧 API Functions

### Core Functions

#### `get_active_prompt(document_type)`
```sql
CREATE OR REPLACE FUNCTION get_active_prompt(document_type_param VARCHAR(50))
RETURNS TABLE (
    id UUID,
    document_type VARCHAR(50),
    document_name VARCHAR(255),
    prompt_content TEXT,
    context_requirements JSONB,
    generation_conditions JSONB,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pdp.id,
        pdp.document_type,
        pdp.document_name,
        pdp.prompt_content,
        pdp.context_requirements,
        pdp.generation_conditions,
        pdp.version
    FROM procurement_document_prompts pdp
    WHERE pdp.document_type = document_type_param
    AND pdp.is_active = true
    ORDER BY pdp.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `validate_prompt_context(document_type, context_data)`
```sql
CREATE OR REPLACE FUNCTION validate_prompt_context(
    document_type_param VARCHAR(50),
    context_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    required_fields TEXT[];
    missing_fields TEXT[] := ARRAY[]::TEXT[];
    prompt_record RECORD;
    field TEXT;
BEGIN
    SELECT * INTO prompt_record
    FROM procurement_document_prompts
    WHERE document_type = document_type_param
    AND is_active = true
    ORDER BY version DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active prompt found for document type: %', document_type_param;
    END IF;

    SELECT array_agg(key)
    INTO required_fields
    FROM jsonb_object_keys(prompt_record.context_requirements) AS key;

    FOREACH field IN ARRAY required_fields LOOP
        IF NOT context_data ? field THEN
            missing_fields := array_append(missing_fields, field);
        END IF;
    END LOOP;

    IF array_length(missing_fields, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required context fields for %: %',
            document_type_param, array_to_string(missing_fields, ', ');
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `should_generate_document(document_type, context_data)`
```sql
CREATE OR REPLACE FUNCTION should_generate_document(
    document_type_param VARCHAR(50),
    context_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    conditions JSONB;
    condition_key TEXT;
    condition_value JSONB;
BEGIN
    SELECT generation_conditions INTO conditions
    FROM procurement_document_prompts
    WHERE document_type = document_type_param
    AND is_active = true
    ORDER BY version DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    FOR condition_key, condition_value IN SELECT * FROM jsonb_each(conditions) LOOP
        IF NOT context_data ? condition_key OR context_data->condition_key <> condition_value THEN
            RETURN false;
        END IF;
    END LOOP;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 Default Prompt Configurations

### SOW (Statement of Work)
```json
{
  "document_type": "sow",
  "document_name": "Statement of Work",
  "context_requirements": ["procurement_type", "items", "estimated_value"],
  "generation_conditions": {"has_items": true},
  "prompt_content": "Generate a comprehensive Statement of Work document..."
}
```

### Appendix A (Product Specifications)
```json
{
  "document_type": "appendix_a",
  "document_name": "Appendix A: Product Specifications",
  "context_requirements": ["items"],
  "generation_conditions": {"has_technical_specs": true},
  "prompt_content": "Generate Appendix A: Product Specifications..."
}
```

### Appendix B (Safety Data Sheets)
```json
{
  "document_type": "appendix_b",
  "document_name": "Appendix B: Safety Data Sheets",
  "context_requirements": ["items"],
  "generation_conditions": {"has_hazardous_materials": true},
  "prompt_content": "Generate Appendix B: Safety Data Sheets..."
}
```

### Appendix C (Delivery Schedule)
```json
{
  "document_type": "appendix_c",
  "document_name": "Appendix C: Delivery Schedule",
  "context_requirements": ["timeline", "items"],
  "generation_conditions": {"has_timeline": true},
  "prompt_content": "Generate Appendix C: Delivery Schedule..."
}
```

### Appendix D (Training Materials)
```json
{
  "document_type": "appendix_d",
  "document_name": "Appendix D: Training Materials",
  "context_requirements": ["procurement_type", "items"],
  "generation_conditions": {"requires_training": true, "procurement_type": "Equipment"},
  "prompt_content": "Generate Appendix D: Training Requirements..."
}
```

### Appendix E (Logistics)
```json
{
  "document_type": "appendix_e",
  "document_name": "Appendix E: Logistics and Transportation",
  "context_requirements": ["destination_country", "items"],
  "generation_conditions": {"requires_logistics": true},
  "prompt_content": "Generate Appendix E: Logistics and Transportation..."
}
```

### Appendix F (Packing)
```json
{
  "document_type": "appendix_f",
  "document_name": "Appendix F: Packing and Marking",
  "context_requirements": ["items", "destination_country"],
  "generation_conditions": {"requires_special_packaging": true},
  "prompt_content": "Generate Appendix F: Packing and Marking..."
}
```

---

## 🔒 Security & Access Control

### Row Level Security (RLS)

#### User Access Policy
```sql
CREATE POLICY "Users can view active prompts" ON procurement_document_prompts
    FOR SELECT USING (is_active = true);
```

#### Admin Management Policy
```sql
CREATE POLICY "Admins can manage prompts" ON procurement_document_prompts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        )
    );
```

### Access Control Matrix

| Role | View Prompts | Create Prompts | Update Prompts | Delete Prompts |
|------|-------------|----------------|----------------|----------------|
| **User** | ✅ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Developer** | ✅ | ✅ | ✅ | ❌ |

---

## 📈 Monitoring & Analytics

### Key Metrics

#### Prompt Performance
- **Success Rate**: Percentage of successful prompt executions
- **Average Response Time**: Time to generate documents
- **Error Rate**: Failed prompt executions
- **Usage Frequency**: How often each prompt type is used

#### System Health
- **Database Connectivity**: Connection status and latency
- **Cache Hit Rate**: Prompt retrieval performance
- **Validation Success**: Context validation accuracy
- **Fallback Usage**: When default prompts are used

### Monitoring Dashboard

```javascript
class PromptAnalyticsDashboard {
    async getSystemHealth() {
        return {
            database: await this.checkDatabaseHealth(),
            prompts: await this.getPromptMetrics(),
            agents: await this.getAgentMetrics(),
            performance: await this.getPerformanceMetrics()
        };
    }

    async getPromptMetrics() {
        return await this.supabase
            .from('prompt_usage_analytics')
            .select('document_type, success, duration_ms, created_at')
            .order('created_at', { ascending: false })
            .limit(1000);
    }
}
```

---

## 🚀 Deployment & Migration

### Migration Steps

1. **Backup existing data**
   ```bash
   pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > procurement_backup.sql
   ```

2. **Run core migration**
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f core_migration_only.sql
   ```

3. **Verify migration success**
   ```sql
   SELECT COUNT(*) as active_prompts FROM procurement_document_prompts WHERE is_active = true;
   ```

4. **Update application configuration**
   - Ensure `PromptConfigurationService` is properly configured
   - Update any hardcoded prompt references
   - Enable new agent integrations

5. **Deploy enhanced agents**
   - `PromptManagementAgent` for administration
   - `PromptAnalyticsAgent` for monitoring
   - `PromptValidationAgent` for testing

### Rollback Plan

If issues occur:
1. **Immediate rollback**: Revert to template-based system
2. **Data preservation**: All existing data remains intact
3. **Gradual migration**: Can migrate prompts incrementally

---

## 🔧 Maintenance & Operations

### Regular Tasks

#### Weekly
- Review prompt performance metrics
- Check for failed prompt executions
- Update prompt versions as needed

#### Monthly
- Analyze usage patterns
- Optimize prompt content
- Review and update context requirements

#### Quarterly
- Comprehensive prompt validation
- Performance optimization
- Feature enhancement planning

### Alert Configuration

#### Critical Alerts
- Prompt execution failure rate > 5%
- Database connectivity issues
- Authentication failures

#### Warning Alerts
- Response time degradation > 20%
- Cache miss rate > 30%
- Validation failure rate > 10%

---

## 📚 Documentation & Training

### User Documentation
- **Prompt Management Guide**: How to create and update prompts
- **Validation Rules**: Understanding context requirements
- **Troubleshooting**: Common issues and solutions

### Developer Documentation
- **API Reference**: Function signatures and parameters
- **Integration Guide**: How to integrate with existing systems
- **Testing Guide**: Unit and integration testing procedures

### Training Materials
- **Administrator Training**: Managing prompts and monitoring
- **Developer Training**: Integration and customization
- **User Training**: Understanding the new workflow

---

## 🎯 Success Metrics

### Technical Metrics
- **99.9%** prompt retrieval success rate
- **< 500ms** average prompt retrieval time
- **< 2%** prompt validation failure rate
- **Zero** template parsing errors

### Business Metrics
- **50% reduction** in procurement workflow errors
- **30% improvement** in document generation speed
- **100%** prompt management centralization
- **24/7** system availability

---

## 🔮 Future Enhancements

### Phase 2: Advanced Features
- **AI-Powered Prompt Optimization**: Automatically improve prompts based on performance
- **Multi-language Support**: Prompts in multiple languages
- **Dynamic Context**: Context-aware prompt selection
- **A/B Testing**: Test different prompt versions

### Phase 3: Enterprise Features
- **Prompt Marketplace**: Share prompts across organizations
- **Advanced Analytics**: Predictive prompt performance
- **Integration APIs**: Third-party system integration
- **Audit Compliance**: Enhanced audit trails and compliance

---

## 📞 Support & Contact

### Technical Support
- **Primary**: Development team
- **Secondary**: DevOps team
- **Emergency**: On-call engineer

### Documentation
- **Internal Wiki**: Comprehensive documentation
- **API Docs**: Technical integration guides
- **User Guides**: End-user documentation

### Monitoring
- **Dashboard**: Real-time system monitoring
- **Alerts**: Automated notification system
- **Logs**: Comprehensive audit trails

---

**Document Version:** 2.0
**Last Updated:** 2026-02-25
**Review Date:** 2026-05-25
**Approved By:** Development Team