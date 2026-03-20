# Shared Agent Architecture Design

## Overview

This document outlines a reusable, discipline-agnostic architecture for Construct AI agents that separates shared concerns from discipline-specific logic, enabling 80-90% code reuse across all disciplines.

## 🏗️ Architectural Layers

### Layer 1: Core Shared Services (All Disciplines)

#### 1. Base Agent Orchestrator (80-120 lines)
```javascript
// 📁 client/src/services/agents/

class BaseCorrespondenceAgent {
  constructor(config) {
    this.discipline = config.discipline;
    this.workflowManager = new WorkflowManager();
    this.stateManager = new AgentStateManager();
    this.llmService = new LLMService();
    this.hitlManager = new HITLWorkflowManager();
  }

  // Common workflow steps all agents share
  async processCorrespondence(correspondence, options) {
    // Standard 7-step workflow
  }
}
```

#### 2. LLM Service with Circuit Breaker (100-150 lines)
```javascript
class LLMService {
  async callLLM(prompt, config) {
    // Circuit breaker logic, timeout handling, fallbacks
  }
}
```

#### 3. HITL Workflow Manager (120-150 lines)
```javascript
class HITLWorkflowManager {
  async performHITLWorkflow(reviewData) {
    // Human-in-the-loop logic
  }
}
```

#### 4. Document Processing Service (150-200 lines)
```javascript
class DocumentProcessingService {
  async retrieveDocuments(query, filters) {
    // Vector store, API calls, formatting
  }
}
```

#### 5. Metadata Extraction Service (80-100 lines)
```javascript
class MetadataExtractor {
  extractCorrespondenceMetadata(text) {}
  extractKeyIssues(text) {}
  extractDocumentReferences(text) {}
}
```

#### 6. Risk Assessment Service (50-70 lines)
```javascript
class RiskAssessmentService {
  assessCorrespondenceRisk(question) {}
  calculateConfidenceScore(state) {}
}
```

### Layer 2: Discipline-Specific Services

#### 7. Procurement Correspondence Analyzer (80-100 lines)
```javascript
// 📁 client/src/services/agents/disciplines/

class ProcurementCorrespondenceAnalyzer {
  async analyzeCorrespondence(question) {
    // Procurement-specific analysis logic
  }
}
```

#### 8. Procurement Specialist Agents Manager (100-120 lines)
```javascript
class ProcurementSpecialistAgentsManager {
  getSpecialistTypes() {
    return ['variation_engineer', 'procurement_engineer_corresp', 'procurement_engineer_clauses'];
  }

  async runSpecialistAgents(state) {
    // Procurement-specific agent orchestration
  }
}
```

#### 9. Procurement Response Generator (60-80 lines)
```javascript
class ProcurementResponseGenerator {
  generateProfessionalCorrespondenceLetter(state) {
    // Procurement-specific letter formatting
  }
}
```

### Layer 3: Agent Factory & Configuration

#### 10. Agent Factory (40-60 lines)
```javascript
// 📁 client/src/services/agents/

class AgentFactory {
  static createAgent(disciplineCode) {
    const config = AGENT_CONFIGS[disciplineCode];

    return new BaseCorrespondenceAgent({
      discipline: disciplineCode,
      analyzer: this.getAnalyzer(disciplineCode),
      specialistsManager: this.getSpecialistsManager(disciplineCode),
      responseGenerator: this.getResponseGenerator(disciplineCode),
      ...config
    });
  }

  static getAnalyzer(disciplineCode) {
    const analyzers = {
      'PROC': ProcurementCorrespondenceAnalyzer,
      'GOV': GovernanceCorrespondenceAnalyzer,
      'FIN': FinanceCorrespondenceAnalyzer,
      // etc.
    };
    return new analyzers[disciplineCode]();
  }
}
```

#### 11. Agent Configurations (60-80 lines)
```javascript
const AGENT_CONFIGS = {
  'PROC': {
    pageId: '01900',
    workflowSteps: 7,
    specialistTypes: ['variation', 'correspondence', 'clauses'],
    riskThresholds: { high: 80, medium: 60 }
  },
  'GOV': {
    pageId: '01300',
    workflowSteps: 6,
    specialistTypes: ['compliance', 'policy', 'audit'],
    riskThresholds: { high: 90, medium: 70 }
  },
  // etc.
};
```

## 📂 Directory Structure

