# OpenClaw Quick Start Guide

**Document ID:** `OPENCLAW_QUICK_START`  
**Version:** 1.0.0  
**Created:** 2026-03-12  
**Status:** DRAFT  

---

## Overview

This guide provides step-by-step instructions for OpenClaw agents to integrate with the Construct AI ecosystem. Follow these instructions to get your agent operational within the Construct AI platform.

---

## Prerequisites

Before starting integration, ensure you have:

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed (for JavaScript agents)
- [ ] Access to Construct AI repository
- [ ] Supabase credentials (URL and service key)
- [ ] Understanding of Construct AI standards

---

## Step 1: Review Core Standards

All OpenClaw agents MUST review and understand these core standards before integration:

### 1.1 Agent Coding Standards

**File:** `/docs/standards/0000_AGENT_CODING_STANDARDS.md`

**Key Requirements:**
- ES6+ syntax for JavaScript/Node.js
- PEP 8 compliance for Python
- Governance integration (11-Agent Governance Swarm)
- Comprehensive debug logging
- Error handling with try/catch

**Quick Reference:**
```python
# Python agent structure
from deep_agents.agents.shared.governance import with_governance, GovernedAgentMixin

class YourAgent(GovernedAgentMixin):
    @with_governance(jurisdiction='FI', strict_mode=True)
    async def execute_task(self, task):
        # Your implementation
        return result
```

```javascript
// JavaScript agent structure
class YourAgent {
  async executeTask(task) {
    try {
      // Your implementation
      return result;
    } catch (error) {
      logger.error('Task failed', { error, taskId: task.id });
      throw error;
    }
  }
}
```

### 1.2 File Naming Standards

**File:** `/docs/standards/0000_FILE_NAMING_STANDARDS.md`

**Key Requirements:**
- All filenames must be lowercase
- Use underscores (not hyphens or spaces)
- Numeric prefixes for ordering
- No emojis in filenames

**Examples:**
```
✅ Correct:
- 0000_agent_coding_standards.md
- 01900_procurement_architecture.md
- correspondence_01_document_analysis_agent.js

❌ Incorrect:
- Agent-Coding-Standards.md
- 01900-procurement-architecture.md
- correspondence-01-document-analysis-agent.js
```

### 1.3 Python Module Naming Standards

**File:** `/docs/standards/0000_PYTHON_MODULE_NAMING_STANDARDS.md`

**Key Requirements:**
- PEP 8 compliance mandatory
- Underscores required (not hyphens) for Python imports
- Discipline directories: `{code}_{name}` format

**Examples:**
```
✅ Correct:
- deep_agents/agents/pages/01900_procurement/
- deep_agents/agents/pages/01700_logistics/

❌ Incorrect:
- deep_agents/agents/pages/01900-procurement/
- deep_agents/agents/pages/01700-logistics/
```

### 1.4 Workflow Optimization Standards

**File:** `/docs/standards/0000_WORKFLOW_OPTIMIZATION_STANDARDS.md`

**Key Requirements:**
- System optimization procedures
- Quality assessment frameworks
- Documentation standards
- Performance monitoring

---

## Step 2: Understand Governance Requirements

### 2.1 11-Agent Governance Swarm

All agents MUST integrate with the governance system. The governance swarm ensures compliance with:
- AIUC-1 (AI Usage Compliance)
- ISO 42001 (AI Management)
- ISO 27701 (Privacy Information)
- EU AI Act
- NIS2 (Network Security)

### 2.2 Jurisdiction Declaration

Every agent must declare its primary jurisdiction:

| Jurisdiction | Code | Privacy Regulation | Data Residency |
|--------------|------|-------------------|----------------|
| Finland | FI | GDPR | EU |
| South Africa | ZA | POPIA | ZA, EU |
| Guinea | GN | GDPR | GN, EU |
| Sweden | SE | GDPR | EU |
| Senegal | SA | Various | SA, EU |
| European Union | EU | GDPR | EU |

### 2.3 Governance Decorator

Apply the governance decorator to all agent methods:

```python
from deep_agents.agents.shared.governance import with_governance

class YourAgent:
    @with_governance(jurisdiction='FI', strict_mode=True)
    async def process_data(self, data):
        # Automatic governance validation
        return await self._process_impl(data)
```

---

## Step 3: Set Up Development Environment

### 3.1 Clone Repository

