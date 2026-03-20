# Agent System Documentation

This document provides **COMPREHENSIVE documentation** for the agent system architecture, including agent definitions, tracking, relationships, and **advanced multi-category prompt management**.

## 📊 **EXECUTIVE SUMMARY - 2025 COMPLETED EXECUTION**

### **✅ COMPREHENSIVE AGENT SYSTEM ACHIEVEMENTS**

**Database Integration:**
- **32 agents** properly tracked in `agents_tracking` table (actual AI agent entities)
- **35+ agents** documented across various workflows and page prefixes
- **Single organization**: "Organisation - EPCM" for all agents

**📊 Why Different Numbers?**
- `agents_tracking` = Actual agent software entities (some may share prompts or use no specialized prompts)
- `prompts` = Reusable prompt templates for content processing tasks (agents may use multiple or none)

**Prompt Management System:**
- **27 agent prompts** with **true multi-category support** (reusable prompt templates)
- **11 disciplines** represented (HR, Finance, Operations, Safety, Procurement, etc.)
- **Comma-separated category fields** (e.g., "Agent, HR"; "Agent, Safety, Contractor Vetting")

**Multi-Category Implementation:**
- ✅ **TRUE multi-category** (not single categories or tags)
- ✅ **Discipline-specific organization** (every agent belongs to specific discipline)
- ✅ **Query flexibility** across organizational boundaries
- ✅ **No duplication** - integrated with existing `prompts` table

**Scripts & Maintenance:**
- 5 automated scripts for agent/prompt population and management
- Complete synchronization between codebase and database
- Future-proof maintenance capability

## 🧠 **ADVANCED PROMPT MANAGEMENT SYSTEM**

### **Multi-Category Architecture**
**True Multi-Category Support**: Unlike traditional single-category systems, agent prompts use **comma-separated category fields** to support multiple simultaneous classifications.

**Example Category Formats:**
- `"Agent"` → Basic agent prompt
- `"Agent, HR"` → HR-focused agent prompt
- `"Agent, Safety"` → Safety-focused agent prompt
- `"Agent, Architectural, Contracts"` → Multi-specialty agent prompt

### **Prompt Retrieval System**
**Service Integration**: All agent prompts are accessible through `PromptsService.getPromptByKey()`

```javascript
// Example retrieval for agent prompts
const hrPrompt = await PromptsService.getPromptByKey('hr_recruitment_assistant_system');
const safetyPrompt = await PromptsService.getPromptByKey('safety_image_analysis_system');
```

### **Query Capabilities with Multi-Category**

```sql
-- Find ALL agent prompts (regardless of discipline)
SELECT * FROM prompts WHERE category LIKE '%Agent%'

-- Find agent prompts for specific discipline
SELECT * FROM prompts WHERE category = 'Agent, HR'
SELECT * FROM prompts WHERE category = 'Agent, Safety'

-- Find prompts that serve ANY discipline
SELECT * FROM prompts WHERE category LIKE '%HR%'
SELECT * FROM prompts WHERE category LIKE '%Safety%'

-- Find multi-category specialized prompts
SELECT * FROM prompts WHERE category LIKE '%, %, %'
```

### **Prompt Categories by Discipline**

| **Category Field** | **Count** | **Description** |
|-------------------|-----------|-----------------|
| **Agent, HR** | 4 | Human Resources (Recruitment, CV Processing) |
| **Agent, Safety** | 4 | Health & Safety (Inspections, Image Analysis) |
| **Agent, Finance** | 1 | Financial Analysis |
| **Agent, Operations** | 1 | Stock Management |
| **Agent, Administration** | 1 | Email Management |
| **Agent, Procurement** | 3 | Supplier Analysis |
| **Agent, Contractor Vetting** | 4 | Contractor Evaluation |
| **Agent, Architectural** | 5 | Drawing Analysis |
| **Agent, Contracts** | 2 | Correspondence Analysis |
| **Agent, Architectural, Contracts** | 2 | Dual-purpose Analysis |

**Total**: **27 agent prompts** with true multi-category support

### **Integration with Existing Prompts Table**
**No New Tables**: Uses existing production `prompts` table (no duplication)
**Backward Compatibility**: Existing prompts maintain their categories
**Enhanced Organization**: Agent prompts get additional "Agent" categorization
**Database Schema**: Leverages existing fields (category, tags, key, etc.)

## 🔧 **AUTOMATED MANAGEMENT SCRIPTS**

### **Available Scripts**

| **Script Name** | **Purpose** | **Function** |
|-----------------|-------------|--------------|
| `update-agents-tracking-with-comprehensive-agents.js` | Agent Database Sync | Syncs 32 agents from codebase to `agents_tracking` table |
| `populate-agent-prompts-in-prompts-management.js` | Initial Prompt Population | Adds 11 core agent prompts to `prompts` table |
| `update-agent-prompt-tags.js` | Tag-Based Multi-Category | Adds "agent" tags to existing agent-related prompts |
| `implement-true-multi-category.js` | True Multi-Category | Updates category fields to comma-separated format |
| `fix-core-agent-multi-category.js` | Discipline Assignment | Assigns discipline categories to core agent prompts |

