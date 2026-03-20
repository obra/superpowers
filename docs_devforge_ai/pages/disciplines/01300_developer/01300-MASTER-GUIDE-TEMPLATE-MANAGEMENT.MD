# 1300_01300_MASTER_GUIDE_TEMPLATE_MANAGEMENT.md

## ⚠️ **ARCHIVED DOCUMENT - CONTENT CONSOLIDATED**

**📅 ARCHIVED**: December 12, 2025
**🔄 CONSOLIDATED INTO**: [1300_01300_MASTER_GUIDE_DOCUMENT_MANAGEMENT.md](../1300_01300_MASTER_GUIDE_DOCUMENT_MANAGEMENT.md)

### Archive Notice
This document has been **consolidated** into the unified **"Unified Document Management System"** guide. All template management content has been integrated with form management content to provide a single, comprehensive reference for all document types (Forms, Templates, Appendices, Schedules, Specifications).

**Key Content Moved:**
- ✅ Template lifecycle management features
- ✅ AI-powered template generation capabilities
- ✅ Bulk operations and discipline mapping
- ✅ Document category selection system
- ✅ Discipline-specific document sections
- ✅ Template statistics and performance metrics

**Please use the consolidated guide for all future reference.**

---

# 1300_01300_MASTER_GUIDE_TEMPLATE_MANAGEMENT.md (ARCHIVED)

## Template Management System

### Overview
The Template Management System provides a comprehensive interface for creating, managing, and organizing questionnaire templates and configurations for dynamic HTML generation. This governance-level page serves as the central hub for template lifecycle management across all disciplines within the ConstructAI system.

**✅ CURRENT STATUS (2025-12-01)**: The form generation workflow is now fully functional up to the point of forms being saved to the Supabase templates table. All core components including document upload, field detection, field configuration, form generation, and form storage are operational and integrated with the unified template management system.

### Page Structure

#### File Location
```
client/src/pages/01300-governance/components/01300-template-management-page.js
```

#### Route
```
/template-management
```

## Document Category Selection System (2025-12-12)

### Radio Button Interface for Template Categories

**Status**: ✅ IMPLEMENTED - Radio button selection system deployed across template creation modals

**Overview**: A unified radio button interface provides users with 5 standardized document category options during template creation, ensuring consistent categorization and routing across all document workflows.

#### Available Document Categories

1. **📋 Form** - Interactive questionnaires and data collection forms
   - **Use Case**: User input collection, surveys, assessments
   - **Backend Routing**: Routes to form processing pipeline
   - **Modal Title**: "Create New Form"

2. **📄 Template** - Reusable document templates and frameworks
   - **Use Case**: Standardized document structures for contracts, reports, specifications
   - **Backend Routing**: Routes to template management system
   - **Modal Title**: "Create New Template"

3. **📎 Appendix** - Supporting documentation and attachments
   - **Use Case**: Technical specifications, schedules, compliance documents
   - **Backend Routing**: Routes to discipline-specific appendix systems
   - **Modal Title**: "Create New Appendix"

4. **📅 Schedule** - Timeline and milestone documentation
   - **Use Case**: Project schedules, delivery timetables, implementation plans
   - **Backend Routing**: Routes to scheduling and project management systems
   - **Modal Title**: "Create New Schedule"

5. **🔧 Specification** - Technical and functional requirements
   - **Use Case**: Detailed technical specs, quality standards, performance criteria
   - **Backend Routing**: Routes to specification management and compliance systems
   - **Modal Title**: "Create New Specification"

#### User Interface Implementation

**Radio Button Design**:
- **Visual Indicators**: Each option includes category icon and descriptive text
- **Color Coding**: Subtle background colors for visual distinction (Form: blue, Template: green, Appendix: orange, Schedule: purple, Specification: red)
- **Hover Effects**: Enhanced visual feedback on mouse hover
- **Selection State**: Clear visual indication of selected category with checkmark icon
- **Accessibility**: Proper ARIA labels and keyboard navigation support

**Dynamic Modal Behavior**:
- **Title Updates**: Modal title changes based on selected category ("Create New [Category]")
- **Field Adaptation**: Form fields may show/hide based on category selection
- **Validation Rules**: Category-specific validation requirements applied
- **Preview Updates**: Template preview updates to reflect selected category

