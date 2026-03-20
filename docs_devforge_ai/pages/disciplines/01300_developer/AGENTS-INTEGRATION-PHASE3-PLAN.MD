# Agents Integration - Phase 3 Planning

**Planning Date:** January 29, 2026  
**Status:** Planning Phase  
**Phase:** 3 of 4 (Agents Integration)

---

## Phase 3 Overview

Phase 3 focuses on **Agents Integration** - connecting the development console to the existing agent-generation platform and implementing a meta-agent for intelligent routing between workflows, skills, and agents.

### Objective
Create a seamless integration between:
1. **Development Console** (Workflows, Skills, Agents tabs)
2. **Agent Generation Platform** (Existing system with 6 discipline agents)
3. **Meta-Agent** (Intelligent routing and coordination)

### Key Features
- **Agent Discovery** - List available agents with capabilities
- **Agent Querying** - Send queries to specific agents
- **Meta-Agent Routing** - Route requests to appropriate agent
- **Execution Tracking** - Track agent executions alongside workflows/skills
- **RBAC Support** - Respect agent permissions
- **History Integration** - Unified execution history

---

## Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Console                       │
│  (Workflows | Skills | Agents)                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Main Application Server                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Skills Tab (Phase 2)                                │  │
│  │  • Skills Routes                                     │  │
│  │  • Skills RBAC                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  New: Agents Routes                                  │  │
│  │  • Agent Discovery                                   │  │
│  │  • Agent Querying                                    │  │
│  │  • Meta-Agent Router                                 │  │
│  │  • Execution Tracking                                │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Existing: Agent Generation Platform                 │  │
│  │  • 6 Discipline Agents                               │  │
│  │  • Training data loaded                              │  │
│  │  • Already deployed                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Agent Types

**1. Discipline-Specific Agents**
- Agent for each discipline (6 agents)
- Pre-trained with discipline-specific data
- Located at `/#/agent-generation/{discipline-code}`
- Examples:
  - Procurement Agent (01900)
  - Safety Agent (02400)
  - Logistics Agent (01700)
  - Contracts Agent (00400, 00425, 00435)

**2. Meta-Agent (New)**
- Routes requests to appropriate discipline agent
- Analyzes query context to determine best agent
- Can coordinate between multiple agents
- Provides unified response

**3. Utility Agents (Existing)**
- Chat agents
- Document analysis agents
- Already exist in agent-generation platform

---

## Feature Implementation Plan

### 1. Agent Discovery System

**Purpose:** List all available agents with their capabilities

**Features:**
- Agent catalog with metadata
- Filter by discipline, capability, or access level
- Search by keyword
- Show agent statistics (usage, success rate)

**Database Schema:**
```sql
CREATE TABLE agent_metadata (
  agent_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discipline_code VARCHAR(10),
  category VARCHAR(100),
  access_level VARCHAR(50) DEFAULT 'all',
  scope VARCHAR(50) DEFAULT 'discipline-specific',
  allowed_disciplines JSONB DEFAULT '["all"]',
  required_role VARCHAR(50) DEFAULT 'all',
  model_type VARCHAR(100),
  training_data_status VARCHAR(50),
  last_active TIMESTAMP,
  success_rate DECIMAL(5,2),
  estimated_duration INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexing:**
```sql
CREATE INDEX idx_agent_discipline ON agent_metadata(discipline_code);
CREATE INDEX idx_agent_category ON agent_metadata(category);
CREATE INDEX idx_agent_access ON agent_metadata(access_level);
CREATE INDEX idx_agent_scope ON agent_metadata(scope);
```

**Sample Data:**
- 6 discipline agents (from existing system)
- Meta-agent (new)
- 2-3 utility agents (existing)

### 2. Agent Querying System

**Purpose:** Execute queries against specific agents

**Endpoints:**
- `GET /api/agents` - List agents (filtered)
- `GET /api/agents/:agentId` - Get agent details
- `GET /api/agents/:agentId/capabilities` - Get agent capabilities
- `POST /api/agents/:agentId/query` - Send query to agent
- `GET /api/agents/executions/:id/status` - Get execution status
- `GET /api/agents/executions/history` - Get execution history
- `DELETE /api/agents/executions/:id` - Cancel execution

**Query Flow:**
```
User Query
    ↓
Frontend sends to /api/agents/{agentId}/query
    ↓
Backend validates permissions
    ↓
