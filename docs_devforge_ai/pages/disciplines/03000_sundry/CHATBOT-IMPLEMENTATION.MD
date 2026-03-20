# Chatbot Implementation

## Overview

The chatbot system provides intelligent conversational interfaces across different sections of the application, with specialized implementations for different contexts. The system integrates with Flowise for advanced AI capabilities and supports various chat contexts.

Chatbot configurations, specifically the `flow_id` required to initialize a Flowise instance for a given page and state (e.g., workspace, upsert, agent), are now managed centrally in the database and accessed via a backend API. This replaces the previous static configuration file (`config/chatbot-ids.js`).

## Database Configuration

Chatbot configurations are stored in the `chatbots` table in the PostgreSQL database. The key columns are:

- `page` (VARCHAR): The unique identifier for the page (e.g., `0102-administration`, `0300-construction`, `0425-contracts-pre-award`). This is the primary key component. Note: Use the full page identifier string.
- `state` (VARCHAR): The specific context or type of the chatbot for that page.
    - **Generic States:** `workspace`, `upsert`, `agent` (for the primary chatbots of a page).
    - **Specific Agent States:** For agent chatbots triggered by specific modal actions or custom contexts, a new convention `agent_[descriptive_purpose]` should be used (e.g., `agent_risk_assessment`, `agent_correspondence_reply`). This replaces older, less clear names like `modal-corresp-reply-upsert`.
    - This `state` value is a primary key component along with `page`.
- `flow_id` (UUID): The Flowise Chatflow ID associated with this specific page and state.
- `input_placeholder` (TEXT, Nullable): Optional. The desired placeholder text for the chat input field for this specific chatbot. If dynamic placeholders are implemented, this field can be used.

The combination of `page` and `state` forms the primary key, ensuring uniqueness for each chatbot instance.

- **Document Control Chatbot Configurations:** Configurations for Document Control specific chatbots (`page="0900-document-control"`) have been added to the `chatbots` table for various states ("workspace", "upsert", "agent", "agent_document_summary", "agent_document_qa"). Placeholder components for these chatbots have been created in `client/src/pages/0900-document-control/components/chatbots/`.

## Backend API Endpoints

A set of RESTful API endpoints are available under `/api/chatbots` to manage these configurations:

- **`GET /api/chatbots`**: Retrieves all chatbot configurations from the `chatbots` table. Used by the admin management page.
- **`GET /api/chatbots/:page`**: Retrieves all chatbot configurations for a specific `:page` identifier.
- **`GET /api/chatbots/:page/:state`**: Retrieves the specific `flow_id` (and potentially other configuration like `input_placeholder`) for a given `:page` and `:state`. **This is the primary endpoint used by frontend components to fetch their required configuration**.
- **`PUT /api/chatbots/:page/:state`**: Updates the `flow_id` (and other configurable fields like `input_placeholder`) for a specific chatbot configuration. Requires the new data in the request body.
- **`DELETE /api/chatbots/:page/:state`**: Deletes a specific chatbot configuration.
- **`POST /api/chatbots`**: Adds a new chatbot configuration. (This was missing from the list but exists as per `chatbot-routes.js`).

## Admin Management Page (`2050-ChatbotsPage.js`)

The page located at `client/src/pages/2050-information-technology/components/2050-ChatbotsPage.js` provides a user interface for managing chatbot configurations stored in the database.

**Functionality:**

1. **View:** Displays all existing chatbot configurations fetched via `GET /api/chatbots`, grouped by page in an accordion view. Each entry shows the `state` and its associated `flow_id`.
2. **Add:** An "Add New Chatbot" button opens a modal allowing users to input a new `page` identifier, `state` (e.g., `workspace`, `production`), and `flow_id`. Saving triggers a `POST /api/chatbots` request to create the new configuration in the database.
3. **Edit:** An "Edit" button next to each `flow_id` opens a modal. The `page` and `state` are displayed read-only, and the user can modify the `flow_id`. Saving triggers a `PUT /api/chatbots/:page/:state` request to update the specific configuration.
4. **Delete:** A "Delete" button next to each `flow_id` prompts the user for confirmation (`window.confirm`). If confirmed, it triggers a `DELETE /api/chatbots/:page/:state` request to remove the configuration from the database.
5. **Refresh:** A "Refresh Chatbots" button re-fetches the list using `GET /api/chatbots`.

