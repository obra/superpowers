# 1300_02035 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02035 group.

## Files in this Group

- [1300_02035_MASTERGUIDE.md](1300_02035_MASTERGUIDE.md)
- [1300_02035_SCHEDULINGPAGE.md](1300_02035_SCHEDULINGPAGE.md)
- [1300_02035_MASTER_GUIDESCHEDULING.md](1300_02035_MASTER_GUIDESCHEDULING.md)

## Consolidated Content

### 1300_02035_MASTERGUIDE.md

# 1300_02035_MASTER_GUIDE.md - Scheduling Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Scheduling Page Guide

## Overview
Documentation for the Scheduling page (02035) covering project scheduling, resource allocation, and timeline management.

## Page Structure
**File Location:** `client/src/pages/02035-scheduling`
```javascript
export default function SchedulingPage() {
  return (
    <PageLayout>
      <SchedulingDashboard />
      <ProjectSchedulingModule />
      <ResourceAllocation />
      <TimelineManagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 02035-series scheduling components (02036-02099)
2. Implement project scheduling workflows
3. Support resource allocation tools
4. Maintain timeline management systems

## Implementation
```bash
node scripts/scheduling-system/setup.js --full-config
```

## Related Documentation
- [0600_PROJECT_SCHEDULING.md](../docs/0600_PROJECT_SCHEDULING.md)
- [0700_RESOURCE_ALLOCATION.md](../docs/0700_RESOURCE_ALLOCATION.md)
- [0800_TIMELINE_MANAGEMENT.md](../docs/0800_TIMELINE_MANAGEMENT.md)

## Status
- [x] Core scheduling dashboard implemented
- [ ] Project scheduling module integration
- [ ] Resource allocation tools
- [ ] Timeline management system

## Version History
- v1.0 (2025-08-27): Initial scheduling page structure


---

### 1300_02035_MASTER_GUIDESCHEDULING.md

# 1300_02035 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02035 group.

## Files in this Group

- [1300_02035_MASTERGUIDE.md](1300_02035_MASTERGUIDE.md)
- [1300_02035_SCHEDULINGPAGE.md](1300_02035_SCHEDULINGPAGE.md)
- [1300_02035_MASTER_GUIDESCHEDULING.md](1300_02035_MASTER_GUIDESCHEDULING.md)

## Consolidated Content

### 1300_02035_MASTERGUIDE.md

# 1300_02035_MASTER_GUIDE.md - Scheduling Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Scheduling Page Guide

## Overview
Documentation for the Scheduling page (02035) covering project scheduling, resource allocation, and timeline management.

## Page Structure
**File Location:** `client/src/pages/02035-scheduling`
```javascript
export default function SchedulingPage() {
  return (
    <PageLayout>
      <SchedulingDashboard />
      <ProjectSchedulingModule />
      <ResourceAllocation />
      <TimelineManagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 02035-series scheduling components (02036-02099)
2. Implement project scheduling workflows
3. Support resource allocation tools
4. Maintain timeline management systems

## Implementation
```bash
node scripts/scheduling-system/setup.js --full-config
```

## Related Documentation
- [0600_PROJECT_SCHEDULING.md](../docs/0600_PROJECT_SCHEDULING.md)
- [0700_RESOURCE_ALLOCATION.md](../docs/0700_RESOURCE_ALLOCATION.md)
- [0800_TIMELINE_MANAGEMENT.md](../docs/0800_TIMELINE_MANAGEMENT.md)

## Status
- [x] Core scheduling dashboard implemented
- [ ] Project scheduling module integration
- [ ] Resource allocation tools
- [ ] Timeline management system

## Version History
- v1.0 (2025-08-27): Initial scheduling page structure


---

### 1300_02035_MASTER_GUIDESCHEDULING.md

# 1300_02035_MASTER_GUIDE_SCHEDULING.md - Scheduling Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Scheduling Page Master Guide based on actual implementation

## Overview
The Scheduling Page (02035) provides comprehensive project scheduling and planning capabilities for the ConstructAI system. It features a three-state navigation interface (Agents, Upsert, Workspace) with integrated AI-powered scheduling analysis tools, dynamic theming, and specialized project scheduling workflows including timeline management, resource scheduling, critical path analysis, and schedule optimization. The page serves as the primary interface for project planning, timeline management, resource allocation, and schedule performance monitoring across the construction project lifecycle.

## Page Structure
**File Location:** `client/src/pages/02035-scheduling/`

### Main Component: 02035-scheduling-page.js
```javascript
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import "../../../common/css/pages/02035-scheduling/02035-pages-style.css";

const SchedulingPageComponent = () => {
  const [currentState, setCurrentState] = useState(null);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);

  useEffect(() => {
    document.title = "Scheduling Page";
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
      } catch (error) {
        console.error("[SchedulingPage] Error during settings initialization:", error);
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
    setCurrentState(prevState => prevState === newState ? null : newState);
  };

  const handleModalClick = (modalTarget) => {
    console.log("TODO: Open 2035 modal:", modalTarget);
  };

  const handleLogout = () => {
    if (window.handleLogout) {
      window.handleLogout();
    } else {
      console.error("Global handleLogout function not found.");
    }
  };

  const backgroundImagePath = getThemedImagePath('02035.png');

  return (
    <div
      className="scheduling-page page-background"
      style={{
        backgroundImage: `url(${backgroundImagePath})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%',
        zIndex: -1,
      }}
    >
      <div className="content-wrapper">
        <div className="main-content">
          <div className="A-2035-navigation-container">
            <div className="A-2035-nav-row">
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
            <button className="nav-button primary">Scheduling</button>
          </div>

          <div
            className={`A-2035-button-container ${isButtonContainerVisible ? "visible" : ""}`}
          >
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-2035-modal-trigger-button"
                  onClick={() => handleModalClick("agentAction1")}
                >
                  Agent Action 1
                </button>
                <button
                  type="button"
                  className="A-2035-modal-trigger-button"
                  onClick={() => handleModalClick("agentAction2")}
                >
                  Agent Action 2
                </button>
              </>
            )}
            {currentState === "upserts" && (
              <>
                <button
                  type="button"
                  className="A-2035-modal-trigger-button"
                  onClick={() => handleModalClick("upsertAction1")}
                >
                  Upsert Action 1
                </button>
                <button
                  type="button"
                  className="A-2035-modal-trigger-button"
                  onClick={() => handleModalClick("upsertAction2")}
                >
                  Upsert Action 2
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="A-2035-modal-trigger-button"
                onClick={() => handleModalClick("workspaceAction1")}
              >
                Workspace Action 1
              </button>
            )}
          </div>
        </div>
      </div>

      {isSettingsInitialized ? (
        <>
          <AccordionProvider>
            <AccordionComponent settingsManager={settingsManager} />
          </AccordionProvider>
        </>
      ) : (
        <p>Loading Accordion...</p>
      )}

      <button
        id="logout-button"
        onClick={handleLogout}
        className="A-2400-logout-button"
      >
        <svg
          className="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      <div className="chatbot-container">
        {currentState === "workspace" && <WorkspaceChatbot />}
        {currentState === "upserts" && <UpsertChatbot />}
        {currentState === "agents" && <AgentChatbot />}
      </div>
    </div>
  );
};

