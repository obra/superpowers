# 02400 Contractor Vetting System

## Critical Technical Fix: Questionnaire Content Processing

### Questionnaire Renderer Architecture

**Key Discovery**: The `ContractorQuestionnaireRenderer` expects **JSON data**, not HTML markup.

**JSON Format for Questionnaires**:
```json
{
  "json": {
    "title": "HSEQS24001 Eng Questionnaire",
    "fields": [
      {
        "id": "q_11_a_0",
        "question_text": "What is the personal involvement...",
        "type": "textarea",
        "required": false
      }
    ]
  }
}
```

**Renderer Code**:
```javascript
const parsedData = JSON.parse(questionnaireData.html_content); // JSON, not HTML!
const questionnaire = {
  title: parsedData.json.title,
  fields: parsedData.json.fields
}
```

### Technical Breakthrough Resolution

**Problem**: Questionnaires displayed test HTML (`<input placeholder="Safety Test Field">`) instead of interactive evaluation forms.

**Root Cause**: Content-type confusion - questionnaires store JSON data for the questionnaire renderer, not HTML markup for browser display.

**Solution**: Type-based content generation:
- **Questionnaires** → JSON field definitions (82 HSE questions)
- **Templates** → HTML markup (visual documents)

**Manual Contractor Input → AI Evaluation Architecture**:
1. 🌟 Contractor submits genuine HSE compliance responses
2. 🤖 Server-side AI evaluates and scores responses
3. 📊 Results displayed for reviewer approval

This resolved the persistent issue preventing HSE evaluation questionnaires from functioning properly.

## Status

- [x] Implemented
- [x] Tested
- [x] Documented
- [ ] Production Ready

## Version History

- v1.0 (2025-08-27): Initial implementation

## Overview

The Contractor Vetting System is a comprehensive evaluation and documentation management system for contractor qualification within the Safety discipline (02400). This system provides a structured approach to contractor evaluation with multi-section analysis, AI-powered document processing, and integrated chat assistance.

## System Architecture

### Component Structure

```
client/src/pages/02400-safety/02400-contractor-vetting/
├── index.js
├── README.md
├── components/
│   ├── 02400-contractor-vetting-page.js
│   └── css/
│       └── 02400-contractor-vetting.css
```

### Key Features

1. **Multi-Section Evaluation**: Details, Financial, Licensing, Performance, Safety, Compliance, Employees, Pre-Qualification, Agreements
2. **Document Management**: Upload and process documents for each section
3. **AI Analysis**: Automated document analysis and scoring
4. **Chat Assistance**: Interactive chatbot for guidance and support
5. **Dashboard Statistics**: Real-time monitoring of vetting progress
6. **Results Tracking**: Comprehensive evaluation results with scoring

## Implementation Details

### Resolved Implementation Issues
**1. Trigger Name Conflicts**  
Created unique trigger names for each SQL file to prevent conflicts:
- `update_contractor_vetting_updated_at_column` (main tables)
- `update_contractor_vetting_documents_updated_at_column` (documents)
- `update_contractor_vetting_storage_updated_at_column` (storage)
- `update_contractor_vetting_record_manager_updated_at_column` (record manager)

**2. Constraint Violations**  
- Fixed sample data NULL field issues
- Added proper examples in SQL comments
- Enhanced NOT NULL validations

**3. Sequence Grants**  
- Removed invalid grants for UUID-based tables
- Maintained grants for SERIAL sequences
- Added proper sequence ownership

### React Component

The main component (`02400-contractor-vetting-page.js`) follows the Simpler Page Implementation Guide pattern:

- Uses Bootstrap React components for UI
- Integrates with the Accordion system
- Includes proper settings manager initialization
- Implements standard logout button
- No background image (utility page)

### Database Schema

The system uses the following tables:

- `contractor_vetting` - Main vetting records
- `contractor_vetting_sections` - Individual vetting sections
- `a_02400_contractor_vetting_documents` - Document metadata
- `a_02400_contractor_vetting_document_versions` - Document version history
- `a_02400_contractor_vetting_data` - Contractor-specific metadata
- `contractor_evaluation_results` - Evaluation results for display
- `contractor_vetting_chat_messages` - Chat conversation history

### Storage Integration

Documents are stored in the `contractor-vetting` Supabase storage bucket with the following path structure:

```
/documents/project_{projectId}/phase_{phaseId}/contractor_vetting/{vettingId}/{sectionName}/{year}/{month}/{userId}/{filename}
```

## Pathing Convention

The system follows the 1300_00220_DOCUMENT_MANAGEMENT_IMPLEMENTATION_PLAN pathing rules, ensuring consistency with other document management systems in the project.

## Security Model

- Row Level Security (RLS) policies enforce data isolation
- Storage policies restrict access to user-owned documents
- All database operations require authenticated users
- Proper audit logging for all document operations

## HSSE Questionnaire Document Processing Integration

### Page 01300 Document Processing Flow
**Integration Status:** ✅ FULLY INTEGRATED

The Contractor Vetting System includes complete integration with the HSSE Questionnaire document processing workflow:

**Processing Workflow:**
1. **Navigate to Page 01300**: Governance document upload page
2. **Select Safety Discipline**: Choose "Safety" (code: 02400) from discipline dropdown
3. **Choose Document Type**: Select "HSSE Questionnaire" type
4. **Select Conversion Mode**: Choose "Questionnaire" mode (not "Simple")
5. **Upload Excel File**: HSE evaluation template in .xlsx or .xls format
6. **Automatic Processing**: System routes to ExcelLoaderService + HSSE prompt processing
7. **Form Generation**: Creates standardized HSE questionnaire (GPCHSEQS24001 format)
8. **Integration**: Form available in contractor vetting workflow
9. **Result Storage**: Evaluation results stored for reviewer access

