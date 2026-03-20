# Page Architecture Guide

## ⚡ Quick Start Guide

**Need to create a new page quickly?**
1. Create directory: `client/src/pages/{prefix}/`
2. Main files: `{prefix}-index.js`, `components/{prefix}-page.js`, `css/{prefix}-style.css`
3. Import accordion: `import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";`
4. Add to App.js: `<Route path="/{page-url}" element={<PageComponent />} />`

## 🚨 Critical Implementation Warnings

### Navigation Positioning (CRITICAL!)
- ⚠️ **Complex pages (00435-style): BOTTOM navigation ONLY**
  - Use `position: fixed; bottom: 10px;` 
  - **DO NOT** use `position: sticky; top: 0;` - this will break the design!
- ⚠️ **Simple pages: Top or tab navigation**

### File Naming (Import Failures!)
- ⚠️ **CORRECT**: `import DevSettings from './02050-developer-settings-page'`
- ⚠️ **INCORRECT**: `import DevSettings from './DevSettings'` ← This will fail!
- ⚠️ **Sub-routing**: Use `index.jsx` as router, register direct routes in App.js

### Settings Manager Integration
- ⚠️ **Required on ALL pages**: Settings manager initialization with error handling
- ⚠️ **Wait for initialization**: Check `isSettingsInitialized` before rendering content

## 📋 Page Implementation Checklist

### Basic Page Setup
- [ ] Directory created: `client/src/pages/{prefix}/`
- [ ] Index file: `{prefix}-index.js` with component import
- [ ] Main component: `components/{prefix}-page.js`
- [ ] CSS file: `css/{prefix}-style.css`
- [ ] Route added to App.js
- [ ] Added to UI display mappings

### Core Integration (Required)
- [ ] AccordionComponent imported and wrapped in provider
- [ ] Settings manager initialization with error handling
- [ ] Logout button positioned (fixed, bottom-right)
- [ ] Background image handling (if required)
- [ ] Error boundaries and fallbacks

### Navigation System
- [ ] **Complex pages**: Bottom-positioned state navigation
- [ ] **Simple pages**: Tab or menu-based navigation
- [ ] Mobile responsive navigation

## 🎯 Page Type Decision Tree

**Which type of page are you creating?**

→ **Multiple states/modes with AI agents?** 
  ✅ Use Complex Page (00435-style)
  - Three-state navigation (bottom-positioned!)
  - Dynamic background theming
  - Advanced modal workflows

→ **Simple functionality with tabs/forms?**
  ✅ Use Simple Page (timesheet-style)
  - Tab navigation or simple menus
  - Standard modals
  - Optional background images

## Overview
This document provides a comprehensive guide to the page architecture patterns used in the ConstructAI system. It covers both complex accordion-based pages (like 00435) and simpler link-based pages (like timesheet, travel, all documents), establishing standards for consistent implementation across the platform.

## Page Classification System

### Complex Accordion Pages (00435-style)
These pages represent the most sophisticated implementation pattern in ConstructAI:

**Characteristics:**
- Three-state button navigation (Agents, Upsert, Workspace)
- Dynamic background image theming based on current state
- Advanced modal systems with complex workflows
- Animated grid layouts with sophisticated interactions
- Comprehensive state management
- AI-powered agent systems as core functionality

**Examples:**
- 00435-contracts-post-award
- Other department-specific complex pages

### Simpler Link-Based Pages
These pages are accessed through direct links and represent streamlined implementations:

**Characteristics:**
- Tab-based or simple menu navigation
- May or may not have background images (varies by page)
- Standard modal systems with basic workflows
- Standard grid or form layouts
- Focus on single primary function
- Standard accordion integration

**Examples:**
- 00106-timesheet
- 00105-travel-arrangements  
- 0200-all-documents
- 03010-email-management

## Common Architecture Elements

### 1. Settings Manager Integration
All pages must integrate with the settings manager for consistent UI behavior:

```javascript
useEffect(() => {
  const initSettings = async () => {
    try {
      console.log("[PagePrefix] Initializing settings manager...");
      if (!settingsManager) {
        console.warn("[PagePrefix] Settings manager is not available");
        setIsSettingsInitialized(true);
        return;
      }
      await settingsManager.initialize();
      console.log("[PagePrefix] Settings manager initialized");
      try {
        await settingsManager.applySettings();
        console.log("[PagePrefix] Settings applied successfully");
      } catch (applyError) {
        console.warn(
          "[PagePrefix] Could not apply settings, using defaults:",
          applyError
        );
      }
      setIsSettingsInitialized(true);
    } catch (err) {
      console.error("[PagePrefix] Error initializing settings:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setIsSettingsInitialized(true);
    }
  };
  initSettings();
}, []);
```

### 2. Accordion System Integration
All pages integrate with the accordion system, though with different levels of complexity:

**Complex Pages:**
```javascript
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
)}
```

**Simpler Pages:**
```javascript
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
)}
```

### 3. Logout Button Standardization
All pages must include the standardized logout button in the same position:

```css
.logout-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 6000;
  transition: all 0.2s ease;
}

.logout-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
```

## Implementation Standards

### Directory Structure Standards
```
client/src/pages/page-prefix/
├── page-prefix-index.js                    # Entry point
├── components/
│   ├── page-prefix-page.js                 # Main page component
│   ├── page-prefix-grid.js                 # Grid/data display component
│   ├── modals/                             # Modal components
│   │   ├── page-prefix-entry-modal.js
│   │   └── page-prefix-management-modal.js
│   └── css/
│       └── page-prefix-style.css           # Page-specific styles
└── assets/                                 # Optional assets
    └── page-prefix.png                     # Background images, icons, etc.
```

### Component Architecture Standards

#### Main Page Component Structure
```javascript
import React, { useState, useEffect } from "react";
import { Card, Button, Spinner, Alert } from "react-bootstrap";

// Core imports
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";

// Page-specific imports
import "./css/page-prefix-style.css";

const PageComponent = () => {
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize settings manager
  useEffect(() => {
    // Settings initialization logic
  }, []);

  return (
    <div className="page-wrapper">
      {/* Background handling (varies by page type) */}
      
      {/* Accordion Integration */}
      {isSettingsInitialized && (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      )}
      
      {/* Main Content */}
      <div className="content-wrapper">
        <Card className="page-card">
          <Card.Header>
            <h3>Page Title</h3>
          </Card.Header>
          <Card.Body>
            {/* Page Content */}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PageComponent;
```

### Background Image Handling Standards

#### Complex Pages (00435-style)
```javascript
// Dynamic background theming based on state
const backgroundImagePath = getThemedImagePath(`page-prefix-bg-${activeState}.png`);

<div 
  className="page-background" 
  style={{
    backgroundImage: `url(${backgroundImagePath})`,
    backgroundAttachment: 'fixed',
    minHeight: '100vh'
  }}
>
```

#### Simpler Pages
```javascript
// Optional background image - varies by page requirements
const backgroundImagePath = "/assets/default/page-prefix.png"; // Optional

{backgroundImagePath && (
  <div
    className="page-background"
    style={{
      backgroundImage: `url(${backgroundImagePath})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -1
    }}
  />
)}
```

## Sub-Section Routing Patterns

### Nested Component Routing
Some pages have multiple sub-sections that require internal routing. This pattern is used when a main page contains distinct functional areas that need separate URL paths.

**Example: Information Technology → Developer Settings → Prompts Management**

#### Directory Structure for Sub-Section Routing
```
client/src/pages/02050-information-technology/
├── components/
│   ├── 02050-information-technology-page.js  # Main IT page
│   └── DevSettings/                          # Sub-section directory
│       ├── index.jsx                         # Sub-section router
│       ├── 02050-developer-settings-page.js # Main sub-section component
│       ├── PromptsManagement.jsx             # Nested component
│       ├── LoaderTemplatesTable.jsx          # Additional nested component
│       └── DevSettings.css                   # Sub-section styles
```

#### Sub-Section Router Pattern (index.jsx)
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DevSettingsPage from './02050-developer-settings-page';
import PromptsManagement from './PromptsManagement';

const DevSettingsIndex = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DevSettingsPage />} />
        <Route path="/prompts" element={<PromptsManagement />} />
      </Routes>
    </Router>
  );
};

export default DevSettingsIndex;
```

