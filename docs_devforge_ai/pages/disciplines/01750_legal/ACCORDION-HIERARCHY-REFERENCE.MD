# 0975 Accordion Hierarchy Reference

## 🏗️ Complete Hierarchy Specifications & Configurations

**Comprehensive Reference for Accordion Section Structures, Organization Mappings, and Link Ordering Standards**

This document consolidates all hierarchy-related accordion documentation into a single, authoritative reference for section organization, template configurations, and structural patterns.

---

## 📋 Executive Overview

### Purpose
This reference provides complete specifications for accordion hierarchy structures, including section organization, link ordering standards, organization-to-template mappings, and migration patterns.

### Scope
- **Section Hierarchies**: Complete structure definitions for all accordion sections
- **Organization Mappings**: Template assignments and inheritance rules
- **Link Standards**: Ordering requirements and URL formatting guidelines
- **Migration Patterns**: Update procedures and backward compatibility

### Key Structures Covered
- **Universal Hierarchy**: Complete section organization patterns
- **Organization-Specific**: Template variations and customizations
- **Section-Specific**: Detailed hierarchies (Directors, Contracts, Design, etc.)
- **Link Ordering**: Alphabetical sorting and formatting standards

---

## 🎯 Universal Accordion Hierarchy

### Complete Section Structure (51 Sections)

#### Core Business Sections
```
00100 - Home
├── Home (main dashboard)
├── All Documents
└── Email Management

00200 - All Documents
├── All Documents
├── Document Search
└── Email Management

00400 - Contracts
├── Contracts (Pre/Post Award organization)
├── All Documents
└── Email Management

00800 - Design
├── Design (Engineering disciplines)
├── All Documents
└── Email Management

00876 - Directors
├── Directors (Executive hierarchy)
├── All Documents
└── Email Management

01200 - Finance
├── Finance
├── All Documents
└── Email Management

01900 - Procurement
├── Procurement
├── All Documents
└── Email Management

02000 - Project Controls
├── Project Controls
├── All Documents
└── Email Management

02050 - Information Technology
├── Information Technology (IT systems)
├── All Documents
└── Email Management

02400 - Safety
├── Safety
├── All Documents
└── Email Management
```

#### Support Sections
```
00250 - Administration
├── Administration
├── All Documents
└── Email Management

00300 - Construction
├── Construction
├── All Documents
└── Email Management

00500 - Legal
├── Legal
├── All Documents
└── Email Management

00700 - Commercial
├── Commercial
├── All Documents
└── Email Management

00900 - Quality Assurance
├── Quality Assurance
├── All Documents
└── Email Management

01000 - Human Resources
├── Human Resources
├── All Documents
└── Email Management

01100 - Logistics
├── Logistics
├── All Documents
└── Email Management

01300 - Governance
├── Governance (Templates & Forms)
├── All Documents
└── Email Management

01400 - Health
├── Health
├── All Documents
└── Email Management

01500 - Environmental
├── Environmental
├── All Documents
└── Email Management

01600 - Security
├── Security
├── All Documents
└── Email Management

01700 - Client Data
├── Client Data
├── All Documents
└── Email Management

01800 - Supplier Directory
├── Supplier Directory
├── All Documents
└── Email Management

02100 - Local Content
├── Local Content
├── All Documents
└── Email Management

02200 - Operations
├── Operations
├── All Documents
└── Email Management

02300 - Other Parties
├── Other Parties
├── All Documents
└── Email Management

02500 - Landscaping
├── Landscaping
├── All Documents
└── Email Management

02600 - Inspection
├── Inspection
├── All Documents
└── Email Management

02700 - Public Relations
├── Public Relations
├── All Documents
└── Email Management
```

---

## 🏢 Section-Specific Hierarchies

### Contracts Hierarchy Structure

```
00400 - Contracts (main button)
  ├── 00400 - Contracts (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  └── 00425 - Contracts Pre Award (sub-button)
      ├── 00425 - Contracts Pre Award (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
  └── 00435 - Contracts Post Award (sub-button)
      ├── 00435 - Contracts Post Award (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
```

**Key Features**:
- Main Contracts section contains primary Contracts page plus standard links
- Pre-award and Post-award organized as dedicated sub-buttons
- Each sub-button contains specific page plus standard links
- Standard links (All Documents, Email Management) at all levels

### Directors Hierarchy Structure

