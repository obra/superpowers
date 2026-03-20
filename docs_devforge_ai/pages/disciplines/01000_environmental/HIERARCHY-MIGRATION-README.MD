# Database Hierarchy Migration

## Overview

This migration implements a new database hierarchy structure and naming convention for the Simandou AI Bundle project.

### Changes Implemented

**Hierarchy Structure:**
- **From:** org/project/table
- **To:** org/project/phase/table

**Naming Convention:**
- **From:** 4-digit prefixes (e.g., `a_00900_doccontrol_documents`)
- **To:** 5-digit prefixes (e.g., `a_00900_doccontrol_documents`)

## Migration Components

### Documentation
- `docs/HIERARCHY_MIGRATION_PLAN.md` - Comprehensive migration plan
- `HIERARCHY_MIGRATION_README.md` - This file with execution instructions

### SQL Scripts
1. `sql/01_create_project_phase_assignments.sql` - Creates project-phase junction table
2. `sql/02_add_hierarchy_columns.sql` - Adds hierarchy columns to all tables
3. `sql/03_create_default_hierarchy.sql` - Creates default hierarchy structure
4. `sql/04_populate_hierarchy_data.sql` - Populates existing records with defaults
5. `sql/05_add_hierarchy_constraints.sql` - Adds constraints and updates RLS policies
6. `sql/06_generate_table_mapping.sql` - Generates 4-digit to 5-digit mapping
7. `sql/07_rename_database_tables.sql` - Renames all database tables
8. `sql/08_update_file_references.sh` - Updates all file references
9. `sql/09_validation_checks.sql` - Comprehensive validation
10. `sql/rollback_complete.sql` - Complete rollback script

### Execution Scripts
- `run_hierarchy_migration.sh` - Master execution script

## Prerequisites

### System Requirements
- PostgreSQL client (`psql`) installed and accessible
- Bash shell (macOS/Linux)
- Database connection with admin privileges
- Backup of your database (recommended)

### Environment Setup
Set your database connection string:
```bash
export DB_CONNECTION="postgresql://user:password@host:port/database"
```

Or modify the script directly with your connection details.

## Execution Instructions

### Option 1: Render Environment (Recommended for Production)

For Render deployments with environment variables already configured:

```bash
./run_migration_render.sh
```

This Render-specific script will:
- Automatically detect Supabase configuration from environment variables
- Use your existing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Handle database connection setup automatically
- Execute all migration steps without manual intervention
- Provide detailed status updates
- Run comprehensive validation

**Prerequisites for Render:**
- SUPABASE_URL set in Render environment variables
- SUPABASE_SERVICE_ROLE_KEY set in Render environment variables
- You'll be prompted for the database password (cannot be stored in environment for security)

### Option 2: Local/Manual Execution

Run the master script that handles everything:

```bash
./run_hierarchy_migration.sh
```

This script will:
- Perform pre-flight checks
- Show migration plan summary
- Request confirmation at each phase
- Execute all migration steps
- Provide detailed status updates
- Run comprehensive validation

### Option 2: Manual Step-by-Step Execution

If you prefer to run each step manually:

```bash
# Phase 1: Hierarchy Implementation
psql "$DB_CONNECTION" -f sql/01_create_project_phase_assignments.sql
psql "$DB_CONNECTION" -f sql/02_add_hierarchy_columns.sql
psql "$DB_CONNECTION" -f sql/03_create_default_hierarchy.sql
psql "$DB_CONNECTION" -f sql/04_populate_hierarchy_data.sql
psql "$DB_CONNECTION" -f sql/05_add_hierarchy_constraints.sql

# Phase 2: Naming Convention Migration
psql "$DB_CONNECTION" -f sql/06_generate_table_mapping.sql
psql "$DB_CONNECTION" -f sql/07_rename_database_tables.sql
bash sql/08_update_file_references.sh

# Phase 3: Validation
psql "$DB_CONNECTION" -f sql/09_validation_checks.sql
```

## What the Migration Does

### Database Changes

1. **Creates New Tables:**
   - `project_phase_assignments` - Junction table linking projects to phases

2. **Adds Hierarchy Columns to All `a_XXXX_*` Tables:**
   - `organisation_id` → references organisations(id)
   - `project_id` → references projects(id)
   - `project_phase_assignment_id` → references project_phase_assignments(id)

