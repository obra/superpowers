# Enhanced Workflow Logging for Correspondence Agent Orchestration

## Enhanced Logging Implementation
**Date:** 31/12/2025, 8:43:15 am (Africa/Johannesburg, UTC+2:00)
**Purpose:** Comprehensive logging for effective workflow debugging

## Logging Categories

### 1. Workflow State Tracking
- **Workflow ID**: Unique identifier for each orchestration session
- **Step Tracking**: Current step, completed steps, pending steps
- **Agent Status**: Each agent's execution status and timing
- **Error Tracking**: Detailed error logging with context

### 2. Message Flow Logging
- **Modal → Orchestrator**: Progress callback invocation tracking
- **Orchestrator → Agents**: Agent delegation and response logging
- **Agent → Modal**: Individual agent progress logging
- **Modal → Chatbot**: Event dispatching and delivery confirmation

### 3. Performance Metrics
- **Step Timing**: Duration for each orchestration step
- **Memory Usage**: Agent memory consumption tracking
- **Network Requests**: API call timing and response tracking
- **Streaming Performance**: Message delivery timing

### 4. Error Analysis
- **Failure Points**: Specific failure locations in workflow
- **Recovery Actions**: Automatic retry and fallback logging
- **User Impact**: Error impact on user experience
- **Debug Context**: Full context for debugging issues

## Implementation Features

### Enhanced Modal Logging
```javascript
// Workflow state tracking
const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
console.log(`🔄 [Workflow:${workflowId}] State: STARTED at ${new Date().toISOString()}`);

// Detailed progress callback logging
const progressCallback = (step, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  console.log(`📨 [Workflow:${workflowId}] [${messageId}] Progress Callback:`);
  console.log(`   Step: ${step} | Message Length: ${message?.length || 0} | Timestamp: ${timestamp}`);
  console.log(`   Data Keys: ${Object.keys(data || {}).join(', ')}`);
  console.log(`   Message Preview: "${message?.substring(0, 100)}..."`);
  
  // Enhanced filtering detection logging
  const isDetailedStreaming = detectDetailedContent(message);
  console.log(`   📊 Detailed Detection: ${isDetailedStreaming ? 'DETAILED' : 'SIMPLE'}`);
  
  // Event dispatch tracking
  const dispatchSuccess = dispatchToChatbot(progressMessage, messageId);
  console.log(`   📡 Event Dispatch: ${dispatchSuccess ? 'SUCCESS' : 'FAILED'}`);
  
  // WebSocket tracking
  const wsSuccess = sendToWebSocket(wsMessage, messageId);
  console.log(`   🌐 WebSocket: ${wsSuccess ? 'SUCCESS' : 'FAILED'}`);
};
```

### Orchestrator Agent Logging
```javascript
// Enhanced orchestrator logging with workflow context
dispatchProgressEvent(message, type, {
  workflowId: this.workflowId,
  stepStartTime: new Date().toISOString(),
  agentContext: {
    currentAgent: currentAgentName,
    previousAgents: completedAgents,
    nextAgents: pendingAgents,
    retryCount: retryAttempts
  },
  performanceMetrics: {
    stepDuration: Date.now() - stepStartTime,
    memoryUsage: process.memoryUsage(),
    networkLatency: apiCallDuration
  }
});
```

### Agent-Specific Logging
```javascript
// Each agent gets enhanced logging
console.log(`🎯 [${agentName}] [Workflow:${workflowId}] Starting step ${step}`);
console.log(`📊 [${agentName}] Input analysis:`, {
  messageLength: input.length,
  hasData: !!data,
  dataKeys: Object.keys(data || {})
});

// Progress tracking with timing
const stepStartTime = Date.now();
const progressInterval = setInterval(() => {
  const elapsed = Date.now() - stepStartTime;
  console.log(`⏱️ [${agentName}] [Workflow:${workflowId}] Step ${step} progress: ${elapsed}ms`);
}, 5000); // Progress update every 5 seconds

// Completion logging
clearInterval(progressInterval);
console.log(`✅ [${agentName}] [Workflow:${workflowId}] Step ${step} completed in ${Date.now() - stepStartTime}ms`);
```

## Debug Console Commands

### Workflow Status Commands
```javascript
// Global workflow tracking (available in browser console)
window.workflowDebug = {
  // Get current workflow status
  getStatus: () => {
    return {
      activeWorkflows: getActiveWorkflows(),
      completedWorkflows: getCompletedWorkflows(),
      errorWorkflows: getErrorWorkflows()
    };
  },
  
  // Get specific workflow details
  getWorkflow: (workflowId) => {
    return getWorkflowDetails(workflowId);
  },
  
  // Monitor workflow in real-time
  monitor: (workflowId) => {
    console.log(`👁️ Monitoring workflow: ${workflowId}`);
    return startWorkflowMonitoring(workflowId);
  },
  
  // Get workflow timeline
  getTimeline: (workflowId) => {
    return getWorkflowTimeline(workflowId);
  }
};
```