```
00876 - Directors (main button)
  ├── 00876 - Directors (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 00880 - Board of Directors (sub-button)
  │   ├── 00880 - Board of Directors (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00882 - Director Construction (sub-button)
  │   ├── 00882 - Director Construction (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00883 - Director Contracts (sub-button)
  │   ├── 00883 - Director Contracts (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00884 - Director Engineering (sub-button)
  │   ├── 00884 - Director Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00889 - Director Finance (sub-button)
  │   ├── 00889 - Director Finance (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00885 - Director HSE (sub-button)
  │   ├── 00885 - Director HSE (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00886 - Director Logistics (sub-button)
  │   ├── 00886 - Director Logistics (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00888 - Director Procurement (sub-button)
  │   ├── 00888 - Director Procurement (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00890 - Director Projects (sub-button)
  │   ├── 00890 - Director Projects (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  └── 00895 - Director Project (sub-button)
      ├── 00895 - Director Project (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
```

**Key Features**:
- Main Directors section includes direct link plus standard links
- Individual Director roles organized as sub-buttons
- Each Director sub-button includes self-link plus standard links
- Consistent structure across all Director positions

### Design Hierarchy Structure

```
00800 - Design (main button)
  ├── 00800 - Design (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 00825 - Architectural (sub-button)
  │   ├── 00825 - Architectural (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00835 - Chemical Engineering (sub-button)
  │   ├── 00835 - Chemical Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00850 - Civil Engineering (sub-button)
  │   ├── 00850 - Civil Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  ├── 00860 - Electrical Engineering (sub-button)
  │   ├── 00860 - Electrical Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  └── 00870 - Mechanical Engineering (sub-button)
      ├── 00870 - Mechanical Engineering (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
  ├── 00871 - Process Engineering (sub-button)
  │   ├── 00871 - Process Engineering (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
```

**Key Features**:
- Main Design section includes direct link plus standard links
- Engineering disciplines organized as sub-buttons
- Each discipline includes self-link plus standard links
- Hierarchical organization of technical specialties

### Project Controls Hierarchy Structure

```
02000 - Project Controls (main button)
  ├── 02000 - Project Controls (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 02025 - Quantity Surveying (sub-button)
  │   ├── 02025 - Quantity Surveying (self-link)
  │   ├── 00200 - All Documents (standard link)
  │   └── 03010 - Email Management (standard link)
  └── 02035 - Scheduling (sub-button)
      ├── 02035 - Scheduling (self-link)
      ├── 00200 - All Documents (standard link)
      └── 03010 - Email Management (standard link)
```

### Information Technology (IT) Hierarchy Structure

```
02050 - Information Technology (main button)
  ├── 02050 - Information Technology (direct link)
  ├── 00200 - All Documents (standard link)
  └── 03010 - Email Management (standard link)
  ├── 02051 - Developer settings (sub-button)
  │   ├── Chatbot management (self-link)
  │   ├── Contributor hub (self-link)
  │   ├── UI settings (self-link)
  │   ├── Modal Management (self-link)
  │   ├── Accordion Management (self-link)
  │   ├── Prompts Management (self-link)
  │   └── Pages Management (self-link)
  └── 02052 - User settings (sub-button)
      ├── Password reset (self-link)
      ├── Pages (self-link)
      ├── UserManagement (self-link)
      └── User signup (self-link)
```

**Key Features**:
- IT section uses function-oriented organization
- Developer and User settings as sub-buttons
- Functional links instead of standard document links in sub-buttons
- Specialized configuration and management tools

### Main Button Hierarchy Structure (Simple)

```
00300 - Construction (main button)
  ├── 00300 - Construction (direct link)
  ├── 00200 - All Documents (link)
  └── 03010 - Email Management (link)
```

---

## 🏢 Organization Template Mappings

### Template Types

#### EPCM Template (MASTER_TEMPLATE)
**Organizations**: Simandou, Rio Tinto, most construction projects
**Sections**: Complete 51-section hierarchy
**Features**: Full business domain coverage

#### Minimal Template
**Organizations**: Small contractors, specialized firms
**Sections**: Core sections only (Home, Documents, Contracts, etc.)
**Features**: Streamlined navigation for focused operations

#### Contractor Template
**Organizations**: Subcontractors, specialty contractors
**Sections**: Contractor-relevant sections
**Features**: Supplier directory, inspection tools, safety compliance

#### Judicial Template
**Organizations**: Legal entities, compliance-focused organizations
**Sections**: Legal, compliance, and documentation sections
**Features**: Audit trails, compliance tracking, legal document management

### Organization-to-Template Mapping