3. **Creates Default Hierarchy:**
   - Organisation: `org-default`
   - Project: `proj-default`
   - Phase assignments for all standard phases

4. **Populates Data:**
   - All existing records assigned to default hierarchy
   - Ensures no NULL values in hierarchy columns

5. **Renames Tables:**
   - `a_0900_*` → `a_00900_*`
   - `a_1500_*` → `a_01500_*`
   - `a_2025_*` → `a_02025_*`
   - etc.

### File System Changes

1. **SQL Files Renamed:**
   - `create_a_0900_*.sql` → `create_a_00900_*.sql`
   - `match_a_0900_*.sql` → `match_a_00900_*.sql`

2. **References Updated in:**
   - All SQL files
   - JavaScript/TypeScript files
   - JSON configuration files
   - Documentation files

## Validation

The migration includes comprehensive validation that checks:

- ✅ Default hierarchy structure exists
- ✅ All tables renamed to 5-digit format
- ✅ No 4-digit tables remain
- ✅ Hierarchy columns added to all tables
- ✅ Data populated with default hierarchy
- ✅ Foreign key constraints working
- ✅ RLS policies updated
- ✅ File references updated

## Rollback

If you need to rollback the migration:

```bash
psql "$DB_CONNECTION" -f sql/rollback_complete.sql
```

**Warning:** Rollback will:
- Rename tables back to 4-digit format
- Remove all hierarchy columns
- Delete default hierarchy data
- Remove project-phase assignments table
- You'll need to manually revert file references

## Post-Migration Steps

### 1. Test Your Application
- Verify all functionality works
- Check database operations
- Test user permissions

### 2. Update Remaining References
- Check for any hardcoded table names
- Update application configuration
- Review API endpoints

### 3. Create Proper Hierarchy
Replace the default hierarchy with your actual structure:

```sql
-- Create your actual organisations
INSERT INTO organisations (name, description) VALUES 
('Your Company', 'Main organisation');

-- Create your actual projects
INSERT INTO projects (name, organisation_id, description) VALUES 
('Project Alpha', org_id, 'Description');

-- Create project-specific phase assignments
INSERT INTO project_phase_assignments (project_id, phase_id, custom_name) 
VALUES (project_id, phase_id, 'Custom Phase Name');
```

### 4. Update User Assignments
Move users from default hierarchy to actual hierarchy:

```sql
-- Update active_entities with proper hierarchy
UPDATE active_entities 
SET organisation_id = actual_org_id,
    project_id = actual_project_id,
    project_phase_id = actual_phase_id
WHERE user_id = specific_user_id;
```

## Troubleshooting

### Common Issues

**Database Connection Failed:**
- Check your connection string
- Verify database credentials
- Ensure database is accessible

**Permission Denied:**
- Ensure user has admin privileges
- Check RLS policies aren't blocking operations

**Table Already Exists:**
- Migration may have been partially run
- Check validation output
- Consider rollback and retry

**File Reference Update Failed:**
- Check file permissions
- Verify backup directory creation
- Review shell script output

### Getting Help

1. **Check Validation Output:**
   ```bash
   psql "$DB_CONNECTION" -f sql/09_validation_checks.sql
   ```

2. **Review Migration Logs:**
   - Check `migration_rename_log` table
   - Review `migration_validation_results` table

3. **Manual Verification:**
   ```sql
   -- Check table names
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'a_%' ORDER BY table_name;
   
   -- Check hierarchy columns
   SELECT table_name, column_name FROM information_schema.columns 
   WHERE column_name IN ('organisation_id', 'project_id', 'project_phase_assignment_id');
   ```

## Migration Timeline

**Estimated Duration:** 45 minutes (dev environment)

- **Phase 1:** 15 minutes (hierarchy implementation)
- **Phase 2:** 20 minutes (table/file renaming)
- **Phase 3:** 10 minutes (validation & testing)

## Safety Features

- ✅ Complete backup before starting
- ✅ Rollback scripts prepared
- ✅ Step-by-step execution with validation
- ✅ Change tracking for audit trail
- ✅ Comprehensive error handling
- ✅ Pre-flight checks

## Support

For issues or questions:
1. Review the detailed migration plan: `docs/HIERARCHY_MIGRATION_PLAN.md`
2. Check validation results
3. Use rollback if necessary
4. Contact development team

---

**Migration Status:** Ready for execution  
**Last Updated:** 2025-01-17  
**Environment:** Development
