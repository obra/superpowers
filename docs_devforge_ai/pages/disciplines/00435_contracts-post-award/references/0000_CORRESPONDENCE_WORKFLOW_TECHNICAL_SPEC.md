# Correspondence Agent Orchestration Workflow - Technical Specification

## 🔧 **Technical Implementation Details**

### **Architecture Overview: Hybrid Node.js + Python Deep Agents**

The ConstructAI system implements a **dual agent architecture** to optimize performance and capabilities:

#### **Node.js/JavaScript Agents (Primary Architecture)**
- **Purpose**: Production business workflows, UI integration, database operations, standard HITL tasks
- **Use Case**: 90% of agent development needs - correspondence analysis, form processing, UI integration
- **Technology**: JavaScript/Node.js runtime with Supabase integration
- **Examples**: 7 main correspondence agents, document analysis, information extraction

#### **Python Deep Agents (Specialized Architecture)**
- **Purpose**: Advanced AI/ML workloads, complex reasoning, experimental AI techniques
- **Use Case**: Complex decision-making, HITL coordinators, multi-step reasoning with uncertainty
- **Technology**: Python runtime with LangGraph framework and advanced ML libraries
- **Examples**: Contracts post-award HITL coordinator, complex risk assessment systems

#### **Hybrid Implementation Rationale**
```javascript
// Why contracts post-award uses BOTH architectures:
const contractsPostAwardArchitecture = {
  mainWorkflow: {
    technology: "Node.js",
    purpose: "Standard correspondence processing",
    agents: ["7 main agents"],
    rationale: "UI integration, database operations, streaming responses"
  },
  specialistAnalysis: {
    technology: "Python Deep Agents",
    purpose: "Complex decision-making and specialist expertise",
    agents: ["17 specialist agents + HITL coordinator"],
    rationale: "Advanced reasoning, risk assessment, human oversight coordination"
  },
  hitlCoordinator: {
    technology: "Python Deep Agent",
    purpose: "Complex decision routing and human oversight",
    rationale: [
      "Multi-disciplinary coordination (civil, electrical, mechanical, etc.)",
      "Advanced risk assessment algorithms",
      "Sophisticated escalation logic based on financial impact",
      "Complex state management for decision workflows"
    ]
  }
};
```

### **Database Keys and Prompt Retrieval**

The system uses specific database keys to retrieve specialized prompts from the prompts table. These keys are critical for agent operation and are organized as follows:

### **Correspondence Agent Keys (7 Main Agents - Node.js)**

The 7-agent orchestration system uses these database keys for prompt retrieval:

1. **Document Analysis Agent** (`correspondence-01`): `contract_correspondence_analysis` ✅ **[FULLY IMPLEMENTED]**
   - **File**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/contract_correspondence_analysis.md`
   - **Code**: `client/src/pages/00435-contracts-post-award/components/agents/correspondence-01-document-analysis-agent.js`
   - **Status**: Production ready with database integration and **LangExtract service integration**

2. **Information Extraction Agent** (`correspondence-02`): `contract_identifier_extraction` ✅ **[FULLY IMPLEMENTED]**
   - **File**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/contract_identifier_extraction.md`
   - **Code**: `client/src/pages/00435-contracts-post-award/components/agents/correspondence-02-information-extraction-agent.js`
   - **Status**: Production ready with enhanced pattern matching and **LangExtract-powered document processing** (no fake data)

3. **Document Retrieval Agent** (`correspondence-03`): `contract_document_retrieval` ✅ **[FULLY IMPLEMENTED]**
   - **File**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/contract_document_retrieval.md`
   - **Code**: `client/src/pages/00435-contracts-post-award/components/agents/correspondence-03-document-retrieval-agent.js`
   - **Status**: Production ready with database search capabilities and **cross-agent communication**

4. **Domain Specialist Agent** (`correspondence-04`): `contract_domain_specialist` ✅ **[FULLY IMPLEMENTED]**
   - **File**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/contract_domain_specialist.md`
   - **Code**: `client/src/pages/00435-contracts-post-award/components/agents/correspondence-04-domain-specialist-agent.js`
   - **Status**: Production ready with **17 specialist parallel processing** and **ParallelSpecialistCoordinator integration**

5. **Contract Management Agent** (`correspondence-05`): `contract_management_agent` ✅ **[FULLY IMPLEMENTED]**
   - **File**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/contract_management_agent.md`
   - **Code**: `client/src/pages/00435-contracts-post-award/components/agents/correspondence-05-contract-management-agent.js`
   - **Status**: Production ready with compliance assessment and **HITL task creation**

6. **Human Review Agent** (`correspondence-06`): `contract_human_review` ✅ **[FULLY IMPLEMENTED]**
   - **File**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/contract_human_review.md`
   - **Code**: `client/src/pages/00435-contracts-post-award/components/agents/correspondence-06-human-review-agent.js`
   - **Status**: Production ready with **real HITL integration** - creates actual HITL tasks via API and **human-in-the-loop decision routing**

