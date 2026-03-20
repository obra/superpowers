# Procurement Performance APIs - Test Data Population

## Overview

This directory contains test data population scripts for the three new procurement performance APIs that were created to provide data for the procurement performance dashboard stats cards.

## APIs Created

### 1. HITL Performance API
- **Endpoint**: `GET /api/hitl/performance`
- **Service**: `server/src/services/hitl-performance-service.js`
- **Route**: `server/src/routes/hitl-performance-routes.js`
- **Table**: `hitl_interventions`
- **Purpose**: Tracks Human-In-The-Loop intervention performance metrics

### 2. Sequence Performance API
- **Endpoint**: `GET /api/sequence/performance`
- **Service**: `server/src/services/sequence-performance-service.js`
- **Route**: `server/src/routes/sequence-performance-routes.js`
- **Tables**: `sequence_executions`, `task_sequences`
- **Purpose**: Tracks sequence intelligence engine performance metrics

### 3. Quality Procurement Metrics API
- **Endpoint**: `GET /api/quality/procurement-metrics`
- **Service**: `server/src/services/quality-procurement-metrics-service.js`
- **Route**: `server/src/routes/quality-procurement-metrics-routes.js`
- **Tables**: `quality_inspections`, `procurement_quality_audits`, `compliance_checks`
- **Purpose**: Tracks quality assurance system metrics for procurement

## Test Data Population Scripts

### Prerequisites

Before running the test data scripts, ensure you have:

1. **Environment Variables Set**:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Tables Created** (if they don't exist):
   - `hitl_interventions`
   - `sequence_executions`
   - `task_sequences`
   - `quality_inspections`
   - `procurement_quality_audits`
   - `compliance_checks`

### Running Test Data Scripts

#### 1. HITL Performance Data
```bash
# Dry run (recommended first)
node test-data-population-hitl.js --dry-run

# Populate with verbose output
node test-data-population-hitl.js --verbose

# Populate silently
node test-data-population-hitl.js
```

#### 2. Sequence Performance Data
```bash
# Dry run
node test-data-population-sequence.js --dry-run

# Populate with verbose output
node test-data-population-sequence.js --verbose

# Populate silently
node test-data-population-sequence.js
```

#### 3. Quality Procurement Metrics Data
```bash
# Dry run
node test-data-population-quality.js --dry-run

# Populate with verbose output
node test-data-population-quality.js --verbose

# Populate silently
node test-data-population-quality.js
```

### Batch Execution
```bash
# Run all scripts in sequence
node test-data-population-hitl.js --verbose && \
node test-data-population-sequence.js --verbose && \
node test-data-population-quality.js --verbose
```

## Expected Data Structure

### HITL Interventions Table
```sql
CREATE TABLE hitl_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'resolved', 'escalated')),
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  escalation_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL
);
```

### Sequence Executions Table
```sql
CREATE TABLE sequence_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  parallel_groups INTEGER DEFAULT 1,
  estimated_sequential_time BIGINT,
  actual_duration BIGINT,
  optimization_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL
);
```

### Task Sequences Table
```sql
CREATE TABLE task_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id TEXT NOT NULL,
  resources_used INTEGER DEFAULT 0,
  resources_allocated INTEGER DEFAULT 1,
  task_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL
);
```

### Quality Inspections Table
```sql
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
  supplier_id TEXT,
  defects_found JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL
);
```

### Procurement Quality Audits Table
```sql
CREATE TABLE procurement_quality_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL,
  findings JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL
);
```

### Compliance Checks Table
```sql
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('compliant', 'non_compliant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_id UUID NOT NULL
);
```

## Testing the APIs

After populating test data, you can test the APIs directly:

```bash
# Test HITL Performance API
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-organization-id: 90cd635a-380f-4586-a3b7-a09103b6df94" \
     "http://localhost:3060/api/hitl/performance"

# Test Sequence Performance API
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-organization-id: 90cd635a-380f-4586-a3b7-a09103b6df94" \
     "http://localhost:3060/api/sequence/performance"

# Test Quality Procurement Metrics API
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "x-organization-id: 90cd635a-380f-4586-a3b7-a09103b6df94" \
     "http://localhost:3060/api/quality/procurement-metrics"
```

## Integration with Procurement Performance Page

The procurement performance page (`/procurement-performance`) automatically calls these APIs and displays the data in the stats cards. With test data populated, you should see:

- **On-Time Delivery**: Data from performance metrics API
- **Cost Savings**: Data from performance metrics API
- **Supplier Satisfaction**: Data from performance metrics API
- **Compliance Rate**: Data from quality metrics API
- **Processing Time**: Data from sequence metrics API
- **Active Orders**: Data from HITL metrics API

## Troubleshooting

### Common Issues

1. **"Table does not exist" errors**: Create the required database tables first
2. **Authentication errors**: Ensure you're using the correct API tokens
3. **Organization scoping**: Make sure `x-organization-id` header is set correctly
4. **RLS policy violations**: Use service role key for data population

### Verification Steps

1. **Check table existence**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('hitl_interventions', 'sequence_executions', 'task_sequences', 'quality_inspections', 'procurement_quality_audits', 'compliance_checks');
   ```

2. **Verify data insertion**:
   ```sql
   SELECT COUNT(*) as record_count FROM hitl_interventions;
   SELECT COUNT(*) as record_count FROM sequence_executions;
   SELECT COUNT(*) as record_count FROM quality_inspections;
   ```

3. **Test API responses**:
   - Check that APIs return HTTP 200
   - Verify response contains expected data structure
   - Confirm metrics calculations are correct

## Performance Metrics

The test data scripts include realistic performance metrics:

- **HITL Performance**: 90% success rate, 2.5-hour average resolution time
- **Sequence Performance**: 80% success rate, parallel execution optimization
- **Quality Metrics**: 85% inspection pass rate, 95% compliance rate

These metrics provide a good baseline for testing the procurement performance dashboard functionality.