#### Backend Routing Logic

**Category-Based Processing**:
```javascript
const routeByCategory = (selectedCategory, templateData) => {
  switch(selectedCategory) {
    case 'form':
      return processFormTemplate(templateData); // Interactive form processing
    case 'template':
      return processDocumentTemplate(templateData); // Reusable template storage
    case 'appendix':
      return processAppendixTemplate(templateData); // Discipline-specific routing
    case 'schedule':
      return processScheduleTemplate(templateData); // Timeline management
    case 'specification':
      return processSpecTemplate(templateData); // Technical requirements
    default:
      throw new Error('Invalid document category selected');
  }
};
```

**Database Integration**:
- **Category Storage**: `document_category` field added to templates table
- **Metadata Enhancement**: Category-specific metadata stored in JSONB field
- **Query Filtering**: Templates filtered by category in search and display operations
- **Audit Trail**: Category selection logged for compliance and tracking

#### Visual Indicators and User Interaction Patterns

**Selection Feedback**:
- **Immediate Response**: Instant visual feedback on radio button selection
- **Progressive Disclosure**: Additional options revealed based on category choice
- **Contextual Help**: Tooltips and help text update based on selected category
- **Preview Integration**: Template preview reflects category-specific formatting

**Interaction States**:
- **Default State**: First option (Form) pre-selected for new users
- **Hover State**: Enhanced visual cues and help text display
- **Selected State**: Clear indication with icon and background highlighting
- **Error State**: Validation messages for incompatible selections

#### Consistent Implementation Across Modals

**Modal Coverage**:
- ✅ **CreateNewTemplateModal**: Primary template creation interface
- ✅ **DocumentUploadModal**: Document processing with category assignment
- ✅ **AITemplateModal**: AI-generated templates with category selection

**Implementation Consistency**:
- **Shared Component**: `DocumentCategorySelector` component reused across modals
- **Standard Props**: Consistent prop interface for category selection
- **Event Handling**: Unified event handling for category changes
- **State Management**: Centralized state management for selected category

**Benefits Achieved**:
- **Standardization**: Consistent categorization across all document workflows
- **User Experience**: Intuitive selection interface with clear visual feedback
- **Backend Integration**: Proper routing and processing based on document type
- **Scalability**: Easy addition of new categories through configuration
- **Compliance**: Audit trails and proper categorization for regulatory requirements

### Discipline-Specific Access (2025-12-12 Update)
Similar to template management, the task management system now supports discipline-specific access:

#### **Task Management URLs**
- **All Tasks**: `/my-tasks` (default view)
- **Civil Engineering Tasks**: `/my-tasks?discipline=00850`
- **Procurement Tasks**: `/my-tasks?discipline=01900`
- **Safety Tasks**: `/my-tasks?discipline=02400`

#### **Accordion Integration**
Each discipline section provides direct access to discipline-specific tasks:
- **Civil Engineering** → `/my-tasks?discipline=00850`
- **Procurement** → `/my-tasks?discipline=01900`
- **Safety** → `/my-tasks?discipline=02400`

#### **Implementation Pattern**
Both template and task management now follow the same URL parameter pattern for discipline filtering, providing consistent user experience across governance-level pages.

### Core Features

#### 1. Template Lifecycle Management
- **Create**: Design new templates with drag-and-drop form builders
- **Edit**: Modify existing templates with full configuration access
- **Preview**: View rendered HTML output in new browser tabs
- **Publish**: Change template status from draft to published
- **Delete**: Soft-delete templates (marked as inactive)

#### 2. AI-Powered Template Generation
- **Template Types**: Forms, assessments, policies, procedures, certificates
- **Complexity Levels**: Simple, intermediate, advanced
- **Field Count Options**: 5-10, 10-20, 20-50 fields
- **Feature Toggles**: Validation, file uploads, conditional logic, calculations

#### 3. Bulk Template Operations
- **Bulk Copy**: Copy published templates to multiple projects
- **Project Assignment**: Assign templates to specific construction projects
- **Discipline Mapping**: Automatic routing to discipline-specific tables

#### 4. Advanced Filtering and Search
- **Text Search**: Search templates by name, description, or content
- **Status Filtering**: Filter by draft, published, or processing status
- **Discipline Filtering**: Filter by engineering discipline
- **Organization Scoping**: Respect organization boundaries