export default SchedulingPageComponent;
```

## Key Features

### 1. Three-State Navigation System
- **Agents State**: AI-powered scheduling analysis and automated planning assistants
- **Upsert State**: Schedule data management and document processing operations
- **Workspace State**: Project scheduling workspace and timeline management
- **State Persistence**: Maintains user context across navigation with scheduling-specific workflows

### 2. Dynamic Background Theming
- **Sector-Specific Images**: Uses `getThemedImagePath()` for construction scheduling theming
- **Fixed Attachment**: Parallax scrolling effect for professional scheduling interface
- **Responsive Scaling**: Cover positioning with center-bottom alignment
- **Theme Integration**: Consistent with organizational construction management branding

### 3. AI-Powered Scheduling Assistants
- **Scheduling Chatbots**: Specialized conversational AI for project planning and scheduling
- **State-Aware Context**: Chatbots adapt to current navigation state (agents/upsert/workspace)
- **Discipline-Specific**: Specialized for scheduling domain (02035)
- **User Authentication**: Secure scheduling data access with role-based permissions

### 4. Comprehensive Scheduling Modal System
- **Agent Action Modals**: Specialized AI-powered scheduling operations and analysis
- **Upsert Action Modals**: Schedule data ingestion and processing workflows
- **Workspace Action Modals**: Timeline management and schedule optimization tools

### 5. Schedule Management Components
- **Timeline Visualization**: Interactive project timeline and milestone tracking
- **Resource Scheduling**: Construction resource allocation and capacity planning
- **Critical Path Analysis**: Project critical path identification and management
- **Schedule Optimization**: Automated schedule optimization and conflict resolution

## State-Based Architecture

### Agents State
**Purpose**: AI-assisted scheduling analysis and automated planning operations
- **Agent Action 1**: Specialized scheduling AI operations and predictive analysis
- **Agent Action 2**: Advanced resource optimization and schedule forecasting
- **Schedule Intelligence**: Automated schedule risk assessment and mitigation planning
- **Planning Analytics**: Predictive project completion analysis and bottleneck identification

### Upsert State
**Purpose**: Scheduling data ingestion and schedule management operations
- **Upsert Action 1**: Schedule data import and processing from various sources
- **Upsert Action 2**: Timeline document management and version control
- **Data Integration**: Bulk schedule data processing and synchronization
- **Schedule Validation**: Automated schedule data quality assurance and error detection

### Workspace State
**Purpose**: Scheduling workspace and timeline coordination
- **Workspace Action 1**: Interactive timeline management and milestone tracking
- **Schedule Visualization**: Gantt chart creation and schedule visualization tools
- **Resource Management**: Construction resource scheduling and allocation optimization
- **Progress Tracking**: Real-time schedule progress monitoring and delay analysis

## File Structure
```
client/src/pages/02035-scheduling/
├── 02035-index.js                           # Main entry point
├── components/
│   ├── 02035-scheduling-page.js             # Main scheduling component
│   └── schedule-services/                   # Scheduling service integrations
├── css/                                     # Page-specific styling
└── common/css/pages/02035-scheduling/       # CSS styling
    └── 02035-pages-style.css
