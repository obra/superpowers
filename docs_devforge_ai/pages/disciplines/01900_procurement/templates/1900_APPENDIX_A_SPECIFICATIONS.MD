# 04 - Appendix A: Product Specifications

## Overview

Appendix A contains the detailed product specification sheets for all items in the procurement order. This is a tabular document that provides comprehensive specifications for each product.

## Document Structure

### Table Columns

| Column | Description | Data Source | Required |
|--------|-------------|-------------|----------|
| # | Row number | Index | Yes |
| Product Name | Full product name | `items[].productName` | Yes |
| Specification | Technical specifications | `items[].specification` | Yes |
| Typical Use | Common applications | `items[].typicalUse` | No |
| Unit | Unit of measure | `items[].unit` | Yes |
| Quantity | Number of units | `items[].quantity` | Yes |
| Rate (R) | Unit price in ZAR | `items[].rate` | Yes |
| Amount (R) | Line total | `items[].amount` | Yes |

### Sample Output

```
┌─────┬──────────────────────────────────┬────────────────────────┬─────────────────────┬──────┬──────────┬──────────┬───────────┐
│  #  │ Product Name                     │ Specification          │ Typical Use         │ Unit │ Quantity │ Rate (R) │ Amount(R) │
├─────┼──────────────────────────────────┼────────────────────────┼─────────────────────┼──────┼──────────┼──────────┼───────────┤
│  1  │ D3 Small Bulldozer – Caterpillar │ 80–100 HP, operating   │ Landscaping, site   │ Hour │     1    │    650   │     650   │
│     │                                  │ weight ±8,500 kg       │ clearing, light     │      │          │          │           │
│     │                                  │                        │ grading             │      │          │          │           │
├─────┼──────────────────────────────────┼────────────────────────┼─────────────────────┼──────┼──────────┼──────────┼───────────┤
│  2  │ D6 Medium Bulldozer – Caterpillar│ 185–200 HP, operating  │ Heavy earthmoving,  │ Hour │     2    │   1,200  │   2,400   │
│     │                                  │ weight ±18,000 kg      │ road construction   │      │          │          │           │
├─────┼──────────────────────────────────┼────────────────────────┼─────────────────────┼──────┼──────────┼──────────┼───────────┤
│ ... │ ...                              │ ...                    │ ...                 │ ...  │    ...   │    ...   │    ...    │
├─────┼──────────────────────────────────┼────────────────────────┼─────────────────────┼──────┼──────────┼──────────┼───────────┤
│     │                                  │                        │                     │      │  TOTAL:  │          │  125,000  │
└─────┴──────────────────────────────────┴────────────────────────┴─────────────────────┴──────┴──────────┴──────────┴───────────┘
```

## Data Source Mapping

### From Chat Conversation

```javascript
// User pastes tabular data in Step 7
const rawInput = `
Product Name | Specification | Category | Typical Use | Unit | Quantity | Rate | Amount
D3 Small Bulldozer | 80-100 HP | Bulldozer | Landscaping | Hour | 1 | 650 | 650
D6 Medium Bulldozer | 185-200 HP | Bulldozer | Heavy earthmoving | Hour | 2 | 1200 | 2400
`;

// Parsed into items array
const items = [
  {
    productName: "D3 Small Bulldozer – Caterpillar",
    specification: "80–100 HP, operating weight ±8,500 kg",
    category: "Small Bulldozer",
    typicalUse: "Landscaping, site clearing, light grading",
    unit: "Hour",
    quantity: 1,
    rate: 650,
    currency: "ZAR",
    amount: 650
  },
  // ... more items
];
```

### Calculated Fields

```javascript
// Total calculation
const total = items.reduce((sum, item) => sum + item.amount, 0);

// Display formatting
const formatCurrency = (value) => `R ${value.toLocaleString()}`;
```

## Template Storage

### Database Template Tables

Appendix A uses templates stored in the following database tables:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `procurement_templates` | Procurement document templates | `id`, `name`, `html_content`, `content_schema` |
| `governance_document_templates` | Governance form templates | `id`, `name`, `html_content`, `content_schema` |

### Source Template File

The Appendix A template is defined in:
- **File**: `docs/pages-forms-templates/01900_procurement/source/01900_appendix_a_product_specification_sheets_template.md`
- **Type**: HTML Form Description for Product Specifications
- **Sections**: General Requirements, Product Categories, Quality Assurance, Storage & Handling

### Template Structure

The template defines the following form sections:

1. **General Requirements Section**
   - Scope Field (Textarea)
   - Compliance Standards Field (Multi-select checkboxes)

2. **Product Categories Section**
   - Product Type Selection (Dropdown)
   - Sub-forms for each lubricant type:
     - Engine Oils Specifications
     - Hydraulic Oils Specifications
     - Gear Oils Specifications
     - Greases Specifications

3. **Quality Assurance Section**
   - Certificate Requirements (Multi-select)
   - Testing Requirements (Nested checkboxes)
   - Independent Testing (Multi-select)

4. **Storage & Handling Section**
   - Storage Conditions (Number inputs)
   - Shelf Life (Number inputs)
   - Handling Requirements (Multi-select)

5. **Document Metadata Section**
   - Document Reference (Text input)
   - Purchase Order (Text input)
   - Revision Information (Date + Text)
   - Prepared By (Text input)

### Template Retrieval

```javascript
// Retrieve Appendix A template from database
const retrieveAppendixATemplate = async () => {
  const response = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'retrieve',
      filters: {
        discipline_code: '01900',
        type: 'appendix_a_specifications',
        processing_status: 'published'
      }
    })
  });
  
  return response.json();
};
```

## Agent Integration

### Template Analysis Agent
- Queries `procurement_templates` or `governance_document_templates` table
- Identifies specification table template by type
- Maps columns to data fields from `content_schema`
- Validates required columns present

### Field Population Agent
- Populates table rows from items array using `html_content` template
- Calculates totals
- Applies formatting (currency, numbers) per `field_attributes`

### Quality Assurance Agent
- Validates all items have required fields per `content_schema`
- Checks quantity/rate/amount calculations
- Verifies total matches sum of amounts

## Export Options

### Print Format
- Professional table layout
- Page breaks for long tables
- Header row repeated on each page

### PDF Export
- Formatted PDF with company branding
- Table of contents reference
- Digital signature placeholder

### Excel Export
- Native spreadsheet format
- Formulas for calculations
- Conditional formatting for status

## Validation Rules

### Required Fields
- Product Name: Non-empty string
- Specification: Non-empty string
- Unit: Non-empty string
- Quantity: Positive integer
- Rate: Positive number
- Amount: Positive number

### Calculation Validation
```javascript
// Verify amount = quantity × rate
items.forEach(item => {
  const calculated = item.quantity * item.rate;
  if (Math.abs(calculated - item.amount) > 0.01) {
    warnings.push(`Amount mismatch for ${item.productName}`);
  }
});
```

## Related Documents

- **SOW Section 3**: References Appendix A for complete specifications
- **Appendix B**: SDS requirements for applicable products
- **Appendix E**: Logistics documentation for shipping