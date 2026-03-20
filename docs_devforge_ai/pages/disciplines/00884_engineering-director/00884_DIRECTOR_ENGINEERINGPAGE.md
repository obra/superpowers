# Director Engineering Page Documentation

## Overview

The Director Engineering page provides functionality related to engineering management, oversight, and strategic planning. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00884-director-engineering/
├── components/               # React components
│   └── 00884-director-engineering-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00884-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `0884-background.js` component.

```javascript
// client/src/pages/0884-director-engineering/components/0884-background.js
import React from "react";
// Import the image directly using a relative path - Webpack will handle it
import backgroundImageUrl from "../../../../public/assets/mining/0884.png"; // Updated path

const Background0884 = () => {
  // Renamed component
  // backgroundImageUrl now contains the correct path resolved by Webpack

  return (
    <div
      className="bg-container" // Rely on CSS for positioning/sizing
      style={{
        // Only keep fallback color inline, rely on CSS for image styling
        backgroundColor: "#f5f5f5",
      }}
    >
      <img
        id="bg-image" // Optional ID, matches documentation example
        src={backgroundImageUrl}
        alt="Background"
        // Styling (width, height, object-fit) should be handled by '.bg-container img' CSS rule
      />
    </div>
  );
};

export default Background0884; // Updated export name
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0884-navigation-container`):** Bottom center, contains State Buttons ("Agents", "Upsert", "Workspace") and the Title Button ("Director Engineering").
2. **Action Button Container (`.A-0884-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0884-...` follow the pattern established in other pages, using the page number prefix)_

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

The Director Engineering page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "director-engineering": "./client/src/pages/0884-director-engineering/0884-index.js",
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: "./client/public/pages/0884-director-engineering/0884-director-engineering.html", // Path to the HTML template
    filename: "pages/0884-director-engineering/0884-director-engineering.html", // Output path
    chunks: ["director-engineering"], // Link the 'director-engineering' bundle
  }),
  // ...
],
```

## Components

### Director Engineering Page Component

The main page component (`client/src/pages/0884-director-engineering/components/0884-director-engineering-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0884-director-engineering/components/0884-director-engineering-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background0884 from "./0884-background"; // Updated import
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const DirectorEngineeringPageComponent = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isButtonContainerVisible, setIsButtonContainerVisible] =
    useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("0884 DirectorEngineeringPage: Initializing..."); // Updated log
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0884 DirectorEngineeringPage: Settings Initialized."); // Updated log
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "0884 DirectorEngineeringPage: Error initializing settings:",
          error
        ); // Updated log
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

  const handleToggleAccordion = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  // Placeholder for modal click handler
  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 0884 Director Engineering modal:", modalTarget); // Updated log
    // Add logic to handle 0884 modals later
  };

  // ... other handlers (logout, modal triggers)

  return (
    <>
      <Background0884 /> {/* Updated component */}
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div
            className={`A-0884-button-container ${
              isButtonContainerVisible ? "visible" : ""
            }`}
          >
            {" "}
            {/* Updated class */}
            {/* Action buttons matching structure */}
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="A-0884-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0884-01-01-modal-upsert-url")
                  }
                  data-modal-target="A-0884-01-01-modal-upsert-url"
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-0884-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0884-01-02-modal-upsert-pdf")
                  }
                  data-modal-target="A-0884-01-02-modal-upsert-pdf"
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-0884-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0884-03-01-modal-minutes-compile")
                  }
                  data-modal-target="A-0884-03-01-modal-minutes-compile"
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-0884-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0884-03-02-modal-method-statmt")
                  }
                  data-modal-target="A-0884-03-02-modal-method-statmt"
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-0884-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0884-03-03-modal-risk-assess")
                  }
                  data-modal-target="A-0884-03-03-modal-risk-assess"
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="A-0884-modal-trigger-button"
                onClick={() => handleModalClick("developmentModal")}
                data-modal-target="developmentModal"
              >
                To be customised
              </button>
            )}
          </div>
          {/* Navigation Container */}
          <div className="A-0884-navigation-container">
            {" "}
            {/* Updated class */}
            <div className="A-0884-nav-row">
              {" "}
              {/* Updated class */}
              <button
                onClick={() => handleStateChange("agents")}
                className={`state-button ${
                  currentState === "agents" ? "active" : ""
                }`}
              >
                Agents
              </button>{" "}
              {/* Updated Name */}
              <button
                onClick={() => handleStateChange("upsert")}
                className={`state-button ${
                  currentState === "upsert" ? "active" : ""
                }`}
              >
                Upsert
              </button> {/* Updated Name */}
              <button
                onClick={() => handleStateChange("workspace")}
                className={`state-button ${
                  currentState === "workspace" ? "active" : ""
                }`}
              >
                Workspace
              </button>{" "}
              {/* Updated Name */}
            </div>
            <button className="nav-button primary">
              Director Engineering
            </button> {/* Updated Title */}
          </div>
          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0884-accordion-toggle"
          >
            ☰
          </button> {/* Updated class */}
          {/* Logout Button */}
          <button id="logout-button" className="A-0884-logout-button">
            Logout
          </button> {/* Updated class */}
          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? "visible" : ""}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}
          {/* Modal Container */}
          <div id="A-0884-modal-container"></div> {/* Updated ID */}
        </div>
      </div>
    </>
  );
};

export default DirectorEngineeringPageComponent; // Updated export
```

### Modal System

If the Director Engineering page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple director-engineering-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/0884-director-engineering/0884-director-engineering.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Director Engineering page (0884) has been created based on the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`0884-director-engineering-page.js`, `0884-background.js`).
2. Webpack entry point (`0884-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. Relies on common CSS for base styles, background, and modals.

## Future Improvements

1. Integrate specific director-engineering-related modals.
2. Add data fetching relevant to engineering management.
3. Implement state management for engineering data if needed.
4. Refine UI/UX based on specific director workflows.
5. Add relevant unit/integration tests.
