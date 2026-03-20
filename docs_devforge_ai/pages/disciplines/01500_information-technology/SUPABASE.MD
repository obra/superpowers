# Supabase Integration

## Overview

This document outlines the integration of Supabase services within the application, covering authentication, database, and real-time features. The integration is designed to provide secure, scalable, and efficient data management and user authentication.

## Authentication Integration

### Client Configuration and Singleton Pattern

#### Centralized Supabase Client

To prevent multiple GoTrueClient instances and related warnings, the application uses a centralized singleton pattern:

```javascript
// client/src/lib/supabaseClient.js - Main singleton client
import { createClient } from '@supabase/supabase-js';

let supabase = null;
const SUPABASE_STORAGE_KEY = '__construct_ai_singleton_client__';

if (!supabase) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: typeof window !== 'undefined',
      detectSessionInUrl: false,
      storageKey: SUPABASE_STORAGE_KEY  // Unique key prevents conflicts
    }
    // ... other options
  });
}

export default supabase;
```

#### Delegate Access Pattern

All components access the singleton through a delegate:

```javascript
// client/src/common/js/auth/00175-supabase-client.js
import supabaseClient from '../../../lib/supabaseClient.js';

export function getSupabase() {
  return supabaseClient;
}
```

#### Component Usage Example

```javascript
// In component files like document-upload-modal.js
import supabaseClientModule from "@common/js/auth/00175-supabase-client.js";

const getSupabaseClient = () => {
  try {
    const client = supabaseClientModule.getSupabase();
    if (!client) {
      console.error("[ERROR] Centralized Supabase client not available");
      return null;
    }
    return client;
  } catch (error) {
    console.error("[ERROR] Failed to get centralized Supabase client:", error);
    return null;
  }
};
```

#### Recent Fixes (October 2025)

**Multiple GoTrueClient Instances Issue:**

Fixed in `client/src/pages/01300-governance/components/01300-document-upload-modal.js` by:

1. Replacing direct client import with centralized singleton access
2. Adding error handling for client initialization failures
3. Ensuring all database operations use the same client instance

**Key Issues Resolved:**
- Removed `ReferenceError: supabaseClient is not defined` during discipline fetch
- Eliminated multiple GoTrueClient instance warnings in browser console
- Improved error handling for client unavailability

#### Environment Configuration

```javascript
// Environment-aware configuration
const ENV = {
    supabase: {
        url: process.env.REACT_APP_SUPABASE_URL || 'https://mseizswoiwyewsidknta.supabase.co',
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        options: {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false, // Disabled to prevent conflicts
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                storageKey: '__construct_ai_singleton_client__'  // Unique storage key
            },
            global: {
                headers: {
                    'x-client-info': 'construct-ai-frontend-singleton'
                }
            }
        }
    },
    auth: {
        sessionCheckInterval: 5000,
        publicPaths: ['0100-login.html', '0150-signup.html', '0175-password-reset.html', 'index.html'],
        defaultRedirect: '0200-home.html'
    }
};
```

### Authentication Flows

1. **Google OAuth Authentication**

```javascript
// google-provider.js
async function handleGoogleSignIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: ENV.getRedirectUrl(),
            queryParams: {
                access_type: 'offline',
                prompt: 'consent'
            }
        }
    });
}
```

2. **OAuth Callback Handling**

```javascript
async function handleOAuthCallback({ code }) {
    // Validate authorization code
    // Establish session
    // Initialize user profile
    // Handle redirect
    // Log audit event
}
```

3. **Email/Password Authentication**

```javascript
async function handleEmailLogin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
}
```

4. **Password Reset Flow**

```javascript
async function handlePasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${ENV.siteUrl}/0175-password-reset.html`
    });
}
```

### Session Management

1. **Core Session Handling**

```javascript
// auth-core.js
class AuthCore {
    async checkSession() {
        // Session validation with retry mechanism
        // Lock management
        // Network error handling
        // Environment-specific checks
    }

