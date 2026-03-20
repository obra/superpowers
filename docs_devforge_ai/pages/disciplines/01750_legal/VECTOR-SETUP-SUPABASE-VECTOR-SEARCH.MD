# Supabase Vector Search Setup Guide

This guide explains how to set up a complete vector search system using Supabase Edge Functions with dynamic search criteria stored in a database table.

## Overview

The system consists of:
1. **Search Criteria Table** - Stores dynamic filter configurations
2. **Edge Function** - Handles vector search requests
3. **Client Library** - Easy-to-use JavaScript client for making requests

## Step 1: Create the Search Criteria Table

Run the SQL script to create the table and populate it with sample data:

```bash
# In Supabase SQL Editor, run:
```

```sql
-- Copy and paste the contents of sql/create_search_criteria_table.sql
```

This creates:
- `vector_search_criteria` table to store search configurations
- Sample search criteria for your contracts table
- Indexes for performance
- Triggers for automatic timestamp updates

## Step 2: Deploy the Edge Function

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Logged into Supabase CLI: `supabase login`

### Deploy Steps

1. **Initialize Supabase in your project** (if not already done):
```bash
supabase init
```

2. **Link to your Supabase project**:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

3. **Deploy the Edge Function**:
```bash
supabase functions deploy vector-search
```

4. **Set environment variables** (if needed):
```bash
supabase secrets set CUSTOM_SECRET=value
```

The function will be available at:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/vector-search`

## Step 3: Test the Setup

### Using the Client Library

```javascript
// Import the client
const VectorSearchClient = require('./client-vector-search.js');

// Initialize
const vectorSearch = new VectorSearchClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Load your embedding (1536 dimensions for OpenAI)
const queryEmbedding = [-0.0251, 0.0901, 0.0464, /* ... your embedding data ... */];

// Search for VI-003 documents
const results = await vectorSearch.searchVI003(queryEmbedding, 10);
console.log(results);
```

### Direct HTTP Request

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/vector-search' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "query_embedding": [-0.0251, 0.0901, 0.0464, ...],
    "search_name": "vi_003_search",
    "match_count": 10
  }'
```

## Step 4: Managing Search Criteria

### View Available Search Criteria

```sql
SELECT * FROM vector_search_criteria WHERE is_active = true;
```

### Add New Search Criteria

```sql
INSERT INTO vector_search_criteria (table_name, search_name, description, filter_criteria)
VALUES (
  'a_00435_contracts_post_vector',
  'urgent_documents',
  'Search for urgent priority documents',
  '{"priority": "urgent", "status": "active"}'
);
```

### Update Existing Criteria

```sql
UPDATE vector_search_criteria 
SET filter_criteria = '{"reference_id": "VI-003", "status": "approved"}'
WHERE search_name = 'vi_003_search';
```

### Disable Search Criteria

```sql
UPDATE vector_search_criteria 
SET is_active = false 
WHERE search_name = 'old_search';
```

## Step 5: Usage Examples

### Basic Search

```javascript
const results = await vectorSearch.search({
  query_embedding: yourEmbedding,
  search_name: 'vi_003_search',
  match_count: 10
});
```

### Search with Custom Filters

```javascript
const results = await vectorSearch.search({
  query_embedding: yourEmbedding,
  search_name: 'contracts_post_award',
  match_count: 5,
  custom_filter: {
    date_issued: '2023-07-15',
    status: 'approved'
  }
});
```

### Predefined Search Methods

```javascript
// Search for VI-003 documents
const vi003Results = await vectorSearch.searchVI003(yourEmbedding);

// Search for contracts post-award documents
const contractResults = await vectorSearch.searchContractsPostAward(yourEmbedding);

// Search for variation instructions
const variationResults = await vectorSearch.searchVariationInstructions(yourEmbedding);
```

## Response Format

The Edge Function returns:

```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "content": "document content...",
      "metadata": {
        "reference_id": "VI-003",
        "title_subject": "Document title..."
      },
      "similarity": 0.8542
    }
  ],
  "metadata": {
    "search_name": "vi_003_search",
    "description": "Search for VI-003 variation instruction documents",
    "table_name": "a_00435_contracts_post_vector",
    "function_used": "contracts_post_award_search_match_documents_with_json_filters",
    "filter_applied": {"reference_id": "VI-003"},
    "match_count": 10,
    "results_count": 3
  }
}
```

## Error Handling

The system provides detailed error messages:

```json
{
  "error": "Search criteria not found",
  "details": "No rows returned",
  "search_name": "invalid_search",
  "table_name": "a_00435_contracts_post_vector"
}
```

## Security Considerations

1. **Row Level Security (RLS)**: Enable RLS on the search criteria table if needed
2. **API Keys**: Use environment variables for sensitive data
3. **Rate Limiting**: Consider implementing rate limiting for the Edge Function
4. **Input Validation**: The function validates embedding dimensions and required parameters

## Table Name Mapping

The system uses a consistent naming convention:

- **Vector Table**: `a_00435_contracts_post_vector` (actual table with embeddings)
- **Search Function**: `contracts_post_award_search_match_documents_with_json_filters`
- **Search Criteria**: References the exact table name `a_00435_contracts_post_vector`

The Edge Function automatically maps table names to their corresponding search functions:
- `a_00435_contracts_post_vector` → `contracts_post_award_search_match_documents_with_json_filters`
- For other tables: `a_XXXXX_tablename_vector` → `XXXXX_tablename_search_match_documents_with_json_filters`

## Extending the System

### Adding New Tables

1. Create a new search function for your table:
```sql
CREATE OR REPLACE FUNCTION your_table_search_match_documents_with_json_filters(
    query_embedding vector (1536),
    match_count integer,
    filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id uuid,
    content text,
    metadata jsonb,
    similarity double precision
)
LANGUAGE plpgsql
AS $$
-- Implementation similar to contracts_post_award_search_match_documents_with_json_filters
-- but referencing your specific table name
$$;
```

2. Add the table mapping in the Edge Function:
```typescript
case 'a_XXXXX_your_table_vector':
  searchFunction = 'your_table_search_match_documents_with_json_filters'
  break
```

3. Add search criteria for the new table:
```sql
INSERT INTO vector_search_criteria (table_name, search_name, description, filter_criteria)
VALUES ('a_XXXXX_your_table_vector', 'your_search', 'Description', '{"field": "value"}');
```

### Custom Client Methods

Add new methods to the VectorSearchClient class:

```javascript
async searchYourCustomCriteria(query_embedding, match_count = 10) {
  return this.search({
    query_embedding,
    search_name: 'your_custom_search',
    match_count
  });
}
```

## Troubleshooting

### Common Issues

1. **Function not found**: Ensure the Edge Function is deployed
2. **Search criteria not found**: Check the search_name and table_name
3. **Embedding dimension error**: Ensure your embedding has exactly 1536 dimensions
4. **Permission errors**: Verify your API keys and RLS policies

### Debug Mode

Enable detailed logging in the Edge Function by checking the Supabase dashboard logs.

## Files Created

- `sql/create_search_criteria_table.sql` - Database table setup
- `supabase/functions/vector-search/index.ts` - Edge Function
- `client-vector-search.js` - Client library
- `test-supabase-search.cjs` - Test script
- `SUPABASE_VECTOR_SEARCH_SETUP.md` - This setup guide

## Next Steps

1. Run the SQL script to create the table
2. Deploy the Edge Function
3. Test with your embedding data
4. Add more search criteria as needed
5. Integrate into your application

The system is now ready for production use with dynamic, configurable vector searches!
