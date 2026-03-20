# Database Schema

## Overview

The database schema is designed to support multi-tenant architecture with comprehensive company management, role-based access control, and customizable UI settings. This document outlines the core database structures and their relationships.

**📋 Documentation Cross-References**:
- **Technical Reference**: See [`0300_DATABASE_SCHEMA_REFERENCE.md`](./0300_DATABASE_SCHEMA_REFERENCE.md) for detailed table specifications, indexes, and RLS policies
- **Governance Forms**: For `form_templates` table details, see [`1300_01300_GOVERNANCE_PAGE.md`](../../pages-disciplines/1300_01300_GOVERNANCE_PAGE.md)

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
4. **Update Docs** (`docs/0300_DATABASE_SCHEMA_REFERENCE.md`) - Schema documentation

**🎯 Result:** Best of both worlds - auditable definitions with automated, safe execution!

## Core Tables

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

## Document Control Tables

These tables are designed to manage project documents, their versions, and discipline-specific metadata, integrated with the existing user and role management system for access control.

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

### Row Level Security (RLS)

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

## Data Migration

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

## Related Documentation

- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Security Model](0400_SECURITY_MODEL.md)
- [Company Management](0600_COMPANY_MANAGEMENT.md)
- [Supabase Integration](0500_SUPABASE.md)
