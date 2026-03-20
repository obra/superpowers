# 00435 Sample Page Structure Guide

## Overview
This document provides a detailed analysis of the 00435-contracts-post-award page structure, which serves as the standard template for complex accordion-based pages in the ConstructAI system. This page demonstrates the three-state navigation system, dynamic background theming, and advanced component integration patterns.

## Page Structure Analysis

### Directory Structure
```
client/src/pages/00435-contracts-post-award/
├── 00435-index.js                              # Entry point
├── components/
│   ├── 00435-contracts-post-award-page.js      # Main page component
│   ├── 00435-state-navigation.js               # State button navigation
│   ├── 00435-background-manager.js              # Background image management
│   ├── agents/                                 # Agents state components
│   │   ├── 00435-agents-grid.js
│   │   ├── 00435-agent-card.js
│   │   └── 00435-agent-modals/
│   │       ├── 00435-contract-analysis-modal.js
│   │       ├── 00435-legal-review-modal.js
│   │       └── 00435-risk-assessment-modal.js
│   ├── upsert/                                 # Upsert state components
│   │   ├── 00435-document-upsert-form.js
│   │   ├── 00435-file-upload-manager.js
│   │   └── 00435-upsert-modals/
│   │       ├── 00435-contract-setup-modal.js
│   │       └── 00435-working-contractor-modal.js
│   ├── workspace/                              # Workspace state components
│   │   ├── 00435-workspace-dashboard.js
│   │   ├── 00435-document-grid.js
│   │   └── 00435-workspace-modals/
│   │       ├── 00435-correspondence-modal.js
│   │       └── 00435-minutes-compile-modal.js
│   ├── chatbots/                               # AI chatbot components
│   │   ├── 00435-document-langchain.js
│   │   ├── 00435-contract-analysis-agent.js
│   │   └── 00435-legal-review-agent.js
│   └── css/
│       └── 00435-contracts-post-award-style.css # Page-specific styles
└── assets/
    ├── 00435-bg-agents.png                     # Agents state background
    ├── 00435-bg-upsert.png                     # Upsert state background
    ├── 00435-bg-workspace.png                  # Workspace state background
    └── icons/
        ├── agent-icon.svg
        ├── upsert-icon.svg
        └── workspace-icon.svg
```

## Core Component Implementation

### Main Page Component (00435-contracts-post-award-page.js)
```javascript
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Alert,
  Row,
  Col,
  Badge,
  Spinner,
  Modal,
  Form,
  Accordion,
  Table,
  InputGroup,
  Dropdown,
  ProgressBar,
  Tabs,
  Tab,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import "./css/00435-contracts-post-award-style.css";

// State components
import StateNavigation from "./00435-state-navigation.js";
import BackgroundManager from "./00435-background-manager.js";

// State-specific components
import AgentsGrid from "./agents/00435-agents-grid.js";
import DocumentUpsertForm from "./upsert/00435-document-upsert-form.js";
import WorkspaceDashboard from "./workspace/00435-workspace-dashboard.js";

const ContractsPostAwardPage = () => {
  // State management
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [activeState, setActiveState] = useState("agents"); // Default to agents
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Document states
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  
  // AI processing states
  const [aiProcesses, setAiProcesses] = useState([]);
  const [activeAIProcesses, setActiveAIProcesses] = useState([]);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Initialize settings manager
  useEffect(() => {
    const initSettings = async () => {
      try {
        console.log("[00435] Initializing settings manager...");
        if (!settingsManager) {
          console.warn("[00435] Settings manager is not available");
          setIsSettingsInitialized(true);
          return;
        }
        await settingsManager.initialize();
        console.log("[00435] Settings manager initialized");
        try {
          await settingsManager.applySettings();
          console.log("[00435] Settings applied successfully");
        } catch (applyError) {
          console.warn(
            "[00435] Could not apply settings, using defaults:",
            applyError
          );
        }
        setIsSettingsInitialized(true);
      } catch (err) {
        console.error("[00435] Error initializing settings:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setIsSettingsInitialized(true);
      }
    };
    initSettings();
  }, []);

  // Get themed background image based on current state
  const backgroundImagePath = getThemedImagePath(`00435-bg-${activeState}.png`);

  return (
    <div
      className="contracts-post-award-page page-background"
      style={{
        backgroundImage: `url(${backgroundImagePath})`,
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}
    >
      {/* Accordion Integration */}
      {isSettingsInitialized && (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      )}
      
      {/* State Navigation */}
      <StateNavigation 
        activeState={activeState} 
        setActiveState={setActiveState} 
      />
      
      {/* Main Content Area */}
      <div className="content-wrapper">
        <Card className="page-card">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h3>
              {activeState === 'agents' && 'Contract Analysis Agents'}
              {activeState === 'upsert' && 'Document Management'}
              {activeState === 'workspace' && 'Workspace Dashboard'}
            </h3>
            <div className="header-controls">
              <Button 
                variant="primary" 
                onClick={() => setShowDocumentModal(true)}
                className="me-2"
              >
                <i className="bi bi-plus-circle"></i> New
              </Button>
              <Button variant="outline-secondary">
                <i className="bi bi-search"></i> Search
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {/* State-specific content */}
            {activeState === 'agents' && <AgentsGrid />}
            {activeState === 'upsert' && <DocumentUpsertForm />}
            {activeState === 'workspace' && <WorkspaceDashboard />}
          </Card.Body>
        </Card>
      </div>
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            variant={toast.variant}
            onClose={() => setToasts(toasts.filter(t => t.id !== toast.id))}
            dismissible
            className="toast-notification"
          >
            {toast.message}
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default ContractsPostAwardPage;
```

