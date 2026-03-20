# Modal System Documentation

This document provides comprehensive documentation for the modal system, including modal configurations, component mappings, and integration with pages and agents.

## Overview

The modal system serves as the primary interface layer between AI agents and user interactions, providing configurable modal dialogs that integrate with specific pages and agent functionalities.

## Core Table Structure

### modal_configurations
**Purpose**: Stores modal configurations and metadata for dynamic modal generation  
**Columns**:
- id (uuid) - Primary key
- modal_key (text) - Unique identifier (e.g., "A-00435-03-001-legal-analysis")
- display_name (text) - Human-readable name (e.g., "Legal Analysis")
- component_path (text) - Path to React component
- modal_type (text) - Type of modal (agent, upsert, etc.)
- page_prefix (text) - Associated page prefix (e.g., "00435", "00889", "03010")
- page_name (text) - Associated page name
- description (text) - Modal description
- is_active (boolean) - Whether modal is active
- created_by (uuid) - Foreign key to contributors
- created_at (timestamp) - Creation time

## Modal Key Structure

Modal keys follow a standardized naming convention:
```
A-{page_prefix}-{state}-{sequence}-{agent_type}
```

**Example**: `A-00435-03-001-legal-analysis`
- **A**: Indicates agent modal
- **00435**: Page prefix (Contracts Post Award)
- **03**: State/phase identifier
- **001**: Sequence number
- **legal-analysis**: Agent type identifier

## Modal Types

### Agent Modals
- **Purpose**: Interface for AI agent interactions
- **Component Path**: Typically located in `client/src/pages/{page_prefix}/components/modals/`
- **Integration**: Connected to specific agents via `agent_modal_assignments`

### Upsert Modals
- **Purpose**: Create/edit operations for data management
- **Component Path**: Usually generic components for CRUD operations
- **Integration**: Used for managing entities like documents, contracts, etc.

## Page Integration

### Page Prefix Mapping
| Page Prefix | Page Name | Active Modals |
|-------------|-----------|---------------|
| **00435** | Contracts Post Award | 6 agent modals |
| **00889** | Director Finance | 3 agent modals |
| **03010** | Email Management | 5 agent modals |
| **00300** | Construction | 2 agent modals |

### Component Structure
```
client/src/pages/
├── 00435-contracts-post-award/
│   └── components/
│       └── modals/
│           ├── 00435-03-LegalAnalysisModal.js
│           ├── 00435-03-FinancialAnalysisModal.js
│           └── ...
├── 00889-director-finance/
│   └── components/
│       └── modals/
│           ├── 00889-03-FinanceMinutesModal.js
│           └── ...
└── 03010-email-management/
    └── components/
        └── modals/
            ├── 03010-03-EmailCategorizationModal.js
            └── ...
```

## Agent Integration

### Modal-to-Agent Mapping
Modals are linked to agents through the `agent_modal_assignments` table:
- **agent_name_id**: References agent categories from `agent_names`
- **modal_configuration_id**: References specific modal configurations
- **page_id**: References the associated page

### Dynamic Modal Loading
The system supports dynamic modal loading based on:
- **Page context**: Modals are loaded based on current page prefix
- **Agent availability**: Only active agents show their associated modals
- **User permissions**: Modals respect contributor access levels

## Configuration Management

### Creating New Modal Configurations
1. **Define modal_key**: Follow naming convention
2. **Set component_path**: Point to React component
3. **Configure page_prefix**: Associate with specific page
4. **Set display_name**: User-friendly name
5. **Configure agent mapping**: Link to appropriate agent

### Modal Lifecycle
- **Creation**: Modal configuration added to database
- **Activation**: `is_active` flag set to true
- **Assignment**: Linked to agents via `agent_modal_assignments`
- **Usage**: Tracked via `last_used` timestamps
- **Deactivation**: `is_active` flag set to false

## Best Practices

### Naming Conventions
- Use descriptive modal keys that indicate purpose
- Follow the standardized format for consistency
- Include page prefix for clear association

### Component Organization
- Store modal components in page-specific directories
- Use consistent file naming: `{page_prefix}-{state}-{agent-type}Modal.js`
- Maintain clear separation between modal logic and business logic

### Performance Considerations
- Lazy load modal components when possible
- Cache modal configurations for frequently used modals
- Monitor modal usage via `last_used` timestamps

## Troubleshooting

### Common Issues
1. **Modal not appearing**: Check `is_active` flag and page prefix
2. **Agent not loading**: Verify agent_modal_assignments relationships
3. **Component not found**: Validate component_path and file existence
4. **Permission errors**: Check contributor_id and access rights

### Debug Queries
```sql
-- Get all modals for a specific page
SELECT * FROM modal_configurations 
WHERE page_prefix = '00435' 
AND is_active = true;

-- Get agent assignments for a modal
SELECT * FROM agent_modal_assignments 
WHERE modal_configuration_id = 'modal-uuid-here';

-- Check modal usage statistics
SELECT page_prefix, COUNT(*) as modal_count 
FROM modal_configurations 
WHERE is_active = true 
GROUP BY page_prefix;
```

## Future Enhancements

### Planned Features
- **Modal templates**: Reusable modal configurations
- **Dynamic modal generation**: Auto-create modals based on agent definitions
- **Multi-organization support**: Organization-specific modal configurations
- **Modal versioning**: Track changes to modal configurations over time

### Integration Roadmap
- **Real-time updates**: Live modal configuration updates
- **A/B testing**: Support for modal variant testing
- **Analytics integration**: Detailed modal usage analytics
- **Custom styling**: Organization-specific modal themes
