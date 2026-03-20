# Modal Architecture Design

## Overview
New modular architecture for file handling modals to support:
- Local file uploads
- Cloud storage bulk imports  
- Unstructured data input
- Reuse across disciplines

## Component Structure

```
client/src/components/modals/
├── base/
│   ├── FileModalBase.js
│   ├── DocumentNumberSection.js
│   ├── MetadataCapture.js
│   ├── ProcessingOptions.js
│   └── FilePreview.js
├── LocalFileModal.js
├── CloudUploadModal.js  
├── UnstructuredDataModal.js
└── modalService.js
```

## FileModalBase.js
Core functionality all modals share:
```js
class FileModalBase {
  // Common state
  state = {
    validation: {},
    processingOptions: {},
    metadata: {}
  }

  // Shared methods  
  validateFile()
  generateStoragePath() 
  handleSubmit()
  renderCommonUI()
}
```

## Specialized Modals
Extend base with workflow-specific features:

### LocalFileModal.js
```js
class LocalFileModal extends FileModalBase {
  // Drag/drop handling
  // File type validation
  // Local processing
}
```

### CloudUploadModal.js
```js
class CloudUploadModal extends FileModalBase {
  // Cloud provider auth
  // Bulk selection
  // Async transfer
}
```

### UnstructuredDataModal.js  
```js
class UnstructuredDataModal extends FileModalBase {
  // Text/JSON input
  // Schema validation
  // Format conversion
}
```

## Shared Services

### modalService.js
Factory pattern for modal creation:
```js
createModal(type, config) {
  switch(type) {
    case 'local': return new LocalFileModal(config)
    case 'cloud': return new CloudUploadModal(config)
    case 'unstructured': return new UnstructuredDataModal(config)
  }
}
```

## Migration Plan

1. Phase 1: Extract shared components
2. Phase 2: Implement base modal
3. Phase 3: Create specialized modals  
4. Phase 4: Update calling code to use new system
5. Phase 5: Deprecate old UpsertFileModal

## Backward Compatibility

Temporary adapter will map old props to new system:
```js
// Legacy support
export const UpsertFileModal = (props) => {
  return createModal('local', {
    ...props,
    disciplineCode: '00435' 
  })
}
```

## Updated Audit Standards

New requirements for modal implementations:
- Must extend FileModalBase
- Maximum 500 lines per modal
- Shared state via props
- Discipline config injection
