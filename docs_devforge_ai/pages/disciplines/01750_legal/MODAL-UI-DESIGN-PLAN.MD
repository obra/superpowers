# 🎨 **MODAL UI LAYOUTS & INTERACTION PATTERNS DESIGN**

This document outlines the specific UI layouts and interaction patterns for each modal type, following the existing design system and department-aware architecture.

## 🏗️ **MODAL ARCHITECTURE OVERVIEW**

### **Common Design System**
Based on your existing modals, the design will adhere to:
- **Color Scheme**: Department-specific colors (e.g., Inspection: #FF8C00, Safety: #FFDAB9)
- **Typography**: Consistent font sizes (e.g., 0.8rem for labels) and spacing
- **Layout**: Standard Header → Content → Footer pattern for all modals
- **Interactions**: Emphasis on progressive disclosure and real-time feedback

---

## 📄 **1. UpsertFileModal (Local Files)**

This modal is designed for uploading local files from the user's computer.

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│ 📄 Upload Local Files - [Department Name]               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  📁 Drop files here or click to browse             │ │
│ │                                                     │ │
│ │  Supports: PDF, DOCX, TXT, CSV, JSON, XLSX, PPTX   │ │
│ │  Max size: 50MB per file                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Selected Files:                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📄 document.pdf (2.3 MB) ✓ Valid      [×] Remove   │ │
│ │ 📊 data.xlsx (1.1 MB) ✓ Valid         [×] Remove   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Document Details:                                       │
│ Title: [Auto-filled from filename        ] [🔄 Detect] │
│ Description: [Optional description...                 ] │
│ Tags: [#contract] [#legal] [+ Add tag]                 │
│                                                         │
│ Processing Options:                                     │
│ ☑ Enable AI search (create embeddings)                 │
│ ☑ Extract metadata automatically                       │
│ ☐ Notify team members                                  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍 Preview: document.pdf                           │ │
│ │ Type: PDF Document                                  │ │
│ │ Pages: 15                                          │ │
│ │ Text extractable: ✓ Yes                           │ │
│ │ Department: Inspection (auto-detected)             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel] [Upload & Process] │
└─────────────────────────────────────────────────────────┘
```

### **Interaction Patterns**

-   **File Selection**: A large, intuitive drag-and-drop zone will be provided. Users can also click to open a standard file browser.
-   **Real-time Validation**: As files are added, they will be immediately validated for type and size. Visual indicators (e.g., green checkmark for valid, red 'X' for invalid) will provide instant feedback.
-   **Auto-Detection & Pre-population**: The modal will attempt to automatically extract a title from the filename. For supported document types, a preview panel will display key information (e.g., PDF page count, text extractability).
-   **Batch Handling**: Users can select multiple files. Each file will appear in a "Selected Files" list with individual remove buttons.
-   **Processing Options**: Checkboxes will allow users to control whether AI search is enabled, metadata is extracted, or notifications are sent.
-   **Dynamic Fields**: Depending on the detected file type, additional relevant fields might appear (e.g., for CSV, options for delimiter).

---

## 🌐 **2. UpsertUrlModal (Web Content)**

This modal is designed for processing documents available via a URL.

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│ 🌐 Upload from URL - [Department Name]                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ URL Input:                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ https://example.com/document.pdf            [🔍 Go] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍 URL Analysis                                     │ │
│ │ Status: ✓ Accessible                               │ │
│ │ Content-Type: application/pdf                      │ │
│ │ Size: 2.3 MB                                       │ │
│ │ Last-Modified: 2025-06-28                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Content Preview:                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📄 Contract Amendment #5                           │ │
│ │ Domain: contracts.company.com                       │ │
│ │ Title: "Amendment to Master Service Agreement"     │ │
│ │ Description: "This amendment modifies the..."      │ │
│ │                                          [📖 More] │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Document Details:                                       │
│ Title: [Amendment to Master Service Agreement        ] │
│ Description: [Auto-extracted from meta tags...       ] │
│ Source URL: [https://example.com/document.pdf        ] │
│                                                         │
│ Processing Options:                                     │
│ ☑ Download and store locally                           │
│ ☑ Monitor for updates                                  │
│ ☑ Extract all linked documents                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel] [Process URL]     │
└─────────────────────────────────────────────────────────┘
```

### **Interaction Patterns**

-   **URL Input & Validation**: A text input field for the URL with real-time validation (e.g., checking for `http://` or `https://` prefix). A "Go" button will trigger URL analysis.
-   **URL Analysis Panel**: After entering a URL, an analysis panel will display information like accessibility status, content type, size, and last modified date.
-   **Smart Extraction**: The modal will attempt to auto-populate the title and description fields from the URL's metadata (e.g., `<title>` tag, Open Graph properties).
-   **Processing Options**: Checkboxes will allow users to decide whether to download and store the content locally, monitor the URL for future updates, or extract linked documents.
-   **Progress Tracking**: A progress bar or status message will indicate the fetching and processing status of the URL content.

---

## ☁️ **3. UpsertCloudModal (Cloud Services)**

This modal is designed for importing documents directly from cloud storage providers.

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│ ☁️ Upload from Cloud - [Department Name]                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Cloud Service Selection:                                │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│ │ 📁  │ │ 📊  │ │ 📘  │ │ 📦  │ │ 🔗  │                │
│ │Drive│ │Sheet│ │OneDr│ │Drop │ │Share│                │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔐 Google Drive Authentication                      │ │
│ │ Status: ✓ Connected as user@company.com            │ │
│ │                                    [🔄 Reconnect]  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ File Browser:                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📁 / Shared drives / Legal Documents               │ │
│ │ ├── 📄 Contract_Template_v2.docx        2.1 MB ☐  │ │
│ │ ├── 📊 Budget_Analysis_Q4.xlsx          1.8 MB ☑  │ │
│ │ ├── 📁 Archive/                                    │ │
│ │ ├── 📄 Policy_Manual_2025.pdf           5.2 MB ☑  │ │
│ │ └── 📋 Meeting_Notes.txt                 0.1 MB ☐  │ │
│ │                                                     │ │
│ │ Selected: 2 files (7.0 MB total)                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Sync Options:                                           │
│ ○ One-time import                                       │
│ ● Continuous sync (monitor for changes)                │
│ ○ Scheduled sync (daily/weekly)                        │
│                                                         │
│ Processing Options:                                     │
│ ☑ Maintain folder structure                            │
│ ☑ Preserve sharing permissions                         │
│ ☐ Import comments and revision history                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                              [Cancel] [Import Selected] │
└─────────────────────────────────────────────────────────┘
```

### **Interaction Patterns**

-   **Service Selection**: A row of clickable icons will allow users to select their cloud storage provider (e.g., Google Drive, Google Sheets, OneDrive, Dropbox, SharePoint).
-   **Authentication Flow**: Upon selecting a service, an OAuth flow will initiate if the user is not already authenticated. A status indicator will show the connection status.
-   **Integrated File Browser**: A file browser interface will allow users to navigate their cloud storage, view files and folders, and select documents. Checkboxes next to each file will enable multi-selection.
-   **Batch Selection Summary**: A summary will display the number of selected files and their total size.
-   **Sync Options**: Radio buttons will allow users to choose between a one-time import, continuous synchronization (monitoring for changes), or scheduled synchronization.
-   **Processing Options**: Checkboxes will provide options like maintaining folder structure, preserving sharing permissions, or importing comments/revision history.
-   **Progress Monitoring**: A progress bar and status messages will track the import process, especially for large batches.

---

## ⚙️ **4. UpsertUnstructuredModal (Advanced/Bulk)**

This modal is designed for advanced users or bulk processing scenarios, offering more control over the upload and processing.

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Advanced Upload - [Department Name]                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Upload Method:                                          │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                        │
│ │ 📁  │ │ 🔄  │ │ 📦  │ │ 🔧  │                        │
│ │Bulk │ │Batch│ │ Zip │ │API  │                        │
│ └─────┘ └─────┘ └─────┘ └─────┘                        │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📁 Bulk File Upload                                 │ │
│ │ Drop multiple files or entire folders here          │ │
│ │                                                     │ │
│ │ Supported: All file types, archives, folders       │ │
│ │ Max total: 500MB, Max files: 100                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Processing Queue: (15 files)                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✓ document1.pdf          Completed    [📊 Details] │ │
│ │ 🔄 spreadsheet.xlsx      Processing... [⏸ Pause]   │ │
│ │ ⏳ presentation.pptx     Queued       [❌ Remove]  │ │
│ │ ❌ corrupted.file        Failed       [🔄 Retry]   │ │
│ │ ... (11 more files)                   [📋 View All]│ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Batch Configuration:                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Default Title Pattern: [${filename}]               │ │
│ │ Description Template: [Bulk upload from ${date}]   │ │
│ │ Auto-tag with: [#bulk-import] [#${department}]     │ │
│ │                                                     │ │
│ │ Processing Settings:                                │ │
│ │ ☑ Skip duplicates (by file hash)                   │ │
│ │ ☑ Create embeddings for all files                  │ │
│ │ ☑ Extract metadata automatically                   │ │
│ │ ☐ Send notification when complete                  │ │
│ │                                                     │ │
│ │ Error Handling:                                     │
│ │ ○ Stop on first error                              │ │
│ │ ● Continue processing, log errors                  │ │
│ │ ○ Retry failed files automatically                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Progress: 3/15 files (20%) ████▒▒▒▒▒▒▒▒▒▒▒▒ [⏸][❌]    │
│                              [Cancel] [Start Processing]│
└─────────────────────────────────────────────────────────┘
```

### **Interaction Patterns**

-   **Upload Method Selection**: A set of buttons or tabs will allow users to choose between different advanced upload methods (e.g., "Bulk File Upload", "Batch Processing", "Zip Archive Upload", "API Integration").
-   **Bulk File/Folder Drop Zone**: A large drop zone for multiple files or entire folders.
-   **Processing Queue**: A dynamic list displaying the status of each file in the batch (queued, processing, completed, failed). Each item will have controls for pausing, removing, retrying, or viewing details.
-   **Batch Configuration**: This section will offer advanced settings applicable to the entire batch:
    -   **Default Title/Description Patterns**: Use placeholders like `${filename}`, `${date}`, `${department}`.
    -   **Auto-tagging**: Automatically apply tags based on department or upload method.
    -   **Processing Settings**: Checkboxes for skipping duplicates, enabling AI search, and metadata extraction.
    -   **Error Handling**: Radio buttons to define behavior on errors (stop, continue, retry).
-   **Overall Progress Bar**: A single progress bar will show the overall completion of the batch, with pause and cancel buttons.

---

## 🎯 **METADATA CAPTURE & MANAGEMENT**

Metadata is crucial for effective document search, categorization, and governance. The modals will capture a blend of common and department/discipline-specific metadata.

### **Common Metadata Fields (Across All Modals)**

These fields will be present in all modal types, either auto-extracted or manually input by the user. They are essential for core document management and search.

1.  **`title` (Text)**:
    *   **Source**: Auto-extracted from filename (for files), URL meta tags (for URLs), or cloud service metadata.
    *   **User Input**: Editable by the user.
    *   **Purpose**: Primary display name for the document.

2.  **`description` (Textarea)**:
    *   **Source**: Auto-extracted from URL meta tags or cloud service metadata.
    *   **User Input**: Optional, multi-line text field for a brief summary.
    *   **Purpose**: Provides more context for search and display.

3.  **`tags` (Multi-select/Text Input)**:
    *   **Source**: Manual user input, or auto-generated based on department/file type (e.g., `#bulk-import`).
    *   **User Input**: Allows users to add relevant keywords.
    *   **Purpose**: Enhances searchability and categorization.

4.  **`source_url` (Text)**:
    *   **Source**: Auto-captured for `UpsertUrlModal` and `UpsertCloudModal`. Not applicable for `UpsertFileModal`.
    *   **User Input**: Read-only for URL/Cloud modals.
    *   **Purpose**: Links back to the original source of the document.

5.  **`original_filename` (Text)**:
    *   **Source**: Auto-captured from the uploaded file.
    *   **User Input**: Read-only.
    *   **Purpose**: Preserves the original name of the file.

6.  **`mime_type` (Text)**:
    *   **Source**: Auto-detected from the uploaded file or URL content.
    *   **User Input**: Read-only.
    *   **Purpose**: Identifies the file format.

7.  **`file_size` (Number)**:
    *   **Source**: Auto-detected from the uploaded file or URL content.
    *   **User Input**: Read-only.
    *   **Purpose**: Provides information about document size.

8.  **`uploaded_by` (System/Text)**:
    *   **Source**: Automatically captured from the authenticated user.
    *   **User Input**: Read-only.
    *   **Purpose**: Audit trail and accountability.

9.  **`uploaded_at` (Timestamp)**:
    *   **Source**: Automatically captured at the time of upload.
    *   **User Input**: Read-only.
    *   **Purpose**: Audit trail and chronological tracking.

### **Department/Discipline-Specific Metadata Fields**

These fields will be dynamically loaded and displayed based on the detected department/discipline (derived from the page prefix or explicit selection). They will be configured via a central metadata schema or database table.

**Example: Inspection Department (`02075`)**

For the Inspection department, specific fields might include:

1.  **`inspection_date` (Date Picker)**:
    *   **Purpose**: Date when the inspection was conducted.
    *   **Validation**: Must be a valid date, not in the future.

2.  **`inspection_type` (Dropdown)**:
    *   **Options**: "Pre-commissioning", "Operational", "Safety Audit", "Environmental Compliance".
    *   **Purpose**: Categorizes the nature of the inspection.

3.  **`inspector_name` (Text)**:
    *   **Purpose**: Name of the inspector(s) who performed the inspection.

4.  **`site_location` (Text/Dropdown)**:
    *   **Purpose**: Specific location or asset where the inspection took place.

5.  **`findings_summary` (Textarea)**:
    *   **Purpose**: Brief summary of key findings or non-conformances.

6.  **`recommendations` (Textarea)**:
    *   **Purpose**: Actions recommended based on inspection findings.

**Example: Contracts Department (`00435`)**

For the Contracts department, specific fields might include:

1.  **`contract_number` (Text)**:
    *   **Purpose**: Unique identifier for the contract.

2.  **`contract_party` (Text)**:
    *   **Purpose**: Name of the other party in the contract.

3.  **`contract_type` (Dropdown)**:
    *   **Options**: "Service Agreement", "Supply Contract", "Construction Contract", "Consultancy Agreement".
    *   **Purpose**: Categorizes the type of contract.

4.  **`effective_date` (Date Picker)**:
    *   **Purpose**: Date when the contract became effective.

5.  **`expiry_date` (Date Picker)**:
    *   **Purpose**: Date when the contract expires.

### **Technical Implementation of Dynamic Metadata**

1.  **Backend Schema**: A database table (e.g., `department_metadata_schemas`) will store JSON schemas for each department's unique metadata fields.
2.  **Frontend Fetching**: When a modal opens, it will fetch the relevant department's metadata schema based on the `pagePrefix` or `department` context.
3.  **Dynamic Form Rendering**: The frontend will use this schema to dynamically render input fields (text, date pickers, dropdowns, textareas) within the modal.
4.  **Data Submission**: All captured metadata (common and specific) will be bundled into the `metadata` JSONB field of the `document_processing_records` table and passed to the `enhanced-embeddings-service`.

This approach ensures that each department can capture the specific information critical to its operations while maintaining a consistent core set of metadata across all documents.

---

## 🎯 **COMMON INTERACTION PATTERNS**

### **Progressive Disclosure**
```javascript
// Smart form that reveals options based on context
const SmartForm = ({ fileType, department }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div className="smart-form">
      {/* Basic fields always visible */}
      <BasicFields />
      
      {/* File-type specific options */}
      {fileType === 'pdf' && <PdfOptions />}
      {fileType === 'spreadsheet' && <SpreadsheetOptions />}
      
      {/* Advanced options on demand */}
      <button onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? '▼' : '▶'} Advanced Options
      </button>
      
      {showAdvanced && <AdvancedOptions department={department} />}
    </div>
  );
};
```

### **Real-time Validation**
```javascript
// Live validation with visual feedback
const ValidationIndicator = ({ status, message }) => {
  const styles = {
    valid: { color: '#155724', backgroundColor: '#d4edda' },
    invalid: { color: '#721c24', backgroundColor: '#f8d7da' },
    checking: { color: '#856404', backgroundColor: '#fff3cd' }
  };
  
  return (
    <div className="validation-indicator" style={styles[status]}>
      {status === 'valid' && '✓'}
      {status === 'invalid' && '❌'}
      {status === 'checking' && '🔄'}
      {message}
    </div>
  );
};
```

### **Processing Status**
```javascript
// Unified status component for all modals
const ProcessingStatus = ({ files, onRetry, onCancel }) => {
  return (
    <div className="processing-status">
      {files.map(file => (
        <div key={file.id} className={`file-status ${file.status}`}>
          <StatusIcon status={file.status} />
          <span className="filename">{file.name}</span>
          <span className="progress">{file.progress}%</span>
          {file.status === 'failed' && (
            <button onClick={() => onRetry(file.id)}>🔄 Retry</button>
          )}
        </div>
      ))}
    </div>
  );
};
```

## 🎨 **VISUAL DESIGN SYSTEM**

### **Color Coding by Department**
```javascript
const departmentThemes = {
  inspection: { primary: '#FF8C00', secondary: '#FFF8DC' },
  safety: { primary: '#FFDAB9', secondary: '#FFF5EE' },
  contracts: { primary: '#4169E1', secondary: '#F0F8FF' },
  engineering: { primary: '#32CD32', secondary: '#F0FFF0' }
};
```

### **Responsive Layout**
- **Desktop**: Full modal with side-by-side panels
- **Tablet**: Stacked layout with collapsible sections
- **Mobile**: Single-column with progressive disclosure
