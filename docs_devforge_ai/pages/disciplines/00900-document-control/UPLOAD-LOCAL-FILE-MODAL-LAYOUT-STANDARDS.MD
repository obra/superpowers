# Upload Local File Modal Layout Standards

This document establishes the standardized layout, format, and visual design patterns for upload local file modals used across the Construct AI application, with specific reference to the implementation in the Other Parties page (01850) under the upserts state.

## Overview

The upload local file modal provides a comprehensive interface for users to upload documents with AI-enhanced processing, metadata capture, and access control. The modal follows a structured, sectioned layout that ensures consistent user experience and data integrity.

## Modal Structure and Layout

### Core Layout Principles

- **Modal Container**: Full-width modal with responsive design
- **Header**: Prominent title with relevant emoji and discipline-specific branding
- **Content Sections**: Vertically stacked sections with consistent spacing and borders
- **Footer**: Action buttons aligned to the right with proper spacing

### Visual Design Standards

#### Color Theme (`contractsTheme`)

```javascript
const contractsTheme = {
  primary: "#000000", // Main headings, buttons, borders
  secondary: "#F0F8FF", // Secondary elements, hover states
  success: "#155724", // Success states and messages
  danger: "#721c24", // Error states and validation messages
  warning: "#856404", // Warning alerts and notifications
  orange: "#FF8C00", // Accent color for highlights, borders, active states
  lightOrange: "#FFE4B5", // Light orange for subtle backgrounds
};
```

#### Text Color Standards

- **All Text**: All text elements throughout the modal must explicitly use `contractsTheme.primary` (#000000) color
- **Heading Elements**: h4, h5, h6 elements must have `color: contractsTheme.primary`
- **Inline Styling Required**: Use explicit `style={}` props with `color: contractsTheme.primary` - never use CSS classes or inheritance
- **Heading Element Usage**: Always use semantic heading elements (h4, h5, h6) instead of styled div elements for section headers
- **Paragraph Text**: All p, div, and span elements with text must have `color: contractsTheme.primary`
- **Form Elements**: Input, select, textarea, and label text must use `color: contractsTheme.primary`
- **Small Text**: small elements and helper text must use `color: contractsTheme.primary`
- **Critical Warning**: Do NOT use object-based styling like `sectionHeaderStyle` for text elements - this leads to inheritance issues. Always use explicit inline styles.
- **CSS Variables Override**: When global CSS variables interfere with modal styling, override them locally in the modal container: `"--orange-main": "#000000"` etc.
- **Ultimate Override**: In some cases, when inheritance or browser defaults override inline styles, append ` + " !important"` to the color value for critical text elements.

**CSS Variable Override Pattern:**

```jsx
// Critical: Override global CSS variables to ensure black text
<div
  style={{
    // Override global orange CSS variables with black
    "--orange-main": "#000000",
    "--orange-hover": "#000000",
    "--orange-light": "#000000",
    "--orange-medium": "#000000",
    // Fallback !important override
    color: contractsTheme.primary + " !important",
  }}
>
```

**❌ INCORRECT (Will Cause Text Color Issues):**

```jsx
// DO NOT DO THIS - causes inheritance problems
<div style={sectionHeaderStyle}>
  <span>👷</span> Section Title
</div>

// OR THIS - class-based styling defeats the purpose
<h5 className="section-header">
  <span>👷</span> Section Title
</h5>
```

**✅ CORRECT (Explicit Styling Required):**

```jsx
// ALWAYS DO THIS - explicit h5 with inline styles
<h5
  style={{
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: contractsTheme.primary, // Must be explicit
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderLeft: `4px solid ${contractsTheme.orange}`,
    paddingLeft: "12px",
  }}
>
  <span>👷</span> Section Title
</h5>
```

#### Section Styling

```javascript
const sectionStyle = {
  marginBottom: "25px",
  padding: "20px",
  border: `1px solid ${contractsTheme.primary}`,
  borderRadius: "8px",
  backgroundColor: "#ffffff",
};

const sectionHeaderStyle = {
  fontSize: "1rem",
  fontWeight: "bold",
  color: contractsTheme.primary,
  marginBottom: "15px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  borderLeft: `4px solid ${contractsTheme.orange}`,
  paddingLeft: "12px",
};
```

#### Button Styling

```javascript
const buttonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "0.9rem",
  transition: "all 0.2s ease",
};

const primaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: contractsTheme.primary,
  color: "#ffffff",
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: "#6c757d",
  color: "#ffffff",
  marginRight: "10px",
};
```

#### Modal Footer Spacing (CRITICAL PREVENTION)

**⚠️ CRITICAL REQUIREMENT**: Modal footers MUST have **zero bottom padding** to prevent gaps below buttons.

**✅ CORRECT Footer Padding**:

```javascript
<div style={{
  padding: "16px 24px 0px 24px", // Bottom padding MUST be 0px
  borderTop: `1px solid ${contractsTheme.primary}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}}>
