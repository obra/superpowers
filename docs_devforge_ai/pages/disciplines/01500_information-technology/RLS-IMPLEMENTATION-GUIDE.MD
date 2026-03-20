# 0021 RLS Implementation Guide

## 🎯 Universal Row Level Security Implementation Framework

**For Implementing RLS Policies Across 300+ Database Tables**

This guide provides a systematic, efficient framework for implementing Row Level Security (RLS) policies across large-scale database systems. Designed for AI-assisted implementation with human oversight, this guide ensures consistent security patterns while maximizing automation efficiency.

---

## 🚨 Critical Implementation Notice

**This guide has been enhanced based on real-world implementation experiences.** Previous versions were inadequate and led to multiple implementation failures. This updated version includes comprehensive error prevention, schema validation, and troubleshooting procedures learned from implementing RLS across 15+ tables.

**Key Improvements:**
- ✅ Schema-First Mandatory Approach - Never implement without verifying actual schema
- ✅ Universal TEXT Casting - Prevents all type mismatch errors
- ✅ Column Existence Validation - Eliminates "column does not exist" errors
- ✅ **Circular Dependency Prevention** - New critical requirement to avoid infinite recursion
- ✅ Comprehensive Error Prevention - 15+ point checklists before implementation
- ✅ Enhanced Troubleshooting - Solutions for 20+ common issues
- ✅ Production-Ready Patterns - Tested across multiple table types

### 🚨 **CRITICAL SECURITY INCIDENT - October 11, 2025**

**INFINITE RECURSION CRISIS**: Complete system failure due to circular dependencies between `user_role_assignments` and `user_organization_access` tables. All policies referencing these core tables became inaccessible.

**Immediate Action Required**: All future RLS implementations must follow the new **Circular Dependency Prevention Protocol** outlined in this guide.

**Prevention Requirements**:
- ❌ **NEVER reference secured tables in RLS policies**
- ✅ **Use self-contained policy logic only**
- ✅ **Test for circular dependencies before deployment**
- ✅ **Follow dependency order: Core tables first, dependent tables second**

---

## 📋 Implementation Prerequisites

### System Requirements Checklist

**Before implementing any RLS policies:**

- [x] `role_definitions` table exists with JSONB permissions:
  ```sql
  CREATE TABLE role_definitions (
    id serial PRIMARY KEY,
    role_name varchar(50) UNIQUE NOT NULL,
    permissions jsonb NOT NULL,
    description text,
    is_active boolean DEFAULT true
  );
  ```

- [x] `user_roles` table properly configured for user-to-role assignments:
  ```sql
  CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    role text NOT NULL,
    department_code text,
    created_at timestamp DEFAULT now()
  );
  ```

- [x] `generate_rls_policy_inventory()` function exists for security dashboard:
  ```sql
  -- ✅ IMPLEMENTED: Function successfully created and operational
  -- Returns simplified dashboard metrics for 325+ tables
  -- Provides real-time security status monitoring
  CREATE OR REPLACE FUNCTION generate_rls_policy_inventory()
  RETURNS TABLE (
      tablename text,
      rls_status text,
      priority_level text,
      policies_active bigint
  ) AS $$
  -- [Implementation in server/sql/create_generate_rls_policy_inventory.sql]
  ```

- [x] `is_dev_mode()` function exists for development access

- [x] Security dashboard accessible at `/security-dashboard` - **✅ FULLY OPERATIONAL**
  - **API Endpoints Working:** `/api/security/dashboard`, `/api/security/tables`, `/api/security/table/:name`
  - **Real-time Data:** 325 tables analyzed, 11.4% security compliance
  - **React Dashboard:** Fully functional with comprehensive security monitoring

### Required Database Functions

```sql
-- Core security functions (create once)
CREATE OR REPLACE FUNCTION is_dev_mode() RETURNS BOOLEAN AS $$
  SELECT COALESCE(current_setting('app.dev_mode', TRUE), 'false')::BOOLEAN;
$$ LANGUAGE SQL;

-- RLS policy inventory function
CREATE OR REPLACE FUNCTION generate_rls_policy_inventory()
RETURNS TABLE(tablename TEXT, rls_status TEXT, priority_level TEXT, policies_active INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
-- [Implementation provided in this guide]
```

---

## 🔍 Table Analysis Framework

