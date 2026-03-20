# 00825 Architectural Engineering - Virtual Filesystem Structure

This directory contains the Virtual Filesystem (VFS) structure for the 00825 Architectural Engineering workflow, enabling AI agents to access persistent, structured data for architectural design, compliance checking, and dynamic planning.

## Directory Structure

```
00825_architectural/
├── templates/          # Reusable templates and rules
├── references/         # Project-specific architectural references
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
Reusable templates and compliance rules for architectural workflows.

**Contents:**
- `architectural_standards.yaml` - Architectural design standards and guidelines
- `building_regulations.json` - Local building code compliance rules
- `design_templates.md` - Architectural design document templates
- `sustainability_checklists.json` - Green building and sustainability templates

### `/references/`
Project-specific architectural references and cached data.

**Contents:**
- `building_codes.json` - Applicable building codes and regulations
- `design_standards.json` - Architectural design standards database
- `material_specifications.json` - Architectural material specifications
- `client_requirements.json` - Project-specific client requirements

### `/working/`
Agent workspace for modifications and intermediate processing.

**Contents:**
- `design_sketches.json` - Working architectural sketches and concepts
- `code_compliance.json` - Building code compliance analysis
- `client_feedback.json` - Client review and feedback tracking
- `design_iterations.json` - Design development iterations

### `/outputs/`
Final deliverables and generated documents.

**Contents:**
- `architectural_drawings.pdf` - Final architectural drawings
- `specifications.pdf` - Technical specifications document
- `compliance_report.pdf` - Building code compliance report
- `presentation_boards.pdf` - Client presentation materials

### `/memories/`
Learning framework persistence for continuous improvement.

**Contents:**
- `design_patterns.json` - Learned architectural design patterns
- `code_violations.json` - Historical code compliance issues
- `client_preferences.json` - Client design preference learning
- `project_outcomes.json` - Project success metrics and lessons

### `/plan/`
Implementation plans and strategies.

**Contents:**
- `00825_ARCHITECTURAL_IMPLEMENTATION_PLAN.md` - Architectural implementation plan
- `design_strategy.md` - Architectural design strategy documents
- `compliance_strategy.md` - Building code compliance strategy

### `/workflow_docs/`
Workflow documentation and procedures.

**Contents:**
- `00825_ARCHITECTURAL_WORKFLOW.md` - Architectural workflow documentation
- `design_procedures.md` - Architectural design procedures
- `compliance_procedures.md` - Building code compliance procedures

### `/implementation/`
Implementation details and technical specifications.

**Contents:**
- `design_standards.md` - Architectural design standards implementation
- `code_compliance.md` - Building code compliance implementation
- `sustainability.md` - Sustainability implementation details

### `/testing/`
Testing and validation procedures.

**Contents:**
- `design_testing.md` - Architectural design testing procedures
- `compliance_testing.md` - Building code compliance testing
- `validation_reports.md` - Architectural validation reports

## Usage

### For Agents
Agents access the VFS using standard file operations:
- `read_file(path)` - Read files from VFS
- `write_file(path, content)` - Write files to VFS
- `grep_search(pattern, path)` - Search files using regex
- `list_directory(path)` - List directory contents

### For Developers
The VFS is backed by Supabase storage in production and local filesystem in development. The `ArchitecturalVirtualFilesystem` class provides the abstraction layer.

## Related Documentation

- [Architectural Implementation Plan](./plan/00825_ARCHITECTURAL_IMPLEMENTATION_PLAN.md)
- [Architectural Workflow](./workflow_docs/00825_ARCHITECTURAL_WORKFLOW.md)
- [Agent Coding Standards](../../docs/standards/0000_AGENT_CODING_STANDARDS.md)
- [File Naming Standards](../../docs/standards/0000_FILE_NAMING_STANDARDS.md)

---

**Last Updated:** 2026-03-17
**Status:** Structure Created - Ready for Implementation