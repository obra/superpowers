# 1300_01850 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_01850 group.

## Files in this Group

- [1300_01850_MASTERGUIDE.md](1300_01850_MASTERGUIDE.md)
- [1300_01850_OTHER_PARTIESPAGE.md](1300_01850_OTHER_PARTIESPAGE.md)
- [1300_01850_MASTER_GUIDE_OTHER_PARTIES.md](1300_01850_MASTER_GUIDE_OTHER_PARTIES.md)

## Consolidated Content

### 1300_01850_MASTERGUIDE.md

# 1300_01850_MASTER_GUIDE.md - Other Parties Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Other Parties Page Guide

## Overview
Documentation for the Other Parties page (01850) covering third-party management, vendor relationships, and stakeholder engagement.

## Page Structure
**File Location:** `client/src/pages/01850-other-parties`
```javascript
export default function OtherPartiesPage() {
  return (
    <PageLayout>
      <OtherPartiesDashboard />
      <VendorManagementModule />
      <StakeholderEngagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 01850-series other parties components (01851-01899)
2. Implement third-party management workflows
3. Support vendor relationship tools
4. Maintain stakeholder engagement systems
5. Provide external party evaluation system for contractor/supplier vetting
6. Enable template-based evaluation workflows across all disciplines

## Core Workflows

### Template-to-Vetting Pipeline
```
Template Generation (01300) → Discipline Selection Mode → Other Parties External Evaluation → Contractor Input → Discipline Vetting
```

### Complete Vetting Process
1. **Template Creation**: Templates generated via governance form processing (01300)
2. **Discipline Deployment**: Templates copied to discipline-specific tables via selection mode
3. **External Distribution**: Discipline teams issue templates to contractors via Other Parties page
4. **Contractor Response**: External parties complete forms and provide documentation at `/other-parties/external-party-evaluation`
5. **Discipline Review**: Completed responses become available for discipline team vetting
6. **Approval Workflow**: Multi-discipline evaluation and final approval decisions

### Template Management Integration
- **Source**: `governance_document_templates` table (processed templates)
- **Deployment**: Selection mode in template management enables bulk copying to discipline tables
- **Disciplines**: Safety tables, Procurement tables, Civil Engineering tables, etc.
- **Access Control**: RLS policies ensure proper discipline isolation and access
- **External Access**: Token-based secure access for contractors/suppliers

## Implementation
```bash
node scripts/other-parties-system/setup.js --full-config
```

## Related Documentation
- [0600_THIRD_PARTY_MANAGEMENT.md](../docs/0600_THIRD_PARTY_MANAGEMENT.md)
- [0700_VENDOR_RELATIONSHIPS.md](../docs/0700_VENDOR_RELATIONSHIPS.md)
- [0800_STAKEHOLDER_ENGAGEMENT.md](../docs/0800_STAKEHOLDER_ENGAGEMENT.md)
- [0750_PHASE2B_EXTERNAL_PARTY_EVALUATION_UI_PLAN.md](../docs/user-interface/0750_PHASE2B_EXTERNAL_PARTY_EVALUATION_UI_PLAN.md)
- [1300_pages_forms_templates_README.md](../docs/pages-forms-templates/1300_pages_forms_templates_README.md)

## Status
- [x] Core other parties dashboard implemented
- [ ] Vendor management module integration
- [ ] Stakeholder engagement tools
- [ ] Third-party management system

## Version History
- v1.0 (2025-08-27): Initial other parties page structure


---

### 1300_01850_MASTER_GUIDE_OTHER_PARTIES.md

# 1300_01850 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_01850 group.

## Files in this Group

- [1300_01850_MASTERGUIDE.md](1300_01850_MASTERGUIDE.md)
- [1300_01850_OTHER_PARTIESPAGE.md](1300_01850_OTHER_PARTIESPAGE.md)
- [1300_01850_MASTER_GUIDE_OTHER_PARTIES.md](1300_01850_MASTER_GUIDE_OTHER_PARTIES.md)

## Consolidated Content

### 1300_01850_MASTERGUIDE.md

# 1300_01850_MASTER_GUIDE.md - Other Parties Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Other Parties Page Guide

## Overview
Documentation for the Other Parties page (01850) covering third-party management, vendor relationships, and stakeholder engagement.

## Page Structure
**File Location:** `client/src/pages/01850-other-parties`
```javascript
export default function OtherPartiesPage() {
  return (
    <PageLayout>
      <OtherPartiesDashboard />
      <VendorManagementModule />
      <StakeholderEngagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 01850-series other parties components (01851-01899)
2. Implement third-party management workflows
3. Support vendor relationship tools
4. Maintain stakeholder engagement systems
5. Provide external party evaluation system for contractor/supplier vetting
6. Enable template-based evaluation workflows across all disciplines

## Core Workflows

### Template-to-Vetting Pipeline
```
Template Generation (01300) → Discipline Selection Mode → Other Parties External Evaluation → Contractor Input → Discipline Vetting
```

### Complete Vetting Process
1. **Template Creation**: Templates generated via governance form processing (01300)
2. **Discipline Deployment**: Templates copied to discipline-specific tables via selection mode
3. **External Distribution**: Discipline teams issue templates to contractors via Other Parties page
4. **Contractor Response**: External parties complete forms and provide documentation at `/other-parties/external-party-evaluation`
5. **Discipline Review**: Completed responses become available for discipline team vetting
6. **Approval Workflow**: Multi-discipline evaluation and final approval decisions

### Template Management Integration
- **Source**: `governance_document_templates` table (processed templates)
- **Deployment**: Selection mode in template management enables bulk copying to discipline tables
- **Disciplines**: Safety tables, Procurement tables, Civil Engineering tables, etc.
- **Access Control**: RLS policies ensure proper discipline isolation and access
- **External Access**: Token-based secure access for contractors/suppliers

## Implementation
```bash
node scripts/other-parties-system/setup.js --full-config
```

## Related Documentation
- [0600_THIRD_PARTY_MANAGEMENT.md](../docs/0600_THIRD_PARTY_MANAGEMENT.md)
- [0700_VENDOR_RELATIONSHIPS.md](../docs/0700_VENDOR_RELATIONSHIPS.md)
- [0800_STAKEHOLDER_ENGAGEMENT.md](../docs/0800_STAKEHOLDER_ENGAGEMENT.md)
- [0750_PHASE2B_EXTERNAL_PARTY_EVALUATION_UI_PLAN.md](../docs/user-interface/0750_PHASE2B_EXTERNAL_PARTY_EVALUATION_UI_PLAN.md)
- [1300_pages_forms_templates_README.md](../docs/pages-forms-templates/1300_pages_forms_templates_README.md)

## Status
- [x] Core other parties dashboard implemented
- [ ] Vendor management module integration
- [ ] Stakeholder engagement tools
- [ ] Third-party management system

## Version History
- v1.0 (2025-08-27): Initial other parties page structure


---

### 1300_01850_MASTER_GUIDE_OTHER_PARTIES.md

# 1300_01850_MASTER_GUIDE_OTHER_PARTIES.md - Other Parties Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Other Parties Page Master Guide based on actual implementation

## Overview
The Other Parties Page (01850) provides comprehensive third-party stakeholder management and external party evaluation capabilities for the ConstructAI system. It features a four-state navigation interface (Agents, Assigned Documents, Upsert, Workspace) with integrated AI-powered evaluation assistants, dynamic theming, and specialized stakeholder management workflows including contractor vetting, external party assessment, document assignment and tracking, and multi-party collaboration management. The page serves as the primary interface for managing relationships with external stakeholders, evaluating third-party performance, coordinating multi-party project activities, and ensuring compliance with stakeholder management requirements.

## Page Structure
**File Location:** `client/src/pages/01850-other-parties/`

### Main Component: 01850-other-parties-page.js
```javascript
import React, { useState, useEffect, useCallback } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import { useModal } from '@components/modal/hooks/00170-useModal';
import supabaseClientModule from "@common/js/auth/00175-supabase-client.js";
import "../../../common/css/pages/01850-other-parties/01850-pages-style.css";
import AssignedDocumentsComponent from './AssignedDocumentsComponent.js';

const OtherPartiesPageComponent = () => {
  const { openModal } = useModal();
  const [currentState, setCurrentState] = useState(null);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [modalConfigs, setModalConfigs] = useState({});
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const initializeClient = async () => {
      try {
        const client = await supabaseClientModule.getSupabase();
        if (client && typeof client.from === 'function' && isMounted) {
          setSupabaseClient(client);
        }
      } catch (error) {
        console.error("[OtherPartiesPage] Error initializing Supabase client:", error);
      }
    };
    initializeClient();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);

        if (supabaseClient && typeof supabaseClient.from === 'function') {
          const { data, error } = await supabaseClient
            .from('modal_configurations')
            .select('*')
            .eq('target_page_prefix', '1850');

          if (error) {
            console.error("[OtherPartiesPage] Error fetching modal configurations:", error);
          }

          if (data) {
            const configs = data.reduce((acc, config) => {
              acc[config.modal_key] = config;
              return acc;
            }, {});
            setModalConfigs(configs);
          }
        }
      } catch (error) {
        console.error("[OtherPartiesPage] An error occurred during initialization:", error);
      }
    };

    if (supabaseClient) {
      init();
    } else {
      const initSettingsOnly = async () => {
        try {
          await settingsManager.initialize();
          setIsSettingsInitialized(true);
        } catch (error) {
          console.error("[OtherPartiesPage] Error during settings initialization:", error);
        }
      };
      initSettingsOnly();
    }

    const authenticateUser = async () => {
      if (!supabaseClient) return;

      try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
        } else {
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setCurrentUserEmail('test@contractor.com');
          }
        }
      } catch (authError) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          setCurrentUserEmail('test@contractor.com');
        }
      }
    };

    authenticateUser();
  }, [supabaseClient]);

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

  const onFlowSuccess = useCallback((targetState) => {
    if (targetState) {
      setCurrentState(targetState);
    }
  }, []);

  const handleModalClick = (modalKey) => {
    const config = modalConfigs[modalKey];

    if (config) {
      openModal(modalKey, {
        triggerPage: "1850-OtherParties",
        modalConfig: config,
        onFlowSuccess: onFlowSuccess,
        supabaseClient: supabaseClient
      });
    } else {
      openModal(modalKey, { 
        triggerPage: "1850-OtherParties", 
        supabaseClient: supabaseClient 
      });
    }
  };

  const handleLogout = () => {
    if (window.handleLogout) {
      window.handleLogout();
    } else {
      console.error("Global handleLogout function not found.");
    }
  };

  const backgroundImagePath = getThemedImagePath('01850.png');

  return (
    <div
      className="other-parties-page page-background"
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
          <div className="A-1850-navigation-container">
            <div className="A-1850-nav-row">
              <button
                type="button"
                className={`state-button ${currentState === "agents" ? "active" : ""}`}
                onClick={() => handleStateChange("agents")}
              >
                Agents
              </button>
              <button
                type="button"
                className={`state-button ${currentState === "documents" ? "active" : ""}`}
                onClick={() => handleStateChange("documents")}
              >
                Assigned Documents
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
            <button className="nav-button primary">Other Parties</button>
          </div>

          <div
            className={`A-1850-button-container ${isButtonContainerVisible ? "visible" : ""}`}
          >
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-1850-modal-trigger-button"
                  onClick={() => handleModalClick("agentAction1")}
                >
                  Agent Action 1
                </button>
                <button
                  type="button"
                  className="A-1850-modal-trigger-button"
                  onClick={() => handleModalClick("agentAction2")}
                >
                  Agent Action 2
                </button>
              </>
            )}
            {currentState === "documents" && currentUserEmail && (
              <div style={{ width: '100%', marginTop: '2rem' }}>
                <AssignedDocumentsComponent currentUserEmail={currentUserEmail} />
              </div>
            )}
            {currentState === "upserts" && (
              <>
                <button
                  type="button"
                  className="A-1850-modal-trigger-button"
                  onClick={() => handleModalClick("upsertAction1")}
                >
                  Upsert Action 1
                </button>
                <button
                  type="button"
                  className="A-1850-modal-trigger-button"
                  onClick={() => handleModalClick("upsertAction2")}
                >
                  Upsert Action 2
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="A-1850-modal-trigger-button"
                onClick={() => handleModalClick("workspaceAction1")}
              >
                Workspace Action 1
              </button>
            )}
          </div>
        </div>
      </div>

      {isSettingsInitialized ? (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      ) : (
        <p>Loading Accordion...</p>
      )}

      <button
        id="logout-button"
        onClick={handleLogout}
        className="A-1850-logout-button"
      >
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

export default OtherPartiesPageComponent;
```

## Key Features

### 1. Four-State Navigation System
- **Agents State**: AI-powered stakeholder analysis and evaluation assistants
- **Assigned Documents State**: Document assignment and tracking for external parties
- **Upsert State**: Stakeholder data management and information processing
- **Workspace State**: Stakeholder relationship management and collaboration dashboard
- **State Persistence**: Maintains user context across navigation with stakeholder-specific workflows

### 2. Dynamic Background Theming
- **Sector-Specific Images**: Uses `getThemedImagePath()` for contextual stakeholder backgrounds
- **Fixed Attachment**: Parallax scrolling effect for professional stakeholder interface
- **Responsive Scaling**: Cover positioning with center-bottom alignment
- **Theme Integration**: Consistent with organizational stakeholder management branding

### 3. AI-Powered Stakeholder Assistants
- **Stakeholder Chatbots**: Specialized conversational AI for third-party relationship management
- **State-Aware Context**: Chatbots adapt to current navigation state (agents/documents/upsert/workspace)
- **Discipline-Specific**: Specialized for stakeholder management domain (01850)
- **User Authentication**: Secure stakeholder data access with role-based permissions

### 4. Comprehensive Stakeholder Modal System
- **Stakeholder Evaluation Modal**: Third-party performance and capability assessment
- **Document Assignment Modal**: Secure document sharing and tracking with external parties
- **Collaboration Management Modal**: Multi-party project coordination and communication
- **Compliance Tracking Modal**: Stakeholder regulatory compliance monitoring

### 5. Assigned Documents Integration
- **Document Assignment System**: Secure document sharing with external stakeholders
- **User-Based Access**: Email-based document access for authenticated external parties
- **Document Tracking**: Comprehensive audit trail of document access and actions
- **Version Control**: Document versioning and change tracking for stakeholder collaboration

## State-Based Architecture

### Agents State
**Purpose**: AI-assisted stakeholder analysis and evaluation operations
- **Stakeholder Intelligence**: Automated third-party capability and performance analysis
- **Risk Assessment**: AI-powered stakeholder risk evaluation and mitigation strategies
- **Relationship Optimization**: Predictive stakeholder relationship management
- **Performance Analytics**: Automated stakeholder performance monitoring and reporting

### Assigned Documents State
**Purpose**: Document management and stakeholder collaboration
- **Document Assignment**: Secure document sharing with external stakeholders
- **Access Control**: Email-based authentication for document access
- **Collaboration Tracking**: Document interaction and feedback management
- **Audit Compliance**: Comprehensive document access and usage tracking

### Upsert State
**Purpose**: Stakeholder data ingestion and management operations
- **Stakeholder Data Import**: Bulk stakeholder information and capability data processing
- **Relationship Data Management**: Stakeholder interaction and communication history
- **Performance Data Integration**: External stakeholder performance metrics and KPIs
- **Compliance Documentation**: Regulatory compliance and certification data management

### Workspace State
**Purpose**: Stakeholder relationship management and collaboration workspace
- **Stakeholder Dashboard**: Custom stakeholder relationship and performance dashboards
- **Collaboration Management**: Multi-party project coordination and communication tools
- **Relationship Analytics**: Stakeholder engagement and satisfaction metrics
- **Strategic Planning**: Stakeholder relationship development and optimization planning

## File Structure
```
client/src/pages/01850-other-parties/
├── 01850-index.js                           # Main entry point
├── 01850-contractor-vetting/                # Contractor vetting integration
│   └── components/                          # Vetting components
├── components/
│   ├── 01850-other-parties-page.js          # Main stakeholder component
│   ├── AssignedDocumentsComponent.js        # Document assignment system
│   └── external-party-evaluation/           # External party evaluation
├── css/                                     # Page-specific styling
└── common/css/pages/01850-other-parties/    # CSS styling
    └── 01850-pages-style.css
```

## Dependencies
- **React**: Core component framework with hooks (useState, useEffect, useCallback)
- **Accordion Component**: System-wide navigation integration with provider context
- **Settings Manager**: UI configuration and stakeholder display preferences
- **Modal Hook**: Advanced modal management for stakeholder operations
- **Supabase Client**: Database integration for stakeholder data and document management
- **Theme Helper**: Dynamic background image resolution for stakeholder theming
- **Assigned Documents Component**: Secure document sharing and tracking system

## Security Implementation
- **Stakeholder Data Protection**: Encrypted third-party information handling
- **Role-Based Access**: Stakeholder operation permissions and data restrictions
- **Document Security**: Secure document sharing with external parties
- **Audit Logging**: Comprehensive stakeholder action and document access tracking
- **Authentication**: Email-based authentication for external party document access

## Performance Considerations
- **Lazy Loading**: Stakeholder components load on demand
- **State Optimization**: Efficient re-rendering prevention for stakeholder data
- **Resource Management**: Memory cleanup for large stakeholder datasets
- **Background Processing**: Non-blocking stakeholder analytics and document processing

## Integration Points
- **Stakeholder Databases**: Integration with external stakeholder information systems
- **Document Management Systems**: Connection to secure document sharing platforms
- **Communication Platforms**: Integration with email and collaboration tools
- **Contractor Management Systems**: Connection to contractor vetting and evaluation platforms
- **Compliance Systems**: Integration with regulatory compliance monitoring systems

## Monitoring and Analytics
- **Stakeholder Operations**: Usage tracking and stakeholder workflow analytics
- **Document Access**: Secure document sharing and access pattern monitoring
- **Relationship Metrics**: Stakeholder engagement and performance analytics
- **Compliance Tracking**: Stakeholder regulatory compliance status and reporting
- **Collaboration Effectiveness**: Multi-party collaboration success and efficiency metrics

## Future Development Roadmap
- **Advanced Stakeholder Analytics**: Enhanced AI-powered stakeholder relationship modeling
- **Blockchain-Based Verification**: Immutable stakeholder credential and certification verification
- **Real-time Collaboration**: Live multi-party document collaboration and review
- **Automated Compliance**: AI-powered regulatory compliance monitoring and alerting
- **Stakeholder Experience Platform**: Comprehensive external party engagement and management platform

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Navigation system
- [1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md](1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md) - Similar multi-state page pattern
- [1300_02400_SAFETY_MASTER_GUIDE.md](1300_02400_SAFETY_MASTER_GUIDE.md) - Related contractor vetting and evaluation
- [1300_01900_PROCUREMENT_MASTER_GUIDE.md](1300_01900_PROCUREMENT_MASTER_GUIDE.md) - Related supplier and stakeholder management

## Status
- [x] Core four-state navigation implemented
- [x] Dynamic background theming completed
- [x] AI stakeholder assistants integrated
- [x] Assigned documents system verified
- [x] Supabase integration completed
- [x] Security and privacy measures implemented
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive master guide based on actual implementation analysis


---

### 1300_01850_OTHER_PARTIESPAGE.md

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


---



---

### 1300_01850_OTHER_PARTIESPAGE.md

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


---

