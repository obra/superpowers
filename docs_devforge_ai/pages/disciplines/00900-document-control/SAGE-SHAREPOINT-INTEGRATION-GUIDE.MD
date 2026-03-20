# 1300_SAGE_SHAREPOINT_INTEGRATION_GUIDE.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.1 (2025-08-29): Added Azure AD setup instructions
- v1.0 (2025-08-29): Initial version

## Overview
This document provides implementation guidance for integrating Sage financial systems and SharePoint document workflows with ConstructAI's platform, following the documentation standards established in [0000_DOCUMENTATION_GUIDE.md](0000_DOCUMENTATION_GUIDE.md).

## Requirements
All implementations must include:
- Bidirectional data synchronization
- Azure AD authentication
- Error handling with automatic retries
- Compatibility with Sage Intacct/300/X3
- Support for SharePoint Online/2019/2022
- Automated validation checks

## Executive Summary

This guide provides step-by-step implementation for integrating our Petty Cash Management and Enterprise Approval systems with Sage financial management and SharePoint workflow systems. This is the first production legacy integration project.

## Client System Overview

### Sage Integration Scope
- **System**: Sage Intacct / Sage 300 / Sage X3
- **Integration Points**: Petty cash expenses, purchase orders, financial approvals
- **Data Flow**: Bidirectional sync of expense records and approval statuses
- **Authentication**: API key-based authentication with Sage Web Services

### SharePoint Integration Scope
- **System**: SharePoint Online / SharePoint 2019/2022
- **Integration Points**: Document approval workflows, e-signatures
- **Data Flow**: Workflow status synchronization and document management
- **Authentication**: OAuth 2.0 with Microsoft Graph API

## Implementation Details

### Database Configuration
#### Step 1: Install Legacy Extensions

```bash
# Execute the legacy system extensions
psql -d your_database -f sql/legacy_system_extensions.sql
```

### Step 2: Configure Sage System

```sql
-- Add Sage-specific configuration
UPDATE legacy_system_config SET
    system_name = 'SAGE_FINANCIAL_PROD',
    system_type = 'financial',
    api_endpoint = 'https://api.sageintacct.com/ia/xml/xmlgw.phtml',
    authentication_type = 'api_key',
    authentication_config = '{
        "company_id": "YOUR_COMPANY_ID",
        "user_id": "YOUR_USER_ID", 
        "user_password": "YOUR_PASSWORD",
        "sender_id": "YOUR_SENDER_ID",
        "sender_password": "YOUR_SENDER_PASSWORD"
    }'::jsonb,
    field_mappings = '{
        "petty_cash": {
            "id": "RECORDNO",
            "amount": "TOTALAMOUNT",
            "purpose": "MEMO", 
            "requested_by": "EMPLOYEEID",
            "status": "STATUS"
        }
    }'::jsonb,
    status_mappings = '{
        "petty_cash": {
            "Approved": "approved",
            "Pending": "pending",
            "Rejected": "rejected"
        }
    }'::jsonb
WHERE id = (SELECT id FROM legacy_system_config WHERE system_name = 'SAP_ERP_PROD' LIMIT 1);
```

### Step 3: Configure SharePoint System

```sql
-- Add SharePoint-specific configuration  
UPDATE legacy_system_config SET
    system_name = 'SHAREPOINT_WORKFLOWS',
    api_endpoint = 'https://yourtenant.sharepoint.com/_api/web',
    authentication_config = '{
        "client_id": "YOUR_AZURE_APP_ID",
        "client_secret": "YOUR_AZURE_APP_SECRET", 
        "tenant_id": "YOUR_TENANT_ID"
    }'::jsonb,
    field_mappings = '{
        "approval": {
            "workflow_id": "WorkflowInstanceId",
            "status": "WorkflowStatus",
            "document_title": "Title"
        }
    }'::jsonb
WHERE id = (SELECT id FROM legacy_system_config WHERE system_name = 'SHAREPOINT_WORKFLOWS' LIMIT 1);
```

## Sage Financial Integration

### Environment Setup
#### Step 1: Configure Environment Variables

```bash
# Add to your .env file
SAGE_SENDER_ID=your_sender_id
SAGE_SENDER_PASSWORD=your_sender_password
SAGE_COMPANY_ID=your_company_id
SAGE_USER_ID=your_user_id
SAGE_USER_PASSWORD=your_user_password
SAGE_API_ENDPOINT=https://api.sageintacct.com/ia/xml/xmlgw.phtml
```

