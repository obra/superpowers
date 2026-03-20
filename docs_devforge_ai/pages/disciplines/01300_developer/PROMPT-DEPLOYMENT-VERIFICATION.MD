# Prompt Hot-Reload Deployment Verification Guide

## Overview

This document provides comprehensive verification procedures for validating the prompt hot-reload functionality after deployment. It includes pre-deployment checks, post-deployment validation, and troubleshooting steps.

## Verification Checklist

### Pre-Deployment Verification

#### 1. Environment Configuration
- [ ] SUPABASE_URL is configured
- [ ] SUPABASE_SERVICE_KEY is configured
- [ ] PROMPT_API_BASE_URL is configured
- [ ] PROMPT_HOT_RELOAD is set to true
- [ ] All environment variables are accessible in CI/CD

#### 2. Database State
- [ ] Prompts table exists in Supabase
- [ ] Service role has access to prompts table
- [ ] RLS policies allow service role access
- [ ] Backup of existing prompts is created

#### 3. Code Quality
- [ ] All tests pass locally
- [ ] No linting errors
- [ ] No security vulnerabilities
- [ ] Code review approved

### Post-Deployment Verification

#### 1. Infrastructure Health
```bash
# Check deployment status
kubectl get deployment -n <environment>

# Check pod status
kubectl get pods -n <environment>

# Check service endpoints
kubectl get svc -n <environment>
```

#### 2. API Endpoint Verification

**Health Check**
```bash
curl -f http://<yourapp-url>/api/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T12:00:00Z"
}
```

**Hot-Reload Status**
```bash
curl -f http://<yourapp-url>/api/prompts/hot-reload/status
```
Expected response:
```json
{
  "success": true,
  "data": {
    "hotReloadEnabled": true,
    "cacheStats": {
      "size": 0,
      "enabled": true,
      "ttlSeconds": 300
    },
    "environment": {
      "nodeEnv": "production"
    }
  }
}
```

#### 3. Prompt Service Verification

**Get All Prompts**
```bash
curl -f http://<yourapp-url>/api/prompts
```
Expected response:
```json
{
  "success": true,
  "data": [...],
  "count": <number of prompts>
}
```

**Get Prompt by Key**
```bash
curl -f http://<yourapp-url>/api/prompts/key/procurement_input_extraction
```
Expected response:
```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "key": "procurement_input_extraction",
    "name": "Procurement Input Extraction",
    "content": "# Procurement Input Extraction\n\n...",
    "version": "active",
    "prompt_type": "extraction",
    "metadata": {...}
  }
}
```

**Get Cache Statistics**
```bash
curl -f http://<yourapp-url>/api/prompts/cache
```
Expected response:
```json
{
  "success": true,
  "data": {
    "size": 0,
    "enabled": true,
    "hotReloadEnabled": true,
    "ttlSeconds": 300
  }
}
```

#### 4. Cache Management Verification

**Clear Cache**
```bash
curl -X POST http://<yourapp-url>/api/prompts/cache/clear \
  -H "Content-Type: application/json"
```
Expected response:
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "clearedCount": 0
}
```

**Verify Cache Cleared**
```bash
curl -f http://<yourapp-url>/api/prompts/cache
```
Expected: `"size": 0`

#### 5. Hot-Reload Workflow Verification

**Test Full Workflow**
```bash
cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
node scripts/test-hot-reload.js
```

Expected output:
```
🚀 Starting hot-reload functionality tests...
=============================================

✅ API connectivity test passed
✅ API endpoint test passed
✅ API endpoint test passed
✅ API endpoint test passed
✅ Prompt loaded successfully from database
✅ API endpoint test passed
✅ API endpoint test passed
✅ Hot-reload with update test passed

✅ All tests passed successfully!

📋 Summary:
   ✓ API connectivity
   ✓ Prompt retrieval by key
   ✓ Get all prompts
   ✓ Cache statistics
   ✓ PromptService loading
   ✓ Cache clearing
   ✓ Prompt reloading
   ✓ Hot-reload with update

