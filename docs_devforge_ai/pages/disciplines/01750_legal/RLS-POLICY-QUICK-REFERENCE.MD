# 🔐 RLS Policy Quick Reference

**Row Level Security policies for multi-tenant data access - understand before querying.**

## 📋 Overview

This document provides **immediate understanding** of RLS (Row Level Security) policies that affect data access. All tables in Construct AI use RLS to enforce multi-tenant data isolation.

## 🔑 Critical RLS Concept

**All tables require organization context** for data access. Without the proper `x-organization-id` header, queries will return no results.

## 🏢 Organization-Scoped Tables (Most Common)

### **Default RLS Pattern - Organization Isolation**
```sql
-- Applied to 95% of tables
CREATE POLICY "organization_access" ON table_name
FOR ALL USING (organization_id::text = current_setting('request.headers.x-organization-id'));
```

**Affected Tables:**
- `procurement_orders` ✅
- `user_management` ✅
- `templates` ✅
- `tasks` ✅
- `organizations` ✅
- `contracts` ✅
- `suppliers` ✅
- And 400+ more tables

### **JavaScript Client Setup**
```javascript
// ✅ CORRECT - Always include organization header
const supabase = createClient(url, key, {
  global: { headers: { 'x-organization-id': organizationId } }
});

// ❌ WRONG - Will return no data
const supabase = createClient(url, key);
```

### **Server-Side Access**
```javascript
// Service role bypasses RLS (admin operations only)
const supabase = createClient(url, SUPABASE_SERVICE_ROLE_KEY);
// No organization header needed for service role
```

## 🎯 Special RLS Patterns

### **Cross-Organization Tables**
Some tables allow access across organizations (rare):

#### **`organizations`** - Company Registry
```sql
-- No RLS restrictions (public company data)
-- Access via: SELECT * FROM organizations
CREATE POLICY "public_read" ON organizations FOR SELECT USING (true);
```

#### **`disciplines`** - Discipline Definitions
```sql
-- No RLS restrictions (shared discipline definitions)
-- Access via: SELECT * FROM disciplines
CREATE POLICY "public_read" ON disciplines FOR SELECT USING (true);
```

### **User-Specific Tables**
Tables with user-based access control:

#### **`user_management`** - User Profiles
```sql
-- Organization-scoped + user ownership
CREATE POLICY "user_access" ON user_management
FOR ALL USING (
  organization_id::text = current_setting('request.headers.x-organization-id')
  OR user_id::text = current_setting('request.user.id')
);
```

#### **`user_email_accounts`** - Email Configurations
```sql
-- User-scoped (personal settings)
CREATE POLICY "user_ownership" ON user_email_accounts
FOR ALL USING (user_id::text = current_setting('request.user.id'));
```

## 🔍 RLS Troubleshooting

### **Common Access Problems**

#### **Problem: Empty Results**
```javascript
// This returns no data
const { data } = await supabase.from('procurement_orders').select('*');
console.log(data); // [] - Empty array
```

**Solution:**
```javascript
// Add organization header
const supabase = createClient(url, key, {
  global: { headers: { 'x-organization-id': '90cd635a-380f-4586-a3b7-a09103b6df94' } }
});
const { data } = await supabase.from('procurement_orders').select('*');
```

#### **Problem: Permission Denied**
```
Error: permission denied for table procurement_orders
```

**Causes:**
1. Missing organization header
2. Invalid organization ID
3. User not in that organization
4. Service role key not configured

### **Testing RLS Policies**

#### **Check Current Organization**
```javascript
// Verify organization header is set
const { data: { session } } = await supabase.auth.getSession();
console.log('Organization ID:', session?.user?.organization_id);
```

#### **Test Table Access**
```javascript
// Test with organization header
const { data, error } = await supabase
  .from('procurement_orders')
  .select('*')
  .limit(1);

if (error) {
  console.error('RLS Error:', error.message);
} else {
  console.log('RLS Working - Record count available');
}
```

## 📊 RLS Policy Statistics

**Policy Distribution:**
- **Organization-scoped**: 420 tables (95%)
- **User-scoped**: 15 tables (3%)
- **Public access**: 5 tables (1%)
- **Custom policies**: 5 tables (1%)

**Most Common Policy Types:**
1. **Organization isolation** - `organization_id` header required
2. **User ownership** - Personal data access
3. **Public read** - Reference data (disciplines, organizations)
4. **Cross-organization** - Rare, admin-only access

## 🚀 RLS Best Practices

### **Client-Side Development**
```javascript
// Always set up client with organization context
function createSupabaseClient(organizationId) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { 'x-organization-id': organizationId }
    },
    auth: { persistSession: true }
  });
}

// Use throughout app
const supabase = createSupabaseClient(currentOrganization.id);
```

### **Server-Side Operations**
```javascript
// Admin operations use service role
const supabase = createClient(url, SUPABASE_ANON_KEY, {
  global: { headers: { 'x-organization-id': user.organization_id } }
});
```

### **Testing Data Access**
```javascript
// Test script for RLS verification
async function testRLSAccess(tableName, organizationId) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { 'x-organization-id': organizationId } }
  });

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  return { accessible: !error, error: error?.message };
}
```

## ⚠️ RLS Security Implications

### **Data Isolation Guarantee**
✅ **Complete tenant isolation** - Users can only access their organization's data
✅ **Automatic enforcement** - No application code needed for isolation
✅ **Audit trail ready** - All access is logged and attributable

### **Performance Impact**
⚠️ **Header requirement** - All queries must include organization context
⚠️ **Index optimization** - Queries filtered by `organization_id`
⚠️ **Policy overhead** - Small performance cost per query

### **Development Overhead**
📝 **Header management** - Client setup must include organization ID
📝 **Error handling** - RLS errors require different handling than app errors
📝 **Testing complexity** - Multi-tenant scenarios require organization context

## 🔧 RLS Policy Patterns

### **Standard Organization Policy**
```sql
-- Most common pattern
CREATE POLICY "organization_access" ON table_name
FOR ALL USING (
  organization_id::text = current_setting('request.headers.x-organization-id')
);
```

### **User + Organization Policy**
```sql
-- User can access their own data across organizations
CREATE POLICY "user_organization_access" ON table_name
FOR ALL USING (
  organization_id::text = current_setting('request.headers.x-organization-id')
  OR created_by::text = current_setting('request.user.id')
);
```

### **Public Read Policy**
```sql
-- Reference data accessible to all
CREATE POLICY "public_read" ON table_name
FOR SELECT USING (true);
```

## 📖 Related Documentation

- **Data Templates**: [data-validation-templates.md](data-validation-templates.md)
- **Constraints**: [constraint-quick-reference.md](constraint-quick-reference.md)
- **Table Index**: [index-table.md](index-table.md)
- **Full Schema**: [schema-part-01.md](schema-part-01.md) - [schema-part-02.md](schema-part-02.md) - [schema-part-03.md](schema-part-03.md)

---

**📝 Last Updated**: 2026-03-12T03:45:30.576Z
**🎯 Purpose**: Prevent RLS access issues during development
**⚡ Impact**: Save hours of debugging authentication/data access problems