7. **Professional Formatting Agent** (`correspondence-07`): `contract_professional_formatting` ✅ **[FULLY IMPLEMENTED]**
   - **File**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/contract_professional_formatting.md`
   - **Code**: `client/src/pages/00435-contracts-post-award/components/agents/correspondence-07-professional-formatting-agent.js`
   - **Status**: Production ready with formal correspondence generation and **final response synthesis**

### **Discipline Specialist Keys (17 Parallel Specialists)** ✅ **[FULLY INTEGRATED]**

The Domain Specialist Agent (Step 4) orchestrates **17 discipline specialists** in parallel using these database keys:

**Directory**: `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/`

**Core Engineering Disciplines (1-7):**
1. `civil` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/civil.md`
2. `structural` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/structural.md`
3. `mechanical` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/mechanical.md`
4. `electrical` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/electrical.md`
5. `process` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/process.md`
6. `instrumentation` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/instrumentation.md`
7. `geotechnical` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/geotechnical.md`

**Additional Specialties (8-17):**
8. `environmental` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/environmental.md`
9. `safety` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/safety.md`
10. `architectural` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/architectural.md`
11. `logistics` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/logistics.md`
12. `construction` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/construction.md`
13. `quality_control` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/quality_control.md`
14. `quantity_surveying` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/quantity_surveying.md`
15. `scheduling` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/scheduling.md`
16. `inspection` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/inspection.md`
17. `health` ✅ **[INTEGRATED]** - `docs/dev-prompts/00435-contracts-post-award/correspondence-workflow/specialists/health.md`

**Integration Status**: All 17 specialist prompt files exist and are properly structured for database migration.

### **Key Retrieval Mechanism**

- **PromptsService Integration**: All agents use `PromptsService.getPromptByKey(key)` for retrieval
- **Category Filtering**: All prompts filtered by `category = 'contracts'`
- **Active Status**: Only prompts with `is_active = true` are retrieved
- **Fallback Handling**: System includes fallback prompts for missing database entries

---

## 🤖 **Agent Architecture & Data Flow**

### **Component Architecture**

```
client/src/pages/00435-contracts-post-award/
├── components/
│   ├── agents/
│   │   ├── correspondence-01-document-analysis-agent.js
│   │   ├── correspondence-02-information-extraction-agent.js
│   │   ├── correspondence-03-document-retrieval-agent.js
│   │   ├── correspondence-04-domain-specialist-agent.js
│   │   ├── correspondence-05-contract-management-agent.js
│   │   ├── correspondence-06-human-review-agent.js
│   │   └── correspondence-07-professional-formatting-agent.js
│   └── ParallelSpecialistCoordinator.jsx
├── services/
│   └── CorrespondenceAgentService.js
└── 00435-contracts-post-award-page.js
```

### **HITL Integration Architecture**

**HITL Task Creation API** (`/api/tasks/hitl`) - Full REST API for HITL task lifecycle management

**HITL Assignment Service** - Intelligent specialist assignment with workload balancing

**HITL Resolution API** (`/api/tasks/hitl/:id/resolve`) - Comprehensive decision resolution with audit trails

**HITL Performance Service** - Real-time metrics and analytics using tasks table data

**MyTasksDashboard HITL Tab** - Dedicated UI with task filtering and action buttons

---

## 📊 **Performance Metrics & Monitoring**

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

---

## 🔒 **Security & Data Isolation**

### **Vector Data Isolation**

**System Architecture**: Uses secure vector data isolation for agent operations

**Implementation**: All agent operations use isolated vector contexts to prevent data leakage between correspondence analysis tasks

**Security Controls**: Enterprise-grade data isolation with audit trails for all vector operations

---

## 🧪 **Testing Framework**

### **Automated Testing Coverage**

**Agent Testing:**
- Unit tests for all 7 main agents
- Integration tests for parallel specialist processing
- HITL workflow validation tests

**Performance Testing:**
- Load testing for parallel specialist orchestration
- Response time validation for each agent step
- Memory usage monitoring during processing

---

## 📋 **API Integration Points**

### **Core APIs**

```
/api/correspondence/analyze          # Main analysis endpoint
/api/correspondence/specialists      # Parallel specialist orchestration
/api/tasks/hitl                      # HITL task management
/api/tasks/hitl/:id/resolve          # HITL resolution
/api/correspondence/metrics          # Performance monitoring
```

---

## 🔧 **Configuration Schema**

### **Agent Configuration**

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

---

## 📊 **Scalability Architecture**

### **Parallel Processing**

**17 Discipline Specialists**: Run in parallel for maximum efficiency

**HITL Workload Balancing**: Intelligent task distribution based on specialist availability and expertise

**Performance Monitoring**: Real-time metrics collection and alerting

---

## 🎯 **Technical Success Criteria**

### **Performance Targets**

- **Total Processing Time**: <15 minutes for complete correspondence analysis
- **HITL Escalation Rate**: <20% requiring human intervention
- **Accuracy Rate**: >95% correct analysis and response generation
- **System Reliability**: 99.9% uptime with automatic failover

### **Quality Assurance**

- **Response Compliance**: 100% regulatory requirement adherence
- **Professional Standards**: All responses meet formal correspondence standards
- **Contractual Accuracy**: <2% error rate in contract interpretation
- **Audit Trail Completeness**: 100% of decisions logged and traceable