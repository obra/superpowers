# 0300_PROCUREMENT_TEMPLATES_TO_UNIFIED_MIGRATION.md

## 📋 **Procurement Templates to Unified Templates Migration Procedure**

**Complete migration plan to remove `procurement_templates` table and migrate all references to unified `templates` table architecture.**

---

## 📋 **Procedure Information**

**Procedure ID**: `0300-PROCUREMENT-TEMPLATES-MIGRATION-001`
**Version**: `2.0`
**Effective Date**: `2025-12-16`
**Review Cycle**: `Quarterly`
**Owner**: `Database Architecture Team`
**Approver**: `Chief Technology Officer`
**Status**: `IN PROGRESS` - Core infrastructure migrated, remaining methods and routes need completion.

**Cross-References to Related Procedures:**
- → `0000_SQL_EXECUTION_PROCEDURE.md` → Database migration execution and rollback procedures
- → `0300_DATABASE_MASTER_GUIDE.md` → Unified database architecture standards
- → `0000_JAVASCRIPT_DATA_POPULATION_PROCEDURE.md` → Data migration validation procedures
- → `0000_SYSTEM_TROUBLESHOOTING_PROCEDURE_TEMPLATE.md` → Migration issue diagnosis framework

---

## 🎯 **Executive Summary**

**Migration Status**: **IN PROGRESS** - Core infrastructure migrated, remaining methods and routes need completion.

**Objective**: Completely remove `procurement_templates` table and migrate all procurement template operations to use the unified `templates` table as specified in master architecture guides.

**Impact**: Eliminates architectural inconsistency between implementation and design specifications.

**Business Value**: Ensures procurement order SOW template dropdown aligns with templates created on templates-forms-management page, enabling proper template variation selection for agent assignments and HITL workflows.

## 🎯 **Purpose**

The purpose of this procedure is to:

1. **Eliminate Architectural Inconsistency**: Remove the separate `procurement_templates` table and migrate all procurement template operations to the unified `templates` table
2. **Ensure Template Alignment**: Make SOW template dropdown in procurement orders show templates created on the templates-forms-management page
3. **Enable Proper Agent Assignment**: Allow template variation selection to determine agent assignments and HITL workflows
4. **Maintain Backward Compatibility**: Ensure API responses maintain legacy field names for frontend compatibility
5. **Improve Data Integrity**: Consolidate template management into a single, unified system

## 📋 **Scope**

This procedure applies to:

- **Database Tables**: Migration from `procurement_templates` to `templates` table
- **API Endpoints**: Update of procurement template routes to use unified templates
- **Frontend Components**: Update SOW template dropdown to show unified templates
- **Business Logic**: Template variation selection for agent assignments and HITL workflows
- **Testing**: Validation of template alignment and workflow integrity

**Out of Scope:**
- Document ordering management system (separate from template selection)
- Template creation workflows (covered by separate procedures)
- Non-procurement discipline templates

## 📋 **Prerequisites**

### **Technical Prerequisites:**
- ✅ Database schema validation completed
- ✅ Unified `templates` table deployed and functional
- ✅ Template creation workflows operational on templates-forms-management page
- ✅ Procurement order creation system functional
- ✅ Development environment with test data

### **Access Prerequisites:**
- Database administration access for schema changes
- Server deployment access for API updates
- Template management permissions for testing
- Procurement order creation permissions for validation

### **Knowledge Prerequisites:**
- Understanding of unified templates architecture
- Familiarity with procurement workflow requirements
- Knowledge of template variation system for agent assignments
- Experience with database migration procedures

## 🛠️ **Roles and Responsibilities**

| **Role** | **Responsibilities** |
|----------|---------------------|
| **Database Architect** | Schema design, migration planning, data integrity validation |
| **Backend Developer** | API endpoint updates, service layer modifications |
| **Frontend Developer** | UI component updates, template dropdown integration |
| **QA Engineer** | Testing coordination, validation procedures, regression testing |
| **DevOps Engineer** | Deployment coordination, rollback procedures, monitoring setup |
| **Business Analyst** | Requirements validation, user acceptance testing |

## 🗂️ **Enhanced Document Section Architecture (2025-12-12)**

### **Discipline-Specific Document Sections**
The unified templates system now supports fully adaptable, discipline-specific document sections that replace the rigid appendix system:

#### **Flexible Section Types by Discipline**
- **Procurement (01900)**: Appendix A-F (Technical, Quality, Compliance, Testing, Maintenance, Commercial)
- **Contracts (00435)**: Schedule 1-2, Appendix A (Rates, Conditions, Technical Specifications)
- **Safety (02400)**: Attachment 1-2 (Risk Assessment, Method Statement)
- **Civil Engineering (00850)**: Appendix A-C (Design, Specifications, Calculations)
- **Finance (01200)**: Schedule A-B (Budgets, Forecasts)

## 📋 **Tables Used in This Workflow**

### **Primary Tables**

#### **1. `discipline_document_sections`**
**Purpose**: Stores discipline-specific document section configurations
**Location**: `server/sql/discipline_document_sections_schema.sql`
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped access control

