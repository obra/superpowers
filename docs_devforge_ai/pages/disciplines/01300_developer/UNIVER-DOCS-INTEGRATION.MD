# 0200 ConstructAI Univer Docs Integration

## Overview

The Univer Docs integration provides a powerful document editor that enables users to create, edit, and manage documents within the ConstructAI platform. This replaces basic text input fields with a full-featured word processing environment.

## Current Implementation Status

### ✅ Completed Features
- Basic document editor component (`UniverDocs.jsx`)
- Document editor page with templates (`01300-document-editor-page.js`)
- Route integration (`/01300-document-editor`)
- Template system for common document types (contracts, safety reports, etc.)
- Basic save/export functionality

### 🚧 In Development
- Full Univer Docs API integration (currently using placeholder implementation)
- Document persistence to database
- Advanced formatting controls (bold, italic, font sizes, etc.)
- PDF export functionality
- Word document export
- Collaborative editing features
- Version control for documents

## Component Architecture

### Core Components

#### `UniverDocs.jsx`
Location: `client/src/common/components/univer/UniverDocs.jsx`

**Purpose**: Primary document editor component that wraps the Univer Docs engine.

**Props**:
- `initialContent`: String - Initial document content
- `onContentChange`: Function - Callback fired when content changes

**Current Implementation**: Uses a contenteditable div as a placeholder until full Univers API integration.

#### `DocumentEditorPage.jsx`
Location: `client/src/pages/01300-governance/components/01300-document-editor-page.js`

**Purpose**: Main page component that provides the document editing interface.

**Features**:
- Template selection sidebar
- Save/export functionality
- Document preview area
- Unsaved changes indicator

## Available Templates

The document editor includes pre-built templates for common construction documents:

1. **Construction Contract Template**
   - Complete contract agreement structure
   - Terms and conditions sections
   - Signature placeholders

2. **Safety Inspection Report**
   - PPE checklists
   - Hazard identification sections
   - Action item tracking

3. **Blank Document**
   - Clean starting point for custom documents

## Usage

### Accessing the Document Editor

Navigate to `/01300-document-editor` or access through the governance section.

### Creating a Document

1. Select a template from the sidebar
2. Edit the content in the document editor
3. Click "Save Changes" to preserve your work
4. Use "Export" for basic text file download

### Template Structure

All templates follow a standardized format with placeholders for:
- Headers and subheaders
- Bulleted and numbered lists
- Signature sections
- Date fields

## Package Dependencies

The following Univer packages are already installed in `client/package.json`:

```json
{
  "@univerjs/core": "^0.9.0",
  "@univerjs/design": "^0.9.0",
  "@univerjs/docs": "^0.9.0",
  "@univerjs/docs-ui": "^0.9.0",
  "@univerjs/engine-formula": "^0.9.0",
  "@univerjs/engine-render": "^0.9.0",
  "@univerjs/facade": "^0.5.5",
  "@univerjs/ui": "^0.9.0"
}
```

## Technical Notes

### Current Limitations
1. **Placeholder Implementation**: Currently uses contenteditable rather than full Univers API
2. **Basic Export**: Text-only export functionality
3. **No Persistence**: Documents are not saved to database yet
4. **Limited Formatting**: Basic text formatting only

### Performance Considerations
- Bundle size impact from Univer packages
- Memory usage for large documents
- Rendering performance for complex layouts

### Browser Compatibility
- Modern browsers with contenteditable support
- Full Univers Docs will require ES6+ capable browsers

## Troubleshooting

### Common Issues

**Document Editor Not Loading**
- Check console for Univers package errors
- Verify all dependencies are installed
- Ensure React >= 18.3.1

**Export Functionality Not Working**
- This is currently a placeholder feature
- Text download works, but PDF/DOCX export needs implementation

**Templates Not Appearing**
- Verify templates array in DocumentEditorPage component
- Check for syntax errors in template definitions

## Unified Template & Form Management System Integration

### Overview
The **Unified Template & Form Management System** is architected for seamless integration with the Univer Document system, creating a comprehensive document lifecycle platform. The unified system provides both structured form processing and template workflows that naturally extend to full document editing capabilities once Univer Docs integration is complete.

### Architecture Integration

#### Document-to-Template Conversion Pipeline
**Location**: `client/src/pages/01300-governance/components/templates-forms-management-page.js`

