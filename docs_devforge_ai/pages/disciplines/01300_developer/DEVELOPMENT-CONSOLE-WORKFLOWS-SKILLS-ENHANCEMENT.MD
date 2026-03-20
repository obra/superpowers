# Development Console & Code Analysis: Workflows & Skills Enhancement

**Feature Enhancement Plan**  
**Date:** January 29, 2026  
**Page:** http://localhost:3060/#/information-technology/development-console  
**Status:** Planning Complete - Ready for Implementation

---

## Executive Summary

This plan enhances the Development Console & Code Analysis page to become a comprehensive development and quality assurance hub by integrating three major capabilities:

1. **Enhanced UI & Code Pattern Analysis** - Extended consistency checking
2. **Workflows Runner** - Execute Cline workflows with role-based access control
3. **Skills Runner** - Execute development skills with interactive prompts
4. **Standalone Actions** - Quick-action buttons and cards for common tasks

All features include robust **Role-Based Access Control (RBAC)** to ensure developers have full system access while discipline users can only modify their assigned disciplines.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Feature Overview](#feature-overview)
3. [Architecture & Design](#architecture--design)
4. [Role-Based Access Control](#role-based-access-control)
5. [UI/UX Design](#uiux-design)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Implementation](#frontend-implementation)
8. [Implementation Phases](#implementation-phases)
9. [Testing Strategy](#testing-strategy)
10. [Security Considerations](#security-considerations)
11. [Future Enhancements](#future-enhancements)

---

## Current State Analysis

### Existing Implementation

**Location:** `construct_ai/client/src/pages/02050-development-console/`

**Current Features:**
- Mock UI consistency analysis across 47 EPCM disciplines
- Dashboard with health scores, findings, and recommendations
- Export functionality for analysis results
- Clean React implementation with minimal dependencies

**Existing Infrastructure:**
- `workflowExecutionService.js` - Service for loading/executing workflows
- `.clinerules/workflows/` - Directory containing 20+ workflow definitions
- Workflow execution tracking and state management
- No existing skills infrastructure

### Gaps & Requirements

**Missing Features:**
1. Code pattern analysis (only UI analysis exists)
2. UI for executing workflows (service exists but no UI integration)
3. Skills system (completely new)
4. Role-based access control
5. Standalone action buttons/cards
6. Real-time execution progress tracking
7. Execution history and audit logging

---

## Feature Overview

### Section 1: Enhanced UI & Code Pattern Analysis

**Current:** UI consistency checking only  
**Enhanced:** UI + code pattern consistency

#### New Analysis Capabilities

1. **File Organization Analysis**
   - Directory structure consistency
   - File naming conventions
   - Component placement patterns

2. **Code Pattern Analysis**
   - Import statement ordering
   - State management patterns
   - Component composition patterns
   - API integration patterns
   - Error handling consistency

3. **Code Quality Metrics**
   - Code duplication detection
   - Best practices adherence
   - ESLint rule compliance
   - Performance anti-patterns

4. **Enhanced Scoring**
   ```
   Overall Health Score = (UI Score + Code Score) / 2
   
   UI Score Components:
   - Component structure (25%)
   - Styling patterns (25%)
   - Layout consistency (25%)
   - Navigation structure (25%)
   
   Code Score Components:
   - File organization (20%)
   - Naming conventions (20%)
   - Code patterns (30%)
   - Best practices (30%)
   ```

#### Technical Implementation

**Tools:**
- `@babel/parser` - Parse JavaScript/JSX to AST
- `@babel/traverse` - Navigate and analyze AST
- `@babel/types` - Type checking for AST nodes
- `eslint` - Leverage existing linting infrastructure

**Analysis Service:**
```javascript
// server/src/services/codePatternAnalysisService.js
class CodePatternAnalysisService {
  async analyzeAllDisciplines() {
    // Scan all discipline directories
    // Parse files to AST
    // Extract patterns
    // Compare against standards
    // Generate scores and findings
  }
  
  async analyzeSingleDiscipline(disciplineCode) {
    // Discipline-specific analysis
    // Used by discipline users
  }
}
```

---

### Section 2: Workflows Runner

**Purpose:** Execute Cline workflows from the UI with full parameter support

#### Workflow Categories

1. **Development** (Developer-only)
   - Create new workflow
   - Create new discipline page
   - Replicate agent across disciplines

2. **UI Components** (All users, discipline-restricted)
   - Add chatbot to page
   - Create table with AI enhancement
   - Fix buttons on discipline pages

3. **Page Management** (Developer-only)
   - Create new simple page
   - Insert page into accordion
   - Add page to discipline

#### Workflow Metadata Structure

```javascript
{
  name: 'add-chatbot-to-page',
  title: 'Add Chatbot to Page',
  description: 'Add chatbot component to existing pages',
  category: 'UI Components',
  
  // Access Control
  accessLevel: 'all' | 'developer-only' | 'discipline-user',
  scope: 'cross-discipline' | 'discipline-specific' | 'system',
  allowedDisciplines: 'all' | ['01900', '02050', ...],
  requiredRole: 'developer' | 'user' | 'all',
  
  // Execution Info
  estimatedDuration: 30, // seconds
  lastRun: '2026-01-28T10:30:00Z',
  successRate: 95.5, // percentage
  
  // Parameters
  parameters: [
    {
      name: 'page-slug',
      type: 'string',
      required: true,
      description: 'The page identifier',
      validation: /^[0-9]{5}-[a-z-]+$/
    },
    {
      name: 'position',
      type: 'select',
      required: false,
      options: ['bottom-right', 'bottom-left', 'custom'],
      default: 'bottom-right'
    }
  ]
}
```

#### Workflow Execution Flow

```
1. User clicks [Run] on workflow card
   ↓
2. Modal opens with parameter form
   ↓
3. User fills parameters (validated client-side)
   ↓
4. User clicks [Execute Workflow]
   ↓
5. Backend validates permissions & parameters
   ↓
6. Workflow starts, progress modal shows
   ↓
7. Real-time updates via polling (500ms intervals)
   ↓
8. Completion: Success/Failure modal
   ↓
9. Result logged to execution history
```

---

### Section 3: Skills Runner

**Purpose:** Execute interactive development skills with multi-step prompts

#### Skill Characteristics

Unlike workflows (which are automated processes), skills are interactive:
- Can ask user questions during execution
- Support multi-step wizards
- Adapt based on user responses
- More conversational and flexible

#### Skill Categories

1. **Code Analysis**
   - Analyze code patterns
   - Detect anti-patterns
   - Security audit
   - Performance analysis

2. **Code Generation**
   - Generate boilerplate
   - Create CRUD components
   - Generate API routes

3. **Refactoring**
   - Extract shared components
   - Optimize imports
   - Update deprecated patterns

#### Skill Structure

```javascript
// .clinerules/skills/analyze-code-patterns.js
export default class AnalyzeCodePatternsSkill {
  metadata = {
    name: 'analyze-code-patterns',
    title: 'Analyze Code Patterns',
    category: 'Code Analysis',
    accessLevel: 'all',
    scope: 'discipline-specific'
  };
  
  // Interactive question flow
  async getQuestions(context) {
    return [
      {
        id: 'analysis-type',
        type: 'select',
        question: 'What type of analysis?',
        options: [
          'Consistency Check',
          'Best Practices Review',
          'Performance Analysis',
          'Security Audit'
        ]
      },
      {
        id: 'target-disciplines',
        type: 'multi-select',
        question: 'Which disciplines?',
        options: context.user.role === 'developer' 
          ? allDisciplines 
          : [context.user.discipline],
        dependsOn: 'analysis-type'
      }
    ];
  }
  
  async execute(answers, context) {
    // Execute based on user answers
    // Return results
  }
}
```

#### Skills Directory Structure

```
.clinerules/skills/
├── analyze-code-patterns.js
├── analyze-code-patterns.md
├── generate-boilerplate.js
├── generate-boilerplate.md
├── extract-shared-component.js
├── extract-shared-component.md
└── README.md
```

---

### Section 4: Standalone Actions

**Purpose:** Quick-action buttons for common tasks without workflow overhead

#### Implementation Types

**1. Standalone Buttons**
- Single action buttons
- No parameter input needed
- Immediate execution
- Minimal confirmation

**2. Action Cards**
- Grouped related actions
- Visual card layout
- Can contain multiple buttons
- Optional descriptions

#### Configuration System

```javascript
// client/src/config/standalone-actions.config.js
export const standaloneActions = {
  'ui-analysis': [
    {
      id: 'quick-analyze',
      type: 'button',
      label: 'Quick Analyze',
      icon: '⚡',
      description: 'Run analysis with default settings',
      variant: 'primary',
      action: 'runQuickAnalysis',
      accessLevel: 'all',
      confirm: false
    },
    {
      id: 'refresh-data',
      type: 'button',
      label: 'Refresh Data',
      icon: '🔄',
      variant: 'secondary',
      action: 'refreshAnalysisData',
      accessLevel: 'all',
      confirm: true,
      confirmMessage: 'This will reload all analysis data. Continue?'
    }
  ],
  
  'workflows': [
    {
      id: 'common-workflows',
      type: 'card',
      title: 'Quick Start Workflows',
      description: 'Frequently used workflows',
      items: [
        {
          id: 'quick-chatbot',
          label: 'Add Chatbot',
          icon: '🤖',
          action: 'executeWorkflow',
          params: { workflow: 'add-chatbot-to-page' },
          accessLevel: 'all'
        },
        {
          id: 'quick-table',
          label: 'Create Table',
          icon: '📊',
          action: 'executeWorkflow',
          params: { workflow: 'create-table-with-ai-enhancement' },
          accessLevel: 'all'
        }
      ]
    }
  ],
  
  'developer-tools': [
    {
      id: 'dev-tools',
      type: 'card',
      title: 'Developer Utilities',
      items: [
        {
          id: 'clear-cache',
          label: 'Clear Cache',
          icon: '🗑️',
          action: 'clearApplicationCache',
          accessLevel: 'developer-only',
          confirm: true
        },
        {
          id: 'rebuild-indexes',
          label: 'Rebuild Search Indexes',
          icon: '🔧',
          action: 'rebuildIndexes',
          accessLevel: 'developer-only',
          confirm: true
        }
      ]
    }
  ]
};
```

#### Action Handlers

```javascript
// client/src/services/standaloneActionService.js
class StandaloneActionService {
  async executeAction(actionId, config, context) {
    // Check permissions
    if (!this.checkAccess(config, context.user)) {
      throw new Error('Access denied');
    }
    
    // Show confirmation if needed
    if (config.confirm) {
      const confirmed = await this.showConfirmation(
        config.confirmMessage || 'Are you sure?'
      );
      if (!confirmed) return;
    }
    
    // Execute action
    const result = await this.handlers[config.action](
      config.params,
      context
    );
    
    return result;
  }
  
  handlers = {
    runQuickAnalysis: async () => { /* ... */ },
    refreshAnalysisData: async () => { /* ... */ },
    clearApplicationCache: async () => { /* ... */ },
    executeWorkflow: async (params) => { /* ... */ }
  };
}
```

---

## Role-Based Access Control

### User Roles

#### Developer Role
```javascript
{
  role: 'developer',
  permissions: {
    workflows: 'all',
    skills: 'all',
    disciplines: 'all',
    analysis: 'cross-discipline',
    modifications: 'system-wide'
  }
}
```

**Access:**
- ✅ All workflows
- ✅ All skills
- ✅ All disciplines
- ✅ Cross-discipline operations
- ✅ System modifications

#### Discipline User Role
```javascript
{
  role: 'discipline-user',
  discipline: '01900',
  permissions: {
    workflows: 'allowed-only',
    skills: 'allowed-only',
    disciplines: ['01900'],
    analysis: 'discipline-only',
    modifications: 'discipline-only'
  }
}
```

**Access:**
- ✅ Allowed workflows for their discipline
- ✅ Allowed skills for their discipline
- ❌ Cross-discipline workflows
- ❌ System-wide modifications
- ✅ View their discipline's analysis only

### Permission Matrix

| Feature | Developer | Discipline User |
|---------|-----------|-----------------|
| UI Analysis (All Disciplines) | ✅ | ❌ |
| UI Analysis (Own Discipline) | ✅ | ✅ |
| Code Analysis (All Disciplines) | ✅ | ❌ |
| Code Analysis (Own Discipline) | ✅ | ✅ |
| Execute System Workflows | ✅ | ❌ |
| Execute Discipline Workflows | ✅ | ✅ (own only) |
| Execute All Skills | ✅ | ❌ |
| Execute Allowed Skills | ✅ | ✅ (own only) |
| View Execution History (All) | ✅ | ❌ |
| View Execution History (Own) | ✅ | ✅ |
| Standalone Actions (System) | ✅ | ❌ |
| Standalone Actions (Allowed) | ✅ | ✅ |

### Backend Authorization Middleware

```javascript
// server/src/middleware/workflowAuthMiddleware.js
const checkWorkflowAccess = async (req, res, next) => {
  const { workflowName } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const userDiscipline = req.user.discipline_code;

  try {
    // Get workflow metadata
    const workflow = await getWorkflowMetadata(workflowName);
    
    // Check developer access
    if (userRole === 'developer') {
      return next(); // Developers have full access
    }
    
    // Check discipline user access
    if (userRole === 'discipline-user') {
      // Check if workflow allows discipline users
      if (workflow.accessLevel === 'developer-only') {
        return res.status(403).json({ 
          error: 'This workflow requires developer access' 
        });
      }
      
      // Check discipline scope
      if (workflow.scope === 'discipline-specific') {
        const allowed = workflow.allowedDisciplines === 'all' ||
                       workflow.allowedDisciplines.includes(userDiscipline);
        
        if (!allowed) {
          return res.status(403).json({ 
            error: 'This workflow is not available for your discipline' 
          });
        }
      }
      
      // For cross-discipline workflows, deny access
      if (workflow.scope === 'cross-discipline' || workflow.scope === 'system') {
        return res.status(403).json({ 
          error: 'Cross-discipline operations require developer access' 
        });
      }
    }
    
    // Grant access
    next();
    
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = { checkWorkflowAccess };
```

### Frontend Permission Filtering

```javascript
// client/src/services/permissionService.js
class PermissionService {
  constructor() {
    this.currentUser = null;
  }
  
  async initialize() {
    this.currentUser = await this.fetchCurrentUser();
  }
  
  filterWorkflows(workflows) {
    const { role, discipline } = this.currentUser;
    
    return workflows.filter(workflow => {
      // Developers see everything
      if (role === 'developer') return true;
      
      // Discipline users see allowed workflows
      if (role === 'discipline-user') {
        // Must not be developer-only
        if (workflow.accessLevel === 'developer-only') return false;
        
        // Must be discipline-specific or allowed for all
        if (workflow.scope === 'discipline-specific') {
          return workflow.allowedDisciplines === 'all' ||
                 workflow.allowedDisciplines.includes(discipline);
        }
        
        // System and cross-discipline not allowed
        return false;
      }
      
      return false;
    });
  }
  
  filterAnalysisResults(results) {
    const { role, discipline } = this.currentUser;
    
    if (role === 'developer') {
      return results; // All results
    }
    
    if (role === 'discipline-user') {
      // Filter to only their discipline
      return {
        ...results,
        findings: results.findings.filter(f => 
          f.disciplineCode === discipline
        ),
        recommendations: results.recommendations.filter(r =>
          r.disciplineCode === discipline
        )
      };
    }
    
    return null;
  }
  
  canAccess(feature, targetDiscipline = null) {
    const { role, discipline } = this.currentUser;
    
    if (role === 'developer') return true;
    
    if (role === 'discipline-user') {
      if (targetDiscipline) {
        return targetDiscipline === discipline;
      }
      return feature.accessLevel !== 'developer-only';
    }
    
    return false;
  }
}

export default new PermissionService();
```

### Database Schema

```sql
-- Add RBAC columns to workflow metadata
ALTER TABLE workflow_metadata ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'all';
ALTER TABLE workflow_metadata ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'discipline-specific';
ALTER TABLE workflow_metadata ADD COLUMN IF NOT EXISTS allowed_disciplines JSONB DEFAULT '[]';
ALTER TABLE workflow_metadata ADD COLUMN IF NOT EXISTS required_role VARCHAR(50) DEFAULT 'all';

-- Add RBAC columns to skill metadata
CREATE TABLE IF NOT EXISTS skill_metadata (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  access_level VARCHAR(50) DEFAULT 'all',
  scope VARCHAR(50) DEFAULT 'discipline-specific',
  allowed_disciplines JSONB DEFAULT '[]',
  required_role VARCHAR(50) DEFAULT 'all',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Execution audit log
CREATE TABLE IF NOT EXISTS execution_audit_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  user_discipline VARCHAR(10),
  execution_type VARCHAR(50) NOT NULL, -- 'workflow' | 'skill' | 'standalone'
  item_name VARCHAR(255) NOT NULL,
  parameters JSONB,
  result VARCHAR(50), -- 'success' | 'failed' | 'cancelled'
  error_message TEXT,
  access_granted BOOLEAN DEFAULT true,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_audit_user ON execution_audit_log(user_id);
CREATE INDEX idx_audit_type ON execution_audit_log(execution_type);
CREATE INDEX idx_audit_created ON execution_audit_log(created_at DESC);
```

---

## UI/UX Design

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Development Console & Code Analysis         │
│ Role: Developer | Access: All Disciplines                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┬────────────┬────────────┐                   │
│  │ UI & Code  │  Workflows │   Skills   │                   │
│  │  Analysis  │            │            │                   │
│  └────────────┴────────────┴────────────┘                   │
│                                                              │
│  [Tab Content Area]                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tab 1: UI & Code Analysis

```
┌──────────────────────────────────────────────────────────────┐
│ Standalone Actions:  [⚡ Quick Analyze] [🔄 Refresh Data]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Overall Health Score: 72%                                   │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  UI Score   │  │ Code Score  │  │  Findings   │        │
│  │    70%      │  │     74%     │  │     26      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  Analyzed: 47 disciplines | Duration: 3.2s                   │
│                                                              │
│  [View Findings] [View Recommendations] [Export Report]     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tab 2: Workflows

```
┌──────────────────────────────────────────────────────────────┐
│ Search: [____________]  Category: [All ▼]  [View History]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Quick Start Workflows                                       │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │ 🤖 Add Chatbot     │  │ 📊 Create Table    │           │
│  │ Quick add chatbot  │  │ AI-enhanced table  │           │
│  │       [Run]        │  │       [Run]        │           │
│  └────────────────────┘  └────────────────────┘           │
│                                                              │
│  Development Workflows                                       │
│  ┌──────────────────────────────────────────────┐          │
│  │ Create New Workflow                   [Run] │          │
│  │ Guide for creating standardized workflows    │          │
│  │ Last run: Never | Developer only              │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  UI Components                                               │
│  ┌──────────────────────────────────────────────┐          │
│  │ Add Chatbot to Page                   [Run] │          │
│  │ Add chatbot component to existing pages       │          │
│  │ Last run: 2 days ago | Success: 95%           │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Workflow Execution Modal

```
┌──────────────────────────────────────────────────────────────┐
│ Execute: Add Chatbot to Page                         [×]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Configuration:                                              │
│                                                              │
│  Page Slug: *                                               │
│  ┌──────────────────────────────────────────────┐          │
│  │ 01900-procurement                              │          │
│  └──────────────────────────────────────────────┘          │
│  The page identifier (e.g., 01900-procurement)              │
│                                                              │
│  Chatbot Type: *                                            │
│  ┌──────────────────────────────────────────────┐          │
│  │ chatbot-base                            [▼]  │          │
│  └──────────────────────────────────────────────┘          │
│  Options: chatbot-base, flowise, page-specific              │
│                                                              │
│  Position:                                                  │
│  ┌──────────────────────────────────────────────┐          │
│  │ bottom-right                            [▼]  │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Estimated duration: ~30 seconds                             │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │           [Cancel]  [Execute Workflow]        │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Execution Progress Modal

```
┌──────────────────────────────────────────────────────────────┐
│ Executing: Add Chatbot to Page                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Status: Running...                                          │
│                                                              │
│  Progress: ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 60%                         │
│                                                              │
│  Execution Log:                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ ✅ Parameters validated                       │          │
│  │ ✅ Validating page existence...               │          │
│  │ ✅ Checking chatbot requirements...           │          │
│  │ ✅ Adding chatbot component...                │          │
│  │ 🔄 Configuring chatbot styling...             │          │
│  │ ⏳ Updating page imports...                   │          │
│  │ ⏸️ Testing chatbot integration...            │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Time elapsed: 18s | Estimated remaining: 12s                │
│                                                              │
│                              [Cancel Execution]             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tab 3: Skills

```
┌──────────────────────────────────────────────────────────────┐
│ Search: [____________]  Category: [All ▼]  [View History]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Code Analysis                                               │
│  ┌──────────────────────────────────────────────┐          │
│  │ Analyze Code Patterns                 [Run] │          │
│  │ Detect and analyze code consistency patterns │          │
│  │ Last run: 3 days ago | Success: 92%           │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Code Generation                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │ Generate Boilerplate                  [Run] │          │
│  │ Generate standard code templates              │          │
│  │ Never run                                     │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Refactoring                                                 │
│  ┌──────────────────────────────────────────────┐          │
│  │ Extract Shared Component              [Run] │          │
│  │ Extract reusable components from code         │          │
│  │ Last run: 1 week ago | Success: 88%           │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Skill Execution Modal (Multi-Step)

```
┌──────────────────────────────────────────────────────────────┐
│ Execute: Analyze Code Patterns                       [×]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1 of 3: Select Analysis Type                          │
│                                                              │
│  What type of analysis would you like to perform?           │
│                                                              │
│  ◉ Consistency Check                                        │
│     Verify code follows consistent patterns                 │
│                                                              │
│  ○ Best Practices Review                                    │
│     Check adherence to coding standards                     │
│                                                              │
│  ○ Performance Analysis                                     │
│     Identify performance bottlenecks                        │
│                                                              │
│  ○ Security Audit                                           │
│     Scan for security vulnerabilities                       │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │                    [Cancel]  [Next]           │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Execution History View

```
┌──────────────────────────────────────────────────────────────┐
│ Execution History                               [← Back]    │
├──────────────────────────────────────────────────────────────┤
│ Filter: [All ▼]  Status: [All ▼]  Search: [________]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Today                                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Add Chatbot to Page          2:30 PM  ✅ Success│   │
│  │ Duration: 5.2s | Parameters: {pageSlug: '01900'}    │
│  │ [View Logs] [View Details] [Rerun]                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Analyze Code Patterns        1:15 PM  ✅ Success│   │
│  │ Duration: 42.8s | Skill execution                   │
│  │ [View Logs] [View Details] [Rerun]                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Yesterday                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Create Table with AI          5:45 PM  ❌ Failed │   │
│  │ Duration: 8.1s | Error: Invalid table name          │
│  │ [View Logs] [View Details] [Rerun]                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture & Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │   UI & Code    │  │   Workflows    │  │    Skills    │ │
│  │    Analysis    │  │     Runner     │  │    Runner    │ │
│  │   Component    │  │   Component    │  │  Component   │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Permission Service (RBAC Filtering)           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Workflow/Skill Execution Service               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         API Requests
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Authorization Middleware (RBAC)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Workflows   │  │    Skills    │  │   Standalone    │  │
│  │  API Routes  │  │  API Routes  │  │   Actions API   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Code Pattern │  │  Workflow    │  │     Skill       │  │
│  │   Analysis   │  │  Execution   │  │   Execution     │  │
│  │   Service    │  │   Service    │  │    Service      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Audit Logging Service                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         Database Queries
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                        Database Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Workflow    │  │     Skill    │  │    Execution    │  │
│  │   Metadata   │  │   Metadata   │  │   Audit Log     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Row-Level Security (RLS) Policies              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Workflow Execution Flow

```
User Action
    ↓
UI Component (Permission Check)
    ↓
Workflow Execution Service
    ↓
POST /api/workflows/:name/execute
    ↓
Authorization Middleware (RBAC Check)
    ↓
Workflow API Route
    ↓
Workflow Execution Service (Backend)
    ↓
Load Workflow from .clinerules/workflows/
    ↓
Execute Workflow
    ↓
Log to Audit Database
    ↓
Return Results
    ↓
Update UI with Results
```

#### Skill Execution Flow (Interactive)

```
User Action
    ↓
UI Component (Permission Check)
    ↓
GET /api/skills/:name/questions
    ↓
Display Question Modal (Step 1)
    ↓
User Answers Question
    ↓
Display Question Modal (Step 2)
    ↓
User Answers Question
    ↓
POST /api/skills/:name/execute
    ↓
Authorization Middleware (RBAC Check)
    ↓
Skill Execution Service
    ↓
Execute with Answers
    ↓
Log to Audit Database
    ↓
Return Results
    ↓
Update UI with Results
```

---

## Backend Implementation

**NOTE:** All backend implementations follow established procedures:
- **Database Operations:** Use `0000_SQL_EXECUTION_PROCEDURE.md` patterns
- **RBAC Implementation:** Follow `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md`
- **Workflow Patterns:** Use `0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md` frameworks
- **Task Management:** Follow `0000_WORKFLOW_TASK_PROCEDURE.md` standards

### Existing Infrastructure to Leverage

**From Procedures Guide Review:**

1. **RBAC System (Already Implemented)**
   - `user_roles` table exists with JWT integration
   - Authorization middleware patterns established
   - Use existing `checkPermission()` functions
   - Audit logging infrastructure in place

2. **Workflow Execution (Partially Implemented)**
   - `workflowExecutionService.js` exists in `client/src/services/`
   - `.clinerules/workflows/` directory with 20+ workflows
   - Workflow state management hooks available
   - Need to add: Server-side execution tracking

3. **Task Management (Already Implemented)**
   - Task state management patterns exist
   - Task execution infrastructure available
   - Polling mechanisms in place
   - Use established task lifecycle patterns

4. **Database Operations (Fully Implemented)**
   - SQL execution procedures established
   - Migration patterns documented
   - RLS policy templates available
   - Use `execute_sql_programmatically.cjs` for schema changes

### API Endpoints

**Use Existing Route Patterns:**
- Follow `server/src/routes/` structure (e.g., `template-routes.js`, `process-routes.js`)
- Use established middleware chain: `auth → RBAC → validation → handler`
- Apply existing error handling patterns
- Leverage existing database connection pools

#### Workflows API

```javascript
// server/src/routes/workflows-routes.js
// FOLLOW: 0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md patterns
// LEVERAGE: Existing workflowExecutionService.js (client-side)

const express = require('express');
const router = express.Router();
const { checkWorkflowAccess } = require('../middleware/workflowAuthMiddleware');
// ^ USE: Existing RBAC patterns from 01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md

// List all workflows (filtered by user permissions)
// PATTERN: Similar to GET /api/templates (existing)
GET /api/workflows
Middleware: [authenticateUser, filterByRole]
Response: [
  {
    name: 'add-chatbot-to-page',
    title: 'Add Chatbot to Page',
    category: 'UI Components',
    accessLevel: 'all',
    scope: 'discipline-specific',
    lastRun: '2026-01-28T10:30:00Z',
    successRate: 95.5
  }
]

// Get workflow details
// LEVERAGE: Existing workflow metadata from .clinerules/workflows/
GET /api/workflows/:name
Middleware: [authenticateUser, checkWorkflowAccess]
Implementation:
  - Load workflow metadata from file system
  - Filter parameters based on user role/discipline
  - Return workflow configuration
Response: {
  name: 'add-chatbot-to-page',
  title: 'Add Chatbot to Page',
  description: '...',
  parameters: [...],
  metadata: {...}
}

// Execute workflow
// USE: Existing workflowExecutionService patterns
// FOLLOW: 0000_WORKFLOW_TASK_PROCEDURE.md for state management
POST /api/workflows/:name/execute
Middleware: [authenticateUser, checkWorkflowAccess, validateParams, auditLog]
Body: {
  parameters: {
    pageSlug: '01900-procurement',
    position: 'bottom-right'
  }
}
Implementation:
  - Use existing workflowExecutionService.loadWorkflow()
  - Apply RBAC checks (existing patterns)
  - Track execution in database (new: workflow_executions table)
  - Return execution ID for polling
Response: {
  executionId: 'exec_123',
  status: 'running',
  startTime: '2026-01-29T14:30:00Z'
}

// Get execution status
// PATTERN: Similar to template generation polling (existing)
GET /api/workflows/executions/:executionId/status
Middleware: [authenticateUser, checkExecutionOwnership]
Implementation:
  - Query workflow_executions table
  - Filter by user permissions (RBAC)
  - Return current execution state
  - Include logs if available
Response: {
  executionId: 'exec_123',
  status: 'completed',
  progress: 100,
  result: {...},
  logs: [...]
}

// Get execution history
// USE: Existing audit_log patterns for historical data
GET /api/workflows/executions/history
Middleware: [authenticateUser, filterByRole]
Query: ?userId=user123&limit=50&offset=0
Implementation:
  - Query workflow_executions + execution_audit_log tables
  - Filter by user role (developers see all, users see own)
  - Apply discipline restrictions for discipline users
  - Paginate results
Response: [
  {
    executionId: 'exec_123',
    workflowName: 'add-chatbot-to-page',
    status: 'completed',
    startTime: '...',
    endTime: '...',
    duration: 5200
  }
]

// Cancel execution
// FOLLOW: Existing task cancellation patterns
DELETE /api/workflows/executions/:executionId
Middleware: [authenticateUser, checkExecutionOwnership, auditLog]
Implementation:
  - Check ownership/permissions
  - Update execution status to 'cancelled'
  - Clean up any in-progress operations
  - Log cancellation to audit trail
Response: {
  success: true,
  message: 'Execution cancelled'
}
```

**Implementation Notes:**
- All routes follow existing authentication patterns (`req.user` from JWT)
- RBAC checks use established `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md` patterns
- Database operations use `0000_SQL_EXECUTION_PROCEDURE.md` methods
- Audit logging follows existing `execution_audit_log` table structure

#### Skills API

**New Routes (Skills Directory Structure to Create):**
- Create `.clinerules/skills/` following `.clinerules/workflows/` pattern
- Skills are similar to workflows but support interactive questions
- Reuse workflow infrastructure where possible

```javascript
// server/src/routes/skills-routes.js
// PATTERN: Similar to workflows-routes.js
// NEW: Add question/answer flow support

const express = require('express');
const router = express.Router();
const { checkSkillAccess } = require('../middleware/skillAuthMiddleware');
// ^ REUSE: Same RBAC patterns as workflows

// List all skills (filtered by user permissions)
// SAME PATTERN as workflows listing
GET /api/skills
Middleware: [authenticateUser, filterByRole]
Response: [
  {
    name: 'analyze-code-patterns',
    title: 'Analyze Code Patterns',
    category: 'Code Analysis',
    accessLevel: 'all',
    lastRun: '2026-01-27T09:15:00Z',
    successRate: 92.0
  }
]

// Get skill details
// SAME PATTERN as workflow details
GET /api/skills/:name
Middleware: [authenticateUser, checkSkillAccess]
Response: {
  name: 'analyze-code-patterns',
  title: 'Analyze Code Patterns',
  description: '...',
  metadata: {...}
}

// Get interactive questions
// NEW: Interactive question flow (unique to skills)
// PATTERN: Similar to chatbot conversation flow (existing)
GET /api/skills/:name/questions
Middleware: [authenticateUser, checkSkillAccess]
Query: ?context={user,previousAnswers}
Implementation:
  - Load skill class from .clinerules/skills/
  - Call skill.getQuestions(context) method
  - Filter questions based on user role/discipline
  - Support conditional questions (dependsOn logic)
Response: [
  {
    id: 'analysis-type',
    type: 'select',
    question: 'What type of analysis?',
    options: [...],
    required: true
  }
]

// Execute skill with answers
// PATTERN: Same as workflow execution + answer validation
POST /api/skills/:name/execute
Middleware: [authenticateUser, checkSkillAccess, validateAnswers, auditLog]
Body: {
  answers: {
    'analysis-type': 'Consistency Check',
    'target-disciplines': ['01900']
  }
}
Implementation:
  - Validate all required questions answered
  - Load skill class from .clinerules/skills/
  - Call skill.execute(answers, context)
  - Track in same workflow_executions table (type='skill')
  - Use same polling mechanism as workflows
Response: {
  executionId: 'exec_456',
  status: 'running',
  startTime: '2026-01-29T14:35:00Z'
}

// Get execution status
// REUSE: Same endpoint as workflows (execution type differentiated in DB)
GET /api/skills/executions/:executionId/status
Middleware: [authenticateUser, checkExecutionOwnership]

// Get execution history
// REUSE: Same endpoint as workflows with type filter
GET /api/skills/executions/history
Middleware: [authenticateUser, filterByRole]
Query: ?type=skill&userId=user123&limit=50&offset=0
```

**Implementation Notes:**
- Skills share execution infrastructure with workflows
- Use same `workflow_executions` table with `type` field ('workflow' | 'skill')
- Question/answer flow is the only unique aspect
- Reuse all RBAC, audit, and polling mechanisms

#### Code Analysis API

**Leverage Existing Analysis Infrastructure:**
- Current page already has mock UI analysis
- Add real code pattern analysis (new service)
- Follow existing async job pattern (template generation)

```javascript
// server/src/routes/analysis-routes.js
// PATTERN: Similar to template-routes.js async job handling
// LEVERAGE: Existing async job infrastructure

const { CodePatternAnalysisService } = require('../services/codePatternAnalysisService');
const { checkAnalysisAccess } = require('../middleware/analysisAuthMiddleware');

// Run full analysis (UI + Code)
// PATTERN: Similar to POST /api/templates/generate (existing async job)
POST /api/analysis/run
Middleware: [authenticateUser, checkAnalysisAccess, auditLog]
Body: {
  scope: 'all' | 'discipline',
  disciplines: ['01900'] // optional, for discipline users
}
Implementation:
  - Create analysis job in database
  - Queue analysis task (use existing task queue if available)
  - Return analysis ID for polling
  - Execute CodePatternAnalysisService.analyze()
  - Store results in database
Response: {
  analysisId: 'analysis_789',
  status: 'running'
}

// Get analysis status
// PATTERN: Same polling pattern as template generation status
GET /api/analysis/:analysisId/status
Middleware: [authenticateUser, checkAnalysisOwnership]
Implementation:
  - Query analysis_jobs table (new table)
  - Return current status and results if complete
  - Filter results by user permissions
Response: {
  analysisId: 'analysis_789',
  status: 'completed',
  results: {
    overallScore: 72,
    uiScore: 70,
    codeScore: 74,
    findings: [...],
    recommendations: [...]
  }
}

// Get cached analysis results
// NEW: Cache latest analysis per discipline
GET /api/analysis/latest
Middleware: [authenticateUser, filterByRole]
Query: ?discipline=01900
Implementation:
  - Query most recent completed analysis
  - Filter by discipline if discipline user
  - Return cached results
  - Include cache timestamp
Response: {
  results: {...},
  timestamp: '2026-01-29T14:00:00Z',
  cached: true
}
```

**Implementation Notes:**
- Analysis follows same async job pattern as template generation
- Uses same polling mechanism (500ms intervals)
- Results cached in database for quick retrieval
- RBAC filtering applies to results display

### Service Implementation

#### Code Pattern Analysis Service

```javascript
// server/src/services/codePatternAnalysisService.js
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs').promises;
const path = require('path');

class CodePatternAnalysisService {
  constructor() {
    this.disciplinesPath = path.join(__dirname, '../../client/src/pages');
    this.patterns = {
      expectedImportOrder: ['react', 'third-party', 'components', 'styles', 'utils'],
      expectedFileStructure: ['index.js', 'components/', 'styles.css'],
      namingConvention: /^[0-9]{5}-[a-z-]+$/
    };
  }

  async analyzeAllDisciplines() {
    const disciplines = await this.getDisciplineDirectories();
    const results = [];

    for (const discipline of disciplines) {
      const analysis = await this.analyzeDiscipline(discipline);
      results.push(analysis);
    }

    return this.aggregateResults(results);
  }

  async analyzeSingleDiscipline(disciplineCode) {
    return await this.analyzeDiscipline(disciplineCode);
  }

  async analyzeDiscipline(disciplineCode) {
    const disciplinePath = path.join(this.disciplinesPath, disciplineCode);
    
    const analysis = {
      discipline: disciplineCode,
      scores: {
        fileOrganization: 0,
        namingConventions: 0,
        codePatterns: 0,
        bestPractices: 0
      },
      findings: [],
      patterns: {}
    };

    try {
      // Analyze file structure
      analysis.scores.fileOrganization = await this.analyzeFileStructure(disciplinePath);
      
      // Analyze naming conventions
      analysis.scores.namingConventions = await this.analyzeNaming(disciplinePath);
      
      // Analyze code patterns
      const codeAnalysis = await this.analyzeCodePatterns(disciplinePath);
      analysis.scores.codePatterns = codeAnalysis.score;
      analysis.patterns = codeAnalysis.patterns;
      analysis.findings.push(...codeAnalysis.findings);
      
      // Analyze best practices
      analysis.scores.bestPractices = await this.analyzeBestPractices(disciplinePath);

    } catch (error) {
      console.error(`Error analyzing ${disciplineCode}:`, error);
      analysis.error = error.message;
    }

    return analysis;
  }

  async analyzeFileStructure(disciplinePath) {
    const files = await fs.readdir(disciplinePath);
    let score = 100;
    
    // Check for expected files
    for (const expectedFile of this.patterns.expectedFileStructure) {
      if (!files.includes(expectedFile)) {
        score -= 15;
      }
    }
    
    return Math.max(0, score);
  }

  async analyzeNaming(disciplinePath) {
    const files = await fs.readdir(disciplinePath, { withFileTypes: true });
    let correctlyNamed = 0;
    let total = 0;
    
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.js')) {
        total++;
        if (this.checkNamingConvention(file.name)) {
          correctlyNamed++;
        }
      }
    }
    
    return total > 0 ? (correctlyNamed / total) * 100 : 100;
  }

  async analyzeCodePatterns(disciplinePath) {
    const findings = [];
    const patterns = {
      imports: {},
      stateManagement: {},
      errorHandling: {}
    };
    
    try {
      // Find main component file
      const componentFile = path.join(disciplinePath, `${path.basename(disciplinePath)}-page.js`);
      const code = await fs.readFile(componentFile, 'utf-8');
      
      // Parse to AST
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx']
      });
      
      // Analyze import statements
      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          patterns.imports[source] = patterns.imports[source] || 0;
          patterns.imports[source]++;
        },
        
        // Check for useState usage
        CallExpression(path) {
          if (path.node.callee.name === 'useState') {
            patterns.stateManagement.useState = (patterns.stateManagement.useState || 0) + 1;
          }
        },
        
        // Check for try-catch blocks
        TryStatement(path) {
          patterns.errorHandling.tryCatch = (patterns.errorHandling.tryCatch || 0) + 1;
        }
      });
      
      // Generate findings based on patterns
      if (Object.keys(patterns.imports).length === 0) {
        findings.push({
          severity: 'warning',
          category: 'imports',
          message: 'No imports detected - possible parsing issue'
        });
      }
      
      if (!patterns.stateManagement.useState) {
        findings.push({
          severity: 'info',
          category: 'state-management',
          message: 'No state management detected'
        });
      }
      
      if (!patterns.errorHandling.tryCatch) {
        findings.push({
          severity: 'warning',
          category: 'error-handling',
          message: 'No error handling (try-catch) detected'
        });
      }
      
    } catch (error) {
      findings.push({
        severity: 'error',
        category: 'parsing',
        message: `Failed to parse code: ${error.message}`
      });
    }
    
    // Calculate score based on findings
    const errorCount = findings.filter(f => f.severity === 'error').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    const score = Math.max(0, 100 - (errorCount * 30) - (warningCount * 10));
    
    return { score, patterns, findings };
  }

  async analyzeBestPractices(disciplinePath) {
    // Simplified best practices check
    // In real implementation, would use ESLint programmatic API
    return 80; // Placeholder
  }

  checkNamingConvention(filename) {
    const name = path.basename(filename, path.extname(filename));
    return this.patterns.namingConvention.test(name);
  }

  async getDisciplineDirectories() {
    const entries = await fs.readdir(this.disciplinesPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .filter(entry => /^[0-9]{5}/.test(entry.name))
      .map(entry => entry.name);
  }

  aggregateResults(results) {
    const total = results.length;
    const aggregate = {
      totalDisciplines: total,
      overallScore: 0,
      categoryScores: {
        fileOrganization: 0,
        namingConventions: 0,
        codePatterns: 0,
        bestPractices: 0
      },
      findings: [],
      recommendations: []
    };

    // Calculate averages
    for (const result of results) {
      if (!result.error) {
        aggregate.categoryScores.fileOrganization += result.scores.fileOrganization;
        aggregate.categoryScores.namingConventions += result.scores.namingConventions;
        aggregate.categoryScores.codePatterns += result.scores.codePatterns;
        aggregate.categoryScores.bestPractices += result.scores.bestPractices;
        aggregate.findings.push(...result.findings.map(f => ({ ...f, discipline: result.discipline })));
      }
    }

    // Average the scores
    for (const key in aggregate.categoryScores) {
      aggregate.categoryScores[key] /= total;
    }

    // Calculate overall score
    aggregate.overallScore = Object.values(aggregate.categoryScores).reduce((a, b) => a + b, 0) / 4;

    // Generate recommendations
    aggregate.recommendations = this.generateRecommendations(aggregate);

    return aggregate;
  }

  generateRecommendations(aggregate) {
    const recommendations = [];

    if (aggregate.categoryScores.fileOrganization < 70) {
      recommendations.push({
        priority: 'high',
        category: 'file-organization',
        action: 'Standardize file structure across disciplines',
        impact: 'Improves maintainability and onboarding',
        effort: '2-3 days'
      });
    }

    if (aggregate.categoryScores.codePatterns < 70) {
      recommendations.push({
        priority: 'high',
        category: 'code-patterns',
        action: 'Establish and enforce code pattern standards',
        impact: 'Reduces bugs and improves consistency',
        effort: '3-5 days'
      });
    }

    if (aggregate.findings.filter(f => f.category === 'error-handling').length > 10) {
      recommendations.push({
        priority: 'medium',
        category: 'error-handling',
        action: 'Add error boundaries and try-catch blocks',
        impact: 'Improves application stability',
        effort: '2-3 days'
      });
    }

    return recommendations;
  }
}

module.exports = CodePatternAnalysisService;
```

---

## Frontend Implementation

### Component Structure

```
client/src/pages/02050-development-console/
├── index.js
├── components/
│   ├── 02050-development-console-page.js (Main component)
│   ├── tabs/
│   │   ├── UICodeAnalysisTab.js
│   │   ├── WorkflowsTab.js
│   │   └── SkillsTab.js
│   ├── shared/
│   │   ├++ REPLACE

---

## Integration with Agent Generation System

**CROSS-REFERENCE:** This implementation integrates closely with the [Agent Generation Implementation Plan](0000_AGENT_GENERATION_IMPLEMENTATION_PLAN.md)

### Shared Infrastructure

Both systems leverage:
- ✅ **RBAC System** - Same user_roles table and JWT authentication
- ✅ **Discipline Restrictions** - Both enforce discipline-specific access
- ✅ **GitHub Workflows** - Manager approval triggers commits/pushes
- ✅ **Training Integration** - Agent changes trigger model retraining
- ✅ **Meta-Agents** - Python Deep Agents can use workflows/skills

### Integration Points

1. **Agent Generation Workflow** (Development Console → Agent Generation)
   - Workflow Name: `generate-discipline-agent`
   - Category: Development (Developer-only)
   - Launches the `/agent-generation` page with discipline parameter
   - Passes user context and permissions
   ```javascript
   {
     name: 'generate-discipline-agent',
     title: 'Generate Discipline Agent',
     description: 'Create custom agents for specific disciplines',
     category: 'Development',
     accessLevel: 'developer-only',
     scope: 'discipline-specific',
     parameters: [
       {
         name: 'discipline',
         type: 'select',
         required: true,
         options: allDisciplines,
         description: 'Target discipline for agent generation'
       },
       {
         name: 'agent-type',
         type: 'select',
         required: true,
         options: ['Deep', 'Swarm', 'JS'],
         description: 'Agent architecture type'
       }
     ]
   }
   ```

2. **Skills for Agent Management** (Development Console → Agent Generation)
   - Skill Name: `analyze-agent-performance`
   - Category: Code Analysis
   - Analyzes existing agent performance and suggests improvements
   - Interactive wizard guides optimization recommendations

3. **Meta-Agent Workflow Orchestration** (Agent Generation → Development Console)
   - Meta-agents in `deep-agents/` directory can execute workflows
   - Workflow-orchestrator-agent.py calls Development Console APIs
   - Enables automated agent deployment pipelines
   ```python
   # deep-agents/workflow-orchestrator-agent.py
   class WorkflowOrchestratorAgent:
       async def execute_workflow(self, workflow_name, parameters):
           """Execute Development Console workflow from meta-agent"""
           response = await self.api_client.post(
               f'/api/workflows/{workflow_name}/execute',
               json={'parameters': parameters},
               headers={'Authorization': f'Bearer {self.service_token}'}
           )
           return response.json()
   ```

4. **Training Trigger Integration** (Both Systems)
   - Agent generation triggers training via Development Console workflow
   - Workflow Name: `trigger-model-retraining`
   - Calls `models/training-scripts/agent-retrain-trigger.cjs`
   - Tracks training status and completion

5. **Approval Workflow Sharing** (Both Systems)
   - Manager approval for agents uses same GitHub workflow
   - Development Console provides approval UI/workflow
   - Agent Generation system hooks into approval pipeline

### User Flow Example

**Developer Generating an Agent:**

```
1. User opens Development Console
   ↓
2. Navigate to Workflows tab
   ↓
3. Find "Generate Discipline Agent" workflow
   ↓
4. Click [Run], modal opens
   ↓
5. Select discipline: "Information Technology"
   ↓
6. Select agent-type: "Deep"
   ↓
7. Workflow executes, opens /agent-generation page
   ↓
8. Agent spec entered, agent generated
   ↓
9. Manager approval requested (via Development Console approval workflow)
   ↓
10. Training triggered (via Development Console training workflow)
   ↓
11. Agent deployed and indexed at startup
```

### Shared RBAC Rules

| Feature | Developer | Discipline User | Notes |
|---------|-----------|-----------------|-------|
| Generate Agent (Any Discipline) | ✅ | ❌ | Developer-only workflow |
| Generate Agent (Own Discipline) | ✅ | ✅ | If enabled for discipline |
| Approve Agent Deployment | Manager | Manager | Same approval system |
| Trigger Training | ✅ | ❌ | Developer-only workflow |
| View Agent Performance | ✅ | ✅ (own) | Skill with discipline filter |

### Implementation Coordination

**Phase Alignment:**
- Development Console **Phase 1** (Backend) completes before Agent Gen **Phase 4** (Approval)
- Development Console **Phase 2** (Workflows UI) enables Agent Gen **Phase 1** (Launcher Button)
- Development Console **Phase 3** (Skills) supports Agent Gen **Phase 3** (Meta-Agents)

**Shared Development:**
- RBAC middleware created once, used by both systems
- Approval workflow implemented once, shared infrastructure
- Training trigger workflow serves both systems
- Audit logging tracks both agent creation and workflow execution

### Future Integration Enhancements

1. **Agent Workflow Marketplace**
   - Agents can publish their own workflows
   - Development Console surfaces agent-contributed workflows
   - Community-driven workflow ecosystem

2. **Automated Agent Testing**
   - Skills for automated agent performance testing
   - Integration with simulator page
   - Continuous improvement loops

3. **Agent Composition Workflows**
   - Workflows for combining multiple agents
   - Swarm agent orchestration
   - Multi-agent collaboration patterns

---

**Integration Status:** ✅ **PLANNED - COORDINATED IMPLEMENTATION**

**Related Documents:**
- [Agent Generation Implementation Plan](0000_AGENT_GENERATION_IMPLEMENTATION_PLAN.md)
- [Workflow Implementation Procedure](../procedures/0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md)
- [User Roles Implementation Procedure](../procedures/01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md)

