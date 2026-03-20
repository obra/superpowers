# Ethics Page Documentation

## Overview

The Ethics page provides functionality related to ethical guidelines, reporting, and compliance tracking. It has been migrated to use webpack for module bundling and follows a modular architecture pattern similar to other migrated pages.

## File Structure

```
client/src/pages/1100-ethics/
├── 1100-index.js              # Main entry point
├── components/               # React components
│   ├── 1100-ethics-page.js  # Main page component
│   └── 1100-background.js   # Background component
└── css/                     # Page-specific CSS (if needed, often common CSS is used)
    └── 1100-pages-style.css # Example page-specific styles (located in common/css/pages)

# Note: HTML template (1100-ethics.html) is in client/public/pages/1100-ethics/
# Note: Webpack config entry is in client/config/webpack.config.js
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `1100-background.js` component. The specific image is `client/public/assets/mining/1100.png`.

```javascript
// client/src/pages/1100-ethics/components/1100-background.js
import React from 'react';
import backgroundImageUrl from '../../../../public/assets/mining/1100.png';

const Background1100 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background1100;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-1100-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Ethics").
2. **Action Button Container (`.A-1100-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons currently have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-1100-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Ethics page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  ethics: './client/src/pages/1100-ethics/1100-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/1100-ethics/1100-ethics.html', // Path to the HTML template
    filename: 'pages/1100-ethics/1100-ethics.html', // Output path
    chunks: ['ethics'], // Link the 'ethics' bundle
  }),
  // ...
],
```

## Components

### Ethics Page Component

The main page component (`client/src/pages/1100-ethics/components/1100-ethics-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/1100-ethics/components/1100-ethics-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background1100 from './1100-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const EthicsPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("1100 EthicsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("1100 EthicsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("1100 EthicsPage: Error initializing settings:", error);
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
    <div className="ethics-page">
      <Background1100 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-1100-button-container">
             {currentState === "upsert" && (
              <>
                <button className="A-1100-modal-trigger-button">To be customised</button>
                <button className="A-1100-modal-trigger-button">To be customised</button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button className="A-1100-modal-trigger-button">To be customised</button>
                <button className="A-1100-modal-trigger-button">To be customised</button>
                <button className="A-1100-modal-trigger-button">To be customised</button>
              </>
            )}
            {currentState === "workspace" && (
              <button className="A-1100-modal-trigger-button">To be customised</button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-1100-navigation-container">
            <div className="A-1100-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Ethics</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-1100-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-1100-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-1100-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export default EthicsPage; // Assuming default export if ConstructionPage was default
```

### Modal System

If the Ethics page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. Currently, all modal trigger buttons are placeholders titled "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple ethics-specific components.

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1100-ethics/1100-ethics.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Ethics page (1100) has been created using the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`1100-ethics-page.js`, `1100-background.js`).
2. Webpack entry point (`1100-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named "Agents", "Upsert", "Workspace". Modal buttons are named "To be customised".
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `1100-pages-style.css`.

## Future Improvements

1. Implement specific ethics-related modals (e.g., reporting forms, policy viewers).
2. Add data fetching for ethics cases or compliance data.
3. Implement state management for ethics-related data if needed.
4. Refine UI/UX based on specific ethics workflows.
5. Add relevant unit/integration tests.
