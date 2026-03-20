# 00855 Geotechnical Engineering - Virtual Filesystem Structure

This directory contains the Virtual Filesystem (VFS) structure for the 00855 Geotechnical Engineering workflow, enabling AI agents to access persistent, structured data for geotechnical analysis, soil investigation, and foundation design planning.

## Directory Structure

```
00855_geotechnical-engineering/
├── templates/          # Reusable templates and rules
├── references/         # Project-specific geotechnical references
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
Reusable templates and compliance rules for geotechnical workflows.

**Contents:**
- `geotechnical_standards.yaml` - Geotechnical investigation standards and guidelines
- `soil_testing_protocols.json` - Laboratory and field testing procedures
- `foundation_design_templates.md` - Foundation design calculation templates
- `geotechnical_report_templates.docx` - Standard report formats

### `/references/`
Project-specific geotechnical references and cached data.

**Contents:**
- `geotechnical_standards.json` - Applicable geotechnical standards and codes
- `soil_classification.json` - Local soil classification systems
- `regional_geology.json` - Geological data for project area
- `historical_data.json` - Previous geotechnical investigations in area

### `/working/`
Agent workspace for modifications and intermediate processing.

**Contents:**
- `borehole_data.json` - Working borehole log data
- `soil_analysis.json` - Laboratory test results and analysis
- `foundation_designs.json` - Preliminary foundation design calculations
- `risk_assessments.json` - Geotechnical risk evaluations

### `/outputs/`
Final deliverables and generated documents.

**Contents:**
- `geotechnical_report.pdf` - Final geotechnical investigation report
- `foundation_recommendations.pdf` - Foundation design recommendations
- `borehole_logs.pdf` - Compiled borehole logs and test results
- `geotechnical_risk_assessment.pdf` - Site-specific risk assessment

### `/memories/`
Learning framework persistence for continuous improvement.

**Contents:**
- `soil_patterns.json` - Learned soil behavior patterns
- `foundation_performance.json` - Historical foundation performance data
- `regional_insights.json` - Regional geotechnical characteristics
- `design_optimizations.json` - Successful design optimization cases

### `/plan/`
Implementation plans and strategies.

**Contents:**
- `00855_GEOTECHNICAL_ENGINEERING_IMPLEMENTATION_PLAN.md` - Geotechnical implementation plan
- `investigation_strategy.md` - Geotechnical investigation strategy
- `design_methodology.md` - Foundation design methodology

### `/workflow_docs/`
Workflow documentation and procedures.

**Contents:**
- `00855_GEOTECHNICAL_ENGINEERING_WORKFLOW.md` - Geotechnical workflow documentation
- `investigation_procedures.md` - Field investigation procedures
- `analysis_procedures.md` - Laboratory analysis procedures

### `/implementation/`
Implementation details and technical specifications.

**Contents:**
- `geotechnical_standards.md` - Geotechnical standards implementation
- `testing_procedures.md` - Testing procedures implementation
- `analysis_methods.md` - Analysis methods implementation

### `/testing/`
Testing and validation procedures.

**Contents:**
- `geotechnical_testing.md` - Geotechnical testing procedures
- `validation_reports.md` - Geotechnical validation reports
- `quality_assurance.md` - Quality assurance procedures

## Usage

### For Agents
Agents access the VFS using standard file operations:
- `read_file(path)` - Read files from VFS
- `write_file(path, content)` - Write files to VFS
- `grep_search(pattern, path)` - Search files using regex
- `list_directory(path)` - List directory contents

### For Developers
The VFS is backed by Supabase storage in production and local filesystem in development. The `GeotechnicalVirtualFilesystem` class provides the abstraction layer.

## Related Documentation

- [Geotechnical Implementation Plan](./plan/00855_GEOTECHNICAL_ENGINEERING_IMPLEMENTATION_PLAN.md)
- [Geotechnical Workflow](./workflow_docs/00855_GEOTECHNICAL_ENGINEERING_WORKFLOW.md)
- [Agent Coding Standards](../../docs/standards/0000_AGENT_CODING_STANDARDS.md)
- [File Naming Standards](../../docs/standards/0000_FILE_NAMING_STANDARDS.md)

---

**Last Updated:** 2026-03-17
**Status:** Structure Created - Ready for Implementation