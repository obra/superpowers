# Supplier Portal API - Technical Specification

## Overview

This document provides detailed technical specifications for the Supplier Portal API, including endpoint definitions, data models, authentication mechanisms, and integration requirements.

## Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │────│  API Gateway    │────│  Supplier API   │
│                 │    │  (Nginx/Envoy)  │    │   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐             ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │             │   AWS S3        │
│   Database      │    │   Cache &       │             │   File Storage  │
│                 │    │   Sessions      │             │                 │
└─────────────────┘    └─────────────────┘             └─────────────────┘
```

### Technology Stack
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.x with TypeScript
- **Database**: PostgreSQL 15+ with connection pooling
- **Cache**: Redis 7+ for session management and caching
- **File Storage**: AWS S3 with CloudFront CDN
- **Authentication**: JWT with RS256 signatures
- **Documentation**: OpenAPI 3.0 with Swagger UI
- **Testing**: Jest for unit tests, Supertest for integration tests
- **Monitoring**: Prometheus metrics with Grafana dashboards

## API Design Principles

### RESTful Design
- **Resource-Based URLs**: `/api/v1/suppliers`, `/api/v1/contracts`
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE appropriately used
- **Status Codes**: Standard HTTP status codes with detailed error messages
- **Content Negotiation**: JSON as primary format with optional XML support
- **Versioning**: URL-based versioning (`/api/v1/`) with deprecation notices

### Security Principles
- **Defense in Depth**: Multiple security layers (network, application, data)
- **Least Privilege**: Role-based access control with granular permissions
- **Data Protection**: Encryption at rest and in transit
- **Audit Trail**: Comprehensive logging of all operations
- **Rate Limiting**: API rate limiting with progressive backoff

### Performance Principles
- **Caching Strategy**: Multi-layer caching (application, database, CDN)
- **Database Optimization**: Proper indexing, query optimization, connection pooling
- **Asynchronous Processing**: Background job processing for heavy operations
- **Pagination**: Cursor-based pagination for large result sets
- **Compression**: Response compression for reduced bandwidth

## Authentication & Authorization

### JWT Authentication
```typescript
// Request Header
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

// Token Payload
{
  "sub": "user-uuid",
  "roles": ["supplier", "contract_manager"],
  "permissions": ["read:suppliers", "write:contracts"],
  "iat": 1640995200,
  "exp": 1641081600,
  "iss": "supplier-portal-api",
  "aud": "devforge-ai"
}
```

### Role-Based Access Control
| Role | Permissions | Description |
|------|-------------|-------------|
| `supplier_admin` | Full CRUD on suppliers, contracts, documents | Supplier company administrators |
| `contract_manager` | Read/write contracts, read suppliers | Internal contract managers |
| `procurement_agent` | Read suppliers, write contracts | Procurement team members |
| `auditor` | Read-only all resources | Compliance and audit personnel |

### Permission Matrix
```typescript
const permissions = {
  'supplier:create': ['supplier_admin'],
  'supplier:read': ['supplier_admin', 'contract_manager', 'procurement_agent', 'auditor'],
  'supplier:update': ['supplier_admin', 'contract_manager'],
  'supplier:delete': ['supplier_admin'],
  'contract:create': ['supplier_admin', 'contract_manager'],
  'contract:read': ['supplier_admin', 'contract_manager', 'procurement_agent', 'auditor'],
  'contract:update': ['supplier_admin', 'contract_manager'],
  'contract:delete': ['supplier_admin']
};
```

## Data Models

### Supplier Entity
```typescript
interface Supplier {
  id: string;                    // UUID v4
  companyName: string;           // Required, 2-100 chars
  registrationNumber: string;    // Business registration number
  taxId: string;                 // Tax identification number
  contactEmail: string;          // Primary contact email
  contactPhone?: string;         // Optional contact phone
  address: Address;              // Structured address object
  status: SupplierStatus;        // ACTIVE, SUSPENDED, TERMINATED
  riskRating: RiskRating;        // LOW, MEDIUM, HIGH, CRITICAL
  categories: string[];          // Service categories
  certifications: Certification[]; // Quality certifications
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;             // User ID who created
  updatedBy: string;             // User ID who last updated
}

enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  PENDING = 'PENDING'
}

