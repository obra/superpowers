# Procurement Categories SQL Guide

## Overview

This guide documents the correct SQL approach for the `procurement_categories` table, which stores hierarchical procurement categories from the Excel spreadsheet.

## Table Structure

The `procurement_categories` table exists with the following structure:

```sql
CREATE TABLE procurement_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level1_code VARCHAR(5) UNIQUE NOT NULL,      -- Main category (A-M)
  level1_name VARCHAR(100) NOT NULL,           -- English name
  level1_name_fr VARCHAR(100),                 -- French name
  level2_code VARCHAR(10) UNIQUE,              -- Subcategory (A00, B01, etc.)
  level2_name VARCHAR(150),                    -- English name
  level2_name_fr VARCHAR(150),                 -- French name
  level3_code VARCHAR(15) UNIQUE,              -- Item code (A0001, B0001, etc.)
  level3_name VARCHAR(200),                    -- English name
  level3_name_fr VARCHAR(200),                 -- French name
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_level3_code UNIQUE (level3_code) DEFERRABLE INITIALLY DEFERRED
);

-- RLS Policy (already applied)
ALTER TABLE procurement_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY procurement_categories_read ON procurement_categories
  FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_procurement_cat_level1 ON procurement_categories(level1_code);
CREATE INDEX idx_procurement_cat_level2 ON procurement_categories(level2_code);
CREATE INDEX idx_procurement_cat_level3 ON procurement_categories(level3_code);
```

## Common SQL Errors and Solutions

### Error: `relation "procurement_categories" already exists` or `relation "procurement_templates" already exists`

**Cause**: Running a `CREATE TABLE` statement when the table already exists.

**Solution**: Use `IF NOT EXISTS` or modify the existing table instead of recreating it.

**Correct Approach 1**: Use `CREATE TABLE IF NOT EXISTS` for all tables
```sql
-- All tables should use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS procurement_categories (
  -- ... columns ...
);

CREATE TABLE IF NOT EXISTS procurement_templates (
  -- ... columns ...
);

CREATE TABLE IF NOT EXISTS template_usage_tracking (
  -- ... columns ...
);

CREATE TABLE IF NOT EXISTS scope_of_work_relationships (
  -- ... columns ...
);

CREATE TABLE IF NOT EXISTS template_dependencies (
  -- ... columns ...
);

CREATE TABLE IF NOT EXISTS data_sheet_specifications (
  -- ... columns ...
);
```

**Correct Approach 2**: Use `CREATE OR REPLACE` for functions, but for tables, use `ALTER TABLE` to modify:
```sql
-- Add missing columns
ALTER TABLE procurement_categories 
ADD COLUMN IF NOT EXISTS new_column_name VARCHAR(255);

-- Update existing columns
ALTER TABLE procurement_categories
ALTER COLUMN column_name TYPE TEXT;
```

### Error: `duplicate key value violates unique constraint`

**Cause**: Trying to insert duplicate values into a `UNIQUE` column.

**Solution**: Use `ON CONFLICT` for upsert operations:
```sql
INSERT INTO procurement_categories (level1_code, level1_name, level1_name_fr)
VALUES ('A', 'Energy and Fluid', 'Energie et fluides')
ON CONFLICT (level1_code) 
DO UPDATE SET 
  level1_name = EXCLUDED.level1_name,
  level1_name_fr = EXCLUDED.level1_name_fr,
  is_active = true;
```

## Data Import Strategies

### Strategy 1: Use Existing Migration Script (Recommended)

Run the provided migration script:
```bash
node scripts/apply_migration.js --migration=procurement_categories_migration
```

Or execute the SQL directly:
```bash
psql -h localhost -U postgres -d your_database -f sql/create_procurement_categories_migration.sql
```

### Strategy 2: Manual Data Import

For importing specific data or updates:

```sql
-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM procurement_categories WHERE level1_code IS NOT NULL;

-- Insert or update Level 1 categories
INSERT INTO procurement_categories (level1_code, level1_name, level1_name_fr, is_active, display_order)
VALUES 
  ('A', 'Energy and Fluid', 'Energie et fluides', true, 1),
  ('B', 'Industrial Equipment', 'Equipements industriels', true, 2)
ON CONFLICT (level1_code) 
DO UPDATE SET
  level1_name = EXCLUDED.level1_name,
  level1_name_fr = EXCLUDED.level1_name_fr,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- Insert or update Level 2 subcategories
INSERT INTO procurement_categories (level1_code, level2_code, level2_name, level2_name_fr, is_active)
VALUES 
  ('A', 'A00', 'Water', 'Eau', true),
  ('A', 'A01', 'Electricity', 'Electricité', true)
ON CONFLICT (level2_code) 
DO UPDATE SET
  level2_name = EXCLUDED.level2_name,
  level2_name_fr = EXCLUDED.level2_name_fr,
  is_active = EXCLUDED.is_active;

-- Insert or update Level 3 items
INSERT INTO procurement_categories (level1_code, level2_code, level3_code, level3_name, level3_name_fr, description, is_active)
VALUES 
  ('A', 'A00', 'A0001', 'Industrial water', 'Eau industrielle', '', true),
  ('A', 'A00', 'A0002', 'Drinking Water', 'Eau potable', '', true)
ON CONFLICT (level3_code) 
DO UPDATE SET
  level3_name = EXCLUDED.level3_name,
  level3_name_fr = EXCLUDED.level3_name_fr,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
```

### Strategy 3: Bulk Import from Excel

Use the provided JavaScript script:
```javascript
// scripts/import-procurement-categories.js
const ExcelJS = require('exceljs');
const supabaseClient = require('@lib/supabaseClient.js');

async function importProcurementCategories() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(
    '/Users/_PropAI/construct_ai/docs/pages-forms-templates/01900_procurement/source/SOW_templates_by_purchasing_category.xlsx'
  );
  
  const worksheet = workbook.worksheets[0];
  const rows = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && row.values[2]) {
      rows.push({
        level1Code: row.values[2],
        level1En: row.values[3],
        level1Fr: row.values[4],
        level2Code: row.values[5],
        level2En: row.values[6],
        level2Fr: row.values[7],
        level3Code: row.values[8],
        level3En: row.values[9],
        level3Fr: row.values[10],
        description: row.values[11] || row.values[12]
      });
    }
  });
  
  // Group by hierarchy and insert
  const categories = {};
  for (const row of rows) {
    if (!categories[row.level1Code]) {
      categories[row.level1Code] = {
        name_en: row.level1En,
        name_fr: row.level1Fr,
        subcategories: {}
      };
    }
    if (!categories[row.level1Code].subcategories[row.level2Code]) {
      categories[row.level1Code].subcategories[row.level2Code] = {
        name_en: row.level2En,
        name_fr: row.level2Fr,
        items: []
      };
    }
    if (row.level3Code) {
      categories[row.level1Code].subcategories[row.level2Code].items.push({
        code: row.level3Code,
        name_en: row.level3En,
        name_fr: row.level3Fr,
        description: row.description
      });
    }
  }
  
  // Insert data
  let displayOrder = 10;
  for (const [level1Code, category] of Object.entries(categories)) {
    // Insert Level 1
    await supabaseClient
      .from('procurement_categories')
      .upsert({
        level1_code: level1Code,
        level1_name: category.name_en,
        level1_name_fr: category.name_fr,
        display_order: displayOrder
      });
    
    let subDisplayOrder = displayOrder;
    for (const [level2Code, subcategory] of Object.entries(category.subcategories)) {
      subDisplayOrder++;
      
      // Insert Level 2
      await supabaseClient
        .from('procurement_categories')
        .upsert({
          level1_code: level1Code,
          level2_code: level2Code,
          level2_name: subcategory.name_en,
          level2_name_fr: subcategory.name_fr,
          display_order: subDisplayOrder
        });
      
      let itemDisplayOrder = subDisplayOrder;
      for (const item of subcategory.items) {
        itemDisplayOrder++;
        
        // Insert Level 3
        await supabaseClient
          .from('procurement_categories')
          .upsert({
            level1_code: level1Code,
            level2_code: level2Code,
            level3_code: item.code,
            level3_name: item.name_en,
            level3_name_fr: item.name_fr,
            description: item.description,
            display_order: itemDisplayOrder
          });
      }
    }
    displayOrder = subDisplayOrder + 1;
  }
}

importProcurementCategories()
  .then(() => console.log('Import completed'))
  .catch(err => console.error('Import failed:', err));
```

