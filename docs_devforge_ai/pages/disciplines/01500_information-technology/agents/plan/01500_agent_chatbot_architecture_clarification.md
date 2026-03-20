# 00435 Contracts Post-Award - Agent Chatbot Architecture Clarification

## Overview

This document clarifies the specialized agent chatbot architecture for the 00435 Contracts Post-Award page, explaining how chatbots are determined by modal buttons in the agent state versus standalone chatbots for upsert and workspace states.

## Current Page Structure Analysis

### State-Based Modal System

**File Location**: `client/src/pages/00435-contracts-post-award/components/00435-contracts-post-award-page.js`

The page operates with **three main states**, each displaying different modal buttons:

#### 1. **Agents State** (`currentState === "agents"`)
**Modal Buttons Available**:
```javascript
// Minutes Compilation Modal Button
<button onClick={() => handleOpenModal('MinutesCompileModal')}>
  📋 Minutes Compilation
</button>

// Correspondence Reply Modal Button  
<button onClick={() => handleOpenModal('CorrespondenceReplyModal')}>
  ✉️ Correspondence Reply
</button>
```

#### 2. **Upserts State** (`currentState === "upserts"`)
**Modal Buttons Available**:
```javascript
// Upload Files Modal Button
<button onClick={() => handleOpenModal('UpsertFileModal')}>
  📄 Upload Files
</button>

// Import from URL Modal Button
<button onClick={() => handleOpenModal('UpsertUrlModal')}>
  🌐 Import from URL
</button>

// Cloud Import Modal Button
<button onClick={() => handleOpenModal('UpsertCloudModal')}>
  ☁️ Cloud Import
</button>

// Advanced/Bulk Processing Modal Button
<button onClick={() => handleOpenModal('UpsertUnstructuredModal')}>
  ⚙️ Advanced/Bulk
</button>
```

#### 3. **Workspace State** (`currentState === "workspace"`)
**Modal Buttons Available**:
```javascript
// Contractor Setup Modal Button
<button onClick={() => handleOpenModal('ContractSetupModal')}>
  📝 Contractor Setup
</button>

// Working Contractor Details Modal Button
<button onClick={() => handleOpenModal('WorkingContractorDetailsModal')}>
  👷 Working Contractor
</button>
```

---

## Proposed Chatbot Architecture

### **Agent State**: Modal-Driven Specialized Chatbots

**Concept**: Each modal button in the agent state should trigger a **specialized agent chatbot** tailored to that specific task.

#### **Agent Chatbot Types** (Determined by Modal Button Context):

##### 1. **Contract Review Agent** 
**Triggered By**: Minutes Compilation Modal Button
**Specialization**: Contract analysis, meeting minutes, documentation review
**ChatType**: `agent-contract-review`
**Configuration**:
```javascript
{
  title: "Contract Review Agent",
  welcomeMessage: "I'll help you compile meeting minutes and review contract documentation. What would you like me to analyze?",
  exampleQueries: [
    "Help me compile minutes from the contract review meeting",
    "What are the key action items from today's discussion?",
    "Analyze this contract amendment for compliance issues"
  ],
  theme: {
    primary: "#FF6B35", // Orange-red for urgency/review
    secondary: "#FF8C42"
  }
}
```

##### 2. **Correspondence Agent**
**Triggered By**: Correspondence Reply Modal Button  
**Specialization**: Communication drafting, reply generation, stakeholder correspondence
**ChatType**: `agent-correspondence`
**Configuration**:
```javascript
{
  title: "Correspondence Agent", 
  welcomeMessage: "I'll help you draft professional correspondence and replies. What communication do you need assistance with?",
  exampleQueries: [
    "Draft a response to the contractor's delay notification",
    "Help me write a formal contract amendment request", 
    "Create a status update email for stakeholders"
  ],
  theme: {
    primary: "#4ECDC4", // Teal for communication
    secondary: "#45B7B8"
  }
}
```

#### **Implementation Architecture for Agent State**:
```javascript
// Agent state would need to track which modal button was last clicked
const [activeAgent, setActiveAgent] = useState(null);

// Modal button handlers would set the active agent
const handleOpenModal = (modalId, modalProps = {}) => {
  // Set active agent based on modal type
  if (modalId === 'MinutesCompileModal') {
    setActiveAgent('contract-review');
  } else if (modalId === 'CorrespondenceReplyModal') {
    setActiveAgent('correspondence');
  }
  
  // Open the modal
  openModal(modalId, modalProps);
};

// Chatbot rendering for agent state
{currentState === 'agents' && activeAgent && (
  <ChatbotBase
    pageId="0435-contracts-post-award"
    disciplineCode="00435"
    userId="demo-user-001"
    chatType={`agent-${activeAgent}`}
    title={getAgentConfig(activeAgent).title}
    welcomeMessage={getAgentConfig(activeAgent).welcomeMessage}
    exampleQueries={getAgentConfig(activeAgent).exampleQueries}
    theme={getAgentConfig(activeAgent).theme}
    enableCitations={true}
  />
)}
```

### **Upsert State**: Document Processing Chatbot