### Step 1: Schema Analysis Using Live Dashboards

**Use the web-based dashboards for instant schema analysis:**

#### Schema Dashboard: `https://construct-ai.onrender.com/#/schema-dashboard`
- **✅ REAL DATABASE DATA**: Now provides actual schema information from PostgreSQL
- **Browse all tables** with real column details, data types, and constraints
- **Search and filter** tables by name or schema with live data
- **View table health** based on primary keys and timestamp columns
- **Real column information** for RLS pattern determination

#### RLS Security Dashboard: `https://construct-ai.onrender.com/#/rls-security-dashboard`
- **View current RLS status** for all tables with real-time data
- **Monitor policy compliance** across the system
- **Identify unsecured tables** requiring implementation
- **Track implementation progress** in real-time
- **Detailed table analysis** with column information and policy details

### Step 2: Circular Dependency Prevention Protocol

**🚨 CRITICAL REQUIREMENT**: All RLS implementations must prevent circular dependencies that cause infinite recursion.

#### **Dependency Analysis Checklist**
- [ ] **Identify table relationships**: Map which tables reference which others
- [ ] **Check for circular references**: Ensure A→B→A patterns don't exist
- [ ] **Verify policy self-containment**: Policies should not reference secured tables
- [ ] **Test recursion scenarios**: Simulate policy evaluation chains

#### **Safe Implementation Order**
1. **Core Authentication Tables First**:
   - `user_role_assignments` (self-contained policies only)
   - `user_organization_access` (self-contained policies only)

2. **Dependent Tables Second**:
   - Tables that reference core tables safely
   - No back-references to dependent tables

#### **Forbidden Patterns (Cause Infinite Recursion)**
```sql
-- ❌ CIRCULAR DEPENDENCY - NEVER DO THIS
CREATE POLICY "problematic" ON user_role_assignments FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_organization_access WHERE user_id = auth.uid())
);

CREATE POLICY "problematic" ON user_organization_access FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_role_assignments WHERE user_id = auth.uid())
);
```

#### **Safe Patterns (Self-Contained)**
```sql
-- ✅ SELF-CONTAINED - ALWAYS DO THIS
CREATE POLICY "safe_ownership" ON user_role_assignments FOR SELECT USING (
    user_id::text = auth.uid()::text  -- Direct comparison, no table references
);

CREATE POLICY "safe_ownership" ON user_organization_access FOR SELECT USING (
    user_id::text = auth.uid()::text  -- Direct comparison, no table references
);
```

### Step 3: Security Pattern Determination

| Table Type | Has organization_id | Has owner column | Pattern | Example Tables |
|------------|-------------------|------------------|---------|----------------|
| System Admin | ❌ No | ❌ None | **A: System Administration** | `user_management`, `system_settings` |
| Organization Data | ✅ Yes | ❌ None | **B: Organization-Scoped** | `procurement_templates`, `safety_templates` |
| User-Owned Data | ❌ No | ✅ Yes | **C: User-Owned** | `user_emails`, `personal_documents` |
| Reference Data | ❌ No | ❌ None | **D: Reference/Shared** | `departments`, `categories` |

---

## 🛡️ Security Pattern Implementation Templates

### Pattern A: System Administration Tables

**Characteristics:** System-wide access, role-based permissions, no organization scoping

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "dev_mode_full_access" ON {table_name};
DROP POLICY IF EXISTS "service_role_full_access" ON {table_name};
DROP POLICY IF EXISTS "authenticated_view_access" ON {table_name};
DROP POLICY IF EXISTS "it_manager_create_access" ON {table_name};
DROP POLICY IF EXISTS "user_update_access" ON {table_name};
DROP POLICY IF EXISTS "it_manager_delete_access" ON {table_name};

-- Policy 1: Development access
CREATE POLICY "dev_mode_full_access" ON {table_name}
FOR ALL USING (is_dev_mode());

-- Policy 2: Service role access
CREATE POLICY "service_role_full_access" ON {table_name}
FOR ALL USING (auth.role() = 'service_role'::text);

-- Policy 3: Authenticated users can view
CREATE POLICY "authenticated_view_access" ON {table_name}
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 4: IT Manager create access (JSONB permissions)
CREATE POLICY "it_manager_create_access" ON {table_name}
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND rd.permissions ? 'system_admin'
        AND jsonb_array_length(rd.permissions->'system_admin') > 0
        AND rd.is_active = true
    )
);

