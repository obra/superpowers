# Discipline Agents Implementation Plan

**Document ID**: DISCIPLINE_AGENTS_IMPLEMENTATION_PLAN
**Version**: 1.0
**Created**: 2026-01-29
**Last Updated**: 2026-01-29
**Author**: AI Assistant (Construct AI)
**Status**: Ready for Implementation

---

## Executive Summary

This implementation plan creates six discipline-specific AI agents for the Construct AI system, designed to assist users in developing agents via the construct-ai.onrender.com/#/agent-generation platform. These agents will serve as domain experts, providing deep knowledge of their respective disciplines and guiding users in creating additional specialized agents.

**Target Disciplines**:
1. **Procurement (01900)** - Procurement specialists and supply chain
2. **Logistics (01700)** - Logistics management and coordination
3. **Safety (02400)** - Safety specialists and HSE compliance
4. **Contracts (00400)** - General contract management
5. **Contracts (Pre-Award) (00425)** - Pre-award contract lifecycle management
6. **Contracts (Post-Award) (00435)** - Post-award contract management
7. **QS Measurement (02025)** - Quantity Surveying measurement and cost estimation

**Key Benefits**:
- **Domain Expertise**: Agents understand discipline-specific code, structure, and purpose
- **Agent Development Assistance**: Users can query agents for guidance on creating additional agents
- **Training Data**: Each agent has access to discipline-specific training materials
- **Integration**: Seamless integration with existing agent-generation platform

**Estimated Effort**: 2-3 weeks for 7 discipline agents (leveraging existing training data)
**Total Duration**: 2-3 weeks (can be done by 1-2 people in dev mode)
**Resources Required**: 1-2 developers (full-stack capable) + AI/ML knowledge
**Dev Mode**: Designed for small team or individual execution with automated tools

**Note on Existing Infrastructure**: The repository already contains significant deep-agent infrastructure:

**Already Implemented Agents:**
- ✅ **Procurement (01900)**: 6-agent pipeline in `deep-agents/deep_agents/agents/pages/01900-procurement/`
- ✅ **Contracts Post-Award (00435)**: Multi-agent system in `deep-agents/deep_agents/agents/pages/00435-contracts_post_award/`
- ✅ **Quantity Surveying (02025)**: Simulation tools in `deep-agents/deep_agents/agents/pages/02025_quantity_surveying/`
- ✅ **Shared Specialist Agents**: Domain-specific agents for engineering disciplines
- ✅ **Core Framework**: BaseAgent, orchestrators, state management, caching systems

**Client Services:** `client/src/services/agents/` - Agent orchestration, vector agents, monitoring, workflow tools

**Training Data:** `models/training-data/` - **ALL 6 discipline agents have existing training data!**
- ✅ Procurement: 100 examples (0.85-0.94 quality)
- ✅ Logistics: 100 examples (0.85-0.94 quality)
- ✅ Safety: 100 examples (0.85-0.94 quality)
- ✅ Contracts: 100 examples (0.85-0.94 quality)
- ✅ Contracts Pre-Award: 100 examples (0.85-0.94 quality)
- ✅ Contracts Post-Award: 100 examples (0.85-0.94 quality)

**Our task is to**: 
1. **Deploy missing discipline agents** (Logistics 01700, Safety 02400, Contracts 00400, Contracts 00425)
2. **Leverage existing training data** (no data collection needed!)
3. **Integrate with agent-generation platform** (existing infrastructure)

---

## Scope and Objectives

### In Scope
- **Agent Creation**: 7 discipline-specific specialist agents (6 + QS Measurement)
- **Deep-Agents Integration**: Integration with existing deep-agents architecture
- **Training Data**: Discipline-specific training materials and datasets
- **Training System**: LoRA fine-tuning for each discipline agent
- **Agent Service**: Deployment and management of specialized agents
- **Index Generation**: Deep-agent index for discovery and management
- **GitHub Workflow**: Automated deployment and version control
- **Monitoring**: Performance tracking and quality assurance
- **QS Measurement Knowledge**: Knowledge extraction and data preparation for QS measurement (UI/implementation by another team)

### Out of Scope (Future Phases)
- Advanced UI customizations beyond basic agent interaction
- Real-time collaboration features between agents
- Multi-agent orchestration workflows
- External API integrations beyond existing stack
- Advanced workflow automation

### Success Criteria
- [ ] All 6 discipline agents operational
- [ ] Agents accessible via construct-ai.onrender.com/#/agent-generation
- [ ] Discipline-specific knowledge validated
- [ ] Training system functional with LoRA fine-tuning
- [ ] GitHub deployment workflow operational
- [ ] Deep-agent index loads at startup
- [ ] Performance benchmarks met (< 2s response time)
- [ ] Quality validation passes (> 90% accuracy)

---

## Current System Analysis

### Existing Infrastructure
- **Deep-Agents Architecture**: `deep-agents/deep_agents/` directory with Python ML agents
  - **Procurement (01900)**: 6-agent pipeline already implemented (template analysis, requirement extraction, compliance validation, field population, quality assurance, final review)
  - **Contracts Post-Award (00435)**: Multi-agent system implemented (correspondence, variation, approval agents)
  - **Quantity Surveying (02025)**: Simulation tools and workflows
  - **Shared Specialist Agents**: Domain-specific agents for engineering disciplines
  - **Core Framework**: BaseAgent, orchestrators, state management, caching systems
- **Client Services**: `client/src/services/agents/` directory with agent orchestration
  - Discipline-specific analyzers (procurement, contracts-post-award)
  - Vector agents for data processing
  - Agent factory and monitoring
  - Workflow optimization tools
- **Agent Generation Platform**: construct-ai.onrender.com/#/agent-generation
- **Database Tables**: agent_roles, agents_tracking, chatbots, continual_learning_data
- **Agent Service**: Agent service on port 3006
- **GitHub Integration**: Existing workflow for deployments

### Discipline-Specific References
- **Procurement (01900)**: PROCUREMENT_WORKFLOW_AGENT_PROMPTS_INVENTORY_AND_DEVELOPER_TOOLS_IMPLEMENTATION_WITH_MAGIC_WAND.md
- **Logistics (02400)**: 02400_CONTRACTOR_VETTING_WORKFLOW_INTEGRATION_PLAN.md
- **Contracts (00400/00425/00435)**: Contract workflow documentation
- **Safety (02400)**: HSE and safety specialist documentation

### Technical Stack
- **Frontend**: React, Template A styling (construct-ai.onrender.com)
- **Backend**: Supabase (agent tables), Node.js APIs
- **AI/ML**: HuggingFace models, LoRA adapters
- **Deep-Agents**: Python-based specialist agents
- **Agent Service**: Node.js service on port 3006
- **Training**: Qwen/Qwen2.5-7B-Instruct with LoRA

---

## Detailed Implementation Plan

### Procedure Knowledge Base for Discipline Agents

Discipline agents will be aware of and reference relevant procedures from `/Users/Discipline_agents/construct_ai/docs/procedures/`. This enables them to provide guidance that includes applicable procedures for each discipline.

#### **Procedure Mapping by Discipline**

| Discipline | Applicable Procedures | Primary Usage |
|------------|----------------------|---------------|
| **Procurement (01900)** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md`<br>`0000_DISCIPLINE_COPY_LOGGING_PROCEDURE.md`<br>`0000_DROPDOWN_IMPLEMENTATION_PROCEDURE.md`<br>`0000_JAVASCRIPT_DATA_POPULATION_PROCEDURE.md`<br>`0000_SQL_EXECUTION_PROCEDURE.md` | Workflow pages, discipline copying, data population, SQL operations |
| **Logistics (01700)** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md`<br>`0000_AGENT_SIMULATION_PROCEDURE.md`<br>`0000_TABLE_VECTOR_STORE_POPULATION.md`<br>`0000_VECTOR_ISOLATION_SECURITY_PROCEDURE.md` | Workflow pages, agent simulation, vector data, security |
| **Safety (02400)** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md`<br>`0000_PRIVACY_PROCEDURE.md`<br>`0000_ENGINEERING_DRAWINGS_STORAGE_PROCEDURE.md`<br>`0000_WORKFLOW_HITL_PROCEDURE.md` | Workflow pages, privacy compliance, document storage, human oversight |
| **Contracts (00400)** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md`<br>`0000_WORKFLOW_DOCUMENTATION_PROCEDURE.md`<br>`0000_WORKFLOW_IMPLEMENTATION_PROCEDURE.md`<br>`0000_API_KEY_SECURITY_MIGRATION_PROCEDURE.md` | Workflow documentation, implementation, API security |
| **Contracts (00425)** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md`<br>`0000_WORKFLOW_TEMPLATE_FIELD_ATTRIBUTE_IMPLEMENTATION_PROCEDURE.md`<br>`0000_QWEN_FINETUNING_PROCEDURE.md` | Template fields, AI fine-tuning, workflow configuration |
| **Contracts (00435)** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md`<br>`0000_ROLES_AGENT_IMPLEMENTATION_PROCEDURE.md`<br>`0000_ROLES_DEPARTMENT_USER_IMPLEMENTATION_PROCEDURE.md`<br>`0000_TABLE_POLICIES_SECURITY_PROCEDURE.md` | Agent roles, department roles, table security policies |
| **QS Measurement (02025)** | `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md`<br>`0000_ENGINEERING_DRAWINGS_STORAGE_PROCEDURE.md`<br>`0000_QWEN_FINETUNING_PROCEDURE.md`<br>`0000_LORA_ADAPTER_INTEGRATION_PROCEDURE.md` | Engineering drawings, AI fine-tuning, LoRA integration |

#### **Agent Knowledge Extraction Strategy**

Based on the procedures guide, discipline agents will:

1. **Reference Relevant Procedures**:
   - Extract applicable procedures from `/Users/Discipline_agents/construct_ai/docs/procedures/`
   - Categorize procedures by discipline and function
   - Link procedures to specific agent capabilities

