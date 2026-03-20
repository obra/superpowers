# Comprehensive Page Testing - Construct AI

## Overview

This document describes the comprehensive page testing system for Construct AI, which systematically tests all 152+ pages in the application. The testing is organized into two phases to prioritize critical discipline-specific pages first.

---

## Testing Strategy

### Two-Phase Approach

#### Phase 1: Discipline-Specific Users (Priority)
Focus on the four critical discipline pages that have the most complex workflows:
- **01700 Logistics** - Shipment tracking, customs clearance, documentation
- **01900 Procurement** - SOW generation, tender management, supplier evaluation
- **00435 Contracts Post Award** - Contract administration, correspondence, payments
- **02400 Safety** - Contractor vetting, inspections, compliance monitoring

**Pages in Phase 1**: ~40 pages (including sub-pages and related workflows)

#### Phase 2: Remaining Pages
Test all other pages across the application:
- Other discipline pages (23 additional disciplines)
- Data management pages
- Workflow processing pages
- Document processing pages
- Utility and configuration pages

**Pages in Phase 2**: ~112 pages

---

## Page Inventory

### Total Pages: 152

| Category | Count | Phase |
|----------|-------|-------|
| Discipline Pages | 27 | Phase 1 (4) + Phase 2 (23) |
| Data Management | 20 | Phase 2 |
| Workflow Processing | 29 | Phase 2 |
| Data Collection | 4 | Phase 2 |
| Document Processing | 10 | Phase 2 |
| Time Tracking | 2 | Phase 2 |
| Scheduling | 7 | Phase 2 |
| Reporting | 3 | Phase 2 |
| Utility | 50 | Phase 2 |

---

## Phase 1: Discipline-Specific Testing

### 01700 Logistics
**URL**: `/logistics`

**Pages to Test**:
- `/logistics` - Main logistics page
- `/logistics-documents/export` - Export documentation
- `/logistics-documents/export/bill-of-lading`
- `/logistics-documents/export/certificate-of-origin`
- `/logistics-documents/export/commercial-invoice`
- `/logistics-documents/export/export-compliance-package`
- `/logistics-documents/export/export-declaration`
- `/logistics-documents/export/export-insurance-certificate`
- `/logistics-documents/export/export-license-permit`
- `/logistics-documents/export/export-packing-list`
- `/logistics-documents/export/export-quality-certificate`
- `/logistics-documents/export/phytosanitary-certificate`
- `/logistics-documents/import` - Import documentation
- `/logistics-documents/import/bill-of-lading-import`
- `/logistics-documents/import/carrier-contract-import`
- `/logistics-documents/import/certificate-package`
- `/logistics-documents/import/commercial-packing-list-import`
- `/logistics-documents/import/complete-suite-import`
- `/logistics-documents/import/compliance-package-import`
- `/logistics-documents/import/customs-clearance`
- `/logistics-documents/import/delivery-note-import`
- `/logistics-documents/import/insurance-certificate-import`
- `/logistics-documents/import/shipping-manifest`

**Test Focus**:
- Dashboard tab functionality
- Document generation workflows
- Export/import document processing
- Customs clearance workflows
- Shipment tracking integration

### 01900 Procurement
**URL**: `/procurement`

**Pages to Test**:
- `/procurement` - Main procurement page
- `/procurement/gantt-chart` - Procurement scheduling
- `/procurement-performance` - Performance dashboard
- `/document-ordering-management?discipline=01900` - Document ordering
- `/templates-forms-management?discipline=01900` - Templates and forms

**Test Focus**:
- SOW generation workflow (19 stages)
- Tender management
- Supplier evaluation
- Contract negotiation
- Document analysis and compliance

### 00435 Contracts Post Award
**URL**: `/contracts-post-award`

**Pages to Test**:
- `/contracts-post-award` - Main contracts page
- `/document-ordering-management?discipline=00435` - Document ordering
- `/templates-forms-management?discipline=00435` - Templates and forms

**Test Focus**:
- Contract administration
- Correspondence generation and analysis
- Payment milestone tracking
- Variation order processing
- Legal document review

### 02400 Safety
**URL**: `/safety`

**Pages to Test**:
- `/safety` - Main safety page
- `/safety-performance` - Safety performance dashboard
- `/safety-document-templates` - Document templates
- `/templates-forms-management?discipline=02400` - Templates and forms
- `/contractor-vetting` - Contractor vetting (moved from other parties)

**Test Focus**:
- Contractor vetting workflows
- Safety inspection processes
- Compliance monitoring
- Incident reporting
- HSE documentation

---

## Phase 2: Remaining Pages Testing

### Other Discipline Pages (23 pages)
- `/administration`
- `/board-of-directors`
- `/chemical-engineering`
- `/civil-engineering`
- `/construction`
- `/contracts-pre-award`
- `/design`
- `/director-construction`
- `/director-contracts`
- `/director-engineering`
- `/director-finance`
- `/director-hse`
- `/director-logistics`
- `/director-procurement`
- `/director-project`
- `/director-projects`
- `/electrical-engineering`
- `/geotechnical-engineering`
- `/mechanical-engineering`
- `/process-engineering`
- `/architectural`
- `/developer`
- `/sundry`

