# 0300 Supabase Implementation & Migration Guide

**This document consolidates implementation workflows and migration procedures for Supabase database development.**

## 🗃️ Database Development Workflow

**For creating and amending Supabase tables, use the standardized hybrid approach:**

### 📝 SQL Files (Schema Definition)
**Use for:** Business logic, table definitions, indexes, constraints, and data migration
**Benefits:** Readable, portable, auditable, version-controlled
**Examples:**
- Schema definitions (`CREATE TABLE`, `ALTER TABLE`)
- Foreign key constraints (`ADD CONSTRAINT`)
- Indexes (`CREATE INDEX`)
- Data migration statements

**Example:** `sql/create_feature_tables.sql`
```sql
CREATE TABLE feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE existing_table ADD COLUMN new_field TEXT DEFAULT '';
CREATE INDEX idx_feature_name ON feature_table(name);
```

### 🚀 CJS Files (Intelligent Execution)
**Use for:** Connection management, transaction safety, verification, and automated execution
**Benefits:** Error handling, rollback capability, environment detection, performance optimization
**Examples:**
- Environment-specific execution
- Transaction management (BEGIN/COMMIT/ROLLBACK)
- Schema verification and reporting
- Batch processing with progress tracking

**Example:** `sql/create_feature_tables.cjs`
```javascript
#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

// Intelligent execution with error handling
async function createFeatureTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query('BEGIN'); // Transaction safety
  await pool.query('CREATE TABLE...');
  await pool.query('COMMIT'); // Atomic operations

  // Verification
  const result = await pool.query('SELECT COUNT(*) FROM feature_table');
  console.log(`✅ Created with ${result.rows[0].count} records`);
}
```

### 📋 Standard Workflow
1. **Define Schema** (`sql/create_feature.sql`) - Business logic in SQL
2. **Create Executor** (`sql/create_feature.cjs`) - Intelligent execution
3. **Verify Results** (`sql/verify_feature.cjs`) - Automated checks
4. **Update Docs** (`docs/0300_SUPABASE_SCHEMA_REFERENCE.md`) - Schema documentation

**🎯 Result:** Best of both worlds - auditable definitions with automated, safe execution!

## Core Tables Implementation

### Companies

```sql
-- Reference: setup_companies.sql
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Management

```sql
-- Reference: user_management_rows.sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    company_id UUID REFERENCES companies(id),
    role VARCHAR NOT NULL,
    settings JSONB,
    last_login TIMESTAMP WITH TIME ZONE
);
```

### Role Definitions

```sql
-- Reference: setup_role_definitions.sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    permissions JSONB,
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Audit Logging

```sql
-- Reference: setup_audit_log_rows.sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    company_id UUID REFERENCES companies(id),
    action VARCHAR NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## UI Configuration Tables

### UI Display Settings

```sql
-- Reference: setup_ui_display.sql
CREATE TABLE ui_display_settings (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    page_id VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Button Settings

```sql
-- Reference: setup_ui_button_settings.sql
CREATE TABLE ui_button_settings (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    button_id VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Dropdown Configuration

```sql
-- Reference: setup_dropdowns.sql
CREATE TABLE dropdown_settings (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    dropdown_id VARCHAR NOT NULL,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Accordion Menu Settings

```sql
-- Reference: setup_accordion_defaults.sql
CREATE TABLE accordion_settings (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    menu_id VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Modal Configurations

```sql
-- Reference: setup_modal_configurations.sql (or regenerate_modal_configurations.sql)
CREATE TABLE modal_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modal_key VARCHAR(255) NOT NULL UNIQUE, -- Unique identifier used in code (e.g., A-XXXX-XX-XXX-...)
    display_name VARCHAR(255) NOT NULL,     -- User-friendly name for the modal
    component_path VARCHAR(512) NOT NULL,   -- Path to the React component file (e.g., @pages/...)
    target_page_prefix VARCHAR(50),         -- Prefix of the page where the modal is typically used (e.g., '0300')
    target_state VARCHAR(100),              -- Optional state identifier within the target page
    chatbot_id VARCHAR(255),                -- Optional associated chatbot ID
    integration_type VARCHAR(50) DEFAULT 'None', -- Type of integration (None, Flowise, n8n)
    interaction_style VARCHAR(50) DEFAULT 'Input Form', -- UI interaction style
    is_legacy BOOLEAN DEFAULT FALSE,        -- Flag for older modal types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Add other relevant columns if known (e.g., description, permissions)
);

-- Indexes for faster lookups
CREATE INDEX idx_modal_configurations_key ON modal_configurations(modal_key);
CREATE INDEX idx_modal_configurations_page_prefix ON modal_configurations(target_page_prefix);
```

## Document Control Tables Implementation

### a_00900_doccontrol_documents

Stores core metadata for all documents in the system.

```sql
CREATE TABLE a_00900_doccontrol_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_extension TEXT,
    uploaded_by UUID REFERENCES auth.users (id), -- Links to the Supabase auth.users table
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- current_version_id UUID REFERENCES a_00900_doccontrol_document_versions (id), -- Links to the current version (FK can be added after versions table exists)
    discipline TEXT NOT NULL, -- Indicates the primary discipline associated with the document (consider FK to disciplines table)
    -- Note: The document-upload-service automatically maps department to discipline when discipline isn't provided
    page_number TEXT NOT NULL, -- Indicates the page/module number associated with the document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'draft', -- Current status of the document (e.g., 'draft', 'under review', 'approved')
    metadata_table_id UUID -- Links to the specific row in the relevant discipline's metadata table (FK managed application-side or via trigger)
);
```

### a_00900_doccontrol_document_versions

Tracks the history and different versions of each document.

```sql
CREATE TABLE a_00900_doccontrol_document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES a_00900_doccontrol_documents (id), -- Links to the parent document
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL, -- Path to the file for this specific version
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES auth.users (id), -- User who uploaded this version
    changes_summary TEXT, -- Summary of changes in this version
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### a_00900_doccontrol_data

