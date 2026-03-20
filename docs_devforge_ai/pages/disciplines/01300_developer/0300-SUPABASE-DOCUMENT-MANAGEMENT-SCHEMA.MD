# Construction Procurement Platform - Document Management Database Schema

## Version History
- v1.0 (2025-09-15): Complete database schema for document management system
- v1.0-RC1 (2025-09-15): Production-ready schema with DocuMenso integration

## Executive Summary

This document provides the complete database schema for the Document Management System with integrated e-signature capabilities. The schema supports multi-tenant architecture, comprehensive document versioning, signature workflows, and compliance tracking for construction industry documents.

### Key Schema Features
- **Multi-tenant isolation** with organization-level data separation
- **Document versioning** with full audit trails
- **Signature workflow tracking** with DocuMenso integration
- **Industry-specific templates** and compliance frameworks
- **Advanced search and indexing** capabilities
- **Security and access control** with granular permissions

---

## 📋 **CORE DWDMES SCHEMAS**

### **1. ORGANIZATION & MULTI-TENANT FOUNDATION**

```sql
-- Organization/Tenant Management
CREATE TABLE organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    industry VARCHAR(100) DEFAULT 'Construction',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Organization Settings & Configurations
CREATE TABLE organization_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'security', 'compliance', 'document', 'signature'
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, category, setting_key)
);

-- User Management with Multi-tenant Support
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin', 'manager', 'user', 'viewer'
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Role Permissions
CREATE TABLE user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL, -- 'documents.create', 'documents.delete', 'signatures.approve'
    resource_type VARCHAR(50), -- 'document', 'signature', 'template', 'report'
    resource_id UUID,
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **2. DOCUMENT MANAGEMENT CORE**

```sql
-- Document Master Table
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_number VARCHAR(20) UNIQUE NOT NULL, -- 1300_XXXX format
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL, -- 'procurement', 'legal', 'technical', 'quality', 'safety', 'administrative'
    sub_category VARCHAR(100),
    template_id UUID, -- Reference to document_templates if created from template
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending_review', 'reviewed', 'approved', 'signed', 'archived'
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id), -- For revisions
    current_version_id UUID, -- Link to latest version

    -- File Storage Information
    file_path VARCHAR(1000),
    file_name VARCHAR(255),
    original_file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_bucket VARCHAR(100),
    content_hash VARCHAR(128), -- SHA-256 hash for integrity

    -- Document Properties
    confidentiality_level VARCHAR(50) DEFAULT 'internal', -- 'public', 'internal', 'confidential', 'restricted'
    retention_period_years INTEGER DEFAULT 7,
    retention_disposal_date DATE,

    -- Geographic & Project Context
    project_id UUID,
    project_code VARCHAR(50),
    geographic_region VARCHAR(100),
    site_location TEXT,

    -- Audit & Tracking
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    signed_by UUID REFERENCES users(id),
    signed_at TIMESTAMPTZ,

    -- Metadata & Classification
    metadata JSONB, -- Flexible metadata fields
    tags TEXT[], -- Search tags
    classification_tags TEXT[], -- Industry-specific classifications
    keywords TEXT[], -- Extracted from content

    -- Security & Access
    requires_signature BOOLEAN DEFAULT false,
    signature_workflows JSONB, -- Document-specific signature requirements
    access_control JSONB, -- Custom access rules

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Document Versions
CREATE TABLE document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_label VARCHAR(50), -- 'v1.0', 'Draft', 'Final'
    file_path VARCHAR(1000),
    file_size BIGINT,
    content_hash VARCHAR(128),
    change_summary TEXT,

    -- Version Control
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    changes_applied JSONB, -- What changed in this version

    UNIQUE(document_id, version_number)
);

-- Document Templates
CREATE TABLE document_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL, -- 'contract', 'report', 'checklist', 'form'
    industry_category VARCHAR(50),
    document_category VARCHAR(50),

    -- Template Structure
    template_structure JSONB, -- Dynamic form fields and sections
    default_content TEXT,
    template_file_path VARCHAR(1000),
    thumbnail_path VARCHAR(500),

    -- Usage & Permissions
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    allowed_roles TEXT[],
    requires_approval BOOLEAN DEFAULT false,

    -- Audit
    created_by UUID REFERENCES users(id),
    last_updated_by UUID REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Relationships (for complex workflows)
