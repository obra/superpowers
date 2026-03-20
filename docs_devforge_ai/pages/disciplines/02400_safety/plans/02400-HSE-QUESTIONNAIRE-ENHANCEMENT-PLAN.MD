# HSE Questionnaire Processing Enhancement - Complex Form Handling

## Problem Identified

The current questionnaire detection logic is too simplistic for complex HSE (Health, Safety, Environment) questionnaires. These documents have sophisticated structures that require advanced processing:

**HSE Questionnaire Complexity:**
- Multi-level hierarchical numbering (1, 1.1, 1.1a, etc.)
- Advanced scoring systems with weighted calculations
- Conditional logic and validation rules
- File upload capabilities for documentation
- Section-based organization with interdependencies
- JavaScript functionality for interactive forms
- Complex form validation and business rules

**Current Issue:**
- Simple questionnaire detection fails for complex HSE forms
- Server falls back to basic Excel processing
- Only 1 field generated instead of complex form structure
- User expectation not met for sophisticated HSE questionnaires

## Recommended Enhancement Strategy

### 1. Enhanced Document Type Detection
```javascript
// Enhanced detection for complex HSE forms
const detectComplexHSEForm = (rawData, filename) => {
  // HSE-specific patterns
  const hsePatterns = [
    /HSE/i.test(filename), // HSE in filename
    /questionnaire/i.test(filename),
    /safety/i.test(filename),
    /contractor/i.test(filename),
    /compliance/i.test(filename)
  ];
  
  // Complex structure indicators
  const complexPatterns = [
    /1\.\d+/.test(headerText), // Hierarchical numbering
    /score|rating/i.test(headerText), // Scoring systems
    /upload|file|document/i.test(headerText), // File uploads
    /weight|weighted/i.test(headerText), // Weighted calculations
    /section|part/i.test(headerText) // Section organization
  ];
  
  return {
    isHSE: hsePatterns.some(pattern => pattern),
    isComplex: complexPatterns.some(pattern => pattern),
    shouldUseAI: hsePatterns.some(pattern => pattern) || complexPatterns.some(pattern => pattern),
    processingMethod: hsePatterns.some(pattern => pattern) ? 'hse_ai_processing' : 'complex_ai_processing'
  };
};
```

### 2. AI-Powered Processing Pipeline
```javascript
// Route to AI processing for complex forms
const processComplexDocument = async (rawData, filename, hsePrompt) => {
  const analysis = detectComplexHSEForm(rawData, filename);
  
  if (analysis.shouldUseAI) {
    // Use AI processing with HSE prompt
    return await processExcelWithAI(rawData, filename, hsePrompt);
  }
  
  // Fall back to standard questionnaire processing
  return processQuestionnaireExcel(rawData, filename);
};
```

### 3. Enhanced AI Prompt Integration
```javascript
// Better prompt selection based on document analysis
const getOptimalPrompt = (filename, documentType, contentAnalysis) => {
  if (contentAnalysis.isHSE) {
    return 'questionnaire_form_conversion'; // HSSE prompt
  }
  
  if (contentAnalysis.isComplex) {
    return 'complex_form_conversion'; // Enhanced processing prompt
  }
  
  return 'standard_form_conversion'; // Basic processing prompt
};
```

## Implementation Steps

1. **Update Server Detection Logic**
   - Enhance `detectQuestionnaireFormat()` to handle HSE complexity
   - Add AI processing pipeline for complex forms
   - Improve prompt selection based on document analysis

2. **AI Service Integration**
   - Ensure DocumentStructureExtractionService handles HSE prompts
   - Add fallback for non-HSE complex forms
   - Implement proper error handling for AI processing

3. **Client-Side Enhancements**
   - Update form display for complex questionnaire structures
   - Handle field behaviors (editable/readonly/ai_generated) properly
   - Support for file upload and scoring systems

4. **Testing Framework**
   - Test with real HSE questionnaire files
   - Validate complex form generation
   - Ensure proper error handling for edge cases

## Expected Outcomes

- ✅ Complex HSE questionnaires processed correctly
- ✅ Full form structure with hierarchical fields
- ✅ AI-generated content for appropriate fields
- ✅ Proper field behavior classification
- ✅ Enhanced user experience for complex forms

## Next Steps

1. Implement enhanced detection logic in `server/api/process/form.js`
2. Test with real HSE questionnaire files
3. Validate AI processing pipeline
4. Update client-side form rendering
5. Create comprehensive test suite for complex forms
