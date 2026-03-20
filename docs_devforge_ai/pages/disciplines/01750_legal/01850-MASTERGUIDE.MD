# 1300_01850_MASTER_GUIDE.md - Other Parties Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Other Parties Page Guide

## Overview
Documentation for the Other Parties page (01850) covering third-party management, vendor relationships, and stakeholder engagement.

## Page Structure
**File Location:** `client/src/pages/01850-other-parties`
```javascript
export default function OtherPartiesPage() {
  return (
    <PageLayout>
      <OtherPartiesDashboard />
      <VendorManagementModule />
      <StakeholderEngagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 01850-series other parties components (01851-01899)
2. Implement third-party management workflows
3. Support vendor relationship tools
4. Maintain stakeholder engagement systems
5. Provide external party evaluation system for contractor/supplier vetting
6. Enable template-based evaluation workflows across all disciplines

## Core Workflows

### Template-to-Vetting Pipeline
```
Template Generation (01300) → Discipline Selection Mode → Other Parties External Evaluation → Contractor Input → Discipline Vetting
```

### Complete Vetting Process
1. **Template Creation**: Templates generated via governance form processing (01300)
2. **Discipline Deployment**: Templates copied to discipline-specific tables via selection mode
3. **External Distribution**: Discipline teams issue templates to contractors via Other Parties page
4. **Contractor Response**: External parties complete forms and provide documentation at `/other-parties/external-party-evaluation`
5. **Discipline Review**: Completed responses become available for discipline team vetting
6. **Approval Workflow**: Multi-discipline evaluation and final approval decisions

### Template Management Integration
- **Source**: `governance_document_templates` table (processed templates)
- **Deployment**: Selection mode in template management enables bulk copying to discipline tables
- **Disciplines**: Safety tables, Procurement tables, Civil Engineering tables, etc.
- **Access Control**: RLS policies ensure proper discipline isolation and access
- **External Access**: Token-based secure access for contractors/suppliers

## Implementation
```bash
node scripts/other-parties-system/setup.js --full-config
```

## Related Documentation
- [0600_THIRD_PARTY_MANAGEMENT.md](../docs/0600_THIRD_PARTY_MANAGEMENT.md)
- [0700_VENDOR_RELATIONSHIPS.md](../docs/0700_VENDOR_RELATIONSHIPS.md)
- [0800_STAKEHOLDER_ENGAGEMENT.md](../docs/0800_STAKEHOLDER_ENGAGEMENT.md)
- [0750_PHASE2B_EXTERNAL_PARTY_EVALUATION_UI_PLAN.md](../docs/user-interface/0750_PHASE2B_EXTERNAL_PARTY_EVALUATION_UI_PLAN.md)
- [1300_pages_forms_templates_README.md](../docs/pages-forms-templates/1300_pages_forms_templates_README.md)

## Status
- [x] Core other parties dashboard implemented
- [ ] Vendor management module integration
- [ ] Stakeholder engagement tools
- [ ] Third-party management system

## Version History
- v1.0 (2025-08-27): Initial other parties page structure
