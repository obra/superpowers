# Customs API Connectors Framework

## Overview

This document defines the API connector framework for electronic customs submissions. The framework enables automated integration with customs portals for declaration submission, status tracking, and payment processing.

**Status**: 📋 Framework Design Complete  
**Version**: 1.0.0  
**Created**: 2026-02-17  
**Priority**: High

---

## Connector Architecture

### Database Schema

```sql
-- Table: customs_api_connectors
-- Stores API configuration for electronic customs submissions

CREATE TABLE customs_api_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL,
    connector_name VARCHAR(100) NOT NULL,
    connector_version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- API Configuration
    api_base_url VARCHAR(255) NOT NULL,
    api_version VARCHAR(20),
    api_protocol VARCHAR(20) DEFAULT 'REST',  -- REST, SOAP, GraphQL
    
    -- Authentication
    auth_type VARCHAR(50) NOT NULL,  -- oauth2, api_key, certificate, basic
    auth_config JSONB DEFAULT '{}',
    
    -- Endpoints
    endpoints JSONB NOT NULL DEFAULT '{}',
    
    -- Request/Response Configuration
    request_config JSONB DEFAULT '{}',
    response_config JSONB DEFAULT '{}',
    
    -- Rate Limiting
    rate_limit_requests INT,
    rate_limit_period_seconds INT,
    
    -- Retry Configuration
    max_retries INT DEFAULT 3,
    retry_delay_seconds INT DEFAULT 5,
    
    -- Timeout
    timeout_seconds INT DEFAULT 30,
    
    -- Webhook Configuration
    webhook_url VARCHAR(255),
    webhook_secret VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_connection_test TIMESTAMP,
    connection_status VARCHAR(20) DEFAULT 'unknown',
    
    FOREIGN KEY (country_code) REFERENCES country_customs_configurations(country_code)
);

CREATE INDEX idx_customs_api_country ON customs_api_connectors(country_code);
CREATE INDEX idx_customs_api_active ON customs_api_connectors(is_active);
```

### Authentication Configuration Schema

```json
{
  "auth_type": "oauth2",
  "auth_config": {
    "token_url": "https://api.customs.gov/oauth/token",
    "grant_type": "client_credentials",
    "client_id_env": "CUSTOMS_CLIENT_ID",
    "client_secret_env": "CUSTOMS_CLIENT_SECRET",
    "scope": "declarations:write declarations:read",
    "token_cache_seconds": 3600
  }
}
```

### Endpoints Configuration Schema

```json
{
  "endpoints": {
    "submit_declaration": {
      "path": "/api/v1/declarations",
      "method": "POST",
      "content_type": "application/json"
    },
    "get_declaration": {
      "path": "/api/v1/declarations/{declaration_id}",
      "method": "GET"
    },
    "get_status": {
      "path": "/api/v1/declarations/{declaration_id}/status",
      "method": "GET"
    },
    "submit_payment": {
      "path": "/api/v1/payments",
      "method": "POST"
    },
    "upload_document": {
      "path": "/api/v1/documents/upload",
      "method": "POST",
      "content_type": "multipart/form-data"
    },
    "validate_hs_code": {
      "path": "/api/v1/hs-codes/{code}/validate",
      "method": "GET"
    },
    "calculate_duties": {
      "path": "/api/v1/duties/calculate",
      "method": "POST"
    }
  }
}
```

---

## GUCE (Guinea) API Connector

### Configuration

