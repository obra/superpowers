# Cross-Discipline UI Enhancement - Procedures Integration Guide

**Integration Document**  
**Date:** January 29, 2026  
**Purpose:** Cross-reference implementation plan with existing procedures  
**Related Plans:** `cross-discipline-ui-workflows-skills-enhancement.md`

---

## Overview

This document maps our Cross-Discipline UI enhancement implementation to existing Construct AI procedures, ensuring compliance with established standards and leveraging proven methodologies.

**Base Implementation Plan:** `cross-discipline-ui-workflows-skills-enhancement.md`  
**Procedures Guide:** `/Users/Discipline_agents/construct_ai/docs/procedures/0000_PROCEDURES_GUIDE.md`

---

## Procedure Mappings

### Phase 0: Enhanced Section 1 + RBAC Foundation

#### Applicable Procedures

| Implementation Task | Procedure Reference | Section | Notes |
|---------------------|---------------------|---------|-------|
| Create `CodePatternAnalysisService.js` | `0000_SQL_EXECUTION_PROCEDURE.md` | Database Operations | For any database schema changes |
| Add workflow/skill metadata tables | `0000_SQL_EXECUTION_PROCEDURE.md` | Schema Changes | Execute SQL migrations |
| Create audit logging table | `0000_SQL_EXECUTION_PROCEDURE.md` | Table Creation | Follow SQL execution standards |
| Implement RBAC middleware | `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md` | Authorization Middleware | Use existing RBAC patterns |
| Update analysis dashboard | `0000_PAGE_IMPLEMENTATION_PROCEDURE.md` | Page Updates | Follow page implementation standards |
| Add role indicator to UI | `0000_ELEMENT_STYLING_REFERENCE_PROCEDURE.md` | UI Consistency | Match existing styling patterns |

**Key Procedure References:**

1. **`01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Database Schema (use existing `user_roles` table structure)
     - RLS Policies (apply similar patterns for workflow/skill metadata)
     - JWT Integration (use existing JWT claims for role checking)
     - Permission Checking (leverage existing middleware patterns)
   
   - **Implementation Alignment:**
     ```javascript
     // Our RBAC implementation should follow the established pattern:
     const checkWorkflowAccess = async (req, res, next) => {
       const userId = req.user.id; // JWT claim
       const userRole = req.user.role; // From user_roles table
       
       // Follow 01300_USER_ROLES patterns
       if (userRole === 'developer') {
         return next(); // Full access
       }
       
       // Check specific permissions
       const hasPermission = await checkPermission(userId, 'workflow:execute');
       // ... rest of logic
     };
     ```

2. **`0000_SQL_EXECUTION_PROCEDURE.md`**
   - **Applicable Sections:**
     - SQL File Execution (for schema migrations)
     - Environment Variables (database credentials)
     - Error Handling (rollback procedures)
   
   - **Implementation Alignment:**
     ```bash
     # Execute our schema migrations using established procedure
     node execute_sql_programmatically.cjs \
       --file=migrations/add_workflow_metadata_table.sql \
       --method=pg
     ```

3. **`0000_PAGE_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Page Structure (Template A compliance)
     - Component Organization (file structure standards)
     - State Management (React hooks patterns)
   
   - **Implementation Alignment:**
     ```
     pages/02050-cross-discipline-ui-check/
     ├── index.js                    # Follow template structure
     ├── components/                 # Component organization
     │   ├── tabs/                   # Tab components
     │   ├── workflows/              # Workflow components
     │   └── skills/                 # Skill components
     └── styles/                     # Styling per standards
     ```

---

### Phase 1: Backend APIs with RBAC

#### Applicable Procedures

| Implementation Task | Procedure Reference | Section | Notes |
|---------------------|---------------------|---------|-------|
| Create `/api/workflows` routes | `0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md` | API Endpoints | Follow workflow API patterns |
| Create `/api/skills` routes | `0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md` | API Design | Similar to workflow endpoints |
| Implement authorization middleware | `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md` | Middleware | Use established RBAC patterns |
| Add execution tracking | `0000_WORKFLOW_TASK_PROCEDURE.md` | Task Lifecycle | Follow task state management |
| Create audit logging service | `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md` | Audit Logging | Use existing audit patterns |
| Set up execution polling | `0000_WORKFLOW_TASK_PROCEDURE.md` | Status Tracking | Follow task polling patterns |

