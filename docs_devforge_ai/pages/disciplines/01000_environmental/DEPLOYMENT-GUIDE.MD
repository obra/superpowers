# VectorIsolationSection Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the VectorIsolationSection implementation to production. The deployment includes frontend components, backend APIs, database schema changes, and security infrastructure.

## Pre-Deployment Checklist

### ✅ Environment Requirements
- [ ] PostgreSQL database (version 13+)
- [ ] Node.js 18+ runtime
- [ ] Supabase account with service role access
- [ ] SSL/TLS certificates configured
- [ ] Environment variables configured

### ✅ Permissions & Access
- [ ] Database admin access for migrations
- [ ] File system write permissions for deployments
- [ ] Access to CI/CD pipelines
- [ ] Security team approval for production deployment

### ✅ Testing Validation
- [ ] All unit tests passing (`./test-runner.sh client`)
- [ ] All API tests passing (`./test-runner.sh server`)
- [ ] E2E tests passing (if environment available)
- [ ] Database migration syntax validated

### ✅ Backup & Recovery
- [ ] Database backup completed (< 24 hours old)
- [ ] Rollback plan documented
- [ ] Previous deployment version tagged
- [ ] Support team on standby

## Deployment Phases

### Phase 1: Database Migration

#### Step 1: Backup Database
```bash
# Create production database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > vector_isolation_pre_deployment_$(date +%Y%m%d_%H%M%S).sql

# Verify backup integrity
pg_restore --list vector_isolation_pre_deployment_*.sql | head -10
```

#### Step 2: Run Migration in Staging First
```bash
# Test migration on staging environment
export DATABASE_URL="postgresql://user:password@staging-host:5432/staging-db"

# Run the migration
psql $DATABASE_URL -f server/sql/vector_isolation_production_migration.sql

# Validate migration results
psql $DATABASE_URL -c "
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'a_%_vector'
ORDER BY tablename;
"
```

#### Step 3: Deploy to Production
```bash
# Set production database connection
export DATABASE_URL="postgresql://user:password@prod-host:5432/prod-db"

# Execute production migration
psql $DATABASE_URL -f server/sql/vector_isolation_production_migration.sql

# Verify migration success
psql $DATABASE_URL -c "
SELECT
    COUNT(*) as total_vector_tables,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as rls_enabled_tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'a_%_vector';
"
```

#### Step 4: Validate Migration Results
```sql
-- Check that all tables have isolation columns
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'a_%_vector'
  AND column_name IN ('access_scope', 'created_by_user_id', 'workspace_id')
ORDER BY table_name, ordinal_position;

-- Verify RLS policies are active
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    policies.polname as policy_name
FROM pg_tables t
LEFT JOIN pg_policies policies ON policies.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename LIKE 'a_%_vector';

-- Check workspace creation
SELECT COUNT(*) as default_workspaces_created
FROM vector_workspaces
WHERE name = 'My Documents';
```

### Phase 2: Application Deployment

#### Step 1: Build Application
```bash
# Install dependencies
npm ci

# Build client application
npm run build:client

# Build server application
npm run build:server

# Run tests before deployment
./test-runner.sh client
./test-runner.sh server
```

#### Step 2: Environment Configuration
```bash
# Set production environment variables
export NODE_ENV=production
export VECTOR_ISOLATION_ENABLED=false  # Initially disabled
export AUDIT_LOGGING_ENABLED=true
export RATE_LIMIT_ENABLED=true
export SECURITY_HEADERS_ENABLED=true

# Database configuration
export DATABASE_URL="postgresql://user:password@prod-host:5432/prod-db"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Security settings
export JWT_SECRET="your-jwt-secret"
export ENCRYPTION_KEY="your-encryption-key"
```

#### Step 3: Deploy Application Code
```bash
# Using Docker (recommended)
docker build -t vector-isolation-app:latest .
docker tag vector-isolation-app:latest registry.your-company.com/vector-isolation-app:latest
docker push registry.your-company.com/vector-isolation-app:latest

# Deploy to Kubernetes/Docker Swarm/etc.
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/vector-isolation-app
```

#### Alternative: Direct Server Deployment
```bash
# Copy files to production server
scp -r . user@prod-server:/opt/vector-isolation-app/

# Install dependencies on production server
ssh user@prod-server << 'EOF'
cd /opt/vector-isolation-app
npm ci --production
npm run build
EOF

# Restart application service
ssh user@prod-server 'sudo systemctl restart vector-isolation-app'
```

