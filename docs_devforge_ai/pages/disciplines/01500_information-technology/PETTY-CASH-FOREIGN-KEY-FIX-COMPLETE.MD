# Petty Cash Foreign Key Constraint Fix - Complete Solution

## Problem Summary

The petty cash system was experiencing a foreign key constraint violation:

```
ERROR: 23503: insert or update on table "petty_cash" violates foreign key constraint "petty_cash_user_id_fkey"
DETAIL: Key (user_id)=(11111111-1111-1111-1111-111111111111) is not present in table "users".
```

**Root Cause:** The petty cash table's foreign key constraints were incorrectly pointing to a non-existent `users` table instead of the correct `user_management` table.

## Solution Overview

Created a comprehensive fix that:
1. ✅ Drops incorrect foreign key constraints pointing to `users` table
2. ✅ Adds correct foreign key constraints pointing to `user_management` table  
3. ✅ Provides verification queries to confirm the fix
4. ✅ Updates the master execution sequence
5. ✅ Ensures all test data is consistent

## Files Created/Updated

### 1. `sql/fix_petty_cash_user_constraints.sql` - **NEW**
**Purpose:** Fixes foreign key constraints to point to correct table

**What it does:**
- Safely drops any incorrect constraints pointing to `users` table
- Adds correct constraints pointing to `user_management` table
- Provides verification queries to confirm the fix
- Uses safe error handling to prevent script failures

### 2. `sql/00_MASTER_SQL_EXECUTION_SEQUENCE.sql` - **UPDATED**
**Added:** Step 1A for the foreign key constraint fix
**New execution order:**
1. `populate_user_management_test_data.sql` (User Management Test Data - REQUIRED FIRST)
2. `create_petty_cash_table.sql` (Petty Cash Schema)
3. **`fix_petty_cash_user_constraints.sql`** ⬅️ **NEW STEP**
4. `populate_petty_cash_test_data.sql` (Petty Cash Test Data)
5. `create_approval_system_tables.sql` (Enterprise Approval Schema)  
6. `populate_approval_system_test_data.sql` (Enterprise Approval Test Data)
7. `legacy_system_extensions.sql` (Legacy System Integration Support)

## How to Apply the Fix

### Option 1: Run the Fix Script Only (Recommended)
If your petty cash table already exists but has constraint issues:

```sql
-- Execute the fix script
\i sql/fix_petty_cash_user_constraints.sql
```

### Option 2: Full System Setup
If setting up from scratch, follow the master execution sequence:

```sql
-- Execute in order:
\i sql/populate_user_management_test_data.sql
\i sql/create_petty_cash_table.sql
\i sql/fix_petty_cash_user_constraints.sql
\i sql/populate_petty_cash_test_data.sql
-- ... continue with remaining steps
```

## User Data Verification

✅ **All required users exist in user_management table:**

| User ID | Name | Role | Used In Test Data |
|---------|------|------|------------------|
| 11111111-1111-1111-1111-111111111111 | John Smith | employee | ✅ Yes |
| 22222222-2222-2222-2222-222222222222 | Jane Doe | employee | ✅ Yes |
| 33333333-3333-3333-3333-333333333333 | Mike Johnson | employee | ✅ Yes |
| 44444444-4444-4444-4444-444444444444 | Sarah Wilson | employee | ✅ Yes |
| 55555555-5555-5555-5555-555555555555 | Robert Brown | employee | ✅ Yes |
| 66666666-6666-6666-6666-666666666666 | Lisa Garcia | employee | ✅ Yes |
| 77777777-7777-7777-7777-777777777777 | David Lee | employee | ✅ Yes |
| 88888888-8888-8888-8888-888888888888 | Alice Manager | manager | ✅ Yes (Approver) |
| 99999999-9999-9999-9999-999999999999 | Brian Finance | finance_admin | ✅ Yes (Approver) |

## Technical Details

### Foreign Key Constraints Fixed

**Before (Incorrect):**
```sql
petty_cash_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
petty_cash_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES users(id)
```

**After (Correct):**
```sql
petty_cash_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_management(user_id)
petty_cash_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES user_management(user_id)
```

### Schema Alignment

The petty cash table schema in `create_petty_cash_table.sql` was already correct:
```sql
user_id UUID REFERENCES user_management(user_id),
approver_id UUID REFERENCES user_management(user_id),
```

The issue was that the constraints got created incorrectly during deployment.

## Verification

After running the fix, verify with:

```sql
-- Check foreign key constraints are correct
SELECT 
    tc.constraint_name,
    kcu.column_name,
    tc2.table_name as referenced_table,
    kcu2.column_name as referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.table_constraints tc2 ON rc.unique_constraint_name = tc2.constraint_name
JOIN information_schema.key_column_usage kcu2 ON tc2.constraint_name = kcu2.constraint_name
WHERE tc.table_name = 'petty_cash' 
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name IN ('user_id', 'approver_id');
```

Expected output:
```
constraint_name               | column_name | referenced_table | referenced_column
petty_cash_user_id_fkey      | user_id     | user_management  | user_id
petty_cash_approver_id_fkey  | approver_id | user_management  | user_id
```

## Test After Fix

Once the constraints are fixed, test by running:

```sql
-- Should now work without foreign key errors
\i sql/populate_petty_cash_test_data.sql
```

Expected result: 20 petty cash test records created successfully.

## Prevention

To prevent this issue in the future:
1. Always run user_management test data FIRST
2. Verify foreign key constraints point to correct tables
3. Use the master execution sequence for consistent deployment
4. Test foreign key relationships before populating test data

## Status: COMPLETE ✅

This fix resolves the foreign key constraint violation and ensures the petty cash system can successfully insert test data with proper referential integrity to the user_management table.
