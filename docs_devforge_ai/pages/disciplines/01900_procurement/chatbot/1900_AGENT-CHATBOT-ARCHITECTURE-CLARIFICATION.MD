# 01900 Procurement Agent Chatbot Architecture Clarification

## Overview

This document clarifies the agent chatbot architecture for the 01900 Procurement page, explaining how it mirrors the successful 00435 Contracts Post-Award implementation while adapting to procurement-specific requirements.

## Architecture Flow

### 1. User Interaction Layer
```
User → Supplier Directory Page → Chatbot Toggle Button → Chat Window
```

The user interacts with the supplier directory page, which contains the integrated chatbot component. The chatbot appears as a toggle button in the bottom-right corner of the viewport.

### 2. Component Integration Layer
```javascript
// In 01900-supplier-directory.js
{createDocumentChatbot({
  pageId: "01900-supplier-directory",
  disciplineCode: "01900",
  userId: currentUser.id,
  chatType: "agent-supplier-analysis", // Key configuration
  title: "Supplier Analysis Assistant",
  welcomeMessage: "I'll help you analyze suppliers...",
  theme: { primary: "#FF6B35", secondary: "#FF8C42" }
})}
```

### 3. Agent Configuration Layer
```javascript
// 01900-agent-configs.js
const agentConfigs = {
  'agent-supplier-analysis': {
    id: 'agent-supplier-analysis',
    name: 'Supplier Analysis Agent',
    icon: '🏪',
    description: 'Analyze supplier data and provide procurement recommendations',
    className: 'SupplierAnalysisAgent',
    agentClass: SupplierAnalysisAgent, // Imported class
    config: {
      pageId: '01900',
      disciplineCode: 'PROCUREMENT'
    }
  }
};
```

### 4. Agent Processing Layer
```javascript
// 01900-supplier-analysis-agent.js
class SupplierAnalysisAgent {
  constructor(config) {
    this.pageId = config.pageId;
    this.disciplineCode = config.disciplineCode;
    this.state = {
      suppliers: [],
      analysisResult: "",
      currentStep: "start",
      isProcessing: false
    };
  }

  async analyzeSuppliers(suppliers) {
    // 1. Dispatch start event
    this.dispatchProgressEvent('🏪 **Supplier Analysis Starting...**');
    
    // 2. Process supplier data
    const analysis = await this.performSupplierAnalysis(suppliers);
    
    // 3. Dispatch completion event
    this.dispatchProgressEvent(`✅ **Analysis Complete**\n\n${analysis}`);
    
    return analysis;
  }
}
```

## Data Flow Architecture

### Request Flow
1. **User Request**: User types query or triggers agent action
2. **Agent Initialization**: `SupplierAnalysisAgent` instantiated with config
3. **Data Collection**: Agent gathers relevant supplier data
4. **API Communication**: Request sent to `/api/agents/supplier-analysis`
5. **Server Processing**: Backend performs analysis with system message
6. **Response Handling**: Results returned to agent class
7. **UI Update**: Progress events dispatched to chatbot base
8. **User Display**: Results shown in 80vw chat window

### Event Flow
```javascript
// Custom event system for chatbot communication
document.addEventListener('chatbotMessage', (event) => {
  // Handle incoming messages from agents
  const { message, type, source } = event.detail;
  // Update chat UI accordingly
});

// Agent dispatches progress events
const progressEvent = new CustomEvent('chatbotMessage', {
  detail: {
    message: "Processing supplier data...",
    type: 'agent_progress',
    source: 'agent'
  },
  bubbles: true
});
document.dispatchEvent(progressEvent);
```

## Agent Types and Capabilities

### Primary Agent: Supplier Analysis
- **Purpose**: Analyze supplier performance and provide recommendations
- **Data Source**: Supplier directory data from Supabase
- **Capabilities**: 
  - Performance metrics calculation
  - Risk assessment
  - Vendor research
  - Procurement recommendations
- **Limitations**: 
  - Market intelligence API pending
  - Advanced analytics not yet implemented

### Secondary Agent: Report Generation
- **Purpose**: Generate procurement reports and dashboards
- **Data Source**: Supplier and spending data
- **Capabilities**:
  - Automated report generation
  - Data visualization
  - Trend analysis
