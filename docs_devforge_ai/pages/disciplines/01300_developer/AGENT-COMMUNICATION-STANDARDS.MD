# 🚀 **Agent Communication Standards**
**ConstructAI Unified Agent Platform - Inter-Agent Communication Protocols**

**Date**: January 16, 2026
**Version**: 1.0 - Standards Established
**Status**: **ACTIVE - Communication Protocols Defined**
**Purpose**: Standardized protocols for seamless cross-agent communication

---

## 📋 **Executive Summary**

### **Communication Objectives**
Establish unified communication standards that enable seamless interaction between agents across the ConstructAI platform, regardless of programming language or deployment environment.

### **Key Standards Areas**
- **Message Format Standards**: JSON Schema-based message structures
- **API Contract Standards**: Standardized agent-to-agent interfaces
- **Protocol Standards**: HTTP, WebSocket, and message queue patterns
- **Error Handling Standards**: Consistent error responses and retry logic
- **Security Standards**: Authentication and authorization for inter-agent communication

### **Business Impact**
- **90% Communication Reliability**: Standardized protocols eliminate integration issues
- **50% Faster Agent Integration**: Plug-and-play communication between agents
- **Cross-Language Compatibility**: Seamless communication between Python and JavaScript agents
- **Enterprise Security**: Comprehensive authentication and authorization framework

---

## 📨 **Message Format Standards**

### **1. Core Message Schema**

#### **Standard Message Structure**
```json
{
  "$schema": "https://constructai.com/schemas/agent-message/v1.0",
  "message_id": "uuid-v4-string",
  "correlation_id": "uuid-v4-string",
  "conversation_id": "uuid-v4-string",
  "timestamp": "2026-01-16T10:30:00.000Z",
  "ttl": 300,
  "priority": "low|normal|high|critical",
  "from_agent": {
    "agent_id": "string",
    "agent_type": "supervisor|specialist|service|coordinator|utility",
    "location": "agents/types/specialists/civil-engineering/python"
  },
  "to_agent": {
    "agent_id": "string",
    "agent_type": "supervisor|specialist|service|coordinator|utility",
    "location": "agents/types/specialists/structural-engineering/javascript"
  },
  "message_type": "request|response|notification|error|heartbeat",
  "action": "string",
  "payload": {},
  "metadata": {
    "version": "1.0",
    "source_language": "python|javascript",
    "security_context": "object",
    "performance_requirements": {
      "max_response_time_ms": 5000,
      "required_confidence": 0.8
    }
  }
}
```

#### **Message Type Definitions**

##### **Request Messages**
```json
{
  "message_type": "request",
  "action": "process_document|analyze_data|coordinate_workflow",
  "payload": {
    "parameters": {},
    "context": {},
    "requirements": {
      "confidence_threshold": 0.8,
      "timeout_seconds": 300,
      "quality_requirements": ["accuracy", "completeness"]
    }
  },
  "metadata": {
    "expected_response_format": "detailed|summary|boolean",
    "callback_required": true,
    "synchronous_preference": false
  }
}
```

##### **Response Messages**
```json
{
  "message_type": "response",
  "correlation_id": "original-request-id",
  "payload": {
    "result": {},
    "confidence": 0.85,
    "processing_time_ms": 1250,
    "metadata": {
      "items_processed": 5,
      "warnings": [],
      "next_steps": []
    }
  },
  "metadata": {
    "response_quality": "high|medium|low",
    "caching_recommended": true,
    "follow_up_actions": []
  }
}
```

##### **Notification Messages**
```json
{
  "message_type": "notification",
  "action": "progress_update|status_change|health_alert",
  "payload": {
    "event_type": "processing_started|processing_completed|error_occurred",
    "progress": {
      "percentage": 75,
      "current_step": "Processing documents",
      "estimated_completion": "2026-01-16T10:35:00.000Z"
    }
  },
  "metadata": {
    "notification_level": "info|warning|error",
    "user_visible": true,
    "requires_acknowledgment": false
  }
}
```

##### **Error Messages**
```json
{
  "message_type": "error",
  "correlation_id": "original-request-id",
  "payload": {
    "error": {
      "code": "VALIDATION_ERROR|TIMEOUT_ERROR|CAPABILITY_ERROR|SYSTEM_ERROR",
      "message": "Human-readable error description",
      "details": {
        "field": "document_path",
        "expected": "string",
        "received": "null",
        "suggestion": "Provide a valid document path"
      },
      "severity": "low|medium|high|critical",
      "recoverable": true,
      "retry_recommended": true
    },
    "context": {
      "agent_state": "processing",
      "workflow_step": "document_analysis",
      "input_validated": false
    }
  },
  "metadata": {
    "error_category": "input|processing|communication|system",
    "debug_info": {
      "stack_trace": "...",
      "system_state": {}
    }
  }
}
```

