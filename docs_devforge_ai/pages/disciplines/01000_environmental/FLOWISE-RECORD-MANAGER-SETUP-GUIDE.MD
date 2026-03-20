# Flowise Record Manager Setup Guide (1362)

## Overview

This guide provides step-by-step instructions for setting up and configuring the PostgreSQL Record Manager for Flowise Document Store integration. The Record Manager prevents duplicate embeddings and efficiently manages document lifecycle by tracking which chunks have been processed.

**Important Benefits:**
- **Prevents Duplicates**: Avoids storing duplicate embeddings when re-uploading documents
- **Efficient Updates**: Only processes changed content during document updates
- **Lifecycle Management**: Tracks document versions and manages cleanup
- **Cost Optimization**: Reduces unnecessary embedding API calls

## Prerequisites

- Supabase project with PostgreSQL database
- Flowise instance with Document Store capability
- Admin access to Supabase SQL Editor
- Environment variables configured for Supabase connection

## Phase 1: Database Setup

### Step 1: Create Record Manager Table

Execute the following SQL script in your Supabase SQL Editor:

```sql
-- Run this script in Supabase SQL Editor
-- File: sql/create_flowise_record_manager_table.sql

-- Create Flowise Record Manager table for PostgreSQL/Supabase
CREATE TABLE IF NOT EXISTS public.flowise_record_manager (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    group_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flowise_record_manager_key ON public.flowise_record_manager(key);
CREATE INDEX IF NOT EXISTS idx_flowise_record_manager_group_id ON public.flowise_record_manager(group_id);
CREATE INDEX IF NOT EXISTS idx_flowise_record_manager_updated_at ON public.flowise_record_manager(updated_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.flowise_record_manager ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.flowise_record_manager
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policy for service role
CREATE POLICY "Enable all operations for service role" ON public.flowise_record_manager
    FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_flowise_record_manager_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flowise_record_manager_updated_at
    BEFORE UPDATE ON public.flowise_record_manager
    FOR EACH ROW
    EXECUTE FUNCTION update_flowise_record_manager_updated_at();
```

### Step 2: Verify Table Creation

Check that the table was created successfully:

```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'flowise_record_manager'
AND table_schema = 'public';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'flowise_record_manager'
AND schemaname = 'public';
```

Expected output should show:
- `uuid` (UUID, Primary Key)
- `key` (TEXT, NOT NULL, UNIQUE)
- `group_id` (TEXT, Nullable)
- `updated_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `metadata` (JSONB)

## Phase 2: Environment Configuration

### Step 1: Verify Environment Variables

Ensure your `.env` file contains the required Supabase configuration:

```bash
# Supabase Configuration (Required for Record Manager)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Record Manager Configuration (Transaction Pooler)
RECORD_MANAGER_HOST=aws-0-eu-central-1.pooler.supabase.com
RECORD_MANAGER_PORT=6543
RECORD_MANAGER_DATABASE=postgres
RECORD_MANAGER_USER=postgres.mseizswoiwyewsidknta
RECORD_MANAGER_PASSWORD=your_database_password
RECORD_MANAGER_POOL_MODE=transaction

