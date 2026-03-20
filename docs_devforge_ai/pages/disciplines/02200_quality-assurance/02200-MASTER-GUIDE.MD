# 2200 Master Guide Index - High-Numbered Pages

## Purpose
This document serves as an index for pages with IDs ≥ 02100, providing cross-linking and foundational standards.

## Documentation Index
| Page ID | Page Name              | Documentation Link                          | Implementation Type |
|---------|------------------------|---------------------------------------------|---------------------|
| 02100   | Public Relations       | [1300_02100_PUBLIC_RELATIONS_PAGE.md]       | Simple Page          |
| 02200   | Quality Assurance      | [1300_02200_QUALITY_ASSURANCE_PAGE.md]      | Complex Accordion    |
| 02250   | Quality Control        | [1300_02250_QUALITY_CONTROL_PAGE.md]        | Simple Page          |
| 02400   | Safety                 | [1300_02400_SAFETY_PAGE.md]                 | Section Hub          |
| 02400-1 | Contractor Vetting     | [1300_02400_CONTRACTOR_VETTING.md]          | Simple Page          |

## Universal Standards
1. **ID Convention**: 5-digit prefix + optional suffix
2. **File Structure**:
```bash
client/src/pages/{pageId}-page-name/
├── components/
├── modals/
└── css/
```
3. **Documentation Requirements**:
   - Cross-link to related pages
   - Include SQL schema samples
   - Detail RBAC settings
   - List all dependent components

## Version History
- v2.0 (2025-08-28): Converted to index format with linked sub-documents
- v1.0 (2025-08-28): Initial master guide