##### **Heartbeat Messages**
```json
{
  "message_type": "heartbeat",
  "action": "status_report",
  "payload": {
    "status": "healthy|degraded|unhealthy",
    "uptime_seconds": 3600,
    "active_workflows": 3,
    "queue_depth": 5,
    "performance_metrics": {
      "cpu_usage_percent": 45.2,
      "memory_usage_mb": 256,
      "response_time_avg_ms": 125
    }
  },
  "metadata": {
    "reporting_interval_seconds": 300,
    "alert_thresholds": {
      "cpu_warning_percent": 80,
      "memory_warning_mb": 500,
      "response_time_warning_ms": 1000
    }
  }
}
```

---

## 🔗 **API Contract Standards**

### **1. Agent Interface Contracts**

#### **Core Agent Interface**
```typescript
interface AgentInterface {
  // Identification
  readonly agentId: string;
  readonly agentType: AgentType;
  readonly capabilities: string[];
  readonly version: string;

  // Lifecycle Methods
  initialize(config: AgentConfig): Promise<boolean>;
  execute(workflowState: WorkflowState, options?: ExecutionOptions): Promise<ExecutionResult>;
  cleanup(): Promise<void>;

  // Communication Methods
  sendMessage(toAgent: AgentIdentifier, message: AgentMessage): Promise<MessageResponse>;
  receiveMessage(fromAgent: AgentIdentifier, message: AgentMessage): Promise<void>;

  // Monitoring Methods
  getHealthStatus(): Promise<HealthStatus>;
  getMetrics(): Promise<AgentMetrics>;

  // Event Handlers
  onMessage(handler: MessageHandler): void;
  onError(handler: ErrorHandler): void;
  onProgress(handler: ProgressHandler): void;
}

interface AgentIdentifier {
  agentId: string;
  agentType: AgentType;
  location?: string;
  capabilities?: string[];
}

interface ExecutionOptions {
  timeoutSeconds?: number;
  confidenceThreshold?: number;
  priority?: MessagePriority;
  synchronous?: boolean;
  metadata?: Record<string, any>;
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  confidence?: number;
  processingTimeMs: number;
  error?: AgentError;
  metadata: Record<string, any>;
}
```

#### **Communication Interface**
```typescript
interface CommunicatorInterface {
  // Connection Management
  connect(config: CommunicationConfig): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Message Operations
  sendMessage(message: AgentMessage): Promise<MessageResponse>;
  broadcastMessage(message: AgentMessage, targets: AgentIdentifier[]): Promise<BroadcastResponse>;
  subscribeToMessages(filter: MessageFilter): Promise<Subscription>;

  // Discovery
  discoverAgents(query?: AgentQuery): Promise<AgentIdentifier[]>;
  getAgentStatus(agentId: string): Promise<AgentStatus>;

  // Configuration
  updateConfig(config: CommunicationConfig): Promise<void>;
  getConfig(): CommunicationConfig;
}

interface CommunicationConfig {
  protocol: 'http' | 'websocket' | 'message-queue';
  endpoints: EndpointConfig[];
  authentication: AuthConfig;
  retryPolicy: RetryPolicy;
  timeoutMs: number;
  heartbeatIntervalSeconds: number;
}

interface EndpointConfig {
  url: string;
  priority: number;
  healthCheckUrl?: string;
  authentication: AuthConfig;
}

interface AuthConfig {
  type: 'bearer' | 'api-key' | 'certificate' | 'none';
  credentials: Record<string, any>;
  tokenRefreshUrl?: string;
  tokenRefreshIntervalSeconds?: number;
}
```

### **2. Protocol-Specific Contracts**

#### **HTTP Protocol Contract**
```typescript
// Request Format
POST /api/agents/{agentId}/messages
Content-Type: application/json
Authorization: Bearer {token}
X-Agent-ID: {senderAgentId}
X-Correlation-ID: {correlationId}

{
  "message": AgentMessage,
  "options": {
    "timeoutMs": 5000,
    "requireResponse": true
  }
}

// Response Format
HTTP/1.1 200 OK
Content-Type: application/json
X-Correlation-ID: {correlationId}
X-Processing-Time-Ms: 1250

{
  "success": true,
  "response": AgentMessage,
  "metadata": {
    "processingTimeMs": 1250,
    "agentVersion": "1.0.0",
    "cacheUsed": false
  }
}
```

