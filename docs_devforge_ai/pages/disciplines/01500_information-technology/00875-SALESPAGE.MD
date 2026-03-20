# Sales Page Documentation

## Overview

The Sales page provides functionality related to sales activities, customer relationship management, and opportunity tracking. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00875-sales/
├── components/               # React components
│   └── 00875-sales-page.js   # Main page component
└── css/                     # Page-specific CSS
    └── 00875-pages-style.css # Page-specific styles
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `0875-background.js` component.

```javascript
// client/src/pages/0875-sales/components/0875-background.js
import React from "react";
// Import the image directly using a relative path - Webpack will handle it
import backgroundImageUrl from "../../../../public/assets/mining/0875.png";

const Background0875 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background0875;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0875-navigation-container`):** Bottom center, contains State Buttons (e.g., `Agents`, `Upsert`, `Workspace`) and the Title Button ("Sales").
2. **Action Button Container (`.A-0875-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state.
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0875-...` follow the pattern established in other pages, using the page number prefix)_

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

The sales page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  sales: './client/src/pages/0875-sales/0875-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/0875-sales/0875-sales.html', // Path to the HTML template
    filename: 'pages/0875-sales/0875-sales.html', // Output path
    chunks: ['sales'], // Link the 'sales' bundle
  }),
  // ...
],
```

## Components

### Sales Page Component

The main page component (`client/src/pages/0875-sales/components/0875-sales-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0875-sales/components/0875-sales-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background from "./0875-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const SalesPage = () => {
  const [currentState, setCurrentState] = useState("Agents"); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("0875 SalesPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0875 SalesPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("0875 SalesPage: Error initializing settings:", error);
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
      <Background />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-0875-button-container">
            {/* Example: {currentState === 'Upsert' && <button>Add Lead</button>} */}
          </div>

          {/* Navigation Container */}
          <div className="A-0875-navigation-container">
            <div className="A-0875-nav-row">
              <button
                onClick={() => handleStateChange("Agents")}
                className={currentState === "Agents" ? "active" : ""}
              >
                Agents
              </button>
              <button
                onClick={() => handleStateChange("Upsert")}
                className={currentState === "Upsert" ? "active" : ""}
              >
                Upsert
              </button>
              <button
                onClick={() => handleStateChange("Workspace")}
                className={currentState === "Workspace" ? "active" : ""}
              >
                Workspace
              </button>
            </div>
            <button className="nav-button primary">Sales</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0875-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button id="logout-button" className="A-0875-logout-button">
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
          <div id="modal-container"></div>
        </div>
      </div>
    </>
  );
};

export default SalesPage;
```

### Modal System

If the Sales page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple sales-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8095/pages/0875-sales/0875-sales.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Sales page (0875) has been created based on the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`0875-sales-page.js`, `0875-background.js`).
2. Webpack entry point (`0875-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. Relies on common CSS for base styles, background, and modals.

## Future Improvements

1. Integrate specific sales-related modals (e.g., lead creation, opportunity update).
2. Add data fetching for sales data.
3. Implement state management for sales data if needed.
4. Refine UI/UX based on specific sales workflows.
5. Add relevant unit/integration tests.
