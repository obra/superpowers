# UUID Migration Execution Guide

## Overview

This guide provides step-by-step instructions for executing the UUID migration safely. The migration converts INTEGER primary keys to UUID for the `companies` and `organisations` tables, along with all related foreign key references.

**⚠️ CRITICAL: This migration requires a maintenance window and will temporarily make the database unavailable.**

## Pre-Migration Checklist

### ✅ Prerequisites
- [ ] Database backup completed
- [ ] Application maintenance mode enabled
- [ ] All users logged out
- [ ] No active transactions running
- [ ] Sufficient disk space available (estimate 2x current database size)
- [ ] Database connection established with admin privileges

### ✅ Files Required
- [ ] `sql/backup_before_migration.sql` - Creates comprehensive backups
- [ ] `sql/execute_uuid_migration.sql` - Main migration script
- [ ] `sql/rollback_uuid_migration.sql` - Emergency rollback script
- [ ] `sql/audit_uuid_structure.sql` - Post-migration validation

## Migration Execution Steps

### Step 1: Create Backup (MANDATORY)

**Option A: Using Supabase SQL Editor (Recommended)**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `sql/backup_before_migration.sql`
4. Click "Run" to execute the backup script

**Option B: Using psql command line**
```bash
# Connect to your Supabase database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Run the backup script (copy/paste contents instead of \i command)
```

**Expected Output:**
```
BACKUP COMPLETED SUCCESSFULLY
All data backed up to migration_backup schema
You can now proceed with the UUID migration
```

**⚠️ DO NOT PROCEED if backup fails or shows errors**

### Step 2: Run Pre-Migration Audit (Optional but Recommended)

```sql
\i sql/audit_uuid_structure.sql
```

This will show the current state and identify any issues before migration.

### Step 3: Execute Migration

```sql
\i sql/execute_uuid_migration.sql
```

**Expected Duration:** 15-30 minutes depending on data volume

**Expected Output Phases:**
1. **Phase 1:** Preparation and validation
2. **Phase 2:** UUID column addition
3. **Phase 3:** Temporary foreign key columns
4. **Phase 4:** Data migration
5. **Phase 5:** Constraint dropping
6. **Phase 6:** Column renaming
7. **Phase 7:** Constraint recreation
8. **Phase 8:** Index creation
9. **Phase 9:** Validation

**Success Indicators:**
- All validation checks show "✓ MATCH"
- No orphaned records found
- All UUIDs are valid format
- "MIGRATION COMPLETED SUCCESSFULLY" message

### Step 4: Post-Migration Validation

```sql
\i sql/audit_uuid_structure.sql
```

**Expected Results:**
- All primary keys should be UUID type with auto-generation
- All foreign key relationships should use matching UUID types
- No constraint violations or orphaned records

### Step 5: Application Updates

After successful database migration, update your application code:

#### API Endpoints
```javascript
// Before (INTEGER)
const companyId = 123;

// After (UUID)
const companyId = "550e8400-e29b-41d4-a716-446655440000";
```

#### Database Queries
```javascript
// Before
const company = await supabase
  .from('companies')
  .select('*')
  .eq('id', 123);

// After  
const company = await supabase
  .from('companies')
  .select('*')
  .eq('id', '550e8400-e29b-41d4-a716-446655440000');
```

#### Frontend Components
```javascript
// Update any hardcoded ID references
// Ensure UUID format validation in forms
// Update ID display formatting
```

## Rollback Procedure (Emergency Only)

If the migration fails or critical issues are discovered:

### Immediate Rollback
```sql
-- If migration is still in progress, cancel the transaction
ROLLBACK;

-- Then run the rollback script
\i sql/rollback_uuid_migration.sql
```

### Post-Migration Rollback
```sql
-- Run the rollback script
\i sql/rollback_uuid_migration.sql

-- Restore from backup if needed
-- (Follow your backup restoration procedure)
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Migration Hangs or Times Out
**Symptoms:** Script stops responding, no progress for >10 minutes
**Solution:**
```sql
-- Check for blocking queries
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Cancel if necessary and rollback
ROLLBACK;
```

#### 2. Constraint Violation Errors
**Symptoms:** Foreign key constraint errors during migration
**Solution:**
```sql
-- Check for orphaned records before migration
SELECT dt.* FROM document_types_by_discipline dt
LEFT JOIN companies c ON dt.company_id = c.id
WHERE c.id IS NULL;

