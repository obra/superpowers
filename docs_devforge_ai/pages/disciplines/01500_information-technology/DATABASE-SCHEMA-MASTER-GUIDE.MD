# 📊 Construct AI Database Schema Documentation

**Comprehensive database schema reference for the Construct AI construction management system.**

---

# 🚨 CRITICAL: PRESERVE CURRENT METHODOLOGY

## ⚠️ **MANDATORY WARNING**

**THE CURRENT SCHEMA EXTRACTION METHODOLOGY MUST NOT BE CHANGED UNDER ANY CIRCUMSTANCES.**

### **MANDATORY: APPROVED EXTRACTION METHOD ONLY**
- **✅ ONLY USE**: `extract-schema-openapi.js` (located in project root)
- **❌ DO NOT MODIFY**: This script or its methodology
- **❌ DO NOT REPLACE**: With alternative approaches or custom scripts
- **❌ DO NOT EXPERIMENT**: With different extraction methods
- **❌ DO NOT CHANGE**: LaunchAgent configuration or file paths
- **❌ DO NOT RENAME**: Any generated documentation files

### **Why This Matters**
- **✅ Proven Success**: Successfully extracts all 428+ tables
- **✅ Comprehensive Analysis**: Includes RLS policies, foreign keys, constraints, indexes
- **✅ OpenAPI-Based**: Leverages Supabase's official schema specification
- **✅ Automatic Execution**: Runs via LaunchAgent on system startup
- **✅ Current Timestamps**: Updates all documentation files with fresh timestamps

### **LaunchAgent Configuration** (DO NOT MODIFY)
```xml
<key>ProgramArguments</key>
<array>
    <string>/usr/local/bin/node</string>
    <string>/Users/_PropAI/construct_ai/extract-schema-openapi.js</string>
</array>
```

### **Consequences of Changes**
- Loss of complete table extraction (only ~18 tables accessible via alternatives)
- Missing RLS policies and relationship data
- Broken automatic schema updates
- Inconsistent documentation timestamps

**PRESERVE THIS METHODOLOGY AT ALL COSTS.**

---

## 🎯 Overview

This directory contains the complete database schema documentation for Construct AI, a web-based construction management system built with:
- **Frontend**: React.js with component-based architecture
- **Backend**: Node.js with Express.js server framework
- **Database**: Supabase (PostgreSQL) with SQLite for local development
- **Authentication**: Custom authentication with dev bypass for development

## 📁 Schema Documentation Structure

### **📋 File Organization**

The complete schema documentation has been split into multiple files for better navigation and performance:

| **File** | **Tables Covered** | **Table Count** | **Description** |
|----------|-------------------|-----------------|-----------------|
| **`0300_DATABASE_SCHEMA_MASTER_GUIDE.md`** | Complete overview & navigation | - | **UPDATED:** Master documentation guide with latest extraction methods |
| **`index-discipline-pages.md`** | All pages by organization | - | **NEW:** Comprehensive index of all pages grouped by organization and page type |
| **`table-index.md`** | Complete alphabetical index | 455 | **NEW:** Alphabetical cross-reference to all tables with part assignments |
| **`schema-part-01.md`** | Tables 1-150 (A-C alphabetically) | 150 | Core system tables (admin, commercial, construction, contracts, architectural, chemical engineering, civil engineering, electrical engineering, mechanical engineering, developer, sales, sundry, board directors, construction directors, contracts directors, finance directors, HSE directors, logistics directors, procurement directors, projects directors, project directors) |
| **`schema-part-02.md`** | Tables 151-300 (D-P alphabetically) | 150 | Governance and approval tables (approval workflows, audit logs, active templates, user entities, agent systems, API services, chatbot infrastructure, contractor vetting, consultants, contacts, containers, contractor evaluations, contracts, post-award summaries, contributor systems, credential management) |
| **`schema-part-03.md`** | Tables 301-455 (Q-Z alphabetically) | 155 | Advanced features (custom document types, dropdown options, email systems, error tracking, esignatures, evaluation packages, external APIs, financial records, Flowise integration, form templates, fuel/lubricants, governance templates, approval matrices, internal notifications, job descriptions, legal reviews, limits of authority, LLM configurations, logistics, maintenance, master templates, materials, procurement orders, procurement templates, procurement signatures, quality checks, rate limits, security alerts, signature systems, SOW appendices, SOW templates, supplier management, sync systems, task management, technical categories, template analytics, template assignments, template deployments, template variations, templates, temporary uploads, tender management, timesheet systems, travel arrangements, user management, vector systems, vessel tracking, workspace management) |
| **`agents-registry-summary.md`** | AI Agents Registry | 23 | **NEW:** Comprehensive summary of all 23 active AI agents with capabilities, types, and domain distribution (Supervisor: 5, Specialist: 16, IT Specialist: 2) |
| **`current-full-schema.sql`** | Complete PostgreSQL schema | 455 | **NEW:** All tables with 100% accurate column definitions (generated on-demand) |
| **`current-full-schema_sqlite.sql`** | SQLite-compatible schema | 455 | **NEW:** Converted PostgreSQL syntax for SQLite (generated on-demand) |

