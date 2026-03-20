# LangChain + Flowise + n8n Agent Setup - 00435 Contracts Post-Award

## 🎯 Multi-Tool Agent Architecture

**Branch**: `chad-00435-contracts-post-award-test`

## 📋 Architecture Overview

### **Agent Stack:**
- **LangChain/LangGraph**: Core agent orchestration
- **Flowise**: Visual workflow builder for complex agents
- **n8n**: Workflow automation and integrations
- **Shared 5-digit prefix**: All agents use `00435`

## 🎯 **Agent Configuration**

### **LangChain Agents (Core Logic)**
```javascript
// LangChain agent configuration
const langchainAgents = {
  '00435-legal-agent': {
    type: 'langchain',
    name: 'Legal Contract Review',
    tools: ['contract_parser', 'legal_checker', 'compliance_analyzer'],
    model: 'gpt-4',
    temperature: 0.1,
    systemPrompt: 'You are a legal expert reviewing contracts...'
  },
  
  '00435-financial-agent': {
    type: 'langchain',
    name: 'Financial Analysis',
    tools: ['cost_calculator', 'budget_analyzer', 'roi_predictor'],
    model: 'gpt-4',
    temperature: 0.2,
    systemPrompt: 'You are a financial analyst...'
  },
  
  '00435-risk-agent': {
    type: 'langchain',
    name: 'Risk Assessment',
    tools: ['risk_scorer', 'mitigation_suggester', 'impact_analyzer'],
    model: 'gpt-4',
    temperature: 0.3,
    systemPrompt: 'You are a risk assessment expert...'
  }
};
```

### **Flowise Workflows (Visual Builder)**
```javascript
// Flowise workflow configurations
const flowiseWorkflows = {
  '00435-contract-analysis': {
    type: 'flowise',
    endpoint: '/api/flowise/00435/analyze',
    workflowId: 'contracts-post-award-analysis',
    inputs: ['contract_text', 'context', 'agent_type']
  },
  
  '00435-legal-review': {
    type: 'flowise',
    endpoint: '/api/flowise/00435/legal',
    workflowId: 'legal-compliance-check',
    inputs: ['contract_data', 'legal_standards']
  }
};
```

### **n8n Workflows (Automation)**
```javascript
// n8n automation workflows
const n8nWorkflows = {
  '00435-notification-agent': {
    type: 'n8n',
    endpoint: '/api/n8n/00435/notify',
    workflowId: 'contract-notifications',
    triggers: ['contract_submitted', 'review_completed', 'approval_needed']
  },
  
  '00435-reporting-agent': {
    type: 'n8n',
    endpoint: '/api/n8n/00435/report',
    workflowId: 'contract-reporting',
    schedule: 'daily|weekly|monthly'
  }
};
```

## 🎯 **Updated Chatbot Configuration**

**File**: `components/agents/chatbot-config.js` (Updated for multi-tool stack)
```javascript
export const CHATBOT_CONFIGS = {
  '00435-contracts-agent': {
    id: '00435-contracts-agent',
    name: '00435 Contracts Post-Award Assistant',
    description: 'Multi-tool contracts analysis system',
    page: '00435',
    tools: {
      // LangChain agents
      langchain: {
        legal: {
          id: '00435-legal-langchain',
          endpoint: '/api/langchain/00435/legal',
          type: 'langchain',
          tools: ['contract_parser', 'legal_checker']
        },
        financial: {
          id: '00435-financial-langchain',
          endpoint: '/api/langchain/00435/financial',
          type: 'langchain',
          tools: ['cost_calculator', 'budget_analyzer']
        },
        risk: {
          id: '00435-risk-langchain',
          endpoint: '/api/langchain/00435/risk',
          type: 'langchain',
          tools: ['risk_scorer', 'mitigation_suggester']
        }
      },
      
      // Flowise workflows
      flowise: {
        analysis: {
          id: '00435-analysis-flowise',
          endpoint: '/api/flowise/00435/analyze',
          type: 'flowise',
          workflowId: 'contracts-analysis-workflow'
        },
        review: {
          id: '00435-review-flowise',
          endpoint: '/api/flowise/00435/review',
          type: 'flowise',
          workflowId: 'contracts-review-workflow'
        }
      },
      
      // n8n automation
      n8n: {
        notifications: {
          id: '00435-notifications-n8n',
          endpoint: '/api/n8n/00435/notify',
          type: 'n8n',
          workflowId: 'contract-notifications'
        },
        reporting: {
          id: '00435-reporting-n8n',
          endpoint: '/api/n8n/00435/report',
          type: 'n8n',
          workflowId: 'contract-reporting'
        }
      }
    }
  }
};
```

## 🎯 **API Endpoints Structure**