The unified system includes three view modes ready for document expansion:
1. **`🎭 Templates`** - Advanced template management with 3-modal system (Import → Use → Assign)
2. **`📄 Documents`** - Document processing from uploaded files (PDF, DOCX → structured forms)
3. **`📝 Rich Documents (Future)`** - Full document editing with formatting, layouts, and templates

#### Unified Document Workflow State
**State Persistence**: The unified system maintains document context across processing stages:

```javascript
const UnifiedTemplatesFormsPage = () => {
  // Core state for future Document integration
  const [currentView, setCurrentView] = useState('templates'); // 'templates' | 'documents' | 'rich-documents'
  const [documentWorkflow, setDocumentWorkflow] = useState({
    processedDocuments: [],
    templateMappings: {},
    richDocumentRefs: [] // Ready for future rich document integration
  });

  // Future rich document view integration
  const switchToRichDocumentView = () => setCurrentView('rich-documents');

  // Cross-format document operations
  const convertTemplateToDocument = async (template) => {
    // Future: Convert templates to rich documents with formatting
    // Leveraging form structure to create professional documents
  };

  const importDocumentToTemplate = async (documentContent) => {
    // Future: Import rich documents back into template system
    // Extracting structure for form generation
  };
};
```

### Contract Management Enhancement

#### Advanced Contract Lifecycle
**Current**: Basic document processing to forms
**With Rich Documents**: Full contract lifecycle from template to execution

```
Unified Contract Workflow:
1. Document Upload → AI Extraction → Contract Form Structure
2. Form → Template Creation → Rich Document Formatting
3. Template → Rich Contract Document → Signatory Assignment
4. Document → Version Control → Contract Management
```

#### Professional Contract Generation
**Location**: Future component at `00400-contracts/components/rich-contract-editor.jsx`

**Unified Capabilities**:
- **Form Processing**: Upload contract templates → AI extracts clauses and terms
- **Template Enhancement**: Import structured forms as rich document templates
- **Document Styling**: Full formatting with headers, tables, signatures
- **Workflow Integration**: Seamlessly assign to approval and signature workflows

### Safety Documentation Integration

#### Regulatory Compliance Reports
**Current Template System**: Standardized safety report templates
**Enhanced with Rich Documents**: Professional compliance documentation

```
Document Integration Process:
├── Form Processing → Safety Inspection Forms (Checklists, observations)
├── Template Creation → Standardized safety report templates
├── Rich Document → Professional report formatting and layout
├── Multi-modal Content → Text, photos, charts, signatures
└── Regulatory Compliance → Formal documentation submission
```

#### Training Manual Creation
**Unified System Benefits**:
- **Form Extraction**: Process training requirements from safety documents
- **Template Standardization**: Consistent training material structure
- **Rich Document Creation**: Professional training manuals with images and formatting
- **Content Management**: Centralized storage and version control

### Technical Integration Points

#### Document Component Architecture
**Unified Integration Strategy**:
- **State Synchronization**: Workflow state maintained across document types
- **Format Conversion**: Seamless transitions between forms, templates, and documents
- **Content Preservation**: Rich formatting and structure maintained through workflows
- **API Continuity**: Unified API layer for all document operations

#### Data Structure Integration

```json
{
  "unifiedDocumentWorkflow": {
    "id": "document-456",
    "sourceFormat": "pdf",
    "processingStages": [
      {
        "stage": "ai_extraction",
        "type": "form_creation",
        "data": {
          "fields": [],
          "metadata": {}
        }
      },
      {
        "stage": "template_creation",
        "type": "template_import",
        "data": {
          "template_id": "safety-template-1",
          "customizations": {}
        }
      },
      {
        "stage": "document_formatting",
        "type": "rich_document",
        "data": {
          "document_id": "doc-123",
          "formatting": {
            "font_family": "arial",
            "headers": "bold",
            "tables": "formatted"
          }
        }
      }
    ],
    "finalDocuments": [
      {
        "type": "pdf",
        "filename": "safety-report-final.pdf",
        "template_source": "safety-template-1"
      }
    ]
  }
}
```

### User Experience Integration

#### Seamless Document Format Transitions
**Current**: Separate systems for Form Creation and Template Management
**Unified**: Single interface with format switching

**View Modes**:
- **`🎭 Templates`**: Manage reusable document structures and workflows
- **`📄 Documents`**: Process and extract data from unstructured documents
- **`📝 Rich Documents`**: Full document editing with professional formatting

#### Contextual Document Transformations
**Smart Conversions**:
- **Document → Form**: AI extracts structured data from uploaded documents
- **Form → Template**: Convert extracted forms into reusable templates
- **Template → Document**: Generate formatted documents from templates
- **Document → Template**: Import existing rich documents as templates

