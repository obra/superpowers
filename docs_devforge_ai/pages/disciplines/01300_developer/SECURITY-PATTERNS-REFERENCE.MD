# 0024 Security Patterns Reference

## 🎯 RLS Policy Templates and Examples

**Complete Reference for Row Level Security Policy Implementation**

This document provides comprehensive templates and examples for implementing Row Level Security (RLS) policies across different data access patterns. All templates include proper error prevention, type casting, and performance optimization.

---

## 🛡️ **SECURITY PATTERN IMPLEMENTATION TEMPLATES**

### **Pattern A: System Administration Tables**

**Characteristics:** System-wide access, role-based permissions, no organization scoping

**Use Case:** `user_management`, `system_settings`, `role_definitions`

```sql
-- =============================================
-- TABLE: {table_name} - SYSTEM ADMINISTRATION PATTERN
-- =============================================

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

-- Policy 4: IT Manager create access
CREATE POLICY "it_manager_create_access" ON {table_name}
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name = 'information_technology_manager'
        AND ura.is_active = true
    )
);

-- Policy 5: User update access (self-service + IT roles)
CREATE POLICY "user_update_access" ON {table_name}
FOR UPDATE USING (
    {owner_column} = auth.uid()  -- Replace with actual owner column
    OR EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager', 'information_technology_officer')
        AND ura.is_active = true
    )
);

-- Policy 6: IT Manager delete access
CREATE POLICY "it_manager_delete_access" ON {table_name}
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);
```

### **Pattern B: Organization-Scoped Tables**

**Characteristics:** Multi-tenant data, organization-based access, creator ownership

**Use Case:** `procurement_templates`, `safety_templates`, `contracts`

```sql
-- =============================================
-- TABLE: {table_name} - ORGANIZATION-SCOPED PATTERN
-- =============================================

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

-- Policy 5: Creator/Admin update access
CREATE POLICY "creator_update_access" ON {table_name}
FOR UPDATE USING (
    created_by = auth.uid()
    OR approval_status = 'draft'  -- If applicable
    OR EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);

-- Policy 6: Admin delete access
CREATE POLICY "admin_delete_access" ON {table_name}
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);
```

### **Pattern C: User-Owned Tables**

**Characteristics:** Personal user data, owner-only access, admin overrides

**Use Case:** `user_emails`, `personal_documents`, `user_profiles`

```sql
-- =============================================
-- TABLE: {table_name} - USER-OWNED PATTERN
-- =============================================

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

-- Policy 4: Admin override access
CREATE POLICY "admin_override_access" ON {table_name}
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);
```

### **Pattern D: Reference/Shared Tables**

**Characteristics:** System-wide reference data, read access for all, admin write access

**Use Case:** `departments`, `categories`, `lookup_tables`

```sql
-- =============================================
-- TABLE: {table_name} - REFERENCE/SHARED PATTERN
-- =============================================

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

-- Policy 4: Admin write access
CREATE POLICY "admin_write_access" ON {table_name}
FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);
```

---

## 🔧 **TEMPLATE VARIABLES REFERENCE**

### **Required Variables**

| Variable | Description | How to Determine | Example |
|----------|-------------|------------------|---------|
| `{table_name}` | The table being secured | Direct from table name | `procurement_templates` |
| `{owner_column}` | Column containing user ID | `user_id`, `created_by`, `owner_id` | `created_by` |
| `{organization_column}` | Organization relationship | Usually `organization_id` | `organization_id` |

### **Optional Variables**

| Variable | Description | When to Use | Example |
|----------|-------------|-------------|---------|
| `{approval_status}` | Workflow status column | For tables with approval workflows | `approval_status = 'draft'` |
| `{discipline_column}` | Discipline-specific access | For role-based discipline access | `discipline_id` |

---

## 📊 **PATTERN DETERMINATION MATRIX**

### **Quick Pattern Selection**