### **Script Execution Order**
```bash
# 1. Sync agents to database
node scripts/update-agents-tracking-with-comprehensive-agents.js

# 2. Populate core agent prompts
node scripts/populate-agent-prompts-in-prompts-management.js

# 3. Add agent tags to existing prompts
node scripts/update-agent-prompt-tags.js

# 4. Implement true multi-category format
node scripts/implement-true-multi-category.js

# 5. Final discipline assignment
node scripts/fix-core-agent-multi-category.js
```

## Overview

The system maintains **two distinct agent-related tables** with different purposes and data structures, supporting a sophisticated AI agent ecosystem across the EPCM platform.

**⚠️ IMPORTANT UPDATE**: `agents_tracking` is now the **single source of truth** for agent names. The `agent_names` table has been deprecated in favor of using actual agent implementations derived from the codebase.

## Table Structure

### 1. agents_tracking (Single Source of Truth)
**Purpose**: Tracks **individual AI agents** with detailed operational context across the EPCM platform  
**Columns**:
- id (uuid) - Primary key
- agent_name (text) - Specific agent name (e.g., "Construction AI Assistant")
- company (text) - Organization (e.g., "ConstructAI")
- sector (text) - Sector specialization (e.g., "Engineering Procurement Construction Management")
- organization (text) - **Single organization**: "Organisation - EPCM" (all agents)
- phase (text) - Project phase (e.g., "Planning", "Execution", "Pre-Award", "All Phases")
- page_id (uuid) - Foreign key to pages (nullable)
- page_name (text) - Page name (e.g., "Contracts Post Award", "Director Finance")
- page_prefix (text) - Page routing prefix (e.g., "00435", "00889", "03010")
- contributor_id (uuid) - Foreign key to contributors (nullable)
- created_at (timestamp) - Creation time
- updated_at (timestamp) - Last update time
- is_active (boolean) - Active status
- notes (text) - Detailed description
- last_used (timestamp) - Last usage time

**Data Type**: **Individual AI agent instances** - Contains specific AI agents with operational context

**✅ COMPREHENSIVE AGENT CATALOG** (35+ agents total across various workflows - all under Organisation - EPCM):

### 00300 - Construction (2 agents)
- **Construction Progress Agent** - Tracks construction progress using AI
- **Construction Safety Agent** - Analyzes safety data and generates reports

### 00435 - Contracts Post Award (7 agents)
- **Legal Analysis Agent** - Analyzes legal documents using LangChain
- **Financial Analysis Agent** - Performs financial analysis on contracts
- **Contract Analysis Agent** - Comprehensive contract analysis using Flowise AI
- **Contract Notifications Agent** - Automated notifications via n8n workflows
- **Correspondence Reply Agent** - AI-powered correspondence generation
- **Minutes Compile Agent** - Compiles meeting minutes from transcripts
- **Drawings Analysis Agent** - Analyzes technical drawings and specifications

### 00889 - Director Finance (3 agents)
- **Finance Minutes Compile Agent** - Compiles financial meeting minutes
- **Method Statement Agent** - Generates method statements for financial processes
- **Finance Risk Assessment Agent** - Performs financial risk assessments

### 01200 - Finance (1 agent)
- **Financial Analysis Agent** - Generic financial analysis agent

### 01400 - Health (1 agent)
- **Health Inspection Agent** - Performs health and safety inspections

### 01500 - Human Resources (1 agent)
- **CV Processing Agent** - Processes and vets CVs for candidate evaluation (Template A pages for CV vetting)

### 01800 - Operations (1 agent)
- **Stock Management Agent** - Manages inventory and stock levels

### 01900 - Procurement (1 agent)
- **Supplier Analysis Agent** - Analyzes supplier capabilities and performance

### 02400 - Safety - Contractor Vetting (6 agents)
- **Contractor Vetting Base Agent** - Base agent for contractor vetting workflows
- **Financial Analysis Agent** - Analyzes contractor financial documents
- **Licensing Analysis Agent** - Reviews contractor licensing and certifications
- **Quality Analysis Agent** - Evaluates contractor quality management systems
- **Safety Analysis Agent** - Assesses contractor safety protocols
- **Performance Analysis Agent** - Analyzes contractor performance history

### 02400 - Safety - General (3 agents)
- **Safety Image Analysis Agent** - Processes safety-related images and documentation
- **Video Analysis Agent** - Analyzes safety-related video content
- **Safety Inspection Agent** - Performs safety inspections

### 03010 - Email Management (5 agents)
- **Email Categorization Agent** - Auto-categorizes emails by type/priority
- **Email Auto Response Agent** - Generates automated email responses
- **Email AI Search Agent** - AI-powered email archive search
- **Email AI Tools Agent** - AI-powered email management tools
- **Email Bulk AI Tools Agent** - Bulk email processing with AI

