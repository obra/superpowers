# 0305_SQLITE_FIRST_WORKFLOW.md

## Status
- [x] Workflow designed
- [ ] Initial schema conversion completed
- [ ] Development environment activated
- [ ] First feature migrated to production
- [ ] Team trained on workflow

## Version History
- v1.0 (2025-01-XX): Initial SQLite-First development workflow for 300+ table schema management

## Overview

**SQLite-First Development Workflow** enables rapid development using local SQLite database while safely managing synchronization with production Supabase. This approach treats SQLite as the primary development environment and Supabase as production hosting, providing instant queries across all 300+ tables while maintaining data safety.

### **Core Philosophy**
- **Development Speed**: All changes happen on fast local SQLite
- **Production Safety**: Supabase data remains untouched during development
- **Controlled Migration**: Schema changes are deliberate and approved
- **Environment Clarity**: Clear separation between dev/demo/production

### **One-Command Development** ⭐
**Eliminate complex environment management with unified cache-aware commands:**

```bash
# 🚀 SQLite development with cache clearing (recommended for daily use)
npm run dev:sqlite:fresh    # Environment + cache + server in one command

# 🧪 Demo environment with cache clearing
npm run dev:demo:fresh      # Demo data + cache + server

# 📦 Production environment (cache clearing, read-only)
npm run dev:prod:fresh      # Production preview

# 🏃 Quick environment switching (no cache clearing)
npm run switch:sqlite       # Switch to SQLite dev
npm run switch:demo         # Switch to Supabase demo
```

## 🎯 Workflow Architecture

### **Three-Environment Approach**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │      Demo       │    │  Production     │
│    (SQLite)     │    │   (Supabase     │    │   (Supabase     │
│                 │    │     Demo DB)    │    │     Prod DB)    │
│ • 300+ tables   │    │                 │    │                 │
│ • Instant dev   │    │ • Client demos   │    │ • Live app      │
│ • Fast queries  │◄───│ • Testing env    │◄───│ • User data     │
│ • Schema work   │╮   │ • Feature tests  │╮   │ • Real traffic  │
└─────────────────┘│   └─────────────────┘│   └─────────────────┘
                   │                      │
                   └─────────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ Schema Migration Only  │
                    │ • DDL changes          │
                    │ • Structure updates    │
                    │ • No data copying      │
                    └─────────────────────────┘
```

### **Database Selection Logic**

```javascript
// server/src/config/database.js
const getDatabase = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return new sqlite3.Database('./database.db');  // Fast, local, full permissions

    case 'demo':
      return createSupabaseClient({
        url: process.env.DEMO_SUPABASE_URL,
        key: process.env.DEMO_SUPABASE_KEY
      });  // Existing demo data for presentations

    case 'production':
    default:
      return createSupabaseClient({
        url: process.env.PROD_SUPABASE_URL,
        key: process.env.PROD_SUPABASE_KEY
      });  // Live user data and systems
  }
};
```

## 📋 Initial Setup Process

### **Phase 1: PostgreSQL Schema Export**

```bash
# Export all 300+ table schemas (structure only, no data)
pg_dump --schema-only --no-owner --schema=public \
  --host=$SUPABASE_HOST --dbname=postgres --username=postgres \
  > production_schemas_$(date +%Y%m%d).sql

# Verify export completeness
grep "CREATE TABLE" production_schemas_20250101.sql | wc -l
# Should show 300+ tables
```

### **Phase 2: PostgreSQL to SQLite Conversion**

```bash
# Convert PostgreSQL DDL to SQLite-compatible format
node scripts/0305_schema_converter.js production_schemas_20250101.sql > sqlite_schemas.sql

# Key conversions:
# • UUID → TEXT with CHECK constraints
# • SERIAL → INTEGER AUTOINCREMENT
# • TIMESTAMPTZ → TEXT (ISO format)
# • JSONB → TEXT (JSON string)
```

### **Phase 3: SQLite Development Database Creation**

```bash
# Import all schemas to SQLite
sqlite3 database.db < sqlite_schemas.sql

# Post-import verification
sqlite3 database.db ".tables" | wc -l          # Should show 300+
sqlite3 database.db "PRAGMA table_count;"      # Alternative check
sqlite3 database.db ".schema" | head -20       # Verify structure
```

### **Phase 4: Development Environment Activation**

```bash
# Set environment for SQLite development
export NODE_ENV=development
export DATABASE_STRATEGY=sqlite

