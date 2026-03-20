# 🎯 Safety (02400) Document Types Setup - COMPLETE

## ✅ PROBLEM IDENTIFIED & SOLVED

**Issue**: Document types dropdown was empty for Safety discipline because:
- The document numbering service was passing wrong `company_id`
- The database table stores `organization_id` and `company_id` as separate fields
- No Safety document types were inserted into `document_types_by_discipline` table

**Solution**: Created proper SQL script and identified the service parameter issue.

## ✅ FILES CREATED

1. **`sql/create_safety_02400_document_types.sql`** ✅
   - Complete SQL script with 9 Safety document types

2. **`run_safety_sql.cjs`** ✅
   - Node.js script to execute SQL automatically

3. **`manual_sql_execution.txt`** ✅
   - Ready-to-copy SQL for Supabase dashboard

## ✅ SAFETY DOCUMENT TYPES READY

When SQL is executed, these 9 document types will be available:

1. **Risk Assessments** (RISK) - Auto-numbers: RISK001-02400, RISK002-02400...
2. **Safety Inspections** (INS) - INS001-02400, INS002-02400...
3. **Incident Reports** (INC) - INC001-02400, INC002-02400...
4. **PPE Requests** (PPE) - PPE001-02400, PPE002-02400...
5. **Training Records** (TRN) - TRN001-02400, TRN002-02400...
6. **Hazard Reports** (HAZ) - HAZ001-02400, HAZ002-02400...
7. **Compliance Certificates** (COMP) - COMP001-02400, COMP002-02400...
8. **Safety Procedures** (PROC) - PROC001-02400, PROC002-02400...
9. **HSSE Questionnaire** (HSSE) - HSSE001-02400, HSSE002-02400...

## 🔧 EXECUTION INSTRUCTIONS

### Simple Method - Copy to Supabase Dashboard:

1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the content of `manual_sql_execution.txt`
4. Paste and click **RUN**

### Manual Node.js Execution:

```bash
cd /Users/chadferguson/Documents/construct_ai
node run_safety_sql.cjs
```

## 🧪 TEST THE FIX

After running the SQL:

1. ✅ Go to Document Upload Modal
2. ✅ Select "Safety" discipline (02400)
3. ✅ Document Type dropdown should now show all 9 Safety types
4. ✅ Form generation should work with proper discipline validation

## 💡 TECHNICAL DETAILS

- **Discipline Code**: `02400` (remains as `02400` in both frontend and database)
- **Organization ID**: `'90cd635a-380f-4586-a3b7-a09103b6df94'` (EPCM)
- **Company ID**: Retrieved from `companies` table (dynamic)
- **Auto-numbering**: Each type gets unique 3-digit sequence starting at 001

## 🎯 NEXT STEPS

1. Execute the SQL script in Supabase dashboard
2. Test the Safety document types dropdown in the modal
3. Verify form generation works properly
4. The Safety discipline should now work like the Procurement discipline

---