```sql
INSERT INTO customs_api_connectors (
    country_code,
    connector_name,
    connector_version,
    api_base_url,
    api_version,
    api_protocol,
    auth_type,
    auth_config,
    endpoints,
    request_config,
    response_config,
    rate_limit_requests,
    rate_limit_period_seconds
) VALUES (
    'GN',
    'GUCE Customs API',
    '1.0',
    'https://api.guceg.gov.gn',
    'v1',
    'REST',
    'oauth2',
    '{
        "token_url": "https://api.guceg.gov.gn/oauth/token",
        "grant_type": "client_credentials",
        "client_id_env": "GUCE_CLIENT_ID",
        "client_secret_env": "GUCE_CLIENT_SECRET",
        "scope": "declarations:write declarations:read payments:write",
        "token_cache_seconds": 3600
    }',
    '{
        "submit_di": {
            "path": "/declarations/intention",
            "method": "POST",
            "description": "Submit Déclaration d Intention"
        },
        "submit_cdc": {
            "path": "/declarations/cdc",
            "method": "POST",
            "description": "Submit CDC declaration"
        },
        "get_cdc_status": {
            "path": "/declarations/cdc/{cdc_id}",
            "method": "GET",
            "description": "Get CDC status"
        },
        "calculate_duties": {
            "path": "/simulator/duties",
            "method": "POST",
            "description": "Calculate duties using GUCE simulator"
        },
        "validate_hs_code": {
            "path": "/hs-codes/{code}/validate",
            "method": "GET",
            "description": "Validate HS code against Guinea tariff"
        },
        "submit_payment": {
            "path": "/payments",
            "method": "POST",
            "description": "Submit duty payment"
        },
        "get_quittance": {
            "path": "/payments/{payment_id}/quittance",
            "method": "GET",
            "description": "Get payment receipt"
        },
        "request_enlevement": {
            "path": "/declarations/cdc/{cdc_id}/enlevement",
            "method": "POST",
            "description": "Request goods removal"
        },
        "get_bon_sortie": {
            "path": "/declarations/cdc/{cdc_id}/bon-sortie",
            "method": "GET",
            "description": "Get exit permit"
        },
        "upload_document": {
            "path": "/documents/upload",
            "method": "POST",
            "content_type": "multipart/form-data",
            "description": "Upload supporting document"
        }
    }',
    '{
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        "timeout_seconds": 30,
        "include_request_id": true
    }',
    '{
        "success_codes": [200, 201, 202],
        "error_field": "error",
        "message_field": "message",
        "data_field": "data",
        "pagination": {
            "enabled": true,
            "page_param": "page",
            "limit_param": "limit"
        }
    }',
    100,
    60
);
```

### GUCE API Service Implementation