### **LangChain Endpoints:**
```
POST /api/langchain/00435/legal
POST /api/langchain/00435/financial
POST /api/langchain/00435/risk
POST /api/langchain/00435/test
```

### **Flowise Endpoints:**
```
POST /api/flowise/00435/analyze
POST /api/flowise/00435/review
POST /api/flowise/00435/summarize
```

### **n8n Endpoints:**
```
POST /api/n8n/00435/notify
POST /api/n8n/00435/report
POST /api/n8n/00435/schedule
```

## 🎯 **Agent Development Workflow**

### **1. LangChain Development:**
```bash
# Create LangChain agent
cd server/agents/00435
touch legal-agent.py
touch financial-agent.py
touch risk-agent.py
```

### **2. Flowise Setup:**
```bash
# Import Flowise workflows
# Navigate to Flowise UI
# Create workflows for 00435 agents
# Export workflow configurations
```

### **3. n8n Setup:**
```bash
# Import n8n workflows
# Navigate to n8n UI
# Create automation workflows
# Configure triggers and actions
```

## 🎯 **Database Configuration (Multi-Tool)**

### **SQL for LangChain Agents:**
```sql
-- LangChain Legal Agent
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-001-legal-langchain', 'Legal Analysis (LangChain)',
  '@pages/00435/components/agents/legal-langchain-modal.js',
  '00435', 'Agent', '00435-legal-langchain', 'LangChain', 'Input Form', false
);

-- LangChain Financial Agent
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-002-financial-langchain', 'Financial Analysis (LangChain)',
  '@pages/00435/components/agents/financial-langchain-modal.js',
  '00435', 'Agent', '00435-financial-langchain', 'LangChain', 'Input Form', false
);

-- Flowise Analysis Workflow
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-003-flowise-analysis', 'Contract Analysis (Flowise)',
  '@pages/00435/components/agents/flowise-analysis-modal.js',
  '00435', 'Agent', '00435-flowise-analysis', 'Flowise', 'Input Form', false
);

-- n8n Notification Agent
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-00435-03-004-n8n-notifications', 'Contract Notifications (n8n)',
  '@pages/00435/components/agents/n8n-notifications-modal.js',
  '00435', 'Agent', '00435-n8n-notifications', 'n8n', 'Input Form', false
);
```

## 🎯 **Development Environment Setup**

### **1. LangChain Environment:**
```bash
# Install LangChain dependencies
pip install langchain langchain-openai langchain-community

# Create agent directory
mkdir -p server/agents/00435
touch server/agents/00435/__init__.py
touch server/agents/00435/legal_agent.py
touch server/agents/00435/financial_agent.py
touch server/agents/00435/risk_agent.py
```

### **2. Flowise Configuration:**
```bash
# Flowise workflow files
server/flowise/workflows/00435/
├── legal-review.json
├── financial-analysis.json
├── risk-assessment.json
└── test-analysis.json
```

### **3. n8n Configuration:**
```bash
# n8n workflow files
server/n8n/workflows/00435/
├── notifications.json
├── reporting.json
├── scheduling.json
└── automation.json
```

## 🎯 **Testing Strategy**

### **1. Unit Testing:**
```bash
# Test LangChain agents
python -m pytest tests/agents/00435/

# Test Flowise workflows
npm test flowise/00435/

# Test n8n workflows
npm test n8n/00435/
```

### **2. Integration Testing:**
```bash
# Test full agent pipeline
npm run test:agents:00435
```

## 🎯 **Deployment Checklist**

### **Pre-Deployment:**
- [ ] LangChain agents developed and tested
- [ ] Flowise workflows created and exported
- [ ] n8n workflows configured
- [ ] Database configurations added
- [ ] API endpoints implemented
- [ ] Modal components created

### **Deployment:**
- [ ] Deploy LangChain agents
- [ ] Import Flowise workflows
- [ ] Import n8n workflows
- [ ] Update database with configurations
- [ ] Test all agent integrations
- [ ] Validate 00435 page functionality

## 🎯 **Next Steps for 00435**

1. **Finalize 00435 structure** before rolling out to other pages
2. **Create LangChain agents** for each agent type
3. **Set up Flowise workflows** for visual processing
4. **Configure n8n automation** for notifications and reporting
5. **Test complete 00435 agent system**
6. **Document 00435 pattern** for replication to other pages

## 🎯 **Multi-Tool Benefits**

- **LangChain**: Complex reasoning and tool orchestration
- **Flowise**: Visual workflow building and debugging
- **n8n**: Powerful automation and integrations
- **Single 5-digit prefix**: Consistent naming across all tools
- **Modular**: Easy to swap tools or add new ones

The 00435 contracts post-award page is now architected to support LangChain, Flowise, and n8n agents with consistent 5-digit prefix naming before rolling out to other pages.