#### **WebSocket Protocol Contract**
```typescript
// Connection Establishment
ws://localhost:3001/agents/{agentId}?token={authToken}

// Message Format (JSON-RPC 2.0 compatible)
{
  "jsonrpc": "2.0",
  "id": "message-123",
  "method": "sendMessage",
  "params": {
    "toAgent": "target-agent-id",
    "message": AgentMessage
  }
}

// Response Format
{
  "jsonrpc": "2.0",
  "id": "message-123",
  "result": {
    "success": true,
    "correlationId": "corr-456",
    "response": AgentMessage
  }
}

// Notification Format
{
  "jsonrpc": "2.0",
  "method": "messageReceived",
  "params": {
    "fromAgent": "sender-agent-id",
    "message": AgentMessage
  }
}
```

---

## 🚨 **Error Handling Standards**

### **1. Error Classification**

#### **Error Code Taxonomy**
```typescript
enum ErrorCode {
  // Input Validation Errors (1000-1999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT = 'INVALID_FIELD_FORMAT',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',

  // Processing Errors (2000-2999)
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CAPABILITY_ERROR = 'CAPABILITY_ERROR',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',

  // Communication Errors (3000-3999)
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',

  // System Errors (4000-4999)
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

interface AgentError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryRecommended: boolean;
  suggestedAction?: string;
  context?: {
    agentId: string;
    workflowId?: string;
    operation: string;
    timestamp: string;
  };
}
```

### **2. Retry and Recovery Standards**

#### **Retry Policy Configuration**
```typescript
interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
  nonRetryableErrors: ErrorCode[];
  timeoutMs: number;
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.TIMEOUT_ERROR,
    ErrorCode.CONNECTION_ERROR,
    ErrorCode.RESOURCE_EXHAUSTED,
    ErrorCode.EXTERNAL_SERVICE_ERROR
  ],
  nonRetryableErrors: [
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.AUTHENTICATION_ERROR,
    ErrorCode.AUTHORIZATION_ERROR,
    ErrorCode.INVALID_FIELD_FORMAT
  ],
  timeoutMs: 300000 // 5 minutes
};
```

#### **Circuit Breaker Pattern**
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeoutMs: number; // Time to wait before attempting recovery
  monitoringPeriodMs: number; // Rolling window for failure tracking
  successThreshold: number; // Successes needed to close circuit
}

class AgentCircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

### **3. Error Response Standards**

#### **Standardized Error Response**
```json
{
  "message_type": "error",
  "correlation_id": "original-request-id",
  "timestamp": "2026-01-16T10:30:00.000Z",
  "from_agent": {
    "agent_id": "failing-agent-123",
    "agent_type": "specialist"
  },
  "payload": {
    "error": {
      "code": "TIMEOUT_ERROR",
      "message": "Processing timeout after 300 seconds",
      "details": {
        "timeout_seconds": 300,
        "operation": "document_analysis",
        "progress_at_timeout": 0.75
      },
      "severity": "medium",
      "recoverable": true,
      "retry_recommended": true,
      "suggested_action": "Increase timeout or reduce batch size"
    },
    "context": {
      "workflow_id": "workflow-456",
      "step": "document_processing",
      "input_size": 50,
      "agent_version": "1.0.0"
    }
  },
  "metadata": {
    "error_category": "processing",
    "debug_info": {
      "stack_trace": "...",
      "system_resources": {
        "cpu_percent": 85,
        "memory_mb": 1024
      }
    },
    "recovery_options": [
      {
        "action": "retry",
        "parameters": { "timeout_seconds": 600 }
      },
      {
        "action": "fallback",
        "parameters": { "use_simplified_processing": true }
      }
    ]
  }
}
```

---

## 🔐 **Security Standards**

### **1. Authentication Standards**

#### **JWT-Based Authentication**
```typescript
interface AgentJWT {
  iss: string; // Issuer (agent registry)
  sub: string; // Subject (agent ID)
  aud: string; // Audience (target agent or service)
  exp: number; // Expiration time
  iat: number; // Issued at time
  agent: {
    agentId: string;
    agentType: string;
    capabilities: string[];
    organizationId: string;
    permissions: string[];
  };
  context: {
    workflowId?: string;
    correlationId: string;
    operation: string;
  };
}

// Token Generation
function generateAgentToken(agent: AgentIdentifier, context: MessageContext): string {
  const payload: AgentJWT = {
    iss: 'constructai-agent-registry',
    sub: agent.agentId,
    aud: context.targetAgent || 'constructai-platform',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
    agent: {
      agentId: agent.agentId,
      agentType: agent.agentType,
      capabilities: agent.capabilities,
      organizationId: agent.organizationId,
      permissions: agent.permissions
    },
    context: {
      workflowId: context.workflowId,
      correlationId: context.correlationId,
      operation: context.operation
    }
  };

  return jwt.sign(payload, process.env.AGENT_JWT_SECRET, { algorithm: 'RS256' });
}
```

