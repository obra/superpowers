# Document Structure Extraction Prompts
**Multi-Format Document Processing for Form Creation**

## Overview
This document defines the LLM-based prompts and processing logic for extracting structured content from various document formats (PDF, DOCX, Pages, TXT) to generate editable governance forms.

**Related Documents:**
- [Governance Page Documentation](./1300_01300_GOVERNANCE_PAGE.md)
- [Prompt Management System](./1300_02050_PROMPT_MANAGEMENT_SYSTEM.md)
- [HSSE Supplier Evaluation Conversion Prompt](./1300_02400_HSSE_SUPPLIER_EVALUATION_CONVERSION_PROMPT.md)

---

## Problem Statement

### The Challenge
Different document formats present varying levels of structural information:

| Format | Native Structure | Extraction Complexity | LLM Need |
|--------|------------------|----------------------|----------|
| **PDF** | ❌ None (flat text) | 🔴 High | ✅ Required |
| **DOCX** | ✅ Styles/Headings | 🟡 Medium | ⚠️ Recommended |
| **Pages** | ✅ Styles/Headings | 🟡 Medium | ⚠️ Recommended |
| **TXT** | ❌ None (plain text) | 🔴 High | ✅ Required |
| **XLSX** | ⚠️ Tabular data | 🟡 Medium | ⚠️ Conditional |
| **Numbers** | ⚠️ Tabular data | 🟡 Medium | ⚠️ Conditional |

**Common Issue Across Formats:**
Even formats with native structure (DOCX, Pages) can have:
- Inconsistent heading styles
- Manual formatting instead of semantic styles
- Nested content without clear hierarchy
- Mixed formatting approaches

**Solution:** Use LLM to intelligently analyze content and extract semantic structure regardless of source format.

---

## Format-Specific Processing

### 1. PDF Documents

**Native Extraction Library:** PDF.js
**Primary Challenge:** Completely flat text output

```javascript
// PDF.js output example
const rawText = "Heading 1 This is content. Heading 2 More content here.";
// ❌ No structure preserved!
```

**Processing Approach:**
1. Extract raw text using PDF.js
2. Pass text to LLM for structure analysis
3. LLM identifies headings, content blocks, and hierarchy
4. Generate structured JSON output

**Implementation:**
```javascript
// In pdf-processing-service.js
async processPDFDocument(file) {
  // Step 1: Extract raw text
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const textContent = await page.getTextContent();
  const rawText = textContent.items.map(item => item.str).join(' ');
  
  // Step 2: Use LLM to extract structure
  const structure = await this.extractDocumentStructure(rawText, {
    fileName: file.name,
    pageCount: pdf.numPages,
    format: 'pdf'
  });
  
  return structure;
}
```

---

### 2. DOCX Documents

**Native Extraction Library:** mammoth.js or docx
**Primary Challenge:** Inconsistent style usage

```javascript
// mammoth.js can extract styles
const result = await mammoth.convertToHtml(buffer, {
  styleMap: [
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh"
  ]
});
// ✅ Better structure, but still inconsistent
```

**Processing Approach:**
1. Extract text with style information using mammoth.js
2. **Option A (Hybrid):** Use native styles if reliable, fallback to LLM
3. **Option B (Pure LLM):** Pass raw text to LLM for consistent processing
4. Generate structured JSON output

**Implementation:**
```javascript
// In document-processing-service.js
async processDOCXDocument(file) {
  const buffer = await file.arrayBuffer();
  
  // Step 1: Extract text with styles
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const rawText = result.value;
  
  // Step 2: Attempt native style extraction
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const hasReliableStyles = this.validateStyleStructure(htmlResult.value);
  
  if (hasReliableStyles) {
    // Option A: Use native structure
    return this.parseHTMLStructure(htmlResult.value);
  } else {
    // Option B: Use LLM for structure
    return await this.extractDocumentStructure(rawText, {
      fileName: file.name,
      format: 'docx'
    });
  }
}

validateStyleStructure(html) {
  // Check if document has consistent heading hierarchy
  const headingPattern = /<h[1-6]>/gi;
  const headingCount = (html.match(headingPattern) || []).length;
  return headingCount > 0; // Has at least some headings
}
```

**Recommended Approach:** Use LLM for consistency across all DOCX files, regardless of style quality.

---

### 3. Apple Pages Documents

**Native Extraction Library:** Custom parser or conversion to DOCX
**Primary Challenge:** Proprietary format, requires conversion