#### Main App Routing Integration
In `client/src/App.js`, register both the main page and direct sub-section routes:

```javascript
// Import the sub-section components
import PromptsManagementComponent from "./pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx";

// Main page route
<Route path="/information-technology" element={<InformationTechnologyPage />} />

// Direct sub-section route for deep linking
<Route path="/information-technology/prompts-management" element={<PromptsManagementComponent />} />
```

#### Critical Implementation Guidelines

**File Naming Convention:**
- ✅ **CORRECT**: Import from actual filename: `'./02050-developer-settings-page'`
- ❌ **INCORRECT**: Import from non-existent file: `'./DevSettings'`

**Common Routing Issues to Avoid:**
1. **Import Path Mismatch**: Ensure import paths match actual file names
2. **Missing Direct Routes**: Add direct routes in App.js for deep linking
3. **Router Nesting**: Avoid nested Routers unless specifically needed

**Best Practices:**
- Use `index.jsx` as the sub-section router
- Maintain consistent naming patterns
- Ensure main components have descriptive filenames
- Test both nested and direct routing paths

#### Accordion Integration for Sub-Sections
Sub-sections should still integrate with the main accordion system but may have specialized behavior:

```javascript
// In sub-section components
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent 
      settingsManager={settingsManager}
      highlightSection="information-technology"
      highlightSubsection="developer-settings"
    />
  </AccordionProvider>
)}
```

## Navigation System Standards

### Three-State Navigation (Complex Pages) - **CRITICAL: BOTTOM POSITIONING**

**IMPORTANT:** Complex pages (00435-style) use **BOTTOM-POSITIONED** navigation, not top positioning!

#### HTML Structure (Required Pattern)
```javascript
const StateNavigation = ({ activeState, setActiveState }) => {
  return (
    <div className="state-navigation">
      {/* Navigation Container - matches 00435 structure */}
      <div className="page-navigation-container">
        <div className="page-nav-row">
          {/* State Buttons */}
          <button
            type="button"
            className={`state-button ${activeState === "agents" ? "active" : ""}`}
            onClick={() => setActiveState("agents")}
          >
            Agents
          </button>
          <button
            type="button"
            className={`state-button ${activeState === "upsert" ? "active" : ""}`}
            onClick={() => setActiveState("upsert")}
          >
            Upserts
          </button>
          <button
            type="button"
            className={`state-button ${activeState === "workspace" ? "active" : ""}`}
            onClick={() => setActiveState("workspace")}
          >
            Workspace
          </button>
        </div>
        <button className="nav-button primary">[Page Name]</button>
      </div>
    </div>
  );
};
```

#### Required CSS (Bottom Positioning Pattern)
```css
/* State Navigation - 00435 Style - Bottom Positioned */
.state-navigation {
  position: fixed;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  background: transparent;
  border: none;
  margin: 0;
  z-index: 2000;
  pointer-events: none;
  box-shadow: none;
}

.state-navigation > * {
  pointer-events: auto !important;
}

/* Page Navigation Container (matches 00435 pattern) */
.page-navigation-container {
  position: fixed;
  left: 50%;
  bottom: 10px; /* 10px from bottom of viewport */
  transform: translateX(-50%); /* Center horizontally */
  text-align: center;
  z-index: 2000; /* High z-index to ensure buttons are clickable */
  background: transparent; /* Transparent background */
  pointer-events: none; /* Allow clicks to pass through to child elements */
}

.page-navigation-container > * {
  pointer-events: auto !important; /* Ensure child elements can receive clicks */
}

/* Page Navigation Row */
.page-nav-row {
  position: fixed;
  left: 50%;
  bottom: calc(10px + 1.5em + 10px); /* 10px from bottom + title height + 10px spacing */
  transform: translateX(-50%); /* Center horizontally */
  display: flex;
  gap: 10px; /* Space between buttons */
  z-index: 2001; /* Above navigation container */
  pointer-events: auto !important; /* Explicit pointer events */
}

/* Ensure all children of nav-row are clickable */
.page-nav-row > * {
  pointer-events: auto !important;
}

/* State button styling for complex pages */
.page-navigation-container .state-button,
.page-nav-row .state-button {
  background: white; /* White background */
  border: 1px solid var(--primary-color); /* Primary color border */
  border-radius: 20px; /* Rounded corners */
  color: black; /* Black text */
  padding: 8px 16px; /* Consistent padding */
  cursor: pointer; /* Indicates clickable */
  font-size: 0.9rem; /* Reduced font size for compact display */
  transition: all 0.2s; /* Smooth transition for hover effects */
  pointer-events: auto !important;
}

/* Active State Button */
.page-navigation-container .state-button.active,
.page-nav-row .state-button.active {
  background: var(--primary-color); /* Primary color background when active */
  color: white; /* White text when active */
}

/* Primary Navigation Button (Page Title) */
.page-navigation-container .nav-button.primary {
  color: var(--primary-color); /* Primary color text */
  background: transparent; /* Completely transparent background */
  border: none; /* No border */
  padding: 10px 20px; /* Consistent padding */
  cursor: pointer; /* Indicates clickable */
  font-weight: bold; /* Bold text */
  font-size: 1.2em; /* Larger font size */
  position: relative;
  z-index: 100; /* Ensure text is visible above background */
}
```

