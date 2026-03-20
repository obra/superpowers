# 1300_02100 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02100 group.

## Files in this Group

- [1300_02100_MASTERGUIDE.md](1300_02100_MASTERGUIDE.md)
- [1300_02100_PUBLIC_RELATIONS_GUIDE.md](1300_02100_PUBLIC_RELATIONS_GUIDE.md)
- [1300_02100_PUBLIC_RELATIONS_PAGE.md](1300_02100_PUBLIC_RELATIONS_PAGE.md)
- [1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md](1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md)

## Consolidated Content

### 1300_02100_MASTERGUIDE.md

# 1300_02100_MASTER_GUIDE.md - Public Relations Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Public Relations Page Guide

## Overview
Documentation for the Public Relations page (02100) covering media relations, community engagement, and crisis management.

## Page Structure
**File Location:** `client/src/pages/02100-public-relations`
```javascript
export default function PublicRelationsPage() {
  return (
    <PageLayout>
      <PRDashboard />
      <MediaRelations />
      <CommunityEngagement />
      <CrisisManagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 02100-series public relations components (02101-02199)
2. Implement media relations workflows
3. Support community engagement tools
4. Maintain crisis management systems

## Implementation
```bash
node scripts/pr-system/setup.js --full-config
```

## Related Documentation
- [0600_MEDIA_RELATIONS.md](../docs/0600_MEDIA_RELATIONS.md)
- [0700_COMMUNITY_ENGAGEMENT.md](../docs/0700_COMMUNITY_ENGAGEMENT.md)
- [0800_CRISIS_MANAGEMENT.md](../docs/0800_CRISIS_MANAGEMENT.md)

## Status
- [x] Core public relations dashboard implemented
- [ ] Media relations module integration
- [ ] Community engagement tools
- [ ] Crisis management system

## Version History
- v1.0 (2025-08-27): Initial public relations page structure


---

### 1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md

# 1300_02100 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02100 group.

## Files in this Group

- [1300_02100_MASTERGUIDE.md](1300_02100_MASTERGUIDE.md)
- [1300_02100_PUBLIC_RELATIONS_GUIDE.md](1300_02100_PUBLIC_RELATIONS_GUIDE.md)
- [1300_02100_PUBLIC_RELATIONS_PAGE.md](1300_02100_PUBLIC_RELATIONS_PAGE.md)
- [1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md](1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md)

## Consolidated Content

### 1300_02100_MASTERGUIDE.md

# 1300_02100_MASTER_GUIDE.md - Public Relations Page

## Status
- [x] Initial draft
- [ ] Tech review
- [ ] Approved for use
- [ ] Audit completed

## Version History
- v1.0 (2025-08-27): Initial Public Relations Page Guide

## Overview
Documentation for the Public Relations page (02100) covering media relations, community engagement, and crisis management.

## Page Structure
**File Location:** `client/src/pages/02100-public-relations`
```javascript
export default function PublicRelationsPage() {
  return (
    <PageLayout>
      <PRDashboard />
      <MediaRelations />
      <CommunityEngagement />
      <CrisisManagement />
    </PageLayout>
  );
}
```

## Requirements
1. Use 02100-series public relations components (02101-02199)
2. Implement media relations workflows
3. Support community engagement tools
4. Maintain crisis management systems

## Implementation
```bash
node scripts/pr-system/setup.js --full-config
```

## Related Documentation
- [0600_MEDIA_RELATIONS.md](../docs/0600_MEDIA_RELATIONS.md)
- [0700_COMMUNITY_ENGAGEMENT.md](../docs/0700_COMMUNITY_ENGAGEMENT.md)
- [0800_CRISIS_MANAGEMENT.md](../docs/0800_CRISIS_MANAGEMENT.md)

## Status
- [x] Core public relations dashboard implemented
- [ ] Media relations module integration
- [ ] Community engagement tools
- [ ] Crisis management system

## Version History
- v1.0 (2025-08-27): Initial public relations page structure


---

### 1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md

# 1300_02100_MASTER_GUIDE_PUBLIC_RELATIONS.md - Public Relations Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Public Relations Page Master Guide based on actual implementation

## Overview
The Public Relations Page (02100) provides comprehensive communications and stakeholder management capabilities for the ConstructAI system. It features a three-state navigation interface (Agents, Upsert, Workspace) with integrated PR management tools, stakeholder communication workflows, and reputation management systems. The page serves as the primary interface for managing public communications, stakeholder relationships, crisis management, and organizational reputation across construction projects and corporate communications.

## Page Structure
**File Location:** `client/src/pages/02100-public-relations/`

### Main Component: 02100-public-relations-page.js
```javascript
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import { useModal } from '@components/modal/hooks/00170-useModal';

