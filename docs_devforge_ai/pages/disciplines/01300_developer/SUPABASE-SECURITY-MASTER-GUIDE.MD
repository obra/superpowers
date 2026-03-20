# 0300 Database Security Master Guide

## 🎯 Core Database Security & Access Control

This master guide consolidates all database security practices, Row Level Security (RLS) policies, table creation patterns, and security audit procedures for the Construct AI platform.

**Scope**: Database security, RLS policies, access control, table creation patterns, security audits
**Key Components**: RLS implementation, security patterns, audit procedures, access control
**Integration Points**: Authentication (0020), Application Logic (0100), Database Systems (0300)

---

## 🔐 Security Architecture Overview

### Database Security Hierarchy

```
Authentication Layer (Supabase Auth)
├── User Registration & Login
├── JWT Token Management
└── Session Management

Access Control Layer (RLS Policies)
├── Organization-Based Isolation
├── Role-Based Permissions
├── Creator Ownership
└── Workflow Status Controls

Database Layer (PostgreSQL)
├── Table Structure & Constraints
├── Indexes & Performance
├── Audit Trails
└── Data Integrity
```

### Security Principles

1. **Defense in Depth**: Multiple security layers from application to database
2. **Least Privilege**: Users can only access data they need
3. **Organization Isolation**: Data is segregated by organization boundaries
4. **Audit Everything**: All data access is logged and trackable
5. **Fail Safe Defaults**: Security restrictions are applied by default

---

## 🛡️ Row Level Security (RLS) Implementation

### RLS Policy Patterns

#### **Pattern A: Development Mode Bypass (Safe Development)**
```sql
-- Enable RLS but allow development access
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Development bypass policy
CREATE POLICY "dev_mode_full_access" ON [table_name]
FOR ALL USING (is_dev_mode());

-- Fallback for authenticated users
CREATE POLICY "[table_name]_dev_access" ON [table_name]
FOR ALL USING (auth.role() = 'authenticated');
```

#### **Pattern B: Production Organization-Based Access (7 Policies)**
```sql
-- Complete production security implementation
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- 1. Development mode bypass
CREATE POLICY "dev_mode_full_access" ON [table_name]
FOR ALL USING (is_dev_mode());

-- 2. Development authenticated access
CREATE POLICY "[table_name]_dev_access" ON [table_name]
FOR ALL USING (auth.uid() IS NULL AND auth.role() IS NULL AND organization_id = 'dev-org-id')
    OR auth.role() = 'authenticated';

-- 3. Service role full access
CREATE POLICY "service_role_full_access" ON [table_name]
FOR ALL USING (auth.role() = 'service_role');

-- 4. Organization-based read access
CREATE POLICY "Users can view [table_name] in their organization" ON [table_name]
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = [table_name].organization_id::text
    ) OR [table_name].created_by = auth.uid()
);

-- 5. Organization-based create access
CREATE POLICY "Users can create [table_name] in their organization" ON [table_name]
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = [table_name].organization_id::text
    )
);

-- 6. Enhanced update access (creator + role-based)
CREATE POLICY "Users can update their own [table_name]" ON [table_name]
FOR UPDATE USING (
    created_by = auth.uid()
    OR approval_status = 'draft'
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()::text
        AND ur.role IN ('admin', 'manager', 'supervisor')
    )
);

-- 7. Enhanced delete access (creator + role-based)
CREATE POLICY "Users can delete their own draft [table_name]" ON [table_name]
FOR DELETE USING (
    (created_by = auth.uid() AND approval_status = 'draft')
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()::text
        AND ur.role IN ('admin', 'manager')
    )
);
```

### Reference Implementation: procurement_templates

The `procurement_templates` table serves as the reference implementation for all new Supabase tables requiring organization-based access control:

#### **Complete RLS Implementation (7 Policies)**
```sql
-- Enable RLS for production security
ALTER TABLE procurement_templates ENABLE ROW LEVEL SECURITY;

-- Policy 1: Development Mode Full Access
CREATE POLICY "dev_mode_full_access" ON procurement_templates
FOR ALL USING (is_dev_mode());

-- Policy 2: Development Access with Organization Fallback
CREATE POLICY "procurement_templates_dev_access" ON procurement_templates
FOR ALL USING (
    (auth.uid() IS NULL AND auth.role() IS NULL AND organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94')
    OR auth.role() = 'authenticated'
);

-- Policy 3: Service Role Full Access
CREATE POLICY "service_role_full_access" ON procurement_templates
FOR ALL USING (auth.role() = 'service_role'::text);

-- Policy 4: Organization-Based View Access
CREATE POLICY "Users can view templates in their department" ON procurement_templates
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = procurement_templates.organization_id::text
    ) OR procurement_templates.created_by = auth.uid()
);

-- Policy 5: Organization-Based Create Access
CREATE POLICY "Users can create templates in their department" ON procurement_templates
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = procurement_templates.organization_id::text
    )
);

-- Policy 6: Enhanced Update Access (Creator + Role-Based)
CREATE POLICY "Users can update their own templates" ON procurement_templates
FOR UPDATE USING (
    created_by = auth.uid()
    OR approval_status = 'draft'
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()::text
        AND ur.role IN ('admin', 'procurement_manager', 'procurement_officer')
    )
);

-- Policy 7: Enhanced Delete Access (Creator + Role-Based)
CREATE POLICY "Users can delete their own draft templates" ON procurement_templates
FOR DELETE USING (
    (created_by = auth.uid() AND approval_status = 'draft')
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()::text
        AND ur.role IN ('admin', 'procurement_manager')
    )
);
```

#### **Performance Index Strategy**
```sql
-- Core business filters
CREATE INDEX idx_templates_category ON procurement_templates(template_category);
CREATE INDEX idx_templates_type ON procurement_templates(template_type);
CREATE INDEX idx_templates_approval ON procurement_templates(approval_status);
CREATE INDEX idx_templates_latest ON procurement_templates(is_latest) WHERE is_latest = true;

-- Hierarchy and classification
CREATE INDEX idx_templates_level1 ON procurement_templates(level1_code);
CREATE INDEX idx_templates_level2 ON procurement_templates(level2_code);
CREATE INDEX idx_templates_level3 ON procurement_templates(level3_code);

-- Access control and relationships
CREATE INDEX idx_templates_organization ON procurement_templates(organization_id);
CREATE INDEX idx_templates_creator ON procurement_templates(created_by);

-- Temporal and audit
CREATE INDEX idx_templates_created ON procurement_templates(created_at DESC);
CREATE INDEX idx_templates_updated ON procurement_templates(updated_at DESC);
```

---

## 📋 Table Creation Master Template

### Required Context for AI/Table Creation
```
You are a Supabase SQL expert. Create a comprehensive table for [FEATURE_NAME] with:
- Production-ready RLS policies that can be disabled for development
- Organization-based access control using user_organization_access table
- Creator ownership patterns
- Workflow status management where applicable
- Comprehensive indexes for performance
- Audit trail with created_at/updated_at timestamps
- JSONB fields for flexible metadata
- Foreign key constraints with error handling

Use the procurement_templates table as the reference implementation pattern.
```

### Business Requirements Template
```
Create a table called [table_name] for managing [business_domain] with:
- Multi-tenant organization isolation
- User access control (read/write/admin levels)
- Status workflow: [draft/active/archived/complete]
- Related data: [foreign keys to reference tables]
- Search and filter requirements: [key fields for querying]
- Audit trail for: [creation, updates, deletions, approvals]
```

### Technical Implementation Template
```sql
-- Table: [table_name]
-- Purpose: [business purpose description]
-- Security: Organization-based RLS with creator ownership

CREATE TABLE [table_name] (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core business fields
    [field_name] VARCHAR(255) NOT NULL,
    [field_description] TEXT,

    -- Organization and access control
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES user_management(user_id),

    -- Workflow and status
    status VARCHAR(20) DEFAULT 'draft',
    approval_status VARCHAR(20) DEFAULT 'pending',

    -- Flexible metadata
    metadata JSONB DEFAULT '{}',

    -- Audit trail
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Apply the 7-policy security pattern (see above)
-- [Insert appropriate RLS policies based on Pattern B]

-- Performance indexes
CREATE INDEX idx_[table_name]_organization ON [table_name](organization_id);
CREATE INDEX idx_[table_name]_creator ON [table_name](created_by);
CREATE INDEX idx_[table_name]_status ON [table_name](status);
CREATE INDEX idx_[table_name]_created ON [table_name](created_at DESC);

-- Constraints
ALTER TABLE [table_name] ADD CONSTRAINT valid_status
    CHECK (status IN ('draft', 'active', 'archived', 'complete'));

ALTER TABLE [table_name] ADD CONSTRAINT valid_approval_status
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
```

