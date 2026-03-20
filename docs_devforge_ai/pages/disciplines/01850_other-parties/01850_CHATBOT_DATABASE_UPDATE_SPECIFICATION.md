# 01900 Procurement Chatbot Database Update Specification

## Document Information

- **Document ID**: `01900_CHATBOT_DATABASE_UPDATE_SPECIFICATION`
- **Version**: 1.0
- **Created**: 2025-11-30
- **Last Updated**: 2025-11-30
- **Author**: AI Assistant (Construct AI)
- **Implementation Phase**: Database Setup for Enhanced Chatbot
- **Target Page**: 01900 Procurement (First Enhanced Implementation)

## Overview

This document specifies all Supabase database table updates required for implementing the enhanced 01900 Procurement chatbot with state-aware functionality, vector search integration, and enterprise security features.

## Required Database Table Updates

### 1. Vector Search System Tables

#### 1.1 Vector Search Criteria Table (Enhanced)

**Purpose**: Central registry for managing vector search configurations across all disciplines/pages.

```sql
-- Enhanced vector search criteria with discipline support
CREATE TABLE IF NOT EXISTS public.vector_search_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discipline TEXT NOT NULL,                    -- discipline/page identifier (e.g., "procurement_01900")
    table_name TEXT NOT NULL,                   -- vector table name (e.g., "a_01900_procurement_vector")
    search_name TEXT NOT NULL,                  -- unique search identifier
    description TEXT,
    filter_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique combination
    CONSTRAINT unique_discipline_search UNIQUE (discipline, search_name)
);

-- Enable RLS
ALTER TABLE vector_search_criteria ENABLE ROW LEVEL SECURITY;

-- RLS Policy for access control
CREATE POLICY "Users can access vector search criteria"
ON vector_search_criteria
FOR ALL
USING (true);  -- Public read access for search functionality
```

#### 1.2 Procurement Vector Table

**Purpose**: Store procurement-specific document embeddings for AI-powered search and analysis.

```sql
-- Create procurement-specific vector table
CREATE TABLE IF NOT EXISTS public.a_01900_procurement_vector (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core document fields
    content TEXT NOT NULL,                       -- Document content for embedding
    embedding vector(1536),                      -- OpenAI embedding (1536 dimensions)
    metadata JSONB DEFAULT '{}'::jsonb,          -- Document metadata

    -- Procurement-specific fields
    document_type TEXT,                          -- e.g., "tender", "contract", "supplier_analysis"
    supplier_name TEXT,                          -- Supplier/contractor name
    contract_value DECIMAL,                      -- Contract value for filtering
    tender_status TEXT,                          -- e.g., "draft", "submitted", "awarded"
    compliance_category TEXT,                    -- e.g., "safety", "financial", "technical"

    -- State-aware classification (for enhanced chatbot)
    current_view TEXT,                          -- "agents", "upserts", "workspace"
    workflow_stage TEXT,                        -- e.g., "analysis", "evaluation", "approval"
    priority_level INTEGER DEFAULT 3,           -- 1-5 priority scale

    -- Access control
    organization_id UUID,                       -- Multi-tenant support
    workspace_id UUID,                          -- Workspace isolation
    created_by UUID,                            -- User who uploaded/created

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,

    -- Performance indexes
    CONSTRAINT procurement_vector_embedding_key UNIQUE (id)
);

-- Enable vector extension (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Enable RLS
ALTER TABLE a_01900_procurement_vector ENABLE ROW LEVEL SECURITY;

-- RLS Policy for organization-based access
CREATE POLICY "Organization access to procurement vectors"
ON a_01900_procurement_vector
FOR ALL
USING (
    organization_id = current_setting('app.current_organization_id', true)::UUID
);

-- RLS Policy for workspace isolation
CREATE POLICY "Workspace access to procurement vectors"
ON a_01900_procurement_vector
FOR SELECT
USING (
    workspace_id = current_setting('app.current_workspace_id', true)::UUID
    OR workspace_id IS NULL  -- Allow access to non-workspace documents
);
```

#### 1.3 Add Procurement Search Criteria