**Schema Validation** (MANDATORY - Run before any operations):
```sql
-- CRITICAL: Run comprehensive schema validation
DO $$
DECLARE
    required_columns TEXT[] := ARRAY['id', 'discipline_code', 'organization_id', 'section_code', 'section_name', 'section_type', 'display_order'];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_info RECORD;
BEGIN
    RAISE NOTICE '🔍 DISCIPLINE_DOCUMENT_SECTIONS SCHEMA VALIDATION';

    -- Verify table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discipline_document_sections' AND table_schema = 'public') THEN
        RAISE EXCEPTION '❌ CRITICAL: discipline_document_sections table does not exist. Run schema deployment first.';
    END IF;

    -- Check required columns exist with correct types
    FOREACH col_info IN
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'discipline_document_sections' AND table_schema = 'public'
    LOOP
        -- Validate critical columns
        IF col_info.column_name = 'id' AND col_info.data_type != 'uuid' THEN
            RAISE EXCEPTION '❌ CRITICAL: id column must be UUID type';
        END IF;
        IF col_info.column_name = 'organization_id' AND col_info.data_type != 'uuid' THEN
            RAISE EXCEPTION '❌ CRITICAL: organization_id column must be UUID type';
        END IF;
        IF col_info.column_name = 'available_document_types' AND col_info.data_type != 'jsonb' THEN
            RAISE EXCEPTION '❌ CRITICAL: available_document_types column must be JSONB type';
        END IF;
    END LOOP;

    -- Check foreign key relationships
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'discipline_document_sections'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'organization_id'
    ) THEN
        RAISE WARNING '⚠️ FOREIGN KEY: organization_id constraint missing - data integrity at risk';
    END IF;

    RAISE NOTICE '✅ SCHEMA VALIDATION COMPLETE - discipline_document_sections table ready';
END $$;
```

**Critical Fields**:
- `discipline_code`: Links to discipline definitions
- `section_code`: Unique identifier within discipline ('appendix_a', 'schedule_1')
- `section_type`: Category ('appendix', 'schedule', 'attachment')
- `available_document_types`: JSONB array of allowed document types
- `validation_rules`: JSONB schema for content validation

#### **2. `organizations`**
**Purpose**: Organization definitions for multi-tenant scoping
**Dependencies**: None (base table)
**RLS Policy**: User organization membership access

#### **3. `templates`**
**Purpose**: Unified template storage with discipline-specific metadata
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped template access

**Enhanced Template Fields** (for document sections):
- `discipline_code`: Links templates to discipline sections
- `metadata.section_context`: JSONB field storing section information
- `metadata.document_types`: Array of supported document types
- `metadata.validation_rules`: Section-specific validation rules

### **Related Tables**

#### **4. `user_organization_access`**
**Purpose**: User organization membership for RLS policies
**Dependencies**: `organizations(id)`
**RLS Policy**: User-based access control

#### **5. `disciplines`**
**Purpose**: Discipline definitions and metadata
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped discipline access

### **Data Flow Architecture**

#### **Read Operations**
1. **Client Request**: `GET /api/discipline-document-sections?discipline=01900`
2. **Server Validation**: Organization context from user session
3. **Database Query**: Filter by `discipline_code` and `organization_id`
4. **Response**: JSON array of section configurations

#### **Write Operations**
1. **Client Request**: `POST /api/discipline-document-sections` (admin only)
2. **Server Validation**: Required fields and organization scoping
3. **Database Insert**: New section with proper constraints
4. **Response**: Created section object

### **Security Model**

#### **RLS Policies Applied**
```sql
-- Organization-scoped access
CREATE POLICY "discipline_sections_access" ON discipline_document_sections
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_access
      WHERE user_id = auth.uid()::text
    )
  );

-- Governance admin management
CREATE POLICY "governance_discipline_sections_admin" ON discipline_document_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.department_code = '01300'
    )
  );

-- Development bypass
CREATE POLICY "dev_mode_discipline_sections" ON discipline_document_sections
  FOR ALL USING (current_setting('app.is_development_mode', true) = 'true');
```

#### **🔗 Cross-References to RLS Security Procedures**

**→ `0000_TABLE_POLICIES_SECURITY_PROCEDURE.md`** - Comprehensive RLS policy patterns and security management
- **Organization-Based Access**: See Pattern 3 - Multi-tenant organization isolation
- **Development Mode Bypass**: See Pattern 1 - Development mode bypass policies
- **Role-Based Access**: See governance role management patterns
- **Emergency Procedures**: Complete lockout recovery and policy troubleshooting

**→ `0000_SQL_EXECUTION_PROCEDURE.md`** - SQL deployment validation and RLS policy testing
- **RLS Policy Verification**: Mandatory post-deployment security audit
- **Schema Compatibility**: Handling different database configurations
- **Performance Monitoring**: RLS policy impact assessment

**Key Security Patterns Used:**
- **✅ Organization Isolation**: Multi-tenant data separation (Pattern 3)
- **✅ Development Bypass**: Auth bypass for development (Pattern 1)
- **✅ Service Role Override**: Server-side operation access (Pattern 2)
- **✅ Role-Based Management**: Governance user permissions

