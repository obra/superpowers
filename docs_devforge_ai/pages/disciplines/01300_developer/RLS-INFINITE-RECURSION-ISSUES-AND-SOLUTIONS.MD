# 0030 RLS Infinite Recursion Issues and Solutions

## 🚨 Critical RLS Policy Circular Dependency Resolution

**Comprehensive Documentation of Infinite Recursion Issues and Resolution Strategies**

This document tracks all instances of infinite recursion errors in Row Level Security (RLS) policy implementations, their root causes, and the solutions applied to resolve them. This serves as a reference guide for preventing and fixing similar issues in future RLS implementations.

---

## 📋 **CURRENT CRITICAL ISSUE - October 11, 2025**

### **Error Details**
```
[ISCIPLINE_RLS] Disciplines query failed: Object
fetchDisciplinesWithRetry @ main.cb02179b8c9c98554833.mhtdx3tr.js:83717
main.cb02179b8c9c98554833.mhtdx3tr.js:83718 [DISCIPLINE_RLS] Error code: 42P17
fetchDisciplinesWithRetry @ main.cb02179b8c9c98554833.mhtdx3tr.js:83718
main.cb02179b8c9c98554833.mhtdx3tr.js:83719 [DISCIPLINE_RLS] Error message: infinite recursion detected in policy for relation "user_role_assignments"
fetchDisciplinesWithRetry @ main.cb02179b8c9c98554833.mhtdx3tr.js:83719
main.cb02179b8c9c98554833.mhtdx3tr.js:83720 [DISCIPLINE_RLS] Error hint: null
fetchDisciplinesWithRetry @ main.cb02179b8c9c98554833.mhtdx3tr.js:83720

[DEBUG FETCH] Could not query available tables: Object
(anonymous) @ main.cb02179b8c9c98554833.mhtdx3tr.js:83955
[DEBUG FETCH] === FETCH_FORMS FAILED ===
(anonymous) @ main.cb02179b8c9c98554833.mhtdx3tr.js:84100
[DEBUG FETCH] Error details: {
  "message": "infinite recursion detected in policy for relation \"user_organization_access\" (form_templates table not accessible)",
  "code": "UNKNOWN",
  "details": null,
  "hint": null,
  "type": "Error",
  "location": "fetchForms catch block"
}
```

### **Root Cause Analysis**

**Primary Issue**: Circular dependencies in RLS policies between core authentication tables.

**Problem Chain**:
1. `user_role_assignments` table has RLS policies that reference `user_organization_access`
2. `user_organization_access` table has RLS policies that reference `user_role_assignments`
3. When policies execute, they create infinite recursion loops

**Affected Tables**:
- `user_role_assignments` (Pattern C: User-Owned)
- `user_organization_access` (Pattern B: Organization-Scoped)
- All tables with policies referencing these core tables

**Impact**: Complete system breakdown - no data access possible due to policy recursion.

---

## 🔍 **TECHNICAL ANALYSIS OF CIRCULAR DEPENDENCIES**

### **Policy Reference Chain**

```
user_role_assignments (Pattern C)
    ↓ References in policies:
    → user_organization_access (for organization context)
    → user_role_assignments (self-reference for role validation)

user_organization_access (Pattern B)
    ↓ References in policies:
    → user_organization_access (self-reference for organization validation)
    → user_role_assignments (for admin role checks)
```

### **Infinite Recursion Trigger**

When a query executes on any table with RLS policies:

1. **Query starts** on `disciplines` table
2. **Policy executes** referencing `user_organization_access`
3. **Policy on user_organization_access executes** referencing `user_role_assignments`
4. **Policy on user_role_assignments executes** referencing `user_organization_access`
5. **Infinite loop** created between steps 2-4

### **Database Engine Behavior**

PostgreSQL detects the circular reference and throws:
```
ERROR: 42P17: infinite recursion detected in policy for relation "user_role_assignments"
```

---

## 🛠️ **RESOLUTION STRATEGIES**

### **Strategy 1: Break Circular Dependencies**

**Approach**: Restructure policies to avoid cross-table references in security checks.

#### **Option A: Self-Contained Policies**
Remove references to other authentication tables within policies.