**Processing Approach:**
1. Convert Pages to DOCX or extract as RTF
2. Follow DOCX processing approach
3. Use LLM for structure extraction

**Implementation:**
```javascript
// In document-processing-service.js
async processPagesDocument(file) {
  // Pages files are actually ZIP archives
  // Extract the main document XML
  const zip = await JSZip.loadAsync(file);
  const indexXml = await zip.file('index.xml').async('string');
  
  // Parse XML to extract text
  const rawText = this.parseApplePagesXML(indexXml);
  
  // Use LLM for structure (same as PDF/TXT)
  return await this.extractDocumentStructure(rawText, {
    fileName: file.name,
    format: 'pages'
  });
}
```

**Alternative:** Use server-side conversion (LibreOffice) to convert Pages → DOCX → process as DOCX.

---

### 4. Plain Text (TXT) Documents

**Native Extraction:** Simple text reading
**Primary Challenge:** Zero structure, completely flat

**Processing Approach:**
1. Read raw text (UTF-8)
2. Pass to LLM for structure analysis
3. LLM must infer structure from content patterns
4. Generate structured JSON output

**Implementation:**
```javascript
// In document-processing-service.js
async processTXTDocument(file) {
  // Step 1: Read raw text
  const rawText = await file.text();
  
  // Step 2: Use LLM for structure (same as PDF)
  return await this.extractDocumentStructure(rawText, {
    fileName: file.name,
    format: 'txt'
  });
}
```

**Note:** TXT files rely entirely on content analysis. The LLM must identify structure from patterns like:
- ALL CAPS lines → Headings
- Numbered lists → Sections
- Blank lines → Section breaks
- Indentation → Hierarchy

---

### 5. Excel Spreadsheets (XLSX)

**Native Extraction Library:** xlsx.js (SheetJS)
**Primary Challenge:** Tabular data needs form field mapping

**Processing Approach:**
1. Extract sheet data using xlsx.js
2. **Option A:** If data has clear header row → Auto-map to form fields
3. **Option B:** If complex structure → Use LLM to interpret data layout
4. Generate structured JSON output

**Implementation:**
```javascript
// In document-processing-service.js
async processXLSXDocument(file) {
  const buffer = await file.arrayBuffer();
  
  // Step 1: Read workbook
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Step 2: Convert to JSON
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  
  // Step 3: Analyze structure
  const hasHeaders = this.detectHeaderRow(data);
  
  if (hasHeaders && this.isSimpleTable(data)) {
    // Option A: Direct mapping for simple tables
    return this.mapTableToFormFields(data);
  } else {
    // Option B: Use LLM for complex spreadsheets
    const textRepresentation = this.convertTableToText(data);
    return await this.extractDocumentStructure(textRepresentation, {
      fileName: file.name,
      format: 'xlsx'
    });
  }
}

detectHeaderRow(data) {
  if (data.length < 2) return false;
  
  const firstRow = data[0];
  const secondRow = data[1];
  
  // Check if first row is all strings (headers) and second row has data
  const firstRowAllStrings = firstRow.every(cell => typeof cell === 'string');
  const secondRowHasData = secondRow.some(cell => cell !== null && cell !== undefined);
  
  return firstRowAllStrings && secondRowHasData;
}

isSimpleTable(data) {
  // Simple table: uniform columns, no merged cells, single header row
  const columnCount = data[0].length;
  return data.every(row => row.length === columnCount);
}

mapTableToFormFields(data) {
  const headers = data[0];
  const structure = {
    documentTitle: 'Spreadsheet Form',
    metadata: {
      format: 'xlsx',
      hasFormFields: true,
      estimatedSections: 1,
      confidence: 'high'
    },
    structure: [{
      id: 'section_1',
      type: 'section',
      level: 1,
      heading: 'Form Fields',
      content: headers.map((header, index) => ({
        id: `field_${index}`,
        type: this.inferFieldType(data.slice(1), index),
        label: header,
        value: '',
        behavior: 'editable',
        required: false
      }))
    }]
  };
  
  return structure;
}

inferFieldType(dataRows, columnIndex) {
  // Sample first few rows to infer type
  const samples = dataRows.slice(0, 5).map(row => row[columnIndex]);
  
  if (samples.every(val => typeof val === 'number')) return 'number';
  if (samples.every(val => this.isDate(val))) return 'date';
  if (samples.every(val => this.isEmail(val))) return 'email';
  
  return 'text';
}

convertTableToText(data) {
  // Convert spreadsheet to readable text for LLM
  let text = '';
  data.forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      text += 'HEADERS: ' + row.join(' | ') + '\n\n';
    } else {
      text += 'Row ' + rowIndex + ': ' + row.join(' | ') + '\n';
    }
  });
  return text;
}
```