CREATE TABLE document_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    related_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50), -- 'parent', 'child', 'reference', 'supersedes', 'related'
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(document_id, related_document_id, relationship_type)
);
```

---

### **3. E-SIGNATURE INTEGRATION SYSTEM**

```sql
-- Signature Requests (DocuMenso Integration)
CREATE TABLE signature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,

    -- DocuMenso Integration
    documenso_id VARCHAR(100) UNIQUE, -- External DocuMenso identifier
    documenso_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'completed', 'cancelled'

    -- Request Configuration
    title VARCHAR(500) NOT NULL,
    message TEXT,
    request_expires_at TIMESTAMPTZ,
    redirect_url VARCHAR(1000), -- Post-signature redirect

    -- Signature Workflow
    workflow_config JSONB, -- Multi-party signature configuration
    signers JSONB, -- Array of signer configurations
    sequential_signatures BOOLEAN DEFAULT false,

    -- Status Tracking
    created_by UUID REFERENCES users(id),
    initiated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,

    -- Audit & Compliance
    source_ip VARCHAR(50),
    user_agent TEXT,
    audit_trail JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Signatures (for tracking each signer)
CREATE TABLE signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE,
    signer_email VARCHAR(255) NOT NULL,
    signer_name VARCHAR(255),
    signer_order INTEGER DEFAULT 0,

    -- DocuMenso Specific
    sign_url VARCHAR(1000) UNIQUE,
    access_token VARCHAR(255),

    -- Signature Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'viewing', 'signed', 'declined', 'expired'
    signed_at TIMESTAMPTZ,
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Field Information
    signature_fields JSONB, -- Array of signature field placements
    custom_fields JSONB, -- Additional form fields for signer

    -- Compliance & Security
    authentication_method VARCHAR(50), -- 'email', 'sms', 'biometric'
    verification_code VARCHAR(100),
    legal_entity BOOLEAN DEFAULT false,

    -- Audit
    declined_reason TEXT,
    declined_at TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signature Templates (Reusable workflows)
CREATE TABLE signature_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_config JSONB, -- Signature workflow configuration
    document_types TEXT[], -- Applicable document types

    -- Usage & Management
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signature Audit Trail
CREATE TABLE signature_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    signature_request_id UUID REFERENCES signature_requests(id) ON DELETE CASCADE,
    signature_id UUID REFERENCES signatures(id),
    action VARCHAR(100) NOT NULL, -- 'created', 'viewed', 'signed', 'declined', 'expired'
    details JSONB,
    performed_by UUID REFERENCES users(id), -- If internal action
    performed_by_email VARCHAR(255), -- If external action
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **4. CONSTRUCTION INDUSTRY SPECIALIZATION**

