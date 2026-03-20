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
