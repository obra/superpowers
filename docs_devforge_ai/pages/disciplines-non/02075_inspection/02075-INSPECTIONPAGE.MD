# Inspection Page Documentation

## Overview

The Inspection page provides functionality related to inspection processes, tracking, and reporting. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/02075-inspection/
├── components/               # React components
│   └── 02075-inspection-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 02075-pages-style.css # Example page-specific styles
```

## UI Layout

### Background Image

The page uses a background image defined via the `.page-background` CSS class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-02075-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Inspection").
2. **Action Button Container (`.A-02075-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state ("To be customised").
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-02075-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Inspection page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Inspection Page Component

The main page component (`client/src/pages/02075-inspection/components/02075-inspection-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/02075-inspection/components/02075-inspection-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const InspectionPage = () => { // Updated component name
  const [currentState, setCurrentState] = useState(null); // Default state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("02075 InspectionPage: Initializing..."); // Updated log
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("02075 InspectionPage: Settings Initialized."); // Updated log
        // Add auth check here if needed
      } catch (error) {
        console.error("02075 InspectionPage: Error initializing settings:", error); // Updated log
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
          <div className="A-02075-button-container"> {/* Updated class */}
            {/* Example: {currentState === 'upsert' && <button>Upload PDF</button>} */}
          </div>

          {/* Navigation Container */}
          <div className="A-02075-navigation-container"> {/* Updated class */}
            <div className="A-02075-nav-row"> {/* Updated class */}
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Inspection</button> {/* Updated title */}
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-02075-accordion-toggle">☰</button> {/* Updated class */}

          {/* Logout Button */}
          <button id="logout-button" className="A-02075-logout-button">Logout</button> {/* Updated class */}

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-02075-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export default InspectionPage; // Updated export
```

### Modal System

If the Inspection page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) page.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple inspection-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/2075-inspection/2075-inspection.html` (Note: port might differ based on `webpack.config.js`).

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Inspection page (02075) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Integrate specific inspection-related modals (e.g., report generation, issue tracking).
2. Add data fetching for inspection records/checklists.
3. Implement state management for inspection data if needed.
4. Refine UI/UX based on specific inspection workflows.
5. Add relevant unit/integration tests.
