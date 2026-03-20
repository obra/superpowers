# External API Settings UI Redesign

## Overview

This document defines the redesigned UI for external API settings, grouping API configurations by use case for improved usability and organization.

**Status**: 📋 Design Complete  
**Version**: 1.0.0  
**Created**: 2026-02-17  
**Location**: `http://localhost:3060/#/information-technology/external-api-settings`

---

## Current State Analysis

### Existing Structure
The current API settings page stores API keys in a flat structure:
- `user_langchain_settings` table for LLM API keys
- Single-purpose configuration

### Issues with Current Design
1. **No grouping**: All API keys in one flat list
2. **Limited scope**: Only LLM providers supported
3. **No extensibility**: Difficult to add new API types
4. **No categorization**: Cannot distinguish between different use cases

---

## Proposed Design

### UI Grouping by Use Case

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL API SETTINGS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📁 LLM PROVIDERS                                               │
│  ├── OpenAI                                                     │
│  ├── Anthropic                                                  │
│  ├── Cohere                                                     │
│  ├── Google AI                                                  │
│  └── Azure OpenAI                                               │
│                                                                  │
│  📁 CUSTOMS & TRADE (by Country)                                │
│  ├── 🇬🇳 Guinea (GUCE)                                          │
│  │   ├── Client ID                                              │
│  │   └── Client Secret                                          │
│  ├── 🇿🇦 South Africa (SARS)                                    │
│  │   ├── Certificate Path                                       │
│  │   ├── Certificate Password                                   │
│  │   └── API Key                                                │
│  └── [+ Add Country]                                            │
│                                                                  │
│  📁 SHIPPING & LOGISTICS                                        │
│  ├── Maersk API                                                 │
│  ├── MSC API                                                    │
│  ├── DHL API                                                    │
│  └── FedEx API                                                  │
│                                                                  │
│  📁 PAYMENT GATEWAYS                                            │
│  ├── Stripe                                                     │
│  ├── PayPal                                                     │
│  └── PayFast                                                    │
│                                                                  │
│  📁 TRACKING & MONITORING                                       │
│  ├── VesselFinder API                                           │
│  └── MarineTraffic API                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Existing Table: `external_api_configurations`

The table already exists in the database. The following columns are available:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User reference |
| `organization_id` | TEXT | Organization identifier |
| `category` | VARCHAR(50) | Category: 'llm', 'customs', 'shipping', 'payment', 'tracking' |
| `subcategory` | VARCHAR(50) | Country code for customs, provider name for others |
| `provider_name` | VARCHAR(100) | Provider identifier |
| `display_name` | VARCHAR(100) | Human-readable name |
| `description` | TEXT | Description |
| `credentials` | JSONB | Encrypted credential storage |
| `api_base_url` | VARCHAR(255) | API base URL |
| `api_config` | JSONB | Additional API configuration |
| `is_active` | BOOLEAN | Active status |
| `is_verified` | BOOLEAN | Verification status |
| `last_verified_at` | TIMESTAMP | Last verification time |
| `verification_error` | TEXT | Verification error message |

### Related Existing Tables

| Table | Purpose |
|-------|---------|
| `api_health_checks` | Automated health monitoring results for API endpoints |
| `api_usage_metrics` | Detailed usage metrics and performance data |
| `api_usage_summary` | Aggregated usage summary |
| `credential_rotation_logs` | Audit trail for credential rotation |
| `llm_configurations` | LLM-specific configurations |
| `user_langchain_settings` | User-specific LangChain AI configurations |

### Required Updates to Existing Table

Add columns for customs-specific configuration if not present:

```sql
-- Add category and subcategory if not exists
ALTER TABLE external_api_configurations 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'llm';

ALTER TABLE external_api_configurations 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50);

-- Add indexes for category-based queries
CREATE INDEX IF NOT EXISTS idx_external_api_category 
ON external_api_configurations(category);

CREATE INDEX IF NOT EXISTS idx_external_api_subcategory 
ON external_api_configurations(subcategory);
```

### Credential Schema by Category

#### LLM Providers
```json
{
  "credentials": {
    "api_key": "encrypted_string",
    "organization_id": "optional_org_id"
  }
}
```

#### Customs (by Country)
```json
{
  "credentials": {
    // OAuth2 (Guinea/GUCE)
    "client_id": "encrypted_string",
    "client_secret": "encrypted_string",
    
    // Certificate-based (South Africa/SARS)
    "certificate_path": "encrypted_path",
    "certificate_password": "encrypted_string",
    "api_key": "encrypted_string"
  }
}
```

#### Shipping
```json
{
  "credentials": {
    "api_key": "encrypted_string",
    "api_secret": "encrypted_string",
    "account_number": "string"
  }
}
```

---

## API Endpoints

### Unified API Routes

