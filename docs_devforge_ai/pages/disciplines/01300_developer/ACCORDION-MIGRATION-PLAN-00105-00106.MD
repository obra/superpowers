# Accordion Migration Plan: Pages 00105 and 00106

## Overview

This document provides a detailed migration plan to standardize pages 00105 (Travel Arrangements) and 00106 (Timesheet) to use the main system's React-based accordion architecture instead of their current standalone vanilla JavaScript implementations.

## Current State Analysis

### Issues with Current Implementation
- **Code Duplication**: Both pages contain identical accordion logic (612-795 lines each)
- **Maintenance Overhead**: Changes must be made in multiple places
- **Inconsistent Architecture**: Different from main system's React-based approach
- **Limited Features**: Missing organization-awareness and collaboration support

### Current Accordion Implementation Pattern
Both pages use this pattern:
```html
<!-- Accordion Toggle Button -->
<button id="toggle-accordion" class="" aria-label="Toggle navigation menu">
    <span class="icon">☰</span>
</button>

<!-- Accordion Menu Container -->
<div class="menu-container" id="accordion-menu-container">
    <div class="accordion-wrapper">
        <div class="accordion-container">
            <div class="accordion-menu" id="accordion-menu">
                <div style="padding: 20px; text-align: center; color: #666;">
                    Loading menu...
                </div>
            </div>
        </div>
    </div>
</div>
```

Plus 180+ lines of JavaScript for accordion functionality.

## Target Architecture

### Main System Components
- **React Component**: `client/src/modules/accordion/00200-accordion-component.js`
- **Template System**: `server/src/routes/accordion-sections-routes.js`
- **Context Management**: `client/src/modules/accordion/context/00200-accordion-context.js`

### Benefits of Migration
- **Consistency**: Unified accordion behavior across all pages
- **Organization-Aware**: Different templates based on organization type
- **Collaboration Support**: Merge sections from collaborating organizations
- **Advanced Features**: Multi-tier fallback, React state management
- **Maintainability**: Single source of truth for accordion logic

## Migration Steps

### Step 1: Update Page 00105 (Travel Arrangements)
1. Remove standalone accordion HTML structure (lines 21-37)
2. Remove standalone accordion JavaScript (lines 294-484)
3. Replace with simple accordion container for React component
4. Update page to be React-compatible

### Step 2: Update Page 00106 (Timesheet)
1. Remove standalone accordion HTML structure (lines 459-475)
2. Remove standalone accordion JavaScript (lines 612-795)
3. Replace with simple accordion container for React component
4. Update page to be React-compatible

### Step 3: Verify Template System
1. Confirm 00105 and 00106 entries exist in MASTER_TEMPLATE
2. Ensure proper URLs and standard links are configured
3. Test organization-specific template variations

## Implementation Details

### HTML Structure Replacement
Replace the current accordion structure with:
```html
<!-- Simple container for React accordion component -->
<div id="accordion-root"></div>
```

### JavaScript Replacement
Replace the 180+ lines of accordion JavaScript with:
```html
<script type="module">
    import { AccordionComponent } from '/client/src/modules/accordion/00200-accordion-component.js';
    import { createRoot } from 'react-dom/client';
    
    // Mount React accordion component
    const accordionRoot = createRoot(document.getElementById('accordion-root'));
    accordionRoot.render(React.createElement(AccordionComponent));
</script>
```

### Template System Verification
Ensure these entries exist in `server/src/routes/accordion-sections-routes.js`:

```javascript
// 00105 - Travel Arrangements (already exists in Administration section)
{
  id: 'accordion-button-00102',
  title: 'Administration',
  links: [
    { title: 'Travel Arrangements', url: '/pages/00105-travel-arrangements/00105-travel-arrangements.html' }
  ]
}

// 00106 - Timesheet (already exists in Administration section)  
{
  id: 'accordion-button-00102',
  title: 'Administration',
  links: [
    { title: 'Timesheet Management', url: '/pages/00106-timesheet/00106-timesheet.html' }
  ]
}
```

## Testing Plan

### Pre-Migration Testing
1. Document current accordion behavior on both pages
2. Test API integration and fallback mechanisms
3. Verify navigation functionality

### Post-Migration Testing
1. Confirm accordion loads from template system
2. Test organization-specific templates
3. Verify navigation still works correctly
4. Test collaboration features (if applicable)
5. Confirm responsive behavior

## Rollback Plan

If issues arise:
1. Restore original HTML files from backup
2. Verify standalone accordion functionality
3. Document any issues for future migration attempts

## Benefits After Migration

### Code Reduction
- **Page 00105**: Remove ~180 lines of duplicate JavaScript
- **Page 00106**: Remove ~180 lines of duplicate JavaScript
- **Total**: ~360 lines of duplicate code eliminated

### Feature Gains
- Organization-aware accordion templates
- Collaboration support between organizations
- Advanced fallback strategies
- Consistent behavior across all pages
- React-based state management

### Maintenance Improvements
- Single source of truth for accordion logic
- Centralized template management
- Easier to add new features
- Consistent styling and behavior

## Implementation Priority

1. **High Priority**: Remove code duplication and standardize architecture
2. **Medium Priority**: Leverage advanced features (organization templates, collaboration)
3. **Low Priority**: Optimize performance and add new accordion features

This migration aligns both pages with the main system architecture while eliminating significant code duplication and maintenance overhead.