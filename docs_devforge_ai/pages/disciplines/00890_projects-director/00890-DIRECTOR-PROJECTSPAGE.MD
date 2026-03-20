# Director Projects Page Documentation

## Overview

The Director Projects page provides functionality related to project management, oversight, and strategic planning. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00890-director-projects/
├── components/               # React components
│   └── 00890-director-projects-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00890-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the themed background image system using `getThemedImagePath` helper function. The background image is applied via inline styles directly on the main page component div. The specific image is `client/public/assets/default/00890.png`.

```javascript
// Background image implementation in 00890-director-projects-page.js
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";

const DirectorProjectsPageComponent = () => {
  // Get the themed background image path
  const backgroundImagePath = getThemedImagePath('00890.png');

  return (
    <div
      className="director-projects-page page-background"
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
      {/* Page content */}
    </div>
  );
};
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-00890-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Director Projects").
2. **Action Button Container (`.A-00890-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons should have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-00890-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Director Projects page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Director Projects Page Component

The main page component (`client/src/pages/00890-director-projects/components/00890-director-projects-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/00890-director-projects/components/00890-director-projects-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const DirectorProjectsPage = () => {
  const [currentState, setCurrentState] = useState('Agents'); // Default state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("00890 DirectorProjectsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("00890 DirectorProjectsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("00890 DirectorProjectsPage: Error initializing settings:", error);
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
  const handleModalClick = (modalId) => {
      console.log(`Opening modal: ${modalId}`);
      // Placeholder for modal opening logic
      // Ensure buttons triggering modals have title="To be customised"
  };


  return (
    <div className="page-background">
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-00890-button-container">
            {/* Example: {currentState === 'Agents' && <button title="To be customised" onClick={() => handleModalClick('agentModal')}>Manage Agents</button>} */}
            {/* Add other modal trigger buttons here with title="To be customised" */}
          </div>

          {/* Navigation Container */}
          <div className="A-00890-navigation-container">
            <div className="A-00890-nav-row">
              <button onClick={() => handleStateChange('Agents')} className={`state-button ${currentState === 'Agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('Upsert')} className={`state-button ${currentState === 'Upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('Workspace')} className={`state-button ${currentState === 'Workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Director Projects</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-00890-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-00890-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="modal-container"></div>
        </div>
      </div>
    </div>
  );
};

export default DirectorProjectsPage;