#### **Database Schema Enhancement**
```sql
-- Discipline-specific document sections table
CREATE TABLE discipline_document_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_code VARCHAR(10) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  section_code VARCHAR(20) NOT NULL, -- 'appendix_a', 'schedule_1', 'attachment_1'
  section_name VARCHAR(100) NOT NULL,
  section_type VARCHAR(50) NOT NULL, -- 'appendix', 'schedule', 'attachment', 'exhibit'
  display_order INTEGER NOT NULL DEFAULT 1,
  required BOOLEAN DEFAULT false,
  allows_multiple_types BOOLEAN DEFAULT true,
  default_document_type VARCHAR(100),
  available_document_types JSONB DEFAULT '[]',
  validation_rules JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(discipline_code, organization_id, section_code)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_discipline_sections_code ON discipline_document_sections(discipline_code, organization_id);
CREATE INDEX IF NOT EXISTS idx_discipline_sections_type ON discipline_document_sections(section_type);
```

#### **Dynamic Section Loading**
```javascript
// Load discipline-specific document sections
const loadDisciplineDocumentSections = async (disciplineCode) => {
  const response = await fetch(`/api/discipline-document-sections?discipline=${disciplineCode}`);
  return response.json();
};
```

#### **Template Metadata Enhancement**
Templates now include section context:
```javascript
const enhancedTemplate = {
  ...templateData,
  discipline_code: disciplineCode,
  document_sections: sections,
  section_requirements: sections.filter(s => s.required),
  available_section_types: [...new Set(sections.map(s => s.type))]
};
```

---

## 🔧 **Revised Approach: Explicit Complexity Specification (2025-12-16)**

### Integration with Unified Templates Migration

**Critical Enhancement**: The unified templates migration now incorporates explicit complexity specification, ensuring that templates created on the templates-forms-management page have deliberate complexity levels that drive predictable workflow behavior, rather than relying on AI inference.

#### Template Complexity in Unified Schema

**Templates in the unified `templates` table include explicit complexity metadata**:

```json
{
  "id": "uuid",
  "name": "Complex Equipment Procurement Template",
  "type": "form",
  "discipline": "Procurement",
  "processing_status": "published",
  "metadata": {
    "complexity_level": "complex",
    "workflow_metadata": {
      "appendices_required": ["A", "B", "C", "D", "E", "F"],
      "disciplines_required": ["01900", "02400", "00800", "01300", "02200"],
      "approval_levels": 3,
      "estimated_duration_hours": 12,
      "business_rules": {
        "requires_multi_discipline": true,
        "requires_executive_approval": true,
        "requires_compliance_review": false
      }
    }
  }
}
```

#### Migration Path for Complexity Levels

**During Migration: Templates inherit complexity from existing template variations**:
```javascript
// Migration logic for complexity assignment
const assignComplexityToMigratedTemplates = async () => {
  const legacyTemplates = await getLegacyProcurementTemplates();

  for (const template of legacyTemplates) {
    // Determine complexity based on template characteristics
    const complexity = determineTemplateComplexity(template);

    // Update unified template with explicit complexity
    await updateUnifiedTemplate(template.id, {
      metadata: {
        complexity_level: complexity.level,
        workflow_metadata: complexity.workflowMetadata
      }
    });
  }
};

const determineTemplateComplexity = (template) => {
  // Analyze template characteristics to assign explicit complexity
  const fieldCount = template.field_count || 0;
  const hasComplexValidation = template.has_complex_validation;

  if (fieldCount < 5 && !hasComplexValidation) {
    return {
      level: 'simple',
      workflowMetadata: {
        appendices_required: ['A', 'C'],
        disciplines_required: ['01900'],
        approval_levels: 1,
        estimated_duration_hours: 3
      }
    };
  }

  if (fieldCount > 15 || hasComplexValidation) {
    return {
      level: 'complex',
      workflowMetadata: {
        appendices_required: ['A', 'B', 'C', 'D', 'E', 'F'],
        disciplines_required: ['01900', '02400', '00800', '01300'],
        approval_levels: 3,
        estimated_duration_hours: 12
      }
    };
  }

  // Default to standard complexity
  return {
    level: 'standard',
    workflowMetadata: {
      appendices_required: ['A', 'B', 'C', 'E'],
      disciplines_required: ['01900', '02400'],
      approval_levels: 2,
      estimated_duration_hours: 6
    }
  };
};
```

#### Post-Migration Template Creation

**New templates created on templates-forms-management page require explicit complexity**:

```javascript
// Enhanced template creation with mandatory complexity specification
const createProcurementTemplate = async (templateData) => {
  // Validate complexity level is explicitly specified
  if (!templateData.metadata?.complexity_level) {
    throw new Error('Complexity level must be explicitly specified for procurement templates');
  }

  // Validate complexity level is valid
  const validComplexities = ['simple', 'standard', 'complex', 'emergency', 'compliance'];
  if (!validComplexities.includes(templateData.metadata.complexity_level)) {
    throw new Error(`Invalid complexity level. Must be one of: ${validComplexities.join(', ')}`);
  }

  // Validate workflow metadata matches complexity level
  validateComplexityWorkflowMetadata(templateData.metadata);

  // Create template in unified system
  return await createUnifiedTemplate({
    ...templateData,
    discipline: 'Procurement',
    metadata: {
      ...templateData.metadata,
      created_with_explicit_complexity: true,
      complexity_specification_date: new Date().toISOString()
    }
  });
};
```