```sql
-- ❌ PROBLEMATIC: Cross-table reference causing recursion
CREATE POLICY "admin_access" ON target_table FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_role_assignments ura
        WHERE ura.user_id = auth.uid()
        AND ura.role_name IN ('admin', 'information_technology_manager')
        AND ura.is_active = true
    )
);

-- ✅ SOLUTION: Self-contained policy logic
CREATE POLICY "admin_access" ON target_table FOR ALL USING (
    -- Direct role check without referencing other tables
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'user_metadata' ->> 'is_admin' = 'true'
);
```

#### **Option B: Hierarchical Policy Structure**
Implement policies in dependency order to avoid circular references.

```sql
-- Step 1: Base tables with minimal policies
-- user_role_assignments: Only self-contained policies
-- user_organization_access: Only self-contained policies

-- Step 2: Dependent tables reference base tables
-- Other tables can safely reference user_role_assignments and user_organization_access
```

### **Strategy 2: Policy Simplification**

**Approach**: Simplify policies to reduce complexity and potential recursion points.

#### **Option A: Role-Based Authentication**
Use JWT claims instead of database table lookups for role checks.

```sql
-- ✅ JWT-BASED: No database table references
CREATE POLICY "admin_access" ON target_table FOR ALL USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' IN ('admin', 'it_manager')
);
```

#### **Option B: Direct User ID Checks**
For user-owned data, use direct auth.uid() comparisons only.

```sql
-- ✅ DIRECT CHECK: No table references
CREATE POLICY "owner_access" ON user_emails FOR ALL USING (
    user_id = auth.uid()  -- Direct comparison, no other table references
);
```

### **Strategy 3: Policy Execution Order Control**

**Approach**: Control policy evaluation order to prevent circular dependencies.

#### **Option A: Explicit Policy Ordering**
Use PostgreSQL's policy ordering features.

```sql
-- Create policies with explicit evaluation order
CREATE POLICY "base_access" ON target_table FOR SELECT
    WITH (priority = 1)  -- Evaluate first
    USING (auth.role() = 'authenticated');

CREATE POLICY "role_based_access" ON target_table FOR SELECT
    WITH (priority = 2)  -- Evaluate after base access
    USING (...);  -- Complex logic here
```

#### **Option B: Conditional Policy Execution**
Use conditional logic to prevent circular references.

```sql
-- Conditional execution to break recursion
CREATE POLICY "safe_access" ON target_table FOR SELECT USING (
    CASE
        WHEN auth.uid() IS NOT NULL THEN
            -- Safe logic that doesn't cause recursion
            EXISTS (SELECT 1 FROM safe_reference_table WHERE ...)
        ELSE false
    END
);
```

---

## 🔧 **IMPLEMENTATION PLAN**

### **Phase 1: Emergency Fix (Immediate)**

#### **Step 1: Identify Problematic Policies**
```sql
-- Find all policies that reference problematic tables
SELECT
    schemaname,
    tablename,
    policyname,
    qual as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        qual LIKE '%user_role_assignments%'
        OR qual LIKE '%user_organization_access%'
    );
```

#### **Step 2: Temporarily Disable Recursive Policies**
```sql
-- Temporarily disable RLS on problematic tables
ALTER TABLE user_role_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organization_access DISABLE ROW LEVEL SECURITY;

-- Allow emergency access while fixing policies
```

#### **Step 3: Implement Production-Safe Policies**
```sql
-- Re-enable with production-safe policies
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organization_access ENABLE ROW LEVEL SECURITY;

-- Create policies that work in both dev and production
CREATE POLICY "dev_mode_full_access" ON user_role_assignments
FOR ALL USING (is_dev_mode());

CREATE POLICY "service_role_full_access" ON user_role_assignments
FOR ALL USING (auth.role() = 'service_role'::text);

CREATE POLICY "user_owns_record" ON user_role_assignments
FOR ALL USING (user_id = auth.uid());

-- Same for user_organization_access
```

### **Phase 2: Permanent Solution**

#### **Step 1: Redesign Core Authentication Policies**
Implement self-contained policies for core tables.

#### **Step 2: Update Dependent Policies**
Modify policies on other tables to work with new core policies.

#### **Step 3: Comprehensive Testing**
Test all access patterns to ensure security is maintained.

### **Phase 3: Prevention Measures**

#### **Step 1: Policy Dependency Analysis**
Implement automated checks for circular dependencies.

#### **Step 2: Policy Templates**
Create templates that prevent circular references.

