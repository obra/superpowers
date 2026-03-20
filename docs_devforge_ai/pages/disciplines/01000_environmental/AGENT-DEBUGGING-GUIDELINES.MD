# Agent Debugging Guidelines

## Overview
This document provides comprehensive debugging strategies and techniques specifically for Construct AI agents. Use this guide when troubleshooting agent behavior, performance issues, or unexpected outputs.

## Quick Reference

### Common Agent Issues & Solutions

| Issue | Symptoms | Primary Debug Steps |
|-------|----------|-------------------|
| [Hypothetical Content Generation](#hypothetical-content) | LLM generates scenarios instead of analyzing provided data | Check prompt language, validate input data |
| [Missing Context](#missing-context) | Agent lacks required information | Verify data flow, check preprocessing |
| [Inconsistent Outputs](#inconsistent-outputs) | Same input produces different results | Check temperature settings, seed values |
| [Performance Degradation](#performance-degradation) | Slow response times, timeouts | Monitor token usage, check API limits |
| [Workflow Interruptions](#workflow-interruptions) | Agent stops mid-process | Check error handling, async operations |

## Debugging Methodology

### 1. Define the Problem Clearly
- **What should happen?** Document expected behavior
- **What actually happens?** Record actual vs expected output
- **When does it occur?** Specific conditions, inputs, or timing
- **Impact assessment:** User impact, system stability, business effects

### 2. Gather Evidence
- **Logs:** Enable verbose logging, capture error messages
- **Inputs:** Preserve exact input data that triggered the issue
- **Outputs:** Save both expected and actual outputs
- **Environment:** Note system state, versions, configurations

### 3. Isolate the Issue
- **Reproduce:** Create minimal test case that reliably reproduces the issue
- **Component isolation:** Test individual components separately
- **Boundary testing:** Check interfaces between components

### 4. Root Cause Analysis
- **Data flow tracing:** Follow data through the entire pipeline
- **Configuration verification:** Check all relevant settings and parameters
- **Dependency checking:** Verify external services and data sources

## Specific Agent Issues & Solutions

### Hypothetical Content Generation {#hypothetical-content}

**Symptoms:**
- Agent generates "Given the constraints..." or "without access to..."
- Output contains hypothetical scenarios instead of analyzing provided data
- Generic advice instead of specific analysis

**Root Causes:**
- Prompt language suggests future data availability ("will receive")
- Missing input validation before LLM calls
- Poor context demarcation in prompts

**Debug Steps:**
1. **Check Prompt Language**
   ```javascript
   // BAD: Implies future receipt
   "You will receive the following inputs:"

   // GOOD: Confirms current availability
   "You ARE receiving the actual data in this prompt:"
   ```

2. **Validate Input Data**
   ```javascript
   // Add validation before LLM calls
   const content = inputData.content || '';
   if (!content || content.trim().length < 10) {
     throw new Error(`Insufficient content: ${content.length} characters`);
   }
   ```

3. **Check Context Preparation**
   - Ensure clear section headers: `=== ACTUAL DATA ===`
   - Add explicit warnings: `DO NOT generate hypothetical examples`
   - Include validation confirmation in prompts

### Missing Context Issues {#missing-context}

**Symptoms:**
- Agent requests information that should be available
- Incomplete analysis due to missing data
- References to "unavailable" or "not provided" data

**Debug Steps:**
1. **Trace Data Flow**
   - Verify data extraction from previous steps
   - Check data transformation and formatting
   - Confirm data reaches the agent correctly

2. **Check Preprocessing**
   - Validate document analysis outputs
   - Verify identifier extraction results
   - Confirm document retrieval success

3. **Agent Configuration**
   - Check agent initialization parameters
   - Verify context window limits
   - Confirm API key and endpoint configuration

### Inconsistent Outputs {#inconsistent-outputs}

**Symptoms:**
- Same input produces different results
- Unpredictable agent behavior
- Quality variations between runs

**Debug Steps:**
1. **Temperature & Randomness**
   ```javascript
   // For deterministic outputs
   const config = {
     temperature: 0.1,  // Low for consistency
     seed: 42          // Fixed seed if supported
   };
   ```

2. **Input Normalization**
   - Ensure consistent input formatting
   - Remove timestamps and random elements from prompts
   - Standardize data structure

3. **Caching Issues**
   - Clear any cached responses
   - Verify cache invalidation logic
   - Check for stale data

### Performance Degradation {#performance-degradation}

**Symptoms:**
- Slow response times
- Timeout errors
- API rate limit hits

**Debug Steps:**
1. **Token Usage Monitoring**
   ```javascript
   // Log token usage
   console.log(`Input tokens: ${usage.prompt_tokens}`);
   console.log(`Output tokens: ${usage.completion_tokens}`);
   console.log(`Total tokens: ${usage.total_tokens}`);
   ```

2. **API Limits**
   - Check rate limits and quotas
   - Implement exponential backoff
   - Monitor concurrent requests

3. **Optimization**
   - Reduce prompt size
   - Implement streaming responses
   - Cache frequent requests

### Workflow Interruptions {#workflow-interruptions}

**Symptoms:**
- Agent stops mid-execution
- Incomplete workflows
- Hanging processes

**Debug Steps:**
1. **Error Handling**
   ```javascript
   try {
     const result = await agent.process(input);
     return result;
   } catch (error) {
     console.error('Agent error:', {
       message: error.message,
       stack: error.stack,
       input: input,
       timestamp: new Date().toISOString()
     });
     throw error;
   }
   ```

2. **Async Operations**
   - Verify all promises are handled
   - Check timeout configurations
   - Monitor for race conditions

3. **State Management**
   - Verify state transitions
   - Check for infinite loops
   - Validate state persistence

## Agent-Specific Debugging

### Correspondence Agent
**Common Issues:**
- Specialist analysis failures
- Document retrieval problems
- HITL workflow interruptions

**Debug Commands:**
```bash
# Check correspondence workflow logs
grep "CorrespondenceOrchestrator" logs/app.log

# Verify document analysis
curl -X POST /api/debug/document-analysis -d '{"content": "test correspondence"}'

# Test specialist prompts
curl -X POST /api/debug/specialist-prompt -d '{"specialist": "civil_engineering"}'
```

### Document Analysis Agent
**Common Issues:**
- Poor text extraction
- Incorrect identifier detection
- Context loss

**Debug Steps:**
1. Check input text quality and length
2. Verify regex patterns for identifier extraction
3. Test with known good/bad examples

### Specialist Agents
**Common Issues:**
- Domain-specific knowledge gaps
- Incorrect technical recommendations
- Citation failures

**Debug Steps:**
1. Validate specialist prompt content
2. Check domain expertise data sources
3. Verify citation extraction logic

## Debugging Tools & Techniques

### Logging Strategies
```javascript
// Structured logging
const logContext = {
  agentId: 'correspondence-01',
  operation: 'document_analysis',
  inputHash: hash(input),
  timestamp: new Date().toISOString(),
  userId: context.userId
};

logger.info('operation_start', 'Starting document analysis', logContext);
```

### Debug Endpoints
Create debug endpoints for testing:

```javascript
// Debug route for agent testing
app.post('/api/debug/agent/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { input, options } = req.body;

  try {
    const agent = agentFactory.getAgent(agentId);
    const result = await agent.process(input, { ...options, debug: true });

    res.json({
      success: true,
      result,
      debug: {
        inputTokens: calculateTokens(input),
        processingTime: Date.now() - startTime,
        agentVersion: agent.version
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        stack: error.stack,
        input: input.substring(0, 100) + '...'
      }
    });
  }
});
```

### Monitoring & Alerts
```javascript
// Agent health monitoring
const agentHealth = {
  checkInterval: 30000, // 30 seconds

  async checkAgent(agentId) {
    try {
      const response = await fetch(`/api/health/agent/${agentId}`);
      const health = await response.json();

      if (!health.healthy) {
        alertSystem.trigger('agent_unhealthy', {
          agentId,
          issues: health.issues,
          lastSeen: health.lastResponse
        });
      }

      return health;
    } catch (error) {
      alertSystem.trigger('agent_check_failed', {
        agentId,
        error: error.message
      });
    }
  }
};
```

## Best Practices

### Prevention
1. **Input Validation:** Always validate inputs before processing
2. **Error Boundaries:** Wrap agent operations in try-catch blocks
3. **Logging:** Log all critical operations and decisions
4. **Testing:** Create comprehensive test suites for agents
5. **Monitoring:** Implement health checks and performance monitoring

### Development
1. **Modular Design:** Keep agents focused on single responsibilities
2. **Configuration:** Externalize all configurable parameters
3. **Documentation:** Document expected inputs, outputs, and error conditions
4. **Versioning:** Track agent versions and prompt changes
5. **Review Process:** Require code review for agent changes

### Deployment
1. **Gradual Rollout:** Deploy agent changes incrementally
2. **Feature Flags:** Use feature flags for new agent functionality
3. **Rollback Plan:** Always have rollback procedures ready
4. **Monitoring:** Monitor key metrics post-deployment

## Emergency Response

### Critical Agent Failure
1. **Immediate:** Stop affected workflows
2. **Assessment:** Determine scope and impact
3. **Containment:** Implement temporary workarounds
4. **Recovery:** Deploy fix or rollback
5. **Review:** Conduct post-mortem analysis

### Performance Degradation
1. **Monitor:** Set up alerts for performance thresholds
2. **Diagnose:** Identify bottlenecks and root causes
3. **Optimize:** Implement performance improvements
4. **Scale:** Add resources if needed

## Resources

### Related Documents
- [Error Tracking Log](./ERROR_TRACKING_LOG.md) - Historical error records
- [Agent Architecture Master Document](../plans/AGENT_ARCHITECTURE_MASTER_DOCUMENT.md)
- [Workflow Optimization Guide](../../procedures/WORKFLOW_OPTIMIZATION_GUIDE.md)

### External Resources
- OpenAI API Documentation
- LangChain Debugging Guide
- Agent Framework Best Practices

---

## Quick Debug Checklist

- [ ] **Define problem:** Expected vs actual behavior
- [ ] **Gather evidence:** Logs, inputs, outputs, environment
- [ ] **Reproduce issue:** Create reliable test case
- [ ] **Check inputs:** Validate data availability and format
- [ ] **Verify configuration:** Agent settings and parameters
- [ ] **Test components:** Isolate and test individual parts
- [ ] **Check dependencies:** External services and data sources
- [ ] **Review logs:** Look for error patterns and warnings
- [ ] **Monitor performance:** Response times and resource usage
- [ ] **Document findings:** Update error tracking log
- [ ] **Implement fix:** Apply solution with proper testing
- [ ] **Prevent recurrence:** Add validation and monitoring