```python
# File: deep-agents/deep_agents/agents/pages/01700-logistics/connectors/guce_connector.py

import aiohttp
import os
from typing import Dict, Optional
from datetime import datetime, timedelta

class GUCEConnector:
    """API connector for Guinea GUCE customs portal"""
    
    def __init__(self, config: Dict):
        self.base_url = config['api_base_url']
        self.endpoints = config['endpoints']
        self.auth_config = config['auth_config']
        self.request_config = config['request_config']
        self._token: Optional[str] = None
        self._token_expires: Optional[datetime] = None
    
    async def _get_auth_token(self) -> str:
        """Get OAuth2 access token"""
        
        # Check cached token
        if self._token and self._token_expires and datetime.now() < self._token_expires:
            return self._token
        
        async with aiohttp.ClientSession() as session:
            token_url = self.auth_config['token_url']
            
            data = {
                'grant_type': self.auth_config['grant_type'],
                'client_id': os.environ.get(self.auth_config['client_id_env']),
                'client_secret': os.environ.get(self.auth_config['client_secret_env']),
                'scope': self.auth_config.get('scope', '')
            }
            
            async with session.post(token_url, data=data) as response:
                result = await response.json()
                
                self._token = result['access_token']
                expires_in = result.get('expires_in', 3600)
                self._token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
                
                return self._token
    
    async def _make_request(
        self, 
        endpoint_name: str, 
        path_params: Dict = None,
        data: Dict = None,
        files: Dict = None
    ) -> Dict:
        """Make authenticated API request"""
        
        token = await self._get_auth_token()
        endpoint = self.endpoints[endpoint_name]
        
        # Build URL with path parameters
        url = f"{self.base_url}{endpoint['path']}"
        if path_params:
            for key, value in path_params.items():
                url = url.replace(f"{{{key}}}", str(value))
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json'
        }
        
        async with aiohttp.ClientSession() as session:
            method = endpoint['method'].lower()
            
            if files:
                # Multipart upload
                form = aiohttp.FormData()
                for key, value in data.items():
                    form.add_field(key, str(value) if not isinstance(value, str) else value)
                for key, file_info in files.items():
                    form.add_field(
                        key, 
                        file_info['content'], 
                        filename=file_info['filename'],
                        content_type=file_info.get('content_type', 'application/octet-stream')
                    )
                
                async with getattr(session, method)(url, data=form, headers=headers) as response:
                    return await response.json()
            
            elif data:
                headers['Content-Type'] = 'application/json'
                async with getattr(session, method)(url, json=data, headers=headers) as response:
                    return await response.json()
            
            else:
                async with getattr(session, method)(url, headers=headers) as response:
                    return await response.json()
    
    # ==================== DI (Déclaration d'Intention) ====================
    
    async def submit_di(self, di_data: Dict) -> Dict:
        """Submit Déclaration d'Intention d'Importation"""
        return await self._make_request('submit_di', data=di_data)
    
    # ==================== CDC Operations ====================
    
    async def submit_cdc(self, cdc_data: Dict) -> Dict:
        """Submit CDC (Déclaration en Détail en Douane)"""
        return await self._make_request('submit_cdc', data=cdc_data)
    
    async def get_cdc_status(self, cdc_id: str) -> Dict:
        """Get CDC declaration status"""
        return await self._make_request('get_cdc_status', path_params={'cdc_id': cdc_id})
    
    # ==================== Duty Calculation ====================
    
    async def calculate_duties(self, items: list, customs_value: float) -> Dict:
        """Calculate duties using GUCE simulator"""
        data = {
            'items': items,
            'customs_value': customs_value
        }
        return await self._make_request('calculate_duties', data=data)
    
    async def validate_hs_code(self, hs_code: str) -> Dict:
        """Validate HS code against Guinea tariff"""
        return await self._make_request('validate_hs_code', path_params={'code': hs_code})
    
    # ==================== Payment ====================
    
    async def submit_payment(self, cdc_id: str, payment_data: Dict) -> Dict:
        """Submit duty payment"""
        data = {
            'cdc_id': cdc_id,
            **payment_data
        }
        return await self._make_request('submit_payment', data=data)
    
    async def get_quittance(self, payment_id: str) -> Dict:
        """Get payment receipt (quittance)"""
        return await self._make_request('get_quittance', path_params={'payment_id': payment_id})
    
    # ==================== Release ====================
    
    async def request_enlevement(self, cdc_id: str) -> Dict:
        """Request goods removal (enlèvement)"""
        return await self._make_request('request_enlevement', path_params={'cdc_id': cdc_id})
    
    async def get_bon_sortie(self, cdc_id: str) -> Dict:
        """Get exit permit (bon de sortie)"""
        return await self._make_request('get_bon_sortie', path_params={'cdc_id': cdc_id})
    
    # ==================== Document Upload ====================
    
    async def upload_document(
        self, 
        document_type: str, 
        file_content: bytes, 
        filename: str,
        cdc_id: str = None
    ) -> Dict:
        """Upload supporting document"""
        data = {'document_type': document_type}
        if cdc_id:
            data['cdc_id'] = cdc_id
        
        files = {
            'file': {
                'content': file_content,
                'filename': filename
            }
        }
        
        return await self._make_request('upload_document', data=data, files=files)
```

---

## SARS (South Africa) API Connector

### Configuration