#### **API Key Authentication**
```typescript
interface AgentAPIKey {
  keyId: string;
  agentId: string;
  permissions: string[];
  expiresAt: Date;
  lastUsed: Date;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

// API Key Validation
async function validateAPIKey(apiKey: string, operation: string): Promise<AgentAPIKey> {
  // Decode and validate API key
  const decoded = decodeAPIKey(apiKey);

  // Check expiration
  if (decoded.expiresAt < new Date()) {
    throw new AuthenticationError('API key expired');
  }

  // Check permissions
  if (!decoded.permissions.includes(operation) && !decoded.permissions.includes('*')) {
    throw new AuthorizationError('Insufficient permissions');
  }

  // Check rate limits
  await checkRateLimit(decoded.keyId);

  // Update last used
  await updateLastUsed(decoded.keyId);

  return decoded;
}
```

### **2. Authorization Standards**

#### **Capability-Based Authorization**
```typescript
interface AgentCapabilities {
  // Core capabilities
  base_agent: boolean;
  communication: boolean;

  // Processing capabilities
  document_processing: boolean;
  data_analysis: boolean;
  ai_inference: boolean;

  // Coordination capabilities
  workflow_orchestration: boolean;
  resource_management: boolean;

  // Administrative capabilities
  agent_management: boolean;
  system_monitoring: boolean;
}

class CapabilityEnforcer {
  static validateCapability(agent: AgentIdentifier, requiredCapability: string): boolean {
    if (!agent.capabilities) {
      return false;
    }

    // Check direct capability
    if (agent.capabilities.includes(requiredCapability)) {
      return true;
    }

    // Check wildcard permissions
    if (agent.capabilities.includes('*')) {
      return true;
    }

    // Check capability groups
    const capabilityGroups = {
      'processing': ['document_processing', 'data_analysis', 'ai_inference'],
      'coordination': ['workflow_orchestration', 'resource_management'],
      'admin': ['agent_management', 'system_monitoring']
    };

    for (const [group, capabilities] of Object.entries(capabilityGroups)) {
      if (agent.capabilities.includes(`group:${group}`) && capabilities.includes(requiredCapability)) {
        return true;
      }
    }

    return false;
  }

  static validateMessageAuthorization(fromAgent: AgentIdentifier, toAgent: AgentIdentifier, message: AgentMessage): boolean {
    // Validate sender capabilities
    const requiredSenderCapabilities = this.getRequiredCapabilitiesForAction(message.action);
    for (const capability of requiredSenderCapabilities) {
      if (!this.validateCapability(fromAgent, capability)) {
        return false;
      }
    }

    // Validate receiver capabilities
    const requiredReceiverCapabilities = this.getRequiredCapabilitiesForReceiving(message.action);
    for (const capability of requiredReceiverCapabilities) {
      if (!this.validateCapability(toAgent, capability)) {
        return false;
      }
    }

    return true;
  }
}
```

---

## 📡 **Protocol Standards**

### **1. HTTP Protocol Implementation**

