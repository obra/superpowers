# Procurement Document Assembly Test Data Guide

## Overview
This guide provides comprehensive test data and scenarios for testing the Procurement Document Assembly modal functionality. The test data covers various real-world scenarios including complete SOW assemblies, partial completions, and edge cases.

## Test Data Structure

### Core Entities
1. **Procurement Orders** - Main test orders with different completion states
2. **SOW Documents** - Scope of Work documents with appendices
3. **Tasks** - Appendix contribution tasks for team collaboration
4. **User Assignments** - Discipline and user assignments for appendices

### Test Scenarios

#### Scenario 1: Complete SOW Assembly (PO-TEST-001)
- **Order**: Heavy Equipment Procurement - Complete Assembly Test
- **SOW**: Heavy Equipment Procurement - Scope of Work
- **Status**: Fully completed with all 6 appendices
- **Use Case**: Test final document assembly and generation
- **Expected Outcome**: All appendices marked as complete, ready for final document compilation

#### Scenario 2: Partial SOW Assembly (PO-TEST-002)
- **Order**: Safety Equipment Procurement - Partial Assembly Test
- **SOW**: Safety Equipment Procurement - Scope of Work
- **Status**: 2 of 3 appendices completed (Engineering & Safety complete, Quality in progress)
- **Use Case**: Test assembly readiness validation and progress tracking
- **Expected Outcome**: Assembly blocked until Quality appendix completion

#### Scenario 3: No SOW Association (PO-TEST-003)
- **Order**: IT Equipment Procurement - No SOW Association
- **SOW**: None
- **Status**: Draft order without SOW template
- **Use Case**: Test orders without SOW requirements
- **Expected Outcome**: Standard procurement workflow without document assembly

#### Scenario 4: Service Order Assembly (SO-TEST-001)
- **Order**: Maintenance Services - Service Order Assembly Test
- **SOW**: Maintenance Services - Scope of Work
- **Status**: Fully completed with all 4 appendices
- **Use Case**: Test service order document assembly (different from purchase orders)
- **Expected Outcome**: Service-specific appendices assembled correctly

## Test Data Details

### Procurement Orders

| Order Number | Title | Order Type | SOW Status | Appendices Complete | Test Purpose |
|-------------|-------|------------|------------|-------------------|-------------|
| PO-TEST-001 | Heavy Equipment Procurement | Purchase | Complete | 6/6 | Full assembly workflow |
| PO-TEST-002 | Safety Equipment Procurement | Purchase | Partial | 2/3 | Assembly validation |
| PO-TEST-003 | IT Equipment Procurement | Purchase | None | N/A | Non-SOW orders |
| SO-TEST-001 | Maintenance Services | Service | Complete | 4/4 | Service order assembly |

### SOW Templates & Appendices

#### Heavy Equipment SOW (Complete)
- **Appendix A**: Technical Specifications (Engineering) - ✓ Complete
- **Appendix B**: Quality Requirements (Quality) - ✓ Complete
- **Appendix C**: Safety Standards (Safety) - ✓ Complete
- **Appendix D**: Installation Procedures (Engineering) - ✓ Complete
- **Appendix E**: Maintenance Requirements (Project Manager) - ✓ Complete
- **Appendix F**: Legal Terms (Legal) - ✓ Complete

#### Safety Equipment SOW (Partial)
- **Appendix A**: Technical Specifications (Engineering) - ✓ Complete
- **Appendix B**: Quality Requirements (Quality) - 🔄 In Progress
- **Appendix C**: Safety Standards (Safety) - ✓ Complete

#### Maintenance Services SOW (Complete)
- **Appendix A**: Service Specifications (Engineering) - ✓ Complete
- **Appendix B**: Quality Standards (Quality) - ✓ Complete
- **Appendix C**: Safety Protocols (Safety) - ✓ Complete
- **Appendix D**: Service Contracts (Legal) - ✓ Complete

## Testing Instructions

### Prerequisites
1. Development environment running on `http://localhost:3060`
2. Database populated with test data (run the SQL script `populate_procurement_test_data.sql` in Supabase SQL Editor)
3. User logged in with appropriate permissions

### Test Procedure

#### Step 1: Access Procurement Module
1. Navigate to `http://localhost:3060/#/purchase-orders`
2. Verify procurement orders page loads correctly
3. Confirm test orders are visible in the list:
   - PO-TEST-001: Heavy Equipment Procurement - Complete Assembly Test
   - PO-TEST-002: Safety Equipment Procurement - Partial Assembly Test
   - PO-TEST-003: IT Equipment Procurement - No SOW Association
   - SO-TEST-001: Maintenance Services - Service Order Assembly Test

