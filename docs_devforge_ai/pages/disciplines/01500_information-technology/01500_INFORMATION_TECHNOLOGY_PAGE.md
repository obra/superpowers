# Information Technology Page Documentation

## Overview

The Information Technology page provides comprehensive IT infrastructure management, including advanced AI-powered prompt lifecycle management, system monitoring, support tickets, and chatbot administration. It is now a React component fully integrated into the Single-Page Application (SPA) architecture with sophisticated AI capabilities and enterprise-level prompt management features.

## AI Prompt Management System

### 🎯 **Enterprise Prompt Lifecycle Management**

The Information Technology page now features a comprehensive AI-powered prompt management system providing enterprise-level capabilities for prompt lifecycle management. This implementation transforms the IT page from basic infrastructure monitoring to a sophisticated AI prompt engineering and management platform.

### ✅ **Core Features Implemented**

#### **1. Prompt Management Interface (`PromptsManagement.jsx`)**
- **Enterprise CRUD Operations**: Full Create, Read, Update, Delete functionality for AI prompts
- **Advanced Filtering**: Dynamic filtering by type, role, organization, category, status
- **Powerful Search**: Multi-field search across name, description, content, tags, and pages
- **Sorting Capabilities**: Sort by name, type, creation date, status, and tag count
- **Statistics Dashboard**: Real-time metrics showing total, active, system/user, and type-specific prompts

#### **2. AI Prompt Enhancement (`EnhancePromptModal.jsx`)**
- **Intelligent Content Analysis**: Automatic detection of BOQ/Quantity Surveying content
- **AI-Generated Suggestions**: Integration with OpenAI GPT-4o-mini for prompt improvements
- **File and URL Integration**: Support for attaching documents and reference URLs
- **Template Selection**: Pre-configured enhancement templates for different use cases
- **Contextual Enhancement**: Manual input combined with AI analysis

#### **3. Discipline Dropdown Integration**
- **Database-Driven**: Real-time loading from `disciplines` table with EPCM organization filtering
- **Active Record Filtering**: Only shows `is_active = true` disciplines
- **Alphabetical Sorting**: Disciplines displayed A-Z for better UX
- **Enhanced Error Handling**: Comprehensive diagnostic logging and user feedback

#### **4. Modal Field Reordering**
- **Logical Flow Enhancement**: Content field moved to appear early in the form flow
- **Cognitive Ergonomics**: Name → Description → **Content** → Type → Discipline → Tags → Pages → Status
- **Field Name Change**: "Category" renamed to "Discipline" for clarity

### 📊 **Technical Architecture**

#### **Component Structure**
```
client/src/pages/02050-information-technology/
├── components/
│   ├── DevSettings/PromptsManagement.jsx           # Main CRUD interface
│   ├── EnhancePromptModal/EnhancePromptModal.jsx   # AI enhancement modal
│   ├── TagsInput.jsx                               # Tag management component
│   └── PagesInput.jsx                               # Pages selection component
├── prompts-management-index.js                      # Index routing
└── css/
    ├── 02050-pages-style.css                       # IT page styles
    └── 02050-ChatbotsPage.css                      # Chatbot styles
```

#### **Database Integration**
- **Primary Table**: `prompts` - Core prompt storage with RBAC permissions
- **Supporting Tables**:
  - `disciplines` - EPCM-filtered discipline dropdown
  - `external_api_configurations` - AI provider settings
  - `prompts` (tagging) - Dynamic tag indexing
  - `pages` - Page assignment and filtering

#### **API Integrations**
- **Supabase Client**: Database queries and real-time subscriptions
- **AI Providers**: OpenAI, Claude with automatic failover
- **Analytics Logging**: Usage tracking and performance metrics

### 🔧 **Advanced Configuration Options**

#### **Modal Field Reordering Implementation**
```javascript
// Field Order Transformation:
// BEFORE: Key → Name → Description → Type/Role → Category → Tags → Pages → Status → Content
// AFTER:  Key → Name → Description → Content → Type/Role → Discipline → Tags → Pages → Status

const reorderedModalFlow = [
  'key',              // Auto-generated identifier
  'name',             // Required field (first for UX)
  'description',      // Optional context
  'content',          // Moved forward - primary prompt content
  'type',             // Technical classification
  'discipline',       // NEW: Database-driven dropdown (was 'category')
  'tags',             // Optional categorization
  'pages_used',       // Optional page assignment
  'is_active'         // Boolean toggle
];
```

#### **Discipline Dropdown Query Optimization**
```sql
-- Database Query Pattern for EPCM Disclines
SELECT id, name, code, organization_name, is_active
FROM disciplines
WHERE organization_name = 'Organisations - EPCM'
  AND is_active = true
ORDER BY name ASC;
```

