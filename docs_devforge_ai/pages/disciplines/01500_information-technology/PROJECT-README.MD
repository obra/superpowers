# Quick Table Schema Reference

When generating new SQL, you can quickly reference existing table schemas using the provided tools and documentation.

## Available Tools

### 1. Command-Line Schema Reference Script
```bash
# List all tables
node script_get_table_schema.cjs

# Show specific table schema
node script_get_table_schema.cjs <table_name>

# Filter columns in a table
node script_get_table_schema.cjs <table_name> <column_filter>

# Search for columns across all tables
node script_get_table_schema.cjs search <column_name>
```

### 2. Schema Documentation Files
- `docs/schema/current-full-schema_sqlite.sql` - SQLite version (recommended)
- `docs/schema/current-full-schema.sql` - PostgreSQL version

## Common Table Reference Patterns

### Users and Authentication
```bash
# Check user table structure
node script_get_table_schema.cjs users

# Find all email fields
node script_get_table_schema.cjs search email
```

### Documents and Signatures
```bash
# Document table structure
node script_get_table_schema.cjs documents

# Signature-related tables
node script_get_table_schema.cjs signatures
node script_get_table_schema.cjs signature_requests
```

### Projects and Equipment
```bash
# Construction projects
node script_get_table_schema.cjs construction_projects

# Equipment management
node script_get_table_schema.cjs equipment
node script_get_table_schema.cjs maintenance_records
```

### Organization and Multi-tenant Data
```bash
# Organization structure
node script_get_table_schema.cjs organizations

# All tables with organization_id
node script_get_table_schema.cjs search organization_id
```

## Quick Reference for SQL Generation

### Creating Related Records
When inserting records that reference other tables, check the foreign keys:

```sql
-- Example: Creating a new document
INSERT INTO documents (
    organization_id,  -- Required: references organizations(id)
    title,           -- Required
    document_type,   -- Required
    status,          -- Has default 'draft'
    created_by,      -- Required: references users(id)
    -- ... other fields
) VALUES (...);

-- Check schema:
node script_get_table_schema.cjs documents created_by
```

### Finding Required Fields
```bash
# Check what fields are required (no DEFAULT values)
node script_get_table_schema.cjs <table_name>

# Fields WITHOUT "DEFAULT" in constraints are typically required
# Fields WITH "NOT NULL" are required
```

### Understanding Data Types
- `TEXT` - Variable length strings
- `TEXT(n)` - String with max length n
- `INTEGER` - Whole numbers
- `REAL(p,s)` - Decimal numbers (precision, scale)
- Foreign key references: `TEXT REFERENCES other_table(id)`

## Database Versions

- **SQLite Version** (`current-full-schema_sqlite.sql`): For local development and SQLite databases
- **PostgreSQL Version** (`current-full-schema.sql`): For production Supabase/PostgreSQL deployment

Use the appropriate version for your target database when writing SQL scripts.
