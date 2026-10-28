# Database Access Control

This is the #1 source of critical vulnerabilities in vibe-coded apps. AI assistants routinely generate database schemas without proper access control, leaving entire tables exposed.

## Supabase Row-Level Security (RLS)

### Enable RLS on Every Table

Tables created via SQL Editor or migrations have RLS **disabled by default**. A table without RLS is fully readable and writable by anyone with the anon key (which is public). Run this in every migration to catch missed tables:

```sql
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
```

### Dangerous RLS Policies

**Never use `USING (true)` or `USING (auth.uid() IS NOT NULL)` on SELECT/UPDATE/DELETE.** These let any authenticated user access every row in the table. Always scope to the row owner:

```sql
-- BAD: any logged-in user can read all rows
CREATE POLICY "Users can view data" ON public.documents
  FOR SELECT TO authenticated USING (true);

-- BAD: any logged-in user can read all rows
CREATE POLICY "Users can view data" ON public.documents
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- GOOD: users can only read their own rows
CREATE POLICY "Users can view own data" ON public.documents
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
```

### Missing WITH CHECK

Always include `WITH CHECK` on INSERT and UPDATE policies. Without it, a user can reassign row ownership or insert rows as another user:

```sql
-- BAD: user can UPDATE user_id to someone else's ID
CREATE POLICY "Users can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- GOOD: WITH CHECK prevents changing user_id
CREATE POLICY "Users can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

### Sensitive Fields on User-Accessible Tables

If a `profiles` table lets users UPDATE their own row, they can set `is_admin = true`, `credits = 99999`, or `subscription_tier = 'enterprise'`. Fixes:

- **Option A:** Move sensitive fields to a `private` schema table not exposed via PostgREST. Access them through `SECURITY DEFINER` functions.
- **Option B:** Use column-level privileges:
  ```sql
  REVOKE UPDATE ON profiles FROM authenticated;
  GRANT UPDATE (display_name, avatar_url) ON profiles TO authenticated;
  ```

### Forgotten Related Tables

Junction tables, audit logs, and metadata tables often lack RLS even when the main table has it. Every table exposed via the REST API needs its own policies. If a table has RLS enabled but no policies defined, it blocks all access — which is safe but may cause subtle bugs.

### SECURITY DEFINER Functions

`SECURITY DEFINER` functions bypass RLS entirely. If created in the `public` schema, they're callable via the REST API by anyone. Always:
- Keep them in a `private` schema
- Set `SET search_path = ''`
- Validate all inputs inside the function

### Storage Buckets

Storage buckets need their own policies. Without them, any authenticated user can upload, read, or delete any file. Scope uploads to the user's UID folder:

```sql
CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
  );
```


## Firebase Security Rules

### Default Rules Are Dangerous

Never ship these:
```
// BAD: world-readable and writable
allow read, write: if true;

// BAD: any logged-in user can access everything
allow read, write: if request.auth != null;
```

Always validate ownership:
```
allow read, write: if request.auth.uid == userId;
```

### Field-Level Protection

Without restricting which fields users can modify, they can set `isAdmin: true` or `credits: 99999`:

```
// GOOD: restrict modifiable fields on UPDATE
allow update: if request.auth.uid == userId
  && request.resource.data.diff(resource.data)
     .affectedKeys()
     .hasOnly(['displayName', 'avatarUrl']);
```

### Subcollection Trap

Subcollections are **NOT** secured by parent rules. Each subcollection needs its own explicit rules. AI assistants frequently miss this.

### Data Validation

Validate data types and sizes on writes:
```
allow create: if request.resource.data.displayName is string
  && request.resource.data.displayName.size() <= 50;
```

Enforce server timestamps:
```
allow create: if request.resource.data.createdAt == request.time;
```

### Role Checks

Use custom claims (`request.auth.token.role`) instead of querying a users document. Custom claims can't be tampered with by the user and don't require extra reads.

### Cloud Storage Rules

Must validate `contentType`, `size`, and path ownership. Without this, users can upload executables or store files in other users' paths.


## Convex

- Every public `query` and `mutation` must call `ctx.auth.getUserIdentity()` and handle the unauthenticated case.
- Mutations must verify ownership — checking auth is not enough. Verify the user owns the specific resource they're modifying.
- Functions only called internally must use `internalQuery` / `internalMutation` / `internalAction`, not `query` / `mutation`. Public functions are callable by anyone.
