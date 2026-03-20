# Customer Deployment

## Overview

This guide outlines the process for deploying the application for customers, including environment setup, database configuration, and post-deployment verification steps.

## Prerequisites

### System Requirements

```bash
# Minimum requirements
- Node.js 16+
- PostgreSQL 13+
- 2GB RAM
- 10GB Storage
```

### Required Access

```
- Database credentials
- Environment configuration
- SSL certificates
- Domain access
```

## Deployment Process

### 1. Environment Setup

#### Environment Variables

```bash
# .env configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
DATABASE_URL=your_database_url
```

#### Directory Structure

```
/deployment
├── config/
│   ├── nginx/
│   ├── ssl/
│   └── env/
├── scripts/
│   ├── setup.sh
│   ├── migrate.sh
│   └── backup.sh
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

### 2. Database Setup

#### Initial Setup

```sql
-- Execute setup scripts in order
\i setup_companies.sql
\i setup_admin_roles.sql
\i setup_company_management.sql
\i setup_ui_display.sql
```

#### Migrations

```bash
# Run database migrations
./scripts/migrate.sh

# Verify migrations
psql -U your_username -d your_database -c "SELECT version FROM schema_migrations;"
```

### 3. Application Deployment

#### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config
```

#### Manual Deployment

```bash
# Build application
npm run build

# Start server
npm run start
```

## Configuration Steps

### 1. Company Setup

#### Initial Configuration

```javascript
// Company initialization
async function setupCompany(companyData) {
    // Create company record
    const company = await createCompany(companyData);
    
    // Setup initial roles
    await setupCompanyRoles(company.id);
    
    // Configure UI settings
    await setupUISettings(company.id);
    
    return company;
}
```

#### Role Configuration

```sql
-- Setup admin roles
INSERT INTO roles (name, permissions, company_id)
VALUES 
    ('admin', '{"all": true}', :company_id),
    ('manager', '{"read": true, "write": true}', :company_id),
    ('user', '{"read": true}', :company_id);
```

### 2. UI Configuration

#### Display Settings

```javascript
// Reference: setup_ui_display.sql
const defaultUISettings = {
    theme: {
        primary: '#007bff',
        secondary: '#6c757d'
    },
    layout: {
        sidebar: true,
        navbar: true
    }
};
```

#### Button Settings

```javascript
// Reference: setup_ui_button_settings.sql
const buttonSettings = {
    primary: {
        style: 'filled',
        color: 'primary'
    },
    secondary: {
        style: 'outlined',
        color: 'secondary'
    }
};
```

### 3. Security Configuration

#### Authentication Setup

```javascript
// 0175-auth-config.js configuration
const authConfig = {
    session: {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        updateAge: 24 * 60 * 60 // 24 hours
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d'
    }
};
```

#### Access Control

```javascript
// Setup access control policies
async function setupAccessControl(companyId) {
    await setupRolePolicies(companyId);
    await setupDataPolicies(companyId);
    await setupAPIAccess(companyId);
}
```

## Deployment Verification

### 1. Health Checks

#### System Health

```javascript
async function verifySystemHealth() {
    // Check database connection
    await checkDatabase();
    
    // Verify authentication
    await checkAuth();
    
    // Test API endpoints
    await checkAPI();
    
    // Verify file storage
    await checkStorage();
}
```

#### Component Checks

```javascript
async function verifyComponents() {
    // Check UI components
    await checkUIComponents();
    
    // Verify integrations
    await checkIntegrations();
    
    // Test real-time features
    await checkRealtimeFeatures();
}
```

### 2. Security Verification

#### Security Checks

```javascript
async function verifySecuritySetup() {
    // Verify SSL configuration
    await checkSSL();
    
    // Test authentication
    await checkAuthFlow();
    
    // Verify permissions
    await checkPermissions();
    
    // Test data access
    await checkDataAccess();
}
```

## Maintenance Procedures

### 1. Backup Process

```bash
#!/bin/bash
# backup.sh

# Database backup
pg_dump -U $DB_USER -d $DB_NAME > backup.sql

# File storage backup
rsync -av /storage/files/ /backup/files/

# Configuration backup
cp -r /config/ /backup/config/
```

### 2. Update Process

```bash
#!/bin/bash
# update_server.sh

# Stop services
systemctl stop app

# Backup current version
./backup.sh

# Update application
git pull origin main
npm install
npm run build

# Run migrations
./migrate.sh

# Restart services
systemctl start app
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

```bash
# Check database status
systemctl status postgresql

# Verify connection
psql -U $DB_USER -d $DB_NAME -c "\conninfo"
```

2. **Authentication Problems**

```javascript
// Verify auth configuration
async function checkAuthConfig() {
    const config = await loadAuthConfig();
    validateAuthConfig(config);
    testAuthConnection();
}
```

## Related Documentation

- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Database Schema](0300_DATABASE_SCHEMA.md)
- [Security Model](0400_SECURITY_MODEL.md)
- [Multi-tenant Setup](1200_MULTI_TENANT_SETUP.md)
