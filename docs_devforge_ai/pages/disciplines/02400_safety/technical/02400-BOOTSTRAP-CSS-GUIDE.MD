<!-- BOOTSTRAP & CSS INTEGRATION GUIDE - 02400 SAFETY MODULE
======================================================

![Project](../assets/02400-bootstrap-css-integration.svg)

## 📚 **Document Overview**

This guide provides a comprehensive framework for integrating Bootstrap CSS framework with pure CSS/HTML components in React applications, specifically within the 02400 Safety Module. It covers component conversion strategies, CSS specificity management, and best practices for maintainable styling architectures.

## 🎯 **Core Philosophy**

> **"Use the right tool for the right job"**
>
> - **Bootstrap**: Layout, grids, spacing, responsive utilities
> - **Pure CSS/HTML**: Interactive elements, custom styling, complex animations

## 📋 **Component Conversion Matrix**

### Phase 1: High-Priority Conversions (Recommended)

| Component Type | Bootstrap Status | Conversion Priority | Reason |
|---|---|---|---|
| **Buttons** | 🔴 Problematic | ✅ HIGH | Difficult to customize, better control needed |
| **Cards** | ✅ Excellent | ⚠️ LOW | Easy to work with, responsive by default |
| **Forms** | ⚠️ Partial | 🔶 MEDIUM | Useful for layout, harder for custom styling |
| **Modals** | 🔴 Problematic | ✅ HIGH | Bootstrap modals are rigid and hard to style |
| **Navigation** | ✅ Excellent | ⚠️ LOW | Bootstrap nav components work well |

### Phase 2: Strategic Decisions

| Component Type | Bootstrap Status | Conversion Priority | Use Case |
|---|---|---|---|
| **Grids/Layout** | ✅ Excellent | ❌ NEVER | `Row`, `Col` are ideal for complex layouts |
| **Typography** | ✅ Excellent | ❌ NEVER | Bootstrap typography is comprehensive |
| **Spacing** | ✅ Excellent | ❌ NEVER | `.m-*`, `.p-*` classes are perfect |
| **Colors** | ⚠️ Limited | 🔶 MEDIUM | Depends on design system requirements |

## 🏗️ **Architecture Patterns**

### Pattern 1: Hybrid Architecture (Recommended)

```jsx
// GOOD: Mix Bootstrap layout + pure CSS/HTML elements
function SafetyPage() {
  return (
    <Container>              {/* Bootstrap - Perfect for layout */}
      <Row className="mb-4"> {/* Bootstrap - Excellent spacing */}
        <Col md={8}>         {/* Bootstrap - Responsive grid */}
          <div
            style={customStyles}   {/* Custom CSS - Full control */}
            className=""           {/* Empty - Avoid conflicts */}
          >
            <button               {/* HTML - No Bootstrap interference */}
              style={buttonStyles}
              onClick={handleAction}
            >
              Custom Action
            </button>
          </div>
        </Col>
        <Col md={4}>         {/* Bootstrap - Responsive grid */}
          <Card className="h-100"> {/* Bootstrap - Easy styling */}
            <Card.Body>
              <h5>Quick Stats</h5>
              {/* Content */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
```

### Pattern 2: Bootstrap-First Approach

```jsx
// Bootstrap primarily, custom CSS for hard-to-override scenarios
function InspectionForm() {
  return (
    <Form>                                {/* Bootstrap - Form structure */}
      <Form.Group className="mb-3">       {/* Bootstrap - Layout/spacing */}
        <Form.Label>
          Equipment Name
          <span style={{color: 'red'}}>*</span> {/* Custom - Critical styling */}
        </Form.Label>
        <Form.Control {...props} />       {/* Bootstrap - Input styling */}
      </Form.Group>

      {/* Override problematic Bootstrap only where necessary */}
      <div className="d-flex justify-content-end gap-2"> {/* Bootstrap - Layout */}
        <Button variant="secondary">Cancel</Button>      {/* Bootstrap - Fine */}
        <Button
          variant="primary"
          style={customButtonStyles}                   {/* Custom override */}
        >
          Save Inspection
        </Button>
      </div>
    </Form>
  );
}
```

### Pattern 3: Pure CSS/HTML Components