```sql
-- Insert procurement-specific search configurations
INSERT INTO vector_search_criteria (discipline, table_name, search_name, description, filter_criteria) VALUES

-- Agents View Searches
('procurement_01900', 'a_01900_procurement_vector', 'supplier_analysis', 'AI-powered supplier analysis and evaluation', '{"document_type": "supplier_analysis", "current_view": "agents"}'),
('procurement_01900', 'a_01900_procurement_vector', 'tender_evaluation', 'Tender evaluation criteria and processes', '{"document_type": "tender_evaluation", "current_view": "agents"}'),
('procurement_01900', 'a_01900_procurement_vector', 'contract_negotiation', 'Contract negotiation strategies and templates', '{"document_type": "contract_negotiation", "current_view": "agents"}'),

-- Upserts View Searches
('procurement_01900', 'a_01900_procurement_vector', 'supplier_database', 'Supplier database templates and formats', '{"document_type": "supplier_database", "current_view": "upserts"}'),
('procurement_01900', 'a_01900_procurement_vector', 'data_validation', 'Procurement data validation rules', '{"document_type": "data_validation", "current_view": "upserts"}'),
('procurement_01900', 'a_01900_procurement_vector', 'bulk_operations', 'Bulk data import/export procedures', '{"document_type": "bulk_operations", "current_view": "upserts"}'),

-- Workspace View Searches
('procurement_01900', 'a_01900_procurement_vector', 'team_collaboration', 'Procurement team collaboration guidelines', '{"document_type": "collaboration", "current_view": "workspace"}'),
('procurement_01900', 'a_01900_procurement_vector', 'approval_workflows', 'Procurement approval process documentation', '{"document_type": "approval_workflows", "current_view": "workspace"}'),
('procurement_01900', 'a_01900_procurement_vector', 'supplier_communication', 'Supplier communication templates and procedures', '{"document_type": "communication", "current_view": "workspace"}')

ON CONFLICT (discipline, search_name) DO NOTHING;
```

### 2. Chatbot System Tables

#### 2.1 User Chatbot Settings

**Purpose**: Store user-specific chatbot configurations and preferences.

```sql
-- User chatbot settings with LangChain integration
CREATE TABLE IF NOT EXISTS public.user_chatbot_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),

    -- Core settings
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    preferred_language TEXT DEFAULT 'en',
    theme_preferences JSONB DEFAULT '{}'::jsonb,

    -- Page-specific preferences
    page_preferences JSONB DEFAULT '{}'::jsonb,  -- {"01900": {"state": "agents", "theme": "procurement"}}

    -- LangChain integration (following existing pattern)
    langchain_settings JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_chatbot_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own chatbot settings"
ON user_chatbot_settings
FOR ALL
USING (auth.uid() = user_id);
```

#### 2.2 Chatbot Permissions

**Purpose**: Manage role-based access to chatbot features across different pages and states.

```sql
-- Chatbot permissions management
CREATE TABLE IF NOT EXISTS public.chatbot_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Permission details
    user_id UUID REFERENCES auth.users(id),
    page_id TEXT NOT NULL,                     -- e.g., "01900"
    role_id INTEGER,                           -- User role for permission inheritance

    -- Access control
    has_access BOOLEAN NOT NULL DEFAULT false,
    access_level TEXT DEFAULT 'read',          -- 'read', 'write', 'admin'

    -- State-specific permissions
    allowed_states TEXT[] DEFAULT '{}',        -- ['agents', 'upserts', 'workspace']
    denied_states TEXT[] DEFAULT '{}',

    -- Grant information
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chatbot_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own chatbot permissions"
ON chatbot_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage chatbot permissions"
ON chatbot_permissions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role_name IN ('admin', 'system_admin')
    )
);
```

#### 2.3 Chatbot Audit Logs

**Purpose**: Comprehensive audit trail for all chatbot interactions and activities.

```sql
-- Chatbot interaction audit logs
CREATE TABLE IF NOT EXISTS public.chatbot_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User context
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    user_role TEXT,

    -- Chatbot context
    page_id TEXT NOT NULL,                     -- e.g., "01900"
    chatbot_session_id TEXT,

    -- Interaction details
    interaction_type TEXT,                     -- 'query', 'search', 'workflow', 'state_change'
    action TEXT,                               -- Specific action performed
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Content context
    query_text TEXT,                           -- User's actual query
    response_summary TEXT,                     -- AI response summary
    vector_search_used BOOLEAN DEFAULT false,
    ai_workflow_triggered TEXT,                -- Workflow type if triggered

    -- State context
    current_state TEXT,                        -- "agents", "upserts", "workspace"
    state_transition_from TEXT,
    state_transition_to TEXT,

    -- Performance metrics
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_estimate DECIMAL(10,4),

    -- Technical context
    ip_address INET,
    user_agent TEXT,
    client_version TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chatbot_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy (read-only for users, full access for admins)
CREATE POLICY "Users can view their own chatbot audit logs"
ON chatbot_audit_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert chatbot audit logs"
ON chatbot_audit_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage chatbot audit logs"
ON chatbot_audit_logs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role_name IN ('admin', 'system_admin')
    )
);
```