The page includes loading indicators and error handling for API interactions.

## Frontend Page Name Display (2050-ChatbotsPage)

On the 2050-chatbots page (`client/src/pages/2050-information-technology/components/2050-ChatbotsPage.js`), the human-readable name displayed for each chatbot's associated page is derived from a mapping within the frontend code.

1. **Data Source:** The component fetches chatbot data from the backend API (`GET /api/chatbots`). This data includes a `page` identifier for each chatbot entry (e.g., `"0895"` or `"0895-director-project"`).
2. **Mapping Object:** The `2050-ChatbotsPage.js` component contains a `pageDescriptions` object. This object serves as a local mapping from known page identifiers (both full string identifiers and potentially numeric-only codes) to their corresponding display names (e.g., `"0895-director-project": "Director: Project"`, `"0895": "Director: Project"`).
3. **Display Logic:** When rendering the list of chatbots, the component looks up the `page` identifier received from the backend in the `pageDescriptions` object.
    - If a matching key is found, the associated value (the human-readable name) is displayed.
    - If no matching key is found, a default value like "Unknown Page" is displayed.

To ensure correct page names are displayed, it is important that the `pageDescriptions` object in `client/src/pages/2050-information-technology/components/2050-ChatbotsPage.js` includes mappings for all possible page identifiers that might be returned by the backend API for chatbots, including both the full string identifiers and any numeric-only codes that might be in use. Note that it is possible for multiple distinct page identifiers from the backend to map to the same human-readable name in `pageDescriptions`, which will result in multiple entries with the same name but different page codes being displayed in the chatbot list if those identifiers exist in the backend data.

## Flowise Integration

### Core Components

1. **Specialist Chat (2700-03-specialists-flowise.js)**

```javascript
class SpecialistChat {
  constructor(config) {
    this.flowiseId = config.flowiseId;
    this.context = new ChatContext();
  }

  async initialize() {
    // Set up specialist chat interface
    // Load domain-specific knowledge
    // Initialize Flowise connection
    // Set up event handlers
  }

  async processQuery(query) {
    // Process specialist query
    // Apply domain context
    // Generate expert response
    // Handle specialized cases
  }
}
```

2. **Workspace Chat (2700-01-workspace-flowise.js)**
   The workspace chatbot provides a context-aware chat interface for workspace-specific interactions. Key features include:

- Responsive design (90% viewport width, 80% viewport height)
- Custom theme configuration
- Automatic resizing handling
- Error recovery mechanisms
- Resource cleanup management

Standard Implementation (using `flowise-embed`):

Frontend components (e.g., a generic `AgentChatbot` component) display Flowise chatbots using the `flowise-embed` library. The component typically receives a `flowId` prop.

```javascript
// Example: client/src/pages/xxxx-page/components/chatbots/xxxx-01-workspace-chatbot.js
import React, { useEffect, useRef, useState } from 'react'; // Added useState
import Chatbot from 'flowise-embed/dist/web.js';
// Removed import of getChatbotId

const WorkspaceChatbotXXXX = ({ pageId = "xxxx", state = "workspace" }) => { // Accept pageId and state as props
  const chatbotContainerRef = useRef(null);
  const chatbotInstanceRef = useRef(null);
  const [flowiseConfig, setFlowiseConfig] = useState(null); // State to hold the config
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // ... (resize handler refs, etc.)

  // Function to calculate dimensions (example)
  const getChatbotDimensions = () => { /* ... */ };

The example below illustrates a generic chatbot component that takes `flowId` as a prop. Parent components (like page components) are responsible for fetching the correct `flowId` (for generic or specific agents) and passing it.

```javascript
// Example: client/src/pages/xxxx-safety/components/chatbots/xxxx-03-agent-flowise.js
import React, { useEffect, useRef, useState } from 'react';
import Chatbot from 'flowise-embed/dist/web.js';

