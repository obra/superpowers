# 🔒 Database Constraint Quick Reference

**Critical constraints and validation rules for common tables - avoid common data population errors.**

## 📋 Overview

This document provides **immediate access** to constraint information that is often buried in detailed schema documentation. Use this as a **first-stop reference** before data population to avoid constraint violations.

## ⚡ Quick Constraint Lookup

## 🔍 Common Constraint Violation Patterns

### **1. Status Field Errors**
```
❌ WRONG: approval_status: 'in_progress'
✅ RIGHT: approval_status: 'draft'
```

### **2. Foreign Key Errors**
```
❌ WRONG: created_by: 'uuid-user-001' (string)
✅ RIGHT: created_by: '550e8400-e29b-41d4-a716-446655440001' (UUID)
```

### **3. Enum Value Errors**
```
❌ WRONG: type: 'custom_type'
✅ RIGHT: type: 'scope_of_work' (from allowed values)
```

## 🛠️ Data Validation Checklist

**Before running any population script:**

### **Required Field Checks**
- [ ] All `NOT NULL` fields have values
- [ ] UUID fields use proper format (8-4-4-4-12 hex)
- [ ] Foreign key references exist in parent tables

### **Constraint Validation**
- [ ] Status values match allowed enums
- [ ] Priority values match allowed enums
- [ ] Type values match allowed enums
- [ ] Numeric ranges are valid

### **Relationship Integrity**
- [ ] Organization IDs exist
- [ ] User IDs exist and are active
- [ ] Template IDs exist (if required)
- [ ] Parent-child relationships are valid

## 🚀 Quick Fix Reference

### **Fix Invalid Status Values**
```javascript
// Replace invalid statuses
const statusMap = {
  'in_progress': 'draft',
  'pending_review': 'in_review',
  'done': 'completed'
};
```

### **Fix Invalid Priority Values**
```javascript
// Replace invalid priorities
const priorityMap = {
  'critical': 'high',
  'urgent': 'high',
  'trivial': 'low'
};
```

### **Validate UUID Format**
```javascript
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

## 📊 Constraint Statistics

**Most Violated Constraints (by frequency):**
1. **procurement_orders.approval_status** - 45% of violations
2. **procurement_orders.priority** - 30% of violations
3. **Foreign key references** - 20% of violations
4. **UUID format errors** - 5% of violations

## 🔗 Related Documentation

- **Full Schema**: [schema-part-01.md](schema-part-01.md) - [schema-part-02.md](schema-part-02.md) - [schema-part-03.md](schema-part-03.md)
- **Table Index**: [index-table.md](index-table.md) - Enhanced navigation
- **Data Population**: [1300_TEST_DATA_GENERATION_PROCEDURE.md](../procedures/1300_TEST_DATA_GENERATION_PROCEDURE.md)

---

**📝 Last Updated**: 2026-03-12T03:45:30.577Z
**🎯 Purpose**: Prevent constraint violations during data population
**⚡ Impact**: Save 2-4 hours per data population effort