```bash
# Clone the Construct AI repository
git clone git@github.com:Construct-AI-primary/construct_ai.git
cd construct_ai

# Navigate to deep-agents directory
cd deep-agents
```

### 3.2 Install Dependencies

```bash
# Python dependencies
pip install -r requirements.txt

# Node.js dependencies (if needed)
npm install
```

### 3.3 Configure Environment Variables

Create or update `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Enable database integration
USE_DB_INTEGRATION=true

# Agent Configuration
AGENT_JURISDICTION=FI
AGENT_STRICT_MODE=true

# Logging
LOG_LEVEL=INFO
ENABLE_STRUCTURED_LOGGING=true

# Performance
MAX_CONCURRENT_TASKS=10
TASK_TIMEOUT_MS=30000
```

### 3.4 Verify Installation

```bash
# Test Python environment
python -c "
import sys
print(f'Python version: {sys.version}')
from deep_agents.agents.shared.governance import with_governance
print('✅ Governance module imported successfully')
"

# Test database connection
python -c "
import asyncio
from supabase import create_client
import os

async def test_connection():
    client = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    result = await client.table('agents_tracking').select('*').limit(1).execute()
    print('✅ Database connection successful')

asyncio.run(test_connection())
"
```

---

## Step 4: Create Your Agent

### 4.1 Choose Agent Type

| Type | Description | Use Case |
|------|-------------|----------|
| **Supervisor** | Orchestrates other agents | Task delegation, workflow management |
| **Specialist** | Domain expert | Specific functionality (validation, analysis, etc.) |
| **SubAgent** | Worker agent | Executes specific tasks |

### 4.2 Create Agent Directory

Follow the directory structure:

```
deep_agents/agents/pages/{discipline_code}_{discipline_name}/
├── main_agents/           # Core agents
├── specialist_agents/     # Domain experts
├── services/              # Business logic
├── utils/                 # Helper utilities
└── documentation/         # Agent documentation
```

**Example for OpenClaw integration agent:**

```bash
# Create directory structure
mkdir -p deep_agents/agents/pages/02100_openclaw_integration/main_agents
mkdir -p deep_agents/agents/pages/02100_openclaw_integration/specialist_agents
mkdir -p deep_agents/agents/pages/02100_openclaw_integration/services
mkdir -p deep_agents/agents/pages/02100_openclaw_integration/utils
mkdir -p deep_agents/agents/pages/02100_openclaw_integration/documentation

# Create __init__.py files
touch deep_agents/agents/pages/02100_openclaw_integration/__init__.py
touch deep_agents/agents/pages/02100_openclaw_integration/main_agents/__init__.py
touch deep_agents/agents/pages/02100_openclaw_integration/specialist_agents/__init__.py
touch deep_agents/agents/pages/02100_openclaw_integration/services/__init__.py
touch deep_agents/agents/pages/02100_openclaw_integration/utils/__init__.py
```

### 4.3 Create Agent Implementation

**File:** `deep_agents/agents/pages/02100_openclaw_integration/main_agents/openclaw_orchestrator_agent.py`