**Key Procedure References:**

1. **`0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Workflow API Design (endpoint structure)
     - Parameter Validation (input validation patterns)
     - Error Handling (standardized error responses)
     - Integration Patterns (service layer abstraction)
   
   - **Implementation Alignment:**
     ```javascript
     // Follow established workflow API patterns
     router.post('/api/workflows/:name/execute', 
       checkWorkflowAccess,           // RBAC middleware
       validateWorkflowParams,        // Validation
       async (req, res) => {
         const { name } = req.params;
         const { parameters } = req.body;
         
         // Execute workflow following procedure standards
         const execution = await workflowService.execute(name, parameters);
         res.json({ executionId: execution.id });
       }
     );
     ```

2. **`0000_WORKFLOW_TASK_PROCEDURE.md`**
   - **Applicable Sections:**
     - Task State Management (execution states)
     - Status Tracking (progress monitoring)
     - Retry Logic (error recovery)
   
   - **Implementation Alignment:**
     ```javascript
     // Use established task state patterns
     const EXECUTION_STATES = {
       PENDING: 'pending',
       RUNNING: 'running',
       COMPLETED: 'completed',
       FAILED: 'failed',
       CANCELLED: 'cancelled'
     };
     
     // Follow task lifecycle management
     async getExecutionStatus(executionId) {
       const execution = await db.query(
         'SELECT * FROM workflow_executions WHERE id = $1',
         [executionId]
       );
       return execution;
     }
     ```

---

### Phase 2: Workflows Runner UI with Permissions

#### Applicable Procedures

| Implementation Task | Procedure Reference | Section | Notes |
|---------------------|---------------------|---------|-------|
| Create `WorkflowsTab.js` | `0000_PAGE_IMPLEMENTATION_PROCEDURE.md` | Component Structure | Follow page component patterns |
| Create `WorkflowBrowser.js` | `0000_DROPDOWN_IMPLEMENTATION_PROCEDURE.md` | List/Filter Patterns | Similar filtering patterns |
| Create `WorkflowExecutionModal.js` | `0000_CHATBOT_COMPREHENSIVE_PROCEDURE.md` | Modal Patterns | Reference modal implementation |
| Implement permission filtering | `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md` | Client-side Filtering | Follow permission checking |
| Add quick-start cards | `0000_ELEMENT_STYLING_REFERENCE_PROCEDURE.md` | UI Components | Match existing card styling |

**Key Procedure References:**

1. **`0000_PAGE_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Component Structure (file organization)
     - State Management (React hooks usage)
     - Props and Communication (component interaction)
   
   - **Implementation Alignment:**
     ```javascript
     // Follow page implementation patterns
     const WorkflowsTab = () => {
       const [workflows, setWorkflows] = useState([]);
       const [filter, setFilter] = useState('all');
       const [loading, setLoading] = useState(false);
       
       useEffect(() => {
         // Follow data fetching patterns
         loadWorkflows();
       }, [filter]);
       
       // Component structure per procedure
       return (
         <div className="workflows-tab">
           <WorkflowBrowser 
             workflows={workflows}
             onExecute={handleExecute}
           />
         </div>
       );
     };
     ```