```sql
-- Construction Project Integration
CREATE TABLE construction_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(500) NOT NULL,
    project_description TEXT,
    project_type VARCHAR(100), -- 'residential', 'commercial', 'industrial', 'infrastructure'
    project_value DECIMAL(15,2),
    currency_code VARCHAR(3) DEFAULT 'GBP',
    start_date DATE,
    estimated_completion_date DATE,
    actual_completion_date DATE,

    -- Contractors and Consultants
    main_contractor_id UUID,
    project_manager_id UUID REFERENCES users(id),
    quality_manager_id UUID REFERENCES users(id),

    -- Location Information
    site_address JSONB,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    geographic_region VARCHAR(100),

    -- Status & Progress
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'tendering', 'construction', 'completion', 'handover'
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    budget_utilization DECIMAL(5,2) DEFAULT 0,

    -- Compliance & Regulatory
    regulatory_authority VARCHAR(100),
    permits_required TEXT[],
    compliance_documents JSONB,

    -- Document Management Integration
    document_master_folders JSONB,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor Management
CREATE TABLE contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    company_type VARCHAR(50), -- 'limited', 'partnership', 'sole_trader'
    industry_classification VARCHAR(100),

    -- Contact Information
    primary_contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,

    -- Qualification & Certification
    qualification_status VARCHAR(50) DEFAULT 'pending', -- 'qualified', 'pending', 'disqualified'
    qualification_documents JSONB,
    certifications TEXT[], -- 'CSCS', 'NICEIC', 'CHAS', etc.
    insurance_coverages JSONB,

    -- Performance & Compliance
    performance_rating DECIMAL(3,2), -- 0.00 to 5.00
    compliance_score DECIMAL(5,2) DEFAULT 100.00,
    safety_record_rating VARCHAR(50),
    active_projects_count INTEGER DEFAULT 0,

    -- Capacity & Capabilities
    skill_categories TEXT[],
    geographic_capability TEXT[],
    capacity_rating VARCHAR(50), -- 'small', 'medium', 'large', 'specialist'

    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement Document Categories (Industry-Specific)
CREATE TABLE procurement_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    category_code VARCHAR(20) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    parent_category_id UUID REFERENCES procurement_categories(id),

    -- Category Configuration
    requires_prequalification BOOLEAN DEFAULT false,
    requires_insurance BOOLEAN DEFAULT false,
    signature_workflows JSONB,
    approval_hierarchy JSONB,

    -- Classification
    procurement_type VARCHAR(50), -- 'goods', 'services', 'works', 'consultants'
    industry_sector VARCHAR(100),
    typical_value_range JSONB, -- min, max values for validation

    -- Compliance Requirements
    required_certifications TEXT[],
    regulatory_requirements JSONB,
    quality_standards TEXT[],

    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **5. SEARCH & COMPLIANCE SYSTEM**

```sql
-- Document Search Index
CREATE TABLE document_search_index (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Search Content
    search_content TSVECTOR, -- PostgreSQL full-text search
    title_vector TSVECTOR,
    content_vector TSVECTOR,

    -- Metadata for Filtering
    document_type VARCHAR(50),
    status VARCHAR(50),
    confidentiality_level VARCHAR(50),
    document_number VARCHAR(20),
    project_code VARCHAR(50),

    -- User Access Control (for search filtering)
    access_users UUID[] DEFAULT '{}',
    access_roles TEXT[] DEFAULT '{}',
    user_organization_id UUID REFERENCES organizations(id),

    -- Search Optimization
    search_metadata JSONB,
    indexed_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(document_id, user_organization_id)
);

-- Compliance Tracking
CREATE TABLE compliance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    compliance_type VARCHAR(100) NOT NULL, -- 'GDPR', 'ISO9001', 'ISO27001', 'data_retention'
    compliance_standard VARCHAR(100),
    compliance_category VARCHAR(50), -- 'data_protection', 'information_security', 'quality_management'

    -- Compliance Subject
    related_document_id UUID REFERENCES documents(id),
    related_entity_type VARCHAR(50), -- 'document', 'signature', 'user', 'project'
    related_entity_id UUID,
    related_user_id UUID REFERENCES users(id),

    -- Compliance Details
    compliance_status VARCHAR(50) DEFAULT 'compliant', -- 'compliant', 'non-compliant', 'pending_review'
    compliance_requirement TEXT,
    compliance_evidence TEXT,
    compliance_actions JSONB,

    -- Time-based Compliance
    effective_from TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    last_reviewed_at TIMESTAMPTZ,

    -- Compliance Officer Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),

    -- Audit Trail
    created_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail System
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'document', 'signature', 'user', 'project'
    entity_id UUID,
    previous_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES users(id),
    performed_from_system VARCHAR(50), -- 'web', 'mobile', 'api', 'documenso'
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Email & Notification Log
CREATE TABLE notification_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    notification_type VARCHAR(50), -- 'document_shared', 'signature_requested', 'document_approved'
    recipient_user_id UUID REFERENCES users(id),
    recipient_email VARCHAR(255),
    subject VARCHAR(500),
    message_body TEXT,
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'failed'
    external_id VARCHAR(255), -- Mail system delivery ID
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **6. DWDMES SECUITY & ROW LEVEL SECURITY (RLS)**

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- Organization-level RLS Policies
CREATE POLICY organizations_policy ON organizations
    FOR ALL USING (true);

