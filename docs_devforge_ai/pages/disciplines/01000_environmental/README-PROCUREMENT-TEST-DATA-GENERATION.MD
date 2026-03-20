# 01900 Procurement Workflow Test Data Generation Documentation

## Overview

This document provides comprehensive test data for the 01900 Procurement workflow, including the complete 6-agent system integration. The test data covers all workflow stages from order creation through agent processing to final document generation.

## Generated Test Data Files

### JavaScript Population Scripts (For API-based Population)
- **`populate-document-variations.js`** - API-based script to populate document variations
- **`populate-document-variation-sections.js`** - API-based script to populate variation sections

### SQL Files (For Supabase Population)
- **`populate_procurement_test_data.sql`** - Complete SQL script to populate all test data
- **`tables/user_management.sql`** - User data with discipline assignments
- **`tables/templates.sql`** - Template data for procurement document generation
- **`tables/procurement_orders.sql`** - Procurement orders with workflow metadata
- **`tables/tasks.sql`** - Task management data for parallel workflow execution
- **`tables/agent_workflow_executions.sql`** - 6-agent system execution records

**Notes:**
- Organizations are preserved as they are central to accordion functionality
- Disciplines are preserved as they are part of existing system structure

### JSON Files (For Reference/Documentation)
- **`tables/procurement_orders.json`** - Human-readable procurement orders
- **`tables/tasks.json`** - Human-readable task data
- **`tables/agent_workflow_executions.json`** - Human-readable agent executions

## Test Data Coverage

### Organizations (5 records)
- EPCM Engineering (primary test organization)
- Mega Construction Corp, Industrial Solutions Ltd
- Tech Infrastructure Inc, Safety First Corp

### Users (15 records)
- Procurement officers, engineers, safety managers
- Quality assurance specialists, IT professionals
- Multi-discipline assignments across all users

### Disciplines (10 records)
- Procurement (01900), Electrical (00860), Civil (00850)
- Chemical (00835), Mechanical (00870), Safety (02400)
- Quality (02200), Logistics (01700), IT (01500), Environmental (02000)

### Document Variations (5 records)
- Standard Purchase Order Variation (6 sections)
- Service Order Variation (5 sections)
- Work Order Variation (5 sections)
- Chemical Processing Equipment Variation (5 sections)
- IT Infrastructure Services Variation (5 sections)

### Templates (7 records)
- Equipment Rental Agreement Form
- Supplier Evaluation Form
- Contractor Performance Review
- 4 SOW Templates (Purchase Order, Service Order, Work Order, Chemical Processing, IT Services)

### Procurement Orders (5 records)
- **PO-2026-001**: Industrial Equipment Procurement (high priority, in progress)
- **SO-2026-002**: Maintenance Services Contract (medium priority, draft)
- **WO-2026-003**: Construction Equipment Rental (high priority, approved)
- **PO-2026-004**: Chemical Processing Equipment (critical priority, in review)
- **SO-2026-005**: IT Infrastructure Services (medium priority, completed)

### Tasks (9 records)
- SOW generation tasks (high priority)
- Appendix contribution tasks (normal priority, parallel execution)
- Approval tasks (high priority, sequential/parallel routing)

### Agent Workflow Executions (3 records)
- Complete 6-agent execution for PO-2026-001
- Template Analysis, Requirement Extraction, Compliance Validation
- Field Population, Quality Assurance, Final Review
- Realistic confidence scores, processing times, and quality gates

## Agent Workflow Test Coverage

### Agent 1: Template Analysis Agent
- Input: Template compatibility analysis
- Output: Compatibility scores, requirement identification
- Quality Gate: Template suitability validation

### Agent 2: Requirement Extraction Agent
- Input: Order description and template analysis
- Output: Categorized requirements (technical, quality, safety, commercial)
- Quality Gate: Requirement completeness validation

### Agent 3: Compliance Validation Agent
- Input: Extracted requirements and regulatory context
- Output: Compliance gap analysis and regulatory requirements
- Quality Gate: Compliance risk assessment

### Agent 4: Field Population Agent
- Input: Template fields and extracted requirements
- Output: Auto-populated form fields with confidence scores
- Quality Gate: Field validation and business rule compliance

### Agent 5: Quality Assurance Agent
- Input: Populated document and previous agent outputs
- Output: Quality assessment with corrections and optimization metrics
- Quality Gate: Overall document quality validation

### Agent 6: Final Review Agent
- Input: Quality assessment and workflow summary
- Output: Executive approval recommendation with next steps
- Quality Gate: Final document readiness validation

## Workflow Test Scenarios

### Scenario 1: Complete Purchase Order (PO-2026-001)
- **Status**: In Progress with active agent workflow
- **Agents**: All 6 agents executed successfully
- **Tasks**: Mixed completion status (some completed, some pending)
- **Approvals**: Sequential approval routing (pending)

### Scenario 2: Service Order Draft (SO-2026-002)
- **Status**: Draft with SOW generation in progress
- **Agents**: Template Analysis Agent completed
- **Tasks**: SOW generation active, appendix tasks pending
- **Approvals**: Multi-step approval matrix defined

### Scenario 3: Work Order Approved (WO-2026-003)
- **Status**: Approved with parallel approvals completed
- **Agents**: Not yet triggered (pre-agent workflow)
- **Tasks**: All approval tasks completed
- **Approvals**: Parallel routing with multiple approvers

