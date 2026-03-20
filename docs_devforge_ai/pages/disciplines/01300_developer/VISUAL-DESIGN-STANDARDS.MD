# Visual Design Standards - Page Implementation Guidelines

## Overview

This document establishes clear visual design standards for all page implementations to prevent inconsistencies and ensure proper adherence to design patterns.

---

## Background Image Policy

### Pages WITH Background Images ✅
Only specific pages are approved to have background images:

#### 00106 Timesheet Page
- **Background**: Fixed background image (`/assets/default/00106.png`)
- **Implementation**: Full viewport overlay with fixed positioning
- **Purpose**: Specific visual branding for timesheet functionality
- **Code Pattern**:
```javascript
<div
  className="page-background"
  style={{
    backgroundImage: 'url("/assets/default/00106.png")',
    backgroundSize: "cover",
    backgroundPosition: "center bottom",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: -1,
  }}
/>
```

### Pages WITHOUT Background Images ❌
All other pages should follow the clean, card-based approach:

#### ✅ CORRECT REFERENCE: 00200 All Documents Page
- **Background**: CSS variables and solid colors only
- **Styling**: Card-based layout with transparency effects
- **Visual Depth**: Achieved through shadows, borders, and color variations
- **Theme**: Orange color scheme without background imagery

#### ✅ CORRECT REFERENCE: 01900 Supplier Directory
- **Background**: Card-based layout, no background images
- **Styling**: Semi-transparent cards with orange theming
- **Implementation**: CSS variables and gradient backgrounds only

---

## Reference Page Guidelines

### When to Reference Each Page

#### Use 00200 All Documents as Reference For:
- **New business/data management pages**
- **Clean, professional interfaces**
- **Card-based layouts**
- **Table-heavy interfaces**
- **Modal-driven workflows**

#### Use 00106 Timesheet as Reference For:
- **Time-sensitive data entry pages**
- **Pages requiring visual emphasis**
- **Branded user experiences**
- **Form-heavy interfaces with visual context**

#### DO NOT Mix References
- **Never** combine background image patterns with card-based layouts
- **Never** reference timesheet page for business management interfaces
- **Never** add background images to pages designed to be clean and minimal

---

## Implementation Patterns

### ✅ APPROVED: Card-Based Layout (00200 Style)
```javascript
<div className="page-container">
  {/* CSS variables for theming */}
  <style>{`
    --primary-color: #FFA500;
    --card-bg: #ffffff;
    --border-color: #e5e7eb;
  `}</style>
  
  {/* Card-based content */}
  <div className="settings-card">
    <div className="card-header">Page Title</div>
    <div className="card-body">Content</div>
  </div>
</div>
```

### ❌ PROHIBITED: Background Image Implementation
```javascript
// NEVER add this to card-based pages
<div
  className="page-background"
  style={{
    backgroundImage: 'url("...")', // ❌ PROHIBITED
    position: "fixed",             // ❌ PROHIBITED for non-timesheet pages
    // ...
  }}
/>
```

---

## CSS Standards

### Approved Background Patterns
```css
/* CSS Custom Properties - APPROVED */
.page-container {
  --primary-color: #FFA500;
  --secondary-color: #FF8C00;
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
}

/* Card backgrounds - APPROVED */
.settings-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

/* Gradient headers - APPROVED */
.page-header {
  background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%);
}

/* Semi-transparent overlays - APPROVED */
.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}
```

### Prohibited Background Patterns
```css
/* NEVER use these patterns in card-based pages */
.page-background {
  background-image: url("..."); /* ❌ PROHIBITED */
  background: url("...");       /* ❌ PROHIBITED */
}

/* NEVER use fixed positioning for backgrounds in card-based layouts */
.fixed-background {
  position: fixed;              /* ❌ PROHIBITED */
  background-attachment: fixed; /* ❌ PROHIBITED */
}
```

---

## Documentation Requirements

### Pre-Implementation Documentation Must Include:

#### Visual Design Section
- [ ] **Background Policy**: Explicitly state whether background images are allowed
- [ ] **Reference Page**: Clearly identify which existing page to use as visual reference
- [ ] **Prohibited Elements**: List what should NOT be included
- [ ] **Approved Patterns**: Show approved CSS patterns

#### Implementation Guidelines
- [ ] **Code Examples**: Show approved and prohibited code patterns
- [ ] **CSS Standards**: Define required CSS variables and classes
- [ ] **Responsive Behavior**: Specify mobile/desktop behavior

### Example Documentation Template:
```markdown
## Visual Design Guidelines

### Background Implementation Rules
⚠️ **CRITICAL REQUIREMENT**: This page should **NOT** include background images.

- **Reference Standard**: Follows 00200 all documents page visual patterns
- **Prohibited Elements**: Background images, fixed positioning, asset-based backgrounds

### ✅ CORRECT REFERENCE: 00200 All Documents Page
- Clean card-based layout
- CSS variables for theming
- No background images

### ❌ INCORRECT REFERENCE: 00106 Timesheet Page  
- Fixed background image implementation
- Should NOT be used for this page type
```

---

## Quality Assurance Checklist

### Pre-Development Review
- [ ] Documentation explicitly states background image policy
- [ ] Correct reference page identified
- [ ] Prohibited patterns clearly listed
- [ ] Code examples provided for approved patterns

### During Development Review
- [ ] No background image implementations added
- [ ] CSS follows approved patterns
- [ ] Visual consistency with reference page maintained
- [ ] Responsive behavior matches reference

### Post-Development Review
- [ ] Final implementation has no background images (unless explicitly approved)
- [ ] Styling matches reference page exactly
- [ ] No prohibited CSS patterns present
- [ ] Cross-device testing completed

---

## Common Misunderstandings

### Issue: "Mirror the layout of 00200 page"
- **Wrong Interpretation**: Copy all styling approaches from any similar page
- **Correct Interpretation**: Use 00200 page's card-based layout and color scheme only

### Issue: "Make it look professional"
- **Wrong Interpretation**: Add background images or complex styling
- **Correct Interpretation**: Use clean card-based approach with consistent theming

### Issue: "Follow existing patterns"
- **Wrong Interpretation**: Mix patterns from different page types
- **Correct Interpretation**: Follow the specific pattern identified in documentation

---

## Page Type Classifications

### Business/Data Management Pages
- **Style**: Card-based layout (00200 reference)
- **Background**: CSS variables and solid colors only
- **Examples**: Supplier Directory, Document Management, Project Lists
- **Key Features**: Tables, modals, forms, dashboards

### Time/Form Entry Pages  
- **Style**: Background image overlay (00106 reference)
- **Background**: Fixed asset-based background allowed
- **Examples**: Timesheets, Time tracking, Schedule entry
- **Key Features**: Time inputs, calendar interfaces, data entry forms

### Dashboard/Analytics Pages
- **Style**: Card-based layout (00200 reference) 
- **Background**: CSS variables and gradients only
- **Examples**: Reports, Analytics, Performance dashboards
- **Key Features**: Charts, metrics, data visualization

---

This document should be consulted before implementing any new page to ensure consistent visual design and prevent background image implementation errors.
