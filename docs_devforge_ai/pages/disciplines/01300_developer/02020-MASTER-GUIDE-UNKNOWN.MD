# 1300_02020 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02020 group.

## Files in this Group

- [1300_02020_DOCUMENSO_INTEGRATION_GUIDE.md](1300_02020_DOCUMENSO_INTEGRATION_GUIDE.md)
- [1300_02020_MASTER_GUIDE_UNKNOWN.md](1300_02020_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_02020_DOCUMENSO_INTEGRATION_GUIDE.md

# Documenso E-signature Integration Guide

## Version History
- v3.2 (2025-09-13): Progress tracking and monitoring section added
- v3.1 (2025-09-12): Deployment and security sections enhanced
- v3.0 (2025-09-11): Full integration specification completed
- v2.1 (2025-09-10): Testing and quality assurance guidelines added
- v2.0 (2025-09-09): Technical implementation plan finalized
- v1.0 (2025-09-08): Initial integration framework established

## Status
- [x] Implementation framework defined
- [x] Technical specifications completed
- [x] Database schema designed
- [ ] Development phase 1 complete (Week 8)
- [ ] Development phase 2 complete (Week 10)
- [ ] Integration testing complete (Week 12)
- [ ] Production deployment (Week 12-13)
- [ ] User training complete (Week 14)

## Overview

This guide provides comprehensive documentation for integrating Documenso open-source e-signature solution into the Construction Procurement Platform. The integration enables digital contract signing workflows, replacing manual paper-based processes while maintaining full audit trails and compliance.

### Integration Goals
- **Seamless e-signature workflows** for construction contracts
- **Enterprise-grade security** with full audit compliance
- **Multi-party signing support** for complex procurement processes
- **Mobile-responsive signing** via web and mobile interfaces
- **Integration with existing systems** (Camunda BPM, Supabase, enterprise DMS)

### Key Benefits
- **60% reduction** in contract execution time
- **Zero paper trail** for digital procurement processes
- **Enhanced compliance** with electronic signature laws
- **Improved audit trails** for procurement transactions
- **Mobile accessibility** for on-site approvals

## Integration Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Construction Procurement Hub                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │  Tendering  │ │ Procurement │ │ Contract   │ │ Document    │    │
│  │  System     │ │ Operations  │ │ Management │ │ Control     │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
└─────────────────┬─────────────────┬─────────────────┬───────────────┘
                  │                 │                 │
       ┌─────────────────┐ ┌───────▼───────┐ ┌───────▼───────┐
       │  Camunda BPM    │ │    Supabase    │ │   Documenso   │
       │  Workflows      │ │    Database    │ │ E-signatures  │
       ├─────────────────┤ ├─────────────────┤ └─────────────────┘
       │ • Process Mgmt  │ │ • Contract Data │     • Functions:
       │ • Task Routing  │ │ • Signature     │     • Document Prep
       │ • Status Tracking│ │ Status         │     • Signer Mgmt
       │ • Notifications │ │ • Audit Logs    │     • Status Tracking
       └─────────────────┘ └─────────────────┘     • Security
                  │                 │                    • Templates
                  └─────────────────┼────────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │ Enterprise Document Systems │
                     │ (SharePoint/Google Drive)   │
                     │ • Storage & Retrieval       │
                     │ • Permission Management     │
                     │ • Version Control           │
                     └─────────────────────────────┘
```

### Integration Flow

1. **Contract Approval** → Camunda workflow triggers signature process
2. **Documenso Integration** → API creates signature requests
3. **Signer Notifications** → Email invitations sent to all parties
4. **Signature Process** → Sequential or parallel signing based on workflow
5. **Status Updates** → Real-time updates to procurement system
6. **Completion** → Signed contract stored and workflow completed
7. **Audit Trail** → Complete signature history maintained

## Technical Specification

### Requirements Analysis

#### Functional Requirements
- ✅ Multi-page document signing support
- ✅ Sequential and parallel signing workflows
- ✅ Template-based contract generation
- ✅ Mobile-responsive signing interface
- ✅ Bulk signature operations
- ✅ Custom signature placement
- ✅ Document expiry and reminders
- ✅ Signature validation and verification

#### Non-Functional Requirements
- ✅ Enterprise-grade security (SSL/TLS, encryption)
- ✅ 99.9% uptime availability
- ✅ GDPR compliant data handling
- ✅ SOC 2 Type II compliant operations
- ✅ Mobile-first responsive design
- ✅ Sub-second response times
- ✅ Scalable to 100,000+ documents/month

#### Integration Requirements
- ✅ REST API integration with existing systems
- ✅ Webhook support for real-time updates
- ✅ OAuth 2.0 authentication
- ✅ Database connectivity to Supabase
- ✅ Email notification system compatibility
- ✅ Document storage API integration

### Security Framework

#### Data Protection
```javascript
// AES-256 encryption for document storage
const documentSecurity = {
  atRestEncryption: 'AES-256-GCM',
  inTransitEncryption: 'TLS 1.3',
  keyManagement: 'AWS KMS/HSM integration',
  dataRetention: 'Configurable retention policies',
  rightToDeletion: 'GDPR compliance tools'
};
```

#### Access Control
```javascript
// Role-based access control matrix
const accessControlMatrix = {
  procurement_manager: {
    create: true,
    sign: true,
    cancel: true,
    view_all: true,
    audit: true
  },
  contractor: {
    create: false,
    sign: 'own_documents_only',
    cancel: false,
    view_all: false,
    audit: false
  },
  auditor: {
    create: false,
    sign: false,
    cancel: false,
    view_all: true,
    audit: true
  }
};
```

#### Compliance Requirements
- **21 CFR Part 11** compliance for pharmaceutical/contractor regulations
- **EU eIDAS** compliance for European electronic signatures
- **ESIGN Act** compliance for US electronic signatures
- **Business continuity** planning for disaster recovery

## Implementation Phases

### Phase 1: Foundation Setup (Weeks 1-2)

#### 1.1 Infrastructure Deployment
```bash
# Deploy Documenso instance
git clone https://github.com/documenso/documenso
cd documenso

# Configure production environment
cp .env.example .env.production

# Database configuration
DATABASE_URL="postgresql://user:password@host:5432/documenso_prod"

# Authentication
NEXTAUTH_URL="https://esignature.company.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Email configuration
SMTP_HOST="smtp.company.com"
SMTP_PORT="587"
SMTP_USER="esignature@company.com"
SMTP_PASSWORD="$EMAIL_APP_PASSWORD"

# Security
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

#### 1.2 Database Schema Extensions
```sql
-- Extend existing contract tables for signature integration
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
    signature_required BOOLEAN DEFAULT false;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
    signature_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
    documenso_document_id VARCHAR(100);

-- Create signature tracking tables
CREATE TABLE contract_signature_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    documenso_document_id VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'sent',
    signers JSONB NOT NULL,
    total_signers INTEGER NOT NULL DEFAULT 0,
    signed_signers INTEGER NOT NULL DEFAULT 0,
    current_signer_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    UNIQUE(contract_id)
);

-- Signature events audit trail
CREATE TABLE signature_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID REFERENCES contract_signature_agreements(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    signer_email VARCHAR(255),
    signer_name VARCHAR(255),
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 API Integration Setup
```javascript
// client/src/services/documensoService.js
import axios from 'axios';
import { supabase } from '../utils/supabaseClient';

class DocumensoService {
  constructor() {
    this.baseURL = process.env.REACT_APP_DOCUMENSO_API_URL;
    this.apiKey = process.env.REACT_APP_DOCUMENSO_API_KEY;

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Documenso API Error:', error);
        throw this.handleApiError(error);
      }
    );
  }

  handleApiError(error) {
    const status = error.response?.status;
    switch (status) {
      case 401:
        return new Error('Authentication failed with e-signature service');
      case 403:
        return new Error('Insufficient permissions for operation');
      case 429:
        return new Error('Rate limit exceeded, please try again later');
      default:
        return new Error(error.response?.data?.message || 'Signature service error');
    }
  }

  // Core functionality
  async createSignatureRequest(contractData, signers) {
    const response = await this.httpClient.post('/api/v1/documents', {
      title: `Construction Contract: ${contractData.contractNumber}`,
      recipients: signers.map((signer, index) => ({
        email: signer.email,
        name: signer.name,
        role: signer.role,
        signingOrder: index + 1
      })),
      document: await this.generateContractPDF(contractData),
      options: {
        requireAllSigners: true,
        expirationDays: 30,
        reminders: true
      }
    });

    // Store in local database
    await supabase.from('contract_signature_agreements').insert({
      contract_id: contractData.id,
      documenso_document_id: response.data.id,
      status: 'sent',
      signers: response.data.recipients,
      total_signers: response.data.recipients.length,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return response.data;
  }

  async getSignatureStatus(documentId) {
    const response = await this.httpClient.get(`/api/v1/documents/${documentId}/status`);
    return this.normalizeStatus(response.data);
  }

  async cancelSignatureRequest(documentId, reason) {
    await this.httpClient.post(`/api/v1/documents/${documentId}/cancel`, {
      reason: reason || 'Cancelled by user'
    });

    // Update local status
    await supabase
      .from('contract_signature_agreements')
      .update({ status: 'cancelled' })
      .eq('documenso_document_id', documentId);
  }

  normalizeStatus(documensoStatus) {
    const statusMap = {
      'DRAFT': 'draft',
      'PENDING': 'sent',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'signed',
      'REJECTED': 'declined',
      'EXPIRED': 'expired',
      'CANCELLED': 'cancelled'
    };

    return {
      status: statusMap[documensoStatus.status] || 'unknown',
      currentSigner: documensoStatus.currentSigner?.email,
      completedSigners: documensoStatus.completedSigners || 0,
      totalSigners: documensoStatus.totalSigners || 0
    };
  }
}

export const documensoService = new DocumensoService();
```

### Phase 2: Workflow Integration (Weeks 3-4)

#### 2.1 Camunda BPM Integration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn">

  <bpmn:process id="contractSignatureProcess" name="Contract Signature Process" isExecutable="true">

    <!-- Contract Approved Event -->
    <bpmn:startEvent id="contractApproved" name="Contract Approved">
      <bpmn:outgoing>flow-to-signature</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- Create E-signature Request -->
    <bpmn:serviceTask id="createSignatureRequest" name="Create Documenso Signature Request">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="contractId">${contractId}</camunda:inputParameter>
          <camunda:inputParameter name="signers">${signers}</camunda:inputParameter>
          <camunda:outputParameter name="signatureDocumentId">${signatureDocumentId}</camunda:outputParameter>
          <camunda:outputParameter name="signingUrl">${signingUrl}</camunda:outputParameter>
        </camunda:inputOutput>
        <camunda:connector>
          <camunda:connectorId>documenso-connector</camunda:connectorId>
          <camunda:inputOutput>
            <camunda:inputParameter name="method">POST</camunda:inputParameter>
            <camunda:inputParameter name="url">${documensoApiUrl}/api/v1/documents</camunda:inputParameter>
          </camunda:inputOutput>
        </camunda:connector>
      </bpmn:extensionElements>
      <bpmn:incoming>flow-to-signature</bpmn:incoming>
      <bpmn:outgoing>flow-to-notifications</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- Send Notifications -->
    <bpmn:serviceTask id="sendNotifications" name="Send Signature Notifications">
      <bpmn:incoming>flow-to-notifications</bpmn:incoming>
      <bpmn:outgoing>flow-await-completion</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- Wait for Completion -->
    <bpmn:receiveTask id="awaitCompletion" name="Await Signature Completion">
      <bpmn:incoming>flow-await-completion</bpmn:incoming>
      <bpmn:outgoing>flow-to-check-status</bpmn:outgoing>
      <bpmn:messageEventDefinition messageRef="signatureCompletedMessage" />
    </bpmn:receiveTask>

    <!-- Check Status -->
    <bpmn:userTask id="checkStatus" name="Review Signature Status">
      <bpmn:incoming>flow-to-check-status</bpmn:incoming>
      <bpmn:outgoing>flow-gateway</bpmn:outgoing>
    </bpmn:userTask>

    <!-- Decision Gateway -->
    <bpmn:exclusiveGateway id="statusGateway" name="Signature Status">
      <bpmn:incoming>flow-gateway</bpmn:incoming>
      <bpmn:outgoing>flow-complete</bpmn:outgoing>
      <bpmn:outgoing>flow-rejected</bpmn:outgoing>
      <bpmn:outgoing>flow-expired</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- Complete Contract -->
    <bpmn:serviceTask id="completeContract" name="Mark Contract as Signed">
      <bpmn:incoming>flow-complete</bpmn:incoming>
      <bpmn:outgoing>flow-end</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- End Events -->
    <bpmn:endEvent id="contractSigned" name="Contract Signed">
      <bpmn:incoming>flow-end</bpmn:incoming>
    </bpmn:endEvent>

    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="flow-to-signature" sourceRef="contractApproved" targetRef="createSignatureRequest" />
    <bpmn:sequenceFlow id="flow-to-notifications" sourceRef="createSignatureRequest" targetRef="sendNotifications" />
    <bpmn:sequenceFlow id="flow-await-completion" sourceRef="sendNotifications" targetRef="awaitCompletion" />
    <bpmn:sequenceFlow id="flow-to-check-status" sourceRef="awaitCompletion" targetRef="checkStatus" />
    <bpmn:sequenceFlow id="flow-gateway" sourceRef="checkStatus" targetRef="statusGateway" />
    <bpmn:sequenceFlow id="flow-complete" sourceRef="statusGateway" targetRef="completeContract">
      <bpmn:conditionExpression xsi:type="tFormalExpression">${signatureStatus == "COMPLETED"}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow-end" sourceRef="completeContract" targetRef="contractSigned" />

  </bpmn:process>

  <bpmn:message id="signatureCompletedMessage" name="Signature Completed" />

</bpmn:definitions>
```

#### 2.2 Webhook Integration
```javascript
// server/src/routes/documenso-webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload, Object.keys(payload).sort()))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-documenso-signature'];

    // Verify webhook authenticity
    if (!verifyWebhookSignature(payload, signature, process.env.DOCUMENSO_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('Documenso webhook:', payload.event);

    // Process webhook events
    switch (payload.event) {
      case 'DOCUMENT_CREATED':
        await handleDocumentCreated(payload.data);
        break;
      case 'RECIPIENT_SIGNED':
        await handleRecipientSigned(payload.data);
        break;
      case 'DOCUMENT_COMPLETED':
        await handleDocumentCompleted(payload.data);
        break;
      case 'DOCUMENT_DECLINED':
        await handleDocumentDeclined(payload.data);
        break;
      case 'DOCUMENT_EXPIRED':
        await handleDocumentExpired(payload.data);
        break;
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event handlers
async function handleRecipientSigned(data) {
  const { documentId, recipientEmail, signedAt } = data;

  // Update local database
  await supabase
    .from('signature_events')
    .insert({
      agreement_id: documentId,
      event_type: 'signed',
      signer_email: recipientEmail,
      event_data: { signedAt }
    });

  // Update signature agreement
  const { data: agreement } = await supabase
    .from('contract_signature_agreements')
    .select('*')
    .eq('documenso_document_id', documentId)
    .single();

  if (agreement) {
    await supabase
      .from('contract_signature_agreements')
      .update({
        signed_signers: agreement.signed_signers + 1,
        current_signer_email: getNextSigner(agreement, recipientEmail)
      })
      .eq('id', agreement.id);
  }
}

async function handleDocumentCompleted(data) {
  const { documentId, completedAt } = data;

  // Update agreement status
  await supabase
    .from('contract_signature_agreements')
    .update({
      status: 'signed',
      signed_at: completedAt,
      completed_at: new Date().toISOString()
    })
    .eq('documenso_document_id', documentId);

  // Download and store signed document
  await storeSignedDocument(documentId);

  // Trigger Camunda workflow completion
  await triggerWorkflowCompletion(documentId);
}

function getNextSigner(agreement, currentSignerEmail) {
  const signers = agreement.signers;
  const currentIndex = signers.findIndex(s => s.email === currentSignerEmail);

  if (currentIndex < signers.length - 1) {
    return signers[currentIndex + 1].email;
  }

  return null; // All signatures complete
}

module.exports = router;
```

### Phase 3: Frontend Integration (Weeks 5-6)

#### 3.1 React Components

**Signature Dashboard Component:**
```jsx
// client/src/components/contracts/SignatureDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Progress, List, Button, Space, Tag, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, DownloadOutlined } from '@ant-design/icons';
import { documensoService } from '../../services/documensoService';

const SignatureDashboard = ({ contractId, onStatusChange }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSignatureData();
  }, [contractId]);

  const loadSignatureData = async () => {
    setLoading(true);
    try {
      const data = await documensoService.getSignatureStatus(contractId);
      setSignatureData(data);


---

### 1300_02020_MASTER_GUIDE_UNKNOWN.md

# 1300_02020 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02020 group.

## Files in this Group

- [1300_02020_DOCUMENSO_INTEGRATION_GUIDE.md](1300_02020_DOCUMENSO_INTEGRATION_GUIDE.md)
- [1300_02020_MASTER_GUIDE_UNKNOWN.md](1300_02020_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_02020_DOCUMENSO_INTEGRATION_GUIDE.md

# Documenso E-signature Integration Guide

## Version History
- v3.2 (2025-09-13): Progress tracking and monitoring section added
- v3.1 (2025-09-12): Deployment and security sections enhanced
- v3.0 (2025-09-11): Full integration specification completed
- v2.1 (2025-09-10): Testing and quality assurance guidelines added
- v2.0 (2025-09-09): Technical implementation plan finalized
- v1.0 (2025-09-08): Initial integration framework established

## Status
- [x] Implementation framework defined
- [x] Technical specifications completed
- [x] Database schema designed
- [ ] Development phase 1 complete (Week 8)
- [ ] Development phase 2 complete (Week 10)
- [ ] Integration testing complete (Week 12)
- [ ] Production deployment (Week 12-13)
- [ ] User training complete (Week 14)

## Overview

This guide provides comprehensive documentation for integrating Documenso open-source e-signature solution into the Construction Procurement Platform. The integration enables digital contract signing workflows, replacing manual paper-based processes while maintaining full audit trails and compliance.

### Integration Goals
- **Seamless e-signature workflows** for construction contracts
- **Enterprise-grade security** with full audit compliance
- **Multi-party signing support** for complex procurement processes
- **Mobile-responsive signing** via web and mobile interfaces
- **Integration with existing systems** (Camunda BPM, Supabase, enterprise DMS)

### Key Benefits
- **60% reduction** in contract execution time
- **Zero paper trail** for digital procurement processes
- **Enhanced compliance** with electronic signature laws
- **Improved audit trails** for procurement transactions
- **Mobile accessibility** for on-site approvals

## Integration Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Construction Procurement Hub                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │  Tendering  │ │ Procurement │ │ Contract   │ │ Document    │    │
│  │  System     │ │ Operations  │ │ Management │ │ Control     │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
└─────────────────┬─────────────────┬─────────────────┬───────────────┘
                  │                 │                 │
       ┌─────────────────┐ ┌───────▼───────┐ ┌───────▼───────┐
       │  Camunda BPM    │ │    Supabase    │ │   Documenso   │
       │  Workflows      │ │    Database    │ │ E-signatures  │
       ├─────────────────┤ ├─────────────────┤ └─────────────────┘
       │ • Process Mgmt  │ │ • Contract Data │     • Functions:
       │ • Task Routing  │ │ • Signature     │     • Document Prep
       │ • Status Tracking│ │ Status         │     • Signer Mgmt
       │ • Notifications │ │ • Audit Logs    │     • Status Tracking
       └─────────────────┘ └─────────────────┘     • Security
                  │                 │                    • Templates
                  └─────────────────┼────────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │ Enterprise Document Systems │
                     │ (SharePoint/Google Drive)   │
                     │ • Storage & Retrieval       │
                     │ • Permission Management     │
                     │ • Version Control           │
                     └─────────────────────────────┘
```

### Integration Flow

1. **Contract Approval** → Camunda workflow triggers signature process
2. **Documenso Integration** → API creates signature requests
3. **Signer Notifications** → Email invitations sent to all parties
4. **Signature Process** → Sequential or parallel signing based on workflow
5. **Status Updates** → Real-time updates to procurement system
6. **Completion** → Signed contract stored and workflow completed
7. **Audit Trail** → Complete signature history maintained

## Technical Specification

### Requirements Analysis

#### Functional Requirements
- ✅ Multi-page document signing support
- ✅ Sequential and parallel signing workflows
- ✅ Template-based contract generation
- ✅ Mobile-responsive signing interface
- ✅ Bulk signature operations
- ✅ Custom signature placement
- ✅ Document expiry and reminders
- ✅ Signature validation and verification

#### Non-Functional Requirements
- ✅ Enterprise-grade security (SSL/TLS, encryption)
- ✅ 99.9% uptime availability
- ✅ GDPR compliant data handling
- ✅ SOC 2 Type II compliant operations
- ✅ Mobile-first responsive design
- ✅ Sub-second response times
- ✅ Scalable to 100,000+ documents/month

#### Integration Requirements
- ✅ REST API integration with existing systems
- ✅ Webhook support for real-time updates
- ✅ OAuth 2.0 authentication
- ✅ Database connectivity to Supabase
- ✅ Email notification system compatibility
- ✅ Document storage API integration

### Security Framework

#### Data Protection
```javascript
// AES-256 encryption for document storage
const documentSecurity = {
  atRestEncryption: 'AES-256-GCM',
  inTransitEncryption: 'TLS 1.3',
  keyManagement: 'AWS KMS/HSM integration',
  dataRetention: 'Configurable retention policies',
  rightToDeletion: 'GDPR compliance tools'
};
```

#### Access Control
```javascript
// Role-based access control matrix
const accessControlMatrix = {
  procurement_manager: {
    create: true,
    sign: true,
    cancel: true,
    view_all: true,
    audit: true
  },
  contractor: {
    create: false,
    sign: 'own_documents_only',
    cancel: false,
    view_all: false,
    audit: false
  },
  auditor: {
    create: false,
    sign: false,
    cancel: false,
    view_all: true,
    audit: true
  }
};
```

#### Compliance Requirements
- **21 CFR Part 11** compliance for pharmaceutical/contractor regulations
- **EU eIDAS** compliance for European electronic signatures
- **ESIGN Act** compliance for US electronic signatures
- **Business continuity** planning for disaster recovery

## Implementation Phases

### Phase 1: Foundation Setup (Weeks 1-2)

#### 1.1 Infrastructure Deployment
```bash
# Deploy Documenso instance
git clone https://github.com/documenso/documenso
cd documenso

# Configure production environment
cp .env.example .env.production

# Database configuration
DATABASE_URL="postgresql://user:password@host:5432/documenso_prod"

# Authentication
NEXTAUTH_URL="https://esignature.company.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Email configuration
SMTP_HOST="smtp.company.com"
SMTP_PORT="587"
SMTP_USER="esignature@company.com"
SMTP_PASSWORD="$EMAIL_APP_PASSWORD"

# Security
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

#### 1.2 Database Schema Extensions
```sql
-- Extend existing contract tables for signature integration
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
    signature_required BOOLEAN DEFAULT false;

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
    signature_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
    documenso_document_id VARCHAR(100);

-- Create signature tracking tables
CREATE TABLE contract_signature_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    documenso_document_id VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'sent',
    signers JSONB NOT NULL,
    total_signers INTEGER NOT NULL DEFAULT 0,
    signed_signers INTEGER NOT NULL DEFAULT 0,
    current_signer_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    UNIQUE(contract_id)
);

