# 00435 - Working Contractor Details Modal Documentation

## Overview
The Working Contractor Details Modal is a React component primarily designed for entering new contractor details within the Contracts Post-Award system, while also supporting editing of existing contractor information. This modal provides a comprehensive form for managing contractor details including contact information, address, and project assignments.

## Component Information
- **File Path**: `client/src/pages/00435-contracts-post-award/components/modals/00435-01-WorkingContractorDetailsModal.js`
- **Component Name**: `WorkingContractorDetailsModal`
- **Discipline Code**: 00435 (Contracts)
- **Modal ID**: `working-contractor-details-modal`

## Database Schema
The modal interacts with the `public.contractors` table. Based on the migrations in the codebase, the table schema includes:

```sql
-- Base contractors table (created elsewhere in the codebase)
-- Enhanced with additional fields via migrations

ALTER TABLE contractors
ADD COLUMN address TEXT NULL,
ADD COLUMN email TEXT NULL,
ADD COLUMN phone TEXT NULL,
ADD COLUMN contact_person TEXT NULL,
ADD COLUMN project_id UUID NULL;

-- Foreign key constraint (added via migration)
ALTER TABLE contractors 
ADD CONSTRAINT contractors_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id);
```

The full effective schema for the contractors table is:
```sql
CREATE TABLE public.contractors (
  id serial not null,
  name character varying(255) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  address text null,
  email text null,
  phone text null,
  contact_person text null,
  project_id uuid null,
  constraint contractors_pkey primary key (id),
  constraint contractors_project_id_fkey foreign KEY (project_id) references projects (id)
) TABLESPACE pg_default;
```

## Features

### 1. Form Fields
- **Contractor Name** (Required): Text input for the contractor's business name
- **Contact Person**: Text input for the primary contact person's name
- **Address**: Text area for the contractor's physical address
- **Email**: Email input with validation
- **Phone**: Text input for phone number
- **Assigned Project**: Dropdown selection of available projects

### 2. Validation
- Required field validation for contractor name
- Email format validation
- Real-time error feedback

### 3. Project Assignment
- Dropdown populated with projects from the database
- Option to leave unassigned
- Automatic sorting of projects by name

### 4. Responsive Design
- Grid-based layout that adapts to different screen sizes
- Consistent styling with the Contracts discipline theme
- Clear section organization

## Props

### modalProps
The modal accepts the following properties through `modalProps`:

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `contractorData` | Object | Existing contractor data for edit mode | No |
| `isEditMode` | Boolean | Flag indicating if modal is in edit mode | No |
| `triggerPage` | String | Page that triggered the modal | No |

### contractorData Structure
```javascript
{
  id: number,           // Contractor ID (for edit mode)
  name: string,         // Contractor name
  address: string,      // Physical address
  email: string,        // Contact email
  phone: string,        // Phone number
  contact_person: string, // Primary contact person
  project_id: string    // Assigned project UUID
}
```

## Usage Examples

### Creating a New Contractor
```javascript
// Example modal trigger configuration
const modalConfig = {
  modalId: 'working-contractor-details-modal',
  modalProps: {
    isEditMode: false,
    triggerPage: 'contracts-post-award'
  }
};
```

### Editing an Existing Contractor
```javascript
// Example modal trigger configuration
const modalConfig = {
  modalId: 'working-contractor-details-modal',
  modalProps: {
    isEditMode: true,
    contractorData: {
      id: 123,
      name: 'ABC Construction Ltd',
      address: '123 Main Street, Cityville',
      email: 'contact@abcconstruction.com',
      phone: '+1234567890',
      contact_person: 'John Smith',
      project_id: '550e8400-e29b-41d4-a716-446655440000'
    },
    triggerPage: 'contracts-post-award'
  }
};
```

## Styling
The modal follows the Contracts discipline theme with the following color scheme:
- **Primary**: Black (#000000)
- **Secondary**: Alice Blue (#F0F8FF)
- **Accent**: Orange (#FF8C00)
- **Success**: Green (#155724)
- **Danger**: Red (#721c24)
- **Warning**: Yellow (#856404)

## Database Integration
The modal uses Supabase client for database operations:
- **Create**: Inserts new contractor record
- **Update**: Updates existing contractor by ID
- **Read**: Fetches projects for assignment dropdown

## Error Handling
- Database connection errors
- Form validation errors
- API response errors
- User-friendly error messages

## Success Feedback
- Confirmation messages for successful operations
- Automatic modal close after 1.5 seconds
- Visual success indicators

## Dependencies
- `@components/modal/components/00170-Modal`
- `@components/modal/hooks/00170-useModal`
- `@common/js/auth/00175-supabase-client.js`

## Related Components
- `UpsertFileModal` - File upload functionality
- `UpsertUrlModal` - URL document handling
- Project management components

## Version Information
- **Discipline**: Contracts (00435)
- **Component Type**: Modal
- **Status**: Production Ready
