# Page System Documentation

This document provides comprehensive documentation for the page system architecture, including page prefixes, routing, organization assignments, and integration with agents and modals.

## Overview

The page system organizes the EPCM platform into distinct functional areas, each identified by a unique page prefix and associated with specific agents, modals, and document stores. This modular approach enables scalable, maintainable, and organization-specific configurations.

## Page Structure

### Page Prefix System
Pages are identified by 5-digit numeric prefixes that serve as unique identifiers across the platform:

| Page Prefix | Page Name | Description | Active Agents |
|-------------|-----------|-------------|---------------|
| **00435** | Contracts Post Award | Contract management and analysis | 6 agents |
| **00889** | Director Finance | Financial management and reporting | 3 agents |
| **03010** | Email Management | Email processing and automation | 5 agents |
| **00300** | Construction | Construction project management | 2 agents |

### Page Configuration
Each page maintains its own:
- **Agent configurations**: Specific AI agents for page functionality
- **Modal dialogs**: Page-specific modal interfaces
- **Document stores**: Dedicated document storage and processing
- **Routing**: URL structure based on page prefix
- **Styling**: Page-specific themes and components
- **Chatbot specifications**: AI assistant integration and capabilities (`1300_[PAGE_ID]_CHATBOT_SPEC.md`)

## Routing Architecture

### URL Structure
```
/{page_prefix}-{page-name}/
├── /components/
├── /modals/
├── /agents/
├── /documents/
└── /api/
```

**Examples**:
- `/00435-contracts-post-award/`
- `/00889-director-finance/`
- `/03010-email-management/`
- `/00300-construction/`

### Dynamic Routing
- **Page Prefix**: Extracted from URL for configuration loading
- **State Management**: Page-specific state persistence
- **Component Loading**: Lazy loading of page-specific components
- **API Endpoints**: Page-scoped API routes

## Organization Assignment

### Current Implementation
**Single Organization Model**: All pages are currently assigned to **"Organisation - EPCM"**

### Organization Structure
```json
{
  "organization": {
    "id": "epcm-org-uuid",
    "name": "Organisation - EPCM",
    "pages": ["00435", "00889", "03010", "00300"],
    "agents": ["all-16-agents"],
    "document_stores": ["00435-store", "00889-store", "03010-store", "00300-store"]
  }
}
```

### Future Multi-Organization Support
**Planned Architecture**:
- **Organization-to-Pages**: Many-to-many relationship
- **Page Templates**: Reusable page configurations
- **Cross-Organization Sharing**: Shared agents and documents
- **Organization-Specific Customizations**: Branding and functionality

## Page Components

### Directory Structure
```
client/src/pages/
├── 00435-contracts-post-award/
│   ├── components/
│   │   ├── ContractList.js
│   │   ├── ContractDetails.js
│   │   └── ContractAnalytics.js
│   ├── modals/
│   │   ├── 00435-03-LegalAnalysisModal.js
│   │   ├── 00435-03-FinancialAnalysisModal.js
│   │   └── ...
│   ├── agents/
│   │   ├── LegalAnalysisAgent.js
│   │   └── ContractAnalysisAgent.js
│   └── api/
│       ├── contracts.js
│       └── documents.js
├── 00889-director-finance/
│   ├── components/
│   ├── modals/
│   └── ...
├── 03010-email-management/
│   └── ...
└── 00300-construction/
    └── ...
```

### Component Architecture
- **Page Shell**: Common layout and navigation
- **Page-Specific Components**: Unique functionality per page
- **Shared Components**: Reusable UI elements
- **Agent Integration**: Page-specific agent configurations

## Agent Integration

### Page-to-Agent Mapping
Each page has dedicated agents optimized for its domain:

#### 00435 - Contracts Post Award
- **Legal Analysis Agent**: Contract review and analysis
- **Financial Analysis Agent**: Financial terms and calculations
- **Contract Analysis Agent**: Comprehensive contract evaluation
- **Contract Notifications Agent**: Automated alerts and updates
- **Correspondence Reply Agent**: AI-generated responses
- **Minutes Compile Agent**: Meeting documentation

#### 00889 - Director Finance
- **Finance Minutes Compile Agent**: Financial meeting documentation
- **Method Statement Agent**: Process documentation
- **Finance Risk Assessment Agent**: Risk analysis and reporting

#### 03010 - Email Management
- **Email Categorization Agent**: Automatic email classification
- **Email Auto Response Agent**: AI-generated email replies
- **Email AI Search Agent**: Advanced email search
- **Email AI Tools Agent**: Email management utilities
- **Email Bulk AI Tools Agent**: Batch email processing

#### 00300 - Construction
- **Construction Progress Agent**: Project tracking and reporting
- **Construction Safety Agent**: Safety analysis and compliance

## Document Store Integration

### Page-Specific Document Stores
Each page has dedicated document storage:

| Page Prefix | Store ID | Document Types | Storage Path |
|-------------|----------|----------------|--------------|
| **00435** | 00435-store-uuid | Contracts, Legal docs | documents/00435 |
| **00889** | 00889-store-uuid | Financial documents | documents/00889 |
| **03010** | 03010-store-uuid | Emails, Attachments | documents/03010 |
| **00300** | 00300-store-uuid | Construction docs | documents/00300 |