### Business Value from Document Integration

#### Comprehensive Contract Management
```
Traditional: Manual document review → Manual data entry → Basic templates
Unified: Document upload → AI extraction → Template creation → Professional contracts
```

#### Enhanced Safety Documentation
- **Regulatory Compliance**: Professional, auditable safety documentation
- **Process Standardization**: Consistent safety report formatting across projects
- **Content Enrichment**: Rich formatting, images, and multimedia content
- **Audit Preparation**: Professional documentation ready for regulatory submission

#### Training & Knowledge Management
- **Template Libraries**: Standardized training materials with professional formatting
- **Content Reusability**: Convert existing training documents into templates
- **Professional Presentation**: Rich document formatting for training manuals
- **Version Management**: Centralized control of training content and updates

### Implementation Timeline Integration

#### Phase 1 (Current): Foundation Complete ✅
- Unified template and form management system implemented
- Document processing pipeline established
- Architecture ready for rich document integration

#### Phase 2 (Future): Document Enhancement
- Replace contenteditable with full Univer Docs integration
- Add advanced formatting, headers, tables, and styles
- Enable document-to-template workflow transitions

#### Phase 3 (Future): Professional Document Workflow
- Multi-stage document approval processes
- Integration with signature and legal workflows
- Advanced document analytics and reporting

### Migration Path for Existing Documents

#### Backward Compatibility
- **Form Processing**: Existing document-to-form workflow preserved
- **Templates**: All current templates remain accessible and usable
- **Legacy Processing**: Previous document processing continues to function

#### Future Document Integration
- **Content Migration**: Existing templates can be converted to rich documents
- **Format Preservation**: Document structure and data preserved through conversions
- **Workflow Continuity**: Ongoing processes can incorporate rich document features

### Advanced Document Features Roadmap

#### Rich Formatting and Layout
- **Templates Integration**: Connect template data to rich document layouts
- **Brand Consistency**: Maintain organizational formatting and logos
- **Responsive Design**: Documents that adapt to different display requirements

#### Collaborative Document Editing
- **Multi-user Editing**: Real-time collaboration on document creation
- **Review Workflows**: Integrated approval processes within document editing
- **Version Tracking**: Complete audit trail of document changes

#### Integration with External Systems
- **Legal Integration**: Direct connection to legal document management
- **Signature Integration**: Electronic signature workflows within documents
- **Audit Integration**: Compliance tracking through document lifecycles

## Development Notes

### Adding New Templates
Templates are defined in the `templates` array within `DocumentEditorPage.jsx`:

```javascript
const templates = [
  {
    id: 'template-id',
    title: 'Template Title',
    content: `Template content here...`
  }
];
```

### Customizing Editor Appearance
Editor styling can be modified in the `univer-docs-container` CSS class:

```css
.univer-docs-container {
  width: 100%;
  height: 600px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
```

### Future Template Integration Strategy
When full Univer Docs is integrated, templates will leverage:

```javascript
// Future template-to-document conversion
const convertTemplateToRichDocument = async (templateId) => {
  const template = await templateService.getTemplate(templateId);
  const richDocument = await univerDocs.createDocument({
    template: template,
    formatting: template.formatting || {},
    content: template.content
  });
  return richDocument;
};
```

## version_history

### v1.0.0 (2025-11-20)
- Initial integration with basic document editor component
- Added template system with construction contract and safety inspection templates
- Implemented contenteditable placeholder for rich text editing
- Added `/01300-document-editor` route integration
- Created basic save/export functionality

## Related Documentation

### Core External Services
- **[0200 External Services Master Guide](../0200_EXTERNAL_SERVICES_MASTER_GUIDE.md)** - Complete overview of all external API integrations
- **[0200_UNIVER_SPREADSHEET_INTEGRATION.md](./0200_UNIVER_SPREADSHEET_INTEGRATION.md)** - Spreadsheet integration documentation

### Related Technical Documentation
- **[1300_01300_GOVERNANCE.md](../../pages-disciplines/1300_01300_GOVERNANCE.md)** - Governance page implementations
- **[AGENTS.md](../../../AGENTS.md)** - ConstructAI AI integration standards

## Contact & Support

For questions about the Documents integration:
- **Technical Issues**: Submit issues through the development tracking system
- **Feature Requests**: Create enhancement proposals via the standard process
- **Integration Support**: Contact the external services team