-- Signature events audit trail
CREATE TABLE signature_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID REFERENCES contract_signature_agreements(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    signer_email VARCHAR(255),
    signer_name VARCHAR(255),
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 API Integration Setup
```javascript
// client/src/services/documensoService.js
import axios from 'axios';
import { supabase } from '../utils/supabaseClient';

class DocumensoService {
  constructor() {
    this.baseURL = process.env.REACT_APP_DOCUMENSO_API_URL;
    this.apiKey = process.env.REACT_APP_DOCUMENSO_API_KEY;

    this.httpClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Documenso API Error:', error);
        throw this.handleApiError(error);
      }
    );
  }

  handleApiError(error) {
    const status = error.response?.status;
    switch (status) {
      case 401:
        return new Error('Authentication failed with e-signature service');
      case 403:
        return new Error('Insufficient permissions for operation');
      case 429:
        return new Error('Rate limit exceeded, please try again later');
      default:
        return new Error(error.response?.data?.message || 'Signature service error');
    }
  }

  // Core functionality
  async createSignatureRequest(contractData, signers) {
    const response = await this.httpClient.post('/api/v1/documents', {
      title: `Construction Contract: ${contractData.contractNumber}`,
      recipients: signers.map((signer, index) => ({
        email: signer.email,
        name: signer.name,
        role: signer.role,
        signingOrder: index + 1
      })),
      document: await this.generateContractPDF(contractData),
      options: {
        requireAllSigners: true,
        expirationDays: 30,
        reminders: true
      }
    });

    // Store in local database
    await supabase.from('contract_signature_agreements').insert({
      contract_id: contractData.id,
      documenso_document_id: response.data.id,
      status: 'sent',
      signers: response.data.recipients,
      total_signers: response.data.recipients.length,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return response.data;
  }

  async getSignatureStatus(documentId) {
    const response = await this.httpClient.get(`/api/v1/documents/${documentId}/status`);
    return this.normalizeStatus(response.data);
  }

  async cancelSignatureRequest(documentId, reason) {
    await this.httpClient.post(`/api/v1/documents/${documentId}/cancel`, {
      reason: reason || 'Cancelled by user'
    });

    // Update local status
    await supabase
      .from('contract_signature_agreements')
      .update({ status: 'cancelled' })
      .eq('documenso_document_id', documentId);
  }

  normalizeStatus(documensoStatus) {
    const statusMap = {
      'DRAFT': 'draft',
      'PENDING': 'sent',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'signed',
      'REJECTED': 'declined',
      'EXPIRED': 'expired',
      'CANCELLED': 'cancelled'
    };

    return {
      status: statusMap[documensoStatus.status] || 'unknown',
      currentSigner: documensoStatus.currentSigner?.email,
      completedSigners: documensoStatus.completedSigners || 0,
      totalSigners: documensoStatus.totalSigners || 0
    };
  }
}

export const documensoService = new DocumensoService();
```

### Phase 2: Workflow Integration (Weeks 3-4)

#### 2.1 Camunda BPM Integration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn">

  <bpmn:process id="contractSignatureProcess" name="Contract Signature Process" isExecutable="true">

    <!-- Contract Approved Event -->
    <bpmn:startEvent id="contractApproved" name="Contract Approved">
      <bpmn:outgoing>flow-to-signature</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- Create E-signature Request -->
    <bpmn:serviceTask id="createSignatureRequest" name="Create Documenso Signature Request">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="contractId">${contractId}</camunda:inputParameter>
          <camunda:inputParameter name="signers">${signers}</camunda:inputParameter>
          <camunda:outputParameter name="signatureDocumentId">${signatureDocumentId}</camunda:outputParameter>
          <camunda:outputParameter name="signingUrl">${signingUrl}</camunda:outputParameter>
        </camunda:inputOutput>
        <camunda:connector>
          <camunda:connectorId>documenso-connector</camunda:connectorId>
          <camunda:inputOutput>
            <camunda:inputParameter name="method">POST</camunda:inputParameter>
            <camunda:inputParameter name="url">${documensoApiUrl}/api/v1/documents</camunda:inputParameter>
          </camunda:inputOutput>
        </camunda:connector>
      </bpmn:extensionElements>
      <bpmn:incoming>flow-to-signature</bpmn:incoming>
      <bpmn:outgoing>flow-to-notifications</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- Send Notifications -->
    <bpmn:serviceTask id="sendNotifications" name="Send Signature Notifications">
      <bpmn:incoming>flow-to-notifications</bpmn:incoming>
      <bpmn:outgoing>flow-await-completion</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- Wait for Completion -->
    <bpmn:receiveTask id="awaitCompletion" name="Await Signature Completion">
      <bpmn:incoming>flow-await-completion</bpmn:incoming>
      <bpmn:outgoing>flow-to-check-status</bpmn:outgoing>
      <bpmn:messageEventDefinition messageRef="signatureCompletedMessage" />
    </bpmn:receiveTask>

    <!-- Check Status -->
    <bpmn:userTask id="checkStatus" name="Review Signature Status">
      <bpmn:incoming>flow-to-check-status</bpmn:incoming>
      <bpmn:outgoing>flow-gateway</bpmn:outgoing>
    </bpmn:userTask>

    <!-- Decision Gateway -->
    <bpmn:exclusiveGateway id="statusGateway" name="Signature Status">
      <bpmn:incoming>flow-gateway</bpmn:incoming>
      <bpmn:outgoing>flow-complete</bpmn:outgoing>
      <bpmn:outgoing>flow-rejected</bpmn:outgoing>
      <bpmn:outgoing>flow-expired</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- Complete Contract -->
    <bpmn:serviceTask id="completeContract" name="Mark Contract as Signed">
      <bpmn:incoming>flow-complete</bpmn:incoming>
      <bpmn:outgoing>flow-end</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- End Events -->
    <bpmn:endEvent id="contractSigned" name="Contract Signed">
      <bpmn:incoming>flow-end</bpmn:incoming>
    </bpmn:endEvent>

    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="flow-to-signature" sourceRef="contractApproved" targetRef="createSignatureRequest" />
    <bpmn:sequenceFlow id="flow-to-notifications" sourceRef="createSignatureRequest" targetRef="sendNotifications" />
    <bpmn:sequenceFlow id="flow-await-completion" sourceRef="sendNotifications" targetRef="awaitCompletion" />
    <bpmn:sequenceFlow id="flow-to-check-status" sourceRef="awaitCompletion" targetRef="checkStatus" />
    <bpmn:sequenceFlow id="flow-gateway" sourceRef="checkStatus" targetRef="statusGateway" />
    <bpmn:sequenceFlow id="flow-complete" sourceRef="statusGateway" targetRef="completeContract">
      <bpmn:conditionExpression xsi:type="tFormalExpression">${signatureStatus == "COMPLETED"}</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow-end" sourceRef="completeContract" targetRef="contractSigned" />

  </bpmn:process>

  <bpmn:message id="signatureCompletedMessage" name="Signature Completed" />

</bpmn:definitions>
```

#### 2.2 Webhook Integration
```javascript
// server/src/routes/documenso-webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload, Object.keys(payload).sort()))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-documenso-signature'];

    // Verify webhook authenticity
    if (!verifyWebhookSignature(payload, signature, process.env.DOCUMENSO_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('Documenso webhook:', payload.event);

    // Process webhook events
    switch (payload.event) {
      case 'DOCUMENT_CREATED':
        await handleDocumentCreated(payload.data);
        break;
      case 'RECIPIENT_SIGNED':
        await handleRecipientSigned(payload.data);
        break;
      case 'DOCUMENT_COMPLETED':
        await handleDocumentCompleted(payload.data);
        break;
      case 'DOCUMENT_DECLINED':
        await handleDocumentDeclined(payload.data);
        break;
      case 'DOCUMENT_EXPIRED':
        await handleDocumentExpired(payload.data);
        break;
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event handlers
async function handleRecipientSigned(data) {
  const { documentId, recipientEmail, signedAt } = data;

  // Update local database
  await supabase
    .from('signature_events')
    .insert({
      agreement_id: documentId,
      event_type: 'signed',
      signer_email: recipientEmail,
      event_data: { signedAt }
    });

  // Update signature agreement
  const { data: agreement } = await supabase
    .from('contract_signature_agreements')
    .select('*')
    .eq('documenso_document_id', documentId)
    .single();

  if (agreement) {
    await supabase
      .from('contract_signature_agreements')
      .update({
        signed_signers: agreement.signed_signers + 1,
        current_signer_email: getNextSigner(agreement, recipientEmail)
      })
      .eq('id', agreement.id);
  }
}

async function handleDocumentCompleted(data) {
  const { documentId, completedAt } = data;

  // Update agreement status
  await supabase
    .from('contract_signature_agreements')
    .update({
      status: 'signed',
      signed_at: completedAt,
      completed_at: new Date().toISOString()
    })
    .eq('documenso_document_id', documentId);

  // Download and store signed document
  await storeSignedDocument(documentId);

  // Trigger Camunda workflow completion
  await triggerWorkflowCompletion(documentId);
}

function getNextSigner(agreement, currentSignerEmail) {
  const signers = agreement.signers;
  const currentIndex = signers.findIndex(s => s.email === currentSignerEmail);

  if (currentIndex < signers.length - 1) {
    return signers[currentIndex + 1].email;
  }

  return null; // All signatures complete
}

module.exports = router;
```

### Phase 3: Frontend Integration (Weeks 5-6)

#### 3.1 React Components

**Signature Dashboard Component:**
```jsx
// client/src/components/contracts/SignatureDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Progress, List, Button, Space, Tag, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, DownloadOutlined } from '@ant-design/icons';
import { documensoService } from '../../services/documensoService';

const SignatureDashboard = ({ contractId, onStatusChange }) => {
  const [signatureData, setSignatureData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSignatureData();
  }, [contractId]);

  const loadSignatureData = async () => {
    setLoading(true);
    try {
      const data = await documensoService.getSignatureStatus(contractId);
      setSignatureData(data);


---



---

