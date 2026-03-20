# Discipline Document Sections Debug Task List

## Issue Analysis
**Problem**: The `/api/discipline-document-sections` endpoint is failing with empty responses for multiple disciplines (01300, 01900, 00850, 02400, 00435) and contract types (po, wo, so, general).

**Root Cause**: The `discipline_document_sections` table does not exist in the database, causing all API calls to fail silently.

## Task List

### Phase 1: Database Investigation
- [ ] Check if `discipline_document_sections` table exists in Supabase
- [ ] Verify table schema matches the backend route expectations
- [ ] Check if sample data exists for test disciplines
- [ ] Verify RLS policies are configured correctly

### Phase 2: Database Creation
- [ ] Create `discipline_document_sections` table with proper schema
- [ ] Add foreign key constraints to disciplines table
- [ ] Set up indexes for performance
- [ ] Create RLS policies for data access

### Phase 3: Data Population
- [ ] Create seed data for disciplines 01300, 01900, 00850, 02400, 00435
- [ ] Add sample sections for each contract type (po, wo, so, general)
- [ ] Verify data integrity and relationships

### Phase 4: Backend Route Testing
- [ ] Test `/api/discipline-document-sections` endpoint directly
- [ ] Verify error handling and logging
- [ ] Check authentication headers and organization ID handling
- [ ] Test with different query parameters

### Phase 5: Frontend Integration
- [ ] Test `disciplineDocumentSectionsService.js` functions
- [ ] Verify error handling in the service
- [ ] Check if fallback logic works when no data exists
- [ ] Test UI components that depend on this data

### Phase 6: End-to-End Testing
- [ ] Test the full Document Ordering Management page
- [ ] Verify accordion navigation works correctly
- [ ] Check discipline filtering and contract type selection
- [ ] Test all procurement workflows

### Phase 7: Error Handling Enhancement
- [ ] Improve error messages in backend routes
- [ ] Add better error handling in frontend service
- [ ] Implement graceful degradation when sections are unavailable
- [ ] Add loading states and user feedback

## Expected Timeline
- **Phase 1-2**: 30 minutes (Database setup)
- **Phase 3**: 45 minutes (Data population)
- **Phase 4-5**: 30 minutes (Testing and integration)
- **Phase 6-7**: 30 minutes (Final testing and improvements)

**Total estimated time**: 2 hours

## Success Criteria
1. All API endpoints return proper data for test disciplines
2. Frontend loads document sections without errors
3. Document ordering management page functions correctly
4. Error handling provides meaningful feedback to users
5. System gracefully handles missing or empty data

## Files to Modify
1. **Database**: Create `discipline_document_sections` table
2. **Backend**: `/server/src/routes/discipline-document-sections-routes.js` (already exists)
3. **Frontend**: `/client/src/services/disciplineDocumentSectionsService.js` (already exists)
4. **Frontend**: `/client/src/pages/01900-procurement/components/document-ordering-management-page.js`
5. **Documentation**: Update debug plans and troubleshooting guides