```sql
INSERT INTO customs_api_connectors (
    country_code,
    connector_name,
    connector_version,
    api_base_url,
    api_version,
    api_protocol,
    auth_type,
    auth_config,
    endpoints,
    request_config,
    response_config
) VALUES (
    'ZA',
    'SARS eFiling API',
    '2.0',
    'https://api.sars.gov.za/customs',
    'v2',
    'REST',
    'certificate',
    '{
        "certificate_path_env": "SARS_CERT_PATH",
        "certificate_password_env": "SARS_CERT_PASSWORD",
        "api_key_env": "SARS_API_KEY"
    }',
    '{
        "submit_sad500": {
            "path": "/declarations/sad500",
            "method": "POST",
            "description": "Submit SAD500 declaration"
        },
        "get_declaration_status": {
            "path": "/declarations/{declaration_id}/status",
            "method": "GET",
            "description": "Get declaration status"
        },
        "calculate_duties": {
            "path": "/calculator/duties",
            "method": "POST",
            "description": "Calculate duties and VAT"
        },
        "validate_tariff": {
            "path": "/tariff/{hs_code}",
            "method": "GET",
            "description": "Validate tariff classification"
        },
        "submit_payment": {
            "path": "/payments",
            "method": "POST",
            "description": "Submit payment"
        }
    }',
    '{
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-API-Key": "{{api_key}}"
        },
        "timeout_seconds": 45
    }',
    '{
        "success_codes": [200, 201],
        "error_field": "errors",
        "message_field": "message"
    }'
);
```

---

## Connector Factory

```python
# File: deep-agents/deep_agents/agents/pages/01700-logistics/connectors/connector_factory.py

from typing import Dict
from .guce_connector import GUCEConnector
# from .sars_connector import SARSConnector  # Future implementation

class CustomsConnectorFactory:
    """Factory for creating customs API connectors"""
    
    _connectors = {
        'GN': GUCEConnector,
        # 'ZA': SARSConnector,  # Future implementation
    }
    
    def __init__(self, db_connection):
        self.db = db_connection
    
    async def get_connector(self, country_code: str):
        """Get connector instance for a country"""
        
        # Load configuration from database
        config = await self.db.query(
            """
            SELECT * FROM customs_api_connectors 
            WHERE country_code = $1 AND is_active = TRUE
            """,
            country_code
        )
        
        if not config:
            raise ValueError(f"No API connector configured for country: {country_code}")
        
        connector_class = self._connectors.get(country_code)
        
        if not connector_class:
            # Use generic connector for unconfigured countries
            return GenericCustomsConnector(config)
        
        return connector_class(config)
    
    async def test_connection(self, country_code: str) -> Dict:
        """Test API connection for a country"""
        
        connector = await self.get_connector(country_code)
        
        try:
            # Attempt to get auth token
            token = await connector._get_auth_token()
            
            # Update connection status
            await self.db.execute(
                """
                UPDATE customs_api_connectors 
                SET connection_status = 'connected',
                    last_connection_test = NOW()
                WHERE country_code = $1
                """,
                country_code
            )
            
            return {
                'status': 'success',
                'country_code': country_code,
                'message': 'Connection successful'
            }
            
        except Exception as e:
            # Update connection status
            await self.db.execute(
                """
                UPDATE customs_api_connectors 
                SET connection_status = 'failed',
                    last_connection_test = NOW()
                WHERE country_code = $1
                """,
                country_code
            )
            
            return {
                'status': 'error',
                'country_code': country_code,
                'message': str(e)
            }
```

---

## API Routes