### 3. Procurement-Specific Tables

#### 3.1 Procurement Vector Search Function

**Purpose**: Database function for optimized procurement vector searches with state filtering.

```sql
-- Create procurement vector search function
CREATE OR REPLACE FUNCTION procurement_vector_search(
    query_embedding vector(1536),
    match_count INT DEFAULT 5,
    state_filter TEXT DEFAULT NULL,  -- "agents", "upserts", "workspace"
    organization_filter UUID DEFAULT NULL,
    workspace_filter UUID DEFAULT NULL,
    filter_criteria JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    document_type TEXT,
    supplier_name TEXT,
    contract_value DECIMAL,
    tender_status TEXT,
    current_view TEXT,
    workflow_stage TEXT,
    priority_level INTEGER,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.content,
        v.metadata,
        v.document_type,
        v.supplier_name,
        v.contract_value,
        v.tender_status,
        v.current_view,
        v.workflow_stage,
        v.priority_level,
        (v.embedding <=> query_embedding) as similarity
    FROM a_01900_procurement_vector v
    WHERE
        -- Basic similarity filter
        v.embedding <=> query_embedding < 0.8

        -- State filter
        AND (state_filter IS NULL OR v.current_view = state_filter)

        -- Organization filter
        AND (organization_filter IS NULL OR v.organization_id = organization_filter)

        -- Workspace filter
        AND (workspace_filter IS NULL OR v.workspace_id = workspace_filter)

        -- Additional criteria filter
        AND (
            filter_criteria = '{}'::jsonb
            OR (
                (filter_criteria ? 'document_type' AND v.document_type = filter_criteria->>'document_type') OR
                (filter_criteria ? 'supplier_name' AND v.supplier_name = filter_criteria->>'supplier_name') OR
                (filter_criteria ? 'tender_status' AND v.tender_status = filter_criteria->>'tender_status') OR
                (filter_criteria ? 'workflow_stage' AND v.workflow_stage = filter_criteria->>'workflow_stage')
            )
        )

        -- RLS access control
        AND (
            v.organization_id = current_setting('app.current_organization_id', true)::UUID
            AND (
                v.workspace_id = current_setting('app.current_workspace_id', true)::UUID
                OR v.workspace_id IS NULL
            )
        )

    ORDER BY v.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION procurement_vector_search TO authenticated;
```

#### 3.2 Procurement AI Workflow Tracking

**Purpose**: Track AI workflow executions for procurement-specific processes.

```sql
-- AI workflow execution tracking
CREATE TABLE IF NOT EXISTS public.procurement_ai_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Workflow context
    workflow_type TEXT NOT NULL,               -- "supplier_analysis", "tender_evaluation", etc.
    page_id TEXT DEFAULT '01900',
    user_id UUID REFERENCES auth.users(id),

    -- Workflow data
    input_data JSONB,                          -- Initial input parameters
    output_data JSONB,                         -- AI-generated results
    workflow_status TEXT DEFAULT 'pending',    -- 'pending', 'running', 'completed', 'failed'

    -- State context
    current_state TEXT,                        -- "agents", "upserts", "workspace"
    workspace_id UUID,

    -- AI provider details
    ai_provider TEXT,                          -- "openai", "claude", etc.
    ai_model TEXT,                             -- Model used
    tokens_used INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,4) DEFAULT 0,

    -- Performance
    execution_time_ms INTEGER,
    error_details JSONB,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE procurement_ai_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own procurement workflows"
ON procurement_ai_workflows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own procurement workflows"
ON procurement_ai_workflows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procurement workflows"
ON procurement_ai_workflows
FOR UPDATE
USING (auth.uid() = user_id);
```

### 4. Performance Optimization Indexes

