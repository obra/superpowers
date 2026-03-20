# Documentation Rationalization and Organization Plan

**Project**: Tidy and Organize MD Docs in `docs/pages-disciplines` and `docs/pages-non-disciplines`

**Date Created**: 2026-01-17

**Status**: In Progress

## 🎯 Objective

Develop and run parallel agents to review all MD docs, rationalize content by removing duplications, consolidating files where appropriate, and organizing better. Ensure consistent master guide naming and maintain prefix numbering. For groups with multiple files, create/update master guides with indices.

## 📋 Current State Analysis

- **Total Files**: ~400+ files across both directories
- **Issues Identified**:
  - Files without `1300_XXXX` prefix convention
  - Duplicate content across multiple files
  - Inconsistent master guide naming
  - Some master guides contain full content instead of indexing
  - Mixed organization between disciplines and non-disciplines

- **Discipline Index**: Using `/docs/schema/reports/index-discipline-pages.md` for authoritative discipline codes and names
- **Organization Principle**: Discipline pages → `pages-disciplines`, Non-discipline pages → `pages-non-disciplines` (regardless of organization: EPCM/Contractors/Judicial/Shared)

## 🏗️ Implementation Plan

### Phase 1: File Standardization (Rename Non-Conforming Files)

**Objective**: Ensure all files follow `1300_XXXX_MASTER_GUIDE_[NAME].md` convention

**Files to Rename** (partial list):
- `architectural-master-guide.md` → `1300_00825_MASTER_GUIDE_ARCHITECTURAL.md`
- `board-of-directors-master-guide.md` → `1300_00880_MASTER_GUIDE_BOARD_OF_DIRECTORS.md`
- `chemical-engineering-master-guide.md` → `1300_00835_MASTER_GUIDE_CHEMICAL_ENGINEERING.md`
- `civil-engineering-master-guide.md` → `1300_00850_MASTER_GUIDE_CIVIL_ENGINEERING.md`
- `construction-master-guide.md` → `1300_00300_MASTER_GUIDE_CONSTRUCTION.md`
- `contracts-master-guide.md` → `1300_00400_MASTER_GUIDE_CONTRACTS.md`
- `design-master-guide.md` → `1300_00800_MASTER_GUIDE_DESIGN.md`
- `electrical-engineering-master-guide.md` → `1300_00860_MASTER_GUIDE_ELECTRICAL_ENGINEERING.md`
- `environmental-master-guide.md` → `1300_01000_MASTER_GUIDE_ENVIRONMENTAL.md`
- `ethics-master-guide.md` → `1300_01100_MASTER_GUIDE_ETHICS.md`
- `finance-master-guide.md` → `1300_01200_MASTER_GUIDE_FINANCE.md`
- `health-master-guide.md` → `1300_01400_MASTER_GUIDE_HEALTH.md`
- `human-resources-master-guide.md` → `1300_01500_MASTER_GUIDE_HUMAN_RESOURCES.md`
- `inspection-master-guide.md` → `1300_02075_MASTER_GUIDE_INSPECTION.md`
- `local-content-master-guide.md` → `1300_01600_MASTER_GUIDE_LOCAL_CONTENT.md`
- `logistics-overview-master-guide.md` → `1300_01700_MASTER_GUIDE_LOGISTICS.md`
- `mechanical-engineering-master-guide.md` → `1300_00870_MASTER_GUIDE_MECHANICAL_ENGINEERING.md`
- `operations-master-guide.md` → `1300_01800_MASTER_GUIDE_OPERATIONS.md`
- `procurement-overview-master-guide.md` → `1300_01900_MASTER_GUIDE_PROCUREMENT.md`
- `public-relations-master-guide.md` → `1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md`
- `quality-assurance-master-guide.md` → `1300_02200_MASTER_GUIDE_QUALITY_ASSURANCE.md`
- `quality-control-master-guide.md` → `1300_02250_MASTER_GUIDE_QUALITY_CONTROL.md`
- `quantity-surveying-master-guide.md` → `1300_02025_MASTER_GUIDE_QUANTITY_SURVEYING.md`
- `safety-master-guide.md` → `1300_02400_MASTER_GUIDE_SAFETY.md`
- `sales-master-guide.md` → `1300_00875_MASTER_GUIDE_SALES.md`
- `scheduling-master-guide.md` → `1300_02035_MASTER_GUIDE_SCHEDULING.md`
- `security-master-guide.md` → `1300_02500_MASTER_GUIDE_SECURITY.md`
- `sundry-master-guide.md` → `1300_00877_MASTER_GUIDE_SUNDRY.md`
- *[Additional files to be identified]*