#### **Step 3: Documentation Updates**
Update all guides with circular dependency prevention.

---

## 📊 **MONITORING AND PREVENTION**

### **Automated Circular Dependency Detection**

```sql
-- Query to detect potential circular dependencies
WITH policy_dependencies AS (
    SELECT
        p.schemaname,
        p.tablename,
        p.policyname,
        -- Extract referenced tables from policy conditions
        regexp_matches(p.qual, 'FROM\s+(\w+)', 'g') as referenced_tables
    FROM pg_policies p
    WHERE p.schemaname = 'public'
),
circular_refs AS (
    SELECT
        pd.tablename as source_table,
        unnest(pd.referenced_tables) as referenced_table,
        pd.policyname
    FROM policy_dependencies pd
    WHERE unnest(pd.referenced_tables) IN (
        SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
    )
)
SELECT
    cr.source_table,
    cr.referenced_table,
    cr.policyname,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM circular_refs cr2
            WHERE cr2.source_table = cr.referenced_table
            AND cr2.referenced_table = cr.source_table
        ) THEN '🚨 CIRCULAR DEPENDENCY DETECTED'
        ELSE '✅ Safe Reference'
    END as status
FROM circular_refs cr
ORDER BY
    CASE WHEN status LIKE '%CIRCULAR%' THEN 1 ELSE 2 END,
    source_table,
    referenced_table;
```

### **Policy Complexity Metrics**

```sql
-- Monitor policy complexity to prevent recursion
SELECT
    schemaname,
    tablename,
    policyname,
    -- Count table references in policy conditions
    (length(qual) - length(replace(qual, 'FROM ', ''))) / length('FROM ') as table_reference_count,
    CASE
        WHEN qual LIKE '%user_role_assignments%' AND qual LIKE '%user_organization_access%' THEN '🚨 HIGH RISK'
        WHEN qual LIKE '%user_role_assignments%' OR qual LIKE '%user_organization_access%' THEN '⚠️ MEDIUM RISK'
        ELSE '✅ LOW RISK'
    END as recursion_risk
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY table_reference_count DESC;
```

---

## 📚 **HISTORICAL INCIDENTS**

### **Incident 1: October 11, 2025 - Initial Detection**
- **Date**: October 11, 2025
- **Error**: `infinite recursion detected in policy for relation "user_role_assignments"`
- **Affected Tables**: `user_role_assignments`, `user_organization_access`, all dependent tables
- **Impact**: Complete system inaccessibility
- **Root Cause**: Circular policy dependencies between core authentication tables
- **Resolution**: Emergency policy simplification (in progress)
- **Prevention**: Implement dependency analysis in policy creation workflow

### **Incident 2: October 11, 2025 - Form Templates Access Failure**
- **Date**: October 11, 2025
- **Error**: `infinite recursion detected in policy for relation "user_organization_access"`
- **Affected Tables**: `form_templates`, `user_organization_access`
- **Impact**: Form functionality completely broken
- **Root Cause**: Policy on `form_templates` triggered circular dependency
- **Resolution**: Part of comprehensive fix
- **Prevention**: Test all table access patterns after policy changes

---

## 🛡️ **BEST PRACTICES FOR PREVENTION**

### **Policy Design Principles**

1. **Minimize Table References**: Keep policy conditions simple and self-contained
2. **Avoid Cross-Table Dependencies**: Don't reference other secured tables in policies
3. **Use JWT Claims**: Prefer JWT-based role checks over database lookups
4. **Test Recursion**: Always test policies for circular dependencies before deployment
5. **Monitor Complexity**: Track policy complexity metrics over time

### **Implementation Checklist**

#### **Pre-Implementation**
- [ ] **Dependency Analysis**: Check for circular references before creating policies
- [ ] **Table Reference Audit**: Count and evaluate table references in policy conditions
- [ ] **Recursion Testing**: Test policies with various user contexts
- [ ] **Performance Impact**: Assess query performance implications

#### **During Implementation**
- [ ] **Incremental Deployment**: Deploy policies in dependency order
- [ ] **Safe Fallbacks**: Have rollback procedures ready
- [ ] **Monitoring Active**: Watch for recursion errors during deployment
- [ ] **User Impact Assessment**: Evaluate impact on existing functionality

