# Multi-tenant Setup

## Overview

The multi-tenant architecture enables multiple organizations to use the application while maintaining data isolation and customization capabilities. This document outlines the implementation details and best practices for managing multiple organizations.

## Architecture

### Tenant Isolation

#### Database Level

```sql
-- Reference: setup_companies.sql
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Organization isolation policy
CREATE POLICY organization_isolation ON companies
    USING (id = current_setting('app.current_company_id')::UUID);
```

#### Application Level

```javascript
// Middleware for company context
async function setOrganizationContext(req, res, next) {
    const organizationId = req.headers['x-organization-id'];
    if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
    }
    
    await setCurrentOrganization(organizationId);
    next();
}
```

## Company Management

### Company Setup

#### Creation Process

```javascript
// Reference: setup_company_management.sql
async function createNewCompany(companyData) {
    return await db.transaction(async (tx) => {
        // Create company record
        const company = await tx.companies.create({
            data: companyData
        });

        // Setup initial configuration
        await setupCompanyConfiguration(tx, company.id);

        // Create default roles
        await setupCompanyRoles(tx, company.id);

        return company;
    });
}
```

#### Initial Configuration

```javascript
async function setupCompanyConfiguration(tx, companyId) {
    // Setup UI settings
    await setupUISettings(tx, companyId);
    
    // Setup button configurations
    await setupButtonSettings(tx, companyId);
    
    // Setup display settings
    await setupDisplaySettings(tx, companyId);
}
```

### Data Isolation

#### Schema Design

```sql
-- Add company_id to all relevant tables
ALTER TABLE user_profiles ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE documents ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE settings ADD COLUMN company_id UUID REFERENCES companies(id);
```

#### Access Control

```sql
-- Reference: setup_admin_roles.sql
CREATE POLICY user_company_access ON user_profiles
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY document_company_access ON documents
    USING (company_id = current_setting('app.current_company_id')::UUID);
```

## Customization

### UI Customization

#### Organization-specific Settings

```javascript
// Reference: setup_ui_display.sql
const companyUISettings = {
    theme: {
        colors: {
            primary: string,
            secondary: string
        },
        typography: {
            fontFamily: string,
            fontSize: string
        }
    },
    layout: {
        sidebar: boolean,
        navbar: boolean
    }
};
```

#### Display Configuration

```javascript
// Reference: setup_ui_display_update.sql
async function updateOrganizationDisplay(organizationId, settings) {
    await db.ui_display_settings.upsert({
        where: { organization_id: organizationId },
        update: { settings },
        create: { organization_id: organizationId, settings }
    });
}
```

### Feature Management

#### Feature Flags

```javascript
const organizationFeatures = {
    chatbot: boolean,
    documentManagement: boolean,
    advancedAnalytics: boolean,
    customIntegrations: boolean
};
```

#### Feature Access

```javascript
async function checkFeatureAccess(organizationId, feature) {
    const organization = await getOrganization(organizationId);
    return organization.features[feature] || false;
}
```

## Data Management

### Data Segregation

#### Query Handling

```javascript
class QueryBuilder {
    constructor(companyId) {
        this.companyId = companyId;
    }

    addCompanyFilter(query) {
        return {
            ...query,
            where: {
                ...query.where,
                company_id: this.companyId
            }
        };
    }
}
```

#### Bulk Operations

```javascript
async function bulkOperation(companyId, operation) {
    const queryBuilder = new QueryBuilder(companyId);
    return await db.transaction(async (tx) => {
        // Apply company context
        await setTransactionCompany(tx, companyId);
        
        // Execute operation with company filter
        return await operation(tx, queryBuilder);
    });
}
```

### Data Migration

#### Migration Process

```javascript
async function migrateCompanyData(sourceId, targetId) {
    // Validate companies
    await validateCompanies(sourceId, targetId);
    
    // Copy data
    await copyCompanyData(sourceId, targetId);
    
    // Update references
    await updateReferences(sourceId, targetId);
    
    // Verify migration
    await verifyMigration(sourceId, targetId);
}
```

## Security

### Authentication

#### Organization-specific Auth

```javascript
// Reference: 0175-auth-config.js
class OrganizationAuth {
    constructor(organizationId) {
        this.organizationId = organizationId;
    }

    async validateAccess(userId) {
        const userOrganizations = await getUserOrganizations(userId);
        return userOrganizations.includes(this.organizationId);
    }
}
```

### Authorization

#### Role-based Access

```javascript
// Reference: setup_role_definitions.sql
async function checkCompanyPermission(userId, companyId, permission) {
    const role = await getUserCompanyRole(userId, companyId);
    return hasPermission(role, permission);
}
```

## Monitoring

### Usage Tracking

#### Metrics Collection

```javascript
class OrganizationMetrics {
    async track(organizationId, metric, value) {
        await db.metrics.create({
            organization_id: organizationId,
            metric: metric,
            value: value,
            timestamp: new Date()
        });
    }
}
```

#### Resource Usage

```javascript
async function trackResourceUsage(organizationId) {
    const usage = await calculateResourceUsage(organizationId);
    await updateOrganizationUsage(organizationId, usage);
}
```

## Best Practices

### 1. Organization Data Isolation

- Use Row Level Security
- Implement company context
- Validate cross-company access
- Maintain data boundaries

### 2. Performance

- Optimize queries per tenant
- Cache company-specific data
- Monitor resource usage
- Scale efficiently

### 3. Security

- Implement proper organization authentication
- Maintain organization authorization rules
- Audit access patterns
- Protect sensitive data

### 4. Maintenance

- Regular backups per tenant
- Scheduled maintenance windows
- Version control for settings
- Monitor system health

## Related Documentation

- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Database Schema](0300_DATABASE_SCHEMA.md)
- [Security Model](0400_SECURITY_MODEL.md)
- [Company Management](0600_COMPANY_MANAGEMENT.md)
