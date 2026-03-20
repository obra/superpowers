# PDF Processing for Inspections

This document describes the PDF processing utilities used to extract text from inspection reports and store them in the system.

## Overview

The system includes utilities for processing PDF inspection reports, extracting their text content, and storing the data in both Supabase and a vector database for search capabilities.

## Components

### extract_text.py

A Python utility that extracts text from PDF files. It can process a single PDF file.

#### Usage

Single file processing:

```bash
python extract_text.py path/to/file.pdf
```

Batch processing (all PDFs in uploads/):

```bash
python extract_text.py
```

#### Output

The script:

1. Extracts text and metadata from PDFs
2. Saves individual JSON files in parsed_results/
3. Returns results in a format compatible with process-pdfs.js

Example output JSON structure:

```json
{
  "success": true,
  "text": "extracted text content including OCR'd image text...",
  "metadata": {
    "total_segments": 5,
    "image_count": 2,
    "has_images": true,
    "file_metadata": {
      "page_label": "1",
      "file_name": "example.pdf"
    }
  },
  "output_path": "parsed_results/example.pdf.json"
}
```

### Image Processing Capabilities

The PDF processing system includes automatic image handling:

- Automatically detects embedded images in PDFs
- Uses OCR (Optical Character Recognition) to extract text from images
- Processes images in "auto" mode to determine when OCR is needed
- Combines both regular PDF text and OCR'd image text
- Provides metadata about image content and processing
- Supports English language OCR by default

The system will automatically:

1. Detect when a PDF contains images
2. Extract text from those images using OCR
3. Combine the OCR'd text with regular PDF text
4. Include image processing metadata in the output

### process-pdfs.js

A Node.js script that:

1. Uses extract_text.py to extract text from PDFs
2. Stores the extracted text in Supabase
3. Indexes the content in a vector database for search capabilities

#### Usage

```bash
node process-pdfs.js
```

#### Data Structure

The script creates inspection records in Supabase with the following structure:

```json
{
  "id": "inspection_[timestamp]_[random]",
  "inspection_date": "ISO timestamp",
  "inspector_name": "System Import",
  "inspection_type": "Fault Report",
  "location": "Extracted from filename",
  "status": "Imported",
  "findings": "Extracted text content",
  "recommendations": "",
  "company": "System Import",
  "project": "PDF Import",
  "contract_type": "System",
  "attachments": "[{\"path\": \"path/to/original.pdf\"}]",
  "metadata": {
    "original_filename": "original filename",
    "import_date": "ISO timestamp",
    "total_segments": 1,
    "image_count": 0,
    "file_metadata": {},
    "has_images": false
  },
  "source_id_key": "Same as id",
  "category": "inspection",
  "processing_status": "pending"
}
```

## Integration Flow

1. PDF files are placed in the uploads/ directory
2. extract_text.py processes the PDFs and extracts text content
3. process-pdfs.js:
   - Takes the extracted text
   - Creates inspection records in Supabase
   - Indexes content in the vector database
4. The content becomes searchable through the inspection interface

## Related Documentation

- [Inspection Page Master Guide](./1300_02075_MASTER_GUIDE.md)
- [Inspection Page Implementation](./1300_02075_INSPECTION_PAGE.md)
- [Inspection Modals](./0975_02075_INSPECTION_MODALS.md)
- [Database Schema](./0300_DATABASE_SCHEMA.md)
- [Supabase Integration](./0500_SUPABASE.md)

## File Organization

The PDF processing utilities are organized in a dedicated utilities directory:

```
/utils
  /pdf-processing
    /python
      extract_text.py
    /node
      process-pdfs.js
    /scripts
      run_extract.sh
```

## Environment Configuration

Required environment variables:

- SUPABASE_URL - The URL of your Supabase instance
- SUPABASE_SERVICE_KEY - Service role key for Supabase (required for data insertion)
- LLAMA_CLOUD_API_KEY - API key for llama_index cloud services
- FLOWISE_API_HOST - Host URL for vector database (for search capabilities)
- FLOWISE_API_KEY - API key for vector database access

Note: The service role key (SUPABASE_SERVICE_KEY) is required instead of the anon key because the script needs elevated permissions to insert data into the inspection tables.

## Error Handling

The utilities include comprehensive error handling:

### Python Script (extract_text.py)

- Validates PDF file existence and readability
- Handles OCR failures gracefully
- Reports detailed extraction errors
- Creates consistent JSON output even in error cases

### Node.js Script (process-pdfs.js)

- Validates environment variables
- Handles Python script execution errors
- Manages Supabase connection issues
- Provides detailed upload error information
- Handles vector database indexing failures
- Reports processing status for each file

All errors are logged with:

- Detailed error messages
- Stack traces where relevant
- HTTP response details for API errors
- File processing status updates

The error information is structured for:

- Easy debugging
- Frontend error display
- Automated error monitoring
- Process recovery

## Monitoring and Logging

The processing system provides detailed logs:

- Python script extraction progress
- Supabase upload status
- Vector database indexing results
- File-by-file processing status
- Overall batch processing summary

Logs include:

- Timestamps
- File identifiers
- Processing stages
- Success/failure status
- Error details when relevant