2. **`0000_DROPDOWN_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Dropdown Implementation (selection components)
     - Data Fetching (loading workflows)
     - Error Handling (graceful failures)
   
   - **Implementation Alignment:**
     ```javascript
     // Use established dropdown patterns for workflow selection
     <select 
       value={selectedWorkflow}
       onChange={handleWorkflowChange}
       disabled={loading}
     >
       <option value="">Select Workflow...</option>
       {workflows.map(w => (
         <option key={w.name} value={w.name}>
           {w.title}
         </option>
       ))}
     </select>
     ```

3. **`0000_CHATBOT_COMPREHENSIVE_PROCEDURE.md`**
   - **Applicable Sections:**
     - Modal Implementation (execution modals)
     - Progress Tracking (real-time updates)
     - User Feedback (status messages)
   
   - **Implementation Alignment:**
     ```javascript
     // Follow modal patterns from chatbot procedure
     const WorkflowExecutionModal = ({ workflow, onClose }) => {
       const [executing, setExecuting] = useState(false);
       const [progress, setProgress] = useState(0);
       const [logs, setLogs] = useState([]);
       
       // Poll for updates (similar to chatbot streaming)
       useEffect(() => {
         if (executing) {
           const interval = setInterval(pollStatus, 500);
           return () => clearInterval(interval);
         }
       }, [executing]);
       
       // Modal structure per procedure
       return (
         <Modal show onHide={onClose}>
           {/* Modal content */}
         </Modal>
       );
     };
     ```

---

### Phase 3: Skills Runner UI with Permissions

#### Applicable Procedures

| Implementation Task | Procedure Reference | Section | Notes |
|---------------------|---------------------|---------|-------|
| Create `.clinerules/skills/` directory | `0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md` | Directory Structure | Similar to workflows |
| Create `SkillsTab.js` | `0000_PAGE_IMPLEMENTATION_PROCEDURE.md` | Component Structure | Follow page patterns |
| Create `SkillQuestionModal.js` | `0000_CHATBOT_COMPREHENSIVE_PROCEDURE.md` | Multi-step Dialogs | Reference interactive patterns |
| Implement skill execution service | `0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md` | Service Layer | Follow workflow service patterns |

**Key Procedure References:**

1. **`0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Directory Structure (skills directory organization)
     - Service Layer (execution abstraction)
     - State Management (skill execution state)
   
   - **Implementation Alignment:**
     ```
     .clinerules/skills/
     ├── analyze-code-patterns.js    # Skill implementation
     ├── analyze-code-patterns.md    # Documentation
     ├── generate-boilerplate.js     # Skill implementation
     └── README.md                    # Skills guide
     
     # Follow workflow patterns for skill structure
     ```

2. **`0000_CHATBOT_COMPREHENSIVE_PROCEDURE.md`**
   - **Applicable Sections:**
     - Multi-turn Dialogues (question sequences)
     - Context Management (answer tracking)
     - User Interaction (question rendering)
   
   - **Implementation Alignment:**
     ```javascript
     // Multi-step question wizard (similar to chatbot conversations)
     const SkillQuestionModal = ({ skill, onComplete }) => {
       const [currentStep, setCurrentStep] = useState(0);
       const [answers, setAnswers] = useState({});
       const [questions, setQuestions] = useState([]);
       
       // Load questions dynamically (like chatbot messages)
       useEffect(() => {
         loadQuestions(skill, answers);
       }, [currentStep]);
       
       // Navigate through questions
       const handleNext = () => {
         if (currentStep < questions.length - 1) {
           setCurrentStep(current => current + 1);
         } else {
           onComplete(answers);
         }
       };
       
       // Render current question
       return (
         <Modal show>
           <h3>Step {currentStep + 1} of {questions.length}</h3>
           <QuestionRenderer 
             question={questions[currentStep]}
             onAnswer={handleAnswer}
           />
           <Button onClick={handleNext}>Next</Button>
         </Modal>
       );
     };
     ```

---

### Phase 4: Standalone Actions & Integration

#### Applicable Procedures

| Implementation Task | Procedure Reference | Section | Notes |
|---------------------|---------------------|---------|-------|
| Create `standalone-actions.config.js` | `0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md` | Configuration | Follow config patterns |
| Add tab navigation | `0000_PAGE_IMPLEMENTATION_PROCEDURE.md` | Navigation | Follow page navigation patterns |
| Add execution history | `0000_WORKFLOW_TASK_PROCEDURE.md` | History Tracking | Use task history patterns |
| Add loading states | `0000_ELEMENT_STYLING_REFERENCE_PROCEDURE.md` | UI Feedback | Match existing loading patterns |

**Key Procedure References:**

