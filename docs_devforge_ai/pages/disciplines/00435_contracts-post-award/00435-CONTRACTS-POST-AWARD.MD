# Contracts Post-Award Page Documentation

## Overview

The Contracts Post-Award page provides functionality for managing contracts after they have been awarded, including variations, reporting, and closeout procedures. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing. It utilizes the common `AccordionComponent` for navigation.

## Background Image

The Contracts Post-Award page uses a background image defined via the `.page-background` CSS class. The image is located at:
`client/public/assets/default/00435.png`

This image is loaded with reduced opacity (15%) to provide a subtle visual context while maintaining readability of the content. See [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation) for the standard implementation pattern.

## File Structure (Post-Migration)

```
client/src/pages/00435-contracts-post-award/
└── components/                       # React components specific to this page
    └── 00435-contracts-post-award-page.js # Main page React component

client/src/common/css/pages/00435-contracts-post-award/
└── 00435-pages-style.css              # Page-specific styles
```

## UI Layout

The Contracts Post-Award page utilizes a consistent layout structure with fixed-position elements overlaying a background image. The layout is managed by React components and CSS.

## Features (Placeholder - Based on Component Structure)

- **Contract Management:** View contract details, add reports, manage milestones.
- **Variation Management:** Request and approve contract variations.
- **Contract Closeout:** Initiate closeout procedures and generate final reports.
- Integration with common accordion navigation.

## State Management

State is primarily managed within the `ContractsPostAwardPageComponent` (`client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`) using React hooks (`useState`, `useEffect`). This includes:

- `currentState`: Tracks the active view ('management', 'variations', 'closeout').
- `isSettingsInitialized`: Tracks whether the `settingsManager` has loaded data for the accordion.
- Potentially state for managing modals.

## Modal System

The page utilizes a centralized React-based modal system for actions related to commercial activities.

## Development

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Related Documentation

- [Database Schema](./0300_DATABASE_SCHEMA.md)
- [Supabase Integration](./0500_SUPABASE.md)
- [General Page Implementations](./1300_0000_PAGE_IMPLEMENTATIONS.md#background-image-implementation)

## Supabase Functions

### `search_a_00435_contracts_post_vector`

This function is used to search for contracts within the `a_00435_contracts_post_vector` table based on a query embedding and a specific document value.

```sql
CREATE OR REPLACE FUNCTION search_a_00435_contracts_post_vector(
    query_embedding VECTOR(1536), -- Your specific embedding dimension
    match_count INTEGER,
    target_document_value TEXT   -- Parameter to filter by the value of the "document" key
)
RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity REAL)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.content,
        a.metadata,
        (1 - (a.embedding <=> query_embedding)) AS similarity
    FROM
        a_00435_contracts_post_vector a -- This is the table name
    WHERE
        a.metadata->>'document' = target_document_value -- Filter by the value of the "document" metadata key
    ORDER BY
        a.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

**Parameters:**

- `query_embedding VECTOR(1536)`: The embedding vector to search against.
- `match_count INTEGER`: The maximum number of matching records to return.
- `target_document_value TEXT`: The value to filter the "document" key in the metadata JSONB column.

**Returns:**

A table with the following columns:

- `id UUID`: The unique identifier of the contract.
- `content TEXT`: The textual content of the contract.
- `metadata JSONB`: Additional metadata associated with the contract.
- `similarity REAL`: The similarity score between the query embedding and the contract's embedding.

## Migration Notes

The Contracts Post-Award page (00435) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements (Examples)

1. Implement detailed modal views for contract details, variations, reports.
2. Add workflow logic for variation approval.
3. Integrate with financial systems for milestone tracking.
4. Develop automated closeout report generation.
5. Add notification system for contract events.
