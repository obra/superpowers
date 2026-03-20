# 1400_TEMPLATE_A_STANDARDIZATION_PLAN.md

## Status
- [x] Initial draft
- [ ] Tech review completed
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-29): Initial version - Template A Standardization Plan

## Overview
This document outlines the plan for standardizing remaining Template A pages using the established CSS architecture approach. It provides implementation guidelines and patterns for consistent page development.

## Requirements
All Template A pages must follow the standardized CSS approach with:
- Import of `template-a-standard.css`
- No background images
- 98vw modal sizing
- Orange color scheme (#FF8C00, #FFA500, #FF6B35)
- Responsive design and accessibility features

## Implementation Plan

### 1. Remaining Template A Pages to Standardize

Based on accordion navigation and page structure analysis, the following pages should be standardized:

#### Priority 1 (High Business Value):
- **00105 Travel Arrangements** - Business travel management
- **01800 Operations** - Operations management (Stock Management, Maintenance Management)
- **02075 Inspection** - Inspection workflows
- **02400 Contractor Vetting** - Contractor approval processes

#### Priority 2 (Medium Business Value):
- **00170 Chatbot Management** - AI chatbot configuration
- **01700 Logistics** - Logistics coordination
- **02200 Quality Assurance** - Quality management
- **03000 Landscaping** - Landscaping project management

#### Priority 3 (Supporting Pages):
- **00872 Developer** - Developer tools and settings
- **01900 Procurement** - Procurement processes (supplier directory base)
- **02050 Information Technology** - IT management
- **02500 Security** - Security management

### 2. Standardization Implementation Pattern

#### File Structure:
```
client/src/common/css/pages/{page-directory}/{page-number}-pages-style.css
```

#### CSS Template:
```css
/* ============= TEMPLATE A - {PAGE NAME} PAGE ============= */
/* Import Template A Standard Styles */
@import "../../templates/template-a-standard.css";

/* {Page Name} specific customizations */

/* {Page Name} Main Container */
.page-name-main-container {
  min-height: 100vh;
  background: var(--template-a-bg-gradient);
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystem00105 Travel ArrangementsFont, "Segoe UI", Roboto, sans-serif;
}

/* Header Section */
.page-name-header-section {
  background: var(--template-a-header-gradient);
  color: var(--template-a-text-white);
  padding: 2rem 0;
  margin-bottom: 2rem;
  box-shadow: var(--template-a-shadow-md);
}

.page-name-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-name-header-icon {
  font-size: 2.5rem;
  color: var(--template-a-text-white);
  margin-right: 1rem;
}

.page-name-header-text h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--template-a-text-white);
}

.page-name-header-text p {
  font-size: 1.1rem;
  margin: 0;
  color: var(--template-a-text-muted);
  font-weight: 300;
}

/* Content Wrapper */
.page-name-content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Page-Specific Components */
/* Add components that are unique to this page */
/* Use Template A standard classes where possible */
/* Only add custom styles that don't exist in template-a-standard.css */

/* Responsive Design */
@media (max-width: 768px) {
  /* Mobile-specific adjustments */
}

@media (max-width: 576px) {
  /* Small screen adjustments */
}
```

### 3. Key Implementation Guidelines

#### Header Section Standardization:
- Use `var(--template-a-header-gradient)` background
- White text with muted secondary text
- Consistent padding and shadow
- Max-width content container (1200px)

#### Content Area Standardization:
- Use `var(--template-a-bg-gradient)` background
- Max-width wrapper (1400px)
- Consistent padding (0 1rem)
- Responsive design with proper breakpoints

#### Button Standardization:
- Primary buttons: `template-a-btn-primary` classes
- Secondary buttons: `template-a-btn-secondary` classes
- State buttons: `template-a-state-button` classes
- All buttons should use Template A color variables

#### Modal Standardization:
- 98vw width using `template-a-modal` classes
- Gradient headers with white text
- Black text content using `* { color: var(--template-a-text-primary) !important; }`
- Consistent padding and spacing

#### Card Component Standardization:
- Use `template-a-card` classes
- Gradient headers with white text
- Consistent shadows and borders
- Hover effects for interactivity

### 4. Quality Assurance Checklist

Before completing each page standardization:

#### Visual Consistency:
- [ ] Header uses orange gradient background
- [ ] Buttons use Template A color scheme
- [ ] Modals are 98vw width
- [ ] No background images
- [ ] Consistent typography and spacing

#### Technical Requirements:
- [ ] Imports `template-a-standard.css`
- [ ] Uses CSS variables consistently
- [ ] Responsive design works on all screen sizes
- [ ] Accessibility features included
- [ ] No conflicting styles with Template A standard

#### Performance:
- [ ] CSS file size minimized
- [ ] Efficient selectors used
- [ ] No redundant styles
- [ ] Proper commenting and documentation

### 5. Migration Steps for Existing Pages

#### For pages with existing CSS:
1. Backup current CSS file
2. Create new standardized CSS file
3. Add Template A standard import
4. Migrate existing custom styles to use Template A classes/variables
5. Remove redundant background images and conflicting styles
6. Test responsive behavior and accessibility
7. Update page components to use new CSS classes

#### For new pages:
1. Create CSS file using template above
2. Import Template A standard
3. Add page-specific customizations only
4. Test implementation
5. Document any unique components

## Status
- [x] Initial draft
- [ ] Tech review completed
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-29): Initial version - Template A Standardization Plan
