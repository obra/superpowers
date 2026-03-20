# Sundry Page Documentation

## Overview

The Sundry page provides functionality for miscellaneous or general-purpose tasks not covered by other specific departmental pages. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00877-sundry/
├── components/               # React components
│   └── 00877-sundry-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00877-pages-style.css # Page-specific styles
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `Background.js` component.

```javascript
// client/src/pages/0877-sundry/components/0877-background.js
import React from "react";
// Import the image directly using a relative path - Webpack will handle it
import backgroundImageUrl from "../../../../public/assets/mining/0877.png";

const Background0877 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Sundry Background" />
    </div>
  );
};

export default Background0877;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0877-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Sundry").
2. **Action Button Container (`.A-0877-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All buttons currently have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0877-...` follow the pattern established in other pages, using the page number prefix)_

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

The Sundry page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  sundry: './src/pages/0877-sundry/0877-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './public/pages/0877-sundry/0877-sundry.html', // Path to the HTML template
    filename: 'pages/0877-sundry/0877-sundry.html', // Output path
    chunks: ['sundry'], // Link the 'sundry' bundle
  }),
  // ...
],
```

## Components

### Sundry Page Component

The main page component (`client/src/pages/0877-sundry/components/0877-sundry-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0877-sundry/components/0877-sundry-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background0877 from "./0877-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const SundryPage = () => {
  const [currentState, setCurrentState] = useState(null); // Default state to null
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("0877 SundryPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0877 SundryPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("0877 SundryPage: Error initializing settings:", error);
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
      <Background0877 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-0877-button-container">
            {/* Example: {currentState === 'upsert' && <button>Upsert URL</button>} */}
          </div>

          {/* Navigation Container */}
          <div className="A-0877-navigation-container">
            <div className="A-0877-nav-row">
              <button
                onClick={() => handleStateChange("agents")}
                className={currentState === "agents" ? "active" : ""}
              >
                Agents
              </button>
              <button
                onClick={() => handleStateChange("upsert")}
                className={currentState === "upsert" ? "active" : ""}
              >
                Upsert
              </button>
              <button
                onClick={() => handleStateChange("workspace")}
                className={currentState === "workspace" ? "active" : ""}
              >
                Workspace
              </button>
            </div>
            <button className="nav-button primary">Sundry</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0877-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button id="logout-button" className="A-0877-logout-button">
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
          <div
            id="A-0877-modal-container"
            className="modal-container-root"
          ></div>
        </div>
      </div>
    </>
  );
};

export default SundryPage;
```

### Modal System

If the Sundry page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple sundry-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:3000/pages/0877-sundry/0877-sundry.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Sundry page (0877) has been created based on the Webpack/React structure of the Construction page (0300/0600), following the patterns established by pages like Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`0877-sundry-page.js`, `0877-background.js`).
2. Webpack entry point (`0877-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons (Agents, Upsert, Workspace), and toggles.
6. Relies on common CSS for base styles, background, and modals.

## Future Improvements

1. Integrate specific sundry-related modals. The current modal trigger buttons are placeholders ("To be customised").
2. Add data fetching relevant to sundry tasks.
3. Implement state management for sundry data if needed.
4. Refine UI/UX based on specific sundry workflows.
5. Add relevant unit/integration tests.
