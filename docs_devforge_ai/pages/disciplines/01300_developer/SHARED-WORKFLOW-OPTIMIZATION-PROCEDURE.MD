# Shared Workflow Optimization Procedure

**Document ID**: `0001_SHARED_WORKFLOW_OPTIMIZATION_PROCEDURE`
**Version**: 1.0.0
**Created**: 2026-02-25
**Status**: ACTIVE
**Applies To**: All Construct AI Agents

---

## Overview

This procedure outlines the standardized process for using the Shared Workflow Optimization Module across all Construct AI agents. The module provides enterprise-grade workflow optimization, performance monitoring, and compliance auditing capabilities that are available to all page agents.

### Purpose

- **Standardize** workflow optimization practices across all agents
- **Enable** consistent performance monitoring and improvement
- **Provide** AI-powered optimization recommendations
- **Ensure** compliance with optimization standards
- **Facilitate** cross-agent performance analysis

### Scope

This procedure applies to:
- All page agents in `deep-agents/deep_agents/agents/pages/`
- Agent developers implementing new features
- DevOps teams monitoring agent performance
- Quality assurance teams validating agent behavior

---

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **File System Access**: Read/write permissions for audit operations
- **Module Location**: `deep-agents/deep_agents/agents/shared/workflow-optimization/`

### Access Requirements

- **Developer Access**: Ability to import from shared modules
- **File System Permissions**: Write access to report directories
- **Network Access**: For external integrations (if applicable)

### Knowledge Requirements

- **JavaScript/ES6+**: Basic understanding of modern JavaScript
- **Construct AI Standards**: Familiarity with `0000_workflow_optimization_guide.md`
- **Agent Architecture**: Understanding of page agent structure

---

## Procedure Steps

### Step 1: Module Health Verification

**Objective**: Ensure the shared optimization module is functioning correctly.

#### Actions

1. **Navigate to module directory**:
```bash
cd deep-agents/deep_agents/agents/shared/workflow-optimization/
```

2. **Run health check**:
```bash
node index.js
```

3. **Verify output**:
```json
{
  "status": "healthy",
  "components": {
    "auditor": true,
    "aiOptimizer": true,
    "standards": true
  },
  "version": "1.0.0"
}
```

#### Success Criteria

- ✅ Status shows "healthy"
- ✅ All components return `true`
- ✅ Version number is current

#### Error Handling

- **Status: "unhealthy"** → Contact platform team for module repair
- **Component failure** → Check specific component logs
- **Import errors** → Verify file system permissions

---

### Step 2: Agent Integration Setup

**Objective**: Integrate shared optimization tools into your page agent.

#### For New Agent Development

1. **Import required components**:
```javascript
import {
    WorkflowOptimizationAuditor,
    AIWorkflowOptimizer,
    CircuitBreaker
} from '../../../shared/workflow-optimization/index.js';
```

2. **Initialize in constructor**:
```javascript
export class MyPageAgent {
    constructor() {
        // Core optimization tools
        this.auditor = new WorkflowOptimizationAuditor();
        this.aiOptimizer = new AIWorkflowOptimizer();

        // Resilience patterns
        this.circuitBreaker = new CircuitBreaker({
            failureThreshold: 3,
            recoveryTimeout: 30000
        });

        // Performance monitoring
        this.performanceMonitor = new PerformanceMonitor();
    }
}
```

3. **Add optimization methods**:
```javascript
async optimizeWorkflow() {
    try {
        const result = await this.aiOptimizer.analyzeAndOptimize(this.workflowConfig);
        console.log(`Optimization complete: ${result.recommendations.length} recommendations`);
        return result;
    } catch (error) {
        console.error('Workflow optimization failed:', error);
        throw error;
    }
}
```

#### For Existing Agent Enhancement

1. **Add imports to existing agent**:
```javascript
// Add to top of existing agent file
import { WorkflowOptimizationAuditor } from '../../../shared/workflow-optimization/index.js';
```

2. **Integrate into existing methods**:
```javascript
// Add to existing constructor
this.auditor = new WorkflowOptimizationAuditor();

// Add to existing workflow methods
async processWorkflow() {
    // Existing logic...

    // Add optimization audit
    const auditReport = await this.auditor.runOptimizationAudit('./');
    if (auditReport.detailed_results.summary.criticalIssues > 0) {
        console.warn(`Critical issues found: ${auditReport.detailed_results.summary.criticalIssues}`);
    }

    // Continue with existing logic...
}
```

---

### Step 3: Optimization Audit Execution

**Objective**: Run comprehensive optimization audits on agent code.

#### Automated Audit (Recommended)