    startSessionChecking() {
        // Periodic session validation
        // Lock timeout monitoring
    }
}
```

2. **User Profile Management**

```javascript
async function initializeUserProfile(session) {
    // Check existing profile
    // Create new profile with default role
    // Initialize RBAC
    // Log audit event
}
```

### Audit Logging System

1. **Authentication Events**

```javascript
async function logAuthEvent(userId, action, details) {
    await supabase
        .from('audit_logs')
        .insert([{
            user_id: userId,
            action: action,
            details: {
                ...details,
                ip_address: window.clientIP,
                user_agent: navigator.userAgent,
                timestamp: new Date().toISOString()
            }
        }]);
}
```

2. **Logged Events**
   - Authentication attempts (success/failure)
   - Password reset requests
   - Profile updates
   - Role changes
   - OAuth events
   - Session validations
   - RBAC initializations

## Database Integration

### Table Structure

1. **Safety Documents**

```sql
CREATE TABLE a_2700_safety_data (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    originalname TEXT NOT NULL,
    filetype TEXT NOT NULL,
    companyid INTEGER NOT NULL,
    projectid INTEGER NOT NULL,
    contractid INTEGER NOT NULL,
    contracttypeid INTEGER NOT NULL,
    mimetype TEXT NOT NULL,
    filesize INTEGER NOT NULL,
    filepath TEXT NOT NULL,
    uploaddate TIMESTAMP WITH TIME ZONE NOT NULL,
    userrole TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE a_2700_safety_vector (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    safetydataid INTEGER REFERENCES a_2700_safety_data(id),
    companyid INTEGER NOT NULL,
    projectid INTEGER NOT NULL,
    contractid INTEGER NOT NULL,
    contracttypeid INTEGER NOT NULL,
    embedding vector(1536),
    userrole TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

2. **User Profiles**

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'default',
    company_id UUID REFERENCES companies,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. **Pages Table**

```sql
CREATE TABLE public.pages (
    page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_prefix VARCHAR(5) UNIQUE NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_slug VARCHAR(255) NOT NULL,
    sector_id UUID REFERENCES public.sectors(sector_id) ON DELETE SET NULL,
    organization_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

4. **Roles and Permissions**

```sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES auth.users,
    role_name TEXT,
    PRIMARY KEY (user_id, role_name)
);

CREATE TABLE role_permissions (
    role_name TEXT,
    permission_name TEXT,
    PRIMARY KEY (role_name, permission_name)
);
```

3. **Audit Logs**

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users,
    company_id UUID REFERENCES companies,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table Policies

1. **Safety Documents**

```sql
-- Safety Data Policies
CREATE POLICY "Users can view safety documents for their company and role"
ON a_2700_safety_data FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM user_company_access 
        WHERE company_id = companyid
    )
    AND
    userrole = (
        SELECT role FROM user_profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can upload safety documents for their company"
ON a_2700_safety_data FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM user_company_access 
        WHERE company_id = companyid
    )
);

-- Safety Vector Policies
CREATE POLICY "Users can view safety vectors for their company and role"
ON a_2700_safety_vector FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM user_company_access 
        WHERE company_id = companyid
    )
    AND
    userrole = (
        SELECT role FROM user_profiles 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert safety vectors for their company"
ON a_2700_safety_vector FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM user_company_access 
        WHERE company_id = companyid
    )
);
```

2. **Companies Table**

```sql
CREATE POLICY "Companies are viewable by company members"
ON companies FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM user_company_access
    WHERE company_id = id
));
```

3. **Pages Table Policies**

```sql
CREATE POLICY "Enable read access for all users" ON public.pages FOR SELECT USING (TRUE);
-- Further RLS policies can be added here based on specific access requirements
-- For example, to restrict by organization:
-- CREATE POLICY "Users can view pages for their active organization"
-- ON public.pages FOR SELECT
-- USING (
--     organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
-- );
```

4. **User Profiles**

```sql
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
));
```

3. **Audit Logs**

```sql
CREATE POLICY "Users can view their own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view company audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
));
```

### Real-time Subscriptions

1. **Company Updates**

```javascript
const companySubscription = supabase
    .from('companies')
    .on('UPDATE', payload => {
        handleCompanyUpdate(payload.new);
    })
    .subscribe();
```

2. **Profile Updates**

```javascript
const profileSubscription = supabase
    .from('user_profiles')
    .on('UPDATE', payload => {
        handleProfileUpdate(payload.new);
    })
    .subscribe();
