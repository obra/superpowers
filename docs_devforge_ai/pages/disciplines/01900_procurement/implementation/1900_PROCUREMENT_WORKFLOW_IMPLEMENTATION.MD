# Procurement Document Generation Workflow - Implementation Guide

## 🔧 **Code Implementation Details**

### **Phase 1: Procurement Order Foundation** ✅ **IMPLEMENTED**

#### **1.1 Create Procurement Order (PO/WO/SO) - Enhanced with Chatbot Workflow Streaming**

**Component**: `CreateOrderModal` (5-phase wizard)
**Location**: `client/src/pages/01900-procurement/components/modals/CreateOrderModal.jsx`

**Enhanced UI Flow (2026-01-28)**:
- **Instant Modal Closure**: Modal closes immediately when user clicks "Create" (no waiting for processing)
- **Chatbot Opens Automatically**: Procurement Chatbot appears with workflow streaming messages
- **Sequential Agent Execution**: 7 agents execute in sequence with real-time updates and visual timing
- **Real-Time Feedback**: Users see each agent's progress, results, and processing times

**Modal Updates (2025-12-12)**:
- **Width Standardization**: All procurement modals now use consistent `maxWidth: '900px'` and `width: '100%'`
- **Title Updates**: Create New Template modal title changed to "Upload HTML for Form Generation"
- **Document Category Selection**: Unified 6-category radio button interface (Form, Template, Schedule, Timeline, Specification, Appendix)
- **Appendix Modal**: Dedicated `AppendixModal` component for hybrid form/template functionality
- **Timeline Category**: Added separate category for time-based schedules alongside document schedules

**Chatbot Workflow Streaming (NEW - 2026-01-28)**:
- **Implementation File**: `client/src/pages/01900-procurement/components/01901-purchase-orders-page.js`
- **System**: Event-based chatbot dispatcher with sequential agent execution
- **Agents**: 7 agents in sequence with real-time messaging:
  1. **Template Analysis Agent** (800ms)
  2. **Requirements Extraction Agent** (700ms)
  3. **Compliance Validation Agent** (900ms)
  4. **Field Population Agent** (800ms)
  5. **Quality Assurance Agent** (600ms)
  6. **Final Review Agent** (850ms)
  7. **Assignment Agent** (650ms)
- **Total Time**: ~4.5 seconds for complete workflow
- **Integration**: Works with ProcurementChatbot via `chatbotMessage` custom events

**Chatbot Message Display Example**:
```markdown
**PROCUREMENT ORDER WORKFLOW INITIATED**

📋 **Order Details:**
- Type: purchase_order
- Title: Industrial Compressor System
- Estimated Value: ZAR 750,000

🎯 **Workflow Summary:**
Multi-stage agent workflow with sequential processing and real-time streaming updates.

Agents will execute in this order:
1. Template Analysis Agent → Analyzing procurement requirements
2. Requirements Extraction Agent → Extracting structured requirements
3. Compliance Validation Agent → Validating against PPPA, ISO, CIDB standards
4. Field Population Agent → Mapping data to template fields
5. Quality Assurance Agent → Validating document completeness
6. Final Review Agent → Assembling complete procurement package
7. Assignment Agent → Distributing tasks to discipline specialists

⚠️ **Note:** For high-value orders (R100k+), Human-in-the-Loop (HITL) approval will be triggered.

---

**Starting workflow processing...**
```

**Steps**:

1. **Order Type Selection**: Choose Purchase Order, Work Order, or Service Order
2. **Basic Information**: Title, description, estimated value, supplier details
3. **Project Association**: Link to specific project with requirements
4. **SOW Template Selection**: Choose appropriate SOW structure template
5. **Discipline Assignment**: Assign disciplines to appendices (A-F) using checkboxes
6. **User Assignment**: Assign specific users to appendices using `AppendixRequirementsDisplay`
7. **Automatic Approval Routing**: System determines approval requirements based on governance-maintained limits of authority (order value, type, risk level)
8. **Review & Create**: Final validation and order creation

**Data Structure**:

```javascript
{
  orderType: "purchase_order",
  title: "Equipment Procurement for Production Line",
  estimatedValue: 250000,
  currency: "ZAR",
  supplierName: "ABC Manufacturing",
  projectId: "uuid-project",
  sow_template_id: "uuid-template",
  discipline_assignments: {
    appendix_a: ["engineering"],
    appendix_b: ["quality"],
    appendix_c: ["safety"],
    // ... appendices D-F
  },
  user_assignments: {
    appendix_a: ["user-uuid-1"],
    appendix_b: ["user-uuid-2"],
    // ... specific users for each appendix
  },
  approval_config: {
    generateCoverSheet: true,
    routingType: "sequential",
    approvalMatrix: [
      { role: "procurement_officer", required: true },
      { role: "procurement_manager", required: true }
    ]
  }
}
```