#### Navigation Positioning Rules
1. **Complex Pages (00435-style)**: Navigation is **FIXED at BOTTOM CENTER** of viewport
2. **Simple Pages**: Navigation can be at top or in-content as tabs
3. **Mobile**: Navigation remains at bottom for complex pages, may move for simple pages

**DO NOT** use `position: sticky; top: 0;` for complex pages - this is incorrect!
**DO** use `position: fixed; bottom: 10px;` with horizontal centering.

### Tab-Based Navigation (Simpler Pages)
```javascript
<Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
  <Tab eventKey="current" title="Current">
    {/* Tab content */}
  </Tab>
  <Tab eventKey="history" title="History">
    {/* Tab content */}
  </Tab>
  <Tab eventKey="templates" title="Templates">
    {/* Tab content */}
  </Tab>
</Tabs>
```

## Modal System Standards

### Standard Modal Pattern
```javascript
const [showModal, setShowModal] = useState(false);
const [modalData, setModalData] = useState(null);

<Modal show={showModal} onHide={() => setShowModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Modal Title</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {/* Modal content */}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSave}>
      Save
    </Button>
  </Modal.Footer>
</Modal>
```

### Advanced Modal Pattern (Complex Pages)
```javascript
const [modalConfig, setModalConfig] = useState({
  show: false,
  type: null,
  data: null,
  workflow: null
});

// Complex modal with multiple steps and AI integration
<AdvancedModal 
  show={modalConfig.show}
  type={modalConfig.type}
  data={modalConfig.data}
  workflow={modalConfig.workflow}
  onClose={() => setModalConfig({ show: false, type: null, data: null })}
  onSave={handleModalSave}
  onAiProcess={handleAiProcess}
/>
```

## CSS and Styling Standards

