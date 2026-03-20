# 1300_00300_MASTER_GUIDE_CONSTRUCTION.md - Construction Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Construction Guide
- v1.1 (2026-01-17): Updated with comprehensive file index

## Documentation Index

This master guide consolidates documentation for the Construction discipline (00300). The following files are part of this group:

- [1300_00300_MASTER_GUIDE_CONSTRUCTION.md](1300_00300_MASTER_GUIDE_CONSTRUCTION.md) - This master guide
- [1300_00300_CONSTRUCTION.md](1300_00300_CONSTRUCTION.md) - Construction page overview and requirements
- [1300_00300_CONSTRUCTIONPAGE.md](1300_00300_CONSTRUCTIONPAGE.md) - Detailed implementation documentation
- [1300_00300_NEW_FORMAUDIT.md](1300_00300_NEW_FORMAUDIT.md) - PDF form creation audit report

## Overview
Construction project management and site operations dashboard.

## Page Structure
**File Location:** `client/src/pages/00300-construction`
```javascript
export default function ConstructionPage() {
  return (
    <ConstructionLayout>
      <SiteTracker />
      <ProgressMonitor />
      <ResourceAllocator />
      <SafetyCompliance />
    </ConstructionLayout>
  );
}
```

## Requirements
1. Use 00300-series construction components (00300-00399)
2. Implement project progress tracking
3. Support resource allocation management
4. Maintain safety compliance monitoring

## Implementation
```bash
node scripts/construction/setup.js --project-config
```

## Related Documentation
- [0900_PROJECT_MANAGEMENT.md](../docs/0900_PROJECT_MANAGEMENT.md)
- [1000_SITE_OPERATIONS.md](../docs/1000_SITE_OPERATIONS.md)

## Status
- [x] Core construction framework
- [ ] Site tracking
- [ ] Progress monitoring
- [ ] Resource allocation

## Version History
- v1.0 (2025-08-27): Initial construction structure