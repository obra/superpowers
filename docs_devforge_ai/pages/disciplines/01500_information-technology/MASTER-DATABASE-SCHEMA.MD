# Master Database Schema Reference

## Overview
This document provides the authoritative reference for the ConstructAI database architecture. All tables, their purposes, and relationships are defined here to ensure consistency across documentation and implementation.

**Status:** ✅ **Authoritative Reference** - Single source of truth for all database schemas
**Last Updated:** December 1, 2025
**Purpose:** Eliminate conflicting documentation and establish clear table usage guidelines

## Architecture Principles

### Unified Templates Approach
- **Single `templates` table**: All forms, templates, and workflows are stored in one unified table
- **Separate `prompts` table**: AI prompts are stored separately from form templates
- **Clear separation**: Forms use `prompt_template` field for HTML content, AI prompts use `content` field

### Table Categories
| Category | Purpose | Example Tables |
|----------|---------|----------------|
| **Core Data** | Primary business entities | `templates`, `prompts`, `users`, `organizations` |
| **Transactional** | Form submissions and processing | `form_instances`, `document_processing_log` |
| **Reference** | Lookup and configuration data | `disciplines`, `document_types_by_discipline` |

---

## Core Tables

### Templates Table (Unified)
**Purpose**: Single table for all forms, templates, and workflows

**Current Production Schema:**
```sql
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying(50) NOT NULL,                    -- 'form', 'template', 'workflow'
  name character varying(255) NOT NULL,                   -- Human-readable name
  description text NULL,                                  -- Optional description
  version character varying(20) NULL DEFAULT '1.0.0',

  -- Content (varies by type)
  prompt_template text NOT NULL,                          -- HTML for forms, template content for others
  validation_config jsonb NULL DEFAULT '{}'::jsonb,       -- JSON schema for forms
  ui_config jsonb NULL DEFAULT '{}'::jsonb,               -- UI configuration

  -- Status and lifecycle
  is_active boolean NULL DEFAULT true,
  is_public boolean NULL DEFAULT false,
  processing_status character varying(20) NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'

  -- Metadata
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),

  -- Usage tracking (for AI prompts when stored here incorrectly)
  usage_count integer NULL DEFAULT 0,
  success_rate numeric(5,2) NULL DEFAULT 100.00,
  average_generation_time integer NULL DEFAULT 0,

  -- Organization and discipline
  discipline_code character varying(50) NULL,
  document_type character varying(100) NULL,
  discipline character varying(100) NULL DEFAULT 'General',
  organization_id uuid NULL,

  -- Template relationships
  copied_from_template_id uuid NULL,
  template_scope character varying(20) NULL DEFAULT 'original', -- 'original', 'copied', 'generated'
  target_discipline character varying(50) NULL,
  copy_metadata jsonb NULL,

  -- Tags and categorization
  tags text[] NULL DEFAULT '{}'::text[],

  CONSTRAINT templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_copied_from_template_id_fkey FOREIGN KEY (copied_from_template_id)
    REFERENCES templates (id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_templates_type_status ON public.templates USING btree (type, processing_status);
CREATE INDEX idx_templates_discipline_code ON public.templates USING btree (discipline_code);
CREATE INDEX idx_templates_document_type ON public.templates USING btree (document_type);
CREATE INDEX idx_templates_organization ON public.templates USING btree (organization_id);
CREATE INDEX idx_templates_copied_from ON public.templates USING btree (copied_from_template_id);
CREATE INDEX idx_templates_scope ON public.templates USING btree (template_scope);
CREATE INDEX idx_templates_target_discipline ON public.templates USING btree (target_discipline);
CREATE INDEX idx_templates_public ON public.templates USING btree (is_public);
CREATE INDEX idx_templates_discipline ON public.templates USING btree (discipline);

-- Triggers
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Field Usage by Type:**
| Type | prompt_template | validation_config | ui_config | processing_status |
|------|----------------|------------------|-----------|-------------------|
| **form** | HTML content | JSON schema | Form UI config | draft/published |
| **template** | Template content | Validation rules | Template config | published |
| **workflow** | Workflow definition | Process rules | UI workflow | published |

### Prompts Table (AI Only)
**Purpose**: Dedicated storage for AI prompts and prompt management

**Schema:**
```sql
CREATE TABLE public.prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key character varying(100) UNIQUE,                      -- Unique identifier (e.g., "drawing_analysis_system")
  name character varying(255) NOT NULL,                   -- Human-readable name
  content text NOT NULL,                                  -- Actual prompt content
  description text NULL,

  -- Classification
  type character varying(50),                             -- 'analysis', 'coding', 'modal', etc.
  category character varying(100),                        -- Discipline or functional category
  tags text[],                                            -- Searchable tags
  pages_used text[],                                      -- Page codes where prompt is used

  -- Status and lifecycle
  is_active boolean NULL DEFAULT true,
  role_type character varying(20) NULL DEFAULT 'user',    -- 'system', 'user'

  -- Organization and relationships
  organization_id uuid NULL,
  sector_id character varying(50) NULL,

  -- Metadata
  metadata jsonb NULL DEFAULT '{}'::jsonb,                -- Extended metadata
  access_permissions jsonb NULL DEFAULT '{}'::jsonb,      -- RBAC permissions

  -- Audit fields
  created_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),

  CONSTRAINT prompts_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX idx_prompts_key ON public.prompts USING btree (key);
