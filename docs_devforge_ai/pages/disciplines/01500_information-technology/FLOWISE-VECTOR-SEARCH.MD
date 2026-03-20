# Flowise Vector Search Integration

## Overview

This document provides detailed instructions for integrating the Supabase Vector Search System with Flowise for AI-powered document retrieval and question answering.

## Prerequisites

- Flowise instance running and accessible
- Supabase Vector Search System implemented (see [1351 Vector Search Implementation](1351_VECTOR_SEARCH_IMPLEMENTATION.md))
- OpenAI API access for embeddings
- Supabase credentials configured in Flowise

## Flowise Configuration

### Step 1: Supabase Credentials Setup

#### 1.1 Create Supabase Credential

In Flowise:
1. Navigate to **Credentials**
2. Click **Add Credential**
3. Select **Supabase**
4. Configure:
   - **Name**: `Supabase-VectorSearch`
   - **Supabase Project URL**: `https://your-project.supabase.co`
   - **Supabase API Key**: Your anon key

#### 1.2 OpenAI Credentials

1. Navigate to **Credentials**
2. Click **Add Credential**
3. Select **OpenAI**
4. Configure:
   - **Name**: `OpenAI-Embeddings`
   - **API Key**: Your OpenAI API key

### Step 2: Document Store Configuration

#### 2.1 OpenAI Embeddings Node

Configure the OpenAI Embeddings node:

```
Model Name: text-embedding-3-small
Strip New Lines: [toggle as needed]
Batch Size: [default or adjust based on usage]
Timeout: [default]
BasePath: [default]
```

#### 2.2 Supabase Vector Store Node

Configure the Supabase node for **RPC method**:

```
Connect Credential: Supabase-VectorSearch
Supabase Project URL: https://your-project.supabase.co
Table Name: [LEAVE EMPTY for RPC]
Query Name: [LEAVE EMPTY for RPC]
RPC Function: universal_vector_search
Supabase Metadata Filter: [LEAVE EMPTY]
Supabase RPC Filter: [LEAVE EMPTY]
Top K: [LEAVE EMPTY - handled by RPC parameters]
```

### Step 3: RPC Parameters Configuration

#### 3.1 Basic VI-003 Search

For searching VI-003 documents:

**RPC Function**: `universal_vector_search`

**RPC Parameters**:
```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "vi_003_search",
  "discipline_param": "contracts_post_award",
  "match_count_param": 10
}
```

#### 3.2 Dynamic Search Configuration

For flexible search across disciplines:

**RPC Function**: `universal_vector_search`

**RPC Parameters**:
```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "{{searchType}}",
  "discipline_param": "{{discipline}}",
  "match_count_param": "{{topK}}"
}
```

**Variables to define in Flowise**:
- `searchType`: Search configuration name
- `discipline`: Discipline filter
- `topK`: Number of results

#### 3.3 Reference ID Search

For searching by specific reference IDs:

**RPC Function**: `search_by_reference_id`

**RPC Parameters**:
```json
{
  "query_embedding": "{{embedding}}",
  "reference_id_param": "{{referenceId}}",
  "discipline_param": "{{discipline}}",
  "match_count_param": "{{topK}}"
}
```

### Step 4: Alternative Query Method

If RPC method doesn't work, use the Query method:

#### 4.1 Query Configuration

```
Table Name: a_00435_contracts_post_vector
Query Name: a_00435_contracts_post_vector_search_match_documents_with_json_filters
Supabase Metadata Filter: [EMPTY]
Supabase RPC Filter: [EMPTY]
Top K: 10
```

#### 4.2 Adding Filters (Optional)

To filter by reference ID using Query method:

**Supabase RPC Filter**:
```javascript
metadata->reference_id.eq.VI-003
```

Or using JSON format:
```json
{"metadata->reference_id": "VI-003"}
```

## Flow Examples

### Example 1: Basic Document Q&A Flow

```
User Input → OpenAI Embeddings → Supabase Vector Store → LLM → Response
```

**Configuration**:
1. **Chat Input**: User question
2. **OpenAI Embeddings**: Convert question to vector
3. **Supabase Vector Store**: Search similar documents
4. **OpenAI Chat**: Generate answer from retrieved documents
5. **Chat Output**: Return response to user

### Example 2: Multi-Discipline Search Flow

```
User Input → Discipline Classifier → OpenAI Embeddings → Supabase Vector Store → LLM → Response
```

**Configuration**:
1. **Chat Input**: User question
2. **Custom Function**: Determine discipline from question
3. **OpenAI Embeddings**: Convert question to vector
4. **Supabase Vector Store**: Search with dynamic discipline
5. **OpenAI Chat**: Generate answer with context
6. **Chat Output**: Return response with source info

### Example 3: Reference ID Lookup Flow

```
Reference ID Input → OpenAI Embeddings → Supabase Vector Store → Document Summary → Response
```

**Configuration**:
1. **Text Input**: Reference ID (e.g., "VI-003")
2. **OpenAI Embeddings**: Convert to vector
3. **Supabase Vector Store**: Use `search_by_reference_id`
4. **OpenAI Chat**: Summarize found documents
5. **Text Output**: Return summary

## Advanced Configurations

### Custom Search Types

#### 4.1 Urgent Documents Search