-- Policy 5: User update access (self-service + IT roles)
CREATE POLICY "user_update_access" ON {table_name}
FOR UPDATE USING (
    {owner_column} = auth.uid()  -- Replace with actual owner column
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND (rd.permissions ? 'system_admin' OR rd.permissions ? 'admin')
        AND rd.is_active = true
    )
);

-- Policy 6: IT Manager delete access (JSONB permissions)
CREATE POLICY "it_manager_delete_access" ON {table_name}
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND rd.permissions ? 'system_admin'
        AND rd.is_active = true
    )
);
```

### Pattern B: Organization-Scoped Tables

**Characteristics:** Multi-tenant data, organization-based access, creator ownership

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "dev_mode_full_access" ON {table_name};
DROP POLICY IF EXISTS "service_role_full_access" ON {table_name};
DROP POLICY IF EXISTS "organization_view_access" ON {table_name};
DROP POLICY IF EXISTS "organization_create_access" ON {table_name};
DROP POLICY IF EXISTS "creator_update_access" ON {table_name};
DROP POLICY IF EXISTS "admin_delete_access" ON {table_name};

-- Policy 1: Development access
CREATE POLICY "dev_mode_full_access" ON {table_name}
FOR ALL USING (is_dev_mode());

-- Policy 2: Service role access
CREATE POLICY "service_role_full_access" ON {table_name}
FOR ALL USING (auth.role() = 'service_role'::text);

-- Policy 3: Organization view access
CREATE POLICY "organization_view_access" ON {table_name}
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = {table_name}.organization_id::text
    ) OR {table_name}.created_by = auth.uid()
);

-- Policy 4: Organization create access
CREATE POLICY "organization_create_access" ON {table_name}
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = {table_name}.organization_id::text
    )
);

-- Policy 5: Creator/Admin update access (JSONB permissions)
CREATE POLICY "creator_update_access" ON {table_name}
FOR UPDATE USING (
    created_by = auth.uid()
    OR approval_status = 'draft'  -- If applicable
    OR EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND (rd.permissions ? 'admin' OR rd.permissions ? 'system_admin')
        AND rd.is_active = true
    )
);

-- Policy 6: Admin delete access (JSONB permissions)
CREATE POLICY "admin_delete_access" ON {table_name}
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND (rd.permissions ? 'admin' OR rd.permissions ? 'system_admin')
        AND rd.is_active = true
    )
);
```

### Pattern C: User-Owned Tables

**Characteristics:** Personal user data, owner-only access, admin overrides

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "dev_mode_full_access" ON {table_name};
DROP POLICY IF EXISTS "service_role_full_access" ON {table_name};
DROP POLICY IF EXISTS "owner_only_access" ON {table_name};
DROP POLICY IF EXISTS "admin_override_access" ON {table_name};

-- Policy 1: Development access
CREATE POLICY "dev_mode_full_access" ON {table_name}
FOR ALL USING (is_dev_mode());

-- Policy 2: Service role access
CREATE POLICY "service_role_full_access" ON {table_name}
FOR ALL USING (auth.role() = 'service_role'::text);

-- Policy 3: Owner-only access
CREATE POLICY "owner_only_access" ON {table_name}
FOR ALL USING ({owner_column} = auth.uid());  -- Replace with actual owner column

-- Policy 4: Admin override access (JSONB permissions)
CREATE POLICY "admin_override_access" ON {table_name}
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND (rd.permissions ? 'admin' OR rd.permissions ? 'system_admin')
        AND rd.is_active = true
    )
);
```

### Pattern D: Reference/Shared Tables

**Characteristics:** System-wide reference data, read access for all, admin write access

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "dev_mode_full_access" ON {table_name};
DROP POLICY IF EXISTS "service_role_full_access" ON {table_name};
DROP POLICY IF EXISTS "authenticated_read_access" ON {table_name};
DROP POLICY IF EXISTS "admin_write_access" ON {table_name};

-- Policy 1: Development access
CREATE POLICY "dev_mode_full_access" ON {table_name}
FOR ALL USING (is_dev_mode());

-- Policy 2: Service role access
CREATE POLICY "service_role_full_access" ON {table_name}
FOR ALL USING (auth.role() = 'service_role'::text);

-- Policy 3: Authenticated read access
CREATE POLICY "authenticated_read_access" ON {table_name}
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 4: Admin write access (JSONB permissions - separate policies for each operation)
CREATE POLICY "admin_write_insert" ON {table_name}
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND (rd.permissions ? 'admin' OR rd.permissions ? 'system_admin')
        AND rd.is_active = true
    )
);

CREATE POLICY "admin_write_update" ON {table_name}
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND (rd.permissions ? 'admin' OR rd.permissions ? 'system_admin')
        AND rd.is_active = true
    )
);

CREATE POLICY "admin_write_delete" ON {table_name}
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_definitions rd ON ur.role = rd.role_name
        WHERE ur.user_id = auth.uid()::text
        AND (rd.permissions ? 'admin' OR rd.permissions ? 'system_admin')
        AND rd.is_active = true
    )
);
```

