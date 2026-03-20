

## Overview

This document provides comprehensive documentation for the Supabase Vector Search System implemented for document similarity search across multiple disciplines using OpenAI embeddings.

## System Components

### 1. Database Components

#### Search Criteria Table
- **Table**: `vector_search_criteria`
- **Purpose**: Stores dynamic search configurations for all disciplines
- **Location**: `sql/create_enhanced_search_criteria_table.sql`

#### Vector Search Functions
- **Universal Function**: `universal_vector_search`
- **Reference ID Function**: `search_by_reference_id`
- **List Function**: `list_available_searches`
- **Location**: `sql/create_universal_vector_search_function.sql`

#### Discipline-Specific Functions
- **Contracts Function**: `a_00435_contracts_post_vector_search_match_documents_with_json_filters`
- **Location**: `sql/create_00435_contracts_search_function.sql`

### 2. Client Libraries

#### Complete Client Library
- **File**: `client-vector-search-complete.js`
- **Purpose**: Full-featured JavaScript client for vector search operations
- **Features**: RPC calls, convenience methods, statistics

#### Basic Client Library
- **File**: `client-vector-search.js`
- **Purpose**: Simplified client for basic vector search operations

### 3. Integration Components

#### Flowise Integration
- **Documentation**: `FLOWISE_SUPABASE_SETUP.md`
- **Purpose**: Configure Flowise to use vector search functions
- **Method**: RPC calls to Supabase functions

#### Edge Functions (Alternative)
- **File**: `supabase/functions/vector-search/index.ts`
- **Purpose**: HTTP endpoint for vector search (alternative to RPC)

## Architecture

### Multi-Discipline Support

The system supports 100+ disciplines through:

1. **Dynamic Search Criteria**: Stored in database table
2. **Universal Functions**: Handle all disciplines automatically
3. **Table Name Mapping**: Automatic function resolution
4. **Centralized Management**: Update criteria without code changes

### Supported Disciplines

#### Contracts Post-Award (00435)
- Table: `a_00435_contracts_post_vector`
- Searches: VI-003, variation instructions, urgent documents

#### Civil Engineering (00850)
- Table: `a_00850_civil_engineering_vector`
- Searches: Foundation specs, structural drawings, concrete specs

#### Electrical Engineering (00860)
- Table: `a_00860_electrical_engineering_vector`
- Searches: Power systems, control panels, lighting design

#### Mechanical Engineering (00870)
- Table: `a_00870_mechanical_engineering_vector`
- Searches: Pump specs, HVAC systems, piping drawings

## Implementation Guide

### Step 1: Database Setup

1. Run `sql/create_enhanced_search_criteria_table.sql`
2. Run `sql/create_universal_vector_search_function.sql`
3. Run discipline-specific function scripts as needed

### Step 2: Client Integration

#### JavaScript/Web Applications
```javascript
const vectorSearch = new VectorSearchClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

const results = await vectorSearch.searchVI003(queryEmbedding, 10);
```

#### Flowise Integration
```
RPC Function: universal_vector_search
Parameters: {
  "query_embedding": "{{embedding}}",
  "search_name_param": "vi_003_search",
  "discipline_param": "contracts_post_award",
  "match_count_param": 10
}
```

### Step 3: Search Criteria Management

#### Add New Search Criteria
```sql
INSERT INTO vector_search_criteria (discipline, table_name, search_name, description, filter_criteria)
VALUES ('new_discipline', 'a_XXXXX_new_table_vector', 'search_name', 'Description', '{"field": "value"}');
```

#### Update Existing Criteria
```sql
UPDATE vector_search_criteria 
SET filter_criteria = '{"updated_field": "new_value"}'
WHERE search_name = 'existing_search';
```

## API Reference

### Universal Vector Search

#### Function: `universal_vector_search`

**Parameters:**
- `query_embedding`: vector(1536) - OpenAI embedding
- `search_name_param`: text - Search configuration name
- `discipline_param`: text - Optional discipline filter
- `match_count_param`: integer - Number of results (default: 10)

