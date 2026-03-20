# Legacy Environment Variable Migration Tracker

## Overview

This document tracks all instances of legacy environment variable access in the Construct AI codebase that need to be migrated to use the centralized API configuration system (`externalApiConfigurationService`).

## Background

The application has implemented a centralized API configuration system that:
- Stores API credentials securely in the database (encrypted)
- Provides a UI for managing external API configurations (External API Settings page)
- Offers services to retrieve API configurations programmatically
- Supports multiple API types (OpenAI, Claude, Travel APIs, Safety APIs, etc.)

However, many parts of the codebase still use direct environment variable access (`process.env.OPENAI_API_KEY`, etc.) instead of the centralized system.

## Migration Strategy

**Replace direct environment variable access with:**
```javascript
// OLD (Legacy)
const apiKey = process.env.OPENAI_API_KEY;

// NEW (Centralized)
import { getExternalApiConfigurations } from '../services/externalApiConfigurationService.js';
const configs = await getExternalApiConfigurations();
const openaiConfig = configs.find(c => c.api_type === 'OpenAI' && c.api_name.includes('GPT'));
const apiKey = openaiConfig?.api_key;
```

## Found Instances by API Provider

### 🔴 OpenAI API Key (`OPENAI_API_KEY`)

**Priority: HIGH** - Most critical to migrate as it's used extensively

#### Server-Side Files:

1. **`server/src/routes/auto-fill-routes.js`** (Lines: ~10-15)
   - **Current**: `if (!process.env.OPENAI_API_KEY) { throw new Error('OpenAI API key not configured'); }`
   - **Current**: `apiKey: process.env.OPENAI_API_KEY`
   - **Impact**: Auto-fill questionnaire functionality
   - **Migration**: Use centralized OpenAI config for questionnaire processing

2. **`server/src/services/drawingAnalysisAIService.js`** (Lines: ~50-60)
   - **Current**: `const apiKey = process.env.OPENAI_API_KEY;`
   - **Current**: `const orgId = process.env.OPENAI_ORG_ID;`
   - **Impact**: Drawing analysis AI service initialization
   - **Migration**: Use centralized OpenAI Vision API config

3. **`server/src/services/document-processing/DocumentStructureExtractionService.js`** (Lines: ~40-50)
   - **Current**: `const openaiKey = process.env.OPENAI_API_KEY;`
   - **Impact**: Document structure extraction and processing
   - **Migration**: Use centralized OpenAI config for document analysis

4. **`server/src/services/openaiVisionService.js`** (Lines: ~20-25)
   - **Current**: `this.apiKey = process.env.OPENAI_API_KEY;`
   - **Impact**: OpenAI Vision API service
   - **Migration**: Use centralized OpenAI Vision config

5. **`server/src/services/aiServiceBase.js`** (Lines: ~30-40)
   - **Current**: `if (window.ENV?.OPENAI_API_KEY) { const apiKey = window.ENV.OPENAI_API_KEY; }`
   - **Current**: `if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key')`
   - **Impact**: Base AI service functionality
   - **Migration**: Use centralized config lookup

6. **`server/src/controllers/externalApiController.js`** (Lines: ~15-20)
   - **Current**: `api_key: process.env.OPENAI_API_KEY || '',`
   - **Impact**: External API controller setup
   - **Migration**: Remove legacy fallback, rely on centralized system

7. **`server/src/controllers/aiDocumentAnalysisController.js`** (Lines: ~25-35)
   - **Current**: `if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-actual-openai-api-key-here')`
   - **Current**: `apiKey: process.env.OPENAI_API_KEY,`
   - **Impact**: AI document analysis controller
   - **Migration**: Use centralized OpenAI config

8. **`server/src/controllers/drawingAnalysisController.js`** (Lines: ~20-25)
   - **Current**: `console.log('API Key configured:', !!process.env.OPENAI_API_KEY);`
   - **Impact**: Drawing analysis controller
   - **Migration**: Use centralized config status check

