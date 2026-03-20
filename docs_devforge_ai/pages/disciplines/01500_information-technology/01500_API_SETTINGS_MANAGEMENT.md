# 1300_02050_API_SETTINGS_MANAGEMENT.md

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-10-27): Initial API settings management documentation

## Overview

The External API Settings management system provides comprehensive centralized configuration for all external API integrations used throughout the application. This system enables secure storage, retrieval, and management of API credentials for AI services, flight booking platforms, and safety analysis tools.

## Core Component: ExternalApiSettings.jsx

**File Location:** `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`

The ExternalApiSettings component serves as the primary interface for managing external API configurations, accessible through the Information Technology page (02050) under Developer Settings.

## API Key Storage and Retrieval Architecture

### 1. Database Storage Structure

API configurations are stored in the `external_api_configurations` table with the following structure:

```sql
CREATE TABLE external_api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(255) NOT NULL,
  api_type VARCHAR(100) NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key TEXT NOT NULL, -- Encrypted storage
  organization_id VARCHAR(100),
  temperature DECIMAL(3,1) DEFAULT 0.7,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

**Key Security Features:**
- **Encrypted API Keys:** All API keys are encrypted before database storage using industry-standard encryption
- **User Isolation:** API configurations are scoped to the creating user via `user_id`
- **Organization Filtering:** Optional organization-based filtering for multi-tenant setups

### 2. API Processing and Error Handling

**Critical Policy: No Fallback Processing**
When API services are unavailable or fail to process content adequately, the system **MUST NOT** create forms using mock data. Instead, the system advises users of the problem via explicit error notifications.

```javascript
// FATAL ERROR HANDLING - No Mock Data Generation
if (!hasStructuredFields) {
  console.error('[TXT PROCESSING] ❌ NO STRUCTURED FIELDS: AI processing did not extract any form fields');
  console.error('[TXT PROCESSING] ❌ Returning error response instead of mock fallback');

  return res.status(400).json({
    success: false,
    error: 'Document processing failed: No form fields could be extracted',
    message: 'The AI could not identify any form fields or structure in the document.',
    notification_required: true,
    notification_type: 'processing_failed_no_fields',
    notification_message: 'Document processing failed to identify structured fields...'
  });
}
```

**Error Response Strategy:**
1. **When AI extraction fails** ❌ → Return 500 error with configuration troubleshooting
2. **When AI returns no fields** ❌ → Return 400 error with document format guidance
3. **Never generate mock forms** 🚫 → Always notify users of processing problems
4. **Clear user communication** 📢 → Explicit error messages and troubleshooting guidance

### 3. Data Retrieval Process

The component retrieves API configurations through the `externalApiConfigurationService`:

```javascript
// Service method
export const getExternalApiConfigurations = async () => {
  try {
    const { data, error } = await supabase
      .from('external_api_configurations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Decrypt API keys before returning to client
    const decryptedData = data.map(config => ({
      ...config,
      api_key: decryptApiKey(config.api_key) // Secure decryption
    }));

    return decryptedData;
  } catch (error) {
    console.error('Error retrieving API configurations:', error);
    throw error;
  }
};
```

**Security Layers:**
1. **RLS Enforcement:** Row Level Security ensures user data isolation
2. **Post-Retrieval Decryption:** API keys are decrypted on-demand and never cached in plain text
3. **Secure Transmission:** All data transferred via HTTPS with proper authentication

### 3. API Key Encryption Process

API keys undergo multiple encryption layers:

```javascript
// Encryption before storage
const encryptAndStore = async (apiKey) => {
  const encryptedKey = await encryptApiKey(apiKey); // AES-256 encryption
  return encryptedKey;
};

// Decryption during retrieval
const retrieveAndDecrypt = async (encryptedKey) => {
  const decryptedKey = await decryptApiKey(encryptedKey); // Secure decryption
  return decryptedKey;
};
```

## How The Page Functions

### 1. Initial Load Process

```javascript
useEffect(() => {
  loadConfigurations(); // Load all user's API configurations
}, []);
```

**Load Process Steps:**
1. **Authentication Check:** Verify user session and permissions
2. **Database Query:** Fetch configurations from `external_api_configurations` table
3. **Decryption:** Securely decrypt API keys for display
4. **State Update:** Populate component state with configuration data
5. **UI Rendering:** Display configurations in card-based interface

### 2. API Type Categorization

The system supports multiple API categories with predefined types:

```javascript
// AI Services (Primary Category)
const AI_API_TYPES = [
  'OpenAI', 'Claude', 'Google Gemini', 'Hugging Face'
];

// Specialized APIs
const FLIGHT_BOOKING_API_TYPES = [
  'Amadeus Travel API', 'Sabre Travel API', 'Google Flights API'
];

const SAFETY_API_TYPES = [
  'OpenAI Vision', 'Google Vision AI', 'Amazon Rekognition'
];
```

Each API type includes:
- **Type-specific validation** (URL patterns, required fields)
- **Usage context** (AI generation, safety analysis, travel booking)
- **Visual categorization** in the UI with color-coded badges

### 3. CRUD Operations Workflow

#### Create New Configuration
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  // 1. Form Validation
  if (!validateForm()) return;

  // 2. Encrypt API Key
  const configData = {
    ...formData,
    api_key: await encryptApiKey(formData.api_key)
  };

  // 3. Database Storage
  await saveExternalApiConfiguration(configData);

  // 4. State Update
  await loadConfigurations();

  // 5. UI Feedback
  showNotification('Configuration created', 'success');
};
```

#### Update Existing Configuration
```javascript
const handleEdit = (config) => {
  // 1. Populate form with existing data
  setFormData({...config});

  // 2. Show form for editing
  setEditingConfig(config);
  setShowForm(true);
};

// Similar submit process with UPDATE instead of INSERT
```

#### Delete Configuration
```javascript
const handleDelete = async (id) => {
  if (!confirm('Delete this API configuration?')) return;

  // Secure deletion with proper error handling
  await deleteExternalApiConfiguration(id);
  await loadConfigurations();
};
```

### 4. API Connection Testing

The system provides real-time API testing functionality:

```javascript
const handleTestApi = async (config) => {
  try {
    setTestingApi(config.id);

    const result = await testExternalApiConfiguration(config.id);

    if (result.success) {
      showNotification(`API test successful: ${result.message}`, 'success');
    } else {
      showNotification(`API test failed: ${result.message}`, 'error');
    }
  } catch (error) {
    showNotification('Connection test failed', 'error');
  } finally {
    setTestingApi(null);
  }
};
```

**Testing Process:**
1. **Retrieve Configuration:** Load specific API config and decrypt key
2. **Build Test Request:** Construct appropriate test payload based on API type
3. **Execute Test Call:** Make authenticated request to external API
4. **Validate Response:** Check response status, format, and authentication
5. **Report Results:** Provide user feedback on connection status

## Integration Points Throughout Application

### 1. Drawing Analysis Service (Contracts Page)

```javascript
// Integration in drawingAnalysisService.js
const getVisionApiConfig = async () => {
  const configs = await getExternalApiConfigurations();

  return configs.find(config =>
    config.api_type === 'OpenAI' ||
    config.api_type === 'Google Vision AI'
  );
};
```

**Usage:** Automatic detection of Vision APIs for DWG comparison functionality.

### 2. Flight Booking Service (Travel Arrangements)

```javascript
// Integration in flightBookingService.js
const getFlightBookingApis = async () => {
  return (await getExternalApiConfigurations())
    .filter(config => FLIGHT_BOOKING_API_TYPES.includes(config.api_type));
};
```

**Usage:** The flight booking modal automatically detects configured travel APIs for pre-populated flight search.

### 3. Safety Analysis Agents

```javascript
// Integration in safety analysis agents
const safetyConfigs = await getExternalApiConfigurations()
  .filter(config => SAFETY_API_TYPES.includes(config.api_type));
```

**Usage:** Safety analysis agents automatically select and use configured safety APIs for hazard detection.

### 4. AI Generation Services

```javascript
// Integration in scopeOfWorkGenerationService.js
const aiConfigs = await getExternalApiConfigurations()
  .filter(config => AI_API_TYPES.includes(config.api_type));
```

**Usage:** Scope of Work generation leverages multiple configured AI providers for enhanced document processing.

### 6. **Spreadsheet AI Assistant Integration**

#### AI-Powered Spreadsheet Help System
**Component Location**: `client/src/pages/02050-coding-templates/02050-univer-spreadsheet.js`

**Service Location**: `client/src/services/spreadsheetAIService.js`

**Capabilities:**
- **Intelligent Formula Assistance**: Context-aware formula suggestions based on spreadsheet data patterns
- **Data Analysis Queries**: Natural language queries for data insights and statistical analysis
- **Real-time Spreadsheet Context**: AI receives and analyzes current spreadsheet state including cell values, formulas, and data types
- **Multi-LLM Provider Support**: Automatic selection and use of configured OpenAI, Claude, or Google Gemini APIs

**Example Configurations:**
```javascript
{
  "api_name": "OpenAI Spreadsheet Assistant",
  "api_type": "OpenAI",
  "endpoint_url": "https://api.openai.com/v1",
  "api_key": "encrypted-key-here",
  "organization_id": "your-org-id"
}
```

**Key Features:**
- **Automatic LLM Selection**: Uses OpenAI (preferred), Claude, or Gemini based on availability
- **Context-Aware Prompts**: Analyzes spreadsheet data to provide relevant, specific assistance
- **Secure API Handling**: API keys decrypted in-memory during calls, never persistently stored
- **Error Recovery**: Graceful degradation when API services are unavailable
- **Caching**: 5-minute configuration caching for improved performance

**Supported Interactions:**
```
User: "What’s the total cost in B column?"
AI: "Column B contains: B2($2.50), B3($3.25), B4($1.99), Total: $7.74. Use =SUM(B2:B4)"

User: "Create profit margin calculation"
AI: "To calculate profit margins: Column D = (Revenue-Cost)/Revenue = (B2-C2)/B2
Format as percentage, then average with =AVERAGE(D2:D10)"
```

**Business Applications:**
- **Procurement Analysis**: Automated cost comparison and budget variance detection
- **Financial Reporting**: Intelligent data analysis and trend identification
- **Construction Estimating**: Quantity takeoff calculations and cost estimation guidance
- **Safety Compliance**: Incident data analysis and compliance metric calculations

## Security Architecture

### 1. End-to-End Encryption

- **Client-side Encryption:** API keys encrypted before transmission
- **Database Storage:** Double-encryption with user-specific keys
- **Retrieval Decryption:** Keys decrypted only in memory, never persisted

### 2. Access Control Mechanisms

- **Row-Level Security:** Supabase RLS ensures user data isolation
- **Role-Based Access:** Admin-level access control for IT personnel
- **Audit Logging:** All configuration changes logged with timestamps

### 3. Client-Side Security

```javascript
// API Key Masking in UI
const maskedKey = `••••••••••••${config.api_key.slice(-4)}`;

// Secure Form Handling
const handleInputChange = (e) => {
  const { name, value } = e.target;

  // Clear validation errors
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  // Secure password field handling
  if (name === 'api_key') {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};
```

## User Interface Components

### 1. Configuration Cards

Each API configuration displays in a card format with:
- **API Name & Type** with color-coded badges
- **Endpoint URL** with security validation
- **Masked API Key** (shows only last 4 characters)
- **Temperature Setting** for AI APIs (0.0-2.0 range)
- **Action Buttons:** Test, Edit, Delete

### 2. Add/Edit Form

Comprehensive form with:
- **API Name:** User-friendly identifier
- **API Type:** Dropdown with categorized options
- **Endpoint URL:** With real-time URL validation
- **API Key:** Password field with secure handling
- **Organization ID:** Optional OpenAI organization filtering
- **Temperature:** AI response creativity control (0.7 default)

### 3. Specialized API Guidance

The interface includes contextual guidance for:
- **Safety Analysis APIs:** Vision AI recommendations for hazard detection
- **Travel APIs:** Flight booking integration explanations
- **Video Analysis APIs:** Real-time safety monitoring capabilities

## Performance and Reliability Features

### 1. Connection Pooling

```javascript
// Service layer implements connection reuse
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Connection pool limit
  idleTimeoutMillis: 30000 // Connection cleanup
});
```

### 2. Error Handling and Retry Logic

```javascript
const testWithRetry = async (config, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await testExternalApiConfiguration(config.id);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }
};
```

### 3. Caching Strategies

- **Configuration Caching:** API configs cached during session
- **Result Caching:** Test results cached to reduce redundant API calls
- **Smart Invalidation:** Cache cleared on configuration changes

## Configuration Validation Rules

### 1. URL Validation

```javascript
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};
```

### 2. API Type-Specific Validation

```javascript
const validateConfiguration = (config) => {
  const errors = {};

  // OpenAI-specific validation
  if (config.api_type === 'OpenAI') {
    if (!config.api_key.startsWith('sk-')) {
      errors.api_key = 'OpenAI API keys should start with "sk-"';
    }
  }

  return errors;
};
```

### 3. Security Validation

- **API Key Format:** Minimum length requirements
- **Endpoint Security:** HTTPS requirement for production
- **Organization ID:** Format validation where required

## Integration with Application Features

### 1. Modal Integration

The API settings integrate seamlessly with modal systems throughout the application:
- Travel booking modals automatically detect configured APIs
- Safety analysis modals provide real-time configuration status
- Document processing modals leverage configured AI services

### 2. State Management

```javascript
// Context integration for global availability
const ApiConfigContext = createContext();

const ApiConfigProvider = ({ children }) => {
  const [configs, setConfigs] = useState([]);

  useEffect(() => {
    loadConfigurations();
  }, []);

  return (
    <ApiConfigContext.Provider value={{ configs, reloadConfigs: loadConfigurations }}>
      {children}
    </ApiConfigContext.Provider>
  );
};
```

### 3. Real-time Updates

- **Configuration Changes:** Immediate propagation to dependent services
- **Status Monitoring:** Real-time connection health check
- **Usage Analytics:** API usage tracking and reporting

## Monitoring and Maintenance

### 1. System Health Checks

```javascript
// Automated health monitoring
const monitorApiHealth = async () => {
  const configs = await getExternalApiConfigurations();

  const healthStatus = await Promise.all(
    configs.map(async (config) => ({
      id: config.id,
      status: await testApiConnection(config),
      lastChecked: new Date()
    }))
  );

  // Store health status in monitoring table
  await updateApiHealthStatus(healthStatus);
};
```

### 2. Audit Trail

All API configuration activities are logged:
- Configuration creation/modification/deletion
- API key access and usage
- Failed connection attempts
- Security incidents

### 3. Backup and Recovery

- **Automated Backups:** API configurations backed up regularly
- **Recovery Procedures:** Clear processes for restoring configurations
- **Key Rotation:** Automated processes for key renewal

## Related Service Files

The API settings management system consists of multiple interrelated components:

### Client-Side Components
- `ExternalApiSettings.jsx` - Main management interface
- `SimpleExternalApiSettings.jsx` - Lightweight version for specific use cases
- `externalApiConfigurationService.js` - Client-side service layer

### Server-Side Components
- `external-api-routes.js` - RESTful API endpoints
- `externalApiController.js` - Server-side business logic
- `external-api-configuration-schema.sql` - Database schema

## Status
- [x] Core functionality implemented
- [x] Security architecture validated
- [x] Integration points established
- [x] User interface completed
- [ ] Comprehensive monitoring system
- [ ] Advanced audit logging

## Version History
- v1.0 (2025-10-27): Complete API settings management documentation

This system provides a robust, secure foundation for managing external API integrations across the entire application while maintaining high standards of security, performance, and user experience.