**Progress**:
- [x] Identify all non-conforming files
- [x] Rename files to proper convention
- [ ] Update any internal links affected by renames

### Phase 2: Group Extraction and Analysis

**Objective**: Identify all unique discipline groups and analyze their content

**Steps**:
- Extract all unique `XXXX` codes from `1300_XXXX_*` filenames
- Map codes to discipline names using discipline index
- Group files by discipline code
- Analyze each group for:
  - Duplicate content
  - Outdated information
  - Consolidation opportunities

**Progress**:
- [x] Extract unique discipline codes (62 unique codes identified)
- [x] Map codes to discipline names (using discipline index)
- [ ] Group files by discipline
- [ ] Initial content analysis

### Phase 3: Per-Discipline Rationalization

**Objective**: Process each discipline group to rationalize and organize

**Process per Group**:
1. Collect all files for the discipline
2. Review content for uniqueness and relevance
3. Identify duplicates and merge complementary content
4. Create/update master guide: `1300_XXXX_MASTER_GUIDE_[DISCIPLINE_NAME].md`
5. Ensure master guide indexes all group files (if multiple exist)
6. Remove redundant files
7. Update cross-references

**Key Disciplines to Process** (from index):
- 00102: Administration
- 00300: Construction
- 00400/00425/00435: Contracts
- 00800: Design
- 00825: Architectural
- 00835: Chemical Engineering
- 00850: Civil Engineering
- 00860: Electrical Engineering
- 00870: Mechanical Engineering
- 00880: Board of Directors
- 01000: Environmental
- 01100: Ethics
- 01200: Finance
- 01300: Governance
- 01400: Health
- 01500: Human Resources
- 01600: Local Content
- 01700: Logistics
- 01900: Procurement
- 02000: Project Controls
- 02200: Quality Assurance
- 02250: Quality Control
- 02400: Safety
- *[All others from index]*

**Progress**:
- [x] Process Administration (00102) - Consolidated duplicates, moved to pages-disciplines
- [x] Process Construction (00300) - Created indexed master guide with 4 files
- [x] Process Contracts (00400) - Created indexed master guide with 4 files
- [x] Process Design (00800) - Removed template duplicate, kept comprehensive implementation guide
- [x] Process Architectural (00825) - Removed template duplicate, kept comprehensive implementation guide
- [x] Process Chemical Engineering (00835) - Created indexed master guide with 4 files
- [x] Process Civil Engineering (00850) - Created indexed master guide with 4 files
- [x] Process Electrical Engineering (00860) - Created indexed master guide with 4 files
- [x] Process Mechanical Engineering (00870) - Created indexed master guide with 4 files
- [x] Process Sales (00875) - Created indexed master guide with 3 files
- [x] Process Sundry (00877) - Created indexed master guide with 4 files
- [x] Process Board of Directors (00880) - Created indexed master guide with 4 files
- [x] Process Environmental (01000) - Created indexed master guide with 4 files
- [x] Process Ethics (01100) - Created indexed master guide with 4 files
- [x] Process Finance (01200) - Created indexed master guide with 13 files
- [x] Process Governance (01300) - Created indexed master guide with 17 files
- [x] Process Health (01400) - Created indexed master guide with 4 files
- [x] Process Human Resources (01500) - Created indexed master guide with 6 files
- [x] Process Local Content (01600) - Created indexed master guide with 3 files
- [x] Process Logistics (01700) - Created indexed master guide with 7 files
- [x] Process Operations (01800) - Created indexed master guide with 7 files
- [x] Process Procurement (01900) - Created indexed master guide with 35 files
- [x] Process Project Controls (02000) - Created indexed master guide with 1 file
- [x] Process Quantity Surveying (02025) - Created indexed master guide with 1 file
- [x] Process Scheduling (02035) - Created indexed master guide with 1 file
- [x] Process Inspection (02075) - Created indexed master guide with 1 file
- [x] Process Public Relations (02100) - Created indexed master guide with 1 file
- [x] Process Quality Assurance (02200) - Created indexed master guide with 1 file
- [x] Process Quality Control (02250) - Created indexed master guide with 1 file
- [x] Process Safety (02400) - Created indexed master guide with 1 file
- [x] Process Developer (00872) - Created indexed master guide with 3 files
- [x] Process Landscaping (03000) - Created indexed master guide with 13 files
- [x] Process Legal (01750) - Created indexed master guide with 1 file
- [x] Process Security (02500) - Created indexed master guide with 2 files
- [x] **BATCH 1 COMPLETE**: Content-driven rationalization of 10 groups (00102-01100)
  - ✅ Removed 12 auto-generated duplicate master guides
  - ✅ Moved eTenders API spec from Sales to Procurement (functional fit)
  - ✅ Created 5 proper indexed master guides
  - ✅ Established functional groups: AI Agent Systems, Form Processing, Procurement
