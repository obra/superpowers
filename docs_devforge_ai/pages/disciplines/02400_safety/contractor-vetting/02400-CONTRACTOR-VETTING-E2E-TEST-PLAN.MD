🧪 CONTRACTOR VETTING END-TO-END TESTING WORKFLOW
═════════════════════════════════════════════════════

PHASE 1: TEST EXISTING CONTRACTOR QUESTIONNAIRE (IMMEDIATE)
01. **Navigate directly via URL**:
    - Go to: `http://localhost:3060/#/other-parties/external-party-evaluation`
    - Note: Use # since it's HashRouter

02. **Select "Contractor Vetting" context**

03. **Check packages display**:
   - Should see: 'Electrical Installations Contractor Evaluation'
   - Click the package card (shows 👁️ eye icon on hover)

04. **Verify questionnaire loads**:
   - **Form Title**: "Electrical Safety & Compliance Questionnaire"
   - **HTML Content**: H2 "Electrical Safety Assessment" + ESL dropdown
   - **Debug Logs in Console**: `rawHtmlContent`, `rawFormSchema`
   - **Save/Submit Buttons**: Yellow/Blue buttons at bottom

PHASE 2: VERIFY BACKEND FUNCTIONALITY
09. **Test API endpoints directly** (open DevTools Console):
   ```javascript
   // Check packages API
   fetch('/api/external-party-evaluation/packages?context=contractor_vetting&status=in_progress')
   .then(r=>r.json()).then(console.log)

   // Check package details
   fetch('/api/external-party-evaluation/packages/550e8400-e29b-41d4-a716-446655441002?includeDocuments=true')
   .then(r=>r.json()).then(console.log)
   ```

⚠️ ROUTING ISSUE IDENTIFIED: User gets "page not found" - need to test with full HashRouter URL.