| Has organization_id | Has owner column | Table Type | Pattern | Example |
|-------------------|------------------|------------|---------|---------|
| ❌ No | ❌ None | System-wide data | **A** | `user_management`, `system_settings` |
| ✅ Yes | ❌ None | Multi-tenant business data | **B** | `procurement_templates`, `contracts` |
| ❌ No | ✅ Yes | Personal user data | **C** | `user_emails`, `personal_documents` |
| ❌ No | ❌ None | Reference/lookup data | **D** | `departments`, `categories` |

### **Advanced Pattern Selection**

#### **Pattern A Variations**
- **Pure System Admin**: `role_definitions`, `system_configurations`
- **User Management**: `user_management`, `user_roles`
- **Audit Tables**: `audit_log`, `system_logs`

#### **Pattern B Variations**
- **Transactional Data**: `procurement_orders`, `contracts`
- **Project Data**: `civil_engineering_projects`, `safety_incidents`
- **Workflow Data**: `governance_approval_instances`, `approval_workflows`

#### **Pattern C Variations**
- **User Profiles**: `user_profiles`, `user_preferences`
- **Personal Documents**: `personal_documents`, `user_attachments`
- **User Communications**: `user_emails`, `user_notifications`

#### **Pattern D Variations**
- **Reference Data**: `departments`, `categories`, `lookup_tables`
- **System Catalogs**: `document_types`, `status_codes`
- **Shared Resources**: `templates`, `standard_procedures`

---

## 🧪 **TESTING & VERIFICATION**

### **Automated Testing Commands**

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

### **Manual Testing Scenarios**

**Test each policy with different user roles:**

```sql
-- Test as regular user (should have limited access)
-- Test as IT officer (should have update access)
-- Test as IT manager (should have full access)
-- Test as admin (should have full access)
-- Test service role (should have full access)
```

---

## ⚡ **PERFORMANCE OPTIMIZATION**

### **Index Creation Guidelines**

**Always add indexes for policy-filtered columns:**

```sql
-- For Pattern B (Organization-Scoped)
CREATE INDEX IF NOT EXISTS idx_{table_name}_organization ON {table_name}(organization_id);
CREATE INDEX IF NOT EXISTS idx_{table_name}_creator ON {table_name}(created_by);

-- For Pattern C (User-Owned)
CREATE INDEX IF NOT EXISTS idx_{table_name}_owner ON {table_name}({owner_column});

-- For Pattern A (System Admin) - Usually no additional indexes needed
-- For Pattern D (Reference) - Usually no additional indexes needed
```

### **Index Naming Convention**

```
idx_{table_name}_{column_name}
```

**Examples:**
- `idx_procurement_templates_organization`
- `idx_user_emails_user_id`
- `idx_contracts_created_by`

---

## 🚨 **COMMON IMPLEMENTATION ERRORS**

### **Error Prevention Checklist**

**Before Implementation:**
- [ ] Verify table exists in database
- [ ] Confirm all referenced columns exist
- [ ] Check data types match expected patterns
- [ ] Ensure foreign key relationships are valid
- [ ] Test type casting with real data

**During Implementation:**
- [ ] Use universal TEXT casting for all comparisons
- [ ] Include proper policy drop statements
- [ ] Enable RLS on table after creating policies
- [ ] Add performance indexes for filtered columns
- [ ] Test with different user authentication states

**After Implementation:**
- [ ] Verify policies appear in security dashboard
- [ ] Test access with different user roles
- [ ] Monitor query performance impact
- [ ] Validate data integrity is maintained

### **Critical Error Patterns**

#### **1. Type Casting Errors**
```sql
-- ❌ WRONG: Mixed type comparisons fail
user_id = auth.uid()  -- TEXT = UUID → ERROR

-- ✅ CORRECT: Universal TEXT casting
user_id::text = auth.uid()::text  -- TEXT = TEXT → SUCCESS
```

#### **2. Missing Column References**
```sql
-- ❌ WRONG: References non-existent column
created_by = auth.uid()  -- ERROR if column doesn't exist

-- ✅ CORRECT: Verify column exists first
-- Check schema before implementation
```

