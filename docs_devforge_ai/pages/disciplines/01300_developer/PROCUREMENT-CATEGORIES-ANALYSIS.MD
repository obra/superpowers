# Procurement Categories Table Analysis

## Current Issues

Looking at the CSV data provided, I can see several major problems with the current table structure:

### 1. **Confusing Code System**
The current `level1_code` uses inconsistent alphabetical codes:
- Single letters: A, B, C, D, E, F, G, H, I, J, K, L, M (the 13 main groups)
- Double letters: AA, BB, CC, DD, EE, FF, GG, HH, II, JJ, KK, LL, MM, NN, OO, PP, QQ, RR, SS, TT, UU, VV, WW, XX, YY, ZZ
- Triple letters: AAA, BBB, CCC, DDD, EEE, FFF, GGG, HHH, III, JJJ, KKK, LLL, MMM, NNN, OOO, PPP, QQQ, RRR, SSS, TTT, UUU, VVV, WWW, XXX, YYY, ZZZ
- Quadruple letters: AAAA, BBBB, CCCC, DDDD, EEEE, FFFF, GGGG, HHHH, IIII, JJJJ, KKKK, LLLL, MMMM, NNNN

**Problem**: These codes don't indicate hierarchy! A user can't tell if "AA" is under "A" or if "AAAA" is related to "A" at all.

### 2. **Missing Hierarchy**
All rows have:
- `level1_code` populated (but with mixed hierarchy levels)
- `level1_name` populated (but these are actually items from different levels)
- `level2_code`, `level2_name`, `level3_code`, `level3_name` are ALL EMPTY

**Problem**: The table is flat - there's no actual 3-level hierarchy stored!

### 3. **Only 13 True Groups**
The actual 13 main groups (Level 1) are:
1. A - Energy and Fluid
2. B - Industrial equipment
3. C - Industrial supplies and consumables
4. D - Overheads
5. E - Real Estate
6. F - Computing and Telecoms
7. G - Logistics and packaging
8. H - Raw materials and semi-products
9. I - Trucks and dumpers (should be "Not Used" per Excel)
10. J - Services to sites
11. K - Intellectual services
12. L - Industrial services/subcontracting
13. M - Production subcontracting

All other entries (AA, BB, AAA, AAAA, etc.) are actually Level 2 or Level 3 items that should be nested under these 13 groups.

## Proposed Solution

### New Table Structure

```sql
CREATE TABLE procurement_categories_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Hierarchy fields
  group_id UUID REFERENCES procurement_categories_new(id),  -- Parent group (NULL for Level 1)
  category_id UUID REFERENCES procurement_categories_new(id),  -- Parent category (NULL for Level 1 & 2)
  hierarchy_level INTEGER NOT NULL CHECK (hierarchy_level IN (1, 2, 3)),
  
  -- Descriptive fields (no codes!)
  name TEXT NOT NULL,
  name_fr TEXT,
  description TEXT,
  
  -- Procurement flags
  requires_sow BOOLEAN DEFAULT false,  -- Scope of Work required
  requires_cdc BOOLEAN DEFAULT false,  -- CDC (Customs regulation) required
  
  -- Display and organization
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_hierarchy CHECK (
    (hierarchy_level = 1 AND group_id IS NULL AND category_id IS NULL) OR
    (hierarchy_level = 2 AND group_id IS NOT NULL AND category_id IS NULL) OR
    (hierarchy_level = 3 AND group_id IS NOT NULL AND category_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_procurement_categories_group ON procurement_categories_new(group_id);
CREATE INDEX idx_procurement_categories_category ON procurement_categories_new(category_id);
CREATE INDEX idx_procurement_categories_level ON procurement_categories_new(hierarchy_level);
CREATE INDEX idx_procurement_categories_active ON procurement_categories_new(is_active);
```

### Key Improvements

1. **No More Confusing Codes**: Removed `level1_code`, `level2_code`, `level3_code` entirely
2. **Clear Hierarchy**: Uses `group_id` and `category_id` foreign keys to establish parent-child relationships
3. **Self-Referencing**: The table references itself, making it easy to traverse the hierarchy
4. **Explicit Level**: `hierarchy_level` (1, 2, or 3) makes it crystal clear what level each entry is
5. **Human-Readable**: Only stores descriptive names, no cryptic codes

### Example Data Structure

**Level 1 (Groups)**:
```
id: uuid-1, group_id: NULL, category_id: NULL, hierarchy_level: 1, name: "Energy and Fluid"
id: uuid-2, group_id: NULL, category_id: NULL, hierarchy_level: 1, name: "Industrial Equipment"
```

**Level 2 (Categories under Group)**:
```
id: uuid-10, group_id: uuid-1, category_id: NULL, hierarchy_level: 2, name: "Bitumen"
id: uuid-11, group_id: uuid-1, category_id: NULL, hierarchy_level: 2, name: "Cement"
```

**Level 3 (Items under Category)**:
```
id: uuid-100, group_id: uuid-1, category_id: uuid-10, hierarchy_level: 3, name: "Bitumen Type A"
id: uuid-101, group_id: uuid-1, category_id: uuid-10, hierarchy_level: 3, name: "Bitumen Type B"
```

### Migration Strategy

1. **Create new table** with improved structure
2. **Map existing data** to correct hierarchy levels (requires manual review of Excel source)
3. **Update service layer** to query new structure
4. **Update UI** to display hierarchy properly
5. **Drop old table** once migration is verified

### Benefits

✅ **Clear hierarchy** - Easy to understand parent-child relationships
✅ **No confusing codes** - Human-readable names only
✅ **Flexible** - Easy to add new levels or reorganize
✅ **Performant** - Proper indexes for fast queries
✅ **Maintainable** - Standard relational database pattern
✅ **Business logic flags** - Tracks SOW and CDC requirements per item

### Additional Fields

**`requires_sow`** (Boolean): Indicates if a Scope of Work document is required for this procurement item
**`requires_cdc`** (Boolean): Indicates if CDC (Customs regulation) compliance is required for this procurement item

These flags are read from columns 10 and 11 of the Excel spreadsheet (marked with 'X' where applicable).