#### **1.2 Parallel Task Creation: SOW Generation + Appendix Contributions**

**Component**: `createProcurementOrder()` function
**Location**: `server/src/controllers/procurementController.js`

**Automated Process**:

- **Parallel Task Creation**: Both SOW generation AND appendix contribution tasks created simultaneously
- **SOW Generation Task**: High priority task assigned to procurement team for SOW creation
- **Appendix Contribution Tasks**: Normal priority tasks assigned to discipline specialists
- **Parallel Workflow**: All tasks can be worked on simultaneously for maximum efficiency
- **Metadata**: All tasks marked with `parallel_workflow: true` for tracking

**Task Structures**:

**SOW Generation Task** (High Priority):
```javascript
{
  task_type: "sow_generation",
  title: "Generate Scope of Work: [Order Title]",
  description: "Create a comprehensive Scope of Work document for procurement order...",
  business_object_type: "procurement_order",
  business_object_id: "[order-uuid]",
  assigned_to: null, // Development mode - visible to all users
  discipline: "procurement",
  priority: "high",
  status: "pending",
  metadata: {
    procurement_order_id: "[order-uuid]",
    sow_generation_required: true,
    next_step: "create_sow_via_scope_of_work_page",
    scope_of_work_url: "/scope-of-work",
    parallel_workflow: true
  }
}
```

**Appendix Contribution Tasks** (Normal Priority):
```javascript
{
  task_type: "appendix_contribution",
  title: "Review Appendix A - Technical Specifications: [Order Title]",
  description: "Review and contribute to Appendix A for procurement order...",
  business_object_type: "procurement_order",
  business_object_id: "[order-uuid]",
  assigned_to: "[user-uuid]", // Specific user assignment
  discipline: "engineering", // Based on discipline assignment
  priority: "normal",
  status: "pending",
  metadata: {
    procurement_order_id: "[order-uuid]",
    appendix_type: "A",
    order_type: "purchase_order",
    parallel_workflow: true,
    original_assigned_to: "[user-uuid]"
  }
}
```

### **Phase 2: SOW Generation**

#### **2.1 Generate Scope of Work (SOW)**

**Component**: `ScopeOfWorkModal` (multi-step wizard)
**Location**: `client/src/pages/01900-procurement/components/modals/01900-ScopeOfWorkModal.js`

**Steps**:

1. **Country Selection**: Compliance context for regional requirements
2. **Document Type**: SOW template selection
3. **Category Selection**: Procurement category filtering
4. **Template Selection**: Choose SOW structure template
5. **Draft Creation**: Basic SOW information with AI enhancement
6. **Additional Context**: Reference documents and compliance requirements
7. **Content Generation**: AI-powered SOW content creation
8. **Scope Details**: Review generated content sections
9. **User Assignment**: Assign specific users using `AppendixRequirementsDisplay`
10. **Review & Save**: Final SOW creation with task generation

**Integration Point**: SOW automatically linked to procurement order via `sow_template_id`

### **Phase 3: Collaborative Content Development**

#### **3.1 Appendix Contribution Tasks**

**Component**: `MyTasksDashboard` + task interfaces
**Location**: `client/src/pages/01300-governance/components/MyTasksDashboard.jsx`

**Automated Process**:

- Tasks created automatically during SOW generation
- One task per appendix per assigned user
- Tasks include specific contribution requirements
- Status tracking: pending → in_progress → completed
- Real-time notifications for assignments

**Task Structure**:

```javascript
{
  id: "uuid-task",
  task_type: "appendix_contribution",
  title: "Contribute to Appendix A: Equipment Procurement SOW",
  description: "Provide technical specifications and requirements for Appendix A",
  business_object_type: "scope_of_work",
  business_object_id: "uuid-sow",
  assigned_to: "uuid-user",
  discipline: "engineering",
  status: "pending",
  priority: "normal",
  metadata: {
    appendix_type: "A",
    sow_id: "uuid-sow",
    sow_title: "Equipment Procurement SOW",
    assigned_by_creator: true
  }
}
```

#### **3.2 User Collaboration**

**Process**:

1. **Task Assignment**: Users receive notifications via dashboard
2. **Content Contribution**: Users access SOW and provide appendix content
3. **Review & Approval**: Content reviewed by assigned discipline leads
4. **Status Updates**: Real-time progress tracking
5. **Completion Notification**: System alerts when all appendices complete

### **Phase 4: Approval & Finalization**

#### **4.1 Governance-Controlled Approval Routing**

**Component**: Limits of Authority System (`limits_of_authority` table)
**Database**: `sql/create_limits_of_authority_table.sql`
**Function**: `get_limits_of_authority_approvals()`

**Process**:

- **Automatic Resolution**: System queries limits of authority based on:
  - Organization ID
  - Department code
  - Document type (procurement_order, work_order, service_order)
  - Order value (amount-based thresholds)
- **Dynamic Approval Matrix**: Returns required approval roles from governance-maintained rules
- **No Manual Configuration**: Procurement officers cannot override governance rules

**Limits of Authority Examples**:

```sql
-- Low-value procurement order (< R25k)
{ required_approvals: ["procurement_officer"], risk_level: "low" }

-- High-value procurement order (> R250k)
{ required_approvals: ["procurement_officer", "procurement_manager", "department_head", "executive"], risk_level: "high" }

-- Work order (includes safety approvals)
{ required_approvals: ["procurement_officer", "safety_officer", "project_manager"], requires_safety: true }
```

#### **4.2 Cover Sheet Generation**

**Component**: Automated approval system
**Process**:

- Auto-generates professional cover sheet using resolved approval matrix
- Includes order details, governance-determined routing information
- Supports sequential/parallel workflows based on limits of authority
- Integrates with document assembly system

#### **4.3 Approval Workflow Execution**

**Component**: Approval routing system
**Process**:

- **Governance-Driven Routing**: Approval requirements determined by limits of authority
- **Sequential Approval**: Follows governance-defined approval hierarchy
- **Parallel Approval**: Supported for governance-configured parallel paths
- **Technical Approvals**: Automatically included for work orders (safety, project manager)
- **Status Tracking**: Real-time approval progress
- **Escalation**: Automated reminders for overdue approvals

#### **4.4 Final Document Assembly**

**Component**: Universal Document Assembly Dashboard
**Location**: `client/src/pages/01900-procurement/components/DocumentAssemblyDashboard.jsx`

**Key Features**:
- ✅ **Universal Design**: Scalable across procurement, engineering, legal, and construction disciplines
- ✅ **Real-time Assembly Progress**: Step-by-step compilation with progress indicators
- ✅ **Content Validation**: Automatic readiness checking for SOW and appendix completion
- ✅ **Configuration Options**: Output format (PDF/Word/Both), package structure, file naming
- ✅ **Security Controls**: Password protection and watermark options
- ✅ **Package Generation**: ZIP packages with individual document downloads
- ✅ **Distribution Ready**: Send-to-stakeholder functionality with recipient management

---

## 🏗️ **Preparatory Configuration Layer**

### **Document Variation Builder System**

**Component**: `DocumentOrderingManagementPage` with integrated Builder Interface
**Location**: `client/src/pages/01900-procurement/components/document-ordering-management-page.js`
**URL**: `http://localhost:3060/#/document-ordering-management`
**Purpose**: Visual builder for assembling contract variations with agent-friendly task decomposition

#### **System Overview**

The Document Variation Builder serves as the **foundational configuration layer** that precedes the procurement document generation workflow. It provides a sophisticated visual builder interface where users can assemble contract variations by dragging document sections like building blocks, with built-in agent capability indicators and task decomposition preview.

#### **Agent-Friendly Builder Interface - IMPLEMENTED ✅**

**Three-Panel Design - PRODUCTION READY:**
```
┌─────────────────────────────────────────────────┐
│ Header: Contract Type + Variation Controls      │
├─────────────────┬───────────────────────────────┤
│ Available       │ Variation Builder Canvas      │
│ Document        │                               │
│ Sections        │ [Drop zones for each appendix]│
│ Panel           │                               │
│ (Left Sidebar)  │ A: [Product Specs] [SDS]       │
├─────────────────┼───────────────────────────────┤
│ Action Panel    │ B: [Delivery Schedule]        │
│ (Bottom)        │                               │
│ [Save] [Manage] │ C: [Training Materials]       │
│ [Create Order]  │                               │
└─────────────────┴───────────────────────────────┘
```

