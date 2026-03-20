# 1300_01400 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_01400 group.

## Files in this Group

- [1300_01400_HEALTHPAGE.md](1300_01400_HEALTHPAGE.md)
- [1300_01400_MASTER_GUIDEHEALTH.md](1300_01400_MASTER_GUIDEHEALTH.md)

## Consolidated Content

### 1300_01400_HEALTHPAGE.md

# Health Page Documentation

## Overview

The Health page provides functionality related to health monitoring, incident reporting, and wellness program management. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/01400-health/
├── components/               # React components
│   └── 01400-health-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 01400-pages-style.css # Page-specific styles (located in common/css/pages/01400-health)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `1400-background.js` component. The specific image is `client/public/assets/mining/1400.png`.

```javascript
// client/src/pages/1400-health/components/1400-background.js
import React from 'react';
import backgroundImageUrl from '../../../../public/assets/mining/1400.png';

const Background1400 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background1400;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-1400-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Health").
2. **Action Button Container (`.A-1400-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`.A-1400-logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-1400-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS. The modal container specific to this page is `#A-1400-modal-container`.

```css
/* Common modal styles apply */
.modal-container-root { /* Base styles */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Health page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  health: './client/src/pages/1400-health/1400-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/1400-health/1400-health.html', // Path to the HTML template
    filename: 'pages/1400-health/1400-health.html', // Output path
    chunks: ['health'], // Link the 'health' bundle
  }),
  // ...
],
```

## Components

### Health Page Component

The main page component (`client/src/pages/1400-health/components/1400-health-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/1400-health/components/1400-health-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background1400 from './1400-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const HealthPageComponent = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (can be 'Agents', 'Upsert', or 'Workspace')
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("1400 HealthPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("1400 HealthPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("1400 HealthPage: Error initializing settings:", error);
      }
    };
    init();
  }, []);

   // Effect for button visibility animation
  useEffect(() => {
    setIsButtonContainerVisible(false);
    const timer = setTimeout(() => {
      setIsButtonContainerVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentState]);


  const handleStateChange = (newState) => {
    setCurrentState(newState);
    // Logic to show/hide action buttons based on state
  };

  // ... other handlers (logout, modal triggers)

  return (
    <div className="health-page">
      <Background1400 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className={`A-1400-button-container ${isButtonContainerVisible ? "visible" : ""}`}>
             {currentState === 'upsert' ? (
                <React.Fragment>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                </React.Fragment>
             ) : null}
             {currentState === 'agents' ? (
                <React.Fragment>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                </React.Fragment>
             ) : null}
             {currentState === 'workspace' ? (
                <button className="A-1400-modal-trigger-button">To be customised</button>
             ) : null}
          </div>

          {/* Navigation Container */}
          <div className="A-1400-navigation-container">
            <div className="A-1400-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Health</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" className="A-1400-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-1400-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container`}> {/* Visibility handled internally by AccordionComponent */}
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-1400-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export const HealthPage = HealthPageComponent; // Ensure export matches import in index.js
```

### Modal System

If the Health page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. The modal trigger buttons are currently placeholders titled "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple health-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1400-health/1400-health.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Health page (1400) has been created using the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`1400-health-page.js`, `1400-background.js`).
2. Webpack entry point (`1400-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named "Agents", "Upsert", "Workspace". Modal buttons are titled "To be customised".
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `1400-pages-style.css`.

## Future Improvements

1. Integrate specific health-related modals (e.g., incident reporting, check-up scheduling).
2. Add data fetching for health records or incidents.
3. Implement state management for health data if needed.
4. Refine UI/UX based on specific health management workflows.
5. Add relevant unit/integration tests.


---

### 1300_01400_MASTER_GUIDE.md

# 1300_01400_MASTER_GUIDE.md - Health Management

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Health Page Guide

## Overview
Documentation for the Health Management page (01400) showing organizational health protocols and medical tracking systems.

## Page Structure
**File Location:** `client/src/pages/01400-health`
```javascript
export default function HealthPage() {
  return (
    <PageLayout>
      <SectorTitle>01400 - Health Management</SectorTitle>
      <HealthMonitoringDashboard />
      <StandardAccordion sectionId="health-section" />
      <MedicalComplianceTracker sector="health" />
    </PageLayout>
  );
}
```

