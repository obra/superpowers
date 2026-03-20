# 00435 Contracts Post-Award Page Structure Guide

## Overview
This document provides a detailed guide for the page structure used in the 00435 Contracts Post-Award page, which serves as the standard reference for creating similar complex accordion-based pages. The 00435 page exemplifies the pattern used for sector pages with advanced functionality accessed via main or sub-buttons on the accordion.

## Page Characteristics
The 00435 page represents the complex accordion page category with:
- Three-state button navigation (Agents, Upsert, Workspace)
- Theme-based background images (determined by localStorage or sector)
- Complex modal systems
- Full accordion integration
- Advanced state management
- Grid-based layouts with animations
- Standardized logout button

## Directory Structure
```
client/src/pages/00435-contracts-post-award/
├── 00435-index.js                           # Entry point
├── components/
│   ├── 00435-contracts-post-award-page.js   # Main page component
│   ├── agents/
│   │   ├── 00435-03-correspondence-agent.js
│   │   ├── 00435-03-correspondence-agent.css
│   │   ├── 00435-03-correspondence-agent-modal.js
│   │   └── 00435-03-correspondence-agent-integration.js
│   ├── modals/
│   │   ├── 00435-01-ContractSetupModal.js
│   │   ├── 00435-02-UpsertFileModal.js
│   │   ├── 00435-03-MinutesCompileModal.js
│   │   └── 00435-04-CorrespondenceInputModal.js
│   └── chatbots/
│       └── 00435-document-langchain.js
├── css/
│   └── 00435-pages-style.css               # Page-specific styles
└── assets/
    └── 00435.png                           # Background image
```

## Main Component Structure

### Index File (00435-index.js)
```javascript
import React from 'react';
import ContractsPostAwardPage from './components/00435-contracts-post-award-page.js';

const ContractsPostAwardIndex = () => {
  return <ContractsPostAwardPage />;
};

export default ContractsPostAwardIndex;
```

### Main Page Component (00435-contracts-post-award-page.js)
```javascript
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import "../../../common/css/pages/00435-contracts-post-award/00435-pages-style.css";

const ContractsPostAwardPageComponent = () => {
  const [currentState, setCurrentState] = useState(null);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);

  // State management
  useEffect(() => {
    const init = async () => {
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
      } catch (error) {
        console.error("Error during settings initialization:", error);
      }
    };
    init();
  }, []);

  // Button visibility animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsButtonContainerVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStateChange = (newState) => {
    setCurrentState(newState);
  };

  // Get themed background image
  const backgroundImagePath = getThemedImagePath('00435.png');

  return (
    <div
      className="contracts-post-award-page page-background"
      style={{
        backgroundImage: `url(${backgroundImagePath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      {/* Accordion Integration */}
      {isSettingsInitialized && (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      )}

      {/* Navigation Container */}
      <div className="A-0435-navigation-container">
        <div className="A-0435-nav-row">
          <button
            type="button"
            className={`state-button ${currentState === "agents" ? "active" : ""}`}
            onClick={() => handleStateChange("agents")}
          >
            Agents
          </button>
          <button
            type="button"
            className={`state-button ${currentState === "upserts" ? "active" : ""}`}
            onClick={() => handleStateChange("upserts")}
          >
            Upsert
          </button>
          <button
            type="button"
            className={`state-button ${currentState === "workspace" ? "active" : ""}`}
            onClick={() => handleStateChange("workspace")}
          >
            Workspace
          </button>
        </div>
        <button className="nav-button primary">Contracts Post-Award</button>
      </div>

      {/* Button Container */}
      <div
        className={`A-0435-button-container ${isButtonContainerVisible ? "visible" : ""}`}
      >
        {currentState === "agents" && (
          <>
            <button className="A-0435-modal-trigger-button">
              Compile Minutes
            </button>
            <button className="A-0435-modal-trigger-button">
              Method Statement
            </button>
          </>
        )}
        {currentState === "upserts" && (
          <>
            <button className="A-0435-modal-trigger-button">
              Upsert URL
            </button>
            <button className="A-0435-modal-trigger-button">
              Upsert PDF
            </button>
          </>
        )}
        {currentState === "workspace" && (
          <button className="A-0435-modal-trigger-button">
            Open Development Modal
          </button>
        )}
      </div>

      {/* Logout Button */}
      <button
        id="logout-button"
        onClick={handleLogout}
        className="A-0435-logout-button"
      >
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  );
};

export default ContractsPostAwardPageComponent;
```

## CSS Structure (00435-pages-style.css)
```css
/* common/css/pages/00435-contracts-post-award/00435-pages-style.css */

.contracts-post-award-page {
  /* Page-specific styles */
}

.A-0435-navigation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin: 1rem;
  z-index: 1000;
}

.A-0435-nav-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.A-0435-button-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin: 1rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.A-0435-button-container.visible {
  opacity: 1;
  transform: translateY(0);
}

.A-0435-modal-trigger-button {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.A-0435-modal-trigger-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.A-0435-logout-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 6000;
  transition: all 0.2s ease;
}

.A-0435-logout-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
```

## Implementation Patterns

### 1. Three-State Navigation System
The 00435 page implements a complex three-state navigation system:

```javascript
const [currentState, setCurrentState] = useState(null);