```

## Security Considerations

### 1. Row Level Security (RLS)

- All tables have RLS enabled
- Policies enforce data access control
- Company-specific data isolation
- Role-based access restrictions

### 2. Session Security

- Regular session validation (5-second intervals)
- Session locking mechanism
- Automatic token refresh
- Secure token storage
- Network error recovery
- Environment-specific handling

### 3. OAuth Security

- Secure redirect handling
- State parameter validation
- PKCE flow support
- Consent prompt enforcement
- Offline access handling

## Storage Integration

### Document Storage

#### Current Implementation (Single Bucket)
- Uses a single `documents` bucket with hierarchical path structure
- Path format: `{project_id}/{discipline}/{doc_type}/{year}/{month}/{uuid}.{ext}`
- Example: `documents/90cd635a-380f-4586-a3b7-a09103b6df94/contracts/agreements/2025/07/abc123.pdf`

#### Enterprise Migration Path
- Can transition to discipline-specific buckets when needed
- Migration process:
  1. Create new discipline buckets (e.g. `contracts-bucket`)
  2. Copy files from old paths to new buckets
  3. Update database references
  4. Implement dual-read during transition

#### Email Storage
- Uses separate `emails` bucket with different structure:
  - Path format: `emails/{project_id}/{user_id}/{year}/{month}/{email_id}.eml`
  - Optimized for high-volume small files

### Best Practices
1. Always include project_id in paths for isolation
2. Use UUIDs for filenames to prevent collisions
3. Store full paths in database for easy retrieval
4. Implement proper RLS policies for bucket access

## Vector Storage Integration

### Overview

The application uses Supabase's vector storage capabilities for semantic search of safety documents. This is implemented through:

1. Document processing with Llama for content extraction
2. Vector embedding generation (1536 dimensions)
3. Storage in the a_2700_safety_vector table
4. Vector similarity search using pgvector

### Vector Search Functions

### Created Search Functions

Here is a list of the created SQL search functions, categorized by their functionality:

**Vector Similarity Match Functions:**

- `sql/match_a_00850_civileng_vector.sql`: Matches vectors in the `a_00850_civileng_vector` table.
- `sql/match_a_00880_boarddir_vector.sql`: Matches vectors in the `a_00880_boarddir_vector` table.
- `sql/match_a_00895_dirproject_vector.sql`: Matches vectors in the `a_00895_dirproject_vector` table.
- `sql/match_a_00900_doccontrol_vector.sql`: Matches vectors in the `a_00900_doccontrol_vector` table.

**General Search Functions:**

- `sql/search_a_00435_contracts_post_vector.sql`: General search for `a_00435_contracts_post_vector` table.
- `sql/search_a_01300_governance_vector.sql`: General search for `a_01300_governance_vector` table.

```sql
CREATE OR REPLACE FUNCTION search_a_00435_contracts_post_vector(
    query_embedding VECTOR(1536), -- Your specific embedding dimension
    match_count INTEGER,
    target_document_value TEXT   -- Parameter to filter by the value of the "document" key
)
RETURNS TABLE (id UUID, content TEXT, metadata JSONB, similarity REAL)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.content,
        a.metadata,
        (1 - (a.embedding <=> query_embedding)) AS similarity
    FROM
        a_00435_contracts_post_vector a -- This is the table name
    WHERE
        a.metadata->>'document' = target_document_value -- Filter by the value of the "document" metadata key
    ORDER BY
        a.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

```sql
-- Get embeddings for a search query
CREATE OR REPLACE FUNCTION get_embeddings(input TEXT)
RETURNS vector
LANGUAGE plpgsql
AS $$
BEGIN
    -- Implementation depends on your embedding model
    -- This is typically handled by your application layer
    RETURN NULL;
END;
$$;

-- Match safety documents using vector similarity
CREATE OR REPLACE FUNCTION match_safety_documents(
    query_embedding vector,
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id bigint,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.content,
        v.metadata,
        1 - (v.embedding <=> query_embedding) as similarity
    FROM a_2700_safety_vector v
    WHERE 1 - (v.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- Match inspection documents using vector similarity and metadata filtering
CREATE OR REPLACE FUNCTION match_inspection_documents(
    query_embedding vector,
    match_threshold float,
    match_count int,
    metadata_filter jsonb DEFAULT NULL
)
RETURNS TABLE (
    id text,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id::text,
        v.content,
        v.metadata,
        1 - (v.embedding <=> query_embedding) as similarity
    FROM a_2075_inspection_vector v
    WHERE 1 - (v.embedding <=> query_embedding) > match_threshold
     AND (metadata_filter IS NULL OR v.metadata @> metadata_filter)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
```

### Example Usage (match\_inspection\_documents)