---

## 🔍 Security Audit & Compliance

### Automated RLS Policy Audit System

#### **Database Function for Policy Inventory**
```sql
CREATE OR REPLACE FUNCTION generate_rls_policy_inventory()
RETURNS TABLE (
    tablename text,
    policies_active bigint,
    rls_status text,
    organization_access text,
    creator_ownership text,
    admin_override text,
    priority_level text,
    last_audit date
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tablename,
        COALESCE(stats.policy_count, 0) as policies_active,
        CASE
            WHEN stats.policy_count IS NULL OR stats.policy_count = 0 THEN '❌ NO SECURITY'
            WHEN stats.policy_count < 3 THEN '🔶 PARTIALLY SECURE'
            WHEN stats.policy_count >= 3 AND stats.has_org_access THEN '✅ FULLY SECURE'
            ELSE '🔶 PARTIALLY SECURE'
        END as rls_status,
        CASE WHEN stats.organization_access THEN '✅ IMPLEMENTED' ELSE '❌ MISSING' END as organization_access,
        CASE WHEN stats.creator_ownership THEN '✅ IMPLEMENTED' ELSE '❌ MISSING' END as creator_ownership,
        CASE WHEN stats.admin_access THEN '✅ IMPLEMENTED' ELSE '❌ MISSING' END as admin_override,
        CASE
            WHEN t.tablename LIKE '%user_%' OR t.tablename LIKE '%contributor%'
                  OR t.tablename LIKE '%email%' OR t.tablename LIKE '%external_api%' THEN 'CRITICAL'
            WHEN t.tablename LIKE '%contract%' OR t.tablename LIKE '%project%'
                  OR t.tablename LIKE '%supplier%' OR t.tablename LIKE '%organization%' THEN 'HIGH'
            WHEN t.tablename LIKE '%template%' OR t.tablename LIKE '%document%'
                  OR t.tablename LIKE '%travel%' OR t.tablename LIKE '%financial%' THEN 'MEDIUM'
            ELSE 'LOW'
        END as criticality_assessment,
        NOW()::date as last_audit
    FROM pg_tables t
    LEFT JOIN (
        SELECT
            p.tablename,
            COUNT(*) as policy_count,
            BOOL_OR(p.qual LIKE '%user_organization_access%') as has_org_access,
            BOOL_OR(p.qual LIKE '%organization_id%') as organization_access,
            BOOL_OR(p.qual LIKE '%created_by%' OR p.qual LIKE '%user_id = auth.uid()%') as creator_ownership,
            BOOL_OR(p.qual LIKE '%admin%' OR p.qual LIKE '%role%') as admin_access,
            CASE
                WHEN t.tablename LIKE '%user_%' OR t.tablename LIKE '%contributor%'
                      OR t.tablename LIKE '%email%' OR t.tablename LIKE '%external_api%' THEN 'CRITICAL'
                WHEN t.tablename LIKE '%contract%' OR t.tablename LIKE '%project%'
                      OR t.tablename LIKE '%supplier%' THEN 'HIGH'
                ELSE 'MEDIUM'
            END as criticality_assessment
        FROM pg_policies p
        JOIN pg_tables t ON p.tablename = t.tablename
        WHERE p.schemaname = 'public'
        GROUP BY p.tablename, t.tablename
    ) stats ON t.tablename = stats.tablename
    WHERE t.schemaname = 'public'
        AND t.tablename NOT LIKE 'pg_%'
        AND t.tablename NOT LIKE '%backup%'
    ORDER BY
        CASE stats.criticality_assessment
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
            ELSE 5
        END,
        stats.policy_count ASC,
        t.tablename;
END;
$$ LANGUAGE plpgsql;
```

#### **Critical Security Check Query**
```sql
-- Find ALL tables without any RLS policies (not just user tables)
SELECT
    schemaname,
    tablename,
    'CRITICAL - NO SECURITY' as risk_level,
    CASE
        WHEN tablename LIKE '%user_%' OR tablename LIKE '%contributor%'
             OR tablename LIKE '%email%' OR tablename LIKE '%external_api%' THEN '🔴 CRITICAL'
        WHEN tablename LIKE '%contract%' OR tablename LIKE '%project%'
             OR tablename LIKE '%supplier%' THEN '🟠 HIGH'
        ELSE '🟡 MEDIUM'
    END as priority
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT IN (
        SELECT tablename FROM pg_policies WHERE schemaname = 'public'
    )
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE '%backup%'
ORDER BY
    CASE
        WHEN tablename LIKE '%user_%' OR tablename LIKE '%contributor%'
             OR tablename LIKE '%email%' OR tablename LIKE '%external_api%' THEN 1
        WHEN tablename LIKE '%contract%' OR tablename LIKE '%project%'
             OR tablename LIKE '%supplier%' THEN 2
        ELSE 3
    END,
    tablename;
```

