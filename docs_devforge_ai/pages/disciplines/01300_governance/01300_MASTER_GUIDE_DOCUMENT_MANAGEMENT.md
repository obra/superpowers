# 1300_01300_MASTER_GUIDE_DOCUMENT_MANAGEMENT.md

## 📋 **Unified Document Management System**

### Overview
The Unified Document Management System provides a comprehensive interface for creating, managing, and monitoring custom forms, templates, appendices, schedules, specifications, and document generation workflows across the organization. This consolidated master guide combines form management, template management, and multi-category document capabilities into a single, cohesive system for governance-level operations.

**🎯 PURPOSE**: Central hub for all document operations within the governance discipline, supporting the complete lifecycle from creation through deployment and monitoring across all document types.

**✅ CURRENT STATUS (2025-12-12)**: Unified system fully operational with 6-category document support (Form, Template, Schedule, Timeline, Specification, Appendix), AI-powered document processing, and specialized appendix hybrid functionality.

## 📋 **Unified Document Management System**

### Overview
The Unified Document Management System provides a comprehensive interface for creating, managing, and monitoring custom forms, templates, appendices, schedules, specifications, and document generation workflows across the organization. This consolidated master guide combines form management, template management, and multi-category document capabilities into a single, cohesive system for governance-level operations.

**🎯 PURPOSE**: Central hub for all document operations within the governance discipline, supporting the complete lifecycle from creation through deployment and monitoring across all document types.

**✅ CURRENT STATUS (2025-12-12)**: Unified system fully operational with 5-category document support (Form, Template, Appendix, Schedule, Specification), AI-powered document processing, and integrated workflow management.

### Page Structure

#### File Location
```
client/src/pages/01300-governance/01300-form-management-page.js
```

#### Route
```
/form-management
```

### Core Components

#### 1. Page Header
- **Title**: "📋 Form Management System"
- **Subtitle**: "Create, manage, and monitor custom forms and templates across the organization"
- **Styling**: Centered layout with bottom border separator

#### 2. Tab Navigation System
The page features three main tabs:

##### 📝 Forms Library Tab
- **Purpose**: Primary interface for form management
- **Content**: Integrates the `FormCreationPage` component
- **Functionality**:
  - Create new forms
  - Edit existing forms
  - Manage form templates
  - Track form performance

##### 🔧 Template Builder Tab
- **Status**: Placeholder for future development
- **Purpose**: Advanced template creation and customization
- **Features** (Planned):
  - Drag-and-drop template building
  - Department-specific workflows
  - Reusable template library

##### 📊 Analytics Tab
- **Status**: Placeholder for future development
- **Purpose**: Form performance monitoring and reporting
- **Features** (Planned):
  - Submission rate tracking
  - User engagement metrics
  - Form completion analytics
  - Performance dashboards

### Technical Implementation

#### State Management
```javascript
const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
const [activeTab, setActiveTab] = useState("forms");
```

#### Settings Manager Integration
- **Initialization**: Asynchronous settings loading
- **Error Handling**: Graceful fallback to defaults
- **Cleanup**: Proper component unmounting

#### Component Architecture
- **FormCreationPage Integration**: Direct embedding of form creation functionality
- **Tab-based Navigation**: Client-side routing between different sections
- **Responsive Design**: Mobile-friendly layout

### Standard Page Features

#### Mandatory Components
- **Accordion System**: Integrated via `AccordionProvider` and `AccordionComponent`
- **Settings Manager**: Full initialization and application
- **Logout Button**: Fixed position logout functionality
- **Page Naming**: `window.pageName = "01300-form-management-page"`

#### Styling Approach
- **CSS-in-JS**: Inline styles for component-specific styling
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Proper contrast ratios and keyboard navigation

### Code Structure

#### Imports
```javascript
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "../../modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "../../modules/accordion/context/00200-accordion-context.js";
import settingsManager from "../../common/js/ui/00200-ui-display-settings.js";
import FormCreationPage from "./components/01300-form-creation-page.js";
```

#### Component Lifecycle
1. **Mounting**: Settings initialization and page setup
2. **Rendering**: Conditional rendering based on initialization state
3. **Unmounting**: Cleanup of global state

#### Error Handling
- Settings initialization errors logged but don't break the page
- Graceful degradation to default settings
- Console logging for debugging purposes

## 📋 **Tables Used in Form Management Workflow**

### **Primary Tables**

#### **1. `templates`**
**Purpose**: Unified storage for forms and templates
**Location**: `server/sql/unified-templates-schema.sql`
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped form/template access