9. **`server/app.js`** (Lines: ~100-110)
   - **Current**: `configured: !!process.env.OPENAI_API_KEY,`
   - **Current**: `keyLength: process.env.OPENAI_API_KEY?.length || 0,`
   - **Impact**: Application startup configuration check
   - **Migration**: Use centralized config availability check

#### Client-Side Files:

10. **`client/src/services/aiServiceBase.js`** (Lines: ~25-35)
    - **Current**: `if (window.ENV?.OPENAI_API_KEY) { const apiKey = window.ENV.OPENAI_API_KEY; }`
    - **Impact**: Client-side AI service base functionality
    - **Migration**: Use API endpoint to get centralized config

11. **`client/src/pages/00165-ui-settings/components/00165-LangChainSettings.js`** (Lines: ~200-210)
    - **Current**: `openAIApiKey: process.env.OPENAI_API_KEY,`
    - **Impact**: LangChain settings UI
    - **Migration**: This might be intentional for LangChain-specific settings

#### Test/Debug Files:

12. **Multiple test files** (test-real-pdf-vision.js, test-openai-vision-direct.js, etc.)
    - **Current**: `apiKey: process.env.OPENAI_API_KEY`
    - **Impact**: Testing infrastructure
    - **Migration**: Update tests to use centralized config or mock data

### 🟡 Anthropic/Claude API Key (`ANTHROPIC_API_KEY`)

**Priority: MEDIUM** - Used for Claude AI services

#### Server-Side Files:

1. **`server/src/services/claudeVisionService.js`** (Lines: ~15-20)
   - **Current**: `let apiKey = process.env.ANTHROPIC_API_KEY;`
   - **Impact**: Claude Vision service initialization
   - **Migration**: Use centralized Claude API config

2. **`server/src/controllers/drawingAnalysisController.js`** (Lines: ~30-35)
   - **Current**: `availableAPIs.claude = process.env.ANTHROPIC_API_KEY && claudeService.isInitialized;`
   - **Impact**: Drawing analysis controller API availability check
   - **Migration**: Use centralized config status

3. **`server/services/langchainDocumentChatService.js`** (Lines: ~20-25)
   - **Current**: `if (!process.env.ANTHROPIC_API_KEY) { throw new Error('Anthropic API key not configured'); }`
   - **Current**: `apiKey: process.env.ANTHROPIC_API_KEY,`
   - **Impact**: LangChain document chat service
   - **Migration**: Use centralized Claude config

4. **`server/services/langchainProcessingService.js`** (Lines: ~40-45)
   - **Current**: `apiKey: process.env.ANTHROPIC_API_KEY,`
   - **Impact**: LangChain processing service
   - **Migration**: Use centralized Claude config

#### Test Files:

5. **Multiple test files** (test-anthropic-integration.js, test-document-chatbot.js)
   - **Current**: `if (!process.env.ANTHROPIC_API_KEY)`
   - **Impact**: Testing Claude integration
   - **Migration**: Update tests to use centralized config

### 🟠 Cohere API Key (`COHERE_API_KEY`)

**Priority: LOW** - Limited usage

#### Test Files:

1. **`test/debug/integration/test_cohere_insert.js`** (Lines: ~10-15)
   - **Current**: `apiKey: process.env.COHERE_API_KEY,`
   - **Impact**: Cohere embeddings testing
   - **Migration**: Use centralized Cohere config for testing

## Migration Checklist

### Phase 1: Critical Services (Week 1)
- [ ] `server/src/routes/auto-fill-routes.js` - Auto-fill questionnaire functionality
- [ ] `server/src/services/drawingAnalysisAIService.js` - Core drawing analysis
- [ ] `server/src/services/document-processing/DocumentStructureExtractionService.js` - Document processing
- [ ] `server/src/controllers/aiDocumentAnalysisController.js` - AI document analysis

### Phase 2: Supporting Services (Week 2)
- [ ] `server/src/services/openaiVisionService.js` - Vision API service
- [ ] `server/src/services/claudeVisionService.js` - Claude Vision service
- [ ] `server/src/services/aiServiceBase.js` - Base AI functionality
- [ ] `server/src/controllers/externalApiController.js` - External API management