**Technical Integration Details:**

**Frontend Integration:**
- Document upload modal (`01300-document-upload-modal.js`)
- Discipline selection: "Safety" (02400)
- Document type: "HSSE Questionnaire"
- Conversion mode: "Questionnaire" (fixed format, no field behavior configuration)
- HSSE prompt fetch: UUID `9430fe84-b564-4783-a214-177f78d690fb`

**Backend Integration:**
- Process route: `/api/process` endpoint
- File detection: Excel files → ExcelLoaderService
- Content processing: LangChain with HSSE-specific questionnaire prompt
- Output format: Fixed-structure HSE evaluation form

**Service Architecture:**
- **ExcelLoaderService**: Converts Excel → structured LangChain documents
- **LangChainProcessingService**: Applies HSSE questionnaire prompt
- **Form Generation**: Creates GPCHSEQS24001 compliant evaluation questionnaires
- **Result Storage**: `contractor_evaluation_results` table

**Questionnaire Mode Differences:**
- **Standard Mode**: Configurable field behaviors (read-only/editable/AI-generated)
- **Questionnaire Mode**: Fixed HSE evaluation format for standardized assessments

## Integration Points

### 1. Accordion Navigation

The contractor vetting page is accessible through the Safety section accordion navigation. The link should be added to the server-side template in `server/src/routes/accordion-sections-routes.js`.

### 2. Document Control System

The system integrates with the existing 00900 document control framework, using the same table structure and conventions.

### 3. Storage System

Documents are stored using the standardized Supabase storage approach with proper bucket configuration and RLS policies.

### 4. HSSE Questionnaire Processing (Page 01300)

Complete integration with Excel-based HSE evaluation template processing:
- Excel template upload via 01300 modal
- ExcelLoaderService structured parsing
- HSSE-specific LangChain prompt processing
- Fixed-format questionnaire generation
- Direct integration with contractor vetting results

## Usage Workflow

### 1. Access the System

Navigate to the Contractor Vetting page through the Safety section in the accordion navigation.

### 2. Enter Contractor Details

Start by entering basic contractor information in the Details section. This unlocks the other sections.

### 3. Upload Documents

For each section, upload relevant documents:

- Financial Information
- Licensing and Certifications
- Past Performance & References
- Health and Safety Documentation
- Registration and Legal Compliance
- Employee Details
- Pre-Qualification Information
- Agreements and Contracts

### 4. Analyze Documents

Use the "Analyze" buttons to process documents with AI assistance. The system will provide scores and commentary.

### 5. Chat Assistance

Interact with the Vetting Assistant chatbot for guidance and support throughout the process.

### 6. Review Results

Monitor evaluation results in the results table and dashboard statistics.

## Customization

### Adding New Sections

To add new evaluation sections:

1. Update the `tabSections` array in the React component
2. Add corresponding database table entries
3. Update the storage path generation function
4. Modify the UI to include the new section

### Modifying Scoring

The scoring algorithm can be customized by modifying:

1. The analysis functions in the React component
2. The database triggers for automatic scoring
3. The AI analysis service integration

## Troubleshooting

### Common Issues

1. **Document Upload Failures**: Check file size limits and supported formats
2. **AI Analysis Errors**: Verify API connectivity and service availability
3. **Storage Access Issues**: Confirm RLS policies and user authentication
4. **Database Connection Errors**: Check connection strings and permissions

### Debugging Steps

1. Check browser console for JavaScript errors
2. Verify network requests in browser developer tools
3. Review database logs for query errors
4. Test storage access with direct API calls

## Performance Considerations

- Optimize database queries with proper indexing
- Implement pagination for large result sets
- Use efficient storage path structures
- Cache frequently accessed data

## Future Enhancements

1. **Advanced AI Analysis**: More sophisticated document processing
2. **Automated Workflows**: Integration with approval processes
3. **Reporting Features**: Enhanced analytics and reporting
4. **Mobile Optimization**: Improved mobile user experience
5. **Integration APIs**: External system integration capabilities

## Related Documentation

- [1300_00220_DOCUMENT_MANAGEMENT_IMPLEMENTATION_PLAN.md](1300_00220_DOCUMENT_MANAGEMENT_IMPLEMENTATION_PLAN.md)
- [0900_DOCUMENT_TABLES_REFERENCE.md](0900_DOCUMENT_TABLES_REFERENCE.md)
- [1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md](1300_0000_SIMPLER_PAGE_IMPLEMENTATION_GUIDE.md)
- [1350_SUPABASE_DOCUMENT_STORE_BYPASS_IMPLEMENTATION.md](1350_SUPABASE_DOCUMENT_STORE_BYPASS_IMPLEMENTATION.md)

## SQL Files

- `sql/create-contractor-vetting-tables.sql` - Main database schema
- `sql/create-contractor-vetting-documents.sql` - Document management tables
- `sql/create-contractor-vetting-storage.sql` - Storage configuration
- `sql/create-contractor-vetting-record-manager.sql` - Record management integration
- `sql/create-sample-contractors.sql` - Sample data for testing

## Testing

The system includes comprehensive testing for:

- UI component rendering
- Database operations
- Storage integration
- Security policies
- Error handling

## Deployment

To deploy the Contractor Vetting System:

1. Run the SQL schema creation scripts
2. Deploy the React components
3. Configure the accordion navigation link
4. Test all functionality in staging environment
5. Monitor performance and usage metrics
