# 1300_02400 HSSE Prompt Content

## Overview

This document contains the specialized AI prompt framework for HSSE questionnaire template generation. The system has evolved from Excel spreadsheet processing to a dynamic template-based approach using pre-built HTML templates populated with configurable questionnaire data.

**Note**: Excel spreadsheet processing has been discontinued due to complexity. The system now uses a configuration-driven approach with pre-built HTML templates.

## Requirements

### Functional Requirements
- Generate dynamic HSSE questionnaire forms from pre-built HTML templates
- Populate templates with configurable questionnaire data (sections, questions, scoring)
- Preserve hierarchical numbering system (1, 1.1, 1.1a, etc.)
- Implement scoring system with weighted calculations
- Generate evaluation recommendations based on score thresholds
- Support multiple input types (text, textarea, number, file upload)

### Technical Requirements
- Use configuration-driven approach for questionnaire structure
- Store questionnaire configurations in discipline-specific database tables
- Dynamically populate HTML templates with configuration data
- Generate responsive, accessible HTML forms
- Include form validation and error handling
- Support questionnaire customization per discipline

## Implementation

### Prompt Metadata
- **ID:** 9430fe84-b564-4783-a214-177f78d690fb
- **Key:** questionnaire_form_conversion
- **Name:** HSSE Supplier Evaluation Questionnaire Form Conversion
- **Description:** Specialized prompt for converting Excel spreadsheet HSE evaluation templates into structured table-based HTML forms with scoring functionality
- **Is Active:** Yes
- **Created:** 2025-10-15T10:45:10.427895+00:00
- **Updated:** 2025-10-16T10:08:27.151626+00:00

### Current Implementation

# Dynamic Template-Based Questionnaire System

## Objective
Generate HSSE questionnaire forms using pre-built HTML templates populated with configurable questionnaire data. The system supports multiple questionnaire types through configuration rather than Excel processing.

## Architecture Overview
The system uses:
- **Pre-built HTML templates**: Complete, functional questionnaire templates (e.g., `1300_02400_HSSE_QUESTIONNAIRE_FORM.html`)
- **Configuration-driven data**: Questionnaire structure stored in database tables
- **Dynamic population**: HTML templates populated with configuration data at runtime
- **Discipline-specific customization**: Different questionnaire types per discipline

## Configuration Structure
Questionnaire configurations contain:
- Structured sections with hierarchical numbering (1, 1.1, 1.1a, etc.)
- Questions with different input types (text, textarea, radio, file upload)
- Scoring rules and weightings for evaluation
- Validation rules and requirements

## Target Requirements
Create an HTML form that:

### Structural Requirements
1. **Retain all original columns** from the spreadsheet:
   - Question Number (N°)
   - Question text
   - Additional language text (if applicable)
   - Document upload/input field
   - Answer input field
   - Score input (customizable scale)
   - Feedback textarea

2. **Organize by sections** matching the Excel structure:
   - Maintain the same section organization as source spreadsheet
   - Preserve section numbering and hierarchy

3. **Maintain hierarchical numbering** system from Excel

### Functional Requirements
1. **Scoring System**:
   - Each question should have a score input (customizable scale with decimal increments)
   - Section-level weighted scoring (configurable weights per section)
   - Global total score calculation
   - Automatic evaluation recommendation based on total score thresholds

2. **Weight Distribution**:
   - Configure section weights based on importance (percentages should total 100%)
   - Allow for manual override of section scores
   - Calculate weighted scores for each section

3. **Evaluation Recommendations**:
   - Define custom score thresholds for different recommendation levels
   - Generate automatic recommendations based on calculated scores
   - Support multiple recommendation categories (e.g., Approved, Conditional, Rejected)

### UI/UX Requirements
1. **Table-based layout** for questions with appropriate column distribution:
   - Maintain consistent column widths for readability
   - Ensure proper spacing and alignment
   - Support for various input types (text, select, file upload, number)

2. **Section headers** with visual distinction:
   - Clear section organization with visual hierarchy
   - Color-coded sections for easy navigation
   - Collapsible sections for better usability

3. **Interactive features**:
   - File upload functionality for document fields
   - Toggle to show/hide scoring system
   - Real-time score calculation and display
   - Form validation with user feedback

4. **Responsive design** that works on mobile devices:
   - Adaptable layout for different screen sizes
   - Touch-friendly controls and inputs
   - Print-friendly formatting options

## Technical Implementation Guidelines

### HTML Structure
```html
<!-- General Information Section -->
<div class="form-section">
    <h2>General Information</h2>
    <!-- Form fields for basic details, dates, evaluator -->
</div>

<!-- Each Evaluation Section -->
<div class="form-section">
    <h2>1. [Section Title]</h2>
    <div class="scoring-section">
        <!-- Scoring inputs for this section -->
    </div>
    <table class="evaluation-table">
        <thead>
            <tr>
                <th>[Column 1]</th><th>[Column 2]</th><th>[Column 3]</th><th>[Column 4]</th><th>[Column 5]</th><th>[Column 6]</th><th>[Column 7]</th>
            </tr>
        </thead>
        <tbody>
            <!-- Questions for this section -->
        </tbody>
    </table>
</div>
```

### JavaScript Functionality
1. **Score Calculation**:
   - Calculate weighted scores for each section based on configurable weights
   - Update global total score dynamically in real-time
   - Determine evaluation recommendation based on score thresholds

