l# Other Parties Page Documentation

## Overview

The Other Parties page provides functionality related to managing external stakeholders, contacts, and related information. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/01850-other-parties/
├── components/               # React components
│   └── 01850-other-parties-page.js # Main page component
└── css/                     # Page-specific CSS
    └── 01850-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page utilizes the common background image system defined in base CSS (`client/src/common/css/base/0200-all-base.css`) and implemented via the `1850-background.js` component. The specific image used is `client/public/assets/mining/1850.png`.

```javascript
// client/src/pages/1850-other-parties/components/1850-background.js
import React from "react";
import backgroundImageUrl from "../../../../public/assets/mining/1850.png";

const Background1850 = () => {
  return (
    <div className="bg-container">
      <img id="bg-image" src={backgroundImageUrl} alt="Background" />
    </div>
  );
};

export default Background1850;
```

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-1850-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Other Parties").
2. **Action Button Container (`.A-1850-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-1850-...` follow the pattern established in other pages, using the page number prefix)_

### External Party Evaluation System

The Other Parties page includes the **External Party Evaluation System** - a comprehensive multi-discipline vetting platform:

#### Key Features
- **Multi-Context Support**: Contractor vetting, tender evaluation, RFQ processing
- **Template Distribution**: Forms issued from discipline-specific tables
- **Secure External Access**: Token-based authentication for contractors/suppliers
- **Evaluation Workflows**: Structured assessment and approval processes
- **Document Management**: Upload and processing of contractor responses
- **AI Assistance**: Automated scoring and evaluation recommendations

#### URL Structure
- **Main Entry Point**: `http://localhost:3060/#/other-parties/external-party-evaluation`
- **Context-Aware Routing**: `/other-parties/external-party-evaluation?context=contractor_vetting&discipline=02400`
- **Discipline Integration**: Links from all discipline pages (Safety, Procurement, Finance, etc.)

#### Complete Vetting Pipeline
1. **Template Source**: Templates from `governance_document_templates` (processed via 01300)
2. **Discipline Deployment**: Bulk copied via selection mode in template management
3. **Distribution**: Discipline teams issue templates through Other Parties page
4. **Contractor Access**: Secure form completion at external evaluation URL
5. **Response Processing**: Documents and form data saved for review
6. **Discipline Review**: Available for vetting by originating discipline team
7. **Approval Workflow**: Multi-discipline evaluation and final decisions

#### Integration Points
- **Template Management**: Selection mode enables bulk deployment
- **Discipline Tables**: Safety_templates, procurement_templates, etc.
- **Document Processing**: Complete integration with 01300 form generation
- **Security**: RLS policies and token-based external access
- **AI Services**: Automated evaluation and scoring assistance

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

The Other Parties page is included in the main webpack configuration (`client/config/webpack.config.js`):

```javascript
// client/config/webpack.config.js (Excerpt)
entry: {
  // ... other entries
  "other-parties": './client/src/pages/1850-other-parties/1850-index.js',
  // ...
},
plugins: [
  // ... other plugins
  new HtmlWebpackPlugin({
    template: './client/public/pages/1850-other-parties/1850-other-parties.html', // Path to the HTML template
    filename: 'pages/1850-other-parties/1850-other-parties.html', // Output path
    chunks: ['other-parties'], // Link the 'other-parties' bundle
  }),
  // ...
],
```

## Components

### Other Parties Page Component

The main page component (`client/src/pages/1850-other-parties/components/1850-other-parties-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/1850-other-parties/components/1850-other-parties-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import Background1850 from "./1850-background";
import { AccordionProvider } from "@modules/accordion/context/0200-accordion-context";
import { AccordionComponent } from "@modules/accordion/0200-accordion-component";
import settingsManager from "@common/js/ui/0200-ui-display-settings";
// ... import modal components if applicable

const OtherPartiesPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null or default)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("1850 OtherPartiesPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("1850 OtherPartiesPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "1850 OtherPartiesPage: Error initializing settings:",
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
      <Background1850 />
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-1850-button-container">
            {currentState === "upsert" && (
              <>
                <button className="A-1850-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-1850-modal-trigger-button">
                  To be customised
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button className="A-1850-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-1850-modal-trigger-button">
                  To be customised
                </button>
                <button className="A-1850-modal-trigger-button">
                  To be customised
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button className="A-1850-modal-trigger-button">
                To be customised
              </button>
            )}
          </div>

          {/* Navigation Container */}
          <div className="A-1850-navigation-container">
            <div className="A-1850-nav-row">
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
            <button className="nav-button primary">Other Parties</button>
          </div>

          {/* Accordion Toggle */}
          <button
            id="toggle-accordion"
            onClick={handleToggleAccordion}
            className="A-1850-accordion-toggle"
          >
            ☰
          </button>

          {/* Logout Button */}
          <button id="logout-button" className="A-1850-logout-button">
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
          <div id="A-1850-modal-container"></div>
        </div>
      </div>
    </>
  );
};

export default OtherPartiesPage;
```

### Modal System

If the Other Parties page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2700) or Inspection (2075) pages.

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple other-parties-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the page typically via `http://localhost:8093/pages/1850-other-parties/1850-other-parties.html`. (Note the port change to 8093 in webpack config).

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Other Parties page (1850) has been created using the Webpack/React structure, following the patterns established by pages like Construction (0300), Safety (2700) and Inspection (2075). Key aspects include:

1. React component-based structure (`1850-other-parties-page.js`, `1850-background.js`).
2. Webpack entry point (`1850-index.js`) managing imports and rendering.
3. Integration with the common accordion module (`AccordionComponent`).
4. Use of `settingsManager` for UI settings initialization.
5. Standard layout with fixed navigation, action buttons, and toggles.
6. Relies on common CSS for base styles, background, and modals.
7. State buttons renamed to: Agents, Upsert, Workspace.
8. Modal trigger buttons titled: "To be customised".

## Future Improvements

1. Integrate specific other-parties-related modals (e.g., contact management, communication logs).
2. Add data fetching for external party information.
3. Implement state management for party data if needed.
4. Refine UI/UX based on specific workflows.
5. Add relevant unit/integration tests.
