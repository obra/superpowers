# Security Model Documentation

## Authentication System

### Core Components

1. **AuthCore (0175-auth-core.js)**
   - Manages session state and authentication lifecycle
   - Handles session checking and maintenance with retry mechanism:
     - Up to 3 retry attempts with 1-second delay
     - Session lock to prevent concurrent checks
     - 10-second lock timeout
   - Provides core authentication functionality:
     - Session initialization with environment detection
     - Periodic session validation (every 5 seconds)
     - Session state management with locking mechanism
     - Sign out functionality with cleanup
     - User session retrieval with caching
     - Automatic session recovery after network errors

2. **Environment Configuration (0175-auth-config.js)**
   - Manages environment-specific configurations
   - Handles URL generation for authentication flows
   - Defines public/protected paths using relative paths only
   - Configures Supabase authentication settings
   - Manages provider-specific configurations (e.g., Google OAuth)
   - Handles environment-specific redirects

3. **Google Provider (auth/providers/google-provider.js)**
   - Implements Google OAuth authentication flow:
     - Initial sign-in with offline access
     - Consent prompt configuration
     - Authorization code handling
     - Profile initialization for new users
   - Manages OAuth callback process:
     - Code validation
     - Session establishment
     - Profile creation/verification
     - Intended path restoration
   - Comprehensive audit logging of OAuth events
   - Handles Google icon display and button styling

### Authentication Flow

1. **Login Process**
   - Email/Password Authentication:
     - User submits credentials via login form
     - Credentials validated client-side
     - Supabase authenticates credentials
     - Success redirects to dashboard
     - Failure shows error message
     - Audit log entry created

   - Google OAuth Authentication:
     - User clicks Google sign-in button
     - Previous session cleared
     - Redirects to Google OAuth consent screen
     - Google returns authorization code
     - Code processed in auth callback (0175-auth-callback.html)
     - User profile created/verified
     - Default role assigned if new user
     - Redirect to dashboard or intended path
     - Comprehensive audit logging throughout process

2. **Session Management**
   - Sessions checked every 5 seconds with:
     - Session locking mechanism
     - Retry logic for failed checks
     - Lock timeout handling
   - Invalid sessions redirect to login
   - Intended path stored for post-login redirect
   - Session state maintained in localStorage
   - Network error handling with automatic recovery
   - Environment-aware session validation

3. **Password Reset Flow**
   - User requests password reset
   - Reset email sent via Supabase
   - User clicks email link
   - Redirects to password reset page (0175-password-reset.html)
   - New password set and confirmed
   - Audit log entry created
   - Session refreshed after reset

### Role Management System

1. **Role Manager (auth-roles.js)**
   - Caching mechanism:
     - 5-minute cache duration
     - Separate role and permission caches
     - Automatic cache invalidation
   - Role initialization:
     - Up to 3 retry attempts
     - 1-second retry delay
     - Comprehensive error handling
   - Admin detection:
     - Direct email check
     - Role-based admin verification
     - Cached admin status

2. **Permission Management**
   - Hierarchical permission system:
     - Role-based permissions
     - Individual permission checks
     - Admin override (*all permissions)
   - Permission caching:
     - Per-user permission cache
     - Permission-specific cache entries
     - Automatic cache refresh
   - Batch permission retrieval
   - Environment-aware permission checks

### Security Features

1. **Audit Logging**
   - Authentication events logged to audit_logs table:
     - User authentication attempts
     - Role/permission changes
     - Profile updates
     - OAuth events
     - Password resets
   - Comprehensive event details:
     - User ID
     - Company ID
     - IP address
     - User agent
     - Timestamp
     - Environment information
     - Action-specific details

2. **Role Management**
   - Default role assigned on first login
   - Role-based access control
   - Company-specific permissions
   - Role cache management
   - Role initialization retry logic
   - Admin role special handling

3. **Session Protection**
   - Automatic session validation
   - Secure session storage
   - Token refresh handling
   - Protected route enforcement
   - Session locking mechanism
   - Network error recovery
   - Environment-specific session handling

## File Paths System

### Global File Paths (0200-file-paths.js)

1. **Environment Detection**

   ```javascript
   function isLocalEnvironment() {
       return window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1';
   }
   ```

2. **Base Path Management**

   ```javascript
   function getBasePath() {
       if (isLocalEnvironment()) {
           return window.location.origin;
       }
       return 'https://construct-ai.onrender.com';
   }
   ```

3. **Path Categories**
   - Image Paths: Mapped in IMAGE_PATHS object
   - Accordion Paths: Mapped in ACCORDION_PATHS object
   - Module Paths: Handled by getModulePath function
   - All paths must be relative, never absolute

4. **Utility Functions**
   - getImagePath: Retrieves full image paths
   - getAccordionPath: Retrieves accordion component paths
   - getAllImagePaths: Gets all image paths with base path

### Safety-Specific Paths (2700-file-paths.js)

1. **Chatbot IDs**
   - Safety Chatbot: Managed by getSafetyChatbotId()
   - Upsert Chatbot: Managed by getUpsertChatbotId()
   - Workspace Chatbot: Managed by getWorkspaceChatbotId()

2. **Environment Handling**
   - Imports environment values from 2700-environment.js
   - Maintains consistent IDs across environments
   - Logs environment state on initialization

### Best Practices

1. **Path Resolution**
   - Always use provided utility functions
   - Never use absolute paths
   - Use environment-aware path generation
   - Always use relative paths for consistency

2. **Error Handling**
   - Path not found errors are logged
   - Fallback paths provided where appropriate
   - Console logging for debugging

3. **Maintenance**
   - Centralized path management
   - Environment-specific configurations
   - Consistent logging patterns

### Usage Guidelines

1. **Image Paths**

   ```javascript
   const imagePath = getImagePath('login-background');
   ```

2. **Module Paths**

   ```javascript
   const modulePath = getModulePath('./components/header.js');
   ```

3. **Chatbot Integration**

   ```javascript
   const safetyChatbotId = getSafetyChatbotId();
   ```

4. **Environment Awareness**
   - Always use environment-aware functions
   - Check isLocal for environment-specific logic
   - Use proper base paths for different environments
   - Maintain relative paths throughout the application
