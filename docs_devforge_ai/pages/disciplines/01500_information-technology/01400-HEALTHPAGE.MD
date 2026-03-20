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