**Enhanced UI Features - LATEST UPDATE:**
- ✅ **Add Section Button**: Green "+" button in library header for dynamic section creation
- ✅ **Add Section Modal**: Comprehensive form for creating new document sections
- ✅ **Real-time Library Updates**: New sections appear immediately without page refresh
- ✅ **Section Validation**: Required fields, character limits, and type validation
- ✅ **Document Type Management**: Dynamic tag system for available document types
- ✅ **Variation Management Interface**: Complete CRUD operations for saved variations (Load, Edit, Duplicate, Delete)

**Available Document Sections Panel (Left Sidebar) - IMPLEMENTED:**
- **📄 Forms**: Interactive templates (Product Specs, Training Materials)
- **📋 Appendices**: Standard contract sections A-F (including technical docs like SDS)
- **📊 Schedules**: Both document schedules AND time schedules

**Agent Capability Indicators - IMPLEMENTED ✅**
- **🤖 AI-Auto**: 60%+ AI-editable fields - Now calculated from real template permissions
- **👤 Manual**: Requires human input (editable fields) - Analyzed from field behaviors
- **📖 Reference**: Read-only information - Based on protected fields
- **🔄 Hybrid**: Mixed AI and manual capabilities - Calculated from field ratios

**✅ TEMPLATE PERMISSIONS INTEGRATION COMPLETED**
- ✅ Connected with `/api/templates` endpoint via `TemplatePermissionsService`
- ✅ Analyzes template `field_protection` and `field_behaviors` settings
- ✅ Calculates actual agent capabilities based on field permission ratios
- ✅ Updates capability indicators with real data from existing field protection system
- ✅ Real-time analysis for both library sections and canvas sections
- ✅ Caching system for performance optimization

#### **Role-Based Access Control**

**User Access Levels:**

- **Governance Administrators**: Full access to configure document variations across **all disciplines** in the organization
- **Discipline Users**: Restricted access to manage document variations for **only their assigned discipline(s)**

**Access Logic:**
- Governance users see all disciplines (Governance, Procurement, Civil Engineering, HSSE Safety, Contracts Post Award)
- Discipline users see only disciplines they are assigned to via the `user_discipline_access` table
- This prevents unauthorized users from modifying document structures for disciplines they don't belong to

#### **Multi-Template Architecture - FULLY IMPLEMENTED** ✅

**✅ PRODUCTION READY**: Multi-dimensional document ordering system now fully operational with unlimited template variations.

**Implementation Status**: Complete - All phases delivered and tested

**Final Implementation:**
1. **Phase 1**: Database Schema Enhancement ✅ **COMPLETED**
2. **Phase 2**: API Layer Updates ✅ **COMPLETED**
3. **Phase 3**: Service Layer Modifications ✅ **COMPLETED**
4. **Phase 4**: Frontend UI Enhancement ✅ **COMPLETED**
5. **Phase 5**: Testing & Validation ✅ **COMPLETED**

**Production Features:**
- ✅ Role-based filtering implemented (Phase 1.1)
- ✅ Database schema with multi-dimensional support (Phase 1.2)
- ✅ Multi-dimensional API endpoints (Phase 2)
- ✅ Enhanced service layer functions (Phase 3)
- ✅ Enhanced MyTasksDashboard with Workflow Diagrams (Phase 4)
- ✅ 100% Workflow Optimization Guide Compliance (Phase 4.1)
- ✅ Template variation selector in UI (Phase 4.2)
- ✅ Dynamic section loading (Phase 4.3)

---

## 🤖 **Agent Workflow Integration**

### **Complete Agent Workflow Integration**

**System Status**: Procurement orders now trigger a complete 6-agent workflow with automatic document generation. Agents process business logic and populate template data, then the DocumentGenerator service uses the exact HTML templates to create final client-compliant documents.

**Agent Sequence**:
1. **Template Analysis Agent**: Analyzes selected templates and requirements
2. **Requirement Extraction Agent**: Extracts technical and compliance requirements
3. **Compliance Validation Agent**: Ensures regulatory compliance
4. **Field Population Agent**: Auto-populates form fields with extracted data
5. **Quality Assurance Agent**: Validates populated content accuracy
6. **Final Review Agent**: Performs final quality check and formatting

**DocumentGenerator Service Integration**:
- **Input**: Agent-populated template data + HTML templates from database
- **Process**: Renders exact client HTML templates with agent data
- **Output**: Client-compliant documents in HTML, PDF, and Word formats
- **Templates**: Stored in database (`prompt_template` field) for version control

