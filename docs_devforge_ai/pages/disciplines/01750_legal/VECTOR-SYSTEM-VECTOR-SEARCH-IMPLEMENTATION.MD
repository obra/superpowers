# Vector Search Implementation Guide

## Overview

This document provides step-by-step implementation instructions for setting up the Supabase Vector Search System across multiple disciplines.

## Prerequisites

- Supabase project with database access
- OpenAI API access for embeddings
- Vector extension enabled in Supabase
- SQL Editor access for initial setup

## Implementation Steps

### Step 1: Database Setup

#### 1.1 Create Search Criteria Table

Run the following SQL script in Supabase SQL Editor:

**File**: `sql/create_enhanced_search_criteria_table.sql`

This creates:
- `vector_search_criteria` table for dynamic search configurations
- Sample search criteria for multiple disciplines
- Indexes for performance optimization
- Triggers for automatic timestamp updates

#### 1.2 Create Universal Search Functions

Run the following SQL script:

**File**: `sql/create_universal_vector_search_function.sql`

This creates:
- `universal_vector_search()` - Main search function
- `search_by_reference_id()` - Quick reference ID search
- `list_available_searches()` - View available configurations

#### 1.3 Create Discipline-Specific Functions

For each discipline, create specific search functions:

**Contracts Post-Award**:
```sql
-- File: sql/create_00435_contracts_search_function.sql
-- Creates: a_00435_contracts_post_vector_search_match_documents_with_json_filters
```

**Additional Disciplines**:
Follow the same pattern for other disciplines:
- Civil Engineering: `a_00850_civil_engineering_vector_search_match_documents_with_json_filters`
- Electrical Engineering: `a_00860_electrical_engineering_vector_search_match_documents_with_json_filters`
- Mechanical Engineering: `a_00870_mechanical_engineering_vector_search_match_documents_with_json_filters`

### Step 2: Verify Database Setup

#### 2.1 Test Search Criteria Table

```sql
-- Verify table creation
SELECT COUNT(*) FROM vector_search_criteria;

-- List available searches
SELECT discipline, search_name, description 
FROM vector_search_criteria 
WHERE is_active = true
ORDER BY discipline, search_name;
```

#### 2.2 Test Universal Functions

```sql
-- Test list function
SELECT * FROM list_available_searches('contracts_post_award');

-- Test universal search (with sample embedding)
SELECT * FROM universal_vector_search(
    '[0.1,0.2,0.3,...]'::vector,  -- Replace with actual embedding
    'vi_003_search',
    'contracts_post_award',
    5
);
```

### Step 3: Client Integration

#### 3.1 JavaScript/Web Applications

**Installation**:
```javascript
// Include the client library
const VectorSearchClient = require('./client-vector-search-complete.js');
// or for browser: <script src="client-vector-search-complete.js"></script>
```

**Basic Usage**:
```javascript
// Initialize client
const vectorSearch = new VectorSearchClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Load embedding (1536 dimensions for OpenAI)
const queryEmbedding = [/* your embedding array */];

// Search for VI-003 documents
try {
  const results = await vectorSearch.searchVI003(queryEmbedding, 10);
  console.log('Found documents:', results);
} catch (error) {
  console.error('Search failed:', error);
}
```

**Advanced Usage**:
```javascript
// Universal search with custom criteria
const customResults = await vectorSearch.universalSearch({
  query_embedding: queryEmbedding,
  search_name: 'urgent_variations',
  discipline: 'contracts_post_award',
  match_count: 5
});

// Search by reference ID
const refResults = await vectorSearch.searchByReferenceId(
  queryEmbedding,
  'VI-003',
  'contracts_post_award',
  10
);

// Get search statistics
const stats = await vectorSearch.getSearchStatistics();
console.log('Available searches:', stats);
```

#### 3.2 Node.js Backend Integration

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-service-role-key'
);