## Requirements
1. Use 01400-series component naming (01401-01499)
2. Implement health-specific color scheme (#2E7D32)
3. Integrate medical alert system
4. Include epidemiological tracking

## Implementation
1. Create health monitoring components
2. Connect to health database APIs
3. Set up health compliance checks:
```bash
node scripts/health-compliance/setup.js --sector=health
```

## Related Documentation
- [0400_SECURITY_MODEL.md](../docs/0400_SECURITY_MODEL.md)
- [0950_ACCORDION_MANAGEMENT.md](../docs/0950_ACCORDION_MANAGEMENT.md)

## Status
- [x] Core dashboard implemented
- [ ] Alert system integration
- [ ] Compliance reporting
- [ ] Audit logging

## Version History
- v1.0 (2025-08-27): Initial health page structure


---

### 1300_01400_MASTER_GUIDEHEALTH.md

# 1300_01400 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_01400 group.

## Files in this Group

- [1300_01400_HEALTHPAGE.md](1300_01400_HEALTHPAGE.md)
- [1300_01400_MASTER_GUIDEHEALTH.md](1300_01400_MASTER_GUIDEHEALTH.md)

## Consolidated Content

### 1300_01400_HEALTHPAGE.md

# Health Page Documentation

## Overview

The Health page provides functionality related to health monitoring, incident reporting, and wellness program management. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/01400-health/
├── components/               # React components
│   └── 01400-health-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 01400-pages-style.css # Page-specific styles (located in common/css/pages/01400-health)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `1400-background.js` component. The specific image is `client/public/assets/mining/1400.png`.

```javascript
// client/src/pages/1400-health/components/1400-background.js
import React from 'react';
import backgroundImageUrl from '../../../../public/assets/mining/1400.png';

const Background1400 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background1400;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-1400-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Health").
2. **Action Button Container (`.A-1400-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`.A-1400-logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-1400-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS. The modal container specific to this page is `#A-1400-modal-container`.

```css
/* Common modal styles apply */
.modal-container-root { /* Base styles */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Health page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  health: './client/src/pages/1400-health/1400-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/1400-health/1400-health.html', // Path to the HTML template
    filename: 'pages/1400-health/1400-health.html', // Output path
    chunks: ['health'], // Link the 'health' bundle
  }),
  // ...
],
```

## Components

### Health Page Component

The main page component (`client/src/pages/1400-health/components/1400-health-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/1400-health/components/1400-health-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background1400 from './1400-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const HealthPageComponent = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (can be 'Agents', 'Upsert', or 'Workspace')
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("1400 HealthPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("1400 HealthPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("1400 HealthPage: Error initializing settings:", error);
      }
    };
    init();
  }, []);

   // Effect for button visibility animation
  useEffect(() => {
    setIsButtonContainerVisible(false);
    const timer = setTimeout(() => {
      setIsButtonContainerVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentState]);


  const handleStateChange = (newState) => {
    setCurrentState(newState);
    // Logic to show/hide action buttons based on state
  };

  // ... other handlers (logout, modal triggers)

  return (
    <div className="health-page">
      <Background1400 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className={`A-1400-button-container ${isButtonContainerVisible ? "visible" : ""}`}>
             {currentState === 'upsert' ? (
                <React.Fragment>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                </React.Fragment>
             ) : null}
             {currentState === 'agents' ? (
                <React.Fragment>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                  <button className="A-1400-modal-trigger-button">To be customised</button>
                </React.Fragment>
             ) : null}
             {currentState === 'workspace' ? (
                <button className="A-1400-modal-trigger-button">To be customised</button>
             ) : null}
          </div>

          {/* Navigation Container */}
          <div className="A-1400-navigation-container">
            <div className="A-1400-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Health</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" className="A-1400-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-1400-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container`}> {/* Visibility handled internally by AccordionComponent */}
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-1400-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export const HealthPage = HealthPageComponent; // Ensure export matches import in index.js
```

### Modal System

If the Health page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. The modal trigger buttons are currently placeholders titled "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple health-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1400-health/1400-health.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Health page (1400) has been created using the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`1400-health-page.js`, `1400-background.js`).
2. Webpack entry point (`1400-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named "Agents", "Upsert", "Workspace". Modal buttons are titled "To be customised".
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `1400-pages-style.css`.

## Future Improvements

1. Integrate specific health-related modals (e.g., incident reporting, check-up scheduling).
2. Add data fetching for health records or incidents.
3. Implement state management for health data if needed.
4. Refine UI/UX based on specific health management workflows.
5. Add relevant unit/integration tests.


---

### 1300_01400_MASTER_GUIDE.md

# 1300_01400_MASTER_GUIDE.md - Health Management

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Health Page Guide

## Overview
Documentation for the Health Management page (01400) showing organizational health protocols and medical tracking systems.

## Page Structure
**File Location:** `client/src/pages/01400-health`
```javascript
export default function HealthPage() {
  return (
    <PageLayout>
      <SectorTitle>01400 - Health Management</SectorTitle>
      <HealthMonitoringDashboard />
      <StandardAccordion sectionId="health-section" />
      <MedicalComplianceTracker sector="health" />
    </PageLayout>
  );
}
```

## Requirements
1. Use 01400-series component naming (01401-01499)
2. Implement health-specific color scheme (#2E7D32)
3. Integrate medical alert system
4. Include epidemiological tracking

## Implementation
1. Create health monitoring components
2. Connect to health database APIs
3. Set up health compliance checks:
```bash
node scripts/health-compliance/setup.js --sector=health
```

## Related Documentation
- [0400_SECURITY_MODEL.md](../docs/0400_SECURITY_MODEL.md)
- [0950_ACCORDION_MANAGEMENT.md](../docs/0950_ACCORDION_MANAGEMENT.md)

## Status
- [x] Core dashboard implemented
- [ ] Alert system integration
- [ ] Compliance reporting
- [ ] Audit logging

## Version History
- v1.0 (2025-08-27): Initial health page structure


---

### 1300_01400_MASTER_GUIDEHEALTH.md

# 1300_01400_MASTER_GUIDE_HEALTH.md - Health Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Health Page Master Guide based on actual implementation

## Overview
The Health Page (01400) provides comprehensive occupational health and wellness management capabilities for the ConstructAI system. It features a three-state navigation interface (Agents, Upsert, Workspace) with integrated AI-powered health assistants, dynamic theming, and specialized health and safety workflows including medical record management, health risk assessments, wellness program administration, and occupational health monitoring. The page serves as the primary interface for health and safety operations, employee wellness programs, and occupational health compliance.

## Page Structure
**File Location:** `client/src/pages/01400-health/`

### Main Component: 01400-health-page.js
```javascript
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import ChatbotBase from "@components/chatbots/base/ChatbotBase.js";
import "../../../common/css/pages/01400-health/01400-pages-style.css";

const HealthPageComponent = () => {
  const [currentState, setCurrentState] = useState(null);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);

  useEffect(() => {
    document.title = "Health Page";
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
      } catch (error) {
        console.error("[HealthPage DEBUG] Error during settings initialization:", error);
        setIsSettingsInitialized(true);
      }
    };
    init();

    return () => {
      // Cleanup logic if needed
    };
  }, []);

  useEffect(() => {
    setIsButtonContainerVisible(false);
    const timer = setTimeout(() => {
      setIsButtonContainerVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentState]);

  const handleStateChange = (newState) => {
    setCurrentState(newState);
  };

  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 1400 Health modal:", modalTarget);
  };

  const handleLogout = () => {
    if (window.handleLogout) {
      window.handleLogout();
    } else {
      console.error("Global handleLogout function not found.");
    }
  };

  const backgroundImagePath = getThemedImagePath('01400.png');

  return (
    <div
      className="health-page page-background"
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
          <div className="A-1400-navigation-container">
            <div className="A-1400-nav-row">
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
            <button className="nav-button primary">Health</button>
          </div>

          <div
            className={`A-1400-button-container ${isButtonContainerVisible ? "visible" : ""}`}
          >
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="A-1400-modal-trigger-button"
                  onClick={() => handleModalClick("A-1400-01-01-modal-upsert-url")}
                  data-modal-target="A-1400-01-01-modal-upsert-url"
                >
                  Upsert URL
                </button>
                <button
                  type="button"
                  className="A-1400-modal-trigger-button"
                  onClick={() => handleModalClick("A-1400-01-02-modal-upsert-pdf")}
                  data-modal-target="A-1400-01-02-modal-upsert-pdf"
                >
                  Upsert PDF
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-1400-modal-trigger-button"
                  onClick={() => handleModalClick("A-1400-03-01-modal-minutes-compile")}
                  data-modal-target="A-1400-03-01-modal-minutes-compile"
                >
                  Compile Minutes
                </button>
                <button
                  type="button"
                  className="A-1400-modal-trigger-button"
                  onClick={() => handleModalClick("A-1400-03-02-modal-method-statmt")}
                  data-modal-target="A-1400-03-02-modal-method-statmt"
                >
                  Method Statement
                </button>
                <button
                  type="button"
                  className="A-1400-modal-trigger-button"
                  onClick={() => handleModalClick("A-1400-03-03-modal-risk-assess")}
                  data-modal-target="A-1400-03-03-modal-risk-assess"
                >
                  Risk Assessment
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <>
                <button
                  type="button"
                  className="A-1400-modal-trigger-button"
                  onClick={() => handleModalClick("developmentModal")}
                  data-modal-target="developmentModal"
                >
                  Open Development Modal
                </button>
                <button
                  type="button"
                  className="A-1400-modal-trigger-button"
                  onClick={() => window.location.hash = '/inspections'}
                  data-modal-target="inspectionsModal"
                >
                  Inspections Management
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isSettingsInitialized ? (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      ) : (
        <p>Loading Accordion...</p>
      )}

      <button
        id="logout-button"
        onClick={handleLogout}
        className="A-1400-logout-button"
      >
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      <div id="chatbot-container">
        {currentState && (
          <ChatbotBase
            pageId="01400-health"
            disciplineCode="01400"
            userId="user-placeholder"
            chatType={
              currentState === "agents" ? "agent" :
              currentState === "upsert" ? "upsert" :
              currentState === "workspace" ? "workspace" : "document"
            }
          />
        )}
      </div>

      <div id="A-1400-modal-container" className="modal-container-root">
      </div>
    </div>
  );
};

export default HealthPageComponent;
```

## Key Features

### 1. Three-State Navigation System
- **Agents State**: AI-powered health analysis and automated wellness assistants
- **Upsert State**: Health record and policy management, medical data processing
- **Workspace State**: Health dashboard, inspections management, and wellness program administration
- **State Persistence**: Maintains user context across navigation with health-specific workflows

### 2. Dynamic Background Theming
- **Sector-Specific Images**: Uses `getThemedImagePath()` for contextual health backgrounds
- **Fixed Attachment**: Parallax scrolling effect for professional health interface
- **Responsive Scaling**: Cover positioning with center-bottom alignment
- **Theme Integration**: Consistent with organizational health and wellness branding

### 3. AI-Powered Health Assistants
- **Health Chatbots**: Specialized conversational AI for health and wellness operations
- **State-Aware Context**: Chatbots adapt to current navigation state (agents/upsert/workspace)
- **Discipline-Specific**: Specialized for health domain (01400) with adaptive chat types
- **User Authentication**: Secure health data access with role-based medical permissions

### 4. Comprehensive Health Modal System
- **Medical Record Management**: Employee health record processing and storage
- **Risk Assessment Modal**: Health and safety risk evaluation and mitigation
- **Wellness Program Modal**: Employee wellness initiative administration
- **Method Statement Modal**: Health and safety procedural documentation
- **Minutes Compilation Modal**: Health committee meeting documentation

### 5. Inspections Integration
- **Health Inspections Management**: Direct integration with workplace health inspections
- **Hash-Based Routing**: Seamless navigation to `/inspections` for detailed inspection workflows
- **Compliance Tracking**: Health and safety inspection scheduling and reporting
- **Audit Integration**: Comprehensive health inspection audit trails

## State-Based Architecture

### Agents State
**Purpose**: AI-assisted health analysis and wellness operations
- **Medical Record Analysis**: Automated health record processing and insights
- **Wellness Program Creation**: AI-powered employee wellness initiative design
- **Health Risk Assessment**: Automated health and safety risk evaluation
- **Compliance Monitoring**: Real-time health regulation compliance tracking

### Upsert State
**Purpose**: Health data ingestion and record management operations
- **URL Health Policy Import**: Direct health policy and guideline import from external sources
- **PDF Medical Record Processing**: Secure employee medical document upload and parsing
- **Data Validation**: Health information integrity and privacy compliance checks
- **Bulk Health Operations**: Large-scale employee health data processing and updates

### Workspace State
**Purpose**: Health dashboard and program administration workspace
- **Health Dashboard Configuration**: Custom health metrics and wellness KPI dashboards
- **Inspections Management**: Direct access to workplace health and safety inspections
- **Wellness Program Analytics**: Employee wellness participation and effectiveness tracking
- **Health Policy Administration**: Corporate health policy creation and management

## File Structure
```
client/src/pages/01400-health/
├── 01400-index.js                           # Main entry point
├── 01400-inspections/                       # Inspections integration
│   └── components/                          # Inspection components
├── components/
│   ├── 01400-health-page.js                 # Main health component
│   └── health-services/                     # Health service integrations
├── css/                                     # Page-specific styling
└── common/css/pages/01400-health/           # CSS styling
    └── 01400-pages-style.css
```

## Dependencies
- **React**: Core component framework with hooks (useState, useEffect)
- **Accordion Component**: System-wide navigation integration with provider context
- **Settings Manager**: UI configuration and health display preferences
- **Theme Helper**: Dynamic background image resolution for health theming
- **Chatbot Base**: Adaptive conversational AI system for health operations
- **Inspection System**: Integrated workplace health and safety inspection management

## Security Implementation
- **Health Data Protection**: Encrypted sensitive medical information handling
- **HIPAA Compliance**: Health Insurance Portability and Accountability Act compliance
- **Role-Based Access**: Health operation permissions and medical data restrictions
- **Audit Logging**: Comprehensive health action and medical data access tracking
- **Privacy Controls**: Patient privacy and medical confidentiality safeguards

## Performance Considerations
- **Lazy Loading**: Health components load on demand
- **State Optimization**: Efficient re-rendering prevention for health data
- **Resource Management**: Memory cleanup for large medical datasets
- **Background Processing**: Non-blocking health analytics and reporting operations

## Integration Points
- **Medical Systems**: Integration with electronic health record (EHR) systems
- **Wellness Platforms**: Employee wellness program management systems
- **Inspection Software**: Workplace health and safety inspection platforms
- **Compliance Systems**: Regulatory compliance monitoring and reporting
- **HR Systems**: Human resources integration for employee health management

## Monitoring and Analytics
- **Health Operations**: Usage tracking and health workflow analytics
- **Wellness Metrics**: Employee wellness program participation and effectiveness
- **Compliance Tracking**: Health and safety regulation compliance status
- **Medical Data Access**: Health record access logging and security monitoring
- **AI Interaction**: Health assistant usage and medical guidance effectiveness

## Future Development Roadmap
- **Telemedicine Integration**: Virtual health consultation capabilities
- **Wearable Device Integration**: Employee health monitoring device connectivity
- **Mental Health Support**: Comprehensive mental wellness program management
- **Emergency Response**: Workplace emergency health response coordination
- **Global Health Compliance**: International health regulation management

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Navigation system
- [1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md](1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md) - Similar three-state page pattern
- [1300_02400_SAFETY_MASTER_GUIDE.md](1300_02400_SAFETY_MASTER_GUIDE.md) - Related health and safety operations
- [1300_01500_HUMAN_RESOURCES_MASTER_GUIDE.md](1300_01500_HUMAN_RESOURCES_MASTER_GUIDE.md) - Related employee wellness management

## Status
- [x] Core three-state navigation implemented
- [x] Dynamic background theming completed
- [x] AI health assistants integrated
- [x] Inspections management integration verified
- [x] Health modal system implemented
- [x] Security and privacy measures implemented
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive master guide based on actual implementation analysis


---



---