- **Limitations**:
  - Advanced visualization pending
  - Real-time integration not available

### Tertiary Agent: Market Intelligence
- **Purpose**: Research market trends and pricing data
- **Data Source**: External market data feeds
- **Capabilities**:
  - Price trend analysis
  - Competitive intelligence
  - Supplier landscape mapping
- **Limitations**:
  - Real-time data feeds not integrated
  - Global database requires expansion

## System Message Architecture

### Critical Requirements
Following the 00435 pattern, system messages must:
1. **Start with specific prefix**: "SUPPLIER RESEARCH" for procurement
2. **End with specific suffix**: "PROCUREMENT RECOMMENDATION"
3. **Include structured formatting**: Clear section headers
4. **Maintain consistent structure**: Across all agent responses

### Example System Message
```javascript
const systemMessage = `Analyse supplier data and market intelligence...
CRITICAL: MUST start with SUPPLIER RESEARCH and end with PROCUREMENT RECOMMENDATION

SUPPLIER RESEARCH:
- Analyze supplier performance metrics
- Research vendor capabilities and pricing
- Assess market conditions and trends

ANALYSIS FRAMEWORK:
- Performance Rating: 1-5 star scale
- Risk Assessment: Low/Medium/High
- Market Position: Competitive/Preferred/Standard

PROCUREMENT RECOMMENDATION:
- Sourcing strategy recommendations
- Vendor selection criteria
- Risk mitigation approaches`;
```

## CSS and UI Architecture

### Chat Window Specifications
```css
/* Consistent with 00435 implementation */
.procurement-chat-window {
  width: 80vw !important;        /* Same width as 00435 */
  background: #FFF3E0 !important; /* Light orange background */
  z-index: 6001 !important;      /* Proper layering */
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .procurement-chat-window {
    width: 95vw !important;
    height: 85vh !important;
  }
}
```

### Button States
```css
/* Toggle button - matches 00435 styling */
.document-chat-toggle-button {
  background: linear-gradient(135deg, #FF6B35, #FF8C42);
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.35);
}

.document-chat-toggle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
}
```

## API Integration Architecture

