# Environmental Page Documentation

## Overview

The Environmental page provides functionality related to environmental monitoring, compliance tracking, and reporting. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/01000-environmental/
├── components/               # React components
│   └── 01000-environmental-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 01000-pages-style.css # Page-specific styles (likely in common)
```

## UI Layout

### Background Image

The page uses a background image defined via the `.page-background` CSS class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-01000-navigation-container`):** Bottom center, contains State Buttons (e.g., `Agents`, `Upsert`, `Workspace`) and the Title Button ("Environmental").
2. **Action Button Container (`.A-01000-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state.
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-01000-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Environmental page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Environmental Page Component

The main page component (`client/src/pages/01000-environmental/components/01000-environmental-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/01000-environmental/components/01000-environmental-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const EnvironmentalPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("01000 EnvironmentalPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("01000 EnvironmentalPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("01000 EnvironmentalPage: Error initializing settings:", error);
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
          <div className="A-01000-button-container">
             {/* Buttons rendered based on currentState: 'agents', 'upsert', 'workspace' */}
          </div>

          {/* Navigation Container */}
          <div className="A-01000-navigation-container">
            <div className="A-01000-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Environmental</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-01000-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-01000-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-01000-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalPage; // Or export const EnvironmentalPage = ... based on file structure
```

### Modal System

If the Environmental page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. The current implementation uses placeholder buttons with the title "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple environmental-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1000-environmental/1000-environmental.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Environmental page (01000) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Integrate specific environmental-related modals (e.g., data logging, report generation).
2. Add data fetching for environmental metrics/data points.
3. Implement state management for environmental data if needed.
4. Refine UI/UX based on specific environmental management workflows.
5. Add relevant unit/integration tests.