Route to Agent Generation Platform API
    ↓
Agent processes query
    ↓
Return response with metadata
    ↓
Store in execution table
```

**Agent Platform Integration:**
- Connect to existing Agent Generation Platform
- Use existing API endpoints
- Forward authentication tokens
- Handle rate limiting and errors

### 3. Meta-Agent Router

**Purpose:** Intelligently route queries to appropriate agent

**Features:**
- **Intent Analysis** - Analyze query to determine needed agent
- **Discipline Detection** - Extract discipline context from query
- **Capability Matching** - Match query to agent capabilities
- **Fallback Routing** - Handle ambiguous queries
- **Multi-Agent Coordination** - Coordinate queries across multiple agents

**Implementation:**
```javascript
class MetaAgentRouter {
  async routeQuery(query, context) {
    // 1. Analyze intent
    const intent = await this.analyzeIntent(query);
    
    // 2. Determine discipline
    const discipline = this.extractDiscipline(query);
    
    // 3. Find matching agent(s)
    const agents = await this.findMatchingAgents(intent, discipline);
    
    // 4. If multiple agents, use meta-agent to coordinate
    if (agents.length > 1) {
      return await this.coordinateMultipleAgents(query, agents);
    }
    
    // 5. Route to single agent
    return await this.routeToAgent(query, agents[0]);
  }
}
```

**Endpoint:**
- `POST /api/agents/router/query` - Meta-agent routing

### 4. Execution Tracking System

**Purpose:** Track agent executions alongside workflows and skills

**Schema:** Use existing `workflow_executions` table
- Add execution_type = 'agent'
- Track agent_id, query, response, duration

**History View:** Extend existing history to include agents

**Integration:**
- Unified history across workflows, skills, and agents
- Filter by execution type
- Combined analytics

### 5. AgentsTab UI Component

**Purpose:** Display and interact with agents

**Features:**
- Agent cards with metadata
- Agent discovery and search
- Query interface with chat-like UI
- Real-time response display
- Execution history for agents
- Meta-agent routing interface

**Components:**
- `AgentsTab.js` - Main component
- `AgentCard.js` - Individual agent display
- `AgentQueryModal.js` - Query interface
- `AgentHistoryModal.js` - Execution history

**State Management:**
- Agent list state
- Query state
- Execution tracking state
- History state

### 6. Agent Authorization Middleware

**Purpose:** RBAC for agent access

**Access Rules:**
| Role | Can Access | Can Query | Can View History |
|------|------------|-----------|------------------|
| Developer | All agents | All agents | All executions |
| Discipline User | Discipline-specific agents | Allowed agents | Own executions |
| Other | None | None | None |

**Features:**
- Agent permission checking
- Query validation
- Rate limiting
- Audit logging

### 7. Integration with Existing System

**Agent Generation Platform:**
- Base URL: `/#/agent-generation/{discipline}`
- API endpoints (if available)
- Authentication requirements

**Agent Types Available:**
- 6 Discipline agents (already trained)
- Existing chat agents
- Document analysis agents
- Page-specific agents

**Deployment:**
- No new deployment needed for existing agents
- Only need to create integration layer
- Meta-agent can be new or existing component

---

## Implementation Timeline

### Week 1: Foundation (Days 1-7)
- **Day 1-2:** Database schema and metadata seeding
- **Day 3-4:** Backend API endpoints (discovery, querying)
- **Day 5-6:** Agent platform integration
- **Day 7:** Authorization middleware

### Week 2: Meta-Agent & UI (Days 8-14)
- **Day 8-9:** Meta-agent router implementation
- **Day 10-11:** AgentsTab UI component
- **Day 12:** Query interface and chat UI
- **Day 13:** Execution tracking integration
- **Day 14:** History modal and filtering

### Week 3: Testing & Polish (Days 15-21)
- **Day 15-16:** Unit tests
- **Day 17-18:** Integration tests
- **Day 19:** Performance testing
- **Day 20-21:** User acceptance testing, bug fixes

**Total:** 3 weeks (21 days) for full implementation

---

## Files to Create/Modify

### Backend

| File | Type | Purpose |
|------|------|---------|
| `server/src/routes/agents-routes.js` | New | 7 RESTful API endpoints |
| `server/src/middleware/agentAuthMiddleware.js` | New | RBAC middleware for agents |
| `server/src/routes/agents-router.js` | New | Meta-agent routing logic |
| `server/scripts/initialize-agent-metadata.js` | New | Seed agent metadata |
| `server/src/routes/app.js` | Modify | Register agents routes |
| `database/migrations/add_agent_tables.sql` | New | Agent metadata table |