### State Navigation Component (00435-state-navigation.js)
```javascript
import React from "react";
import { Button, Container, Row, Col } from "react-bootstrap";

const StateNavigation = ({ activeState, setActiveState }) => {
  return (
    <Container fluid className="state-navigation py-3">
      <Row className="justify-content-center">
        <Col xs="auto">
          <Button
            variant={activeState === "agents" ? "primary" : "outline-primary"}
            onClick={() => setActiveState("agents")}
            className="state-button me-2"
          >
            <i className="bi bi-robot me-2"></i>
            Agents
          </Button>
        </Col>
        <Col xs="auto">
          <Button
            variant={activeState === "upsert" ? "primary" : "outline-primary"}
            onClick={() => setActiveState("upsert")}
            className="state-button me-2"
          >
            <i className="bi bi-file-earmark-arrow-up me-2"></i>
            Upsert
          </Button>
        </Col>
        <Col xs="auto">
          <Button
            variant={activeState === "workspace" ? "primary" : "outline-primary"}
            onClick={() => setActiveState("workspace")}
            className="state-button"
          >
            <i className="bi bi-folder me-2"></i>
            Workspace
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default StateNavigation;
```

### Background Manager Component (00435-background-manager.js)
```javascript
import React, { useEffect } from "react";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";

const BackgroundManager = ({ activeState, setBackgroundStyle }) => {
  useEffect(() => {
    const imagePath = getThemedImagePath(`00435-bg-${activeState}.png`);
    setBackgroundStyle({
      backgroundImage: `url(${imagePath})`,
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '100vh'
    });
  }, [activeState, setBackgroundStyle]);

  return null; // This component only manages side effects
};

export default BackgroundManager;
```

## CSS Structure and Styling

### Main Styles (00435-contracts-post-award-style.css)
```css
/* Page-specific styles for 00435-contracts-post-award */

.contracts-post-award-page {
  --primary-color: #4A89DC;
  --secondary-color: #5D9CEC;
  --accent-color: #FC6E51;
  --text-color: #000000;
  --bg-color: #f9fafb;
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
  position: relative;
  color: var(--text-color) !important;
}

.contracts-post-award-page * {
  color: var(--text-color) !important;
}

.page-background {
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.state-navigation {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.state-button {
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 8px;
  padding: 10px 20px;
}

.state-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.page-card {
  margin: 2rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.content-wrapper {
  position: relative;
  z-index: 1;
}

/* Grid animations */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.document-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.document-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-color: var(--primary-color);
}

.document-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.document-card:hover::before {
  transform: scaleX(1);
}

/* Toast notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast-notification {
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border: none;
  border-left: 4px solid;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-card {
    margin: 1rem;
    padding: 1rem;
  }
  
  .document-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .state-navigation {
    padding: 1rem 0;
  }
  
  .state-button {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .contracts-post-award-page {
    --text-color: #ffffff;
    --bg-color: #1a1a1a;
    --card-bg: #2d2d2d;
    --border-color: #404040;
  }
  
  .page-card {
    background: rgba(45, 45, 45, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .document-card {
    background: #333333;
    border-color: #444444;
  }
}
```

