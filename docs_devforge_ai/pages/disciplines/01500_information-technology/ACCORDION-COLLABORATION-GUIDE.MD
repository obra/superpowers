# 0975 Accordion Collaboration Guide

## 🤝 Multi-Organization Collaboration & Sharing System

**Complete Guide for Cross-Organizational Section Sharing, Database Context Switching, and Collaboration Features**

This document consolidates all collaboration-related accordion documentation into a comprehensive guide for multi-organization features, database switching, and collaborative workflows.

---

## 📋 Executive Overview

### System Purpose
The accordion collaboration system enables organizations to share sections and resources across organizational boundaries while maintaining proper access controls, data isolation, and user experience consistency.

### Key Features
- **Multi-Organization Sharing**: Cross-organizational section collaboration
- **Database Context Switching**: Dynamic database selection based on context
- **Access Control**: Granular permissions for shared resources
- **Real-time Synchronization**: Live updates across collaborating organizations
- **Audit Trails**: Complete tracking of collaborative activities

### Collaboration Architecture
```
Organization Isolation
├── Primary Organization (Owner) → Full Access
├── Collaborating Organizations → Shared Access
└── Shared Sections → Controlled Permissions
```

---

## 🏢 Multi-Organization Architecture

### Organization Types

#### Primary Organization
- **Role**: Section owner and primary administrator
- **Access**: Full control over all sections and data
- **Responsibilities**: Define sharing rules, manage collaborators
- **Database**: Primary database context

#### Collaborating Organizations
- **Role**: Access shared sections from primary organization
- **Access**: Limited to explicitly shared sections
- **Responsibilities**: Comply with sharing agreements, maintain data integrity
- **Database**: Switch context for shared access

#### Shared Sections
- **Definition**: Sections explicitly shared between organizations
- **Access Control**: Granular permissions (read, write, admin)
- **Data Ownership**: Remains with primary organization
- **Audit Requirements**: All access logged and tracked

### Organization Relationship Model

```javascript
// Organization collaboration structure
const ORGANIZATION_COLLABORATIONS = {
  "primary_org_id": {
    collaborators: [
      {
        organization_id: "collaborator_org_1",
        shared_sections: ["00400", "00800", "01900"], // Section IDs
        permissions: {
          read: true,
          write: false,
          admin: false
        },
        effective_date: "2025-01-01",
        expiry_date: null
      }
    ]
  }
};
```

---

## 🔄 Database Context Switching

### Context Switching Architecture

#### Single Database Model
**Current Implementation**: All organizations share single Supabase instance
- **Advantages**: Simplified infrastructure, easier data relationships
- **Challenges**: Requires careful tenant isolation, complex RLS policies
- **Context Switching**: Row-level security based on organization_id columns

#### Multi-Database Model
**Future Consideration**: Separate databases per organization
- **Advantages**: Complete data isolation, simplified security
- **Challenges**: Cross-organization queries, data synchronization
- **Context Switching**: Actual database connection switching

### Context Detection Logic

```javascript
// Database context switching logic
function determineDatabaseContext(user, section, organization) {
  // Check if user belongs to primary organization
  if (user.organization_id === organization.primary_id) {
    return 'primary';
  }

  // Check collaboration permissions
  const collaboration = findCollaboration(organization.primary_id, user.organization_id);
  if (collaboration && collaboration.shared_sections.includes(section.id)) {
    return 'collaborator';
  }

  // No access
  return 'denied';
}
```

### Context Switching Implementation

#### Frontend Context Management
```javascript
// Context switching in accordion component
const AccordionContextSwitcher = {
  // Track current database context
  currentContext: 'primary',

  // Switch database context
  switchContext(newContext) {
    this.currentContext = newContext;
    // Update all data sources
    this.updateDataSources(newContext);
    // Refresh accordion display
    this.refreshAccordion();
  },

  // Update API endpoints based on context
  updateDataSources(context) {
    const baseUrl = context === 'primary'
      ? '/api/primary'
      : '/api/collaborator';
    // Update all API calls to use correct base URL
  }
};
```

#### Backend Context Handling
```javascript
// Server-side context switching
const DatabaseContextManager = {
  // Switch database connections
  switchContext(contextType, organizationId) {
    switch (contextType) {
      case 'primary':
        return this.connectToPrimaryDb();
      case 'collaborator':
        return this.connectToCollaboratorDb(organizationId);
      default:
        throw new Error('Invalid context type');
    }
  },

  // Execute queries in correct context
  async executeInContext(context, query, params) {
    const connection = this.switchContext(context.type, context.organizationId);
    return await connection.query(query, params);
  }
};
```

