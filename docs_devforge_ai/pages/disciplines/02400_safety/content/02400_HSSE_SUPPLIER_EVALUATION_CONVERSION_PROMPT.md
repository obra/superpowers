# Generic Form Conversion Prompt for Table-Based Evaluation Forms

## Objective
Convert Excel spreadsheet content into a comprehensive HTML form using a standardized table-based layout with scoring functionality and evaluation recommendations. This template can be adapted for various evaluation forms while maintaining consistent formatting and functionality.

## Source Analysis
The Excel spreadsheet contains:
- Structured content with hierarchical numbering (1, 1.1, 1.1a, etc.)
- Multiple columns that should be preserved in the HTML conversion
- Organized sections covering various evaluation criteria
- Different question types including text areas, select dropdowns, and file uploads

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

## Data Mapping Instructions

For each row in the Excel spreadsheet:

1. **Section Headers**: Convert to `<h2>` elements with appropriate section numbering and titles
2. **Question Rows**: Create table rows with:
   - Question number in first column
   - Question text in second column
   - Additional language text in third column (if applicable)
   - Document upload field in fourth column
   - Answer input field in fifth column
   - Score input in sixth column
   - Feedback textarea in seventh column

3. **Hierarchical Structure**: Maintain the parent-child relationship based on numbering system (e.g., 1.1 as parent row, 1.1a, 1.1b, 1.1c as child rows)

4. **Input Types**: Map Excel cell types to appropriate HTML input elements:
   - Text fields → `<input type="text">` or `<textarea>`
   - Dropdown selections → `<select>` with options
   - Numeric scores → `<input type="number">` with appropriate min/max/step
   - File uploads → `<input type="file">` with multiple file support

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

A complete HTML file that:
- Faithfully reproduces all content from the Excel spreadsheet
- Implements the scoring and vetting functionality from the reference HTML
- Is fully functional with JavaScript score calculation
- Has a professional, responsive design
- Can be printed or submitted electronically

## Validation Checklist
- [ ] All Excel columns preserved in HTML table
- [ ] Scoring system working correctly
- [ ] Weighted scores calculated properly
- [ ] Vetting recommendations display correctly
- [ ] File upload functionality working
- [ ] Form validation implemented
- [ ] Responsive design tested
- [ ] Print styles working
- [ ] No JavaScript errors
- [ ] All required fields marked appropriately
