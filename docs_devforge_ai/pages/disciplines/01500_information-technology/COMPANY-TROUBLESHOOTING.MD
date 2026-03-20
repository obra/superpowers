# Company Management Troubleshooting Guide

## Common Issues and Solutions

### 1. Cache-Related Issues

#### Stale Data

**Problem**: Users seeing outdated company settings or UI state
**Solutions**:

- Clear company-specific cache using `CompanyCacheManager.clearCompany(companyId)`
- Verify cache invalidation triggers are properly set up
- Check if path dependencies are correctly tracked
- Ensure cache duration (maxAge) is appropriate for the data type

#### Cache Invalidation

**Problem**: Cache not properly invalidating when company settings change
**Solutions**:

- Verify all cache managers are registered with CacheCoordinator
- Check path patterns in invalidateByPath calls
- Ensure path normalization is consistent
- Review cache coordination implementation

#### Memory Usage

**Problem**: Excessive memory usage from cached data
**Solutions**:

- Implement cache size limits
- Add periodic cache cleanup
- Review cache entry sizes
- Consider implementing LRU (Least Recently Used) strategy

### 2. Path Resolution Issues

#### Invalid Paths

**Problem**: Incorrect path resolution leading to cache misses
**Solutions**:

- Verify PathResolver configuration
- Check path normalization rules
- Ensure consistent use of relative/absolute paths
- Review path cache implementation

#### Path Dependencies

**Problem**: Cached data not updating when dependent paths change
**Solutions**:

- Verify path dependency tracking
- Check path map maintenance
- Review path-based invalidation logic
- Ensure proper path resolution in cache keys

### 3. Company Assignment Issues

#### Role Synchronization

**Problem**: Company role assignments not reflecting in UI
**Solutions**:

1. Clear role cache:

```javascript
await roleManager.clearCache(userId);
```

2. Refresh company assignments:

```javascript
await userManager.refreshCompanyAssignments(userId);
```

3. Verify database state:

```javascript
const { data: assignments } = await supabase
    .from('user_companies')
    .select('*')
    .eq('user_id', userId);
```

#### UI State Issues

**Problem**: Company UI settings not applying correctly
**Solutions**:

1. Reset UI state:

```javascript
await uiManager.resetState(companyId);
```

2. Clear UI cache:

```javascript
await uiManager.clearCache(companyId);
```

3. Reload company components:

```javascript
await uiManager.reloadComponents(companyId);
```

### 4. Performance Issues

#### Slow Data Loading

**Problem**: Company data loading slowly
**Solutions**:

1. Implement cache warming:

```javascript
async function warmCache(companyId) {
    await Promise.all([
        cacheManager.prewarm('settings', companyId),
        cacheManager.prewarm('ui-state', companyId),
        cacheManager.prewarm('roles', companyId)
    ]);
}
```

2. Optimize cache key structure:

```javascript
// Use compound keys for better organization
const cacheKey = `${companyId}:${dataType}:${subType}`;
```

3. Monitor cache performance:

```javascript
class CacheMonitor {
    logCacheHit(key) {
        // Log cache hit for monitoring
    }
    
    logCacheMiss(key) {
        // Log cache miss for monitoring
    }
    
    getHitRate() {
        // Calculate and return cache hit rate
    }
}
```

### 5. Debugging Tools

#### Cache Inspection

```javascript
class CacheDebugger {
    static inspectCache(cacheManager, companyId) {
        console.log('Cache entries for company:', companyId);
        for (const [key, value] of cacheManager.cache.entries()) {
            if (key.startsWith(`${companyId}:`)) {
                console.log({
                    key,
                    age: Date.now() - value.timestamp,
                    path: value.path,
                    size: JSON.stringify(value.data).length
                });
            }
        }
    }
    
    static analyzePathDependencies(cacheManager) {
        console.log('Path dependencies:');
        for (const [path, keys] of cacheManager.pathMap.entries()) {
            console.log({
                path,
                dependentKeys: Array.from(keys),
                keyCount: keys.size
            });
        }
    }
}
```

#### Path Resolution Debugging

```javascript
class PathDebugger {
    static tracePathResolution(pathResolver, relativePath) {
        console.log('Path resolution trace:');
        console.log({
            input: relativePath,
            normalized: pathResolver.normalizePath(relativePath),
            resolved: pathResolver.resolvePath(relativePath),
            cacheHit: pathResolver.pathCache.has(`path:${relativePath}`)
        });
    }
}
```

## Best Practices

1. **Regular Maintenance**
   - Implement periodic cache cleanup
   - Monitor cache hit rates
   - Review path resolution patterns
   - Validate cache invalidation rules

2. **Error Prevention**
   - Use try-catch blocks around cache operations
   - Implement fallback mechanisms
   - Validate paths before caching
   - Monitor cache size and memory usage

3. **Performance Optimization**
   - Implement strategic cache warming
   - Use appropriate cache durations
   - Monitor and adjust cache sizes
   - Optimize path resolution

## Related Documentation

- [Company Management Overview](0600_COMPANY_MANAGEMENT.md)
- [Implementation Details](0601_COMPANY_IMPLEMENTATION.md)
- [Integration Guide](0603_COMPANY_INTEGRATION.md)
