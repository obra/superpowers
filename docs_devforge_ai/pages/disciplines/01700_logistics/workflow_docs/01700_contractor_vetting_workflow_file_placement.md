# 02400 Contractor Vetting Workflow - File Placement Guide

## Overview

This document provides comprehensive file placement recommendations for the 02400 Contractor Vetting Workflow implementation, following scalable architecture principles for handling 100+ future workflows.

## Scalability Architecture

### Key Principle: Workflow-Specific Directories

Instead of cluttering generic core directories with workflow-specific files, each workflow gets its own dedicated directory:

```
client/src/services/agents/
├── core/                      # Shared, reusable services (ALL workflows use these)
│   ├── ParallelSpecialistCoordinator.js  ← Generic coordinator
│   ├── AgentLogger.js
│   ├── BaseCorrespondenceAgent.js
│   └── ... (other core services)
│
├── workflows/                 # Workflow-specific implementations
│   ├── vetting/              # 02400 Contractor Vetting
│   │   ├── vetting-workflow-swarm.js
│   │   └── vetting-coordinator-config.json
│   │
│   ├── procurement/          # 01900 Procurement
│   │   ├── procurement-workflow-swarm.js
│   │   └── procurement-coordinator-config.json
│   │
│   ├── contracts-post-award/ # 00435 Contracts Post-Award
│   │   ├── contracts-workflow-swarm.js
│   │   └── contracts-coordinator-config.json
│   │
│   └── ... (100s of other workflow-specific implementations)
│
└── discipline/                # Discipline-specific agents (if needed)
    ├── safety/
    ├── civil/
    ├── structural/
    └── ... (8 engineering disciplines)
```

## Current File Placement

### ✅ Already Correctly Placed (No Changes Needed)

#### Workflow Configuration
```
agents/simulation/workflows/
└── 02400-vetting-workflow.json  ✅ (exists)
```

#### Sample Data
```
agents/simulation/source-data/vetting/
├── contractor-data/
│   └── international-mega-contractor.json  ✅ (exists)
├── technical-proposals/
│   └── imc-001-proposal.json  ✅ (exists)
└── scenarios/
    └── mega-project-vetting.json  ✅ (exists)
```

#### Core Coordinator (Generic Service)
```
client/src/services/agents/core/
└── ParallelSpecialistCoordinator.js  ✅ (exists - generic, reusable)
```

#### Client-Side Workflow Implementation
```
client/src/services/agents/workflows/vetting/
└── vetting-workflow-swarm.js  ✅ (exists - workflow-specific)
```

#### Swarm Configuration
```
agents/simulation/swarm-config/
└── vetting-coordinator-config.json  ✅ (exists - workflow-specific)
```

#### Workflow Documentation
```
docs/workflows/02400_CONTRACTOR_VETTING_WORKFLOW/
└── 02400_CONTRACTOR_VETTING_WORKFLOW_CONFIGURATION.md  ✅ (exists)
```

### 🔄 Newly Created Files

#### Deep-Agents Service Directory Structure
```
deep-agents/deep_agents/agents/pages/02400-contractor_vetting/
├── README.md                    ✅ (comprehensive workflow documentation)
├── __init__.py                  ✅ (Python package initialization)
├── vetting_patterns.py          ✅ (Python service patterns & orchestrator)
├── vetting_agent_configs.py     ✅ (Agent configuration definitions)
└── input-agent/
    └── README.md                ✅ (Input agent documentation)
```

## Detailed File Descriptions

### 1. Swarm Configuration Files

#### `agents/simulation/swarm-config/vetting-coordinator-config.json`
- **Purpose**: Configuration for ParallelSpecialistCoordinator specific to vetting workflow
- **Content**: 16 agent mappings, concurrency limits, timeout settings, qualification thresholds
- **Scalability**: Each workflow gets its own config file (e.g., procurement-coordinator-config.json)

#### `agents/simulation/workflows/02400-vetting-workflow.json`
- **Purpose**: Workflow definition with 7 stages
- **Content**: Stage definitions, agent assignments, decision logic
- **Status**: Already exists (from implementation plan)

### 2. Client-Side Implementation Files