### Agent Debugging Commands
```javascript
// Agent-specific debugging
window.agentDebug = {
  // Get agent status
  getAgentStatus: (agentName) => {
    return {
      isActive: isAgentActive(agentName),
      lastActivity: getLastAgentActivity(agentName),
      performance: getAgentPerformance(agentName)
    };
  },
  
  // Get agent performance metrics
  getPerformance: (agentName) => {
    return {
      averageResponseTime: getAverageResponseTime(agentName),
      errorRate: getErrorRate(agentName),
      successRate: getSuccessRate(agentName)
    };
  }
};
```

### Message Flow Debugging
```javascript
// Message flow tracking
window.messageDebug = {
  // Get message flow for workflow
  getMessageFlow: (workflowId) => {
    return getMessageFlow(workflowId);
  },
  
  // Get failed messages
  getFailedMessages: () => {
    return getFailedMessages();
  },
  
  // Get message delivery statistics
  getDeliveryStats: () => {
    return {
      customEventSuccess: getCustomEventSuccessRate(),
      websocketSuccess: getWebSocketSuccessRate(),
      averageDeliveryTime: getAverageDeliveryTime()
    };
  }
};
```

## Log Categories and Levels

### Log Levels
- **🔴 ERROR**: Critical failures requiring immediate attention
- **🟡 WARN**: Issues that might cause problems but not critical
- **🔵 INFO**: General workflow progress information
- **🟢 DEBUG**: Detailed debugging information
- **⚪ TRACE**: Very detailed execution tracing

### Log Categories
1. **Workflow**: Overall orchestration workflow status
2. **Agent**: Individual agent execution details
3. **Modal**: Modal integration and progress callback
4. **Network**: API calls and network activity
5. **Performance**: Timing and performance metrics
6. **Error**: Error tracking and analysis

## Enhanced Error Tracking

### Error Context Logging
```javascript
// Enhanced error logging with full context
const logErrorWithContext = (error, context) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const timestamp = new Date().toISOString();
  
  console.group(`🚨 [ERROR:${errorId}] ${context.workflowId} - ${context.step}`);
  
  console.log('📅 Timestamp:', timestamp);
  console.log('🎯 Context:', context);
  console.log('💥 Error:', error.message);
  console.log('📋 Stack:', error.stack);
  console.log('🔍 Environment:', {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: timestamp
  });
  
  console.groupEnd();
  
  // Send to error tracking system
  trackError(errorId, error, context);
};
```

### Recovery Action Logging
```javascript
// Automatic recovery and retry logging
const logRecoveryAction = (action, success, details) => {
  console.log(`🔄 [RECOVERY] Action: ${action} | Success: ${success} | Details:`, details);
  
  if (!success) {
    console.warn(`⚠️ Recovery failed for action: ${action}`);
    // Escalate to user or implement alternative recovery
  }
};
```

## Real-Time Monitoring

### Console Monitoring Commands
```javascript
// Enable real-time workflow monitoring
console.log('🔍 Enhanced workflow logging is now active');
console.log('💡 Available debug commands:');
console.log('  - window.workflowDebug.getStatus()');
console.log('  - window.workflowDebug.getWorkflow(workflowId)');
console.log('  - window.agentDebug.getAgentStatus(agentName)');
console.log('  - window.messageDebug.getFailedMessages()');
```

### Browser Console Monitoring
1. **Open Console**: F12 → Console tab
2. **Filter Logs**: Use log level filters (ERROR, WARN, INFO, DEBUG)
3. **Search Workflows**: Search for "Workflow:" to find active workflows
4. **Monitor Progress**: Watch for real-time progress updates
5. **Debug Commands**: Use provided debug commands for detailed analysis

## Benefits of Enhanced Logging

### For Development
- **Faster Bug Detection**: Detailed logs pinpoint exact failure locations
- **Performance Analysis**: Timing logs help optimize agent performance
- **Workflow Understanding**: Clear visualization of orchestration flow
- **Error Context**: Complete context for debugging complex issues

### For Production
- **Issue Diagnosis**: Detailed logs help diagnose production problems
- **User Experience**: Better error handling with clear user feedback
- **Monitoring**: Real-time workflow monitoring capabilities
- **Analytics**: Performance metrics for system optimization

### For Support
- **Customer Issues**: Comprehensive logs help resolve user problems
- **Workflow Analysis**: Understanding of how workflows perform in real usage
- **Error Patterns**: Identification of common error patterns
- **Recovery Tracking**: Monitoring of automatic recovery success rates

---

**Enhanced Logging Status: IMPLEMENTED** ✅
**Workflow Debugging: SIGNIFICANTLY IMPROVED** 📈