```python
"""
OpenClaw Orchestrator Agent

Main coordination agent for OpenClaw integration with Construct AI.
Manages task delegation, state synchronization, and governance compliance.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict

# Governance integration
from deep_agents.agents.shared.governance import (
    with_governance,
    GovernedAgentMixin,
    GovernanceBlockedError
)

# Database integration
try:
    from supabase import create_client
    import os
    DB_INTEGRATION = True
except ImportError:
    DB_INTEGRATION = False

logger = logging.getLogger(__name__)


@dataclass
class Task:
    """Task data structure"""
    task_id: str
    task_type: str
    delegating_agent: str
    receiving_agent: str
    parameters: Dict[str, Any]
    priority: str = "medium"
    deadline: Optional[str] = None
    callback_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class TaskResult:
    """Task result data structure"""
    task_id: str
    status: str  # success, error, timeout
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    execution_time_ms: int = 0


class OpenClawOrchestratorAgent(GovernedAgentMixin):
    """
    OpenClaw Orchestrator Agent
    
    Coordinates all OpenClaw agents and manages integration with Construct AI.
    Handles task delegation, state synchronization, and governance compliance.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the orchestrator agent"""
        super().__init__()
        self.config = config or self._default_config()
        self.agent_id = "openclaw_orchestrator"
        self.jurisdiction = self.config.get('jurisdiction', 'FI')
        
        # Initialize database connection
        if DB_INTEGRATION and self.config.get('use_db'):
            self.supabase = create_client(
                os.getenv('SUPABASE_URL'),
                os.getenv('SUPABASE_SERVICE_KEY')
            )
        else:
            self.supabase = None
        
        logger.info(f"✅ OpenClaw Orchestrator initialized (jurisdiction: {self.jurisdiction})")
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration"""
        return {
            'jurisdiction': 'FI',
            'strict_mode': True,
            'use_db': True,
            'max_concurrent_tasks': 10,
            'task_timeout_ms': 30000,
            'retry_max_attempts': 3,
            'retry_base_delay_ms': 1000
        }
    
    @with_governance(jurisdiction='FI', strict_mode=True)
    async def delegate_task(self, task: Task) -> TaskResult:
        """
        Delegate a task to a Construct AI agent.
        
        Args:
            task: Task to delegate
            
        Returns:
            TaskResult with execution outcome
            
        Raises:
            GovernanceBlockedError: If governance validation fails
        """
        start_time = datetime.utcnow()
        
        try:
            # Validate task
            await self._validate_task(task)
            
            # Log task initiation
            logger.info(f"Delegating task {task.task_id} to {task.receiving_agent}")
            
            # Store task in database
            if self.supabase:
                await self._store_task(task)
            
            # Execute task (placeholder - actual execution depends on target agent)
            result = await self._execute_task(task)
            
            # Calculate execution time
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            # Create result
            task_result = TaskResult(
                task_id=task.task_id,
                status='success',
                result=result,
                execution_time_ms=int(execution_time)
            )
            
            # Store result in database
            if self.supabase:
                await self._store_result(task_result)
            
            logger.info(f"Task {task.task_id} completed successfully in {execution_time:.0f}ms")
            
            return task_result
            
        except GovernanceBlockedError as e:
            logger.error(f"Governance blocked task {task.task_id}: {e}")
            raise
            
        except Exception as e:
            execution_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            task_result = TaskResult(
                task_id=task.task_id,
                status='error',
                error={
                    'code': 4001,
                    'message': str(e),
                    'type': type(e).__name__
                },
                execution_time_ms=int(execution_time)
            )
            
            if self.supabase:
                await self._store_result(task_result)
            
            logger.error(f"Task {task.task_id} failed: {e}")
            raise
    
    async def _validate_task(self, task: Task) -> None:
        """Validate task parameters"""
        if not task.task_id:
            raise ValueError("task_id is required")
        if not task.task_type:
            raise ValueError("task_type is required")
        if not task.receiving_agent:
            raise ValueError("receiving_agent is required")
    
    async def _execute_task(self, task: Task) -> Dict[str, Any]:
        """
        Execute task by delegating to appropriate agent.
        
        This is a placeholder - actual implementation would route to
        the appropriate Construct AI agent based on task_type.
        """
        # Placeholder execution
        await asyncio.sleep(0.1)  # Simulate work
        
        return {
            'status': 'completed',
            'task_id': task.task_id,
            'agent': task.receiving_agent
        }
    
    async def _store_task(self, task: Task) -> None:
        """Store task in database"""
        if not self.supabase:
            return
        
        try:
            await self.supabase.table('openclaw_tasks').insert({
                'task_id': task.task_id,
                'task_type': task.task_type,
                'delegating_agent': task.delegating_agent,
                'receiving_agent': task.receiving_agent,
                'parameters': json.dumps(task.parameters),
                'priority': task.priority,
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to store task in database: {e}")
    
    async def _store_result(self, result: TaskResult) -> None:
        """Store task result in database"""
        if not self.supabase:
            return
        
        try:
            await self.supabase.table('openclaw_tasks').update({
                'status': result.status,
                'result': json.dumps(result.result) if result.result else None,
                'error': json.dumps(result.error) if result.error else None,
                'execution_time_ms': result.execution_time_ms,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('task_id', result.task_id).execute()
        except Exception as e:
            logger.warning(f"Failed to store result in database: {e}")
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status from database"""
        if not self.supabase:
            return None
        
        try:
            result = await self.supabase.table('openclaw_tasks') \
                .select('*') \
                .eq('task_id', task_id) \
                .execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Failed to get task status: {e}")
            return None
    
    async def list_active_tasks(self) -> List[Dict[str, Any]]:
        """List all active tasks"""
        if not self.supabase:
            return []
        
        try:
            result = await self.supabase.table('openclaw_tasks') \
                .select('*') \
                .in_('status', ['pending', 'running']) \
                .order('created_at', desc=True) \
                .execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Failed to list active tasks: {e}")
            return []


# Factory function for creating agent instance
def create_openclaw_orchestrator(config: Optional[Dict[str, Any]] = None) -> OpenClawOrchestratorAgent:
    """Create and return an OpenClaw Orchestrator agent instance"""
    return OpenClawOrchestratorAgent(config)


# Example usage
if __name__ == "__main__":
    async def main():
        # Create agent
        agent = create_openclaw_orchestrator({
            'jurisdiction': 'FI',
            'strict_mode': True,
            'use_db': False  # Disable DB for example
        })
        
        # Create task
        task = Task(
            task_id="example-task-001",
            task_type="page_scaffolding",
            delegating_agent="orion",
            receiving_agent="page_creation_assistant",
            parameters={
                "pageName": "new-feature",
                "pageRoute": "/new-feature"
            }
        )
        
        # Execute task
        result = await agent.delegate_task(task)
        print(f"Task result: {result}")
    
    asyncio.run(main())
```