### Scenario 4: Chemical Processing Critical (PO-2026-004)
- **Status**: In Review with complex requirements
- **Agents**: Not yet executed
- **Tasks**: Complex approval matrix with 4-step routing
- **Approvals**: Sequential with multiple specialized approvals

### Scenario 5: IT Services Completed (SO-2026-005)
- **Status**: Completed end-to-end workflow
- **Agents**: Not included (different workflow path)
- **Tasks**: All tasks completed successfully
- **Approvals**: Simple 2-step approval completed

## Data Relationships & Integrity

### Foreign Key Relationships
- All procurement orders reference valid users and organizations
- Tasks reference procurement orders and assigned users
- Agent executions reference procurement orders
- Templates reference organizations
- Users reference organizations and disciplines

### Business Logic Validation
- Discipline assignments match user capabilities
- Approval matrices follow organizational hierarchies
- Task priorities align with order criticality
- Agent confidence scores reflect realistic processing

### JSONB Data Structure
- Discipline assignments use proper arrays
- User assignments map to discipline requirements
- Approval matrices include role-based routing
- Agent metadata includes processing statistics

## Performance Indexes Created

### Procurement Orders
- `idx_procurement_orders_status` - Status filtering
- `idx_procurement_orders_created_by` - User-based queries
- `idx_procurement_orders_organization` - Multi-tenant isolation
- `idx_procurement_orders_sow_template` - Template relationships

### Tasks
- `idx_tasks_business_object` - Business object relationships
- `idx_tasks_assigned_to` - User task assignments
- `idx_tasks_status` - Status-based filtering
- `idx_tasks_type` - Task type categorization
- `idx_tasks_discipline` - Discipline-based grouping

### Agent Workflow Executions
- `idx_agent_workflow_executions_order` - Order-based grouping
- `idx_agent_workflow_executions_agent` - Agent performance analysis
- `idx_agent_workflow_executions_stage` - Workflow stage tracking
- `idx_agent_workflow_executions_status` - Execution status monitoring
- `idx_agent_workflow_executions_executed_at` - Time-based analysis

## Usage Instructions

### For Supabase Population
1. Execute `populate_procurement_test_data.sql` in Supabase SQL Editor
2. Verify data population with provided SELECT queries
3. Check foreign key relationships and data integrity

### For Development Testing
1. Use individual table SQL files for selective data loading
2. Reference JSON files for data structure understanding
3. Modify data as needed for specific test scenarios

### For Client Installations
1. Run the complete population script
2. Verify all indexes are created
3. Test workflow functionality with sample data

## Quality Assurance

### Data Validation Checks
- All foreign keys properly linked
- JSONB structures syntactically correct
- Date/time values in consistent format
- Numeric values within realistic ranges
- Text fields contain appropriate content

### Business Logic Validation
- User assignments match discipline requirements
- Approval workflows follow organizational rules
- Task priorities align with order importance
- Agent outputs reflect realistic processing

### Performance Considerations
- Indexes created for common query patterns
- JSONB queries optimized for performance
- Data volume appropriate for testing (not production scale)
- Realistic timestamps for temporal analysis

## Maintenance & Updates

### Adding New Test Data
1. Follow existing naming conventions (uuid-proc-XXX, uuid-task-XXX, etc.)
2. Maintain foreign key relationships
3. Update indexes if new query patterns introduced
4. Document new scenarios in this README

### Updating Existing Data
1. Use ON CONFLICT clauses for safe updates
2. Maintain data consistency across related tables
3. Update JSON structures carefully
4. Test workflow impact before deployment

### Version Control
- All SQL files are version controlled
- JSON files serve as human-readable references
- Changes should be documented with rationale
- Backward compatibility maintained where possible

## Troubleshooting

### Common Issues
- **Foreign Key Violations**: Check referenced IDs exist in parent tables
- **JSONB Syntax Errors**: Validate JSON structure before execution
- **Index Creation Failures**: Check if indexes already exist
- **Permission Issues**: Ensure proper database permissions for user

### Verification Queries
```sql
-- Check data population
SELECT 'Organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'Users', COUNT(*) FROM user_management
UNION ALL
SELECT 'Disciplines', COUNT(*) FROM disciplines
UNION ALL
SELECT 'Templates', COUNT(*) FROM templates
UNION ALL
SELECT 'Procurement Orders', COUNT(*) FROM procurement_orders
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Agent Executions', COUNT(*) FROM agent_workflow_executions;

-- Check relationships
SELECT po.order_number, COUNT(t.id) as tasks, COUNT(awe.id) as agent_executions
FROM procurement_orders po
LEFT JOIN tasks t ON t.business_object_id = po.id
LEFT JOIN agent_workflow_executions awe ON awe.procurement_order_id = po.id
GROUP BY po.id, po.order_number
ORDER BY po.order_number;
```

## Related Documentation

- **`1300_TEST_DATA_GENERATION_PROCEDURE.md`** - General test data generation procedures
- **`1300_01900_PROCUREMENT_AGENT_IMPLEMENTATION_PROCEDURE.md`** - Agent workflow implementation details
- **`1300_01900_PROCUREMENT_DOCUMENT_GENERATION_WORKFLOW.md`** - Complete workflow specification
- **`0300_DATABASE_SCHEMA_MASTER_GUIDE.md`** - Database schema documentation

---

**Test Data Generated**: January 2026
**Workflow Coverage**: Complete 6-agent procurement system
**Data Quality**: Production-ready with full integrity
**Usage**: Development testing, client installations, workflow validation
