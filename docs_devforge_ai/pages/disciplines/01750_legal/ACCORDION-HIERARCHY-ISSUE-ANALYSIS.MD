# Accordion Hierarchy Issue Analysis & Solution

## 🔍 Root Cause Identified

The accordion is only showing 4 sections instead of the expected hierarchical structure because:

1. **Unique Constraint Issue**: The `pages` table has a unique constraint on `page_prefix` 
2. **Missing `is_active` Column**: The accordion transformation logic expects an `is_active` column that doesn't exist
3. **Hierarchical Structure Blocked**: Cannot create child pages with same prefix under different parents

## 📊 Current State

### Pages Table Schema
```
- page_id (primary key)
- page_prefix (UNIQUE - this is the problem!)
- page_name
- page_slug
- sector_id
- organization_id
- organisation_name
- sector_name
- created_at
- updated_at
- display_order
- parent_page_id
- organisation_id
- sector_uuid
```

### Current Contracts Structure
```
00400 - Contracts (parent: none)
00425 - Contracts Pre Award (parent: 00400)
00435 - Contracts Post Award (parent: 00400)
00200 - All Documents (parent: none) ← Should be child of contracts pages
03010 - Email Management (parent: none) ← Should be child of contracts pages
```

### Expected Hierarchy
```
00400 - Contracts (main button)
  ├── 00400 - Contracts (direct link)
  ├── 00200 - All Documents (link)
  ├── 03010 - Email Management (link)
  ├── 00425 - Contracts Pre-award (sub-button)
  │   ├── 00425 - Contracts Pre-award (link)
  │   ├── 00200 - All Documents (link)
  │   └── 03010 - Email Management (link)
  └── 00435 - Contracts Post-award (sub-button)
      ├── 00435 - Contracts Post-award (link)
      ├── 00200 - All Documents (link)
      └── 03010 - Email Management (link)
```

## 🚫 Constraint Violation
When trying to insert child pages:
```
⚠️ Insert result for 00200: duplicate key value violates unique constraint "pages_page_prefix_key"
⚠️ Insert result for 03010: duplicate key value violates unique constraint "pages_page_prefix_key"
```

## 💡 Solution Options

### Option 1: Remove Unique Constraint (Recommended)
```sql
ALTER TABLE pages DROP CONSTRAINT pages_page_prefix_key;
```

### Option 2: Modify Constraint to Composite Key
```sql
ALTER TABLE pages DROP CONSTRAINT pages_page_prefix_key;
ALTER TABLE pages ADD CONSTRAINT pages_prefix_parent_unique 
  UNIQUE (page_prefix, parent_page_id);
```

### Option 3: Add Missing Column
```sql
ALTER TABLE pages ADD COLUMN is_active BOOLEAN DEFAULT true;
```

## 🔧 Implementation Steps

1. **Remove the unique constraint** to allow multiple pages with same prefix
2. **Add the is_active column** for proper filtering
3. **Insert the hierarchical page structure**
4. **Test the accordion functionality**

## 📈 Expected Result

After implementing the solution:
- Accordion will show proper hierarchical structure
- Contracts section will have sub-links to All Documents and Email Management
- Pre-award and Post-award sections will have their own sub-links
- All 53 accordion sections will display correctly with proper links

## 🎯 Next Actions

1. Execute schema changes to remove constraint and add missing column
2. Run the hierarchy insertion script
3. Verify accordion displays correctly
4. Test navigation functionality