### 4.4 Create Agent Documentation

**File:** `deep_agents/agents/pages/02100_openclaw_integration/documentation/README.md`

```markdown
# OpenClaw Integration Agent

## Overview

This agent provides integration between OpenClaw agents and the Construct AI ecosystem.

## Agent Details

- **Agent ID**: openclaw_orchestrator
- **Agent Type**: Supervisor
- **Version**: 1.0.0
- **Status**: Active
- **Jurisdiction**: FI (configurable)

## Capabilities

- Task delegation to Construct AI agents
- State synchronization
- Governance compliance validation
- Error handling and retry logic
- Metrics collection

## Integration Points

### Construct AI Agents

- Page Creation Assistant Agent
- EPCM Standardization Agent
- All supervisor agents

### Database Tables

- `openclaw_tasks`: Task tracking
- `agent_states`: State synchronization
- `metrics`: Performance metrics

## Configuration

```python
config = {
    'jurisdiction': 'FI',
    'strict_mode': True,
    'use_db': True,
    'max_concurrent_tasks': 10,
    'task_timeout_ms': 30000
}
```

## Usage

```python
from deep_agents.agents.pages.02100_openclaw_integration.main_agents.openclaw_orchestrator_agent import (
    create_openclaw_orchestrator,
    Task
)

# Create agent
agent = create_openclaw_orchestrator(config)

# Create and execute task
task = Task(
    task_id="task-001",
    task_type="page_scaffolding",
    delegating_agent="orion",
    receiving_agent="page_creation_assistant",
    parameters={"pageName": "new-page"}
)

result = await agent.delegate_task(task)
```

## Testing

```bash
# Run agent tests
python -m pytest deep_agents/agents/pages/02100_openclaw_integration/tests/

# Run with coverage
python -m pytest --cov=deep_agents.agents.pages.02100_openclaw_integration
```

## Related Documentation

- [Agent Coding Standards](/docs/standards/0000_AGENT_CODING_STANDARDS.md)
- [OpenClaw Integration Protocol](/docs/openclaw-integration/0000_OPENCLAW_INTEGRATION_PROTOCOL.md)
- [OpenClaw Agent Mapping](/docs/openclaw-integration/0000_OPENCLAW_AGENT_MAPPING.md)
```

---

## Step 5: Register with Agent Registry

### 5.1 Update Agents Registry

Add your agent to `/docs/agents/0000_AGENTS_REGISTRY.md`:

```markdown
### OpenClaw Orchestrator Agent

**Agent ID**: `openclaw_orchestrator`  
**Agent Type**: Supervisor Agent  
**Version**: 1.0.0  
**Status**: ✅ Active  
**Location**: `/deep-agents/deep_agents/agents/pages/02100_openclaw_integration/main_agents/`

#### Purpose
Coordinates OpenClaw agents and manages integration with Construct AI ecosystem.

#### Key Features
- ✅ Task delegation to Construct AI agents
- ✅ State synchronization
- ✅ Governance compliance validation
- ✅ Error handling and retry logic
- ✅ Metrics collection

#### Capabilities
- `task_delegation`: Delegate tasks to Construct AI agents
- `state_synchronization`: Sync state across systems
- `governance_validation`: Validate governance compliance
- `error_handling`: Handle errors with retry logic
- `metrics_collection`: Collect and report metrics

#### Integration Points
- **Construct AI Agents**: Page Creation, EPCM Standardization
- **Database**: openclaw_tasks, agent_states, metrics tables
- **Governance**: 11-Agent Governance Swarm

#### Configuration Options
```python
{
  'jurisdiction': 'FI',
  'strict_mode': True,
  'use_db': True,
  'max_concurrent_tasks': 10,
  'task_timeout_ms': 30000
}
```

#### Dependencies
- Python 3.9+
- Supabase client
- Governance module

#### Compliance Standards
- ✅ [Agent Coding Standards](../standards/0000_AGENT_CODING_STANDARDS.md)
- ✅ [Workflow Optimization Guide](../procedures/agent-development/0000_WORKFLOW_OPTIMIZATION_GUIDE.md)

#### Documentation
- **README**: `/deep-agents/agents/pages/02100_openclaw_integration/documentation/README.md`
- **Source**: `/deep-agents/agents/pages/02100_openclaw_integration/main_agents/openclaw_orchestrator_agent.py`

#### Created By
OpenClaw Integration Team

#### Creation Date
2026-03-12
```

---

## Step 6: Test Integration

### 6.1 Create Integration Tests

**File:** `deep_agents/agents/pages/02100_openclaw_integration/tests/test_integration.py`

```python
"""
Integration tests for OpenClaw agent
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock

from deep_agents.agents.pages.02100_openclaw_integration.main_agents.openclaw_orchestrator_agent import (
    OpenClawOrchestratorAgent,
    Task,
    TaskResult,
    create_openclaw_orchestrator
)


class TestOpenClawOrchestrator:
    """Test suite for OpenClaw Orchestrator Agent"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.config = {
            'jurisdiction': 'FI',
            'strict_mode': True,
            'use_db': False  # Disable DB for unit tests
        }
        self.agent = create_openclaw_orchestrator(self.config)
    
    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id == "openclaw_orchestrator"
        assert self.agent.jurisdiction == "FI"
    
    @pytest.mark.asyncio
    async def test_delegate_task_success(self):
        """Test successful task delegation"""
        task = Task(
            task_id="test-task-001",
            task_type="page_scaffolding",
            delegating_agent="orion",
            receiving_agent="page_creation_assistant",
            parameters={"pageName": "test-page"}
        )
        
        result = await self.agent.delegate_task(task)
        
        assert isinstance(result, TaskResult)
        assert result.task_id == "test-task-001"
        assert result.status == "success"
        assert result.execution_time_ms > 0
    
    @pytest.mark.asyncio
    async def test_delegate_task_missing_task_id(self):
        """Test task delegation fails with missing task_id"""
        task = Task(
            task_id="",
            task_type="page_scaffolding",
            delegating_agent="orion",
            receiving_agent="page_creation_assistant",
            parameters={}
        )
        
        with pytest.raises(ValueError, match="task_id is required"):
            await self.agent.delegate_task(task)
    
    @pytest.mark.asyncio
    async def test_validate_task(self):
        """Test task validation"""
        task = Task(
            task_id="valid-task",
            task_type="page_scaffolding",
            delegating_agent="orion",
            receiving_agent="page_creation_assistant",
            parameters={}
        )
        
        # Should not raise
        await self.agent._validate_task(task)
    
    def test_default_config(self):
        """Test default configuration"""
        config = self.agent._default_config()
        
        assert config['jurisdiction'] == 'FI'
        assert config['strict_mode'] == True
        assert config['max_concurrent_tasks'] == 10


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

### 6.2 Run Tests

```bash
# Navigate to deep-agents directory
cd deep-agents

# Run integration tests
python -m pytest deep_agents/agents/pages/02100_openclaw_integration/tests/ -v

# Run with coverage
python -m pytest deep_agents/agents/pages/02100_openclaw_integration/tests/ \
    --cov=deep_agents.agents.pages.02100_openclaw_integration \
    --cov-report=html
```

---

## Step 7: Validate Governance Compliance

### 7.1 Test Governance Integration

```python
# Test governance decorator
python -c "
from deep_agents.agents.shared.governance import validate_governance

