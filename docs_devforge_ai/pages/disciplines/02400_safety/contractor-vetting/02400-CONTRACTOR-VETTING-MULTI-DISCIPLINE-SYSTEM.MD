## Critical Architecture Insight: Questionnaire vs Template Content Processing

### Root Cause Analysis - Persistent Questionnaire Display Issue

**Issue**: Questionnaires consistently displayed test HTML (`<input placeholder="Safety Test Field">`) instead of interactive questionnaire forms.

**Root Cause Discovered**: Questionnaires are fundamentally different content types from visual templates.

| Content Type | Data Format | Renderer Expectation | Usage |
|-------------|-------------|---------------------|-------|
| **Templates** | HTML Markup | Browser rendering | Safety documents, procedures |
| **Questionnaires** | JSON Schema | `ContractorQuestionnaireRenderer` | Interactive contractor eval |

**The questionnaire renderer expects JSON data**:
```javascript
const parsedData = JSON.parse(questionnaireData.html_content); // JSON, not HTML!
```

### Solution Implementation: Smart Content Type Detection

Added intelligent detection and type-based content generation:

```javascript
const detectIfQuestionnaire = (form) => {
  return formName.includes('hsseqs24001') ||
         formName.includes('questionnaire') ||
         formName.includes('evaluation');
}

if (isQuestionnaire) {
  htmlContent = generateQuestionnaireJsonForRenderer(form); // JSON for renderer
} else {
  htmlContent = generateHtmlFromSchema(form);             // HTML for display
}
```

**Questionnaire JSON Format**:
```json
{
  "json": {
    "title": "HSEQS24001 Eng Questionnaire",
    "fields": [
      {
        "id": "q_11_a_0",
        "question_text": "What is the personal involvement...",
        "type": "textarea"
      }
    ]
  }
}
```

### HSE Questionnaire Architecture: Manual Input → AI Evaluation

**Workflow Design** (by specification):
1. **Contractor Side**: Pure manual input for all HSE questions
2. **AI Side**: Server-side evaluation and scoring post-submission

**Questionnaire Fields**: Manual input only, AI-assistance properties stripped:
- `❌ ai_placeholder`, `❌ behavior: "ai_generated"`, `❌ ai_assisted`
- `✅ question_text`, `✅ type: "textarea"`, `✅ required`, `✅ question_code`

**Example HSEQS24001 Processing**:
- Detects as questionnaire (name contains "hsseqs24001")
- Extracts 82 questions from `schema.json.fields` array
- Generates JSON with manual input fields for contractors
- AI evaluation happens server-side after submission

### Technical Breakthrough Points

1. **Content-Format Confusion**: Questionnaires ≠ HTML templates
2. **Schema Processing**: HSEQS24001 uses nested `schema.json.fields` structure
3. **Manual vs AI Workflow**: Contractors provide responses, AI evaluates them
4. **Renderer Expectations**: JSON parsing, not HTML rendering

**Impact**: Resolved months-long issue where HSE questionnaires displayed test inputs instead of proper evaluation forms.