### Step 2: Sage Integration Service

```javascript
// server/src/services/sageIntegrationService.js
const xml2js = require('xml2js');
const axios = require('axios');

class SageIntegrationService {
    constructor(config) {
        this.config = config;
        this.sessionId = null;
    }

    async authenticate() {
        const authXML = `<?xml version="1.0"?>
            <request>
                <control>
                    <senderid>${this.config.sender_id}</senderid>
                    <password>${this.config.sender_password}</password>
                    <controlid>auth${Date.now()}</controlid>
                    <uniqueid>false</uniqueid>
                    <dtdversion>3.0</dtdversion>
                </control>
                <operation>
                    <authentication>
                        <login>
                            <userid>${this.config.user_id}</userid>
                            <companyid>${this.config.company_id}</companyid>
                            <password>${this.config.user_password}</password>
                        </login>
                    </authentication>
                    <content>
                        <function controlid="session">
                            <getAPISession></getAPISession>
                        </function>
                    </content>
                </operation>
            </request>`;

        const response = await axios.post(this.config.api_endpoint, authXML, {
            headers: { 'Content-Type': 'application/xml' }
        });

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        this.sessionId = result.response.operation[0].authentication[0].sessionid[0];
        return this.sessionId;
    }

    async syncPettyCashToSage(pettyCashRecord) {
        if (!this.sessionId) await this.authenticate();

        const expenseXML = `<?xml version="1.0"?>
            <request>
                <control>
                    <senderid>${this.config.sender_id}</senderid>
                    <password>${this.config.sender_password}</password>
                    <controlid>expense${pettyCashRecord.id}</controlid>
                    <uniqueid>false</uniqueid>
                    <dtdversion>3.0</dtdversion>
                </control>
                <operation>
                    <authentication>
                        <sessionid>${this.sessionId}</sessionid>
                    </authentication>
                    <content>
                        <function controlid="create">
                            <create>
                                <EXPENSEREPORT>
                                    <EMPLOYEEID>${pettyCashRecord.requested_by_name}</EMPLOYEEID>
                                    <DATECREATED>${pettyCashRecord.request_date}</DATECREATED>
                                    <DESCRIPTION>${pettyCashRecord.purpose}</DESCRIPTION>
                                    <EXPENSEREPORTITEMS>
                                        <EXPENSEREPORTITEM>
                                            <AMOUNT>${pettyCashRecord.amount}</AMOUNT>
                                            <DESCRIPTION>${pettyCashRecord.purpose}</DESCRIPTION>
                                            <EXPENSEDATE>${pettyCashRecord.request_date}</EXPENSEDATE>
                                        </EXPENSEREPORTITEM>
                                    </EXPENSEREPORTITEMS>
                                </EXPENSEREPORT>
                            </create>
                        </function>
                    </content>
                </operation>
            </request>`;

        const response = await axios.post(this.config.api_endpoint, expenseXML, {
            headers: { 'Content-Type': 'application/xml' }
        });

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        const sageRecordId = result.response.operation[0].result[0].data[0].expensereport[0].$.recordno;

        return sageRecordId;
    }

    async pullSageExpenses(since) {
        if (!this.sessionId) await this.authenticate();

        const queryXML = `<?xml version="1.0"?>
            <request>
                <control>
                    <senderid>${this.config.sender_id}</senderid>
                    <password>${this.config.sender_password}</password>
                    <controlid>query${Date.now()}</controlid>
                    <uniqueid>false</uniqueid>
                    <dtdversion>3.0</dtdversion>
                </control>
                <operation>
                    <authentication>
                        <sessionid>${this.sessionId}</sessionid>
                    </authentication>
                    <content>
                        <function controlid="read">
                            <readByQuery>
                                <object>EXPENSEREPORT</object>
                                <query>WHENMODIFIED >= '${since}'</query>
                                <fields>*</fields>
                            </readByQuery>
                        </function>
                    </content>
                </operation>
            </request>`;

        const response = await axios.post(this.config.api_endpoint, queryXML, {
            headers: { 'Content-Type': 'application/xml' }
        });

        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        return this.parseExpenseReports(result);
    }

    parseExpenseReports(xmlResult) {
        const expenseReports = xmlResult.response.operation[0].result[0].data[0].expensereport || [];
        
        return expenseReports.map(report => ({
            legacy_system_id: report.$.recordno,
            amount: parseFloat(report.totalamount[0]),
            purpose: report.memo[0] || 'Imported from Sage',
            requested_by_name: report.employeeid[0],
            status: this.mapStatusFromSage(report.state[0]),
            request_date: report.whencreated[0],
            is_legacy_originated: true,
            legacy_system_name: 'SAGE_FINANCIAL_PROD',
            legacy_sync_status: 'synced'
        }));
    }

    mapStatusFromSage(sageStatus) {
        const statusMap = {
            'Approved': 'approved',
            'Pending Approval': 'pending', 
            'Rejected': 'rejected'
        };
        return statusMap[sageStatus] || 'pending';
    }
}

module.exports = SageIntegrationService;
```

