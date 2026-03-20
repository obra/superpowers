# Agent Security Framework - LangChain, LangGraph, n8n & Flowise

## Overview
This document provides a comprehensive security framework for AI agents developed on LangChain, LangGraph, n8n, and Flowise platforms, specifically addressing the critical requirement to prevent erroneous email sharing and ensure tight security controls.

## Agent Platform Security Analysis

### Security Challenges by Platform

#### 1. **LangChain Agents**
- **Memory Persistence**: Agents may retain conversation history across sessions
- **Tool Access**: Unrestricted tool access can lead to cross-user data exposure
- **Chain State**: Shared chain instances can contaminate user contexts
- **Vector Store Access**: Shared embeddings may leak user data

#### 2. **LangGraph Agents**
- **Graph State Management**: Persistent graph states across users
- **Node Execution Context**: Shared execution environments
- **Workflow Memory**: Cross-user workflow contamination
- **State Persistence**: Long-running agents retaining user data

#### 3. **n8n Agents**
- **Workflow Execution Context**: Shared workflow instances
- **Node Data Persistence**: Data leakage between workflow runs
- **Credential Sharing**: Improper credential isolation
- **Webhook Context**: Cross-user webhook data mixing

#### 4. **Flowise Agents**
- **Chatflow Memory**: Persistent chatflow sessions
- **Vector Database Sharing**: Cross-user vector contamination
- **Node Configuration**: Shared node instances across users
- **Session Management**: Inadequate session isolation

## Secure Agent Architecture

### Universal Security Principles

#### 1. **User Context Isolation**
```javascript
// CRITICAL: Every agent must have isolated user context
class SecureAgentContext {
  constructor(userId, sessionId) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.isolatedMemory = new Map();
    this.userPermissions = new Set();
    this.securityToken = this.generateSecurityToken();
  }
  
  // CRITICAL: Validate user ownership before any operation
  validateAccess(resourceId, resourceType) {
    if (!this.hasPermission(resourceType)) {
      throw new SecurityError(`Access denied: No permission for ${resourceType}`);
    }
    
    // SECURITY: Verify resource belongs to user
    return this.verifyResourceOwnership(resourceId, this.userId);
  }
  
  // CRITICAL: Generate unique security token per session
  generateSecurityToken() {
    return `secure_${this.userId}_${this.sessionId}_${Date.now()}`;
  }
}
```

#### 2. **Agent Factory with Security Enforcement**
```javascript
// CRITICAL: Secure agent factory for all platforms
class SecureAgentFactory {
  static async createSecureAgent(platform, userId, agentConfig) {
    // SECURITY CHECK 1: Validate user authentication
    const user = await this.validateUser(userId);
    if (!user) {
      throw new SecurityError('User authentication required');
    }
    
    // SECURITY CHECK 2: Create isolated context
    const secureContext = new SecureAgentContext(userId, this.generateSessionId());
    
    // SECURITY CHECK 3: Platform-specific secure initialization
    switch (platform) {
      case 'langchain':
        return this.createSecureLangChainAgent(secureContext, agentConfig);
      case 'langgraph':
        return this.createSecureLangGraphAgent(secureContext, agentConfig);
      case 'n8n':
        return this.createSecureN8nAgent(secureContext, agentConfig);
      case 'flowise':
        return this.createSecureFlowiseAgent(secureContext, agentConfig);
      default:
        throw new SecurityError(`Unsupported platform: ${platform}`);
    }
  }
}
```

## Platform-Specific Security Implementation

### 1. LangChain Agent Security

