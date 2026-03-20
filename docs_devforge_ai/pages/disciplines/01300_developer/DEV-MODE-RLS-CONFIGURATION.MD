# Development Mode RLS Configuration Guide

**📅 Date:** October 13, 2025  
**🎯 Purpose:** Enable flexible development testing while maintaining production security  
**📋 Status:** Production-Ready with Dev Mode Support

---

## 🎯 **Overview**

The enhanced RLS policies support **automatic development mode detection** that bypasses all security restrictions during development while enforcing strict policies in production.

### **Key Benefits**

✅ **Dev Mode:** Work freely without authentication during development  
✅ **Prod Mode:** Full security enforcement with organization isolation  
✅ **Automatic Detection:** No manual configuration needed  
✅ **Audit Trail:** Track dev vs prod operations separately

---

## 🔧 **How Dev Mode Detection Works**

The system automatically detects development mode using **three indicators**:

### **Detection Method 1: Dev User ID**
```javascript
// Application uses fallback dev user ID
const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';
```

```sql
-- Database detects this UUID
CREATE FUNCTION is_dev_mode() RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = '00000000-0000-0000-0000-000000000001'::UUID;
END;
$$;
```

**When Active:** When your application uses the fallback UUID for unauthenticated users

### **Detection Method 2: Dev Mode JWT Flag**
```javascript
// Application can explicitly set dev mode
const supabase = createClient(url, key, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        headers: {
            'dev-mode': 'true' // Custom header
        }
    }
});
```

```sql
-- Database checks JWT for dev_mode flag
RETURN COALESCE((auth.jwt()->>'dev_mode')::BOOLEAN, false) = true;
```

**When Active:** When you explicitly set a `dev_mode` flag in the JWT or headers

### **Detection Method 3: Anonymous Role**
```javascript
// Using anon key (common in development)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY  // <-- Anon key
);
```

```sql
-- Database detects anon role
RETURN auth.role() = 'anon';
```

**When Active:** When using Supabase anonymous key instead of authenticated sessions

---

## 🚀 **Setup Guide**

### **Step 1: Apply Enhanced RLS Policies**

```bash
# Execute the SQL script with dev mode support
psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres \
  -f fix_form_templates_rls_policies_with_dev_mode.sql
```

Or via Supabase Dashboard:
1. Open SQL Editor
2. Copy `fix_form_templates_rls_policies_with_dev_mode.sql`
3. Paste and click "Run"

### **Step 2: Configure Environment Variables**

Create separate environment files for dev and prod:

**`.env.development`**
```bash
# Development Configuration
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
# Dev mode will be automatically detected
```

**`.env.production`**
```bash
# Production Configuration
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
# Auth will be enforced - dev mode will NOT be detected
```

### **Step 3: No Code Changes Required!**

Your existing code continues to work:

```javascript
// ✅ This code works in BOTH dev and prod
const { data, error } = await supabaseClient
  .from('form_templates')
  .insert([formData])
  .select();

// In Dev Mode:  Succeeds without authentication
// In Prod Mode: Requires authenticated user with proper org
```

---

## 🔐 **Security Behavior**

### **Development Mode (Detected)**

| Operation | Behavior | Organization Check | Ownership Check |
|-----------|----------|-------------------|-----------------|
| **SELECT** | ✅ Allowed | ❌ Bypassed | ❌ Bypassed |
| **INSERT** | ✅ Allowed | ❌ Bypassed | ❌ Bypassed |
| **UPDATE** | ✅ Allowed | ❌ Bypassed | ❌ Bypassed |
| **DELETE** | ✅ Allowed | ❌ Bypassed | ❌ Bypassed |

**Automatic Metadata:**
- `created_by` → Set to `00000000-0000-0000-0000-000000000001`
- `organization_id` → Set to `00000000-0000-0000-0000-000000000001`
- `is_dev_mode` → Marked as `true` in audit log

### **Production Mode (Not Detected)**

| Operation | Behavior | Organization Check | Ownership Check |
|-----------|----------|-------------------|-----------------|
| **SELECT** | ✅ Allowed | ✅ Enforced | ❌ Not Required |
| **INSERT** | ✅ Allowed | ✅ Enforced | ✅ Auto-Set |
| **UPDATE** | ⚠️ Restricted | ✅ Enforced | ✅ Enforced |
| **DELETE** | ⚠️ Restricted | ✅ Enforced | ✅ Enforced |

**Restrictions:**
- Users only see forms in their organization
- Users can only modify forms they created
- Admins can modify any form in any organization

**Automatic Metadata:**
- `created_by` → Set to actual `auth.uid()`
- `organization_id` → Set from user's JWT
- `is_dev_mode` → Marked as `false` in audit log

---

## 🧪 **Testing Guide**

### **Test 1: Verify Dev Mode Active**

```javascript
// Test dev mode detection
const { data, error } = await supabaseClient
  .from('form_templates')
  .insert([{
    template_name: 'Dev Mode Test',
    discipline_id: 'some-uuid',
    // No created_by or organization_id provided
  }])
  .select();

console.log('Dev Mode Test:', {
  success: !error,
  createdBy: data?.[0]?.created_by, // Should be dev UUID
  organizationId: data?.[0]?.organization_id // Should be dev UUID
});
```

**Expected Result in Dev Mode:**
```javascript
{
  success: true,
  createdBy: '00000000-0000-0000-0000-000000000001',
  organizationId: '00000000-0000-0000-0000-000000000001'
}
```

### **Test 2: Verify Audit Trail Tracking**