🎉 Hot-reload functionality is working correctly!
```

## Automated Verification Script

Create `verify-deployment.sh`:

```bash
#!/bin/bash
# verify-deployment.sh

set -e

echo "🔍 Starting deployment verification..."

# Configuration
APP_URL="${1:-http://localhost:3060}"
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if environment variables are set
check_env_vars() {
    log_info "Checking environment variables..."
    
    if [ -z "$SUPABASE_URL" ]; then
        log_error "SUPABASE_URL is not set"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_KEY" ]; then
        log_error "SUPABASE_SERVICE_KEY is not set"
        exit 1
    fi
    
    log_info "Environment variables configured"
}

# Check API health
check_api_health() {
    log_info "Checking API health..."
    
    if curl -f -s "$APP_URL/api/health" > /dev/null; then
        log_info "API health check passed"
    else
        log_error "API health check failed"
        exit 1
    fi
}

# Check hot-reload status
check_hot_reload_status() {
    log_info "Checking hot-reload status..."
    
    response=$(curl -s "$APP_URL/api/prompts/hot-reload/status")
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        hot_reload_enabled=$(echo "$response" | jq -r '.data.hotReloadEnabled')
        if [ "$hot_reload_enabled" = "true" ]; then
            log_info "Hot-reload is enabled"
        else
            log_warn "Hot-reload is not enabled"
        fi
    else
        log_error "Failed to check hot-reload status"
        exit 1
    fi
}

# Check prompt endpoints
check_prompt_endpoints() {
    log_info "Checking prompt endpoints..."
    
    # Get all prompts
    response=$(curl -s "$APP_URL/api/prompts")
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        count=$(echo "$response" | jq -r '.count')
        log_info "Found $count prompts in database"
    else
        log_error "Failed to get prompts"
        exit 1
    fi
    
    # Get specific prompt
    response=$(curl -s "$APP_URL/api/prompts/key/procurement_input_extraction")
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        prompt_key=$(echo "$response" | jq -r '.data.key')
        log_info "Successfully retrieved prompt with key: $prompt_key"
    else
        log_error "Failed to get prompt by key"
        exit 1
    fi
}

# Check cache
check_cache() {
    log_info "Checking cache..."
    
    response=$(curl -s "$APP_URL/api/prompts/cache")
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        size=$(echo "$response" | jq -r '.data.size')
        enabled=$(echo "$response" | jq -r '.data.enabled')
        
        if [ "$enabled" = "true" ]; then
            log_info "Cache is enabled, size: $size"
        else
            log_warn "Cache is disabled"
        fi
    else
        log_error "Failed to check cache"
        exit 1
    fi
}

# Clear cache and verify
test_cache_clear() {
    log_info "Testing cache clear..."
    
    response=$(curl -s -X POST "$APP_URL/api/prompts/cache/clear" \
        -H "Content-Type: application/json")
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        log_info "Cache cleared successfully"
        
        # Verify cache is cleared
        response=$(curl -s "$APP_URL/api/prompts/cache")
        size=$(echo "$response" | jq -r '.data.size')
        
        if [ "$size" = "0" ]; then
            log_info "Cache verified as empty"
        else
            log_warn "Cache size is $size after clear"
        fi
    else
        log_error "Failed to clear cache"
        exit 1
    fi
}

# Test reload endpoint
test_reload() {
    log_info "Testing reload endpoint..."
    
    response=$(curl -s -X POST "$APP_URL/api/prompts/reload" \
        -H "Content-Type: application/json" \
        -d '{"promptKey": "procurement_input_extraction", "version": "active"}')
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        log_info "Reload endpoint works correctly"
    else
        log_error "Failed to test reload endpoint"
        exit 1
    fi
}

# Run sync script test
test_sync_script() {
    log_info "Testing sync script..."
    
    cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    
    if node scripts/sync-prompts-to-database.js --action=test > /dev/null 2>&1; then
        log_info "Sync script test passed"
    else
        log_error "Sync script test failed"
        exit 1
    fi
}