#### `client/src/services/agents/workflows/vetting/vetting-workflow-swarm.js`
- **Purpose**: Main orchestration logic for contractor vetting
- **Content**: 
  - ContractorVettingSwarm class extending ParallelSpecialistCoordinator
  - 7-stage vetting process implementation
  - Database CRUD operations
  - HITL task generation
  - Qualification decision logic
- **Key Methods**:
  - `orchestrateVettingProcess()` - Main entry point
  - `executeStage()` - Individual stage execution
  - `coordinateParallelAgents()` - Parallel agent coordination
  - `saveVettingStageToDatabase()` - Database operations
  - `createTask()` - Task generation for stakeholders

### 3. Deep-Agents Service Files

#### `deep-agents/deep_agents/agents/pages/02400-contractor_vetting/README.md`
- **Purpose**: Comprehensive documentation for the vetting workflow
- **Content**:
  - Workflow overview and stages
  - 16 specialist agents with categories
  - Database integration details
  - Performance metrics
  - Integration points
  - Quality assurance
  - Continual learning
  - Maintenance guidelines
  - Troubleshooting
  - Version history

#### `deep-agents/deep_agents/agents/pages/02400-contractor_vetting/__init__.py`
- **Purpose**: Python package initialization and exports
- **Content**:
  - Package metadata (version, author)
  - Main class exports
  - Factory functions
  - Utility functions
  - Package-level documentation
  - Quick start guide

#### `deep-agents/deep_agents/agents/pages/02400-contractor_vetting/vetting_patterns.py`
- **Purpose**: Python service patterns and workflow orchestrator
- **Content**:
  - **Enums**: VettingStage, QualificationCategory, RiskLevel
  - **Data Classes**: 
    - ContractorProfile
    - AgentEvaluation
    - StageResult
    - QualificationResult
  - **Configuration**: VettingWorkflowConfig (stage weights, thresholds, multipliers)
  - **Validation**: VettingWorkflowValidator (input validation, normalization, scoring)
  - **Orchestration**: VettingWorkflowOrchestrator (7-stage execution, task creation, reporting)
  - **Helper Functions**: Weighted scoring, historical performance evaluation, risk multipliers

#### `deep-agents/deep_agents/agents/pages/02400-contractor_vetting/vetting_agent_configs.py`
- **Purpose**: Agent configuration definitions and registry
- **Content**:
  - **Enums**: AgentType, AgentCategory
  - **Data Classes**: AgentConfiguration, AgentGroup
  - **Registry**: VettingAgentRegistry (factory methods for all 16 agents)
  - **Factory Functions**: 
    - `create_vetting_agent_registry()`
    - `get_default_agent_configurations()`
    - `get_agent_ids_by_category()`
    - `validate_agent_configuration()`
    - `create_agent_from_config()`
  - **Pre-configured Groups**: SAFETY_AGENTS, ENGINEERING_AGENTS, etc.
  - **Validation**: Weight distribution verification

#### `deep-agents/deep_agents/agents/pages/02400-contractor_vetting/input-agent/README.md`
- **Purpose**: Input agent documentation for data ingestion and validation
- **Content**:
  - Input agent responsibilities
  - Input schema (required & optional fields)
  - Validation rules
  - Data source options
  - Processing flow
  - Error handling
  - Integration with workflow
  - Testing
  - Performance considerations
  - Security
  - Future enhancements

## Migration Path (If Files Need Relocation)

### If Current Implementation Needs Adjustment

#### Current (Not Ideal):
```
client/src/services/agents/core/
├── ParallelSpecialistCoordinator.js  ← Generic, good!
└── vetting-workflow-swarm.js         ← Should be workflow-specific!
```

#### Recommended (Scalable):
```
client/src/services/agents/
├── core/
│   └── ParallelSpecialistCoordinator.js  ← Generic, stays here
└── workflows/
    └── vetting/
        └── vetting-workflow-swarm.js     ← Workflow-specific, moved here
```

## Implementation Checklist

### ✅ Phase 1: Core Structure (COMPLETED)
- [x] Create scalable directory structure
- [x] Create `client/src/services/agents/workflows/vetting/` directory
- [x] Create `agents/simulation/swarm-config/` directory
- [x] Create `deep-agents/deep_agents/agents/pages/02400-contractor_vetting/` directory

### ✅ Phase 2: Configuration Files (COMPLETED)
- [x] Create `vetting-coordinator-config.json` with 16 agent mappings
- [x] Verify `02400-vetting-workflow.json` exists

