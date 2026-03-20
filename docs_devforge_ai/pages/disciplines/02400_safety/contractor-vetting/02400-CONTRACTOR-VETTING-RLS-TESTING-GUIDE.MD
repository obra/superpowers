# Contractor Vetting Workflow - RLS Testing Guide

## 🎯 Objective
Test the complete contractor vetting workflow end-to-end by temporarily bypassing RLS authentication barriers.

---

## 📋 Current Status

### ✅ Implementation Complete
- **HTML Content Transfer**: Template HTML flows from 01300 form creation → governance_document_templates → safety_templates
- **Save/Submit Controls**: Professional contractor action buttons with loading states
- **Questionnaire Rendering**: HTML displayed via dangerouslySetInnerHTML with form schema
- **Status Updates**: Draft/final submission with database persistence

### ⚠️ Testing Blocked By
- **RLS Authentication**: Row-Level Security requires authenticated user session
- **Error Code**: `42501` - "new row violates row-level security policy"
- **Impact**: Cannot assign templates to contractors for testing

---

## 🔧 Step 1: Temporarily Disable RLS (MANUAL)

### Required Action: Execute SQL in Supabase Dashboard

1. **Navigate to Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click "SQL Editor" in left sidebar

2. **Execute RLS Disable SQL**
   - Open new query
   - Copy contents from: `server/sql/temporarily_disable_rls.sql`
   - Click "Run" to execute

3. **Verify RLS Status**
   ```sql
   SELECT 
       schemaname,
       tablename,
       rowsecurity as rls_enabled
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN (
       'external_party_document_instances',
       'evaluation_packages', 
       'discipline_evaluation_weights',
       'user_discipline_access'
   );
   ```
   - Expected: `rls_enabled = false` for all listed tables

---

## 🧪 Step 2: Test Workflow End-to-End

### Test Scenario: Assign HSSE Questionnaire to Contractor

#### A. Template Assignment (02400 Safety Page)
1. **Navigate to Safety Management**
   - URL: `http://localhost:3000/02400-safety`
   
2. **Open Contractor Modal**
   - Click "Assign to Contractor" button
   - Modal should display with contractor selection

3. **Assign Template**
   - Select contractor from dropdown
   - Select document template (e.g., "HSSE Questionnaire")
   - Click "Assign Template"
   - **Expected**: ✅ Success message (no RLS error)

#### B. Contractor Questionnaire Access (01850 External Party Evaluation)
1. **Navigate to External Party Evaluation**
   - URL: `http://localhost:3000/01850-external-party-evaluation`

2. **View Assigned Package**
   - Verify evaluation package card displays
   - Check package metadata (title, description, assigned date)
   - Click package card to expand

3. **Verify HTML Rendering**
   - Questionnaire HTML should render with full formatting
   - Form fields should be interactive (checkboxes, text inputs, etc.)
   - Styling should match original template design

4. **Test Save Draft**
   - Fill out partial questionnaire responses
   - Click "Save Draft" button
   - **Expected**: Success toast notification
   - Verify `submission_status = 'draft'` in database

5. **Test Final Submission**
   - Complete remaining questionnaire fields
   - Click "Submit Final Response" button
   - Confirm submission in modal
   - **Expected**: Success message + status change to 'final'
   - Verify `submission_status = 'submitted'` in database

#### C. Database Verification
```sql
-- Check document instance was created
SELECT 
    id,
    evaluation_package_id,
    document_template_id,
    assigned_to_party_email,
    submission_status,
    response_data,
    created_at
FROM public.external_party_document_instances
ORDER BY created_at DESC
LIMIT 5;

-- Verify response data contains HTML and schema
SELECT 
    id,
    assigned_to_party_email,
    submission_status,
    jsonb_pretty(response_data) as formatted_response
FROM public.external_party_document_instances
WHERE submission_status IN ('draft', 'submitted')
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📊 Expected Test Results

### ✅ Success Criteria
- [ ] Template assignment creates `external_party_document_instances` record without RLS error
- [ ] Contractor evaluation page displays assigned package
- [ ] HTML questionnaire renders with full formatting and interactivity
- [ ] Save Draft button persists partial responses to database
- [ ] Submit Final Response changes status to 'submitted'
- [ ] Database contains complete response_data with html_content and form_schema

### ❌ Failure Indicators
- RLS error `42501` during template assignment
- Missing or malformed HTML in questionnaire display
- Save/Submit buttons throw errors
- response_data null or incomplete in database

---

## 🔒 Step 3: Re-Enable RLS After Testing

### Critical: Restore Production Security

1. **Execute Re-Enable SQL**
   - Navigate to Supabase SQL Editor
   - Copy contents from: `server/sql/re_enable_rls.sql`
   - Click "Run" to execute

2. **Verify RLS Restored**
   ```sql
   SELECT 
       schemaname,
       tablename,
       rowsecurity as rls_enabled
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN (
       'external_party_document_instances',
       'evaluation_packages', 
       'discipline_evaluation_weights',
       'user_discipline_access'
   );
   ```
   - Expected: `rls_enabled = true` for all listed tables

3. **Verify Policies Active**
   ```sql
   SELECT 
       tablename,
       policyname,
       permissive,
       roles,
       cmd
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'external_party_document_instances';
   ```
   - Should list all active RLS policies

---

## 🚀 Step 4: Production Implementation Path

### After successful testing, implement proper authentication:

#### Option A: Supabase Auth Integration
```javascript
// In contractor assignment modal
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  throw new Error('Authentication required for template assignment');
}

