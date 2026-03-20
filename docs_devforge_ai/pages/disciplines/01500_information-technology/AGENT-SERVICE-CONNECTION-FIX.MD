# Agent Service Connection Fix

**Date**: 2026-01-22
**Status**: ✅ COMPLETED

## Problem
The client application was configured to connect to port 3001, but the real agent service (NO MOCKS policy) runs on port 3006, causing communication failures.

## Root Cause
In `client/src/App.js`, the Global Communication Manager was initialized with:
```javascript
serverUrl: 'http://localhost:3001' // Wrong port
```

## Solution
Updated `client/src/App.js` to connect to the correct agent service endpoint:
```javascript
serverUrl: 'http://localhost:3006' // Agent service endpoint (NO MOCKS)
```

## Changes Made

### 1. App.js Configuration Fix
**File**: `client/src/App.js`
**Line**: ~333 (in useEffect hook)

Changed from:
```javascript
await initializeGlobalCommunication({
  communication: {
    serverUrl: 'http://localhost:3001' // Changed to match webpack dev server port
  }
});
```

To:
```javascript
await initializeGlobalCommunication({
  communication: {
    serverUrl: 'http://localhost:3006' // Agent service endpoint (NO MOCKS)
  }
});
```

### 2. Client Rebuild
Rebuilt the client to apply the configuration change:
```bash
cd /Users/_PropAI/construct_ai/client && npm run build
```

## Verification Steps
1. ✅ Agent service running on port 3006 (confirmed via `node scripts/agent-service.js`)
2. ✅ Agent service health endpoint responding (confirmed via `/health`)
3. ✅ Updated App.js to connect to port 3006
4. ✅ Client rebuild completed successfully (webpack compiled successfully in 108707 ms)

## Expected Outcome
- Client will now connect to the real agent service on port 3006
- Agent communication should work without "Failed to connect" errors
- All chat functionality should work with the real agent service (NO MOCKS)

## Related Documentation
- `/Users/_PropAI/construct_ai/docs/procedures/02201_AGENT_SERVICE_SETUP_PROCEDURE.md`
- NO MOCK AGENTS policy is enforced

## Next Steps
1. Test agent communication in the browser
2. Verify chat sessions load correctly
3. Confirm messages are sent/received through agent service