# Detailed Page Implementation Guide

## Overview
This document provides a comprehensive guide for implementing pages accessed via main or sub-buttons on the accordion, as well as links such as timesheet, travel arrangements, all documents, email management, etc. It establishes detailed standards for consistent implementation across the ConstructAI system, using page 00435 as the sample reference for complex pages.

## 🗃️ Database Operations in Page Implementation

**When implementing pages that require new database tables or schema changes:**

### 🎯 Use the Hybrid Database Methodology

#### 1. **SQL Files for Schema Definition** (Required)
- Create readable, auditable schema definitions in `.sql` files
- Include table structures, indexes, constraints, and business logic
- Version controlled and shareable with DBA teams

**Example:** `sql/create_page_00435_tables.sql`
```sql
-- Page 00435: Contracts Post Award - Required Tables
CREATE TABLE a_00435_contracts_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    contract_value DECIMAL(15,2),
    approval_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_00435_contracts_project ON a_00435_contracts_data(project_id);
CREATE INDEX idx_00435_contracts_status ON a_00435_contracts_data(approval_status);
```

#### 2. **CJS Files for Intelligent Execution** (Required)
- Handle connection management, error recovery, and verification
- Provide transactional safety with automatic rollback on failures
- Include built-in validation and progress reporting

**Example:** `sql/create_page_00435_tables.cjs`
```javascript
#!/usr/bin/env node
const { Pool } = require('pg');
require('dotenv').config();

async function createPageTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query('BEGIN');

    // Execute the SQL definition file
    const fs = require('fs').promises;
    const sqlContent = await fs.readFile('sql/create_page_00435_tables.sql', 'utf8');
    await pool.query(sqlContent);

    // Verify table creation
    const check = await pool.query(`
      SELECT EXISTS(SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'a_00435_contracts_data') as exists
    `);

    if (!check.rows[0].exists) throw new Error('Table creation failed');

    await pool.query('COMMIT');
    console.log('✅ Page 00435 tables created successfully');

  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('❌ Table creation failed:', error.message);
    process.exit(1);
  }
}

createPageTables();
```

#### 3. **Standard Workflow for Page Implementation**
1. **Design Schema** → `sql/create_page_[prefix]_tables.sql`
2. **Create Executor** → `sql/create_page_[prefix]_tables.cjs`
3. **Add Data Layer** → Service files for database operations
4. **Implement UI** → Page components following standards
5. **Verify Integration** → Test UI ↔ Database connection

### 📋 Database Naming Conventions for Pages

#### Table Prefix Convention
- **Prefix:** `a_[page_4digit]_` (e.g., `a_00435_contracts_` for page 00435)
- **Purpose:** Clear association of tables with specific pages
- **Examples:**
  - `a_00435_contracts_data` (page 00435 contracts)
  - `a_03010_email_threads` (page 03010 email threads)
  - `a_00900_doccontrol_documents` (page 00900 document control)

#### Column Naming Standards
- Use `snake_case` for all column names
- Follow consistent data types across similar pages
- Include appropriate constraints and defaults
- Add comments for complex business logic fields

#### Index Strategy
- Primary key indexes are automatic
- **Always add indexes for foreign keys:** `idx_[prefix]_fk_[referenced_table]`
- **Add indexes for frequently queried columns:** `idx_[prefix]_[column_name]`
- **Composite indexes for complex queries:** `idx_[prefix]_[col1]_[col2]`

### 🔗 Data Integration Considerations

#### Foreign Key Relationships
- **Reference existing tables** when possible (organizations, projects, users)
- **Create new tables** only when page-specific data is required
- **Use UUIDs** for all primary and foreign keys for consistency

#### Row-Level Security (RLS)
- **Apply RLS policies** to protect sensitive data
- **Test with different user roles** before production deployment
- **Document security requirements** in page-specific README

#### Performance Optimization
- **Batch operations** for bulk data handling
- **Connection pooling** for high-traffic pages
- **Query optimization** for complex data retrieval

## Page Classification System

### 1. Complex Accordion Pages (00435-style)
These pages represent the most sophisticated implementation pattern in ConstructAI and are accessed via main or sub-buttons on the accordion.

**Characteristics:**
- Three-state button navigation (Agents, Upsert, Workspace)
- Theme-based background images (determined by localStorage or sector)
- Advanced modal systems with complex workflows
- Animated grid layouts with sophisticated interactions
- Comprehensive state management
- AI-powered agent systems as core functionality

**Examples:**
- 00435-contracts-post-award (primary reference)
- Other department-specific complex pages

### 2. Simpler Link-Based Pages
These pages are accessed through direct links and represent streamlined implementations.

**Characteristics:**
- Tab-based or simple menu navigation
- May or may not have background images (varies by page)
- Standard modal systems with basic workflows
- Standard grid or form layouts
- Focus on single primary function
- Standard accordion integration

**Examples:**
- 00106-timesheet
- 00105-travel-arrangements  
- 0200-all-documents
- 03010-email-management