#### **3. Incorrect Policy Order**
```sql
-- ❌ WRONG: Create policies before dropping old ones
CREATE POLICY "new_policy" ON table...  -- Conflicts with existing

-- ✅ CORRECT: Drop first, then create
DROP POLICY IF EXISTS "old_policy" ON table;
CREATE POLICY "new_policy" ON table...
```

---

## 📚 **IMPLEMENTATION EXAMPLES**

### **Example 1: Procurement Templates (Pattern B)**

```sql
-- Table: procurement_templates
-- Pattern: B (Organization-Scoped)
-- Columns: id, organization_id, created_by, template_name, template_content

-- Drop existing policies
DROP POLICY IF EXISTS "dev_mode_full_access" ON procurement_templates;
DROP POLICY IF EXISTS "service_role_full_access" ON procurement_templates;
DROP POLICY IF EXISTS "organization_view_access" ON procurement_templates;
DROP POLICY IF EXISTS "organization_create_access" ON procurement_templates;
DROP POLICY IF EXISTS "creator_update_access" ON procurement_templates;
DROP POLICY IF EXISTS "admin_delete_access" ON procurement_templates;

-- Create policies
CREATE POLICY "dev_mode_full_access" ON procurement_templates
FOR ALL USING (is_dev_mode());

CREATE POLICY "service_role_full_access" ON procurement_templates
FOR ALL USING (auth.role() = 'service_role'::text);

CREATE POLICY "organization_view_access" ON procurement_templates
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = procurement_templates.organization_id::text
    ) OR procurement_templates.created_by = auth.uid()
);

CREATE POLICY "organization_create_access" ON procurement_templates
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_organization_access uoa
        WHERE uoa.user_id = auth.uid()::text
        AND uoa.organization_id = procurement_templates.organization_id::text
    )
);

CREATE POLICY "creator_update_access" ON procurement_templates
FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);

CREATE POLICY "admin_delete_access" ON procurement_templates
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);

-- Enable RLS
ALTER TABLE procurement_templates ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_procurement_templates_organization ON procurement_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_procurement_templates_creator ON procurement_templates(created_by);
```

### **Example 2: User Emails (Pattern C)**

```sql
-- Table: user_emails
-- Pattern: C (User-Owned)
-- Columns: id, user_id, email, verified, created_at

-- Drop existing policies
DROP POLICY IF EXISTS "dev_mode_full_access" ON user_emails;
DROP POLICY IF EXISTS "service_role_full_access" ON user_emails;
DROP POLICY IF EXISTS "owner_only_access" ON user_emails;
DROP POLICY IF EXISTS "admin_override_access" ON user_emails;

-- Create policies
CREATE POLICY "dev_mode_full_access" ON user_emails
FOR ALL USING (is_dev_mode());

CREATE POLICY "service_role_full_access" ON user_emails
FOR ALL USING (auth.role() = 'service_role'::text);

CREATE POLICY "owner_only_access" ON user_emails
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "admin_override_access" ON user_emails
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);

-- Enable RLS
ALTER TABLE user_emails ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_emails_user_id ON user_emails(user_id);
```

---

## 📚 **RELATED DOCUMENTATION**

### **Implementation Guides**
- **[0020_AUTHENTICATION_OVERVIEW.md](0020_AUTHENTICATION_OVERVIEW.md)** - System overview and architecture
- **[0021_RLS_IMPLEMENTATION_GUIDE.md](0021_RLS_IMPLEMENTATION_GUIDE.md)** - Technical implementation procedures
- **[0022_SECURITY_DASHBOARDS.md](0022_SECURITY_DASHBOARDS.md)** - Dashboard access and monitoring
- **[0023_IMPLEMENTATION_PROGRESS.md](0023_IMPLEMENTATION_PROGRESS.md)** - Current status and progress tracking

### **Troubleshooting**
- **[0025_TROUBLESHOOTING_GUIDE.md](0025_TROUBLESHOOTING_GUIDE.md)** - Error resolution and debugging

---

*This reference provides all the templates and examples needed for implementing RLS policies. For implementation procedures, see [0021_RLS_IMPLEMENTATION_GUIDE.md](0021_RLS_IMPLEMENTATION_GUIDE.md).*