**Purpose**: Unified chatbot for all document upload, import, and processing tasks
**ChatType**: `upsert`
**Specialization**: File processing, data extraction, document management

**Configuration**:
```javascript
{
  title: "Document Processing Assistant",
  welcomeMessage: "I'll help you upload, process, and manage your contract documents. What documents would you like to work with?",
  exampleQueries: [
    "Help me upload multiple contract files",
    "Extract key terms from this PDF document", 
    "Process this contract amendment for approval",
    "Import documents from our cloud storage"
  ],
  theme: {
    primary: "#A8E6CF", // Green for processing/success
    secondary: "#88D8A3" 
  },
  enableDocumentCount: true, // Show document counts for processing
  enableFileUpload: true     // Special upsert features
}
```

### **Workspace State**: Contractor Management Chatbot

**Purpose**: Specialized chatbot for contractor setup, management, and workspace organization  
**ChatType**: `workspace`
**Specialization**: Contractor relations, workspace setup, project management

**Configuration**:
```javascript
{
  title: "Workspace Management Assistant", 
  welcomeMessage: "I'll help you manage contractors, set up workspaces, and organize your project. How can I assist you today?",
  exampleQueries: [
    "Help me set up a new contractor profile",
    "What's the status of our active contractors?", 
    "Create a workspace for the new project phase",
    "Generate a contractor performance report"
  ],
  theme: {
    primary: "#FFD93D", // Yellow for workspace/organization
    secondary: "#FFC312"
  },
  enableWorkspaceFeatures: true, // Special workspace functionality
  enableContractorData: true     // Access to contractor information
}
```

---

## Implementation Strategy

### **Phase 1: Enhanced State Management**

**Required Changes to Page Component**:
```javascript
// Enhanced state management for agent tracking
const [currentState, setCurrentState] = useState(null);
const [activeAgent, setActiveAgent] = useState(null);
const [modalContext, setModalContext] = useState(null);

// Enhanced modal handler to track context
const handleOpenModal = (modalId, modalProps = {}) => {
  // Set modal context for chatbot specialization
  setModalContext(modalId);
  
  // Set active agent for agent state
  if (currentState === 'agents') {
    const agentMap = {
      'MinutesCompileModal': 'contract-review',
      'CorrespondenceReplyModal': 'correspondence'
    };
    setActiveAgent(agentMap[modalId]);
  }
  
  openModal(modalId, modalProps);
};
```

### **Phase 2: Agent Configuration System**

**Create Agent Configuration File**:  
**File**: `client/src/pages/00435-contracts-post-award/components/chatbots/00435-agent-configs.js`

```javascript
export const agentConfigurations = {
  'contract-review': {
    title: "Contract Review Agent",
    chatType: "agent-contract-review", 
    welcomeMessage: "I'll help you compile meeting minutes and review contract documentation.",
    exampleQueries: [
      "Help me compile minutes from the contract review meeting",
      "What are the key action items from today's discussion?",
      "Analyze this contract amendment for compliance issues"
    ],
    theme: {
      primary: "#FF6B35",
      secondary: "#FF8C42"
    },
    specializations: ["contract-analysis", "meeting-minutes", "compliance-review"]
  },
  
  'correspondence': {
    title: "Correspondence Agent",
    chatType: "agent-correspondence",
    welcomeMessage: "I'll help you draft professional correspondence and replies.", 
    exampleQueries: [
      "Draft a response to the contractor's delay notification",
      "Help me write a formal contract amendment request",
      "Create a status update email for stakeholders"
    ],
    theme: {
      primary: "#4ECDC4", 
      secondary: "#45B7B8"
    },
    specializations: ["correspondence-drafting", "stakeholder-communication", "formal-replies"]
  }
};

export const stateConfigurations = {
  upsert: {
    title: "Document Processing Assistant",
    chatType: "upsert",
    welcomeMessage: "I'll help you upload, process, and manage your contract documents.",
    exampleQueries: [
      "Help me upload multiple contract files",
      "Extract key terms from this PDF document",
      "Process this contract amendment for approval"
    ],
    theme: {
      primary: "#A8E6CF",
      secondary: "#88D8A3"
    },
    features: ["document-upload", "text-extraction", "bulk-processing"]
  },
  
  workspace: {
    title: "Workspace Management Assistant", 
    chatType: "workspace",
    welcomeMessage: "I'll help you manage contractors, set up workspaces, and organize your project.",
    exampleQueries: [
      "Help me set up a new contractor profile",
      "What's the status of our active contractors?",
      "Create a workspace for the new project phase"
    ],
    theme: {
      primary: "#FFD93D",
      secondary: "#FFC312" 
    },
    features: ["contractor-management", "workspace-setup", "project-organization"]
  }
};
```

### **Phase 3: Dynamic Chatbot Rendering**

