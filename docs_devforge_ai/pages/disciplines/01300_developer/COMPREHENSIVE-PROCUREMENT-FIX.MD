# Comprehensive Procurement Order Schema Fix

**Date:** 2025-12-05
**Status:** 🔧 PENDING

## Issues Identified

### 1. Missing Database Columns
The frontend code sends these fields, but they don't exist in the database:
- `approval_config` (JSONB)
- `discipline_assignments` (JSONB) 
- `user_assignments` (JSONB)
- `sow_template_id` (UUID)

### 2. Organization Users Query Issues
- Nested relationship queries failing: `user:user_id` and `discipline:discipline_id`
- PostgREST can't find relationships in schema cache

### 3. Schema Cache Errors
- PGRST204: "Could not find column"
- Root cause: Code sends fields that don't exist in database schema

---

## Fixes Applied

### 1. ✅ Database Migration Created
**File:** `add_missing_procurement_columns.sql`

```sql
ALTER TABLE procurement_orders 
ADD COLUMN IF NOT EXISTS sow_template_id UUID,
ADD COLUMN IF NOT EXISTS approval_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS discipline_assignments JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_assignments JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX idx_procurement_orders_approval_config 
ON procurement_orders USING GIN (approval_config);

CREATE INDEX idx_procurement_orders_discipline_assignments 
ON procurement_orders USING GIN (discipline_assignments);

CREATE INDEX idx_procurement_orders_user_assignments 
ON procurement_orders USING GIN (user_assignments);
```

### 2. ✅ Organization Users Query Fixed
**File:** `CreateOrderModal.jsx`

**Before:** Single query with nested joins (fails)
```javascript
const { data, error } = await supabaseClient
  .from('organization_users')
  .select(`
    user:user_id (id, email, first_name, last_name),
    discipline:discipline_id (id, name, code)
  `)
  // ... filters
```

**After:** Multiple separate queries (works)
```javascript
// 1. Get organization users
const { data: orgUsers } = await supabaseClient
  .from('organization_users')
  .select('user_id, role, discipline_id')
  // ... filters

// 2. Get user details
const userIds = [...new Set(orgUsers.map(u => u.user_id))];
const { data: users } = await supabaseClient
  .from('user_profiles')
  .select('user_id, email, first_name, last_name')
  .in('user_id', userIds);

// 3. Get discipline details
const { data: disciplines } = await supabaseClient
  .from('disciplines')
  .select('id, name, code')
  .in('id', disciplineIds);

// 4. Combine data
const combinedUsers = orgUsers.map(orgUser => {
  const user = users?.find(u => u.user_id === orgUser.user_id);
  const discipline = disciplines?.find(d => d.id === orgUser.discipline_id);
  return { ...(user || {}), discipline, role: orgUser.role };
});
```

---

## How to Apply This Fix

### Step 1: Run Database Migration
```bash
# Apply the migration to add missing columns
psql -h your-host -d your-db -f add_missing_procurement_columns.sql
```

### Step 2: Restart Application
```bash
# Restart the development server
npm run dev
# or
npm start
```

### Step 3: Clear Browser Cache
Clear browser cache and reload the application.

---

## Testing

After applying fixes, test:

1. **User Loading:** 
   - Create a new order
   - Assign disciplines in Phase 3
   - Should load users without relationship errors

2. **Order Creation:**
   - Complete all 5 phases
   - Submit the order
   - Should create successfully without schema cache errors

3. **Check Browser Console:**
   - No "Could not find relationship" errors
   - No "Could not find column" errors
   - Clean console logs

---

## Root Cause Analysis

The issues stem from:

1. **Schema Evolution Mismatch:**
   - Frontend evolved faster than database schema
   - New features added without corresponding schema updates

2. **PostgREST Relationship Issues:**
   - Foreign key relationships not properly established
   - Schema cache not refreshed after schema changes

3. **Nested Query Limitations:**
   - PostgREST doesn't support all nested join patterns
   - Complex relationships require separate queries

---

## Prevention Measures

### 1. Schema-First Development
- Update database schema before adding frontend features
- Run automated schema validation

### 2. Relationship Testing
- Test all nested queries in isolation
- Verify foreign key constraints exist

### 3. Schema Documentation
- Keep database schema synchronized with code documentation
- Use consistent naming conventions (snake_case for DB)

### 4. Automated Validation
- Add CI/CD checks for schema consistency
- Validate frontend fields against database schema

---

## Files Modified/Created

1. **add_missing_procurement_columns.sql** - Database migration
2. **CreateOrderModal.jsx** - Fixed query structure
3. **comprehensive_procurement_audit.cjs** - This audit script

---

## Next Steps

1. ✅ Apply database migration
2. ✅ Restart application  
3. ✅ Test all functionality
4. 🔄 Monitor for any remaining schema issues
5. 🔄 Consider adding schema validation to development process

---

## Troubleshooting

If issues persist after applying fixes:

1. **Check PostgREST Cache:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

2. **Verify Foreign Keys:**
   ```sql
   SELECT constraint_name, table_name, column_name 
   FROM information_schema.key_column_usage 
   WHERE table_name = 'organization_users';
   ```

3. **Test Queries Individually:**
   - Test each query separately
   - Check table structure matches expectations

---

This fix addresses the fundamental schema mismatch issues that were causing the procurement order creation to fail.
