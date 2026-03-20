# Vector Isolation Section Implementation Guide

## Overview

The Vector Isolation Section is a reusable React component that provides access control and data isolation for uploaded documents across the application. It allows users to configure privacy settings, workspace assignments, and sharing permissions for vector-embedded documents.

## Component Architecture

### Core Implementation

The enhanced VectorIsolationSection component is located at:
- `client/src/pages/01900-procurement/components/modals/shared/VectorIsolationSection.jsx` (procurement-specific)
- `client/src/common/components/templates/modals/VectorIsolationSection.jsx` (common template)

### Key Features

1. **Access Scope Control**: Private, Team, Shared, Public, and Temporary document access
2. **Discipline Sharing**: Selective sharing with specific disciplines
3. **Workspace Assignment**: Assign documents to personal or team workspaces
4. **Document Type Classification**: Categorize documents by type within disciplines
5. **Auto-cleanup Settings**: Automatic deletion for temporary documents

## API

### Props

```javascript
VectorIsolationSection({
  discipline = '01900',           // Discipline code (e.g., '01900' for Procurement)
  onIsolationChange,              // Callback when settings change
  initialSettings = {},           // Initial isolation settings
  organizationId,                 // Organization context
  showAdvanced = false            // Show advanced options by default
})
```

### Settings Structure

```javascript
{
  accessScope: 'private' | 'team' | 'shared' | 'public' | 'temporary',
  workspaceId: string,
  sharedWithDisciplines: string[],
  autoCleanup: string | null,
  workspaceType: 'personal' | 'team',
  documentType: string
}
```

## Usage Examples

### Basic Implementation

```jsx
import VectorIsolationSection from './shared/VectorIsolationSection.jsx';

<VectorIsolationSection
  discipline="01900"
  onIsolationChange={setIsolationSettings}
  initialSettings={isolationSettings}
  showAdvanced={true}
/>
```

### Common Modal Integration

The component is integrated into various upload modals:

1. **File Upload Modal** (`UpsertFileModal.js`)
2. **URL Import Modal** (`UpsertUrlModal.js`) 
3. **Cloud Import Modal** (`UpsertCloudModal.jsx`)
4. **Unstructured Data Modal** (`UpsertUnstructuredModal.js`)

## Integration Points

### State Management

```javascript
const [isolationSettings, setIsolationSettings] = useState({
  accessScope: 'private',
  workspaceId: '',
  sharedWithDisciplines: [],
  autoCleanup: null,
  workspaceType: 'personal',
  documentType: ''
});
```

### Data Submission

Settings are typically included in API requests:

```javascript
const formData = new FormData();
formData.append('isolation_metadata', JSON.stringify(isolationSettings));
```

## Access Scopes

### Private (`private`)
- Only the uploading user can access
- Recommended for sensitive personal documents

### Team Only (`team`)
- Access restricted to users within the same discipline
- Ideal for internal team collaboration

### Shared (`shared`)
- Selectively share with specific disciplines
- Useful for cross-functional projects

### Public (`public`)
- Available to all disciplines within the organization
- Suitable for general reference documents

### Temporary (`temporary`)
- Documents auto-delete after specified period
- Perfect for quick analysis or short-term projects

## Backend Integration

### Services Used

- `activeEntitiesService` - Load current organization context
- `vectorIsolationService` - Manage workspace operations
- Supabase queries for discipline and document type data

### Database Schema

The component interacts with:
- `organizations` - Organization context
- `disciplines` - Available discipline list
- `document_types` - Discipline-specific document categories
- `workspaces` - User workspace management

## Customization

### Discipline-Specific Configuration

Different disciplines have tailored document types:

```javascript
const disciplineTypes = {
  "00435": [ // Contracts Post-Award
    { id: "contract_variations", name: "Contract Variations", category: "contracts" },
    { id: "payment_certificates", name: "Payment Certificates", category: "financial" }
  ],
  "01900": [ // Procurement
    { id: "supplier_quotations", name: "Supplier Quotations", category: "procurement" },
    { id: "purchase_orders", name: "Purchase Orders", category: "procurement" }
  ]
};
```

### Styling

The component uses inline styles with a consistent design system:
- Black primary color scheme
- Orange accents for interactive elements
- Responsive grid layouts
- Clear visual hierarchy

## Migration Guide

### Updating from Legacy Implementation

If migrating from the old `currentIsolationSettings` prop:

**Before:**
```jsx
<VectorIsolationSection
  currentIsolationSettings={isolationSettings}
/>
```

**After:**
```jsx
<VectorIsolationSection
  initialSettings={isolationSettings}
  showAdvanced={true}
/>
```

## Best Practices

### Performance Optimization

1. **Lazy Loading**: Component loads data only when mounted
2. **State Memoization**: Efficient state updates and change detection
3. **Error Boundary**: Graceful error handling for API failures

### Security Considerations

1. **Organization Context**: Always validate organization boundaries
2. **Discipline Permissions**: Respect discipline-level access controls
3. **Data Sanitization**: Validate all user inputs before processing

## Troubleshooting

### Common Issues

1. **Empty Discipline List**: Ensure organization context is properly set
2. **Workspace Loading Failures**: Check user authentication and permissions
3. **Document Type Mismatch**: Verify discipline code matches available types

### Debug Information

The component logs detailed information to the console:
- `[VectorIsolationSection]` prefix for all component logs
- Initialization and data loading events
- Error states and recovery attempts