```sql
SELECT * FROM match_inspection_documents(
  query_embedding := '[0.1, 0.2, 0.3, ...]',  -- Replace with a real vector embedding
  match_threshold := 0.8,  -- Adjust as needed
  match_count := 10,       -- Adjust as needed
  metadata_filter := '{"equipment_type": "windmill"}' -- Example: Filter by equipment_type
);
```

### Example Usage (match_qs_vectors)

```sql
SELECT *
FROM match_qs_vectors(
    -- Use a subquery to select one embedding from your table
    (SELECT embedding FROM a_02025_qs_vector WHERE embedding IS NOT NULL LIMIT 1),
    '0.7',  -- Set your desired similarity threshold (e.g., 0.7)
    5       -- Set the desired number of matches (e.g., 5)
);
```

### a_00435_contracts_post_vector Setup

- Your embedding column in `a_00435_contracts_post_vector` has its dimensions correctly defined (e.g., `VECTOR(1536)`).
- You have an HNSW index (`idx_embedding_hnsw_cosine` or similar) on this dimensioned embedding column.
- You have a custom SQL RPC function (`match_documents_with_json_filters`) that:
    - Accepts a query embedding, a match count, and a JSONB object for filtering.
    - Is designed to iterate through the keys/values in the JSONB filter and apply them as (`metadata->>key = value`) conditions.
    - Performs the semantic search and returns the results.

```sql
CREATE OR REPLACE FUNCTION match_documents_with_json_filters(
    query_embedding VECTOR, -- Ensure this matches your embedding vector type and dimensions
    match_count INT,
    filter_json JSONB
)
RETURNS SETOF a_00435_contracts_post_vector
AS $$
DECLARE
    sql_query TEXT;
    where_clauses TEXT[] := ARRAY['TRUE'];
    k TEXT;
    v TEXT;
BEGIN
    IF filter_json IS NOT NULL THEN
        FOR k, v IN SELECT key, value FROM jsonb_each_text(filter_json) LOOP
            where_clauses := array_append(where_clauses, format('(metadata->>%L = %L)', k, v));
        END LOOP;
    END IF;

    sql_query := format(
        'SELECT id, content, metadata, (1 - (embedding <=> %L)) AS similarity ' ||
        'FROM a_00435_contracts_post_vector ' ||
        'WHERE %s ' ||
        'ORDER BY embedding <=> %L LIMIT %L',
        query_embedding,
        array_to_string(where_clauses, ' AND '),
        query_embedding,
        match_count
    );
    RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;
```

## Best Practices

### 1. Authentication

- Implement proper session management
- Use environment-aware configurations
- Handle authentication errors gracefully
- Maintain comprehensive audit logs
- Validate user sessions regularly
- Implement retry mechanisms

### 2. Database

- Use appropriate RLS policies
- Optimize queries for performance
- Handle errors consistently
- Maintain data integrity
- Follow least privilege principle
- Implement proper indexing

### 3. Error Handling

```javascript
function handleSupabaseResponse(data, error) {
    if (error) {
        console.error('Supabase Error:', error.message);
        throw new Error(error.message);
    }
    return data;
}
```

### 4. Audit Logging

- Log all security-relevant events
- Include detailed context
- Maintain proper retention
- Implement secure access controls
- Enable efficient querying

## Timesheet Integration

### Timesheet Submissions Table

```sql
CREATE TABLE timesheet_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    week_key VARCHAR(10) NOT NULL, -- Format: YYYY-WXX (e.g., 2025-W34)
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    tasks JSONB NOT NULL, -- Array of task objects with hours per day
    total_hours DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved, rejected
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_timesheet_user_week ON timesheet_submissions(user_id, week_key);
CREATE INDEX idx_timesheet_status ON timesheet_submissions(status);
CREATE INDEX idx_timesheet_submitted_at ON timesheet_submissions(submitted_at);
```

### Timesheet Templates Table

```sql
CREATE TABLE timesheet_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tasks JSONB NOT NULL, -- Array of task templates
    user_id UUID, -- NULL for system templates, specific user ID for user templates
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_templates_user ON timesheet_templates(user_id);
CREATE INDEX idx_templates_system ON timesheet_templates(is_system);
```

### Timesheet Descriptions Table

```sql
CREATE TABLE timesheet_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_descriptions_project ON timesheet_descriptions(project_id);
CREATE INDEX idx_descriptions_category ON timesheet_descriptions(category);
CREATE INDEX idx_descriptions_active ON timesheet_descriptions(is_active);
```

