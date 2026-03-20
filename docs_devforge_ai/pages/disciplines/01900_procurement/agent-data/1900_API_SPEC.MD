# Procurement Discipline API Specification

## Overview

This document specifies the API endpoints and data contracts for the Procurement discipline, enabling strategic sourcing, vendor management, purchase order processing through programmatic interfaces.

## Base URL
```
https://api.constructai.com/v1/procurement
```

## Authentication
All API requests require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Core Endpoints

### Supplier Management

#### GET /suppliers
Retrieve paginated list of suppliers
```http
GET /suppliers?page=1&limit=50&status=active
Authorization: Bearer <token>
```

**Response:**
```json
{
  "suppliers": [
    {
      "id": "uuid",
      "name": "Supplier Name",
      "status": "active",
      "evaluationScore": 85.5,
      "lastEvaluated": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

#### POST /suppliers
Create new supplier
```http
POST /suppliers
Content-Type: application/json

{
  "name": "New Supplier Ltd",
  "contactEmail": "contact@supplier.com",
  "category": "materials"
}
```

### Contract Management

#### GET /contracts/{id}
Retrieve contract details
```http
GET /contracts/123e4567-e89b-12d3-a456-426614174000
```

#### PUT /contracts/{id}/compliance
Update contract compliance status
```http
PUT /contracts/123e4567-e89b-12d3-a456-426614174000/compliance
Content-Type: application/json

{
  "status": "compliant",
  "findings": [],
  "reviewedBy": "user-uuid",
  "reviewDate": "2024-01-15T10:00:00Z"
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Supplier name is required",
    "details": {
      "field": "name",
      "value": ""
    }
  },
  "timestamp": "2024-01-15T10:00:00Z",
  "requestId": "req-12345"
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting
- 1000 requests per hour per user
- 10000 requests per hour per organization
- Burst limit: 100 requests per minute

## Webhooks

### Contract Status Changes
```json
{
  "event": "contract.status_changed",
  "contractId": "uuid",
  "oldStatus": "draft",
  "newStatus": "active",
  "timestamp": "2024-01-15T10:00:00Z",
  "triggeredBy": "user-uuid"
}
```

### Supplier Evaluation Complete
```json
{
  "event": "supplier.evaluation_complete",
  "supplierId": "uuid",
  "score": 85.5,
  "riskLevel": "LOW",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

## Data Models

### Supplier
```typescript
interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  category: string;
  status: 'active' | 'inactive' | 'suspended';
  evaluationScore?: number;
  lastEvaluated?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Contract
```typescript
interface Contract {
  id: string;
  title: string;
  supplierId: string;
  value: number;
  currency: string;
  status: 'draft' | 'active' | 'terminated' | 'expired';
  startDate: string;
  endDate: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'under_review';
  lastComplianceCheck?: string;
}
```

## Versioning

API versioning follows semantic versioning:
- **v1.x.x**: Backward compatible changes
- **v2.x.x**: Breaking changes
- Sunset policy: 12 months notice for deprecated endpoints

## SDKs and Libraries

### JavaScript SDK
```javascript
import { ConstructAI } from '@constructai/sdk';

const client = new ConstructAI({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.constructai.com/v1'
});

// Get suppliers
const suppliers = await client.suppliers.list({
  status: 'active',
  limit: 50
});

// Create contract
const contract = await client.contracts.create({
  title: 'New Contract',
  supplierId: 'supplier-uuid',
  value: 100000
});
```

## Monitoring and Analytics

### API Metrics
- Response times by endpoint
- Error rates by error type
- Usage patterns by user/organization
- Rate limit hits

### Health Checks
```http
GET /health
```
Returns system health status and dependency checks.

This API specification provides a comprehensive interface for Procurement operations, supporting strategic sourcing, vendor management, purchase order processing through reliable, secure, and well-documented endpoints.