# Chatbot Architecture Decision - Multi-Page Multi-Agent System

## 🎯 Architecture Decision: One Chatbot Per Page vs One Chatbot for All Pages

**Branch**: `chad-00435-contracts-post-award-test`

## 📊 Decision Matrix

| Architecture | Pros | Cons | Use Case |
|--------------|------|------|----------|
| **One Chatbot Per Page** | ✅ Specialized context<br>✅ Better performance<br>✅ Easier maintenance<br>✅ Isolated failures | ❌ More chatbots to manage<br>❌ Higher costs | **RECOMMENDED** |
| **One Chatbot for All Pages** | ✅ Simpler management<br>✅ Lower costs<br>✅ Shared context | ❌ Context confusion<br>❌ Performance issues<br>❌ Harder to maintain | Not recommended |
| **Hybrid Approach** | ✅ Balanced approach<br>✅ Grouped by domain | ❌ Complex routing | Advanced use case |

## 🎯 **RECOMMENDED: One Chatbot Per Page**

### Rationale:
1. **Context Specialization**: Each page has unique document types and workflows
2. **Performance**: Smaller, focused chatbots respond faster
3. **Maintenance**: Easier to update individual page chatbots
4. **Cost Control**: Only pay for what each page needs
5. **Isolation**: Issues in one page don't affect others

## 🎯 **Page-Based Chatbot Architecture**

### Chatbot Naming Convention:
```
[page-prefix]-[domain]-agent
```

### Examples:
- **Contracts Post-Award**: `00435-contracts-agent`
- **Email Management**: `03010-email-agent`
- **Construction**: `00300-construction-agent`
- **Finance**: `01200-finance-agent`

### Updated Chatbot Configuration:

**File**: `components/agents/chatbot-config.js` (Updated)
```javascript
export const CHATBOT_CONFIGS = {
  // Page-based chatbots
  '00435-contracts-agent': {
    id: '00435-contracts-agent',
    name: 'Contracts Post-Award Assistant',
    endpoint: '/api/agents/00435',
    description: 'Comprehensive contracts post-award analysis',
    page: '00435',
    agents: {
      test: { type: 'test', name: 'Test Analysis' },
      legal: { type: 'legal', name: 'Legal Review' },
      financial: { type: 'financial', name: 'Financial Analysis' },
      risk: { type: 'risk', name: 'Risk Assessment' }
    }
  },
  
  '03010-email-agent': {
    id: '03010-email-agent',
    name: 'Email Management Assistant',
    endpoint: '/api/agents/03010',
    description: 'Email processing and management',
    page: '03010',
    agents: {
      categorize: { type: 'categorize', name: 'Email Categorization' },
      respond: { type: 'respond', name: 'Auto Response' },
      archive: { type: 'archive', name: 'Archive Management' }
    }
  },
  
  '00300-construction-agent': {
    id: '00300-construction-agent',
    name: 'Construction Project Assistant',
    endpoint: '/api/agents/00300',
    description: 'Construction project management',
    page: '00300',
    agents: {
      progress: { type: 'progress', name: 'Progress Tracking' },
      safety: { type: 'safety', name: 'Safety Analysis' },
      quality: { type: 'quality', name: 'Quality Control' }
    }
  }
};
```

## 🎯 **Agent Routing Within Page Chatbots**

### Single Endpoint per Page:
```javascript
// One endpoint handles all agents for a page
POST /api/agents/00435
Body: {
  agentType: 'legal|financial|risk|test',
  action: 'analyze|review|assess',
  contractData: {...},
  context: {...}
}
```

### Page-Specific Context:
```javascript
// Each page chatbot knows its domain
const pageContext = {
  '00435': 'contracts-post-award',
  '03010': 'email-management',
  '00300': 'construction'
};
```

## 🎯 **Database Configuration Strategy**

### SQL Template for Any Page:
```sql
-- Template for adding agents to any page
INSERT INTO public.modal_configurations (
  modal_key, display_name, component_path, target_page_prefix, target_state,
  chatbot_id, integration_type, interaction_style, is_legacy
) VALUES (
  'A-[page-prefix]-03-[sequence]-[agent-type]', '[Agent Name]',
  '@pages/[page-prefix]/components/agents/[agent-type]-modal.js',
  '[page-prefix]', 'Agent', '[page-prefix]-[domain]-agent', 'Flowise', 'Input Form', false
);
```

### Examples for Different Pages:
```sql
-- Email Management Agents
'A-03010-03-001-email-categorize', 'Email Categorization', '@pages/03010/components/agents/categorize-modal.js', '03010', 'Agent', '03010-email-agent', 'Flowise', 'Input Form', false
'A-03010-03-002-email-respond', 'Auto Response', '@pages/03010/components/agents/respond-modal.js', '03010', 'Agent', '03010-email-agent', 'Flowise', 'Input Form', false

-- Construction Agents
'A-00300-03-001-construction-progress', 'Progress Tracking', '@pages/00300/components/agents/progress-modal.js', '00300', 'Agent', '00300-construction-agent', 'Flowise', 'Input Form', false
'A-00300-03-002-construction-safety', 'Safety Analysis', '@pages/00300/components/agents/safety-modal.js', '00300', 'Agent', '00300-construction-agent', 'Flowise', 'Input Form', false
```

## 🎯 **Implementation Benefits**

### 1. **Scalability**
- Add new pages without affecting existing chatbots
- Each page can have unlimited agents
- Easy to onboard new contributors

### 2. **Performance**
- Smaller chatbot contexts per page
- Faster response times
- Reduced memory usage

### 3. **Maintenance**
- Update individual page chatbots independently
- Easier debugging and troubleshooting
- Clear separation of concerns

### 4. **Cost Control**
- Pay only for active page chatbots
- Scale based on page usage
- Optimize per-page configurations

## 🎯 **Migration Strategy**

### Phase 1: Page-Based Setup
1. **Create page-specific chatbots** in Flowise
2. **Update chatbot-config.js** with page-based structure
3. **Configure database** with page-specific agents
4. **Test on single page** (contracts post-award)

### Phase 2: Multi-Page Rollout
1. **Replicate pattern** to other pages
2. **Create page-specific agent components**
3. **Update modal configurations** for each page
4. **Test integration** across all pages

## 🎯 **Decision Summary**

**✅ CHOSEN: One Chatbot Per Page**

**Reasons:**
- **Context Accuracy**: Each page has unique document types
- **Performance**: Smaller, focused chatbots
- **Scalability**: Easy to add new pages
- **Maintenance**: Isolated updates
- **Cost**: Pay-per-page usage

**Implementation:**
- Each page gets its own chatbot ID: `[page-prefix]-[domain]-agent`
- All agents on a page share the same chatbot endpoint
- Agent type is passed as parameter to route within the chatbot
- Database configuration uses page-specific modal keys

This architecture provides the best balance of performance, maintainability, and scalability for your multi-page, multi-agent system.
