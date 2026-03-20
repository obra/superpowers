# Testing Guide: Create Procurement Order Modal (01900)

## Overview

This guide covers testing strategies for the Create Procurement Order modal workflow in page 01900. The modal implements a 5-phase workflow for creating procurement orders with SOW (Scope of Work) template integration.

## Agent Integration

### Procurement Order Testing Agent

A dedicated testing agent (`ProcurementOrderTestingAgent`) has been created to help track debugging progress through the modal workflow.

**Location:** `deep-agents/deep_agents/agents/shared/ai_it_specialists/a_0211_procurement_order_testing_agent.py`

**Usage:**

```python
from deep_agents.agents.shared.ai_it_specialists import ProcurementOrderTestingAgent, create_procurement_order_testing_agent

# Create the testing agent
agent = create_procurement_order_testing_agent()

# Initialize
await agent._initialize_impl()

# Execute testing workflow
result = await agent._execute_impl(workflow_state)

# Get test data template for quick testing
test_data = agent.get_test_data_template('purchase_order')
```

## Modal Workflow Phases

### Phase 1: Basic Order Information

**Required Fields:**
- `orderType` - Type of order (purchase_order, service_order, work_order)
- `title` - Order title
- `estimatedValue` - Estimated order value
- `projectId` - Associated project ID

**Optional Fields:**
- `description` - Order description
- `priority` - Priority level (low, medium, high, urgent)
- `currency` - Currency code (ZAR, USD, EUR, GBP)
- `supplierId` - Supplier ID
- `department` - Primary discipline code
- `procurementCategory` - Procurement category ID
- `specialRequirements` - Special requirements notes

**Validation Checks:**
- Order type must be valid
- Estimated value must be > 0
- Project must be selected

**Common Issues:**
- Projects not loading → Check `loadProjects()` function
- Suppliers not loading → Check `loadSuppliers()` function
- Disciplines not loading → Check `getUserAssignableDisciplines()` function

### Phase 2: SOW Template Selection

**Required Fields:**
- `selectedSOWTemplate` - Selected SOW template object

**Validation Checks:**
- Template must have `template_name`
- Template should have `appendix_definitions`

**Common Issues:**
- No SOW templates available → Check `loadSOWTemplatesForOrderType()` function
- Template not loading details → Check `getSOWTemplateById()` function

### Phase 3: Discipline Assignment

**Required Fields:**
- `disciplineAssignments` - Object with appendix assignments

**Appendix Definitions:**
- `appendix_a` - Product Specifications
- `appendix_b` - Quality Assurance Requirements
- `appendix_c` - Health, Safety & Environmental Requirements
- `appendix_d` - Training Materials & Documentation
- `appendix_e` - Logistics Documents
- `appendix_f` - Packing & Marking Requirements

**Validation Checks:**
- At least one discipline assigned per required appendix
- Disciplines must be valid IDs

**Common Issues:**
- No disciplines available → Check `loadDisciplines()` function
- Users not loading → Check `loadUsersForDisciplines()` function

### Phase 4: Approval Configuration

**Configuration Options:**
- `generateCoverSheet` - Boolean to generate approval cover sheet
- `routingType` - Approval routing type (sequential, parallel, hybrid)
- `approvalMatrix` - Auto-generated approval matrix

**Auto-Generated Approval Matrix:**
- Order value > R25,000: Procurement Officer + Procurement Manager
- Order value > R100,000: Procurement Manager + Department Head + Executive
- Work orders: Safety Officer + Project Manager (additional)

**Validation Checks:**
- Routing type must be valid
- Approval matrix appropriate for order value

### Phase 5: Review & Create

**Final Validation:**
- All required fields from previous phases
- SOW template selected
- Order summary complete

**Order Creation:**
- Calls `handleSubmit` from parent component
- Includes `discipline_assignments`, `user_assignments`, `approval_config`
- Sets `sow_template_id` for SOW templates

## Test Scenarios

### Scenario 1: Quick Manual Testing

1. Open the Create Procurement Order modal
2. Click "Insert Test Data" button
3. Verify form is populated with test values
4. Navigate through phases 2-5
5. Create order

### Scenario 2: Purchase Order Flow

```javascript
// Test data for purchase order
const testPurchaseOrder = {
  orderType: 'purchase_order',
  title: 'Test Purchase Order - Manual Testing',
  description: 'Test order for manual testing purposes',
  priority: 'medium',
  estimatedValue: '50000',
  currency: 'ZAR',
  department: '00850',
  specialRequirements: 'Test requirements'
};
```

### Scenario 3: Work Order Flow (with Safety Approval)

```javascript
// Test data for work order
const testWorkOrder = {
  orderType: 'work_order',
  title: 'Test Work Order - Safety Equipment',
  description: 'Test work order with safety requirements',
  priority: 'high',
  estimatedValue: '150000',
  currency: 'ZAR',
  department: '00870',
  specialRequirements: 'Safety equipment required. Hazardous materials involved.'
};
```

### Scenario 4: Service Order Flow

```javascript
// Test data for service order
const testServiceOrder = {
  orderType: 'service_order',
  title: 'Test Service Order - Consulting Services',
  description: 'Test service order for consulting',
  priority: 'low',
  estimatedValue: '25000',
  currency: 'ZAR',
  department: '01300',
  specialRequirements: 'Professional services'
};
```

## Debugging Common Issues

### Issue: Projects Not Loading

**Symptoms:**
- Project dropdown empty
- Console warning: "No active projects found"

