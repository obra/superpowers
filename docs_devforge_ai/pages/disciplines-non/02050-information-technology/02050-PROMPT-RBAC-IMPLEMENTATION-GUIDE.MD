# Prompt Management RBAC Implementation Guide

This document provides detailed information about the Role-Based Access Control (RBAC) implementation for the Prompt Management system.

## Overview

The Prompt Management system implements RBAC to control access to prompt-related operations based on user roles. This guide covers the roles, permissions, and implementation details.

## Roles and Permissions

### Administrator (admin)
- Full access to all prompt management operations
- Can create, read, update, and delete all prompts
- Can manage prompt categories and templates
- Can assign prompts to users and roles

### Developer (dev)
- Can create, read, update, and delete prompts they own
- Can view shared prompts from other users
- Can manage their own prompt categories
- Cannot delete prompts owned by others

### User (user)
- Can read and use prompts assigned to them
- Can create personal prompts
- Can update their own prompts
- Cannot delete prompts
- Cannot manage prompt categories

### Guest (guest)
- Read-only access to public prompts
- Cannot create or modify prompts

## API Endpoints

### GET /api/prompts
- **Roles**: admin, dev, user, guest
- **Description**: Retrieve prompts based on user permissions
- **Access Control**: Users can only see prompts they have access to

### POST /api/prompts
- **Roles**: admin, dev, user
- **Description**: Create a new prompt
- **Access Control**: Users can create personal prompts

### PUT /api/prompts/:id
- **Roles**: admin, dev, user
- **Description**: Update an existing prompt
- **Access Control**: Users can only update prompts they own or admins can update any

### DELETE /api/prompts/:id
- **Roles**: admin, dev
- **Description**: Delete a prompt
- **Access Control**: Users can only delete prompts they own, admins can delete any

## Implementation Details

### Server-Side Implementation

The RBAC is implemented in the prompts controller (`server/src/controllers/promptsController.js`):

```javascript
// Check user permissions before operations
const checkPromptPermissions = (user, prompt, action) => {
  // Admins can do everything
  if (user.role === 'admin') return true;
  
  // Users can only delete their own prompts
  if (action === 'delete' && user.role === 'user') return false;
  
  // Developers can manage their own prompts
  if (user.role === 'dev' && prompt.owner_id === user.id) return true;
  
  // Users can manage their own prompts
  if (user.role === 'user' && prompt.owner_id === user.id) return true;
  
  // Guests have read-only access
  if (user.role === 'guest' && action === 'read') return true;
  
  return false;
};
```

### Client-Side Implementation

The client-side implementation is in `client/src/pages/02050-information-technology/components/DevSettings/PromptsManagement.jsx`:

```javascript
// Check permissions before rendering UI elements
const canCreatePrompt = user.role === 'admin' || user.role === 'dev' || user.role === 'user';
const canDeletePrompt = user.role === 'admin' || user.role === 'dev';
const canEditAnyPrompt = user.role === 'admin';
```

## Database Schema

The RBAC is supported by the database schema in `sql/01810_prompt_rbac_migration.sql`:

```sql
-- Add role-based columns to prompts table
ALTER TABLE prompts ADD COLUMN owner_id INTEGER REFERENCES users(id);
ALTER TABLE prompts ADD COLUMN visibility TEXT DEFAULT 'private';
ALTER TABLE prompts ADD COLUMN allowed_roles TEXT[];
```

## Usage Examples

### Administrator Usage
```javascript
// Admin can manage all prompts
const adminUser = { role: 'admin', id: 1 };
// Can perform all operations on any prompt
```

### Developer Usage
```javascript
// Developer can manage their own prompts
const devUser = { role: 'dev', id: 2 };
// Can create prompts
// Can edit/delete their own prompts
// Can view shared prompts
```

### User Usage
```javascript
// Regular user has limited permissions
const regularUser = { role: 'user', id: 3 };
// Can create and edit their own prompts
// Cannot delete prompts
```

## Security Considerations

1. All API endpoints validate user roles before processing requests
2. Client-side checks are for UI convenience only - server-side validation is enforced
3. Prompt ownership is tracked via `owner_id` foreign key
4. Visibility settings control prompt sharing between users
5. Role-based access is logged for audit purposes

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**: Ensure user has correct role assigned
2. **Cannot Delete Prompt**: Check if user owns the prompt or has admin role
3. **Cannot View Prompt**: Verify prompt visibility settings and user permissions

### Debugging Steps

1. Check user role in the database
2. Verify prompt ownership
3. Review server logs for permission check failures
4. Test API endpoints with different user roles

## Future Enhancements

1. Fine-grained permission controls
2. Team-based prompt sharing
3. Audit logging for all prompt operations
4. Role inheritance and group permissions