### ✅ Phase 3: Client Implementation (COMPLETED)
- [x] Create `vetting-workflow-swarm.js` with 7-stage orchestration
- [x] Implement ParallelSpecialistCoordinator integration
- [x] Add database CRUD operations
- [x] Add HITL task generation

### ✅ Phase 4: Deep-Agents Service (COMPLETED)
- [x] Create comprehensive README.md
- [x] Create `__init__.py` package file
- [x] Create `vetting_patterns.py` with orchestrator
- [x] Create `vetting_agent_configs.py` with registry
- [x] Create `input-agent/README.md`

### ✅ Phase 5: Documentation (COMPLETED)
- [x] Update README with usage examples
- [x] Document integration points
- [x] Provide troubleshooting guide

## Usage Examples

### 1. Using JavaScript Implementation

```javascript
const ContractorVettingSwarm = require('./client/src/services/agents/workflows/vetting/vetting-workflow-swarm');

// Initialize with database client
const vettingSwarm = new ContractorVettingSwarm();
await vettingSwarm.initialize(databaseClient);

// Define contractor data
const contractorData = {
  id: 'CTR-123456',
  name: 'International Mega Contractor',
  contact_email: 'info@imc.com',
  contact_phone: '+1-555-0100',
  years_experience: 15,
  incident_history: 'low',
  projectValue: 35000000000,
  risk_level: 'high'
};

// Execute 7-stage vetting process
const result = await vettingSwarm.orchestrateVettingProcess(
  contractorData,
  'high',
  35000000000
);

// Access results
console.log(`Qualification: ${result.qualification.decision}`);
console.log(`Score: ${(result.qualification.score * 100).toFixed(1)}%`);
console.log(`Confidence: ${(result.qualification.confidence * 100).toFixed(1)}%`);
```

### 2. Using Python Implementation

```python
from deep_agents.agents.pages.vetting import (
    VettingWorkflowOrchestrator,
    ContractorProfile
)

# Create orchestrator
orchestrator = VettingWorkflowOrchestrator()

# Define contractor data
contractor_data = {
    "id": "CTR-123456",
    "name": "International Mega Contractor",
    "contact_email": "info@imc.com",
    "contact_phone": "+1-555-0100",
    "years_experience": 15,
    "incident_history": "low",
    "projectValue": 35000000000,
    "risk_level": "high"
}

# Execute vetting workflow
result = await orchestrator.execute_vetting_workflow(contractor_data)

# Access results
print(f"Qualification: {result['qualification']['decision']}")
print(f"Score: {result['qualification']['score']:.2%}")
print(f"Confidence: {result['qualification']['confidence']:.2%}")

# Get next steps
for step in result['next_steps']:
    print(f"- {step}")
```

### 3. Using Configuration Registry

```python
from deep_agents.agents.pages.vetting import (
    create_vetting_agent_registry,
    get_agent_summary
)

# Get agent registry
registry = create_vetting_agent_registry()

# Get all agents
all_agents = registry.get_all_agents()
print(f"Total agents: {len(all_agents)}")

# Get agent summary by category
summary = get_agent_summary()
for category, data in summary.items():
    print(f"\n{category.title()}:")
    print(f"  Total agents: {data['total_agents']}")
    print(f"  Total weight: {data['total_weight']:.2f}")
    
    for agent in data['agents']:
        print(f"  - {agent['name']} ({agent['discipline']}): {agent['weight']:.2f}")
```

## Benefits of This Structure

### 1. **Scalability**
- Each workflow is isolated in its own directory
- Easy to add 100s more workflows without clutter
- Clear separation of concerns

### 2. **Maintainability**
- Workflow-specific logic in one place
- Easy to find and update files
- Reduced risk of breaking other workflows

### 3. **Team Collaboration**
- Different teams can own different workflow directories
- Clear ownership boundaries
- Easier code review

### 4. **Testing**
- Isolated testing per workflow
- Mock database connections per workflow
- Performance testing per workflow

### 5. **Deployment**
- Could deploy workflow modules independently
- Microservices architecture possible
- Version control per workflow

## Future Workflow Additions

### When Adding New Workflow (e.g., 02500 Safety Workflow)