```javascript
// File: server/src/routes/external-api-routes.js

const express = require('express');
const router = express.Router();

// ==================== Category Management ====================

// Get all categories with counts
router.get('/categories', async (req, res) => {
    const categories = await getCategoriesWithCounts(req.user.id);
    res.json(categories);
});

// Get configurations by category
router.get('/category/:category', async (req, res) => {
    const { category } = req.params;
    const configs = await getConfigurationsByCategory(req.user.id, category);
    res.json(configs);
});

// ==================== Configuration CRUD ====================

// Get all configurations (grouped)
router.get('/', async (req, res) => {
    const configs = await getAllConfigurationsGrouped(req.user.id);
    res.json(configs);
});

// Get single configuration
router.get('/:id', async (req, res) => {
    const config = await getConfiguration(req.user.id, req.params.id);
    res.json(config);
});

// Create configuration
router.post('/', async (req, res) => {
    const config = await createConfiguration(req.user.id, req.body);
    res.json(config);
});

// Update configuration
router.put('/:id', async (req, res) => {
    const config = await updateConfiguration(req.user.id, req.params.id, req.body);
    res.json(config);
});

// Delete configuration
router.delete('/:id', async (req, res) => {
    await deleteConfiguration(req.user.id, req.params.id);
    res.json({ success: true });
});

// ==================== Verification ====================

// Test/verify configuration
router.post('/:id/verify', async (req, res) => {
    const result = await verifyConfiguration(req.user.id, req.params.id);
    res.json(result);
});

// ==================== Category-Specific ====================

// Get customs configurations by country
router.get('/customs/:country_code', async (req, res) => {
    const configs = await getCustomsByCountry(req.user.id, req.params.country_code);
    res.json(configs);
});

// Get available customs countries
router.get('/customs/countries/available', async (req, res) => {
    const countries = await getAvailableCustomsCountries();
    res.json(countries);
});

module.exports = router;
```

---

## Frontend Components

### Main Page Component

```jsx
// File: client/src/pages/information-technology/ExternalApiSettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { ApiCategorySection } from './components/ApiCategorySection';
import { AddApiModal } from './components/AddApiModal';

const CATEGORIES = [
  {
    id: 'llm',
    name: 'LLM Providers',
    icon: '🤖',
    description: 'AI language model providers'
  },
  {
    id: 'customs',
    name: 'Customs & Trade',
    icon: '🌍',
    description: 'Customs declaration APIs by country'
  },
  {
    id: 'shipping',
    name: 'Shipping & Logistics',
    icon: '🚢',
    description: 'Carrier and shipping APIs'
  },
  {
    id: 'payment',
    name: 'Payment Gateways',
    icon: '💳',
    description: 'Payment processing APIs'
  },
  {
    id: 'tracking',
    name: 'Tracking & Monitoring',
    icon: '📡',
    description: 'Shipment tracking APIs'
  }
];

export default function ExternalApiSettingsPage() {
  const [configurations, setConfigurations] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    const response = await fetch('/api/external-api');
    const data = await response.json();
    setConfigurations(data);
  };

  return (
    <div className="external-api-settings-page">
      <div className="page-header">
        <h1>External API Settings</h1>
        <button 
          className="add-button"
          onClick={() => setShowAddModal(true)}
        >
          + Add API Configuration
        </button>
      </div>

      <div className="categories-container">
        <Accordion allowMultiple defaultExpanded={['llm', 'customs']}>
          {CATEGORIES.map(category => (
            <AccordionItem key={category.id} value={category.id}>
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">
                  {configurations[category.id]?.length || 0}
                </span>
              </div>
              
              <ApiCategorySection
                category={category}
                configurations={configurations[category.id] || []}
                onRefresh={loadConfigurations}
              />
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {showAddModal && (
        <AddApiModal
          categories={CATEGORIES}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddConfiguration}
        />
      )}
    </div>
  );
}
```

### Category Section Component

```jsx
// File: client/src/pages/information-technology/components/ApiCategorySection.jsx

export function ApiCategorySection({ category, configurations, onRefresh }) {
  
  if (category.id === 'customs') {
    return (
      <CustomsApiSection 
        configurations={configurations}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="api-list">
      {configurations.length === 0 ? (
        <div className="empty-state">
          <p>No {category.name.toLowerCase()} configured</p>
          <button className="add-link">+ Add {category.name}</button>
        </div>
      ) : (
        configurations.map(config => (
          <ApiConfigurationCard
            key={config.id}
            configuration={config}
            onRefresh={onRefresh}
          />
        ))
      )}
    </div>
  );
}
```

### Customs Section (Country-Grouped)