2. **Provide Procedure-Aware Guidance**:
   ```
   User: "Create procurement tracking agent"
   ↓
   Procurement Agent responds:
   - Agent specification (JSON)
   - Training requirements
   - **Relevant Procedures**:
     * 0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION.md
       → For creating procurement workflow page
     * 0000_DISCIPLINE_COPY_LOGGING_PROCEDURE.md
       → For template creation discipline selection
     * 0000_DROPDOWN_IMPLEMENTATION_PROCEDURE.md
       → For adding discipline selection dropdowns
     * 0000_JAVASCRIPT_DATA_POPULATION_PROCEDURE.md
       → For populating procurement data
     * 0000_SQL_EXECUTION_PROCEDURE.md
       → For database operations
   ```

3. **Integration with Implementation Plan**:
   - Each phase includes relevant procedure references
   - Knowledge extraction includes procedure discovery
   - Training data includes procedure examples

### Agent Type Selection for Each Discipline

Based on the **0000_AGENT_TYPE_SELECTION_PROCEDURE.md** and your specific requirements, here's the optimal agent type selection:

| Discipline | Primary Agent Type | Secondary Support | Rationale |
|------------|-------------------|-------------------|-----------|
| **Procurement (01900)** | Deep Agents | JavaScript Agents | Complex ML processing for supplier evaluation, cost prediction, and document analysis |
| **Logistics (01700)** | Swarm Agents | JavaScript Agents | Multi-agent coordination for transport planning, risk assessment, and compliance tracking |
| **Safety (02400)** | Deep Agents | JavaScript Agents | Advanced AI for hazard identification, risk modeling, and compliance verification |
| **Contracts (00400)** | Swarm Agents | JavaScript Agents | Multi-agent workflow for delivery tracking, milestone verification, and contract management |
| **Contracts (Pre-Award) (00425)** | Swarm Agents | JavaScript Agents | Coordinated lifecycle management with approval workflows and compliance tracking |
| **Contracts (Post-Award) (00435)** | Swarm Agents | JavaScript Agents | Multi-agent oversight for administration, audits, and dispute resolution |
| **QS Measurement (02025)** | Deep Agents | JavaScript Agents | Complex ML processing for quantity takeoff, cost estimation, and measurement analysis |

**Note**: QS (Quantity Surveying) measurement UI/implementation is handled by another development team. Our team will extract and prepare knowledge data for the QS measurement agent.

### Knowledge Extraction Strategy

Based on existing schema extraction tools, discipline-specific knowledge can be extracted from:

#### **1. Database Schema & Table Structures**
- **Source**: `/Users/Discipline_agents/construct_ai/docs/schema/code/extract-schema-openapi.js`
- **Current Output**: `docs/schema/reports/0300_DATABASE_SCHEMA_MASTER_GUIDE.md`
- **Discipline Extraction**: Modified to filter tables by discipline code and analyze relationships
- **Knowledge Gained**:
  - Table schemas per discipline
  - Foreign key relationships
  - RLS policies for data access
  - Indexes and performance patterns
  - Constraint validation rules

#### **2. Page & UI Structure**
- **Source**: `docs/schema/code/extract-schema-openapi.js` (already extracts pages)
- **Current Output**: `docs/schema/reports/index-discipline-pages.md`
- **Knowledge Gained**:
  - Discipline-specific page configurations
  - UI components and layouts
  - User permission structures
  - Navigation patterns

#### **3. Accordion Mappings**
- **Source**: `docs/schema/code/extract-schema-openapi.js` (already extracts accordion)
- **Current Output**: `docs/schema/reports/index-accordion.md`
- **Knowledge Gained**:
  - Navigation hierarchy per discipline
  - Section/subsection organization
  - Page relationships and flow

#### **4. Chatbot Configurations**
- **Source**: `docs/schema/code/extract-chatbots.js`
- **Current Output**: `docs/schema/reports/index-chatbots.md`
- **Knowledge Gained**:
  - Chatbot prompts per discipline
  - AI service configurations
  - Conversation flows
  - Integration points

#### **5. Template Configurations**
- **Source**: Direct database queries on template tables
- **Knowledge Gained**:
  - Discipline-specific templates
  - Template variations
  - Approval workflows
  - Validation rules

### Phase 1: Discipline Agent Specification and Training Data (Week 1)

#### Step 1.1: Discipline Assessment and Agent Specification
**Objective**: Define each discipline agent's capabilities, scope, and training requirements.

**Files Created**:
- `deep-agents/discipline-specifications/procurement-01900-spec.json`
- `deep-agents/discipline-specifications/logistics-02400-spec.json`
- `deep-agents/discipline-specifications/safety-02400-spec.json`
- `deep-agents/discipline-specifications/contracts-00400-spec.json`
- `deep-agents/discipline-specifications/contracts-00425-spec.json`
- `deep-agents/discipline-specifications/contracts-00435-spec.json`
- `deep-agents/discipline-specifications/qs-measurement-00450-spec.json`

**Specification Format**:
```json
{
  "agent_id": "procurement-specialist-01900",
  "discipline": "procurement",
  "discipline_code": "01900",
  "agent_type": "specialist",
  "description": "Procurement and supply chain specialist for construction projects",
  "capabilities": [
    "Procurement workflow analysis",
    "Supplier evaluation and selection",
    "Purchase order generation and management",
    "Cost estimation and budgeting",
    "Contract compliance verification",
    "Inventory and supply chain optimization"
  ],
  "knowledge_domains": [
    "procurement_templates",
    "vendor_management",
    "cost_engineering",
    "supply_chain_logistics",
    "contract_compliance"
  ],
  "training_requirements": {
    "data_sources": ["procurement_orders", "procurement_templates", "vendor_data"],
    "min_examples": 3000,
    "estimated_training_hours": 48,
    "loRA_adapter": "procurement-01900-lora"
  },
  "integration_points": [
    "procurement_workflow_page",
    "agent_generation_platform",
    "deep-agents-service"
  ],
  "deployment_priority": "high"
}
```

**Deliverables**:
- ✅ 6 discipline specification JSON files
- ✅ Capability matrix for each agent
- ✅ Training data requirements documentation

**Timeline**: 2 days
**Responsible**: AI Engineer

#### Step 1.2: Knowledge Extraction from Existing Systems
**Objective**: Extract discipline-specific knowledge using existing schema extraction tools.

**Note**: While some schema extraction tools exist (`extract-schema-openapi.js`), training infrastructure (scripts, trained models, training data) needs to be built from scratch. This plan provides the foundation for building these capabilities.

**Knowledge Extraction Strategy**:

Based on the existing `/Users/Discipline_agents/construct_ai/docs/schema/code/extract-schema-openapi.js`, we will create discipline-specific extraction scripts. For training infrastructure, we will build from first principles using established ML best practices:

##### **1. Database Schema & Table Structure Extraction**
- **Source Tool**: `docs/schema/code/extract-schema-openapi.js`
- **Modification**: Add discipline code filtering to extract tables per discipline
- **Extracted Data**:
  - Discipline-specific table schemas (e.g., `procurement_*` tables for 01900)
  - Foreign key relationships within discipline
  - RLS policies for data access control
  - Indexes and performance optimization
  - Constraint validation rules

**Modified Script**: `deep-agents/data-collection/extract-discipline-schema.js`
```javascript
// Extract tables and relationships for specific discipline code
class DisciplineSchemaExtractor {
    async extractDisciplineSchema(disciplineCode) {
        const allTables = await this.fetchAllTables();
        
        // Filter tables by discipline code pattern
        const disciplineTables = allTables.filter(table => {
            return table.table_name.includes(`_${disciplineCode}`) ||
                   this.isDisciplineTable(table.table_name, disciplineCode);
        });
        
        // Extract relationships and constraints
        const relationships = await this.extractRelationships(disciplineTables);
        const constraints = await this.extractConstraints(disciplineTables);
        
        return {
            tables: disciplineTables,
            relationships,
            constraints,
            discipline: disciplineCode
        };
    }
}
```

##### **2. Page & UI Structure Extraction**
- **Source Tool**: `docs/schema/code/extract-schema-openapi.js` (already extracts pages)
- **Current Output**: `docs/schema/reports/index-discipline-pages.md`
- **Modification**: Filter pages by discipline and extract UI configurations
- **Extracted Data**:
  - Discipline-specific page configurations
  - UI component layouts and hierarchies
  - User permission structures per discipline
  - Navigation patterns and page flows
  - Button configurations and action mappings

##### **3. Accordion & Navigation Structure**
- **Source Tool**: `docs/schema/code/extract-schema-openapi.js` (already extracts accordion)
- **Current Output**: `docs/schema/reports/index-accordion.md`
- **Modification**: Extract discipline-specific accordion sections
- **Extracted Data**:
  - Navigation hierarchy per discipline
  - Section/subsection organization
  - Page relationships and flow
  - Discipline-specific menu structures

##### **4. Chatbot & AI Configuration Extraction**
- **Source Tool**: `docs/schema/code/extract-chatbots.js`
- **Current Output**: `docs/schema/reports/index-chatbots.md`
- **Extracted Data**:
  - Discipline-specific chatbot prompts
  - AI service configurations (OpenAI, Claude, etc.)
  - Conversation flows and workflows
  - Integration points and API calls
  - Model settings and parameters

##### **5. Template Configuration Extraction**
- **Source Tool**: Direct database queries on template tables
- **Extracted Data**:
  - Discipline-specific templates (procurement, safety, contracts, etc.)
  - Template variations and customizations
  - Approval workflows and routing rules
  - Validation rules and field configurations
  - Document structure and metadata

##### **6. Workflow & Process Extraction**
- **Source Tool**: Direct database queries and existing workflow documentation
- **Extracted Data**:
  - Discipline-specific workflow patterns
  - Process steps and decision points
  - Role assignments and permissions
  - Timeline and milestone configurations