```jsx
// Complete control - Use when Bootstrap doesn't fit requirements
function CustomModal(props) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1050,
        display: props.show ? 'flex' : 'none',
        // Complete styling control
      }}
      onClick={() => props.onHide?.()}    {/* Full BEHAVIOR control */}
    >
      <div
        style={{
          // Custom modal styling
          margin: 'auto',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}  {/* Prevent close on content click */}
      >
        <div style={headerStyles}>
          {props.header}
          <button
            style={closeButtonStyles}
            onClick={() => props.onHide?.()}
          >
            ×
          </button>
        </div>
        <div style={bodyStyles}>
          {props.children}
        </div>
        <div style={footerStyles}>
          {props.footer}
        </div>
      </div>
    </div>
  );
}
```

## 🎨 **CSS Specificity Management**

### Understanding Bootstrap Specificity

#### Bootstrap Default Specificity
```css
/* Low specificity - Easy to override */
.custom-class {
  color: blue;
  font-size: 16px;
}

/* Medium specificity - From utility classes */
.mb-3 {
  margin-bottom: 1rem !important; /* Bootstrap utilities use !important */
}

/* High specificity - Complex selectors */
.btn-primary {
  color: #fff !important;           /* Multiple !important declarations */
  background-color: #007bff !important;
  border-color: #007bff !important;
}

/* Very high specificity - Bootstrap form controls */
.form-control:focus {
  color: #495057 !important;       /* Multiple selectors + !important */
  background-color: #fff !important;
  border-color: #80bdff !important;
  outline: 0 !important;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25) !important;
}
```

#### Safe Override Strategies

```css
/* 1. Context Class + Element Selector */
.form-custom .form-control {
  background-color: #f8f9fa;
}

/* 2. Attribute Selector */
input[type="text"][name="priority"] {
  background-color: goldenrod;
}

/* 3. Inline Styles (Nuclear Option) */
<input
  style={{
    backgroundColor: '#fff3cd !important',
    borderColor: '#ffeaa7 !important'
  }}
/>

/* 4. CSS Custom Properties (Cleanest) */
:root {
  --input-danger-bg: #f8d7da;
  --input-danger-border: #f5c6cb;
}

.form-danger .form-control {
  background-color: var(--input-danger-bg);
  border-color: var(--input-danger-border);
}
```

## 🛠️ **Practical Implementation Guide**

### Step 1: Component Classification

```javascript
// Classification utility for new components
const ComponentClassifier = {
  // Use Bootstrap - Low customization needed
  BOOTSTRAP_FIRST: {
    candidates: ['Card', 'Alert', 'Badge', 'Progress', 'Spinner'],
    criteria: 'Simple visual components with good Bootstrap defaults'
  },

  // Consider conversion - Medium customization needed
  EVALUATE: {
    candidates: ['Table', 'Modal', 'Form_Some', 'List'],
    criteria: 'Functionality OK, but styling often needs adjustment'
  },

  // Convert to pure CSS/HTML - High customization needed
  CONVERT_FIRST: {
    candidates: ['Button_Custom', 'Modal_Custom', 'Toast_Custom'],
    criteria: 'Bootstrap limitations are significant barriers'
  }
};
```

### Step 2: Conversion Decision Tree

```javascript
function shouldConvertToHTML(componentType, requirements) {
  // Step 1: Functionality check
  const functionalityOk = ['Table', 'List', 'Alert'].includes(componentType);

  // Step 2: Styling requirements
  const stylingComplex = requirements.customAnimations ||
                        requirements.customTheme ||
                        requirements.accessibilityOverrides;

  // Step 3: Maintenance cost
  const maintenanceHigh = requirements.frequentUpdates ||
                         requirements.teamCssExperts;

  // Decision logic
  if (functionalityOk && !stylingComplex && !maintenanceHigh) {
    return false; // Keep Bootstrap
  }

  if (stylingComplex || maintenanceHigh) {
    return true; // Convert to pure CSS/HTML
  }

  return false; // Keep Bootstrap
}
```

## 📋 **Bootstrap Class Usage Guidelines**

### ✅ **Safe Bootstrap Classes**

```jsx
// LAYOUT CLASSES - Always safe, excellent performance
<Container fluid className="vh-100">         {/* Perfect for full-height layouts */}
<Row className="justify-content-center align-items-start"> {/* Great for positioning */}
<Col md={6} lg={4} className="order-md-2">     {/* Responsive design made easy */}

// SPACING CLASSES - Essential utilities
<div className="p-3 mb-4 mt-auto">           {/* Fast development, consistent */}
<h3 className="mb-0 pb-2">                   {/* Typography spacing */}

// RESPONSIVE CLASSES - Bootstrap's strength
<div className="d-none d-md-block d-lg-flex"> {/* Responsive visibility */}
```

