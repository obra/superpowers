# Procurement Orders Column Name Reference

## Database Schema (snake_case)
The database uses PostgreSQL naming conventions with snake_case:

- `created_by` (UUID, NOT NULL, REFERENCES auth.users)
- `organization_id` (UUID, REFERENCES organizations)
- `order_type` (VARCHAR)
- `estimated_value` (DECIMAL)
- `supplier_name` (VARCHAR)
- `supplier_contact` (VARCHAR)
- `project_id` (UUID)
- `template_id` (UUID)
- `approval_status` (VARCHAR)
- `delivery_date` (DATE)
- `special_requirements` (TEXT)

## JavaScript/React (camelCase)
The frontend uses JavaScript naming conventions with camelCase:

- `createdBy` → maps to `created_by`
- `organizationId` → maps to `organization_id`
- `orderType` → maps to `order_type`
- `estimatedValue` → maps to `estimated_value`
- `supplierName` → maps to `supplier_name`
- `supplierContact` → maps to `supplier_contact`
- `projectId` → maps to `project_id`
- `templateId` → maps to `template_id`
- `approvalStatus` → maps to `approval_status`
- `deliveryDate` → maps to `delivery_date`
- `specialRequirements` → maps to `special_requirements`

## Data Transformation Rules

### When sending data TO the database:
```javascript
// CORRECT ✓
const orderData = {
  order_type: formData.orderType,
  title: formData.title,
  created_by: currentUser.id,
  organization_id: currentUser.organizationId,
  estimated_value: parseFloat(formData.estimatedValue),
  supplier_name: formData.supplierName,
  project_id: formData.projectId
};

// INCORRECT ✗ - DO NOT USE camelCase for database inserts
const orderData = {
  orderType: formData.orderType,  // Wrong!
  createdBy: currentUser.id,      // Wrong!
  organizationId: currentUser.organizationId  // Wrong!
};
```

### When receiving data FROM the database:
Supabase/PostgREST returns data with snake_case column names:

```javascript
// Data from database
const order = {
  id: "...",
  order_type: "purchase_order",
  created_by: "...",
  organization_id: "...",
  estimated_value: 1000.00
};

// Transform for React state (optional)
const formData = {
  orderType: order.order_type,
  createdBy: order.created_by,
  organizationId: order.organization_id,
  estimatedValue: order.estimated_value
};
```

## Common Errors

### Error: "Could not find the 'createdBy' column"
**Cause:** Sending camelCase column names to database
**Fix:** Always use snake_case when inserting/updating database records

### Error: "Error loading users: Object"
**Cause:** Logging error object directly instead of error.message
**Fix:** Log `error.message` or convert error to string

## Best Practices

1. **Use snake_case for all database operations**
2. **Use camelCase for React state and props**
3. **Transform data at the boundary** (when sending/receiving from API)
4. **Log error messages properly**: Use `error.message` or `String(error)`
5. **Validate UUID fields**: Convert empty strings to null for UUID columns

## Example: Complete Data Flow

```javascript
// 1. React Form State (camelCase)
const [formData, setFormData] = useState({
  orderType: "",
  createdBy: "",
  organizationId: "",
  estimatedValue: ""
});

// 2. Transform for Database (snake_case)
const handleSubmit = async () => {
  const orderData = {
    order_type: formData.orderType,
    created_by: formData.createdBy,
    organization_id: formData.organizationId,
    estimated_value: parseFloat(formData.estimatedValue) || null
  };
  
  await createProcurementOrder(orderData);
};

// 3. Receive from Database (snake_case)
const { data: order } = await supabase
  .from('procurement_orders')
  .select('*')
  .single();

// order.created_by, order.organization_id, etc.

// 4. Transform for React Display (camelCase - optional)
const displayData = {
  orderType: order.order_type,
  createdBy: order.created_by,
  organizationId: order.organization_id
};
```
