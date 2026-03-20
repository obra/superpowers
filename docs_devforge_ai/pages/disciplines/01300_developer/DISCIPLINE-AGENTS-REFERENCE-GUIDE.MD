# Discipline Agents Reference Guide

**Document ID**: 0000_DISCIPLINE_AGENTS_REFERENCE_GUIDE
**Version**: 1.0
**Created**: 2026-01-29
**Status**: Reference Document

---

## Quick Reference

### Which Procedure Should You Use?

| If you need to... | Use this procedure |
|-------------------|-------------------|
| **Create discipline agents** (build the agents themselves) | `DISCIPLINE_AGENTS_IMPLEMENTATION_PLAN.md` |
| **Use discipline agents** (as assistants for agent development) | `0000_SCALED_AGENT_GENERATION_PROCEDURE.md` |
| **Understand agent types** (Deep, Swarm, JavaScript) | `0000_AGENT_TYPE_SELECTION_PROCEDURE.md` |
| **Implement workflow pages** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION_PROCEDURE.md` |
| **Set up agent service** | `0000_AGENT_SERVICE_SETUP_PROCEDURE.md` |

---

## Discipline Agents Overview

### What Are Discipline Agents?

Discipline agents are **specialized AI agents** that understand specific construction disciplines (Procurement, Logistics, Safety, Contracts, QS Measurement). They serve as **domain experts** that can assist users in developing additional agents.

### How They Assist Users in Agent Development

**1. Knowledge Extraction & Guidance**
- Discipline agents analyze existing systems (databases, pages, templates)
- They generate discipline-specific agent specifications
- They provide training data recommendations
- They validate agent designs against discipline standards
- **They help customize disciplines by adding pages, tables, and functionality**

**2. Agent Creation Support**
```
User Request → Discipline Agent → Guidance → Created Agent
    ↓              ↓              ↓             ↓