### Backend Routes
```javascript
// procurement-routes.js
router.post('/agents/supplier-analysis', async (req, res) => {
  try {
    // 1. Extract supplier data
    const { suppliers } = req.body;
    
    // 2. Apply system message formatting
    const systemMessage = `Analyse supplier data...
    CRITICAL: MUST start with SUPPLIER RESEARCH...`;
    
    // 3. Process with LangChain/GPT
    const analysis = await processSupplierData(suppliers, systemMessage);
    
    // 4. Return structured response
    res.json({ 
      success: true, 
      analysis: analysis,
      recommendation: "Procurement recommendation"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

### Controller Implementation
```javascript
// procurementController.js
const processSupplierAnalysis = async (suppliers, systemMessage) => {
  try {
    // 1. Validate supplier data
    if (!suppliers || suppliers.length === 0) {
      throw new Error('No supplier data provided');
    }

    // 2. Format for AI processing
    const supplierData = suppliers.map(supplier => ({
      name: supplier.name,
      type: supplier.supplier_type,
      rating: supplier.rating,
      status: supplier.approval_status,
      // ... other relevant fields
    }));

    // 3. Send to AI processing (placeholder)
    const analysis = await aiProcess(supplierData, systemMessage);
    
    return analysis;
  } catch (error) {
    console.error('Error processing supplier analysis:', error);
    throw error;
  }
};
```

## State Management Architecture

### Agent State
```javascript
class SupplierAnalysisAgent {
  constructor() {
    this.state = {
      suppliers: [],           // Current supplier data
      analysisResult: "",      // Latest analysis output
      currentStep: "start",    // Processing workflow state
      isProcessing: false,     // Processing lock
      chatHistory: []          // Conversation history
    };
  }
}
```

### Chatbot State
```javascript
// Managed by ChatbotBase component
class ChatbotBase {
  constructor() {
    this.state = {
      messages: [],           // All chat messages
      isChatOpen: false,      // Window visibility
      isProcessing: false,    // Agent processing state
      currentAgent: null,     // Active agent instance
      userId: null,           // Current user ID
      pageId: null           // Current page context
    };
  }
}
```

## Error Handling Architecture

### Agent Error States
```javascript
class SupplierAnalysisAgent {
  async analyzeSuppliers(suppliers) {
    try {
      this.state.isProcessing = true;
      const result = await this.performAnalysis(suppliers);
      return result;
    } catch (error) {
      // Dispatch error event to chatbot
      this.dispatchProgressEvent(
        `❌ **Analysis Error**\n\n${error.message}`, 
        'agent_error'
      );
      throw error;
    } finally {
      this.state.isProcessing = false;
    }
  }
}
```

### API Error Handling
```javascript
router.post('/agents/supplier-analysis', async (req, res) => {
  try {
    // Processing logic
  } catch (error) {
    console.error('Supplier analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## Testing Architecture

### Unit Testing
```javascript
describe('SupplierAnalysisAgent', () => {
  test('should initialize with correct config', () => {
    const agent = new SupplierAnalysisAgent({
      pageId: '01900',
      disciplineCode: 'PROCUREMENT'
    });
    expect(agent.pageId).toBe('01900');
    expect(agent.disciplineCode).toBe('PROCUREMENT');
  });

  test('should process supplier data', async () => {
    const agent = new SupplierAnalysisAgent();
    const suppliers = [{ name: 'Test Supplier', rating: 4.5 }];
    const result = await agent.analyzeSuppliers(suppliers);
    expect(result).toContain('Supplier Analysis Report');
  });
});
```

### Integration Testing
```javascript
describe('Procurement Chatbot Integration', () => {
  test('should integrate with supplier directory', () => {
    // Test createDocumentChatbot integration
    const chatbot = createDocumentChatbot({
      pageId: "01900-supplier-directory",
      chatType: "agent-supplier-analysis"
    });
    expect(chatbot).toBeDefined();
  });

  test('should handle agent configuration', () => {
    const config = getAgentConfig('agent-supplier-analysis');
    expect(config).toBeDefined();
    expect(config.id).toBe('agent-supplier-analysis');
  });
});
```

## Performance Architecture

### Optimization Strategies
1. **Lazy Loading**: Agent classes loaded on demand
2. **Caching**: Analysis results cached for similar queries
3. **Debouncing**: User input processing debounced
4. **Memory Management**: State cleanup on component unmount
5. **Bundle Splitting**: Agent code split for faster loading

### Monitoring
```javascript
// Performance tracking
console.time('SupplierAnalysisAgent.processing');
const result = await agent.analyzeSuppliers(suppliers);
console.timeEnd('SupplierAnalysisAgent.processing');

// Memory usage tracking
console.log('Agent memory usage:', process.memoryUsage());
```

## Security Architecture

### Authentication Flow
```javascript
// User authentication
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  // Pass user ID to agent configuration
  createDocumentChatbot({
    userId: session.user.id,
    // ... other config
  });
}
```

### Data Protection
```javascript
// Sensitive data filtering
const sanitizeSupplierData = (suppliers) => {
  return suppliers.map(supplier => ({
    id: supplier.id,
    name: supplier.name,
    type: supplier.supplier_type,
    rating: supplier.rating,
    // Exclude sensitive fields like tax numbers, addresses
  }));
};
```

## Related Documentation

1. [Agent Chatbot Implementation Summary](./1300_01900_AGENT-CHATBOT-IMPLEMENTATION-SUMMARY.md)
2. [Complete LangChain Implementation](./1300_01900_LANGCHAIN_CHATBOT_COMPLETE_IMPLEMENTATION.md)
3. [Button States Documentation](./1300_01900_BUTTON_STATES.md)
4. [Master Implementation Guide](./1300_01900_MASTER_GUIDE.md)
5. [00435 Agent Architecture](./1300_00435_AGENT-CHATBOT-IMPLEMENTATION-SUMMARY.md)

## Conclusion

The 01900 Procurement agent chatbot architecture successfully replicates the proven 00435 Contracts Post-Award patterns while providing procurement-specific functionality. The system uses a modular, extensible architecture that supports multiple agent types with consistent UI, API integration, and state management patterns.