### Step 3: Sage Sync Job

```javascript
// server/src/jobs/sageSyncJob.js
const SageIntegrationService = require('../services/sageIntegrationService');
const { supabase } = require('../config/supabase');

class SageSyncJob {
    constructor() {
        this.sageService = new SageIntegrationService({
            sender_id: process.env.SAGE_SENDER_ID,
            sender_password: process.env.SAGE_SENDER_PASSWORD,
            company_id: process.env.SAGE_COMPANY_ID,
            user_id: process.env.SAGE_USER_ID,
            user_password: process.env.SAGE_USER_PASSWORD,
            api_endpoint: process.env.SAGE_API_ENDPOINT
        });
    }

    async runSync() {
        console.log('Starting Sage sync...');
        
        // Sync approved petty cash to Sage
        const { data: approvedRecords } = await supabase
            .from('petty_cash_requests')
            .select('*')
            .eq('status', 'approved')
            .is('legacy_system_id', null);

        for (const record of approvedRecords) {
            try {
                const sageId = await this.sageService.syncPettyCashToSage(record);
                
                await supabase
                    .from('petty_cash_requests')
                    .update({
                        legacy_system_id: sageId,
                        legacy_system_name: 'SAGE_FINANCIAL_PROD',
                        legacy_sync_status: 'synced',
                        legacy_last_sync: new Date().toISOString()
                    })
                    .eq('id', record.id);

                console.log(`Synced petty cash ${record.id} to Sage ID ${sageId}`);
            } catch (error) {
                console.error(`Failed to sync ${record.id}:`, error.message);
            }
        }

        // Pull updates from Sage  
        const since = new Date();
        since.setHours(since.getHours() - 24);
        
        const sageExpenses = await this.sageService.pullSageExpenses(
            since.toISOString().split('T')[0]
        );

        for (const expense of sageExpenses) {
            const { data: existing } = await supabase
                .from('petty_cash_requests')
                .select('id')
                .eq('legacy_system_id', expense.legacy_system_id)
                .single();

            if (existing) {
                await supabase
                    .from('petty_cash_requests')
                    .update(expense)
                    .eq('legacy_system_id', expense.legacy_system_id);
            } else {
                await supabase
                    .from('petty_cash_requests')
                    .insert(expense);
            }
        }

        console.log('Sage sync completed');
    }
}

module.exports = SageSyncJob;
```

## SharePoint Workflow Integration

### Azure AD Configuration
#### Step 1: Register Azure Application

1. **Register App in Azure AD**:
   - Go to Azure Portal > Azure Active Directory > App registrations
   - Click "New registration"
   - Name: "ConstructAI SharePoint Integration"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Leave blank for now
   - Click "Register"

2. **Configure API Permissions**:
   - In the app registration, go to "API permissions"
   - Click "Add a permission" > "SharePoint" 
   - Select "Application permissions"
   - Add: Sites.Selected, Sites.Manage.All
   - Click "Grant admin consent"

3. **Create Client Secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "SharePoint Integration"
   - Expires: 24 months
   - Copy the secret value immediately

### Step 2: Environment Variables

```bash
# Add to your .env file
AZURE_CLIENT_ID=your_app_id_from_step_1
AZURE_CLIENT_SECRET=your_secret_from_step_3
AZURE_TENANT_ID=your_tenant_id
SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com
SHAREPOINT_API_ENDPOINT=https://yourtenant.sharepoint.com/_api/web
```

### Step 3: SharePoint Integration Service