### Document Processing
- **Page-Specific Processing**: Tailored processing for document types
- **Agent Integration**: Direct integration with page agents
- **Real-time Updates**: Immediate availability of new documents
- **Cross-Page Sharing**: Documents can be shared between pages

## State Management

### Page State
- **Current View**: Active page and sub-section
- **Selected Documents**: Currently viewed documents
- **Active Agents**: Currently running AI agents
- **Modal State**: Open modals and their configurations

### User Preferences
- **Page Layout**: Customizable page layouts
- **Default Views**: User-specific default views
- **Saved Searches**: Persistent search queries
- **Notification Preferences**: Page-specific alerts

## API Architecture

### Page-Specific Endpoints
```javascript
// 00435 - Contracts
GET /api/00435/contracts
POST /api/00435/contracts/analyze
GET /api/00435/documents

// 00889 - Finance
GET /api/00889/financial-reports
POST /api/00889/budgets/analyze
GET /api/00889/invoices

// 03010 - Email
GET /api/03010/emails
POST /api/03010/emails/categorize
GET /api/03010/search

// 00300 - Construction
GET /api/00300/projects
POST /api/00300/safety-reports
GET /api/00300/progress-updates
```

### Cross-Page APIs
- **Document Sharing**: Share documents between pages
- **Agent Migration**: Move agents between pages
- **Unified Search**: Search across all pages
- **Organization Management**: Multi-organization support

## Performance Optimization

### Lazy Loading
- **Components**: Load page components on demand
- **Agents**: Initialize agents when needed
- **Documents**: Stream document loading
- **APIs**: Batch API requests

### Caching Strategy
- **Page Configuration**: Cache page settings
- **Document Metadata**: Cache document information
- **Agent Responses**: Cache frequent agent outputs
- **User Preferences**: Cache user settings

## Security & Access Control

### Page-Level Permissions
- **Role-Based Access**: Different access levels per page
- **Organization Isolation**: Pages scoped to organizations
- **Contributor Management**: Page-specific contributor roles
- **Audit Logging**: Track all page interactions

### RLS Policies
```sql
-- Page access control
CREATE POLICY "Users can access pages in their organization"
ON pages FOR SELECT
USING (
  organization_id = auth.jwt()->>'org_id'
);

-- Document access by page
CREATE POLICY "Users can access documents for their pages"
ON flowise_documents FOR SELECT
USING (
  store_id IN (
    SELECT id FROM document_stores 
    WHERE storage_path LIKE CONCAT('%', auth.jwt()->>'page_prefix', '%')
  )
);
```

## Monitoring & Analytics

### Page Usage Metrics
- **Page Views**: Number of visits per page
- **Agent Usage**: Frequency of agent interactions
- **Document Access**: Most accessed documents per page
- **User Engagement**: Time spent on each page

### Performance Monitoring
```sql
-- Page usage statistics
SELECT 
  page_prefix,
  page_name,
  COUNT(*) as total_visits,
  AVG(session_duration) as avg_session_time,
  COUNT(DISTINCT user_id) as unique_users
FROM page_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY page_prefix, page_name
ORDER BY total_visits DESC;

-- Agent usage by page
SELECT 
  p.page_prefix,
  a.agent_name,
  COUNT(*) as agent_invocations,
  AVG(response_time) as avg_response_time
FROM agent_usage au
JOIN pages p ON au.page_id = p.id
JOIN agents_tracking a ON au.agent_id = a.id
WHERE au.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.page_prefix, a.agent_name;
```

## Troubleshooting

### Common Issues
1. **Page not loading**: Check page prefix configuration
2. **Agents not available**: Verify agent assignments
3. **Documents not accessible**: Check store configuration
4. **Permission errors**: Review access control settings

### Debug Tools
```javascript
// Check page configuration
GET /api/pages/{page_prefix}/config

// Validate agent assignments
GET /api/pages/{page_prefix}/agents

// Test document store connectivity
GET /api/pages/{page_prefix}/documents/health

// Check user permissions
GET /api/pages/{page_prefix}/permissions
```

## Best Practices

### Page Development
- **Consistent Structure**: Follow established patterns
- **Modular Design**: Reusable components and utilities
- **Performance Focus**: Optimize for speed and efficiency
- **Accessibility**: Ensure pages are accessible

### Configuration Management
- **Version Control**: Track configuration changes
- **Environment Separation**: Different configs for dev/staging/prod
- **Documentation**: Maintain clear documentation
- **Testing**: Comprehensive testing for each page

## Future Enhancements

### Planned Features
- **Page Templates**: Reusable page configurations
- **Drag-and-Drop Builder**: Visual page builder
- **A/B Testing**: Page variant testing
- **Custom Branding**: Organization-specific themes

### Integration Roadmap
- **External Integrations**: Third-party service integration
- **Mobile Optimization**: Enhanced mobile experience
- **Real-time Collaboration**: Multi-user editing
- **Advanced Analytics**: Detailed page analytics
