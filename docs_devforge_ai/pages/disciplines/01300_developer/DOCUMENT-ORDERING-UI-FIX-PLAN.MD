# Document Ordering Management UI Fix Plan

## Issues Identified

### 1. **SectionLibrary Appears Empty** (Critical)
- **Problem**: Main component passes `documentSections` and `loadingSections` to SectionLibrary
- **Expected**: SectionLibrary expects `sections` and `loading` props
- **Result**: Library shows "No sections available" even though 19 sections are loaded from API

### 2. **Template Variations Dropdown Shows Only 1 Item**
- **Problem**: Database has no real variations, falls back to hardcoded options
- **Result**: Only shows "Standard (3-4 appendices)" instead of real dynamic variations
- **Additional Issue**: React warning about missing unique keys for dropdown options

### 3. **Draggable Cards Not Functional**
- **Problem**: SectionLibrary being empty prevents users from dragging sections to canvas
- **Missing Functionality**: No way to build variations without sections in library

## Fix Implementation Plan

### Phase 1: Fix SectionLibrary Props (High Priority)
- [x] Update main component to pass correct props to SectionLibrary
- [x] Fix prop names: `documentSections` → `sections`, `loadingSections` → `loading`
- [ ] Test that sections now appear in library

### Phase 2: Fix Template Variations Dropdown (Medium Priority)
- [ ] Add real database variations to populate dropdown
- [ ] Fix React key warnings in dropdown rendering
- [ ] Add loading state for variations dropdown
- [ ] Ensure dropdown shows meaningful options instead of fallback

### Phase 3: Test and Validate (Medium Priority)
- [ ] Verify SectionLibrary displays all 19 available sections
- [ ] Confirm drag-and-drop functionality works
- [ ] Test template variations dropdown shows real options
- [ ] Ensure no React warnings or console errors

### Phase 4: Data Population (If Needed)
- [ ] Create test document variations if database lacks variety data
- [ ] Ensure variations can be created and saved properly
- [ ] Verify all UI interactions work as expected

## Expected Outcomes
- ✅ Section library shows all 19 available sections
- ✅ Users can drag sections to build variations
- ✅ Template variations dropdown shows real options
- ✅ All draggable cards work properly
- ✅ No React warnings or console errors
- ✅ Improved user experience and functionality

## Current Status
- SectionLibrary props fix implemented
- Testing phase in progress
- Need to verify fix and continue with variations dropdown