```javascript
// server/src/services/sharepointIntegrationService.js
const axios = require('axios');

class SharePointIntegrationService {
    constructor(config) {
        this.config = config;
        this.accessToken = null;
    }

    async authenticate() {
        const tokenUrl = `https://login.microsoftonline.com/${this.config.tenant_id}/oauth2/v2.0/token`;
        
        const params = new URLSearchParams();
        params.append('client_id', this.config.client_id);
        params.append('client_secret', this.config.client_secret);
        params.append('scope', 'https://graph.microsoft.com/.default');
        params.append('grant_type', 'client_credentials');

        const response = await axios.post(tokenUrl, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        this.accessToken = response.data.access_token;
        return this.accessToken;
    }

    async createApprovalWorkflow(approvalInstance) {
        if (!this.accessToken) await this.authenticate();

        const workflowData = {
            Title: approvalInstance.document_title,
            DocumentReference: approvalInstance.document_reference,
            Status: 'In Progress',
            Priority: approvalInstance.priority,
            InitiatedBy: approvalInstance.initiated_by
        };

        const response = await axios.post(
            `${this.config.api_endpoint}/lists/getbytitle('ApprovalWorkflows')/items`,
            workflowData,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                }
            }
        );

        return response.data.d.Id;
    }

    async updateWorkflowStatus(sharePointId, status) {
        if (!this.accessToken) await this.authenticate();

        const updateData = {
            Status: this.mapStatusToSharePoint(status)
        };

        const digestResponse = await axios.post(
            `${this.config.api_endpoint}/contextinfo`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json;odata=verbose'
                }
            }
        );

        const formDigest = digestResponse.data.d.GetContextWebInformation.FormDigestValue;

        await axios.post(
            `${this.config.api_endpoint}/lists/getbytitle('ApprovalWorkflows')/items(${sharePointId})`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    'X-RequestDigest': formDigest,
                    'X-HTTP-Method': 'MERGE',
                    'If-Match': '*'
                }
            }
        );
    }

    mapStatusToSharePoint(status) {
        const statusMap = {
            'pending': 'In Progress',
            'in_progress': 'In Progress',
            'approved': 'Approved', 
            'rejected': 'Rejected'
        };
        return statusMap[status] || 'In Progress';
    }
}

module.exports = SharePointIntegrationService;
```

## Automation & Monitoring

### Sync Controller Implementation
#### Step 1: Create Sync Controller Class

```javascript
// server/src/controllers/legacySyncController.js
const SageSyncJob = require('../jobs/sageSyncJob');
const SharePointSyncJob = require('../jobs/sharePointSyncJob');