CREATE INDEX idx_prompts_type ON public.prompts USING btree (type);
CREATE INDEX idx_prompts_category ON public.prompts USING btree (category);
CREATE INDEX idx_prompts_active ON public.prompts USING btree (is_active);
CREATE INDEX idx_prompts_role_type ON public.prompts USING btree (role_type);
CREATE INDEX idx_prompts_organization ON public.prompts USING btree (organization_id);
CREATE INDEX idx_prompts_pages ON public.prompts USING gin (pages_used);
CREATE INDEX idx_prompts_tags ON public.prompts USING gin (tags);
```

**Key Differences from Templates Table:**
- `content` field for prompt text (vs `prompt_template` in templates)
- `key` field for unique identifiers (vs no equivalent in templates)
- `pages_used` array for page associations (templates has different relationships)
- No `processing_status` or workflow fields (prompts don't have draft/published states)

### Form Instances Table
**Purpose**: Form submission data and processing results

**Schema:**
```sql
CREATE TABLE public.form_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NULL,                                  -- References templates.id
  instance_name character varying(255) NOT NULL,
  instance_slug character varying(255) NULL,

  -- File information
  source_file_name character varying(255) NOT NULL,
  source_file_type character varying(50) NULL,
  source_file_size integer NULL,

  -- Form data
  processed_data jsonb NULL DEFAULT '{}'::jsonb,          -- AI-extracted data
  submission_data jsonb NULL DEFAULT '{}'::jsonb,         -- User-submitted data
  html_form text NULL,                                    -- Generated HTML form
  json_form jsonb NULL,                                   -- Form structure

  -- Processing status
  processing_status character varying(20) NULL DEFAULT 'processed',
  version integer NULL DEFAULT 1,

  -- Submission tracking
  is_submitted boolean NULL DEFAULT false,
  submitted_by character varying(255) NULL,
  submitted_at timestamp with time zone NULL,

  -- Audit fields
  created_by character varying(255) NULL,
  updated_by character varying(255) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  deleted_at timestamp with time zone NULL,

  CONSTRAINT form_instances_pkey PRIMARY KEY (id),
  CONSTRAINT form_instances_template_id_fkey FOREIGN KEY (template_id)
    REFERENCES templates (id) ON DELETE SET NULL
);
```

### Document Processing Log Table
**Purpose**: Audit trail for all document processing operations

**Schema:**
```sql
CREATE TABLE public.document_processing_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instance_id uuid NULL,
  template_id uuid NULL,

  -- File information
  file_name character varying(255) NOT NULL,
  file_type character varying(50) NULL,
  organization_name character varying(255) NULL,
  discipline_name character varying(255) NULL,

  -- Processing information
  processing_type character varying(50) NOT NULL,         -- 'upload', 'extraction', 'template_creation'
  processing_status character varying(20) NOT NULL,       -- 'started', 'completed', 'failed'
  processing_message text NULL,
  processing_details jsonb NULL DEFAULT '{}'::jsonb,
  processing_time_ms integer NULL,

  -- Error tracking
  error_details jsonb NULL,
  stack_trace text NULL,

  -- Request context
  user_agent text NULL,
  user_ip inet NULL,
  created_by character varying(255) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),

  CONSTRAINT document_processing_log_pkey PRIMARY KEY (id),
  CONSTRAINT document_processing_log_instance_id_fkey FOREIGN KEY (instance_id)
    REFERENCES form_instances (id) ON DELETE SET NULL,
  CONSTRAINT document_processing_log_template_id_fkey FOREIGN KEY (template_id)
    REFERENCES templates (id) ON DELETE SET NULL
);
```

---

## Table Usage Guidelines

### When to Use Each Table

#### Templates Table
**Use for:**
- ✅ Form templates created from document uploads
- ✅ Custom workflow templates
- ✅ Reusable form configurations
- ✅ Any structured content that needs versioning and organization

**Do NOT use for:**
- ❌ AI prompts (use `prompts` table instead)
- ❌ Form submission data (use `form_instances` table)
- ❌ Processing logs (use `document_processing_log` table)

#### Prompts Table
**Use for:**
- ✅ AI prompt storage and management
- ✅ Prompt versioning and optimization
- ✅ Prompt analytics and usage tracking
- ✅ Multi-discipline prompt organization

**Do NOT use for:**
- ❌ Form templates (use `templates` table)
- ❌ Form submission data (use `form_instances` table)

#### Form Instances Table
**Use for:**
- ✅ User-submitted form data
- ✅ Document processing results
- ✅ Form validation outcomes
- ✅ Audit trail of form interactions

**Do NOT use for:**
- ❌ Form templates (use `templates` table)
- ❌ AI prompts (use `prompts` table)

### Common Field Mapping Issues

#### Form Save Operations
**Correct field mapping for templates table:**
```javascript
// ✅ CORRECT - Form save to templates table
const formData = {
  type: 'form',                          // Required
  name: processedForm.title,             // Correct field name
  description: processedForm.description,
  prompt_template: processedForm.html_content,  // HTML goes here
  validation_config: processedForm.json_schema, // JSON schema goes here
  ui_config: {},                         // UI configuration
  processing_status: 'draft',            // Status
  discipline_code: disciplineCode,       // Correct field name
  document_type: documentType,           // Document type
  organization_id: organizationId,       // Organization
  is_active: true,                       // Active status
  created_by: userId,                    // Creator
  // etc.
};

