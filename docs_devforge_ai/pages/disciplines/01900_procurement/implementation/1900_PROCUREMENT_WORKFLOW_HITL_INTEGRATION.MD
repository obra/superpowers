# Procurement Workflow HITL Integration - Implementation Details

## 🎯 **HITL Enhancement Implementation**

### **Overview**
The procurement document generation workflow has been enhanced with comprehensive HITL (Human-in-the-Loop) integration based on the organization's HITL procedure. HITL is triggered conditionally based on discipline assignments to appendices.

### **HITL Trigger Conditions**

#### **1. Logistics HITL Trigger**
- **Condition**: Triggered when Logistics discipline is assigned to any appendix during procurement order creation
- **Intervention Type**: `complex_decision`
- **Reason**: Logistics coordination requires specialist human review for delivery schedules, transportation, and warehousing
- **Assignee**: Logistics specialists or procurement officers with logistics expertise

#### **2. Scheduling HITL Trigger**
- **Condition**: Triggered when Scheduling discipline is assigned to any appendix during procurement order creation
- **Intervention Type**: `approval_required`
- **Reason**: Schedule impacts require approval for timeline dependencies and project coordination
- **Assignee**: Project schedulers or procurement managers with scheduling expertise

#### **3. Final Procurement HITL Trigger**
- **Condition**: Always triggered after all appendix contributions are complete, before document assembly
- **Intervention Type**: `approval_required`
- **Reason**: Final procurement review and approval required for complete document package
- **Assignee**: Senior procurement officers or procurement directors

### **Implementation Architecture**

#### **HITL Assessment Logic** (`server/src/controllers/procurementController.js`)

```javascript
// HITL ASSESSMENT: Check for Logistics/Scheduling disciplines requiring HITL
console.log('[PROCUREMENT_ORDER] Assessing HITL requirements for procurement order');

const hitlTasks = [];
const disciplineAssignments = processedOrderData.discipline_assignments || {};

// Check each appendix assignment for HITL-required disciplines
Object.entries(disciplineAssignments).forEach(([appendix, disciplines]) => {
  if (Array.isArray(disciplines)) {
    disciplines.forEach(discipline => {
      // Logistics HITL trigger
      if (discipline.toLowerCase().includes('logistics') || discipline.toLowerCase().includes('supply_chain')) {
        console.log(`[HITL_ASSESSMENT] Logistics discipline assigned to ${appendix} - HITL required`);
        hitlTasks.push({
          intervention_type: 'complex_decision',
          reason: `Logistics coordination in ${appendix} requires specialist human review`,
          discipline: 'logistics',
          appendix: appendix,
          priority: 'high'
        });
      }

      // Scheduling HITL trigger
      if (discipline.toLowerCase().includes('scheduling') || discipline.toLowerCase().includes('project_controls')) {
        console.log(`[HITL_ASSESSMENT] Scheduling discipline assigned to ${appendix} - HITL required`);
        hitlTasks.push({
          intervention_type: 'approval_required',
          reason: `Schedule impacts in ${appendix} require approval`,
          discipline: 'scheduling',
          appendix: appendix,
          priority: 'high'
        });
      }
    });
  }
});

// Always add final procurement HITL for complete document review
console.log('[HITL_ASSESSMENT] Adding mandatory final procurement HITL review');
hitlTasks.push({
  intervention_type: 'approval_required',
  reason: 'Final procurement review and approval required before document assembly',
  discipline: 'procurement',
  appendix: 'final_review',
  priority: 'high',
  is_final_review: true
});
```

#### **HITL Assignment Service** (`server/src/services/hitlAssignmentService.js`)

The HITL Assignment Service provides intelligent specialist assignment based on:
- **Discipline Expertise**: Matches user discipline access with required HITL discipline
- **Role Suitability**: Ensures users have appropriate roles for intervention types
- **Workload Balancing**: Distributes HITL tasks to avoid specialist overload
- **Expertise Scoring**: Prioritizes specialists with relevant experience

**Key Features:**
- Flexible discipline matching (e.g., "logistics" matches "supply_chain", "logistics")
- Role-based intervention suitability (approval_required vs complex_decision)
- Workload score calculation to balance assignments
- Comprehensive audit trail logging

#### **HITL Task Creation**

**Development Mode:**
```javascript
// Tasks assigned to null (visible to all users via auth bypass)
assigned_to: null,
metadata: {
  development_mode: true,
  parallel_workflow: true,
  hitl_workflow: true
}
```

**Production Mode:**
```javascript
// Tasks assigned via HITL Assignment Service
const assignmentResult = await hitlAssignmentService.assignHITLTask(supabaseClient, hitlTask);
// assignmentResult contains assigned specialist details
```

### **Workflow Integration**

#### **UI Workflow to HITL Integration**
When a user creates a procurement order via the Purchase Orders page:

1. **Form Submission**: User completes CreateOrderModal and clicks "Create"
2. **Modal Closure**: Modal closes immediately (no waiting for processing)
3. **Chatbot Activation**: Procurement Chatbot opens with workflow streaming
4. **Sequential Agent Execution**: 7 agents execute in sequence with real-time updates:
   - Template Analysis → Requirements Extraction → Compliance Validation → Field Population → Quality Assurance → Final Review → Assignment
5. **HITL Assessment**: During processing, system checks for HITL-required disciplines
6. **Task Creation**: 
   - Standard tasks (SOW, appendices) created and assigned
   - **HITL tasks created** for Logistics/Scheduling disciplines AND final procurement review
7. **Parallel Processing**: HITL tasks run alongside regular appendix contributions
8. **Document Assembly**: Blocked until all HITL tasks resolved
9. **Final Delivery**: Complete package delivered after HITL approval

#### **Parallel Processing**
HITL tasks run in parallel with regular appendix contribution tasks:
- Logistics/Scheduling HITL can be worked on simultaneously with other discipline contributions
- Document assembly is blocked until all required HITL tasks are resolved
- Final Procurement HITL serves as quality gate before document finalization

#### **Task Metadata Structure**
```javascript
{
  task_type: 'hitl',
  title: 'Logistics HITL Review: Equipment Procurement Order',
  description: 'Logistics coordination requires specialist human review',
  business_object_type: 'procurement_order',
  business_object_id: '[order-uuid]',
  discipline: 'logistics',
  intervention_type: 'complex_decision',
  metadata: {
    procurement_order_id: '[order-uuid]',
    procurement_order_title: 'Equipment Procurement Order',
    order_type: 'purchase_order',
    hitl_reason: 'Logistics coordination requires specialist human review',
    appendix: 'appendix_d',
    is_final_review: false,
    parallel_workflow: true,
    hitl_workflow: true,
    development_mode: true
  }
}
```

#### **Chatbot Workflow Integration**
When HITL tasks are created, the chatbot displays:
```markdown
**HITL Tasks Created** ⚠️

📋 **Human-in-the-Loop Review Required:**

1. **Logistics HITL Review** (Appendix D)
   - Type: Complex Decision
   - Priority: High
   - Assigned to: Logistics Specialists

2. **Final Procurement HITL** (Complete Document)
   - Type: Approval Required
   - Priority: High
   - Assigned to: Senior Procurement Officers

📊 **Status:** All tasks created and assigned
🎯 **Next Step:** Complete HITL reviews to proceed with document assembly

---

**Task Assignment Complete.** Check MyTasksDashboard for HITL assignments.
```

### **HITL Resolution Workflow**

#### **Resolution Types**
1. **APPROVED**: Content approved as-is, workflow proceeds
2. **REJECTED**: Content rejected, alternative approach required
3. **REVISION_REQUIRED**: Content needs modifications before approval
4. **ESCALATED**: Further escalation needed to higher authority
5. **DELEGATED**: Task delegated to another qualified specialist

#### **Decision Propagation**
- Approved HITL decisions allow workflow continuation
- Rejected decisions may terminate the procurement process
- Revision requirements create follow-up tasks for corrections
- All decisions are logged in audit trail with full context

### **Performance Monitoring**

#### **HITL Metrics Tracked**
- **Resolution Time**: Average time to resolve HITL tasks by discipline
- **Approval Rate**: Percentage of HITL tasks approved vs rejected
- **Specialist Performance**: Individual specialist resolution times and quality ratings
- **Workflow Efficiency**: Impact of HITL on overall procurement cycle time

#### **Quality Assurance**
- **Decision Alignment**: Comparison of HITL decisions with AI recommendations
- **Audit Trail Review**: Regular review of HITL decision quality
- **Continuous Improvement**: HITL performance data feeds into AI model training

### **Benefits Achieved**

1. **Targeted Human Oversight**: HITL only applied where critical logistics/scheduling expertise is needed
2. **Parallel Efficiency**: HITL doesn't slow down other discipline contributions
3. **Quality Assurance**: Ensures complex procurement aspects receive proper review
4. **Scalable Architecture**: Easy to add HITL for additional disciplines if needed
5. **Audit Compliance**: Complete audit trail of all human decisions in procurement process

### **Testing & Validation**

#### **HITL Trigger Testing**
- Verify Logistics HITL triggers when Logistics discipline assigned to appendices
- Verify Scheduling HITL triggers when Scheduling discipline assigned to appendices
- Verify Final Procurement HITL always triggers before document assembly
- Confirm HITL doesn't trigger for other discipline assignments

#### **Assignment Service Testing**
- Test specialist matching for different discipline combinations
- Validate workload balancing across available specialists
- Verify role-based intervention type suitability
- Confirm audit trail logging completeness

#### **Integration Testing**
- End-to-end procurement order creation with HITL tasks
- Parallel processing of regular tasks and HITL tasks
- Document assembly blocking until HITL resolution
- Complete workflow from order creation to final document delivery