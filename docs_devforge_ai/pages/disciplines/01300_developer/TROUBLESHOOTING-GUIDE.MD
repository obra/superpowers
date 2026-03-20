# 0025 Troubleshooting Guide

## 🚨 RLS Implementation Error Resolution and Debugging

**Comprehensive Guide for Resolving Row Level Security Implementation Issues**

This document provides detailed troubleshooting procedures for common RLS implementation errors, debugging techniques, and resolution strategies learned from implementing security across 300+ database tables.

---

## 🚨 **CRITICAL IMPLEMENTATION LESSONS**

### **1. Schema Assumption Fatalities**
**Problem**: Implementation scripts assumed table existence and column structures without verification.
```sql
-- ❌ DANGEROUS: Assumes tables exist
ALTER TABLE procurement_order_items ENABLE ROW LEVEL SECURITY;
-- Result: "relation 'procurement_order_items' does not exist" ERROR
```

**Root Cause**: Development focused on "what should exist" rather than "what actually exists" in the database.

**Impact**: Multiple failed deployments, wasted development time, and inconsistent security implementation.

**Solution**: Mandatory schema-first development with real-time verification.
```sql
-- ✅ SAFE: Verify before acting
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'target_table') THEN
    -- Implement policies
END IF;
```

### **2. PL/pgSQL Variable Conflicts**
**Problem**: PL/pgSQL variable names conflicted with database column names.
```sql
-- ❌ BROKEN: Ambiguous reference
SELECT * FROM information_schema.tables WHERE table_name = table_name;
-- ERROR: column reference "table_name" is ambiguous
```

**Root Cause**: Using generic variable names that match common column names.

**Impact**: Syntax errors that prevented script execution, requiring multiple debugging cycles.

**Solution**: Use descriptive, unique variable names that cannot conflict.
```sql
-- ✅ SAFE: Unique variable names
DECLARE
    current_table_name TEXT;
BEGIN
    SELECT * FROM information_schema.tables
    WHERE table_name = current_table_name;
END;
```

### **3. Batch Size Limitations**
**Problem**: Large SQL files (17+ tables) caused timeout errors in Supabase dashboard.
```sql
-- ❌ PROBLEMATIC: Too many operations in one transaction
-- 100+ policy creations + index additions = TIMEOUT
```

**Root Cause**: Supabase execution limits and network timeouts for large transactions.

**Impact**: Failed deployments requiring manual batch splitting and re-execution.

**Solution**: Intelligent batching with existence checking.
```sql
-- ✅ SMART: Process only existing tables
-- Dynamic table discovery + conditional processing
-- Smaller, focused batches per execution
```

---

## 🔍 **ERROR RESOLUTION MATRIX**

### **Error Type: Type Casting Issues**

| **Error Message** | **Symptoms** | **Root Cause** | **Solution** |
|------------------|-------------|---------------|-------------|
| `operator does not exist: text = uuid` | Policy creation fails | Mixed TEXT/UUID comparisons | Cast both sides to TEXT |
| `operator does not exist: uuid = text` | Authentication comparisons fail | Inconsistent type handling | Use universal TEXT casting |

**Resolution:**
```sql
-- ❌ PROBLEMATIC CODE:
CREATE POLICY "org_access" ON table_name
FOR SELECT USING (
    uoa.user_id = auth.uid()  -- TEXT = UUID → ERROR
);

-- ✅ FIXED CODE:
CREATE POLICY "org_access" ON table_name
FOR SELECT USING (
    uoa.user_id::text = auth.uid()::text  -- TEXT = TEXT → SUCCESS
);
```

**Universal Rule:** Always cast both sides of comparisons to TEXT to prevent type mismatches.

### **Error Type: Missing Column References**

| **Error Message** | **Symptoms** | **Root Cause** | **Solution** |
|------------------|-------------|---------------|-------------|
| `column "created_at" does not exist` | Index creation fails | Assumed column existence | Verify schema first |
| `column "user_id" does not exist` | Policy creation fails | Missing required columns | Add columns or use existing ones |

**Resolution:**
```sql
-- ✅ VERIFICATION: Check what actually exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;

-- Only reference columns that exist in the actual schema
```

**Critical Rule:** Never reference columns that don't exist in the actual database schema.

### **Error Type: Policy Conflicts**