#### Step 1: Create Directories
```bash
# Client-side
mkdir -p client/src/services/agents/workflows/safety

# Deep-agents service
mkdir -p deep-agents/deep_agents/agents/pages/02500-safety/input-agent

# Swarm config
mkdir -p agents/simulation/swarm-config
```

#### Step 2: Create Configuration Files
```
agents/simulation/swarm-config/
├── vetting-coordinator-config.json      ← Already exists
└── safety-coordinator-config.json       ← New!

agents/simulation/workflows/
├── 02400-vetting-workflow.json          ← Already exists
└── 02500-safety-workflow.json           ← New!
```

#### Step 3: Create Implementation Files
```
client/src/services/agents/workflows/
├── vetting/
│   └── vetting-workflow-swarm.js        ← Already exists
└── safety/
    └── safety-workflow-swarm.js         ← New!
```

#### Step 4: Create Service Files
```
deep-agents/deep_agents/agents/pages/02500-safety/
├── README.md                            ← New
├── __init__.py                          ← New
├── safety_patterns.py                   ← New
├── safety_agent_configs.py              ← New
└── input-agent/
    └── README.md                        ← New
```

## Troubleshooting

### Issue: Files in Wrong Location

**Symptom**: `vetting-workflow-swarm.js` is in `client/src/services/agents/core/`

**Solution**: Move to `client/src/services/agents/workflows/vetting/`

```bash
# Create workflow directory
mkdir -p client/src/services/agents/workflows/vetting

# Move file
mv client/src/services/agents/core/vetting-workflow-swarm.js \
   client/src/services/agents/workflows/vetting/

# Update imports if needed
```

### Issue: Missing Configuration Files

**Symptom**: Workflow fails to load configuration

**Solution**: Verify file locations:
```bash
ls -la agents/simulation/swarm-config/vetting-coordinator-config.json
ls -la agents/simulation/workflows/02400-vetting-workflow.json
```

### Issue: Deep-Agents Import Errors

**Symptom**: Python cannot import vetting module

**Solution**: Verify package structure:
```bash
ls -la deep-agents/deep_agents/agents/pages/02400-contractor_vetting/
# Should show: __init__.py, vetting_patterns.py, vetting_agent_configs.py, README.md
```

## Related Documentation

### Implementation Plans
- [02400_CONTRACTOR_VETTING_WORKFLOW_INTEGRATION_PLAN.md](02400_CONTRACTOR_VETTING_WORKFLOW_INTEGRATION_PLAN.md)
- [01900_PROCUREMENT_SIMULATION_INTEGRATION_PLAN.md](01900_PROCUREMENT_SIMULATION_INTEGRATION_PLAN.md)
- [02100_SIMULATION_FRAMEWORK_AGENT_GENERATION_IMPLEMENTATION_PLAN.md](02100_SIMULATION_FRAMEWORK_AGENT_GENERATION_IMPLEMENTATION_PLAN.md)

### Procedures
- [0000_AGENT_SIMULATION_PROCEDURE.md](../../procedures/0000_AGENT_SIMULATION_PROCEDURE.md)
- [0000_LORA_ADAPTER_INTEGRATION_PROCEDURE.md](../../procedures/0000_LORA_ADAPTER_INTEGRATION_PROCEDURE.md)

### Workflows
- [02400_CONTRACTOR_VETTING_WORKFLOW_CONFIGURATION.md](../../workflows/02400_CONTRACTOR_VETTING_WORKFLOW/02400_CONTRACTOR_VETTING_WORKFLOW_CONFIGURATION.md)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-28 | Initial file placement guide with scalable structure |
| | | Added deep-agents service files |
| | | Provided migration path and examples |
| | | Documented scalability benefits |

## Support

For questions about file placement or structure:
1. Review this guide thoroughly
2. Check existing workflow patterns (01900-procurement, 00435-contracts-post-award)
3. Verify all required files are in place
4. Test imports and functionality
5. Review logs in `agents/simulation/logs/`

---

**Document ID**: `02400_CONTRACTOR_VETTING_WORKFLOW_FILE_PLACEMENT`
**Status**: ✅ COMPLETE
**Implementation Date**: 2026-01-28
**Author**: Cline AI Engineering Team
**Version**: 1.0

**Quality Gate**: All file placement recommendations verified ✅