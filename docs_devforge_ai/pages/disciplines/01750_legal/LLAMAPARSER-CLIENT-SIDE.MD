# 0501 - LlamaParser External Service Integration

## Overview
This documentation covers the LlamaParser external service integration within the Construct AI platform. LlamaParser is used for intelligent PDF and image processing, particularly for financial and contract documents. The implementation includes shared services architecture for cross-module usage.

## Requirements
- LlamaParser API key
- OpenAI API key (fallback processing)
- PDF.js library for PDF text extraction
- Modern web browsers supporting File API

## Implementation

### Shared Services Structure
The LlamaParser functionality has been reorganized into a shared services architecture located at:
```
client/src/common/services/
```

Key shared service files:
- `llamaparser-service.js` - Core LlamaParser API integration
- `financial-processing-utils.js` - Financial data extraction utilities
- `file-processing-service.js` - File handling and conversion utilities
- `storage-service.js` - Storage and spreadsheet integration
- `chat-streaming-service.js` - Real-time processing feedback

### Core Components

#### LlamaParser Service (`llamaparser-service.js`)
``` javascript
// Initialize service
const llamaParser = new LlamaParserService();

// Process file
const result = await llamaParser.processFile(file, {
    metadata: { source: 'financial-module' },
    fallbackToOpenAI: true
});
```

#### Financial Processing Utilities (`financial-processing-utils.js`)
- Table data extraction from structured text
- PDF text extraction with PDF.js integration
- Data validation and formatting utilities
- OpenAI fallback processing for complex documents

#### File Processing Service (`file-processing-service.js`)
- File to base64 conversion
- PDF text extraction with error handling
- File type detection and validation
- Multi-format support (PDF, PNG, JPEG, etc.)

### Usage Examples

#### Basic File Processing
``` javascript
import { LlamaParserService } from '../../common/services/llamaparser-service.js';

const processor = new LlamaParserService();
const result = await processor.processFile(invoiceFile, {
    metadata: { department: 'finance', type: 'invoice' }
});
```

#### React Hook Integration
``` javascript
import { useFinancialAgent } from '../../common/services/financial-processing-utils.js';

const MyFinancialPage = () => {
    const { isProcessing, processInvoiceFromFile } = useFinancialAgent();
    
    const handleFileUpload = async (file) => {
        const result = await processInvoiceFromFile(file, {
            uploadedBy: 'user@email.com',
            timestamp: new Date().toISOString()
        });
        console.log('Processing result:', result);
    };
    
    return (
        <div>
            <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
            {isProcessing && <div>Processing...</div>}
        </div>
    );
};
```

### Multi-Module Integration

#### Financial Module (01200-Finance)
- Automated invoice processing
- Financial data extraction and validation
- Spreadsheet integration for record keeping
- Real-time processing feedback through chatbot

#### Contracts Module (00435-Contracts-Post-Award)
- Contract PDF processing and analysis
- Key terms extraction
- Payment schedule identification
- Risk assessment through AI analysis

### API Integration

#### LlamaParser API Configuration
``` javascript
const llamaparserConfig = {
    baseUrl: 'https://api.llamaparse.com',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data'
    }
};
```

#### OpenAI Fallback Configuration
``` javascript
const openaiConfig = {
    baseUrl: 'https://api.openai.com/v1',
    headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
    }
};
```

### Data Processing Flow

1. **File Upload** - User uploads PDF/image file
2. **LlamaParser Processing** - Primary processing with LlamaParser API
3. **OpenAI Fallback** - If LlamaParser fails, fallback to OpenAI Vision API
4. **Data Extraction** - Extract structured data (invoice number, amount, dates, etc.)
5. **Table Processing** - Extract itemized data and summary totals
6. **Validation** - Validate extracted data against business rules
7. **Storage Integration** - Upload file to storage and append to spreadsheet
8. **Result Return** - Return structured data to calling module

### Best Practices

#### API Key Management
- Store API keys in localStorage with encryption
- Implement key rotation and validation
- Provide user interface for key management
- Handle missing or invalid keys gracefully

#### File Processing
- Always validate file types and sizes
- Implement proper error handling for corrupted files
- Use streaming for large file processing
- Provide real-time feedback during processing

#### Data Validation
- Validate extracted data against expected formats
- Implement business rule validation
- Handle missing or inconsistent data gracefully
- Provide data quality metrics

#### Performance Optimization
- Cache processed results when appropriate
- Implement batch processing for multiple files
- Use web workers for heavy processing tasks
- Optimize PDF text extraction performance

### Troubleshooting

#### Common Issues
1. **API Key Errors** - Verify API key is valid and properly configured
2. **File Processing Failures** - Check file format and size limitations
3. **Extraction Accuracy** - Review extracted data patterns and adjust regex
4. **Performance Issues** - Monitor processing times and optimize as needed

#### Debugging Steps
1. Enable verbose logging in development mode
2. Check network requests in developer tools
3. Verify file processing steps with sample data
4. Test fallback mechanisms with various file types

## Server-Side Integration (New)

In addition to the client-side services, LlamaParser is now standardized for **server-side document structure extraction** in the governance module (01300).

### Server-Side vs Client-Side

| Feature | Client-Side (0501) | Server-Side (1300) |
|---------|-------------------|-------------------|
| **Purpose** | Financial/contract processing | Form structure extraction |
| **Location** | `client/src/common/services/` | `server/src/services/document-processing/` |
| **Modules** | Finance, Contracts | Governance (form creation) |
| **Processing** | Browser-based | Node.js server |
| **Output** | Structured data (invoices, contracts) | HTML forms with field behaviors |
| **Fallback** | OpenAI Vision API | N/A (direct LlamaParser only) |

### Server-Side Implementation

For server-side document structure extraction:
- **Documentation**: See `0501_LLAMAPARSER_SERVER_SIDE.md`
- **Service**: `DocumentStructureExtractionService.js`
- **API**: `/api/document-structure/process`
- **Configuration**: `LLAMAPARSE_API_KEY` in `.env`

The server-side implementation uses LlamaParser for:
- PDF form extraction
- Layout-preserving text extraction
- Table and checkbox detection
- Structured markdown output for LLM processing

Both implementations use the same LlamaParser API but serve different purposes in the platform.

## Status
✅ Production Ready - Fully implemented and tested across multiple modules
✅ Shared Services - Reusable across all Construct AI modules (client-side)
✅ Server-Side Integration - Standardized for document structure extraction
✅ Multi-Format Support - PDF, PNG, JPEG processing
✅ Fallback Processing - LlamaParser → OpenAI automatic fallback (client-side)
✅ Real-time Feedback - Chat streaming integration
✅ Data Validation - Comprehensive validation and error handling

## Related Documentation
- **0501_LLAMAPARSER_SERVER_SIDE.md** - Server-side document structure extraction
- 0500_SUPABASE.md - Database integration
- 0003_DOCUMENT_MANAGEMENT_DOCUMENTATION.md - General file handling
- 0900_DOCUMENT_CHATBOT_IMPLEMENTATION.md - Chat integration
- 0200_LLM_API_KEYS_GUIDE.md - API key management
- 1300_01300_DOCUMENT_STRUCTURE_EXTRACTION_PROMPTS.md - Extraction prompts