```jsx
// File: client/src/pages/information-technology/components/CustomsApiSection.jsx

const COUNTRY_INFO = {
  'GN': { name: 'Guinea', flag: '🇬🇳', portal: 'GUCE' },
  'ZA': { name: 'South Africa', flag: '🇿🇦', portal: 'SARS' },
  // Add more countries as needed
};

export function CustomsApiSection({ configurations, onRefresh }) {
  // Group by country
  const byCountry = configurations.reduce((acc, config) => {
    const country = config.subcategory;
    if (!acc[country]) acc[country] = [];
    acc[country].push(config);
    return acc;
  }, {});

  return (
    <div className="customs-section">
      {/* Configured Countries */}
      {Object.entries(byCountry).map(([countryCode, configs]) => {
        const country = COUNTRY_INFO[countryCode] || { 
          name: countryCode, 
          flag: '🏳️', 
          portal: 'Customs' 
        };
        
        return (
          <div key={countryCode} className="country-group">
            <div className="country-header">
              <span className="country-flag">{country.flag}</span>
              <span className="country-name">{country.name}</span>
              <span className="portal-name">({country.portal})</span>
              <span className="status-badge">
                {configs[0].is_verified ? '✅ Verified' : '⚠️ Not Verified'}
              </span>
            </div>
            
            <div className="credentials">
              {configs.map(config => (
                <ApiConfigurationCard
                  key={config.id}
                  configuration={config}
                  onRefresh={onRefresh}
                  compact
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Country Button */}
      <button className="add-country-button">
        + Add Country Customs API
      </button>
    </div>
  );
}
```

### Configuration Card Component

```jsx
// File: client/src/pages/information-technology/components/ApiConfigurationCard.jsx

export function ApiConfigurationCard({ configuration, onRefresh, compact }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch(
        `/api/external-api/${configuration.id}/verify`,
        { method: 'POST' }
      );
      const result = await response.json();
      
      if (result.success) {
        // Show success notification
      } else {
        // Show error notification
      }
    } finally {
      setIsVerifying(false);
      onRefresh();
    }
  };

  return (
    <div className={`api-card ${compact ? 'compact' : ''}`}>
      <div className="card-header">
        <span className="provider-name">{configuration.display_name}</span>
        <span className={`status ${configuration.is_verified ? 'verified' : 'unverified'}`}>
          {configuration.is_verified ? '✅' : '⚠️'}
        </span>
      </div>

      <div className="card-body">
        {configuration.description && (
          <p className="description">{configuration.description}</p>
        )}
        
        <div className="credentials-summary">
          {/* Show masked credentials */}
          <span>API Key: ••••••••{configuration.credentials_masked}</span>
        </div>
      </div>

      <div className="card-actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleVerify} disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
        <button className="danger">Delete</button>
      </div>

      {isEditing && (
        <EditApiModal
          configuration={configuration}
          onClose={() => setIsEditing(false)}
          onSave={onRefresh}
        />
      )}
    </div>
  );
}
```

---

## Migration Plan

### Phase 1: Database Migration

```sql
-- Migrate existing LLM settings to new table
INSERT INTO external_api_configurations (
    user_id,
    organization_id,
    category,
    provider_name,
    display_name,
    credentials,
    is_active
)
SELECT 
    user_id,
    organization_id,
    'llm' as category,
    llm_provider as provider_name,
    CASE llm_provider
        WHEN 'openai' THEN 'OpenAI'
        WHEN 'anthropic' THEN 'Anthropic'
        WHEN 'cohere' THEN 'Cohere'
        ELSE llm_provider
    END as display_name,
    jsonb_build_object(
        'api_key', openai_api_key  -- Will need proper migration
    ) as credentials,
    true as is_active
FROM user_langchain_settings;

-- After verification, drop old table
-- DROP TABLE user_langchain_settings;
```

### Phase 2: Backend Updates

1. Create new routes file: `server/src/routes/external-api-routes.js`
2. Create service file: `server/src/services/externalApiService.js`
3. Update app.js to include new routes
4. Implement encryption for credentials

### Phase 3: Frontend Updates

1. Create new page component: `ExternalApiSettingsPage.jsx`
2. Create category components
3. Create configuration card components
4. Update routing

### Phase 4: Testing

1. Test database migration
2. Test API endpoints
3. Test UI functionality
4. Test encryption/decryption

---

## Security Considerations

### Credential Encryption

All credentials stored in `external_api_configurations.credentials` must be encrypted:

```javascript
// server/src/services/encryptionService.js

const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY;

function encryptCredentials(plaintext) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv
    );
    
    let encrypted = cipher.update(JSON.stringify(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex')
    };
}

function decryptCredentials(encrypted) {
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        Buffer.from(encrypted.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
}
```

---

## Related Documentation

- **API Key Security Migration**: `/docs/procedures/human-workflows/0000_API_KEY_SECURITY_MIGRATION_PROCEDURE.md`
- **Customs API Connectors**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_CUSTOMS_API_CONNECTORS.md`
- **Country Configuration**: `/docs/workflows/01700_LOGISTICS_WORKFLOW/01700_COUNTRY_CUSTOMS_CONFIGURATION.md`

---

*Document Version: 1.0.0*  
*Created: 2026-02-17*  
*Author: Construct AI Development Team*