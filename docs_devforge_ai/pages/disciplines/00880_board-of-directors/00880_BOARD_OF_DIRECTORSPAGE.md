# Board of Directors Page Documentation

## Overview

The Board of Directors page provides functionality related to board management, meeting minutes, and governance tracking. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00880-board-of-directors/
├── components/               # React components
│   ├── 00880-board-of-directors-page.js # Main page component
└── css/                     # Page-specific CSS
    └── 00880-pages-style.css # Page-specific styles (in client/src/common/css/pages/00880-board-of-directors/)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `Background.js` component. The specific image is `client/public/assets/mining/0880.png`.

```javascript
// client/src/pages/0880-board-of-directors/components/0880-background.js
import React from "react";
import backgroundImageUrl from "../../../../public/assets/mining/0880.png"; // Updated path

const Background0880 = () => {
  // Renamed component
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background0880;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-0880-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Board of Directors").
2. **Action Button Container (`.A-0880-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-0880-...` follow the pattern established in other pages, using the page number prefix)_

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

The Board of Directors page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "board-of-directors": './client/src/pages/0880-board-of-directors/0880-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/0880-board-of-directors/0880-board-of-directors.html', // Path to the HTML template
    filename: 'pages/0880-board-of-directors/0880-board-of-directors.html', // Output path
    chunks: ['board-of-directors'], // Link the 'board-of-directors' bundle
  }),
  // ...
],
```

## Components

### Board of Directors Page Component

The main page component (`client/src/pages/0880-board-of-directors/components/0880-board-of-directors-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/0880-board-of-directors/components/0880-board-of-directors-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background0880 from "./0880-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const BoardOfDirectorsPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (can be 'agents', 'upsert', 'workspace')
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion visibility state

  useEffect(() => {
    const init = async () => {
      console.log("0880 BoardOfDirectorsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("0880 BoardOfDirectorsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "0880 BoardOfDirectorsPage: Error initializing settings:",
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
      <Background0880 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-0880-button-container">
            {/* Buttons rendered based on currentState ('agents', 'upsert', 'workspace') */}
            {/* Example: {currentState === 'upsert' && <button>Upload Document</button>} */}
          </div>

          {/* Navigation Container */}
          <div className="A-0880-navigation-container">
            <div className="A-0880-nav-row">
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
            <button className="nav-button primary">Board of Directors</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-0880-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button id="logout-button" className="A-0880-logout-button">
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
            id="A-0880-modal-container"
            className="modal-container-root"
          ></div>
        </div>
      </div>
    </>
  );
};

export default BoardOfDirectorsPage; // Or export const BoardOfDirectorsPage = BoardOfDirectorsPageComponent;
```

### Modal System

If the Board of Directors page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. The current implementation uses placeholder buttons with the title "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple board-of-directors-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/0880-board-of-directors/0880-board-of-directors.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Board of Directors page (0880) has been created based on the Construction page (0300) template and migrated to the Webpack/React structure, following the patterns established by pages like Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`0880-board-of-directors-page.js`, `0880-background.js`).
2. Webpack entry point (`0880-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation (State buttons: Agents, Upsert, Workspace), action buttons (Modal triggers: "To be customised"), and toggles.
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `0880-pages-style.css`.

## Future Improvements

1. Integrate specific board-related modals (e.g., meeting creation, document upload, member management).
2. Add data fetching for board members, meetings, documents.
3. Implement state management for board-related data if needed.
4. Refine UI/UX based on specific governance workflows.
5. Add relevant unit/integration tests.