1. **Set up scheduled audits**:
```javascript
// In agent initialization or cron job
async runScheduledAudit() {
    const report = await this.auditor.runOptimizationAudit('./');

    // Log summary
    console.log(`Audit complete: ${report.detailed_results.summary.criticalIssues} critical issues`);

    // Alert on critical issues
    if (report.detailed_results.summary.criticalIssues > 0) {
        await this.alertCriticalIssues(report);
    }

    return report;
}
```

2. **Configure audit frequency**:
   - **Development**: Run after each major change
   - **Staging**: Daily automated audits
   - **Production**: Weekly audits during maintenance windows

#### Manual Audit Execution

1. **Run targeted audit**:
```bash
# From agent directory
cd deep-agents/deep_agents/agents/pages/XXXX_my_agent/
node -e "
import { runOptimizationAudit } from '../../../shared/workflow-optimization/index.js';
const report = await runOptimizationAudit('./');
console.log('Audit Results:', JSON.stringify(report.detailed_results.summary, null, 2));
"
```

2. **Review audit reports**:
   - Check `tests/reports/` directory for timestamped reports
   - Review critical issues and optimization opportunities
   - Prioritize fixes based on impact and effort

---

### Step 4: AI-Powered Optimization

**Objective**: Leverage machine learning for intelligent workflow optimization.

#### Workflow Analysis

1. **Configure workflow for analysis**:
```javascript
const workflowConfig = {
    type: 'my_workflow_type',
    steps: ['input', 'validation', 'processing', 'output'],
    dataProcessing: 'heavy', // or 'light'
    integrations: ['database', 'api', 'cache'],
    performance: {
        targetResponseTime: 5000, // ms
        maxConcurrentUsers: 100
    }
};
```

2. **Run AI optimization**:
```javascript
const optimizationResult = await this.aiOptimizer.analyzeAndOptimize(workflowConfig);

// Review recommendations
console.log('AI Recommendations:');
optimizationResult.recommendations.forEach(rec => {
    console.log(`- ${rec.title}: ${rec.description}`);
    console.log(`  Impact: ${rec.impact}, Effort: ${rec.effort}`);
});
```

3. **Apply high-confidence recommendations**:
```javascript
// Filter for high-confidence, high-impact recommendations
const highPriorityRecs = optimizationResult.recommendations
    .filter(rec => rec.confidence > 0.8 && rec.priority === 'HIGH');

await this.applyRecommendations(highPriorityRecs);
```

#### Performance Prediction

1. **Generate performance forecasts**:
```javascript
const { PredictiveAnalyticsEngine } = await import('../../../shared/workflow-optimization/index.js');
const predictor = new PredictiveAnalyticsEngine();

await predictor.trainModels();
const forecast = await predictor.generatePredictions();

// Check for performance issues
if (forecast.predictions.responseTime.predicted > 10000) {
    console.warn('Predicted high response time - optimization needed');
}
```

---

### Step 5: Resilience Pattern Implementation

**Objective**: Implement circuit breakers and retry logic for system resilience.

#### Circuit Breaker Setup

1. **Configure circuit breaker**:
```javascript
this.circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,        // Open after 5 failures
    recoveryTimeout: 60000,     // Try to close after 60 seconds
    monitoringPeriod: 10000     // Check every 10 seconds
});
```

2. **Wrap critical operations**:
```javascript
async criticalDatabaseOperation() {
    return await this.circuitBreaker.execute(async () => {
        // Your database operation here
        const result = await this.database.query('SELECT * FROM critical_data');

        if (!result || result.length === 0) {
            throw new Error('Database query returned no results');
        }

        return result;
    });
}
```

3. **Handle circuit breaker states**:
```javascript
try {
    const result = await this.criticalDatabaseOperation();
    // Success - continue normally
} catch (error) {
    if (error.message.includes('Circuit breaker is OPEN')) {
        // Implement fallback logic
        console.warn('Circuit breaker open - using cached data');
        return this.getCachedData();
    }
    throw error;
}
```

#### Retry Logic Implementation

1. **Configure retry manager**:
```javascript
const { RetryManager } = await import('../../../shared/workflow-optimization/index.js');

this.retryManager = new RetryManager({
    maxAttempts: 3,
    baseDelay: 1000,     // Start with 1 second
    maxDelay: 10000,     // Max 10 seconds
    backoffFactor: 2     // Exponential backoff
});
```

2. **Apply retry logic**:
```javascript
const result = await this.retryManager.execute(async () => {
    // Operation that might fail
    return await this.unreliableExternalAPI();
});
```

---

### Step 6: Performance Monitoring Setup

**Objective**: Implement real-time performance monitoring and alerting.

#### Basic Performance Monitoring