#### Complexity-Driven Workflow Integration

**Unified templates now drive workflow complexity explicitly**:

```javascript
// Template selection determines workflow complexity
const handleTemplateSelection = async (selectedTemplateId) => {
  // Get template with complexity metadata
  const template = await getUnifiedTemplate(selectedTemplateId);
  const complexityLevel = template.metadata.complexity_level;
  const workflowMetadata = template.metadata.workflow_metadata;

  // Apply complexity-driven workflow configuration
  await configureProcurementWorkflow({
    complexityLevel,
    appendicesRequired: workflowMetadata.appendices_required,
    disciplinesRequired: workflowMetadata.disciplines_required,
    approvalLevels: workflowMetadata.approval_levels,
    estimatedDuration: workflowMetadata.estimated_duration_hours
  });

  // Trigger appropriate agent assignments and HITL thresholds
  await initializeComplexityBasedWorkflow(complexityLevel, workflowMetadata);
};
```

## 📊 **Migration Overview**

### **Current State**
- ✅ **SOW Templates Routes**: Migrated to use `templates` table
- ✅ **Core Service Methods**: `createTemplate()` and `getTemplates()` migrated
- ✅ **Documentation**: Updated to reflect unified architecture
- ✅ **Explicit Complexity**: Integrated complexity specification into migration
- 🔄 **Remaining Work**: 7 service methods, API routes, SQL cleanup

### **Target State**
- ❌ **Remove**: `procurement_templates` table completely
- ✅ **Unified**: All procurement templates use `templates` table with `discipline = 'Procurement'`
- ✅ **Explicit Complexity**: All templates have deliberate complexity levels for predictable workflows
- ✅ **Clean**: No legacy table references or migration scripts

---

## 🔧 **Migration Phases**

### **Phase 1: Service Layer Completion** ✅ **50% COMPLETE**

#### **Completed Methods:**
- ✅ `createTemplate()` - Creates in unified `templates` table
- ✅ `getTemplates()` - Queries unified `templates` table with metadata mapping
- ✅ `mapUnifiedToLegacy()` - Helper for backward compatibility

#### **Remaining Methods to Update:**

##### **1. `deleteTemplate()` Method**
**Current Implementation:**
```javascript
async deleteTemplate(templateId, deletedBy) {
  const { error } = await supabase
    .from('procurement_templates')  // ❌ Wrong table
    .update({
      approval_status: 'archived',  // ❌ Wrong field
      updated_by: deletedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId);
}
```

**Migrated Implementation:**
```javascript
async deleteTemplate(templateId, deletedBy) {
  const { error } = await supabase
    .from('templates')  // ✅ Unified table
    .update({
      processing_status: 'draft',  // ✅ Correct field (archived = draft)
      updated_by: deletedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .eq('discipline', 'Procurement');  // ✅ Discipline filter
}
```

##### **2. `submitForApproval()` Method**
**Migration:**
```javascript
// Change table: procurement_templates → templates
// Change field: approval_status → processing_status
// Add filter: .eq('discipline', 'Procurement')
```

##### **3. `approveTemplate()` Method**
**Migration:**
```javascript
// Change table: procurement_templates → templates
// Change field: approval_status → processing_status
// Add filter: .eq('discipline', 'Procurement')
```

##### **4. `generateScopeOfWork()` Method**
**Migration:**
```javascript
// Change query from procurement_templates to templates
// Update field references (template_name → name, etc.)
// Add discipline filter: .eq('discipline', 'Procurement')
```

##### **5. `updateFieldProtection()` Method**
**Migration:**
```javascript
// Change table: procurement_templates → templates
// Store field_protection in metadata JSONB
// Add discipline filter: .eq('discipline', 'Procurement')
```

##### **6. `getRelatedDocuments()` Method**
**Migration:**
```javascript
// Update join: procurement_templates!related_document_id → templates!related_document_id
// Change field references: template_name → name
// Add discipline filter for templates table
```

##### **7. `getDataSheetSpecifications()` Method**
**Migration:**
```javascript
// Update join: procurement_templates → templates
// Change field references: template_name → name, level1_code → metadata.level1_code
// Add discipline filter for templates table
```

---

### **Phase 2: API Routes Migration** 🔄 **NEXT PHASE**

#### **File: `server/src/routes/procurement-template-routes.js`**

##### **Critical Route Updates Needed:**

**GET `/templates/sow` (Line ~120):**
```javascript
// Current: Uses ProcurementTemplateService.getTemplates()
const result = await ProcurementTemplateService.getTemplates(filters, pagination);

// ✅ No change needed - service method already migrated
```