**Implementation Script**: `deep-agents/data-collection/discipline-knowledge-extractor.py`
```python
class DisciplineKnowledgeExtractor:
    async def extract_all_knowledge(self, discipline_code):
        """Extract comprehensive knowledge for specific discipline"""
        
        knowledge_base = {
            "schema": await self.extract_schema(discipline_code),
            "pages": await self.extract_pages(discipline_code),
            "navigation": await self.extract_navigation(discipline_code),
            "chatbots": await self.extract_chatbots(discipline_code),
            "templates": await self.extract_templates(discipline_code),
            "workflows": await self.extract_workflows(discipline_code),
            "integrations": await self.extract_integrations(discipline_code)
        }
        
        # Store knowledge base
        await self.store_knowledge_base(discipline_code, knowledge_base)
        
        return knowledge_base
    
    async def extract_schema(self, discipline_code):
        """Extract database schema for discipline"""
        # Use modified extract-schema-openapi.js
        script_path = "docs/schema/code/extract-discipline-schema.js"
        result = await self.run_extraction_script(script_path, discipline_code)
        return result
    
    async def extract_pages(self, discipline_code):
        """Extract discipline-specific pages"""
        # Query pages table filtered by discipline
        query = f"""
        SELECT * FROM pages 
        WHERE page_id LIKE '%{discipline_code}%' 
        OR discipline = '{discipline_code}'
        ORDER BY page_type, page_name
        """
        return await self.run_database_query(query)
    
    async def extract_chatbots(self, discipline_code):
        """Extract discipline-specific chatbot configurations"""
        query = f"""
        SELECT * FROM chatbots 
        WHERE discipline_code = '{discipline_code}'
        OR page_id LIKE '%{discipline_code}%'
        """
        return await self.run_database_query(query)
    
    async def extract_templates(self, discipline_code):
        """Extract discipline-specific templates"""
        query = f"""
        SELECT * FROM templates 
        WHERE discipline = '{discipline_code}'
        OR template_name LIKE '%{discipline_code}%'
        """
        return await self.run_database_query(query)
```

##### **7. Manual Knowledge Capture**
For knowledge not available in database:
- **Process Interviews**: Interview discipline experts
- **Document Analysis**: Review existing documentation
- **Code Review**: Analyze existing discipline-specific code
- **Workflow Mapping**: Map current business processes

**Files Created**:
- `deep-agents/knowledge-base/procurement-01900.json`
- `deep-agents/knowledge-base/logistics-02400.json`
- `deep-agents/knowledge-base/safety-02400.json`
- `deep-agents/knowledge-base/contracts-00400.json`
- `deep-agents/knowledge-base/contracts-00425.json`
- `deep-agents/knowledge-base/contracts-00435.json`

**Knowledge Base Format**:
```json
{
  "discipline": "procurement",
  "discipline_code": "01900",
  "knowledge_sources": {
    "database_schema": {
      "tables": [...],
      "relationships": [...],
      "constraints": [...]
    },
    "pages": [...],
    "navigation": [...],
    "chatbots": [...],
    "templates": [...],
    "workflows": [...]
  },
  "domain_expertise": {
    "common_patterns": [...],
    "best_practices": [...],
    "frequent_issues": [...],
    "success_criteria": [...]
  },
  "training_data_requirements": {
    "min_examples": 3000,
    "data_sources": ["database", "documentation", "expert_knowledge"],
    "quality_metrics": ["accuracy", "completeness", "relevance"]
  }
}
```

**Timeline**: 4 days
**Responsible**: Data Engineer + AI Engineer
**Integration**: Leverages existing `extract-schema-openapi.js` tools with modifications

#### Step 1.3: Training Data Generation from Knowledge Base
**Objective**: Transform extracted knowledge into training data for LoRA fine-tuning.

**Data Generation Pipeline**:

Based on the extracted knowledge base, generate training examples:

```python
# deep-agents/data-collection/training-data-generator.py
class TrainingDataGenerator:
    async def generate_training_data(self, knowledge_base):
        """Generate training data from knowledge base"""
        
        examples = []
        
        # Generate examples from database schema
        examples.extend(
            await self.generate_from_schema(knowledge_base["schema"])
        )
        
        # Generate examples from pages and UI
        examples.extend(
            await self.generate_from_pages(knowledge_base["pages"])
        )
        
        # Generate examples from chatbots
        examples.extend(
            await self.generate_from_chatbots(knowledge_base["chatbots"])
        )
        
        # Generate examples from templates
        examples.extend(
            await self.generate_from_templates(knowledge_base["templates"])
        )
        
        # Generate examples from workflows
        examples.extend(
            await self.generate_from_workflows(knowledge_base["workflows"])
        )
        
        # Generate expert knowledge examples
        examples.extend(
            await self.generate_from_expertise(knowledge_base["domain_expertise"])
        )
        
        # Validate and filter examples
        validated_examples = await self.validate_examples(examples)
        
        return {
            "examples": validated_examples,
            "count": len(validated_examples),
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "sources_used": list(knowledge_base.keys())
            }
        }
    
    async def generate_from_schema(self, schema_info):
        """Generate training examples from schema"""
        examples = []
        
        for table in schema_info["tables"]:
            # Example: Understanding table structure
            examples.append({
                "input": f"Explain the {table['name']} table and its purpose",
                "output": self.generate_table_explanation(table)
            })
            
            # Example: Relationship understanding
            for relationship in table.get("relationships", []):
                examples.append({
                    "input": f"How does {table['name']} relate to {relationship['related_table']}?",
                    "output": self.generate_relationship_explanation(relationship)
                })
        
        return examples
    
    async def generate_from_pages(self, pages):
        """Generate training examples from pages"""
        examples = []
        
        for page in pages:
            examples.append({
                "input": f"Explain the {page['name']} page and its functionality",
                "output": self.generate_page_explanation(page)
            })
            
            examples.append({
                "input": f"What are the key features of {page['name']}?",
                "output": self.generate_page_features(page)
            })
        
        return examples
    
    async def generate_from_chatbots(self, chatbots):
        """Generate training examples from chatbot configurations"""
        examples = []
        
        for chatbot in chatbots:
            examples.append({
                "input": chatbot.get("sample_query", ""),
                "output": chatbot.get("response", "")
            })
        
        return examples
```

**Deliverables**:
- ✅ Knowledge extraction scripts (modified from existing tools)
- ✅ 6 discipline knowledge base JSON files
- ✅ Training data generation pipeline
- ✅ Data quality validation reports

**Timeline**: 4 days
**Responsible**: Data Engineer + AI Engineer
**Tools Used**: Modified `extract-schema-openapi.js`, existing extraction tools

#### Step 1.4: LoRA Adapter Configuration
**Objective**: Configure LoRA adapters for each discipline agent.

**Files Created**:
- `models/loRA-adapters/procurement-01900-config.json`
- `models/loRA-adapters/logistics-02400-config.json`
- `models/loRA-adapters/safety-02400-config.json`
- `models/loRA-adapters/contracts-00400-config.json`
- `models/loRA-adapters/contracts-00425-config.json`
- `models/loRA-adapters/contracts-00435-config.json`

**Configuration Example**:
```json
{
  "adapter_id": "procurement-01900-lora",
  "base_model": "Qwen/Qwen2.5-7B-Instruct",
  "discipline": "procurement",
  "discipline_code": "01900",
  "training_data": "deep-agents/training-data/procurement-01900-training-data.json",
  "knowledge_base": "deep-agents/knowledge-base/procurement-01900.json",
  "hyper

#### Step 1.3: LoRA Adapter Configuration
**Objective**: Configure LoRA adapters for each discipline agent.

**Files Created**:
- `models/loRA-adapters/procurement-01900-config.json`
- `models/loRA-adapters/logistics-02400-config.json`
- `models/loRA-adapters/safety-02400-config.json`
- `models/loRA-adapters/contracts-00400-config.json`
- `models/loRA-adapters/contracts-00425-config.json`
- `models/loRA-adapters/contracts-00435-config.json`

**Configuration Example**:
```json
{
  "adapter_id": "procurement-01900-lora",
  "base_model": "Qwen/Qwen2.5-7B-Instruct",
  "discipline": "procurement",
  "discipline_code": "01900",
  "training_data": "deep-agents/training-data/procurement-01900-training-data.json",
  "hyperparameters": {
    "learning_rate": 2e-4,
    "num_epochs": 3,
    "batch_size": 8,
    "rank": 16,
    "alpha": 32,
    "dropout": 0.1
  },
  "validation_split": 0.2,
  "early_stopping": true,
  "patience": 2,
  "output_dir": "models/loRA-adapters/outputs/procurement-01900",
  "evaluation_metrics": ["accuracy", "f1_score", "bleu_score"]
}
```

**Deliverables**:
- ✅ 6 LoRA adapter configuration files
- ✅ Training scripts for each adapter
- ✅ Validation procedures

**Timeline**: 1 day
**Responsible**: AI Engineer

### Phase 2: Deep-Agents Implementation (Week 2)

#### Step 2.1: Discipline Agent Implementation
**Objective**: Create Python-based specialist agents for each discipline.

**Files Created**:
- `deep-agents/agents/procurement-specialist-01900.py`
- `deep-agents/agents/logistics-specialist-02400.py`
- `deep-agents/agents/safety-specialist-02400.py`
- `deep-agents/agents/contracts-specialist-00400.py`
- `deep-agents/agents/contracts-specialist-00425.py`
- `deep-agents/agents/contracts-specialist-00435.py`

**Agent Architecture**:
```python
# deep-agents/agents/procurement-specialist-01900.py
class ProcurementSpecialistAgent:
    def __init__(self):
        self.agent_id = "procurement-specialist-01900"
        self.discipline = "procurement"
        self.discipline_code = "01900"
        self.description = "Procurement and supply chain specialist"
        
        # Load LoRA adapter
        self.model = self.load_model_with_lora("procurement-01900-lora")
        
        # Define capabilities
        self.capabilities = {
            "analyze_requirements": self.analyze_requirements,
            "evaluate_suppliers": self.evaluate_suppliers,
            "generate_purchase_order": self.generate_purchase_order,
            "verify_compliance": self.verify_compliance,
            "optimize_supply_chain": self.optimize_supply_chain
        }
        
        # Load discipline-specific knowledge
        self.knowledge_base = self.load_discipline_knowledge()
    
    async def analyze_requirements(self, specifications):
        """Analyze procurement requirements from specifications"""
        # Use LoRA-adapted model for discipline-specific analysis
        prompt = self.build_prompt("analyze_requirements", specifications)
        response = await self.generate_with_lora(prompt)
        return self.format_procurement_analysis(response)
    
    async def evaluate_suppliers(self, vendor_data, requirements):
        """Evaluate suppliers based on procurement requirements"""
        prompt = self.build_prompt("evaluate_suppliers", {
            "vendor_data": vendor_data,
            "requirements": requirements
        })
        response = await self.generate_with_lora(prompt)
        return self.format_supplier_evaluation(response)
    
    async def generate_purchase_order(self, order_details):
        """Generate purchase order from order details"""
        prompt = self.build_prompt("generate_purchase_order", order_details)
        response = await self.generate_with_lora(prompt)
        return self.format_purchase_order(response)
    
    async def verify_compliance(self, order_data, regulations):
        """Verify procurement compliance"""
        prompt = self.build_prompt("verify_compliance", {
            "order": order_data,
            "regulations": regulations
        })
        response = await self.generate_with_lora(prompt)
        return self.format_compliance_check(response)
    
    async def optimize_supply_chain(self, supply_chain_data):
        """Optimize supply chain logistics"""
        prompt = self.build_prompt("optimize_supply_chain", supply_chain_data)
        response = await self.generate_with_lora(prompt)
        return self.format_optimization_recommendations(response)
    
    def build_prompt(self, capability, data):
        """Build discipline-specific prompt"""
        templates = {
            "analyze_requirements": (
                "You are a procurement specialist analyzing requirements for construction projects. "
                "Analyze the following specifications and provide procurement recommendations:\n\n"
                "Specifications: {data}\n\n"
                "Provide: 1) Required materials list, 2) Estimated costs, 3) Supplier recommendations, "
                "4) Timeline considerations, 5) Risk assessment."
            ),
            # ... other templates
        }
        return templates[capability].format(data=data)
    
    def load_discipline_knowledge(self):
        """Load discipline-specific knowledge base"""
        return {
            "procurement_types": ["material", "equipment", "services"],
            "common_suppliers": self.load_supplier_database(),
            "cost_factors": self.load_cost_factors(),
            "compliance_requirements": self.load_compliance_requirements()
        }