**Debug Steps:**
1. Check Supabase connection
2. Verify `projects` table has active projects
3. Check organization ID matches
4. Verify `workflow_status = 'active'` filter

**Console Logs to Check:**
```
[CREATE_ORDER_MODAL] Loading active projects...
[CREATE_ORDER_MODAL] ✅ Successfully loaded X active projects
```

### Issue: Suppliers Not Loading

**Symptoms:**
- Supplier dropdown empty
- Console warning: "No approved suppliers found"

**Debug Steps:**
1. Check `suppliers` table has approved suppliers
2. Verify `approval_status = 'approved'` filter
3. Check organization ID matches

**Console Logs to Check:**
```
[CREATE_ORDER_MODAL] Loading suppliers...
[CREATE_ORDER_MODAL] ✅ Successfully loaded suppliers: X
```

### Issue: SOW Templates Not Loading

**Symptoms:**
- SOW template dropdown empty
- Cannot proceed past Phase 2

**Debug Steps:**
1. Check `loadSOWTemplates()` function
2. Verify templates exist for order type
3. Check template service endpoint

**Console Logs to Check:**
```
[CREATE_ORDER_MODAL] Loading SOW templates for order type: purchase_order
[CREATE_ORDER_MODAL] SOW templates loaded: X
```

### Issue: Disciplines Not Loading

**Symptoms:**
- Discipline dropdowns empty in Phase 3
- Cannot assign disciplines to appendices

**Debug Steps:**
1. Check `getUserAssignableDisciplines()` function
2. Verify user has discipline permissions
3. Check organization discipline configuration

**Console Logs to Check:**
```
[CREATE_ORDER_MODAL] Loading disciplines...
[CREATE_ORDER_MODAL] ✅ Successfully loaded X disciplines
```

### Issue: Order Creation Fails

**Symptoms:**
- Error on Phase 5 submission
- Order not created in database

**Debug Steps:**
1. Check all required fields are populated
2. Verify SOW template is selected
3. Check `handleSubmit` function in parent component
4. Verify database connection and permissions

**Console Logs to Check:**
```
[CREATE_ORDER_MODAL] 🚀 Starting order creation process...
[CREATE_ORDER_MODAL] 📋 Order data prepared: {...}
[CREATE_ORDER_MODAL] ✅ Order created successfully
```

## Integration with Testing Dashboard

The Procurement Order Testing Agent integrates with the existing Testing Dashboard (page 02050) for comprehensive testing:

1. Navigate to Testing Dashboard
2. Select "Procurement Order Workflow" from available tests
3. Run tests with real-time event streaming
4. View test results and validation reports

## Manual Testing Checklist

### Phase 1 Testing
- [ ] Order type selection works
- [ ] Title input accepts text
- [ ] Estimated value accepts numbers
- [ ] Project dropdown populates
- [ ] Supplier dropdown populates (optional)
- [ ] Priority selection works
- [ ] Currency selection works
- [ ] "Insert Test Data" button populates form

### Phase 2 Testing
- [ ] SOW templates load for selected order type
- [ ] Template selection populates preview
- [ ] Auto-assignments display correctly
- [ ] Task sequence preview shows (if enabled)

### Phase 3 Testing
- [ ] Disciplines load for assignment
- [ ] Appendix sections display correctly
- [ ] Discipline assignment works
- [ ] User assignment works (if users available)

### Phase 4 Testing
- [ ] Approval matrix auto-generates based on value
- [ ] Routing type selection works
- [ ] Cover sheet toggle works

### Phase 5 Testing
- [ ] Order summary displays correctly
- [ ] All selected options shown
- [ ] Create button submits order
- [ ] Success/error feedback shown

## Automated Testing

### Unit Tests

```javascript
// Test Phase 1 validation
describe('Phase 1: Basic Info Validation', () => {
  test('should require orderType', () => {
    const formData = { title: 'Test', estimatedValue: '1000', projectId: '123' };
    const valid = validateBasicInfo(formData);
    expect(valid.missing_fields).toContain('orderType');
  });

  test('should require title', () => {
    const formData = { orderType: 'purchase_order', estimatedValue: '1000', projectId: '123' };
    const valid = validateBasicInfo(formData);
    expect(valid.missing_fields).toContain('title');
  });

  test('should validate estimated value > 0', () => {
    const formData = { orderType: 'purchase_order', title: 'Test', estimatedValue: '0', projectId: '123' };
    const valid = validateBasicInfo(formData);
    expect(valid.validation_errors).toContain('Estimated value must be greater than 0');
  });
});
```

### Integration Tests

```javascript
// Test complete workflow
describe('Create Procurement Order Workflow', () => {
  test('should complete full workflow with valid data', async () => {
    // 1. Open modal
    // 2. Fill Phase 1
    // 3. Select template in Phase 2
    // 4. Assign disciplines in Phase 3
    // 5. Configure approvals in Phase 4
    // 6. Review and create in Phase 5
    // 7. Verify order created
  });
});
```

## Related Documentation

- **Testing Dashboard:** `/client/src/pages/02050-testing-dashboard/`
- **Create Order Modal:** `/client/src/pages/01900-procurement/components/modals/CreateOrderModal.jsx`
- **Procurement Page:** `/client/src/pages/01900-procurement/components/01900-procurement-page.js`
- **Handoff System:** `/docs/workflows-simulations/01900_TESTING_GUIDE_HANDOFF_SYSTEM.md`

## Version

**Version:** 1.0.0  
**Date:** 2026-02-20  
**Status:** Production Ready