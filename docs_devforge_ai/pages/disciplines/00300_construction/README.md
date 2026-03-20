# 00300 Construction - Virtual Filesystem Structure

This directory contains the Virtual Filesystem (VFS) structure for the 00300 Construction workflow, enabling AI agents to access persistent, structured data for validation, compliance checking, and dynamic planning.

## Directory Structure

```
00300_construction/
├── templates/          # Reusable templates and rules
├── references/         # Project-specific construction references
├── working/            # Agent workspace for modifications
├── outputs/            # Final deliverables
├── memories/           # Learning framework persistence
├── plan/               # Implementation plans
├── workflow_docs/      # Workflow documentation
├── implementation/     # Implementation details
└── testing/            # Testing and validation
```

## Directory Descriptions

### `/templates/`
Reusable templates and compliance rules for construction workflows.

**Contents:**
- `construction_plan.yaml` - Standard construction timelines and workflows
- `compliance_rules.json` - Construction-specific compliance requirements
- `safety_protocols.md` - Construction safety templates
- `quality_checklists.json` - Construction quality control templates
- `progress_reporting.xlsx` - Construction progress reporting templates
- `construction_schedule.xlsx` - Construction scheduling templates
- `resource_allocation.md` - Construction resource planning templates
- `critical_path_analysis.xlsx` - Construction scheduling analysis templates

### `/references/`
Project-specific construction references and cached data.

**Contents:**
- `construction_standards.json` - Industry construction standards
- `material_specifications.json` - Construction material specifications
- `equipment_inventory.json` - Construction equipment data
- `subcontractor_database.json` - Approved subcontractor information

### `/working/`
Agent workspace for modifications and intermediate processing.

**Contents:**
- `site_plans.json` - Working construction site plans
- `progress_updates.json` - Real-time construction progress
- `quality_reports.json` - Construction quality reports
- `safety_incidents.json` - Construction safety tracking
- `schedule_updates.json` - Construction schedule modifications
- `resource_allocations.json` - Construction resource assignments
- `critical_path_analysis.json` - Schedule critical path calculations

### `/outputs/`
Final deliverables and generated documents.

**Contents:**
- `construction_schedule.pdf` - Final construction schedule
- `progress_reports.pdf` - Construction progress reports
- `quality_certificates.pdf` - Construction quality certificates
- `completion_certificate.pdf` - Construction completion documentation
- `resource_plan.pdf` - Construction resource allocation plan
- `schedule_variance_reports.pdf` - Construction schedule performance reports

### `/memories/`
Learning framework persistence for continuous improvement.

**Contents:**
- `construction_patterns.json` - Learned construction patterns
- `efficiency_metrics.json` - Construction efficiency tracking
- `lessons_learned.md` - Construction lessons learned
- `performance_analytics.json` - Construction performance data

### `/plan/`
Implementation plans and strategies.

**Contents:**
- `00300_CONSTRUCTION_IMPLEMENTATION_PLAN.md` - Construction implementation plan
- `construction_strategy.md` - Construction strategy documents
- `resource_planning.md` - Construction resource planning

### `/workflow_docs/`
Workflow documentation and procedures.

**Contents:**
- `00300_CONSTRUCTION_WORKFLOW.md` - Construction workflow documentation
- `construction_procedures.md` - Construction procedures
- `quality_assurance.md` - Construction quality assurance

### `/implementation/`
Implementation details and technical specifications.

**Contents:**
- `construction_standards.md` - Construction standards implementation
- `safety_implementation.md` - Safety implementation details
- `quality_implementation.md` - Quality implementation details

### `/testing/`
Testing and validation procedures.

**Contents:**
- `construction_testing.md` - Construction testing procedures
- `validation_reports.md` - Construction validation reports
- `compliance_testing.md` - Construction compliance testing

## Usage

### For Agents
Agents access the VFS using standard file operations:
- `read_file(path)` - Read files from VFS
- `write_file(path, content)` - Write files to VFS
- `grep_search(pattern, path)` - Search files using regex
- `list_directory(path)` - List directory contents

### For Developers
The VFS is backed by Supabase storage in production and local filesystem in development. The `ConstructionVirtualFilesystem` class provides the abstraction layer.

## Related Documentation

- [Construction Implementation Plan](./plan/00300_CONSTRUCTION_IMPLEMENTATION_PLAN.md)
- [Construction Workflow](./workflow_docs/00300_CONSTRUCTION_WORKFLOW.md)
- [Agent Coding Standards](../../docs/standards/0000_AGENT_CODING_STANDARDS.md)
- [File Naming Standards](../../docs/standards/0000_FILE_NAMING_STANDARDS.md)

---

**Last Updated:** 2026-03-17
**Status:** Structure Created - Ready for Implementation