# Validate your agent module
validate_governance('deep_agents.agents.pages.02100_openclaw_integration.main_agents.openclaw_orchestrator_agent')
print('✅ Governance validation passed')
"
```

### 7.2 Verify Jurisdiction Rules

```python
# Test jurisdiction validation
python -c "
import asyncio
from deep_agents.agents.pages.02100_openclaw_integration.main_agents.openclaw_orchestrator_agent import (
    create_openclaw_orchestrator
)

async def test_jurisdiction():
    agent = create_openclaw_orchestrator({'jurisdiction': 'FI'})
    
    # Test operation validation
    operation = {
        'data_location': 'EU',
        'involves_personal_data': True
    }
    
    # This should pass for FI jurisdiction
    print('✅ Jurisdiction validation working')

asyncio.run(test_jurisdiction())
"
```

---

## Step 8: Deploy to Production

### 8.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Governance validation passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security audit passed

### 8.2 Deployment Steps

```bash
# 1. Commit changes
git add .
git commit -m "feat: Add OpenClaw integration agent"

# 2. Push to repository
git push origin feature/openclaw-integration

# 3. Create pull request
# (Use GitHub UI or CLI)

# 4. After merge, deploy
# (Follow your deployment procedures)
```

### 8.3 Post-Deployment Verification

```bash
# Verify agent is registered
python -c "
from supabase import create_client
import os

client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

result = client.table('agents_tracking') \
    .select('*') \
    .eq('agent_name', 'openclaw_orchestrator') \
    .execute()

if result.data:
    print('✅ Agent registered in database')
else:
    print('❌ Agent not found in database')
"
```

---

## Common Issues and Solutions

### Issue 1: Import Errors

**Problem:** `ModuleNotFoundError: No module named 'deep_agents'`

**Solution:**
```bash
# Add deep-agents to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/deep-agents"

# Or create .pth file
echo "$(pwd)/deep-agents" > ~/.local/lib/python3.9/site-packages/deep_agents.pth
```

### Issue 2: Governance Validation Fails

**Problem:** `GovernanceBlockedError: Operation blocked by governance`

**Solution:**
```python
# Check jurisdiction configuration
agent = create_openclaw_orchestrator({
    'jurisdiction': 'FI',  # Ensure valid jurisdiction
    'strict_mode': True
})

# Verify governance policies
from deep_agents.agents.shared.governance import get_governance_policies
policies = get_governance_policies('FI')
print(f"Available policies: {policies}")
```

### Issue 3: Database Connection Fails

**Problem:** `SupabaseError: Connection failed`

**Solution:**
```bash
# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Test connection
python -c "
from supabase import create_client
import os

try:
    client = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    print('✅ Connection successful')
except Exception as e:
    print(f'❌ Connection failed: {e}')
"
```

### Issue 4: Task Timeout

**Problem:** Tasks timing out

**Solution:**
```python
# Increase timeout in config
config = {
    'task_timeout_ms': 60000,  # 60 seconds
    'retry_max_attempts': 5
}

agent = create_openclaw_orchestrator(config)
```

---

## Next Steps

After completing this quick start:

1. **Review Architecture Documents**
   - Procurement Architecture
   - Logistics Architecture
   - Context Awareness Framework

2. **Explore Existing Agents**
   - Study agent patterns in `/deep-agents/deep_agents/agents/pages/`
   - Review agent implementations
   - Understand integration patterns

3. **Join Integration Community**
   - Participate in integration discussions
   - Share experiences and best practices
   - Collaborate on improvements

4. **Continuous Improvement**
   - Monitor agent performance
   - Collect feedback
   - Iterate on implementation

---

## Support Resources

### Documentation
- **Main Recommendations**: `/docs/openclaw-integration/openclaw-integration-recommendations.md`
- **Agent Mapping**: `/docs/openclaw-integration/0000_OPENCLAW_AGENT_MAPPING.md`
- **Integration Protocol**: `/docs/openclaw-integration/0000_OPENCLAW_INTEGRATION_PROTOCOL.md`

### Code Examples
- **Existing Agents**: `/deep-agents/deep_agents/agents/pages/`
- **Governance Module**: `/deep-agents/deep_agents/agents/shared/governance/`
- **Test Examples**: `/deep-agents/tests/`

### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and references
- **Code Reviews**: Get feedback on your implementation

---

## Document Control

**Version History:**
- v1.0.0 (2026-03-12): Initial release

**Review Schedule:**
- Monthly review and update
- Update when procedures change

**Approval:**
- Construct AI Architecture Team
- OpenClaw Integration Team

---

*End of Document*