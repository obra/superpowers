# 0020_RENDER_ENVIRONMENT_KEY_USAGE_TRACKER.md

## 📋 Overview

This document tracks instances where API keys and credentials are temporarily sourced from Render environment variables instead of the standard Supabase `external_api_configurations` table. These workarounds are interim solutions and should be migrated to database-driven configuration for consistency and proper management.

## 🎯 Purpose

- **Document Temporary Workarounds**: Track all instances where environment variable keys are used as interim solutions
- **Migration Planning**: Provide clear path to migrate to database-driven configuration
- **System Consistency**: Ensure all services eventually use centralized `external_api_configurations` table
- **Security Tracking**: Monitor and manage temporary key usage across the application

## 📊 Standard Architecture

### ✅ **Proper Key Management Pattern**

```javascript
// STANDARD: Database-driven API key management
async getApiKeyFromDatabase(provider) {
  if (!this.supabase) {
    return null;
  }

  const { data, error } = await this.supabase
    .from("external_api_configurations")
    .select("api_key")
    .eq("api_type", provider)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.[0]?.api_key || null;
}
```

**Benefits:**
- ✅ Centralized configuration management
- ✅ User-controllable via UI (ExternalApiSettings component)
- ✅ Role-based access control
- ✅ Audit trail of configuration changes
- ✅ Easy key rotation without code changes
- ✅ Multi-provider support with graceful failover

## ⚠️ Tracked Workarounds

### 🔧 Instance #1: DocumentStructureExtractionService OpenAI Key

**Status**: ⚠️ **ACTIVE WORKAROUND** (October 2025)

**Location**: `server/src/services/document-processing/DocumentStructureExtractionService.js`

**Issue Description**:
TXT document processing was failing because the service detected "placeholder" text in the environment variable `OPENAI_API_KEY` and enabled bypass mode, returning mock data instead of processing documents with real AI.

**Temporary Solution Implemented**:
```javascript
// TEMPORARY: Removed placeholder detection to allow Render environment key usage
constructor() {
  const openaiKey = process.env.OPENAI_API_KEY;
  
  // REMOVED: hasPlaceholderOpenAI check
  // This allows the service to use the key from Render environment
  // even if it contains "placeholder" text
  
  this.openaiKey = openaiKey;
  
  // Service will try database lookup if environment key missing
  if (!this.openaiKey && this.supabase) {
    // Attempts to get key from external_api_configurations
    const dbKey = await this.getApiKeyFromDatabase('openai');
    this.openaiKey = dbKey;
  }
}
```

**Current Behavior**:
1. Service checks `process.env.OPENAI_API_KEY` from Render environment
2. If found, uses it directly without placeholder detection
3. Falls back to database lookup if environment key missing
4. Only uses mock responses when truly no API key available

**Why Temporary**:
- Proper pattern is to always fetch from `external_api_configurations` table
- Environment variables should only be used for development/testing
- Production should rely on database-managed configuration
- User should control API keys via ExternalApiSettings UI

**Migration Path**:

**Phase 1: Hybrid Approach** (Current - Completed ✅)
```javascript
// 1. Check environment variable first (temporary)
this.openaiKey = process.env.OPENAI_API_KEY;

// 2. Fall back to database
if (!this.openaiKey) {
  this.openaiKey = await this.getApiKeyFromDatabase('openai');
}
```

**Phase 2: Database-First Approach** (Target State - TODO)
```javascript
// 1. Primary: Always try database first
this.openaiKey = await this.getApiKeyFromDatabase('openai');

// 2. Fallback: Only use environment in development mode
if (!this.openaiKey && process.env.NODE_ENV === 'development') {
  this.openaiKey = process.env.OPENAI_API_KEY;
  console.warn('⚠️ Using development environment API key');
}

// 3. Error if no key found in production
if (!this.openaiKey && process.env.NODE_ENV === 'production') {
  throw new Error('OpenAI API key not configured in external_api_configurations');
}
```

**Related Files**:
- Service: `server/src/services/document-processing/DocumentStructureExtractionService.js`
- Route: `server/src/routes/process-routes.js`
- UI Component: `client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx`
- Database Table: `external_api_configurations`

**Testing Requirements**:
- [ ] Verify TXT file upload processes with real AI (not mock data)
- [ ] Confirm structured fields extracted match document content
- [ ] Test approximately 15 fields per document as expected
- [ ] Validate database-first approach works when environment key removed
- [ ] Ensure proper error messages when no key configured

**Migration Deadline**: Before v2.0 production release

---

### 📝 Instance #2: [Future Workarounds]

**Status**: 🔍 **MONITORING** - No additional workarounds currently identified

**Instructions**: When temporary environment key usage is added, document here with same structure as Instance #1.

---

## 🔄 Migration Strategy

### Standard Migration Process

For each tracked workaround:

1. **Verify Database Configuration**
   - Ensure `external_api_configurations` table has active API key
   - Confirm API key works via ExternalApiSettings UI test button
   - Validate proper `api_type` mapping (e.g., "OpenAI", "Claude", etc.)

2. **Update Service Code**
   - Change constructor to prioritize database lookup
   - Add development mode fallback to environment variables
   - Implement proper error handling for missing configuration