## Implementation Standards for Complex Pages (00435-style)

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

### Core Component Implementation

#### Main Page Component Structure
```javascript
import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Button, Alert, Row, Col, Badge, Spinner, Modal, Form,
  Accordion, Table, InputGroup, Dropdown, ProgressBar, Tabs, Tab,
  OverlayTrigger, Popover
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

### Three-State Navigation System
```javascript
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
```

### CSS Structure and Styling
```css
/* Page-specific styles for 00435-contracts-post-award */

.contracts-post-award-page {
  --primary-color: #4a89dc;
  --secondary-color: #6c757d;
  --accent-color: #2c3e50;
  --text-color: #000000;
  --bg-color: #ffffff;
  --border-color: #dee2e6;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
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

.page-card {
  margin: 2rem;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.state-navigation {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.state-button {
  border-radius: 25px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.state-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.state-button.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 137, 220, 0.3);
}

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

## Implementation Standards for Simpler Pages (Timesheet/Travel Style)

### Directory Structure
```
client/src/pages/00106-timesheet/
├── 00106-index.js                    # Entry point
├── components/
│   ├── 00106-timesheet-page.js       # Main page component
│   ├── 00106-timesheet-grid.js       # Grid display component
│   ├── 00106-timesheet-form.js       # Entry form component
│   ├── modals/
│   │   ├── 00106-timesheet-entry-modal.js
│   │   └── 00106-template-management-modal.js
│   └── css/
│       └── 00106-timesheet-style.css # Page-specific styles
└── assets/
    └── 00106.png                     # Background image (optional)
```

### Core Component Implementation

#### Main Page Component Structure
```javascript
import React, { useState, useEffect, useCallback } from "react";
import {
  Card, Button, Alert, Row, Col, Badge, Spinner, Modal, Form,
  Accordion, Table, InputGroup, Dropdown, Tabs, Tab
} from "react-bootstrap";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getSupabase } from "@common/js/auth/00175-supabase-client.js";
import "./css/00106-timesheet-style.css";

// Component imports
import TimesheetGrid from "./00106-timesheet-grid.js";
import TimesheetForm from "./00106-timesheet-form.js";

const TimesheetPage = () => {
  // State management
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timesheet states
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Initialize settings manager
  useEffect(() => {
    const initSettings = async () => {
      try {
        console.log("[00106] Initializing settings manager...");
        if (!settingsManager) {
          console.warn("[00106] Settings manager is not available");
          setIsSettingsInitialized(true);
          return;
        }
        await settingsManager.initialize();
        console.log("[00106] Settings manager initialized");
        try {
          await settingsManager.applySettings();
          console.log("[00106] Settings applied successfully");
        } catch (applyError) {
          console.warn(
            "[00106] Could not apply settings, using defaults:",
            applyError
          );
        }
        setIsSettingsInitialized(true);
      } catch (err) {
        console.error("[00106] Error initializing settings:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setIsSettingsInitialized(true);
      }
    };
    initSettings();
  }, []);

  // Get background image path (optional)
  const backgroundImagePath = "/assets/default/00106.png";

  return (
    <div className="timesheet-page-wrapper">
      {/* Background Image (optional) */}
      {backgroundImagePath && (
        <div
          className="page-background"
          style={{
            backgroundImage: `url(${backgroundImagePath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: -1
          }}
        />
      )}
      
      {/* Accordion Integration */}
      {isSettingsInitialized && (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      )}
      
      {/* Main Content Area */}
      <div className="content-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <Card className="page-card">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h3>Timesheet Management</h3>
            <div className="header-controls">
              <Button 
                variant="primary" 
                onClick={() => setShowEntryModal(true)}
                className="me-2"
              >
                <i className="bi bi-plus-circle"></i> New Entry
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={() => setShowTemplateModal(true)}
              >
                <i className="bi bi-collection"></i> Templates
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Tab-based Navigation */}
            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
              <Tab eventKey="current" title="Current Week">
                <TimesheetGrid 
                  period="current" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowEntryModal}
                />
              </Tab>
              <Tab eventKey="history" title="History">
                <TimesheetGrid 
                  period="history" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowEntryModal}
                />
              </Tab>
              <Tab eventKey="templates" title="Templates">
                <TimesheetGrid 
                  period="templates" 
                  onEdit={setSelectedTimesheet}
                  onShowModal={setShowTemplateModal}
                />
              </Tab>
            </Tabs>
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

export default TimesheetPage;
```

### CSS Structure and Styling
```css
/* Page-specific styles for 00106-timesheet */

.timesheet-page-wrapper {
  position: relative;
  color: #000000 !important;
}

.timesheet-page-wrapper * {
  color: #000000 !important;
}