### Common CSS Structure
```css
/* Page wrapper and background */
.page-wrapper {
  position: relative;
  color: var(--text-color) !important;
}

.page-wrapper * {
  color: var(--text-color) !important;
}

.page-background {
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* Card styling */
.page-card {
  margin: 2rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

/* Grid layouts */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-card {
    margin: 1rem;
    padding: 1rem;
  }
  
  .document-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

## Grid Wrapper and Centering System

### Overview
The grid wrapper system provides consistent horizontal and vertical centering for modal buttons and content elements across complex accordion pages (00435-style). This system ensures that interactive elements are properly positioned in the viewport center, improving user experience and maintaining visual consistency.

### Implementation Pattern

The correct implementation follows this structure:

```javascript
return (
  <div
    className="page-class page-background"
    style={{
      backgroundImage: `url(${backgroundImagePath})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',  // Vertical centering
      alignItems: 'center'        // Horizontal centering
    }}
  >
    {/* Main Layout Structure */}
    <div className="content-wrapper" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      width: '100%',
      flex: 1
    }}>
      <div className="main-content">
        {/* Navigation Container */}
        <div className="A-page-prefix-navigation-container">
          <div className="A-page-prefix-nav-row">
            {/* State Buttons */}
            <button
              type="button"
              className={`state-button ${currentState === "agents" ? "active" : ""}`}
              onClick={() => handleStateChange("agents")}
            >
              Agents
            </button>
            {/* ... other state buttons */}
          </div>
          <button className="nav-button primary">Page Title</button>
        </div>

        {/* Modal Button Container - Centered Grid System */}
        <div className="content-wrapper-centered">
          <div
            className={`A-page-prefix-button-container ${isButtonContainerVisible ? "visible" : ""}`}
          >
            {/* Action Buttons based on state */}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="modal-trigger-button"
                  onClick={() => handleOpenModal('ModalId', { 
                    modalTitle: "Modal Title",
                    triggerPage: "page-prefix"
                  })}
                >
                  📝 Modal Button
                </button>
                {/* ... other buttons */}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
```

### Key Components

#### 1. Main Page Container Centering
- `display: 'flex'` - Enables flexbox layout
- `flexDirection: 'column'` - Vertical layout
- `justifyContent: 'center'` - Vertical centering
- `alignItems: 'center'` - Horizontal centering

#### 2. Content Wrapper Structure
- `content-wrapper` - Main content container with flex properties
- `content-wrapper-centered` - Additional wrapper for precise centering
- `A-page-prefix-button-container` - Page-specific button container

#### 3. CSS Class Naming Convention
- Navigation containers: `A-page-prefix-navigation-container`
- Navigation rows: `A-page-prefix-nav-row`
- Button containers: `A-page-prefix-button-container`
- State buttons: `state-button` (with active states)

### Centering Best Practices

#### 1. Consistent HTML Structure
Always wrap button containers in the `content-wrapper-centered` div to ensure proper centering:

```html
<div className="content-wrapper-centered">
  <div className={`A-page-prefix-button-container ${isVisible ? "visible" : ""}`}>
    <!-- Buttons go here -->
  </div>
</div>
```

#### 2. Flex Container Properties
Use these essential flex properties for consistent centering:
- Parent container: `display: flex`, `justifyContent: 'center'`, `alignItems: 'center'`
- Child container: `display: grid` or `display: flex` for button layout

#### 3. Responsive Centering
The centering system automatically adapts to different screen sizes:
- Desktop: Perfect centering in viewport
- Mobile: Centered with appropriate padding
- Tablet: Responsive centering with flexible layouts

### Common Issues and Solutions

#### 1. Buttons Not Centered
**Problem**: Buttons appear at the top or bottom of the page
**Solution**: Ensure the main page container has `display: 'flex'` and centering properties

#### 2. Horizontal Alignment Issues
**Problem**: Buttons don't center horizontally
**Solution**: Check that `alignItems: 'center'` is applied to the flex container

#### 3. Vertical Alignment Problems
**Problem**: Buttons don't center vertically
**Solution**: Verify `justifyContent: 'center'` is set on the flex container

### CSS Grid vs Flexbox for Buttons

For button layouts within the centered container, use CSS Grid for better control:

```css
.A-page-prefix-button-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 2rem;
  width: 100%;
  max-width: 800px; /* Optional max width */
}

@media (max-width: 768px) {
  .A-page-prefix-button-container {
    grid-template-columns: 1fr;
  }
}
```

### Working Examples
Refer to these pages for correct implementation:
- `client/src/pages/00300-construction/components/00300-construction-page.js` (Working example)
- `client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js` (Fixed implementation)
- `client/src/pages/00425-contracts-pre-award/components/00425-contracts-pre-award-page.js` (Fixed implementation)

## AI Integration Standards

### Agent System Configuration
```javascript
const aiToolsConfig = [
  {
    id: "document-analyzer",
    name: "Document Analyzer",
    description: "AI-powered document content analysis",
    icon: "bi-file-earmark-text",
    category: "analysis",
    enabled: true,
  },
  {
    id: "legal-review",
    name: "Legal Review Agent",
    description: "Automated legal compliance checking",
    icon: "bi-shield-check",
    category: "legal",
    enabled: true,
  }
];

const handleActivateAITool = (toolId, item) => {
  const newProcess = {
    id: Date.now(),
    toolId,
    itemId: item.id,
    status: "processing",
    progress: 0,
    startTime: new Date(),
  };

  setActiveAIProcesses((prev) => [...prev, newProcess]);
};
```

## Performance and Best Practices

### 1. State Management Optimization
```javascript
// Memoization for expensive computations
const filteredItems = useMemo(() => {
  return items.filter(item => {
    // Filtering logic
  });
}, [items, filters]);

// Callback optimization
const handleItemAction = useCallback((item) => {
  // Action logic
}, [dependencies]);
```

### 2. Error Handling Patterns
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await fetchFromDatabase();
      setData(data);
    } catch (dbError) {
      console.error("Database error:", dbError);
      const mockData = generateMockData();
      setData(mockData);
      setError("Using mock data - database unavailable");
    }
  };
  
  fetchData();
}, []);
```

### 3. Loading State Management
```javascript
{isLoading ? (
  <div className="text-center py-4">
    <Spinner animation="border" role="status" className="mb-3" />
    <div>Loading...</div>
  </div>
) : error ? (
  <Alert variant="danger">{error}</Alert>
) : (
  // Content
)}
```

## Implementation Checklist

### New Page Setup
- [ ] Create page directory structure following standards
- [ ] Set up index.js with component import
- [ ] Create main component file with proper structure
- [ ] Add CSS file with standardized styling
- [ ] Register page in UI display mappings
- [ ] Add route to App.js
- [ ] Create required assets (background images, icons)
- [ ] Test accordion integration
- [ ] Verify settings manager integration
- [ ] Implement core functionality
- [ ] Add error handling and fallbacks
- [ ] Test responsive design
- [ ] Document page-specific features

### Quality Assurance
- [ ] Consistent logout button implementation
- [ ] Proper background image handling
- [ ] Standardized navigation system
- [ ] Proper modal system integration
- [ ] Responsive design for all screen sizes
- [ ] Accessibility compliance
- [ ] Performance optimization
- [ ] Error handling and user feedback
- [ ] Security considerations
- [ ] Documentation completeness

## Page Type Comparison Matrix

| Feature | Complex Pages (00435) | Simpler Pages (Timesheet/Travel) |
|---------|----------------------|----------------------------------|
| Navigation | Three-state buttons | Tab-based or simple menus |
| Background | Dynamic theming | Fixed or optional |
| Modals | Advanced workflows | Standard patterns |
| Grid Layout | Animated, complex | Standard, simple |
| AI Integration | Core functionality | Optional features |
| State Management | Comprehensive | Basic tab states |
| Component Architecture | Modular, state-specific | Standard, reusable |
| Performance | High optimization | Standard optimization |

## Related Documentation

**📋 Quick Implementation References:**
- [0050_QUICK_REFERENCE_CARDS.md](0050_QUICK_REFERENCE_CARDS.md) - **30-second implementation guides, troubleshooting, and decision trees**
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - **Complete accordion system documentation with quick start guide**

**📚 Implementation Examples:**
- [1300_00435_SAMPLE_PAGE_STRUCTURE.md](1300_00435_SAMPLE_PAGE_STRUCTURE.md) - Complex page example
- [1300_00106_TIMESHEET_PAGE_EXAMPLE.md](1300_00106_TIMESHEET_PAGE_EXAMPLE.md) - Simpler page example
- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Simpler page implementation

**📚 Supporting Documentation:**
- [1300_0000_DETAILED_PAGE_ACCESS_DOCUMENTATION.md](1300_0000_DETAILED_PAGE_ACCESS_DOCUMENTATION.md) - Page access patterns
- [1300_0000_PAGE_LIST.md](1300_0000_PAGE_LIST.md) - Complete page documentation
- [0700_UI_SETTINGS.md](0700_UI_SETTINGS.md) - UI settings and configuration

This architecture guide provides the foundation for consistent, scalable page development across the ConstructAI system, ensuring that both complex and simpler pages maintain quality standards while serving their specific purposes effectively.
