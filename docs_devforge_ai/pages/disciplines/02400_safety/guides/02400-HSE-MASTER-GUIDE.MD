# 1300_02400_HSE_MASTER_GUIDE.md - Safety/HSE Master Guide

## **CRITICAL: Discipline Dropdown Access Rules** 🔐

### **Governance Team Access (FULL ACCESS)**
- **✅ Can access ALL disciplines** via dropdowns: Civil Engineering, Procurement, HSSE Safety, Governance
- **✅ Full template creation rights** across all discipline types and organizations
- **✅ Administrative permissions** for managing document types across all disciplines
- **Scope**: See all disciplines in ALL modals regardless of navigation path

### **HSE Discipline Users Access (LIMITED TO HSE ONLY)**
- **❌ Limited to HSE discipline only** ("HSSE Safety" - cannot see other disciplines)
- **❌ Cannot create templates** for disciplines outside HSE assignment
- **❌ Read-only access** to published templates from other disciplines
- **Scope**: See only HSE templates ("safety" discipline/02400) regardless of modal

---
## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-10-31): Expanded from minimal fix doc to comprehensive HSE master guide
- v1.1 (2025-11-24): Added discipline dropdown access rules for HSE users (HSE-only limitation)

## Overview
Documentation for the Safety/HSE page (02400) covering safety management, HSE compliance, contractor vetting, and safety document templates.

## Page Structure
**File Location:** `client/src/pages/02400-safety`
```javascript
export default function SafetyPage() {
  return (
    <PageLayout>
      <SafetyDashboard />
      <ContractorVettingModule />
      <SafetyDocumentTemplates />
      <HSEComplianceTracking />
      {/* Modal Components */}
      <ContractorAssignmentModal />
      <SafetyInspectionModal />
      <IncidentReportModal />
    </PageLayout>
  );
}
```

## 🛡️ Safety Template Management

### Safety Template Fields & Display

**Database Schema Fields** (safety_templates table):
- `id`, `organization_id`, `discipline_id`
- `template_name`, `template_description`, `template_type`, `template_category`
- `template_content` (jsonb), `form_schema` (jsonb), `html_content`
- `risk_level`, `applicable_sites` (text[]), `required_certifications` (text[])
- `review_frequency`, `status`, `is_active`, `approval_status`, `version`, `is_latest`
- `created_by`, `created_at`, `updated_by`, `updated_at`, `approved_by`, `approved_at`
- `content_schema` (jsonb), `content_metadata` (jsonb)

**Currently Displayed in Table:**
- **Template Name** (template_name)
- **Type** (template_type) - formatted with underscores replaced by spaces and capitalized
- **Category** (template_category)
- **Risk Level** (risk_level) - color-coded badges (low=green, medium=yellow, high=orange, critical=red)
- **Status** (status) - color-coded badges
- **Assignment Status** (calculated field) - shows assignment count if assigned

**Additional Fields in Detail View:**
When viewing template details, these fields are shown:
- Template Name, Description, Type, Category
- Risk Level, Status, Version
- Applicable Sites, Required Certifications
- Review Frequency, Approval Status
- Created/Updated/Approved timestamps

**Hidden Fields** (available in data but not displayed):
- `applicable_sites`, `required_certifications`
- `review_frequency`, `content_schema`, `content_metadata`
- `form_schema`, `html_content`

**Safety Template Features:**
- `contractor_assignment`, `risk_assessment`, `compliance_tracking`, `emergency_response`, `incident_management`
- Categories: OPER, CONTRACT, EMERG, COMPLIANCE, TRAINING, INCIDENT, EQUIPMENT, HEALTH
- Template Types: jha, risk_assessment, contractor_vetting, ppe_evaluation, safety_plan, incident_report, audit_checklist, safety_manual, emergency_plan, training_record
- Custom Filters: assignment_status, certification_requirements, contractor_type, site_location

**Integration with HSE Systems:**
- Risk assessment integration with compliance tracking
- Contractor assignment workflows for safety qualification
- Emergency response planning and incident management
- Training record management and certification tracking

## Critical Questionnaire Display Fix

### Content Processing Architecture
**Breakthrough**: Questionnaires are not visual templates - they store JSON data for interactive forms.