### ⚠️ **Problematic Bootstrap Classes**

```jsx
// TEXT CLASSES - High specificity conflicts
<div className="text-muted small text-center"> {/* Overrides with !important */}
<p className="lead display-4">               {/* Unexpected sizing conflicts */}

// TUTORIAL DESIGN PATTERN
<div className="d-flex justify-content-between align-items-center">
  <div>
    <h4 className="mb-0 text-primary">             {/* ✅ titleColor good */}
      <i className="bi bi-star-fill me-2"></i>    {/* ✅ icon styling good */}
      Component Title
    </h4>
    <p className="text-muted small mb-0">         {/* ❌ text-muted overrides */}
      Descriptive subtitle that may be white
    </p>
  </div>
  <div className="d-flex gap-2">                 {/* ✅ flexbox good */}
    <Button variant="outline-primary">Cancel</Button>      {/* ❌ hard to customize */}
    <Button variant="primary">Save Changes</Button>       {/* ❌ hard to customize */}
  </div>
</div>
```

### 🔧 **Override Patterns**

```jsx
// OVERRIDE PATTERN - For problematic Bootstrap classes

// ❌ Hard to maintain
<div className="text-muted text-center">
  <span className="text-dark">Customized Text</span>
</div>

// ✅ Maintainable override
<div className="d-flex justify-content-center">
  <span style={{
    color: "#212529 !important",              // Override Bootstrap
    fontWeight: "500 !important",             // Solid typing weight
    textAlign: "center"                       // Covered by parent flex
  }}>
    Customized Text
  </span>
</div>

// BEST: Context-specific class
.custom-text-context {
  color: #495057;
  font-weight: 400;
}
```

## 🎯 **Component Migration Strategy**

### Phase 1: Assessment & Preparation
1. **Audit existing Bootstrap usage**
2. **Identify components with customization needs**
3. **Create component library of pure CSS/HTML alternatives**
4. **Establish CSS custom property system**

### Phase 2: Gradual Migration
1. **Start with high-impact components (buttons, modals)**
2. **Create consistent CSS documentation**
3. **Establish migration checklist for new components**
4. **Monitor performance impact**

### Phase 3: Optimization
1. **Remove unused Bootstrap dependencies**
2. **Combine CSS classes into utility libraries**
3. **Optimize CSS delivery (critical CSS, lazy loading)**
4. **Document component migration patterns**

## 📊 **Performance Considerations**

### Bundle Size Impact

```
Full Bootstrap CSS: ~150KB (gzipped)
Bootstrap Grid Only: ~20KB (gzipped)
Bootstrap Utilities: ~45KB (gzipped)
Custom CSS/HTML: ~5-15KB (gzipped)
```

### Loading Strategy

```jsx
// Asynchronous Bootstrap loading
import('./styles/bootstrap-custom.css').then(() => {
  // Bootstrap loaded
});

// Critical CSS for above-the-fold content
// Lazy load Bootstrap for below-the-fold
```

## 🔧 **Development Tools & Workflow**

### Debugging Bootstrap Conflicts

```jsx
// Debug utility - Add to component during development
const DebugStyles = {
  DEBUG_ON: process.env.NODE_ENV === 'development',

  highlight: {
    border: '2px solid red !important',
    backgroundColor: 'rgba(255,0,0,0.1) !important'
  },

  logClasses: (elementRef, className) => {
    if (!DebugStyles.DEBUG_ON) return;

    console.group('Bootstrap Debug:');
    console.log('Element:', elementRef);
    console.log('Bootstrap classes:', className?.split(' '));
    console.log('Computed styles:', window.getComputedStyle(elementRef));
    console.groupEnd();
  }
};
```

### Component Testing Checklist

```javascript
const BootstrapConversionTests = {
  // Test 1: Bootstrap Independence
  testBootstrapRemoval: async (component) => {
    // Remove Bootstrap from component
    // Verify functionality remains intact
    // Check visual regression
  },

  // Test 2: CSS Specificity
  testSpecificityInheritance: async (component) => {
    // Add parent with conflicting styles
    // Verify overrides work correctly
    // Test with !important declarations
  },

  // Test 3: Performance
  testPerformanceImpact: async (oldComponent, newComponent) => {
    // Compare rendering times
    // Compare bundle sizes
    // Test accessibility scores
  }
};
```

