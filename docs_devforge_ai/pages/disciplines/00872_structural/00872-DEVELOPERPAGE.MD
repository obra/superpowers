# Developer Page Documentation

## Overview

The Developer page provides functionality related to developer tasks, code management, and technical documentation. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00872-developer/
├── components/               # React components
│   └── 00872-developer-page.js # Main page component
└── css/                     # Page-specific CSS is in common/css/pages/00872-developer/
    └── 00872-developer-style.css # Page-specific styles
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `00872-background.js` component, referencing the image `public/assets/mining/00872.png`.

```javascript
// client/src/pages/00872-developer/components/00872-background.js
import React from "react";
import backgroundImageUrl from "../../../../public/assets/mining/00872.png"; // Path remains the same

const Background00872 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background00872;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-00872-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Developer").
2. **Action Button Container (`.A-00872-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state (all currently titled "To be customised").
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-00872-...` follow the pattern established in other pages, using the page number prefix)_

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

The developer page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  developer: './client/src/pages/00872-developer/00872-index.js', // Added developer entry point
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/00872-developer/00872-developer.html', // Path to the HTML template
    filename: 'pages/00872-developer/00872-developer.html', // Output path
    chunks: ['developer'], // Link the 'developer' bundle
  }),
  // ...
],
```

## Components

### Developer Page Component

The main page component (`client/src/pages/00872-developer/components/00872-developer-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/00872-developer/components/00872-developer-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background00872 from "./00872-background.js";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const DeveloperPageComponent = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("00872 DeveloperPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("00872 DeveloperPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "00872 DeveloperPage: Error initializing settings:",
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
    <div className="developer-page">
      <Background00872 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-00872-button-container">
            {currentState === "upsert" /* Example based on actual code */ && (
              <>
                <button className="A-00872-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-00872-modal-trigger-button">
                  To be customised
                </button>
              </>
            )}
            {/* ... other state buttons */}
          </div>

          {/* Navigation Container */}
          <div className="A-00872-navigation-container">
            <div className="A-00872-nav-row">
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
            <button className="nav-button primary">Developer</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-00872-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button id="logout-button" className="A-00872-logout-button">
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
            id="A-00872-modal-container"
            className="modal-container-root"
          ></div>
        </div>
      </div>
    </div>
  );
};

export const DeveloperPage = DeveloperPageComponent;
```

### Modal System

If the Developer page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. Currently, all modal trigger buttons are placeholders.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple developer-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/00872-developer/00872-developer.html` (Note: port might differ based on `webpack.config.js`).

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Developer page (00872) has been created based on the Construction (0300) template and migrated to the Webpack/React structure, following the patterns established by pages like Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`00872-developer-page.js`, `00872-background.js`).
2. Webpack entry point (`00872-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named 'Agents', 'Upsert', 'Workspace'. Modal buttons are placeholders.
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `00872-developer-style.css`.

## Future Improvements

1. Integrate specific developer-related modals (e.g., code snippets, API keys).
2. Add data fetching for developer tasks/repositories.
3. Implement state management for developer data if needed.
4. Refine UI/UX based on specific developer workflows.
5. Add relevant unit/integration tests.
6. Resolve any outstanding TypeScript errors (e.g., the SVG issue in `00872-developer-page.js`).