**All CRUD Operations (Lines ~30-400):**
- Change all table references: `procurement_templates` → `templates`
- Update field mappings in responses
- Add discipline filtering: `discipline = 'Procurement'`
- Update category hierarchy queries
- Update analytics queries

**Example Migration Pattern:**
```javascript
// BEFORE
const { data, error } = await supabase
  .from('procurement_templates')
  .select('*, procurement_categories!inner(level1_name, level2_name, level3_name)')
  .eq('id', templateId)
  .single();

// AFTER
const { data, error } = await supabase
  .from('templates')
  .select('*, metadata')
  .eq('id', templateId)
  .eq('discipline', 'Procurement')
  .single();

// Map back to legacy format for API compatibility
const legacyFormat = {
  ...data,
  template_name: data.name,
  template_description: data.description,
  approval_status: data.processing_status === 'published' ? 'approved' : 'draft',
  procurement_categories: extractCategoriesFromMetadata(data.metadata)
};
```

---

### **Phase 3: SQL Scripts Cleanup** 📄 **PLANNED**

#### **Scripts to Remove:**
```
❌ sql/procurement_templates_schema.sql
❌ sql/procurement_templates_individual_tables.sql
❌ sql/procurement_templates_indexes_policies.sql
❌ sql/implement_procurement_templates_rls_policies.sql
❌ sql/fix_procurement_templates_rls_policies.sql
❌ sql/add_procurement_html_content_column.sql
❌ sql/add_approval_workflow_column.sql
❌ sql/procurement_templates_policies_only.sql
❌ sql/implement_hierarchical_document_rls_policies.sql (procurement parts)
❌ sql/create_project_discipline_tables.sql (procurement parts)
❌ sql/minimal_working_tables.sql (procurement parts)
❌ sql/bulk/bulk_schema_extraction_rls.sql (procurement parts)
❌ sql/add_approval_workflow_column_fixed.sql
❌ sql/executions/fix_procurement_templates_rls_policies.sql
❌ sql/executions/implement_procurement_templates_rls_policies.sql
❌ sql/executions/add_procurement_html_content_column.sql
❌ sql/executions/add_approval_workflow_column.sql
❌ sql/fixes/fix_procurement_templates_rls_policies.sql
❌ sql/fixes/fix_procurement_html_content_index.sql
❌ sql/README_procurement_templates_deployment.md
```

#### **Scripts to Update:**
```
🔄 sql/05_migrate_existing_data.sql - Update migration logic
🔄 sql/unified-templates-migration.cjs - Update to handle procurement
🔄 sql/executions/execute_approval_workflow_migration.cjs - Update table references
```

---

### **Phase 4: Documentation Updates** 📚 **PLANNED**

#### **Files to Update:**
- **Workflow Docs**: `0100_PROCUREMENT_DOCUMENT_GENERATION_WORKFLOW.md` ✅ **DONE**
- **Master Guides**: Update procurement references
- **API Docs**: Remove procurement_templates references
- **Migration Docs**: This document

---

### **Phase 5: Database Cleanup** 🗑️ **FINAL PHASE**

#### **After Migration Complete:**
```sql
-- ⚠️ ONLY RUN AFTER COMPREHENSIVE TESTING
DROP TABLE IF EXISTS procurement_templates;

-- Remove orphaned indexes and policies
DROP INDEX IF EXISTS idx_procurement_templates_category;
DROP POLICY IF EXISTS "Users can view templates in their department" ON procurement_templates;
-- ... drop all procurement-related database objects
```

---

## 🔄 **Field Mapping Reference**

### **Legacy → Unified Schema:**

| **Legacy Field** | **Unified Field** | **Notes** |
|------------------|-------------------|-----------|
| `template_name` | `name` | Direct mapping |
| `template_description` | `description` | Direct mapping |
| `template_type` | `type` | Direct mapping |
| `template_category` | `metadata.template_category` | Stored in JSONB |
| `level1_code` | `metadata.level1_code` | Stored in JSONB |
| `level2_code` | `metadata.level2_code` | Stored in JSONB |
| `level3_code` | `metadata.level3_code` | Stored in JSONB |
| `approval_status` | `processing_status` | 'approved' ↔ 'published' |
| `template_content` | `html_content` | Direct mapping |
| `field_protection` | `metadata.field_protection` | Stored in JSONB |

### **Query Patterns:**

```javascript
// Unified table queries always include discipline filter
const baseQuery = supabase
  .from('templates')
  .eq('discipline', 'Procurement')  // Always filter by discipline
  .eq('organization_id', orgId);    // Organization scoping

// Status mapping
const statusMap = {
  'approved': 'published',
  'pending': 'draft',
  'draft': 'draft',
  'rejected': 'draft',
  'archived': 'draft'
};
```

---

## 🧪 **Testing Strategy**

### **Pre-Migration Testing:**
```bash
# Test current procurement template functionality
✅ GET /api/procurement-templates
✅ POST /api/procurement-templates
✅ GET /api/procurement-templates/templates/sow
✅ Procurement order creation with SOW selection
```

### **Migration Testing:**
```bash
# Test unified template functionality
✅ GET /api/procurement-templates (after migration)
✅ POST /api/procurement-templates (after migration)
✅ GET /api/procurement-templates/templates/sow (after migration)
✅ Procurement order creation with SOW selection (after migration)
```