```
client/src/services/agents/
├── core/
│   ├── BaseCorrespondenceAgent.js          # Main orchestrator
│   ├── WorkflowManager.js                  # Step coordination
│   ├── AgentStateManager.js                # State management
│   ├── LLMService.js                       # AI integration
│   ├── HITLWorkflowManager.js              # Human review
│   ├── DocumentProcessingService.js        # Document retrieval
│   ├── MetadataExtractor.js                # Data extraction
│   └── RiskAssessmentService.js            # Risk evaluation
├── disciplines/
│   ├── procurement/
│   │   ├── ProcurementCorrespondenceAnalyzer.js
│   │   ├── ProcurementSpecialistAgentsManager.js
│   │   └── ProcurementResponseGenerator.js
│   ├── governance/
│   │   ├── GovernanceCorrespondenceAnalyzer.js
│   │   ├── GovernanceSpecialistAgentsManager.js
│   │   └── GovernanceResponseGenerator.js
│   └── [other disciplines]/
├── factory/
│   └── AgentFactory.js                     # Agent creation
├── config/
│   └── agentConfigs.js                     # Discipline configs
└── utils/
    ├── DocumentFormatter.js                # Document formatting
    ├── ResponseTemplates.js                # Letter templates
    └── ValidationUtils.js                  # Input validation
```

## 🔄 Shared vs Discipline-Specific Logic

### Shared Core (Reusable Across All Agents)

- ✅ LLM integration with circuit breaker
- ✅ HITL workflow management
- ✅ Document retrieval and processing
- ✅ Metadata extraction patterns
- ✅ Risk assessment algorithms
- ✅ State management
- ✅ Progress tracking
- ✅ Error handling and fallbacks

### Discipline-Specific (Unique per Domain)

- 🎯 Correspondence analysis logic
- 🎯 Specialist agent types and prompts
- 🎯 Response formatting and templates
- 🎯 Domain-specific risk factors
- 🎯 Industry compliance requirements
- 🎯 Stakeholder notification patterns

## 🚀 Implementation Benefits

### Code Reuse (80-90%)

- **Shared Services**: 8 core services used by all agents
- **Common Workflows**: 7-step process works for all disciplines
- **Standardized Interfaces**: Consistent API across agents
- **DRY Principle**: Eliminate duplication between disciplines

### Maintainability

- **Single Source of Truth**: Core logic updated once for all agents
- **Isolated Changes**: Discipline-specific changes don't affect others
- **Easier Testing**: Shared components tested once, reused everywhere
- **Faster Onboarding**: New disciplines follow established patterns

### Scalability

- **New Disciplines**: Add new agent in days, not weeks
- **Feature Updates**: Core improvements benefit all agents
- **Performance**: Shared services optimized once
- **Consistency**: All agents follow same architectural patterns

## 📋 Migration Strategy

### Phase 1: Extract Shared Core (Week 1)

```javascript
// 1. Create core services directory
// 2. Extract LLMService, HITLWorkflowManager, DocumentProcessingService
// 3. Create BaseCorrespondenceAgent skeleton
// 4. Test core services independently
```

### Phase 2: Procurement Agent Refactor (Week 2)

```javascript
// 1. Create procurement discipline directory
// 2. Extract ProcurementCorrespondenceAnalyzer
// 3. Extract ProcurementSpecialistAgentsManager
// 4. Extract ProcurementResponseGenerator
// 5. Wire into BaseCorrespondenceAgent
// 6. Test procurement agent still works
```

### Phase 3: Agent Factory & Config (Week 3)

```javascript
// 1. Implement AgentFactory
// 2. Create agent configuration system
// 3. Add support for multiple disciplines
// 4. Update existing agent instantiation
```

### Phase 4: Template for New Disciplines (Week 4)

```javascript
// 1. Create discipline template
// 2. Document patterns and interfaces
// 3. Add example governance agent
// 4. Update workflow documentation
```

## 🎯 Key Design Patterns

### Strategy Pattern for Discipline-Specific Logic

```javascript
class BaseCorrespondenceAgent {
  constructor(analyzer, specialistsManager, responseGenerator) {
    this.analyzer = analyzer;           // Injected discipline-specific analyzer
    this.specialistsManager = specialistsManager; // Injected specialists manager
    this.responseGenerator = responseGenerator;   // Injected response generator
  }
}
```

### Factory Pattern for Agent Creation

```javascript
const procurementAgent = AgentFactory.createAgent('PROC');
const governanceAgent = AgentFactory.createAgent('GOV');
// Both use same core but different discipline logic
```

### Composition over Inheritance

```javascript
// Instead of inheritance hierarchy, use composition
class ProcurementAgent extends BaseCorrespondenceAgent {
  // Override specific methods
}
// Better: inject dependencies
const agent = new BaseCorrespondenceAgent(procurementAnalyzer, procurementSpecialists, procurementGenerator);
```

## Implementation Status

- [ ] Phase 1: Extract Shared Core
- [ ] Phase 2: Procurement Agent Refactor
- [ ] Phase 3: Agent Factory & Config
- [ ] Phase 4: Template for New Disciplines

This architecture will make the system highly maintainable, scalable, and consistent across all disciplines while preserving the complex functionality each agent needs.