### Row Level Security Policies

```sql
-- Timesheet submissions - users can only view their own submissions
CREATE POLICY "Users can view their own timesheet submissions"
ON timesheet_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timesheet submissions"
ON timesheet_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timesheet submissions"
ON timesheet_submissions FOR UPDATE
USING (auth.uid() = user_id);

-- Timesheet templates - users can view system templates and their own templates
CREATE POLICY "Users can view timesheet templates"
ON timesheet_templates FOR SELECT
USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert timesheet templates"
ON timesheet_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Timesheet descriptions - public read access
CREATE POLICY "Enable read access for all users"
ON timesheet_descriptions FOR SELECT
USING (true);
```

### API Endpoints

1. **Submit Timesheet**
   - `POST /api/timesheet/submit`
   - Headers: `X-User-ID` (for guest users)
   - Body: `{ weekKey, tasks, totalHours }`

2. **Get Submissions**
   - `GET /api/timesheet/submissions`
   - Headers: `X-User-ID` (for guest users)

3. **Get Single Submission**
   - `GET /api/timesheet/submissions/:id`
   - Headers: `X-User-ID` (for guest users)

4. **Update Submission Status**
   - `POST /api/timesheet/submissions/:id/status`
   - Headers: `X-User-ID` (for guest users)
   - Body: `{ status, rejectionReason }`

## Enhanced Contributor Access Control and Tenant Isolation

### Contributor Permission Framework

#### Role-Based Contributor Access
```sql
-- Extended user roles table with contributor restrictions
CREATE TABLE contributor_permissions (
    user_id UUID REFERENCES auth.users,
    role_name TEXT,
    organization_id UUID REFERENCES organizations,
    can_access_folders TEXT[], -- ['client/mechanical', 'client/electrical']
    restricted_folders TEXT[], -- ['admin/', 'security/', 'infrastructure/']
    project_restrictions TEXT[], -- Specific project IDs they can access
    supabase_access_level TEXT DEFAULT 'read', -- 'read', 'write', 'admin', 'none'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
);

-- Contributor organization membership
CREATE TABLE contributor_organizations (
    user_id UUID REFERENCES auth.users,
    organization_id UUID REFERENCES organizations,
    access_level TEXT DEFAULT 'contributor', -- 'contributor', 'maintainer', 'admin'
    folder_permissions JSONB, -- Detailed folder-by-folder permissions
    project_permissions JSONB, -- Project-specific restrictions
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, organization_id)
);
```

#### Folder-Based Access Control
```javascript
// Server-side folder access validation
function validateContributorAccess(userId, folderPath, action) {
    const userPerms = await supabase
        .from('contributor_permissions')
        .select('can_access_folders, restricted_folders')
        .eq('user_id', userId)
        .single();

    // Check if access is explicitly denied
    if (userPerms.restricted_folders.some(restricted =>
        folderPath.startsWith(restricted))) {
        return false;
    }

    // Check if access is explicitly allowed
    if (userPerms.can_access_folders.some(allowed =>
        folderPath.startsWith(allowed))) {
        return true;
    }

    // Default deny for unspecified folders
    return false;
}
```

### Tenant Isolation Architecture

#### Client-Specific Database Separation
- [ ] **Schema-Based Isolation**
  - Separate database schemas per client
  - Shared core tables in public schema
  - Client-specific data in isolated schemas

- [ ] **Row-Level Security Per Client**

```sql
-- Client-tenant RLS policy framework
CREATE OR REPLACE FUNCTION current_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.client_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced client data isolation
CREATE POLICY "client_tenant_isolation"
ON client_documents FOR ALL
USING (
    client_id = current_client_id()
    OR
    current_client_id() IS NULL -- Allow system/admin access
);

-- Contributor-specific restrictions
CREATE POLICY "contributor_folder_restrictions"
ON documents FOR ALL
USING (
    folder_path NOT IN (
        SELECT unnest(restricted_folders)
        FROM contributor_permissions
        WHERE user_id = auth.uid()
    )
    AND
    (folder_path IN (
        SELECT unnest(can_access_folders)
        FROM contributor_permissions
        WHERE user_id = auth.uid()
    ) OR can_access_folders IS NULL)
);
```

#### Multi-Tenant Access Patterns