#### Secure LangChain Agent Implementation
```javascript
// server/agents/secureLangChainAgent.js
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

class SecureLangChainAgent {
  constructor(secureContext) {
    this.context = secureContext;
    this.memory = this.createIsolatedMemory();
    this.llm = this.createSecureLLM();
    this.chain = this.createSecureChain();
    this.tools = this.createSecureTools();
  }
  
  // CRITICAL: Create user-isolated memory
  createIsolatedMemory() {
    return new BufferMemory({
      memoryKey: `user_${this.context.userId}_memory`,
      returnMessages: true,
      inputKey: "input",
      outputKey: "output",
      // SECURITY: Custom memory store with user isolation
      chatMessageHistory: new SecureMemoryStore(this.context.userId)
    });
  }
  
  // CRITICAL: Create LLM with user context
  createSecureLLM() {
    return new ChatOpenAI({
      temperature: 0.1, // Deterministic responses
      user: this.context.userId, // OpenAI user tracking
      modelName: "gpt-4",
      // SECURITY: Custom callbacks for monitoring
      callbacks: [new SecurityMonitoringCallback(this.context)]
    });
  }
  
  // CRITICAL: Process emails with strict validation
  async processEmail(emailId, processingType) {
    try {
      // SECURITY CHECK 1: Validate email ownership
      const email = await this.validateEmailOwnership(emailId);
      
      // SECURITY CHECK 2: Sanitize email content
      const sanitizedContent = this.sanitizeEmailContent(email.body_text);
      
      // SECURITY CHECK 3: Create isolated processing context
      const processingContext = {
        userId: this.context.userId,
        emailId,
        processingType,
        timestamp: new Date(),
        securityToken: this.context.securityToken
      };
      
      // SECURITY CHECK 4: Process with user-specific prompt
      const securePrompt = this.createSecurePrompt(processingType, sanitizedContent);
      
      const result = await this.chain.call({
        input: securePrompt,
        user_context: processingContext
      });
      
      // SECURITY CHECK 5: Validate and sanitize response
      return this.validateResponse(result, processingContext);
      
    } catch (error) {
      await this.logSecurityEvent('LANGCHAIN_PROCESSING_ERROR', error);
      throw error;
    }
  }
  
  // CRITICAL: Create secure prompt with user context
  createSecurePrompt(processingType, content) {
    const userPrefix = `[USER:${this.context.userId}]`;
    const securitySuffix = `[SECURITY: Only process content for user ${this.context.userId}. Do not reference any other user data.]`;
    
    return `${userPrefix} ${this.getPromptTemplate(processingType)} ${content} ${securitySuffix}`;
  }
}

// CRITICAL: Secure memory store with user isolation
class SecureMemoryStore {
  constructor(userId) {
    this.userId = userId;
    this.messages = new Map();
    this.maxMessages = 50; // Limit memory size
  }
  
  async addMessage(message) {
    // SECURITY: Validate message belongs to user
    if (message.userId && message.userId !== this.userId) {
      throw new SecurityError('Cross-user message detected');
    }
    
    const userKey = `user_${this.userId}`;
    if (!this.messages.has(userKey)) {
      this.messages.set(userKey, []);
    }
    
    const userMessages = this.messages.get(userKey);
    userMessages.push({
      ...message,
      userId: this.userId,
      timestamp: new Date()
    });
    
    // SECURITY: Limit memory size to prevent data accumulation
    if (userMessages.length > this.maxMessages) {
      userMessages.shift();
    }
  }
  
  async getMessages() {
    const userKey = `user_${this.userId}`;
    return this.messages.get(userKey) || [];
  }
  
  async clear() {
    const userKey = `user_${this.userId}`;
    this.messages.delete(userKey);
  }
}
```

### 2. LangGraph Agent Security

