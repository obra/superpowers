# Director Finance Page Documentation

## Overview

The Director Finance page provides functionality related to financial oversight, reporting, and analysis. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00884-1-director-finance/
├── components/               # React components
│   └── 00884-1-director-finance-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00884-1-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `0884-1-background.js` component. The specific image used is `client/public/assets/mining/0884-1.png`.

```javascript
// client/src/pages/0884-1-director-finance/components/0884-1-background.js
import React from "react";
import backgroundImageUrl from "../../../../public/assets/mining/0884-1.png";

const Background0884_1 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background0884_1;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0884-1-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Director Finance").
2. **Action Button Container (`.A-0884-1-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0884-1-...` follow the pattern established in other pages, using the page number prefix)_

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container {
  /* Centered */
}
.modal-overlay {
  /* Full screen overlay */
}
```

## Webpack Configuration

The Director Finance page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "director-finance": "./client/src/pages/0884-1-director-finance/0884-1-index.js",
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/0884-1-director-finance/0884-1-director-finance.html', // Path to the HTML template
    filename: 'pages/0884-1-director-finance/0884-1-director-finance.html', // Output path
    chunks: ['director-finance'], // Link the 'director-finance' bundle
  }),
  // ...
],
```

## Components

### Director Finance Page Component

The main page component (`client/src/pages/0884-1-director-finance/components/0884-1-director-finance-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0884-1-director-finance/components/0884-1-director-finance-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background0884_1 from "./0884-1-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const DirectorFinancePageComponent = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("0884-1 DirectorFinancePage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0884-1 DirectorFinancePage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "0884-1 DirectorFinancePage: Error initializing settings:",
          error
        );
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
      <Background0884_1 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-0884-1-button-container">
            {currentState === "upsert" && (
              <>
                <button className="A-0884-1-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-0884-1-modal-trigger-button">
                  To be customised
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button className="A-0884-1-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-0884-1-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-0884-1-modal-trigger-button">
                  To be customised
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button className="A-0884-1-modal-trigger-button">
                To be customised
              </button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-0884-1-navigation-container">
            <div className="A-0884-1-nav-row">
              <button
                onClick={() => handleStateChange("agents")}
                className={`state-button ${
                  currentState === "agents" ? "active" : ""
                }`}
              >
                Agents
              </button>
              <button
                onClick={() => handleStateChange("upsert")}
                className={`state-button ${
                  currentState === "upsert" ? "active" : ""
                }`}
              >
                Upsert
              </button>
              <button
                onClick={() => handleStateChange("workspace")}
                className={`state-button ${
                  currentState === "workspace" ? "active" : ""
                }`}
              >
                Workspace
              </button>
            </div>
            <button className="nav-button primary">Director Finance</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0884-1-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button id="logout-button" className="A-0884-1-logout-button">
            Logout
          </button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? "visible" : ""}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-0884-1-modal-container"></div>
        </div>
      </div>
    </>
  );
};

export const DirectorFinancePage = DirectorFinancePageComponent;
```

### Modal System

If the Director Finance page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple finance-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/0884-1-director-finance/0884-1-director-finance.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Director Finance page (0884-1) has been created based on the structure of the Construction page (0300), following the patterns established by pages like Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`0884-1-director-finance-page.js`, `0884-1-background.js`).
2. Webpack entry point (`0884-1-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `0884-1-pages-style.css`.
7. State buttons renamed to "Agents", "Upsert", "Workspace".
8. Modal trigger buttons titled "To be customised".

## Future Improvements

1. Integrate specific finance-related modals (e.g., budget approval, report generation).
2. Add data fetching for financial data.
3. Implement state management for financial data if needed.
4. Refine UI/UX based on specific finance workflows.
5. Add relevant unit/integration tests.
