# Inspection Modals Documentation

This document describes the modal components used in the inspection system.

## Overview

The inspection system uses modals for various operations including URL management, PDF processing, and data entry.

## Modal Types

### URL Upload Modal

- Handles single URL uploads
- Supports metadata input
- Validates input fields
- See [Inspection Page Documentation](./1300_2075_INSPECTION_PAGE.md) for details

### PDF Processing Modal

- Handles PDF file uploads
- Extracts text content
- Stores data in Supabase and vector database
- See [PDF Processing Documentation](./1300_2075_INSPECTION_PDF_PROCESSING.md) for details

## Implementation

### Base Modal Structure

```javascript
class BaseModalHandler {
  constructor(modalId) {
    this.modalId = modalId;
    this.modal = document.getElementById(modalId);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // ... event listener setup
  }

  show() {
    this.modal.style.display = "block";
  }

  hide() {
    this.modal.style.display = "none";
  }
}
```

### PDF Upload Modal

The PDF upload modal is located in:
`client/src/pages/2075-inspection/2075-modals/upsert/2075-02-upsert-pdf/components/2075-PdfUploadModal.js`

### Modal Templates

Each modal follows a standard template structure:

```html
<div id="modal-id" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Modal Title</h2>
            <span class="close">&times;</span>
        </div>
        <div class="modal-body">
            <!-- Modal content -->
        </div>
        <div class="modal-footer">
            <!-- Action buttons -->
        </div>
    </div>
</div>
```

## Related Documentation

- [Inspection Page](./1300_2075_INSPECTION_PAGE.md)
- [PDF Processing](./1300_2075_INSPECTION_PDF_PROCESSING.md)
- [Database Schema](./0300_DATABASE_SCHEMA.md)
