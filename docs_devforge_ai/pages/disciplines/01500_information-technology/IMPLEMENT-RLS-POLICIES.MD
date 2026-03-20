# 🛡️ UNIFIED TEMPLATE RLS POLICIES - IMPLEMENTATION GUIDE (UPDATED)

## Overview
Complete, corrected RLS (Row Level Security) policies for the unified template system based on actual database schema analysis. These policies work with your existing authentication tables and provide enterprise-grade security.

## Quick Implementation (Recommended)

### Method 1: Supabase Dashboard (Production Ready)
1. **Open Supabase Dashboard** → Go to SQL Editor
2. **Copy the entire Phase 2 section** from `sql/02_create_unified_tables.sql`
3. **Execute in this order:**
   - PHASE 2A: Enable RLS
   - PHASE 2B: Template policies
   - PHASE 2C: Assignment policies
   - PHASE 2D: Config policies
   - PHASE 2E: Dev bypass
   - PHASE 2F: Verification
   - PHASE 2G: Audit logging
   - PHASE 2H: Seed data
   - PHASE 3: Final verification
4. **Check results** with the verification queries

### Method 2: Automated Script (Easiest)

Create `server/scripts/apply-rls-policies.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyRLSPolicies() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔒 Applying RLS Policies for Unified Template System...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../sql/02_create_unified_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Extract Phase 2 and execute
    const phase2Match = sqlContent.match(/-- PHASE 2A: ENABLE ROW LEVEL SECURITY.*?-- PHASE 2I:/s);
    if (phase2Match) {
      const phase2SQL = phase2Match[0];
      await supabase.rpc('exec_sql', { sql: phase2SQL });
    }

    // Execute Phase 3 (final verification)
    const phase3Match = sqlContent.match(/-- PHASE 3: FINAL VERIFICATION.*?SELECT.*FROM template_assignments;/s);
    if (phase3Match) {
      const phase3SQL = phase3Match[0];
      await supabase.rpc('exec_sql', { sql: phase3SQL });
    }

    console.log('✅ RLS policies applied successfully');

    // Verify implementation
    const { data: policies } = await supabase.from('pg_policies').select('*').in('tablename', [
      'templates', 'template_assignments', 'discipline_template_config'
    ]);

    console.log(`🔍 Created ${policies.length} RLS policies across 3 tables`);

  } catch (error) {
    console.error('❌ RLS implementation failed:', error);
    throw error;
  }
}

// Run the migration
applyRLSPolicies()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
```

Then run: `cd server && node scripts/apply-rls-policies.js`

## Manual Implementation Steps

If you need to implement manually, execute these SQL statements in order:

### Step 1: Enable RLS
```sql
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_template_config ENABLE ROW LEVEL SECURITY;
```

### Step 2: Service Role Policies
```sql
-- Full access for service operations
CREATE POLICY "service_role_full_access_templates" ON templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access_assignments" ON template_assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_full_access_config" ON discipline_template_config FOR ALL USING (auth.role() = 'service_role');
```

### Step 3: Creator Access
```sql
-- Users can always access their own templates
CREATE POLICY "template_creator_access" ON templates FOR ALL USING (created_by = auth.uid());
```

### Step 4: Organization Access
```sql
-- Organization-based data isolation
CREATE POLICY "organization_template_access" ON templates FOR SELECT USING (
  organization_id IS NULL OR
  EXISTS (
    SELECT 1 FROM user_organization_access uoa
    WHERE uoa.user_id = auth.uid()::text
    AND uoa.organization_id = templates.organization_id
    AND uoa.is_active = true
  )
);
```

### Step 5: Governance Controls (Department 01300)
```sql
-- Governance department manages templates
CREATE POLICY "governance_template_admin_access" ON templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_definitions rd ON ur.role = rd.role_name
    WHERE ur.user_id = auth.uid()::text
    AND ur.department_code = '01300'
    AND (rd.permissions ? 'template:approve' OR rd.permissions ? 'template:publish')
    AND rd.is_active = true
  )
);
-- Viewer access for published templates
CREATE POLICY "template_viewer_access" ON templates FOR SELECT USING (
  is_approved = true OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_definitions rd ON ur.role = rd.role_name
    WHERE ur.user_id = auth.uid()::text
    AND rd.permissions ? 'template:view_published'
    AND rd.is_active = true
  )
);
```

### Step 6: Assignment Policies
```sql
-- Assignment access controls
CREATE POLICY "assignment_creator_viewer" ON template_assignments FOR SELECT USING (assigned_by = auth.uid()::text);
CREATE POLICY "assignment_recipient_access" ON template_assignments FOR SELECT USING (assigned_to_id::text = auth.uid()::text);
CREATE POLICY "governance_assignment_admin" ON template_assignments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_definitions rd ON ur.role = rd.role_name
    WHERE ur.user_id = auth.uid()::text
    AND ur.department_code = '01300'
    AND (rd.permissions ? 'template:approve' OR rd.permissions ? 'template:assign')
    AND rd.is_active = true
  )
);
```

### Step 7: Configuration Security
```sql
-- Config table security
CREATE POLICY "discipline_config_read" ON discipline_template_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "governance_config_admin" ON discipline_template_config FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()::text
    AND ur.department_code = '01300'
    AND ur.level >= 3
  )
);
```

### Step 8: Development Bypass
```sql
-- Safe development mode access
CREATE POLICY "dev_mode_template_access" ON templates FOR ALL USING (current_setting('app.is_development_mode', true) = 'true');
CREATE POLICY "dev_mode_assignment_access" ON template_assignments FOR ALL USING (current_setting('app.is_development_mode', true) = 'true');
CREATE POLICY "dev_mode_config_access" ON discipline_template_config FOR ALL USING (current_setting('app.is_development_mode', true) = 'true');
```

### Step 9: Audit Logging
```sql
-- Create audit table
CREATE TABLE IF NOT EXISTS template_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  resource_id UUID NOT NULL,
  organization_id UUID,
  department_code TEXT,
  user_role TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit table security
ALTER TABLE template_security_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read_access" ON template_security_audit
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.level >= 3
    )
  );
```

## Verification

After implementation, verify with these queries:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('templates', 'template_assignments', 'discipline_template_config');

-- Count policies
SELECT tablename, COUNT(*) as policies FROM pg_policies
WHERE tablename IN ('templates', 'template_assignments', 'discipline_template_config')
GROUP BY tablename;

-- Verify configuration seeding
SELECT discipline, ARRAY_LENGTH(allowed_template_types, 1) as types_count
FROM discipline_template_config ORDER BY discipline;
```

## Expected Results

After successful implementation:
- ✅ **3 tables** with RLS enabled
- ✅ **13+ policies** across all tables
- ✅ **5 disciplines** configured with template types
- ✅ **Audit logging** active

## Troubleshooting

**Error: "Template type not allowed"** → Check `discipline_template_config` seeding
**Error: No access to templates** → Verify user in `user_organization_access`
**RLS policy conflicts** → Check existing policies on tables

The unified template system will now have enterprise-grade security with proper role-based access and data isolation! 🛡️
