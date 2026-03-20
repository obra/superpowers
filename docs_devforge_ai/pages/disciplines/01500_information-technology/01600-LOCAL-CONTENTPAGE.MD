# Local Content Page Documentation

## Overview

The Local Content page provides functionality related to local content management, tracking, and reporting. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/01600-local-content/
├── components/               # React components
│   └── 01600-local-content-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 01600-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `1600-background.js` component.

```javascript
// client/src/pages/1600-local-content/components/1600-background.js
import React from 'react';
// Assuming the image exists at this path based on convention
import backgroundImageUrl from '../../../../public/assets/mining/1600.png';

const Background1600 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background1600;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-1600-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Local Content").
2. **Action Button Container (`.A-1600-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-1600-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Local Content page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "local-content": './client/src/pages/1600-local-content/1600-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/1600-local-content/1600-local-content.html', // Path to the HTML template
    filename: 'pages/1600-local-content/1600-local-content.html', // Output path
    chunks: ['local-content'], // Link the 'local-content' bundle
  }),
  // ...
],
```

## Components

### Local Content Page Component

The main page component (`client/src/pages/1600-local-content/components/1600-local-content-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/1600-local-content/components/1600-local-content-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background1600 from './1600-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const LocalContentPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (can be 'agents', 'upsert', or 'workspace')
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("1600 LocalContentPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("1600 LocalContentPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("1600 LocalContentPage: Error initializing settings:", error);
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
    console.log("TODO: Open 1600 Local Content modal:", modalTarget);
    // Add logic to handle 1600 modals later
  };

  return (
    <>
      <Background1600 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-1600-button-container">
             {currentState === "upsert" && (
              <>
                <button type="button" className="A-1600-modal-trigger-button" onClick={() => handleModalClick("A-1600-01-01-modal-upsert-url")}>To be customised</button>
                <button type="button" className="A-1600-modal-trigger-button" onClick={() => handleModalClick("A-1600-01-02-modal-upsert-pdf")}>To be customised</button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button type="button" className="A-1600-modal-trigger-button" onClick={() => handleModalClick("A-1600-03-01-modal-minutes-compile")}>To be customised</button>
                <button type="button" className="A-1600-modal-trigger-button" onClick={() => handleModalClick("A-1600-03-02-modal-method-statmt")}>To be customised</button>
                <button type="button" className="A-1600-modal-trigger-button" onClick={() => handleModalClick("A-1600-03-03-modal-risk-assess")}>To be customised</button>
              </>
            )}
            {currentState === "workspace" && (
              <button type="button" className="A-1600-modal-trigger-button" onClick={() => handleModalClick("developmentModal")}>To be customised</button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-1600-navigation-container">
            <div className="A-1600-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Local Content</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-1600-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-1600-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-1600-modal-container"></div>
        </div>
      </div>
    </>
  );
};

export default LocalContentPage;
```

### Modal System

If the Local Content page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple local-content-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1600-local-content/1600-local-content.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Local Content page (1600) has been created using the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`1600-local-content-page.js`, `1600-background.js`).
2. Webpack entry point (`1600-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. Relies on common CSS for base styles, background, and modals.

## Future Improvements

1. Integrate specific local-content-related modals.
2. Add data fetching for local content data.
3. Implement state management for local content data if needed.
4. Refine UI/UX based on specific local content workflows.
5. Add relevant unit/integration tests.