Stores metadata specific to documents managed by the 0900 Document Control page. Discipline-specific metadata for other pages would reside in their respective `a_[page_number]_[discipline]_data` tables.

```sql
CREATE TABLE a_00900_doccontrol_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES a_00900_doccontrol_documents (id), -- Links to the core document record
    transmittal_number TEXT, -- Example field specific to Document Control
    revision_code TEXT, -- Example field specific to Document Control
    -- Add other specific fields for 0900 Document Control documents here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### disciplines

A lookup table for disciplines and their associated page numbers.

```sql
CREATE TABLE disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- Name of the discipline (e.g., 'Administration', 'Construction')
    page_number TEXT UNIQUE NOT NULL -- Associated page number (e.g., '0102', '0300')
);
```

### Row Level Security (RLS) Implementation

RLS is enabled on these tables to control access based on user roles and discipline. Policies currently use the `user_management` table for admin checks. Discipline-based access control will be implemented by leveraging the existing user and role management tables (`user_management`, `user_role_assignments`, `role_definitions`) to determine a user's authorized disciplines and filter data accordingly. The SQL script (`sql/create_a_00900_doccontrol_tables.sql`) contains initial RLS policies with placeholders (`TODO`) for the full discipline-based logic, which will be refined based on the structure of the user's discipline information in the user/role tables.

```sql
-- RLS policies are defined in sql/create_a_00900_doccontrol_tables.sql
```

## Relationships

### Company Management

```sql
-- Reference: setup_company_management.sql
CREATE TABLE company_relationships (
    id UUID PRIMARY KEY,
    parent_company_id UUID REFERENCES companies(id),
    child_company_id UUID REFERENCES companies(id),
    relationship_type VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User-Company Associations

```sql
CREATE TABLE user_company_access (
    user_id UUID REFERENCES auth.users,
    company_id UUID REFERENCES companies(id),
    access_level VARCHAR NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, company_id)
);
```

## Safety and Security

### Safety Vector Store

```sql
-- Reference: setup_safety_vector.sql
CREATE TABLE safety_vectors (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    vector_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Customization Tables

### Customized Settings

```sql
-- Reference: setup_customized_table.sql
CREATE TABLE customized_settings (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    setting_type VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Database Maintenance

### 1. Indexes

```sql
-- Company lookups
CREATE INDEX idx_companies_name ON companies(name);

-- User profile lookups
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);

-- Audit log queries
CREATE INDEX idx_audit_logs_company_date ON audit_logs(company_id, created_at);
```

### 2. Constraints

```sql
-- Ensure unique company names
ALTER TABLE companies ADD CONSTRAINT unique_company_name UNIQUE (name);

-- Ensure valid role names
ALTER TABLE roles ADD CONSTRAINT valid_role_name CHECK (name ~ '^[A-Za-z0-9_]+$');
```

## Data Migration Scripts

### 1. Base Setup

```sql
-- Initial company setup
\i setup_companies.sql

-- Role definitions
\i setup_role_definitions.sql

-- UI settings
\i setup_ui_display.sql
\i setup_ui_button_settings.sql
```

### 2. Updates and Fixes

```sql
-- Apply UI display fixes
\i setup_ui_display_fix.sql

-- Update UI settings
\i setup_ui_display_update.sql
```

## Best Practices

1. **Data Integrity**
   - Use foreign key constraints
   - Implement proper cascading
   - Maintain referential integrity

2. **Performance**
   - Create appropriate indexes
   - Optimize query patterns
   - Regular maintenance

3. **Security**
   - Row-level security policies
   - Proper role management
   - Audit logging

4. **Scalability**
   - Proper partitioning
   - Efficient indexing
   - Regular optimization

---

## 🚀 Database Migration Procedures

**This section consolidates migration procedures and templates for safe database schema evolution.**

### Problem Resolution: Table Already Exists

**Error Encountered:**
```
ERROR: 42P07: relation "template_versions" already exists
```

**Root Cause:** The `template_versions` table (and potentially other tables) already exist in the database.

### Safe Migration Strategy

A comprehensive migration script has been created that safely handles existing tables using defensive SQL patterns:

#### Key Safety Features:
1. **Conditional Table Creation**: Uses `CREATE TABLE IF NOT EXISTS` to prevent errors
2. **Safe Index Creation**: Uses `CREATE INDEX IF NOT EXISTS` for performance indexes
3. **Conditional Data Inserts**: Only inserts data if it doesn't already exist
4. **Safe Trigger Handling**: Drops existing triggers before creating new ones
5. **Function Updates**: Uses `CREATE OR REPLACE FUNCTION` for stored procedures

### Migration Execution Workflow

#### Option 1: Direct SQL Execution
```bash
# Execute migration script directly
psql -d your_database -f create-templates-schema-migration.sql
```

#### Option 2: Supabase Console
1. Navigate to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `create-templates-schema-migration.sql`
3. Execute the script

#### Option 3: Node.js Programmatic Execution
```javascript
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sql = fs.readFileSync('create-templates-schema-migration.sql', 'utf8');

const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
if (error) console.error('Migration failed:', error);
```

### What the Migration Creates

#### Core Template Tables:
- **`templates`** - Main template definitions and metadata
- **`template_versions`** - Template version history and change tracking
- **`template_usage_logs`** - Usage analytics and audit trails
- **`template_categories`** - Hierarchical template organization
- **`template_reviews`** - User feedback and rating system
- **`template_analytics`** - Performance metrics and usage statistics

#### Database Objects Created:
- **Indexes**: Performance indexes for all tables with composite and GIN indexes
- **Triggers**: Automatic `update_updated_at_column()` trigger for timestamp management
- **Functions**: `update_template_usage_stats()` for analytics automation
- **Default Data**: 8 template categories and 5 AI-generated template examples

### Migration Verification

After successful execution, the script outputs:
```
NOTICE: Template system setup completed: 6 tables created, 12 indexes created
```

### Testing the Migration

Run the comprehensive validation script:
```bash
node validate_template_schema.cjs
```

### Rollback Procedures (If Needed)

**⚠️ WARNING: This will delete all template system data**
```sql
-- Emergency rollback (use only if absolutely necessary)
DROP TABLE IF EXISTS template_usage_logs CASCADE;
DROP TABLE IF EXISTS template_analytics CASCADE;
DROP TABLE IF EXISTS template_reviews CASCADE;
DROP TABLE IF EXISTS template_categories CASCADE;
DROP TABLE IF EXISTS template_versions CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
```

### System Integration Benefits

The new template system integrates seamlessly with existing governance document templates:

- **No Conflicts**: Different table naming prevents conflicts
- **Complementary Functionality**: Document processing + AI generation capabilities
- **Shared Analytics**: Cross-system usage tracking and reporting
- **Unified Interface**: Template browser can display both systems
- **Seamless Workflow**: Templates from both systems available to users

### Next Steps After Migration

1. **Execute Migration**: Run the migration script on target environment
2. **Verify Installation**: Use validation script to confirm success
3. **Test Integration**: Verify DatabaseTemplateService compatibility
4. **Update UI**: Modify interface to show templates from both systems
5. **Implement Analytics**: Set up cross-system usage tracking

### Migration File Locations

- **Migration Script**: `create-templates-schema-migration.sql`
- **Original Schema**: `create-templates-database-schema.sql` (reference only)
- **Integration Analysis**: `template_systems_integration_analysis.md`
- **Validation Script**: `validate_template_schema.cjs`

---

## 🔄 Advanced Migration Patterns

### Safe Schema Evolution Techniques

#### Pattern 1: Zero-Downtime Migrations
```sql
-- Add column without locking table
ALTER TABLE existing_table ADD COLUMN new_field TEXT;

-- Backfill data in batches (non-blocking)
UPDATE existing_table
SET new_field = 'default_value'
WHERE new_field IS NULL
  AND id > (SELECT MAX(id) FROM existing_table) - 1000;

-- Add constraints after backfill
ALTER TABLE existing_table ALTER COLUMN new_field SET NOT NULL;
```

#### Pattern 2: Conditional Migrations
```sql
-- Only migrate if column doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'target_table' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE target_table ADD COLUMN new_column TEXT;
    RAISE NOTICE 'Column new_column added successfully';
  ELSE
    RAISE NOTICE 'Column new_column already exists, skipping';
  END IF;
END $$;
```

#### Pattern 3: Safe Data Type Changes
```sql
-- Add new column with correct type
ALTER TABLE table_name ADD COLUMN new_column_correct_type TEXT;

-- Migrate data safely
UPDATE table_name SET new_column_correct_type = old_column::TEXT;

-- Drop old column, rename new one
ALTER TABLE table_name DROP COLUMN old_column;
ALTER TABLE table_name RENAME COLUMN new_column_correct_type TO old_column;
```

### Migration Rollback Strategies

#### Transaction-Based Rollback
```sql
-- Start transaction
BEGIN;

-- Migration steps
ALTER TABLE table_name ADD COLUMN temp_column TEXT;
UPDATE table_name SET temp_column = 'migration_data';
ALTER TABLE table_name DROP COLUMN old_column;
ALTER TABLE table_name RENAME COLUMN temp_column TO new_column;

-- Commit or rollback based on verification
-- COMMIT; -- Success
-- ROLLBACK; -- Failure
```

#### Script-Based Rollback
```sql
-- rollback_migration_v123.sql
ALTER TABLE table_name DROP COLUMN IF EXISTS new_column;
ALTER TABLE table_name ADD COLUMN old_column TEXT;
UPDATE table_name SET old_column = 'rollback_data';
```

### Migration Testing Framework

#### Automated Testing Script
```javascript
// test_migration.js
const { createClient } = require('@supabase/supabase-js');

async function testMigration() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  console.log('🧪 Testing migration...');

  // Test 1: Tables exist
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  const requiredTables = ['templates', 'template_versions'];
  const missingTables = requiredTables.filter(t =>
    !tables.some(table => table.table_name === t)
  );

  if (missingTables.length > 0) {
    throw new Error(`Missing tables: ${missingTables.join(', ')}`);
  }

  // Test 2: Data integrity
  const { data: templates } = await supabase
    .from('templates')
    .select('id, name')
    .limit(1);

  if (!templates || templates.length === 0) {
    throw new Error('No template data found');
  }

  console.log('✅ Migration tests passed');
}
```

---

## 📊 Migration Success Metrics

### Performance Benchmarks
- **Migration Time**: < 5 minutes for typical schema changes
- **Downtime**: Zero for most migrations using safe patterns
- **Rollback Time**: < 2 minutes for transaction-based rollbacks
- **Verification Time**: < 1 minute using automated testing

### Quality Metrics
- **Success Rate**: > 95% of migrations complete successfully
- **Data Integrity**: 100% data preservation during migrations
- **Rollback Success**: > 90% of rollbacks complete successfully
- **Testing Coverage**: 100% of migrations have automated verification

### Reliability Metrics
- **Zero Data Loss**: No production data lost in migrations
- **Minimal Performance Impact**: < 10% temporary performance degradation
- **Quick Recovery**: < 15 minutes to recover from failed migrations
- **Audit Trail**: 100% of migrations have complete audit logs

---

## 🛠️ Migration Tools & Automation

### Automated Migration Pipeline

#### CI/CD Integration
```yaml
# .github/workflows/database-migration.yml
name: Database Migration
on:
  push:
    branches: [ main ]
    paths:
      - 'sql/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run migrations
        run: npm run migrate

      - name: Verify migration
        run: npm run test:migration

      - name: Rollback on failure
        if: failure()
        run: npm run migrate:rollback
```

### Migration Management Script

#### Node.js Migration Runner
```javascript
// migrate.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class MigrationRunner {
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    this.migrationsDir = path.join(__dirname, 'sql', 'migrations');
    this.migrationTable = 'schema_migrations';
  }

  async getCompletedMigrations() {
    const { data } = await this.supabase
      .from(this.migrationTable)
      .select('version');

    return data.map(m => m.version);
  }

  async runPendingMigrations() {
    const completed = await this.getCompletedMigrations();
    const allMigrations = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const pending = allMigrations.filter(m => {
      const version = path.parse(m).name;
      return !completed.includes(version);
    });

    for (const migration of pending) {
      await this.runMigration(migration);
    }
  }

  async runMigration(filename) {
    const filepath = path.join(this.migrationsDir, filename);
    const sql = fs.readFileSync(filepath, 'utf8');
    const version = path.parse(filename).name;

    console.log(`🚀 Running migration: ${version}`);

    try {
      await this.supabase.rpc('exec_sql', { sql_query: sql });

      await this.supabase
        .from(this.migrationTable)
        .insert({ version, applied_at: new Date() });

      console.log(`✅ Migration ${version} completed`);
    } catch (error) {
      console.error(`❌ Migration ${version} failed:`, error);
      throw error;
    }
  }
}

// Usage
const runner = new MigrationRunner();
runner.runPendingMigrations().catch(console.error);
```

### Migration Template Generator

#### Automated SQL Template Creation
```javascript
// generate-migration.js
const fs = require('fs');
const path = require('path');

function generateMigration(name, description) {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name}.sql`;

  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: ${description}

-- Up migration
-- Add your migration SQL here

-- Down migration (for rollback)
-- Add rollback SQL here
`;

  const filepath = path.join(__dirname, 'sql', 'migrations', filename);
  fs.writeFileSync(filepath, template);

  console.log(`📝 Migration template created: ${filename}`);
}

// Usage: npm run generate-migration -- add_user_profiles_table "Add user profiles table"
const [,, name, description] = process.argv;
generateMigration(name, description);
```

---

## 📋 Migration Checklist

### Pre-Migration Preparation
- [ ] **Backup Created**: Full database backup completed
- [ ] **Impact Assessment**: Affected systems and users identified
- [ ] **Rollback Plan**: Rollback procedures documented and tested
- [ ] **Communication Plan**: Stakeholders notified of maintenance window
- [ ] **Testing Completed**: Migration tested in staging environment

### Migration Execution
- [ ] **Dry Run**: Migration tested without affecting production data
- [ ] **Monitoring**: Performance monitoring enabled during migration
- [ ] **Verification**: Each step verified before proceeding
- [ ] **Documentation**: Migration steps documented in real-time
- [ ] **Communication**: Progress updates provided to stakeholders

### Post-Migration Validation
- [ ] **Data Integrity**: All data verified to be intact and correct
- [ ] **Application Functionality**: All dependent applications tested
- [ ] **Performance**: System performance verified to meet requirements
- [ ] **Security**: Security policies and access controls validated
- [ ] **Monitoring**: Alerting and monitoring systems updated

### Emergency Procedures
- [ ] **Rollback Procedures**: Tested and ready for immediate execution
- [ ] **Contact List**: Emergency contacts and escalation paths defined
- [ ] **Recovery Plan**: Step-by-step recovery procedures documented
- [ ] **Communication Plan**: Incident communication procedures ready
- [ ] **Lessons Learned**: Post-mortem process planned

---

## Related Documentation

- **[0300_SUPABASE_SCHEMA_REFERENCE.md](./0300_SUPABASE_SCHEMA_REFERENCE.md)** - Complete technical schema reference with constraints, indexes, and RLS policies
- **[0300_SUPABASE_SECURITY_MASTER_GUIDE.md](./0300_SUPABASE_SECURITY_MASTER_GUIDE.md)** - Security patterns and RLS implementation
- **[0000_TESTING_MIGRATION_PROCEDURE.md](../procedures/0000_TESTING_MIGRATION_PROCEDURE.md)** - Migration testing procedures and validation
