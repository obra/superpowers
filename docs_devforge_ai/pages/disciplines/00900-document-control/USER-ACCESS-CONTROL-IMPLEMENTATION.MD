# 0750 User Access Control Implementation

## Overview

This document outlines the implementation of user access control for document uploads and filtering in the Simandou AI Bundle application. The system allows administrators to control which users can access specific documents through a comprehensive permission system.

## Features Implemented

### 1. User Access Control in Upload Modals

#### Components Modified
- **File Upload Modal** (`client/src/pages/00435-contracts-post-award/components/modals/00435-UpsertFileModal.js`)
  - Added UserAccessSelector component
  - Integrated user selection functionality
  - Added access control state management

#### Key Features
- **User Selection Interface**: Sortable, filterable user list with search functionality
- **Department Filtering**: Filter users by department (Admin, HR, Finance, Construction, etc.)
- **Role Filtering**: Filter users by role (Admin, Manager, Supervisor, etc.)
- **Bulk Selection**: Select all users in a department with one click
- **Visual Feedback**: Selected users move to a separate section for easy identification
- **Scalable Design**: Handles thousands of users efficiently with pagination and filtering

### 2. Document Filtering by User Access

#### Components Modified
- **All Documents Page** (`client/src/pages/0200-all-documents/components/all-documents-page.js`)
  - Added Supabase integration for user authentication
  - Implemented document access filtering
  - Added loading states for access control

#### Key Features
- **Access-Based Filtering**: Only shows documents the user has permission to view
- **Real-time Updates**: Automatically updates when permissions change
- **Multiple Access Levels**: Supports direct user access, department access, and role-based access
- **Owner Access**: Users always have access to documents they uploaded
- **Admin Override**: Administrators can see all documents

### 3. Database Schema

#### New Tables Created (`sql/create-document-access-tables.sql`)

1. **document_access**: Individual user access permissions
   - `document_id`: Reference to the document
   - `user_id`: User who has access
   - `access_level`: read, write, admin
   - `granted_by`: User who granted the access
   - `expires_at`: Optional expiration date

2. **document_department_access**: Department-level access permissions
   - `document_id`: Reference to the document
   - `department`: Department name
   - `access_level`: Permission level
   - `granted_by`: User who granted the access

3. **document_role_access**: Role-based access permissions
   - `document_id`: Reference to the document
   - `role`: Role name
   - `access_level`: Permission level
   - `granted_by`: User who granted the access

4. **document_metadata**: Document metadata for access control
   - `document_id`: Unique document identifier
   - `title`, `description`: Document details
   - `uploaded_by`: User who uploaded the document
   - `company_id`, `project_id`: Associated entities
   - `classification`: Security classification level

#### Database Functions

1. **user_has_document_access()**: Checks if a user has access to a specific document
2. **get_user_accessible_documents()**: Returns all documents a user can access

### 4. API Endpoints

#### New Routes (`server/routes/document-access-routes.js`)

1. **POST /api/document-access/grant**: Grant document access to users
2. **GET /api/document-access/check/:documentId/:userId**: Check user access
3. **GET /api/document-access/user/:userId**: Get accessible documents for user
4. **PUT /api/document-access/update**: Update document permissions
5. **DELETE /api/document-access/remove/:documentId**: Remove document access

### 5. User Interface Components

#### UserAccessSelector Component (`client/src/components/user-access/UserAccessSelector.js`)

**Features:**
- **Search Functionality**: Search by name, email, or company
- **Department Filtering**: Filter by 13 different departments
- **Role Filtering**: Filter by 9 different roles
- **Expandable Departments**: Collapsible department sections
- **Bulk Operations**: Select/deselect all users in a department
- **Selected Users Panel**: Visual representation of selected users
- **Real-time Updates**: Immediate feedback on selections

**Props:**
- `selectedUsers`: Array of selected user IDs
- `onSelectionChange`: Callback for selection changes
- `title`: Custom title for the component
- `maxHeight`: Maximum height for scrollable areas
- `showDepartmentFilter`: Toggle department filtering
- `showRoleFilter`: Toggle role filtering

## Implementation Details

### 1. User Selection Flow

1. **Modal Opens**: UserAccessSelector loads all active users from Supabase
2. **User Interaction**: Users can search, filter, and select individuals or departments
3. **Selection Management**: Selected users are tracked in component state
4. **Form Submission**: Selected user IDs are included in upload payload
5. **Server Processing**: Access permissions are created in database