| Content Type | Data Format | Renderer Purpose |
|-------------|-------------|------------------|
| **Templates** | HTML Markup | Browser visual display |
| **Questionnaires** | JSON Schema | Interactive form rendering |

### Renderer Expectations
**ContractorQuestionnaireRenderer** expects this JSON format:
```javascript
const parsedData = JSON.parse(questionnaireData.html_content);
const fields = parsedData.json.fields; // 82 HSE questions
```

### Technical Solution
- **Detection**: `form.name.includes('hsseqs24001')` → questionnaire processing
- **Schema Handling**: Extract from `schema.json.fields` array structure
- **Content Generation**: JSON with manual input fields (no AI placeholders)
- **Workflow**: Contractor manual input → server-side AI evaluation

**Resolved**: HSE questionnaires now display 82 interactive questions instead of test HTML inputs.

## Key Components

### ContractorVettingModule
**Location:** `client/src/pages/02400-safety/components/ContractorVettingModule.jsx`

Comprehensive contractor safety qualification system with:
- Automated vetting workflows
- Safety compliance tracking
- Certification validation
- Risk assessment integration

### SafetyDocumentTemplates
**Location:** `client/src/pages/02400-safety/components/SafetyDocumentTemplates.jsx`

Template management for HSE documentation including:
- JHA (Job Hazard Analysis) templates
- Risk assessment forms
- Safety plan templates
- Emergency response procedures
- Incident report templates

### HSEComplianceTracking
**Location:** `client/src/pages/02400-safety/components/HSEComplianceTracking.jsx`

Compliance monitoring and reporting system featuring:
- Regulatory requirement tracking
- Audit checklist management
- Compliance status monitoring
- Violation reporting and resolution

## 🏗️ Contractor Assignment System

### Assign to Contractor Button Implementation
The Safety templates page includes an advanced "Assign to Contractor" functionality that enables HSE managers to assign safety templates to contractors for evaluation and qualification.