**Returns:**
- `id`: uuid - Document ID
- `content`: text - Document content
- `metadata`: jsonb - Document metadata
- `similarity`: double precision - Similarity score
- `search_info`: jsonb - Search metadata

### Search by Reference ID

#### Function: `search_by_reference_id`

**Parameters:**
- `query_embedding`: vector(1536) - OpenAI embedding
- `reference_id_param`: text - Reference ID to search for
- `discipline_param`: text - Discipline (default: 'contracts_post_award')
- `match_count_param`: integer - Number of results (default: 10)

### List Available Searches

#### Function: `list_available_searches`

**Parameters:**
- `discipline_filter`: text - Optional discipline filter

**Returns:**
- `discipline`: text - Discipline name
- `search_name`: text - Search configuration name
- `description`: text - Search description
- `table_name`: text - Vector table name
- `filter_criteria`: jsonb - Filter configuration

## Performance Considerations

### Embedding Dimensions
- **Required**: Exactly 1536 dimensions for OpenAI embeddings
- **Validation**: Automatic dimension checking in functions

### Query Performance
- **Indexes**: Proper indexes on vector columns
- **Limits**: Reasonable match_count limits (typically ≤ 50)
- **Caching**: Consider caching frequently used search criteria

### Scaling
- **Multiple Tables**: Each discipline can have its own vector table
- **Function Mapping**: Automatic function resolution based on table names
- **Dynamic Criteria**: Add new search types without code deployment

## Security

### Access Control
- **RLS**: Row Level Security can be enabled on search criteria table
- **Function Permissions**: Granted to authenticated and anonymous users
- **API Keys**: Use environment variables for sensitive credentials

### Input Validation
- **Embedding Validation**: Dimension and type checking
- **Parameter Sanitization**: SQL injection prevention
- **Error Handling**: Comprehensive error messages without exposing internals

## Troubleshooting

### Common Issues

#### Function Not Found
- **Cause**: Function not deployed or incorrect name
- **Solution**: Verify function exists in Supabase dashboard

#### Search Criteria Not Found
- **Cause**: Invalid search_name or discipline
- **Solution**: Check available searches with `list_available_searches`

#### Embedding Dimension Error
- **Cause**: Incorrect embedding dimensions
- **Solution**: Ensure exactly 1536 dimensions for OpenAI embeddings

#### Permission Errors
- **Cause**: Insufficient database permissions
- **Solution**: Verify API keys and RLS policies

### Debug Mode

Enable detailed logging by checking function execution logs in Supabase dashboard.

## Maintenance

### Adding New Disciplines

1. **Create Vector Table**: Follow naming convention `a_XXXXX_discipline_vector`
2. **Create Search Function**: Use template from existing functions
3. **Add Search Criteria**: Insert configurations into criteria table
4. **Update Documentation**: Add to supported disciplines list

### Updating Search Criteria

Search criteria can be updated dynamically without code changes:

```sql
-- Update filter criteria
UPDATE vector_search_criteria 
SET filter_criteria = '{"new_filter": "value"}'
WHERE search_name = 'search_to_update';

-- Disable search
UPDATE vector_search_criteria 
SET is_active = false 
WHERE search_name = 'deprecated_search';
```

### Monitoring

Monitor system performance through:
- **Query Execution Time**: Track search response times
- **Error Rates**: Monitor function execution errors
- **Usage Patterns**: Analyze most frequently used searches

## Related Documentation

- [1351 Vector Search Implementation Guide](1351_VECTOR_SEARCH_IMPLEMENTATION.md)
- [1352 Flowise Vector Search Integration](1352_FLOWISE_VECTOR_SEARCH.md)
- [0500 Supabase](0500_SUPABASE.md) - General Supabase documentation
- [0300 Database Schema](0300_DATABASE_SCHEMA.md) - Database architecture

## Version History

### Version 1.0.0 (Current)
- Initial implementation with multi-discipline support
- Universal search functions
- Dynamic search criteria management
- Flowise integration
- Client libraries for JavaScript/web applications
- Comprehensive documentation and setup guides
