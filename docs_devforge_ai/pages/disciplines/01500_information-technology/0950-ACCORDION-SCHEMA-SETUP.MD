# Accordion Schema Setup Guide

## Quick Setup Instructions

To apply the dynamic accordion schema to your Supabase database, follow these steps:

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the **SQL Editor** tab

2. **Execute the Schema**
   - Copy the entire contents of `create-accordion-sections-schema-existing.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Verify Installation**
   - After execution, refresh your application
   - The accordion should now load dynamic data from Supabase

### Option 2: Command Line (Alternative)

If you have direct database access:

```bash
# Replace with your actual Supabase connection string
psql "postgresql://postgres:[password]@[host]:[port]/postgres" -f create-accordion-sections-schema.sql
```

### Option 3: Manual Table Creation

If the full schema fails, create tables individually:

#### 1. Create Sections Table
```sql
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key VARCHAR(100) UNIQUE NOT NULL,
  section_name VARCHAR(255) NOT NULL,
  section_description TEXT,
  section_icon VARCHAR(50),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Create Section Organization Mapping Table
```sql
CREATE TABLE IF NOT EXISTS section_organization_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID,
  phase_id UUID,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section_id, organization_id, project_id, phase_id)
);
```

#### 3. Create Section Pages Table
```sql
CREATE TABLE IF NOT EXISTS section_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_subsection BOOLEAN DEFAULT false,
  parent_page_id UUID REFERENCES pages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section_id, page_id)
);
```

#### 4. Create Accordion Structure View
```sql
CREATE OR REPLACE VIEW accordion_structure AS
SELECT 
    s.id as section_id,
    s.section_key,
    s.section_name,
    s.section_description,
    s.section_icon,
    som.organization_id,
    som.project_id,
    som.phase_id,
    som.display_order as section_display_order,
    som.is_visible,
    p.id as page_id,
    p.page_name,
    p.page_slug,
    sp.display_order as page_display_order,
    sp.is_subsection,
    sp.parent_page_id,
    org.name as organization_name,
    proj.project_name,
    phase.phase_name
FROM sections s
LEFT JOIN section_organization_mapping som ON s.id = som.section_id
LEFT JOIN section_pages sp ON s.id = sp.section_id
LEFT JOIN pages p ON sp.page_id = p.id
LEFT JOIN organizations org ON som.organization_id = org.id
LEFT JOIN projects proj ON som.project_id = proj.id
LEFT JOIN phases phase ON som.phase_id = phase.id
WHERE s.is_active = true 
  AND (som.is_visible = true OR som.is_visible IS NULL)
  AND (p.is_active = true OR p.is_active IS NULL);
```

## What This Enables

Once the schema is applied, your accordion will:

✅ **Load dynamic data from Supabase** instead of static configuration
✅ **Support organization-specific sections** - different orgs see different accordion items
✅ **Enable project/phase filtering** - accordion can change based on current project/phase
✅ **Allow real-time updates** - changes in database immediately reflect in UI
✅ **Maintain fallback behavior** - if database is unavailable, falls back to static sections

## Verification

After applying the schema, you should see:

1. **No more "relation does not exist" errors** in the terminal
2. **Dynamic accordion sections** loaded from database
3. **Organization-specific content** based on active organization

## Troubleshooting

If you encounter issues:

1. **Check table creation**: Verify all tables were created successfully
2. **Check foreign key references**: Ensure `organizations` and `pages` tables exist
3. **Check view creation**: Verify the `accordion_structure` view was created
4. **Refresh application**: Hard refresh your browser after schema application

## Sample Data

The schema includes sample data for the EPCM organization. You can add more sections and mappings as needed through the Supabase dashboard or additional SQL scripts.