```sql
-- Indexes for optimal performance

-- Vector search performance
CREATE INDEX IF NOT EXISTS idx_procurement_vector_embedding
ON a_01900_procurement_vector USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- State filtering optimization
CREATE INDEX IF NOT EXISTS idx_procurement_vector_state
ON a_01900_procurement_vector (current_view, workflow_stage, document_type);

-- Organization and workspace filtering
CREATE INDEX IF NOT EXISTS idx_procurement_vector_org_workspace
ON a_01900_procurement_vector (organization_id, workspace_id);

-- Audit log performance
CREATE INDEX IF NOT EXISTS idx_chatbot_audit_user_time
ON chatbot_audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_audit_page_time
ON chatbot_audit_logs (page_id, created_at DESC);

-- Vector search criteria performance
CREATE INDEX IF NOT EXISTS idx_vector_search_criteria_discipline
ON vector_search_criteria (discipline, is_active);

-- Workflow tracking performance
CREATE INDEX IF NOT EXISTS idx_procurement_workflows_user_status
ON procurement_ai_workflows (user_id, workflow_status, created_at DESC);
```

## Implementation Checklist

### Phase 1: Core Vector System Setup

- [ ] Create enhanced `vector_search_criteria` table
- [ ] Create `a_01900_procurement_vector` table with full schema
- [ ] Insert procurement-specific search criteria
- [ ] Create procurement vector search function
- [ ] Test vector search functionality

### Phase 2: Chatbot System Tables

- [ ] Create `user_chatbot_settings` table
- [ ] Create `chatbot_permissions` table
- [ ] Create `chatbot_audit_logs` table
- [ ] Implement RLS policies for all tables
- [ ] Test user permission system

### Phase 3: Procurement-Specific Features

- [ ] Create `procurement_ai_workflows` table
- [ ] Test AI workflow tracking
- [ ] Verify state-aware search functionality
- [ ] Test workspace isolation

### Phase 4: Performance Optimization

- [ ] Create all performance indexes
- [ ] Test search performance with sample data
- [ ] Verify RLS policies work correctly
- [ ] Load test with realistic data volume

## Migration Scripts

### Complete Setup Script

```sql
-- 01900 Procurement Chatbot Database Setup
-- Execute this script to set up all required tables and functions

-- 1. Enhanced Vector Search Criteria Table
CREATE TABLE IF NOT EXISTS public.vector_search_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discipline TEXT NOT NULL,
    table_name TEXT NOT NULL,
    search_name TEXT NOT NULL,
    description TEXT,
    filter_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_discipline_search UNIQUE (discipline, search_name)
);

-- 2. Procurement Vector Table
CREATE TABLE IF NOT EXISTS public.a_01900_procurement_vector (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    document_type TEXT,
    supplier_name TEXT,
    contract_value DECIMAL,
    tender_status TEXT,
    compliance_category TEXT,
    current_view TEXT,
    workflow_stage TEXT,
    priority_level INTEGER DEFAULT 3,
    organization_id UUID,
    workspace_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT procurement_vector_embedding_key UNIQUE (id)
);

-- 3. Enable RLS and create policies
ALTER TABLE vector_search_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE a_01900_procurement_vector ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access vector search criteria"
ON vector_search_criteria FOR ALL USING (true);

CREATE POLICY "Organization access to procurement vectors"
ON a_01900_procurement_vector FOR ALL
USING (organization_id = current_setting('app.current_organization_id', true)::UUID);

CREATE POLICY "Workspace access to procurement vectors"
ON a_01900_procurement_vector FOR SELECT
USING (
    workspace_id = current_setting('app.current_workspace_id', true)::UUID
    OR workspace_id IS NULL
);

-- 4. Insert procurement search criteria
INSERT INTO vector_search_criteria (discipline, table_name, search_name, description, filter_criteria) VALUES
('procurement_01900', 'a_01900_procurement_vector', 'supplier_analysis', 'AI-powered supplier analysis and evaluation', '{"document_type": "supplier_analysis", "current_view": "agents"}'),
('procurement_01900', 'a_01900_procurement_vector', 'tender_evaluation', 'Tender evaluation criteria and processes', '{"document_type": "tender_evaluation", "current_view": "agents"}'),
('procurement_01900', 'a_01900_procurement_vector', 'contract_negotiation', 'Contract negotiation strategies and templates', '{"document_type": "contract_negotiation", "current_view": "agents"}'),
('procurement_01900', 'a_01900_procurement_vector', 'supplier_database', 'Supplier database templates and formats', '{"document_type": "supplier_database", "current_view": "upserts"}'),
('procurement_01900', 'a_01900_procurement_vector', 'data_validation', 'Procurement data validation rules', '{"document_type": "data_validation", "current_view": "upserts"}'),
('procurement_01900', 'a_01900_procurement_vector', 'team_collaboration', 'Procurement team collaboration guidelines', '{"document_type": "collaboration", "current_view": "workspace"}')
ON CONFLICT (discipline, search_name) DO NOTHING;

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_procurement_vector_embedding
ON a_01900_procurement_vector USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_procurement_vector_state
ON a_01900_procurement_vector (current_view, workflow_stage, document_type);

-- 6. Create vector search function
CREATE OR REPLACE FUNCTION procurement_vector_search(
    query_embedding vector(1536),
    match_count INT DEFAULT 5,
    state_filter TEXT DEFAULT NULL,
    organization_filter UUID DEFAULT NULL,
    workspace_filter UUID DEFAULT NULL,
    filter_criteria JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id UUID, content TEXT, metadata JSONB, document_type TEXT,
    supplier_name TEXT, contract_value DECIMAL, tender_status TEXT,
    current_view TEXT, workflow_stage TEXT, priority_level INTEGER,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.content, v.metadata, v.document_type,
        v.supplier_name, v.contract_value, v.tender_status,
        v.current_view, v.workflow_stage, v.priority_level,
        (v.embedding <=> query_embedding) as similarity
    FROM a_01900_procurement_vector v
    WHERE
        v.embedding <=> query_embedding < 0.8
        AND (state_filter IS NULL OR v.current_view = state_filter)
        AND (organization_filter IS NULL OR v.organization_id = organization_filter)
        AND (workspace_filter IS NULL OR v.workspace_id = workspace_filter)
        AND (
            filter_criteria = '{}'::jsonb
            OR (
                (filter_criteria ? 'document_type' AND v.document_type = filter_criteria->>'document_type') OR
                (filter_criteria ? 'supplier_name' AND v.supplier_name = filter_criteria->>'supplier_name')
            )
        )
        AND (
            v.organization_id = current_setting('app.current_organization_id', true)::UUID
            AND (
                v.workspace_id = current_setting('app.current_workspace_id', true)::UUID
                OR v.workspace_id IS NULL
            )
        )
    ORDER BY v.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION procurement_vector_search TO authenticated;

-- Success message
SELECT '01900 Procurement Chatbot database setup completed successfully!' as status;
```

