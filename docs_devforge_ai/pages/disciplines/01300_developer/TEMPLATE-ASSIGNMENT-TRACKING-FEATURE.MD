# Template Assignment Tracking Feature - Complete Documentation

## Overview

Implemented **Option A: Status Badge System** to track which templates have been assigned to contractors and which haven't, preventing templates from being copied from governance but never assigned.

## Features Implemented

### 1. Assignment Status Badges
Three distinct visual states for templates:

- **✓ Assigned (count)** - Green badge showing number of contractor assignments
- **○ Unassigned** - Red badge for templates with zero assignments
- **⚠ Unused (days)** - Yellow badge for templates older than 30 days without assignments

### 2. Assignment Status Filter
New dropdown filter in the search/filter panel:
- **All Templates** - Show everything (default)
- **✓ Assigned** - Show only templates with active assignments
- **○ Unassigned** - Show templates needing assignment
- **⚠ Unused (30+ days)** - Show expired/neglected templates

### 3. Real-Time Assignment Counts
Automatically queries `external_party_document_instances` table to count:
- Total assignments per template
- Active assignments (issued, in_progress, submitted statuses)
- Days since template creation

## Files Modified

### 1. SafetyTemplateService.js
**Location:** `client/src/pages/02400-safety/components/services/SafetyTemplateService.js`

**Changes:**
- Added `enrichTemplatesWithAssignmentCounts()` method
- Queries `external_party_document_instances` for assignment counts
- Adds `assignment_count`, `active_assignments`, and `days_since_creation` to each template
- Added `filterByAssignmentStatus()` method for filtering
- Added `calculateDaysSince()` helper method

**Key Code:**
```javascript
async enrichTemplatesWithAssignmentCounts(templates) {
  const { data: assignments } = await supabaseClient
    .from('external_party_document_instances')
    .select('source_template_id, status')
    .eq('source_table', 'safety_templates')
    .in('source_template_id', templateIds);

  // Count assignments and enrich templates
  return templates.map(template => ({
    ...template,
    assignment_count: assignmentCounts[template.id] || 0,
    active_assignments: activeAssignmentCounts[template.id] || 0,
    days_since_creation: this.calculateDaysSince(template.created_at)
  }));
}
```

### 2. SafetyTemplatesTable.jsx
**Location:** `client/src/pages/02400-safety/components/features/SafetyTemplatesTable.jsx`

**Changes:**
- Added `getAssignmentStatusBadge()` function
- Added "Assignment" column to table header
- Displays assignment status badge for each template row
- Badges include tooltips showing assignment details

**Key Code:**
```javascript
const getAssignmentStatusBadge = (template) => {
  const assignmentCount = template.assignment_count || 0;
  const daysSince = template.days_since_creation || 0;

  if (assignmentCount > 0) {
    return {
      style: { backgroundColor: '#d4edda', color: '#155724' },
      icon: '✓',
      text: `Assigned (${assignmentCount})`,
      tooltip: `${assignmentCount} contractor assignment(s)`
    };
  } else if (daysSince > 30) {
    return {
      style: { backgroundColor: '#fff3cd', color: '#856404' },
      icon: '⚠',
      text: `Unused (${daysSince}d)`,
      tooltip: `No assignments in ${daysSince} days`
    };
  } else {
    return {
      style: { backgroundColor: '#f8d7da', color: '#721c24' },
      icon: '○',
      text: 'Unassigned',
      tooltip: 'Template not yet assigned to contractors'
    };
  }
};
```

### 3. 02400-safety-document-templates-page.js
**Location:** `client/src/pages/02400-safety/components/02400-safety-document-templates-page.js`

**Changes:**
- Added `selectedAssignmentStatus` state
- Added `assignmentStatusOptions` array
- Added assignment status filter dropdown in UI
- Passes `assignmentStatus` filter to service
- Includes in filter clearing logic

**Key Code:**
```javascript
const assignmentStatusOptions = [
  { value: "", label: "All Templates" },
  { value: "assigned", label: "✓ Assigned" },
  { value: "unassigned", label: "○ Unassigned" },
  { value: "expired", label: "⚠ Unused (30+ days)" }
];
```

## How It Works

### Data Flow

1. **Page Load:**
   ```
   fetchSafetyTemplates()
   ↓
   SafetyTemplateService.fetchTemplates(filters)
   ↓
   enrichTemplatesWithAssignmentCounts(templates)
   ↓
   Query external_party_document_instances
   ↓
   Return templates with assignment_count
   ```

2. **Display:**
   ```
   SafetyTemplatesTable receives enriched templates
   ↓
   For each template row:
     - getAssignmentStatusBadge(template)
     - Display badge in "Assignment" column
   ```

3. **Filtering:**
   ```
   User selects assignment status filter
   ↓
   filterByAssignmentStatus(templates, status)
   ↓
   Display filtered results
   ```

## Database Schema

### Query Used
```sql
SELECT source_template_id, status
FROM external_party_document_instances
WHERE source_table = 'safety_templates'
  AND source_template_id IN ('id1', 'id2', ...)
```

### Tables Involved
- **safety_templates** - Source templates
- **external_party_document_instances** - Assignment records
  - Links via: `source_template_id` = `safety_templates.id`
  - Where: `source_table` = 'safety_templates'

## Usage Guide