**Schema Validation** (MANDATORY - Run before any operations):
```sql
-- CRITICAL: Run comprehensive schema validation for forms
DO $$
DECLARE
    required_columns TEXT[] := ARRAY['id', 'name', 'type', 'organization_id', 'html_content'];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_info RECORD;
BEGIN
    RAISE NOTICE '🔍 FORMS TEMPLATES SCHEMA VALIDATION';

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
        -- Validate critical columns for forms
        IF col_info.column_name = 'id' AND col_info.data_type != 'uuid' THEN
            RAISE EXCEPTION '❌ CRITICAL: id column must be UUID type';
        END IF;
        IF col_info.column_name = 'html_content' AND col_info.data_type != 'text' THEN
            RAISE EXCEPTION '❌ CRITICAL: html_content column must be TEXT type for form storage';
        END IF;
        IF col_info.column_name = 'validation_config' AND col_info.data_type != 'jsonb' THEN
            RAISE EXCEPTION '❌ CRITICAL: validation_config column must be JSONB type for form validation';
        END IF;
    END LOOP;

    RAISE NOTICE '✅ SCHEMA VALIDATION COMPLETE - templates table ready for forms';
END $$;
```

**Critical Fields for Forms**:
- `html_content`: Form HTML structure and fields
- `validation_config`: JSONB schema for form validation rules
- `type`: Set to 'form' for form templates
- `metadata.form_fields`: Array of form field definitions

#### **2. `form_instances`**
**Purpose**: Storage of submitted form data and responses
**Location**: `server/sql/form-instances-schema.sql`
**Dependencies**: `templates(id)`, `organizations(id)`
**RLS Policy**: Organization-scoped form submission access

#### **3. `discipline_document_sections`**
**Purpose**: Form section configurations within disciplines
**Location**: `server/sql/discipline_document_sections_schema.sql`
**Dependencies**: `organizations(id)`
**RLS Policy**: Organization-scoped section access

### **Related Tables**

#### **4. `organizations`**
**Purpose**: Organization definitions for multi-tenant scoping
**Dependencies**: None (base table)
**RLS Policy**: User organization membership access

#### **5. `user_organization_access`**
**Purpose**: User organization membership for RLS policies
**Dependencies**: `organizations(id)`
**RLS Policy**: User-based access control

#### **6. `document_processing_log`**
**Purpose**: Audit trail for form processing and AI operations
**Dependencies**: `templates(id)`
**RLS Policy**: Organization-scoped processing log access

### **Data Flow Architecture**

#### **Form Creation Flow**
1. **Client Request**: POST to `/api/templates` with form configuration
2. **Server Validation**: Form structure and organization context validation
3. **Database Insert**: Form stored with HTML content and validation schema
4. **Response**: Created form template with field definitions

#### **Form Submission Flow**
1. **Client Request**: POST to `/api/form-instances` with form data
2. **Server Validation**: Form field validation against schema
3. **Database Insert**: Form submission stored with responses
4. **Response**: Submission confirmation with processing status

### **Security Model**

#### **RLS Policies Applied**
```sql
-- Organization-scoped form access
CREATE POLICY "form_templates_access" ON templates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_access
      WHERE user_id = auth.uid()::text
    )
    AND type = 'form'
  );

-- Form submission access
CREATE POLICY "form_instances_access" ON form_instances
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_access
      WHERE user_id = auth.uid()::text
    )
  );

-- Processing log access
CREATE POLICY "form_processing_access" ON document_processing_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_access
      WHERE user_id = auth.uid()::text
    )
  );

-- Development bypass for forms
CREATE POLICY "dev_mode_forms" ON templates
  FOR ALL USING (
    current_setting('app.is_development_mode', true) = 'true'
    AND type = 'form'
  );
```

#### **🔗 Cross-References to RLS Security Procedures**

**→ `0000_TABLE_POLICIES_SECURITY_PROCEDURE.md`** - Comprehensive RLS policy patterns and security management
- **Organization-Based Access**: See Pattern 3 - Multi-tenant organization isolation
- **Development Mode Bypass**: See Pattern 1 - Development mode bypass policies
- **Service Role Override**: See Pattern 2 - Server-side operation access
- **Complex Multi-Condition Policies**: See Pattern 6 - Combined access rules
- **Form-Specific Security**: Template type filtering patterns

**→ `0000_SQL_EXECUTION_PROCEDURE.md`** - SQL deployment validation and RLS policy testing
- **RLS Policy Verification**: Mandatory post-deployment security audit
- **Schema Compatibility**: Handling different database configurations
- **Type-Specific Policies**: Form vs template policy differentiation

**Key Security Patterns Used:**
- **✅ Organization Isolation**: Multi-tenant data separation (Pattern 3)
- **✅ Development Bypass**: Auth bypass for development (Pattern 1)
- **✅ Type-Based Filtering**: Form-specific access control
- **✅ Audit Trail Access**: Processing log security

