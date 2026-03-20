# Agent Communication Enhanced Logging Guide

This document provides enhanced logging code to add to all agent communication failure points for debugging.

## 1. Enhanced Error Logging for CorrespondenceOrchestrator

### Location: client/src/pages/00435-contracts-post-award/components/agents/00435-03-contractual-correspondence-reply-agent.js

#### Replace updateCorrespondenceStatus method (line 1219):

```javascript
async updateCorrespondenceStatus(taskId, status, metadata = {}) {
  const logPrefix = `[CorrespondenceOrchestrator.updateCorrespondenceStatus]`;
  console.log(`${logPrefix} Starting status update`, {
    taskId,
    status,
    metadata,
    timestamp: new Date().toISOString()
  });

  try {
    const updateData = {
      metadata: {
        correspondence_status: status,
        progress_percentage: this.getProgressForStatus(status),
        status_message: this.getMessageForStatus(status),
        last_status_update: new Date().toISOString(),
        ...metadata
      }
    };

    const url = `/api/tasks/${taskId}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    console.log(`${logPrefix} Request details:`, {
      url,
      method: 'PATCH',
      headers: Object.keys(headers),
      bodySize: JSON.stringify(updateData).length,
      body: updateData
    });

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData)
    });

    console.log(`${logPrefix} Response received:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`${logPrefix} Response not OK:`, {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText
      });
      throw new Error(`Status update failed: ${response.status} - ${responseText}`);
    }

    const responseData = await response.json();
    console.log(`✅ ${logPrefix} Success:`, {
      taskId,
      newStatus: status,
      responseData
    });

  } catch (error) {
    console.error(`❌ ${logPrefix} Failed for task ${taskId}:`, {
      errorMessage: error?.message || 'Unknown error',
      errorName: error?.name || 'Error',
      errorStack: error?.stack,
      requestedStatus: status,
      metadata,
      timestamp: new Date().toISOString(),
      // Network error details
      isNetworkError: error instanceof TypeError,
      isFetchError: error.name === 'FetchError',
      // Additional context
      taskId,
      currentUrl: window?.location?.href
    });
    // Don't fail the workflow for status update errors
  }
}
```

#### Replace updateCorrespondenceTaskWithWorkflowData method (line 1591):

```javascript
async updateCorrespondenceTaskWithWorkflowData(taskId, comprehensiveAnalysis) {
  const logPrefix = '[CorrespondenceOrchestrator.updateCorrespondenceTaskWithWorkflowData]';
  console.log(`${logPrefix} Starting workflow data update`, {
    taskId,
    hasSpecialistAnalysis: !!comprehensiveAnalysis.specialistAnalysis,
    hasDocumentRetrieval: !!comprehensiveAnalysis.documentRetrieval,
    hasContractManagement: !!comprehensiveAnalysis.contractManagement,
    hasDraftResponse: !!comprehensiveAnalysis.draftResponse,
    timestamp: new Date().toISOString()
  });

  try {
    console.log(`📊 ${logPrefix} Updating correspondence task with workflow data for dashboard display`);

    // Extract workflow data in the format expected by the dashboard
    const workflowData = {
      // Specialist analysis data
      specialistAnalysis: comprehensiveAnalysis.specialistAnalysis || {},

      // Document retrieval data
      documentRetrieval: comprehensiveAnalysis.documentRetrieval || {
        retrievedDocs: {},
        searchMetadata: {}
      },

      // Contract management data
      contractManagement: comprehensiveAnalysis.contractManagement || {},

      // Workflow progress
      workflowProgress: comprehensiveAnalysis.workflowProgress || this.state.workflowProgress,

      // Draft response
      draftResponse: comprehensiveAnalysis.draftResponse || '',

      // Correspondence context
      correspondence_context: comprehensiveAnalysis.correspondence || this.state.question,
      correspondence_preview: (comprehensiveAnalysis.correspondence || this.state.question)?.substring(0, 100),

      // Metadata
      project_context: this.projectContext,
      created_by_agent: 'ContractualCorrespondenceReplyAgent',
      agent_workflow_step: 'workflow_complete',

      // Computed fields for dashboard compatibility
      specialistsConsulted: Object.keys(comprehensiveAnalysis.specialistAnalysis || {}).length,
      documentsRetrieved: comprehensiveAnalysis.documentRetrieval?.retrievedDocs ?
        Object.values(comprehensiveAnalysis.documentRetrieval.retrievedDocs).reduce((sum, arr) => sum + (arr?.length || 0), 0) : 0,
      riskAssessment: comprehensiveAnalysis.contractManagement?.contractAnalysis?.overallRisk ||
                     comprehensiveAnalysis.contractManagement?.overallRisk || 'Unknown',
      specialistAnalysesAvailable: Object.keys(comprehensiveAnalysis.specialistAnalysis || {}).length > 0,
      contractAnalysisAvailable: !!comprehensiveAnalysis.contractManagement?.contractAnalysis,
      responseDraftAvailable: !!comprehensiveAnalysis.draftResponse,

      // Timestamp
      workflow_completed_at: new Date().toISOString()
    };

    console.log(`${logPrefix} Workflow data prepared:`, {
      specialistsConsulted: workflowData.specialistsConsulted,
      documentsRetrieved: workflowData.documentsRetrieved,
      riskAssessment: workflowData.riskAssessment,
      dataSize: JSON.stringify(workflowData).length
    });

    // Update the task metadata with workflow data
    const updateData = {
      metadata: {
        ...workflowData,
        correspondence_status: 'workflow_complete',
        progress_percentage: 85,
        status_message: 'Comprehensive analysis completed - awaiting specialist review',
        last_status_update: new Date().toISOString()
      }
    };

    const url = `/api/tasks/${taskId}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };

    console.log(`${logPrefix} Request details:`, {
      url,
      method: 'PATCH',
      headers: Object.keys(headers),
      bodySize: JSON.stringify(updateData).length,
      metadataKeys: Object.keys(updateData.metadata)
    });

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData)
    });

    console.log(`${logPrefix} Response received:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`${logPrefix} Response not OK:`, {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        requestUrl: url
      });
      throw new Error(`Task update failed: ${response.status} - ${responseText}`);
    }

    const responseData = await response.json();
    console.log(`✅ ${logPrefix} Success:`, {
      taskId,
      workflowDataKeys: Object.keys(workflowData),
      responseData
    });

  } catch (error) {
    console.error(`❌ ${logPrefix} Failed:`, {
      taskId,
      errorMessage: error?.message || 'Unknown error',
      errorName: error?.name || 'Error',
      errorStack: error?.stack,
      // Network error details
      isNetworkError: error instanceof TypeError,
      isFetchError: error.name === 'FetchError',
      // Analysis data context
      hasAnalysisData: !!comprehensiveAnalysis,
      analysisKeys: comprehensiveAnalysis ? Object.keys(comprehensiveAnalysis) : [],
      timestamp: new Date().toISOString(),
      currentUrl: window?.location?.href
    });
    // Don't fail the workflow for metadata update errors
  }
}
```

## 2. Enhanced Logging for ClientAgentCommunicator sendMessage

### Location: client/src/services/communication/ClientAgentCommunicator.js

Find the sendMessage method's catch block (around line 140) and replace with:

```javascript
} catch (error) {
  this.metrics.messagesFailed++;

  // Comprehensive error logging with all context
  const errorDetails = {
    // Error information
    errorMessage: error?.message || 'Unknown error',
    errorName: error?.name || 'Error',
    errorCode: error?.code,
    errorStack: error?.stack,
    statusCode: error?.status,
    
    // Request context
    targetAgentId,
    messageType: agentMessage.message_type,
    action: agentMessage.action,
    correlationId: agentMessage.correlationId,
    messageId: agentMessage.messageId,
    
    // Connection state
    isConnected: this.isConnected,
    protocol: this.config.communicationProtocol,
    serverUrl: this.config.serverUrl,
    queueLength: this.messageQueue.length,
    
    // Payload info
    payloadSize: JSON.stringify(agentMessage.payload).length,
    hasPayload: !!agentMessage.payload,
    payloadKeys: agentMessage.payload ? Object.keys(agentMessage.payload) : [],
    
    // Timing
    timestamp: new Date().toISOString(),
    attemptNumber: options.attemptNumber || 1,
    
    // Network details
    isNetworkError: error instanceof TypeError,
    isFetchError: error?.name === 'FetchError',
    isTimeoutError: error?.message?.toLowerCase().includes('timeout'),
    
    // Browser context
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

  console.error('[ClientAgentCommunicator] Message send failed:', errorDetails);

  // Implement retry logic
  if (options.retry !== false && this._shouldRetry(error)) {
    console.log(`[ClientAgentCommunicator] Attempting retry for message ${agentMessage.messageId}`);
    return await this._retryMessage(agentMessage, { ...options, attemptNumber: (options.attemptNumber || 1) + 1 });
  }

  throw error;
}
```

## 3. Enhanced Logging for Agent Service Endpoints

### Location: scripts/agent-service.js

Add comprehensive logging to the communicate endpoint (around line 42):

```javascript
// Agent communication endpoint
app.post("/api/agents/communicate", (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logPrefix = `[AgentService.communicate][${requestId}]`;
  
  console.log(`${logPrefix} Request received:`, {
    requestId,
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'x-client-agent-id': req.headers['x-client-agent-id'],
      'x-correlation-id': req.headers['x-correlation-id']
    },
    bodySize: JSON.stringify(req.body).length,
    hasBody: !!req.body,
    timestamp: new Date().toISOString()
  });

  try {
    const { messageId, from_agent, to_agent, message_type, action, payload } = req.body;

    console.log(`${logPrefix} Message details:`, {
      messageId,
      from_agent: from_agent?.agent_id,
      to_agent: to_agent?.agent_id,
      message_type,
      action,
      payloadKeys: payload ? Object.keys(payload) : []
    });

    // Store message for logging
    messages.push({
      timestamp: new Date().toISOString(),
      messageId,
      from_agent,
      to_agent,
      message_type,
      action,
      payload,
      requestId
    });

    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.shift();
    }

    // Mock response based on action
    let response = {
      success: true,
      messageId,
      correlationId: req.body.correlationId,
      timestamp: new Date().toISOString(),
      from_agent: {
        agent_id: "agent-service",
        agent_type: "server_agent",
      },
      to_agent: from_agent,
      message_type: "response",
      payload: {},
    };

    // Handle different actions (existing switch statement...)
    switch (action) {
      // ... existing cases ...
    }

    console.log(`${logPrefix} Sending response:`, {
      success: response.success,
      messageId: response.messageId,
      responseSize: JSON.stringify(response).length,
      payloadKeys: Object.keys(response.payload)
    });

    res.json(response);
  } catch (error) {
    console.error(`${logPrefix} Error processing request:`, {
      errorMessage: error?.message || 'Unknown error',
      errorName: error?.name || 'Error',
      errorStack: error?.stack,
      requestBody: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        name: error.name,
        requestId
      },
      timestamp: new Date().toISOString()
    });
  }
});
```

Also enhance the HITL endpoint (around line 180):

```javascript
// HITL Task Creation endpoint
app.post("/api/tasks/hitl", (req, res) => {
  const requestId = `hitl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logPrefix = `[AgentService.hitl][${requestId}]`;
  
  console.log(`${logPrefix} HITL task creation request:`, {
    requestId,
    headers: {
      'content-type': req.headers['content-type']
    },
    bodySize: JSON.stringify(req.body).length,
    bodyKeys: Object.keys(req.body),
    timestamp: new Date().toISOString()
  });

  try {
    const {
      taskId,
      taskType,
      priority,
      assignedTo,
      correspondence,
      workflowData,
      metadata
    } = req.body;

    console.log(`${logPrefix} Task details:`, {
      taskId,
      taskType,
      priority,
      assignedTo,
      hasCorrespondence: !!correspondence,
      hasWorkflowData: !!workflowData,
      hasMetadata: !!metadata
    });

    // Create mock task response
    const task = {
      id: taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskType: taskType || 'human_review',
      status: 'pending',
      priority: priority || 'normal',
      assignedTo: assignedTo || 'human_reviewer',
      correspondence: correspondence || {},
      workflowData: workflowData || {},
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requestId
    };

    const assignment = {
      assignmentId: `assignment_${Date.now()}`,
      taskId: task.id,
      assignedTo: task.assignedTo,
      assignedAt: new Date().toISOString(),
      status: 'assigned',
      requestId
    };

    console.log(`${logPrefix} HITL task created:`, {
      taskId: task.id,
      assignmentId: assignment.assignmentId,
      responseSize: JSON.stringify({ task, assignment }).length
    });

    res.json({
      success: true,
      data: {
        task,
        assignment,
        mock: true,
        note: "This is a mock HITL task response for agent communication testing",
        requestId
      }
    });
  } catch (error) {
    console.error(`${logPrefix} Error creating HITL task:`, {
      errorMessage: error?.message || 'Unknown error',
      errorName: error?.name || 'Error',
      errorStack: error?.stack,
      requestBody: req.body,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        name: error.name,
        requestId
      },
      timestamp: new Date().toISOString()
    });
  }
});
```

## 4. Testing the Enhanced Logging

After implementing these changes:

1. **Rebuild the client:**
   ```bash
   cd /Users/_PropAI/construct_ai/client && npm run build
   ```

2. **Restart the agent service:**
   ```bash
   node /Users/_PropAI/construct_ai/scripts/agent-service.js
   ```

3. **Check browser console for detailed logs:**
   - Open DevTools (F12)
   - Go to Console tab
   - Trigger the agent workflow
   - You should see detailed logs at each step showing:
     - Request URLs and methods
     - Request/response headers
     - Body sizes and keys
     - Error details with full context
     - Network state information
     - Timing information

4. **Check agent service console for server-side logs:**
   - Should see request IDs matching browser logs
   - Full error details if failures occur
   - Request/response correlation

## 5. Log Analysis Guide

When errors occur, look for:

### Network Errors (fetch failures):
- `isNetworkError: true` - Likely CORS or network connectivity issue
- `errorMessage: "Failed to fetch"` - Check if service is running and reachable

### HTTP Errors (response not OK):
- `status: 404` - Endpoint not found (check URL)
- `status: 500` - Server error (check agent service logs)
- `responseBody` - Contains server error details

### Timeout Errors:
- `isTimeoutError: true` - Request taking too long
- Check `serverUrl` and network latency

### Authentication Errors:
- `status: 401` or `403` - Check auth headers
- Look for `authHeaders` in request details

### Data Errors:
- Check `bodySize`, `payloadKeys`, `metadataKeys` for missing or malformed data
- Verify `hasPayload`, `hasAnalysisData` flags

## 6. Common Issues and Solutions

| Issue | Log Indicators | Solution |
|-------|----------------|----------|
| Wrong port | `serverUrl: 'http://localhost:3001'` | Rebuild client with port 3006 |
| Service not running | `isNetworkError: true`, `Failed to fetch` | Start agent service on port 3006 |
| Missing endpoint | `status: 404` | Add endpoint to agent service |
| Bad request data | Large `bodySize`, empty `payloadKeys` | Check data serialization |
| CORS error | `isNetworkError: true` in browser | Add CORS headers to agent service |

## Summary

This enhanced logging provides:
- **Request/Response tracing** with unique IDs
- **Full error context** including stack traces
- **Network state information**
- **Data flow visibility**
- **Timing and performance metrics**
- **Easy correlation** between client and server logs

With these enhancements, you can pinpoint exactly where communication failures occur and why.