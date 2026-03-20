# Core Components

## Overview

The core components form the foundation of the application's architecture, fully utilizing React components with webpack in a Single-Page Application (SPA) architecture.

## Component Architecture

### React Components

The React-based components are organized in the src/components directory:

```typescript
// Button.tsx
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  onClick,
  children
}) => (
  <button 
    className={styles[variant]} 
    onClick={onClick}
  >
    {children}
  </button>
);
```

### Directory Structure

```
client/src/components/
├── common/               # Shared components
│   ├── Button/
│   │   ├── index.tsx
│   │   └── Button.module.css
│   └── Input/
│       ├── index.tsx
│       └── Input.module.css
├── layout/              # Layout components
│   ├── Header/
│   └── Footer/
└── features/           # Feature-specific components
    ├── Accordion/
    ├── Modal/
    └── Document/       # Document-related components
        ├── DocumentDetailModal/
        ├── DocumentUploadModal/
        └── DocumentAgentsModal/
```

### Component Organization

1. **Common Components**

```typescript
// Common component with TypeScript
import React from 'react';
import styles from './styles.module.css';

interface Props {
  // Type definitions
}

export const Component: React.FC<Props> = (props) => {
  // Implementation
};
```

2. **Feature Components**

```typescript
// Feature-specific component
import React from 'react';
import { useFeatureContext } from '@context/FeatureContext';
import styles from './styles.module.css';

export const FeatureComponent = () => {
  const { state, dispatch } = useFeatureContext();
  // Implementation
};
```

## Best Practices

### 1. Component Design

- Use functional components with hooks
- Implement proper TypeScript types
- Keep components focused and reusable
- Use CSS modules for scoped styling

### 2. State Management

- Use React Context for shared state
- Implement custom hooks for complex logic
- Keep state close to where it's used
- Use reducers for complex state

### 3. Performance

- Implement proper memoization
- Use lazy loading for large components
- Optimize re-renders
- Bundle splitting for code organization

### 4. Testing

- Write unit tests for components
- Test hooks independently
- Implement integration tests
- Use proper testing utilities

### 5. Accessibility

- Implement proper ARIA attributes
- Support keyboard navigation
- Ensure proper focus management
- Handle screen reader announcements

## Document Components

### DocumentDetailModal

**Location:** `client/src/pages/0200-all-documents/components/modals/DocumentDetailModal.js`

**Purpose:** Displays comprehensive document information with viewing and management capabilities.

**Key Features:**
- **View Document**: Opens documents in new browser tabs using `window.open()`
- **Download Document**: Triggers file downloads with proper filename handling
- **Document Metadata**: Displays title, author, version, file type, and other details
- **Action Management**: Version history, sharing, and review request functionality

**Implementation Example:**
```javascript
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

const DocumentDetailModal = ({ modalProps }) => {
  const { document, onClose } = modalProps || {};

  const handleViewDocument = async () => {
    try {
      if (!document || !document.id) {
        alert('No document selected for viewing.');
        return;
      }
      
      const viewUrl = `/api/documents/${document.id}/view`;
      window.open(viewUrl, '_blank');
      
    } catch (error) {
      console.error('Error opening document for viewing:', error);
      alert('Failed to open document for viewing. Please try again.');
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Document Details</DialogTitle>
      <DialogContent>
        {/* Document information display */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary" onClick={handleViewDocument}>
          View Document
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

**UI Components:**
- Material-UI Dialog for modal structure
- Primary "View Document" button (blue/contained style)
- Secondary action buttons (outlined style)
- Responsive grid layout for document information
- Error handling with user-friendly alerts

### DocumentUploadModal

**Location:** `client/src/pages/0200-all-documents/components/modals/DocumentUploadModal.js`

**Purpose:** Handles document uploads with Supabase Storage and Flowise integration.

**Key Features:**
- Multi-format file upload support
- Metadata collection and validation
- Integration with document stores
- Progress tracking and error handling

### DocumentAgentsModal

**Location:** `client/src/pages/0200-all-documents/components/modals/DocumentAgentsModal.js`

**Purpose:** Provides access to AI-powered document analysis tools.

**Key Features:**
- Document summarization
- Content analysis
- Q&A functionality
- Integration with Flowise chatbots

## Related Documentation

- [Document View Functionality](1370_DOCUMENT_VIEW_FUNCTIONALITY.md)
- [All Documents Page Documentation](1300_0200_ALL_DOCUMENTS_PAGE.md)
- [Modal Management](0975_00_MODAL_MANAGEMENT.md)
- [Client JS Architecture](0800_CLIENT_JS.md)
- [CSS Architecture](1400_CSS_ARCHITECTURE.md)
- [Page Implementations](1300_0000_PAGE_IMPLEMENTATIONS.md)
- [System Architecture](0200_SYSTEM_ARCHITECTURE.md)