const GenericAgentChatbot = ({ flowId, chatData, sessionId, placeholderText }) => {
  const chatbotContainerRef = useRef(null);
  const [chatbotInstance, setChatbotInstance] = useState(null);
  const [error, setError] = useState(null);
  const isInitialized = !!chatbotInstance;

  useEffect(() => {
    // Cleanup previous instance if flowId changes or component unmounts
    if (chatbotInstance) {
      chatbotInstance.destroy();
      setChatbotInstance(null);
    }
    if (!flowId) {
      setError("Flow ID is missing.");
      return;
    }
    setError(null); // Clear previous errors

    const initChatbot = () => {
      if (chatbotContainerRef.current) {
        chatbotContainerRef.current.innerHTML = ''; // Ensure clean container
        const config = {
          chatflowid: flowId,
          apiHost: process.env.REACT_APP_FLOWISE_API_HOST || "https://flowise-l8hx.onrender.com",
          theme: {
            chatWindow: {
              // welcomeMessage: "Client-side welcome", // Omit to use Flowise flow's welcome message
              textInput: {
                placeholder: placeholderText || "Type your message...", // Use passed placeholder or default
              },
              // ... other theme settings
            },
            button: { /* ... button theme ... */ }
          },
          chatflowConfig: sessionId ? { sessionId } : {}
        };
        try {
          const instance = Chatbot.init(config);
          setChatbotInstance(instance);
          if (instance && typeof instance.openChatWindow === 'function') {
            instance.openChatWindow(); // Open window automatically
          }
        } catch (e) {
          setError("Failed to initialize chatbot: " + e.message);
        }
      }
    };
    const timerId = setTimeout(initChatbot, 100); // Delay for DOM readiness
    return () => clearTimeout(timerId);
  }, [flowId, sessionId, placeholderText]); // Re-init if these change

  // Effect to send initial message from chatData
  useEffect(() => {
    if (chatbotInstance && chatData && chatData.text && chatData.text.trim() !== "") {
      if (typeof chatbotInstance.send === 'function') {
        setTimeout(() => { // Small delay for window to be fully ready
            if(chatbotInstance && chatbotInstance.send) chatbotInstance.send(chatData.text);
        }, 200);
      } else {
        console.error("Chatbot instance has no 'send' method.");
      }
    }
  }, [chatbotInstance, chatData]); // Run when instance or chatData changes

  if (error) return <p>Error: {error}</p>;
  return <div ref={chatbotContainerRef} id={`flowise-chatbot-${flowId || 'no-id'}`}></div>;
};
export default GenericAgentChatbot;
```

### Client-Side Chatbot Configuration Details:

*   **Welcome Messages:** To use the welcome message configured directly in your Flowise flow, **omit** the `theme.chatWindow.welcomeMessage` property from the `config` object passed to `Chatbot.init()` in your client-side React component. If provided client-side, it will override the Flowise flow's setting.
*   **Input Placeholder Text (Starter Prompts):**
    *   The "Starter Prompts" configured in the Flowise UI (which appear as clickable suggestion bubbles) are separate from the placeholder text shown inside the chat input field.
    *   The input field's placeholder is controlled by the `theme.chatWindow.textInput.placeholder` property in the client-side `Chatbot.init()` config.
    *   To have different placeholders for different agents:
        1.  (Recommended) Add an `input_placeholder` column to your `chatbots` database table.
        2.  Populate this column with the desired placeholder for each `page` and `state`.
        3.  Modify the backend API (`GET /api/chatbots/:page/:state`) to return this `input_placeholder` along with the `flow_id`.
        4.  The parent page component (e.g., `SafetyPageComponent`) should fetch this placeholder and pass it as a prop to the agent chatbot component.
        5.  The agent chatbot component then uses this prop to set the `placeholder` in its `Chatbot.init()` config.
    *   If this dynamic approach is not implemented, a generic placeholder can be hardcoded in the agent chatbot component, or the `placeholder` property can be omitted (the `flowise-embed` library might have its own default).

Positioning of the chatbot button is handled **internally** by the `flowise-embed` component via the `theme.button.bottom` and `theme.button.right` properties.

**Do not** apply external CSS rules (like `position: fixed`) to the chatbot's container div for positioning the chat button, as this will conflict with the `flowise-embed` component's internal logic.

### Displaying Specific Agent Chatbots (e.g., After Modal Actions)

A common pattern is to display a generic agent chatbot for a page state (e.g., "Agents") and then switch to a more specific agent chatbot after a user action (e.g., completing a modal like "Risk Assessment").

1.  **Parent Page Component (e.g., `SafetyPageComponent`):**
    *   Manages an `activeAgentFlowId` state variable.
    *   When the generic "Agents" state is activated, it fetches the `flow_id` for `page="[currentPageId]", state="agent"` and updates `activeAgentFlowId`.
    *   Modals (e.g., `SafetyRiskAssessmentModal`) have an `onSubmissionSuccess` callback.
    *   When a modal's action completes, this callback is invoked. The parent page then determines the `state` name for the *specific* agent required (e.g., `agent_risk_assessment`).
    *   The parent page fetches the `flow_id` for this specific agent state (e.g., `GET /api/chatbots/[currentPageId]/agent_risk_assessment`).
    *   The fetched `flow_id` updates `activeAgentFlowId`.
2.  **Agent Chatbot Component (e.g., `SafetyAgentChatbot`):**
    *   Receives `activeAgentFlowId` as a `flowId` prop.
    *   Uses `useEffect` (dependent on `flowId`) to re-initialize when this prop changes.
    *   Crucially, the parent component should use `key={activeAgentFlowId}` when rendering the agent chatbot component. This ensures React treats it as a new component instance when `activeAgentFlowId` changes, forcing a full unmount of the old instance and a clean mount and initialization of the new one.

### Sending Initial Data/Prompt to Agent Chatbot

After a modal action, it's often useful to send data from the modal (e.g., the user's input to the modal, or the result generated by the modal) as the first user message to the newly loaded specific agent chatbot.

1.  **Parent Page Component:**
    *   The modal's `onSubmissionSuccess` callback provides the `result` data.
    *   The parent page stores this relevant data (e.g., `result.text`) in a state variable (e.g., `chatData`).
    *   This `chatData` is passed as a prop to the agent chatbot component.
2.  **Agent Chatbot Component:**
    *   It receives the `chatData` prop.
    *   A `useEffect` hook (dependent on `chatbotInstance` and `chatData`) checks if the chatbot is initialized and if `chatData.text` is present.
    *   If so, it calls `chatbotInstance.send(chatData.text)` to submit the message.
    *   A small `setTimeout` (e.g., 100-200ms) before calling `send()` can be beneficial to ensure the programmatically opened chat window is fully ready.
    *   The parent page should clear `chatData` (e.g., set to `null`) after it's been "consumed" to prevent re-sending on subsequent re-renders, or the child component needs to track if the specific `chatData` has already been sent.

Lifecycle Management:

- Initialization with loading states
- Window resize handling
- Error handling with user feedback
- Proper cleanup of resources (destroying Flowise instances, removing event listeners)
- Reset capability for conversation state (often handled by Flowise or by changing `sessionId`)

3. **Upsert Chat (2700-02-upsert-flowise.js)**

```javascript
class UpsertChat {
  constructor(config) {
    this.flowiseId = config.flowiseId;
    this.upsertContext = new UpsertContext();
  }