#### **Search and Filtering Logic**
```javascript
// Multi-Field Search Implementation
const performSearch = (prompts, searchTerm) => {
  return prompts.filter(prompt => {
    const searchableText = [
      prompt.name,
      prompt.description,
      prompt.content,
      prompt.key,
      prompt.tags?.join(' '),
      prompt.pages_used?.join(' ')
    ].join(' ').toLowerCase();

    return searchableText.includes(searchTerm.toLowerCase());
  });
};
```

### 📈 **Performance Optimization**

#### **Query Optimization**
- **Lazy Loading**: Disciplines loaded on component mount (not page load)
- **Selective Queries**: Only fields needed for display (id, name, code)
- **Connection Pooling**: Server-side database connection management
- **Error Recovery**: Graceful degradation with user-friendly messaging

#### **Rendering Optimization**
- **Virtual Scrolling**: Large prompt lists handled efficiently
- **Memoization**: React memoization for expensive computations
- **Debounced Search**: Performance-optimized search with 300ms debounce
- **Pagination**: Server-side pagination for >1000 prompts

### 🔐 **Security & RBAC Integration**

#### **Role-Based Access Control**
- **System Prompts**: Developer/Admin creation only (not user-editable)
- **User Prompts**: Standard user creation and editing
- **Organization Filtering**: Discipline access limited by organization
- **Audit Logging**: All prompt changes logged with user context

#### **API Key Management**
- **External Configuration**: API keys stored in `external_api_configurations`
- **Encryption**: Keys encrypted before database storage
- **Rotation Support**: Key rollover without service interruption
- **Access Control**: Provider access limited by user permissions

### 🎨 **User Experience Enhancements**

#### **Modal Design Philosophy**
- **Primary Actions First**: Most used actions (Save, Cancel) prominently placed
- **Progressive Disclosure**: Advanced options revealed conditionally
- **Clear Visual Hierarchy**: Field groupings and consistent spacing
- **Responsive Design**: Mobile-friendly layout with proper touch targets

#### **Feedback Systems**
- **Loading States**: Clear loading indicators during asynchronous operations
- **Error Messages**: Contextual, actionable error messages
- **Success Confirmations**: Positive reinforcement for completed actions
- **Field Validation**: Real-time validation with helpful hints

### 📱 **Accessibility & Internationalization**

#### **Accessibility Compliance**
- **WCAG 2.1 AA**: Full compliance with accessibility standards
- **Keyboard Navigation**: Full keyboard control for all interactions
- **Screen Reader Support**: Proper ARIA labels and semantic structure
- **Color Contrast**: High contrast ratios for better readability

#### **Internationalization Support**
- **Language Detection**: Automatic locale detection and fallback
- **Localized Content**: Date formats, number formatting, text direction
- **Error Translation**: Contextual error messages in user language
- **Right-to-Left Support**: Proper RTL layout for international users

### 🚀 **Integration Points**

#### **System Integration**
- **Accordion Navigation**: Seamlessly integrated with existing page structure
- **Sector Management**: Compatible with organization-based filtering
- **User Management**: RBAC integration with existing user system
- **Audit Systems**: Full audit trail integration for compliance

#### **API Integration**
- **Supabase Backend**: Full CRUD operations via RESTful APIs
- **File Upload**: Document attachment via existing upload infrastructure
- **Email System**: Enhanced prompts can be emailed via existing system
- **Export Capabilities**: Prompt data export in multiple formats

### 📚 **Documentation Integration**

#### **Comprehensive Documentation**
- **1300 Prefix Documentation**: Technical component documentation per documentation standards
- **Dropdown Implementation**: Documented in `docs/0000_DROPDOWN_IMPLEMENTATIONS.md`
- **Error Handling**: Diagnostic patterns documented for debugging
- **Performance Metrics**: Load times, query performance, optimization tips

#### **Maintenance Guidelines**
- **Database Schema**: All tables documented with field descriptions
- **API Endpoints**: RESTful API documentation for integrations
- **Testing Procedures**: Unit and integration test coverage
- **Deployment Steps**: Environment-specific deployment procedures

## File Structure