### Phase 3: Controllers and UI (Week 3)
- [ ] `server/src/controllers/drawingAnalysisController.js` - Analysis controllers
- [ ] `server/app.js` - Application startup checks
- [ ] `client/src/services/aiServiceBase.js` - Client-side services
- [ ] Update test files to use centralized configuration

### Phase 4: Cleanup (Week 4)
- [ ] Remove legacy environment variables from .env files (after confirming all services work)
- [ ] Update documentation
- [ ] Test all functionality with centralized configuration

## Migration Code Examples

### Basic Service Migration

```javascript
// OLD APPROACH
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// NEW APPROACH
import { getExternalApiConfigurations } from '../services/externalApiConfigurationService.js';

const configs = await getExternalApiConfigurations();
const openaiConfig = configs.find(c => c.api_type === 'OpenAI' && c.api_name.includes('GPT'));

if (!openaiConfig?.api_key) {
  throw new Error('OpenAI API key not configured in centralized system');
}

const openai = new OpenAI({
  apiKey: openaiConfig.api_key
});
```

### Controller Migration with Error Handling

```javascript
// OLD APPROACH
async function processDocument(file) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return await openai.processDocument(file);
}

// NEW APPROACH
async function processDocument(file) {
  const configs = await getExternalApiConfigurations();
  const openaiConfig = configs.find(c => c.api_type === 'OpenAI');

  if (!openaiConfig?.api_key) {
    throw new Error('OpenAI API key not configured in centralized system. Please configure it in External API Settings.');
  }

  const openai = new OpenAI({
    apiKey: openaiConfig.api_key
  });

  return await openai.processDocument(file);
}
```

### Fallback Strategy During Migration

```javascript
// TEMPORARY: During migration, try centralized first, fallback to environment
async function getApiKey(apiType, apiName) {
  try {
    const configs = await getExternalApiConfigurations();
    const config = configs.find(c => c.api_type === apiType && c.api_name.includes(apiName));
    if (config?.api_key) {
      console.log(`✅ Using centralized ${apiType} configuration`);
      return config.api_key;
    }
  } catch (error) {
    console.warn(`⚠️ Centralized config lookup failed, trying environment fallback:`, error.message);
  }

  // Fallback to environment variables (remove after migration complete)
  const envKey = process.env[`${apiType.toUpperCase()}_API_KEY`];
  if (envKey && !envKey.includes('your-') && !envKey.includes('placeholder')) {
    console.log(`⚠️ Using legacy environment variable for ${apiType} (migration needed)`);
    return envKey;
  }

  throw new Error(`${apiType} API key not configured`);
}
```

## Testing Strategy

1. **Unit Tests**: Update existing tests to mock centralized configuration service
2. **Integration Tests**: Test end-to-end functionality with centralized configs
3. **Regression Tests**: Ensure all AI features work with new configuration system
4. **Environment Tests**: Test in development, staging, and production environments

## Rollback Plan

If issues arise during migration:
1. Keep environment variables as fallback during transition period
2. Implement feature flags to switch between old/new approaches
3. Have backup environment configurations ready
4. Monitor error logs for configuration-related failures

## Success Criteria

- [ ] All `process.env.*_API_KEY` references replaced with centralized config calls
- [ ] External API Settings UI shows all workflows as migrated
- [ ] No more "legacy environment variable access" warnings
- [ ] All AI features work correctly with centralized configuration
- [ ] Environment variables can be safely removed
- [ ] Documentation updated to reflect new configuration approach

## Notes

- **Environment Variables**: Keep in `.env` files during migration as fallback, remove only after full testing
- **API Key Security**: Centralized system encrypts keys in database, more secure than plain environment variables
- **Multi-tenancy**: Centralized system supports different configs per organization/user
- **Monitoring**: Track which services successfully migrate vs encounter issues

---

*This document is automatically generated from codebase analysis. Last updated: November 28, 2025*
