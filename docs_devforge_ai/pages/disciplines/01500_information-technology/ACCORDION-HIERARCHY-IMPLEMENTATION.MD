# Accordion Hierarchy Implementation Guide

This document provides a comprehensive guide for implementing the new database-driven hierarchical accordion system that replaces the previous string-parsing approach.

## Overview

The accordion menu system has been upgraded to use explicit parent-child relationships stored in the database rather than inferring hierarchy from page names containing " > " separators. This provides a more robust and maintainable solution for managing accordion structure.

## Database Schema Changes

### New Columns Added to `public.pages` Table

```sql
-- Add hierarchical relationship columns
ALTER TABLE public.pages
ADD COLUMN parent_page_id UUID REFERENCES public.pages(page_id) ON DELETE SET NULL,
ADD COLUMN display_order INTEGER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_parent_page_id ON public.pages (parent_page_id);
CREATE INDEX IF NOT EXISTS idx_pages_display_order ON public.pages (display_order);

-- Add unique constraint for ordering within parent
ALTER TABLE public.pages
ADD CONSTRAINT unique_parent_display_order 
UNIQUE (parent_page_id, display_order) 
DEFERRABLE INITIALLY DEFERRED;
```

### Column Descriptions

- **`parent_page_id`**: UUID reference to the parent page. NULL indicates a top-level page.
- **`display_order`**: Integer for ordering subsections within a parent. NULL for top-level pages or when order is not specified.

## Implementation Steps

### 1. Database Migration

Execute the following SQL files in order:

```bash
# 1. Add new columns to pages table
psql -f sql/add_parent_page_columns.sql

# 2. Populate parent-child relationships based on static mappings
psql -f sql/populate_parent_page_relationships.sql
```

### 2. Server-Side Changes

The new API endpoint `/api/pages/hierarchy` has been added to fetch pages with their hierarchical relationships:

```javascript
// GET /api/pages/hierarchy
// Returns pages with parent information and sector details
const response = await fetch('/api/pages/hierarchy');
const data = await response.json();
```

### 3. Client-Side Changes

#### Updated UIDisplaySettingsManager

The `UIDisplaySettingsManager.getAccordionSections()` method has been updated to:

1. **Fetch hierarchical data**: Uses the new `/api/pages/hierarchy` endpoint
2. **Process parent-child relationships**: Directly reads `parent_page_id` and `display_order` from database
3. **Build accordion structure**: Creates nested sections based on explicit relationships

#### Key Changes in Data Processing

**Before (String Parsing):**
```javascript
// Old approach - parsing page names for " > " separator
const isSubPage = pageTitle.includes(' > ');
if (isSubPage) {
  const [parentTitle, childTitle] = pageTitle.split(' > ');
  // Find parent by title matching...
}
```

**After (Database Relationships):**
```javascript
// New approach - using explicit parent_page_id
const topLevelPages = this.dbPages.filter(page => !page.parent_page_id);
const subPages = this.dbPages.filter(page => page.parent_page_id);

// Build hierarchy using direct relationships
const childPages = subPages.filter(subPage => subPage.parent_page_id === dbPage.page_id);
childPages.sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
```

## Data Population Strategy

### Static Section Mappings

The system continues to use static section mappings from `client/src/common/js/ui/00200-ui-display-mappings.js` for predefined accordion sections. These are combined with dynamic pages from the database.

### Parent-Child Relationship Population

The `sql/populate_parent_page_relationships.sql` script maps known relationships:

```sql
-- Example: Contracts subsections
UPDATE public.pages 
SET parent_page_id = (SELECT page_id FROM public.pages WHERE page_prefix = '00400'), 
    display_order = 1
WHERE page_prefix = '00425'; -- Pre-award

-- Example: Information Technology subsections  
UPDATE public.pages 
SET parent_page_id = (SELECT page_id FROM public.pages WHERE page_prefix = '02050'), 
    display_order = 1
WHERE page_name = 'Developer settings';
```

### Handling Deleted Contractor Records

Pages with " > " in their `page_name` from the Contractor sector have been deleted and can be rebuilt later using the new hierarchical structure.

## Benefits of the New System

### 1. Explicit Relationships
- No ambiguity in parent-child relationships
- Direct database queries instead of string parsing
- Consistent hierarchy regardless of page naming

