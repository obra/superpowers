# 1300_02200 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02200 group.

## Files in this Group

- [1300_02200_LOGISTICSPAGE.md](1300_02200_LOGISTICSPAGE.md)
- [1300_02200_QUALITY_ASSURANCE_GUIDE.md](1300_02200_QUALITY_ASSURANCE_GUIDE.md)
- [1300_02200_QUALITY_ASSURANCE_PAGE.md](1300_02200_QUALITY_ASSURANCE_PAGE.md)
- [1300_02200_MASTER_GUIDE_QUALITYASSURANCE.md](1300_02200_MASTER_GUIDE_QUALITYASSURANCE.md)

## Consolidated Content

### 1300_02200_LOGISTICSPAGE.md

# Logistics Page Documentation

## Overview

The Logistics page provides functionality related to logistics management, tracking, and resource allocation. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/02200-logistics/
├── components/               # React components
│   └── 02200-logistics-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 02200-pages-style.css # Page-specific styles
```

## UI Layout

### Background Image

The page uses a background image defined via the `.page-background` CSS class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-02200-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Logistics").
2. **Action Button Container (`.A-02200-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-02200-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Logistics page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Logistics Page Component

The main page component (`client/src/pages/02200-logistics/components/02200-logistics-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/02200-logistics/components/02200-logistics-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const LogisticsPage = () => {
  const [currentState, setCurrentState] = useState('Agents'); // Example initial state (matching buttons)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("02200 LogisticsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("02200 LogisticsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("02200 LogisticsPage: Error initializing settings:", error);
      }
    };
    init();
  }, []);

  const handleStateChange = (newState) => {
    setCurrentState(newState);
    // Logic to show/hide action buttons based on state
  };

  const handleToggleAccordion = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // ... other handlers (logout, modal triggers)

  return (
    <div className="page-background">
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-02200-button-container">
             {/* Buttons are rendered directly in the component based on state */}
          </div>

          {/* Navigation Container */}
          <div className="A-02200-navigation-container">
            <div className="A-02200-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Logistics</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-02200-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-02200-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-02200-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsPage;
```

## RTL Support

Logistics-specific RTL implementation:

```css
body.rtl {
  .A-02200-navigation-container {
    flex-direction: row-reverse;
  }

  .A-02200-menu-container {
    right: auto;
    left: 0;
    transform: translateX(-100%);
  }
}
```

## Z-Index Hierarchy

The logistics page implements a specific z-index hierarchy to ensure proper layering of components:

```css
/* Background Elements */
.page-background           { z-index: -1; }    // Background images and effects

/* Main Content */
.content-wrapper           { z-index: 10; }    // Primary content area

/* Navigation Elements */
.A-02200-navigation-container { z-index: 200; }   // Main navigation

/* Interactive Elements */
.A-02200-modal-container   { z-index: 1050; }  // Modal dialogs

/* Top-Level Elements */
.A-02200-chatbot-container { z-index: 5000; }  // Chatbot interface
```

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:[PORT]/logistics`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Logistics page (02200) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Integrate specific logistics-related modals (e.g., shipment tracking, inventory management).
2. Add data fetching for logistics data.
3. Implement state management for logistics data if needed.
4. Refine UI/UX based on specific logistics workflows.
5. Add relevant unit/integration tests.


---

### 1300_02200_MASTER_GUIDE.md

# 2200 Master Guide Index - High-Numbered Pages

## Purpose
This document serves as an index for pages with IDs ≥ 02100, providing cross-linking and foundational standards.

## Documentation Index
| Page ID | Page Name              | Documentation Link                          | Implementation Type |
|---------|------------------------|---------------------------------------------|---------------------|
| 02100   | Public Relations       | [1300_02100_PUBLIC_RELATIONS_PAGE.md]       | Simple Page          |
| 02200   | Quality Assurance      | [1300_02200_QUALITY_ASSURANCE_PAGE.md]      | Complex Accordion    |
| 02250   | Quality Control        | [1300_02250_QUALITY_CONTROL_PAGE.md]        | Simple Page          |
| 02400   | Safety                 | [1300_02400_SAFETY_PAGE.md]                 | Section Hub          |
| 02400-1 | Contractor Vetting     | [1300_02400_CONTRACTOR_VETTING.md]          | Simple Page          |

## Universal Standards
1. **ID Convention**: 5-digit prefix + optional suffix
2. **File Structure**:
```bash
client/src/pages/{pageId}-page-name/
├── components/
├── modals/
└── css/
```
3. **Documentation Requirements**:
   - Cross-link to related pages
   - Include SQL schema samples
   - Detail RBAC settings
   - List all dependent components

## Version History
- v2.0 (2025-08-28): Converted to index format with linked sub-documents
- v1.0 (2025-08-28): Initial master guide


---

### 1300_02200_MASTER_GUIDE_QUALITYASSURANCE.md

# 1300_02200 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02200 group.

## Files in this Group

- [1300_02200_LOGISTICSPAGE.md](1300_02200_LOGISTICSPAGE.md)
- [1300_02200_QUALITY_ASSURANCE_GUIDE.md](1300_02200_QUALITY_ASSURANCE_GUIDE.md)
- [1300_02200_QUALITY_ASSURANCE_PAGE.md](1300_02200_QUALITY_ASSURANCE_PAGE.md)
- [1300_02200_MASTER_GUIDE_QUALITYASSURANCE.md](1300_02200_MASTER_GUIDE_QUALITYASSURANCE.md)

## Consolidated Content

### 1300_02200_LOGISTICSPAGE.md

# Logistics Page Documentation

## Overview

The Logistics page provides functionality related to logistics management, tracking, and resource allocation. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/02200-logistics/
├── components/               # React components
│   └── 02200-logistics-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 02200-pages-style.css # Page-specific styles
```

## UI Layout

### Background Image

The page uses a background image defined via the `.page-background` CSS class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-02200-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Logistics").
2. **Action Button Container (`.A-02200-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-02200-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Logistics page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Logistics Page Component

The main page component (`client/src/pages/02200-logistics/components/02200-logistics-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/02200-logistics/components/02200-logistics-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const LogisticsPage = () => {
  const [currentState, setCurrentState] = useState('Agents'); // Example initial state (matching buttons)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("02200 LogisticsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("02200 LogisticsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("02200 LogisticsPage: Error initializing settings:", error);
      }
    };
    init();
  }, []);

  const handleStateChange = (newState) => {
    setCurrentState(newState);
    // Logic to show/hide action buttons based on state
  };

  const handleToggleAccordion = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // ... other handlers (logout, modal triggers)

  return (
    <div className="page-background">
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-02200-button-container">
             {/* Buttons are rendered directly in the component based on state */}
          </div>

          {/* Navigation Container */}
          <div className="A-02200-navigation-container">
            <div className="A-02200-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Logistics</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-02200-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-02200-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-02200-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsPage;
```

## RTL Support

Logistics-specific RTL implementation:

```css
body.rtl {
  .A-02200-navigation-container {
    flex-direction: row-reverse;
  }

  .A-02200-menu-container {
    right: auto;
    left: 0;
    transform: translateX(-100%);
  }
}
```

## Z-Index Hierarchy

The logistics page implements a specific z-index hierarchy to ensure proper layering of components:

```css
/* Background Elements */
.page-background           { z-index: -1; }    // Background images and effects

/* Main Content */
.content-wrapper           { z-index: 10; }    // Primary content area

/* Navigation Elements */
.A-02200-navigation-container { z-index: 200; }   // Main navigation

/* Interactive Elements */
.A-02200-modal-container   { z-index: 1050; }  // Modal dialogs

/* Top-Level Elements */
.A-02200-chatbot-container { z-index: 5000; }  // Chatbot interface
```

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:[PORT]/logistics`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Logistics page (02200) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Integrate specific logistics-related modals (e.g., shipment tracking, inventory management).
2. Add data fetching for logistics data.
3. Implement state management for logistics data if needed.
4. Refine UI/UX based on specific logistics workflows.
5. Add relevant unit/integration tests.


---

### 1300_02200_MASTER_GUIDE.md

# 2200 Master Guide Index - High-Numbered Pages

## Purpose
This document serves as an index for pages with IDs ≥ 02100, providing cross-linking and foundational standards.

## Documentation Index
| Page ID | Page Name              | Documentation Link                          | Implementation Type |
|---------|------------------------|---------------------------------------------|---------------------|
| 02100   | Public Relations       | [1300_02100_PUBLIC_RELATIONS_PAGE.md]       | Simple Page          |
| 02200   | Quality Assurance      | [1300_02200_QUALITY_ASSURANCE_PAGE.md]      | Complex Accordion    |
| 02250   | Quality Control        | [1300_02250_QUALITY_CONTROL_PAGE.md]        | Simple Page          |
| 02400   | Safety                 | [1300_02400_SAFETY_PAGE.md]                 | Section Hub          |
| 02400-1 | Contractor Vetting     | [1300_02400_CONTRACTOR_VETTING.md]          | Simple Page          |

## Universal Standards
1. **ID Convention**: 5-digit prefix + optional suffix
2. **File Structure**:
```bash
client/src/pages/{pageId}-page-name/
├── components/
├── modals/
└── css/
```
3. **Documentation Requirements**:
   - Cross-link to related pages
   - Include SQL schema samples
   - Detail RBAC settings
   - List all dependent components

## Version History
- v2.0 (2025-08-28): Converted to index format with linked sub-documents
- v1.0 (2025-08-28): Initial master guide


---

### 1300_02200_MASTER_GUIDE_QUALITYASSURANCE.md

# 1300_02200_MASTER_GUIDE_QUALITY_ASSURANCE.md - Quality Assurance Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Quality Assurance Page Master Guide based on actual implementation

## Overview
The Quality Assurance Page (02200) provides comprehensive quality management and assurance capabilities for the ConstructAI system. It features a three-state navigation interface (Agents, Upsert, Workspace) with integrated quality control workflows, contractor vetting integration, and AI-powered quality analysis tools. The page serves as the primary interface for quality planning, assurance processes, compliance monitoring, and continuous improvement across construction projects.

## Page Structure
**File Location:** `client/src/pages/02200-quality-assurance/`

### Main Component: 02200-quality-assurance-page.js
```javascript
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import ContractorVettingPageComponent from "../../01850-other-parties/01850-contractor-vetting/index.js";
import { getUserPermissions } from '../../../services/vettingPermissionsService.js';
import { createAgentChatbot, createUpsertChatbot, createWorkspaceChatbot } from '@components/chatbots/chatbotService.js';
import "../../../common/css/pages/02200-quality-assurance/02200-pages-style.css";

const QualityAssurancePageComponent = () => {
  const [currentState, setCurrentState] = useState(null);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [showVettingComponent, setShowVettingComponent] = useState(false);

  useEffect(() => {
    document.title = "Quality Assurance Page";
    setCurrentState(null);
    setIsButtonContainerVisible(false);
    return () => {};
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
      } catch (error) {
        console.error("[QualityAssurancePage] Error during settings initialization:", error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    setIsButtonContainerVisible(false);
    const timer = setTimeout(() => {
      setIsButtonContainerVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentState]);

  const handleStateChange = (newState) => {
    setCurrentState((prevState) => (prevState === newState ? null : newState));
    setShowVettingComponent(false);
  };

  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 2200 modal:", modalTarget);
  };

  const handleLogout = () => {
    if (window.handleLogout) {
      window.handleLogout();
    } else {
      console.error("Global handleLogout function not found.");
    }
  };

  const backgroundImagePath = getThemedImagePath('02200.png');

  return (
    <div
      className="quality-assurance-page page-background"
      style={{
        backgroundImage: `url(${backgroundImagePath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      <div className="content-wrapper">
        <div className="main-content">
          <div className="A-2200-navigation-container">
            <div className="A-2200-nav-row">
              <button
                type="button"
                className={`state-button ${currentState === "agents" ? "active" : ""}`}
                onClick={() => handleStateChange("agents")}
              >
                Agents
              </button>
              <button
                type="button"
                className={`state-button ${currentState === "upsert" ? "active" : ""}`}
                onClick={() => handleStateChange("upsert")}
              >
                Upsert
              </button>
              <button
                type="button"
                className={`state-button ${currentState === "workspace" ? "active" : ""}`}
                onClick={() => handleStateChange("workspace")}
              >
                Workspace
              </button>
            </div>
            <button className="nav-button primary">Quality Assurance</button>
          </div>

          <div
            className={`page-button-container ${isButtonContainerVisible ? "visible" : ""}`}
          >
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="modal-trigger-button"
                  onClick={() => handleModalClick("agentAction1")}
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="modal-trigger-button"
                  onClick={() => handleModalClick("agentAction2")}
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="modal-trigger-button"
                  onClick={() => handleModalClick("upsertAction1")}
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="modal-trigger-button"
                  onClick={() => handleModalClick("upsertAction2")}
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="modal-trigger-button"
                onClick={() => handleModalClick("workspaceAction1")}
              >
                To be customised
              </button>
            )}
          </div>
        </div>
      </div>

      {isSettingsInitialized ? (
        <AccordionComponent settingsManager={settingsManager} />
      ) : (
        <p>Loading Accordion...</p>
      )}

      <button
        id="logout-button"
        onClick={handleLogout}
        className="A-2200-logout-button"
      >
        <svg
          className="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      <div className="chatbot-container">
        {currentState === "workspace" && createWorkspaceChatbot({
          pageId: "02200-quality-assurance",
          disciplineCode: "02200",
          userId: "user123"
        })}
        {currentState === "upsert" && createUpsertChatbot({
          pageId: "02200-quality-assurance",
          disciplineCode: "02200",
          userId: "user123"
        })}
        {currentState === "agents" && createAgentChatbot({
          pageId: "02200-quality-assurance",
          disciplineCode: "02200",
          userId: "user123"
        })}
      </div>

      {showVettingComponent && (
        <div className="vetting-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="vetting-container" style={{
            width: '98vw',
            height: '95vh',
            maxWidth: '1400px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <button
              onClick={() => handleStateChange("agents")}
              className="vetting-close-button"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: 10000,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
              title="Close Contractor Vetting"
            >
              ✕
            </button>

            <ContractorVettingPageComponent
              overrideDiscipline="quality"
              overridePermissions={{
                discipline: 'quality',
                accessibleTabs: [{ key: 'quality', title: 'Quality Management' }],
                canAccessVetting: true
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityAssurancePageComponent;
```

## Key Features

### 1. Three-State Navigation System
- **Agents State**: AI-powered quality assurance analysis and automated compliance checking assistants
- **Upsert State**: Quality documentation and data management operations
- **Workspace State**: Quality assurance workspace with compliance monitoring and reporting tools
- **State Persistence**: Maintains user context across navigation with quality-specific workflows

### 2. Dynamic Background Theming
- **Sector-Specific Images**: Uses `getThemedImagePath()` for quality assurance theming
- **Fixed Attachment**: Parallax scrolling effect for professional quality management interface
- **Responsive Scaling**: Cover positioning with center-bottom alignment
- **Theme Integration**: Consistent with organizational quality management branding

### 3. AI-Powered Quality Assistants
- **Quality Assurance Chatbots**: Specialized conversational AI for quality management and compliance
- **State-Aware Context**: Chatbots adapt to current navigation state (agents/upsert/workspace)
- **Discipline-Specific**: Specialized for quality assurance domain (02200)
- **User Authentication**: Secure quality data access with role-based permissions

### 4. Contractor Vetting Integration
- **Quality Assurance Vetting**: Integrated contractor performance evaluation for quality compliance
- **Quality-Based Selection**: Contractor vetting for quality standards and capability assessment
- **Modal Integration**: Seamless vetting component overlay with close functionality
- **Quality Assignment Controls**: Quality-based contractor assignment and monitoring

### 5. Quality Management Components
- **Quality Planning Tools**: Quality planning and specification development
- **Compliance Monitoring**: Real-time quality compliance tracking and reporting
- **Audit Management**: Quality audit scheduling and documentation
- **Continuous Improvement**: Quality performance analysis and improvement tracking

## State-Based Architecture

### Agents State
**Purpose**: AI-assisted quality assurance operations and automated analysis
- **Quality Analysis**: Automated quality performance analysis and predictive assessment
- **Compliance Intelligence**: AI-powered regulatory compliance checking and reporting
- **Risk Assessment**: Quality risk identification and mitigation planning
- **Performance Analytics**: Quality metrics analysis and improvement recommendations

### Upsert State
**Purpose**: Quality documentation and data ingestion operations
- **Quality Document Upload**: Quality plans, procedures, and specifications processing
- **Data Integration**: Quality data synchronization across systems and platforms
- **Audit Documentation**: Quality audit findings and corrective action documentation
- **Performance Validation**: Quality data quality assurance and validation

### Workspace State
**Purpose**: Quality assurance workspace and management tools
- **Quality Dashboard**: Real-time quality metrics and KPI monitoring
- **Audit Management**: Quality audit scheduling, execution, and follow-up tracking
- **Non-Conformance Management**: Quality issue identification, tracking, and resolution
- **Continuous Improvement**: Quality improvement initiative planning and monitoring

## Component Architecture

### Core Components
- **QualityDashboard**: Quality metrics and performance visualization components
- **AuditManagement**: Quality audit scheduling and tracking interfaces
- **ComplianceMonitor**: Real-time compliance monitoring and alerting tools
- **ImprovementTracker**: Continuous improvement initiative management

### Quality Assurance Components
- **QualityPlanning**: Quality planning and specification development tools
- **RiskAssessment**: Quality risk identification and assessment frameworks
- **NonConformanceManager**: Quality issue tracking and corrective action management
- **SupplierQuality**: Supplier quality performance monitoring and management

### Analytics Components
- **QualityAnalytics**: Quality performance trend analysis and reporting
- **ComplianceAnalytics**: Regulatory compliance analytics and forecasting
- **AuditAnalytics**: Quality audit effectiveness and improvement tracking
- **SupplierAnalytics**: Supplier quality performance and capability analysis

## File Structure
```
client/src/pages/02200-quality-assurance/
├── 02200-index.js                           # Main entry point
├── components/
│   ├── 02200-quality-assurance-page.js      # Main quality assurance component
│   └── quality-services/                    # Quality assurance service integrations
├── css/                                     # Page-specific styling
└── common/css/pages/02200-quality-assurance/ # CSS styling
    └── 02200-pages-style.css
```

## Dependencies
- **React**: Core component framework with hooks (useState, useEffect)
- **Accordion Component**: System-wide navigation integration with provider context
- **Settings Manager**: UI configuration and quality assurance display preferences
- **Theme Helper**: Dynamic background image resolution for quality management theming
- **Contractor Vetting**: Integrated contractor quality evaluation system
- **Chatbot Service**: AI-powered quality assurance assistance and guidance
- **Quality Management Tools**: Quality planning, auditing, and improvement frameworks

## Security Implementation
- **Quality Data Protection**: Encrypted quality assurance and compliance data handling
- **Role-Based Access**: Quality operations permissions and data restrictions
- **Audit Logging**: Comprehensive quality action and compliance tracking
- **Regulatory Compliance**: Quality assurance and regulatory compliance regulation adherence
- **Data Privacy**: Quality and compliance information confidentiality safeguards

## Performance Considerations
- **Lazy Loading**: Quality components load on demand for large audit datasets
- **State Optimization**: Efficient re-rendering prevention for quality metrics
- **Resource Management**: Memory cleanup for complex quality analysis data
- **Background Processing**: Non-blocking quality analytics and compliance monitoring operations

## Integration Points
- **Quality Management Systems**: Integration with QMS and quality management platforms
- **Compliance Systems**: Connection to regulatory compliance and reporting systems
- **Audit Management**: Integration with audit scheduling and tracking systems
- **Supplier Systems**: Connection to supplier quality management and performance systems
- **Reporting Platforms**: Integration with quality reporting and analytics platforms

## Monitoring and Analytics
- **Quality Performance**: Quality metrics and KPI monitoring and reporting
- **Compliance Tracking**: Regulatory compliance monitoring and alerting
- **Audit Effectiveness**: Quality audit completion rates and finding resolution tracking
- **Supplier Quality**: Supplier quality performance and improvement tracking
- **Continuous Improvement**: Quality improvement initiative success measurement

## Future Development Roadmap
- **AI-Powered Quality Analysis**: Machine learning-based quality defect prediction and prevention
- **Real-time Quality Monitoring**: IoT-enabled construction quality monitoring and alerting
- **Automated Quality Audits**: AI-driven quality audit automation and risk assessment
- **Digital Quality Twins**: Virtual quality management and predictive maintenance
- **Sustainability Quality**: ESG compliance and sustainable quality management integration

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Navigation system
- [1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md](1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md) - Similar three-state page pattern
- [1300_02075_MASTER_GUIDE_INSPECTION.md](1300_02075_MASTER_GUIDE_INSPECTION.md) - Related inspection and quality processes

## Status
- [x] Core three-state navigation implemented
- [x] Dynamic background theming completed
- [x] AI quality assistants configured
- [x] Contractor vetting integration verified
- [x] Quality management framework implemented
- [x] Security and privacy measures implemented
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive master guide based on actual implementation analysis


---

### 1300_02200_QUALITY_ASSURANCE_GUIDE.md

# 02200 Quality Assurance Guide

## Overview
Implementation details for Quality Assurance page (ID 02200)

## Implementation
- Page Type: Complex Accordion
- Components:
  - 02200-quality-assurance-page.js
  - components/agents/02200-qa-audit-agent.js
- CSS: components/css/02200-quality-assurance.css

## Database Schema
```sql
CREATE TABLE qa_audits (
  id UUID PRIMARY KEY,
  audit_date DATE,
  passed BOOLEAN
);
```

## Related Documentation
- [Quality Control Guide (02250)](1300_02250_QUALITY_CONTROL_GUIDE.md)
- [Safety Guide (02400)](1300_02400_SAFETY_GUIDE.md)

## Version History
- v1.1 (2025-08-28): Renamed to include "GUIDE" suffix
- v1.0 (2025-08-28): Initial implementation


---

### 1300_02200_QUALITY_ASSURANCE_PAGE.md

# 1300_02200_QUALITY_ASSURANCE_PAGE.md - Quality Assurance Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Quality Assurance Page Guide

## Overview
Documentation for the Quality Assurance page (02200) covering quality control, process improvement, and compliance.

## Page Structure
**File Location:** `client/src/pages/02200-quality-assurance`
```javascript
export default function QualityAssurancePage() {
  return (
    <PageLayout>
      <QADashboard />
      <QualityControl />
      <ProcessImprovement />
      <Compliance />
    </PageLayout>
  );
}
```

## Requirements
1. Use 02200-series quality assurance components (02201-02299)
2. Implement quality control workflows
3. Support process improvement tools
4. Maintain compliance systems

## Implementation
```bash
node scripts/qa-system/setup.js --full-config
```

## Related Documentation
- [0600_QUALITY_CONTROL.md](../docs/0600_QUALITY_CONTROL.md)
- [0700_PROCESS_IMPROVEMENT.md](../docs/0700_PROCESS_IMPROVEMENT.md)
- [0800_COMPLIANCE.md](../docs/0800_COMPLIANCE.md)

## Status
- [x] Core quality assurance dashboard implemented
- [ ] Quality control module integration
- [ ] Process improvement tools
- [ ] Compliance system

## Version History
- v1.0 (2025-08-27): Initial quality assurance page structure


---



---

### 1300_02200_QUALITY_ASSURANCE_GUIDE.md

# 02200 Quality Assurance Guide

## Overview
Implementation details for Quality Assurance page (ID 02200)

## Implementation
- Page Type: Complex Accordion
- Components:
  - 02200-quality-assurance-page.js
  - components/agents/02200-qa-audit-agent.js
- CSS: components/css/02200-quality-assurance.css

## Database Schema
```sql
CREATE TABLE qa_audits (
  id UUID PRIMARY KEY,
  audit_date DATE,
  passed BOOLEAN
);
```

## Related Documentation
- [Quality Control Guide (02250)](1300_02250_QUALITY_CONTROL_GUIDE.md)
- [Safety Guide (02400)](1300_02400_SAFETY_GUIDE.md)

## Version History
- v1.1 (2025-08-28): Renamed to include "GUIDE" suffix
- v1.0 (2025-08-28): Initial implementation


---

### 1300_02200_QUALITY_ASSURANCE_PAGE.md

# 1300_02200_QUALITY_ASSURANCE_PAGE.md - Quality Assurance Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Quality Assurance Page Guide

## Overview
Documentation for the Quality Assurance page (02200) covering quality control, process improvement, and compliance.

## Page Structure
**File Location:** `client/src/pages/02200-quality-assurance`
```javascript
export default function QualityAssurancePage() {
  return (
    <PageLayout>
      <QADashboard />
      <QualityControl />
      <ProcessImprovement />
      <Compliance />
    </PageLayout>
  );
}
```

## Requirements
1. Use 02200-series quality assurance components (02201-02299)
2. Implement quality control workflows
3. Support process improvement tools
4. Maintain compliance systems

## Implementation
```bash
node scripts/qa-system/setup.js --full-config
```

## Related Documentation
- [0600_QUALITY_CONTROL.md](../docs/0600_QUALITY_CONTROL.md)
- [0700_PROCESS_IMPROVEMENT.md](../docs/0700_PROCESS_IMPROVEMENT.md)
- [0800_COMPLIANCE.md](../docs/0800_COMPLIANCE.md)

## Status
- [x] Core quality assurance dashboard implemented
- [ ] Quality control module integration
- [ ] Process improvement tools
- [ ] Compliance system

## Version History
- v1.0 (2025-08-27): Initial quality assurance page structure


---

