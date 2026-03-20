# Render Deployment Fix

## Problem
The application was failing to deploy on Render with the following error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express' imported from /opt/render/project/src/server/src/index.js
```

## Root Cause
1. The root `package.json` didn't include the server dependencies (Express, etc.)
2. The deployment configuration was trying to run `cd server & npm start` but dependencies weren't being installed properly
3. Missing proper build and start commands for the deployment process

## Solution

### 1. Updated Root package.json
- **Main entry point**: Changed from `test-complete-flowise-integration.js` to `server.js`
- **Start command**: Changed from `./start-app.sh` to `node server.js`
- **Added server dependencies**: Included all dependencies from `server/package.json`:
  - `express: ^4.21.1`
  - `@supabase/supabase-js: ^2.45.6`
  - `body-parser: ^1.20.3`
  - `cors: ^2.8.5`
  - `multer: ^1.4.5-lts.1`
  - `n8n-mcp-server: ^0.1.0`
  - `pg: ^8.16.0`
  - And other required dependencies
- **Build command**: Added `npm run install:server && cd client && npm install && npm run build`
- **Install script**: Added `install:server` script to install server dependencies

### 2. Created render.yaml
```yaml
services:
  - type: web
    name: simandou-ai-bundle
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        generateValue: true
    healthCheckPath: /
```

### 3. Updated server.js
- Simplified to just import and start the server from `server/src/index.js`
- Removed export since the server starts automatically

### 4. Added .nvmrc
- Specified Node.js version 18 for consistent deployment environment

## Verification
- ✅ Build process completes successfully (`npm run build`)
- ✅ Server starts correctly and listens on the specified PORT
- ✅ All routes load and mount successfully
- ✅ Static files are served from the correct build directory
- ✅ Environment variables are properly loaded

## Deployment Process
1. Render will run `npm install` to install root dependencies
2. Build command will run `npm run build` which:
   - Installs server dependencies (`cd server && npm install`)
   - Installs client dependencies (`cd client && npm install`)
   - Builds the client application (`cd client && npm run build`)
3. Start command will run `npm start` which executes `node server.js`
4. Server starts and listens on the PORT provided by Render

## Key Changes Made
- **package.json**: Updated dependencies, scripts, and main entry point
- **render.yaml**: Added proper deployment configuration
- **server.js**: Simplified server startup
- **.nvmrc**: Added Node.js version specification

## Environment Variables Required on Render
Ensure these environment variables are set in your Render service:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY` (if needed)
- `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD` (for direct database access)
- Any other application-specific environment variables

## Module System Compatibility Fix

### Additional Issue Found
After fixing the initial Express dependency issue, a second problem emerged related to ES module compatibility:

**Error**: `Error [ERR_REQUIRE_ESM]: Cannot find package 'express' imported from /opt/render/project/src/server/src/index.js`

**Root Cause**: Multiple route files were importing from `server/app.cjs` (CommonJS) instead of `server/app.js` (ES module), causing module system conflicts.

### Additional Fixes Applied

1. **Removed conflicting CommonJS file**:
   - Deleted `server/app.cjs` to eliminate module resolution conflicts

2. **Fixed import statements in route files**:
   - `server/src/routes/section-creator.js`: Changed `import pkg from '../../app.cjs'` to `import { getCustomerConfig } from '../../app.js'`
   - `server/src/routes/organizations.js`: Same fix applied
   - `server/src/routes/sectors.js`: Same fix applied  
   - `server/src/routes/sector-management-routes.js`: Same fix applied

3. **Verified ES module consistency**:
   - All server files now use ES module syntax consistently
   - `server/package.json` has `"type": "module"` which is correct
   - All imports now use the proper ES module file (`app.js`)

## Verification Completed
- ✅ Build process works (`npm run build`)
- ✅ Server starts correctly and listens on specified PORT
- ✅ All routes load successfully without module errors
- ✅ Static files served from correct directory
- ✅ Environment variables loaded properly
- ✅ No ES module compatibility issues

## Next Steps
1. Commit and push these changes to your repository
2. Redeploy on Render - the deployment should now succeed
3. Verify that the application loads correctly in the browser
4. Test key functionality to ensure everything works in the production environment

## Files Modified in This Fix
- `package.json` - Updated dependencies and scripts
- `render.yaml` - Added deployment configuration
- `server.js` - Simplified server startup
- `.nvmrc` - Added Node.js version specification
- `server/src/routes/section-creator.js` - Fixed ES module imports
- `server/src/routes/organizations.js` - Fixed ES module imports
- `server/src/routes/sectors.js` - Fixed ES module imports
- `server/src/routes/sector-management-routes.js` - Fixed ES module imports
- Removed `server/app.cjs` - Eliminated module conflicts
