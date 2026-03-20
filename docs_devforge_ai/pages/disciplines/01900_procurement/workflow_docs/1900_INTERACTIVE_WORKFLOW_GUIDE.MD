# 01900 Interactive Procurement Workflow Guide

## Overview

This document describes the interactive capabilities of the procurement workflow, where users are prompted for clarification, additional inputs, and confirmations at each stage.

## Interactive Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTERACTIVE PROCUREMENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 1: ORDER CREATION (Interactive)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🤖 Agent: "What would you like to order?"                               ││
│  │ 👤 User: "I need some lubricants"                                       ││
│  │                                                                          ││
│  │ 🤖 Agent: "I found partial information. Please provide:"                ││
│  │    • Product Name: [Lubricants] ✓                                       ││
│  │    • Specification: [?] ← ASKS USER                                     ││
│  │    • Quantity: [?] ← ASKS USER                                          ││
│  │    • Rate: [?] ← ASKS USER                                              ││
│  │                                                                          ││
│  │ 👤 User: "15W-40 diesel engine oil, 50 liters at R1200 each"            ││
│  │                                                                          ││
│  │ 🤖 Agent: "Here's what I understood:"                                   ││
│  │    • Product: 15W-40 Diesel Engine Oil                                  ││
│  │    • Quantity: 50 liters                                                ││
│  │    • Rate: R1,200 each                                                  ││
│  │    • Total: R60,000                                                     ││
│  │                                                                          ││
│  │    [Confirm] [Edit] [Add More Items]                                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  STAGE 2: SOW GENERATION (Interactive)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🤖 Agent: "Generating Scope of Work..."                                 ││
│  │                                                                          ││
│  │ 🤖 Agent: "I need clarification for SOW:"                               ││
│  │    • Is this for a specific project? [Yes/No]                           ││
│  │    • Required delivery date? [Date picker]                              ││
│  │    • Any compliance requirements? [Select: ISO, SANS, Other]            ││
│  │                                                                          ││
│  │ 👤 User: "Yes, Project Alpha. Delivery by March 15. ISO 9001."          ││
│  │                                                                          ││
│  │ 🤖 Agent: "SOW Generated. Review sections:"                             ││
│  │    • Appendix A: Technical Specs [Review/Edit]                          ││
│  │    • Appendix B: Safety Data [Review/Edit]                              ││
│  │    • Appendix C: Delivery Schedule [Review/Edit]                        ││
│  │                                                                          ││
│  │    [Approve SOW] [Request Changes]                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  STAGE 3: APPENDIX COMPLETION (Interactive + Collaborative)                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🤖 Agent: "Assigning appendix contributors..."                          ││
│  │                                                                          ││
│  │ 🤖 Agent: "Who should complete each appendix?"                          ││
│  │    • Appendix A (Technical): [User selector] ← ASKS USER                ││
│  │    • Appendix B (Safety): [User selector] ← ASKS USER                   ││
│  │    • Appendix C (Delivery): [User selector] ← ASKS USER                 ││
│  │                                                                          ││
│  │ 👤 User: "Assign A to John, B to Safety Team, C to Logistics"           ││
│  │                                                                          ││
│  │ 🤖 Agent: "Tasks created. Waiting for contributors..."                  ││
│  │                                                                          ││
│  │ 📧 Notification sent to: John, Safety Team, Logistics                   ││
│  │                                                                          ││
│  │ 🤖 Agent: "John completed Appendix A. Review needed:"                   ││
│  │    [Approve] [Request Changes]                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  STAGE 4: ORDER COMPILATION (Interactive)                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🤖 Agent: "Compiling final order package..."                            ││
│  │                                                                          ││
│  │ 🤖 Agent: "All appendices complete. Review compiled order:"             ││
│  │    • Order Summary: [View]                                              ││
│  │    • SOW Document: [View/Download]                                      ││
│  │    • Appendix A-F: [View/Download each]                                 ││
│  │                                                                          ││
│  │ 🤖 Agent: "Select output format:"                                       ││
│  │    [PDF] [Word] [HTML] [ZIP Package]                                    ││
│  │                                                                          ││
│  │ 👤 User: "Download as PDF"                                               ││
│  │                                                                          ││
│  │ 🤖 Agent: "Order package ready for approval routing:"                   ││
│  │    • Approver 1: Procurement Officer [Assign]                           ││
│  │    • Approver 2: Manager [Auto-assigned based on value]                 ││
│  │                                                                          ││
│  │    [Send for Approval] [Modify Approvers]                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  STAGE 5: LOGISTICS (Triggered by Order Signed - Interactive)                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🤖 Agent: "Order signed! Initiating logistics..."                       ││
│  │                                                                          ││
│  │ 🤖 Agent: "Logistics planning questions:"                               ││
│  │    • Delivery address? [Address input]                                  ││
│  │    • Preferred shipping method? [Road/Air/Sea]                          ││
│  │    • Special handling requirements? [Yes/No]                            ││
│  │    • Insurance required? [Yes/No]                                       ││
│  │                                                                          ││
│  │ 👤 User: "123 Industrial Ave, Road transport, No special handling, Yes" ││
│  │                                                                          ││
│  │ 🤖 Agent: "Logistics plan created:"                                     ││
│  │    • Carrier: ABC Transport                                             ││
│  │    • ETA: 5 business days                                               ││
│  │    • Cost: R15,000                                                      ││
│  │                                                                          ││
│  │    [Approve Logistics] [Request Changes]                                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  STAGE 6: CUSTOMS CLEARANCE (Interactive for International)                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🤖 Agent: "International shipment detected. Customs required."          ││
│  │                                                                          ││
│  │ 🤖 Agent: "Customs documentation needed:"                               ││
│  │    • HS Code: [Auto-suggested: 2710.19] [Confirm/Change]                ││
│  │    • Country of origin: [Detected: South Africa] [Confirm]              ││
│  │    • Import permit required? [Check based on destination]               ││
│  │                                                                          ││
│  │ 👤 User: "Confirm HS code, origin correct, no permit needed"            ││
│  │                                                                          ││
│  │ 🤖 Agent: "Customs declaration prepared:"                               ││
│  │    • Estimated duty: R5,200                                              ││
│  │    • Documents: Commercial Invoice, Packing List, Certificate of Origin ││
│  │                                                                          ││
│  │    [Submit to Customs] [Review Documents]                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  STAGE 7: DELIVERY (Interactive Confirmation)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 🤖 Agent: "Shipment in transit. Tracking: ABC123"                       ││
│  │                                                                          ││
│  │ 🤖 Agent: "Out for delivery today. Please confirm:"                     ││
│  │    • Someone available to receive? [Yes/No]                             ││
│  │    • Delivery instructions? [Optional input]                            ││
│  │                                                                          ││
│  │ 👤 User: "Yes, deliver to receiving dock, contact John 0821234567"      ││
│  │                                                                          ││
│  │ 🤖 Agent: "Delivery completed! Please confirm:"                         ││
│  │    • Quantity received: [50 liters] [Correct/Adjust]                    ││
│  │    • Condition: [Good/Damaged]                                          ││
│  │    • Sign proof of delivery: [Digital signature]                        ││
│  │                                                                          ││
│  │ 👤 User: [Signs digitally]                                               ││
│  │                                                                          ││
│  │ 🤖 Agent: "✅ Workflow Complete! Documents available:"                   ││
│  │    • Purchase Order [Download]                                          ││
│  │    • SOW Document [Download]                                            ││
│  │    • Delivery Receipt [Download]                                        ││
│  │    • Complete Package (ZIP) [Download]                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Interactive Touchpoints by Stage