```

**Deliverables**:
- ✅ 6 discipline specialist agent Python files
- ✅ Capability implementations for each agent
- ✅ Discipline-specific knowledge bases
- ✅ Prompt templates for each capability

**Timeline**: 4 days
**Responsible**: Python Developer

#### Step 2.2: Meta-Agent Implementation (Orchestration)
**Objective**: Create meta-agent for coordinating discipline agents.

**File Created**:
- `deep-agents/meta-agents/discipline-coordinator-agent.py`

**Meta-Agent Architecture**:
```python
# deep-agents/meta-agents/discipline-coordinator-agent.py
class DisciplineCoordinatorAgent:
    def __init__(self):
        self.agent_id = "discipline-coordinator"
        self.discipline_agents = {}
        self.load_discipline_agents()
        
    def load_discipline_agents(self):
        """Load all discipline agents"""
        self.discipline_agents = {
            "procurement": ProcurementSpecialistAgent(),
            "logistics": LogisticsSpecialistAgent(),
            "safety": SafetySpecialistAgent(),
            "contracts_00400": ContractsSpecialistAgent00400(),
            "contracts_00425": ContractsSpecialistAgent00425(),
            "contracts_00435": ContractsSpecialistAgent00435()
        }
    
    async def route_query(self, user_query, user_discipline=None):
        """Route user query to appropriate discipline agent"""
        # Analyze query to determine discipline
        discipline = self.analyze_query_discipline(user_query, user_discipline)
        
        if discipline in self.discipline_agents:
            agent = self.discipline_agents[discipline]
            return await agent.process_query(user_query)
        else:
            # Fallback to general agent or multiple discipline analysis
            return await self.handle_general_query(user_query)
    
    async def generate_agent_creation_guidance(self, discipline, requirements):
        """Provide guidance for creating agents within a discipline"""
        if discipline in self.discipline_agents:
            specialist_agent = self.discipline_agents[discipline]
            
            # Get discipline-specific guidance
            guidance = await specialist_agent.generate_creation_guidance(requirements)
            
            # Format response for agent-generation platform
            return self.format_guidance_for_ui(guidance, discipline)
        else:
            return {"error": f"No specialist agent available for discipline: {discipline}"}
    
    async def validate_agent_specification(self, discipline, spec):
        """Validate agent specification against discipline knowledge"""
        if discipline in self.discipline_agents:
            specialist_agent = self.discipline_agents[discipline]
            return await specialist_agent.validate_specification(spec)
        return {"valid": False, "error": "Discipline not supported"}
    
    def analyze_query_discipline(self, query, user_discipline=None):
        """Analyze query to determine which discipline agent to use"""
        keywords = {
            "procurement": ["purchase", "vendor", "supplier", "order", "cost", "material"],
            "logistics": ["transport", "delivery", "shipping", "logistics", "supply"],
            "safety": ["safety", "hazard", "compliance", "risk", "accident"],
            "contracts": ["contract", "agreement", "terms", "legal", "compliance"]
        }
        
        query_lower = query.lower()
        
        # Check for explicit discipline mention
        for discipline, terms in keywords.items():
            if any(term in query_lower for term in terms):
                if discipline == "contracts":
                    # Determine which contracts sub-type
                    if "00400" in query or "post-award" in query:
                        return "contracts_00400"
                    elif "00425" in query or "lifecycle" in query:
                        return "contracts_00425"
                    elif "00435" in query or "admin" in query:
                        return "contracts_00435"
                return discipline
        
        # Use user-specified discipline if available
        if user_discipline:
            return user_discipline
        
        return "general"
```

**Deliverables**:
- ✅ Discipline coordinator meta-agent
- ✅ Query routing logic
- ✅ Agent creation guidance generation
- ✅ Specification validation

**Timeline**: 3 days
**Responsible**: AI Engineer

#### Step 2.3: Training Pipeline Implementation
**Objective**: Implement LoRA training for each discipline agent.

**Files Modified/Created**:
- `models/training-scripts/parallel_training_expansion.cjs` (enhance with discipline support)
- `models/training-scripts/discipline-training-pipeline.py` (new)
- `models/training-scripts/training-orchestrator.py` (new)

**Training Pipeline**:
```python
# models/training-scripts/discipline-training-pipeline.py
class DisciplineTrainingPipeline:
    def __init__(self):
        self.base_model = "Qwen/Qwen2.5-7B-Instruct"
        self.disciplines = [
            "procurement-01900",
            "logistics-02400",
            "safety-02400",
            "contracts-00400",
            "contracts-00425",
            "contracts-00435"
        ]
    
    async def train_all_discipline_agents(self):
        """Train all discipline agents in parallel"""
        tasks = []
        
        for discipline in self.disciplines:
            task = self.train_discipline_agent(discipline)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            discipline: self.format_training_result(results[i])
            for i, discipline in enumerate(self.disciplines)
        }
    
    async def train_discipline_agent(self, discipline):
        """Train individual discipline agent"""
        # Load configuration
        config = self.load_training_config(discipline)
        
        # Prepare training data
        training_data = self.load_training_data(discipline)
        
        # Run LoRA fine-tuning
        result = await self.run_lora_training(
            base_model=self.base_model,
            training_data=training_data,
            config=config
        )
        
        # Validate model
        validation_result = await self.validate_trained_model(discipline, result)
        
        # Save adapter
        adapter_path = self.save_adapter(discipline, result)
        
        return {
            "discipline": discipline,
            "status": "success",
            "adapter_path": adapter_path,
            "validation_score": validation_result["score"],
            "training_duration": result["duration"]
        }
    
    async def run_lora_training(self, base_model, training_data, config):
        """Execute LoRA fine-tuning"""
        # Use existing training script as base
        # Adapt for discipline-specific training
        training_script = await self.adapt_training_script(base_model, config)
        
        # Execute training
        result = await training_script.execute(
            training_data=training_data,
            hyperparameters=config["hyperparameters"]
        )
        
        return result
    
    def adapt_training_script(self, base_model, config):
        """Adapt base training script for discipline-specific needs"""
        # Use existing parallel_training_expansion.cjs as reference
        # Add discipline-specific prompts and validation
        adapted_script = {
            "base_model": base_model,
            "discipline": config["discipline"],
            "data_format": self.get_discipline_data_format(config["discipline"]),
            "evaluation_metrics": config["evaluation_metrics"],
            "prompt_templates": self.load_prompt_templates(config["discipline"])
        }
        return adapted_script
    
    def get_discipline_data_format(self, discipline):
        """Get discipline-specific data format"""
        formats = {
            "procurement-01900": {
                "input_fields": ["specifications", "requirements", "budget"],
                "output_fields": ["materials_list", "cost_estimate", "supplier_recommendations"]
            },
            "logistics-02400": {
                "input_fields": ["shipment_details", "destination", "timeline"],
                "output_fields": ["logistics_plan", "risk_assessment", "cost_breakdown"]
            },
            "safety-02400": {
                "input_fields": ["site_conditions", "hazards", "regulations"],
                "output_fields": ["safety_plan", "risk_mitigation", "compliance_checklist"]
            },
            # ... other disciplines
        }
        return formats[discipline]
```

**Deliverables**:
- ✅ Discipline training pipeline
- ✅ Training orchestration script
- ✅ Training result validation
- ✅ Model saving and versioning

**Timeline**: 4 days
**Responsible**: ML Engineer

### Phase 3: Agent Service Integration (Week 3)

#### Step 3.1: Agent Service Enhancement
**Objective**: Enhance agent service to support discipline agents.

**Files Modified**:
- `server/src/services/agent-service.js` (enhance)
- `server/src/routes/agent-routes.js` (add discipline endpoints)

**Service Enhancements**:
```javascript
// server/src/services/agent-service.js
class AgentService {
    constructor() {
        this.disciplineAgents = {};
        this.metaAgent = null;
        this.loadDisciplineAgents();
    }
    
    async loadDisciplineAgents() {
        // Load discipline agents from deep-agents directory
        const agentPaths = [
            "deep-agents/agents/procurement-specialist-01900.py",
            "deep-agents/agents/logistics-specialist-02400.py",
            "deep-agents/agents/safety-specialist-02400.py",
            "deep-agents/agents/contracts-specialist-00400.py",
            "deep-agents/agents/contracts-specialist-00425.py",
            "deep-agents/agents/contracts-specialist-00435.py"
        ];
        
        for (const agentPath of agentPaths) {
            try {
                const agent = await this.loadAgent(agentPath);
                this.disciplineAgents[agent.discipline] = agent;
            } catch (error) {
                console.error(`Failed to load discipline agent ${agentPath}:`, error);
            }
        }
        
        // Load meta-agent
        this.metaAgent = await this.loadMetaAgent("deep-agents/meta-agents/discipline-coordinator-agent.py");
    }
    
