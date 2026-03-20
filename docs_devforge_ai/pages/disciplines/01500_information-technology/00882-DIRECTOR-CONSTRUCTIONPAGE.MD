# Director Construction Page Documentation

## Overview

The Director Construction page provides functionality related to high-level construction oversight, project status, and executive reporting. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00882-director-construction/
├── components/               # React components
│   └── 00882-director-construction-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00882-pages-style.css # Page-specific styles (in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `0882-background.js` component.

```javascript
// client/src/pages/0882-director-construction/components/0882-background.js
import React from "react";
// Assuming the image exists at this path based on convention
import backgroundImageUrl from "../../../../public/assets/mining/0882.png"; // Updated path

const Background0882 = () => {
  // Renamed component
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background0882; // Updated export name
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0882-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Director Construction").
2. **Action Button Container (`.A-0882-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All buttons currently have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0882-...` follow the pattern established in other pages, using the page number prefix)_

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

The Director Construction page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "director-construction": './client/src/pages/0882-director-construction/0882-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/0882-director-construction/0882-director-construction.html', // Path to the HTML template
    filename: 'pages/0882-director-construction/0882-director-construction.html', // Output path
    chunks: ['director-construction'], // Link the 'director-construction' bundle
  }),
  // ...
],
```

## Components

### Director Construction Page Component

The main page component (`client/src/pages/0882-director-construction/components/0882-director-construction-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0882-director-construction/components/0882-director-construction-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background0882 from "./0882-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const DirectorConstructionPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("0882 DirectorConstructionPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0882 DirectorConstructionPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "0882 DirectorConstructionPage: Error initializing settings:",
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
    setIsMenuVisible(!isMenuVisible); // Example toggle logic
  };

  // ... other handlers (logout, modal triggers)

  return (
    <>
      <Background0882 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-0882-button-container">
            {/* Example: {currentState === 'upsert' && <button>To be customised</button>} */}
          </div>
          {/* Navigation Container */}
          <div className="A-0882-navigation-container">
            <div className="A-0882-nav-row">
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
            <button className="nav-button primary">
              Director Construction
            </button>
          </div>
          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0882-accordion-toggle"
          >
            ☰
          </button> {/* Example class */}
          {/* Logout Button */}
          <button id="logout-button" className="A-0882-logout-button">
            Logout
          </button> {/* Example class */}
          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? "visible" : ""}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}
          {/* Modal Container */}
          <div id="A-0882-modal-container"></div> {/* Updated ID */}
        </div>
      </div>
    </>
  );
};

export default DirectorConstructionPage; // Assuming default export based on template
```

### Modal System

If the Director Construction page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. Currently, all modal trigger buttons are placeholders titled "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple director-construction-specific components.

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/0882-director-construction/0882-director-construction.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Director Construction page (0882) has been created based on the Construction (0300) template and migrated to the Webpack/React structure. Key aspects include:

1. React component-based structure (`0882-director-construction-page.js`, `0882-background.js`).
2. Webpack entry point (`0882-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named "Agents", "Upsert", "Workspace". Modal buttons are placeholders.
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `0882-pages-style.css`.

## Future Improvements

1. Implement specific modals required for Director Construction workflows.
2. Add data fetching relevant to director-level oversight.
3. Implement state management for relevant data if needed.
4. Refine UI/UX based on specific director workflows.
5. Add relevant unit/integration tests.
