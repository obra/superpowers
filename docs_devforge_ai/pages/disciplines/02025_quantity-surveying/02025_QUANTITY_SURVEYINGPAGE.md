# Quantity Surveying Page Documentation

## Overview

The Quantity Surveying page provides functionality related to cost estimation, contract administration, and financial management of construction projects. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/02025-quantity-surveying/
├── components/                      # React components
│   └── 02025-quantity-surveying-page.js # Main page component
└── css/                            # Page-specific CSS
    └── 02025-pages-style.css        # Example page-specific styles
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `Background.js` component.

```javascript
// client/src/pages/2025-quantity-surveying/components/2025-background.js
import React from 'react';
// Import the image directly using a relative path - Webpack will handle it
import backgroundImageUrl from '../../../../public/assets/mining/2025.png';

const Background2025 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background2025;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-2025-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Quantity Surveying").
2. **Action Button Container (`.A-2025-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All buttons currently have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-2025-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Quantity Surveying page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "quantity-surveying": "./client/src/pages/2025-quantity-surveying/2025-index.js",
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: "./client/public/pages/2025-quantity-surveying/2025-quantity-surveying.html", // Path to the HTML template
    filename: "pages/2025-quantity-surveying/2025-quantity-surveying.html", // Output path
    chunks: ["quantity-surveying"], // Link the 'quantity-surveying' bundle
  }),
  // ...
],
```

## Components

### Quantity Surveying Page Component

The main page component (`client/src/pages/2025-quantity-surveying/components/2025-quantity-surveying-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/2025-quantity-surveying/components/2025-quantity-surveying-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background2025 from './2025-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const QuantitySurveyingPage = () => {
  const [currentState, setCurrentState] = useState(null); // Default state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("2025 QuantitySurveyingPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("2025 QuantitySurveyingPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("2025 QuantitySurveyingPage: Error initializing settings:", error);
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
    <div className="quantity-surveying-page">
      <Background2025 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-2025-button-container">
            {/* Example: {currentState === 'upsert' && <button>Upsert URL</button>} */}
          </div>

          {/* Navigation Container */}
          <div className="A-2025-navigation-container">
            <div className="A-2025-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Quantity Surveying</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-2025-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-2025-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-2025-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </div>
  );
};

export default QuantitySurveyingPage;
```

### Modal System

If the Quantity Surveying page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple quantity surveying-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/2025-quantity-surveying/2025-quantity-surveying.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Quantity Surveying page (2025) has been created based on the Construction page (0300) structure and migrated to the Webpack/React setup. Key aspects include:

1. React component-based structure (`2025-quantity-surveying-page.js`, `2025-background.js`).
2. Webpack entry point (`2025-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named "Agents", "Upsert", "Workspace". Modal buttons are titled "To be customised".
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `2025-pages-style.css`.

## Future Improvements

1. Integrate specific quantity surveying-related modals (e.g., cost estimation, contract management).
2. Add data fetching for project financials and contracts.
3. Implement state management for financial data if needed.
4. Refine UI/UX based on specific quantity surveying workflows.
5. Add relevant unit/integration tests.