    async processDisciplineQuery(query, discipline, userId) {
        if (!this.disciplineAgents[discipline]) {
            throw new Error(`Discipline agent ${discipline} not found`);
        }
        
        const agent = this.disciplineAgents[discipline];
        
        // Process query
        const result = await agent.processQuery(query);
        
        // Log for audit and learning
        await this.logQuery({
            userId,
            discipline,
            query,
            result,
            timestamp: new Date()
        });
        
        return result;
    }
    
    async generateAgentCreationGuidance(discipline, requirements, userId) {
        if (!this.metaAgent) {
            throw new Error("Meta-agent not available");
        }
        
        // Use meta-agent for guidance
        const guidance = await this.metaAgent.generateAgentCreationGuidance(discipline, requirements);
        
        // Store in database for reference
        await this.storeGuidance({
            userId,
            discipline,
            requirements,
            guidance,
            timestamp: new Date()
        });
        
        return guidance;
    }
    
    async validateDisciplineAgentSpecification(discipline, specification) {
        if (!this.metaAgent) {
            throw new Error("Meta-agent not available");
        }
        
        return await this.metaAgent.validateAgentSpecification(discipline, specification);
    }
}
```

**API Endpoints**:
```javascript
// server/src/routes/agent-routes.js
router.post('/api/discipline/query', async (req, res) => {
    const { query, discipline } = req.body;
    const userId = req.user.id;
    
    try {
        const result = await agentService.processDisciplineQuery(query, discipline, userId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/api/discipline/generate-guidance', async (req, res) => {
    const { discipline, requirements } = req.body;
    const userId = req.user.id;
    
    try {
        const guidance = await agentService.generateAgentCreationGuidance(discipline, requirements, userId);
        res.json({ success: true, data: guidance });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/api/discipline/validate-specification', async (req, res) => {
    const { discipline, specification } = req.body;
    
    try {
        const result = await agentService.validateDisciplineAgentSpecification(discipline, specification);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/api/discipline/available', async (req, res) => {
    try {
        const availableDisciplines = Object.keys(agentService.disciplineAgents);
        res.json({ success: true, data: availableDisciplines });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

**Deliverables**:
- ✅ Enhanced agent service with discipline support
- ✅ REST API endpoints for discipline queries
- ✅ Query logging and audit trail
- ✅ Error handling and validation

**Timeline**: 3 days
**Responsible**: Backend Developer

#### Step 3.2: Database Schema Enhancement
**Objective**: Add tables for discipline agent management and audit.

**Files Created**:
- `database/migrations/add_discipline_agent_tables.sql`

**SQL Migration**:
```sql
-- Discipline Agent Management Tables
CREATE TABLE discipline_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  discipline VARCHAR(50) NOT NULL,
  discipline_code VARCHAR(20),
  agent_type VARCHAR(50) NOT NULL,
  description TEXT,
  capabilities JSONB,
  knowledge_domains JSONB,
  status VARCHAR(50) DEFAULT 'active',
  version INTEGER DEFAULT 1,
  loRA_adapter_path VARCHAR(500),
  training_metrics JSONB,
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id)
);

-- Discipline Agent Queries Log
CREATE TABLE discipline_agent_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_management(user_id),
  discipline VARCHAR(50),
  agent_id VARCHAR(100),
  query TEXT,
  response TEXT,
  response_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id)
);

-- Discipline Agent Guidance Log
CREATE TABLE discipline_agent_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_management(user_id),
  discipline VARCHAR(50),
  requirements TEXT,
  guidance JSONB,
  usage_context VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id)
);

-- Agent Creation Validation Results
CREATE TABLE agent_creation_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_management(user_id),
  discipline VARCHAR(50),
  specification JSONB,
  validation_result JSONB,
  is_valid BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID REFERENCES organizations(id)
);

-- Indexes for performance
CREATE INDEX idx_discipline_agents_discipline ON discipline_agents(discipline);
CREATE INDEX idx_discipline_agents_status ON discipline_agents(status);
CREATE INDEX idx_discipline_agent_queries_user ON discipline_agent_queries(user_id);
CREATE INDEX idx_discipline_agent_queries_discipline ON discipline_agent_queries(discipline);
CREATE INDEX idx_discipline_agent_guidance_user ON discipline_agent_guidance(user_id);
CREATE INDEX idx_agent_creation_validation_user ON agent_creation_validation(user_id);

-- RLS Policies
ALTER TABLE discipline_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_agent_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_agent_guidance ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_creation_validation ENABLE ROW LEVEL SECURITY;

CREATE POLICY discipline_agents_org_policy ON discipline_agents
  FOR ALL USING (organization_id = auth.uid());

CREATE POLICY discipline_agent_queries_org_policy ON discipline_agent_queries
  FOR ALL USING (organization_id = auth.uid());

CREATE POLICY discipline_agent_guidance_org_policy ON discipline_agent_guidance
  FOR ALL USING (organization_id = auth.uid());

CREATE POLICY agent_creation_validation_org_policy ON agent_creation_validation
  FOR ALL USING (organization_id = auth.uid());
```

**Deliverables**:
- ✅ SQL migration script
- ✅ RLS policies
- ✅ Database indexes
- ✅ Backup and rollback procedures

**Timeline**: 2 days
**Responsible**: Database Engineer

### Phase 4: Agent Generation Platform Integration (Week 3)

#### Step 4.1: Frontend Integration
**Objective**: Integrate discipline agents into construct-ai.onrender.com/#/agent-generation.

**Files Modified**:
- `client/src/pages/agent-generation/components/AgentGenerationPage.js` (enhance)
- `client/src/components/discipline-selector/DisciplineSelector.js` (new)

**Discipline Selector Component**:
```jsx
// client/src/components/discipline-selector/DisciplineSelector.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Badge } from 'react-bootstrap';

const DisciplineSelector = ({ onSelectDiscipline, availableDisciplines }) => {
    const [selectedDiscipline, setSelectedDiscipline] = useState('');
    const [disciplineData, setDisciplineData] = useState({});

    const disciplineConfigs = {
        "procurement": {
            name: "Procurement",
            code: "01900",
            description: "Procurement and supply chain specialist",
            icon: "📦",
            color: "#0d6efd",
            capabilities: [
                "Supplier evaluation",
                "Purchase order generation",
                "Cost estimation",
                "Contract compliance"
            ]
        },
        "logistics": {
            name: "Logistics",
            code: "02400",
            description: "Logistics and supply chain management",
            icon: "🚚",
            color: "#198754",
            capabilities: [
                "Transport planning",
                "Delivery optimization",
                "Risk assessment",
                "Documentation management"
            ]
        },
        "safety": {
            name: "Safety",
            code: "02400",
            description: "Safety and HSE specialist",
            icon: "🛡️",
            color: "#dc3545",
            capabilities: [
                "Hazard identification",
                "Risk mitigation",
                "Compliance checking",
                "Incident analysis"
            ]
        },
        "contracts_00400": {
            name: "Contracts (Post-Award)",
            code: "00400",
            description: "Post-award contract management",
            icon: "📋",
            color: "#fd7e14",
            capabilities: [
                "Delivery tracking",
                "Milestone verification",
                "Contract amendment",
                "Performance monitoring"
            ]
        },
        "contracts_00425": {
            name: "Contracts (Lifecycle)",
            code: "00425",
            description: "Contract lifecycle management",
            icon: "🔄",
            color: "#6610f2",
            capabilities: [
                "Lifecycle tracking",
                "Approval workflows",
                "Compliance management",
                "Renewal management"
            ]
        },
        "contracts_00435": {
            name: "Contracts (Administration)",
            code: "00435",
            description: "Contract administration",
            icon: "⚖️",
            color: "#20c997",
            capabilities: [
                "Administrative oversight",
                "Audit management",
                "Payment certification",
                "Dispute resolution"
            ]
        }
    };

    const handleDisciplineSelect = async (discipline) => {
        setSelectedDiscipline(discipline);
        
        // Fetch discipline-specific information
        try {
            const response = await fetch('/api/discipline/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discipline })
            });
            
            if (response.ok) {
                const data = await response.json();
                setDisciplineData(data);
            }
        } catch (error) {
            console.error('Failed to fetch discipline info:', error);
        }
        
        onSelectDiscipline(discipline);
    };

    return (
        <Card className="discipline-selector">
            <Card.Header>
                <h5>Select Discipline for Agent Development</h5>
            </Card.Header>
            <Card.Body>
                <Form.Group>
                    <Form.Label>Available Discipline Specialists</Form.Label>
                    <div className="discipline-options">
                        {Object.entries(disciplineConfigs).map(([key, config]) => (
                            <div
                                key={key}
                                className={`discipline-option ${selectedDiscipline === key ? 'selected' : ''}`}
                                onClick={() => handleDisciplineSelect(key)}
                                style={{ borderLeftColor: config.color }}
                            >
                                <div className="discipline-icon">{config.icon}</div>
                                <div className="discipline-info">
                                    <strong>{config.name}</strong>
                                    <span className="badge bg-secondary">{config.code}</span>
                                    <small>{config.description}</small>
                                    <div className="capabilities">
                                        {config.capabilities.map(cap => (
                                            <Badge key={cap} pill bg="light" text="dark">
                                                {cap}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Form.Group>
                
                {selectedDiscipline && (
                    <div className="discipline-details mt-3">
                        <h6>Selected: {disciplineConfigs[selectedDiscipline].name}</h6>
                        <p>{disciplineData?.description}</p>
                        <Button 
                            variant="primary"
                            onClick={() => window.location.href = `/#/agent-generation?discipline=${selectedDiscipline}`}
                        >
                            Create Agent with {disciplineConfigs[selectedDiscipline].name} Specialist
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default DisciplineSelector;
```

**Enhanced Agent Generation Page**:
```jsx
// client/src/pages/agent-generation/components/AgentGenerationPage.js (enhanced)
import React, { useState, useEffect } from 'react';
import DisciplineSelector from '../../components/discipline-selector/DisciplineSelector';

const AgentGenerationPage = () => {
    const [discipline, setDiscipline] = useState('');
    const [availableDisciplines, setAvailableDisciplines] = useState([]);
    const [guidance, setGuidance] = useState(null);
    const [validation, setValidation] = useState(null);

    useEffect(() => {
        fetchAvailableDisciplines();
        
        // Check URL for discipline parameter
        const urlParams = new URLSearchParams(window.location.search);
        const disciplineParam = urlParams.get('discipline');
        if (disciplineParam) {
            setDiscipline(disciplineParam);
        }
    }, []);

    const fetchAvailableDisciplines = async () => {
        try {
            const response = await fetch('/api/discipline/available');
            if (response.ok) {
                const data = await response.json();
                setAvailableDisciplines(data);
            }
        } catch (error) {
            console.error('Failed to fetch available disciplines:', error);
        }
    };

    const handleDisciplineSelect = (selectedDiscipline) => {
        setDiscipline(selectedDiscipline);
        setGuidance(null);
        setValidation(null);
    };

    const generateAgentGuidance = async (requirements) => {
        if (!discipline) return;
        
        try {
            const response = await fetch('/api/discipline/generate-guidance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discipline, requirements })
            });
            
            if (response.ok) {
                const data = await response.json();
                setGuidance(data);
            }
        } catch (error) {
            console.error('Failed to generate guidance:', error);
        }
    };

    const validateSpecification = async (specification) => {
        if (!discipline) return;
        
        try {
            const response = await fetch('/api/discipline/validate-specification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discipline, specification })
            });
            
            if (response.ok) {
                const data = await response.json();
                setValidation(data);
            }
        } catch (error) {
            console.error('Failed to validate specification:', error);
        }
    };

    return (
        <div className="agent-generation-page">
            <h2>AI Agent Generation Platform</h2>
            <p>Use discipline-specific specialists to guide agent creation</p>
            
            {/* Discipline Selector */}
            <DisciplineSelector 
                onSelectDiscipline={handleDisciplineSelect}
                availableDisciplines={availableDisciplines}
            />
            
            {/* Existing Agent Generation UI */}
            {discipline && (
                <div className="mt-4">
                    <div className="alert alert-info">
                        <strong>Discipline Specialist Active:</strong> {discipline}
                    </div>
                    
                    {/* Enhanced form with discipline guidance */}
                    <div className="row">
                        <div className="col-md-8">
                            {/* Existing agent specification form */}
                            <div className="card mb-3">
                                <div className="card-header">
                                    <h5>Agent Specification</h5>
                                </div>
                                <div className="card-body">
                                    {/* Your existing form here */}
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-4">
                            {/* Discipline Guidance Panel */}
                            {guidance && (
                                <div className="card mb-3">
                                    <div className="card-header bg-success text-white">
                                        <h6>🎯 Discipline Guidance</h6>
                                    </div>
                                    <div className="card-body">
                                        <div dangerouslySetInnerHTML={{ __html: guidance.html }} />
                                        <Button 
                                            variant="outline-success"
                                            onClick={() => setGuidance(null)}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Validation Results */}
                            {validation && (
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h6>✓ Validation Results</h6>
                                    </div>
                                    <div className="card-body">
                                        {validation.valid ? (
                                            <div className="alert alert-success">
                                                <strong>Valid!</strong> Specification meets discipline requirements.
                                            </div>
                                        ) : (
                                            <div className="alert alert-danger">
                                                <strong>Invalid:</strong> {validation.error}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentGenerationPage;
```

**Styling**:
```css
/* client/src/components/discipline-selector/DisciplineSelector.css */
.discipline-selector {
    margin-bottom: 2rem;
}

.discipline-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.discipline-option {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    border-left: 4px solid;
}

.discipline-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.discipline-option.selected {
    border-color: #0d6efd;
    background: #f8f9fa;
    box-shadow: 0 4px 8px rgba(13, 110, 253, 0.2);
}

.discipline-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.discipline-info strong {
    display: block;
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
}

.discipline-info .badge {
    font-size: 0.75rem;
    margin-left: 0.5rem;
}

.discipline-info small {
    display: block;
    color: #666;
    margin: 0.5rem 0;
    font-size: 0.85rem;
}

.capabilities {
    margin-top: 0.5rem;
}

.capabilities .badge {
    margin: 0.25rem;
    font-weight: normal;
}

.discipline-details {
    border-top: 2px solid #e0e0e0;
    padding-top: 1rem;
    margin-top: 1rem;
}
```

**Deliverables**:
- ✅ Discipline selector component
- ✅ Enhanced agent generation page
- ✅ Discipline-specific UI/UX
- ✅ Integration with existing workflow
- ✅ Responsive styling

**Timeline**: 3 days
**Responsible**: Frontend Developer

### Phase 5: GitHub Workflow and Deployment (Week 4)

#### Step 5.1: GitHub Actions Workflow
**Objective**: Automate deployment of discipline agents.

**Files Created**:
- `.github/workflows/discipline-agent-deploy.yml`

**Workflow Configuration**:
```yaml
name: Discipline Agent Deployment

on:
  push:
    branches: [main, develop]
    paths:
      - 'deep-agents/agents/discipline-*.py'
      - 'deep-agents/meta-agents/discipline-*.py'
      - 'models/loRA-adapters/*.json'
      - 'models/training-scripts/discipline-training-pipeline.py'
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      discipline:
        description: 'Discipline to deploy'
        required: false
        default: 'all'

jobs:
  test-discipline-agents:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        discipline: [procurement, logistics, safety, contracts-00400, contracts-00425, contracts-00435]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-asyncio
    
    - name: Run unit tests
      run: |
        python -m pytest deep-agents/tests/test_${{ matrix.discipline }}.py -v
    
    - name: Test agent initialization
      run: |
        python -c "
        from deep-agents.agents.${{ matrix.discipline }}_specialist import ${{ matrix.discipline | replace('-', '_') }}_specialist
        agent = ${{ matrix.discipline | replace('-', '_') }}_specialist()
        print(f'{agent.agent_id} initialized successfully')
        "

  deploy-discipline-agents:
    needs: test-discipline-agents
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        discipline: [procurement, logistics, safety, contracts-00400, contracts-00425, contracts-00435]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Build and deploy discipline agent
      run: |
        # Package discipline agent
        cd deep-agents/agents
        tar -czf ${{ matrix.discipline }}-agent.tar.gz ${{ matrix.discipline }}_specialist.py
        
        # Upload to S3
        aws s3 cp ${{ matrix.discipline }}-agent.tar.gz s3://construct-ai-agents/discipline-agents/
        
        # Update agent index
        python scripts/update_agent_index.py --discipline ${{ matrix.discipline }}
    
    - name: Deploy to agent service
      run: |
        # Restart agent service with new discipline agents
        ssh ${{ secrets.AGENT_SERVER }} "sudo systemctl restart agent-service"
    
    - name: Verify deployment
      run: |
        # Test agent service
        curl -f https://agent-service.construct-ai.com/api/discipline/${{ matrix.discipline }}/status || exit 1

  deploy-meta-agent:
    needs: test-discipline-agents
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy meta-agent
      run: |
        # Package and deploy meta-agent
        cd deep-agents/meta-agents
        tar -czf discipline-coordinator.tar.gz discipline-coordinator-agent.py
        
        # Upload to S3
        aws s3 cp discipline-coordinator.tar.gz s3://construct-ai-agents/meta-agents/
        
        # Update agent service
        ssh ${{ secrets.AGENT_SERVER }} "sudo systemctl restart agent-service"

  update-database:
    needs: deploy-discipline-agents
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run database migration
      run: |
        # Execute discipline agent table migration
        psql ${{ secrets.DATABASE_URL }} -f database/migrations/add_discipline_agent_tables.sql
    
    - name: Update agent registry
      run: |
        python scripts/update_agent_registry.py --all-disciplines

  notify-team:
    needs: [deploy-discipline-agents, deploy-meta-agent, update-database]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Send deployment notification
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#ai-agent-deployments'
        text: 'Discipline Agents Deployment: ${{ job.status }}'
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Deliverables**:
- ✅ GitHub Actions workflow
- ✅ Deployment scripts
- ✅ Test suite for discipline agents
- ✅ Notification system

**Timeline**: 2 days
**Responsible**: DevOps Engineer

### Phase 6: Index Generation and Startup (Week 4)

#### Step 6.1: Deep-Agent Index Generation
**Objective**: Create index of all discipline agents for discovery.

**Files Created**:
- `server/src/startup/deep-agents-index.js`

**Index Generation Script**:
```javascript
// server/src/startup/deep-agents-index.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeepAgentIndexGenerator {
    constructor() {
        this.basePath = path.join(__dirname, '../../..');
        this.agentsPath = path.join(this.basePath, 'deep-agents');
        this.indexPath = path.join(this.basePath, 'public', 'agents-index.json');
    }

    async generateIndex() {
        console.log('Generating deep-agent index...');
        
        const index = {
            generated_at: new Date().toISOString(),
            total_agents: 0,
            discipline_agents: [],
            meta_agents: [],
            agent_counts: {}
        };

        // Scan discipline agents
        const disciplineAgents = await this.scanDisciplineAgents();
        index.discipline_agents = disciplineAgents;
        index.total_agents += disciplineAgents.length;

        // Scan meta agents
        const metaAgents = await this.scanMetaAgents();
        index.meta_agents = metaAgents;
        index.total_agents += metaAgents.length;

        // Count by discipline
        index.agent_counts = this.countAgentsByDiscipline(disciplineAgents);

        // Save index
        this.saveIndex(index);

        console.log(`Generated index with ${index.total_agents} agents`);
        return index;
    }

    async scanDisciplineAgents() {
        const agentsDir = path.join(this.agentsPath, 'agents');
        const files = fs.readdirSync(agentsDir).filter(f => f.includes('specialist'));
        
        return await Promise.all(
            files.map(async (file) => {
                const agentPath = path.join(agentsDir, file);
                const agentInfo = await this.extractAgentInfo(agentPath);
                return agentInfo;
            })
        );
    }

    async scanMetaAgents() {
        const metaDir = path.join(this.agentsPath, 'meta-agents');
        const files = fs.readdirSync(metaDir).filter(f => f.includes('coordinator') || f.includes('manager'));
        
        return await Promise.all(
            files.map(async (file) => {
                const agentPath = path.join(metaDir, file);
                const agentInfo = await this.extractAgentInfo(agentPath);
                return agentInfo;
            })
        );
    }

    async extractAgentInfo(agentPath) {
        const content = fs.readFileSync(agentPath, 'utf8');
        
        // Extract basic information from Python file
        const agentIdMatch = content.match(/self\.agent_id\s*=\s*["']([^"']+)["']/);
        const disciplineMatch = content.match(/self\.discipline\s*=\s*["']([^"']+)["']/);
        const descriptionMatch = content.match(/self\.description\s*=\s*["']([^"']+)["']/);
        
        return {
            agent_id: agentIdMatch ? agentIdMatch[1] : path.basename(agentPath),
            discipline: disciplineMatch ? disciplineMatch[1] : 'general',
            description: descriptionMatch ? descriptionMatch[1] : '',
            path: agentPath,
            file_size: fs.statSync(agentPath).size,
            last_modified: fs.statSync(agentPath).mtime.toISOString()
        };
    }

    countAgentsByDiscipline(agents) {
        const counts = {};
        
        agents.forEach(agent => {
            const discipline = agent.discipline;
            counts[discipline] = (counts[discipline] || 0) + 1;
        });
        
        return counts;
    }

    saveIndex(index) {
        // Create public directory if it doesn't exist
        const publicDir = path.dirname(this.indexPath);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // Save index
        fs.writeFileSync(
            this.indexPath,
            JSON.stringify(index, null, 2)
        );

        console.log(`Index saved to ${this.indexPath}`);
    }

    getIndex() {
        if (fs.existsSync(this.indexPath)) {
            return JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
        }
        return null;
    }

    getAgentInfo(agentId) {
        const index = this.getIndex();
        if (!index) return null;

        const agent = [...index.discipline_agents, ...index.meta_agents]
            .find(a => a.agent_id === agentId);
        
        return agent || null;
    }
}

// Export for use in other modules
module.exports = DeepAgentIndexGenerator;

// If run directly
if (require.main === module) {
    const generator = new DeepAgentIndexGenerator();
    generator.generateIndex().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Failed to generate index:', error);
        process.exit(1);
    });
}
```

**Startup Integration**:
```javascript
// server/src/startup/startup-scripts.js
const DeepAgentIndexGenerator = require('./deep-agents-index');

async function startupScripts() {
    console.log('Starting Construct AI system...');
    
    // Generate deep-agent index
    try {
        const indexGenerator = new DeepAgentIndexGenerator();
        const index = await indexGenerator.generateIndex();
        
        console.log(`Deep-Agent Index: ${index.total_agents} agents loaded`);
        console.log(`Disciplines: ${Object.keys(index.agent_counts).join(', ')}`);
        
        // Store in global for access
        global.deepAgentIndex = index;
    } catch (error) {
        console.error('Failed to generate deep-agent index:', error);
    }
    
    // Other startup tasks...
    console.log('System startup complete');
}

module.exports = { startupScripts };
```

**Deliverables**:
- ✅ Index generation script
- ✅ Startup integration
- ✅ Agent discovery API
- ✅ Index refresh mechanism

**Timeline**: 2 days
**Responsible**: Backend Developer

### Phase 7: Quality Assurance and Monitoring (Week 5)

#### Step 7.1: Testing Framework
**Objective**: Comprehensive testing for discipline agents.

**Files Created**:
- `deep-agents/tests/test_discipline_agents.py`
- `deep-agents/tests/test_meta_agent.py`
- `deep-agents/tests/integration_tests.py`

**Test Suite**:
```python
# deep-agents/tests/test_discipline_agents.py
import pytest
import asyncio
import json
from deep-agents.agents.procurement_specialist_01900 import ProcurementSpecialistAgent
from deep-agents.agents.logistics_specialist_02400 import LogisticsSpecialistAgent
from deep-agents.agents.safety_specialist_02400 import SafetySpecialistAgent

class TestDisciplineAgents:
    
    @pytest.fixture
    def procurement_agent(self):
        return ProcurementSpecialistAgent()
    
    @pytest.fixture
    def logistics_agent(self):
        return LogisticsSpecialistAgent()
    
    @pytest.fixture
    def safety_agent(self):
        return SafetySpecialistAgent()
    
    def test_procurement_agent_initialization(self, procurement_agent):
        """Test procurement agent initializes correctly"""
        assert procurement_agent.agent_id == "procurement-specialist-01900"
        assert procurement_agent.discipline == "procurement"
        assert len(procurement_agent.capabilities) > 0
    
    def test_logistics_agent_initialization(self, logistics_agent):
        """Test logistics agent initializes correctly"""
        assert logistics_agent.agent_id == "logistics-specialist-02400"
        assert logistics_agent.discipline == "logistics"
        assert len(logistics_agent.capabilities) > 0
    
    def test_safety_agent_initialization(self, safety_agent):
        """Test safety agent initializes correctly"""
        assert safety_agent.agent_id == "safety-specialist-02400"
        assert safety_agent.discipline == "safety"
        assert len(safety_agent.capabilities) > 0
    
    @pytest.mark.asyncio
    async def test_procurement_agent_capabilities(self, procurement_agent):
        """Test procurement agent capability methods"""
        # Test requirement analysis
        specs = {
            "materials": ["steel", "concrete", "pipes"],
            "quantity": 100,
            "budget": 50000
        }
        
        result = await procurement_agent.analyze_requirements(specs)
        assert result is not None
        assert isinstance(result, dict)
        assert "materials_list" in result
    
    @pytest.mark.asyncio
    async def test_logistics_agent_capabilities(self, logistics_agent):
        """Test logistics agent capability methods"""
        shipment_data = {
            "origin": "Port of Dubai",
            "destination": "Project Site",
            "weight": 5000,
            "hazards": ["flammable", "heavy"]
        }
        
        result = await logistics_agent.generate_logistics_plan(shipment_data)
        assert result is not None
        assert isinstance(result, dict)
        assert "transport_mode" in result
    
    @pytest.mark.asyncio
    async def test_safety_agent_capabilities(self, safety_agent):
        """Test safety agent capability methods"""
        site_data = {
            "hazards": ["falling_objects", "electrical"],
            "workers": 50,
            "equipment": ["cranes", "welding"]
        }
        
        result = await safety_agent.assess_risks(site_data)
        assert result is not None
        assert isinstance(result, dict)
        assert "risk_assessment" in result
    
    def test_discipline_validation(self, procurement_agent):
        """Test discipline-specific validation"""
        spec = {
            "agent_id": "test-agent",
            "type": "specialist",
            "discipline": "procurement"
        }
        
        result = procurement_agent.validate_specification(spec)
        assert result["valid"] is True
    
    def test_invalid_discipline_validation(self, procurement_agent):
        """Test invalid specification detection"""
        spec = {
            "agent_id": "test-agent",
            "type": "invalid_type",
            "discipline": "invalid_discipline"
        }
        
        result = procurement_agent.validate_specification(spec)
        assert result["valid"] is False

# Integration tests
class TestDisciplineAgentIntegration:
    
    @pytest.fixture
    def coordinator(self):
        from deep-agents.meta_agents.discipline_coordinator_agent import DisciplineCoordinatorAgent
        return DisciplineCoordinatorAgent()
    
    @pytest.mark.asyncio
    async def test_query_routing(self, coordinator):
        """Test query routing to discipline agents"""
        test_queries = [
            ("I need to evaluate suppliers for steel beams", "procurement"),
            ("Plan logistics for shipping equipment to site", "logistics"),
            ("Assess safety risks for crane operation", "safety")
        ]
        
        for query, expected_discipline in test_queries:
            result = await coordinator.route_query(query)
            assert result is not None
            assert expected_discipline in result.get("discipline", "")
    
    @pytest.mark.asyncio
    async def test_agent_creation_guidance(self, coordinator):
        """Test agent creation guidance generation"""
        guidance = await coordinator.generate_agent_creation_guidance(
            discipline="procurement",
            requirements={"focus": "supplier_management", "level": "specialist"}
        )
        
        assert guidance is not None
        assert "agent_specification" in guidance
        assert "training_requirements" in guidance
```

**Deliverables**:
- ✅ Unit tests for all discipline agents
- ✅ Integration tests for meta-agent
- ✅ Test coverage reports
- ✅ CI/CD integration

**Timeline**: 3 days
**Responsible**: QA Engineer

#### Step 7.2: Performance Monitoring
**Objective**: Monitor discipline agent performance and quality.

**Files Created**:
- `server/src/monitoring/discipline-agent-monitor.js`
- `server/src/analytics/discipline-agent-analytics.js`

**Monitoring System**:
```javascript
// server/src/monitoring/discipline-agent-monitor.js
class DisciplineAgentMonitor {
    constructor() {
        this.metrics = {
            response_times: [],
            success_rates: {},
            query_counts: {},
            user_satisfaction: {}
        };
    }

    async trackQuery(discipline, query, response, duration, success, userId) {
        const timestamp = new Date();
        
        // Update metrics
        this.metrics.response_times.push(duration);
        
        if (!this.metrics.success_rates[discipline]) {
            this.metrics.success_rates[discipline] = { total: 0, success: 0 };
        }
        
        this.metrics.success_rates[discipline].total++;
        if (success) {
            this.metrics.success_rates[discipline].success++;
        }
        
        // Count queries
        this.metrics.query_counts[discipline] = (this.metrics.query_counts[discipline] || 0) + 1;
        
        // Store in database
        await this.storeQueryMetrics({
            discipline,
            query,
            response,
            duration,
            success,
            userId,
            timestamp
        });
        
        // Check for anomalies
        await this.checkForAnomalies(discipline, duration, success);
    }

    async getPerformanceReport() {
        const report = {
            generated_at: new Date().toISOString(),
            summary: {},
            discipline_metrics: [],
            recommendations: []
        };

        // Calculate success rates
        for (const [discipline, data] of Object.entries(this.metrics.success_rates)) {
            const rate = data.total > 0 ? (data.success / data.total) * 100 : 0;
            const avgResponseTime = this.calculateAverageResponseTime(discipline);
            
            report.discipline_metrics.push({
                discipline,
                success_rate: rate,
                avg_response_time: avgResponseTime,
                total_queries: this.metrics.query_counts[discipline] || 0,
                status: this.getPerformanceStatus(rate, avgResponseTime)
            });
        }

        // Generate recommendations
        report.recommendations = this.generateRecommendations(report.discipline_metrics);
        
        return report;
    }

    calculateAverageResponseTime(discipline) {
        // Calculate based on stored queries
        return 0; // Placeholder
    }

    getPerformanceStatus(successRate, responseTime) {
        if (successRate >= 90 && responseTime < 2000) {
            return "excellent";
        } else if (successRate >= 80 && responseTime < 3000) {
            return "good";
        } else if (successRate >= 70 && responseTime < 5000) {
            return "fair";
        } else {
            return "poor";
        }
    }

    generateRecommendations(metrics) {
        const recommendations = [];
        
        metrics.forEach(metric => {
            if (metric.status === "poor") {
                recommendations.push({
                    discipline: metric.discipline,
                    issue: "Low performance detected",
                    action: "Review training data and model fine-tuning"
                });
            }
        });
        
        return recommendations;
    }

    async checkForAnomalies(discipline, responseTime, success) {
        // Check for response time anomalies
        if (responseTime > 10000) {
            console.warn(`Anomaly detected: ${discipline} agent response time ${responseTime}ms`);
        }
        
        // Check for success rate drops
        const rate = this.metrics.success_rates[discipline];
        if (rate && rate.total > 10) {
            const successRate = (rate.success / rate.total) * 100;
            if (successRate < 70) {
                console.warn(`Anomaly detected: ${discipline} agent success rate ${successRate.toFixed(1)}%`);
            }
        }
    }

    async storeQueryMetrics(data) {
        // Store query metrics in database
        const { data: metrics, error } = await supabase
            .from('discipline_agent_queries')
            .insert([data]);
        
        if (error) {
            console.error('Failed to store query metrics:', error);
        }
    }
}

// Export for use in other modules
module.exports = DisciplineAgentMonitor;
```

**Deliverables**:
- ✅ Performance monitoring system
- ✅ Real-time metrics tracking
- ✅ Anomaly detection
- ✅ Performance reports

**Timeline**: 2 days
**Responsible**: DevOps Engineer + AI Engineer

---

## Phase 8: Documentation and Knowledge Base (Week 5)

### Step 8.1: Discipline-Specific Documentation
**Objective**: Create comprehensive documentation for each discipline.

**Files Created**:
- `docs/disciplines/procurement-01900-guide.md`
- `docs/disciplines/logistics-02400-guide.md`
- `docs/disciplines/safety-02400-guide.md`
- `docs/disciplines/contracts-00400-guide.md`
- `docs/disciplines/contracts-00425-guide.md`
- `docs/disciplines/contracts-00435-guide.md`

**Documentation Includes**:
- Domain-specific terminology
- Common workflows and processes
- Best practices and patterns
- Integration guidelines
- Troubleshooting guides

**Timeline**: 3 days
**Responsible**: Technical Writer + Domain Experts

### Step 8.2: Agent Development Guide
**Objective**: Create guide for using discipline agents in agent generation.

**Files Created**:
- `docs/agent-generation/USING_DISCIPLINE_AGENTS.md`

**Content**:
- How to select discipline agent
- Query examples for each discipline
- Integration with agent generation platform
- Best practices for agent development

**Timeline**: 2 days
**Responsible**: Technical Writer

### Step 8.3: Knowledge Base Repository
**Objective**: Maintain updated knowledge base for each discipline.

**Files Created**:
- `deep-agents/knowledge-base/README.md`

**Features**:
- Version-controlled knowledge updates
- Contribution guidelines
- Update procedures
- Quality validation processes

**Timeline**: 2 days
**Responsible**: AI Engineer

---

## Deployment Strategy

### Staged Rollout
1. **Week 5**: Deploy to staging environment
2. **Week 6**: Deploy to production for internal testing
3. **Week 7**: Deploy to production for user access
4. **Week 8**: Monitor and optimize performance

### Rollback Plan
- Keep previous agent versions accessible
- Database migration rollback scripts
- Service restoration procedures

---

## Success Metrics

### Performance Metrics
- Response time: < 2 seconds for 95% of queries
- Success rate: > 90% accurate responses
- Availability: 99.9% uptime
- Throughput: Support 100+ concurrent users

### Quality Metrics
- Training data accuracy: > 95%
- Knowledge coverage: > 90% of discipline-specific topics
- User satisfaction: > 4.5/5 rating
- Adoption rate: > 80% of target users

### Business Metrics
- Agent development time: 50% reduction
- Time to market: 40% faster
- User engagement: 3x increase in platform usage
- Support tickets: 30% reduction

---

## Risk Management

### Technical Risks
- **Risk**: LoRA training failure
- **Mitigation**: Backup models, gradual rollout, A/B testing
- **Owner**: ML Engineer

### Operational Risks
- **Risk**: Service downtime during deployment
- **Mitigation**: Blue-green deployment, canary releases
- **Owner**: DevOps Engineer

### Knowledge Risks
- **Risk**: Insufficient training data
- **Mitigation**: Hybrid approach (database + manual curation)
- **Owner**: Data Engineer

### Integration Risks
- **Risk**: API compatibility issues
- **Mitigation**: API versioning, backward compatibility
- **Owner**: Backend Developer

---

## Training & Support

### Team Training
- **Developers**: 2-day workshop on deep-agents architecture
- **Data Engineers**: 1-day workshop on knowledge extraction
- **QA Engineers**: 1-day workshop on testing discipline agents
- **Operations**: 1-day workshop on monitoring and deployment

### User Training
- **Documentation**: Comprehensive user guides
- **Video tutorials**: Step-by-step agent creation guides
- **Live demos**: Weekly office hours for support
- **Community**: Discord/Slack channel for questions

---

## Success Criteria Validation

### Pre-Deployment Checklist
- [ ] All 6 discipline agents trained and validated
- [ ] Knowledge extraction complete and accurate
- [ ] Agent service integration tested
- [ ] Performance benchmarks met
- [ ] Security review passed
- [ ] Documentation complete
- [ ] Team training completed

### Post-Deployment Validation
- [ ] Agents accessible via agent-generation platform
- [ ] Query routing working correctly
- [ ] Performance meets targets
- [ ] User feedback positive
- [ ] Monitoring systems operational
- [ ] Support processes established

---

## Estimated Timeline & Resources

### Total Timeline: 6-8 Weeks
- **Weeks 1-2**: Specification & Knowledge Extraction (Data Engineer + AI Engineer)
- **Weeks 2-4**: Agent Implementation (Python Developer + AI Engineer)
- **Weeks 3-4**: Training Pipeline (ML Engineer)
- **Weeks 4-5**: Service Integration (Backend Developer)
- **Weeks 5-6**: Frontend Integration (Frontend Developer)
- **Weeks 5-7**: Testing & QA (QA Engineer)
- **Weeks 6-8**: Deployment & Monitoring (DevOps Engineer)

### Resource Requirements
- **Data Engineers**: 2 (part-time)
- **AI Engineers**: 2 (full-time)
- **ML Engineers**: 1 (full-time)
- **Python Developers**: 1 (full-time)
- **Backend Developers**: 1 (full-time)
- **Frontend Developers**: 1 (part-time)
- **QA Engineers**: 1 (full-time)
- **DevOps Engineers**: 1 (part-time)
- **Technical Writers**: 1 (part-time)

### Budget Estimate
- **Development**: 8 person-weeks
- **Infrastructure**: $500/month (GPU instances)
- **Training**: $200 (GPU hours)
- **Total**: ~$15,000-20,000

---

## Appendix

### A. Discipline Codes & Mapping
| Discipline | Code | Primary Tables | Key Pages |
|------------|------|----------------|-----------|
| Procurement | 01900 | procurement_orders, procurement_templates | procurement-workflow, supplier-management |
| Logistics | 01700 | contractor_vetting, logistics_documents | logistics-management, transport-planning |
| Safety | 02400 | safety_assessments, incident_reports | safety-management, compliance-checking |
| Contracts (General) | 00400 | contracts_table, delivery_schedules | contract-management, milestone-tracking |
| Contracts (Pre-Award) | 00425 | contract_lifecycle_data, approval_workflows | lifecycle-management, compliance-tracking |
| Contracts (Post-Award) | 00435 | contract_administration_records, audit_logs | admin-management, dispute-resolution |
| QS Measurement | 02025 | qs_measurements, drawing_data | drawing-measurements, cost-estimation |

### B. Technology Stack Details
- **Base Model**: Qwen/Qwen2.5-7B-Instruct (HuggingFace)
- **LoRA Adapters**: 6 adapters (one per discipline)
- **Deep-Agents**: Python-based ML agents
- **Database**: Supabase (PostgreSQL with pgvector)
- **Infrastructure**: AWS EC2 for deployment
- **Monitoring**: Prometheus + Grafana

### C. Reference Documents
1. `0000_AGENT_TYPE_SELECTION_PROCEDURE.md` - Agent type selection
2. `0000_SCALED_AGENT_GENERATION_PROCEDURE.md` - Scaled generation
3. `0000_WORKFLOW_AGENT_CENTRIC_PAGE_IMPLEMENTATION_PROCEDURE.md` - Workflow pages
4. `docs/schema/reports/0300_DATABASE_SCHEMA_MASTER_GUIDE.md` - Schema documentation
5. `docs/schema/code/extract-schema-openapi.js` - Schema extraction tool

---

**Document Complete** ✅

**Next Steps**:
1. Review this plan with the team
2. Assign resources and responsibilities
3. Begin Phase 1: Discipline Assessment
4. Set up project tracking (Jira/Asana)
5. Schedule weekly review meetings

---
**End of Implementation Plan**