# Start development server
npm run dev:fresh  # Forces schema cache refresh

# Verify database connection
curl http://localhost:3060/api/health
# Should show: {"database":"sqlite","tables":312,"status":"ready"}
```

## 🚀 Development Workflow

### **Daily Development Cycle**

#### **1. Start Development (Morning)**
```bash
# 🚀 Recommended: One-command environment + cache setup
npm run dev:sqlite:fresh  # SQLite + cache clearing + server

# Alternative: Separate commands if needed
npm run switch:sqlite     # Environment switch only
npm run dev               # Server with SQLite
```

#### **2. Schema Development (As Needed)**
```javascript
// In development code, safely modify SQLite tables
await db.run(`
  ALTER TABLE projects ADD COLUMN new_feature_enabled BOOLEAN DEFAULT false
`);

// TEST: Verify the change works locally
const result = await db.get('SELECT new_feature_enabled FROM projects LIMIT 1');
console.log('Schema change verified:', result);
```

#### **3. Feature Testing (Throughout Day)**
```javascript
// Insert test data for feature validation
await db.run(`
  INSERT INTO projects (name, new_feature_enabled)
  VALUES ('Test Project Alpha', true), ('Test Project Beta', false)
`);

// Query across all 300+ tables for validation
const complexQuery = await db.all(`
  SELECT p.name, COUNT(t.id) as tasks
  FROM projects p
  LEFT JOIN tasks t ON p.id = t.project_id
  WHERE p.new_feature_enabled = ?
  GROUP BY p.id, p.name
`, [true]);
```

#### **4. Commit Schema Changes (End of Day)**
```bash
# Generate migration script for production
node scripts/0305_migration_tracker.js > migrations/feature_xyz_$(date +%Y%m%d).sql

# Commit with clear description
git add migrations/feature_xyz_20250101.sql
git commit -m "feat: Add new_feature_enabled column to projects table

- Schema change: ALTER TABLE projects ADD COLUMN new_feature_enabled BOOLEAN DEFAULT false
- Migration file: migrations/feature_xyz_20250101.sql
- Tested in SQLite environment with sample data
- Ready for production deployment
- Related to ticket: PROJECT-123"
```

### **Environment Switching**

#### **Demo Testing**
```bash
# Switch to demo environment (existing demo data)
export NODE_ENV=demo
npm run dev:fresh

# Test new features with demo data (careful - don't modify!)
curl http://localhost:3060/api/projects  # Returns demo data
```

#### **Production Migration**
```bash
# Apply schema changes to production
node scripts/0500_migration_applicator.js migrations/feature_xyz_20250101.sql

# Switch to production for final verification
NODE_ENV=production npm run build
# Deploy and verify - production data intact, new schema active
```

## 📊 Schema Synchronization

### **Migration Types**

#### **1. Safe DDL Changes (Automatic)**
```sql
-- These can be applied automatically with validation
ALTER TABLE projects ADD COLUMN description TEXT;
ALTER TABLE tasks ADD COLUMN priority INTEGER DEFAULT 1;
CREATE INDEX idx_projects_status ON projects(status);
```

#### **2. Data-Aware Changes (Manual Review)**
```sql
-- These require manual approval and data verification
ALTER TABLE tasks DROP COLUMN deprecated_field;
ALTER TABLE projects RENAME COLUMN old_name TO new_name;
-- ⚠️ May cause data loss - verify with SELECT first
```

#### **3. Breaking Changes (Development Team Review)**
```sql
-- These require full team review and rollback planning
DROP TABLE old_unused_table;
ALTER TABLE core_table MODIFY COLUMN id REFERENCES new_table(id);
-- ⚠️ Affects other systems - coordinate with team
```

### **Migration Validation**

#### **Pre-Migration Checks**
```javascript
// scripts/0305_pre_migration_validator.js
const validateMigration = (migrationSQL) => {
  const checks = [
    { test: /DROP TABLE/i, severity: 'HIGH', message: 'Table deletion detected' },
    { test: /DROP COLUMN/i, severity: 'HIGH', message: 'Column deletion detected' },
    { test: /TRUNCATE/i, severity: 'CRITICAL', message: 'Data truncation detected' },
    // Additional safety checks...
  ];

  checks.forEach(check => {
    if (check.test.test(migrationSQL)) {
      console.warn(`🚨 ${check.severity}: ${check.message}`);
    }
  });
};
```

#### **Post-Migration Verification**
```bash
# Verify production table structure matches development
node scripts/0305_post_migration_verifier.js

