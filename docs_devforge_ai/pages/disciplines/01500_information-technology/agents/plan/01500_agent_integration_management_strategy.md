# 00435 Agent Integration Management Strategy

## Overview

This document outlines the comprehensive strategy for managing agent chatbot integrations across multiple platforms including LangChain, Flowise, n8n, and other potential backend systems. The goal is to create a flexible, scalable architecture that can seamlessly integrate different AI agent platforms while maintaining a consistent frontend experience.

## Integration Challenge

### Current Requirement
**Agent State chatbots are determined by modal button context:**
- **Minutes Compilation** → Contract Review Agent
- **Correspondence Reply** → Correspondence Agent

### Multi-Platform Reality
Each specialized agent may be implemented using different backend platforms:
- **LangChain Framework** (Python/Node.js based)
- **Flowise** (Visual workflow builder)
- **n8n** (Automation platform)
- **Custom API endpoints**
- **Third-party AI services**

---

## Integration Architecture

### 1. **Backend Abstraction Layer**

**File Location**: `server/src/services/agent-integration-service.js`

**Purpose**: Provide a unified interface for all agent backends, abstracting away platform-specific implementation details.

```javascript
class AgentIntegrationService {
  constructor() {
    this.integrations = new Map();
    this.loadIntegrationConfigs();
  }

  // Register different integration adapters
  registerIntegration(agentType, platform, adapter) {
    const key = `${agentType}-${platform}`;
    this.integrations.set(key, adapter);
  }

  // Route agent requests to appropriate backend
  async sendMessage(agentType, message, context = {}) {
    const config = this.getAgentConfig(agentType);
    const adapter = this.getAdapter(agentType, config.platform);
    
    return await adapter.sendMessage(message, {
      ...context,
      agentType,
      platform: config.platform
    });
  }

  // Get appropriate adapter for agent/platform combination
  getAdapter(agentType, platform) {
    const key = `${agentType}-${platform}`;
    const adapter = this.integrations.get(key);
    
    if (!adapter) {
      throw new Error(`No adapter found for ${agentType} on ${platform}`);
    }
    
    return adapter;
  }
}
```

### 2. **Agent Configuration System**

**File Location**: `server/src/config/agent-integrations.json`

**Purpose**: Centralized configuration defining which platform each agent uses, with fallback options.

```json
{
  "contract-review": {
    "primary": {
      "platform": "langchain",
      "endpoint": "/api/agents/langchain/contract-review",
      "config": {
        "model": "gpt-4",
        "temperature": 0.3,
        "max_tokens": 2000,
        "system_prompt": "You are a contract review specialist..."
      }
    },
    "fallback": [
      {
        "platform": "flowise",
        "endpoint": "/api/agents/flowise/contract-review",
        "flow_id": "contract-review-flow-v2",
        "config": {
          "webhook_url": "https://flowise.example.com/api/v1/prediction/contract-review"
        }
      }
    ],
    "features": {
      "document_analysis": true,
      "template_generation": true,
      "compliance_checking": true
    }
  },
  
  "correspondence": {
    "primary": {
      "platform": "n8n",
      "endpoint": "/api/agents/n8n/correspondence",
      "config": {
        "workflow_id": "correspondence-agent-v3",
        "webhook_url": "https://n8n.example.com/webhook/correspondence-agent"
      }
    },
    "fallback": [
      {
        "platform": "langchain",
        "endpoint": "/api/agents/langchain/correspondence",
        "config": {
          "model": "gpt-3.5-turbo",
          "temperature": 0.7,
          "system_prompt": "You are a professional correspondence assistant..."
        }
      }
    ],
    "features": {
      "email_drafting": true,
      "tone_adjustment": true,
      "template_library": true
    }
  }
}
```

### 3. **Platform-Specific Adapters**

#### **LangChain Adapter**
**File Location**: `server/src/integrations/adapters/langchain-adapter.js`

```javascript
class LangChainAdapter {
  constructor(config) {
    this.config = config;
    this.baseURL = config.baseURL || 'http://localhost:8000';
  }

  async sendMessage(message, context) {
    const response = await fetch(`${this.baseURL}${context.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        message,
        context: {
          userId: context.userId,
          pageId: context.pageId,
          agentType: context.agentType,
          conversationId: context.conversationId
        },
        config: this.config.config
      })
    });

    if (!response.ok) {
      throw new Error(`LangChain API error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getDocuments(context) {
    // LangChain-specific document retrieval
    const response = await fetch(`${this.baseURL}/api/documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      params: {
        userId: context.userId,
        disciplineCode: context.disciplineCode
      }
    });

    return await response.json();
  }
}
```

#### **Flowise Adapter**
**File Location**: `server/src/integrations/adapters/flowise-adapter.js`

```javascript
class FlowiseAdapter {
  constructor(config) {
    this.config = config;
    this.baseURL = config.baseURL || 'http://localhost:3000';
  }

