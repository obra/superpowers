# Contracts Post-Award Agent System

## Overview
Comprehensive documentation for the contracts post-award agent system, including architecture, security, implementation, and testing procedures.

## Architecture

### Multi-Agent System Design
```javascript
// Centralized configuration in chatbot-config.js
const agentConfig = {
  test: {
    id: 'test-contracts-agent',
    endpoint: '/api/agents/test',
    description: 'Basic testing agent'
  },
  legal: {
    id: 'legal-contracts-agent', 
    endpoint: '/api/agents/legal',
    description: 'Legal contract review'
  },
  financial: {
    id: 'financial-contracts-agent',
    endpoint: '/api/agents/financial',
    description: 'Financial analysis'
  },
  risk: {
    id: 'risk-contracts-agent',
    endpoint: '/api/agents/risk', 
    description: 'Risk assessment'
  }
};
```

### Database Configuration
```sql
-- Example legal agent configuration
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix,
  target_state, chatbot_id, integration_type, interaction_style
) VALUES (
  'A-00435-03-002-legal-analysis', 'Legal Contract Review',
  '@pages/00435-contracts-post-award/components/agents/legal-modal.js',
  '00435', 'Agent', 'legal-contracts-agent', 'Flowise', 'Input Form'
);
```

## Security Framework

### Core Principles
1. **User Context Isolation**
2. **Memory Segregation** 
3. **Session Management**
4. **Real-time Monitoring**
5. **Automated Testing**

### Implementation Example
```javascript
class SecureAgentContext {
  constructor(userId) {
    this.userId = userId;
    this.securityToken = this.generateSecurityToken();
    this.isolatedMemory = new Map();
  }
  
  validateAccess(resourceId) {
    // Verify resource ownership
  }
}
```

## Implementation

### Agent Types
| Agent | ID | Endpoint | Purpose |
|-------|----|----------|---------|
| Test | test-contracts-agent | /api/agents/test | Basic testing |
| Legal | legal-contracts-agent | /api/agents/legal | Legal review |
| Financial | financial-contracts-agent | /api/agents/financial | Cost analysis |
| Risk | risk-contracts-agent | /api/agents/risk | Risk assessment |

### Trigger Integration
```javascript
// In contracts post-award page
import { LegalTrigger, FinancialTrigger } from './components/agents/multi-agent-triggers';

function ContractsPage() {
  return (
    <div>
      <LegalTrigger contractId={contract.id} />
      <FinancialTrigger contractId={contract.id} />
    </div>
  );
}
```

## Testing Procedures

### Test Agent Setup
```sql
-- Test agent configuration
INSERT INTO modal_configurations (
  modal_key, component_path, target_page_prefix, chatbot_id  
) VALUES (
  'A-00435-03-001-test-analysis',
  '@pages/00435-contracts-post-award/components/agents/test-modal.js',
  '00435', 'test-contracts-agent'
);
```

### Legal Agent Testing
1. **File Structure Check**
2. **Database Configuration**
3. **End-to-End Workflow**
4. **Performance Testing**

## Development Workflow

1. Configure agents in `chatbot-config.js`
2. Add modal configurations to database
3. Create agent components
4. Test via Modal Management page
5. Integrate triggers into contracts page

## API Endpoints

### Shared Endpoint
```
POST /api/agents/execute
Body: {
  agentType: 'legal|financial|risk|test',
  contractData: {...}
}
```

### Dedicated Endpoints
```
POST /api/agents/legal
POST /api/agents/financial 
POST /api/agents/risk
POST /api/agents/test
```

## Related Documentation
- [Contracts Post-Award Page](./archive/1300_00435_CONTRACTS_POST_AWARD_PAGE.md)
- [Agent Security Framework](./archive/0280_AGENT_SECURITY_FRAMEWORK.md)
- [Modal Management System](./0975_00_MODAL_MANAGEMENT.md)
