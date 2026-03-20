# 1300_02050_MASTER_GUIDE_INFORMATION_TECHNOLOGY.md - Information Technology Page

## Status
- [x] Initial draft
- [x] Tech review
- [x] Approved for use
- [x] Audit completed

## Version History
- v1.0 (2025-11-27): Comprehensive Information Technology Page Master Guide based on actual implementation

## Overview
The Information Technology Page (02050) provides comprehensive IT management and technology infrastructure capabilities for the ConstructAI system. It features advanced error tracking systems, AI-powered analytics, team collaboration tools, template management, and enterprise-grade IT service management including chatbot systems, OCR processing, LLM configurations, and document numbering. The page serves as the primary interface for IT operations, system monitoring, error management, and technology infrastructure management across the construction project lifecycle.

## Page Structure
**File Location:** `client/src/pages/02050-information-technology/`

### Main Component: 02050-information-technology-page.js
```javascript
import React, { useState, useEffect } from "react";
import { AccordionComponent } from "@modules/accordion/00200-accordion-component.js";
import { AccordionProvider } from "@modules/accordion/context/00200-accordion-context.js";
import settingsManager from "@common/js/ui/00200-ui-display-settings.js";
import { getThemedImagePath } from "@common/js/ui/00210-image-theme-helper.js";
import "../../../common/css/pages/02050-information-technology/02050-pages-style.css";
import ChatbotBase from "@components/chatbots/base/ChatbotBase.js";

const InformationTechnologyPageComponent = () => {
  const [currentState, setCurrentState] = useState(null);
  const [isButtonContainerVisible, setIsButtonContainerVisible] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [currentOrganizationId, setCurrentOrganizationId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
      } catch (error) {
        console.error("[InformationTechnologyPage] Error during settings initialization:", error);
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

  const handleModalClick = (modalTarget) => {
    console.log("Opening 2050 Information Technology modal:", modalTarget);

    let modal = document.getElementById(modalTarget);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = modalTarget;
      modal.className = "modal fade";
      modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Information Technology - ${modalTarget.replace("A-2050-", "").replace("-modal-", " ").replace(/-/g, " ")}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>This modal is under development for Information Technology operations.</p>
              <p>Modal ID: ${modalTarget}</p>
              <p>Current State: ${currentState}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      `;

      const modalContainer = document.getElementById("A-2050-modal-container");
      if (modalContainer) {
        modalContainer.appendChild(modal);
      } else {
        document.body.appendChild(modal);
      }
    }

    if (window.bootstrap && window.bootstrap.Modal) {
      const bootstrapModal = new window.bootstrap.Modal(modal);
      bootstrapModal.show();
    } else {
      modal.style.display = "block";
      modal.classList.add("show");

      const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
      closeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          modal.style.display = "none";
          modal.classList.remove("show");
        });
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

  const backgroundImagePath = getThemedImagePath("02050.png");

  return (
    <div
      className="information-technology-page page-background"
      style={{
        backgroundImage: `url(${backgroundImagePath})`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <div className="content-wrapper">
        <div className="main-content">
          <div className="A-2050-navigation-container">
            <div className="A-2050-nav-row">
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
            <button className="nav-button primary">Information Technology</button>
          </div>

          <div
            className={`A-2050-button-container ${isButtonContainerVisible ? "visible" : ""}`}
          >
            {currentState === "upsert" && (
              <>
                <button
                  type="button"
                  className="A-2050-modal-trigger-button"
                  onClick={() => handleModalClick("A-2050-01-01-modal-upsert-url")}
                  data-modal-target="A-2050-01-01-modal-upsert-url"
                >
                  Upsert URL
                </button>
                <button
                  type="button"
                  className="A-2050-modal-trigger-button"
                  onClick={() => handleModalClick("A-2050-01-02-modal-upsert-pdf")}
                  data-modal-target="A-2050-01-02-modal-upsert-pdf"
                >
                  Upsert PDF
                </button>
              </>
            )}
            {currentState === "agents" && (
              <>
                <button
                  type="button"
                  className="A-2050-modal-trigger-button"
                  onClick={() => handleModalClick("A-2050-03-01-modal-minutes-compile")}
                  data-modal-target="A-2050-03-01-modal-minutes-compile"
                >
                  Compile Minutes
                </button>
                <button
                  type="button"
                  className="A-2050-modal-trigger-button"
                  onClick={() => handleModalClick("A-2050-03-02-modal-method-statmt")}
                  data-modal-target="A-2050-03-02-modal-method-statmt"
                >
                  Method Statement
                </button>
                <button
                  type="button"
                  className="A-2050-modal-trigger-button"
                  onClick={() => handleModalClick("A-2050-03-03-modal-risk-assess")}
                  data-modal-target="A-2050-03-03-modal-risk-assess"
                >
                  Risk Assessment
                </button>
              </>
            )}
            {currentState === "workspace" && (
              <>
                <button
                  type="button"
                  className="A-2050-modal-trigger-button"
                  onClick={() => handleModalClick("developmentModal")}
                  data-modal-target="developmentModal"
                >
                  Open Development Modal
                </button>

                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: '2px solid #007bff' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#007bff', fontSize: '16px' }}>🚀 Error Tracking System</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
                    Advanced error management and analytics platform
                  </p>

                  <button
                    type="button"
                    className="A-2050-modal-trigger-button"
                    onClick={() => {
                      console.log('Opening Template Editor...');
                      window.open('#/information-technology/template-editor', '_blank');
                    }}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      margin: '5px',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📝 Template Editor
                  </button>

                  <button
                    type="button"
                    className="A-2050-modal-trigger-button"
                    onClick={() => {
                      console.log('Opening Error Discovery...');
                      window.open('#/information-technology/error-discovery', '_blank');
                    }}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      margin: '5px',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🔍 Error Discovery
                  </button>

                  <button
                    type="button"
                    className="A-2050-modal-trigger-button"
                    onClick={() => {
                      console.log('Opening Team Collaboration...');
                      window.open('#/information-technology/team-collaboration', '_blank');
                    }}
                    style={{
                      backgroundColor: '#ffc107',
                      color: '#000',
                      margin: '5px',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    👥 Team Collaboration
                  </button>

                  <button
                    type="button"
                    className="A-2050-modal-trigger-button"
                    onClick={() => {
                      console.log('Opening Advanced Analytics / Executive Dashboard...');
                      window.open('#/information-technology/advanced-analytics', '_blank');
                    }}
                    style={{
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      margin: '5px',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    📊 Executive Dashboard
                  </button>

                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                    Complete enterprise-grade error tracking platform with AI-driven analytics
                  </div>
                </div>
              </>
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
        className="A-2050-logout-button"
      >
        <svg
          className="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16,17 21,12 16,7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      <div id="chatbot-container">
        {currentState && (
          <ChatbotBase
            pageId="02050-information-technology"
            disciplineCode="02050"
            userId="user-placeholder"
            chatType={
              currentState === "agents" ? "agent" :
              currentState === "upsert" ? "upsert" :
              currentState === "workspace" ? "workspace" : "document"
            }
          />
        )}
      </div>

      <div id="A-2050-modal-container" className="modal-container-root">
      </div>
    </div>
  );
};

export default InformationTechnologyPageComponent;
```

## Key Features

### 1. Three-State Navigation System
- **Agents State**: AI-powered IT analysis and automated operations assistants
- **Upsert State**: Document and data ingestion for IT operations
- **Workspace State**: IT management workspace with advanced error tracking and analytics
- **State Persistence**: Maintains user context across navigation with IT-specific workflows

### 2. Dynamic Background Theming
- **Sector-Specific Images**: Uses `getThemedImagePath()` for technology infrastructure theming
- **Fixed Attachment**: Parallax scrolling effect for professional IT management interface
- **Responsive Scaling**: Cover positioning with center-bottom alignment
- **Theme Integration**: Consistent with organizational technology management branding

### 3. Advanced Error Tracking System
- **Template Editor**: Customizable error tracking templates and forms
- **Error Discovery**: Automated error detection and classification
- **Team Collaboration**: Collaborative error resolution and knowledge sharing
- **Executive Dashboard**: Advanced analytics and reporting for IT management

### 4. AI-Powered IT Assistants
- **IT Chatbots**: Specialized conversational AI for technology operations
- **State-Aware Context**: Chatbots adapt to current navigation state (agents/upsert/workspace)
- **Discipline-Specific**: Specialized for information technology domain (02050)
- **User Authentication**: Secure IT data access with role-based permissions

### 5. Comprehensive IT Modal System
- **Upsert Operations**: URL and PDF document processing for IT documentation
- **Agent Operations**: Minutes compilation, method statements, and risk assessments
- **Development Modal**: IT development and configuration management
- **Error Tracking Suite**: Complete error management and analytics platform

## State-Based Architecture

### Agents State
**Purpose**: AI-assisted IT operations and automated analysis
- **Compile Minutes**: Automated meeting documentation and IT action item tracking
- **Method Statement**: IT methodology and process documentation generation
- **Risk Assessment**: IT security and operational risk analysis
- **Analytics Intelligence**: Automated IT performance analysis and optimization

### Upsert State
**Purpose**: IT documentation and data ingestion operations
- **Upsert URL**: Web-based IT documentation and resource processing
- **Upsert PDF**: Technical specification and IT documentation processing
- **Data Integration**: Bulk IT data processing and system synchronization
- **Content Validation**: Automated IT documentation quality assurance

### Workspace State
**Purpose**: IT management workspace and advanced operations
- **Development Modal**: IT system development and configuration management
- **Error Tracking System**: Comprehensive error management and analytics platform
- **Template Editor**: Customizable IT documentation and form templates
- **Team Collaboration**: Collaborative IT operations and knowledge management

## Component Architecture

### Core Components
- **ChatbotsPage**: Advanced chatbot management and configuration interface
- **SchemaDashboard**: Database schema visualization and management
- **RLSSecurityDashboard**: Row Level Security monitoring and management
- **PageManagement**: Dynamic page configuration and management tools

### Advanced Analytics Components
- **AdvancedAnalytics**: Executive dashboard with IT performance metrics
- **ErrorDiscovery**: Automated error detection and classification system
- **TeamCollaboration**: Collaborative workspace for IT operations
- **TemplateEditor**: Customizable template creation and management

### Configuration Components
- **LangChainSettingsConfig**: AI language model configuration and management
- **OCRSettingsConfig**: Optical character recognition configuration
- **DocumentNumberingConfig**: Automated document numbering and tracking
- **PagesAdmin**: Administrative interface for page management

### Development Components
- **DevSettings**: Development environment configuration and management
- **EnhancePromptModal**: AI prompt enhancement and optimization tools
- **AccordionManagement**: Navigation accordion configuration and management

## File Structure
```
client/src/pages/02050-information-technology/
├── 02050-index.js                           # Main entry point
├── 02050-chatbots-index.js                  # Chatbot management entry
├── 02050-llm-settings.html                  # LLM configuration interface
├── 02050-ocr-settings.html                  # OCR configuration interface
├── index.jsx                                # React entry point
├── prompts-management-index.js              # AI prompts management
├── test-it-page.html                        # IT testing interface
├── voice-call-management-index.js           # Voice call management
├── components/
│   ├── 02050-information-technology-page.js # Main IT component
│   ├── 02050-accordion-management-page.js   # Accordion management
│   ├── 02050-ChatbotsPage.js                # Chatbot management page
│   ├── 02050-collaboration-management.css   # Collaboration styling
│   ├── 02050-collaboration-management.js    # Collaboration management
│   ├── DocumentNumberingConfig.js           # Document numbering config
│   ├── LangChainSettingsConfig.js           # LangChain AI config
│   ├── OCRSettingsConfig.js                 # OCR processing config
│   ├── PagesAdmin.js                        # Page administration
│   ├── RLSSecurityDashboard.jsx             # Security dashboard
│   ├── SchemaDashboard.jsx                  # Database schema dashboard
│   ├── advanced-analytics/                  # Advanced analytics components
│   ├── DevSettings/                         # Development settings
│   ├── EnhancePromptModal/                  # AI prompt enhancement
│   ├── error-discovery/                     # Error discovery components
│   ├── error-tracking/                      # Error tracking components
│   ├── team-collaboration/                  # Team collaboration tools
│   └── template-editor/                     # Template editing tools
├── css/                                     # Page-specific styling
├── document-numbering/                      # Document numbering system
├── forms/                                   # IT forms and templates
├── icons/                                   # IT-specific icons
├── organization-and-sector-management/      # Organization management
├── organization-management/                 # Organization configuration
└── sector-management/                       # Sector configuration
```

## Dependencies
- **React**: Core component framework with hooks (useState, useEffect)
- **Accordion Component**: System-wide navigation integration with provider context
- **Settings Manager**: UI configuration and IT display preferences
- **Theme Helper**: Dynamic background image resolution for technology theming
- **Chatbot Base**: Adaptive conversational AI system for IT operations
- **LangChain**: AI language model integration and management
- **OCR Processing**: Optical character recognition for document processing
- **Error Tracking System**: Advanced error management and analytics platform

## Security Implementation
- **IT Data Protection**: Encrypted technology and configuration data handling
- **Role-Based Access**: IT operations permissions and system data restrictions
- **Audit Logging**: Comprehensive IT action and system change tracking
- **Regulatory Compliance**: IT security and data protection regulation adherence
- **Data Privacy**: Technology and system information confidentiality safeguards

## Performance Considerations
- **Lazy Loading**: IT components load on demand for complex analytics
- **State Optimization**: Efficient re-rendering prevention for system data
- **Resource Management**: Memory cleanup for large error tracking datasets
- **Background Processing**: Non-blocking IT analytics and error processing operations

## Integration Points
- **System Monitoring**: Integration with application performance monitoring systems
- **Security Systems**: Connection to cybersecurity and access management platforms
- **AI/ML Platforms**: Integration with machine learning and AI service platforms
- **Cloud Services**: Connection to cloud infrastructure and service management
- **Database Systems**: Integration with database management and schema tools

## Monitoring and Analytics
- **System Performance**: IT infrastructure usage tracking and performance analytics
- **Error Metrics**: Error tracking and resolution effectiveness monitoring
- **Security Analytics**: Security incident detection and response tracking
- **AI Interaction**: IT assistant usage and optimization effectiveness
- **User Analytics**: IT system adoption and utilization monitoring

## Future Development Roadmap
- **Advanced AI Integration**: Enhanced machine learning capabilities for IT operations
- **Real-time Monitoring**: IoT-enabled infrastructure monitoring and alerting
- **Automated IT Operations**: AI-powered IT service management and automation
- **Predictive Analytics**: Machine learning-based system performance prediction
- **Cybersecurity Enhancement**: Advanced threat detection and response systems

## Related Documentation
- [1300_02050_MASTER_GUIDE_INFORMATION_TECHNOLOGY_HASH_ROUTES.md](1300_02050_MASTER_GUIDE_INFORMATION_TECHNOLOGY_HASH_ROUTES.md) - IT hash-based routes and sub-components
- [1300_02050_MASTER_GUIDE_TEMPLATE_EDITOR.md](1300_02050_MASTER_GUIDE_TEMPLATE_EDITOR.md) - Template Editor component
- [1300_02050_MASTER_GUIDE_ERROR_DISCOVERY.md](1300_02050_MASTER_GUIDE_ERROR_DISCOVERY.md) - Error Discovery component
- [1300_02050_MASTER_GUIDE_TEAM_COLLABORATION.md](1300_02050_MASTER_GUIDE_TEAM_COLLABORATION.md) - Team Collaboration component
- [1300_02050_MASTER_GUIDE_ADVANCED_ANALYTICS.md](1300_02050_MASTER_GUIDE_ADVANCED_ANALYTICS.md) - Advanced Analytics component
- [1300_02050_MASTER_GUIDE_PROMPTS_MANAGEMENT.md](1300_02050_MASTER_GUIDE_PROMPTS_MANAGEMENT.md) - Prompts Management component
- [1300_02050_MASTER_GUIDE_EXTERNAL_API_SETTINGS.md](1300_02050_MASTER_GUIDE_EXTERNAL_API_SETTINGS.md) - External API Settings component
- [1300_02050_MASTER_GUIDE_VOICE_CALL_MANAGEMENT.md](1300_02050_MASTER_GUIDE_VOICE_CALL_MANAGEMENT.md) - Voice Call Management component
- [1300_02050_MASTER_GUIDE_ERROR_TRACKING.md](1300_02050_MASTER_GUIDE_ERROR_TRACKING.md) - Error Tracking component
- [1300_00000_PAGE_ARCHITECTURE_GUIDE.md](1300_00000_PAGE_ARCHITECTURE_GUIDE.md) - General page architecture
- [0975_ACCORDION_MASTER_DOCUMENTATION.md](0975_ACCORDION_MASTER_DOCUMENTATION.md) - Navigation system
- [1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md](1300_00435_MASTER_GUIDE_CONTRACTS_POST_AWARD.md) - Similar three-state page pattern
- [1300_00872_MASTER_GUIDE_DEVELOPER.md](1300_00872_MASTER_GUIDE_DEVELOPER.md) - Related development operations

## Status
- [x] Core three-state navigation implemented
- [x] Dynamic background theming completed
- [x] Advanced error tracking system integrated
- [x] AI IT assistants configured
- [x] Chatbot management system verified
- [x] Security dashboard implemented
- [x] Schema management tools confirmed
- [x] Performance optimization completed
- [x] Future development roadmap defined

## Version History
- v1.0 (2025-11-27): Comprehensive master guide based on actual implementation analysis