"Create QS agent" → QS Measurement Agent → "Here's how..." → QS Measurement Agent
```

**3. Discipline Customization Support**
- **Add Pages**: Create new discipline-specific UI pages
- **Add Tables**: Add database tables for new functionality
- **Add Workflows**: Define new business processes
- **Add Templates**: Create custom document templates
- **Add Chatbots**: Configure discipline-specific AI assistants

**3. Real-World Example Workflow**
```
User: "I want to create a procurement tracking agent"
↓
Procurement Specialist Agent (01900) analyzes:
- procurement_orders table structure
- procurement_templates configurations
- Supplier evaluation workflows
↓
Generates:
- Agent specification (JSON)
- Training data requirements (3000+ examples)
- LoRA adapter configuration
- Integration points
↓
User approves → Agent is trained and deployed
```

---

## The Two Key Documents

### 1. Creation Document: `DISCIPLINE_AGENTS_IMPLEMENTATION_PLAN.md`

**Purpose**: Build the discipline agents themselves

**What it creates**:
- 7 discipline-specific agents (Procurement, Logistics, Safety, 3x Contracts, QS Measurement)
- Meta-agent for orchestration
- Training infrastructure (LoRA adapters)
- Service integration
- UI components

**Key contents**:
- **Phase 1**: Specification & Knowledge Extraction
  - Modified `extract-schema-openapi.js` for discipline filtering
  - Knowledge base generation
  - Training data pipeline
  
- **Phase 2**: Agent Implementation
  - Python specialist agents (1 per discipline)
  - Meta-agent for routing and guidance
  - Training pipeline with LoRA fine-tuning
  
- **Phase 3-8**: Service, Frontend, Deployment, QA, Monitoring

**Timeline**: 6-8 weeks, 7 agents

### 2. Usage Document: `0000_SCALED_AGENT_GENERATION_PROCEDURE.md`

**Purpose**: Use discipline agents to assist in agent development

**What it describes**:
- How to query discipline agents for guidance
- How to validate agent specifications
- How to generate training data
- How to integrate with agent-generation platform

**Key contents**:
- **Agent Type Selection**: Choose between Deep/Swarm/JavaScript
- **Scaled Generation**: Process for creating many agents
- **Workflow Integration**: Using discipline agents in pages
- **Quality Assurance**: Testing discipline agent assistance

**Timeline**: Ongoing process (not a one-time implementation)

### Discipline Customization Features

Discipline agents help users **customize their disciplines** by providing guidance on:

#### **1. Adding Pages**
- Create new discipline-specific UI pages
- Define page structure and components
- Configure user permissions
- Set up navigation and breadcrumbs

**Example**: Adding a "Supplier Performance Dashboard" page to Procurement discipline

#### **2. Adding Tables**
- Design new database tables for discipline functionality
- Define columns, data types, and constraints
- Set up relationships with existing tables
- Configure RLS policies

**Example**: Adding a "supplier_performance_metrics" table to track vendor scores

#### **3. Adding Workflows**
- Define new business processes
- Set up approval workflows
- Configure decision points and routing
- Integrate with existing workflows

**Example**: Adding a "Risk Assessment Workflow" to Safety discipline

#### **4. Adding Templates**
- Create custom document templates
- Define template structure and fields
- Set up validation rules
- Configure approval flows

**Example**: Adding a "Site Safety Plan Template" to Safety discipline

#### **5. Adding Chatbots**
- Configure discipline-specific AI assistants
- Define conversation flows
- Set up integration points
- Configure model parameters

**Example**: Adding a "Supplier Inquiry Chatbot" to Procurement discipline

#### **6. Adding Forms**
- Design custom form layouts
- Define form fields and validation
- Set up data collection workflows
- Configure form persistence

**Example**: Adding a "Material Request Form" to Procurement discipline

---

## Discipline Codes & Details

| Discipline | Code | Primary Agent Type | UI/Implementation |
|------------|------|-------------------|-------------------|
| **Procurement** | 01900 | Deep Agents | ✅ By our team |
| **Logistics** | 01700 | Swarm Agents | ✅ By our team |
| **Safety** | 02400 | Deep Agents | ✅ By our team |
| **Contracts (General)** | 00400 | Swarm Agents | ✅ By our team |
| **Contracts (Pre-Award)** | 00425 | Swarm Agents | ✅ By our team |
| **Contracts (Post-Award)** | 00435 | Swarm Agents | ✅ By our team |
| **QS Measurement** | 02025 | Deep Agents | ⚠️ By another team |

**Note**: QS Measurement UI/implementation is handled by another development team. Our team handles knowledge extraction and agent service integration.

---

## How Discipline Agents Work

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Generation Platform                │
│                  (construct-ai.onrender.com/#/agent-gen)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Discipline Selector Component             │
│  (User selects: Procurement, Logistics, Safety, Contracts)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Discipline Agent Service (Port 3006)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Procurement  │  │ Logistics    │  │ Safety       │      │
│  │ Agent (01900)│  │ Agent (01700)│  │ Agent (02400)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Meta-Agent (Orchestrator)                  │  │
│  │  - Routes queries to appropriate specialist          │  │
│  │  - Generates agent creation guidance                 │  │
│  │  - Validates agent specifications                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Deep-Agents System (Python ML Agents)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ LoRA Adapter │  │ Knowledge    │  │ Training     │      │
│  │ (01900)      │  │ Base         │  │ Pipeline     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Query Flow Example

```
User: "How do I create a supplier evaluation agent?"

1. Frontend sends query to Discipline Agent Service
   POST /api/discipline/query
   Body: { query: "How do I create supplier eval agent?", discipline: "procurement" }

2. Meta-Agent routes to Procurement Specialist
   - Analyzes: "supplier evaluation" → procurement discipline

3. Procurement Specialist (01900) responds:
   {
     "agent_specification": {
       "agent_id": "supplier-evaluator",
       "type": "Deep Agent",
       "capabilities": ["vendor_analysis", "cost_comparison", "risk_assessment"]
     },
     "training_requirements": {
       "min_examples": 2500,
       "data_sources": ["vendor_data", "cost_history", "performance_metrics"]
     },
     "integration_points": ["procurement-workflow", "supplier-database"]
   }