### **🔍 Schema Statistics**

- **Total Tables**: 455
- **Documentation Files**: 3 parts + index + complete schemas
- **Generated**: 2026-01-16T09:38:39.145Z
- **Source**: Supabase OpenAPI Specification
- **Coverage**: 100% of database tables

### **⚠️ IMPORTANT: Database Technology**

**❌ WE DO NOT USE SQLITE**
- **Primary Database**: Supabase (PostgreSQL)
- **Local Development**: Supabase cloud instance
- **No SQLite**: Do not create or modify SQLite databases
- **Schema Files**: PostgreSQL syntax only
- **Migration Scripts**: PostgreSQL-compatible only

## 🏗️ Database Architecture

### **Core Components**

#### **🔐 Security & Access Control**
- **RLS Policies**: Row Level Security implemented on all tables
- **User Management**: Multi-tenant user organization associations
- **Role-Based Access**: Discipline and page-level permissions
- **Audit Trails**: Comprehensive logging of all data modifications

#### **📊 Multi-Tenant Architecture**
- **Organization Isolation**: User-specific organization relationships
- **Discipline-Based Access**: Engineering discipline permissions
- **Project Scoping**: Project-level data isolation
- **Company Context**: Multi-company support within organizations

#### **🔗 Data Relationships**
- **Foreign Key Constraints**: Comprehensive referential integrity
- **Cascade Operations**: Automatic relationship management
- **Audit Triggers**: Change tracking across all tables
- **Soft Deletes**: Logical deletion with retention policies

## 🎯 Key Database Features

### **Vector Search Integration**
- **LangChain Integration**: Document processing and embeddings
- **Supabase Vectors**: pgvector extension for similarity search
- **Discipline Isolation**: Vector workspaces per engineering discipline
- **Security Boundaries**: Access control for vector data

### **Document Management System**
- **Multi-Format Support**: PDF, DOCX, Excel, TXT processing
- **Version Control**: Complete document version history
- **AI Analysis**: Automated document classification and extraction
- **Approval Workflows**: Configurable document routing

### **Task Management**
- **HITL Integration**: Human-in-the-loop task processing
- **Workflow Orchestration**: Automated task sequencing
- **Progress Tracking**: Real-time task status monitoring
- **Assignment Rules**: Intelligent task distribution

### **Procurement System**
- **Template Variations**: Context-aware document generation
- **Approval Matrices**: Multi-level procurement approvals
- **Contractor Vetting**: Comprehensive supplier evaluation
- **SOW Management**: Statement of Work lifecycle tracking

## 📖 Usage Guide

### **Finding Table Information**

1. **Locate Table**: Use the table of contents in each schema part file
2. **Search by Name**: Tables are alphabetically ordered within each file
3. **Cross-Reference**: Each table shows foreign key relationships
4. **Security Info**: RLS policies documented for each table

### **Table Documentation Format**

Each table entry includes:
- **Description**: Business purpose and usage context
- **Scripts Using**: Files that reference this table
- **Referenced By**: Tables that reference this table
- **Foreign Keys**: Relationship constraints
- **Constraints**: Data validation rules
- **Indexes**: Performance optimization indexes
- **RLS Policies**: Security access rules
- **Columns**: Detailed field specifications

## 🔧 Development Guidelines

### **Schema Modification Process**

1. **Design**: Plan changes with team review and impact assessment
2. **Testing**: Verify in development environment with comprehensive testing
3. **Backup**: Ensure production data backup before schema changes
4. **Migration**: Create migration scripts with rollback procedures
5. **Documentation**: Update schema documentation post-deployment

**⚠️ CRITICAL**: Always backup production data before making schema changes!

### **Schema Extraction Methods**

The schema documentation supports multiple extraction methods for different use cases:

#### **API Endpoints (Recommended for Live Extraction)**
Server-side endpoints provide 100% accurate schema extraction:

```bash
# Start the server first
cd server && npm start

# Extract complete PostgreSQL schema
curl http://localhost:3060/api/schema/extract > docs/schema/current-full-schema.sql

# Extract table index with cross-references
curl http://localhost:3060/api/schema/index > docs/schema/table-index.md
```

**Features:**
- ✅ **100% Accurate**: Direct database metadata access
- ✅ **All 455 Tables**: No Supabase API restrictions
- ✅ **Server-side Processing**: Bypasses client limitations
- ✅ **Automatic Updates**: Real-time schema extraction

#### **Node.js Scripts (Local Development)**
Multiple Node.js scripts for different extraction approaches:

