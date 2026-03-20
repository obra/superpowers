# Flowise Supabase Vector Search Setup

Based on your Flowise screenshot, here's how to configure it to use our vector search system.

## Current Flowise Configuration

I can see you have:
- **OpenAI Embeddings**: `text-embedding-3-small`
- **Supabase**: Connected to your project
- **Table Name**: `a_00435_contracts_post_vector` (note: should be `a_00435_contracts_post_vector`)
- **Query Name**: `search_a_00435_contracts_post_vector`

## ✅ **Recommended: Use RPC Option**

Instead of the "Query" option, use **RPC** to call our universal search functions.

### Step 1: Change to RPC Configuration

In your Flowise Supabase node:

1. **Select "RPC" instead of "Query"**
2. **RPC Function Name**: `universal_vector_search`
3. **Remove the "Query Name" field** (not needed for RPC)

### Step 2: RPC Parameters

Configure these parameters for the RPC call:

```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "vi_003_search",
  "discipline_param": "contracts_post_award", 
  "match_count_param": 10
}
```

### Step 3: Alternative RPC Functions

You can use any of these RPC functions:

#### Option A: Universal Search
```
RPC Function: universal_vector_search
Parameters:
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "vi_003_search",
  "discipline_param": "contracts_post_award",
  "match_count_param": 10
}
```

#### Option B: Search by Reference ID
```
RPC Function: search_by_reference_id
Parameters:
{
  "query_embedding": "{{embedding}}",
  "reference_id_param": "VI-003",
  "discipline_param": "contracts_post_award",
  "match_count_param": 10
}
```

#### Option C: List Available Searches
```
RPC Function: list_available_searches
Parameters:
{
  "discipline_filter": "contracts_post_award"
}
```

## 🔧 **If You Prefer to Keep Using Query**

If you want to stick with the "Query" approach, you need to:

### Step 1: Fix Table Name
Change from: `a_00435_contracts_post_vector`
To: `a_00435_contracts_post_vector` (add the missing zero)

### Step 2: Update Query Name
Change from: `search_a_00435_contracts_post_vector`
To: `contracts_post_award_search_match_documents_with_json_filters`

### Step 3: Add Supabase RPC Filter
In the "Supabase RPC Filter" field, add:
```javascript
.filter("metadata->reference_id", "eq", "VI-003")
```

## 📋 **Complete Flowise Configuration (RPC Method)**

```
OpenAI Embeddings:
├── Model: text-embedding-3-small
├── Strip New Lines: [toggle as needed]
└── Batch Size: [default]

Supabase:
├── Connect Credential: [your credential]
├── Supabase Project URL: https://mseizswolwyewsidknta.supabase.co/
├── Table Name: [leave empty for RPC]
├── Query Name: [leave empty for RPC]
├── RPC Function: universal_vector_search
├── RPC Parameters: 
│   {
│     "query_embedding": "{{embedding}}",
│     "search_name_param": "vi_003_search", 
│     "discipline_param": "contracts_post_award",
│     "match_count_param": 10
│   }
└── Top K: [leave empty, handled by match_count_param]
```

## 🎯 **Benefits of RPC Approach**

1. **Dynamic Search Criteria**: Change search without modifying Flowise
2. **Multi-Discipline Support**: Search across all 100+ disciplines
3. **Centralized Management**: Update search criteria in database
4. **Better Error Handling**: More detailed error messages
5. **Metadata Included**: Get search info with results

## 🔄 **Dynamic Search Names**

You can make the search dynamic by using variables:

```json
{
  "query_embedding": "{{embedding}}",
  "search_name_param": "{{searchType}}",
  "discipline_param": "{{discipline}}",
  "match_count_param": "{{topK}}"
}
```

Where `searchType`, `discipline`, and `topK` are variables you can set in your Flowise flow.

## 📊 **Available Search Names**

Based on your search criteria table:

**Contracts Post-Award:**
- `vi_003_search`
- `variation_instructions` 
- `unsigned_documents`
- `durban_project`
- `urgent_variations`

**Civil Engineering:**
- `foundation_specs`
- `structural_drawings`
- `concrete_specs`

**Electrical Engineering:**
- `power_systems`
- `control_panels`
- `lighting_design`

**Mechanical Engineering:**
- `pump_specs`
- `hvac_systems`
- `piping_drawings`

## 🚀 **Quick Test**

To test your setup:

1. Use RPC function: `list_available_searches`
2. Parameters: `{"discipline_filter": "contracts_post_award"}`
3. This should return all available search configurations

This will confirm your SQL functions are working and accessible from Flowise!