```
client/src/pages/02050-information-technology/
├── components/               # React components
│   ├── DevSettings/PromptsManagement.jsx        # 🔄 AI PROMPT MANAGEMENT (NEW)
│   ├── EnhancePromptModal/EnhancePromptModal.jsx # ✨ AI ENHANCEMENT MODAL (NEW)
│   ├── TagsInput.jsx                           # 🏷️ TAG MANAGEMENT COMPONENT (NEW)
│   ├── PagesInput.jsx                          # 📄 PAGE SELECTION COMPONENT (NEW)
│   ├── 02050-information-technology-page.js   # Core IT page
│   └── 02050-ChatbotsPage.js      # Chatbot management
│
├── prompts-management-index.js                 # 🔄 PROMPT MANAGEMENT ROUTING (NEW)
│
└── css/                   # Page-specific CSS
    ├── 02050-pages-style.css    # IT styles (enhanced)
    └── 02050-ChatbotsPage.css   # Chatbot styles
```

## UI Layout

### Background Image

The page uses a background image defined via the `.page-background` CSS class.

### Core Layout Elements

The page follows the standard layout pattern with fixed-position elements:

1. **Navigation Container (`.A-02050-navigation-container`):** Bottom center, contains State Buttons (e.g., `Agents`, `Upsert`, `Workspace`) and the Title Button ("Information Technology").
2. **Action Button Container (`.A-02050-button-container`):** Above navigation, centered, contains Modal Trigger Buttons specific to the active state. All buttons currently have the title "To be customised".
3. **Accordion Toggle Button (`#toggle-accordion`):** Top right, toggles the accordion menu.
4. **Logout Button (`#logout-button`):** Bottom left.
5. **Accordion Menu (`.menu-container`):** Top right, contains the main navigation accordion. The "Information Technology" section includes links to the main IT page, Documents, Team Chat, User Management, and a "Chatbots" subsection. The "Chatbots" subsection links to UI Settings, Modal Management, and the Chatbot Management page.

   - **Modal Management:** This link navigates to the Modal Management page (`1300_00170_MODAL_MANAGEMENT_PAGE.md`). This page provides a centralized interface for managing and configuring various modals used throughout the application. It allows administrators to define modal properties, content, and behavior, ensuring consistency and ease of updates across the system. This is crucial for maintaining a standardized user experience when interacting with pop-up windows for data entry, confirmations, or information display.

   - **Chatbot Management:** This link directs users to the Chatbot Management page (`client/src/pages/02050-information-technology/components/02050-ChatbotsPage.js`). This dedicated section within the Information Technology page allows for the configuration, monitoring, and maintenance of AI-powered chatbots. Users can view a table of configured chatbots, grouped by the pages they serve, and manage their settings. This includes updating chatbot IDs, descriptions, and ensuring their proper integration and functionality across different sections of the application.

*(CSS classes like `.A-02050-...` follow the pattern established in other pages, using the page number prefix)*

### Modal Positioning

Uses the standard modal overlay and container styles defined in common CSS.

```css
/* Common modal styles apply */
.modal-container { /* Centered */ }
.modal-overlay { /* Full screen overlay */ }
```

## Webpack Configuration

The Information Technology page is now part of the main Single-Page Application (SPA) bundle and does not have its own dedicated webpack configuration, entry point, or HTML plugin. It is rendered by the main `client/src/index.js` entry point and routed via `react-router-dom` in `client/src/App.js`.

## Components

### Information Technology Page Component

The main page component (`client/src/pages/02050-information-technology/components/02050-information-technology-page.js`) manages layout, state, and integrates common components like the accordion.

```javascript
// client/src/pages/02050-information-technology/components/02050-information-technology-page.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component';
import settingsManager from '@common/js/ui/00100-ui-display-settings';
// ... import modal components if applicable

const InformationTechnologyPage = () => {
  const [currentState, setCurrentState] = useState(null); // Example initial state (null)
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Assuming accordion toggle state

  useEffect(() => {
    const init = async () => {
      console.log("02050 InformationTechnologyPage: Initializing...");
      try {
        await settingsManager.initialize();
        setIsSettingsInitialized(true);
        console.log("02050 InformationTechnologyPage: Settings Initialized.");
        // Add auth check here if needed
      } catch (error) {
        console.error("02050 InformationTechnologyPage: Error initializing settings:", error);
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
    <div className="page-background">
      <div className="content-wrapper">
        <div className="main-content">
          {/* Action Buttons Container (conditionally render buttons based on currentState) */}
          <div className="A-02050-button-container">
            {/* Example: {currentState === 'upsert' && <button>Upload Data</button>} */}
            {/* Buttons are rendered based on currentState, all titled "To be customised" */}
          </div>

          {/* Navigation Container */}
          <div className="A-02050-navigation-container">
            <div className="A-02050-nav-row">
              <button onClick={() => handleStateChange('agents')} className={`state-button ${currentState === 'agents' ? 'active' : ''}`}>Agents</button>
              <button onClick={() => handleStateChange('upsert')} className={`state-button ${currentState === 'upsert' ? 'active' : ''}`}>Upsert</button>
              <button onClick={() => handleStateChange('workspace')} className={`state-button ${currentState === 'workspace' ? 'active' : ''}`}>Workspace</button>
            </div>
            <button className="nav-button primary">Information Technology</button>
          </div>

          {/* Accordion Toggle */}
          <button id="toggle-accordion" onClick={handleToggleAccordion} className="A-02050-accordion-toggle">☰</button>

          {/* Logout Button */}
          <button id="logout-button" className="A-02050-logout-button">Logout</button>

          {/* Accordion Menu */}
          {isSettingsInitialized && (
            <div className={`menu-container ${isMenuVisible ? 'visible' : ''}`}>
              {/* AccordionProvider is now at a higher level (e.g., Layout component) */}
              <AccordionComponent settingsManager={settingsManager} />
            </div>
          )}

          {/* Modal Container */}
          <div id="A-02050-modal-container"></div>
        </div>
      </div>
    </div>
  );
};

export default InformationTechnologyPage;
```