.page-background {
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
  background-attachment: fixed;
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

.timesheet-table th {
  background-color: rgba(74, 137, 220, 0.1);
  font-weight: 600;
}

.timesheet-table td {
  vertical-align: middle;
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
  
  .timesheet-table {
    font-size: 0.875rem;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 5px;
  }
  
  .header-controls .btn {
    width: 100%;
  }
}
```

## Common Implementation Features

### 1. Settings Manager Integration
All pages must integrate with the settings manager for consistent UI behavior:

```javascript
useEffect(() => {
  const initSettings = async () => {
    try {
      console.log("[PagePrefix] Initializing settings manager...");
      if (!settingsManager) {
        console.warn("[PagePrefix] Settings manager is not available");
        setIsSettingsInitialized(true);
        return;
      }
      await settingsManager.initialize();
      console.log("[PagePrefix] Settings manager initialized");
      try {
        await settingsManager.applySettings();
        console.log("[PagePrefix] Settings applied successfully");
      } catch (applyError) {
        console.warn(
          "[PagePrefix] Could not apply settings, using defaults:",
          applyError
        );
      }
      setIsSettingsInitialized(true);
    } catch (err) {
      console.error("[PagePrefix] Error initializing settings:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setIsSettingsInitialized(true);
    }
  };
  initSettings();
}, []);
```

### 2. Accordion System Integration
All pages integrate with the accordion system:

```javascript
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
)}
```

### 3. Logout Button Standardization
All pages must include the standardized logout button in the same position:

```css
.logout-button {
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

.logout-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
```

## AI Integration Standards

### Agent System Configuration (Complex Pages)
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

## Performance and Best Practices

### 1. State Management Optimization
```javascript
// Memoization for expensive computations
const filteredItems = useMemo(() => {
  return items.filter(item => {
    // Filtering logic
  });
}, [items, filters]);

// Callback optimization
const handleItemAction = useCallback((item) => {
  // Action logic
}, [dependencies]);
```

### 2. Error Handling Patterns
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await fetchFromDatabase();
      setData(data);
    } catch (dbError) {
      console.error("Database error:", dbError);
      const mockData = generateMockData();
      setData(mockData);
      setError("Using mock data - database unavailable");
    }
  };
  
  fetchData();
}, []);
```

### 3. Loading State Management
```javascript
{isLoading ? (
  <div className="text-center py-4">
    <Spinner animation="border" role="status" className="mb-3" />
    <div>Loading...</div>
  </div>
) : error ? (
  <Alert variant="danger">{error}</Alert>
) : (
  // Content
)}
```

## Implementation Checklist

### New Page Setup
- [ ] Create page directory structure following standards
- [ ] Set up index.js with component import
- [ ] Create main component file with proper structure
- [ ] Add CSS file with standardized styling
- [ ] Register page in UI display mappings
- [ ] Add route to App.js
- [ ] Create required assets (background images, icons)
- [ ] Test accordion integration
- [ ] Verify settings manager integration
- [ ] Implement core functionality
- [ ] Add error handling and fallbacks
- [ ] Test responsive design
- [ ] Document page-specific features

### Quality Assurance
- [ ] Consistent logout button implementation
- [ ] Proper background image handling
- [ ] Standardized navigation system
- [ ] Proper modal system integration
- [ ] Responsive design for all screen sizes
- [ ] Accessibility compliance
- [ ] Performance optimization
- [ ] Error handling and user feedback
- [ ] Security considerations
- [ ] Documentation completeness

## Page Type Comparison Matrix

| Feature | Complex Pages (00435) | Simpler Pages (Timesheet/Travel) |
|---------|----------------------|----------------------------------|
| Navigation | Three-state buttons | Tab-based or simple menus |
| Background | Dynamic theming | Fixed or optional |
| Modals | Advanced workflows | Standard patterns |
| Grid Layout | Animated, complex | Standard, simple |
| AI Integration | Core functionality | Optional features |
| State Management | Comprehensive | Basic tab states |
| Component Architecture | Modular, state-specific | Standard, reusable |
| Performance | High optimization | Standard optimization |

## Related Documentation

- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [1300_00435_SAMPLE_PAGE_STRUCTURE.md](1300_00435_SAMPLE_PAGE_STRUCTURE.md) - Complex page example
- [1300_00106_TIMESHEET_PAGE_EXAMPLE.md](1300_00106_TIMESHEET_PAGE_EXAMPLE.md) - Simpler page example
- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Simpler page implementation
- [1300_0000_DETAILED_PAGE_ACCESS_DOCUMENTATION.md](1300_0000_DETAILED_PAGE_ACCESS_DOCUMENTATION.md) - Page access patterns
- [1300_0000_PAGE_LIST.md](1300_0000_PAGE_LIST.md) - Complete page documentation
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system
- [0700_UI_SETTINGS.md](0700_UI_SETTINGS.md) - UI settings and configuration
- [1300_02050_UI_MANAGEMENT_INTERFACES.md](1300_02050_UI_MANAGEMENT_INTERFACES.md) - UI management interfaces

This comprehensive guide serves as the definitive reference for implementing both complex accordion-based pages and simpler link-based pages in the ConstructAI system, ensuring consistency while allowing for appropriate variations based on page complexity and requirements.