1. **`0000_PAGE_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Tab Navigation (tab switching)
     - State Persistence (active tab state)
     - Component Organization (tab structure)
   
   - **Implementation Alignment:**
     ```javascript
     // Follow page navigation patterns
     const CrossDisciplineUICheckPage = () => {
       const [activeTab, setActiveTab] = useState('analysis');
       
       const tabs = [
         { id: 'analysis', label: 'UI & Code Analysis' },
         { id: 'workflows', label: 'Workflows' },
         { id: 'skills', label: 'Skills' }
       ];
       
       return (
         <div className="page-container">
           <TabNavigation 
             tabs={tabs}
             active={activeTab}
             onChange={setActiveTab}
           />
           <TabContent active={activeTab}>
             {activeTab === 'analysis' && <UICodeAnalysisTab />}
             {activeTab === 'workflows' && <WorkflowsTab />}
             {activeTab === 'skills' && <SkillsTab />}
           </TabContent>
         </div>
       );
     };
     ```

2. **`0000_WORKFLOW_TASK_PROCEDURE.md`**
   - **Applicable Sections:**
     - Task History (execution logs)
     - Status Display (execution results)
     - Filtering (history search)
   
   - **Implementation Alignment:**
     ```javascript
     // Execution history following task procedure patterns
     const ExecutionHistory = () => {
       const [executions, setExecutions] = useState([]);
       const [filter, setFilter] = useState('all');
       
       useEffect(() => {
         loadExecutionHistory(filter);
       }, [filter]);
       
       return (
         <div className="execution-history">
           <FilterBar value={filter} onChange={setFilter} />
           <ExecutionList executions={executions} />
         </div>
       );
     };
     ```

---

### Phase 5: Testing & Polish

#### Applicable Procedures

| Implementation Task | Procedure Reference | Section | Notes |
|---------------------|---------------------|---------|-------|
| Unit tests | `0000_TESTING_WORKFLOW_PROCEDURE.md` | Unit Testing | Follow testing patterns |
| Integration tests | `0000_TESTING_WORKFLOW_PROCEDURE.md` | Integration Testing | E2E test scenarios |
| RBAC tests | `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md` | Security Testing | Permission testing |
| Performance tests | `0000_WORKFLOW_OPTIMIZATION_GUIDE.md` | Performance | Load testing |
| Documentation | `0000_WORKFLOW_DOCUMENTATION_PROCEDURE.md` | Documentation | Follow doc standards |

**Key Procedure References:**

1. **`0000_TESTING_WORKFLOW_PROCEDURE.md`**
   - **Applicable Sections:**
     - Test Structure (test organization)
     - Testing Patterns (test scenarios)
     - Validation (quality checks)
   
   - **Implementation Alignment:**
     ```javascript
     // Follow testing procedure patterns
     describe('Workflow Execution', () => {
       it('should execute workflow as developer', async () => {
         // Setup: Login as developer
         const user = await loginAs('developer');
         
         // Action: Execute workflow
         const result = await executeWorkflow('add-chatbot-to-page', {
           pageSlug: '01900-procurement'
         });
         
         // Assert: Success
         expect(result.success).toBe(true);
         expect(result.executionId).toBeDefined();
       });
       
       it('should restrict workflow for discipline user', async () => {
         // Setup: Login as discipline user
         const user = await loginAs('discipline-user', {
           discipline: '01900'
         });
         
         // Action: Attempt restricted workflow
         const result = await executeWorkflow('create-new-workflow', {});
         
         // Assert: Denied
         expect(result.error).toContain('developer access');
       });
     });
     ```

2. **`01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Security Testing (permission validation)
     - RBAC Testing (role-based tests)
     - Audit Testing (logging verification)
   
   - **Implementation Alignment:**
     ```javascript
     // Security testing per RBAC procedure
     describe('RBAC Permission Checks', () => {
       it('should enforce workflow permissions', async () => {
         const workflows = [
           { name: 'add-chatbot', accessLevel: 'all' },
           { name: 'create-workflow', accessLevel: 'developer-only' }
         ];
         
         // Test as discipline user
         const disciplineUser = { role: 'discipline-user', discipline: '01900' };
         const filtered = filterWorkflows(workflows, disciplineUser);
         
         expect(filtered.length).toBe(1);
         expect(filtered[0].name).toBe('add-chatbot');
       });
       
       it('should log all access attempts', async () => {
         await executeWorkflow('add-chatbot', {});
         
         const auditLog = await getAuditLog();
         expect(auditLog).toContainEqual(
           expect.objectContaining({
             action: 'workflow_execute',
             workflow: 'add-chatbot',
             result: 'success'
           })
         );
       });
     });
     ```

