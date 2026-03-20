# Page Conversion Prompt Template

## Overview
This document provides a comprehensive prompt template for converting existing pages to follow the 00435 architecture pattern. Use this prompt when you need to update a page to match the complex page architecture standards, incorporating lessons learned from the 01200 Finance page conversion.

## Standard Prompt Template

```
Task: Convert the [PAGE-CODE] page to follow the 00435 architecture pattern

Please convert the page located at /Users/_PropAI/construct_ai/client/src/pages/[PAGE-FOLDER] to match the 00435 architecture pattern exactly, implementing all the lessons learned from the 01200 Finance page conversion.

## Requirements Checklist:

### 1. Navigation System (CRITICAL - BOTTOM POSITIONING)
- **BOTTOM-POSITIONED navigation** (NOT top positioning) - this is absolutely critical
- Use exact 00435 HTML structure with:
  - `.A-[PAGE-CODE]-navigation-container` (use actual page code prefix)
  - `.A-[PAGE-CODE]-nav-row` positioned at `bottom: calc(10px + 1.5em + 10px)`
  - Plain `<button>` elements (not Bootstrap Button components)
  - Three state buttons: Agents, Upserts, Workspace (or appropriate states for the page)
  - Page title button at bottom with class `nav-button primary`
- **Remove separate navigation components** - integrate directly into main page component
- **Add modal button container** with dynamic grid system for state-based actions

### 2. CSS Positioning Requirements
- Navigation container: `position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%);`
- State buttons: `position: fixed; bottom: calc(10px + 1.5em + 10px);`
- Proper z-index management: container at 2000, buttons at 2001
- Correct pointer-events handling: container `pointer-events: none`, children `pointer-events: auto !important`
- Enhanced background image styling with comprehensive CSS properties
- Use page-specific CSS variables for theming

### 3. Component Structure
- Replace any Bootstrap-heavy navigation with plain HTML matching 00435 pattern
- Remove separate state navigation components and integrate directly
- Ensure proper active state handling with `.active` class
- Add useEffect for button container visibility animation
- Implement useModal hook for modal triggering
- Maintain existing accordion integration
- Keep settings manager initialization
- Preserve existing chatbot functionality
- Maintain modal systems and workflows

### 4. Background Image Handling
- Use `getThemedImagePath('[PAGE-CODE].png')` for single background image approach
- Remove state-specific background images that cause 404 errors
- Implement comprehensive background CSS with:
  ```css
  .page-background {
    background-size: cover;
    background-position: center bottom;
    background-repeat: no-repeat;
    background-attachment: fixed;
  }
  ```

### 5. Grid Layout Implementation
- Replace Card-based layouts with grid systems using `modal-button-container` class
- Use grid-template-columns: `repeat(auto-fit, minmax(200px, 1fr))`
- Ensure buttons have proper styling with icons on the left
- Implement responsive grid layouts that work on all screen sizes

### 6. Chatbot Integration
- Ensure chatbot button diameter matches logout button (50px)
- Chat window should use viewport percentages matching 00435 implementation
- Use consistent z-index and positioning
- Maintain existing chatbot functionality

### 7. Reference Implementation
- Read `/Users/_PropAI/construct_ai/client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`
- Read `/Users/_PropAI/construct_ai/client/src/common/css/pages/00435-contracts-post-award/00435-pages-style.css`
- Read `/Users/_PropAI/construct_ai/docs/1300_01200_FINANCE_CONVERSION_SUMMARY.md` for lessons learned
- Follow the exact patterns found in these reference files

### 8. Integration Requirements
- Add state-based background image support
- Implement comprehensive modal trigger system
- Keep existing accordion integration working
- Maintain all existing page functionality
- Preserve settings manager initialization
- Keep chatbot integration functional

## Implementation Process:

1. **Analysis Phase**: 
   - Read reference files (00435 implementation, CSS, and Finance conversion summary)
   - Identify current navigation structure and components
   - Note existing functionality that must be preserved

2. **Component Restructuring**: 
   - Remove separate navigation component files
   - Integrate navigation directly into main page component
   - Replace Bootstrap components with plain HTML

3. **State Management**: 
   - Add button container visibility state and useEffect
   - Implement proper active state handling
   - Add state-based modal button rendering

4. **Modal Integration**: 
   - Add useModal hook and modal trigger handlers
   - Implement state-based modal button containers
   - Ensure all existing modals still work

5. **CSS Enhancement**: 
   - Update CSS with comprehensive 00435 positioning and styling
   - Add page-specific CSS variables
   - Implement proper background image handling
   - Add grid layout styling for buttons

6. **Background Image Fix**: 
   - Replace state-specific backgrounds with single image approach
   - Use getThemedImagePath for proper image loading
   - Remove 404-causing image references

7. **Grid Layout Implementation**: 
   - Replace Card-based agent buttons with grid layouts
   - Implement modal trigger button grids for all states
   - Add icons to buttons and proper styling

8. **Chatbot Alignment**: 
   - Match chatbot button size to logout button
   - Align chat window size with 00435 implementation
   - Ensure consistent positioning and z-index

9. **Testing**: 
   - Verify navigation positioning at bottom center
   - Test state buttons clickability and theming
   - Verify active state styling works
   - Test responsive design maintenance
   - Check existing functionality preservation
   - Verify modal systems work correctly

## Expected Outcome:
The navigation buttons should be positioned at the bottom center of the screen, matching the 00435 implementation exactly, with proper three-state navigation functionality, modal button container with state-based actions, consistent styling, proper background image handling, and grid layouts for all button groups.

## Common Issues to Address (Based on 01200 Finance Conversion):

### Navigation Positioning
- **Problem**: Navigation positioned at top with `position: sticky; top: 0;`
- **Solution**: Change to bottom positioning with `position: fixed; bottom: 10px;`

### Component Structure
- **Problem**: Using Bootstrap Button components in navigation
- **Solution**: Replace with plain `<button>` elements matching 00435 pattern

### CSS Class Names
- **Problem**: Generic class names not following 00435 pattern
- **Solution**: Use page-specific prefixes like `.A-[PAGE-CODE]-navigation-container`

### Pointer Events
- **Problem**: Navigation buttons not clickable due to CSS pointer-events
- **Solution**: Set container to `pointer-events: none` and children to `pointer-events: auto !important`

### Background Images
- **Problem**: State-specific background images causing 404 errors
- **Solution**: Use single background image approach with getThemedImagePath

### Grid Layouts
- **Problem**: Card-based layouts instead of grid systems
- **Solution**: Implement grid layouts with modal-button-container class

### Chatbot Styling
- **Problem**: Chatbot button size doesn't match logout button
- **Solution**: Ensure 50px diameter and consistent viewport sizing

## Reference Files to Always Check

1. **Implementation Pattern**: `client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`
2. **CSS Pattern**: `client/src/common/css/pages/00435-contracts-post-award/00435-pages-style.css`
3. **Architecture Guide**: `docs/1300_0000_PAGE_ARCHITECTURE_GUIDE.md`
4. **Sample Structure**: `docs/1300_00435_SAMPLE_PAGE_STRUCTURE.md`
5. **Finance Conversion Summary**: `docs/1300_01200_FINANCE_CONVERSION_SUMMARY.md` (lessons learned)
6. **Restructuring Template**: `docs/1300_0000_PAGE_RESTRUCTURING_PROMPT_TEMPLATE.md`

## Quality Assurance Checklist

After restructuring, verify:

- [ ] Navigation buttons are at bottom center of viewport
- [ ] State buttons are clickable and properly themed
- [ ] Active state styling works correctly
- [ ] Page title button appears below state buttons
- [ ] Proper spacing between elements (10px margins)
- [ ] z-index allows buttons to be above other content
- [ ] Mobile responsive design is maintained
- [ ] Existing accordion integration works
- [ ] Settings manager initialization functions
- [ ] Background images display correctly (no 404 errors)
- [ ] Modal systems continue to function
- [ ] Chatbot integration is preserved
- [ ] Grid layouts display properly with icons
- [ ] All existing page functionality works
- [ ] No console errors or warnings

## Advanced Prompt for Complex Cases

For pages requiring additional customization:

```
Advanced Task: Convert [PAGE-CODE] with custom requirements

