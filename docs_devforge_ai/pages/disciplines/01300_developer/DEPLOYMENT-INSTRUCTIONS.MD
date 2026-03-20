# Contractor Vetting System Deployment Instructions

## SQL Execution Sequence

The SQL files must be executed in the following order to ensure proper database setup and dependencies:

### 1. Core Tables (Required First)
```sql
sql/create-contractor-vetting-tables.sql
```
This creates the main contractor vetting tables that other components depend on.

### 2. Document Management Integration
```sql
sql/create-contractor-vetting-documents.sql
```
This integrates with the existing document control system and must run after the core tables.

### 3. Storage Configuration
```sql
sql/create-contractor-vetting-storage.sql
```
This sets up the Supabase storage bucket and path generation functions.

### 4. Record Manager Integration
```sql
sql/create-contractor-vetting-record-manager.sql
```
This integrates with the document management record manager system.

### 5. Sample Data (Optional - Development/Testing)
```sql
sql/create-sample-contractors.sql
```
This creates sample data for testing and development purposes.

## Execution Commands

Run these commands in order:

```bash
# 1. Core tables
psql -f sql/create-contractor-vetting-tables.sql

# 2. Document management integration
psql -f sql/create-contractor-vetting-documents.sql

# 3. Storage configuration
psql -f sql/create-contractor-vetting-storage.sql

# 4. Record manager integration
psql -f sql/create-contractor-vetting-record-manager.sql

# 5. Sample data (optional)
psql -f sql/create-sample-contractors.sql
```

## Important Notes

1. **Dependencies**: Each file builds on the previous ones, so order is critical
2. **Database Permissions**: Ensure you have proper permissions to create tables and functions
3. **Supabase Storage**: The storage configuration requires Supabase admin access
4. **RLS Policies**: Row Level Security policies are included in the storage configuration
5. **Testing**: Run the sample data script only in development environments
6. **Sequence Grants**: Some files grant USAGE on SERIAL sequences - these are required for proper database operation
7. **Trigger Names**: All trigger names are unique to prevent conflicts

## Verification

After running all SQL scripts, verify the installation by:

1. Checking that all tables exist in your database
2. Verifying that the storage bucket is created
3. Testing the path generation function
4. Running the verification script: `node scripts/verify-contractor-vetting.js`

## Rollback Procedure

If you need to rollback the changes, run the cleanup scripts in reverse order or drop the tables manually:

```sql
DROP TABLE IF EXISTS contractor_vetting_chat_messages CASCADE;
DROP TABLE IF EXISTS contractor_evaluation_results CASCADE;
DROP TABLE IF EXISTS a_02400_contractor_vetting_data CASCADE;
DROP TABLE IF EXISTS a_02400_contractor_vetting_document_versions CASCADE;
DROP TABLE IF EXISTS a_02400_contractor_vetting_documents CASCADE;
DROP TABLE IF EXISTS contractor_vetting_sections CASCADE;
DROP TABLE IF EXISTS contractor_vetting CASCADE;
DROP TABLE IF EXISTS contractor_vetting_document_hashes CASCADE;
DROP TABLE IF EXISTS contractor_vetting_ingestion_registry CASCADE;
DROP TABLE IF EXISTS contractor_vetting_document_parts CASCADE;