### **Development Mode Authentication Bypass**

**RLS Policies**: Allow access when `auth.uid() IS NULL` for development mode
**Task Assignment**: Tasks assigned to `assigned_to: null` (visible to all users via auth bypass)
**Metadata Tracking**: `original_assigned_to` preserved for production migration
**Development Flag**: `development_mode: true` in task metadata

**Production Mode Behavior**:
- Tasks assigned to specific authenticated users as selected in UI
- Standard user-based task filtering and permissions
- Full authentication required - no bypass

---

## 📄 **Templates & Forms Management**

### **Available Procurement Templates (Updated 2025-12-12)**

**✅ SYSTEM NOW OPERATIONAL**: The procurement templates-forms-management page at `http://localhost:3060/#/templates-forms-management?discipline=01900` now displays 7 fully functional procurement templates:

**Equipment Rental Agreement Form**
- Complete HTML form with validation schemas
- Fields: Equipment Type, Rental Period, Daily Rate, Delivery Location, Special Requirements
- Suitable for: equipment_rental, rental_agreement document types

**Supplier Evaluation Form**
- Comprehensive supplier qualification form
- Fields: Company Name, Contact Person, Product/Services, Quality/Delivery/Price Ratings (1-5 scale), Certifications, Recommendations
- Suitable for: supplier_evaluation, vendor_assessment document types

**Contractor Performance Review**
- Multi-dimensional contractor assessment form
- Fields: Contractor Name, Contract Number, Review Period, Work Quality, Timeliness, Safety Compliance, Communication, Cost Control, Overall Rating
- Suitable for: contractor_review, performance_evaluation, vendor_assessment document types

**Purchase Order Request Form**
- Complete purchase request workflow form
- Fields: Requester Info, Request Details, Item Description, Quantity, Unit Price, Total Cost, Budget Code, Approval Requirements
- Suitable for: purchase_request, procurement_request, order_request document types

**Vendor Registration Form**
- Comprehensive vendor onboarding form
- Fields: Company Details, Business Registration, Tax ID, Business Address, Contact Info, Business Type, Products/Services, Certifications, References
- Suitable for: vendor_registration, supplier_registration, vendor_onboarding document types

**Additional Templates**:
- Form - Scope Of Work Test (draft status - for testing)
- Form - Lubricants Form (active - procurement SOW template)

**Technical Implementation**:
- All templates use `discipline: 'Procurement'` for proper filtering
- Templates include complete HTML forms, JSON validation schemas, and UI configuration
- Discipline code mapping (01900 → Procurement) implemented in API routes
- Templates accessible via `/api/templates?status=all&user_role=unknown&discipline=01900`

---

## 🔧 **Development Best Practices**

### **User Assignment Implementation Pattern**

**Always follow this pattern for reliable user assignments:**

```javascript
// 1. Load users with disciplines array
const usersWithDisciplines = fetchedUsers.map(user => ({
  ...user,
  disciplines: Array.from(assignedDisciplineNames)
}));

// 2. Filter by discipline name matching
const filteredUsers = usersWithDisciplines.filter(user => {
  const assignedNames = assignedDisciplines.map(id =>
    allDisciplines.find(d => d.id === id)?.name || id
  );
  return assignedNames.some(name =>
    user.disciplines.some(userDisc =>
      userDisc.toLowerCase().includes(name.toLowerCase())
    )
  );
});

// 3. Pass to UserSelector with onUserAssignment handler
<UserSelector
  availableUsers={filteredUsers}
  onUserAssignment={(appendix, userId, assign) => {
    console.log('[USER_ASSIGNMENT]', { appendix, userId, assign });
    // Update state and trigger task creation
  }}
/>
```

### **Debug Logging Standards**

**Always include these debug logs in user assignment components:**

```javascript
// Component render logging
console.log(`[ComponentName] Rendering with ${users.length} users`);

// State change logging
console.log(`[ComponentName] State updated:`, newState);

// API call logging
console.log(`[ComponentName] API call:`, params);

// Error logging
console.error(`[ComponentName] Error:`, error);
```

### **Data Structure Validation**

**Always validate data structures before processing:**

```javascript
// Validate user objects have required properties
const validUsers = users.filter(user =>
  user.id && user.email && Array.isArray(user.disciplines)
);

// Validate discipline assignments
const validAssignments = Object.entries(disciplineAssignments).filter(
  ([appendix, disciplines]) => Array.isArray(disciplines) && disciplines.length > 0
);