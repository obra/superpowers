# Accordion Directors Hierarchy Logic Explanation

## Current Problem

The Directors section in the accordion is not displaying correctly due to complex parent-child relationships in the database:

### Data Structure Issue
Director pages have **dual parent relationships**:
- **Fake Parent**: All Director pages reference `3b4cbf24-7909-4fcf-bac0-239c76427174` (marked as `is_active: false`)
- **Real Parents**: Each Director page also references its own specific parent page

Example:
```
Director Construction (00882) references:
  - Fake parent: 3b4cbf24-7909-4fcf-bac0-239c76427174 (inactive)
  - Real parent: 6d19306a-e578-46c4-9d26-80e1e5790ed0 (active)
```

## Current Transformation Logic

The API transformation logic in `server/src/routes/accordion-sections-routes.js` works as follows:

1. **Fetch Data**: Get all active pages (`is_active = true`)
2. **Process Each Section**: 
   - Get main section pages (matching prefix, no parent)
   - Recursively get all descendants
3. **Group Children**: Group child pages by `parent_page_id`
4. **Create Subsections**:
   - If parent exists → normal subsection with parent + children
   - If parent doesn't exist → virtual subsections for orphaned children

## Why It's Broken

The current logic gets confused because:
1. Pages reference both fake and real parents
2. The fake parent is marked inactive, but pages still reference it
3. The grouping logic sees the fake parent reference first and treats pages as orphaned
4. This creates empty or incorrect subsections

## Desired Structure

The Directors section should display as:

```
Directors (main button)
  ├── Directors (direct link)
  ├── All Documents (link)
  ├── Email Management (link)
  ├── Board of Directors (sub-button)
  │   ├── Board of Directors (link)
  │   ├── All Documents (link)
  │   └── Email Management (link)
  ├── Director Construction (sub-button)
  │   ├── Director Construction (link)
  │   ├── All Documents (link)
  │   └── Email Management (link)
  └── ... (other Director roles as sub-buttons)
```

## Proposed Solution

### Approach 1: Database Cleanup (Recommended)
1. Remove fake parent references from Director pages
2. Keep only real parent relationships
3. Ensure each Director page references its specific parent

### Approach 2: Enhanced Logic
Modify the transformation logic to:
1. **Filter Parent References**: When grouping children, ignore inactive parents
2. **Prioritize Real Parents**: Use real active parents over fake ones
3. **Clean Data Processing**: Handle dual parent relationships properly

### Implementation Steps

1. **Update API Logic**:
   ```javascript
   // Filter out inactive parents when grouping children
   const childrenByParent = new Map();
   childPages.forEach(child => {
     const parentId = child.parent_page_id;
     // Skip inactive parents
     const parentPage = pages.find(p => p.page_id === parentId);
     if (parentPage && parentPage.is_active === false) {
       return; // Skip this child for grouping
     }
     if (!childrenByParent.has(parentId)) {
       childrenByParent.set(parentId, []);
     }
     childrenByParent.get(parentId).push(child);
   });
   ```

2. **Enhanced Parent Selection**:
   - When a child has multiple parent references, prioritize active real parents
   - Only treat as orphaned if ALL parent references are invalid

3. **Directors Section Special Handling**:
   - Create individual sub-buttons for each Director role
   - Each sub-button contains the Director's specific page plus standard links
   - Main section contains top-level links (Directors, All Documents, Email Management)

## Benefits of This Approach

1. **Clean Data**: Removes confusing fake parent references
2. **Proper Hierarchy**: Creates correct sub-button structure for each Director
3. **Maintainable**: Logic is clear and handles edge cases
4. **Flexible**: Can be extended to other sections with similar issues
5. **User Control**: Pages can be individually controlled via `is_active` column

## Implementation Priority

1. **Immediate**: Update API logic to handle inactive parents properly
2. **Short-term**: Clean up database to remove fake parent references  
3. **Long-term**: Add UI controls for page visibility management
