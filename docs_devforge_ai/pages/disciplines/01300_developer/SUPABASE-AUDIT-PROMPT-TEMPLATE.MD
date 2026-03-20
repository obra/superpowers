# Generic Database Audit and SQL Implementation Prompt Template

## Purpose
This template provides a structured approach for conducting database audits and implementing SQL changes in Supabase/PostgreSQL environments.

## Audit Phase Prompt

```
Conduct a comprehensive database audit of [DATABASE_NAME] by running SQL queries to analyze the current schema structure. Follow this methodology:

1. TABLE STRUCTURE ANALYSIS
   - Query pg_tables to identify all existing tables in the public schema
   - Filter out system tables to focus on application tables
   - List all tables including core entities like [TABLE_NAMES]

2. COLUMN STRUCTURE EXAMINATION  
   - Use information_schema.columns to analyze detailed structure of key tables
   - Specifically examine [TARGET_TABLE] table to check for required columns ([REQUIRED_COLUMNS])
   - Verify data types, nullability, and default values for each column
   - Check [RELATED_TABLE] structure to understand existing workflow fields

3. COMPATIBILITY VERIFICATION
   - Confirm whether [TARGET_TABLE] table exists and is accessible
   - Verify presence of critical workflow columns needed for [FEATURE_NAME]
   - Check if table structure supports planned enhancements

4. CROSS-REFERENCE ANALYSIS
   - Examine relationships between tables (foreign key references)
   - Verify column consistency across related tables
   - Identify missing columns that would prevent implementation

Provide detailed findings about the current state and what modifications are needed.
```

## Implementation Phase Prompt

```
Based on the audit findings, create and implement SQL scripts following this approach:

1. SAFETY-FIRST IMPLEMENTATION
   - Use IF NOT EXISTS clauses to prevent errors
   - Create backup scripts before making changes
   - Test scripts on a development environment first

2. SCRIPT ORGANIZATION
   - Create separate files for:
     * Audit scripts (analysis only)
     * Fix scripts (immediate corrections)
     * Enhancement scripts (new features)
     * Rollback scripts (recovery procedures)

3. EXECUTION ORDER
   - Audit existing schema first
   - Apply immediate fixes
   - Implement enhancements
   - Verify results with test queries

4. DOCUMENTATION
   - Include clear comments explaining each operation
   - Add verification queries to confirm success
   - Document any dependencies between scripts

Generate the necessary SQL files and execution scripts following these guidelines.
```

## Usage Example

To use this template for future audits:

1. Replace placeholders with specific details:
   - [DATABASE_NAME] → your_actual_database
   - [TABLE_NAMES] → form_templates, projects, organizations
   - [TARGET_TABLE] → form_templates
   - [REQUIRED_COLUMNS] → status, is_active
   - [FEATURE_NAME] → template workflow management

2. Customize the methodology based on your specific requirements

3. Use the implementation template to structure your SQL development process

This approach ensures systematic database analysis and safe SQL implementation practices.
