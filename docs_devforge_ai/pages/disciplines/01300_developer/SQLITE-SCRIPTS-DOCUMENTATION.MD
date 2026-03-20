# 0305 SQLite-First Development Workflow Scripts

## Overview

This directory contains the complete set of scripts for implementing SQLite-First development workflow across 300+ Supabase tables. These scripts enable:

- **PostgreSQL → SQLite Schema Conversion** - Type-safe conversion with validation
- **Automatic Migration Generation** - Compare schemas and generate deployment-safe migrations
- **One-Click Setup** - Initialize SQLite-First development environment
- **Schema Drift Monitoring** - Automatic detection of environment inconsistencies

## 🔄 Workflow Scripts

### 1. Schema Conversion (`0305_schema_converter.js`)

**Purpose:** Convert PostgreSQL DDL to SQLite-compatible format

**Features:**
- Handles 300+ table schema conversion
- Type mapping (UUID→TEXT, SERIAL→AUTOINCREMENT, etc.)
- Default value conversion (gen_random_uuid(), NOW(), etc.)
- Constraint and index preservation
- Comprehensive conversion statistics

**Usage:**
```bash
# Convert exported PostgreSQL schema to SQLite
node scripts/0305_sqlite_workflow/0305_schema_converter.js production_schemas.sql

# Specify output file
node scripts/0305_sqlite_workflow/0305_schema_converter.js input.sql output.sql
```

**What it converts:**
- `uuid` → `TEXT`
- `serial` → `INTEGER`
- `timestamptz` → `TEXT`
- `jsonb` → `TEXT`
- `gen_random_uuid()` → SQLite-compatible UUID generation

### 2. Migration Generator (`0305_migration_generator.js`)

**Purpose:** Compare SQLite development schemas with Supabase production and generate safe migrations

**Features:**
- Analyzes schema changes between environments
- Generates PostgreSQL-compatible migration scripts
- Validates migration safety (no dangerous operations)
- Supports new tables, column additions, and modifications
- Automatic backup recommendations

**Usage:**
```bash
# Generate migration from current SQLite schema
node scripts/0305_sqlite_workflow/0305_migration_generator.js

# Output: migrations/migration_20250101143000_safe.sql
```

**Safety Features:**
- Blocks `DROP TABLE` and `DROP COLUMN` operations
- Validates column modifications
- Requires manual review for complex changes
- Adds metadata headers with safety status

### 3. Development Setup (`0305_development_setup.js`)

**Purpose:** One-time setup of SQLite-First development environment

**Features:**
- Exports 300+ table schemas from Supabase
- Converts schemas to SQLite format
- Creates development database
- Configures environment files
- Validates complete setup
- Generates documentation

**Usage:**
```bash
# Run one-time setup (requires Supabase credentials)
node scripts/0305_sqlite_workflow/0305_development_setup.js
```

**Setup Process:**
1. Export production schemas (schema-only, no data)
2. Convert PostgreSQL → SQLite format
3. Create SQLite development database
4. Configure `.env.development` and `.env.demo`
5. Update `package.json` scripts
6. Validate all components
7. Generate setup documentation

## 🔧 Development Workflow Scripts

### Package.json Scripts

The setup automatically adds these convenience scripts:

#### Unified Cache-Aware Commands ⭐ (Recommended)
One-command solutions combining environment + cache clearing:

```bash
# 🚀 One-command SQLite development (environment + cache + server)
npm run dev:sqlite:fresh    # Recommended for daily use

# 🧪 One-command demo environment (environment + cache + server)
npm run dev:demo:fresh      # Demo data testing

# 🔒 One-command production preview (cache clearing, read-only)
npm run dev:prod:fresh      # Production code with local cache
```

#### Traditional Development Commands
Separate environment control:

```bash
# Development environments
npm run dev:sqlite     # Development with SQLite (fast, 300+ tables)
npm run dev:demo       # Demo environment (Supabase demo data)
npm run dev:prod       # Production environment (Supabase live data)

# Environment switching (quick, no cache clearing)
npm run switch:sqlite  # Switch to SQLite environment
npm run switch:demo    # Switch to demo environment
```

#### SQLite-First Workflow Commands
Core workflow tools:

```bash
# Setup & management
npm run sqlite:setup   # Run one-time SQLite-First setup
npm run sqlite:migrate # Generate production migrations
npm run sqlite:convert # Convert PostgreSQL → SQLite schemas
```

## 📁 File Organization