| **Error Message** | **Symptoms** | **Root Cause** | **Solution** |
|------------------|-------------|---------------|-------------|
| `policy already exists` | Batch execution fails | Duplicate policy names | Use conditional execution |
| `policy does not exist` | Drop statement fails | Policy was never created | Use IF EXISTS syntax |

**Resolution:**
```sql
-- ✅ CONDITIONAL EXECUTION PATTERN
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                   AND tablename = 'companies' AND policyname = 'dev_mode_full_access') THEN
        CREATE POLICY "dev_mode_full_access" ON companies FOR ALL USING (is_dev_mode());
        RAISE NOTICE '✅ Created policy: dev_mode_full_access on table companies';
    ELSE
        RAISE NOTICE '⚠️  Policy already exists: dev_mode_full_access on table companies';
    END IF;
END $$;
```

### **Error Type: RLS Not Enabled**

| **Error Message** | **Symptoms** | **Root Cause** | **Solution** |
|------------------|-------------|---------------|-------------|
| Policies ignored, all data accessible | Security not working | `ALTER TABLE ENABLE ROW LEVEL SECURITY` missing | Always enable RLS after creating policies |

**Resolution:**
```sql
-- ✅ ALWAYS ENABLE RLS
CREATE POLICY "access_policy" ON table_name FOR SELECT USING (...);
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;  -- REQUIRED!
```

### **Error Type: Index Creation Failures**

| **Error Message** | **Symptoms** | **Root Cause** | **Solution** |
|------------------|-------------|---------------|-------------|
| `CREATE INDEX` fails on non-existent column | Index creation errors | Column doesn't exist | Only create indexes for verified existing columns |

**Resolution:**
```sql
-- ✅ CONDITIONAL INDEX CREATION
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'table_name' AND column_name = 'created_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_table_created_at ON table(table_name);
    END IF;
END $$;
```

---

## 🧪 **DEBUGGING PROCEDURES**

### **Step-by-Step Debugging Process**

#### **1. Verify Table Existence**
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'your_table_name'
);
```

#### **2. Analyze Table Schema**
```sql
-- Get complete column information
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'your_table_name'
AND table_schema = 'public'
ORDER BY ordinal_position;
```

#### **3. Check Existing Policies**
```sql
-- View all policies on a table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'your_table_name'
ORDER BY policyname;
```

#### **4. Verify RLS Status**
```sql
-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'your_table_name';
```

#### **5. Test Policy Logic**
```sql
-- Test organization access (replace with actual values)
SELECT
    uoa.user_id,
    uoa.organization_id,
    'test_user_id'::text as test_user,
    'test_org_id'::text as test_org
FROM user_organization_access uoa
WHERE uoa.user_id::text = 'test_user_id'::text
  AND uoa.organization_id::text = 'test_org_id'::text;
```

### **Performance Debugging**

#### **Identify Slow Queries**
```sql
-- Check for queries using policies
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%your_table_name%'
ORDER BY total_time DESC
LIMIT 10;
```

#### **Verify Index Usage**
```sql
-- Check if indexes are being used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'your_table_name'
ORDER BY idx_scan DESC;
```

#### **Policy Performance Analysis**
```sql
-- Analyze policy execution
EXPLAIN ANALYZE
SELECT * FROM your_table_name
WHERE organization_id = 'test_org_id';
```

---

## 🚨 **EMERGENCY RECOVERY PROCEDURES**

### **Remove All Policies from a Table**
```sql
-- Drop all policies on a table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname FROM pg_policies
        WHERE tablename = 'problematic_table'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I',
                      policy_record.policyname, 'problematic_table');
    END LOOP;