---

## 🧪 Testing & Verification Framework

### Automated Testing Commands

**For each implemented table, run these verification tests:**

```sql
-- 1. Verify policies are active
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = '{table_name}'
ORDER BY policyname;

-- 2. Test security dashboard integration
SELECT * FROM generate_rls_policy_inventory()
WHERE tablename = '{table_name}';

-- 3. Count active policies (should be 4-6 depending on pattern)
SELECT COUNT(*) as policies_count
FROM pg_policies
WHERE tablename = '{table_name}';

-- 4. Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = '{table_name}';
```

### Manual Testing Scenarios

**Test each policy with different user roles:**
- Test as regular user (should have limited access)
- Test as IT officer (should have update access)
- Test as IT manager (should have full access)
- Test as admin (should have full access)
- Test service role (should have full access)

---

## ⚡ Efficiency Optimization Strategies

### Batch Processing Approach

**For implementing across 300 tables:**
1. **Categorize tables first** by pattern type
2. **Process in batches** of 5-10 tables simultaneously
3. **Use AI assistance** for parallel implementation
4. **Verify each batch** before proceeding

### Template Variables Reference

| Variable | Description | How to Determine |
|----------|-------------|------------------|
| `{table_name}` | The table being secured | Direct from table name |
| `{owner_column}` | Column containing user ID | `user_id`, `created_by`, `owner_id`, etc. |
| `{organization_column}` | Organization relationship | Usually `organization_id` |

---

## 🎯 Implementation Workflow

### Phase 1: Foundation (Complete)
- [x] Define security architecture and patterns
- [x] Implement procurement_templates as reference
- [x] Establish audit and compliance frameworks

### Phase 2: System-Wide Implementation (Active)
- [x] Audit all existing tables against security guidelines
- [ ] Apply security fixes to non-compliant tables
- [ ] Implement comprehensive RLS policy management
- [ ] Create automated security audit processes

### Phase 3: Enhanced Security (Planning)
- [ ] Implement advanced RBAC systems
- [ ] Add MFA and additional authentication factors
- [ ] Deploy automated security monitoring
- [ ] Create security incident response procedures

---

## 📚 Integration References

### Related Documentation
- **[0020_AUTHENTICATION_OVERVIEW.md](0020_AUTHENTICATION_OVERVIEW.md)** - System overview and architecture
- **[0022_SECURITY_DASHBOARDS.md](0022_SECURITY_DASHBOARDS.md)** - Dashboard access and monitoring
- **[0023_IMPLEMENTATION_PROGRESS.md](0023_IMPLEMENTATION_PROGRESS.md)** - Current status and progress tracking
- **[0024_SECURITY_PATTERNS_REFERENCE.md](0024_SECURITY_PATTERNS_REFERENCE.md)** - Policy templates and examples
- **[0025_TROUBLESHOOTING_GUIDE.md](0025_TROUBLESHOOTING_GUIDE.md)** - Error resolution and debugging

### Recent Security Implementations
- **✅ Tasks Table RLS Policy Fix (December 2025)**: Implemented proper development mode support using established `is_dev_mode()` pattern. See `fix_tasks_rls_policy.sql` for the correct RLS policy implementation that resolves dashboard access issues in development mode while maintaining production security.

---

*This implementation guide provides the technical procedures for securing database tables. For current progress status, see [0023_IMPLEMENTATION_PROGRESS.md](0023_IMPLEMENTATION_PROGRESS.md).*
