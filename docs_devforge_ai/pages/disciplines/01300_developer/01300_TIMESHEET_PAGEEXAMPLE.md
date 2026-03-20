# 00106 Timesheet Page Example

## Overview
This document provides a detailed example of the 00106-timesheet page implementation, which represents a typical simpler page in the ConstructAI system. This page demonstrates the tab-based navigation pattern, standard accordion integration, and simpler modal system used by link-based pages.

## Page Structure Analysis

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
    └── 00106.png                     # Background image
```

## Core Component Implementation

### Main Page Component (00106-timesheet-page.js)
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
  Tabs,
  Tab,
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

  // Get background image path
  const backgroundImagePath = "/assets/default/00106.png";

  return (
    <div className="timesheet-page-wrapper">
      {/* Background Image */}
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

### Timesheet Grid Component (00106-timesheet-grid.js)
```javascript
import React, { useState, useEffect } from "react";
import { Table, Button, Badge, Spinner } from "react-bootstrap";
import { getSupabase } from "@common/js/auth/00175-supabase-client.js";

const TimesheetGrid = ({ period, onEdit, onShowModal }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimesheets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = await getSupabase();
        let query = supabase.from('timesheets').select('*');
        
        // Filter by period
        switch(period) {
          case 'current':
            query = query.gte('date', getStartOfWeek());
            break;
          case 'history':
            query = query.lt('date', getStartOfWeek());
            break;
          case 'templates':
            query = query.eq('is_template', true);
            break;
        }
        
        const { data, error } = await query.order('date', { ascending: false });
        
        if (error) throw error;
        setTimesheets(data);
      } catch (err) {
        setError("Failed to load timesheets: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimesheets();
  }, [period]);

  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff)).toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" className="mb-3" />
        <div>Loading timesheets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  }

  return (
    <Table striped bordered hover responsive className="timesheet-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Project</th>
          <th>Hours</th>
          <th>Activity</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {timesheets.map((timesheet) => (
          <tr key={timesheet.id}>
            <td>{timesheet.date}</td>
            <td>{timesheet.project_name}</td>
            <td>{timesheet.hours}</td>
            <td>{timesheet.activity}</td>
            <td>
              <Badge bg={
                timesheet.status === 'submitted' ? 'success' :
                timesheet.status === 'approved' ? 'primary' :
                timesheet.status === 'rejected' ? 'danger' : 'warning'
              }>
                {timesheet.status}
              </Badge>
            </td>
            <td>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  onEdit(timesheet);
                  onShowModal(true);
                }}
                className="me-1"
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDelete(timesheet.id)}
              >
                <i className="bi bi-trash"></i>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TimesheetGrid;
```

## CSS Structure and Styling

### Main Styles (00106-timesheet-style.css)
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

## Key Implementation Features

### 1. Tab-Based Navigation
The timesheet page uses a simple tab-based navigation system:
- **Current Week**: Displays current week's timesheet entries
- **History**: Shows historical timesheet entries
- **Templates**: Manages timesheet templates

### 2. Background Image Handling
Unlike the complex 00435 page, the timesheet page has a fixed background image:
- Uses `00106.png` as the background image
- `backgroundAttachment: 'fixed'` for consistent positioning
- No dynamic theming - background remains constant

### 3. Simpler Component Architecture
The page uses a simpler component structure with:
- Tab-based content organization
- Standard form and grid components
- Basic modal system
- Template management features

### 4. Standard Grid Layout
The page implements a standard table-based grid layout with:
- Responsive table design
- Status badges for visual feedback
- Action buttons for editing/deleting
- Loading and error states

## Implementation Patterns

### 1. Settings Manager Integration
```javascript
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
```

### 2. Accordion Integration
```javascript
{isSettingsInitialized && (
  <AccordionProvider>
    <AccordionComponent settingsManager={settingsManager} />
  </AccordionProvider>
)}
```

### 3. Background Image Implementation
```javascript
const backgroundImagePath = "/assets/default/00106.png";

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
```

## Best Practices Demonstrated

### 1. Simpler State Management
- Tab-based navigation instead of complex state system
- Standard React state management patterns
- Proper error handling and loading states

### 2. Component Organization
- Clear separation of concerns
- Reusable grid and form components
- Proper prop passing and event handling

### 3. User Experience
- Intuitive tab-based interface
- Clear visual feedback with badges
- Responsive design for all devices
- Standard modal patterns

### 4. Performance Considerations
- Efficient data fetching with useEffect
- Proper cleanup of resources
- Memoization where appropriate
- Lazy loading for large datasets

## Implementation Checklist

### Core Requirements
- [x] Tab-based navigation system
- [x] Fixed background image implementation
- [x] Standard modal system integration
- [x] Grid-based layout with table
- [x] Settings manager integration
- [x] Accordion system integration
- [x] Responsive design implementation
- [x] Error handling and fallbacks
- [x] Performance optimization techniques

### Page-Specific Features
- [x] Timesheet entry management
- [x] Template system implementation
- [x] Status tracking and display
- [x] Project-based organization
- [x] Weekly period management
- [x] Approval workflow support

## Differences from Complex Pages (00435-style)

### Simpler Architecture
- **Navigation**: Tab-based instead of three-state buttons
- **Background**: Fixed image instead of dynamic theming
- **Components**: Standard forms/grids instead of animated layouts
- **State Management**: Simpler tab states instead of complex workflows

### Reduced Complexity
- **Modal System**: Basic modal patterns instead of advanced workflows
- **AI Integration**: Optional AI features instead of core functionality
- **Data Interaction**: Standard CRUD operations instead of complex processing
- **User Interface**: Simpler layouts instead of animated grids

## Related Documentation

- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md) - Simpler page implementation guide
- [1300_0000_PAGE_ARCHITECTURE_GUIDE.md](1300_0000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [1300_0000_PAGE_LIST.md](1300_0000_PAGE_LIST.md) - Complete page documentation
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Accordion system
- [1300_00435_SAMPLE_PAGE_STRUCTURE.md](1300_00435_SAMPLE_PAGE_STRUCTURE.md) - Complex page example

This example demonstrates how simpler pages like the timesheet page differ from complex accordion-based pages while maintaining consistency with the overall ConstructAI system architecture.
