# 00435 - Contract Setup Modal Documentation

## Overview
The Contract Setup Modal is a React component designed for creating and managing contract records within the Contracts Post-Award system. This modal provides a comprehensive form for setting up new contracts including contract number, title, description, dates, value, and contractor assignment.

## Component Information
- **File Path**: `client/src/pages/00435-contracts-post-award/components/modals/00435-01-ContractSetupModal.js`
- **Component Name**: `ContractSetupModal`
- **Discipline Code**: 00435 (Contracts)
- **Modal ID**: `00435-01-ContractSetupModal`
- **State**: Workspace

## Database Schema
The modal interacts with the contracts-related tables in the database. Based on the system architecture and related components, the relevant table structures include:

```sql
-- Contractors table (referenced by the modal)
ALTER TABLE contractors
ADD COLUMN address TEXT NULL,
ADD COLUMN email TEXT NULL,
ADD COLUMN phone TEXT NULL,
ADD COLUMN contact_person TEXT NULL,
ADD COLUMN project_id UUID NULL;

-- Foreign key constraint for contractors
ALTER TABLE contractors 
ADD CONSTRAINT contractors_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id);
```

The effective schema for the contractors table is:
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
- **Contract Number** (Required): Unique identifier for the contract
- **Contract Title** (Required): Descriptive name of the contract
- **Description**: Detailed description of the contract scope
- **Start Date**: Contract commencement date
- **End Date**: Contract completion date
- **Contract Value**: Financial value of the contract
- **Assigned Contractor**: Dropdown selection of available contractors
- **Project Assignment**: Dropdown selection of associated projects

### 2. Validation
- Required field validation for contract number and title
- Date validation (end date must be after start date)
- Numeric validation for contract value
- Real-time error feedback

### 3. Contractor Assignment
- Dropdown populated with contractors from the database
- Option to create new contractor (links to WorkingContractorDetailsModal)
- Automatic sorting of contractors by name

### 4. Project Assignment
- Dropdown populated with projects from the database
- Option to leave unassigned
- Automatic sorting of projects by name

### 5. Responsive Design
- Grid-based layout that adapts to different screen sizes
- Consistent styling with the Contracts discipline theme
- Clear section organization

## Props

### modalProps
The modal accepts the following properties through `modalProps`:

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `contractData` | Object | Existing contract data for edit mode | No |
| `isEditMode` | Boolean | Flag indicating if modal is in edit mode | No |
| `triggerPage` | String | Page that triggered the modal | No |

### contractData Structure
```javascript
{
  id: number,           // Contract ID (for edit mode)
  contract_number: string, // Unique contract identifier
  title: string,        // Contract title
  description: string,  // Contract description
  start_date: string,   // Start date (YYYY-MM-DD)
  end_date: string,     // End date (YYYY-MM-DD)
  contract_value: number, // Financial value
  contractor_id: number, // Assigned contractor ID
  project_id: string    // Assigned project UUID
}
```

## Usage Examples

### Creating a New Contract
```javascript
// Example modal trigger configuration
const modalConfig = {
  modalId: '00435-01-ContractSetupModal',
  modalProps: {
    isEditMode: false,
    triggerPage: 'contracts-post-award'
  }
};
```

### Editing an Existing Contract
```javascript
// Example modal trigger configuration
const modalConfig = {
  modalId: '00435-01-ContractSetupModal',
  modalProps: {
    isEditMode: true,
    contractData: {
      id: 456,
      contract_number: 'CON-2025-001',
      title: 'Site Construction Works',
      description: 'Complete construction of main building structure',
      start_date: '2025-09-01',
      end_date: '2026-08-31',
      contract_value: 2500000,
      contractor_id: 123,
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
- **Create**: Inserts new contract record
- **Update**: Updates existing contract by ID
- **Read**: Fetches contractors and projects for assignment dropdowns

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
- `WorkingContractorDetailsModal` - Contractor management
- `UpsertFileModal` - File upload functionality
- `UpsertUrlModal` - URL document handling
- Project management components

## Version Information
- **Discipline**: Contracts (00435)
- **Component Type**: Modal
- **State**: Workspace
- **Status**: Production Ready
