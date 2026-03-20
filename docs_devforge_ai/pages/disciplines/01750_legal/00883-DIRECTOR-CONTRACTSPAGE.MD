# Director Contracts Page Documentation

## Overview

The Director Contracts page provides functionality related to managing director-level contracts. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00883-director-contracts/
├── components/               # React components
│   └── 00883-director-contracts-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00883-pages-style.css # CSS styles are in client/src/common/css/pages/00883-director-contracts/00883-pages-style.css
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `0883-background.js` component.

```javascript
// client/src/pages/0883-director-contracts/components/0883-background.js
import React from "react";
import backgroundImageUrl from "../../../../public/assets/mining/0883.png"; // Updated path

const Background0883 = () => {
  // Renamed component
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background0883;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0883-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Director Contracts").
2. **Action Button Container (`.A-0883-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0883-...` follow the pattern established in other pages, using the page number prefix)_

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

The Director Contracts page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "director-contracts": './client/src/pages/0883-director-contracts/0883-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/0883-director-contracts/0883-director-contracts.html', // Path to the HTML template
    filename: 'pages/0883-director-contracts/0883-director-contracts.html', // Output path
    chunks: ['director-contracts'], // Link the 'director-contracts' bundle
  }),
  // ...
],
```

## Components

### Director Contracts Page Component

The main page component (`client/src/pages/0883-director-contracts/components/0883-director-contracts-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0883-director-contracts/components/0883-director-contracts-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background0883 from "./0883-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const DirectorContractsPageComponent = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("0883 DirectorContractsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0883 DirectorContractsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "0883 DirectorContractsPage: Error initializing settings:",
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
      <Background0883 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-0883-button-container">
            {currentState === "upsert" && (
              <>
                <button className="A-0883-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-0883-modal-trigger-button">
                  To be customised
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button className="A-0883-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-0883-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-0883-modal-trigger-button">
                  To be customised
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button className="A-0883-modal-trigger-button">
                To be customised
              </button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-0883-navigation-container">
            <div className="A-0883-nav-row">
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
            <button className="nav-button primary">Director Contracts</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0883-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button id="logout-button" className="A-0883-logout-button">
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
          <div id="A-0883-modal-container"></div>
        </div>
      </div>
    </>
  );
};

export const DirectorContractsPage = DirectorContractsPageComponent; // Updated export name
```

### Modal System

If the Director Contracts page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple director-contracts-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/0883-director-contracts/0883-director-contracts.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Director Contracts page (0883) has been created based on the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`0883-director-contracts-page.js`, `0883-background.js`).
2. Webpack entry point (`0883-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `0883-pages-style.css`.
7. State buttons renamed to "Agents", "Upsert", "Workspace".
8. Modal trigger buttons titled "To be customised".

## Future Improvements

1. Integrate specific director-contracts-related modals.
2. Add data fetching for contracts.
3. Implement state management for contract data if needed.
4. Refine UI/UX based on specific director contract workflows.
5. Add relevant unit/integration tests.
