# Workflow State Management Standards for Construct AI

**Document ID**: `0007_WORKFLOW_STATE_STANDARDS`  
**Version**: 1.0.0  
**Created**: 2026-02-24  
**Status**: ACTIVE

---

## Overview

This document establishes the standards for workflow state management across all Construct AI agents. It defines the base state model hierarchy, type safety requirements, and integration patterns with the governance system.

## Core Architecture

### State Model Hierarchy

All workflow states MUST inherit from `BaseWorkflowState` to ensure:
- Consistent governance integration
- Type safety across the system
- Proper audit trail management
- Standardized error handling

```
BaseWorkflowState (Abstract Base)
├── CorrespondenceWorkflowState    # Document/correspondence workflows
├── ProcurementWorkflowState       # Procurement workflows
├── ContractsWorkflowState         # Contract management workflows
└── [Future workflow states...]    # Extensible for new workflow types
```

### Design Principles

1. **Single Inheritance**: All workflow states inherit from `BaseWorkflowState`
2. **Type Safety**: Use Pydantic models for validation and serialization
3. **Governance Compatible**: All states work with `@with_governance` decorator
4. **Immutable Audit Trail**: State changes are logged, not overwritten
5. **Serialization Support**: All states support JSON serialization for persistence

---

## BaseWorkflowState Definition

### Required Fields

All workflow states MUST include these base fields:

```python
class BaseWorkflowState(BaseModel):
    """Abstract base state for all workflow types."""
    
    # Identification
    workflow_id: str
    correlation_id: Optional[str] = None
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    
    # Status
    status: AgentStatus = AgentStatus.INITIALIZED
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    # Agent tracking
    agent_states: Dict[str, AgentState] = Field(default_factory=dict)
    
    # Quality metrics
    overall_confidence: float = 0.5
    risk_level: RiskLevel = RiskLevel.MEDIUM
    
    # Audit and error handling
    audit_trail: List[Dict[str, Any]] = Field(default_factory=list)
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    
    class Config:
        use_enum_values = True
        arbitrary_types_allowed = True
```

### Abstract Methods

Subclasses MUST implement:

```python
@abstractmethod
def get_workflow_type(self) -> str:
    """Return the workflow type identifier."""
    pass

@abstractmethod
def get_current_stage(self) -> str:
    """Return the current stage/step of the workflow."""
    pass
```

---

## Specialized Workflow States

### CorrespondenceWorkflowState

For document analysis and correspondence workflows:

```python
class CorrespondenceWorkflowState(BaseWorkflowState):
    """State for correspondence/document workflows."""
    
    # Workflow-specific fields
    correspondence_text: str
    correspondence_metadata: CorrespondenceMetadata = Field(default_factory=CorrespondenceMetadata)
    current_step: WorkflowStep = WorkflowStep.DOCUMENT_ANALYSIS
    
    # Processing results
    extracted_identifiers: Dict[str, List[DocumentReference]] = Field(default_factory=dict)
    document_analysis: Dict[str, Any] = Field(default_factory=dict)
    specialist_analyses: Dict[str, SpecialistAnalysis] = Field(default_factory=dict)
    compliance_assessment: Optional[ComplianceAssessment] = None
    final_response: Optional[str] = None
    
    def get_workflow_type(self) -> str:
        return "correspondence"
    
    def get_current_stage(self) -> str:
        return self.current_step.value
```

### ProcurementWorkflowState

For procurement and ordering workflows:

```python
class ProcurementWorkflowState(BaseWorkflowState):
    """State for procurement workflows."""
    
    # Workflow-specific fields
    procurement_data: Dict[str, Any] = Field(default_factory=dict)
    document: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    
    # Stage tracking
    current_stage: Literal[
        "template_analysis",
        "requirements_extraction", 
        "compliance_validation",
        "field_population",
        "quality_assurance",
        "final_review"
    ] = "template_analysis"
    
    # HITL gates
    hitl_gates: Dict[str, HitlGateResult] = Field(default_factory=dict)
    hitl_blocked: bool = False
    
    # Processing results
    template_analysis: Optional[Dict[str, Any]] = None
    extracted_requirements: Optional[Dict[str, Any]] = None
    compliance_report: Optional[Dict[str, Any]] = None
    populated_fields: Optional[Dict[str, Any]] = None
    quality_assessment: Optional[Dict[str, Any]] = None
    final_review: Optional[Dict[str, Any]] = None
    
    def get_workflow_type(self) -> str:
        return "procurement"
    
    def get_current_stage(self) -> str:
        return self.current_stage
```

---

## Governance Integration

### Decorator Compatibility

All workflow states MUST be compatible with the `@with_governance` decorator:

```python
from deep_agents.agents.shared.governance import with_governance
from deep_agents.core.c_deep_agents_state_management import BaseWorkflowState

class MyAgent:
    @with_governance(jurisdiction='FI', strict_mode=True)
    async def _execute_impl(self, workflow_state: BaseWorkflowState, **kwargs):
        # Governance validation happens automatically
        # workflow_state can be any subclass of BaseWorkflowState
        return result
```

### Type Annotations