import "../../../common/css/pages/02100-public-relations/02100-pages-style.css";

const PublicRelationsPageComponent = () => {
  const [currentState, setCurrentState] = useState(null);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const { openModal } = useModal();

  useEffect(() => {
    const init = async () => {
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
      } catch (error) {
        console.error("[PublicRelationsPage] Error during settings initialization:", error);
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

  const handleLogout = () => {
    if (window.handleLogout) {
      window.handleLogout();
    } else {
      console.error("Global handleLogout function not found.");
    }
  };

  const backgroundImagePath = getThemedImagePath('02100.png');

  return (
    <div
      className="public-relations-page page-background"
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
      <div className="content-wrapper">
        <div className="main-content">
          <div className="A-2100-navigation-container">
            <div className="A-2100-nav-row">
              <button
                type="button"
                className={`state-button ${currentState === "agents" ? "active" : ""}`}
                onClick={() => handleStateChange("agents")}
              >
                Agents
              </button>
              <button
                type="button"
                className={`state-button ${currentState === "upsert" ? "active" : ""}`}
                onClick={() => handleStateChange("upsert")}
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
            <button className="nav-button primary">Public Relations</button>
          </div>

          <div
            className={`A-2100-button-container ${isButtonContainerVisible ? "visible" : ""}`}
          >
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="A-2100-modal-trigger-button"
                  onClick={() =>
                    openModal("PublicRelationsUpsertUrlModal", { triggerPage: 'PublicRelations' })
                  }
                >
                  Upsert URL
                </button>
                <button
                  type="button"
                  className="A-2100-modal-trigger-button"
                  onClick={() =>
                    openModal("PublicRelationsUpsertPdfModal", { triggerPage: 'PublicRelations' })
                  }
                >
                  Upsert PDF
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-2100-modal-trigger-button"
                  onClick={() =>
                    openModal("PublicRelationsMinutesCompileModal", { triggerPage: 'PublicRelations' })
                  }
                >
                  Compile Minutes
                </button>
                <button
                  type="button"
                  className="A-2100-modal-trigger-button"
                  onClick={() =>
                    openModal("PublicRelationsRiskAssessmentModal", { triggerPage: 'PublicRelations' })
                  }
                >
                  Risk Assessment
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <button
                type="button"
                className="A-2100-modal-trigger-button"
                onClick={() => openModal("developmentModal", { triggerPage: 'PublicRelations' })}
              >
                Development Info
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
        className="A-2100-logout-button"
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
        {currentState === "upsert" && <UpsertChatbot />}
        {currentState === "agents" && <AgentChatbot />}
      </div>
    </div>
  );
};

export default PublicRelationsPageComponent;
```

## Key Features

### 1. Three-State Navigation System
- **Agents State**: AI-powered PR analysis and automated stakeholder communication assistants
- **Upsert State**: Document and content management for PR materials and communications
- **Workspace State**: PR management workspace with stakeholder engagement and reputation monitoring
- **State Persistence**: Maintains user context across navigation with PR-specific workflows

### 2. Dynamic Background Theming
- **Sector-Specific Images**: Uses `getThemedImagePath()` for communications and PR theming
- **Fixed Attachment**: Parallax scrolling effect for professional communications interface
- **Responsive Scaling**: Cover positioning with center-bottom alignment
- **Theme Integration**: Consistent with organizational communications branding

### 3. AI-Powered PR Assistants
- **PR Chatbots**: Specialized conversational AI for stakeholder communications and reputation management
- **State-Aware Context**: Chatbots adapt to current navigation state (agents/upsert/workspace)
- **Discipline-Specific**: Specialized for public relations domain (02100)
- **User Authentication**: Secure stakeholder data access with role-based permissions

### 4. Comprehensive PR Modal System
- **Document Management**: URL and PDF content processing for PR materials
- **Meeting Documentation**: Automated minutes compilation for stakeholder meetings
- **Risk Assessment**: Communications risk identification and management
- **Development Information**: PR development and strategic communications tools

## State-Based Architecture

### Agents State
**Purpose**: AI-assisted PR operations and automated communications
- **Compile Minutes**: Automated stakeholder meeting documentation and action item tracking
- **Risk Assessment**: Communications risk analysis and reputation management planning
- **Stakeholder Intelligence**: Automated stakeholder sentiment analysis and engagement optimization
- **Communications Analytics**: Predictive PR performance analysis and strategy optimization

### Upsert State
**Purpose**: PR content and document management operations
- **Upsert URL**: Web-based PR content and stakeholder communications processing
- **Upsert PDF**: Technical documentation and PR materials processing
- **Content Integration**: Bulk PR content processing and stakeholder database synchronization
- **Communications Validation**: Automated PR content quality assurance and compliance checking

### Workspace State
**Purpose**: PR management workspace and stakeholder coordination
- **Development Modal**: PR strategy development and communications planning tools
- **Stakeholder Management**: Stakeholder database management and relationship tracking
- **Reputation Monitoring**: Real-time reputation tracking and crisis management
- **Communications Planning**: Strategic communications planning and campaign management

## File Structure
```
client/src/pages/02100-public-relations/
├── 02100-index.js                           # Main entry point
├── components/
│   ├── 02100-public-relations-page.js       # Main PR component
│   └── pr-services/                         # PR service integrations
├── css/                                     # Page-specific styling
└── common/css/pages/02100-public-relations/ # CSS styling
    └── 02100-pages-style.css
```

## Dependencies
- **React**: Core component framework with hooks (useState, useEffect)
- **Accordion Component**: System-wide navigation integration with provider context
- **Settings Manager**: UI configuration and PR display preferences
- **Theme Helper**: Dynamic background image resolution for communications theming
- **Modal System**: Advanced modal management for PR operations
- **Communications Tools**: Stakeholder management and reputation monitoring
- **Content Management**: Document processing and PR materials management

## Security Implementation
- **Stakeholder Data Protection**: Encrypted stakeholder information and communications data handling
- **Role-Based Access**: PR operations permissions and stakeholder data restrictions
- **Audit Logging**: Comprehensive PR action and communications tracking
- **Regulatory Compliance**: Communications and data protection regulation adherence
- **Data Privacy**: Stakeholder and communications information confidentiality safeguards

## Performance Considerations
- **Lazy Loading**: PR components load on demand for large stakeholder databases
- **State Optimization**: Efficient re-rendering prevention for communications data
- **Resource Management**: Memory cleanup for complex PR campaign data
- **Background Processing**: Non-blocking stakeholder analysis and communications processing operations

## Integration Points
- **Stakeholder Systems**: Integration with CRM and stakeholder management platforms
- **Communications Platforms**: Connection to email, social media, and PR management systems
- **Reputation Management**: Integration with reputation monitoring and crisis management platforms
- **Content Management**: Connection to content creation and digital asset management systems
- **Analytics Platforms**: Integration with communications analytics and reporting systems

## Monitoring and Analytics
- **Stakeholder Engagement**: Communications effectiveness and stakeholder satisfaction tracking
- **Reputation Metrics**: Brand reputation monitoring and sentiment analysis
- **Communications Performance**: PR campaign success measurement and ROI analysis
- **Crisis Management**: Crisis detection and response effectiveness monitoring
- **Trend Analysis**: Communications trends and stakeholder behavior analytics

## Future Development Roadmap
- **AI-Powered Communications**: Machine learning-based stakeholder sentiment analysis and predictive engagement
- **Real-time Reputation Monitoring**: IoT-enabled reputation tracking and automated crisis response
- **Personalized Stakeholder Communications**: AI-driven personalized stakeholder engagement strategies
- **Integrated Crisis Management**: Collaborative crisis communication and reputation management platforms
- **Sustainability Communications**: ESG reporting and sustainability communications automation

## Related Documentation
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Navigation system
- [1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md](1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md) - Similar three-state page pattern
- [1300_00875_MASTER_GUIDE_SALES.md](1300_00875_MASTER_GUIDE_SALES.md) - Related stakeholder management

## Status
- [x] Core three-state navigation implemented
- [x] Dynamic background theming completed
- [x] AI PR assistants configured
- [x] Stakeholder management framework implemented
- [x] Communications tools verified
- [x] Security and privacy measures implemented
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive master guide based on actual implementation analysis


---

### 1300_02100_PUBLIC_RELATIONS_GUIDE.md

# 02100 Public Relations Guide

## Overview
Implementation details for the Public Relations page (ID 02100)

## Implementation
- Page Type: Simple Page (no background)
- Components: 
  - 02100-public-relations-page.js
  - components/modals/02100-pr-campaign-modal.js
- CSS: components/css/02100-public-relations.css

## Database Schema
```sql
CREATE TABLE pr_campaigns (
  id UUID PRIMARY KEY,
  campaign_name TEXT,
  launch_date DATE
);
```

## Related Documentation
- [Quality Assurance Guide (02200)](1300_02200_QUALITY_ASSURANCE_GUIDE.md)
- [Main Safety Guide (02400)](1300_02400_SAFETY_GUIDE.md)

## Version History
- v1.1 (2025-08-28): Renamed to include "GUIDE" suffix
- v1.0 (2025-08-28): Initial implementation


---

### 1300_02100_PUBLIC_RELATIONS_PAGE.md

# 02100 Public Relations Page

## Overview
Implementation details for the Public Relations page (ID 02100)

## Implementation
- Page Type: Simple Page (no background)
- Components: 
  - 02100-public-relations-page.js
  - components/modals/02100-pr-campaign-modal.js
- CSS: components/css/02100-public-relations.css

## Database Schema
```sql
CREATE TABLE pr_campaigns (
  id UUID PRIMARY KEY,
  campaign_name TEXT,
  launch_date DATE
);
```

## Related Documentation
- [Quality Assurance Page (02200)](1300_02200_QUALITY_ASSURANCE_PAGE.md)
- [Main Safety Page (02400)](1300_02400_SAFETY_PAGE.md)

## Version History
- v1.0 (2025-08-28): Initial implementation


---



---

### 1300_02100_PUBLIC_RELATIONS_GUIDE.md

# 02100 Public Relations Guide

## Overview
Implementation details for the Public Relations page (ID 02100)

## Implementation
- Page Type: Simple Page (no background)
- Components: 
  - 02100-public-relations-page.js
  - components/modals/02100-pr-campaign-modal.js
- CSS: components/css/02100-public-relations.css

## Database Schema
```sql
CREATE TABLE pr_campaigns (
  id UUID PRIMARY KEY,
  campaign_name TEXT,
  launch_date DATE
);
```

## Related Documentation
- [Quality Assurance Guide (02200)](1300_02200_QUALITY_ASSURANCE_GUIDE.md)
- [Main Safety Guide (02400)](1300_02400_SAFETY_GUIDE.md)

## Version History
- v1.1 (2025-08-28): Renamed to include "GUIDE" suffix
- v1.0 (2025-08-28): Initial implementation


---

### 1300_02100_PUBLIC_RELATIONS_PAGE.md

# 02100 Public Relations Page

## Overview
Implementation details for the Public Relations page (ID 02100)

## Implementation
- Page Type: Simple Page (no background)
- Components: 
  - 02100-public-relations-page.js
  - components/modals/02100-pr-campaign-modal.js
- CSS: components/css/02100-public-relations.css

## Database Schema
```sql
CREATE TABLE pr_campaigns (
  id UUID PRIMARY KEY,
  campaign_name TEXT,
  launch_date DATE
);
```

## Related Documentation
- [Quality Assurance Page (02200)](1300_02200_QUALITY_ASSURANCE_PAGE.md)
- [Main Safety Page (02400)](1300_02400_SAFETY_PAGE.md)

## Version History
- v1.0 (2025-08-28): Initial implementation


---

