# Workflows System - Test Plan

**Phase 1 Completion: Workflows System Implementation**  
**Date:** January 29, 2026  
**Status:** Ready for Testing

---

## Overview

This document outlines the test plan for the Workflows System implementation (Phase 1). The system includes:

1. **Backend APIs** (`server/src/routes/workflows-routes.js`)
2. **Authorization Middleware** (`server/src/middleware/workflowAuthMiddleware.js`)
3. **Database Schema** (`database/migrations/add_workflow_tables.sql`)
4. **Frontend Components** (`client/src/pages/02050-development-console/components/tabs/WorkflowsTab.js`)
5. **Standalone Actions Config** (`client/src/config/standalone-actions.config.js`)

---

## Prerequisites

### Required Infrastructure

1. **Database Schema Applied**
   ```bash
   # Run the migration script
   node server/scripts/initialize-workflow-metadata.js
   ```

2. **Environment Variables**
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `NODE_ENV` - Environment (development/production)

3. **User Authentication**
   - Users must be logged in to access workflows
   - JWT token must be present in localStorage

---

## Test Categories

### 1. Database Schema Tests

#### 1.1 Table Creation
**Objective:** Verify all tables are created correctly

**Test Cases:**
- [ ] `workflow_metadata` table exists with correct columns
- [ ] `workflow_executions` table exists with correct columns
- [ ] `execution_audit_log` table exists with correct columns
- [ ] All tables have proper indexes
- [ ] Row-level security policies are enabled

**Expected Results:**
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('workflow_metadata', 'workflow_executions', 'execution_audit_log');

-- Check columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workflow_metadata';
```

#### 1.2 RLS Policies
**Objective:** Verify Row-Level Security is configured correctly

**Test Cases:**
- [ ] Users can view their own workflow executions
- [ ] Developers can view all workflow executions
- [ ] Users can insert their own workflow executions
- [ ] Users can update their own workflow executions

**Expected Results:**
```sql
-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('workflow_executions', 'execution_audit_log');

-- Check policies
SELECT polname, polcmd, polpermissive, polroles, polqual
FROM pg_policy 
WHERE polrelid IN (
  SELECT oid FROM pg_class WHERE relname IN ('workflow_executions', 'execution_audit_log')
);
```

#### 1.3 Metadata Initialization
**Objective:** Verify workflow metadata is populated

**Test Cases:**
- [ ] Script runs without errors
- [ ] 7 workflows are inserted into `workflow_metadata`
- [ ] Workflows have correct RBAC properties

**Expected Results:**
```sql
SELECT COUNT(*) FROM workflow_metadata;
-- Should return 7

SELECT name, title, category, access_level, scope 
FROM workflow_metadata 
ORDER BY category, title;
```

---

### 2. Backend API Tests

#### 2.1 Authentication & Authorization
**Objective:** Verify API endpoints require authentication and enforce RBAC

**Test Cases:**

**Endpoint:** `GET /api/workflows`
- [ ] Unauthenticated requests return 401
- [ ] Authenticated developer sees all workflows
- [ ] Authenticated discipline user sees filtered workflows
- [ ] Discipline user cannot see developer-only workflows

**Endpoint:** `GET /api/workflows/:name`
- [ ] Unauthenticated requests return 401
- [ ] Developer can access all workflows
- [ ] Discipline user can access allowed workflows
- [ ] Discipline user cannot access developer-only workflows
- [ ] Discipline user cannot access cross-discipline workflows

**Endpoint:** `POST /api/workflows/:name/execute`
- [ ] Unauthenticated requests return 401
- [ ] Developer can execute all workflows
- [ ] Discipline user can execute allowed workflows
- [ ] Discipline user cannot execute developer-only workflows
- [ ] Invalid parameters return 400

**Endpoint:** `GET /api/workflows/executions/:id/status`
- [ ] Users can only see their own executions
- [ ] Developers can see all executions
- [ ] Execution includes logs and duration

**Endpoint:** `GET /api/workflows/executions/history`
- [ ] Users see only their execution history
- [ ] Developers see all execution history
- [ ] Pagination works (limit, offset)
- [ ] Filtering works (status, filter)

**Endpoint:** `DELETE /api/workflows/executions/:id`
- [ ] Users can only cancel their own executions
- [ ] Users cannot cancel completed/failed executions
- [ ] Developers can cancel any execution

#### 2.2 Parameter Validation
**Objective:** Verify workflow parameters are validated correctly

**Test Cases:**
- [ ] Required parameters must be provided
- [ ] Parameter types are validated (string, number, boolean)
- [ ] Regex validation works for parameters with validation pattern
- [ ] Options validation works for select parameters
- [ ] Invalid parameters return 400 with error details

**Example Test:**
```javascript
// Test add-chatbot-to-page workflow
POST /api/workflows/add-chatbot-to-page/execute
Body: {
  "parameters": {
    "page-slug": "invalid-slug-123" // Should fail validation
  }
}
// Expected: 400 with error message
```

#### 2.3 Execution Flow
**Objective:** Verify workflow execution completes successfully

**Test Cases:**
- [ ] Execution starts and returns execution ID
- [ ] Execution status updates from 'running' to 'completed'
- [ ] Execution logs are recorded in audit log
- [ ] Workflow metadata is updated (last_run, success_rate)

**Test Execution Flow:**
```javascript
// 1. Start execution
POST /api/workflows/add-chatbot-to-page/execute
Body: {"parameters": {"page-slug": "01900-procurement"}}
Response: {"executionId": "exec_123", "status": "running"}