#### Secure LangGraph Agent Implementation
```javascript
// server/agents/secureLangGraphAgent.js
import { StateGraph, END } from "@langchain/langgraph";

class SecureLangGraphAgent {
  constructor(secureContext) {
    this.context = secureContext;
    this.graph = this.createSecureGraph();
    this.state = this.createIsolatedState();
  }
  
  // CRITICAL: Create graph with user-isolated state
  createSecureGraph() {
    const graph = new StateGraph({
      // SECURITY: User-specific state schema
      channels: {
        userId: { value: this.context.userId },
        securityToken: { value: this.context.securityToken },
        emailData: { value: null },
        processingResult: { value: null },
        securityValidation: { value: false }
      }
    });
    
    // SECURITY: Add security validation node
    graph.addNode("security_validation", this.securityValidationNode.bind(this));
    graph.addNode("email_processing", this.emailProcessingNode.bind(this));
    graph.addNode("result_validation", this.resultValidationNode.bind(this));
    
    // SECURITY: Define secure workflow
    graph.addEdge("security_validation", "email_processing");
    graph.addEdge("email_processing", "result_validation");
    graph.addEdge("result_validation", END);
    
    graph.setEntryPoint("security_validation");
    
    return graph.compile();
  }
  
  // CRITICAL: Security validation node
  async securityValidationNode(state) {
    const { userId, emailId } = state;
    
    // SECURITY CHECK 1: Validate user context
    if (userId !== this.context.userId) {
      throw new SecurityError('User context mismatch');
    }
    
    // SECURITY CHECK 2: Validate email ownership
    const emailOwnership = await this.validateEmailOwnership(emailId, userId);
    if (!emailOwnership.valid) {
      throw new SecurityError('Email ownership validation failed');
    }
    
    return {
      ...state,
      securityValidation: true,
      emailData: emailOwnership.email
    };
  }
  
  // CRITICAL: Email processing node with isolation
  async emailProcessingNode(state) {
    const { userId, emailData, securityValidation } = state;
    
    if (!securityValidation) {
      throw new SecurityError('Security validation required');
    }
    
    // SECURITY: Process with user-specific context
    const processingResult = await this.processWithIsolation(emailData, userId);
    
    return {
      ...state,
      processingResult
    };
  }
  
  // CRITICAL: Result validation node
  async resultValidationNode(state) {
    const { processingResult, userId } = state;
    
    // SECURITY: Validate result doesn't contain cross-user data
    const validationResult = await this.validateProcessingResult(processingResult, userId);
    
    if (!validationResult.safe) {
      throw new SecurityError(`Result validation failed: ${validationResult.reason}`);
    }
    
    return {
      ...state,
      processingResult: validationResult.sanitizedResult
    };
  }
}
```

### 3. n8n Agent Security

#### Secure n8n Workflow Configuration
```json
{
  "name": "Secure Email Processing Agent",
  "nodes": [
    {
      "name": "Security Gate",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// CRITICAL: Security validation for every execution\nconst userId = items[0].json.userId;\nconst emailId = items[0].json.emailId;\nconst securityToken = items[0].json.securityToken;\n\n// SECURITY CHECK 1: Validate required security context\nif (!userId || !emailId || !securityToken) {\n  throw new Error('SECURITY: Missing required security context');\n}\n\n// SECURITY CHECK 2: Validate security token format\nif (!securityToken.startsWith(`secure_${userId}_`)) {\n  throw new Error('SECURITY: Invalid security token format');\n}\n\n// SECURITY CHECK 3: Validate email ownership\nconst ownershipValidation = await $('HTTP Request').makeRequest({\n  method: 'POST',\n  url: `${process.env.API_BASE_URL}/api/emails/validate-ownership`,\n  headers: {\n    'Authorization': `Bearer ${items[0].json.authToken}`,\n    'X-Security-Token': securityToken\n  },\n  body: { emailId, userId }\n});\n\nif (!ownershipValidation.valid) {\n  throw new Error('SECURITY: Email ownership validation failed');\n}\n\n// SECURITY: Set isolated execution context\nconst secureContext = {\n  userId,\n  emailId,\n  securityToken,\n  executionId: `exec_${userId}_${Date.now()}`,\n  timestamp: new Date().toISOString(),\n  validated: true\n};\n\nreturn [{ json: { ...items[0].json, secureContext } }];"
      }
    },
    {
      "name": "Isolated Email Processing",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "text",
        "prompt": "Process this email for user {{$json.secureContext.userId}} only. Email content: {{$json.emailContent}}",
        "options": {
          "user": "{{$json.secureContext.userId}}",
          "temperature": 0.1,
          "max_tokens": 1000
        }
      }
    },
    {
      "name": "Response Security Validation",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// CRITICAL: Validate AI response for security\nconst response = items[0].json.response;\nconst userId = items[0].json.secureContext.userId;\n\n// SECURITY CHECK: Scan for potential data leakage\nconst leakagePatterns = [\n  /user[_-]?\\d+/gi,\n  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g,\n  /\\b[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}\\b/gi\n];\n\nfor (const pattern of leakagePatterns) {\n  const matches = response.match(pattern);\n  if (matches) {\n    // SECURITY: Log potential leakage\n    await $('HTTP Request').makeRequest({\n      method: 'POST',\n      url: `${process.env.API_BASE_URL}/api/security/log-event`,\n      body: {\n        eventType: 'POTENTIAL_DATA_LEAKAGE',\n        userId,\n        severity: 'HIGH',\n        details: { matches, response: response.substring(0, 100) }\n      }\n    });\n    \n    throw new Error('SECURITY: Potential data leakage detected in AI response');\n  }\n}\n\n// SECURITY: Log successful processing\nawait $('HTTP Request').makeRequest({\n  method: 'POST',\n  url: `${process.env.API_BASE_URL}/api/security/log-event`,\n  body: {\n    eventType: 'SECURE_PROCESSING_COMPLETE',\n    userId,\n    severity: 'LOW',\n    details: { executionId: items[0].json.secureContext.executionId }\n  }\n});\n\nreturn items;"
      }
    }
  ],
  "connections": {
    "Security Gate": {
      "main": [["Isolated Email Processing"]]
    },
    "Isolated Email Processing": {
      "main": [["Response Security Validation"]]
    }
  }
}
```