### Technical Implementation

#### State Management
```javascript
const [templates, setTemplates] = useState([]);
const [disciplines, setDisciplines] = useState([]);
const auth = useAuth();
const database = useDatabase();
const [activeOrganization, setActiveOrganization] = useState(null);
const [stats, setStats] = useState({ total: 0, draft: 0, published: 0, processing: 0 });
```

#### Key Components Integration
- **TemplateStatsCards**: Dashboard showing template counts by status
- **TemplateFilters**: Advanced filtering and search controls
- **TemplateTable**: Data table with bulk selection capabilities
- **TemplateModal**: Form creation and editing interface
- **AITemplateModal**: AI-powered template generation
- **BulkTemplateCopyModal**: Project assignment interface

#### Error Handling and Logging
- **EnhancedTemplateLogger**: Comprehensive logging framework
- **ErrorBoundary**: React error boundary with recovery options
- **Health Checks**: Database connectivity monitoring
- **Toast Notifications**: User feedback system

### Code Structure

#### Imports and Dependencies
```javascript
import React, { useState, useEffect, useCallback } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import supabaseClient from "@lib/supabaseClient.js";
import templateGenerationService from "../../../services/templateGenerationService.js";
```

#### Component Architecture
- **Main Component**: TemplateManagementPage with full state management
- **Modal Components**: Separate components for different modal types
- **Utility Functions**: Helper functions for data processing and validation
- **Service Integration**: External services for AI generation and database operations

#### Lifecycle Methods
1. **Initialization**: Settings manager and user authentication setup
2. **Data Fetching**: Templates, disciplines, and user projects loading
3. **State Updates**: Real-time updates based on user interactions
4. **Cleanup**: Proper resource cleanup on component unmount

### Database Integration

#### Primary Table
```sql
templates
```
- Unified table storing all forms, templates, and workflows
- Supports organization and discipline scoping
- Tracks creation, modification, and publication status
- Single source of truth for all template management

#### Related Tables
- **`prompts`**: Dedicated table for AI prompt storage and management
- **`form_instances`**: Form submission data and processing results
- **`document_processing_log`**: Audit trail for document processing operations

#### Key Database Fields
- `name`: Human-readable template identifier (formerly `template_name`)
- `type`: Template type ('form', 'template', 'workflow')
- `organization_id`: UUID reference to organization
- `discipline_code`: Discipline identifier (formerly `discipline_id`)
- `prompt_template`: HTML/form content (stores HTML for forms)
- `validation_config`: JSON schema for forms (formerly `json_schema`)
- `processing_status`: Status ('draft', 'published', 'archived')
- `created_by`: User who created the template

### AI Integration

#### Template Generation Service
- **Input Parameters**: Template type, description, discipline, complexity
- **Output Format**: Structured template with sections and fields
- **Validation**: Automatic field validation and error checking

#### AI Features
- **Dynamic Field Generation**: Context-aware form field creation
- **Content Analysis**: Template content optimization
- **Discipline-Specific Logic**: Tailored templates per engineering discipline

### Security and Permissions

#### Access Control
- **User Authentication**: Supabase authentication integration
- **Organization Scoping**: Templates scoped to user organizations
- **Role-Based Access**: Different permissions for viewing/editing
- **Audit Trails**: Comprehensive logging of template operations

#### Data Protection
- **Input Sanitization**: XSS prevention and data validation
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Safe file handling for template assets

### Performance Optimization

#### Loading Strategies
- **Lazy Loading**: Components loaded on demand
- **Pagination**: Large dataset handling
- **Caching**: Template data caching for faster access
- **Background Processing**: Non-blocking operations

#### Rendering Optimizations
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: Efficient large list rendering
- **Debounced Search**: Optimized search performance

### User Interface Design

#### Layout Structure
- **Header Section**: Action buttons and page title
- **Stats Dashboard**: Template statistics cards
- **Filters Bar**: Search and filtering controls
- **Data Table**: Template listing with actions
- **Modal System**: Overlay interfaces for operations

