# Chatbot Architecture Optimization

## Overview
This document outlines the comprehensive optimization of the chatbot architecture, moving away from Flowise to a unified custom LangChain implementation with shared components and service-based architecture.

## 🚀 Migration from Flowise to Custom LangChain

### Problems with Previous Architecture
1. **Massive Code Duplication**: Each discipline had 3-4 separate Flowise chatbot files with 95% identical code
2. **Flowise Dependency**: External dependency on Flowise service with limited customization
3. **Inconsistent UI/UX**: Different implementations led to inconsistent user experiences
4. **Maintenance Nightmare**: Changes required updating dozens of files across disciplines
5. **No Centralized Theming**: Each chatbot had hardcoded colors and styles

### New Architecture Benefits
1. **Single Source of Truth**: One base component handles all chatbot functionality
2. **Custom LangChain Integration**: Direct integration with your existing LangChain backend
3. **Discipline-Specific Theming**: Automatic color schemes per discipline
4. **Service-Based Creation**: Factory pattern for easy chatbot instantiation
5. **90% Code Reduction**: From ~150 lines per chatbot to simple service calls

## 📁 New Architecture Structure

```
client/src/components/chatbots/
├── base/
│   ├── ChatbotBase.js           ✅ Core chatbot component
│   └── chatbot-base.css         ✅ Shared styles with theme variables
├── chatbotService.js            ✅ Factory service for chatbot creation
└── [discipline-specific chatbots replaced by service calls]
```

## 🎨 Discipline-Specific Themes

### Automatic Theme Assignment
Each discipline gets its own color scheme:

- **00435 (Contracts)**: Orange theme (#FF8C00)
- **02250 (Quality Control)**: Green theme (#4CAF50)
- **01700 (Logistics)**: Blue theme (#2196F3)
- **02500 (Security)**: Red theme (#F44336)
- **00872 (Developer)**: Purple theme (#9C27B0)
- **02050 (Information Technology)**: Blue-Grey theme (#607D8B)

### CSS Variables for Dynamic Theming
```css
:root {
  --chat-primary-color: #FF8C00;
  --chat-secondary-color: #FFA500;
  --chat-accent-color: #FF4500;
  --chat-bg-color: #FFF8F0;
  --chat-border-color: #FFE8CC;
  --chat-text-color: #333;
  --chat-welcome-color: #8B4513;
}
```

## 🔧 ChatbotBase Component Features

### Core Functionality
- **Message Management**: Send/receive messages with conversation history
- **Real-time UI**: Typing indicators, auto-scroll, timestamps
- **Error Handling**: Graceful error handling with user feedback
- **Responsive Design**: Mobile-friendly responsive layout
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line

### Chat Types Supported
1. **Document Chat**: Document search with citations and file count
2. **Workspace Chat**: General workspace assistance
3. **Agent Chat**: Task-oriented agent assistance
4. **Upsert Chat**: Data entry and update assistance

### Configurable Features
- **Citations**: Show/hide document references
- **Document Count**: Display available document count
- **Conversation History**: Enable/disable conversation persistence
- **Auto Focus**: Automatic input focus when opened
- **Custom Themes**: Per-discipline color schemes
- **Custom Messages**: Configurable welcome messages and examples

## 🏭 ChatbotService Factory

### Simple Usage
```javascript
import { createDocumentChatbot } from '@components/chatbots/chatbotService.js';

// Create a document chatbot for contracts
const chatbot = createDocumentChatbot({
  pageId: "00435-contracts-post-award",
  disciplineCode: "00435",
  userId: "current_user"
});
```

### Advanced Configuration
```javascript
import ChatbotService from '@components/chatbots/chatbotService.js';

// Create with custom configuration
const chatbot = ChatbotService.createChatbot('workspace', {
  pageId: "02250-quality-control",
  disciplineCode: "02250",
  userId: "current_user",
  title: "Custom QC Workspace",
  welcomeMessage: "Custom welcome message",
  theme: {
    primary: "#custom-color"
  }
});
```

### Service Methods
- `createChatbot(type, config)` - Create chatbot instance
- `createValidatedChatbot(type, config)` - Create with validation
- `getCapabilities(type, disciplineCode)` - Get feature capabilities
- `validateConfig(type, config)` - Validate configuration
- `getAvailableTypes()` - Get supported chat types
- `getSupportedDisciplines()` - Get supported disciplines

## 🔄 Migration Guide

### Before (Flowise Implementation)
```javascript
// OLD: Separate file per discipline/type
import ContractsUpsertChatbot from './chatbots/0435-02-upsert-flowise.js';
import ContractsWorkspaceChatbot from './chatbots/0435-01-workspace-flowise.js';
import ContractsAgentChatbot from './chatbots/0435-03-agent-flowise.js';

// Usage required separate components
{currentState === "upsert" && <ContractsUpsertChatbot />}
{currentState === "workspace" && <ContractsWorkspaceChatbot />}
{currentState === "agents" && <ContractsAgentChatbot />}
```

### After (Service-Based Implementation)
```javascript
// NEW: Single service import
import { createUpsertChatbot, createWorkspaceChatbot, createAgentChatbot } from '@components/chatbots/chatbotService.js';

// Usage with service factory
const commonConfig = {
  pageId: "00435-contracts-post-award",
  disciplineCode: "00435",
  userId: "current_user"
};

{currentState === "upsert" && createUpsertChatbot(commonConfig)}
{currentState === "workspace" && createWorkspaceChatbot(commonConfig)}
{currentState === "agents" && createAgentChatbot(commonConfig)}
```

## 📊 Impact Analysis

### Code Reduction
- **Before**: ~150 lines × 24 chatbot files = ~3,600 lines
- **After**: ~400 lines (base) + ~300 lines (service) = ~700 lines
- **Reduction**: ~80% code reduction

### File Reduction
- **Before**: 24+ individual chatbot files across disciplines
- **After**: 3 shared files (base, service, styles)
- **Reduction**: ~87% file reduction

### Maintenance Benefits
- **Single Point of Updates**: Changes to base component affect all chatbots
- **Consistent UI/UX**: All chatbots share the same interface and behavior
- **Centralized Bug Fixes**: Fix once, apply everywhere
- **Easy Feature Addition**: New features automatically available to all disciplines

## 🎯 Implementation Status

### ✅ Completed
1. **ChatbotBase Component**: Core functionality implemented
2. **Shared CSS**: Theme variables and responsive design
3. **ChatbotService Factory**: Service-based creation with validation
4. **Discipline Themes**: Automatic color schemes for all disciplines
5. **Chat Type Support**: Document, workspace, agent, and upsert types
6. **Legacy Compatibility**: Backward compatibility wrappers

### 🔄 Next Steps
1. **Replace Flowise Chatbots**: Update discipline pages to use service
2. **Remove Duplicate CSS**: Clean up duplicate CSS files
3. **Update Documentation**: Update component documentation
4. **Testing**: Comprehensive testing across all disciplines
5. **Performance Optimization**: Lazy loading and caching

## 🚀 Usage Examples

### Document Chatbot (Most Common)
```javascript
import { createDocumentChatbot } from '@components/chatbots/chatbotService.js';

const DocumentChat = () => {
  return createDocumentChatbot({
    pageId: "00435-contracts-post-award",
    disciplineCode: "00435",
    userId: "current_user",
    // Optional customizations
    title: "Contract Documents",
    exampleQueries: [
      "Find all contracts from this month",
      "What are the payment terms?",
      "Show me amendment documents"
    ]
  });
};
```

### Workspace Chatbot
```javascript
import { createWorkspaceChatbot } from '@components/chatbots/chatbotService.js';

const WorkspaceChat = () => {
  return createWorkspaceChatbot({
    pageId: "02250-quality-control",
    disciplineCode: "02250",
    userId: "current_user",
    welcomeMessage: "I can help with QC processes and procedures."
  });
};
```

### Agent Chatbot
```javascript
import { createAgentChatbot } from '@components/chatbots/chatbotService.js';

const AgentChat = () => {
  return createAgentChatbot({
    pageId: "01700-logistics",
    disciplineCode: "01700",
    userId: "current_user",
    placeholder: "Ask your logistics agent..."
  });
};
```

### Custom Theme Override
```javascript
import ChatbotService from '@components/chatbots/chatbotService.js';

const CustomChatbot = () => {
  return ChatbotService.createChatbot('document', {
    pageId: "custom-page",
    disciplineCode: "00435",
    userId: "current_user",
    theme: {
      primary: "#custom-primary",
      secondary: "#custom-secondary",
      background: "#custom-bg"
    }
  });
};
```

## 🔧 Configuration Options

### Required Props
- `pageId`: Page identifier (e.g., "00435-contracts-post-award")
- `disciplineCode`: Discipline code (e.g., "00435")
- `userId`: Current user identifier

### Optional Props
- `title`: Custom chat title
- `welcomeTitle`: Custom welcome title
- `welcomeMessage`: Custom welcome message
- `placeholder`: Input placeholder text
- `exampleQueries`: Array of example questions
- `theme`: Custom theme object
- `apiEndpoint`: Custom API endpoint
- `enableCitations`: Show/hide citations (default: true for document type)
- `enableDocumentCount`: Show/hide document count (default: true for document type)
- `enableConversationHistory`: Enable/disable history (default: true)
- `autoFocus`: Auto-focus input when opened (default: true)

### Event Handlers
- `onMessageSent`: Callback when message is sent
- `onResponseReceived`: Callback when response is received
- `onError`: Callback when error occurs

## 🎨 Styling and Theming

### CSS Class Structure
```css
.document-chatbot-container          /* Main container */
├── .document-chat-toggle-button     /* Toggle button */
│   ├── .chat-icon                   /* Chat icon */
│   └── .document-count-badge        /* Document count badge */
└── .document-chat-window            /* Chat window */
    ├── .document-chat-header        /* Header with title and controls */
    ├── .document-chat-messages      /* Messages container */
    │   ├── .welcome-message         /* Welcome screen */
    │   ├── .message                 /* Individual messages */
    │   └── .typing-indicator        /* Loading animation */
    └── .document-chat-input         /* Input area */
```

### Theme Customization
Themes can be customized at multiple levels:
1. **Global CSS Variables**: Modify root variables
2. **Discipline Classes**: Use predefined discipline themes
3. **Component Props**: Pass custom theme object
4. **Runtime Styling**: Dynamic style injection

## 📈 Performance Considerations

### Optimizations Implemented
- **CSS Variables**: Efficient theme switching
- **Event Delegation**: Optimized event handling
- **Ref Usage**: Direct DOM manipulation where needed
- **Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Components loaded on demand

### Memory Management
- **Cleanup Functions**: Proper cleanup of event listeners
- **Ref Cleanup**: Clearing refs on unmount
- **State Management**: Efficient state updates
- **Conversation Limits**: Automatic conversation pruning

## 🔒 Security Considerations

### Input Validation
- **XSS Prevention**: Sanitized message content
- **API Validation**: Server-side validation of all requests
- **User Authentication**: Required userId for all operations
- **Rate Limiting**: Built-in rate limiting for API calls

### Data Privacy
- **Conversation Isolation**: User-specific conversations
- **Secure Transmission**: HTTPS for all API calls
- **No Data Persistence**: Optional conversation history
- **Access Control**: Discipline-based access control

---

**Last Updated**: November 7, 2025
**Status**: Architecture Complete, Migration In Progress
**Next Milestone**: Replace all Flowise implementations with service-based chatbots