3. **`0000_WORKFLOW_DOCUMENTATION_PROCEDURE.md`**
   - **Applicable Sections:**
     - Documentation Structure (required sections)
     - Technical Details (implementation docs)
     - Cross-References (linking to procedures)
   
   - **Implementation Alignment:**
     ```markdown
     # Workflow Execution System Documentation
     
     ## Overview
     [System description following procedure standards]
     
     ## Component Architecture
     ### Frontend Components
     - WorkflowsTab.js - Main workflow interface
     - WorkflowExecutionModal.js - Execution dialog
     
     ### Backend Services
     - workflowExecutionService.js - Core execution logic
     - workflowAuthMiddleware.js - RBAC enforcement
     
     ## Related Procedures
     - 01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md - RBAC patterns
     - 0000_WORKFLOW_TASK_PROCEDURE.md - Task management
     ```

---

## Procedure Compliance Checklist

### Database Changes
- [ ] Follow `0000_SQL_EXECUTION_PROCEDURE.md` for migrations
- [ ] Execute SQL via established methods (pg, Supabase RPC, psql)
- [ ] Create backups before schema changes
- [ ] Validate schema changes with test queries
- [ ] Update schema documentation

### RBAC Implementation
- [ ] Follow `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md` patterns
- [ ] Use existing `user_roles` table structure
- [ ] Implement RLS policies for new tables
- [ ] Add JWT claims for role checking
- [ ] Create audit logging for all operations
- [ ] Test permission boundaries thoroughly

### Component Implementation
- [ ] Follow `0000_PAGE_IMPLEMENTATION_PROCEDURE.md` structure
- [ ] Use established state management patterns
- [ ] Match existing UI styling per `0000_ELEMENT_STYLING_REFERENCE_PROCEDURE.md`
- [ ] Implement proper error handling
- [ ] Add loading states and user feedback

### Workflow Implementation
- [ ] Follow `0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md` framework
- [ ] Use established API endpoint patterns
- [ ] Implement task state management per `0000_WORKFLOW_TASK_PROCEDURE.md`
- [ ] Add comprehensive error handling
- [ ] Create proper documentation per `0000_WORKFLOW_DOCUMENTATION_PROCEDURE.md`

### Testing
- [ ] Follow `0000_TESTING_WORKFLOW_PROCEDURE.md` patterns
- [ ] Create unit tests for all services
- [ ] Create integration tests for workflows
- [ ] Test RBAC thoroughly per `01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md`
- [ ] Perform load testing per `0000_WORKFLOW_OPTIMIZATION_GUIDE.md`

---

## Integration Summary

### Procedures Referenced
1. **`01300_USER_ROLES_IMPLEMENTATION_PROCEDURE.md`** - RBAC patterns
2. **`0000_SQL_EXECUTION_PROCEDURE.md`** - Database operations
3. **`0000_PAGE_IMPLEMENTATION_PROCEDURE.md`** - Page structure
4. **`0001_WORKFLOW_IMPLEMENTATION_PROCEDURE.md`** - Workflow patterns
5. **`0000_WORKFLOW_TASK_PROCEDURE.md`** - Task management
6. **`0000_WORKFLOW_DOCUMENTATION_PROCEDURE.md`** - Documentation standards
7. **`0000_TESTING_WORKFLOW_PROCEDURE.md`** - Testing framework
8. **`0000_DROPDOWN_IMPLEMENTATION_PROCEDURE.md`** - Selection patterns
9. **`0000_CHATBOT_COMPREHENSIVE_PROCEDURE.md`** - Modal patterns
10. **`0000_ELEMENT_STYLING_REFERENCE_PROCEDURE.md`** - UI consistency

### Benefits of Procedure Alignment
✅ **Consistency** - Follows established patterns across codebase  
✅ **Quality** - Leverages proven methodologies and best practices  
✅ **Maintainability** - Easier for team to understand and maintain  
✅ **Security** - Inherits robust security patterns from RBAC procedures  
✅ **Testing** - Comprehensive testing coverage using established frameworks  
✅ **Documentation** - Clear documentation following system standards  

### Next Steps
1. Review this integration guide with team
2. Ensure all developers understand procedure references
3. Begin implementation following Phase 0
4. Regular compliance checks against procedures
5. Update procedures if gaps are identified

---

**Document Information:**
- **Created:** January 29, 2026
- **Purpose:** Cross-reference implementation with procedures
- **Status:** Ready for Review
- **Related Documents:**
  - `cross-discipline-ui-workflows-skills-enhancement.md`
  - `/Users/Discipline_agents/construct_ai/docs/procedures/0000_PROCEDURES_GUIDE.md`