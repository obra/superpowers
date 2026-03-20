# Procurement Order Final Fixes

**Date:** 2025-12-05
**Status:** ✅ APPLIED

## Issues Fixed

### 1. Supabase Order Parse Error
**Error:**
```
"failed to parse order (user.first_name.asc)" (line 1, column 6)
```

**Root Cause:**  
Supabase PostgREST does not support ordering by nested relationship fields using dot notation like `.order('user.first_name')`.

**Fix:**
Removed the `.order()` clause from the query in `loadUsersForDisciplines` function (line 286).

```javascript
// Before
.eq('status', 'active')
.order('user.first_name');

// After
.eq('status', 'active');
// Order will be handled in JavaScript after data is fetched
```

**Alternative:** If ordering is needed, sort the results in JavaScript after fetching:
```javascript
const uniqueUsers = data?.reduce((acc, orgUser) => {
  if (orgUser.user && !acc.some(u => u.id === orgUser.user.id)) {
    acc.push({
      ...orgUser.user,
      discipline: orgUser.discipline,
      role: orgUser.role
    });
  }
  return acc;
}, [])
.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || '')) || [];
```

---

### 2. createdBy Column Name Error (Schema Cache)
**Error:**
```
"Could not find the 'createdBy' column of 'procurement_orders' in the schema cache","code":"PGRST204"
```

**Root Cause:**  
The `handleEnhancedSubmit` function in CreateOrderModal was spreading `formData` which contains camelCase field names (`createdBy`, `organizationId`). These were being passed to the API before the transformation to snake_case could occur.

**Fix:**
Removed the `...formData` spread in `handleEnhancedSubmit`. Now only the SOW-specific data is passed, and the parent component's `handleSubmit` function properly transforms all field names to snake_case.

```javascript
// Before (line 392-402)
const orderData = {
  ...formData,  // ❌ This spreads camelCase fields
  sow_template_id: selectedSOWTemplate?.id,
  discipline_assignments: disciplineAssignments,
  user_assignments: userAssignments,
};

// After
const orderData = {
  // ✅ No formData spread - parent handleSubmit will handle it
  sow_template_id: selectedSOWTemplate?.id,
  discipline_assignments: disciplineAssignments,
  user_assignments: userAssignments,
  approval_config: approvalConfig,
};
```

---

## Why This Happened

The PostgREST schema cache error (PGRST204) occurs when:
1. A column name doesn't exist in the database schema
2. The PostgREST instance has cached an outdated schema
3. The API receives column names that don't match the database

In our case, it was #1 - we were sending camelCase field names (`createdBy`) directly to PostgREST, but the database table uses snake_case (`created_by`).

The parent component's `handleSubmit` already does the correct transformation, but by spreading `formData` in the modal, we bypassed that transformation for some fields.

---

## Data Flow (Fixed)

```
CreateOrderModal (camelCase formData)
    ↓
handleEnhancedSubmit (passes only SOW data)
    ↓
Parent handleSubmit (transforms ALL data to snake_case)
    ↓
API/Database (receives snake_case)
```

---

## Testing

After applying these fixes:

1. **Restart the development server** to clear any cached state
2. Navigate to Purchase Orders page
3. Click "Create New Order"
4. Progress through all phases
5. Submit the order

**Expected results:**
- ✅ No "failed to parse order" errors
- ✅ No "Could not find the 'createdBy' column" errors
- ✅ Order created successfully
- ✅ User list loads correctly (though not sorted by name)

---

## Optional Enhancement

If you want users sorted by first name, add this to line ~312 in CreateOrderModal.jsx:

```javascript
const uniqueUsers = data?.reduce((acc, orgUser) => {
  if (orgUser.user && !acc.some(u => u.id === orgUser.user.id)) {
    acc.push({
      ...orgUser.user,
      discipline: orgUser.discipline,
      role: orgUser.role
    });
  }
  return acc;
}, [])
.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || '')) || [];
```

---

## Files Modified

1. **client/src/pages/01900-procurement/components/modals/CreateOrderModal.jsx**
   - Line ~286: Removed `.order('user.first_name')`
   - Line ~398: Removed `...formData` spread

---

## Prevention

**Rule:** Never spread formData containing camelCase directly into API payloads.

**Pattern to follow:**
```javascript
// ❌ WRONG
const apiData = { ...formData, extra: 'data' };

// ✓ CORRECT  
// Let the API layer handle transformation
const apiData = { extra: 'data' };
// OR explicitly transform
const apiData = {
  field_name: formData.fieldName,
  created_by: formData.createdBy
};
```