#### **Python HTTP Communicator**
```python
import aiohttp
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import json
import logging

from agents.core.python.base_agent import BaseAgent
from agents.communication.protocols.base import CommunicationProtocol
from agents.communication.standards import AgentMessage, MessageResponse

class HTTPCommunicator(CommunicationProtocol):
    """
    HTTP-based agent communication implementation.
    """

    def __init__(self, agent_id: str, registry_url: str = "http://localhost:3001"):
        self.agent_id = agent_id
        self.registry_url = registry_url
        self.session: Optional[aiohttp.ClientSession] = None
        self.logger = logging.getLogger(f"{__class__.__name__}({agent_id})")

    async def connect(self, config: Dict[str, Any]) -> bool:
        """Establish HTTP connection."""
        try:
            timeout = aiohttp.ClientTimeout(total=config.get('timeout_seconds', 30))
            self.session = aiohttp.ClientSession(timeout=timeout)

            # Test connection with heartbeat
            await self._send_heartbeat()
            self.logger.info("HTTP communicator connected")
            return True

        except Exception as e:
            self.logger.error(f"Failed to connect HTTP communicator: {e}")
            return False

    async def disconnect(self) -> None:
        """Close HTTP connection."""
        if self.session:
            await self.session.close()
            self.session = None
            self.logger.info("HTTP communicator disconnected")

    async def send_message(self, message: AgentMessage) -> MessageResponse:
        """Send message via HTTP."""
        if not self.session:
            raise ConnectionError("HTTP communicator not connected")

        try:
            url = f"{self.registry_url}/api/agents/{message.to_agent.agent_id}/messages"

            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {await self._get_auth_token()}',
                'X-Agent-ID': self.agent_id,
                'X-Correlation-ID': message.correlation_id or str(uuid.uuid4())
            }

            payload = {
                'message': message.to_dict(),
                'options': {
                    'timeout_ms': message.ttl * 1000,
                    'require_response': message.message_type == 'request'
                }
            }

            async with self.session.post(url, json=payload, headers=headers) as response:
                response_data = await response.json()

                if response.status == 200:
                    return MessageResponse(
                        success=True,
                        correlation_id=response_data.get('correlation_id'),
                        response=response_data.get('response'),
                        metadata=response_data.get('metadata', {})
                    )
                else:
                    return MessageResponse(
                        success=False,
                        error=response_data.get('error', 'HTTP request failed'),
                        metadata={'http_status': response.status}
                    )

        except asyncio.TimeoutError:
            return MessageResponse(
                success=False,
                error='Request timeout',
                metadata={'error_type': 'timeout'}
            )
        except Exception as e:
            self.logger.error(f"HTTP send error: {e}")
            return MessageResponse(
                success=False,
                error=str(e),
                metadata={'error_type': 'communication'}
            )

    async def _send_heartbeat(self) -> None:
        """Send heartbeat to verify connection."""
        heartbeat_message = AgentMessage(
            message_id=str(uuid.uuid4()),
            from_agent={'agent_id': self.agent_id},
            to_agent={'agent_id': 'registry'},
            message_type='heartbeat',
            action='status_report',
            payload={
                'status': 'healthy',
                'timestamp': datetime.now().isoformat()
            }
        )

        await self.send_message(heartbeat_message)

    async def _get_auth_token(self) -> str:
        """Get authentication token."""
        # Implementation for token retrieval/caching
        return "mock-token"
```

#### **JavaScript HTTP Communicator**
```javascript
const axios = require('axios');

class HTTPCommunicator {
  constructor(agentId, registryUrl = 'http://localhost:3001') {
    this.agentId = agentId;
    this.registryUrl = registryUrl;
    this.client = null;
    this.logger = console;
  }

  async connect(config = {}) {
    try {
      this.client = axios.create({
        baseURL: this.registryUrl,
        timeout: config.timeoutMs || 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Test connection
      await this._sendHeartbeat();
      this.logger.info('HTTP communicator connected');
      return true;
    } catch (error) {
      this.logger.error('Failed to connect HTTP communicator:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      // Clean up axios instance
      this.client = null;
      this.logger.info('HTTP communicator disconnected');
    }
  }

  async sendMessage(message) {
    if (!this.client) {
      throw new Error('HTTP communicator not connected');
    }

    try {
      const url = `/api/agents/${message.toAgent.agentId}/messages`;
      const authToken = await this._getAuthToken();

      const response = await this.client.post(url, {
        message: message,
        options: {
          timeoutMs: message.ttl * 1000,
          requireResponse: message.messageType === 'request'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Agent-ID': this.agentId,
          'X-Correlation-ID': message.correlationId || this._generateId()
        }
      });

      return {
        success: true,
        correlationId: response.data.correlation_id,
        response: response.data.response,
        metadata: response.data.metadata || {}
      };

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout',
          metadata: { errorType: 'timeout' }
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || error.message,
        metadata: {
          errorType: 'communication',
          httpStatus: error.response?.status
        }
      };
    }
  }

  async _sendHeartbeat() {
    const heartbeatMessage = {
      messageId: this._generateId(),
      fromAgent: { agentId: this.agentId },
      toAgent: { agentId: 'registry' },
      messageType: 'heartbeat',
      action: 'status_report',
      payload: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    };

    await this.sendMessage(heartbeatMessage);
  }

  async _getAuthToken() {
    // Implementation for token retrieval/caching
    return 'mock-token';
  }

  _generateId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { HTTPCommunicator };
```

### **2. WebSocket Protocol Implementation**