// 2. Poll status
GET /api/workflows/executions/exec_123/status
Response: {
  "status": "completed",
  "logs": [...],
  "duration": 2000
}

// 3. Check audit log
GET /api/workflows/executions/history
// Should show the execution
```

#### 2.4 Error Handling
**Objective:** Verify proper error responses

**Test Cases:**
- [ ] Non-existent workflow returns 404
- [ ] Workflow execution failure updates status to 'failed'
- [ ] Error messages are logged to audit table
- [ ] Execution timeouts are handled

---

### 3. Frontend Component Tests

#### 3.1 WorkflowsTab Component
**Objective:** Verify UI renders correctly and responds to user interactions

**Test Cases:**
- [ ] Component loads without errors
- [ ] Loading spinner appears while fetching workflows
- [ ] Workflow cards are displayed correctly
- [ ] Search filter works
- [ ] Category filter works
- [ ] Workflow metadata is displayed (category, access level, scope)
- [ ] "Run" button appears on workflow cards
- [ ] Execution modal opens when clicking "Run"
- [ ] Parameter input fields are rendered correctly
- [ ] Execute button is enabled/disabled based on validation

**Expected UI Elements:**
- Header with title and user role
- Search bar with icon
- Category dropdown
- Workflow cards with:
  - Title and category chip
  - Description
  - Access level and scope chips
  - Last run time and success rate
  - "Run" button
- Execution modal with parameter inputs
- Progress modal with logs
- History modal with execution table

#### 3.2 Parameter Modal
**Objective:** Verify parameter input modal works correctly

**Test Cases:**
- [ ] Modal opens with workflow information
- [ ] Parameter fields are rendered based on workflow metadata
- [ ] Required parameters are marked
- [ ] Type-specific inputs appear (text field, select, multi-select)
- [ ] Validation messages appear for invalid input
- [ ] Execute button is disabled if required parameters are missing
- [ ] Cancel button closes modal without executing

#### 3.3 Progress Modal
**Objective:** Verify execution progress tracking

**Test Cases:**
- [ ] Modal opens after workflow execution starts
- [ ] Polling starts automatically
- [ ] Status updates in real-time
- [ ] Logs are displayed as they arrive
- [ ] "Cancel Execution" button appears while running
- [ ] Clicking cancel stops the execution
- [ ] Modal closes when execution completes

#### 3.4 History View
**Objective:** Verify execution history display

**Test Cases:**
- [ ] History modal opens when clicking history icon
- [ ] Executions are loaded from API
- [ ] Loading spinner appears while loading
- [ ] Table displays all execution data correctly
- [ ] Status chips are colored appropriately
- [ ] Duration is calculated correctly
- [ ] Empty state appears when no history exists

#### 3.5 Role-Based UI Filtering
**Objective:** Verify UI respects user permissions

**Test Cases:**
- [ ] Developer sees all workflows (including developer-only)
- [ ] Discipline user sees only allowed workflows
- [ ] Discipline user cannot see developer-only workflows
- [ ] Developer-only workflows show appropriate badge
- [ ] "Run" button is disabled for workflows user cannot execute

---

### 4. Integration Tests

#### 4.1 Complete User Flow (Discipline User)
**Objective:** End-to-end test from login to execution

**Test Steps:**
1. Login as discipline user (e.g., user from discipline 01900)
2. Navigate to Development Console
3. Click Workflows tab
4. Verify only allowed workflows are visible
5. Search for "add-chatbot-to-page"
6. Click "Run" on the workflow card
7. Enter valid page slug (e.g., "01900-procurement")
8. Click "Execute Workflow"
9. Monitor progress in modal
10. View execution in history
11. Verify execution is recorded in database

**Expected Result:**
- All steps complete successfully
- Execution appears in user's history
- No errors in console

#### 4.2 Complete User Flow (Developer)
**Objective:** End-to-end test with full permissions

**Test Steps:**
1. Login as developer
2. Navigate to Development Console
3. Click Workflows tab
4. Verify all workflows are visible (including developer-only)
5. Search for "create-new-workflow"
6. Click "Run" on the workflow card
7. Enter workflow name
8. Click "Execute Workflow"
9. Monitor execution
10. View execution in history (should see all users' executions)

**Expected Result:**
- All steps complete successfully
- Execution appears in history
- Can view executions from all users

#### 4.3 Concurrent Execution
**Objective:** Test multiple simultaneous executions

**Test Steps:**
1. Login as developer
2. Start 3 different workflow executions in parallel
3. Monitor all progress modals
4. Check execution history

**Expected Result:**
- All executions run independently
- No interference between executions
- All executions appear in history

---

### 5. Performance Tests

#### 5.1 API Response Times
**Objective:** Verify API endpoints respond within acceptable time

**Test Cases:**
- [ ] `GET /api/workflows` < 500ms
- [ ] `GET /api/workflows/:name` < 300ms
- [ ] `POST /api/workflows/:name/execute` < 500ms (including execution start)
- [ ] `GET /api/workflows/executions/:id/status` < 200ms
- [ ] `GET /api/workflows/executions/history` < 1000ms (with 50 entries)

**Testing Tools:**
- Browser DevTools Network tab
- Postman/Insomnia with timing
- Custom performance test script

#### 5.2 Database Query Performance
**Objective:** Verify database queries are optimized

**Test Cases:**
- [ ] Workflow metadata query uses indexes
- [ ] Execution history query is paginated
- [ ] Audit log queries are indexed
- [ ] No N+1 query problems

**Expected SQL Performance:**
```sql
-- Check query plan
EXPLAIN ANALYZE 
SELECT * FROM workflow_executions 
WHERE user_id = 'test-user' 
ORDER BY created_at DESC 
LIMIT 50;
-- Should use index on user_id and created_at
```

#### 5.3 Frontend Performance
**Objective:** Verify frontend performance is acceptable

**Test Cases:**
- [ ] Component renders in < 100ms
- [ ] Search filter responds instantly
- [ ] Workflow cards load efficiently
- [ ] No memory leaks in polling

**Testing Tools:**
- React DevTools Profiler
- Chrome Performance tab
- Lighthouse audit

---

### 6. Security Tests

#### 6.1 Authentication Bypass
**Objective:** Verify endpoints cannot be accessed without authentication

**Test Cases:**
- [ ] All API endpoints return 401 without token
- [ ] Invalid token returns 401
- [ ] Expired token returns 401
- [ ] Malformed token returns 401

#### 6.2 Authorization Bypass
**Objective:** Verify RBAC cannot be bypassed

**Test Cases:**
- [ ] Discipline user cannot access developer-only workflows
- [ ] Discipline user cannot access cross-discipline workflows
- [ ] User cannot view other users' execution history
- [ ] User cannot cancel other users' executions
- [ ] No SQL injection through parameters
- [ ] No XSS in workflow names/descriptions

**Security Tools:**
- OWASP ZAP
- Custom security test scripts

#### 6.3 Data Validation
**Objective:** Verify all inputs are validated

**Test Cases:**
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are blocked
- [ ] Extremely long inputs are rejected
- [ ] Special characters in parameters are handled correctly
- [ ] Parameter type validation works

---

### 7. Browser Compatibility Tests

**Test Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Test Cases:**
- [ ] Workflow tab loads correctly
- [ ] Modals display properly
- [ ] Search and filter work
- [ ] No console errors
- [ ] Responsive design works on different screen sizes

---

### 8. Regression Tests

**Test Cases:**
- [ ] Existing pages still load without errors
- [ ] Existing API endpoints still work
- [ ] User authentication still works
- [ ] Navigation to other pages works
- [ ] Other tabs in development console still work

---

## Test Execution Instructions

### 1. Setup Test Environment

```bash
# 1. Apply database migration
node server/scripts/initialize-workflow-metadata.js