**RPC Parameters**:
```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "urgent_variations",
  "discipline_param": "contracts_post_award",
  "match_count_param": 5
}
```

#### 4.2 Cross-Discipline Search

**RPC Parameters**:
```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "{{searchType}}",
  "discipline_param": null,
  "match_count_param": 15
}
```

### Dynamic Parameter Injection

#### 4.3 Using Variables in Flowise

Create variables for dynamic configuration:

**Global Variables**:
- `DEFAULT_DISCIPLINE`: "contracts_post_award"
- `DEFAULT_SEARCH_TYPE`: "vi_003_search"
- `DEFAULT_TOP_K`: 10

**RPC Parameters with Variables**:
```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "{{searchType || DEFAULT_SEARCH_TYPE}}",
  "discipline_param": "{{discipline || DEFAULT_DISCIPLINE}}",
  "match_count_param": "{{topK || DEFAULT_TOP_K}}"
}
```

## Error Handling

### Common Errors and Solutions

#### 4.1 "Cannot read properties of undefined (reading 'limit')"

**Cause**: Using Query method without proper table/function configuration
**Solution**: Switch to RPC method or fix table name

#### 4.2 "Unexpected token" Error

**Cause**: Syntax error in RPC Filter field
**Solution**: Clear RPC Filter field or fix JSON syntax

#### 4.3 "Function not found" Error

**Cause**: RPC function not deployed or incorrect name
**Solution**: Verify function exists in Supabase dashboard

#### 4.4 "Search criteria not found" Error

**Cause**: Invalid search_name or discipline parameter
**Solution**: Check available searches using `list_available_searches`

### Debug Configuration

#### 4.5 Test RPC Function

Use this configuration to test if RPC is working:

**RPC Function**: `list_available_searches`

**RPC Parameters**:
```json
{
  "discipline_filter": "contracts_post_award"
}
```

This should return available search configurations.

## Performance Optimization

### Embedding Optimization

#### 5.1 Batch Processing

For multiple queries, use batch processing:
- Set appropriate batch size in OpenAI Embeddings node
- Consider rate limits and costs

#### 5.2 Caching

Enable caching where possible:
- Cache frequently used embeddings
- Cache search results for identical queries

### Search Optimization

#### 5.3 Result Limiting

Optimize result counts:
- Use smaller `match_count` for faster responses
- Increase only when more context is needed

#### 5.4 Discipline Filtering

Use discipline filtering to improve performance:
- Filter by specific discipline when known
- Use broader searches only when necessary

## Monitoring and Analytics

### Flow Monitoring

#### 6.1 Response Time Tracking

Monitor search performance:
- Track embedding generation time
- Monitor vector search duration
- Measure total flow execution time

#### 6.2 Error Rate Monitoring

Track error patterns:
- Log failed searches
- Monitor RPC call failures
- Track embedding generation errors

### Usage Analytics

#### 6.3 Search Pattern Analysis

Analyze usage patterns:
- Most frequently used search types
- Popular disciplines
- Common reference IDs

#### 6.4 Performance Metrics

Key metrics to track:
- Average response time
- Search accuracy (user feedback)
- System availability

## Best Practices

### Configuration Best Practices

1. **Use RPC Method**: Preferred over Query method for flexibility
2. **Clear Unused Fields**: Remove Table Name and Query Name for RPC
3. **Validate Parameters**: Test RPC parameters before deployment
4. **Use Variables**: Implement dynamic configuration with variables

### Security Best Practices

1. **Credential Management**: Use Flowise credential system
2. **API Key Rotation**: Regularly rotate API keys
3. **Access Control**: Limit access to sensitive flows
4. **Input Validation**: Validate user inputs in custom functions

### Maintenance Best Practices

1. **Regular Testing**: Test flows after system updates
2. **Documentation**: Document custom configurations
3. **Backup Flows**: Export and backup flow configurations
4. **Version Control**: Track flow changes

## Troubleshooting Guide

### Step-by-Step Debugging

#### 7.1 Verify Credentials

1. Test Supabase connection in Flowise
2. Verify OpenAI API key is working
3. Check credential permissions

#### 7.2 Test Components Individually

1. Test OpenAI Embeddings node separately
2. Test Supabase RPC function directly
3. Verify flow connections

#### 7.3 Check Logs

1. Review Flowise execution logs
2. Check Supabase function logs
3. Monitor OpenAI API usage

### Common Configuration Issues

#### 7.4 RPC Parameter Format

Ensure RPC parameters are valid JSON:
```json
// Correct
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "vi_003_search"
}

// Incorrect
{
  query_embedding: "{{embedding}}",
  search_name_param: "vi_003_search"
}
```

#### 7.5 Variable Substitution

Verify variable names match exactly:
- Case-sensitive variable names
- Correct variable scope
- Proper variable definition

## Related Documentation

- [1350 Vector Search System](1350_VECTOR_SEARCH_SYSTEM.md) - System overview
- [1351 Vector Search Implementation](1351_VECTOR_SEARCH_IMPLEMENTATION.md) - Implementation guide
- [0500 Supabase](0500_SUPABASE.md) - General Supabase documentation

## Version History

### Version 1.0.0 (Current)
- Initial Flowise integration documentation
- RPC method configuration
- Error handling and troubleshooting
- Performance optimization guidelines
- Best practices and monitoring setup