## Query Examples

### Get all Level 1 categories
```sql
SELECT level1_code, level1_name, level1_name_fr, display_order
FROM procurement_categories
WHERE level2_code IS NULL
  AND is_active = true
ORDER BY display_order;
```

### Get Level 2 subcategories by Level 1 code
```sql
SELECT level2_code, level2_name, level2_name_fr, description, template_count
FROM procurement_categories
WHERE level1_code = $1
  AND level2_code IS NOT NULL
  AND level3_code IS NULL
  AND is_active = true
ORDER BY level2_code;
```

### Get Level 3 items by Level 2 code
```sql
SELECT level3_code, level3_name, level3_name_fr, description, template_count
FROM procurement_categories
WHERE level2_code = $1
  AND level3_code IS NOT NULL
  AND is_active = true
ORDER BY level3_code;
```

### Search for categories by name (bilingual)
```sql
SELECT 
  level1_code,
  level1_name,
  level1_name_fr,
  level2_code,
  level2_name,
  level2_name_fr,
  level3_code,
  level3_name,
  level3_name_fr,
  description
FROM procurement_categories
WHERE is_active = true
  AND (
    level1_name ILIKE $1 OR 
    level1_name_fr ILIKE $1 OR
    level2_name ILIKE $1 OR
    level2_name_fr ILIKE $1 OR
    level3_name ILIKE $1 OR
    level3_name_fr ILIKE $1
  )
ORDER BY 
  CASE 
    WHEN level3_code IS NOT NULL THEN 1
    WHEN level2_code IS NOT NULL THEN 2
    ELSE 3
  END,
  display_order
LIMIT 20;
```

### Get full hierarchy path for a Level 3 code
```sql
WITH RECURSIVE category_path AS (
  SELECT 
    level3_code,
    level3_name,
    level3_name_fr,
    level2_code,
    level2_name,
    level2_name_fr,
    level1_code,
    level1_name,
    level1_name_fr,
    1 as level
  FROM procurement_categories
  WHERE level3_code = $1
  
  UNION ALL
  
  SELECT 
    NULL,
    NULL,
    NULL,
    pc.level2_code,
    pc.level2_name,
    pc.level2_name_fr,
    pc.level1_code,
    pc.level1_name,
    pc.level1_name_fr,
    cp.level + 1
  FROM procurement_categories pc
  JOIN category_path cp ON pc.level2_code = cp.level2_code
  WHERE pc.level3_code IS NULL AND pc.level2_code IS NOT NULL
  
  UNION ALL
  
  SELECT 
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    pc.level1_code,
    pc.level1_name,
    pc.level1_name_fr,
    cp.level + 1
  FROM procurement_categories pc
  JOIN category_path cp ON pc.level1_code = cp.level1_code
  WHERE pc.level2_code IS NULL AND pc.level3_code IS NULL
)
SELECT 
  level1_name || ' > ' || level2_name || ' > ' || level3_name as full_path_en,
  level1_name_fr || ' > ' || level2_name_fr || ' > ' || level3_name_fr as full_path_fr
FROM category_path
WHERE level3_code = $1;
```

## Troubleshooting

### Check if table exists
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'procurement_categories'
);
```

### Check table structure
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'procurement_categories'
ORDER BY ordinal_position;
```

### Check existing data
```sql
SELECT 
  level1_code,
  level2_code,
  level3_code,
  level1_name,
  level1_name_fr,
  level2_name,
  level2_name_fr,
  level3_name,
  level3_name_fr,
  is_active,
  display_order
FROM procurement_categories
WHERE level1_code IS NOT NULL
ORDER BY display_order, level1_code, level2_code, level3_code
LIMIT 100;
```