1. **Initialize performance monitor**:
```javascript
const { PerformanceMonitor } = await import('../../../shared/workflow-optimization/index.js');

this.performanceMonitor = new PerformanceMonitor({
    metrics: ['responseTime', 'memoryUsage', 'cpuUsage'],
    alertThresholds: {
        responseTime: 5000,    // Alert if > 5 seconds
        memoryUsage: 85,       // Alert if > 85%
        errorRate: 5          // Alert if > 5%
    }
});
```

2. **Monitor method execution**:
```javascript
async processRequest(request) {
    const trackingId = this.performanceMonitor.startTracking('processRequest');

    try {
        // Your processing logic
        const result = await this.doProcessing(request);

        // Stop tracking and get metrics
        const metrics = this.performanceMonitor.stopTracking(trackingId);

        // Check for performance issues
        if (metrics.duration > 5000) {
            console.warn(`Slow request processing: ${metrics.duration}ms`);
        }

        return result;
    } catch (error) {
        this.performanceMonitor.recordError(trackingId, error);
        throw error;
    }
}
```

#### Advanced Monitoring

1. **Set up automated alerts**:
```javascript
this.performanceMonitor.on('alert', (alert) => {
    console.error(`Performance Alert: ${alert.metric} = ${alert.value} (${alert.threshold})`);

    // Send to monitoring system
    this.sendAlertToMonitoringSystem(alert);
});
```

2. **Generate performance reports**:
```javascript
async generatePerformanceReport() {
    const report = this.performanceMonitor.generateReport();

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `./performance_report_${timestamp}.json`;
    await fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
}
```

---

### Step 7: Compliance and Standards Validation

**Objective**: Ensure ongoing compliance with optimization standards.

#### Automated Compliance Checks

1. **Run compliance validation**:
```javascript
async validateCompliance() {
    const report = await this.auditor.runOptimizationAudit('./');

    const compliance = {
        standards: report.detailed_results.summary.complianceRate >= 80,
        security: report.detailed_results.summary.criticalIssues === 0,
        performance: report.qualityMetrics.qualityScore >= 70,
        timestamp: new Date().toISOString()
    };

    if (!compliance.standards || !compliance.security) {
        console.error('Compliance validation failed');
        await this.reportComplianceFailure(compliance);
    }

    return compliance;
}
```

2. **Schedule compliance checks**:
   - **Daily**: Automated compliance validation
   - **Weekly**: Comprehensive standards audit
   - **Monthly**: Performance trend analysis

#### Standards Adherence

1. **Follow naming conventions**:
```javascript
// ✅ Correct
const workflowProcessor = new WorkflowProcessor();
const validateUserInput = () => {};

// ❌ Incorrect
const workflow_processor = new workflow_processor();
const validate_user_input = () => {};
```

2. **Implement proper error handling**:
```javascript
// ✅ Correct
try {
    const result = await riskyOperation();
    return result;
} catch (error) {
    console.error('Operation failed:', error);
    throw new Error(`Operation failed: ${error.message}`);
}
```

---

### Step 8: Reporting and Analytics

**Objective**: Generate comprehensive reports and analytics.

#### Report Generation

1. **Generate optimization reports**:
```javascript
async generateOptimizationReport() {
    const auditReport = await this.auditor.runOptimizationAudit('./');
    const aiReport = await this.aiOptimizer.analyzeAndOptimize(this.workflowConfig);
    const performanceReport = this.performanceMonitor.generateReport();

    const comprehensiveReport = {
        timestamp: new Date().toISOString(),
        agent: this.constructor.name,
        audit: auditReport,
        aiOptimization: aiReport,
        performance: performanceReport,
        recommendations: this.generateActionableRecommendations(auditReport, aiReport)
    };

    // Save report
    const reportPath = `./optimization_report_${Date.now()}.json`;
    await fs.writeFileSync(reportPath, JSON.stringify(comprehensiveReport, null, 2));

    return comprehensiveReport;
}
```

2. **Generate actionable recommendations**:
```javascript
generateActionableRecommendations(auditReport, aiReport) {
    const recommendations = [];

    // Critical issues first
    if (auditReport.detailed_results.summary.criticalIssues > 0) {
        recommendations.push({
            priority: 'CRITICAL',
            type: 'security_fix',
            description: `Address ${auditReport.detailed_results.summary.criticalIssues} critical security issues`,
            timeframe: 'Immediate'
        });
    }

    // AI recommendations
    aiReport.recommendations.forEach(rec => {
        recommendations.push({
            priority: rec.priority,
            type: 'optimization',
            description: rec.description,
            impact: rec.impact,
            effort: rec.effort,
            timeframe: rec.timeframe
        });
    });

    return recommendations.sort((a, b) => {
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}
```