## Testing and Validation

### Test Script

```sql
-- Test procurement vector search functionality
DO $$
DECLARE
    test_embedding vector(1536);
    search_results INTEGER;
BEGIN
    -- Create test embedding (simplified)
    test_embedding := '[0.1,0.2,0.3]'::vector(1536);

    -- Test search function
    SELECT COUNT(*) INTO search_results
    FROM procurement_vector_search(test_embedding, 10);

    RAISE NOTICE 'Procurement vector search test completed. Found % results', search_results;

    -- Test criteria access
    IF (SELECT COUNT(*) FROM vector_search_criteria WHERE discipline = 'procurement_01900') > 0 THEN
        RAISE NOTICE 'Procurement search criteria loaded successfully';
    ELSE
        RAISE NOTICE 'WARNING: No procurement search criteria found';
    END IF;

    RAISE NOTICE 'Database setup validation completed';
END
$$;
```

## Rollback Plan

```sql
-- Rollback script for if issues occur
DROP FUNCTION IF EXISTS procurement_vector_search(vector(1536), int, text, uuid, uuid, jsonb);
DROP TABLE IF EXISTS public.a_01900_procurement_vector;
DELETE FROM vector_search_criteria WHERE discipline = 'procurement_01900';
-- Note: Keep vector_search_criteria table as it's used system-wide
```

## Success Criteria

### Database Setup Success

- [ ] All tables created without errors
- [ ] RLS policies allow proper access control
- [ ] Vector search function executes successfully
- [ ] Performance indexes created and optimized
- [ ] Test data can be inserted and retrieved

### Integration Success

- [ ] Chatbot can connect to vector search system
- [ ] State-aware search works correctly
- [ ] Workspace isolation functions properly
- [ ] Audit logging captures all interactions
- [ ] Permission system enforces access control

## Next Steps

1. **Execute Database Setup**: Run the migration script in Supabase
2. **Verify Table Creation**: Confirm all tables and functions are created
3. **Load Test Data**: Insert sample procurement documents for testing
4. **Update Component Code**: Modify chatbot component to use new database functions
5. **Test Integration**: Verify full chatbot functionality with database
6. **Monitor Performance**: Set up monitoring for search performance and usage

This database specification provides the foundation for implementing the enhanced 01900 Procurement chatbot with full state-aware functionality, vector search integration, and enterprise security features.
