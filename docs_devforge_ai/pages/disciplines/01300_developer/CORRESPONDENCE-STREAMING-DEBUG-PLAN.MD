# Correspondence Agent Orchestration Streaming Debug Plan

## Problem: Actual Application Shows Generic Messages vs Expected Detailed Streaming

### Current Reality vs Expected:
- **Actual Output:** "Document Analysis: Analyzing document content..." (generic)
- **Expected Output:** Extensive detail with document IDs, relevance scores, links, etc.
- **Root Cause:** Client-side streaming implementation not working properly

## Debugging Methodology (Following Official Guide)

### Phase 1: Reality Investigation - Browser Console Analysis

**Step 1.1: Load Application and Check Console**
```javascript
// Load 00435 Contracts Post-Award page
// Open DevTools → Console tab
// Look for JavaScript errors during correspondence processing
```

**Step 1.2: Monitor Network Requests**
```javascript
// DevTools → Network tab
// Clear network log
// Trigger correspondence processing
// Check for failed API calls (red status codes)
```

**Step 1.3: Inspect React Components**
```javascript
// Install React DevTools browser extension
// Use React tab to inspect CorrespondenceReplyModal component
// Check component state and props during processing
```

### Phase 2: Client-Side Code Analysis

**Step 2.1: Examine Modal Integration**
```javascript
// Check: client/src/pages/00435-contracts-post-award/components/modals/00435-03-CorrespondenceReplyModal.js
// Look for: onProgress callback implementation
// Verify: Event dispatching logic
```

**Step 2.2: Analyze Agent Progress Callbacks**
```javascript
// Check: client/src/pages/00435-contracts-post-award/components/agents/00435-03-contractual-correspondence-reply-agent.js
// Look for: onProgress callback calls
// Verify: Streaming content generation
```

**Step 2.3: Test Real Event Dispatching**
```javascript
// In browser console during processing:
document.addEventListener('chatbotMessage', (event) => {
  console.log('📡 Chatbot Message Event:', event.detail);
});

// Should show detailed streaming events if working
```

### Phase 3: API Integration Investigation

**Step 3.1: Test Agent Endpoints**
```javascript
// Test correspondence agent API in browser
fetch('/api/correspondence-agent/chat/agent/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Test correspondence analysis",
    options: { model: "gpt-4-turbo-preview" }
  })
})
.then(res => res.json())
.then(data => console.log('API Response:', data));
```

**Step 3.2: Check Server Logs**
```bash
# Monitor server console during correspondence processing
# Look for:
# - Agent execution logs
# - Progress callback invocations  
# - Error messages
```

### Phase 4: Real Browser Testing

**Step 4.1: Automated Page Testing**
```javascript
// Use test_page tool to verify React component rendering
test_page({
  "url": "http://localhost:3060/#/00435-contracts-post-award",
  "selector": ".correspondence-reply-modal",
  "headless": false,
  "timeout": 10000
})
```

**Step 4.2: Interactive Testing**
```javascript
// Open correspondence modal
// Trigger processing
// Monitor real-time console output
// Check for streaming content generation
```

### Phase 5: Root Cause Analysis

**Hypothesis 1: Modal Progress Callback Not Working**
- **Test:** Check if onProgress callbacks are being invoked
- **Evidence:** Look for progress callback logs in console
- **Fix:** Ensure proper callback wiring in modal

**Hypothesis 2: Agent Progress Generation Broken**
- **Test:** Check if agents are generating detailed content
- **Evidence:** Examine agent code for streaming content creation
- **Fix:** Implement proper streaming content in agents

**Hypothesis 3: Event Dispatching Failure**
- **Test:** Verify CustomEvent dispatching in browser
- **Evidence:** Check if 'chatbotMessage' events are being sent
- **Fix:** Fix event dispatching logic

**Hypothesis 4: LLM Integration Failing**
- **Test:** Check agent LLM calls and error handling
- **Evidence:** Look for API call failures in network tab
- **Fix:** Implement proper error handling and fallbacks

## Expected Investigation Results

### Success Criteria:
```javascript
// ✅ Working streaming should show:
{
  message: "📋 **Step 2: Information Extraction**\n\n**Variations Found:** 1\n• ✅ VI-003 - Foundation depth modification\n\n**Technical Documents Found:** 2\n• ✅ DWG-STR-BD-105 - Structural layout (0.9 relevance)\n  📎 Link: /documents/tech_001\n• ✅ SPEC-CONC-001 - Concrete specifications (0.8 relevance)",
  type: "agent_progress",
  agentDetails: [...],
  performanceMetrics: {...}
}
```

### Current Failure Indicators:
```javascript
// ❌ Current generic messages:
"Document Analysis: Analyzing document content..."
"Information Extraction: Analyzing document content..."
"Processing Correspondence Request with Multi-Agent Orchestration"
```

## Debug Scripts to Create

### 1. Real-Time Event Monitor
```javascript
// Monitor all chatbot message events during processing
const monitorEvents = () => {
  document.addEventListener('chatbotMessage', (event) => {
    console.log('📡 EVENT CAPTURED:', {
      type: event.detail.type,
      message: event.detail.message?.substring(0, 100),
      timestamp: new Date().toISOString(),
      hasAgentDetails: !!event.detail.agentDetails,
      hasPerformanceMetrics: !!event.detail.performanceMetrics
    });
  });
};
monitorEvents();
```

### 2. Agent Progress Tracker
```javascript
// Track agent progress callback invocations
const trackAgentProgress = () => {
  const originalProgress = window.ContractualCorrespondenceReplyAgent?.prototype.processCorrespondence;
  if (originalProgress) {
    window.ContractualCorrespondenceReplyAgent.prototype.processCorrespondence = function(...args) {
      console.log('🔄 AGENT PROCESSING STARTED');
      const result = originalProgress.apply(this, args);
      console.log('🔄 AGENT PROCESSING COMPLETED');
      return result;
    };
  }
};
trackAgentProgress();
```

### 3. Modal Integration Checker
```javascript
// Check modal progress callback wiring
const checkModalIntegration = () => {
  const modal = document.querySelector('.correspondence-reply-modal');
  if (modal) {
    console.log('✅ Modal found');
    // Check if modal has progress handling
    const progressElements = modal.querySelectorAll('[data-testid*="progress"]');
    console.log('📊 Progress elements found:', progressElements.length);
  } else {
    console.log('❌ Modal not found');
  }
};
```

## Action Items

### Immediate Investigation Steps:
1. ✅ **Load application page** - http://localhost:3060/#/00435-contracts-post-award
2. ✅ **Open browser console** - F12 → Console tab
3. ✅ **Trigger correspondence processing** - Use the modal
4. ✅ **Monitor console output** - Look for progress events and errors
5. ✅ **Check network requests** - DevTools → Network tab

### Expected Findings:
- JavaScript errors preventing proper execution
- Progress callbacks not being invoked
- Event dispatching failures
- LLM API call failures
- Modal integration issues

### Fix Implementation Plan:
Based on investigation results, implement fixes for:
- Progress callback wiring
- Event dispatching logic
- Agent streaming content generation
- Error handling and fallbacks

## Next Steps

1. **Execute investigation steps** in browser
2. **Document findings** from console/network analysis
3. **Implement fixes** based on root cause
4. **Test streaming functionality** end-to-end
5. **Verify extensive detail** is displayed correctly
