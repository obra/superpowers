# Shared Component Extraction Plan

## Components to Share Between Email and Document Management

### 1. Vector Search Service
- Current Location: `@common/js/ai/00200-vector-search-service.js`
- Required Updates:
  - Add email-specific search methods
  - Implement thread-aware searching
  - Enhance security filters

### 2. DataGrid Component
- Current Implementation: Separate in both pages
- Extraction Plan:
  - Create new shared component at `@common/js/ui/00250-data-grid.js`
  - Support both document and email data structures
  - Configurable columns and actions

### 3. Filter/Search Components
- Current State: Duplicated logic
- New Location: `@common/js/ui/00260-search-filters.js`
- Features:
  - Department filter
  - Status filter
  - Date range picker
  - Search input

### 4. Bulk Operations Logic
- Current State: Similar implementations
- New Location: `@common/js/ui/00270-bulk-operations.js`
- Shared Features:
  - Selection management
  - Batch processing
  - Progress tracking

## Implementation Phases

### Phase 1: Vector Search Service (1 week)
1. Add email search methods
2. Update document search to use shared service
3. Test with both email and document data

### Phase 2: DataGrid Component (2 weeks)
1. Create base component
2. Implement email-specific features
3. Migrate document grid
4. Add customization options

### Phase 3: Filter Components (1 week)
1. Extract common filter logic
2. Create configurable filter component
3. Implement in both pages

### Phase 4: Bulk Operations (1 week)
1. Identify common patterns
2. Create reusable hooks
3. Update both pages to use shared logic

## Security Considerations

1. **RLS Policies**:
   - Document-specific vs email-specific policies
   - Shared base security layer

2. **Attachment Handling**:
   - Common scanning service
   - Virus/malware detection

3. **Access Control**:
   - Unified permission system
   - Department-based restrictions