```sql
-- Cross-client access for admin users
CREATE POLICY "admin_cross_client_access"
ON all_client_data FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role_name = 'super_admin'
    )
);

-- Restricted contributor access across clients
CREATE POLICY "contributor_client_restricted_access"
ON client_documents FOR ALL
USING (
    client_id IN (
        SELECT organization_id
        FROM contributor_organizations
        WHERE user_id = auth.uid()
    )
);
```

### Enhanced Audit Logging for Contributors

#### Access Audit Framework
```sql
-- Comprehensive contributor access audit
CREATE TABLE contributor_access_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users,
    organization_id UUID REFERENCES organizations,
    action TEXT NOT NULL, -- 'read', 'write', 'delete', 'deploy'
    resource_type TEXT NOT NULL, -- 'document', 'database', 'deployment'
    resource_id TEXT, -- Specific document/deployment ID
    folder_path TEXT, -- For folder-based actions
    client_id UUID, -- Associated client if applicable
    ip_address INET,
    user_agent TEXT,
    additional_context JSONB,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Automated audit logging trigger
CREATE OR REPLACE FUNCTION log_contributor_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO contributor_access_audit (
        user_id,
        organization_id,
        action,
        resource_type,
        resource_id,
        folder_path,
        client_id,
        ip_address,
        user_agent,
        success
    ) VALUES (
        NEW.user_id,
        NEW.organization_id,
        NEW.action,
        NEW.resource_type,
        NEW.resource_id,
        NEW.folder_path,
        NEW.client_id,
        inet_client_addr(),
        current_setting('request.headers')::jsonb ->> 'user-agent',
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Deployment Access Control
```sql
-- Deployment permission audit
CREATE POLICY "deployment_access_control"
ON deployments FOR ALL
USING (
    -- Allow access if user has deployment permissions for the client
    EXISTS (
        SELECT 1 FROM contributor_permissions cp
        JOIN client_deployments cd ON cd.client_id = cp.organization_id
        WHERE cp.user_id = auth.uid()
        AND cp.supabase_access_level IN ('admin', 'write')
        AND cd.id = deployments.client_deployment_id
    )
    OR
    -- Allow super admin access
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role_name = 'super_admin'
    )
);
```

### Supabase Permission Groups

#### Predefined Permission Templates

```sql
-- Permission templates for different contributor types
CREATE TABLE permission_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    supabase_access_level TEXT DEFAULT 'read',
    can_access_folders TEXT[],
    restricted_folders TEXT[],
    allowed_actions TEXT[], -- ['read', 'write', 'deploy', 'admin']
    client_restrictions TEXT, -- 'own_only', 'assigned', 'none'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined templates
INSERT INTO permission_templates (name, description, supabase_access_level, can_access_folders, restricted_folders, allowed_actions, client_restrictions)
VALUES
    ('frontend-contributor', 'Client-side development only', 'read', ARRAY['client/', 'docs/public/'], ARRAY['server/', 'database/', 'infrastructure/'], ARRAY['read', 'write'], 'own_only'),
    ('backend-contributor', 'Server-side development', 'write', ARRAY['server/src/', 'database/migrations/'], ARRAY['server/infrastructure/', 'security/'], ARRAY['read', 'write'], 'assigned'),
    ('project-manager', 'Project oversight and deployment', 'write', ARRAY['**'], ARRAY['infrastructure/secrets/'], ARRAY['read', 'write', 'deploy'], 'own_only'),
    ('client-admin', 'Full client access', 'admin', ARRAY['**'], ARRAY[], ARRAY['read', 'write', 'deploy', 'admin'], 'own_only'),
    ('super-admin', 'System-wide access', 'admin', ARRAY['**'], ARRAY[], ARRAY['read', 'write', 'deploy', 'admin'], 'none');