### Phase 3: Feature Flag Activation

#### Step 1: Gradual Rollout Preparation
```bash
# Enable feature flag for 10% of users initially
export VECTOR_ISOLATION_ENABLED=true
export VECTOR_ISOLATION_ROLLOUT_PERCENTAGE=10

# Restart application
kubectl rollout restart deployment/vector-isolation-app
```

#### Step 2: Monitor Initial Usage
```bash
# Monitor application logs
kubectl logs -f deployment/vector-isolation-app | grep -i "vector.isolation"

# Check error rates
curl -s "https://your-api.com/api/metrics" | jq '.error_rate'

# Monitor database performance
psql $DATABASE_URL -c "
SELECT
    schemaname,
    tablename,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'a_%_vector';
"
```

#### Step 3: Gradual Rollout
```bash
# Increase rollout percentage over time
# Day 1: 10%
# Day 2: 25%
# Day 3: 50%
# Day 4: 100%

export VECTOR_ISOLATION_ROLLOUT_PERCENTAGE=25
kubectl rollout restart deployment/vector-isolation-app

# Monitor and repeat for each percentage increase
```

### Phase 4: Post-Deployment Validation

#### Step 1: Functional Testing
```bash
# Test VectorIsolationSection component loads
curl -s "https://your-app.com/pages/01900-procurement" | grep -q "Vector Data Access Control"

# Test API endpoints
curl -X POST "https://your-api.com/api/process" \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@test-file.pdf" \
  -F 'isolation_metadata={"accessScope":"private","workspaceId":"ws-123"}'

# Verify isolation metadata is processed
curl "https://your-api.com/api/vector-isolation/workspaces" \
  -H "Authorization: Bearer $TEST_TOKEN"
```

#### Step 2: Security Validation
```bash
# Test RLS policies
psql $DATABASE_URL -c "
-- Test that users can only see their own private documents
SELECT COUNT(*) FROM a_00435_contracts_post_vector
WHERE access_scope = 'private' AND created_by_user_id != '$TEST_USER_ID';
"

# Test audit logging
psql $DATABASE_URL -c "
SELECT COUNT(*) as audit_entries_today
FROM audit_log_vector_isolation
WHERE created_at >= CURRENT_DATE;
"
```

#### Step 3: Performance Validation
```bash
# Load testing
ab -n 1000 -c 10 -T 'application/json' \
  -H 'Authorization: Bearer $TEST_TOKEN' \
  'https://your-api.com/api/process'

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s \
  "https://your-api.com/api/vector-isolation/workspaces"
```

### Phase 5: Monitoring Setup

#### Step 1: Application Monitoring
```bash
# Enable structured logging
export LOG_LEVEL=info
export LOG_FORMAT=json

# Configure log aggregation
# Example: Send logs to ELK stack or similar
kubectl apply -f monitoring/log-shipping-config.yaml
```

#### Step 2: Database Monitoring
```bash
# Set up database monitoring queries
psql $DATABASE_URL -c "
CREATE OR REPLACE FUNCTION vector_isolation_health_check()
RETURNS JSONB AS $$
SELECT jsonb_build_object(
    'vector_tables_count', (
        SELECT COUNT(*) FROM pg_tables
        WHERE schemaname = 'public' AND tablename LIKE 'a_%_vector'
    ),
    'rls_enabled_count', (
        SELECT COUNT(*) FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname LIKE 'a_%_vector' AND c.relrowsecurity = true
    ),
    'recent_audit_entries', (
        SELECT COUNT(*) FROM audit_log_vector_isolation
        WHERE created_at >= NOW() - INTERVAL '1 hour'
    ),
    'active_workspaces', (
        SELECT COUNT(*) FROM vector_workspaces WHERE is_active = true
    )
);
$$ LANGUAGE SQL;
"
```

#### Step 3: Alert Configuration
```yaml
# Example alerting rules (Prometheus Alertmanager format)
groups:
  - name: vector_isolation_alerts
    rules:
      - alert: VectorIsolationHighErrorRate
        expr: rate(vector_isolation_errors_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in Vector Isolation operations"

      - alert: VectorIsolationRLSViolation
        expr: increase(vector_isolation_rls_violations_total[1h]) > 0
        labels:
          severity: critical
        annotations:
          summary: "RLS policy violation detected"
```