async function performVectorSearch(embedding, searchName, discipline) {
  const { data, error } = await supabase.rpc('universal_vector_search', {
    query_embedding: embedding,
    search_name_param: searchName,
    discipline_param: discipline,
    match_count_param: 10
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return data;
}
```

### Step 4: Flowise Integration

#### 4.1 Configure Supabase Node in Flowise

**Connection Settings**:
- Supabase Project URL: `https://your-project.supabase.co`
- Connect Credential: Your Supabase credential
- Method: **RPC** (not Query)

**RPC Configuration**:
- RPC Function: `universal_vector_search`
- Clear Table Name and Query Name fields

#### 4.2 RPC Parameters

For VI-003 search:
```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "vi_003_search",
  "discipline_param": "contracts_post_award",
  "match_count_param": 10
}
```

For dynamic search:
```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "{{searchType}}",
  "discipline_param": "{{discipline}}",
  "match_count_param": "{{topK}}"
}
```

### Step 5: Adding New Disciplines

#### 5.1 Create Vector Table

Follow the naming convention:
```sql
CREATE TABLE a_XXXXX_discipline_vector (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT,
  metadata JSONB,
  embedding VECTOR(1536)
);

-- Create vector index
CREATE INDEX ON a_XXXXX_discipline_vector 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 5.2 Create Search Function

Use the template from existing functions:
```sql
CREATE OR REPLACE FUNCTION a_XXXXX_discipline_vector_search_match_documents_with_json_filters(
    query_embedding vector(1536),
    match_count integer,
    filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id uuid,
    content text,
    metadata jsonb,
    similarity double precision
)
-- Implementation follows existing pattern
```

#### 5.3 Add Search Criteria

```sql
INSERT INTO vector_search_criteria (discipline, table_name, search_name, description, filter_criteria)
VALUES 
('new_discipline', 'a_XXXXX_discipline_vector', 'search_name_1', 'Description 1', '{"field1": "value1"}'),
('new_discipline', 'a_XXXXX_discipline_vector', 'search_name_2', 'Description 2', '{"field2": "value2"}');
```

### Step 6: Testing and Validation

#### 6.1 Unit Testing

Create test scripts for each component:

**Database Functions**:
```sql
-- Test universal search
SELECT * FROM universal_vector_search(
    '[0.1,0.2,...]'::vector,
    'test_search',
    'test_discipline',
    5
);
```

**Client Library**:
```javascript
// Test client functionality
async function testVectorSearch() {
  const client = new VectorSearchClient(url, key);
  
  // Test list function
  const searches = await client.listAvailableSearches();
  console.assert(searches.length > 0, 'Should return available searches');
  
  // Test search function
  const results = await client.searchVI003(testEmbedding, 5);
  console.assert(Array.isArray(results), 'Should return array of results');
}
```

#### 6.2 Integration Testing

**Flowise Integration**:
1. Configure Flowise with test parameters
2. Send test query through Flowise
3. Verify results are returned correctly
4. Check response format and metadata

**Performance Testing**:
```javascript
// Measure search performance
const startTime = Date.now();
const results = await vectorSearch.searchVI003(embedding, 10);
const duration = Date.now() - startTime;
console.log(`Search completed in ${duration}ms`);
```

### Step 7: Production Deployment

#### 7.1 Environment Configuration

**Development**:
```env
SUPABASE_URL=https://dev-project.supabase.co
SUPABASE_ANON_KEY=dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=dev_service_key
```

**Production**:
```env
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
```

#### 7.2 Security Configuration

**Row Level Security** (optional):
```sql
-- Enable RLS on search criteria table
ALTER TABLE vector_search_criteria ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to read search criteria"
ON vector_search_criteria FOR SELECT
TO authenticated
USING (true);
```

**Function Permissions**:
```sql
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION universal_vector_search TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_by_reference_id TO authenticated, anon;
GRANT EXECUTE ON FUNCTION list_available_searches TO authenticated, anon;
```

#### 7.3 Monitoring Setup

**Performance Monitoring**:
- Track query execution times
- Monitor error rates
- Set up alerts for failures

**Usage Analytics**:
- Log search patterns
- Track most popular searches
- Monitor system load

### Step 8: Maintenance Procedures

#### 8.1 Regular Maintenance

**Weekly**:
- Review search performance metrics
- Check for failed queries
- Update search criteria as needed

**Monthly**:
- Analyze usage patterns
- Optimize frequently used searches
- Review and update documentation

#### 8.2 Troubleshooting Procedures

**Common Issues**:
1. **Function not found**: Verify function deployment
2. **Permission errors**: Check API keys and RLS policies
3. **Slow queries**: Review indexes and query complexity
4. **Embedding errors**: Validate embedding dimensions

**Debug Steps**:
1. Check Supabase function logs
2. Verify search criteria configuration
3. Test with simplified queries
4. Review client library error handling

## Best Practices

### Performance Optimization

1. **Limit Result Sets**: Use reasonable match_count values (≤ 50)
2. **Index Optimization**: Ensure proper vector indexes
3. **Caching**: Cache frequently used search criteria
4. **Batch Processing**: Group multiple searches when possible

### Security Best Practices

1. **API Key Management**: Use environment variables
2. **Input Validation**: Validate all user inputs
3. **Error Handling**: Don't expose internal details
4. **Access Control**: Implement appropriate RLS policies

### Maintenance Best Practices

1. **Version Control**: Track all database schema changes
2. **Backup Strategy**: Regular backups of search criteria
3. **Documentation**: Keep documentation updated
4. **Testing**: Comprehensive test coverage

## Related Documentation

- [1350 Vector Search System](1350_VECTOR_SEARCH_SYSTEM.md) - System overview
- [1352 Flowise Vector Search Integration](1352_FLOWISE_VECTOR_SEARCH.md) - Flowise-specific setup
- [0500 Supabase](0500_SUPABASE.md) - General Supabase documentation
