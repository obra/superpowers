# Chemical Engineering Page Documentation (00835)

## Overview

The Chemical Engineering page provides functionality related to chemical process management, simulation, and analysis. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00835-chemical-engineering/
├── components/               # React components
│   └── 00835-chemical-engineering-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00835-pages-style.css # Page-specific styles
```

## UI Layout

### Background Image

The page uses a background image defined via the `.page-background` CSS class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-00835-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Chemical Engineering").
2. **Action Button Container (`.A-00835-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons currently have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-00835-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container-root { /* Root container for modals */ }
.modal-overlay { /* Full screen overlay */ }
.modal-content { /* Modal box styling */ }
```

## Webpack Configuration

The Chemical Engineering page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Chemical Engineering Page Component

The main page component (`client/src/pages/00835-chemical-engineering/components/00835-chemical-engineering-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/00835-chemical-engineering/components/00835-chemical-engineering-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const ChemicalEngineeringPageComponent = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  // ... other state variables (e.g., for modals)

  useEffect(() => {
    const init = async () => {
      console.log("00835 ChemicalEngineeringPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("00835 ChemicalEngineeringPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("00835 ChemicalEngineeringPage: Error initializing settings:", error);
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

  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 00835 Chemical Engineering modal:", modalTarget);
    // Add logic to handle 00835 modals later
  };

  // ... other handlers (logout)

  return (
    <div className="page-background">
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className={`A-00835-button-container ${isButtonContainerVisible ? "visible" : ""}`}>
             {currentState === "upsert" && (
              <>
                <button type="button" className="A-00835-modal-trigger-button" onClick={() => handleModalClick("A-00835-01-01-modal-upsert-url")} data-modal-target="A-00835-01-01-modal-upsert-url">To be customised</button>
                <button type="button" className="A-00835-modal-trigger-button" onClick={() => handleModalClick("A-00835-01-02-modal-upsert-pdf")} data-modal-target="A-00835-01-02-modal-upsert-pdf">To be customised</button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button type="button" className="A-00835-modal-trigger-button" onClick={() => handleModalClick("A-00835-03-01-modal-minutes-compile")} data-modal-target="A-00835-03-01-modal-minutes-compile">To be customised</button>
                <button type="button" className="A-00835-modal-trigger-button" onClick={() => handleModalClick("A-00835-03-02-modal-method-statmt")} data-modal-target="A-00835-03-02-modal-method-statmt">To be customised</button>
                <button type="button" className="A-00835-modal-trigger-button" onClick={() => handleModalClick("A-00835-03-03-modal-risk-assess")} data-modal-target="A-00835-03-03-modal-risk-assess">To be customised</button>
              </>
            )}
            {currentState === "workspace" && (
              <button type="button" className="A-00835-modal-trigger-button" onClick={() => handleModalClick("developmentModal")} data-modal-target="developmentModal">To be customised</button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-00835-navigation-container">
            <div className="A-00835-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Chemical Engineering</button>
          </div>

          {/* Accordion Toggle (Assuming standard ID) */}
          <button id="toggle-accordion" className="A-00835-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-00835-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container`}> {/* Visibility handled internally by AccordionComponent? */}
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-00835-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export const ChemicalEngineeringPage = ChemicalEngineeringPageComponent;

```

### Modal System

If the Chemical Engineering page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. Currently, all modal trigger buttons are placeholders with the title "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple chemical-engineering-specific components.

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

The Chemical Engineering page (00835) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

1. Implement specific chemical engineering-related modals.
2. Add data fetching for relevant chemical processes or data.
3. Implement state management for process data if needed.
4. Refine UI/UX based on specific chemical engineering workflows.
5. Add relevant unit/integration tests.