  async handleUpsertQuery(query) {
    // Process upsert request
    // Handle file operations
    // Generate response
    // Update UI state
  }

  async processFiles(files) {
    // Handle file uploads
    // Process file content
    // Update database
    // Generate confirmation
  }
}
```

## Text Upsert Process

### Modal Interface (2700-02-002-modal-upsert-text)

The text upsert modal provides a structured interface for adding text content to the vector store. Key features include:

- Category selection (safety, risk, compliance, procedures)
- Company and project selection
- Contract type and contractor details
- Text type categorization with custom type management
- Data storage update mode (incremental/full)
- Text input area for content

### Upsert Flow

1. **Data Collection**

    - User inputs text and metadata through the modal interface
    - Form data is validated before submission
    - A unique source*id_key is generated using format: `${namespace}*${textType}_${uuid}`

2. **Safety Data Storage**

    - Text content and metadata are stored in `a_2700_safety_data` table
    - System verifies successful data insertion with retries
    - Includes metadata like timestamp, update mode, and storage identifier

3. **Flowise Processing**

    - Content is sent to Flowise API for embedding generation
    - Request includes complete metadata for context
    - System waits for valid embedding (1536-dimension vector)
    - Implements retry mechanism (12 attempts x 10 seconds)

4. **Vector Storage**
    - Embedding and metadata stored in `a_2700_safety_vector` table
    - Uses upsert operation with source_id_key conflict handling
    - Verifies successful vector storage
    - Maintains consistency between safety_data and vector store

### Error Handling

- Comprehensive error checking at each stage
- Detailed logging for troubleshooting
- Graceful failure handling with user feedback
- Retry mechanisms for critical operations

### Event System

- Uses custom events for process coordination
- `A-2700-text-submit` initiates the upsert process
- `A-2700-text-submit-complete` signals completion status
- Provides detailed success/failure information

## Message Handling

### 1. Message Structure

```javascript
const messageSchema = {
  id: "unique_identifier",
  sender: {
    id: "user_id",
    type: "user|system|bot",
  },
  content: {
    text: "message_text",
    attachments: [],
  },
  metadata: {
    timestamp: "iso_date",
    context: {},
  },
};
```

### 2. Message Processing

```javascript
class MessageProcessor {
  async process(message) {
    // Enrich message with context
    // Validate message format
    // Process message content
    // Format response
    // Handle errors
  }