**Button Specification:**
- **Text**: "Assign" (displayed as button text)
- **Icon**: `bi-person-plus` (bootstrap person-plus icon)
- **Color**: Orange (#FFA500) for HSE-specific branding
- **Location**: Actions column in template table rows
- **Modal**: Launches `01900-Assign-Contractor-Modal` (shared with procurement)

**Implementation Details:**
```javascript
// In client/src/common/components/templates/TemplateTable.jsx
{config.features.includes('contractor_assignment') && (
  <button
    onClick={() => onAssign(template)}
    style={{
      padding: '4px 8px',
      border: '1px solid #FFA500',
      backgroundColor: '#fff',
      color: '#FFA500',
      borderRadius: '4px'
    }}
    title="Assign to Contractor"
  >
    <i className="bi bi-person-plus"></i>
  </button>
)}
```

**Modal Integration:**
- Uses `01900-Assign-Contractor-Modal` for contractor selection and assignment
- Supports email-notification to selected contractors
- Creates evaluation packages with due dates and instructions
- Links templates to contractors for qualification workflows

**Configuration:**
Safety templates include `'contractor_assignment'` in their features array:
```javascript
// In client/src/common/js/config/templateDisciplineConfigs.js
export const disciplineConfigs = {
  safety: {
    features: [
      'contractor_assignment',    // ✅ Enables button
      'risk_assessment',
      'compliance_tracking',
      // ...
    ],
    // ...
  }
};
```

**Available for Safety Categories:**
- `CONTRACT` - Contractor Safety Qualification
- `COMPLIANCE` - Compliance & Audit templates
- `TRAINING` - Training & Competency documents
- `EQUIPMENT` - Equipment Safety evaluations

### Usage Workflow
1. Navigate to Safety Templates page (`#/templates/safety`)
2. Browse available HSE templates
3. Click "Assign" button on desired template
4. Select contractors from database list
5. Set due dates and assignment instructions
6. Choose evaluation context (contractor vetting, safety qualification, etc.)
7. Submit to create evaluation packages

### Integration Benefits
- **Streamlined Qualification**: Contractors receive standardized HSE evaluations
- **Compliance Tracking**: Automated qualification workflow management
- **Risk Assessment**: Integrated with safety risk evaluation processes
- **Audit Trail**: Complete assignment and completion tracking

## Safety Template Types

| Template Type | Purpose | Risk Level Support |
|---------------|---------|-------------------|
| `jha` | Job Hazard Analysis | High |
| `risk_assessment` | Risk Assessment | Critical |
| `contractor_vetting` | Contractor Safety Qualification | High |
| `ppe_evaluation` | Personal Protective Equipment | Medium |
| `safety_plan` | Safety Management Plans | High |
| `incident_report` | Incident Reporting | Critical |
| `audit_checklist` | Compliance Audits | Medium |
| `safety_manual` | Safety Manuals | Low |
| `emergency_plan` | Emergency Response | Critical |
| `training_record` | Training Documentation | Low |

## HSE Categories

| Category | Description | Template Types |
|----------|-------------|----------------|
| `OPER` | Operational Safety | jha, risk_assessment, safety_plan |
| `CONTRACT` | Contractor Safety | contractor_vetting, audit_checklist |
| `EMERG` | Emergency Response | emergency_plan, incident_report |
| `COMPLIANCE` | Compliance & Audit | audit_checklist, safety_manual |
| `TRAINING` | Training & Competency | training_record, safety_manual |
| `INCIDENT` | Incident Management | incident_report, risk_assessment |
| `EQUIPMENT` | Equipment Safety | ppe_evaluation, jha |
| `HEALTH` | Occupational Health | safety_plan, training_record |

## Implementation Requirements

1. Use 02400-series HSE components (02401-02499)
2. Implement safety management workflows
3. Support contractor vetting processes
4. Maintain HSE compliance tracking
5. Enable risk assessment integration
6. Support emergency response planning

## Integration Points

### With Procurement System
- Contractor vetting integration for supplier qualification
- Safety compliance requirements in procurement templates
- Risk assessment data sharing

### With Project Management
- Safety plan integration with project phases
- Incident reporting workflows
- Training record management

### With Quality Assurance
- Audit checklist standardization
- Compliance tracking integration
- Performance metric reporting

## Usage Guidelines

### For HSE Managers
1. **Contractor Vetting**: Use integrated vetting workflows
2. **Risk Assessment**: Apply appropriate risk level templates
3. **Compliance Tracking**: Monitor regulatory requirements
4. **Incident Management**: Utilize standardized reporting templates

### For Safety Officers
1. **Template Management**: Access HSE-specific template library
2. **Audit Preparation**: Use compliance checklist templates
3. **Training Records**: Manage certification documentation
4. **Emergency Planning**: Develop response procedure templates

### For Developers
1. **Template Integration**: Follow safety template configuration patterns
2. **Risk Level Logic**: Implement color-coded risk assessment displays
3. **Assignment Workflows**: Support contractor assignment tracking
4. **Compliance Integration**: Enable regulatory requirement mapping

## Current Status Summary
- ✅ Safety template system: Production ready
- ✅ Contractor vetting: Production ready
- ✅ Risk assessment integration: Production ready
- ✅ Questionnaire display fix: Resolved
- 🔄 Emergency response integration: In development
- 🔄 Advanced compliance tracking: Planned

## Version History
- v1.0 (2025-10-31): Expanded HSE master guide with comprehensive safety template documentation
- v1.1 (2025-12-11): Updated with consolidated documentation references

## Related Documentation

### 📋 **Core HSE Documentation**
- [1300_02400_CONTRACTOR_VETTING_GUIDE.md](1300_02400_CONTRACTOR_VETTING_GUIDE.md) - Complete contractor vetting system guide
- [1300_02400_HSE_CONTENT_REFERENCE.md](1300_02400_HSE_CONTENT_REFERENCE.md) - Comprehensive HSE procedures and policies
- [1300_02400_IMPLEMENTATION_GUIDE.md](1300_02400_IMPLEMENTATION_GUIDE.md) - Technical implementation details

### 🏗️ **System Integration**
- [1300_00220_DOCUMENT_MANAGEMENT_IMPLEMENTATION_PLAN.md](1300_00220_DOCUMENT_MANAGEMENT_IMPLEMENTATION_PLAN.md) - Document management system
- [0900_DOCUMENT_TABLES_REFERENCE.md](0900_DOCUMENT_TABLES_REFERENCE.md) - Database table references
- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Page implementation patterns

### 📁 **Archived Content**
- `docs/pages-disciplines/archive/1300_02400/` - Historical documentation (37+ consolidated files)