### Enhanced Document Section Integration (2025-12-12)

#### Discipline-Specific Form Sections
Forms now integrate with the flexible document section system, allowing forms to be created for specific document sections within disciplines:

```javascript
// Form creation with document section context
const createFormForSection = async (disciplineCode, sectionCode) => {
  const sections = await loadDisciplineDocumentSections(disciplineCode);
  const targetSection = sections.find(s => s.section_code === sectionCode);

  const formConfig = {
    discipline: disciplineCode,
    section: targetSection,
    available_document_types: targetSection.available_document_types,
    validation_rules: targetSection.validation_rules,
    required_fields: targetSection.required_fields || []
  };

  return await createForm(formConfig);
};
```

#### Dynamic Form Field Generation
Forms automatically adapt their fields based on the document section type:

```javascript
// Example: Appendix A Technical Specifications form
const technicalSpecsForm = {
  section_type: 'appendix',
  section_code: 'appendix_a',
  document_types: ['specifications', 'requirements', 'standards'],
  fields: [
    { name: 'product_name', type: 'text', required: true },
    { name: 'specifications', type: 'textarea', required: true },
    { name: 'compliance_standards', type: 'multiselect', required: false },
    { name: 'testing_requirements', type: 'textarea', required: false }
  ]
};
```

#### Section-Aware Form Validation
```javascript
const validateFormForSection = (formData, sectionConfig) => {
  const errors = [];

  // Check required fields for this section
  sectionConfig.required_fields.forEach(field => {
    if (!formData[field]) {
      errors.push(`${field} is required for ${sectionConfig.section_name}`);
    }
  });

  // Apply section-specific validation rules
  if (sectionConfig.validation_rules) {
    // Custom validation logic here
  }

  return errors;
};
```

### Future Development Roadmap

#### Template Builder Enhancement
- Visual drag-and-drop interface
- Template versioning system
- **Department-specific template libraries** ✅ *Enhanced with discipline sections*
- Advanced customization options

#### Analytics Dashboard
- Real-time form metrics
- User behavior tracking
- Performance optimization suggestions
- Export capabilities for reports

#### Advanced Features
- Form approval workflows
- Multi-language support
- **Integration with external systems** ✅ *Document section integration*
- Mobile form optimization
- **Section-specific form generation** ✅ *New feature added*

### Document Category Selection System (2025-12-12)

#### Radio Button Interface for Template Categories

**Status**: ✅ IMPLEMENTED - Radio button selection system deployed across template creation modals

**Overview**: A unified radio button interface provides users with 5 standardized document category options during template creation, ensuring consistent categorization and routing across all document workflows.

##### Available Document Categories

1. **📝 Form** - Interactive questionnaires and data collection forms
   - **Use Case**: User input collection, surveys, assessments
   - **Backend Routing**: Routes to form processing pipeline
   - **Modal Title**: "Create New Form"

2. **📄 Template** - Reusable document templates and frameworks
   - **Use Case**: Standardized document structures for contracts, reports, specifications
   - **Backend Routing**: Routes to template management system
   - **Modal Title**: "Create New Template"

3. **📅 Schedule** - Document schedules (payment, procurement, delivery schedules)
   - **Use Case**: Structured schedule documentation, payment plans, procurement timelines
   - **Backend Routing**: Routes to scheduling and project management systems
   - **Modal Title**: "Create New Schedule"

4. **⏱️ Timeline** - Time-based schedules and project timelines
   - **Use Case**: Gantt charts, project timelines, construction sequencing, calendar-based planning
   - **Backend Routing**: Routes to timeline management and project scheduling systems
   - **Modal Title**: "Create New Timeline"

5. **📐 Specification** - Technical and functional requirements
   - **Use Case**: Detailed technical specs, quality standards, performance criteria
   - **Backend Routing**: Routes to specification management and compliance systems
   - **Modal Title**: "Create New Specification"

6. **📎 Appendix** - Hybrid form and template documents (specialized modal)
   - **Use Case**: Complex documents combining form data collection with template structure
   - **Backend Routing**: Routes to specialized AppendixModal for hybrid functionality
   - **Modal Title**: "Create Appendix"

##### User Interface Implementation

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

##### Backend Routing Logic

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

##### Visual Indicators and User Interaction Patterns

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

##### Consistent Implementation Across Modals

**Modal Coverage**:
- ✅ **CreateNewTemplateModal**: Primary template creation interface
- ✅ **DocumentUploadModal**: Document processing with category assignment
- ✅ **AITemplateModal**: AI-generated templates with category selection