## 📈 **Success Metrics**

### Quality Metrics
- ✅ **Customization**: Components can be styled without Bootstrap overrides
- ✅ **Maintainability**: CSS changes require minimal effort
- ✅ **Consistency**: Design system follows logical patterns
- ✅ **Accessibility**: Meets WCAG guidelines for contrast and interaction

### Performance Metrics
- 📦 **Bundle Size**: Target <50KB additional for modal/button components
- ⚡ **Load Time**: No increase in Time to Interactive
- 🎨 **Render Performance**: No decrease in layout/animation performance

## 🎯 **Implementation Examples**

### Before: Bootstrap Heavy

```jsx
import { Card, Button, Badge } from 'react-bootstrap';

function InspectionCard({ inspection }) {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <Card.Title className="mb-2">{inspection.title}</Card.Title>
            <Badge variant="primary" className="me-2">{inspection.priority}</Badge>
          </div>
          <Button variant="outline-secondary" size="sm">
            <i className="bi bi-pencil"></i>
          </Button>
        </div>

        <Card.Text className="text-muted mb-3">
          {inspection.description}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Updated {inspection.lastUpdated}
          </small>
          <Button variant="primary" size="sm">View Details</Button>
        </div>
      </Card.Body>
    </Card>
  );
}
```

### After: Optimized Hybrid

```jsx
function InspectionCard({ inspection }) {
  return (
    <div className="card h-100 shadow-sm bg-white rounded">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <h5 className="card-title mb-2 fw-semibold">{inspection.title}</h5>
            <span
              className="badge me-2"
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75em'
              }}
            >
              {inspection.priority}
            </span>
          </div>

          <button
            className=""
            style={{
              border: '1px solid #6c757d',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#6c757d',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '0.875em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={() => handleEdit(inspection.id)}
          >
            <svg width="16" height="16" fill="currentColor">...</svg>
          </button>
        </div>

        <p
          className="card-text mb-3"
          style={{
            color: '#6c757d',
            fontSize: '0.875em',
            lineHeight: '1.5'
          }}
        >
          {inspection.description}
        </p>

        <div className="card-footer bg-transparent border-top-0 p-0">
          <div className="d-flex justify-content-between align-items-center">
            <small
              className=""
              style={{ color: '#6c757d', fontSize: '0.75em' }}
            >
              Updated {inspection.lastUpdated}
            </small>

            <button
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: '1px solid #007bff',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.875em',
                fontWeight: '500'
              }}
              onClick={() => handleView(inspection.id)}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 📚 **Quick Reference**

### Bootstrap Conversion Checklist
- [ ] Component provides needed functionality
- [ ] Styling can be easily customized
- [ ] Performance impact is acceptable
- [ ] Team has CSS expertise for maintenance
- [ ] Component will be frequently iterated upon
- [ ] Accessibility requirements are met
- [ ] Browser compatibility is maintained

### Bootstrap Class Blacklist (High Conflict)
```javascript
const BOOTSTRAP_BLACKLIST = [
  'text-muted',      // Grey/white text color
  'text-center',     // Text alignment conflicts
  'mb-0',           // Margin override conflicts
  'btn-primary',    // Hard to customize colors
  'modal-dialog',   // Layout restrictions
  'form-control'    // Styling override limitations
];
```

### Safe Bootstrap Classes (Low Interference)
```javascript
const SAFE_BOOTSTRAP_CLASSES = [
  'd-flex',         // Layout flexibility
  'justify-content-center',  // Efficient positioning
  'align-items-center',     // Alignment utilities
  'm-*', 'p-*',    // Spacing system
  'col-*',         // Grid system
  'container',     // Layout containers
];
```

---

**📖 Cross-Reference Documents:**
- [Main Safety Guide](../1300_02400_SAFETY_GUIDE.md) - Overall project documentation
- [Bootstrap Documentation](https://getbootstrap.com/docs/) - Official Bootstrap docs
- [CSS Specificity Calculator](https://specificity.keegan.st) - Online specificity tool

This guide serves as the definitive reference for Bootstrap/CSS integration strategies within the 02400 Safety Module.