**Use Cases:**
- **Simple Forms:** Header row + data columns → Direct field mapping
- **Complex Forms:** Multi-section sheets, merged cells → LLM analysis
- **Data Templates:** Predefined structure → Template matching

---

### 6. Apple Numbers Spreadsheets

**Native Extraction Library:** Custom parser or conversion to XLSX
**Primary Challenge:** Proprietary format similar to Pages

**Processing Approach:**
1. Convert Numbers to XLSX (server-side or library)
2. Follow XLSX processing approach
3. Use LLM for complex layouts

**Implementation:**
```javascript
// In document-processing-service.js
async processNumbersDocument(file) {
  // Numbers files are ZIP archives (similar to Pages)
  const zip = await JSZip.loadAsync(file);
  
  // Option A: Extract and parse Numbers-specific XML
  try {
    const indexXml = await zip.file('Index/Document.iwa').async('string');
    const parsedData = this.parseNumbersIWA(indexXml);
    
    // Convert to table format
    const tableData = this.extractTablesFromNumbers(parsedData);
    
    // Process as table data (like XLSX)
    return await this.processTableData(tableData, {
      fileName: file.name,
      format: 'numbers'
    });
  } catch (error) {
    console.warn('Could not parse Numbers native format, attempting conversion');
    
    // Option B: Server-side conversion Numbers → XLSX
    const xlsxBuffer = await this.convertNumbersToXLSX(file);
    const xlsxFile = new File([xlsxBuffer], file.name.replace('.numbers', '.xlsx'));
    return await this.processXLSXDocument(xlsxFile);
  }
}

async convertNumbersToXLSX(numbersFile) {
  // Server-side conversion using LibreOffice or Numbers API
  const formData = new FormData();
  formData.append('file', numbersFile);
  
  const response = await fetch('/api/convert/numbers-to-xlsx', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to convert Numbers file to XLSX');
  }
  
  return await response.arrayBuffer();
}

processTableData(tableData, metadata) {
  // Determine if simple or complex table structure
  if (this.isSimpleTable(tableData)) {
    return this.mapTableToFormFields(tableData);
  } else {
    // Use LLM for complex tables
    const textRepresentation = this.convertTableToText(tableData);
    return this.extractDocumentStructure(textRepresentation, metadata);
  }
}
```

**Alternative Approach:**
```javascript
// Use cloud conversion service
async processNumbersDocument(file) {
  // Convert using CloudConvert or similar service
  const xlsxBuffer = await cloudConvert.convert(file, 'numbers', 'xlsx');
  const xlsxFile = new File([xlsxBuffer], file.name.replace('.numbers', '.xlsx'));
  return await this.processXLSXDocument(xlsxFile);
}
```

---

## Unified LLM Prompt Template

This prompt works for **all document formats** because it analyzes content semantically, not structurally.

### ✅ PROMPT STORED IN DATABASE

**Database Status:** ✅ **CREATED** (ID: dd9730c9-0d01-4e74-84c5-fab8d48474dc)

**Storage Location:** `prompts` table (via Prompt Management System)
- **Category:** `document_processing`
- **Type:** `document`
- **Status:** `is_active = true`

```sql
INSERT INTO ai_prompts (
  prompt_key,
  prompt_name,
  category,
  prompt_template,
  model_preference,
  temperature,
  max_tokens,
  created_by
) VALUES (
  'document_structure_extraction',
  'Document Structure Extraction (Multi-Format)',
  'document_processing',
  $TEMPLATE$, -- See template below
  'gpt-4o-mini',
  0.1,
  2000,
  'system'
);
```

### Complete Prompt Template

