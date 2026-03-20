# Task Management System Migration Scripts

## Overview

The task migration system has been refactored into smaller, safer modules to prevent column reference errors and improve maintainability.

## Architecture

### Before (Monolithic)
- Single large script: `migrate_existing_tasks_to_central_system.sql`
- All migrations in one file with conditional logic
- Prone to column reference errors

### After (Modular)
- **Master Script**: `migrate_existing_tasks_to_central_system.sql` - Orchestrates the migration
- **Safe Modules**:
  - `migrate_quality_checks.sql` - Dynamic SQL for quality checks
  - `migrate_safety_incidents.sql` - Dynamic SQL for safety incidents
  - `migrate_legal_reviews.sql` - Dynamic SQL for legal reviews
- **Orchestrator**: `migrate_business_objects_safely.sql` - Alternative safe runner

## Key Improvements

### 1. Dynamic SQL Approach
- Checks column existence at runtime
- Builds SQL queries dynamically based on available columns
- Prevents "column does not exist" errors

### 2. Defensive Programming
- Validates table and column existence before migration
- Provides fallback values for missing columns
- Graceful skipping of incompatible tables

### 3. Better Error Handling
- Individual migration failures don't stop the entire process
- Detailed logging for troubleshooting
- Clear success/failure reporting

### 4. Maintainability
- Smaller, focused scripts
- Easier to debug individual migrations
- Simpler to add new business object types

## Migration Flow

1. **Diagnostic Check** (`sql/diagnostic_system_check.sql`)
   - Verify system readiness
   - Check table and column existence

2. **Safe Migration** (Choose one approach):
   - **Option A**: Run master script with includes
     ```sql
     \i migrate_existing_tasks_to_central_system.sql
     ```
   - **Option B**: Run orchestrator
     ```sql
     \i migrate_business_objects_safely.sql
     ```

3. **Verification**
   - Check migration results
   - Validate data integrity

## Business Object Mappings

### Currently Active Tables
These tables are actually used in the current task management implementation:

| Source Table | Task Type | Priority Source | Status Source | Notes |
|-------------|-----------|----------------|---------------|-------|
| procurement_orders | procurement_review | priority column | approval_status | Simple mapping |
| scope_of_work | sow_review | priority column | status column | Simple mapping |
| sow_appendices | appendix_contribution | sow.priority | status column | Joined mapping |

### Potentially Unused Tables
These tables may be leftover from documentation or previous development and are currently skipped:

| Source Table | Task Type | Status | Notes |
|-------------|-----------|--------|-------|
| quality_checks | quality_check | **SKIPPED** | May not be implemented |
| safety_incidents | safety_incident | **SKIPPED** | May not be implemented |
| legal_reviews | legal_review | **SKIPPED** | May not be implemented |
| contracts | contract_review | **SKIPPED** | May not be implemented |

## Dynamic SQL Details

For tables with potentially missing columns, the scripts:

1. Check if required columns exist (`organization_id`, `assigned_to`)
2. Build SQL expressions based on available optional columns
3. Execute the dynamically constructed query
4. Provide detailed logging

### Example Dynamic Query Building

```sql
-- Priority expression
IF priority_column_exists THEN
  priority_expr := 'CASE WHEN table.priority = ''urgent'' THEN ''urgent'' ... END';
ELSE
  priority_expr := '''normal''';
END IF;

-- Build complete query
sql_query := format('INSERT INTO tasks (...) SELECT %s as priority, ...', priority_expr);
EXECUTE sql_query;
```

## Troubleshooting

### Common Issues

1. **"column does not exist" errors**
   - Use the dynamic SQL versions instead of static queries
   - Check diagnostic output for missing columns

2. **Permission errors**
   - Ensure user has access to `information_schema`
   - Check RLS policies on source tables

3. **Data type mismatches**
   - Dynamic scripts handle type validation
   - Check logs for compatibility warnings

### Debugging Steps

1. Run diagnostic script first
2. Check PostgreSQL logs for detailed error messages
3. Run individual migration scripts separately
4. Verify column existence manually:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'your_table' AND table_schema = 'public';
   ```

## Future Enhancements

- Add migration state tracking
- Implement rollback capabilities
- Add performance monitoring
- Create migration validation framework