In addition to the standard 00435 architecture pattern, implement:

### Custom Navigation States
- State 1: [Custom State Name] - [Description]
- State 2: [Custom State Name] - [Description] 
- State 3: [Custom State Name] - [Description]

### Custom Theming
- Primary Color: [Hex Color Code]
- Secondary Color: [Hex Color Code]
- Accent Color: [Hex Color Code]

### Additional Components
- [List any additional modal systems needed]
- [List any custom AI tools or agents needed]
- [List any specific grid layouts required]

### Integration Requirements
- [Any specific database integrations]
- [Any API connections needed]
- [Any third-party service integrations]

Please implement all standard 00435 architecture requirements plus these custom specifications, ensuring bottom-positioned navigation and proper grid layouts.
```

## Troubleshooting Guide

### If Navigation Doesn't Appear
1. Check z-index values (should be 2000+ for navigation)
2. Verify pointer-events CSS is correctly set
3. Ensure elements aren't being hidden by other components
4. Check that container has `pointer-events: none` and children have `pointer-events: auto !important`

### If Buttons Aren't Clickable
1. Confirm `pointer-events: auto !important` on button elements
2. Check for overlapping elements with higher z-index
3. Verify button event handlers are properly bound
4. Ensure container has `pointer-events: none`

### If Positioning Is Wrong
1. Double-check `position: fixed` vs `position: sticky`
2. Verify `bottom` values match 00435 pattern exactly
3. Ensure `transform: translateX(-50%)` is applied for centering
4. Check z-index values for proper layering

### If Background Images 404
1. Replace state-specific images with single background approach
2. Use `getThemedImagePath('[PAGE-CODE].png')`
3. Remove references to non-existent state images
4. Verify image files exist in the correct location

### If Grid Layouts Don't Work
1. Ensure `modal-button-container` class is used
2. Check grid-template-columns CSS property
3. Verify button styling matches 00435 pattern
4. Ensure icons are properly positioned

### If Chatbot Styling Is Wrong
1. Check button diameter matches logout button (50px)
2. Verify chat window uses viewport percentages
3. Ensure consistent z-index and positioning
4. Check that hover effects work properly

## Success Criteria

A successful conversion should result in:

1. **Visual Match**: Navigation looks identical to 00435 page
2. **Functional Match**: All states work with proper highlighting
3. **Responsive Design**: Navigation works on all screen sizes
4. **Integration Preserved**: All existing page features continue to work
5. **Performance Maintained**: No significant performance degradation
6. **Accessibility**: Navigation remains keyboard and screen reader accessible
7. **No 404 Errors**: Background images load correctly
8. **Grid Layouts**: Buttons display in proper grid systems with icons
9. **Chatbot Consistency**: Chatbot styling matches 00435 implementation
10. **Architecture Compliance**: Follows 00435 patterns exactly

Use this template to ensure consistent, accurate page conversion that follows the established architecture patterns while preserving existing functionality and learning from the 01200 Finance page conversion experience.