---

## 📊 Collaboration Data Flow

### Section Sharing Workflow

1. **Define Collaboration**
   - Primary organization defines sharing rules
   - Specify sections to share and permission levels
   - Set collaboration duration and conditions

2. **Permission Validation**
   - Collaborating organization requests access
   - Primary organization approves/rejects request
   - Permission matrix established

3. **Context Switching**
   - User accesses shared section
   - System switches to appropriate database context
   - Data displayed with correct permissions

4. **Audit & Monitoring**
   - All access logged with timestamps
   - Usage patterns tracked for optimization
   - Security incidents monitored

### Data Synchronization

#### Real-time Synchronization
- **WebSocket Connections**: Live updates across collaborating organizations
- **Change Notifications**: Immediate propagation of data changes
- **Conflict Resolution**: Automatic merging of concurrent edits
- **Offline Support**: Local caching with sync on reconnection

#### Batch Synchronization
- **Scheduled Updates**: Periodic synchronization of large datasets
- **Incremental Sync**: Only changed data transferred
- **Compression**: Efficient data transfer protocols
- **Error Recovery**: Automatic retry mechanisms for failed syncs

---

## 🔐 Access Control & Security

### Permission Matrix

| Permission Level | Read | Write | Delete | Share | Admin |
|------------------|------|-------|--------|-------|-------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Administrator** | ✅ | ✅ | ✅ | ✅ | ✅ |

### Row-Level Security (RLS) Policies

#### Primary Organization Policies
```sql
-- Primary organization full access
CREATE POLICY "primary_org_full_access" ON sections
FOR ALL USING (
  organization_id = current_user_org_id()
);

-- Collaboration access for shared sections
CREATE POLICY "collaboration_access" ON sections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_collaborations oc
    WHERE oc.primary_org_id = sections.organization_id
    AND oc.collaborator_org_id = current_user_org_id()
    AND oc.shared_sections @> ARRAY[sections.id::text]
    AND oc.permissions->>'read' = 'true'
  )
);
```

#### Collaborator Organization Policies
```sql
-- Read access to shared sections
CREATE POLICY "collaborator_read_access" ON sections
FOR SELECT USING (
  organization_id != current_user_org_id() AND
  EXISTS (
    SELECT 1 FROM organization_collaborations oc
    WHERE oc.primary_org_id = sections.organization_id
    AND oc.collaborator_org_id = current_user_org_id()
    AND oc.shared_sections @> ARRAY[sections.id::text]
    AND oc.permissions->>'read' = 'true'
  )
);

-- Write access to shared sections (if permitted)
CREATE POLICY "collaborator_write_access" ON sections
FOR UPDATE USING (
  organization_id != current_user_org_id() AND
  EXISTS (
    SELECT 1 FROM organization_collaborations oc
    WHERE oc.primary_org_id = sections.organization_id
    AND oc.collaborator_org_id = current_user_org_id()
    AND oc.shared_sections @> ARRAY[sections.id::text]
    AND oc.permissions->>'write' = 'true'
  )
);
```

### Audit Logging

#### Access Audit Trail
```javascript
const AuditLogger = {
  // Log all collaboration access
  logAccess(userId, organizationId, sectionId, action, context) {
    const auditEntry = {
      timestamp: new Date(),
      user_id: userId,
      organization_id: organizationId,
      section_id: sectionId,
      action: action, // 'read', 'write', 'share', etc.
      context: context, // 'primary', 'collaborator'
      ip_address: getClientIP(),
      user_agent: getUserAgent()
    };

    return this.saveAuditEntry(auditEntry);
  },

  // Log permission changes
  logPermissionChange(adminUserId, targetOrgId, sectionId, oldPermissions, newPermissions) {
    const changeEntry = {
      timestamp: new Date(),
      admin_user_id: adminUserId,
      target_organization_id: targetOrgId,
      section_id: sectionId,
      old_permissions: oldPermissions,
      new_permissions: newPermissions,
      change_reason: 'Collaboration setup'
    };

    return this.savePermissionChange(changeEntry);
  }
};
```

---

## 🎨 User Experience Patterns

### Collaboration Indicators

#### Visual Collaboration Cues
- **Shared Section Badges**: Icons indicating shared status
- **Organization Labels**: Clear identification of data ownership
- **Permission Indicators**: Visual cues for user access levels
- **Collaboration Notifications**: Alerts for new sharing invitations