-- User-specific RLS Policies
CREATE POLICY users_policy ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Cross-organization data access (admin only)
CREATE POLICY admin_users_policy ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role = 'admin'
            AND admin_user.organization_id = users.organization_id
        )
    );

-- Document Security
CREATE POLICY document_read_policy ON documents
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        ) OR confidentiality_level = 'public'
    );

CREATE POLICY document_write_policy ON documents
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Signature Security
CREATE POLICY signature_read_policy ON signatures
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );
```

---

## 📊 **DWDMES INDEXING STRATEGY**

```sql
-- Performance Indexes
CREATE INDEX CONCURRENTLY idx_documents_org_type ON documents(organization_id, document_type, status);
CREATE INDEX CONCURRENTLY idx_documents_project ON documents(project_id);
CREATE INDEX CONCURRENTLY idx_documents_search ON documents USING GIN(search_content);
CREATE INDEX CONCURRENTLY idx_signatures_request_status ON signatures(signature_request_id, status);
CREATE INDEX CONCURRENTLY idx_audit_log_entity ON audit_log(entity_type, entity_id, timestamp);

-- Composite Indexes for Common Queries
CREATE INDEX CONCURRENTLY idx_documents_composite ON documents(organization_id, status, document_type, created_at);
CREATE INDEX CONCURRENTLY idx_signatures_composite ON signatures(signature_request_id, status, signed_at);

-- Partial Indexes for Performance
CREATE INDEX CONCURRENTLY idx_documents_active ON documents(id, document_number)
    WHERE status NOT IN ('archived', 'deleted');

-- JSONB Indexes for Metadata Queries
CREATE INDEX CONCURRENTLY idx_documents_metadata ON documents USING GIN(metadata);
CREATE INDEX CONCURRENTLY idx_signatures_workflows ON signature_requests USING GIN(workflow_config);

-- Full Text Search Indexes
CREATE INDEX CONCURRENTLY idx_documents_fts ON documents USING GIN(to_tsvector('english', title || ' ' || description));
```

---

## 🚀 **DWDMES DEPLOYMENT SCRIPTS**

### **Schema Deployment Order**

```sql
-- Step 1: Core Foundation (Day 1)
\i scripts/01_organizations_and_users.sql
\i scripts/02_organization_settings.sql
\i scripts/03_user_permissions.sql

-- Step 2: Document Management Core (Day 2)
\i scripts/04_documents_schema.sql
\i scripts/05_document_versions.sql
\i scripts/06_document_templates.sql
\i scripts/07_document_relationships.sql

-- Step 3: Signature Integration (Day 3)
\i scripts/08_signature_requests.sql
\i scripts/09_signatures.sql
\i scripts/10_signature_templates.sql
\i scripts/11_signature_audit_log.sql

-- Step 4: Construction Industry Extensions
\i scripts/12_construction_projects.sql
\i scripts/13_contractors.sql
\i scripts/14_procurement_categories.sql

-- Step 5: Search & Compliance
\i scripts/15_document_search_index.sql
\i scripts/16_compliance_records.sql
\i scripts/17_audit_log.sql
\i scripts/18_notification_log.sql

-- Step 6: Security & Indexes
\i scripts/19_security_policies.sql
\i scripts/20_performance_indexes.sql
\i scripts/21_rls_policies.sql
```

---

## 📋 **TEST DATA POPULATION SCRIPTS**

```sql
-- Sample Organization Setup
INSERT INTO organizations (org_code, name, industry) VALUES
('CON001', 'ABC Construction Ltd', 'Construction'),
('ENG001', 'XYZ Engineering Services', 'Engineering');

