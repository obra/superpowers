# Tasks Data Editing Guide - OutstandingActions Dashboard

## 🎯 **Purpose**
This guide explains how to edit and customize the test task data for the OutstandingActions dashboard in development mode.

## 📁 **Files Available**

### 1. **tasks_migration_complete.sql** - Complete SQL with all tasks
### 2. **tasks_migration_data.sql** - Partial SQL (incomplete) 
### 3. **TASKS_DATA_EDITING_GUIDE.md** - This guide

## 🚀 **Quick Start**

### **Step 1: Clear Existing Data**
```sql
DELETE FROM tasks WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94';
```

### **Step 2: Load Test Data**
```sql
-- Copy and paste the SQL from tasks_migration_complete.sql
-- Or run the file directly in your database
```

### **Step 3: Refresh Dashboard**
- Go to the My Tasks dashboard
- Refresh the page
- You should see the populated tasks

## 📝 **How to Edit Task Data**

### **Task Types Available**
- `procurement_review` - Review procurement orders
- `sow_review` - Review scope of work documents  
- `appendix_contribution` - Contribute to SOW appendices
- `hitl` - Human-in-the-loop intervention tasks

### **Disciplines**
- `procurement` - Purchasing and procurement
- `engineering` - Technical and engineering
- `quality` - Quality assurance
- `safety` - Health and safety
- `legal` - Legal and compliance
- `governance` - Executive oversight

### **Priorities**
- `urgent` - High priority (red 🚨)
- `high` - High priority (orange ⚡)
- `normal` - Normal priority (gray 📋)
- `low` - Low priority (green ✅)

### **Statuses**
- `pending` - Awaiting action
- `in_progress` - Currently being worked on
- `draft` - Initial state
- `completed` - Finished tasks

## 🛠️ **Common Editing Scenarios**

### **Scenario 1: Add More Tasks**
```sql
INSERT INTO tasks (id, organization_id, task_type, title, description, business_object_type, business_object_id, assigned_to, assigned_by, discipline, priority, status, due_date, is_hitl, intervention_type, chatbot_session_id, created_at, updated_at, completed_at, escalated_at, metadata) VALUES
(
  gen_random_uuid(), -- Generate new UUID
  '90cd635a-380f-4586-a3b7-a09103b6df94', -- Your org ID
  'procurement_review', -- Task type
  'Review New Equipment Order', -- Title
  'Review and approve new equipment procurement', -- Description
  'procurement_order', -- Business object type
  gen_random_uuid(), -- Business object ID
  '550e8400-e29b-41d4-a716-446655440000', -- Assigned to user
  '550e8400-e29b-41d4-a716-446655440000', -- Assigned by user
  'procurement', -- Discipline
  'high', -- Priority
  'pending', -- Status
  NULL, -- Due date
  false, -- is_hitl
  NULL, -- intervention_type
  NULL, -- chatbot_session_id
  NOW(), -- created_at
  NOW(), -- updated_at
  NULL, -- completed_at
  NULL, -- escalated_at
  '{"order_number":"PO-2025-020","supplier":"ABC Corp","estimated_value":50000}'::jsonb -- metadata
);
```

### **Scenario 2: Change User Assignment**
```sql
-- Find tasks assigned to a specific user
UPDATE tasks 
SET assigned_to = '550e8400-e29b-41d4-a716-446655440001' -- New user ID
WHERE assigned_to = '550e8400-e29b-41d4-a716-446655440000'; -- Old user ID
```

### **Scenario 3: Change Task Priority**
```sql
-- Make all procurement tasks urgent
UPDATE tasks 
SET priority = 'urgent'
WHERE task_type = 'procurement_review';
```

### **Scenario 4: Add HITL Tasks**
```sql
INSERT INTO tasks (id, organization_id, task_type, title, description, business_object_type, business_object_id, assigned_to, assigned_by, discipline, priority, status, due_date, is_hitl, intervention_type, chatbot_session_id, created_at, updated_at, completed_at, escalated_at, metadata) VALUES
(
  gen_random_uuid(),
  '90cd635a-380f-4586-a3b7-a09103b6df94',
  'hitl',
  'Complex Decision: Budget Approval Required',
  'Procurement order exceeds budget threshold',
  NULL,
  NULL,
  NULL,
  '550e8400-e29b-41d4-a716-446655440005',
  'governance',
  'urgent',
  'pending',
  NULL,
  true, -- This is a HITL task
  'approval_required', -- intervention type
  NULL,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '{"threshold":100000,"order_value":150000,"reason":"budget_exceeded"}'::jsonb
);
```

### **Scenario 5: Filter by User**
```sql
-- See tasks for a specific user
SELECT * FROM tasks 
WHERE assigned_to = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;
```

### **Scenario 6: Change Organization**
```sql
-- Change organization for all tasks
UPDATE tasks 
SET organization_id = 'your-new-org-id-here';
```

## 🎨 **Dashboard-Specific Features**

### **Document Type Mapping**
The dashboard maps task types to document types:

| Task Type | Document Type | Dashboard Section |
|-----------|---------------|-------------------|
| `procurement_review` + `purchase_order` | `purchase_order` | 🛒 Procurement |
| `procurement_review` + `service_order` | `service_order` | 🔧 Procurement |
| `procurement_review` + `work_order` | `work_order` | ⚡ Procurement |
| `sow_review` | `scope_of_work` | 📋 Engineering |
| `appendix_contribution` + `A` | `sow_appendix_a` | 📄 Engineering |
| `appendix_contribution` + `B` | `sow_appendix_b` | 📊 Quality |
| `appendix_contribution` + `C` | `sow_appendix_c` | 🛡️ Safety |
| `appendix_contribution` + `F` | `sow_appendix_f` | ⚖️ Legal |
| `hitl` | `hitl_tasks` | 🤖 HITL Section |

### **User ID Reference**
From your data, the main users are:
- `550e8400-e29b-41d4-a716-446655440000` - Procurement Manager
- `550e8400-e29b-41d4-a716-446655440001` - Engineering Lead  
- `550e8400-e29b-41d4-a716-446655440002` - Quality Manager
- `550e8400-e29b-41d4-a716-446655440003` - Safety Officer
- `550e8400-e29b-41d4-a716-446655440004` - Legal Counsel
- `550e8400-e29b-41d4-a716-446655440005` - Executive/Governance

## 🔧 **Testing Tips**

### **1. Test Empty State**
```sql
DELETE FROM tasks WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94';
```
Dashboard should show "All Caught Up!" message.

### **2. Test Loading State**
Add a delay in component or temporarily break the query to see loading spinner.

### **3. Test Error State**
```sql
-- Temporarily break the query by using invalid org ID
UPDATE tasks SET organization_id = 'invalid-id';
```

### **4. Test HITL Tasks**
```sql
-- Add more HITL tasks to see the HITL section
INSERT INTO tasks (id, organization_id, task_type, title, description, business_object_type, business_object_id, assigned_to, assigned_by, discipline, priority, status, due_date, is_hitl, intervention_type, chatbot_session_id, created_at, updated_at, completed_at, escalated_at, metadata) VALUES
(gen_random_uuid(), '90cd635a-380f-4586-a3b7-a09103b6df94', 'hitl', 'Human Review Required: Safety Compliance', 'Safety documentation requires human verification', NULL, NULL, NULL, '550e8400-e29b-41d4-a716-446655440000', 'safety', 'high', 'pending', NULL, true, 'clarification_needed', NULL, NOW(), NOW(), NULL, NULL, '{"safety_level":"high","compliance_check":true}'::jsonb),
(gen_random_uuid(), '90cd635a-380f-4586-a3b7-a09103b6df94', 'hitl', 'Executive Decision: Contract Terms', 'Contract terms require executive approval', NULL, NULL, NULL, '550e8400-e29b-41d4-a716-446655440005', 'legal', 'urgent', 'pending', NULL, true, 'complex_decision', NULL, NOW(), NOW(), NULL, NULL, '{"contract_value":1000000,"risk_level":"high"}'::jsonb);
```

## 📊 **Data Analysis Commands**

### **Task Distribution**
```sql
-- Count tasks by type
SELECT task_type, COUNT(*) as count 
FROM tasks 
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
GROUP BY task_type 
ORDER BY count DESC;

-- Count tasks by discipline
SELECT discipline, COUNT(*) as count 
FROM tasks 
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
GROUP BY discipline 
ORDER BY count DESC;

-- Count tasks by priority
SELECT priority, COUNT(*) as count 
FROM tasks 
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
GROUP BY priority 
ORDER BY count DESC;
```

### **User Workload**
```sql
-- Tasks assigned to each user
SELECT assigned_to, COUNT(*) as task_count 
FROM tasks 
WHERE organization_id = '90cd635a-380f-4586-a3b7-a09103b6df94'
  AND assigned_to IS NOT NULL
GROUP BY assigned_to 
ORDER BY task_count DESC;
```

## 🎯 **Best Practices**

1. **Use Realistic Data**: Make task titles and descriptions realistic for your use case
2. **Test Edge Cases**: Try empty states, error states, and loading states
3. **User Diversity**: Assign tasks to different users to test multi-user scenarios
4. **Priority Testing**: Include urgent, high, normal, and low priority tasks
5. **Status Variety**: Mix of pending, in_progress, and completed tasks
6. **HITL Testing**: Add various intervention types to test HITL functionality

## 🔍 **Troubleshooting**

### **Tasks Not Showing**
- Check user ID matches authenticated user
- Verify organization_id is correct
- Ensure tasks have `status` in ['pending', 'in_progress', 'draft']

### **Wrong Document Types**
- Check task_type and metadata match expected patterns
- Verify business_object_type and metadata fields

### **Performance Issues**
- Limit test data to reasonable amounts (50-100 tasks)
- Use appropriate indexes on organization_id and assigned_to

## 📞 **Need Help?**

If you need to modify the data structure or add new task types, refer to the component code in `client/src/pages/01300-governance/components/MyTasksDashboard.jsx` to understand how tasks are processed and displayed.
