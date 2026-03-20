# Page Restructuring Prompt Template

## Overview
This document provides a comprehensive prompt template for restructuring existing pages to follow the 00435 architecture pattern. Use this prompt when you need to update a page to match the complex page architecture standards.

## Standard Prompt Template

```
Task: Restructure the [PAGE-CODE] page to follow the 00435 architecture pattern

Please restructure the page located at /Users/_PropAI/construct_ai/client/src/pages/[PAGE-FOLDER] to match the 00435 architecture pattern exactly, implementing:

## Requirements Checklist:

### 1. Navigation System (CRITICAL)
- **BOTTOM-POSITIONED navigation** (NOT top positioning)
- Use exact 00435 HTML structure with:
  - `.page-navigation-container` (replace "page" with actual page prefix)
  - `.page-nav-row` positioned at `bottom: calc(10px + 1.5em + 10px)`
  - Plain `<button>` elements (not Bootstrap Button components)
  - Three state buttons: Agents, Upserts, Workspace
  - Page title button at bottom with class `nav-button primary`
- **Remove separate navigation components** - integrate directly into main page component
- **Add modal button container** with dynamic grid system for state-based actions

### 2. CSS Positioning Requirements
- Navigation container: `position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%);`
- State buttons: `position: fixed; bottom: calc(10px + 1.5em + 10px);`
- Proper z-index management: container at 2000, buttons at 2001
- Correct pointer-events handling: container `pointer-events: none`, children `pointer-events: auto !important`
- Enhanced background image styling with comprehensive CSS properties

### 3. Component Structure
- Replace any Bootstrap-heavy navigation with plain HTML matching 00435 pattern
- Remove separate state navigation components and integrate directly
- Ensure proper active state handling with `.active` class
- Use page-specific primary color for theming
- Add useEffect for button container visibility animation
- Implement useModal hook for modal triggering

### 4. Reference Implementation
- Read `/Users/_PropAI/construct_ai/client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`
- Read `/Users/_PropAI/construct_ai/client/src/common/css/pages/00435-contracts-post-award/00435-pages-style.css`
- Follow the exact patterns found in these reference files

### 5. Integration Requirements
- Maintain existing accordion integration
- Keep settings manager initialization
- Preserve existing chatbot functionality
- Maintain modal systems and workflows
- Keep existing background image handling
- Add state-based background image support
- Implement comprehensive modal trigger system

### 6. Verification Steps
- Confirm navigation buttons are positioned at bottom center of viewport
- Test that state buttons are clickable and properly themed
- Verify active state styling works correctly
- Ensure responsive design is maintained
- Check that existing functionality still works
- Verify modal button container appears and functions correctly
- Test all three states (Agents, Upserts, Workspace) with their respective actions

## Implementation Process:

1. **Analysis Phase**: Read reference files (00435 implementation and CSS)
2. **Component Restructuring**: Remove separate navigation component, integrate navigation directly
3. **State Management**: Add button container visibility state and useEffect
4. **Modal Integration**: Add useModal hook and modal trigger handlers
5. **CSS Enhancement**: Update CSS with comprehensive 00435 positioning and styling
6. **Testing**: Verify navigation positioning, clickability, and functionality
7. **Integration**: Ensure all existing features still work with new structure

## Expected Outcome:
The navigation buttons should be positioned at the bottom center of the screen, matching the 00435 implementation exactly, with proper three-state navigation functionality, modal button container with state-based actions, and consistent styling.

Please proceed with this restructuring task, ensuring the navigation is positioned at the bottom center as specified in the PAGE_ARCHITECTURE_GUIDE.md documentation.
```

## Page-Specific Variations

### For Finance Pages
Replace `[PAGE-CODE]` with `01200-finance` and `[PAGE-FOLDER]` with `01200-finance`

### For IT Pages  
Replace `[PAGE-CODE]` with `02050-information-technology` and `[PAGE-FOLDER]` with `02050-information-technology`

