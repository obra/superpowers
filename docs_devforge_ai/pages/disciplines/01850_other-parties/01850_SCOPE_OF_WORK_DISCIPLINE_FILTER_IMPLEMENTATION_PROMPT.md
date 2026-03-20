## Reusable Prompt: Implement Discipline-Based Filtering for Scope of Work Tables

### Overview
This prompt implements Pattern B from the dual Supabase client system and adds discipline-based filtering to scope of work tables. The implementation ensures users only see SOW records relevant to their discipline (e.g., Procurement users see only Procurement SOWs).

### Prerequisites
1. **Database Setup**: Ensure `migrate-scope-of-work-assign-procurement-discipline.sql` has been run to add discipline_id column to scope_of_work table
2. **Dual System**: Pattern B import from `@lib/supabaseClient.js` should be implemented
3. **Discipline Context**: Page-specific discipline determination (currently hard-coded for development)

### Implementation Steps

#### Step 1: Update Import Statement (Pattern B Migration)
**File**: `[PagePath]/[PageComponent].js`

```javascript
// CHANGE FROM:
import supabase from "../../../lib/supabaseClient.js";

// CHANGE TO:
// Pattern B: Direct import from @lib/supabaseClient.js
import supabaseClient from '@lib/supabaseClient.js';
```

**Impact**: Migrate from legacy import pattern to the recommended dual system Pattern B.

#### Step 2: Add Discipline Configuration
**Location**: Add after imports, before component:

```javascript
// User discipline configuration for filtering
const USER_DISCIPLINE_CONFIG = {
  development: '[DisciplineName]', // e.g., 'Procurement', 'Construction', 'Finance'
  disciplineCode: '[DisciplineCode]' // e.g., '01900', '00300', '01200'
};
```

**Notes**:
- Replace placeholders with page-specific discipline values
- `development` assumes current user discipline in dev mode
- `disciplineCode` should match the page's discipline code

#### Step 3: Modify Data Fetching Logic
**Location**: Update the `fetchScopes` (or equivalent) function:

```javascript
// BEFORE:
const fetchScopes = async () => {
  // ... existing checks ...
  const { data, error } = await supabaseClient
    .from('scope_of_work')
    .select('*')
    .order('created_at', { ascending: false });

  // ... rest of function ...
};

// AFTER:
const fetchScopes = async () => {
  // ... existing checks ...

  try {
    console.log("[PageComponent] Fetching scopes from Supabase...");

    // Determine user discipline - in development assume discipline, in production get from user context
    const currentUserDiscipline = process.env.NODE_ENV === 'development'
      ? USER_DISCIPLINE_CONFIG.development
      : '[ProductionDisciplineLookup]'; // In production, get this from user authentication context

    console.log("[PageComponent] Filtering by user discipline:", currentUserDiscipline);

    // First get the discipline ID
    const { data: disciplineData, error: disciplineError } = await supabaseClient
      .from('disciplines')
      .select('id')
      .eq('name', currentUserDiscipline)
      .eq('organization_name', 'Organisations - EPCM')
      .single();

    if (disciplineError) {
      console.error("[PageComponent] Error fetching discipline:", disciplineError);
      throw new Error(`Could not determine user discipline: ${disciplineError.message}`);
    }

    const disciplineId = disciplineData?.id;
    console.log("[PageComponent] Discipline ID for filtering:", disciplineId);

    // Fetch scopes filtered by discipline
    const { data, error } = await supabaseClient
      .from('scope_of_work')
      .select('*')
      .eq('discipline_id', disciplineId)
      .order('created_at', { ascending: false });

    // ... existing error handling and result processing ...
  } catch (error) {
    // ... existing error handling ...
  } finally {
    setLoading(false);
  }
};
```

**Key Changes**:
- Add discipline determination logic
- Query disciplines table to get discipline ID
- Filter scope_of_work records by `discipline_id`

#### Step 4: Update UI Text to Indicate Filtering
**Location**: Dashboard/header text:

```javascript
// BEFORE:
<h5>Total Scopes</h5>
<div className="card-trend neutral">Active projects</div>

// AFTER:
<h5>Total [Discipline] Scopes</h5>
<div className="card-trend neutral">Filtered by [Discipline] discipline</div>
```

**Example for Procurement**:
```javascript
<h5>Total Procurement Scopes</h5>
<div className="card-trend neutral">Filtered by Procurement discipline</div>
```

#### Step 5: Update All Supabase References
**Critical**: Replace all instances of the old variable name:

- Change `supabase` → `supabaseClient` in ALL function calls
- Update error messages and console logs to reflect new variable name
- Ensure consistent naming throughout the component

### Production Considerations

#### Discipline Context Implementation
For production deployment, replace the hard-coded discipline with actual user context:

```javascript
// Production implementation (replace the development fallback):
const currentUserDiscipline = getCurrentUserDiscipline(); // Implement this function

// Helper function options:
function getCurrentUserDiscipline() {
  // Option 1: From authentication context
  const user = getCurrentUser();
  return user?.discipline || 'Procurement'; // fallback

  // Option 2: From global state/context
  const { userDiscipline } = useUserContext();
  return userDiscipline;

  // Option 3: From URL parameters
  const params = new URLSearchParams(window.location.search);
  return params.get('discipline') || 'Procurement';
}
```

#### Error Handling Enhancements
Add specific error handling for discipline lookup failures:

```javascript
if (disciplineError) {
  if (disciplineError.code === 'PGRST116') {
    // No rows returned
    setError(`Discipline "${currentUserDiscipline}" not found in system. Please contact administrator.`);
  } else {
    setError(`Failed to determine user permissions: ${disciplineError.message}`);
  }
  setScopes([]);
  throw new Error(`Discipline resolution failed: ${disciplineError.message}`);
}
```

### Testing Checklist

#### Development Testing
- [ ] Page loads without errors
- [ ] SOW records display (filtered appropriately)
- [ ] Console shows correct discipline filtering logs
- [ ] Dashboard shows "Total [Discipline] Scopes"
- [ ] All CRUD operations work with filtered data

#### Database Verification
- [ ] Confirm `scope_of_work.discipline_id` column exists
- [ ] Verify foreign key constraint exists
- [ ] Check discipline records exist in `disciplines` table
- [ ] Ensure existing SOW records have correct `discipline_id` values

### Page-Specific Examples

#### Example 1: Finance Discipline (01200)
```javascript
const USER_DISCIPLINE_CONFIG = {
  development: 'Finance',
  disciplineCode: '01200'
};

// Use "Total Finance Scopes" in dashboard
```

#### Example 2: Construction Discipline (00300)
```javascript
const USER_DISCIPLINE_CONFIG = {
  development: 'Construction',
  disciplineCode: '00300'
};

// Use "Total Construction Scopes" in dashboard
```

### Rollback Plan
If issues arise:

1. **Temporary**: Comment out discipline filtering, show all records
2. **Revert Import**: Revert to legacy import pattern
3. **Restore State**: Remove discipline configuration and filtering logic

### Benefits
✅ **Security**: Users only see relevant discipline-specific data
✅ **Performance**: Reduced data transfer and client-side filtering
✅ **User Experience**: Cleaner, focused views
✅ **Scalability**: Easy to implement across multiple discipline pages
✅ **Maintainability**: Centralized discipline logic and clear separation of concerns

### Usage Notes
- This pattern can be applied to any page/component that displays scope_of_work records
- Adapt the discipline configuration for each page's specific requirements
- Ensure database migration has been properly executed before implementing
- Test thoroughly in development environment before production deployment

---

**Status**: READY FOR IMPLEMENTATION
**Pattern**: Discipline-Based Filtering v1.0
**Compatibility**: Dual System Pattern B
**Target Files**: */*scope-of-work*/*.js