---

### Step 9: Continuous Improvement

**Objective**: Establish ongoing optimization and monitoring processes.

#### Process Automation

1. **Set up automated workflows**:
```javascript
// Daily optimization check
async dailyOptimizationCheck() {
    const report = await this.generateOptimizationReport();

    // Send to monitoring dashboard
    await this.sendToMonitoringDashboard(report);

    // Alert on critical issues
    const criticalIssues = report.recommendations.filter(r => r.priority === 'CRITICAL');
    if (criticalIssues.length > 0) {
        await this.alertTeam(criticalIssues);
    }
}
```

2. **Implement feedback loops**:
```javascript
// Learn from successful optimizations
async recordOptimizationSuccess(optimization, results) {
    // Store successful patterns
    await this.learningDatabase.store({
        optimization,
        results,
        timestamp: new Date().toISOString(),
        success: true
    });

    // Update AI models
    await this.aiOptimizer.updateModel(optimization, results);
}
```

#### Trend Analysis

1. **Monitor performance trends**:
```javascript
async analyzePerformanceTrends() {
    const historicalData = await this.loadHistoricalPerformanceData();
    const trends = this.calculateTrends(historicalData);

    // Identify improvement opportunities
    const opportunities = this.identifyTrendOpportunities(trends);

    return {
        trends,
        opportunities,
        recommendations: this.generateTrendRecommendations(opportunities)
    };
}
```

---

## Quality Assurance

### Verification Steps

- [ ] Module health check passes
- [ ] All imports work correctly
- [ ] Audit reports generate successfully
- [ ] AI optimization provides recommendations
- [ ] Circuit breaker protects against failures
- [ ] Performance monitoring captures metrics
- [ ] Reports save to correct locations

### Performance Benchmarks

- **Audit Execution**: < 30 seconds for typical agent
- **AI Optimization**: < 10 seconds for workflow analysis
- **Memory Overhead**: < 50MB additional per agent
- **Report Generation**: < 5 seconds

### Error Scenarios

- **Module Import Failure**: Check file paths and permissions
- **Audit Execution Failure**: Verify file system access
- **AI Optimization Failure**: Check workflow configuration
- **Performance Monitoring Failure**: Validate metric collection

---

## Maintenance Procedures

### Weekly Tasks

- [ ] Review optimization reports
- [ ] Update AI models with new data
- [ ] Verify circuit breaker configurations
- [ ] Check performance monitoring alerts

### Monthly Tasks

- [ ] Comprehensive compliance audit
- [ ] Performance trend analysis
- [ ] Update optimization recommendations
- [ ] Review and update configurations

### Quarterly Tasks

- [ ] Major version updates
- [ ] Architecture reviews
- [ ] Performance benchmark updates
- [ ] Training data refresh

---

## Troubleshooting

### Common Issues

#### "Cannot find module" errors
```
Error: Cannot find module '../../../shared/workflow-optimization/index.js'
```
**Solution**: Verify relative path from your agent location to shared module.

#### Audit reports not generating
**Symptoms**: No report files in output directory
**Solution**: Check file system permissions and output directory existence.

#### AI optimization returning empty results
**Symptoms**: No recommendations generated
**Solution**: Verify workflow configuration format and data completeness.

#### Circuit breaker not activating
**Symptoms**: Operations continue despite failures
**Solution**: Check failure threshold configuration and error handling.

---

## Related Documentation

### Standards Documents
- **Optimization Guide**: `docs/standards/0005_WORKFLOW_OPTIMIZATION_STANDARDS.md`
- **Agent Coding Standards**: `docs/standards/0000_AGENT_CODING_STANDARDS.md`
- **Workflow State Standards**: `docs/standards/0007_WORKFLOW_STATE_STANDARDS.md`

### Related Procedures
- **Agent Development**: `docs/procedures/agent-development/`
- **Debugging Guide**: `docs/procedures/monitoring-testing/0000_DEBUGGING_GUIDE.md`
- **Implementation Procedures**: `docs/procedures/implementation/`

### Module Documentation
- **Shared Module README**: `deep-agents/deep_agents/agents/shared/workflow-optimization/README.md`
- **API Reference**: Available in module index.js
- **Health Checks**: Run `node index.js` in module directory

---

## Document Information

- **Document ID**: `0001_SHARED_WORKFLOW_OPTIMIZATION_PROCEDURE`
- **Version**: 1.0.0
- **Created**: 2026-02-25
- **Author**: Construct AI Development Team
- **Review Cycle**: Quarterly
- **Next Review**: 2026-05-25
- **Approval**: Platform Architecture Team