END $$;
```

### **Temporarily Disable RLS**
```sql
-- Temporarily disable RLS for emergency access
ALTER TABLE problematic_table DISABLE ROW LEVEL SECURITY;
-- WARNING: This makes table accessible to all users!
```

### **Re-enable RLS Safely**
```sql
-- Re-enable RLS after fixing policies
ALTER TABLE problematic_table ENABLE ROW LEVEL SECURITY;
```

---

## 📋 **PREVENTION BEST PRACTICES**

### **Pre-Implementation Checklist**
- [ ] **Schema Verified**: Run bulk schema extraction query
- [ ] **Columns Confirmed**: All referenced columns exist in target tables
- [ ] **Types Checked**: Data types match expected patterns
- [ ] **Dependencies Valid**: Referenced tables exist and are accessible
- [ ] **Test Environment**: Test on development first

### **Implementation Checklist**
- [ ] **TEXT Casting**: All comparisons use `::text`
- [ ] **Conditional Indexes**: Only create indexes for existing columns
- [ ] **Policy Separation**: Separate policies for INSERT/UPDATE/DELETE
- [ ] **RLS Enabled**: `ALTER TABLE ENABLE ROW LEVEL SECURITY` executed
- [ ] **Verification Run**: All verification queries pass

### **Post-Implementation Checklist**
- [ ] **Dashboard Updated**: Security dashboard shows "FULLY SECURE"
- [ ] **Performance Tested**: Query performance acceptable
- [ ] **Access Verified**: Different user roles work correctly
- [ ] **Documentation Updated**: Implementation recorded

---

## 🛠️ **ADVANCED TROUBLESHOOTING TOOLS**

### **Bulk Schema Analysis Query**
```sql
-- ============================================================================
-- BULK SCHEMA EXTRACTION FOR RLS IMPLEMENTATION
-- Run this BEFORE generating RLS policies to prevent type casting errors
-- Automatically includes referenced tables for complete relationship analysis
-- ============================================================================

-- Replace with your target table names
WITH target_tables AS (
  SELECT unnest(ARRAY[
    'a_00900_user_langchain_settings',
    'user_organization_access',
    'user_department_access'
    -- Add your table names here
  ]) as table_name
),

-- Automatically identify all referenced tables (foreign key targets)
referenced_tables AS (
  SELECT DISTINCT
    ccu.table_name as referenced_table_name
  FROM target_tables tt
  JOIN information_schema.table_constraints tc ON tc.table_name = tt.table_name
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = 'public'
  WHERE ccu.table_name NOT IN (SELECT table_name FROM target_tables)
),

-- Combine target tables with referenced tables
all_tables AS (
  SELECT table_name, 'TARGET' as table_type FROM target_tables
  UNION
  SELECT referenced_table_name as table_name, 'REFERENCED' as table_type FROM referenced_tables
),

-- Extract detailed column information for ALL tables (target + referenced)
table_columns AS (
  SELECT
    at.table_name,
    at.table_type,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE
      WHEN c.column_name LIKE '%user_id%' OR c.column_name LIKE '%created_by%' OR c.column_name LIKE '%owner_id%' THEN 'OWNER'
      WHEN c.column_name = 'organization_id' THEN 'ORG'
      ELSE 'OTHER'
    END as column_role,
    c.ordinal_position
  FROM all_tables at
  JOIN information_schema.columns c ON c.table_name = at.table_name
  WHERE c.table_schema = 'public'
  ORDER BY at.table_name, c.ordinal_position
),

-- Extract primary key information for ALL tables
table_keys AS (
  SELECT
    at.table_name,
    at.table_type,
    string_agg(kcu.column_name, ', ') as primary_keys
  FROM all_tables at
  JOIN information_schema.table_constraints tc ON tc.table_name = at.table_name
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
  JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = 'public'
  GROUP BY at.table_name, at.table_type
),

-- Extract foreign key relationships for ALL tables
table_fks AS (
  SELECT
    at.table_name,
    at.table_type,
    string_agg(
      kcu.column_name || ' → ' || ccu.table_name || '.' || ccu.column_name,
      '; '
    ) as foreign_keys
  FROM all_tables at
  LEFT JOIN information_schema.table_constraints tc ON tc.table_name = at.table_name
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  LEFT JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
    AND kcu.table_schema = 'public'
  LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = 'public'
  GROUP BY at.table_name, at.table_type
)

-- Final comprehensive schema report for ALL tables
SELECT
  CASE WHEN tc.table_type = 'REFERENCED' THEN tc.table_name || ' 🔗' ELSE tc.table_name END as table_name,
  '📋 COLUMNS:' as section,
  string_agg(
    tc.column_name || ' (' || tc.data_type ||
    CASE WHEN tc.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN tc.column_default IS NOT NULL THEN ' DEFAULT ' || tc.column_default ELSE '' END ||
    CASE WHEN tc.column_role = 'OWNER' THEN ' 👤 OWNER' WHEN tc.column_role = 'ORG' THEN ' 🏢 ORG' ELSE '' END ||
    ')',
    E'\n  • '
  ) as details
FROM table_columns tc
GROUP BY tc.table_name, tc.table_type

UNION ALL