4. Response sent back to user
5. User uses guidance to create agent via agent-generation platform
```

---

## Knowledge Extraction Strategy

### Modified `extract-schema-openapi.js`

**Original tool** extracts full database schema.

**Modified version** (in `DISCIPLINE_AGENTS_IMPLEMENTATION_PLAN.md`) adds:
- **Discipline code filtering**: `table_name LIKE '%_01900%'`
- **Relationship extraction per discipline**
- **Page/accordion filtering by discipline**
- **Chatbot prompt extraction per discipline**

**Output**:
```json
{
  "discipline": "procurement",
  "discipline_code": "01900",
  "tables": [...],
  "relationships": [...],
  "pages": [...],
  "chatbots": [...],
  "templates": [...]
}
```

### Training Data Generation

From knowledge base, generate examples:
```python
# Example training data
{
  "input": "Analyze procurement requirements for 100 steel beams",
  "output": {
    "materials_list": ["steel beams (100 units)"],
    "cost_estimate": "$45,000",
    "supplier_recommendations": ["Vendor A, Vendor B"],
    "timeline": "4-6 weeks",
    "risk_assessment": "Medium (price volatility)"
  }
}
```

---

## Integration Points

### For Agent Development (Using Discipline Agents)

1. **Select Discipline**:
   ```javascript
   // Frontend component
   <DisciplineSelector 
     onSelectDiscipline={handleSelect}
   />
   ```

2. **Request Guidance**:
   ```javascript
   // API call
   const guidance = await fetch('/api/discipline/generate-guidance', {
     body: JSON.stringify({
       discipline: "procurement",
       requirements: "supplier tracking agent"
     })
   });
   ```

3. **Validate Specification**:
   ```javascript
   const validation = await fetch('/api/discipline/validate-specification', {
     body: JSON.stringify({
       discipline: "procurement",
       specification: agentSpec
     })
   });
   ```

### For Implementation (Creating Discipline Agents)

1. **Extract Knowledge**:
   ```bash
   node extract-discipline-schema.js --discipline 01900
   ```

2. **Train LoRA Adapter**:
   ```bash
   node train-discipline-agent.js --discipline procurement --code 01900
   ```

3. **Deploy Agent**:
   ```bash
   # Via GitHub Actions
   git add deep-agents/agents/procurement-specialist-01900.py
   git commit -m "Add procurement specialist agent"
   git push origin main
   # Auto-deploys via workflow
   ```

---

## Key Differences

| Aspect | Creation Document | Usage Document |
|--------|------------------|----------------|
| **Purpose** | Build discipline agents | Use discipline agents |
| **Audience** | Developers, ML engineers | Users, agent developers |
| **Output** | 7 deployed agents | Guidance & validation |
| **Timeline** | 6-8 weeks (one-time) | Ongoing process |
| **Technical Focus** | Python, LoRA, Supabase | API calls, UI components |
| **Example Action** | "Create procurement agent" | "Get guidance for supplier eval agent" |

---

## Workflow Examples

### Example 1: User Creates a Logistics Agent

**Using Discipline Agents (from 0000_SCALED_AGENT_GENERATION_PROCEDURE.md)**:

1. User navigates to agent-generation platform
2. Selects "Logistics (01700)" from discipline selector
3. Types: "I need a truck scheduling agent"
4. Logistics Specialist Agent responds with:
   - Agent specification
   - Training data requirements (2000 examples)
   - Integration points (transport-schedules table)
5. User approves, agent is trained via LoRA
6. New agent deployed: `truck-scheduler-01700`

**Creating Logistics Agent (from DISCIPLINE_AGENTS_IMPLEMENTATION_PLAN.md)**:

1. Extract logistics tables using modified extraction script
2. Generate training data from logistics knowledge base
3. Configure LoRA adapter: `logistics-01700-config.json`
4. Train agent: `logistics-specialist-01700.py`
5. Deploy to agent service
6. Update discipline selector to include logistics option

### Example 2: QS Measurement Agent (Special Case)

**Our Team's Responsibilities**:
1. Extract QS Measurement knowledge from database
2. Prepare training data (quantity takeoff, cost estimation)
3. Train LoRA adapter: `qs-measurement-02025-config.json`
4. Deploy agent to service: `qs-measurement-specialist-02025.py`
5. Add API endpoints for QS queries
6. Monitor performance

**Another Team's Responsibilities**:
1. Implement UI for drawing measurements
2. Create OpenCV integration for image analysis
3. Connect buttons to agent service
4. Display measurement results
5. Handle drawing uploads

**Integration Point**:
```
User uploads drawing → Frontend → Agent Service → QS Measurement Agent
     ↓                ↓           ↓              ↓
  Drawing UI      POST /api/discipline/query   Returns measurements