### Data Management Pages (20 pages)
- `/commercial`
- `/environmental`
- `/ethics`
- `/finance`
- `/governance`
- `/information-technology`
- `/inspection`
- `/landscaping`
- `/operations`
- `/other-parties`
- `/project-controls`
- `/public-relations`
- `/quality-assurance`
- `/quality-control`
- `/security`
- `/user-management`

### Workflow Processing Pages (29 pages)
- `/appendix-e-logistics-documents`
- `/document-ordering-management`
- Various logistics document pages

### Utility Pages (50 pages)
- Settings, configuration, and administrative pages

---

## Testing Tools

### Comprehensive Page Tester
**File**: `comprehensive_page_tester.py`

Automated testing tool that:
- Tests all 152 pages systematically
- Checks page loading and performance
- Detects buttons, forms, modals, tabs
- Captures screenshots on failures
- Generates JSON and Markdown reports

### Usage

```bash
# Test all pages
python run_page_tests.py

# Test only Phase 1 pages (discipline-specific)
python run_page_tests.py --page-type discipline --max-pages 40

# Test specific discipline
python run_page_tests.py --url http://localhost:3000/logistics

# Quick test (first 10 pages)
python run_page_tests.py --max-pages 10
```

---

## Test Execution Plan

### Phase 1 Execution (Week 1)

#### Day 1-2: 01700 Logistics
1. Run comprehensive page tester on all logistics pages
2. Manual testing of critical workflows
3. Document issues and bugs
4. Fix critical issues

#### Day 3-4: 01900 Procurement
1. Run comprehensive page tester on all procurement pages
2. Test SOW generation workflow end-to-end
3. Test tender management workflows
4. Document and fix issues

#### Day 5: 00435 Contracts & 02400 Safety
1. Run page tester on contracts and safety pages
2. Test contract administration workflows
3. Test contractor vetting workflows
4. Document and fix issues

### Phase 2 Execution (Week 2)

#### Day 1-2: Other Discipline Pages
1. Run page tester on remaining 23 discipline pages
2. Verify navigation and basic functionality
3. Document issues

#### Day 3-4: Data Management & Workflow Pages
1. Run page tester on data management pages
2. Run page tester on workflow processing pages
3. Test CRUD operations
4. Document issues

#### Day 5: Utility & Configuration Pages
1. Run page tester on utility pages
2. Verify settings and configuration functionality
3. Final report generation

---

## Test Reports

### Generated Reports

After each test run:
```
page_test_reports/
├── page_test_report_YYYYMMDD_HHMMSS.json
└── page_test_summary_YYYYMMDD_HHMMSS.md

page_test_screenshots/
└── (screenshots on failures)
```

### Report Contents

**JSON Report**:
- Summary statistics (pass/fail rates)
- Results by page type
- Individual page results
- Performance metrics
- Error details

**Markdown Report**:
- Human-readable summary
- Failed pages list
- Slow pages list
- Recommendations

---

## Success Criteria

### Phase 1 Success
- [ ] All 01700 Logistics pages load successfully
- [ ] All 01900 Procurement pages load successfully
- [ ] All 00435 Contracts pages load successfully
- [ ] All 02400 Safety pages load successfully
- [ ] Critical workflows execute without errors
- [ ] Page load times < 3 seconds
- [ ] No critical bugs in discipline workflows

### Phase 2 Success
- [ ] All 152 pages load successfully
- [ ] Pass rate > 95%
- [ ] No critical bugs
- [ ] Page load times < 3 seconds for 90% of pages
- [ ] All navigation works correctly

---

## Integration with Production Testing

This comprehensive page testing integrates with the main production testing plan:

1. **Phase 2** of production testing includes page testing
2. **Phase 3** validates authentication across all pages
3. **Phase 4** tests chatbots on discipline pages
4. **Phase 5** tests agent workflows on discipline pages
5. **Phase 6** validates permissions across all pages

---

## Troubleshooting

### Common Issues

**Issue**: All tests fail with "Connection refused"
**Solution**: Ensure application is running (`npm run dev`)

**Issue**: Tests are slow
**Solution**: Use `--slow-mo 100` or run in headless mode

**Issue**: Want to see browser actions
**Solution**: Use `--no-headless --slow-mo 1000`

**Issue**: Only want to test specific pages
**Solution**: Use `--max-pages N` or `--page-type discipline`

---

## Summary

The comprehensive page testing system provides:

- ✅ **152 pages** tested systematically
- ✅ **Two-phase approach** prioritizing critical disciplines
- ✅ **Automated testing** with Playwright
- ✅ **Performance monitoring** with load time tracking
- ✅ **Element detection** for buttons, forms, modals
- ✅ **Screenshot capture** on failures
- ✅ **Detailed reports** in JSON and Markdown
- ✅ **CI/CD ready** for automated testing

Use this system to ensure all pages are working correctly before production deployment.