# Run hot-reload tests
test_hot_reload() {
    log_info "Running hot-reload tests..."
    
    cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
    
    if node scripts/test-hot-reload.js > /dev/null 2>&1; then
        log_info "Hot-reload tests passed"
    else
        log_error "Hot-reload tests failed"
        exit 1
    fi
}

# Main verification flow
main() {
    echo "========================================="
    echo "   DEPLOYMENT VERIFICATION SCRIPT"
    echo "========================================="
    echo ""
    
    check_env_vars
    echo ""
    
    check_api_health
    echo ""
    
    check_hot_reload_status
    echo ""
    
    check_prompt_endpoints
    echo ""
    
    check_cache
    echo ""
    
    test_cache_clear
    echo ""
    
    test_reload
    echo ""
    
    test_sync_script
    echo ""
    
    test_hot_reload
    echo ""
    
    echo "========================================="
    echo "✅ ALL VERIFICATIONS PASSED!"
    echo "========================================="
    echo ""
    echo "Hot-reload functionality is working correctly."
    echo "Deployment verified successfully."
}

# Run main function
main
```

Make it executable:
```bash
chmod +x verify-deployment.sh
```

Run it:
```bash
./verify-deployment.sh http://yourapp.com
```

## Database Verification Queries

### Check Database Connection

```sql
-- Verify prompts table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'prompts';

-- Check prompt counts
SELECT COUNT(*) as total_prompts FROM prompts;
SELECT COUNT(*) as active_prompts FROM prompts WHERE status = 'active';

-- Check prompt versions
SELECT key, COUNT(*) as version_count 
FROM prompts 
GROUP BY key 
ORDER BY version_count DESC;
```

### Verify Data Integrity

```sql
-- Check for duplicate prompt keys
SELECT key, COUNT(*) as count 
FROM prompts 
GROUP BY key 
HAVING COUNT(*) > 1;

-- Check for missing required fields
SELECT COUNT(*) as incomplete_records
FROM prompts 
WHERE key IS NULL OR name IS NULL OR content IS NULL;

-- Verify prompt structure
SELECT 
  key,
  name,
  prompt_type,
  version,
  created_at,
  updated_at
FROM prompts 
LIMIT 10;
```

## Performance Verification

### Response Time Testing

```bash
# Test API response times
time curl -s http://yourapp.com/api/prompts > /dev/null

# Test with multiple requests
for i in {1..10}; do
  curl -s http://yourapp.com/api/prompts/key/procurement_input_extraction > /dev/null
done

# Test concurrent requests
for i in {1..50}; do
  curl -s http://yourapp.com/api/prompts > /dev/null &
done
wait
```

### Database Query Performance

```sql
-- Check query performance
EXPLAIN ANALYZE 
SELECT * FROM prompts WHERE key = 'procurement_input_extraction';

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'prompts';
```

## Monitoring and Alerts

### Set Up Monitoring

```yaml
# prometheus-config.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'yourapp-api'
    static_configs:
      - targets: ['yourapp:3060']
    metrics_path: '/api/metrics'