- [x] **BATCH 2 IN PROGRESS**: Content-driven rationalization of groups (01200-02500)
  - [x] Process Finance (01200) - Large group with 13+ files → 11 files (removed 2 duplicates)
  - [ ] Process Governance (01300) - Large group with 17+ files
  - [ ] Process Health (01400) - Standard group
  - [ ] Process Human Resources (01500) - Group with 6+ files
  - [ ] Process Local Content (01600) - Standard group
  - [ ] Process Logistics (01700) - Group with 7+ files
  - [ ] Process Operations (01800) - Group with 7+ files
  - [ ] Process Procurement (01900) - Largest group with 35+ files
  - [ ] Process Project Controls (02000) - Standard group
  - [ ] Process remaining groups through 02500
- [ ] *[Continue with Batch 3: remaining discipline groups]*

### Phase 4: Non-Discipline Pages Organization

**Objective**: Handle pages not in discipline index (e.g., login, settings)

**Process**:
- Identify non-discipline codes (not in index)
- Rationalize these pages appropriately
- Ensure proper naming convention

**Progress**:
- [ ] Identify non-discipline pages
- [ ] Rationalize non-discipline content
- [ ] Ensure consistent naming

### Phase 5: Final Validation and Cleanup

**Objective**: Ensure consistency and completeness

**Steps**:
- Validate all master guides follow naming convention
- Check cross-references are updated
- Remove any remaining duplicates
- Final organization check

**Progress**:
- [ ] Validate naming consistency
- [ ] Update cross-references
- [ ] Final cleanup
- [ ] Documentation complete

## 📊 Metrics and Tracking

- **Files Processed**: 0 / ~400
- **Files Renamed**: 0 / ~50
- **Groups Rationalized**: 0 / ~50
- **Duplicates Removed**: 0
- **Master Guides Created/Updated**: 0

## 🔄 Progress Updates

- **2026-01-17**: Plan created, Phase 1 file standardization completed (renamed ~35 files), Phase 2 group extraction completed (62 codes identified), Phase 3 started with Administration and Construction groups processed
- **2026-01-18**: Continued Phase 3 processing, completed 23 discipline groups (Local Content through Project Controls)
- **2026-01-19**: Completed additional 11 discipline groups (Developer through Security), total 34/62 (54.8%) - Moved non-discipline pages (00150, 00165, 00175, 00200) to pages-non-disciplines
- *[Date]*: *[Update]*

## 📝 Notes and Issues

- Some files may be auto-generated and need special handling
- Cross-directory references need careful updating
- Archive directory exists - may contain relevant content
- Non-discipline pages (00150, etc.) need separate handling

## 🎯 Success Criteria

- [ ] All files follow `1300_XXXX_MASTER_GUIDE_[NAME].md` convention
- [ ] No duplicate content across files
- [ ] Each discipline has proper master guide with index
- [ ] Consistent naming across all groups
- [ ] Clean organization between disciplines and non-disciplines
- [ ] All cross-references updated and working

---

*This document will be updated as progress is made on the rationalization project.*