### For Contract Pages
Replace `[PAGE-CODE]` with specific contract page code and `[PAGE-FOLDER]` with corresponding folder

## Enhanced Conversion Template

For comprehensive page conversions incorporating lessons learned from the 01200 Finance page conversion, refer to:
`docs/1300_0000_PAGE_CONVERSION_PROMPT_TEMPLATE.md`

This enhanced template includes:
- Detailed grid layout implementation requirements
- Background image handling best practices
- Chatbot styling consistency guidelines
- Comprehensive troubleshooting based on real conversion experience
- Quality assurance checklist with specific verification points

## Common Issues to Address

### Navigation Positioning
- **Problem**: Navigation positioned at top with `position: sticky; top: 0;`
- **Solution**: Change to bottom positioning with `position: fixed; bottom: 10px;`

### Component Structure
- **Problem**: Using Bootstrap Button components in navigation
- **Solution**: Replace with plain `<button>` elements matching 00435 pattern

### CSS Class Names
- **Problem**: Generic class names not following 00435 pattern
- **Solution**: Use page-specific prefixes like `.finance-navigation-container`

### Pointer Events
- **Problem**: Navigation buttons not clickable due to CSS pointer-events
- **Solution**: Set container to `pointer-events: none` and children to `pointer-events: auto !important`

## Reference Files to Always Check

1. **Implementation Pattern**: `client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`
2. **CSS Pattern**: `client/src/common/css/pages/00435-contracts-post-award/00435-pages-style.css`
3. **Architecture Guide**: `docs/1300_0000_PAGE_ARCHITECTURE_GUIDE.md`
4. **Sample Structure**: `docs/1300_00435_SAMPLE_PAGE_STRUCTURE.md`

## Quality Assurance Checklist

After restructuring, verify:

- [ ] Navigation buttons are at bottom center of viewport
- [ ] State buttons (Agents, Upserts, Workspace) are clickable
- [ ] Active state styling works correctly
- [ ] Page title button appears below state buttons
- [ ] Proper spacing between elements (10px margins)
- [ ] z-index allows buttons to be above other content
- [ ] Mobile responsive design is maintained
- [ ] Existing accordion integration works
- [ ] Settings manager initialization functions
- [ ] Background images display correctly
- [ ] Modal systems continue to function
- [ ] Chatbot integration is preserved

## Advanced Prompt for Complex Cases

For pages requiring additional customization:

```
Advanced Task: Restructure [PAGE-CODE] with custom requirements

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

Please implement all standard 00435 architecture requirements plus these custom specifications.
```

## Troubleshooting Guide

### If Navigation Doesn't Appear
1. Check z-index values (should be 2000+ for navigation)
2. Verify pointer-events CSS is correctly set
3. Ensure elements aren't being hidden by other components

### If Buttons Aren't Clickable
1. Confirm `pointer-events: auto !important` on button elements
2. Check for overlapping elements with higher z-index
3. Verify button event handlers are properly bound

### If Positioning Is Wrong
1. Double-check `position: fixed` vs `position: sticky`
2. Verify `bottom` values match 00435 pattern exactly
3. Ensure `transform: translateX(-50%)` is applied for centering

### If Styling Doesn't Match
1. Confirm page-specific CSS variables are defined
2. Check that primary color is being used in button borders
3. Verify active state styling uses primary color background

## Success Criteria

A successful restructuring should result in:

1. **Visual Match**: Navigation looks identical to 00435 page
2. **Functional Match**: All three states work with proper highlighting
3. **Responsive Design**: Navigation works on all screen sizes
4. **Integration Preserved**: All existing page features continue to work
5. **Performance Maintained**: No significant performance degradation
6. **Accessibility**: Navigation remains keyboard and screen reader accessible

Use this template to ensure consistent, accurate page restructuring that follows the established architecture patterns while preserving existing functionality.