-- Sample Document Types for Construction
INSERT INTO procurement_categories (organization_id, category_code, category_name, procurement_type) VALUES
((SELECT id FROM organizations WHERE org_code = 'CON001'), 'BUILD001', 'Building Construction Services', 'services'),
((SELECT id FROM organizations WHERE org_code = 'CON001'), 'ELEC001', 'Electrical Installation', 'works'),
((SELECT id FROM organizations WHERE org_code = 'CON001'), 'MECH001', 'Mechanical Services', 'works'),
((SELECT id FROM organizations WHERE org_code = 'CON001'), 'QUALITY', 'Quality Compliance Services', 'services');

-- Sample Signature Templates
INSERT INTO signature_templates (organization_id, name, template_config) VALUES
((SELECT id FROM organizations WHERE org_code = 'CON001'), 'Standard Construction Contract',
 '{
   "workflows": [
     {"order": 1, "role": "contractor", "fields": ["signature"]},
     {"order": 2, "role": "client_manager", "fields": ["signature", "date"]},
     {"order": 3, "role": "project_director", "fields": ["signature", "date"]}
   ],
   "expiration_days": 30
 }'
);
```

---

## 🔐 **SECURITY CONFIGURATION**

### **Database Security Settings**
```sql
-- Connection Security
ALTER DATABASE your_database SET ssl = on;
ALTER USER your_db_user SET password_encrypted = on;

-- Access Control
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated_user;
GRANT USAGE ON SCHEMA public TO authenticated_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Audit Settings
SET session_preload_libraries = 'audit';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_destination = 'stderr, csvlog';
```

### **DocuMenso Integration Security**
```sql
-- Secure API Key Storage
CREATE TABLE secure_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    api_provider VARCHAR(50), -- 'documenso'
    encrypted_key BYTEA,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Security
CREATE TABLE webhook_security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_url VARCHAR(1000) UNIQUE,
    security_token VARCHAR(128),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 **DWDMES PERFORMANCE METRICS**

### **Database Performance Targets**
- Document queries under 200ms
- Signature status updates under 100ms
- Search queries under 500ms (with filters)
- Bulk operations under 30s (up to 1000 records)

### **API Endpoints Structure**
```javascript
// Core Document Management APIs
GET    /api/organizations/:orgId/documents        - List documents
POST   /api/organizations/:orgId/documents        - Create document
PUT    /api/organizations/:orgId/documents/:id     - Update document
DELETE /api/organizations/:orgId/documents/:id     - Delete document

// Version Management APIs
GET    /api/documents/:id/versions                 - List versions
POST   /api/documents/:id/versions                 - Create version
PUT    /api/documents/:id/versions/:version        - Update version

// Template Management APIs
GET    /api/organizations/:orgId/templates         - List templates
POST   /api/organizations/:orgId/templates         - Create template
PUT    /api/templates/:id                          - Update template

// Signature Management APIs
POST   /api/documents/:id/signature-requests       - Create signature request
GET    /api/signature-requests/:id/status          - Get signature status
WEBHOOK /api/webhooks/documenso                    - DocuMenso callbacks
```

---

## 🎯 **IMPLEMENTATION CHECKLIST**

### **Database Deployment Verification**
- [ ] All tables created successfully
- [ ] All indexes applied
- [ ] RLS policies configured
- [ ] Foreign key constraints active
- [ ] Test data inserted

### **DocuMenso Integration Verification**
- [ ] API connectivity established
- [ ] Webhooks endpoints configured
- [ ] Authentication tokens stored
- [ ] Test signature requests successful

### **Document Management Testing**
- [ ] Document upload/download working
- [ ] Version control functioning
- [ ] Search indexing operational
- [ ] Access controls enforced

### **Signature Workflow Testing**
- [ ] Multi-party signature workflows working
- [ ] Status synchronization operational
- [ ] Compliance tracking enabled
- [ ] Audit trails capturing actions

**Database schema is now ready for deployment! This comprehensive schema supports the full Document Management & E-Signature System requirements with multi-tenant isolation, construction industry specialization, and complete DocuMenso integration capabilities.**