# 2. Start server
cd server
npm run dev

# 3. Start frontend
cd ../client
npm run dev
```

### 2. Run Unit Tests (if any)
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd ../client
npm test
```

### 3. Run Integration Tests

```bash
# Run API tests using Postman/Insomnia
# Import collection from docs/tests/workflows-api-collection.json

# Or run custom test script
node docs/tests/run-workflow-tests.js
```

### 4. Manual Testing

Follow the test cases in the sections above, checking off each item as it passes.

---

## Test Results Template

### Summary

| Category | Tests Run | Passed | Failed | Skipped |
|----------|-----------|--------|--------|---------|
| Database | | | | |
| Backend API | | | | |
| Frontend UI | | | | |
| Integration | | | | |
| Performance | | | | |
| Security | | | | |
| **Total** | | | | |

### Failed Tests

| Test ID | Category | Description | Error | Priority |
|---------|----------|-------------|-------|----------|

### Known Issues

| Issue ID | Description | Workaround | Target Fix |
|----------|-------------|------------|------------|

---

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] All backend APIs are functional
- [ ] Frontend component renders without errors
- [ ] Users can execute workflows (at least one)
- [ ] Execution history is viewable
- [ ] RBAC is enforced
- [ ] No critical security vulnerabilities

### Full Implementation
- [ ] All test cases pass (90%+ pass rate)
- [ ] Performance requirements met
- [ ] Browser compatibility verified
- [ ] Security tests pass
- [ ] User acceptance testing passed
- [ ] Documentation complete