#### Context Switching UI
```jsx
// Context switcher component
const ContextSwitcher = ({ currentContext, availableContexts }) => (
  <div className="context-switcher">
    <select
      value={currentContext}
      onChange={(e) => switchDatabaseContext(e.target.value)}
    >
      <option value="primary">My Organization</option>
      {availableContexts.map(context => (
        <option key={context.id} value={context.id}>
          {context.name} (Shared)
        </option>
      ))}
    </select>
    <div className="context-indicator">
      {currentContext === 'primary' ? '🏢' : '🤝'} {currentContext}
    </div>
  </div>
);
```

### Collaboration Workflow

#### Initiating Collaboration
1. **Select Sections**: Primary org chooses sections to share
2. **Define Permissions**: Set read/write/admin access levels
3. **Invite Organizations**: Send collaboration invitations
4. **Approval Process**: Collaborators accept/decline invitations
5. **Access Granted**: Shared sections appear in collaborator accordions

#### Using Shared Sections
1. **Context Awareness**: System indicates shared vs owned content
2. **Permission Respect**: UI adapts to user permission levels
3. **Change Tracking**: Modifications clearly attributed to source
4. **Sync Status**: Real-time indicators of data synchronization

---

## 🛠️ Implementation Guidelines

### Setting Up Collaboration

#### 1. Define Collaboration Structure
```javascript
const collaborationSetup = {
  primaryOrganization: "simandou",
  collaborators: [
    {
      organization: "bechtel",
      sharedSections: ["contracts", "procurement", "safety"],
      permissions: {
        read: true,
        write: false,
        share: false,
        admin: false
      },
      duration: "ongoing"
    }
  ]
};
```

#### 2. Configure Database Access
```javascript
// Database context configuration
const dbContexts = {
  primary: {
    database: "simandou_production",
    schema: "public",
    connectionString: process.env.PRIMARY_DB_URL
  },
  collaborators: {
    bechtel: {
      database: "bechtel_collaboration",
      schema: "simandou_shared",
      connectionString: process.env.BECHTEL_COLLAB_DB_URL
    }
  }
};
```

#### 3. Set Up RLS Policies
```sql
-- Enable RLS on shared tables
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create collaboration policies
CREATE POLICY "collaboration_access" ON sections
FOR ALL USING (check_collaboration_access(section_id, current_user_id()));
```

#### 4. Configure Accordion Display
```javascript
// Accordion collaboration configuration
const accordionConfig = {
  showCollaborationBadges: true,
  collaborationIndicators: {
    shared: "🤝",
    owned: "🏢",
    restricted: "🔒"
  },
  contextSwitcher: {
    enabled: true,
    position: "top-right",
    style: "dropdown"
  }
};
```

### Monitoring Collaboration

#### Health Checks
- **Database Connectivity**: Verify all context connections
- **RLS Policy Effectiveness**: Test permission enforcement
- **Synchronization Status**: Monitor data consistency
- **Performance Metrics**: Track query performance across contexts

#### Alert Configuration
```javascript
const collaborationAlerts = {
  // Database connection failures
  connectionFailure: {
    threshold: 5, // failures
    window: 300, // 5 minutes
    alert: "Collaboration database unreachable"
  },

  // Permission violations
  permissionViolation: {
    alert: "Unauthorized collaboration access detected",
    severity: "high"
  },

  // Synchronization delays
  syncDelay: {
    threshold: 300, // 5 minutes
    alert: "Collaboration data synchronization delayed"
  }
};
```

---

## 🔍 Troubleshooting Collaboration

### Common Issues & Solutions

#### Context Switching Failures
**Symptoms**: Users can't access shared sections, "Access Denied" errors
**Causes**:
- Database context switching failures
- Incorrect permission configurations
- Network connectivity issues

**Solutions**:
1. Verify database connections for all contexts
2. Check RLS policy configurations
3. Validate user-organization mappings
4. Test network connectivity between databases

#### Permission Synchronization Issues
**Symptoms**: Users have incorrect access levels, changes not reflected
**Causes**:
- Permission cache not updated
- RLS policy delays
- Configuration synchronization failures

**Solutions**:
1. Clear permission caches
2. Force RLS policy refresh
3. Verify configuration synchronization
4. Check audit logs for permission changes

#### Data Consistency Problems
**Symptoms**: Different data shown to different organizations
**Causes**:
- Synchronization delays
- Conflict resolution failures
- Network partitioning

**Solutions**:
1. Check synchronization status
2. Verify conflict resolution rules
3. Test network connectivity
4. Review data consistency logs

