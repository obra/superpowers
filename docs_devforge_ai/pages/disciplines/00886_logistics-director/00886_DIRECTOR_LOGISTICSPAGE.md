# Director Logistics Page Documentation (0886)

## Overview

The Director Logistics page provides functionality related to logistics management, supply chain oversight, and transportation planning. It is now a React component fully integrated into the Single-Page Application (SPA) architecture, utilizing the main webpack bundle and client-side routing.

## File Structure

```
client/src/pages/00886-director-logistics/
├── components/               # React components
│   └── 00886-director-logistics-page.js  # Main page component
└── css/                     # Page-specific CSS
    └── 00886-pages-style.css # Page-specific styles (located in common/css/pages)
```

## UI Layout

### Background Image

The page uses a background image defined via the `.page-background` CSS class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-00886-navigation-container`):** Bottom center, contains State Buttons (`Agents`, `Upsert`, `Workspace`) and the Title Button ("Director Logistics").
2. **Action Button Container (`.A-00886-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All modal buttons have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the accordion content.

_(CSS classes like `.A-00886-...` follow the pattern established in other pages, using the page number prefix)_

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

The Director Logistics page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Director Logistics Page Component

The main page component (`client/src/pages/00886-director-logistics/components/00886-director-logistics-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/00886-director-logistics/components/00886-director-logistics-page.js (Simplified Structure)
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context";
import settingsManager from "@common/js/ui/00100-ui-display-settings";
// ... import modal components if applicable

const DirectorLogisticsPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isButtonContainerVisible, setIsButtonContainerVisible] =
    useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("00886 DirectorLogisticsPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("00886 DirectorLogisticsPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error(
          "00886 DirectorLogisticsPage: Error initializing settings:",
          error
        );
      }
    };
    init();
  }, []);

  useEffect(() => {
    setIsButtonContainerVisible(false);
    const timer = setTimeout(() => {
      setIsButtonContainerVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentState]);

  const handleStateChange = (newState) => {
    setCurrentState(newState);
  };

  const handleToggleAccordion = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 0886 Director Logistics modal:", modalTarget);
    // Add logic to handle 0886 modals later
  };

  const handleLogout = () => {
    if (window.handleLogout) {
      window.handleLogout();
    } else {
      console.error("Global handleLogout function not found.");
    }
  };

  return (
    <div className="page-background">
      <div className="content-wrapper">
        <div className="main-content">
          {/* Navigation Container */}
          <div className="A-00886-navigation-container">
            <div className="A-00886-nav-row">
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
            <button className="nav-button primary">Director Logistics</button>
          </div>

          {/* Button container */}
          <div
            className={`A-00886-button-container ${
              isButtonContainerVisible ? "visible" : ""
            }`}
          >
            {/* Action buttons */}
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="A-00886-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-00886-01-01-modal-upsert-url")
                  }
                  data-modal-target="A-00886-01-01-modal-upsert-url"
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-00886-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-00886-01-02-modal-upsert-pdf")
                  }
                  data-modal-target="A-00886-01-02-modal-upsert-pdf"
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-00886-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-00886-03-01-modal-minutes-compile")
                  }
                  data-modal-target="A-00886-03-01-modal-minutes-compile"
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-00886-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-00886-03-02-modal-method-statmt")
                  }
                  data-modal-target="A-00886-03-02-modal-method-statmt"
                >
                  To be customised
                </button>
                <button
                  type="button"
                  className="A-0886-modal-trigger-button"
                  onClick={() =>
                    handleModalClick("A-0886-03-03-modal-risk-assess")
                  }
                  data-modal-target="A-0886-03-03-modal-risk-assess"
                >
                  To be customised
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="A-0886-modal-trigger-button"
                onClick={() => handleModalClick("developmentModal")}
                data-modal-target="developmentModal"
              >
                To be customised
              </button>
            )}
          </div>
        </div>{" "}
        {/* Close main-content */}
      </div> {/* Close content-wrapper */}
      {/* Accordion Toggle */}
      <button
        id="toggle-accordion"
        onClick={handleToggleAccordion}
        className="A-00886-accordion-toggle"
      >
        ☰
      </button>
      {/* Logout Button */}
      <button
        id="logout-button"
        onClick={handleLogout}
        className="A-00886-logout-button"
      >
        {/* SVG Icon */}
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
      <div id="A-00886-modal-container" className="modal-container-root">
        {/* TODO: Implement modal rendering based on 0886 system */}
      </div>
    </div> // Close director-logistics-page div
  );
};

export default DirectorLogisticsPage; // Correct export
