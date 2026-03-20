# Discipline Management Strategy for Vector Search

## Current Setup Analysis

### What We Have:
- **Search Criteria Table**: `vector_search_criteria` (universal)
- **Edge Function**: `vector-search` (universal) 
- **Database Function**: `contracts_post_award_search_match_documents_with_json_filters` (specific)

### The Challenge:
You have 100+ disciplines, each potentially needing different search criteria.

## Recommended Strategy: Unified System

### Option 1: One Table, One Function (RECOMMENDED)

**Benefits:**
- ✅ Scalable to 100+ disciplines
- ✅ Easy to manage and maintain
- ✅ Dynamic configuration without code changes
- ✅ Consistent API across all disciplines

**Structure:**
```sql
-- One table handles all disciplines
vector_search_criteria:
- table_name: "a_00435_contracts_post_vector", "a_00850_civil_engineering_vector", etc.
- search_name: "contracts_vi_003", "civil_foundation_specs", etc.
- discipline: "contracts post-award", "civil engineering", etc.
- filter_criteria: {"reference_id": "VI-003"}, {"spec_type": "foundation"}, etc.
```

**Implementation:**
1. **One Search Criteria Table** with discipline field
2. **One Edge Function** that routes to appropriate database functions
3. **Multiple Database Functions** (one per vector table/discipline)

### Option 2: Multiple Tables, Multiple Functions (NOT RECOMMENDED)

**Problems:**
- ❌ 100+ tables to manage
- ❌ 100+ Edge Functions to deploy
- ❌ Complex maintenance
- ❌ Code duplication

## Recommended Implementation

### 1. Enhanced Search Criteria Table

```sql
CREATE TABLE IF NOT EXISTS public.vector_search_criteria (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discipline TEXT NOT NULL,                    -- NEW: discipline identifier
    table_name TEXT NOT NULL,                   -- vector table name
    search_name TEXT NOT NULL,                  -- unique search identifier
    description TEXT,
    filter_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination
    CONSTRAINT unique_discipline_search UNIQUE (discipline, search_name)
);
```

### 2. Sample Data for Multiple Disciplines

```sql
-- Contracts Post-Award
INSERT INTO vector_search_criteria (discipline, table_name, search_name, description, filter_criteria) VALUES
('contracts_post_award', 'a_00435_contracts_post_vector', 'vi_003_search', 'VI-003 variation instructions', '{"reference_id": "VI-003"}'),
('contracts_post_award', 'a_00435_contracts_post_vector', 'urgent_variations', 'Urgent variation documents', '{"priority": "urgent", "document_type": "variation"}'),

-- Civil Engineering  
('civil_engineering', 'a_00850_civil_engineering_vector', 'foundation_specs', 'Foundation specifications', '{"spec_type": "foundation", "status": "approved"}'),
('civil_engineering', 'a_00850_civil_engineering_vector', 'structural_drawings', 'Structural drawings', '{"document_type": "drawing", "category": "structural"}'),

-- Electrical Engineering
('electrical_engineering', 'a_00860_electrical_engineering_vector', 'power_systems', 'Power system documents', '{"system_type": "power", "voltage_level": "high"}'),
('electrical_engineering', 'a_00860_electrical_engineering_vector', 'control_panels', 'Control panel specifications', '{"equipment_type": "control_panel"}');
```

### 3. Enhanced Edge Function Logic

```typescript
// Enhanced table to function mapping
function getSearchFunction(tableName: string): string {
  const functionMap: Record<string, string> = {
    'a_00435_contracts_post_vector': 'contracts_post_award_search_match_documents_with_json_filters',
    'a_00850_civil_engineering_vector': 'civil_engineering_search_match_documents_with_json_filters',
    'a_00860_electrical_engineering_vector': 'electrical_engineering_search_match_documents_with_json_filters',
    // Add more mappings as needed
  };
  
  return functionMap[tableName] || `${tableName.replace(/^a_\d+_/, '').replace(/_vector$/, '')}_search_match_documents_with_json_filters`;
}
```

### 4. Client Usage Examples

```javascript
// Search by discipline and search name
const results = await vectorSearch.search({
  query_embedding: embedding,
  search_name: 'vi_003_search',
  discipline: 'contracts_post_award',  // Optional filter
  match_count: 10
});

// Search across all disciplines
const allResults = await vectorSearch.search({
  query_embedding: embedding,
  search_name: 'urgent_documents',  // If this exists across disciplines
  match_count: 10
});
```

## Management Strategies

### 1. Discipline-Based Organization

```sql
-- View searches by discipline
SELECT * FROM vector_search_criteria 
WHERE discipline = 'contracts_post_award' 
AND is_active = true;

-- Add new search for a discipline
INSERT INTO vector_search_criteria (discipline, table_name, search_name, description, filter_criteria)
VALUES ('mechanical_engineering', 'a_00870_mechanical_engineering_vector', 'pump_specs', 'Pump specifications', '{"equipment_type": "pump"}');
```

### 2. Bulk Management

```sql
-- Disable all searches for a discipline
UPDATE vector_search_criteria 
SET is_active = false 
WHERE discipline = 'old_discipline';

-- Copy search criteria to new discipline
INSERT INTO vector_search_criteria (discipline, table_name, search_name, description, filter_criteria)
SELECT 'new_discipline', 'a_XXXXX_new_discipline_vector', search_name, description, filter_criteria
FROM vector_search_criteria 
WHERE discipline = 'template_discipline';
```

## Recommended File Structure

```
sql/
├── create_search_criteria_table.sql          # Universal table
├── disciplines/
│   ├── contracts_post_award_function.sql     # Specific DB function
│   ├── civil_engineering_function.sql        # Specific DB function
│   ├── electrical_engineering_function.sql   # Specific DB function
│   └── ...                                   # One per discipline

supabase/functions/
└── vector-search/
    └── index.ts                              # Universal Edge Function

client/
└── vector-search-client.js                  # Universal client
```

## Benefits of This Approach

1. **Scalability**: Easily add new disciplines without code changes
2. **Maintainability**: One codebase to maintain
3. **Flexibility**: Each discipline can have unique search criteria
4. **Performance**: Efficient querying with proper indexing
5. **Consistency**: Same API across all disciplines

## Next Steps

1. **Enhance the search criteria table** with discipline field
2. **Create database functions** for each discipline's vector table
3. **Update Edge Function** with comprehensive table mapping
4. **Add discipline-specific search criteria** for your 100+ disciplines
5. **Create management scripts** for bulk operations

Would you like me to implement this enhanced multi-discipline approach?
