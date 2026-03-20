# Working Directory - Chat Data Retention

## Purpose

The `/working/` directory serves as the **Virtual Filesystem (VFS) workspace for agent collaboration and chat data retention**. This directory is specifically dedicated to storing structured procurement data collected through the interactive chat workflow.

## Contents

This directory contains JSON files with structured procurement requirements extracted from user conversations through the 48-step procurement order creation chat workflow.

### File Naming Convention
```
procurement_requirements_{session_id}.json
```

### Data Structure
Each file contains the complete set of procurement requirements collected through the chat interface:

```json
{
  "session_id": "chat-session-uuid",
  "collected_at": "2026-03-19T10:30:00Z",
  "procurement_data": {
    "type": "purchase_order|service_order|work_order",
    "estimated_value": 500000,
    "currency": "ZAR|USD|EUR|GBP",
    "timeline_days": 90,
    "items": [
      {
        "group": "Materials|Equipment|Services",
        "category": "Steel|Concrete|Electrical|etc",
        "specifications": "Detailed technical specifications",
        "quantity": 50,
        "incoterms": "DAP|DDP|FOB|CIF|etc",
        "delivery_point": "Specific delivery location",
        "packing_type": "Standard|Hazmat|Specialized"
      }
    ],
    "compliance_requirements": ["OHSA", "ISO 9001", "CIDB GR8"],
    "supplier_constraints": {
      "cidb_required": "GR8",
      "local_content": true,
      "certifications": ["ISO 9001", "B-BBEE Level 2"]
    }
  },
  "confidence_scores": {
    "procurement_type": 0.95,
    "estimated_value": 0.92,
    "items": 0.85,
    "compliance": 0.80
  },
  "data_sources": {
    "procurement_type": "explicit_user_input",
    "estimated_value": "inferred_from_context",
    "items": "structured_extraction",
    "compliance": "inferred_from_requirements"
  }
}
```

## Data Collection Points (48 Steps)

The chat workflow collects data across these categories:

### 1. Procurement Basics (8 points)
- Order type selection
- Primary discipline
- Title and description
- Value and currency
- Project association
- Supplier information
- Special requirements
- Supporting documents

### 2. Template Selection (6 points)
- SOW template filtering
- Template selection
- Template preview
- Discipline suggestions
- Task sequence preview
- Template validation

### 3. Discipline Assignment (5 points)
- Discipline mapping
- Appendix assignments
- User assignments
- Assignment validation
- Template suggestions

### 4. Approval Configuration (6 points)
- Approval matrix selection
- Cover sheet options
- Routing type (sequential/parallel/hybrid)
- Complex routing paths
- Approver validation
- Approval thresholds

### 5. Item Specifications (12 points)
- Item groups (Materials/Equipment/Services)
- Categories (Steel/Concrete/Electrical/etc)
- Technical specifications
- Quantities and units
- Quality requirements
- Certification requirements
- Supplier preferences
- Budget constraints

### 6. Commercial Terms (6 points)
- Incoterms selection
- Delivery points
- Packing requirements
- Insurance requirements
- Payment terms
- Currency specifications

### 7. Compliance & Regulatory (5 points)
- OHSA requirements
- ISO standards
- CIDB ratings
- B-BBEE levels
- Local content requirements

## Agent Access

Agents throughout the procurement workflow access this data for:

- **Context Retention**: Maintains user requirements across workflow steps
- **Data Consistency**: Ensures all agents work from same structured data
- **Audit Trail**: Complete record of user-provided requirements
- **Agent Collaboration**: Allows agents to build upon collected data

## File Lifecycle

1. **Creation**: Generated during chat workflow completion
2. **Access**: Read by agents throughout procurement process
3. **Retention**: Maintained for order duration
4. **Archival**: Moved to long-term storage after order completion

## Related Documentation

- [Chat Integration Summary](../memories/1900_0000_PROCUREMENT_AGENT_CHAT_INTEGRATION_SUMMARY.MD)
- [VFS Implementation Plan](../plan/1900_VIRTUAL_FILESYSTEM_IMPLEMENTATION_PLAN.MD)
- [Procurement Workflow User Guide](../workflow_docs/1900_PROCUREMENT_WORKFLOW_USER_GUIDE.MD)

## Maintenance

- Files are automatically created by the chat workflow
- Manual editing should be avoided to maintain data integrity
- Regular cleanup removes files for completed orders
- Backup procedures ensure data persistence

## Actual File Storage Location

**⚠️ IMPORTANT:** This documentation directory (`/docs/disciplines/01900_procurement/working/`) contains only README files explaining the system.

**Actual VFS chat data retention files are stored in order-specific directories at:**
```
/Users/_General/Mar-16-2/deep-agents/deep_agents/agents/pages/01900_procurement/orders/{order_id}/working/procurement_requirements_{session_id}.json
```

**Example:**
- Order: `PROC_001`
- Session: `chat123`
- Full path: `/Users/_General/Mar-16-2/deep-agents/deep_agents/agents/pages/01900_procurement/orders/PROC_001/working/procurement_requirements_chat123.json`

See the [VFS Order Structure README](../../../../deep-agents/deep_agents/agents/pages/01900_procurement/orders/README.md) for complete implementation details.