---

## 📊 Collaboration Analytics

### Usage Metrics

#### Access Patterns
- **Section Popularity**: Most accessed shared sections
- **Organization Activity**: Collaboration frequency by organization
- **Time Patterns**: Peak collaboration hours and days
- **User Engagement**: Individual user collaboration patterns

#### Performance Metrics
- **Response Times**: Query performance across contexts
- **Synchronization Latency**: Data sync delay measurements
- **Error Rates**: Collaboration-related error frequencies
- **Uptime**: Collaboration system availability

### Reporting Dashboards

#### Executive Reports
- **Collaboration Overview**: High-level collaboration metrics
- **Organization Relationships**: Current collaboration partnerships
- **Resource Utilization**: Shared resource usage statistics
- **ROI Analysis**: Collaboration benefits and costs

#### Technical Reports
- **System Health**: Database and network performance
- **Security Incidents**: Collaboration security events
- **Performance Trends**: Historical performance data
- **Capacity Planning**: Future collaboration scaling needs

---

## 🔄 Migration & Scaling

### Adding New Collaborators

1. **Organization Onboarding**
   - Verify organization requirements and compatibility
   - Set up database access and security credentials
   - Configure network connectivity and firewalls

2. **Collaboration Configuration**
   - Define sharing scope and permission levels
   - Set up data synchronization rules
   - Configure monitoring and alerting

3. **User Training**
   - Provide collaboration guidelines and best practices
   - Train on context switching and permission awareness
   - Establish support channels for collaboration issues

### Scaling Considerations

#### Database Scaling
- **Connection Pooling**: Efficient database connection management
- **Read Replicas**: Distribute read load across multiple instances
- **Sharding**: Horizontal database partitioning for large datasets

#### Network Scaling
- **CDN Integration**: Content delivery network for global access
- **Load Balancing**: Distribute traffic across multiple servers
- **Caching Strategies**: Reduce database load with intelligent caching

#### Organizational Scaling
- **Collaboration Templates**: Standardized collaboration patterns
- **Automated Onboarding**: Streamlined new collaborator setup
- **Self-Service Tools**: User-friendly collaboration management

---

## 📚 Related Documentation

### Core System Documentation
- **[0975_ACCORDION_MASTER_GUIDE.md](./0975_ACCORDION_MASTER_GUIDE.md)** - Complete system overview and technical implementation
- **[0975_ACCORDION_HIERARCHY_REFERENCE.md](./0975_ACCORDION_HIERARCHY_REFERENCE.md)** - Complete hierarchy specifications and configurations

### Error Tracking & Fixes
- **[1300_00000_ERROR_TRACKING_ALL.md](../error-tracking/1300_00000_ERROR_TRACKING_ALL.md)** - Consolidated accordion bug fixes and troubleshooting

### Integration Points
- **[0750_UI_MASTER_GUIDE.md](./0750_UI_MASTER_GUIDE.md)** - User interface system overview
- **[0000_DOCUMENTATION_MASTER_GUIDE.md](../0000_DOCUMENTATION_MASTER_GUIDE.md)** - Master documentation index

---

## 📋 Version History

| Version | Date | Major Changes |
|---------|------|---------------|
| 1.0 | 2025-12-11 | Initial consolidated collaboration guide creation |
|  |  | Unified content from 4 collaboration and multi-org files |
|  |  | Integrated database context switching architecture |
|  |  | Added comprehensive security and access control guidelines |

---

## 🎯 Success Metrics

### Collaboration Metrics
- ✅ **Access Reliability**: Zero unauthorized access incidents
- ✅ **Data Consistency**: <1% synchronization conflicts
- ✅ **Performance**: <2s context switching time
- ✅ **User Adoption**: 95% of eligible users actively collaborating

### Security Metrics
- ✅ **Audit Compliance**: 100% of collaboration activities logged
- ✅ **Permission Accuracy**: Zero permission misconfigurations
- ✅ **Data Protection**: No data leakage incidents
- ✅ **Incident Response**: <15min average response time

### Business Value Metrics
- ✅ **Efficiency Gains**: 30% reduction in duplicate work
- ✅ **Knowledge Sharing**: 40% increase in cross-organization insights
- ✅ **Project Acceleration**: 25% faster project completion through collaboration
- ✅ **Cost Savings**: Reduced redundant resource allocation

---

*This collaboration guide serves as the definitive reference for multi-organization accordion features, database context switching, and collaborative workflows. All collaboration implementations should follow these guidelines and update this document accordingly.*