2. **Form Validation**:
   - Validate required fields with visual feedback
   - Ensure score inputs are within defined range
   - Handle conditional validation based on question types

3. **File Upload Handling**:
   - Support for common document formats (PDF, DOC, DOCX, JPG, JPEG, PNG)
   - File size validation and type checking
   - Document attachment management

4. **Interactive Features**:
   - Toggle visibility of scoring system
   - Collapsible sections for better navigation
   - Real-time calculation and display updates

## Configuration Schema

Questionnaire configurations are stored in discipline-specific database tables with the following structure:

### Questionnaire Configuration
```json
{
  "id": "unique_identifier",
  "name": "Questionnaire Name",
  "description": "Questionnaire description",
  "discipline": "safety|procurement|finance|etc",
  "sections": [
    {
      "id": "section_1",
      "title": "Section Title",
      "order": 1,
      "weight": 25,
      "questions": [
        {
          "id": "q1_1",
          "number": "1.1",
          "text": "Question text",
          "type": "radio|textarea|file|text",
          "required": true,
          "scoring": {
            "enabled": true,
            "scale": "1-5",
            "weight": 1
          },
          "options": ["Yes", "No"] // for radio/select
        }
      ]
    }
  ],
  "scoring_rules": {
    "total_max": 175,
    "recommendations": {
      "approved": { "min": 140, "label": "Approved - Excellent HSSE Management" },
      "conditional": { "min": 105, "max": 139, "label": "Conditional Approval - Requires Improvements" },
      "rejected_major": { "min": 70, "max": 104, "label": "Rejected - Major Improvements Needed" },
      "rejected_significant": { "max": 69, "label": "Rejected - Significant Compliance Issues" }
    }
  }
}
```

### Template Population Process
1. **Load Configuration**: Retrieve questionnaire config from database
2. **Select Template**: Choose appropriate HTML template based on questionnaire type
3. **Populate Sections**: Replace template placeholders with section data
4. **Generate Questions**: Create form inputs for each question
5. **Apply Scoring**: Configure scoring calculations and recommendations
6. **Validate Output**: Ensure generated HTML is complete and functional

## Special Considerations

1. **Multilingual Support**: Preserve additional language content while maintaining primary language
2. **Document Uploads**: Implement file upload fields where appropriate with proper validation
3. **Score Inputs**: Use configurable number inputs with appropriate min/max/step values
4. **Accessibility**: Ensure form is accessible with proper labels, ARIA attributes, and keyboard navigation
5. **Browser Compatibility**: Support modern browsers including mobile browsers with responsive design
6. **Form Validation**: Implement both client-side and server-side validation for data integrity
7. **Data Persistence**: Consider local storage or session management for form data
8. **Security**: Implement proper file upload security measures and input sanitization

## Expected Output

A complete HTML questionnaire that:
- Uses pre-built HTML templates as the foundation
- Dynamically populates sections and questions from database configurations
- Implements configurable scoring systems and evaluation recommendations
- Maintains professional, responsive design across all devices
- Supports file uploads, form validation, and real-time score calculations
- Can be customized per discipline while maintaining consistent functionality

## Validation Checklist
- [ ] Questionnaire configurations stored in database tables
- [ ] HTML templates dynamically populated with configuration data
- [ ] Scoring system working correctly with configurable rules
- [ ] Weighted scores calculated properly per section
- [ ] Evaluation recommendations display correctly
- [ ] File upload functionality working with validation
- [ ] Form validation implemented for all input types
- [ ] Responsive design tested across devices
- [ ] Print styles working for generated forms
- [ ] No JavaScript errors in template population
- [ ] All required fields marked appropriately
- [ ] Discipline-specific customizations working

## Status

- [x] **Architecture Updated**: Moved from Excel processing to configuration-driven templates
- [x] **Templates Available**: Pre-built HTML templates ready for dynamic population
- [x] **Database Schema**: Discipline-specific tables support questionnaire configurations
- [ ] **Implementation**: Dynamic template population system needs development
- [ ] **Testing**: End-to-end testing with configuration-driven questionnaires

## Version History

- **v2.0** (2025-12-11): Major architecture change - discontinued Excel processing, moved to configuration-driven templates
- **v1.2** (2025-11-11): Reformatted documentation to comply with 0000_DOCUMENTATION_GUIDE.md standards
- **v1.1** (2025-10-16): Updated prompt content for better Excel processing
- **v1.0** (2025-10-15): Initial HSSE questionnaire prompt creation

## Related Documentation

- [1300_02400_CONTRACTOR_VETTING_GUIDE.md](1300_02400_CONTRACTOR_VETTING_GUIDE.md) - Main contractor vetting system documentation
- [1300_01300_DOCUMENT_STRUCTURE_EXTRACTION_WORKFLOW.md](1300_01300_DOCUMENT_STRUCTURE_EXTRACTION_WORKFLOW.md) - Document processing workflow
- [docs/error-tracking/🎯 Format-Specific Processing Errors/1300_01300_EXCEL_PROCESSING_ERROR_TRACKING.md](docs/error-tracking/🎯 Format-Specific Processing Errors/1300_01300_EXCEL_PROCESSING_ERROR_TRACKING.md) - Excel processing error tracking
