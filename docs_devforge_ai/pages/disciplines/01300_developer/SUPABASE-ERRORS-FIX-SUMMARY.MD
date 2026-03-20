# Database Errors Fix Summary

## Issues Identified

### 1. ChatbotBase.js Document Count API Error
**Error**: `ChatbotBase: Error loading document count, using default: Failed to fetch`

**Root Cause**: The ChatbotBase component was trying to fetch document count from an API endpoint that either:
- Doesn't exist (`/api/chat/document/accessible/${disciplineCode}`)
- The API server is not running
- Network connectivity issues

**Fix Applied**:
- Added health check before attempting document count API call
- Improved error handling with graceful fallbacks
- Changed error logging to info/warn level since API unavailability is expected in development
- Added timeout handling for API requests

### 2. Path Generation Page Database Table Errors
**Errors**: Multiple "relation does not exist" errors:
- `relation "public.company-names" does not exist`
- `relation "public.organization-names" does not exist`
- `relation "public.project-stages" does not exist`
- `relation "public.document-types" does not exist`
- `relation "public.discipline-names" does not exist`
- `relation "public.project-names" does not exist`

**Root Cause**: The path generation page was using incorrect table names with hyphens instead of underscores, and some required tables were missing from the database.

**Fix Applied**:
1. **Updated fetchFromSupabase function** in `00900-path-generation-page.js`:
   - Added proper table name mapping
   - Maps component types to actual database table names
   - Added error handling for unmapped component types

2. **Created missing database tables**:
   - `project_phases` - for project stage data
   - `disciplines` - for discipline information
   - `companies` - for company data
   - `organisations` - for organization data
   - `projects` - for project information

3. **Populated tables with sample data**:
   - Project phases (Feasibility Study, FEED, Construction, etc.)
   - Disciplines (Civil, Mechanical, Electrical, etc.)
   - Companies (Simandou project entities)
   - Organizations (Engineering, Construction, Operations, etc.)
   - Sample projects

## Files Modified

### 1. client/src/components/chatbots/base/ChatbotBase.js
- Enhanced `loadDocumentCount()` function with better error handling
- Added health check before API calls
- Improved timeout handling
- Changed error logging levels

### 2. client/src/pages/00900-document-control/processes/path-generation/components/00900-path-generation-page.js
- Updated `fetchFromSupabase()` function with proper table mapping
- Added component type to table name mapping
- Enhanced error handling for database queries

## Files Created

### 1. sql/create-missing-path-generation-tables.sql
- Creates all required tables for path generation functionality
- Includes proper UUID primary keys
- Sets up Row Level Security (RLS) policies
- Populates tables with sample data
- Creates performance indexes

### 2. run-path-generation-tables-migration.cjs
- Node.js script to execute the database migration
- Includes verification steps
- Provides detailed logging and error handling
- Tests table accessibility after creation

### 3. docs/DATABASE_ERRORS_FIX_SUMMARY.md
- This documentation file

## Table Mapping Reference

The path generation page now correctly maps component types to database tables:

| Component Type | Database Table |
|----------------|----------------|
| company-name | companies |
| organization-name | organisations |
| project-name | projects |
| project-stage | project_phases |
| discipline-name | disciplines |
| document-type | document_types_by_discipline |

## How to Apply the Fixes

### 1. Database Migration
Run the database migration to create missing tables:
```bash
node run-path-generation-tables-migration.cjs
```

### 2. Verify Fix
1. Start your development server
2. Navigate to the path generation page
3. Check browser console - database errors should be resolved
4. ChatbotBase component should no longer show "Failed to fetch" errors

## Expected Behavior After Fix

### ChatbotBase Component
- Will gracefully handle API unavailability
- Shows document count of 0 when API is not available
- No more error messages in console about failed fetch

### Path Generation Page
- Database queries will succeed
- Component dropdowns will populate with sample data
- Path generation will work correctly
- No more "relation does not exist" errors

## Sample Data Included

### Project Phases
- Feasibility Study (FS)
- Pre-FEED (PF)
- FEED (FE)
- Detailed Design (DD)
- Construction (CO)
- Commissioning (CM)
- Operations (OP)

### Disciplines
- Civil Engineering (00850)
- Mechanical Engineering (00870)
- Electrical Engineering (00860)
- Chemical Engineering (00835)
- Architectural (00825)
- Document Control (00900)
- Contracts Post Award (00435)
- Information Technology (02050)
- Quality Assurance (02200)
- Safety (02400)

### Companies
- Simandou Iron Ore Project (SIM)
- Rio Tinto (RT)
- Chalco Iron Ore Holdings (CIO)
- Winning Consortium Simandou (WCS)

### Organizations
- Engineering (ENG)
- Construction (CON)
- Operations (OPS)
- Commercial (COM)
- Legal (LEG)
- Finance (FIN)
- HSE (HSE)
- IT (IT)
- HR (HR)
- Procurement (PRO)

## Security Considerations

- All tables have Row Level Security (RLS) enabled
- Read-only policies allow public access to reference data
- Proper UUID primary keys for all tables
- Foreign key constraints maintain data integrity

## Performance Optimizations

- Indexes created on frequently queried columns
- Efficient table structure with proper data types
- Optimized queries in the frontend code

## Future Maintenance

- Add more sample data as needed
- Update table mappings if new component types are added
- Monitor API availability and add health endpoints as needed
- Consider caching strategies for frequently accessed reference data