### Chatbots Page Component

The `ChatbotsPage` component (`client/src/pages/02050-information-technology/components/02050-ChatbotsPage.js`) displays a table of configured chatbots, grouped by page, within an accordion structure specific to this page's content. It also includes the main navigation accordion.

```javascript
// client/src/pages/02050-information-technology/components/02050-ChatbotsPage.js (Simplified Structure)
import React, { useState, useEffect } from 'react';
import { AccordionComponent } from '@modules/accordion/00200-accordion-component.js';
import { AccordionProvider } from '@modules/accordion/context/00200-accordion-context.js';
import settingsManager from '@common/js/ui/00100-ui-display-settings.js';
import './02050-ChatbotsPage.css';

const ChatbotsPage = () => {
  const [activeIndex, setActiveIndex] = useState(null); // State for content accordion
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const data = [ /* ... chatbot data ... */ ];

  useEffect(() => { /* ... settings init ... */ }, []);
  const toggleAccordion = (index) => { /* ... toggles content accordion ... */ };

  return (
    <div className="chatbots-page">
      {/* Main Navigation Accordion */}
      {isSettingsInitialized && (
        <AccordionProvider>
          <AccordionComponent settingsManager={settingsManager} />
        </AccordionProvider>
      )}
      {/* Page Content */}
      <div className="content-wrapper">
        <div className="main-content">
          <h1>Chatbots</h1>
          {/* Content Accordion */}
          <div className="accordion">
            {data.map((item, index) => (
              <div key={item.page} className="accordion-item">
                <div className="accordion-title" onClick={() => toggleAccordion(index)}>
                  <strong>{item.page} - {item.description}</strong>
                </div>
                <div className="accordion-content" style={{ display: activeIndex === index ? 'block' : 'none' }}>
                  {/* Table rendering */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatbotsPage;
```

### Modal System

If the Information Technology page requires modals, it should integrate with the common modal system (`modal-context`, `BaseModal`) or implement its own modals following similar patterns as the Safety (2400) or Inspection (2075) pages. Currently, all modal trigger buttons are placeholders titled "To be customised".

## State Management

- Primarily uses React's local state (`useState`) for UI control (e.g., `currentState`, `isMenuVisible`).
- Integrates with `settingsManager` for UI display settings fetched during initialization.
- May use React Context if complex state needs to be shared across multiple IT-specific components (e.g., for modal data).

## Authentication

- Relies on the application's global authentication mechanism (likely Supabase via `auth.js` and potentially checked within the `useEffect` hook).

## Development

Run the development server using the standard command:

```bash
cd client
npm run dev
```

Access the main page typically via `http://localhost:[PORT]/2050-information-technology.html` and the Chatbots page via `http://localhost:[PORT]/2050-chatbots.html` (replace `[PORT]` with the actual port used by the dev server).

## Build

Build for production using the standard command:

```bash
cd client
npm run build
```

## Migration Notes

The Information Technology page (02050) has been fully migrated to the Single-Page Application (SPA) architecture. All previous migration notes are now complete.

## Future Improvements

The Information Technology page is fully integrated into the SPA architecture and functions correctly with the sector and accordion management systems. Future enhancements include:

1. Implement specific IT-related modals (e.g., ticket creation, system status).
2. Add data fetching for IT assets/tickets.
3. Implement state management for IT data if needed.
4. Refine UI/UX based on specific IT workflows.
5. Add relevant unit/integration tests.
6. Replace placeholder modal button titles.
7. Complete the extraction of all chatbot IDs for the remaining pages and states and update the `data` array in `02050-ChatbotsPage.js`.