  async sendMessage(message, context) {
    const response = await fetch(`${this.baseURL}/api/v1/prediction/${this.config.flowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        question: message,
        overrideConfig: {
          userId: context.userId,
          pageContext: context.pageId,
          agentType: context.agentType
        },
        history: context.conversationHistory || []
      })
    });

    if (!response.ok) {
      throw new Error(`Flowise API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Flowise response to standard format
    return {
      message: data.text,
      sources: data.sourceDocuments?.map(doc => ({
        title: doc.metadata?.title,
        url: doc.metadata?.url,
        excerpt: doc.pageContent?.substring(0, 200)
      })) || []
    };
  }
}
```

#### **n8n Adapter**
**File Location**: `server/src/integrations/adapters/n8n-adapter.js`

```javascript
class N8nAdapter {
  constructor(config) {
    this.config = config;
    this.webhookURL = config.webhook_url;
  }

  async sendMessage(message, context) {
    const response = await fetch(this.webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-auth': this.config.authToken
      },
      body: JSON.stringify({
        message,
        context: {
          userId: context.userId,
          pageId: context.pageId,
          agentType: context.agentType,
          timestamp: new Date().toISOString()
        },
        workflow_data: {
          workflow_id: this.config.workflow_id,
          execution_mode: 'webhook'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`n8n Webhook error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform n8n response to standard format
    return {
      message: data.output?.message || data.result,
      metadata: {
        execution_id: data.executionId,
        workflow_id: data.workflowId,
        processing_time: data.processingTime
      }
    };
  }
}
```

---

## API Routing Strategy

### **Unified Agent Endpoint**
**File Location**: `server/src/routes/agent-routes.js`

```javascript
import express from 'express';
import { AgentIntegrationService } from '../services/agent-integration-service.js';

const router = express.Router();
const agentService = new AgentIntegrationService();

// Unified endpoint for all agent interactions
router.post('/api/chat/:agentType/message', async (req, res) => {
  try {
    const { agentType } = req.params;
    const { message, context } = req.body;

    // Enhanced context with request info
    const enrichedContext = {
      ...context,
      agentType,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || generateRequestId()
    };

    // Route to appropriate backend
    const response = await agentService.sendMessage(agentType, message, enrichedContext);

    res.json({
      success: true,
      data: response,
      metadata: {
        agentType,
        platform: agentService.getAgentConfig(agentType).primary.platform,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`Agent integration error [${agentType}]:`, error);

    // Try fallback if primary fails
    try {
      const fallbackResponse = await agentService.sendMessageWithFallback(
        req.params.agentType, 
        req.body.message, 
        { ...req.body.context, useFallback: true }
      );

      res.json({
        success: true,
        data: fallbackResponse,
        metadata: {
          agentType: req.params.agentType,
          platform: 'fallback',
          fallback_used: true
        }
      });

    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: 'Agent service unavailable',
        details: process.env.NODE_ENV === 'development' ? fallbackError.message : undefined
      });
    }
  }
});

// Agent status endpoint
router.get('/api/agents/status', async (req, res) => {
  const status = await agentService.getSystemStatus();
  res.json(status);
});

export default router;
```

---

## Frontend Integration Strategy

### **Enhanced ChatbotBase Component**

**File Location**: `client/src/components/chatbots/base/ChatbotBase.js`

**Enhanced API Integration with Platform Awareness**:

```javascript
const sendMessage = async (message) => {
  setIsLoading(true);
  setError(null);

  try {
    // Determine agent type based on modal context
    const agentType = determineAgentType(props.chatType, modalContext);
    
    const response = await fetch(`/api/chat/${agentType}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': generateRequestId()
      },
      body: JSON.stringify({
        message,
        context: {
          userId: props.userId,
          pageId: props.pageId,
          disciplineCode: props.disciplineCode,
          conversationId: conversationId.current,
          modalContext,
          preferences: userPreferences
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle platform-specific response formatting
    const formattedResponse = formatAgentResponse(data);
    
    setMessages(prev => [...prev, 
      { role: 'user', content: message, timestamp: new Date() },
      { 
        role: 'assistant', 
        content: formattedResponse.message,
        timestamp: new Date(),
        sources: formattedResponse.sources,
        metadata: formattedResponse.metadata
      }
    ]);

  } catch (error) {
    console.error('Agent message error:', error);
    setError('I encountered an error while processing your request. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// Determine agent type based on context
const determineAgentType = (chatType, modalContext) => {
  if (chatType === 'agent' && modalContext) {
    const agentMapping = {
      'MinutesCompileModal': 'contract-review',
      'CorrespondenceReplyModal': 'correspondence'
    };
    return agentMapping[modalContext] || 'general';
  }
  return chatType; // upsert, workspace, etc.
};
```

---

## Configuration Management

### **Environment-Based Configuration**

**File Location**: `server/src/config/environments/`

#### **Development Configuration**
**File**: `server/src/config/environments/development.json`

```json
{
  "agents": {
    "contract-review": {
      "platform": "langchain",
      "config": {
        "baseURL": "http://localhost:8000",
        "model": "gpt-3.5-turbo",
        "debug": true
      }
    },
    "correspondence": {
      "platform": "flowise",
      "config": {
        "baseURL": "http://localhost:3000",
        "flowId": "dev-correspondence-flow",
        "debug": true
      }
    }
  },
  "fallback": {
    "enabled": true,
    "timeout": 30000,
    "retry_attempts": 2
  }
}
```

#### **Production Configuration**
**File**: `server/src/config/environments/production.json`

```json
{
  "agents": {
    "contract-review": {
      "platform": "n8n",
      "config": {
        "webhook_url": "https://n8n.company.com/webhook/contract-review",
        "workflow_id": "prod-contract-review-v2"
      }
    },
    "correspondence": {
      "platform": "langchain",
      "config": {
        "baseURL": "https://langchain.company.com",
        "model": "gpt-4",
        "temperature": 0.5
      }
    }
  },
  "fallback": {
    "enabled": true,
    "timeout": 15000,
    "retry_attempts": 1
  }
}
```

---

## Integration Benefits

### **1. Platform Flexibility**
- Switch backend platforms without changing frontend code
- Test different platforms for different agents
- Gradual migration between platforms
- Platform-specific optimization

### **2. Fault Tolerance**
- Automatic fallback to secondary platforms
- Graceful degradation when platforms fail
- Load balancing across multiple backends
- Circuit breaker patterns for unstable services

### **3. Development Efficiency**
- Unified development experience
- Consistent API contracts
- Environment-specific configurations
- Easy testing and debugging

### **4. Scalability**
- Independent scaling of different agent types
- Platform-specific performance optimization
- Cost optimization by platform selection
- Easy addition of new agent types

---

## Implementation Phases

### **Phase 1: Core Infrastructure** (Immediate)
- Implement AgentIntegrationService
- Create basic adapters for LangChain and Flowise
- Set up unified routing system
- Basic configuration management

### **Phase 2: Advanced Features** (Short Term)
- Add n8n adapter
- Implement fallback mechanisms
- Add monitoring and logging
- Performance optimization

### **Phase 3: Enterprise Features** (Long Term)
- Load balancing and auto-scaling
- Advanced monitoring and analytics
- A/B testing framework for different platforms
- Custom adapter framework for third-party integrations

---

## Monitoring & Analytics

### **Integration Health Dashboard**

**Metrics to Track**:
- Response times per platform
- Success/failure rates
- Fallback usage frequency
- Agent-specific performance
- User satisfaction by platform

**File Location**: `server/src/monitoring/agent-metrics.js`

```javascript
class AgentMetrics {
  constructor() {
    this.metrics = new Map();
  }

  recordResponse(agentType, platform, responseTime, success) {
    const key = `${agentType}-${platform}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        totalRequests: 0,
        successCount: 0,
        avgResponseTime: 0,
        lastUsed: null
      });
    }

    const metric = this.metrics.get(key);
    metric.totalRequests++;
    if (success) metric.successCount++;
    metric.avgResponseTime = (metric.avgResponseTime + responseTime) / 2;
    metric.lastUsed = new Date();
  }

  getPlatformHealth() {
    const health = {};
    this.metrics.forEach((metric, key) => {
      const [agent, platform] = key.split('-');
      if (!health[agent]) health[agent] = {};
      
      health[agent][platform] = {
        successRate: metric.successCount / metric.totalRequests,
        avgResponseTime: metric.avgResponseTime,
        totalRequests: metric.totalRequests,
        lastUsed: metric.lastUsed
      };
    });
    return health;
  }
}
```

---

## Security Considerations

### **Authentication & Authorization**
- Platform-specific API key management
- Secure credential storage
- Token rotation strategies
- Access control per agent type

### **Data Privacy**
- Message encryption in transit
- Platform-specific data handling policies
- Audit logging for compliance
- Data retention policies

---

## Conclusion

This integration management strategy provides a robust, flexible architecture for managing multiple AI agent platforms while maintaining a consistent user experience. The abstraction layer allows for easy platform switching, fallback mechanisms ensure reliability, and the configuration system enables environment-specific optimization.

**Key Benefits**:
- **Unified Interface**: Consistent frontend experience regardless of backend platform
- **Platform Agnostic**: Easy switching between LangChain, Flowise, n8n, and others
- **Fault Tolerant**: Automatic fallbacks and graceful degradation
- **Scalable**: Independent optimization and scaling per agent type
- **Maintainable**: Clean separation of concerns and centralized configuration

The architecture supports the modal button-driven agent specialization while providing the flexibility to use the best platform for each specific agent type.