### Frontend

| File | Type | Purpose |
|------|------|---------|
| `client/src/pages/02050-development-console/components/tabs/AgentsTab.js` | New | Main agents UI |
| `client/src/pages/02050-development-console/components/tabs/AgentCard.js` | New | Agent card component |
| `client/src/pages/02050-development-console/components/tabs/AgentQueryModal.js` | New | Query interface |
| `client/src/pages/02050-development-console/components/tabs/AgentHistoryModal.js` | New | History component |
| `client/src/pages/02050-development-console/components/tabs/AgentsTab-index.js` | New | Component index |
| `client/src/services/agentExecutionService.js` | New | Agent execution service |
| `client/src/hooks/useAgentStateManager.js` | New | Agent state management |
| `client/src/pages/02050-development-console/components/02050-development-console-page.js` | Modify | Add Agents tab |

### Skills Directory

| File | Type | Purpose |
|------|------|---------|
| `.clinerules/agents/README.md` | New | Agents directory documentation |

### Documentation

| File | Type | Purpose |
|------|------|---------|
| `docs/implementation/implementation-plans/agents-integration-phase3-summary.md` | New | Phase 3 summary |

**Total Files:** 17 (10 backend, 6 frontend, 1 docs)

---

## Technical Requirements

### Backend Requirements

**Agent Platform Integration:**
- Base URL configuration
- API client for agent platform
- Error handling and fallbacks
- Rate limiting (if needed)

**Database:**
- New `agent_metadata` table
- Migration script
- Sample data for 6+ agents

**Authentication:**
- Token forwarding to agent platform
- Agent-specific authentication if needed
- JWT validation

**Caching:**
- Agent metadata caching (optional)
- Query result caching (optional)

### Frontend Requirements

**UI Components:**
- React components with MUI
- Responsive design
- Loading states
- Error handling

**State Management:**
- Agent list state
- Query state
- Execution tracking
- History state

**API Integration:**
- RESTful API calls
- WebSocket for real-time updates (optional)
- Polling for execution status

### Agent Platform Requirements

**Existing Capabilities:**
- 6 discipline agents already deployed
- Training data loaded
- API endpoints available
- Authentication system

**Integration Points:**
- Query endpoint
- Status endpoint
- History endpoint
- Agent discovery endpoint

---

## Testing Strategy

### Unit Tests
- Agent metadata validation
- Authorization middleware
- Meta-agent routing logic
- API endpoint handlers

### Integration Tests
- Complete agent query flow
- Meta-agent routing
- Execution tracking
- History retrieval
- RBAC enforcement

### User Acceptance Tests
- Agent discovery workflow
- Query execution workflow
- Meta-agent routing accuracy
- History viewing
- Error handling

### Performance Tests
- Agent query response times
- Meta-agent routing speed
- Concurrent user handling
- Database query performance

---

## Success Criteria - Phase 3

### Core Requirements
- [ ] Agent discovery system with 6+ agents
- [ ] Agent querying API endpoints
- [ ] Meta-agent routing implementation
- [ ] Execution tracking integration
- [ ] AgentsTab UI with full functionality
- [ ] RBAC enforcement for agents
- [ ] Unified history across all execution types

### Quality Metrics
- [ ] 90%+ agent query success rate
- [ ] < 2 second routing time for meta-agent
- [ ] No security vulnerabilities in agent access
- [ ] Comprehensive error handling
- [ ] Clear user feedback for all operations

### Documentation
- [ ] API documentation complete
- [ ] User guide for AgentsTab
- [ ] Integration guide for agent platform
- [ ] Testing documentation

---

## Risks & Mitigation

### Risk 1: Agent Platform API Changes
**Impact:** High - Integration breaks  
**Mitigation:** 
- Use stable API endpoints
- Implement fallback mechanisms
- Version pinning

### Risk 2: Meta-Agent Accuracy
**Impact:** Medium - Poor routing decisions  
**Mitigation:**
- Start with simple routing rules
- Use training data to improve
- Add manual override capability

### Risk 3: Performance Issues
**Impact:** Medium - Slow agent queries  
**Mitigation:**
- Implement caching
- Optimize database queries
- Use async processing

