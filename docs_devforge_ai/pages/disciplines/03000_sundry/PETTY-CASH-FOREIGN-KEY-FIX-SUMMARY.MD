# Petty Cash Foreign Key Constraint Fix Summary

## Problem Description

**Error**: `insert or update on table "petty_cash" violates foreign key constraint "petty_cash_user_id_fkey"`

**Detail**: `Key (user_id)=(11111111-1111-1111-1111-111111111111) is not present in table "users"`

## Root Cause Analysis

The issue was a **foreign key constraint mismatch** in the petty cash system:

1. **Schema Mismatch**: The `petty_cash` table was created with foreign key constraints pointing to `auth.users(id)`, but the system actually uses a `user_management` table for user data.

2. **Missing Test Data**: The test data script was trying to insert user IDs that didn't exist in the referenced table.

3. **Wrong Table Reference**: The foreign keys should reference `user_management(user_id)` instead of `auth.users(id)`.

## Files Modified

### 1. `sql/create_petty_cash_table.sql`
**Changes Made**:
- Updated foreign key constraint: `user_id UUID REFERENCES auth.users(id)` → `user_id UUID REFERENCES user_management(user_id)`
- Updated foreign key constraint: `approver_id UUID REFERENCES auth.users(id)` → `approver_id UUID REFERENCES user_management(user_id)`

### 2. `sql/populate_user_management_test_data.sql` (NEW FILE)
**Purpose**: Creates the required test users in the `user_management` table
**Content**:
- 7 test employees with various roles and departments
- 2 test managers/approvers for approval workflows
- Complete user profiles with South African contact information
- Proper role assignments for petty cash system testing

### 3. `sql/00_MASTER_SQL_EXECUTION_SEQUENCE.sql`
**Changes Made**:
- Added Step 0: User Management Test Data population
- Updated execution order to ensure users exist before creating petty cash records
- Updated comments and documentation

## Technical Details

### Foreign Key Constraints Fixed
```sql
-- BEFORE (INCORRECT)
user_id UUID REFERENCES auth.users(id)
approver_id UUID REFERENCES auth.users(id)

-- AFTER (CORRECT)
user_id UUID REFERENCES user_management(user_id)
approver_id UUID REFERENCES user_management(user_id)
```

### User Test Data Structure
```sql
-- 9 total test users created:
-- Regular Employees (7):
'11111111-1111-1111-1111-111111111111' - John Smith (Project Manager)
'22222222-2222-2222-2222-222222222222' - Jane Doe (Site Supervisor)
'33333333-3333-3333-3333-333333333333' - Mike Johnson (Senior Engineer)
'44444444-4444-4444-4444-444444444444' - Sarah Wilson (Administrative Assistant)
'55555555-5555-5555-5555-555555555555' - Robert Brown (Maintenance Technician)
'66666666-6666-6666-6666-666666666666' - Lisa Garcia (Architect)
'77777777-7777-7777-7777-777777777777' - David Lee (Logistics Coordinator)

-- Managers/Approvers (2):
'88888888-8888-8888-8888-888888888888' - Alice Manager (Operations Manager)
'99999999-9999-9999-9999-999999999999' - Brian Finance (Finance Manager)
```

## Updated Execution Order

**CRITICAL**: Execute SQL files in this exact order:

1. **Step 0**: `populate_user_management_test_data.sql` ← **NEW FIRST STEP**
2. **Step 1**: `create_petty_cash_table.sql`
3. **Step 2**: `populate_petty_cash_test_data.sql`
4. **Step 3**: `create_approval_system_tables.sql`
5. **Step 4**: `populate_approval_system_test_data.sql`
6. **Step 5**: `legacy_system_extensions.sql`

## Verification Steps

After applying the fix, verify the solution:

```sql
-- 1. Check that test users exist
SELECT COUNT(*) FROM user_management 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '88888888-8888-8888-8888-888888888888'
);
-- Expected result: 2 (or 9 if all test users created)

-- 2. Verify petty cash foreign key constraints
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'petty_cash' AND constraint_name LIKE '%fkey%';
-- Expected: References should point to user_management table

-- 3. Test inserting petty cash record (should work now)
INSERT INTO petty_cash (user_id, date, amount, category, description) 
VALUES ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 50.00, 'office-supplies', 'Test insert');
-- Expected: Success (no foreign key violation)
```

## Resolution Summary

✅ **Fixed Foreign Key References**: Changed from `auth.users` to `user_management`
✅ **Created Required Test Users**: 9 users with proper roles and data
✅ **Updated Execution Order**: Added mandatory Step 0 for user data
✅ **Comprehensive Documentation**: Updated all relevant files and sequences

## IMMEDIATE FIX REQUIRED

**The error persists because the existing `petty_cash` table still has the old foreign key constraints.**

### Quick Fix Steps (Execute in this exact order):

1. **Run the Fix Script** (drops and recreates table with correct constraints):
   ```bash
   psql -d your_database -f sql/fix_petty_cash_constraints.sql
   ```

2. **Create Test Users**:
   ```bash
   psql -d your_database -f sql/populate_user_management_test_data.sql
   ```

3. **Populate Test Data**:
   ```bash
   psql -d your_database -f sql/populate_petty_cash_test_data.sql
   ```

### Alternative Manual Fix:
If you prefer to run SQL commands directly:

```sql
-- 1. Drop existing table with wrong constraints
DROP TABLE IF EXISTS petty_cash CASCADE;

-- 2. Create test users (run populate_user_management_test_data.sql)

-- 3. Create new table with correct constraints (run create_petty_cash_table.sql)

-- 4. Add test data (run populate_petty_cash_test_data.sql)
```

### Files Created to Fix This Issue:
- `sql/fix_petty_cash_constraints.sql` - Complete fix script (run this first)
- `sql/populate_user_management_test_data.sql` - Creates required test users
- Updated `sql/create_petty_cash_table.sql` - Fixed constraints for future use

The error will be resolved once the old table is dropped and recreated with the correct foreign key constraints pointing to `user_management` instead of `users`.