# Output:
# ✅ projects table: new_feature_enabled column added
# ✅ tasks table: priority column added with default values
# ✅ All constraints and indexes intact
# ✅ No data loss detected
```

## 🔒 Safety Mechanisms

### **Environment Lockouts**

```javascript
// Prevent accidental production modifications
const enforceEnvironmentSafety = () => {
  if (process.env.NODE_ENV === 'production') {
    // Block DDL operations in production runtime
    db.on('query', (query) => {
      if (query.includes('ALTER TABLE') || query.includes('CREATE TABLE')) {
        throw new Error('DDL operations blocked in production. Use migration scripts.');
      }
    });
  }

  if (process.env.NODE_ENV === 'demo') {
    // Read-only mode for demo environment
    db.on('query', (query) => {
      const writeOperations = ['INSERT', 'UPDATE', 'DELETE', 'ALTER', 'CREATE', 'DROP'];
      if (writeOperations.some(op => query.includes(op))) {
        throw new Error('Write operations blocked in demo environment.');
      }
    });
  }
};
```

### **Backup Requirements**

```bash
# Mandatory backups before any schema changes
./scripts/0305_backup_manager.js --environment=production --type=full
# Output: backup_production_20250101_143000.sql created (2.3GB)

# Verify backup integrity
node scripts/0305_backup_validator.js backup_production_20250101_143000.sql
# Output: ✅ Backup valid, 312 tables, 1.2M rows verified
```

## 📈 Monitoring & Health Checks

### **Schema Drift Detection**

```bash
# Automated daily checks
node scripts/0305_schema_drift_monitor.js

# Output example:
# 📊 Schema Status Report - 2025-01-XX
# ✅ Development SQLite: 312 tables, schema hash: abc123
# ✅ Demo Supabase: 312 tables, schema hash: abc123
# ✅ Production Supabase: 312 tables, schema hash: abc123
# 🔍 No schema drift detected
```

### **Performance Monitoring**

```javascript
// scripts/0305_performance_monitor.js
const monitorPerformance = async () => {
  const queries = [
    { name: 'Project List', sql: 'SELECT * FROM projects LIMIT 100' },
    { name: 'Complex Join', sql: 'SELECT p.*, COUNT(t.id) as task_count FROM projects p LEFT JOIN tasks t ON p.id = t.project_id GROUP BY p.id' },
    // Additional performance tests...
  ];

  queries.forEach(async query => {
    const start = Date.now();
    await db.all(query.sql);
    const duration = Date.now() - start;
    console.log(`${query.name}: ${duration}ms ${duration < 100 ? '✅' : '⚠️'}`);
  });
};
```

## 🎯 Best Practices

### **Development Guidelines**

#### **1. Always Use Development Environment for Schema Changes**
```bash
# ❌ Never modify production schema directly
# psql production-db -c "ALTER TABLE live_table ADD COLUMN bad_idea"

# ✅ Always develop in SQLite first
NODE_ENV=development npm run dev
# Make your changes, test thoroughly, then migrate properly
```

#### **2. Test Migrations on Demo First**
```bash
# Test migration on demo environment (safe, similar data)
NODE_ENV=demo node scripts/0305_migration_applicator.js my_migration.sql

# Verify it works with demo data
curl http://localhost:3060/api/projects

# Only then apply to production
NODE_ENV=production node scripts/0305_migration_applicator.js my_migration.sql
```

#### **3. Commit Migration Scripts with Code**
```bash
# ✅ Good practice
git add migrations/add_user_preferences_20250101.sql
git add -A # Include code changes
git commit -m "feat: Add user preferences system

- Database migration: migrations/add_user_preferences_20250101.sql
- Schema: user_preferences table with 8 columns
- Default values: theme='light', timezone='UTC'
- Indexes: user_id, preference_key
- Tested: SQLite dev + demo environment
- Safe: No existing data impact
- Rollback: DROP TABLE user_preferences"