// ❌ INCORRECT - Wrong field names cause INSERT failures
const wrongFormData = {
  template_name: processedForm.title,    // ❌ Field doesn't exist
  html_content: processedForm.html_content, // ❌ Field doesn't exist
  json_schema: processedForm.json_schema,   // ❌ Field doesn't exist
  discipline_name: disciplineCode,       // ❌ Wrong field name
  // etc.
};
```

#### AI Prompt Storage
**Correct field mapping for prompts table:**
```javascript
// ✅ CORRECT - AI prompt to prompts table
const promptData = {
  key: 'drawing_analysis_system',       // Unique identifier
  name: 'Drawing Analysis System',      // Human-readable name
  content: 'You are an expert...',      // Actual prompt content
  type: 'analysis',                     // Prompt type
  category: 'engineering',              // Category
  tags: ['drawing', 'analysis'],        // Search tags
  pages_used: ['00300', '00800'],       // Page codes
  is_active: true,                      // Active status
  role_type: 'system',                  // System/user prompt
  organization_id: orgId,               // Organization
  // etc.
};
```

---

## Data Relationships

### Entity Relationship Diagram
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   templates     │     │  form_instances  │     │  document_      │
│   (forms)       │────▶│  (submissions)   │────▶│  processing_log │
│                 │     │                  │     │  (audit)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   prompts       │     │   users          │     │ organizations   │
│   (AI)          │     │   (owners)       │     │   (context)     │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Foreign Key Relationships
- `templates.copied_from_template_id` → `templates.id` (template copying)
- `form_instances.template_id` → `templates.id` (form submissions)
- `document_processing_log.template_id` → `templates.id` (processing audit)
- `document_processing_log.instance_id` → `form_instances.id` (processing audit)

---

## Migration Notes

### From Legacy Architecture
**Previous state (incorrect):**
- AI prompts stored in `templates` table (wrong)
- Forms stored in various discipline-specific tables (inefficient)
- No clear separation between prompts and templates

**Current state (correct):**
- AI prompts in dedicated `prompts` table
- All forms/templates in unified `templates` table
- Clear separation and proper indexing

### Schema Evolution
1. **Phase 1**: Discipline-specific tables (`safety_templates`, `procurement_templates`, etc.)
2. **Phase 2**: Unified `templates` table for forms/templates
3. **Phase 3**: AI prompts incorrectly stored in `templates` table
4. **Phase 4**: Recognition that prompts need separate table
5. **Phase 5**: Current architecture with proper separation

---

## Performance Considerations

### Indexing Strategy
- **Primary Keys**: UUID-based for global uniqueness
- **Foreign Keys**: Indexed for join performance
- **GIN Indexes**: JSONB fields (`validation_config`, `metadata`, etc.)
- **Array Indexes**: GIN indexes for `tags` and `pages_used` arrays
- **Composite Indexes**: Multi-column indexes for common query patterns

### Query Optimization
- **Partitioning**: Consider partitioning by `organization_id` for multi-tenant queries
- **Archiving**: Use `is_active` flag for soft deletes rather than physical deletion
- **Caching**: Implement query result caching for frequently accessed templates

---

## Security Considerations

### Row Level Security (RLS)
All tables should have appropriate RLS policies:
- **Organization isolation**: Users can only access data from their organizations
- **Role-based access**: Different permissions for creators, reviewers, and consumers
- **Public access**: Controlled public sharing capabilities

### Data Protection
- **Encryption**: Sensitive prompt content should be encrypted at rest
- **Access logging**: All data access should be logged for audit purposes
- **Data sanitization**: User inputs should be sanitized before storage

---

## Related Documentation

### Architecture References
- [0000_DOCUMENTATION_GUIDE.md](0000_DOCUMENTATION_GUIDE.md) - Main documentation index
- [0000_DOCUMENTATION_SYSTEM_REORGANIZATION_TRACKING.md](0000_DOCUMENTATION_SYSTEM_REORGANIZATION_TRACKING.md) - Reorganization tracking

### Implementation Guides
- [database-systems/TABLE_USAGE_GUIDELINES.md](database-systems/TABLE_USAGE_GUIDELINES.md) - Detailed usage guidelines
- [server/sql/form-processing-system-setup.sql](server/sql/form-processing-system-setup.sql) - Table creation scripts

### Troubleshooting
- [FORM_SAVE_ERROR_ANALYSIS_AND_FIX.md](FORM_SAVE_ERROR_ANALYSIS_AND_FIX.md) - Form save debugging
- [error-tracking/1300_00000_ERROR_TRACKING_ALL.md](error-tracking/1300_00000_ERROR_TRACKING_ALL.md) - Error tracking system

---

## Change History

| Date | Change | Reason |
|------|--------|--------|
| 2025-12-01 | Created master schema document | Eliminate conflicting documentation |
| 2025-12-01 | Established clear table separation | Fix form save errors and Supabase logging issues |
| 2025-12-01 | Added field mapping guidelines | Prevent future schema confusion |

**Document Owner:** Database Architecture Team
**Review Cycle:** Monthly
**Last Reviewed:** December 1, 2025
**Next Review:** January 1, 2026