3. **Test Database-First Approach**
   - Remove environment variable temporarily
   - Verify service loads key from database
   - Confirm functionality works as expected
   - Test error handling when no key available

4. **Update Documentation**
   - Remove environment variable from deployment docs
   - Update ExternalApiSettings documentation
   - Note migration completion in version history

5. **Clean Up**
   - Remove temporary environment variable from Render
   - Update instance status in this tracker
   - Archive instance details in version history

### Rollback Plan

If migration causes issues:

1. **Immediate Rollback**
   ```bash
   # Re-add environment variable in Render
   OPENAI_API_KEY=<actual-key-value>
   ```

2. **Revert Code Changes**
   ```javascript
   // Restore environment-first approach
   this.openaiKey = process.env.OPENAI_API_KEY;
   if (!this.openaiKey) {
     this.openaiKey = await this.getApiKeyFromDatabase('openai');
   }
   ```

3. **Document Rollback**
   - Note rollback in version history
   - Update instance status to explain why rolled back
   - Schedule retry after addressing issues

---

## 📊 Database Schema Reference

### external_api_configurations Table

```sql
CREATE TABLE external_api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_type TEXT NOT NULL,           -- e.g., "OpenAI", "Claude", "Google Gemini"
  api_key TEXT NOT NULL,             -- Encrypted API key
  api_url TEXT,                      -- Optional custom endpoint
  is_active BOOLEAN DEFAULT true,
  organization_id UUID,              -- Optional organization scope
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES user_management(id),
  
  UNIQUE(api_type, organization_id)
);

-- Index for fast active key lookup
CREATE INDEX idx_external_api_active 
ON external_api_configurations(api_type, is_active) 
WHERE is_active = true;
```

### Supported API Types

| API Type | Description | Used By |
|----------|-------------|---------|
| `OpenAI` | OpenAI GPT models | Document processing, AI generation |
| `Claude` | Anthropic Claude | Alternative LLM provider |
| `Google Gemini` | Google AI | Multi-modal processing |
| `Google Vision` | Google Vision API | Drawing analysis, OCR |
| `SerpAPI` | Search API | Flight booking, data enrichment |

---

## 🎯 Benefits of Database-Driven Configuration

### Security
- 🔒 Keys stored encrypted in database
- 🔐 Access controlled via row-level security (RLS)
- 🛡️ Audit trail of configuration changes
- 🔑 Easy key rotation without redeployment

### User Experience
- 🎨 UI-based configuration management
- ✅ Connection testing before saving
- 📊 Visual status indicators
- 🔄 Real-time configuration updates

### Operational
- 🚀 No deployment required for key updates
- 📈 Scalable across multiple services
- 🔍 Centralized monitoring and alerts
- 🌐 Multi-organization support

### Development
- 🧪 Easy testing with different providers
- 🔄 Quick provider switching
- 📝 Self-documenting configuration
- 🎯 Consistent patterns across services

---

## ✅ Completion Criteria

An instance is considered fully migrated when:

- [x] Service loads key from `external_api_configurations` table
- [x] Database-first approach with dev-only environment fallback
- [x] Comprehensive error handling for missing configuration
- [x] Documentation updated to reflect database-driven approach
- [x] Environment variable removed from production deployment
- [x] Testing confirms functionality with database key
- [x] No regression in existing functionality

---

## 📚 Related Documentation

- [0020_AUTHENTICATION_MASTER_GUIDE.md](./0020_AUTHENTICATION_MASTER_GUIDE.md) - Authentication system overview
- [0200_EXTERNAL_SERVICES_MASTER_GUIDE.md](../external-services/0200_EXTERNAL_SERVICES_MASTER_GUIDE.md) - API integration guide
- [ExternalApiSettings Component](../../client/src/pages/02050-information-technology/components/DevSettings/ExternalApiSettings.jsx) - UI for managing API configurations
- [1300_01300_DOCUMENT_STRUCTURE_EXTRACTION_PROMPTS.md](../pages-disciplines/1300_01300_DOCUMENT_STRUCTURE_EXTRACTION_PROMPTS.md) - Document processing documentation

---

## 📝 Status

- [x] Initial draft
- [x] Technical review
- [x] First workaround documented (DocumentStructureExtractionService)
- [ ] Migration to database-first approach
- [ ] Production deployment verification
- [ ] Audit completed

## 🔄 Version History

### v1.0 (2025-10-23)
- **Initial Creation**: Documented first instance (DocumentStructureExtractionService OpenAI key usage)
- **Context**: TXT document processing was using mock data due to placeholder detection
- **Solution**: Removed placeholder detection to allow Render environment key usage as interim fix
- **Next Steps**: Migrate to database-first approach before v2.0 production release

---

## 🎯 Summary

This tracker ensures transparent management of temporary environment variable usage while maintaining a clear path toward standardized database-driven configuration. All services should ultimately source credentials from `external_api_configurations` for consistency, security, and operational efficiency.

**Current Active Workarounds**: 1  
**Migration Target Date**: Before v2.0 production release  
**Priority**: Medium (functional but should be migrated)