### Stage 1: Order Creation

| Touchpoint | Trigger | User Action | Agent Response |
|------------|---------|-------------|----------------|
| Missing field | Partial data detected | Provide value | Acknowledge, ask next missing field |
| Ambiguous input | Multiple interpretations | Clarify selection | Confirm understanding |
| Data validation | Invalid format | Correct format | Validate and proceed |
| Confirmation | All fields collected | Confirm/Edit/Add | Proceed to next stage |

**Interactive Modes:**
1. **Step-by-step**: Collects one field at a time
2. **Table fill**: Shows fillable table for batch input
3. **Clarification**: Asks for specific missing information

### Stage 2: SOW Generation

| Touchpoint | Trigger | User Action | Agent Response |
|------------|---------|-------------|----------------|
| Project selection | SOW initiated | Select project | Link SOW to project |
| Timeline input | Delivery date needed | Provide date | Calculate milestones |
| Compliance selection | Standards required | Select standards | Add compliance sections |
| Template selection | Multiple templates match | Choose template | Apply template formatting |
| Section review | SOW generated | Review/Edit sections | Update content |

### Stage 3: Appendix Completion

| Touchpoint | Trigger | User Action | Agent Response |
|------------|---------|-------------|----------------|
| User assignment | Appendix created | Assign contributor | Create task, notify user |
| Content review | Contributor submits | Approve/Request changes | Update status |
| Missing content | Deadline approaching | Remind/Prompt | Escalate if needed |
| Quality check | Content submitted | Validate completeness | Flag issues |

### Stage 4: Order Compilation

| Touchpoint | Trigger | User Action | Agent Response |
|------------|---------|-------------|----------------|
| Format selection | Compilation complete | Select output format | Generate document |
| Approver assignment | Ready for approval | Assign/Modify approvers | Route for approval |
| Package review | Before finalization | Review all documents | Allow modifications |

### Stage 5: Logistics

| Touchpoint | Trigger | User Action | Agent Response |
|------------|---------|-------------|----------------|
| Delivery details | Order signed | Provide address/instructions | Create logistics plan |
| Carrier selection | Multiple options | Select carrier | Book shipment |
| Special requirements | Hazardous/fragile items | Specify handling | Add to shipping docs |

