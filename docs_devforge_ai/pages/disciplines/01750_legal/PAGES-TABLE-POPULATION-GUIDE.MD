# Pages Table Population Guide

This document provides comprehensive methods for populating the `public.pages` table with dynamic page data. The pages table is essential for the dynamic page management system and organization-based filtering.

## Overview

The `public.pages` table stores metadata for dynamically managed pages, including:
- `page_prefix`: 5-digit numerical prefix (e.g., '20001')
- `page_name`: Human-readable name (e.g., 'Contractor Dashboard')
- `page_slug`: URL-friendly slug (e.g., 'contractor-dashboard')
- `sector_id`: UUID linking to the sectors table
- `organization_id`: String identifying the organization

## Method 1: Direct SQL Script (Recommended for Bulk Data)

### Step 1: Use the Realistic SQL Script

Execute the pre-created SQL script with **actual pages** from the system:

```bash
# If you have direct database access
psql -h db.mseizswoiwyewsidknta.supabase.co -U postgres -d postgres -f sql/populate_pages_table_realistic.sql

# Or through Supabase SQL Editor (RECOMMENDED)
# Copy and paste the contents of sql/populate_pages_table_realistic.sql into the Supabase SQL Editor
```

**Available Scripts:**
- `sql/populate_pages_table_realistic.sql` - **RECOMMENDED**: Uses actual pages from the system
- `sql/populate_pages_table.sql` - Sample/demo data only

### Step 2: Verify the Data

```sql
-- Check inserted pages
SELECT 
    page_prefix, 
    page_name, 
    page_slug, 
    s.sector_name, 
    organization_id,
    created_at
FROM public.pages p
JOIN public.sectors s ON p.sector_id = s.sector_id
ORDER BY page_prefix;
```

## Method 2: Using Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Navigate to your project
3. Go to Table Editor → pages

### Step 2: Insert Records Manually
Click "Insert" and add records with the following structure:

```json
{
  "page_prefix": "20001",
  "page_name": "Contractor Dashboard",
  "page_slug": "contractor-dashboard",
  "sector_id": "8965e2e0-47b3-47c4-b6a4-1157508430e1",
  "organization_id": "org-contractor-uuid"
}
```


## Method 4: Using the Sector Management UI
The sector management page UI provides:
1. A form to add new pages to existing sectors
2. Bulk import functionality
3. Organization assignment interface

## Sample Data Structure

### Available Sectors and Their Ranges

| Sector Name | Sector ID | Prefix Range | Example Organization |
|-------------|-----------|--------------|---------------------|
| Global | `02477804-5d5b-416f-9068-33db504807b9` | 0-199 | `Templates - All` |
| EPCM | `d823e44c-844b-4a2e-9b10-9356d497dc2b` | 200-9999 | `Organisations - EPCM` |
| EPC | `1bf36038-31d9-4fe9-87c7-03a9843acc9a` | 10000-19999 | `org-epc-uuid` |
| Contractor | `8965e2e0-47b3-47c4-b6a4-1157508430e1` | 20000-29999 | `org-contractor-uuid` |
| Judicial | `02477804-5d5b-416f-9068-33db504807b8` | 30000-39999 | `org-judicial-uuid` |

### Real Pages by Sector (from populate_pages_table_realistic.sql)

#### Global Sector (0-199) - Core System Pages
```sql
INSERT INTO public.pages (page_prefix, page_name, page_slug, sector_id, organization_id) VALUES
('00100', 'Home', 'home', '02477804-5d5b-416f-9068-33db504807b9', 'Templates - All'),
('00102', 'Administration', 'administration', '02477804-5d5b-416f-9068-33db504807b9', 'Templates - All'),
('00150', 'User Signup', 'user-signup', '02477804-5d5b-416f-9068-33db504807b9', 'Templates - All'),
('00155', 'User Management', 'user-management', '02477804-5d5b-416f-9068-33db504807b9', 'Templates - All'),
('00165', 'UI Settings', 'ui-settings', '02477804-5d5b-416f-9068-33db504807b9', 'Templates - All'),
('00170', 'Modal Management', 'modal-management', '02477804-5d5b-416f-9068-33db504807b9', 'Templates - All'),
('00175', 'Auth Callback', 'auth-callback', '02477804-5d5b-416f-9068-33db504807b9', 'Templates - All');
```

#### EPCM Sector (200-9999) - Engineering Procurement Construction Management
```sql
-- Commercial and Construction
('00200', 'Commercial', 'commercial', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
('00300', 'Construction', 'construction', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),

-- Engineering Disciplines
('00825', 'Architectural', 'architectural', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
('00835', 'Chemical Engineering', 'chemical-engineering', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
('00850', 'Civil Engineering', 'civil-engineering', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
('00860', 'Electrical Engineering', 'electrical-engineering', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
('00870', 'Mechanical Engineering', 'mechanical-engineering', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),

-- Business Functions
('01100', 'Ethics', 'ethics', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
('01200', 'Finance', 'finance', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
('01300', 'Governance', 'governance', 'd823e44c-844b-4a2e-9b10-9356d497dc2b', 'Organisations - EPCM'),
-- ... and 30+ more real pages
```

