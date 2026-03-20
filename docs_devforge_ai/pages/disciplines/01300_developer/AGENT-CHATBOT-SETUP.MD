# Multi-Agent Chatbot Configuration - Contracts Post-Award

## 🎯 Multiple Agents on Same Page Strategy

**Branch**: `chad-00435-contracts-post-award-test`

## 📋 Chatbot Architecture

### 1. **Shared vs Dedicated Chatbots**
- **Dedicated Chatbots**: Each agent has its own chatbot ID and endpoint
- **Shared Chatbots**: Multiple agents can share a base chatbot with different contexts
- **Hybrid Approach**: Use shared base + specialized endpoints

### 2. **Chatbot Configuration System**

**File**: `components/agents/chatbot-config.js`
- Centralized configuration for all agents
- Easy to add new agents without code changes
- Supports both shared and dedicated chatbots

### 3. **Agent Mapping**

| Agent Type | Chatbot ID | Endpoint | Purpose |
|------------|------------|----------|---------|
| Test | `test-contracts-agent` | `/api/agents/test` | Basic testing |
| Legal | `legal-contracts-agent` | `/api/agents/legal` | Legal review |
| Financial | `financial-contracts-agent` | `/api/agents/financial` | Cost analysis |
| Risk | `risk-contracts-agent` | `/api/agents/risk` | Risk assessment |

## 🎯 Database Configuration for Multiple Agents

### SQL for All Agents:
```sql
-- Test Agent
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state, 
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-001-test-contract-analysis', 'Test Contract Analysis',
  '@pages/00435-contracts-post-award/components/agents/test-modal.js',
  '00435', 'Agent', 'test-contracts-agent', 'None', 'Input Form', false
);

-- Legal Agent
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-002-legal-contract-analysis', 'Legal Contract Review',
  '@pages/00435-contracts-post-award/components/agents/legal-modal.js',
  '00435', 'Agent', 'legal-contracts-agent', 'Flowise', 'Input Form', false
);

-- Financial Agent
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-003-financial-contract-analysis', 'Financial Analysis',
  '@pages/00435-contracts-post-award/components/agents/financial-modal.js',
  '00435', 'Agent', 'financial-contracts-agent', 'Flowise', 'Input Form', false
);

-- Risk Agent
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-004-risk-contract-analysis', 'Risk Assessment',
  '@pages/00435-contracts-post-award/components/agents/risk-modal.js',
  '00435', 'Agent', 'risk-contracts-agent', 'Flowise', 'Input Form', false
);
```

## 🎯 Implementation Options

### Option 1: Individual Agent Triggers
```javascript
// Use individual trigger components
import { LegalAgentTrigger, FinancialAgentTrigger, RiskAgentTrigger } from './components/agents/multi-agent-triggers';

// In page component
<div>
  <LegalAgentTrigger contractId={contract.id} />
  <FinancialAgentTrigger contractId={contract.id} />
  <RiskAgentTrigger contractId={contract.id} />
</div>
```

### Option 2: Multi-Agent Panel
```javascript
// Use the combined trigger component
import MultiAgentTriggers from './components/agents/multi-agent-triggers';

// In page component
<MultiAgentTriggers contractId={contract.id} documentContext={contract} />
```

### Option 3: Contextual Agent Selection
```javascript
// Dynamic agent selection based on contract type
const getRelevantAgents = (contractType) => {
  const agentMap = {
    'construction': ['legal-contracts-agent', 'risk-contracts-agent'],
    'service': ['financial-contracts-agent', 'legal-contracts-agent'],
    'supply': ['financial-contracts-agent', 'risk-contracts-agent']
  };
  return agentMap[contractType] || ['test-contracts-agent'];
};
```

## 🔄 Chatbot Sharing Strategies

### 1. **Shared Base Chatbot**
- Use one chatbot with different contexts
- Pass agent type as parameter
- Single endpoint handles all agent types

### 2. **Dedicated Chatbots**
- Each agent has its own chatbot
- Specialized training for each domain
- Separate endpoints for each agent

### 3. **Hybrid Approach**
- Shared base chatbot for common tasks
- Specialized chatbots for complex domains
- Routing based on agent type

## 🎯 API Endpoint Design

### Shared Endpoint:
```javascript
// Single endpoint with agent parameter
POST /api/agents/execute
Body: {
  agentType: 'legal|financial|risk|test',
  contractData: {...},
  context: {...}
}
```

### Dedicated Endpoints:
```javascript
// Separate endpoints for each agent
POST /api/agents/legal
POST /api/agents/financial
POST /api/agents/risk
POST /api/agents/test
```

## 🎯 Development Workflow

1. **Choose chatbot strategy** (shared vs dedicated)
2. **Configure chatbots** in Flowise/n8n
3. **Update chatbot-config.js** with new agents
4. **Add modal configurations** to database
5. **Create agent-specific modal components**
6. **Test integration** with Modal Management page

## 🎯 Next Steps

1. **Set up chatbots** in Flowise for each agent type
2. **Configure endpoints** based on chosen strategy
3. **Create additional agent modal components** as needed
4. **Test multi-agent functionality** on contracts page
5. **Document agent-specific behaviors** for contributors

## 🎯 Key Benefits

- **Scalable**: Easy to add new agents
- **Maintainable**: Centralized configuration
- **Flexible**: Supports both shared and dedicated chatbots
- **Isolated**: Each contributor can work on their agent independently
- **Integrated**: All agents work on the same page seamlessly
