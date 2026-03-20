# Supabase Schema Documentation

This document provides a comprehensive overview of all Supabase tables, their structure, relationships, and usage within the application.

## Table of Contents
1. [Agent Tables](#agent-tables)
2. [Modal Tables](#modal-tables) 
3. [Chatbot Tables](#chatbot-tables)
4. [Document Management](#document-management)
5. [Contributor System](#contributor-system)
6. [Schema Extraction Queries](#schema-extraction-queries)

---

## Agent Tables

The system maintains **three distinct agent-related tables** with different purposes and data structures:

### 1. agent_names
**Purpose**: Stores basic agent definitions and team categorizations  
**Columns**:
- id (integer) - Primary key
- name (text) - Display name of the agent/team
- description (text) - Description of the agent's purpose
- created_at (timestamp) - Creation time

**Data Type**: **Team/Category definitions** - Contains high-level agent categories

**Current Data**: 10 agent categories including:
- **NEW REAL CATEGORIES** (added 2025-07-22):
  - Legal Analysis Agents
  - Financial Analysis Agents
  - Contract Management Agents
  - Email Management Agents
  - Construction Agents
  - Risk Assessment Agents
  - Document Processing Agents
- **Legacy categories** (to be deprecated):
  - Legal Team
  - Finance Team
  - Compliance Office
  - Risk Assessment

### 2. agent_modal_assignments
**Purpose**: Links agent definitions to specific modal configurations and pages  
**Columns**:
- id (integer) - Primary key
- agent_name_id (integer) - Foreign key to agent_names.id
- modal_configuration_id (uuid) - Foreign key to modal_configurations
- page_id (uuid) - Foreign key to pages
- created_at (timestamp) - Creation time
- updated_at (timestamp) - Last update time
- last_used (timestamp) - Last usage timestamp

**Data Type**: **Relationship mapping** - Maps agent categories to specific modal configurations and pages

### 3. agents_tracking
**Purpose**: Tracks **individual AI agents** with detailed operational context across the EPCM platform  
**Columns**:
- id (uuid) - Primary key
- agent_name (text) - Specific agent name (e.g., "Construction AI Assistant")
- company (text) - Organization (e.g., "ConstructAI")
- sector (text) - Sector specialization (e.g., "Engineering Procurement Construction Management")
- organization (text) - **Single organization**: "Organisation - EPCM" (all agents)
- phase (text) - Project phase (e.g., "Planning", "Execution", "Pre-Award", "All Phases")
- page_id (uuid) - Foreign key to pages (nullable)
- page_name (text) - Page name (e.g., "Contracts Post Award", "Director Finance")
- page_prefix (text) - Page routing prefix (e.g., "00435", "00889", "03010")
- contributor_id (uuid) - Foreign key to contributors (nullable)
- created_at (timestamp) - Creation time
- updated_at (timestamp) - Last update time
- is_active (boolean) - Active status
- notes (text) - Detailed description
- last_used (timestamp) - Last usage time

**Data Type**: **Individual AI agent instances** - Contains specific AI agents with operational context

**✅ REAL AGENTS SUCCESSFULLY POPULATED** (16 agents total - all under Organisation - EPCM):

**00435 - Contracts Post Award (6 agents):**
- Legal Analysis Agent - Analyzes legal documents using LangChain
- Financial Analysis Agent - Performs financial analysis on contracts
- Contract Analysis Agent - Comprehensive contract analysis using Flowise AI
- Contract Notifications Agent - Automated notifications via n8n workflows
- Correspondence Reply Agent - AI-powered correspondence generation
- Minutes Compile Agent - Compiles meeting minutes from transcripts

**00889 - Director Finance (3 agents):**
- Finance Minutes Compile Agent - Compiles financial meeting minutes
- Method Statement Agent - Generates method statements for financial processes
- Finance Risk Assessment Agent - Performs financial risk assessments

**03010 - Email Management (5 agents):**
- Email Categorization Agent - Auto-categorizes emails by type/priority
- Email Auto Response Agent - Generates automated email responses
- Email AI Search Agent - AI-powered email archive search
- Email AI Tools Agent - AI-powered email management tools
- Email Bulk AI Tools Agent - Bulk email processing with AI

**00300 - Construction (2 agents):**
- Construction Progress Agent - Tracks construction progress using AI
- Construction Safety Agent - Analyzes safety data and generates reports

## Multi-Organization Support Architecture

**Current Implementation**: All pages and agents are assigned to **"Organisation - EPCM"** as the single organization.

**Future Enhancement**: Pages can be configured to support multiple organizations through:
- **Page-to-Organization mapping table** (many-to-many relationship)
- **Organization-specific agent configurations**
- **Cross-organization agent sharing**

## Table Relationship Summary

| Table | Purpose | Data Granularity | Key Difference |
|-------|---------|------------------|----------------|
| **agent_names** | Agent categories/teams | High-level definitions | Real operational categories |
| **agent_modal_assignments** | Modal-to-agent mappings | Relationships | Links categories to modals |
| **agents_tracking** | Individual AI agents | Specific instances | 16 real implemented agents |

## Usage Assessment

✅ **ALL THREE TABLES ARE NEEDED** - Each serves a distinct purpose:
- **agent_names**: Provides agent category definitions for grouping (now with real categories)
- **agent_modal_assignments**: Manages modal-to-agent relationships for UI integration
- **agents_tracking**: Tracks actual AI agents with detailed operational context (16 real agents)

## Database Update Summary

**✅ COMPLETED 2025-07-22:**
- ✅ Removed generic/test agent names
- ✅ Added 7 new real agent categories
- ✅ Populated agents_tracking with 16 real agents
- ✅ **Updated organization field to use single "Organisation - EPCM"**
- ✅ All agents mapped to actual file implementations with "03" state prefix
- ✅ **Maintained existing organisations table structure** (no new orgs created)

---

## Modal Tables

### modal_configurations
**Purpose**: Stores modal configurations and metadata  
**Columns**:
- id (uuid) - Primary key
- modal_key (text) - Unique identifier (e.g., "A-00435-03-001-legal-analysis")
- display_name (text) - Human-readable name (e.g., "Legal Analysis")
- component_path (text) - Path to React component
- modal_type (text) - Type of modal (agent, upsert, etc.)
- page_prefix (text) - Associated page prefix (e.g., "00435", "00889", "03010")
- page_name (text) - Associated page name
- description (text) - Modal description
- is_active (boolean) - Whether modal is active
- created_by (uuid) - Foreign key to contributors
- created_at (timestamp) - Creation time

---

## Chatbot Tables

### flowise_documents
**Purpose**: Stores documents processed by Flowise chatbot system  
**Columns**:
- id (uuid) - Primary key
- store_id (uuid) - Foreign key to document_stores
- document_name (text) - Original document name
- file_name (text) - Stored filename
- mime_type (text) - Document MIME type
- file_extension (text) - File extension
- is_embedded (boolean) - Whether document is embedded
- flowise_document_id (text) - Flowise document ID
- created_at (timestamp) - Creation time

### document_stores
**Purpose**: Manages document storage locations  
**Columns**:
- id (uuid) - Primary key
- storage_type (text) - Storage provider (supabase, s3, etc.)
- storage_path (text) - Storage path prefix
- storage_url (text) - Base URL for storage
- created_at (timestamp) - Creation time

---

## Schema Extraction Queries

```sql
-- Get all tables and their columns
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
ORDER BY
    table_name,
    ordinal_position;

-- Get foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE
    tc.constraint_type = 'FOREIGN KEY';
```

## Hybrid Methodology: SQL + CJS Best Practices

**✅ RECOMMENDED APPROACH: Use BOTH SQL files and CJS execuction scripts in conjunction**

### Why Use Both?

#### 📝 **SQL Files (Primary for Definition)**
**Strengths:**
- ✅ **Version Control Friendly** - Clear, readable schema changes
- ✅ **Portable** - Can be executed directly in any PostgreSQL client
- ✅ **Auditable** - Easy to review what changes are being made
- ✅ **Shareable** - Can be shared with DBA teams or external consultants
- ✅ **Standards Compliant** - Pure SQL follows universal database standards

**Examples of what goes in SQL files:**
- Schema definitions (`CREATE TABLE`, `ALTER TABLE`)
- Index creation (`CREATE INDEX`)
- Foreign key constraints (`ADD CONSTRAINT`)
- Data migration statements
- Grant/revoke permissions

#### 🚀 **CJS Files (Primary for Execution)**
**Strengths:**
- ✅ **Intelligent Connection Management** - SSL, environment detection, error handling
- ✅ **Transactional Safety** - Automatic rollback on failures
- ✅ **Automated Verification** - Built-in schema checks after execution
- ✅ **Environment Awareness** - Can adapt behavior for dev/prod/test
- ✅ **Performance Optimized** - Batch processing and connection pooling
- ✅ **Error Recovery** - Intelligent retry logic and user-friendly messages

**Examples of what goes in CJS files:**
- Environment-specific configuration
- Transaction management (BEGIN/COMMIT/ROLLBACK)
- Execution verification and reporting
- Batch processing of large datasets
- Conditional logic (IF NOT EXISTS checking)

### Recommended Workflow Structure

#### 🏗️ **Standard Schema Development Process**

1. **Define Schema in SQL**
   ```sql
   -- File: sql/create_feature_tables.sql
   CREATE TABLE feature_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   ALTER TABLE existing_table
   ADD COLUMN new_field TEXT DEFAULT '';

   CREATE INDEX idx_feature_name ON feature_table(name);
   ```

2. **Create CJS Execution Script**
   ```javascript
   // File: sql/create_feature_tables.cjs
   #!/usr/bin/env node

   const { Pool } = require('pg');
   require('dotenv').config();

   console.log('🏗️ CREATING: Feature tables');
   console.log('==============================');

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: { rejectUnauthorized: false }
   });

   async function createFeatureTables() {
     try {
       console.log('🔗 Connecting...');
       await pool.query('SELECT 1');
       console.log('✅ Connected to database');

       // Execute the SQL file
       console.log('📄 Reading SQL file...');
       const fs = require('fs').promises;
       const sqlContent = await fs.readFile('sql/create_feature_tables.sql', 'utf8');

       console.log('⚡ Executing SQL statements...');
       await pool.query(sqlContent);

       // Verify table creation
       const result = await pool.query(`
         SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_name = 'feature_table' AND table_schema = 'public'
         ) as table_exists
       `);

       if (result.rows[0].table_exists) {
         console.log('✅ Feature table created successfully');
       } else {
         console.log('❌ Feature table creation failed');
         process.exit(1);
       }

     } catch (error) {
       console.error('❌ Error creating tables:', error.message);
       process.exit(1);
     } finally {
       await pool.end();
     }
   }

   createFeatureTables();
   ```

3. **Execute the CJS Script**
   ```bash
   cd /Users/_PropAI/construct_ai
   node sql/create_feature_tables.cjs
   ```

4. **Verify with Dedicated CJS Script**
   ```javascript
   // File: sql/verify_feature_tables.cjs
   // Comprehensive verification of the feature implementation
   ```

### File Organization Benefits

#### 📁 **Clear Separation of Concerns**
```
sql/
├── 📝 feature_table_definition.sql     # Business logic definition
├── 🚀 create_feature_tables.cjs        # Intelligent execution
├── 🔍 verify_feature_tables.cjs        # Verification logic
└── 📊 feature_table_metrics.cjs        # Performance monitoring
```

#### 📋 **Executive Summary**
| Methodology | SQL Files | CJS Files |
|-------------|-----------|-----------|
| **Purpose** | Schema definition | Intelligent execution |
| **Readability** | ✅ Excellent | ✅ Good |
| **Error Handling** | ❌ Manual | ✅ Automatic |
| **Verification** | ❌ Manual | ✅ Built-in |
| **Git History** | ✅ Clear | ✅ Clear |
| **Portability** | ✅ Universal | 🔒 Node-dependent |

**🎯 RECOMMENDATION: Keep Your Current Hybrid Approach - It's the Sweet Spot!**

**SQL files** for clear, auditable schema definitions + **CJS files** for robust, automated execution = **Best of Both Worlds** 🎉

This methodology balances maintainability, reliability, and automation perfectly for your project's needs.

## Maintenance
This document should be updated whenever:
- New tables are added
- Table schemas change
- Relationships between tables are modified
- New agents are implemented in the codebase
- Multi-organization support is added

Run the schema extraction queries periodically to keep the documentation current.

## Schema Documentation References

### Essential Schema Documentation Files

**📋 Core Schema References for Schema Documentation:**

#### **Master Schema Guides**
- **[0300_DATABASE_SCHEMA_MASTER_GUIDE.md](../schema/0300_DATABASE_SCHEMA_MASTER_GUIDE.md)** - Master guide for database schema architecture and design patterns
- **[current-full-schema.md](../schema/current-full-schema.md)** - Authoritative current schema reference with all tables, columns, and relationships
- **[schema-part-01.md](../schema/schema-part-01.md)** - Core schema components and table definitions
- **[schema-part-02.md](../schema/schema-part-02.md)** - Advanced schema features and relationships
- **[schema-part-03.md](../schema/schema-part-03.md)** - Schema extensions and specialized tables

#### **Schema Management Scripts**
- **[update_schema.js](../schema/update_schema.js)** - Automated schema update utilities
- **[current-full-schema.sql](../schema/current-full-schema.sql)** - Executable SQL schema dump for validation
- **[extract_schema.sql](../schema/extract_schema.sql)** - Schema extraction queries
- **[run_schema_update.sh](../schema/run_schema_update.sh)** - Schema update automation script

### Schema Documentation Workflow

**Pre-Schema Documentation Updates:**
```bash
# 1. Review current schema architecture
cat docs/schema/0300_DATABASE_SCHEMA_MASTER_GUIDE.md | head -50

# 2. Check current full schema reference
grep -A 5 "Foreign Keys" docs/schema/current-full-schema.md

# 3. Validate table relationships
grep -A 10 "RLS Policies" docs/schema/current-full-schema.md
```

**Schema Documentation Maintenance:**
```bash
# 1. Extract updated schema
node docs/schema/extract_schema.js

# 2. Update schema documentation
# Ensure current-full-schema.md reflects changes

# 3. Validate documentation accuracy
# Compare documented schema with actual database

# 4. Update cross-references
# Ensure all procedure documents reference correct schema files
```
