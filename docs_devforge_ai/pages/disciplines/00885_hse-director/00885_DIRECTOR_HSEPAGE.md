# Director HSE Page Documentation

## Overview

The Director HSE page provides functionality related to Health, Safety, and Environment management, reporting, and compliance tracking. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00885-director-hse/
├── components/               # React components
│   └── 00885-director-hse-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00885-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `0885-background.js` component.

```javascript
// client/src/pages/0885-director-hse/components/0885-background.js
import React from "react";
import backgroundImageUrl from "../../../../public/assets/mining/0885.png"; // Path to image

const Background0885 = () => {
  return (
    <div className="bg-container">
      <img
        id="bg-image"
        src={backgroundImageUrl}
        alt="Director HSE Background"
      />
    </div>
  );
};

export default Background0885;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0885-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Director HSE").
2. **Action Button Container (`.A-0885-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0885-...` follow the pattern established in other pages, using the page number prefix)_

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

The Director HSE page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "director-hse": './client/src/pages/0885-director-hse/0885-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/0885-director-hse/0885-director-hse.html', // Path to the HTML template
    filename: 'pages/0885-director-hse/0885-director-hse.html', // Output path
    chunks: ['director-hse'], // Link the 'director-hse' bundle
  }),
  // ...
],
```

## Components

### Director HSE Page Component

The main page component (`client/src/pages/0885-director-hse/components/0885-director-hse-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0885-director-hse/components/0885-director-hse-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background0885 from "./0885-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const DirectorHSEPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (can be 'agents', 'upsert', or 'workspace')
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("0885 DirectorHSEPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0885 DirectorHSEPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "0885 DirectorHSEPage: Error initializing settings:",
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
  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 0885 Director HSE modal:", modalTarget);
  };

  const handleLogout = () => {
    if (window.handleLogout) window.handleLogout();
  };

  return (
    <>
      <Background0885 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-0885-button-container">
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="A-0885-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0885-01-01-modal-upsert-url")
                  }
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-0885-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0885-01-02-modal-upsert-pdf")
                  }
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-0885-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0885-03-01-modal-minutes-compile")
                  }
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-0885-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0885-03-02-modal-method-statmt")
                  }
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-0885-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0885-03-03-modal-risk-assess")
                  }
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="A-0885-modal-trigger-button"
                onClick={() => handleModalClick("developmentModal")}
              >
                To be customised
              </button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-0885-navigation-container">
            <div className="A-0885-nav-row">
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
            <button className="nav-button primary">Director HSE</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0885-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button
            id="logout-button"
            onClick={handleLogout}
            className="A-0885-logout-button"
          >
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
            id="A-0885-modal-container"
            className="modal-container-root"
          ></div>
        </div>
      </div>
    </>
  );
};

export default DirectorHSEPage; // Corrected export name
```

### Modal System

If the Director HSE page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. All modal trigger buttons currently display "To be customised" as per requirements.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple HSE-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/0885-director-hse/0885-director-hse.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Director HSE page (0885) has been created using the Webpack/React structure, following the patterns established by other migrated pages. Key aspects include:

1. React component-based structure (`0885-director-hse-page.js`, `0885-background.js`).
2. Webpack entry point (`0885-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named "Agents", "Upsert", "Workspace". Modal buttons are titled "To be customised".
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `0885-pages-style.css`.

## Future Improvements

1. Integrate specific HSE-related modals (e.g., incident reporting, audit scheduling).
2. Add data fetching for HSE metrics, reports, or tasks.
3. Implement state management for HSE data if needed.
4. Refine UI/UX based on specific HSE workflows.
5. Add relevant unit/integration tests.