```

### API Endpoint Access Control

#### Request Validation Middleware

```javascript
// Enhanced middleware for contributor access validation
function validateContributorRequest(req, res, next) {
    const userId = req.user.id;
    const requestedPath = req.path;
    const action = req.method.toLowerCase();

    // Check folder-based permissions
    const folderPermission = await checkFolderPermission(userId, requestedPath);

    if (!folderPermission.allowed) {
        await logAccessAttempt(userId, 'blocked', {
            path: requestedPath,
            action,
            reason: 'folder_restricted'
        });
        return res.status(403).json({
            error: 'Access denied to this resource',
            reason: 'Insufficient folder permissions'
        });
    }

    // Check client/tenant restrictions
    const clientId = req.headers['x-client-id'] || req.query.clientId;
    if (clientId) {
        const clientPermission = await checkClientPermission(userId, clientId);
        if (!clientPermission.allowed) {
            await logAccessAttempt(userId, 'blocked', {
                clientId,
                reason: 'client_restricted'
            });
            return res.status(403).json({
                error: 'Access denied to this client',
                reason: 'Not authorized for this client'
            });
        }
    }

    next();
}
```

### Data Isolation Verification

#### Automated Compliance Checks

```sql
-- Verify tenant isolation integrity
CREATE OR REPLACE FUNCTION verify_tenant_isolation()
RETURNS TABLE (
    table_name TEXT,
    has_rls BOOLEAN,
    isolation_status TEXT,
    issues_found TEXT[]
) AS $$
DECLARE
    r RECORD;
    issues TEXT[] := ARRAY[];
BEGIN
    FOR r IN
        SELECT tablename::TEXT
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'client_%'
    LOOP
        -- Check RLS status
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = r.tablename
            AND schemaname = 'public'
        ) THEN
            issues := array_append(issues, 'No RLS policies defined');
        END IF;

        -- Check for client_id column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = r.tablename
            AND column_name = 'client_id'
        ) THEN
            issues := array_append(issues, 'Missing client_id column');
        END IF;

        RETURN QUERY SELECT
            r.tablename,
            CASE WHEN EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_policies p ON c.oid = p.tablename::regclass
                WHERE c.relname = r.tablename
            ) THEN true ELSE false END,
            CASE
                WHEN array_length(issues, 1) = 0 THEN 'compliant'
                WHEN array_length(issues, 1) > 0 THEN 'issues_found'
                ELSE 'checking_required'
            END,
            issues;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Migration Safety for Contributors

#### Controlled Migration Execution

```javascript
// Safe migration with contributor restrictions
async function executeRestrictedMigration(migrationName, contributorId) {
    // Verify contributor has migration permissions
    const hasPermission = await supabase
        .from('contributor_permissions')
        .select('supabase_access_level')
        .eq('user_id', contributorId)
        .gte('supabase_access_level', 'write')
        .single();

    if (!hasPermission) {
        throw new Error('Insufficient permissions for database migrations');
    }

    // Create migration backup point
    await createMigrationBackup(migrationName);

    // Execute migration in transaction
    const { error } = await supabase.rpc('execute_migration', {
        migration_name: migrationName,
        executed_by: contributorId
    });

    if (error) {
        await rollbackMigration(migrationName);
        throw error;
    }

    // Log successful migration
    await logMigrationEvent(migrationName, contributorId, 'success');
}
```

### Integration with GitHub and Render Controls

This contributor access control framework integrates with:

- **GitHub Security Controls**: CODEOWNERS and branch protection enforce contributor folder restrictions at the repository level
- **Render Multi-Instance Strategy**: Client-specific deployments respect contributor permissions and tenant isolation
- **Deployment Auditing**: All Supabase access and changes are logged and tied to contributor permissions

### Security Monitoring

#### Real-time Access Monitoring

```javascript
// Monitor for suspicious contributor activity
function monitorContributorActivity(userId, action, resource) {
    // Check for unusual patterns
    const recentActivity = await getRecentActivity(userId, '1 hour');

    if (recentActivity.length > 100) { // Threshold for suspicious activity
        await alertSecurityTeam({
            type: 'high_activity',
            userId,
            activityCount: recentActivity.length,
            timeframe: '1 hour'
        });
    }

    // Check for restricted resource access attempts
    if (action === 'access_denied' && resource.includes('restricted/')) {
        await logSecurityEvent({
            type: 'restricted_access_attempt',
            userId,
            resource,
            severity: 'medium'
        });
    }
}
```

## Related Documentation

- [Security Model](0400_SECURITY_MODEL.md)
- [Database Schema](0300_DATABASE_SCHEMA.md)
- [Company Management](0600_COMPANY_MANAGEMENT.md)
- [Safety Page](1300_2700_SAFETY_PAGE.md)
- [Modal Management](0975_00_MODAL_MANAGEMENT.md)
- [GitHub Security Assessment](../0000_GITHUB_SECURITY_ASSESSMENT_REPORT.md)
- [Render Multi-Instance Strategy](../0050_RENDER_MULTI_INSTANCE_STRATEGY.md)
