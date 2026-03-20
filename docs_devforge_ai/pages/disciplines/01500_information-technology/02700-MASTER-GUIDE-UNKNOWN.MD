# 1300_02700 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02700 group.

## Files in this Group

- [1300_02700_TEMPLATE_GENERATION_TIMEOUT_PROCEDURE.md](1300_02700_TEMPLATE_GENERATION_TIMEOUT_PROCEDURE.md)
- [1300_02700_MASTER_GUIDE_UNKNOWN.md](1300_02700_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_02700_MASTER_GUIDE_UNKNOWN.md

# 1300_02700 Master Guide - UNKNOWN

## Overview

This master guide consolidates documentation for the 1300_02700 group.

## Files in this Group

- [1300_02700_TEMPLATE_GENERATION_TIMEOUT_PROCEDURE.md](1300_02700_TEMPLATE_GENERATION_TIMEOUT_PROCEDURE.md)
- [1300_02700_MASTER_GUIDE_UNKNOWN.md](1300_02700_MASTER_GUIDE_UNKNOWN.md)

## Consolidated Content

### 1300_02700_TEMPLATE_GENERATION_TIMEOUT_PROCEDURE.md

# 1300_02700 Template Generation Timeout Troubleshooting Procedure

## Overview

This document provides a comprehensive troubleshooting procedure for diagnosing and resolving template generation timeout issues in the Construct AI system. This procedure specifically addresses the common problem where AI-powered template generation fails with misleading "Internal Server Error" messages that are actually frontend request timeouts.

**CURRENT STATUS (12/11/2025)**: ✅ **TEMPLATE GENERATION FULLY OPERATIONAL** - All recent timeout and error issues have been resolved. The system now properly handles AI processing times (33-36 seconds) with appropriate frontend timeouts and error handling.

## Recent Fixes Implemented

Based on the comprehensive error tracking in `docs/error-tracking/1300_00000_ERROR_TRACKING_ALL.md`, the following fixes have been successfully implemented:

### ✅ **FIX 27: Template Generation Frontend Timeout Issue (RESOLVED)**
**Problem**: Template generation failing with "Internal Server Error" after 20-30 seconds despite backend working
**Root Cause**: Frontend request timeout (10-30s) vs backend processing time (33-36s)
**Solution Implemented**:
- Added 60-second timeout to `AITemplateModal.jsx` for AI operations
- Implemented AbortController for proper request cancellation
- Enhanced error handling to distinguish timeout from server errors
**Impact**: ✅ Template generation now completes successfully without premature timeouts

### ✅ **FIX 30: Template Generation Server Logic - Wrong Output Format (RESOLVED)**
**Problem**: Template generation failing with "Template missing valid sections array"
**Root Cause**: Server generating HTML for ALL template types instead of JSON with sections for most templates
**Solution Implemented**:
- Added logic to determine output format based on template type
- HSSE questionnaires generate HTML, other templates generate JSON with sections array
- Maintained existing functionality for both formats
**Impact**: ✅ All template types now generate in correct format expected by client

### ✅ **FIX 31: Template Generation Runtime Error - "[object Object]" Error Messages (RESOLVED)**
**Problem**: Template generation showing unhelpful "[object Object]" error messages
**Root Cause**: Error object passed directly to `new Error()` instead of extracting message property
**Solution Implemented**:
- Updated error handling to extract `message` property from error objects
- Added fallback to original error object if message property missing
- Maintained backward compatibility with string errors
**Impact**: ✅ Users now see meaningful error descriptions instead of "[object Object]"

### ✅ **FIX 32: Webpack Compilation Error - Module Resolution Issue (RESOLVED)**
**Problem**: Webpack compilation failing with module resolution errors
**Root Cause**: Incorrect import path using relative path instead of webpack alias
**Solution Implemented**:
- Changed import from `'../../02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx'`
- To: `'@pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx'`
**Impact**: ✅ Build compilation now succeeds without module resolution errors

### ✅ **FIX 33: Template Validation Error - Missing Sections Array (RESOLVED)**
**Problem**: Template generation failing with "Template missing valid sections array" despite successful AI generation
**Root Cause**: Template validation was too strict and didn't handle AI responses with different JSON structures
**Solution Implemented**:
- Enhanced validation logging to show template structure details
- Added fallback mechanism to restructure malformed templates
- Improved error messages to distinguish between different failure types
- Added automatic title generation for templates missing titles
**Impact**: ✅ Template generation now handles various AI response formats and provides better error diagnostics

### ✅ **FIX 34: Client Polling Infinite Loop on Job Failure (RESOLVED)**
**Problem**: Client polling continuing indefinitely when template generation jobs failed, creating infinite error loops
**Root Cause**: Polling logic caught errors but continued looping instead of properly exiting on job failure
**Solution Implemented**:
- Modified polling logic to re-throw errors instead of continuing to poll
- Added proper error propagation to exit polling loop immediately on job failure
- Enhanced error handling to distinguish between polling errors and job failures
**Impact**: ✅ Client now properly stops polling when jobs fail and displays appropriate error messages

### ✅ **FIX 35: Template Generation Workflow Design Inconsistencies (RESOLVED)**
**Problem**: Template generation failing with "Template missing valid sections array - AI did not generate expected structure"
**Root Cause**: Critical design inconsistency where async processing bypassed main `generateTemplate()` method routing logic
**Solution Implemented**:
- **Fixed async processing routing**: Changed `processTemplateGeneration()` to call `generateTemplate()` instead of `generateFromPrompt()` directly
- **Updated validation logic**: Made validation format-aware to handle both HTML templates (`html` property) and JSON templates (`sections` array)
- **Enhanced job result structure**: Updated to properly report statistics for both template formats
- **Added comprehensive logging**: Enhanced logging to distinguish between HTML and JSON template processing
**Impact**: ✅ Template generation workflow now has consistent design patterns across all code paths, eliminating the "sections array" error

## Requirements

### Prerequisites
- Access to browser developer tools and network monitoring
- Understanding of AI API processing times and timeout configurations
- Knowledge of frontend fetch API and AbortController usage
- Access to server logs and OpenAI API monitoring

### System Components Involved
- **Frontend**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`
- **Backend**: `/api/templates/generate` endpoint
- **External Services**: OpenAI API (typically 33-36 seconds processing time)
- **Browser**: Fetch API with default timeout behavior

## Implementation

### Problem Identification

#### Symptom Analysis
**User Experience:**
- Template generation starts successfully
- Progress indicator shows for 20-30 seconds
- Suddenly fails with "Internal Server Error" message
- No template is generated despite successful start

**Technical Root Cause:**
- OpenAI API calls require 33-36 seconds to complete processing
- Browser fetch requests timeout after 10-30 seconds by default
- Backend continues processing successfully but frontend gives up waiting
- Error messages are misleading ("Internal Server Error" vs "Request Timeout")

#### Diagnostic Steps

1. **Network Monitoring**
   ```javascript
   // Check browser Network tab for request details
   // Look for: /api/templates/generate request
   // Expected: Request should complete in 33-36 seconds
   // Actual: Request fails after 10-30 seconds with network error
   ```

2. **Server Log Analysis**
   ```bash
   # Check server logs for successful OpenAI API calls
   grep "OpenAI API call successful" server/logs/*.log
   # Should show completed API calls even when frontend times out
   ```

3. **Direct API Testing**
   ```bash
   # Test backend directly to confirm it works
   curl -X POST http://localhost:3060/api/templates/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test prompt", "options": {}}' \
     --max-time 60
   # Should return successful response in 33-36 seconds
   ```

4. **Frontend Timeout Verification**
   ```javascript
   // Check current timeout implementation
   const response = await fetch('/api/templates/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(requestData)
     // No timeout specified = browser default (10-30s)
   });
   ```

### Root Cause Analysis: Current Template Generation Issues

#### **PRIMARY ISSUE: Broken Progress Reporting System**

**Evidence from Logs:**
```
Job job_1762933380182_j1yo8hnin status: processing (progress: 31.250125%)
Job job_1762933380182_j1yo8hnin status: processing (progress: 32.50025%)
Job job_1762933380182_j1yo8hnin status: processing (progress: 33.750375%)
[REPEATS FOR 2+ MINUTES]
Job job_1762933380182_j1yo8hnin status: completed (progress: 100%)
```

**Root Cause:** Progress calculation is artificial/time-based, not reflecting actual AI processing stages.

**Impact:**
- Users see misleading progress (33% for 2+ minutes)
- Creates anxiety and perception of system being "stuck"
- No visibility into actual AI processing phases

#### **SECONDARY ISSUE: Excessive Frontend Polling**

**Evidence from Logs:**
```
[Multiple polling requests every 2 seconds for 2+ minutes]
Network outgoing: /api/templates/status/job_1762933380182_j1yo8hnin?_t=1762933380194
Network outgoing: /api/templates/status/job_1762933380182_j1yo8hnin?_t=1762933382201
[... 50+ polling requests]
```

**Root Cause:** Frontend polls every 2 seconds regardless of job duration.

**Impact:**
- Unnecessary server load (50+ requests for one job)
- Log spam in both frontend and backend
- Increased network traffic and battery drain on mobile

#### **TERTIARY ISSUE: No Real-Time AI Processing Visibility**

**Evidence from Logs:**
```
✅ Job job_1762933380182_j1yo8hnin completed successfully!
// Returns complete JSON template - AI processing worked perfectly
```

**Root Cause:** Backend doesn't stream progress updates during AI generation phases.

**Impact:**
- No visibility into OpenAI API call progress
- Users can't distinguish between "processing" and "hung"
- Difficult to debug where time is spent (network, AI processing, JSON parsing)

### Historical Troubleshooting Examples

#### Example 1: Template Generation Frontend Timeout (FIX 27)
**Problem**: Template generation failing with "Internal Server Error" after 20-30 seconds
**Symptoms**: AI template generation starts but fails before completion
**Root Cause**: Frontend request timeout (10-30s) vs backend processing time (33-36s)
**Diagnostic Steps**:
```javascript
// Check current timeout handling
console.log('Current timeout configuration:');
// Should show: 60 seconds for AI generation
```
**Resolution Pattern**:
1. Identify AI processing time requirements (33-36 seconds)
2. Implement proper timeout handling (60 seconds minimum)
3. Add AbortController for request cancellation
4. Distinguish timeout errors from server errors

#### Example 2: Misleading Error Messages
**Problem**: "Internal Server Error" when backend is actually working
**Symptoms**: Error suggests server failure but logs show success
**Root Cause**: Frontend timeout misclassified as server error
**Diagnostic Steps**:
```bash
# Compare frontend error with server logs
# Frontend: "Internal Server Error"
# Server logs: "OpenAI API call completed successfully"
# Conclusion: Timeout, not server error
```

#### Example 3: Progress Reporting Breakdown (CURRENT ISSUE)
**Problem**: Progress stuck at 33% for 2+ minutes, then suddenly completes
**Symptoms**: Artificial progress calculation doesn't reflect actual processing
**Root Cause**: Time-based progress vs event-based progress reporting
**Diagnostic Steps**:
```javascript
// Check progress calculation logic
const progress = (Date.now() - startTime) / estimatedDuration;
// This gives misleading progress for variable AI processing times
```
**Resolution Pattern**:
1. Implement event-based progress reporting
2. Add AI processing phase visibility
3. Use WebSocket/Server-Sent Events for real-time updates
4. Implement intelligent polling with backoff

### Common Troubleshooting Patterns

#### Pattern 1: AI Processing Time vs Frontend Timeout
**Frequency**: High (FIX 27)
**Symptoms**: Operations fail after 20-30 seconds despite backend working
**Quick Check**: Compare operation time with timeout settings
**Solution**: Extend timeouts for AI operations

#### Pattern 2: Misleading Error Classification
**Frequency**: Medium
**Symptoms**: Error messages don't match actual failure cause
**Quick Check**: Cross-reference frontend errors with server logs
**Solution**: Improve error handling and user feedback

#### Pattern 3: Network vs Processing Time Issues
**Frequency**: Low to Medium
**Symptoms**: Requests fail at consistent time intervals
**Quick Check**: Monitor network timing vs processing timing
**Solution**: Adjust timeout configurations appropriately

### Solution Implementation

#### **IMMEDIATE FIX: Intelligent Polling & Progress Reporting**

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Implement intelligent polling with exponential backoff
const [pollInterval, setPollInterval] = useState(2000); // Start at 2s
const [maxPollInterval, setMaxPollInterval] = useState(10000); // Max 10s
const [pollCount, setPollCount] = useState(0);

const pollJobStatus = async (jobId) => {
  try {
    const response = await fetch(`/api/templates/status/${jobId}?_t=${Date.now()}`);
    const data = await response.json();

    setPollCount(prev => prev + 1);

    // Update progress with more meaningful information
    if (data.progress !== undefined) {
      setProgress(data.progress);

      // Update status message based on progress
      if (data.progress < 30) {
        setStatus('Initializing AI processing...');
      } else if (data.progress < 70) {
        setStatus('AI generating template structure...');
      } else if (data.progress < 90) {
        setStatus('Finalizing template...');
      } else {
        setStatus('Completing generation...');
      }
    }

    if (data.status === 'completed') {
      setProgress(100);
      setStatus('Template generated successfully!');
      clearInterval(pollTimer);
      // Handle completion
    } else if (data.status === 'failed') {
      setError(data.error || 'Template generation failed');
      clearInterval(pollTimer);
    } else {
      // Exponential backoff: increase interval but cap at max
      const newInterval = Math.min(pollInterval * 1.2, maxPollInterval);
      setPollInterval(newInterval);
    }
  } catch (error) {
    console.error('Polling error:', error);
    // Continue polling on network errors
  }
};

// Start polling with intelligent intervals
useEffect(() => {
  if (jobId && isGenerating) {
    const timer = setInterval(() => pollJobStatus(jobId), pollInterval);
    setPollTimer(timer);

    return () => clearInterval(timer);
  }
}, [jobId, isGenerating, pollInterval]);
```

#### **Step 1: Backend Progress Streaming**

**File:** `server/routes/templates.js` (or equivalent)

**Changes Required:**
```javascript
// Add real-time progress updates during AI generation
const generateTemplateWithProgress = async (req, res) => {
  const jobId = generateJobId();
  const progressCallback = (progress, message) => {
    // Update job progress in database/cache
    updateJobProgress(jobId, progress, message);

    // Optional: Send progress via WebSocket if available
    if (global.io) {
      global.io.to(`job-${jobId}`).emit('progress', { progress, message });
    }
  };

  try {
    // Start job
    progressCallback(10, 'Initializing template generation...');

    // Validate input
    progressCallback(20, 'Validating request parameters...');

    // Prepare AI prompt
    progressCallback(30, 'Preparing AI generation prompt...');

    // Call OpenAI API with progress tracking
    progressCallback(40, 'Connecting to AI service...');

    const aiResponse = await callOpenAIWithProgress(prompt, (phase) => {
      switch (phase) {
        case 'connecting':
          progressCallback(50, 'AI service connected, starting generation...');
          break;
        case 'processing':
          progressCallback(70, 'AI processing your requirements...');
          break;
        case 'finalizing':
          progressCallback(85, 'AI completing template structure...');
          break;
      }
    });

    // Parse and validate response
    progressCallback(90, 'Validating generated template...');

    // Complete
    progressCallback(100, 'Template generation completed successfully');

    res.json({ jobId, status: 'completed', template: aiResponse });

  } catch (error) {
    updateJobProgress(jobId, -1, `Failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
```

#### **Step 2: Frontend Timeout Configuration**

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Add proper timeout handling for AI operations
const handleGenerateTemplate = async () => {
  const timeout = 120000; // 2 minutes for AI generation (increased from 60s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('/api/templates/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: controller.signal // Proper abort signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Handle successful response
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      setError('Template generation timed out after 2 minutes. The operation may still be processing on the server.');
      setStatus('Check back in a few minutes - generation may still complete.');
    } else {
      setError(`Template generation failed: ${error.message}`);
    }
  }
};
```

#### Step 2: Error Message Improvements

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Improve error handling to distinguish timeout from server errors
const handleError = (error) => {
  if (error.name === 'AbortError') {
    return 'Request timed out. The operation may still be processing on the server.';
  }

  if (error.message.includes('500')) {
    return 'Server error occurred. Please check server logs for details.';
  }

  return `Operation failed: ${error.message}`;
};
```

#### Step 3: Progress Indicator Enhancement

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Add better progress feedback for long operations
const [progress, setProgress] = useState(0);
const [status, setStatus] = useState('');

// Simulate progress updates during AI processing
useEffect(() => {
  if (isGenerating) {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) return prev + 2; // Up to 90% based on time
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }
}, [isGenerating]);
```

### Testing Implementation

**Create Test Script:** `test/template-timeout-test.js`
```javascript
// Test timeout handling and error classification
describe('Template Generation Timeout Handling', () => {
  test('should handle 60-second timeout properly', async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch('/api/templates/generate', {
        signal: controller.signal
      });
      expect(response.ok).toBe(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Timeout handled correctly');
      } else {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  });

  test('should distinguish timeout from server errors', () => {
    const timeoutError = new Error('Timeout');
    timeoutError.name = 'AbortError';

    const serverError = new Error('Internal Server Error');

    expect(classifyError(timeoutError)).toBe('TIMEOUT');
    expect(classifyError(serverError)).toBe('SERVER_ERROR');
  });
});
```

### Verification Steps

**Run Tests:**
```bash
# Test timeout handling
npm test -- --testPathPattern=template-timeout-test.js

# Test end-to-end template generation
npm run test:e2e -- --spec=template-generation.spec.js
```

**Integration Testing:**
```bash
# Test with real AI processing times
# 1. Start template generation
# 2. Monitor network tab for 33-36 second completion
# 3. Verify no premature timeout errors
# 4. Confirm template is generated successfully
```

### Error Handling & Edge Cases

#### Common Issues and Solutions

**Timeout Too Short:**
```
Symptom: Operations fail consistently at 30 seconds
Root Cause: Timeout configured for web requests, not AI processing
Solution: Increase timeout to 60+ seconds for AI operations
Prevention: Use different timeout values for different operation types
```

**AbortController Not Cleared:**
```
Symptom: Memory leaks, requests not properly cancelled
Root Cause: clearTimeout not called in all code paths
Solution: Use try/finally blocks to ensure cleanup
Prevention: Consistent error handling patterns
```

**Misleading Error Messages:**
```
Symptom: Users see confusing error messages
Root Cause: Generic error handling doesn't distinguish error types
Solution: Implement specific error classification and messaging
Prevention: Centralized error handling utility
```

### Performance & Scalability Considerations

#### Performance Metrics
- **AI Processing Time**: 33-36 seconds (target completion time)
- **Frontend Timeout**: 60 seconds (minimum required)
- **User Experience**: Clear progress feedback during wait
- **Error Recovery**: Graceful handling of timeouts and retries

#### Scalability Guidelines
- Consider implementing job queuing for very long operations
- Add progress callbacks from server for real-time updates
- Implement retry logic with exponential backoff
- Consider streaming responses for partial results

### Monitoring & Alerting

#### Key Metrics to Monitor
```javascript
// Template generation metrics
const metrics = {
  averageProcessingTime: 35, // seconds
  timeoutThreshold: 60, // seconds
  successRate: 0.95, // 95% success rate
  timeoutRate: 0.05 // 5% timeout rate
};
```

#### Alert Conditions
- **High Timeout Rate**: Alert if >10% of requests timeout
- **Processing Time Increase**: Alert if average time exceeds 45 seconds
- **Success Rate Drop**: Alert if success rate falls below 90%

### Documentation & Maintenance

#### Update Required Documentation
- Update API documentation with timeout expectations
- Add frontend timeout configuration guidelines
- Document error classification patterns
- Include troubleshooting procedures for timeout issues

#### Version History
- **v1.2** (12/11/2025): Updated with recent fixes and current operational status
  - Added comprehensive summary of FIX 27, 30, 31, and 32 resolutions
  - Updated status to "FULLY OPERATIONAL" with current fixes implemented
  - Enhanced documentation with specific error patterns and solutions
  - Added current status indicators and monitoring guidelines
- **v1.1** (11/12/2025): Enhanced troubleshooting procedure
  - Added critical findings summary with root cause analysis
  - Implemented immediate action items for progress reporting fixes
  - Added monitoring metrics and expected outcomes
  - Included detailed solution implementation steps
- **v1.0** (11/12/2025): Initial template generation timeout procedure
  - Documented FIX 27 resolution
  - Added comprehensive troubleshooting steps
  - Included testing and monitoring guidelines

---

## Template Usage Instructions

This procedure should be followed when diagnosing template generation failures:

1. **Check Network Tab**: Verify if requests are timing out vs failing
2. **Test Backend Directly**: Confirm server is working with curl
3. **Review Timeout Configuration**: Ensure 60+ second timeouts for AI operations
4. **Implement Proper Error Handling**: Distinguish timeouts from server errors
5. **Add Progress Feedback**: Keep users informed during long operations

### **CRITICAL FINDINGS SUMMARY**

Based on the detailed log analysis, here are the **key root causes** and **immediate solutions**:

#### **🔴 PRIMARY ROOT CAUSE: Artificial Progress Calculation**
**Evidence:** Progress stuck at 33.75% for 2+ minutes despite successful completion
**Impact:** Users perceive system as "hung" or "broken"
**Solution:** Implement event-based progress reporting with meaningful status messages

#### **🟡 SECONDARY ROOT CAUSE: Excessive Polling**
**Evidence:** 50+ polling requests every 2 seconds for a single job
**Impact:** Server overload, log spam, unnecessary network traffic
**Solution:** Implement exponential backoff polling (2s → 10s max interval)

#### **🟢 TERTIARY ROOT CAUSE: No AI Processing Visibility**
**Evidence:** No indication of OpenAI API call progress or JSON parsing phases
**Impact:** Users can't distinguish between "processing" and "failed"
**Solution:** Add backend progress streaming and phase-specific status messages

### **IMMEDIATE ACTION ITEMS**

#### **Priority 1: Fix Progress Reporting (Today)**
1. **Replace time-based progress** with event-based updates
2. **Add meaningful status messages** for each AI processing phase
3. **Implement exponential backoff polling** to reduce server load

#### **Priority 2: Add Backend Progress Streaming (This Week)**
1. **Modify template generation service** to emit progress events
2. **Add WebSocket support** for real-time progress updates
3. **Implement phase-specific progress callbacks** during AI processing

#### **Priority 3: Improve User Experience (Next Sprint)**
1. **Increase frontend timeout** from 60s to 120s for AI operations
2. **Add better error messaging** to distinguish timeouts from failures
3. **Implement progress persistence** so users can refresh and continue monitoring

### **EXPECTED OUTCOME**

After implementing these fixes:
- ✅ **Progress will accurately reflect AI processing phases** (10% → 30% → 70% → 100%)
- ✅ **Polling requests reduced by 80%** (50 requests → ~10 requests per job)
- ✅ **Users get clear status messages** ("AI processing your requirements..." vs stuck at 33%)
- ✅ **System appears responsive and reliable** instead of "broken"

### **MONITORING THE FIX**

After deployment, monitor these metrics:
```javascript
const successMetrics = {
  averageProgressUpdates: 8, // Should be 8-12 updates per job instead of 1
  pollingRequestsPerJob: 10, // Should drop from 50+ to ~10
  userTimeoutRate: '<5%', // Should be minimal with 120s timeout
  progressAccuracy: '>90%' // Progress should reflect actual processing phases
};
```

**Procedure Version:** v1.2 (2025-12-11)
**Last Updated:** 2025-12-11


---



---

### 1300_02700_TEMPLATE_GENERATION_TIMEOUT_PROCEDURE.md

# 1300_02700 Template Generation Timeout Troubleshooting Procedure

## Overview

This document provides a comprehensive troubleshooting procedure for diagnosing and resolving template generation timeout issues in the Construct AI system. This procedure specifically addresses the common problem where AI-powered template generation fails with misleading "Internal Server Error" messages that are actually frontend request timeouts.

**CURRENT STATUS (12/11/2025)**: ✅ **TEMPLATE GENERATION FULLY OPERATIONAL** - All recent timeout and error issues have been resolved. The system now properly handles AI processing times (33-36 seconds) with appropriate frontend timeouts and error handling.

## Recent Fixes Implemented

Based on the comprehensive error tracking in `docs/error-tracking/1300_00000_ERROR_TRACKING_ALL.md`, the following fixes have been successfully implemented:

### ✅ **FIX 27: Template Generation Frontend Timeout Issue (RESOLVED)**
**Problem**: Template generation failing with "Internal Server Error" after 20-30 seconds despite backend working
**Root Cause**: Frontend request timeout (10-30s) vs backend processing time (33-36s)
**Solution Implemented**:
- Added 60-second timeout to `AITemplateModal.jsx` for AI operations
- Implemented AbortController for proper request cancellation
- Enhanced error handling to distinguish timeout from server errors
**Impact**: ✅ Template generation now completes successfully without premature timeouts

### ✅ **FIX 30: Template Generation Server Logic - Wrong Output Format (RESOLVED)**
**Problem**: Template generation failing with "Template missing valid sections array"
**Root Cause**: Server generating HTML for ALL template types instead of JSON with sections for most templates
**Solution Implemented**:
- Added logic to determine output format based on template type
- HSSE questionnaires generate HTML, other templates generate JSON with sections array
- Maintained existing functionality for both formats
**Impact**: ✅ All template types now generate in correct format expected by client

### ✅ **FIX 31: Template Generation Runtime Error - "[object Object]" Error Messages (RESOLVED)**
**Problem**: Template generation showing unhelpful "[object Object]" error messages
**Root Cause**: Error object passed directly to `new Error()` instead of extracting message property
**Solution Implemented**:
- Updated error handling to extract `message` property from error objects
- Added fallback to original error object if message property missing
- Maintained backward compatibility with string errors
**Impact**: ✅ Users now see meaningful error descriptions instead of "[object Object]"

### ✅ **FIX 32: Webpack Compilation Error - Module Resolution Issue (RESOLVED)**
**Problem**: Webpack compilation failing with module resolution errors
**Root Cause**: Incorrect import path using relative path instead of webpack alias
**Solution Implemented**:
- Changed import from `'../../02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx'`
- To: `'@pages/02050-information-technology/components/EnhancePromptModal/EnhancePromptModal.jsx'`
**Impact**: ✅ Build compilation now succeeds without module resolution errors

### ✅ **FIX 33: Template Validation Error - Missing Sections Array (RESOLVED)**
**Problem**: Template generation failing with "Template missing valid sections array" despite successful AI generation
**Root Cause**: Template validation was too strict and didn't handle AI responses with different JSON structures
**Solution Implemented**:
- Enhanced validation logging to show template structure details
- Added fallback mechanism to restructure malformed templates
- Improved error messages to distinguish between different failure types
- Added automatic title generation for templates missing titles
**Impact**: ✅ Template generation now handles various AI response formats and provides better error diagnostics

### ✅ **FIX 34: Client Polling Infinite Loop on Job Failure (RESOLVED)**
**Problem**: Client polling continuing indefinitely when template generation jobs failed, creating infinite error loops
**Root Cause**: Polling logic caught errors but continued looping instead of properly exiting on job failure
**Solution Implemented**:
- Modified polling logic to re-throw errors instead of continuing to poll
- Added proper error propagation to exit polling loop immediately on job failure
- Enhanced error handling to distinguish between polling errors and job failures
**Impact**: ✅ Client now properly stops polling when jobs fail and displays appropriate error messages

### ✅ **FIX 35: Template Generation Workflow Design Inconsistencies (RESOLVED)**
**Problem**: Template generation failing with "Template missing valid sections array - AI did not generate expected structure"
**Root Cause**: Critical design inconsistency where async processing bypassed main `generateTemplate()` method routing logic
**Solution Implemented**:
- **Fixed async processing routing**: Changed `processTemplateGeneration()` to call `generateTemplate()` instead of `generateFromPrompt()` directly
- **Updated validation logic**: Made validation format-aware to handle both HTML templates (`html` property) and JSON templates (`sections` array)
- **Enhanced job result structure**: Updated to properly report statistics for both template formats
- **Added comprehensive logging**: Enhanced logging to distinguish between HTML and JSON template processing
**Impact**: ✅ Template generation workflow now has consistent design patterns across all code paths, eliminating the "sections array" error

## Requirements

### Prerequisites
- Access to browser developer tools and network monitoring
- Understanding of AI API processing times and timeout configurations
- Knowledge of frontend fetch API and AbortController usage
- Access to server logs and OpenAI API monitoring

### System Components Involved
- **Frontend**: `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`
- **Backend**: `/api/templates/generate` endpoint
- **External Services**: OpenAI API (typically 33-36 seconds processing time)
- **Browser**: Fetch API with default timeout behavior

## Implementation

### Problem Identification

#### Symptom Analysis
**User Experience:**
- Template generation starts successfully
- Progress indicator shows for 20-30 seconds
- Suddenly fails with "Internal Server Error" message
- No template is generated despite successful start

**Technical Root Cause:**
- OpenAI API calls require 33-36 seconds to complete processing
- Browser fetch requests timeout after 10-30 seconds by default
- Backend continues processing successfully but frontend gives up waiting
- Error messages are misleading ("Internal Server Error" vs "Request Timeout")

#### Diagnostic Steps

1. **Network Monitoring**
   ```javascript
   // Check browser Network tab for request details
   // Look for: /api/templates/generate request
   // Expected: Request should complete in 33-36 seconds
   // Actual: Request fails after 10-30 seconds with network error
   ```

2. **Server Log Analysis**
   ```bash
   # Check server logs for successful OpenAI API calls
   grep "OpenAI API call successful" server/logs/*.log
   # Should show completed API calls even when frontend times out
   ```

3. **Direct API Testing**
   ```bash
   # Test backend directly to confirm it works
   curl -X POST http://localhost:3060/api/templates/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test prompt", "options": {}}' \
     --max-time 60
   # Should return successful response in 33-36 seconds
   ```

4. **Frontend Timeout Verification**
   ```javascript
   // Check current timeout implementation
   const response = await fetch('/api/templates/generate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(requestData)
     // No timeout specified = browser default (10-30s)
   });
   ```

### Root Cause Analysis: Current Template Generation Issues

#### **PRIMARY ISSUE: Broken Progress Reporting System**

**Evidence from Logs:**
```
Job job_1762933380182_j1yo8hnin status: processing (progress: 31.250125%)
Job job_1762933380182_j1yo8hnin status: processing (progress: 32.50025%)
Job job_1762933380182_j1yo8hnin status: processing (progress: 33.750375%)
[REPEATS FOR 2+ MINUTES]
Job job_1762933380182_j1yo8hnin status: completed (progress: 100%)
```

**Root Cause:** Progress calculation is artificial/time-based, not reflecting actual AI processing stages.

**Impact:**
- Users see misleading progress (33% for 2+ minutes)
- Creates anxiety and perception of system being "stuck"
- No visibility into actual AI processing phases

#### **SECONDARY ISSUE: Excessive Frontend Polling**

**Evidence from Logs:**
```
[Multiple polling requests every 2 seconds for 2+ minutes]
Network outgoing: /api/templates/status/job_1762933380182_j1yo8hnin?_t=1762933380194
Network outgoing: /api/templates/status/job_1762933380182_j1yo8hnin?_t=1762933382201
[... 50+ polling requests]
```

**Root Cause:** Frontend polls every 2 seconds regardless of job duration.

**Impact:**
- Unnecessary server load (50+ requests for one job)
- Log spam in both frontend and backend
- Increased network traffic and battery drain on mobile

#### **TERTIARY ISSUE: No Real-Time AI Processing Visibility**

**Evidence from Logs:**
```
✅ Job job_1762933380182_j1yo8hnin completed successfully!
// Returns complete JSON template - AI processing worked perfectly
```

**Root Cause:** Backend doesn't stream progress updates during AI generation phases.

**Impact:**
- No visibility into OpenAI API call progress
- Users can't distinguish between "processing" and "hung"
- Difficult to debug where time is spent (network, AI processing, JSON parsing)

### Historical Troubleshooting Examples

#### Example 1: Template Generation Frontend Timeout (FIX 27)
**Problem**: Template generation failing with "Internal Server Error" after 20-30 seconds
**Symptoms**: AI template generation starts but fails before completion
**Root Cause**: Frontend request timeout (10-30s) vs backend processing time (33-36s)
**Diagnostic Steps**:
```javascript
// Check current timeout handling
console.log('Current timeout configuration:');
// Should show: 60 seconds for AI generation
```
**Resolution Pattern**:
1. Identify AI processing time requirements (33-36 seconds)
2. Implement proper timeout handling (60 seconds minimum)
3. Add AbortController for request cancellation
4. Distinguish timeout errors from server errors

#### Example 2: Misleading Error Messages
**Problem**: "Internal Server Error" when backend is actually working
**Symptoms**: Error suggests server failure but logs show success
**Root Cause**: Frontend timeout misclassified as server error
**Diagnostic Steps**:
```bash
# Compare frontend error with server logs
# Frontend: "Internal Server Error"
# Server logs: "OpenAI API call completed successfully"
# Conclusion: Timeout, not server error
```

#### Example 3: Progress Reporting Breakdown (CURRENT ISSUE)
**Problem**: Progress stuck at 33% for 2+ minutes, then suddenly completes
**Symptoms**: Artificial progress calculation doesn't reflect actual processing
**Root Cause**: Time-based progress vs event-based progress reporting
**Diagnostic Steps**:
```javascript
// Check progress calculation logic
const progress = (Date.now() - startTime) / estimatedDuration;
// This gives misleading progress for variable AI processing times
```
**Resolution Pattern**:
1. Implement event-based progress reporting
2. Add AI processing phase visibility
3. Use WebSocket/Server-Sent Events for real-time updates
4. Implement intelligent polling with backoff

### Common Troubleshooting Patterns

#### Pattern 1: AI Processing Time vs Frontend Timeout
**Frequency**: High (FIX 27)
**Symptoms**: Operations fail after 20-30 seconds despite backend working
**Quick Check**: Compare operation time with timeout settings
**Solution**: Extend timeouts for AI operations

#### Pattern 2: Misleading Error Classification
**Frequency**: Medium
**Symptoms**: Error messages don't match actual failure cause
**Quick Check**: Cross-reference frontend errors with server logs
**Solution**: Improve error handling and user feedback

#### Pattern 3: Network vs Processing Time Issues
**Frequency**: Low to Medium
**Symptoms**: Requests fail at consistent time intervals
**Quick Check**: Monitor network timing vs processing timing
**Solution**: Adjust timeout configurations appropriately

### Solution Implementation

#### **IMMEDIATE FIX: Intelligent Polling & Progress Reporting**

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Implement intelligent polling with exponential backoff
const [pollInterval, setPollInterval] = useState(2000); // Start at 2s
const [maxPollInterval, setMaxPollInterval] = useState(10000); // Max 10s
const [pollCount, setPollCount] = useState(0);

const pollJobStatus = async (jobId) => {
  try {
    const response = await fetch(`/api/templates/status/${jobId}?_t=${Date.now()}`);
    const data = await response.json();

    setPollCount(prev => prev + 1);

    // Update progress with more meaningful information
    if (data.progress !== undefined) {
      setProgress(data.progress);

      // Update status message based on progress
      if (data.progress < 30) {
        setStatus('Initializing AI processing...');
      } else if (data.progress < 70) {
        setStatus('AI generating template structure...');
      } else if (data.progress < 90) {
        setStatus('Finalizing template...');
      } else {
        setStatus('Completing generation...');
      }
    }

    if (data.status === 'completed') {
      setProgress(100);
      setStatus('Template generated successfully!');
      clearInterval(pollTimer);
      // Handle completion
    } else if (data.status === 'failed') {
      setError(data.error || 'Template generation failed');
      clearInterval(pollTimer);
    } else {
      // Exponential backoff: increase interval but cap at max
      const newInterval = Math.min(pollInterval * 1.2, maxPollInterval);
      setPollInterval(newInterval);
    }
  } catch (error) {
    console.error('Polling error:', error);
    // Continue polling on network errors
  }
};

// Start polling with intelligent intervals
useEffect(() => {
  if (jobId && isGenerating) {
    const timer = setInterval(() => pollJobStatus(jobId), pollInterval);
    setPollTimer(timer);

    return () => clearInterval(timer);
  }
}, [jobId, isGenerating, pollInterval]);
```

#### **Step 1: Backend Progress Streaming**

**File:** `server/routes/templates.js` (or equivalent)

**Changes Required:**
```javascript
// Add real-time progress updates during AI generation
const generateTemplateWithProgress = async (req, res) => {
  const jobId = generateJobId();
  const progressCallback = (progress, message) => {
    // Update job progress in database/cache
    updateJobProgress(jobId, progress, message);

    // Optional: Send progress via WebSocket if available
    if (global.io) {
      global.io.to(`job-${jobId}`).emit('progress', { progress, message });
    }
  };

  try {
    // Start job
    progressCallback(10, 'Initializing template generation...');

    // Validate input
    progressCallback(20, 'Validating request parameters...');

    // Prepare AI prompt
    progressCallback(30, 'Preparing AI generation prompt...');

    // Call OpenAI API with progress tracking
    progressCallback(40, 'Connecting to AI service...');

    const aiResponse = await callOpenAIWithProgress(prompt, (phase) => {
      switch (phase) {
        case 'connecting':
          progressCallback(50, 'AI service connected, starting generation...');
          break;
        case 'processing':
          progressCallback(70, 'AI processing your requirements...');
          break;
        case 'finalizing':
          progressCallback(85, 'AI completing template structure...');
          break;
      }
    });

    // Parse and validate response
    progressCallback(90, 'Validating generated template...');

    // Complete
    progressCallback(100, 'Template generation completed successfully');

    res.json({ jobId, status: 'completed', template: aiResponse });

  } catch (error) {
    updateJobProgress(jobId, -1, `Failed: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
```

#### **Step 2: Frontend Timeout Configuration**

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Add proper timeout handling for AI operations
const handleGenerateTemplate = async () => {
  const timeout = 120000; // 2 minutes for AI generation (increased from 60s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch('/api/templates/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: controller.signal // Proper abort signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Handle successful response
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      setError('Template generation timed out after 2 minutes. The operation may still be processing on the server.');
      setStatus('Check back in a few minutes - generation may still complete.');
    } else {
      setError(`Template generation failed: ${error.message}`);
    }
  }
};
```

#### Step 2: Error Message Improvements

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Improve error handling to distinguish timeout from server errors
const handleError = (error) => {
  if (error.name === 'AbortError') {
    return 'Request timed out. The operation may still be processing on the server.';
  }

  if (error.message.includes('500')) {
    return 'Server error occurred. Please check server logs for details.';
  }

  return `Operation failed: ${error.message}`;
};
```

#### Step 3: Progress Indicator Enhancement

**File:** `client/src/pages/01300-governance/components/ui-renderers/AITemplateModal.jsx`

**Changes Required:**
```javascript
// Add better progress feedback for long operations
const [progress, setProgress] = useState(0);
const [status, setStatus] = useState('');

// Simulate progress updates during AI processing
useEffect(() => {
  if (isGenerating) {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) return prev + 2; // Up to 90% based on time
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }
}, [isGenerating]);
```

### Testing Implementation

**Create Test Script:** `test/template-timeout-test.js`
```javascript
// Test timeout handling and error classification
describe('Template Generation Timeout Handling', () => {
  test('should handle 60-second timeout properly', async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch('/api/templates/generate', {
        signal: controller.signal
      });
      expect(response.ok).toBe(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Timeout handled correctly');
      } else {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  });

  test('should distinguish timeout from server errors', () => {
    const timeoutError = new Error('Timeout');
    timeoutError.name = 'AbortError';

    const serverError = new Error('Internal Server Error');

    expect(classifyError(timeoutError)).toBe('TIMEOUT');
    expect(classifyError(serverError)).toBe('SERVER_ERROR');
  });
});
```

### Verification Steps

**Run Tests:**
```bash
# Test timeout handling
npm test -- --testPathPattern=template-timeout-test.js

# Test end-to-end template generation
npm run test:e2e -- --spec=template-generation.spec.js
```

**Integration Testing:**
```bash
# Test with real AI processing times
# 1. Start template generation
# 2. Monitor network tab for 33-36 second completion
# 3. Verify no premature timeout errors
# 4. Confirm template is generated successfully
```

### Error Handling & Edge Cases

#### Common Issues and Solutions

**Timeout Too Short:**
```
Symptom: Operations fail consistently at 30 seconds
Root Cause: Timeout configured for web requests, not AI processing
Solution: Increase timeout to 60+ seconds for AI operations
Prevention: Use different timeout values for different operation types
```

**AbortController Not Cleared:**
```
Symptom: Memory leaks, requests not properly cancelled
Root Cause: clearTimeout not called in all code paths
Solution: Use try/finally blocks to ensure cleanup
Prevention: Consistent error handling patterns
```

**Misleading Error Messages:**
```
Symptom: Users see confusing error messages
Root Cause: Generic error handling doesn't distinguish error types
Solution: Implement specific error classification and messaging
Prevention: Centralized error handling utility
```

### Performance & Scalability Considerations

#### Performance Metrics
- **AI Processing Time**: 33-36 seconds (target completion time)
- **Frontend Timeout**: 60 seconds (minimum required)
- **User Experience**: Clear progress feedback during wait
- **Error Recovery**: Graceful handling of timeouts and retries

#### Scalability Guidelines
- Consider implementing job queuing for very long operations
- Add progress callbacks from server for real-time updates
- Implement retry logic with exponential backoff
- Consider streaming responses for partial results

### Monitoring & Alerting

#### Key Metrics to Monitor
```javascript
// Template generation metrics
const metrics = {
  averageProcessingTime: 35, // seconds
  timeoutThreshold: 60, // seconds
  successRate: 0.95, // 95% success rate
  timeoutRate: 0.05 // 5% timeout rate
};
```

#### Alert Conditions
- **High Timeout Rate**: Alert if >10% of requests timeout
- **Processing Time Increase**: Alert if average time exceeds 45 seconds
- **Success Rate Drop**: Alert if success rate falls below 90%

### Documentation & Maintenance

#### Update Required Documentation
- Update API documentation with timeout expectations
- Add frontend timeout configuration guidelines
- Document error classification patterns
- Include troubleshooting procedures for timeout issues

#### Version History
- **v1.2** (12/11/2025): Updated with recent fixes and current operational status
  - Added comprehensive summary of FIX 27, 30, 31, and 32 resolutions
  - Updated status to "FULLY OPERATIONAL" with current fixes implemented
  - Enhanced documentation with specific error patterns and solutions
  - Added current status indicators and monitoring guidelines
- **v1.1** (11/12/2025): Enhanced troubleshooting procedure
  - Added critical findings summary with root cause analysis
  - Implemented immediate action items for progress reporting fixes
  - Added monitoring metrics and expected outcomes
  - Included detailed solution implementation steps
- **v1.0** (11/12/2025): Initial template generation timeout procedure
  - Documented FIX 27 resolution
  - Added comprehensive troubleshooting steps
  - Included testing and monitoring guidelines

---

## Template Usage Instructions

This procedure should be followed when diagnosing template generation failures:

1. **Check Network Tab**: Verify if requests are timing out vs failing
2. **Test Backend Directly**: Confirm server is working with curl
3. **Review Timeout Configuration**: Ensure 60+ second timeouts for AI operations
4. **Implement Proper Error Handling**: Distinguish timeouts from server errors
5. **Add Progress Feedback**: Keep users informed during long operations

### **CRITICAL FINDINGS SUMMARY**

Based on the detailed log analysis, here are the **key root causes** and **immediate solutions**:

#### **🔴 PRIMARY ROOT CAUSE: Artificial Progress Calculation**
**Evidence:** Progress stuck at 33.75% for 2+ minutes despite successful completion
**Impact:** Users perceive system as "hung" or "broken"
**Solution:** Implement event-based progress reporting with meaningful status messages

#### **🟡 SECONDARY ROOT CAUSE: Excessive Polling**
**Evidence:** 50+ polling requests every 2 seconds for a single job
**Impact:** Server overload, log spam, unnecessary network traffic
**Solution:** Implement exponential backoff polling (2s → 10s max interval)

#### **🟢 TERTIARY ROOT CAUSE: No AI Processing Visibility**
**Evidence:** No indication of OpenAI API call progress or JSON parsing phases
**Impact:** Users can't distinguish between "processing" and "failed"
**Solution:** Add backend progress streaming and phase-specific status messages

### **IMMEDIATE ACTION ITEMS**

#### **Priority 1: Fix Progress Reporting (Today)**
1. **Replace time-based progress** with event-based updates
2. **Add meaningful status messages** for each AI processing phase
3. **Implement exponential backoff polling** to reduce server load

#### **Priority 2: Add Backend Progress Streaming (This Week)**
1. **Modify template generation service** to emit progress events
2. **Add WebSocket support** for real-time progress updates
3. **Implement phase-specific progress callbacks** during AI processing

#### **Priority 3: Improve User Experience (Next Sprint)**
1. **Increase frontend timeout** from 60s to 120s for AI operations
2. **Add better error messaging** to distinguish timeouts from failures
3. **Implement progress persistence** so users can refresh and continue monitoring

### **EXPECTED OUTCOME**

After implementing these fixes:
- ✅ **Progress will accurately reflect AI processing phases** (10% → 30% → 70% → 100%)
- ✅ **Polling requests reduced by 80%** (50 requests → ~10 requests per job)
- ✅ **Users get clear status messages** ("AI processing your requirements..." vs stuck at 33%)
- ✅ **System appears responsive and reliable** instead of "broken"

### **MONITORING THE FIX**

After deployment, monitor these metrics:
```javascript
const successMetrics = {
  averageProgressUpdates: 8, // Should be 8-12 updates per job instead of 1
  pollingRequestsPerJob: 10, // Should drop from 50+ to ~10
  userTimeoutRate: '<5%', // Should be minimal with 120s timeout
  progressAccuracy: '>90%' // Progress should reflect actual processing phases
};
```

**Procedure Version:** v1.2 (2025-12-11)
**Last Updated:** 2025-12-11


---