  async handleAttachments(attachments) {
    // Process file attachments
    // Validate file types
    // Store files
    // Update references
  }
}
```

## Asset Management

The chatbot uses various assets (avatars, icons) that are managed through webpack:

- All chatbot assets should be placed in src/common/assets/chatbot/
- Assets are automatically copied to dist2/assets/chatbot/ during build
- Reference assets using the /assets/ path prefix
- **Note:** Some specific chatbots (like the Page 2400 Safety workspace) might utilize assets (e.g., avatars) provided directly by the Flowise configuration itself. These assets use paths defined within Flowise and may differ from the standard project asset management approach.
- The `public/` directory is used only for backup storage or static assets not processed by Webpack.

## UI Components

### 1. Chat Interface

```javascript
class ChatUI {
  constructor(container) {
    this.container = container;
    this.messageList = null;
    this.inputArea = null;
  }

  initialize() {
    // Create message list
    // Set up input area
    // Bind events
    // Initialize state
  }

  appendMessage(message) {
    // Create message element
    // Apply formatting
    // Add to message list
    // Handle scrolling
  }
}
```

### 2. Message Formatting

```javascript
class MessageFormatter {
  format(message) {
    return {
      html: this.toHTML(message),
      text: this.toPlainText(message),
      markdown: this.toMarkdown(message),
    };
  }

  formatAttachments(attachments) {
    // Format file previews
    // Create download links
    // Handle image displays
    // Support file types
  }
}
```

## State Management

### 1. Chat State

```javascript
class ChatState {
  constructor() {
    this.messages = [];
    this.context = {};
    this.attachments = new Map();
  }

  updateState(update) {
    // Apply state update
    // Notify observers
    // Handle side effects
    // Validate state
  }
}
```

### 2. Context Management

```javascript
class ContextManager {
  constructor() {
    this.activeContext = null;
    this.contextHistory = [];
  }