### 2. Flexible Ordering
- `display_order` column allows precise control over subsection ordering
- Easy to reorder items without changing page names

### 3. Better Performance
- Database indexes on `parent_page_id` and `display_order`
- Single query to fetch all hierarchical data
- No client-side string processing

### 4. Maintainability
- Clear data model for hierarchy
- Easy to add/remove/reorganize sections
- Reduced complexity in client-side logic

## Usage Examples

### Adding a New Parent-Child Relationship

```sql
-- 1. Insert parent page
INSERT INTO public.pages (page_prefix, page_name, page_slug, sector_id, organization_id)
VALUES ('01500', 'Human Resources', 'human-resources', 'sector-uuid', 'org-uuid');

-- 2. Insert child pages with parent reference
INSERT INTO public.pages (page_prefix, page_name, page_slug, sector_id, organization_id, parent_page_id, display_order)
VALUES 
  ('01510', 'Recruitment', 'recruitment', 'sector-uuid', 'org-uuid', 
   (SELECT page_id FROM public.pages WHERE page_prefix = '01500'), 1),
  ('01520', 'Training', 'training', 'sector-uuid', 'org-uuid',
   (SELECT page_id FROM public.pages WHERE page_prefix = '01500'), 2);
```

### Querying Hierarchical Data

```sql
-- Get all pages with their parent information
SELECT 
    p.page_prefix,
    p.page_name,
    p.display_order,
    parent.page_prefix as parent_prefix,
    parent.page_name as parent_name
FROM public.pages p
LEFT JOIN public.pages parent ON p.parent_page_id = parent.page_id
ORDER BY 
    COALESCE(parent.page_prefix, p.page_prefix),
    p.display_order NULLS LAST;
```

## Migration Verification

### Verify Schema Changes
```sql
-- Check new columns exist
\d public.pages

-- Verify indexes
\di public.pages
```

### Verify Data Population
```sql
-- Check parent-child relationships
SELECT 
    COUNT(*) as total_pages,
    COUNT(parent_page_id) as pages_with_parents,
    COUNT(*) - COUNT(parent_page_id) as top_level_pages
FROM public.pages;

-- View hierarchy structure
SELECT 
    p.page_prefix,
    p.page_name,
    parent.page_name as parent_name,
    p.display_order
FROM public.pages p
LEFT JOIN public.pages parent ON p.parent_page_id = parent.page_id
WHERE p.parent_page_id IS NOT NULL
ORDER BY parent.page_prefix, p.display_order;
```

## Troubleshooting

### Common Issues

1. **Missing Parent References**: Check that parent pages exist before assigning `parent_page_id`
2. **Duplicate Display Orders**: Ensure unique `(parent_page_id, display_order)` combinations
3. **Circular References**: Verify no page references itself or creates circular dependencies
4. **API Endpoint Issues**: Ensure server routes are properly configured for `/api/pages/hierarchy`

### Debug Client-Side Issues

```javascript
// Check if hierarchical data is being fetched
console.log('DB Pages with hierarchy:', this.dbPages);

// Verify parent-child processing
const topLevel = this.dbPages.filter(page => !page.parent_page_id);
const children = this.dbPages.filter(page => page.parent_page_id);
console.log('Top-level pages:', topLevel.length);
console.log('Child pages:', children.length);
```

## Future Enhancements

### Potential Improvements

1. **Multi-level Hierarchy**: Support for grandparent-parent-child relationships
2. **Dynamic Reordering**: Admin interface for drag-and-drop reordering
3. **Conditional Display**: Show/hide sections based on user permissions
4. **Accordion State Persistence**: Remember expanded/collapsed states

### Database Optimizations

1. **Materialized Views**: For complex hierarchy queries
2. **Recursive CTEs**: For deep hierarchy traversal
3. **Caching**: Redis cache for frequently accessed hierarchy data

## Conclusion

The new hierarchical accordion system provides a robust, maintainable, and performant solution for managing accordion menu structure. By moving from string-based inference to explicit database relationships, the system becomes more reliable and easier to maintain.

The implementation maintains backward compatibility with existing static sections while providing a clear path for future enhancements and better data management.