### 2. Document Filtering Flow

1. **Page Load**: Current user session is retrieved from Supabase
2. **Access Query**: Database function returns accessible documents for user
3. **Document Fetch**: All documents are fetched from Flowise API
4. **Filtering**: Documents are filtered based on access permissions
5. **Display**: Only accessible documents are shown to user

### 3. Permission Hierarchy

1. **Owner Access**: Users can always access documents they uploaded
2. **Direct Access**: Explicitly granted user permissions
3. **Department Access**: Access based on user's department
4. **Role Access**: Access based on user's role
5. **Admin Access**: Administrators have access to all documents

### 4. Security Features

- **Row Level Security (RLS)**: Enabled on all access control tables
- **Policy-Based Access**: Supabase policies enforce access rules
- **Audit Logging**: All access grants are logged with timestamps
- **Expiration Support**: Access permissions can have expiration dates
- **Granular Permissions**: Different access levels (read, write, admin)

## Configuration

### Environment Variables Required

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

1. Run the SQL script to create tables:
   ```bash
   psql -f sql/create-document-access-tables.sql
   ```

2. Ensure user_profiles table exists with proper structure
3. Configure RLS policies as needed for your security requirements

## Usage Examples

### 1. Granting Access During Upload

```javascript
// In upload modal
const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add user access control data
  if (showUserAccess && selectedUsers.length > 0) {
    formData.append('userAccess', JSON.stringify({
      selectedUsers,
      accessLevel: 'read',
      grantedBy: currentUserId
    }));
  }
  
  // Submit to server
  await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  });
};
```

### 2. Checking User Access

```javascript
// Check if user can access document
const response = await fetch(`/api/document-access/check/${documentId}/${userId}`);
const { hasAccess } = await response.json();

if (hasAccess) {
  // Show document
} else {
  // Show access denied message
}
```

### 3. Getting User's Accessible Documents

```javascript
// Get all documents user can access
const response = await fetch(`/api/document-access/user/${userId}`);
const { documents } = await response.json();

// Filter UI documents based on access
const accessibleDocIds = new Set(documents.map(doc => doc.document_id));
const filteredDocs = allDocuments.filter(doc => accessibleDocIds.has(doc.id));
```

## Testing

### 1. Unit Tests

- Test UserAccessSelector component functionality
- Test database functions for access control
- Test API endpoints for proper responses

### 2. Integration Tests

- Test complete upload flow with access control
- Test document filtering on all-documents page
- Test permission updates and removals

### 3. Security Tests

- Verify RLS policies prevent unauthorized access
- Test access control with different user roles
- Verify audit logging functionality

## Future Enhancements

### 1. Advanced Features

- **Time-based Access**: Temporary access with automatic expiration
- **Conditional Access**: Access based on document content or metadata
- **Approval Workflows**: Require approval for sensitive document access
- **Access Analytics**: Track document access patterns and usage

### 2. UI Improvements

- **Bulk Permission Management**: Manage permissions for multiple documents
- **Permission Templates**: Pre-defined permission sets for common scenarios
- **Visual Permission Matrix**: Graphical representation of access permissions
- **Mobile Optimization**: Responsive design for mobile devices

### 3. Integration Enhancements

- **Active Directory Integration**: Sync users and roles from AD
- **LDAP Support**: Enterprise directory integration
- **SSO Integration**: Single sign-on with enterprise systems
- **API Rate Limiting**: Prevent abuse of access control APIs

## Troubleshooting

### Common Issues

1. **Users Not Loading**: Check Supabase connection and user_profiles table
2. **Access Denied**: Verify RLS policies and user permissions
3. **Slow Performance**: Add database indexes for large user bases
4. **Permission Conflicts**: Check permission hierarchy and resolution logic

### Debug Commands

```sql
-- Check user permissions for a document
SELECT * FROM user_has_document_access('user_id', 'document_id', 'flowise');

-- Get all accessible documents for a user
SELECT * FROM get_user_accessible_documents('user_id', NULL);

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'document_access';
```

## Conclusion

The user access control implementation provides a comprehensive solution for managing document permissions in the Simandou AI Bundle. It offers granular control over document access while maintaining usability and performance for large user bases.

The system is designed to be scalable, secure, and maintainable, with clear separation of concerns between frontend components, API endpoints, and database logic.