// Use authenticated user context
const { data, error } = await supabase
  .from('external_party_document_instances')
  .insert({
    evaluation_package_id: packageId,
    document_template_id: templateId,
    assigned_to_party_email: contractor.email,
    assigned_by_user_id: user.id, // Authenticated user
    // ... other fields
  });
```

#### Option B: Service Role for Admin Operations
```javascript
// For backend/admin operations that don't require user auth
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY // Service role bypasses RLS
);

// Admin assigns template to contractor
const { data, error } = await supabaseAdmin
  .from('external_party_document_instances')
  .insert({ /* ... */ });
```

#### Option C: Custom RLS Policy for External Party Access
```sql
-- Allow external parties to read/update their own assigned documents
CREATE POLICY "external_party_access" ON external_party_document_instances
FOR SELECT
USING (assigned_to_party_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "external_party_update" ON external_party_document_instances
FOR UPDATE
USING (assigned_to_party_email = current_setting('request.jwt.claims', true)::json->>'email');
```

---

## 📝 Testing Checklist

### Pre-Testing
- [ ] SQL files created (`temporarily_disable_rls.sql`, `re_enable_rls.sql`)
- [ ] Local development server running (`npm run dev`)
- [ ] Supabase connection verified
- [ ] Test contractor data available in database

### During Testing
- [ ] RLS disabled successfully via Supabase dashboard
- [ ] Template assignment modal opens without errors
- [ ] Template assigned to contractor (no RLS error)
- [ ] Evaluation package displays on 01850 page
- [ ] HTML questionnaire renders correctly
- [ ] Save Draft functionality works
- [ ] Submit Final Response functionality works
- [ ] Database records created with correct data

### Post-Testing
- [ ] RLS re-enabled via Supabase dashboard
- [ ] RLS policies verified active
- [ ] Test data cleaned up (if needed)
- [ ] Production authentication path selected

---

## 🐛 Troubleshooting

### Issue: RLS Still Blocking After Disable
**Solution**: Verify SQL executed successfully, check `rowsecurity` column in `pg_tables`

### Issue: HTML Not Rendering
**Solution**: Check `html_content` field in template, verify dangerouslySetInnerHTML prop

### Issue: Save Draft Returns Error
**Solution**: Check browser console for detailed error, verify Supabase client configuration

### Issue: Response Data Not Persisting
**Solution**: Verify `response_data` JSONB column accepts nested objects, check form data collection logic

---

## 📚 Related Files

- **SQL Scripts**: `server/sql/temporarily_disable_rls.sql`, `server/sql/re_enable_rls.sql`
- **Assignment Modal**: `client/src/pages/02400-safety/components/modals/02400-assign-contractor-modal.js`
- **Evaluation Component**: `client/src/pages/01850-other-parties/external-party-evaluation/components/02400-external-party-evaluation-functional.js`
- **Database Schema**: `server/sql/create_external_party_evaluation_tables.sql`
- **Test Data**: `server/sql/insert_document_instances.sql`

---

## ⚠️ Important Reminders

1. **Development Only**: RLS bypass is for testing purposes only
2. **Re-Enable RLS**: Always restore security after testing
3. **No Production Use**: Never disable RLS in production environment
4. **Authentication Required**: Implement proper auth before production deployment
5. **Audit Trail**: All RLS changes logged in `error_tracking` table

---

## ✅ Success Outcome

Upon completing this testing workflow:
- Contractor vetting workflow fully functional end-to-end
- HTML questionnaires render and accept responses
- Save/submit operations persist data correctly
- Clear path to production authentication implementation
- Security restored with RLS re-enabled

**Status**: Ready for manual RLS bypass execution and comprehensive testing ✅