SELECT
  CASE WHEN tk.table_type = 'REFERENCED' THEN tk.table_name || ' 🔗' ELSE tk.table_name END as table_name,
  '🔑 PRIMARY KEYS:' as section,
  COALESCE('  • ' || tk.primary_keys, '  • None') as details
FROM all_tables at
LEFT JOIN table_keys tk ON tk.table_name = at.table_name

UNION ALL

SELECT
  CASE WHEN tfk.table_type = 'REFERENCED' THEN tfk.table_name || ' 🔗' ELSE tfk.table_name END as table_name,
  '🔗 FOREIGN KEYS:' as section,
  COALESCE('  • ' || tfk.foreign_keys, '  • None') as details
FROM all_tables at
LEFT JOIN table_fks tfk ON tfk.table_name = at.table_name

UNION ALL

SELECT
  CASE WHEN at.table_type = 'REFERENCED' THEN at.table_name || ' 🔗' ELSE at.table_name END as table_name,
  '🎯 RLS PATTERN:' as section,
  CASE
    WHEN at.table_type = 'REFERENCED' THEN 'Referenced Table (Check Existing RLS) 🔗'
    WHEN EXISTS(SELECT 1 FROM table_columns tc WHERE tc.table_name = at.table_name AND tc.column_role = 'ORG') THEN
      'Pattern B: Organization-Scoped 🏢'
    WHEN EXISTS(SELECT 1 FROM table_columns tc WHERE tc.table_name = at.table_name AND tc.column_role = 'OWNER') THEN
      'Pattern C: User-Owned 👤'
    WHEN at.table_name LIKE '%user%' OR at.table_name LIKE '%system%' OR at.table_name LIKE '%admin%' THEN
      'Pattern A: System Administration ⚙️'
    ELSE
      'Pattern D: Reference/Shared 📚'
  END as details
FROM all_tables at

ORDER BY
  CASE WHEN table_name LIKE '% 🔗' THEN 1 ELSE 0 END,  -- Referenced tables first
  table_name,
  CASE
    WHEN section = '🎯 RLS PATTERN:' THEN 1
    WHEN section = '📋 COLUMNS:' THEN 2
    WHEN section = '🔑 PRIMARY KEYS:' THEN 3
    WHEN section = '🔗 FOREIGN KEYS:' THEN 4
    ELSE 5
  END;
```

### **Security Dashboard Verification**
```sql
-- Test security dashboard integration
SELECT * FROM generate_rls_policy_inventory()
WHERE tablename = 'your_table_name';
```

---

## 📊 **SUCCESS METRICS & VALIDATION**

### **Implementation Quality Metrics**
- **Test Coverage**: 32 comprehensive tests executed
- **Test Success Rate**: 100% (32/32 tests passed)
- **Policy Verification**: All policies properly configured and active
- **RLS Enablement**: All tables have RLS enabled
- **Performance Optimization**: 28 indexes added across 8 tables
- **Security Validation**: Zero security recommendations or warnings

### **Error Prevention Evolution**

| Implementation Phase | Error Rate | Prevention Strategy |
|---------------------|------------|-------------------|
| **Early Batches** | High (type casting, missing columns) | Manual verification |
| **Mid Batches** | Medium (foreign keys, permissions) | Checklist validation |
| **Recent Batches** | Zero (verified tables only) | Schema-first automation |
| **Current Standard** | 0% | Dynamic verification + TEXT casting |

---

## 📚 **RELATED DOCUMENTATION**

### **Implementation Guides**
- **[0020_AUTHENTICATION_OVERVIEW.md](0020_AUTHENTICATION_OVERVIEW.md)** - System overview and architecture
- **[0021_RLS_IMPLEMENTATION_GUIDE.md](0021_RLS_IMPLEMENTATION_GUIDE.md)** - Technical implementation procedures
- **[0022_SECURITY_DASHBOARDS.md](0022_SECURITY_DASHBOARDS.md)** - Dashboard access and monitoring
- **[0023_IMPLEMENTATION_PROGRESS.md](0023_IMPLEMENTATION_PROGRESS.md)** - Current status and progress tracking

### **Reference Materials**
- **[0024_SECURITY_PATTERNS_REFERENCE.md](0024_SECURITY_PATTERNS_REFERENCE.md)** - Policy templates and examples

---

*This troubleshooting guide provides comprehensive error resolution for RLS implementation issues. For implementation procedures, see [0021_RLS_IMPLEMENTATION_GUIDE.md](0021_RLS_IMPLEMENTATION_GUIDE.md).*