## Key Implementation Features

### 1. Three-State Navigation System
The 00435 page implements a sophisticated three-state navigation system:
- **Agents State**: AI-powered contract analysis and document processing
- **Upsert State**: Document management and file upload workflows
- **Workspace State**: Dashboard and document organization

### 2. Dynamic Background Theming
Each state has its own themed background image that changes dynamically:
- `00435-bg-agents.png` for the agents state
- `00435-bg-upsert.png` for the upsert state  
- `00435-bg-workspace.png` for the workspace state

### 3. Advanced Component Architecture
The page uses a modular component structure with:
- State-specific component directories
- Shared utility components
- AI integration components
- Modal system components

### 4. Grid-Based Layout with Animations
The page implements animated grid layouts with:
- Smooth hover effects
- Transition animations
- Responsive design
- Visual feedback for user interactions

## AI Integration Patterns

### Agent System Implementation
```javascript
const aiToolsConfig = [
  {
    id: "contract-analysis",
    name: "Contract Analysis Agent",
    description: "AI-powered contract clause analysis and risk assessment",
    icon: "bi-file-earmark-text",
    category: "analysis",
    enabled: true,
  },
  {
    id: "legal-review",
    name: "Legal Review Agent",
    description: "Automated legal compliance checking",
    icon: "bi-shield-check",
    category: "legal",
    enabled: true,
  },
  {
    id: "risk-assessment",
    name: "Risk Assessment Agent",
    description: "Financial and operational risk evaluation",
    icon: "bi-exclamation-triangle",
    category: "risk",
    enabled: true,
  }
];

const handleActivateAITool = (toolId, document) => {
  const newProcess = {
    id: Date.now(),
    toolId,
    documentId: document.id,
    status: "processing",
    progress: 0,
    startTime: new Date(),
  };

  setActiveAIProcesses((prev) => [...prev, newProcess]);
};
```

## Best Practices Demonstrated

### 1. State Management
- Proper React state management patterns
- Asynchronous data loading with error handling
- Settings manager integration
- User authentication and profile management

### 2. Component Organization
- Modular component structure
- Clear separation of concerns
- Reusable component patterns
- Proper prop drilling management

### 3. User Experience
- Intuitive three-state navigation
- Visual feedback and animations
- Toast notifications for user actions
- Responsive design for all devices
- Accessibility considerations

### 4. Performance Optimization
- Memoization for expensive computations
- Lazy loading for large components
- Efficient re-rendering strategies
- Proper cleanup of event listeners

## Implementation Checklist

### Core Requirements
- [x] Three-state button navigation system
- [x] Dynamic background image theming
- [x] Advanced modal system integration
- [x] Grid-based layout with animations
- [x] AI agent system implementation
- [x] Settings manager integration
- [x] Accordion system integration
- [x] Responsive design implementation
- [x] Error handling and fallbacks
- [x] Performance optimization techniques

### Advanced Features
- [x] Animated grid layouts
- [x] Toast notification system
- [x] Dark theme support
- [x] File upload management
- [x] Document processing workflows
- [x] AI-powered analysis tools
- [x] State persistence
- [x] User preference management

## Related Documentation

- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [1300_0000_PAGE_LIST.md](1300_0000_PAGE_LIST.md) - Complete page documentation
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system
- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Simpler page patterns
- [0700_UI_SETTINGS.md](0700_UI_SETTINGS.md) - UI settings and configuration

This comprehensive guide serves as the definitive reference for implementing complex accordion-based pages in the ConstructAI system, using the 00435-contracts-post-award page as the primary example.