```
scripts/0305_sqlite_workflow/
├── README.md                          # This documentation
├── 0305_schema_converter.js          # PostgreSQL → SQLite conversion
├── 0305_migration_generator.js       # Migration generation
├── 0305_development_setup.js         # One-time setup orchestration
└── [future_scripts...]
```

## 🔒 Safety & Validation

### Migration Safety Checks
- Blocks destructive operations (`DROP TABLE`, `DROP COLUMN`)
- Validates column type changes
- Requires manual review for complex modifications
- Generates safety metadata headers

### Environment Protection
- Automatic backups before modifications
- Read-only validation for production operations
- Environment-specific permission controls

### Schema Drift Monitoring
- Automatic comparison between environments
- Warning alerts for inconsistencies
- Health check scripts for ongoing monitoring

## 📊 Data Handling

### Schema-Only Operations
- **EXPORT:** Only table structures (no data)
- **CONVERSION:** Type mappings and constraint preservation
- **MIGRATION:** Structure changes only (ALTER TABLE, CREATE TABLE)
- **VALIDATION:** Structure integrity checks

### Data Safety Guarantee
- Development data stays in SQLite
- Production data untouched during migrations
- Environment isolation prevents data mixing
- Backup requirements for all schema changes

## 🧪 Testing & Validation

### Setup Validation
```javascript
// Automatic checks after setup
- SQLite database accessibility (300+ tables)
- Environment file creation
- Package.json script modifications
- Schema export and conversion success
- Development server compatibility
```

### Migration Validation
```javascript
// Pre-migration safety checks
- No DROP TABLE operations
- Column modification complexity assessment
- Foreign key constraint preservation
- Default value compatibility
- Index recreation requirements
```

## 📚 Documentation Integration

### Automatic Documentation
- Setup logs saved to `schemas/setup_log.json`
- Human-readable docs generated as `docs/0305_SQLITE_SETUP_LOG.md`
- Migration history tracked in `migrations/` directory
- Environment switching documented in cache prevention guide

### Manual Documentation Updates
- `docs/0305_SQLITE_FIRST_WORKFLOW.md` - Complete workflow guide
- `docs/0010_CACHE_PREVENTION_GUIDE.md` - SQLite-specific cache issues
- `docs/0000_DOCUMENTATION_GUIDE.md` - Table inventory tracking

## 🔧 Troubleshooting

### Schema Conversion Issues
```bash
# If pg_dump fails
- Check Supabase credentials: echo $DATABASE_URL
- Verify pg_dump installation: which pg_dump
- Check SSL settings: DATABASE_URL ssl requirements

# If SQLite import fails
- Check file permissions: chmod 644 *.sql
- Verify SQLite installation: sqlite3 --version
- Check disk space: df -h
```

### Migration Generation Issues
```bash
# If schema comparison fails
- Check database accessibility: sqlite3 database.db ".tables" | wc -l
- Verify environment variables: echo $NODE_ENV
- Check Supabase connection: psql $DATABASE_URL -c "SELECT 1"

# If validation fails
- Review error messages in migration file headers
- Check for unsupported schema changes
- Consider breaking complex migrations into smaller, safer steps
```

### Development Setup Issues
```bash
# If setup fails early
- Check Supabase access permissions
- Verify required environment variables
- Ensure schemas/ directory is writable: mkdir -p schemas

# If conversion fails
- Check input file size: ls -la schemas/*.sql
- Verify output file creation: ls -la schemas/*_sqlite.sql
- Use alternative export method if pg_dump unavailable
```

## 🎯 Usage by Role

### For Developers (Daily Use)
```bash
# Start development
npm run dev:sqlite

# Make schema changes in SQLite
# Test locally
npm run test

# Generate migration when ready
npm run sqlite:migrate
```

### For DevOps/Team Leads (Deployment)
```bash
# Review migration before deployment
cat migrations/migration_YYYYMMDDHHMM_safe.sql

# Deploy with migration
# [Your deployment process]
```

### For New Team Members (Onboarding)
```bash
# One-time environment setup
npm run sqlite:setup

# Learn the workflow
cat docs/0305_SQLITE_FIRST_WORKFLOW.md
```

## 🔄 Upgrade Path

### Version Compatibility
- Scripts designed for concurrent use with existing Supabase workflows
- Safe to run alongside current production operations
- Can be disabled by removing package.json scripts if needed

### Feature Evolution
- Migration scripts can be enhanced with new safety features
- Schema conversion can handle additional PostgreSQL features
- Monitoring can be expanded with automated alerting

---

**These scripts provide the complete infrastructure for safe SQLite-First development across your 300+ table enterprise application.** 🚀
