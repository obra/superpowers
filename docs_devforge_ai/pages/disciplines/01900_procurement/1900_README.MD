# 01900 Procurement - Virtual Filesystem Structure

This directory contains the Virtual Filesystem (VFS) structure for the 01900 Procurement workflow, enabling AI agents to access persistent, structured data for validation, compliance checking, and dynamic planning.

## Directory Structure

```
01900_procurement/
├── templates/          # Reusable templates and rules
├── references/         # Order-specific supplier references
├── working/            # Agent workspace for modifications
├── outputs/            # Final deliverables
└── memories/           # Learning framework persistence
```

## Directory Descriptions

### `/templates/`
Reusable templates and compliance rules for procurement workflows.

**Contents:**
- `procurement_plan.yaml` - Standard timelines and workflows
- `compliance_rules.json` - Jurisdiction-specific compliance requirements (ZA/FI/UK/EU)
- `inventory_catalog.json` - SKU data with ERP integration
- `delivery_terms.docx` - Incoterms and logistics templates
- `shipping_schedule.csv` - Carrier and routing data
- `appendix_a_product_specs_template.md` - Product specification template
- `sow_document.md` - Scope of Work template
- `appendix_a_specifications.md` through `appendix_f_packing.md` - Appendix templates
- `order_templates_procurement.md` - PO/SO/WO templates
- `purchase_order_template.pdf` - Purchase order template
- `service_order_template.pdf` - Service order template
- `work_order_template.docx` - Work order template

### `/references/`
Order-specific supplier references and cached data.

**Contents:**
- `selected_suppliers.json` - Cached supplier cards for current order
- `supplier_search_cache.json` - Cached search results
- `vendor_master.csv` - Supplier qualification criteria
- `supplier_*.json` - Individual supplier cards (generated from database)

### `/working/`
**DEDICATED TO CHAT DATA RETENTION** - Agent workspace containing structured procurement data collected through the 48-step interactive chat workflow.

**Purpose:** Stores JSON files with procurement requirements extracted from user conversations, enabling persistent context retention across the entire procurement workflow.

**Contents:**
- `procurement_requirements_{session_id}.json` - Structured data from chat workflow (48 data points)
- `README.md` - Detailed explanation of chat data retention system

**Note:** This directory contains ONLY chat-collected procurement data. Previous working files have been moved to `/working_archive/` to maintain focus on chat data retention.

**⚠️ IMPORTANT:** This is the **documentation structure**. Actual VFS files are stored in order-specific directories at:
```
/Users/_General/Mar-16-2/deep-agents/deep_agents/agents/pages/01900_procurement/orders/{order_id}/working/
```

### `/outputs/`
Final deliverables and generated documents.

**Contents:**
- `rfq_appendix_a.docx` - Generated with supplier data
- `procurement_plan.pdf` - Adapted with real timelines
- `compliance_certificate.pdf` - Automated validation report
- `final_order_package.zip` - Complete order documentation

### `/memories/`
Learning framework persistence for continuous improvement.

**Contents:**
- `negotiation_history.json` - Historical negotiation patterns
- `pricing_patterns.md` - Learned pricing trends
- `supplier_performance.json` - Supplier performance tracking
- `procurement_lessons.yaml` - Lessons learned from previous orders

## Usage

### For Agents
Agents access the VFS using standard file operations:
- `read_file(path)` - Read files from VFS
- `write_file(path, content)` - Write files to VFS
- `grep_search(pattern, path)` - Search files using regex
- `list_directory(path)` - List directory contents

### For Developers
The VFS is backed by Supabase storage in production and local filesystem in development. The `ProcurementVirtualFilesystem` class in `deep_agents/services/vfs_procurement_filesystem.py` provides the abstraction layer.

## Related Documentation

- [Implementation Plan](./0009_virtual_filesystem_supporting_documents_implementation_plan.md)
- [Procurement Workflow](../../docs/workflows/procurement/01900_PROCUREMENT_ORDER_WORKFLOW.md)
- [Agent Coding Standards](../../docs/standards/0000_AGENT_CODING_STANDARDS.md)
- [File Naming Standards](../../docs/standards/0000_FILE_NAMING_STANDARDS.md)

---

**Last Updated:** 2026-03-16
**Status:** Phase 1 Complete - Core Infrastructure Implemented