**Benefits Achieved**:
- **Standardization**: Consistent categorization across all document workflows
- **User Experience**: Intuitive selection interface with clear visual feedback
- **Backend Integration**: Proper routing and processing based on document type
- **Scalability**: Easy addition of new categories through configuration
- **Compliance**: Audit trails and proper categorization for regulatory requirements

### Integration Points

#### Related Components
- `FormCreationPage`: Core form creation functionality
- `AccordionComponent`: Navigation and UI consistency
- `settingsManager`: User preferences and configuration

#### Database Integration
- Form templates storage
- User permissions and access control
- Form submission tracking
- Analytics data collection

### Performance Considerations

#### Optimization Features
- Lazy loading of tab content
- Efficient state management
- Minimal re-renders
- Proper cleanup on unmount

#### Loading States
- Settings initialization indicator
- Tab content loading placeholders
- Graceful error states

### Security Considerations

#### Access Control
- User authentication verification
- Role-based permissions
- Form data encryption
- Audit trail logging

#### Data Protection
- Input validation and sanitization
- XSS prevention
- CSRF protection
- Secure API communications

### Testing and Quality Assurance

#### Component Testing
- Unit tests for state management
- Integration tests for component interactions
- E2E tests for complete workflows

#### Performance Testing
- Load testing for concurrent users
- Memory leak detection
- Bundle size optimization

### Maintenance and Support

#### Documentation
- Inline code comments
- Component usage notes
- API documentation
- Troubleshooting guides

#### Monitoring
- Error tracking and reporting
- Performance metrics collection
- User feedback integration
- Regular maintenance schedules

### Compliance and Standards

#### Coding Standards
- ES6+ syntax compliance
- React best practices
- Accessibility guidelines (WCAG)
- Performance optimization standards

#### Design Consistency
- Brand guideline adherence
- UI/UX pattern consistency
- Cross-browser compatibility
- Mobile responsiveness standards

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

---

## 🔗 **Template Management Integration**

### **Template Management System Integration**
The unified system now includes comprehensive template management capabilities alongside form management:

#### **Core Template Features**
- **Template Lifecycle Management**: Create, edit, publish, delete templates
- **AI-Powered Generation**: Machine learning-assisted template creation
- **Bulk Operations**: Mass deployment to multiple disciplines/projects
- **Version Control**: Template versioning with change tracking
- **Discipline Mapping**: Automatic routing to appropriate organizational units

#### **Template Types Supported**
- **Forms**: Interactive questionnaires and data collection forms
- **Templates**: Reusable document structures and frameworks
- **Appendices**: Supporting documentation and technical specifications
- **Schedules**: Timeline and milestone documentation
- **Specifications**: Technical and functional requirements

#### **Advanced Template Capabilities**
- **Real-time HTML Preview**: Live preview in new browser tabs
- **Template Statistics**: Usage tracking and performance metrics
- **Organization Scoping**: Multi-tenant template management
- **Discipline-Specific Filtering**: Context-aware template selection

---

## 📈 **Version History & Consolidation**

### **Consolidation Summary (2025-12-12)**
This master guide consolidates content from:
- **1300_MASTER_GUIDE_FORM_MANAGEMENT.md** (Primary form management)
- **1300_MASTER_GUIDE_TEMPLATE_MANAGEMENT.md** (Template management features)
- **1300_WORKFLOW_GENERATE_FORMS_FROM_UPLOADS.md** (Maintained separately for workflow focus)

**Benefits Achieved:**
- ✅ **Single Source of Truth**: Unified documentation for form and template management
- ✅ **Reduced Redundancy**: Eliminated duplicate content across guides
- ✅ **Improved Navigation**: Clear functional separation between management and workflows
- ✅ **Enhanced Maintainability**: Single guide to update for management features

### **Archived Content**
Previous standalone guides have been archived and their key content integrated into this consolidated guide. Cross-references have been updated to point to this unified documentation.

---

## Related Documentation

- [1300_01300_WORKFLOW_GENERATE_FORMS_FROM_UPLOADS.md](1300_01300_WORKFLOW_GENERATE_FORMS_FROM_UPLOADS.md) - Form generation workflow processes
- [1300_01300_MASTER_GUIDE_FORM_CREATION.md](1300_01300_MASTER_GUIDE_FORM_CREATION.md) - Form creation component details
- [1300_00000_PAGE_LIST.md](1300_00000_PAGE_LIST.md) - Complete page catalog
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system
- [0700_UI_SETTINGS.md](0700_UI_SETTINGS.md) - UI settings and configuration

---

*This consolidated guide provides comprehensive documentation for the Unified Form & Template Management System. Last updated: 2025-12-12*