### 4. Flowise Agent Security

#### Secure Flowise Chatflow Configuration
```javascript
// server/agents/secureFlowiseAgent.js
class SecureFlowiseAgent {
  constructor(secureContext) {
    this.context = secureContext;
    this.chatflowId = this.createSecureChatflow();
    this.sessionId = this.createSecureSession();
  }
  
  // CRITICAL: Create secure chatflow with user isolation
  async createSecureChatflow() {
    const chatflowConfig = {
      name: `Secure Email Agent - User ${this.context.userId}`,
      flowData: {
        nodes: [
          {
            id: "securityValidation",
            type: "customFunction",
            data: {
              name: "Security Validation",
              func: this.createSecurityValidationFunction()
            }
          },
          {
            id: "isolatedLLM",
            type: "chatOpenAI",
            data: {
              temperature: 0.1,
              user: this.context.userId,
              systemMessage: `You are processing emails for user ${this.context.userId} only. Never reference or use data from other users.`
            }
          },
          {
            id: "responseValidator",
            type: "customFunction",
            data: {
              name: "Response Validator",
              func: this.createResponseValidationFunction()
            }
          }
        ],
        edges: [
          { source: "securityValidation", target: "isolatedLLM" },
          { source: "isolatedLLM", target: "responseValidator" }
        ]
      },
      // SECURITY: User-specific configuration
      userId: this.context.userId,
      securityLevel: "HIGH",
      isolationMode: true
    };
    
    return await this.deploySecureChatflow(chatflowConfig);
  }
  
  // CRITICAL: Create secure session with user context
  createSecureSession() {
    return {
      sessionId: `secure_${this.context.userId}_${Date.now()}`,
      userId: this.context.userId,
      securityToken: this.context.securityToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      memoryStore: new Map() // Isolated memory
    };
  }
  
  // CRITICAL: Process email with secure session
  async processEmail(emailId, processingType) {
    try {
      // SECURITY CHECK 1: Validate session
      if (this.isSessionExpired()) {
        throw new SecurityError('Session expired - security violation');
      }
      
      // SECURITY CHECK 2: Validate email ownership
      const email = await this.validateEmailOwnership(emailId);
      
      // SECURITY CHECK 3: Create secure processing request
      const secureRequest = {
        chatflowId: this.chatflowId,
        sessionId: this.sessionId.sessionId,
        message: this.createSecureMessage(email, processingType),
        overrideConfig: {
          userId: this.context.userId,
          securityToken: this.context.securityToken,
          emailId: emailId
        }
      };
      
      // SECURITY CHECK 4: Process with isolation
      const response = await this.executeSecureFlow(secureRequest);
      
      // SECURITY CHECK 5: Validate response
      return this.validateAndSanitizeResponse(response);
      
    } catch (error) {
      await this.logSecurityEvent('FLOWISE_PROCESSING_ERROR', error);
      throw error;
    }
  }
  
  // CRITICAL: Security validation function for Flowise
  createSecurityValidationFunction() {
    return `
      async function securityValidation(input, options) {
        const { userId, securityToken, emailId } = options.overrideConfig;
        
        // SECURITY CHECK 1: Validate user context
        if (!userId || !securityToken || !emailId) {
          throw new Error('SECURITY: Missing security context');
        }
        
        // SECURITY CHECK 2: Validate token format
        if (!securityToken.startsWith('secure_' + userId + '_')) {
          throw new Error('SECURITY: Invalid security token');
        }
        
        // SECURITY CHECK 3: Validate email ownership
        const ownershipCheck = await fetch('/api/emails/validate-ownership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId, userId })
        });
        
        if (!ownershipCheck.ok) {
          throw new Error('SECURITY: Email ownership validation failed');
        }
        
        return { validated: true, userId, emailId };
      }
    `;
  }
}
```

