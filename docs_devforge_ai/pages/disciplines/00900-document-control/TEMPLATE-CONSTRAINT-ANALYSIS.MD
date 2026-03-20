# Template Table Foreign Key Constraint Analysis

## Executive Summary

Based on analysis of the database schema files, I've identified several foreign key constraint issues that are preventing the deletion of template records. Here's a comprehensive analysis and recommended solutions.

## Current Template System Structure

### Core Tables Identified:
1. **`templates`** - Main unified template system table
2. **`template_assignments`** - Handles contractor assignments
3. **`discipline_template_config`** - Discipline-specific configurations

### Key Foreign Key Constraints Found:

#### From `02_create_unified_tables.sql`:
```sql
-- Template assignments reference templates with CASCADE delete
CREATE TABLE template_assignments (
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    ...
);
```

#### From `05_add_hierarchy_constraints.sql`:
```sql
-- Document control tables with hierarchy constraints
ALTER TABLE a_00900_doccontrol_documents 
ADD CONSTRAINT fk_a_00900_doccontrol_documents_org 
FOREIGN KEY (organisation_id) REFERENCES organisations(id);

ALTER TABLE a_00900_doccontrol_documents 
ADD CONSTRAINT fk_a_00900_doccontrol_documents_project 
FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE a_00900_doccontrol_documents 
ADD CONSTRAINT fk_a_00900_doccontrol_documents_phase 
FOREIGN KEY (project_phase_assignment_id) REFERENCES project_phase_assignments(id);
```

## Identified Problems

### 1. **Non-CASCADE Hierarchy Constraints**
The main issue preventing template deletions appears to be in the hierarchy-based document control system:

- `a_00900_doccontrol_documents` table has foreign key constraints to `organisations`, `projects`, and `project_phase_assignments`
- These constraints likely do not have CASCADE delete rules
- Templates may be linked to documents through these tables

### 2. **Missing Template-Specific Constraints**
The unified template system has proper CASCADE constraints:
- ✅ `template_assignments` has `ON DELETE CASCADE` to `templates`
- ✅ No direct foreign key constraints on `templates` table itself

### 3. **Potential Circular References**
The hierarchy system creates potential circular references:
- Templates may reference projects
- Projects may reference organizations
- Organizations may have templates
- This creates deletion dependency chains

## Recommended Solutions

### Solution 1: Add CASCADE Rules to Hierarchy Constraints

**Priority: High**

Modify the foreign key constraints to use CASCADE delete where appropriate:

```sql
-- Fix hierarchy constraints for document control
ALTER TABLE a_00900_doccontrol_documents 
DROP CONSTRAINT IF EXISTS fk_a_00900_doccontrol_documents_org;

ALTER TABLE a_00900_doccontrol_documents 
ADD CONSTRAINT fk_a_00900_doccontrol_documents_org 
FOREIGN KEY (organisation_id) REFERENCES organisations(id) 
ON DELETE CASCADE;

-- Similar changes for project and phase constraints
ALTER TABLE a_00900_doccontrol_documents 
DROP CONSTRAINT IF EXISTS fk_a_00900_doccontrol_documents_project;

ALTER TABLE a_00900_doccontrol_documents 
ADD CONSTRAINT fk_a_00900_doccontrol_documents_project 
FOREIGN KEY (project_id) REFERENCES projects(id) 
ON DELETE CASCADE;

ALTER TABLE a_00900_doccontrol_documents 
DROP CONSTRAINT IF EXISTS fk_a_00900_doccontrol_documents_phase;

ALTER TABLE a_00900_doccontrol_documents 
ADD CONSTRAINT fk_a_00900_doccontrol_documents_phase 
FOREIGN KEY (project_phase_assignment_id) REFERENCES project_phase_assignments(id) 
ON DELETE CASCADE;
```

### Solution 2: Implement Soft Delete Pattern

**Priority: Medium**

Instead of hard deletion, implement a soft delete system:

```sql
-- Add deleted columns to template tables
ALTER TABLE templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_deleted_at ON templates(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create view for non-deleted templates
CREATE OR REPLACE VIEW active_templates AS
SELECT * FROM templates WHERE deleted_at IS NULL;

-- Update application code to use the view instead of direct table access
```

### Solution 3: Create Template Deletion Cleanup Script

**Priority: High**

Create a comprehensive cleanup script that handles dependencies:

```sql
-- Template deletion script with dependency handling
CREATE OR REPLACE FUNCTION delete_template_with_dependencies(template_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Step 1: Delete template assignments
    DELETE FROM template_assignments WHERE template_id = template_uuid;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Step 2: Delete associated documents (if they reference templates)
    DELETE FROM a_00900_doccontrol_documents 
    WHERE document_type = 'template' 
    AND document_id = template_uuid;
    
    -- Step 3: Finally delete the template
    DELETE FROM templates WHERE id = template_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to delete template %: %', template_uuid, SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

### Solution 4: Database Constraint Audit

**Priority: Medium**

Run a comprehensive audit to identify all problematic constraints:

```sql
-- Find all non-CASCADE constraints that reference template-related tables
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (ccu.table_name LIKE '%template%' OR 
       ccu.table_name LIKE '%organisation%' OR
       ccu.table_name LIKE '%project%')
  AND rc.delete_rule != 'CASCADE'
ORDER BY tc.table_name, tc.constraint_name;
```

## Implementation Priority

1. **Immediate (Critical)**: Run Solution 4 audit to identify exact constraints
2. **High Priority**: Implement Solution 3 (deletion cleanup function)
3. **High Priority**: Apply Solution 1 (add CASCADE rules) for hierarchy constraints
4. **Medium Priority**: Consider Solution 2 (soft delete) for better data recovery

## Testing Recommendations

1. **Create test templates** with various relationships
2. **Attempt deletion** before and after applying fixes
3. **Verify CASCADE behavior** works correctly
4. **Check performance impact** of added CASCADE rules

## Monitoring and Validation

After implementing fixes:

```sql
-- Monitor template deletion success rate
SELECT 
    DATE_TRUNC('day', created_at) as day,
    COUNT(*) as total_templates,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_templates
FROM templates 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Check for any remaining constraint violations
SELECT * FROM information_schema.referential_constraints 
WHERE constraint_name LIKE '%template%' 
AND delete_rule != 'CASCADE';
```

## Risk Assessment

- **Low Risk**: Adding CASCADE rules to existing constraints
- **Medium Risk**: Implementing soft delete (requires code changes)
- **High Risk**: Modifying existing foreign key relationships without thorough testing

## Next Steps

1. Run the SQL analysis script (`analyze_template_constraints.sql`)
2. Identify exact problematic constraints
3. Test solutions in development environment
4. Apply fixes incrementally with rollback plans
5. Update application code to handle new deletion patterns
6. Monitor system performance after changes