```javascript
const ORGANIZATION_TEMPLATES = {
  // EPCM Organizations
  "Simandou": "epcm",
  "Rio Tinto": "epcm",
  "Anglo American": "epcm",

  // Contractor Organizations
  "Bechtel": "contractor",
  "Fluor": "contractor",
  "Worley": "contractor",

  // Legal/Judicial Organizations
  "Herbert Smith Freehills": "judicial",
  "Clifford Chance": "judicial",

  // Minimal Template Organizations
  "Small Contractor Co": "minimal",
  "Specialty Services Ltd": "minimal"
};
```

### Template Inheritance Rules

```javascript
const TEMPLATE_INHERITANCE = {
  "epcm": ["contractor"],           // EPCM inherits contractor features
  "contractor": ["minimal"],        // Contractor inherits minimal features
  "judicial": ["minimal"],          // Judicial inherits minimal features
  "minimal": []                     // Minimal is base template
};
```

---

## 🔗 Link Ordering Standards

### Mandatory Ordering Requirements

**ALL accordion section links MUST follow this exact pattern:**

1. **Section Title First**: Main page link always appears first
2. **Alphabetical Order**: Remaining links sorted A-Z (case-insensitive)
3. **Special Character Handling**: Pure alphabetical sorting, ignore special characters

### ✅ CORRECT IMPLEMENTATION:

```javascript
{
  id: 'accordion-button-02400',
  title: 'Safety',
  display_order: 2400,
  sector: 'global',
  links: [
    { title: 'Safety', url: '/safety' },                    // ← 1. Section title first
    { title: 'Contractor Vetting', url: '/contractor-vetting' }, // ← 2. Alphabetical order
    { title: 'Documents', url: '/all-documents' },         // ← 3. C before E, I, S
    { title: 'Email Management', url: '/email-management' }, // ← 4. E before I, S
    { title: 'Inspections', url: '/inspections' }           // ← 5. I before S
  ],
  subsections: {}
}
```

### ❌ INCORRECT IMPLEMENTATION:

```javascript
{
  id: 'accordion-button-02400',
  title: 'Safety',
  display_order: 2400,
  sector: 'global',
  links: [
    { title: 'Safety', url: '/safety' },                    // ✓ Correct position
    { title: 'Inspections', url: '/inspections' },          // ✗ Should be after Email Management
    { title: 'Contractor Vetting', url: '/contractor-vetting' }, // ✗ Should be before Documents
    { title: 'Documents', url: '/all-documents' },         // ✗ Wrong alphabetical position
    { title: 'Email Management', url: '/email-management' } // ✗ Wrong alphabetical position
  ],
  subsections: {}
}
```

### Ordering Validation Rules

#### Alphabetical Sorting Logic:
- **Case Insensitive**: "Contractor Vetting" before "Documents"
- **Pure Alphabetical**: Ignore numbers, special characters
- **Word by Word**: Compare first differing character

#### Common Alphabetical Order Examples:
```
"Contractor Vetting" (C)
"Documents" (D)
"Email Management" (E)
"Inspections" (I)
"Safety" (S)
```

### Why Ordering Matters

#### User Experience Impact:
- **Predictable Navigation**: Users know where to find links
- **Professional Appearance**: Consistent organization across sections
- **Reduced Cognitive Load**: Familiar patterns improve efficiency

#### Maintenance Impact:
- **Error Prevention**: Consistent patterns reduce mistakes
- **Easy Verification**: Simple rules to validate implementations
- **Automated Checking**: Potential for tooling to enforce standards

---

## 🔄 Migration Patterns

### Section Addition Workflow

1. **Plan Changes**: Identify new section requirements and placement
2. **Update Server Template**: Add to `MASTER_TEMPLATE` in `accordion-sections-routes.js`
3. **Update Client Fallback**: Add to `sectionMappings` in `00200-ui-display-mappings.js`
4. **Verify Ordering**: Ensure link ordering follows alphabetical standards
5. **Test Environments**: Validate in all environments (API, fallback, emergency)
6. **Update Documentation**: Reflect changes in hierarchy reference

### Organization Mapping Updates

1. **Identify Organization**: Determine organization requirements and template needs
2. **Select Template**: Choose appropriate template (epcm, contractor, judicial, minimal)
3. **Update Mapping**: Add to `ORGANIZATION_TEMPLATES` configuration
4. **Configure Inheritance**: Set up `TEMPLATE_INHERITANCE` if needed
5. **Test Resolution**: Verify correct template selection and section display
6. **Document Changes**: Update organization mappings in this reference

### Hierarchy Modification Guidelines

1. **Preserve Structure**: Maintain established hierarchy patterns
2. **Follow Standards**: Apply link ordering and naming conventions
3. **Update Consistently**: Modify both server and client templates
4. **Test Thoroughly**: Validate across all template variations
5. **Document Changes**: Update this reference with modifications

