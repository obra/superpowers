# Supabase API Keys Configuration Guide

## Overview

This document explains the Supabase API key configuration for the ConstructAI application, specifically addressing the ProcurementAgentDB and related services.

## Issue History

### Problem Encountered
The ProcurementAgentDB was failing with "Invalid API key" errors and falling back to in-memory storage, despite having valid credentials in the `.env.dev` file.

### Root Causes Identified

1. **Incorrect Environment File Path Resolution**
   - Files were using relative paths (`../../../../../.env.dev`) that don't work properly in ES modules
   - The path resolved to `/Users/_General/Feb-26-1/deep-agents/deep_agents/.env.dev` (wrong location)
   - Actual file location: `/Users/_General/Feb-26-1/.env.dev` (project root)

2. **Invalid ANON Key**
   - The `SUPABASE_ANON_KEY` in `.env.dev` is expired or invalid
   - Only the `SUPABASE_SERVICE_ROLE_KEY` works correctly
   - Test results showed ANON key returns "Invalid API key" error

## Solution Implemented

### 1. Fixed Path Resolution

Updated all affected files to use proper ES module path resolution:

```javascript
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.dev file at project root
config({ path: resolve(__dirname, '../../../../../../../.env.dev') });
```

### 2. Updated API Key Priority

Changed the key selection order to prioritize the working SERVICE_ROLE key:

```javascript
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY;
```

## Files Modified

The following files were updated with the fixes:

1. `deep-agents/deep_agents/agents/pages/01900_procurement/input-agent/database/ProcurementAgentDB.js`
2. `deep-agents/deep_agents/agents/pages/01900_procurement/input-agent/services/PromptConfigurationService.js`
3. `deep-agents/deep_agents/agents/pages/01900_procurement/input-agent/services/AgentConfigurationService.js`
4. `deep-agents/deep_agents/agents/pages/01900_procurement/input-agent/services/CategorySelectionService.js`

## Environment Variables

### Current Configuration (`.env.dev`)

```bash
# Supabase Configuration
SUPABASE_URL=https://mseizswoiwyewsidknta.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (207 chars) ❌ INVALID
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (219 chars) ✅ VALID
```

### Key Status

| Key Type | Status | Length | Usage |
|----------|--------|--------|-------|
| `SUPABASE_URL` | ✅ Valid | N/A | Project URL |
| `SUPABASE_ANON_KEY` | ❌ Invalid/Expired | 207 chars | Client-side operations (NOT WORKING) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Valid | 219 chars | Server-side operations (WORKING) |

## Security Considerations

### SERVICE_ROLE Key Usage

⚠️ **Important Security Notes:**

1. **Server-Side Only**: The SERVICE_ROLE key should NEVER be exposed to client-side code
2. **Full Access**: This key bypasses Row Level Security (RLS) policies
3. **Environment Protection**: Ensure `.env.dev` is in `.gitignore`
4. **Production Keys**: Use different keys for development and production

### Current Implementation

The ProcurementAgentDB and related services run server-side in the deep-agents system, making SERVICE_ROLE key usage appropriate for:

- Database operations requiring elevated permissions
- Bypassing RLS for system operations
- Administrative tasks
- Background processes

## Testing

### Verification Script

A test script was created to verify the fix:

```bash
node test-procurement-db-connection.js
```

### Test Results

```
✅ Environment variables load correctly
✅ ProcurementAgentDB initializes successfully
✅ Supabase client created
✅ No fallback to in-memory storage
✅ Connection uses valid SERVICE_ROLE key
```

## Recommendations

### Immediate Actions

1. ✅ **COMPLETED**: Update all service files to use SERVICE_ROLE key first
2. ✅ **COMPLETED**: Fix environment file path resolution
3. 🔄 **RECOMMENDED**: Regenerate or update the ANON key in Supabase dashboard

### Future Improvements

1. **Key Rotation**: Implement regular API key rotation policy
2. **Monitoring**: Add logging for API key usage and failures
3. **Fallback Strategy**: Improve error handling when keys are invalid
4. **Documentation**: Keep this guide updated with any key changes

## Troubleshooting

### Common Issues

#### Issue: "Invalid API key" Error

**Symptoms:**
```
[PROCUREMENT_AGENT_DEBUG] [ProcurementAgentDB] Supabase connection test failed, 
falling back to in-memory storage: Invalid API key
```

**Solutions:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.dev`
2. Check the key hasn't expired in Supabase dashboard
3. Ensure environment file path is correct
4. Restart the server after making changes

#### Issue: Environment Variables Not Loading

**Symptoms:**
- `process.env.SUPABASE_URL` is `undefined`
- `process.env.SUPABASE_SERVICE_ROLE_KEY` is `undefined`

**Solutions:**
1. Verify `.env.dev` exists at project root
2. Check file path resolution in the service file
3. Ensure `dotenv` package is installed
4. Verify the `config()` call happens before accessing variables

#### Issue: Fallback to In-Memory Storage

**Symptoms:**
```
Fallback to memory: true
Supabase client exists: false
```

**Solutions:**
1. Check if API key is valid
2. Verify network connectivity to Supabase
3. Ensure the `procurement_agent_conversations` table exists
4. Check Supabase project status

## API Key Management

### Where to Find Keys

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mseizswoiwyewsidknta`
3. Navigate to: **Settings** → **API**
4. Copy the keys:
   - **Project URL**: `SUPABASE_URL`
   - **anon public**: `SUPABASE_ANON_KEY`
   - **service_role secret**: `SUPABASE_SERVICE_ROLE_KEY`

### Updating Keys

When updating keys in `.env.dev`:

1. Stop the server
2. Update the key value in `.env.dev`
3. Clear any cached environment variables
4. Restart the server
5. Run the test script to verify

## Related Documentation

- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security (RLS) Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Environment Variables Best Practices](../procedures/ENVIRONMENT_CONFIGURATION.md)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-27 | Initial documentation after fixing API key issue | System |
| 2026-02-27 | Updated all service files to use SERVICE_ROLE key | System |
| 2026-02-27 | Fixed environment file path resolution | System |

## Contact

For issues related to Supabase API keys:
1. Check this documentation first
2. Run the test script: `node test-procurement-db-connection.js`
3. Review server logs for specific error messages
4. Check Supabase dashboard for project status

---

**Last Updated**: February 27, 2026  
**Status**: ✅ Issue Resolved  
**Next Review**: When rotating API keys or updating Supabase configuration