  updateContext(newContext) {
    // Update active context
    // Maintain history
    // Handle transitions
    // Validate context
  }
}
```

## Best Practices

### 1. Message Handling

- Validate message format
- Handle errors gracefully
- Implement retry logic
- Maintain message order
- Process attachments properly

### 2. Performance

- Implement message pagination
- Cache recent messages
- Optimize file handling
- Monitor chat performance
- Handle large conversations

### 3. Security

- Validate user permissions
- Sanitize message content
- Protect sensitive data
- Rate limit requests
- Secure file handling

### 4. User Experience

- Show typing indicators
- Handle offline status
- Provide read receipts
- Support message editing
- Clear error messages

## Related Documentation

- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
- [Core Components](1000_CORE_COMPONENTS.md)
- [Security Model](0400_SECURITY_MODEL.md)
- [Page Implementations](1300_PAGE_IMPLEMENTATIONS.md)

## Refactoring Chatbots for Dynamic Loading

Previously, chatbot components often received their `flow_id` directly as a prop from the parent page component, which might have fetched all IDs for the page at once or used a static configuration. The current standard is to make each chatbot component self-sufficient in fetching its required `flow_id` from the backend API based on its specific `pageId` and `state`.

**Refactoring Steps:**

1. **Child Chatbot Component (`xxxx-yy-state-flowise.js`):**
    - **Props:** Modify the component to accept `pageId` (e.g., `"0300-construction"`) and `state` (e.g., `"workspace"`) as props, providing sensible defaults if necessary. Remove the old `flowId` prop.
    - **State:** Add React state variables using `useState` to manage the fetched configuration (`flowiseConfig`), loading status (`isLoading`), and potential errors (`error`).
    - **Fetch `useEffect`:** Create a `useEffect` hook (dependent on `pageId` and `state`) that performs an `async` fetch to the backend API endpoint: `/api/chatbots/:pageId/:state`.
        - Handle the API response: Check for errors (e.g., `!response.ok`), parse the JSON, and extract the `flow_id`.
        - Handle missing `flow_id`: Throw an error if the `flow_id` is not found in the response.
        - Construct Configuration: Build the `config` object required by `Chatbot.init()`, including the fetched `chatflowid`, `apiHost` (preferably from `process.env.REACT_APP_FLOWISE_API_HOST`), and the existing `theme` object (which can often be copied from the old `getConfig` function).
        - Update State: Set the `flowiseConfig` state with the constructed config object on success, or set the `error` state on failure. Set `isLoading` to `false` in a `finally` block.
    - **Init/Cleanup `useEffect`:** Create a second `useEffect` hook (dependent on `flowiseConfig`, `pageId`, `state`) responsible for initializing and cleaning up the Flowise chatbot instance.
        - Initialize: Inside the effect, call `Chatbot.init(flowiseConfig)` only when `flowiseConfig` is available, the container ref exists, and no instance (`chatbotInstanceRef.current`) already exists. Store the returned instance in `chatbotInstanceRef.current`. Include error handling for `Chatbot.init`. Consider a small `setTimeout` (e.g., 100ms) before `init` to ensure the DOM is ready.
        - Cleanup (Destroy): The `return` function of this effect should check if `chatbotInstanceRef.current` exists and has a `destroy` method, and if so, call `chatbotInstanceRef.current.destroy()` and set the ref to `null`. This handles unmounting or changes in `flowiseConfig`/`pageId`/`state`.
        - Cleanup (Other): Include cleanup for any other listeners added in this effect (like resize listeners).
    - **Render Logic:** Update the component's return statement:
        - Return `null` if `isLoading` is true.
        - Return an error message (e.g., `<p>Error: {error}</p>`) if `error` state is set.
        - Return `null` if `!flowiseConfig` (as a fallback, though the error state should ideally cover this).
        - Otherwise, return the `<div>` with the `ref={chatbotContainerRef}` and a dynamic `id` (e.g., `id={'flowise-chatbot-container-' + pageId + '-' + state}`).
    - **Component Naming:** Rename the component and its export to follow a consistent pattern, like `AdminWorkspaceChatbot`, `AdminUpsertChatbot`, etc.
    - **Remove Old Code:** Delete the old `getConfig` function and the original `useEffect` hook that depended on the `flowId` prop.

2. **Parent Page Component (`xxxx-page.js`):**
    - **Imports:** Update the import statements to use the new names of the refactored chatbot components (e.g., `import AdminWorkspaceChatbot from '...'`).
    - **Remove State/Fetch:** Remove any state variables (`chatbotFlowIds`) and `useEffect` hooks in the parent component that were previously used to fetch all chatbot IDs for the page. The child components now handle their own data fetching.
    - **Rendering:** Update the rendering logic within the `chatbot-container` div:
        - Use the new component names (e.g., `<AdminWorkspaceChatbot />`).
        - Pass the correct `pageId` (full string, e.g., `"0300-construction"`) and `state` (e.g., `"workspace"`) as props to each corresponding chatbot component. Do **not** pass the `flowId` prop anymore.

3. **Database Verification:**
    - Ensure that entries exist in the `chatbots` database table for the specific `page` identifier and each required `state` (`workspace`, `upsert`, `agent`, etc.). Use the Admin Management Page (`2050-chatbots.html`) or `curl` commands against the API (`GET /api/chatbots/:page/:state`) to verify or add missing entries. Remember to use the full page identifier (e.g., `0200-commercial`) in the database and API calls.

**Note on Excluded Pages (Feb 2025 Refactor):**
During the refactoring effort in February 2025, the following page identifiers were found in the `chatbots` database table but were excluded from the dynamic loading refactor. This was primarily due to them using a placeholder `flow_id` (`018e522b-964a-46a0-b457-0ae43f4984d4`) or having potential numbering inconsistencies with other established pages. These entries may require further investigation and cleanup:

- `0877-sundry`
- `1100-mechanical` (Potential conflict with `0870-mechanical-engineering`)
- `1200-director` (Generic director page?)
- `1300-document-control` (Potential conflict with `0900-document-control`)
- `1400-environmental` (Potential conflict with `1000-environmental`)
- `1500-ethics` (Potential conflict with `1100-ethics`)
- `1600-finance` (Potential conflict with `1200-finance`)
- `1700-governance`
- `1800-health` (Potential conflict with `1400-health`)
- `2000-human-resources` (Potential conflict with `1500-human-resources`)
- `2025-quantity-surveying`
- `2400-safety`
- `2500-project-controls`
- `2600-quality-assurance` (Potential conflict with `2200-quality-assurance`)
- `2800-security` (Potential conflict with `2500-security`)
- `2900-quality-control` (Potential conflict with `2250-quality-control`)

By following these steps, each chatbot component becomes responsible for its own configuration loading, making the system more modular and easier to manage.

Refactored: client/src/pages/0102-administration/components/chatbots/0102-01-workspace-flowise.js
Refactored: client/src/pages/0102-administration/components/chatbots/0102-02-upsert-flowise.js
Refactored: client/src/pages/0200-commercial/components/chatbots/0200-01-workspace-flowise.js
Refactored: client/src/pages/0200-commercial/components/chatbots/0200-02-upsert-flowise.js
Refactored: client/src/pages/0300-construction/components/chatbots/0300-01-workspace-flowise.js
Refactored: client/src/pages/0300-construction/components/chatbots/0300-02-upsert-flowise.js
Refactored: client/src/pages/0425-contracts-pre-award/components/chatbots/0425-01-workspace-flowise.js
Refactored: client/src/pages/0425-contracts-pre-award/components/chatbots/0425-02-upsert-flowise.js
Refactored: client/src/pages/0435-contracts-post-award/components/chatbots/0435-01-workspace-flowise.js
Refactored: client/src/pages/0435-contracts-post-award/components/chatbots/0435-02-upsert-flowise.js
Refactored: client/src/pages/0835-chemical-engineering/components/chatbots/0835-01-workspace-flowise.js
Refactored: client/src/pages/0835-chemical-engineering/components/chatbots/0835-02-upsert-flowise.js

</file_content>

Now that you have the latest state of the file, try the operation again with fewer, more precise SEARCH blocks. For large files especially, it may be prudent to try to limit yourself to <5 SEARCH/REPLACE blocks at a time, then wait for the user to respond with the result of the operation before following up with another replace_in_file call to make additional edits.
(If you run into this error 3 times in a row, you may use the write_to_file tool as a fallback.)
</error><environment_details>
# VSCode Visible Files
docs/0900_CHATBOT_IMPLEMENTATION.md

# VSCode Open Tabs
client/src/common/js/ui/0200-ui-display-mappings.js
docs/0300_DATABASE_SCHEMA.md
docs/1300_0900_DOCUMENT_CONTROL_PAGE.md
memory-bank/progress.md
sql/insert_0900_modal_chatbot_configs.sql
client/src/pages/0900-document-control/components/modals/0900-DocumentDetailsModal.js
client/src/pages/0900-document-control/components/modals/0900-DocumentUploadModal.js
client/src/pages/0900-document-control/components/modals/0900-SummarizeDocInputModal.js
client/src/pages/0900-document-control/components/modals/0900-QaDocInputModal.js
client/src/pages/0900-document-control/components/chatbots/0900-WorkspaceChatbot.js
client/src/pages/0900-document-control/components/chatbots/0900-UpsertChatbot.js
client/src/pages/0900-document-control/components/chatbots/0900-AgentChatbot.js
client/src/pages/0900-document-control/components/chatbots/0900-DocumentSummaryAgentChatbot.js
client/src/pages/0900-document-control/components/chatbots/0900-DocumentQaAgentChatbot.js
client/src/pages/0900-document-control/components/0900-document-control-page.js
client/src/pages/0900-document-control/components/0900-AgentsView.js
client/src/pages/0900-document-control/components/0900-UpsertView.js
client/src/pages/0900-document-control/components/0900-WorkspaceView.js
docs/1300_00170_MODAL_MANAGEMENT_PAGE.md
docs/0900_CHATBOT_IMPLEMENTATION.md
sql/alter_chatbots_add_input_placeholder.sql
memory-bank/systemPatterns.md
client/config/webpack.config.js
sql/create_a_00900_doccontrol_tables.sql
docs/0000_DOCUMENTATION_GUIDE.md

# Current Time
22/05/2025, 5:08:06 pm (Africa/Johannesburg, UTC+2:00)

# Context Window Usage
654,672 / 1,048.576K tokens used (62%)

# Current Mode
ACT MODE
</environment_details>