const handleStateChange = (newState) => {
  setCurrentState(newState);
};

{/* Navigation Container */}
<div className="A-0435-navigation-container">
  <div className="A-0435-nav-row">
    <button
      type="button"
      className={`state-button ${currentState === "agents" ? "active" : ""}`}
      onClick={() => handleStateChange("agents")}
    >
      Agents
    </button>
    <button
      type="button"
      className={`state-button ${currentState === "upserts" ? "active" : ""}`}
      onClick={() => handleStateChange("upserts")}
    >
      Upsert
    </button>
    <button
      type="button"
      className={`state-button ${currentState === "workspace" ? "active" : ""}`}
      onClick={() => handleStateChange("workspace")}
    >
      Workspace
    </button>
  </div>
  <button className="nav-button primary">Contracts Post-Award</button>
</div>
```

### 2. Dynamic Button Container
The button container uses animation effects:

```javascript
const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);

// Effect for button visibility animation
useEffect(() => {
  const timer = setTimeout(() => {
    setIsButtonContainerVisible(true);
  }, 100);
  return () => clearTimeout(timer);
}, []);

<div
  className={`A-0435-button-container ${isButtonContainerVisible ? "visible" : ""}`}
>
  {/* State-specific buttons */}
</div>
```

### 3. Modal System Integration
The page integrates with the centralized modal system:

```javascript
import { useModal } from '@components/modal/hooks/00170-useModal.js';
const { openModal } = useModal();

const handleOpenModal = (modalId, modalProps = {}) => {
  openModal(modalId, modalProps);
};

{currentState === "agents" && (
  <>
    <button
      type="button"
      className="A-0435-modal-trigger-button"
      onClick={() => handleOpenModal('MeetingMinutesModal', { 
        modalTitle: "Meeting Minutes Processing",
        triggerPage: "0435-contracts-post-award"
      })}
    >
      📝 Meeting Minutes
    </button>
  </>
)}
```

## Key Components

### 1. Agent System
The 00435 page includes an advanced agent system:

```javascript
// Import correspondence agent CSS and components
import "./agents/00435-03-correspondence-agent.css";
import "./agents/00435-03-correspondence-agent.js";
import "./agents/00435-03-correspondence-agent-modal.js";
import "./agents/00435-03-correspondence-agent-integration.js";
```

### 2. Chatbot Integration
Advanced chatbot capabilities:

```javascript
import { createAgentChatbot, createUpsertChatbot, createWorkspaceChatbot, createDocumentChatbot } from '@components/chatbots/chatbotService.js';

{createDocumentChatbot({
  pageId: "0435-contracts-post-award",
  disciplineCode: "00435",
  userId: "demo-user-001",
  title: "Document Chat",
  welcomeMessage: "Ask me anything about your contract documents...",
  exampleQueries: [
    "What documents were uploaded today?",
    "Find documents about important terms"
  ]
})}
```

## Best Practices Demonstrated

### 1. Component Structure
- Uses functional components with hooks
- Proper error handling and debugging logs
- Consistent naming conventions
- Clear separation of concerns

### 2. State Management
- Proper initialization and cleanup
- State change debugging
- Animation effects for better UX

### 3. Integration Points
- Accordion system integration
- Modal system integration
- Chatbot integration
- Background image theming

### 4. CSS Implementation
- Responsive grid layouts
- Smooth animations and transitions
- Consistent class naming
- Proper z-index management

## Implementation Guidelines

### 1. Creating Similar Pages
To create a similar complex page structure:

1. **Copy the base structure** from the 00435 page
2. **Update page-specific imports** and references
3. **Customize state buttons** for page-specific functionality
4. **Add page-specific modals** and components
5. **Create dedicated CSS file** with consistent naming
6. **Register page in UI display mappings**
7. **Add route to App.js**

### 2. Key Components to Include
- Three-state navigation system
- Accordion integration
- Modal system integration
- Background image system
- Chatbot integration (if applicable)
- Standardized logout button
- Proper CSS structure

## Differences from Simpler Pages

### Complex Accordion Pages (00435-style)
- Three-state button navigation system
- Dynamic background image theming
- Advanced modal and component systems
- Comprehensive state management
- Multiple integrated subsystems
- Complex routing and navigation

### Simpler Pages (Timesheet, Travel, All Documents)
- No complex state button navigation system
- Fixed background images instead of dynamic theming
- Simpler modal systems
- Less complex state management
- Focus on single primary function
- Tab-based navigation instead of accordion states

## Related Documentation

- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Guide for simpler pages
- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture guide
- [1300_0000_PAGE_LIST.md](1300_0000_PAGE_LIST.md) - Complete page documentation
- [1300_02050_UI_MANAGEMENT_INTERFACES.md](1300_02050_UI_MANAGEMENT_INTERFACES.md) - UI management interfaces
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system documentation
- [0700_UI_SETTINGS.md](0700_UI_SETTINGS.md) - UI settings and configuration

This guide provides a foundation for implementing and maintaining complex accordion-based pages in the ConstructAI system while maintaining consistency with the overall architecture and user experience patterns. The 00435 page serves as the standard reference for creating similar complex pages accessed via main or sub-buttons on the accordion.
