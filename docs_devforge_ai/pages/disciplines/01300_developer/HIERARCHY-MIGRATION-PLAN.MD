# Database Hierarchy Migration Plan

## Overview

This document outlines the migration plan to implement a new database hierarchy structure and naming convention for the Simandou AI Bundle project.

### Current State
- **Hierarchy:** org/project/table
- **Naming:** 4-digit prefixes (e.g., `a_00900_doccontrol_documents`)
- **Structure:** Tables directly reference projects

### Target State
- **Hierarchy:** org/project/phase/table
- **Naming:** 5-digit prefixes (e.g., `a_00900_doccontrol_documents`)
- **Structure:** Tables reference project phases within projects

## Migration Strategy

### Phase 1: Hierarchy Implementation
1. **Create project-phase junction table**
2. **Add hierarchy columns to all existing tables**
3. **Create default hierarchy structure (org-default/proj-default)**
4. **Populate all existing records with default hierarchy**
5. **Add foreign key constraints**

### Phase 2: Naming Convention Migration
1. **Generate complete table mapping (4-digit → 5-digit)**
2. **Rename all database tables**
3. **Rename all SQL files**
4. **Update all file contents with new table names**
5. **Update application code references**

### Phase 3: Validation & Testing
1. **Verify all tables renamed correctly**
2. **Test database operations**
3. **Validate application functionality**
4. **Check for any remaining 4-digit references**

## Technical Implementation

### Default Hierarchy Structure

```sql
-- Default organisation
INSERT INTO organisations (name) VALUES ('org-default');

-- Default project
INSERT INTO projects (name, organisation_id) VALUES 
('proj-default', (SELECT id FROM organisations WHERE name = 'org-default'));

-- Project phase assignments (all standard phases for default project)
INSERT INTO project_phase_assignments (project_id, phase_id) 
SELECT 
    (SELECT id FROM projects WHERE name = 'proj-default'), 
    id 
FROM project_phases;
```

### New Table Structure

All tables will include these hierarchy columns:
- `organisation_id` → references organisations(id)
- `project_id` → references projects(id)  
- `project_phase_assignment_id` → references project_phase_assignments(id)

### Project-Phase Junction Table

```sql
CREATE TABLE project_phase_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
    custom_name VARCHAR(255), -- Org-specific terminology override
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, phase_id)
);
```

## Table Renaming Mapping

### Pattern
- **From:** `a_XXXX_*` (4-digit)
- **To:** `a_0XXXX_*` (5-digit, leading zero added)

### Examples
```
a_00102_admin → a_00102_admin
a_00200_commercial → a_00200_commercial
a_00300_construction → a_00300_construction
a_00435_contracts → a_00435_contracts
a_00825_architectural → a_00825_architectural
a_00900_doccontrol_documents → a_00900_doccontrol_documents
a_01500_hr_candidate_evaluation → a_01500_hr_candidate_evaluation
```

## Migration Scripts

### 1. `01_create_project_phase_assignments.sql`
- Creates the junction table for project-phase relationships
- Adds indexes and RLS policies

### 2. `02_add_hierarchy_columns.sql`
- Adds hierarchy columns to all existing tables
- Uses ALTER TABLE ADD COLUMN IF NOT EXISTS for safety

### 3. `03_create_default_hierarchy.sql`
- Creates org-default and proj-default entries
- Sets up default phase assignments

### 4. `04_populate_hierarchy_data.sql`
- Updates all existing records with default hierarchy references
- Ensures no NULL values in hierarchy columns

### 5. `05_add_hierarchy_constraints.sql`
- Adds foreign key constraints
- Updates RLS policies for hierarchy-based access

### 6. `06_generate_table_mapping.sql`
- Creates complete mapping of old → new table names
- Generates rename commands

### 7. `07_rename_database_tables.sql`
- Executes all table rename operations
- Logs changes for tracking

### 8. `08_update_file_references.sh`
- Scans all files for 4-digit table references
- Updates SQL files, JavaScript, configuration files
- Renames SQL files to match new convention

### 9. `09_validation_checks.sql`
- Verifies all tables exist with new names
- Checks data integrity
- Validates foreign key relationships

### 10. `rollback_complete.sql`
- Emergency rollback for entire migration
- Restores original state if needed

## Execution Steps

### Pre-Migration
1. **Backup database:** Full backup before starting
2. **Document current state:** List all existing tables
3. **Prepare rollback:** Ensure rollback scripts are ready

### Migration Execution
```bash
# Phase 1: Hierarchy Implementation
psql -f 01_create_project_phase_assignments.sql
psql -f 02_add_hierarchy_columns.sql
psql -f 03_create_default_hierarchy.sql
psql -f 04_populate_hierarchy_data.sql
psql -f 05_add_hierarchy_constraints.sql

# Phase 2: Naming Convention
psql -f 06_generate_table_mapping.sql
psql -f 07_rename_database_tables.sql
bash 08_update_file_references.sh

# Phase 3: Validation
psql -f 09_validation_checks.sql
```

### Post-Migration
1. **Test application:** Verify all functionality works
2. **Check references:** Ensure no 4-digit references remain
3. **Update documentation:** Reflect new structure

## Rollback Plan

### Emergency Rollback
```bash
# If migration fails at any point
psql -f rollback_complete.sql
```

### Partial Rollback Options
- **Hierarchy only:** Remove hierarchy columns, keep naming
- **Naming only:** Revert table names, keep hierarchy
- **Complete revert:** Restore from backup

## Change Tracking

### Tables Modified
- All `a_XXXX_*` tables (estimated 50+ tables)
- New `project_phase_assignments` table
- Updated `active_entities` table

### Files Modified
- All SQL files in `/sql/` directory
- Application code with table references
- Configuration files
- Documentation files

### References Updated
- Database table names
- SQL file names and contents
- JavaScript/TypeScript imports
- Configuration settings
- RLS policies

## Validation Checklist

### Database Validation
- [ ] All tables renamed to 5-digit format
- [ ] All hierarchy columns added
- [ ] All foreign key constraints working
- [ ] All existing data preserved
- [ ] RLS policies updated and functional

### Application Validation
- [ ] All table references updated in code
- [ ] No 4-digit references remain
- [ ] Application loads without errors
- [ ] CRUD operations work correctly
- [ ] User permissions function properly

### File System Validation
- [ ] All SQL files renamed
- [ ] All file contents updated
- [ ] No broken file references
- [ ] Documentation updated

## Risk Mitigation

### Low Risk (Dev Environment)
- Can rebuild from scratch if needed
- No production data at risk
- Fast iteration and fixes possible

### Safety Measures
- Complete backup before starting
- Rollback scripts prepared
- Step-by-step execution with validation
- Change tracking for audit trail

## Success Criteria

### Technical Success
1. All tables follow new naming convention (5-digit)
2. All records have proper hierarchy references
3. Application functions without errors
4. No 4-digit references remain in codebase

### Functional Success
1. Users can access data through new hierarchy
2. Filtering by org/project/phase works
3. Data integrity maintained
4. Performance not degraded

## Timeline (Dev Mode)

- **Phase 1:** 15 minutes (hierarchy implementation)
- **Phase 2:** 20 minutes (table/file renaming)
- **Phase 3:** 10 minutes (validation & fixes)
- **Total:** ~45 minutes

## Notes

- Migration designed for development environment
- Aggressive approach suitable for dev mode
- Can fix issues on-the-fly
- Complete rebuild possible if needed
- All existing records will use org-default/proj-default hierarchy

---

**Migration Status:** Ready for execution
**Last Updated:** 2025-01-17
**Environment:** Development