#### Contractor Sector (20000-29999) - Real Contractor Pages
```sql
INSERT INTO public.pages (page_prefix, page_name, page_slug, sector_id, organization_id) VALUES
('20000', 'Project Controls', 'project-controls', '8965e2e0-47b3-47c4-b6a4-1157508430e1', 'org-contractor-uuid'),
('20005', 'Project Controls Quantity Surveying', 'project-controls-quantity-surveying', '8965e2e0-47b3-47c4-b6a4-1157508430e1', 'org-contractor-uuid'),
('20010', 'Project Controls Scheduling and Planning', 'project-controls-scheduling-and-planning', '8965e2e0-47b3-47c4-b6a4-1157508430e1', 'org-contractor-uuid'),
('20015', 'Project Management', 'project-management', '8965e2e0-47b3-47c4-b6a4-1157508430e1', 'org-contractor-uuid');
```

## Testing the Population

### Step 1: Check Current Pages Count
```bash
curl http://localhost:3060/api/pages
```

### Step 2: Execute Population Script
```bash
# Use your preferred method from above
```

### Step 3: Verify Pages Were Added
```bash
curl http://localhost:3060/api/pages
```

### Step 4: Test in UI
1. Navigate to http://localhost:3000/00100-home
2. Open the accordion menu (hamburger icon)
3. Verify that new pages appear based on the active organization
4. Switch organizations to see different page sets

## Organization-Based Filtering

### How It Works
- Pages are filtered based on the `organization_id` field
- The active organization is determined by `organizationConfig.activeOrganization`
- The accordion only shows pages matching the active organization
- Special handling for "Templates - All" organization (shows all pages)

### Organization IDs to Use
- `Templates - All`: Shows all pages (administrative view)
- `Organisations - EPCM`: Shows EPCM-specific pages
- `org-contractor-uuid`: Shows contractor-specific pages
- `org-epc-uuid`: Shows EPC-specific pages
- `org-judicial-uuid`: Shows judicial-specific pages

## Troubleshooting

### Common Issues

1. **Pages Not Appearing in Accordion**
   - Check that `organization_id` matches the active organization
   - Verify `sector_id` is valid and exists in sectors table
   - Ensure `page_prefix` is within the sector's allowed range

2. **Database Connection Issues**
   - Verify Supabase credentials in `.env` file
   - Check network connectivity to Supabase
   - Ensure RLS policies allow the operation

3. **API Endpoint Not Found**
   - Verify the server is running on port 3060
   - Check that the route is properly registered
   - Look for any server startup errors

### Validation Queries

```sql
-- Check if pages were inserted correctly
SELECT COUNT(*) as total_pages FROM public.pages;

-- Check pages by sector
SELECT s.sector_name, COUNT(p.page_id) as page_count
FROM public.sectors s
LEFT JOIN public.pages p ON s.sector_id = p.sector_id
GROUP BY s.sector_name;

-- Check pages by organization
SELECT organization_id, COUNT(*) as page_count
FROM public.pages
GROUP BY organization_id;

-- Verify prefix ranges are correct
SELECT 
    p.page_prefix,
    p.page_name,
    s.sector_name,
    s.page_number_prefix_start,
    s.page_number_prefix_end,
    CASE 
        WHEN p.page_prefix::INTEGER BETWEEN s.page_number_prefix_start AND s.page_number_prefix_end 
        THEN 'Valid' 
        ELSE 'Invalid Range' 
    END as range_check
FROM public.pages p
JOIN public.sectors s ON p.sector_id = s.sector_id
ORDER BY p.page_prefix::INTEGER;
```

## Quick Test Instructions

### Step 1: Execute the Realistic Population Script
1. Go to https://supabase.com/dashboard
2. Navigate to your project → SQL Editor
3. Copy and paste the contents of `sql/populate_pages_table_realistic.sql`
4. Click "Run" to execute

### Step 2: Verify the Data
```bash
curl http://localhost:3060/api/pages
```
You should see 40+ pages returned instead of an empty array.

### Step 3: Test in the UI
1. Navigate to http://localhost:3000/00100-home
2. Click the hamburger menu (accordion)
3. You should now see real pages like "Commercial", "Construction", "Finance", etc.
4. Switch organizations to see different page sets

### Expected Results
- **Global pages**: Home, Administration, User Management, etc.
- **EPCM pages**: Commercial, Construction, Engineering disciplines, Finance, etc.
- **Contractor pages**: Project Controls, Quantity Surveying, etc.

## Next Steps

1. **Execute the Realistic Population Script**: Use `sql/populate_pages_table_realistic.sql` with actual system pages
2. **Test the UI**: Verify that real pages appear in the accordion based on organization
3. **Add Custom Pages**: Use the provided structure to add your own pages
4. **Monitor Performance**: Check that page loading remains fast with more data

## Related Documentation

- [Pages Table Schema](0301_PAGES_TABLE_SCHEMA.md)
- [Sector Management](0950_SECTOR_MANAGEMENT.md)
- [Accordion Management](0950_ACCORDION_MANAGEMENT.md)
- [Supabase Integration](0500_SUPABASE.md)