The governance decorator accepts `BaseWorkflowState` or any subclass:

```python
# governance_integration.py
async def wrapper(self, workflow_state: BaseWorkflowState, **kwargs):
    # Works with any workflow state subclass
    orchestrator.validate_workflow(workflow_state, ...)
```

---

## State Transitions

### Valid Transitions

State transitions MUST follow the defined workflow stages:

```python
# Procurement workflow stages
PROCUREMENT_STAGES = [
    "template_analysis",
    "requirements_extraction",
    "compliance_validation",
    "field_population",
    "quality_assurance",
    "final_review"
]

def validate_transition(current: str, next_stage: str) -> bool:
    """Validate that a stage transition is allowed."""
    current_idx = PROCUREMENT_STAGES.index(current)
    next_idx = PROCUREMENT_STAGES.index(next_stage)
    
    # Allow forward progression or staying in place
    return next_idx >= current_idx
```

### Transition Logging

All state transitions MUST be logged to the audit trail:

```python
def transition_to(self, new_stage: str, agent_id: str, metadata: Dict = None):
    """Transition to a new workflow stage with audit logging."""
    old_stage = self.current_stage
    
    if not validate_transition(old_stage, new_stage):
        raise InvalidTransitionError(f"Cannot transition from {old_stage} to {new_stage}")
    
    self.current_stage = new_stage
    self._add_audit_entry("stage_transition", {
        "from_stage": old_stage,
        "to_stage": new_stage,
        "agent_id": agent_id,
        "metadata": metadata or {}
    })
```

---

## Serialization Standards

### JSON Serialization

All workflow states MUST support JSON serialization:

```python
def to_json(self) -> str:
    """Serialize state to JSON string."""
    return self.model_dump_json()

@classmethod
def from_json(cls, json_str: str) -> "BaseWorkflowState":
    """Deserialize state from JSON string."""
    return cls.model_validate_json(json_str)
```

### Database Persistence

For database storage, use the `workflow_state` column pattern:

```sql
CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY,
    workflow_type VARCHAR(50) NOT NULL,
    workflow_state JSONB NOT NULL,  -- Serialized state
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Error Handling

### Error Recording

All errors MUST be recorded in the state:

```python
def record_error(
    self, 
    error: str, 
    agent_id: Optional[str] = None,
    stage: Optional[str] = None,
    recoverable: bool = False
):
    """Record an error in the workflow state."""
    error_entry = {
        "timestamp": datetime.now().isoformat(),
        "error": error,
        "agent_id": agent_id,
        "stage": stage or self.get_current_stage(),
        "recoverable": recoverable
    }
    self.errors.append(error_entry)
    self._add_audit_entry("error_recorded", error_entry)
```

### Error Recovery

States should track recovery attempts:

```python
class BaseWorkflowState(BaseModel):
    # ... other fields
    retry_count: int = 0
    last_error: Optional[str] = None
    recovery_attempts: List[Dict[str, Any]] = Field(default_factory=list)
```

---

## Implementation Checklist

### For New Workflow Types

- [ ] Create subclass of `BaseWorkflowState`
- [ ] Define workflow-specific fields with proper types
- [ ] Implement `get_workflow_type()` method
- [ ] Implement `get_current_stage()` method
- [ ] Define valid stage transitions
- [ ] Add JSON serialization support
- [ ] Test with `@with_governance` decorator
- [ ] Update governance integration if needed

### For Agent Implementation

- [ ] Accept `BaseWorkflowState` or specific subclass in method signatures
- [ ] Use type hints for state parameters
- [ ] Log state transitions to audit trail
- [ ] Record errors in state, not just logs
- [ ] Support state serialization for persistence

---

## Migration Guide

### Migrating from Dict to WorkflowState

When migrating existing dict-based workflows:

1. **Define the state model:**
```python
class MyWorkflowState(BaseWorkflowState):
    # Map dict keys to typed fields
    my_data: Dict[str, Any] = Field(default_factory=dict)
```

2. **Update method signatures:**
```python
# Before
async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:

# After
async def process(self, state: MyWorkflowState) -> MyWorkflowState:
```

3. **Create adapter for transition period:**
```python
def adapt_dict_to_state(input_data: Dict[str, Any]) -> MyWorkflowState:
    """Adapter for legacy dict-based calls."""
    return MyWorkflowState(
        workflow_id=input_data.get("session_id", str(uuid.uuid4())),
        my_data=input_data.get("procurement_data", {}),
        # ... map other fields
    )
```

---

## Related Standards

- **Python Module Naming**: `docs/standards/0006_PYTHON_MODULE_NAMING_STANDARDS.md`
- **Agent Coding Standards**: `docs/standards/0000_AGENT_CODING_STANDARDS.md`
- **Governance Architecture**: `docs/standards/0000_GOVERNANCE_SWARM_ARCHITECTURE.md`

---

## Document Information

- **Document ID**: `0007_WORKFLOW_STATE_STANDARDS`
- **Version**: 1.0.0
- **Created**: 2026-02-24
- **Author**: Construct AI Development Team
- **Status**: ACTIVE
- **Next Review**: 2026-03-24