```javascript
// File: server/src/routes/customs-api-routes.js

const express = require('express');
const router = express.Router();
const CustomsConnectorFactory = require('../services/customs/connector-factory');

// Get connector configuration
router.get('/config/:country_code', async (req, res) => {
    const { country_code } = req.params;
    const config = await getConnectorConfig(country_code);
    res.json(config);
});

// Test connection
router.post('/test/:country_code', async (req, res) => {
    const { country_code } = req.params;
    const result = await testConnection(country_code);
    res.json(result);
});

// Submit declaration
router.post('/declare/:country_code', async (req, res) => {
    const { country_code } = req.params;
    const declaration_data = req.body;
    
    const connector = await getConnector(country_code);
    const result = await connector.submit_cdc(declaration_data);
    
    res.json(result);
});

// Get declaration status
router.get('/status/:country_code/:declaration_id', async (req, res) => {
    const { country_code, declaration_id } = req.params;
    
    const connector = await getConnector(country_code);
    const status = await connector.get_cdc_status(declaration_id);
    
    res.json(status);
});

// Calculate duties
router.post('/calculate/:country_code', async (req, res) => {
    const { country_code } = req.params;
    const { items, customs_value } = req.body;
    
    const connector = await getConnector(country_code);
    const result = await connector.calculate_duties(items, customs_value);
    
    res.json(result);
});

// Validate HS code
router.get('/hs-code/:country_code/:hs_code', async (req, res) => {
    const { country_code, hs_code } = req.params;
    
    const connector = await getConnector(country_code);
    const result = await connector.validate_hs_code(hs_code);
    
    res.json(result);
});

// Upload document
router.post('/upload/:country_code', async (req, res) => {
    const { country_code } = req.params;
    const { document_type, cdc_id } = req.body;
    const file = req.file;
    
    const connector = await getConnector(country_code);
    const result = await connector.upload_document(
        document_type,
        file.buffer,
        file.originalname,
        cdc_id
    );
    
    res.json(result);
});

// Submit payment
router.post('/payment/:country_code', async (req, res) => {
    const { country_code } = req.params;
    const { cdc_id, payment_data } = req.body;
    
    const connector = await getConnector(country_code);
    const result = await connector.submit_payment(cdc_id, payment_data);
    
    res.json(result);
});

// Request release
router.post('/release/:country_code/:cdc_id', async (req, res) => {
    const { country_code, cdc_id } = req.params;
    
    const connector = await getConnector(country_code);
    const result = await connector.request_enlevement(cdc_id);
    
    res.json(result);
});

module.exports = router;
```

---

## Environment Variables

```bash
# GUCE (Guinea) API Credentials
GUCE_CLIENT_ID=your_guce_client_id
GUCE_CLIENT_SECRET=your_guce_client_secret

# SARS (South Africa) API Credentials
SARS_CERT_PATH=/path/to/certificate.p12
SARS_CERT_PASSWORD=your_certificate_password
SARS_API_KEY=your_sars_api_key
```

---

## Webhook Integration

### Webhook Handler

```javascript
// File: server/src/routes/customs-webhooks.js

router.post('/webhook/:country_code', async (req, res) => {
    const { country_code } = req.params;
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;
    
    // Verify signature
    const isValid = verifyWebhookSignature(country_code, signature, payload);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process webhook event
    const event_type = payload.event_type;
    const declaration_id = payload.declaration_id;
    
    switch (event_type) {
        case 'declaration.submitted':
            await handleDeclarationSubmitted(declaration_id, payload);
            break;
        case 'declaration.approved':
            await handleDeclarationApproved(declaration_id, payload);
            break;
        case 'declaration.rejected':
            await handleDeclarationRejected(declaration_id, payload);
            break;
        case 'payment.confirmed':
            await handlePaymentConfirmed(declaration_id, payload);
            break;
        case 'release.granted':
            await handleReleaseGranted(declaration_id, payload);
            break;
        default:
            console.log(`Unknown event type: ${event_type}`);
    }
    
    res.json({ received: true });
});
```

---

## Error Handling

### Error Response Schema

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid HS code format",
    "details": {
      "field": "hs_code",
      "expected": "8-10 digits",
      "received": "271019"
    },
    "request_id": "req_abc123"
  }
}
```

### Retry Logic

```python
async def make_request_with_retry(
    self, 
    endpoint_name: str, 
    max_retries: int = 3,
    **kwargs
) -> Dict:
    """Make request with automatic retry on failure"""
    
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await self._make_request(endpoint_name, **kwargs)
        except aiohttp.ClientError as e:
            last_error = e
            if attempt < max_retries - 1:
                await asyncio.sleep(self.config.get('retry_delay_seconds', 5) * (attempt + 1))
        except Exception as e:
            # Non-retryable error
            raise e
    
    raise last_error
```

---

## Related Documentation

- **Country Configuration**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_COUNTRY_CUSTOMS_CONFIGURATION.md`
- **Guinea CDC Processing**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_GUINEA_CDC_CUSTOMS_PROCESSING.md`
- **Logistics Workflow**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md`

---

*Document Version: 1.0.0*  
*Created: 2026-02-17*  
*Author: Construct AI Development Team*