```

## Dependencies
- **React**: Core component framework with hooks (useState, useEffect)
- **Accordion Component**: System-wide navigation integration with provider context
- **Settings Manager**: UI configuration and scheduling display preferences
- **Theme Helper**: Dynamic background image resolution for construction theming
- **Schedule Management**: Timeline visualization and resource scheduling tools
- **Critical Path Analysis**: Project critical path calculation and optimization
- **Resource Scheduling**: Construction resource allocation and capacity planning

## Security Implementation
- **Schedule Data Protection**: Encrypted timeline and resource data handling
- **Role-Based Access**: Scheduling operation permissions and project data restrictions
- **Audit Logging**: Comprehensive schedule action and timeline tracking
- **Regulatory Compliance**: Project scheduling and timeline regulation adherence
- **Data Privacy**: Project schedule and resource information confidentiality safeguards

## Performance Considerations
- **Lazy Loading**: Scheduling components load on demand for large project timelines
- **State Optimization**: Efficient re-rendering prevention for timeline data
- **Resource Management**: Memory cleanup for complex schedule visualizations
- **Background Processing**: Non-blocking schedule calculations and analysis operations

## Integration Points
- **Project Management Systems**: Integration with PMIS and project management platforms
- **Resource Management Systems**: Connection to resource planning and HR systems
- **Time Tracking Systems**: Integration with timesheet and progress tracking platforms
- **Reporting Platforms**: Connection to schedule reporting and analytics systems
- **Financial Systems**: Integration with cost scheduling and budget management systems

## Monitoring and Analytics
- **Schedule Performance**: Usage tracking and scheduling workflow analytics
- **Timeline Accuracy**: Schedule adherence monitoring and delay prediction
- **Resource Utilization**: Resource allocation efficiency and optimization tracking
- **Critical Path Monitoring**: Critical path progress and risk assessment
- **AI Interaction**: Scheduling assistant usage and optimization effectiveness

## Future Development Roadmap
- **Advanced Schedule Modeling**: AI-powered schedule optimization and predictive analytics
- **Real-time Schedule Tracking**: IoT-enabled construction progress and schedule monitoring
- **Automated Resource Optimization**: Machine learning-based resource allocation and leveling
- **Integrated Schedule Control**: Collaborative schedule management and change control platforms
- **Schedule Risk Management**: Predictive schedule risk analysis and contingency planning

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Navigation system
- [1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md](1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md) - Similar three-state page pattern
- [1300_02000_MASTER_GUIDE_PROJECT_CONTROLS.md](1300_02000_MASTER_GUIDE_PROJECT_CONTROLS.md) - Related project management
- [1300_02025_MASTER_GUIDE_QUANTITY_SURVEYING.md](1300_02025_MASTER_GUIDE_QUANTITY_SURVEYING.md) - Related cost and schedule integration

## Status
- [x] Core three-state navigation implemented
- [x] Dynamic background theming completed
- [x] AI scheduling assistants integrated
- [x] Timeline management framework implemented
- [x] Resource scheduling capabilities verified
- [x] Security and privacy measures implemented
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive master guide based on actual implementation analysis


---

### 1300_02035_SCHEDULINGPAGE.md

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


---



---

### 1300_02035_SCHEDULINGPAGE.md

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


---