#### **Post-Implementation**
- [ ] **Comprehensive Testing**: Test all access patterns and user roles
- [ ] **Performance Monitoring**: Monitor query performance and optimization
- [ ] **Documentation Update**: Record lessons learned and prevention measures
- [ ] **Alert System**: Set up monitoring for future recursion issues

### **Automated Prevention Tools**

#### **Policy Creation Template**
```sql
-- SAFE POLICY TEMPLATE - Prevents circular dependencies
CREATE POLICY "{policy_name}" ON {table_name} FOR {operation}
USING (
    -- Primary check: Direct authentication
    auth.role() = 'authenticated'
    AND (
        -- Secondary check: Safe, self-contained logic
        {owner_column} = auth.uid()
        OR {organization_column} = {safe_organization_reference}
        OR {simple_role_check}
    )
);
```

#### **Dependency Validator**
```sql
-- Function to validate policy dependencies
CREATE OR REPLACE FUNCTION validate_policy_dependencies(
    p_table_name TEXT,
    p_policy_condition TEXT
) RETURNS TABLE (
    issue_type TEXT,
    severity TEXT,
    recommendation TEXT
) AS $$
-- Implementation: Check for circular references and complexity issues
```

---

## 📈 **SUCCESS METRICS AND MONITORING**

### **Key Performance Indicators**

- **Recursion Incidents**: Target 0 incidents per month
- **Policy Complexity**: Average table references per policy < 2
- **Deployment Success Rate**: 100% successful policy deployments
- **Query Performance**: <5% degradation from RLS policies

### **Monitoring Queries**

```sql
-- Daily recursion monitoring
SELECT
    date_trunc('day', backend_start) as day,
    count(*) as recursion_errors,
    string_agg(error_message, '; ') as error_details
FROM system_logs
WHERE error_message LIKE '%infinite recursion%'
    AND backend_start >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date_trunc('day', backend_start)
ORDER BY day DESC;

-- Policy health dashboard
SELECT
    'Policy Health Overview' as metric,
    count(*) as total_policies,
    count(CASE WHEN qual LIKE '%user_role_assignments%' OR qual LIKE '%user_organization_access%' THEN 1 END) as risky_policies,
    round(
        count(CASE WHEN qual LIKE '%user_role_assignments%' OR qual LIKE '%user_organization_access%' THEN 1 END)::numeric
        / count(*)::numeric * 100, 1
    ) as risk_percentage
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🎯 **ACTION ITEMS**

### **Immediate Actions (Next 24 hours)**
- [ ] **Emergency Fix**: Implement simplified policies on core authentication tables
- [ ] **System Recovery**: Restore basic data access functionality
- [ ] **Impact Assessment**: Document all affected functionality
- [ ] **Communication**: Notify stakeholders of temporary access limitations

### **Short-term Actions (Next Week)**
- [ ] **Root Cause Analysis**: Complete technical analysis of circular dependencies
- [ ] **Policy Redesign**: Implement permanent solution with proper architecture
- [ ] **Testing Framework**: Create comprehensive testing for recursion prevention
- [ ] **Documentation**: Update all guides with prevention measures

### **Long-term Actions (Next Month)**
- [ ] **Automation Tools**: Implement automated dependency checking
- [ ] **Policy Templates**: Create safe policy templates for all patterns
- [ ] **Training**: Educate development team on recursion prevention
- [ ] **Monitoring System**: Set up continuous monitoring for policy health

---

## 📚 **REFERENCES AND RESOURCES**

### **Related Documentation**
- **[0021_RLS_IMPLEMENTATION_GUIDE.md](0021_RLS_IMPLEMENTATION_GUIDE.md)** - Technical implementation procedures
- **[0024_SECURITY_PATTERNS_REFERENCE.md](0024_SECURITY_PATTERNS_REFERENCE.md)** - Policy templates and examples
- **[0025_TROUBLESHOOTING_GUIDE.md](0025_TROUBLESHOOTING_GUIDE.md)** - Error resolution and debugging

### **PostgreSQL Documentation**
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Policy Evaluation](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Common Table Expressions](https://www.postgresql.org/docs/current/queries-with.html)

### **External Resources**
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Security Guide](https://www.postgresql.org/docs/current/security.html)

---

*This document serves as the comprehensive reference for RLS infinite recursion issues and their resolution. Regular updates will be made as new incidents occur and solutions are implemented.*