-- Clean up orphaned records or fix data integrity issues
```

#### 3. UUID Generation Fails
**Symptoms:** "UUID generation failed" or NULL UUIDs
**Solution:**
```sql
-- Ensure gen_random_uuid() function is available
SELECT gen_random_uuid();

-- If not available, enable the extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### 4. Application Errors After Migration
**Symptoms:** API errors, invalid ID format errors
**Solution:**
- Update all application code to handle UUID format
- Check API endpoint parameter validation
- Update frontend ID handling and display

### Validation Queries

#### Check Migration Status
```sql
-- Verify primary key types
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('companies', 'organisations') 
AND column_name = 'id';
```

#### Check Foreign Key Integrity
```sql
-- Verify no orphaned records
SELECT 
    'document_types_by_discipline' as table_name,
    COUNT(*) as total_records,
    COUNT(c.id) as valid_references
FROM document_types_by_discipline dt
LEFT JOIN companies c ON dt.company_id = c.id;
```

#### Check UUID Format
```sql
-- Verify UUID format compliance
SELECT 
    table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuids
FROM (
    SELECT 'companies' as table_name, id::text as id FROM companies
    UNION ALL
    SELECT 'organisations', id::text FROM organisations
) t
GROUP BY table_name;
```

## Performance Monitoring

### During Migration
- Monitor CPU and memory usage
- Watch for lock contention
- Check disk space consumption
- Monitor connection count

### After Migration
- Compare query performance before/after
- Monitor application response times
- Check error rates and logs
- Validate user experience

## Success Criteria

### Technical Validation ✅
- [ ] All primary keys are UUID type with auto-generation
- [ ] All foreign key relationships use matching data types
- [ ] No orphaned records or constraint violations
- [ ] All constraints properly defined and enforced
- [ ] Indexes created and optimized

### Application Validation ✅
- [ ] All API endpoints handle UUID format correctly
- [ ] Frontend displays and processes UUIDs properly
- [ ] Document numbering system functions correctly
- [ ] User authentication and authorization work
- [ ] All CRUD operations function normally

### Performance Validation ✅
- [ ] Query performance meets baseline requirements
- [ ] Database storage usage within acceptable limits
- [ ] Application response times unchanged
- [ ] No degradation in concurrent user handling

## Post-Migration Tasks

### Immediate (Day 1)
- [ ] Enable application access
- [ ] Monitor error logs closely
- [ ] Validate critical user workflows
- [ ] Update API documentation
- [ ] Notify development team of completion

### Short-term (Week 1)
- [ ] Performance monitoring and optimization
- [ ] User feedback collection
- [ ] Additional testing of edge cases
- [ ] Cleanup migration artifacts
- [ ] Update deployment procedures

### Long-term (Month 1)
- [ ] Remove backup data (after validation period)
- [ ] Update development guidelines
- [ ] Document lessons learned
- [ ] Plan for future migrations
- [ ] Archive migration scripts

## Emergency Contacts

### Database Issues
- **DBA Team:** [Contact Information]
- **DevOps Team:** [Contact Information]

### Application Issues  
- **Development Team:** [Contact Information]
- **QA Team:** [Contact Information]

### Business Impact
- **Product Owner:** [Contact Information]
- **Project Manager:** [Contact Information]

## Migration Log Template

```
Migration Date: ___________
Start Time: ___________
End Time: ___________
Duration: ___________

Pre-Migration Checklist:
□ Backup completed
□ Maintenance mode enabled
□ Users notified

Migration Steps:
□ Step 1: Backup - Status: _____ Time: _____
□ Step 2: Audit - Status: _____ Time: _____
□ Step 3: Migration - Status: _____ Time: _____
□ Step 4: Validation - Status: _____ Time: _____
□ Step 5: App Updates - Status: _____ Time: _____

Issues Encountered:
_________________________________

Resolution Actions:
_________________________________

Final Status: SUCCESS / ROLLBACK
Notes: _________________________________
```

## Conclusion

This migration is critical for long-term system scalability and data integrity. Following this guide carefully will ensure a smooth transition to UUID primary keys while maintaining data safety and system availability.

**Remember:** When in doubt, stop and consult the team. It's better to delay than to risk data loss.