```

---

## Quick Start for Users

### To Get Discipline Agent Guidance:

1. **Navigate to**: `construct-ai.onrender.com/#/agent-generation`
2. **Select discipline** from selector component
3. **Describe your agent** in requirements field
4. **Receive guidance** including:
   - Agent specification (JSON)
   - Training data requirements
   - Integration points
   - Validation results

### To Create an Agent with Discipline Assistance:

```
[User] → [Agent Generation Platform] → [Discipline Agent] → [Guidance]
   ↓              ↓                      ↓                    ↓
"Create agent"  Select discipline    Analyze requirements  JSON spec
                              ↓
                    [User approves] → [Training starts] → [Deploy agent]
```

---

## Technical Implementation Notes

### Discipline Agent Types

| Type | When to Use | Example |
|------|-------------|---------|
| **Deep Agents** | Complex ML processing, pattern recognition | QS Measurement, Safety risk analysis |
| **Swarm Agents** | Multi-agent coordination, workflows | Contract management, logistics coordination |
| **JavaScript Agents** | UI integration, quick responses | Frontend validation, simple queries |

### Knowledge Extraction Tools

**Existing Tool**: `docs/schema/code/extract-schema-openapi.js`
- Extracts full database schema
- Already extracts pages and accordions
- **Modified version**: Add discipline filtering

**Modified Version**: `extract-discipline-schema.js`
- Filters tables by discipline code: `table_name LIKE '%_01900%'`
- Extracts discipline-specific relationships
- Focuses on relevant data only

### Training Infrastructure

**Base Model**: Qwen/Qwen2.5-7B-Instruct
**Fine-tuning**: LoRA adapters (1 per discipline)
**Training Data**: 3000+ examples per discipline
**Training Time**: ~48 hours per discipline

---

## Reference Map

```
docs/procedures/
├── 0000_PROCEDURES_GUIDE.md                    ← Start here
├── 0000_AGENT_TYPE_SELECTION_PROCEDURE.md      ← Choose agent type
├── 0000_SCALED_AGENT_GENERATION_PROCEDURE.md   ← USE discipline agents
├── 0000_WORKFLOW_AGENT_CENTRIC_PAGE_PROCEDURE.md ← Workflow pages
├── 0000_AGENT_SERVICE_SETUP_PROCEDURE.md       ← Service setup
├── 0000_SPECIALIST_ANALYSIS_IMPROVEMENT_PROCEDURE.md ← Agent analysis
└── 0000_DISCIPLINE_AGENTS_REFERENCE_GUIDE.md   ← This document

docs/implementation/implementation-plans/
└── DISCIPLINE_AGENTS_IMPLEMENTATION_PLAN.md    ← CREATE discipline agents
```

---

## Summary

**For creating discipline agents** (to assist users in agent development):
→ Use: `DISCIPLINE_AGENTS_IMPLEMENTATION_PLAN.md`

**For using discipline agents** (to get guidance for agent development):
→ Use: `0000_SCALED_AGENT_GENERATION_PROCEDURE.md`

**For understanding agent types**:
→ Use: `0000_AGENT_TYPE_SELECTION_PROCEDURE.md`

**For setting up the infrastructure**:
→ Use: `0000_AGENT_SERVICE_SETUP_PROCEDURE.md`

---

**Document End**