enum RiskRating {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### Contract Entity
```typescript
interface Contract {
  id: string;
  supplierId: string;             // Foreign key to Supplier
  contractNumber: string;         // Unique contract identifier
  title: string;                  // Contract title
  description: string;            // Detailed description
  value: number;                  // Contract value in cents
  currency: string;               // ISO 4217 currency code
  startDate: Date;
  endDate: Date;
  status: ContractStatus;
  type: ContractType;             // SERVICE, SUPPLY, MAINTENANCE
  priority: ContractPriority;     // LOW, MEDIUM, HIGH, CRITICAL
  documents: ContractDocument[];  // Associated documents
  milestones: ContractMilestone[]; // Payment/contract milestones
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;            // User ID who approved
  approvedAt?: Date;
}

enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  SUSPENDED = 'SUSPENDED'
}
```

## API Endpoints

### Supplier Management

#### GET /api/v1/suppliers
Retrieve paginated list of suppliers with optional filtering.

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20, max: 100): Items per page
- `status` (enum): Filter by supplier status
- `category` (string): Filter by service category
- `search` (string): Full-text search across company names

**Response:**
```json
{
  "data": [Supplier],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "meta": {
    "requestId": "req-12345",
    "timestamp": "2026-03-20T09:00:00Z"
  }
}
```

#### POST /api/v1/suppliers
Create a new supplier profile.

**Request Body:**
```json
{
  "companyName": "Acme Construction Ltd",
  "registrationNumber": "REG123456",
  "taxId": "TAX789012",
  "contactEmail": "contact@acme.com",
  "contactPhone": "+27-21-123-4567",
  "address": {
    "street": "123 Main Street",
    "city": "Cape Town",
    "province": "Western Cape",
    "postalCode": "8001",
    "country": "South Africa"
  },
  "categories": ["construction", "civil-engineering"],
  "certifications": [
    {
      "type": "ISO9001",
      "number": "ISO9001-2023-001",
      "issuedDate": "2023-01-15",
      "expiryDate": "2026-01-14"
    }
  ]
}
```

#### GET /api/v1/suppliers/{id}
Retrieve detailed supplier information including performance metrics.

#### PUT /api/v1/suppliers/{id}
Update supplier information with full or partial data.

#### DELETE /api/v1/suppliers/{id}
Soft delete supplier (mark as TERMINATED).

### Document Management

#### POST /api/v1/documents/upload
Upload document with metadata.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: File binary data
- `supplierId`: Associated supplier ID
- `contractId` (optional): Associated contract ID
- `documentType`: CERTIFICATE, CONTRACT, INVOICE, etc.
- `title`: Document title
- `description` (optional): Document description
- `tags` (optional): Array of tag strings

**Response:**
```json
{
  "documentId": "doc-uuid",
  "fileName": "certificate.pdf",
  "fileSize": 2457600,
  "mimeType": "application/pdf",
  "uploadUrl": "https://cdn.example.com/documents/doc-uuid.pdf",
  "thumbnailUrl": "https://cdn.example.com/thumbnails/doc-uuid.jpg",
  "uploadedAt": "2026-03-20T09:15:00Z",
  "uploadedBy": "user-uuid"
}
```

#### GET /api/v1/documents/{id}/download
Download document with access logging.

#### GET /api/v1/documents/{id}/versions
Retrieve document version history.

### Contract Management

#### POST /api/v1/contracts
Create new contract.

#### GET /api/v1/contracts/{id}
Retrieve contract details with related documents.

#### PUT /api/v1/contracts/{id}/status
Update contract status with approval workflow.

#### POST /api/v1/contracts/{id}/milestones
Add payment or delivery milestone.

### Analytics & Reporting

#### GET /api/v1/analytics/suppliers/performance
Supplier performance metrics and KPIs.

#### GET /api/v1/analytics/contracts/status
Contract status distribution and trends.