### **Post-Migration Validation:**
```sql
-- Verify data migration
SELECT COUNT(*) FROM templates WHERE discipline = 'Procurement';

-- Verify no orphaned references
SELECT COUNT(*) FROM procurement_templates;  -- Should be 0

-- Test unified queries
SELECT * FROM templates
WHERE discipline = 'Procurement'
  AND type = 'scope_of_work'
  AND processing_status = 'published'
LIMIT 5;
```

---

## 🚨 **Migration Risks & Mitigations**

### **Critical Risks:**

#### **1. Data Loss Risk**
- **Risk**: Migration script errors could corrupt procurement template data
- **Mitigation**:
  ```sql
  -- Create backup before migration
  CREATE TABLE procurement_templates_backup AS
  SELECT * FROM procurement_templates;
  ```

#### **2. API Breakage Risk**
- **Risk**: Frontend expects different response format from API
- **Mitigation**: Maintain backward-compatible response mapping

#### **3. Performance Impact Risk**
- **Risk**: Metadata JSONB queries slower than direct columns
- **Mitigation**: Add appropriate indexes on metadata fields

### **Rollback Strategy:**
```sql
-- Complete rollback if needed
-- 1. Restore from backup
INSERT INTO procurement_templates SELECT * FROM procurement_templates_backup;

-- 2. Revert code changes
git checkout previous-commit-hash

-- 3. Update routes back to procurement_templates
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Service Completion** ✅ **50% COMPLETE**
- [x] `createTemplate()` - migrated
- [x] `getTemplates()` - migrated
- [ ] `updateTemplate()` - needs migration
- [ ] `deleteTemplate()` - needs migration
- [ ] `submitForApproval()` - needs migration
- [ ] `approveTemplate()` - needs migration
- [ ] `generateScopeOfWork()` - needs migration
- [ ] `updateFieldProtection()` - needs migration
- [ ] `getRelatedDocuments()` - needs migration
- [ ] `getDataSheetSpecifications()` - needs migration
- [x] `mapUnifiedToLegacy()` - added helper

### **Phase 2: Routes Migration** ⏳ **PENDING**
- [ ] Update procurement-template-routes.js
- [x] SOW templates routes already migrated
- [ ] Update all CRUD endpoints
- [ ] Update category hierarchy endpoints
- [ ] Update analytics endpoints

### **Phase 3: SQL Cleanup** ⏳ **PENDING**
- [ ] Identify all SQL files to remove
- [ ] Update migration scripts
- [ ] Create cleanup script for indexes/policies

### **Phase 4: Documentation** ✅ **50% COMPLETE**
- [x] Workflow documentation updated
- [ ] Update master guides
- [ ] Update API documentation

### **Phase 5: Final Cleanup** ⏳ **PENDING**
- [ ] Comprehensive testing
- [ ] Database cleanup
- [ ] Remove legacy table

---

## 🎯 **Success Criteria**

- ✅ **Zero `procurement_templates` references** in codebase
- ✅ **All procurement templates** use unified `templates` table
- ✅ **API compatibility** maintained for frontend
- ✅ **Performance** meets or exceeds current levels
- ✅ **Data integrity** preserved during migration

---

## 📈 **Migration Progress**

| **Component** | **Status** | **Completion** | **Priority** |
|---------------|------------|----------------|--------------|
| SOW Templates Routes | ✅ Complete | 100% | High |
| Core Service Methods | 🔄 In Progress | 50% | High |
| API Routes | ⏳ Pending | 0% | High |
| SQL Scripts | ⏳ Pending | 0% | Medium |
| Documentation | ✅ 50% Complete | 50% | Low |
| Testing | ⏳ Pending | 0% | High |

---

## 🔗 **Related Documentation**

- **Master Guides**: `1300_01300_MASTER_GUIDE_TEMPLATE_MANAGEMENT.md`
- **Current Architecture**: `docs/pages-disciplines/1300_01300_MASTER_GUIDE_GOVERNANCE.md`
- **Workflow Docs**: `0100_PROCUREMENT_DOCUMENT_GENERATION_WORKFLOW.md`

---

## 📝 **Migration Notes**

### **Key Architectural Decisions:**

1. **Discipline Column**: All procurement templates tagged with `discipline = 'Procurement'`
2. **Metadata Storage**: Procurement-specific fields stored in `metadata` JSONB column
3. **Status Mapping**: `approval_status` → `processing_status` ('approved' ↔ 'published')
4. **Backward Compatibility**: API responses maintain legacy field names for frontend compatibility

### **Performance Considerations:**

- **JSONB Queries**: Metadata fields indexed appropriately
- **Discipline Filtering**: Always include `discipline = 'Procurement'` in queries
- **Organization Scoping**: Maintain proper multi-tenant isolation

## 📋 **Procedure Steps**

### **Phase 1: Pre-Migration Validation**

**1.1 Database Schema Validation**
- Execute schema validation script for `discipline_document_sections` table
- Verify `templates` table has required fields and indexes
- Confirm RLS policies are properly configured
- Validate foreign key relationships and constraints

**1.2 Data Integrity Check**
- Count existing templates in `procurement_templates` table
- Verify template approval statuses and metadata
- Check for orphaned references or invalid data
- Create backup of procurement templates table

**1.3 API Endpoint Testing**
- Test `/api/procurement-templates/templates/sow` endpoint
- Verify response format compatibility
- Confirm organization scoping and filtering
- Validate authentication and authorization

### **Phase 2: Service Layer Migration**

**2.1 Update ProcurementTemplateService Methods**
- Update `deleteTemplate()` method to use `templates` table
- Update `submitForApproval()` method with correct field mappings
- Update `approveTemplate()` method with status mapping
- Update `generateScopeOfWork()` method with discipline filtering

**2.2 Update Remaining Service Methods**
- Update `updateFieldProtection()` method for metadata storage
- Update `getRelatedDocuments()` method with table joins
- Update `getDataSheetSpecifications()` method with field mappings
- Update `mapUnifiedToLegacy()` helper for API compatibility

**2.3 Service Layer Testing**
- Unit test all migrated service methods
- Integration test with database operations
- Performance test query execution times
- Validate backward compatibility with existing API calls

### **Phase 3: API Routes Migration**

**3.1 Update Procurement Template Routes**
- Change all table references from `procurement_templates` to `templates`
- Add discipline filtering (`discipline = 'Procurement'`)
- Update field mappings in response objects
- Maintain backward compatibility for frontend expectations

**3.2 Update Category Hierarchy Endpoints**
- Update category hierarchy queries to use unified schema
- Migrate analytics endpoints to use templates table
- Update validation endpoints for new data structure
- Test all updated endpoints with various query parameters

**3.3 API Integration Testing**
- Test all CRUD operations through API endpoints
- Validate response formats match frontend expectations
- Test error handling and validation logic
- Performance test API response times

### **Phase 4: Frontend Component Updates**

**4.1 Update TemplateVariationSelector Component**
- Change API endpoint from `/api/template-variations` to `/api/procurement-templates/templates/sow`
- Update data field mappings for template display
- Maintain existing UI behavior and user experience
- Test component with new data structure

**4.2 Update Procurement Order Creation**
- Verify template selection integration
- Test template variation assignment logic
- Validate task sequencing based on template selection
- Confirm HITL workflow integration

**4.3 Frontend Testing**
- Test template dropdown population
- Validate template selection and form submission
- Test error handling and user feedback
- Cross-browser compatibility testing

### **Phase 5: Integration and Validation**

**5.1 End-to-End Testing**
- Create procurement order with SOW template selection
- Verify task creation and agent assignment
- Test HITL workflow activation and processing
- Validate document generation and approval workflows

**5.2 Data Migration Validation**
- Compare template counts before and after migration
- Verify all templates accessible through new system
- Test template approval and publishing workflows
- Validate metadata preservation and accessibility

**5.3 Performance Validation**
- Test query performance with unified templates
- Validate caching and indexing effectiveness
- Monitor API response times under load
- Compare performance metrics with legacy system

### **Phase 6: Production Deployment**

**6.1 Deployment Preparation**
- Create database backup of production data
- Prepare rollback scripts and procedures
- Coordinate deployment window with stakeholders
- Prepare monitoring and alerting for deployment

**6.2 Staged Deployment**
- Deploy service layer changes first
- Deploy API route updates
- Deploy frontend component changes
- Monitor system health and error rates

**6.3 Post-Deployment Validation**
- Verify all procurement orders can select SOW templates
- Confirm template creation on templates-forms-management appears in dropdown
- Test complete procurement workflow from order to completion
- Validate agent assignments and HITL workflows

## ✅ **Validation Criteria**

### **Functional Validation**

**FV-1: Template Alignment**
- SOW templates created on templates-forms-management page appear in procurement order dropdown
- Template selection properly assigns template variations
- Template metadata correctly maps to procurement workflow requirements

**FV-2: Agent Assignment**
- Template variation selection determines correct agent assignments
- Discipline-specific agents receive appropriate tasks
- Task routing follows template variation complexity levels

**FV-3: HITL Integration**
- Template complexity determines HITL threshold activation
- Human review workflows trigger at appropriate confidence levels
- HITL decisions properly integrate with automated processing

### **Technical Validation**

**TV-1: API Compatibility**
- All existing API calls return expected response formats
- Backward compatibility maintained for frontend components
- Error handling and validation work correctly

**TV-2: Database Integrity**
- No data loss during migration
- Foreign key relationships maintained
- RLS policies properly enforced

**TV-3: Performance Requirements**
- Query response times meet SLA requirements (<500ms)
- API throughput handles expected load
- Database indexing provides optimal performance

### **Business Validation**

**BV-1: Workflow Continuity**
- Procurement order creation workflow remains uninterrupted
- Template selection process is intuitive and efficient
- Document generation and approval workflows function correctly

**BV-2: Quality Assurance**
- Template variations correctly determine process complexity
- Human oversight integrated at appropriate decision points
- Audit trails maintained for compliance requirements

## 🚨 **Exception Handling**

### **Migration Rollback Procedures**

**Exception: Critical Data Loss Detected**
1. Immediately halt migration process
2. Restore from pre-migration database backup
3. Revert code changes to previous commit
4. Notify stakeholders and schedule investigation
5. Document root cause and prevention measures

**Exception: API Compatibility Breakage**
1. Identify affected frontend components
2. Implement temporary API response mapping
3. Deploy hotfix for compatibility issues
4. Schedule permanent fix in next sprint
5. Add regression tests for API contracts

**Exception: Performance Degradation**
1. Monitor system performance metrics
2. Identify bottleneck queries or operations
3. Implement database indexing or query optimization
4. Consider caching strategies for frequently accessed data
5. Roll back if performance targets not met

### **Business Continuity Exceptions**

**Exception: Procurement Workflow Blocked**
1. Activate emergency template selection bypass
2. Allow manual template assignment by administrators
3. Implement temporary fallback to legacy system
4. Prioritize fix for template selection functionality
5. Communicate workaround procedures to users

## 🧪 **Quality Assurance**

### **Testing Requirements**

**TR-1: Unit Testing**
- All service methods have comprehensive unit tests
- API endpoints tested with various input scenarios
- Error conditions and edge cases covered
- Test coverage > 90% for critical paths

**TR-2: Integration Testing**
- End-to-end procurement order creation workflow
- Template selection to task assignment integration
- HITL workflow activation and processing
- Document generation and approval cycles

**TR-3: Performance Testing**
- API response times under normal and peak load
- Database query performance with large datasets
- Frontend component rendering performance
- System resource utilization monitoring

### **Quality Gates**

**QG-1: Code Review**
- All changes reviewed by at least two team members
- Security implications assessed and approved
- Performance impact evaluated and accepted
- Documentation updated and reviewed

**QG-2: Testing Completion**
- All automated tests passing
- Manual testing scenarios completed
- Performance benchmarks met
- User acceptance testing successful

**QG-3: Deployment Readiness**
- Rollback procedures documented and tested
- Monitoring and alerting configured
- Stakeholder communication completed
- Support team prepared for deployment

## 📋 **Approval and Sign-off**

### **Approval Requirements**

| **Approval Level** | **Approver** | **Criteria** |
|-------------------|--------------|--------------|
| **Technical Review** | Database Architect | Schema design, migration logic, performance impact |
| **Security Review** | Security Officer | RLS policies, data protection, access controls |
| **Business Review** | Procurement Manager | Workflow impact, user experience, business requirements |
| **Executive Approval** | Chief Technology Officer | Strategic alignment, risk assessment, resource approval |

### **Sign-off Checklist**

**Pre-Implementation Sign-off:**
- [ ] Technical architecture approved
- [ ] Security assessment completed
- [ ] Business requirements validated
- [ ] Resource allocation confirmed
- [ ] Timeline and milestones agreed

**Pre-Deployment Sign-off:**
- [ ] Testing completed successfully
- [ ] Performance benchmarks met
- [ ] Rollback procedures tested
- [ ] Stakeholder communication completed
- [ ] Go-live readiness confirmed

**Post-Implementation Sign-off:**
- [ ] System functioning as expected
- [ ] No critical issues reported
- [ ] Performance metrics within acceptable ranges
- [ ] User training completed
- [ ] Documentation finalized

## 📈 **Monitoring and Metrics**

### **Key Performance Indicators**

**KPI-1: System Performance**
- API response time < 500ms (95th percentile)
- Database query time < 100ms (95th percentile)
- Frontend page load time < 2 seconds
- Error rate < 1% of total requests

**KPI-2: Business Process Efficiency**
- Procurement order creation time reduced by 20%
- Template selection accuracy > 99%
- Task assignment automation > 95%
- Human review requests optimized by complexity

**KPI-3: User Satisfaction**
- Template selection ease of use rating > 4.5/5
- Procurement workflow completion rate > 98%
- Support ticket reduction for template issues
- User training completion rate > 95%

### **Monitoring Dashboard**

**Real-time Metrics:**
- Template selection success rate
- API endpoint availability and performance
- Database query performance and errors
- User session analytics and error tracking

**Business Metrics:**
- Procurement order completion rates
- Template utilization and effectiveness
- Agent task assignment accuracy
- HITL workflow efficiency

## 📝 **Version History**

| **Version** | **Date** | **Author** | **Changes** |
|-------------|----------|------------|-------------|
| 1.0 | 2025-12-10 | AI Assistant | Initial migration document |
| 2.0 | 2025-12-16 | AI Assistant | Updated to procedures guide standards, added comprehensive sections |

---

## 📋 **Document Control**

**Document Location**: `docs/0300_PROCUREMENT_TEMPLATES_TO_UNIFIED_MIGRATION.md`
**Next Review Date**: `2026-06-16`
**Document Owner**: `Database Architecture Team`

---

*This procedure ensures the SOW template dropdown in procurement orders aligns with templates created on the templates-forms-management page, enabling proper template variation selection for agent assignments and HITL workflows. Last updated: 2025-12-16*