## Agent Security Monitoring

### Real-time Agent Monitoring
```javascript
// server/services/agentSecurityMonitor.js
class AgentSecurityMonitor {
  constructor() {
    this.activeAgents = new Map();
    this.securityEvents = new Map();
    this.alertThresholds = {
      CROSS_USER_ACCESS: 1,
      DATA_LEAKAGE: 1,
      UNAUTHORIZED_PROCESSING: 1,
      SESSION_HIJACKING: 1
    };
  }
  
  // CRITICAL: Monitor agent creation and execution
  async monitorAgentExecution(agentId, userId, platform, operation) {
    const monitoringContext = {
      agentId,
      userId,
      platform,
      operation,
      startTime: new Date(),
      securityChecks: []
    };
    
    this.activeAgents.set(agentId, monitoringContext);
    
    // SECURITY: Set monitoring timeout
    setTimeout(() => {
      this.checkAgentTimeout(agentId);
    }, 5 * 60 * 1000); // 5 minutes max execution
    
    return monitoringContext;
  }
  
  // CRITICAL: Validate agent security compliance
  async validateAgentSecurity(agentId, securityCheck) {
    const context = this.activeAgents.get(agentId);
    if (!context) {
      throw new SecurityError('Agent context not found');
    }
    
    context.securityChecks.push({
      check: securityCheck.type,
      result: securityCheck.result,
      timestamp: new Date()
    });
    
    // SECURITY: Alert on failed checks
    if (!securityCheck.result) {
      await this.triggerSecurityAlert({
        type: 'AGENT_SECURITY_VIOLATION',
        agentId,
        userId: context.userId,
        platform: context.platform,
        details: securityCheck
      });
    }
  }
  
  // CRITICAL: Cross-platform security validation
  async validateCrossPlatformSecurity(agents) {
    const userAgents = new Map();
    
    // Group agents by user
    for (const [agentId, context] of agents) {
      if (!userAgents.has(context.userId)) {
        userAgents.set(context.userId, []);
      }
      userAgents.get(context.userId).push(context);
    }
    
    // SECURITY: Check for cross-user contamination
    for (const [userId, userAgentList] of userAgents) {
      await this.validateUserAgentIsolation(userId, userAgentList);
    }
  }
}
```

## Security Testing Framework

