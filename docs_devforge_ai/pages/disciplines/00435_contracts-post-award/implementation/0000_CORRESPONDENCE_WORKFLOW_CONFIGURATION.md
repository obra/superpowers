# Correspondence Agent Orchestration Workflow - Configuration Guide

## ⚙️ **HITL Configuration**

### **HITL Infrastructure Complete**

- ✅ **HITL Task Creation API** (`/api/tasks/hitl`) - Full REST API for HITL task lifecycle management
- ✅ **HITL Assignment Service** - Intelligent specialist assignment with workload balancing
- ✅ **HITL Resolution API** (`/api/tasks/hitl/:id/resolve`) - Comprehensive decision resolution with audit trails
- ✅ **HITL Performance Service** - Real-time metrics and analytics using tasks table data
- ✅ **MyTasksDashboard HITL Tab** - Dedicated UI with task filtering and action buttons
- ✅ **Comprehensive Audit Trail System** - Multi-entry audit logging with decision quality metrics
- ✅ **ContractualCorrespondenceReplyAgent Integration** - Agent-initiated HITL workflow with intelligent assessment

## 🔧 **Agent Configuration**

### **7-Agent Orchestration Settings**

```javascript
const agentConfig = {
  orchestration: {
    sequentialSteps: 7,
    parallelSpecialists: 17,
    hitlThreshold: 0.8
  },
  specialists: {
    processingOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    workloadBalancing: true,
    expertiseMatching: true
  },
  hitl: {
    automaticAssignment: true,
    auditTrail: true,
    performanceMetrics: true
  }
};
```

### **Discipline Specialist Configuration**

All 17 discipline specialists are configured with database-backed prompts:

**Core Engineering Disciplines (1-7):**
1. Civil Engineering Specialist
2. Structural Engineering Specialist  
3. Mechanical Engineering Specialist
4. Electrical Engineering Specialist
5. Process Engineering Specialist
6. Instrumentation Engineering Specialist
7. Geotechnical Engineering Specialist

**Additional Specialties (8-17):**
8. Environmental Engineering Specialist
9. Safety Engineering Specialist
10. Architectural Specialist
11. Logistics Specialist
12. Construction Specialist
13. Quality Control Specialist
14. Quantity Surveying Specialist
15. Scheduling Specialist
16. Inspection Specialist
17. Health & Safety Specialist

## 📊 **Performance Configuration**

### **System Performance Metrics**

```javascript
const correspondenceMetrics = {
  stepCompletionTime: {
    documentAnalysis: "< 30 seconds",
    informationExtraction: "< 45 seconds", 
    documentRetrieval: "< 60 seconds",
    specialistAnalysis: "< 5 minutes", // 17 parallel specialists
    contractManagement: "< 30 seconds",
    humanReview: "< 10 minutes", // HITL when triggered
    professionalFormatting: "< 60 seconds"
  },
  hitlEscalationRate: "< 20%",
  accuracyRate: "> 95%",
  specialistCoverage: "17 disciplines"
};
```

## 🔒 **Security Configuration**

### **Vector Data Isolation**

**System Architecture**: Uses secure vector data isolation for agent operations

**Implementation**: All agent operations use isolated vector contexts to prevent data leakage between correspondence analysis tasks

**Security Controls**: Enterprise-grade data isolation with audit trails for all vector operations