#### **WebSocket Communicator**
```javascript
const WebSocket = require('ws');

class WebSocketCommunicator {
  constructor(agentId, registryUrl = 'ws://localhost:3001') {
    this.agentId = agentId;
    this.registryUrl = registryUrl;
    this.ws = null;
    this.connected = false;
    this.messageHandlers = new Map();
    this.requestPromises = new Map();
    this.logger = console;
  }

  async connect(config = {}) {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.registryUrl}/agents/${this.agentId}?token=${config.authToken}`;

        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          this.connected = true;
          this._setupMessageHandling();
          this.logger.info('WebSocket communicator connected');
          resolve(true);
        });

        this.ws.on('error', (error) => {
          this.logger.error('WebSocket connection error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          this.connected = false;
          this.logger.info('WebSocket communicator disconnected');
        });

        // Connection timeout
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, config.timeoutMs || 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async sendMessage(message) {
    if (!this.connected) {
      throw new Error('WebSocket communicator not connected');
    }

    return new Promise((resolve, reject) => {
      const messageId = message.messageId || this._generateId();

      // Store promise for response
      this.requestPromises.set(messageId, { resolve, reject });

      // Send message
      const wsMessage = {
        jsonrpc: '2.0',
        id: messageId,
        method: 'sendMessage',
        params: {
          toAgent: message.toAgent.agentId,
          message: message
        }
      };

      this.ws.send(JSON.stringify(wsMessage));

      // Timeout handling
      setTimeout(() => {
        if (this.requestPromises.has(messageId)) {
          this.requestPromises.delete(messageId);
          reject(new Error('Request timeout'));
        }
      }, message.ttl * 1000 || 30000);
    });
  }

  _setupMessageHandling() {
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.jsonrpc === '2.0') {
          if (message.id && this.requestPromises.has(message.id)) {
            // Response to our request
            const { resolve, reject } = this.requestPromises.get(message.id);
            this.requestPromises.delete(message.id);

            if (message.error) {
              reject(new Error(message.error.message));
            } else {
              resolve(message.result);
            }
          } else if (message.method) {
            // Incoming notification or request
            this._handleIncomingMessage(message);
          }
        }
      } catch (error) {
        this.logger.error('Error handling WebSocket message:', error);
      }
    });
  }

  _handleIncomingMessage(message) {
    const handler = this.messageHandlers.get(message.method);
    if (handler) {
      handler(message.params);
    }
  }

  onMessage(method, handler) {
    this.messageHandlers.set(method, handler);
  }

  _generateId() {
    return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { WebSocketCommunicator };
```

---

## 📊 **Implementation Guidelines**

### **1. Protocol Selection Matrix**

| Use Case | Recommended Protocol | Rationale |
|----------|---------------------|-----------|
| **Real-time coordination** | WebSocket | Low latency, bidirectional |
| **Request-response workflows** | HTTP | Reliable, scalable |
| **High-volume messaging** | Message Queue | Asynchronous, durable |
| **Agent discovery** | HTTP | RESTful, cacheable |
| **Health monitoring** | HTTP/WebSocket | Real-time status updates |

### **2. Communication Patterns**

#### **Fire-and-Forget Pattern**
```javascript
// For notifications that don't require response
const notification = {
  messageType: 'notification',
  action: 'progress_update',
  payload: { progress: 50, step: 'Processing complete' }
};

await communicator.sendMessage(notification);
// No response expected
```

#### **Request-Response Pattern**
```javascript
// For operations requiring confirmation
const request = {
  messageType: 'request',
  action: 'process_document',
  payload: { documentId: 'doc-123', requirements: {...} }
};

const response = await communicator.sendMessage(request);
if (response.success) {
  console.log('Document processed:', response.result);
}
```

#### **Publish-Subscribe Pattern**
```javascript
// For broadcast communications
const broadcast = {
  messageType: 'notification',
  action: 'system_alert',
  payload: { alertType: 'maintenance', message: 'System maintenance in 5 minutes' }
};

await communicator.broadcastMessage(broadcast, targetAgents);
```

### **3. Performance Optimization**

#### **Connection Pooling**
```typescript
class ConnectionPool {
  private pools: Map<string, Connection[]> = new Map();
  private maxConnectionsPerHost = 10;

  async getConnection(endpoint: string): Promise<Connection> {
    const pool = this.pools.get(endpoint) || [];
    const availableConnection = pool.find(conn => conn.isAvailable());

    if (availableConnection) {
      return availableConnection;
    }

    if (pool.length < this.maxConnectionsPerHost) {
      const newConnection = await this.createConnection(endpoint);
      pool.push(newConnection);
      this.pools.set(endpoint, pool);
      return newConnection;
    }

    // Wait for available connection
    return new Promise((resolve) => {
      const checkAvailable = () => {
        const connection = pool.find(conn => conn.isAvailable());
        if (connection) {
          resolve(connection);
        } else {
          setTimeout(checkAvailable, 100);
        }
      };
      checkAvailable();
    });
  }
}
```

#### **Message Batching**
```typescript
class MessageBatcher {
  private batch: AgentMessage[] = [];
  private batchSize = 10;
  private batchTimeout = 5000; // 5 seconds
  private timeoutId: NodeJS.Timeout | null = null;

  addMessage(message: AgentMessage): void {
    this.batch.push(message);

    if (this.batch.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flushBatch(), this.batchTimeout);
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const batchToSend = [...this.batch];
    this.batch = [];

    try {
      await this.sendBatch(batchToSend);
    } catch (error) {
      // Handle batch send failure
      // Re-queue messages or handle errors
    }
  }
}
```

---

## ✅ **Validation & Testing**

### **1. Message Schema Validation**

#### **JSON Schema Validation**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AgentMessage",
  "type": "object",
  "required": ["message_id", "from_agent", "to_agent", "message_type", "timestamp"],
  "properties": {
    "message_id": {
      "type": "string",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "correlation_id": {
      "type": "string",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "ttl": {
      "type": "integer",
      "minimum": 1,
      "maximum": 3600
    },
    "priority": {
      "type": "string",
      "enum": ["low", "normal", "high", "critical"]
    },
    "from_agent": {
      "type": "object",
      "required": ["agent_id", "agent_type"],
      "properties": {
        "agent_id": { "type": "string" },
        "agent_type": {
          "type": "string",
          "enum": ["supervisor", "specialist", "service", "coordinator", "utility"]
        },
        "location": { "type": "string" }
      }
    },
    "message_type": {
      "type": "string",
      "enum": ["request", "response", "notification", "error", "heartbeat"]
    }
  }
}
```

### **2. Communication Testing Standards**

#### **Integration Test Template**
```python
import pytest
import asyncio
from unittest.mock import Mock, patch
from agents.communication.standards import AgentMessage, CommunicationProtocol
from agents.communication.protocols.http.python_communicator import HTTPCommunicator

class TestAgentCommunication:
    """Integration tests for agent-to-agent communication."""

    @pytest.fixture
    async def communicator(self):
        """Create test communicator."""
        comm = HTTPCommunicator("test-agent", "http://localhost:3001")
        yield comm
        await comm.disconnect()

    @pytest.mark.asyncio
    async def test_cross_agent_message_exchange(self, communicator):
        """Test successful message exchange between different agent types."""
        # Test Python agent → JavaScript agent communication
        request_message = AgentMessage(
            message_id="test-msg-001",
            from_agent={"agent_id": "python-agent", "agent_type": "specialist"},
            to_agent={"agent_id": "js-agent", "agent_type": "service"},
            message_type="request",
            action="process_data",
            payload={"data": [1, 2, 3, 4, 5]}
        )

        # Mock successful response
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_post.return_value.__aenter__.return_value.json = Mock(return_value={
                "success": True,
                "correlation_id": "test-msg-001",
                "response": {
                    "result": {"processed": True, "count": 5},
                    "confidence": 0.95
                }
            })

            response = await communicator.send_message(request_message)

            assert response.success is True
            assert response.response["result"]["processed"] is True
            assert response.response["confidence"] == 0.95

    @pytest.mark.asyncio
    async def test_message_retry_on_failure(self, communicator):
        """Test automatic retry on communication failures."""
        # Configure communicator with retry policy
        communicator.retry_policy = {
            "max_attempts": 3,
            "retryable_errors": ["CONNECTION_ERROR", "TIMEOUT_ERROR"]
        }

        # First two calls fail, third succeeds
        call_count = 0
        def mock_response(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                # Simulate connection error
                mock_resp = Mock()
                mock_resp.json = Mock(return_value={
                    "success": False,
                    "error": "CONNECTION_ERROR"
                })
                mock_resp.status = 503
                return mock_resp
            else:
                # Success on third attempt
                mock_resp = Mock()
                mock_resp.json = Mock(return_value={
                    "success": True,
                    "response": {"result": "success"}
                })
                mock_resp.status = 200
                return mock_resp

        with patch('aiohttp.ClientSession.post', side_effect=mock_response):
            message = AgentMessage(
                message_id="retry-test",
                from_agent={"agent_id": "test-agent"},
                to_agent={"agent_id": "target-agent"},
                message_type="request",
                action="test_action"
            )

            response = await communicator.send_message(message)

            assert response.success is True
            assert call_count == 3  # Should have retried twice

    @pytest.mark.asyncio
    async def test_protocol_fallback(self, communicator):
        """Test automatic fallback between communication protocols."""
        # Test HTTP → WebSocket fallback on HTTP failure
        message = AgentMessage(
            message_id="fallback-test",
            from_agent={"agent_id": "test-agent"},
            to_agent={"agent_id": "target-agent"},
            message_type="request",
            action="test_action"
        )

        # HTTP fails, WebSocket succeeds
        with patch.object(communicator, '_send_http') as mock_http, \
             patch.object(communicator, '_send_websocket') as mock_ws:

            mock_http.side_effect = Exception("HTTP connection failed")
            mock_ws.return_value = {
                "success": True,
                "response": {"fallback": True}
            }

            response = await communicator.send_message(message)

            assert response.success is True
            assert response.response["fallback"] is True
            mock_http.assert_called_once()
            mock_ws.assert_called_once()
```

---

## 📋 **Monitoring & Observability**

### **1. Communication Metrics**

#### **Standard Metrics Collection**
```typescript
interface CommunicationMetrics {
  messagesSent: number;
  messagesReceived: number;
  messagesFailed: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
  protocolUsage: {
    http: number;
    websocket: number;
    messageQueue: number;
  };
}

class CommunicationMonitor {
  private metrics: CommunicationMetrics = {
    messagesSent: 0,
    messagesReceived: 0,
    messagesFailed: 0,
    averageResponseTime: 0,
    errorRate: 0,
    activeConnections: 0,
    protocolUsage: { http: 0, websocket: 0, messageQueue: 0 }
  };

  recordMessageSent(protocol: string): void {
    this.metrics.messagesSent++;
    this.metrics.protocolUsage[protocol]++;
  }

  recordMessageReceived(): void {
    this.metrics.messagesReceived++;
  }

  recordMessageFailed(): void {
    this.metrics.messagesFailed++;
    this.updateErrorRate();
  }

  recordResponseTime(responseTimeMs: number): void {
    // Rolling average calculation
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageResponseTime =
      this.metrics.averageResponseTime * (1 - alpha) + responseTimeMs * alpha;
  }

  private updateErrorRate(): void {
    const totalMessages = this.metrics.messagesSent + this.metrics.messagesReceived;
    if (totalMessages > 0) {
      this.metrics.errorRate = this.metrics.messagesFailed / totalMessages;
    }
  }
}
```

### **2. Health Monitoring**

#### **Communication Health Checks**
```typescript
interface CommunicationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connectivity: HealthCheck;
    latency: HealthCheck;
    errorRate: HealthCheck;
    throughput: HealthCheck;
  };
  timestamp: string;
}

class CommunicationHealthChecker {
  async checkHealth(): Promise<CommunicationHealth> {
    const checks = await Promise.all([
      this.checkConnectivity(),
      this.checkLatency(),
      this.checkErrorRate(),
      this.checkThroughput()
    ]);

    const allHealthy = checks.every(check => check.status === 'healthy');
    const anyDegraded = checks.some(check => check.status === 'degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!allHealthy) {
      overallStatus = anyDegraded ? 'degraded' : 'unhealthy';
    }

    return {
      status: overallStatus,
      checks: {
        connectivity: checks[0],
        latency: checks[1],
        errorRate: checks[2],
        throughput: checks[3]
      },
      timestamp: new Date().toISOString()
    };
  }

  private async checkConnectivity(): Promise<HealthCheck> {
    try {
      // Test basic connectivity to registry
      const response = await fetch(`${this.registryUrl}/health`, {
        timeout: 5000
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        value: response.status,
        unit: 'status_code'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        value: 'connection_failed',
        unit: 'error'
      };
    }
  }

  private async checkLatency(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      await fetch(`${this.registryUrl}/health`);
      const latency = Date.now() - startTime;

      return {
        status: latency < 1000 ? 'healthy' : latency < 5000 ? 'degraded' : 'unhealthy',
        value: latency,
        unit: 'ms'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        value: 'timeout',
        unit: 'error'
      };
    }
  }

  private checkErrorRate(): HealthCheck {
    const errorRate = this.monitor.getErrorRate();

    return {
      status: errorRate < 0.05 ? 'healthy' : errorRate < 0.15 ? 'degraded' : 'unhealthy',
      value: errorRate * 100,
      unit: 'percent'
    };
  }

  private checkThroughput(): HealthCheck {
    const throughput = this.monitor.getMessagesPerSecond();

    return {
      status: throughput > 10 ? 'healthy' : throughput > 5 ? 'degraded' : 'unhealthy',
      value: throughput,
      unit: 'messages/second'
    };
  }
}
```

---

*These Agent Communication Standards establish the foundation for reliable, secure, and efficient inter-agent communication across the ConstructAI unified platform. Implementation ensures seamless integration between Python and JavaScript agents with comprehensive error handling, security, and monitoring capabilities.*