### Stage 6: Customs Clearance

| Touchpoint | Trigger | User Action | Agent Response |
|------------|---------|-------------|----------------|
| HS Code confirmation | International shipment | Confirm/Suggest code | Submit declaration |
| Document upload | Additional docs needed | Upload documents | Attach to shipment |
| Duty payment | Clearance pending | Approve payment | Process clearance |

### Stage 7: Delivery

| Touchpoint | Trigger | User Action | Agent Response |
|------------|---------|-------------|----------------|
| Delivery confirmation | Shipment arriving | Confirm availability | Notify carrier |
| Receipt verification | Goods delivered | Verify quantity/condition | Record any issues |
| Digital signature | Verification complete | Sign POD | Complete workflow |

## Conversation State Machine

```javascript
const conversationStates = {
  // Order Creation States
  'initial': {
    description: 'Waiting for user input',
    transitions: ['parsing', 'clarification', 'step_by_step']
  },
  'parsing': {
    description: 'Processing tabular data',
    transitions: ['confirmation', 'table_fill', 'clarification']
  },
  'clarification': {
    description: 'Asking for missing fields',
    transitions: ['confirmation', 'step_by_step']
  },
  'table_fill': {
    description: 'User filling table',
    transitions: ['confirmation', 'clarification']
  },
  'step_by_step': {
    description: 'Collecting fields one at a time',
    transitions: ['confirmation']
  },
  'confirmation': {
    description: 'Waiting for user confirmation',
    transitions: ['completed', 'step_by_step'] // step_by_step for add_more
  },
  'completed': {
    description: 'Order complete, workflow triggered',
    transitions: [] // Terminal state
  }
};
```

## HITL (Human-in-the-Loop) Gates

### Automatic HITL Triggers

| Condition | Gate | Required Action |
|-----------|------|-----------------|
| Order value > R100,000 | High-value approval | Manager approval |
| Hazardous materials detected | Safety review | Safety officer sign-off |
| International shipment | Customs compliance | Documentation review |
| New supplier | Supplier verification | Procurement team review |
| Non-standard terms | Legal review | Legal team approval |

### HITL Gate Implementation

```javascript
async evaluateHITLGate(gateName, stageResult, procurementData) {
  const gateConfig = {
    'high_value_approval': {
      threshold: 100000,
      approvers: ['procurement_manager', 'finance_director'],
      timeout: 48 // hours
    },
    'safety_review': {
      trigger: 'hazardous_materials',
      approvers: ['safety_officer'],
      timeout: 24
    },
    'customs_compliance': {
      trigger: 'international_shipment',
      approvers: ['customs_specialist'],
      timeout: 72
    }
  };
  
  const config = gateConfig[gateName];
  
  if (this.shouldTriggerGate(gateName, stageResult, procurementData)) {
    return {
      gateTriggered: true,
      gateName: gateName,
      approvers: config.approvers,
      timeout: config.timeout,
      message: `HITL gate '${gateName}' triggered. Waiting for approval.`
    };
  }
  
  return { gateTriggered: false };
}
```

## Event-Driven UI Updates

The workflow dispatches events that UI components can listen to:

```javascript
// Listen for workflow events
document.addEventListener('procurement_workflow_stage_completed', (e) => {
  console.log('Stage completed:', e.detail.stage);
  updateProgressBar(e.detail.stage);
});

document.addEventListener('procurement_workflow_clarification_needed', (e) => {
  console.log('Clarification needed:', e.detail.missingFields);
  showClarificationDialog(e.detail);
});

document.addEventListener('procurement_workflow_hitl_gate', (e) => {
  console.log('HITL gate triggered:', e.detail.gateName);
  showApprovalRequest(e.detail);
});

document.addEventListener('procurement_workflow_document_ready', (e) => {
  console.log('Document ready:', e.detail.documentName);
  enableDownloadButton(e.detail.downloadUrl);
});
```

## Best Practices for Interactive Workflows

1. **Progressive Disclosure**: Only ask for information when needed
2. **Smart Defaults**: Pre-fill known values from context
3. **Validation Feedback**: Immediate feedback on invalid inputs
4. **Graceful Recovery**: Allow users to go back and modify
5. **Clear Progress**: Show workflow progress and remaining steps
6. **Timeout Handling**: Remind users of pending actions
7. **Escalation Path**: Clear path to human support when stuck

## Related Documentation

- [01900_PROCUREMENT_WORKFLOW_IMPLEMENTATION.md](./01900_PROCUREMENT_WORKFLOW_IMPLEMENTATION.md)
- [01700_LOGISTICS_WORKFLOW_CONFIGURATION.md](../01700_LOGISTICS_WORKFLOW/01700_LOGISTICS_WORKFLOW_CONFIGURATION.md)
- [0000_AGENT_WORKFLOW_INTEGRATION_PROCEDURE.md](../../procedures/implementation/0000_AGENT_WORKFLOW_INTEGRATION_PROCEDURE.md)