```bash
# Enhanced discovery (finds ~100+ accessible tables)
cd docs/schema && node simple_schema_extractor.js

# Accurate extraction (requires server-side access)
cd docs/schema && node accurate_schema_extractor.js

# Direct database connection (server directory)
cd server && node extract_schema.js
```

**Features:**
- ✅ **Flexible Options**: Multiple extraction methods
- ✅ **Backup System**: Automatic file backups
- ✅ **Progress Tracking**: Real-time status updates
- ✅ **Error Handling**: Comprehensive logging

#### **Schema Maintenance**

Schema files are generated on-demand using the API endpoints or Node.js scripts. The system includes automatic backup functionality to preserve previous versions.

**Backup System:**
- Automatic backups created before each extraction
- Stored in `docs/schema/backup/` directory
- Timestamped for easy identification
- Prevents accidental data loss

**File Generation:**
- `current-full-schema.sql` - Generated via API or scripts
- `current-full-schema_sqlite.sql` - Auto-converted from PostgreSQL
- `table-index.md` - Updated with latest table cross-references

### **Naming Conventions**

- **Tables**: snake_case, descriptive names (e.g., `procurement_orders`)
- **Columns**: snake_case, consistent across related tables
- **Indexes**: `idx_table_column` or `idx_table_columns`
- **Constraints**: `fk_table_referenced_table` for foreign keys

### **Performance Considerations**

- **Indexing Strategy**: Foreign keys and frequently queried columns indexed
- **Partitioning**: Large tables partitioned by organization/project
- **Archiving**: Historical data moved to archive tables
- **Caching**: Frequently accessed reference data cached

## 🔗 Related Documentation

### **📚 Master Documentation Guides**

| **Guide** | **Location** | **Purpose** |
|-----------|--------------|-------------|
| **Database Systems** | `docs/database-systems/0300_DATABASE_MASTER_GUIDE.md` | Database architecture, migrations, constraints |
| **Data Processing** | `docs/data-processing/0500_DATA_PROCESSING_MASTER_GUIDE.md` | ETL processes, vector search, AI analysis |
| **Application Logic** | `docs/application-logic/0100_APPLICATION_LOGIC_MASTER_GUIDE.md` | Business rules, validation, workflows |
| **External Services** | `docs/external-services/0200_EXTERNAL_SERVICES_MASTER_GUIDE.md` | API integrations, LangChain, authentication |

### **🔧 Development Resources**

- **API Documentation**: Complete REST API reference
- **Migration Scripts**: Database schema evolution procedures
- **Security Policies**: RLS implementation and access control
- **Performance Tuning**: Query optimization and indexing strategies

## 📊 Schema Evolution

### **Version History**

- **v3.1** (2026-01-16): Advanced Schema Extraction System
  - ✅ **NEW:** Complete alphabetical table index (`table-index.md`)
  - ✅ **NEW:** API endpoints for live schema extraction (`/api/schema/extract`, `/api/schema/index`)
  - ✅ **NEW:** Multiple Node.js extraction scripts with 100% accuracy
  - ✅ **NEW:** Complete PostgreSQL and SQLite schema files
  - ✅ **IMPROVED:** Cross-reference system for all 455 tables
  - ✅ **ENHANCED:** Server-side processing bypasses Supabase restrictions
  - ✅ **UPDATED:** Schema statistics and documentation timestamps

- **v3.0** (2025-12-16): Complete schema split into manageable parts
  - Split 424 tables across 3 documentation files
  - Enhanced table descriptions and relationships
  - Added comprehensive security policy documentation

- **v2.5** (2025-11-21): Procurement template system overhaul
  - Unified template management system
  - Enhanced approval workflow integration
  - Improved document variation handling

- **v2.0** (2025-10-15): Task management migration
  - Centralized task management system
  - HITL workflow integration
  - Enhanced audit trail capabilities

### **Migration Tracking**

All schema changes tracked through:
- **Migration Scripts**: Versioned database migration files
- **Documentation Updates**: Schema documentation kept current
- **Testing Procedures**: Automated schema validation
- **Rollback Plans**: Emergency recovery procedures

## 🚀 Quick Start

### **For New Developers**

1. **Review Architecture**: Start with this README and database master guide
2. **Understand Security**: Review RLS policies and access control patterns
3. **Explore Tables**: Use schema part files to understand data relationships
4. **Check Constraints**: Review foreign keys and validation rules
5. **Plan Queries**: Understand indexing and performance considerations

### **For Database Administrators**

1. **Schema Overview**: Use part files for complete table inventory
2. **Relationship Mapping**: Follow foreign key references across tables
3. **Security Audit**: Review RLS policies for compliance
4. **Performance Analysis**: Check indexes and partitioning strategies
5. **Backup Planning**: Understand data retention and archiving

---

**📝 Last Updated**: 2026-01-16T09:38:39.145Z
**🔍 Total Tables Documented**: 455
**📁 Files**: 3 schema parts + index + complete schemas
**🏗️ System**: Construct AI v3.1