# Flowise Configuration
FLOWISE_URL=https://flowise-l8hx.onrender.com
FLOWISE_API_KEY=your_flowise_api_key_here
```

### Transaction Pooler Configuration

The Record Manager uses Supabase's **Transaction pooler** for optimal performance with stateless applications like serverless functions. This configuration provides:

**Benefits:**
- **Ideal for serverless**: Each interaction with PostgreSQL is brief and isolated
- **Connection efficiency**: Reduces connection overhead for short-lived operations
- **Better performance**: Optimized for the Record Manager's usage pattern
- **Scalability**: Handles concurrent document processing efficiently

**Connection Details:**
- **Pool Mode**: `transaction` (shared pooler)
- **Port**: `6543` (transaction pooler port)
- **Host**: `aws-0-eu-central-1.pooler.supabase.com`
- **Database**: `postgres`
- **User**: `postgres.mseizswoiwyewsidknta`

**Important Notes:**
- Does not support PREPARE statements (not needed for Record Manager)
- Perfect for the Record Manager's insert/update/select operations
- Automatically handles connection pooling and cleanup

### Step 2: Test Database Connection

Create a test script to verify the connection:

```javascript
// test-record-manager-connection.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('flowise_record_manager')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('Connection failed:', error);
      return false;
    }

    console.log('✅ Record Manager table connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

testConnection();
```

Run the test:
```bash
node test-record-manager-connection.js
```

## Phase 3: Integration Verification

### Step 1: Test Template-Based Upload with Record Manager

The Record Manager is automatically integrated when using template-based uploads. Test with a sample document:

```javascript
// Example usage in your application
import { uploadDocumentWithTemplate } from '@utils/document-upload-service';

const testUpload = async () => {
  const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
  
  const metadata = {
    title: 'Test Document',
    description: 'Testing Record Manager integration',
    store_id: 'your-store-id',
    discipline: 'testing'
  };

  try {
    const result = await uploadDocumentWithTemplate(file, metadata, '00435');
    console.log('Upload successful with Record Manager:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Step 2: Verify Record Manager Entries

After uploading a document, check the Record Manager table:

```sql
-- Check recent Record Manager entries
SELECT 
    uuid,
    key,
    group_id,
    created_at,
    updated_at,
    metadata
FROM public.flowise_record_manager
ORDER BY created_at DESC
LIMIT 10;
```

You should see entries with:
- **key**: Unique hash of document chunk content
- **group_id**: Page prefix (e.g., "00435")
- **metadata**: Additional tracking information

### Step 3: Test Duplicate Prevention

Upload the same document twice and verify no duplicate embeddings are created:

1. Upload a document using template-based upload
2. Note the number of records in `flowise_record_manager`
3. Upload the same document again
4. Verify the record count hasn't increased (duplicates prevented)

```sql
-- Monitor record count during duplicate test
SELECT 
    group_id,
    COUNT(*) as record_count,
    MAX(updated_at) as last_updated
FROM public.flowise_record_manager
GROUP BY group_id
ORDER BY last_updated DESC;
```

## Phase 4: Monitoring and Maintenance

### Step 1: Record Manager Health Monitoring

Create monitoring queries to track Record Manager health:

```sql
-- Record Manager statistics
SELECT 
    group_id,
    COUNT(*) as total_records,
    MIN(created_at) as first_record,
    MAX(updated_at) as last_updated,
    COUNT(DISTINCT DATE(created_at)) as active_days
FROM public.flowise_record_manager
GROUP BY group_id
ORDER BY total_records DESC;

-- Recent activity
SELECT 
    group_id,
    COUNT(*) as records_today
FROM public.flowise_record_manager
WHERE created_at >= CURRENT_DATE
GROUP BY group_id
ORDER BY records_today DESC;
```

### Step 2: Cleanup and Maintenance

Periodically clean up old or orphaned records:

```sql
-- Find potentially orphaned records (older than 30 days with no recent updates)
SELECT 
    uuid,
    key,
    group_id,
    created_at,
    updated_at
FROM public.flowise_record_manager
WHERE updated_at < NOW() - INTERVAL '30 days'
ORDER BY updated_at ASC;

-- Clean up test records (if needed)
DELETE FROM public.flowise_record_manager
WHERE group_id = 'test' 
AND created_at < NOW() - INTERVAL '7 days';
```

### Step 3: Performance Optimization

Monitor and optimize Record Manager performance:

```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'flowise_record_manager';

-- Analyze table statistics
ANALYZE public.flowise_record_manager;
```

## Troubleshooting

### Common Issues

#### 1. Connection String Format Error
**Symptoms**: "Invalid connection string" errors
**Solutions**:
- Verify Supabase URL format: `https://[project-ref].supabase.co`
- Check service role key is correct
- Ensure no extra spaces in environment variables

#### 2. Permission Denied Errors
**Symptoms**: "permission denied for table flowise_record_manager"
**Solutions**:
- Verify RLS policies are correctly configured
- Check service role has necessary permissions
- Ensure table was created in `public` schema

#### 3. Duplicate Key Violations
**Symptoms**: "duplicate key value violates unique constraint"
**Solutions**:
- This is expected behavior - Record Manager is preventing duplicates
- Check that `replaceExisting: true` is set in upload options
- Verify key generation is working correctly

#### 4. Performance Issues
**Symptoms**: Slow upload times with Record Manager
**Solutions**:
- Check index usage with monitoring queries
- Consider partitioning for very large datasets
- Monitor connection pool usage

### Debug Mode

Enable detailed logging for Record Manager operations:

```bash
# Add to .env for debugging
DEBUG_RECORD_MANAGER=true
LOG_LEVEL=debug
```

### Health Check Endpoints

Test Record Manager health programmatically:

```javascript
// Health check function
async function checkRecordManagerHealth() {
  try {
    const { data, error } = await supabase
      .from('flowise_record_manager')
      .select('count(*)')
      .limit(1);

    return {
      status: error ? 'unhealthy' : 'healthy',
      error: error?.message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
```

## Security Considerations

### Row Level Security (RLS)

The Record Manager table includes RLS policies to ensure secure access:

```sql
-- Review current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'flowise_record_manager';
```

### Access Control

- **Service Role**: Full access for server-side operations
- **Authenticated Users**: Limited access based on RLS policies
- **Anonymous Users**: No access (blocked by RLS)

## Performance Benchmarks

Expected performance metrics:

- **Insert Rate**: 1000+ records/second
- **Query Response**: <100ms for typical lookups
- **Index Efficiency**: >95% index hit ratio
- **Storage Growth**: ~100 bytes per document chunk

## Success Verification

Verify successful Record Manager setup:

- ✅ Table created with correct schema
- ✅ Indexes created and functioning
- ✅ RLS policies active and working
- ✅ Environment variables configured
- ✅ Connection string working
- ✅ Template uploads using Record Manager
- ✅ Duplicate prevention working
- ✅ Monitoring queries returning data

## Next Steps

After successful Record Manager setup:

1. **Monitor Usage**: Track record growth and performance
2. **Optimize Queries**: Fine-tune based on usage patterns
3. **Backup Strategy**: Include Record Manager in backup procedures
4. **Scaling Planning**: Plan for growth in document volume
5. **Integration Testing**: Test with production-like data volumes

---

**Setup Version**: 1.0  
**Last Updated**: 2025-06-28  
**Tested On**: Supabase PostgreSQL 15+  
**Production Ready**: Yes (with proper monitoring)
