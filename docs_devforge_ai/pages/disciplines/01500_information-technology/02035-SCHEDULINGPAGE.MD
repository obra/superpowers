# Scheduling Page Documentation

## Overview

The Scheduling page provides functionality related to project scheduling, resource planning, and timeline management. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/02035-scheduling/
├── components/               # React components
│   └── 02035-scheduling-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 02035-pages-style.css # Example page-specific styles
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `Background.js` component.

```javascript
// client/src/pages/2035-scheduling/components/2035-background.js
import React from 'react';
import backgroundImageUrl from '../../../../public/assets/mining/2035.png'; // Updated path

const Background2035 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Scheduling Background" />
    </div>
  );
};

export default Background2035;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-2035-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Scheduling").
2. **Action Button Container (`.A-2035-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state.
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

*(CSS classes like `.A-2035-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The scheduling page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  scheduling: './client/src/pages/2035-scheduling/2035-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/2035-scheduling/2035-scheduling.html', // Path to the HTML template
    filename: 'pages/2035-scheduling/2035-scheduling.html', // Output path
    chunks: ['scheduling'], // Link the 'scheduling' bundle
  }),
  // ...
],
```

## Components

### Scheduling Page Component

The main page component (`client/src/pages/2035-scheduling/components/2035-scheduling-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/2035-scheduling/components/2035-scheduling-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import Background2035 from './2035-background';
import { AccordionProvider } from '@modules/accordion/context/0200-accordion-context';
import { AccordionComponent } from '@modules/accordion/0200-accordion-component';
import settingsManager from '@common/js/ui/0200-ui-display-settings';
// ... import modal components if applicable

const SchedulingPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null as per implementation)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("2035 SchedulingPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("2035 SchedulingPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("2035 SchedulingPage: Error initializing settings:", error);
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
      <Background2035 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-2035-button-container">
            {/* Example: {currentState === 'upsert' && <button>Upsert URL</button>} */}
          </div>

          {/* Navigation Container */}
          <div className="A-2035-navigation-container">
            <div className="A-2035-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Scheduling</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-2035-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-2035-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              <AccordionProvider>
                <AccordionComponent settingsManager={settingsManager} />
              </AccordionProvider>
            </div>
          )}

          {/* Modal Container */}
          <div id="A-2035-modal-container"></div>
        </div>
      </div>
    </>
  );
};

export default SchedulingPage;
```

### Modal System

If the Scheduling page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple construction-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/2035-scheduling/2035-scheduling.html`. (Note: Port might differ based on `webpack.config.js`)

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Scheduling page (2035) has been created based on the Webpack/React structure of the Construction page (0300), following the patterns established by pages like Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`2035-scheduling-page.js`, `2035-background.js`).
2. Webpack entry point (`2035-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. Relies on common CSS for base styles, background, and modals.

## Future Improvements

1. Integrate specific scheduling-related modals (e.g., task creation, resource assignment).
2. Add data fetching for scheduling data.
3. Implement state management for scheduling data if needed.
4. Refine UI/UX based on specific scheduling workflows.
5. Add relevant unit/integration tests.