#### Step 2: Test Complete Assembly (PO-TEST-001)
1. Click on "Heavy Equipment Procurement - Complete Assembly Test"
2. Open the Document Assembly modal
3. **Expected**: All 6 appendices show as "Complete" (green checkmarks)
4. **Expected**: "Generate Final Document" button is enabled
5. Click "Generate Final Document"
6. **Expected**: Document compilation process starts
7. **Expected**: Progress indicator shows assembly of all appendices
8. **Expected**: Final document download is available

#### Step 3: Test Partial Assembly (PO-TEST-002)
1. Click on "Safety Equipment Procurement - Partial Assembly Test"
2. Open the Document Assembly modal
3. **Expected**: Appendix A shows as "Complete", Appendix B shows as "In Progress"
4. **Expected**: "Generate Final Document" button is disabled
5. **Expected**: Warning message: "Document assembly blocked - 1 appendix incomplete"
6. Try to proceed with assembly
7. **Expected**: Action blocked with validation error

#### Step 4: Test Non-SOW Order (PO-TEST-003)
1. Click on "IT Equipment Procurement - No SOW Association"
2. Look for Document Assembly option
3. **Expected**: Document Assembly modal not available or shows "No SOW Template Assigned"
4. **Expected**: Standard procurement workflow available

#### Step 5: Test Service Order Assembly (SO-TEST-001)
1. Click on "Maintenance Services - Service Order Assembly Test"
2. Open the Document Assembly modal
3. **Expected**: All 4 service-specific appendices show as "Complete"
4. **Expected**: "Generate Service Agreement" button is enabled (different from purchase orders)
5. Click "Generate Service Agreement"
6. **Expected**: Service-specific document compilation
7. **Expected**: Final service agreement download available

### Advanced Testing Scenarios

#### User Assignment Testing
1. Switch to different user roles in development mode
2. Verify correct appendix assignments per user
3. Test task visibility and completion permissions

#### Progress Tracking
1. Mark Appendix B as complete in PO-TEST-002
2. Refresh Document Assembly modal
3. **Expected**: Assembly becomes available
4. **Expected**: Progress indicator updates correctly

#### Error Handling
1. Temporarily disconnect database
2. Try to open Document Assembly modal
3. **Expected**: Graceful error handling with user-friendly message
4. **Expected**: Retry functionality available

## Test Data Cleanup

After testing, run cleanup queries:
```sql
-- Delete test tasks (using UUIDs)
DELETE FROM tasks
WHERE business_object_id::text IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);

-- Delete test procurement orders
DELETE FROM procurement_orders
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);

-- Delete test SOW documents
DELETE FROM scope_of_work
WHERE id IN (
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777'
);

-- Delete test projects
DELETE FROM projects
WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
);
```

## Expected Performance Metrics

- Modal load time: < 2 seconds
- Appendix status updates: < 1 second
- Document generation: < 10 seconds for complete assemblies
- Progress indicator updates: Real-time (< 500ms)

## Troubleshooting

### Common Issues

1. **Test data not visible**
   - Check database connection
   - Verify `populate_procurement_test_data.js` ran successfully
   - Check for foreign key constraint errors

2. **Document Assembly modal not opening**
   - Verify order has SOW template assigned
   - Check user permissions for procurement module
   - Review browser console for JavaScript errors

3. **Assembly blocked unexpectedly**
   - Check appendix completion status in database
   - Verify task completion dates are current
   - Review user assignment mappings

4. **Document generation fails**
   - Check file system permissions for document storage
   - Verify template files exist
   - Review document compilation logs

### Debug Queries

```sql
-- Check test order status
SELECT id, title, sow_id, user_assignments FROM procurement_orders WHERE id LIKE 'test-%';

-- Check SOW appendix status
SELECT id, title, appendices FROM scope_of_work WHERE id LIKE 'test-%';

-- Check task completion status
SELECT id, title, status, business_object_id FROM tasks WHERE business_object_id LIKE 'test-%';
```

## Support Contacts

For test data issues:
- Database: Check `populate_procurement_test_data.js` execution logs
- Frontend: Review browser console and network tab
- Backend: Check server logs in `server/logs/`

## Version History

- **v1.0**: Initial test data setup for procurement document assembly
- **v1.1**: Added service order testing scenarios
- **v1.2**: Enhanced error handling and edge case coverage