---

## Deployment Checklist

### Before Deployment
- [ ] All test cases pass
- [ ] Database migration script tested
- [ ] Environment variables configured
- [ ] Server routes registered
- [ ] Frontend components integrated
- [ ] Code review completed

### During Deployment
- [ ] Backup existing database
- [ ] Run migration script
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Verify API endpoints
- [ ] Test production environment

### After Deployment
- [ ] Monitor logs for errors
- [ ] Verify user access
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Bug fixes as needed

---

## Rollback Plan

If critical issues are found:
1. **Immediate**: Disable Workflows tab in UI
2. **Short-term**: Revert database changes (keep data)
3. **Long-term**: Fix issues and redeploy

**Rollback Steps:**
```sql
-- If needed, drop tables (preserves data)
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS execution_audit_log CASCADE;
-- Keep workflow_metadata for reference

-- Or roll back migration
-- (script to be created if needed)
```

---

## Next Steps

### Phase 1 Completion
1. **Test all components** using this plan
2. **Fix any issues** found during testing
3. **Update documentation** based on test results
4. **Deploy to staging** for user acceptance testing
5. **Deploy to production** after sign-off

### Phase 2 Planning
Once Phase 1 is complete and stable:
1. Begin implementation of Skills System
2. Plan UI integration with Workflows tab
3. Schedule user training

---

## Contacts

**Primary Developer**: [Your Name]  
**QA Lead**: [QA Team Member]  
**DevOps**: [DevOps Team Member]  
**Project Manager**: [PM Name]

---

**Document Version**: 1.0  
**Last Updated**: January 29, 2026  
**Status**: Ready for Testing