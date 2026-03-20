# Finance Page Documentation

## Overview

The Finance page provides functionality related to financial reporting, budget tracking, and cost analysis. It has been migrated to use webpack for module bundling and follows a modular architecture pattern similar to other migrated pages like Safety (2700) and Construction (0300).

## File Structure

```
client/src/pages/1200-finance/
├── 1200-index.js              # Main entry point
├── components/               # React components
│   ├── 1200-finance-page.js   # Main page component
│   └── 1200-background.js     # Background component
└── css/                     # Page-specific CSS (if needed, often common CSS is used)
    └── 1200-pages-style.css # Example page-specific styles

# Note: HTML template (1200-finance.html) is in client/public/pages/1200-finance/
# Note: Webpack config entry is in client/config/webpack.config.js
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `1200-background.js` component.

```javascript
// client/src/pages/1200-finance/components/1200-background.js
import React from 'react';
// Import the image directly using a relative path - Webpack will handle it
import backgroundImageUrl from '../../../../public/assets/mining/1200.png';

const Background1200 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Finance Background" />
    </div>
  );
};

export default Background1200;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-1200-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Finance").
2. **Action Button Container (`.A-1200-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons currently have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-1200-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The finance page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  finance: './client/src/pages/1200-finance/1200-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/1200-finance/1200-finance.html', // Path to the HTML template
    filename: 'pages/1200-finance/1200-finance.html', // Output path
    chunks: ['finance'], // Link the 'finance' bundle
  }),
  // ...
],
```

## Components

### Finance Page Component

The main page component (`client/src/pages/1200-finance/components/1200-finance-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/1200-finance/components/1200-finance-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background1200 from './1200-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const FinancePage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("1200 FinancePage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("1200 FinancePage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("1200 FinancePage: Error initializing settings:", error);
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
      <Background1200 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-1200-button-container">
             {currentState === 'upsert' && (
               <>
                 <button className="A-1200-modal-trigger-button">To be customised</button>
                 <button className="A-1200-modal-trigger-button">To be customised</button>
               </>
             )}
             {currentState === 'agents' && (
               <>
                 <button className="A-1200-modal-trigger-button">To be customised</button>
                 <button className="A-1200-modal-trigger-button">To be customised</button>
                 <button className="A-1200-modal-trigger-button">To be customised</button>
               </>
             )}
             {currentState === 'workspace' && (
               <button className="A-1200-modal-trigger-button">To be customised</button>
             )}
          </div>

          {/* Navigation Container */}
          <div className="A-1200-navigation-container">
            <div className="A-1200-nav-row">
              <button onClick={() => handleStateChange('agents')} className={currentState === 'agents' ? 'active' : ''}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={currentState === 'upsert' ? 'active' : ''}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={currentState === 'workspace' ? 'active' : ''}>Workspace</button>
            </div>
            <button className="nav-button primary">Finance</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-1200-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-1200-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-1200-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </>
  );
};

export default FinancePage;
```

### Modal System

If the Finance page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. The current modal trigger buttons are placeholders.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple finance-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1200-finance/1200-finance.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Finance page (1200) has been created based on the Webpack/React structure of the Construction page (0300), following the patterns established by pages like Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`1200-finance-page.js`, `1200-background.js`).
2. Webpack entry point (`1200-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons renamed to 'Agents', 'Upsert', 'Workspace'. Modal buttons titled 'To be customised'.
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `1200-pages-style.css`.

## Future Improvements

1. Integrate specific finance-related modals (e.g., budget entry, report generation).
2. Add data fetching for financial data.
3. Implement state management for financial data if needed.
4. Refine UI/UX based on specific finance workflows.
5. Add relevant unit/integration tests.
