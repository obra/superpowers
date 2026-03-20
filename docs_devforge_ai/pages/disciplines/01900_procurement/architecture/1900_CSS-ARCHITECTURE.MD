# 0750_TEMPLATE_A_CSS_ARCHITECTURE.md

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-29): Initial version - Template A CSS Architecture Documentation

## Overview
This document establishes the CSS architecture standards for the Construct AI application, focusing on the Template A standardization approach that provides consistent styling across all major application pages using a modular, maintainable system based on the supplier directory design patterns.

## Requirements
All CSS architecture must include:
- 5-digit prefix matching related functionality (0750 for UI/CSS)
- Standard sections (Overview, Requirements, Implementation, Status)
- Version history with timestamps
- Clear ownership and review cycles
- Automated validation checks

## Implementation

### 1. Template A Standard Architecture

The CSS architecture is built around a standardized Template A system that ensures visual consistency across all major application pages. This system is based on the successful supplier directory (01900-procurement) design patterns.

#### Core Components:
- **Template A Standard CSS**: Single source of truth for all common styles
- **Page-Specific Extensions**: Individual pages import the standard and add customizations
- **CSS Variables System**: Centralized color and design token management
- **Component-Based Approach**: Reusable UI components with consistent styling

### 2. File Structure and Organization

```
client/src/common/css/
├── templates/
│   └── template-a-standard.css          # Master template (Template A)
├── pages/
│   ├── 01200-finance/
│   │   ├── 01200-financial-dashboard-style.css
│   │   └── 01200-petty-cash-style.css
│   ├── 01500-human-resources/
│   │   └── 01500-hr-page-style.css
│   ├── 00200-all-documents/
│   │   └── 00200-all-documents-style.css
│   ├── 00106-timesheet/
│   │   └── 00106-timesheet-style.css
│   └── 03010-email-management/
│       └── 03010-email-management-style.css
└── base/
    └── 00200-layout.css                 # Legacy base styles
```

### 3. Template A Standard CSS (Master Template)

The `template-a-standard.css` file serves as the single source of truth for all Template A pages. It defines:

#### CSS Variables System:
```css
:root {
  /* Primary Color Palette */
  --template-a-primary: #FF8C00;
  --template-a-secondary: #FFA500;
  --template-a-accent: #FF6B35;
  
  /* Background Gradients */
  --template-a-bg-gradient: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  --template-a-header-gradient: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
  
  /* Text Colors */
  --template-a-text-primary: #000000;
  --template-a-text-secondary: #6c757d;
  --template-a-text-white: #ffffff;
  
  /* Shadows and Borders */
  --template-a-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --template-a-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --template-a-shadow-lg: 0 8px 24px rgba(255, 140, 0, 0.3);
}
```

#### Base Layout Structure:
- Main container with gradient background (no images)
- Header section with orange gradient
- Content wrapper with max-width constraints
- Responsive design breakpoints

#### Component Styles:
- State buttons (white with orange borders, orange when active)
- Primary action buttons (orange gradients)
- Secondary buttons (outline style)
- Modal styling (98vw width, gradient headers)
- Tab navigation system
- Card components
- Utility classes (loading, success, error states)

### 4. Page Implementation Pattern

Each Template A page follows this standardized pattern:

#### Import Statement:
```css
/* Import Template A Standard Styles */
@import "../../templates/template-a-standard.css";
```

#### Page-Specific Customizations:
```css
/* Page-specific customizations only - Template A base handles layout, colors, components */

.page-specific-main-container {
  /* Use Template A variables */
  background: var(--template-a-bg-gradient);
}

.page-specific-feature {
  /* Add page-specific styles that don't exist in Template A standard */
}
```

#### Key Principles:
- **No Background Images**: Clean gradient backgrounds only
- **98vw Modal Sizing**: Consistent modal experience across all pages
- **Orange Color Scheme**: #FF8C00, #FFA500, #FF6B35 palette throughout
- **Component Reuse**: Use Template A standard components when possible
- **Variable Consistency**: Always use `--template-a-*` variables for consistency

### 5. Standardized Template A Pages

#### Currently Standardized:
- **01500 Human Resources**: Updated to use Template A standard
- **01200 Financial Dashboard**: New standardized implementation
- **01200 Petty Cash**: New standardized implementation
- **00200 All Documents**: New standardized implementation
- **00106 Timesheet**: New standardized implementation
- **03010 Email Management**: New standardized implementation

#### Implementation Status:
- ✅ Supplier directory visual appearance achieved
- ✅ No background images across all pages
- ✅ 98vw modal sizing consistent
- ✅ Orange color scheme standardized
- ✅ Responsive design implemented
- ✅ Accessibility features included

### 6. CSS Best Practices

#### Naming Conventions:
- Use descriptive class names with page-specific prefixes
- Follow BEM (Block Element Modifier) methodology where applicable
- Use kebab-case for CSS class names
- Prefix Template A standard classes with `template-a-`

#### Performance Optimization:
- Minimize CSS file sizes
- Use efficient selectors
- Leverage CSS variables for consistency
- Avoid unnecessary specificity

#### Accessibility:
- High contrast mode support
- Reduced motion support for users with preferences
- Proper focus states and keyboard navigation
- Screen reader friendly skip links

#### Responsive Design:
- Mobile-first approach
- Proper breakpoints for all screen sizes
- Touch-friendly button sizes
- Collapsible layouts on smaller screens

### 7. Migration and Maintenance

#### Adding New Template A Pages:
1. Create new CSS file in appropriate page directory
2. Add `@import "../../templates/template-a-standard.css";` at top
3. Use Template A standard classes and variables
4. Add only page-specific customizations
5. Test responsive behavior and accessibility

#### Updating Template A Standard:
1. Modify `template-a-standard.css` for global changes
2. All pages automatically inherit updates
3. Test all Template A pages after changes
4. Document breaking changes in version history

#### Quality Assurance:
- Regular cross-browser testing
- Accessibility compliance verification
- Performance monitoring
- Code review process for CSS changes

## Status
- [x] Initial draft
- [x] Tech review completed
- [x] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-29): Initial version - CSS Architecture Documentation