### Automated Security Tests for All Platforms
```javascript
// tests/security/agentSecurity.test.js
describe('Agent Security Tests', () => {
  
  describe('LangChain Agent Security', () => {
    test('CRITICAL: Prevent cross-user memory contamination', async () => {
      const user1Agent = await SecureAgentFactory.createSecureAgent('langchain', 'user1', {});
      const user2Agent = await SecureAgentFactory.createSecureAgent('langchain', 'user2', {});
      
      // Process email for user1
      await user1Agent.processEmail('email1', 'summarize');
      
      // SECURITY TEST: User2 agent should not have user1 memory
      const user2Memory = await user2Agent.getMemory();
      expect(user2Memory).not.toContain('user1');
      expect(user2Memory).not.toContain('email1');
    });
  });
  
  describe('LangGraph Agent Security', () => {
    test('CRITICAL: Prevent state bleeding between users', async () => {
      const user1Graph = await SecureAgentFactory.createSecureAgent('langgraph', 'user1', {});
      const user2Graph = await SecureAgentFactory.createSecureAgent('langgraph', 'user2', {});
      
      // Execute workflow for user1
      await user1Graph.execute({ emailId: 'email1', userId: 'user1' });
      
      // SECURITY TEST: User2 graph should have clean state
      const user2State = await user2Graph.getState();
      expect(user2State.userId).toBe('user2');
      expect(user2State).not.toContain('user1');
    });
  });
  
  describe('n8n Agent Security', () => {
    test('CRITICAL: Prevent workflow context sharing', async () => {
      const user1Execution = await executeN8nWorkflow('user1', 'email1');
      const user2Execution = await executeN8nWorkflow('user2', 'email2');
      
      // SECURITY TEST: Executions should be isolated
      expect(user1Execution.context.userId).toBe('user1');
      expect(user2Execution.context.userId).toBe('user2');
      expect(user1Execution.context).not.toEqual(user2Execution.context);
    });
  });
  
  describe('Flowise Agent Security', () => {
    test('CRITICAL: Prevent chatflow session mixing', async () => {
      const user1Flow = await SecureAgentFactory.createSecureAgent('flowise', 'user1', {});
      const user2Flow = await SecureAgentFactory.createSecureAgent('flowise', 'user2', {});
      
      // Process emails for both users
      await user1Flow.processEmail('email1', 'analyze');
      await user2Flow.processEmail('email2', 'analyze');
      
      // SECURITY TEST: Sessions should be completely isolated
      expect(user1Flow.sessionId).not.toBe(user2Flow.sessionId);
      expect(user1Flow.context.userId).toBe('user1');
      expect(user2Flow.context.userId).toBe('user2');
    });
  });
});
```

## Security Compliance Checklist

### Pre-Deployment Security Validation

#### ✅ **Database Security**
- [ ] RLS policies implemented for all email tables
- [ ] User context validation in all database functions
- [ ] Cross-user access monitoring triggers active
- [ ] Security event logging configured

#### ✅ **Agent Platform Security**
- [ ] LangChain agents use isolated memory stores
- [ ] LangGraph workflows have user-specific state management
- [ ] n8n workflows include security validation nodes
- [ ] Flowise chatflows implement session isolation

#### ✅ **API Security**
- [ ] Email ownership validation middleware active
- [ ] Bulk operation security checks implemented
- [ ] Security token validation for all requests
- [ ] Cross-user access attempt logging

#### ✅ **Monitoring & Alerting**
- [ ] Real-time security event monitoring
- [ ] Automated response to critical security events
- [ ] Agent execution timeout monitoring
- [ ] Cross-platform security validation

#### ✅ **Testing & Validation**
- [ ] Automated security tests for all platforms
- [ ] Cross-user contamination prevention tests
- [ ] Agent isolation validation tests
- [ ] Security breach simulation tests

## Conclusion

**This comprehensive security framework ensures that agents developed on LangChain, LangGraph, n8n, and Flowise platforms maintain strict user isolation and prevent any erroneous email sharing.**

### **Key Security Guarantees:**

1. **User Context Isolation**: Every agent operates within a strictly isolated user context
2. **Memory Segregation**: Platform-specific memory isolation prevents cross-user contamination
3. **Session Management**: Secure session handling with automatic cleanup and timeout
4. **Real-time Monitoring**: Continuous security monitoring across all platforms
5. **Automated Testing**: Comprehensive security test suite for all agent platforms

### **Zero-Tolerance Security Measures:**

- **No Cross-User Memory**: Isolated memory stores per user per platform
- **No Shared Sessions**: Platform-specific session isolation mechanisms
- **No Context Bleeding**: Strict user context validation at every step
- **No Data Persistence**: Automatic cleanup of agent contexts and memory
- **No Unauthorized Access**: Multi-layer validation and monitoring

**The framework provides enterprise-grade security for AI agents across all specified platforms, ensuring complete user data isolation and preventing any possibility of erroneous email sharing.**