### Risk 4: RBAC Complexity
**Impact:** Medium - Permission issues  
**Mitigation:**
- Reuse existing workflow/skill RBAC patterns
- Comprehensive testing
- Clear permission documentation

---

## Dependencies

### Phase 2 Completion (Required)
- Skills system fully operational
- RBAC patterns established
- Execution tracking implemented

### Agent Platform (Required)
- 6 discipline agents deployed
- API endpoints available
- Authentication system working

### Infrastructure (Optional)
- WebSocket server for real-time updates
- Caching layer (Redis)
- Job queue system for heavy operations

---

## Cost Estimation

### Development Time
- **Backend:** 6-7 days
- **Frontend:** 5-6 days
- **Testing:** 3-4 days
- **Documentation:** 1-2 days
- **Total:** 15-19 days

### Resource Requirements
- **Developer:** 1-2 (full-time)
- **QA Tester:** 1 (part-time)
- **DevOps:** 1 (minimal)

### Infrastructure Costs
- **Server:** No additional (reuse existing)
- **Database:** Minimal additional storage
- **Agent Platform:** Already deployed (no cost)

### Total Phase 3 Cost
- **Development:** $20,000 - $25,000 (estimate)
- **Timeline:** 3 weeks

---

## Next Steps After Phase 3

### Phase 4: Integration & Polish
Once Phase 3 is stable:
1. **Cross-component integration**
   - Connect Workflows, Skills, and Agents
   - Unified navigation
   - Shared state management

2. **Testing & Bug Fixes**
   - Comprehensive testing across all phases
   - Bug fixing and optimization
   - Performance improvements

3. **Documentation & Training**
   - Complete user documentation
   - Admin documentation
   - Training materials

4. **Deployment & Rollout**
   - Staging deployment
   - User acceptance testing
   - Production deployment
   - Monitoring and support

**Phase 4 Timeline:** 1-2 weeks

### Overall Project Completion
- **Phase 1 (Workflows):** Complete
- **Phase 2 (Skills):** Complete
- **Phase 3 (Agents):** 3 weeks
- **Phase 4 (Integration):** 1-2 weeks
- **Total Remaining:** 4-5 weeks

---

## Implementation Checklist

### Phase 3 Start
- [ ] Review Phase 2 completion
- [ ] Set up development environment
- [ ] Create project board
- [ ] Define user stories

### Database
- [ ] Create agent_metadata table
- [ ] Add indexes
- [ ] Insert sample agent data (6+ agents)
- [ ] Add execution type column to workflow_executions

### Backend
- [ ] Create agents-routes.js
- [ ] Create agentAuthMiddleware.js
- [ ] Create agents-router.js (meta-agent)
- [ ] Implement agent discovery
- [ ] Implement agent querying
- [ ] Implement meta-agent routing
- [ ] Integrate with agent platform
- [ ] Add execution tracking
- [ ] Add RBAC support
- [ ] Add audit logging

### Frontend
- [ ] Create AgentsTab.js
- [ ] Create AgentCard.js
- [ ] Create AgentQueryModal.js
- [ ] Create AgentHistoryModal.js
- [ ] Create AgentsTab-index.js
- [ ] Create agentExecutionService.js
- [ ] Create useAgentStateManager.js
- [ ] Update development console page
- [ ] Add navigation integration

### Testing
- [ ] Unit tests for all components
- [ ] Integration tests
- [ ] Performance tests
- [ ] User acceptance tests
- [ ] Security tests

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Integration guide
- [ ] Testing documentation
- [ ] Phase 3 summary

### Deployment
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Rollback plan

---

## Phase 3 Summary

**Goal:** Integrate existing agent-generation platform with development console, implement meta-agent for intelligent routing, and provide seamless agent discovery and querying.

**Key Deliverables:**
- Agent metadata system with 6+ agents
- Agent querying API with RBAC
- Meta-agent routing system
- AgentsTab UI with full functionality
- Unified execution history
- Complete testing and documentation

**Timeline:** 3 weeks (15-19 development days)

**Success Metrics:**
- Agent discovery with 100% coverage
- Query success rate > 90%
- Meta-agent routing accuracy > 85%
- User satisfaction > 4.5/5
- No security vulnerabilities

---

**Document Status:** Planning Complete  
**Last Updated:** January 29, 2026  
**Version:** 1.0  
**Next Action:** Begin Phase 3 Implementation