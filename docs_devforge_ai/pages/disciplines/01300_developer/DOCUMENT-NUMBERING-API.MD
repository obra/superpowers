# Document Numbering System API Documentation

## Base URL
`/api/document-numbering`

## Authentication
All endpoints require authentication via JWT token in the Authorization header.

## Endpoints

### 1. Document Types

#### Get Document Types
`GET /types`

**Parameters:**
- `discipline_code` (required): 5-digit discipline code
- `organization_id` (required): Organization UUID
- `company_id` (optional): Company UUID (fallback if no organization_id)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "discipline_code": "string",
      "document_type": "string",
      "numbering_pattern": "string",
      "is_active": boolean
    }
  ]
}
```

#### Create Document Type
`POST /document-types`

**Request Body:**
```json
{
  "discipline_code": "string",
  "document_type": "string",
  "organization_id": "uuid",
  "numbering_pattern": "string"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    ...created_fields
  }
}
```

### 2. Number Generation

#### Generate Document Number
`POST /generate`

**Request Body:**
```json
{
  "discipline_code": "string",
  "document_type": "string",
  "organization_id": "uuid",
  "context": {
    "contract_no": "string",
    "package_no": "string"
  }
}
```

**Response:**
```json
{
  "document_number": "string"
}
```

#### Preview Document Number
`GET /preview`

**Parameters:**
- Same as generate endpoint, but as query params
- `context` should be JSON stringified

**Response:**
```json
{
  "pattern": "string",
  "samples": ["string"],
  "placeholders": {
    "year": "string",
    "month": "string",
    ...
  }
}
```

### 3. Patterns

#### Get Patterns
`GET /patterns`

**Parameters:**
- `organization_id`: Filter by organization

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "pattern": "string"
    }
  ]
}
```

#### Create/Update Pattern
`POST /patterns`

**Request Body:**
```json
{
  "id": "uuid", // omit for new
  "name": "string",
  "organization_id": "uuid",
  "pattern": "string"
}
```

### 4. Configuration

#### Get Numbering Components
`GET /config/components`

**Response:**
```json
{
  "components": [
    {
      "name": "year",
      "description": "Current year"
    }
  ]
}
```

#### Get Configuration
`GET /config`

**Parameters:**
- `organization_id`: Organization to get config for

**Response:**
```json
{
  "organization_id": "uuid",
  "config": {
    "default_methodology": "uuid"
  }
}
```

## Example Usage

### Generate a Contract Document Number
```javascript
const response = await fetch('/api/document-numbering/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    discipline_code: '00435',
    document_type: 'CONTRACT',
    organization_id: '50a4dab9-bd07-40cd-8f16-25606df6c0d4',
    context: {
      contract_no: 'CT-2023-001'
    }
  })
});

// Returns: { "document_number": "00435-2023-001" }
```

## Error Responses
All errors follow this format:
```json
{
  "error": "Error message",
  "code": "error_code" // optional
}
```

Common error codes:
- `invalid_pattern`: Pattern validation failed
- `missing_parameter`: Required parameter missing
- `not_found`: Resource not found
