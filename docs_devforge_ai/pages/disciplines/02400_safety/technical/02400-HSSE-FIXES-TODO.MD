# HSSE Questionnaire Excel Processing Fixes

## TODO LIST - Date: Mon Oct 20 05:39:18 SAST 2025

### Core Issues Identified:
1. **Client Metadata**: anticipatedFormName never sent to server
2. **AI Field Behavior**: Fields marked as 'required: true' but user expects editable AI-assisted fields

### Required Fixes:

#### 1. Client Metadata Transmission Fix
- [ ] Examine current client processSingleFile() metadata sending
- [ ] Add anticipatedFormName to metadata object serialization  
- [ ] Verify anticipatedFormName is included in FormData before sending
- [ ] Test that server receives anticipatedFormName in enhancedMetadata.ui

#### 2. AI Field Behavior Correction  
- [ ] Review server field creation logic (process-routes.js ~lines 1075-1095)
- [ ] Change 'required: true' to 'required: false' for AI-assisted fields
- [ ] Ensure fields are editable (not readonly) when AI-assisted
- [ ] Confirm AI placeholder text is appropriate for editable fields

#### 3. Form Title Integration Testing
- [ ] Verify anticipatedFormName appears in form titles
- [ ] Test complete flow: client -> server -> form creation
- [ ] Validate form names match user expectations

#### 4. User Verification  
- [ ] Confirm AI field behavior matches user requirements
- [ ] Test form generation with corrected metadata transmission
- [ ] Ensure no regression in existing HSSE questionnaire processing

### Technical Details:
- **Client Location**: client/src/pages/01300-governance/components/01300-document-upload-modal.js
- **Server Location**: server/src/routes/process-routes.js (HSSE processing section)  
- **Expected Flow**: anticipatedFormName → unifiedMetadata.ui → enhancedMetadata.ui?.anticipatedFormName → form title

### Success Criteria:
- ✅ anticipatedFormName transmitted from client to server
- ✅ AI fields are editable and not 'required: true'  
- ✅ Form titles use anticipated names correctly
- ✅ HSSE questionnaire processing works end-to-end
