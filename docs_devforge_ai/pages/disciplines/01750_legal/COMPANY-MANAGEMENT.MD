# Company Management

## Overview

The company management system provides comprehensive functionality for managing companies, users, roles, and their relationships within the multi-tenant architecture. This document outlines the core features and implementation details of the company management system.

## Core Components

### 1. User Management (0155-user-core.js)

```javascript
// Core user management functionality
- User creation and updates
- Profile management
- Company association
- Role assignment
```

### 2. Role Management (0155-role-management.js)

```javascript
// Role and permission handling
- Role definition
- Permission assignment
- Access control
- Role hierarchy
```

### 3. Company Management (0155-company-management.js)

```javascript
// Company operations
- Company creation
- Settings management
- User assignment
- Department structure
```

### 4. Audit Logging (0155-audit-logging.js)

```javascript
// Activity tracking
- User actions
- System changes
- Security events
- Compliance logging
```

## Database Structure

### Companies Table

```sql
-- Reference: setup_companies.sql
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Special Organizations

#### Organisations - All
A special organization that provides cross-organizational filtering capabilities:

- **Name**: "Organisations - All"
- **ID**: 6 (Database ID)
- **Config ID**: "org-6-uuid"
- **Purpose**: Enables users to view pages from all organizations within their selected sector
- **Behavior**: Bypasses organization-specific filtering while maintaining sector-based filtering

```javascript
// When "Organisations - All" is selected:
// - Shows pages from ALL organizations within the active sector
// - Maintains sector-based security boundaries
// - Provides comprehensive cross-organizational visibility
```

### Company Relationships

```sql
-- Reference: setup_company_management.sql
CREATE TABLE company_relationships (
    id UUID PRIMARY KEY,
    parent_company_id UUID REFERENCES companies(id),
    child_company_id UUID REFERENCES companies(id),
    relationship_type VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Details

### 1. Company Creation

```javascript
async function createCompany(companyData) {
    // Validate company data
    validateCompanyData(companyData);

    // Create company record
    const company = await db.companies.create({
        name: companyData.name,
        settings: companyData.settings || defaultSettings
    });

    // Setup initial configuration
    await setupCompanyConfiguration(company.id);

    return company;
}
```

### 2. User Assignment

```javascript
async function assignUserToCompany(userId, companyId, role) {
    // Verify company exists
    const company = await getCompany(companyId);
    if (!company) throw new Error('Company not found');

    // Check user eligibility
    await validateUserEligibility(userId, companyId);

    // Create company association
    await createCompanyAssociation(userId, companyId, role);

    // Setup user permissions
    await setupUserPermissions(userId, companyId, role);
}
```

### 3. Role Management

```javascript
// Reference: setup_admin_roles.sql
async function setupCompanyRoles(companyId) {
    const defaultRoles = [
        {
            name: 'admin',
            permissions: adminPermissions
        },
        {
            name: 'manager',
            permissions: managerPermissions
        },
        {
            name: 'user',
            permissions: userPermissions
        }
    ];

    await createCompanyRoles(companyId, defaultRoles);
}
```

## Company Settings

### 1. UI Configuration

```javascript
// Reference: setup_ui_display.sql
const companyUISettings = {
    theme: {
        primary: '#007bff',
        secondary: '#6c757d'
    },
    layout: {
        sidebar: true,
        navbar: true
    },
    features: {
        chat: true,
        documents: true,
        analytics: true
    }
};
```

### 2. Security Settings

```javascript
const companySecuritySettings = {
    passwordPolicy: {
        minLength: 8,
        requireSpecialChars: true,
        requireNumbers: true
    },
    sessionTimeout: 3600,
    mfaRequired: false
};
```

## Audit System

### 1. Event Logging

```javascript
// Reference: setup_audit_log_rows.sql
async function logCompanyEvent(companyId, event) {
    await db.audit_logs.create({
        company_id: companyId,
        event_type: event.type,
        user_id: event.userId,
        details: event.details,
        timestamp: new Date()
    });
}
```

### 2. Activity Monitoring

```javascript
async function getCompanyActivity(companyId, options) {
    return await db.audit_logs.findMany({
        where: {
            company_id: companyId,
            timestamp: {
                gte: options.startDate,
                lte: options.endDate
            }
        },
        include: {
            user: true,
            details: true
        }
    });
}
```

## Company Management UI

### 1. Company Dashboard

```javascript
// Company overview and management interface
- Company details
- User management
- Role configuration
- Settings management
```

### 2. User Management Interface

```javascript
// User administration tools
- User listing
- Role assignment
- Permission management
- Activity monitoring
```

## Best Practices

### 1. Company Setup

- Validate company data
- Configure default settings
- Setup security policies
- Initialize audit logging

### 2. User Management

- Verify user eligibility
- Implement role-based access
- Maintain audit trail
- Handle user lifecycle

### 3. Data Isolation

- Enforce company boundaries
- Implement data access controls
- Maintain data integrity
- Handle cross-company interactions

### 4. Security

- Role-based permissions
- Data access controls
- Audit logging
- Security monitoring

## Troubleshooting

### 1. Common Issues

- Company creation failures
- User assignment errors
- Permission conflicts
- Data access issues

### 2. Resolution Steps

- Verify company existence
- Check user permissions
- Validate role assignments
- Review audit logs

## Maintenance

### 1. Regular Tasks

- Update company settings
- Review user access
- Audit permissions
- Clean up inactive users

### 2. Monitoring

- Track company usage
- Monitor user activity
- Review security logs
- Check performance metrics

## Related Documentation

- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Database Schema](0300_DATABASE_SCHEMA.md)
- [Security Model](0400_SECURITY_MODEL.md)
- [UI Settings](0700_UI_SETTINGS.md)
