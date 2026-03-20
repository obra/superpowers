# HSSE Questionnaire HTML Form Generator

## Primary Objective
Convert the provided HSSE Management and Culture questionnaire into a professional, fully-functional HTML form with scoring capabilities and document upload functionality.

## Input Data Structure
The questionnaire has:
- **7 main sections** with hierarchical numbering (1.1, 1.1a, 2.1, 2.1a, etc.)
- **Mixed question types**: Yes/No, descriptive answers, document requirements
- **Scoring requirements**: Each question needs evaluation scoring
- **Document uploads**: Policy documents, training matrices, organizational charts

## Required Output: Complete HTML Form

### HTML Structure Requirements
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HSSE Management and Culture Questionnaire</title>
    <style>
        /* Professional styling for form sections, questions, scoring */
    </style>
</head>
<body>
    <div class="questionnaire-container">
        <header>
            <h1>HSSE Management and Culture Questionnaire</h1>
            <div class="form-meta">
                <p>Company: <input type="text" id="company-name"></p>
                <p>Evaluation Date: <input type="date" id="eval-date"></p>
            </div>
        </header>

        <!-- Section 1: HSSE Management Involvement -->
        <section class="form-section" id="section-1">
            <h2>1. HSSE Management and Culture</h2>

            <div class="question-block">
                <h3>1.1 Involvement in HSE Aspects through Management</h3>
                <div class="sub-question">
                    <p><strong>1.1 a)</strong> What is the personal involvement of senior managers in HSE management?</p>
                    <textarea class="answer-field" placeholder="Describe senior management involvement..."></textarea>
                    <div class="scoring">
                        <label>Score (1-5): <input type="number" min="1" max="5" class="score-input"></label>
                        <textarea class="feedback-field" placeholder="Evaluation comments..."></textarea>
                    </div>
                </div>
                <!-- Additional sub-questions b) and c) -->
            </div>
        </section>

        <!-- Additional sections 2-7 with similar structure -->

        <div class="scoring-summary">
            <h2>Evaluation Summary</h2>
            <div id="total-score">Total Score: <span id="score-display">0</span>/175</div>
            <div id="recommendation">Recommendation: <span id="rec-display">Pending</span></div>
        </div>
    </div>

    <script>
        // JavaScript for score calculation, form validation, file uploads
    </script>
</body>
</html>
```

### Functional Requirements

#### 1. Question Organization
- **Main sections** as `<section>` elements with clear headings
- **Sub-questions** grouped under parent questions with indentation
- **Hierarchical numbering** preserved (1.1, 1.1a, 1.1b, etc.)

#### 2. Input Types by Question Type
- **Descriptive answers** → `<textarea>` fields
- **Yes/No questions** → Radio button groups
- **Document requirements** → `<input type="file">` with validation
- **Scores** → `<input type="number" min="1" max="5">`

#### 3. Scoring System
- **Individual scores**: 1-5 scale per question
- **Section totals**: Sum of question scores within each section
- **Overall total**: Sum of all section scores
- **Recommendations**: Automatic based on total score ranges

#### 4. File Upload Handling
- **Multiple formats**: PDF, DOC, DOCX, XLS, JPG, PNG
- **File validation**: Size limits, type checking
- **Upload feedback**: Success/error messages

### CSS Styling Requirements
- **Professional appearance**: Clean, corporate styling
- **Section organization**: Clear visual separation between sections
- **Responsive design**: Works on desktop and mobile
- **Print-friendly**: Optimized for PDF generation

### JavaScript Functionality
```javascript
// Core functions needed:
function calculateSectionScore(sectionId) {
    // Sum all scores in a section
}

function calculateTotalScore() {
    // Sum all section scores
}

function generateRecommendation(totalScore) {
    // Return recommendation based on score thresholds
}

function validateFileUpload(fileInput) {
    // Check file type and size
}

function updateScoreDisplay() {
    // Update UI with current scores
}
```

## Data Transformation Examples

### Example 1: Simple Descriptive Question
**Input:**
```
1.1 a) What is the personal involvement of senior managers in HSE management?
```

**Output:**
```html
<div class="sub-question">
    <p><strong>1.1 a)</strong> What is the personal involvement of senior managers in HSE management?</p>
    <textarea class="answer-field" placeholder="Describe senior management involvement..."></textarea>
    <div class="scoring">
        <label>Score (1-5): <input type="number" min="1" max="5" class="score-input" data-question="1.1a"></label>
        <textarea class="feedback-field" placeholder="Evaluation comments..."></textarea>
    </div>
</div>
```

### Example 2: Document Upload Question
**Input:**
```
2.1 a) Does your company have documentation relating to the HSE policy? If yes, attach a copy.
```

**Output:**
```html
<div class="sub-question">
    <p><strong>2.1 a)</strong> Does your company have documentation relating to the HSE policy? If yes, attach a copy.</p>
    <div class="answer-options">
        <label><input type="radio" name="q2-1a" value="yes"> Yes</label>
        <label><input type="radio" name="q2-1a" value="no"> No</label>
    </div>
    <div class="file-upload">
        <input type="file" accept=".pdf,.doc,.docx" multiple>
        <div class="upload-status"></div>
    </div>
    <div class="scoring">
        <label>Score (1-5): <input type="number" min="1" max="5" class="score-input" data-question="2.1a"></label>
        <textarea class="feedback-field" placeholder="Evaluation comments..."></textarea>
    </div>
</div>
```

## Scoring Logic
- **Perfect Score**: 35 questions × 5 points = 175 total points
- **Recommendation Thresholds**:
  - 140-175: "Approved - Excellent HSSE Management"
  - 105-139: "Conditional Approval - Requires Improvements"
  - 70-104: "Rejected - Major Improvements Needed"
  - Below 70: "Rejected - Significant Compliance Issues"

## Questionnaire Content to Convert

[Insert the full HSSE questionnaire content here]

## Final Output Requirements
- **Complete HTML file** ready to save and open in browser
- **All questionnaire content** converted to form fields
- **Functional scoring system** with automatic calculations
- **File upload capability** with validation
- **Professional styling** suitable for client presentations
- **Print-optimized** for PDF generation
- **Mobile responsive** design