```

### Alert Rules

```yaml
# alert-rules.yml
groups:
  - name: hot-reload-alerts
    rules:
      - alert: APIHealthDown
        expr: up{job="yourapp-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API health check failed"
          description: "API has been down for more than 1 minute"
      
      - alert: CacheSizeHigh
        expr: prompts_cache_size > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Cache size is high"
          description: "Cache has more than 1000 items"
      
      - alert: PromptSyncFailed
        expr: increase(prompts_sync_failures_total[1h]) > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Prompt sync failed"
          description: "Prompt sync operation failed in the last hour"
```

### Log Analysis

```bash
# Check for errors
kubectl logs -n <environment> deployment/yourapp | grep -i error

# Monitor cache operations
kubectl logs -n <environment> deployment/yourapp | grep -i cache

# Monitor sync operations
kubectl logs -n <environment> deployment/yourapp | grep -i sync
```

## Troubleshooting Guide

### Issue: API Not Responding

**Symptoms**: Health check fails, 5xx errors

**Troubleshooting Steps**:
1. Check pod status:
   ```bash
   kubectl get pods -n <environment>
   kubectl describe pod <pod-name> -n <environment>
   ```

2. Check logs:
   ```bash
   kubectl logs -n <environment> deployment/yourapp --tail=100
   ```

3. Check environment variables:
   ```bash
   kubectl exec -n <environment> deployment/yourapp -- env | grep SUPABASE
   ```

4. Verify database connection:
   ```bash
   kubectl exec -n <environment> deployment/yourapp -- \
     node -e "const { createClient } = require('@supabase/supabase-js'); \
     const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); \
     client.from('prompts').select('count').then(console.log).catch(console.error);"
   ```

### Issue: Prompts Not Loading

**Symptoms**: Empty prompt list, prompt not found errors

**Troubleshooting Steps**:
1. Check database content:
   ```sql
   SELECT COUNT(*) FROM prompts;
   SELECT * FROM prompts LIMIT 5;
   ```

2. Check sync script logs:
   ```bash
   cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
   node scripts/sync-prompts-to-database.js --action=test --verbose
   ```

3. Check permissions:
   ```sql
   SELECT table_name, grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'prompts' 
   AND grantee = 'postgres';
   ```

### Issue: Cache Not Working

**Symptoms**: Cache size stays at 0, poor performance

**Troubleshooting Steps**:
1. Check cache configuration:
   ```bash
   kubectl exec -n <environment> deployment/yourapp -- \
     env | grep PROMPT_HOT_RELOAD
   ```

2. Check cache operations:
   ```bash
   kubectl logs -n <environment> deployment/yourapp | grep -i "cache"
   ```

3. Test cache manually:
   ```bash
   curl -X POST http://yourapp.com/api/prompts/cache/clear
   curl http://yourapp.com/api/prompts/cache
   ```

### Issue: Hot-Reload Not Triggering

**Symptoms**: Prompt changes not reflected without restart

**Troubleshooting Steps**:
1. Verify hot-reload is enabled:
   ```bash
   curl http://yourapp.com/api/prompts/hot-reload/status
   ```

2. Check environment variable:
   ```bash
   kubectl exec -n <environment> deployment/yourapp -- \
     env | grep PROMPT_HOT_RELOAD
   ```

3. Check file system access (if using filesystem fallback):
   ```bash
   kubectl exec -n <environment> deployment/yourapp -- \
     ls -la /app/prompt-files/
   ```

### Issue: Sync Script Failures

**Symptoms**: CI/CD pipeline fails during sync

**Troubleshooting Steps**:
1. Run sync script manually with verbose output:
   ```bash
   cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent
   node scripts/sync-prompts-to-database.js --action=test --verbose
   ```

2. Check file permissions:
   ```bash
   cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent/prompts
   ls -la
   ```

3. Verify markdown file syntax:
   ```bash
   # Check for syntax errors in MD files
   cd deep-agents/deep_agents/agents/pages/01900-procurement/input-agent/prompts
   for file in *.md; do
     echo "Checking $file..."
     node -e "const fs = require('fs'); const content = fs.readFileSync('$file', 'utf8'); console.log('OK');"
   done
   ```

## Performance Benchmarks

### Expected Performance Metrics

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| API Health Response | < 100ms | < 500ms | > 1s |
| Prompt Retrieval | < 200ms | < 1s | > 2s |
| Cache Hit Rate | > 95% | > 80% | < 50% |
| Sync Script Duration | < 30s | < 60s | > 120s |
| Hot-Reload Latency | < 100ms | < 500ms | > 1s |

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://yourapp.com/api/prompts

# Using wrk
wrk -t12 -c400 -d30s http://yourapp.com/api/prompts

# Using k6
k6 run --vus 50 --duration 30s script.js
```

## Rollback Verification

### After Rollback

```bash
# 1. Verify deployment rolled back
kubectl get deployment -n <environment>

# 2. Verify old prompts restored
curl http://yourapp.com/api/prompts

# 3. Verify hot-reload still works
curl http://yourapp.com/api/prompts/hot-reload/status

# 4. Run verification script
./verify-deployment.sh http://yourapp.com
```

### Rollback Validation Checklist

- [ ] Previous version deployed successfully
- [ ] Database backup restored
- [ ] API endpoints responding
- [ ] Prompts accessible
- [ ] Hot-reload functionality works
- [ ] No errors in logs
- [ ] Performance acceptable

## Success Criteria

### Deployment Success Metrics

1. **Infrastructure**:
   - All pods running and healthy
   - Services accessible
   - Database connectivity confirmed

2. **Functionality**:
   - All API endpoints responding with 200 OK
   - Prompt retrieval working
   - Cache operations successful
   - Hot-reload triggers correctly

3. **Performance**:
   - Response times within acceptable range
   - Cache hit rate > 80%
   - No significant performance degradation

4. **Testing**:
   - Sync script test passes
   - Hot-reload tests pass
   - Integration tests pass

5. **Monitoring**:
   - Health checks passing
   - No critical alerts
   - Logs clean of errors

## Documentation Updates

After successful deployment:

1. **Update Deployment Records**:
   - Date/time of deployment
   - Version deployed
   - Commit hash
   - Changes deployed

2. **Update Runbook**:
   - Add any new procedures
   - Update troubleshooting steps
   - Note any lessons learned

3. **Update Alerts**:
   - Add new monitoring rules if needed
   - Update alert thresholds
   - Document false positives

## Post-Deployment Monitoring

### 24-Hour Monitoring

```bash
#!/bin/bash
# monitor-24h.sh

echo "Starting 24-hour monitoring..."

for i in {1..24}; do
  echo "Hour $i: $(date)"
  
  # Check API health
  curl -s http://yourapp.com/api/health | jq -r '.status'
  
  # Check hot-reload status
  curl -s http://yourapp.com/api/prompts/hot-reload/status | jq -r '.data.hotReloadEnabled'
  
  # Check prompt count
  count=$(curl -s http://yourapp.com/api/prompts | jq -r '.count')
  echo "  Prompts: $count"
  
  # Check cache size
  cache_size=$(curl -s http://yourapp.com/api/prompts/cache | jq -r '.data.size')
  echo "  Cache: $cache_size"
  
  sleep 3600
done
```

### Weekly Review

1. **Performance Metrics**:
   - Average response times
   - Cache hit rates
   - Error rates

2. **Usage Statistics**:
   - Number of prompt retrievals
   - Cache clear operations
   - Hot-reload triggers

3. **Issues Identified**:
   - Any recurring errors
   - Performance degradation
   - User complaints

## Emergency Contacts

For urgent issues:

| Role | Contact | Response Time |
|------|---------|---------------|
| DevOps Lead | devops@yourcompany.com | 15 minutes |
| Database Admin | dba@yourcompany.com | 30 minutes |
| Security Team | security@yourcompany.com | 1 hour |
| Development Lead | devlead@yourcompany.com | 1 hour |

## Conclusion

### Success Definition

A deployment is considered successful when:

1. ✅ All automated verification tests pass
2. ✅ Manual verification confirms functionality
3. ✅ Performance benchmarks are met
4. ✅ No critical errors in logs
5. ✅ Monitoring systems show healthy status
6. ✅ Rollback procedure tested and verified

### Next Steps After Success

1. **Document Learnings**: Capture any issues or improvements
2. **Update Procedures**: Refine deployment process if needed
3. **Share Knowledge**: Document for team reference
4. **Plan Next**: Schedule next deployment iteration

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-27  
**Author**: DevOps Team  
**Status**: Production Ready

**Related Documents**:
- [Hot-Reload Procedure](0000_PROMPT_HOT_RELOAD_PROCEDURE.md)
- [Synchronization Procedure](0000_PROMPT_SYNCHRONIZATION_PROCEDURE.md)
- [Deployment Pipeline](0000_PROMPT_SYNC_DEPLOYMENT_PIPELINE.md)