### 2. agent_modal_assignments (Updated)
**Purpose**: Links actual agents to specific modal configurations and pages  
**Columns**:
- id (integer) - Primary key
- agent_name (text) - **Direct agent name** from agents_tracking (no foreign key)
- modal_configuration_id (uuid) - Foreign key to modal_configurations
- page_id (uuid) - Foreign key to pages
- created_at (timestamp) - Creation time
- updated_at (timestamp) - Last update time
- last_used (timestamp) - Last usage timestamp

**Data Type**: **Direct relationship mapping** - Maps actual agents to modals

### 3. agent_names_deprecated (Legacy - Deprecated)
**Status**: **DEPRECATED** - This table has been renamed to `agent_names_deprecated`
**Reason**: Contains generic categories that don't reflect actual agent implementations
**Migration**: All functionality now uses `agents_tracking.agent_name` directly

## Multi-Organization Support Architecture

**Current Implementation**: All pages and agents are assigned to **"Organisation - EPCM"** as the single organization.

**Future Enhancement**: Pages can be configured to support multiple organizations through:
- **Page-to-Organization mapping table** (many-to-many relationship)
- **Organization-specific agent configurations**
- **Cross-organization agent sharing**

## Table Relationship Summary (Updated)

| Table | Purpose | Data Granularity | Status |
|-------|---------|------------------|--------|
| **agents_tracking** | Individual AI agents | Specific instances | ✅ **ACTIVE - Single Source of Truth** |
| **agent_modal_assignments** | Agent-to-modal mappings | Direct relationships | ✅ **ACTIVE - Updated Structure** |
| **agent_names_deprecated** | Legacy categories | Generic definitions | ❌ **DEPRECATED** |

## Agent Source of Truth

**✅ agents_tracking is now the authoritative source** for:
- Agent names and definitions
- Agent-to-page mappings
- Agent operational context
- Modal associations

**All agent names are derived from actual file implementations** across various workflows and page prefixes (not limited to "03" state prefixes), ensuring consistency between the database and the codebase.

## Migration Summary

**✅ COMPLETED 2025-07-22:**
- ✅ Established `agents_tracking` as single source of truth
- ✅ Deprecated `agent_names` table (renamed to `agent_names_deprecated`)
- ✅ Updated `agent_modal_assignments` to use direct agent names
- ✅ Created unified agent view (`agents_unified`)
- ✅ All agents mapped to actual file implementations across various page prefixes
- ✅ **Updated organization field to use single "Organisation - EPCM"**
- ✅ Removed generic/test agent names

## Usage Guidelines

**For new agent additions:**
1. Add the agent to `agents_tracking` with actual implementation details
2. Ensure the agent name matches the corresponding file implementation and prefix numbering
3. Update `agent_modal_assignments` to link the agent to relevant modals

**For queries:**
- Use `agents_tracking` for agent definitions
- Use `agents_unified` view for complete agent information including modal assignments
- Do not use `agent_names_deprecated` (legacy table)

## Maintenance Notes

### **Current System Status (Complete)**
- ✅ **32 agents** tracked in `agents_tracking` table with "Organisation - EPCM"
- ✅ **27 agent prompts** in `prompts` table with true multi-category support
- ✅ **No duplication** - all prompts in existing production table
- ✅ **Fully automated** maintenance through 5 management scripts
- ✅ **Comprehensive documentation** reflecting actual implementations

### **Script Maintenance**
```bash
# Run scripts in this order for future agent/prompt additions:
node scripts/update-agents-tracking-with-comprehensive-agents.js      # Sync agents
node scripts/populate-agent-prompts-in-prompts-management.js       # Add new prompts
node scripts/update-agent-prompt-tags.js                           # Tag existing prompts
node scripts/implement-true-multi-category.js                     # Multi-category format
node scripts/fix-core-agent-multi-category.js                     # Discipline assignments
```

### **Query Reference for Development**
```sql
-- Find agent prompts by discipline
SELECT * FROM prompts WHERE category LIKE '%Agent%' AND category LIKE '%HR%'

-- Find multi-discipline agents
SELECT * FROM prompts WHERE category LIKE '%, %, %'

-- Get all agents for page development
SELECT agent_name, page_prefix FROM agents_tracking WHERE is_active = true
```

This documentation should be updated whenever:
- New agents are added to the system (**run sync script**)
- Agent definitions are modified (**update agents_tracking table**)
- Organization assignments change (**update organization field**)
- New pages are integrated with agents (**update page relationships**)
- Multi-organization support is implemented (**extend organization mapping**)

### **Final Achievement Summary**
🎯 **2025 Complete Agent System Integration**
- **Database**: 32 agents synchronized across workflows
- **Prompts**: 27 agent prompts with true multi-category support
- **Architecture**: No duplication, scalable maintenance scripts
- **Organization**: All agents under "Organisation - EPCM" framework
- **Documentation**: Comprehensive system documentation complete