class LegacySyncController {
    async runSageSync(req, res) {
        try {
            const sageSyncJob = new SageSyncJob();
            const results = await sageSyncJob.runSync();
            
            res.json({
                success: true,
                message: 'Sage sync completed',
                results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async runSharePointSync(req, res) {
        try {
            const sharePointSyncJob = new SharePointSyncJob();
            const results = await sharePointSyncJob.runSync();
            
            res.json({
                success: true,
                message: 'SharePoint sync completed',
                results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async runFullSync(req, res) {
        try {
            const sageSyncJob = new SageSyncJob();
            const sharePointSyncJob = new SharePointSyncJob();

            const [sageResults, sharePointResults] = await Promise.all([
                sageSyncJob.runSync(),
                sharePointSyncJob.runSync()
            ]);

            res.json({
                success: true,
                message: 'Full legacy sync completed',
                results: {
                    sage: sageResults,
                    sharepoint: sharePointResults
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new LegacySyncController();
```

### Step 2: Add Routes

```javascript
// server/src/routes/legacySyncRoutes.js
const express = require('express');
const router = express.Router();
const legacySyncController = require('../controllers/legacySyncController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Manual sync triggers (admin only)
router.post('/sync/sage', requireAuth, requireRole('admin'), legacySyncController.runSageSync);
router.post('/sync/sharepoint', requireAuth, requireRole('admin'), legacySyncController.runSharePointSync);
router.post('/sync/full', requireAuth, requireRole('admin'), legacySyncController.runFullSync);

module.exports = router;
```

### Step 3: Setup Automated Sync

```javascript
// server/src/jobs/scheduledSyncJob.js
const cron = require('node-cron');
const SageSyncJob = require('./sageSyncJob');

// Run Sage sync every 30 minutes during business hours
cron.schedule('*/30 8-17 * * 1-5', async () => {
    console.log('Running scheduled Sage sync...');
    
    try {
        const sageSyncJob = new SageSyncJob();
        await sageSyncJob.runSync();
        console.log('Scheduled Sage sync completed');
    } catch (error) {
        console.error('Scheduled Sage sync failed:', error);
    }
});

// Run SharePoint sync every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled SharePoint sync...');
    
    try {
        const sharePointSyncJob = new SharePointSyncJob();
        await sharePointSyncJob.runSync();
        console.log('Scheduled SharePoint sync completed');
    } catch (error) {
        console.error('Scheduled SharePoint sync failed:', error);
    }
});

console.log('Legacy sync scheduler initialized');
```

## Implementation Verification

### Database Validation
#### Step 1: Verify Legacy Extensions

```sql
-- Verify legacy extensions are installed
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_name IN ('petty_cash_requests', 'approval_instances')
  AND column_name LIKE 'legacy_%'
ORDER BY table_name, column_name;
```

### Step 2: Test Sage Connection

```javascript
// test/sageSyncTest.js
const SageIntegrationService = require('../server/src/services/sageIntegrationService');

async function testSageConnection() {
    const sageService = new SageIntegrationService({
        sender_id: process.env.SAGE_SENDER_ID,
        sender_password: process.env.SAGE_SENDER_PASSWORD,
        company_id: process.env.SAGE_COMPANY_ID,
        user_id: process.env.SAGE_USER_ID,
        user_password: process.env.SAGE_USER_PASSWORD,
        api_endpoint: process.env.SAGE_API_ENDPOINT
    });

    try {
        const sessionId = await sageService.authenticate();
        console.log('✅ Sage authentication successful:', sessionId);
        
        const expenses = await sageService.pullSageExpenses('2025-08-01');
        console.log('✅ Sage data pull successful:', expenses.length, 'records');
        
        return true;
    } catch (error) {
        console.error('❌ Sage connection failed:', error.message);
        return false;
    }
}

testSageConnection();
```

### Step 3: Test SharePoint Connection

```javascript
// test/sharePointSyncTest.js  
const SharePointIntegrationService = require('../server/src/services/sharepointIntegrationService');

async function testSharePointConnection() {
    const sharePointService = new SharePointIntegrationService({
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        tenant_id: process.env.AZURE_TENANT_ID,
        api_endpoint: process.env.SHAREPOINT_API_ENDPOINT
    });

    try {
        const token = await sharePointService.authenticate();
        console.log('✅ SharePoint authentication successful');

        // Test creating a workflow
        const testWorkflow = {
            id: 'test-workflow-001',
            document_title: 'Test Approval Workflow',
            document_reference: 'TEST-DOC-001',
            priority: 'normal',
            initiated_by: 'test-user'
        };

        const sharePointId = await sharePointService.createApprovalWorkflow(testWorkflow);
        console.log('✅ SharePoint workflow creation successful:', sharePointId);

        return true;
    } catch (error) {
        console.error('❌ SharePoint connection failed:', error.message);
        return false;
    }
}

testSharePointConnection();
```

## Production Deployment

### Dependency Management
#### Step 1: Install Required Packages

```bash
npm install xml2js axios node-cron @azure/msal-node
```

### Step 2: Update Environment

```bash
# Production environment variables
cp .env.example .env.production
# Add all Sage and SharePoint credentials
```

### Step 3: Deploy Database Changes

```bash
# Run on production database
psql -d production_database -f sql/legacy_system_extensions.sql
```

### Step 4: Update Application

```bash
# Add legacy sync routes to main app
# server/src/app.js
const legacySyncRoutes = require('./routes/legacySyncRoutes');
app.use('/api/legacy-sync', legacySyncRoutes);

# Enable scheduled jobs
require('./jobs/scheduledSyncJob');
```

## Operations & Maintenance

### Performance Monitoring
#### Sync Status Dashboard

```sql
-- View sync statistics
SELECT 
    system_name,
    sync_direction,
    COUNT(*) as sync_count,
    SUM(success_count) as total_success,
    SUM(error_count) as total_errors,
    MAX(created_at) as last_sync
FROM legacy_sync_log 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY system_name, sync_direction
ORDER BY system_name, sync_direction;
```

### Common Issues and Solutions

1. **Sage Authentication Failures**
   - Verify sender ID and password
   - Check company ID format
   - Ensure user has API permissions

2. **SharePoint Token Errors**  
   - Verify Azure app registration
   - Check client secret expiration
   - Ensure proper permissions granted

3. **Sync Performance Issues**
   - Reduce sync frequency during peak hours
   - Implement batch processing for large data sets
   - Add database indexes for legacy columns

## Post-Implementation Checklist

- [ ] Conduct administrator training session
- [ ] Configure monitoring alerts
- [ ] Schedule monthly data audits
- [ ] Perform performance baseline testing
- [ ] Review documentation quarterly

This implementation provides a robust foundation for Sage and SharePoint integration, with automated synchronization, error handling, and monitoring capabilities.
