# Sage & SharePoint Integration Client Guide

## Overview
This document outlines the client-side requirements and configuration steps for integrating with your Sage financial systems and SharePoint document workflows.

## Prerequisites
- Sage Intacct/300/X3 system with API access
- SharePoint Online/2019/2022 environment
- Azure Active Directory tenant

## Integration Requirements

### Sage Configuration
1. **API Access**:
   - Provide valid API credentials:
     - Company ID
     - User ID
     - Sender ID
     - Corresponding passwords

2. **Endpoint Configuration**:
   - Confirm your Sage XML Gateway URL:
     ```text
     https://api.sageintacct.com/ia/xml/xmlgw.phtml
     ```

### SharePoint Configuration
1. **Azure AD Application**:
   - Register an application in Azure Portal
   - Grant "Sites.Manage.All" and "Sites.Selected" API permissions
   - Generate a client secret

2. **Site Configuration**:
   - Provide SharePoint site URL
   - Confirm write permissions on target site

## Environment Variables Required

### Sage Variables
```ini
SAGE_COMPANY_ID=your_company_id
SAGE_USER_ID=your_api_user
SAGE_SENDER_ID=your_sender_id
SAGE_API_ENDPOINT=your_gateway_url
```

### SharePoint Variables
```ini
AZURE_CLIENT_ID=your_app_id
AZURE_TENANT_ID=your_tenant_id
SHAREPOINT_SITE_URL=your_sharepoint_site
```

## Implementation Steps

### Client Responsibilities:
1. Provide Sage API credentials including:
   - Company ID
   - User ID
   - Sender ID
   - Corresponding passwords
2. Create Azure AD application with:
   - 'Sites.Manage.All' and 'Sites.Selected' permissions
   - Valid client secret
3. Provide SharePoint site URL
4. Validate API endpoints connectivity
5. Supply test credentials for integration validation
6. Confirm preferred sync schedule windows

## Support Contacts
- Integration Support: integrations@constructai.com
- Technical Questions: techsupport@constructai.com

## Revision History
- v1.0 (2025-08-30): Initial client guide version