```markdown
You are an expert document structure analyzer. Your task is to analyze the provided text extracted from a {{format}} document and identify its semantic structure.

**Document Metadata:**
- File Name: {{fileName}}
- Format: {{format}}
- {{#if pageCount}}Page Count: {{pageCount}}{{/if}}
- Extracted Text Length: {{textLength}} characters

**Your Task:**
1. Identify all headings and their hierarchy levels (H1, H2, H3, etc.)
2. Extract the content associated with each heading
3. Identify form fields that should be editable vs read-only
4. Determine which fields should be AI-generated vs manually filled
5. Preserve the logical document structure

**Analysis Guidelines:**

For **Heading Detection:**
- Look for ALL CAPS text, numbered sections, bold formatting indicators
- Analyze content patterns: short lines followed by paragraphs
- Identify hierarchy from numbering (1. → 1.1 → 1.1.1) or indentation
- Common patterns:
  - "SECTION 1: TITLE" → H1
  - "1.1 Subtitle" → H2
  - "1.1.1 Detail" → H3

For **Field Classification:**
- **Editable Fields:** Names, dates, references, project-specific data
- **Read-Only Fields:** Policy text, instructions, definitions, regulations
- **AI-Generated Fields:** Summaries, recommendations, analysis, risk assessments

For **Content Blocks:**
- Preserve paragraph structure
- Maintain lists (ordered/unordered)
- Identify tables (if present in text)
- Keep related content together

**Expected Output Format (JSON):**

```json
{
  "documentTitle": "Extracted title or file name",
  "metadata": {
    "format": "{{format}}",
    "hasFormFields": true,
    "estimatedSections": 5,
    "confidence": "high|medium|low"
  },
  "structure": [
    {
      "id": "section_1",
      "type": "section",
      "level": 1,
      "heading": "Main Section Title",
      "content": [
        {
          "id": "field_1_1",
          "type": "text",
          "label": "Project Name",
          "value": "",
          "behavior": "editable",
          "required": true
        },
        {
          "id": "field_1_2",
          "type": "paragraph",
          "label": "Policy Statement",
          "value": "Full policy text here...",
          "behavior": "readonly",
          "required": false
        },
        {
          "id": "field_1_3",
          "type": "textarea",
          "label": "Risk Assessment Summary",
          "value": "",
          "behavior": "ai_generated",
          "aiPrompt": "Summarize the risks identified in the document",
          "required": true
        }
      ],
      "subsections": [
        {
          "id": "section_1_1",
          "type": "subsection",
          "level": 2,
          "heading": "Subsection Title",
          "content": [...]
        }
      ]
    }
  ]
}
```

**Field Behavior Types:**
- `editable`: User must manually fill (names, dates, project specifics)
- `readonly`: Display only, no editing (policy text, definitions)
- `ai_generated`: AI should generate content (summaries, recommendations)

**Quality Checks:**
- Ensure all headings have associated content
- Verify hierarchy levels are sequential (don't skip from H1 to H3)
- Identify at least one editable field per section
- Flag unclear structure with lower confidence score

**Format-Specific Considerations:**
{{#if format === 'pdf'}}
- PDF text may have poor spacing; use context to identify breaks
- Watch for page headers/footers repeated in text
- Font size indicators may signal headings
{{/if}}

{{#if format === 'docx'}}
- Style names may be inconsistent; focus on content patterns
- Tables may be linearized; reconstruct structure
{{/if}}

{{#if format === 'txt'}}
- Zero native structure; rely entirely on content analysis
- Look for visual patterns: CAPS, numbering, blank lines
- Indentation may indicate hierarchy
{{/if}}

{{#if format === 'pages'}}
- Similar to DOCX processing
- May have rich formatting that's lost in extraction
{{/if}}

**The Extracted Text:**
{{extractedText}}

**Remember:** Output ONLY valid JSON. No explanations, no markdown formatting, just the JSON object.
```

---

## Implementation in Processing Service

### Unified Service Method