# ❌ Avoid
git commit -m "quick db change, will fix later"
```

### **Team Coordination**

#### **Communication Protocol**

**Before Schema Changes:**
```
Subject: DB Schema Change - [Table Name] - [Developer] - [Date]

Body:
- Table(s) affected: projects, tasks
- Change type: ADD COLUMN (safe)
- Rationale: Supporting new feature XYZ
- Impact assessment: No existing data affected
- Testing plan: Tested locally, will test on demo
- Rollback plan: ALTER TABLE projects DROP COLUMN new_column
- Approval needed: Schema Review Team
```

**After Schema Changes:**
```
Subject: ✅ DB Schema Change Complete - [Table Name]

Body:
- Status: Successfully applied to production
- Migration file: migrations/feature_xyz_20250101.sql
- Verification: All tests passing
- Rollback ready: Available if needed
- Documentation: Updated in 0305_SQLITE_FIRST_WORKFLOW.md
```

## 🔄 Migration Examples

### **Example 1: Adding Feature Flag (Low Risk)**
```bash
# Develop in SQLite
sqlite3 database.db "ALTER TABLE projects ADD COLUMN beta_feature BOOLEAN DEFAULT false;"

# Test locally
npm run test:integration

# Generate migration
node scripts/0305_migration_generator.js > migrations/beta_feature_20250101.sql

# Apply to demo for testing
NODE_ENV=demo npm run dev
node scripts/0500_demo_migrator.js migrations/beta_feature_20250101.sql

# Apply to production
NODE_ENV=production node scripts/0500_migration_applicator.js migrations/beta_feature_20250101.sql
```

### **Example 2: Adding New Table (Medium Risk)**
```bash
# Create in SQLite
sqlite3 database.db << 'EOF'
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
EOF

# Populate with test data
# ... development testing ...

# Migration process (same as above)
```

## 📚 Related Documentation

- **[0305_SQLITE_SCHEMA_CONVERSION.md](0305_SQLITE_SCHEMA_CONVERSION.md)** - PostgreSQL to SQLite conversion tools
- **[0305_SQLITE_MIGRATION_TOOLS.md](0305_SQLITE_MIGRATION_TOOLS.md)** - Migration scripts and utilities
- **[0305_SQLITE_DEVELOPMENT_ENVIRONMENT.md](0305_SQLITE_DEVELOPMENT_ENVIRONMENT.md)** - Development setup and activation
- **[0500_SUPABASE_DEMO_ENVIRONMENT.md](0500_SUPABASE_DEMO_ENVIRONMENT.md)** - Demo environment management
- **[0500_SUPABASE_PRODUCTION_DEPLOYMENT.md](0500_SUPABASE_PRODUCTION_DEPLOYMENT.md)** - Production deployment guidelines
- **[0010_CACHE_PREVENTION_GUIDE.md](0010_CACHE_PREVENTION_GUIDE.md)** - Cache issues with SQLite-First workflow

## 📈 Success Metrics

### **Performance Targets**
- **Schema Sync Time**: < 5 minutes for 300+ tables
- **Migration Validation**: < 2 minutes per migration script
- **Development Query Speed**: < 10ms for complex joins
- **Environment Switch Time**: < 30 seconds

### **Quality Targets**
- **Zero Data Loss**: All migrations preserve existing data
- **100% Schema Consistency**: All environments identical structure
- **Zero Downtime**: Production deployments don't interrupt service
- **Complete Test Coverage**: All migrations verified in staging

### **Team Productivity**
- **Development Speed**: 3x faster schema development workflows
- **Error Reduction**: 80% fewer deployment-related schema issues
- **Onboarding**: New developers productive within 1 day
- **Maintenance**: Schema changes tracked and auditable

## 🎯 Next Steps

### **Immediate (This Week)**
1. Export current production schema
2. Set up SQLite conversion pipeline
3. Create development environment
4. Test first feature migration

### **Short Term (This Month)**
1. Migrate development team to SQLite-First
2. Establish migration approval workflow
3. Set up automated monitoring
4. Train team on new processes

### **Long Term (3-6 Months)**
1. Optimize schema synchronization performance
2. Implement advanced migration diffing
3. Create visual schema management UI
4. Establish enterprise-grade rollback procedures

---

**This SQLite-First workflow transforms your 300+ table schema management from a bottleneck to a competitive advantage. Development velocity increases while maintaining production safety and data integrity.** 🚀
