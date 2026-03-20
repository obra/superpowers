# Human Resources Page Documentation

## Overview

The Human Resources page provides functionality related to employee management, recruitment, payroll, and other HR tasks. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/01500-human-resources/
├── components/               # React components
│   └── 01500-human-resources-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 01500-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `1500-background.js` component. The specific image is `client/public/assets/mining/1500.png`.

```javascript
// client/src/pages/1500-human-resources/components/1500-background.js
import React from 'react';
import backgroundImageUrl from '../../../../public/assets/mining/1500.png';

const Background1500 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background1500;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-1500-navigation-container`):** Bottom center, contains State Buttons (e.g., `Agents`, `Upsert`, `Workspace`) and the Title Button ("Human Resources").
2. **Action Button Container (`.A-1500-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons currently display "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-1500-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Human Resources page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "human-resources": './client/src/pages/1500-human-resources/1500-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/1500-human-resources/1500-human-resources.html', // Path to the HTML template
    filename: 'pages/1500-human-resources/1500-human-resources.html', // Output path
    chunks: ['human-resources'], // Link the 'human-resources' bundle
  }),
  // ...
],
```

## Components

### Human Resources Page Component

The main page component (`client/src/pages/1500-human-resources/components/1500-human-resources-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/1500-human-resources/components/1500-human-resources-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background1500 from './1500-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const HumanResourcesPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("1500 HumanResourcesPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("1500 HumanResourcesPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("1500 HumanResourcesPage: Error initializing settings:", error);
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
      <Background1500 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-1500-button-container">
             {/* Buttons are rendered based on currentState, e.g., 'agents', 'upsert', 'workspace' */}
             {/* All buttons currently have the text "To be customised" */}
          </div>

          {/* Navigation Container */}
          <div className="A-1500-navigation-container">
            <div className="A-1500-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Human Resources</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-1500-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-1500-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-1500-modal-container" className="modal-container-root"></div>
        </div>
      </div>
    </>
  );
};

export default HumanResourcesPage; // Corrected export name if needed
```

### Modal System

If the Human Resources page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages. Currently, placeholder buttons exist with the text "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple HR-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1500-human-resources/1500-human-resources.html`.

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Human Resources page (1500) has been created based on the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`1500-human-resources-page.js`, `1500-background.js`).
2. Webpack entry point (`1500-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles. State buttons are named "Agents", "Upsert", "Workspace". Modal buttons are placeholders.
6. Relies on common CSS for base styles, background, and modals, with page-specific styles in `1500-pages-style.css`.

## Future Improvements

1. Integrate specific HR-related modals (e.g., employee onboarding, leave requests, performance reviews).
2. Add data fetching for employee records, positions, etc.
3. Implement state management for HR data if needed.
4. Refine UI/UX based on specific HR workflows.
5. Add relevant unit/integration tests.
