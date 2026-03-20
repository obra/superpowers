# 1300_02025_MASTER_GUIDE.md - Cost Estimation and Project Costing Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Quantity Surveying Page Guide

## Overview
Documentation for the Quantity Surveying page (02025) covering cost estimation, project costing, and material management.

## Page Structure
**File Location:** `client/src/pages/02025-quantity-surveying`
```javascript
export default function QuantitySurveyingPage() {
  return (
    <PageLayout>
      <QuantitySurveyingDashboard />
      <CostEstimationModule />
      <ProjectCosting />
      <MaterialManagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 02025-series quantity surveying components (02026-02099)
2. Implement cost estimation workflows
3. Support project costing tools
4. Maintain material management systems

## Implementation
```bash
node scripts/quantity-surveying-system/setup.js --full-config
```

## Related Documentation
- [0600_COST_ESTIMATION.md](../docs/0600_COST_ESTIMATION.md)
- [0700_PROJECT_COSTING.md](../docs/0700_PROJECT_COSTING.md)
- [0800_MATERIAL_MANAGEMENT.md](../docs/0800_MATERIAL_MANAGEMENT.md)

## Status
- [x] Core quantity surveying dashboard implemented
- [x] Cost estimation module integration
- [x] Project costing tools
- [x] Material management system

## Version History
- v1.0 (2025-08-27): Initial quantity surveying page structure