#### GET /api/v1/analytics/documents/upload-trends
Document upload patterns and volumes.

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "contactEmail",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      }
    ],
    "requestId": "req-12345",
    "timestamp": "2026-03-20T09:00:00Z"
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641081600
X-RateLimit-Retry-After: 60
```

### Rate Limit Tiers
- **Basic**: 100 requests/hour
- **Standard**: 1,000 requests/hour
- **Premium**: 10,000 requests/hour
- **Enterprise**: Unlimited (contract-based)

## Caching Strategy

### Response Caching
- **Public Data**: Cache for 5 minutes
- **User-Specific Data**: Cache for 1 minute
- **Real-time Data**: No caching
- **Cache Headers**: `Cache-Control`, `ETag`, `Last-Modified`

### Database Query Caching
- **Frequently Accessed Data**: Redis cache with 10-minute TTL
- **Computed Analytics**: Cache with 1-hour TTL
- **User Sessions**: Redis with configurable TTL

## Monitoring & Observability

### Application Metrics
- **Request Count**: Total requests by endpoint
- **Response Times**: P95, P99 response times
- **Error Rates**: 4xx and 5xx error percentages
- **Throughput**: Requests per second

### Business Metrics
- **Supplier Onboarding**: Time to complete onboarding
- **Contract Processing**: Time from creation to approval
- **Document Upload**: Success rate and processing time
- **User Engagement**: API usage patterns

### Infrastructure Metrics
- **Database Connections**: Active connection count
- **Memory Usage**: Application memory consumption
- **CPU Utilization**: Core usage percentages
- **Disk I/O**: Read/write operations

## Security Considerations

### Data Protection
- **Encryption at Rest**: AES-256 encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Data Masking**: Sensitive data masked in logs
- **Backup Encryption**: Encrypted database backups

### Access Control
- **Multi-Factor Authentication**: Required for admin operations
- **Session Management**: Secure session handling with rotation
- **API Keys**: Secure key management with rotation
- **Audit Logging**: All access attempts logged

### Compliance
- **GDPR**: Data subject rights and consent management
- **POPIA**: Personal information protection compliance
- **Data Retention**: Configurable data retention policies
- **Data Deletion**: Secure data deletion procedures

## Deployment & Scaling

### Environment Configuration
```typescript
const config = {
  development: {
    database: { host: 'localhost', poolSize: 5 },
    redis: { host: 'localhost', port: 6379 },
    rateLimit: { windowMs: 900000, max: 100 }
  },
  production: {
    database: { host: 'prod-db.cluster', poolSize: 20 },
    redis: { cluster: true, nodes: [...] },
    rateLimit: { windowMs: 900000, max: 10000 }
  }
};
```

### Horizontal Scaling
- **Application Layer**: Stateless design with load balancer
- **Database Layer**: Read replicas for query scaling
- **Cache Layer**: Redis cluster for high availability
- **File Storage**: CDN for global content delivery

### Blue-Green Deployment
1. Deploy to staging environment
2. Run automated tests and manual validation
3. Route traffic to new version
4. Monitor for 24 hours before full cutover
5. Rollback plan: Instant switch back to previous version

## Testing Strategy

### Unit Testing
```typescript
describe('SupplierService', () => {
  describe('createSupplier', () => {
    it('should create supplier with valid data', async () => {
      const supplierData = { companyName: 'Test Corp', ... };
      const result = await supplierService.createSupplier(supplierData);
      expect(result.id).toBeDefined();
      expect(result.status).toBe(SupplierStatus.PENDING);
    });

    it('should throw validation error for invalid email', async () => {
      const invalidData = { companyName: 'Test Corp', contactEmail: 'invalid' };
      await expect(supplierService.createSupplier(invalidData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

### Integration Testing
- **API Endpoint Testing**: Full request/response cycles
- **Database Integration**: Data persistence and retrieval
- **External Service Integration**: File storage and email services
- **Authentication Flow**: Complete login/logout cycles

### Performance Testing
- **Load Testing**: 10,000 concurrent users
- **Stress Testing**: System limits and failure points
- **Spike Testing**: Sudden traffic increases
- **Endurance Testing**: Prolonged high-load scenarios

## Documentation & Support

### API Documentation
- **OpenAPI Specification**: Complete API definition
- **Swagger UI**: Interactive API documentation
- **Code Examples**: curl, JavaScript, Python examples
- **Postman Collection**: Pre-built API test collection

### Developer Support
- **GitHub Repository**: Source code and issue tracking
- **Developer Portal**: Guides, tutorials, and best practices
- **Community Forum**: Developer discussions and support
- **Status Page**: API uptime and incident communication

---

**Version**: 1.0
**Last Updated**: 2026-03-01
**Review Date**: 2026-06-01
**Document Owner**: Backend Engineer (CodeSmith)