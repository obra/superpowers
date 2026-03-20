# Director Procurement Page Documentation (0888)

## Overview

The Director Procurement page provides functionality related to procurement management, tracking, and coordination. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00888-director-procurement/
├── components/               # React components
│   └── 00888-director-procurement-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00888-pages-style.css # Page-specific styles (located in client/src/common/css/pages/)
```

## UI Layout

### Background Image

The page utilizes the themed background image system using `getThemedImagePath` helper function. The background image is applied via inline styles directly on the main page component div. The specific image is `client/public/assets/default/00888.png`.

```javascript
// Background image implementation in 00888-director-procurement-page.js
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";

const DirectorProcurementPageComponent = () => {
  // Get the themed background image path
  const backgroundImagePath = getThemedImagePath('00888.png');

  return (
    <div
      className="director-procurement-page page-background"
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

1. **Navigation Container (`.A-0888-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Director Procurement").
2. **Action Button Container (`.A-0888-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-0888-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Director Procurement page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "director-procurement": "./client/src/pages/0888-director-procurement/0888-index.js",
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/0888-director-procurement/0888-director-procurement.html', // Path to the HTML template
    filename: 'pages/0888-director-procurement/0888-director-procurement.html', // Output path
    chunks: ['director-procurement'], // Link the 'director-procurement' bundle
  }),
  // ...
],
```

## Components

### Director Procurement Page Component

The main page component (`client/src/pages/0888-director-procurement/components/0888-director-procurement-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0888-director-procurement/components/0888-director-procurement-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background0888 from './0888-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const DirectorProcurementPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);


  useEffect(() => {
    const init = async () => {
      console.log("0888 DirectorProcurementPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0888 DirectorProcurementPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("0888 DirectorProcurementPage: Error initializing settings:", error);
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
    setCurrentState(newState);
  };

  const handleToggleAccordion = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 0888 Director Procurement modal:", modalTarget);
    // Add logic to handle 0888 modals later
  };

  const handleLogout = () => {
    if (window.handleLogout) {
      window.handleLogout();
    } else {
      console.error("Global handleLogout function not found.");
    }
  };

  return (
    <div className="director-procurement-page">
      <Background0888 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Navigation Container */}
          <div className="A-0888-navigation-container">
            <div className="A-0888-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Director Procurement</button>
          </div>

          {/* Button container */}
          <div className={`A-0888-button-container ${isButtonContainerVisible ? "visible" : ""}`}>
            {/* Action buttons */}
            {currentState === "upsert" && (
              <>
                <button type="button" className="A-0888-modal-trigger-button" onClick={() => handleModalClick("A-0888-01-01-modal-upsert-url")} data-modal-target="A-0888-01-01-modal-upsert-url">To be customised</button>
                <button type="button" className="A-0888-modal-trigger-button" onClick={() => handleModalClick("A-0888-01-02-modal-upsert-pdf")} data-modal-target="A-0888-01-02-modal-upsert-pdf">To be customised</button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button type="button" className="A-0888-modal-trigger-button" onClick={() => handleModalClick("A-0888-03-01-modal-minutes-compile")} data-modal-target="A-0888-03-01-modal-minutes-compile">To be customised</button>
                <button type="button" className="A-0888-modal-trigger-button" onClick={() => handleModalClick("A-0888-03-02-modal-method-statmt")} data-modal-target="A-0888-03-02-modal-method-statmt">To be customised</button>
                <button type="button" className="A-0888-modal-trigger-button" onClick={() => handleModalClick("A-0888-03-03-modal-risk-assess")} data-modal-target="A-0888-03-03-modal-risk-assess">To be customised</button>
              </>
            )}
            {currentState === "workspace" && (
              <button type="button" className="A-0888-modal-trigger-button" onClick={() => handleModalClick("developmentModal")} data-modal-target="developmentModal">To be customised</button>
            )}
          </div>
        </div> {/* Close main-content */}
      </div> {/* Close content-wrapper */}

      {/* Accordion Toggle */}
      <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-0888-accordion-toggle">☰</button>

      {/* Logout Button */}
      <button id="logout-button" onClick={handleLogout} className="A-0888-logout-button">
        {/* SVG Icon */}
      </button>

      {/* Accordion Menu */}
      {isSettingsInitialized && (
        <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
          <AccordionProvider>
            <AccordionComponent settingsManager={settingsManager} />
          </AccordionProvider>
        </div>
      )}

      {/* Modal Container */}
      <div id="A-0888-modal-container" className="modal-container-root">
        {/* TODO: Implement modal rendering based on 0888 system */}
      </div>
    </div> // Close director-procurement-page div
  );
};

export default DirectorProcurementPage; // Correct export
```

### Modal System

If the Director Procurement page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple procurement-specific components.

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/0888-director-procurement/0888-director-procurement.html`. (Note the port change to 8093 in webpack config).

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Director Procurement page (0888) has been created following the Webpack/React structure established by other director-level pages (0880-0886). Key aspects include:

1. React component-based structure (`0888-director-procurement-page.js`, `0888-background.js`).
2. Webpack entry point (`0888-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. State buttons renamed to: Agents, Upsert, Workspace.
7. Modal trigger buttons titled: "To be customised".
8. Relies on common CSS for base styles, background, and modals.

## Future Improvements

1. Integrate specific procurement-related modals.
2. Add data fetching for procurement data.
3. Implement state management for procurement data if needed.
4. Refine UI/UX based on specific procurement workflows.
5. Add relevant unit/integration tests.