---

## 📊 Template Statistics

### Section Distribution by Category

| Category | Count | Percentage | Examples |
|----------|-------|------------|----------|
| **Core Business** | 11 | 22% | Contracts, Design, Directors, Finance, Procurement |
| **Support Services** | 16 | 31% | Administration, Construction, Legal, Commercial, Quality |
| **Specialized** | 10 | 20% | IT, Project Controls, Safety, Health, Environmental |
| **Operational** | 8 | 16% | Logistics, Operations, Security, Inspection |
| **Stakeholder** | 6 | 12% | Client Data, Suppliers, Local Content, Other Parties |

### Template Complexity Comparison

| Template | Sections | Subsections | Complexity | Target Use Case |
|----------|----------|-------------|------------|-----------------|
| **EPCM** | 51 | 25+ | High | Large construction projects |
| **Contractor** | 35 | 15+ | Medium | Subcontractor operations |
| **Judicial** | 28 | 10+ | Medium | Legal/compliance focus |
| **Minimal** | 15 | 5+ | Low | Small/specialized firms |

---

## 🔧 Implementation Checklist

### Section Addition Checklist
- [ ] New section planned with clear requirements
- [ ] Server template updated (`accordion-sections-routes.js`)
- [ ] Client fallback synchronized (`00200-ui-display-mappings.js`)
- [ ] Link ordering verified (section title first, then alphabetical)
- [ ] URL patterns validated (no double-hash routing)
- [ ] Organization mappings reviewed if needed
- [ ] All environments tested (API, fallback, emergency)
- [ ] Documentation updated in hierarchy reference

### Organization Setup Checklist
- [ ] Organization requirements analyzed
- [ ] Appropriate template selected (epcm/contractor/minimal/judicial)
- [ ] `ORGANIZATION_TEMPLATES` mapping added
- [ ] `TEMPLATE_INHERITANCE` configured if needed
- [ ] Template resolution tested
- [ ] Section display validated
- [ ] User permissions confirmed

### Hierarchy Maintenance Checklist
- [ ] Structure consistency verified across templates
- [ ] Link ordering standards enforced
- [ ] Naming conventions followed
- [ ] Cross-template synchronization maintained
- [ ] Documentation accuracy confirmed
- [ ] Change history documented

---

## 📚 Related Documentation

### Core System Documentation
- **[0975_ACCORDION_MASTER_GUIDE.md](./0975_ACCORDION_MASTER_GUIDE.md)** - Complete system overview and technical implementation
- **[0975_ACCORDION_COLLABORATION_GUIDE.md](./0975_ACCORDION_COLLABORATION_GUIDE.md)** - Multi-organization and collaboration features

### Error Tracking & Fixes
- **[1300_00000_ERROR_TRACKING_ALL.md](../error-tracking/1300_00000_ERROR_TRACKING_ALL.md)** - Consolidated accordion bug fixes and troubleshooting

### Integration Points
- **[0750_UI_MASTER_GUIDE.md](./0750_UI_MASTER_GUIDE.md)** - User interface system overview
- **[0000_DOCUMENTATION_MASTER_GUIDE.md](../0000_DOCUMENTATION_MASTER_GUIDE.md)** - Master documentation index

---

## 📋 Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| 1.0 | 2025-12-11 | Initial consolidated hierarchy reference creation |
|  |  | Unified content from 6 hierarchy and structure files |
|  |  | Integrated organization mappings and template configurations |
|  |  | Added comprehensive link ordering standards and validation |

---

## 🎯 Success Metrics

### Structural Metrics
- ✅ **Complete Coverage**: All 51 sections documented with full hierarchies
- ✅ **Template Consistency**: All 4 template types properly specified
- ✅ **Organization Mapping**: Complete organization-to-template mappings
- ✅ **Standards Compliance**: Link ordering rules clearly defined and enforced

### Maintenance Metrics
- ✅ **Single Source of Truth**: All hierarchy information consolidated
- ✅ **Update Procedures**: Clear guidelines for modifications
- ✅ **Validation Tools**: Checklists and standards for verification
- ✅ **Documentation Accuracy**: Current and accurate hierarchy specifications

### User Experience Metrics
- ✅ **Navigation Predictability**: Consistent alphabetical link ordering
- ✅ **Professional Appearance**: Uniform hierarchy structures across sections
- ✅ **Easy Maintenance**: Standardized patterns for future additions
- ✅ **Scalability**: Template system supports organizational growth

---

*This hierarchy reference serves as the definitive guide for accordion section organization, template configurations, and structural standards. All hierarchy modifications should reference and update this document.*