```

**❌ INCORRECT Footer Padding (Causes Gaps)**:

```javascript
<div style={{
  padding: "16px 24px 4px 24px",  // AVOID: This creates gaps
}}>
// or
<div style={{
  padding: "16px 24px 8px 24px",  // AVOID: This creates bigger gaps
}}>
```

**Modal Height Control**:

- **maxHeight**: Use `50vh` maximum for content-constrained modals
- **minHeight**: Always set `minHeight: "fit-content"` for natural sizing
- **Overflow**: Set `overflowY: "auto"` for scrollable content when needed
- **Outer Container**: Avoid `maxHeight` constraints on modal wrapper

**Footer Gap Prevention Rules**:

1. **Modal Content**: Can have reasonable width (`maxWidth: "900px"`) but height should auto-size
2. **Footer Buttons**: Always touch the bottom edge of modal content - no gaps allowed
3. **Content Sizing**: Modal height adapts to content, not arbitrary constraints
4. **Zero Tolerance**: No padding below footer buttons (0px bottom padding required)

## Required Modal Sections

### 1. OCR Toggle Section (Conditional)

- **Visibility**: Only shown when PDF files are selected
- **Position**: Top of modal, before main content
- **Layout**: Warning-style background with checkbox control
- **Visual Indicators**: Emoji, descriptive text, status messages

**Implementation Pattern**:

```javascript
<OCRToggleSection
  hasPDFFiles={fileHandling.selectedFiles.some(
    f => f.type === "application/pdf"
  )}
  ocrEnabled={ocrEnabled}
  onOCRToggle={setOCREnabled}
  contractsTheme={contractsTheme}
/>
```

### 2. File Upload Zone (Core Section)

- **Header**: "📁 File Selection & Preview"
- **Components**: Drop zone, file list, preview functionality
- **Validation**: Real-time file validation feedback
- **Visual**: Drag-and-drop area with clear boundaries

### 3. Document Processing Cards (Dynamic)

- **Header**: "🤖 AI-Enhanced Document Processing ({count} files)"
- **Layout**: Individual cards for each uploaded file
- **Features**: Per-file metadata editing, validation status
- **Visibility**: Only shown when files are selected

### 4. Document Details Section (Core)

- **Header**: "📝 Document Details"
- **Components**: Organization dropdown, project dropdown, metadata form
- **Layout**: Form fields with validation and help text
- **Required Fields**: Organization, project, document type

### 5. Vector Data Isolation Section (Advanced)

- **Purpose**: Configure vector database isolation settings
- **Layout**: Collapsible advanced options
- **Controls**: Organization-specific isolation parameters

### 6. User Access Control Section (Core)

- **Header**: "👥 Document Access Control"
- **Components**: User selection, permission management
- **Features**: Add/remove users, permission levels

### 7. Processing Status Section (Dynamic)

- **Header**: None (status display area)
- **Components**: Progress bars, status messages, retry actions
- **Layout**: Card-based display for each processing file

## Validation and Error Handling

### Validation Message Display

- **Position**: Immediately above footer buttons
- **Styling**: Warning background (`#fff3cd`) with orange left border
- **Content**: Bulleted list of missing requirements
- **Icon**: Warning emoji with explanatory text

**Example Structure**:

```javascript
<div
  style={{
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    borderRadius: "8px",
    marginBottom: "15px",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <span style={{ fontSize: "1.2rem" }}>⚠️</span>
    <strong>Please complete the following:</strong>
  </div>
  <ul style={{ margin: "0", paddingLeft: "20px" }}>
    {missingItems.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
</div>
```

### Button State Management

- **Disabled State**: Clear visual indication when validation fails
- **Enable Logic**: All required fields completed + files selected + validation passed
- **Visual Feedback**: Button opacity and cursor changes

