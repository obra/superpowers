# Supabase Vector Search Test - Summary

## Overview
Successfully created a comprehensive test script for the Supabase vector search functionality using OpenAI embeddings. The test searches for documents with `reference_id: "VI-003"` using a 1536-dimensional embedding vector.

## Files Created
- `test-supabase-search.cjs` - Main test script (CommonJS format)
- `supabase-search-test-summary.md` - This summary document

## Test Configuration
- **Target Reference ID**: VI-003
- **Match Count**: 10 documents
- **Embedding Dimensions**: 1536
- **Filter**: `{"reference_id": "VI-003"}`
- **Table**: `a_00435_contracts_post_vector`
- **Function**: `contracts_post_award_search_match_documents_with_json_filters`

## Generated Outputs

### 1. SQL Query (Ready to use in Supabase SQL Editor)
```sql
SELECT * FROM public.contracts_post_award_search_match_documents_with_json_filters(
    '[embedding_vector]'::vector,
    10,
    '{"reference_id":"VI-003"}'::jsonb
);
```

### 2. Supabase CLI Command
```bash
supabase db query --project-ref YOUR_PROJECT_REF --sql "SELECT * FROM public.contracts_post_award_search_match_documents_with_json_filters('[embedding_vector]'::vector, 10, '{\"reference_id\":\"VI-003\"}'::jsonb);"
```

### 3. Alternative Direct Query (For debugging)
```sql
SELECT 
    id, 
    content, 
    metadata,
    1 - (embedding <=> '[embedding_vector]'::vector) AS similarity
FROM public.a_00435_contracts_post_vector 
WHERE metadata->>'reference_id' = 'VI-003'
ORDER BY similarity DESC 
LIMIT 10;
```

### 4. Node.js Client Code
Complete JavaScript code using `@supabase/supabase-js` client library for programmatic access.

## Usage Instructions

1. **Replace Configuration Values**:
   - `YOUR_SUPABASE_URL` - Your Supabase project URL
   - `YOUR_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `YOUR_PROJECT_REF` - Your Supabase project reference

2. **Choose Testing Method**:
   - **SQL Editor**: Copy the SQL query directly into Supabase SQL Editor
   - **CLI**: Use the generated CLI command (requires Supabase CLI)
   - **Node.js**: Use the provided client code in a separate script

3. **Verify Table Name**: Ensure the table name `a_00435_contracts_post_vector` matches your actual table

## Expected Results
The query will return up to 10 documents that:
- Have `reference_id = "VI-003"` in their metadata
- Are ordered by similarity score (highest first)
- Include fields: `id`, `content`, `metadata`, `similarity`

## Embedding Data Source
- **File**: `/Users/alistairtennant/Downloads/SI-003_simulated_embedding.json`
- **Format**: 1536-dimensional float array
- **Successfully loaded**: ✓

## Function Details
The test uses the existing PostgreSQL function:
- **Name**: `contracts_post_award_search_match_documents_with_json_filters`
- **Parameters**: 
  - `query_embedding` (vector 1536)
  - `match_count` (integer)
  - `filter` (jsonb)
- **Returns**: Table with id, content, metadata, similarity

## Next Steps
1. Replace placeholder values with actual Supabase credentials
2. Execute the query using your preferred method
3. Verify results match expected document with reference_id "VI-003"
4. Adjust filter criteria or match count as needed for further testing

## Notes
- The script automatically loads the embedding from the JSON file
- All queries are pre-formatted and ready to use
- The embedding vector is properly formatted for PostgreSQL vector operations
- Error handling is included in the Node.js client code
