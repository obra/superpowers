# Accordion System - Supabase Tables Reference

## Overview
This document provides a comprehensive reference for all Supabase tables used by the accordion navigation system, including schema details, relationships, and metadata for easy development and maintenance.

## Table of Contents
1. [Core Tables](#core-tables)
2. [Supporting Tables](#supporting-tables)
3. [Table Relationships](#table-relationships)
4. [Indexes and Performance](#indexes-and-performance)
5. [Sample Data Queries](#sample-data-queries)

## Core Tables

### 1. pages
**Purpose**: Main table storing all page definitions for the accordion system

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| page_id | text | NO | - | Unique page identifier (e.g., '00400') |
| page_name | text | NO | - | Display name for the page |
| page_path | text | NO | - | URL path for the page |
| parent_id | text | YES | NULL | Parent page identifier for hierarchy |
| organization_id | text | YES | 'default-org' | Organization identifier for filtering |
| sector_id | text | YES | 'all-sectors' | Sector identifier for filtering |
| sort_order | integer | YES | 0 | Display order in accordion |
| is_active | boolean | YES | true | Whether page is active |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Indexes**:
- `pages_page_id_idx` ON (page_id)
- `pages_parent_id_idx` ON (parent_id)
- `pages_org_sector_idx` ON (organization_id, sector_id)

### 2. sectors
**Purpose**: Defines available sectors for content filtering

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| sector_id | text | NO | - | Unique sector identifier |
| sector_name | text | NO | - | Display name for sector |
| description | text | YES | NULL | Sector description |
| is_active | boolean | YES | true | Whether sector is active |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Indexes**:
- `sectors_sector_id_idx` ON (sector_id)
- `sectors_sector_name_idx` ON (sector_name)

### 3. companies
**Purpose**: Defines organizations for multi-organization support

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| company_id | text | NO | - | Unique company identifier |
| company_name | text | NO | - | Display name for company |
| organization_id | text | NO | - | Organization identifier for filtering |
| is_active | boolean | YES | true | Whether company is active |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Indexes**:
- `companies_company_id_idx` ON (company_id)
- `companies_organization_id_idx` ON (organization_id)

## Supporting Tables

### 4. accordion_sections
**Purpose**: Additional metadata for accordion sections (optional enhancements)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| section_id | text | NO | - | References pages.page_id |
| icon | text | YES | NULL | Icon identifier for display |
| description | text | YES | NULL | Section description |
| color | text | YES | NULL | Theme color for section |
| is_collapsible | boolean | YES | true | Whether section can be collapsed |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Indexes**:
- `accordion_sections_section_id_idx` ON (section_id)

### 5. page_permissions
**Purpose**: User permissions for page access control

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| page_id | text | NO | - | References pages.page_id |
| user_role | text | NO | - | Role identifier (e.g., 'admin', 'user') |
| permission_level | text | YES | 'read' | Permission level (read, write, admin) |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Indexes**:
- `page_permissions_page_role_idx` ON (page_id, user_role)

## Table Relationships

### Primary Relationships
```
companies (organization_id) ──┐
                               ├── pages (organization_id)
sectors (sector_id) ──────────┘
                               └── pages (sector_id)
                                    │
                                    ├── accordion_sections (section_id)
                                    └── page_permissions (page_id)
```

### Hierarchy Relationships
```
pages (parent_id) ──> pages (page_id)
  (self-referencing for nested structure)
```

## Indexes and Performance

### Critical Indexes for Performance
```sql
-- Ensure these indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS pages_org_sector_active_idx 
ON pages(organization_id, sector_id, is_active);

CREATE INDEX IF NOT EXISTS pages_parent_sort_idx 
ON pages(parent_id, sort_order);

CREATE INDEX IF NOT EXISTS pages_page_id_unique_idx 
ON pages(page_id);

CREATE INDEX IF NOT EXISTS sectors_active_idx 
ON sectors(is_active, sector_id);
```

### Row Level Security (RLS) Policies
```sql
-- Example RLS policies for pages table
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active pages" ON pages
FOR SELECT USING (is_active = true);

CREATE POLICY "Organization filtering" ON pages
FOR SELECT USING (
  organization_id = current_setting('app.current_org', true)::text 
  OR organization_id = 'default-org' 
  OR organization_id IS NULL
);
```

## Sample Data Queries

### Basic Page Query
```sql
-- Get all active pages for a specific organization and sector
SELECT * FROM pages 
WHERE is_active = true 
  AND (organization_id = 'your-org-id' OR organization_id = 'default-org')
  AND (sector_id = 'your-sector-id' OR sector_id = 'all-sectors')
ORDER BY parent_id NULLS FIRST, sort_order ASC;
```

### Hierarchy Query
```sql
-- Get hierarchical page structure
WITH RECURSIVE page_hierarchy AS (
  SELECT *, 0 as level 
  FROM pages 
  WHERE parent_id IS NULL AND is_active = true
  
  UNION ALL
  
  SELECT p.*, ph.level + 1
  FROM pages p
  INNER JOIN page_hierarchy ph ON p.parent_id = ph.page_id
  WHERE p.is_active = true
)
SELECT * FROM page_hierarchy 
ORDER BY level, sort_order;
```

### Sector-Specific Pages
```sql
-- Get pages filtered by sector
SELECT p.*, s.sector_name 
FROM pages p
LEFT JOIN sectors s ON p.sector_id = s.sector_id
WHERE p.is_active = true 
  AND (p.sector_id = 'construction' OR p.sector_id = 'all-sectors')
ORDER BY p.sort_order;
```

## Data Validation Queries

### Check for Orphaned Pages
```sql
-- Find pages with non-existent parent references
SELECT * FROM pages 
WHERE parent_id IS NOT NULL 
  AND parent_id NOT IN (SELECT page_id FROM pages);
```

### Validate Organization References
```sql
-- Check for pages with invalid organization references
SELECT * FROM pages 
WHERE organization_id IS NOT NULL 
  AND organization_id NOT IN (SELECT organization_id FROM companies);
```

## Maintenance Queries

### Update Sort Order
```sql
-- Update sort order for better organization
UPDATE pages 
SET sort_order = CASE 
  WHEN page_id = '00400' THEN 400
  WHEN page_id = '00425' THEN 425
  WHEN page_id = '00435' THEN 435
  ELSE sort_order 
END
WHERE page_id IN ('00400', '00425', '00435');
```

### Add New Section
```sql
-- Template for adding new accordion section
INSERT INTO pages (
  page_id, page_name, page_path, parent_id, 
  organization_id, sector_id, sort_order, is_active
) VALUES (
  '00500', 'New Section', '/00500-new-section', '00400',
  'default-org', 'all-sectors', 500, true
);
```

## Related Documentation
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](./0975_ACCORDION_MASTER_DOCUMENTATION.md)
- [0975_ACCORDION_SCHEMA_SETUP.md](./0975_ACCORDION_SCHEMA_SETUP.md)
- [0975_DYNAMIC_ACCORDION_IMPLEMENTATION_SUMMARY.md](./0975_DYNAMIC_ACCORDION_IMPLEMENTATION_SUMMARY.md)
