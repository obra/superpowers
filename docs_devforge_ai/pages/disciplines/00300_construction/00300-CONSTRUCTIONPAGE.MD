# Construction Page Documentation

## Overview

The Construction page provides functionality related to construction site management, progress tracking, and resource allocation. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00300-construction/
├── components/               # React components
│   └── 00300-construction-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00300-pages-style.css # Page-specific styles
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `.page-background` class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-00300-navigation-container`):** Bottom center, contains State Buttons (e.g., `Planning`, `Execution`, `Monitoring`) and the Title Button ("Construction").
2. **Action Button Container (`.A-00300-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state.
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-00300-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The construction page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Construction Page Component

The main page component (`client/src/pages/00300-construction/components/00300-construction-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/00300-construction/components/00300-construction-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const ConstructionPage = () => {
  const [currentState, setCurrentState] = useState('Planning'); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("00300 ConstructionPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("00300 ConstructionPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("00300 ConstructionPage: Error initializing settings:", error);
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
    <>
      <div className="page-background"></div>
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-00300-button-container">
            {/* Example: {currentState === 'Planning' && <button>Plan Task</button>} */}
          </div>

          {/* Navigation Container */}
          <div className="A-00300-navigation-container">
            <div className="A-00300-nav-row">
              <button onClick={() => handleStateChange('Planning')} className={currentState === 'Planning' ? 'active' : ''}>Planning</button>
              <button onClick={() => handleStateChange('Execution')} className={currentState === 'Execution' ? 'active' : ''}>Execution</button>
              <button onClick={() => handleStateChange('Monitoring')} className={currentState === 'Monitoring' ? 'active' : ''}>Monitoring</button>
            </div>
            <button className="nav-button primary">Construction</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-00300-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-00300-logout-button">Logout</button>

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
    </>
  );
};

export default ConstructionPage;
```

### Modal System

If the Construction page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple construction-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
npm run dev
```

## Build

Build for production using the standard command:

```bash
npm run build
```

## Migration Notes

The Construction page (00300) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Integrate specific construction-related modals (e.g., task assignment, progress reporting).
2. Add data fetching for construction projects/tasks.
3. Implement state management for project data if needed.
4. Refine UI/UX based on specific construction workflows.
5. Add relevant unit/integration tests.
