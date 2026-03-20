# UUID/Text Comparison Error Fix - Execution Sequence

## 🎯 **IMMEDIATE FIX (Recommended)**

Run these files in this exact order:

### 1. **Primary Fix** 
```bash
# This fixes the immediate issue in discipline_document_sections_schema.sql
psql -d your_database -f server/sql/discipline_document_sections_schema.sql
```

### 2. **Comprehensive Analysis & Fix** (Optional but Recommended)
```bash
# This analyzes your entire database for UUID/text issues and fixes them automatically
psql -d your_database -f enhanced_uuid_analysis_and_fix.sql
```

## 🔄 **Alternative: Quick Fix Only**

If you just want to fix the immediate error without the comprehensive analysis:

### 1. **Basic Fix**
```bash
# This applies a basic fix across multiple policies
psql -d your_database -f fix_uuid_text_comparison.sql
```

## 📋 **What Each File Does**

| File | Purpose | When to Use |
|------|---------|-------------|
| `server/sql/discipline_document_sections_schema.sql` | **Fixes the original error** - Removes UUID/text casting from RLS policies | **ALWAYS RUN FIRST** - This is the core fix |
| `enhanced_uuid_analysis_and_fix.sql` | **Comprehensive analysis** - Scans entire database for similar issues and fixes them | **RUN SECOND** - For complete solution |
| `fix_uuid_text_comparison.sql` | **Basic multi-policy fix** - Quick fix for common UUID/text issues | **Alternative to comprehensive analysis** |

## 🚨 **IMPORTANT: Pre-Execution Checklist**

Before running any of these files:

### 1. **Backup Your Database**
```bash
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **Test Connection**
```bash
psql -d your_database -c "SELECT version();"
```

### 3. **Verify File Exists**
```bash
ls -la server/sql/discipline_document_sections_schema.sql
ls -la enhanced_uuid_analysis_and_fix.sql
```

## ✅ **Verification After Running**

### Test the Fix
```sql
-- Run this in your database to verify the fix works:
SELECT 
  'UUID comparison fix verification' as test,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ auth.uid() working'
    ELSE '⚠️ auth.uid() is NULL (may need authentication)'
  END as auth_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_organization_access WHERE user_id = auth.uid() LIMIT 1) 
    THEN '✅ UUID comparison successful'
    ELSE 'ℹ️ UUID comparison working (no matching records)'
  END as comparison_status;
```

### Check Policy Status
```sql
-- Verify the policies were created correctly:
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'discipline_document_sections'
ORDER BY policyname;
```

## 🎯 **Recommended Execution Sequence**

**For Complete Fix:**
1. ✅ Backup database
2. ✅ Test connection  
3. Run `server/sql/discipline_document_sections_schema.sql`
4. Run `enhanced_uuid_analysis_and_fix.sql`
5. ✅ Verify with test queries

**For Quick Fix:**
1. ✅ Backup database
2. ✅ Test connection
3. Run `server/sql/discipline_document_sections_schema.sql`
4. Run `fix_uuid_text_comparison.sql`
5. ✅ Verify with test queries

## 🔧 **If You Encounter Issues**

### Check Error Logs
```bash
# PostgreSQL logs (varies by setup)
tail -f /var/log/postgresql/postgresql.log
# OR
tail -f ~/.supabase/logs/postgresql.log
```

### Rollback if Needed
```bash
# Restore from backup
psql your_database < backup_YYYYMMDD_HHMMSS.sql
```

## 📞 **Support**

If you encounter any issues:
1. Check the error logs
2. Verify your database connection
3. Ensure you have proper permissions
4. Review the updated documentation in `docs/procedures/0000_SQL_EXECUTION_PROCEDURE.md`

---

**🎉 After running these files, your UUID/text comparison error should be completely resolved!**