### Check for duplicate codes
```sql
SELECT 
  'Level 1' as level,
  level1_code,
  COUNT(*) as count
FROM procurement_categories
WHERE level2_code IS NULL
GROUP BY level1_code
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'Level 2' as level,
  level2_code,
  COUNT(*) as count
FROM procurement_categories
WHERE level3_code IS NULL
  AND level2_code IS NOT NULL
GROUP BY level2_code
HAVING COUNT(*) > 1

UNION ALL

SELECT 
  'Level 3' as level,
  level3_code,
  COUNT(*) as count
FROM procurement_categories
WHERE level3_code IS NOT NULL
GROUP BY level3_code
HAVING COUNT(*) > 1;
```

### Update or fix missing data
```sql
-- Update Level 1 English names (from Excel data)
UPDATE procurement_categories
SET level1_name = 
  CASE level1_code
    WHEN 'A' THEN 'Energy and Fluid'
    WHEN 'B' THEN 'Industrial Equipment'
    WHEN 'C' THEN 'Industrial Supplies and Consumables'
    WHEN 'D' THEN 'Overheads'
    WHEN 'E' THEN 'Real Estate'
    WHEN 'F' THEN 'Computing and Telecoms'
    WHEN 'G' THEN 'Logistics and Packaging'
    WHEN 'H' THEN 'Raw Materials and Semi-Products'
    WHEN 'J' THEN 'Services to Sites'
    WHEN 'K' THEN 'Intellectual Services'
    WHEN 'L' THEN 'Industrial Services/Subcontracting'
    WHEN 'M' THEN 'Production Subcontracting'
  END
WHERE level2_code IS NULL;

-- Update Level 2 English names (from Excel data)
UPDATE procurement_categories
SET level2_name = 
  CASE level2_code
    WHEN 'A00' THEN 'Water'
    WHEN 'A01' THEN 'Electricity'
    WHEN 'A03' THEN 'Fuel Oil - Fuel'
    WHEN 'A04' THEN 'Gas'
    WHEN 'A05' THEN 'Steam'
    WHEN 'A06' THEN 'CO2 Quotas'
    -- ... add more cases as needed
  END
WHERE level3_code IS NULL 
  AND level2_code IN ('A00', 'A01', 'A03', 'A04', 'A05', 'A06');
```

## Related Files

- `sql/create_procurement_categories_migration.sql` - Complete migration with data import
- `server/sql/create_procurement_templates_schema.sql` - Table and index creation with `IF NOT EXISTS` **(FIXED)**
- `server/sql/populate_procurement_categories_from_excel_new.sql` - Excel data import
- `server/sql/populate_procurement_categories_from_excel.sql` - Original Excel import script
- `scripts/import-procurement-categories.js` - JavaScript import script

**Note**: All table and index creation statements in `create_procurement_templates_schema.sql` have been updated to use `IF NOT EXISTS` to prevent "relation already exists" errors. This includes:

**Tables (6 total):**
- procurement_templates
- procurement_categories
- template_usage_tracking
- scope_of_work_relationships
- template_dependencies
- data_sheet_specifications

**Indexes (16 total):**
- idx_procurement_templates_category
- idx_procurement_templates_level1
- idx_procurement_templates_level2
- idx_procurement_templates_level3
- idx_procurement_templates_type
- idx_procurement_templates_latest
- idx_procurement_templates_approval
- idx_procurement_categories_level1
- idx_procurement_categories_level2
- idx_procurement_categories_level3
- idx_template_usage_template
- idx_template_usage_user
- idx_template_usage_timestamp
- idx_scope_relationships_sow
- idx_scope_relationships_doc
- idx_template_dependencies_parent
- idx_template_dependencies_dependent

## Best Practices

1. **Always use `IF NOT EXISTS`** when creating tables
2. **Use `ON CONFLICT`** for upsert operations
3. **Test in development** before running in production
4. **Backup data** before making changes
5. **Use transactions** for complex operations
6. **Monitor performance** with indexes
7. **Keep RLS policies** enabled for security
8. **Document changes** in migration logs