## Conditional Display Elements

### Debug Panel (Development Only)

- **Trigger**: `process.env.NODE_ENV !== "production"`
- **Content**: Data source validation, API status, debug information
- **Styling**: Muted gray background with collapsible interface

### Advanced Options

- **Trigger**: User toggle (`showAdvanced` state)
- **Content**: Additional configuration options
- **Behavior**: Collapsible/expandable sections

## Responsive Design Considerations

### Breakpoint Handling

- **Desktop**: Full-width sections with side-by-side elements
- **Mobile**: Stacked layout with smaller padding
- **Tablet**: Balanced approach between desktop and mobile

### Spacing Standards

- **Section Margins**: `25px` bottom margin between major sections
- **Internal Padding**: `20px` for section content
- **Header Spacing**: `15px` bottom margin for section headers
- **Button Spacing**: `10px` right margin for secondary buttons

## Component Integration Standards

### Required Components

1. `Modal` - Base modal wrapper
2. `FileUploadZone` - File selection and drag-drop
3. `DocumentProcessingCard` - Per-file processing UI
4. `MetadataCapture` - Document metadata form
5. `AccessControlPanel` - User permission management
6. `UploadProgressManager` - Upload status tracking

### Optional Components

1. `OCRToggleSection` - PDF OCR configuration (PDF files only)
2. `VectorIsolationSection` - Advanced vector settings
3. `DropdownDebugPanel` - Development debugging

## Form Submission Logic

### Pre-Submission Validation

1. **File Selection**: At least one file must be selected
2. **Organization/Project**: Both must be selected
3. **Per-File Metadata**: Title and document type required for each file
4. **File Validation**: All files must pass validation checks

### Submission Process

1. **Queue Initialization**: Set up processing queue for all files
2. **Sequential Processing**: Process files one by one
3. **Progress Tracking**: Update UI with real-time status
4. **Result Aggregation**: Collect success/failure counts
5. **User Notification**: Display results with actionable feedback

## Accessibility Standards

### Focus Management

- **Tab Order**: Logical navigation through all interactive elements
- **Focus Indicators**: Clear visual focus rings
- **Keyboard Navigation**: Full keyboard accessibility

### Screen Reader Support

- **Labels**: All form elements properly labeled
- **Descriptions**: Help text and validation messages announced
- **Landmarks**: Proper ARIA landmarks for modal structure

## Error Recovery and User Guidance

### Progressive Disclosure

- **Initial State**: Minimal required information visible
- **Progressive Steps**: Additional options revealed as needed
- **Help Text**: Contextual guidance for complex sections

### Recovery Actions

- **Validation Errors**: Clear actionable error messages
- **Failed Uploads**: Individual retry functionality
- **Cancellation**: Safe exit points without data loss

## Testing and Validation Standards

### Layout Testing

- **Cross-browser**: Consistent appearance across Chrome, Firefox, Safari, Edge
- **Responsive**: Proper scaling on different screen sizes
- **Accessibility**: WCAG 2.1 AA compliance

### Functional Testing

- **File Upload**: Various file types, sizes, and quantities
- **Validation**: All error states and edge cases
- **Processing**: Complete upload workflow with various scenarios

## Related Standards

- **Agent Coding Standards**: `docs/standards/0000_AGENT_CODING_STANDARDS.md`
- **File Naming Standards**: `docs/standards/0002_FILE_NAMING_STANDARDS.md`
- **Modal Component Standards**: Referenced in component library documentation

## Version Control

- **Current Version**: 1.0.0
- **Last Updated**: Based on Other Parties page (01850) implementation
- **Change Management**: All layout changes require standards update

## Implementation Checklist

### Layout Compliance

- [ ] `contractsTheme` color scheme implemented
- [ ] Section styles match specified standards
- [ ] Button styles follow defined patterns
- [ ] Spacing and margins applied consistently

### Functional Compliance

- [ ] All required sections present
- [ ] Conditional logic properly implemented
- [ ] Validation rules enforced
- [ ] Error handling patterns followed

### Accessibility Compliance

- [ ] Focus management implemented
- [ ] Screen reader support verified
- [ ] Keyboard navigation functional

### Testing Compliance

- [ ] Layout tested across devices/browsers
- [ ] Functionality verified in all scenarios
- [ ] Accessibility tools pass compliance checks
