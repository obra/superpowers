# RLS Policies Extraction Guide

This directory contains scripts to manually extract and document all Row Level Security (RLS) policies from your Supabase database.

## 📁 Files

- `extract_rls_policies.sql` - SQL script to run in Supabase
- `format_rls_policies.js` - Node.js script to format the output
- `index-policies.md` - Generated documentation (output)

## 🚀 Usage Instructions

### Step 1: Run SQL Extraction

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Extraction Script**
   - Copy the contents of `extract_rls_policies.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Copy the Results**
   - **Important**: Make sure you're in "Table" view (not JSON)
   - Select ALL the output text including headers like:
     ```
     schemaname | tablename | policyname | permissive | roles | cmd | qual | with_check
     ------------|-----------|------------|-----------|-------|-----|------|-----------
     ```
   - Copy it to your clipboard

### Step 2: Save SQL Output

1. **Create Output File**
   ```bash
   # In your project directory
   touch docs/schema/extract_rls_policies_output.sql
   ```

2. **Paste the Results**
   - Open `docs/schema/extract_rls_policies_output.sql`
   - Paste the SQL query results
   - Save the file

### Step 3: Generate Documentation

1. **Run the Formatter**
   ```bash
   cd /Users/_PropAI/construct_ai
   node docs/schema/format_rls_policies.js
   ```

2. **Check the Results**
   - The `docs/schema/index-policies.md` file will be updated
   - Contains detailed RLS policy information for all tables

## 📊 What You Get

The generated `index-policies.md` includes:

- **Complete report of ALL 442 tables** with their RLS status
- **Detailed policy listings** for tables that have RLS policies
- **Policy details**: operations, roles, conditions, checks
- **Tables with RLS enabled** but no policies defined
- **Tables without RLS** (completely unprotected)
- **Comprehensive statistics** and security analysis

### RLS Status Categories:
- **HAS_POLICIES**: Table has RLS enabled with actual policies
- **RLS_ENABLED_NO_POLICIES**: RLS enabled but no policies configured
- **NO_RLS**: No Row Level Security (public access)

## 🔍 Understanding the Output

### Policy Details Format:
```
#### `table_name`
**RLS Policies**: 2

**Policy 1:** policy_name
- **Operations:** SELECT, INSERT
- **Roles:** authenticated
- **Condition:** `auth.uid() = user_id`
- **Permissive:** true
```

### Key Fields:
- **Operations**: SELECT, INSERT, UPDATE, DELETE, or ALL
- **Roles**: authenticated, anon, public, or specific roles
- **Condition**: The USING clause that filters rows
- **Check**: The WITH CHECK clause for INSERT/UPDATE validation
- **Permissive**: Whether the policy is permissive (true) or restrictive (false)

## 🛠️ Troubleshooting

### No Policies Found
- Some tables might not have RLS enabled
- Check if you're running against the correct database

### SQL Errors
- Ensure you're running in the correct Supabase project
- Check that you have appropriate permissions

### Formatting Issues
- Ensure the SQL output was copied completely
- Check that `extract_rls_policies_output.sql` exists and has content

## 🔒 Security Notes

- These scripts only read policy information
- No modifications are made to your database
- All queries use read-only SELECT statements
- Safe to run in production environments

## 📝 Manual Process

This manual process is necessary because:

1. **Supabase Security**: Direct API access to `pg_policies` is blocked
2. **Verification**: Allows you to review the SQL output before processing
3. **Control**: Gives you full control over the extraction process

For automated extraction, consider using the Supabase CLI with appropriate service role access.