**Updated Chatbot Rendering Logic**:
```javascript
// Import configurations
import { agentConfigurations, stateConfigurations } from './chatbots/00435-agent-configs.js';

// Dynamic chatbot rendering based on state and context
const renderChatbot = () => {
  if (!currentState) return null;
  
  let config;
  let chatbotProps = {
    pageId: "0435-contracts-post-award",
    disciplineCode: "00435", 
    userId: "demo-user-001",
    enableCitations: true
  };
  
  if (currentState === 'agents' && activeAgent) {
    // Agent-specific chatbot based on modal button clicked
    config = agentConfigurations[activeAgent];
    chatbotProps = {
      ...chatbotProps,
      chatType: config.chatType,
      title: config.title,
      welcomeMessage: config.welcomeMessage,
      exampleQueries: config.exampleQueries,
      theme: config.theme
    };
  } else if (currentState === 'upserts') {
    // Upsert-specific chatbot
    config = stateConfigurations.upsert;
    chatbotProps = {
      ...chatbotProps,
      chatType: config.chatType,
      title: config.title, 
      welcomeMessage: config.welcomeMessage,
      exampleQueries: config.exampleQueries,
      theme: config.theme,
      enableDocumentCount: true
    };
  } else if (currentState === 'workspace') {
    // Workspace-specific chatbot
    config = stateConfigurations.workspace;
    chatbotProps = {
      ...chatbotProps,
      chatType: config.chatType,
      title: config.title,
      welcomeMessage: config.welcomeMessage, 
      exampleQueries: config.exampleQueries,
      theme: config.theme
    };
  }
  
  return config ? <ChatbotBase {...chatbotProps} /> : null;
};

// In JSX
{renderChatbot()}
```

---

## API Integration Architecture

### **Agent-Specific API Endpoints**

**Contract Review Agent**:
- `POST /api/chat/agent-contract-review/message`
- `GET /api/chat/agent-contract-review/templates` (for meeting minutes templates)
- `POST /api/chat/agent-contract-review/analyze-document`

**Correspondence Agent**:
- `POST /api/chat/agent-correspondence/message` 
- `GET /api/chat/agent-correspondence/templates` (for correspondence templates)
- `POST /api/chat/agent-correspondence/draft-reply`

### **State-Specific API Endpoints**

**Upsert Processing**:
- `POST /api/chat/upsert/message`
- `POST /api/chat/upsert/upload-file`
- `POST /api/chat/upsert/process-bulk`
- `GET /api/chat/upsert/processing-status`

**Workspace Management**:
- `POST /api/chat/workspace/message`
- `GET /api/chat/workspace/contractors`
- `POST /api/chat/workspace/setup-project`
- `GET /api/chat/workspace/project-status`

---

## User Experience Flow

### **Agent State Workflow**:
1. User clicks "Agents" state button
2. Modal buttons appear: "Minutes Compilation" and "Correspondence Reply"  
3. User clicks "Minutes Compilation" → **Contract Review Agent** chatbot activates
4. User clicks "Correspondence Reply" → **Correspondence Agent** chatbot activates
5. Each agent provides specialized assistance for that task

### **Upsert State Workflow**:
1. User clicks "Upserts" state button
2. Modal buttons appear for various upload/import options
3. **Document Processing Assistant** chatbot activates immediately  
4. Chatbot provides guidance for any document processing task
5. Modal buttons work in conjunction with chatbot for specific actions

### **Workspace State Workflow**:
1. User clicks "Workspace" state button
2. Modal buttons appear for contractor and workspace management
3. **Workspace Management Assistant** chatbot activates immediately
4. Chatbot provides contractor and project management assistance
5. Modal buttons work in conjunction with chatbot for specific actions

---

## Benefits of This Architecture

### **1. Task-Specific Expertise**
- Each agent chatbot is specialized for its specific domain
- Better contextual understanding and responses
- Reduced confusion from generic responses

### **2. Intuitive User Experience**  
- Modal buttons guide users to appropriate tools
- Chatbot specialization matches user intent
- Clear separation between different types of tasks

### **3. Scalable Architecture**
- Easy to add new agent types as modal buttons are added
- Modular configuration system
- Clean separation of concerns

### **4. Enhanced Functionality**
- Agent chatbots can have specialized features (templates, document analysis)
- Upsert chatbot can integrate with file upload systems
- Workspace chatbot can access contractor databases

---

## Implementation Priority

### **Phase 1 (Immediate)**:
- Implement enhanced state management for agent tracking
- Create agent configuration system
- Update chatbot rendering logic

### **Phase 2 (Short Term)**:
- Develop specialized welcome messages and example queries
- Implement theme variations for different chatbot types
- Create modal button → agent mapping system

### **Phase 3 (Long Term)**:  
- Develop agent-specific API endpoints
- Implement specialized features for each chatbot type
- Add template systems and advanced functionality

---

## Conclusion

This architecture provides a sophisticated, task-oriented chatbot system where:
- **Agent chatbots are determined by modal button context** (specialized by task)
- **Upsert and Workspace states have dedicated standalone chatbots** (specialized by function)
- Each chatbot provides domain-specific expertise and functionality
- The system scales easily as new modal buttons and features are added

The modal button system serves as the **context trigger** for agent specialization, while maintaining separate specialized chatbots for document processing (upsert) and workspace management functions.