### Current RLS Policy Inventory Status

[Content from 0035_SUPABASE_RLS_POLICY_INVENTORY.md would be integrated here as the current status section]

---

## 🔄 Development vs Production Security Toggle

### Development Mode Configuration
```sql
-- Development: Disable RLS for easy testing
ALTER TABLE [new_table] DISABLE ROW LEVEL SECURITY;

-- All authenticated users have full access for development
-- Use for rapid prototyping and testing
```

### Production Mode Configuration
```sql
-- Production: Enable RLS for security
ALTER TABLE [new_table] ENABLE ROW LEVEL SECURITY;

-- Apply organization-based policies as shown in Pattern B
-- Provides proper data isolation and access control
```

### Easy Migration Workflow
```sql
-- Development to Production Migration
-- 1. Enable RLS
-- 2. Apply organization-based policies
-- 3. Test with sample data
-- 4. Deploy with monitoring

ALTER TABLE [new_table] ENABLE ROW LEVEL SECURITY;
-- Apply all 7 policies from Pattern B...
```

---

## 📊 Security Implementation Roadmap

### Phase 1: Critical Security Fixes (Immediate - <24hrs)
**Target Tables**: `user_management`, `contributors`, `emails`, `external_api_configurations`

### Phase 2: High Priority Business Data (<1 week)
**Target Tables**: `organizations`, `projects`, `contracts`, `suppliers`, `contractor_vetting`

### Phase 3: Medium Priority Data (2-4 weeks)
**Target Tables**: All remaining tables with partial security

### Phase 4: Compliance & Monitoring (Ongoing)
**Objectives**: Automated policy validation, regular security audits, policy documentation

---

## 🔧 Security Maintenance Procedures

### Quarterly Review Process
1. Run automated policy audit queries
2. Update inventory with any new tables
3. Review policy effectiveness
4. Update risk assessments

### After Schema Changes
1. Add new tables to inventory immediately
2. Implement appropriate RLS policies before deployment
3. Update audit dates
4. Verify compliance

### Emergency Response
1. **Critical Breach**: Disable public access immediately
2. **Policy Failure**: Implement emergency restriction policies
3. **Audit Finding**: Schedule immediate remediation

---

## 📚 Related Documentation

### Security Implementation References
- **Database Master Guide**: [`0300_DATABASE_MASTER_GUIDE.md`](../0300_DATABASE_MASTER_GUIDE.md) - Overall database architecture
- **Schema Reference**: [`0300_DATABASE_SCHEMA_REFERENCE.md`](../0300_DATABASE_SCHEMA_REFERENCE.md) - Table structures and constraints
- **Authentication Guide**: [`../authentication/0020_AUTHENTICATION_MASTER_GUIDE.md`](../authentication/0020_AUTHENTICATION_MASTER_GUIDE.md) - User management and auth patterns

### Implementation Resources
- **Table Creation Patterns**: Procurement templates as reference implementation
- **RLS Policy Templates**: 7-policy security pattern for organization-based access
- **Security Audit Queries**: Automated inventory and compliance checking

---

## 📈 Implementation Status & Metrics

### Security Coverage Metrics
- **Tables with RLS**: [Current count] / [Total tables]
- **Fully Secure Tables**: [Count with organization access]
- **Critical Security Gaps**: [Count of high-risk tables without security]
- **Audit Compliance**: [Last audit date and findings]

### Version History
- **v1.0**: Initial consolidation of table creation and RLS security guides
- **Consolidated from**: `0025_SUPABASE_TABLE_CREATION_PROMPT_GUIDE.md` and `0035_SUPABASE_RLS_POLICY_INVENTORY.md`

---

**This database security master guide serves as the comprehensive authority for all database security practices in Construct AI. Use the procurement_templates table as the reference implementation for all new database tables requiring organization-based access control.**
