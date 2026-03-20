# Manual SQL Migration for document_stores Table

## Instructions
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL statements below
4. Execute them one by one or all at once

## SQL Statements to Execute

```sql
-- Add missing columns to document_stores table
ALTER TABLE document_stores ADD COLUMN IF NOT EXISTS flowise_id VARCHAR(255);
ALTER TABLE document_stores ADD COLUMN IF NOT EXISTS discipline_code VARCHAR(10);
ALTER TABLE document_stores ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'medium';
ALTER TABLE document_stores ADD COLUMN IF NOT EXISTS access_roles JSONB DEFAULT '[]';
ALTER TABLE document_stores ADD COLUMN IF NOT EXISTS store_type VARCHAR(50) DEFAULT 'flowise';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_stores_flowise_id ON document_stores(flowise_id);
CREATE INDEX IF NOT EXISTS idx_document_stores_discipline_code ON document_stores(discipline_code);
CREATE INDEX IF NOT EXISTS idx_document_stores_security_level ON document_stores(security_level);

-- Update the known stores with their Flowise IDs
UPDATE document_stores 
SET flowise_id = '977a0660-2843-4ea0-bcd0-37e3194ceb1f', 
    discipline_code = '00435',
    security_level = 'high',
    store_type = 'flowise'
WHERE name = '00435-Contracts post-award';

UPDATE document_stores 
SET flowise_id = 'a4172f65-250f-4f4f-8740-3169a51942af', 
    discipline_code = '00435',
    security_level = 'high',
    store_type = 'flowise',
    is_active = false
WHERE name = '00435-Contracts Post Award';

-- Extract discipline codes from store names for all stores
UPDATE document_stores 
SET discipline_code = SUBSTRING(name FROM '^(\d{5})-')
WHERE discipline_code IS NULL AND name ~ '^\d{5}-';

-- Set security levels based on discipline codes
UPDATE document_stores 
SET security_level = CASE 
    WHEN discipline_code IN ('00880', '01200', '02400') THEN 'critical'
    WHEN discipline_code IN ('00425', '00435', '01900', '02075') THEN 'high'
    ELSE 'medium'
END
WHERE security_level = 'medium';

-- Set store type as flowise for all
UPDATE document_stores 
SET store_type = 'flowise' 
WHERE store_type IS NULL;
```

## What This Does

1. **Adds Missing Columns**:
   - `flowise_id` - Maps to actual Flowise store IDs
   - `discipline_code` - Page prefix (00435, 00880, etc.)
   - `security_level` - Security classification (critical, high, medium)
   - `access_roles` - JSON array for role-based access
   - `store_type` - Type of store (flowise)

2. **Creates Indexes** for better query performance

3. **Updates Known Stores**:
   - Sets the working store `977a0660-2843-4ea0-bcd0-37e3194ceb1f` for "00435-Contracts post-award"
   - Sets the inactive store `a4172f65-250f-4f4f-8740-3169a51942af` for "00435-Contracts Post Award"

4. **Bulk Updates**:
   - Extracts discipline codes from all store names
   - Sets appropriate security levels
   - Marks all stores as flowise type

## After Running This

Once you've executed these SQL statements, our FlowiseService will be able to:
- ✅ Find the correct store for page prefix 00435
- ✅ Map to the working Flowise store ID
- ✅ Test the dashboard persistence fix end-to-end

## Verification Query

After running the migration, you can verify it worked with:

```sql
SELECT name, flowise_id, discipline_code, security_level, is_active
FROM document_stores 
WHERE name LIKE '%00435%'
ORDER BY name;
```

This should show both 00435 stores with their Flowise IDs and discipline codes populated.
