# Re-Copy Templates Guide - HTML Content Fix

## Important: Existing Templates Need to Be Re-Copied

The fix I implemented will **only apply to NEW templates** copied AFTER the code change. Existing templates in your database still have the old dummy/test HTML.

## Why This Happens

```
OLD templates (created before fix):
  governance_document_templates (has full HTML)
    ↓ [OLD CODE - didn't copy html_content]
  safety_templates (has test HTML only ❌)

NEW templates (created after fix):
  governance_document_templates (has full HTML)
    ↓ [NEW CODE - copies html_content ✅]
  safety_templates (has full HTML ✅)
```

## Step-by-Step Fix

### Step 1: Verify the Fix is Active

1. Refresh your browser to load the new JavaScript code
2. Check the browser console - you should see no errors
3. The fix is in `useBulkOperations.js` lines 324-326

### Step 2: Identify Templates to Delete

Run this SQL query in Supabase:

```sql
-- Check which templates have test/dummy HTML
SELECT 
  id,
  template_name,
  LENGTH(html_content) as html_chars,
  SUBSTRING(html_content, 1, 100) as preview
FROM safety_templates
WHERE is_active = true
  AND LENGTH(html_content) < 200
ORDER BY created_at DESC;
```

**Expected result:** Shows templates with < 200 characters (test HTML)

### Step 3: Delete Old Test Template(s)

**Option A: Soft Delete (Recommended)**
```sql
-- Soft delete (sets is_active = false)
UPDATE safety_templates
SET is_active = false,
    updated_at = NOW()
WHERE LENGTH(html_content) < 200
  AND template_name LIKE '%Test%';  -- Adjust to match your template name
```

**Option B: Hard Delete (Use Carefully)**
```sql
-- Hard delete (permanently removes)
DELETE FROM safety_templates
WHERE LENGTH(html_content) < 200
  AND template_name LIKE '%Test%';  -- Adjust to match your template name
```

### Step 4: Verify Governance Form Has HTML

Run this SQL query:

```sql
-- Find your 85-question form in governance
SELECT 
  id,
  name,
  LENGTH(html_content) as html_length,
  discipline_id,
  fields_count
FROM governance_document_templates
WHERE is_active = true
  AND html_content IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Look for:** Your XLSX-derived form with `html_length` > 5000 characters

### Step 5: Re-Copy Form Using Fixed Code

1. **Go to Governance Forms page** (01300)
   - URL: `http://localhost:3060/#/governance/forms`

2. **Find your 85-question form**
   - Look for the form name (e.g., "HSEQS24001 Eng Questionnaire")
   - Verify it shows the correct field count (85 fields)

3. **Select the form**
   - Click the checkbox next to your form

4. **Click "🔄 Copy to Discipline Templates"** button
   - This button is in the main view, not in edit mode

5. **Fill in the modal:**
   - **Project Name:** Enter a descriptive name (e.g., "Highway Project Q4")
   - **Target Discipline:** Select "Safety" from dropdown
   - Keep other options as defaults
   - Click **"Copy"** button

6. **Wait for confirmation:**
   - You should see a success message
   - Check console for confirmation logs

### Step 6: Verify New Template Has Full HTML

**Option A: Check in UI**
1. Go to Safety Templates page (02400)
2. Find your newly copied template
3. It should have the project name prefix
4. Click "View" to see details

**Option B: Check in Database**
```sql
-- Verify new template has full HTML
SELECT 
  id,
  template_name,
  LENGTH(html_content) as html_chars,
  LENGTH(form_schema) as schema_chars,
  created_at
FROM safety_templates
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;
```

**Expected result:** 
- `html_chars` should be > 5000 (for 85-question form)
- `schema_chars` should also be > 1000
- Created timestamp should be recent (just now)

### Step 7: Test Complete Workflow

1. **Assign to Contractor:**
   - On Safety Templates page, click "Assign" on your new template
   - Select a contractor with email address
   - Set due date
   - Click "Assign to X Contractor(s)"

2. **Verify Assignment:**
   - Go to External Party Evaluation page (01850)
   - You should see the evaluation package
   - Click to view the questionnaire

3. **Check Questionnaire Display:**
   - ✅ All 85 questions should be visible
   - ✅ Form fields should be interactive
   - ✅ "Save Progress" button present
   - ✅ "Submit Questionnaire" button present

## Troubleshooting

### Issue: Still seeing test HTML after re-copy

**Possible causes:**
1. Browser cache - Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Wrong form selected - Make sure you're copying the XLSX-derived form
3. Code not deployed - Verify the fix is in your codebase

**Solution:**
```bash
# Clear browser cache completely
# Then rebuild and restart

cd /Users/_PropAI/construct_ai
npm run build
# Restart your dev server
```

### Issue: Can't find "Copy to Discipline Templates" button

**Location:** The button is on the main governance forms list page, NOT in the form edit modal.

**Steps:**
1. Go to Governance page
2. You should see a list of forms
3. Select checkboxes next to forms you want to copy
4. Look for "🔄 Copy to Discipline Templates" button in the toolbar/action area

### Issue: Copy fails with error

**Check console for errors:**
- Look for red error messages in browser console (F12)
- Common issues:
  - Discipline not selected
  - Project name empty
  - Network/database connection error

## Verification Checklist

After re-copying, verify:

- [ ] Old test template deleted or deactivated
- [ ] New template appears in safety_templates
- [ ] New template has html_content > 5000 characters
- [ ] New template has form_schema populated
- [ ] Template assignment works without errors
- [ ] Questionnaire displays with all 85 questions
- [ ] Save/Submit buttons functional

## Summary

The fix is working correctly for **new** templates. You just need to:

1. ✅ **Delete** old test template(s) with dummy HTML
2. ✅ **Re-copy** your 85-question form from governance
3. ✅ **Verify** new template has full HTML content
4. ✅ **Test** assignment and display work correctly

The HTML content will now be preserved properly for all future template copies! 🎉
