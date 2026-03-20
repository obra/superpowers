# Pages Table Schema

This document details the schema for the `public.pages` table, which stores metadata for all dynamically managed pages within the application. This table is crucial for enabling dynamic page loading, filtering by sector and organization, and managing page visibility within the UI, particularly the accordion navigation.

## Table: `public.pages`

Stores information about each page, including its unique prefix, display name, slug for URL generation, and its association with a specific sector and organization.

### Columns

| Column Name        | Type                      | Constraints                                   | Description                                                              |
| :----------------- | :------------------------ | :-------------------------------------------- | :----------------------------------------------------------------------- |
| `page_id`          | `UUID`                    | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`    | Unique identifier for the page.                                          |
| `page_prefix`      | `VARCHAR(5)`              | `UNIQUE`, `NOT NULL`                          | A 5-digit numerical prefix (e.g., '00100', '02050') used for file naming, URL generation, and ordering. Must be unique. |
| `page_name`        | `VARCHAR(255)`            | `NOT NULL`                                    | The human-readable name of the page (e.g., 'Home Page', 'Construction'). |
| `page_slug`        | `VARCHAR(255)`            | `NOT NULL`                                    | A URL-friendly version of the page name (e.g., 'home-page', 'construction'). |
| `sector_id`        | `UUID`                    | `REFERENCES public.sectors(sector_id)`, `ON DELETE SET NULL` | Foreign key linking the page to its associated sector. If the sector is deleted, this field is set to NULL. |
| `organization_id`  | `VARCHAR(255)`            | `NULLABLE`                                    | The ID of the organization this page belongs to. This is a string (e.g., 'org-contractor-uuid') and is used for filtering pages based on the active organization. |
| `created_at`       | `TIMESTAMP WITH TIME ZONE`| `DEFAULT now()`, `NOT NULL`                   | Timestamp when the record was created.                                   |
| `updated_at`       | `TIMESTAMP WITH TIME ZONE`| `DEFAULT now()`, `NOT NULL`                   | Timestamp when the record was last updated. Automatically updated via trigger. |

### Indexes

- `idx_pages_page_prefix` (`page_prefix`): Improves lookup performance when querying pages by their prefix.
- `idx_pages_sector_id` (`sector_id`): Improves lookup performance when querying pages by their associated sector.
- `idx_pages_organization_id` (`organization_id`): Improves lookup performance when querying pages by their associated organization.

### Triggers

- `set_pages_updated_at`: An `AFTER UPDATE` trigger that automatically updates the `updated_at` column to the current timestamp whenever a row in the `public.pages` table is modified.

### Example SQL for Table Creation

```sql
CREATE TABLE IF NOT EXISTS public.pages (
    page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_prefix VARCHAR(5) UNIQUE NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_slug VARCHAR(255) NOT NULL,
    sector_id UUID REFERENCES public.sectors(sector_id) ON DELETE SET NULL,
    organization_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_page_prefix ON public.pages (page_prefix);
CREATE INDEX IF NOT EXISTS idx_pages_sector_id ON public.pages (sector_id);
CREATE INDEX IF NOT EXISTS idx_pages_organization_id ON public.pages (organization_id);

-- Function to update updated_at timestamp automatically (if not already defined)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at column for the pages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_pages_updated_at') THEN
        CREATE TRIGGER set_pages_updated_at
        BEFORE UPDATE ON public.pages
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
```

### Row Level Security (RLS) Considerations

By default, the `public.pages` table has RLS enabled. A basic policy to enable read access for all authenticated users is recommended for initial setup:

```sql
CREATE POLICY "Enable read access for all users" ON public.pages FOR SELECT USING (TRUE);
```

For more granular control, especially in multi-organization deployments, RLS policies can be refined to restrict page visibility based on the user's active organization or role. For example:

```sql
-- Example: Users can view pages only if their organization_id matches their profile's organization_id
CREATE POLICY "Users can view pages for their active organization"
ON public.pages FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
);
```

It is crucial to implement appropriate RLS policies to ensure that users only access pages relevant to their assigned organization and permissions.