#### Visual Design
- **Color Scheme**: Orange (#ffa500) and blue (#4A89DC) theme
- **Typography**: System fonts with consistent sizing
- **Responsive Design**: Mobile-friendly layout
- **Accessibility**: WCAG compliance

### Advanced Features

#### Template Preview System
- **HTML Rendering**: Full HTML preview in new tabs
- **Markdown Support**: Automatic markdown to HTML conversion
- **Error Handling**: Graceful preview failure handling
- **Cross-browser Compatibility**: Consistent preview across browsers

#### Bulk Operations
- **Multi-selection**: Checkbox-based template selection
- **Batch Processing**: Efficient bulk copy operations
- **Progress Tracking**: Real-time operation status
- **Error Recovery**: Partial failure handling

#### Template Versioning
- **Change Tracking**: Template modification history
- **Rollback Support**: Previous version restoration
- **Conflict Resolution**: Concurrent edit handling

### Integration Points

#### Related Systems
- **Accordion Navigation**: Integrated navigation system
- **Settings Manager**: User preferences and configuration
- **Organization Service**: Multi-tenant organization support
- **Discipline Service**: Engineering discipline management
- **Procurement Orders**: Create Order Modal loads procurement templates directly from templates table

#### External Services
- **Supabase**: Database operations and real-time updates
- **Template Generation AI**: AI-powered template creation
- **File Storage**: Template asset management
- **Document Browser**: Select Documents modal loads templates by type (procurement, scope_of_work, engineering)

### Testing and Quality Assurance

#### Component Testing
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Complete user workflow testing

#### Performance Testing
- **Load Testing**: Concurrent user handling
- **Memory Testing**: Memory leak detection
- **Network Testing**: Offline and slow connection handling

### Monitoring and Analytics

#### Usage Tracking
- **Template Usage**: Template access and modification tracking
- **Performance Metrics**: Page load times and responsiveness
- **Error Monitoring**: Exception tracking and alerting
- **User Behavior**: Analytics for user interaction patterns

#### Health Monitoring
- **Database Health**: Connection and query performance
- **API Health**: External service availability
- **System Resources**: Memory and CPU usage monitoring

### Maintenance and Support

#### Documentation
- **Inline Comments**: Comprehensive code documentation
- **API Documentation**: Service integration guides
- **User Guides**: End-user operation instructions
- **Troubleshooting**: Common issue resolution guides

#### Support Features
- **Error Boundaries**: Graceful error handling with recovery
- **Debug Tools**: Development debugging utilities
- **Logging System**: Comprehensive operation logging
- **Help System**: Context-sensitive help integration

### Compliance and Standards

#### Development Standards
- **ES6+ Syntax**: Modern JavaScript standards
- **React Best Practices**: Component design patterns
- **Code Quality**: ESLint and Prettier compliance
- **Security Standards**: OWASP security guidelines

#### Accessibility
- **WCAG 2.1**: Web accessibility standards
- **Keyboard Navigation**: Full keyboard operation support
- **Screen Reader**: Screen reader compatibility
- **Color Contrast**: Sufficient color contrast ratios

---

## 📋 **Tables Used in Template Management Workflow**

### **Primary Tables**

#### **1. `templates`**
**Purpose**: Unified template storage across all disciplines
**Location**: `server/sql/unified-templates-schema.sql`
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped template access

**Schema Validation** (MANDATORY - Run before any operations):
```sql
-- CRITICAL: Run comprehensive schema validation
DO $$
DECLARE
    required_columns TEXT[] := ARRAY['id', 'name', 'type', 'organization_id', 'created_by'];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_info RECORD;
BEGIN
    RAISE NOTICE '🔍 TEMPLATES TABLE SCHEMA VALIDATION';

    -- Verify table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates' AND table_schema = 'public') THEN
        RAISE EXCEPTION '❌ CRITICAL: templates table does not exist. Run unified templates deployment first.';
    END IF;

    -- Check required columns exist with correct types
    FOREACH col_info IN
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'templates' AND table_schema = 'public'
    LOOP
        -- Validate critical columns
        IF col_info.column_name = 'id' AND col_info.data_type != 'uuid' THEN
            RAISE EXCEPTION '❌ CRITICAL: id column must be UUID type';
        END IF;
        IF col_info.column_name = 'organization_id' AND col_info.data_type != 'uuid' THEN
            RAISE EXCEPTION '❌ CRITICAL: organization_id column must be UUID type';
        END IF;
        IF col_info.column_name = 'metadata' AND col_info.data_type != 'jsonb' THEN
            RAISE EXCEPTION '❌ CRITICAL: metadata column must be JSONB type';
        END IF;
    END LOOP;

    -- Check foreign key relationships
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'templates'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'organization_id'
    ) THEN
        RAISE EXCEPTION '❌ CRITICAL: organization_id foreign key constraint missing';
    END IF;

    RAISE NOTICE '✅ SCHEMA VALIDATION COMPLETE - templates table ready';
END $$;
```

**Critical Fields**:
- `name`: Template display name (formerly template_name)
- `type`: Template category ('form', 'template', 'scope_of_work')
- `discipline`: Discipline identifier ('Procurement', 'Contracts', etc.)
- `processing_status`: Publication status ('draft', 'published')
- `metadata`: JSONB field for discipline-specific data

#### **2. `discipline_document_sections`**
**Purpose**: Discipline-specific document section configurations
**Location**: `server/sql/discipline_document_sections_schema.sql`
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped section access

#### **3. `organizations`**
**Purpose**: Organization definitions for multi-tenant scoping
**Dependencies**: None (base table)
**RLS Policy**: User organization membership access

### **Related Tables**

#### **4. `user_organization_access`**
**Purpose**: User organization membership for RLS policies
**Dependencies**: `organizations(id)`
**RLS Policy**: User-based access control

#### **5. `disciplines`**
**Purpose**: Discipline definitions and metadata
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped discipline access

#### **6. `user_roles` & `role_definitions`**
**Purpose**: User permissions and role-based access control
**Dependencies**: User management system
**RLS Policy**: Permission-based feature access

### **Data Flow Architecture**

#### **Template Creation Flow**
1. **Client Request**: POST to `/api/templates` with template data
2. **Server Validation**: Organization context and discipline validation
3. **Database Insert**: Template stored with organization scoping
4. **Response**: Created template with enhanced metadata

#### **Discipline Section Loading Flow**
1. **Client Request**: GET `/api/discipline-document-sections?discipline=01900`
2. **Server Validation**: Organization access verification
3. **Database Query**: Filter sections by discipline and organization
4. **Response**: Section configurations with document type options

### **Security Model**

#### **RLS Policies Applied**
```sql
-- Organization-scoped template access
CREATE POLICY "templates_access" ON templates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_access
      WHERE user_id = auth.uid()::text
    )
  );

-- Discipline-specific section access
CREATE POLICY "discipline_sections_access" ON discipline_document_sections
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_access
      WHERE user_id = auth.uid()::text
    )
  );

-- Governance admin management
CREATE POLICY "governance_template_admin" ON templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()::text
      AND ur.department_code = '01300'
    )
  );

-- Development bypass
CREATE POLICY "dev_mode_templates" ON templates
  FOR ALL USING (current_setting('app.is_development_mode', true) = 'true');
```

#### **🔗 Cross-References to RLS Security Procedures**

**→ `0000_TABLE_POLICIES_SECURITY_PROCEDURE.md`** - Comprehensive RLS policy patterns and security management
- **Organization-Based Access**: See Pattern 3 - Multi-tenant organization isolation
- **Development Mode Bypass**: See Pattern 1 - Development mode bypass policies
- **Authenticated User Policies**: See Pattern 5 - Basic authentication check
- **Governance Role Management**: User role and permission patterns
- **Emergency Troubleshooting**: Policy debugging and lockout recovery

**→ `0000_SQL_EXECUTION_PROCEDURE.md`** - SQL deployment validation and RLS policy testing
- **RLS Policy Verification**: Mandatory post-deployment security audit
- **Schema Compatibility**: Handling different database configurations
- **Security Compliance**: RLS implementation validation checklist

**Key Security Patterns Used:**
- **✅ Organization Isolation**: Multi-tenant data separation (Pattern 3)
- **✅ Development Bypass**: Auth bypass for development (Pattern 1)
- **✅ Authenticated Access**: User authentication requirements (Pattern 5)
- **✅ Role-Based Permissions**: Governance user management

## 🗂️ **Discipline-Specific Document Sections (2025-12-12)**

### **Flexible Document Section Architecture**
The template management system now supports fully adaptable, discipline-specific document sections that replace rigid naming conventions:

#### **Database Schema**
```sql
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
```

#### **Dynamic Section Loading**
```javascript
// Load discipline-specific document sections
const loadDisciplineDocumentSections = async (disciplineCode) => {
  const response = await fetch(`/api/discipline-document-sections?discipline=${disciplineCode}`);
  return response.json();
};
```

#### **Example Discipline Configurations**

**Procurement (01900):**
- Appendix A: Technical Specifications (specs, requirements, standards)
- Appendix B: Quality Requirements (quality, testing, acceptance)
- Appendix C: Compliance Standards (compliance, regulations, certifications)
- Appendix D: Testing Procedures (testing, validation, inspection)
- Appendix E: Maintenance Requirements (maintenance, support, training)
- Appendix F: Commercial Terms (pricing, terms, conditions)

**Contracts (00435):**
- Schedule 1: Schedule of Rates (rates, pricing, quantities)
- Schedule 2: Conditions of Contract (conditions, terms, obligations)
- Appendix A: Technical Specifications (specs, requirements, drawings)

**Safety (02400):**
- Attachment 1: Risk Assessment (risk, hazards, mitigation)
- Attachment 2: Method Statement (methods, procedures, safety)

#### **UI Implementation**
```javascript
// Dynamic section buttons in template management
const DocumentSectionsDropdown = ({ disciplineCode }) => {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    loadDisciplineDocumentSections(disciplineCode)
      .then(setSections);
  }, [disciplineCode]);

  return (
    <div className="document-sections-dropdown">
      {sections.map(section => (
        <button
          key={section.code}
          className="section-button"
          onClick={() => openSectionModal(section)}
        >
          {getSectionTypeIcon(section.type)} {section.code.toUpperCase()}: {section.name}
          {section.required && <span className="required-indicator">*</span>}
          <span className="type-count">({section.available_document_types.length} types)</span>
        </button>
      ))}
    </div>
  );
};
```

### **Template Creation with Section Context**
Templates are now created with awareness of their document section context:

```javascript
const createTemplateWithSections = async (templateData, disciplineCode) => {
  const sections = await loadDisciplineDocumentSections(disciplineCode);

  const enhancedTemplate = {
    ...templateData,
    discipline_code: disciplineCode,
    document_sections: sections,
    section_requirements: sections.filter(s => s.required),
    available_section_types: [...new Set(sections.map(s => s.type))]
  };

  return await saveTemplate(enhancedTemplate);
};
```

### **Benefits of Adaptable System**

- **✅ Discipline-Specific**: Each discipline defines its own document structure
- **✅ Flexible Naming**: Contracts use Schedules, Safety uses Attachments, etc.
- **✅ Extensible**: Easy to add new section types without code changes
- **✅ Configurable**: Admins can customize sections per organization
- **✅ Validated**: Templates validate against discipline-specific requirements
- **✅ Future-Proof**: Supports any document section naming convention

## 🔧 **Revised Approach: Explicit Complexity Specification (2025-12-16)**

### Template Creation Process (Business-Driven, Not AI-Inferred)

**Critical Revision**: Complexity is now explicitly specified by business stakeholders during template creation, rather than being inferred by AI algorithms. This ensures predictable workflow behavior and proper business control over process complexity.

#### Template Complexity Specification

**Template creators explicitly define complexity level through metadata**:

```json
{
  "complexity_level": "complex",
  "workflow_metadata": {
    "appendices_required": ["A", "B", "C", "D", "E", "F"],
    "disciplines_required": ["01900", "02400", "00800", "01300"],
    "approval_levels": 3,
    "estimated_duration_hours": 12,
    "business_rules": {
      "requires_multi_discipline": true,
      "requires_executive_approval": true,
      "requires_compliance_review": false
    }
  }
}
```

#### Template Categories by Explicit Complexity

**1. Simple Procurement Templates**
```json
{
  "complexity_level": "simple",
  "workflow_metadata": {
    "appendices_required": ["A", "C"],
    "disciplines_required": ["01900"],
    "approval_levels": 1,
    "estimated_duration_hours": 3
  }
}
```
*Templates for: Office supplies, basic materials, routine services*

**2. Standard Procurement Templates**
```json
{
  "complexity_level": "standard",
  "workflow_metadata": {
    "appendices_required": ["A", "B", "C", "E"],
    "disciplines_required": ["01900", "02400"],
    "approval_levels": 2,
    "estimated_duration_hours": 6
  }
}
```
*Templates for: IT equipment, professional services, construction materials*

**3. Complex Procurement Templates**
```json
{
  "complexity_level": "complex",
  "workflow_metadata": {
    "appendices_required": ["A", "B", "C", "D", "E", "F"],
    "disciplines_required": ["01900", "02400", "00800", "01300", "02200"],
    "approval_levels": 3,
    "estimated_duration_hours": 12
  }
}
```
*Templates for: Major equipment, turnkey systems, multi-discipline projects*

**4. Emergency Procurement Templates**
```json
{
  "complexity_level": "emergency",
  "workflow_metadata": {
    "appendices_required": ["A", "B", "C"],
    "disciplines_required": ["01900", "02400"],
    "approval_levels": 1,
    "estimated_duration_hours": 2,
    "business_rules": {
      "priority_routing": true,
      "skip_non_critical_reviews": true
    }
  }
}
```
*Templates for: Critical repairs, disaster recovery, urgent requirements*

**5. Compliance Procurement Templates**
```json
{
  "complexity_level": "compliance",
  "workflow_metadata": {
    "appendices_required": ["A", "B", "C", "F"],
    "disciplines_required": ["01900", "01300", "02400"],
    "approval_levels": 3,
    "estimated_duration_hours": 9,
    "business_rules": {
      "requires_compliance_review": true,
      "requires_audit_trail": true,
      "requires_regulatory_approval": true
    }
  }
}
```
*Templates for: Medical equipment, environmental compliance, government-regulated procurement*

#### Implementation Changes

**1. Template Creation UI Enhancement**
- Add explicit complexity level selector during template creation
- Show workflow implications of selected complexity
- Require business justification for complexity selection

**2. Metadata Validation**
- Validate that template metadata matches declared complexity level
- Ensure appendices_required aligns with complexity expectations
- Verify disciplines_required matches workflow needs

**3. Business Rules Engine**
```javascript
// Explicit business rules based on declared complexity
const getWorkflowRules = (complexityLevel, metadata) => {
  const rules = {
    simple: {
      maxAppendices: 3,
      maxDisciplines: 1,
      maxApprovalLevels: 1,
      requiresHITL: false
    },
    standard: {
      maxAppendices: 5,
      maxDisciplines: 3,
      maxApprovalLevels: 2,
      requiresHITL: true
    },
    complex: {
      maxAppendices: 10,
      maxDisciplines: 5,
      maxApprovalLevels: 4,
      requiresHITL: true
    },
    emergency: {
      maxAppendices: 4,
      maxDisciplines: 2,
      maxApprovalLevels: 2,
      requiresHITL: false,
      priorityRouting: true
    },
    compliance: {
      maxAppendices: 10,
      maxDisciplines: 4,
      maxApprovalLevels: 4,
      requiresHITL: true,
      requiresAudit: true
    }
  };

  return rules[complexityLevel] || rules.standard;
};
```

#### Benefits of Explicit Approach

1. **Business Control**: Procurement managers explicitly decide workflow complexity
2. **Auditability**: Complexity decisions are documented and traceable
3. **Consistency**: Same complexity level always triggers same workflow
4. **Quality Assurance**: Templates validated against complexity requirements
5. **Training**: Clear guidelines for template creators

---

## Related Documentation

- [1300_01300_MASTER_GUIDE_FORM_CREATION.md](1300_01300_MASTER_GUIDE_FORM_CREATION.md) - Form creation component details
- [1300_00000_PAGE_LIST.md](1300_00000_PAGE_LIST.md) - Complete page catalog
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system
- [0700_UI_SETTINGS.md](0700_UI_SETTINGS.md) - UI settings and configuration
- [0300_PROCUREMENT_TEMPLATES_TO_UNIFIED_MIGRATION.md](../0300_PROCUREMENT_TEMPLATES_TO_UNIFIED_MIGRATION.md) - Unified templates migration

---

*This guide provides comprehensive documentation for the Template Management System implementation. Last updated: 2025-12-12*

**Recent Update (2025-12-12)**: Added discipline-specific document sections architecture, documenting the flexible system that replaces rigid appendix naming with configurable, discipline-aware document structures.