```sql
-- Check if dev mode operations are tracked
SELECT 
    action,
    is_dev_mode,
    changed_by,
    changed_at
FROM form_templates_audit
ORDER BY changed_at DESC
LIMIT 10;
```

**Expected Result:**
```
action | is_dev_mode | changed_by                           | changed_at
-------|-------------|--------------------------------------|--------------------
INSERT | true        | 00000000-0000-0000-0000-000000000001 | 2025-10-13 14:00:00
UPDATE | true        | 00000000-0000-0000-0000-000000000001 | 2025-10-13 14:05:00
```

### **Test 3: Verify Prod Mode Enforcement**

```javascript
// Test with real authenticated user in production
const supabase = createClient(url, anonKey);

// Attempt to access another org's forms
const { data, error } = await supabase
  .from('form_templates')
  .select('*')
  .eq('organization_id', 'different-org-uuid');

console.log('Prod Mode Test:', {
  blocked: error !== null,
  rowCount: data?.length || 0 // Should be 0
});
```

**Expected Result in Prod Mode:**
```javascript
{
  blocked: false, // Query succeeds but returns no rows
  rowCount: 0 // No access to other org's forms
}
```

---

## 🔄 **Switching Between Modes**

### **Option 1: Environment Variables**

```bash
# Development
NODE_ENV=development npm start

# Production
NODE_ENV=production npm start
```

### **Option 2: Explicit Configuration**

```javascript
// Force dev mode (for testing)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false
        },
        global: {
            headers: {
                'x-dev-mode': 'true'
            }
        }
    }
);
```

### **Option 3: User-Based Detection**

```javascript
// Your existing code automatically switches based on authentication
const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001';

// If currentUser exists → Prod mode
// If currentUser is null → Dev mode (fallback UUID)
```

---

## ⚠️ **Important Considerations**

### **1. Production Safety**

```javascript
// ❌ NEVER do this in production
if (process.env.NODE_ENV === 'production') {
    // Don't force dev mode in production!
    const devUser = '00000000-0000-0000-0000-000000000001';
}
```

### **2. Audit Log Monitoring**

```sql
-- Monitor dev mode usage in production (should be zero)
SELECT COUNT(*) as dev_mode_operations
FROM form_templates_audit
WHERE is_dev_mode = true
AND changed_at > NOW() - INTERVAL '24 hours';

-- Expected in production: 0
-- Expected in development: > 0
```

### **3. Data Cleanup**

```sql
-- Clean up dev mode test data before production deployment
DELETE FROM form_templates
WHERE created_by = '00000000-0000-0000-0000-000000000001'
AND organization_id = '00000000-0000-0000-0000-000000000001';
```

---

## 📊 **Verification Checklist**

### **Before Production Deployment**

- [ ] ✅ RLS policies applied with dev mode support
- [ ] ✅ Dev mode detection tested locally
- [ ] ✅ Prod mode enforcement tested in staging
- [ ] ✅ Audit trail verified (dev vs prod separation)
- [ ] ✅ Test data cleaned up
- [ ] ✅ Environment variables configured correctly
- [ ] ✅ No dev mode operations in production logs

### **After Production Deployment**

- [ ] ✅ Authenticated users can create forms
- [ ] ✅ Users only see their organization's forms
- [ ] ✅ Users cannot modify others' forms
- [ ] ✅ Admins can access all forms
- [ ] ✅ Audit trail shows `is_dev_mode = false`
- [ ] ✅ No dev mode operations detected

---

## 🐛 **Troubleshooting**

### **Issue: Dev Mode Not Working**

**Symptoms:**
- Form creation fails in development
- Authentication required in dev environment

**Solutions:**

1. **Check User ID:**
   ```javascript
   console.log('Current User ID:', auth.uid());
   // Should be: 00000000-0000-0000-0000-000000000001
   ```

2. **Verify Anon Key:**
   ```javascript
   console.log('Using Key:', process.env.SUPABASE_ANON_KEY);
   // Should use anon key, not service role key in dev
   ```

3. **Test Detection Function:**
   ```sql
   SELECT public.is_dev_mode();
   -- Should return: true
   ```

### **Issue: Prod Mode Not Enforcing**

**Symptoms:**
- Users can see other organizations' forms
- Users can modify forms they didn't create

**Solutions:**

1. **Verify Policies:**
   ```sql
   SELECT COUNT(*) 
   FROM pg_policies 
   WHERE tablename = 'form_templates';
   -- Should return: 6 policies
   ```

2. **Check User Context:**
   ```sql
   SELECT 
       auth.uid() as user_id,
       auth.role() as role,
       public.is_dev_mode() as dev_mode,
       public.get_user_organization_id() as org_id;
   ```

3. **Test Policy Enforcement:**
   ```sql
   -- Should only show user's org forms
   SELECT COUNT(*) 
   FROM form_templates 
   WHERE organization_id != public.get_user_organization_id();
   -- Should return: 0
   ```

---

## 📚 **Additional Resources**

- **Main Audit Document:** `docs/1300_01300_USE_FORM_BUTTON_AUDIT.md`
- **SQL Script:** `fix_form_templates_rls_policies_with_dev_mode.sql`
- **Execution Script:** `execute_rls_fix.js`
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security

---

## 📝 **Summary**

| Aspect | Development | Production |
|--------|-------------|------------|
| **Authentication** | Optional | Required |
| **Organization Isolation** | Disabled | Enabled |
| **Ownership Validation** | Disabled | Enabled |
| **Audit Tracking** | `is_dev_mode = true` | `is_dev_mode = false` |
| **Setup Complexity** | Zero (automatic) | Standard auth setup |

**🎉 Result:** Development flexibility + Production security = Best of both worlds!