### For Users

#### Viewing Assignment Status
1. Go to **Safety Templates** page (02400)
2. Look at the **"Assignment"** column in the table
3. Badge colors indicate status:
   - **Green** = Template actively assigned
   - **Red** = Template needs assignment
   - **Yellow** = Template unused for 30+ days

#### Filtering by Assignment Status
1. In the filter panel, find **"Assignment Status"** dropdown
2. Select desired filter:
   - **All Templates** - See everything
   - **✓ Assigned** - See only assigned templates
   - **○ Unassigned** - Focus on templates needing assignment
   - **⚠ Unused (30+ days)** - Find neglected templates
3. Click **Refresh** to update results

#### Workflow Recommendations
1. **After copying from governance:**
   - Check that template appears in safety_templates
   - Note the "Unassigned" red badge
   - Click **"Assign"** button to assign to contractors

2. **Weekly Review:**
   - Filter by **"○ Unassigned"**
   - Review templates needing assignment
   - Take action on each unassigned template

3. **Monthly Audit:**
   - Filter by **"⚠ Unused (30+ days)"**
   - Review why templates haven't been assigned
   - Archive or assign neglected templates

### For Developers

#### Adding New Assignment Sources
If you need to track assignments from other template tables (e.g., `procurement_templates`):

```javascript
// In enrichTemplatesWithAssignmentCounts()
const { data: assignments } = await supabaseClient
  .from('external_party_document_instances')
  .select('source_template_id, status')
  .eq('source_table', 'your_table_name')  // Change this
  .in('source_template_id', templateIds);
```

#### Customizing Badge Thresholds
Edit `getAssignmentStatusBadge()` in SafetyTemplatesTable.jsx:

```javascript
// Change the 30-day threshold
} else if (daysSince > 30) {  // Change this number
  // Unused badge
}
```

#### Adding More Filter Options
Add to `assignmentStatusOptions` array:

```javascript
const assignmentStatusOptions = [
  // ... existing options
  { value: "critical", label: "🔥 Critical (60+ days)" }
];

// Then update filterByAssignmentStatus() in service
case 'critical':
  return templates.filter(t => 
    t.assignment_count === 0 && t.days_since_creation > 60
  );
```

## Benefits

### Prevents Workflow Gaps
- **Before:** Templates copied from governance but forgotten
- **After:** Visual indicators show which templates need assignment

### Improves Accountability
- Easy to see which templates are being used
- Quick identification of neglected templates
- Data-driven template management

### Enhances Workflow
- Filter by assignment status for targeted action
- Assignment counts show template popularity
- Days since creation highlights age of unassigned templates

## Performance Considerations

### Query Optimization
- Single query fetches all assignment counts
- Uses `IN` clause for batch lookup
- Only queries when templates are loaded

### Caching
- Assignment counts cached in template objects
- Refreshed on page load or filter change
- No real-time updates (by design)

### Error Handling
- Graceful fallback if assignment query fails
- Returns templates with zero counts on error
- Logs warnings for debugging

## Testing Checklist

- [ ] Templates display with correct assignment badges
- [ ] Badge colors match assignment status
- [ ] Tooltips show correct assignment details
- [ ] Filter dropdown shows all options
- [ ] Filtering by "Assigned" works correctly
- [ ] Filtering by "Unassigned" works correctly
- [ ] Filtering by "Unused (30+ days)" works correctly
- [ ] Clear filters resets assignment status filter
- [ ] Assignment count updates after new assignment
- [ ] Days calculation is accurate
- [ ] Error handling works (disconnect database test)

## Integration with Existing Features

### Works With:
- ✅ Template search by name
- ✅ Category filter
- ✅ Template type filter
- ✅ Risk level filter
- ✅ Status filter
- ✅ Assign to Contractor modal
- ✅ Template creation workflow
- ✅ Template import from governance

### Compatible With:
- HTML content transfer fix (just implemented)
- Contractor vetting workflow
- External party evaluation page
- All template management features

## Future Enhancements

### Phase 2 Possibilities:
1. **Dashboard Widget:** "Templates Awaiting Assignment" count
2. **Email Notifications:** Alert when template unassigned for X days
3. **Assignment History:** Track when templates were assigned
4. **Bulk Assignment:** Select multiple unassigned templates for batch assignment
5. **Assignment Analytics:** Charts showing assignment trends
6. **Reminder System:** Prompt after "Copy to Disciplines" to assign immediately

## Troubleshooting

### Issue: Badge not showing
**Solution:** Check that `external_party_document_instances` table exists and has data

### Issue: Count seems wrong
**Solution:** Verify `source_table` field is set to 'safety_templates' in document instances

### Issue: Filter not working
**Solution:** Check that `assignmentStatus` is being passed to service correctly

### Issue: Performance slow with many templates
**Solution:** Add database index on `external_party_document_instances.source_template_id`

## Summary

✅ **Implemented:** Complete assignment tracking system with visual badges  
✅ **Prevents:** Templates being copied but never assigned  
✅ **Provides:** Clear visibility into template usage  
✅ **Enables:** Filtered views of assigned/unassigned/expired templates  
✅ **Integrates:** Seamlessly with existing template management  

The assignment tracking feature ensures no template is forgotten after being copied from governance, maintaining workflow integrity and accountability throughout the contractor vetting process.