## Rollback Procedures

### Emergency Rollback (Feature Flag)
```bash
# Immediately disable feature
export VECTOR_ISOLATION_ENABLED=false
kubectl rollout restart deployment/vector-isolation-app

# Monitor that feature is disabled
curl -s "https://your-app.com/api/health" | jq '.features.vector_isolation'
```

### Database Rollback
```bash
# Restore from backup (if schema changes need rollback)
psql $DATABASE_URL < vector_isolation_pre_deployment_*.sql

# Alternative: Selective column removal (if safe)
psql $DATABASE_URL -c "
-- WARNING: Only use if confident no data loss
-- ALTER TABLE a_00435_contracts_post_vector DROP COLUMN IF EXISTS access_scope;
-- ALTER TABLE vector_workspaces DROP TABLE IF EXISTS vector_workspaces;
"
```

### Application Rollback
```bash
# Roll back to previous deployment
kubectl rollout undo deployment/vector-isolation-app

# Or redeploy previous version
kubectl apply -f k8s/deployment-previous.yaml
```

## Post-Deployment Activities

### User Training
- [ ] Update user documentation
- [ ] Create training materials for access controls
- [ ] Schedule user training sessions
- [ ] Update help desk procedures

### Team Training
- [ ] Train support team on new features
- [ ] Update security team procedures
- [ ] Train administrators on monitoring tools
- [ ] Document troubleshooting procedures

### Continuous Monitoring
- [ ] Set up automated health checks
- [ ] Configure performance monitoring
- [ ] Establish incident response procedures
- [ ] Schedule regular security audits

## Success Metrics

### Deployment Success Criteria
- [ ] Application starts without errors
- [ ] Database migration completes successfully
- [ ] All existing functionality works
- [ ] VectorIsolationSection loads correctly
- [ ] No security violations in first 24 hours

### Performance Benchmarks
- [ ] API response time < 500ms (95th percentile)
- [ ] Database query time < 100ms average
- [ ] Error rate < 0.1%
- [ ] Feature adoption rate > 50% within 30 days

### Security Validation
- [ ] No unauthorized data access incidents
- [ ] All audit logs functioning correctly
- [ ] Rate limiting working as expected
- [ ] RLS policies enforced properly

## Troubleshooting

### Common Issues

#### Database Migration Fails
```bash
# Check migration logs
psql $DATABASE_URL -c "
SELECT * FROM audit_log_vector_isolation
WHERE operation = 'production_migration_completed'
ORDER BY created_at DESC LIMIT 1;
"

# Verify table creation
psql $DATABASE_URL -c "\dt a_*_vector"
```

#### Application Won't Start
```bash
# Check application logs
kubectl logs deployment/vector-isolation-app --previous

# Verify environment variables
kubectl exec -it deployment/vector-isolation-app -- env | grep VECTOR

# Check database connectivity
kubectl exec -it deployment/vector-isolation-app -- psql $DATABASE_URL -c "SELECT 1"
```

#### Feature Not Working
```bash
# Verify feature flag
curl "https://your-app.com/api/features" | jq '.vector_isolation'

# Check browser console for errors
# Check network tab for failed API calls

# Verify database permissions
psql $DATABASE_URL -c "
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name LIKE 'a_%_vector';
"
```

## Support Contacts

- **Deployment Team**: deployment@company.com
- **Database Team**: database@company.com
- **Security Team**: security@company.com
- **Application Support**: support@company.com
- **Emergency Hotline**: +1-800-DEPLOY

---

## Deployment Checklist

### Pre-Deployment
- [ ] Environment validated
- [ ] Permissions confirmed
- [ ] Tests passing
- [ ] Backup completed
- [ ] Rollback plan ready

### During Deployment
- [ ] Database migration successful
- [ ] Application deployed
- [ ] Feature flag configured
- [ ] Monitoring enabled

### Post-Deployment
- [ ] Functionality validated
- [ ] Performance monitored
- [ ] Security verified
- [ ] Users trained
- [ ] Documentation updated

**Final Sign-off**: ___________________________ Date: __________
**Deployed By**: ___________________________ Reviewed By: __________