```javascript
// In document-processing-service.js or pdf-processing-service.js

class DocumentProcessingService {
  constructor() {
    this.openAIKey = process.env.OPENAI_API_KEY;
    this.modelPreference = 'gpt-4o-mini'; // Cost-effective, fast
  }

  /**
   * Main entry point: Process any document format
   */
  async processDocument(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    switch (fileExtension) {
      case 'pdf':
        return await this.processPDFDocument(file);
      case 'docx':
      case 'doc':
        return await this.processDOCXDocument(file);
      case 'pages':
        return await this.processPagesDocument(file);
      case 'txt':
        return await this.processTXTDocument(file);
      case 'xlsx':
      case 'xls':
        return await this.processXLSXDocument(file);
      case 'numbers':
        return await this.processNumbersDocument(file);
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`);
    }
  }

  /**
   * Core LLM-based structure extraction (format-agnostic)
   */
  async extractDocumentStructure(extractedText, metadata) {
    try {
      // Step 1: Retrieve prompt template from database
      const promptTemplate = await this.getPromptTemplate('document_structure_extraction');
      
      // Step 2: Build prompt with metadata
      const prompt = this.buildPrompt(promptTemplate, {
        extractedText,
        fileName: metadata.fileName,
        format: metadata.format,
        pageCount: metadata.pageCount || null,
        textLength: extractedText.length
      });
      
      // Step 3: Call LLM
      const response = await this.callLLM(prompt, {
        model: this.modelPreference,
        temperature: 0.1, // Low temp for consistency
        maxTokens: 2000,
        responseFormat: { type: 'json_object' } // Force JSON output
      });
      
      // Step 4: Parse and validate response
      const structure = JSON.parse(response);
      this.validateStructure(structure);
      
      // Step 5: Log for analytics
      await this.logProcessing({
        fileName: metadata.fileName,
        format: metadata.format,
        tokensUsed: response.usage.total_tokens,
        confidence: structure.metadata.confidence,
        timestamp: new Date()
      });
      
      return structure;
      
    } catch (error) {
      console.error('Structure extraction failed:', error);
      throw new Error(`Failed to extract document structure: ${error.message}`);
    }
  }

  /**
   * Retrieve prompt template from database
   */
  async getPromptTemplate(promptKey) {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('prompt_template, model_preference, temperature, max_tokens')
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      throw new Error(`Prompt template not found: ${promptKey}`);
    }
    
    return data;
  }

  /**
   * Build prompt using template and variables
   */
  buildPrompt(template, variables) {
    let prompt = template.prompt_template;
    
    // Simple template variable replacement
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, variables[key]);
    });
    
    // Handle conditional blocks (basic implementation)
    prompt = this.handleConditionals(prompt, variables);
    
    return prompt;
  }

  /**
   * Handle {{#if}} conditionals in template
   */
  handleConditionals(template, variables) {
    // Match {{#if condition}}...{{/if}} blocks
    const conditionalRegex = /{{#if\s+(.+?)}}([\s\S]*?){{\/if}}/g;
    
    return template.replace(conditionalRegex, (match, condition, content) => {
      // Evaluate condition (simple implementation)
      const shouldInclude = this.evaluateCondition(condition, variables);
      return shouldInclude ? content : '';
    });
  }

  /**
   * Evaluate simple conditions
   */
  evaluateCondition(condition, variables) {
    // Handle "variable === 'value'" syntax
    const eqMatch = condition.match(/(.+?)\s*===\s*'(.+?)'/);
    if (eqMatch) {
      const [, varName, value] = eqMatch;
      return variables[varName.trim()] === value;
    }
    
    // Handle simple variable existence check
    return !!variables[condition.trim()];
  }

  /**
   * Call LLM API (OpenAI)
   */
  async callLLM(prompt, options) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openAIKey}`
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a document structure analysis expert. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.1,
        max_tokens: options.maxTokens || 2000,
        response_format: options.responseFormat || { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LLM API error: ${error.error.message}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }

  /**
   * Validate structure output
   */
  validateStructure(structure) {
    if (!structure.structure || !Array.isArray(structure.structure)) {
      throw new Error('Invalid structure: missing or invalid "structure" array');
    }
    
    if (!structure.documentTitle) {
      throw new Error('Invalid structure: missing documentTitle');
    }
    
    // Validate each section has required fields
    structure.structure.forEach((section, index) => {
      if (!section.id || !section.heading) {
        throw new Error(`Invalid section at index ${index}: missing id or heading`);
      }
    });
  }

  /**
   * Log processing for analytics
   */
  async logProcessing(logData) {
    try {
      await supabase
        .from('document_processing_log')
        .insert({
          file_name: logData.fileName,
          document_format: logData.format,
          tokens_used: logData.tokensUsed,
          confidence_score: logData.confidence,
          processed_at: logData.timestamp,
          status: 'success'
        });
    } catch (error) {
      console.error('Failed to log processing:', error);
      // Don't throw - logging failure shouldn't block processing
    }
  }
}

export default new DocumentProcessingService();
```

---

## Model Recommendations

### Primary Model: GPT-4o-mini

**Why GPT-4o-mini:**
- ✅ Cost-effective: ~$0.001-0.005 per document
- ✅ Fast: 3-8 seconds processing time
- ✅ Excellent structure recognition
- ✅ Reliable JSON output with response_format
- ✅ Good at identifying heading patterns

**Cost Analysis:**
```
Average document: 2000 words = ~2500 tokens input
Response: ~500 tokens output
Total: ~3000 tokens per document

Pricing (GPT-4o-mini):
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

Cost per document:
(2500 * 0.00000015) + (500 * 0.0000006) = $0.000675
≈ $0.001 per document
```

### Alternative: Claude 3.5 Haiku

**Why Claude 3.5 Haiku:**
- ✅ Similar cost to GPT-4o-mini
- ✅ Excellent at following structured output formats
- ✅ Strong content understanding
- ⚠️ Requires different API integration

**When to Use:**
- If OpenAI API is unavailable
- If you need Anthropic's safety features
- If you prefer Claude's output style

### Not Recommended: GPT-4o / Claude 3.5 Sonnet

**Why NOT use premium models:**
- ❌ 10-20x more expensive
- ❌ Slower processing
- ❌ Overkill for structure extraction
- ✅ Only needed for complex reasoning tasks

---

## Cost & Performance Analysis

### Expected Metrics

| Document Type | Avg Size | Processing Time | Cost per Doc | Accuracy |
|---------------|----------|-----------------|--------------|----------|
| **PDF** | 5-10 pages | 5-8 seconds | $0.001-0.003 | 92-96% |
| **DOCX** | 3-8 pages | 4-6 seconds | $0.001-0.002 | 94-98% |
| **Pages** | 3-8 pages | 4-6 seconds | $0.001-0.002 | 94-98% |
| **TXT** | 1-5 pages | 3-5 seconds | $0.001-0.002 | 88-94% |
| **XLSX** | 10-50 rows | 2-4 seconds | $0.0005-0.001 | 96-99% |
| **Numbers** | 10-50 rows | 3-5 seconds | $0.001-0.002 | 94-98% |

**Notes:**
- TXT has lower accuracy due to zero native structure
- DOCX/Pages have higher accuracy when styles are used
- PDF accuracy depends on text extraction quality
- Processing time includes LLM API call latency

### Monthly Cost Projection

**Scenario: 100 documents/month**
```
100 documents × $0.002 avg = $0.20/month
```

**Scenario: 1000 documents/month**
```
1000 documents × $0.002 avg = $2.00/month
```

**Conclusion:** Extremely cost-effective even at high volume.

---

## Error Handling

### Common Errors & Solutions

**1. Invalid JSON Response**
```javascript
try {
  const structure = JSON.parse(response.content);
} catch (error) {
  // Retry with stricter prompt
  console.warn('LLM returned invalid JSON, retrying with stricter instructions');
  const retryPrompt = `${originalPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No explanations.`;
  const retryResponse = await this.callLLM(retryPrompt, options);
  structure = JSON.parse(retryResponse.content);
}
```

**2. Poor Text Extraction**
```javascript
if (extractedText.length < 100) {
  throw new Error('Extracted text too short. Document may be image-based or corrupted.');
}

// Check for image-based PDFs
if (extractedText.trim().length === 0 && format === 'pdf') {
  throw new Error('PDF appears to be image-based. OCR required.');
}
```

**3. LLM API Timeout**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await fetch(apiUrl, {
    ...options,
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('LLM API timeout. Document may be too large.');
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

**4. Structure Validation Failure**
```javascript
validateStructure(structure) {
  const issues = [];
  
  if (!structure.structure || structure.structure.length === 0) {
    issues.push('No sections found');
  }
  
  structure.structure.forEach((section, idx) => {
    if (!section.heading) issues.push(`Section ${idx} missing heading`);
    if (!section.content || section.content.length === 0) {
      issues.push(`Section ${idx} has no content`);
    }
  });
  
  if (issues.length > 0) {
    throw new Error(`Structure validation failed:\n${issues.join('\n')}`);
  }
}
```

---

## Testing Checklist

### Format-Specific Tests

**PDF Testing:**
- [ ] Simple PDF with clear headings
- [ ] Complex PDF with nested sections
- [ ] Multi-page PDF (10+ pages)
- [ ] PDF with tables
- [ ] Image-based PDF (should fail gracefully with OCR suggestion)
- [ ] Scanned document with poor quality text

**DOCX Testing:**
- [ ] DOCX with heading styles applied
- [ ] DOCX with manual formatting (bold as headings)
- [ ] DOCX with tables and lists
- [ ] DOCX with minimal structure
- [ ] Template document with fillable fields

**Pages Testing:**
- [ ] Pages document with standard structure
- [ ] Pages document with custom styles
- [ ] Complex Pages document with media

**TXT Testing:**
- [ ] Structured TXT with clear formatting
- [ ] Flat TXT with minimal structure
- [ ] TXT with numbered sections
- [ ] README-style TXT file

**XLSX Testing:**
- [ ] Simple spreadsheet with clear header row
- [ ] Complex multi-sheet workbook
- [ ] Spreadsheet with merged cells
- [ ] Spreadsheet with formulas and calculations
- [ ] Data validation and dropdown lists

**Numbers Testing:**
- [ ] Simple Numbers spreadsheet
- [ ] Numbers document with multiple sheets
- [ ] Numbers with charts and media
- [ ] Conversion to XLSX works correctly

### Quality Tests

**Structure Accuracy:**
- [ ] Headings correctly identified and leveled
- [ ] Content properly associated with headings
- [ ] Hierarchy preserved (parent-child relationships)
- [ ] No orphaned content

**Field Classification:**
- [ ] Editable fields correctly marked
- [ ] Read-only fields correctly marked
- [ ] AI-generated fields have appropriate prompts
- [ ] Required flags set appropriately

**Performance:**
- [ ] Processing completes within 10 seconds
- [ ] No memory leaks on batch processing
- [ ] Concurrent processing works correctly
- [ ] Error recovery from API failures

**Cost Validation:**
- [ ] Token usage logged correctly
- [ ] Cost per document within expected range
- [ ] Batch processing doesn't exceed budget

---

## Integration Example

### Complete Upload Modal Integration

```javascript
// In 01300-pdf-upload-modal.js

import documentProcessingService from './document-processing-service';

class PDFUploadModal {
  async handleFileUpload(file) {
    try {
      this.showProcessingState();
      
      // Step 1: Process document (format-agnostic)
      const structure = await documentProcessingService.processDocument(file);
      
      // Step 2: Generate form HTML from structure
      const formHTML = this.generateFormHTML(structure);
      
      // Step 3: Render in modal
      this.renderForm(formHTML);
      
      // Step 4: Enable editing
      this.enableFieldEditing(structure);
      
      this.showSuccessState();
      
    } catch (error) {
      console.error('Document processing failed:', error);
      this.showErrorState(error.message);
    }
  }

  generateFormHTML(structure) {
    let html = `<div class="generated-form">`;
    html += `<h1>${structure.documentTitle}</h1>`;
    
    structure.structure.forEach(section => {
      html += this.generateSectionHTML(section);
    });
    
    html += `</div>`;
    return html;
  }

  generateSectionHTML(section) {
    let html = `<section id="${section.id}">`;
    html += `<h${section.level}>${section.heading}</h${section.level}>`;
    
    section.content.forEach(field => {
      html += this.generateFieldHTML(field);
    });
    
    if (section.subsections) {
      section.subsections.forEach(subsection => {
        html += this.generateSectionHTML(subsection);
      });
    }
    
    html += `</section>`;
    return html;
  }

  generateFieldHTML(field) {
    switch (field.behavior) {
      case 'editable':
        return `
          <div class="form-field editable">
            <label for="${field.id}">${field.label}${field.required ? '*' : ''}</label>
            <input type="${field.type}" id="${field.id}" value="${field.value}" />
          </div>
        `;
      
      case 'readonly':
        return `
          <div class="form-field readonly">
            <label>${field.label}</label>
            <div class="readonly-content">${field.value}</div>
          </div>
        `;
      
      case 'ai_generated':
        return `
          <div class="form-field ai-generated">
            <label for="${field.id}">${field.label}${field.required ? '*' : ''}</label>
            <textarea id="${field.id}" placeholder="AI will generate this content...">${field.value}</textarea>
            <button class="generate-ai-content" data-prompt="${field.aiPrompt}">
              Generate with AI
            </button>
          </div>
        `;
      
      default:
        return '';
    }
  }
}
```

---

## Database Schema

### Prompt Storage

```sql
-- Prompt templates (already exists via Prompt Management System)
CREATE TABLE IF NOT EXISTS ai_prom
